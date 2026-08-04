// @vitest-environment jsdom
import React, { act, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from './ThemeProvider';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let currentTheme;
let root;
let container;
let normalClick;
let normalPress;

function CaptureTheme() {
  const theme = useTheme();
  useEffect(() => { currentTheme = theme; }, [theme]);
  return <div data-theme-role="panel" data-theme-component="Tasks"><button id="picker-test-button" data-theme-role="button-primary" data-theme-component="Tasks" onMouseDown={normalPress} onClick={normalClick}>Test panel</button></div>;
}

async function renderProvider(settings = {}) {
  const get = vi.fn(async (key) => key in settings ? { key, value: settings[key] } : null);
  const set = vi.fn(async (key, value) => ({ key, value }));
  window.api = { localData: { settings: { get, set } } };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<ThemeProvider><CaptureTheme /></ThemeProvider>); });
  await act(async () => { await Promise.resolve(); });
  return { get, set };
}

describe('ThemeProvider draft lifecycle', () => {
  beforeEach(() => {
    currentTheme = null;
    normalClick = vi.fn();
    normalPress = vi.fn();
    window.localStorage.clear();
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-custom-theme');
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    root = null;
    container = null;
    delete window.api;
  });

  it('previews a built-in mutation as a custom copy without persisting before Save', async () => {
    const { set } = await renderProvider({ ui_theme: 'winterbloom', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.updateGlobalToken('primary', '#cc6688'));
    expect(currentTheme.draftTheme.name).toBe('Winterbloom Copy');
    expect(currentTheme.isDirty).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--palette-accent-primary')).toBe('#cc6688');
    expect(set).not.toHaveBeenCalled();
    await act(async () => { await currentTheme.save(); });
    expect(set).toHaveBeenCalledWith('ui_theme_library', expect.objectContaining({ schemaVersion: 1 }));
    expect(set).toHaveBeenCalledWith('ui_theme', currentTheme.activeThemeId);
    expect(currentTheme.isDirty).toBe(false);
  });

  it('undoes, redoes, and reverts draft-only changes', async () => {
    await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.updateGlobalToken('panelRadius', 12));
    expect(currentTheme.canUndo).toBe(true);
    await act(async () => currentTheme.undo());
    expect(currentTheme.canRedo).toBe(true);
    await act(async () => currentTheme.redo());
    expect(currentTheme.draftTheme.variables['--layout-panel-radius']).toBe('12px');
    await act(async () => currentTheme.revert());
    expect(currentTheme.isDirty).toBe(false);
    expect(currentTheme.draftTheme).toBeNull();
  });

  it('removes a generated material override when returning to inherited recipes', async () => {
    await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.applyGeneratedTheme({ seed: 42, material: 'layered' }));
    expect(currentTheme.draftTheme.variables['--layout-bg-panel']).toMatch(/linear-gradient/);
    await act(async () => currentTheme.applyGeneratedTheme({ seed: 42, material: 'inherit' }));
    expect(currentTheme.draftTheme.variables['--layout-bg-panel']).toBeUndefined();
  });

  it('Save As creates an independent saved document and import resolves conflicts before preview', async () => {
    const { set } = await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.updateGlobalToken('primary', '#b56d45'));
    await act(async () => { await currentTheme.saveAs('Copper Field'); });
    expect(currentTheme.activeTheme.name).toBe('Copper Field');
    expect(currentTheme.customThemes).toHaveLength(1);
    const conflictingImport = {
      ...currentTheme.activeTheme,
      id: 'default',
      name: 'Dark Neon',
      createdAt: 101,
      updatedAt: 101,
    };
    await act(async () => currentTheme.importTheme(JSON.stringify(conflictingImport)));
    expect(currentTheme.draftTheme.id).not.toBe('default');
    expect(currentTheme.draftTheme.name).toMatch(/Imported/);
    expect(set).toHaveBeenCalledTimes(2);
  });

  it('falls back visibly when a saved custom theme is missing', async () => {
    await renderProvider({ ui_theme: 'missing-custom', ui_theme_library: { schemaVersion: 1, themes: [] } });
    expect(currentTheme.activeThemeId).toBe('default');
    expect(currentTheme.warning).toMatch(/unavailable/);
  });

  it('selects a registered object without firing its normal press or click actions', async () => {
    await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.startPicker());
    const button = document.getElementById('picker-test-button');
    await act(async () => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(normalPress).not.toHaveBeenCalled();
    expect(normalClick).not.toHaveBeenCalled();
    expect(currentTheme.selectedTarget.role).toBe('button-primary');
    expect(currentTheme.pickerActive).toBe(false);
  });

  it('recovers the built-in base of a malformed saved custom theme', async () => {
    const malformed = {
      schemaVersion: 1, id: 'broken-custom', name: 'Broken Custom', baseThemeId: 'winterbloom', mode: 'dark',
      createdAt: 10, updatedAt: 10, generator: null, variables: { '--unknown-variable': 'red' }, overrides: [],
    };
    await renderProvider({ ui_theme: 'broken-custom', ui_theme_library: { schemaVersion: 1, themes: [malformed] } });
    expect(currentTheme.activeThemeId).toBe('winterbloom');
    expect(currentTheme.warning).toMatch(/malformed.*Winterbloom/i);
  });

  it('Replace default shadows the built-in, and Restore default removes the override', async () => {
    const { set } = await renderProvider({ ui_theme: 'winterbloom', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.updateGlobalToken('primary', '#cc6688'));
    expect(currentTheme.draftTheme.baseThemeId).toBe('winterbloom');

    await act(async () => { await currentTheme.replaceDefault(); });
    expect(currentTheme.activeThemeId).toBe('winterbloom');
    expect(currentTheme.activeTheme.id).toBe('winterbloom');
    expect(currentTheme.activeTheme.variables['--palette-accent-primary']).toBe('#cc6688');
    expect(currentTheme.customThemes.map((theme) => theme.id)).toEqual(['winterbloom']);
    expect(currentTheme.isDirty).toBe(false);
    expect(set).toHaveBeenCalledWith('ui_theme_library', expect.objectContaining({
      themes: [expect.objectContaining({ id: 'winterbloom' })],
    }));

    await act(async () => { await currentTheme.restoreDefault(); });
    expect(currentTheme.activeThemeId).toBe('winterbloom');
    expect(currentTheme.customThemes).toHaveLength(0);
    expect(document.documentElement.getAttribute('data-custom-theme')).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--palette-accent-primary')).toBe('');
    expect(set).toHaveBeenCalledWith('ui_theme_library', expect.objectContaining({ themes: [] }));
  });

  it('Replace default can promote an already-saved custom theme instead of forking again', async () => {
    await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await act(async () => currentTheme.updateGlobalToken('primary', '#b56d45'));
    await act(async () => { await currentTheme.saveAs('Copper Field'); });
    expect(currentTheme.customThemes).toHaveLength(1);

    await act(async () => { await currentTheme.replaceDefault(); });
    expect(currentTheme.activeThemeId).toBe('default');
    expect(currentTheme.activeTheme.name).toBe('Dark Neon');
    // The original standalone "Copper Field" save is untouched; the override is a second entry.
    expect(currentTheme.customThemes).toHaveLength(2);
    expect(currentTheme.customThemes.some((theme) => theme.id === 'default')).toBe(true);
    expect(currentTheme.customThemes.some((theme) => theme.name === 'Copper Field')).toBe(true);
  });

  it('rejects Restore default for an id that has no built-in counterpart', async () => {
    await renderProvider({ ui_theme: 'default', ui_theme_library: { schemaVersion: 1, themes: [] } });
    await expect(act(async () => { await currentTheme.restoreDefault('not-a-theme'); })).rejects.toThrow(/no built-in default/);
  });
});
