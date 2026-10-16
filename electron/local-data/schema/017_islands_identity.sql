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

UPDATE sync_outbox SET domain = 'island' WHERE domain = 'forest';
UPDATE sync_state SET domain = 'island' WHERE domain = 'forest';
UPDATE logs SET category = replace(category, 'forest', 'island') WHERE category LIKE 'forest%';
UPDATE tasks SET source_key = replace(source_key, 'forest-', 'island-') WHERE source_key LIKE 'forest-%';
UPDATE workspace_panels SET feature_key = 'island' WHERE feature_key = 'forest';
UPDATE workspace_panels SET id = 'island' WHERE id = 'forest';

UPDATE settings
SET value_json = replace(replace(replace(value_json, 'Forest', 'Island'), 'FOREST', 'ISLAND'), 'forest', 'island')
WHERE key IN ('ui_theme_library', 'ui_theme_library_backup', 'ambient_workspace')
  AND (instr(value_json, 'forest') > 0 OR instr(value_json, 'Forest') > 0 OR instr(value_json, 'FOREST') > 0);
