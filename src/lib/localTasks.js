import logger from './logger';

const tasksApi = () => window.api.localData.tasks;

export async function getTask(taskId) {
  return tasksApi().get(taskId);
}

export async function updateTask(taskId, updates = {}) {
  if (updates._parentId) {
    const parent = await getTask(updates._parentId);
    const step = parent?.subtasks?.find((candidate) => candidate.id === taskId);
    if (!step) throw new Error('Task step not found');
    const patch = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.position !== undefined) patch.position = updates.position;
    if (Object.keys(patch).length) await tasksApi().steps.update(taskId, step.revision, patch);
    return getTask(updates._parentId);
  }

  const current = await getTask(taskId);
  if (!current) throw new Error('Task not found');
  const patch = {};
  ['title', 'description', 'status', 'priority', 'dueAt', 'automated', 'projectId'].forEach((key) => {
    if (updates[key] !== undefined) patch[key] = updates[key];
  });
  if (!Object.keys(patch).length) return current;
  const result = await tasksApi().update(taskId, current.revision, patch);
  return result.row;
}

export async function addSubtasks(taskId, subtasks) {
  const parent = await getTask(taskId);
  if (!parent) throw new Error('Task not found');
  const ids = [];
  for (let index = 0; index < subtasks.length; index += 1) {
    const subtask = subtasks[index];
    const result = await tasksApi().steps.create(taskId, {
      title: subtask.title,
      status: subtask.status || 'pending',
      position: parent.subtasks.length + index,
    });
    ids.push(result.row.id);
  }
  return ids;
}

export async function appendTaskLog(taskId, type, message) {
  return tasksApi().appendLog(taskId, type, message);
}

export function subscribeAutomatedTasks(callback) {
  let active = true;
  const scan = async () => {
    try {
      const tasks = await tasksApi().list();
      if (!active) return;
      tasks
        .filter((task) => task.automated && ['pending', 'active', 'in_progress'].includes(task.status))
        .forEach(callback);
    } catch (error) {
      logger.error('task-automation', 'Failed to scan local automated tasks', error?.message);
    }
  };
  scan();
  const unsubscribe = window.api.localData.onChanged((change) => {
    if (change?.domains?.includes('tasks')) scan();
  });
  return () => {
    active = false;
    unsubscribe();
  };
}
