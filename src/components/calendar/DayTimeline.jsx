import { Component, useEffect, useMemo, useRef, useState } from 'react';
import logger from '../../lib/logger';
import './DayTimeline.css';

const HOUR_HEIGHT = 56;
const DAY_MINUTES = 24 * 60;

function formatTime(minutes) {
  const safe = Math.max(0, Math.min(DAY_MINUTES - 1, Number(minutes) || 0));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
}

function minutesToInput(minutes) {
  const safe = Math.max(0, Math.min(DAY_MINUTES - 1, Number(minutes) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function inputToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return 0;
  return Math.max(0, Math.min(DAY_MINUTES - 1, hours * 60 + minutes));
}

function layoutEntries(entries) {
  const sorted = [...entries].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const laidOut = [];
  let group = [];
  let groupEnd = -1;

  const finishGroup = () => {
    if (!group.length) return;
    const laneCount = Math.max(...group.map((entry) => entry.lane)) + 1;
    group.forEach((entry) => laidOut.push({ ...entry, laneCount }));
    group = [];
  };

  for (const entry of sorted) {
    if (group.length && entry.startMinute >= groupEnd) {
      finishGroup();
      groupEnd = -1;
    }
    const occupied = new Set(
      group.filter((candidate) => candidate.endMinute > entry.startMinute).map((candidate) => candidate.lane),
    );
    let lane = 0;
    while (occupied.has(lane)) lane += 1;
    group.push({ ...entry, lane });
    groupEnd = Math.max(groupEnd, entry.endMinute);
  }
  finishGroup();
  return laidOut;
}

function normalizeEntries(items, placements, proposals) {
  const organizer = items.map((item) => {
    const startMinute = item.start == null ? 9 * 60 : item.start;
    const durationMinutes = Math.max(15, item.duration || (item.end != null ? item.end - startMinute : 60));
    return {
      key: `organizer:${item.id}`,
      kind: 'organizer',
      origin: item.type || 'event',
      title: item.name || item.title || 'Untitled',
      startMinute,
      durationMinutes,
      endMinute: Math.min(DAY_MINUTES, startMinute + durationMinutes),
      completed: item.status === 'done' || item.status === 'completed',
      recurring: !!item.recurrence?.enabled,
      source: item,
    };
  });

  const taskPlacements = placements.map((placement) => ({
    key: `placement:${placement.id}:${placement.occurrence_date}`,
    kind: 'placement',
    origin: 'task',
    title: placement.task?.title || 'Scheduled task',
    startMinute: placement.start_minute,
    durationMinutes: placement.duration_minutes,
    endMinute: Math.min(DAY_MINUTES, placement.start_minute + placement.duration_minutes),
    completed: !!placement.session_completed,
    taskCompleted: placement.task?.status === 'completed',
    recurring: !!placement.recurrence?.enabled,
    source: placement,
  }));

  const ghosts = proposals.map((proposal) => ({
    key: `proposal:${proposal.id}`,
    kind: 'proposal',
    origin: proposal.kind === 'task' ? 'task' : 'event',
    title: proposal.title,
    startMinute: proposal.startMinute,
    durationMinutes: proposal.durationMinutes,
    endMinute: Math.min(DAY_MINUTES, proposal.startMinute + proposal.durationMinutes),
    completed: false,
    taskCompleted: false,
    recurring: false,
    source: proposal,
  }));

  return layoutEntries([...organizer, ...taskPlacements, ...ghosts]);
}

function TimelinePopover({ entry, dateStr, onClose, onUpdateOrganizer, onRemoveOrganizer,
  onUpdatePlacement, onArchivePlacement, onCompleteTask }) {
  const [title, setTitle] = useState(entry.title);
  const [time, setTime] = useState(minutesToInput(entry.startMinute));
  const [duration, setDuration] = useState(entry.durationMinutes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const startMinute = inputToMinutes(time);
      const durationMinutes = Math.max(1, Math.min(1440, Number(duration) || 60));
      if (entry.kind === 'placement') {
        await onUpdatePlacement(entry.source, { date: dateStr, startMinute, durationMinutes });
      } else {
        await onUpdateOrganizer(entry.source.id, {
          name: title.trim() || entry.title,
          scheduledDate: dateStr,
          start: startMinute,
          duration: durationMinutes,
          end: startMinute + durationMinutes,
        });
      }
      logger.info('calendar', entry.kind === 'placement' ? 'Task session edited' : 'Calendar event edited', {
        id: entry.source.id,
        date: dateStr,
        startMinute,
        durationMinutes,
      });
      onClose();
    } catch (saveError) {
      setError(saveError?.message || 'Could not save this block');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);
    try {
      if (entry.kind === 'placement') await onArchivePlacement(entry.source);
      else await onRemoveOrganizer(entry.source.id);
      logger.info('calendar', entry.kind === 'placement' ? 'Task session unscheduled' : 'Calendar event deleted', {
        id: entry.source.id,
        date: dateStr,
      });
      onClose();
    } catch (removeError) {
      setError(removeError?.message || 'Could not remove this block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="day-timeline-popover" role="dialog" aria-label={`Edit ${entry.title}`}>
      <div className="day-timeline-popover-head">
        <span>{entry.kind === 'placement' ? 'Scheduled task' : 'Calendar event'}</span>
        <button type="button" onClick={onClose} aria-label="Close">×</button>
      </div>
      {entry.kind === 'organizer' ? (
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
      ) : (
        <div className="day-timeline-popover-title">{entry.title}</div>
      )}
      <div className="day-timeline-popover-fields">
        <label>
          <span>Start</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label>
          <span>Minutes</span>
          <input
            type="number"
            min="1"
            max="1440"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </label>
      </div>
      <div className="day-timeline-popover-actions">
        <button type="button" className="danger" onClick={remove} disabled={saving}>
          {entry.kind === 'placement' ? 'Unschedule' : 'Delete event'}
        </button>
        <button type="button" className="primary" onClick={save} disabled={saving}>Save</button>
      </div>
      {error && <div className="day-timeline-popover-error">{error}</div>}
      {entry.kind === 'placement' && !entry.taskCompleted && (
        <button
          type="button"
          className="day-timeline-task-done"
          onClick={async () => {
            setSaving(true);
            try {
              await onCompleteTask(entry.source.task);
              onClose();
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
        >
          Mark the whole task done
        </button>
      )}
      {entry.kind === 'placement' && entry.taskCompleted && (
        <div className="day-timeline-task-finished">The whole task is complete.</div>
      )}
    </div>
  );
}

function DayTimeline({
  dateStr,
  items,
  placements,
  proposals = [],
  onToggleOrganizer,
  onUpdateOrganizer,
  onRemoveOrganizer,
  onCompletePlacement,
  onUpdatePlacement,
  onArchivePlacement,
  onCompleteTask,
  onAcceptProposal,
  onRejectProposal,
}) {
  const viewportRef = useRef(null);
  const [activeKey, setActiveKey] = useState(null);
  const entries = useMemo(
    () => normalizeEntries(items, placements, proposals),
    [items, placements, proposals],
  );
  const activeEntry = entries.find((entry) => entry.key === activeKey) || null;

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 6 * HOUR_HEIGHT;
  }, [dateStr]);

  return (
    <div className="day-timeline">
      <div className="day-timeline-legend" aria-label="Timeline legend">
        <span><i className="event" />Event</span>
        <span><i className="task" />Task session</span>
        {proposals.length > 0 && <span><i className="proposal" />AI proposal</span>}
      </div>
      <div className="day-timeline-viewport" ref={viewportRef}>
        <div className="day-timeline-canvas" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="day-timeline-hour"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <span>{formatTime(hour * 60).replace(':00', '')}</span>
            </div>
          ))}

          {entries.map((entry) => {
            const width = 100 / entry.laneCount;
            const top = entry.startMinute / 60 * HOUR_HEIGHT;
            const height = Math.max(28, entry.durationMinutes / 60 * HOUR_HEIGHT - 2);
            const className = [
              'day-timeline-block',
              entry.kind,
              entry.origin,
              entry.completed ? 'session-complete' : '',
              entry.taskCompleted ? 'task-complete' : '',
            ].filter(Boolean).join(' ');
            return (
              <div
                key={entry.key}
                className={className}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(${entry.lane * width}% + ${54 - (58 * entry.lane / entry.laneCount)}px)`,
                  width: `calc(${width}% - ${58 / entry.laneCount}px)`,
                }}
                onClick={() => entry.kind !== 'proposal' && setActiveKey(entry.key)}
                role={entry.kind === 'proposal' ? undefined : 'button'}
                tabIndex={entry.kind === 'proposal' ? undefined : 0}
                onKeyDown={(event) => {
                  if (entry.kind !== 'proposal' && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    setActiveKey(entry.key);
                  }
                }}
              >
                {entry.kind !== 'proposal' && (
                  <button
                    type="button"
                    className="day-timeline-check"
                    aria-label={entry.completed ? 'Reopen session' : 'Complete session'}
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (entry.kind === 'placement') {
                        await onCompletePlacement(entry.source, dateStr, !entry.completed);
                      } else {
                        await onToggleOrganizer(entry.source.id);
                      }
                      logger.info('calendar', entry.completed ? 'Calendar block reopened' : 'Calendar block completed', {
                        kind: entry.kind,
                        id: entry.source.id,
                        date: dateStr,
                      });
                    }}
                  >
                    {entry.completed ? '✓' : ''}
                  </button>
                )}
                <div className="day-timeline-block-copy">
                  <strong>{entry.title}</strong>
                  <span>
                    {formatTime(entry.startMinute)} · {entry.durationMinutes}m
                    {entry.recurring ? ' · ↻' : ''}
                  </span>
                </div>
                {entry.kind === 'proposal' && (
                  <div className="day-timeline-proposal-actions">
                    <button type="button" onClick={() => onAcceptProposal(entry.source)}>Accept</button>
                    <button type="button" onClick={() => onRejectProposal(entry.source.id)}>×</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {entries.length === 0 && (
        <div className="day-timeline-empty">
          <span>Open day</span>
          Add an event, pull in a task, or ask briizOS to shape the day.
        </div>
      )}

      {activeEntry && (
        <TimelinePopover
          key={activeEntry.key}
          entry={activeEntry}
          dateStr={dateStr}
          onClose={() => setActiveKey(null)}
          onUpdateOrganizer={onUpdateOrganizer}
          onRemoveOrganizer={onRemoveOrganizer}
          onUpdatePlacement={onUpdatePlacement}
          onArchivePlacement={onArchivePlacement}
          onCompleteTask={onCompleteTask}
        />
      )}
    </div>
  );
}

class DayTimelineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    logger.error('calendar', 'Day timeline could not render', { error: error?.message });
  }

  componentDidUpdate(previousProps) {
    if (this.state.failed && previousProps.dateStr !== this.props.dateStr) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="day-timeline-fallback">
          The day timeline could not render. Choose another day and return to retry.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeDayTimeline(props) {
  return (
    <DayTimelineErrorBoundary dateStr={props.dateStr}>
      <DayTimeline {...props} />
    </DayTimelineErrorBoundary>
  );
}
