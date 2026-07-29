const PERMISSION_LEVELS = ['ask-always', 'ask-destructive', 'no-asking'];

function permissionRank(mode) {
  const rank = PERMISSION_LEVELS.indexOf(mode);
  return rank < 0 ? 0 : rank;
}

function safeBlacklist(value) {
  return {
    paths: Array.isArray(value?.paths) ? value.paths : [],
    filetypes: Array.isArray(value?.filetypes) ? value.filetypes : [],
  };
}

class AutomationRunner {
  constructor({
    service,
    agent,
    logger,
    onRunChanged,
    onThreadPolicyChanged,
  }) {
    this.service = service;
    this.agent = agent;
    this.logger = logger;
    this.onRunChanged = onRunChanged || (() => {});
    this.onThreadPolicyChanged = onThreadPolicyChanged || (() => {});
    this.active = new Set();
    this.activePolicies = new Map();
    this.settingsChanged = ({ domains = [] } = {}) => {
      if (domains.includes('settings')) this.refreshActivePolicies();
    };
    this.service.on('changed', this.settingsChanged);
  }

  resolveTaskPolicy(permissionRequest = null) {
    const configured = this.service.getSetting('agent_config')?.value?.permissions?.task || {};
    const ceiling = PERMISSION_LEVELS.includes(configured.mode) ? configured.mode : 'ask-always';
    const suppliedPolicy = permissionRequest?.policy || permissionRequest;
    const requestedMode = PERMISSION_LEVELS.includes(permissionRequest?.requestedMode)
      ? permissionRequest.requestedMode
      : PERMISSION_LEVELS.includes(suppliedPolicy?.mode)
        ? suppliedPolicy.mode
        : ceiling;
    const mode = permissionRank(requestedMode) > permissionRank(ceiling)
      ? ceiling
      : requestedMode;
    return {
      requestedMode,
      ceiling,
      policy: {
        mode,
        blacklist: safeBlacklist(configured.blacklist),
      },
    };
  }

  announceThreadPolicy(payload) {
    try {
      this.onThreadPolicyChanged(payload);
    } catch (error) {
      this.logger?.error?.(
        'automation.permissions',
        'The task permission update could not reach the app window, so its renderer-side tool gate remains restrictive.',
        { error: error?.message, ...payload },
      );
    }
  }

  refreshActivePolicies() {
    for (const context of this.activePolicies.values()) {
      const resolved = this.resolveTaskPolicy({ mode: context.requestedMode });
      Object.assign(context.permissionPolicy, {
        surface: 'task',
        ...resolved.policy,
      });
      context.ceiling = resolved.ceiling;
      this.announceThreadPolicy({
        action: 'update',
        runId: context.runId,
        taskId: context.taskId,
        threadId: context.threadId,
        requestedMode: context.requestedMode,
        ceiling: resolved.ceiling,
        policy: context.permissionPolicy,
      });
      this.logger?.info?.(
        'automation.permissions',
        `Task permission settings changed while an automated run was active. Its next tool check now uses “${context.permissionPolicy.mode}”.`,
        {
          runId: context.runId,
          taskId: context.taskId,
          threadId: context.threadId,
          requestedMode: context.requestedMode,
          taskColumnLimit: resolved.ceiling,
          effectiveMode: context.permissionPolicy.mode,
        },
      );
    }
  }

  close() {
    this.service.off('changed', this.settingsChanged);
    this.activePolicies.clear();
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

  async execute(run, permissionRequest = null) {
    if (!run || this.active.has(run.id)) return run;
    this.active.add(run.id);
    let task = null;
    try {
      await this.transition(run.id, 'queued', { eventMessage: 'Queued on this Mac' });
      task = run.taskId ? this.service.getTask(run.taskId) : null;
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
      const resolvedPolicy = this.resolveTaskPolicy(permissionRequest);
      const permissionPolicy = { surface: 'task', ...resolvedPolicy.policy };
      const policyContext = {
        runId: run.id,
        taskId: task.id,
        threadId,
        requestedMode: resolvedPolicy.requestedMode,
        ceiling: resolvedPolicy.ceiling,
        permissionPolicy,
      };
      this.activePolicies.set(run.id, policyContext);
      this.announceThreadPolicy({
        action: 'register',
        ...policyContext,
        policy: permissionPolicy,
      });
      this.service.attachRun(run.id, { taskId: task.id, threadId });
      await this.transition(run.id, 'running', {
        progressCurrent: 0,
        progressTotal: 1,
        eventMessage: 'AI request preparation started on this Mac; completion is not yet known',
      });

      const selectedModel = this.service.getSetting('selected_model')?.value;
      if (!selectedModel) throw new Error('No AI model is selected for automation');
      const prompt = [run.instruction, run.contextText ? `\nContext:\n${run.contextText}` : ''].join('');
      const response = await this.agent.sendMessage(threadId, prompt, {
        model: selectedModel,
        thinking: true,
        tool_confirmation_mode: permissionPolicy.mode,
        permission_policy: permissionPolicy,
      });
      const messages = Array.isArray(response?.messages) ? response.messages : [];
      const last = [...messages].reverse().find((message) => typeof message?.content === 'string');
      const content = last?.content || 'Task completed.';
      if (response?.outcome === 'interrupted' || content.includes('tool_confirmation')) {
        this.service.updateTask(task.id, task.revision, { status: 'waiting' });
        return this.transition(run.id, 'waiting_for_user', {
          eventMessage: response?.interruption?.type === 'clarification'
            ? 'The AI needs clarification before this task can continue'
            : 'A local permission confirmation is required',
        });
      }
      const currentTask = this.service.getTask(task.id);
      this.service.updateTask(task.id, currentTask.revision, { status: 'completed', automated: false });
      return this.transition(run.id, 'completed', {
        progressCurrent: 1, progressTotal: 1, resultSummary: content.slice(0, 2000), eventMessage: 'Task completed locally',
      });
    } catch (error) {
      if (task?.id) {
        const currentTask = this.service.getTask(task.id);
        if (currentTask) {
          this.service.updateTask(currentTask.id, currentTask.revision, {
            status: 'waiting',
            automated: false,
          });
        }
      }
      this.logger?.error?.('automation', 'This automated task run stopped before completion. The task remains inspectable and the exact failure is recorded below.', {
        runId: run.id,
        taskId: run.taskId || null,
        error: error?.message,
      });
      return this.transition(run.id, 'failed', {
        errorCode: 'LOCAL_EXECUTION_FAILED', errorMessage: error?.message || 'Local execution failed', eventMessage: 'Task failed locally',
      });
    } finally {
      const context = this.activePolicies.get(run.id);
      if (context) {
        this.announceThreadPolicy({
          action: 'unregister',
          runId: context.runId,
          taskId: context.taskId,
          threadId: context.threadId,
        });
        this.activePolicies.delete(run.id);
      }
      this.active.delete(run.id);
    }
  }
}

module.exports = { AutomationRunner };
