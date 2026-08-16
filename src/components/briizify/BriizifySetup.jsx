import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDateYMD } from '../../lib/dates';
import { eventOccursOnDate } from '../../lib/recurrence';
import logger from '../../lib/logger';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

// miniCal span for the time-range picker; end-of-day default is 10pm.
const DAY_START = 6 * 60;
const DAY_END = 23 * 60;
const SNAP = 15;
const MIN_WINDOW = 30;
const DEFAULT_END = 22 * 60;

const CHANNEL_DEFS = [
  { id: 'schedule', label: 'with schedule' },
  { id: 'preparation', label: 'with preparation' },
  { id: 'steps', label: 'with steps' },
  { id: 'support', label: 'with support' },
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
 * briizify request setup — four sections, exactly one PROCEED on
 * screen at a time:
 *   1. timeframe (today / this week, optional "pick time for me")
 *   2. annotation channels
 *   3. time range on a miniCal (skipped when briizify picks the time)
 *   4. candidates (Forest + Tasks + exogenous input) → PROCEED fires the AI
 */
function BriizifySetup({ organizerItems, status, question, error, onGenerate, onAnswer, onCancel }) {
  const [step, setStep] = useState(1);
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

  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const drawerRef = useRef(null);

  // Keep the active section (and its PROCEED) visible as steps advance —
  // the drawer scrolls, and the single on-screen PROCEED must never hide.
  useEffect(() => {
    const active = drawerRef.current?.querySelector('.bzf-sec.active');
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [step]);

  const today = useMemo(() => formatDateYMD(new Date()), []);
  const rangeEnd = useMemo(() => (timeframe === 'this_week' ? addDays(today, 6) : today), [timeframe, today]);

  // Forest projects + open tasks for the candidate grid.
  useEffect(() => {
    let active = true;
    (async () => {
      setCandidateState('loading');
      try {
        const [forestState, tasks] = await Promise.all([
          api.forestLoadState?.(),
          api.localData?.tasks?.list({ limit: 500 }),
        ]);
        if (!active) return;
        const projects = (forestState?.projects || []).map((project) => ({
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

  // Existing calendar blocks, per date in scope, for the prompt and the miniCal.
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

  // ── miniCal drag handles ──────────────────────────────────────
  const minuteFromPointer = useCallback((clientY) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return snap(DAY_START + ratio * (DAY_END - DAY_START));
  }, []);

  const handlePointerMove = useCallback((event) => {
    const minute = minuteFromPointer(event.clientY);
    if (minute == null || !dragRef.current) return;
    if (dragRef.current === 'start') {
      setWinStart(Math.min(Math.max(minute, DAY_START), winEnd - MIN_WINDOW));
    } else {
      setWinEnd(Math.max(Math.min(minute, DAY_END), winStart + MIN_WINDOW));
    }
  }, [minuteFromPointer, winStart, winEnd]);

  const stopDrag = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [handlePointerMove]);

  const startDrag = useCallback((which) => (event) => {
    event.preventDefault();
    dragRef.current = which;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
  }, [handlePointerMove, stopDrag]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [handlePointerMove, stopDrag]);

  // ── steps ─────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setStep((current) => {
      if (current === 1) return 2;
      if (current === 2) return pickTimeForMe ? 4 : 3;
      if (current === 3) return 4;
      return current;
    });
  }, [pickTimeForMe]);

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
  const busy = status === 'thinking';

  const submit = useCallback(() => {
    if (!pickedCount || busy) return;
    const picked = candidates
      .filter((candidate) => selectedKeys.has(candidate.key))
      .map((candidate) => (candidate.kind === 'project'
        ? {
          type: 'forest_project',
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

  const proceed = (label, onClick, disabled = false, hint = null) => (
    <span className="bzf-proceed-slot">
      {hint && <span className="bzf-proceed-hint">{hint}</span>}
      <button type="button" className="bzf-proceed" onClick={onClick} disabled={disabled || busy}>
        {label}
      </button>
    </span>
  );

  const projectChips = candidates.filter((candidate) => candidate.kind === 'project');
  const taskChips = candidates.filter((candidate) => candidate.kind === 'task');

  const spanMinutes = DAY_END - DAY_START;
  const pct = (minute) => `${((minute - DAY_START) / spanMinutes) * 100}%`;

  return (
    <div className="bzf-drawer" ref={drawerRef} data-busy={busy ? 'true' : 'false'}>
      <div className="bzf-drawer-head">
        <span className="briizify-logo">briizify</span>
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
        <div className="bzf-body">
          {/* 1 · timeframe */}
          <div className={`bzf-sec bzf-sec-timeframe ${step === 1 ? 'active' : ''}`}>
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
            {step === 1 && proceed('PROCEED', advance)}
          </div>

          {/* 2 · annotation channels */}
          <div className={`bzf-sec bzf-sec-channels ${step === 2 ? 'active' : ''}`}>
            <div className="bzf-channels">
              {CHANNEL_DEFS.map((channel) => (
                <label key={channel.id} className="bzf-channel">
                  <span className="bzf-channel-label">{channel.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={channels[channel.id]}
                    className={`bzf-switch ${channels[channel.id] ? 'on' : ''}`}
                    onClick={() => setChannels((current) => ({ ...current, [channel.id]: !current[channel.id] }))}
                  >
                    <span className="bzf-switch-knob">{channels[channel.id] ? 'ON' : 'OFF'}</span>
                  </button>
                </label>
              ))}
            </div>
            {step === 2 && proceed('PROCEED', advance)}
          </div>

          <div className="bzf-main">
            {/* 3 · time range miniCal */}
            {!pickTimeForMe && (
              <div className={`bzf-sec bzf-sec-minical ${step === 3 ? 'active' : ''}`}>
                <div className="bzf-minical-hint">drag sliders to choose time range</div>
                <div className="bzf-minical">
                  <div className="bzf-minical-track" ref={trackRef}>
                    {todayBlocks.map((block, index) => (
                      <div
                        key={`${block.title}-${index}`}
                        className="bzf-minical-block"
                        style={{
                          top: pct(Math.max(block.startMinute, DAY_START)),
                          height: `${(Math.min(block.durationMinutes, DAY_END - block.startMinute) / spanMinutes) * 100}%`,
                        }}
                        title={`${block.title} · ${fmtClock(block.startMinute)}`}
                      />
                    ))}
                    <div
                      className="bzf-minical-selection"
                      style={{ top: pct(winStart), height: `${((winEnd - winStart) / spanMinutes) * 100}%` }}
                    />
                    <button
                      type="button"
                      className="bzf-minical-handle start"
                      style={{ top: pct(winStart) }}
                      onPointerDown={startDrag('start')}
                    >
                      <span>TIME START · {fmtClock(winStart)}</span>
                    </button>
                    <button
                      type="button"
                      className="bzf-minical-handle end"
                      style={{ top: pct(winEnd) }}
                      onPointerDown={startDrag('end')}
                    >
                      <span>TIME END · {fmtClock(winEnd)}</span>
                    </button>
                  </div>
                  <div className="bzf-minical-stats">
                    <span className="bzf-minical-stat-big">{fmtHours(windowStats.available)}</span>
                    <span className="bzf-minical-stat-small">
                      free of {fmtHours(windowStats.length)} · {fmtHours(windowStats.blocked)} booked
                    </span>
                  </div>
                </div>
                {step === 3 && proceed('PROCEED', advance)}
              </div>
            )}

            {/* 4 · candidates */}
            <div className={`bzf-sec bzf-sec-options ${step === 4 ? 'active' : ''}`}>
              <div className="bzf-source-label">FOREST</div>
              {candidateState === 'loading' && <div className="bzf-muted">Reading Forest…</div>}
              {candidateState === 'error' && <div className="bzf-muted">Could not load candidates.</div>}
              <div className="bzf-chip-grid">
                {projectChips.map((candidate) => (
                  <button
                    key={candidate.key}
                    type="button"
                    className={`bzf-candidate ${selectedKeys.has(candidate.key) ? 'selected' : ''}`}
                    onClick={() => toggleKey(candidate.key)}
                  >
                    {selectedKeys.has(candidate.key) && <span className="bzf-candidate-badge">F</span>}
                    {candidate.label}
                  </button>
                ))}
                {candidateState === 'ready' && projectChips.length === 0 && (
                  <span className="bzf-muted">No Forest projects.</span>
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
                  >
                    {selectedKeys.has(candidate.key) && <span className="bzf-candidate-badge">T</span>}
                    {candidate.label}
                  </button>
                ))}
                {candidateState === 'ready' && taskChips.length === 0 && (
                  <span className="bzf-muted">No open tasks.</span>
                )}
              </div>

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
              {step === 4 && proceed(
                busy ? 'briizifying…' : 'PROCEED',
                submit,
                !pickedCount,
                pickedCount ? null : 'pick at least one option',
              )}
            </div>
          </div>
        </div>
      )}

      {busy && <div className="bzf-thinking">briizifying<span className="bzf-dots" /></div>}
      {error && <div className="bzf-error">{error}</div>}
    </div>
  );
}

export default BriizifySetup;
