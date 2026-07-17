ALTER TABLE tasks ADD COLUMN forest_project_id TEXT REFERENCES forest_projects(id);
ALTER TABLE tasks ADD COLUMN source_key TEXT;
CREATE INDEX idx_tasks_forest_project ON tasks(forest_project_id, deleted_at);
CREATE UNIQUE INDEX idx_tasks_active_source ON tasks(source_key) WHERE source_key IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE placements (
  id TEXT PRIMARY KEY,
  ref_type TEXT NOT NULL DEFAULT 'task' CHECK (ref_type = 'task'),
  ref_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date TEXT NOT NULL CHECK (length(date) = 10),
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute <= 1439),
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 1 AND duration_minutes <= 1440),
  recurrence_json TEXT CHECK (recurrence_json IS NULL OR json_valid(recurrence_json)),
  completed_dates_json TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(completed_dates_json) AND json_type(completed_dates_json) = 'array'),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  deleted_at INTEGER
);

CREATE INDEX idx_placements_ref ON placements(ref_type, ref_id, deleted_at);
CREATE INDEX idx_placements_date ON placements(date, deleted_at);
