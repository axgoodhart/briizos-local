import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { getLayout, saveLayout as saveLayoutFirestore } from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';

const DEFAULT_LAYOUT = {
  panels: [
    { id: 'sources', type: 'sources', size: 20, order: 0, visible: true },
    { id: 'interaction', type: 'interaction', size: 60, order: 1, visible: true },
    { id: 'tasks', type: 'tasks', size: 20, order: 2, visible: true }
  ],
  version: 1
};

export function useLayout() {
  const layoutResizeDebugEnabled = typeof window !== 'undefined' && (
    import.meta.env.DEV || window.__BRIIZ_PANEL_DEBUG__ === true
  );
  const [panels, setPanels] = useState(DEFAULT_LAYOUT.panels);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  const deduplicatePanels = (panelsList) => {
    const seen = new Set();
    return panelsList.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  };

  // Load layout from Firestore
  const loadLayout = useCallback(async () => {
    const uid = getCurrentUid();
    if (!uid) {
      setPanels(DEFAULT_LAYOUT.panels);
      setIsLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    try {
      const result = await getLayout();
      if (result && result.config && result.config.panels) {
        const loadedPanels = result.config.panels;
        const ids = loadedPanels.map(p => p.id);
        const hasDuplicates = ids.length !== new Set(ids).size;

        if (hasDuplicates) {
          setPanels(DEFAULT_LAYOUT.panels);
          setTimeout(() => saveLayout(DEFAULT_LAYOUT.panels), 100);
        } else {
          setPanels(loadedPanels);
        }
        setLastSaved(result.updatedAt);
      } else {
        setPanels(DEFAULT_LAYOUT.panels);
      }
    } catch (error) {
      logger.error('ui', 'Failed to load layout', error?.message);
      setPanels(DEFAULT_LAYOUT.panels);
    } finally {
      setIsLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  // Save layout to Firestore
  const saveLayout = useCallback(async (panelsToSave) => {
    setIsSaving(true);
    try {
      const config = {
        panels: panelsToSave,
        version: DEFAULT_LAYOUT.version
      };
      await saveLayoutFirestore(config);
      setLastSaved(new Date().toISOString());
    } catch (error) {
      logger.error('ui', 'Failed to save layout', error?.message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced save
  const debouncedSave = useCallback((panelsToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLayout(panelsToSave);
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

  // Auto-save when panels change
  useEffect(() => {
    if (hasLoadedRef.current && !isLoading) {
      debouncedSave(panels);
    }
  }, [panels, isLoading, debouncedSave]);

  const addPanel = useCallback((panel) => {
    const id = panel.id || `${panel.type}-${Date.now()}`;
    setPanels(prev => {
      if (prev.some(p => p.id === id)) {
        return prev;
      }

      const maxOrder = prev.reduce((max, p) => Math.max(max, p.order), -1);
      const newPanel = {
        id,
        type: panel.type,
        size: panel.size || 20,
        order: panel.order ?? maxOrder + 1,
        visible: panel.visible !== false,
        ...panel,
        id
      };
      return [...prev, newPanel];
    });
    return id;
  }, []);

  const removePanel = useCallback((panelId) => {
    setPanels(prev => {
      const filtered = prev.filter(p => p.id !== panelId);
      const totalSize = filtered.reduce((sum, p) => sum + (p.visible ? p.size : 0), 0);
      if (totalSize > 0 && totalSize !== 100) {
        const scale = 100 / totalSize;
        return filtered.map(p => ({
          ...p,
          size: p.visible ? Math.round(p.size * scale) : p.size
        }));
      }
      return filtered;
    });
  }, []);

  const updatePanel = useCallback((panelId, updates) => {
    setPanels(prev => prev.map(p =>
      p.id === panelId ? { ...p, ...updates } : p
    ));
  }, []);

  const updatePanelSizes = useCallback((sizeMap) => {
    setPanels(prev => {
      let changed = false;
      const changes = [];
      const next = prev.map(p => {
        if (sizeMap[p.id] === undefined) return p;
        if (p.size === sizeMap[p.id]) return p;
        changed = true;
        changes.push({
          id: p.id,
          from: p.size,
          to: sizeMap[p.id]
        });
        return { ...p, size: sizeMap[p.id] };
      });
      if (changed && layoutResizeDebugEnabled) {
        console.debug('[useLayout] panel size updates', changes);
      }
      return changed ? next : prev;
    });
  }, [layoutResizeDebugEnabled]);

  const togglePanelVisibility = useCallback((panelId) => {
    setPanels(prev => prev.map(p =>
      p.id === panelId ? { ...p, visible: !p.visible } : p
    ));
  }, []);

  const resetLayout = useCallback(() => {
    setPanels(DEFAULT_LAYOUT.panels);
  }, []);

  const getSortedPanels = useCallback(() => {
    return [...panels].sort((a, b) => a.order - b.order);
  }, [panels]);

  const getVisiblePanels = useCallback(() => {
    const visible = getSortedPanels().filter(p => p.visible);
    const seen = new Set();
    return visible.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [getSortedPanels]);

  const getPanel = useCallback((panelId) => {
    return panels.find(p => p.id === panelId);
  }, [panels]);

  const getPanelByType = useCallback((type) => {
    return panels.find(p => p.type === type);
  }, [panels]);

  const reorderPanel = useCallback((panelId, newOrder) => {
    setPanels(prev => {
      const panel = prev.find(p => p.id === panelId);
      if (!panel) return prev;
      const oldOrder = panel.order;
      return prev.map(p => {
        if (p.id === panelId) {
          return { ...p, order: newOrder };
        }
        if (newOrder < oldOrder) {
          if (p.order >= newOrder && p.order < oldOrder) {
            return { ...p, order: p.order + 1 };
          }
        } else if (newOrder > oldOrder) {
          if (p.order > oldOrder && p.order <= newOrder) {
            return { ...p, order: p.order - 1 };
          }
        }
        return p;
      });
    });
  }, []);

  const swapPanels = useCallback((panelIdA, panelIdB) => {
    setPanels(prev => {
      const panelA = prev.find(p => p.id === panelIdA);
      const panelB = prev.find(p => p.id === panelIdB);
      if (!panelA || !panelB) return prev;
      return prev.map(p => {
        if (p.id === panelIdA) return { ...p, order: panelB.order };
        if (p.id === panelIdB) return { ...p, order: panelA.order };
        return p;
      });
    });
  }, []);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveLayout(panels);
  }, [panels, saveLayout]);

  return {
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
    DEFAULT_LAYOUT
  };
}

export default useLayout;
