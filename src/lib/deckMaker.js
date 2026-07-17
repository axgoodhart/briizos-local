/**
 * Deck Maker — ActionDeck's "goal → deck of tasks" flow, ported onto the
 * in-process agent (PLAN-ACTIONDECK-PORT.md, Workstream C / Phase 2).
 *
 * One headless agent turn (langgraphSendMessage) per round:
 *   goal   → { isDone: true, deckTitle, tasks[] }   → caller creates the deck
 *          → { isDone: false, clarifyingQuestion }  → ask the user, retry with context
 *
 * The clarify loop runs on ONE `deck`-kind thread, so the agent keeps the
 * whole exchange in context (and the interaction is stored, per the
 * "all AI interactions are stored" decision).
 *
 * Text-only contract: the thread is registered fail-closed on the 'task'
 * surface, and the prompt forbids tool use. A deck is built FOR the user
 * to work through — nothing is executed or automated here (that's what
 * the separate task-automation pipeline is for).
 */

import logger from './logger';
import {
  restrictivePolicy,
  registerThreadSurface,
  unregisterThread,
  consumeGatedToolCalls,
} from './agentSurfaces';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

export const MAX_DECK_TASKS = 30;

export function buildDeckPrompt(goal, context = null) {
  const lines = [
    'You are an expert project manager inside briizOS. The user gives you a high-level goal; you turn it into a "deck" — a short titled stack of small, checkable tasks the USER will do themselves.',
    '',
    "Evaluate the user's goal.",
    '- If it is straightforward and you have enough information (e.g., "organize my garage", "plan a birthday party"), produce a deck: a short title (6 words or fewer) and 3-10 small, concrete tasks, each checkable on its own. Set isDone to true.',
    '- If the goal is ambiguous, emotionally complex, or missing details you genuinely need (e.g., "reconcile with mom", "get a new job"), ask exactly ONE clarifying question instead. Do not generate tasks yet. Set isDone to false.',
    '- The tasks are for the user to do by hand — do NOT phrase them as things you will do, and do NOT call any tools. This turn is text-only.',
  ];

  if (context) {
    lines.push('');
    lines.push('The user answered your previous question with:');
    lines.push(`"${context}"`);
    lines.push('Use this to generate the deck now if possible.');
  }

  lines.push('');
  lines.push('Respond with ONLY a JSON object — no markdown fences, no commentary:');
  lines.push('{ "isDone": true, "deckTitle": "short title", "tasks": ["task 1", "task 2", ...] }');
  lines.push('or');
  lines.push('{ "isDone": false, "clarifyingQuestion": "your one question" }');
  lines.push('');
  lines.push(`User Goal: "${goal}"`);

  return lines.join('\n');
}

/**
 * Parse the model's reply into { isDone, deckTitle, tasks } or
 * { isDone: false, clarifyingQuestion }. Throws with a user-readable
 * message on anything malformed — the caller shows it and the run stops
 * (nothing is written on a bad parse).
 */
export function parseDeckResponse(text) {
  const clean = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('The AI did not return the expected deck JSON. Try again.');
  }

  let parsed;
  try {
    parsed = JSON.parse(clean.slice(start, end + 1));
  } catch {
    throw new Error('The AI returned malformed JSON. Try again.');
  }

  if (parsed.isDone === false) {
    const question = String(parsed.clarifyingQuestion || '').trim();
    if (!question) throw new Error('The AI asked for clarification without a question.');
    return { isDone: false, clarifyingQuestion: question };
  }

  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map((task) => String(task).trim()).filter(Boolean).slice(0, MAX_DECK_TASKS)
    : [];
  if (parsed.isDone !== true || tasks.length === 0) {
    throw new Error('The AI returned no tasks and no question.');
  }

  return {
    isDone: true,
    deckTitle: String(parsed.deckTitle || '').trim(),
    tasks,
  };
}

export function extractText(response) {
  const messages = response?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const last = messages[messages.length - 1];
  return typeof last?.content === 'string' ? last.content : '';
}

/**
 * Create the `deck`-kind agent thread and register it fail-closed on the
 * 'task' surface so the renderer gate blocks any bridge tool the model
 * might try.
 */
export async function createDeckThread() {
  if (!api.langgraphCreateThread) throw new Error('Agent backend unavailable');
  const res = await api.langgraphCreateThread('deck');
  const threadId = res?.thread_id || res?.threadId || res;
  if (!threadId) throw new Error('Failed to create a deck thread');
  registerThreadSurface(threadId, restrictivePolicy('task'));
  logger.debug('tasks.deck', 'Deck thread created', { threadId });
  return threadId;
}

/** Run one synchronous deck turn and return the model's text. */
export async function runDeckTurn(threadId, message) {
  if (!api.langgraphSendMessage) throw new Error('Agent backend unavailable');
  const model = (await api.localData?.settings?.get('selected_model'))?.value || undefined;
  const policy = restrictivePolicy('task');

  const startedAt = Date.now();
  const response = await api.langgraphSendMessage(threadId, message, {
    model,
    thinking: true,
    tool_confirmation_mode: policy.mode,
    permission_policy: policy,
  });
  logger.debug('tasks.deck', 'Deck turn completed', { threadId, ms: Date.now() - startedAt });

  const gated = consumeGatedToolCalls(threadId);
  if (gated.length > 0) {
    throw new Error(
      `The AI tried to use a tool (${gated.map((g) => g.tool).join(', ')}) — deck creation is text-only. Try again.`
    );
  }
  return extractText(response);
}

export function releaseDeckThread(threadId) {
  if (threadId) unregisterThread(threadId);
}
