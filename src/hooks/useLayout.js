import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import logger from '../lib/logger';
import {
  migrateFlatToColumns,
  rememberPanelPlacement,
  restorePanelPlacement,
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
          setLayoutRow(result.config);
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
      logger.info('ui.layout', 'Panel layout and remembered placements saved', { columns: layoutToSave.columns.length });
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
        result = executeEdgeDrop(prev, targetPanelId, draggedPanelId, dropZone);
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

      logger.info('ui', 'Panel opened at its remembered column and width', { panelId: id });
      return restorePanelPlacement(prev, { panelId: id, type: panel.type, width: panel.size });
    });
    return id;
  }, []);

  const removePanel = useCallback((panelId) => {
    setLayoutRow(prev => {
      const result = removePanelFromLayout(rememberPanelPlacement(prev, panelId), panelId);
      logger.info('ui', 'Panel closed; placement remembered', { panelId });
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
        return simplifyLayout({
          ...result,
          hiddenPanels: [...(result.hiddenPanels || []), { panelId: panel.panelId, type: panel.type }]
        });
      }

      // Check if panel is in hiddenPanels
      const hidden = (prev.hiddenPanels || []).find(p => p.panelId === panelId);
      if (hidden) {
        logger.info('ui', 'Panel restored to its remembered placement', { panelId });
        return restorePanelPlacement(prev, hidden);
      }

      return prev;
    });
  }, []);

  const resetLayout = useCallback(() => {
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
      let result = removePanelFromLayout(prev, panelId);

      const targetColIndex = Math.min(newOrder, result.columns.length);
      const newColumn = {
        id: `col-${Date.now()}`,
        size: 20,
        panels: [{ ...panel, size: 100 }]
      };

      const columns = [...result.columns];
      columns.splice(targetColIndex, 0, newColumn);

      return simplifyLayout({ ...result, columns });
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
