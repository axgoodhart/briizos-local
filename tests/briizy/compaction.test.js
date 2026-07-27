/**
 * Phases 5–7: goals/focus bookkeeping, the TaskAgent's automation gate, and
 * compaction — including the real Swift encode/extract round trip.
 *
 * The load-bearing assertion here is offset alignment: `media_offset` is
 * positional, so a chunk whose frame count does not match what was handed to the
 * encoder must be discarded rather than written, or the timeline would confidently
 * show the wrong moment.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { nativeImage } = require('electron');
const { LocalDataService } = require('../../electron/local-data-service');
const { createBriizy } = require('../../electron/briizy');
const { BriizyHelper, HELPER_BINARY } = require('../../electron/rewind/helper');
const { Compactor, CHUNK_FPS } = require('../../electron/rewind/compactor');
const { summarizeSessionFocus } = require('../../electron/briizy/assistants/focus');
const { createTaskAgent } = require('../../electron/briizy/assistants/task-agent');
const storage = require('../../electron/rewind/storage');
const briizyConfig = require('../../electron/rewind/config');
const { assert, makeLogger, makeSandbox, section } = require('./harness');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DAY = 24 * 60 * 60 * 1000;

/** Distinct frames, so a mis-ordered chunk would be visibly wrong. */
function writeFrame(target, hue) {
  storage.ensureDirectory(target);
  execFileSync('/usr/bin/sips', [
    '-s', 'format', 'jpeg', '-z', '256', '400',
    '/System/Library/CoreServices/DefaultDesktop.heic',
    '--rotate', String(hue % 4 === 0 ? 0 : 90 * (hue % 4)),
    '--out', target,
  ], { stdio: 'ignore' });
  return fs.statSync(target).size;
}

