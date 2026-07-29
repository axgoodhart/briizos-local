-- 012_log_activities.sql — correlate fine-grained records into readable activity cards.
--
-- The individual log rows remain immutable evidence. These fields add the
-- parent activity and optional span/phase metadata needed to present many
-- related details as one default-collapsed operation without discarding them.
ALTER TABLE logs ADD COLUMN activity_id TEXT;
ALTER TABLE logs ADD COLUMN span_id TEXT;
ALTER TABLE logs ADD COLUMN parent_span_id TEXT;
ALTER TABLE logs ADD COLUMN activity_sequence INTEGER;
ALTER TABLE logs ADD COLUMN phase TEXT;
ALTER TABLE logs ADD COLUMN outcome TEXT;

CREATE INDEX idx_logs_activity
  ON logs(activity_id, created_at);
