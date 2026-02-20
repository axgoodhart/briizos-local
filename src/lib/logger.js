/**
 * briizOS Renderer Logger
 * Sends structured log messages to the main process terminal via IPC.
 * Queues messages until the preload bridge (window.api) is ready.
 */

let queue = [];
let bridgeReady = false;

function flush() {
  if (!window.api?.logToTerminal) return;
  bridgeReady = true;
  for (const payload of queue) {
    window.api.logToTerminal(payload);
  }
  queue = [];
}

function send(level, category, message, data) {
  const payload = { level, category, message, data };
  if (bridgeReady) {
    window.api.logToTerminal(payload);
  } else {
    queue.push(payload);
    // Try flushing — bridge may have appeared since last call
    if (window.api?.logToTerminal) flush();
  }
}

const logger = {
  debug: (category, message, data) => send('debug', category, message, data),
  info:  (category, message, data) => send('info',  category, message, data),
  warn:  (category, message, data) => send('warn',  category, message, data),
  error: (category, message, data) => send('error', category, message, data),
};

export default logger;
