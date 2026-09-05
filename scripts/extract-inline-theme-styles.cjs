/* One-time targeted migration of literal React appearance values into theme CSS.
 * Run before extract-theme-styles.mjs with the same additions file.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');

const root = path.resolve(__dirname, '..');
const additions = process.argv[2];
if (!additions) throw new Error('Pass the CSS additions file to extend.');
const files = [
  'src/components/overlays/DashboardOverlay.jsx', 'src/components/InteractionPanel.jsx',
  'src/components/ErrorBoundary.jsx', 'src/components/journals/richtext.jsx',
  'src/components/canvases/CanvasSurface.jsx',
];
const appearance = /^(?:color|background(?:Color|Image|Position|Size|Repeat|Clip|Origin|Attachment)?|border(?:Color|Width|Style|Radius|Top|Right|Bottom|Left)?|boxShadow|textShadow|font(?:Family|Size|Style|Weight|Variant)?|lineHeight|letterSpacing|wordSpacing|textDecoration|textTransform|opacity|cornerShape|outline(?:Color|Width|Style|Offset)?|filter|backdropFilter|fill|stroke)$/;
const unitless = new Set(['fontWeight', 'lineHeight', 'opacity', 'fillOpacity', 'strokeOpacity']);
let moved = 0;
let blocks = 0;
const css = [];

for (const file of files) {
  const filename = path.join(root, file);
  const source = fs.readFileSync(filename, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const edits = [];
  const labels = new Map();
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name)) {
      const style = node.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'style');
      const object = style?.value?.expression;
      const hasLabel = node.attributes.some((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'data-theme-inline');
      if (object?.type === 'ObjectExpression' && !hasLabel && !object.properties.some((property) => property.type !== 'ObjectProperty' || property.computed)) {
        const keys = object.properties.map((property) => property.key.name || property.key.value);
        const selected = object.properties.filter((property) => {
          const key = property.key.name || property.key.value;
          return appearance.test(key) && keys.filter((candidate) => candidate === key).length === 1 && ['StringLiteral', 'NumericLiteral'].includes(property.value.type);
        });
        if (selected.length) {
          const prefix = path.basename(file, '.jsx').replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`);
          const classAttribute = node.attributes.find((attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'className');
          const hint = classAttribute?.value?.type === 'StringLiteral' ? classAttribute.value.value.split(/\s+/)[0] : node.name.name;
          const base = `${prefix}-${hint}`.replace(/[^a-zA-Z0-9_-]/g, '-');
          const number = (labels.get(base) || 0) + 1;
          labels.set(base, number);
          const label = `${base}-${number}`;
          const remaining = object.properties.filter((property) => !selected.includes(property));
          const replacement = `data-theme-inline="${label}"${remaining.length ? ` style={{ ${remaining.map((property) => source.slice(property.start, property.end)).join(', ')} }}` : ''}`;
          edits.push({ start: style.start, end: style.end, text: replacement });
          const declarations = selected.map((property) => {
            const key = property.key.name || property.key.value;
            const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            const raw = property.value.value;
            const value = typeof raw === 'number' && raw !== 0 && !unitless.has(key) ? `${raw}px` : String(raw);
            return `  ${cssName}: ${value};`;
          });
          // Retain the former inline declaration's precedence over existing normal
          // selectors; stylesheet !important rules still win, as they did before.
          css.push(`/* Former inline appearance: ${file}:${node.loc.start.line} */\n:is(#briizos-inline-origin#briizos-inline-origin#briizos-inline-origin, [data-theme-inline="${label}"]) {\n${declarations.join('\n')}\n}`);
          moved += selected.length;
          blocks++;
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
  if (edits.length) fs.writeFileSync(filename, next);
}
if (css.length) fs.appendFileSync(additions, `\n\n/* Literal app appearance moved out of React style objects. */\n${css.join('\n\n')}\n`);
process.stdout.write(`Moved ${moved} literal or variable appearance declarations into ${blocks} theme rules.\n`);
