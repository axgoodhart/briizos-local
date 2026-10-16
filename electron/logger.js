/**
 * briizOS Terminal Logger
 * All output goes to process.stdout/stderr (the terminal running npm run dev).
 * Receives renderer logs via IPC (fire-and-forget).
 */

// `app` and `BrowserWindow` are undefined when this module is loaded outside a
// full Electron main process — ELECTRON_RUN_AS_NODE, a test runner, or a
// utility script. Reading `app.isPackaged` unguarded made every module that
// logs (i.e. all of them) impossible to require in those contexts, which is why
// this is optional-chained rather than assumed present.
const { app, BrowserWindow } = require('electron');
const { AsyncLocalStorage } = require('node:async_hooks');

const isDev = process.env.NODE_ENV !== 'production' && !app?.isPackaged;

// Log level hierarchy
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// Resolve active level from env (default: info in dev, warn in production)
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? (isDev ? LEVELS.info : LEVELS.warn);
const activeLevelName = Object.keys(LEVELS).find(level => LEVELS[level] === activeLevel) || 'info';
const persistenceLevel = Math.min(activeLevel, LEVELS.info);
const LOG_BUFFER_MAX = 500;
let logBuffer = [];
let idCounter = 0;
let persistenceSink = null;
let pendingPersistence = [];
let lastPersistenceFailureAt = 0;
const activityStorage = new AsyncLocalStorage();

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  // Level colors
  debug: '\x1b[36m',   // cyan
  info: '\x1b[32m',    // green
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  // Category color
  category: '\x1b[35m', // magenta
};

const CATEGORY_LABELS = {
  island: 'Islands',
  'island.autotag': 'Island auto tags',
  'island.desk': 'Desks',
  'island.island': 'Islands',
  'island.card': 'Island cards',
  'island.files': 'Island files',
  'island.archive': 'Island archive',
  'island.terminal': 'Terminal cards',
  'island.agent': 'Island agents',
  'island.journal': 'Islands journal',
  'island.hunter': 'File Hunter',
  app: 'App startup',
  agent: 'AI',
  'agent.stream': 'AI response',
  'agent.models': 'AI model',
  langgraph: 'AI request',
  'local-data': 'Local database',
  database: 'Local database',
  chat: 'Chat',
  automation: 'Task automation',
  'task-automation': 'Task automation',
  permissions: 'Permissions',
  'permissions.surface': 'Permissions',
  'permissions.gate': 'Permissions',
  briizy: 'Screen memory',
  'briizy.helper': 'Screen capture',
  'briizy.indexer': 'Screen memory',
  'briizy.coordinator': 'Screen analysis',
  'briizy.shell': 'Screen-memory controls',
  network: 'Network request',
  ui: 'Interface',
  fs: 'Files',
  sync: 'Cloud sync',
  'cloud-gateway': 'Cloud sync',
  weather: 'Header weather',
};

function humanizeIdentifier(value) {
  return String(value || 'system')
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || humanizeIdentifier(category);
}

function terminalValue(value) {
  if (value == null) return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatEvidence(data) {
  if (data === undefined || data === null) return '';
  const parts = (data && typeof data === 'object' && !Array.isArray(data))
    ? Object.entries(data).map(([key, value]) => `${humanizeIdentifier(key)}: ${terminalValue(value)}`)
    : [terminalValue(data)];
  const flattened = parts.join(' · ').replace(/\r\n|\r|\n/g, ' ⏎ ');
  const maxLength = 4000;
  return flattened.length > maxLength
    ? `${flattened.slice(0, maxLength)}… (terminal evidence shortened; the SQLite write is monitored separately)`
    : flattened;
}

function formatTerminalMessage(message) {
  const flattened = String(message ?? '').replace(/\r\n|\r|\n/g, ' ⏎ ');
  const maxLength = 8000;
  return flattened.length > maxLength
    ? `${flattened.slice(0, maxLength)}… (terminal message shortened; the SQLite write is monitored separately)`
    : flattened;
}

/**
 * Format a timestamp as HH:MM:SS
 */
function timestamp() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

/**
 * Format and write a single log line to the terminal.
 */
function createEntry(level, category, message, data, opts = {}) {
  const inherited = activityStorage.getStore() || {};
  const entryType = opts.type || category;
  const entryCategory = opts.entryCategory || category;
  return {
    id: `main_${Date.now()}_${(idCounter++).toString(36)}`,
    type: entryType,
    source: opts.source || (entryType === 'agent' || entryType.startsWith('agent.') ? 'agent' : 'system'),
    category: entryCategory,
    message,
    data: data ?? null,
    level,
    timestamp: new Date().toISOString(),
    threadId: opts.threadId || inherited.threadId || null,
    sessionId: opts.sessionId || inherited.sessionId || null,
    taskId: opts.taskId || inherited.taskId || data?.taskId || null,
    activityId: opts.activityId || inherited.activityId || data?.activityId || null,
    spanId: opts.spanId || inherited.spanId || data?.spanId || null,
    parentSpanId: opts.parentSpanId || inherited.parentSpanId || data?.parentSpanId || null,
    activitySequence: Number.isInteger(opts.activitySequence)
      ? opts.activitySequence
      : Number.isInteger(inherited.activitySequence) ? inherited.activitySequence : null,
    phase: opts.phase || inherited.phase || null,
    outcome: opts.outcome || inherited.outcome || null,
  };
}

function broadcastEntry(entry) {
  if (!BrowserWindow?.getAllWindows) return;
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send('terminal-log-entry', entry);
    }
  });
}

