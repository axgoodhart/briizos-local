/**
 * useTaskAutomation Hook
 *
 * Listens for automated tasks and bridges them to LangGraph.
 * Follows the same pattern as useChat's remote chat listener.
 */

import { useEffect, useRef, useCallback } from 'react';
import { subscribeAutomatedTasks, getTask } from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';
import {
  evaluateTask,
  logBreakdownStart,
  saveBreakdownResult,
  logStepStart,
  logStepDone,
  completeStep,
  logVerificationStart,
  finalizeTask,
  flagVerificationIssue,
  logAutomationError,
  appendTaskLog,
} from '../lib/taskAutomation';
import logger from '../lib/logger';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

export function useTaskAutomation() {
  const uid = getCurrentUid();
  const processingRef = useRef(new Set());
  // Keep one LangGraph thread per task so the agent retains context across steps
  const threadMapRef = useRef(new Map());

  // Get or create a LangGraph thread for a given task
  const getThreadForTask = useCallback(async (taskId) => {
    if (!hasApi) throw new Error('Electron API not available');

    const existing = threadMapRef.current.get(taskId);
    if (existing) return existing;

    const threadResult = await api.langgraphCreateThread();
    const threadId = threadResult?.thread_id || threadResult?.threadId || threadResult;
    if (!threadId) throw new Error('Failed to create LangGraph thread');

    threadMapRef.current.set(taskId, threadId);
    logger.debug('task-automation', 'Created thread ' + threadId + ' for task ' + taskId);
    return threadId;
  }, []);

  // Send a message to LangGraph and get a synchronous response
  const sendToAgent = useCallback(async (taskId, message) => {
    const threadId = await getThreadForTask(taskId);

    // Use the globally selected model from the InteractionPanel picker
    const model = localStorage.getItem('briizos-selected-model') || undefined;

    const result = await api.langgraphSendMessage(threadId, message, {
      // Automation runs headlessly — agent must not wait for user confirmation
      tool_confirmation_mode: 'no-asking',
      model,
    });
    return result;
  }, [getThreadForTask]);

  // Process an automated task through the decision tree.
  // Loops internally so that step→step→verify chains complete in a single
  // invocation rather than relying on Firestore re-fires between steps.
  const processTask = useCallback(async (task) => {
    if (processingRef.current.has(task.id)) return;
    processingRef.current.add(task.id);

    try {
      let decision = await evaluateTask(task);

      // Loop: each iteration handles one action, then gets the next from
      // completeStep/evaluateTask. Exits on completion, error, or waiting.
      while (decision) {
        switch (decision.action) {
          case 'breakdown': {
            await logBreakdownStart(task.id);

            const prompt = buildBreakdownPrompt(task.title, null);
            const aiResponse = await sendToAgent(task.id, prompt);
            const parsed = parseBreakdownResponse(aiResponse);

            const breakdownResult = await saveBreakdownResult(task.id, parsed);
            if (breakdownResult.action === 'waiting' || breakdownResult.action === 'error') {
              decision = null; // Stop — waiting for user or hit an error
            } else {
              // Breakdown created steps; re-evaluate to start resuming
              const freshTask = await getTask(task.id);
              decision = freshTask ? await evaluateTask(freshTask) : null;
            }
            break;
          }

          case 'resume': {
            await logStepStart(task.id, decision.step.title, decision.stepIndex, decision.totalSteps);

            const prompt = buildStepPrompt(
              task.title,
              decision.step.title,
              decision.stepIndex,
              decision.totalSteps,
              task.taskLog
            );
            const aiResponse = await sendToAgent(task.id, prompt);
            const summary = extractText(aiResponse);

            // completeStep marks the action done and returns the next decision
            decision = await completeStep(task.id, decision.step.id, summary);
            break;
          }

          case 'verify': {
            await logVerificationStart(task.id);

            const freshTask = await getTask(task.id);
            const prompt = buildVerifyPrompt(task.title, freshTask?.taskLog || task.taskLog);
            const aiResponse = await sendToAgent(task.id, prompt);
            const result = parseVerifyResponse(aiResponse);

            if (result.complete) {
              threadMapRef.current.delete(task.id);
              await finalizeTask(task.id);
            } else {
              await flagVerificationIssue(task.id, result.reason);
            }
            decision = null; // Done — either completed or flagged
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
      logger.error('task-automation', 'Failed to process task ' + task.id, error?.message);
      await logAutomationError(task.id, error).catch(() => {});
    } finally {
      processingRef.current.delete(task.id);
      // threadMapRef cleanup for errored tasks
      if (!processingRef.current.has(task.id)) {
        // Keep thread for potential retry — it will be GC'd on next successful completion
      }
    }
  }, [sendToAgent]);

  // Subscribe to automated tasks
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeAutomatedTasks((task) => {
      logger.info('task-automation', 'Automated task detected: ' + task.id);
      processTask(task);
    });

    return () => unsubscribe();
  }, [uid, processTask]);
}

// ── Prompt builders ──────────────────────────────────────────

function buildBreakdownPrompt(title, context) {
  const lines = [
    'You are an expert project manager and personal assistant working inside briizOS, a desktop workspace app. A user will provide a high-level goal. Your job is to break that goal down into a list of small, actionable steps.',
    '',
    'Evaluate the user\'s goal carefully.',
    '- If the goal is straightforward and you have enough information (e.g., "organize my garage", "email the PDF to John", "plan a birthday party"), break it down into a list of concrete, actionable steps and set isDone to true. Each step should be something that can be checked off — specific, not vague.',
    '- If the goal is ambiguous, emotionally complex, or requires details you don\'t have (e.g., "reconcile with mom", "fix that thing from yesterday"), you MUST ask one single clarifying question to get the necessary information. Do not generate steps yet. Set isDone to false and populate the clarifyingQuestion field.',
    '- Keep steps practical. Prefer 3-7 steps. Don\'t over-decompose simple goals or under-decompose complex ones.',
    '- You have access to the user\'s filesystem, terminal, browser, GitHub, and other desktop tools. Factor this into your steps — if a step can be automated, phrase it as an action you will take, not something the user has to do manually.',
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
    .map(function(e) { return '[' + e.type + '] ' + e.message; })
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
  lines.push('If this step cannot be completed because something is missing or blocked, explain what\'s wrong so the user can help.');

  return lines.join('\n');
}

function buildVerifyPrompt(taskTitle, taskLog) {
  const logSummary = (taskLog || [])
    .filter(function(e) { return e.type === 'status'; })
    .map(function(e) { return e.message; })
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
    '- Does the work as a whole satisfy the user\'s original goal?',
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

  // LangGraph /runs/wait returns { messages: [{ role, content }, ...] }
  // Find the last assistant message for the actual response
  if (response?.messages && response.messages.length > 0) {
    for (let i = response.messages.length - 1; i >= 0; i--) {
      const msg = response.messages[i];
      if (msg.role === 'assistant' || msg.type === 'ai') {
        const content = msg.content;
        // Content can be a string or an array of content blocks
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          const textParts = content
            .filter(c => c.type === 'text')
            .map(c => c.text);
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
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fall through
  }
  return { isDone: false, clarifyingQuestion: 'I had trouble understanding the task. Could you rephrase it?' };
}

function parseVerifyResponse(response) {
  try {
    const text = extractText(response);
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { complete: parsed.complete === true, reason: parsed.reason || null };
    }
  } catch (e) {
    // Fall through
  }
  return { complete: false, reason: 'Could not parse verification response' };
}

export default useTaskAutomation;
