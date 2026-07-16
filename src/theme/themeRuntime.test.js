// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { annotateThemeSurfaces, createThemeRuntime, registeredTargetFromElement, rulesForOverrides, selectorForOverride } from './themeRuntime';

describe('theme runtime', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-custom-theme');
    document.documentElement.removeAttribute('style');
    document.head.querySelector('[data-theme-runtime]')?.remove();
    document.body.innerHTML = '';
  });

  it('removes only its own stale variables and generated rules when switching', () => {
    document.documentElement.style.setProperty('--unrelated-inline-style', 'keep');
    const runtime = createThemeRuntime(document);
    runtime.apply({ id: 'one', baseThemeId: 'winterbloom', variables: { '--palette-accent-primary': '#aa0000', '--theme-corner-style': 'soft' }, overrides: [] });
    expect(document.documentElement.style.getPropertyValue('--palette-accent-primary')).toBe('#aa0000');
    expect(document.documentElement.style.getPropertyValue('--ui-corner-shape')).toBe('squircle');
    runtime.apply({ id: 'two', baseThemeId: 'great-wave', variables: { '--palette-text-main': '#eeeeee' }, overrides: [] });
    expect(document.documentElement.style.getPropertyValue('--palette-accent-primary')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--ui-corner-shape')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--palette-text-main')).toBe('#eeeeee');
    expect(document.documentElement.style.getPropertyValue('--unrelated-inline-style')).toBe('keep');
    expect(document.documentElement.dataset.theme).toBe('great-wave');
    expect(document.documentElement.dataset.customTheme).toBe('two');
  });

  it('generates only registry attribute selectors', () => {
    const css = rulesForOverrides([{ id: 'header:component:Tasks', targetId: 'header', scope: 'component', componentId: 'Tasks', styles: { color: { kind: 'color', value: '#ffeeaa' } } }]);
    expect(css).toContain('[data-theme-role="header"][data-theme-component="Tasks"]');
    expect(css).toContain('color: #ffeeaa !important');
    expect(selectorForOverride({ targetId: 'panel', scope: 'role' })).toBe('[data-theme-role="panel"]');
    expect(selectorForOverride({ targetId: 'panel', scope: 'instance', instanceId: 'tasks' })).toBe('[data-theme-role="panel"][data-theme-instance="tasks"]');
  });

  it('resolves the nearest registered ancestor and excludes Theme Studio', () => {
    document.body.innerHTML = '<section data-theme-role="panel" data-theme-component="Tasks"><button><span id="needle">Pick</span></button></section><aside data-theme-studio="true"><div data-theme-role="panel"><span id="studio">No</span></div></aside>';
    const result = registeredTargetFromElement(document.getElementById('needle'));
    expect(result.role).toBe('panel');
    expect(result.componentId).toBe('Tasks');
    expect(registeredTargetFromElement(document.getElementById('studio'))).toBeNull();
  });

  it('annotates the actual chat, overlay, and canvas surface class names', () => {
    document.body.innerHTML = `
      <section class="interaction-panel">
        <div class="messages-list"><article class="chat-message">Hello</article></div>
        <div class="chat-input-area"><div class="chat-input-wrapper">Composer</div></div>
      </section>
      <div class="calendar-overlay"><div class="calendar-modal"><div class="calendar-footer">Footer</div></div></div>
      <div class="canvas-backdrop"><div class="canvas-modal"><div class="canvas-body">Canvas</div></div></div>
    `;
    annotateThemeSurfaces(document);
    expect(document.querySelector('.messages-list').dataset.themeRole).toBe('chat-canvas');
    expect(document.querySelector('.chat-message').dataset.themeRole).toBe('message');
    expect(document.querySelector('.chat-input-wrapper').dataset.themeRole).toBe('composer');
    expect(document.querySelector('.calendar-footer').dataset.themeRole).toBe('footer');
    expect(document.querySelector('.canvas-backdrop').dataset.themeRole).toBe('overlay');
    expect(document.querySelector('.canvas-body').dataset.themeRole).toBe('body');
  });

  it('carries stable component and instance identity onto a registered panel surface', () => {
    document.body.innerHTML = '<div data-theme-component="Tasks" data-theme-instance="tasks-main"><section class="panel"><span id="panel-child">Task</span></section></div>';
    annotateThemeSurfaces(document);
    const panel = registeredTargetFromElement(document.getElementById('panel-child'));
    expect(panel.role).toBe('panel');
    expect(panel.componentId).toBe('Tasks');
    expect(panel.instanceId).toBe('tasks-main');
  });
});
