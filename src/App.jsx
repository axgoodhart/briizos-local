import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import SourcesPanel from './components/SourcesPanel';
import InteractionPanel from './components/InteractionPanel';
import TasksPanel from './components/TasksPanel';
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
import { useAgentWorkers } from './hooks/useAgentWorkers';
import { useToolBridge } from './hooks/useToolBridge';

// New overlay imports
import { ControlBar } from './components/controlbar';
import { BriiztormOverlay, ActionDeckColumn, OrganizerModal, CalendarModal, LiveCanvas, DashboardOverlay } from './components/overlays';
import { NotesWidget } from './components/notes';
import logger from './lib/logger';

const UI_THEME_STORAGE_KEY = 'briizos.ui_theme';

function applyUiTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'mint-icecube') {
    root.setAttribute('data-theme', 'mint-icecube');
    return;
  }
  root.removeAttribute('data-theme');
}

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
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return WEATHER_FALLBACK_COORDS_BY_TZ[tz] || WEATHER_FALLBACK_COORDS_BY_TZ.default;
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
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (error) {
      logger.warn('ui', 'Geolocation unavailable for weather, using timezone fallback', error?.message);
    }
  }
  return getFallbackWeatherCoords();
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
      logger.warn('ui', 'Weather IPC path failed, trying renderer fetch fallback', error?.message);
    }
  }
  return fetchWeatherDirect(lat, lon);
}

function HeaderDateTimeWeather() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [weather, setWeather] = useState('--°');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
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

    const resolveCoords = () => {
      if (!coordsPromise) coordsPromise = getWeatherCoords();
      return coordsPromise;
    };

    const fetchWeather = async () => {
      try {
        const { latitude: lat, longitude: lon } = await resolveCoords();
        const { temp, code } = await fetchWeatherForCoords(lat, lon);
        if (!cancelled) {
          setWeather(`${wmoGlyph(code)} ${temp}°`);
        }
      } catch (error) {
        logger.warn('ui', 'Failed to refresh header weather', error?.message);
        if (!cancelled) setWeather('--°');
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 600000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="header-datetime-weather" style={{ WebkitAppRegion: 'no-drag' }}>
      <span className="header-time">{time}</span>
      <span className="header-date">{date}</span>
      <span className="header-weather">{weather}</span>
    </div>
  );
}

