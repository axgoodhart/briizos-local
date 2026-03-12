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
const GATEWAY_PORT = 8001;
const BACKEND_DIR = path.resolve(__dirname, '../../deerflow/backend');
const BACKEND_URL = `http://127.0.0.1:${PORT}`;
const GATEWAY_URL = `http://127.0.0.1:${GATEWAY_PORT}`;
const SHUTDOWN_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const state = {
  process: null,
  gatewayProcess: null,
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
    // Environment variables inherited by the LangGraph child process:
    //   ...process.env spreads the full parent environment, which includes:
    //   - ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY (model providers)
    //   - TAVILY_API_KEY (web_search tool -- optional, tool errors gracefully if missing)
    //   - DEER_FLOW_CONFIG_PATH (set explicitly below to point at briizOS config)
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

    // Spawn the DeerFlow Gateway API server alongside LangGraph (Phase 8)
    try {
      const gatewayArgs = [
        'run', 'python', '-m', 'uvicorn',
        'src.gateway.app:app',
        '--host', '127.0.0.1',
        '--port', String(GATEWAY_PORT),
      ];

      logger.info('langgraph', 'Spawning Gateway process', {
        command: `${uvPath} ${gatewayArgs.join(' ')}`,
        cwd: BACKEND_DIR,
        port: GATEWAY_PORT,
      });

      const gateway = spawn(uvPath, gatewayArgs, {
        cwd: BACKEND_DIR,
        env: {
          ...process.env,
          DEER_FLOW_CONFIG_PATH: path.resolve(__dirname, '../../deerflow/config.yaml'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      state.gatewayProcess = gateway;

      if (gateway.stdout) {
        gateway.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            logger.info('gateway', line.trim());
          }
        });
      }

      if (gateway.stderr) {
        gateway.stderr.on('data', (data) => {
          const lines = data.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            logger.info('gateway', line.trim());
          }
        });
      }

      gateway.on('exit', (code, signal) => {
        logger.info('gateway', 'Gateway process exited', { code, signal });
        state.gatewayProcess = null;
      });

      gateway.on('error', (err) => {
        logger.error('gateway', 'Gateway process error', err?.message);
        state.gatewayProcess = null;
      });
    } catch (gatewayErr) {
      logger.warn('langgraph', 'Failed to spawn Gateway process', gatewayErr?.message);
      // Non-fatal: LangGraph can still work without gateway
    }

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

  // Terminate gateway process (Phase 8)
  const gateway = state.gatewayProcess;
  if (gateway) {
    logger.info('gateway', 'Stopping Gateway process');
    try {
      gateway.kill('SIGTERM');
    } catch {
      // Already gone
    }
    // Schedule SIGKILL escalation for gateway
    setTimeout(() => {
      try { if (state.gatewayProcess) state.gatewayProcess.kill('SIGKILL'); } catch { /* already gone */ }
    }, SHUTDOWN_TIMEOUT_MS);
    state.gatewayProcess = null;
  }

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

/**
 * Send a message to the LangGraph lead agent and stream the response via SSE.
 *
 * Connects to the /threads/{id}/runs/stream endpoint and parses the SSE text
 * protocol manually (Node.js fetch + ReadableStream). Each parsed event is
 * forwarded to the caller through the `onEvent` callback with a normalized
 * type/payload shape.
 *
 * @param {string} threadId - Thread ID (from createThread())
 * @param {string} message  - User message content
 * @param {object} [config={}] - Optional config overrides
 * @param {string} [config.model] - Model name override
 * @param {boolean} [config.thinking] - Enable extended thinking (default: true)
 * @param {(type: string, payload: object) => void} onEvent - Callback for each SSE event
 * @returns {Promise<void>} Resolves when the stream ends or errors
 */
async function streamMessage(threadId, message, config = {}, onEvent) {
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
        is_plan_mode: config.plan_mode || false,
      },
    },
    stream_mode: ['messages-tuple', 'values'],
  };

  try {
    const res = await fetch(`${BACKEND_URL}/threads/${threadId}/runs/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Stream request failed: ${res.status} ${res.statusText} ${errBody}`);
    }

    // Parse the SSE text stream manually
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from the buffer
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const rawData = line.slice(5).trim();
          if (!rawData) continue;

          try {
            const data = JSON.parse(rawData);
            processSSEEvent(currentEvent, data, onEvent);
          } catch (parseErr) {
            logger.warn('langgraph', 'Failed to parse SSE data', { event: currentEvent, error: parseErr?.message });
          }
        }
        // Empty lines are event delimiters — we reset currentEvent after processing
        if (line === '') {
          currentEvent = '';
        }
      }
    }

    // Flush any remaining buffer content
    if (buffer.trim()) {
      const remainingLines = buffer.split('\n');
      for (const line of remainingLines) {
        if (line.startsWith('data:')) {
          const rawData = line.slice(5).trim();
          if (rawData) {
            try {
              const data = JSON.parse(rawData);
              processSSEEvent(currentEvent, data, onEvent);
            } catch {
              // ignore trailing parse errors
            }
          }
        }
      }
    }

    onEvent('end', {});
    logger.info('langgraph', 'Stream completed', { threadId });
  } catch (err) {
    if (err.name === 'AbortError') {
      const msg = `streamMessage timed out after ${AGENT_TIMEOUT_MS}ms`;
      logger.error('langgraph', msg, { threadId });
      onEvent('error', { message: msg });
    } else {
      logger.error('langgraph', 'streamMessage failed', { threadId, error: err?.message });
      onEvent('error', { message: err?.message || 'Stream failed' });
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Process a single SSE event and translate it into the normalized callback format.
 *
 * @param {string} eventType - The SSE event type (messages, values, end, error)
 * @param {*} data - Parsed JSON payload
 * @param {(type: string, payload: object) => void} onEvent - Callback
 */
function processSSEEvent(eventType, data, onEvent) {
  if (eventType === 'messages') {
    // data is a [messageObj, metadata] tuple
    if (!Array.isArray(data) || data.length < 1) return;

    const msg = data[0];
    const msgType = msg?.type;

    if (msgType === 'ai' || msgType === 'AIMessageChunk') {
      // Extract text content from AI message
      const content = msg.content;
      if (typeof content === 'string' && content.length > 0) {
        onEvent('text', { content });
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            onEvent('text', { content: block.text });
          }
        }
      }

      // Check for tool calls in the AI message
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          onEvent('tool_call_start', {
            id: tc.id,
            name: tc.name,
            args: tc.args || {},
          });
        }
      }
    } else if (msgType === 'tool' || msgType === 'ToolMessage') {
      // Check if this is a tool_confirmation message from ToolConfirmationMiddleware
      if (_isToolConfirmation(msg.content)) {
        try {
          const payload = JSON.parse(msg.content);
          onEvent('tool_confirmation', {
            tool_name: payload.tool_name,
            tool_call_id: payload.tool_call_id,
            args: payload.args || {},
            summary: payload.summary || payload.tool_name,
          });
        } catch {
          // If parse fails, treat as normal tool result
          onEvent('tool_result', {
            tool_call_id: msg.tool_call_id,
            name: msg.name,
            content: msg.content,
          });
        }
      } else {
        onEvent('tool_result', {
          tool_call_id: msg.tool_call_id,
          name: msg.name,
          content: msg.content,
        });
      }
    }
  } else if (eventType === 'values') {
    onEvent('values', { messages: data?.messages || [] });
  } else if (eventType === 'end') {
    // Stream end is handled after the read loop completes
  } else if (eventType === 'error') {
    onEvent('error', { message: typeof data === 'string' ? data : JSON.stringify(data) });
  }
}

