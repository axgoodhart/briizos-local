-- App-owned Stylofact corpus registry and durable retrieval receipts.
-- The large, rebuildable FTS/vector index lives in a separate sidecar database;
-- these rows retain user-facing status and the exact evidence sent to an AI turn.
CREATE TABLE stylofact_corpora (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL CHECK (source_kind IN ('chatgpt-export', 'split-folder', 'project-sources')),
  root_path TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'scanning' CHECK (state IN (
    'scanning', 'lexical-ready', 'semantic-indexing', 'ready', 'paused', 'stale', 'error'
  )),
  source_fingerprint TEXT,
  index_version TEXT NOT NULL DEFAULT 'stylofact-corpus/1',
  embedding_model TEXT NOT NULL DEFAULT 'mixedbread-ai/mxbai-embed-xsmall-v1@e6ac24e5d6efb8782b59de1647b3ececb4ece94e',
  embedding_model_checksum TEXT,
  conversation_count INTEGER NOT NULL DEFAULT 0 CHECK (conversation_count >= 0),
  user_message_count INTEGER NOT NULL DEFAULT 0 CHECK (user_message_count >= 0),
  context_message_count INTEGER NOT NULL DEFAULT 0 CHECK (context_message_count >= 0),
  chunk_count INTEGER NOT NULL DEFAULT 0 CHECK (chunk_count >= 0),
  embedded_chunk_count INTEGER NOT NULL DEFAULT 0 CHECK (embedded_chunk_count >= 0),
  progress_current INTEGER NOT NULL DEFAULT 0 CHECK (progress_current >= 0),
  progress_total INTEGER NOT NULL DEFAULT 0 CHECK (progress_total >= 0),
  progress_message TEXT NOT NULL DEFAULT '',
  last_indexed_at INTEGER,
  error_text TEXT,
  paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE UNIQUE INDEX idx_stylofact_corpora_active_path
  ON stylofact_corpora(root_path) WHERE deleted_at IS NULL;
CREATE INDEX idx_stylofact_corpora_state
  ON stylofact_corpora(state, updated_at DESC, deleted_at);

CREATE TABLE stylofact_project_corpora (
  project_id TEXT NOT NULL REFERENCES stylofact_projects(id) ON DELETE CASCADE,
  corpus_id TEXT NOT NULL REFERENCES stylofact_corpora(id) ON DELETE CASCADE,
  evidence_role TEXT NOT NULL DEFAULT 'user' CHECK (evidence_role = 'user'),
  assistant_context_turns INTEGER NOT NULL DEFAULT 1 CHECK (assistant_context_turns BETWEEN 0 AND 3),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (project_id, corpus_id)
);
CREATE INDEX idx_stylofact_project_corpora_corpus
  ON stylofact_project_corpora(corpus_id, project_id);

CREATE TABLE stylofact_retrieval_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES stylofact_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  query_text TEXT NOT NULL,
  search_mode TEXT NOT NULL DEFAULT 'lexical-only' CHECK (search_mode IN ('lexical-only', 'hybrid')),
  corpus_snapshot_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(corpus_snapshot_json)),
  search_plan_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(search_plan_json)),
  trace_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(trace_json)),
  packed_context_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(packed_context_json)),
  agent_thread_id TEXT,
  agent_turn_id TEXT,
  duration_ms INTEGER,
  error_text TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);
CREATE INDEX idx_stylofact_retrieval_runs_project
  ON stylofact_retrieval_runs(project_id, created_at DESC);

CREATE TABLE stylofact_retrieval_candidates (
  id TEXT PRIMARY KEY,
  retrieval_run_id TEXT NOT NULL REFERENCES stylofact_retrieval_runs(id) ON DELETE CASCADE,
  corpus_id TEXT NOT NULL REFERENCES stylofact_corpora(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  start_char INTEGER NOT NULL CHECK (start_char >= 0),
  end_char INTEGER NOT NULL CHECK (end_char >= start_char),
  conversation_title TEXT NOT NULL DEFAULT '',
  message_at INTEGER,
  bm25_rank INTEGER,
  bm25_score REAL,
  semantic_rank INTEGER,
  semantic_score REAL,
  fusion_score REAL NOT NULL DEFAULT 0,
  final_rank INTEGER,
  selected INTEGER NOT NULL DEFAULT 0 CHECK (selected IN (0, 1)),
  exclusion_reason TEXT,
  exact_text TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_stylofact_retrieval_candidates_run
  ON stylofact_retrieval_candidates(retrieval_run_id, selected DESC, final_rank, fusion_score DESC);

ALTER TABLE stylofact_runs ADD COLUMN agent_thread_id TEXT;
ALTER TABLE stylofact_runs ADD COLUMN agent_turn_id TEXT;
ALTER TABLE stylofact_runs ADD COLUMN retrieval_run_id TEXT REFERENCES stylofact_retrieval_runs(id) ON DELETE SET NULL;
