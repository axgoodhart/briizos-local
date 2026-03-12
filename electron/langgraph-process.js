/**
 * LangGraph Process Lifecycle Manager
 *
 * Manages the Python/LangGraph child process that powers the agent backend.
 * Handles environment detection (uv binary), process spawning, state tracking,
 * and clean shutdown with SIGTERM/SIGKILL escalation.
 *
 * Exports: start(), stop(), getStatus(), getPort(), BACKEND_URL
 */

const { spawn, execFileSync, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const { logger } = require('./logger');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = 2024;
const BACKEND_DIR = path.resolve(__dirname, '../../deerflow/backend');
const BACKEND_URL = `http://127.0.0.1:${PORT}`;
const SHUTDOWN_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const state = {
  process: null,
  status: 'idle',       // idle | starting | running | stopped | crashed | error | env_missing
  port: PORT,
  pid: null,
  startedAt: null,
  uvPath: null,
};

// Cache for environment detection (only run once per session)
let envDetectionDone = false;

// ---------------------------------------------------------------------------
// Environment detection (BACK-05)
// ---------------------------------------------------------------------------

/**
 * Locate the `uv` binary on the system.
 * Checks `which uv`, then falls back to common installation paths.
 * Returns the absolute path to the binary, or null if not found.
 */
function detectUv() {
  if (envDetectionDone && state.uvPath !== null) {
    return state.uvPath;
  }

  // 1. Try `which uv` (works on macOS/Linux)
  try {
    const result = execSync('which uv', { encoding: 'utf8', timeout: 5000 }).trim();
    if (result) {
      logger.info('langgraph', 'uv found via which', { path: result });
      state.uvPath = result;
      envDetectionDone = true;
      return result;
    }
  } catch {
    // which failed — try common paths
  }

  // 2. Check common installation paths
  const home = os.homedir();
  const commonPaths = [
    path.join(home, '.local', 'bin', 'uv'),
    path.join(home, '.cargo', 'bin', 'uv'),
    '/usr/local/bin/uv',
    '/opt/homebrew/bin/uv',
  ];

  for (const candidate of commonPaths) {
    try {
      // Verify the binary is executable
      execFileSync(candidate, ['--version'], { encoding: 'utf8', timeout: 5000 });
      logger.info('langgraph', 'uv found at common path', { path: candidate });
      state.uvPath = candidate;
      envDetectionDone = true;
      return candidate;
    } catch {
      // Not found or not executable at this path
    }
  }

  logger.warn('langgraph', 'uv binary not found on this system');
  envDetectionDone = true;
  return null;
}

/**
 * Verify Python 3.12+ is available via uv.
 * Returns the Python version string, or null if unavailable.
 */
function detectPython() {
  const uvPath = detectUv();
  if (!uvPath) return null;

  try {
    const result = execFileSync(uvPath, ['run', 'python', '--version'], {
      encoding: 'utf8',
      timeout: 15000,
      cwd: BACKEND_DIR,
    }).trim();
    // Expected format: "Python 3.12.x"
    logger.info('langgraph', 'Python detected via uv', { version: result });
    return result;
  } catch (err) {
    logger.warn('langgraph', 'Python detection via uv failed', err?.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Process spawning (BACK-01)
// ---------------------------------------------------------------------------

/**
 * Start the LangGraph dev server as a child process.
 * Returns true if spawned successfully, false otherwise.
 */
async function start() {
  // Prevent double-start
  if (state.process && state.status !== 'stopped' && state.status !== 'crashed' && state.status !== 'error') {
    logger.warn('langgraph', 'Process already running or starting', { status: state.status });
    return false;
  }

  // 1. Detect uv
  const uvPath = detectUv();
  if (!uvPath) {
    logger.error('langgraph', 'Cannot start — uv binary not found');
    state.status = 'env_missing';
    return false;
  }

  // 2. Spawn uv run langgraph dev
  const args = [
    'run',
    'langgraph',
    'dev',
    '--no-browser',
    '--allow-blocking',
    '--no-reload',
    '--port', String(PORT),
  ];

  logger.info('langgraph', 'Spawning LangGraph process', {
    command: `${uvPath} ${args.join(' ')}`,
    cwd: BACKEND_DIR,
    port: PORT,
  });

  state.status = 'starting';

  try {
    const child = spawn(uvPath, args, {
      cwd: BACKEND_DIR,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    state.process = child;
    state.pid = child.pid;
    state.startedAt = Date.now();

    // Pipe stdout through logger
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          logger.info('langgraph', line.trim());

          // Detect when the server is actually ready
          if (line.includes('Ready!') || line.includes('Application startup complete') || line.includes('Uvicorn running')) {
            if (state.status === 'starting') {
              state.status = 'running';
              logger.info('langgraph', 'LangGraph server is running', { port: PORT, pid: child.pid });
            }
          }
        }
      });
    }

    // Pipe stderr through logger
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          // LangGraph/uvicorn often writes normal startup info to stderr
          logger.info('langgraph', line.trim());

          // Also detect readiness from stderr (uvicorn logs to stderr)
          if (line.includes('Ready!') || line.includes('Application startup complete') || line.includes('Uvicorn running')) {
            if (state.status === 'starting') {
              state.status = 'running';
              logger.info('langgraph', 'LangGraph server is running', { port: PORT, pid: child.pid });
            }
          }
        }
      });
    }

    // Handle process exit
    child.on('exit', (code, signal) => {
      const exitInfo = { code, signal, pid: state.pid };
      if (code === 0 || signal === 'SIGTERM' || signal === 'SIGKILL') {
        logger.info('langgraph', 'LangGraph process exited', exitInfo);
        state.status = 'stopped';
      } else {
        logger.error('langgraph', 'LangGraph process crashed', exitInfo);
        state.status = 'crashed';
      }
      state.process = null;
      state.pid = null;
    });

    // Handle spawn errors
    child.on('error', (err) => {
      logger.error('langgraph', 'LangGraph process error', err?.message);
      state.status = 'error';
      state.process = null;
      state.pid = null;
    });

    return true;
  } catch (err) {
    logger.error('langgraph', 'Failed to spawn LangGraph process', err?.message);
    state.status = 'error';
    return false;
  }
}

