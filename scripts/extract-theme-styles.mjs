/**
 * One-time CSS migration, with an explicit archived-source regeneration path.
 * Usage: node scripts/extract-theme-styles.mjs [--regenerate] [--additions file.css]
 * This writes source files; it is not a test or a validation command.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = path.join(project, 'docs/theme-archive');
const themeDirectory = path.join(project, 'src/themes');
const args = process.argv.slice(2);
const regenerate = args.includes('--regenerate');
const additionsIndex = args.indexOf('--additions');
let additionsPath = additionsIndex >= 0 ? path.resolve(args[additionsIndex + 1] || '') : null;
if (additionsIndex >= 0 && !args[additionsIndex + 1]) throw new Error('--additions requires a CSS file path.');
const inputNames = ['AppCombined', 'App'];
const originalsToArchive = [];
const exists = async (file) => fs.access(file).then(() => true, () => false);
const relative = (file) => path.relative(project, file).split(path.sep).join('/');
const cssReferences = (value) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);

// Whole shorthand families travel together. Spacing, positioning, sizing,
// interaction, and motion declarations stay in the structural stylesheet.
function isAppearanceProperty(property) {
  const name = property.toLowerCase().replace(/^-(webkit|moz|ms|o)-/, '');
  return /^(background(?:-|$)|border(?:-|$)|outline(?:-|$)|font(?:-|$)|text-decoration(?:-|$)|text-emphasis(?:-|$)|text-stroke(?:-|$)|mask(?:-|$)|list-style(?:-|$)|stroke(?:-|$)|fill(?:-|$)|corner(?:-|$))/.test(name)
    || new Set([
      'color', 'accent-color', 'caret-color', 'color-scheme', 'color-interpolation',
      'color-interpolation-filters', 'color-rendering', 'print-color-adjust',
      'box-shadow', 'text-shadow', 'text-fill-color', 'text-transform',
      'font-smoothing', 'line-height', 'letter-spacing', 'word-spacing',
      'text-rendering', 'opacity', 'filter', 'backdrop-filter', 'mix-blend-mode',
      'appearance', 'clip-path', 'paint-order', 'stop-color', 'stop-opacity',
      'flood-color', 'flood-opacity', 'lighting-color', 'scrollbar-color',
      'box-reflect',
    ]).has(name);
}

const appearanceVariableName = (name) => /(?:^--(?:palette|theme)-|(?:^|-)(?:color|bg|background|shadow|radius|font|opacity|stroke|fill|accent|gradient|border|corner|blur|filter|glow|text)(?:-|$))/.test(name);
const appearanceVariableValue = (value) => /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|(?:repeating-)?(?:linear|radial|conic)-gradient)\s*\(|\b(?:transparent|currentcolor|black|white)\b/i.test(value);
const keyframesName = (node) => node.type === 'atrule' && /^(?:-\w+-)?keyframes$/i.test(node.name) ? node.params : null;
const rootThemePattern = /:root\s*\[data-theme\s*=\s*(['"])([^'"]+)\1\s*\]/g;

function selectorThemeIds(selector) {
  return [...selector.matchAll(rootThemePattern)].map((match) => match[2]);
}

function specializeSelector(selector, themeId) {
  const selectors = postcss.list.comma(selector);
  return selectors.filter((entry) => {
    const ids = selectorThemeIds(entry);
    return ids.length === 0 || ids.every((id) => id === themeId);
  }).join(', ');
}

async function collectJavaScriptReferences(directory, mentions, dynamicFiles) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'themes'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectJavaScriptReferences(file, mentions, dynamicFiles);
    else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      const source = await fs.readFile(file, 'utf8');
      for (const match of source.matchAll(/--[a-zA-Z_][\w-]*/g)) {
        if (!mentions.has(match[0])) mentions.set(match[0], new Set());
        mentions.get(match[0]).add(relative(file));
      }
      if (/setProperty\s*\(|getPropertyValue\s*\(|--\$\{/.test(source)) dynamicFiles.add(relative(file));
    }
  }
}

