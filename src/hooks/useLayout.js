import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import logger from '../lib/logger';
import {
  migrateFlatToColumns,
  rememberPanelPlacement,
  addPanelToRight,
  insertPanelColumn,
  NEW_PANEL_WIDTH,
  simplifyLayout,
  flattenLayoutToPanels,
  findPanelLocation,
  removePanelFromLayout,
  executeStackDrop,
  executeEdgeDrop
} from '../lib/layoutUtils';

const DEFAULT_LAYOUT_V1 = {
  panels: [
    { id: 'sources', type: 'sources', size: 20, order: 0, visible: true },
    { id: 'interaction', type: 'interaction', size: 60, order: 1, visible: true },
    { id: 'tasks', type: 'tasks', size: 20, order: 2, visible: true }
  ],
  version: 1
};

const DEFAULT_LAYOUT_V2 = migrateFlatToColumns(DEFAULT_LAYOUT_V1.panels);

function newColumnWidth(columnCount) {
  if (columnCount <= 1) return 100;
  const row = document.querySelector('.tile-layout-content');
  if (!row || !row.clientWidth) return NEW_PANEL_WIDTH;
  const styles = getComputedStyle(row);
  const gap = parseFloat(styles.columnGap) || 0;
  const separator = row.querySelector('.resize-handle.horizontal');
  const separatorWidth = separator?.getBoundingClientRect().width
    ?? (parseFloat(styles.getPropertyValue('--layout-resize-handle-size')) || 0);
  const panelSpace = row.clientWidth - (columnCount - 1) * (separatorWidth + 2 * gap);
  if (panelSpace <= 0) return NEW_PANEL_WIDTH;
  // The resize library percentages exclude gutters. Compensate so the new
  // panel itself occupies 20% of the window, including themes with wider handles.
  return Math.min(95, window.innerWidth * NEW_PANEL_WIDTH / panelSpace);
}

