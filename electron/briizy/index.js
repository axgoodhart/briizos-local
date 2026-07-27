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
const { AssistantCoordinator } = require('./coordinator');
const { createInsightAssistant } = require('./assistants/insight');
const { createTaskExtractionAssistant } = require('./assistants/task-extraction');
const { createMemoryExtractionAssistant } = require('./assistants/memory-extraction');
const { createGoalsAssistant } = require('./assistants/goals');
const { createFocusAssistant, summarizeSessionFocus } = require('./assistants/focus');
const { createTaskAgent } = require('./assistants/task-agent');
const { Compactor } = require('../rewind/compactor');

const CONFIG_STATE_KEY = 'config';
const LAST_SUMMARY_DAY_KEY = 'lastSummaryDay';
/** How often to check whether the end-of-day summary is due. */
const SUMMARY_CHECK_INTERVAL_MS = 5 * 60 * 1000;
/** Proposals nobody touched in a week retire themselves. */
const PROPOSAL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
/** Compaction runs on a slow cadence — it is disk maintenance, not a feature. */
const COMPACTION_INTERVAL_MS = 60 * 60 * 1000;
/** Thumbnail width for filmstrip/session-card requests. */
const DEFAULT_THUMBNAIL_WIDTH = 320;
/**
 * A session only earns a Notefalls card if it represents real work. A
 * ten-second stretch between two excluded windows is noise, and one card per
 * session is already the rule (§8) — this stops the feed filling with stubs.
 */
const CARD_MIN_DURATION_MS = 60 * 1000;
const CARD_MIN_FRAMES = 2;
/** One app this dominant reads as "worked in X" rather than "spread across". */
const DOMINANT_APP_SHARE = 0.6;

function formatMinutes(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourPart = `${hours} hour${hours === 1 ? '' : 's'}`;
  return rest ? `${hourPart} ${rest} min` : hourPart;
}

/**
 * Headline for a session card, derived from what was actually captured. Phase 4's
 * insight assistant can replace this with a model-written summary; until then the
 * card says something true rather than something generated.
 */
function describeSession(session) {
  const duration = formatMinutes((session.endedAt || Date.now()) - session.startedAt);
  const apps = (session.topApps || []).filter((entry) => entry.appName);
  if (!apps.length) return `Screen session — ${duration}`;

  const total = apps.reduce((sum, entry) => sum + entry.frames, 0) || 1;
  const [leader] = apps;
  if (apps.length === 1 || leader.frames / total >= DOMINANT_APP_SHARE) {
    return `Worked in ${leader.appName} for ${duration}`;
  }
  const named = apps.slice(0, 3).map((entry) => entry.appName);
  const extra = apps.length - named.length;
  const list = extra > 0 ? `${named.join(', ')} +${extra} more` : named.join(', ');
  return `${duration} across ${list}`;
}

