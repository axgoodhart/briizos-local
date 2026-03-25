# Codebase Concerns

**Analysis Date:** 2026-03-25

## Tech Debt

**Large monolithic persistence layer:**
- Issue: `src/lib/firestore.js` (1888 lines) combines read subscriptions, write operations, and sync logic in a single file with limited separation of concerns.
- Files: `src/lib/firestore.js`, `src/lib/syncAdapters.js` (259 lines)
- Impact: Difficult to test individually, high risk of unintended side effects when modifying sync behavior, tight coupling between business logic and Firestore API calls.
- Fix approach: Extract read logic, write logic, and adapter coordination into separate modules. Consider introducing a data repository pattern or service layer to decouple application code from Firestore implementation.

**Tool registry missing validation layers:**
- Issue: `src/lib/tools.js` (770 lines) contains tool definitions with handlers that accept arbitrary parameters. No schema validation, type checking, or input sanitization before execution.
- Files: `src/lib/tools.js` (tools registry), `src/hooks/useToolBridge.js` (tool bridge executor)
- Impact: Malformed or malicious tool parameters could crash handlers, bypass confirmation gates via `__agentAuto` flag, or pass through unvalidated data to Firestore operations.
- Fix approach: Implement JSON Schema validation for all tool parameters. Validate parameters in tool bridge before passing to handler. Separate auth/confirmation logic from parameter validation.

**Loose IPC boundary validation:**
- Issue: Tool bridge (`src/hooks/useToolBridge.js`) executes tools via IPC with minimal validation. The `__agentAuto` flag bypasses confirmation entirely, and requestId/toolName are trusted without verification.
- Files: `src/hooks/useToolBridge.js`, `electron/main.js` (tool bridge router)
- Impact: IPC message source is not verified — a compromised renderer could spoof tool calls or claim agent origin to bypass confirmation.
- Fix approach: Sign or hash IPC messages from agent worker threads. Verify requestId matches an active pending request before accepting result. Validate toolName against allowed agent tools list.

**Async state synchronization gaps in useChat:**
- Issue: `src/hooks/useChat.js` (698 lines) manages multiple async streams (LangGraph events, remote chat, file context) with refs and state that can become stale. No explicit coordination mechanism between data sources.
- Files: `src/hooks/useChat.js`, `src/hooks/useLangGraphStatus.js`
- Impact: Race conditions where streamed content, tool calls, or suggestions arrive out of order. Thread ID might be null when messages are sent. Active thread could be cleared while operations are pending.
- Fix approach: Introduce a conversation session manager that coordinates all async streams. Queue pending operations until thread is ready. Use explicit state machine for stream lifecycle (idle → creating → active → closed).

**Missing cleanup on component unmount in hooks:**
- Issue: Several hooks set up listeners but cleanup may be incomplete. `useChat` (line 152) registers LangGraph listener with cleanup, but if effect runs multiple times, previous listeners may persist.
- Files: `src/hooks/useChat.js`, `src/hooks/useOrchestratorEvents.js`, `src/hooks/useToolBridge.js`
- Impact: Memory leaks, duplicate event handlers if hot-reload occurs, stale data flowing into components.
- Fix approach: Audit all window.api listeners to ensure cleanup function properly unregisters. Consider using AbortController for IPC listeners. Test cleanup with intentional unmount/remount cycles.

**Timestamp handling inconsistencies:**
- Issue: Code mixes epoch milliseconds (Date.now()), ISO strings, and Firestore Timestamp objects. Helper `toISO()` in `src/lib/firestore.js` (line 88) provides fallback but can hide timestamp type mismatches.
- Files: `src/lib/firestore.js` (toISO function), `src/lib/syncAdapters.js` (stamp function), `src/lib/agentJobsFirestore.js` (nowMs)
- Impact: Sorting by timestamp is unreliable. Conflict resolution (SyncContract §6) depends on correct timestamp comparison. Silent fallbacks mask bugs.
- Fix approach: Define canonical timestamp type (recommend epoch ms throughout app). Validate timestamps at adapter boundaries. Reject documents with invalid or mixed timestamp types.

