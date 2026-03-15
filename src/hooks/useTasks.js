import { useState, useEffect, useCallback } from 'react';
import {
  subscribeTasks,
  addTask as addTaskFirestore,
  addSubtasks as addSubtasksFirestore,
  updateTask as updateTaskFirestore,
  deleteTask as deleteTaskFirestore,
  getTask as getTaskFirestore,
  addLog,
} from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';
import logger from '../lib/logger';

// AI breakdown still needs Electron main process
const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // Subscribe to tasks from Firestore
  useEffect(() => {
    const uid = getCurrentUid();
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeTasks((firestoreTasks) => {
      setTasks(firestoreTasks);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add a new task
  const addTask = useCallback(async (title, options = {}) => {
    try {
      const id = await addTaskFirestore(title, options);
      return id;
    } catch (error) {
      logger.error('ui', 'Failed to add task', error?.message);
      throw error;
    }
  }, []);

  // Add a subtask to a parent task
  const addSubtask = useCallback(async (parentId, title, options = {}) => {
    try {
      const ids = await addSubtasksFirestore(parentId, [{ title, ...options }]);
      return ids[0];
    } catch (error) {
      logger.error('ui', 'Failed to add subtask', error?.message);
      throw error;
    }
  }, []);

  // Add multiple subtasks at once (used by AI breakdown)
  const addSubtasks = useCallback(async (parentId, subtasks) => {
    try {
      const ids = await addSubtasksFirestore(parentId, subtasks);
      return ids;
    } catch (error) {
      logger.error('ui', 'Failed to add subtasks', error?.message);
      throw error;
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id, updates) => {
    try {
      await updateTaskFirestore(id, updates);
    } catch (error) {
      logger.error('ui', 'Failed to update task', error?.message);
      throw error;
    }
  }, []);

  // Toggle task completion (supports actions via parent_id)
  const toggleTask = useCallback(async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates = { status: newStatus };
    if (task.parent_id) {
      updates._parentId = task.parent_id;
    }
    await updateTask(task.id, updates);
    return newStatus;
  }, [updateTask]);

  // Delete a task or action (actions need parent ID)
  const deleteTask = useCallback(async (id, parentId = null) => {
    try {
      await deleteTaskFirestore(id, parentId ? { _parentId: parentId } : {});
    } catch (error) {
      logger.error('ui', 'Failed to delete task', error?.message);
      throw error;
    }
  }, []);

  // Get a single task with its subtasks
  const getTask = useCallback(async (id) => {
    try {
      return await getTaskFirestore(id);
    } catch (error) {
      logger.error('ui', 'Failed to get task', error?.message);
      throw error;
    }
  }, []);

  // AI-powered task breakdown via LangGraph
  const breakdownTask = useCallback(async (taskId) => {
    if (!hasApi) return null;
    setIsBreakingDown(true);
    try {
      const { automateTask } = await import('../lib/taskAutomation');
      const result = await automateTask(taskId);
      return result;
    } catch (error) {
      logger.error('ui', 'Failed to breakdown task', error?.message);
      throw error;
    } finally {
      setIsBreakingDown(false);
    }
  }, []);

  // Calculate completion stats
  // Each top-level task has equal weight. Subtasks split their parent's weight evenly.
  // e.g. 3 tasks (33% each): t1 has 2 subtasks (16.5% each), t2 has none, t3 has 4 (8.25% each)
  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    if (total === 0) return { total: 0, completed: 0, pending: 0, progressPercent: 0 };

    const taskWeight = 100 / total;
    let percent = 0;
    let completed = 0;

    for (const task of tasks) {
      if (task.status === 'completed') {
        completed++;
        percent += taskWeight;
      } else if (task.subtasks && task.subtasks.length > 0) {
        const subtaskWeight = taskWeight / task.subtasks.length;
        for (const sub of task.subtasks) {
          if (sub.status === 'completed') {
            percent += subtaskWeight;
          }
        }
      }
    }

    return {
      total,
      completed,
      pending: total - completed,
      progressPercent: Math.round(percent)
    };
  }, [tasks]);

  // Get task progress for a specific parent task
  const getSubtaskProgress = useCallback((task) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return null;
    }

    const completed = task.subtasks.filter(s => s.status === 'completed').length;
    const total = task.subtasks.length;
    const percent = Math.round((completed / total) * 100);

    return { completed, total, percent };
  }, []);

  return {
    tasks,
    isLoading,
    isBreakingDown,
    fetchTasks: () => {}, // No-op; real-time subscription handles this
    addTask,
    addSubtask,
    addSubtasks,
    updateTask,
    toggleTask,
    deleteTask,
    getTask,
    breakdownTask,
    getTaskStats,
    getSubtaskProgress
  };
}

export default useTasks;
