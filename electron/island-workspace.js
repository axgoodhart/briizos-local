/**
 * Islands workspace services: files made inside briizOS, read-only previews
 * of referenced files, dated archives, and terminal cards.
 *
 * Files brought in from elsewhere are never moved, edited, or deleted here.
 * Files made inside briizOS live under userData/Islands/ and belong
 * to briizOS (docs/island-desks/DECISIONS.md → Files).
 */
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { spawn, execFile } = require('child_process');
const { app, shell } = require('electron');
const { logger } = require('./logger');
const { buildFileRecord } = require('./island-fs');
const { registerIslandPreviewRuntime, stopAllPreviews } = require('./island-preview-runtime');

// ==== LIMITS ====
const PREVIEW_MAX_BYTES = 400000;          // text preview cap for a card
const OWNED_WRITE_MAX_BYTES = 5000000;     // in-app documents
const TERMINAL_BUFFER_MAX = 200000;        // characters kept per terminal card for replay
const TERMINAL_COLS = 120;
const TERMINAL_ROWS = 40;
const CWD_MARK = '\u001fISLAND_CWD:';

function ownedRoot() {
  return path.join(app.getPath('userData'), 'Islands');
}

function archiveRoot() {
  return path.join(os.homedir(), 'Documents', 'briizOS Island Archives');
}

function safeSegment(value, fallback = 'Untitled') {
  const cleaned = String(value || '').replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 120);
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

