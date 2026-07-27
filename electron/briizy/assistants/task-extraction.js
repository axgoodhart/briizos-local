/**
 * Task-extraction assistant (§10.2) — commitments and action items visible in
 * OCR text become staged tasks awaiting review.
 *
 * Staging is the whole point. Nothing here creates a task: it creates a
 * `briizy_staged_tasks` row and a proposal, and only the user's accept turns
 * that into a real, pending, non-automated task (I6). The word "staged" in the
 * table name is load-bearing.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');
const { normalizeKey } = require('./insight');

const DEFAULT_PROMPT = `
You read text captured from someone's screen and pick out things THEY have
committed to doing, or been asked to do.

Extract only:
- An explicit commitment they made ("I'll send the deck tonight").
- A direct request to them ("can you review the PR before standup?").
- A deadline attached to something that is clearly theirs.

Do NOT extract:
- Work they were simply reading about, or someone else's task.
- Anything they appear to have already finished.
- Vague intentions with no action ("we should think about pricing").
- UI text, menu labels, button names, or documentation.

For each item give a short imperative title, the surrounding detail, any time
reference exactly as it appeared, and your confidence.

Return JSON:
{"tasks":[{"title":"<imperative, 8 words max>","detail":"<one sentence of context>","dueHint":"<verbatim time reference or null>","confidence":0.0-1.0}]}

Return {"tasks":[]} if nothing qualifies. Most screens contain no commitments.
`.trim();

/**
 * A commitment misread is worse than one missed: the user has to clear it out of
 * their task list either way, and a wrong task erodes trust in the whole feature.
 */
const CONFIDENCE_FLOOR = 0.7;
const MAX_PER_SEGMENT = 3;

function createTaskExtractionAssistant({ service, logger, onProposal }) {
  return {
    id: 'taskExtraction',
    kind: 'task',
    defaultPrompt: DEFAULT_PROMPT,

    async onSegmentClose({ segment, sessionId, batch }, { config, assistantConfig }) {
      if (!batch.text) return null;

      const userContent = [
        `Application: ${segment.appName || 'unknown'}`,
        segment.windowTitle ? `Window: ${segment.windowTitle}` : null,
        `Observed: ${new Date(segment.startedAt).toLocaleString('en-GB')}`,
        '',
        'Screen text, oldest first:',
        batch.text,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'taskExtraction',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const candidates = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      const kept = candidates
        .filter((task) => task?.title && Number(task.confidence) >= CONFIDENCE_FLOOR)
        .slice(0, MAX_PER_SEGMENT);

      if (!kept.length) {
        logger?.debug?.('briizy.taskExtraction', 'No commitments found', {
          app: segment.appName,
          returned: candidates.length,
        });
        return { staged: 0 };
      }

      // Do not re-propose something the user already has. Checked against real
      // tasks as well as staged ones, so accepting once settles it.
      const openTitles = new Set(
        service.listTasks({ limit: 200 }).map((task) => normalizeKey(task.title)),
      );
      const stagedTitles = new Set(
        service.listBriizyStagedTasks({ limit: 200 }).map((task) => normalizeKey(task.title)),
      );

      let staged = 0;
      for (const task of kept) {
        const key = normalizeKey(task.title);
        if (openTitles.has(key) || stagedTitles.has(key)) {
          logger?.debug?.('briizy.taskExtraction', 'Skipped a task the user already has', {
            title: task.title,
          });
          continue;
        }

        const extraction = service.recordBriizyExtraction({
          assistantId: 'taskExtraction',
          kind: 'task',
          content: task.title,
          reasoning: task.detail || null,
          contextSummary: `${segment.appName || 'unknown'}${segment.windowTitle ? ` — ${segment.windowTitle}` : ''}`,
          model: assistantConfig.model || null,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        const stagedTask = service.createBriizyStagedTask({
          extractionId: extraction.row.id,
          title: task.title,
          detail: task.detail || null,
          dueHint: task.dueHint || null,
          confidence: Number(task.confidence) || 0,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        const proposal = service.createBriizyProposal({
          assistantId: 'taskExtraction',
          kind: 'task',
          urgency: 'normal',
          title: task.title,
          summary: task.detail
            ? `${task.title} — ${task.detail}`
            : task.title,
          rationale: [
            `Seen in ${segment.appName || 'an app'}${segment.windowTitle ? ` (${segment.windowTitle})` : ''}`,
            task.dueHint ? `Time reference: "${task.dueHint}"` : null,
          ].filter(Boolean).join('. '),
          evidence: batch.frameIds.slice(-5).map((frameId) => ({ type: 'frame', frameId })),
          dedupeKey: `task:${key}`,
          extractionId: extraction.row.id,
          stagedTaskId: stagedTask.row.id,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        if (proposal.duplicate) continue;
        stagedTitles.add(key);
        staged += 1;
        onProposal?.(proposal.row);
        logger?.info?.('briizy.taskExtraction', 'Task staged for review', {
          stagedTaskId: stagedTask.row.id,
          proposalId: proposal.row.id,
          title: task.title,
          confidence: task.confidence,
        });
      }

      return { staged };
    },
  };
}

module.exports = { createTaskExtractionAssistant, DEFAULT_PROMPT, CONFIDENCE_FLOOR };
