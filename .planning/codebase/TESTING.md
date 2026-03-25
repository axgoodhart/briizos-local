# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework Status

**Current State:** No test framework configured or in use

**Runner:**
- Not present
- No Jest, Vitest, Mocha, or other test runner configured
- No test files in `src/` directory (only in `node_modules/` from dependencies)

**Assertion Library:**
- Not present
- No expect(), assert(), or chai configuration

**Run Commands:**
- No test scripts in `package.json` (scripts: `dev`, `build`, `preview`, `electron`, `tools:catalog`)
- No test-related npm scripts configured

## Testing Gaps

**Code Coverage:**
- Zero coverage — no tests written
- No coverage requirements enforced

**Untested Areas (High Priority):**

1. **Firestore Sync Layer** (`src/lib/firestore.js`, `src/lib/syncAdapters.js`)
   - CRITICAL: SyncContract compliance gates (§10) must be tested
   - Adapter read/write transformations not tested
   - Circular imports via late registration not validated
   - Multi-collection subscription logic untested
   - Data normalization (legacy alias mapping) untested

2. **Authentication Flow** (`src/context/AuthContext.jsx`, `src/lib/firebase.js`)
   - Login/signup flows not tested
   - Error message mapping untested
   - Auth timeout handling not validated
   - Persistence setup (browserLocalPersistence fallback) untested

3. **Chat/Agent Integration** (`src/hooks/useChat.js`)
   - Streaming message handling untested
   - Tool confirmation logic not tested
   - Remote vs. local response routing untested
   - IPC message bridge untested

4. **Logging System** (`src/lib/logger.js`)
   - Log buffer subscription untested
   - IPC queue flushing not validated
   - Firestore log writes not tested
   - Terminal message formatting untested

5. **Task Automation** (`src/hooks/useTaskAutomation.js`)
   - Currently stubbed (FUTURE work)
   - Breakdown/resume/verify logic will need tests when implemented
   - Stream event handling will need tests

6. **Layout/DnD** (`src/components/layout/TileLayout.jsx`)
   - Panel drag-and-drop not tested
   - Drop zone detection untested
   - Zone-based repositioning untested

7. **State Management Hooks** (`src/hooks/*.js`)
   - `useTasks`, `useLayout`, `useRecorder`, etc. have no tests
   - Mock data subscriptions not possible without test framework
   - Callback chains untested

## Recommended Testing Strategy

**Phase 1: Foundation (Before Phase 2 changes)**
- Set up test runner (Jest or Vitest recommended for React+Vite)
- Set up Firestore emulator for integration tests
- Create snapshot tests for adapters (validate SyncContract compliance)

**Phase 2: Critical Path**
1. **SyncContract Compliance Suite** (highest priority)
   - Verify adapters handle all 4 buckets (tasks, organizer, events, notes)
   - Test legacy alias normalization
   - Test required field validation
   - Test conflict resolution (lastWriterWins via updatedAt)
   - Test UI branch isolation for note positions

2. **Auth Integration Tests**
   - Sign up, login, logout flows
   - Error message mapping
   - Timeout behavior
   - Multiple tab sync

3. **Firestore Real-time** (with emulator)
   - Create → Read → Update → Delete
   - Multi-client conflict resolution
   - Subscription lifecycle

4. **Logging System Unit Tests**
   - Buffer management
   - IPC message queue
   - Firestore write queue
   - Log level filtering

**Phase 3: Feature Coverage**
- Chat streaming tests
- Task mutation tests (add, update, delete)
- Layout persistence tests

## Test File Organization

**Current Structure (None - to be established):**
- Recommended: Co-located tests with `__tests__/` subdirectories
- Alternative: `tests/` directory parallel to `src/`

**Suggested Layout:**
```
src/
├── lib/
│   ├── firestore.js
│   ├── firestore.test.js        # SyncContract compliance
│   ├── syncAdapters.js
│   ├── syncAdapters.test.js     # Adapter transformation tests
│   ├── logger.js
│   └── logger.test.js           # Buffer, IPC, Firestore write queue
├── hooks/
│   ├── useChat.js
│   ├── useChat.test.js          # Streaming, tool confirmation
│   ├── useTasks.js
│   └── useTasks.test.js
├── context/
│   ├── AuthContext.jsx
│   └── AuthContext.test.jsx     # Auth flows, error handling
└── components/
    ├── layout/
    │   ├── TileLayout.jsx
    │   └── TileLayout.test.jsx   # DnD, drop zones
```

## Mock Strategy

**Firebase Mocks (Required):**
- Use Firebase Emulator Suite for integration tests
- Mock `firebase/firestore` functions: `collection`, `doc`, `onSnapshot`, `setDoc`, `deleteDoc`
- Mock `firebase/auth` for auth flow tests

