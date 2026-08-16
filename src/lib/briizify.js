/**
 * briizify — the Tasks Panel prioritize flow.
 *
 * Replaces the InteractionPanel "Prioritize" modality with a direct,
 * form-driven request: the user picks a timeframe, a time window,
 * annotation channels, and candidates (Forest projects, Tasks Panel
 * tasks, plus free-text "exogenous" items), and one headless agent
 * turn returns a "priorifact" — a time-blocked, prioritized activity
 * plan rendered as an ambient artifact at the bottom of the panel.
 *
 * Same text-only contract as deckMaker/dayPlanner: the thread is
 * registered fail-closed on the 'task' surface, the prompt forbids
 * tools, and a gated tool attempt aborts the run before anything is
 * written. The clarify loop (ask_for_details) runs on ONE 'briizify'
 * thread so the exchange stays in context and is stored.
 */

import logger from './logger';
import {
  restrictivePolicy,
  registerThreadSurface,
  unregisterThread,
  consumeGatedToolCalls,
} from './agentSurfaces';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

export const MAX_ACTIVITIES = 20;
export const ACTIVITY_KINDS = ['task', 'forest_project', 'custom', 'break'];
export const ANNOTATION_CHANNELS = ['preparation', 'steps', 'support'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function buildBriizifyPrompt(input, context = null) {
  const payload = {
    date: input.date,
    now_minute: input.nowMinute,
    timeframe: input.timeframe, // 'today' | 'this_week'
    window: input.pickTimeForMe ? null : input.window, // {startMinute,endMinute}
    pick_time_for_me: !!input.pickTimeForMe,
    channels: input.channels, // {schedule,preparation,steps,support}
    candidates: input.candidates,
    custom_items: input.customItems || [],
    existing_schedule: input.existingSchedule || [],
    ask_for_details: !!input.askForDetails,
  };

  const lines = [
    'You are briizify, the briizOS prioritizer. Turn the user\'s chosen candidates into a "priorifact": one prioritized, time-blocked activity plan the user will follow themselves.',
    'Weigh the ActionDeck factors together — deadline/timing, importance, size versus value, relevance — plus readiness. Never invent a deadline, importance score, size, or relevance; missing fields are unknown, not zero.',
    'Respect existing_schedule blocks: flow around them like water around a stone. Never move, shorten, or duplicate an existing block.',
    'All times are minutes since midnight. Fit every activity inside window. When pick_time_for_me is true, window is null: choose a sensible window in the remaining day yourself (never before now_minute).',
    'Leave short gutters (5-15 minutes) between activities. If the planned span exceeds about 3 hours, include one longer break (kind "break", 20-40 minutes).',
    'Prefer 2-8 activities plus breaks, ordered by priority into time. Do not fill every minute — fewer honest blocks beat wall-to-wall scheduling.',
    'When timeframe is "this_week", you may also place activities on later dates (date field, YYYY-MM-DD), treating the same daily window as a guide.',
  ];

  const wantsAnnotations = ANNOTATION_CHANNELS.some((channel) => input.channels?.[channel]);
  if (wantsAnnotations) {
    lines.push('For each non-break activity include ONLY the requested annotation channels:');
    if (input.channels?.preparation) {
      lines.push('- "prep": 3-6 short bullets — things to have in place, and getting mind/body in the right vibe for this specific activity.');
    }
    if (input.channels?.steps) {
      lines.push('- "steps": 3-7 short bullets — a plain walkthrough guide, "for dummies" style.');
    }
    if (input.channels?.support) {
      lines.push('- "support": 2-5 short bullets — warm, practical emotional or logistical backup for the challenging parts.');
    }
    lines.push('Omit every channel that was not requested. Keep bullets under 90 characters each.');
  } else {
    lines.push('Do not include prep, steps, or support fields — no annotation channels were requested.');
  }

  lines.push(input.askForDetails
    ? 'If something material is genuinely ambiguous, ask exactly ONE compact question first: respond {"needsDetails": true, "question": "your question"} and nothing else. Otherwise proceed.'
    : 'Do not ask questions. Infer sensible details from what is given.');
  lines.push('This turn is text-only: do not call tools.');
  lines.push('');
  lines.push('Respond with ONLY JSON — no markdown fences, no commentary:');
  lines.push('{"summary":"one sentence","activities":[{"kind":"task|forest_project|custom|break","refId":"exact candidate id or null","title":"short title","date":"YYYY-MM-DD","startMinute":840,"durationMinutes":40,"prep":["..."],"steps":["..."],"support":["..."]}]}');
  lines.push('For kind "task" or "forest_project", copy the exact candidate id into refId. Keep titles at or under 40 characters.');

  if (context) {
    lines.push('');
    lines.push('The user answered your previous question with:');
    lines.push(`"${context}"`);
    lines.push('Use this answer and produce the priorifact now if possible.');
  }

  lines.push('');
  lines.push(JSON.stringify(payload));
  return lines.join('\n');
}

function sanitizeBullets(value, max) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? '').trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Parse the model's reply into { needsDetails, question } or
 * { summary, activities }. Throws a user-readable error on anything
 * malformed — the caller shows it and nothing is written.
 */
