/**
 * useTaskAutomation — agent-driven background task automation.
 *
 * Wired into the single canonical agent runtime (see AGENT_REWIRE):
 *
 *   subscribeAutomatedTasks (SQLite notifications) [producer]
 *     → processTask  (decision tree, taskAutomation.js state machine)
 *       → window.api.langgraphSendMessage(threadId, prompt, config)   [IPC]
 *         → electron/main.js → electron/agent.sendMessage
 *           → in-process LangGraph.js lead_agent
 *             → agent turn runs headlessly; briizOS UI-state tools
 *               direct IPC tool bridge → ToolContext.executeTool
 *       ← synchronous run output ({ messages: [...] }) → taskLog writes
 *
 * This is the synchronous-send variant (request → response),
 * not the streaming chat path. Background automation has no live UI to
 * stream into, so each step is one blocking agent turn. There is exactly
 * one AI loop and one tool executor — the same ones useChat uses.
 *
 * Permissions: requesting automation surfaces a pre-send Margerin where
 * the user picks that task's level, clamped to the Task-column ceiling.
 * That policy drives the in-process agent config and the renderer hard
 * gate. If a tool needs confirmation this headless run can't grant — or
 * the gate/blacklist blocks one — the task pauses to
 * 'waiting' rather than executing unconfirmed.
 *
 * Loop safety: the original Firestore-snapshot version was stubbed
 * because it re-fired processTask() on its own writes. That is now
 * structurally prevented by (a) subscribeAutomatedTasks' first-snapshot
 * suppression + per-task cooldown, and (b) the processingRef guard below
 * which makes a task in-flight idempotent.
 *
 * One LangGraph thread is kept per task so the agent retains context
 * across breakdown → step → step → verify within a single task.
 */

import { useEffect, useRef, useCallback } from 'react';
import { subscribeAutomatedTasks, getTask, updateTask } from '../lib/localTasks';
import {
  evaluateTask,
  logBreakdownStart,
  saveBreakdownResult,
  logStepStart,
  logVerificationStart,
  completeStep,
  finalizeTask,
  flagVerificationIssue,
  logAutomationError,
  appendTaskLog,
} from '../lib/taskAutomation';
import {
  LEVELS,
  levelRank,
  clampLevel,
  restrictivePolicy,
  registerThreadSurface,
  unregisterThread,
  consumeGatedToolCalls,
} from '../lib/agentSurfaces';
import { enqueueMargerin } from '../lib/bfast-queue';
import logger from '../lib/logger';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && !!window.api;

/** Sentinel: a headless turn was blocked by policy → pause, don't error. */
class TaskGatedError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'TaskGatedError';
    this.__gatedPause = true;
  }
}

