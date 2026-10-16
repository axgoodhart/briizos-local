/**
 * Local project previews owned by briizOS.
 *
 * A renderer explicitly acquires a project when its Webview card is pressed.
 * Nothing is launched for visibility alone, and only processes created here
 * are ever stopped here.
 */
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');
const { app } = require('electron');
const { logger } = require('./logger');

const MAX_READY_PREVIEWS = 2;
const IDLE_STOP_MS = 2 * 60 * 1000;
const START_TIMEOUT_MS = 60 * 1000;
const PORT_START = 4400;
const PORT_END = 4999;
const CAPTURE_MAX_BYTES = 12 * 1024 * 1024;
const OUTPUT_LINES = 40;

const sessions = new Map(); // canonical project path -> session
const openings = new Map(); // canonical project path -> shared pending open
const capacityQueue = [];
const boundSenders = new Set();
const reservedPorts = new Set();
let reservedSlots = 0;
let drainingCapacity = false;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
};

function previewError(code, message, detail = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, detail);
  return error;
}

function exists(filePath) {
  try { fs.accessSync(filePath); return true; } catch { return false; }
}

async function canonicalProjectPath(input) {
  const requested = path.resolve(String(input || '').replace(/^~(?=$|\/)/, os.homedir()));
  let real;
  try { real = await fsp.realpath(requested); } catch {
    throw previewError('PROJECT_MISSING', 'The linked project folder is no longer available.', { projectPath: requested });
  }
  const stat = await fsp.stat(real);
  if (!stat.isDirectory() && !stat.isFile()) {
    throw previewError('PROJECT_UNSUPPORTED', 'The linked project is not a folder or web page.', { projectPath: real });
  }
  return real;
}

async function readJson(filePath) {
  try { return JSON.parse(await fsp.readFile(filePath, 'utf8')); } catch { return null; }
}

async function htmlNeedsBundler(filePath) {
  try {
    const handle = await fsp.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(16384);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      const html = buffer.subarray(0, bytesRead).toString('utf8');
      return /<script[^>]+src=["'][^"']*\.(tsx?|jsx|vue|svelte|mts)["']/i.test(html)
        || /<script[^>]+type=["']module["'][^>]+src=["']\.?\/src\//i.test(html)
        || /%PUBLIC_URL%/.test(html);
    } finally {
      await handle.close();
    }
  } catch {
    return false;
  }
}

