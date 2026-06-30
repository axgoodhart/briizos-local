ALTER TABLE logs ADD COLUMN task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX idx_logs_task ON logs(task_id, created_at);

ALTER TABLE workspace_panels ADD COLUMN placement_json TEXT CHECK (placement_json IS NULL OR json_valid(placement_json));
ALTER TABLE workspace_panels ADD COLUMN style_json TEXT CHECK (style_json IS NULL OR json_valid(style_json));
