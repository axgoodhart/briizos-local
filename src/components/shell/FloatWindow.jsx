import { useCallback, useRef } from 'react';

/**
 * FloatWindow — the shared ambient window frame.
 *
 * The frame owns position, size, focus order, minimize, close, Return Home,
 * Fill Screen, and the resize handle. The feature body it hosts owns only its
 * content, exactly like a grid tile. Drag and resize mutate the element style
 * directly and commit to the window manager on release so heavy bodies do not
 * re-render on every pointer move.
 */
export function FloatWindow({ win, focused, manager, onSendToGrid, children }) {
  const shellRef = useRef(null);

  const beginDrag = useCallback((event) => {
    if (event.button !== 0) return;
    if (event.target.closest('.fw-btn')) return;
    if (win.filled) return;
    event.preventDefault();
    manager.focusWindow(win.id);
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    let lastX = rect.left;
    let lastY = rect.top;
    let moved = false;
    const onMove = (moveEvent) => {
      moved = true;
      lastX = moveEvent.clientX - offsetX;
      lastY = moveEvent.clientY - offsetY;
      el.style.left = `${lastX}px`;
      el.style.top = `${lastY}px`;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      if (moved) manager.moveWindow(win.id, { x: lastX, y: lastY });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'grabbing';
  }, [manager, win.id, win.filled]);

  const beginResize = useCallback((event) => {
    if (event.button !== 0 || win.filled) return;
    event.preventDefault();
    event.stopPropagation();
    manager.focusWindow(win.id);
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    let lastW = rect.width;
    let lastH = rect.height;
    let moved = false;
    const onMove = (moveEvent) => {
      moved = true;
      lastW = Math.max(320, rect.width + (moveEvent.clientX - startX));
      lastH = Math.max(220, rect.height + (moveEvent.clientY - startY));
      el.style.width = `${lastW}px`;
      el.style.height = `${lastH}px`;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (moved) manager.resizeWindow(win.id, { width: lastW, height: lastH });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [manager, win.id, win.filled]);

  const handleShellMouseDown = useCallback((event) => {
    if (event.target.closest('.fw-btn') || event.target.closest('.fw-resize')) return;
    manager.focusWindow(win.id);
  }, [manager, win.id]);

  const positionStyle = win.filled
    ? {
      left: 12,
      top: 'var(--fw-fill-top, 10px)',
      width: 'calc(100vw - 24px)',
      height: 'calc(100vh - var(--fw-fill-top, 10px) - 86px)',
    }
    : { left: win.x, top: win.y, width: win.width, height: win.height };

  return (
    <section
      ref={shellRef}
      className={`fw ${focused ? 'is-focused' : ''} ${win.filled ? 'is-filled' : ''}`}
      style={{ ...positionStyle, zIndex: win.z }}
      onMouseDown={handleShellMouseDown}
      role="dialog"
      aria-label={`${win.title} window`}
      data-float-app={win.app}
    >
      <div className="fw-titlebar" onMouseDown={beginDrag}>
        <button
          type="button"
          className="fw-btn fw-btn--close"
          onClick={() => manager.closeWindow(win.id)}
          title="Close"
          aria-label={`Close ${win.title}`}
        />
        <button
          type="button"
          className="fw-btn fw-btn--min"
          onClick={() => manager.minimizeWindow(win.id)}
          title="Minimize to dock"
          aria-label={`Minimize ${win.title}`}
        />
        <button
          type="button"
          className={`fw-btn fw-btn--fill ${win.filled ? 'is-active' : ''}`}
          onClick={() => manager.toggleFill(win.id)}
          title={win.filled ? 'Restore previous size' : 'Fill screen'}
          aria-label={win.filled ? `Restore ${win.title}` : `Fill screen with ${win.title}`}
        />
        <span className="fw-title">{win.title}</span>
        <span className="fw-titlebar-actions">
          <button
            type="button"
            className="fw-btn fw-btn--action"
            onClick={() => manager.returnHome(win.id)}
            title="Return Home — default size, centered"
            aria-label={`Return ${win.title} home`}
          >
            ⌂
          </button>
          {onSendToGrid && (
            <button
              type="button"
              className="fw-btn fw-btn--action"
              onClick={onSendToGrid}
              title="Dock into the grid"
              aria-label={`Dock ${win.title} into the grid`}
            >
              ▦
            </button>
          )}
        </span>
      </div>
      <div className="fw-body">
        {children}
      </div>
      {!win.filled && (
        <div className="fw-resize" onMouseDown={beginResize} title="Resize" aria-hidden="true" />
      )}
    </section>
  );
}

export default FloatWindow;
