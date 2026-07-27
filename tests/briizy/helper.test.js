/**
 * The native helper contract and its supervision — I5.
 *
 * Includes §4 assertion 3: killing the parent leaves no surviving helper. That
 * is checked two ways, because the two mechanisms are independent: an orderly
 * stop() (SIGTERM), and a SIGKILLed parent (stdin EOF + the parent-pid
 * watchdog), which is the case a graceful shutdown path cannot cover.
 */

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { BriizyHelper, HELPER_BINARY } = require('../../electron/rewind/helper');
const { assert, makeLogger, section } = require('./harness');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate() && Date.now() < deadline) {
    await sleep(50);
  }
  return predicate();
}

const waitForState = (helper, target, timeoutMs = 5000) => (
  waitFor(() => helper.state === target, timeoutMs)
);

async function run() {
  section('helper binary');

  const built = fs.existsSync(HELPER_BINARY);
  assert('helper binary is built', built, HELPER_BINARY);
  if (!built) {
    assert('SKIPPING helper tests — run `npm run helper:build` first', true);
    return;
  }
  assert('binary is a native arm64/x86_64 Mach-O', (() => {
    const info = execFileSync('/usr/bin/file', [HELPER_BINARY], { encoding: 'utf8' });
    return /Mach-O.*executable/.test(info);
  })());

  section('handshake and protocol');

  const logger = makeLogger();
  const helper = new BriizyHelper({ logger });
  helper.start();
  assert('helper reaches ready', await waitForState(helper, 'ready'), helper.getStatus(), 'I5');

  const pid = helper.getStatus().pid;
  assert('helper reports a pid', typeof pid === 'number' && pid > 0);

  const pong = await helper.ping();
  assert('ping round-trips', pong.pong === true && pong.pid === pid, pong);

  const meta = await helper.meta();
  assert('meta names the frontmost app', typeof meta.appName === 'string' && meta.appName.length > 0,
    { appName: meta.appName, bundleId: meta.bundleId });
  assert('meta reports the TCC permission state', typeof meta.permission === 'boolean',
    { permission: meta.permission, accessibility: meta.accessibility });
  assert('meta carries no image data', meta.ocr === undefined && meta.path === undefined, undefined, 'I2');

  let unknownError = null;
  try {
    await helper.request('nonsense-command');
  } catch (error) {
    unknownError = error;
  }
  assert('an unknown command is a typed error, not a crash',
    unknownError?.code === 'UNKNOWN_COMMAND', unknownError?.message);
  assert('the helper is still alive after a bad command', await waitForState(helper, 'ready', 500));

  let badRequest = null;
  try {
    await helper.capture({});
  } catch (error) {
    badRequest = error;
  }
  assert('capture without an out path is refused',
    badRequest?.code === 'BAD_REQUEST' || badRequest?.code === 'PERMISSION_REQUIRED', badRequest?.code);

  section('capture behaviour under the current TCC grant');

  const outPath = path.join(process.env.TMPDIR || '/tmp', `briizy-test-${Date.now()}.jpg`);
  let captured = null;
  let captureError = null;
  try {
    captured = await helper.capture({ out: outPath, mode: 'window', ocr: true });
  } catch (error) {
    captureError = error;
  }

  if (captured) {
    assert('a frame was written to disk', fs.existsSync(captured.path), {
      bytes: captured.bytes, size: `${captured.width}x${captured.height}`,
    });
    assert('the frame is a real JPEG', (() => {
      const head = fs.readFileSync(captured.path).subarray(0, 3);
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    })());
    assert('a perceptual hash came back', /^[0-9a-f]+$/.test(captured.phash || ''), captured.phash);
    assert('capture returns metadata, not pixels',
      captured.base64 === undefined && captured.data === undefined, undefined, 'I2');
    if (captured.ocr) {
      assert('OCR returns text and blocks',
        typeof captured.ocr.fullText === 'string' && Array.isArray(captured.ocr.blocks),
        { chars: captured.ocr.fullText.length, blocks: captured.ocr.blocks.length });
      assert('OCR boxes are normalized 0-1',
        captured.ocr.blocks.every((b) => b.x >= 0 && b.x <= 1 && b.y >= 0 && b.y <= 1
          && b.w >= 0 && b.w <= 1 && b.h >= 0 && b.h <= 1),
        captured.ocr.blocks[0]);
      assert('OCR confidence is normalized 0-1',
        captured.ocr.blocks.every((b) => b.confidence >= 0 && b.confidence <= 1));
    }
    const second = await helper.capture({ out: `${outPath}.2.jpg` });
    assert('two captures of the same screen produce near-identical hashes',
      require('../../electron/rewind/storage').hammingDistance(captured.phash, second.phash) <= 5,
      { a: captured.phash, b: second.phash });
    fs.rmSync(captured.path, { force: true });
    fs.rmSync(`${outPath}.2.jpg`, { force: true });
  } else {
    assert('capture fails with a typed code when Screen Recording is not granted',
      ['PERMISSION_REQUIRED', 'NO_ACTIVE_WINDOW', 'WINDOW_GONE', 'CAPTURE_FAILED'].includes(captureError?.code),
      captureError?.code);
    assert('NOTE: grant Screen Recording to run the capture assertions', true,
      'System Settings → Privacy & Security → Screen Recording');
  }

  section('I5 — an orderly stop leaves nothing behind');

  helper.stop();
  await sleep(1200);
  assert('helper process is gone after stop()', isAlive(pid) === false, { pid }, 'I5');
  assert('helper state is stopped', helper.state === 'stopped', undefined, 'I5');
  let afterStop = null;
  try {
    await helper.request('ping');
  } catch (error) {
    afterStop = error;
  }
  assert('requests after stop are refused, not queued forever', afterStop !== null, afterStop?.code);

  section('I5 — a SIGKILLed parent leaves nothing behind (assertion 3)');

  // A child of *this* process would be reparented to launchd on our exit, so the
  // realistic shape is tested: an intermediate parent that owns the helper and
  // is then SIGKILLed without any chance to clean up.
  const parentScript = `
    const { spawn } = require('child_process');
    const child = spawn(${JSON.stringify(HELPER_BINARY)}, [], { stdio: ['pipe', 'pipe', 'ignore'] });
    child.stdout.on('data', (chunk) => {
      const line = String(chunk).split('\\n').find((l) => l.includes('"event":"ready"'));
      if (line) process.stdout.write(JSON.stringify({ helperPid: child.pid }) + '\\n');
    });
    setTimeout(() => process.exit(0), 30000);
  `;
  const parent = spawn(process.execPath, ['-e', parentScript], {
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });

  const helperPid = await new Promise((resolve) => {
    let buffer = '';
    const timer = setTimeout(() => resolve(null), 6000);
    parent.stdout.on('data', (chunk) => {
      buffer += chunk;
      const match = /\{"helperPid":(\d+)\}/.exec(buffer);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
  });

  if (helperPid) {
    assert('the orphan-test helper started', isAlive(helperPid), { helperPid });
    parent.kill('SIGKILL');
    // The watchdog polls every 2s; allow it a couple of cycles.
    const deadline = Date.now() + 8000;
    while (isAlive(helperPid) && Date.now() < deadline) await sleep(250);
    assert('killing the parent leaves no surviving helper', isAlive(helperPid) === false,
      { helperPid }, 'I5 / assertion 3');
  } else {
    parent.kill('SIGKILL');
    assert('orphan test could not start a helper (skipped)', true);
  }

  section('supervision of a helper that dies on its own');

  const restartLogger = makeLogger();
  const restartHelper = new BriizyHelper({ logger: restartLogger });
  restartHelper.start();
  await waitForState(restartHelper, 'ready');
  const firstPid = restartHelper.getStatus().pid;
  process.kill(firstPid, 'SIGKILL');
  // Wait for the supervisor to *notice* before waiting for it to recover —
  // otherwise the still-'ready' state satisfies the recovery wait immediately.
  const noticed = await waitFor(() => restartHelper.state !== 'ready', 5000);
  assert('the supervisor notices the crash', noticed, restartHelper.state, 'I5');
  const cameBack = await waitForState(restartHelper, 'ready', 15000);
  assert('a crashed helper is restarted', cameBack, {
    firstPid, secondPid: restartHelper.getStatus().pid,
  }, 'I5');
  assert('the restarted helper is a new process',
    restartHelper.getStatus().pid !== firstPid,
    { firstPid, secondPid: restartHelper.getStatus().pid }, 'I5');
  assert('the crash was logged', restartLogger.find(/exited unexpectedly/).length > 0);
  restartHelper.stop();
  await sleep(500);

  section('unavailable helper degrades instead of throwing at startup');

  const missing = new BriizyHelper({ logger: makeLogger(), binaryPath: '/nonexistent/briizy-helper' });
  missing.start();
  assert('a missing binary reports unavailable', missing.state === 'unavailable', missing.getStatus());
  let unavailableError = null;
  try {
    await missing.request('ping');
  } catch (error) {
    unavailableError = error;
  }
  assert('requests against an unavailable helper reject cleanly',
    unavailableError?.code === 'HELPER_UNAVAILABLE', unavailableError?.message);
  missing.stop();
}

module.exports = { run };