await fs.mkdir(archive, { recursive: true });
const sources = [];
for (const name of inputNames) {
  const original = path.join(project, `src/${name}.css`);
  const saved = path.join(archive, `${name}.before-theme-split.css`);
  if (regenerate) {
    if (!(await exists(saved))) throw new Error(`Missing preserved migration input: ${relative(saved)}`);
  } else {
    if (await exists(saved)) throw new Error('Original CSS is already archived. Use --regenerate explicitly to rebuild from it.');
    // Defer renaming until every output is prepared successfully.
    originalsToArchive.push({ original, saved });
  }
  sources.push({ file: saved, text: await fs.readFile(regenerate ? saved : original, 'utf8') });
}
const savedAdditions = path.join(archive, 'ThemeStudio.additions.css');
if (!additionsPath && await exists(savedAdditions)) additionsPath = savedAdditions;
if (additionsPath) sources.push({ file: additionsPath, text: await fs.readFile(additionsPath, 'utf8') });

const combined = postcss.root();
for (const source of sources) {
  combined.append(postcss.comment({ text: `Source: ${relative(source.file)}` }));
  combined.append(postcss.parse(source.text, { from: source.file }).nodes);
}
combined.walkDecls('all', (declaration) => {
  throw new Error(`The all shorthand resets both appearance and structure at ${declaration.source.input.file}:${declaration.source.start.line}; expand it before extracting to preserve cross-stream cascade order.`);
});

// Only an identical earlier declaration in the very same block is discarded.
// Different values, distinct role names, and repeated selector blocks survive.
const duplicateRemovals = [];
combined.walk((container) => {
  if (!container.nodes || container.type === 'root') return;
  const seen = new Set();
  for (const declaration of [...container.nodes].reverse()) {
    if (declaration.type !== 'decl') continue;
    const key = `${declaration.prop}\u0000${declaration.value}\u0000${Boolean(declaration.important)}`;
    if (seen.has(key)) {
      duplicateRemovals.push({ property: declaration.prop, selector: container.selector || `@${container.name} ${container.params}`, source: relative(declaration.source.input.file), line: declaration.source.start.line });
      declaration.remove();
    } else seen.add(key);
  }
});

const definitions = new Map();
const appearanceVariables = new Set();
const structuralVariables = new Set();
const allCssReferences = new Set();
const discoveredThemeIds = new Set();
const appearanceKeyframeNames = new Set();
combined.walkRules((rule) => selectorThemeIds(rule.selector).forEach((id) => discoveredThemeIds.add(id)));
combined.walkDecls((declaration) => {
  const references = cssReferences(declaration.value);
  references.forEach((name) => allCssReferences.add(name));
  if (declaration.prop.startsWith('--')) {
    if (!definitions.has(declaration.prop)) definitions.set(declaration.prop, []);
    definitions.get(declaration.prop).push(declaration);
  } else {
    const destination = isAppearanceProperty(declaration.prop) ? appearanceVariables : structuralVariables;
    references.forEach((name) => destination.add(name));
  }
});

function includeDependencies(destination) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...destination]) {
      for (const declaration of definitions.get(name) || []) {
        for (const dependency of cssReferences(declaration.value)) {
          if (!destination.has(dependency)) { destination.add(dependency); changed = true; }
        }
      }
    }
  }
}
includeDependencies(appearanceVariables);
includeDependencies(structuralVariables);
for (const name of definitions.keys()) {
  // Retain unused appearance tokens for existing saved themes and runtime writers.
  // A variable with exclusively structural consumers keeps its structural home.
  if (!structuralVariables.has(name) && (appearanceVariableName(name) || definitions.get(name).some((declaration) => appearanceVariableValue(declaration.value)))) appearanceVariables.add(name);
}
includeDependencies(appearanceVariables);

combined.walkAtRules((atRule) => {
  const name = keyframesName(atRule);
  if (!name) return;
  atRule.walkDecls((declaration) => {
    if (isAppearanceProperty(declaration.prop) || appearanceVariables.has(declaration.prop)) appearanceKeyframeNames.add(name);
  });
});

