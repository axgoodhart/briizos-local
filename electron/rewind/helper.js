/**
 * briizy-helper supervisor (PLAN-BRIIZY.md I5, §7).
 *
 * Owns the lifecycle of the native capture/OCR child process: spawn, NDJSON
 * request/response correlation, crash restart with backoff, and a hard kill on
 * shutdown. The helper is never autonomous — it does nothing this module does
 * not explicitly ask for, and it exits when this process goes away.
 *
 * Every state change and every failure is logged (Hard Rule 1 / Hard Rule 3),
 * so the whole native leg of the pipeline is visible in the LogPanel and in
 * `npm run dev:debug` terminal output.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const HELPER_BINARY = path.join(__dirname, '..', 'bin', 'briizy-helper');
const DEFAULT_TIMEOUT_MS = 15000;
const RESTART_BACKOFF_MS = [500, 1000, 2000, 5000, 15000, 30000];
/** Stop restarting after this many consecutive failures; report unavailable. */
const MAX_CONSECUTIVE_FAILURES = 6;

class BriizyHelper extends EventEmitter {
  constructor({ logger, binaryPath = HELPER_BINARY } = {}) {
    super();
    this.logger = logger;
    this.binaryPath = binaryPath;
    this.child = null;
    this.state = 'stopped'; // stopped | starting | ready | unavailable | error
    this.pending = new Map();
    this.nextId = 1;
    this.stdoutBuffer = '';
    this.consecutiveFailures = 0;
    this.restartTimer = null;
    this.stopping = false;
    this.lastError = null;
    this.capabilities = { permission: false, accessibility: false, version: null };
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.helper', message, data);
  }

  _setState(state, detail) {
    if (this.state === state) return;
    this.state = state;
    this._log(state === 'error' || state === 'unavailable' ? 'warn' : 'info',
      `Helper state → ${state}`, detail);
    this.emit('state', { state, detail });
  }

  isAvailable() {
    return fs.existsSync(this.binaryPath);
  }

  start() {
    if (this.child || this.stopping) return;
    if (!this.isAvailable()) {
      this.lastError = 'helper binary not built';
      this._setState('unavailable', {
        binaryPath: this.binaryPath,
        hint: 'run: npm run helper:build',
      });
      return;
    }

    this._setState('starting', { binaryPath: this.binaryPath });
    let child;
    try {
      child = spawn(this.binaryPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        // No shell, no inherited window, and no env passthrough beyond what the
        // process already has. The helper performs no network I/O by design.
        windowsHide: true,
      });
    } catch (error) {
      this.lastError = error?.message || 'spawn failed';
      this.consecutiveFailures += 1;
      this._setState('error', { error: this.lastError });
      this._scheduleRestart();
      return;
    }

