import { useState, useMemo } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { formatDateYMD, parseDateYMD } from '../../lib/firestore';
import { eventOccursOnDate, buildMonthEventMap } from '../../lib/recurrence';
import logger from '../../lib/logger';
import './CalendarModal.css';

/**
 * CalendarModal - Monthly grid calendar with daily detail panel
 * Reads events from the shared organizer collection (same data as briizOS-Dev v1).
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarModal({ isOpen, onClose }) {
  const { items, addItem, toggleDone, loading } = useOrganizer();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(() => formatDateYMD(new Date()));
  const [quickAddText, setQuickAddText] = useState('');

  // Build event map for current month
  const eventMap = useMemo(
    () => buildMonthEventMap(items, viewYear, viewMonth),
    [items, viewYear, viewMonth]
  );

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

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
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
      const newDate = formatDateYMD(current);
      setSelectedDate(newDate);
      // Auto-navigate month if needed
      if (current.getMonth() !== viewMonth || current.getFullYear() !== viewYear) {
        setViewMonth(current.getMonth());
        setViewYear(current.getFullYear());
      }
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

  // Parse quick add text like "9am Meeting with team" or just "Meeting"
  const parseQuickAdd = (text) => {
    const timeMatch = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+(.+)$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2] || '0', 10);
      const period = timeMatch[3]?.toLowerCase();
      const title = timeMatch[4];

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      const startMinutes = hours * 60 + minutes;
      return { title, startMinutes, durationMinutes: 60 };
    }
    return { title: text, startMinutes: null, durationMinutes: null };
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    const parsed = parseQuickAdd(quickAddText.trim());

    try {
      await addItem({
        type: 'event',
        name: parsed.title,
        scheduledDate: selectedDate,
        dateValue: selectedDate,
        dateMode: 'event',
        start: parsed.startMinutes,
        duration: parsed.durationMinutes,
        end: parsed.startMinutes != null ? parsed.startMinutes + (parsed.durationMinutes || 60) : null,
      });
      setQuickAddText('');
    } catch (error) {
      logger.error('ui', 'Failed to add event', error?.message);
    }
  };

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
      <div className="calendar-modal">
        {/* Header */}
        <div className="calendar-header">
          <h2 className="calendar-title">Calendar</h2>
          <button className="calendar-close-btn" onClick={onClose}>×</button>
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
          {loading ? (
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
                        onClick={() => {
                          setSelectedDate(cell.dateStr);
                          // Navigate to that month if it's a pad cell
                          if (cell.isPad) {
                            const d = parseDateYMD(cell.dateStr);
                            setViewMonth(d.getMonth());
                            setViewYear(d.getFullYear());
                          }
                        }}
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
                  onToggleDone={toggleDone}
                />
              </div>
            </div>
          )}

          {/* Quick Add */}
          <div className="quick-add">
            <input
              type="text"
              className="quick-add-input"
              placeholder="Quick add: 9am Meeting with team..."
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button className="quick-add-btn" onClick={handleQuickAdd}>+</button>
          </div>
        </div>

        {/* Footer */}
        <div className="calendar-footer">
          <span className="items-count">
            {selectedDayItems.length} item{selectedDayItems.length !== 1 ? 's' : ''} on {selectedDate}
          </span>
          <button className="calendar-btn close" onClick={onClose}>Close</button>
        </div>
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

/**
 * Format minutes from midnight to 12-hour time
 */
function formatTime12(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Format a time range
 */
function formatTimeRange(start, duration) {
  if (start == null) return '';
  const startStr = formatTime12(start);
  if (duration) {
    const endStr = formatTime12(start + duration);
    return `${startStr} - ${endStr}`;
  }
  return startStr;
}

/**
 * Daily detail panel showing items for a selected date
 */
function DailyPanel({ dateStr, items, onToggleDone }) {
  const dateObj = parseDateYMD(dateStr);
  const todayStr = formatDateYMD(new Date());
  const isToday = dateStr === todayStr;

  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Sort events by start time
  const sorted = [...items].sort((a, b) => {
    const aStart = a.start ?? 9999;
    const bStart = b.start ?? 9999;
    return aStart - bStart;
  });

  return (
    <>
      <div className="cal-daily-title">
        {isToday && <span className="cal-daily-today-badge">Today</span>}
        {dateLabel}
      </div>
      <div className="cal-daily-list">
        {sorted.length === 0 ? (
          <div className="cal-daily-empty">No items</div>
        ) : (
          sorted.map(item => (
            <div
              key={item.id}
              className={`cal-daily-item ${item.status === 'done' ? 'done' : ''}`}
            >
              <div className="cal-daily-item-info">
                <span className="cal-daily-item-name">{item.name}</span>
                {item.type === 'event' && item.start != null && (
                  <span className="cal-daily-item-time">
                    {formatTimeRange(item.start, item.duration)}
                  </span>
                )}
                {item.recurrence?.enabled && (
                  <span className="cal-daily-item-rec">↻ recurring</span>
                )}
              </div>
              <button
                className={`cal-daily-done-btn ${item.status === 'done' ? 'checked' : ''}`}
                onClick={() => onToggleDone(item.id)}
                title={item.status === 'done' ? 'Mark as todo' : 'Mark as done'}
              >
                {item.status === 'done' ? '\u2713' : '\u25CB'}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default CalendarModal;
