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
  status: 'idle',       // idle | starting | running | stopped | crashed | error | env_missing | failed
  port: PORT,
  pid: null,
  startedAt: null,
  uvPath: null,
  healthCheckIntervalId: null,
  restartCount: 0,
  lastRestartAt: null,
  stoppingIntentionally: false,
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
// Health check polling (BACK-02)
// ---------------------------------------------------------------------------

const HEALTH_CHECK_TIMEOUT_MS = 2000;
const HEALTH_POLL_FAST_MS = 2000;   // polling rate while starting / recovering
const HEALTH_POLL_SLOW_MS = 10000;  // polling rate while running (steady state)

/**
 * Send a single HTTP GET to the LangGraph health endpoint.
 * Returns true if the server responds with HTTP 200, false otherwise.
 */
async function checkHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}/ok`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Begin polling the health endpoint.
 * - While status is 'starting': poll every 2 seconds.  On first success transition to 'running'.
 * - While status is 'running': poll every 10 seconds.  On failure transition to 'crashed' and trigger auto-restart.
 */
function startHealthCheckPolling() {
  stopHealthCheckPolling(); // clear any existing interval

  const spawnTime = Date.now();

  const poll = async () => {
    const healthy = await checkHealth();

    if (healthy && state.status === 'starting') {
      // First successful health check — backend is ready
      const startupTime = Date.now() - spawnTime;
      state.status = 'running';
      state.restartCount = 0; // reset on successful start / recovery
      logger.info('langgraph', 'Backend ready', { port: PORT, pid: state.pid, startupTime });

      // Switch to slow polling now that we are healthy
      stopHealthCheckPolling();
      state.healthCheckIntervalId = setInterval(poll, HEALTH_POLL_SLOW_MS);
    } else if (!healthy && state.status === 'running') {
      // Health check failed while supposedly running — crash detected
      logger.warn('langgraph', 'Health check failed while running — treating as crash');
      state.status = 'crashed';
      stopHealthCheckPolling();
      handleCrash();
    }
  };

  // Start with fast polling
  state.healthCheckIntervalId = setInterval(poll, HEALTH_POLL_FAST_MS);

  // Also do an immediate first check
  poll();
}

/**
 * Stop the health-check polling interval.
 */
function stopHealthCheckPolling() {
  if (state.healthCheckIntervalId) {
    clearInterval(state.healthCheckIntervalId);
    state.healthCheckIntervalId = null;
  }
}

// ---------------------------------------------------------------------------
// Auto-restart with exponential backoff (BACK-03)
// ---------------------------------------------------------------------------

const MAX_RESTART_ATTEMPTS = 5;

/**
 * Handle a backend crash by waiting with exponential backoff and restarting.
 * Gives up after MAX_RESTART_ATTEMPTS consecutive failures.
 */
async function handleCrash() {
  if (state.stoppingIntentionally) return;

  if (state.restartCount >= MAX_RESTART_ATTEMPTS) {
    state.status = 'failed';
    logger.error('langgraph', 'Backend failed to restart after max attempts', {
      attempts: state.restartCount,
    });
    return;
  }

  const backoffMs = Math.min(1000 * Math.pow(2, state.restartCount), 30000);
  logger.warn('langgraph', 'Backend crashed, restarting', {
    attempt: state.restartCount + 1,
    backoffMs,
  });

  state.restartCount += 1;
  state.lastRestartAt = Date.now();

  await new Promise((resolve) => setTimeout(resolve, backoffMs));

  // Guard: may have been intentionally stopped during the wait
  if (state.stoppingIntentionally) return;

  const ok = await start();
  if (!ok) {
    // start() itself failed — schedule another attempt
    handleCrash();
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

  state.stoppingIntentionally = false;

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
      env: {
        ...process.env,
        DEER_FLOW_CONFIG_PATH: path.resolve(__dirname, '../../deerflow/config.yaml'),
      },
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
      state.process = null;
      state.pid = null;

      if (state.stoppingIntentionally || code === 0 || signal === 'SIGTERM' || signal === 'SIGKILL') {
        logger.info('langgraph', 'LangGraph process exited', exitInfo);
        state.status = 'stopped';
      } else {
        logger.error('langgraph', 'LangGraph process crashed', exitInfo);
        state.status = 'crashed';
        stopHealthCheckPolling();
        handleCrash();
      }
    });

    // Handle spawn errors
    child.on('error', (err) => {
      logger.error('langgraph', 'LangGraph process error', err?.message);
      state.status = 'error';
      state.process = null;
      state.pid = null;
      stopHealthCheckPolling();
    });

    // Begin health check polling to detect readiness and crashes
    startHealthCheckPolling();

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
  state.stoppingIntentionally = true;
  stopHealthCheckPolling();

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
    ready: state.status === 'running',
    port: state.port,
    pid: state.pid,
    uptime: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : null,
    restartCount: state.restartCount,
    lastRestartAt: state.lastRestartAt,
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

// ---------------------------------------------------------------------------
// Agent invoke helpers (ORCH-01 / ORCH-03)
// ---------------------------------------------------------------------------

const AGENT_TIMEOUT_MS = 120000; // 120 seconds for long agent runs

/**
 * Create a new thread on the LangGraph backend.
 * Returns the thread_id string.
 */
async function createThread() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to create thread: ${res.status} ${res.statusText} ${body}`);
    }

    const data = await res.json();
    const threadId = data.thread_id;
    logger.info('langgraph', 'Thread created', { threadId });
    return threadId;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('createThread timed out');
    }
    logger.error('langgraph', 'Failed to create thread', err?.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send a message to the LangGraph lead agent and wait for the final response.
 *
 * @param {string} threadId - Thread ID (from createThread())
 * @param {string} message  - User message content
 * @param {object} [config={}] - Optional config overrides
 * @param {string} [config.model] - Model name override (e.g. "claude-sonnet-4-6")
 * @param {boolean} [config.thinking] - Enable extended thinking (default: true)
 * @returns {Promise<object>} The final response state from the agent
 */
async function sendMessage(threadId, message, config = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  const body = {
    assistant_id: 'lead_agent',
    input: {
      messages: [{ role: 'human', content: message }],
    },
    config: {
      configurable: {
        model_name: config.model || null,
        thinking_enabled: config.thinking !== false,
      },
    },
  };

  try {
    const res = await fetch(`${BACKEND_URL}/threads/${threadId}/runs/wait`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Agent run failed: ${res.status} ${res.statusText} ${errBody}`);
    }

    const data = await res.json();
    logger.info('langgraph', 'Agent response received', {
      threadId,
      messageCount: data?.messages?.length ?? 0,
    });
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`sendMessage timed out after ${AGENT_TIMEOUT_MS}ms`);
    }
    logger.error('langgraph', 'sendMessage failed', { threadId, error: err?.message });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  start,
  stop,
  getStatus,
  getPort,
  createThread,
  sendMessage,
  BACKEND_URL,
};
