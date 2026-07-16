import { describe, expect, it } from 'vitest';
import { createThemeDocument, validateThemeDocument, validateThemeLibrary } from './themeSchema';

function validTheme() {
  return createThemeDocument({
    id: 'winterbloom-copy',
    name: 'Winterbloom Copy',
    baseThemeId: 'winterbloom',
    mode: 'dark',
    now: 100,
    variables: { '--palette-accent-primary': '#d47c96' },
    overrides: [{
      id: 'panel:component:Tasks', targetId: 'panel', scope: 'component', componentId: 'Tasks',
      styles: { background: { kind: 'linear-gradient', angle: 145, stops: [{ color: '#121417', position: 0 }, { color: '#242930', position: 100 }] } },
    }],
  });
}

describe('theme schema', () => {
  it('accepts exact JSON round trips', () => {
    const theme = validTheme();
    expect(validateThemeDocument(JSON.parse(JSON.stringify(theme)))).toEqual(theme);
    expect(validateThemeLibrary({ schemaVersion: 1, themes: [theme] }).themes).toHaveLength(1);
  });

  it('rejects unknown variables and arbitrary selector-shaped targets', () => {
    const unknownVariable = validTheme();
    unknownVariable.variables['--anything-goes'] = 'red';
    expect(() => validateThemeDocument(unknownVariable)).toThrow(/Unknown curated variable/);
    const selector = validTheme();
    selector.overrides[0].targetId = 'body > script';
    expect(() => validateThemeDocument(selector)).toThrow(/targetId is unknown|targetId/);
  });

  it('rejects executable CSS and unknown properties', () => {
    const unsafe = validTheme();
    unsafe.variables['--layout-bg-panel'] = 'url(javascript:alert(1))';
    expect(() => validateThemeDocument(unsafe)).toThrow(/unsafe|invalid CSS/i);
    const unknownProperty = validTheme();
    unknownProperty.overrides[0].styles.transform = { kind: 'keyword', value: 'rotate(2deg)' };
    expect(() => validateThemeDocument(unknownProperty)).toThrow(/not editable/);

    const wrongTargetProperty = validTheme();
    wrongTargetProperty.overrides[0] = {
      id: 'canvas:role', targetId: 'canvas', scope: 'role',
      styles: { borderRadius: { kind: 'length', value: 12, unit: 'px' } },
    };
    expect(() => validateThemeDocument(wrongTargetProperty)).toThrow(/not editable for canvas/);
  });

  it('enforces library bounds and immutable built-in bases', () => {
    const themes = Array.from({ length: 65 }, (_, index) => ({ ...validTheme(), id: `theme-${index}` }));
    expect(() => validateThemeLibrary({ schemaVersion: 1, themes })).toThrow(/at most 64/);
    const invalidBase = validTheme();
    invalidBase.baseThemeId = 'missing-theme';
    expect(() => validateThemeDocument(invalidBase)).toThrow(/base does not exist/);
  });

  it('validates persisted generator settings as a curated contract', () => {
    const invalidGenerator = validTheme();
    invalidGenerator.generator = { seed: 0, harmony: 'rainbow', customCss: 'body{}' };
    expect(() => validateThemeDocument(invalidGenerator)).toThrow(/unsupported fields|generator/i);
  });
});
