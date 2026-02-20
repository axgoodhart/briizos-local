import { useState, useEffect } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { useTasks } from '../hooks/useTasks';
import { addLog } from '../lib/firestore';
import logger from '../lib/logger';

// Safe API access helper (still needed for studio IPC)
const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

function TasksPanel() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const {
    isRecording,
    activeSession,
    sessions,
    toggleRecording,
    recordEvent,
    getSession,
    deleteSession,
    exportSession
  } = useRecorder();

  // Add a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    try {
      await addTask(title);
      setNewTaskTitle('');
      await recordEvent('task_created', { title });
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
      await recordEvent('subtask_created', { parentId, title });
    } catch (error) {
      logger.error('ui', 'Failed to add subtask', error?.message);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (task, isSubtask = false) => {
    try {
      const newStatus = await toggleTask(task);
      await recordEvent('task_updated', {
        taskId: task.id,
        title: task.title,
        status: newStatus,
        isSubtask
      });
    } catch (error) {
      logger.error('ui', 'Failed to update task', error?.message);
    }
  };

  // Delete a task
  const handleDeleteTask = async (e, task) => {
    e.stopPropagation();
    try {
      await deleteTask(task.id);
      await recordEvent('task_deleted', { taskId: task.id, title: task.title });
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
      await recordEvent('task_breakdown', { taskId: task.id, title: task.title });
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

  // Studio buttons
  const studioButtons = [
    { id: 'video', label: 'Video' },
    { id: 'website', label: 'Website' },
    { id: 'replicate', label: 'Replicate' },
    { id: 'suno', label: 'Suno' },
    { id: 'dalle', label: 'DALLE' },
    { id: 'ideogram', label: 'Ideogram' },
    { id: 'myaudio', label: 'MyAudio' },
    { id: 'briizclerk', label: 'Briiz-Clerk' }
  ];

  const handleStudioClick = async (toolId) => {
    if (!hasApi) return;
    try {
      const result = await api.launchStudioTool(toolId);
      await addLog(
        'studio_launch',
        result.success
          ? `Launched ${toolId}: ${result.message}`
          : `Failed to launch ${toolId}: ${result.message}`
      );
      await recordEvent('studio_tool_launched', { toolId, success: result.success });
    } catch (error) {
      logger.error('ui', 'Failed to launch studio tool', error?.message);
      await addLog('studio_error', `Error launching ${toolId}: ${error.message}`);
    }
  };

  // Recording handlers
  const handleRecordClick = async () => {
    try {
      if (isRecording) {
        await toggleRecording();
        await addLog('recording_stopped', 'Recording session stopped');
      } else {
        const timestamp = new Date().toLocaleString();
        await toggleRecording(`Session ${timestamp}`);
        await addLog('recording_started', 'Recording session started');
      }
    } catch (error) {
      logger.error('ui', 'Failed to toggle recording', error?.message);
    }
  };

  // Session review handlers
  const handleViewSessions = () => {
    setShowSessions(true);
    setSelectedSession(null);
    setSessionDetails(null);
  };

  const handleSessionSelect = async (session) => {
    try {
      const details = await getSession(session.id);
      setSelectedSession(session);
      setSessionDetails(details);
      setPlaybackIndex(0);
      setIsPlaying(false);
    } catch (error) {
      logger.error('ui', 'Failed to load session', error?.message);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setSessionDetails(null);
      }
    } catch (error) {
      logger.error('ui', 'Failed to delete session', error?.message);
    }
  };

  const handleExportSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      const json = await exportSession(sessionId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('ui', 'Failed to export session', error?.message);
    }
  };

  // Playback controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (sessionDetails?.data?.events && playbackIndex < sessionDetails.data.events.length - 1) {
      setPlaybackIndex(playbackIndex + 1);
    }
  };

  const handleStepBack = () => {
    if (playbackIndex > 0) {
      setPlaybackIndex(playbackIndex - 1);
    }
  };

  // Auto-advance playback
  useEffect(() => {
    let interval;
    if (isPlaying && sessionDetails?.data?.events) {
      interval = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev < sessionDetails.data.events.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sessionDetails]);

  // Format event for display
  const formatEvent = (event) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    switch (event.type) {
      case 'chat_message':
        return `[${time}] ${event.data.role}: ${event.data.content?.substring(0, 50)}...`;
      case 'task_created':
        return `[${time}] Created task: ${event.data.title}`;
      case 'task_updated':
        return `[${time}] Updated task: ${event.data.title} -> ${event.data.status}`;
      case 'task_deleted':
        return `[${time}] Deleted task: ${event.data.title}`;
      case 'subtask_created':
        return `[${time}] Added subtask: ${event.data.title}`;
      case 'task_breakdown':
        return `[${time}] AI breakdown: ${event.data.title}`;
      case 'file_selection':
        return `[${time}] ${event.data.action} file: ${event.data.filePath}`;
      case 'studio_tool_launched':
        return `[${time}] Launched studio tool: ${event.data.toolId}`;
      default:
        return `[${time}] ${event.type}: ${JSON.stringify(event.data).substring(0, 40)}...`;
    }
  };

  // Render subtask item
  const renderSubtask = (subtask, parentId) => (
    <div
      key={subtask.id}
      className={`subtask-item ${subtask.status === 'completed' ? 'completed' : 'pending'}`}
      onClick={() => handleToggleTask(subtask, true)}
    >
      <input
        type="checkbox"
        checked={subtask.status === 'completed'}
        onChange={() => handleToggleTask(subtask, true)}
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
        onClick={(e) => handleDeleteTask(e, subtask)}
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

  // Session review UI
  if (showSessions) {
    return (
      <div className="panel tasks-panel">
        <div className="panel-header">
          <span>Sessions</span>
          <div className="panel-header-actions">
            <button
              className="panel-header-btn"
              onClick={() => setShowSessions(false)}
              title="Back to Tasks"
            >
              &larr;
            </button>
          </div>
        </div>
        <div className="panel-content">
          {!selectedSession ? (
            <div className="sessions-list">
              {sessions.length === 0 ? (
                <div className="task-item empty">No recorded sessions</div>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.id}
                    className="session-item"
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="session-info">
                      <span className="session-name">{session.name}</span>
                      <span className="session-time">
                        {new Date(session.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="session-actions">
                      <button
                        className="session-action-btn"
                        onClick={(e) => handleExportSession(e, session.id)}
                        title="Export"
                      >
                        &#8595;
                      </button>
                      <button
                        className="session-action-btn delete"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="session-playback">
              <div className="session-playback-header">
                <button
                  className="back-btn"
                  onClick={() => { setSelectedSession(null); setSessionDetails(null); }}
                >
                  &larr; Back
                </button>
                <span className="session-title">{selectedSession.name}</span>
              </div>

              <div className="playback-controls">
                <button className="playback-btn" onClick={handleStepBack} disabled={playbackIndex === 0}>
                  &#9664;&#9664;
                </button>
                <button className="playback-btn play" onClick={handlePlayPause}>
                  {isPlaying ? '&#10074;&#10074;' : '&#9654;'}
                </button>
                <button
                  className="playback-btn"
                  onClick={handleStepForward}
                  disabled={!sessionDetails?.data?.events || playbackIndex >= sessionDetails.data.events.length - 1}
                >
                  &#9654;&#9654;
                </button>
                <span className="playback-progress">
                  {sessionDetails?.data?.events ? `${playbackIndex + 1}/${sessionDetails.data.events.length}` : '0/0'}
                </span>
              </div>

              <div className="events-timeline">
                {sessionDetails?.data?.events?.map((event, index) => (
                  <div
                    key={index}
                    className={`event-item ${index === playbackIndex ? 'current' : ''} ${index < playbackIndex ? 'past' : ''}`}
                    onClick={() => setPlaybackIndex(index)}
                  >
                    {formatEvent(event)}
                  </div>
                ))}
                {(!sessionDetails?.data?.events || sessionDetails.data.events.length === 0) && (
                  <div className="event-item empty">No events recorded</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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

        {/* Studio Section */}
        <div className="studio-section">
          <div className="studio-header">Studio</div>
          <div className="studio-grid">
            {studioButtons.map(btn => (
              <button
                key={btn.id}
                className="studio-btn"
                onClick={() => handleStudioClick(btn.id)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record Button */}
      <div className="record-section">
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordClick}
        >
          <span className={`record-icon ${isRecording ? 'active' : ''}`}></span>
          <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
        </button>
        {sessions.length > 0 && (
          <button
            className="view-sessions-btn"
            onClick={handleViewSessions}
          >
            View Sessions ({sessions.length})
          </button>
        )}
        {isRecording && activeSession && (
          <div className="recording-indicator">
            Recording: {activeSession.name}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksPanel;
