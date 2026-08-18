import React, { useCallback, useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { determineDropZone } from '../../lib/layoutUtils';
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
 * DraggablePanel - Wrapper with zone-based drop detection and visual overlay.
 */
function DraggablePanel({ panelId, componentId, children, onDrop, isFullscreen, onToggleFullscreen, onActivate }) {
  const wrapperRef = useRef(null);
  const [dropZone, setDropZone] = useState(null);

  const [{ isDragging }, drag] = useDrag({
    type: PANEL_TYPE,
    item: { id: panelId },
    canDrag: () => !isFullscreen,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: PANEL_TYPE,
    hover: (draggedItem, monitor) => {
      if (draggedItem.id === panelId) {
        setDropZone(null);
        return;
      }
      const offset = monitor.getClientOffset();
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (offset && rect) {
        const zone = determineDropZone(
          { x: offset.x, y: offset.y },
          { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        );
        setDropZone(zone);
      }
    },
    drop: (draggedItem) => {
      if (draggedItem.id !== panelId && dropZone && onDrop) {
        onDrop(draggedItem.id, panelId, dropZone);
      }
      setDropZone(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.getItem()?.id !== panelId
    })
  });

  // Clear drop zone when cursor leaves
  useEffect(() => {
    if (!isOver) setDropZone(null);
  }, [isOver]);

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return undefined;

    const disconnectDrop = drop(wrapperEl);
    const dragHandle = wrapperEl.querySelector('.panel-header');
    const disconnectDrag = drag(dragHandle || wrapperEl);

    return () => {
      if (typeof disconnectDrag === 'function') disconnectDrag();
      if (typeof disconnectDrop === 'function') disconnectDrop();
    };
  }, [drag, drop, panelId]);

  const handleDoubleClick = (event) => {
    const header = event.target.closest('.panel-header');
    if (!header || !wrapperRef.current?.contains(header)) return;
    if (event.target.closest('button, input, textarea, select, a, [contenteditable="true"]')) return;
    event.preventDefault();
    onToggleFullscreen?.(panelId);
  };

  return (
    <div
      ref={wrapperRef}
      className={`panel-wrapper ${isDragging ? 'dragging' : ''} ${isOver && dropZone ? 'drop-target' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
      data-theme-component={componentId}
      data-theme-instance={panelId}
      onPointerDown={() => onActivate?.(panelId)}
      onFocusCapture={() => onActivate?.(panelId)}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      {isOver && dropZone && (
        <div className={`drop-zone-overlay drop-zone-${dropZone}`} />
      )}
    </div>
  );
}

const PANEL_TITLES = {
  interaction: 'Interaction',
  journal: 'Journal',
  media: 'Media',
  notefalls: 'Notefalls',
  sources: 'Sources',
  tasks: 'Tasks',
  forest: 'Forest',
  canvas: 'Canvas',
};

const PANEL_THEME_COMPONENTS = {
  interaction: 'Chat', journal: 'Journals', media: 'Media',
  notefalls: 'Notefalls', sources: 'Sources', tasks: 'Tasks', forest: 'Forest', canvas: 'Canvas',
};

function panelTitle(panel) {
  return PANEL_TITLES[panel.type] || panel.type || 'Panel';
}

/**
 * A panel's React tree always renders into the same carrier element. Moving
 * that carrier between the grid shell and fullscreen host preserves component
 * state because the portal target itself never changes.
 */
function RelocatablePanel({
  panel,
  children,
  fullscreenHostRef,
  isFullscreen,
  onDrop,
  onToggleFullscreen,
  onActivate,
}) {
  const slotRef = useRef(null);
  const carrierRef = useRef(null);

  if (!carrierRef.current && typeof document !== 'undefined') {
    const carrier = document.createElement('div');
    carrier.className = 'panel-carrier';
    carrier.dataset.panelCarrier = panel.panelId;
    carrierRef.current = carrier;
  }

  useLayoutEffect(() => {
    const carrier = carrierRef.current;
    const target = isFullscreen ? fullscreenHostRef.current : slotRef.current;
    if (!carrier || !target || carrier.parentElement === target) return undefined;

    const focusedElement = carrier.contains(document.activeElement)
      ? document.activeElement
      : null;
    target.appendChild(carrier);
    if (focusedElement instanceof HTMLElement) {
      focusedElement.focus({ preventScroll: true });
    }

    return undefined;
  }, [fullscreenHostRef, isFullscreen]);

  useEffect(() => () => {
    carrierRef.current?.remove();
  }, []);

  return (
    <>
      <div ref={slotRef} className={`panel-slot-shell${isFullscreen ? ' is-vacant' : ''}`}>
        <div className="panel panel-husk" aria-hidden="true">
          <div className="panel-header">
            <span className="panel-header-title">{panelTitle(panel)}</span>
          </div>
          <div className="panel-content" />
        </div>
      </div>
      {carrierRef.current && createPortal(
        <DraggablePanel
          panelId={panel.panelId}
          componentId={PANEL_THEME_COMPONENTS[panel.type] || 'Application'}
          onDrop={onDrop}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onActivate={onActivate}
        >
          {children}
        </DraggablePanel>,
        carrierRef.current,
        panel.panelId,
      )}
    </>
  );
}

/**
 * TileLayout - Renders a v2 LayoutRow with columns and optional vertical stacks.
 *
 * @param {Object} props
 * @param {Object} props.layoutRow - v2 LayoutRow: { columns: [...], version: 2 }
 * @param {Function} props.renderPanel - (panel) => ReactNode, receives { panelId, type, size }
 * @param {Function} props.onColumnResize - (sizeMap) => void, column ID -> new size %
 * @param {Function} props.onStackResize - (columnId, sizeMap) => void, panel ID -> new size %
 * @param {Function} props.onMovePanel - (draggedId, targetId, dropZone) => void
 * @param {string} props.className
 */
export function TileLayout({
  layoutRow,
  renderPanel,
  onColumnResize,
  onStackResize,
  onMovePanel,
  fullscreenPanelId,
  onTogglePanelFullscreen,
  onActivatePanel,
  className = ''
}) {
  const fullscreenHostRef = useRef(null);
  tileLayoutRenderCount++;
  const currentRender = tileLayoutRenderCount;
  logger.debug('ui', `TileLayout render #${currentRender}`, layoutRow?.columns?.map(c => c.id));

  useEffect(() => {
    logger.debug('ui', `TileLayout MOUNTED (render #${currentRender})`);
    return () => {
      logger.debug('ui', `TileLayout UNMOUNTED (render #${currentRender})`);
    };
  }, []);

  // Handle horizontal column resize
  const handleColumnResize = useCallback((layout) => {
    if (!layout || Object.keys(layout).length === 0) return;
    const sizeMap = {};
    Object.entries(layout).forEach(([id, size]) => {
      sizeMap[id] = Number(size.toFixed(2));
    });
    debugPanelResize('column resize', sizeMap);
    if (onColumnResize) onColumnResize(sizeMap);
  }, [onColumnResize]);

  // Handle vertical stack resize within a column
  const handleStackResize = useCallback((columnId, layout) => {
    if (!layout || Object.keys(layout).length === 0) return;
    const sizeMap = {};
    Object.entries(layout).forEach(([id, size]) => {
      sizeMap[id] = Number(size.toFixed(2));
    });
    debugPanelResize('stack resize', columnId, sizeMap);
    if (onStackResize) onStackResize(columnId, sizeMap);
  }, [onStackResize]);

  // Handle panel drop
  const handleDrop = useCallback((draggedId, targetId, dropZone) => {
    logger.debug('ui', `TileLayout drop: ${draggedId} -> ${targetId} (${dropZone})`);
    if (onMovePanel) onMovePanel(draggedId, targetId, dropZone);
  }, [onMovePanel]);

  const columns = layoutRow?.columns ?? [];

  // Default layout for the horizontal Group
  const defaultColumnLayout = useMemo(() => {
    const layout = {};
    columns.forEach(col => {
      layout[col.id] = col.size;
    });
    return layout;
  }, [columns]);

  // Key that changes when column structure changes, forcing Group remount
  const groupKey = useMemo(() => {
    return columns.map(c => `${c.id}:${c.panels.map(p => p.panelId).join('+')}`).join('-');
  }, [columns]);

  if (columns.length === 0) {
    return (
      <div className={`tile-layout ${className}`}>
        <div className="tile-layout-empty">No panels to display</div>
      </div>
    );
  }

  const fullscreenPanel = columns
    .flatMap((column) => column.panels)
    .find((panel) => panel.panelId === fullscreenPanelId);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`tile-layout ${className}`}>
        <div
          className="tile-layout-grid"
          inert={fullscreenPanelId ? '' : undefined}
          aria-hidden={fullscreenPanelId ? 'true' : undefined}
        >
          <Group
            key={groupKey}
            orientation="horizontal"
            onLayoutChange={handleColumnResize}
            defaultLayout={defaultColumnLayout}
            className="tile-layout-content"
          >
            {columns.map((column, colIndex) => (
              <React.Fragment key={column.id}>
                <Panel
                  id={column.id}
                  minSize="5%"
                  maxSize="95%"
                  className="resizable-panel"
                >
                  {column.panels.length === 1 ? (
                    <RelocatablePanel
                      panel={column.panels[0]}
                      fullscreenHostRef={fullscreenHostRef}
                      isFullscreen={fullscreenPanelId === column.panels[0].panelId}
                      onDrop={handleDrop}
                      onToggleFullscreen={onTogglePanelFullscreen}
                      onActivate={onActivatePanel}
                    >
                      {renderPanel ? renderPanel(column.panels[0]) : (
                        <div className="panel-content">
                          <div className="widget-empty">Panel: {column.panels[0].type}</div>
                        </div>
                      )}
                    </RelocatablePanel>
                  ) : (
                    <StackColumn
                      column={column}
                      renderPanel={renderPanel}
                      onStackResize={handleStackResize}
                      onDrop={handleDrop}
                      fullscreenPanelId={fullscreenPanelId}
                      fullscreenHostRef={fullscreenHostRef}
                      onTogglePanelFullscreen={onTogglePanelFullscreen}
                      onActivatePanel={onActivatePanel}
                    />
                  )}
                </Panel>

                {colIndex < columns.length - 1 && (
                  <Separator className="resize-handle horizontal" />
                )}
              </React.Fragment>
            ))}
          </Group>
        </div>

        <div
          ref={fullscreenHostRef}
          className={`fullscreen-panel-host${fullscreenPanelId ? ' is-active' : ''}`}
          role={fullscreenPanelId ? 'region' : undefined}
          aria-label={fullscreenPanel ? `${panelTitle(fullscreenPanel)} panel, fullscreen` : undefined}
          aria-hidden={fullscreenPanelId ? undefined : 'true'}
        />
      </div>
    </DndProvider>
  );
}