// ---------------------------------------------------------------------------
// Clean shutdown (BACK-04)
// ---------------------------------------------------------------------------

/**
 * Stop the LangGraph process gracefully.
 * Sends SIGTERM first, then SIGKILL after timeout.
 */
async function stop() {
  const child = state.process;

  if (!child) {
    logger.info('langgraph', 'No LangGraph process to stop');
    state.status = 'stopped';
    return;
  }

  const pid = state.pid;
  logger.info('langgraph', 'Stopping LangGraph process', { pid });

  return new Promise((resolve) => {
    let resolved = false;
    let forceKillTimer = null;

    const finish = (method) => {
      if (resolved) return;
      resolved = true;
      if (forceKillTimer) clearTimeout(forceKillTimer);
      state.process = null;
      state.pid = null;
      state.status = 'stopped';
      logger.info('langgraph', `LangGraph process stopped (${method})`, { pid });
      resolve();
    };

    // Listen for the process to exit
    child.once('exit', () => finish('graceful'));

    // 1. Send SIGTERM
    try {
      child.kill('SIGTERM');
    } catch {
      // Process may already be gone
      finish('already-exited');
      return;
    }

    // Also try to kill the process group to avoid orphans
    if (pid) {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        // Process group kill may fail if process is not a group leader or already gone
      }
    }

    // 2. Set up SIGKILL escalation after timeout
    forceKillTimer = setTimeout(() => {
      if (resolved) return;
      logger.warn('langgraph', 'Graceful shutdown timed out, sending SIGKILL', { pid });

      try {
        child.kill('SIGKILL');
      } catch {
        // Already gone
      }

      // Also kill process group
      if (pid) {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          // Already gone
        }
      }

      // Give SIGKILL a moment to take effect
      setTimeout(() => finish('forced'), 500);
    }, SHUTDOWN_TIMEOUT_MS);
  });
}

// ---------------------------------------------------------------------------
// Status and exports
// ---------------------------------------------------------------------------

/**
 * Get a snapshot of the current process state.
 */
function getStatus() {
  return {
    status: state.status,
    port: state.port,
    pid: state.pid,
    uptime: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : null,
    uvPath: state.uvPath,
    backendDir: BACKEND_DIR,
  };
}

/**
 * Get the configured port number.
 */
function getPort() {
  return PORT;
}

module.exports = {
  start,
  stop,
  getStatus,
  getPort,
  BACKEND_URL,
};
