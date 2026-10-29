-- Stylofact, second version: one style guide written from the user's own
-- samples, pieces written from that guide, and a record of every AI run.
-- Table names avoid the retired 007/013 Stylofact tables, which stay inert.
CREATE TABLE stylofact_guides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Your voice',
  guide_text TEXT NOT NULL DEFAULT '',
  addenda_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(addenda_json)),
  measurements_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(measurements_json)),
  measured_at INTEGER,
  written_at INTEGER,
  edited_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE stylofact_samples (
  id TEXT PRIMARY KEY,
  guide_id TEXT NOT NULL REFERENCES stylofact_guides(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  form TEXT NOT NULL DEFAULT 'all',
  origin TEXT NOT NULL DEFAULT 'paste' CHECK (origin IN ('paste', 'file')),
  file_path TEXT,
  file_kind TEXT,
  body_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  truncated INTEGER NOT NULL DEFAULT 0 CHECK (truncated IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_samples_guide ON stylofact_samples(guide_id, deleted_at, created_at);

CREATE TABLE stylofact_pieces (
  id TEXT PRIMARY KEY,
  guide_id TEXT NOT NULL REFERENCES stylofact_guides(id) ON DELETE CASCADE,
  guide_revision INTEGER,
  title TEXT NOT NULL DEFAULT '',
  request_text TEXT NOT NULL DEFAULT '',
  form TEXT NOT NULL DEFAULT 'all',
  phrasings_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(phrasings_json) AND json_type(phrasings_json) = 'array'),
  quotes_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(quotes_json) AND json_type(quotes_json) = 'array'),
  draft_text TEXT NOT NULL DEFAULT '',
  review_text TEXT NOT NULL DEFAULT '',
  chosen TEXT NOT NULL DEFAULT 'draft' CHECK (chosen IN ('draft', 'review')),
  drift_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(drift_json)),
  stage TEXT NOT NULL DEFAULT 'find' CHECK (stage IN ('find', 'choose', 'write', 'done')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_pieces_active ON stylofact_pieces(deleted_at, updated_at DESC);

CREATE TABLE stylofact_piece_runs (
  id TEXT PRIMARY KEY,
  piece_id TEXT REFERENCES stylofact_pieces(id) ON DELETE SET NULL,
  guide_id TEXT REFERENCES stylofact_guides(id) ON DELETE SET NULL,
  stage TEXT NOT NULL,
  model_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  input_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(input_json)),
  result_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(result_json)),
  error_text TEXT,
  agent_thread_id TEXT,
  agent_turn_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_stylofact_piece_runs_recent ON stylofact_piece_runs(created_at DESC);