function splitNode(node, destination, themeId) {
  if (node.type === 'decl') {
    const appearance = node.prop.startsWith('--') ? appearanceVariables.has(node.prop) : isAppearanceProperty(node.prop);
    return appearance === (destination === 'appearance') ? node.clone() : null;
  }
  if (node.type === 'comment') return node.clone();
  const animationName = keyframesName(node);
  if (animationName) {
    // @keyframes of the same name replace one another; they never merge.
    return appearanceKeyframeNames.has(animationName) === (destination === 'appearance') ? node.clone() : null;
  }
  if (node.type === 'atrule' && ['font-face', 'font-feature-values', 'font-palette-values', 'counter-style'].includes(node.name.toLowerCase())) {
    return destination === 'appearance' ? node.clone() : null;
  }
  if (node.type === 'atrule' && node.name.toLowerCase() === 'property') {
    return appearanceVariables.has(node.params) === (destination === 'appearance') ? node.clone() : null;
  }
  if (!node.nodes) return node.clone();
  const result = node.clone({ nodes: [] });
  if (node.type === 'rule' && destination === 'appearance') {
    result.selector = specializeSelector(node.selector, themeId);
    if (!result.selector) return null;
  }
  for (const child of node.nodes) {
    const selected = splitNode(child, destination, themeId);
    if (selected) result.append(selected);
  }
  if (result.nodes.every((child) => child.type === 'comment')) return null;
  return result;
}

const jsMentions = new Map();
const dynamicFiles = new Set();
for (const directory of ['src', 'electron']) await collectJavaScriptReferences(path.join(project, directory), jsMentions, dynamicFiles);
const unreferenced = [...definitions.keys()].filter((name) => !allCssReferences.has(name) && !jsMentions.has(name)).sort();
const retiredNames = new Set(unreferenced);
const retiredDefinitions = {};
for (const name of unreferenced) {
  retiredDefinitions[name] = definitions.get(name).map((declaration) => {
    const parents = [];
    let css = declaration.clone();
    for (let parent = declaration.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      parents.unshift(parent);
      css = parent.clone({ nodes: [css] });
    }
    const record = {
      property: name,
      value: declaration.value,
      important: Boolean(declaration.important),
      selector: declaration.parent.selector || '',
      conditions: parents.filter((parent) => parent.type === 'atrule').map((parent) => ({ name: parent.name, params: parent.params })),
      themeContexts: parents.filter((parent) => parent.type === 'rule').flatMap((parent) => selectorThemeIds(parent.selector)),
      cssText: css.toString(),
      source: { file: relative(declaration.source.input.file), line: declaration.source.start.line },
    };
    declaration.remove();
    return record;
  });
}

const { BUILT_IN_THEMES } = await import(path.join(project, 'src/theme/builtInThemes.js'));
const builtInIds = BUILT_IN_THEMES.map((theme) => theme.id);
const legacyIds = [...discoveredThemeIds].filter((id) => !builtInIds.includes(id)).sort();
const themeIds = [...builtInIds, ...legacyIds];
const structural = splitNode(combined, 'structural');
const outputs = new Map();
outputs.set(path.join(themeDirectory, 'retiredThemeVariables.json'), `${JSON.stringify({ version: 1, variables: retiredDefinitions }, null, 2)}\n`);
outputs.set(path.join(project, 'src/AppCombined.css'), `/* briizOS structure: layout, sizing, interaction, and motion.\n * Appearance lives in one complete src/themes/AppCombined-THEMEVALUES-<id>.css file.\n * Source originals are preserved in docs/theme-archive/.\n */\n${structural.toString()}\n`);
outputs.set(path.join(project, 'src/App.css'), '/* Compatibility entry. Its former late declarations are now merged, in order,\n * into AppCombined.css and every complete appearance stylesheet in src/themes/.\n * Add structural rules to AppCombined.css; edit appearance in the active theme file.\n */\n');
const themeStats = [];
for (const id of themeIds) {
  const appearance = splitNode(combined, 'appearance', id);
  const text = `/* briizOS theme-context: ${id} */\n/* Complete appearance stylesheet. Activate with document.documentElement.dataset.theme = "${id}".\n * Selectors retain their original specificity; all other app themes are excluded.\n * Edit this file directly with Chromap or import/export it through Theme Studio.\n * Layout and interaction remain in ../AppCombined.css.\n */\n${appearance.toString()}\n`;
  outputs.set(path.join(themeDirectory, `AppCombined-THEMEVALUES-${id}.css`), text);
  let declarationCount = 0;
  appearance.walkDecls(() => { declarationCount += 1; });
  themeStats.push({ id, bytes: Buffer.byteLength(text), declarations: declarationCount });
}
const filenames = Object.fromEntries(themeIds.map((id) => [id, `AppCombined-THEMEVALUES-${id}.css`]));
outputs.set(path.join(themeDirectory, 'themeFiles.js'), `// Complete editable CSS files, loaded as text without automatically activating every theme.\nconst sources = import.meta.glob('./AppCombined-THEMEVALUES-*.css', { query: '?raw', import: 'default', eager: true });\n\nexport const BUILT_IN_THEME_FILES = Object.freeze(${JSON.stringify(filenames, null, 2)});\n\nexport function getBuiltInThemeFile(id = 'default') {\n  return Object.hasOwn(BUILT_IN_THEME_FILES, id) ? BUILT_IN_THEME_FILES[id] : BUILT_IN_THEME_FILES.default;\n}\n\nexport function getBuiltInThemeCss(id = 'default') {\n  return sources[\`./\${getBuiltInThemeFile(id)}\`] || sources['./AppCombined-THEMEVALUES-default.css'] || '';\n}\n`);

