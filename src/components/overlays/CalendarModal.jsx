import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { formatDateYMD, parseDateYMD } from '../../lib/dates';
import { eventOccursOnDate, buildMonthEventMap } from '../../lib/recurrence';
import { parseCalendarQuickAdd } from '../../lib/calendarQuickAdd';
import { usePlacements } from '../../hooks/usePlacements';
import { useDayPlanner } from '../../hooks/useDayPlanner';
import DayTimeline from '../calendar/DayTimeline';
import AddFromPicker from '../calendar/AddFromPicker';
import logger from '../../lib/logger';
import '../../AppCombined.css';

/**
 * CalendarModal - Monthly grid calendar with daily detail panel
 * Reads events from the shared organizer collection (same data as briizOS-Dev v1).
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarModal({ isOpen, onClose, planningFocus = null, onPlanningFocusHandled }) {
  const { items, addItem, updateItem, toggleDone, removeItem, loading } = useOrganizer();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(() => formatDateYMD(new Date()));
  const [quickAddText, setQuickAddText] = useState('');
  const [addFromOpen, setAddFromOpen] = useState(false);
  const planningFocusKeyRef = useRef(null);
  const planningFocusHandledRef = useRef(onPlanningFocusHandled);

  const monthRange = useMemo(() => ({
    dateFrom: formatDateYMD(new Date(viewYear, viewMonth, 1)),
    dateTo: formatDateYMD(new Date(viewYear, viewMonth + 1, 0)),
  }), [viewYear, viewMonth]);
  const {
    placements,
    isLoading: placementsLoading,
    loadedRange,
    createPlacement,
    updatePlacement,
    archivePlacement,
    setOccurrenceCompleted,
  } = usePlacements(monthRange);

  useEffect(() => {
    planningFocusHandledRef.current = onPlanningFocusHandled;
  }, [onPlanningFocusHandled]);

  // Build event map for current month
  const eventMap = useMemo(() => {
    const map = buildMonthEventMap(items, viewYear, viewMonth);
    placements.forEach((placement) => {
      const existing = map.get(placement.occurrence_date) || [];
      map.set(placement.occurrence_date, [
        ...existing,
        { id: `placement:${placement.id}`, type: 'placement', source: { mode: 'task' } },
      ]);
    });
    return map;
  }, [items, placements, viewYear, viewMonth]);

  // All non-project items for the selected date (events shown in daily panel)
  const selectedDayItems = useMemo(() => {
    // Also include non-event items scheduled on this date
    return items.filter(item => {
      if (item.type === 'project') return false;
      if (item.type === 'event') return eventOccursOnDate(item, selectedDate);
      // For notes/timers, match scheduledDate or due
      return item.scheduledDate === selectedDate || item.due === selectedDate;
    });
  }, [items, selectedDate]);

  const selectedDayPlacements = useMemo(
    () => placements.filter((placement) => placement.occurrence_date === selectedDate),
    [placements, selectedDate],
  );

  const {
    proposals,
    summary: plannerSummary,
    error: plannerError,
    isPlanning,
    planDay,
    acceptProposal,
    rejectProposal,
    clearProposals,
  } = useDayPlanner({
    dateStr: selectedDate,
    events: selectedDayItems,
    placements: selectedDayPlacements,
    createPlacement,
    addItem,
  });

  useEffect(() => {
    clearProposals();
  }, [selectedDate, clearProposals]);

  const selectDay = useCallback((nextDate) => {
    const parsed = parseDateYMD(nextDate);
    setSelectedDate(nextDate);
    if (parsed.getMonth() !== viewMonth || parsed.getFullYear() !== viewYear) {
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    if (!planningFocus?.id) {
      planningFocusKeyRef.current = null;
      return undefined;
    }
    if (!isOpen) return undefined;
    const focusKey = `${planningFocus.type}:${planningFocus.id}`;
    if (planningFocusKeyRef.current === focusKey) return undefined;

    const today = formatDateYMD(new Date());
    if (selectedDate !== today) {
      selectDay(today);
      return undefined;
    }
    const rangeKey = `${monthRange.dateFrom}:${monthRange.dateTo}`;
    if (loading || placementsLoading || loadedRange !== rangeKey) return undefined;

    planningFocusKeyRef.current = focusKey;
    let active = true;
    planDay(planningFocus).finally(() => {
      if (active) planningFocusHandledRef.current?.();
    });
    return () => { active = false; };
  }, [
    isOpen,
    loadedRange,
    loading,
    monthRange.dateFrom,
    monthRange.dateTo,
    placementsLoading,
    planDay,
    planningFocus,
    selectedDate,
    selectDay,
  ]);

  const shiftSelectedDay = useCallback((delta) => {
    const next = parseDateYMD(selectedDate);
    next.setDate(next.getDate() + delta);
    selectDay(formatDateYMD(next));
  }, [selectedDate, selectDay]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (addFromOpen) {
        setAddFromOpen(false);
        return;
      }
      onClose();
      return;
    }
    if (e.target?.closest?.('input, textarea, select')) return;
    // Arrow key navigation
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const current = parseDateYMD(selectedDate);
      const delta = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      }[e.key];
      current.setDate(current.getDate() + delta);
      selectDay(formatDateYMD(current));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const shiftMonth = (delta) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(formatDateYMD(now));
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    const parsed = parseCalendarQuickAdd(quickAddText);
    const startMinutes = parsed.startMinutes ?? 9 * 60;
    const durationMinutes = parsed.durationMinutes ?? 60;

    try {
      await addItem({
        type: 'event',
        name: parsed.title,
        scheduledDate: selectedDate,
        dateValue: selectedDate,
        dateMode: 'event',
        start: startMinutes,
        duration: durationMinutes,
        end: startMinutes + durationMinutes,
      });
      logger.info('calendar.event', 'Quick event added', {
        date: selectedDate,
        startMinute: startMinutes,
        durationMinutes,
      });
      setQuickAddText('');
    } catch (error) {
      logger.error('ui', 'Failed to add event', error?.message);
    }
  };

  const handleScheduleTask = useCallback(async (task, placement) => (
    createPlacement({ ...placement, refType: 'task', refId: task.id })
  ), [createPlacement]);

  const handlePromoteForestSource = useCallback(async (source, placement) => {
    const existing = await window.api.localData.tasks.list({ sourceKey: source.sourceKey, limit: 1 });
    let task = existing?.[0] || null;
    if (!task) {
      const milestone = source.milestone;
      const dueAt = milestone?.date ? new Date(`${milestone.date}T00:00:00`).getTime() : null;
      const created = await window.api.localData.tasks.create({
        title: source.title,
        description: milestone?.description
          || `Island work from ${source.project.name}`,
        status: 'pending',
        priority: 'normal',
        dueAt,
        forestProjectId: source.project.id,
        sourceKey: source.sourceKey,
      });
      task = created.row;
      logger.info('calendar.placement', 'Island work promoted to a task', {
        taskId: task.id,
        forestProjectId: source.project.id,
        milestoneId: milestone?.id || null,
      });
    }
    return createPlacement({ ...placement, refType: 'task', refId: task.id });
  }, [createPlacement]);

  const handleAcceptProposal = useCallback((proposal) => (
    acceptProposal(proposal, { promoteForestSource: handlePromoteForestSource })
  ), [acceptProposal, handlePromoteForestSource]);

  const handleCompleteTask = useCallback(async (task) => {
    const current = await window.api.localData.tasks.get(task.id);
    if (!current || current.status === 'completed') return;
    await window.api.localData.tasks.update(current.id, current.revision, { status: 'completed' });
    logger.info('calendar.placement', 'Whole task completed from Calendar', { taskId: task.id });
  }, []);

  const openPlannerChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent('briizos-open-planner-chat', {
      detail: { date: selectedDate },
    }));
    logger.info('agent.planner', 'Planner chat requested', { date: selectedDate });
  }, [selectedDate]);

  // Build grid cells
  const gridCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const todayStr = formatDateYMD(new Date());
    const cells = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day, isPad: true, dateStr: formatDateYMD(new Date(py, pm, day)) });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateYMD(new Date(viewYear, viewMonth, d));
      cells.push({
        day: d,
        isPad: false,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing padding to fill 6 rows
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1;
      const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: i, isPad: true, dateStr: formatDateYMD(new Date(ny, nm, i)) });
    }

    return cells;
  }, [viewYear, viewMonth]);

  if (!isOpen) return null;

  return (
    <div
      className="calendar-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
        {/* Header */}
        <div className="calendar-header">
          <h2 className="calendar-title" id="calendar-title">Calendar</h2>
          <div className="calendar-header-actions">
            <span className="items-count">
              {selectedDayItems.length + selectedDayPlacements.length} block{selectedDayItems.length + selectedDayPlacements.length !== 1 ? 's' : ''} on {selectedDate}
            </span>
            <button className="calendar-close-btn" onClick={onClose} aria-label="Close Calendar">×</button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => shiftMonth(-1)}>←</button>
          <span className="current-date">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button className="nav-btn" onClick={() => shiftMonth(1)}>→</button>
          <button className="nav-btn today" onClick={goToToday}>Today</button>
        </div>

        {/* Main Content: Grid + Daily Panel */}
        <div className="calendar-content">
          {loading || placementsLoading ? (
            <div className="calendar-loading">Loading...</div>
          ) : (
            <div className="cal-split-layout">
              {/* Monthly Grid */}
              <div className="cal-grid-container">
                <div className="cal-grid">
                  {/* Day headers */}
                  {DAY_HEADERS.map(h => (
                    <div key={h} className="cal-dayheader">{h}</div>
                  ))}

                  {/* Day cells */}
                  {gridCells.map((cell, idx) => {
                    const cellEvents = eventMap.get(cell.dateStr) || [];
                    return (
                      <CalendarCell
                        key={idx}
                        day={cell.day}
                        isPad={cell.isPad}
                        isToday={cell.isToday}
                        isSelected={cell.dateStr === selectedDate}
                        events={cellEvents}
                        onClick={() => selectDay(cell.dateStr)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Daily Detail Panel */}
              <div className="cal-daily-panel">
                <DailyPanel
                  dateStr={selectedDate}
                  items={selectedDayItems}
                  placements={selectedDayPlacements}
                  proposals={proposals}
                  plannerSummary={plannerSummary}
                  plannerError={plannerError}
                  isPlanning={isPlanning}
                  onPreviousDay={() => shiftSelectedDay(-1)}
                  onToday={goToToday}
                  onNextDay={() => shiftSelectedDay(1)}
                  onAddFrom={() => setAddFromOpen(true)}
                  onPlanDay={planDay}
                  onOpenPlannerChat={openPlannerChat}
                  onToggleOrganizer={toggleDone}
                  onUpdateOrganizer={updateItem}
                  onRemoveOrganizer={removeItem}
                  onCompletePlacement={setOccurrenceCompleted}
                  onUpdatePlacement={updatePlacement}
                  onArchivePlacement={archivePlacement}
                  onCompleteTask={handleCompleteTask}
                  onAcceptProposal={handleAcceptProposal}
                  onRejectProposal={rejectProposal}
                />
              </div>
            </div>
          )}

          {/* Quick Add */}
          <div className="quick-add">
            <input
              type="text"
              className="quick-add-input"
              placeholder="Quick add: 9am 90m Rehearse set…"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button className="quick-add-btn" onClick={handleQuickAdd}>+</button>
          </div>
        </div>

        {addFromOpen && (
          <AddFromPicker
            dateStr={selectedDate}
            onClose={() => setAddFromOpen(false)}
            onScheduleTask={handleScheduleTask}
            onPromoteForestSource={handlePromoteForestSource}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Get dot color for an event based on source and tags (matches v1 behavior)
 */
function getDotColor(event) {
  const src = event.source?.mode;
  const tag = event.tags?.[0];
  if (src === 'gpt') return '#a855f7';
  if (src === 'canvas') return '#f59e0b';
  if (src === 'ical') return '#3b82f6';
  if (src === 'task') return '#9ed765';
  if (tag === 'home') return '#4caf50';
  if (tag === 'school') return '#00e5e5';
  if (tag === 'music') return '#e040fb';
  if (event.color) return event.color;
  return '#ffffff';
}

/**
 * Calendar cell with day number and event dots
 */
function CalendarCell({ day, isPad, isToday, isSelected, events, onClick }) {
  const dots = events.slice(0, 4).map(ev => getDotColor(ev));

  return (
    <div
      className={`cal-cell ${isPad ? 'pad' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="cal-daynum">{day}</span>
      {dots.length > 0 && (
        <div className="cal-dots">
          {dots.map((color, i) => (
            <span key={i} className="cal-dot" style={{ background: color }} />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyPanel({
  dateStr,
  items,
  placements,
  proposals,
  plannerSummary,
  plannerError,
  isPlanning,
  onPreviousDay,
  onToday,
  onNextDay,
  onAddFrom,
  onPlanDay,
  onOpenPlannerChat,
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
  const dateObj = parseDateYMD(dateStr);
  const todayStr = formatDateYMD(new Date());
  const isToday = dateStr === todayStr;

  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div className="cal-day-head">
        <div className="cal-day-nav">
          <button type="button" onClick={onPreviousDay} title="Previous day">‹</button>
          <button type="button" onClick={onToday} className={isToday ? 'active' : ''}>Today</button>
          <button type="button" onClick={onNextDay} title="Next day">›</button>
        </div>
        <div className="cal-daily-title">
          {isToday && <span className="cal-daily-today-badge">Today</span>}
          {dateLabel}
        </div>
      </div>

      <div className="cal-day-actions">
        <button type="button" onClick={onAddFrom}>＋ Add from…</button>
        <button type="button" className="plan-day" onClick={onPlanDay} disabled={isPlanning}>
          {isPlanning ? '✦ Planning…' : '✦ Plan my day'}
        </button>
        <button type="button" className="planner-chat" onClick={onOpenPlannerChat}>Ask about this day</button>
      </div>

      {(plannerSummary || plannerError) && (
        <div className={`cal-planner-note ${plannerError ? 'error' : ''}`}>
          {plannerError || plannerSummary}
          {!plannerError && proposals.length > 0 && <span>Accept or reject each dashed block.</span>}
        </div>
      )}

      <DayTimeline
        dateStr={dateStr}
        items={items}
        placements={placements}
        proposals={proposals}
        onToggleOrganizer={onToggleOrganizer}
        onUpdateOrganizer={onUpdateOrganizer}
        onRemoveOrganizer={onRemoveOrganizer}
        onCompletePlacement={onCompletePlacement}
        onUpdatePlacement={onUpdatePlacement}
        onArchivePlacement={onArchivePlacement}
        onCompleteTask={onCompleteTask}
        onAcceptProposal={onAcceptProposal}
        onRejectProposal={onRejectProposal}
      />
    </>
  );
}

export default CalendarModal;