/**
 * Check if a ToolMessage content string is a tool_confirmation payload
 * from the ToolConfirmationMiddleware.
 */
function _isToolConfirmation(content) {
  if (typeof content !== 'string') return false;
  try {
    const parsed = JSON.parse(content);
    return parsed && parsed.type === 'tool_confirmation';
  } catch {
    return false;
  }
}

/**
 * Resume a run on the same thread after a tool confirmation interruption.
 *
 * Since ToolConfirmationMiddleware uses Command(goto=END), the run terminates.
 * To "resume", we send a new human message on the same thread indicating
 * the user's decision. The agent will see the previous tool_confirmation
 * ToolMessage in context and the new user approval/rejection.
 *
 * @param {string} threadId - Thread ID to resume on
 * @param {object} response - { approved: boolean, summary: string }
 * @param {object} [config={}] - Config overrides (model, thinking)
 * @param {(type: string, payload: object) => void} onEvent - Callback for SSE events
 * @returns {Promise<void>}
 */
async function resumeRun(threadId, response, config = {}, onEvent) {
  const message = response.approved
    ? `[Tool Approved] The user approved the tool operation: ${response.summary || 'confirmed'}. Please proceed with executing it.`
    : `[Tool Rejected] The user rejected the tool operation: ${response.summary || 'denied'}. Do NOT execute this tool. Explain what you were trying to do and ask how to proceed.`;

  return streamMessage(threadId, message, config, onEvent);
}

// ---------------------------------------------------------------------------
// Suggestion generation (CHAT-04)
// ---------------------------------------------------------------------------

/**
 * Fetch follow-up suggestions based on recent conversation messages.
 * Creates a temporary thread to avoid polluting the main conversation.
 *
 * @param {Array<{role: string, content: string}>} recentMessages - Last few messages
 * @param {number} n - Number of suggestions (default 3)
 * @returns {Promise<string[]>} Array of suggestion strings
 */
