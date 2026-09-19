import { BUILT_IN_THEME_IDS } from './builtInThemes';
import { COMPONENT_IDS, EDITABLE_PROPERTIES, TARGET_IDS, TARGET_REGISTRY } from './themeRegistry';
import { materializeThemeCss, parseThemeSource } from './themeSource';
import themeContract from './themeContract.json';
import postcss from './postcssBrowser';
import { BUILT_IN_THEME_FILES } from '../themes/themeFiles';

export const THEME_SCHEMA_VERSION = themeContract.version;
export const EMPTY_THEME_LIBRARY = Object.freeze({ schemaVersion: THEME_SCHEMA_VERSION, themes: [] });
export const MAX_THEME_CSS_LENGTH = themeContract.maxCssLength;

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const UNSAFE_CSS = /url\s*\(|javascript\s*:|expression\s*\(|<\/?script|@import|behavior\s*:/i;
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+(?:deg|rad|turn)?\)|oklch\([\d\s.%+/-]+(?:deg|rad|turn)?\)|transparent|currentColor|[a-z]+)$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const GENERATOR_KEYS = [
  'mode', 'primaryAnchor', 'secondaryAnchor', 'harmony', 'temperature',
  'saturation', 'contrast', 'glowStrength', 'material', 'seed',
];

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

function assertObject(value, label) {
  assertion(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
}

function assertExactKeys(value, keys, label) {
  const unknown = Object.keys(value).filter((key) => !keys.includes(key));
  assertion(unknown.length === 0, `${label} contains unsupported fields: ${unknown.join(', ')}.`);
}

function assertSafeString(value, label, max = 1000) {
  assertion(typeof value === 'string' && value.length <= max && !UNSAFE_CSS.test(value), `${label} is unsafe or too long.`);
  return value;
}

function assertColor(value, label) {
  assertSafeString(value, label, 160);
  assertion(COLOR_VALUE.test(value.trim()), `${label} must be a color.`);
}

function validateGeneratorSettings(value, label) {
  assertObject(value, label);
  assertExactKeys(value, GENERATOR_KEYS, label);
  if (value.mode !== undefined) assertion(value.mode === 'dark' || value.mode === 'light', `${label}.mode is invalid.`);
  if (value.primaryAnchor !== undefined) assertion(typeof value.primaryAnchor === 'string' && HEX_COLOR.test(value.primaryAnchor), `${label}.primaryAnchor must be a six-digit hex color.`);
  if (value.secondaryAnchor !== undefined) assertion(value.secondaryAnchor === '' || (typeof value.secondaryAnchor === 'string' && HEX_COLOR.test(value.secondaryAnchor)), `${label}.secondaryAnchor must be empty or a six-digit hex color.`);
  if (value.harmony !== undefined) assertion(['analogous', 'complementary', 'split-complementary', 'triadic'].includes(value.harmony), `${label}.harmony is invalid.`);
  [['temperature', -100, 100], ['saturation', 0, 100], ['contrast', 0, 100], ['glowStrength', 0, 60]].forEach(([key, min, max]) => {
    if (value[key] !== undefined) assertion(Number.isFinite(value[key]) && value[key] >= min && value[key] <= max, `${label}.${key} is invalid.`);
  });
  if (value.material !== undefined) assertion(['inherit', 'flat', 'layered', 'glass'].includes(value.material), `${label}.material is invalid.`);
  if (value.seed !== undefined) assertion(Number.isSafeInteger(value.seed) && value.seed >= 1 && value.seed <= 2147483647, `${label}.seed is invalid.`);
}

function validateStructuredStyle(value, property, label) {
  assertObject(value, label);
  switch (property) {
    case 'color':
    case 'borderColor':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'color', `${label}.kind must be color.`);
      assertColor(value.value, `${label}.value`);
      break;
    case 'background':
      if (value.kind === 'solid') {
        assertExactKeys(value, ['kind', 'color'], label);
        assertColor(value.color, `${label}.color`);
      } else {
        assertExactKeys(value, ['kind', 'angle', 'stops'], label);
        assertion(value.kind === 'linear-gradient', `${label}.kind must be solid or linear-gradient.`);
        assertion(Number.isFinite(value.angle) && value.angle >= 0 && value.angle <= 360, `${label}.angle is invalid.`);
        assertion(Array.isArray(value.stops) && value.stops.length >= 2 && value.stops.length <= 3, `${label}.stops must contain 2–3 stops.`);
        value.stops.forEach((stop, index) => {
          assertObject(stop, `${label}.stops[${index}]`);
          assertExactKeys(stop, ['color', 'position'], `${label}.stops[${index}]`);
          assertColor(stop.color, `${label}.stops[${index}].color`);
          assertion(Number.isFinite(stop.position) && stop.position >= 0 && stop.position <= 100, `${label}.stops[${index}].position is invalid.`);
        });
      }
      break;
    case 'boxShadow':
      assertExactKeys(value, ['kind', 'color', 'x', 'y', 'blur', 'spread', 'intensity'], label);
      assertion(value.kind === 'shadow', `${label}.kind must be shadow.`);
      assertColor(value.color, `${label}.color`);
      ['x', 'y', 'spread'].forEach((key) => assertion(Number.isFinite(value[key]) && value[key] >= -100 && value[key] <= 200, `${label}.${key} is invalid.`));
      assertion(Number.isFinite(value.blur) && value.blur >= 0 && value.blur <= 200, `${label}.blur is invalid.`);
      assertion(Number.isFinite(value.intensity) && value.intensity >= 0 && value.intensity <= 1, `${label}.intensity is invalid.`);
      break;
    case 'opacity':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'number' && Number.isFinite(value.value) && value.value >= 0 && value.value <= 1, `${label} is invalid.`);
      break;
    case 'borderWidth':
    case 'borderRadius':
    case 'fontSize':
    case 'letterSpacing':
    case 'padding':
    case 'minHeight':
      assertExactKeys(value, ['kind', 'value', 'unit'], label);
      assertion(value.kind === 'length' && Number.isFinite(value.value) && value.value >= 0 && value.value <= 240, `${label}.value is invalid.`);
      assertion(['px', 'rem', 'em'].includes(value.unit), `${label}.unit is invalid.`);
      break;
    case 'borderStyle':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'keyword' && ['solid', 'dashed', 'dotted', 'double', 'none'].includes(value.value), `${label}.value is invalid.`);
      break;
    case 'cornerShape':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'keyword' && ['round', 'squircle', 'bevel', 'scoop', 'notch', 'square'].includes(value.value), `${label}.value is invalid.`);
      break;
    case 'fontWeight':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'number' && Number.isFinite(value.value) && value.value >= 100 && value.value <= 900, `${label}.value is invalid.`);
      break;
    case 'fontFamily':
      assertExactKeys(value, ['kind', 'value'], label);
      assertion(value.kind === 'font', `${label}.kind must be font.`);
      assertSafeString(value.value, `${label}.value`, 240);
      assertion(!/[{};]/.test(value.value), `${label}.value is invalid.`);
      break;
    default:
      throw new Error(`${label} is not editable.`);
  }
}

