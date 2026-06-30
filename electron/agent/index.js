/**
 * In-process agent runtime — public API.
 *
 * Runtime-compatible replacement for the former external agent process. Same function
 * names + signatures so electron/main.js IPC handlers and preload.js
 * keep working unchanged. Zero Python in the runtime path; no HTTP
 * tool-bridge; no `uv run langgraph dev`; no uvicorn gateway.
 *
 * Lifecycle:
 *   - start() / stop() are now trivial (nothing to spawn). They remain
 *     for API parity with main.js's startup hooks.
 *   - getStatus() always reports 'running' once start() has been called,
 *     so useChat.checkConfig() resolves cleanly.
 *
 * Threading:
 *   - createThread() returns a fresh thread_id; multi-turn context is
 *     persisted by the configured in-process LangGraph checkpointer.
 *
 * Streaming:
 *   - streamMessage / resumeRun forward each agent SSE-shaped event to
 *     onEvent(type, payload). main.js wraps onEvent so the renderer
 *     receives them on the existing 'langgraph-stream-event' channel —
 *     useChat needs no change.
 */

const crypto = require('crypto');
const { logger } = require('../logger');
const bridge = require('./bridge');
const leadAgent = require('./lead-agent');
const { getCheckpointerStatus } = require('./checkpointer');

const state = {
  status: 'idle',
  startedAt: null,
};

function setMainWindow(win) {
  bridge.setMainWindow(win);
}

function setLocalDataService(service) {
  leadAgent.setLocalDataService(service);
}

async function start() {
  state.status = 'running';
  state.startedAt = Date.now();
  logger.info('agent', 'In-process lead_agent runtime ready (no Python subprocess)');
  return true;
}

function stop() {
  state.status = 'stopped';
  leadAgent.resetCache();
  logger.info('agent', 'In-process agent runtime stopped');
}

function getStatus() {
  return {
    status: state.status,
    ready: state.status === 'running',
    port: null,
    pid: process.pid,
    uptime: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : null,
    inProcess: true,
    checkpointer: getCheckpointerStatus(),
  };
}

async function createThread() {
  return crypto.randomUUID();
}

async function streamMessage(threadId, message, config, onEvent) {
  if (typeof onEvent !== 'function') onEvent = () => {};
  return leadAgent.streamTurn({ threadId, message, config: config || {}, onEvent });
}

async function resumeRun(threadId, response, config, onEvent) {
  if (typeof onEvent !== 'function') onEvent = () => {};
  return leadAgent.resumeTurn({ threadId, response: response || {}, config: config || {}, onEvent });
}

async function sendMessage(threadId, message, config) {
  return leadAgent.sendTurn({ threadId, message, config: config || {} });
}

async function fetchSuggestions(recentMessages, n = 3, config = {}, threadId = null) {
  return leadAgent.generateSuggestions({
    threadId,
    recentMessages: recentMessages || [],
    n,
    config: config || {},
  });
}

module.exports = {
  setMainWindow,
  setLocalDataService,
  start,
  stop,
  getStatus,
  createThread,
  streamMessage,
  resumeRun,
  sendMessage,
  fetchSuggestions,
};
