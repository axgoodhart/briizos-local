import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createThemeDocument } from './themeSchema';

const require = createRequire(import.meta.url);
const { validateThemeLibrary } = require('../../electron/theme-library-validation.js');

describe('main-process theme validation', () => {
  it('normalizes a safe library and rejects renderer-bypass payloads', () => {
    const theme = createThemeDocument({
      id: 'validated-theme', name: 'Validated Theme', baseThemeId: 'default', mode: 'dark', now: 10,
      variables: { '--palette-accent-primary': '#d4a373' },
    });
    expect(validateThemeLibrary({ schemaVersion: 1, themes: [theme] }).themes[0].id).toBe('validated-theme');
    const bypass = structuredClone(theme);
    bypass.variables['--layout-bg-panel'] = 'url(file:///etc/passwd)';
    expect(() => validateThemeLibrary({ schemaVersion: 1, themes: [bypass] })).toThrow(/unsafe CSS/);

    const wrongTargetProperty = structuredClone(theme);
    wrongTargetProperty.overrides = [{
      id: 'canvas:role', targetId: 'canvas', scope: 'role',
      styles: { borderRadius: { kind: 'length', value: 12, unit: 'px' } },
    }];
    expect(() => validateThemeLibrary({ schemaVersion: 1, themes: [wrongTargetProperty] })).toThrow(/not editable for canvas/);

    const invalidGenerator = structuredClone(theme);
    invalidGenerator.generator = { seed: 0, harmony: 'rainbow' };
    expect(() => validateThemeLibrary({ schemaVersion: 1, themes: [invalidGenerator] })).toThrow(/seed|harmony/);
  });
});