## Known Bugs

**Agent job lease timeout race condition:**
- Symptoms: Multiple workers may claim the same job simultaneously if lease expires during claim transaction.
- Files: `src/lib/agentJobsFirestore.js` (lines 94-136, claimNextJob function)
- Trigger: Happens when (data.leaseUntil || 0) <= nowMs() evaluates true for multiple workers within polling interval (1500ms).
- Workaround: Job will be executed multiple times but de-duped at result storage. Second execution logs "Claim race lost" and continues.
- Deep fix needed: Use Firestore field increment or conditions to atomically prevent re-lease. Consider distributed lock pattern.

**Stale file context in LangGraph stream:**
- Symptoms: Tool calls reference files that were deleted before execution completes. File metadata in context doesn't match actual filesystem state.
- Files: `src/hooks/useChat.js` (lines 112-122, loadSelectedFiles), `src/lib/tools.js` (agentReadFile, agentWriteFile handlers)
- Trigger: User changes selected files while LangGraph is streaming tool calls.
- Workaround: None — tool will fail with "File not found" error.
- Deep fix needed: Freeze file context at thread creation time. Validate file paths exist before execution, not just before tool submission.

**LogPanel buffer overflow silent fail:**
- Symptoms: Logs older than 500 entries disappear from UI. No warning when buffer is full.
- Files: `src/lib/logger.js` (line 119-120, LOG_BUFFER_MAX = 500)
- Trigger: After 500 log events, oldest entries are pruned.
- Workaround: Export logs to Firestore (logs persist there), then clear buffer manually.
- Deep fix needed: Implement rolling compression of old logs, or bump buffer to 2000+ with age-based cleanup. Add warning when approaching limit.

## Security Considerations

**Firebase credentials in client code:**
- Risk: `src/lib/firebase.js` (line 17-24) reads Firebase config from environment variables. If env vars are exposed, attacker gains direct Firestore access under your project key.
- Files: `src/lib/firebase.js`, `.env` (not readable, assumed to exist)
- Current mitigation: Firestore rules enforce user-scoped access. Client SDK limitations prevent cross-user reads if rules are correct.
- Recommendations: Verify Firestore security rules explicitly forbid uid != auth.uid. Consider using Firebase App Check to verify client legitimacy. Rotate API key if ever exposed in logs or error messages.

**Tool execution without authentication context:**
- Risk: Tool bridge bypass confirmation for agent-initiated calls via `__agentAuto: true`. If agent identity is not verified, untrusted code can execute filesystem operations.
- Files: `src/hooks/useToolBridge.js` (line 51), `src/context/ToolContext.jsx` (tool confirmation gate)
- Current mitigation: Agent worker identity is verified at subagent executor level in Python backend.
- Recommendations: Add explicit source verification in tool bridge. Log which agent/subagent requested each tool call. Consider adding per-tool rate limits.

**Filesystem blacklist incomplete:**
- Risk: `src/lib/tools.js` (lines 158-163, agentReadFile) checks a blacklist, but if config is missing or incomplete, files could be exposed.
- Files: `src/lib/tools.js`, `src/lib/permissions.js`
- Current mitigation: Blacklist pattern enforcement in permissions module.
- Recommendations: Use whitelist instead of blacklist (default-deny). Enforce at IPC boundary in Electron main process. Test against common sensitive paths (.ssh, .aws, node_modules).

**JSON parsing in tool parameters:**
- Risk: Tool handlers receive params object directly from IPC without schema validation. If attacker crafts malformed JSON or prototype pollution attack, handlers may fail unexpectedly.
- Files: `src/hooks/useToolBridge.js` (line 50, params passed directly)
- Current mitigation: None — parameters trusted from IPC.
- Recommendations: Implement strict JSON parsing with size limits. Validate each tool's parameter schema before passing to handler.

