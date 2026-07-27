/**
 * Capture → storage → OCR orchestration (PLAN-BRIIZY.md §7).
 *
 * Ports the contract of omi's RewindIndexer.swift: poll the frontmost window
 * every tick, capture on the configured cadence, OCR every Nth kept frame, skip
 * near-duplicates, defer OCR on battery, group frames into sessions, and hold
 * the archive under both retention caps.
 *
 * Order of operations is the load-bearing part:
 *
 *   1. meta          — cheap metadata poll, no pixels anywhere
 *   2. privacy gate  — ONE check, before any capture (I3)
 *   3. capture       — helper writes a JPEG only for a permitted window
 *   4. dedup         — near-identical frames are deleted, not stored
 *   5. record        — Electron owns the row (I4)
 *   6. OCR           — every Nth kept frame, or the first after a switch
 *   7. retention     — both caps, from the first capture (I8)
 *
 * There is no queue. A slow capture delays the next tick, so obsolete frames
 * are dropped rather than backing up behind a stalled call (§4 assertion 6).
 */

const { EventEmitter } = require('events');
const storage = require('./storage');
const privacy = require('./privacy');
const briizyConfig = require('./config');

/** Hamming distance at or below this counts as "same screen" (omi: dedupThreshold 5). */
const DEDUP_THRESHOLD = 5;
/** Metadata poll cadence — this is the context-switch signal for the coordinator. */
const META_POLL_MS = 1000;
/** Roll-up log cadence, so per-frame detail stays at debug without going dark. */
const SUMMARY_INTERVAL_MS = 60 * 1000;
/** Retention sweep cadence. */
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
/** Reconcile disk against the database this often (orphan/missing media). */
const RECONCILE_INTERVAL_MS = 30 * 60 * 1000;
/**
 * An unchanged screen still gets a lightweight presence row this often, so the
 * session timeline shows real durations instead of collapsing a 20-minute read
 * into a single instant. Duplicates between heartbeats are dropped entirely —
 * file deleted, no row.
 */
const HEARTBEAT_MIN_MS = 30 * 1000;
/** Deferred-OCR frames processed per tick once back on AC power. */
const OCR_BACKFILL_PER_TICK = 2;
/** How long a context that crashed the helper stays quarantined. */
const POISON_RETRY_MS = 5 * 60 * 1000;

class RewindIndexer extends EventEmitter {
  constructor({ helper, service, logger, powerMonitor, userDataPath, ownBundleIds = [] }) {
    super();
    this.helper = helper;
    this.service = service;
    this.logger = logger;
    this.powerMonitor = powerMonitor;
    this.userDataPath = userDataPath;
    this.ownBundleIds = ownBundleIds;

    this.config = briizyConfig.defaults();
    this.running = false;
    this.paused = false;
    this.screenLocked = false;
    this.timer = null;
    this.busy = false;

    this.captureState = 'paused';
    this.lastMeta = null;
    this.lastContextKey = null;
    this.lastCaptureAt = 0;
    this.lastKeptPhash = null;
    this.lastKeptContextKey = null;
    this.lastHeartbeatAt = 0;
    this.framesSinceOcr = 0;
    this.contextSwitchPending = false;

    this.sessionId = null;
    this.sessionKind = null;
    this.sessionStartedAt = 0;
    this.sessionDayKey = null;
    this.lastActivityAt = 0;

    /**
     * Contexts whose capture killed the helper. A SIGABRT inside
     * ScreenCaptureKit cannot be caught in-process, so if some window does
     * manage to abort the helper despite the safety checks, remembering it here
     * keeps capture working for every other window instead of turning into a
     * crash loop. Cleared on restart, since the cause is usually transient
     * window state.
     */
    this.poisonedContexts = new Map();
    this.lastSummaryAt = Date.now();
    this.lastPruneAt = 0;
    this.lastReconcileAt = 0;
    this.stats = this._emptyStats();
    this.totals = { frames: 0, duplicates: 0, ocr: 0, bytes: 0, errors: 0 };
    this.lastError = null;
  }

