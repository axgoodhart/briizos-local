/**
 * The capture path — the one part of briizy the rest of the suite cannot reach.
 *
 * WHAT THIS DOES TO YOUR SCREEN: nothing. It runs the same self-test the menu
 * bar exposes, which creates its own window and captures that window BY ID.
 * ScreenCaptureKit composites a window independently of what is in front of it,
 * so nothing else on the display is read — not filtered afterwards, never read.
 * The window never takes focus and no application is activated.
 *
 * Opt-in, and excluded from `npm run test:briizy`, because it needs Screen
 * Recording permission — which belongs to the briizOS app, not to a bare
 * `electron` invocation. From a terminal it will almost always report SKIPPED;
 * the reliable way to run it is the menu bar item "Run capture self-test…"
 * inside the running app.
 *
 *     npm run test:briizy:capture
 */

const fs = require('fs');
const { BrowserWindow, screen } = require('electron');
const { BriizyHelper, HELPER_BINARY } = require('../../electron/rewind/helper');
const { runCaptureSelfTest } = require('../../electron/briizy/self-test');
const { assert, makeLogger, section } = require('./harness');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  section('capture self-test (needs Screen Recording; captures only its own window)');

  if (!fs.existsSync(HELPER_BINARY)) {
    assert('SKIPPED — helper not built (npm run helper:build)', true);
    return;
  }

  const logger = makeLogger();
  const helper = new BriizyHelper({ logger });
  helper.start();
  const deadline = Date.now() + 6000;
  while (helper.state !== 'ready' && Date.now() < deadline) await sleep(50);
  assert('helper is ready', helper.state === 'ready', helper.getStatus());

  try {
    const result = await runCaptureSelfTest({ helper, logger, BrowserWindow, screen });

    if (result.skipped) {
      assert(`SKIPPED — ${result.skipped}`, true, {
        how_to_run: 'menu bar → Run capture self-test…, inside the app that holds the grant',
        captured: 'nothing',
      });
      return;
    }

    // Surface each inner check as its own assertion so a failure names itself.
    result.checks.forEach((check) => {
      assert(check.label, check.passed, check.detail, 'capture path');
    });
    assert('the capture path works end to end', result.ok, result.summary, 'the SIGABRT regression');
  } finally {
    helper.stop();
    await sleep(300);
  }
}

module.exports = { run };
