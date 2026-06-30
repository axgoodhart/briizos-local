ALTER TABLE memory_facts ADD COLUMN agent_key TEXT NOT NULL DEFAULT 'main';
ALTER TABLE memory_facts ADD COLUMN category TEXT NOT NULL DEFAULT 'context';
ALTER TABLE memory_facts ADD COLUMN confidence REAL NOT NULL DEFAULT 1 CHECK (confidence >= 0 AND confidence <= 1);

CREATE INDEX idx_messages_thread_active ON messages(thread_id, sequence, deleted_at);
CREATE INDEX idx_memory_facts_agent_active ON memory_facts(agent_key, deleted_at, created_at);
CREATE INDEX idx_conversation_summaries_thread_active ON conversation_summaries(thread_id, deleted_at, created_at);
