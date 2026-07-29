/**
 * briizOS Unified Logger
 *
 * Single logging system that writes to:
 * 1. Terminal (via IPC)
 * 2. In-memory buffer (for SourcesPanel Log Overlay)
 * 3. SQLite (persistent - survives app restart)
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
  tasks: 'task',
  'task-automation': 'automation',
  note: 'note',
  notefalls: 'note',
  journal: 'journal',
  canvas: 'canvas',
  canvases: 'canvas',
  calendar: 'calendar',
  event: 'calendar',
  organizer: 'organizer',
  chat: 'chat',
  agent: 'agent',
  'agent-jobs': 'agent',
  langgraph: 'agent',
  'tool-bridge': 'agent',
  tool: 'agent',
  ui: 'ui',
  sync: 'sync',
  'cloud-gateway': 'sync',
  firestore: 'sync',
  auth: 'system',
  app: 'system',
  config: 'settings',
  permissions: 'permissions',
  briizy: 'screen-memory',
  rewind: 'screen-memory',
  weather: 'weather',
  'local-data': 'database',
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
};

function resolveCategory(type) {
  if (CATEGORY_MAP[type]) return CATEGORY_MAP[type];
  const prefix = type.split('.')[0];
  return CATEGORY_MAP[prefix] || 'system';
}

// ---------------------------------------------------------------------------
// Source detection — who triggered this log
// ---------------------------------------------------------------------------
const AGENT_PREFIXES = ['agent.', 'tool.', 'chat.assistant'];
const SYSTEM_PREFIXES = ['system.', 'sync.', 'firestore.', 'auth.', 'error.'];

function resolveSource(type, explicitSource) {
  if (explicitSource) return explicitSource;
  if (type === 'chat.user_message') return 'user';
  if (AGENT_PREFIXES.some(p => type.startsWith(p))) return 'agent';
  if (SYSTEM_PREFIXES.some(p => type.startsWith(p))) return 'system';
  // A log records what the application observed. Do not label an automatic
  // weather, permission, database, or screen-memory event as user-originated
  // merely because its type is not on a short allowlist.
  return 'system';
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

function sendToTerminal(level, category, message, data, type = null) {
  const payload = { level, category, message, data, type };
  if (ipcReady) {
    window.api.logToTerminal(payload);
  } else {
    ipcQueue.push(payload);
    if (window.api?.logToTerminal) flushIPC();
  }
}

// ---------------------------------------------------------------------------
// Local SQLite persistence — logs survive app restart
// ---------------------------------------------------------------------------
let lastPersistenceFailureAt = 0;

function reportLogPersistenceFailure(entry, error) {
  const current = Date.now();
  if (current - lastPersistenceFailureAt < 5000) return;
  lastPersistenceFailureAt = current;
  const failure = createEntry(
    'error',
    'logging.persistence_failed',
    'This activity entry could not be saved to SQLite. It remains visible only for this app session; the exact database error is shown below.',
    {
      unsavedEventId: entry?.id || null,
      unsavedEventType: entry?.type || null,
      databaseError: error?.message || String(error || 'Local log storage is unavailable'),
      effect: 'This log entry will disappear after restart unless a later retry succeeds.',
    },
    'system',
  );
  addToBuffer(failure);
  sendToTerminal(failure.level, failure.category, failure.message, failure.data, failure.type);
}

function writeToLocalDb(entry) {
  try {
    const append = window.api?.localData?.logs?.append;
    if (typeof append !== 'function') {
      reportLogPersistenceFailure(entry, new Error('Local log storage is unavailable'));
      return;
    }
    const pending = append(entry);
    if (pending && typeof pending.catch === 'function') {
      pending.catch((error) => reportLogPersistenceFailure(entry, error));
    }
  } catch (e) {
    reportLogPersistenceFailure(entry, e);
  }
}

// ---------------------------------------------------------------------------
// In-memory log buffer — SourcesPanel subscribes to this directly for instant
// display without waiting for Firestore round-trip
// ---------------------------------------------------------------------------
const LOG_BUFFER_MAX = 500;
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
let logBuffer = [];
let logListeners = new Set();
let activeBufferLevel = LEVELS.info;

let notifyScheduled = false;

function shouldBufferLog(entry) {
  const entryLevel = LEVELS[entry?.level] ?? LEVELS.info;
  return entryLevel >= activeBufferLevel;
}

function addToBuffer(entry) {
  if (!shouldBufferLog(entry)) return;
  if (logBuffer.some(log => log.id === entry.id)) return;
  logBuffer.unshift(entry); // newest first
  logBuffer.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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

function applyBufferLevel(levelName) {
  if (LEVELS[levelName] != null) {
    // The activity panel always retains meaningful info entries, including
    // chat, even when a packaged build keeps the terminal at warn/error.
    // LOG_LEVEL=debug still opts into the internal trace stream.
    const nextLevel = Math.min(LEVELS[levelName], LEVELS.info);
    if (nextLevel !== activeBufferLevel) {
      activeBufferLevel = nextLevel;
      logBuffer = logBuffer.filter(shouldBufferLog);
      for (const listener of logListeners) {
        try { listener(logBuffer); } catch (e) { /* noop */ }
      }
    }
  }
}

async function hydrateTerminalLogLevel() {
  try {
    const levelName = await window.api?.getTerminalLogLevel?.();
    applyBufferLevel(levelName);
  } catch (e) {
    // The panel defaults to info if the main-process level is unavailable.
  }
}

async function hydrateTerminalLogs() {
  try {
    const terminalLogs = await window.api?.getTerminalLogs?.();
    if (Array.isArray(terminalLogs)) {
      terminalLogs.forEach(addToBuffer);
    }
  } catch (e) {
    // Terminal log hydration should never affect app startup.
  }
}

if (typeof window !== 'undefined' && window.api?.onTerminalLog) {
  hydrateTerminalLogLevel().then(hydrateTerminalLogs);
  window.api.onTerminalLog((entry) => {
    if (entry?.id && entry?.timestamp) {
      addToBuffer(entry);
    }
  });
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
    data: data ?? null,
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
  const terminalEvidence = data && typeof data === 'object' && !Array.isArray(data)
    ? { eventType: type, ...data }
    : { eventType: type, detail: data ?? null };
  sendToTerminal(level, entry.category, message, terminalEvidence, type);

  // 2. In-memory buffer (immediate, for Log Overlay)
  addToBuffer(entry);

  // 3. Local SQLite (persistent, survives app restart)
  if (shouldBufferLog(entry)) writeToLocalDb(entry);

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
