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

  // Toggle task completion
  const toggleTask = useCallback(async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { status: newStatus });
    return newStatus;
  }, [updateTask]);

  // Delete a task (and its subtasks)
  const deleteTask = useCallback(async (id) => {
    try {
      await deleteTaskFirestore(id);
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

  // AI-powered task breakdown (still uses Electron IPC for OpenAI)
  const breakdownTask = useCallback(async (taskId) => {
    if (!hasApi) return null;
    setIsBreakingDown(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Ask AI to break down the task (needs Electron main for OpenAI)
      const result = await api.breakdownTask(taskId, task.title);

      if (result.subtasks && result.subtasks.length > 0) {
        await addSubtasks(taskId, result.subtasks);
        await addLog('ai_task_breakdown', `AI broke down task "${task.title}" into ${result.subtasks.length} subtasks`);
      }

      return result;
    } catch (error) {
      logger.error('ui', 'Failed to breakdown task', error?.message);
      throw error;
    } finally {
      setIsBreakingDown(false);
    }
  }, [tasks, addSubtasks]);

  // Calculate completion stats
  const getTaskStats = useCallback(() => {
    let totalTasks = 0;
    let completedTasks = 0;

    for (const task of tasks) {
      totalTasks++;
      if (task.status === 'completed') {
        completedTasks++;
      }

      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          totalTasks++;
          if (subtask.status === 'completed') {
            completedTasks++;
          }
        }
      }
    }

    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      progressPercent
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
