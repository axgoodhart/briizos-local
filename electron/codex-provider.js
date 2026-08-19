const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { logger } = require('./logger');

const CLIENT_INFO = {
  name: 'briizos',
  title: 'briizOS',
  version: '1.0.0',
};

function executableCandidates() {
  const candidates = [];
  if (process.env.CODEX_BINARY) candidates.push(process.env.CODEX_BINARY);
  for (const directory of String(process.env.PATH || '').split(path.delimiter)) {
    if (directory) candidates.push(path.join(directory, process.platform === 'win32' ? 'codex.exe' : 'codex'));
  }
  if (process.platform !== 'win32') {
    const versionsRoot = path.join(os.homedir(), '.nvm', 'versions', 'node');
    try {
      const versions = fs.readdirSync(versionsRoot).sort().reverse();
      versions.forEach((version) => candidates.push(path.join(versionsRoot, version, 'bin', 'codex')));
    } catch {
      // nvm is optional.
    }
    candidates.push('/opt/homebrew/bin/codex', '/usr/local/bin/codex');
  }
  return [...new Set(candidates)];
}

function resolveCodexBinary() {
  return executableCandidates().find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }) || null;
}

class CodexProvider extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.readyPromise = null;
    this.pending = new Map();
    this.turns = new Map();
    this.nextRequestId = 1;
    this.localDataService = null;
    this.workspaceRoot = path.resolve(__dirname, '..');
  }

  setLocalDataService(service) {
    this.localDataService = service;
  }

  async ensureStarted() {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = this._start().catch((error) => {
      this.readyPromise = null;
      throw error;
    });
    return this.readyPromise;
  }

  async _start() {
    const binary = resolveCodexBinary();
    if (!binary) {
      const error = new Error('Codex is not installed. Install the Codex CLI before connecting a ChatGPT subscription.');
      error.code = 'CODEX_NOT_INSTALLED';
      throw error;
    }

    this.process = spawn(binary, ['app-server', '--stdio'], {
      cwd: this.workspaceRoot,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.process.once('error', (error) => this._handleProcessError(error));
    this.process.once('exit', (code, signal) => this._handleExit(code, signal));
    this.process.stderr.on('data', (chunk) => {
      const message = String(chunk || '').trim();
      if (message) logger.debug('codex', message);
    });

    const lines = readline.createInterface({ input: this.process.stdout });
    lines.on('line', (line) => this._handleLine(line));

    await this.request('initialize', {
      clientInfo: CLIENT_INFO,
      capabilities: {
        experimentalApi: false,
        requestAttestation: false,
      },
    });
    this.notify('initialized');
    logger.info('codex', 'The local Codex provider initialized. No subscription inference request has been sent.');
    return true;
  }

  _handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      logger.warn('codex', 'Codex returned a response that briizOS could not parse.');
      return;
    }

    if (message.id != null && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (message.error) pending.reject(new Error(message.error.message || 'Codex request failed'));
      else pending.resolve(message.result);
      return;
    }

    if (message.method === 'account/updated' || message.method === 'account/login/completed') {
      this.emit('auth-changed', message.params || {});
    }
    this._handleTurnNotification(message);
  }

  _handleTurnNotification(message) {
    const params = message.params || {};
    const turnId = params.turnId || params.turn?.id;
    if (!turnId || !this.turns.has(turnId)) return;
    const turn = this.turns.get(turnId);

    if (message.method === 'item/agentMessage/delta' && params.delta) {
      turn.onEvent('text', { content: params.delta });
      turn.content += params.delta;
      return;
    }
    if (message.method === 'error' && params.willRetry === false) {
      this.turns.delete(turnId);
      const error = new Error(params.error?.message || 'Codex stopped the turn.');
      this._appendAudit(turn, 'turn_error', 'failed', {
        error: { message: error.message, details: params.error || null },
      });
      turn.reject(error);
      return;
    }
    if (message.method === 'turn/completed') {
      this.turns.delete(turnId);
      if (params.turn?.status === 'failed') {
        const error = new Error(params.turn.error?.message || 'Codex failed to complete the turn.');
        this._appendAudit(turn, 'turn_error', 'failed', {
          error: { message: error.message, details: params.turn.error || null },
          response: params.turn,
        });
        turn.reject(error);
        return;
      }
      if (!turn.content) {
        const finalMessage = [...(params.turn?.items || [])]
          .reverse()
          .find((item) => item?.type === 'agentMessage' && item.text)?.text || '';
        if (finalMessage) {
          turn.content = finalMessage;
          turn.onEvent('text', { content: finalMessage });
        }
      }
      turn.onEvent('end', { content: turn.content, provider: 'codex' });
      this._appendAudit(turn, 'model_response', params.turn?.status || 'completed', {
        response: params.turn,
      });
      turn.resolve({ turnId: turn.auditTurnId, providerTurnId: turnId, outcome: params.turn?.status || 'completed', content: turn.content });
    }
  }

  _appendAudit(turn, eventType, outcome, extra = {}, { required = false } = {}) {
    if (!this.localDataService?.appendAiTurnAuditEvent) return null;
    try {
      return this.localDataService.appendAiTurnAuditEvent({
        threadId: turn.localThreadId,
        turnId: turn.auditTurnId,
        invocationId: turn.providerTurnId || null,
        eventType,
        turnKind: turn.config?.permission_policy?.surface === 'suggestions' ? 'suggestion' : 'chat',
        turnLabel: turn.config?.audit_label || null,
        provider: 'codex',
        model: 'codex-subscription',
        modality: turn.config?.modality || null,
        outcome,
        effectiveConfig: {
          provider: 'codex',
          adapter: 'openai_codex:AppServer',
          authentication: 'chatgpt_subscription',
          sandbox: 'read-only',
          approvalPolicy: 'never',
        },
        permissionPolicy: turn.config?.permission_policy || null,
        request: extra.request ?? null,
        response: extra.response ?? null,
        error: extra.error ?? null,
        tokenUsage: extra.tokenUsage ?? null,
      });
    } catch (error) {
      logger.error('codex.audit', 'The Codex request record could not be written to the local database.', {
        eventType,
        error: error.message,
      });
      if (required) throw error;
      return null;
    }
  }

  _handleProcessError(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
    this.process = null;
    this.readyPromise = null;
  }

  _handleExit(code, signal) {
    const error = new Error(`Codex app-server stopped${code != null ? ` with code ${code}` : ''}${signal ? ` (${signal})` : ''}.`);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    for (const turn of this.turns.values()) turn.reject(error);
    this.pending.clear();
    this.turns.clear();
    this.process = null;
    this.readyPromise = null;
    this.emit('auth-changed', { authMode: null });
  }

  request(method, params = {}) {
    if (!this.process?.stdin?.writable) return Promise.reject(new Error('Codex app-server is not available.'));
    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex did not answer ${method} within 20 seconds.`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timeout });
      this.process.stdin.write(`${JSON.stringify({ method, id, params })}\n`, (error) => {
        if (!error) return;
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  notify(method, params = undefined) {
    if (!this.process?.stdin?.writable) return;
    const message = params === undefined ? { method } : { method, params };
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async getAuthStatus({ refresh = false } = {}) {
    try {
      await this.ensureStarted();
      const result = await this.request('account/read', { refreshToken: !!refresh });
      const account = result?.account || null;
      return {
        installed: true,
        connected: account?.type === 'chatgpt',
        authMode: account?.type || null,
        email: account?.type === 'chatgpt' ? account.email || null : null,
        planType: account?.type === 'chatgpt' ? account.planType || null : null,
      };
    } catch (error) {
      return {
        installed: error.code !== 'CODEX_NOT_INSTALLED',
        connected: false,
        authMode: null,
        error: error.message,
      };
    }
  }

  async login(openExternal) {
    await this.ensureStarted();
    const result = await this.request('account/login/start', {
      type: 'chatgpt',
      codexStreamlinedLogin: true,
      useHostedLoginSuccessPage: true,
    });
    if (result?.type !== 'chatgpt' || !result.authUrl) {
      throw new Error('Codex did not return a ChatGPT sign-in URL.');
    }
    await openExternal(result.authUrl);
    return { started: true, loginId: result.loginId };
  }

  async logout() {
    await this.ensureStarted();
    await this.request('account/logout', {});
    this.emit('auth-changed', { authMode: null, planType: null });
    return { success: true };
  }

  _storedThreadMap() {
    return this.localDataService?.getSetting?.('codex_thread_map')?.value || {};
  }

  _saveThreadMapping(localThreadId, codexThreadId) {
    if (!this.localDataService) return;
    this.localDataService.setSetting('codex_thread_map', {
      ...this._storedThreadMap(),
      [localThreadId]: codexThreadId,
    });
  }

  async _ensureThread(localThreadId) {
    const storedId = this._storedThreadMap()[localThreadId];
    if (storedId) {
      try {
        const resumed = await this.request('thread/resume', {
          threadId: storedId,
          cwd: this.workspaceRoot,
          runtimeWorkspaceRoots: [this.workspaceRoot],
          approvalPolicy: 'never',
          sandbox: 'read-only',
        });
        if (resumed?.thread?.id) return resumed.thread.id;
      } catch (error) {
        logger.warn('codex', 'A previous Codex conversation could not be resumed; a new one will be started.', { error: error.message });
      }
    }

    const started = await this.request('thread/start', {
      cwd: this.workspaceRoot,
      runtimeWorkspaceRoots: [this.workspaceRoot],
      approvalPolicy: 'never',
      sandbox: 'read-only',
      ephemeral: false,
    });
    const codexThreadId = started?.thread?.id;
    if (!codexThreadId) throw new Error('Codex did not create a conversation.');
    this._saveThreadMapping(localThreadId, codexThreadId);
    return codexThreadId;
  }

  async streamTurn(localThreadId, message, _config, onEvent = () => {}) {
    const config = _config || {};
    const auth = await this.getAuthStatus({ refresh: true });
    if (!auth.connected) throw new Error('Connect a ChatGPT account in Settings before using Codex Subscription.');
    const codexThreadId = await this._ensureThread(localThreadId);
    const auditTurnId = crypto.randomUUID();
    const auditContext = {
      localThreadId,
      auditTurnId,
      providerTurnId: null,
      config,
    };
    this._appendAudit(auditContext, 'turn_started', 'started', {
      request: {
        input: String(message || ''),
        codexThreadId,
        note: 'This text was handed to the local Codex app-server. OAuth credentials are owned by Codex and are not exposed to briizOS.',
      },
    }, { required: true });

    let started;
    try {
      started = await this.request('turn/start', {
        threadId: codexThreadId,
        input: [{ type: 'text', text: String(message || ''), text_elements: [] }],
      });
    } catch (error) {
      this._appendAudit(auditContext, 'turn_error', 'failed_before_provider_turn', {
        error: { message: error.message },
      });
      throw error;
    }
    const turnId = started?.turn?.id;
    if (!turnId) throw new Error('Codex did not start the turn.');

    auditContext.providerTurnId = turnId;
    this._appendAudit(auditContext, 'model_request', 'requested', {
      request: { codexThreadId, providerTurnId: turnId },
    });

    return new Promise((resolve, reject) => {
      this.turns.set(turnId, { ...auditContext, resolve, reject, onEvent, content: '' });
    });
  }

  async stop() {
    if (!this.process) return;
    const child = this.process;
    this.process = null;
    this.readyPromise = null;
    if (child.stdin.writable) child.stdin.end();
    if (!child.killed) child.kill();
  }
}

module.exports = new CodexProvider();