export function useTaskAutomation() {
  // Tasks currently being processed — guards against re-entry from
  // local change echoes while a task's chain is still running.
  const processingRef = useRef(new Set());
  // One LangGraph thread per task so the agent keeps context across steps.
  const threadMapRef = useRef(new Map());
  // taskId -> effective per-task policy { surface:'task', mode, blacklist }.
  // Set once the user resolves the pre-send Margerin permission hold.
  const taskPolicyRef = useRef(new Map());
  // taskIds with an in-flight permission Margerin (don't double-prompt
  // on local change echoes).
  const pendingPermissionRef = useRef(new Set());

  // -------------------------------------------------------------------
  // Pre-send permission hold (Margerin). Requesting automation on a task
  // surfaces a gating pill where the user picks that task's level,
  // CLAMPED so it can never exceed the Task column ceiling. ✕ / 💬
  // decline automation. Returns the effective policy, or null if declined.
  // -------------------------------------------------------------------
  const requestTaskPermission = useCallback(async (task) => {
    const cached = taskPolicyRef.current.get(task.id);
    if (cached) return cached;

    // Resolve the Task-column ceiling + blacklist from settings.
    let ceiling = 'ask-always';
    let blacklist = { paths: [], filetypes: [] };
    try {
      if (typeof api.agentGetSurfacePolicy === 'function') {
        const cfg = await api.agentGetSurfacePolicy('task');
        if (cfg && typeof cfg === 'object') {
          ceiling = LEVELS.includes(cfg.mode) ? cfg.mode : 'ask-always';
          blacklist = {
            paths: Array.isArray(cfg.blacklist?.paths) ? cfg.blacklist.paths : [],
            filetypes: Array.isArray(cfg.blacklist?.filetypes) ? cfg.blacklist.filetypes : [],
          };
        }
      }
    } catch (err) {
      logger.error('task-automation', 'Failed to read Task permission ceiling — staying fail-closed', { error: err?.message });
    }

    // Allowed levels: most-restrictive .. ceiling (never beyond it).
    const allowed = LEVELS.slice(0, levelRank(ceiling) + 1);

    let decision;
    try {
      decision = await enqueueMargerin({
        toolName: 'task-automation',
        params: { taskId: task.id },
        label: `Automate "${(task.title || 'task').slice(0, 48)}"`,
        levels: allowed,
        selectedLevel: ceiling,
      });
    } catch {
      // ✕ cancel or 💬 return-to-chat → automation declined.
      await appendTaskLog(task.id, 'status', 'Automation cancelled before start (permission not granted)').catch(() => {});
      await updateTask(task.id, { automated: false, status: 'pending' }).catch(() => {});
      logger.info('task-automation', 'Per-task permission declined', { taskId: task.id });
      return null;
    }

    const chosen = clampLevel(decision?.level || ceiling, ceiling);
    const policy = { surface: 'task', mode: chosen, blacklist };
    taskPolicyRef.current.set(task.id, policy);
    await appendTaskLog(task.id, 'status', `Automation permission granted at level: ${chosen}`).catch(() => {});
    logger.info('task-automation', 'Per-task permission granted', { taskId: task.id, mode: chosen, ceiling });
    return policy;
  }, []);

  // Get or create a LangGraph thread for a given task.
  const getThreadForTask = useCallback(async (taskId) => {
    if (!hasApi || typeof api.langgraphCreateThread !== 'function') {
      throw new Error('Agent backend unavailable (no LangGraph IPC bindings)');
    }

    const existing = threadMapRef.current.get(taskId);
    if (existing) return existing;

    const res = await api.langgraphCreateThread('task');
    const threadId = res?.thread_id || res?.threadId || res;
    if (!threadId) throw new Error('Failed to create LangGraph thread');

    threadMapRef.current.set(taskId, threadId);
    // Register the resolved per-task policy against this thread so the
    // renderer hard gate enforces it for bridge tool calls. Fail-closed
    // if (somehow) no policy was resolved.
    const policy = taskPolicyRef.current.get(taskId) || restrictivePolicy('task');
    registerThreadSurface(threadId, policy);
    logger.debug('task-automation', 'Created agent thread for task', { taskId, threadId, mode: policy.mode });
    return threadId;
  }, []);

  // Send a prompt to the agent and wait for the full response (headless).
  const sendToAgent = useCallback(async (taskId, message) => {
    if (typeof api.langgraphSendMessage !== 'function') {
      throw new Error('Agent backend unavailable (langgraphSendMessage missing)');
    }
    const threadId = await getThreadForTask(taskId);

    // Reuse the globally selected model from the InteractionPanel picker.
    const model = (await api.localData?.settings?.get('selected_model'))?.value || undefined;

    // Per-task policy drives BOTH the agent config and the renderer gate.
    // NOT hardcoded 'no-asking' — the user's
    // clamped per-task choice governs. Fail-closed if missing.
    const policy = taskPolicyRef.current.get(taskId) || restrictivePolicy('task');

    return api.langgraphSendMessage(threadId, message, {
      tool_confirmation_mode: policy.mode,
      permission_policy: policy,
      thinking: true,
      model,
    });
  }, [getThreadForTask]);

  // A headless turn cannot answer a confirmation. If the agent's run
  // ended on a tool_confirmation interrupt, or the renderer gate blocked
  // a bridge tool, pause the task to 'waiting' for the user.
  const pauseTaskWaiting = useCallback(async (taskId, reason) => {
    await appendTaskLog(taskId, 'error', `Paused — ${reason}`).catch(() => {});
    await appendTaskLog(taskId, 'question', 'A tool needed permission this automated run could not grant. Resume to continue, or adjust permissions.').catch(() => {});
    await updateTask(taskId, { status: 'waiting' }).catch(() => {});
    logger.warn('task-automation', 'Task paused awaiting permission', { taskId, reason });
  }, []);

  // Detect a graph-level confirmation interrupt in a synchronous
  // response (the run ends with a tool_confirmation ToolMessage).
  const confirmationInterrupt = useCallback((response) => {
    const msgs = response?.messages;
    if (!Array.isArray(msgs)) return null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      const c = typeof m?.content === 'string' ? m.content : '';
      if (c.includes('"type": "tool_confirmation"') || c.includes('"type":"tool_confirmation"')) {
        try {
          const parsed = JSON.parse(c);
          return parsed.summary || parsed.tool_name || 'a tool requiring confirmation';
        } catch {
          return 'a tool requiring confirmation';
        }
      }
    }
    return null;
  }, []);

  // One agent turn + post-turn policy checks. Throws TaskGatedError if
  // the renderer gate blocked a bridge tool or the middleware interrupted
  // for confirmation (headless can't answer) → caller pauses to 'waiting'.
  const sendGuarded = useCallback(async (taskId, message) => {
    const response = await sendToAgent(taskId, message);
    const threadId = threadMapRef.current.get(taskId);
    const gated = consumeGatedToolCalls(threadId);
    if (gated.length > 0) {
      throw new TaskGatedError(gated.map((g) => `${g.tool} (${g.reason})`).join('; '));
    }
    const ci = confirmationInterrupt(response);
    if (ci) {
      throw new TaskGatedError(`agent needs confirmation for ${ci}`);
    }
    return response;
  }, [sendToAgent, confirmationInterrupt]);

  // Process an automated task through the decision tree. Loops internally
  // so breakdown → step → step → verify chains complete in one invocation
  // rather than relying on change re-fires between steps.
  const processTask = useCallback(async (task) => {
    if (processingRef.current.has(task.id)) return;
    processingRef.current.add(task.id);

    logger.info('task-automation', 'Processing automated task', { taskId: task.id, title: task.title });

    try {
      let decision = await evaluateTask(task);

      while (decision) {
        switch (decision.action) {
          case 'breakdown': {
            await logBreakdownStart(task.id);

            const prompt = buildBreakdownPrompt(decision.title || task.title, decision.context || null);
            const aiResponse = await sendGuarded(task.id, prompt);
            const parsed = parseBreakdownResponse(aiResponse);

            const breakdownResult = await saveBreakdownResult(task.id, parsed);
            if (breakdownResult.action === 'waiting' || breakdownResult.action === 'error') {
              decision = null; // Waiting on the user, or hit an error.
            } else {
              const freshTask = await getTask(task.id);
              decision = freshTask ? await evaluateTask(freshTask) : null;
            }
            break;
          }

          case 'resume': {
            await logStepStart(task.id, decision.step.title, decision.stepIndex, decision.totalSteps);

            const prompt = buildStepPrompt(
              decision.title || task.title,
              decision.step.title,
              decision.stepIndex,
              decision.totalSteps,
              task.taskLog
            );
            const aiResponse = await sendGuarded(task.id, prompt);
            const summary = extractText(aiResponse);

            decision = await completeStep(task.id, decision.step.id, summary);
            break;
          }

          case 'verify': {
            await logVerificationStart(task.id);

            const freshTask = await getTask(task.id);
            const prompt = buildVerifyPrompt(task.title, freshTask?.taskLog || task.taskLog);
            const aiResponse = await sendGuarded(task.id, prompt);
            const result = parseVerifyResponse(aiResponse);

            if (result.complete) {
              const doneThread = threadMapRef.current.get(task.id);
              if (doneThread) unregisterThread(doneThread);
              threadMapRef.current.delete(task.id);
              taskPolicyRef.current.delete(task.id);
              await finalizeTask(task.id);
            } else {
              await flagVerificationIssue(task.id, result.reason);
            }
            decision = null;
            break;
          }

          case 'error':
            await logAutomationError(task.id, decision.message);
            decision = null;
            break;

          default:
            decision = null;
            break;
        }
      }
    } catch (error) {
      if (error?.__gatedPause) {
        // Not a failure — a tool needed permission this headless run
        // could not grant. Pause to 'waiting' so the user can resume.
        await pauseTaskWaiting(task.id, error.message);
      } else {
        logger.error('task-automation', 'Failed to process automated task', {
          taskId: task.id, error: error?.message,
        });
        await logAutomationError(task.id, error).catch(() => {});
      }
    } finally {
      processingRef.current.delete(task.id);
    }
  }, [sendGuarded, pauseTaskWaiting]);

  // Subscribe to automated tasks (mirrors useChat's remote-chat listener).
  useEffect(() => {
    if (!hasApi || typeof api.langgraphSendMessage !== 'function') {
      logger.warn('task-automation', 'Task automation idle (no LangGraph IPC bindings)');
      return undefined;
    }

    logger.info('task-automation', 'Task automation active (agent-driven)');
    const unsubscribe = subscribeAutomatedTasks(async (task) => {
      logger.info('task-automation', 'Automated task detected', { taskId: task.id });

      // Already approved this session, or already processing → proceed.
      if (taskPolicyRef.current.has(task.id)) {
        const accepted = await api.localData.automation.acceptCommand({
          idempotencyKey: `task:${task.id}:${task.revision}`,
          source: 'local',
          instruction: task.title,
          contextText: task.description || null,
          requestedAt: Date.now(),
          taskId: task.id,
        });
        if (!accepted.duplicate) api.automationExecuteRun(accepted.run.id, taskPolicyRef.current.get(task.id));
        return;
      }
      // Suppress duplicate permission prompts from snapshot echoes.
      if (pendingPermissionRef.current.has(task.id)) return;
      pendingPermissionRef.current.add(task.id);
      try {
        const policy = await requestTaskPermission(task);
        if (policy) {
          const accepted = await api.localData.automation.acceptCommand({
            idempotencyKey: `task:${task.id}:${task.revision}`,
            source: 'local',
            instruction: task.title,
            contextText: task.description || null,
            requestedAt: Date.now(),
            taskId: task.id,
          });
          if (!accepted.duplicate) api.automationExecuteRun(accepted.run.id, policy);
        }
      } finally {
        pendingPermissionRef.current.delete(task.id);
      }
    });

    return () => unsubscribe();
  }, [processTask, requestTaskPermission]);
}

