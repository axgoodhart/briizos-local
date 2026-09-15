import { useInterfacePreferences } from '../../lib/interfacePreferences';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CanvasCard from './CanvasCard';
import NewCanvasFlow from './NewCanvasFlow';
import '../../AppCombined.css';

function CanvasesPopover({
  isOpen,
  onClose,
  canvases = [],
  isLoading = false,
  onOpenCanvas,
  onCreateCanvas,
  onDeleteCanvas,
  onRenameCanvas,
  onSetFormFactor,
  onSetRenderEngine,
  anchorRef,
}) {
  const popoverRef = useRef(null);
  const [newFlowOpen, setNewFlowOpen] = useState(false);
  const [anchorPlacement, setAnchorPlacement] = useState(null);
  const [dockPreferences] = useInterfacePreferences();

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef?.current || typeof window === 'undefined') {
      setAnchorPlacement(null);
      return undefined;
    }

    const updatePlacement = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const bounds = anchor.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const isVertical = Boolean(anchor.closest('.control-bar-dock--vertical'));
      const isDock = Boolean(anchor.closest('.fdock'));

      if (isVertical) {
        setAnchorPlacement({
          isVertical,
          isDock: false,
          style: {
            position: 'fixed',
            top: `${Math.round(bounds.top + (bounds.height / 2))}px`,
            left: `${Math.round(bounds.right + 18)}px`,
            right: 'auto',
            transform: 'translateY(-50%)',
          },
        });
        return;
      }

      const popoverWidth = Math.min(360, Math.max(0, viewportWidth - 16));
      const maxLeft = Math.max(8, viewportWidth - popoverWidth - 8);

      if (isDock) {
        const edge = dockPreferences.dockEdge;
        const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
        const horizontal = edge === 'top' || edge === 'bottom';
        const left = horizontal
          ? Math.min(Math.max(8, bounds.left + bounds.width / 2 - popoverWidth / 2), maxLeft)
          : edge === 'left' ? Math.min(maxLeft, bounds.right + 12) : Math.max(8, bounds.left - popoverWidth - 12);
        const maxHeight = horizontal
          ? Math.max(80, edge === 'bottom' ? bounds.top - 24 : viewportHeight - bounds.bottom - 24)
          : viewportHeight - 24;
        setAnchorPlacement({
          isVertical: !horizontal,
          isDock: true,
          style: {
            position: 'fixed',
            top: edge === 'bottom' ? 'auto' : horizontal ? `${Math.round(bounds.bottom + 12)}px` : '12px',
            bottom: edge === 'bottom' ? `${Math.round(viewportHeight - bounds.top + 12)}px` : 'auto',
            maxHeight: `${maxHeight}px`,
            left: `${Math.round(left)}px`,
            right: 'auto',
            transform: 'none',
          },
        });
        return;
      }

      const left = Math.min(Math.max(8, bounds.right - popoverWidth), maxLeft);

      setAnchorPlacement({
        isVertical,
        isDock: false,
        style: {
          position: 'fixed',
          top: `${Math.round(bounds.bottom + 12)}px`,
          left: `${Math.round(left)}px`,
          right: 'auto',
          transform: 'none',
        },
      });
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [anchorRef, isOpen, dockPreferences.dockEdge]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleDocClick = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      // Ignore clicks on the Canvases toggle button itself (the trigger already toggles)
      if (e.target.closest?.('[data-canvases-toggle="true"]')) return;
      onClose?.();
    };
    // Delay one tick so the click that opened the popover doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleDocClick);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, [isOpen, onClose]);

  // Reset new flow when popover closes
  useEffect(() => {
    if (!isOpen) setNewFlowOpen(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCanvases = canvases.length > 0;

  const handleCreate = async (payload) => {
    setNewFlowOpen(false);
    await onCreateCanvas?.(payload);
  };

  const isPortaled = Boolean(anchorRef?.current && typeof document !== 'undefined');
  const popover = (
    <div
      ref={popoverRef}
      className={`canvases-popover ${newFlowOpen ? 'is-creating' : ''} ${isPortaled ? 'canvases-popover--portaled' : ''} ${anchorPlacement?.isVertical ? 'canvases-popover--vertical' : ''} ${anchorPlacement?.isDock ? 'canvases-popover--dock' : ''}`}
      style={isPortaled
        ? anchorPlacement?.style || {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 'auto',
          visibility: 'hidden',
        }
        : undefined}
      role="dialog"
      aria-label="Canvases"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="canvases-popover-tail" aria-hidden="true" />
      <div className="canvases-popover-header">
        <span className="canvases-popover-title">Canvases</span>
        <button type="button" className="canvases-popover-close" onClick={onClose}>x</button>
      </div>

      <div className="canvases-popover-body">
        {isLoading ? (
          <div className="canvases-popover-loading">Loading…</div>
        ) : hasCanvases ? (
          <div className="canvases-popover-list">
            {canvases.map((canvas) => (
              <CanvasCard
                key={canvas.filename}
                canvas={canvas}
                onOpen={onOpenCanvas}
                onDelete={onDeleteCanvas}
                onRename={(c, newTitle) => onRenameCanvas?.(c, newTitle)}
                onSetFormFactor={(c, factor) => onSetFormFactor?.(c, factor)}
                onSetRenderEngine={(c, renderEngine) => onSetRenderEngine?.(c, renderEngine)}
              />
            ))}
          </div>
        ) : (
          <div className="canvases-popover-empty">
            <button
              type="button"
              className="canvases-empty-plus"
              onClick={() => setNewFlowOpen(true)}
              aria-label="Create your first canvas"
            >
              +
            </button>
            <div className="canvases-empty-label">Create your first canvas</div>
          </div>
        )}
      </div>

      {hasCanvases ? (
        <button
          type="button"
          className="canvases-popover-plus"
          onClick={() => setNewFlowOpen(true)}
          aria-label="New canvas"
          title="New canvas"
        >
          +
        </button>
      ) : null}

      {newFlowOpen ? (
        <div className="canvases-popover-overlay" onMouseDown={(e) => e.stopPropagation()}>
          <NewCanvasFlow
            onConfirm={handleCreate}
            onCancel={() => setNewFlowOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );

  return isPortaled ? createPortal(popover, document.body) : popover;
}

export default CanvasesPopover;
