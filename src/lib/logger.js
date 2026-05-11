/**
 * briizOS Unified Logger
 *
 * Single logging system that writes to:
 * 1. Terminal (via IPC)
 * 2. In-memory buffer (for SourcesPanel Log Overlay)
 * 3. SQLite (persistent - survives app restart)
 * 4. Firestore (synced - cross-device)
 *
 * Usage:
 * import log from '../lib/logger';
 * log('task.created', 'Created task: Fix login bug', { taskId: 't_123' });
 * log.error('agent.failed', 'Subagent crashed', { error: err.message });
 *
 * Subscribe in components:
 * import { subscribeLogs } from '../lib/logger';
 * useEffect(() => { return subscribeLogs((logs) => setLogs(logs)); }, []);
 */

// ---------------------------------------------------------------------------
// Session ID — unique per app launch, links all logs from one session
// ---------------------------------------------------------------------------
const SESSION_ID = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Categories — derived from event type prefix
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  task: 'task',
  note: 'note',
  canvas: 'canvas',
  calendar: 'calendar',
  event: 'calendar',
  organizer: 'organizer',
  chat: 'chat',
  agent: 'agent',
  tool: 'agent',
  ui: 'ui',
  sync: 'sync',
  firestore: 'sync',
  auth: 'system',
  system: 'system',
  settings: 'system',
  localStorage: 'system',
  error: 'system',
  symphobriiz: 'agent',
  memory: 'memory',
  skills: 'skills',
  network: 'network',
  fs: 'fs',
  api: 'api',
  briiztorm: 'briiztorm',
  canvas: 'canvas',
};

function resolveCategory(type) {
  const prefix = type.split('.')[0];
  return CATEGORY_MAP[prefix] || 'system';
}

// ---------------------------------------------------------------------------
// Source detection — who triggered this log
// ---------------------------------------------------------------------------
const AGENT_PREFIXES = ['agent.', 'tool.'];
const SYSTEM_PREFIXES = ['system.', 'sync.', 'firestore.', 'auth.', 'error.'];

function resolveSource(type, explicitSource) {
  if (explicitSource) return explicitSource;
  if (AGENT_PREFIXES.some(p => type.startsWith(p))) return 'agent';
  if (SYSTEM_PREFIXES.some(p => type.startsWith(p))) return 'system';
  return 'user';
}

// ---------------------------------------------------------------------------
// IPC bridge (terminal output) — queues until preload bridge is ready
// ---------------------------------------------------------------------------
let ipcQueue = [];
let ipcReady = false;

function flushIPC() {
  if (!window.api?.logToTerminal) return;
  ipcReady = true;
  for (const payload of ipcQueue) {
    window.api.logToTerminal(payload);
  }
  ipcQueue = [];
}

function sendToTerminal(level, category, message, data) {
  const payload = { level, category, message, data };
  if (ipcReady) {
    window.api.logToTerminal(payload);
  } else {
    ipcQueue.push(payload);
    if (window.api?.logToTerminal) flushIPC();
  }
}

// ---------------------------------------------------------------------------
// Firestore persistence — writes are fire-and-forget, batched via queue
// ---------------------------------------------------------------------------
let firestoreWriter = null;

/**
 * Register the Firestore write function. Called once from firestore.js
 * after Firebase is initialized. This avoids circular imports.
 */
export function registerFirestoreWriter(writerFn) {
  firestoreWriter = writerFn;
}

// ---------------------------------------------------------------------------
// Local SQLite persistence — logs survive app restart
// ---------------------------------------------------------------------------
function writeToLocalDb(entry) {
  try {
    if (window.api?.localDbInsertLog) {
      window.api.localDbInsertLog(entry);
    }
  } catch (e) {
    // Never let local DB writes break the app
  }
}

function writeToFirestore(entry) {
  if (firestoreWriter) {
    try {
      firestoreWriter(entry);
    } catch (e) {
      // Never let log persistence break the app
      sendToTerminal('error', 'logger', 'Firestore log write failed', e?.message);
    }
  }
}

