/**
 * Assistant coordinator (PLAN-BRIIZY.md §10) — ports the contract of omi's
 * AssistantCoordinator.swift.
 *
 * Subscribes to the indexer's frame stream, tracks (appName, normalizedTitle),
 * fires a debounced context switch, and hands each assistant a *batch* when a
 * segment closes — never one frame at a time. Per-assistant throttling and a
 * busy-set mean frames are DROPPED rather than queued behind a slow model call
 * (§4 assertion 6): a stale batch is worthless, and a queue would turn a slow
 * provider into unbounded memory growth and hours-late suggestions.
 *
 * The global pause switch stops analysis as well as capture (I10) — the
 * coordinator refuses to dispatch while paused, disabled, or in quiet hours.
 */

const { EventEmitter } = require('events');
const briizyConfig = require('../rewind/config');
const { buildContextBatch } = require('./assistants/base');

/**
 * How long a new (app, window) has to hold still before it counts as a real
 * context switch. Alt-tabbing through three windows to find one is not three
 * contexts (omi's debounce).
 */
const CONTEXT_SWITCH_DEBOUNCE_MS = 2500;
/**
 * Frames buffered per open segment. Beyond this the oldest are dropped: a long
 * stretch in one window is summarized by its most recent frames, and the buffer
 * can never grow without bound.
 */
const MAX_SEGMENT_FRAMES = 40;
/** A segment shorter than this is a fly-through, not work worth analysing. */
const MIN_SEGMENT_MS = 20 * 1000;
/** A segment with fewer OCR'd frames than this has nothing to reason about. */
const MIN_SEGMENT_TEXT_FRAMES = 1;

class AssistantCoordinator extends EventEmitter {
  constructor({ service, logger, indexer, getConfig }) {
    super();
    this.service = service;
    this.logger = logger;
    this.indexer = indexer;
    this.getConfig = getConfig || (() => briizyConfig.defaults());

    this.assistants = new Map();
    /** assistantId → epoch ms of its last dispatch, for throttling. */
    this.lastRunAt = new Map();
    /** assistantId → true while a call is in flight; batches are dropped, not queued. */
    this.busy = new Set();
    this.stats = { dispatched: 0, droppedBusy: 0, droppedThrottle: 0, droppedQuiet: 0, errors: 0 };

    this.segment = null;
    this.pendingSwitch = null;
    this.switchTimer = null;
    this.running = false;
    this.bound = [];
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.coordinator', message, data);
  }

  register(assistant) {
    if (!assistant?.id) throw new Error('An assistant needs an id');
    this.assistants.set(assistant.id, assistant);
    this._log('debug', 'A screen-analysis module was loaded. Loading it does not run a model request.', {
      analysisModule: assistant.id,
      moduleKind: assistant.kind,
      providerRequestAttempted: false,
    });
    return this;
  }