  _emptyStats() {
    return { captures: 0, kept: 0, duplicates: 0, heartbeats: 0, ocr: 0, denied: 0, errors: 0, bytes: 0 };
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.indexer', message, data);
  }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  setConfig(config) {
    const previous = this.config;
    this.config = briizyConfig.normalize(config);
    if (previous.enabled !== this.config.enabled) {
      this._log('info', `Capture ${this.config.enabled ? 'enabled' : 'disabled'}`, {
        captureIntervalMs: this.config.captureIntervalMs,
        ocrEveryNthFrame: this.config.ocrEveryNthFrame,
        retentionDays: this.config.retentionDays,
        retentionGiB: +(this.config.retentionBytes / 1024 ** 3).toFixed(2),
      });
    }
    this._refreshState();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._log('info', 'Indexer started', {
      enabled: this.config.enabled,
      helper: this.helper.getStatus().state,
    });
    this._bindPower();
    this._refreshState();
    this._scheduleTick(0);
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this._closeSession('shutdown');
    this._log('info', 'Indexer stopped', { totals: this.totals });
  }

  /** Global pause halts capture AND analysis together (I10). */
  pause(reason = 'user') {
    if (this.paused) return this.getStatus();
    this.paused = true;
    this._log('info', 'Capture paused', { reason });
    this._refreshState();
    this.emit('paused', { reason });
    return this.getStatus();
  }

  resume(reason = 'user') {
    if (!this.paused) return this.getStatus();
    this.paused = false;
    this._log('info', 'Capture resumed', { reason });
    this._refreshState();
    this.emit('resumed', { reason });
    this._scheduleTick(0);
    return this.getStatus();
  }

  _bindPower() {
    if (!this.powerMonitor || this._powerBound) return;
    this._powerBound = true;
    this.powerMonitor.on('suspend', () => {
      this._log('info', 'System suspending — closing session');
      this._closeSession('suspend').catch((error) => this._log('warn', 'Session close failed on suspend', error?.message));
    });
    this.powerMonitor.on('resume', () => {
      this._log('info', 'System resumed');
      this.emit('resumed-from-sleep');
      this._scheduleTick(0);
    });
    this.powerMonitor.on('lock-screen', () => {
      this.screenLocked = true;
      this._log('info', 'Screen locked — capture gated');
      this._refreshState();
    });
    this.powerMonitor.on('unlock-screen', () => {
      this.screenLocked = false;
      this._log('info', 'Screen unlocked');
      this._refreshState();
      this._scheduleTick(0);
    });
  }

