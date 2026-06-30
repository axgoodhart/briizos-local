const crypto = require('crypto');

const POLL_MS = 15000;
const HEARTBEAT_MS = 60000;
const LEASE_MS = 180000;
const CONTINUITY_IDLE_MS = 5000;
const MAX_CHUNK_BYTES = 380000;
const DOMAINS = ['tasks', 'organizer', 'retainedText'];

function encodeValue(value, key = '') {
  if (value == null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && /At$/.test(key)) return { timestampValue: new Date(value).toISOString() };
  if (typeof value === 'number') return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map((item) => encodeValue(item)) } };
  return { mapValue: { fields: encodeFields(value) } };
}

function encodeFields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item, key)]));
}

function decodeValue(value = {}) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return Date.parse(value.timestampValue);
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue);
  if (value.mapValue) return decodeFields(value.mapValue.fields || {});
  return undefined;
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function splitUtf8(text, maxBytes = MAX_CHUNK_BYTES) {
  const chunks = [];
  let current = '';
  for (const char of text) {
    if (Buffer.byteLength(current + char, 'utf8') > maxBytes) {
      chunks.push(current);
      current = char;
    } else current += char;
  }
  if (current || !chunks.length) chunks.push(current);
  return chunks;
}

class CloudGateway {
  constructor({ service, logger, executeRemoteCommand, appVersion = '1.0.0' }) {
    this.service = service;
    this.logger = logger;
    this.executeRemoteCommand = executeRemoteCommand;
    this.appVersion = appVersion;
    this.session = null;
    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.continuityTimer = null;
    this.primary = false;
    this.processing = new Set();
    this.changeHandler = ({ domains }) => {
      if (domains.some((domain) => DOMAINS.includes(domain))) this.scheduleContinuity();
    };
    service.on('changed', this.changeHandler);
  }

  get status() {
    return { connected: !!this.session, primary: this.primary, device: this.service.getDeviceIdentity() };
  }

  async setSession(session) {
    if (!session?.uid || !session?.idToken || !session?.projectId) throw new Error('Cloud session is incomplete');
    const boundUid = this.service.getAppMeta('cloud_bound_uid');
    if (boundUid && boundUid !== session.uid && !session.confirmRebind) {
      return { requiresRebindConfirmation: true, previousUid: boundUid };
    }
    this.service.setAppMeta('cloud_bound_uid', session.uid);
    this.session = { uid: session.uid, idToken: session.idToken, projectId: session.projectId };
    this.start();
    await this.heartbeat();
    await this.poll();
    this.scheduleContinuity();
    return this.status;
  }

  clearSession() {
    this.stop();
    this.session = null;
    this.primary = false;
    return this.status;
  }

  start() {
    clearInterval(this.pollTimer);
    clearInterval(this.heartbeatTimer);
    this.pollTimer = setInterval(() => this.poll().catch((error) => this.warn('poll', error)), POLL_MS);
    this.heartbeatTimer = setInterval(() => this.heartbeat().catch((error) => this.warn('heartbeat', error)), HEARTBEAT_MS);
  }

