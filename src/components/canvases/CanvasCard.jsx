import { useState, useRef, useEffect } from 'react';
import { CANVAS_RENDER_ENGINES } from '../../lib/canvasUtils';

const FORM_FACTOR_BADGES = {
  float: { label: 'Float', className: 'canvas-badge canvas-badge-float' },
  tile: { label: 'Tile', className: 'canvas-badge canvas-badge-tile' },
  hybrid: { label: 'Hybrid', className: 'canvas-badge canvas-badge-hybrid' },
  widget: { label: 'Widget', className: 'canvas-badge canvas-badge-widget' },
};

const FORM_FACTOR_ORDER = ['float', 'tile', 'hybrid', 'widget'];

function formatWhen(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function CanvasCard({
  canvas,
  onOpen,
  onDelete,
  onRename,
  onSetFormFactor,
  onSetRenderEngine,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(canvas.title || '');
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [menuOpen]);

  const badge = FORM_FACTOR_BADGES[canvas.formFactor] || FORM_FACTOR_BADGES.float;
  const isWebCapable = canvas.source === 'url' || !!canvas.url;
  const showWebBadge = isWebCapable
    && (canvas.renderEngine || CANVAS_RENDER_ENGINES.IFRAME) !== CANVAS_RENDER_ENGINES.IFRAME;
  const webBadgeLabel = showWebBadge ? 'WEB+' : '';

  const handleCardClick = () => {
    if (renaming || menuOpen) return;
    onOpen?.(canvas);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  const handleRenameSubmit = () => {
    const value = renameValue.trim();
    if (value && value !== canvas.title) {
      onRename?.(canvas, value);
    }
    setRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(canvas.title || '');
    setRenaming(false);
  };

  const startRename = () => {
    setMenuOpen(false);
    setRenameValue(canvas.title || '');
    setRenaming(true);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(canvas);
  };

  const handleFormFactorPick = (factor) => {
    setMenuOpen(false);
    onSetFormFactor?.(canvas, factor);
  };

  const handleRenderEnginePick = (renderEngine) => {
    setMenuOpen(false);
    onSetRenderEngine?.(canvas, renderEngine);
  };

  return (
    <div
      ref={cardRef}
      className={menuOpen ? 'canvas-card menu-open' : 'canvas-card'}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      title={canvas.title}
    >
      <div className="canvas-card-icon">
        <span className="cb-icon">􀈷</span>
      </div>
      <div className="canvas-card-main">
        {renaming ? (
          <input
            type="text"
            className="canvas-card-rename"
            value={renameValue}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') handleRenameCancel();
            }}
          />
        ) : (
          <div className="canvas-card-title">{canvas.title || canvas.filename}</div>
        )}
        <div className="canvas-card-meta">
          <span className={badge.className}>{badge.label}</span>
          {webBadgeLabel ? (
            <span className="canvas-badge canvas-badge-webplus">{webBadgeLabel}</span>
          ) : null}
          {canvas.updatedAt ? (
            <span className="canvas-card-when">{formatWhen(canvas.updatedAt)}</span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="canvas-card-more"
        aria-label="Open menu"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
      >
        ⋯
      </button>
      {menuOpen ? (
        <div ref={menuRef} className="canvas-card-menu" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setMenuOpen(false); onOpen?.(canvas); }}>Open</button>
          <button type="button" onClick={startRename}>Rename</button>
          <div className="canvas-card-menu-section">
            <div className="canvas-card-menu-label">Form factor</div>
            {FORM_FACTOR_ORDER.map((factor) => (
              <button
                key={factor}
                type="button"
                className={factor === canvas.formFactor ? 'is-active' : ''}
                onClick={() => handleFormFactorPick(factor)}
              >
                {FORM_FACTOR_BADGES[factor].label}
              </button>
            ))}
          </div>
          {isWebCapable ? (
            <div className="canvas-card-menu-section">
              <div className="canvas-card-menu-label">Render engine</div>
              {[
                { key: CANVAS_RENDER_ENGINES.AUTO, label: 'Auto' },
                { key: CANVAS_RENDER_ENGINES.IFRAME, label: 'Iframe' },
                { key: CANVAS_RENDER_ENGINES.BROWSER, label: 'Browser' },
              ].map((engine) => (
                <button
                  key={engine.key}
                  type="button"
                  className={engine.key === (canvas.renderEngine || CANVAS_RENDER_ENGINES.IFRAME) ? 'is-active' : ''}
                  onClick={() => handleRenderEnginePick(engine.key)}
                >
                  {engine.label}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="canvas-card-menu-danger" onClick={handleDelete}>Delete</button>
        </div>
      ) : null}
    </div>
  );
}

export default CanvasCard;
