CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE device_identity (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  device_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE domain_revisions (
  domain TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at INTEGER NOT NULL
);

CREATE TABLE sync_outbox (
  domain TEXT PRIMARY KEY,
  dirty_revision INTEGER NOT NULL CHECK (dirty_revision >= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at INTEGER,
  last_error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE sync_state (
  domain TEXT PRIMARY KEY,
  last_uploaded_revision INTEGER NOT NULL DEFAULT 0,
  remote_revision TEXT,
  cursor TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE organizer_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('note', 'project', 'event', 'timer')),
  parent_id TEXT REFERENCES organizer_items(id),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT,
  scheduled_start_at INTEGER,
  scheduled_end_at INTEGER,
  due_at INTEGER,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  recurrence_json TEXT CHECK (recurrence_json IS NULL OR json_valid(recurrence_json)),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json) AND json_type(tags_json) = 'array'),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_organizer_type ON organizer_items(type, deleted_at);
CREATE INDEX idx_organizer_parent ON organizer_items(parent_id, deleted_at);

CREATE TABLE retained_text (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'plain' CHECK (format IN ('plain', 'markdown')),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json) AND json_type(tags_json) = 'array'),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES organizer_items(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_at INTEGER,
  automated INTEGER NOT NULL DEFAULT 0 CHECK (automated IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_tasks_status ON tasks(status, deleted_at);
CREATE INDEX idx_tasks_project ON tasks(project_id, deleted_at);

CREATE TABLE task_steps (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  position INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_task_steps_task ON task_steps(task_id, position, deleted_at);

CREATE TABLE canvases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  html_text TEXT NOT NULL DEFAULT '',
  source_kind TEXT,
  source_url TEXT,
  render_engine TEXT,
  form_factor TEXT,
  panel_settings_json TEXT CHECK (panel_settings_json IS NULL OR json_valid(panel_settings_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE workspace_panels (
  id TEXT PRIMARY KEY,
  feature_key TEXT NOT NULL,
  linked_organizer_id TEXT REFERENCES organizer_items(id),
  linked_canvas_id TEXT REFERENCES canvases(id),
  column_id TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  size_json TEXT CHECK (size_json IS NULL OR json_valid(size_json)),
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  view_mode TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_workspace_panels_column ON workspace_panels(column_id, position, deleted_at);

CREATE TABLE workspace_state (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);

CREATE TABLE model_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings_json)),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE secrets (
  key TEXT PRIMARY KEY,
  encrypted_value BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);

CREATE TABLE external_files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  size INTEGER CHECK (size IS NULL OR size >= 0),
  modified_at INTEGER,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'missing', 'unknown')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE selected_files (
  file_id TEXT NOT NULL REFERENCES external_files(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  selected_at INTEGER NOT NULL,
  PRIMARY KEY (file_id, purpose)
);

CREATE TABLE media_queue_items (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES external_files(id),
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_media_queue_position ON media_queue_items(position, deleted_at);

CREATE TABLE media_state (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  current_item_id TEXT REFERENCES media_queue_items(id),
  position_seconds REAL NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  volume REAL NOT NULL DEFAULT 1 CHECK (volume >= 0 AND volume <= 1),
  muted INTEGER NOT NULL DEFAULT 0 CHECK (muted IN (0, 1)),
  repeat_mode TEXT NOT NULL DEFAULT 'off' CHECK (repeat_mode IN ('off', 'one', 'all')),
  shuffle INTEGER NOT NULL DEFAULT 0 CHECK (shuffle IN (0, 1)),
  panel_state_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(panel_state_json)),
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);

CREATE TABLE journals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE folios (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(content_json)),
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);
CREATE INDEX idx_folios_journal ON folios(journal_id, position, deleted_at);

CREATE TABLE notefall_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE post_attachments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES notefall_posts(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES external_files(id),
  role TEXT NOT NULL DEFAULT 'attachment',
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE forest_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE forest_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES forest_projects(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES external_files(id),
  position INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json) AND json_type(tags_json) = 'array'),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  UNIQUE(project_id, file_id)
);

CREATE TABLE forest_view_state (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  value_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(value_json)),
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);

CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'chat',
  title TEXT NOT NULL DEFAULT '',
  model_profile_id TEXT REFERENCES model_profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content_text TEXT NOT NULL DEFAULT '',
  is_error INTEGER NOT NULL DEFAULT 0 CHECK (is_error IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  UNIQUE(thread_id, sequence)
);

CREATE TABLE checkpoints (
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  checkpoint_json TEXT NOT NULL CHECK (json_valid(checkpoint_json)),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  channel TEXT NOT NULL,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx),
  FOREIGN KEY (thread_id, checkpoint_ns, checkpoint_id)
    REFERENCES checkpoints(thread_id, checkpoint_ns, checkpoint_id) ON DELETE CASCADE
);

CREATE TABLE conversation_summaries (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  first_sequence INTEGER NOT NULL,
  last_sequence INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  UNIQUE(thread_id, first_sequence, last_sequence, content_hash)
);

CREATE TABLE memory_sections (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE memory_facts (
  id TEXT PRIMARY KEY,
  section_id TEXT REFERENCES memory_sections(id) ON DELETE SET NULL,
  fact_text TEXT NOT NULL,
  source_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE commands (
  id TEXT PRIMARY KEY,
  remote_command_id TEXT UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  instruction TEXT NOT NULL,
  context_text TEXT,
  status TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  command_id TEXT REFERENCES commands(id),
  task_id TEXT REFERENCES tasks(id),
  thread_id TEXT REFERENCES threads(id),
  status TEXT NOT NULL,
  progress_current INTEGER NOT NULL DEFAULT 0,
  progress_total INTEGER NOT NULL DEFAULT 0,
  result_summary TEXT,
  error_code TEXT,
  error_message TEXT,
  started_at INTEGER,
  finished_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE run_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  payload_json TEXT CHECK (payload_json IS NULL OR json_valid(payload_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  UNIQUE(run_id, sequence)
);

CREATE TABLE operation_receipts (
  op_id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT CHECK (result_json IS NULL OR json_valid(result_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE recorder_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE recorder_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES recorder_sessions(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json)),
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  UNIQUE(session_id, sequence)
);

CREATE TABLE embedded_app_state (
  app_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  PRIMARY KEY (app_id, key)
);

CREATE TABLE briiztorm_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE briiztorm_flight_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE TABLE shared_text_mirrors (
  owner_app_id TEXT NOT NULL,
  remote_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task', 'note', 'project', 'event', 'timer', 'retained_text')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  remote_revision INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER,
  PRIMARY KEY (owner_app_id, remote_id)
);

CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  category TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL DEFAULT '',
  data_json TEXT CHECK (data_json IS NULL OR json_valid(data_json)),
  level TEXT NOT NULL DEFAULT 'info',
  thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_logs_created ON logs(created_at DESC);
CREATE INDEX idx_logs_category ON logs(category, created_at DESC);

INSERT INTO app_meta (key, value, updated_at)
VALUES ('storage_generation', '2', CAST(unixepoch('subsec') * 1000 AS INTEGER));

INSERT INTO domain_revisions (domain, revision, updated_at) VALUES
  ('tasks', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('organizer', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('retainedText', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('workspace', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('settings', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('files', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('canvases', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('forest', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('threads', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('automation', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('recorder', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('embeddedApps', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('sharedText', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER)),
  ('logs', 0, CAST(unixepoch('subsec') * 1000 AS INTEGER));
