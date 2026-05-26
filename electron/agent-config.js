const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const APP_SUPPORT = path.join(app.getPath('appData'), 'briizOS');

const DIRS = {
  root: APP_SUPPORT,
  canvas: path.join(APP_SUPPORT, 'canvas'),
  memory: path.join(APP_SUPPORT, 'memory'),
  chatLogs: path.join(APP_SUPPORT, 'memory', 'chat-logs'),
};

const CONFIG_PATH = path.join(APP_SUPPORT, 'config.json');
const AGENT_CONTEXT_PATH = path.join(APP_SUPPORT, 'memory', 'agent-context.md');

// ---------------------------------------------------------------------------
// Permission levels — ordered from MOST restrictive to MOST permissive.
// "Cannot exceed" / "most restrictive" comparisons use this rank.
// ---------------------------------------------------------------------------
const LEVELS = ['ask-always', 'ask-destructive', 'no-asking'];

function levelRank(mode) {
  const i = LEVELS.indexOf(mode);
  return i === -1 ? 0 : i; // unknown → most restrictive
}

/** The more restrictive (lower-rank) of two modes. */
function moreRestrictive(a, b) {
  return levelRank(a) <= levelRank(b) ? a : b;
}

/**
 * Clamp a requested mode so it is never MORE permissive than `ceiling`.
 * Used for per-task levels, which may not exceed the Task column setting.
 */
function clampLevel(requested, ceiling) {
  if (!LEVELS.includes(requested)) return ceiling;
  return levelRank(requested) > levelRank(ceiling) ? ceiling : requested;
}

function emptyBlacklist() {
  return { paths: [], filetypes: [] };
}

function defaultSurface() {
  return { mode: 'ask-always', blacklist: emptyBlacklist() };
}

function defaultPermissions() {
  return { chat: defaultSurface(), task: defaultSurface() };
}

function defaultConfig() {
  return {
    permissions: defaultPermissions(),
    memory: { chunksToInclude: 1 },
  };
}

function mergeBlacklists(a = emptyBlacklist(), b = emptyBlacklist()) {
  return {
    paths: Array.from(new Set([...(a.paths || []), ...(b.paths || [])])),
    filetypes: Array.from(new Set([...(a.filetypes || []), ...(b.filetypes || [])])),
  };
}

function normalizeSurface(s) {
  const src = s && typeof s === 'object' ? s : {};
  return {
    mode: LEVELS.includes(src.mode) ? src.mode : 'ask-always',
    blacklist: {
      paths: Array.isArray(src.blacklist?.paths) ? src.blacklist.paths : [],
      filetypes: Array.isArray(src.blacklist?.filetypes) ? src.blacklist.filetypes : [],
    },
  };
}

/**
 * Bring any config (current or legacy) to the canonical per-surface shape.
 * Legacy keys (terminal.mode, filesystem.blacklist) seed BOTH surfaces so
 * an upgrade never silently relaxes a user's prior restriction.
 */
function migrate(raw) {
  const config = raw && typeof raw === 'object' ? { ...raw } : {};

  if (!config.permissions || typeof config.permissions !== 'object') {
    const legacyMode = LEVELS.includes(config.terminal?.mode) ? config.terminal.mode : 'ask-always';
    const legacyBlacklist = {
      paths: Array.isArray(config.filesystem?.blacklist?.paths) ? config.filesystem.blacklist.paths : [],
      filetypes: Array.isArray(config.filesystem?.blacklist?.filetypes) ? config.filesystem.blacklist.filetypes : [],
    };
    config.permissions = {
      chat: { mode: legacyMode, blacklist: { ...legacyBlacklist } },
      task: { mode: legacyMode, blacklist: { ...legacyBlacklist } },
    };
  }

  config.permissions = {
    chat: normalizeSurface(config.permissions.chat),
    task: normalizeSurface(config.permissions.task),
  };

  if (!config.memory || typeof config.memory !== 'object') {
    config.memory = { chunksToInclude: 1 };
  }

  // Drop legacy keys from the canonical shape; readConfig() re-derives
  // safe legacy mirrors at read time for any old consumers.
  delete config.terminal;
  delete config.filesystem;

  return config;
}

/**
 * Legacy mirrors so pre-existing consumers that still read
 * `config.terminal.mode` / `config.filesystem.blacklist` remain safe:
 *   - terminal.mode        → the MORE restrictive of chat/task (fail-closed)
 *   - filesystem.blacklist → the UNION of chat/task (fail-closed)
 * Precise per-surface enforcement happens in the renderer hard gate.
 */
function withLegacyMirrors(config) {
  const { chat, task } = config.permissions;
  return {
    ...config,
    terminal: { mode: moreRestrictive(chat.mode, task.mode) },
    filesystem: { blacklist: mergeBlacklists(chat.blacklist, task.blacklist) },
  };
}

function ensureDirectories() {
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig(), null, 2));
  } else {
    // Migrate-in-place on startup so the file settles into the new shape.
    try {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      const migrated = migrate(raw);
      if (JSON.stringify(migrated) !== JSON.stringify(raw)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(migrated, null, 2));
      }
    } catch {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig(), null, 2));
    }
  }
  if (!fs.existsSync(AGENT_CONTEXT_PATH)) {
    fs.writeFileSync(AGENT_CONTEXT_PATH, '# Agent Memory\n\nNo memories stored yet.\n');
  }
}

function readConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return withLegacyMirrors(migrate(raw));
  } catch {
    return withLegacyMirrors(defaultConfig());
  }
}

function writeConfig(config) {
  // Persist only the canonical shape; never persist derived legacy mirrors.
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(migrate(config), null, 2));
}

function updateConfig(partial) {
  const config = migrate(readConfig());
  for (const [key, value] of Object.entries(partial)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof config[key] === 'object') {
      // Deep-merge one level (covers permissions.chat / permissions.task).
      const merged = { ...config[key] };
      for (const [k2, v2] of Object.entries(value)) {
        if (typeof v2 === 'object' && v2 !== null && !Array.isArray(v2) && typeof merged[k2] === 'object') {
          merged[k2] = { ...merged[k2], ...v2 };
        } else {
          merged[k2] = v2;
        }
      }
      config[key] = merged;
    } else {
      config[key] = value;
    }
  }
  writeConfig(config);
  return readConfig();
}

/**
 * Resolve the effective policy for a surface ('chat' | 'task').
 * Unknown surface → most restrictive (fail-closed).
 */
function getSurfacePolicy(surface) {
  const config = migrate(readConfig());
  const s = config.permissions[surface];
  if (!s) return { surface: 'unknown', mode: 'ask-always', blacklist: emptyBlacklist() };
  return { surface, mode: s.mode, blacklist: s.blacklist };
}

module.exports = {
  APP_SUPPORT, DIRS, CONFIG_PATH, AGENT_CONTEXT_PATH,
  LEVELS, levelRank, moreRestrictive, clampLevel,
  ensureDirectories, readConfig, writeConfig, updateConfig,
  getSurfacePolicy, migrate,
};
