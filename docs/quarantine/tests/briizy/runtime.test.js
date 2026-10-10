/**
 * The briizy runtime end to end: onboarding, session cards, the IPC-facing
 * surface, frame images, and graceful degradation when capture is off
 * (§4 assertion 4).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { nativeImage } = require('electron');
const { LocalDataService } = require('../../electron/local-data-service');
const { createBriizy } = require('../../electron/briizy');
const { CHANNELS, FORWARDED_EVENTS, registerBriizyIPC } = require('../../electron/briizy-ipc');
const storage = require('../../electron/rewind/storage');
const privacy = require('../../electron/rewind/privacy');
const { assert, makeLogger, makeSandbox, section } = require('./harness');

/** A real screenshot-sized JPEG, so nativeImage has something valid to resize. */
function writeRealJpeg(target, size = 1400) {
  storage.ensureDirectory(target);
  execFileSync('/usr/bin/sips', [
    '-s', 'format', 'jpeg', '-z', String(Math.round(size * 0.64)), String(size),
    '/System/Library/CoreServices/DefaultDesktop.heic', '--out', target,
  ], { stdio: 'ignore' });
  return fs.statSync(target).size;
}

async function run() {
  const sandbox = makeSandbox('briizy-runtime-');
  const logger = makeLogger();
  const service = new LocalDataService({
    databasePath: path.join(sandbox.dir, 'briizos.db'),
    logger,
  });
  service.initialize();

  const briizy = createBriizy({
    service,
    logger,
    powerMonitor: { on: () => {}, isOnBatteryPower: () => false },
    nativeImage,
    userDataPath: sandbox.dir,
    ownBundleIds: ['com.briizos.app'],
  });

  try {
    section('I10 — nothing is silently enabled');

    briizy.start();
    assert('capture is off on a fresh install', briizy.getConfig().enabled === false, undefined, 'I10');
    assert('the helper is not even spawned', briizy.helper.getStatus().pid === null, undefined, 'I10');
    assert('status says not onboarded', briizy.getStatus().onboarded === false, undefined, 'I10');
    assert('startup logged that capture is off',
      logger.find(/Capture is off/).length > 0, undefined, 'Hard Rule 1');

    const onboarded = briizy.completeOnboarding({ enabled: false });
    assert('onboarding records when it happened', typeof onboarded.onboardedAt === 'number', undefined, 'I10');
    assert('onboarding without consent leaves capture off', onboarded.enabled === false, undefined, 'I10');
    assert('cloud text analysis stays off unless asked for',
      onboarded.cloudTextAnalysisAllowed === false, undefined, 'I2');
    assert('config survives a restart', (() => {
      briizy.setConfig({ retentionDays: 14, avatarVisible: false, avatarSizePx: 92 });
      const second = createBriizy({
        service, logger, powerMonitor: { on: () => {} }, nativeImage,
        userDataPath: sandbox.dir, ownBundleIds: [],
      });
      second.start();
      return second.getConfig().retentionDays === 14
        && second.getConfig().avatarVisible === false
        && second.getConfig().avatarSizePx === 92
        && second.getConfig().onboardedAt !== null;
    })(), undefined, 'I4');

    section('session cards — one per session, never one per frame');

    const start = Date.now() - 45 * 60 * 1000;
    const session = service.createRewindSession({ kind: 'auto', startedAt: start });
    const apps = ['Figma', 'Figma', 'Figma', 'Figma', 'Figma', 'Figma', 'Figma', 'Slack', 'Safari'];
    apps.forEach((appName, i) => {
      const capturedAt = start + i * 4 * 60 * 1000;
      const filePath = storage.framePath(sandbox.dir, capturedAt, `f${i}`);
      const bytes = writeRealJpeg(filePath);
      service.recordRewindFrame({
        sessionId: session.row.id, capturedAt, appName, bundleId: `com.${appName.toLowerCase()}`,
        windowTitle: `${appName} — onboarding flow ${i}`, imagePath: filePath, bytes,
        width: 1400, height: 896, phash: (i * 29).toString(16), ocrStatus: 'done',
        ocrText: `${appName} frame ${i}: reticulating splines for the onboarding flow`,
        ocrBlocks: [{ text: `${appName} frame ${i}`, x: 0.1, y: 0.2, w: 0.3, h: 0.05, confidence: 0.92 }],
      });
    });
    const closed = service.endRewindSession(session.row.id, { endedAt: start + 36 * 60 * 1000 });
    const card = briizy._postSessionCard(closed.row);

    assert('a card was posted', !!card?.postId, card?.row?.body);
    assert('the headline names the dominant app',
      /^Worked in Figma for 36 minutes$/.test(card.row.body), card.row.body);
    assert('the card is an auto-capture post authored by briizy',
      card.row.captureMode === 'auto' && card.row.authorType === 'agent'
      && card.row.authorAgentId === 'briizy');
    assert('the card carries the session range',
      card.row.sessionStart === closed.row.startedAt && card.row.sessionEnd === closed.row.endedAt);
    assert('exactly one auto card exists for nine frames',
      service.listNotefallPosts().filter((post) => post.captureMode === 'auto').length === 1);
    assert('re-posting updates the same card', (() => {
      const again = briizy._postSessionCard(service.getRewindSession(session.row.id));
      return again.postId === card.postId
        && service.listNotefallPosts().filter((post) => post.captureMode === 'auto').length === 1;
    })());
    assert('a spread-out session gets a different headline shape', (() => {
      const spread = service.createRewindSession({ kind: 'auto', startedAt: Date.now() - 20 * 60 * 1000 });
      ['Mail', 'Mail', 'Slack', 'Slack', 'Safari', 'Safari'].forEach((appName, i) => {
        service.recordRewindFrame({
          sessionId: spread.row.id, capturedAt: Date.now() - (20 - i * 3) * 60 * 1000,
          appName, imagePath: null, bytes: 0, ocrStatus: 'skipped',
        });
      });
      const spreadClosed = service.endRewindSession(spread.row.id, { endedAt: Date.now() });
      const spreadCard = briizy._postSessionCard(spreadClosed.row);
      return /across/.test(spreadCard.row.body);
    })());
    assert('a 5-second session gets no card', (() => {
      const stub = service.createRewindSession({ kind: 'auto', startedAt: Date.now() - 5000 });
      service.recordRewindFrame({
        sessionId: stub.row.id, capturedAt: Date.now(), appName: 'Terminal',
        imagePath: null, bytes: 0, ocrStatus: 'skipped',
      });
      return briizy._postSessionCard(service.endRewindSession(stub.row.id, {}).row) === null;
    })());

    section('what the Notefalls feed needs to render a session card');

    const sessions = briizy.listSessions({ limit: 50 });
    const listed = sessions.find((entry) => entry.id === session.row.id);
    assert('the card links back to its session', listed.notefallPostId === card.postId);
    assert('a cover frame is offered for the thumbnail', typeof listed.coverFrameId === 'string');
    assert('top apps are ranked', listed.topApps[0].appName === 'Figma');
    assert('the listing carries no archive path',
      privacy.assertNoPixelEgress(sessions).clean === true, undefined, 'I2');

    const timeline = briizy.getSessionTimeline(session.row.id);
    assert('the timeline segments the session by window', timeline.segments.length === 9,
      timeline.segments.length);
    assert('the timeline carries no archive path',
      privacy.assertNoPixelEgress(timeline).clean === true, undefined, 'I2');

    section('frame images cross IPC as bounded JPEG data URLs');

    const thumb = await briizy.getFrameImage(listed.coverFrameId, { maxWidth: 120 });
    assert('a thumbnail comes back as a data URL',
      typeof thumb.dataUrl === 'string' && thumb.dataUrl.startsWith('data:image/jpeg'),
      { width: thumb.width, bytes: thumb.bytes });
    assert('the thumbnail honours the requested width', thumb.width === 120, thumb.width);
    assert('a thumbnail is small enough to ship freely', thumb.bytes < 40 * 1024, thumb.bytes);
    const full = await briizy.getFrameImage(listed.coverFrameId, { full: true });
    assert('the full frame is larger than the thumbnail', full.bytes > thumb.bytes,
      { thumb: thumb.bytes, full: full.bytes });
    assert('a request wider than the source does not upscale',
      (await briizy.getFrameImage(listed.coverFrameId, { maxWidth: 5000 })).width === full.width,
      undefined, 'I2');
    assert('the image payload carries no path',
      !('imagePath' in thumb) && !('mediaPath' in thumb), Object.keys(thumb), 'I2');
    assert('a missing file is reported rather than thrown', await (async () => {
      const [victim] = service.listRewindFrames({
        sessionId: session.row.id, limit: 1, includePath: true,
      });
      fs.unlinkSync(victim.imagePath);
      const result = await briizy.getFrameImage(victim.frameId);
      return result.dataUrl === null && result.reason === 'missing';
    })());
    assert('an unknown frame id returns null, not a throw',
      (await briizy.getFrameImage('00000000-0000-4000-8000-000000000000')) === null);

    section('IPC surface shape');

    const handlers = new Map();
    const fakeIpc = {
      handle: (channel, fn) => handlers.set(channel, fn),
      removeHandler: (channel) => handlers.delete(channel),
    };
    const unregister = registerBriizyIPC({
      ipcMain: fakeIpc,
      BrowserWindow: { getAllWindows: () => [] },
      briizy,
      logger,
    });
    assert('every declared channel is registered',
      Object.values(CHANNELS).filter((channel) => channel !== CHANNELS.event)
        .every((channel) => handlers.has(channel)),
      handlers.size);
    const statusResponse = await handlers.get(CHANNELS.status)({});
    assert('handlers use the { ok, value } envelope',
      statusResponse.ok === true && typeof statusResponse.value.state === 'string');
    const badResponse = await handlers.get(CHANNELS.sessionTimeline)({}, 'not a valid id!!');
    assert('a bad argument becomes a typed error, not a crash',
      badResponse.ok === false && !!badResponse.error.code, badResponse.error);
    const imageResponse = await handlers.get(CHANNELS.frameImage)({}, listed.coverFrameId, {
      // A renderer trying to smuggle the path flag must not succeed.
      includePath: true, maxWidth: 100,
    });
    assert('the renderer cannot ask IPC for an archive path',
      imageResponse.ok && !('imagePath' in imageResponse.value), Object.keys(imageResponse.value), 'I2');
    assert('pipeline events are declared for forwarding',
      ['status', 'frame', 'session-card', 'proposal'].every((type) => FORWARDED_EVENTS.includes(type)));
    unregister();
    assert('unregister removes the handlers', handlers.size === 0);

    section('§4 assertion 4 — with capture off, everything else still works');

    briizy.setConfig({ enabled: false });
    assert('capture is off', briizy.getStatus().enabled === false);
    const manual = service.createNotefallPost({ body: 'manual post while capture is off' });
    assert('a manual Notefalls post still works', manual.row.captureMode === 'manual', undefined, 'I1');
    assert('the feed still lists posts', service.listNotefallPosts().length >= 2, undefined, 'I1');
    assert('tasks still work',
      !!service.createTask({ title: 'unrelated task' }).row.id, undefined, 'I1');
    assert('conversation memory still works',
      Array.isArray(service.listMemorySections()), undefined, 'I1');
    assert('search degrades to empty rather than throwing',
      Array.isArray(briizy.search({ text: 'anything at all' })), undefined, 'I1');
    assert('recent activity degrades to an empty digest',
      briizy.getRecentActivity(30).apps.length >= 0, undefined, 'I1');
    assert('status is still reportable with capture off',
      typeof briizy.getStatus().state === 'string');

    section('history deletion clears rows and files together');

    const before = storage.diskUsage(sandbox.dir);
    const cleared = briizy.deleteHistory({ all: true });
    assert('rows are gone', service.getRewindStorageUsage().frames === 0, cleared);
    assert('files are gone', storage.diskUsage(sandbox.dir).files === 0,
      { before: before.files, after: storage.diskUsage(sandbox.dir).files });
    assert('Notefalls posts survive history deletion',
      service.listNotefallPosts().length >= 2, undefined, 'I7');
    assert('the deletion was logged', logger.find(/History cleared|History deleted/).length > 0,
      undefined, 'Hard Rule 1');

    section('I9 — after all of that, no screen data is queued for Firestore');

    // The outbox legitimately holds 'tasks' from the assertion-4 section above:
    // tasks ARE a continuity domain. What must never appear is a screen domain.
    const queued = service.db.prepare('SELECT domain FROM sync_outbox').all().map((row) => row.domain);
    assert('no screen domain is queued for sync',
      !queued.some((domain) => /rewind|briizy/.test(domain)), queued, 'I9');
    assert('the domains that DO sync are the pre-existing continuity ones',
      queued.every((domain) => ['tasks', 'organizer', 'retainedText'].includes(domain)), queued, 'I9');
  } finally {
    await briizy.stop();
    service.close();
    sandbox.cleanup();
  }
}

module.exports = { run };