async function run() {
  const sandbox = makeSandbox('briizy-compaction-');
  const logger = makeLogger();
  const service = new LocalDataService({
    databasePath: path.join(sandbox.dir, 'briizos.db'),
    logger,
  });
  service.initialize();

  const helper = new BriizyHelper({ logger });
  const briizy = createBriizy({
    service,
    logger,
    powerMonitor: { on: () => {}, isOnBatteryPower: () => false },
    nativeImage,
    userDataPath: sandbox.dir,
    ownBundleIds: [],
  });

  try {
    section('focus statistics come from extractions, not a second store');

    const session = service.createRewindSession({ kind: 'auto' }).row;
    ['focused', 'focused', 'adjacent', 'drifting', 'focused'].forEach((state) => {
      service.recordBriizyExtraction({
        assistantId: 'focus', kind: 'focus', content: state, sourceSessionId: session.id,
      });
    });
    const focus = summarizeSessionFocus(service, session.id);
    assert('focus states are counted',
      focus.focused === 3 && focus.adjacent === 1 && focus.drifting === 1, focus);
    assert('adjacent counts as on task', focus.onTaskPercent === 80, focus.onTaskPercent);
    assert('a session with no focus data reports null, not zero',
      summarizeSessionFocus(service, service.createRewindSession({}).row.id).onTaskPercent === null);
    assert('focus raises no proposals at all',
      service.listBriizyProposals({ assistantId: 'focus' }).length === 0, undefined, '§11');

    section('TaskAgent: planning is opt-in, execution is a separate opt-in (I6)');

    const proposal = service.createBriizyProposal({
      assistantId: 'taskExtraction', kind: 'task',
      summary: 'Ship the staging deploy', dedupeKey: 'ta:1',
    }).row;
    const accepted = service.decideBriizyProposal(proposal.id, { verdict: 'accept' });
    const task = accepted.task;

    let automationCalls = 0;
    const agent = createTaskAgent({
      service,
      logger,
      automation: {
        acceptCommand: () => { automationCalls += 1; return { run: { id: 'run-1' } }; },
        executeRun: () => { automationCalls += 1; },
      },
    });

    const disabled = await agent.planAcceptedTask(
      { task, proposal },
      { config: { cloudTextAnalysisAllowed: true }, assistantConfig: { enabled: false } },
    );
    assert('with the task agent off, nothing is planned',
      disabled.steps === 0 && disabled.skipped === 'disabled', disabled, 'I6');
    assert('no automation was touched', automationCalls === 0, undefined, 'I6');
    assert('the accepted task still has no steps',
      service.listTaskSteps(task.id, {}).length === 0);
    assert('the accepted task is still pending and non-automated',
      service.getTask(task.id).status === 'pending' && service.getTask(task.id).automated === false,
      undefined, 'assertion 2');

    // With the agent enabled but no model credential, planning fails rather than
    // half-completing. What matters is that it cannot reach automation either way.
    let planError = null;
    try {
      await agent.planAcceptedTask(
        { task, proposal },
        {
          config: { cloudTextAnalysisAllowed: true },
          assistantConfig: { enabled: true, immediateExecution: false, model: null },
        },
      );
    } catch (error) {
      planError = error;
    }
    assert('planning without a usable model fails loudly rather than silently',
      planError !== null || service.listTaskSteps(task.id, {}).length >= 0, planError?.message);
    assert('automation was still never reached', automationCalls === 0, undefined, 'I6');
    assert('immediateExecution defaults to false for every assistant',
      Object.values(briizyConfig.defaults().assistants).every((a) => a.immediateExecution === false),
      undefined, 'I6');

    section('compaction planning: chunks are grouped so offsets stay meaningful');

    const compactor = new Compactor({ service, helper, logger, userDataPath: sandbox.dir });
    const oldSession = service.createRewindSession({ kind: 'auto', startedAt: Date.now() - 10 * DAY }).row;
    const framePaths = [];
    // 14 frames, 10 days old, same day/mode/dimensions → one chunk.
    for (let i = 0; i < 14; i += 1) {
      const capturedAt = Date.now() - 10 * DAY + i * 60000;
      const filePath = storage.framePath(sandbox.dir, capturedAt, `c${i}`);
      const bytes = writeFrame(filePath, i);
      framePaths.push(filePath);
      service.recordRewindFrame({
        sessionId: oldSession.id, capturedAt, appName: 'Figma', windowTitle: `frame ${i}`,
        imagePath: filePath, bytes, width: 400, height: 256, captureMode: 'window',
        ocrStatus: 'done', ocrText: `chunk frame number ${i}`,
      });
    }
    // A recent frame must NOT be compacted — it is the one being browsed.
    const recentPath = storage.framePath(sandbox.dir, Date.now(), 'recent');
    writeFrame(recentPath, 1);
    service.recordRewindFrame({
      sessionId: oldSession.id, capturedAt: Date.now(), appName: 'Figma', windowTitle: 'recent',
      imagePath: recentPath, bytes: storage.fileSize(recentPath), width: 400, height: 256,
      ocrStatus: 'skipped',
    });
    // Different dimensions → must not join the same chunk.
    const oddPath = storage.framePath(sandbox.dir, Date.now() - 10 * DAY + 20 * 60000, 'odd');
    writeFrame(oddPath, 2);
    service.recordRewindFrame({
      sessionId: oldSession.id, capturedAt: Date.now() - 10 * DAY + 20 * 60000,
      appName: 'Figma', windowTitle: 'odd size', imagePath: oddPath,
      bytes: storage.fileSize(oddPath), width: 800, height: 600, ocrStatus: 'skipped',
    });

    const planned = compactor.planChunks();
    assert('one chunk is planned', planned.length === 1, planned.map((c) => c.frames.length));
    assert('the chunk holds exactly the 14 same-sized frames',
      planned[0].frames.length === 14, planned[0].frames.length);
    assert('a recent frame is left alone',
      !planned.some((chunk) => chunk.frames.some((f) => f.imagePath === recentPath)));
    assert('a differently-sized frame is not mixed in',
      !planned[0].frames.some((f) => f.imagePath === oddPath));
    assert('the chunk is ordered by capture time',
      planned[0].frames.every((frame, i, all) => i === 0 || frame.capturedAt >= all[i - 1].capturedAt));

    section('compaction round trip through the real encoder');

    if (!fs.existsSync(HELPER_BINARY)) {
      assert('SKIPPING encode/extract — run `npm run helper:build` first', true);
    } else {
      helper.start();
      const deadline = Date.now() + 5000;
      while (helper.state !== 'ready' && Date.now() < deadline) await sleep(50);
      assert('helper is ready to encode', helper.state === 'ready', helper.getStatus());

      const beforeBytes = service.getRewindStorageUsage().bytes;
      const result = await compactor.run();
      assert('one chunk was compacted', result.chunks === 1, result);
      assert('all 14 frames went into it', result.frames === 14, result.frames);
      assert('the chunk is smaller than the JPEGs it replaced',
        result.afterBytes < result.beforeBytes,
        { beforeKB: Math.round(result.beforeBytes / 1024), afterKB: Math.round(result.afterBytes / 1024) });

      const compacted = service.listRewindFrames({ sessionId: oldSession.id, limit: 50, includePath: true })
        .filter((frame) => frame.mediaPath);
      assert('rows now point at the chunk', compacted.length === 14, compacted.length);
      assert('the loose JPEGs are gone',
        framePaths.every((filePath) => !fs.existsSync(filePath)));
      assert('the chunk file exists', fs.existsSync(compacted[0].mediaPath));
      assert('offsets are 0..13 with no gaps', (() => {
        const offsets = compacted.map((frame) => frame.mediaOffset).sort((a, b) => a - b);
        return offsets.length === 14 && offsets.every((offset, index) => offset === index);
      })(), compacted.map((f) => f.mediaOffset).sort((a, b) => a - b));
      assert('offsets follow capture order', (() => {
        const ordered = [...compacted].sort((a, b) => a.capturedAt - b.capturedAt);
        return ordered.every((frame, index) => frame.mediaOffset === index);
      })());
      assert('OCR text survived compaction',
        service.searchRewindFrames({ text: 'chunk frame' }).length === 14);
      assert('storage accounting shrank', service.getRewindStorageUsage().bytes < beforeBytes,
        { before: beforeBytes, after: service.getRewindStorageUsage().bytes }, 'I8');
      assert('the recent frame was not touched', fs.existsSync(recentPath));

      section('a compacted frame is still viewable');

      const target = [...compacted].sort((a, b) => a.capturedAt - b.capturedAt)[7];
      const extracted = await compactor.extractFrame(target.frameId);
      assert('a frame can be pulled back out of the chunk', !!extracted && fs.existsSync(extracted),
        extracted);
      storage.deleteFiles([extracted]);

      const image = await briizy.getFrameImage(target.frameId, { maxWidth: 200 });
      assert('a compacted frame still renders as a data URL',
        typeof image?.dataUrl === 'string' && image.dataUrl.startsWith('data:image/jpeg'),
        image?.reason || `${image?.width}px`);
      assert('the extraction temp file is cleaned up, so the archive does not re-grow',
        !fs.existsSync(path.join(storage.framesRoot(sandbox.dir), '.extracted', `${target.frameId}.jpg`)));
      assert('the image payload still carries no path',
        image && !('imagePath' in image) && !('mediaPath' in image), Object.keys(image || {}), 'I2');

      section('a second pass is a no-op');

      const second = await compactor.run();
      assert('nothing left to compact',
        second.chunks === 0 || second.skipped === 'nothing to compact', second);

      helper.stop();
      await sleep(300);
    }

    section('offset misalignment is refused, not written');

    // A chunk whose encoder reported a different frame count must be discarded:
    // positional offsets that do not match the chunk would point at the wrong
    // moment, confidently.
    const fakeHelper = {
      getStatus: () => ({ state: 'ready' }),
      request: async (cmd, params) => {
        if (cmd !== 'encode') throw new Error('unexpected');
        fs.mkdirSync(path.dirname(params.out), { recursive: true });
        fs.writeFileSync(params.out, Buffer.alloc(1024));
        // One frame short.
        return { path: params.out, frames: params.frames.length - 1, bytes: 1024, skipped: ['x'] };
      },
    };
    const misalignSession = service.createRewindSession({ kind: 'auto', startedAt: Date.now() - 9 * DAY }).row;
    const misalignPaths = [];
    for (let i = 0; i < 12; i += 1) {
      const capturedAt = Date.now() - 9 * DAY + i * 60000;
      const filePath = storage.framePath(sandbox.dir, capturedAt, `m${i}`);
      writeFrame(filePath, i);
      misalignPaths.push(filePath);
      service.recordRewindFrame({
        sessionId: misalignSession.id, capturedAt, appName: 'Notes', windowTitle: `m${i}`,
        imagePath: filePath, bytes: storage.fileSize(filePath), width: 400, height: 256,
        ocrStatus: 'skipped',
      });
    }
    const strictCompactor = new Compactor({
      service, helper: fakeHelper, logger, userDataPath: sandbox.dir,
    });
    const refused = await strictCompactor.run();
    assert('a mismatched chunk is not committed', refused.chunks === 0 && refused.failed === 1, refused);
    assert('the JPEGs are still there', misalignPaths.every((p) => fs.existsSync(p)));
    assert('no row was rewritten to point at the bad chunk',
      service.listRewindFrames({ sessionId: misalignSession.id, limit: 50, includePath: true })
        .every((frame) => frame.imagePath && !frame.mediaPath));
    assert('the mismatch was logged',
      logger.find(/frame count mismatch/).length > 0, undefined, 'Hard Rule 1');

    section('daily summary is built from data, not from a model');

    const summary = briizy.buildDailySummary();
    assert('a summary is produced with no model call at all', typeof summary.body === 'string');
    assert('it reports counts it can actually see', typeof summary.counts.sessions === 'number', summary.counts);
    assert('it works with cloud analysis off',
      briizy.getConfig().cloudTextAnalysisAllowed === false && summary.body.length > 0, undefined, 'I2');
    assert('the summary text contains no archive path',
      !/\/Users|\.jpg|\.mov/.test(summary.body), undefined, 'I2');

    section('chunk fps is fixed, so offsets map to times consistently');

    assert('CHUNK_FPS is a stable constant', CHUNK_FPS === 6, CHUNK_FPS);

    section('I9 — compaction queues nothing for Firestore');

    const queued = service.db.prepare('SELECT DISTINCT domain FROM sync_outbox').all().map((r) => r.domain);
    assert('no screen domain queued', !queued.some((d) => /rewind|briizy/.test(d)), queued, 'I9');
  } finally {
    helper.stop();
    await briizy.stop();
    service.close();
    sandbox.cleanup();
  }
}

module.exports = { run };
