/**
 * briizOS Local SQLite Database — Minimal Log Storage
 *
 * Stores logs persistently so they survive app restart.
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
  // Only the logs table for now - matches the unified logger schema
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
  `);
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
  close,
};
