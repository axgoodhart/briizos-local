/**
 * briizOS Terminal Logger
 * All output goes to process.stdout/stderr (the terminal running npm run dev).
 * Receives renderer logs via IPC (fire-and-forget).
 */

const { app } = require('electron');

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

// Log level hierarchy
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// Resolve active level from env (default: info in dev, warn in production)
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? (isDev ? LEVELS.info : LEVELS.warn);

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
function write(level, category, message, data) {
  if (LEVELS[level] == null || LEVELS[level] < activeLevel) return;

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
}

// Public API — matches renderer logger signature
const logger = {
  debug: (category, message, data) => write('debug', category, message, data),
  info:  (category, message, data) => write('info',  category, message, data),
  warn:  (category, message, data) => write('warn',  category, message, data),
  error: (category, message, data) => write('error', category, message, data),
};

/**
 * Register the IPC listener that receives logs from the renderer.
 * Uses ipcMain.on (fire-and-forget) — logging must never block the renderer.
 */
function registerLoggerIPC(ipcMain) {
  ipcMain.on('log-to-terminal', (_event, payload) => {
    const { level, category, message, data } = payload || {};
    if (!level || !category || !message) return;
    if (typeof logger[level] === 'function') {
      logger[level](category, message, data);
    }
  });
}

module.exports = { logger, registerLoggerIPC };
