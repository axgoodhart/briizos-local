import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import './App.css';
import SourcesPanel from './components/SourcesPanel';
import InteractionPanel from './components/InteractionPanel';
import TasksPanel from './components/TasksPanel';
import MediaPanel from './components/MediaPanel';
import { JournalPanel } from './components/journals/JournalPanel.jsx';
import { JournalFloat, normalizeJournalFloatSize } from './components/journals/JournalFloat.jsx';
import { NotefallsPanel } from './components/notefalls/NotefallsPanel.jsx';
import Forest from './components/forest/Forest.jsx';
import LoginOverlay from './components/LoginOverlay';
import { TileLayout } from './components/layout/TileLayout';
import { useLayout } from './hooks/useLayout';
import './components/layout/layout.css';

// Auth context
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrganizerProvider } from './context/OrganizerContext';
import { ChatSettingsProvider } from './context/ChatSettingsContext';
import { ToolProvider, useTools } from './context/ToolContext';
import { useAppContext } from './hooks/useAppContext';
import { useToolBridge } from './hooks/useToolBridge';
import { useTaskAutomation } from './hooks/useTaskAutomation';

// New overlay imports
import { ControlBar } from './components/controlbar';
import {
  getStoredHeaderDockStyle,
  normalizeHeaderDockStyle,
  persistHeaderDockStyle,
} from './components/controlbar/dockPreferences';
import { BriiztormOverlay, OrganizerModal, CalendarModal, LiveCanvas, DashboardOverlay } from './components/overlays';
import { NotesWidget } from './components/notes';
import { CanvasesPopover, CanvasTile } from './components/canvases';
import { useCanvases } from './hooks/useCanvases';
import BfastBundle from './components/bfast/BfastBundle';
import { toast as bfastToast } from './lib/bfast-queue';
import logger from './lib/logger';
import { CANVAS_RENDER_ENGINES } from './lib/canvasUtils';
import ThemeStudio from './components/theme-studio/ThemeStudio.jsx';
import { useTheme } from './theme/ThemeProvider.jsx';
import {
  DEFAULT_CANVAS_PANEL_SETTINGS,
  PANEL_VIEW_OPTIONS,
  normalizePanelSettings,
  resolvePanelStartView,
} from './lib/floatingPanelPrefs';

// Debug counter to track renders
let appRenderCount = 0;

// WMO weather code to glyph
function wmoGlyph(code) {
  if (code === 0) return '☀';
  if (code <= 3) return '⛅';
  if (code <= 48) return '☁';
  if (code <= 57) return '🌧';
  if (code <= 67) return '🌧';
  if (code <= 77) return '❄';
  if (code <= 82) return '🌧';
  if (code <= 86) return '❄';
  if (code <= 99) return '⛈';
  return '☁';
}

const WEATHER_FALLBACK_COORDS_BY_TZ = {
  'America/New_York': { latitude: 40.7128, longitude: -74.0060 }, // NYC
  'America/Chicago': { latitude: 41.8781, longitude: -87.6298 }, // Chicago
  'America/Denver': { latitude: 39.7392, longitude: -104.9903 }, // Denver
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  default: { latitude: 40.7128, longitude: -74.0060 }
};

function getFallbackWeatherCoords() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const coordinates = WEATHER_FALLBACK_COORDS_BY_TZ[timezone] || WEATHER_FALLBACK_COORDS_BY_TZ.default;
  return { ...coordinates, source: 'timezone fallback', timezone };
}

async function getWeatherCoords() {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000
        })
      );
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        source: 'macOS location',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch (error) {
      const fallback = getFallbackWeatherCoords();
      const locationReason = error?.code === 1
        ? 'Location permission was denied'
        : error?.code === 2
          ? 'Location Services could not determine a position'
          : error?.code === 3
            ? 'Location Services did not answer within 8 seconds'
            : 'Location Services returned an unknown error';
      logger.warn(
        'weather.location',
        `${locationReason}, so only the header weather will use approximate coordinates for ${fallback.timezone}. Chat, files, screen memory, and task automation are unaffected.`,
        {
          locationError: error?.message || 'No location response',
          locationErrorCode: error?.code ?? null,
          locationFailureKind: error?.code === 1
            ? 'permission_denied'
            : error?.code === 2
              ? 'position_unavailable'
              : error?.code === 3
                ? 'timeout'
                : 'unknown',
          fallbackLatitude: fallback.latitude,
          fallbackLongitude: fallback.longitude,
          nextStep: 'No action is required unless exact local weather matters; macOS Location Services can be reviewed in System Settings.',
        },
      );
      return fallback;
    }
  }
  const fallback = getFallbackWeatherCoords();
  logger.warn(
    'weather.location',
    `This app window has no location-service interface, so only the header weather will use approximate coordinates for ${fallback.timezone}.`,
    {
      fallbackLatitude: fallback.latitude,
      fallbackLongitude: fallback.longitude,
      effect: 'No feature other than the header weather is affected.',
    },
  );
  return fallback;
}

function normalizeWeatherPayload(data) {
  const tempRaw = data?.current?.temperature_2m;
  const codeRaw = data?.current?.weather_code;
  if (typeof tempRaw !== 'number' || typeof codeRaw !== 'number') {
    throw new Error('Weather response missing current temperature/code');
  }
  return { temp: Math.round(tempRaw), code: codeRaw };
}

async function fetchWeatherDirect(lat, lon) {
  const resp = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
    { cache: 'no-store' }
  );
  if (!resp.ok) throw new Error(`Weather request failed (${resp.status})`);
  const data = await resp.json();
  return normalizeWeatherPayload(data);
}

