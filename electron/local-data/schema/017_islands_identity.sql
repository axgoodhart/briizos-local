ALTER TABLE forest_files RENAME TO island_files;
ALTER TABLE forest_projects RENAME TO island_projects;
ALTER TABLE forest_view_state RENAME TO island_view_state;
ALTER TABLE tasks RENAME COLUMN forest_project_id TO island_project_id;

DROP INDEX idx_forest_files_board_id;
CREATE UNIQUE INDEX idx_island_files_board_id ON island_files(project_id, board_file_id);
DROP INDEX idx_tasks_forest_project;
CREATE INDEX idx_tasks_island_project ON tasks(island_project_id, deleted_at);

INSERT INTO domain_revisions (domain, revision, updated_at)
SELECT 'island', revision, updated_at FROM domain_revisions WHERE domain = 'forest'
ON CONFLICT(domain) DO UPDATE SET
  revision = MAX(domain_revisions.revision, excluded.revision),
  updated_at = MAX(domain_revisions.updated_at, excluded.updated_at);
DELETE FROM domain_revisions WHERE domain = 'forest';

INSERT INTO sync_outbox (domain, dirty_revision, status, attempts, next_attempt_at, last_error_code, created_at, updated_at)
SELECT 'island', dirty_revision, 'pending', 0, NULL, NULL, created_at, updated_at
FROM sync_outbox WHERE domain = 'forest'
ON CONFLICT(domain) DO UPDATE SET
  dirty_revision = MAX(sync_outbox.dirty_revision, excluded.dirty_revision),
  status = 'pending', attempts = 0, next_attempt_at = NULL, last_error_code = NULL,
  created_at = MIN(sync_outbox.created_at, excluded.created_at),
  updated_at = MAX(sync_outbox.updated_at, excluded.updated_at);
DELETE FROM sync_outbox WHERE domain = 'forest';

INSERT INTO sync_state (domain, last_uploaded_revision, remote_revision, cursor, updated_at)
SELECT 'island', last_uploaded_revision, remote_revision, cursor, updated_at
FROM sync_state WHERE domain = 'forest'
ON CONFLICT(domain) DO UPDATE SET
  last_uploaded_revision = MAX(sync_state.last_uploaded_revision, excluded.last_uploaded_revision),
  updated_at = MAX(sync_state.updated_at, excluded.updated_at);
DELETE FROM sync_state WHERE domain = 'forest';
UPDATE logs SET category = replace(category, 'forest', 'island') WHERE category LIKE 'forest%';

-- Keep duplicate tasks and their links; the current task retains the shared de-duplication key.
UPDATE tasks SET source_key = NULL
WHERE source_key LIKE 'forest-%' AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM tasks AS current
    WHERE current.source_key = replace(tasks.source_key, 'forest-', 'island-')
      AND current.deleted_at IS NULL
  );
UPDATE tasks SET source_key = replace(source_key, 'forest-', 'island-') WHERE source_key LIKE 'forest-%';

-- Panel IDs identify saved layout instances, independently of the feature name.
UPDATE workspace_panels SET feature_key = 'island' WHERE feature_key = 'forest';

UPDATE settings
SET value_json = replace(replace(replace(value_json, 'Forest', 'Island'), 'FOREST', 'ISLAND'), 'forest', 'island')
WHERE key IN ('ui_theme_library', 'ui_theme_library_backup', 'ambient_workspace')
  AND (instr(value_json, 'forest') > 0 OR instr(value_json, 'Forest') > 0 OR instr(value_json, 'FOREST') > 0);
