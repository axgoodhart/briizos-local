import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDateYMD } from '../../lib/dates';
import { eventOccursOnDate } from '../../lib/recurrence';
import logger from '../../lib/logger';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

// Timeline span for the time-range step; end-of-day default is 10pm.
const DAY_START = 6 * 60;
const DAY_END = 23 * 60;
const DAY_SPAN = DAY_END - DAY_START;
const SNAP = 15;
const MIN_WINDOW = 30;
const DEFAULT_END = 22 * 60;

const CHANNEL_DEFS = [
  { id: 'schedule', label: 'with schedule' },
  { id: 'preparation', label: 'with preparation' },
  { id: 'steps', label: 'with steps' },
  { id: 'support', label: 'with support' },
];

// The stepper's four views, in order. STEP_WINDOW is skipped when
// briizify picks the time itself.
const STEP_SETUP = 1;
const STEP_WINDOW = 2;
const STEP_CANDIDATES = 3;
const STEP_EXTRAS = 4;

const STEP_DEFS = [
  { id: STEP_SETUP, label: 'timeframe & annotation channels' },
  { id: STEP_WINDOW, label: 'time range' },
  { id: STEP_CANDIDATES, label: 'Islands & tasks' },
  { id: STEP_EXTRAS, label: 'custom input & detail' },
];

function nowMinute() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function fmtClock(minute) {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const display = hours % 12 || 12;
  return `${display}:${String(mins).padStart(2, '0')}${hours < 12 ? 'am' : 'pm'}`;
}

// Two-part clock for the range handle pills — the meridiem sits on its
// own line so both pills keep the same compact width.
function clockParts(minute) {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return {
    time: `${hours % 12 || 12}:${String(mins).padStart(2, '0')}`,
    meridiem: hours < 12 ? 'AM' : 'PM',
  };
}

function fmtHours(minutes) {
  return `${(Math.max(0, minutes) / 60).toFixed(1)}h`;
}

function snap(minute) {
  return Math.round(minute / SNAP) * SNAP;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return formatDateYMD(new Date(y, m - 1, d + days));
}

/**
 * briizify request setup — a four-view stepper. Exactly one view (and
 * exactly one primary action) is on screen at a time:
 *   1. timeframe + annotation channels ("pick time for me" skips view 2)
 *   2. time range on a horizontal day timeline
 *   3. candidates (Island projects + Tasks)
 *   4. exogenous input + detail preference → FINISHED fires the AI
 * The header pips walk back to any view already reached; the footer
 * carries back on the left and PROCEED / FINISHED on the right.
 */
