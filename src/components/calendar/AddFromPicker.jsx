import { useEffect, useMemo, useState } from 'react';
import logger from '../../lib/logger';
import '../../AppCombined.css';

const CLOSED_TASK_STATUSES = new Set(['completed', 'cancelled']);

function milestoneTitle(milestone) {
  return milestone?.label || milestone?.name || milestone?.title || 'Milestone';
}

function sourceKey(projectId, milestoneId = null) {
  return milestoneId
    ? `island-milestone:${projectId}:${milestoneId}`
    : `island-project:${projectId}`;
}

function recurrenceFor(type, dateStr) {
  if (type === 'none') return null;
  const recurrence = { enabled: true, type, interval: 1, anchorDate: dateStr };
  if (type === 'weekly') recurrence.daysOfWeek = [new Date(`${dateStr}T00:00:00`).getDay()];
  return recurrence;
}

export default function AddFromPicker({ dateStr, onClose, onScheduleTask, onPromoteIslandSource }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [repeat, setRepeat] = useState('none');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      window.api.localData.tasks.list({ limit: 1000 }),
      window.api.islandLoadState(),
    ]).then(([taskRows, islandState]) => {
      if (!active) return;
      setTasks((taskRows || []).filter((task) => !CLOSED_TASK_STATUSES.has(task.status)));
      setProjects(islandState?.projects || []);
    }).catch((loadError) => {
      if (!active) return;
      setError(loadError?.message || 'Could not load task sources');
      logger.error('calendar.placement', 'Add-from source load failed', { error: loadError?.message });
    });
    return () => { active = false; };
  }, []);

  const sources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const taskSources = tasks.map((task) => ({
      key: `task:${task.id}`,
      kind: 'task',
      title: task.title,
      context: task.priority && task.priority !== 'normal' ? `${task.priority} priority` : 'Tasks Panel',
      task,
    }));
    const islandSources = projects.flatMap((project) => {
      const projectSource = {
        key: `project:${project.id}`,
        kind: 'island',
        title: `Work on ${project.name}`,
        context: `${project.name} · project session`,
        project,
        milestone: null,
        sourceKey: sourceKey(project.id),
      };
      const milestones = (project.milestones || [])
        .filter((milestone) => !milestone.completed)
        .map((milestone) => ({
          key: `milestone:${project.id}:${milestone.id}`,
          kind: 'island',
          title: milestoneTitle(milestone),
          context: `${project.name} · milestone${milestone.date ? ` · ${milestone.date}` : ''}`,
          project,
          milestone,
          sourceKey: sourceKey(project.id, milestone.id),
        }));
      return [projectSource, ...milestones];
    });
    return [...taskSources, ...islandSources].filter((source) => (
      !needle || `${source.title} ${source.context}`.toLowerCase().includes(needle)
    ));
  }, [tasks, projects, query]);

  const schedule = async () => {
    if (!selected) return;
    setWorking(true);
    setError(null);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const placement = {
        date: dateStr,
        startMinute: hours * 60 + minutes,
        durationMinutes: Math.max(1, Math.min(1440, Number(duration) || 60)),
        recurrence: recurrenceFor(repeat, dateStr),
      };
      if (selected.kind === 'task') await onScheduleTask(selected.task, placement);
      else await onPromoteIslandSource(selected, placement);
      onClose();
    } catch (scheduleError) {
      setError(scheduleError?.message || 'Could not schedule this item');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="add-from-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="add-from-picker" role="dialog" aria-modal="true" aria-label="Add an existing item to the day">
        <div className="add-from-head">
          <div>
            <span>Add from your work</span>
            <strong>{dateStr}</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <input
          className="add-from-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a task, project, or milestone…"
          autoFocus
        />
        <div className="add-from-sources">
          {sources.length === 0 ? (
            <div className="add-from-empty">No open work matches that search.</div>
          ) : sources.map((source) => (
            <button
              type="button"
              key={source.key}
              className={selected?.key === source.key ? 'selected' : ''}
              onClick={() => setSelected(source)}
            >
              <i className={source.kind}>{source.kind === 'task' ? 'T' : 'F'}</i>
              <span><strong>{source.title}</strong><small>{source.context}</small></span>
              <b>{selected?.key === source.key ? '✓' : ''}</b>
            </button>
          ))}
        </div>
        <div className="add-from-when">
          <label><span>Start</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <label><span>Minutes</span><input type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
          <label>
            <span>Repeat</span>
            <select value={repeat} onChange={(event) => setRepeat(event.target.value)}>
              <option value="none">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
        {error && <div className="add-from-error">{error}</div>}
        <div className="add-from-footer">
          <span>{selected ? selected.title : 'Choose what should appear on this day.'}</span>
          <button type="button" onClick={schedule} disabled={!selected || working}>
            {working ? 'Adding…' : 'Add to day'}
          </button>
        </div>
      </div>
    </div>
  );
}
