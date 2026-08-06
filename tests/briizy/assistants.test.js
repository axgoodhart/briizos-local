/**
 * Phase 4: migration 010, the proposal state machine, dedup, the coordinator's
 * backpressure, and §4 assertion 2 — accepting creates exactly one pending,
 * non-automated task and cannot trigger an action.
 *
 * Also covers assertion 1 on the real send path: `callModel` is the only route to
 * a provider, and it aborts on a payload that would leak pixels or paths.
 */

const path = require('path');
const { EventEmitter } = require('events');
const { LocalDataService } = require('../../electron/local-data-service');
const { AssistantCoordinator, CONTEXT_SWITCH_DEBOUNCE_MS } = require('../../electron/briizy/coordinator');
const base = require('../../electron/briizy/assistants/base');
const memoryExtraction = require('../../electron/briizy/assistants/memory-extraction');
const { normalizeKey } = require('../../electron/briizy/assistants/insight');
const briizyConfig = require('../../electron/rewind/config');
const { assert, assertThrows, makeLogger, makeSandbox, section } = require('./harness');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const sandbox = makeSandbox('briizy-assistants-');
  const logger = makeLogger();
  const service = new LocalDataService({
    databasePath: path.join(sandbox.dir, 'briizos.db'),
    logger,
  });

  try {
    section('migration 010');

    const status = service.initialize();
    assert('schema is at version 10', status.schemaVersion === 10, status);
    const tables = service.db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'briizy%' ORDER BY name",
    ).all().map((row) => row.name);
    assert('all briizy tables exist',
      ['briizy_extractions', 'briizy_goals', 'briizy_proposal_events', 'briizy_proposals',
        'briizy_staged_tasks'].every((name) => tables.includes(name)), tables);
    assert('memory_facts gained provenance columns, rather than a parallel table', (() => {
      const columns = service.db.prepare('PRAGMA table_info(memory_facts)').all().map((c) => c.name);
      return ['origin', 'source_frame_id', 'source_session_id', 'confidence', 'extraction_id']
        .every((column) => columns.includes(column));
    })(), undefined, 'I1');
    assert('"About me" is a memory_sections row',
      service.listMemorySections().some((s) => s.key === 'user.aboutMe'), undefined, 'I1');
    assert('About me reaches the injected profile',
      service.getMemoryProfile().user.aboutMe !== undefined, undefined, 'I1');

    section('extractions and their FTS index');

    const sessionRow = service.createRewindSession({ kind: 'auto' }).row;
    const frameRow = service.recordRewindFrame({
      sessionId: sessionRow.id, capturedAt: Date.now(), appName: 'Slack',
      windowTitle: '#eng', imagePath: null, bytes: 0, ocrStatus: 'done',
      ocrText: 'ship the staging deploy before friday standup',
    }).row;

    const extraction = service.recordBriizyExtraction({
      assistantId: 'taskExtraction', kind: 'task',
      content: 'Ship the staging deploy',
      reasoning: 'explicit commitment in #eng',
      contextSummary: 'Slack — #eng',
      sourceFrameId: frameRow.frameId,
      sourceSessionId: sessionRow.id,
    }).row;
    assert('extraction carries provenance',
      extraction.sourceFrameId === frameRow.frameId && extraction.sourceSessionId === sessionRow.id,
      undefined, 'I7');
    assert('extraction FTS finds it',
      service.db.prepare('SELECT COUNT(*) c FROM briizy_extractions_fts WHERE briizy_extractions_fts MATCH ?')
        .get('staging').c === 1);
    assert('extraction FTS follows a delete', (() => {
      const throwaway = service.recordBriizyExtraction({
        assistantId: 'insight', kind: 'insight', content: 'ephemeral wombat observation',
      }).row;
      const before = service.db.prepare('SELECT COUNT(*) c FROM briizy_extractions_fts WHERE briizy_extractions_fts MATCH ?').get('wombat').c;
      service.db.prepare('DELETE FROM briizy_extractions WHERE id = ?').run(throwaway.id);
      const after = service.db.prepare('SELECT COUNT(*) c FROM briizy_extractions_fts WHERE briizy_extractions_fts MATCH ?').get('wombat').c;
      return before === 1 && after === 0;
    })());
    assertThrows('an unknown extraction kind is rejected',
      () => service.recordBriizyExtraction({ assistantId: 'x', kind: 'invented', content: 'y' }),
      'INVALID_INPUT');

    section('proposal dedup');

    const staged = service.createBriizyStagedTask({
      extractionId: extraction.id,
      title: 'Ship the staging deploy',
      detail: 'before friday standup',
      dueHint: 'friday',
      confidence: 0.82,
      sourceSessionId: sessionRow.id,
    }).row;
    assert('a staged task starts staged with no task behind it',
      staged.status === 'staged' && staged.createdTaskId === null, undefined, 'I6');

    const first = service.createBriizyProposal({
      assistantId: 'taskExtraction', kind: 'task', summary: 'Ship the staging deploy',
      dedupeKey: 'task:ship-the-staging-deploy', extractionId: extraction.id,
      stagedTaskId: staged.id, sourceSessionId: sessionRow.id,
      evidence: [{ type: 'frame', frameId: frameRow.frameId }],
    });
    assert('the first proposal is created', first.duplicate === false && first.row.state === 'pending');
    const again = service.createBriizyProposal({
      assistantId: 'taskExtraction', kind: 'task', summary: 'Ship the staging deploy (again)',
      dedupeKey: 'task:ship-the-staging-deploy',
    });
    assert('an identical live proposal is not duplicated',
      again.duplicate === true && again.row.id === first.row.id);
    assert('only one proposal row exists',
      service.db.prepare('SELECT COUNT(*) c FROM briizy_proposals').get().c === 1);
    assert('the proposal was logged as proposed',
      service.listBriizyProposalEvents(first.row.id).some((e) => e.toState === 'pending'), undefined, 'I7');
    assert('evidence stays local to the proposal row',
      first.row.evidence[0].frameId === frameRow.frameId, undefined, 'I9');

    section('§4 assertion 2 — accepting creates one pending, non-automated task');

    const tasksBefore = service.listTasks({ limit: 500 }).length;
    const accepted = service.decideBriizyProposal(first.row.id, { verdict: 'accept' });
    const tasksAfter = service.listTasks({ limit: 500 });

    assert('exactly one task was created', tasksAfter.length === tasksBefore + 1,
      { before: tasksBefore, after: tasksAfter.length }, 'assertion 2');
    assert("the task's status is pending", accepted.task.status === 'pending',
      accepted.task.status, 'assertion 2');
    assert('the task is NOT automated', accepted.task.automated === false,
      accepted.task.automated, 'assertion 2');
    assert('the task is source-linked to the proposal',
      accepted.task.source_key === `briizy:proposal:${first.row.id}`,
      accepted.task.source_key, 'I6');
    assert('the proposal is now accepted', accepted.row.state === 'accepted');
    assert('the staged task is marked accepted and points at the task',
      service.listBriizyStagedTasks({ limit: 10 })[0].createdTaskId === accepted.task.id);
    assert('no run or command was created — accepting performs no work',
      service.listRuns({}).length === 0
      && service.db.prepare('SELECT COUNT(*) c FROM commands').get().c === 0,
      undefined, 'assertion 2');
    assert('no automation could have been triggered',
      service.db.prepare('SELECT COUNT(*) c FROM run_events').get().c === 0, undefined, 'assertion 2');
    assert('the acceptance is in the outcome log',
      service.listBriizyProposalEvents(first.row.id).some((e) => e.toState === 'accepted' && e.actor === 'user'),
      undefined, 'I7');
    assertThrows('accepting twice is refused',
      () => service.decideBriizyProposal(first.row.id, { verdict: 'accept' }), 'INVALID_STATE');
    assert('the double-accept created no second task',
      service.listTasks({ limit: 500 }).length === tasksAfter.length, undefined, 'assertion 2');

    section('the rest of the state machine');

    const mkProposal = (key, extra = {}) => service.createBriizyProposal({
      assistantId: 'insight', kind: 'insight', summary: `observation ${key}`, dedupeKey: key, ...extra,
    }).row;

    const dismissed = mkProposal('d1');
    const dismissResult = service.decideBriizyProposal(dismissed.id, { verdict: 'dismiss', note: 'not useful' });
    assert('dismiss moves to dismissed', dismissResult.row.state === 'dismissed');
    assert('dismiss creates no task', dismissResult.task === null, undefined, 'I6');
    assert('the dismissal reason is recorded for the feedback loop',
      service.listBriizyProposalEvents(dismissed.id).some((e) => e.note === 'not useful'), undefined, '§14');
    assertThrows('a dismissed proposal cannot be accepted later',
      () => service.decideBriizyProposal(dismissed.id, { verdict: 'accept' }), 'INVALID_STATE');

    const snoozed = mkProposal('s1');
    const snoozeResult = service.decideBriizyProposal(snoozed.id, { verdict: 'snooze', snoozeMinutes: 30 });
    assert('snooze sets a wake time',
      snoozeResult.row.state === 'snoozed' && snoozeResult.row.snoozeUntil > Date.now());
    assert('a snoozed proposal is hidden from the default listing',
      !service.listBriizyProposals({}).some((p) => p.id === snoozed.id));
    assert('a snoozed proposal is visible when asked for',
      service.listBriizyProposals({ includeSnoozed: true }).some((p) => p.id === snoozed.id));
    assert('a snoozed proposal can still be accepted when it comes back',
      service.decideBriizyProposal(snoozed.id, { verdict: 'accept' }).row.state === 'accepted');

    const stale = mkProposal('old1');
    service.db.prepare('UPDATE briizy_proposals SET created_at = ? WHERE id = ?')
      .run(Date.now() - 30 * 24 * 60 * 60 * 1000, stale.id);
    assert('stale proposals expire', service.expireBriizyProposals(7 * 24 * 60 * 60 * 1000).expired >= 1);
    assert('an expired proposal is terminal',
      service.listBriizyProposals({ states: ['expired'] }).some((p) => p.id === stale.id));

    assert('high urgency sorts ahead of normal', (() => {
      mkProposal('u-low', { urgency: 'low' });
      mkProposal('u-high', { urgency: 'high' });
      const pending = service.listBriizyProposals({ state: 'pending' });
      return pending[0].urgency === 'high';
    })());
    assertThrows('an unknown verdict is rejected',
      () => service.decideBriizyProposal(mkProposal('v1').id, { verdict: 'obliterate' }), 'INVALID_INPUT');
    assertThrows('deciding an unknown proposal is a NOT_FOUND',
      () => service.decideBriizyProposal('00000000-0000-4000-8000-000000000000', { verdict: 'dismiss' }),
      'NOT_FOUND');

    section('facts land in the existing memory system, with provenance (I1, I7)');

    const factResult = service.addBriizyMemoryFact({
      factText: 'Works on the briizOS desktop app',
      sectionKey: 'user.workContext',
      confidence: 0.9,
      sourceFrameId: frameRow.frameId,
      sourceSessionId: sessionRow.id,
      extractionId: extraction.id,
    });
    assert('the fact was written', factResult.duplicate === false && !!factResult.factId);
    const factRow = service.db.prepare('SELECT * FROM memory_facts WHERE id = ?').get(factResult.factId);
    assert('the fact is marked as screen-derived', factRow.origin === 'screen', factRow.origin, 'I7');
    assert('the fact points back at the frame that taught it',
      factRow.source_frame_id === frameRow.frameId, undefined, 'I7');
    assert('the fact carries its confidence', factRow.confidence === 0.9, undefined, 'I7');
    assert('a near-identical fact is folded in, not duplicated',
      service.addBriizyMemoryFact({ factText: '  works on THE briizOS desktop app  ' }).duplicate === true);
    assert('the fact appears in the learning log',
      service.getBriizyLearningLog({}).facts.some((f) => f.id === factResult.factId), undefined, 'I7');
    assert('the fact is undoable', (() => {
      service.archiveMemoryFact(factResult.factId);
      return !service.getBriizyLearningLog({}).facts.some((f) => f.id === factResult.factId);
    })(), undefined, 'I7');
    assertThrows('an unknown memory section is refused',
      () => service.addBriizyMemoryFact({ factText: 'x', sectionKey: 'user.invented' }), 'INVALID_INPUT');

    section('sensitive text never becomes a memory');

    const sensitive = [
      'Their password is hunter2',
      'API key sk-abcdefghijklmnopqrstuvwx',
      'Card number 4111 1111 1111 1111',
      'SSN 123-45-6789',
      'Their api-key is stored in the vault',
    ];
    sensitive.forEach((text) => {
      assert(`refused: ${text.slice(0, 28)}…`, memoryExtraction.looksSensitive(text) === true);
    });
    const benign = [
      'Works on the briizOS desktop app',
      'Prefers Linear over Jira',
      'Priya is their manager',
    ];
    benign.forEach((text) => {
      assert(`allowed: ${text}`, memoryExtraction.looksSensitive(text) === false);
    });
    assert('the auto-save bar is higher than the propose bar',
      memoryExtraction.AUTO_SAVE_CONFIDENCE > memoryExtraction.PROPOSE_CONFIDENCE);

    section('§4 assertion 1 — the model send path blocks leaks');

    let blocked = null;
    try {
      await base.callModel({
        assistantId: 'test',
        systemPrompt: 'do a thing',
        // A path that a buggy context builder might have included.
        userContent: 'context: /Users/alex/Library/Application Support/briizos/rewind/frames/x.jpg',
        config: { cloudTextAnalysisAllowed: true },
        assistant: { model: null },
        logger,
      });
    } catch (error) {
      blocked = error;
    }
    assert('a payload containing an archive path is blocked before it leaves',
      blocked?.code === 'EGRESS_BLOCKED', blocked?.violations, 'assertion 1 / I2');

    let imageBlocked = null;
    try {
      await base.callModel({
        assistantId: 'test',
        systemPrompt: 'do a thing',
        userContent: 'here is the screenshot: data:image/jpeg;base64,/9j/4AAQSkZJRg',
        config: { cloudTextAnalysisAllowed: true },
        assistant: { model: null },
        logger,
      });
    } catch (error) {
      imageBlocked = error;
    }
    assert('a payload containing image bytes is blocked',
      imageBlocked?.code === 'EGRESS_BLOCKED', imageBlocked?.violations, 'assertion 1 / I2');

    let notAllowed = null;
    try {
      await base.callModel({
        assistantId: 'test',
        systemPrompt: 'x',
        userContent: 'ordinary screen text about a deploy',
        config: { cloudTextAnalysisAllowed: false },
        assistant: {},
        logger,
      });
    } catch (error) {
      notAllowed = error;
    }
    assert('with cloud analysis off, no request is attempted at all',
      notAllowed?.code === 'ANALYSIS_NOT_ALLOWED', notAllowed?.message, 'I2');
    assert('the block was logged loudly',
      logger.find(/Blocked a model request/).length >= 2, undefined, 'Hard Rule 3');

    section('context batches contain only what I2 permits');

    const batch = base.buildContextBatch([
      {
        frameId: 'f1', capturedAt: Date.now() - 2000, appName: 'Slack', windowTitle: '#eng',
        ocrText: 'ship the staging deploy', imagePath: '/Users/alex/frames/a.jpg',
      },
      {
        frameId: 'f2', capturedAt: Date.now(), appName: 'Safari', windowTitle: 'fly.io',
        ocrText: 'deploy succeeded', imagePath: '/Users/alex/frames/b.jpg',
      },
    ]);
    assert('the batch text carries app, window, time and OCR text',
      /Slack — #eng/.test(batch.text) && /staging deploy/.test(batch.text), undefined, 'I2');
    assert('the batch text carries no path', !/Users|\.jpg/.test(batch.text), batch.text, 'I2');
    assert('frame ids are tracked separately, not put in the prompt',
      batch.frameIds.length === 2 && !/f1|f2/.test(batch.text), undefined, 'I2');
    assert('the batch is ordered oldest first',
      batch.text.indexOf('staging deploy') < batch.text.indexOf('deploy succeeded'));
    assert('a batch is char-budgeted', (() => {
      const huge = Array.from({ length: 100 }, (_, i) => ({
        frameId: `h${i}`, capturedAt: Date.now() + i, appName: 'IDE', windowTitle: 'file.ts',
        ocrText: 'x'.repeat(5000),
      }));
      return base.buildContextBatch(huge).text.length <= base.MAX_CONTEXT_CHARS + 2000;
    })());

    section('JSON parsing tolerates a chatty model');

    assert('plain JSON parses', base.parseJsonResponse('{"a":1}')?.a === 1);
    assert('fenced JSON parses', base.parseJsonResponse('```json\n{"a":2}\n```')?.a === 2);
    assert('prose-prefixed JSON parses',
      base.parseJsonResponse('Sure! Here you go:\n{"a":3}')?.a === 3);
    assert('unparseable output becomes null, not a throw',
      base.parseJsonResponse('I would rather not') === null);
    assert('non-string input becomes null', base.parseJsonResponse(undefined) === null);

    section('coordinator: throttle, busy-drop, quiet hours, pause');

    const indexer = new EventEmitter();
    indexer.paused = false;
    indexer.lastMeta = { appName: 'Figma', windowTitle: 'Onboarding flow' };

    let config = briizyConfig.merge(briizyConfig.defaults(), {
      enabled: true,
      cloudTextAnalysisAllowed: true,
      assistants: { insight: { enabled: true, intervalMs: 60 * 1000 } },
    });
    const coordinator = new AssistantCoordinator({
      service, logger, indexer, getConfig: () => config,
    });

    const calls = [];
    let release;
    coordinator.register({
      id: 'insight',
      kind: 'insight',
      onSegmentClose: (payload) => {
        calls.push(payload);
        return new Promise((resolve) => { release = () => resolve({ insights: 0 }); });
      },
    });
    coordinator.start();

    // Dispatch happens on a microtask, so every emit is followed by a flush.
    const emitSegment = async (appName, windowTitle, frames) => {
      indexer.lastMeta = { appName, windowTitle };
      indexer.emit('context-switch', { appName, windowTitle, at: Date.now(), allowed: true });
      frames.forEach((frame) => indexer.emit('frame', frame));
      await sleep(20);
    };
    const frameAt = (offsetMs, appName, windowTitle, text) => ({
      frameId: `x${offsetMs}`, sessionId: sessionRow.id, capturedAt: Date.now() - offsetMs,
      appName, windowTitle, ocrText: text, duplicate: false,
    });

    await emitSegment('Figma', 'Onboarding flow', [
      frameAt(60000, 'Figma', 'Onboarding flow', 'onboarding step one copy'),
      frameAt(30000, 'Figma', 'Onboarding flow', 'onboarding step two copy'),
      frameAt(0, 'Figma', 'Onboarding flow', 'onboarding step three copy'),
    ]);
    // Switching windows closes the previous segment and dispatches it.
    await emitSegment('Slack', '#design', [frameAt(0, 'Slack', '#design', 'looks good to me')]);
    assert('a closed segment is dispatched once', calls.length === 1, calls.length);
    assert('the dispatched batch carries the segment context',
      calls[0].segment.appName === 'Figma' && calls[0].batch.frameCount === 3, calls[0]?.segment);

    // Still in flight: the next segment must be DROPPED, not queued.
    await emitSegment('Notes', 'scratch', [
      frameAt(60000, 'Notes', 'scratch', 'a thought'),
      frameAt(0, 'Notes', 'scratch', 'another thought'),
    ]);
    await emitSegment('Mail', 'inbox', [frameAt(0, 'Mail', 'inbox', 'unread')]);
    assert('a batch arriving while busy is dropped, not queued',
      calls.length === 1 && coordinator.stats.droppedBusy >= 1,
      { calls: calls.length, dropped: coordinator.stats.droppedBusy }, 'assertion 6');
    release();
    await sleep(30);
    assert('the busy flag clears when the call finishes', coordinator.busy.size === 0);

    // Throttle: interval has not elapsed.
    await emitSegment('Terminal', 'zsh', [
      frameAt(60000, 'Terminal', 'zsh', 'npm run dev'),
      frameAt(0, 'Terminal', 'zsh', 'vite ready'),
    ]);
    await emitSegment('Xcode', 'proj', [frameAt(0, 'Xcode', 'proj', 'build succeeded')]);
    assert('the throttle holds the assistant back',
      calls.length === 1 && coordinator.stats.droppedThrottle >= 1,
      { dropped: coordinator.stats.droppedThrottle });

    config = briizyConfig.merge(config, {
      assistants: { insight: { enabled: true, intervalMs: 1, quietHours: { from: '00:00', to: '23:59' } } },
    });
    coordinator.lastRunAt.set('insight', 0);
    await emitSegment('Music', 'library', [
      frameAt(60000, 'Music', 'library', 'playlist'),
      frameAt(0, 'Music', 'library', 'now playing'),
    ]);
    await emitSegment('Photos', 'albums', [frameAt(0, 'Photos', 'albums', 'album')]);
    assert('quiet hours suppress dispatch',
      calls.length === 1 && coordinator.stats.droppedQuiet >= 1,
      { dropped: coordinator.stats.droppedQuiet });

    config = briizyConfig.merge(config, {
      assistants: { insight: { enabled: true, intervalMs: 1, quietHours: null } },
    });
    coordinator.lastRunAt.set('insight', 0);
    indexer.paused = true;
    await emitSegment('Preview', 'doc.pdf', [
      frameAt(60000, 'Preview', 'doc.pdf', 'page one'),
      frameAt(0, 'Preview', 'doc.pdf', 'page two'),
    ]);
    await emitSegment('Finder', 'Downloads', [frameAt(0, 'Finder', 'Downloads', 'files')]);
    assert('pausing stops analysis as well as capture', calls.length === 1, calls.length, 'I10');
    indexer.paused = false;

    config = briizyConfig.merge(config, { cloudTextAnalysisAllowed: false });
    coordinator.lastRunAt.set('insight', 0);
    await emitSegment('Pages', 'draft', [
      frameAt(60000, 'Pages', 'draft', 'paragraph one'),
      frameAt(0, 'Pages', 'draft', 'paragraph two'),
    ]);
    await emitSegment('Keynote', 'deck', [frameAt(0, 'Keynote', 'deck', 'slide')]);
    assert('with cloud analysis off, assistants are not dispatched at all',
      calls.length === 1, calls.length, 'I2');

    section('coordinator: segments that are not worth analysing');

    config = briizyConfig.merge(config, {
      cloudTextAnalysisAllowed: true,
      assistants: { insight: { enabled: true, intervalMs: 1 } },
    });
    coordinator.lastRunAt.set('insight', 0);
    // One frame, no elapsed time — a fly-through.
    await emitSegment('Calculator', 'calc', [frameAt(0, 'Calculator', 'calc', '42')]);
    await emitSegment('Weather', 'today', [frameAt(0, 'Weather', 'today', 'sunny')]);
    assert('a sub-20s segment is not dispatched', calls.length === 1, calls.length);

    coordinator.lastRunAt.set('insight', 0);
    // Long enough, but no OCR text at all.
    await emitSegment('Video', 'movie', [
      { frameId: 'v1', capturedAt: Date.now() - 60000, appName: 'Video', windowTitle: 'movie', ocrText: null },
      { frameId: 'v2', capturedAt: Date.now(), appName: 'Video', windowTitle: 'movie', ocrText: null },
    ]);
    await emitSegment('Music', 'playing', [frameAt(0, 'Music', 'playing', 'track')]);
    assert('a segment with no text is not dispatched', calls.length === 1, calls.length);

    assert('duplicate frames never reach an assistant', (() => {
      const before = coordinator.getStatus().segment?.frames || 0;
      indexer.emit('frame', { ...frameAt(0, 'Music', 'playing', 'track'), duplicate: true });
      return (coordinator.getStatus().segment?.frames || 0) === before;
    })());

    section('coordinator: context-switch debounce');

    assert('the debounce window is a real interval', CONTEXT_SWITCH_DEBOUNCE_MS >= 1000);

    // Alt-tabbing through a window is not a context. Announce a switch, then move
    // on before the debounce elapses: the fly-through must never commit.
    coordinator.segment = null;
    indexer.lastMeta = { appName: 'Dictionary', windowTitle: 'lookup' };
    indexer.emit('context-switch', {
      appName: 'Dictionary', windowTitle: 'lookup', at: Date.now(), allowed: true,
    });
    indexer.lastMeta = { appName: 'Figma', windowTitle: 'Onboarding flow' };
    await sleep(CONTEXT_SWITCH_DEBOUNCE_MS + 250);
    assert('a window that does not hold still never opens a segment',
      coordinator.segment === null, coordinator.segment?.appName);

    // The same announcement, held: this one commits.
    indexer.lastMeta = { appName: 'Dictionary', windowTitle: 'lookup' };
    indexer.emit('context-switch', {
      appName: 'Dictionary', windowTitle: 'lookup', at: Date.now(), allowed: true,
    });
    await sleep(CONTEXT_SWITCH_DEBOUNCE_MS + 250);
    assert('a window that does hold still opens a segment',
      coordinator.segment?.appName === 'Dictionary', coordinator.segment?.appName);

    assert('a denied context switch is ignored entirely', (() => {
      coordinator.segment = null;
      indexer.emit('context-switch', {
        appName: '1Password', windowTitle: 'Vault', at: Date.now(), allowed: false,
      });
      return coordinator.pendingSwitch === null;
    })(), undefined, 'I3');

    coordinator.stop();
    assert('stopping unbinds every listener',
      indexer.listenerCount('frame') === 0 && indexer.listenerCount('context-switch') === 0);

    section('coordinator: provider failures stay contained');

    const failingIndexer = new EventEmitter();
    failingIndexer.paused = false;
    failingIndexer.lastMeta = { appName: 'Writer', windowTitle: 'Draft' };
    const failingConfig = briizyConfig.merge(briizyConfig.defaults(), {
      enabled: true,
      cloudTextAnalysisAllowed: true,
      assistants: { insight: { enabled: true, intervalMs: 1 } },
    });
    const failingCoordinator = new AssistantCoordinator({
      service, logger, indexer: failingIndexer, getConfig: () => failingConfig,
    });
    const assistantFailures = [];
    failingCoordinator.on('assistant-error', (event) => assistantFailures.push(event));
    failingCoordinator.register({
      id: 'insight',
      kind: 'insight',
      onSegmentClose: async () => {
        throw new Error('No encrypted API credential is configured for claude');
      },
    });
    failingCoordinator.start();

    let unhandledRejection = null;
    let failureStatus = null;
    const recordUnhandledRejection = (reason) => { unhandledRejection = reason; };
    process.on('unhandledRejection', recordUnhandledRejection);
    try {
      const failureStartedAt = Date.now();
      failingIndexer.emit('frame', {
        frameId: 'credential-failure-1', sessionId: sessionRow.id,
        capturedAt: failureStartedAt - 30000, appName: 'Writer', windowTitle: 'Draft',
        ocrText: 'A paragraph that needs review.', duplicate: false,
      });
      failingIndexer.emit('frame', {
        frameId: 'credential-failure-2', sessionId: sessionRow.id,
        capturedAt: failureStartedAt, appName: 'Writer', windowTitle: 'Draft',
        ocrText: 'A second paragraph that needs review.', duplicate: false,
      });
      failingIndexer.emit('frame', {
        frameId: 'credential-failure-3', sessionId: sessionRow.id,
        capturedAt: failureStartedAt + 1, appName: 'Finder', windowTitle: 'Documents',
        ocrText: 'Documents folder.', duplicate: false,
      });
      await sleep(30);
      failureStatus = failingCoordinator.getStatus();
    } finally {
      process.off('unhandledRejection', recordUnhandledRejection);
      failingCoordinator.stop();
    }

    assert('a missing provider credential never creates a process-level rejection',
      unhandledRejection === null, unhandledRejection?.message);
    assert('a failed assistant leaves capture running and clears its busy state',
      failureStatus?.running === true && failureStatus.busy.length === 0
      && failureStatus.stats.errors === 1, failureStatus);
    assert('a failed assistant publishes a nonfatal error event',
      assistantFailures.length === 1
      && assistantFailures[0].assistantId === 'insight'
      && /No encrypted API credential/.test(assistantFailures[0].error?.message || ''), assistantFailures);

    section('dedupe key normalization');

    assert('the same sentence yields the same key',
      normalizeKey('Ship the staging deploy!') === normalizeKey('ship the STAGING deploy'));
    assert('different sentences yield different keys',
      normalizeKey('Ship the deploy') !== normalizeKey('Review the PR'));
    assert('the key is bounded', normalizeKey('word '.repeat(200)).length <= 200);

    section('goals');

    const goal = service.createBriizyGoal({ title: 'Ship briizy', detail: 'end to end' }).row;
    assert('a goal starts active', goal.status === 'active');
    assert('goals list', service.listBriizyGoals({ status: 'active' }).some((g) => g.id === goal.id));
    assert('a goal can be updated',
      service.updateBriizyGoal(goal.id, { status: 'achieved' }).row.status === 'achieved');
    assert('a goal can be archived', (() => {
      service.archiveBriizyGoal(goal.id);
      return !service.listBriizyGoals({}).some((g) => g.id === goal.id);
    })());

    section('I9 — none of Phase 4 queues screen data for Firestore');

    const queued = service.db.prepare('SELECT DISTINCT domain FROM sync_outbox').all().map((r) => r.domain);
    assert('no briizy or rewind domain is queued',
      !queued.some((domain) => /briizy|rewind/.test(domain)), queued, 'I9');
    assert('only tasks (from accepting a proposal) reached the outbox',
      queued.every((domain) => ['tasks', 'organizer', 'retainedText'].includes(domain)), queued, 'I9');
  } finally {
    service.close();
    sandbox.cleanup();
  }
}

module.exports = { run };
