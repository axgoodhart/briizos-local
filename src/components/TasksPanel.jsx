import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useDeckMaker } from '../hooks/useDeckMaker';
import { updateTask as updateLocalTask } from '../lib/localTasks';
import { automateTask, handleUserResponse } from '../lib/taskAutomation';
import logger from '../lib/logger';
import PhantomSection from './PhantomSection';

// Safe API access helper (still needed for studio IPC)
const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

function TasksPanel() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [openCards, setOpenCards] = useState(new Set());
  const [closingCards, setClosingCards] = useState(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newDeckGoal, setNewDeckGoal] = useState('');
  const [deckAnswer, setDeckAnswer] = useState('');

  // AI Deck Maker (Phase 2, ActionDeck port): goal → optional clarifying
  // question → parent task + subtasks. Auto-open the new deck when done.
  const deckMaker = useDeckMaker({
    onDeckCreated: (taskId) => {
      setExpandedTasks((prev) => new Set([...prev, taskId]));
      setOpenCards((prev) => new Set([...prev, taskId]));
    },
  });

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

  // Start an AI deck from a goal
  const handleStartDeck = async (e) => {
    e.preventDefault();
    const goal = newDeckGoal.trim();
    if (!goal) return;
    setNewDeckGoal('');
    await deckMaker.startDeck(goal);
  };

  // Answer the deck maker's clarifying question
  const handleAnswerDeck = async (e) => {
    e.preventDefault();
    const answer = deckAnswer.trim();
    if (!answer) return;
    setDeckAnswer('');
    await deckMaker.answerClarification(answer);
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
    }
  };

  // Automate a task — flag it and determine next action
  const [automatingTasks, setAutomatingTasks] = useState(new Set());

  const handleAutomate = async (e, task) => {
    e.stopPropagation();
    if (automatingTasks.has(task.id)) return;

    setAutomatingTasks(prev => new Set([...prev, task.id]));
    try {
      // Flag the task — the local task change notification starts automation.
      await automateTask(task.id);
      // Open the card so the user can watch progress in the log
      setOpenCards(prev => new Set([...prev, task.id]));
    } catch (error) {
      logger.error('ui', 'Failed to automate task', error?.message);
    } finally {
      setAutomatingTasks(prev => { const next = new Set(prev); next.delete(task.id); return next; });
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

  // Toggle dropdown card with close animation
  const toggleCard = (taskId) => {
    if (openCards.has(taskId)) {
      // Start closing animation
      setClosingCards(prev => new Set([...prev, taskId]));
      setTimeout(() => {
        setOpenCards(prev => { const next = new Set(prev); next.delete(taskId); return next; });
        setClosingCards(prev => { const next = new Set(prev); next.delete(taskId); return next; });
      }, 200);
    } else {
      setOpenCards(prev => new Set([...prev, taskId]));
    }
  };

  // Cycle task status: created → active → deferred → created
  const cycleStatus = async (task) => {
    const order = ['running', 'active', 'deferred'];
    const current = order.indexOf(task.status);
    const next = order[(current + 1) % order.length];
    try {
      await updateLocalTask(task.id, { status: next });
    } catch (error) {
      logger.error('ui', 'Failed to update status', error?.message);
    }
  };

  // Status display label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'active';
      case 'deferred': return 'deferred';
      case 'completed': return 'completed';
      default: return 'created';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00ff9f';
      case 'deferred': return '#ffc107';
      case 'completed': return '#4caf50';
      default: return '#bd00ff';
    }
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

  // Render task log entries
  const renderTaskLog = (task) => {
    const log = task.taskLog || [];
    if (log.length === 0) {
      return <div className="task-card-log-empty">No activity yet</div>;
    }
    return log.map((entry, i) => {
      const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return (
        <div key={i} className={`task-card-log-entry task-card-log-${entry.type || 'status'}`}>
          <span className="task-card-log-time">{time}</span>
          <span className="task-card-log-msg">{entry.message || ''}</span>
        </div>
      );
    });
  };

  // Render task item with dropdown card
  const renderTask = (task) => {
    const isExpanded = expandedTasks.has(task.id);
    const isCardOpen = openCards.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const subtaskProgress = getSubtaskProgress(task);
    const isAddingSubtask = addingSubtaskFor === task.id;
    const displayId = (task.id || '').replace('tasks-', '');

    return (
      <div key={task.id} className="task-item-container">
        {/* Task row */}
        <div
          className={`task-item ${task.status === 'completed' ? 'completed' : 'pending'} ${hasSubtasks ? 'has-subtasks' : ''} ${subtaskProgress && subtaskProgress.completed === subtaskProgress.total ? 'deck-complete' : ''} ${isCardOpen ? 'card-open' : ''}`}
          onClick={() => toggleCard(task.id)}
        >
          <span className={`task-expand-btn ${isCardOpen ? 'card-active' : ''}`}>
            {isCardOpen ? '▼' : '▶'}
          </span>

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

          <span className="task-row-end">
            {subtaskProgress && (
              <span className="subtask-progress-badge" title={`${subtaskProgress.percent}% of this deck done`}>
                {subtaskProgress.completed} / {subtaskProgress.total}
              </span>
            )}
            <button
              className="task-row-delete"
              onClick={(e) => handleDeleteTask(e, task)}
              title="Delete task"
            >&times;</button>
          </span>
        </div>

        {/* Dropdown detail card */}
        {isCardOpen && (
          <div className={`task-card ${closingCards.has(task.id) ? 'closing' : ''}`}>
            {/* Header */}
            <div className="task-card-header">Task ID #{displayId}</div>

            {/* Detail grid */}
            <div className="task-card-grid">

              <span className="task-card-label">ToDo</span>
              <div className="task-card-value">
                {hasSubtasks && (
                  <div className="task-card-actions-list">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="task-card-action-item">
                        <input
                          type="checkbox"
                          checked={subtask.status === 'completed'}
                          onChange={() => handleToggleTask(subtask)}
                        />
                        <span
                          className="priority-dot"
                          style={{ backgroundColor: getPriorityColor(subtask.priority) }}
                        />
                        <span className={subtask.status === 'completed' ? 'done' : ''}>
                          {subtask.title}
                        </span>
                        <button
                          className="task-card-action-delete"
                          onClick={(e) => handleDeleteTask(e, subtask, task.id)}
                          title="Remove"
                        >&times;</button>
                      </div>
                    ))}
                  </div>
                )}
                {isAddingSubtask ? (
                  <form
                    className="task-card-add-subtask-form"
                    onSubmit={(e) => handleAddSubtask(e, task.id)}
                  >
                    <input
                      type="text"
                      className="task-card-subtask-input"
                      placeholder="Add action..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="task-card-subtask-submit" disabled={!newSubtaskTitle.trim()}>+</button>
                    <button type="button" className="task-card-subtask-cancel" onClick={() => { setAddingSubtaskFor(null); setNewSubtaskTitle(''); }}>&#x2715;</button>
                  </form>
                ) : (
                  <button
                    className="task-card-add-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingSubtaskFor(task.id);
                      setNewSubtaskTitle('');
                    }}
                  >+ Add action</button>
                )}
              </div>
            </div>

            {/* Task log */}
            <div className="task-card-log-section">
              <div className="task-card-log-header">Task Log</div>
              <div className="task-card-log">
                {renderTaskLog(task)}
              </div>
            </div>


            {/* Status toggle bar */}
            <button
              className="task-card-status-bar"
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(task);
              }}
              title="Click to cycle status"
            >
              <span className="task-card-status-label">STATUS:</span>
              <span
                className="task-card-status-value"
                style={{ color: getStatusColor(task.status) }}
              >
                {getStatusLabel(task.status)}
              </span>
            </button>

            {/* Action buttons row */}
            <div className="task-card-buttons">
              <button
                className={`task-card-btn task-card-btn-plan ${isBreakingDown ? 'loading' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBreakdownTask(e, task);
                }}
                title="Help me plan"
                disabled={isBreakingDown}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.04 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>
              </button>
              <button
                className="task-card-btn task-card-btn-done"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTask(task);
                }}
                title="Mark finished"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" /></svg>
              </button>
              <button
                className="task-card-btn task-card-btn-delete"
                onClick={(e) => handleDeleteTask(e, task)}
                title="Delete"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
              </button>
              <button
                className={`task-card-btn task-card-btn-automate ${automatingTasks.has(task.id) ? 'loading' : ''}`}
                onClick={(e) => handleAutomate(e, task)}
                title="Automate"
                disabled={automatingTasks.has(task.id)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H15A2,2 0 0,1 17,9V15A2,2 0 0,1 15,17H9A2,2 0 0,1 7,15V9A2,2 0 0,1 9,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M12,4A1,1 0 0,0 11,5A1,1 0 0,0 12,6A1,1 0 0,0 13,5A1,1 0 0,0 12,4M9,9V15H15V9H9M11,11H13V13H11V11Z" /></svg>
              </button>
            </div>



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

        {/* New Deck (AI): goal → optional clarifying question → deck */}
        <form onSubmit={handleStartDeck} className="deck-input-form">
          <input
            type="text"
            className="task-input deck-input"
            placeholder="New deck: describe a goal…"
            value={newDeckGoal}
            onChange={(e) => setNewDeckGoal(e.target.value)}
            disabled={deckMaker.status !== 'idle'}
          />
          <button
            type="submit"
            className="task-add-btn deck-add-btn"
            disabled={!newDeckGoal.trim() || deckMaker.status !== 'idle'}
            title="AI builds a deck of tasks from this goal"
          >
            {deckMaker.isWorking ? '…' : '✦'}
          </button>
        </form>
        {deckMaker.status === 'thinking' && (
          <div className="deck-status">Building deck…</div>
        )}
        {deckMaker.status === 'creating' && (
          <div className="deck-status">Creating tasks…</div>
        )}
        {deckMaker.status === 'clarifying' && (
          <div className="deck-clarify">
            <div className="deck-clarify-question">{deckMaker.question}</div>
            <form onSubmit={handleAnswerDeck} className="deck-clarify-form">
              <input
                type="text"
                className="task-input"
                placeholder="Your answer…"
                value={deckAnswer}
                onChange={(e) => setDeckAnswer(e.target.value)}
                autoFocus
              />
              <button type="submit" className="task-add-btn" disabled={!deckAnswer.trim()}>
                →
              </button>
              <button type="button" className="deck-cancel-btn" onClick={deckMaker.cancelDeck} title="Cancel deck">
                ✕
              </button>
            </form>
          </div>
        )}
        {deckMaker.error && <div className="deck-error">{deckMaker.error}</div>}

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
