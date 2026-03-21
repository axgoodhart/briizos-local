/**
 * Task Automation Logic
 *
 * Handles the decision tree when a task is flagged for automation:
 * 1. No steps? → request breakdown from AI
 * 2. Has steps, some unchecked? → resume from next unchecked step
 * 3. All steps checked? → verify completion, mark done or ask user
 */

import { updateTask, addSubtasks, getTask } from './firestore';

// Append an entry to a task's taskLog array
export async function appendTaskLog(taskId, type, message) {
  const task = await getTask(taskId);
  if (!task) return;

  const log = task.taskLog || [];
  log.push({
    timestamp: Date.now(),
    type,  // 'status' | 'question' | 'response' | 'error'
    message,
  });

  await updateTask(taskId, { taskLog: log });
}

// Flag a task for automation and determine next action
export async function automateTask(taskId) {
  const task = await getTask(taskId);
  if (!task) {
    return { action: 'error', message: 'Task not found' };
  }

  // Flag it as active
  await updateTask(taskId, { status: 'active', automated: true });
  await appendTaskLog(taskId, 'status', 'Automation started');

  return evaluateTask(task);
}

// Evaluate what the AI should do next with this task
// This is a pure decision — it logs what it decided and why
export async function evaluateTask(task) {
  const subtasks = task.subtasks || [];
  const hasSteps = subtasks.length > 0;

  if (!hasSteps) {
    await appendTaskLog(task.id, 'status', 'No steps found — requesting AI breakdown');
    return {
      action: 'breakdown',
      taskId: task.id,
      title: task.title,
    };
  }

  const unchecked = subtasks.filter(s => s.status !== 'completed');
  const completed = subtasks.length - unchecked.length;
  const allChecked = unchecked.length === 0;

  if (!allChecked) {
    const nextStep = unchecked[0];
    const stepIndex = subtasks.indexOf(nextStep) + 1;
    await appendTaskLog(task.id, 'status', `Resuming at step ${stepIndex}/${subtasks.length}: "${nextStep.title}"`);
    return {
      action: 'resume',
      taskId: task.id,
      title: task.title,
      step: nextStep,
      stepIndex: stepIndex - 1,
      totalSteps: subtasks.length,
    };
  }

  // All steps checked — verify completion
  await appendTaskLog(task.id, 'status', `All ${subtasks.length} steps checked — verifying completion`);
  return {
    action: 'verify',
    taskId: task.id,
    title: task.title,
  };
}

// AI is about to start breaking down a task
export async function logBreakdownStart(taskId) {
  await appendTaskLog(taskId, 'status', 'AI is analyzing the task...');
}

// After AI breaks down a task, save the subtasks
export async function saveBreakdownResult(taskId, result) {
  if (result.isDone && result.tasks && result.tasks.length > 0) {
    const subtaskDocs = result.tasks.map(title => ({ title, priority: 'medium' }));
    await addSubtasks(taskId, subtaskDocs);
    const stepList = result.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');
    await appendTaskLog(taskId, 'status', `Broken into ${result.tasks.length} steps:\n${stepList}`);
    return { action: 'resume', ready: true };
  }

  if (result.clarifyingQuestion) {
    await appendTaskLog(taskId, 'question', result.clarifyingQuestion);
    await updateTask(taskId, { status: 'waiting' });
    await appendTaskLog(taskId, 'status', 'Waiting for your response');
    return { action: 'waiting', question: result.clarifyingQuestion };
  }

  await appendTaskLog(taskId, 'error', 'AI returned no tasks and no question');
  return { action: 'error', message: 'Unexpected AI response' };
}

// When user responds to a clarifying question
export async function handleUserResponse(taskId, responseText) {
  await appendTaskLog(taskId, 'response', responseText);
  await updateTask(taskId, { status: 'active' });
  await appendTaskLog(taskId, 'status', 'Response received — retrying breakdown with context');
  const task = await getTask(taskId);
  return {
    action: 'breakdown',
    taskId: task.id,
    title: task.title,
    context: responseText,
  };
}

// AI is about to start working on a step
export async function logStepStart(taskId, stepTitle, stepIndex, totalSteps) {
  await appendTaskLog(taskId, 'status', `Working on step ${stepIndex + 1}/${totalSteps}: "${stepTitle}"`);
}

// AI finished working on a step (with a summary of what it did)
export async function logStepDone(taskId, stepTitle, summary) {
  const msg = summary
    ? `Completed: "${stepTitle}" — ${summary}`
    : `Completed: "${stepTitle}"`;
  await appendTaskLog(taskId, 'status', msg);
}

// Mark a step as complete and determine next action
export async function completeStep(taskId, stepId, summary) {
  const task = await getTask(taskId);
  if (!task) {
    await appendTaskLog(taskId, 'error', 'Task not found when completing step');
    return { action: 'error', message: 'Task not found' };
  }

  const step = (task.subtasks || []).find(s => s.id === stepId);
  if (step) {
    await logStepDone(taskId, step.title, summary);
  }

  // Actually mark the action as completed in Firestore.
  // updateTask with _parentId triggers the embedded-actions update path.
  await updateTask(stepId, { status: 'completed', _parentId: taskId });

  // Re-evaluate what to do next
  const freshTask = await getTask(taskId);
  return evaluateTask(freshTask);
}

// AI is about to verify whether the task is fully complete
export async function logVerificationStart(taskId) {
  await appendTaskLog(taskId, 'status', 'Verifying task completion...');
}

// Verification passed — mark task done
export async function finalizeTask(taskId) {
  await appendTaskLog(taskId, 'status', 'Verification passed — marking complete');
  await updateTask(taskId, {
    status: 'completed',
    completed: true,
    completedAt: Date.now(),
    automated: true,
    ignored: true,
  });
  await appendTaskLog(taskId, 'status', 'Task completed');
}

// Verification failed — ask user
export async function flagVerificationIssue(taskId, reason) {
  const msg = reason || 'All steps are checked but the task may not be fully complete. Please review.';
  await appendTaskLog(taskId, 'error', msg);
  await updateTask(taskId, { status: 'waiting' });
  await appendTaskLog(taskId, 'question', 'Should this task be marked as complete?');
}

// Log any error that occurs during automation
export async function logAutomationError(taskId, error) {
  const msg = typeof error === 'string' ? error : (error?.message || 'Unknown error');
  const isAuthError = /401|authentication|invalid.*api.?key|unauthorized/i.test(msg);

  if (isAuthError) {
    await appendTaskLog(taskId, 'error', 'AI provider API key is missing or invalid. Please add a valid key in Settings and retry.');
    await updateTask(taskId, { status: 'waiting', automated: false });
  } else {
    await appendTaskLog(taskId, 'error', `Automation error: ${msg}`);
    await updateTask(taskId, { status: 'waiting' });
  }
}