  stop() {
    clearInterval(this.pollTimer);
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.continuityTimer);
    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.continuityTimer = null;
  }

  close() {
    this.stop();
    this.service.off('changed', this.changeHandler);
  }

  warn(area, error) {
    this.logger?.warn?.('cloud-gateway', `${area} failed`, { error: error?.message });
  }

  basePath() {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.session.projectId)}/databases/(default)/documents`;
  }

  userPath(suffix) {
    return `users/${encodeURIComponent(this.session.uid)}/${suffix}`;
  }

  async request(path, { method = 'GET', body, query = '' } = {}) {
    if (!this.session) throw new Error('Cloud is signed out');
    const response = await fetch(`${this.basePath()}/${path}${query}`, {
      method,
      headers: { Authorization: `Bearer ${this.session.idToken}`, 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Firestore ${method} ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
  }

  async put(path, fields) {
    return this.request(path, { method: 'PATCH', body: { fields: encodeFields(fields) } });
  }

  async get(path) {
    const document = await this.request(path);
    return document ? decodeFields(document.fields || {}) : null;
  }

  async list(path, pageSize = 100) {
    const response = await this.request(path, { query: `?pageSize=${pageSize}` });
    return (response?.documents || []).map((document) => ({
      id: document.name.split('/').pop(),
      ...decodeFields(document.fields || {}),
    }));
  }

  async heartbeat() {
    if (!this.session) return;
    const device = this.service.getDeviceIdentity();
    const timestamp = Date.now();
    const controlPath = this.userPath('briizosLocalControl/primaryDevice');
    const control = await this.get(controlPath);
    if (!control || control.deviceId === device.deviceId || Number(control.leaseExpiresAt || 0) <= timestamp) {
      if (!control || control.deviceId === device.deviceId) {
        await this.put(controlPath, { deviceId: device.deviceId, leaseExpiresAt: timestamp + LEASE_MS, updatedAt: timestamp });
        this.primary = true;
      } else {
        this.primary = false;
      }
    } else this.primary = false;
    await this.put(this.userPath(`briizosLocalDevices/${encodeURIComponent(device.deviceId)}`), {
      schemaVersion: 1,
      label: device.label,
      platform: process.platform,
      appVersion: this.appVersion,
      capabilities: ['execute_task', 'continuity'],
      status: 'active',
      lastSeenAt: timestamp,
    });
  }

  async promoteThisDevice() {
    if (!this.session) throw new Error('Sign in before selecting a primary device');
    const deviceId = this.service.getDeviceIdentity().deviceId;
    const timestamp = Date.now();
    await this.put(this.userPath('briizosLocalControl/primaryDevice'), {
      deviceId, leaseExpiresAt: timestamp + LEASE_MS, updatedAt: timestamp,
    });
    this.primary = true;
    await this.poll();
    return this.status;
  }

  async poll() {
    if (!this.session) return;
    await this.heartbeat();
    if (!this.primary) return;
    const deviceId = this.service.getDeviceIdentity().deviceId;
    const commands = await this.list(this.userPath('briizosLocalCommands'), 100);
    for (const command of commands) {
      if (command.targetDeviceId !== deviceId || this.processing.has(command.id)) continue;
      if (command.schemaVersion !== 1 || command.kind !== 'execute_task') continue;
      this.processing.add(command.id);
      try {
        const expiresAt = Number(command.expiresAt || 0);
        if (expiresAt && expiresAt <= Date.now()) {
          const accepted = this.service.acceptCommand({
            remoteCommandId: command.id, idempotencyKey: command.idempotencyKey,
            source: 'remote', instruction: command.instruction, contextText: command.contextText,
            requestedAt: Number(command.requestedAt || Date.now()),
          });
          if (!accepted.duplicate) this.service.transitionRun(command.id, 'expired');
          await this.publishRun(this.service.getRun(command.id));
          continue;
        }
        const accepted = this.service.acceptCommand({
          remoteCommandId: command.id, idempotencyKey: command.idempotencyKey,
          source: 'remote', instruction: command.instruction, contextText: command.contextText,
          requestedAt: Number(command.requestedAt || Date.now()),
        });
        await this.publishRun(accepted.run);
        if (!accepted.duplicate) this.executeRemoteCommand(accepted.run).catch((error) => this.warn('remote execution', error));
      } finally {
        this.processing.delete(command.id);
      }
    }
    await this.flushContinuity();
  }

  async publishRun(run) {
    if (!this.session || !this.primary || !run?.remoteCommandId) return;
    const total = run.progressTotal || 0;
    const completed = run.progressCurrent || 0;
    await this.put(this.userPath(`briizosLocalRuns/${encodeURIComponent(run.id)}`), {
      schemaVersion: 1,
      runId: run.id,
      commandId: run.remoteCommandId,
      deviceId: this.service.getDeviceIdentity().deviceId,
      status: run.status,
      progress: { completed, total, percent: total ? Math.round((completed / total) * 100) : 0, label: run.status },
      resultSummary: run.resultSummary || '',
      error: run.errorCode ? { code: run.errorCode, message: run.errorMessage || '', retryable: false } : null,
      revision: run.revision,
      acceptedAt: run.createdAt,
      startedAt: run.startedAt,
      updatedAt: run.updatedAt,
      finishedAt: run.finishedAt,
    });
  }

  scheduleContinuity() {
    if (!this.session) return;
    clearTimeout(this.continuityTimer);
    this.continuityTimer = setTimeout(() => this.flushContinuity().catch((error) => this.warn('continuity', error)), CONTINUITY_IDLE_MS);
  }

  async flushContinuity() {
    if (!this.session || !this.primary) return;
    for (const pending of this.service.getPendingSyncDomains()) {
      try {
        await this.uploadContinuity(this.service.buildContinuitySnapshot(pending.domain));
        this.service.markSyncResult(pending.domain, pending.dirtyRevision);
      } catch (error) {
        this.service.markSyncResult(pending.domain, pending.dirtyRevision, 'UPLOAD_FAILED');
        throw error;
      }
    }
    await this.publishSharedText();
  }

  async uploadContinuity(snapshot) {
    const deviceId = this.service.getDeviceIdentity().deviceId;
    const payload = JSON.stringify(snapshot.items);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const chunks = splitUtf8(payload);
    const root = this.userPath(`briizosLocalContinuity/${snapshot.domain}/revisions/${snapshot.revision}`);
    for (let index = 0; index < chunks.length; index += 1) {
      await this.put(`${root}/chunks/${index}`, { chunkNumber: index, payload: chunks[index] });
    }
    await this.put(root, {
      schemaVersion: 1, localDomainRevision: snapshot.revision, deviceId,
      itemCount: snapshot.items.length, chunkCount: chunks.length, sha256: hash,
      createdAt: Date.now(), complete: true,
    });
    await this.put(this.userPath(`briizosLocalContinuity/${snapshot.domain}`), {
      schemaVersion: 1, currentRevision: snapshot.revision, itemCount: snapshot.items.length,
      sha256: hash, updatedAt: Date.now(), complete: true,
    });
    const revisions = await this.list(this.userPath(`briizosLocalContinuity/${snapshot.domain}/revisions`), 100);
    const old = revisions.sort((a, b) => Number(b.localDomainRevision) - Number(a.localDomainRevision)).slice(3);
    for (const revision of old) {
      const oldRoot = this.userPath(`briizosLocalContinuity/${snapshot.domain}/revisions/${revision.id}`);
      const oldChunks = await this.list(`${oldRoot}/chunks`, 100);
      for (const chunk of oldChunks) await this.request(`${oldRoot}/chunks/${chunk.id}`, { method: 'DELETE' });
      await this.request(oldRoot, { method: 'DELETE' });
    }
  }

  async publishSharedText() {
    for (const item of this.service.buildLocalSharedTextProjection()) {
      await this.put(this.userPath(`sharedText/briizos.local/items/${encodeURIComponent(item.id)}`), {
        ...item, ownerAppId: 'briizos.local', updatedAt: item.updatedAt,
      });
    }
  }

  async getRecoveryOffer() {
    if (!this.session) return null;
    const localCount = this.service.buildContinuitySnapshot('tasks').items.length
      + this.service.buildContinuitySnapshot('organizer').items.length
      + this.service.buildContinuitySnapshot('retainedText').items.length;
    if (localCount) return null;
    const domains = {};
    for (const domain of DOMAINS) {
      const manifest = await this.get(this.userPath(`briizosLocalContinuity/${domain}`));
      if (manifest?.complete && manifest.currentRevision) domains[domain] = { revision: manifest.currentRevision, itemCount: manifest.itemCount || 0 };
    }
    return Object.keys(domains).length ? { domains } : null;
  }

  async restoreContinuity(selectedDomains) {
    if (!this.session) throw new Error('Sign in before restoring continuity');
    const offer = await this.getRecoveryOffer();
    if (!offer) throw new Error('No continuity recovery is available');
    const snapshots = {};
    for (const domain of selectedDomains.filter((item) => offer.domains[item])) {
      const revision = offer.domains[domain].revision;
      const root = this.userPath(`briizosLocalContinuity/${domain}/revisions/${revision}`);
      const metadata = await this.get(root);
      if (!metadata?.complete || metadata.schemaVersion !== 1) throw new Error(`Incomplete ${domain} recovery revision`);
      const chunks = await this.list(`${root}/chunks`, metadata.chunkCount || 100);
      chunks.sort((a, b) => a.chunkNumber - b.chunkNumber);
      if (chunks.length !== metadata.chunkCount) throw new Error(`Missing ${domain} recovery chunk`);
      const payload = chunks.map((chunk) => chunk.payload).join('');
      const hash = crypto.createHash('sha256').update(payload).digest('hex');
      if (hash !== metadata.sha256) throw new Error(`${domain} recovery verification failed`);
      snapshots[domain] = { schemaVersion: 1, domain, revision, items: JSON.parse(payload) };
    }
    return this.service.importContinuitySnapshots(snapshots);
  }
}

module.exports = { CloudGateway };
