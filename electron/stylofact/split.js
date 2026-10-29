const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// ==== SPLIT ====
const DEFAULT_ADDRESS = 'http://localhost:9002';
const SETTING_KEY = 'stylofact_split';
const START_TIMEOUT_MS = 240000;   // a first start after a new export rebuilds Split's index
const POLL_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;
const LIKELY_FOLDERS = ['Documents/Cufolio/Split', 'Documents/Split', 'Split', 'Developer/Split'];

class SplitClient {
  constructor({ service, logger }) {
    this.service = service;
    this.logger = logger;
    this.child = null;
    this.starting = null;
    this.lastStatus = null;
  }

  settings() {
    const saved = this.service.getSetting(SETTING_KEY)?.value || {};
    return {
      folder: saved.folder || null,
      address: (saved.address || DEFAULT_ADDRESS).replace(/\/+$/, ''),
      autoStart: saved.autoStart !== false,
    };
  }

  saveSettings(patch = {}) {
    const next = { ...this.settings(), ...patch };
    if (next.folder && !fs.existsSync(path.join(next.folder, 'server.js'))) {
      const error = new Error('That folder has no server.js in it, so it is not the Split folder.');
      error.code = 'INVALID_INPUT';
      throw error;
    }
    this.service.setSetting(SETTING_KEY, next);
    this.logger.info('stylofact.split', 'Split connection settings were saved.', { folder: next.folder, address: next.address, autoStart: next.autoStart });
    return this.settings();
  }

  detectFolder() {
    const home = os.homedir();
    for (const relative of LIKELY_FOLDERS) {
      const folder = path.join(home, relative);
      if (fs.existsSync(path.join(folder, 'server.js')) && fs.existsSync(path.join(folder, 'build-search-cache.js'))) return folder;
    }
    return null;
  }