## Performance Bottlenecks

**Firestore polling with no exponential backoff:**
- Problem: `src/lib/agentJobsFirestore.js` (line 27, pollMs: 1500) polls every 1.5 seconds for new jobs regardless of frequency. If no jobs exist, continuous queries hammer Firestore quota.
- Files: `src/lib/agentJobsFirestore.js` (DEFAULTS.pollMs)
- Cause: Fixed interval polling without backoff when queue is empty.
- Improvement path: Implement exponential backoff up to max_poll (30s) when no jobs found. Reset backoff on new job detection.

**useChat hook re-subscribes on every prop change:**
- Problem: `src/hooks/useChat.js` (line 78-89, chat message subscription) depends on `uid`, which is re-computed on every render even if unchanged.
- Files: `src/hooks/useChat.js` (lines 77-89)
- Cause: getCurrentUid() called directly in render, not memoized.
- Improvement path: Wrap uid in useMemo. Consider moving uid to context to avoid re-computation on every component re-render.

**Large document arrays sorted in memory:**
- Problem: `src/lib/tools.js` (lines 123-125, findScheduleConflicts) does O(n²) conflict detection for all events, then sorts conflicts. No pagination.
- Files: `src/lib/tools.js` (tools.findScheduleConflicts)
- Cause: No limit on query results before processing.
- Improvement path: Implement date range filtering before conflict detection. Return paginated results if over 100 conflicts. Consider server-side aggregation.

**Theme engine re-parses on every render:**
- Problem: `src/lib/themeEngine.js` (651 lines) loads and parses large CSS string. If called multiple times per session, parsing cost is repeated.
- Files: `src/lib/themeEngine.js`, `src/App.jsx` (line 30-37, applyUiTheme)
- Cause: No memoization of parsed theme.
- Improvement path: Cache parsed theme object. Load theme once at app startup, not on every render or theme change.

**Firestore batch write without size validation:**
- Problem: `src/lib/firestore.js` (writeBatch calls) don't validate total size or operation count. Firestore limits are 500 writes per batch, 10MB total.
- Files: `src/lib/firestore.js` (batch write operations)
- Cause: No explicit batch size checks before calling batch.commit().
- Improvement path: Implement batch size tracking. Emit warning if approaching limits. Break large writes into multiple batches.

## Fragile Areas

**Sync adapter normalization round-trips:**
- Files: `src/lib/syncAdapters.js`, `src/lib/firestore.js` (write paths)
- Why fragile: Each adapter normalizes both on read (snake_case → camelCase, aliases → canonical) and on write (canonical → enforce, strip aliases). If a new alias is introduced in one place, it breaks unless both adapters are updated. Legacy field names still exist in normalizeOnRead but are stripped in prepareForWrite, creating hidden state.
- Safe modification: When adding support for a new field alias, update BOTH normalizeOnRead and prepareForWrite in same commit. Add test case for round-trip (read → write → read matches). Update SyncContract.md.
- Test coverage: No explicit unit tests for adapter round-trips. sync behavior is only tested via integration tests with Firestore.

**Note UI position conflict resolution:**
- Files: `src/lib/syncAdapters.js` (noteAdapter, lines 185-240)
- Why fragile: Contract §6 defines ui.local and ui.web as independent merge domains, but code has no awareness of which client wrote which branch. If local and web write simultaneously to different xywh branches, one could be lost if updatedAt values are equal.
- Safe modification: Verify ui.local.xywh and ui.web.xywh are never merged as one state. Test simultaneous writes from mock web and local clients. Validate that web changes don't clobber local position.
- Test coverage: No tests for simultaneous position updates from both clients. Manual testing only.

**Agent job execution with unvalidated tool callbacks:**
- Files: `src/lib/agentJobsFirestore.js` (lines 179-185, job execution), `src/context/ToolContext.jsx` (executeTool callback)
- Why fragile: Job executor calls executeTool callback without verifying it's defined. Tool result is stored without validation that it matches expected schema. If callback throws, job enters error state but may not be retryable.
- Safe modification: Always validate executeTool callback before job start. Define tool result schema and validate before storage. Ensure error state includes retry information.
- Test coverage: Unit tests exist for job claiming, but execution path is lightly tested.

