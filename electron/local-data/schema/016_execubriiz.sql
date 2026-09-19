ALTER TABLE journals ADD COLUMN mode TEXT NOT NULL DEFAULT 'journal';
ALTER TABLE folios ADD COLUMN archive_batch TEXT;
CREATE TABLE exec_workspaces (
  journal_id TEXT PRIMARY KEY REFERENCES journals(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE exec_sessions (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  summary_revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE exec_entries (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES exec_sessions(id) ON DELETE CASCADE,
  doc_json TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  privacy TEXT NOT NULL DEFAULT 'open' CHECK (privacy IN ('open','invisible','private')),
  summary TEXT NOT NULL DEFAULT '',
  summary_revision INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX idx_exec_entries_journal ON exec_entries(journal_id, deleted_at, created_at);
CREATE TABLE exec_jobs (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_exec_jobs_queue ON exec_jobs(status, created_at);
CREATE TABLE exec_checkpoints (
  thread_id TEXT NOT NULL REFERENCES exec_jobs(id) ON DELETE CASCADE,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  checkpoint_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);
CREATE TABLE exec_checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  channel TEXT NOT NULL,
  value_json TEXT NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx),
  FOREIGN KEY (thread_id, checkpoint_ns, checkpoint_id) REFERENCES exec_checkpoints(thread_id, checkpoint_ns, checkpoint_id) ON DELETE CASCADE
);
CREATE TABLE exec_board_history (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  board_json TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
