/**
 * The automatic framing cycle: active window → full display → active window.
 *
 * This stays a pure scheduler test. It uses a fake helper and storage service,
 * so it verifies the mode/session contract without reading the real screen.
 */

const { EventEmitter } = require('events');
const path = require('path');
const { RewindIndexer } = require('../../electron/rewind/indexer');
const briizyConfig = require('../../electron/rewind/config');
const { assert, makeLogger, makeSandbox, section } = require('./harness');

function makeService() {
  const sessions = [];
  const frames = [];
  let nextSession = 0;
  let nextFrame = 0;

  return {
    sessions,
    frames,
    createRewindSession({ kind, startedAt }) {
      const row = { id: `session-${++nextSession}`, kind, startedAt, frameCount: 0, bytes: 0 };
      sessions.push(row);
      return { row };
    },
    endRewindSession(id, { endedAt }) {
      const frameCount = frames.filter((frame) => frame.sessionId === id).length;
      return { row: { id, endedAt, frameCount, bytes: 0 } };
    },
    deleteRewindHistory() {},
    recordRewindFrame(input) {
      const row = { frameId: `frame-${++nextFrame}`, ...input };
      frames.push(row);
      return { row };
    },
    listRewindFrames() { return []; },
    pruneRewindFrames() { return { deleted: [], freedBytes: 0 }; },
  };
}

class FakeHelper extends EventEmitter {
  constructor(root) {
    super();
    this.root = root;
    this.requests = [];
  }

  getStatus() {
    return { state: 'ready', available: true, permission: true };
  }

  async capture({ mode }) {
    this.requests.push(mode);
    return {
      path: path.join(this.root, `${mode}-${this.requests.length}.jpg`),
      bytes: 1024,
      width: mode === 'window' ? 900 : 1920,
      height: mode === 'window' ? 600 : 1080,
      // Keeping each mode's hash stable proves that deduplication compares
      // against its own previous framing, not the immediately prior mode.
      phash: mode === 'window' ? '0000000000000000' : 'ffffffffffffffff',
    };
  }
}

async function run() {
  const sandbox = makeSandbox('briizy-indexer-');
  const logger = makeLogger();
  const helper = new FakeHelper(sandbox.dir);
  const service = makeService();
  const indexer = new RewindIndexer({
    helper,
    service,
    logger,
    powerMonitor: null,
    userDataPath: sandbox.dir,
  });
  const meta = {
    appName: 'Safari',
    bundleId: 'com.apple.Safari',
    windowTitle: 'Briizy framing test',
  };

  try {
    section('automatic screenshot framing');

    indexer.setConfig({ ...briizyConfig.defaults(), enabled: true, captureStrategy: 'alternate' });
    await indexer._captureOnce(1, meta, false);
    await indexer._captureOnce(2, meta, false);
    await indexer._captureOnce(3, meta, false);

    assert('automatic captures alternate window, display, window',
      JSON.stringify(helper.requests) === JSON.stringify(['window', 'display', 'window']), helper.requests);
    assert('mixed framing stays in one automatic session',
      service.sessions.length === 1 && service.sessions[0].kind === 'auto', service.sessions);
    assert('saved frames preserve their individual framing',
      JSON.stringify(service.frames.map((frame) => frame.captureMode)) === JSON.stringify(['window', 'display']),
      service.frames.map((frame) => frame.captureMode));
    assert('a repeated window frame dedupes against the previous window frame',
      indexer.getStatus().totals.duplicates === 1, indexer.getStatus().totals);
    assert('the next automatic screenshot returns to the full display',
      indexer.getStatus().nextCaptureMode === 'display'
        && indexer.getStatus().state === 'capturingDisplay', indexer.getStatus());
  } finally {
    sandbox.cleanup();
  }
}

module.exports = { run };