    this.child = child;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => this._onStdout(chunk));
    child.stderr.on('data', (chunk) => {
      const text = String(chunk).trim();
      if (text) this._log('debug', 'Helper stderr', text);
    });
    child.on('error', (error) => {
      this.lastError = error?.message || 'helper process error';
      this._log('error', 'Helper process error', { error: this.lastError });
    });
    child.on('exit', (code, signal) => this._onExit(code, signal));
  }

  _onStdout(chunk) {
    this.stdoutBuffer += chunk;
    // Guard against a runaway line (a corrupted stream would otherwise grow
    // this buffer without bound).
    if (this.stdoutBuffer.length > 32 * 1024 * 1024) {
      this._log('error', 'Helper stdout buffer overflow; restarting helper');
      this.stdoutBuffer = '';
      this._kill();
      return;
    }
    let index = this.stdoutBuffer.indexOf('\n');
    while (index !== -1) {
      const line = this.stdoutBuffer.slice(0, index).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(index + 1);
      if (line) this._onLine(line);
      index = this.stdoutBuffer.indexOf('\n');
    }
  }

  _onLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      this._log('warn', 'Unparseable helper output', line.slice(0, 200));
      return;
    }

    if (message.event) {
      if (message.event === 'ready') {
        this.consecutiveFailures = 0;
        this.capabilities = {
          permission: message.permission === true,
          accessibility: message.accessibility === true,
          version: message.version || null,
        };
        this._setState('ready', {
          pid: message.pid,
          version: message.version,
          protocol: message.protocol,
          screenRecording: this.capabilities.permission,
          accessibility: this.capabilities.accessibility,
        });
      } else if (message.event === 'unavailable') {
        this.lastError = message.reason || 'helper unavailable';
        this._setState('unavailable', { reason: this.lastError });
      }
      this.emit('event', message);
      return;
    }

    const pending = message.id != null ? this.pending.get(message.id) : null;
    if (!pending) {
      this._log('debug', 'Unmatched helper response', { id: message.id, ok: message.ok });
      return;
    }
    this.pending.delete(message.id);
    clearTimeout(pending.timer);
    if (message.ok) {
      pending.resolve(message.result || {});
    } else {
      const error = new Error(message.error || 'helper error');
      error.code = message.code || 'HELPER_ERROR';
      pending.reject(error);
    }
  }

  _onExit(code, signal) {
    const wasStopping = this.stopping;
    this.child = null;
    this.stdoutBuffer = '';
    this._rejectAll(new Error(`helper exited (code ${code}, signal ${signal || 'none'})`));

    if (wasStopping) {
      this._setState('stopped', { code, signal });
      return;
    }

    this.consecutiveFailures += 1;
    this._log('warn', 'Helper exited unexpectedly', {
      code,
      signal,
      consecutiveFailures: this.consecutiveFailures,
    });
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      this.lastError = `helper exited ${this.consecutiveFailures} times in a row`;
      this._setState('unavailable', { reason: this.lastError });
      return;
    }
    this._setState('error', { code, signal });
    this._scheduleRestart();
  }

  _scheduleRestart() {
    if (this.stopping || this.restartTimer) return;
    const delay = RESTART_BACKOFF_MS[
      Math.min(this.consecutiveFailures, RESTART_BACKOFF_MS.length - 1)
    ];
    this._log('info', 'Scheduling helper restart', { delayMs: delay });
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.start();
    }, delay);
    this.restartTimer.unref?.();
  }

  _rejectAll(error) {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  /**
   * Send one command and await its response.
   * @param {string} cmd  meta | capture | ocr | ping | shutdown
   */
  request(cmd, params = {}, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (!this.child || this.state === 'unavailable') {
      const error = new Error(
        this.state === 'unavailable'
          ? `briizy helper unavailable: ${this.lastError || 'unknown reason'}`
          : 'briizy helper is not running',
      );
      error.code = 'HELPER_UNAVAILABLE';
      return Promise.reject(error);
    }

    const id = this.nextId++;
    const payload = JSON.stringify({ ...params, id, cmd });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const error = new Error(`helper ${cmd} timed out after ${timeoutMs}ms`);
        error.code = 'HELPER_TIMEOUT';
        this._log('warn', 'Helper request timed out', { cmd, id, timeoutMs });
        reject(error);
        // A timed-out helper is wedged (a stuck Vision or WindowServer call);
        // recycle it rather than leaving every later request to queue behind it.
        this._kill();
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { resolve, reject, timer, cmd });
      try {
        this.child.stdin.write(`${payload}\n`);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  meta(options) {
    return this.request('meta', {}, { timeoutMs: 5000, ...options });
  }

  capture(params, options) {
    return this.request('capture', params, { timeoutMs: 20000, ...options });
  }

  ocr(params, options) {
    return this.request('ocr', params, { timeoutMs: 30000, ...options });
  }

  ping(options) {
    return this.request('ping', {}, { timeoutMs: 3000, ...options });
  }

  _kill() {
    if (!this.child) return;
    const child = this.child;
    try {
      child.stdin.end();
    } catch { /* already closed */ }
    try {
      child.kill('SIGTERM');
    } catch { /* already gone */ }
    // Escalate if the helper ignores SIGTERM (mid-Vision-call, for example).
    const sigkill = setTimeout(() => {
      try {
        if (!child.killed) child.kill('SIGKILL');
      } catch { /* already gone */ }
    }, 2000);
    sigkill.unref?.();
  }

  /** Shut down for good. Idempotent; safe to call from before-quit. */
  stop() {
    this.stopping = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this._rejectAll(new Error('helper stopping'));
    this._kill();
    this._setState('stopped');
  }

  getStatus() {
    return {
      state: this.state,
      available: this.isAvailable(),
      pid: this.child?.pid ?? null,
      lastError: this.lastError,
      consecutiveFailures: this.consecutiveFailures,
      ...this.capabilities,
    };
  }
}

module.exports = { BriizyHelper, HELPER_BINARY };
