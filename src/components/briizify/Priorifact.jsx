import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

function Priorifact({
  plan,
  onAddBreak,
  onRemoveActivity,
  onAddToCalendar,
  onSaveFlow,
  onExtendActivity,
  calendarStatus,
  saveFlowStatus,
  extendingActivityId,
  actionError,
  maxTargetExtensions,
  onChangePlan,
  onEndPlan,
}) {
  const [nowMinute, setNowMinute] = useState(() => nowMinuteOf());
  const [today, setToday] = useState(() => formatDateYMD(new Date()));
  const [overrideId, setOverrideId] = useState(null);
  const overrideBaseRef = useRef(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const idleRef = useRef(null);

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
      overrideBaseRef.current = null;
    }, IDLE_RETURN_MS);
  }, []);
  useEffect(() => () => { if (idleRef.current) clearTimeout(idleRef.current); }, []);

  const todays = useMemo(() => {
    const scoped = plan.activities.filter((activity) => activity.date === today);
    return scoped.length ? scoped : plan.activities;
  }, [plan, today]);
  const nonBreak = useMemo(() => todays.filter((activity) => activity.kind !== 'break'), [todays]);

  // Clock-driven current activity: the active block, else the next
  // upcoming one, else null (plan complete).
  const clockCurrent = useMemo(() => {
    const active = [...nonBreak].reverse().find((activity) => (
      activity.startMinute <= nowMinute && nowMinute < activity.startMinute + activity.durationMinutes
    ));
    if (active) return active;
    return nonBreak.find((activity) => activity.startMinute > nowMinute) || null;
  }, [nonBreak, nowMinute]);

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

  const done = !current;
  const calendarComplete = plan.activities.length > 0
    && plan.activities.every((activity) => plan.calendarBlocks?.[activity.id]);
  const flowSaved = !!plan.savedFlowId;
  const extensionCount = current ? plan.targetExtensions?.[current.id] || 0 : 0;
  const extensionLimitReached = extensionCount >= maxTargetExtensions;
  const extensionWorking = extendingActivityId === current?.id;

  const remainLabel = useMemo(() => {
    if (!current) return 'plan complete';
    if (nowMinute < current.startMinute) return `in ${current.startMinute - nowMinute}m`;
    return `${Math.max(0, current.startMinute + current.durationMinutes - nowMinute)}m more`;
  }, [current, nowMinute]);

  const progressOf = useCallback((activity) => {
    if (nowMinute <= activity.startMinute) return 0;
    if (nowMinute >= activity.startMinute + activity.durationMinutes) return 100;
    return Math.round(((nowMinute - activity.startMinute) / activity.durationMinutes) * 100);
  }, [nowMinute]);

  const cards = useMemo(() => {
    if (!current) return todays;
    const index = todays.indexOf(current);
    return index >= 0 ? todays.slice(index) : todays;
  }, [todays, current]);

  const toggles = CHANNEL_TOGGLES.filter((toggle) => plan.channels?.[toggle.id]);
  const detailBullets = activeChannel && current
    ? current[CHANNEL_TOGGLES.find((toggle) => toggle.id === activeChannel)?.field] || []
    : [];

  const handleChip = useCallback((activity) => {
    touch();
    if (activity.id === clockCurrent?.id) {
      setOverrideId(null);
      overrideBaseRef.current = null;
      return;
    }
    setOverrideId(activity.id);
    overrideBaseRef.current = clockCurrent?.id || null;
  }, [clockCurrent, touch]);

  const handleToggle = useCallback((channelId) => {
    touch();
    setActiveChannel((currentChannel) => (currentChannel === channelId ? null : channelId));
  }, [touch]);

  // Timeline geometry for the expanded view.
  const span = useMemo(() => {
    if (!todays.length) return { start: 0, end: 1 };
    const start = plan.window?.startMinute ?? Math.min(...todays.map((activity) => activity.startMinute));
    const end = plan.window?.endMinute
      ?? Math.max(...todays.map((activity) => activity.startMinute + activity.durationMinutes));
    return { start, end: Math.max(end, start + 30) };
  }, [todays, plan.window]);
  const spanPct = useCallback(
    (minute) => `${Math.min(100, Math.max(0, ((minute - span.start) / (span.end - span.start)) * 100))}%`,
    [span],
  );

  const hueClass = (index) => `bzf-hue-${Math.min(2, Math.floor(index / 2))}`;

  const renderCard = (activity, index, { removable = false } = {}) => {
    if (activity.kind === 'break') {
      return (
        <div key={activity.id} className="bzf-card break" title={`${activity.durationMinutes}m break`}>
          <span className="bzf-card-break-label">break</span>
          <span className="bzf-card-duration">{activity.durationMinutes}m</span>
          {removable && (
            <button
              type="button"
              className="bzf-card-remove"
              onClick={() => { touch(); onRemoveActivity(activity.id); }}
              title="Remove break"
            >✕</button>
          )}
        </div>
      );
    }
    const isCurrent = activity.id === current?.id;
    const isDone = progressOf(activity) >= 100 && !isCurrent;
    return (
      <div
        key={activity.id}
        className={`bzf-card ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''} ${hueClass(index)}`}
      >
        <div className="bzf-card-top">
          <span className="bzf-card-time">{fmtShort(activity.startMinute)}</span>
          <span className="bzf-card-duration">{activity.durationMinutes}<sup>m</sup></span>
        </div>
        <div className="bzf-card-title">{activity.title}</div>
        {removable && (
          <button
            type="button"
            className="bzf-card-remove"
            onClick={() => { touch(); onRemoveActivity(activity.id); }}
            title="Remove from plan"
          >✕</button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`priorifact ${expanded ? 'expanded' : ''}`}
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
              className={`bzf-flow-action ${calendarComplete ? 'complete' : ''}`}
              onClick={() => { touch(); onAddToCalendar(); }}
              disabled={calendarComplete || calendarStatus === 'working'}
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
              disabled={flowSaved || saveFlowStatus === 'working'}
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
            const isInProgress = isCurrent
              && activity.startMinute <= nowMinute
              && nowMinute < activity.startMinute + activity.durationMinutes;
            return (
              <button
                key={activity.id}
                type="button"
                className={`bzf-chip ${isCurrent ? 'current' : ''} ${isInProgress ? 'in-progress' : ''} ${progressOf(activity) >= 100 && !isCurrent ? 'done' : ''}`}
                onClick={() => handleChip(activity)}
                title={isCurrent ? `${activity.title} · ${remainLabel}` : `Jump to ${activity.title}`}
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
                  disabled={extensionLimitReached || extensionWorking}
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
              disabled={!current}
            >
              add break
            </button>
            <span className="priorifact-header-sep">•</span>
            {expanded ? (
              <>
                <button type="button" className="priorifact-header-btn" onClick={() => { touch(); onChangePlan(); }}>
                  change plan
                </button>
                <span className="priorifact-header-sep">•</span>
                <button type="button" className="priorifact-header-btn danger" onClick={onEndPlan}>
                  end plan
                </button>
                <button
                  type="button"
                  className="priorifact-header-btn collapse"
                  onClick={() => { touch(); setExpanded(false); }}
                >
                  done
                </button>
              </>
            ) : (
              <button type="button" className="priorifact-header-btn" onClick={() => { touch(); setExpanded(true); }}>
                view/edit plan
              </button>
            )}
          </div>
          {actionError && <div className="bzf-action-error" role="status">{actionError}</div>}

          {done ? (
            <div className="priorifact-done">
              <span>priorifact complete</span>
              <button type="button" className="priorifact-header-btn" onClick={() => { touch(); onChangePlan(); }}>
                new plan
              </button>
              <button type="button" className="priorifact-header-btn danger" onClick={onEndPlan}>
                clear
              </button>
            </div>
          ) : expanded ? (
            <>
              <div className="bzf-timeline">
                <div className="bzf-timeline-track" />
                <div className="bzf-timeline-progress" style={{ width: spanPct(nowMinute) }} />
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
              {plan.summary && <div className="priorifact-summary">{plan.summary}</div>}
              <div className="bzf-cards editing">
                {todays.map((activity, index) => renderCard(activity, index, { removable: true }))}
              </div>
            </>
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
    </div>
  );
}

export default Priorifact;
