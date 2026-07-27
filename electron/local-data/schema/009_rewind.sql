-- 009_rewind.sql — briizy work-memory storage (PLAN-BRIIZY.md §8).
--
-- Electron owns every durable byte of metadata here (I4); the Swift helper owns
-- only the JPEG files it writes. These tables are LOCAL-ONLY and must never
-- appear in a Firestore sync adapter (I9) — they deliberately use the 'rewind'
-- domain, which is not in CONTINUITY_DOMAINS, so writes never reach sync_outbox.

CREATE TABLE rewind_sessions (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  -- 'auto'    — opened by the indexer, closed on a day boundary, sleep/wake,
  --             or the configured inactivity gap
  -- 'display' — explicitly bounded by startDisplaySession/endDisplaySession
  kind TEXT NOT NULL DEFAULT 'auto' CHECK (kind IN ('auto', 'display')),
  top_apps_json TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(top_apps_json) AND json_type(top_apps_json) = 'array'),
  headline TEXT,
  frame_count INTEGER NOT NULL DEFAULT 0 CHECK (frame_count >= 0),
  bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0),
  -- The Notefalls session card for this session, once one has been posted.
  -- One card per session, never one per frame (§8).
  notefall_post_id TEXT REFERENCES notefall_posts(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE INDEX idx_rewind_sessions_started ON rewind_sessions(started_at, deleted_at);
CREATE INDEX idx_rewind_sessions_open ON rewind_sessions(kind, ended_at)
  WHERE ended_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_rewind_sessions_post ON rewind_sessions(notefall_post_id);

CREATE TABLE rewind_frames (
  id TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  session_id TEXT REFERENCES rewind_sessions(id) ON DELETE CASCADE,
  app_name TEXT,
  bundle_id TEXT,
  window_title TEXT,
  capture_mode TEXT NOT NULL DEFAULT 'window' CHECK (capture_mode IN ('window', 'display')),
  -- Loose JPEG on disk. Goes NULL once Phase 7 compaction folds the frame into
  -- a video chunk, at which point media_path/media_offset carry the pointer.
  image_path TEXT,
  media_path TEXT,
  media_offset INTEGER,
  bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0),
  width INTEGER,
  height INTEGER,
  -- 64-bit dHash as hex. Hamming distance against the previous frame decides
  -- whether this frame is a near-duplicate (caret blink, spinner, clock tick).
  phash TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ocr_status IN ('pending', 'done', 'skipped', 'deferred', 'failed', 'duplicate')),
  ocr_text TEXT,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX idx_rewind_frames_captured ON rewind_frames(captured_at, deleted_at);
CREATE INDEX idx_rewind_frames_app ON rewind_frames(app_name, captured_at);
CREATE INDEX idx_rewind_frames_session ON rewind_frames(session_id, captured_at);
CREATE INDEX idx_rewind_frames_ocr_status ON rewind_frames(ocr_status)
  WHERE ocr_status IN ('pending', 'deferred');

-- Full-text search over OCR text and window titles, structured as omi's
-- createScreenshotsFTS (RewindDatabase.swift:844-880) but as an EXTERNAL
-- CONTENT table: the index lives here, the text stays in rewind_frames, so a
-- month of OCR is indexed once instead of stored twice.
CREATE VIRTUAL TABLE rewind_frames_fts USING fts5(
  ocr_text,
  window_title,
  content = 'rewind_frames',
  content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER rewind_frames_fts_ai AFTER INSERT ON rewind_frames BEGIN
  INSERT INTO rewind_frames_fts(rowid, ocr_text, window_title)
  VALUES (new.rowid, new.ocr_text, new.window_title);
END;

CREATE TRIGGER rewind_frames_fts_ad AFTER DELETE ON rewind_frames BEGIN
  INSERT INTO rewind_frames_fts(rewind_frames_fts, rowid, ocr_text, window_title)
  VALUES ('delete', old.rowid, old.ocr_text, old.window_title);
END;

CREATE TRIGGER rewind_frames_fts_au AFTER UPDATE ON rewind_frames BEGIN
  INSERT INTO rewind_frames_fts(rewind_frames_fts, rowid, ocr_text, window_title)
  VALUES ('delete', old.rowid, old.ocr_text, old.window_title);
  INSERT INTO rewind_frames_fts(rowid, ocr_text, window_title)
  VALUES (new.rowid, new.ocr_text, new.window_title);
END;

-- Per-block boxes for match highlighting. Normalized 0-1 with a TOP-LEFT
-- origin (the helper flips Vision's bottom-left origin) so the renderer can
-- position overlays without another coordinate conversion.
CREATE TABLE rewind_ocr_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  frame_id TEXT NOT NULL REFERENCES rewind_frames(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  w REAL NOT NULL,
  h REAL NOT NULL,
  confidence REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_rewind_ocr_blocks_frame ON rewind_ocr_blocks(frame_id, position);
