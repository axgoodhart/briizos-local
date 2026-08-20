const v = require('./local-data/validation');

const BUILT_IN_THEME_IDS = new Set([
  'default', 'antarctic-teafog', 'postlinear-glassos', 'neon-orbi', 'winterbloom',
  'mint-icecube', 'great-wave', 'sherbert-sakura', 'burnt-chestnut', 'verdigris',
  'space-glass', 'sunbrocksen', 'peppermint-foil', 'transparent', 'medieval-taurus', 'mistic',
]);
const CURATED_VARIABLES = new Set([
  '--layout-bg-primary', '--ui-body-bg', '--ui-app-bg', '--layout-bg-secondary', '--log-section-bg',
  '--layout-bg-panel', '--card-glass', '--ui-settings-input-bg', '--ui-modal-bg', '--palette-white',
  '--palette-text-main', '--ui-text-primary', '--chat-input-text-color', '--palette-text-soft',
  '--palette-text-subtle', '--palette-text-muted', '--palette-text-dim', '--palette-accent-primary',
  '--layout-accent-cyan', '--layout-accent-orange', '--palette-neon-accent', '--palette-accent-primary-soft',
  '--layout-accent-cyan-dim', '--palette-success', '--palette-warning', '--palette-danger',
  '--layout-border-color', '--glass-border', '--layout-border-color-hover', '--layout-accent-cyan-glow',
  '--theme-studio-glow-strength', '--theme-studio-shadow-depth', '--ui-font-main', '--theme-font-display',
  '--layout-panel-radius', '--ui-border-radius', '--ui-corner-shape', '--theme-corner-style', '--layout-gap',
  '--layout-header-height', '--layout-transition-fast', '--layout-transition-normal', '--theme-motion-reduced',
]);
const COLOR_PROPERTIES = ['color', 'background', 'borderColor', 'boxShadow', 'opacity'];
const TYPE_PROPERTIES = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing'];
const SHAPE_PROPERTIES = ['borderWidth', 'borderStyle', 'borderRadius', 'cornerShape'];
const TARGET_PROPERTIES = new Map(Object.entries({
  canvas: COLOR_PROPERTIES,
  header: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'minHeight'],
  wordmark: ['color', 'opacity', ...TYPE_PROPERTIES],
  'control-dock': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES],
  panel: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
  body: [...COLOR_PROPERTIES, ...TYPE_PROPERTIES, 'padding'],
  footer: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
  'resize-handle': ['color', 'background', 'opacity'],
  'button-primary': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  'button-secondary': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  'button-ghost': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  'button-icon': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
  'button-destructive': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  input: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  textarea: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  tabs: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
  tab: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  badge: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding'],
  progress: ['color', 'background', 'borderColor', 'borderRadius', 'opacity'],
  modal: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
  overlay: ['background', 'opacity'],
  'chat-canvas': [...COLOR_PROPERTIES, ...TYPE_PROPERTIES, 'padding'],
  message: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding'],
  composer: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'],
  'model-picker': [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES],
  card: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'],
}));
const TARGET_IDS = new Set(TARGET_PROPERTIES.keys());
const COMPONENT_IDS = new Set([
  'Application', 'ActionDeck', 'Tasks', 'Sources', 'Notes', 'Calendar', 'Organizer',
  'Dashboard', 'Media', 'Login', 'Canvas', 'Briiztorm', 'Chat', 'Journals', 'Notefalls', 'Forest',
]);
const PROPERTIES = new Set([
  'color', 'background', 'borderColor', 'borderWidth', 'borderStyle', 'borderRadius', 'cornerShape',
  'boxShadow', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'padding', 'minHeight',
]);
const UNSAFE_CSS = /url\s*\(|javascript\s*:|expression\s*\(|<\/?script|@import|behavior\s*:/i;
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+(?:deg|rad|turn)?\)|oklch\([\d\s.%+/-]+(?:deg|rad|turn)?\)|transparent|currentColor|[a-z]+)$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const GENERATOR_KEYS = [
  'mode', 'primaryAnchor', 'secondaryAnchor', 'harmony', 'temperature',
  'saturation', 'contrast', 'glowStrength', 'material', 'seed',
];