**LangGraph stream event parsing with version mismatch:**
- Files: `src/hooks/useChat.js` (lines 152-309, stream event handler)
- Why fragile: Python backend version and JS frontend version may diverge. Stream event structure (keys, types) could change without warning. Event.data.type hardcoded checks (line 168, "tool_calls") may become invalid.
- Safe modification: Add event schema version field to stream events. Log unexpected event types instead of silently ignoring. Add version compatibility check at stream setup.
- Test coverage: Stream parsing tested against live Python backend only, not against schema versioning tests.

**Task automation with dangling references:**
- Files: `src/lib/taskAutomation.js` (196 lines), `src/hooks/useTaskAutomation.js` (316 lines)
- Why fragile: Task automation creates agent jobs with task IDs, but if task is deleted before job completes, executor still tries to read/update the deleted task.
- Safe modification: Query task existence before executing job. Handle task-not-found gracefully. Add cascade delete for pending jobs when task is deleted.
- Test coverage: No tests for orphaned job cleanup.

## Scaling Limits

**In-memory log buffer:**
- Current capacity: 500 entries per session
- Limit: After 500 entries, oldest logs are deleted (src/lib/logger.js line 119).
- Impact: Diagnostic logs beyond 500 entries are lost unless user exports to Firestore.
- Scaling path: Implement circular buffer with compression. Batch old logs to Firestore hourly. Support exporting full session log on demand.

**Desktop agent worker pool:**
- Current capacity: 3 workers total (agent/src/subagents/executor.py line 71: ThreadPoolExecutor max_workers=3)
- Limit: Cannot execute more than 3 subagents in parallel. Queued tasks wait until worker available.
- Impact: Slow orchestration for tasks requiring 4+ parallel subagents.
- Scaling path: Make worker pool size configurable. Implement work-stealing pool for better resource utilization. Monitor pool utilization and warn if saturated.

**Firestore document size:**
- Current capacity: No explicit limits per document
- Limit: Firestore max document size is 1MB. Large task.actions arrays or note.body content could approach this.
- Impact: Writes fail silently if document exceeds 1MB. Content appears to save but doesn't.
- Scaling path: Implement document size checks before write. Truncate or archive large documents. Add validation tests with large payloads.

**Chat message history storage:**
- Current capacity: All messages stored in Firestore desktopChatMessages collection without pagination or archival.
- Limit: No explicit limit, but query performance degrades with collection size (>10k documents).
- Impact: Chat history queries slow down over time as collection grows.
- Scaling path: Implement message archival after 30 days. Paginate queries. Consider moving old messages to separate archive collection.

## Dependencies at Risk

**Firebase SDK version pinning:**
- Risk: `package.json` does not pin Firebase SDK versions explicitly (uses ^). Breaking changes in Firebase v10+ (Firestore initialization) already required fallback handling (src/lib/firebase.js line 56-59).
- Impact: Future Firebase updates could break Firestore initialization, auth persistence, or offline behavior.
- Migration plan: Pin firebase SDK to specific major version (e.g., ^11.0.0). Add integration tests that verify Firebase compatibility on each update. Test offline-first behavior after updates.

**Electron API surface stability:**
- Risk: Many window.api calls are not versioned or type-checked. Preload bindings (`window.api.langgraphCreateThread`, `window.api.onToolBridgeExecute`, etc.) are assumed to exist without fallback.
- Impact: If Electron main process is updated and an API binding is removed or renamed, renderer crashes.
- Migration plan: Define versioned API contract in shared types file. Version preload bindings. Add API existence checks with graceful fallback for older Electron builds.

