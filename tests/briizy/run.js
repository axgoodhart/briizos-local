/**
 * briizy test runner — `npm run test:briizy`.
 *
 * Runs as an Electron app entry with no window, because the suite needs
 * better-sqlite3 (built against Electron's ABI) and nativeImage. Exits non-zero
 * on any failed assertion so it can gate a commit.
 *
 * Run one file:  npm run test:briizy -- privacy
 */

const { app } = require('electron');

const SUITES = [
  { name: 'privacy', module: './privacy.test' },
  { name: 'storage', module: './storage.test' },
  { name: 'helper', module: './helper.test' },
  { name: 'runtime', module: './runtime.test' },
  { name: 'shell', module: './shell.test' },
  { name: 'assistants', module: './assistants.test' },
  { name: 'compaction', module: './compaction.test' },
];

const { summarize } = require('./harness');

async function main() {
  const filters = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const selected = filters.length
    ? SUITES.filter((suite) => filters.some((filter) => suite.name.includes(filter)))
    : SUITES;

  if (!selected.length) {
    process.stdout.write(`No suite matches ${filters.join(', ')}. Available: ${SUITES.map((s) => s.name).join(', ')}\n`);
    return false;
  }

  for (const suite of selected) {
    process.stdout.write(`\n\x1b[1m═══ ${suite.name} ═══\x1b[0m\n`);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    await require(suite.module).run();
  }

  return summarize();
}

app.whenReady().then(main).then(
  (passed) => app.exit(passed ? 0 : 1),
  (error) => {
    process.stderr.write(`\nSuite crashed: ${error?.stack || error}\n`);
    app.exit(1);
  },
);
