/**
 * TaskAgent (§12) — turns an accepted suggestion into a plan.
 *
 * This is not a segment assistant: it runs on demand, after the user has already
 * accepted a proposal and a real task exists. It adds `task_steps` to that task
 * and stops. That is the whole feature by default.
 *
 * Immediate execution exists (`automation-runner.js` is already wired for it) but
 * is off unless `assistants.taskAgent.immediateExecution` is explicitly turned on
 * (I6, §3). When it IS on, execution goes through `acceptCommand` — the existing
 * path, with its existing tool-confirmation policy, filesystem blacklist, and
 * runs/run_events audit trail. That is the one place in briizy where acceptCommand
 * belongs: automation being activated on purpose, not as a side effect of the
 * user agreeing that a suggestion was reasonable.
 */

const { SHARED_GUARDRAILS, callModel } = require('./base');

const DEFAULT_PROMPT = `
You are given a task someone has just accepted onto their list, plus the context
it came from. Break it into the smallest number of concrete steps that would
actually finish it.

Rules:
- Between 2 and 6 steps. If it needs only one step, return one.
- Each step is a single action, phrased imperatively, checkable as done.
- No step may be "review", "consider", "think about", or "follow up".
- Do not invent facts the context does not support. If a step needs information
  you do not have, make the step be finding that information.

Return JSON:
{"steps":[{"title":"<imperative, 10 words max>"}]}

Return {"steps":[]} if the task is already atomic.
`.trim();

const MAX_STEPS = 6;

function createTaskAgent({ service, logger, automation }) {
  return {
    id: 'taskAgent',
    kind: 'task',
    defaultPrompt: DEFAULT_PROMPT,

    /**
     * Called by the runtime after a proposal is accepted and a task exists.
     * Not a coordinator hook: there is no segment, and it must not be throttled
     * against segment traffic.
     */
    async planAcceptedTask({ task, proposal }, { config, assistantConfig }) {
      if (!task?.id) return { steps: 0 };
      if (!assistantConfig?.enabled) {
        logger?.debug?.('briizy.taskAgent', 'Task agent is off; leaving the task as-is', {
          taskId: task.id,
        });
        return { steps: 0, skipped: 'disabled' };
      }

      const existing = service.listTaskSteps(task.id, {});
      if (existing.length) {
        return { steps: 0, skipped: 'already planned' };
      }

      const userContent = [
        `Task: ${task.title}`,
        task.description ? `Detail: ${task.description}` : null,
        proposal?.rationale ? `Where it came from: ${proposal.rationale}` : null,
      ].filter(Boolean).join('\n');

      const { parsed } = await callModel({
        assistantId: 'taskAgent',
        systemPrompt: `${assistantConfig.prompt || DEFAULT_PROMPT}\n\n${SHARED_GUARDRAILS}`,
        userContent,
        config,
        assistant: assistantConfig,
        logger,
      });

      const steps = (Array.isArray(parsed?.steps) ? parsed.steps : [])
        .map((step) => String(step?.title || '').trim())
        .filter(Boolean)
        .slice(0, MAX_STEPS);

      if (!steps.length) return { steps: 0 };

      steps.forEach((title) => service.createTaskStep(task.id, { title }));
      logger?.info?.('briizy.taskAgent', 'Plan staged into the task', {
        taskId: task.id,
        steps: steps.length,
      });

      // The task is still pending and still non-automated. Turning it into a run
      // is a separate, explicitly enabled act.
      if (!assistantConfig.immediateExecution) {
        return { steps: steps.length, executed: false };
      }
      if (!automation?.acceptCommand) {
        logger?.warn?.('briizy.taskAgent', 'Immediate execution is on but no automation path is wired');
        return { steps: steps.length, executed: false };
      }

      const accepted = automation.acceptCommand({
        idempotencyKey: `briizy:task:${task.id}`,
        source: 'local',
        instruction: [task.title, task.description].filter(Boolean).join('\n\n'),
        contextText: steps.map((title, index) => `${index + 1}. ${title}`).join('\n'),
        taskId: task.id,
      });
      logger?.warn?.('briizy.taskAgent', 'Immediate execution is ENABLED — dispatching a run', {
        taskId: task.id,
        runId: accepted?.run?.id,
        // Loud on purpose: this is the one path where briizy causes work to happen.
      });
      await automation.executeRun?.(accepted?.run?.id);
      return { steps: steps.length, executed: true, runId: accepted?.run?.id };
    },
  };
}

module.exports = { createTaskAgent, DEFAULT_PROMPT, MAX_STEPS };
