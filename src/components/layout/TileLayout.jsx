import React, { useCallback, useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useDrag, useDrop } from 'react-dnd';
import { determineDropZone } from '../../lib/layoutUtils';
import { usePanelLayoutMotion } from '../../hooks/usePanelLayoutMotion';
import logger from '../../lib/logger';
import '../../AppCombined.css';

const EMPTY_COLUMNS = [];

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
function DraggablePanel({ panelId, componentId, children, onDrop, isFullscreen, onToggleFullscreen, onActivate, onPopOut }) {
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
      {onPopOut && !isFullscreen && (
        <button
          type="button"
          className="panel-popout-btn"
          onClick={(event) => {
            event.stopPropagation();
            onPopOut();
          }}
          title="Pop out to a floating window"
          aria-label="Pop out to a floating window"
        >
          ❐
        </button>
      )}
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
  island: 'Islands',
  canvas: 'Canvas',
};

const PANEL_THEME_COMPONENTS = {
  interaction: 'Chat', journal: 'Journals', media: 'Media',
  notefalls: 'Notefalls', sources: 'Sources', tasks: 'Tasks', island: 'Islands', canvas: 'Canvas',
};

function panelTitle(panel) {
  return PANEL_TITLES[panel.type] || panel.type || 'Panel';
}

/** Stable siblings keep panel content mounted across every column/stack change. */
function RelocatablePanel({
  panel,
  children,
  registerCarrier,
  isFullscreen,
  isInactive,
  onDrop,
  onToggleFullscreen,
  onActivate,
  onPopOut,
}) {
  const carrierRef = useCallback(element => registerCarrier(panel.panelId, element), [panel.panelId, registerCarrier]);

  return (
    <div
      ref={carrierRef}
      className={`panel-carrier${isFullscreen ? ' is-fullscreen' : ''}`}
      data-panel-carrier={panel.panelId}
      data-layout-inactive={isInactive ? 'true' : undefined}
      inert={isInactive ? '' : undefined}
      aria-hidden={isInactive ? 'true' : undefined}
      role={isFullscreen ? 'region' : undefined}
      aria-label={isFullscreen ? `${panelTitle(panel)} panel, fullscreen` : undefined}
    >
      <DraggablePanel
        panelId={panel.panelId}
        componentId={PANEL_THEME_COMPONENTS[panel.type] || 'Application'}
        onDrop={onDrop}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onActivate={onActivate}
        onPopOut={onPopOut}
      >
        {children}
      </DraggablePanel>
    </div>
  );
}

function PanelSlot({ panel, registerSlot, isFullscreen }) {
  const slotRef = useCallback(element => registerSlot(panel.panelId, element), [panel.panelId, registerSlot]);
  return (
    <div ref={slotRef} className="panel-slot-shell" data-panel-slot={panel.panelId} aria-hidden="true">
      {isFullscreen && (
        <div className="panel panel-husk">
          <div className="panel-header"><span className="panel-header-title">{panelTitle(panel)}</span></div>
          <div className="panel-content" />
        </div>
      )}
    </div>
  );
}

