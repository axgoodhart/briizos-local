# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```
briizOS.Local/
├── src/                              # React application source
│   ├── main.jsx                      # Entry point: React root mount
│   ├── App.jsx                       # Root component: Providers, overlays, layout
│   ├── index.css                     # Global styles
│   ├── components/                   # React components
│   │   ├── App.css                   # Main layout styles
│   │   ├── ConfirmationToast.jsx     # Tool confirmation UI
│   │   ├── FileTree.jsx              # File browser component
│   │   ├── InteractionPanel.jsx      # Chat/interaction input panel
│   │   ├── LoginOverlay.jsx          # Authentication UI
│   │   ├── ModelPicker.jsx           # Model selection dropdown
│   │   ├── PhantomSection.jsx        # 3D background visualization
│   │   ├── SettingsModal.jsx         # (Deprecated, replaced by DashboardOverlay)
│   │   ├── SourcesPanel.jsx          # Sources/documents input panel
│   │   ├── TasksPanel.jsx            # Task list and management
│   │   ├── layout/                   # Layout engine components
│   │   │   ├── Panel.jsx             # Resizable panel wrapper
│   │   │   ├── TileLayout.jsx        # Grid layout with drag-drop
│   │   │   ├── layout.css            # Layout styles
│   │   │   └── index.js              # Barrel export
│   │   ├── controlbar/               # Top control bar components
│   │   │   ├── ControlBar.jsx        # Toggle buttons for overlays
│   │   │   ├── ControlBar.css        # Controlbar styles
│   │   │   └── index.js              # Barrel export
│   │   ├── notes/                    # Notes widget (draggable notes)
│   │   │   ├── NotesWidget.jsx       # Notes container and drag/drop
│   │   │   ├── NotesWidget.css       # Notes styling
│   │   │   └── index.js              # Barrel export
│   │   └── overlays/                 # Modal/overlay components
│   │       ├── ActionDeckColumn.jsx  # Async jobs/action queue UI
│   │       ├── BriiztormOverlay.jsx  # Chat AI interface overlay
│   │       ├── CalendarModal.jsx     # Calendar/events overlay
│   │       ├── DashboardOverlay.jsx  # Settings dashboard (settings, config, theme)
│   │       ├── LiveCanvas.jsx        # HTML/CSS/JS live editor overlay
│   │       ├── LogOverlay.jsx        # Unified log viewer overlay
│   │       ├── OrganizerModal.jsx    # Organizer/projects overlay
│   │       ├── [Component].css       # Per-component styles (shadow DOM pattern)
│   │       └── index.js              # Barrel export (imports all overlays)
│   ├── context/                      # React Context providers
│   │   ├── AuthContext.jsx           # Auth state (user, loading, error)
│   │   ├── ChatSettingsContext.jsx   # Chat model/settings
│   │   ├── OrganizerContext.jsx      # Organizer items state (deprecated—replaced by Firestore listener)
│   │   ├── ToolContext.jsx           # Tool execution, confirmation queue
│   │   └── index.js                  # Barrel export
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAppContext.js          # Access app global state
│   │   ├── useAgentWorkers.js        # Start autonomous workers, handle results
│   │   ├── useChat.js                # Chat message operations
│   │   ├── useLayout.js              # Layout CRUD, persistence
│   │   ├── useModelSelection.js      # Model selection state
│   │   ├── useOrchestratorEvents.js  # Poll orchestrator, stream events to logger
│   │   ├── useRecorder.js            # Voice recording (unused?)
│   │   ├── useTaskAutomation.js      # Task automation state (unused?)
│   │   ├── useToolBridge.js          # Bridge between tool registry and context
│   │   ├── useTasks.js               # Task list operations
│   │   ├── useDraggable.js           # Draggable element utilities
│   │   ├── useLangGraphStatus.js     # Job status polling (unused?)
│   │   └── useTaskAutomation.js      # (Duplicate filename — check lib/taskAutomation.js)
│   ├── lib/                          # Shared utility modules
│   │   ├── firebase.js               # Firebase SDK init, auth helpers
│   │   ├── firestore.js              # Firestore CRUD operations, listeners
│   │   ├── logger.js                 # Unified logging (terminal + Firestore)
│   │   ├── syncAdapters.js           # SyncContract adapters for 4 buckets
│   │   ├── tools.js                  # Tool handler registry and implementations
│   │   ├── permissions.js            # Terminal permission checks
│   │   ├── layoutUtils.js            # Panel grid utilities
│   │   ├── themeEngine.js            # Theme system (mint-icecube, default)
│   │   ├── taskAutomation.js         # Task automation logic
│   │   ├── agentJobsFirestore.js     # Agent worker pool (Firestore-backed)
│   │   ├── memory.js                 # Memory/context management (unused?)
│   │   ├── recurrence.js             # Task recurrence logic
│   │   └── useTaskAutomation.js      # (Hook version of taskAutomation.js)
│   ├── styles/                       # Stylesheet organization
│   │   ├── original-component-css/   # Legacy component styles (superseded by inline)
│   │   │   ├── overlays/
│   │   │   ├── layout/
│   │   │   ├── notes/
│   │   │   └── controlbar/
│   │   └── theme/                    # Theme CSS files
│   └── _archive/                     # Old/deprecated code
│       └── task-automation/          # Legacy task automation hooks
├── electron/                         # Electron main + preload scripts
│   ├── main.js                       # Electron main process
│   ├── preload.js                    # IPC bridge (window.api)
│   ├── index.html                    # HTML template
│   └── langgraph-process.js          # (Legacy orchestrator launch—superseded)
├── agent/                            # Python orchestrator (LangGraph-based)
│   ├── src/
│   │   ├── gateway/                  # FastAPI gateway for IPC bridge
│   │   │   ├── app.py
│   │   │   ├── routers/
│   │   │   │   └── orchestrator.py   # Orchestrator routes
│   │   │   └── ...
│   │   ├── orchestrator/             # Orchestrator (job planning, worker dispatch)
│   │   ├── agents/                   # Subagent implementations
│   │   ├── subagents/                # Executor subagent (tool runner)
│   │   ├── tools/                    # Tool definitions
│   │   └── ...
│   ├── uv.lock                       # Python lockfile
│   └── ...
├── package.json                      # Node dependencies (React, Electron, Vite)
├── vite.config.js                    # Vite build config
├── .gitignore                        # Git ignore patterns
└── CLAUDE.md                         # Project rules (must acknowledge each session)
```

## Directory Purposes

**src/components/ — React Components**
- Purpose: All visual UI elements, organized by feature area
- Naming: `ComponentName.jsx` for component, `ComponentName.css` for styles
- Key files: `App.jsx` (root), `InteractionPanel.jsx` (chat), `TasksPanel.jsx` (tasks), `LoginOverlay.jsx` (auth)

**src/context/ — Global State Providers**
- Purpose: React Context API providers for global state
- Contains: Auth, tool execution, chat settings, organizer state
- Key file: `ToolContext.jsx` handles tool execution and confirmation queue
- Export pattern: Use barrel export in `index.js`

**src/hooks/ — Custom React Hooks**
- Purpose: Encapsulate stateful logic and side effects
- Agent-specific: `useAgentWorkers.js`, `useOrchestratorEvents.js` handle async job polling
- Layout-specific: `useLayout.js` manages panel grid persistence
- Tool-specific: `useToolBridge.js` connects tool registry to context

**src/lib/ — Shared Utilities**
- Purpose: Business logic, data adapters, APIs, permissions
- Firestore layer: `firestore.js`, `syncAdapters.js` implement SyncContract
- Tool registry: `tools.js` defines all tool handlers
- Logging: `logger.js` routes to terminal and Firestore
- Permissions: `permissions.js` checks destructive command filters
- No React hooks in lib/ (reserved for hooks/)

**src/styles/ — Global & Theme Styles**
- Purpose: Original/legacy component styles and theme definitions
- `original-component-css/` — Pre-CSS-in-JS styles (superseded by inline)
- `theme/` — Theme system files (mint-icecube, default)
- **Note:** Most styling now in component .css files; this dir kept for reference

**electron/ — Electron Runtime**
- `main.js` — Main process: window creation, IPC listeners, bridging to Python gateway
- `preload.js` — Preload script injected into renderer: defines `window.api` object
- `index.html` — HTML shell (minimal)
- `langgraph-process.js` — Legacy orchestrator launch (check if still used)

**agent/ — Python Backend (LangGraph)**
- Purpose: Remote orchestrator, subagent execution, tool definitions
- `gateway/` — FastAPI server handling IPC from renderer
- `orchestrator/` — Job planning, worker dispatch, SQLite event log
- `subagents/executor.py` — Executes tools, returns results
- `tools/tools.py` — Tool definitions mirrored from `src/lib/tools.js`

## Key File Locations

**Entry Points:**
- `src/main.jsx`: React root mount to DOM
- `src/App.jsx`: Root component tree (providers, overlays, keyboard shortcuts)
- `electron/main.js`: Electron main process (window, IPC setup)
- `agent/src/gateway/app.py`: Python FastAPI gateway (IPC routes)

**Configuration:**
- `package.json`: Node dependencies (React, Electron, Firebase, Vite)
- `vite.config.js`: Frontend build config
- `electron/index.html`: HTML template
- `CLAUDE.md` (parent briizOS/): Project rules (SyncContract, logging, two-layer resolution)

**Core Logic:**
- `src/lib/firestore.js`: Firestore read/write operations, collection listeners
- `src/lib/syncAdapters.js`: SyncContract adapters (task, organizer, calendar, note)
- `src/lib/tools.js`: Tool handler registry (read-only, CRUD, agent filesystem tools)
- `src/lib/logger.js`: Unified logging (IPC + Firestore)
- `src/lib/layoutUtils.js`: Panel grid operations (flatten, migrate, drop zone detection)

**Testing:**
- No test files found in src/ — testing framework not yet configured
- Agent has pytest capabilities (Python backend) — test directory likely in `agent/`

**Overlays & Modals:**
- `src/components/overlays/`: All modal/overlay components
  - `BriiztormOverlay.jsx` — Chat interface
  - `CalendarModal.jsx` — Calendar/events
  - `OrganizerModal.jsx` — Organizer/projects
  - `DashboardOverlay.jsx` — Settings/theme/config
  - `LogOverlay.jsx` — Unified log viewer
  - `ActionDeckColumn.jsx` — Async jobs queue
  - `LiveCanvas.jsx` — HTML/CSS/JS live editor

**Panels:**
- `src/components/InteractionPanel.jsx` — Chat/interaction input
- `src/components/TasksPanel.jsx` — Task list and CRUD
- `src/components/SourcesPanel.jsx` — Document/source inputs
- `src/components/layout/TileLayout.jsx` — Resizable grid engine

**Utilities & Systems:**
- `src/hooks/useAgentWorkers.js` — Worker pool initialization and job handling
- `src/hooks/useOrchestratorEvents.js` — Event polling and logger integration
- `src/hooks/useLayout.js` — Layout persistence and operations
- `src/context/ToolContext.jsx` — Tool execution and confirmation
- `src/context/AuthContext.jsx` — Authentication state

## Naming Conventions

**Files:**
- React components: `PascalCase.jsx` (e.g., `InteractionPanel.jsx`, `TileLayout.jsx`)
- Styles: `ComponentName.css` co-located with component
- Utilities: `camelCase.js` (e.g., `firestore.js`, `syncAdapters.js`)
- Hooks: `useFeatureName.js` (e.g., `useLayout.js`, `useAgentWorkers.js`)

**Directories:**
- Feature-based: `/components/layout/`, `/components/overlays/`, `/components/notes/`
- By layer: `/context/`, `/hooks/`, `/lib/`
- Lowercase, plural when multi-item: `components/`, `overlays/`, `hooks/`

**Exports & Barrel Files:**
- Barrel exports in `index.js`: `export { AuthProvider, useAuth } from './AuthContext';`
- Use for: Context providers, component groups (overlays, controlbar, notes)
- Simplifies imports: `import { useAuth } from './context'` vs `import { useAuth } from './context/AuthContext'`

**Variables & Functions:**
- camelCase for variables/functions: `const layoutRow`, `function getLayout()`
- PascalCase for React components and classes: `function MyComponent() {}`
- UPPER_CASE for constants: `const DEFAULT_LAYOUT_V2 = ...`, `const PANEL_TYPE = 'PANEL'`

**Types & Interfaces:**
- No TypeScript in use; JSDoc comments for type hints where needed
- Example: `/** @param {string} id */`

## Where to Add New Code

**New Feature (e.g., "Add notes recurrence"):**
- Primary code: `src/lib/recurrence.js` (existing utility file for recurrence logic)
- Hook: `src/hooks/useRecurrence.js` (if state needed)
- Component: `src/components/notes/RecurrenceWidget.jsx` (UI for recurrence control)
- Firestore integration: `src/lib/firestore.js` (add recurrence field to note schema)
- Tests: Create `src/lib/recurrence.test.js` (testing framework TBD)

**New Overlay/Modal:**
- Component file: `src/components/overlays/MyNewOverlay.jsx`
- Styles: `src/components/overlays/MyNewOverlay.css`
- Register: Add to barrel export in `src/components/overlays/index.js`
- Integration: Import and render in `src/App.jsx` with state management

**New Panel Type:**
- Component file: `src/components/MyPanelName.jsx`
- Register in `renderPanel()` switch statement in `src/App.jsx`
- Integrate with layout system via `useLayout.js` panel operations
- Add to DEFAULT_LAYOUT_V1 or DEFAULT_LAYOUT_V2 if default visible

**New Tool:**
- Handler: Add entry to `tools` object in `src/lib/tools.js`
- Structure: `{ requiresConfirmation: bool, description, parameters, handler(...) }`
- Mirror in Python: Add corresponding tool in `agent/src/tools/tools.py`
- Test: Call `window.api.toolExecute(toolName, params)` from DevTools

**New Agent Subagent:**
- Python file: `agent/src/agents/my_agent.py` (or existing subagent directory)
- Integration: Register in orchestrator routing
- IPC gateway: Add route in `agent/src/gateway/routers/orchestrator.py` if needed
- Firestore: Log results via `addChatMessage()` or `addRemoteChatMessage()`

**Utilities & Helpers:**
- Shared logic: `src/lib/newUtility.js`
- Hook logic: `src/hooks/useNewFeature.js`
- Layout utilities: Extend `src/lib/layoutUtils.js`
- Permission checks: Add to `src/lib/permissions.js`

**Styles:**
- Component-scoped: `src/components/ComponentName.css` (preferred)
- Theme overrides: `src/styles/theme/theme-name.css`
- Legacy patterns: `src/styles/original-component-css/` (for reference only)

## Special Directories

**src/_archive/ — Deprecated Code**
- Purpose: Old/unused implementations kept for reference
- Generated: No (checked into git)
- Committed: Yes
- Example: `task-automation/` directory with legacy hooks
- **Action:** Review before re-implementing; consider removing if no references remain

**agent/ — Python Backend**
- Purpose: LangGraph orchestrator (separate from React app)
- Generated: Partially (SQLite DB, logs)
- Committed: Source code yes; runtime artifacts no (.venv/, SQLite)
- Note: Requires Python 3.12+, runs in separate process, communicates via IPC gateway

**.planning/codebase/ — GSD Documents**
- Purpose: Generated by `/gsd:map-codebase` for future Claude instances
- Generated: Yes (created by GSD agent)
- Committed: Yes (should be checked in)
- Files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

---

*Structure analysis: 2026-03-25*
