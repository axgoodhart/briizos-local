import { useState, useCallback, useEffect } from 'react';
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

// New overlay imports
import { ControlBar } from './components/controlbar';
import { BriiztormOverlay, ActionDeckColumn, OrganizerModal, CalendarModal, LiveCanvas, DashboardOverlay } from './components/overlays';
import { NotesWidget } from './components/notes';
import logger from './lib/logger';

// Debug counter to track renders
let appRenderCount = 0;

// Inner app component that uses auth context
function AppContent({ layout }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { executeTool } = useTools();
  const appContext = useAppContext();
  useAgentWorkers(executeTool, appContext);
  appRenderCount++;
  logger.debug('ui', `App render #${appRenderCount}`);

  // Existing state
  const [showSettings, setShowSettings] = useState(false);
  const [controlBarOpen, setControlBarOpen] = useState(false);
  const {
    getVisiblePanels,
    getPanelByType,
    addPanel,
    togglePanelVisibility,
    updateColumnSizes,
    updateStackSizes,
    movePanel,
    getLayoutRow
  } = layout;

  // New overlay states
  const [briiztormOpen, setBriiztormOpen] = useState(false);
  const [actionDeckFloating, setActionDeckFloating] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [canvasTitle, setCanvasTitle] = useState('Canvas');

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