// ---------------------------------------------------------------------------
// In-memory log buffer — SourcesPanel subscribes to this directly for instant
// display without waiting for Firestore round-trip
// ---------------------------------------------------------------------------
const LOG_BUFFER_MAX = 500;
let logBuffer = [];
let logListeners = new Set();

let notifyScheduled = false;

function addToBuffer(entry) {
  logBuffer.unshift(entry); // newest first
  if (logBuffer.length > LOG_BUFFER_MAX) {
    logBuffer = logBuffer.slice(0, LOG_BUFFER_MAX);
  }
  // Defer listener notification to avoid setState-during-render errors.
  // Multiple log calls within the same tick are batched into one notify.
  if (!notifyScheduled) {
    notifyScheduled = true;
    queueMicrotask(() => {
      notifyScheduled = false;
      for (const listener of logListeners) {
        try {
          listener(logBuffer);
        } catch (e) {
          // Never let a bad listener break logging
        }
      }
    });
  }
}

/**
 * Subscribe to log updates. Returns unsubscribe function.
 * Callback receives the full log buffer (newest first).
 */
export function subscribeLogs(callback) {
  logListeners.add(callback);
  // Immediately send current buffer
  callback(logBuffer);
  return () => logListeners.delete(callback);
}

/**
 * Get current log buffer snapshot.
 */
export function getLogBuffer() {
  return logBuffer;
}

/**
 * Clear the in-memory log buffer.
 */
export function clearLogs() {
  logBuffer = [];
  for (const listener of logListeners) {
    try { listener(logBuffer); } catch (e) { /* noop */ }
  }
}

// ---------------------------------------------------------------------------
// Thread context — set when a chat/agent thread is active
// ---------------------------------------------------------------------------
let activeThreadId = null;

export function setActiveThread(threadId) {
  activeThreadId = threadId;
}

// ---------------------------------------------------------------------------
// Core log function
// ---------------------------------------------------------------------------
let idCounter = 0;

function createEntry(level, type, message, data, source) {
  return {
    id: `evt_${Date.now()}_${(idCounter++).toString(36)}`,
    type,
    source: resolveSource(type, source),
    category: resolveCategory(type),
    message,
    data: data || null,
    level,
    timestamp: new Date().toISOString(),
    threadId: activeThreadId,
    sessionId: SESSION_ID,
  };
}

/**
 * Log an event. This is the primary API.
 *
 * @param {string} type - Structured event type (e.g. 'task.created', 'ui.modal.open')
 * @param {string} message - Human-readable description
 * @param {object} [data] - Structured context data
 * @param {object} [opts] - Options: { source, level, threadId }
 */
function log(type, message, data, opts = {}) {
  const level = opts.level || 'info';
  const entry = createEntry(level, type, message, data, opts.source);
  if (opts.threadId) entry.threadId = opts.threadId;

  // 1. Terminal (immediate, via IPC)
  sendToTerminal(level, entry.category, `[${type}] ${message}`, data);

  // 2. In-memory buffer (immediate, for Log Overlay)
  addToBuffer(entry);

  // 3. Local SQLite (persistent, survives app restart)
  writeToLocalDb(entry);

  // 4. Firestore (async, fire-and-forget — cross-deployment sync)
  writeToFirestore(entry);

  return entry;
}

// ---------------------------------------------------------------------------
// Convenience methods — log.info(), log.warn(), log.error(), log.debug()
// ---------------------------------------------------------------------------
log.info = (type, message, data, opts) =>
  log(type, message, data, { ...opts, level: 'info' });

log.warn = (type, message, data, opts) =>
  log(type, message, data, { ...opts, level: 'warn' });

log.error = (type, message, data, opts) =>
  log(type, message, data, { ...opts, level: 'error' });

log.debug = (type, message, data, opts) =>
  log(type, message, data, { ...opts, level: 'debug' });

// ---------------------------------------------------------------------------
// Export session ID for linking
// ---------------------------------------------------------------------------
export { SESSION_ID };

export default log;