**Firestore Emulator Setup (Example):**
```bash
# Install emulator
npm install -D firebase-tools

# Start emulator
firebase emulators:start --only firestore
```

**Mock Example Pattern:**
```javascript
// jest.setup.js or test file preamble
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    // Simulate immediate snapshot
    callback({ docs: [], empty: true });
    return jest.fn(); // unsubscribe
  }),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));
```

**What to Mock:**
- Firebase SDK functions (getDoc, setDoc, onSnapshot, etc.)
- IPC bridge (`window.api.logToTerminal`)
- Firestore operations in isolation tests

**What NOT to Mock:**
- Logger module (test real logging behavior)
- Adapter transformations (test actual data flow)
- Sync compliance logic (must test real validation)
- React component render logic (except external dependencies)

## Test Structure (When Implemented)

**Suite Organization (Pattern to follow):**
```javascript
describe('taskAdapter', () => {
  describe('normalizeOnRead', () => {
    it('maps legacy text field to title', () => {
      // Setup
      const rawDoc = { id: 'task_1', text: 'Old title', type: 'task' };

      // Execute
      const normalized = taskAdapter.normalizeOnRead('task_1', rawDoc);

      // Assert
      expect(normalized.title).toBe('Old title');
      expect(normalized.id).toBe('task_1');
      expect(normalized.type).toBe('task');
    });

    it('enforces string ID conversion', () => {
      const rawDoc = { id: 123, title: 'Task' };
      const normalized = taskAdapter.normalizeOnRead(123, rawDoc);
      expect(typeof normalized.id).toBe('string');
      expect(normalized.id).toBe('123');
    });
  });

  describe('prepareForWrite', () => {
    it('requires title, status, type, createdAt, id', () => {
      const doc = { id: 'task_1', title: 'Task' };

      expect(() => taskAdapter.prepareForWrite(doc, true)).toThrow(
        /missing required fields/
      );
    });

    it('strips legacy alias keys before write', () => {
      const doc = {
        id: 'task_1',
        type: 'task',
        title: 'New Title',
        status: 'pending',
        text: 'Old field',
        name: 'Another old field',
        createdAt: Date.now(),
      };

      const prepared = taskAdapter.prepareForWrite(doc, true);

      expect(prepared.text).toBeUndefined();
      expect(prepared.name).toBeUndefined();
    });
  });
});
```

**Async Testing Pattern:**
```javascript
describe('useChat', () => {
  it('sends message and receives streaming response', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test message');
    });

    // Wait for streaming to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2); // user + assistant
  });
});
```

**Error Testing Pattern:**
```javascript
describe('AuthContext', () => {
  it('maps auth/user-not-found to readable error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      try {
        await result.current.login('nonexistent@test.com', 'password');
      } catch (e) {
        // Error expected
      }
    });

    expect(result.current.error).toBe('Invalid email or password.');
  });

  it('handles network timeouts with user-friendly message', async () => {
    // Mock auth timeout
    jest.mock('firebase/auth', () => ({
      signInWithEmailAndPassword: jest.fn(
        () => new Promise((_, reject) => {
          setTimeout(() => reject({ code: 'auth/request-timeout' }), 100);
        })
      ),
    }));

    expect(result.current.error).toContain('timed out');
  });
});
```

## Coverage Goals

**Target Coverage (When Framework Installed):**
- Core modules (adapters, logger, firebase): 90%+
- Hooks (useChat, useTasks, useAuth): 85%+
- Components (UI layers): 60%+ (focus on logic, not snapshots)
- Overall project: 75%+ minimum

**Critical Paths (100% required):**
- SyncContract compliance gates (adapters, validation)
- Error handling in Firestore writes
- Auth state transitions
- Log entry creation and routing

## Performance Testing Notes

**Not Currently Addressed:**
- Rendering performance of complex components (TileLayout)
- Firestore query performance
- Large dataset handling (500+ tasks)
- Memory leaks in subscriptions

**Future Consideration:**
- React Profiler for render bottlenecks
- Firestore index optimization tests
- Long-running hook cleanup validation

---

*Testing analysis: 2026-03-25*

## Implementation Priority

1. **Set up Jest or Vitest** (1-2 days)
2. **Add Firebase Emulator** (1 day)
3. **Write SyncContract compliance suite** (3-5 days) — BLOCKING for any sync changes
4. **Add auth integration tests** (2-3 days)
5. **Add Firestore CRUD tests** (2-3 days)
6. **Add logging system tests** (1-2 days)
7. **Incremental hook/component coverage** (ongoing)
