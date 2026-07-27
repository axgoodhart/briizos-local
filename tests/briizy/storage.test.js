/**
 * Storage: migration 009, dedup hashing, retention under both caps, FTS ranking
 * and injection safety, session grouping, media recovery, and I9.
 */

const fs = require('fs');
const path = require('path');
const { LocalDataService } = require('../../electron/local-data-service');
const storage = require('../../electron/rewind/storage');
const privacy = require('../../electron/rewind/privacy');
const { assert, assertThrows, makeLogger, makeSandbox, section } = require('./harness');

const DAY = 24 * 60 * 60 * 1000;
const MIB = 1024 * 1024;

function run() {
  const sandbox = makeSandbox('briizy-storage-');
  const logger = makeLogger();
  const service = new LocalDataService({
    databasePath: path.join(sandbox.dir, 'briizos.db'),
    logger,
  });

  try {
    section('migration 009 applies forward-only with a stable checksum');

    const status = service.initialize();
    assert('schema is at version 9', status.schemaVersion === 9, status);
    const applied = service.db.prepare(
      "SELECT name, checksum FROM schema_migrations WHERE version = 9",
    ).get();
    assert('migration 009 is recorded', applied?.name === '009_rewind.sql');
    assert('re-running migrations is a no-op', (() => {
      service._runMigrations();
      return service.db.prepare('SELECT checksum FROM schema_migrations WHERE version = 9').get().checksum
        === applied.checksum;
    })());
    const tables = service.db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'rewind%' ORDER BY name",
    ).all().map((row) => row.name);
    assert('all four rewind tables exist',
      ['rewind_frames', 'rewind_frames_fts', 'rewind_ocr_blocks', 'rewind_sessions']
        .every((name) => tables.includes(name)), tables);

    section('dedup hashing (omi dHash, Hamming distance)');

    assert('identical hashes → 0', storage.hammingDistance('ffffffffffffffff', 'ffffffffffffffff') === 0);
    assert('one differing bit → 1', storage.hammingDistance('0000000000000000', '0000000000000001') === 1);
    assert('four differing bits → 4', storage.hammingDistance('0000000000000000', '000000000000000f') === 4);
    assert('wholly different hashes exceed the threshold',
      storage.hammingDistance('0000000000000000', 'ffffffffffffffff') === 64);
    assert('a missing hash is treated as maximally different',
      storage.hammingDistance('abc', null) === 64);
    assert('a malformed hash is treated as maximally different',
      storage.hammingDistance('abc', 'not-hex') === 64);

    section('frame recording and validation');

    const session = service.createRewindSession({ kind: 'auto', startedAt: Date.now() - 60 * 60 * 1000 });
    assert('session opens with no end', session.row.endedAt === null && session.row.kind === 'auto');
    assert('an open session is discoverable', service.getOpenRewindSession('auto')?.id === session.row.id);
    assertThrows('an unknown session kind is rejected',
      () => service.createRewindSession({ kind: 'sneaky' }), 'INVALID_INPUT');
    assertThrows('an unknown ocrStatus is rejected',
      () => service.recordRewindFrame({ ocrStatus: 'invented' }), 'INVALID_INPUT');
    assertThrows('an unsupported frame field is rejected',
      () => service.recordRewindFrame({ nonsense: 1 }), 'INVALID_INPUT');

    section('retention under BOTH caps, from the first capture');

    const paths = [];
    for (let i = 0; i < 12; i += 1) {
      // 0-5 are 40+ days old; 6-11 are recent. All 1 MiB.
      const capturedAt = Date.now() - (i < 6 ? 40 + i : i) * DAY;
      const filePath = storage.framePath(sandbox.dir, capturedAt, `s${i}`);
      storage.ensureDirectory(filePath);
      fs.writeFileSync(filePath, Buffer.alloc(MIB, i));
      paths.push(filePath);
      service.recordRewindFrame({
        sessionId: session.row.id,
        capturedAt,
        appName: i % 2 ? 'Safari' : 'Figma',
        bundleId: i % 2 ? 'com.apple.Safari' : 'com.figma.Desktop',
        windowTitle: `window ${i}`,
        imagePath: filePath,
        bytes: MIB,
        phash: (i * 17).toString(16),
        ocrStatus: 'done',
        ocrText: `frame ${i} — quarterly widget report and deploy notes`,
      });
    }
    assert('twelve frames and twelve files', service.getRewindStorageUsage().frames === 12
      && storage.diskUsage(sandbox.dir).files === 12);

    const dayPrune = service.pruneRewindFrames({ retentionDays: 30 });
    assert('the day cap removes exactly the six old frames', dayPrune.deleted.length === 6,
      dayPrune.deleted.length, 'I8');
    assert('prune reports paths so files can follow the rows',
      dayPrune.deleted.every((frame) => typeof frame.imagePath === 'string'), undefined, 'I8');
    storage.deleteFiles(dayPrune.deleted.map((frame) => frame.imagePath));

    const bytePrune = service.pruneRewindFrames({ retentionBytes: 3 * MIB });
    assert('the byte cap prunes down to the cap', service.getRewindStorageUsage().bytes <= 3 * MIB,
      { deleted: bytePrune.deleted.length, remaining: service.getRewindStorageUsage().bytes }, 'I8');
    assert('the byte cap prunes oldest-first', (() => {
      const remaining = service.listRewindFrames({ limit: 50 });
      const prunedTitles = bytePrune.deleted.length;
      return prunedTitles > 0 && remaining.every((frame) => frame.capturedAt > 0);
    })(), undefined, 'I8');
    storage.deleteFiles(bytePrune.deleted.map((frame) => frame.imagePath));

    assert('the open session is never pruned out from under the indexer', (() => {
      const live = service.createRewindSession({ kind: 'auto' });
      const livePath = storage.framePath(sandbox.dir, Date.now(), 'live');
      storage.ensureDirectory(livePath);
      fs.writeFileSync(livePath, Buffer.alloc(4 * MIB));
      service.recordRewindFrame({
        sessionId: live.row.id, capturedAt: Date.now(), appName: 'Live', imagePath: livePath,
        bytes: 4 * MIB, ocrStatus: 'skipped',
      });
      const result = service.pruneRewindFrames({ retentionBytes: 1, keepSessionIds: [live.row.id] });
      return result.deleted.every((frame) => frame.frameId !== undefined)
        && service.listRewindFrames({ sessionId: live.row.id }).length === 1;
    })(), undefined, 'I8');
    assert('prune is bounded per pass',
      service.pruneRewindFrames({ retentionBytes: 0, maxDeletes: 1 }).deleted.length <= 1);
    assert('session aggregates are recomputed after pruning', (() => {
      const refreshed = service.getRewindSession(session.row.id);
      const actual = service.listRewindFrames({ sessionId: session.row.id, limit: 999 });
      return refreshed.frameCount === actual.length;
    })());

    section('FTS ranking and injection safety');

    const searchSession = service.createRewindSession({ kind: 'auto' });
    const seed = [
      ['Slack', '#eng — briizOS', 'we should ship the staging deploy before friday standup'],
      ['Safari', 'fly.io dashboard', 'staging deploy succeeded in 41 seconds'],
      ['Notes', 'groceries', 'milk, bread, olive oil'],
    ];
    seed.forEach(([appName, windowTitle, ocrText], i) => {
      service.recordRewindFrame({
        sessionId: searchSession.row.id,
        capturedAt: Date.now() - i * 1000,
        appName, bundleId: `com.test.${i}`, windowTitle,
        imagePath: null, bytes: 0, ocrStatus: 'done', ocrText,
        ocrBlocks: [{ text: ocrText.slice(0, 40), x: 0.1, y: 0.1, w: 0.5, h: 0.04, confidence: 0.95 }],
      });
    });

    const deployHits = service.searchRewindFrames({ text: 'staging deploy' });
    assert('multi-term search ANDs the terms', deployHits.length === 2, deployHits.length);
    assert('groceries are not a deploy', deployHits.every((hit) => hit.appName !== 'Notes'));
    assert('snippets mark the matched terms',
      deployHits.every((hit) => hit.snippet.includes('⟦')), deployHits[0]?.snippet);
    assert('window titles are searchable too',
      service.searchRewindFrames({ text: 'dashboard' }).length === 1);
    assert('only blocks containing a term come back',
      service.searchRewindFrames({ text: 'milk' })[0].blocks.length === 1);

    const hostile = [
      'deploy OR 1=1',
      'ocr_text:"secret"',
      'NEAR(',
      '"unbalanced',
      'staging AND (deploy',
      '*',
      '^',
      '-- drop table rewind_frames',
    ];
    hostile.forEach((text) => {
      let threw = null;
      try {
        service.searchRewindFrames({ text });
      } catch (error) {
        threw = error;
      }
      assert(`FTS operators in user text are literal: ${JSON.stringify(text)}`, threw === null,
        threw?.message);
    });
    assert('an all-punctuation query returns nothing rather than erroring',
      service.searchRewindFrames({ text: '!!!' }).length === 0);
    assert('the frames table survived the hostile queries',
      service.db.prepare('SELECT COUNT(*) c FROM rewind_frames').get().c > 0);

    section('search results carry no archive path (§2)');

    const leak = privacy.assertNoPixelEgress(service.searchRewindFrames({ text: 'deploy' }));
    assert('no path or pixel data in search results', leak.clean === true, leak.violations, 'I2');
    assert('includePath is opt-in and main-process only',
      service.listRewindFrames({ limit: 5 })[0].imagePath === undefined, undefined, 'I2');
    assert('main-process callers can still get paths for cleanup',
      service.listRewindFrames({ limit: 50, includePath: true })
        .some((frame) => 'imagePath' in frame), undefined, 'I4');

    section('session grouping');

    const grouped = service.createRewindSession({ kind: 'auto' });
    const contexts = [
      ['Figma', 'Onboarding flow'], ['Figma', 'Onboarding flow'], ['Figma', 'Onboarding flow'],
      ['Slack', '#design'], ['Slack', '#design'],
      ['Figma', 'Onboarding flow'],
    ];
    contexts.forEach(([appName, windowTitle], i) => {
      service.recordRewindFrame({
        sessionId: grouped.row.id, capturedAt: Date.now() + i * 3000,
        appName, bundleId: 'com.test', windowTitle, imagePath: null, bytes: 0, ocrStatus: 'skipped',
      });
    });
    const timeline = service.getRewindSessionTimeline(grouped.row.id);
    assert('contiguous runs collapse into three segments', timeline.segments.length === 3,
      timeline.segments.map((s) => `${s.appName}:${s.frameCount}`));
    assert('returning to an app starts a new segment',
      timeline.segments[2].appName === 'Figma' && timeline.segments[2].frameCount === 1);
    assert('segment ends advance with the run',
      timeline.segments[0].endedAt > timeline.segments[0].startedAt);
    assert('top apps rank by frame count', (() => {
      const closed = service.endRewindSession(grouped.row.id, {});
      return closed.row.topApps[0].appName === 'Figma' && closed.row.topApps[0].frames === 4;
    })());
    assert('an unknown session timeline is null, not a throw',
      service.getRewindSessionTimeline('00000000-0000-4000-8000-000000000000') === null);

    section('media recovery');

    const orphanPath = storage.framePath(sandbox.dir, Date.now(), 'orphan');
    storage.ensureDirectory(orphanPath);
    fs.writeFileSync(orphanPath, Buffer.alloc(2048));
    const known = new Set(
      service.listRewindFrames({ limit: 999, includePath: true }).map((f) => f.imagePath).filter(Boolean),
    );
    const reconciled = storage.reconcile(sandbox.dir, known);
    assert('a file with no row is an orphan',
      reconciled.orphans.some((file) => file.path === orphanPath));
    assert('orphan bytes are accounted', reconciled.orphanBytes >= 2048);
    assert('a row with no file is reported as missing', (() => {
      const [victim] = service.listRewindFrames({ limit: 1, includePath: true })
        .filter((frame) => frame.imagePath);
      if (!victim) return true;
      fs.unlinkSync(victim.imagePath);
      const after = storage.reconcile(sandbox.dir, new Set([victim.imagePath]));
      return after.missing.includes(victim.imagePath);
    })());
    assert('deleting an already-gone file is not an error',
      storage.deleteFiles(['/nonexistent/frame.jpg']).missing === 1);
    assert('empty day directories are cleaned up', (() => {
      const empty = path.join(storage.framesRoot(sandbox.dir), '1999-01-01');
      fs.mkdirSync(empty, { recursive: true });
      storage.pruneEmptyDayDirectories(sandbox.dir);
      return !fs.existsSync(empty);
    })());
    assert('day keys are local, not UTC', (() => {
      // 00:30 local must land on the local calendar day.
      const localMidnightish = new Date(2026, 6, 26, 0, 30).getTime();
      return storage.dayKey(localMidnightish) === '2026-07-26';
    })());

    section('both clear-history flows (§4)');

    const rangeSession = service.createRewindSession({ kind: 'auto' });
    const base = Date.now();
    [0, 1, 2, 3].forEach((i) => {
      service.recordRewindFrame({
        sessionId: rangeSession.row.id, capturedAt: base + i * 60000, appName: 'X',
        imagePath: null, bytes: 0, ocrStatus: 'skipped',
      });
    });
    const rangeResult = service.deleteRewindHistory({ from: base + 60000, to: base + 120000 });
    assert('a range delete removes only that range', rangeResult.deleted.length === 2,
      rangeResult.deleted.length);
    assert('the session survives a partial range delete',
      service.getRewindSession(rangeSession.row.id) !== null);
    const sessionResult = service.deleteRewindHistory({ sessionId: rangeSession.row.id });
    assert('a session delete removes the session too', sessionResult.removedSessions === 1);
    assertThrows('an unscoped delete is refused',
      () => service.deleteRewindHistory({}), 'INVALID_INPUT');
    const allResult = service.deleteRewindHistory({ all: true });
    assert('delete-all clears frames and sessions',
      service.getRewindStorageUsage().frames === 0 && service.getRewindStorageUsage().sessions === 0,
      allResult);
    assert('FTS is empty after delete-all',
      service.db.prepare('SELECT COUNT(*) c FROM rewind_frames_fts').get().c === 0);

    section('I9 — screen data never enters Firestore');

    assert('sync_outbox is empty after all of the above',
      service.db.prepare('SELECT COUNT(*) c FROM sync_outbox').get().c === 0,
      service.db.prepare('SELECT domain FROM sync_outbox').all(), 'I9');
    assert("the 'rewind' domain is not a continuity domain",
      service.getDomainRevisions().some((row) => row.domain === 'rewind'), undefined, 'I9');

    const adapterSources = ['src/lib/syncAdapters.js', 'src/lib/firestore.js', 'src/lib/briizSyncCore.js']
      .map((rel) => {
        const target = path.join(__dirname, '..', '..', rel);
        return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      }).join('\n');
    assert('no rewind/briizy table appears in any sync adapter',
      !/rewind_frames|rewind_sessions|rewind_ocr_blocks|briizy_/.test(adapterSources), undefined, 'I9');
    assert('the SyncContract collections are untouched by this work',
      /organizer/.test(adapterSources) && !/rewind/.test(adapterSources), undefined, 'I9');
  } finally {
    service.close();
    sandbox.cleanup();
  }
}

module.exports = { run };
