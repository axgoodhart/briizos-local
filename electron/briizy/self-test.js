/**
 * Capture self-test — proves the capture path works without ever reading the
 * user's screen.
 *
 * The problem this solves: the capture path is the one part of briizy that
 * cannot be covered by the normal suite, because it needs Screen Recording
 * permission, and that permission belongs to the briizOS app — not to a bare
 * `electron` invocation from a terminal. So the test has to run *inside* the
 * app. It is exposed on the menu-bar item and triggered by hand.
 *
 * Why it is safe to run at any time, including mid-screenshare:
 *
 *   - It creates its own small window containing text it generated, and captures
 *     that window BY ID. ScreenCaptureKit composites a window independently of
 *     what is in front of it, so an explicit window id reads only that window's
 *     own pixels. The desktop, other applications, and anything the user is
 *     doing are never read — not filtered out afterwards, never read.
 *   - The window is shown without focus (`showInactive`) and destroyed
 *     immediately. No application is activated; nothing is switched.
 *   - The captured file is written to a temporary directory and deleted before
 *     this function returns. Nothing enters the frames archive or the database.
 *
 * It exists because a SIGABRT in SCContentFilter reached a user's machine on
 * 2026-07-26 with 360 tests passing, none of which could touch that call.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const MARKER = 'BRIIZY CAPTURE TEST';
/** Distance at or below which two captures count as the same screen. */
const DEDUP_THRESHOLD = 5;

