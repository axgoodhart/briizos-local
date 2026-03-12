import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
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
function DraggablePanel({ panelId, children, onDrop }) {
  const wrapperRef = useRef(null);
  const [dropZone, setDropZone] = useState(null);

  const [{ isDragging }, drag] = useDrag({
    type: PANEL_TYPE,
    item: { id: panelId },
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
    const dragHandle = wrapperEl.querySelector('.panel-header, .actiondeck-header');
    const disconnectDrag = drag(dragHandle || wrapperEl);

    return () => {
      if (typeof disconnectDrag === 'function') disconnectDrag();
      if (typeof disconnectDrop === 'function') disconnectDrop();
    };
  }, [drag, drop, panelId]);

  return (
    <div
      ref={wrapperRef}
      className={`panel-wrapper ${isDragging ? 'dragging' : ''} ${isOver && dropZone ? 'drop-target' : ''}`}
    >
      {children}
      {isOver && dropZone && (
        <div className={`drop-zone-overlay drop-zone-${dropZone}`} />
      )}
    </div>
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
  className = ''
}) {
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

  if (!layoutRow || !layoutRow.columns || layoutRow.columns.length === 0) {
    return (
      <div className={`tile-layout ${className}`}>
        <div className="tile-layout-empty">No panels to display</div>
      </div>
    );
  }

  const { columns } = layoutRow;

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`tile-layout ${className}`}>
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
                  // Single panel column — render at full height
                  <DraggablePanel panelId={column.panels[0].panelId} onDrop={handleDrop}>
                    {renderPanel ? renderPanel(column.panels[0]) : (
                      <div className="panel-content">
                        <div className="widget-empty">Panel: {column.panels[0].type}</div>
                      </div>
                    )}
                  </DraggablePanel>
                ) : (
                  // Stack column — nested vertical Group
                  <StackColumn
                    column={column}
                    renderPanel={renderPanel}
                    onStackResize={handleStackResize}
                    onDrop={handleDrop}
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
    </DndProvider>
  );
}

/**
 * StackColumn - Renders a vertical stack of panels within a column.
 */
function StackColumn({ column, renderPanel, onStackResize, onDrop }) {
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
            <DraggablePanel panelId={panel.panelId} onDrop={onDrop}>
              {renderPanel ? renderPanel(panel) : (
                <div className="panel-content">
                  <div className="widget-empty">Panel: {panel.type}</div>
                </div>
              )}
            </DraggablePanel>
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