/**
 * StackColumn - Renders a vertical stack of panels within a column.
 */
function StackColumn({
  column,
  renderPanel,
  onStackResize,
  onDrop,
  fullscreenPanelId,
  fullscreenHostRef,
  onTogglePanelFullscreen,
  onActivatePanel,
}) {
  const defaultStackLayout = useMemo(() => {
    const layout = {};
    column.panels.forEach(p => {
      layout[p.panelId] = p.size;
    });
    return layout;
  }, [column.panels]);

  const stackKey = useMemo(() => {
    return column.panels.map(p => p.panelId).join('-');
  }, [column.panels]);

  const handleResize = useCallback((layout) => {
    if (onStackResize) onStackResize(column.id, layout);
  }, [onStackResize, column.id]);

  return (
    <Group
      key={stackKey}
      orientation="vertical"
      onLayoutChange={handleResize}
      defaultLayout={defaultStackLayout}
      className="stack-column"
    >
      {column.panels.map((panel, pIndex) => (
        <React.Fragment key={panel.panelId}>
          <Panel
            id={panel.panelId}
            minSize="5%"
            maxSize="95%"
            className="resizable-panel"
          >
            <RelocatablePanel
              panel={panel}
              onDrop={onDrop}
              isFullscreen={fullscreenPanelId === panel.panelId}
              fullscreenHostRef={fullscreenHostRef}
              onToggleFullscreen={onTogglePanelFullscreen}
              onActivate={onActivatePanel}
            >
              {renderPanel ? renderPanel(panel) : (
                <div className="panel-content">
                  <div className="widget-empty">Panel: {panel.type}</div>
                </div>
              )}
            </RelocatablePanel>
          </Panel>

          {pIndex < column.panels.length - 1 && (
            <Separator className="resize-handle vertical" />
          )}
        </React.Fragment>
      ))}
    </Group>
  );
}

/**
 * TileLayoutWithControls - TileLayout with loading state
 */
export function TileLayoutWithControls({
  layoutRow,
  isLoading,
  renderPanel,
  onColumnResize,
  onStackResize,
  onMovePanel,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className={`tile-layout ${className}`}>
        <div className="tile-layout-loading">Loading layout...</div>
      </div>
    );
  }

  return (
    <div className={`tile-layout-container ${className}`}>
      <TileLayout
        layoutRow={layoutRow}
        renderPanel={renderPanel}
        onColumnResize={onColumnResize}
        onStackResize={onStackResize}
        onMovePanel={onMovePanel}
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
  const renderPanelGroup = (node, depth = 0) => {
    if (!node) return null;

    if (node.type && !node.children) {
      return renderPanel ? renderPanel(node) : (
        <div className="panel-content">
          <div className="widget-empty">Panel: {node.type || node.id}</div>
        </div>
      );
    }

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