// ── Prompt builders ──────────────────────────────────────────

function buildBreakdownPrompt(title, context) {
  const lines = [
    'You are an expert project manager and personal assistant working inside briizOS, a desktop workspace app. A user will provide a high-level goal. Your job is to break that goal down into a list of small, actionable steps.',
    '',
    "Evaluate the user's goal carefully.",
    '- If the goal is straightforward and you have enough information (e.g., "organize my garage", "email the PDF to John", "plan a birthday party"), break it down into a list of concrete, actionable steps and set isDone to true. Each step should be something that can be checked off — specific, not vague.',
    "- If the goal is ambiguous, emotionally complex, or requires details you don't have (e.g., \"reconcile with mom\", \"fix that thing from yesterday\"), you MUST ask one single clarifying question to get the necessary information. Do not generate steps yet. Set isDone to false and populate the clarifyingQuestion field.",
    "- Keep steps practical. Prefer 3-7 steps. Don't over-decompose simple goals or under-decompose complex ones.",
    "- You have access to the user's filesystem, terminal, browser, GitHub, and other desktop tools. Factor this into your steps — if a step can be automated, phrase it as an action you will take, not something the user has to do manually.",
  ];

  if (context) {
    lines.push('');
    lines.push('The user has provided the following context to your previous question:');
    lines.push('"' + context + '"');
    lines.push('Use this information to generate the steps.');
  }

  lines.push('');
  lines.push('Respond with ONLY a JSON object, no markdown wrapping, no explanation:');
  lines.push('{ "isDone": true, "tasks": ["step 1", "step 2", ...] }');
  lines.push('or');
  lines.push('{ "isDone": false, "clarifyingQuestion": "your question" }');
  lines.push('');
  lines.push('User Goal: "' + title + '"');

  return lines.join('\n');
}

