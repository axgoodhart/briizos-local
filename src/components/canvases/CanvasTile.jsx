import { useEffect, useRef, useState } from 'react';
import logger from '../../lib/logger';
import CanvasSurface from './CanvasSurface';

// Renders a saved canvas as a docked Panel Tile. The panel id is
// expected in the form `canvas:<filename>`. This component loads the
// canvas's raw HTML via the existing canvas IPC and stuffs it into an
// iframe via srcDoc.

function parseCanvasFilename(panelId) {
  if (typeof panelId !== 'string') return '';
  const prefix = 'canvas:';
  if (!panelId.startsWith(prefix)) return '';
  return panelId.slice(prefix.length);
}

function CanvasTile({
  panel,
  metaOverride = null,
  onClose,
  isTileActive = false,
  isFloatActive = false,
  onToggleTile,
  onToggleFloat,
  onPromoteBrowser,
}) {
  const panelId = panel?.panelId || panel?.id;
  const filename = parseCanvasFilename(panelId);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState(filename || 'Canvas');
  const [meta, setMeta] = useState({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function load() {
      if (!filename) return;
      const api = typeof window !== 'undefined' ? window.api : null;
      if (!api?.canvasLoad) return;
      try {
        const raw = await api.canvasLoad(filename);
        if (cancelled || !mountedRef.current) return;
        setHtml(raw || '');
        if (api.canvasLoadMeta) {
          try {
            const meta = await api.canvasLoadMeta(filename);
            if (!cancelled && mountedRef.current) {
              setMeta(meta || {});
              if (meta?.displayName) {
                setTitle(meta.displayName);
              }
            }
          } catch { /* ignore */ }
        }
        logger.debug('canvases', 'CanvasTile loaded', { filename, htmlLen: raw?.length || 0 });
      } catch (err) {
        logger.error('canvases', 'CanvasTile load failed', { filename, error: String(err) });
      }
    }

    load();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [filename]);

  useEffect(() => {
    if (!metaOverride) return;
    setMeta((prev) => ({ ...prev, ...metaOverride }));
    if (metaOverride.displayName) {
      setTitle(metaOverride.displayName);
    }
  }, [metaOverride]);

  return (
    <div className="panel canvas-tile">
      <div className="panel-header canvas-tile-header">
        <div className="canvas-tile-header-left">
          {(onToggleTile || onToggleFloat) ? (
            <div className="canvas-mode-group">
              <button
                type="button"
                className={`canvas-mode-btn ${isTileActive ? 'is-active' : ''}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleTile?.(); }}
                title="Toggle tile view"
              >
                􀏧
              </button>
              <button
                type="button"
                className={`canvas-mode-btn ${isFloatActive ? 'is-active' : ''}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onToggleFloat?.(); }}
                title="Toggle floating view"
              >
                􀏝
              </button>
            </div>
          ) : null}
          <span>{title}</span>
        </div>
        {onClose ? (
          <button
            type="button"
            className="canvas-tile-close"
            onClick={onClose}
            title="Close canvas tile"
          >
            x
          </button>
        ) : null}
      </div>
      <div className="panel-content" style={{ padding: 0, overflow: 'hidden' }}>
        <CanvasSurface
          title={title}
          html={html}
          meta={meta}
          canvasKey={filename}
          className="canvas-iframe"
          onPromoteBrowser={onPromoteBrowser}
        />
      </div>
    </div>
  );
}

export default CanvasTile;