function detectPackageManager(projectPath, pkg) {
  const declared = String(pkg?.packageManager || '').split('@')[0];
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(declared)) return declared;
  if (exists(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (exists(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (exists(path.join(projectPath, 'bun.lockb')) || exists(path.join(projectPath, 'bun.lock'))) return 'bun';
  return 'npm';
}

function runArgs(script) {
  return ['run', script];
}

async function usableStaticEntry(root, relPath) {
  const target = path.join(root, relPath);
  if (!exists(target) || await htmlNeedsBundler(target)) return null;
  return { mode: 'static', servingRoot: root, entryRelPath: relPath };
}

async function planPreview(projectPath) {
  const stat = await fsp.stat(projectPath);
  if (stat.isFile()) {
    if (!/\.html?$/i.test(projectPath)) throw previewError('PROJECT_UNSUPPORTED', 'This file is not a web page.');
    if (await htmlNeedsBundler(projectPath)) throw previewError('PROJECT_NEEDS_SERVER', 'This page needs its project development server.');
    return { mode: 'static', servingRoot: path.dirname(projectPath), entryRelPath: path.basename(projectPath) };
  }

  const pkg = await readJson(path.join(projectPath, 'package.json'));
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const scripts = pkg?.scripts || {};
  const packageManager = detectPackageManager(projectPath, pkg);
  const installed = exists(path.join(projectPath, 'node_modules'));
  const dev = String(scripts.dev || '').trim();
  const start = String(scripts.start || '').trim();
  const compound = /concurrently|&&|\|\||\bturbo\b|electron|wrangler|remotion|tsup|webpack|nodemon/i.test(dev);
  let managed = null;

  if (installed && deps.next && /^next\s+dev(?:\s|$)/.test(dev) && !compound) {
    managed = { mode: 'managed', framework: 'next', packageManager, script: 'dev', args: runArgs('dev'), env: {} };
  } else if (installed && deps.vite && /^vite(?:\s|$)/.test(dev) && !compound) {
    managed = { mode: 'managed', framework: 'vite', packageManager, script: 'dev', args: runArgs('dev'), env: {} };
  } else if (installed && deps['react-scripts'] && /react-scripts\s+start/.test(start)) {
    managed = { mode: 'managed', framework: 'cra', packageManager, script: 'start', args: runArgs('start'), env: { BROWSER: 'none' } };
  }
  if (managed) return { ...managed, cwd: projectPath };

  for (const dir of ['dist', 'build', 'out']) {
    const root = path.join(projectPath, dir);
    if (exists(path.join(root, 'index.html'))) return { mode: 'static', servingRoot: root, entryRelPath: 'index.html' };
  }

  const rootIndex = await usableStaticEntry(projectPath, 'index.html');
  if (rootIndex) return rootIndex;
  const rootFiles = await fsp.readdir(projectPath, { withFileTypes: true });
  const htmlFiles = rootFiles.filter((entry) => entry.isFile() && /\.html?$/i.test(entry.name));
  if (htmlFiles.length === 1) {
    const only = await usableStaticEntry(projectPath, htmlFiles[0].name);
    if (only) return only;
  }

  if (pkg && !installed && (deps.vite || deps.next || deps['react-scripts'])) {
    throw previewError('DEPENDENCIES_MISSING', 'This project needs its installed dependencies before it can open.', {
      projectPath,
      nextStep: `Install the project dependencies in ${projectPath}. briizOS did not install or change anything.`,
    });
  }
  if (deps.electron || /\belectron\b/i.test(dev) || /\belectron\b/i.test(start)) {
    throw previewError('PROJECT_IS_DESKTOP', 'This is a desktop app rather than an embeddable web project.', { projectPath });
  }
  throw previewError('PROJECT_UNSUPPORTED', 'briizOS could not identify a safe web preview command for this project.', {
    projectPath,
    nextStep: 'Use the Webview card with an ordinary address, or add a plain Vite, Next.js, or Create React App development script.',
  });
}

function tryBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

async function findFreePort() {
  const reserved = new Set([
    ...reservedPorts,
    ...[...sessions.values()].map((session) => session.port).filter(Boolean),
  ]);
  for (let port = PORT_START; port <= PORT_END; port += 1) {
    if (reserved.has(port)) continue;
    if (await tryBind(port, '127.0.0.1') && await tryBind(port, '0.0.0.0')) {
      reservedPorts.add(port);
      return port;
    }
  }
  throw previewError('NO_PREVIEW_PORT', 'briizOS could not find a free local preview port.');
}

function probe(url, timeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'briizOS-Islands-preview' } }, (response) => {
      response.resume();
      resolve(response.statusCode || 0);
    });
    request.once('timeout', () => request.destroy(new Error('timeout')));
    request.once('error', reject);
  });
}

function waitForReady(session) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    session.rejectReady = reject;
    const check = async () => {
      if (session.stopped) return reject(previewError('PREVIEW_STOPPED', 'The project preview was closed before it finished opening.'));
      try {
        const status = await probe(session.url);
        if (status > 0) return resolve(status);
      } catch { /* not listening yet */ }
      if (Date.now() - started >= START_TIMEOUT_MS) {
        return reject(previewError('PREVIEW_TIMEOUT', 'The project did not open in time.', { output: session.output.slice(-12) }));
      }
      session.probeTimer = setTimeout(check, 350);
    };
    check();
  });
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function launchArgs(plan, port) {
  const args = [...plan.args];
  if (plan.framework === 'vite') {
    if (plan.packageManager === 'npm') args.push('--');
    args.push('--port', String(port), '--strictPort', '--host', '127.0.0.1');
  } else if (plan.framework === 'next') {
    if (plan.packageManager === 'npm') args.push('--');
    args.push('-p', String(port), '-H', '127.0.0.1');
  }
  return args;
}

function appendOutput(session, chunk) {
  const lines = String(chunk || '').replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/).filter(Boolean);
  session.output.push(...lines);
  if (session.output.length > OUTPUT_LINES) session.output = session.output.slice(-OUTPUT_LINES);
}

function terminateChild(child) {
  if (!child || child.killed) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch { /* gone */ } }
  const timer = setTimeout(() => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ }
  }, 3000);
  timer.unref?.();
}

