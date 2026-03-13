import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { addLog } from '../lib/firestore';
import logger from '../lib/logger';
import PhantomSection from './PhantomSection';

// Safe API access helper (still needed for studio IPC)
const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

function TasksPanel() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const {
    tasks,
    isLoading,
    isBreakingDown,
    addTask,
    addSubtask,
    toggleTask,
    deleteTask,
    breakdownTask,
    getTaskStats,
    getSubtaskProgress
  } = useTasks();

  // Add a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    try {
      await addTask(title);
      setNewTaskTitle('');
    } catch (error) {
      logger.error('ui', 'Failed to add task', error?.message);
    }
  };

  // Add a subtask
  const handleAddSubtask = async (e, parentId) => {
    e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title) return;

    try {
      await addSubtask(parentId, title);
      setNewSubtaskTitle('');
      setAddingSubtaskFor(null);
    } catch (error) {
      logger.error('ui', 'Failed to add subtask', error?.message);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (task) => {
    try {
      await toggleTask(task);
    } catch (error) {
      logger.error('ui', 'Failed to update task', error?.message);
    }
  };

  // Delete a task or action
  const handleDeleteTask = async (e, task, parentId = null) => {
    e.stopPropagation();
    try {
      await deleteTask(task.id, parentId);
    } catch (error) {
      logger.error('ui', 'Failed to delete task', error?.message);
    }
  };

  // AI breakdown a task
  const handleBreakdownTask = async (e, task) => {
    e.stopPropagation();
    try {
      await breakdownTask(task.id);
      // Auto-expand the task to show new subtasks
      setExpandedTasks(prev => new Set([...prev, task.id]));
    } catch (error) {
      logger.error('ui', 'Failed to breakdown task', error?.message);
      await addLog('ai_breakdown_error', error.message);
    }
  };

  // Toggle task expansion
  const toggleExpanded = (taskId) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'low': return '#4caf50';
      default: return '#ffc107';
    }
  };

  // Calculate progress
  const stats = getTaskStats();

  // Render subtask item
  const renderSubtask = (subtask, parentId) => (
    <div
      key={subtask.id}
      className={`subtask-item ${subtask.status === 'completed' ? 'completed' : 'pending'}`}
      onClick={() => handleToggleTask(subtask)}
    >
      <input
        type="checkbox"
        checked={subtask.status === 'completed'}
        onChange={() => handleToggleTask(subtask)}
        onClick={(e) => e.stopPropagation()}
      />
      <span
        className="priority-dot"
        style={{ backgroundColor: getPriorityColor(subtask.priority) }}
        title={`Priority: ${subtask.priority}`}
      />
      <span className={`subtask-name ${subtask.status === 'completed' ? 'done' : ''}`}>
        {subtask.title}
      </span>
      <button
        className="task-delete-btn"
        onClick={(e) => handleDeleteTask(e, subtask, parentId)}
        title="Delete subtask"
      >
        &times;
      </button>
    </div>
  );

  // Render task item with subtasks
  const renderTask = (task) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const subtaskProgress = getSubtaskProgress(task);
    const isAddingSubtask = addingSubtaskFor === task.id;

    return (
      <div key={task.id} className="task-item-container">
        <div
          className={`task-item ${task.status === 'completed' ? 'completed' : 'pending'} ${hasSubtasks ? 'has-subtasks' : ''}`}
          onClick={() => handleToggleTask(task)}
        >
          {hasSubtasks && (
            <button
              className="task-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(task.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={() => handleToggleTask(task)}
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className="priority-dot"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
            title={`Priority: ${task.priority}`}
          />
          <span className={`task-name ${task.status === 'completed' ? 'done' : ''}`}>
            {task.title}
          </span>

          {/* Subtask progress indicator */}
          {subtaskProgress && (
            <span className="subtask-progress-badge" title={`${subtaskProgress.completed}/${subtaskProgress.total} subtasks`}>
              {subtaskProgress.percent}%
            </span>
          )}

          {/* Task action buttons */}
          <div className="task-actions">
            {!hasSubtasks && task.status !== 'completed' && (
              <button
                className={`task-action-btn breakdown ${isBreakingDown ? 'loading' : ''}`}
                onClick={(e) => handleBreakdownTask(e, task)}
                title="AI breakdown into subtasks"
                disabled={isBreakingDown}
              >
                ✨
              </button>
            )}
            <button
              className="task-action-btn add-subtask"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubtaskFor(isAddingSubtask ? null : task.id);
                setNewSubtaskTitle('');
                if (!isExpanded && !isAddingSubtask) {
                  setExpandedTasks(prev => new Set([...prev, task.id]));
                }
              }}
              title="Add subtask"
            >
              +
            </button>
            <button
              className="task-delete-btn"
              onClick={(e) => handleDeleteTask(e, task)}
              title="Delete task"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Subtasks list */}
        {(isExpanded || isAddingSubtask) && (
          <div className="subtasks-container">
            {/* Add subtask form */}
            {isAddingSubtask && (
              <form onSubmit={(e) => handleAddSubtask(e, task.id)} className="add-subtask-form">
                <input
                  type="text"
                  className="subtask-input"
                  placeholder="Add subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="subtask-add-btn"
                  disabled={!newSubtaskTitle.trim()}
                >
                  +
                </button>
                <button
                  type="button"
                  className="subtask-cancel-btn"
                  onClick={() => {
                    setAddingSubtaskFor(null);
                    setNewSubtaskTitle('');
                  }}
                >
                  ✕
                </button>
              </form>
            )}

            {/* Subtasks list */}
            {hasSubtasks && isExpanded && (
              <div className="subtasks-list">
                {task.subtasks.map(subtask => renderSubtask(subtask, task.id))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Main tasks panel UI
  return (
    <div className="panel tasks-panel">
      <div className="panel-header">
        <span>Tasks</span>
        <div className="panel-header-actions">
          <span className="task-progress-label">{stats.completed}/{stats.total}</span>
          <button className="panel-header-btn" title="Expand">&#11036;</button>
        </div>
      </div>
      <div className="panel-content">
        {/* Add Task Input */}
        <form onSubmit={handleAddTask} className="task-input-form">
          <input
            type="text"
            className="task-input"
            placeholder="Add a task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <button
            type="submit"
            className="task-add-btn"
            disabled={!newTaskTitle.trim()}
          >
            +
          </button>
        </form>

        {/* Overall Progress */}
        {stats.total > 0 && (
          <div className="overall-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            <span className="progress-percent">{stats.progressPercent}%</span>
          </div>
        )}

        {/* Tasks List */}
        <div className="tasks-section">
          {isLoading ? (
            <div className="task-item loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="task-item empty">No tasks yet</div>
          ) : (
            tasks.map(task => renderTask(task))
          )}
        </div>
      </div>
 
      <PhantomSection />
    </div>
  );
}

export default TasksPanel;
