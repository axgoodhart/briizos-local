/**
 * Test harness for the briizy suite (PLAN-BRIIZY.md §4).
 *
 * Why this is not vitest: every assertion here touches better-sqlite3, which is
 * rebuilt against Electron's ABI (`electron-rebuild` at postinstall), and the
 * frame-image assertions need `nativeImage`. Both require a real Electron main
 * process, so the suite runs as an Electron app entry with no window:
 *
 *   npm run test:briizy
 *
 * `npm run test:theme` stays on vitest — that code is pure renderer logic.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const results = [];
let currentSection = null;

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function section(title) {
  currentSection = title;
  process.stdout.write(`\n${COLORS.cyan}── ${title}${COLORS.reset}\n`);
}

/**
 * @param {string} label     what is being asserted, in plain language
 * @param {boolean} condition
 * @param {*} [detail]       shown on both pass and fail — the actual value
 * @param {string} [invariant] the invariant or assertion number this defends
 */
function assert(label, condition, detail, invariant) {
  const ok = !!condition;
  results.push({ section: currentSection, label, ok, invariant });
  const mark = ok ? `${COLORS.green}  ok  ${COLORS.reset}` : `${COLORS.red} FAIL ${COLORS.reset}`;
  const tag = invariant ? `${COLORS.dim}[${invariant}]${COLORS.reset} ` : '';
  const suffix = detail === undefined ? '' : ` ${COLORS.dim}${safeJson(detail)}${COLORS.reset}`;
  process.stdout.write(`${mark} ${tag}${label}${suffix}\n`);
  return ok;
}

/** Assert that `run` throws, and that the thrown error carries `code`. */
function assertThrows(label, run, code, invariant) {
  let thrown = null;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  const ok = !!thrown && (!code || thrown.code === code);
  return assert(label, ok, thrown ? { code: thrown.code, message: thrown.message } : 'did not throw', invariant);
}

function safeJson(value) {
  try {
    const json = JSON.stringify(value);
    return json && json.length > 300 ? `${json.slice(0, 300)}…` : json;
  } catch {
    return String(value);
  }
}

/** A silent logger that still records lines, so tests can assert on logging. */
function makeLogger({ echo = false } = {}) {
  const lines = [];
  const record = (level) => (category, message, data) => {
    lines.push({ level, category, message, data });
    if (echo) process.stdout.write(`   ${level} [${category}] ${message}\n`);
  };
  return {
    lines,
    debug: record('debug'),
    info: record('info'),
    warn: record('warn'),
    error: record('error'),
    find: (pattern) => lines.filter((line) => pattern.test(`${line.category} ${line.message}`)),
  };
}

/** Isolated userData directory per test file; removed on cleanup. */
function makeSandbox(prefix = 'briizy-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

function summarize() {
  const failed = results.filter((result) => !result.ok);
  const total = results.length;
  process.stdout.write(
    `\n${failed.length ? COLORS.red : COLORS.green}${total - failed.length}/${total} assertions passed${COLORS.reset}\n`,
  );
  if (failed.length) {
    failed.forEach((result) => {
      process.stdout.write(`  ${COLORS.red}✗${COLORS.reset} ${result.section} → ${result.label}\n`);
    });
  }
  return failed.length === 0;
}

module.exports = { assert, assertThrows, makeLogger, makeSandbox, results, section, summarize };
