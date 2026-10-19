/**
 * Apperture link for Islands: reads and appends the shared files in
 * <project>/.apperture/ (apperture/docs/PROJECT_DATA_CONTRACT.md) and opens Apperture on a project.
 * briizOS writes only its own keys and never reaches outside <project>/.apperture/.
 */
const path = require('path');
const fsSync = require('fs');
const fs = require('fs/promises');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const { app } = require('electron');
const { logger } = require('./logger');

// ==== APPERTURE ====
const APPERTURE_ROOT = path.join(os.homedir(), 'Documents', 'Cufolio', 'apperture');
const APPERTURE_APP = path.join(APPERTURE_ROOT, 'apps', 'desktop', 'dist', 'mac-arm64', 'Apperture.app');
const APPERTURE_DEV_DIR = path.join(APPERTURE_ROOT, 'apps', 'desktop');
const DATA_DIR = '.apperture';
const COMMANDS_READ_MAX = 200;
const COMMANDS_TAIL_BYTES = 512 * 1024;   // only the end of commands.jsonl is read
const COMMAND_TEXT_MAX = 2000;
const JSON_READ_MAX_BYTES = 4 * 1024 * 1024;
const BOARD_ROWS_MAX = 500;
const TAGS_MAX = 40;
const DEV_LOG_TAIL_LINES = 12;

const BRIIZOS_KINDS = new Set(['goal', 'answer', 'pause', 'resume']);
const APPS = new Set(['briizos', 'apperture']);
const ID_RE = /^[\w.:-]{1,200}$/;

const isInside = (child, parent) => {
  const relative = path.relative(parent, child);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};
const str = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
const userShell = () => (process.env.SHELL && process.env.SHELL.startsWith('/') ? process.env.SHELL : '/bin/zsh');

async function projectRoot(input) {
  if (typeof input !== 'string' || !input || input.length > 4096 || !path.isAbsolute(input)) {
    throw new Error('The project folder must be a full path.');
  }
  let real;
  try { real = await fs.realpath(input); } catch { throw new Error('The project folder no longer exists.'); }
  if (!(await fs.stat(real)).isDirectory()) throw new Error('The project path is not a folder.');
  return real;
}

// Symlinks are resolved, so a link inside .apperture can't point elsewhere.
async function dataPath(root, name) {
  const dir = path.join(root, DATA_DIR);
  const target = path.resolve(dir, name);
  const realDir = await fs.realpath(dir).catch(() => dir);
  const realTarget = await fs.realpath(target).catch(() => path.join(realDir, path.relative(dir, target)));
  if (!isInside(realDir, root) || !isInside(realTarget, realDir)) {
    throw new Error(`Refused a path outside the project's ${DATA_DIR} folder.`);
  }
  return realTarget;
}