  _onBattery() {
    try {
      return this.powerMonitor?.isOnBatteryPower?.() === true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------

  _refreshState() {
    const helperStatus = this.helper.getStatus();
    let next;
    if (helperStatus.state === 'unavailable' || !helperStatus.available) next = 'unavailable';
    else if (!this.config.enabled || this.paused || this.screenLocked) next = 'paused';
    else if (helperStatus.state === 'ready' && !helperStatus.permission) next = 'permissionRequired';
    else if (helperStatus.state === 'error') next = 'error';
    else if (this.sessionKind === 'display') next = 'capturingDisplay';
    else next = 'capturingWindow';

    if (next !== this.captureState) {
      this.captureState = next;
      this._log('info', `Capture state → ${next}`, {
        helper: helperStatus.state,
        permission: helperStatus.permission,
      });
      this.emit('state', this.getStatus());
    }
  }

  getStatus() {
    const helperStatus = this.helper.getStatus();
    return {
      state: this.captureState,
      enabled: this.config.enabled,
      paused: this.paused,
      screenLocked: this.screenLocked,
      onBattery: this._onBattery(),
      helper: helperStatus,
      session: this.sessionId
        ? {
          id: this.sessionId,
          kind: this.sessionKind,
          startedAt: this.sessionStartedAt,
          lastActivityAt: this.lastActivityAt,
        }
        : null,
      current: this.lastMeta
        ? {
          appName: this.lastMeta.appName || null,
          windowTitle: this.lastMeta.windowTitle || null,
          bundleId: this.lastMeta.bundleId || null,
        }
        : null,
      totals: { ...this.totals },
      lastError: this.lastError,
    };
  }

  // ------------------------------------------------------------------
  // Sessions
  // ------------------------------------------------------------------

  async _ensureSession(timestamp, kind = 'auto') {
    if (this.sessionId && this.sessionKind === kind) {
      // Day rollover closes a session even mid-activity, so a session never
      // straddles two calendar days (§8).
      if (storage.dayKey(timestamp) !== this.sessionDayKey) {
        await this._closeSession('day-boundary');
      } else {
        return this.sessionId;
      }
    } else if (this.sessionId) {
      await this._closeSession(`switch-to-${kind}`);
    }

    const created = this.service.createRewindSession({ kind, startedAt: timestamp });
    this.sessionId = created.row.id;
    this.sessionKind = kind;
    this.sessionStartedAt = timestamp;
    this.sessionDayKey = storage.dayKey(timestamp);
    this.lastActivityAt = timestamp;
    this._log('info', 'Session opened', { sessionId: this.sessionId, kind });
    this.emit('session-open', created.row);
    this._refreshState();
    return this.sessionId;
  }

  async _closeSession(reason) {
    if (!this.sessionId) return null;
    const sessionId = this.sessionId;
    const kind = this.sessionKind;
    const endedAt = this.lastActivityAt || Date.now();
    this.sessionId = null;
    this.sessionKind = null;
    this.sessionDayKey = null;
    this.lastKeptPhash = null;
    this.lastKeptContextKey = null;

    let row = null;
    try {
      row = this.service.endRewindSession(sessionId, { endedAt }).row;
      this._log('info', 'Session closed', {
        sessionId,
        kind,
        reason,
        frames: row?.frameCount,
        durationMs: (row?.endedAt || endedAt) - (row?.startedAt || endedAt),
        megabytes: row ? +(row.bytes / 1024 ** 2).toFixed(2) : 0,
      });
      // Sessions with no frames are noise — a permission-denied stretch or a
      // pause right after opening. Drop them rather than posting empty cards.
      if (row && row.frameCount === 0) {
        this.service.deleteRewindHistory({ sessionId });
        this._log('debug', 'Dropped empty session', { sessionId });
        this._refreshState();
        return null;
      }
      this.emit('session-close', { session: row, reason });
    } catch (error) {
      this._log('warn', 'Failed to close session', { sessionId, error: error?.message });
    }
    this._refreshState();
    this._runPrune('session-close').catch(() => {});
    return row;
  }

  /** Explicit display-session bounds, from the Notefalls toggle or the tray. */
  async startDisplaySession() {
    const timestamp = Date.now();
    await this._ensureSession(timestamp, 'display');
    this._refreshState();
    this._scheduleTick(0);
    return this.getStatus();
  }

  async endDisplaySession() {
    if (this.sessionKind !== 'display') return this.getStatus();
    await this._closeSession('display-session-ended');
    this._refreshState();
    return this.getStatus();
  }

  // ------------------------------------------------------------------
  // Tick loop
  // ------------------------------------------------------------------

  _scheduleTick(delayMs) {
    if (!this.running) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this._tick().catch((error) => {
        this.stats.errors += 1;
        this.totals.errors += 1;
        this.lastError = error?.message || String(error);
        this._log('error', 'Indexer tick failed', { error: this.lastError });
        this._scheduleTick(META_POLL_MS);
      });
    }, Math.max(0, delayMs));
    this.timer.unref?.();
  }

  async _tick() {
    if (!this.running || this.busy) return;
    this.busy = true;
    const startedAt = Date.now();
    try {
      await this._tickBody(startedAt);
    } finally {
      this.busy = false;
      this._maybeSummarize();
      const elapsed = Date.now() - startedAt;
      this._scheduleTick(Math.max(0, META_POLL_MS - elapsed));
    }
  }