export function parseBriizifyResponse(text, { channels = {}, defaultDate } = {}) {
  const clean = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('briizify did not return its plan JSON. Try again.');

  let parsed;
  try {
    parsed = JSON.parse(clean.slice(start, end + 1));
  } catch {
    throw new Error('briizify returned malformed plan JSON. Try again.');
  }

  if (parsed.needsDetails === true) {
    const question = String(parsed.question || '').trim();
    if (!question) throw new Error('briizify asked for details without a question.');
    return { needsDetails: true, question };
  }

  const stamp = Date.now();
  const activities = (Array.isArray(parsed.activities) ? parsed.activities : [])
    .slice(0, MAX_ACTIVITIES)
    .map((activity, index) => {
      const kind = ACTIVITY_KINDS.includes(activity?.kind) ? activity.kind : null;
      if (!kind) return null;
      const refId = activity?.refId == null ? null : String(activity.refId);
      if ((kind === 'task' || kind === 'forest_project') && !refId) return null;
      const title = String(activity?.title || (kind === 'break' ? 'break' : '')).trim().slice(0, 60);
      if (!title) return null;
      const date = DATE_RE.test(String(activity?.date || '')) ? activity.date : defaultDate;
      const startMinute = Number(activity?.startMinute);
      const durationMinutes = Number(activity?.durationMinutes);
      if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1439) return null;
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) return null;
      const entry = {
        id: `bzfa-${stamp}-${index}`,
        kind,
        refId: kind === 'custom' || kind === 'break' ? null : refId,
        title,
        date,
        startMinute,
        durationMinutes,
      };
      if (kind !== 'break') {
        if (channels.preparation) entry.prep = sanitizeBullets(activity?.prep, 8);
        if (channels.steps) entry.steps = sanitizeBullets(activity?.steps, 8);
        if (channels.support) entry.support = sanitizeBullets(activity?.support, 8);
      }
      return entry;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date === b.date ? a.startMinute - b.startMinute : a.date < b.date ? -1 : 1));

  if (!activities.some((activity) => activity.kind !== 'break')) {
    throw new Error('briizify returned no usable activities. Try again.');
  }

  return {
    summary: String(parsed.summary || '').trim().slice(0, 300),
    activities,
  };
}

export function extractText(response) {
  const messages = response?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const last = messages[messages.length - 1];
  return typeof last?.content === 'string' ? last.content : '';
}

/**
 * Create the 'briizify'-kind agent thread, registered fail-closed on
 * the 'task' surface so the renderer gate blocks any bridge tool.
 */
export async function createBriizifyThread() {
  if (!api.langgraphCreateThread) throw new Error('Agent backend unavailable');
  const res = await api.langgraphCreateThread('briizify');
  const threadId = res?.thread_id || res?.threadId || res;
  if (!threadId) throw new Error('Failed to create a briizify thread');
  registerThreadSurface(threadId, restrictivePolicy('task'));
  logger.debug('tasks.briizify', 'briizify thread created', { threadId });
  return threadId;
}

/** Run one synchronous briizify turn and return the model's text. */
export async function runBriizifyTurn(threadId, message) {
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
  logger.debug('tasks.briizify', 'briizify turn completed', { threadId, ms: Date.now() - startedAt });

  const gated = consumeGatedToolCalls(threadId);
  if (gated.length > 0) {
    throw new Error(
      `The AI tried to use a tool (${gated.map((g) => g.tool).join(', ')}) — briizify is text-only. Try again.`
    );
  }
  return extractText(response);
}

export function releaseBriizifyThread(threadId) {
  if (threadId) unregisterThread(threadId);
}
