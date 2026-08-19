import { useState, useRef, useEffect, useCallback } from 'react';
import logger from '../../lib/logger';
import '../../AppCombined.css';
import CanvasSurface from '../canvases/CanvasSurface';
import { CANVAS_RENDER_ENGINES } from '../../lib/canvasUtils';
import {
  buildPanelFilter,
  DEFAULT_CANVAS_PANEL_SETTINGS,
  PANEL_FILTER_LIMITS,
  PANEL_START_AS_OPTIONS,
  normalizePanelSettings,
} from '../../lib/floatingPanelPrefs';

function LiveCanvas({
  isOpen,
  onClose,
  canvasData,
  title,
  onSave,
  isTileActive = false,
  isFloatActive = false,
  onToggleTile,
  onToggleFloat,
  onPromoteBrowser,
}) {
  const [position, setPosition] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [panelSettings, setPanelSettings] = useState(() => normalizePanelSettings(
    canvasData?.meta?.panelSettings || {},
    DEFAULT_CANVAS_PANEL_SETTINGS
  ));
  const [renderEngine, setRenderEngine] = useState(
    canvasData?.meta?.renderEngine || CANVAS_RENDER_ENGINES.IFRAME
  );
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const srcdoc = canvasData
    ? (canvasData.rawHtml
      ? canvasData.rawHtml
      : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>html,body{margin:0;padding:0;width:100%;height:100%}${canvasData.css || ''}</style>
</head>
<body>
  ${canvasData.html || ''}
  <script>${canvasData.js || ''}<\/script>
</body>
</html>`)
    : '';

  useEffect(() => {
    setPanelSettings(normalizePanelSettings(
      canvasData?.meta?.panelSettings || {},
      DEFAULT_CANVAS_PANEL_SETTINGS
    ));
    setRenderEngine(canvasData?.meta?.renderEngine || CANVAS_RENDER_ENGINES.IFRAME);
    setIsSettingsOpen(false);

    const pinnedPos = canvasData?.meta?.panelSettings?.pinToCurrentLocation
      ? canvasData?.meta?.panelSettings?.pinnedPosition
      : null;
    if (pinnedPos?.x != null && pinnedPos?.y != null) {
      setPosition({ x: pinnedPos.x, y: pinnedPos.y });
    } else {
      setPosition({ x: 100, y: 80 });
    }
  }, [canvasData]);

  if (isOpen && canvasData) {
    logger.debug('canvas', 'LiveCanvas rendering with data', {
      htmlLen: canvasData.html?.length || 0,
      cssLen: canvasData.css?.length || 0,
      jsLen: canvasData.js?.length || 0,
      srcdocLen: srcdoc.length,
    });
  }

  const updatePanelSettings = useCallback((updates) => {
    setPanelSettings((prev) => normalizePanelSettings(
      typeof updates === 'function' ? updates(prev) : { ...prev, ...updates },
      DEFAULT_CANVAS_PANEL_SETTINGS
    ));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (isSettingsOpen) return;
    if (e.target.closest('.canvas-header-btn, .canvas-mode-btn, input, select')) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [isSettingsOpen, position]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (e) => {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => {
      setIsDragging(false);
      setPosition((prev) => {
        if (panelSettings.pinToCurrentLocation) {
          updatePanelSettings({ pinnedPosition: prev });
        }
        return prev;
      });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, panelSettings.pinToCurrentLocation, updatePanelSettings]);

  useEffect(() => {
    if (!isOpen || !canvasData?.filename) return undefined;
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.canvasSaveMeta || !api?.canvasLoadMeta) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const existing = await api.canvasLoadMeta(canvasData.filename);
        if (cancelled) return;
        const nextMeta = {
          ...(existing || {}),
          ...(canvasData.meta || {}),
          renderEngine,
          panelSettings,
        };
        await api.canvasSaveMeta(canvasData.filename, nextMeta);
      } catch (err) {
        logger.error('canvases', 'Failed to persist floating canvas settings', {
          filename: canvasData.filename,
          error: String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canvasData, isOpen, panelSettings, renderEngine]);

  const handlePromoteBrowser = useCallback(() => {
    setRenderEngine(CANVAS_RENDER_ENGINES.BROWSER);
    onPromoteBrowser?.();
  }, [onPromoteBrowser]);

  if (!isOpen || !canvasData) return null;

  const headerStyle = panelSettings.headerBg.trim()
    ? { background: panelSettings.headerBg }
    : undefined;

  const bodyStyle = {
    filter: buildPanelFilter(panelSettings.filters),
  };

  const handlePinToggle = () => {
    if (panelSettings.pinToCurrentLocation) {
      updatePanelSettings({
        pinToCurrentLocation: false,
        pinnedPosition: null,
      });
      return;
    }
    updatePanelSettings({
      pinToCurrentLocation: true,
      pinnedPosition: position,
    });
  };

  return (
    <div className="canvas-backdrop">
      <div
        ref={containerRef}
        className={`canvas-modal ${isDragging ? 'dragging' : ''} ${isSettingsOpen ? 'settings-open' : ''}`}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="canvas-flip-stage">
          <section className="canvas-face canvas-face-front">
            <div className="canvas-header" onMouseDown={handleMouseDown} style={headerStyle}>
              <div className="canvas-header-left">
                {(onToggleTile || onToggleFloat) ? (
                  <div className="canvas-mode-group">
                    <button
                      type="button"
                      className={`canvas-mode-btn ${isTileActive ? 'is-active' : ''}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleTile?.(); }}
                      title="Toggle tile view"
                    >
                      􀏝
                    </button>
                    <button
                      type="button"
                      className={`canvas-mode-btn ${isFloatActive ? 'is-active' : ''}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleFloat?.(); }}
                      title="Toggle floating view"
                    >
                      􀏧
                    </button>
                  </div>
                ) : null}
                <span className="canvas-title">{title || 'Canvas'}</span>
              </div>
              <div className="canvas-header-right">
                {onSave ? (
                  <button
                    className="canvas-header-btn"
                    onClick={(e) => { e.stopPropagation(); onSave(srcdoc); }}
                    title="Save canvas"
                  >
                    ⤓
                  </button>
                ) : null}
                <button
                  className="canvas-header-btn canvas-close-btn"
                  onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                  title="Close canvas"
                >
                  ✕
                </button>
                <button
                  className={`canvas-header-btn canvas-star-btn ${isSettingsOpen ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setIsSettingsOpen((prev) => !prev); }}
                  title="Canvas settings"
                  aria-label="Canvas settings"
                  aria-pressed={isSettingsOpen}
                >
                  ★
                </button>
              </div>
            </div>
            <div className="canvas-body" style={bodyStyle}>
              <CanvasSurface
                title={title || 'Canvas'}
                html={srcdoc}
                meta={{
                  ...(canvasData.meta || {}),
                  renderEngine,
                  panelSettings,
                }}
                canvasKey={canvasData.filename || title || 'floating-canvas'}
                className="canvas-iframe"
                onPromoteBrowser={handlePromoteBrowser}
              />
            </div>
          </section>

          <section className="canvas-face canvas-face-back">
            <div className="canvas-settings-header" style={headerStyle}>
              <div className="canvas-settings-heading">
                <span className="canvas-title">★ Canvas Settings</span>
                <span className="canvas-settings-kicker">{canvasData.filename || title || 'floating-canvas'}</span>
              </div>
              <button
                className="canvas-header-btn canvas-star-btn active"
                onClick={() => setIsSettingsOpen(false)}
                title="Return to canvas"
                aria-label="Return to canvas"
              >
                ↺
              </button>
            </div>
            <div className="canvas-settings-body">
              <label className="canvas-setting">
                <span className="canvas-setting-label">Hue rotate</span>
                <span className="canvas-setting-value">{panelSettings.filters.hueRotate}deg</span>
                <input
                  type="range"
                  min={PANEL_FILTER_LIMITS.hueRotate.min}
                  max={PANEL_FILTER_LIMITS.hueRotate.max}
                  value={panelSettings.filters.hueRotate}
                  onChange={(e) => updatePanelSettings({
                    filters: {
                      ...panelSettings.filters,
                      hueRotate: Number(e.target.value),
                    },
                  })}
                />
              </label>
              <label className="canvas-setting">
                <span className="canvas-setting-label">Saturation</span>
                <span className="canvas-setting-value">{panelSettings.filters.saturation}%</span>
                <input
                  type="range"
                  min={PANEL_FILTER_LIMITS.saturation.min}
                  max={PANEL_FILTER_LIMITS.saturation.max}
                  value={panelSettings.filters.saturation}
                  onChange={(e) => updatePanelSettings({
                    filters: {
                      ...panelSettings.filters,
                      saturation: Number(e.target.value),
                    },
                  })}
                />
              </label>
              <label className="canvas-setting">
                <span className="canvas-setting-label">Sepia</span>
                <span className="canvas-setting-value">{panelSettings.filters.sepia}%</span>
                <input
                  type="range"
                  min={PANEL_FILTER_LIMITS.sepia.min}
                  max={PANEL_FILTER_LIMITS.sepia.max}
                  value={panelSettings.filters.sepia}
                  onChange={(e) => updatePanelSettings({
                    filters: {
                      ...panelSettings.filters,
                      sepia: Number(e.target.value),
                    },
                  })}
                />
              </label>
              <label className="canvas-setting">
                <span className="canvas-setting-label">Contrast</span>
                <span className="canvas-setting-value">{panelSettings.filters.contrast}%</span>
                <input
                  type="range"
                  min={PANEL_FILTER_LIMITS.contrast.min}
                  max={PANEL_FILTER_LIMITS.contrast.max}
                  value={panelSettings.filters.contrast}
                  onChange={(e) => updatePanelSettings({
                    filters: {
                      ...panelSettings.filters,
                      contrast: Number(e.target.value),
                    },
                  })}
                />
              </label>
              <label className="canvas-setting">
                <span className="canvas-setting-label">Start as</span>
                <select
                  className="canvas-settings-select"
                  value={panelSettings.startAs}
                  onChange={(e) => updatePanelSettings({ startAs: e.target.value })}
                >
                  <option value={PANEL_START_AS_OPTIONS.TILE}>Layout tile</option>
                  <option value={PANEL_START_AS_OPTIONS.FLOATING}>Floating panel</option>
                  <option value={PANEL_START_AS_OPTIONS.LAST_USE}>Last use</option>
                </select>
              </label>
              <div className="canvas-setting canvas-setting-inline">
                <div>
                  <span className="canvas-setting-label">Pin to current location</span>
                  <span className="canvas-setting-value">
                    {panelSettings.pinToCurrentLocation ? 'Pinned' : 'Unpinned'}
                  </span>
                </div>
                <button
                  className={`canvas-header-btn ${panelSettings.pinToCurrentLocation ? 'canvas-star-btn active' : ''}`}
                  onClick={handlePinToggle}
                  title="Toggle pin to current location"
                >
                  {panelSettings.pinToCurrentLocation ? 'Unpin' : 'Pin'}
                </button>
              </div>
              <label className="canvas-setting">
                <span className="canvas-setting-label">Header bg</span>
                <input
                  type="text"
                  className="canvas-settings-input"
                  value={panelSettings.headerBg}
                  placeholder="linear-gradient(...), rgba(...), or any CSS background"
                  onChange={(e) => updatePanelSettings({ headerBg: e.target.value })}
                />
              </label>
              <fieldset className="canvas-setting canvas-setting-radio">
                <legend className="canvas-setting-label">Render engine</legend>
                <label className="canvas-radio-option">
                  <input
                    type="radio"
                    name="canvas-render-engine"
                    checked={renderEngine === CANVAS_RENDER_ENGINES.IFRAME}
                    onChange={() => setRenderEngine(CANVAS_RENDER_ENGINES.IFRAME)}
                  />
                  <span>Iframe</span>
                </label>
                <label className="canvas-radio-option">
                  <input
                    type="radio"
                    name="canvas-render-engine"
                    checked={renderEngine === CANVAS_RENDER_ENGINES.AUTO}
                    onChange={() => setRenderEngine(CANVAS_RENDER_ENGINES.AUTO)}
                  />
                  <span>Auto</span>
                </label>
                <label className="canvas-radio-option">
                  <input
                    type="radio"
                    name="canvas-render-engine"
                    checked={renderEngine === CANVAS_RENDER_ENGINES.BROWSER}
                    onChange={() => setRenderEngine(CANVAS_RENDER_ENGINES.BROWSER)}
                  />
                  <span>Browser</span>
                </label>
              </fieldset>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default LiveCanvas;
