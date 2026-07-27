/**
 * Goals assistant (§11) — evaluates recent context against the user's active
 * goals and nudges, sparingly.
 *
 * A goal nudge is the easiest thing here to make obnoxious, so the rules are
 * tight: nothing at all unless there is an active goal, one nudge per goal per
 * evaluation, and a dedupe key that pins a nudge to the goal rather than to its
 * wording — so rephrasing the same nag cannot get it past the filter.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');

const DEFAULT_PROMPT = `
You are given someone's active goals and a slice of what they were just doing.

Decide, for each goal, whether the work you can see moves it forward, works
against it, or is unrelated. Then say something only if it is worth saying.

Worth a nudge:
- Concrete progress worth acknowledging in one line.
- A specific, evidenced way the current work is drifting from the goal.
- A next step the context makes obvious.

Never nudge:
- To restate the goal, or to ask how it is going.
- On unrelated work. People are allowed to do other things.
- With generic motivation of any kind.

Return JSON:
{"assessments":[{"goalId":"<id>","relation":"advances"|"undermines"|"unrelated","note":"<one sentence, or null>","confidence":0.0-1.0}]}

Use "unrelated" with a null note freely — it is the most common answer.
`.trim();

const CONFIDENCE_FLOOR = 0.65;

function createGoalsAssistant({ service, logger, onProposal }) {
  return {
    id: 'goals',
    kind: 'goal',
    defaultPrompt: DEFAULT_PROMPT,

    async onSegmentClose({ segment, sessionId, batch }, { config, assistantConfig }) {
      const goals = service.listBriizyGoals({ status: 'active', limit: 20 });
      if (!goals.length || !batch.text) return { nudges: 0 };

      const goalBlock = goals
        .map((goal) => `- id: ${goal.id}\n  goal: ${goal.title}${goal.detail ? `\n  detail: ${goal.detail}` : ''}`)
        .join('\n');

      const userContent = [
        'Active goals:',
        goalBlock,
        '',
        `Application: ${segment.appName || 'unknown'}`,
        segment.windowTitle ? `Window: ${segment.windowTitle}` : null,
        '',
        'Screen text, oldest first:',
        batch.text,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'goals',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const assessments = Array.isArray(parsed?.assessments) ? parsed.assessments : [];
      const byId = new Map(goals.map((goal) => [goal.id, goal]));
      let nudges = 0;

      for (const assessment of assessments) {
        const goal = byId.get(assessment?.goalId);
        if (!goal) continue;

        // Record the evaluation whether or not it produces a nudge, so the goal
        // has a history and the UI can show progress without another model call.
        service.updateBriizyGoal(goal.id, { lastEvaluatedAt: Date.now() });
        const relation = ['advances', 'undermines', 'unrelated'].includes(assessment.relation)
          ? assessment.relation
          : 'unrelated';
        if (relation === 'unrelated' || !assessment.note) continue;
        if (Number(assessment.confidence) < CONFIDENCE_FLOOR) continue;

        const extraction = service.recordBriizyExtraction({
          assistantId: 'goals',
          kind: 'goal',
          content: assessment.note,
          reasoning: `${relation} · confidence ${assessment.confidence}`,
          contextSummary: `${segment.appName || 'unknown'} vs goal "${goal.title}"`,
          model: assistantConfig.model || null,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });

        const proposal = service.createBriizyProposal({
          assistantId: 'goals',
          kind: 'goal',
          urgency: relation === 'undermines' ? 'normal' : 'low',
          title: goal.title,
          summary: assessment.note,
          rationale: `${relation === 'advances' ? 'Progress' : 'Drift'} against your goal, seen in `
            + `${segment.appName || 'an app'}.`,
          evidence: batch.frameIds.slice(-3).map((frameId) => ({ type: 'frame', frameId })),
          // Keyed to the goal and the direction, not the wording: a rephrased
          // version of the same nag is the same nag.
          dedupeKey: `goal:${goal.id}:${relation}`,
          extractionId: extraction.row.id,
          sourceFrameId: batch.frameIds[batch.frameIds.length - 1] || null,
          sourceSessionId: sessionId || null,
        });
        if (proposal.duplicate) continue;
        nudges += 1;
        onProposal?.(proposal.row);
      }

      return { nudges, goals: goals.length };
    },
  };
}

module.exports = { createGoalsAssistant, DEFAULT_PROMPT, CONFIDENCE_FLOOR };
