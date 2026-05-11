# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Electron desktop app with React frontend, Firestore sync layer, and remote Python orchestrator (LangGraph-based agent system)

**Key Characteristics:**
- Hybrid local-remote architecture: UI state lives in React, data syncs with Firestore, agent orchestration runs in Python backend
- SyncContract-driven data normalization: adapters standardize reads/writes for tasks, organizer, calendar, notes across Local and Web repos
- Real-time event streaming from orchestrator: SQLite event log polled every 2s and streamed to unified logger
- Three layers of data: UI/React state, Firestore canonical storage, IPC bridge to Electron main process
- Tool execution framework with confirmation UI, filesystem access, and agent-driven automation

## Layers

**UI Layer (React Components):**
- Purpose: Visual interface, state management, user interaction
- Location: `src/components/`, `src/hooks/`
- Contains: Overlay modals (organizer, calendar, notes), panels (sources, tasks, interaction), layout engine, control bar
- Depends on: Context providers (Auth, Layout, Tool, Chat), logger, Firestore
- Used by: Electron renderer process

**Context Providers (State Management):**
- Purpose: Global state across components (auth, layout, tools, organizer, chat settings)
- Location: `src/context/`
- Contains: `AuthContext.jsx`, `ToolContext.jsx`, `OrganizerContext.jsx`, `ChatSettingsContext.jsx`
- Depends on: Firebase auth, Firestore, logger
- Used by: All components via React Context API

**Data Persistence Layer (Firestore):**
- Purpose: Canonical data store for synced entities; normalization layer; SyncContract enforcement
- Location: `src/lib/firestore.js`, `src/lib/syncAdapters.js`
- Contains: Collection references, read/write operations, adapters for tasks/organizer/calendar/notes
- Depends on: Firebase SDK, logger
- Used by: Context providers, custom hooks, agent workers

**Logging & Observability:**
- Purpose: Unified logging to terminal (IPC) and Firestore; real-time visibility into UI, sync, agent actions
- Location: `src/lib/logger.js`
- Contains: Session ID tracking, category resolution, IPC bridge queue, Firestore log writer, structured logging
- Depends on: Firestore, electron preload bridge
- Used by: All layers (UI, persistence, hooks)

**Tool Execution Framework:**
- Purpose: Route tool calls from agent/UI, manage confirmations, execute read-only/write tools
- Location: `src/lib/tools.js`, `src/context/ToolContext.jsx`
- Contains: Tool registry, handler implementations (filesystem, note/task/calendar CRUD), permissions
- Depends on: Firestore, logger, layout hook
- Used by: Agent workers, interactive prompts

**Layout Engine:**
- Purpose: Manage resizable panel grid, drag-drop reordering, persistence
- Location: `src/lib/layoutUtils.js`, `src/hooks/useLayout.js`, `src/components/layout/`
- Contains: Layout utilities (migrate formats, flatten/simplify, drop zone detection), TileLayout component
- Depends on: Firestore (v2 layout persistence), logger
- Used by: App.jsx for rendering columns/stacks/panels

**Agent Integration:**
- Purpose: Connect to remote Python orchestrator, manage worker pool, handle job lifecycle
- Location: `src/hooks/useAgentWorkers.js`, `src/hooks/useOrchestratorEvents.js`, `src/lib/agentJobsFirestore.js`
- Contains: Worker startup/shutdown, tool result dispatch, SQLite event polling, job state management
- Depends on: Firestore, logger, IPC (window.api)
- Used by: App.jsx, chat system

**Electron Bridge (IPC):**
- Purpose: Communication between renderer and main process
- Location: `electron/preload.js`, `electron/main.js`, `src/lib/logger.js` (IPC bridge)
- Contains: Log routing, weather API calls, orchestrator event stream, file system access, permissions checks
- Depends on: Node.js runtime, Electron APIs
- Used by: Renderer process via window.api

## Data Flow

**User Creates Task:**

