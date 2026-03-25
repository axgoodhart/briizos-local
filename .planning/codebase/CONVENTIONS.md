# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**
- React components: `PascalCase.jsx` (e.g., `InteractionPanel.jsx`, `TasksPanel.jsx`)
- Hooks: `use{Feature}.js` (e.g., `useChat.js`, `useTasks.js`, `useLayout.js`)
- Utilities/services: `camelCase.js` (e.g., `logger.js`, `firestore.js`, `syncAdapters.js`)
- Contexts: `{Domain}Context.jsx` (e.g., `AuthContext.jsx`, `ChatSettingsContext.jsx`)
- Directories follow function: `components/`, `hooks/`, `lib/`, `context/`, `overlays/`

**Functions:**
- Exported functions: `camelCase` (e.g., `useTasks`, `getCurrentUid`, `subscribeTasks`)
- Event handlers (in components): `handle{Event}` (e.g., `handleAddTask`, `handleToggleTask`, `handleDeleteTask`)
- Helper functions (internal): `camelCase` (e.g., `resolveCategory`, `ensureAuth`)
- Validation/check functions: `is{Condition}` or `should{Action}` (e.g., `isAuthenticated`, `shouldAutoCreateFromLoginError`)

**Variables:**
- State variables: `camelCase` (e.g., `isLoading`, `messages`, `tasks`)
- Constants (file-level): `SCREAMING_SNAKE_CASE` (e.g., `AUTH_REQUEST_TIMEOUT_MS`, `SESSION_ID`, `LOG_BUFFER_MAX`)
- Storage keys: `kebab-case` (e.g., `briizos-selected-model`, `briizos-suggestions-enabled`)
- UI state: `camelCase` (e.g., `expandedTasks`, `openCards`, `isBreakingDown`)
- References (useRef): `camelCase + Ref` (e.g., `streamContentRef`, `threadIdRef`, `toolCallsRef`)

**Types/Objects:**
- Adapter objects (SyncContract §7): `{Domain}Adapter` (e.g., `taskAdapter`, `noteAdapter`, `organizerAdapter`)
- Enums: `PascalCase` (e.g., `SubagentStatus`, `CATEGORY_MAP`)
- Context objects: Described with `{Domain}Context` (e.g., `AuthContext`)

## Code Style

**Formatting:**
- No ESLint or Prettier configured in this codebase
- Manual style observed: 2-space indentation throughout
- Line length varies but typically under 100 characters
- Single quotes for strings (observed in React and Python)

**Linting:**
- No active linting configuration found
- Code follows loose ES6+ conventions
- Type hints present but not TypeScript

**Comments:**
- JSDoc/TSDoc used for public APIs (see `logger.js`, `firebase.js`, `syncAdapters.js`)
- Format: `/** Description */` for module-level, `/** @param {type} name - description */` for parameters
- Inline comments use `//` with rationale for non-obvious decisions
- Section markers: `// ── section name ────────────────────────` (seen in `logger.js`, `syncAdapters.js`)

Example from `logger.js`:
```javascript
/**
 * Register the Firestore write function. Called once from firestore.js
 * after Firebase is initialized. This avoids circular imports.
 */
export function registerFirestoreWriter(writerFn) {
  firestoreWriter = writerFn;
}
```

## Import Organization

**Order (as observed):**
1. React/framework imports
2. Third-party library imports
3. Relative imports from `lib/` (utilities, configuration)
4. Relative imports from `context/` (contexts)
5. Relative imports from `hooks/` (hooks)
6. Relative imports from `components/` (components)
7. CSS/style imports (last)

**Example from `InteractionPanel.jsx`:**
```javascript
import { useState, useEffect, useRef, useCallback, lazy, Suspense, memo, Component } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../hooks/useChat';
import { useChatSettings } from '../context/ChatSettingsContext';
import { useTools } from '../context/ToolContext';
import ConfirmationToast from './ConfirmationToast';
import { addSelectedFile, removeSelectedFile } from '../lib/firestore';
import log from '../lib/logger';
```

**Path Aliases:**
- None observed in this codebase
- Relative imports use `../` consistently

## Error Handling

**Patterns in React/JavaScript:**
- Try-catch in async functions with specific error logging (see `useTasks.js`, `useChat.js`)
- All errors logged via `log.error()` with structured context
- Errors include `error?.message` or full error object passed to logger
- Error recovery varies: some throw after logging, some silently continue

Example from `useTasks.js`:
```javascript
const addTask = useCallback(async (title, options = {}) => {
  try {
    const id = await addTaskFirestore(title, options);
    return id;
  } catch (error) {
    log.error('ui.error', 'Failed to add task', { error: error?.message });
    throw error;
  }
}, []);
```

**Patterns in Python (Gateway/Agent):**
- Context managers for lifecycle (see `app.py` lifespan handler)
- Logging via `logging` module with `logger.exception()` for error context
- `RuntimeError` raised with descriptive messages at service boundaries
- Silent catch for non-critical failures (e.g., channel service startup)

Example from `app.py`:
```python
try:
    get_app_config()
    logger.info("Configuration loaded successfully")
except Exception as e:
    error_msg = f"Failed to load configuration during gateway startup: {e}"
    logger.exception(error_msg)
    raise RuntimeError(error_msg) from e
```

