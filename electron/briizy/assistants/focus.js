/**
 * Focus assistant (§11) — classifies the current segment as focused or drifting
 * relative to the active goal, and feeds the glow edge.
 *
 * Deliberately quieter than the others: focus produces *ambient* feedback (a
 * coloured edge on the overlay) and session statistics, not proposals. A popup
 * telling someone they are distracted is the single most resented thing a tool
 * like this can do, so this one never raises a proposal at all — it only tints
 * the edge and records what it saw.
 *
 * Reuses the existing overlay window rather than opening a second transparent
 * one: the overlay already covers the display and is already click-through, so a
 * dedicated window would buy nothing but another surface to keep in sync.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');

const DEFAULT_PROMPT = `
You are given someone's current goal and a slice of what they were just doing.

Classify the work in one word:
- "focused"   — clearly serving the goal
- "adjacent"  — plausibly supporting it (research, setup, communication about it)
- "drifting"  — clearly something else

Return JSON:
{"state":"focused"|"adjacent"|"drifting","note":"<at most 12 words, or null>","confidence":0.0-1.0}

Be generous with "adjacent". Real work involves detours. Reserve "drifting" for
work with no plausible connection to the goal at all.
`.trim();

const CONFIDENCE_FLOOR = 0.6;
const STATES = ['focused', 'adjacent', 'drifting'];

function createFocusAssistant({ service, logger, onFocus }) {
  return {
    id: 'focus',
    kind: 'focus',
    defaultPrompt: DEFAULT_PROMPT,

    async onSegmentClose({ segment, sessionId, batch }, { config, assistantConfig }) {
      const goals = service.listBriizyGoals({ status: 'active', limit: 3 });
      if (!goals.length || !batch.text) {
        // No goal means nothing to be focused on; clear any lingering tint.
        onFocus?.({ state: null, reason: 'no active goal' });
        return { state: null };
      }

      const userContent = [
        `Goal: ${goals[0].title}${goals[0].detail ? ` — ${goals[0].detail}` : ''}`,
        '',
        `Application: ${segment.appName || 'unknown'}`,
        segment.windowTitle ? `Window: ${segment.windowTitle}` : null,
        `Duration: ${Math.round(segment.durationMs / 1000)}s`,
        '',
        'Screen text, oldest first:',
        batch.text,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'focus',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const state = STATES.includes(parsed?.state) ? parsed.state : null;
      const confidence = Number(parsed?.confidence) || 0;
      if (!state || confidence < CONFIDENCE_FLOOR) {
        onFocus?.({ state: null, reason: 'not confident enough' });
        return { state: null };
      }

      service.recordBriizyExtraction({
        assistantId: 'focus',
        kind: 'focus',
        content: state,
        reasoning: parsed.note || null,
        contextSummary: `${segment.appName || 'unknown'} · ${Math.round(segment.durationMs / 1000)}s`
          + ` vs goal "${goals[0].title}"`,
        model: assistantConfig.model || null,
        sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
        sourceSessionId: sessionId || null,
      });

      // Ambient only. No proposal, no notification, no bubble.
      onFocus?.({
        state,
        note: parsed.note || null,
        goal: goals[0].title,
        appName: segment.appName || null,
        durationMs: segment.durationMs,
      });

      logger?.debug?.('briizy.focus', `Segment classified as ${state}`, {
        app: segment.appName,
        confidence,
      });
      return { state, confidence };
    },
  };
}

/**
 * Focus statistics for a session, computed from the focus extractions rather
 * than stored separately — one source of truth, and it survives a re-run.
 */
function summarizeSessionFocus(service, sessionId) {
  const entries = service.listBriizyExtractions({
    kind: 'focus', sessionId, limit: 500,
  });
  const counts = { focused: 0, adjacent: 0, drifting: 0 };
  entries.forEach((entry) => {
    if (counts[entry.content] !== undefined) counts[entry.content] += 1;
  });
  const total = counts.focused + counts.adjacent + counts.drifting;
  return {
    ...counts,
    total,
    // "On task" counts adjacent as on task: research and setup are work.
    onTaskPercent: total ? Math.round(((counts.focused + counts.adjacent) / total) * 100) : null,
  };
}

module.exports = { createFocusAssistant, summarizeSessionFocus, DEFAULT_PROMPT, STATES };