1. User fills task form in InteractionPanel → TasksPanel.jsx
2. Form submission triggers `addTask(title, ...)` from `src/lib/firestore.js`
3. Task doc created in `users/{uid}/tasks/{id}` with SyncContract schema (taskAdapter applied)
4. Firestore listener on tasks collection fires → OrganizerContext updates React state
5. UI re-renders, task visible in panel
6. Log event created via logger to Firestore and terminal

**Agent Executes Tool (e.g., createTask):**

1. Orchestrator (Python) calls `agentCreateTask` tool with params
2. IPC invokes `window.api.toolExecute(toolName, params)`
3. Renderer posts to ToolContext.executeTool() → routes to handler in `src/lib/tools.js`
4. Handler calls `addTask()` → Firestore write
5. Firestore listener fires → React state update → UI refresh
6. Handler returns result to orchestrator via IPC
7. Agent worker logs result via `useAgentWorkers` callback → logger

**Sync Between Local and Web:**

1. Local writes task doc with `updatedAt: serverTimestamp()`, enforced by taskAdapter
2. Firestore triggers write to canonical path `users/{uid}/tasks/{id}`
3. Web app realtime listener on same path fires → Web app reads normalized doc (deserializes via web taskAdapter)
4. Conflict resolution: Last writer wins by `updatedAt` server timestamp
5. Note UI state exception: `ui.local.xywh` and `ui.web.xywh` are independent merge domains, each client updates only its own branch

**Real-time Orchestrator Events:**

1. Orchestrator job starts → Python writes to SQLite event log
2. Preload bridge listens to SSE stream → detects `job_planned` event
3. `useOrchestratorEvents` starts polling orchestrator events every 2s
4. Events fetched from SQLite (step.progress, worker.heartbeat, tool_call, etc.)
5. Events routed through unified logger → Firestore write + terminal output
6. UI LogOverlay reads Firestore logs in real-time → displays agent progress

**State Management:**

- React component state: transient UI state (overlays, input fields, selections)
- Context state: global (auth user, current layout, pending tool confirmations)
- Firestore state: canonical (tasks, notes, organizer, calendar, layout config, logs)
- IPC/electron state: none persisted (temporary IPC queue for logs)

## Key Abstractions

**SyncAdapter Pattern:**
- Purpose: Normalize legacy aliases to canonical schema on read; validate and attach metadata on write
- Examples: `taskAdapter`, `organizerAdapter`, `calendarAdapter`, `noteAdapter` in `src/lib/syncAdapters.js`
- Pattern: Each adapter has `normalizeOnRead(id, data)` → canonical shape; `prepareForWrite(doc, isNew)` → validates, stamps `updatedAt`, ensures string `id`
- Constraint: Adapters enforce SyncContract §7 requirements; any schema change must update both Local and Web adapters

**Tool Handler Registry:**
- Purpose: Dispatch tool calls from agent or UI with consistent interface
- Examples: `src/lib/tools.js` defines handlers for `getScheduleSummary`, `searchNotes`, `addTask`, `agentReadFile`, etc.
- Pattern: Each tool is `{ requiresConfirmation: bool, description, parameters, handler(params, context, layoutHook) }`
- Constraint: Agent-triggered tools bypass confirmation; user-triggered tools may require it based on terminal permission mode

**ToolContext Confirmation Queue:**
- Purpose: Hold user-confirmation requests for destructive tools, allow parameter editing
- Pattern: `setPendingConfirmation({ toolName, params })` → UI shows toast/modal → user accepts/rejects → resolver fired
- Constraint: Only one confirmation pending at a time

**Layout Migration (v1 → v2):**
- Purpose: Support legacy flat panel arrays while storing new column-based format
- Pattern: `migrateFlatToColumns(panels)` transforms flat array to `{ version: 2, columns: [ { stacks: [ { panels } ] } ] }`
- Constraint: Layout persisted to Firestore at `users/{uid}/desktopSettings/layout`