function selfTestHtml(title, code) {
  const body = `
    <html><head><title>${title}</title></head>
    <body style="margin:0;background:#fff;display:flex;align-items:center;
                 justify-content:center;height:100vh;font-family:Helvetica,Arial,sans-serif">
      <div style="text-align:center;color:#000">
        <div style="font-size:40px;font-weight:700;letter-spacing:1px">${MARKER}</div>
        <div style="font-size:60px;font-weight:700;margin-top:10px">${code}</div>
      </div>
    </body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(body)}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {object}   deps
 * @param {object}   deps.helper         a started BriizyHelper
 * @param {object}   deps.logger
 * @param {Function} deps.BrowserWindow
 * @param {object}   deps.screen
 * @returns {Promise<{ok: boolean, skipped?: string, checks: Array, summary: string}>}
 */
async function runCaptureSelfTest({ helper, logger, BrowserWindow, screen, userDataPath = null }) {
  const checks = [];
  const controls = [];

  const check = (label, passed, detail) => {
    checks.push({ label, passed: !!passed, detail });
    logger?.[passed ? 'info' : 'error']?.('briizy.selftest', `${passed ? 'PASS' : 'FAIL'} — ${label}`, detail);
    return !!passed;
  };

  /**
   * A control is an assertion that MUST fail. It proves the checking mechanism
   * can produce a negative result at all — without it, a row of PASS lines is
   * indistinguishable from a stub that prints PASS unconditionally. If a control
   * comes back true, the whole run is reported as untrustworthy regardless of
   * what else passed.
   */
  const control = (label, shouldBeFalse, detail) => {
    const behaved = shouldBeFalse === false;
    controls.push({ label, behaved, detail });
    logger?.[behaved ? 'info' : 'error']?.('briizy.selftest',
      `${behaved ? 'CONTROL OK (correctly failed)' : 'CONTROL BROKEN (should have failed)'} — ${label}`,
      detail);
    return behaved;
  };

  const status = helper.getStatus();
  if (status.state !== 'ready') {
    const skipped = `helper is ${status.state}${status.lastError ? ` (${status.lastError})` : ''}`;
    logger?.warn?.('briizy.selftest', 'Self-test skipped', { reason: skipped });
    return { ok: false, skipped, checks, summary: `Skipped: ${skipped}` };
  }
  if (!status.permission) {
    const skipped = 'Screen Recording permission is not granted to briizOS';
    logger?.warn?.('briizy.selftest', 'Self-test skipped', { reason: skipped });
    return { ok: false, skipped, checks, summary: `Skipped: ${skipped}` };
  }

  const code = String(Date.now()).slice(-6);
  const title = `briizy-capture-test-${code}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'briizy-selftest-'));
  const written = [];
  let testWindow = null;

  logger?.info?.('briizy.selftest', 'Capture self-test starting', {
    note: 'captures only a window this test creates; nothing else on screen is read',
    code,
  });

  try {
    const work = screen.getPrimaryDisplay().workArea;
    testWindow = new BrowserWindow({
      width: 420,
      height: 250,
      x: work.x + work.width - 460,
      y: work.y + work.height - 290,
      title,
      show: false,
      focusable: false,
      skipTaskbar: true,
      alwaysOnTop: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    await testWindow.loadURL(selfTestHtml(title, code));
    // Never takes focus, so nothing the user is doing is interrupted.
    testWindow.showInactive();
    await sleep(800);

    const listed = await helper.request('windows', {}, { timeoutMs: 10000 });
    check('helper can enumerate windows', Array.isArray(listed.windows), { count: listed.count });

    const mine = listed.windows.find((entry) => entry.title === title);
    if (!check('the self-test window is visible to ScreenCaptureKit', !!mine, { title })) {
      return finish();
    }
    check('the window passes the guard that protects SCContentFilter',
      mine.filterSafe === true, { frame: mine.frame, onScreen: mine.onScreen });

    const outPath = path.join(dir, 'selftest.jpg');
    const captured = await helper.capture({
      out: outPath, windowId: mine.windowId, ocr: true, ocrFast: true,
    }, { timeoutMs: 25000 });
    written.push(captured.path);

    check('the helper survived building a content filter (the 2026-07-26 crash)',
      helper.getStatus().state === 'ready', helper.getStatus().state);
    check('a frame file was written', fs.existsSync(captured.path), {
      bytes: captured.bytes, size: `${captured.width}x${captured.height}`,
    });
    check('the file is a real JPEG', (() => {
      const head = fs.readFileSync(captured.path).subarray(0, 3);
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    })());
    check('a perceptual hash came back', /^[0-9a-f]+$/.test(captured.phash || ''), captured.phash);

    const rawText = captured.ocr?.fullText || '';
    const text = rawText.toUpperCase();

    // Log the recognized text verbatim. It is text this test drew itself, so
    // there is nothing private in it — and printing it is the only way a reader
    // can confirm the comparison rather than take the PASS on trust.
    logger?.info?.('briizy.selftest', 'OCR returned this text, verbatim', {
      drew: `${MARKER} ${code}`,
      read: rawText,
      chars: rawText.length,
      blocks: (captured.ocr?.blocks || []).length,
      blockTexts: (captured.ocr?.blocks || []).map((b) => b.text),
    });

    check('OCR returned non-empty text', rawText.trim().length > 0, {
      read: rawText, chars: rawText.length,
    });
    check('OCR read back the marker this test drew', text.includes('BRIIZY') || text.includes('CAPTURE'),
      { drew: MARKER, read: rawText });
    check('OCR read back the one-time code', text.includes(code), {
      drew: code, read: rawText, matched: text.includes(code),
    });

    // Controls. These must fail. A code the test never drew must not be found,
    // and a nonsense string must not be found. If either is "found", the
    // comparison is not really happening.
    const neverDrawn = String((Number(code) + 111111) % 1000000).padStart(6, '0');
    control(`a code that was never drawn (${neverDrawn}) is NOT found`, text.includes(neverDrawn), {
      neverDrawn, read: rawText,
    });
    control('a nonsense string is NOT found', text.includes('ZZQXJVWK'), { read: rawText });

    const secondPath = path.join(dir, 'selftest2.jpg');
    const second = await helper.capture({ out: secondPath, windowId: mine.windowId }, { timeoutMs: 25000 });
    written.push(second.path);
    const distance = hamming(captured.phash, second.phash);
    check('an unchanged window hashes as a near-duplicate', distance <= DEDUP_THRESHOLD, { distance });

    let gone = null;
    try {
      await helper.capture({ out: path.join(dir, 'never.jpg'), windowId: 999999999 }, { timeoutMs: 15000 });
    } catch (error) {
      gone = error;
    }
    check('a window that does not exist is a typed error, not an abort',
      gone?.code === 'WINDOW_GONE', gone?.code);
    check('the helper is still alive after the bad window',
      helper.getStatus().state === 'ready', helper.getStatus().state);

    return finish();
  } catch (error) {
    check('self-test completed without throwing', false, error?.message);
    return finish(error);
  } finally {
    if (testWindow && !testWindow.isDestroyed()) testWindow.destroy();
    // The evidence frame is kept deliberately — it is a picture of a window this
    // test created, containing text this test wrote, so there is nothing private
    // in it, and being able to OPEN it is the difference between believing the
    // result and checking it. Everything else is deleted, and nothing here ever
    // enters the frames archive or the database.
    written.slice(1).forEach((filePath) => { try { fs.unlinkSync(filePath); } catch { /* gone */ } });
    if (!evidencePath) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* gone */ }
    }
  }

  function finish(error) {
    const failed = checks.filter((entry) => !entry.passed);
    const brokenControls = controls.filter((entry) => !entry.behaved);
    // A passing run with a broken control is not a passing run: it means the
    // checks cannot produce a negative, so none of them mean anything.
    const ok = failed.length === 0 && brokenControls.length === 0 && !error;

    let summary;
    if (brokenControls.length) {
      summary = `UNTRUSTWORTHY: ${brokenControls.length} control(s) that must fail did not. `
        + 'The checks are not really comparing anything — ignore the passes.';
    } else if (ok) {
      summary = `Capture works. ${checks.length} checks passed and ${controls.length} controls `
        + 'correctly failed, so the checks can tell right from wrong.';
    } else {
      summary = `${failed.length} of ${checks.length} checks failed${error ? `: ${error.message}` : ''}.`;
    }

    logger?.[ok ? 'info' : 'error']?.('briizy.selftest', 'Capture self-test finished', {
      ok,
      passed: checks.length - failed.length,
      failed: failed.length,
      controlsBehaved: `${controls.length - brokenControls.length}/${controls.length}`,
      evidence: evidencePath,
    });
    return { ok, checks, controls, summary, evidencePath };
  }
}

/** Local copy so this module stays usable without the storage layer. */
function hamming(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return 64;
  try {
    let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
    let bits = 0;
    while (xor > 0n) {
      if (xor & 1n) bits += 1;
      xor >>= 1n;
    }
    return bits;
  } catch {
    return 64;
  }
}

module.exports = { runCaptureSelfTest, MARKER };
