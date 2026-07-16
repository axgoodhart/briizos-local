import { BUILT_IN_THEME_IDS } from './builtInThemes';
import { COMPONENT_IDS, CURATED_VARIABLES, EDITABLE_PROPERTIES, TARGET_IDS } from './themeRegistry';

export const THEME_SCHEMA_VERSION = 1;
export const EMPTY_THEME_LIBRARY = Object.freeze({ schemaVersion: 1, themes: [] });

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const UNSAFE_CSS = /url\s*\(|javascript\s*:|expression\s*\(|<\/?script|@import|behavior\s*:/i;
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+(?:deg|rad|turn)?\)|oklch\([\d\s.%+/-]+(?:deg|rad|turn)?\)|transparent|currentColor|[a-z]+)$/i;

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
      ['x', 'y', 'blur', 'spread'].forEach((key) => assertion(Number.isFinite(value[key]) && value[key] >= -100 && value[key] <= 200, `${label}.${key} is invalid.`));
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
  assertExactKeys(input, ['schemaVersion', 'id', 'name', 'baseThemeId', 'mode', 'createdAt', 'updatedAt', 'generator', 'variables', 'overrides'], 'theme');
  assertion(input.schemaVersion === THEME_SCHEMA_VERSION, 'Theme schema version must be 1.');
  assertion(typeof input.id === 'string' && SAFE_ID.test(input.id) && input.id.length <= 128, 'Theme ID is invalid.');
  assertion(typeof input.name === 'string' && input.name.trim().length >= 1 && input.name.length <= 80, 'Theme name must be 1–80 characters.');
  assertion(BUILT_IN_THEME_IDS.has(input.baseThemeId), 'Theme base does not exist.');
  assertion(input.mode === 'dark' || input.mode === 'light', 'Theme mode is invalid.');
  assertion(Number.isSafeInteger(input.createdAt) && input.createdAt >= 0, 'Theme createdAt is invalid.');
  assertion(Number.isSafeInteger(input.updatedAt) && input.updatedAt >= 0, 'Theme updatedAt is invalid.');
  assertion(input.generator === null || (input.generator && typeof input.generator === 'object' && !Array.isArray(input.generator)), 'Theme generator settings are invalid.');
  if (input.generator) {
    const serialized = JSON.stringify(input.generator);
    assertion(serialized.length <= 10000 && !UNSAFE_CSS.test(serialized), 'Theme generator settings are unsafe or too large.');
  }

  assertObject(input.variables, 'theme.variables');
  assertion(Object.keys(input.variables).length <= 512, 'A theme can contain at most 512 variable overrides.');
  Object.entries(input.variables).forEach(([variable, value]) => {
    assertion(CURATED_VARIABLES.includes(variable), `Unknown curated variable: ${variable}.`);
    assertSafeString(value, `theme.variables.${variable}`, 1000);
    assertion(!/[{};]/.test(value), `theme.variables.${variable} contains invalid CSS.`);
  });

  assertion(Array.isArray(input.overrides) && input.overrides.length <= 256, 'A theme can contain at most 256 scoped overrides.');
  input.overrides.forEach((override, index) => {
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
      validateStructuredStyle(value, property, `${label}.styles.${property}`);
    });
  });
  return structuredClone(input);
}

export function validateThemeLibrary(input) {
  assertObject(input, 'theme library');
  assertExactKeys(input, ['schemaVersion', 'themes'], 'theme library');
  assertion(input.schemaVersion === THEME_SCHEMA_VERSION, 'Theme library schema version must be 1.');
  assertion(Array.isArray(input.themes) && input.themes.length <= 64, 'Theme library can contain at most 64 custom themes.');
  const themes = input.themes.map(validateThemeDocument);
  assertion(new Set(themes.map((theme) => theme.id)).size === themes.length, 'Theme IDs must be unique.');
  return { schemaVersion: THEME_SCHEMA_VERSION, themes };
}

export function safeThemeLibrary(input) {
  try {
    return { library: validateThemeLibrary(input || EMPTY_THEME_LIBRARY), warning: null, invalidThemeBases: {} };
  } catch (error) {
    if (input?.schemaVersion === 1 && Array.isArray(input.themes) && input.themes.length <= 64) {
      const themes = [];
      const invalidThemeBases = {};
      input.themes.forEach((candidate) => {
        try { themes.push(validateThemeDocument(candidate)); }
        catch {
          if (isSafeIdentifier(candidate?.id) && BUILT_IN_THEME_IDS.has(candidate?.baseThemeId)) {
            invalidThemeBases[candidate.id] = candidate.baseThemeId;
          }
        }
      });
      return { library: { schemaVersion: 1, themes }, warning: error.message, invalidThemeBases };
    }
    return { library: { ...EMPTY_THEME_LIBRARY, themes: [] }, warning: error.message, invalidThemeBases: {} };
  }
}

export function createThemeDocument({ name, baseThemeId, mode, variables = {}, overrides = [], generator = null, id, now = Date.now() }) {
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
    variables: { ...variables },
    overrides: structuredClone(overrides),
  };
}

export function isSafeIdentifier(value) {
  return typeof value === 'string' && SAFE_ID.test(value);
}
