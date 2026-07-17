import { useState, useEffect, useRef, useCallback } from 'react';
import './ActionDeckColumn.legacy.css';
import {
  buildPanelFilter,
  DEFAULT_ACTIONDECK_PANEL_SETTINGS,
  hydratePanelSettings,
  loadPanelSettings,
  PANEL_FILTER_LIMITS,
  PANEL_START_AS_OPTIONS,
  savePanelSettings,
  normalizePanelSettings,
} from '../../lib/floatingPanelPrefs';

const ACTIONDECK_SETTINGS_KEY = 'briizos.actiondeck.panel-settings';

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
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 40, y: 80 });
  const [panelSettings, setPanelSettings] = useState(() => loadPanelSettings(
    ACTIONDECK_SETTINGS_KEY,
    DEFAULT_ACTIONDECK_PANEL_SETTINGS
  ));
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const initialPositionSetRef = useRef(false);

  const updatePanelSettings = useCallback((updates) => {
    setPanelSettings((prev) => {
      const next = normalizePanelSettings(
        typeof updates === 'function' ? updates(prev) : { ...prev, ...updates },
        DEFAULT_ACTIONDECK_PANEL_SETTINGS
      );
      savePanelSettings(ACTIONDECK_SETTINGS_KEY, next, DEFAULT_ACTIONDECK_PANEL_SETTINGS);
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    hydratePanelSettings(ACTIONDECK_SETTINGS_KEY, DEFAULT_ACTIONDECK_PANEL_SETTINGS)
      .then((saved) => { if (active) setPanelSettings(saved); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!floating || initialPositionSetRef.current || typeof window === 'undefined') return;
    const pinnedPos = panelSettings.pinToCurrentLocation ? panelSettings.pinnedPosition : null;
    if (pinnedPos) {
      setFloatPos(pinnedPos);
    } else {
      const defaultWidth = Math.min(640, Math.max(380, Math.round(window.innerWidth * 0.42)));
      const x = Math.max(12, window.innerWidth - defaultWidth - 24);
      setFloatPos({ x, y: 88 });
    }
    initialPositionSetRef.current = true;
  }, [floating, panelSettings.pinToCurrentLocation, panelSettings.pinnedPosition]);

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

  useEffect(() => {
    if (!floating) {
      setIsSettingsOpen(false);
    }
  }, [floating]);

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
    if (!floating || isSettingsOpen) return;
    if (e.button !== 0) return;
    if (e.target.closest('button, input, select')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
    e.preventDefault();
  }, [floating, isSettingsOpen]);

  useEffect(() => {
    if (!isDragging) return undefined;

    const handleMove = (e) => {
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      setFloatPos(clampToViewport(nextX, nextY));
    };

    const handleUp = () => {
      setIsDragging(false);
      setFloatPos((prev) => {
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
  }, [isDragging, clampToViewport, panelSettings.pinToCurrentLocation, updatePanelSettings]);

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
    isDragging ? 'dragging' : '',
    isSettingsOpen ? 'settings-open' : '',
  ].filter(Boolean).join(' ');

  const floatingStyle = floating ? {
    left: `${floatPos.x}px`,
    top: `${floatPos.y}px`,
  } : undefined;

  const headerStyle = panelSettings.headerBg.trim()
    ? { background: panelSettings.headerBg }
    : undefined;

  const contentStyle = {
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
      pinnedPosition: floatPos,
    });
  };

  const renderContent = () => (
    <div className="actiondeck-content" style={contentStyle}>
      <iframe
        ref={iframeRef}
        src="https://dex--briizos.us-central1.hosted.app"
        className={`actiondeck-frame ${iframeLoaded ? 'loaded' : ''}`}
        title="ActionDeck Task Management"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      <div className={`actiondeck-placeholder ${iframeLoaded ? 'hidden' : ''}`}>
        <div className="placeholder-icon">⚡</div>
        <h3>ActionDeck</h3>
        <p>Loading task management...</p>
        <p className="placeholder-hint">
          Check your internet connection
        </p>
      </div>
    </div>
  );

  const renderFront = () => (
    <>
      <div
        className={`actiondeck-header ${floating ? 'draggable' : ''}`}
        onMouseDown={handleHeaderMouseDown}
        style={headerStyle}
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
          {floating && (
            <button
              className={`actiondeck-btn star ${isSettingsOpen ? 'active' : ''}`}
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              title="Panel settings"
              aria-label="Panel settings"
              aria-pressed={isSettingsOpen}
            >
              ★
            </button>
          )}
        </div>
      </div>
      {renderContent()}
    </>
  );

  const renderSettings = () => (
    <>
      <div className="actiondeck-settings-header" style={headerStyle}>
        <div className="actiondeck-settings-heading">
          <span className="actiondeck-title">★ ActionDeck Settings</span>
          <span className="actiondeck-settings-kicker">Persistent panel parameters</span>
        </div>
        <button
          className="actiondeck-btn star active"
          onClick={() => setIsSettingsOpen(false)}
          title="Return to panel"
          aria-label="Return to panel"
        >
          ↺
        </button>
      </div>
      <div className="actiondeck-settings-body">
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Hue rotate</span>
          <span className="actiondeck-setting-value">{panelSettings.filters.hueRotate}deg</span>
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
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Saturation</span>
          <span className="actiondeck-setting-value">{panelSettings.filters.saturation}%</span>
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
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Sepia</span>
          <span className="actiondeck-setting-value">{panelSettings.filters.sepia}%</span>
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
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Contrast</span>
          <span className="actiondeck-setting-value">{panelSettings.filters.contrast}%</span>
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
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Start as</span>
          <select
            className="actiondeck-settings-select"
            value={panelSettings.startAs}
            onChange={(e) => updatePanelSettings({ startAs: e.target.value })}
          >
            <option value={PANEL_START_AS_OPTIONS.TILE}>Layout tile</option>
            <option value={PANEL_START_AS_OPTIONS.FLOATING}>Floating panel</option>
            <option value={PANEL_START_AS_OPTIONS.LAST_USE}>Last use</option>
          </select>
        </label>
        <div className="actiondeck-setting actiondeck-setting-inline">
          <div>
            <span className="actiondeck-setting-label">Pin to current location</span>
            <span className="actiondeck-setting-value">
              {panelSettings.pinToCurrentLocation ? 'Pinned' : 'Unpinned'}
            </span>
          </div>
          <button
            className={`actiondeck-btn mode ${panelSettings.pinToCurrentLocation ? 'is-on' : ''}`}
            onClick={handlePinToggle}
            title="Toggle pin to current location"
          >
            {panelSettings.pinToCurrentLocation ? 'Unpin' : 'Pin'}
          </button>
        </div>
        <label className="actiondeck-setting">
          <span className="actiondeck-setting-label">Header bg</span>
          <input
            type="text"
            className="actiondeck-settings-input"
            value={panelSettings.headerBg}
            placeholder="linear-gradient(...), rgba(...), or any CSS background"
            onChange={(e) => updatePanelSettings({ headerBg: e.target.value })}
          />
        </label>
      </div>
    </>
  );

  return (
    <div ref={containerRef} className={rootClassName} style={floatingStyle}>
      {floating ? (
        <div className="actiondeck-flip-stage">
          <section className="actiondeck-face actiondeck-face-front">
            {renderFront()}
          </section>
          <section className="actiondeck-face actiondeck-face-back">
            {renderSettings()}
          </section>
        </div>
      ) : renderFront()}
    </div>
  );
}

export default ActionDeckColumn;