const runtimeOnly = [...definitions.keys()].filter((name) => !allCssReferences.has(name) && jsMentions.has(name)).sort();
const mixed = [...appearanceVariables].filter((name) => structuralVariables.has(name) && definitions.has(name)).sort();
const preservedStructural = [...definitions.keys()].filter((name) => !retiredNames.has(name) && !appearanceVariables.has(name)).sort();
const table = (rows) => rows.length ? rows.join('\n') : '| None |';
const report = `# Theme stylesheet extraction\n\nThe original files were renamed to \`docs/theme-archive/AppCombined.before-theme-split.css\` and \`docs/theme-archive/App.before-theme-split.css\`. The late App.css declarations follow AppCombined declarations in both extracted streams. Every shipped appearance file contains its own complete common appearance and selected theme declarations; no appearance file imports or derives from another theme file.\n\n## Runtime and Chromap contract\n\nLoad structural \`src/AppCombined.css\` once. Install exactly one complete appearance stylesheet after it, before user overrides. Set the root \`data-theme\` to that file's context ID, including for a saved/custom copy, and retain \`/* briizOS theme-context: <id> */\` on export/import. A custom copy needs this context ID to activate its own selectors; it needs no other theme stylesheet. \`getBuiltInThemeCss(id)\` returns raw CSS and \`getBuiltInThemeFile(id)\` returns its filename, with a default fallback. IDs absent from the visible registry but present in original CSS are preserved: ${legacyIds.map((id) => `\`${id}\``).join(', ') || 'none'}.\n\nRoot \`:root[data-theme="..."]\` selectors remain byte-for-byte unchanged except filtering comma-separated branches for other app themes. This preserves the original specificity, inheritance, cascade order, conditional wrappers, and theme-dependent structural variables. Non-root theme attributes, including Forest's \`.forest-shell[data-theme="dim"]\`, remain independent and are included in every appearance file. Custom-theme selectors remain conditional on \`data-custom-theme\`.\n\nAppearance includes literal values and custom properties consumed by appearance, with transitive variable dependencies. Mixed variables live in the appearance file because the structural sheet can consume the active theme's values. Variables used exclusively by geometry, spacing, interaction, or motion retain their original structural declarations and root theme gates. Runtime-only appearance tokens are retained. Unused names with no CSS or literal JavaScript/TypeScript consumers are retired from active stylesheets, with exact source definitions preserved in src/themes/retiredThemeVariables.json for explicit legacy-reference rescue. Semantic role names are never merged merely because their current values coincide.\n\nShorthand families (background, border, outline, font, mask, and list-style) are kept together. Motion-only keyframes remain structural. If any definition of a keyframe name animates appearance, every definition of that name moves whole to each appearance file, including its geometry declarations; two partial keyframes would not merge and would break existing animations. Existing last-definition behavior is preserved. The affected names are ${[...appearanceKeyframeNames].sort().map((name) => `\`${name}\``).join(', ')}.\n\nTypography and border widths retain their original values, although editing them later can intentionally change density. The migration does not increase spacing, dimensions, or control sizes. Remote/data image URLs remain unchanged.\n\n## Counts\n\n- ${definitions.size - unreferenced.length} custom-property names retained from ${definitions.size} original names.\n- ${[...definitions.keys()].filter((name) => !retiredNames.has(name) && appearanceVariables.has(name)).length} names belong to appearance; ${preservedStructural.length} remain structural.\n- ${mixed.length} names have both appearance and structural consumers.\n- ${duplicateRemovals.length} exact duplicate declarations removed within their original blocks only. Different values and repeated selector blocks are retained.\n- ${unreferenced.length} unused names with no CSS var() reference and no literal JavaScript/TypeScript reference under src/ or electron/ are removed from active stylesheets. Their exact selector/context definitions are retained in retiredThemeVariables.json and the untouched source archives.\n- ${runtimeOnly.length} names with no CSS var() reference are explicitly mentioned in JavaScript/TypeScript and preserved.\n\n| Complete appearance file context | Declarations | Bytes |\n| --- | ---: | ---: |\n${themeStats.map((stat) => `| ${stat.id} | ${stat.declarations} | ${stat.bytes} |`).join('\n')}\n\n## Mixed variables\n\n${mixed.map((name) => `- \`${name}\``).join('\n') || 'None.'}\n\n## Structural variables\n\n${preservedStructural.map((name) => `- \`${name}\``).join('\n') || 'None.'}\n\n## Retired unused names\n\nThe existing version 1 saved-theme schema restricts user variables to its curated registry. These names have no CSS var() consumers and no literal JavaScript/TypeScript references. Removing them is limited to the active generated stylesheets. Legacy import can inspect explicit var() references and restore the matching exact definitions from retiredThemeVariables.json, which records value, importance, selector, conditional ancestry, theme contexts, source location, and ready-to-append CSS. No equal-valued semantic role names are merged.\n\n| Variable | Original definition |\n| --- | --- |\n${table(unreferenced.map((name) => { const declaration = definitions.get(name)[0]; return `| \`${name}\` | ${relative(declaration.source.input.file)}:${declaration.source.start.line} |`; }))}\n\n## Runtime-only names, retained\n\n| Variable | Code references |\n| --- | --- |\n${table(runtimeOnly.map((name) => `| \`${name}\` | ${[...jsMentions.get(name)].join(', ')} |`))}\n\n## Proven duplicate declarations removed\n\n| Property | Selector/context | Original source |\n| --- | --- | --- |\n${table(duplicateRemovals.map((item) => `| \`${item.property}\` | \`${item.selector.replace(/\|/g, '\\|')}\` | ${item.source}:${item.line} |`))}\n\n## Regenerating the migration\n\nDirect edits to the appearance files are the normal authoring workflow. The migration script is for explicitly rebuilding from preserved original inputs: \`node scripts/extract-theme-styles.mjs --regenerate\`. Add \`--additions /absolute/path/to/additions.css\` to append new shared declarations after the archived App.css content. Regeneration renames all replaced generated outputs into a dated directory under docs/theme-archive before writing replacements, so direct theme edits remain recoverable.\n\nNo build, test, lint, server, or visual verification was run by this migration. The report is generated from the same AST transform that writes the implementation.\n`;
outputs.set(path.join(project, 'docs/theme-extraction.md'), report);

await fs.mkdir(themeDirectory, { recursive: true });
for (const { original, saved } of originalsToArchive) await fs.rename(original, saved);
if (regenerate) {
  const previous = path.join(archive, `generated-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  for (const file of outputs.keys()) {
    if (!(await exists(file))) continue;
    const saved = path.join(previous, relative(file));
    await fs.mkdir(path.dirname(saved), { recursive: true });
    await fs.rename(file, saved);
  }
}
for (const [file, content] of outputs) await fs.writeFile(file, content, 'utf8');
process.stdout.write(`Extracted structure and ${themeIds.length} complete appearance files. Preserved ${definitions.size - unreferenced.length} variable names; retired ${unreferenced.length} recoverable unused names and removed ${duplicateRemovals.length} identical declarations. Report: docs/theme-extraction.md\n`);
