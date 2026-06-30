ALTER TABLE journals ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json));
ALTER TABLE journals ADD COLUMN page_key TEXT NOT NULL DEFAULT '';
ALTER TABLE journals ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE notefall_posts ADD COLUMN author_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE notefall_posts ADD COLUMN author_agent_id TEXT;
ALTER TABLE notefall_posts ADD COLUMN journal_id TEXT REFERENCES journals(id) ON DELETE SET NULL;
ALTER TABLE notefall_posts ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json));
ALTER TABLE notefall_posts ADD COLUMN status_dot TEXT;
ALTER TABLE notefall_posts ADD COLUMN source_app TEXT;
ALTER TABLE notefall_posts ADD COLUMN source_icon TEXT;
ALTER TABLE notefall_posts ADD COLUMN capture_mode TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE notefall_posts ADD COLUMN session_start INTEGER;
ALTER TABLE notefall_posts ADD COLUMN session_end INTEGER;
ALTER TABLE notefall_posts ADD COLUMN notes TEXT;

ALTER TABLE forest_projects ADD COLUMN data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json));
ALTER TABLE forest_files ADD COLUMN data_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data_json));
ALTER TABLE forest_files ADD COLUMN board_file_id TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX idx_forest_files_board_id ON forest_files(project_id, board_file_id);
