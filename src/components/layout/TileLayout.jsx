import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import logger from '../../lib/logger';
import './layout.css';

// Debug counter
let tileLayoutRenderCount = 0;

// Drag type constant for react-dnd
const PANEL_TYPE = 'PANEL';
const PANEL_RESIZE_DEBUG = typeof window !== 'undefined' && (
  import.meta.env.DEV || window.__BRIIZ_PANEL_DEBUG__ === true
);

const debugPanelResize = (...args) => {
  if (PANEL_RESIZE_DEBUG) {
    console.debug('[TileLayout resize]', ...args);
  }
};

const toPercentSize = (value, fallbackPercent) => {
  if (typeof value === 'string') return value;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return `${numericValue}%`;
  }
  return `${fallbackPercent}%`;
};

/**
 * DraggablePanel - Wrapper component that makes panels draggable and droppable
 * Uses react-dnd hooks for drag-and-drop functionality
 */
function DraggablePanel({ panel, children, onSwap }) {
  const wrapperRef = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: PANEL_TYPE,
    item: { id: panel.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: PANEL_TYPE,
    drop: (draggedItem) => {
      if (draggedItem.id !== panel.id) {
        onSwap(draggedItem.id, panel.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.getItem()?.id !== panel.id
    })
  });

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return undefined;

    const disconnectDrop = drop(wrapperEl);
    const dragHandle = wrapperEl.querySelector('.panel-header, .actiondeck-header');
    const disconnectDrag = drag(dragHandle || wrapperEl);

    return () => {
      if (typeof disconnectDrag === 'function') disconnectDrag();
      if (typeof disconnectDrop === 'function') disconnectDrop();
    };
  }, [drag, drop, panel.id]);

  return (
    <div
      ref={wrapperRef}
      className={`panel-wrapper ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-target' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * TileLayout - A resizable grid layout component using react-resizable-panels
 *
 * Inspired by Waveterm's TileLayout approach, this component provides:
 * - Resizable panels with drag handles
 * - Panels passed via props from parent (single useLayout instance)
 * - Support for horizontal panel arrangements
 * - Layout change callbacks for state persistence
 *
 * @param {Object} props
 * @param {Array} props.panels - Array of panel configurations { id, type, size, visible }
 * @param {Function} props.renderPanel - Callback to render panel content: (panel) => ReactNode
 * @param {Function} props.onLayoutChange - Called when panel sizes change
 * @param {string} props.direction - Layout direction: 'horizontal' or 'vertical' (default: 'horizontal')
 * @param {string} props.className - Additional CSS class names
 */
export function TileLayout({
  panels,
  renderPanel,
  onLayoutChange,
  onSwapPanels,
  direction = 'horizontal',
  className = ''
}) {
  tileLayoutRenderCount++;
  const currentRender = tileLayoutRenderCount;
  logger.debug('ui', `TileLayout render #${currentRender}`, panels?.map(p => p.id));

  // Track mount/unmount
  useEffect(() => {
    logger.debug('ui', `TileLayout MOUNTED (render #${currentRender})`);
    return () => {
      logger.debug('ui', `TileLayout UNMOUNTED (render #${currentRender})`);
    };
  }, []);

  // Memoize sorted visible panels (with deduplication)
  const visiblePanels = useMemo(() => {
    if (!panels) return [];
    const filtered = panels
      .filter(p => p.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Deduplicate by ID (keep first occurrence)
    const seen = new Set();
    return filtered.filter(p => {
      if (seen.has(p.id)) {
        logger.warn('ui', `TileLayout: Duplicate panel ID "${p.id}" filtered out`);
        return false;
      }
      seen.add(p.id);
      return true;
    });
  }, [panels]);

  /**
   * Handle panel resize - called by react-resizable-panels when layout changes
   * Receives a Layout object: { [panelId]: sizePercent }
   */
  const handleLayoutChange = useCallback((layout) => {
    if (!layout || Object.keys(layout).length === 0) return;

    // layout is already a map of id -> size percentage
    const sizeMap = {};
    Object.entries(layout).forEach(([id, size]) => {
      sizeMap[id] = Number(size.toFixed(2));
    });

    debugPanelResize('group layout change', sizeMap);

    // Call external callback if provided
    if (onLayoutChange) {
      onLayoutChange(sizeMap);
    }
  }, [onLayoutChange]);

  /**
   * Handle panel swap via drag-and-drop
   */
  const handleSwapPanels = useCallback((draggedId, targetId) => {
    if (onSwapPanels) {
      onSwapPanels(draggedId, targetId);
    }
  }, [onSwapPanels]);

  const handleSeparatorPointerDown = useCallback((separatorId, orientation, event) => {
    debugPanelResize('separator pointerdown', {
      separatorId,
      orientation,
      x: event.clientX,
      y: event.clientY
    });

    const onPointerUp = (upEvent) => {
      debugPanelResize('separator pointerup', {
        separatorId,
        orientation,
        x: upEvent.clientX,
        y: upEvent.clientY
      });
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointerup', onPointerUp);
  }, []);

  // If no visible panels, render nothing
  if (visiblePanels.length === 0) {
    return (
      <div className={`tile-layout ${className}`}>
        <div className="tile-layout-empty">
          No panels to display
        </div>
      </div>
    );
  }

  // Calculate default layout based on panel configurations
  const defaultLayout = useMemo(() => {
    const layout = {};
    const defaultSize = Math.floor(100 / visiblePanels.length);
    visiblePanels.forEach(p => {
      layout[p.id] = p.size || defaultSize;
    });
    logger.debug('ui', 'TileLayout defaultLayout computed', layout);
    return layout;
  }, [visiblePanels]);

  // Create a key that changes when panel order changes, forcing Group to remount
  const groupKey = useMemo(() => {
    const key = visiblePanels.map(p => p.id).join('-');
    logger.debug('ui', `TileLayout groupKey computed: "${key}"`);
    return key;
  }, [visiblePanels]);

  logger.debug('ui', `TileLayout rendering Group key="${groupKey}", ${visiblePanels.length} panels`);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`tile-layout ${className}`}>
        <Group
          key={groupKey}
          orientation={direction}
          onLayoutChange={handleLayoutChange}
          defaultLayout={defaultLayout}
          className="tile-layout-content"
        >
          {visiblePanels.map((panel, index) => (
            <React.Fragment key={panel.id}>
              <Panel
                id={panel.id}
                minSize="5%"
                maxSize="90%"
                onResize={(size) => {
                  debugPanelResize('panel onResize', panel.id, {
                    percent: Number(size.asPercentage.toFixed(2)),
                    pixels: Math.round(size.inPixels)
                  });
                }}
                className="resizable-panel"
              >
                <DraggablePanel panel={panel} onSwap={handleSwapPanels}>
                  {renderPanel ? renderPanel(panel) : (
                    <div className="panel-content">
                      <div className="widget-empty">
                        Panel: {panel.type || panel.id}
                      </div>
                    </div>
                  )}
                </DraggablePanel>
              </Panel>

              {/* Add resize handle between panels (not after last panel) */}
              {index < visiblePanels.length - 1 && (
                <Separator
                  className={`resize-handle ${direction}`}
                  onPointerDown={(event) => handleSeparatorPointerDown(`sep-${panel.id}-${index}`, direction, event)}
                />
              )}
            </React.Fragment>
          ))}
        </Group>
      </div>
    </DndProvider>
  );
}

/**
 * TileLayoutWithControls - TileLayout with panel visibility controls
 * Provides additional UI for toggling panel visibility
 *
 * NOTE: panels must be passed via props from a single useLayout() instance
 * in the parent component to avoid duplicate state issues.
 */
export function TileLayoutWithControls({
  panels,
  isLoading,
  renderPanel,
  onLayoutChange,
  onSwapPanels,
  direction = 'horizontal',
  className = ''
}) {
  if (isLoading) {
    return (
      <div className={`tile-layout ${className}`}>
        <div className="tile-layout-loading">
          Loading layout...
        </div>
      </div>
    );
  }

  return (
    <div className={`tile-layout-container ${className}`}>
      {/* Panel visibility controls could be added here */}
      <TileLayout
        panels={panels}
        renderPanel={renderPanel}
        onLayoutChange={onLayoutChange}
        onSwapPanels={onSwapPanels}
        direction={direction}
      />
    </div>
  );
}

/**
 * NestedTileLayout - Supports nested horizontal/vertical panel groups
 * For more complex layouts with panels containing sub-panels
 */
export function NestedTileLayout({
  layout,
  renderPanel,
  onLayoutChange,
  className = ''
}) {
  // Recursively render nested panel groups
  const renderPanelGroup = (node, depth = 0) => {
    if (!node) return null;

    // Leaf node - render panel content
    if (node.type && !node.children) {
      return renderPanel ? renderPanel(node) : (
        <div className="panel-content">
          <div className="widget-empty">
            Panel: {node.type || node.id}
          </div>
        </div>
      );
    }

    // Container node - render nested Group
    const children = node.children || [];
    const orientation = node.direction || 'horizontal';

    return (
      <Group
        orientation={orientation}
        className={`tile-layout-nested depth-${depth}`}
      >
        {children.map((child, index) => (
          <React.Fragment key={child.id || index}>
            <Panel
              id={child.id}
              defaultSize={toPercentSize(child.size, Math.floor(100 / children.length))}
              minSize="5%"
              className="resizable-panel"
            >
              {renderPanelGroup(child, depth + 1)}
            </Panel>

            {index < children.length - 1 && (
              <Separator className={`resize-handle ${orientation}`} />
            )}
          </React.Fragment>
        ))}
      </Group>
    );
  };

  return (
    <div className={`tile-layout nested ${className}`}>
      {renderPanelGroup(layout)}
    </div>
  );
}

export default TileLayout;
