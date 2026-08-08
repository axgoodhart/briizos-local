-- 014_ai_turn_labels.sql — human-readable intent labels on AI audit events.
--
-- The AI visibility timeline must say what a run was FOR ("Stylofact · Find
-- material (Stage 2 extraction)"), not the runtime's envelope type
-- ("message"). The label is supplied by the surface that starts the turn and
-- rides on every event of that turn so the summary list stays a one-table read.
ALTER TABLE ai_turn_audit_events ADD COLUMN turn_label TEXT;