**Logger Event Categories:**
- Purpose: Route events by category (task, note, calendar, agent, ui, sync, system) for filtering/visibility
- Pattern: Category derived from event type prefix (e.g., "task.created" → category "task")
- Constraint: All meaningful actions must log; exceptions: mouse movement, individual keystrokes

## Entry Points

**Electron Main Process:**
- Location: `electron/main.js`
- Triggers: App launch
- Responsibilities: Window creation, IPC listener setup, preload bridge injection, weather API bridging, orchestrator event streaming

**React App Render:**
- Location: `src/main.jsx` → `src/App.jsx` → `AppContent()`
- Triggers: After Electron window ready
- Responsibilities: Provider wrapping (Auth, Organizer, ChatSettings, Tool), context initialization, keyboard shortcuts, overlay state

**Authentication Flow:**
- Location: `src/context/AuthContext.jsx`, `src/components/LoginOverlay.jsx`
- Triggers: App startup (onAuthStateChanged listener)
- Responsibilities: Email/password sign-in/create, Firestore log writer initialization, auth timeout handling

**Layout Initialization:**
- Location: `src/hooks/useLayout.js`
- Triggers: AppContent mount
- Responsibilities: Load layout from Firestore, migrate v1→v2 if needed, provide layout operations (add/remove/resize panels)

**Agent Worker Pool:**
- Location: `src/hooks/useAgentWorkers.js`
- Triggers: AppContent mount (if authenticated)
- Responsibilities: Start N autonomous workers, listen for job results, dispatch tool calls to executeTool, write results back to chat

**Orchestrator Event Streaming:**
- Location: `src/hooks/useOrchestratorEvents.js`
- Triggers: useOrchestratorEvents mount
- Responsibilities: Listen to SSE stream for job_planned events, start polling SQLite, route events to logger

## Error Handling

**Strategy:** Two-layer approach per CLAUDE.md:
1. **Immediate fix:** Symptom + cause (direct code fix)
2. **Structural fix:** Code hygiene (validation, error boundaries, logging)

**Patterns:**

- **Auth timeout:** `withAuthTimeout(authPromise, label)` wraps Firebase calls with 20s timeout → rejects → caught in LoginOverlay → displays user message
- **Firestore write validation:** Adapters call `requireFields(doc, fields, adapterName)` → throws → caught by logger → logged as sync error + displayed in log overlay
- **Tool confirmation race:** `pendingConfirmation` state protects against simultaneous requests; resolver cleared after use
- **Layout load failure:** Fallback to DEFAULT_LAYOUT_V2 if Firestore read fails → logged → UI still functional
- **Agent tool execution:** Try/catch in worker callback → logs error → writes error message to chat → continues polling remaining jobs
- **IPC bridge queue:** `ipcQueue` persists logs until preload bridge ready → `flushIPC()` on demand

## Cross-Cutting Concerns

**Logging:** Every action (UI interaction, Firestore write, agent step, tool result, error) flows through `src/lib/logger.js` → unified terminal + Firestore visibility

**Validation:**
- Firestore: SyncContract adapters validate required fields before write
- Tools: Each handler validates params (typeof checks, required fields)
- UI: Form components validate inputs before submission

**Authentication:**
- AuthProvider listens to onAuthStateChanged → updates React context
- Firestore operations check `getCurrentUid()` → throw if not authenticated
- IPC commands checked for `window.api` availability

**Permissions:**
- Terminal commands filtered by mode (ask-always, ask-destructive, no-asking) in ToolContext
- Filesystem tools check `isDestructiveCommand()` before executing
- Tool confirmation UI prevents accidental dangerous operations

**Real-time Sync:**
- All collection listeners in Firestore (`onSnapshot` for tasks, notes, organizer, events, layout)
- Local React state driven by Firestore listener callbacks
- Conflict resolution: `updatedAt` server timestamp + last-writer-wins (exception: note UI state per-client)

---

*Architecture analysis: 2026-03-25*