function BriizifySetup({ organizerItems, status, question, error, onGenerate, onAnswer, onCancel }) {
  const [step, setStep] = useState(STEP_SETUP);
  const [reached, setReached] = useState(STEP_SETUP);
  const [timeframe, setTimeframe] = useState('today');
  const [pickTimeForMe, setPickTimeForMe] = useState(false);
  const [channels, setChannels] = useState({ schedule: true, preparation: true, steps: true, support: true });
  const [winStart, setWinStart] = useState(() => Math.min(Math.max(snap(nowMinute() + SNAP), DAY_START), DEFAULT_END - MIN_WINDOW));
  const [winEnd, setWinEnd] = useState(DEFAULT_END);
  const [candidates, setCandidates] = useState([]);
  const [candidateState, setCandidateState] = useState('loading');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [customItems, setCustomItems] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [askForDetails, setAskForDetails] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [draggingHandle, setDraggingHandle] = useState(null);

  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const rangeRef = useRef({ start: winStart, end: winEnd });
  const stageRef = useRef(null);

  rangeRef.current = { start: winStart, end: winEnd };

  // Each view starts at its own top — the drawer itself never scrolls,
  // so the single PROCEED can never slide out of sight.
  useEffect(() => {
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }, [step]);

  const today = useMemo(() => formatDateYMD(new Date()), []);
  const rangeEnd = useMemo(() => (timeframe === 'this_week' ? addDays(today, 6) : today), [timeframe, today]);

  // Island projects + open tasks for the candidate grid.
  useEffect(() => {
    let active = true;
    (async () => {
      setCandidateState('loading');
      try {
        const [islandState, tasks] = await Promise.all([
          api.islandLoadState?.(),
          api.localData?.tasks?.list({ limit: 500 }),
        ]);
        if (!active) return;
        const projects = (islandState?.projects || []).map((project) => ({
          key: `project:${project.id}`,
          kind: 'project',
          id: project.id,
          label: project.name || 'Untitled Project',
          deadline: project.deadline || null,
          importance: project.importance ?? null,
          size: project.size ?? null,
          relevance: project.relevance || null,
          openMilestones: (project.milestones || [])
            .filter((milestone) => !milestone.completed)
            .map((milestone) => milestone.label || milestone.name || milestone.title)
            .filter(Boolean),
        })).sort((a, b) => a.label.localeCompare(b.label));
        const openTasks = (tasks || [])
          .filter((task) => !['completed', 'cancelled'].includes(task.status))
          .map((task) => ({
            key: `task:${task.id}`,
            kind: 'task',
            id: task.id,
            label: task.title || 'Untitled Task',
            description: task.description || '',
            priority: task.priority || 'normal',
            dueAt: task.due_at == null
              ? null
              : typeof task.due_at === 'number' ? new Date(task.due_at).toISOString() : task.due_at,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setCandidates([...projects, ...openTasks]);
        setCandidateState('ready');
      } catch (loadError) {
        if (!active) return;
        setCandidateState('error');
        logger.error('tasks.briizify', 'briizify setup could not load candidates', { error: loadError?.message });
      }
    })();
    return () => { active = false; };
  }, []);

  // Scheduled task placements over the requested range.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await api.localData?.placements?.list({ dateFrom: today, dateTo: rangeEnd, limit: 500 });
        if (active) setPlacements(rows || []);
      } catch (loadError) {
        if (active) setPlacements([]);
        logger.warn('tasks.briizify', 'briizify setup could not load scheduled tasks', { error: loadError?.message });
      }
    })();
    return () => { active = false; };
  }, [today, rangeEnd]);

  // Existing calendar blocks, per date in scope, for the prompt and the timeline.
  const existingSchedule = useMemo(() => {
    const blocks = [];
    const days = timeframe === 'this_week' ? 7 : 1;
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(today, offset);
      (organizerItems || []).forEach((item) => {
        if (item.type !== 'event' || !eventOccursOnDate(item, date)) return;
        blocks.push({
          kind: 'event',
          title: item.name || item.title || 'event',
          date,
          startMinute: item.start ?? 0,
          durationMinutes: item.duration || 60,
        });
      });
    }
    placements.forEach((placement) => {
      blocks.push({
        kind: 'task',
        title: placement.task?.title || 'scheduled task',
        date: placement.occurrence_date,
        startMinute: placement.start_minute,
        durationMinutes: placement.duration_minutes,
      });
    });
    return blocks.sort((a, b) => (a.date === b.date ? a.startMinute - b.startMinute : a.date < b.date ? -1 : 1));
  }, [organizerItems, placements, timeframe, today]);

  const todayBlocks = useMemo(
    () => existingSchedule.filter((block) => block.date === today),
    [existingSchedule, today],
  );

  const windowStats = useMemo(() => {
    const length = winEnd - winStart;
    let blocked = 0;
    todayBlocks.forEach((block) => {
      const start = Math.max(block.startMinute, winStart);
      const end = Math.min(block.startMinute + block.durationMinutes, winEnd);
      if (end > start) blocked += end - start;
    });
    return { length, blocked, available: Math.max(0, length - blocked) };
  }, [todayBlocks, winStart, winEnd]);

  // ── horizontal range drag ─────────────────────────────────────
  const minuteFromPointer = useCallback((clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(DAY_START + ratio * DAY_SPAN);
  }, []);

  const setHandleMinute = useCallback((which, minute) => {
    if (minute == null) return;
    const range = rangeRef.current;
    if (which === 'start') {
      const next = Math.min(Math.max(snap(minute), DAY_START), range.end - MIN_WINDOW);
      rangeRef.current = { ...range, start: next };
      setWinStart(next);
      return;
    }
    const next = Math.max(Math.min(snap(minute), DAY_END), range.start + MIN_WINDOW);
    rangeRef.current = { ...range, end: next };
    setWinEnd(next);
  }, []);

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setHandleMinute(drag.which, minuteFromPointer(event.clientX - drag.offsetX));
  }, [minuteFromPointer, setHandleMinute]);

  const stopDrag = useCallback((event) => {
    if (!dragRef.current || (event?.pointerId != null && dragRef.current.pointerId !== event.pointerId)) return;
    dragRef.current = null;
    setDraggingHandle(null);
  }, []);

  // Pointer down anywhere on the track grabs whichever boundary is
  // nearer, so the bars can be dragged and the track can be aimed at.
  const startDrag = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    event.preventDefault();

    const handleX = (minute) => rect.left + ((minute - DAY_START) / DAY_SPAN) * rect.width;
    const startX = handleX(rangeRef.current.start);
    const endX = handleX(rangeRef.current.end);
    const startDistance = Math.abs(event.clientX - startX);
    const endDistance = Math.abs(event.clientX - endX);
    const which = startDistance <= endDistance ? 'start' : 'end';
    const boundaryX = which === 'start' ? startX : endX;
    // Grabbing a bar keeps its offset; aiming at open track jumps to the pointer.
    const grabbing = Math.min(startDistance, endDistance) <= 14;

    dragRef.current = {
      which,
      pointerId: event.pointerId,
      offsetX: grabbing ? event.clientX - boundaryX : 0,
    };
    setDraggingHandle(which);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (!grabbing) setHandleMinute(which, minuteFromPointer(event.clientX));
  }, [minuteFromPointer, setHandleMinute]);

  const handleHandleKeyDown = useCallback((which) => (event) => {
    const current = which === 'start' ? rangeRef.current.start : rangeRef.current.end;
    const stepSize = event.shiftKey ? 60 : SNAP;
    let next = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - stepSize;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + stepSize;
    if (event.key === 'PageDown') next = current - 60;
    if (event.key === 'PageUp') next = current + 60;
    if (event.key === 'Home') next = DAY_START;
    if (event.key === 'End') next = DAY_END;
    if (next == null) return;
    event.preventDefault();
    event.stopPropagation();
    setHandleMinute(which, next);
  }, [setHandleMinute]);

  // ── stepper navigation ────────────────────────────────────────
  const skipsWindow = pickTimeForMe;

  const nextOf = useCallback((current) => {
    if (current === STEP_SETUP) return skipsWindow ? STEP_CANDIDATES : STEP_WINDOW;
    if (current === STEP_WINDOW) return STEP_CANDIDATES;
    if (current === STEP_CANDIDATES) return STEP_EXTRAS;
    return current;
  }, [skipsWindow]);

  const prevOf = useCallback((current) => {
    if (current === STEP_EXTRAS) return STEP_CANDIDATES;
    if (current === STEP_CANDIDATES) return skipsWindow ? STEP_SETUP : STEP_WINDOW;
    if (current === STEP_WINDOW) return STEP_SETUP;
    return current;
  }, [skipsWindow]);

  const busy = status === 'thinking';

  const advance = useCallback(() => {
    const next = nextOf(step);
    setStep(next);
    setReached((high) => Math.max(high, next));
  }, [nextOf, step]);

  const goBack = useCallback(() => setStep((current) => prevOf(current)), [prevOf]);

  const goTo = useCallback((target) => {
    if (busy || target > reached) return;
    if (target === STEP_WINDOW && skipsWindow) return;
    setStep(target);
  }, [busy, reached, skipsWindow]);

  const toggleKey = useCallback((key) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const addCustomItem = useCallback(() => {
    const value = customInput.trim();
    if (!value) return;
    setCustomItems((current) => (current.includes(value) ? current : [...current, value]));
    setCustomInput('');
  }, [customInput]);

  const pickedCount = selectedKeys.size + customItems.length;

  const submit = useCallback(() => {
    if (!pickedCount || busy) return;
    const picked = candidates
      .filter((candidate) => selectedKeys.has(candidate.key))
      .map((candidate) => (candidate.kind === 'project'
        ? {
          type: 'island_project',
          id: candidate.id,
          name: candidate.label,
          deadline: candidate.deadline,
          importance: candidate.importance,
          size: candidate.size,
          relevance: candidate.relevance,
          openMilestones: candidate.openMilestones,
        }
        : {
          type: 'task',
          id: candidate.id,
          title: candidate.label,
          description: candidate.description,
          priority: candidate.priority,
          dueAt: candidate.dueAt,
        }));
    onGenerate({
      date: today,
      nowMinute: nowMinute(),
      timeframe,
      window: { startMinute: winStart, endMinute: winEnd },
      pickTimeForMe,
      channels,
      candidates: picked,
      customItems,
      askForDetails,
      existingSchedule,
    });
  }, [pickedCount, busy, candidates, selectedKeys, onGenerate, today, timeframe, winStart, winEnd, pickTimeForMe, channels, customItems, askForDetails, existingSchedule]);

  const projectChips = candidates.filter((candidate) => candidate.kind === 'project');
  const taskChips = candidates.filter((candidate) => candidate.kind === 'task');

  const pct = (minute) => `${((minute - DAY_START) / DAY_SPAN) * 100}%`;

  // Start/End captions ride under their bar, but snap flush at the ends
  // of the day so they are never clipped by the drawer edge.
  const capStyle = (minute) => {
    const ratio = (minute - DAY_START) / DAY_SPAN;
    if (ratio <= 0.045) return { left: 0, transform: 'none' };
    if (ratio >= 0.955) return { left: 'auto', right: 0, transform: 'none' };
    return { left: `${ratio * 100}%` };
  };

  const startPill = clockParts(winStart);
  const endPill = clockParts(winEnd);

  const activeChannels = CHANNEL_DEFS.filter((channel) => channels[channel.id]);

  // The footer's single primary action, per view.
  const action = step === STEP_EXTRAS
    ? {
      label: busy ? 'briizifying…' : 'FINISHED',
      onClick: submit,
      disabled: !pickedCount,
      hint: pickedCount ? null : 'pick at least one option',
    }
    : {
      label: 'PROCEED',
      onClick: advance,
      disabled: false,
      hint: step === STEP_CANDIDATES && !pickedCount ? 'or add your own next' : null,
    };

  const renderHandle = (which) => {
    const minute = which === 'start' ? winStart : winEnd;
    const pill = which === 'start' ? startPill : endPill;
    return (
      <button
        type="button"
        className={`bzf-range-handle ${which} ${draggingHandle === which ? 'is-dragging' : ''}`}
        style={{ left: pct(minute) }}
        onKeyDown={handleHandleKeyDown(which)}
        role="slider"
        aria-label={which === 'start' ? 'Start time' : 'End time'}
        aria-orientation="horizontal"
        aria-valuemin={which === 'start' ? DAY_START : winStart + MIN_WINDOW}
        aria-valuemax={which === 'start' ? winEnd - MIN_WINDOW : DAY_END}
        aria-valuenow={minute}
        aria-valuetext={fmtClock(minute)}
        title={`Drag to change ${which === 'start' ? 'start' : 'end'} time; arrow keys adjust by 15 minutes`}
      >
        <span className="bzf-range-pill">
          <b>{pill.time}</b>
          <i>{pill.meridiem}</i>
        </span>
      </button>
    );
  };

  return (
    <div className="bzf-drawer" data-busy={busy ? 'true' : 'false'} data-step={step}>
      <div className="bzf-drawer-head">
        <span className="briizify-logo">briizify</span>
        {status !== 'clarifying' && (
          <div className="bzf-steps" role="group" aria-label="briizify setup steps">
            {STEP_DEFS.map((def, index) => {
              const skipped = def.id === STEP_WINDOW && skipsWindow;
              const state = skipped ? 'skipped' : def.id === step ? 'active' : def.id < step ? 'done' : 'ahead';
              return (
                <button
                  key={def.id}
                  type="button"
                  className={`bzf-pip ${state}`}
                  onClick={() => goTo(def.id)}
                  disabled={skipped || def.id > reached || busy}
                  aria-current={def.id === step ? 'step' : undefined}
                  aria-label={`step ${index + 1} · ${def.label}${skipped ? ' · skipped' : ''}`}
                  title={`${def.label}${skipped ? ' · skipped' : ''}`}
                >
                  <span className="bzf-pip-fill" />
                </button>
              );
            })}
          </div>
        )}
        <button type="button" className="bzf-close" onClick={onCancel} title="Close briizify setup">✕</button>
      </div>

      {status === 'clarifying' ? (
        <div className="bzf-clarify">
          <div className="bzf-clarify-question">{question}</div>
          <form
            className="bzf-clarify-form"
            onSubmit={(event) => {
              event.preventDefault();
              const value = answerText.trim();
              if (!value) return;
              setAnswerText('');
              onAnswer(value);
            }}
          >
            <input
              type="text"
              className="bzf-input"
              placeholder="Your answer…"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              autoFocus
            />
            <button type="submit" className="bzf-proceed" disabled={!answerText.trim()}>→</button>
          </form>
        </div>
      ) : (
        <>
          <div className="bzf-stage" ref={stageRef}>
            {/* 1 · timeframe + annotation channels */}
            {step === STEP_SETUP && (
              <div className="bzf-step bzf-step-setup" key="setup" role="group" aria-label="Timeframe and annotation channels">
                <div className="bzf-setup-grid">
                  <div className="bzf-timeframe">
                    <div className="bzf-row">
                      {['today', 'this_week'].map((frame) => (
                        <button
                          key={frame}
                          type="button"
                          className={`bzf-frame-chip ${timeframe === frame ? 'active' : ''}`}
                          onClick={() => setTimeframe(frame)}
                        >
                          {frame === 'today' ? 'today' : 'this week'}
                        </button>
                      ))}
                    </div>
                    <label className="bzf-check">
                      <input
                        type="checkbox"
                        checked={pickTimeForMe}
                        onChange={(event) => setPickTimeForMe(event.target.checked)}
                      />
                      pick time for me
                    </label>
                  </div>

                  <div className="bzf-channels">
                    {CHANNEL_DEFS.map((channel) => (
                      <label key={channel.id} className="bzf-channel">
                        <span className="bzf-channel-label">{channel.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={channels[channel.id]}
                          aria-label={channel.label}
                          className={`bzf-switch ${channels[channel.id] ? 'on' : ''}`}
                          onClick={() => setChannels((current) => ({ ...current, [channel.id]: !current[channel.id] }))}
                        >
                          <span className="bzf-switch-knob">{channels[channel.id] ? 'ON' : 'OFF'}</span>
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2 · time range on a horizontal day timeline */}
            {step === STEP_WINDOW && (
              <div className="bzf-step bzf-step-range" key="range" role="group" aria-label="Time range">
                <div className="bzf-range" data-tight={winEnd - winStart < 210 ? 'true' : 'false'}>
                  <div
                    className="bzf-range-track"
                    ref={trackRef}
                    onPointerDown={startDrag}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                    onLostPointerCapture={stopDrag}
                  >
                    <div className="bzf-range-canvas">
                      {todayBlocks.map((block, index) => (
                        <div
                          key={`${block.title}-${index}`}
                          className="bzf-range-block"
                          style={{
                            left: pct(Math.max(block.startMinute, DAY_START)),
                            width: `${(Math.min(block.durationMinutes, DAY_END - block.startMinute) / DAY_SPAN) * 100}%`,
                          }}
                          title={`${block.title} · ${fmtClock(block.startMinute)}`}
                        />
                      ))}
                      <div
                        className="bzf-range-selection"
                        style={{ left: pct(winStart), width: `${((winEnd - winStart) / DAY_SPAN) * 100}%` }}
                      >
                        <span className="bzf-range-hours">{fmtHours(windowStats.available)}</span>
                      </div>
                    </div>
                    {renderHandle('start')}
                    {renderHandle('end')}
                  </div>
                  <div className="bzf-range-caps">
                    <span className="bzf-range-cap" style={capStyle(winStart)}>Start</span>
                    <span className="bzf-range-cap" style={capStyle(winEnd)}>End</span>
                  </div>
                  <div className="bzf-range-foot">
                    <span className="bzf-range-hint">drag the bars · arrow keys fine-tune</span>
                    <span className="bzf-range-sub">
                      free of {fmtHours(windowStats.length)} · {fmtHours(windowStats.blocked)} booked
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3 · candidates */}
            {step === STEP_CANDIDATES && (
              <div className="bzf-step bzf-step-options" key="options" role="group" aria-label="Islands and tasks">
                <div className="bzf-source-label">ISLANDS</div>
                {candidateState === 'loading' && <div className="bzf-muted">Reading Islands…</div>}
                {candidateState === 'error' && <div className="bzf-muted">Could not load candidates.</div>}
                <div className="bzf-chip-grid">
                  {projectChips.map((candidate) => (
                    <button
                      key={candidate.key}
                      type="button"
                      className={`bzf-candidate ${selectedKeys.has(candidate.key) ? 'selected' : ''}`}
                      onClick={() => toggleKey(candidate.key)}
                      aria-pressed={selectedKeys.has(candidate.key)}
                    >
                      {selectedKeys.has(candidate.key) && <span className="bzf-candidate-badge">I</span>}
                      {candidate.label}
                    </button>
                  ))}
                  {candidateState === 'ready' && projectChips.length === 0 && (
                    <span className="bzf-muted">No islands.</span>
                  )}
                </div>

                <div className="bzf-source-label">TASKS</div>
                <div className="bzf-chip-grid">
                  {taskChips.map((candidate) => (
                    <button
                      key={candidate.key}
                      type="button"
                      className={`bzf-candidate task ${selectedKeys.has(candidate.key) ? 'selected' : ''}`}
                      onClick={() => toggleKey(candidate.key)}
                      aria-pressed={selectedKeys.has(candidate.key)}
                    >
                      {selectedKeys.has(candidate.key) && <span className="bzf-candidate-badge">T</span>}
                      {candidate.label}
                    </button>
                  ))}
                  {candidateState === 'ready' && taskChips.length === 0 && (
                    <span className="bzf-muted">No open tasks.</span>
                  )}
                </div>
              </div>
            )}

            {/* 4 · exogenous input + detail preference */}
            {step === STEP_EXTRAS && (
              <div className="bzf-step bzf-step-extras" key="extras" role="group" aria-label="Custom input and detail preference">
                <div className="bzf-exogenous">
                  <input
                    type="text"
                    className="bzf-input"
                    placeholder="EXOGENOUS OPTIONS (USER CUSTOM INPUT)"
                    value={customInput}
                    onChange={(event) => setCustomInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCustomItem();
                      }
                    }}
                  />
                  <button type="button" className="bzf-mini-btn" onClick={addCustomItem} disabled={!customInput.trim()}>+</button>
                </div>
                {customItems.length > 0 && (
                  <div className="bzf-chip-grid">
                    {customItems.map((item) => (
                      <span key={item} className="bzf-candidate custom selected">
                        {item}
                        <button
                          type="button"
                          className="bzf-candidate-remove"
                          onClick={() => setCustomItems((current) => current.filter((entry) => entry !== item))}
                          title="Remove"
                        >✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <label className="bzf-check">
                  <input
                    type="checkbox"
                    checked={askForDetails}
                    onChange={(event) => setAskForDetails(event.target.checked)}
                  />
                  ask for more details (otherwise AI infers)
                </label>

                <div className="bzf-recap">
                  <span>{timeframe === 'this_week' ? 'this week' : 'today'}</span>
                  <span>{pickTimeForMe ? 'briizify picks the time' : `${fmtClock(winStart)} – ${fmtClock(winEnd)}`}</span>
                  <span>{pickedCount} {pickedCount === 1 ? 'option' : 'options'}</span>
                  <span>{activeChannels.length ? activeChannels.map((channel) => channel.id).join(' · ') : 'no annotations'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bzf-actions">
            {step > STEP_SETUP ? (
              <button type="button" className="bzf-back" onClick={goBack} disabled={busy}>‹ back</button>
            ) : <span />}
            <span className="bzf-proceed-slot">
              {action.hint && <span className="bzf-proceed-hint">{action.hint}</span>}
              <button
                type="button"
                className="bzf-proceed"
                onClick={action.onClick}
                disabled={action.disabled || busy}
              >
                {action.label}
              </button>
            </span>
          </div>
        </>
      )}

      {busy && <div className="bzf-thinking">briizifying<span className="bzf-dots" /></div>}
      {error && <div className="bzf-error">{error}</div>}
    </div>
  );
}

export default BriizifySetup;
