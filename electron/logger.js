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

const isDev = process.env.NODE_ENV !== 'production' && !app?.isPackaged;

// Log level hierarchy
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// Resolve active level from env (default: info in dev, warn in production)
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? (isDev ? LEVELS.info : LEVELS.warn);
const activeLevelName = Object.keys(LEVELS).find(level => LEVELS[level] === activeLevel) || 'info';
const LOG_BUFFER_MAX = 500;
let logBuffer = [];
let idCounter = 0;

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
function createEntry(level, category, message, data) {
  return {
    id: `main_${Date.now()}_${(idCounter++).toString(36)}`,
    type: category,
    source: category === 'agent' || category.startsWith('agent.') ? 'agent' : 'system',
    category,
    message,
    data: data || null,
    level,
    timestamp: new Date().toISOString(),
    threadId: null,
    sessionId: null,
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

function rememberEntry(entry, shouldBroadcast) {
  logBuffer.unshift(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) {
    logBuffer = logBuffer.slice(0, LOG_BUFFER_MAX);
  }
  if (shouldBroadcast) {
    broadcastEntry(entry);
  }
}

function write(level, category, message, data, opts = {}) {
  if (LEVELS[level] == null || LEVELS[level] < activeLevel) return;
  const entry = createEntry(level, category, message, data);

  const ts = `${COLORS.dim}[${timestamp()}]${COLORS.reset}`;
  const cat = `${COLORS.category}[${category}]${COLORS.reset}`;
  const lvl = `${COLORS[level]}${COLORS.bold} ${level.toUpperCase().padEnd(5)} ${COLORS.reset}`;
  const msg = message;

  let line = `${ts} ${cat} ${lvl} ${msg}`;

  if (data !== undefined && data !== null) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 0);
    line += `  ${COLORS.dim}${serialized}${COLORS.reset}`;
  }

  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(line + '\n');
  if (opts.remember !== false) {
    rememberEntry(entry, opts.broadcast !== false);
  }
}

// Public API — matches renderer logger signature
const logger = {
  debug: (category, message, data, opts) => write('debug', category, message, data, opts),
  info:  (category, message, data, opts) => write('info',  category, message, data, opts),
  warn:  (category, message, data, opts) => write('warn',  category, message, data, opts),
  error: (category, message, data, opts) => write('error', category, message, data, opts),
};

/**
 * Register the IPC listener that receives logs from the renderer.
 * Uses ipcMain.on (fire-and-forget) — logging must never block the renderer.
 */
function registerLoggerIPC(ipcMain) {
  ipcMain.handle('get-terminal-logs', () => logBuffer);
  ipcMain.handle('get-terminal-log-level', () => activeLevelName);

  ipcMain.on('log-to-terminal', (_event, payload) => {
    const { level, category, message, data } = payload || {};
    if (!level || !category || !message) return;
    if (typeof logger[level] === 'function') {
      logger[level](category, message, data, { broadcast: false, remember: false });
    }
  });
}

module.exports = { logger, registerLoggerIPC };