function buildStepPrompt(taskTitle, stepTitle, stepIndex, totalSteps, taskLog) {
  const recentLog = (taskLog || [])
    .slice(-10)
    .map((e) => '[' + e.type + '] ' + e.message)
    .join('\n');

  const lines = [
    'You are a personal assistant working inside briizOS, a desktop workspace app with access to the filesystem, terminal, browser, GitHub, and other tools.',
    '',
    'You are executing a multi-step task for the user.',
    '',
    'Overall task: "' + taskTitle + '"',
    'Current step: ' + (stepIndex + 1) + ' of ' + totalSteps + ' — "' + stepTitle + '"',
  ];

  if (recentLog) {
    lines.push('');
    lines.push('Recent activity log:');
    lines.push(recentLog);
  }

  lines.push('');
  lines.push('Execute this step using whatever tools are appropriate. When finished, provide a brief summary (1-3 sentences) of what you accomplished and any relevant details the user should know.');
  lines.push('');
  lines.push("If this step cannot be completed because something is missing or blocked, explain what's wrong so the user can help.");

  return lines.join('\n');
}

function buildVerifyPrompt(taskTitle, taskLog) {
  const logSummary = (taskLog || [])
    .filter((e) => e.type === 'status')
    .map((e) => e.message)
    .join('\n');

  const lines = [
    'You are a personal assistant working inside briizOS. You have been executing a multi-step task for the user.',
    '',
    'Task: "' + taskTitle + '"',
    '',
    'Work completed:',
    logSummary || '(no log entries)',
    '',
    'All individual steps have been marked as complete. Review the work that was done and determine whether the overall task goal has been achieved.',
    '',
    'Consider:',
    '- Were all steps actually completed, or were some skipped or partially done?',
    "- Does the work as a whole satisfy the user's original goal?",
    '- Is there anything obvious that was missed?',
    '',
    'Respond with ONLY a JSON object, no markdown wrapping:',
    '{ "complete": true }',
    'or',
    '{ "complete": false, "reason": "what\'s missing or incomplete" }',
  ];

  return lines.join('\n');
}

