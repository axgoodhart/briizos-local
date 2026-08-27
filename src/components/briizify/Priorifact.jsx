import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { formatDateYMD } from '../../lib/dates';

/**
 * Priorifact — the ambient artifact briizify produces.
 *
 * State 2 ("ambient"): a docked strip at the bottom of the Tasks
 * Panel. Left rail lists the plan's activities as chips in their
 * ORIGINAL order — the current one renders as a progress bar, and
 * clicking a chip forces the miniCal to proceed to that activity
 * (it never changes the clock, only which activity is "current").
 * The channel toggles (show prep / show steps / support) borrow the
 * miniCal space to show the current activity's details. After a
 * short idle the artifact returns to ambience on its own.
 *
 * "view/edit plan" expands into the full plan: a proportional
 * timeline (long breaks render as labeled dividers), every card,
 * and per-card removal.
 *
 * Focus mode: the card row stays anchored to the CLOCK (clicks never
 * remove or reshuffle cards), and the viewed activity's prep + steps
 * render below the row automatically, joined to its card by a
 * hue-matched path. Clicking a card peeks at that activity's prep +
 * steps without moving the plan's "current" anchor; chips keep their
 * existing "proceed to this activity" meaning.
 */

const IDLE_RETURN_MS = 25000;
const CHANNEL_TOGGLES = [
  { id: 'preparation', label: 'show prep', field: 'prep' },
  { id: 'steps', label: 'show steps', field: 'steps' },
  { id: 'support', label: 'support', field: 'support' },
];

