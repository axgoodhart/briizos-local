import { FLOAT_APPS } from '../hooks/useFloatWindows';

/**
 * Wraps the masonry layout hook so the assistant's window tools keep working
 * whichever shell surfaces are visible.
 *
 * - grid mode: the layout hook passes through untouched.
 * - windowed mode: panel open/minimize/restore calls for float-capable apps
 *   are routed to the ambient window manager instead of mutating the hidden
 *   grid, and every float-capable app is resolvable by the tools.
 * - hybrid mode: apps living in the grid stay grid-managed; apps not in the
 *   grid resolve to (and open as) float windows.
 *
 * The bridge also exposes moveFloatWindow/resizeFloatWindow so the movePanel
 * and resizePanel tools gain real behavior for float windows — the grid
 * rightly keeps refusing free positioning.
 */
export function createShellLayoutBridge(layout, shell, floats) {
  if (!shell.floatActive) return layout;

  const windowedOnly = !shell.gridActive;
  const findWin = (id) => floats.windows.find((win) => win.id === id || win.app === id) || null;

  const pseudoPanel = (app) => {
    const win = findWin(app);
    return {
      id: app,
      type: app,
      visible: !!win && !win.minimized,
      size: 20,
      order: 0,
      isFloatWindow: true,
    };
  };

  let panels;
  if (windowedOnly) {
    panels = [
      ...Object.keys(FLOAT_APPS).map(pseudoPanel),
      ...layout.panels.filter((panel) => !FLOAT_APPS[panel.type]),
    ];
  } else {
    const gridTypes = new Set(layout.panels.map((panel) => panel.type));
    panels = [
      ...layout.panels,
      ...Object.keys(FLOAT_APPS).filter((app) => !gridTypes.has(app)).map(pseudoPanel),
    ];
  }

  const isFloatTarget = (idOrType) => {
    if (!FLOAT_APPS[idOrType]) return false;
    if (windowedOnly) return true;
    return !layout.panels.some((panel) => panel.id === idOrType || panel.type === idOrType);
  };

  return {
    ...layout,
    panels,
    getPanel: (panelId) => panels.find((panel) => panel.id === panelId) || layout.getPanel(panelId),
    getPanelByType: (type) => panels.find((panel) => panel.type === type) || layout.getPanelByType(type),
    addPanel: (panel) => {
      if (panel?.type && isFloatTarget(panel.type)) return floats.openWindow(panel.type);
      return layout.addPanel(panel);
    },
    removePanel: (panelId) => {
      if (isFloatTarget(panelId)) {
        floats.closeWindow(panelId);
        return undefined;
      }
      return layout.removePanel(panelId);
    },
    updatePanel: (panelId, updates) => {
      if (isFloatTarget(panelId)) {
        if (updates?.visible === true) floats.openWindow(panelId);
        else if (updates?.visible === false) floats.minimizeWindow(panelId);
        return undefined;
      }
      return layout.updatePanel(panelId, updates);
    },
    togglePanelVisibility: (panelId) => {
      if (isFloatTarget(panelId)) {
        const win = findWin(panelId);
        if (win && !win.minimized) floats.minimizeWindow(win.id);
        else floats.openWindow(panelId);
        return undefined;
      }
      return layout.togglePanelVisibility(panelId);
    },
    moveFloatWindow: (panelId, x, y) => {
      const win = findWin(panelId);
      if (!win || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      floats.moveWindow(win.id, { x, y });
      floats.focusWindow(win.id);
      return true;
    },
    resizeFloatWindow: (panelId, width, height) => {
      const win = findWin(panelId);
      if (!win || !Number.isFinite(width) || !Number.isFinite(height)) return false;
      floats.resizeWindow(win.id, { width, height });
      floats.focusWindow(win.id);
      return true;
    },
  };
}

export default createShellLayoutBridge;
