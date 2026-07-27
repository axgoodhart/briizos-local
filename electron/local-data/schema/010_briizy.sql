-- 010_briizy.sql — extractions, staged tasks, proposals, goals (PLAN-BRIIZY.md §10).
--
-- Local-only, like 009: these use the 'briizy' domain, which is not in
-- CONTINUITY_DOMAINS, so nothing here reaches sync_outbox or Firestore (I9).
--
-- Every derived row carries provenance back to the frame or session that
-- produced it (I7), which is what makes "what briizy learned" auditable and
-- every write undoable.

-- Raw assistant output, before it becomes anything the user sees. Ported from
-- omi's proactive_extractions (RewindDatabase.swift migration 6).
CREATE TABLE briizy_extractions (
  id TEXT PRIMARY KEY,
  assistant_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('insight', 'task', 'memory', 'goal', 'focus', 'summary')),
  content TEXT NOT NULL,
  reasoning TEXT,
  context_summary TEXT,
  model TEXT,
  source_frame_id TEXT REFERENCES rewind_frames(id) ON DELETE SET NULL,
  source_session_id TEXT REFERENCES rewind_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'used', 'superseded', 'discarded')),
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_briizy_extractions_kind ON briizy_extractions(kind, created_at);
CREATE INDEX idx_briizy_extractions_session ON briizy_extractions(source_session_id);
CREATE INDEX idx_briizy_extractions_status ON briizy_extractions(status, created_at);

-- External-content FTS, same shape as rewind_frames_fts: index only, text stays
-- in the base table.
CREATE VIRTUAL TABLE briizy_extractions_fts USING fts5(
  content,
  context_summary,
  content = 'briizy_extractions',
  content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER briizy_extractions_fts_ai AFTER INSERT ON briizy_extractions BEGIN
  INSERT INTO briizy_extractions_fts(rowid, content, context_summary)
  VALUES (new.rowid, new.content, new.context_summary);
END;

CREATE TRIGGER briizy_extractions_fts_ad AFTER DELETE ON briizy_extractions BEGIN
  INSERT INTO briizy_extractions_fts(briizy_extractions_fts, rowid, content, context_summary)
  VALUES ('delete', old.rowid, old.content, old.context_summary);
END;

CREATE TRIGGER briizy_extractions_fts_au AFTER UPDATE ON briizy_extractions BEGIN
  INSERT INTO briizy_extractions_fts(briizy_extractions_fts, rowid, content, context_summary)
  VALUES ('delete', old.rowid, old.content, old.context_summary);
  INSERT INTO briizy_extractions_fts(rowid, content, context_summary)
  VALUES (new.rowid, new.content, new.context_summary);
END;

-- Candidate tasks awaiting review. Staging is the default and only mode until
-- immediate execution is opted into per assistant (I6, §3).
CREATE TABLE briizy_staged_tasks (
  id TEXT PRIMARY KEY,
  extraction_id TEXT REFERENCES briizy_extractions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  due_hint TEXT,
  confidence REAL NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'staged'
    CHECK (status IN ('staged', 'accepted', 'rejected', 'expired')),
  -- Set once the user accepts and a real task exists. NULL means nothing has
  -- been created, which is the state accepting must start from (I6).
  created_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  source_frame_id TEXT REFERENCES rewind_frames(id) ON DELETE SET NULL,
  source_session_id TEXT REFERENCES rewind_sessions(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE INDEX idx_briizy_staged_tasks_status ON briizy_staged_tasks(status, created_at);
CREATE INDEX idx_briizy_staged_tasks_session ON briizy_staged_tasks(source_session_id);

-- Anything briizy asks the user to decide, with the §2 BriizyProposal state
-- machine: pending | accepted | dismissed | snoozed | expired.
CREATE TABLE briizy_proposals (
  id TEXT PRIMARY KEY,
  assistant_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high')),
  title TEXT,
  summary TEXT NOT NULL,
  rationale TEXT,
  evidence_json TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(evidence_json) AND json_type(evidence_json) = 'array'),
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending', 'accepted', 'dismissed', 'snoozed', 'expired')),
  snooze_until INTEGER,
  created_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  extraction_id TEXT REFERENCES briizy_extractions(id) ON DELETE SET NULL,
  staged_task_id TEXT REFERENCES briizy_staged_tasks(id) ON DELETE SET NULL,
  -- Normalized identity for the thing being proposed, so the same suggestion
  -- cannot come back while an identical one is still pending.
  dedupe_key TEXT,
  source_frame_id TEXT REFERENCES rewind_frames(id) ON DELETE SET NULL,
  source_session_id TEXT REFERENCES rewind_sessions(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE INDEX idx_briizy_proposals_state ON briizy_proposals(state, created_at);
CREATE INDEX idx_briizy_proposals_assistant ON briizy_proposals(assistant_id, created_at);
-- Only one live proposal per identity. Dismissed/accepted ones stay for the
-- outcome log and for teaching the prompt what gets rejected.
CREATE UNIQUE INDEX idx_briizy_proposals_dedupe ON briizy_proposals(dedupe_key)
  WHERE dedupe_key IS NOT NULL AND state = 'pending' AND deleted_at IS NULL;

-- Outcome log: every state transition, so "what briizy learned" and the
-- dismissal feedback loop both have a real record (I7, §14 proposal fatigue).
CREATE TABLE briizy_proposal_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id TEXT NOT NULL REFERENCES briizy_proposals(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'user' CHECK (actor IN ('user', 'briizy', 'system')),
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_briizy_proposal_events_proposal
  ON briizy_proposal_events(proposal_id, created_at);

-- Goals (omi GoalRecord.swift / GoalStorage.swift). Phase 5 evaluates recent
-- context against these; the table lands now so the schema stops moving.
CREATE TABLE briizy_goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'achieved', 'abandoned')),
  target_at INTEGER,
  last_evaluated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE INDEX idx_briizy_goals_status ON briizy_goals(status, created_at);

-- Provenance on the EXISTING facts table rather than a parallel one (I1). A
-- fact learned from the screen has to be traceable to the frame that taught it,
-- and undoable from there (I7).
-- `confidence` already exists from 004_chat_memory.sql and is reused as-is; only
-- the provenance columns are new.
ALTER TABLE memory_facts ADD COLUMN origin TEXT NOT NULL DEFAULT 'chat';
ALTER TABLE memory_facts ADD COLUMN source_frame_id TEXT REFERENCES rewind_frames(id) ON DELETE SET NULL;
ALTER TABLE memory_facts ADD COLUMN source_session_id TEXT REFERENCES rewind_sessions(id) ON DELETE SET NULL;
ALTER TABLE memory_facts ADD COLUMN extraction_id TEXT REFERENCES briizy_extractions(id) ON DELETE SET NULL;

CREATE INDEX idx_memory_facts_origin ON memory_facts(origin, deleted_at);