async function startManaged(session, plan) {
  const port = await findFreePort();
  if (session.stopped) {
    reservedPorts.delete(port);
    throw previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.');
  }
  const args = launchArgs(plan, port);
  const commandLine = [plan.packageManager, ...args].map(shellQuote).join(' ');
  const shell = process.env.SHELL && process.env.SHELL.startsWith('/') ? process.env.SHELL : '/bin/zsh';
  Object.assign(session, { port, url: `http://127.0.0.1:${port}/`, command: commandLine });
  reservedPorts.delete(port);
  const child = spawn(shell, ['-ilc', `exec ${commandLine}`], {
    cwd: plan.cwd,
    detached: true,
    env: { ...process.env, ...plan.env, PORT: String(port), BROWSER: plan.env?.BROWSER || 'none', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  Object.assign(session, { child, state: 'starting' });
  child.stdout.on('data', (chunk) => appendOutput(session, chunk));
  child.stderr.on('data', (chunk) => appendOutput(session, chunk));
  child.once('error', (error) => session.rejectReady?.(previewError('PREVIEW_START_FAILED', error.message, { output: session.output.slice(-12) })));
  child.once('exit', (code, signal) => {
    if (session.stopped) return;
    const early = session.state !== 'ready';
    session.stopped = true;
    sessions.delete(session.rootPath);
    clearTimeout(session.probeTimer);
    const error = previewError('PREVIEW_EXITED', early
      ? 'The project stopped before its page became available.'
      : 'The project preview stopped unexpectedly.', { exitCode: code, signal, output: session.output.slice(-12) });
    session.rejectReady?.(error);
    logger[early ? 'error' : 'warn']('island.preview', error.message, {
      project: session.rootPath, command: session.command, exitCode: code, signal, output: session.output.slice(-12),
      nextStep: 'Press the ladybug Retry control after reviewing this output.',
    });
    void drainCapacity();
  });

  logger.info('island.preview', 'Opening a local project for an Island Webview card', {
    project: session.rootPath, framework: plan.framework, command: commandLine, port,
  });
  const status = await waitForReady(session);
  session.rejectReady = null;
  session.state = 'ready';
  logger.info('island.preview', 'The local project answered and is now open in its Island card', {
    project: session.rootPath, url: session.url, httpStatus: status, viewers: session.consumers.size,
  });
}

function encodedPath(relPath) {
  return `/${String(relPath || '').split(path.sep).map(encodeURIComponent).join('/')}`;
}

async function sendStaticFile(root, entryRelPath, request, response) {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405).end();
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://local').pathname); } catch {
    response.writeHead(400).end('Bad path');
    return;
  }
  let relative = path.posix.normalize(`/${pathname}`).replace(/^\/+/, '');
  if (!relative) relative = entryRelPath;
  let target = path.resolve(root, relative);
  let stat = await fsp.stat(target).catch(() => null);
  if (stat?.isDirectory()) {
    target = path.join(target, 'index.html');
    stat = await fsp.stat(target).catch(() => null);
  }
  if ((!stat || !stat.isFile()) && String(request.headers.accept || '').includes('text/html')) {
    target = path.resolve(root, entryRelPath);
    stat = await fsp.stat(target).catch(() => null);
  }
  if (!stat?.isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  const real = await fsp.realpath(target);
  if (real !== root && !real.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Outside preview root');
    return;
  }
  const headers = {
    'Content-Type': MIME[path.extname(real).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
    'Last-Modified': stat.mtime.toUTCString(),
  };
  const range = request.headers.range;
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [from, to] = range.slice(6).split('-');
    const start = from ? Number(from) : Math.max(0, stat.size - Number(to || 0));
    const end = from && to ? Math.min(Number(to), stat.size - 1) : stat.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end();
      return;
    }
    response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(real, { start, end }).on('error', () => response.destroy()).pipe(response);
    return;
  }
  response.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(real).on('error', () => response.destroy()).pipe(response);
}

async function startStatic(session, plan) {
  const root = await fsp.realpath(plan.servingRoot);
  if (session.stopped) throw previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.');
  const server = http.createServer((request, response) => {
    sendStaticFile(root, plan.entryRelPath, request, response).catch((error) => {
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Preview error');
      logger.error('island.preview', 'A static Island preview could not serve one of its files', { project: session.rootPath, problem: error.message });
    });
  });
  session.server = server;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  if (session.stopped) throw previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.');
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  Object.assign(session, {
    port, state: 'ready',
    url: `http://127.0.0.1:${port}${plan.entryRelPath === 'index.html' ? '/' : encodedPath(plan.entryRelPath)}`,
  });
  logger.info('island.preview', 'Opened a local static project in an Island Webview card', {
    project: session.rootPath, page: path.join(root, plan.entryRelPath), url: session.url, viewers: session.consumers.size,
  });
}

async function stopSession(session, reason) {
  if (!session || session.stopped) return;
  session.stopped = true;
  session.state = 'stopped';
  clearTimeout(session.idleTimer);
  clearTimeout(session.probeTimer);
  sessions.delete(session.rootPath);
  session.rejectReady?.(previewError('PREVIEW_STOPPED', 'The project preview was closed before it finished opening.'));
  if (session.child) terminateChild(session.child);
  if (session.server) {
    const closing = new Promise((resolve) => session.server.close(resolve));
    session.server.closeAllConnections?.();
    await closing.catch(() => {});
  }
  logger.info('island.preview', 'Closed an Island project preview', {
    project: session.rootPath, reason, viewers: session.consumers.size,
  });
  void drainCapacity();
}

function oldestReleasedSession() {
  return [...sessions.values()]
    .filter((session) => session.consumers.size === 0 && !session.stopped)
    .sort((a, b) => a.lastUsedAt - b.lastUsedAt)[0] || null;
}

async function drainCapacity() {
  if (drainingCapacity) return;
  drainingCapacity = true;
  try {
    while (capacityQueue.length) {
      while (capacityQueue[0]?.opening.canceled) {
        const skipped = capacityQueue.shift();
        skipped.reject(previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.'));
      }
      if (!capacityQueue.length) break;
      if (sessions.size + reservedSlots < MAX_READY_PREVIEWS) {
        const next = capacityQueue.shift();
        reservedSlots += 1;
        next.opening.capacityWaiter = null;
        next.resolve();
        continue;
      }
      const idle = oldestReleasedSession();
      if (!idle) break;
      await stopSession(idle, 'made room for another project');
    }
  } finally {
    drainingCapacity = false;
  }
}

function reserveCapacity(opening) {
  return new Promise((resolve, reject) => {
    const waiter = { opening, resolve, reject };
    opening.capacityWaiter = waiter;
    capacityQueue.push(waiter);
    void drainCapacity();
  });
}

function releaseReservation() {
  reservedSlots = Math.max(0, reservedSlots - 1);
  void drainCapacity();
}

async function beginOpening(opening) {
  let reserved = false;
  let session = null;
  try {
    const plan = await planPreview(opening.rootPath);
    if (opening.canceled) throw previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.');
    await reserveCapacity(opening);
    reserved = true;
    if (opening.canceled) throw previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.');
    session = {
      rootPath: opening.rootPath,
      mode: plan.mode,
      consumers: opening.consumers,
      output: [],
      state: 'starting',
      stopped: false,
      lastUsedAt: Date.now(),
    };
    sessions.set(opening.rootPath, session);
    releaseReservation();
    reserved = false;
    if (plan.mode === 'static') await startStatic(session, plan);
    else await startManaged(session, plan);
    return { url: session.url, mode: session.mode, reused: false };
  } catch (error) {
    if (session && !session.stopped) await stopSession(session, 'opening failed');
    if (error?.code !== 'PREVIEW_CANCELED') {
      logger.error('island.preview', 'An Island project could not open', {
        project: opening.rootPath,
        problem: error?.message || String(error),
        errorCode: error?.code || 'PREVIEW_ERROR',
        output: error?.output || session?.output?.slice(-12) || [],
        nextStep: error?.nextStep || 'Press the ladybug Retry control after reviewing the project folder and command.',
      });
    }
    throw error;
  } finally {
    if (reserved) releaseReservation();
    openings.delete(opening.rootPath);
  }
}

function consumerId(sender, cardId) {
  return `${sender.id}:${String(cardId || '').slice(0, 160)}`;
}

function bindSender(sender) {
  if (boundSenders.has(sender.id)) return;
  boundSenders.add(sender.id);
  sender.once('destroyed', () => {
    releaseConsumerPrefix(`${sender.id}:`, 'the briizOS window closed');
    boundSenders.delete(sender.id);
  });
}

async function acquirePreview(sender, input = {}) {
  if (!input.cardId) throw previewError('CARD_REQUIRED', 'This Webview card has no identity.');
  const rootPath = await canonicalProjectPath(input.rootPath);
  const consumer = consumerId(sender, input.cardId);
  bindSender(sender);

  const live = sessions.get(rootPath);
  if (live && live.state === 'ready' && !live.stopped) {
    clearTimeout(live.idleTimer);
    live.consumers.add(consumer);
    live.lastUsedAt = Date.now();
    logger.info('island.preview', 'Reopened an already-ready project in its Island card', {
      project: rootPath, url: live.url, viewers: live.consumers.size,
    });
    return { url: live.url, mode: live.mode, reused: true };
  }

  let opening = openings.get(rootPath);
  if (!opening) {
    opening = { rootPath, consumers: new Set(), canceled: false, capacityWaiter: null, promise: null };
    openings.set(rootPath, opening);
    opening.promise = beginOpening(opening);
  }
  opening.consumers.add(consumer);
  logger.info('island.preview', 'An Island Webview card requested its local project', {
    project: rootPath, cardId: input.cardId, sharedOpening: opening.consumers.size > 1,
  });
  return opening.promise;
}

function releaseConsumerPrefix(prefix, reason, exact = false) {
  const matches = (id) => (exact ? id === prefix : id.startsWith(prefix));
  openings.forEach((opening) => {
    for (const id of [...opening.consumers]) if (matches(id)) opening.consumers.delete(id);
    if (opening.consumers.size === 0) {
      opening.canceled = true;
      if (opening.capacityWaiter) {
        const index = capacityQueue.indexOf(opening.capacityWaiter);
        if (index >= 0) capacityQueue.splice(index, 1);
        opening.capacityWaiter.reject(previewError('PREVIEW_CANCELED', 'The card was put away before its project opened.'));
        opening.capacityWaiter = null;
      }
      const starting = sessions.get(opening.rootPath);
      if (starting?.state === 'starting') void stopSession(starting, reason);
    }
  });

  sessions.forEach((session) => {
    let removed = false;
    for (const id of [...session.consumers]) {
      if (!matches(id)) continue;
      session.consumers.delete(id);
      removed = true;
    }
    if (!removed || session.consumers.size > 0 || session.stopped) return;
    session.lastUsedAt = Date.now();
    clearTimeout(session.idleTimer);
    session.idleTimer = setTimeout(() => void stopSession(session, 'warm return time ended'), IDLE_STOP_MS);
    session.idleTimer.unref?.();
    logger.info('island.preview', 'Returned an Island Webview card to its resting image', {
      project: session.rootPath, reason, warmForSeconds: IDLE_STOP_MS / 1000,
    });
  });
  void drainCapacity();
}

function releasePreview(sender, input = {}) {
  if (!input.cardId) return { ok: true };
  releaseConsumerPrefix(consumerId(sender, input.cardId), input.reason || 'the card returned to its preview', true);
  return { ok: true };
}

async function saveCapture(input = {}) {
  const cardId = String(input.cardId || '');
  const match = /^data:image\/(png|jpeg);base64,(.+)$/s.exec(String(input.dataUrl || ''));
  if (!cardId || !match) throw previewError('CAPTURE_INVALID', 'The Webview card did not provide a valid image.');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > CAPTURE_MAX_BYTES) {
    throw previewError('CAPTURE_TOO_LARGE', 'The Webview image was empty or too large to keep.');
  }
  const folder = path.join(app.getPath('userData'), 'Islands', 'Webview Previews');
  await fsp.mkdir(folder, { recursive: true });
  const safeId = cardId.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 160) || 'webview';
  const target = path.join(folder, `${safeId}.${match[1] === 'jpeg' ? 'jpg' : 'png'}`);
  const temporary = `${target}.new`;
  await fsp.writeFile(temporary, buffer);
  await fsp.rename(temporary, target);
  const capturedAt = new Date().toISOString();
  logger.info('island.preview', 'Updated an Island Webview card’s resting image', {
    cardId, image: target, bytes: buffer.length, capturedAt,
  });
  return { path: target, capturedAt };
}