function LayoutGroup({ layout, children, ...props }) {
  const groupRef = useRef(null);
  useLayoutEffect(() => {
    // defaultLayout only initializes a group. Also apply tool-driven size changes
    // when its topology stays the same, without recreating any live content.
    groupRef.current?.setLayout(layout);
  }, [layout]);
  return <Group {...props} groupRef={groupRef} defaultLayout={layout}>{children}</Group>;
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
  onPopOutPanel,
  canPopOutPanel,
  className = ''
}) {
  const columns = layoutRow?.columns ?? EMPTY_COLUMNS;
  const { rootRef, surfaceRef, panels, registerSlot, registerCarrier } = usePanelLayoutMotion(columns, fullscreenPanelId);
  const liveIds = useMemo(() => new Set(columns.flatMap(column => column.panels.map(panel => panel.panelId))), [columns]);

  // Only deliberate resizing writes back to the model. Mounting/reconfiguring a
  // resize group must never overwrite the ratios of a pending layout change.
  const handleColumnResize = useCallback((sizes, meta) => {
    if (!meta.isUserInteraction || !Object.keys(sizes).length) return;
    debugPanelResize('column resize', sizes);
    logger.info('ui.layout', 'Column widths adjusted; these proportions will be used for the next layout change', { widths: sizes });
    onColumnResize?.(sizes);
  }, [onColumnResize]);

  const handleStackResize = useCallback((columnId, sizes, meta) => {
    if (!meta.isUserInteraction || !Object.keys(sizes).length) return;
    debugPanelResize('stack resize', columnId, sizes);
    logger.info('ui.layout', 'Stack heights adjusted; these proportions will be used for the next layout change', { columnId, heights: sizes });
    onStackResize?.(columnId, sizes);
  }, [onStackResize]);

  const handleDrop = useCallback((draggedId, targetId, dropZone) => {
    onMovePanel?.(draggedId, targetId, dropZone);
  }, [onMovePanel]);

  const popOutFor = useCallback((panel) => {
    if (!onPopOutPanel || (canPopOutPanel && !canPopOutPanel(panel))) return undefined;
    return () => onPopOutPanel(panel);
  }, [onPopOutPanel, canPopOutPanel]);

  const columnLayout = useMemo(() => Object.fromEntries(columns.map(column => [column.id, column.size])), [columns]);
  // Only the empty sizing slots remount when their structure changes.
  const groupKey = columns.map(column => `${column.id}:${column.panels.map(panel => panel.panelId).join('+')}`).join('-');

  return (
    <div ref={rootRef} className={`tile-layout ${className}`}>
      <div
        className="tile-layout-grid"
        inert={fullscreenPanelId ? '' : undefined}
        aria-hidden={fullscreenPanelId ? 'true' : undefined}
      >
        {columns.length ? (
          <LayoutGroup
            key={groupKey}
            orientation="horizontal"
            onLayoutChanged={handleColumnResize}
            layout={columnLayout}
            className="tile-layout-content"
          >
            {columns.map((column, index) => (
              <React.Fragment key={column.id}>
                <Panel
                  id={column.id}
                  defaultSize={toPercentSize(column.size, 100 / columns.length)}
                  minSize={toPercentSize(Math.min(5, column.size), 0)}
                  maxSize="100%"
                  className="resizable-panel"
                >
                  {column.panels.length === 1 ? (
                    <PanelSlot
                      panel={column.panels[0]}
                      registerSlot={registerSlot}
                      isFullscreen={fullscreenPanelId === column.panels[0].panelId}
                    />
                  ) : (
                    <StackColumn
                      column={column}
                      onStackResize={handleStackResize}
                      fullscreenPanelId={fullscreenPanelId}
                      registerSlot={registerSlot}
                    />
                  )}
                </Panel>
                {index < columns.length - 1 && <Separator className="resize-handle horizontal" />}
              </React.Fragment>
            ))}
          </LayoutGroup>
        ) : (
          <div className="tile-layout-empty">No panels to display</div>
        )}
      </div>
      <div ref={surfaceRef} className="panel-layout-surface">
        {panels.map(panel => (
          <RelocatablePanel
            key={panel.panelId}
            panel={panel}
            registerCarrier={registerCarrier}
            isFullscreen={fullscreenPanelId === panel.panelId}
            isInactive={!liveIds.has(panel.panelId) || (!!fullscreenPanelId && fullscreenPanelId !== panel.panelId)}
            onDrop={handleDrop}
            onToggleFullscreen={onTogglePanelFullscreen}
            onActivate={onActivatePanel}
            onPopOut={popOutFor(panel)}
          >
            {renderPanel ? renderPanel(panel) : (
              <div className="panel-content"><div className="widget-empty">Panel: {panel.type}</div></div>
            )}
          </RelocatablePanel>
        ))}
      </div>
    </div>
  );
}

/** A stack contains sizing slots; its content stays in the stable outer layer. */
function StackColumn({ column, onStackResize, fullscreenPanelId, registerSlot }) {
  const stackLayout = useMemo(() => Object.fromEntries(column.panels.map(panel => [panel.panelId, panel.size])), [column.panels]);
  const stackKey = column.panels.map(panel => panel.panelId).join('-');
  const handleResize = useCallback((sizes, meta) => onStackResize?.(column.id, sizes, meta), [onStackResize, column.id]);

  return (
    <LayoutGroup
      key={stackKey}
      orientation="vertical"
      onLayoutChanged={handleResize}
      layout={stackLayout}
      className="stack-column"
    >
      {column.panels.map((panel, index) => (
        <React.Fragment key={panel.panelId}>
          <Panel
            id={panel.panelId}
            defaultSize={toPercentSize(panel.size, 100 / column.panels.length)}
            minSize={toPercentSize(Math.min(5, panel.size), 0)}
            maxSize="100%"
            className="resizable-panel"
          >
            <PanelSlot panel={panel} registerSlot={registerSlot} isFullscreen={fullscreenPanelId === panel.panelId} />
          </Panel>
          {index < column.panels.length - 1 && <Separator className="resize-handle vertical" />}
        </React.Fragment>
      ))}
    </LayoutGroup>
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
