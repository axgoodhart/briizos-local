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

  // Renormalize column sizes
  const colTotal = columns.reduce((sum, c) => sum + c.size, 0);
  if (colTotal > 0 && Math.abs(colTotal - 100) > 0.5) {
    const scale = 100 / colTotal;
    columns = columns.map(c => ({ ...c, size: round2(c.size * scale) }));
  }

  // Renormalize panel sizes within each column
  columns = columns.map(col => {
    if (col.panels.length <= 1) return col;
    const panelTotal = col.panels.reduce((sum, p) => sum + p.size, 0);
    if (panelTotal > 0 && Math.abs(panelTotal - 100) > 0.5) {
      const scale = 100 / panelTotal;
      return {
        ...col,
        panels: col.panels.map(p => ({ ...p, size: round2(p.size * scale) }))
      };
    }
    return col;
  });

  // Preserve workspace and other top-level fields
  return { ...layout, columns };
}

function round2(n) {
  return Math.round(n * 100) / 100;
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
 * Remove a panel from the layout. Does NOT simplify afterwards.
 */
export function removePanelFromLayout(layout, panelId) {
  const loc = findPanelLocation(layout, panelId);
  if (!loc) return layout;

  const columns = layout.columns.map((col, ci) => {
    if (ci !== loc.columnIndex) return col;
    return {
      ...col,
      panels: col.panels.filter(p => p.panelId !== panelId)
    };
  });

  return { ...layout, columns };
}

/**
 * Center drop: add dragged panel to target panel's column stack.
 * If target is in a single-panel column, it becomes a 2-panel stack.
 * If target is in an existing stack, dragged panel appends after target.
 */
export function executeStackDrop(layout, targetPanelId, draggedPanelId) {
  const dragLoc = findPanelLocation(layout, draggedPanelId);
  const targetLoc = findPanelLocation(layout, targetPanelId);
  if (!dragLoc || !targetLoc) return layout;
  if (draggedPanelId === targetPanelId) return layout;

  // Get dragged panel info before removing
  const draggedPanel = layout.columns[dragLoc.columnIndex].panels[dragLoc.panelIndex];

  // Remove dragged panel from its current location
  let result = removePanelFromLayout(layout, draggedPanelId);

  // Recalculate target location after removal (indices may have shifted)
  const newTargetLoc = findPanelLocation(result, targetPanelId);
  if (!newTargetLoc) return layout;

  // Insert dragged panel after target in the target's column
  const col = result.columns[newTargetLoc.columnIndex];
  const newPanels = [...col.panels];
  const insertIndex = newTargetLoc.panelIndex + 1;
  newPanels.splice(insertIndex, 0, { ...draggedPanel });

  // Redistribute sizes equally
  const equalSize = round2(100 / newPanels.length);
  const resizedPanels = newPanels.map(p => ({ ...p, size: equalSize }));

  const columns = result.columns.map((c, i) => {
    if (i !== newTargetLoc.columnIndex) return c;
    return { ...c, panels: resizedPanels };
  });

  return simplifyLayout({ ...result, columns });
}

/**
 * Edge drop: top/bottom inserts into stack, left/right creates new column.
 */
export function executeEdgeDrop(layout, targetPanelId, draggedPanelId, zone) {
  const dragLoc = findPanelLocation(layout, draggedPanelId);
  const targetLoc = findPanelLocation(layout, targetPanelId);
  if (!dragLoc || !targetLoc) return layout;
  if (draggedPanelId === targetPanelId) return layout;

  const draggedPanel = layout.columns[dragLoc.columnIndex].panels[dragLoc.panelIndex];

  // Remove dragged panel
  let result = removePanelFromLayout(layout, draggedPanelId);

  // Recalculate target location after removal
  const newTargetLoc = findPanelLocation(result, targetPanelId);
  if (!newTargetLoc) return layout;

  if (zone === 'top' || zone === 'bottom') {
    // Insert into the target's column stack
    const col = result.columns[newTargetLoc.columnIndex];
    const newPanels = [...col.panels];
    const insertIndex = zone === 'top' ? newTargetLoc.panelIndex : newTargetLoc.panelIndex + 1;
    newPanels.splice(insertIndex, 0, { ...draggedPanel });

    // Redistribute sizes equally
    const equalSize = round2(100 / newPanels.length);
    const resizedPanels = newPanels.map(p => ({ ...p, size: equalSize }));

    const columns = result.columns.map((c, i) => {
      if (i !== newTargetLoc.columnIndex) return c;
      return { ...c, panels: resizedPanels };
    });

    return simplifyLayout({ ...result, columns });
  }

  if (zone === 'left' || zone === 'right') {
    // Create a new column for the dragged panel
    const targetCol = result.columns[newTargetLoc.columnIndex];
    const newColumn = {
      id: nextColId(),
      size: targetCol.size / 2,
      panels: [{ ...draggedPanel, size: 100 }]
    };

    // Halve the target column's size
    const columns = [...result.columns];
    columns[newTargetLoc.columnIndex] = { ...targetCol, size: targetCol.size / 2 };

    const insertIndex = zone === 'left' ? newTargetLoc.columnIndex : newTargetLoc.columnIndex + 1;
    columns.splice(insertIndex, 0, newColumn);

    return simplifyLayout({ ...result, columns });
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
