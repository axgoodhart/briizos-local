/**
 * Island local database — journals, folios, and notefalls.
 *
 * Ported from Projungle's main.js (where this backed the "Keeper" journals
 * tab and the Notefalls feed). Storage stays local-only for now — this is
 * NOT routed through Firestore/SyncContract; see the integration discussion
 * that preceded this port. Uses Node's built-in node:sqlite (stable in
 * Node 24 / Electron 41) — no native module rebuild needed.
 *
 * DB lives in userData/island.db so it survives app updates, separate from
 * briizOS's own logs DB (data/briizos-local.db) and the agent checkpointer DB.
 */
const path = require('path');
const crypto = require('crypto');
const { app, dialog } = require('electron');

let journalsDb = null;

function getDb() {
  if (journalsDb) return journalsDb;
  const { DatabaseSync } = require('node:sqlite');
  journalsDb = new DatabaseSync(path.join(app.getPath('userData'), 'island.db'));
  journalsDb.exec(`
    CREATE TABLE IF NOT EXISTS journals (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      tags        TEXT NOT NULL DEFAULT '[]',
      cover       TEXT NOT NULL,
      page        TEXT NOT NULL,
      folio_count INTEGER NOT NULL DEFAULT 0,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS folios (
      id         TEXT PRIMARY KEY,
      journal_id TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'notes',
      title      TEXT NOT NULL DEFAULT '',
      content    TEXT NOT NULL DEFAULT '{}',
      position   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_folios_journal ON folios (journal_id, position);
    CREATE TABLE IF NOT EXISTS posts (
      id              TEXT PRIMARY KEY,
      author_type     TEXT NOT NULL DEFAULT 'user',
      author_agent_id TEXT,
      body            TEXT NOT NULL DEFAULT '',
      media           TEXT NOT NULL DEFAULT '[]',
      journal_id      TEXT,
      tags            TEXT NOT NULL DEFAULT '[]',
      status_dot      TEXT,
      source_app      TEXT,
      source_icon     TEXT,
      capture_mode    TEXT NOT NULL DEFAULT 'manual',
      session_start   INTEGER,
      session_end     INTEGER,
      screenshots     TEXT NOT NULL DEFAULT '[]',
      notes           TEXT,
      created_at      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at);
  `);
  seedNotefallsIfEmpty(journalsDb);
  return journalsDb;
}

/* On first run the posts table is empty; seed it with a handful of sample
   entries so the feed/date-rail/session detail panel are demonstrable
   immediately. Timestamps are relative to "now" so labels stay correct
   no matter when the app is first launched. */
function seedNotefallsIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM posts').get().n;
  if (count > 0) return;

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const insert = db.prepare(`
    INSERT INTO posts (
      id, author_type, author_agent_id, body, media, journal_id, tags, status_dot,
      source_app, source_icon, capture_mode, session_start, session_end, screenshots, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const photoshopEnd = now - 14 * DAY;
  const photoshopStart = photoshopEnd - 46 * 60 * 1000;

  const rows = [
    {
      body: 'Violin works, etudes vs. sonata',
      sourceApp: null,
      sourceIcon: 'music',
      statusDot: '#e0473e',
      captureMode: 'auto',
      sessionStart: now - 3 * HOUR - 25 * 60 * 1000,
      sessionEnd: now - 3 * HOUR,
      createdAt: now - 3 * HOUR,
    },
    {
      body: 'Worked in Sibelius for 45 minutes',
      sourceApp: 'Sibelius',
      sourceIcon: 'music',
      statusDot: '#e0473e',
      captureMode: 'auto',
      sessionStart: now - 2 * DAY - 45 * 60 * 1000,
      sessionEnd: now - 2 * DAY,
      createdAt: now - 2 * DAY,
    },
    {
      body: 'Edited Journal',
      sourceApp: null,
      sourceIcon: 'journal',
      statusDot: null,
      captureMode: 'manual',
      tags: ['Habit Track'],
      sessionStart: null,
      sessionEnd: null,
      createdAt: now - 7 * DAY,
    },
    {
      body: 'Worked in Photoshop for 45 minutes',
      sourceApp: 'Photoshop',
      sourceIcon: 'photoshop',
      statusDot: null,
      captureMode: 'auto',
      sessionStart: photoshopStart,
      sessionEnd: photoshopEnd,
      createdAt: photoshopEnd,
    },
  ];

  rows.forEach((r, i) => {
    insert.run(
      crypto.randomUUID(),
      'user',
      null,
      r.body,
      '[]',
      null,
      JSON.stringify(r.tags || []),
      r.statusDot || null,
      r.sourceApp || null,
      r.sourceIcon || null,
      r.captureMode,
      r.sessionStart ?? null,
      r.sessionEnd ?? null,
      '[]',
      null,
      r.createdAt - i,
    );
  });
}

function rowToFolio(row) {
  let content = {};
  try { content = JSON.parse(row.content); } catch { /* keep {} */ }
  return {
    id: row.id,
    journalId: row.journal_id,
    type: row.type,
    title: row.title,
    content,
    position: row.position,
    createdAt: row.created_at,
  };
}

function rowToJournal(row) {
  let tags = [];
  try { tags = JSON.parse(row.tags); } catch { /* keep [] */ }
  return {
    id: row.id,
    title: row.title,
    tags,
    cover: row.cover,
    page: row.page,
    folioCount: row.folio_count,
    position: row.position,
    createdAt: row.created_at,
  };
}

function rowToPost(row) {
  let media = [];
  let tags = [];
  let screenshots = [];
  try { media = JSON.parse(row.media); } catch { /* keep [] */ }
  try { tags = JSON.parse(row.tags); } catch { /* keep [] */ }
  try { screenshots = JSON.parse(row.screenshots); } catch { /* keep [] */ }
  return {
    id: row.id,
    authorType: row.author_type,
    authorAgentId: row.author_agent_id,
    body: row.body,
    media,
    journalId: row.journal_id,
    tags,
    statusDot: row.status_dot,
    sourceApp: row.source_app,
    sourceIcon: row.source_icon,
    captureMode: row.capture_mode,
    sessionStart: row.session_start,
    sessionEnd: row.session_end,
    screenshots,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ── Journals ────────────────────────────────────────────────────────

function journalsList() {
  const rows = getDb().prepare('SELECT * FROM journals ORDER BY position ASC, created_at ASC').all();
  return rows.map(rowToJournal);
}

function journalsCreate(input) {
  const title = String(input?.title || '').trim();
  if (!title) throw new Error('Journal title is required');

  const db = getDb();
  const tags = Array.isArray(input?.tags)
    ? input.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const id = crypto.randomUUID();
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS max FROM journals').get().max;
  const folios = Array.isArray(input?.folios) ? input.folios : [];
  const now = Date.now();

  db.prepare(
    'INSERT INTO journals (id, title, tags, cover, page, folio_count, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, title, JSON.stringify(tags), String(input?.cover || ''), String(input?.page || ''), folios.length, maxPos + 1, now);

  const insertFolio = db.prepare(
    'INSERT INTO folios (id, journal_id, type, title, content, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  folios.forEach((f, i) => {
    insertFolio.run(
      crypto.randomUUID(),
      id,
      String(f?.type || 'notes'),
      String(f?.title || ''),
      JSON.stringify(f?.content ?? {}),
      i,
      now + i,
    );
  });

  return rowToJournal(db.prepare('SELECT * FROM journals WHERE id = ?').get(id));
}

function journalsDelete(id) {
  const db = getDb();
  db.prepare('DELETE FROM folios WHERE journal_id = ?').run(String(id));
  db.prepare('DELETE FROM journals WHERE id = ?').run(String(id));
  return { ok: true };
}

// ── Folios ──────────────────────────────────────────────────────────

function foliosList(journalId) {
  const rows = getDb()
    .prepare('SELECT * FROM folios WHERE journal_id = ? ORDER BY position ASC, created_at ASC')
    .all(String(journalId));
  return rows.map(rowToFolio);
}

function foliosCreate(journalId, folio, opts) {
  const db = getDb();
  const jid = String(journalId);
  const journal = db.prepare('SELECT id FROM journals WHERE id = ?').get(jid);
  if (!journal) throw new Error('Journal not found');

  let pos;
  const afterId = opts?.afterId ? String(opts.afterId) : null;
  const after = afterId
    ? db.prepare('SELECT position FROM folios WHERE id = ? AND journal_id = ?').get(afterId, jid)
    : null;
  if (after) {
    db.prepare('UPDATE folios SET position = position + 1 WHERE journal_id = ? AND position > ?')
      .run(jid, after.position);
    pos = after.position + 1;
  } else {
    pos = db.prepare('SELECT COALESCE(MAX(position), -1) AS max FROM folios WHERE journal_id = ?').get(jid).max + 1;
  }

  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO folios (id, journal_id, type, title, content, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, jid, String(folio?.type || 'notes'), String(folio?.title || ''), JSON.stringify(folio?.content ?? {}), pos, Date.now());
  db.prepare('UPDATE journals SET folio_count = (SELECT COUNT(*) FROM folios WHERE journal_id = ?) WHERE id = ?').run(jid, jid);
  return rowToFolio(db.prepare('SELECT * FROM folios WHERE id = ?').get(id));
}

function foliosDelete(id) {
  const db = getDb();
  const row = db.prepare('SELECT journal_id FROM folios WHERE id = ?').get(String(id));
  if (row) {
    db.prepare('DELETE FROM folios WHERE id = ?').run(String(id));
    db.prepare('UPDATE journals SET folio_count = (SELECT COUNT(*) FROM folios WHERE journal_id = ?) WHERE id = ?')
      .run(row.journal_id, row.journal_id);
  }
  return { ok: true };
}

function foliosUpdate(id, patch) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM folios WHERE id = ?').get(String(id));
  if (!row) throw new Error('Folio not found');
  const title = patch?.title !== undefined ? String(patch.title) : row.title;
  const content = patch?.content !== undefined ? JSON.stringify(patch.content) : row.content;
  db.prepare('UPDATE folios SET title = ?, content = ? WHERE id = ?').run(title, content, String(id));
  return rowToFolio(db.prepare('SELECT * FROM folios WHERE id = ?').get(String(id)));
}

// ── Notefalls ───────────────────────────────────────────────────────

function notefallsList() {
  const rows = getDb().prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  return rows.map(rowToPost);
}

function notefallsCreate(input) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO posts (
      id, author_type, author_agent_id, body, media, journal_id, tags, status_dot,
      source_app, source_icon, capture_mode, session_start, session_end, screenshots, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    'user',
    null,
    String(input?.body || ''),
    JSON.stringify(Array.isArray(input?.media) ? input.media : []),
    input?.journalId ? String(input.journalId) : null,
    JSON.stringify(Array.isArray(input?.tags) ? input.tags.map((t) => String(t).trim()).filter(Boolean) : []),
    input?.statusDot || null,
    null,
    'note',
    'manual',
    null,
    null,
    '[]',
    null,
    now,
  );
  return rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id));
}

function notefallsUpdate(id, patch) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(String(id));
  if (!row) throw new Error('Post not found');

  const body = patch?.body !== undefined ? String(patch.body) : row.body;
  const tags = patch?.tags !== undefined
    ? JSON.stringify(patch.tags.map((t) => String(t).trim()).filter(Boolean))
    : row.tags;
  const media = patch?.media !== undefined ? JSON.stringify(patch.media) : row.media;
  const notes = patch?.notes !== undefined ? String(patch.notes) : row.notes;
  const screenshots = patch?.screenshots !== undefined ? JSON.stringify(patch.screenshots) : row.screenshots;

  db.prepare('UPDATE posts SET body = ?, tags = ?, media = ?, notes = ?, screenshots = ? WHERE id = ?')
    .run(body, tags, media, notes, screenshots, String(id));
  return rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(String(id)));
}

function notefallsDelete(id) {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(String(id));
  return { ok: true };
}

async function notefallsAttachMedia() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'] }],
  });
  if (result.canceled) return [];
  return result.filePaths.map((p) => ({
    id: crypto.randomUUID(),
    path: p,
    kind: 'image',
    name: path.basename(p),
  }));
}

module.exports = {
  journalsList,
  journalsCreate,
  journalsDelete,
  foliosList,
  foliosCreate,
  foliosDelete,
  foliosUpdate,
  notefallsList,
  notefallsCreate,
  notefallsUpdate,
  notefallsDelete,
  notefallsAttachMedia,
};
