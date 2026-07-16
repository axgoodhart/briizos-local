// @vitest-environment jsdom
import React, { act, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from './ThemeProvider';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let currentTheme;
let root;
let container;

function CaptureTheme() {
  const theme = useTheme();
  useEffect(() => { currentTheme = theme; }, [theme]);
  return <div data-theme-role="panel" data-theme-component="Tasks">Test panel</div>;
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

  it('recovers the built-in base of a malformed saved custom theme', async () => {
    const malformed = {
      schemaVersion: 1, id: 'broken-custom', name: 'Broken Custom', baseThemeId: 'winterbloom', mode: 'dark',
      createdAt: 10, updatedAt: 10, generator: null, variables: { '--unknown-variable': 'red' }, overrides: [],
    };
    await renderProvider({ ui_theme: 'broken-custom', ui_theme_library: { schemaVersion: 1, themes: [malformed] } });
    expect(currentTheme.activeThemeId).toBe('winterbloom');
    expect(currentTheme.warning).toMatch(/malformed.*Winterbloom/i);
  });
});
