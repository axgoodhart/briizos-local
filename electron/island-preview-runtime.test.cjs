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