function safeCssString(value, label, max = 1000) {
  value = v.string(value, label, { required: true, max });
  if (UNSAFE_CSS.test(value) || /[{};]/.test(value)) v.fail('INVALID_INPUT', `${label} contains unsafe CSS`);
  return value;
}

function color(value, label) {
  value = safeCssString(value, label, 160);
  if (!COLOR_VALUE.test(value)) v.fail('INVALID_INPUT', `${label} must be a color`);
  return value;
}

function generatorSettings(input, label) {
  v.object(input, label, GENERATOR_KEYS);
  if (input.mode !== undefined) v.oneOf(input.mode, `${label}.mode`, ['dark', 'light']);
  if (input.primaryAnchor !== undefined && !HEX_COLOR.test(v.string(input.primaryAnchor, `${label}.primaryAnchor`, { required: true, max: 7 }))) {
    v.fail('INVALID_INPUT', `${label}.primaryAnchor must be a six-digit hex color`);
  }
  if (input.secondaryAnchor !== undefined && input.secondaryAnchor !== '' && !HEX_COLOR.test(v.string(input.secondaryAnchor, `${label}.secondaryAnchor`, { required: true, max: 7 }))) {
    v.fail('INVALID_INPUT', `${label}.secondaryAnchor must be empty or a six-digit hex color`);
  }
  [['temperature', -100, 100], ['saturation', 0, 100], ['contrast', 0, 100], ['glowStrength', 0, 60]].forEach(([key, min, max]) => {
    if (input[key] !== undefined) v.number(input[key], `${label}.${key}`, { min, max });
  });
  if (input.harmony !== undefined) v.oneOf(input.harmony, `${label}.harmony`, ['analogous', 'complementary', 'split-complementary', 'triadic']);
  if (input.material !== undefined) v.oneOf(input.material, `${label}.material`, ['inherit', 'flat', 'layered', 'glass']);
  if (input.seed !== undefined) v.integer(input.seed, `${label}.seed`, { min: 1, max: 2147483647 });
  return { ...input };
}