async function readJson(file) {
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile() || stat.size > JSON_READ_MAX_BYTES) return null;
    const value = JSON.parse(await fs.readFile(file, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function cleanRef(ref) {
  if (!ref || typeof ref !== 'object' || !APPS.has(ref.app) || !ID_RE.test(String(ref.id || ''))) return null;
  return { app: ref.app, id: String(ref.id) };
}

function cleanCommand(raw) {
  if (!raw || typeof raw !== 'object' || !num(raw.at)) return null;
  return {
    id: str(raw.id, 200) || `cmd-${num(raw.at)}`,
    at: num(raw.at),
    source: raw.source === 'apperture' ? 'apperture' : 'briizos',
    kind: str(raw.kind, 40) || 'task',
    text: str(raw.text, COMMAND_TEXT_MAX),
    taskRef: cleanRef(raw.taskRef),
    islandId: str(raw.islandId, 200),
    cardId: str(raw.cardId, 200),
    artifactId: str(raw.artifactId, 200),
  };
}

async function readCommands(file) {
  let handle;
  try { handle = await fs.open(file, 'r'); } catch { return []; }
  try {
    const { size } = await handle.stat();
    const length = Math.min(size, COMMANDS_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);
    const lines = buffer.toString('utf8').split('\n');
    if (length < size) lines.shift(); // first line may be cut mid-way
    return lines
      .map((line) => { try { return cleanCommand(JSON.parse(line)); } catch { return null; } })
      .filter(Boolean)
      .slice(-COMMANDS_READ_MAX);
  } finally {
    await handle.close();
  }
}

function cleanBoard(board) {
  if (!board) return null;
  const rows = (list) => (Array.isArray(list) ? list.filter((r) => r && typeof r === 'object').slice(0, BOARD_ROWS_MAX) : []);
  return {
    schema: str(board.schema, 60),
    updatedAt: num(board.updatedAt),
    tasks: rows(board.tasks).map((t) => ({
      specId: str(t.specId, 200), title: str(t.title, 300), status: str(t.status, 40), kind: str(t.kind, 40),
      artifactId: str(t.artifactId, 200), updatedAt: num(t.updatedAt),
    })),
    artifacts: rows(board.artifacts).map((a) => ({
      id: str(a.id, 200), taskId: str(a.taskId, 200), name: str(a.name, 300), kind: str(a.kind, 40), updatedAt: num(a.updatedAt),
    })),
  };
}

async function projectSummary(rootPath) {
  const root = await projectRoot(rootPath);
  const [projectFile, boardFile, commandsFile] = await Promise.all(['project.json', 'board.json', 'commands.jsonl'].map((name) => dataPath(root, name)));
  const [project, board, commands] = await Promise.all([readJson(projectFile), readJson(boardFile), readCommands(commandsFile)]);
  return { ok: true, rootPath: root, project, board: cleanBoard(board), commands };
}

async function appendCommand(rootPath, entry) {
  const root = await projectRoot(rootPath);
  if (!entry || typeof entry !== 'object') throw new Error('The command was empty.');
  if (!BRIIZOS_KINDS.has(entry.kind)) throw new Error(`“${String(entry.kind).slice(0, 40)}” is not a briizOS command kind.`);
  const ids = ['islandId', 'cardId'].map((key) => entry[key]);
  if (ids.some((value) => value != null && !ID_RE.test(String(value)))) throw new Error('The island or card id is malformed.');
  const line = {
    schema: 'apperture.command/1',
    id: `cmd-${crypto.randomUUID()}`,
    at: Date.now(),
    source: 'briizos',
    kind: entry.kind,
    text: String(entry.text ?? '').trim().slice(0, COMMAND_TEXT_MAX),
    ...(cleanRef(entry.taskRef) ? { taskRef: cleanRef(entry.taskRef) } : {}),
    ...(entry.islandId ? { islandId: String(entry.islandId) } : {}),
    ...(entry.cardId ? { cardId: String(entry.cardId) } : {}),
  };
  await fs.mkdir(path.join(root, DATA_DIR), { recursive: true });
  const file = await dataPath(root, 'commands.jsonl');
  await fs.appendFile(file, `${JSON.stringify(line)}\n`, 'utf8');
  return { ok: true, entry: cleanCommand(line), path: file };
}

function linkKeys(keys = {}) {
  if (!ID_RE.test(String(keys.islandId || ''))) throw new Error('The island id is malformed.');
  const out = { islandId: String(keys.islandId) };
  if (/^#[0-9a-f]{6}$/i.test(String(keys.accent || ''))) out.accent = String(keys.accent);
  if (Array.isArray(keys.tags)) out.tags = keys.tags.map((t) => str(t, 64).trim()).filter(Boolean).slice(0, TAGS_MAX);
  if (typeof keys.stage === 'string') out.stage = keys.stage.trim().slice(0, 120);
  return out;
}

async function writeAtomic(file, text) {
  const tmp = `${file}.tmp-${crypto.randomBytes(6).toString('hex')}`;
  await fs.writeFile(tmp, text, 'utf8');
  try { await fs.rename(tmp, file); } catch (error) { await fs.rm(tmp, { force: true }); throw error; }
}

async function writeLink(rootPath, keys) {
  const root = await projectRoot(rootPath);
  const clean = linkKeys(keys);
  await fs.mkdir(path.join(root, DATA_DIR), { recursive: true });
  const file = await dataPath(root, 'project.json');
  let current = {};
  try {
    current = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('project.json is there but is not readable JSON, so Islands left it untouched.');
  }
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('project.json does not hold an object, so Islands left it untouched.');
  if (Object.keys(clean).every((key) => JSON.stringify(current[key]) === JSON.stringify(clean[key]))) return { ok: true, written: false, path: file };
  const next = { ...current, schema: current.schema || 'apperture.project/1', ...clean, updatedAt: Date.now() };
  await writeAtomic(file, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, written: true, path: file, keys: Object.keys(clean) };
}

async function exists(target, kind) {
  try { const stat = await fs.stat(target); return kind === 'dir' ? stat.isDirectory() : stat.isFile(); } catch { return false; }
}

function logTail(file) {
  try { return fsSync.readFileSync(file, 'utf8').split('\n').filter(Boolean).slice(-DEV_LOG_TAIL_LINES); } catch { return []; }
}

async function launch(rootPath) {
  const root = await projectRoot(rootPath);
  const arg = `--open-project=${root}`;
  if (await exists(APPERTURE_APP, 'dir')) {
    await new Promise((resolve, reject) => {
      execFile('/usr/bin/open', ['-n', '-a', APPERTURE_APP, '--args', arg], (error) => (error ? reject(error) : resolve()));
    });
    logger.info('island.apperture', `Opened Apperture on the project folder “${path.basename(root)}”. If Apperture was already open, it switched to this project.`, {
      project: root, app: APPERTURE_APP,
    });
    return { ok: true, mode: 'app' };
  }
  if (!(await exists(path.join(APPERTURE_DEV_DIR, 'package.json'), 'file'))) {
    throw new Error(`Apperture was not found: no app at ${APPERTURE_APP} and no source at ${APPERTURE_DEV_DIR}.`);
  }
  const logDir = app.getPath('logs');
  await fs.mkdir(logDir, { recursive: true });
  const logFile = path.join(logDir, 'apperture-dev.log');
  const out = fsSync.openSync(logFile, 'a');
  const startedAt = Date.now();
  const child = spawn(userShell(), ['-ilc', `exec npm run dev -- -- ${quote(arg)}`], {
    cwd: APPERTURE_DEV_DIR, detached: true, stdio: ['ignore', out, out],
  });
  fsSync.closeSync(out);
  child.unref();
  child.once('error', (error) => logger.error('island.apperture', 'Apperture could not start from its source folder.', {
    folder: APPERTURE_DEV_DIR, problem: error.message, nextStep: 'Check that Node and npm work in Terminal, then press Launch Apperture again.',
  }));
  child.once('exit', (code, signal) => {
    if (!code) return;
    logger.warn('island.apperture', `Apperture (development build) stopped with exit code ${code}${signal ? ` (${signal})` : ''}.`, {
      ranFor: `${Math.round((Date.now() - startedAt) / 1000)}s`, output: logTail(logFile), fullLog: logFile,
      nextStep: `Run “npm run dev” in ${APPERTURE_DEV_DIR} in Terminal to see the whole problem.`,
    });
  });
  logger.info('island.apperture', `Starting Apperture from its source folder on “${path.basename(root)}”. There is no packaged Apperture.app yet, so the first window can take a minute.`, {
    project: root, command: `npm run dev -- -- ${arg}`, folder: APPERTURE_DEV_DIR, output: logFile,
  });
  return { ok: true, mode: 'dev', log: logFile };
}

const guard = (run) => async (_event, ...args) => {
  try { return await run(...args); } catch (error) { return { ok: false, error: error?.message || 'Unknown problem' }; }
};

function registerIslandApperture({ ipcMain }) {
  ipcMain.handle('apperture-project-summary', guard(projectSummary));
  ipcMain.handle('apperture-append-command', guard(appendCommand));
  ipcMain.handle('apperture-write-link', guard(writeLink));
  ipcMain.handle('apperture-launch', guard(async (rootPath) => {
    try {
      return await launch(rootPath);
    } catch (error) {
      logger.error('island.apperture', 'Islands could not open Apperture on this project.', { project: String(rootPath || ''), problem: error?.message });
      throw error;
    }
  }));
}

module.exports = { registerIslandApperture };
