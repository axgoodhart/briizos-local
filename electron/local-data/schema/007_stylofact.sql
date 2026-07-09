-- Stylofact keeps the user's corpora, measurable profile, pipeline decisions,
-- and generated artifacts local to briizOS.  Sources and outputs are separate
-- rows so a project remains inspectable after later pipeline runs.
CREATE TABLE stylofact_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'voice' CHECK (stage IN ('voice', 'theme', 'review', 'blueprint', 'generate', 'complete')),
  approval_mode TEXT NOT NULL DEFAULT 'manual' CHECK (approval_mode IN ('manual', 'automatic')),
  profile_choice TEXT NOT NULL DEFAULT 'primary' CHECK (profile_choice IN ('primary', 'review')),
  target_prompt TEXT NOT NULL DEFAULT '',
  primary_model TEXT,
  critic_model TEXT,
  style_metrics_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(style_metrics_json)),
  style_profile_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(style_profile_json)),
  style_review_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(style_review_json)),
  extraction_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(extraction_json)),
  selected_artifact_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(selected_artifact_ids_json) AND json_type(selected_artifact_ids_json) = 'array'),
  blueprint_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(blueprint_json)),
  generation_options_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(generation_options_json)),
  project_thread_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_projects_active ON stylofact_projects(updated_at DESC, deleted_at);

CREATE TABLE stylofact_sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES stylofact_projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('style', 'thematic')),
  origin TEXT NOT NULL DEFAULT 'paste' CHECK (origin IN ('paste', 'drop', 'import')),
  label TEXT NOT NULL DEFAULT '',
  file_path TEXT,
  body_text TEXT NOT NULL DEFAULT '',
  provenance_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(provenance_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_sources_project_role ON stylofact_sources(project_id, role, created_at, deleted_at);

CREATE TABLE stylofact_artifacts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES stylofact_projects(id) ON DELETE CASCADE,
  medium TEXT NOT NULL,
  variation INTEGER NOT NULL CHECK (variation >= 1),
  title TEXT NOT NULL DEFAULT '',
  content_text TEXT NOT NULL DEFAULT '',
  draft_text TEXT NOT NULL DEFAULT '',
  critic_text TEXT,
  voice_evaluation_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(voice_evaluation_json)),
  source_brief_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(source_brief_json)),
  primary_model TEXT,
  critic_model TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_artifacts_project_medium ON stylofact_artifacts(project_id, medium, variation, deleted_at);

CREATE TABLE stylofact_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES stylofact_projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  model_name TEXT,
  critic_model_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  input_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(input_json)),
  result_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(result_json)),
  error_text TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_stylofact_runs_project_stage ON stylofact_runs(project_id, stage, created_at DESC, deleted_at);
