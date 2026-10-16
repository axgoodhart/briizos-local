const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { _test } = require('./island-preview-runtime');

// Run with ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron --test electron/island-preview-runtime.test.cjs
async function project(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'briizos-island-preview-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('plain HTML projects use the owned static preview', async (t) => {
  const root = await project(t);
  await fs.writeFile(path.join(root, 'index.html'), '<h1>Picnic</h1>');
  assert.deepEqual(await _test.planPreview(root), {
    mode: 'static', servingRoot: root, entryRelPath: 'index.html',
  });
});

test('an installed plain Vite project uses its existing dev command', async (t) => {
  const root = await project(t);
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { dev: 'vite' },
    devDependencies: { vite: '^6.0.0' },
  }));
  assert.deepEqual(await _test.planPreview(root), {
    mode: 'managed', framework: 'vite', packageManager: 'npm', script: 'dev',
    args: ['run', 'dev'], env: {}, cwd: root,
  });
});

test('the preview runtime refuses to install missing project dependencies', async (t) => {
  const root = await project(t);
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({
    scripts: { dev: 'vite' },
    devDependencies: { vite: '^6.0.0' },
  }));
  await assert.rejects(_test.planPreview(root), { code: 'DEPENDENCIES_MISSING' });
});

test('an unrelated build folder is not treated as project identity', async (t) => {
  const root = await project(t);
  await fs.mkdir(path.join(root, 'build'));
  await fs.writeFile(path.join(root, 'build', 'index.html'), '<h1>Old export</h1>');
  await assert.rejects(_test.planPreview(root), { code: 'PROJECT_UNSUPPORTED' });
});

test('a Flask app with its own server file gets a dynamic local launch', async (t) => {
  const root = await project(t);
  await fs.writeFile(path.join(root, 'server.py'), 'from flask import Flask\napp = Flask(__name__)\n');
  assert.deepEqual(await _test.planPreview(root), {
    mode: 'managed', framework: 'flask', command: 'python3',
    args: ['-m', 'flask', '--app', 'server.py', 'run', '--host', '127.0.0.1', '--port', '{PORT}'],
    cwd: root,
    env: { FLASK_DEBUG: '0', PYTHONDONTWRITEBYTECODE: '1' },
    urlTemplate: 'http://127.0.0.1:{PORT}/',
  });
});

test('a remembered launch choice is parsed without evaluating a shell', async (t) => {
  const root = await project(t);
  const launch = {
    commandLine: 'python3 "little server.py" --port {PORT}',
    cwd: root,
    urlTemplate: 'http://127.0.0.1:{PORT}/hello',
  };
  assert.deepEqual(_test.splitCommandLine(launch.commandLine), ['python3', 'little server.py', '--port', '{PORT}']);
  assert.deepEqual(await _test.planPreview(root, launch), {
    mode: 'managed', framework: 'custom', command: 'python3',
    args: ['little server.py', '--port', '{PORT}'], cwd: root,
    env: {}, urlTemplate: 'http://127.0.0.1:{PORT}/hello', manual: true,
  });
});