function structuredStyle(input, property, label) {
  if (property === 'color' || property === 'borderColor') {
    v.object(input, label, ['kind', 'value']);
    if (input.kind !== 'color') v.fail('INVALID_INPUT', `${label}.kind must be color`);
    return { kind: 'color', value: color(input.value, `${label}.value`) };
  }
  if (property === 'background') {
    if (input?.kind === 'solid') {
      v.object(input, label, ['kind', 'color']);
      return { kind: 'solid', color: color(input.color, `${label}.color`) };
    }
    v.object(input, label, ['kind', 'angle', 'stops']);
    if (input.kind !== 'linear-gradient') v.fail('INVALID_INPUT', `${label}.kind is invalid`);
    if (!Array.isArray(input.stops) || input.stops.length < 2 || input.stops.length > 3) v.fail('INVALID_INPUT', `${label}.stops must contain 2–3 stops`);
    return {
      kind: 'linear-gradient',
      angle: v.number(input.angle, `${label}.angle`, { min: 0, max: 360 }),
      stops: input.stops.map((stop, index) => {
        v.object(stop, `${label}.stops[${index}]`, ['color', 'position']);
        return { color: color(stop.color, `${label}.stops[${index}].color`), position: v.number(stop.position, `${label}.stops[${index}].position`, { min: 0, max: 100 }) };
      }),
    };
  }
  if (property === 'boxShadow') {
    v.object(input, label, ['kind', 'color', 'x', 'y', 'blur', 'spread', 'intensity']);
    if (input.kind !== 'shadow') v.fail('INVALID_INPUT', `${label}.kind must be shadow`);
    return {
      kind: 'shadow', color: color(input.color, `${label}.color`),
      x: v.number(input.x, `${label}.x`, { min: -100, max: 200 }),
      y: v.number(input.y, `${label}.y`, { min: -100, max: 200 }),
      blur: v.number(input.blur, `${label}.blur`, { min: 0, max: 200 }),
      spread: v.number(input.spread, `${label}.spread`, { min: -100, max: 200 }),
      intensity: v.number(input.intensity, `${label}.intensity`, { min: 0, max: 1 }),
    };
  }
  if (property === 'opacity' || property === 'fontWeight') {
    v.object(input, label, ['kind', 'value']);
    if (input.kind !== 'number') v.fail('INVALID_INPUT', `${label}.kind must be number`);
    const bounds = property === 'opacity' ? { min: 0, max: 1 } : { min: 100, max: 900 };
    return { kind: 'number', value: v.number(input.value, `${label}.value`, bounds) };
  }
  if (['borderWidth', 'borderRadius', 'fontSize', 'letterSpacing', 'padding', 'minHeight'].includes(property)) {
    v.object(input, label, ['kind', 'value', 'unit']);
    if (input.kind !== 'length') v.fail('INVALID_INPUT', `${label}.kind must be length`);
    return { kind: 'length', value: v.number(input.value, `${label}.value`, { min: 0, max: 240 }), unit: v.oneOf(input.unit, `${label}.unit`, ['px', 'rem', 'em']) };
  }
  if (property === 'borderStyle') {
    v.object(input, label, ['kind', 'value']);
    if (input.kind !== 'keyword') v.fail('INVALID_INPUT', `${label}.kind must be keyword`);
    return { kind: 'keyword', value: v.oneOf(input.value, `${label}.value`, ['solid', 'dashed', 'dotted', 'double', 'none']) };
  }
  if (property === 'cornerShape') {
    v.object(input, label, ['kind', 'value']);
    if (input.kind !== 'keyword') v.fail('INVALID_INPUT', `${label}.kind must be keyword`);
    return { kind: 'keyword', value: v.oneOf(input.value, `${label}.value`, ['round', 'squircle', 'bevel', 'scoop', 'notch', 'square']) };
  }
  if (property === 'fontFamily') {
    v.object(input, label, ['kind', 'value']);
    if (input.kind !== 'font') v.fail('INVALID_INPUT', `${label}.kind must be font`);
    return { kind: 'font', value: safeCssString(input.value, `${label}.value`, 240) };
  }
  v.fail('INVALID_INPUT', `${property} is not editable`);
}

