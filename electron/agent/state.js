/**
 * JS port of agent/src/agents/thread_state.py — ThreadState.
 *
 * LangGraph.js uses Annotation.Root with reducers; this matches the
 * shape ToolConfirmationMiddleware (Python) and the Python ThreadState
 * carried, so the JS lead_agent can express the same per-turn state
 * without the Python type hints.
 */

const { Annotation, MessagesAnnotation } = require('@langchain/langgraph');

// Reducer: merge + dedupe artifact paths, preserve order.
function mergeArtifacts(existing, next) {
  if (existing == null) return next || [];
  if (next == null) return existing;
  const seen = new Set();
  const out = [];
  for (const item of existing) if (!seen.has(item)) { seen.add(item); out.push(item); }
  for (const item of next) if (!seen.has(item)) { seen.add(item); out.push(item); }
  return out;
}

// Reducer: merge viewed_images dicts. Empty {} clears (matches Python semantics).
function mergeViewedImages(existing, next) {
  if (existing == null) return next || {};
  if (next == null) return existing;
  if (Object.keys(next).length === 0) return {};
  return { ...existing, ...next };
}

// Last-write-wins reducer used for scalar fields that middlewares may set.
function lastWrite(_existing, next) {
  return next;
}

const ThreadState = Annotation.Root({
  ...MessagesAnnotation.spec,
  sandbox: Annotation({ reducer: lastWrite, default: () => null }),
  threadData: Annotation({ reducer: lastWrite, default: () => null }),
  title: Annotation({ reducer: lastWrite, default: () => null }),
  artifacts: Annotation({ reducer: mergeArtifacts, default: () => [] }),
  todos: Annotation({ reducer: lastWrite, default: () => null }),
  uploadedFiles: Annotation({ reducer: lastWrite, default: () => null }),
  viewedImages: Annotation({ reducer: mergeViewedImages, default: () => ({}) }),
});

module.exports = { ThreadState };