async function fetchSuggestions(recentMessages, n = 3) {
  try {
    // Format conversation for the prompt
    const conversation = recentMessages
      .map(m => {
        const role = m.role === 'user' || m.role === 'human' ? 'User' : 'Assistant';
        return `${role}: ${m.content}`;
      })
      .join('\n');

    if (!conversation.trim()) return [];

    const prompt = (
      `You are generating follow-up questions to help the user continue the conversation.\n` +
      `Based on the conversation below, produce EXACTLY ${n} short questions the user might ask next.\n` +
      `Requirements:\n` +
      `- Questions must be relevant to the conversation.\n` +
      `- Keep each question concise (ideally <= 20 words).\n` +
      `- Do NOT include numbering, markdown, or any extra text.\n` +
      `- Output MUST be a JSON array of strings only.\n\n` +
      `Conversation:\n${conversation}\n`
    );

    // Create a temporary thread
    const threadRes = await fetch(`${BACKEND_URL}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!threadRes.ok) {
      logger.warn('langgraph', 'Failed to create suggestions thread');
      return [];
    }
    const thread = await threadRes.json();
    const tempThreadId = thread.thread_id;

    // Send the suggestion prompt via /runs/wait (synchronous)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const runRes = await fetch(`${BACKEND_URL}/threads/${tempThreadId}/runs/wait`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistant_id: 'lead_agent',
        input: {
          messages: [{ role: 'human', content: prompt }],
        },
        config: {
          configurable: {
            thinking_enabled: false,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!runRes.ok) {
      logger.warn('langgraph', 'Suggestions run failed', { status: runRes.status });
      return [];
    }

    const result = await runRes.json();

    // Extract the assistant's response text from the run result
    const messages = result?.messages || result?.values?.messages || [];
    const lastAI = [...messages].reverse().find(m => m.type === 'ai' || m.role === 'assistant');
    const raw = typeof lastAI?.content === 'string' ? lastAI.content : (lastAI?.content?.[0]?.text || '');

    // Parse JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(s => typeof s === 'string' && s.trim())
      .map(s => s.trim())
      .slice(0, n);
  } catch (err) {
    logger.warn('langgraph', 'fetchSuggestions failed', { error: err?.message });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Memory API helpers (Phase 8 — MEMO-01/MEMO-02/MEMO-03)
// ---------------------------------------------------------------------------

const fs = require('fs');

/**
 * Resolve the path to the DeerFlow memory.json file.
 * Reads storage_path from config.yaml, defaults to .deer-flow/memory.json
 * relative to BACKEND_DIR.
 */
function _resolveMemoryFilePath() {
  // Default: BACKEND_DIR/.deer-flow/memory.json
  // The config.yaml storage_path is "memory.json" which DeerFlow resolves
  // relative to base_dir (cwd/.deer-flow in local dev).
  return path.join(BACKEND_DIR, '.deer-flow', 'memory.json');
}

/**
 * Fetch memory status (config + data) from the DeerFlow gateway API.
 * Returns parsed JSON with both config and memory data, or null on error.
 */
async function fetchMemory() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${GATEWAY_URL}/api/memory/status`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      logger.warn('memory', 'fetchMemory failed', { status: res.status });
      return null;
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.warn('memory', 'fetchMemory timed out');
    } else {
      logger.warn('memory', 'fetchMemory error', { error: err?.message });
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Delete a fact from memory by its ID.
 * Since the gateway has no delete-fact endpoint, this:
 *   1. Fetches current memory via GET /api/memory
 *   2. Filters out the fact with matching id
 *   3. Writes the updated memory.json via Node.js fs
 *   4. Calls POST /api/memory/reload to refresh the gateway cache
 *
 * @param {string} factId - The fact ID to remove
 * @returns {Promise<{success: boolean}>}
 */
async function deleteFact(factId) {
  try {
    // 1. Fetch current memory data from gateway
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let memoryData;
    try {
      const res = await fetch(`${GATEWAY_URL}/api/memory`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        logger.warn('memory', 'deleteFact: failed to fetch memory', { status: res.status });
        return { success: false };
      }
      memoryData = await res.json();
    } finally {
      clearTimeout(timeout);
    }

    // 2. Filter out the fact
    const originalCount = (memoryData.facts || []).length;
    memoryData.facts = (memoryData.facts || []).filter(f => f.id !== factId);

    if (memoryData.facts.length === originalCount) {
      logger.warn('memory', 'deleteFact: fact not found', { factId });
      return { success: false };
    }

    // 3. Write updated memory.json
    const memoryFilePath = _resolveMemoryFilePath();
    fs.writeFileSync(memoryFilePath, JSON.stringify(memoryData, null, 2), 'utf8');
    logger.info('memory', 'deleteFact: wrote updated memory.json', { factId, remaining: memoryData.facts.length });

    // 4. Reload gateway cache
    try {
      const reloadCtrl = new AbortController();
      const reloadTimeout = setTimeout(() => reloadCtrl.abort(), 5000);
      await fetch(`${GATEWAY_URL}/api/memory/reload`, {
        method: 'POST',
        signal: reloadCtrl.signal,
      });
      clearTimeout(reloadTimeout);
    } catch {
      // Non-fatal — gateway will pick up changes on next read
      logger.warn('memory', 'deleteFact: reload request failed (non-fatal)');
    }

    return { success: true };
  } catch (err) {
    logger.error('memory', 'deleteFact failed', { factId, error: err?.message });
    return { success: false };
  }
}

module.exports = {
  start,
  stop,
  getStatus,
  getPort,
  createThread,
  sendMessage,
  streamMessage,
  resumeRun,
  fetchSuggestions,
  fetchMemory,
  deleteFact,
  BACKEND_URL,
};