**Two-Layer Approach (CLAUDE.md Rule 4):**
- Errors are logged at point of origin with event type and context
- When fixing, both immediate symptom AND underlying cause must be addressed
- Missing error boundaries or validation caught and added (not just symptom fix)

## Logging

**Framework:** Custom unified logger (`src/lib/logger.js`)

**Patterns:**
- All meaningful actions log via `log(type, message, data)` with structured event type
- Event types: `category.action` (e.g., `task.created`, `ui.modal.open`, `auth.login`, `sync.firestore.write`)
- Every Firestore operation logs with `log('sync.firestore', ...)` or similar category
- Every network request logs success/failure
- Every AI/agent interaction logs with `agent.*` or `tool.*` prefix

**Logging Mandatory For (from CLAUDE.md Rule 1):**
- UI interactions (button clicks, modal opens, state changes)
- Network requests (Firestore reads/writes, API calls)
- AI calls and tool execution
- Task automation steps
- Errors and exceptions
- Exceptions: Mouse movement, individual keystroke events

**Log Levels:**
- `log.info()` - Standard operations
- `log.warn()` - Recoverable issues, fallbacks taken
- `log.error()` - Failures that impact user
- `log.debug()` - Diagnostic info (not in production logs)

**Terminal + Firestore Dual Write:**
- `log()` writes to both terminal (IPC) and Firestore simultaneously
- Terminal writes immediate for developer feedback
- Firestore writes async via fire-and-forget queue for persistence
- IPC bridge ready detection with queue/flush pattern (see `logger.js` lines 61-81)

## Function Design

**Size:**
- Hooks typically 50-150 lines with internal state + effects + callbacks
- Component render functions typically 100-400 lines
- Utility functions typically 10-50 lines
- Event handlers typically 5-20 lines

**Parameters:**
- Options objects for optional parameters (e.g., `addTask(title, options = {})`)
- Configuration objects preferred over multiple parameters
- Callbacks accept (item, context) or event objects

**Return Values:**
- Hooks return object with state + setters + callbacks (e.g., `useTasks()` returns `{ tasks, isLoading, addTask, updateTask, ... }`)
- Async functions return result or throw (no error tuples)
- Queries return data or empty array (not null)

Example from `useChat.js`:
```javascript
export function useChat({ selectedModel } = {}) {
  // ... state setup ...
  return {
    messages,
    isLoading,
    tokenUsage,
    sendMessage,
    setModality,
    // ... more properties ...
  };
}
```

## Module Design

**Exports:**
- `lib/` modules export utility functions as named exports
- Hooks export as default AND named (e.g., `export { useChat }; export default useChat`)
- Adapters export as const objects (e.g., `export const taskAdapter = { normalizeOnRead, prepareForWrite }`)
- Contexts export Provider component AND useContext hook

**Barrel Files:**
- `src/context/index.js` aggregates context exports
- `src/components/overlays/index.js` aggregates overlay exports
- Minimal re-exporting, used mainly for major modules

Example from `context/index.js`:
```javascript
export { AuthProvider, useAuth } from './AuthContext';
export { OrganizerProvider } from './OrganizerContext';
```

**Circular Import Prevention:**
- Late registration pattern used: `registerFirestoreWriter()` (see `logger.js` lines 92-94)
- Avoids Firebase initialization → logger → Firebase circular dependency
- Service boundaries separated to prevent cross-imports

## SyncContract Compliance

**Adapter Pattern (§7):**
- All synced data (tasks, organizer, events, notes) routed through adapters
- Adapters located at `src/lib/syncAdapters.js` (four adapters: taskAdapter, organizerAdapter, calendarAdapter, noteAdapter)
- Read: `normalizeOnRead(id, data)` maps legacy aliases to canonical fields
- Write: `prepareForWrite(doc, isNew)` validates required fields, enforces string ID, attaches timestamps

**Required Fields on All Synced Documents (§3):**
- Every write includes: `id` (string), `type`, `createdAt`, `updatedAt` (server timestamp)
- `createdAt` set once on new docs, never mutated
- `updatedAt` refreshed on every write

**Naming Normalization:**
- Writers MUST emit canonical keys only (no legacy aliases)
- Readers map aliases on read (e.g., `title || data.text || data.name`)
- Adapters strip legacy keys before write: `delete doc.text; delete doc.name`

## State Management

**React Hooks Pattern:**
- Local component state via `useState` for UI state
- Firestore subscriptions via `useEffect` + `onSnapshot` for data state
- Context API for global state (auth, settings, organizer)
- Custom hooks (`useTasks`, `useChat`) encapsulate complex state logic

**Firestore Subscription Pattern (from `firestore.js`):**
```javascript
useEffect(() => {
  const uid = getCurrentUid();
  if (!uid) {
    setIsLoading(false);
    return;
  }

  const unsubscribe = subscribeTasks((firestoreTasks) => {
    setTasks(firestoreTasks);
    setIsLoading(false);
  });

  return () => unsubscribe();
}, []);
```

**Reference Preservation:**
- Frequently-updated values stored in `useRef` to avoid effect re-runs
- Example: `appContextRef`, `toolCallsRef`, `threadIdRef` in `useChat.js`
- Pattern: State var + ref, with effect to sync ref from state

---

*Convention analysis: 2026-03-25*