  async _tickBody(now) {
    const helperStatus = this.helper.getStatus();
    if (helperStatus.state !== 'ready') {
      this._refreshState();
      return;
    }

    // 1. Metadata poll. No pixels are touched to produce this.
    let meta;
    try {
      meta = await this.helper.meta();
    } catch (error) {
      this.stats.errors += 1;
      this._log('debug', 'meta poll failed', error?.message);
      this._refreshState();
      return;
    }
    this.lastMeta = meta;

    // 2. The one privacy gate, before anything is captured or stored (I3).
    const verdict = privacy.evaluate(meta, this.config, {
      paused: this.paused,
      screenLocked: this.screenLocked,
      ownBundleIds: this.ownBundleIds,
    });

    const contextKey = `${meta.appName || ''} ${this._normalizeTitle(meta.windowTitle)}`;
    if (contextKey !== this.lastContextKey) {
      this.lastContextKey = contextKey;
      this.contextSwitchPending = true;
      this.emit('context-switch', {
        appName: meta.appName || null,
        bundleId: meta.bundleId || null,
        windowTitle: meta.windowTitle || null,
        at: now,
        allowed: verdict.allowed,
      });
      this._log('debug', 'Context switch', {
        app: meta.appName,
        title: meta.windowTitle,
        allowed: verdict.allowed,
      });
    }

    if (!verdict.allowed) {
      this.stats.denied += 1;
      // Excluded windows are not activity: an hour in a password manager should
      // close the session by inactivity, not extend it.
      this._log('debug', 'Frame denied by privacy gate', {
        reason: verdict.reason,
        detail: verdict.detail,
      });
      await this._maybeCloseIdleSession(now);
      this._refreshState();
      await this._maybeBackfillOcr();
      await this._maybePeriodicWork(now);
      return;
    }

    this._refreshState();
    if (this.captureState !== 'capturingWindow' && this.captureState !== 'capturingDisplay') {
      await this._maybePeriodicWork(now);
      return;
    }

    // Battery policy (omi PowerMonitor.swift, folded in here).
    const onBattery = this._onBattery();
    if (onBattery && this.config.batteryBehavior === 'pauseCapture') {
      await this._maybeCloseIdleSession(now);
      await this._maybePeriodicWork(now);
      return;
    }

    // 3. Capture on cadence.
    if (now - this.lastCaptureAt < this.config.captureIntervalMs) {
      await this._maybeBackfillOcr();
      await this._maybePeriodicWork(now);
      return;
    }

    await this._captureOnce(now, meta, onBattery);
    await this._maybePeriodicWork(now);
  }

