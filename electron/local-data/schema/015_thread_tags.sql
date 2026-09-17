-- 015_thread_tags.sql — findable conversations in the conversation browser.
--
-- `tags_json` is the visible, ordered, deduped tag list, exactly the convention
-- `journals`, `notefall_posts`, and `organizer_items` already use. It is the
-- only thing the browser's facets, counts, and chips read.
--
-- `tag_state_json` is deliberately a second column rather than extra keys in
-- the first one, because it answers a different question. `tags_json` says what
-- this conversation is about; `tag_state_json` says how the model behaved and
-- what the person decided about it — which tags the model applied (`auto`),
-- which ones the person removed and must never be proposed again
-- (`dismissed`), and the checkpoint bookkeeping (`lastEvaluatedExchanges`,
-- `evaluations`, `lastEvaluatedAt`) that stops a long conversation being
-- re-tagged on every turn. Keeping them apart means the visible list can be
-- replaced wholesale by a person editing chips without losing the record of
-- what was already refused, and every reader that only wants the tags never
-- has to know the bookkeeping exists. It also keeps `json_each(tags_json)`
-- honest: the tag facet query counts real tags and nothing else.
--
-- The index serves the browser's one hot query — non-deleted chat threads,
-- newest first — so opening the list never scans the whole table.
ALTER TABLE threads ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'
  CHECK (json_valid(tags_json) AND json_type(tags_json) = 'array');
ALTER TABLE threads ADD COLUMN tag_state_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(tag_state_json));
CREATE INDEX IF NOT EXISTS idx_threads_kind_updated
  ON threads(kind, deleted_at, updated_at DESC);