  start() {
    if (this.running) return;
    this.running = true;

    const onFrame = (frame) => this._onFrame(frame);
    const onSwitch = (event) => this._onContextSwitch(event);
    const onSessionClose = ({ session }) => this._closeSegment('session-close', session?.id);
    const onPaused = () => this._onPaused();

    this.indexer.on('frame', onFrame);
    this.indexer.on('context-switch', onSwitch);
    this.indexer.on('session-close', onSessionClose);
    this.indexer.on('paused', onPaused);
    this.bound = [
      () => this.indexer.off('frame', onFrame),
      () => this.indexer.off('context-switch', onSwitch),
      () => this.indexer.off('session-close', onSessionClose),
      () => this.indexer.off('paused', onPaused),
    ];

    this._log('debug', 'The screen-analysis event listener started. It will do nothing unless capture, cloud-text permission, module settings, timing, and quiet-hours gates all allow a review.', {
      loadedAnalysisModules: [...this.assistants.keys()],
    });
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.switchTimer) clearTimeout(this.switchTimer);
    this.switchTimer = null;
    this.bound.forEach((unbind) => unbind());
    this.bound = [];
    this.segment = null;
    this._log('debug', 'The screen-analysis event listener stopped.', { recordedStatistics: this.stats });
  }

  /** Pausing drops whatever was being accumulated — it is no longer current. */
  _onPaused() {
    if (this.switchTimer) clearTimeout(this.switchTimer);
    this.switchTimer = null;
    this.pendingSwitch = null;
    if (this.segment) {
      this._log('debug', 'Discarding open segment on pause', {
        app: this.segment.appName,
        frames: this.segment.frames.length,
      });
      this.segment = null;
    }
  }

  _normalizeTitle(title) {
    if (typeof title !== 'string') return '';
    return title.replace(/^[•*\s]+/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  _contextKey(event) {
    return `${event.appName || ''}::${this._normalizeTitle(event.windowTitle)}`;
  }

  /**
   * Debounce the switch. A window that appears and vanishes inside the debounce
   * never opens a segment at all.
   */
  _onContextSwitch(event) {
    if (!this.running) return;
    if (!event.allowed) return;
    const key = this._contextKey(event);
    if (this.segment && this.segment.key === key) return;

    this.pendingSwitch = { ...event, key };
    if (this.switchTimer) clearTimeout(this.switchTimer);
    this.switchTimer = setTimeout(() => {
      this.switchTimer = null;
      const pending = this.pendingSwitch;
      this.pendingSwitch = null;
      if (!pending || !this.running) return;
      // Only commit if the context is still what it was when the timer started.
      const currentKey = this._contextKey({
        appName: this.indexer.lastMeta?.appName,
        windowTitle: this.indexer.lastMeta?.windowTitle,
      });
      if (currentKey !== pending.key) {
        this._log('debug', 'Context switch discarded — did not hold still', {
          candidate: pending.appName,
        });
        return;
      }
      this._openSegment(pending);
    }, CONTEXT_SWITCH_DEBOUNCE_MS);
    this.switchTimer.unref?.();
  }

  _openSegment(event) {
    this._closeSegment('context-switch');
    this.segment = {
      key: event.key,
      appName: event.appName || null,
      bundleId: event.bundleId || null,
      windowTitle: event.windowTitle || null,
      startedAt: event.at || Date.now(),
      frames: [],
      sessionId: null,
    };
    this._log('debug', 'Segment opened', { app: this.segment.appName, title: this.segment.windowTitle });
    this._dispatch('onContextSwitch', { ...event });
  }

  _onFrame(frame) {
    if (!this.running || frame.duplicate) return;
    if (!this.segment) {
      // First frame of the run, before any switch has been observed.
      this._openSegment({
        key: this._contextKey(frame),
        appName: frame.appName,
        bundleId: frame.bundleId,
        windowTitle: frame.windowTitle,
        at: frame.capturedAt,
      });
    }
    const key = this._contextKey(frame);
    if (this.segment.key !== key) {
      // The indexer saw the change before the debounce fired; trust the frame.
      this._closeSegment('frame-context-change');
      this._openSegment({
        key,
        appName: frame.appName,
        bundleId: frame.bundleId,
        windowTitle: frame.windowTitle,
        at: frame.capturedAt,
      });
    }

    this.segment.sessionId = frame.sessionId || this.segment.sessionId;
    this.segment.frames.push(frame);
    if (this.segment.frames.length > MAX_SEGMENT_FRAMES) {
      // Drop the oldest: obsolete frames go, they do not accumulate.
      this.segment.frames.splice(0, this.segment.frames.length - MAX_SEGMENT_FRAMES);
    }
    this._dispatch('onFrame', frame);
  }

  _closeSegment(reason, sessionId) {
    const segment = this.segment;
    this.segment = null;
    if (!segment) return;

    const endedAt = segment.frames[segment.frames.length - 1]?.capturedAt || Date.now();
    const duration = endedAt - segment.startedAt;
    const batch = buildContextBatch(segment.frames);

    if (duration < MIN_SEGMENT_MS || batch.withText < MIN_SEGMENT_TEXT_FRAMES) {
      this._log('debug', 'Segment closed with nothing worth analysing', {
        app: segment.appName,
        reason,
        durationMs: duration,
        frames: segment.frames.length,
        withText: batch.withText,
      });
      return;
    }

    this._log('debug', 'A stable screen context ended and is eligible for configured analysis modules.', {
      app: segment.appName,
      title: segment.windowTitle,
      closeReason: reason,
      durationMs: duration,
      screenshotsConsidered: segment.frames.length,
      ocrCharactersAvailable: batch.text.length,
    });

    this._dispatch('onSegmentClose', {
      segment: {
        appName: segment.appName,
        bundleId: segment.bundleId,
        windowTitle: segment.windowTitle,
        startedAt: segment.startedAt,
        endedAt,
        durationMs: duration,
      },
      sessionId: sessionId || segment.sessionId || null,
      batch,
      reason,
    });
  }

  /**
   * Should this assistant get this event right now? Checks enablement, quiet
   * hours, throttle, and the busy set — in that order, so the log says which one
   * stopped it.
   */
  _canDispatch(assistantId, hook) {
    const config = this.getConfig();
    if (!config.enabled) return { ok: false, reason: 'capture disabled' };
    if (this.indexer.paused) return { ok: false, reason: 'paused' };

    const assistantConfig = config.assistants?.[assistantId];
    if (!assistantConfig?.enabled) return { ok: false, reason: 'assistant disabled' };
    if (!config.cloudTextAnalysisAllowed) return { ok: false, reason: 'cloud text analysis not allowed' };

    if (briizyConfig.inQuietHours(assistantConfig.quietHours)) {
      this.stats.droppedQuiet += 1;
      return { ok: false, reason: 'quiet hours' };
    }

    // onFrame is a cheap notification hook, so it skips throttle and busy checks;
    // only the batch hooks are rate limited.
    if (hook === 'onFrame') return { ok: true, assistantConfig };

    if (this.busy.has(assistantId)) {
      this.stats.droppedBusy += 1;
      return { ok: false, reason: 'busy — batch dropped rather than queued' };
    }
    const last = this.lastRunAt.get(assistantId) || 0;
    const elapsed = Date.now() - last;
    if (elapsed < assistantConfig.intervalMs) {
      this.stats.droppedThrottle += 1;
      return { ok: false, reason: `throttled (${Math.round((assistantConfig.intervalMs - elapsed) / 1000)}s to go)` };
    }
    return { ok: true, assistantConfig };
  }

  _dispatch(hook, payload) {
    for (const [assistantId, assistant] of this.assistants) {
      const handler = assistant[hook];
      if (typeof handler !== 'function') continue;

      const verdict = this._canDispatch(assistantId, hook);
      if (!verdict.ok) {
        if (hook !== 'onFrame') {
          this._log('debug', `${assistantId} skipped ${hook}`, { reason: verdict.reason });
        }
        continue;
      }

      if (hook === 'onFrame') {
        try {
          handler.call(assistant, payload, { config: this.getConfig(), assistantConfig: verdict.assistantConfig });
        } catch (error) {
          this.stats.errors += 1;
          this._log('warn', `${assistantId} onFrame threw`, { error: error?.message });
        }
        continue;
      }

      this.busy.add(assistantId);
      this.lastRunAt.set(assistantId, Date.now());
      this.stats.dispatched += 1;
      const startedAt = Date.now();

      Promise.resolve()
        .then(() => handler.call(assistant, payload, {
          config: this.getConfig(),
          assistantConfig: verdict.assistantConfig,
        }))
        .then((result) => {
          this._log(result ? 'info' : 'debug', result
            ? `The “${assistantId}” screen-analysis module finished reviewing captured OCR text. It staged or recorded the result described below; it did not execute a task unless the result explicitly says so.`
            : `The “${assistantId}” screen-analysis module reviewed captured OCR text and produced no user-visible result.`, {
            analysisTrigger: hook,
            elapsedMs: Date.now() - startedAt,
            recordedResult: summarizeResult(result),
          });
          if (result) this.emit('result', { assistantId, hook, payload, result });
        })
        .catch((error) => {
          this.stats.errors += 1;
          // An assistant that cannot run is a degraded feature, not an outage:
          // the capture pipeline keeps going regardless.
          const level = error?.code === 'ANALYSIS_NOT_ALLOWED' ? 'debug' : 'warn';
          this._log(level, `The “${assistantId}” screen-analysis module could not review this captured context. Screenshot capture continues; only this module's result is missing.`, {
            analysisTrigger: hook,
            code: error?.code,
            error: error?.message,
            captureContinues: true,
          });
          // This is an intentionally contained feature failure. EventEmitter's
          // reserved "error" event throws when nobody has subscribed, which
          // would turn a missing or rejected provider credential into a
          // process-level rejection. A regular event keeps capture running and
          // still lets an interested consumer observe the degraded result.
          this.emit('assistant-error', { assistantId, hook, error });
        })
        .finally(() => this.busy.delete(assistantId));
    }
  }

  getStatus() {
    return {
      running: this.running,
      assistants: [...this.assistants.keys()],
      busy: [...this.busy],
      segment: this.segment
        ? {
          appName: this.segment.appName,
          windowTitle: this.segment.windowTitle,
          startedAt: this.segment.startedAt,
          frames: this.segment.frames.length,
        }
        : null,
      stats: { ...this.stats },
    };
  }
}

function summarizeResult(result) {
  if (!result) return null;
  if (Array.isArray(result)) return { items: result.length };
  const counts = {};
  for (const [key, value] of Object.entries(result)) {
    if (Array.isArray(value)) counts[key] = value.length;
    else if (typeof value === 'number') counts[key] = value;
  }
  return Object.keys(counts).length ? counts : { ok: true };
}

module.exports = {
  AssistantCoordinator,
  CONTEXT_SWITCH_DEBOUNCE_MS,
  MAX_SEGMENT_FRAMES,
  MIN_SEGMENT_MS,
};