  _normalizeTitle(title) {
    if (typeof title !== 'string') return '';
    // Strip the leading unsaved-changes marker and collapse whitespace so a
    // keystroke does not read as a context switch.
    return title.replace(/^[•*\s]+/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async _captureOnce(now, meta, onBattery) {
    const mode = this.sessionKind === 'display' ? 'display' : 'window';
    const contextKey = `${meta.appName || ''} ${this._normalizeTitle(meta.windowTitle)}`;
    const isNewContext = this.contextSwitchPending || contextKey !== this.lastKeptContextKey;

    // OCR the first frame after a switch (that is the informative one), then
    // every Nth frame after it.
    const wantsOcr = isNewContext || this.framesSinceOcr + 1 >= this.config.ocrEveryNthFrame;
    const deferOcr = onBattery && this.config.batteryBehavior === 'deferOcr';

    const poisonedAt = this.poisonedContexts.get(contextKey);
    if (poisonedAt) {
      // Retry occasionally — a window that was un-capturable while minimized or
      // on another Space usually is not five minutes later.
      if (now - poisonedAt < POISON_RETRY_MS) {
        this.lastCaptureAt = now;
        this._log('debug', 'Skipping a context that previously crashed the helper', {
          app: meta.appName,
          title: meta.windowTitle,
        });
        return;
      }
      this.poisonedContexts.delete(contextKey);
    }

    const sessionId = await this._ensureSession(now, mode === 'display' ? 'display' : 'auto');
    const outPath = storage.framePath(this.userDataPath, now, `${mode}`);

    let captured;
    try {
      captured = await this.helper.capture({
        out: outPath,
        mode,
        ocr: wantsOcr && !deferOcr,
        ocrFast: this.config.ocrMode === 'fast',
        ocrLanguages: this.config.ocrLanguages,
      });
    } catch (error) {
      this.lastCaptureAt = now;
      this.stats.errors += 1;
      this.totals.errors += 1;
      if (error?.code === 'PERMISSION_REQUIRED') {
        this._log('warn', 'Capture blocked — Screen Recording permission required');
        this._refreshState();
      } else if (error?.code === 'NO_ACTIVE_WINDOW' || error?.code === 'WINDOW_GONE') {
        this._log('debug', 'Capture skipped', { code: error.code });
      } else if (/helper exited|HELPER_UNAVAILABLE/.test(`${error?.code} ${error?.message}`)) {
        // The helper died mid-capture. Whatever was on screen is the prime
        // suspect: quarantine it so the next tick tries something else rather
        // than reproducing the crash forever.
        this.poisonedContexts.set(contextKey, now);
        this._log('error', 'Helper died capturing this window — quarantining it', {
          app: meta.appName,
          title: meta.windowTitle,
          bundleId: meta.bundleId,
          retryInMs: POISON_RETRY_MS,
          error: error?.message,
        });
      } else {
        this.lastError = error?.message || 'capture failed';
        this._log('warn', 'Capture failed', { code: error?.code, error: this.lastError });
      }
      return;
    }

    this.lastCaptureAt = now;
    this.stats.captures += 1;

    // 4. Dedup. A near-identical frame in the same context is not worth
    // ~200 KB; delete the file and keep at most a heartbeat row.
    const distance = storage.hammingDistance(captured.phash, this.lastKeptPhash);
    const sameContext = contextKey === this.lastKeptContextKey;
    const isDuplicate = sameContext && this.lastKeptPhash && distance <= DEDUP_THRESHOLD;

    if (isDuplicate) {
      this.stats.duplicates += 1;
      this.totals.duplicates += 1;
      storage.deleteFiles([captured.path]);
      this.lastActivityAt = now;

      const heartbeatDue = now - this.lastHeartbeatAt
        >= Math.max(HEARTBEAT_MIN_MS, this.config.captureIntervalMs * 10);
      if (!heartbeatDue) {
        this._log('debug', 'Duplicate frame dropped', { distance, app: meta.appName });
        return;
      }
      this.lastHeartbeatAt = now;
      this.stats.heartbeats += 1;
      const heartbeat = this.service.recordRewindFrame({
        sessionId,
        capturedAt: now,
        appName: captured.appName || meta.appName || null,
        bundleId: captured.bundleId || meta.bundleId || null,
        windowTitle: captured.windowTitle || meta.windowTitle || null,
        captureMode: mode,
        imagePath: null,
        bytes: 0,
        width: captured.width ?? null,
        height: captured.height ?? null,
        phash: captured.phash || null,
        ocrStatus: 'duplicate',
      });
      this._log('debug', 'Presence heartbeat recorded', {
        frameId: heartbeat.row.frameId,
        app: meta.appName,
      });
      this.emit('frame', { ...heartbeat.row, duplicate: true, sessionId });
      return;
    }

    // 5. Record the frame. Electron owns the row; the helper owns the file.
    const ocr = captured.ocr || null;
    let ocrStatus = 'skipped';
    if (ocr) ocrStatus = 'done';
    else if (wantsOcr && deferOcr) ocrStatus = 'deferred';
    else if (wantsOcr) ocrStatus = 'pending';

    let recorded;
    try {
      recorded = this.service.recordRewindFrame({
        sessionId,
        capturedAt: now,
        appName: captured.appName || meta.appName || null,
        bundleId: captured.bundleId || meta.bundleId || null,
        windowTitle: captured.windowTitle || meta.windowTitle || null,
        captureMode: mode,
        imagePath: captured.path,
        bytes: captured.bytes ?? storage.fileSize(captured.path),
        width: captured.width ?? null,
        height: captured.height ?? null,
        phash: captured.phash || null,
        ocrStatus,
        ocrText: ocr?.fullText || null,
        ocrBlocks: ocr?.blocks || undefined,
      });
    } catch (error) {
      // The row is the source of truth; a file with no row is an orphan, so
      // remove it now rather than waiting for the reconcile sweep.
      storage.deleteFiles([captured.path]);
      this.stats.errors += 1;
      this.totals.errors += 1;
      this.lastError = error?.message || 'frame record failed';
      this._log('error', 'Failed to record frame', { error: this.lastError, code: error?.code });
      return;
    }

    this.lastKeptPhash = captured.phash || null;
    this.lastKeptContextKey = contextKey;
    this.lastHeartbeatAt = now;
    this.lastActivityAt = now;
    this.contextSwitchPending = false;
    this.framesSinceOcr = ocr ? 0 : this.framesSinceOcr + 1;
    if (ocr) {
      this.stats.ocr += 1;
      this.totals.ocr += 1;
    }
    this.stats.kept += 1;
    this.stats.bytes += recorded.row.bytes || 0;
    this.totals.frames += 1;
    this.totals.bytes += recorded.row.bytes || 0;

    this._log('debug', 'Frame recorded', {
      frameId: recorded.row.frameId,
      app: recorded.row.appName,
      title: recorded.row.windowTitle,
      kb: Math.round((recorded.row.bytes || 0) / 1024),
      distance: this.lastKeptPhash ? distance : null,
      ocr: ocrStatus,
      ocrChars: ocr?.fullText?.length || 0,
    });

    this.emit('frame', {
      ...recorded.row,
      sessionId,
      ocrText: ocr?.fullText || null,
      duplicate: false,
      isContextStart: isNewContext,
    });
  }

  // ------------------------------------------------------------------
  // Deferred OCR, retention, reconciliation
  // ------------------------------------------------------------------

  /** Work through frames whose OCR was deferred on battery, once back on AC. */
  async _maybeBackfillOcr() {
    if (this._onBattery() && this.config.batteryBehavior === 'deferOcr') return;
    if (this.paused || !this.config.enabled) return;

    const pending = this.service.listRewindFrames({ limit: OCR_BACKFILL_PER_TICK, includePath: true })
      .filter((frame) => (frame.ocrStatus === 'deferred' || frame.ocrStatus === 'pending') && frame.imagePath);
    if (!pending.length) return;

    for (const frame of pending) {
      try {
        const result = await this.helper.ocr({
          path: frame.imagePath,
          fast: this.config.ocrMode === 'fast',
          languages: this.config.ocrLanguages,
        });
        this.service.setRewindFrameOcr(frame.frameId, {
          status: 'done',
          text: result.fullText || null,
          blocks: result.blocks || [],
        });
        this.stats.ocr += 1;
        this.totals.ocr += 1;
        this._log('debug', 'Backfilled OCR', {
          frameId: frame.frameId,
          chars: result.fullText?.length || 0,
        });
      } catch (error) {
        const missing = error?.code === 'OCR_FAILED' || error?.code === 'HELPER_UNAVAILABLE';
        this.service.setRewindFrameOcr(frame.frameId, { status: missing ? 'failed' : 'pending', text: null });
        this._log('warn', 'OCR backfill failed', { frameId: frame.frameId, error: error?.message });
        return;
      }
    }
  }

  async _maybePeriodicWork(now) {
    await this._maybeCloseIdleSession(now);
    if (now - this.lastPruneAt >= PRUNE_INTERVAL_MS) {
      this.lastPruneAt = now;
      await this._runPrune('interval');
    }
    if (now - this.lastReconcileAt >= RECONCILE_INTERVAL_MS) {
      this.lastReconcileAt = now;
      this._runReconcile();
    }
  }

  async _maybeCloseIdleSession(now) {
    if (!this.sessionId || this.sessionKind === 'display') return;
    if (!this.lastActivityAt) return;
    if (now - this.lastActivityAt < this.config.inactivityThresholdMs) return;
    await this._closeSession('inactivity');
  }

  /** Retention under BOTH caps (I8). Files are unlinked after the rows go. */
  async _runPrune(reason) {
    try {
      const result = this.service.pruneRewindFrames({
        retentionDays: this.config.retentionDays,
        retentionBytes: this.config.retentionBytes,
        keepSessionIds: this.sessionId ? [this.sessionId] : [],
      });
      if (!result.deleted.length) return;
      const removal = storage.deleteFiles(result.deleted.map((frame) => frame.imagePath).filter(Boolean));
      storage.pruneEmptyDayDirectories(this.userDataPath);
      this._log('info', 'Retention pruned frames', {
        reason,
        frames: result.deleted.length,
        freedMB: +(result.freedBytes / 1024 ** 2).toFixed(2),
        filesRemoved: removal.removed,
        filesMissing: removal.missing,
        filesFailed: removal.failed,
        retentionDays: this.config.retentionDays,
        retentionGiB: +(this.config.retentionBytes / 1024 ** 3).toFixed(2),
      });
      if (removal.errors.length) {
        this._log('warn', 'Some frame files could not be removed', removal.errors);
      }
      this.emit('pruned', { reason, ...result, removal });
    } catch (error) {
      this._log('warn', 'Retention prune failed', { reason, error: error?.message });
    }
  }

  /**
   * Orphan/missing media recovery: files with no row are deleted, rows with no
   * file are marked so the UI never offers a frame it cannot show.
   */
  _runReconcile() {
    try {
      const known = new Set(
        this.service.listRewindFrames({ limit: 5000, includePath: true })
          .map((frame) => frame.imagePath)
          .filter(Boolean),
      );
      const result = storage.reconcile(this.userDataPath, known);
      if (result.orphans.length) {
        const removal = storage.deleteFiles(result.orphans.map((file) => file.path));
        this._log('info', 'Removed orphaned frame files', {
          files: removal.removed,
          megabytes: +(result.orphanBytes / 1024 ** 2).toFixed(2),
        });
      }
      if (result.missing.length) {
        this._log('warn', 'Frames reference missing files', { count: result.missing.length });
      }
      storage.pruneEmptyDayDirectories(this.userDataPath);
    } catch (error) {
      this._log('warn', 'Reconcile failed', { error: error?.message });
    }
  }

  /**
   * Hard Rule 1 without flooding: each frame logs at debug, and this rolls up
   * to an info line every minute so the LogPanel always shows the pipeline
   * working at the default log level.
   */
  _maybeSummarize() {
    const now = Date.now();
    if (now - this.lastSummaryAt < SUMMARY_INTERVAL_MS) return;
    const elapsedSec = Math.round((now - this.lastSummaryAt) / 1000);
    this.lastSummaryAt = now;
    const stats = this.stats;
    this.stats = this._emptyStats();
    if (!stats.captures && !stats.denied && !stats.errors) return;
    this._log('info', 'Capture window summary', {
      windowSec: elapsedSec,
      captures: stats.captures,
      kept: stats.kept,
      duplicates: stats.duplicates,
      heartbeats: stats.heartbeats,
      ocr: stats.ocr,
      deniedByPrivacy: stats.denied,
      errors: stats.errors,
      megabytes: +(stats.bytes / 1024 ** 2).toFixed(2),
      state: this.captureState,
    });
  }
}

module.exports = { RewindIndexer, DEDUP_THRESHOLD, HEARTBEAT_MIN_MS };
