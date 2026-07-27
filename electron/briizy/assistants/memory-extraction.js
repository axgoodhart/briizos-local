/**
 * Memory-extraction assistant (§10.3) — durable facts about the user, written
 * into the EXISTING memory system so chat-briizy knows what desktop-briizy saw.
 *
 * This is where I1 is either honoured or quietly broken, so it is worth being
 * explicit: facts go into `memory_facts` and "About me" is a `memory_sections`
 * row. There is no briizy-side profile. The only thing this assistant adds to
 * those tables is provenance (I7) — which frame taught it, and how sure it was.
 *
 * Two thresholds, not one:
 *   - Very high confidence writes the fact directly (still logged, still undoable).
 *   - Merely high confidence becomes a proposal for the user to accept.
 * Anything less is dropped. A wrong "fact" persists into every future
 * conversation, which makes it the most expensive thing here to get wrong.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');

const DEFAULT_PROMPT = `
You read text captured from someone's screen and note durable facts about them —
things that will still be true next month and would help someone who knows them
well be more useful.

Worth remembering:
- Their role, team, employer, or the projects they own.
- Tools, languages, and services they actually work in.
- Stable preferences ("reviews PRs in the morning", "prefers Linear over Jira").
- Long-lived relationships ("Priya is their manager").

Never remember:
- Anything transient: today's bug, this meeting, the current value of something.
- Credentials, keys, tokens, card numbers, addresses, or health information.
- Facts about other people that are not about their relationship to the user.
- Anything you inferred rather than read.

Pick the section each fact belongs to:
- "user.aboutMe"         — who they are
- "user.workContext"     — their work, team, projects, tools
- "user.personalContext" — non-work context they clearly chose to have on screen
- "user.topOfMind"       — a current focus that will last weeks, not hours

Return JSON:
{"facts":[{"fact":"<one sentence, third person>","section":"user.aboutMe"|"user.workContext"|"user.personalContext"|"user.topOfMind","confidence":0.0-1.0}]}

Return {"facts":[]} if nothing durable is present. That is the common case.
`.trim();

/** At or above this, the fact is written directly — still reversible (I7). */
const AUTO_SAVE_CONFIDENCE = 0.85;
/** Between the two, the user is asked. Below the lower bound, dropped. */
const PROPOSE_CONFIDENCE = 0.7;
const MAX_PER_SEGMENT = 3;

const VALID_SECTIONS = new Set([
  'user.aboutMe', 'user.workContext', 'user.personalContext', 'user.topOfMind',
]);

/**
 * A last-line filter for categories the prompt already forbids. The model is not
 * the only thing standing between a password on screen and permanent memory.
 */
const SENSITIVE_PATTERNS = [
  /\b(?:password|passphrase|secret|api[ -]?key|token|credential)\b/i,
  /\b(?:sk|pk)-[A-Za-z0-9]{16,}\b/,
  /\b(?:\d[ -]?){13,19}\b/, // card-shaped digit runs
  /\b\d{3}-\d{2}-\d{4}\b/, // US SSN shape
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b.*\b(?:password|login)\b/i,
];

function looksSensitive(text) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(String(text || '')));
}

function createMemoryExtractionAssistant({ service, logger, onProposal }) {
  return {
    id: 'memoryExtraction',
    kind: 'memory',
    defaultPrompt: DEFAULT_PROMPT,

    async onSegmentClose({ segment, sessionId, batch }, { config, assistantConfig }) {
      if (!batch.text) return null;

      // Show the model what is already known, so it does not re-learn it.
      const known = service.listMemoryFacts()
        .slice(0, 40)
        .map((fact) => `- ${fact.content || fact.factText || ''}`)
        .filter((line) => line.length > 2)
        .join('\n');

      const userContent = [
        `Application: ${segment.appName || 'unknown'}`,
        segment.windowTitle ? `Window: ${segment.windowTitle}` : null,
        known ? `\nAlready known — do not repeat these:\n${known}` : null,
        '',
        'Screen text, oldest first:',
        batch.text,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'memoryExtraction',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const candidates = Array.isArray(parsed?.facts) ? parsed.facts : [];
      let saved = 0;
      let proposed = 0;
      let rejected = 0;

      for (const candidate of candidates.slice(0, MAX_PER_SEGMENT)) {
        const factText = String(candidate?.fact || '').trim();
        const confidence = Number(candidate?.confidence) || 0;
        const section = VALID_SECTIONS.has(candidate?.section) ? candidate.section : 'user.workContext';

        if (!factText || confidence < PROPOSE_CONFIDENCE) {
          rejected += 1;
          continue;
        }
        if (looksSensitive(factText)) {
          rejected += 1;
          logger?.warn?.('briizy.memoryExtraction', 'Refused a fact that looks sensitive', {
            section,
            // Never log the text itself.
            length: factText.length,
          });
          continue;
        }

        const extraction = service.recordBriizyExtraction({
          assistantId: 'memoryExtraction',
          kind: 'memory',
          content: factText,
          reasoning: `confidence ${confidence}, section ${section}`,
          contextSummary: `${segment.appName || 'unknown'}${segment.windowTitle ? ` — ${segment.windowTitle}` : ''}`,
          model: assistantConfig.model || null,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        if (confidence >= AUTO_SAVE_CONFIDENCE) {
          const result = service.addBriizyMemoryFact({
            factText,
            sectionKey: section,
            confidence,
            sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
            sourceSessionId: sessionId || null,
            extractionId: extraction.row.id,
          });
          if (!result.duplicate) {
            saved += 1;
            logger?.info?.('briizy.memoryExtraction', 'Fact remembered', {
              factId: result.factId,
              section,
              confidence,
            });
          }
          continue;
        }

        // Not sure enough to write: ask, as an accept/reject diff (§10 "About me").
        const proposal = service.createBriizyProposal({
          assistantId: 'memoryExtraction',
          kind: 'memory',
          urgency: 'low',
          title: 'Remember this?',
          summary: factText,
          rationale: `Seen in ${segment.appName || 'an app'} · would be added to ${sectionLabel(section)}`,
          evidence: batch.frameIds.slice(-3).map((frameId) => ({ type: 'frame', frameId })),
          dedupeKey: `memory:${factText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 200)}`,
          extractionId: extraction.row.id,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });
        if (!proposal.duplicate) {
          proposed += 1;
          onProposal?.(proposal.row);
        }
      }

      if (saved || proposed || rejected) {
        logger?.debug?.('briizy.memoryExtraction', 'Segment processed', { saved, proposed, rejected });
      }
      return { saved, proposed, rejected };
    },
  };
}

function sectionLabel(section) {
  return {
    'user.aboutMe': 'About me',
    'user.workContext': 'Work context',
    'user.personalContext': 'Personal context',
    'user.topOfMind': 'Current focus',
  }[section] || section;
}

module.exports = {
  createMemoryExtractionAssistant,
  DEFAULT_PROMPT,
  AUTO_SAVE_CONFIDENCE,
  PROPOSE_CONFIDENCE,
  looksSensitive,
};
