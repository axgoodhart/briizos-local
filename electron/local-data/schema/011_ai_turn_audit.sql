-- 011_ai_turn_audit.sql — inspectable AI request/response evidence.
--
-- `messages` remains the user-visible transcript: only the text the person
-- sent and the assistant text shown in chat belongs there. This table is the
-- developer view. It records the exact effective LangChain/LangGraph envelope
-- for each provider invocation, including system/tool messages and duplicates.
--
-- Rows are append-only by design. The initial turn row precedes graph execution;
-- OpenAI also writes its exact wire request before dispatch, while other
-- adapters write the complete request when their LangChain boundary event is
-- observed. Later response/error rows add outcomes without rewriting or erasing
-- the request evidence. `thread_id` deliberately is not a foreign key:
-- internal suggestion/automation runs use derived thread IDs, and audit history
-- must remain inspectable even if a user later archives or removes a chat.
CREATE TABLE ai_turn_audit_events (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  turn_id TEXT NOT NULL,
  invocation_id TEXT,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  turn_kind TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  modality TEXT,
  outcome TEXT NOT NULL,
  effective_config_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(effective_config_json)),
  permission_policy_json TEXT
    CHECK (permission_policy_json IS NULL OR json_valid(permission_policy_json)),
  request_json TEXT
    CHECK (request_json IS NULL OR json_valid(request_json)),
  response_json TEXT
    CHECK (response_json IS NULL OR json_valid(response_json)),
  error_json TEXT
    CHECK (error_json IS NULL OR json_valid(error_json)),
  token_usage_json TEXT
    CHECK (token_usage_json IS NULL OR json_valid(token_usage_json)),
  created_at INTEGER NOT NULL,
  UNIQUE(turn_id, sequence)
);

CREATE INDEX idx_ai_turn_audit_thread
  ON ai_turn_audit_events(thread_id, created_at);
CREATE INDEX idx_ai_turn_audit_turn
  ON ai_turn_audit_events(turn_id, sequence);
CREATE INDEX idx_ai_turn_audit_invocation
  ON ai_turn_audit_events(invocation_id, created_at);
CREATE INDEX idx_ai_turn_audit_outcome
  ON ai_turn_audit_events(outcome, created_at);