// ── Response parsers & helpers ───────────────────────────────

function extractText(response) {
  if (typeof response === 'string') return response;

  // langgraphSendMessage returns the agent output. Find the
  // last assistant message for the actual response text.
  if (response?.messages && response.messages.length > 0) {
    for (let i = response.messages.length - 1; i >= 0; i--) {
      const msg = response.messages[i];
      if (msg.role === 'assistant' || msg.type === 'ai') {
        const content = msg.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          const textParts = content
            .filter((c) => c.type === 'text')
            .map((c) => c.text);
          if (textParts.length > 0) return textParts.join('\n');
        }
        return JSON.stringify(content);
      }
    }
  }

  if (response?.content) return response.content;
  if (response?.text) return response.text;
  return JSON.stringify(response);
}

function parseBreakdownResponse(response) {
  try {
    const text = extractText(response);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to the safe default.
  }
  return { isDone: false, clarifyingQuestion: 'I had trouble understanding the task. Could you rephrase it?' };
}

function parseVerifyResponse(response) {
  try {
    const text = extractText(response);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { complete: parsed.complete === true, reason: parsed.reason || null };
    }
  } catch {
    // Fall through to the safe default.
  }
  return { complete: false, reason: 'Could not parse verification response' };
}

export default useTaskAutomation;
