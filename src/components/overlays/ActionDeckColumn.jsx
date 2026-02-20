import { useState, useEffect, useRef, useCallback } from 'react';
import './ActionDeckColumn.css';

/**
 * ActionDeckColumn
 * - Embedded mode: renders as standard TileLayout column content
 * - Floating mode: draggable utility panel
 */
function ActionDeckColumn({
  isOpen = true,
  onClose,
  onPopOut,
  onDock,
  embedded = false,
  floating = false
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isManifesting, setIsManifesting] = useState(embedded);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const initialPositionSetRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 40, y: 80 });

  useEffect(() => {
    if (!floating || initialPositionSetRef.current || typeof window === 'undefined') return;
    const defaultWidth = Math.min(640, Math.max(380, Math.round(window.innerWidth * 0.42)));
    const x = Math.max(12, window.innerWidth - defaultWidth - 24);
    const y = 88;
    setFloatPos({ x, y });
    initialPositionSetRef.current = true;
  }, [floating]);

  useEffect(() => {
    if (!embedded) {
      setIsManifesting(false);
      return undefined;
    }

    setIsManifesting(true);
    let raf1 = null;
    let raf2 = null;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setIsManifesting(false);
      });
    });

    return () => {
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [embedded, isOpen]);

  const clampToViewport = useCallback((x, y) => {
    if (typeof window === 'undefined') return { x, y };
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 560;
    const height = rect?.height ?? 640;
    const minX = 8;
    const minY = 48;
    const maxX = Math.max(minX, window.innerWidth - width - 8);
    const maxY = Math.max(minY, window.innerHeight - height - 8);
    return {
      x: Math.min(Math.max(minX, x), maxX),
      y: Math.min(Math.max(minY, y), maxY)
    };
  }, []);

  const handleHeaderMouseDown = useCallback((e) => {
    if (!floating) return;
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
    e.preventDefault();
  }, [floating]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      setFloatPos(clampToViewport(nextX, nextY));
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, clampToViewport]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    setIframeLoaded(false);
  };

  if (!isOpen && !embedded && !floating) {
    return null;
  }

  const rootClassName = [
    'actiondeck-column',
    embedded ? 'embedded' : '',
    embedded && isManifesting ? 'manifesting' : '',
    floating ? 'floating' : '',
    isDragging ? 'dragging' : ''
  ].filter(Boolean).join(' ');

  const floatingStyle = floating ? {
    left: `${floatPos.x}px`,
    top: `${floatPos.y}px`
  } : undefined;

  return (
    <div ref={containerRef} className={rootClassName} style={floatingStyle}>
      <div
        className={`actiondeck-header ${floating ? 'draggable' : ''}`}
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="actiondeck-title">⚡ ActionDeck</span>
        <div className="actiondeck-controls">
          {embedded && onPopOut && (
            <button
              className="actiondeck-btn mode"
              onClick={onPopOut}
              title="Pop Out to Floating Panel"
            >
              ↗
            </button>
          )}
          {floating && onDock && (
            <button
              className="actiondeck-btn mode"
              onClick={onDock}
              title="Dock Back as Column"
            >
              ↙
            </button>
          )}
          {onClose && (
            <button
              className="actiondeck-btn close"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="actiondeck-content">
        <iframe
          ref={iframeRef}
          src="https://dex--briizos.us-central1.hosted.app"
          className={`actiondeck-frame ${iframeLoaded ? 'loaded' : ''}`}
          title="ActionDeck Task Management"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
        {/* Fallback placeholder if iframe doesn't load */}
        <div className={`actiondeck-placeholder ${iframeLoaded ? 'hidden' : ''}`}>
          <div className="placeholder-icon">⚡</div>
          <h3>ActionDeck</h3>
          <p>Loading task management...</p>
          <p className="placeholder-hint">
            Check your internet connection
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActionDeckColumn;