export function validateThemeDocument(input) {
  assertObject(input, 'theme');
  assertExactKeys(input, themeContract.documentKeys, 'theme');
  assertion(input.schemaVersion === 1 || input.schemaVersion === THEME_SCHEMA_VERSION, 'Theme schema version must be 1 or 2.');
  assertion(typeof input.id === 'string' && SAFE_ID.test(input.id) && input.id.length <= 128, 'Theme ID is invalid.');
  assertion(typeof input.name === 'string' && input.name.trim().length >= 1 && input.name.length <= 80, 'Theme name must be 1–80 characters.');
  assertion(input.schemaVersion === 1 ? Object.hasOwn(BUILT_IN_THEME_FILES, input.baseThemeId) : isSafeIdentifier(input.baseThemeId), 'Theme selector context is invalid.');
  assertion(input.mode === 'dark' || input.mode === 'light', 'Theme mode is invalid.');
  assertion(Number.isSafeInteger(input.createdAt) && input.createdAt >= 0, 'Theme createdAt is invalid.');
  assertion(Number.isSafeInteger(input.updatedAt) && input.updatedAt >= 0, 'Theme updatedAt is invalid.');
  assertion(input.generator === null || (input.generator && typeof input.generator === 'object' && !Array.isArray(input.generator)), 'Theme generator settings are invalid.');
  if (input.generator) {
    const serialized = JSON.stringify(input.generator);
    assertion(serialized.length <= 10000 && !UNSAFE_CSS.test(serialized), 'Theme generator settings are unsafe or too large.');
    validateGeneratorSettings(input.generator, 'theme.generator');
  }

  const variables = input.variables || {};
  const overrides = input.overrides || [];
  if (input.schemaVersion === THEME_SCHEMA_VERSION) {
    assertion(input.variables && Object.keys(input.variables).length === 0, 'Version 2 theme values belong in cssText.');
    assertion(Array.isArray(input.overrides) && input.overrides.length === 0, 'Version 2 theme rules belong in cssText.');
  }
  assertObject(variables, 'theme.variables');
  assertion(Object.keys(variables).length <= 8192, 'A theme can contain at most 8192 variable overrides.');
  Object.entries(variables).forEach(([variable, value]) => {
    assertion(/^--[A-Za-z0-9_-]+$/.test(variable), `Invalid custom property name: ${variable}.`);
    assertSafeString(value, `theme.variables.${variable}`, 1000);
    assertion(!/[{};]/.test(value), `theme.variables.${variable} contains invalid CSS.`);
  });

  assertion(Array.isArray(overrides) && overrides.length <= 256, 'A theme can contain at most 256 scoped overrides.');
  overrides.forEach((override, index) => {
    const label = `theme.overrides[${index}]`;
    assertObject(override, label);
    assertExactKeys(override, ['id', 'targetId', 'scope', 'componentId', 'instanceId', 'styles'], label);
    assertion(typeof override.id === 'string' && SAFE_ID.test(override.id), `${label}.id is invalid.`);
    assertion(TARGET_IDS.includes(override.targetId), `${label}.targetId is unknown.`);
    assertion(['role', 'component', 'instance'].includes(override.scope), `${label}.scope is invalid.`);
    if (override.scope === 'component') assertion(COMPONENT_IDS.includes(override.componentId), `${label}.componentId is invalid.`);
    if (override.scope === 'instance') assertion(typeof override.instanceId === 'string' && SAFE_ID.test(override.instanceId), `${label}.instanceId is invalid.`);
    assertObject(override.styles, `${label}.styles`);
    Object.entries(override.styles).forEach(([property, value]) => {
      assertion(EDITABLE_PROPERTIES.includes(property), `${label}.styles.${property} is not editable.`);
      assertion(TARGET_REGISTRY[override.targetId].properties.includes(property), `${label}.styles.${property} is not editable for ${override.targetId}.`);
      validateStructuredStyle(value, property, `${label}.styles.${property}`);
    });
  });
  const cssText = input.schemaVersion === 1
    ? materializeThemeCss({ ...input, variables, overrides })
    : input.cssText;
  validateThemeCss(cssText);
  // CSS is the sole appearance source after migration. Keeping old override
  // objects would make later source edits silently reappear on save or export.
  return { ...structuredClone(input), schemaVersion: THEME_SCHEMA_VERSION, cssText, variables: {}, overrides: [] };
}

