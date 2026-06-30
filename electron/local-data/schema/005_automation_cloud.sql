CREATE INDEX idx_commands_status_requested ON commands(status, requested_at, deleted_at);
CREATE INDEX idx_runs_status_updated ON runs(status, updated_at, deleted_at);
CREATE INDEX idx_runs_command ON runs(command_id, deleted_at);
CREATE INDEX idx_run_events_run_active ON run_events(run_id, sequence, deleted_at);
CREATE INDEX idx_shared_text_owner_active ON shared_text_mirrors(owner_app_id, type, deleted_at);

INSERT INTO app_meta (key, value, updated_at)
VALUES ('continuity_auto_upload', 'true', CAST(unixepoch('subsec') * 1000 AS INTEGER))
ON CONFLICT(key) DO NOTHING;

INSERT INTO app_meta (key, value, updated_at)
VALUES ('shared_text_sources', '[]', CAST(unixepoch('subsec') * 1000 AS INTEGER))
ON CONFLICT(key) DO NOTHING;
