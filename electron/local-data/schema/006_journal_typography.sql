-- Per-journal settings (typography: heading/body fonts, base size, line height).
-- Stored as a JSON blob so future journal-level preferences need no new columns.
ALTER TABLE journals ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings_json));
