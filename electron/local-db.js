/**
 * briizOS Local SQLite Database
 *
 * Stores logs and workspace records persistently so they survive app restart.
 * Uses better-sqlite3 for synchronous, fast writes.
 */

let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // Fallback: logger will detect this and skip DB writes
  console.warn('[local-db] better-sqlite3 not available, logs will not persist to disk');
}

const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const { logger } = require('./logger');

const DB_DIR = Database ? path.join(app.getPath('userData'), 'data') : null;
const DB_PATH = DB_DIR ? path.join(DB_DIR, 'briizos-local.db') : null;

let _db = null;
let _dbAvailable = false;

/**
 * Get or create the singleton database connection.
 * Returns null if better-sqlite3 is not available.
 */
function getDb() {
  if (!Database) return null;
  if (_db) return _db;

  try {
    const fs = require('fs');
    fs.mkdirSync(DB_DIR, { recursive: true });

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    _setupSchema(_db);
    _dbAvailable = true;
    logger?.info?.('local-db', 'Local database initialized', DB_PATH);
    return _db;
  } catch (err) {
    console.error('[local-db] Failed to initialize database:', err?.message);
    _dbAvailable = false;
    return null;
  }
}

function _setupSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'system',
      category TEXT NOT NULL DEFAULT 'system',
      message TEXT,
      data TEXT, -- JSON
      level TEXT NOT NULL DEFAULT 'info',
      thread_id TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_logs_session ON logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_logs_thread ON logs(thread_id);

    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      cover TEXT,
      page TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_folios (
      id TEXT PRIMARY KEY,
      journal_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'notes',
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '{}',
      tags TEXT NOT NULL DEFAULT '[]',
      position INTEGER NOT NULL DEFAULT 0,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_journal_folios_journal ON journal_folios(journal_id);
    CREATE INDEX IF NOT EXISTS idx_journal_folios_position ON journal_folios(journal_id, position);

    CREATE TABLE IF NOT EXISTS notefall_entries (
      id TEXT PRIMARY KEY,
      author_type TEXT NOT NULL DEFAULT 'user',
      author_agent_id TEXT,
      body TEXT NOT NULL DEFAULT '',
      media TEXT NOT NULL DEFAULT '[]',
      journal_id TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      status_dot TEXT,
      source_app TEXT,
      source_icon TEXT NOT NULL DEFAULT 'note',
      capture_mode TEXT NOT NULL DEFAULT 'manual',
      session_start INTEGER,
      session_end INTEGER,
      screenshots TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notefall_entries_created ON notefall_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_notefall_entries_journal ON notefall_entries(journal_id);

    CREATE TABLE IF NOT EXISTS canvas_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS canvas_project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'file',
      size INTEGER NOT NULL DEFAULT 0,
      modified_at INTEGER,
      status TEXT NOT NULL DEFAULT 'unscanned',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES canvas_projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_canvas_files_project ON canvas_project_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_canvas_files_path ON canvas_project_files(path);

    CREATE TABLE IF NOT EXISTS workspace_links (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_links_unique
      ON workspace_links(source_type, source_id, target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_links_source
      ON workspace_links(source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_links_target
      ON workspace_links(target_type, target_id);
  `);
}

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Local database is unavailable');
  return db;
}

function makeId(prefix) {
  const random = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

function nowMs() {
  return Date.now();
}

function stringifyJson(value, fallback) {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function basename(filePath) {
  return path.basename(String(filePath || '').trim()) || 'untitled';
}

function inferKind(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.m4v', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.aiff', '.m4a', '.flac', '.ogg'].includes(ext)) return 'audio';
  if (ext === '.pdf') return 'pdf';
  if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.py', '.swift'].includes(ext)) return 'code';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  if (['.doc', '.docx', '.txt', '.rtf'].includes(ext)) return 'document';
  if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'spreadsheet';
  return 'file';
}

function fileStat(filePath) {
  try {
    const fs = require('fs');
    const stat = fs.statSync(filePath);
    return {
      ok: true,
      size: stat.size,
      modifiedAt: Math.round(stat.mtimeMs),
      status: 'ok',
    };
  } catch {
    return { ok: false, size: 0, modifiedAt: null, status: 'missing' };
  }
}

function rowToJournal(row) {
  return {
    id: row.id,
    title: row.title,
    tags: parseJson(row.tags, []),
    cover: row.cover || '',
    page: row.page || '',
    metadata: parseJson(row.metadata, {}),
    folioCount: Number(row.folio_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToFolio(row) {
  return {
    id: row.id,
    journalId: row.journal_id,
    type: row.type,
    title: row.title,
    content: parseJson(row.content, {}),
    tags: parseJson(row.tags, []),
    position: row.position,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToNotefall(row) {
  return {
    id: row.id,
    authorType: row.author_type,
    authorAgentId: row.author_agent_id,
    body: row.body,
    media: parseJson(row.media, []),
    journalId: row.journal_id,
    tags: parseJson(row.tags, []),
    statusDot: row.status_dot,
    sourceApp: row.source_app,
    sourceIcon: row.source_icon,
    captureMode: row.capture_mode,
    sessionStart: row.session_start,
    sessionEnd: row.session_end,
    screenshots: parseJson(row.screenshots, []),
    notes: row.notes,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCanvasProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    metadata: parseJson(row.metadata, {}),
    fileCount: Number(row.file_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCanvasFile(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    path: row.path,
    name: row.name,
    kind: row.kind,
    size: row.size,
    modifiedAt: row.modified_at,
    status: row.status,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToWorkspaceLink(row) {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ------------------------------------------------------------------
// Logs
// ------------------------------------------------------------------

function insertLog(entry) {
  const db = getDb();
  if (!db) return; // Silently skip if DB unavailable

  try {
    db.prepare(`
      INSERT OR IGNORE INTO logs (id, type, source, category, message, data, level, thread_id, session_id, created_at)
      VALUES (@id, @type, @source, @category, @message, @data, @level, @threadId, @sessionId, @createdAt)
    `).run({
      id: entry.id,
      type: entry.type,
      source: entry.source || 'system',
      category: entry.category || 'system',
      message: entry.message || '',
      data: entry.data ? JSON.stringify(entry.data) : null,
      level: entry.level || 'info',
      threadId: entry.threadId || null,
      sessionId: entry.sessionId || null,
      createdAt: entry.timestamp || new Date().toISOString(),
    });
  } catch (err) {
    // Never throw from logging
    console.warn('[local-db] insertLog failed:', err?.message);
  }
}

function getLogs(options = {}) {
  const db = getDb();
  if (!db) return [];

  const { sessionId, limit = 500, afterId, level, category, type } = options;
  let sql = 'SELECT * FROM logs';
  const params = [];
  const clauses = [];

  if (sessionId) { clauses.push('session_id = ?'); params.push(sessionId); }
  if (afterId) { clauses.push('id > ?'); params.push(afterId); }
  if (level) { clauses.push('level = ?'); params.push(level); }
  if (category) { clauses.push('category = ?'); params.push(category); }
  if (type) { clauses.push('type LIKE ?'); params.push(`%${type}%`); }

  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  try {
    return db.prepare(sql).all(...params).map(row => {
      const r = { ...row };
      if (r.data) try { r.data = JSON.parse(r.data); } catch { /* keep string */ }
      return r;
    });
  } catch (err) {
    console.warn('[local-db] getLogs failed:', err?.message);
    return [];
  }
}

function clearLogs() {
  const db = getDb();
  if (!db) return;
  try {
    db.exec('DELETE FROM logs');
    logger?.info?.('local-db', 'Logs cleared');
  } catch (err) {
    console.warn('[local-db] clearLogs failed:', err?.message);
  }
}

// ------------------------------------------------------------------
// Workspace: journals
// ------------------------------------------------------------------

function journalsList() {
  const db = requireDb();
  return db.prepare(`
    SELECT journals.*, COUNT(journal_folios.id) AS folio_count
    FROM journals
    LEFT JOIN journal_folios ON journal_folios.journal_id = journals.id
    GROUP BY journals.id
    ORDER BY journals.updated_at DESC
  `).all().map(rowToJournal);
}

function journalsCreate(input = {}) {
  const db = requireDb();
  const now = nowIso();
  const id = input.id || makeId('journal');
  const title = String(input.title || 'Untitled journal').trim() || 'Untitled journal';
  const folios = asArray(input.folios);

  const create = db.transaction(() => {
    db.prepare(`
      INSERT INTO journals (id, title, tags, cover, page, metadata, created_at, updated_at)
      VALUES (@id, @title, @tags, @cover, @page, @metadata, @createdAt, @updatedAt)
    `).run({
      id,
      title,
      tags: stringifyJson(asArray(input.tags), []),
      cover: input.cover || '',
      page: input.page || '',
      metadata: stringifyJson(asObject(input.metadata), {}),
      createdAt: now,
      updatedAt: now,
    });

    const insertFolio = db.prepare(`
      INSERT INTO journal_folios
        (id, journal_id, type, title, content, tags, position, metadata, created_at, updated_at)
      VALUES
        (@id, @journalId, @type, @title, @content, @tags, @position, @metadata, @createdAt, @updatedAt)
    `);

    folios.forEach((folio, index) => {
      insertFolio.run({
        id: folio.id || makeId('folio'),
        journalId: id,
        type: folio.type || 'notes',
        title: folio.title || '',
        content: stringifyJson(asObject(folio.content), {}),
        tags: stringifyJson(asArray(folio.tags), []),
        position: index,
        metadata: stringifyJson(asObject(folio.metadata), {}),
        createdAt: now,
        updatedAt: now,
      });
    });

    return db.prepare(`
      SELECT journals.*, COUNT(journal_folios.id) AS folio_count
      FROM journals
      LEFT JOIN journal_folios ON journal_folios.journal_id = journals.id
      WHERE journals.id = ?
      GROUP BY journals.id
    `).get(id);
  });

  return rowToJournal(create());
}

function foliosList(journalId) {
  const db = requireDb();
  return db.prepare(`
    SELECT * FROM journal_folios
    WHERE journal_id = ?
    ORDER BY position ASC, created_at ASC
  `).all(journalId).map(rowToFolio);
}

function resequenceFolios(db, journalId) {
  const rows = db.prepare(`
    SELECT id FROM journal_folios
    WHERE journal_id = ?
    ORDER BY position ASC, created_at ASC
  `).all(journalId);
  const update = db.prepare('UPDATE journal_folios SET position = ? WHERE id = ?');
  rows.forEach((row, index) => update.run(index, row.id));
}

function foliosCreate(journalId, folio = {}, opts = {}) {
  const db = requireDb();
  const now = nowIso();
  const id = folio.id || makeId('folio');

  const create = db.transaction(() => {
    let position = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM journal_folios WHERE journal_id = ?').get(journalId).next_position;

    if (opts?.afterId) {
      const after = db.prepare('SELECT position FROM journal_folios WHERE id = ? AND journal_id = ?').get(opts.afterId, journalId);
      if (after) {
        position = after.position + 1;
        db.prepare('UPDATE journal_folios SET position = position + 1 WHERE journal_id = ? AND position >= ?').run(journalId, position);
      }
    }

    db.prepare(`
      INSERT INTO journal_folios
        (id, journal_id, type, title, content, tags, position, metadata, created_at, updated_at)
      VALUES
        (@id, @journalId, @type, @title, @content, @tags, @position, @metadata, @createdAt, @updatedAt)
    `).run({
      id,
      journalId,
      type: folio.type || 'notes',
      title: folio.title || '',
      content: stringifyJson(asObject(folio.content), {}),
      tags: stringifyJson(asArray(folio.tags), []),
      position,
      metadata: stringifyJson(asObject(folio.metadata), {}),
      createdAt: now,
      updatedAt: now,
    });

    db.prepare('UPDATE journals SET updated_at = ? WHERE id = ?').run(now, journalId);
    resequenceFolios(db, journalId);
    return db.prepare('SELECT * FROM journal_folios WHERE id = ?').get(id);
  });

  return rowToFolio(create());
}

function foliosDelete(id) {
  const db = requireDb();
  const remove = db.transaction(() => {
    const row = db.prepare('SELECT journal_id FROM journal_folios WHERE id = ?').get(id);
    if (!row) return { ok: true };
    db.prepare('DELETE FROM journal_folios WHERE id = ?').run(id);
    db.prepare('UPDATE journals SET updated_at = ? WHERE id = ?').run(nowIso(), row.journal_id);
    resequenceFolios(db, row.journal_id);
    return { ok: true };
  });
  return remove();
}

function foliosUpdate(id, patch = {}) {
  const db = requireDb();
  const now = nowIso();
  const existing = db.prepare('SELECT * FROM journal_folios WHERE id = ?').get(id);
  if (!existing) throw new Error('Folio not found');

  const next = {
    type: patch.type ?? existing.type,
    title: patch.title ?? existing.title,
    content: patch.content !== undefined ? stringifyJson(asObject(patch.content), {}) : existing.content,
    tags: patch.tags !== undefined ? stringifyJson(asArray(patch.tags), []) : existing.tags,
    position: patch.position ?? existing.position,
    metadata: patch.metadata !== undefined ? stringifyJson(asObject(patch.metadata), {}) : existing.metadata,
    updatedAt: now,
    id,
  };

  db.prepare(`
    UPDATE journal_folios
    SET type = @type,
        title = @title,
        content = @content,
        tags = @tags,
        position = @position,
        metadata = @metadata,
        updated_at = @updatedAt
    WHERE id = @id
  `).run(next);
  db.prepare('UPDATE journals SET updated_at = ? WHERE id = ?').run(now, existing.journal_id);
  return rowToFolio(db.prepare('SELECT * FROM journal_folios WHERE id = ?').get(id));
}

// ------------------------------------------------------------------
// Workspace: notefalls
// ------------------------------------------------------------------

function notefallsList() {
  const db = requireDb();
  return db.prepare('SELECT * FROM notefall_entries ORDER BY created_at DESC').all().map(rowToNotefall);
}

function notefallsCreate(input = {}) {
  const db = requireDb();
  const now = nowMs();
  const id = input.id || makeId('notefall');
  db.prepare(`
    INSERT INTO notefall_entries
      (id, author_type, author_agent_id, body, media, journal_id, tags, status_dot,
       source_app, source_icon, capture_mode, session_start, session_end, screenshots,
       notes, metadata, created_at, updated_at)
    VALUES
      (@id, @authorType, @authorAgentId, @body, @media, @journalId, @tags, @statusDot,
       @sourceApp, @sourceIcon, @captureMode, @sessionStart, @sessionEnd, @screenshots,
       @notes, @metadata, @createdAt, @updatedAt)
  `).run({
    id,
    authorType: input.authorType || 'user',
    authorAgentId: input.authorAgentId || null,
    body: String(input.body || ''),
    media: stringifyJson(asArray(input.media), []),
    journalId: input.journalId || null,
    tags: stringifyJson(asArray(input.tags), []),
    statusDot: input.statusDot || null,
    sourceApp: input.sourceApp || null,
    sourceIcon: input.sourceIcon || 'note',
    captureMode: input.captureMode || 'manual',
    sessionStart: input.sessionStart || null,
    sessionEnd: input.sessionEnd || null,
    screenshots: stringifyJson(asArray(input.screenshots), []),
    notes: input.notes || null,
    metadata: stringifyJson(asObject(input.metadata), {}),
    createdAt: input.createdAt || now,
    updatedAt: now,
  });
  return rowToNotefall(db.prepare('SELECT * FROM notefall_entries WHERE id = ?').get(id));
}

function notefallsUpdate(id, patch = {}) {
  const db = requireDb();
  const existing = db.prepare('SELECT * FROM notefall_entries WHERE id = ?').get(id);
  if (!existing) throw new Error('Notefall entry not found');

  const next = {
    id,
    authorType: patch.authorType ?? existing.author_type,
    authorAgentId: patch.authorAgentId ?? existing.author_agent_id,
    body: patch.body ?? existing.body,
    media: patch.media !== undefined ? stringifyJson(asArray(patch.media), []) : existing.media,
    journalId: patch.journalId ?? existing.journal_id,
    tags: patch.tags !== undefined ? stringifyJson(asArray(patch.tags), []) : existing.tags,
    statusDot: patch.statusDot ?? existing.status_dot,
    sourceApp: patch.sourceApp ?? existing.source_app,
    sourceIcon: patch.sourceIcon ?? existing.source_icon,
    captureMode: patch.captureMode ?? existing.capture_mode,
    sessionStart: patch.sessionStart ?? existing.session_start,
    sessionEnd: patch.sessionEnd ?? existing.session_end,
    screenshots: patch.screenshots !== undefined ? stringifyJson(asArray(patch.screenshots), []) : existing.screenshots,
    notes: patch.notes ?? existing.notes,
    metadata: patch.metadata !== undefined ? stringifyJson(asObject(patch.metadata), {}) : existing.metadata,
    updatedAt: nowMs(),
  };

  db.prepare(`
    UPDATE notefall_entries
    SET author_type = @authorType,
        author_agent_id = @authorAgentId,
        body = @body,
        media = @media,
        journal_id = @journalId,
        tags = @tags,
        status_dot = @statusDot,
        source_app = @sourceApp,
        source_icon = @sourceIcon,
        capture_mode = @captureMode,
        session_start = @sessionStart,
        session_end = @sessionEnd,
        screenshots = @screenshots,
        notes = @notes,
        metadata = @metadata,
        updated_at = @updatedAt
    WHERE id = @id
  `).run(next);

  return rowToNotefall(db.prepare('SELECT * FROM notefall_entries WHERE id = ?').get(id));
}

function notefallsDelete(id) {
  const db = requireDb();
  db.prepare('DELETE FROM notefall_entries WHERE id = ?').run(id);
  return { ok: true };
}

// ------------------------------------------------------------------
// Workspace: canvas projects
// ------------------------------------------------------------------

function canvasProjectsList() {
  const db = requireDb();
  return db.prepare(`
    SELECT canvas_projects.*, COUNT(canvas_project_files.id) AS file_count
    FROM canvas_projects
    LEFT JOIN canvas_project_files ON canvas_project_files.project_id = canvas_projects.id
    GROUP BY canvas_projects.id
    ORDER BY canvas_projects.updated_at DESC
  `).all().map(rowToCanvasProject);
}

function canvasProjectsCreate(input = {}) {
  const db = requireDb();
  const now = nowIso();
  const id = input.id || makeId('canvas_project');
  const name = String(input.name || 'Untitled project').trim() || 'Untitled project';
  db.prepare(`
    INSERT INTO canvas_projects (id, name, description, metadata, created_at, updated_at)
    VALUES (@id, @name, @description, @metadata, @createdAt, @updatedAt)
  `).run({
    id,
    name,
    description: input.description || '',
    metadata: stringifyJson(asObject(input.metadata), {}),
    createdAt: now,
    updatedAt: now,
  });
  return rowToCanvasProject(db.prepare(`
    SELECT canvas_projects.*, 0 AS file_count
    FROM canvas_projects
    WHERE id = ?
  `).get(id));
}

function canvasProjectsUpdate(id, patch = {}) {
  const db = requireDb();
  const existing = db.prepare('SELECT * FROM canvas_projects WHERE id = ?').get(id);
  if (!existing) throw new Error('Canvas project not found');
  db.prepare(`
    UPDATE canvas_projects
    SET name = @name,
        description = @description,
        metadata = @metadata,
        updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id,
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    metadata: patch.metadata !== undefined ? stringifyJson(asObject(patch.metadata), {}) : existing.metadata,
    updatedAt: nowIso(),
  });
  return canvasProjectsList().find((project) => project.id === id);
}

function canvasProjectsDelete(id) {
  const db = requireDb();
  db.prepare('DELETE FROM canvas_projects WHERE id = ?').run(id);
  return { ok: true };
}

function canvasProjectFilesList(projectId) {
  const db = requireDb();
  return db.prepare(`
    SELECT * FROM canvas_project_files
    WHERE project_id = ?
    ORDER BY updated_at DESC, name ASC
  `).all(projectId).map(rowToCanvasFile);
}

function canvasProjectFilesAdd(projectId, file = {}) {
  const db = requireDb();
  const now = nowIso();
  const filePath = String(file.path || '').trim();
  if (!filePath) throw new Error('File path is required');
  const stat = fileStat(filePath);
  const id = file.id || makeId('canvas_file');

  db.prepare(`
    INSERT INTO canvas_project_files
      (id, project_id, path, name, kind, size, modified_at, status, metadata, created_at, updated_at)
    VALUES
      (@id, @projectId, @path, @name, @kind, @size, @modifiedAt, @status, @metadata, @createdAt, @updatedAt)
  `).run({
    id,
    projectId,
    path: filePath,
    name: file.name || basename(filePath),
    kind: file.kind || inferKind(filePath),
    size: file.size ?? stat.size,
    modifiedAt: file.modifiedAt ?? stat.modifiedAt,
    status: file.status || stat.status,
    metadata: stringifyJson(asObject(file.metadata), {}),
    createdAt: now,
    updatedAt: now,
  });
  db.prepare('UPDATE canvas_projects SET updated_at = ? WHERE id = ?').run(now, projectId);
  return rowToCanvasFile(db.prepare('SELECT * FROM canvas_project_files WHERE id = ?').get(id));
}

function canvasProjectFilesUpdate(id, patch = {}) {
  const db = requireDb();
  const existing = db.prepare('SELECT * FROM canvas_project_files WHERE id = ?').get(id);
  if (!existing) throw new Error('Canvas project file not found');
  const nextPath = patch.path ?? existing.path;
  db.prepare(`
    UPDATE canvas_project_files
    SET path = @path,
        name = @name,
        kind = @kind,
        size = @size,
        modified_at = @modifiedAt,
        status = @status,
        metadata = @metadata,
        updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id,
    path: nextPath,
    name: patch.name ?? existing.name,
    kind: patch.kind ?? existing.kind ?? inferKind(nextPath),
    size: patch.size ?? existing.size,
    modifiedAt: patch.modifiedAt ?? existing.modified_at,
    status: patch.status ?? existing.status,
    metadata: patch.metadata !== undefined ? stringifyJson(asObject(patch.metadata), {}) : existing.metadata,
    updatedAt: nowIso(),
  });
  return rowToCanvasFile(db.prepare('SELECT * FROM canvas_project_files WHERE id = ?').get(id));
}

function canvasProjectFilesDelete(id) {
  const db = requireDb();
  db.prepare('DELETE FROM canvas_project_files WHERE id = ?').run(id);
  return { ok: true };
}

function canvasProjectFilesScan(projectId) {
  const db = requireDb();
  const rows = db.prepare('SELECT * FROM canvas_project_files WHERE project_id = ?').all(projectId);
  const update = db.prepare(`
    UPDATE canvas_project_files
    SET size = @size,
        modified_at = @modifiedAt,
        status = @status,
        updated_at = @updatedAt
    WHERE id = @id
  `);
  const now = nowIso();
  rows.forEach((row) => {
    const stat = fileStat(row.path);
    const status = !stat.ok
      ? 'missing'
      : (row.modified_at && stat.modifiedAt !== row.modified_at ? 'modified' : 'ok');
    update.run({
      id: row.id,
      size: stat.size,
      modifiedAt: stat.modifiedAt,
      status,
      updatedAt: now,
    });
  });
  db.prepare('UPDATE canvas_projects SET updated_at = ? WHERE id = ?').run(now, projectId);
  return { ok: true, count: rows.length };
}

function canvasProjectConsolidate(projectId) {
  const db = requireDb();
  const now = nowIso();
  const rows = db.prepare('SELECT id FROM canvas_project_files WHERE project_id = ?').all(projectId);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO workspace_links
      (id, source_type, source_id, target_type, target_id, metadata, created_at, updated_at)
    VALUES
      (@id, 'canvas_project', @projectId, 'canvas_project_file', @fileId, '{}', @createdAt, @updatedAt)
  `);
  rows.forEach((row) => {
    insert.run({
      id: makeId('workspace_link'),
      projectId,
      fileId: row.id,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { ok: true, linkedFiles: rows.length };
}

// ------------------------------------------------------------------
// Workspace links
// ------------------------------------------------------------------

function workspaceLinksList(filter = {}) {
  const db = requireDb();
  const clauses = [];
  const params = [];
  if (filter.sourceType) { clauses.push('source_type = ?'); params.push(filter.sourceType); }
  if (filter.sourceId) { clauses.push('source_id = ?'); params.push(filter.sourceId); }
  if (filter.targetType) { clauses.push('target_type = ?'); params.push(filter.targetType); }
  if (filter.targetId) { clauses.push('target_id = ?'); params.push(filter.targetId); }
  let sql = 'SELECT * FROM workspace_links';
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  sql += ' ORDER BY updated_at DESC';
  return db.prepare(sql).all(...params).map(rowToWorkspaceLink);
}

function workspaceLinksCreate(input = {}) {
  const db = requireDb();
  const now = nowIso();
  const id = input.id || makeId('workspace_link');
  db.prepare(`
    INSERT OR REPLACE INTO workspace_links
      (id, source_type, source_id, target_type, target_id, metadata, created_at, updated_at)
    VALUES
      (@id, @sourceType, @sourceId, @targetType, @targetId, @metadata, @createdAt, @updatedAt)
  `).run({
    id,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: stringifyJson(asObject(input.metadata), {}),
    createdAt: now,
    updatedAt: now,
  });
  return rowToWorkspaceLink(db.prepare('SELECT * FROM workspace_links WHERE id = ?').get(id));
}

function workspaceLinksDelete(id) {
  const db = requireDb();
  db.prepare('DELETE FROM workspace_links WHERE id = ?').run(id);
  return { ok: true };
}

function isAvailable() {
  return !!getDb();
}

// ------------------------------------------------------------------
// Lifecycle
// ------------------------------------------------------------------

function close() {
  if (_db) {
    try {
      _db.close();
      logger?.info?.('local-db', 'Local database closed');
    } catch (e) {
      /* ignore close errors */
    }
    _db = null;
  }
}

module.exports = {
  isAvailable,
  insertLog,
  getLogs,
  clearLogs,
  journalsList,
  journalsCreate,
  foliosList,
  foliosCreate,
  foliosDelete,
  foliosUpdate,
  notefallsList,
  notefallsCreate,
  notefallsUpdate,
  notefallsDelete,
  canvasProjectsList,
  canvasProjectsCreate,
  canvasProjectsUpdate,
  canvasProjectsDelete,
  canvasProjectFilesList,
  canvasProjectFilesAdd,
  canvasProjectFilesUpdate,
  canvasProjectFilesDelete,
  canvasProjectFilesScan,
  canvasProjectConsolidate,
  workspaceLinksList,
  workspaceLinksCreate,
  workspaceLinksDelete,
  close,
};