**LangGraph Python backend compatibility:**
- Risk: Stream event structure, tool execution protocol, and job execution behavior are implemented in Python backend (agent/src/agents), but JS frontend assumes specific behavior without version checks.
- Impact: Python backend changes (e.g., new event types, removed tool support) could break stream parsing or tool execution.
- Migration plan: Add API version handshake at connection time. Define stream event schema and validate before processing. Log schema mismatches.

## Missing Critical Features

**No explicit session management:**
- Problem: Chat threads, orchestrator tasks, and agent jobs are created dynamically but there's no explicit session lifecycle. Thread IDs are stored in component refs, not persisted. Session ends if browser tab is closed.
- Blocks: Users can't resume conversations across sessions. No way to list all historical threads.
- Impact: Each new session is isolated — context from previous sessions is lost.

**No tool result caching or memoization:**
- Problem: Tools like `getScheduleSummary` and `searchNotes` query Firestore every time, even if called with identical parameters within same thread.
- Blocks: Cannot optimize agent performance for repeated queries. No way to avoid re-computing expensive operations.
- Impact: High Firestore quota consumption for repetitive agent behavior.

**No rate limiting or quota enforcement:**
- Problem: Agent workers and tool executors have no rate limits. Desktop can hammer Firestore or filesystem with unlimited requests.
- Blocks: Cannot prevent runaway agent loops or DOS from malicious tool definitions.
- Impact: Firestore quota could be exhausted by single misbehaving agent.

**No explicit error recovery strategy:**
- Problem: Jobs fail and are retried, but there's no user-facing queue or manual intervention mechanism. Failed jobs disappear after retry exhaustion.
- Blocks: Users can't retry failed orchestrations or inspect why they failed.
- Impact: Silent failures — user doesn't know task didn't complete.

## Test Coverage Gaps

**Sync adapter round-trip tests:**
- What's not tested: Document normalization consistency (read → write → read produces same shape).
- Files: `src/lib/syncAdapters.js` (all adapters), `src/lib/firestore.js` (write paths)
- Risk: Aliases added in one place without updating adapters elsewhere. Contract violations (§9 prohibited patterns) could slip through.
- Priority: High — sync bugs corrupt shared data across web and local clients.

**Tool parameter validation:**
- What's not tested: Malformed tool parameters, injection attacks, schema mismatches.
- Files: `src/lib/tools.js`, `src/hooks/useToolBridge.js`
- Risk: Tool handlers crash or behave unexpectedly with invalid input.
- Priority: High — affects user experience and security.

**Firestore offline behavior:**
- What's not tested: Reads/writes when network is unavailable. Conflict resolution when app comes back online.
- Files: `src/lib/firestore.js`, `src/lib/firebase.js` (persistentLocalCache)
- Risk: Data inconsistency if user modifies data while offline and conflict occurs on sync.
- Priority: Medium — desktop app may experience intermittent network.

**LangGraph stream event parsing under load:**
- What's not tested: Rapid stream events, out-of-order events, duplicate events, missing fields.
- Files: `src/hooks/useChat.js` (stream handler), `src/hooks/useOrchestratorEvents.js`
- Risk: Race conditions, dropped tool calls, inconsistent UI state under high throughput.
- Priority: Medium — edge case but high impact if occurs.

**Concurrent operations on same document:**
- What's not tested: Simultaneous updates to same task/note/event from different sources (UI user action, agent job, remote sync).
- Files: `src/lib/firestore.js` (all update functions), `src/lib/agentJobsFirestore.js` (job execution)
- Risk: Last-writer-wins conflict resolution loses data. Contract §6 race conditions.
- Priority: High — data loss risk.

**Agent job cleanup and cancellation:**
- What's not tested: Job cancellation in-flight, cleanup on error, lease expiration during execution.
- Files: `src/lib/agentJobsFirestore.js`, agent/src/subagents/executor.py
- Risk: Orphaned jobs, duplicate execution, resource leaks.
- Priority: Medium — affects agent reliability.

---

*Concerns audit: 2026-03-25*
