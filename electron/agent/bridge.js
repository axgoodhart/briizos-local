/**
 * In-process renderer tool bridge.
 *
 * The agent runs in the Electron main process; the briizOS tool registry
 * (src/lib/tools.js, executed via ToolContext.executeTool) lives in the
 * renderer because it owns the layoutHook, the live appContext, and the
 * Firestore client. To reach it we use direct IPC — webContents.send to
 * the renderer's existing 'tool-bridge-execute' handler, and a one-shot
 * listener on 'tool-bridge-result'.
 *
 * No HTTP server, no localhost socket, no port 2025. The agent is part
 * of the app; it does not call into it from outside.
 *
 * The __briizosThreadId gate (set on the renderer by useToolBridge) lets
 * the renderer resolve per-surface policy. We forward thread_id explicitly
 * so the gate fails closed when context is missing.
 */

const { ipcMain } = require('electron');
const { logger } = require('../logger');

let mainWindow = null;
let requestCounter = 0;
const pending = new Map();
let ipcListenerRegistered = false;

function setMainWindow(win) {
  mainWindow = win;
}

function ensureListener() {
  if (ipcListenerRegistered) return;
  ipcMain.on('tool-bridge-result', (_event, { requestId, result, error }) => {
    const entry = pending.get(requestId);
    if (!entry) return;
    clearTimeout(entry.timeout);
    pending.delete(requestId);
    if (error) entry.reject(new Error(error));
    else entry.resolve(result);
  });
  ipcListenerRegistered = true;
}

/**
 * Invoke a renderer-side tool by name, awaiting the registry handler.
 *
 * @param {string} toolName  Key in src/lib/tools.js registry (e.g. 'createNotePanel').
 * @param {object} params    Parameters as the registry expects.
 * @param {string|null} threadId  LangGraph thread_id, surfaces to the policy gate.
 * @param {number} timeoutMs Cap on how long to wait for the renderer (default 60s).
 */
function callRendererTool(toolName, params = {}, threadId = null, timeoutMs = 60000) {
  ensureListener();

  if (!mainWindow || mainWindow.isDestroyed()) {
    return Promise.reject(new Error('briizOS renderer not available for tool execution'));
  }

  const requestId = ++requestCounter;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Tool execution timed out after ${timeoutMs}ms: ${toolName}`));
    }, timeoutMs);

    pending.set(requestId, { resolve, reject, timeout });

    logger.debug('agent.bridge', `→ renderer tool: ${toolName}`, { requestId, threadId });
    mainWindow.webContents.send('tool-bridge-execute', {
      requestId,
      toolName,
      params,
      threadId,
    });
  });
}

module.exports = { callRendererTool, setMainWindow };
