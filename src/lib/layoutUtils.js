/**
 * Layout utility functions for the v2 row/column/stack layout model.
 * All functions are pure — no React or side-effect dependencies.
 *
 * @typedef {Object} StackPanel
 * @property {string} panelId - Panel identifier (e.g. 'sources', 'interaction')
 * @property {string} type - Panel type for renderPanel dispatch
 * @property {number} size - Vertical height percentage within column (all sum ~100)
 *
 * @typedef {Object} LayoutColumn
 * @property {string} id - Unique column id (e.g. 'col-0')
 * @property {number} size - Horizontal width percentage of row (all sum ~100)
 * @property {StackPanel[]} panels - 1 panel = single, 2+ = vertical stack
 *
 * @typedef {Object} LayoutRow
 * @property {LayoutColumn[]} columns
 * @property {Array} [hiddenPanels] - Panels toggled hidden
 * @property {number} version - Always 2
 */

let colIdCounter = 0;

export const NEW_PANEL_WIDTH = 20;

function nextColId() {
  return `col-${Date.now()}-${colIdCounter++}`;
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Convert a v1 flat panels array into a v2 LayoutRow.
 * Each visible panel becomes its own single-panel column.
 */
export function migrateFlatToColumns(panels) {
  if (!Array.isArray(panels) || panels.length === 0) {
    return { columns: [], hiddenPanels: [], version: 2 };
  }

  const sorted = [...panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const visible = sorted.filter(p => p.visible !== false);
  const hidden = sorted.filter(p => p.visible === false);

  const columns = visible.map((p, i) => ({
    id: `col-${i}`,
    size: p.size || Math.floor(100 / visible.length),
    panels: [{ panelId: p.id, type: p.type, size: 100 }]
  }));

  const hiddenPanels = hidden.map(p => ({
    panelId: p.id,
    type: p.type
  }));

  return { columns, hiddenPanels, version: 2 };
}

// ---------------------------------------------------------------------------
// Simplify / normalize
// ---------------------------------------------------------------------------

/**
 * Post-mutation cleanup:
 * - Remove empty columns
 * - Renormalize column sizes to sum ~100
 * - Renormalize panel sizes within each multi-panel column to sum ~100
 */
export function simplifyLayout(layout) {
  if (!layout || !layout.columns) return layout;

  // Remove columns with no panels
  let columns = layout.columns.filter(col => col.panels && col.panels.length > 0);

  if (columns.length === 0) {
    return { ...layout, columns: [] };
  }

  // Keep the current proportions, including when a stack becomes a singleton.
  // Retain precision here so repeated open/close operations do not drift.
  columns = fitSizes(columns).map(col => ({ ...col, panels: fitSizes(col.panels) }));

  // Preserve workspace and other top-level fields
  return { ...layout, columns };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function fitSizes(items, available = 100) {
  const weights = items.map(item => Number.isFinite(item.size) && item.size > 0 ? item.size : 1);
  const total = weights.reduce((sum, size) => sum + size, 0);
  return items.map((item, index) => ({ ...item, size: weights[index] / total * available }));
}

/** Allocate a new column from the current ratios, never from remembered widths. */
export function insertPanelColumn(layout, panel, index = layout.columns.length, width = NEW_PANEL_WIDTH) {
  const current = simplifyLayout(layout);
  const allocatedWidth = Number.isFinite(width) && width > 0 && width < 100 ? width : NEW_PANEL_WIDTH;
  const columns = fitSizes(current.columns, 100 - allocatedWidth);
  columns.splice(Math.max(0, Math.min(index, columns.length)), 0, {
    id: nextColId(),
    size: columns.length ? allocatedWidth : 100,
    panels: [{ ...panel, size: 100 }],
  });
  return {
    ...current,
    columns,
    hiddenPanels: (current.hiddenPanels || []).filter(p => p.panelId !== panel.panelId),
  };
}

export function addPanelToRight(layout, panel, width = NEW_PANEL_WIDTH) {
  if (findPanelLocation(layout, panel.panelId)) return layout;
  return insertPanelColumn(layout, panel, layout.columns.length, width);
}

export function rememberPanelPlacement(layout, panelId) {
  const location = findPanelLocation(layout, panelId);
  if (!location) return layout;
  const column = layout.columns[location.columnIndex];
  const placement = {
    columnId: column.id,
    columnIndex: location.columnIndex,
    panelIndex: location.panelIndex,
    width: column.size,
    height: column.panels[location.panelIndex].size,
    siblings: column.panels.filter(p => p.panelId !== panelId).map(p => p.panelId),
    before: layout.columns[location.columnIndex + 1]?.id,
    after: layout.columns[location.columnIndex - 1]?.id,
  };
  return { ...layout, workspace: { ...layout.workspace,
    panelPlacements: { ...layout.workspace?.panelPlacements, [panelId]: placement },
  } };
}

export function restorePanelPlacement(layout, panel) {
  // Compatibility for older callers: reopening follows the same right-edge rule.
  return addPanelToRight(layout, panel);
}

// ---------------------------------------------------------------------------
// Drop zone detection (adapted from waveterm's determineDropDirection)
// ---------------------------------------------------------------------------

/**
 * Determine which drop zone the cursor is in relative to a target rect.
 * Center zone = middle 60% on both axes.
 * Edge zones determined via diagonal math.
 *
 * @param {{ x: number, y: number }} cursorPos - Client cursor position
 * @param {{ left: number, top: number, width: number, height: number }} targetRect
 * @returns {'center'|'top'|'bottom'|'left'|'right'|null}
 */
export function determineDropZone(cursorPos, targetRect) {
  const { left, top, width, height } = targetRect;
  const x = cursorPos.x - left;
  const y = cursorPos.y - top;

  // Out of bounds
  if (x < 0 || x > width || y < 0 || y > height) return null;

  // Center: middle 60% on both axes (20% margin each side)
  const margin = 0.2;
  if (
    x > width * margin && x < width * (1 - margin) &&
    y > height * margin && y < height * (1 - margin)
  ) {
    return 'center';
  }

  // Edge detection using diagonal math (from waveterm)
  // diagonal1: top-left to bottom-right
  // diagonal2: top-right to bottom-left
  const d1 = y * width - x * height;
  const d2 = y * width + x * height - height * width;

  if (d1 <= 0 && d2 <= 0) return 'top';
  if (d1 >= 0 && d2 >= 0) return 'bottom';
  if (d1 >= 0 && d2 <= 0) return 'left';
  if (d1 <= 0 && d2 >= 0) return 'right';

  return null;
}

// ---------------------------------------------------------------------------
// Layout queries
// ---------------------------------------------------------------------------

/**
 * Find a panel's location in the layout.
 * @returns {{ columnIndex: number, panelIndex: number } | null}
 */
export function findPanelLocation(layout, panelId) {
  if (!layout || !layout.columns) return null;
  for (let ci = 0; ci < layout.columns.length; ci++) {
    const col = layout.columns[ci];
    for (let pi = 0; pi < col.panels.length; pi++) {
      if (col.panels[pi].panelId === panelId) {
        return { columnIndex: ci, panelIndex: pi };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layout mutations (all return new layout objects — immutable)
// ---------------------------------------------------------------------------

/**
 * Remove a panel from the layout, including hidden panel storage.
 * Does NOT simplify afterwards.
 */
export function removePanelFromLayout(layout, panelId) {
  const loc = findPanelLocation(layout, panelId);
  const existingHiddenPanels = layout?.hiddenPanels;
  const hiddenPanels = Array.isArray(layout?.hiddenPanels)
    ? layout.hiddenPanels.filter(p => p.panelId !== panelId)
    : layout?.hiddenPanels;
  const hiddenChanged = Array.isArray(existingHiddenPanels)
    && hiddenPanels.length !== existingHiddenPanels.length;

  if (!loc) {
    if (!hiddenChanged) return layout;
    return { ...layout, hiddenPanels };
  }

  const columns = layout.columns.map((col, ci) => {
    if (ci !== loc.columnIndex) return col;
    return {
      ...col,
      panels: col.panels.filter(p => p.panelId !== panelId)
    };
  });

  if (!Array.isArray(existingHiddenPanels)) {
    return { ...layout, columns };
  }

  return { ...layout, columns, hiddenPanels };
}

/**
 * Center drop: add dragged panel to target panel's column stack.
 * If target is in a single-panel column, it becomes a 2-panel stack.
 * If target is in an existing stack, dragged panel appends after target.
 */
export function executeStackDrop(layout, targetPanelId, draggedPanelId) {
  return executeEdgeDrop(layout, targetPanelId, draggedPanelId, 'bottom');
}

/**
 * Edge drop: top/bottom inserts into stack, left/right creates new column.
 */
export function executeEdgeDrop(layout, targetPanelId, draggedPanelId, zone, newColumnWidth = NEW_PANEL_WIDTH) {
  const dragLoc = findPanelLocation(layout, draggedPanelId);
  const targetLoc = findPanelLocation(layout, targetPanelId);
  if (!dragLoc || !targetLoc) return layout;
  if (draggedPanelId === targetPanelId) return layout;

  const sourceColumn = layout.columns[dragLoc.columnIndex];
  const draggedPanel = sourceColumn.panels[dragLoc.panelIndex];

  // Reordering an intact column keeps its width and all other column ratios.
  if ((zone === 'left' || zone === 'right') && sourceColumn.panels.length === 1) {
    const columns = layout.columns.filter(col => col.id !== sourceColumn.id);
    const targetIndex = columns.findIndex(col => col.id === layout.columns[targetLoc.columnIndex].id);
    columns.splice(targetIndex + (zone === 'right' ? 1 : 0), 0, sourceColumn);
    return { ...layout, columns };
  }

  let result = removePanelFromLayout(layout, draggedPanelId);
  const sameColumn = dragLoc.columnIndex === targetLoc.columnIndex;
  if (!sameColumn || zone === 'left' || zone === 'right') result = simplifyLayout(result);

  // Recalculate target location after removal
  const newTargetLoc = findPanelLocation(result, targetPanelId);
  if (!newTargetLoc) return layout;

  if (zone === 'top' || zone === 'bottom') {
    // Insert into the target's column stack
    const col = result.columns[newTargetLoc.columnIndex];
    const newPanels = sameColumn ? [...col.panels] : fitSizes(col.panels, 50);
    const insertIndex = zone === 'top' ? newTargetLoc.panelIndex : newTargetLoc.panelIndex + 1;
    newPanels.splice(insertIndex, 0, { ...draggedPanel, size: sameColumn ? draggedPanel.size : 50 });

    const columns = result.columns.map((c, i) => {
      if (i !== newTargetLoc.columnIndex) return c;
      return { ...c, panels: newPanels };
    });

    return simplifyLayout({ ...result, columns });
  }

  if (zone === 'left' || zone === 'right') {
    const insertIndex = zone === 'left' ? newTargetLoc.columnIndex : newTargetLoc.columnIndex + 1;
    return insertPanelColumn(result, draggedPanel, insertIndex, newColumnWidth);
  }

  return layout;
}

// ---------------------------------------------------------------------------
// Backward compatibility
// ---------------------------------------------------------------------------

/**
 * Flatten a v2 LayoutRow into a v1-style panels array.
 * Used to maintain backward compatibility with code that reads `panels`.
 */
export function flattenLayoutToPanels(layout) {
  if (!layout || !layout.columns) return [];

  const panels = [];
  let order = 0;

  for (const col of layout.columns) {
    for (const p of col.panels) {
      panels.push({
        id: p.panelId,
        type: p.type,
        size: col.panels.length === 1 ? col.size : round2(col.size * p.size / 100),
        order: order++,
        visible: true
      });
    }
  }

  // Add hidden panels
  if (layout.hiddenPanels) {
    for (const p of layout.hiddenPanels) {
      panels.push({
        id: p.panelId,
        type: p.type,
        size: 0,
        order: order++,
        visible: false
      });
    }
  }

  return panels;
}
