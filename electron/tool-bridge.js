/**
 * briizOS Tool Bridge Server
 *
 * Lightweight HTTP server running in the Electron main process that exposes
 * briizOS tool operations to the LangGraph Python process. Tool requests
 * arrive via HTTP POST, get relayed to the renderer via IPC (where the
 * existing tool registry lives), and results are returned to Python.
 *
 * Flow: Python -> HTTP POST /tools/{toolName} -> IPC to renderer ->
 *       renderer executes tool -> IPC result back -> HTTP response to Python
 */

const http = require('http');
const { ipcMain } = require('electron');
const { logger } = require('./logger');

const TOOL_BRIDGE_PORT = 2025;

let mainWindow = null;
let server = null;
let pendingRequests = new Map();
let requestCounter = 0;

/**
 * Set the main BrowserWindow reference so IPC messages can be sent to the renderer.
 */
function setMainWindow(win) {
  mainWindow = win;
}

/**
 * Start the HTTP tool bridge server on port 2025 (localhost only).
 */
function start() {
  if (server) {
    logger.warn('tool-bridge', 'Server already running');
    return server;
  }

  // Register IPC handler for renderer to return tool execution results
  ipcMain.on('tool-bridge-result', (_event, { requestId, result, error }) => {
    const pending = pendingRequests.get(requestId);
    if (!pending) {
      logger.warn('tool-bridge', 'Received result for unknown request', { requestId });
      return;
    }

    clearTimeout(pending.timeout);
    pendingRequests.delete(requestId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  });

  server = http.createServer(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Parse /tools/{toolName}
    const match = req.url.match(/^\/tools\/(.+)$/);
    if (!match) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found. Use POST /tools/{toolName}' }));
      return;
    }
    const toolName = decodeURIComponent(match[1]);

    // Check that the renderer window is available
    if (!mainWindow || mainWindow.isDestroyed()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'briizOS renderer not available' }));
      return;
    }

    // Read JSON body
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = JSON.parse(body || '{}');
        const requestId = ++requestCounter;

        logger.info('tool-bridge', `Tool request: ${toolName}`, { requestId, params });

        // Send to renderer and wait for response via IPC
        const result = await new Promise((resolve, reject) => {
          const timeoutHandle = setTimeout(() => {
            pendingRequests.delete(requestId);
            reject(new Error(`Tool execution timed out after 30s: ${toolName}`));
          }, 30000);

          pendingRequests.set(requestId, { resolve, reject, timeout: timeoutHandle });
          mainWindow.webContents.send('tool-bridge-execute', { requestId, toolName, params });
        });

        logger.info('tool-bridge', `Tool result: ${toolName}`, { requestId, success: result?.success });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        logger.error('tool-bridge', `Tool error: ${toolName}`, err?.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });

  server.listen(TOOL_BRIDGE_PORT, '127.0.0.1', () => {
    logger.info('tool-bridge', `Tool bridge server listening on 127.0.0.1:${TOOL_BRIDGE_PORT}`);
  });

  server.on('error', (err) => {
    logger.error('tool-bridge', 'Server error', err?.message);
  });

  return server;
}

/**
 * Stop the HTTP tool bridge server and clean up pending requests.
 */
function stop() {
  if (server) {
    // Reject all pending requests
    for (const [id, pending] of pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Tool bridge shutting down'));
    }
    pendingRequests.clear();

    server.close(() => {
      logger.info('tool-bridge', 'Tool bridge server stopped');
    });
    server = null;
  }
}

module.exports = { start, stop, setMainWindow, TOOL_BRIDGE_PORT };
