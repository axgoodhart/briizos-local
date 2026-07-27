/**
 * Assistant contract and the one path to a model (PLAN-BRIIZY.md §10).
 *
 * Every assistant is `{ id, kind, defaultPrompt, onFrame?, onContextSwitch?,
 * onSegmentClose? }`. The coordinator owns scheduling; an assistant only decides
 * what to do with a batch it is handed.
 *
 * All model traffic goes through `callModel` here, which is where I2 is
 * enforced in code rather than by convention:
 *
 *   1. `cloudTextAnalysisAllowed` must be on. Screen text is the user's private
 *      context; sending it to a provider is an explicit consent, not a default.
 *   2. The assembled payload is scanned by `assertNoPixelEgress` and the request
 *      is ABORTED if anything resembling image bytes or a filesystem path is in
 *      it. A bug that leaked a path fails loudly here instead of shipping it.
 *
 * Nothing in this file writes to the database. Assistants return structured
 * results and the coordinator persists them, so provenance and reversibility
 * (I7) live in one place.
 */

const { createChatModel } = require('../../agent/models');
const privacy = require('../../rewind/privacy');

/** Hard ceiling on the context handed to a model, in characters. */
const MAX_CONTEXT_CHARS = 12000;
/** Per-frame OCR excerpt cap, so one dense frame cannot fill the budget. */
const MAX_FRAME_CHARS = 900;

class EgressBlockedError extends Error {
  constructor(violations) {
    super(`Blocked a model request that would have leaked: ${violations.join(', ')}`);
    this.name = 'EgressBlockedError';
    this.code = 'EGRESS_BLOCKED';
    this.violations = violations;
  }
}

class AnalysisNotAllowedError extends Error {
  constructor() {
    super('Cloud text analysis is off — briizy will not send screen text to a model provider');
    this.name = 'AnalysisNotAllowedError';
    this.code = 'ANALYSIS_NOT_ALLOWED';
  }
}

/**
 * Turn frames into a plain-text context block.
 *
 * Only ever emits app name, window title, timestamp, and OCR text — the four
 * things I2 permits. Frame ids are kept OUT of the model-facing text and
 * tracked separately, so provenance survives without the model being handed
 * identifiers it might echo back as if they were content.
 */
function buildContextBatch(frames = [], { maxChars = MAX_CONTEXT_CHARS } = {}) {
  const lines = [];
  const frameIds = [];
  const apps = new Set();
  let budget = maxChars;

  // Newest last, so the model reads the segment in the order it happened.
  const ordered = [...frames].sort((a, b) => a.capturedAt - b.capturedAt);

  for (const frame of ordered) {
    frameIds.push(frame.frameId);
    if (frame.appName) apps.add(frame.appName);
    const text = (frame.ocrText || '').replace(/\s+/g, ' ').trim();
    if (!text || budget <= 0) continue;
    const excerpt = text.slice(0, Math.min(MAX_FRAME_CHARS, budget));
    const clock = new Date(frame.capturedAt).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
    const header = `[${clock}] ${frame.appName || 'unknown app'}`
      + (frame.windowTitle ? ` — ${frame.windowTitle}` : '');
    const block = `${header}\n${excerpt}`;
    budget -= block.length;
    lines.push(block);
  }

  return {
    text: lines.join('\n\n'),
    frameIds,
    apps: [...apps],
    frameCount: ordered.length,
    withText: lines.length,
    startedAt: ordered[0]?.capturedAt ?? null,
    endedAt: ordered[ordered.length - 1]?.capturedAt ?? null,
  };
}

/** Strip code fences and parse JSON, tolerating a chatty model. */
function parseJsonResponse(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  if (fence) text = fence[1].trim();
  // A model that prefixes prose still usually leaves a parseable object behind.
  if (!text.startsWith('{') && !text.startsWith('[')) {
    const start = text.search(/[[{]/);
    if (start === -1) return null;
    text = text.slice(start);
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageText(response) {
  const content = response?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('');
  }
  return '';
}

/**
 * The single call site for assistant model traffic.
 *
 * @param {object}   options
 * @param {string}   options.assistantId
 * @param {string}   options.systemPrompt
 * @param {string}   options.userContent   assembled context — OCR text only
 * @param {object}   options.config        the briizy config
 * @param {object}   options.assistant     the per-assistant config slice
 * @param {object}   options.logger
 * @param {boolean} [options.expectJson]
 */
async function callModel({
  assistantId, systemPrompt, userContent, config, assistant, logger, expectJson = true,
}) {
  if (!config?.cloudTextAnalysisAllowed) {
    throw new AnalysisNotAllowedError();
  }

  const payload = {
    model: assistant?.model || null,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  };

  // I2, enforced: nothing that looks like pixels or a path may leave.
  const egress = privacy.assertNoPixelEgress(payload);
  if (!egress.clean) {
    logger?.error?.('briizy.assistant', 'Blocked a model request before it left the machine', {
      assistantId,
      violations: egress.violations,
    });
    throw new EgressBlockedError(egress.violations);
  }

  const startedAt = Date.now();
  logger?.debug?.('briizy.assistant', 'Model request starting', {
    assistantId,
    model: assistant?.model || 'default',
    contextChars: userContent.length,
  });

  const model = createChatModel({
    name: assistant?.model || null,
    temperature: 0.2,
    maxTokens: 1500,
  });
  const response = await model.invoke(payload.messages);
  const raw = messageText(response);
  const elapsedMs = Date.now() - startedAt;

  logger?.info?.('briizy.assistant', `${assistantId} model call complete`, {
    assistantId,
    model: assistant?.model || 'default',
    ms: elapsedMs,
    contextChars: userContent.length,
    responseChars: raw.length,
    usage: response?.usage_metadata || response?.response_metadata?.usage || null,
  });

  if (!expectJson) return { raw, elapsedMs };

  const parsed = parseJsonResponse(raw);
  if (!parsed) {
    logger?.warn?.('briizy.assistant', `${assistantId} returned unparseable JSON`, {
      assistantId,
      preview: raw.slice(0, 300),
    });
  }
  return { raw, parsed, elapsedMs };
}

/**
 * Shared instruction footer. Assistants are told explicitly that they are
 * looking at the user's own screen and that their output is a proposal, never an
 * action — the staging default (I6) has to be legible in the prompt too, not
 * only in the code.
 */
const SHARED_GUARDRAILS = `
You are looking at text captured from the user's own screen on their own Mac. It
is their private working context, shown to you so you can be useful about what
they are actually doing.

Rules:
- Only claim what the text supports. Do not invent names, numbers, or deadlines.
- If the context is too thin to say anything useful, return an empty result. An
  empty result is a correct answer and is strongly preferred over a vague one.
- OCR is imperfect. Ignore garbled fragments rather than guessing at them.
- Your output is a proposal for the user to accept or reject. Nothing you return
  is executed. Do not describe yourself as having done anything.
- Reply with JSON only. No prose, no code fences.`.trim();

module.exports = {
  AnalysisNotAllowedError,
  EgressBlockedError,
  MAX_CONTEXT_CHARS,
  SHARED_GUARDRAILS,
  buildContextBatch,
  callModel,
  parseJsonResponse,
};
