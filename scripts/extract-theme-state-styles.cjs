/* Move literal conditional appearance into CSS while keeping its state logic. */
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '..');
const output = process.argv[2];
if (!output) throw new Error('Pass the CSS additions file.');
const files = ['src/components/InteractionPanel.jsx', 'src/components/overlays/DashboardOverlay.jsx', 'src/components/FileTree.jsx', 'src/components/SourcesPanel.jsx'];
const properties = new Set(['color', 'background', 'backgroundColor', 'borderLeft', 'opacity']);
const css = [];
let count = 0;
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const edits = [];
  let serial = 0;
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name)) {
      const attribute = node.attributes.find((item) => item.type === 'JSXAttribute' && item.name.name === 'style');
      const style = attribute?.value?.expression;
      if (style?.type === 'ObjectExpression' && style.properties.every((property) => property.type === 'ObjectProperty' && !property.computed)) {
        const existing = node.attributes.find((item) => item.type === 'JSXAttribute' && item.name.name === 'data-theme-inline');
        const label = existing?.value?.value || `${path.basename(file, '.jsx').toLowerCase()}-${node.name.name}-state-${++serial}`;
        const addedAttributes = [];
        const removed = [];
        for (const property of style.properties) {
          const key = property.key.name || property.key.value;
          if (!properties.has(key) || !['ConditionalExpression', 'TemplateLiteral'].includes(property.value.type)) continue;
          const values = [];
          const compile = (value, format = String) => {
            if (value.type === 'ConditionalExpression') return `(${source.slice(value.test.start, value.test.end)} ? ${compile(value.consequent, format)} : ${compile(value.alternate, format)})`;
            if (value.type === 'TemplateLiteral' && value.expressions.length === 1) return compile(value.expressions[0], (literal) => format(`${value.quasis[0].value.cooked}${literal}${value.quasis[1].value.cooked}`));
            if (!['StringLiteral', 'NumericLiteral'].includes(value.type)) throw new Error('Runtime content value');
            const literal = format(value.value);
            let index = values.indexOf(literal);
            if (index < 0) { index = values.length; values.push(literal); }
            return `'${index}'`;
          };
          let expression;
          try { expression = compile(property.value); } catch { continue; }
          const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
          const stateAttribute = `data-theme-state-${cssName}`;
          addedAttributes.push(`${stateAttribute}={${expression}}`);
          removed.push(property);
          values.forEach((value, index) => css.push(`:is(#briizos-inline-origin#briizos-inline-origin#briizos-inline-origin, [data-theme-inline="${label}"][${stateAttribute}="${index}"]) {\n  ${cssName}: ${value};\n}`));
          count++;
        }
        if (removed.length) {
          const retained = style.properties.filter((property) => !removed.includes(property));
          const replacement = `${existing ? '' : `data-theme-inline="${label}" `}${addedAttributes.join(' ')}${retained.length ? ` style={{ ${retained.map((property) => source.slice(property.start, property.end)).join(', ')} }}` : ''}`;
          edits.push({ start: attribute.start, end: attribute.end, text: replacement });
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(ast.program);
  let next = source;
  for (const edit of edits.sort((first, second) => second.start - first.start)) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  if (edits.length) fs.writeFileSync(path.join(root, file), next);
}
if (css.length) fs.appendFileSync(output, `\n/* App status and drag-state appearance, with the original state logic retained. */\n${css.join('\n\n')}\n`);
process.stdout.write(`Moved ${count} conditional appearance values into ${css.length} state rules.\n`);