class Briizy extends EventEmitter {
  constructor({
    service, logger, powerMonitor, nativeImage, userDataPath, ownBundleIds = [],
    automation = null,
  }) {
    super();
    this.service = service;
    this.logger = logger;
    this.nativeImage = nativeImage;
    this.userDataPath = userDataPath;
    // The one route to automation, used only by the TaskAgent and only when
    // immediate execution has been explicitly enabled (I6, §12).
    this.automation = automation;

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
    this.summaryTimer = null;

    // One coordinator, one set of assistants, all hanging off the same runtime —
    // there is no second intelligence anywhere in here (I1).
    this.coordinator = new AssistantCoordinator({
      service,
      logger,
      indexer: this.indexer,
      getConfig: () => this.config,
    });
    const onProposal = (proposal) => {
      this._log('info', 'Proposal raised', {
        id: proposal.id,
        kind: proposal.kind,
        assistantId: proposal.assistantId,
        urgency: proposal.urgency,
      });
      this.emit('proposal', proposal);
    };
    // Focus is ambient: it tints the overlay edge and records what it saw. It
    // never raises a proposal, because being told you are distracted is the most
    // resented thing a tool like this can do.
    const onFocus = (focus) => {
      this._log('debug', 'Focus classified', focus);
      this.emit('focus', focus);
    };
    this.taskAgent = createTaskAgent({ service, logger, automation });
    [
      createInsightAssistant({ service, logger, onProposal }),
      createTaskExtractionAssistant({ service, logger, onProposal }),
      createMemoryExtractionAssistant({ service, logger, onProposal }),
      createGoalsAssistant({ service, logger, onProposal }),
      createFocusAssistant({ service, logger, onFocus }),
    ].forEach((assistant) => this.coordinator.register(assistant));

    this.compactor = new Compactor({
      service,
      helper: this.helper,
      logger,
      userDataPath,
    });
    this.compactionTimer = null;

    // Re-emit the pipeline events the Phase 3 shell and Phase 4 coordinator
    // subscribe to, so neither reaches into the indexer directly.
    this.indexer.on('frame', (frame) => this.emit('frame', frame));
    this.indexer.on('context-switch', (event) => this.emit('context-switch', event));
    this.indexer.on('session-open', (session) => this.emit('session-open', session));
    this.indexer.on('session-close', (event) => {
      this._postSessionCard(event.session);
      this.emit('session-close', event);
    });
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
      this.coordinator.start();
      this._startCompactionTimer();
    } else {
      this._log('info', 'Capture is off — helper not spawned (nothing is silently enabled)');
    }
    // The summary is built from the database, not from a model, so it runs
    // whether or not cloud text analysis is allowed.
    this._startSummaryTimer();
    return this.getStatus();
  }

  async stop() {
    if (!this.started) return;
    this.started = false;
    this._log('info', 'briizy runtime stopping');
    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
      this.summaryTimer = null;
    }
    if (this.compactionTimer) {
      clearInterval(this.compactionTimer);
      this.compactionTimer = null;
    }
    this.coordinator.stop();
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
      this.coordinator.start();
      this._startCompactionTimer();
    } else if (!next.enabled && previous.enabled) {
      // One switch stops capture AND analysis together (I10).
      this.coordinator.stop();
      this.indexer.stop().catch(() => {});
      this.helper.stop();
      if (this.compactionTimer) {
        clearInterval(this.compactionTimer);
        this.compactionTimer = null;
      }
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

  /**
   * One Notefalls card per closed session (§8). Failure here must never take
   * the pipeline down — a missing card is cosmetic, a crashed indexer is not.
   */
  _postSessionCard(session) {
    if (!session) return null;
    const duration = (session.endedAt || 0) - session.startedAt;
    if (duration < CARD_MIN_DURATION_MS || session.frameCount < CARD_MIN_FRAMES) {
      this._log('debug', 'Session too short for a Notefalls card', {
        sessionId: session.id,
        durationMs: duration,
        frames: session.frameCount,
      });
      return null;
    }
    try {
      const result = this.service.upsertRewindSessionPost(session.id, {
        body: describeSession(session),
        sourceApp: session.topApps?.[0]?.appName || null,
      });
      this._log('info', 'Session card posted to Notefalls', {
        sessionId: session.id,
        postId: result.postId,
        body: result.row?.body,
      });
      this.emit('session-card', result.row);
      return result;
    } catch (error) {
      this._log('warn', 'Failed to post session card', {
        sessionId: session.id,
        error: error?.message,
      });
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
  async getFrameImage(frameId, { maxWidth = DEFAULT_THUMBNAIL_WIDTH, full = false } = {}) {
    const frame = this.service.getRewindFrame(frameId, { includePath: true });
    if (!frame) return null;

    let sourcePath = frame.imagePath;
    let extractedPath = null;
    if (!sourcePath && frame.mediaPath) {
      // Compacted (§13): pull the frame back out of its chunk on demand. The
      // temp file is deleted below, so a compacted archive never re-grows.
      //
      // Reading compacted history needs the helper, and the helper is not
      // running when capture is off — so it is started for the read. Without
      // this, turning capture off would silently make everything older than the
      // compaction window unviewable.
      await this._ensureHelperForRead();
      extractedPath = await this.compactor.extractFrame(frameId);
      if (!extractedPath) {
        return { frameId, dataUrl: null, reason: 'compacted' };
      }
      sourcePath = extractedPath;
    }
    if (!sourcePath) {
      return { frameId, dataUrl: null, reason: 'missing' };
    }
    if (!fs.existsSync(sourcePath)) {
      this._log('warn', 'Frame file missing on disk', { frameId });
      return { frameId, dataUrl: null, reason: 'missing' };
    }
    try {
      const image = this.nativeImage.createFromPath(sourcePath);
      if (image.isEmpty()) return { frameId, dataUrl: null, reason: 'unreadable' };

      // Never upscale: a 320px request against a small frame should return the
      // frame, not a blurry enlargement that costs more bytes than the original.
      const natural = image.getSize();
      const targetWidth = Math.max(64, Math.min(2000, maxWidth));
      const sized = full || natural.width <= targetWidth
        ? image
        : image.resize({ width: targetWidth });

      // Encode as JPEG, not via toDataURL(). toDataURL() always emits PNG, which
      // for a 3000px screenshot is several megabytes over IPC — an order of
      // magnitude more than the JPEG already sitting on disk.
      const buffer = sized.toJPEG(full ? 88 : 76);
      if (!buffer?.length) return { frameId, dataUrl: null, reason: 'unreadable' };

      return {
        frameId,
        capturedAt: frame.capturedAt,
        appName: frame.appName,
        windowTitle: frame.windowTitle,
        width: sized.getSize().width,
        height: sized.getSize().height,
        bytes: buffer.length,
        dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
      };
    } catch (error) {
      this._log('warn', 'Frame image read failed', { frameId, error: error?.message });
      return { frameId, dataUrl: null, reason: 'error' };
    } finally {
      if (extractedPath) storage.deleteFiles([extractedPath]);
    }
  }

  /**
   * Bring the helper up for a read-only operation (frame extraction), whether or
   * not capture is enabled. It stays supervised and still exits with this process
   * (I5); it simply is not exclusively a capture dependency.
   */
  async _ensureHelperForRead({ timeoutMs = 6000 } = {}) {
    if (this.helper.getStatus().state === 'ready') return true;
    if (!this.helper.isAvailable()) return false;
    if (this.helper.state === 'stopped' || this.helper.state === 'error') {
      this._log('info', 'Starting the helper to read compacted history');
      this.helper.stopping = false;
      this.helper.start();
    }
    const deadline = Date.now() + timeoutMs;
    while (this.helper.getStatus().state !== 'ready' && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return this.helper.getStatus().state === 'ready';
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
      assistantPrompts: {
        insight: require('./assistants/insight').DEFAULT_PROMPT,
        taskExtraction: require('./assistants/task-extraction').DEFAULT_PROMPT,
        memoryExtraction: require('./assistants/memory-extraction').DEFAULT_PROMPT,
      },
    };
  }

  // ------------------------------------------------------------------
  // Proposals (§10) — the only path from a suggestion to anything real
  // ------------------------------------------------------------------

  listProposals(filters = {}) {
    return this.service.listBriizyProposals(filters);
  }

  listStagedTasks(filters = {}) {
    return this.service.listBriizyStagedTasks(filters);
  }

  getProposalHistory(proposalId) {
    return this.service.listBriizyProposalEvents(proposalId);
  }

  /**
   * Decide a proposal. Accepting creates exactly one pending, non-automated task
   * and performs no work (I6) — see the note on decideBriizyProposal for why this
   * does not go through acceptCommand.
   */
  decideProposal(decision = {}) {
    const verdict = ({ accept: 'accept', dismiss: 'dismiss', snooze: 'snooze' })[decision.verdict];
    if (!decision.id || !verdict) {
      return { ok: false, reason: 'a proposal id and a verdict of accept/dismiss/snooze are required' };
    }
    try {
      const result = this.service.decideBriizyProposal(decision.id, {
        verdict,
        note: decision.note || null,
        snoozeMinutes: decision.snoozeMinutes,
        actor: 'user',
      });
      this.emit('status', this.getStatus());
      this.emit('proposal-decided', result);

      // Phase 6: an accepted task may get a plan. This runs after the decision
      // has already been committed, so a TaskAgent failure cannot undo an accept
      // or turn it into something the user did not ask for.
      if (result.task) {
        this._planAcceptedTask(result.task, result.row).catch((error) => {
          this._log('warn', 'Task planning failed', {
            taskId: result.task.id,
            error: error?.message,
          });
        });
      }

      return {
        ok: true,
        state: result.row.state,
        taskId: result.task?.id || null,
        // Stated explicitly so the UI can promise it and the log can prove it.
        automated: result.task ? result.task.automated === true : null,
      };
    } catch (error) {
      this._log('warn', 'Proposal decision rejected', {
        id: decision.id,
        verdict,
        code: error?.code,
        error: error?.message,
      });
      return { ok: false, reason: error?.message, code: error?.code };
    }
  }

  /** "What briizy learned" (I7) — every derived write with its provenance. */
  getLearningLog(filters = {}) {
    return this.service.getBriizyLearningLog(filters);
  }

  /** Undo a fact briizy wrote. Reversibility is the invariant, not a courtesy. */
  forgetFact(factId) {
    this.service.archiveMemoryFact(factId);
    this._log('info', 'Fact forgotten at the user’s request', { factId });
    return { ok: true };
  }

  // ------------------------------------------------------------------
  // End-of-day summary (§10)
  // ------------------------------------------------------------------

  _startSummaryTimer() {
    if (this.summaryTimer) return;
    this.summaryTimer = setInterval(() => {
      this._maybePostDailySummary().catch((error) => {
        this._log('warn', 'Daily summary failed', { error: error?.message });
      });
      try {
        const expired = this.service.expireBriizyProposals(PROPOSAL_EXPIRY_MS);
        if (expired.expired) this._log('info', 'Expired stale proposals', expired);
      } catch (error) {
        this._log('warn', 'Proposal expiry failed', { error: error?.message });
      }
    }, SUMMARY_CHECK_INTERVAL_MS);
    this.summaryTimer.unref?.();
  }

  /**
   * One Notefalls post at the configured time. Because the check is periodic
   * rather than a timer fired at exactly 18:00, a Mac that was asleep gets its
   * summary once after the next wake — which is the behaviour §10 asks for,
   * without a missed-alarm special case.
   */
  async _maybePostDailySummary({ force = false } = {}) {
    if (!force && !this.config.enabled) return null;
    const now = new Date();
    const today = storage.dayKey(now.getTime());
    const state = this.service.getBriizyState();
    if (!force && state[LAST_SUMMARY_DAY_KEY] === today) return null;

    const [hour, minute] = String(this.config.summaryTimeLocal || '18:00').split(':').map(Number);
    const dueAt = new Date(now);
    dueAt.setHours(hour, minute, 0, 0);
    if (!force && now < dueAt) return null;

    const summary = this.buildDailySummary(dueAt.getTime());
    if (!summary.hasContent && !force) {
      // Nothing happened today; record the day so we do not re-check all evening.
      this.service.setBriizyState(LAST_SUMMARY_DAY_KEY, today);
      this._log('debug', 'No activity to summarize today');
      return null;
    }

    const post = this.service.createNotefallPost({ body: summary.body });
    this.service.setBriizyState(LAST_SUMMARY_DAY_KEY, today);
    this._log('info', 'Daily summary posted', {
      postId: post.row.id,
      day: today,
      sessions: summary.counts.sessions,
      factsLearned: summary.counts.facts,
      openProposals: summary.counts.openProposals,
    });
    this.emit('daily-summary', post.row);
    return post.row;
  }

  /**
   * Build the summary from the database rather than from a model. It is a report
   * of what happened, and the data is already structured — so it works with
   * cloud text analysis switched off, and it cannot hallucinate a commitment.
   */
  buildDailySummary(referenceTime = Date.now()) {
    const dayStart = new Date(referenceTime);
    dayStart.setHours(0, 0, 0, 0);
    const from = dayStart.getTime();
    const to = referenceTime;

    const sessions = this.service.listRewindSessions({ from, to, limit: 200 });
    const learning = this.service.getBriizyLearningLog({ from, to, limit: 100 });
    const staged = this.service.listBriizyStagedTasks({ status: 'staged', limit: 50 });
    const proposals = this.service.listBriizyProposals({ state: 'pending', limit: 50 });
    const insights = learning.extractions.filter((entry) => entry.kind === 'insight');

    const appMinutes = new Map();
    sessions.forEach((session) => {
      const total = (session.topApps || []).reduce((sum, entry) => sum + entry.frames, 0) || 1;
      const durationMinutes = Math.max(0, ((session.endedAt || to) - session.startedAt) / 60000);
      (session.topApps || []).forEach((entry) => {
        if (!entry.appName) return;
        const share = (entry.frames / total) * durationMinutes;
        appMinutes.set(entry.appName, (appMinutes.get(entry.appName) || 0) + share);
      });
    });
    const themes = [...appMinutes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([appName, minutes]) => `${appName} (${Math.round(minutes)} min)`);

    const lines = [];
    const dayLabel = dayStart.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    lines.push(`Today — ${dayLabel}`);

    if (themes.length) lines.push('', `Where the time went: ${themes.join(', ')}.`);

    if (learning.facts.length) {
      lines.push('', 'Learned about you:');
      learning.facts.slice(0, 6).forEach((fact) => lines.push(`• ${fact.factText}`));
    }

    if (staged.length) {
      lines.push('', 'Possible commitments, waiting for you:');
      staged.slice(0, 6).forEach((task) => {
        lines.push(`• ${task.title}${task.dueHint ? ` (${task.dueHint})` : ''}`);
      });
    }

    if (insights.length) {
      lines.push('', 'Noticed:');
      insights.slice(0, 4).forEach((entry) => lines.push(`• ${entry.content}`));
    }

    const unresolved = proposals.filter((proposal) => proposal.state === 'pending');
    if (unresolved.length) {
      lines.push('', `${unresolved.length} suggestion${unresolved.length === 1 ? '' : 's'} still unanswered.`);
    }

    const counts = {
      sessions: sessions.length,
      facts: learning.facts.length,
      staged: staged.length,
      insights: insights.length,
      openProposals: unresolved.length,
    };

    return {
      body: lines.join('\n'),
      counts,
      hasContent: !!(themes.length || learning.facts.length || staged.length || insights.length),
    };
  }

  async _planAcceptedTask(task, proposal) {
    const assistantConfig = this.config.assistants?.taskAgent;
    if (!assistantConfig?.enabled) return null;
    const result = await this.taskAgent.planAcceptedTask(
      { task, proposal },
      { config: this.config, assistantConfig },
    );
    if (result?.steps) this.emit('task-planned', { taskId: task.id, ...result });
    return result;
  }

  /** Focus statistics for a session, derived from its focus extractions (§11). */
  getSessionFocus(sessionId) {
    return summarizeSessionFocus(this.service, sessionId);
  }

  // ------------------------------------------------------------------
  // Compaction (§13)
  // ------------------------------------------------------------------

  _startCompactionTimer() {
    if (this.compactionTimer) return;
    this.compactionTimer = setInterval(() => {
      this.compactor.run().catch((error) => {
        this._log('warn', 'Compaction pass failed', { error: error?.message });
      });
    }, COMPACTION_INTERVAL_MS);
    this.compactionTimer.unref?.();
  }

  /** Manual trigger, for Settings and for tests. */
  compactNow(options = {}) {
    return this.compactor.run(options);
  }

  getCoordinatorStatus() {
    return this.coordinator.getStatus();
  }
}

function createBriizy(options) {
  return new Briizy(options);
}

module.exports = { Briizy, createBriizy, CONFIG_STATE_KEY, DEFAULT_THUMBNAIL_WIDTH };