function validateThemeDocument(input, label = 'theme') {
  v.object(input, label, ['schemaVersion', 'id', 'name', 'baseThemeId', 'mode', 'createdAt', 'updatedAt', 'generator', 'variables', 'overrides']);
  if (input.schemaVersion !== 1) v.fail('INVALID_INPUT', `${label}.schemaVersion must be 1`);
  const themeId = v.identifier(input.id, `${label}.id`);
  const name = v.string(input.name, `${label}.name`, { required: true, max: 80 });
  const baseThemeId = v.identifier(input.baseThemeId, `${label}.baseThemeId`);
  if (!BUILT_IN_THEME_IDS.has(baseThemeId)) v.fail('INVALID_INPUT', `${label}.baseThemeId does not exist`);
  const mode = v.oneOf(input.mode, `${label}.mode`, ['dark', 'light']);
  const createdAt = v.integer(input.createdAt, `${label}.createdAt`, { min: 0 });
  const updatedAt = v.integer(input.updatedAt, `${label}.updatedAt`, { min: 0 });
  let generator = null;
  if (input.generator != null) {
    if (!input.generator || typeof input.generator !== 'object' || Array.isArray(input.generator)) v.fail('INVALID_INPUT', `${label}.generator must be an object or null`);
    const json = JSON.stringify(input.generator);
    if (json.length > 10000 || UNSAFE_CSS.test(json)) v.fail('INVALID_INPUT', `${label}.generator is unsafe or too large`);
    generator = generatorSettings(input.generator, `${label}.generator`);
  }
  if (!input.variables || typeof input.variables !== 'object' || Array.isArray(input.variables)) v.fail('INVALID_INPUT', `${label}.variables must be an object`);
  if (Object.keys(input.variables).length > 512) v.fail('INVALID_INPUT', `${label}.variables has too many entries`);
  const variables = {};
  Object.entries(input.variables).forEach(([key, value]) => {
    if (!CURATED_VARIABLES.has(key)) v.fail('INVALID_INPUT', `${label}.variables contains unknown variable ${key}`);
    variables[key] = safeCssString(value, `${label}.variables.${key}`);
  });
  if (!Array.isArray(input.overrides) || input.overrides.length > 256) v.fail('INVALID_INPUT', `${label}.overrides must be a list with at most 256 items`);
  const overrides = input.overrides.map((override, index) => {
    const itemLabel = `${label}.overrides[${index}]`;
    v.object(override, itemLabel, ['id', 'targetId', 'scope', 'componentId', 'instanceId', 'styles']);
    const targetId = v.identifier(override.targetId, `${itemLabel}.targetId`);
    if (!TARGET_IDS.has(targetId)) v.fail('INVALID_INPUT', `${itemLabel}.targetId is unknown`);
    const scope = v.oneOf(override.scope, `${itemLabel}.scope`, ['role', 'component', 'instance']);
    let componentId;
    let instanceId;
    if (scope === 'component') {
      componentId = v.string(override.componentId, `${itemLabel}.componentId`, { required: true, max: 80 });
      if (!COMPONENT_IDS.has(componentId)) v.fail('INVALID_INPUT', `${itemLabel}.componentId is unknown`);
    }
    if (scope === 'instance') instanceId = v.identifier(override.instanceId, `${itemLabel}.instanceId`);
    if (!override.styles || typeof override.styles !== 'object' || Array.isArray(override.styles)) v.fail('INVALID_INPUT', `${itemLabel}.styles must be an object`);
    const styles = {};
    Object.entries(override.styles).forEach(([property, value]) => {
      if (!PROPERTIES.has(property)) v.fail('INVALID_INPUT', `${itemLabel}.styles.${property} is not editable`);
      if (!TARGET_PROPERTIES.get(targetId).includes(property)) v.fail('INVALID_INPUT', `${itemLabel}.styles.${property} is not editable for ${targetId}`);
      styles[property] = structuredStyle(value, property, `${itemLabel}.styles.${property}`);
    });
    return { id: v.identifier(override.id, `${itemLabel}.id`), targetId, scope, ...(componentId ? { componentId } : {}), ...(instanceId ? { instanceId } : {}), styles };
  });
  return { schemaVersion: 1, id: themeId, name, baseThemeId, mode, createdAt, updatedAt, generator, variables, overrides };
}

function validateThemeLibrary(input) {
  v.object(input, 'ui_theme_library', ['schemaVersion', 'themes']);
  if (input.schemaVersion !== 1) v.fail('INVALID_INPUT', 'ui_theme_library.schemaVersion must be 1');
  if (!Array.isArray(input.themes) || input.themes.length > 64) v.fail('INVALID_INPUT', 'ui_theme_library.themes must contain at most 64 themes');
  const themes = input.themes.map((theme, index) => validateThemeDocument(theme, `ui_theme_library.themes[${index}]`));
  if (new Set(themes.map((theme) => theme.id)).size !== themes.length) v.fail('INVALID_INPUT', 'ui_theme_library theme IDs must be unique');
  return { schemaVersion: 1, themes };
}

module.exports = { validateThemeDocument, validateThemeLibrary };