// Inner app component that uses auth context
function AppContent({ layout }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { executeTool } = useTools();
  const appContext = useAppContext();
  useAgentWorkers(executeTool, appContext);
  useToolBridge(executeTool, appContext);
  appRenderCount++;
  logger.debug('ui', `App render #${appRenderCount}`);

  // Existing state
  const [showSettings, setShowSettings] = useState(false);
  const {
    getVisiblePanels,
    getPanelByType,
    addPanel,
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
  const [actionDeckFloating, setActionDeckFloating] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [controlBarOpen, setControlBarOpen] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [canvasTitle, setCanvasTitle] = useState('Canvas');

  useEffect(() => {
    const savedTheme = localStorage.getItem(UI_THEME_STORAGE_KEY) || 'default';
    applyUiTheme(savedTheme);
  }, []);

  // Restore workspace state once layout loads from Firestore
  const workspaceRestoredRef = useRef(false);
  useEffect(() => {
    if (!layoutLoading && !workspaceRestoredRef.current) {
      workspaceRestoredRef.current = true;
      const ws = layoutRow.workspace;
      if (ws) {
        if (ws.notesOpen) setNotesOpen(true);
        if (ws.actionDeckFloating) setActionDeckFloating(true);
        if (ws.controlBarOpen) setControlBarOpen(true);
      }
    }
  }, [layoutLoading, layoutRow.workspace]);

  // Persist overlay states to workspace (debounced via useLayout)
  useEffect(() => {
    if (!workspaceRestoredRef.current) return;
    updateWorkspace({ notesOpen, actionDeckFloating, controlBarOpen });
  }, [notesOpen, actionDeckFloating, controlBarOpen, updateWorkspace]);

  // Get the panels from the layout hook
  const panels = getVisiblePanels();
  logger.debug('ui', 'App panels', panels.map(p => p.id));
  const actionDeckPanel = getPanelByType('actiondeck');
  const actionDeckOpen = actionDeckFloating || actionDeckPanel?.visible === true;

  const openActionDeckColumn = useCallback(() => {
    if (actionDeckPanel?.visible) return;
    if (actionDeckPanel) {
      togglePanelVisibility(actionDeckPanel.id);
      return;
    }
    addPanel({
      id: 'actiondeck',
      type: 'actiondeck',
      size: 25,
      visible: true
    });
  }, [actionDeckPanel, togglePanelVisibility, addPanel]);

  const hideActionDeckColumn = useCallback(() => {
    if (actionDeckPanel?.visible) {
      togglePanelVisibility(actionDeckPanel.id);
    }
  }, [actionDeckPanel, togglePanelVisibility]);

  const toggleActionDeck = useCallback(() => {
    if (actionDeckFloating) {
      setActionDeckFloating(false);
      return;
    }
    if (actionDeckPanel?.visible) {
      hideActionDeckColumn();
      return;
    }
    openActionDeckColumn();
  }, [actionDeckFloating, actionDeckPanel, hideActionDeckColumn, openActionDeckColumn]);

  const popOutActionDeck = useCallback(() => {
    hideActionDeckColumn();
    setActionDeckFloating(true);
  }, [hideActionDeckColumn]);

  const dockActionDeck = useCallback(() => {
    setActionDeckFloating(false);
    openActionDeckColumn();
  }, [openActionDeckColumn]);

  const closeActionDeck = useCallback(() => {
    if (actionDeckFloating) {
      setActionDeckFloating(false);
      return;
    }
    hideActionDeckColumn();
  }, [actionDeckFloating, hideActionDeckColumn]);

  // Track mount/unmount
  useEffect(() => {
    logger.debug('ui', `App MOUNTED (render #${appRenderCount})`);
    return () => {
      logger.debug('ui', `App UNMOUNTED (render #${appRenderCount})`);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd/Ctrl + Shift combinations
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b': // Cmd+Shift+B - Toggle briiZtorm
            e.preventDefault();
            setBriiztormOpen(prev => !prev);
            break;
          case 'a': // Cmd+Shift+A - Toggle ActionDeck
            e.preventDefault();
            toggleActionDeck();
            break;
          case 'o': // Cmd+Shift+O - Open Organizer
            e.preventDefault();
            setOrganizerOpen(true);
            break;
          case 'c': // Cmd+Shift+C - Open Calendar
            e.preventDefault();
            setCalendarOpen(true);
            break;
          case 'n': // Cmd+Shift+N - Toggle Notes
            e.preventDefault();
            setNotesOpen(prev => !prev);
            break;
          case 'v': // Cmd+Shift+V - Toggle Canvas
            e.preventDefault();
            setCanvasOpen(prev => !prev);
            break;
        }
      }

      // Escape closes topmost overlay
      if (e.key === 'Escape') {
        if (canvasOpen) {
          setCanvasOpen(false);
        } else if (organizerOpen) {
          setOrganizerOpen(false);
        } else if (calendarOpen) {
          setCalendarOpen(false);
        } else if (briiztormOpen) {
          setBriiztormOpen(false);
        } else if (actionDeckOpen) {
          closeActionDeck();
        } else if (notesOpen) {
          setNotesOpen(false);
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [organizerOpen, calendarOpen, briiztormOpen, actionDeckOpen, closeActionDeck, notesOpen, showSettings, canvasOpen, toggleActionDeck]);

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
      case 'actiondeck':
        return <ActionDeckColumn embedded onClose={closeActionDeck} onPopOut={popOutActionDeck} />;
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
  }, [closeActionDeck, popOutActionDeck]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="title-icon">●</span>
          <span className="title-text">briizOS</span>
        </div>
        <div id="controlBarBtn" onClick={() => setControlBarOpen(!controlBarOpen)}></div>

        <HeaderDateTimeWeather />

        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <span className="settings-icon">⚙</span>
          <span>Settings</span>
        </button>
      </header>

      {/* Control Bar with Toggles */}
      <div className={`controlBar${controlBarOpen ? '' : ' closed'}`} id="controlBar">
        <ControlBar
          isOpen={controlBarOpen}
          briiztormOpen={briiztormOpen}
          actionDeckOpen={actionDeckOpen}
          notesOpen={notesOpen}
          onToggleBriiztorm={() => setBriiztormOpen(!briiztormOpen)}
          onToggleActionDeck={toggleActionDeck}
          onOpenOrganizer={() => setOrganizerOpen(true)}
          onOpenCalendar={() => setCalendarOpen(true)}
          onToggleNotes={() => setNotesOpen(!notesOpen)}
        />
      </div>

      {/* Main Content */}
      <main className="app-main">
        <TileLayout
          layoutRow={getLayoutRow()}
          renderPanel={renderPanel}
          onColumnResize={updateColumnSizes}
          onStackResize={updateStackSizes}
          onMovePanel={movePanel}
        />
      </main>

      {/* Overlays */}
      <BriiztormOverlay
        isOpen={briiztormOpen}
        onClose={() => setBriiztormOpen(false)}
      />

      {actionDeckFloating && (
        <ActionDeckColumn
          floating
          onClose={closeActionDeck}
          onDock={dockActionDeck}
        />
      )}

      {/* Modals */}
      <OrganizerModal
        isOpen={organizerOpen}
        onClose={() => setOrganizerOpen(false)}
      />

      <CalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
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

      {/* Live Canvas */}
      <LiveCanvas
        isOpen={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        canvasData={canvasData}
        title={canvasTitle}
      />

      {/* Dashboard (replaces Settings Modal) */}
      <DashboardOverlay
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Login Overlay - Shows when not authenticated */}
      <LoginOverlay />
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