export function useLayout() {
  const layoutResizeDebugEnabled = typeof window !== 'undefined' && (
    import.meta.env.DEV || window.__BRIIZ_PANEL_DEBUG__ === true
  );

  // Primary state: v2 LayoutRow
  const [layoutRow, setLayoutRow] = useState(DEFAULT_LAYOUT_V2);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Derived flat panels array for backward compatibility
  const panels = useMemo(() => flattenLayoutToPanels(layoutRow), [layoutRow]);

  // Load the authoritative workspace layout from briizos.db.
  const loadLayout = useCallback(async () => {
    try {
      const result = await window.api?.localData?.workspace?.getLayout();
      if (result && result.config) {
        if (result.config.version === 2 && result.config.columns) {
          // v2 format — use directly
          setLayoutRow(simplifyLayout(result.config));
        } else if (result.config.panels) {
          // v1 format — migrate
          const migrated = migrateFlatToColumns(result.config.panels);
          setLayoutRow(migrated);
        } else {
          setLayoutRow(DEFAULT_LAYOUT_V2);
        }
        setLastSaved(result.updatedAt);
      } else {
        setLayoutRow(DEFAULT_LAYOUT_V2);
      }
    } catch (error) {
      logger.error('ui', 'Failed to load layout', error?.message);
      setLayoutRow(DEFAULT_LAYOUT_V2);
    } finally {
      setIsLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  // Save layout locally; cloud availability and auth are irrelevant.
  const saveLayout = useCallback(async (layoutToSave) => {
    setIsSaving(true);
    try {
      await window.api.localData.workspace.saveLayout(layoutToSave);
      logger.info('ui.layout', 'Panel positions and proportions saved', { columns: layoutToSave.columns.length });
      setLastSaved(new Date().toISOString());
    } catch (error) {
      logger.error('ui', 'Failed to save layout', error?.message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced save
  const debouncedSave = useCallback((layoutToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLayout(layoutToSave);
    }, 500);
  }, [saveLayout]);

  // Load layout on mount
  useEffect(() => {
    loadLayout();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadLayout]);

  // Auto-save when layoutRow changes
  useEffect(() => {
    if (hasLoadedRef.current && !isLoading) {
      debouncedSave(layoutRow);
    }
  }, [layoutRow, isLoading, debouncedSave]);

  // ---- v2 layout operations ----

  const getLayoutRow = useCallback(() => layoutRow, [layoutRow]);

  /**
   * Update horizontal column widths from resize events.
   * sizeMap: { [columnId]: newSizePercent }
   */
  const updateColumnSizes = useCallback((sizeMap) => {
    setLayoutRow(prev => {
      let changed = false;
      const columns = prev.columns.map(col => {
        if (sizeMap[col.id] === undefined) return col;
        const newSize = Number(sizeMap[col.id].toFixed(2));
        if (col.size === newSize) return col;
        changed = true;
        return { ...col, size: newSize };
      });
      if (!changed) return prev;
      if (layoutResizeDebugEnabled) {
        console.debug('[useLayout] column size updates', sizeMap);
      }
      return { ...prev, columns };
    });
  }, [layoutResizeDebugEnabled]);

  /**
   * Update vertical panel heights within a specific column.
   * sizeMap: { [panelId]: newSizePercent }
   */
  const updateStackSizes = useCallback((columnId, sizeMap) => {
    setLayoutRow(prev => {
      let changed = false;
      const columns = prev.columns.map(col => {
        if (col.id !== columnId) return col;
        const panels = col.panels.map(p => {
          if (sizeMap[p.panelId] === undefined) return p;
          const newSize = Number(sizeMap[p.panelId].toFixed(2));
          if (p.size === newSize) return p;
          changed = true;
          return { ...p, size: newSize };
        });
        return { ...col, panels };
      });
      if (!changed) return prev;
      if (layoutResizeDebugEnabled) {
        console.debug('[useLayout] stack size updates', columnId, sizeMap);
      }
      return { ...prev, columns };
    });
  }, [layoutResizeDebugEnabled]);

  /**
   * Main drag-and-drop handler.
   * dropZone: 'center' | 'top' | 'bottom' | 'left' | 'right'
   */
  const movePanel = useCallback((draggedPanelId, targetPanelId, dropZone) => {
    setLayoutRow(prev => {
      let result;
      if (dropZone === 'center') {
        result = executeStackDrop(prev, targetPanelId, draggedPanelId);
      } else {
        result = executeEdgeDrop(prev, targetPanelId, draggedPanelId, dropZone, newColumnWidth(prev.columns.length + 1));
      }
      if (result !== prev) {
        logger.info('ui.layout', ['center', 'top', 'bottom'].includes(dropZone)
          ? 'Panel moved into a stack; the other panels retain their proportions'
          : 'Panel moved to a column; the other columns retain their proportions', {
          panelId: draggedPanelId,
          targetPanelId,
          dropZone,
          columns: result.columns.map(column => ({
            width: column.size,
            panels: column.panels.map(panel => ({ panelId: panel.panelId, height: panel.size })),
          })),
        });
      }
      return result;
    });
  }, []);

  // ---- Legacy operations (operate on layoutRow internally) ----

  const addPanel = useCallback((panel) => {
    const id = panel.id || `${panel.type}-${Date.now()}`;
    setLayoutRow(prev => {
      // Check if panel already exists
      if (findPanelLocation(prev, id)) return prev;

      logger.info('ui.layout', 'Panel opened on the right; existing columns shrink in proportion', {
        panelId: id, windowWidthPercent: prev.columns.length ? NEW_PANEL_WIDTH : 100,
      });
      return addPanelToRight(prev, { panelId: id, type: panel.type }, newColumnWidth(prev.columns.length + 1));
    });
    return id;
  }, []);

  const removePanel = useCallback((panelId) => {
    setLayoutRow(prev => {
      const result = removePanelFromLayout(rememberPanelPlacement(prev, panelId), panelId);
      logger.info('ui.layout', 'Panel closed; remaining panels expand in proportion', { panelId });
      return simplifyLayout(result);
    });
  }, []);

  const updatePanel = useCallback((panelId, updates) => {
    setLayoutRow(prev => {
      const columns = prev.columns.map(col => ({
        ...col,
        panels: col.panels.map(p => {
          if (p.panelId !== panelId) return p;
          return { ...p, ...updates };
        })
      }));
      return { ...prev, columns };
    });
  }, []);

  /**
   * Legacy updatePanelSizes — maps panel IDs to column sizes for single-panel columns.
   * Kept for backward compatibility with code that still calls onLayoutChange(sizeMap).
   */
  const updatePanelSizes = useCallback((sizeMap) => {
    setLayoutRow(prev => {
      let changed = false;
      const columns = prev.columns.map(col => {
        // For single-panel columns, check if the panel ID is in the sizeMap
        if (col.panels.length === 1) {
          const panelId = col.panels[0].panelId;
          if (sizeMap[panelId] !== undefined) {
            const newSize = Number(sizeMap[panelId].toFixed(2));
            if (col.size !== newSize) {
              changed = true;
              return { ...col, size: newSize };
            }
          }
        }
        // For column IDs in sizeMap
        if (sizeMap[col.id] !== undefined) {
          const newSize = Number(sizeMap[col.id].toFixed(2));
          if (col.size !== newSize) {
            changed = true;
            return { ...col, size: newSize };
          }
        }
        return col;
      });
      return changed ? { ...prev, columns } : prev;
    });
  }, []);

  const togglePanelVisibility = useCallback((panelId) => {
    setLayoutRow(prev => {
      // Check if panel is in columns (visible)
      const loc = findPanelLocation(prev, panelId);
      if (loc) {
        // Move to hiddenPanels
        const panel = prev.columns[loc.columnIndex].panels[loc.panelIndex];
        const result = removePanelFromLayout(rememberPanelPlacement(prev, panelId), panelId);
        logger.info('ui.layout', 'Panel hidden; remaining panels expand in proportion', { panelId });
        return simplifyLayout({
          ...result,
          hiddenPanels: [...(result.hiddenPanels || []), { panelId: panel.panelId, type: panel.type }]
        });
      }

      // Check if panel is in hiddenPanels
      const hidden = (prev.hiddenPanels || []).find(p => p.panelId === panelId);
      if (hidden) {
        logger.info('ui.layout', 'Panel shown on the right; existing columns shrink in proportion', { panelId });
        return addPanelToRight(prev, hidden, newColumnWidth(prev.columns.length + 1));
      }

      return prev;
    });
  }, []);

  const resetLayout = useCallback(() => {
    logger.info('ui.layout', 'Panel layout reset to its default arrangement');
    setLayoutRow(DEFAULT_LAYOUT_V2);
  }, []);

  const getSortedPanels = useCallback(() => {
    return [...panels].sort((a, b) => a.order - b.order);
  }, [panels]);

  const getVisiblePanels = useCallback(() => {
    return panels.filter(p => p.visible);
  }, [panels]);

  const getPanel = useCallback((panelId) => {
    return panels.find(p => p.id === panelId);
  }, [panels]);

  const getPanelByType = useCallback((type) => {
    return panels.find(p => p.type === type);
  }, [panels]);

  const swapPanels = useCallback((panelIdA, panelIdB) => {
    setLayoutRow(prev => {
      const locA = findPanelLocation(prev, panelIdA);
      const locB = findPanelLocation(prev, panelIdB);
      if (!locA || !locB) return prev;

      const panelA = prev.columns[locA.columnIndex].panels[locA.panelIndex];
      const panelB = prev.columns[locB.columnIndex].panels[locB.panelIndex];

      const columns = prev.columns.map((col, ci) => ({
        ...col,
        panels: col.panels.map((p, pi) => {
          if (ci === locA.columnIndex && pi === locA.panelIndex) return { ...panelB };
          if (ci === locB.columnIndex && pi === locB.panelIndex) return { ...panelA };
          return p;
        })
      }));

      return { ...prev, columns };
    });
  }, []);

  const reorderPanel = useCallback((panelId, newOrder) => {
    // In v2, "order" is implicit from column/panel position.
    // This is a legacy operation — move panel to a new column position.
    setLayoutRow(prev => {
      const loc = findPanelLocation(prev, panelId);
      if (!loc) return prev;

      const panel = prev.columns[loc.columnIndex].panels[loc.panelIndex];
      const sourceColumn = prev.columns[loc.columnIndex];
      logger.info('ui.layout', 'Panel reordered while preserving the other panel proportions', { panelId, newOrder });
      if (sourceColumn.panels.length === 1) {
        const columns = prev.columns.filter(column => column.id !== sourceColumn.id);
        columns.splice(Math.max(0, Math.min(newOrder, columns.length)), 0, sourceColumn);
        return { ...prev, columns };
      }
      const result = simplifyLayout(removePanelFromLayout(prev, panelId));
      return insertPanelColumn(result, panel, newOrder, newColumnWidth(result.columns.length + 1));
    });
  }, []);

  /**
   * Merge partial workspace state (overlay visibility, drawer position, etc.).
   * Only updates keys provided — other workspace keys are preserved.
   */
  const updateWorkspace = useCallback((partial) => {
    setLayoutRow(prev => ({
      ...prev,
      workspace: { ...(prev.workspace || {}), ...partial }
    }));
  }, []);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveLayout(layoutRow);
  }, [layoutRow, saveLayout]);

  return {
    // v2 API
    layoutRow,
    getLayoutRow,
    updateColumnSizes,
    updateStackSizes,
    movePanel,
    updateWorkspace,

    // Legacy API (backward compat)
    panels,
    isLoading,
    isSaving,
    lastSaved,
    addPanel,
    removePanel,
    updatePanel,
    updatePanelSizes,
    togglePanelVisibility,
    resetLayout,
    reorderPanel,
    swapPanels,
    forceSave,
    loadLayout,
    getSortedPanels,
    getVisiblePanels,
    getPanel,
    getPanelByType,
    DEFAULT_LAYOUT: DEFAULT_LAYOUT_V1
  };
}

export default useLayout;