function nowMinuteOf(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function fmtClock(minute) {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const display = hours % 12 || 12;
  return `${display}:${String(mins).padStart(2, '0')}${hours < 12 ? 'am' : 'pm'}`;
}

function fmtShort(minute) {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const display = hours % 12 || 12;
  return `${display}:${String(mins).padStart(2, '0')}`;
}

function fmtTimeInput(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

function parseTimeInput(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const result = hours * 60 + minutes;
  return result >= 0 && result <= 1439 ? result : null;
}

function Priorifact({
  plan,
  onAddBreak,
  onRemoveActivity,
  onAddToCalendar,
  onSaveFlow,
  onExtendActivity,
  onUpdateActivity,
  onSwapActivities,
  onAddActivity,
  onTogglePause,
  calendarStatus,
  saveFlowStatus,
  extendingActivityId,
  scheduleStatus,
  actionError,
  maxTargetExtensions,
  focused = false,
  onChangePlan,
  onEndPlan,
}) {
  const [nowMinute, setNowMinute] = useState(() => nowMinuteOf());
  const [today, setToday] = useState(() => formatDateYMD(new Date()));
  const [overrideId, setOverrideId] = useState(null);
  const overrideBaseRef = useRef(null);
  // Focus-mode peek: which activity's prep/steps are on display. View-only —
  // never re-anchors "current", so the card row cannot reflow from a click.
  const [viewedId, setViewedId] = useState(null);
  const [connectorX, setConnectorX] = useState(26);
  const cardRowRef = useRef(null);
  const cardNodesRef = useRef(new Map());
  const [activeChannel, setActiveChannel] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [draggedActivityId, setDraggedActivityId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const idleRef = useRef(null);
  const cancelEditRef = useRef(false);
  const editing = expanded && !focused;

  useEffect(() => {
    const tick = setInterval(() => {
      setNowMinute(nowMinuteOf());
      setToday(formatDateYMD(new Date()));
    }, 30000);
    return () => clearInterval(tick);
  }, []);

  // Idle return-to-ambience: any interaction re-arms the timer.
  const touch = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      setActiveChannel(null);
      setExpanded(false);
      setOverrideId(null);
      setViewedId(null);
      overrideBaseRef.current = null;
    }, IDLE_RETURN_MS);
  }, []);
  useEffect(() => () => { if (idleRef.current) clearTimeout(idleRef.current); }, []);
  useEffect(() => {
    if (editing) return;
    setEditDraft(null);
    setDraggedActivityId(null);
    setDropTargetId(null);
    setDeleteArmed(false);
  }, [editing]);

  const paused = !!plan.pauseState;
  const scheduleDate = paused ? plan.pauseState.anchorDate : today;
  const scheduleMinute = paused ? plan.pauseState.anchorMinute : nowMinute;
  const pauseElapsedMinutes = paused
    ? Math.max(1, Math.ceil((Date.now() - plan.pauseState.startedAt) / 60000))
    : 0;
  const scheduleWorking = scheduleStatus === 'working';

  const todays = useMemo(() => {
    const scoped = plan.activities.filter((activity) => activity.date === scheduleDate);
    return scoped.length ? scoped : plan.activities;
  }, [plan, scheduleDate]);
  const nonBreak = useMemo(() => todays.filter((activity) => activity.kind !== 'break'), [todays]);

  // Clock-driven current activity: the active block, else the next
  // upcoming one, else null (plan complete).
  const clockCurrent = useMemo(() => {
    const active = [...nonBreak].reverse().find((activity) => (
      activity.startMinute <= scheduleMinute && scheduleMinute < activity.startMinute + activity.durationMinutes
    ));
    if (active) return active;
    return nonBreak.find((activity) => activity.startMinute > scheduleMinute) || null;
  }, [nonBreak, scheduleMinute]);

  // A chip click overrides "current" until the clock itself moves on.
  useEffect(() => {
    if (overrideId && overrideBaseRef.current !== (clockCurrent?.id || null)) {
      setOverrideId(null);
      overrideBaseRef.current = null;
    }
  }, [clockCurrent, overrideId]);

  const current = useMemo(() => {
    if (overrideId) {
      const forced = nonBreak.find((activity) => activity.id === overrideId);
      if (forced) return forced;
    }
    return clockCurrent;
  }, [overrideId, nonBreak, clockCurrent]);

  // The activity whose prep/steps the focus view displays: an explicit
  // card peek wins, otherwise it follows "current" (clock or chip jump).
  const viewed = useMemo(() => {
    if (viewedId) {
      const peeked = nonBreak.find((activity) => activity.id === viewedId);
      if (peeked) return peeked;
    }
    return current;
  }, [viewedId, nonBreak, current]);

  // When the clock moves on to a new activity (or focus is entered or
  // left), return the peek to the actual current activity.
  useEffect(() => {
    setViewedId(null);
  }, [clockCurrent?.id, focused]);

  const done = !current;
  const calendarComplete = plan.activities.length > 0
    && plan.activities.every((activity) => plan.calendarBlocks?.[activity.id]);
  const flowSaved = !!plan.savedFlowId;
  const extensionCount = current ? plan.targetExtensions?.[current.id] || 0 : 0;
  const extensionLimitReached = extensionCount >= maxTargetExtensions;
  const extensionWorking = extendingActivityId === current?.id;
  const interactionBusy = scheduleWorking
    || calendarStatus === 'working'
    || saveFlowStatus === 'working'
    || !!extendingActivityId;

  const remainLabel = useMemo(() => {
    if (!current) return 'plan complete';
    if (scheduleMinute < current.startMinute) {
      const label = `in ${current.startMinute - scheduleMinute}m`;
      return paused ? `paused · ${label}` : label;
    }
    const remaining = Math.max(0, current.startMinute + current.durationMinutes - scheduleMinute);
    return paused ? `paused · ${remaining}m left` : `${remaining}m more`;
  }, [current, paused, scheduleMinute]);

  const progressOf = useCallback((activity) => {
    if (scheduleMinute <= activity.startMinute) return 0;
    if (scheduleMinute >= activity.startMinute + activity.durationMinutes) return 100;
    return Math.round(((scheduleMinute - activity.startMinute) / activity.durationMinutes) * 100);
  }, [scheduleMinute]);

  // The visible card row. Anchored to the CLOCK current, never the
  // clicked one — looking at another activity must not drop or
  // reshuffle the cards already on screen.
  const cards = useMemo(() => {
    if (!clockCurrent) return todays;
    const index = todays.indexOf(clockCurrent);
    return index >= 0 ? todays.slice(index) : todays;
  }, [todays, clockCurrent]);

  // Focus mode auto-shows prep and steps, so only the support toggle
  // stays there; the docked view keeps all three.
  const toggles = CHANNEL_TOGGLES
    .filter((toggle) => plan.channels?.[toggle.id])
    .filter((toggle) => !focused || toggle.id === 'support');
  const detailBullets = activeChannel && current
    ? current[CHANNEL_TOGGLES.find((toggle) => toggle.id === activeChannel)?.field] || []
    : [];

  // Focus mode shows the viewed activity's prep and steps together
  // (plus support while its toggle is on), read straight off that
  // activity so the bullets always belong to the selected activity.
  const focusSections = viewed
    ? [
      { id: 'preparation', label: 'prep:', bullets: viewed.prep || [] },
      { id: 'steps', label: 'steps:', bullets: viewed.steps || [] },
      ...(activeChannel === 'support'
        ? [{ id: 'support', label: 'support:', bullets: viewed.support || [] }]
        : []),
    ].filter((section) => section.bullets.length > 0)
    : [];
  const viewedCardIndex = viewed ? Math.max(0, cards.indexOf(viewed)) : 0;

  // Focus mode: clicking a card or chip peeks at that activity's
  // prep/steps; clicking it again returns the view to the current
  // activity. A peek never re-anchors the plan and never moves,
  // removes, or resizes the cards on screen.
  const handleCardPeek = useCallback((activity) => {
    touch();
    setViewedId((currentPeekId) => (currentPeekId === activity.id ? null : activity.id));
  }, [touch]);

  const handleChip = useCallback((activity) => {
    if (focused) {
      handleCardPeek(activity);
      return;
    }
    touch();
    setViewedId(null);
    if (activity.id === clockCurrent?.id) {
      setOverrideId(null);
      overrideBaseRef.current = null;
      return;
    }
    setOverrideId(activity.id);
    overrideBaseRef.current = clockCurrent?.id || null;
  }, [clockCurrent, focused, handleCardPeek, touch]);

  // Aim the connector's drop line at the viewed activity's card (a
  // little inside its left edge). Reads rendered positions, so it
  // runs after layout, not during render. The prep/steps text itself
  // stays anchored left; only the connector moves.
  useLayoutEffect(() => {
    if (!focused || editing || !viewed) {
      setConnectorX(26);
      return;
    }
    const row = cardRowRef.current;
    const node = cardNodesRef.current.get(viewed.id);
    if (!row || !node) {
      setConnectorX(26);
      return;
    }
    const offset = node.getBoundingClientRect().left - row.getBoundingClientRect().left + 24;
    const limit = Math.max(26, row.clientWidth - 12);
    setConnectorX(Math.round(Math.max(26, Math.min(offset, limit))));
  }, [focused, editing, viewed, cards]);

  const handleToggle = useCallback((channelId) => {
    touch();
    setActiveChannel((currentChannel) => (currentChannel === channelId ? null : channelId));
  }, [touch]);

  const beginEdit = useCallback((activity, field) => {
    if (!editing || paused || interactionBusy) return;
    cancelEditRef.current = false;
    const value = field === 'startMinute'
      ? fmtTimeInput(activity.startMinute)
      : String(activity[field]);
    setEditDraft({ activityId: activity.id, field, value });
    touch();
  }, [editing, interactionBusy, paused, touch]);

  const cancelEdit = useCallback(() => {
    cancelEditRef.current = true;
    setEditDraft(null);
  }, []);

  const commitEdit = useCallback(async () => {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }
    const draft = editDraft;
    if (!draft) return;
    setEditDraft(null);
    let value = draft.value;
    if (draft.field === 'startMinute') value = parseTimeInput(value);
    if (draft.field === 'durationMinutes') value = Number(value);
    await onUpdateActivity(draft.activityId, { [draft.field]: value });
  }, [editDraft, onUpdateActivity]);

  const handleEditKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }, [cancelEdit]);

  const handleAddActivity = useCallback(async () => {
    if (paused || interactionBusy || addingActivity) return;
    setAddingActivity(true);
    touch();
    const targetDate = todays[todays.length - 1]?.date || scheduleDate;
    let activity = null;
    try {
      activity = await onAddActivity(targetDate);
    } finally {
      setAddingActivity(false);
    }
    if (activity) {
      cancelEditRef.current = false;
      setEditDraft({ activityId: activity.id, field: 'title', value: activity.title });
    }
  }, [addingActivity, interactionBusy, onAddActivity, paused, scheduleDate, todays, touch]);

  const handleDragStart = useCallback((event, activityId) => {
    if (paused || interactionBusy) {
      event.preventDefault();
      return;
    }
    setDraggedActivityId(activityId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', activityId);
  }, [interactionBusy, paused]);

  const handleDrop = useCallback(async (event, targetId) => {
    event.preventDefault();
    const sourceId = draggedActivityId || event.dataTransfer.getData('text/plain');
    setDraggedActivityId(null);
    setDropTargetId(null);
    if (!sourceId || sourceId === targetId) return;
    touch();
    await onSwapActivities(sourceId, targetId);
  }, [draggedActivityId, onSwapActivities, touch]);

  const handleSwapKeyDown = useCallback(async (event, activityId) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || paused || interactionBusy) return;
    const swappable = todays.filter((activity) => activity.kind !== 'break');
    const index = swappable.findIndex((activity) => activity.id === activityId);
    const target = swappable[index + (event.key === 'ArrowLeft' ? -1 : 1)];
    if (!target) return;
    event.preventDefault();
    touch();
    await onSwapActivities(activityId, target.id);
  }, [interactionBusy, onSwapActivities, paused, todays, touch]);

  // Timeline geometry for the expanded view.
  const span = useMemo(() => {
    if (!todays.length) return { start: 0, end: 1 };
    const activityStart = Math.min(...todays.map((activity) => activity.startMinute));
    const activityEnd = Math.max(...todays.map((activity) => activity.startMinute + activity.durationMinutes));
    const start = Math.min(plan.window?.startMinute ?? activityStart, activityStart);
    const end = Math.max(plan.window?.endMinute ?? activityEnd, activityEnd);
    return { start, end: Math.max(end, start + 30) };
  }, [todays, plan.window]);
  const spanPct = useCallback(
    (minute) => `${Math.min(100, Math.max(0, ((minute - span.start) / (span.end - span.start)) * 100))}%`,
    [span],
  );

  const hueClass = (index) => `bzf-hue-${Math.min(2, Math.floor(index / 2))}`;

  const renderEditableField = (activity, field, display, className) => {
    const editing = editDraft?.activityId === activity.id && editDraft.field === field;
    if (editing) {
      const inputType = field === 'startMinute' ? 'time' : field === 'durationMinutes' ? 'number' : 'text';
      return (
        <input
          className={`${className} bzf-card-editor`}
          type={inputType}
          min={field === 'durationMinutes' ? 1 : undefined}
          max={field === 'durationMinutes' ? 1440 : undefined}
          value={editDraft.value}
          onChange={(event) => {
            touch();
            setEditDraft((currentDraft) => ({ ...currentDraft, value: event.target.value }));
          }}
          onBlur={commitEdit}
          onKeyDown={handleEditKeyDown}
          onFocus={(event) => event.currentTarget.select()}
          aria-label={`Edit activity ${field === 'title' ? 'name' : field === 'startMinute' ? 'start time' : 'duration'}`}
          autoFocus
        />
      );
    }
    return (
      <button
        type="button"
        className={`${className} bzf-card-editable`}
        onDoubleClick={() => beginEdit(activity, field)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'F2') beginEdit(activity, field);
        }}
        disabled={paused || interactionBusy}
        title="Double-click to edit"
      >
        {display}
      </button>
    );
  };

  const renderCard = (activity, index, { removable = false } = {}) => {
    const editable = removable;
    const draggable = editable && activity.kind !== 'break';
    const isDragging = draggedActivityId === activity.id;
    const isDropTarget = dropTargetId === activity.id && draggedActivityId !== activity.id;
    const cardInteractionProps = draggable ? {
      onDragOver: (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; },
      onDragEnter: (event) => { event.preventDefault(); setDropTargetId(activity.id); },
      onDragLeave: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDropTargetId(null);
      },
      onDrop: (event) => handleDrop(event, activity.id),
    } : {};

    if (activity.kind === 'break') {
      return (
        <div key={activity.id} className="bzf-card break" title={`${activity.durationMinutes}m break`}>
          {editable && (
            <div className="bzf-card-top break-time">
              {renderEditableField(activity, 'startMinute', fmtShort(activity.startMinute), 'bzf-card-time')}
            </div>
          )}
          {editable
            ? renderEditableField(activity, 'title', activity.title, 'bzf-card-break-label')
            : <span className="bzf-card-break-label">{activity.title}</span>}
          {editable
            ? renderEditableField(activity, 'durationMinutes', `${activity.durationMinutes}m`, 'bzf-card-duration')
            : <span className="bzf-card-duration">{activity.durationMinutes}m</span>}
          {removable && (
            <button
              type="button"
              className="bzf-card-remove"
              onClick={() => { touch(); onRemoveActivity(activity.id); }}
              disabled={paused || interactionBusy}
              title="Remove break"
            >✕</button>
          )}
        </div>
      );
    }
    const isCurrent = activity.id === current?.id;
    const isDone = progressOf(activity) >= 100 && !isCurrent;
    const peekable = focused && !removable;
    const isPeeked = peekable && viewedId === activity.id;
    const peekProps = peekable ? {
      role: 'button',
      tabIndex: 0,
      onClick: () => handleCardPeek(activity),
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardPeek(activity);
        }
      },
      'aria-pressed': isPeeked,
      title: isPeeked
        ? 'Click to show the current activity again'
        : `Click to show preparation and steps for ${activity.title}`,
    } : {};
    return (
      <div
        key={activity.id}
        ref={(node) => {
          if (node) cardNodesRef.current.set(activity.id, node);
          else cardNodesRef.current.delete(activity.id);
        }}
        className={`bzf-card ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''} ${hueClass(index)} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''} ${peekable ? 'peekable' : ''} ${isPeeked ? 'peeked' : ''}`}
        {...cardInteractionProps}
        {...peekProps}
      >
        <div className="bzf-card-top">
          {editable
            ? renderEditableField(activity, 'startMinute', fmtShort(activity.startMinute), 'bzf-card-time')
            : <span className="bzf-card-time">{fmtShort(activity.startMinute)}</span>}
          {editable
            ? renderEditableField(activity, 'durationMinutes', <>{activity.durationMinutes}<sup>m</sup></>, 'bzf-card-duration')
            : <span className="bzf-card-duration">{activity.durationMinutes}<sup>m</sup></span>}
        </div>
        {editable
          ? renderEditableField(activity, 'title', activity.title, 'bzf-card-title')
          : <div className="bzf-card-title">{activity.title}</div>}
        {removable && (
          <button
            type="button"
            className="bzf-card-remove"
            onClick={() => { touch(); onRemoveActivity(activity.id); }}
            disabled={paused || interactionBusy}
            title="Remove from plan"
          >✕</button>
        )}
        {draggable && (
          <button
            type="button"
            className="bzf-card-drag-handle"
            draggable
            onDragStart={(event) => handleDragStart(event, activity.id)}
            onDragEnd={() => { setDraggedActivityId(null); setDropTargetId(null); }}
            onKeyDown={(event) => handleSwapKeyDown(event, activity.id)}
            disabled={paused || interactionBusy}
            aria-label={`Drag ${activity.title} to swap its slot`}
            title="Drag to swap slots · arrow keys also move this activity"
          >
            <span />
            <span />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`priorifact ${editing ? 'expanded' : ''} ${focused ? 'focused' : ''} ${paused ? 'paused' : ''}`}
      onPointerDown={touch}
      onWheel={touch}
    >
      {!done && (
        <div className="bzf-toggle-row">
          <div className="bzf-toggle-channels">
            {toggles.map((toggle) => (
              <button
                key={toggle.id}
                type="button"
                className={`bzf-toggle ${activeChannel === toggle.id ? 'active' : ''}`}
                onClick={() => handleToggle(toggle.id)}
                aria-pressed={activeChannel === toggle.id}
              >
                <span className="bzf-toggle-dot" />
                {toggle.label}
              </button>
            ))}
          </div>
          {toggles.length > 0 && <span className="bzf-toggle-divider" aria-hidden="true" />}
          <div className="bzf-flow-actions">
            <button
              type="button"
              className={`bzf-flow-action pause ${paused ? 'active' : ''}`}
              onClick={() => { touch(); onTogglePause((clockCurrent || current).id, scheduleMinute); }}
              disabled={interactionBusy}
              aria-pressed={paused}
              title={paused ? 'Resume and move the remaining schedule' : 'Pause this priorifact'}
            >
              {scheduleWorking ? 'Working…' : paused ? `Resume · ${pauseElapsedMinutes}m` : 'Pause'}
            </button>
            <button
              type="button"
              className={`bzf-flow-action ${calendarComplete ? 'complete' : ''}`}
              onClick={() => { touch(); onAddToCalendar(); }}
              disabled={interactionBusy || calendarComplete}
              aria-label="Add priorifact blocks to Calendar"
              title={calendarComplete ? 'This priorifact is on your Calendar' : 'Add every block to Calendar'}
            >
              {calendarComplete
                ? '✓ Calendar'
                : calendarStatus === 'working'
                  ? 'Adding…'
                  : calendarStatus === 'error' ? '↻ Calendar' : '+Calendar'}
            </button>
            <button
              type="button"
              className={`bzf-flow-action ${flowSaved ? 'complete' : ''}`}
              onClick={() => { touch(); onSaveFlow(); }}
              disabled={interactionBusy || flowSaved}
              aria-label="Save this priorifact as a reusable flow"
              title={flowSaved ? 'This flow is saved for future reuse' : 'Save this flow for another day'}
            >
              {flowSaved ? '✓ Flow saved' : saveFlowStatus === 'working' ? 'Saving…' : '↓ Save Flow'}
            </button>
          </div>
        </div>
      )}

      <div className="priorifact-body">
        <div className="priorifact-rail">
          {nonBreak.map((activity) => {
            const isCurrent = activity.id === current?.id;
            const isInProgress = !paused
              && isCurrent
              && activity.startMinute <= scheduleMinute
              && scheduleMinute < activity.startMinute + activity.durationMinutes;
            return (
              <button
                key={activity.id}
                type="button"
                className={`bzf-chip ${isCurrent ? 'current' : ''} ${isInProgress ? 'in-progress' : ''} ${progressOf(activity) >= 100 && !isCurrent ? 'done' : ''} ${focused && viewedId === activity.id ? 'peeked' : ''}`}
                onClick={() => handleChip(activity)}
                title={isCurrent
                  ? `${activity.title} · ${remainLabel}`
                  : focused
                    ? `Show preparation and steps for ${activity.title}`
                    : `Jump to ${activity.title}`}
              >
                {isCurrent && (
                  <span className="bzf-chip-fill" style={{ width: `${progressOf(activity)}%` }} />
                )}
                <span className="bzf-chip-label">
                  {isCurrent ? activity.title.split(' ')[0].toUpperCase() : activity.title.split(' ')[0].toLowerCase()}
                </span>
              </button>
            );
          })}
          <span className="briizify-logo rail">briizify</span>
        </div>

        <div className="priorifact-main">
          <div className="priorifact-header">
            <span className="priorifact-clock">{fmtClock(nowMinute)}</span>
            {!done && (
              <div className="priorifact-target">
                <button
                  type="button"
                  className="priorifact-extend"
                  onClick={() => { touch(); onExtendActivity(current.id); }}
                  disabled={paused || interactionBusy || extensionLimitReached || extensionWorking}
                  aria-label={`Add five minutes to ${current.title}. ${extensionCount} of ${maxTargetExtensions} extensions used.`}
                  title={extensionLimitReached
                    ? 'Five-minute extension limit reached'
                    : `Add 5 minutes · ${maxTargetExtensions - extensionCount} left`}
                >
                  {extensionWorking ? '·' : '+'}
                </button>
                <span className="priorifact-remaining">{remainLabel}</span>
              </div>
            )}
            <span className="priorifact-header-sep">•</span>
            <button
              type="button"
              className="priorifact-header-btn"
              onClick={() => { touch(); if (current) onAddBreak(current.id); }}
              disabled={!current || paused || interactionBusy}
            >
              add break
            </button>
            <span className="priorifact-header-sep">•</span>
            {editing ? (
              <>
                <button
                  type="button"
                  className="priorifact-header-btn"
                  onClick={() => { touch(); onChangePlan(); }}
                  disabled={paused || interactionBusy}
                >
                  change plan
                </button>
                <button
                  type="button"
                  className="priorifact-header-btn collapse"
                  onClick={() => { touch(); setExpanded(false); }}
                >
                  done
                </button>
              </>
            ) : focused ? (
              <button type="button" className="priorifact-header-btn" onClick={() => { touch(); onChangePlan(); }}>
                change plan
              </button>
            ) : (
              <button type="button" className="priorifact-header-btn" onClick={() => { touch(); setExpanded(true); }}>
                view/edit plan
              </button>
            )}
          </div>
          {actionError && <div className="bzf-action-error" role="status">{actionError}</div>}

          {editing || focused ? (
            <>
              <div className="bzf-timeline">
                <div className="bzf-timeline-track" />
                <div className="bzf-timeline-progress" style={{ width: spanPct(scheduleMinute) }} />
                {todays.map((activity) => (activity.kind === 'break' && activity.durationMinutes >= 20 ? (
                  <div
                    key={activity.id}
                    className="bzf-timeline-divider"
                    style={{ left: spanPct(activity.startMinute) }}
                  >
                    <span>long break</span>
                  </div>
                ) : (
                  <span
                    key={activity.id}
                    className={`bzf-timeline-marker ${activity.kind === 'break' ? 'break' : ''} ${activity.id === current?.id ? 'current' : ''} ${progressOf(activity) >= 100 && activity.id !== current?.id ? 'done' : ''}`}
                    style={{ left: spanPct(activity.startMinute) }}
                    title={`${activity.title} · ${fmtShort(activity.startMinute)}`}
                  />
                )))}
              </div>
              {editing && plan.summary && <div className="priorifact-summary">{plan.summary}</div>}
              <div ref={cardRowRef} className={`bzf-cards ${editing ? 'editing' : 'focused-overview'}`}>
                {(editing ? todays : cards).map((activity, index) => (
                  renderCard(activity, index, { removable: editing })
                ))}
                {editing && (
                  <button
                    type="button"
                    className="bzf-add-activity"
                    onClick={handleAddActivity}
                    disabled={paused || interactionBusy || addingActivity}
                    aria-label="Add an activity block"
                    title={paused ? 'Resume before adding an activity' : 'Add a 30-minute activity'}
                  >
                    {addingActivity ? '·' : '+'}
                  </button>
                )}
              </div>
              {focused && !editing && viewed && (
                <div
                  className={`bzf-focus-detail ${hueClass(viewedCardIndex)} ${viewed.id === current?.id ? 'is-current' : ''}`}
                  style={{ '--bzf-card-x': `${connectorX}px` }}
                >
                  {focusSections.length ? focusSections.map((section) => (
                    <div key={section.id} className="bzf-focus-section">
                      <div className="bzf-focus-label">{section.label}</div>
                      <ul className="bzf-detail-list">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    </div>
                  )) : (
                    <div className="bzf-focus-section">
                      <div className="bzf-muted">nothing noted for this activity</div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : done ? (
            <div className="priorifact-done">
              <span>priorifact complete</span>
              <button type="button" className="priorifact-header-btn" onClick={() => { touch(); onChangePlan(); }}>
                new plan
              </button>
              <button
                type="button"
                className="priorifact-header-btn danger"
                onClick={() => { setExpanded(true); setDeleteArmed(true); }}
              >
                delete
              </button>
            </div>
          ) : activeChannel && current ? (
            <div className="bzf-detail">
              {renderCard(current, 0)}
              <div className="bzf-detail-panel">
                <div className="bzf-detail-label">
                  {CHANNEL_TOGGLES.find((toggle) => toggle.id === activeChannel)?.field}:
                </div>
                {detailBullets.length ? (
                  <ul className="bzf-detail-list">
                    {detailBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : (
                  <div className="bzf-muted">nothing noted for this activity</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bzf-cards">
              {cards.map((activity, index) => renderCard(activity, index))}
            </div>
          )}
        </div>
      </div>
      {editing && (
        <div className={`bzf-delete-plan ${deleteArmed ? 'confirming' : ''}`}>
          {deleteArmed ? (
            <>
              <span>Delete this plan? Calendar blocks will stay in Calendar.</span>
              <button type="button" className="danger" onClick={onEndPlan} disabled={interactionBusy}>Delete plan</button>
              <button type="button" onClick={() => setDeleteArmed(false)}>Cancel</button>
            </>
          ) : (
            <button
              type="button"
              className="danger"
              onClick={() => setDeleteArmed(true)}
              disabled={interactionBusy}
            >
              Delete plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Priorifact;
