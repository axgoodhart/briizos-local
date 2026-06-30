class AutomationRunner {
  constructor({ service, agent, logger, onRunChanged }) {
    this.service = service;
    this.agent = agent;
    this.logger = logger;
    this.onRunChanged = onRunChanged || (() => {});
    this.active = new Set();
  }

  async publish(run) {
    await this.onRunChanged(run);
    return run;
  }

  async transition(runId, status, input) {
    const result = this.service.transitionRun(runId, status, input);
    await this.publish(result.row);
    return result.row;
  }

  async execute(run, policyOverride = null) {
    if (!run || this.active.has(run.id)) return run;
    this.active.add(run.id);
    try {
      await this.transition(run.id, 'queued', { eventMessage: 'Queued on this Mac' });
      let task = run.taskId ? this.service.getTask(run.taskId) : null;
      if (task) {
        task = this.service.updateTask(task.id, task.revision, { status: 'running', automated: true }).row;
      } else {
        task = this.service.createTask({
          title: run.instruction.slice(0, 240),
          description: run.contextText || '',
          status: 'running',
          priority: 'normal',
          automated: true,
        }).row;
      }
      const threadId = await this.agent.createThread('task');
      this.service.attachRun(run.id, { taskId: task.id, threadId });
      await this.transition(run.id, 'running', { progressCurrent: 0, progressTotal: 1, eventMessage: 'Local agent started' });

      const taskPolicy = policyOverride || this.service.getSetting('agent_config')?.value?.permissions?.task || { mode: 'ask-always', blacklist: { paths: [], filetypes: [] } };
      const prompt = [run.instruction, run.contextText ? `\nContext:\n${run.contextText}` : ''].join('');
      const response = await this.agent.sendMessage(threadId, prompt, {
        thinking: true,
        tool_confirmation_mode: taskPolicy.mode,
        permission_policy: { surface: 'task', ...taskPolicy },
      });
      const messages = Array.isArray(response?.messages) ? response.messages : [];
      const last = [...messages].reverse().find((message) => typeof message?.content === 'string');
      const content = last?.content || 'Task completed.';
      if (content.includes('tool_confirmation')) {
        this.service.updateTask(task.id, task.revision, { status: 'waiting' });
        return this.transition(run.id, 'waiting_for_user', { eventMessage: 'A local permission confirmation is required' });
      }
      const currentTask = this.service.getTask(task.id);
      this.service.updateTask(task.id, currentTask.revision, { status: 'completed', automated: false });
      return this.transition(run.id, 'completed', {
        progressCurrent: 1, progressTotal: 1, resultSummary: content.slice(0, 2000), eventMessage: 'Task completed locally',
      });
    } catch (error) {
      this.logger?.error?.('automation', 'Run failed', { runId: run.id, error: error?.message });
      return this.transition(run.id, 'failed', {
        errorCode: 'LOCAL_EXECUTION_FAILED', errorMessage: error?.message || 'Local execution failed', eventMessage: 'Task failed locally',
      });
    } finally {
      this.active.delete(run.id);
    }
  }
}

module.exports = { AutomationRunner };