async function fetchWeatherForCoords(lat, lon) {
  if (typeof window !== 'undefined' && typeof window.api?.weatherGetCurrent === 'function') {
    try {
      const result = await window.api.weatherGetCurrent(lat, lon);
      if (!result?.ok) {
        throw new Error(result?.error || 'Weather IPC request failed');
      }
      if (typeof result.temperature !== 'number' || typeof result.weatherCode !== 'number') {
        throw new Error('Weather IPC response missing temperature/code');
      }
      return { temp: Math.round(result.temperature), code: result.weatherCode };
    } catch (error) {
      logger.warn(
        'weather.request',
        'The main-process weather request failed. briizOS is now trying the same public weather service from the app window; the header keeps its previous value meanwhile.',
        {
          error: error?.message,
          fallbackAttempt: 'renderer fetch to Open-Meteo',
          effect: 'Only the header weather is affected.',
        },
      );
    }
  }
  return fetchWeatherDirect(lat, lon);
}

function HeaderDateTimeWeather() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [weather, setWeather] = useState('--°');

  useLayoutEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
      const day = now.getDate();
      const ord = day % 10 === 1 && day !== 11 ? 'ST' :
                  day % 10 === 2 && day !== 12 ? 'ND' :
                  day % 10 === 3 && day !== 13 ? 'RD' : 'TH';
      setDate(`${now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}.${now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}.${day}${ord}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let coordsPromise = null;
    let firstSuccessfulWeatherLogged = false;

    const resolveCoords = () => {
      if (!coordsPromise) coordsPromise = getWeatherCoords();
      return coordsPromise;
    };

    const fetchWeather = async () => {
      try {
        const {
          latitude: lat,
          longitude: lon,
          source,
          timezone,
        } = await resolveCoords();
        const { temp, code } = await fetchWeatherForCoords(lat, lon);
        if (!cancelled) {
          setWeather(`${wmoGlyph(code)} ${temp}°`);
          if (!firstSuccessfulWeatherLogged) {
            firstSuccessfulWeatherLogged = true;
            logger.info(
              'weather.updated',
              `Header weather updated using ${source || 'resolved coordinates'}.`,
              {
                temperatureFahrenheit: temp,
                weatherCode: code,
                coordinateSource: source || 'unknown',
                timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            );
          }
        }
      } catch (error) {
        logger.warn(
          'weather.failed',
          'Neither weather request path returned usable data. The header will show “--°” until the next automatic refresh in 10 minutes.',
          {
            error: error?.message,
            retryInMinutes: 10,
            effect: 'Only the header weather is unavailable.',
          },
        );
        if (!cancelled) setWeather('--°');
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 600000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="header-datetime-weather" style={{ WebkitAppRegion: 'no-drag' }}>
      <span className="header-time">{time}     <span className="header-weather">{weather}</span></span>
      <span className="header-date">{date}</span>
  
    </div>
  );
}

// Inner app component that uses auth context
function AppContent({ layout }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { executeTool } = useTools();
  const appContext = useAppContext();
  useToolBridge(executeTool, appContext);
  useTaskAutomation();
  const theme = useTheme();

  // Tool execution context (appContext + layoutHook) flows through
  // ToolContext.executeTool, which is the single tool executor used by
  // both the agent tool-bridge (useToolBridge) and autonomous workers.
  // No separate BriizTools runtime needs feeding anymore.
  appRenderCount++;
  logger.debug('ui', `App render #${appRenderCount}`);

  // Existing state
  const [showSettings, setShowSettings] = useState(false);
  /** Which Dashboard tab to land on when it opens (menu-bar "Settings…" → briizy). */
  const [dashboardTab, setDashboardTab] = useState(null);
  const [headerDockStyle, setHeaderDockStyle] = useState(getStoredHeaderDockStyle);
  const [themeStudioOpen, setThemeStudioOpen] = useState(false);
  const [themeStudioWidth, setThemeStudioWidth] = useState(320);
  const {
    getVisiblePanels,
    getPanelByType,
    addPanel,
    removePanel,
    togglePanelVisibility,
    updateColumnSizes,
    updateStackSizes,
    movePanel,
    getLayoutRow,
    updateWorkspace,
    layoutRow,
    isLoading: layoutLoading
  } = layout;

  // Workspace-persisted overlay states
  const workspace = layoutRow.workspace || {};
  const [briiztormOpen, setBriiztormOpen] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPlanningFocus, setCalendarPlanningFocus] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  // The single journal torn off the shelf (id or null); its rect lives in
  // workspace.journalFloat. One float at a time — a new pop-out replaces it.
  const [floatingJournalId, setFloatingJournalId] = useState(null);
  // Journal id the JournalPanel should open on next mount (dock hand-off).
  const [pendingOpenJournalId, setPendingOpenJournalId] = useState(null);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [canvasTitle, setCanvasTitle] = useState('Canvas');
  // Canvases library (the Control Bar folder feature)
  const [canvasesPopoverOpen, setCanvasesPopoverOpen] = useState(false);
  // openCanvases tracks which saved canvases are currently mounted
  // { [filename]: { formFactor: 'float' | 'tile' | 'hybrid' | 'widget' } }
  const [openCanvases, setOpenCanvases] = useState({});
  // The single floating canvas currently in LiveCanvas from the popover
  // (separate from the AI-driven canvasData path). Shape:
  // { filename, title, rawHtml }
  const [floatingCanvas, setFloatingCanvas] = useState(null);
  const [activePanelId, setActivePanelId] = useState(null);
  const [fullscreenPanelId, setFullscreenPanelId] = useState(null);
  const canvasesHook = useCanvases();

  const handleHeaderDockStyleChange = useCallback((nextStyle) => {
    const normalized = normalizeHeaderDockStyle(nextStyle);
    setHeaderDockStyle(normalized);
    persistHeaderDockStyle(normalized);
  }, []);

  useEffect(() => {
    if (!calendarOpen) setCalendarPlanningFocus(null);
  }, [calendarOpen]);

  // Phase 5 retirement migration: old layouts may still carry a tiled or
  // floating ActionDeck shell. Remove only that appearance; its separate web
  // app and old data are deliberately left untouched.
  const actionDeckRetirementRef = useRef(false);
  useLayoutEffect(() => {
    if (layoutLoading || actionDeckRetirementRef.current) return;
    actionDeckRetirementRef.current = true;
    const retiredPanelIds = [
      ...(layoutRow.columns || []).flatMap((column) => column.panels || []),
      ...(layoutRow.hiddenPanels || []),
    ]
      .filter((panel) => panel.type === 'actiondeck' || panel.panelId === 'actiondeck')
      .map((panel) => panel.panelId)
      .filter(Boolean);
    [...new Set(retiredPanelIds)].forEach((panelId) => removePanel(panelId));
    const clearedFloatingState = layoutRow.workspace?.actionDeckFloating === true;
    if (clearedFloatingState) updateWorkspace({ actionDeckFloating: false });
    if (retiredPanelIds.length || clearedFloatingState) {
      logger.info('ui', 'Retired embedded ActionDeck state removed from workspace', {
        panelIds: [...new Set(retiredPanelIds)],
        clearedFloatingState,
      });
    }
  }, [layoutLoading, layoutRow.columns, layoutRow.hiddenPanels, layoutRow.workspace, removePanel, updateWorkspace]);

  // Restore workspace state once the local layout loads.
  const workspaceRestoredRef = useRef(false);
  useEffect(() => {
    if (!layoutLoading && !workspaceRestoredRef.current) {
      workspaceRestoredRef.current = true;
      const ws = layoutRow.workspace;
      if (ws) {
        if (ws.notesOpen) setNotesOpen(true);
        if (ws.mediaOpen) setMediaOpen(true);
        if (typeof ws.floatingJournalId === 'string' && ws.floatingJournalId) {
          setFloatingJournalId(ws.floatingJournalId);
          logger.info('journal', 'Floating journal restored', { journalId: ws.floatingJournalId });
        }
        if (Number.isFinite(ws.themeStudioWidth)) setThemeStudioWidth(Math.min(480, Math.max(300, ws.themeStudioWidth)));
        if (ws.openCanvases && typeof ws.openCanvases === 'object') {
          setOpenCanvases(ws.openCanvases);
        }
      }
    }
  }, [layoutLoading, layoutRow.workspace]);

  // Persist overlay states to workspace (debounced via useLayout)
  useEffect(() => {
    if (!workspaceRestoredRef.current) return;
    updateWorkspace({ notesOpen, mediaOpen, openCanvases, floatingJournalId });
  }, [notesOpen, mediaOpen, openCanvases, floatingJournalId, updateWorkspace]);

  // Get the panels from the layout hook
  const panels = getVisiblePanels();
  logger.debug('ui', 'App panels', panels.map(p => p.id));
  const interactionPanel = getPanelByType('interaction');
  const journalPanel = getPanelByType('journal');
  const notefallsPanel = getPanelByType('notefalls');
  const forestPanel = getPanelByType('forest');

  const openThemeStudio = useCallback(() => {
    setShowSettings(false);
    setThemeStudioOpen(true);
  }, []);

  const closeThemeStudio = useCallback(() => {
    theme.requestClose(() => setThemeStudioOpen(false));
  }, [theme]);

  const toggleInteractionPanel = useCallback(() => {
    if (interactionPanel) {
      togglePanelVisibility(interactionPanel.id);
      return;
    }
    addPanel({ id: 'interaction', type: 'interaction', size: 20, visible: true });
  }, [interactionPanel, togglePanelVisibility, addPanel]);

  const resizeThemeStudio = useCallback((width) => {
    const next = Math.round(Math.min(480, Math.max(300, width)));
    setThemeStudioWidth(next);
    updateWorkspace({ themeStudioWidth: next });
  }, [updateWorkspace]);

  const togglePanelFullscreen = useCallback((panelId) => {
    setFullscreenPanelId((current) => current === panelId ? null : panelId);
    if (panelId) setActivePanelId(panelId);
  }, []);

  useEffect(() => {
    const tiledPanelIds = new Set(
      (layoutRow.columns || []).flatMap((column) => column.panels.map((panel) => panel.panelId)),
    );
    if (fullscreenPanelId && !tiledPanelIds.has(fullscreenPanelId)) {
      setFullscreenPanelId(null);
    }
    if (activePanelId && !tiledPanelIds.has(activePanelId)) {
      setActivePanelId(null);
    }
  }, [layoutRow.columns, fullscreenPanelId, activePanelId]);

  const openJournalPanel = useCallback(() => {
    if (journalPanel) {
      togglePanelVisibility(journalPanel.id);
      return;
    }
    addPanel({ id: 'journal', type: 'journal', size: 25, visible: true });
    logger.info('journal', 'Journal panel opened');
  }, [journalPanel, togglePanelVisibility, addPanel]);

  /* Tear a journal off the shelf into the floating editor. seedRect (the
     cover card's screen rect) places the float where the tear happened,
     keeping the previously persisted size; a null seed reuses the last
     rect. One float at a time — a second pop-out replaces the first. */
  const popOutJournal = useCallback((journalId, seedRect = null, source = 'shelf') => {
    setFloatingJournalId((prev) => {
      if (prev && prev !== journalId) {
        logger.info('journal', 'Floating journal replaced', { from: prev, to: journalId });
      }
      return journalId;
    });
    if (seedRect) {
      const { width, height } = normalizeJournalFloatSize(workspace.journalFloat);
      updateWorkspace({
        journalFloat: {
          x: Math.max(12, Math.min(seedRect.left, window.innerWidth - width - 12)),
          y: Math.max(12, Math.min(seedRect.top, window.innerHeight - height - 12)),
          width,
          height,
        },
      });
    }
    logger.info('journal', 'Journal popped out', { journalId, source });
  }, [updateWorkspace, workspace.journalFloat]);

  const closeJournalFloat = useCallback(() => {
    setFloatingJournalId((prev) => {
      if (prev) logger.info('journal', 'Floating journal closed', { journalId: prev });
      return null;
    });
  }, []);

  /* Dock the float back into the Journals panel: close the float, make the
     panel visible (openJournalPanel toggles, so don't reuse it here), and
     hand the journal id to JournalPanel to open once its list loads. */
  const dockJournalFloat = useCallback(() => {
    const journalId = floatingJournalId;
    if (!journalId) return;
    setFloatingJournalId(null);
    setPendingOpenJournalId(journalId);
    if (journalPanel && !journalPanel.visible) {
      togglePanelVisibility(journalPanel.id);
    } else if (!journalPanel) {
      addPanel({ id: 'journal', type: 'journal', size: 25, visible: true });
    }
    logger.info('journal', 'Floating journal docked to panel', { journalId });
  }, [floatingJournalId, journalPanel, togglePanelVisibility, addPanel]);

  const openNotefallsPanel = useCallback(() => {
    if (notefallsPanel) {
      togglePanelVisibility(notefallsPanel.id);
      return;
    }
    addPanel({ id: 'notefalls', type: 'notefalls', size: 25, visible: true });
    logger.info('notefalls', 'Notefalls panel opened');
  }, [notefallsPanel, togglePanelVisibility, addPanel]);

  // Navigation from the briizy menu-bar item and avatar. Until 2026-07-27
  // nothing listened on this channel, so "Settings…" and "open in briizOS"
  // silently did nothing.
  useEffect(() => {
    const off = window.briizy?.onNavigate?.((options) => {
      logger.info('briizy', 'Navigate request from menu bar / avatar', options);
      if (options.route === 'briizy-settings') {
        setDashboardTab('briizy');
        setShowSettings(true);
      } else if (options.route === 'notefalls') {
        openNotefallsPanel();
      }
    });
    return () => off?.();
  }, [openNotefallsPanel]);

  const openForestPanel = useCallback(() => {
    if (forestPanel) {
      togglePanelVisibility(forestPanel.id);
      return;
    }
    addPanel({ id: 'forest', type: 'forest', size: 25, visible: true });
    logger.info('forest', 'Forest panel opened');
  }, [forestPanel, togglePanelVisibility, addPanel]);

  // ----- Canvases (folder library of saved mini-apps) -----

  const openCanvasTile = useCallback((filename) => {
    const panelId = `canvas:${filename}`;
    // addPanel is idempotent: if a panel with this id already exists
    // (via findPanelLocation check inside useLayout) it is a no-op.
    addPanel({
      id: panelId,
      type: 'canvas',
      size: 25,
      visible: true,
    });
    logger.info('canvases', 'Canvas tile opened', { filename });
  }, [addPanel]);

  const openCanvasFloating = useCallback(async (canvas) => {
    if (!canvas?.filename) return;
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.canvasLoad) {
      logger.warn('canvases', 'Canvas IPC unavailable — cannot open floating canvas');
      return;
    }
    try {
      const raw = await api.canvasLoad(canvas.filename);
      const meta = api.canvasLoadMeta ? await api.canvasLoadMeta(canvas.filename) : {};
      setFloatingCanvas({
        filename: canvas.filename,
        title: canvas.title || canvas.filename,
        rawHtml: raw || '',
        meta: { ...(meta || {}), source: canvas.source || meta?.source },
      });
      setCanvasData({
        filename: canvas.filename,
        rawHtml: raw || '',
        html: '',
        css: '',
        js: '',
        meta: { ...(meta || {}), source: canvas.source || meta?.source },
      });
      setCanvasTitle(canvas.title || canvas.filename);
      setCanvasOpen(true);
      logger.info('canvases', 'Canvas float opened', { filename: canvas.filename });
    } catch (err) {
      logger.error('canvases', 'Failed to open canvas float', { filename: canvas.filename, error: String(err) });
    }
  }, []);

  const persistCanvasPanelSettings = useCallback(async (filename, updater) => {
    if (!filename) return DEFAULT_CANVAS_PANEL_SETTINGS;
    const existing = await canvasesHook.loadMeta(filename);
    const currentSettings = normalizePanelSettings(
      existing?.panelSettings || {},
      DEFAULT_CANVAS_PANEL_SETTINGS
    );
    const nextSettings = normalizePanelSettings(
      typeof updater === 'function' ? updater(currentSettings) : { ...currentSettings, ...updater },
      DEFAULT_CANVAS_PANEL_SETTINGS
    );
    await canvasesHook.saveMeta(filename, {
      ...(existing || {}),
      panelSettings: nextSettings,
    });
    if (floatingCanvas?.filename === filename) {
      setFloatingCanvas((prev) => prev ? {
        ...prev,
        meta: { ...(prev.meta || {}), panelSettings: nextSettings },
      } : null);
      setCanvasData((prev) => prev ? {
        ...prev,
        meta: { ...(prev.meta || {}), panelSettings: nextSettings },
      } : null);
    }
    return nextSettings;
  }, [canvasesHook, floatingCanvas]);

  const handleOpenCanvas = useCallback(async (canvas) => {
    if (!canvas) return;
    const meta = await canvasesHook.loadMeta(canvas.filename);
    const preferredView = resolvePanelStartView(
      meta?.panelSettings || DEFAULT_CANVAS_PANEL_SETTINGS,
      PANEL_VIEW_OPTIONS.FLOATING
    );
    const factor = preferredView === PANEL_VIEW_OPTIONS.TILE ? 'tile' : 'float';
    setOpenCanvases((prev) => ({ ...prev, [canvas.filename]: { formFactor: factor } }));
    await persistCanvasPanelSettings(canvas.filename, { lastUsedView: preferredView });
    if (factor === 'tile') {
      openCanvasTile(canvas.filename);
    }
    if (factor === 'float') {
      await openCanvasFloating(canvas);
    }
  }, [canvasesHook, openCanvasTile, openCanvasFloating, persistCanvasPanelSettings]);

  const handleCreateCanvas = useCallback(async ({ source, name, html, meta }) => {
    const created = await canvasesHook.createCanvas({
      title: name,
      html,
      formFactor: 'float',
      source,
      meta,
    });
    if (created) {
      await canvasesHook.refresh();
      // Auto-open the new canvas in its default (float) form factor
      await handleOpenCanvas({
        filename: created.filename,
        title: created.title,
        formFactor: 'float',
      });
    }
    return created;
  }, [canvasesHook, handleOpenCanvas]);

  const handleDeleteCanvas = useCallback(async (canvas) => {
    if (!canvas?.filename) return;
    await canvasesHook.deleteCanvas(canvas.filename);
    // Remove tile panel from layout (not just hide — fully remove)
    const panelId = `canvas:${canvas.filename}`;
    removePanel(panelId);
    setOpenCanvases((prev) => {
      if (!prev[canvas.filename]) return prev;
      const next = { ...prev };
      delete next[canvas.filename];
      return next;
    });
    if (floatingCanvas?.filename === canvas.filename) {
      setFloatingCanvas(null);
      setCanvasOpen(false);
      setCanvasData(null);
    }
  }, [canvasesHook, floatingCanvas, removePanel]);

  const handleRenameCanvas = useCallback(async (canvas, newTitle) => {
    if (!canvas?.filename) return;
    const res = await canvasesHook.renameCanvas(canvas.filename, newTitle);
    if (res?.success && res.filename && res.filename !== canvas.filename) {
      const oldPanelId = `canvas:${canvas.filename}`;
      const newPanelId = `canvas:${res.filename}`;
      // Swap tile panel: remove old, add new with same form factor
      setOpenCanvases((prev) => {
        if (!prev[canvas.filename]) return prev;
        const entry = prev[canvas.filename];
        // If this canvas had a tile panel, replace it in the layout
        if (entry.formFactor === 'tile' || entry.formFactor === 'hybrid') {
          removePanel(oldPanelId);
          addPanel({ id: newPanelId, type: 'canvas', size: 25, visible: true });
        }
        const next = { ...prev };
        next[res.filename] = entry;
        delete next[canvas.filename];
        return next;
      });
      // Update floating canvas reference if open
      if (floatingCanvas?.filename === canvas.filename) {
        setFloatingCanvas((prev) => prev ? { ...prev, filename: res.filename, title: newTitle } : null);
      }
    }
  }, [canvasesHook, removePanel, addPanel, floatingCanvas]);

  const handleSetCanvasFormFactor = useCallback(async (canvas, factor) => {
    if (!canvas?.filename) return;
    if (factor === 'widget') {
      try { bfastToast('Widget mode — coming soon'); } catch { /* ignore */ }
      return;
    }
    const prev = openCanvases[canvas.filename];
    const hadTile = prev && (prev.formFactor === 'tile' || prev.formFactor === 'hybrid');
    const hadFloat = prev && (prev.formFactor === 'float' || prev.formFactor === 'hybrid');
    const wantsTile = factor === 'tile' || factor === 'hybrid';
    const wantsFloat = factor === 'float' || factor === 'hybrid';

    await canvasesHook.setFormFactor(canvas.filename, factor);
    // If this canvas is currently open, update its mount shape live
    if (prev) {
      setOpenCanvases((oc) => ({ ...oc, [canvas.filename]: { formFactor: factor } }));
      // Remove tile panel if no longer needed
      if (hadTile && !wantsTile) {
        removePanel(`canvas:${canvas.filename}`);
      }
      // Add tile panel if now needed
      if (wantsTile && !hadTile) {
        openCanvasTile(canvas.filename);
      }
      // Close float if no longer needed
      if (hadFloat && !wantsFloat && floatingCanvas?.filename === canvas.filename) {
        setFloatingCanvas(null);
        setCanvasOpen(false);
        setCanvasData(null);
      }
      // Open float if now needed
      if (wantsFloat && !hadFloat) {
        await openCanvasFloating({ filename: canvas.filename, title: canvas.title, formFactor: factor });
      }
    }
  }, [canvasesHook, openCanvases, openCanvasTile, openCanvasFloating, removePanel, floatingCanvas]);

  const handleSetCanvasRenderEngine = useCallback(async (canvas, renderEngine) => {
    if (!canvas?.filename) return;
    await canvasesHook.setRenderEngine(canvas.filename, renderEngine);
    if (floatingCanvas?.filename === canvas.filename) {
      setFloatingCanvas((prev) => prev ? {
        ...prev,
        meta: { ...(prev.meta || {}), renderEngine },
      } : null);
      setCanvasData((prev) => prev ? {
        ...prev,
        meta: { ...(prev.meta || {}), renderEngine },
      } : null);
    }
  }, [canvasesHook, floatingCanvas]);

  const handleToggleCanvasMount = useCallback(async (filename, mountType) => {
    if (!filename || (mountType !== 'tile' && mountType !== 'float')) return;
    const canvas = canvasesHook.canvases.find((entry) => entry.filename === filename)
      || (floatingCanvas?.filename === filename ? {
        filename,
        title: floatingCanvas.title,
        formFactor: openCanvases[filename]?.formFactor || 'float',
      } : null);
    if (!canvas) return;

    const currentFactor = openCanvases[filename]?.formFactor || canvas.formFactor || 'float';
    const hasTile = currentFactor === 'tile' || currentFactor === 'hybrid';
    const hasFloat = currentFactor === 'float' || currentFactor === 'hybrid';
    const nextHasTile = mountType === 'tile' ? !hasTile : hasTile;
    const nextHasFloat = mountType === 'float' ? !hasFloat : hasFloat;

    if (!nextHasTile && !nextHasFloat) {
      return;
    }

    const nextFactor = nextHasTile && nextHasFloat
      ? 'hybrid'
      : nextHasTile
        ? 'tile'
        : 'float';

    await persistCanvasPanelSettings(filename, {
      lastUsedView: mountType === 'tile' ? PANEL_VIEW_OPTIONS.TILE : PANEL_VIEW_OPTIONS.FLOATING,
    });
    await handleSetCanvasFormFactor(canvas, nextFactor);
  }, [
    canvasesHook.canvases,
    floatingCanvas,
    handleSetCanvasFormFactor,
    openCanvases,
    persistCanvasPanelSettings,
  ]);

  const handlePromoteCanvasToBrowser = useCallback(async (filename) => {
    if (!filename) return;
    const canvas = canvasesHook.canvases.find((entry) => entry.filename === filename);
    if (!canvas) return;
    if (canvas.renderEngine === CANVAS_RENDER_ENGINES.BROWSER) return;
    await handleSetCanvasRenderEngine(canvas, CANVAS_RENDER_ENGINES.BROWSER);
  }, [canvasesHook.canvases, handleSetCanvasRenderEngine]);

  const handleSaveFloatingCanvas = useCallback(async (srcdoc) => {
    if (!floatingCanvas) return;
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.canvasSave) return;
    try {
      await api.canvasSave(floatingCanvas.title || 'Canvas', srcdoc);
      await canvasesHook.refresh();
      logger.info('canvases', 'Floating canvas saved', { title: floatingCanvas.title });
    } catch (err) {
      logger.error('canvases', 'Failed to save floating canvas', { error: String(err) });
    }
  }, [floatingCanvas, canvasesHook]);

  const closeCanvasPanel = useCallback((panelId) => {
    const prefix = 'canvas:';
    if (typeof panelId !== 'string' || !panelId.startsWith(prefix)) return;
    const filename = panelId.slice(prefix.length);
    togglePanelVisibility(panelId);
    setOpenCanvases((prev) => {
      if (!prev[filename]) return prev;
      const current = prev[filename];
      // For hybrid, keep float open; remove tile dimension only
      if (current.formFactor === 'hybrid') {
        return { ...prev, [filename]: { formFactor: 'float' } };
      }
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    logger.info('canvases', 'Canvas tile closed', { filename });
  }, [togglePanelVisibility]);

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.canvasList || layoutLoading || canvasesHook.isLoading) return;

    const liveFilenames = new Set(
      canvasesHook.canvases
        .map(canvas => canvas?.filename)
        .filter(Boolean)
    );
    const canvasPanelIds = new Set();

    (layoutRow.columns || []).forEach((column) => {
      (column.panels || []).forEach((panel) => {
        if (typeof panel.panelId === 'string' && panel.panelId.startsWith('canvas:')) {
          canvasPanelIds.add(panel.panelId);
        }
      });
    });
    (layoutRow.hiddenPanels || []).forEach((panel) => {
      if (typeof panel.panelId === 'string' && panel.panelId.startsWith('canvas:')) {
        canvasPanelIds.add(panel.panelId);
      }
    });

    const orphanPanelIds = [...canvasPanelIds].filter((panelId) => {
      const filename = panelId.slice('canvas:'.length);
      return !liveFilenames.has(filename);
    });

    if (orphanPanelIds.length === 0) return;

    orphanPanelIds.forEach(removePanel);
    setOpenCanvases((prev) => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([filename, entry]) => {
        if (liveFilenames.has(filename)) {
          next[filename] = entry;
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    if (floatingCanvas?.filename && !liveFilenames.has(floatingCanvas.filename)) {
      setFloatingCanvas(null);
      setCanvasOpen(false);
      setCanvasData(null);
    }
    logger.info('canvases', 'Removed orphaned canvas panels from layout', { orphanPanelIds });
  }, [
    canvasesHook.canvases,
    canvasesHook.isLoading,
    floatingCanvas,
    layoutLoading,
    layoutRow.columns,
    layoutRow.hiddenPanels,
    removePanel,
  ]);

  // Track mount/unmount
  useEffect(() => {
    logger.debug('ui', `App MOUNTED (render #${appRenderCount})`);
    return () => {
      logger.debug('ui', `App UNMOUNTED (render #${appRenderCount})`);
    };
  }, []);

  // Keyboard shortcuts — declarative table (key/label/run) iterated by one
  // handler, instead of a growing switch(e.key) block. Each entry's `run` is
  // symmetric with the others: all the "Toggle X" shortcuts actually toggle,
  // including Journal/Forest/Notefalls (openJournalPanel/openNotefallsPanel/
  // openForestPanel now flip visibility instead of no-op'ing when already
  // open). 'o'/'c' stay open-only on purpose — they always open, never close.
  const shortcuts = useMemo(() => [
    { key: 'b', label: 'Toggle briiZtorm', run: () => setBriiztormOpen((prev) => !prev) },
    { key: 'o', label: 'Open Organizer', run: () => setOrganizerOpen(true) },
    { key: 'c', label: 'Open Calendar', run: () => setCalendarOpen(true) },
    { key: 'm', label: 'Toggle Media', run: () => setMediaOpen((prev) => !prev) },
    { key: 'n', label: 'Toggle Notes', run: () => setNotesOpen((prev) => !prev) },
    { key: 'v', label: 'Toggle Canvas', run: () => setCanvasOpen((prev) => !prev) },
    { key: 'k', label: 'Toggle Canvases library', run: () => setCanvasesPopoverOpen((prev) => !prev) },
    { key: 'j', label: 'Toggle Journal', run: () => openJournalPanel() },
    { key: 'l', label: 'Toggle Notefalls', run: () => openNotefallsPanel() },
    { key: 'f', label: 'Toggle Forest', run: () => openForestPanel() },
    {
      key: 'x',
      label: 'Toggle active panel fullscreen',
      run: () => {
        if (fullscreenPanelId) setFullscreenPanelId(null);
        else if (activePanelId) togglePanelFullscreen(activePanelId);
      },
    },
  ], [openJournalPanel, openNotefallsPanel, openForestPanel, fullscreenPanelId, activePanelId, togglePanelFullscreen]);

  useEffect(() => {
    // Don't hijack Cmd/Ctrl+Shift+<letter> while the user is typing —
    // same guard JournalView uses for its own arrow/Escape handling.
    const isTypingTarget = (el) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const handleKeyDown = (e) => {
      // Check for Cmd/Ctrl + Shift combinations
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !isTypingTarget(document.activeElement)) {
        const shortcut = shortcuts.find((s) => s.key === e.key.toLowerCase());
        if (shortcut) {
          e.preventDefault();
          shortcut.run();
        }
      }

      // Escape closes topmost overlay
      if (e.key === 'Escape') {
        if (fullscreenPanelId) {
          setFullscreenPanelId(null);
        } else if (canvasesPopoverOpen) {
          setCanvasesPopoverOpen(false);
        } else if (canvasOpen) {
          setCanvasOpen(false);
        } else if (organizerOpen) {
          setOrganizerOpen(false);
        } else if (calendarOpen) {
          setCalendarOpen(false);
        } else if (briiztormOpen) {
          setBriiztormOpen(false);
        } else if (floatingJournalId && !isTypingTarget(document.activeElement)) {
          // Typing guard: Escape inside the float's editor shouldn't close it.
          closeJournalFloat();
        } else if (notesOpen) {
          setNotesOpen(false);
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, organizerOpen, calendarOpen, briiztormOpen, notesOpen, showSettings, canvasOpen, canvasesPopoverOpen, fullscreenPanelId, floatingJournalId, closeJournalFloat]);

  useEffect(() => {
    const openPriorityPlanner = (event) => {
      const candidate = event.detail?.candidate;
      if (!candidate?.id || !['task', 'forest_project'].includes(candidate.type)) return;
      setCalendarPlanningFocus(candidate);
      setCalendarOpen(true);
      logger.info('agent.prioritize', 'Priority result handed to day planner', {
        candidateId: candidate.id,
        candidateType: candidate.type,
        label: candidate.label || null,
      });
    };
    window.addEventListener('briizos-plan-priority-today', openPriorityPlanner);
    return () => window.removeEventListener('briizos-plan-priority-today', openPriorityPlanner);
  }, []);

  // Listen for canvas events from tool system
  useEffect(() => {
    const handleCanvasEvent = (e) => {
      const { action, title, data } = e.detail;
      logger.debug('canvas', 'Canvas event received', { action, title, dataKeys: data ? Object.keys(data) : null, htmlLen: data?.html?.length, cssLen: data?.css?.length });
      if (action === 'open') {
        setCanvasData(data);
        setCanvasTitle(title || 'Canvas');
        setCanvasOpen(true);
      } else if (action === 'update') {
        setCanvasData(prev => prev ? {
          html: data.html ?? prev.html,
          css: data.css ?? prev.css,
          js: data.js ?? prev.js,
        } : null);
      }
    };
    window.addEventListener('briizos-canvas', handleCanvasEvent);
    return () => window.removeEventListener('briizos-canvas', handleCanvasEvent);
  }, []);

  // Render the appropriate component based on panel type
  const renderPanel = useCallback((panel) => {
    switch (panel.type) {
      case 'sources':
        return <SourcesPanel />;
      case 'interaction':
        return <InteractionPanel />;
      case 'tasks':
        return <TasksPanel />;
      case 'media':
        return <MediaPanel />;
      case 'journal':
        return (
          <JournalPanel
            onPopOutJournal={popOutJournal}
            floatingJournalId={floatingJournalId}
            pendingOpenJournalId={pendingOpenJournalId}
            onPendingOpenHandled={() => setPendingOpenJournalId(null)}
          />
        );
      case 'notefalls':
        return <NotefallsPanel />;
      case 'forest':
        return <Forest />;
      case 'canvas': {
        const canvasFilename = String(panel.panelId || panel.id || '').replace(/^canvas:/, '');
        const canvasEntry = canvasesHook.canvases.find((entry) => entry.filename === canvasFilename);
        return (
          <CanvasTile
            panel={panel}
            metaOverride={canvasEntry ? {
              displayName: canvasEntry.title,
              source: canvasEntry.source,
              renderEngine: canvasEntry.renderEngine,
              url: canvasEntry.url,
            } : null}
            onClose={() => closeCanvasPanel(panel.panelId || panel.id)}
            isTileActive
            isFloatActive={(() => {
              const factor = openCanvases[canvasFilename]?.formFactor || 'tile';
              return factor === 'float' || factor === 'hybrid';
            })()}
            onPromoteBrowser={() => handlePromoteCanvasToBrowser(canvasFilename)}
            onToggleTile={() => handleToggleCanvasMount(canvasFilename, 'tile')}
            onToggleFloat={() => handleToggleCanvasMount(canvasFilename, 'float')}
          />
        );
      }
      default:
        return (
          <div className="panel">
            <div className="panel-header">
              <span>{panel.type || 'Unknown'}</span>
            </div>
            <div className="panel-content">
              Unknown panel type: {panel.type}
            </div>
          </div>
        );
    }
  }, [canvasesHook.canvases, closeCanvasPanel, handlePromoteCanvasToBrowser, handleToggleCanvasMount, openCanvases, popOutJournal, floatingJournalId, pendingOpenJournalId]);

  return (
    <div
      className={`app ${themeStudioOpen ? 'theme-studio-docked' : ''}`}
      style={themeStudioOpen ? { '--theme-studio-width': `${themeStudioWidth}px` } : undefined}
      data-theme-role="canvas"
      data-theme-component="Application"
    >
      <header className="app-header" data-theme-role="header" data-theme-component="Application">
        <div className="header-title">
          <span className="title-icon:before"></span>
          <span className="title-icon" id="settings-btn" data-theme-role="button-icon" data-theme-component="Application" onClick={() => setShowSettings(true)}></span>
          <span className="title-text" data-theme-role="wordmark" data-theme-component="Application">briizOS</span>
        </div>

        <div className="header-dock-slot" data-theme-role="control-dock" data-theme-component="Application">
          <ControlBar
            variant="dock"
            dockStyle={headerDockStyle}
            chatOpen={interactionPanel?.visible === true}
            briiztormOpen={briiztormOpen}
            organizerOpen={organizerOpen}
            calendarOpen={calendarOpen}
            mediaOpen={mediaOpen}
            notesOpen={notesOpen}
            canvasesOpen={canvasesPopoverOpen}
            onToggleChat={toggleInteractionPanel}
            onToggleBriiztorm={() => setBriiztormOpen(!briiztormOpen)}
            onOpenOrganizer={() => setOrganizerOpen((prev) => !prev)}
            onOpenCalendar={() => setCalendarOpen((prev) => !prev)}
            onToggleMedia={() => setMediaOpen((prev) => !prev)}
            onToggleNotes={() => setNotesOpen(!notesOpen)}
            onToggleCanvases={() => setCanvasesPopoverOpen((prev) => !prev)}
            canvasesPopoverSlot={(
              <CanvasesPopover
                isOpen={canvasesPopoverOpen}
                onClose={() => setCanvasesPopoverOpen(false)}
                canvases={canvasesHook.canvases}
                isLoading={canvasesHook.isLoading}
                onOpenCanvas={handleOpenCanvas}
                onCreateCanvas={handleCreateCanvas}
                onDeleteCanvas={handleDeleteCanvas}
                onRenameCanvas={handleRenameCanvas}
                onSetFormFactor={handleSetCanvasFormFactor}
                onSetRenderEngine={handleSetCanvasRenderEngine}
              />
            )}
          />
        </div>

        <div className="header-right">
          <HeaderDateTimeWeather />

        </div>

        <div id="controlBarBtn" aria-hidden="true"></div>
      </header>

      {/* Control Bar with Toggles */}
      <div className="controlBar closed" id="controlBar">
        <ControlBar variant="bar" />
      </div>

      {/* Main Content */}
      <main className="app-main">
        <TileLayout
          layoutRow={getLayoutRow()}
          renderPanel={renderPanel}
          onColumnResize={updateColumnSizes}
          onStackResize={updateStackSizes}
          onMovePanel={movePanel}
          fullscreenPanelId={fullscreenPanelId}
          onTogglePanelFullscreen={togglePanelFullscreen}
          onActivatePanel={setActivePanelId}
        />
      </main>

      {/* Overlays */}
      <BriiztormOverlay
        isOpen={briiztormOpen}
        onClose={() => setBriiztormOpen(false)}
      />

      {/* Modals */}
      <OrganizerModal
        isOpen={organizerOpen}
        onClose={() => setOrganizerOpen(false)}
      />

      <CalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        planningFocus={calendarPlanningFocus}
        onPlanningFocusHandled={() => setCalendarPlanningFocus(null)}
      />

      {/* Notes Widget */}
      <NotesWidget
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        drawerPosition={workspace.notesDrawer ? { x: workspace.notesDrawer.x, y: workspace.notesDrawer.y } : null}
        drawerDimensions={workspace.notesDrawer ? { width: workspace.notesDrawer.width, height: workspace.notesDrawer.height } : null}
        onDrawerChange={(pos, size) => {
          updateWorkspace({
            notesDrawer: pos
              ? { x: pos.x, y: pos.y, width: size.width, height: size.height }
              : { width: size.width, height: size.height }
          });
        }}
      />

      {mediaOpen && (
        <MediaPanel
          floating
          onClose={() => setMediaOpen(false)}
          panelPosition={workspace.mediaPanel ? { x: workspace.mediaPanel.x, y: workspace.mediaPanel.y } : null}
          panelDimensions={workspace.mediaPanel ? { width: workspace.mediaPanel.width, height: workspace.mediaPanel.height } : null}
          onPanelChange={(pos, size) => {
            updateWorkspace({
              mediaPanel: pos
                ? { x: pos.x, y: pos.y, width: size.width, height: size.height }
                : { width: size.width, height: size.height }
            });
          }}
        />
      )}

      {/* Floating journal — a journal torn off the shelf, alive even when
          the Journals panel tile is closed. */}
      {floatingJournalId && (
        <JournalFloat
          journalId={floatingJournalId}
          onClose={closeJournalFloat}
          onDock={dockJournalFloat}
          panelPosition={workspace.journalFloat ? { x: workspace.journalFloat.x, y: workspace.journalFloat.y } : null}
          panelDimensions={workspace.journalFloat ? normalizeJournalFloatSize(workspace.journalFloat) : null}
          onPanelChange={(pos, size) => {
            updateWorkspace({
              journalFloat: pos
                ? { x: pos.x, y: pos.y, width: size.width, height: size.height }
                : { width: size.width, height: size.height }
            });
          }}
        />
      )}

      {/* Live Canvas */}
      <LiveCanvas
        isOpen={canvasOpen}
        onClose={() => {
          setCanvasOpen(false);
          setFloatingCanvas(null);
        }}
        canvasData={canvasData}
        title={canvasTitle}
        onSave={floatingCanvas ? handleSaveFloatingCanvas : undefined}
        isTileActive={floatingCanvas ? (() => {
          const factor = openCanvases[floatingCanvas.filename]?.formFactor || 'float';
          return factor === 'tile' || factor === 'hybrid';
        })() : false}
        isFloatActive={!!floatingCanvas}
        onToggleTile={floatingCanvas ? () => handleToggleCanvasMount(floatingCanvas.filename, 'tile') : undefined}
        onToggleFloat={floatingCanvas ? () => handleToggleCanvasMount(floatingCanvas.filename, 'float') : undefined}
        onPromoteBrowser={floatingCanvas ? () => handlePromoteCanvasToBrowser(floatingCanvas.filename) : undefined}
      />

      {/* Dashboard (replaces Settings Modal) */}
      <DashboardOverlay
        isOpen={showSettings}
        onClose={() => { setShowSettings(false); setDashboardTab(null); }}
        onOpenThemeStudio={openThemeStudio}
        initialTab={dashboardTab}
        headerDockStyle={headerDockStyle}
        onHeaderDockStyleChange={handleHeaderDockStyleChange}
      />

      <ThemeStudio
        isOpen={themeStudioOpen}
        width={themeStudioWidth}
        onWidthChange={resizeThemeStudio}
        onClose={closeThemeStudio}
      />

      {/* Login Overlay - Shows when not authenticated */}
      <LoginOverlay />

      {/* Bfast Bundle — toasts, snackbars, and margerin intent holds */}
      <BfastBundle />
    </div>
  );
}

// Main App component with AuthProvider wrapper
function App() {
  const layout = useLayout();

  return (
    <AuthProvider>
      <OrganizerProvider>
        <ChatSettingsProvider>
          <ToolProvider layoutHook={layout}>
            <AppContent layout={layout} />
          </ToolProvider>
        </ChatSettingsProvider>
      </OrganizerProvider>
    </AuthProvider>
  );
}

export default App;