function stopAllPreviews() {
  const count = sessions.size;
  for (const waiting of capacityQueue.splice(0)) {
    waiting.opening.canceled = true;
    waiting.reject(previewError('PREVIEW_STOPPED', 'briizOS is closing.'));
  }
  openings.forEach((opening) => { opening.canceled = true; });
  openings.clear();
  sessions.forEach((session) => {
    session.stopped = true;
    clearTimeout(session.idleTimer);
    clearTimeout(session.probeTimer);
    if (session.child) terminateChild(session.child);
    if (session.server) {
      session.server.close();
      session.server.closeAllConnections?.();
    }
  });
  sessions.clear();
  if (count) logger.info('island.preview', 'Closed every Island project preview because briizOS is quitting', { projectsClosed: count });
}

function registerIslandPreviewRuntime({ ipcMain }) {
  ipcMain.handle('island-preview-acquire', (event, input) => acquirePreview(event.sender, input || {}));
  ipcMain.handle('island-preview-release', (event, input) => releasePreview(event.sender, input || {}));
  ipcMain.handle('island-preview-save-capture', (_event, input) => saveCapture(input || {}));
}

module.exports = {
  registerIslandPreviewRuntime,
  stopAllPreviews,
  _test: { planPreview, htmlNeedsBundler },
};