export function validateThemeCss(cssText) {
  assertion(typeof cssText === 'string' && cssText.length <= MAX_THEME_CSS_LENGTH, 'Theme CSS must be text no larger than 3 million characters.');
  const root = postcss.parse(cssText, { from: undefined });
  root.walkAtRules((rule) => assertion(!themeContract.blockedAtRules.includes(rule.name.toLowerCase()), 'Include the appearance rules directly instead of importing another stylesheet.'));
  const blockedValue = new RegExp(themeContract.blockedValuePattern, 'i');
  root.walkDecls((declaration) => assertion(!themeContract.blockedDeclarationProperties.includes(declaration.prop.toLowerCase()) && !blockedValue.test(declaration.value), 'Theme CSS cannot contain executable values.'));
  parseThemeSource(cssText);
  return cssText;
}

export function validateThemeLibrary(input) {
  assertObject(input, 'theme library');
  assertExactKeys(input, themeContract.libraryKeys, 'theme library');
  assertion(input.schemaVersion === 1 || input.schemaVersion === THEME_SCHEMA_VERSION, 'Theme library schema version must be 1 or 2.');
  assertion(Array.isArray(input.themes) && input.themes.length <= themeContract.maxThemes, `Theme library can contain at most ${themeContract.maxThemes} custom themes.`);
  const themes = input.themes.map(validateThemeDocument);
  assertion(new Set(themes.map((theme) => theme.id)).size === themes.length, 'Theme IDs must be unique.');
  return { schemaVersion: THEME_SCHEMA_VERSION, themes };
}

export function safeThemeLibrary(input) {
  try {
    return { library: validateThemeLibrary(input || EMPTY_THEME_LIBRARY), warning: null, invalidThemeBases: {}, migrated: input?.schemaVersion === 1 || input?.themes?.some((theme) => theme.schemaVersion === 1) };
  } catch (error) {
    if ([1, THEME_SCHEMA_VERSION].includes(input?.schemaVersion) && Array.isArray(input.themes) && input.themes.length <= themeContract.maxThemes) {
      const themes = [];
      const invalidThemeBases = {};
      input.themes.forEach((candidate) => {
        try {
          const valid = validateThemeDocument(candidate);
          assertion(!themes.some((theme) => theme.id === valid.id), 'Theme IDs must be unique.');
          themes.push(valid);
        }
        catch {
          if (isSafeIdentifier(candidate?.id) && BUILT_IN_THEME_IDS.has(candidate?.baseThemeId)) {
            invalidThemeBases[candidate.id] = candidate.baseThemeId;
          }
        }
      });
      return { library: { schemaVersion: THEME_SCHEMA_VERSION, themes }, warning: error.message, invalidThemeBases, migrated: input.schemaVersion === 1 };
    }
    return { library: { ...EMPTY_THEME_LIBRARY, themes: [] }, warning: error.message, invalidThemeBases: {} };
  }
}

export function createThemeDocument({ name, baseThemeId = 'default', mode = 'dark', variables = {}, overrides = [], generator = null, cssText, id, now = Date.now() }) {
  const slug = String(id || name || 'custom-theme')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'custom-theme';
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    id: id || `${slug}-${now.toString(36)}`,
    name: String(name || 'Custom Theme').trim().slice(0, 80),
    baseThemeId,
    mode,
    createdAt: now,
    updatedAt: now,
    generator,
    cssText: typeof cssText === 'string' ? cssText : materializeThemeCss(Object.keys(variables).length || overrides.length ? { baseThemeId, variables, overrides } : { id: baseThemeId }),
    variables: {},
    overrides: [],
  };
}

export function isSafeIdentifier(value) {
  return typeof value === 'string' && value.length <= 128 && SAFE_ID.test(value);
}