async function uniquePath(dir, fileName) {
  const ext = path.extname(fileName);
  const base = fileName.slice(0, fileName.length - ext.length);
  let candidate = path.join(dir, fileName);
  for (let n = 2; n < 1000; n += 1) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${base} (${n})${ext}`);
    } catch {
      return candidate;
    }
  }
  return candidate;
}

/* ── Files made inside briizOS ─────────────────────────────────────── */

function islandDir(islandId, islandName) {
  return path.join(ownedRoot(), `${safeSegment(islandName)} — ${safeSegment(islandId, 'island')}`);
}

async function createOwnedFile({ islandId, islandName, fileName, content = '' }) {
  const dir = islandDir(islandId, islandName);
  await fs.mkdir(dir, { recursive: true });
  const target = await uniquePath(dir, safeSegment(fileName, 'Untitled.md'));
  const text = String(content ?? '');
  if (Buffer.byteLength(text) > OWNED_WRITE_MAX_BYTES) throw new Error('This document is larger than Islands can save (5 MB).');
  await fs.writeFile(target, text, 'utf8');
  const stat = await fs.stat(target);
  const record = { ...buildFileRecord(target, stat, islandName), owned: true };
  logger.info('island.files', `Created “${path.basename(target)}” inside briizOS for the island “${islandName}”. It is stored by briizOS, not in your own folders.`, {
    path: target,
    island: islandName,
    bytes: stat.size,
  });
  return record;
}

async function writeOwnedFile(filePath, content) {
  const resolved = path.resolve(String(filePath || ''));
  if (!isInside(resolved, ownedRoot())) {
    logger.warn('island.files', 'Islands refused to write a file it does not own. Files you brought in are only opened in their own apps, never edited here.', { path: resolved });
    throw new Error('Islands only edits documents that were made inside briizOS.');
  }
  const text = String(content ?? '');
  if (Buffer.byteLength(text) > OWNED_WRITE_MAX_BYTES) throw new Error('This document is larger than Islands can save (5 MB).');
  await fs.writeFile(resolved, text, 'utf8');
  const stat = await fs.stat(resolved);
  logger.debug('island.files', `Saved “${path.basename(resolved)}”`, { path: resolved, bytes: stat.size });
  return { ok: true, size: stat.size, modifiedAt: stat.mtime.toISOString() };
}

async function readTextPreview(filePath, maxBytes = PREVIEW_MAX_BYTES) {
  const resolved = path.resolve(String(filePath || ''));
  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      return {
        ok: true,
        kind: 'folder',
        entries: entries
          .filter((entry) => !entry.name.startsWith('.'))
          .slice(0, 400)
          .map((entry) => ({ name: entry.name, folder: entry.isDirectory() })),
        modifiedAt: stat.mtime.toISOString(),
      };
    }
    const handle = await fs.open(resolved, 'r');
    try {
      const length = Math.min(stat.size, Math.max(1, Math.min(maxBytes, PREVIEW_MAX_BYTES)));
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, 0);
      const binary = buffer.subarray(0, Math.min(length, 8000)).includes(0);
      return {
        ok: true,
        kind: binary ? 'binary' : 'text',
        text: binary ? '' : buffer.toString('utf8'),
        truncated: stat.size > length,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        owned: isInside(resolved, ownedRoot()),
      };
    } finally {
      await handle.close();
    }
  } catch (error) {
    return { ok: false, missing: error?.code === 'ENOENT', error: error?.message || 'Could not read the file' };
  }
}

/* ── Dated archive ─────────────────────────────────────────────────── */

async function archiveIsland({ islandName, filePaths = [] }) {
  const when = stamp();
  const name = safeSegment(islandName);
  const destDir = path.join(archiveRoot(), name);
  const staging = path.join(os.tmpdir(), `briizos-island-archive-${Date.now()}`, `${name} — archive ${when}`);
  await fs.mkdir(staging, { recursive: true });
  await fs.mkdir(destDir, { recursive: true });

  const result = { copied: 0, missing: [], zipPath: null };
  for (const source of filePaths) {
    try {
      const stat = await fs.stat(source);
      const target = await uniquePath(staging, path.basename(source));
      if (stat.isDirectory()) await fs.cp(source, target, { recursive: true, errorOnExist: false });
      else await fs.copyFile(source, target);
      result.copied += 1;
    } catch {
      result.missing.push(source);
    }
  }

  const zipPath = await uniquePath(destDir, `${name} — archive ${when}.zip`);
  await new Promise((resolve, reject) => {
    execFile('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', staging, zipPath], (error) => (error ? reject(error) : resolve()));
  });
  await fs.rm(path.dirname(staging), { recursive: true, force: true });
  result.zipPath = zipPath;

  logger.info('island.archive', `Made a dated archive of “${islandName}”. Your original files were copied, not moved, and are unchanged.`, {
    archive: zipPath,
    filesCopied: result.copied,
    couldNotFind: result.missing.length ? result.missing : 'none',
  });
  return result;
}

/* ── Terminal cards ────────────────────────────────────────────────── */

const sessions = new Map(); // cardId → { child, cwd, buffer, command, startedAt }

function userShell() {
  return process.env.SHELL && process.env.SHELL.startsWith('/') ? process.env.SHELL : '/bin/zsh';
}

function emit(sender, channel, payload) {
  if (sender && !sender.isDestroyed()) sender.send(channel, payload);
}

// `total` counts every character ever sent, so a card can join mid-stream without repeating output.
function appendBuffer(session, text) {
  session.buffer += text;
  session.total = (session.total || 0) + text.length;
  if (session.buffer.length > TERMINAL_BUFFER_MAX) session.buffer = session.buffer.slice(-TERMINAL_BUFFER_MAX);
}

async function resolveCwd(cwd) {
  const candidate = cwd ? path.resolve(String(cwd).replace(/^~(?=$|\/)/, os.homedir())) : os.homedir();
  try {
    const stat = await fs.stat(candidate);
    return stat.isDirectory() ? candidate : os.homedir();
  } catch {
    return os.homedir();
  }
}

function quote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function terminalRun(sender, { cardId, command, cwd, label }) {
  const existing = sessions.get(cardId);
  if (existing?.child) {
    if (existing.child.stdin.writable) existing.child.stdin.write(`${command}\n`);
    return { ok: true, forwarded: true };
  }
  const workDir = await resolveCwd(cwd || existing?.cwd);
  const shell = userShell();
  const script = `stty cols ${TERMINAL_COLS} rows ${TERMINAL_ROWS} 2>/dev/null; cd ${quote(workDir)} && { ${command}\n}; __s=$?; printf '\\n${CWD_MARK}%s\\n' "$PWD"; exit $__s`;
  // `script` gives the command a real terminal, so tools print colors and progress as they would in Terminal.
  const child = spawn('/usr/bin/script', ['-q', '/dev/null', shell, '-ilc', script], {
    cwd: workDir,
    env: { ...process.env, TERM: 'xterm-256color', COLUMNS: String(TERMINAL_COLS), LINES: String(TERMINAL_ROWS), FORCE_COLOR: '1' },
    detached: true,
  });
  const session = existing || { buffer: '', cwd: workDir };
  Object.assign(session, { child, cwd: workDir, command, startedAt: Date.now() });
  sessions.set(cardId, session);
  const header = `\u001b[2m${workDir.replace(os.homedir(), '~')}\u001b[0m $ ${command}\r\n`;
  appendBuffer(session, header);
  emit(sender, 'island-terminal-data', { cardId, data: header, total: session.total });
  emit(sender, 'island-terminal-state', { cardId, running: true, command, cwd: workDir });
  logger.info('island.terminal', `Terminal card “${label || 'Terminal'}” started a command`, { command, folder: workDir });

  const onData = (chunk) => {
    let text = chunk.toString('utf8');
    const markAt = text.indexOf(CWD_MARK);
    if (markAt >= 0) {
      const end = text.indexOf('\n', markAt);
      const found = text.slice(markAt + CWD_MARK.length, end < 0 ? undefined : end).replace(/\r/g, '').trim();
      if (found) session.cwd = found;
      text = text.slice(0, markAt) + (end < 0 ? '' : text.slice(end + 1));
    }
    if (!text) return;
    appendBuffer(session, text);
    emit(sender, 'island-terminal-data', { cardId, data: text, total: session.total });
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('close', (code, signal) => {
    if (session.child !== child) return;
    session.child = null;
    const note = signal ? `\r\n\u001b[2m[stopped]\u001b[0m\r\n` : `\r\n\u001b[2m[exit ${code}]\u001b[0m\r\n`;
    appendBuffer(session, note);
    emit(sender, 'island-terminal-data', { cardId, data: note, total: session.total });
    emit(sender, 'island-terminal-state', { cardId, running: false, exitCode: code, cwd: session.cwd });
    const level = code === 0 || signal ? 'info' : 'warn';
    logger[level]('island.terminal', signal
      ? `Terminal card “${label || 'Terminal'}” command was stopped`
      : `Terminal card “${label || 'Terminal'}” command finished with exit code ${code}`, {
      command,
      folder: session.cwd,
      exitCode: code,
      ranFor: `${Math.round((Date.now() - session.startedAt) / 1000)}s`,
    });
  });
  child.on('error', (error) => {
    logger.error('island.terminal', `Terminal card “${label || 'Terminal'}” could not start its command`, { command, problem: error.message });
    emit(sender, 'island-terminal-state', { cardId, running: false, error: error.message, cwd: session.cwd });
  });
  return { ok: true, cwd: workDir };
}

function terminalStop({ cardId, label }) {
  const session = sessions.get(cardId);
  if (!session?.child) return { ok: true, running: false };
  try {
    process.kill(-session.child.pid, 'SIGTERM');
  } catch {
    session.child.kill('SIGTERM');
  }
  const child = session.child;
  setTimeout(() => {
    if (session.child === child) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
    }
  }, 3000);
  logger.info('island.terminal', `Stopping the command in terminal card “${label || 'Terminal'}”`, { command: session.command });
  return { ok: true };
}

function terminalSnapshot({ cardId }) {
  const session = sessions.get(cardId);
  return {
    buffer: session?.buffer || '',
    total: session?.total || 0,
    running: !!session?.child,
    command: session?.command || '',
    cwd: session?.cwd || null,
  };
}

function terminalClear({ cardId }) {
  const session = sessions.get(cardId);
  if (session) session.buffer = '';
  return { ok: true, total: session?.total || 0 };
}

function stopAllTerminals() {
  sessions.forEach((session) => {
    if (!session.child) return;
    try { process.kill(-session.child.pid, 'SIGTERM'); } catch { /* already gone */ }
  });
}

function stopAllIslandProcesses() {
  stopAllTerminals();
  stopAllPreviews();
}

async function openExternal(url) {
  let parsed;
  try { parsed = new URL(String(url || '')); } catch { return { ok: false, error: 'Not a web address' }; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, error: 'Only web addresses open in the browser' };
  await shell.openExternal(parsed.href);
  logger.info('island', 'Opened a webview card\'s page in your web browser', { url: parsed.href });
  return { ok: true };
}

// ==== PREVIEW SNAPSHOTS ====
const SNAPSHOT_MIN_PX = 24;            // cards smaller than this on screen are not worth a picture
const SNAPSHOT_MAX_CARDS = 60;

// One screenshot of the window, cropped once per card. Taken when the Canvas view closes, so the
// desk's Preview shows each card as it last looked. Webview cards keep their own capture.
async function snapshotCards(sender, input = {}) {
  const islandId = String(input.islandId || '');
  const cards = (Array.isArray(input.cards) ? input.cards : []).slice(0, SNAPSHOT_MAX_CARDS);
  if (!islandId || !cards.length) return { ok: true, snapshots: {} };
  const started = Date.now();
  const image = await sender.capturePage();
  const size = image.getSize();
  const viewport = input.viewport?.width > 0 && input.viewport?.height > 0 ? input.viewport : (sender.getOwnerBrowserWindow()?.getContentBounds() || size);
  const ratioX = size.width / Math.max(1, viewport.width);   // capture px per CSS px; differs from Retina scale when the page is zoomed
  const ratioY = size.height / Math.max(1, viewport.height);
  const folder = path.join(ownedRoot(), 'Snapshots');
  await fs.mkdir(folder, { recursive: true });
  const snapshots = {};
  const skipped = [];
  for (const card of cards) {
    const rect = card.rect || {};
    const x = Math.max(0, Math.round(rect.x * ratioX));
    const y = Math.max(0, Math.round(rect.y * ratioY));
    const width = Math.min(size.width - x, Math.round(rect.width * ratioX));
    const height = Math.min(size.height - y, Math.round(rect.height * ratioY));
    if (!card.cardId || width < SNAPSHOT_MIN_PX || height < SNAPSHOT_MIN_PX) { skipped.push(card.cardId || '?'); continue; }
    const crop = image.crop({ x, y, width, height });
    const safeId = String(card.cardId).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 160);
    const target = path.join(folder, `${safeId}.png`);
    await fs.writeFile(`${target}.new`, crop.toPNG());
    await fs.rename(`${target}.new`, target);
    snapshots[card.cardId] = { path: target, at: new Date().toISOString() };
  }
  logger.info('island.preview', `Saved ${Object.keys(snapshots).length} card picture${Object.keys(snapshots).length === 1 ? '' : 's'} for the desk Preview as the Canvas view closed.`, {
    islandId, folder, skippedTooSmall: skipped, durationMs: Date.now() - started,
  });
  return { ok: true, snapshots };
}

function registerIslandWorkspace({ ipcMain }) {
  ipcMain.handle('island-snapshot-cards', async (event, input) => snapshotCards(event.sender, input || {}));
  ipcMain.handle('island-open-external', async (_event, url) => openExternal(url));
  ipcMain.handle('island-owned-create', async (_event, input) => createOwnedFile(input || {}));
  ipcMain.handle('island-owned-write', async (_event, filePath, content) => writeOwnedFile(filePath, content));
  ipcMain.handle('island-file-preview', async (_event, filePath, maxBytes) => readTextPreview(filePath, maxBytes));
  ipcMain.handle('island-archive-island', async (_event, input) => archiveIsland(input || {}));
  ipcMain.handle('island-terminal-run', async (event, input) => terminalRun(event.sender, input || {}));
  ipcMain.handle('island-terminal-stop', async (_event, input) => terminalStop(input || {}));
  ipcMain.handle('island-terminal-snapshot', async (_event, input) => terminalSnapshot(input || {}));
  ipcMain.handle('island-terminal-clear', async (_event, input) => terminalClear(input || {}));
  registerIslandPreviewRuntime({ ipcMain });
  return stopAllIslandProcesses;
}

module.exports = { registerIslandWorkspace, stopAllTerminals, stopAllIslandProcesses };