  async request(pathname, { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    const { address } = this.settings();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${address}${pathname}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(payload?.error?.message || `Split answered with HTTP ${response.status}.`);
        error.code = payload?.error?.code || `HTTP_${response.status}`;
        error.status = response.status;
        throw error;
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  // Never throws: an unreachable Split is a status, not a failure.
  async status({ quiet = false } = {}) {
    const settings = this.settings();
    const base = { ...settings, startedByBriizOS: !!this.child, starting: !!this.starting, detectedFolder: settings.folder || this.detectFolder() };
    try {
      const payload = await this.request('/api/historybot/status', { timeoutMs: 4000 });
      this.lastStatus = {
        ...base,
        reachable: true,
        ready: !!payload.ready,
        messageSearch: !!payload.messageSearch,
        metaSchemaVersion: payload.metaSchemaVersion || null,
        cacheBuiltAt: payload.cacheBuiltAt || null,
        sourceRange: payload.sourceRange || null,
        stats: payload.stats || null,
      };
    } catch (error) {
      const starting = !!this.starting;
      const rebuilding = error.status === 503;
      this.lastStatus = { ...base, reachable: rebuilding, ready: false, messageSearch: false, rebuilding, reason: starting ? 'Split is starting.' : rebuilding ? 'Split is rebuilding its index.' : 'Split is not running.' };
      if (!quiet && !starting) this.logger.info('stylofact.split', `Split was checked at ${settings.address} and is not answering yet.`, { reason: error.message, folder: base.detectedFolder });
    }
    return this.lastStatus;
  }

  async ensureRunning() {
    const current = await this.status({ quiet: true });
    if (current.ready && current.messageSearch) return current;
    if (current.reachable && current.ready && !current.messageSearch) {
      const error = new Error('Split is running, but an older copy without message search. Stop it, update the Split folder, and start it again.');
      error.code = 'SPLIT_OUTDATED';
      throw error;
    }
    if (this.starting) return this.starting;
    if (current.reachable && !current.ready) return this.waitUntilReady('Split is rebuilding its index');
    const settings = this.settings();
    if (!settings.autoStart) {
      const error = new Error(`Split is not running at ${settings.address}. Start it, or turn on “Start Split when needed” in the panel.`);
      error.code = 'SPLIT_NOT_RUNNING';
      throw error;
    }
    const folder = settings.folder || this.detectFolder();
    if (!folder) {
      const error = new Error('briizOS could not find the Split folder. Choose it in the panel (the folder holding server.js).');
      error.code = 'SPLIT_FOLDER_UNKNOWN';
      throw error;
    }
    return this.start(folder);
  }

  start(folder) {
    if (this.starting) return this.starting;
    this.logger.info('stylofact.split', 'Starting Split so Stylofact can search your ChatGPT history. Its first start after a new export rebuilds the index, which can take a minute or two.', { folder, address: this.settings().address });
    const child = spawn(process.execPath, ['server.js'], {
      cwd: folder,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.child = child;
    const relay = (stream, level) => {
      let buffer = '';
      stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) if (line.trim()) this.logger[level]('stylofact.split', `Split: ${line.trim()}`, { folder }, { remember: level !== 'debug' });
      });
    };
    relay(child.stdout, 'info');
    relay(child.stderr, 'warn');
    child.on('exit', (code, signal) => {
      this.logger[code === 0 || signal ? 'info' : 'warn']('stylofact.split', `Split stopped${code != null ? ` with exit code ${code}` : ''}${signal ? ` (${signal})` : ''}.`, { folder });
      if (this.child === child) this.child = null;
    });
    child.on('error', (error) => {
      this.logger.error('stylofact.split', 'Split could not be started.', { folder, reason: error.message });
      if (this.child === child) this.child = null;
    });
    this.starting = this.waitUntilReady('Split is starting').finally(() => { this.starting = null; });
    return this.starting;
  }

  async waitUntilReady(label) {
    const begun = Date.now();
    let lastReport = 0;
    while (Date.now() - begun < START_TIMEOUT_MS) {
      const current = await this.status({ quiet: true });
      if (current.ready && current.messageSearch) {
        this.logger.info('stylofact.split', `Split is ready: ${current.stats?.messages?.toLocaleString() || 'its'} messages across ${current.stats?.conversations?.toLocaleString() || 'your'} conversations can be searched.`, {
          seconds: Math.round((Date.now() - begun) / 1000), cacheBuiltAt: current.cacheBuiltAt,
        });
        return current;
      }
      if (current.ready && !current.messageSearch) {
        const error = new Error('Split started, but it is an older copy without message search. Update the Split folder and start it again.');
        error.code = 'SPLIT_OUTDATED';
        throw error;
      }
      if (this.child === null && !current.reachable && Date.now() - begun > 5000 && label === 'Split is starting') {
        const error = new Error('Split stopped before it was ready. Its own log lines above say why.');
        error.code = 'SPLIT_EXITED';
        throw error;
      }
      if (Date.now() - lastReport > 15000) {
        lastReport = Date.now();
        this.logger.info('stylofact.split', `${label}… still waiting after ${Math.round((Date.now() - begun) / 1000)} seconds.`, {});
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
    const error = new Error('Split did not become ready within four minutes.');
    error.code = 'SPLIT_TIMEOUT';
    throw error;
  }

  async search(input) {
    await this.ensureRunning();
    const started = Date.now();
    const result = await this.request('/api/messages/search', { method: 'POST', body: input });
    this.logger.info('stylofact.split', `Your history was searched for ${result.query.queries.length} phrasing${result.query.queries.length === 1 ? '' : 's'}: ${result.meta.totalMatches.toLocaleString()} of your messages matched, ${result.meta.returned} returned.`, {
      phrasings: result.query.queries, role: result.query.role, from: result.query.from, to: result.query.to, totalMatches: result.meta.totalMatches, returned: result.meta.returned, ms: Date.now() - started,
    });
    return result;
  }

  async context(input) {
    await this.ensureRunning();
    const params = new URLSearchParams({ conversation: String(input.conversation), index: String(input.index), before: String(input.before ?? 1), after: String(input.after ?? 1) });
    const result = await this.request(`/api/messages/context?${params}`);
    this.logger.info('stylofact.split', `A message from “${result.title || 'an untitled conversation'}” was read in context.`, { conversation: input.conversation, index: input.index, neighbours: result.messages.length - 1 });
    return result;
  }

  stop() {
    if (!this.child) return false;
    this.logger.info('stylofact.split', 'Stopping the Split server that briizOS started.', {});
    this.child.kill();
    this.child = null;
    return true;
  }
}

module.exports = { SplitClient, DEFAULT_ADDRESS, SETTING_KEY };
