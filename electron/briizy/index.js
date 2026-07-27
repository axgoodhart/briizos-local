/**
 * briizy runtime — the single object Electron main talks to.
 *
 * Owns the helper supervisor, the indexer, and config persistence, and exposes
 * the `window.briizy` surface from PLAN-BRIIZY.md §2. Phase 4's coordinator and
 * assistants attach to the same runtime, which is what keeps there being exactly
 * one briizy (I1) rather than a capture feature and an assistant feature that
 * happen to share a name.
 *
 * Frame identifiers handed out here are opaque and no archive path ever crosses
 * the IPC boundary (§2) — images are returned as data URLs, resized in main.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { BriizyHelper } = require('../rewind/helper');
const { RewindIndexer } = require('../rewind/indexer');
const storage = require('../rewind/storage');
const briizyConfig = require('../rewind/config');
const privacy = require('../rewind/privacy');

const CONFIG_STATE_KEY = 'config';
/** Thumbnail width for filmstrip/session-card requests. */
const DEFAULT_THUMBNAIL_WIDTH = 320;

class Briizy extends EventEmitter {
  constructor({ service, logger, powerMonitor, nativeImage, userDataPath, ownBundleIds = [] }) {
    super();
    this.service = service;
    this.logger = logger;
    this.nativeImage = nativeImage;
    this.userDataPath = userDataPath;

    this.helper = new BriizyHelper({ logger });
    this.indexer = new RewindIndexer({
      helper: this.helper,
      service,
      logger,
      powerMonitor,
      userDataPath,
      ownBundleIds,
    });

    this.config = briizyConfig.defaults();
    this.started = false;

    // Re-emit the pipeline events the Phase 3 shell and Phase 4 coordinator
    // subscribe to, so neither reaches into the indexer directly.
    this.indexer.on('frame', (frame) => this.emit('frame', frame));
    this.indexer.on('context-switch', (event) => this.emit('context-switch', event));
    this.indexer.on('session-open', (session) => this.emit('session-open', session));
    this.indexer.on('session-close', (event) => this.emit('session-close', event));
    this.indexer.on('state', (status) => this.emit('status', status));
    this.indexer.on('paused', (event) => this.emit('paused', event));
    this.indexer.on('resumed', (event) => this.emit('resumed', event));
    this.helper.on('state', () => this.emit('status', this.getStatus()));
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy', message, data);
  }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  start() {
    if (this.started) return this.getStatus();
    this.started = true;

    this.config = this._loadConfig();
    this.indexer.setConfig(this.config);

    this._log('info', 'briizy runtime starting', {
      enabled: this.config.enabled,
      onboarded: !!this.config.onboardedAt,
      captureIntervalMs: this.config.captureIntervalMs,
      retentionDays: this.config.retentionDays,
      retentionGiB: +(this.config.retentionBytes / 1024 ** 3).toFixed(2),
      cloudTextAnalysisAllowed: this.config.cloudTextAnalysisAllowed,
    });

    // I10: the helper is only spawned once the user has turned capture on.
    // Before onboarding, briizy exists but does nothing.
    if (this.config.enabled) {
      this.helper.start();
      this.indexer.start();
    } else {
      this._log('info', 'Capture is off — helper not spawned (nothing is silently enabled)');
    }
    return this.getStatus();
  }

  async stop() {
    if (!this.started) return;
    this.started = false;
    this._log('info', 'briizy runtime stopping');
    await this.indexer.stop().catch(() => {});
    this.helper.stop();
  }

  // ------------------------------------------------------------------
  // Config
  // ------------------------------------------------------------------

  _loadConfig() {
    try {
      const stored = this.service.getBriizyState()?.[CONFIG_STATE_KEY];
      return briizyConfig.normalize(stored);
    } catch (error) {
      this._log('warn', 'Falling back to default config', { error: error?.message });
      return briizyConfig.defaults();
    }
  }

  getConfig() {
    return this.config;
  }

  /**
   * Apply a partial config change. Turning capture on/off starts and stops the
   * whole pipeline, so a single switch really does stop capture and analysis
   * together (I10).
   */
  setConfig(patch = {}) {
    const previous = this.config;
    const next = briizyConfig.merge(previous, patch);
    this.config = next;
    this.service.setBriizyState(CONFIG_STATE_KEY, next);
    this.indexer.setConfig(next);

    const changedKeys = Object.keys(next).filter((key) => (
      JSON.stringify(next[key]) !== JSON.stringify(previous[key])
    ));
    this._log('info', 'Config updated', { changed: changedKeys });

    if (next.enabled && !previous.enabled) {
      this.helper.start();
      this.indexer.start();
    } else if (!next.enabled && previous.enabled) {
      this.indexer.stop().catch(() => {});
      this.helper.stop();
    }

    this.emit('config', next);
    this.emit('status', this.getStatus());
    return next;
  }

  /**
   * First-run onboarding (I10). Capture cannot be enabled any other way than
   * an explicit user act that records when it happened.
   */
  completeOnboarding(input = {}) {
    const next = this.setConfig({
      enabled: input.enabled === true,
      onboardedAt: Date.now(),
      cloudTextAnalysisAllowed: input.cloudTextAnalysisAllowed === true,
    });
    this._log('info', 'Onboarding completed', {
      captureEnabled: next.enabled,
      cloudTextAnalysisAllowed: next.cloudTextAnalysisAllowed,
    });
    return next;
  }

