/**
 * Insight assistant (§10.1) — a periodic pass over recent context that turns
 * into a suggestion bubble with ✓/✗.
 *
 * The bar is deliberately high: most segments deserve silence. An assistant that
 * comments on everything trains the user to dismiss everything, which is how
 * proposal fatigue starts (§14). The prompt is written to prefer an empty result,
 * and confidence below the floor is discarded before it ever reaches a bubble.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');

const DEFAULT_PROMPT = `
You watch what someone is working on and occasionally offer one genuinely useful
observation — the kind a sharp colleague sitting next to them would make.

Worth saying:
- A concrete blocker they seem stuck on, with a specific next step.
- A contradiction between two things on screen (a number that does not match, a
  stale value, a config that disagrees with the docs they have open).
- Something they are clearly about to forget, evidenced in the text.

Not worth saying:
- Generic productivity advice, encouragement, or summaries of what they just did.
- Anything they obviously already know.
- Anything you are inferring rather than reading.

Return JSON:
{"insights":[{"title":"<6 words max>","summary":"<one or two sentences>","rationale":"<what in the context led you here>","confidence":0.0-1.0,"urgency":"low"|"normal"|"high"}]}

Return {"insights":[]} unless something clears that bar. Most of the time it will not.
`.trim();

/** Below this, an insight is a guess and is dropped rather than shown. */
const CONFIDENCE_FLOOR = 0.6;
/** At most one insight per segment reaches a bubble. */
const MAX_PER_SEGMENT = 1;

function createInsightAssistant({ service, logger, onProposal }) {
  return {
    id: 'insight',
    kind: 'insight',
    defaultPrompt: DEFAULT_PROMPT,

    async onSegmentClose({ segment, sessionId, batch }, { config, assistantConfig }) {
      if (!batch.text) return null;

      const userContent = [
        `Application: ${segment.appName || 'unknown'}`,
        segment.windowTitle ? `Window: ${segment.windowTitle}` : null,
        `Duration: ${Math.round(segment.durationMs / 1000)}s`,
        '',
        'Screen text, oldest first:',
        batch.text,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'insight',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const insights = Array.isArray(parsed?.insights) ? parsed.insights : [];
      const kept = insights
        .filter((insight) => insight?.summary && Number(insight.confidence) >= CONFIDENCE_FLOOR)
        .slice(0, MAX_PER_SEGMENT);

      if (!kept.length) {
        logger?.debug?.('briizy.insight', 'Nothing worth surfacing', {
          app: segment.appName,
          returned: insights.length,
        });
        return { insights: 0 };
      }

      const proposals = [];
      for (const insight of kept) {
        const extraction = service.recordBriizyExtraction({
          assistantId: 'insight',
          kind: 'insight',
          content: insight.summary,
          reasoning: insight.rationale || null,
          contextSummary: `${segment.appName || 'unknown'}${segment.windowTitle ? ` — ${segment.windowTitle}` : ''}`,
          model: assistantConfig.model || null,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        const proposal = service.createBriizyProposal({
          assistantId: 'insight',
          kind: 'insight',
          urgency: ['low', 'normal', 'high'].includes(insight.urgency) ? insight.urgency : 'normal',
          title: (insight.title || '').slice(0, 300) || null,
          summary: insight.summary,
          rationale: insight.rationale || null,
          // Evidence stays local: frame ids never leave the machine (I2, I9).
          evidence: batch.frameIds.slice(-5).map((frameId) => ({ type: 'frame', frameId })),
          // Same observation about the same window should not come back twice.
          dedupeKey: `insight:${normalizeKey(insight.summary)}`,
          extractionId: extraction.row.id,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        if (proposal.duplicate) {
          logger?.debug?.('briizy.insight', 'Suppressed a duplicate insight', {
            proposalId: proposal.row.id,
          });
          continue;
        }
        proposals.push(proposal.row);
        onProposal?.(proposal.row);
      }

      return { insights: proposals.length };
    },
  };
}

/** Collapse an observation to a stable identity for deduplication. */
function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join('-')
    .slice(0, 200);
}

module.exports = { createInsightAssistant, DEFAULT_PROMPT, CONFIDENCE_FLOOR, normalizeKey };