function persistEntry(entry) {
  if (!persistenceSink) {
    pendingPersistence.push(entry);
    if (pendingPersistence.length > LOG_BUFFER_MAX) {
      pendingPersistence = pendingPersistence.slice(-LOG_BUFFER_MAX);
    }
    return;
  }
  try {
    const pending = persistenceSink(entry);
    if (pending && typeof pending.catch === 'function') {
      pending.catch((error) => surfacePersistenceFailure(entry, error));
    }
  } catch (error) {
    surfacePersistenceFailure(entry, error);
  }
}

function surfacePersistenceFailure(originalEntry, error) {
  const current = Date.now();
  if (current - lastPersistenceFailureAt < 5000) return;
  lastPersistenceFailureAt = current;
  const failure = createEntry(
    'error',
    'logging.persistence_failed',
    'An activity entry could not be saved to SQLite. It remains available only in this running app session; the exact database error is shown in the evidence.',
    {
      unsavedEventId: originalEntry?.id || null,
      unsavedEventType: originalEntry?.type || null,
      databaseError: error?.message || String(error || 'Local log storage is unavailable'),
      effect: 'This entry will disappear after restart unless a later write succeeds.',
    },
    { entryCategory: 'database', source: 'system' },
  );
  logBuffer.unshift(failure);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer = logBuffer.slice(0, LOG_BUFFER_MAX);
  broadcastEntry(failure);
  const line = `${COLORS.dim}[${timestamp()}]${COLORS.reset} `
    + `${COLORS.error}${COLORS.bold}ERROR${COLORS.reset} `
    + `${COLORS.category}${categoryLabel(failure.category)}${COLORS.reset} — `
    + `${formatTerminalMessage(failure.message)}  ${COLORS.dim}Evidence — ${formatEvidence(failure.data)}${COLORS.reset}`;
  process.stderr.write(line + '\n');
}

function setLogPersistence(sink) {
  persistenceSink = typeof sink === 'function' ? sink : null;
  if (!persistenceSink || pendingPersistence.length === 0) return;
  const queued = pendingPersistence;
  pendingPersistence = [];
  queued.forEach(persistEntry);
}

function rememberEntry(entry, shouldBroadcast) {
  logBuffer.unshift(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) {
    logBuffer = logBuffer.slice(0, LOG_BUFFER_MAX);
  }
  if (shouldBroadcast) {
    broadcastEntry(entry);
  }
  persistEntry(entry);
}

function write(level, category, message, data, opts = {}) {
  if (LEVELS[level] == null) return;
  const entry = createEntry(level, category, message, data, opts);
  const meetsActiveLevel = LEVELS[level] >= activeLevel;
  if (meetsActiveLevel) {
    const ts = `${COLORS.dim}[${timestamp()}]${COLORS.reset}`;
    const cat = `${COLORS.category}${categoryLabel(entry.category)}${COLORS.reset}`;
    const lvl = `${COLORS[level]}${COLORS.bold}${level.toUpperCase().padEnd(5)}${COLORS.reset}`;
    const msg = formatTerminalMessage(message);
    const terminalData = entry.type.startsWith('chat.')
      && data
      && typeof data === 'object'
      && !Array.isArray(data)
      ? Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'content'))
      : data;

    let line = `${ts} ${lvl} ${cat} — ${msg}`;

    if (terminalData !== undefined && terminalData !== null) {
      // Keep one physical terminal line per event, but label the evidence in
      // ordinary language instead of appending an unexplained JSON object.
      line += `  ${COLORS.dim}Evidence — ${formatEvidence(terminalData)}${COLORS.reset}`;
    }

    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    stream.write(line + '\n');
  }
  // Debug clockwork (for example, one entry per 3-second screenshot) is
  // available when LOG_LEVEL=debug, while meaningful info entries still reach
  // SQLite/the activity panel in packaged builds whose terminal starts at warn.
  const meetsPersistenceLevel = LEVELS[level] >= persistenceLevel;
  if (opts.remember !== false && (meetsPersistenceLevel || opts.persistBelowThreshold === true)) {
    rememberEntry(entry, opts.broadcast !== false);
  }
}

// Public API — matches renderer logger signature
const logger = {
  debug: (category, message, data, opts) => write('debug', category, message, data, opts),
  info:  (category, message, data, opts) => write('info',  category, message, data, opts),
  warn:  (category, message, data, opts) => write('warn',  category, message, data, opts),
  error: (category, message, data, opts) => write('error', category, message, data, opts),
  withActivity: (context, work) => activityStorage.run(context || {}, work),
};

/**
 * Register the IPC listener that receives logs from the renderer.
 * Uses ipcMain.on (fire-and-forget) — logging must never block the renderer.
 */
function registerLoggerIPC(ipcMain) {
  ipcMain.handle('get-terminal-logs', () => logBuffer);
  ipcMain.handle('get-terminal-log-level', () => activeLevelName);

  ipcMain.on('log-to-terminal', (_event, payload) => {
    const {
      level,
      category,
      message,
      data,
      type,
      threadId,
      sessionId,
      taskId,
      activityId,
      spanId,
      parentSpanId,
      activitySequence,
      phase,
      outcome,
    } = payload || {};
    if (!level || !category || !message) return;
    if (typeof logger[level] === 'function') {
      logger[level](category, message, data, {
        broadcast: false,
        remember: false,
        type: type || data?.eventType || category,
        entryCategory: category,
        threadId,
        sessionId,
        taskId,
        activityId,
        spanId,
        parentSpanId,
        activitySequence,
        phase,
        outcome,
      });
    }
  });
}

module.exports = { logger, registerLoggerIPC, setLogPersistence };