  // ------------------------------------------------------------------
  // Control
  // ------------------------------------------------------------------

  pause(reason) { return this.indexer.pause(reason); }

  resume(reason) { return this.indexer.resume(reason); }

  startDisplaySession() { return this.indexer.startDisplaySession(); }

  endDisplaySession() { return this.indexer.endDisplaySession(); }

  getStatus() {
    const status = this.indexer.getStatus();
    return {
      ...status,
      onboarded: !!this.config.onboardedAt,
      storage: this._storageSummary(),
    };
  }

  _storageSummary() {
    try {
      const usage = this.service.getRewindStorageUsage();
      return {
        frames: usage.frames,
        bytes: usage.bytes,
        oldest: usage.oldest,
        newest: usage.newest,
        pendingOcr: usage.pendingOcr,
        sessions: usage.sessions,
        retentionBytes: this.config.retentionBytes,
        retentionDays: this.config.retentionDays,
        percentOfCap: this.config.retentionBytes
          ? Math.min(100, Math.round((usage.bytes / this.config.retentionBytes) * 100))
          : 0,
      };
    } catch (error) {
      this._log('warn', 'Storage summary failed', { error: error?.message });
      return null;
    }
  }

  // ------------------------------------------------------------------
  // Queries (renderer-facing — never return a path)
  // ------------------------------------------------------------------

  search(query = {}) {
    const results = this.service.searchRewindFrames(query);
    this._log('debug', 'Work memory search', {
      text: query.text,
      results: results.length,
      sessionId: query.sessionId || null,
    });
    return results;
  }

  listSessions(filters = {}) {
    return this.service.listRewindSessions(filters);
  }

  getSessionTimeline(sessionId) {
    return this.service.getRewindSessionTimeline(sessionId);
  }

  getFrame(frameId) {
    return this.service.getRewindFrame(frameId);
  }

  getRecentActivity(minutes = 30) {
    return this.service.getRecentRewindActivity(minutes);
  }

  /**
   * Return a frame as a data URL. This is the ONLY way pixels reach the
   * renderer; the path stays in main (§2). Thumbnails are resized here so the
   * filmstrip does not ship full-size JPEGs over IPC.
   */
  getFrameImage(frameId, { maxWidth = DEFAULT_THUMBNAIL_WIDTH, full = false } = {}) {
    const frame = this.service.getRewindFrame(frameId, { includePath: true });
    if (!frame) return null;
    if (!frame.imagePath) {
      // Compacted into a video chunk (Phase 7) or the file is gone.
      return { frameId, dataUrl: null, reason: frame.mediaPath ? 'compacted' : 'missing' };
    }
    if (!fs.existsSync(frame.imagePath)) {
      this._log('warn', 'Frame file missing on disk', { frameId });
      return { frameId, dataUrl: null, reason: 'missing' };
    }
    try {
      const image = this.nativeImage.createFromPath(frame.imagePath);
      if (image.isEmpty()) return { frameId, dataUrl: null, reason: 'unreadable' };
      const sized = full ? image : image.resize({ width: Math.max(64, Math.min(2000, maxWidth)) });
      return {
        frameId,
        capturedAt: frame.capturedAt,
        appName: frame.appName,
        windowTitle: frame.windowTitle,
        dataUrl: sized.toDataURL(),
      };
    } catch (error) {
      this._log('warn', 'Frame image read failed', { frameId, error: error?.message });
      return { frameId, dataUrl: null, reason: 'error' };
    }
  }

  /** Both clear-history flows (§4): a range/session, or everything. */
  deleteHistory(scope = {}) {
    const result = this.service.deleteRewindHistory(scope);
    const removal = storage.deleteFiles(result.deleted.map((frame) => frame.imagePath).filter(Boolean));
    storage.pruneEmptyDayDirectories(this.userDataPath);
    this._log('info', 'History cleared', {
      scope,
      frames: result.deleted.length,
      sessionsRemoved: result.removedSessions,
      filesRemoved: removal.removed,
      filesMissing: removal.missing,
    });
    this.emit('status', this.getStatus());
    return {
      frames: result.deleted.length,
      sessionsRemoved: result.removedSessions,
      filesRemoved: removal.removed,
    };
  }

  /**
   * Explain why capture is currently denied for the frontmost window. Powers the
   * settings UI so an exclusion is visible rather than mysterious.
   */
  explainCurrentWindow() {
    const meta = this.indexer.lastMeta;
    if (!meta) return { allowed: false, reason: 'no metadata yet' };
    const verdict = privacy.evaluate(meta, this.config, {
      paused: this.indexer.paused,
      screenLocked: this.indexer.screenLocked,
      ownBundleIds: this.indexer.ownBundleIds,
    });
    return {
      ...verdict,
      appName: meta.appName || null,
      bundleId: meta.bundleId || null,
      windowTitle: meta.windowTitle || null,
    };
  }

  getDefaults() {
    return {
      config: briizyConfig.defaults(),
      excludedBundleIds: privacy.DEFAULT_EXCLUDED_BUNDLE_IDS,
      excludedTitlePatterns: privacy.DEFAULT_EXCLUDED_TITLE_PATTERNS,
    };
  }
}

function createBriizy(options) {
  return new Briizy(options);
}

module.exports = { Briizy, createBriizy, CONFIG_STATE_KEY, DEFAULT_THUMBNAIL_WIDTH };
