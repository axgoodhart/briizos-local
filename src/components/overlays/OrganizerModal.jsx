import { useState, useEffect, useMemo } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { formatDateYMD } from '../../lib/dates';
import logger from '../../lib/logger';
import './OrganizerModal.css';

/**
 * OrganizerModal - Unified item manager (notes, events, timers, projects)
 * Reads from the same organizer collection as briizOS-Dev v1.
 */

const TYPE_ICONS = {
  note: '\u{1F4DD}',
  event: '\u{1F4C5}',
  timer: '\u23F1\uFE0F',
  chat: '\u{1F4AC}',
  external: '\u{1F517}',
  'custom-panel': '\u2699\uFE0F',
  project: '\u{1F4C1}',
};

const TAG_OPTIONS = ['', 'home', 'school', 'music'];

function OrganizerModal({ isOpen, onClose }) {
  const { items, loading, addItem, toggleDone, removeItem } = useOrganizer();
  const [activeTab, setActiveTab] = useState('items');
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('created');
  const [sortAsc, setSortAsc] = useState(false);

  // Quick-add state
  const [qaName, setQaName] = useState('');
  const [qaType, setQaType] = useState('note');
  const [qaDate, setQaDate] = useState('');
  const [qaTag, setQaTag] = useState('');
  const [qaTimeStart, setQaTimeStart] = useState('');
  const [qaDuration, setQaDuration] = useState('');
  const [qaShowRecurrence, setQaShowRecurrence] = useState(false);
  const [qaRecType, setQaRecType] = useState('weekly');
  const [qaRecInterval, setQaRecInterval] = useState(1);
  const [qaRecDays, setQaRecDays] = useState([]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeTab === 'projects') {
      result = result.filter(i => i.type === 'project');
    } else {
      // Exclude projects from items tab
      result = result.filter(i => i.type !== 'project');

      if (filter !== 'all') {
        const filterMap = {
          notes: ['note'],
          events: ['event'],
          timers: ['timer'],
          externals: ['external', 'custom-panel', 'chat'],
        };
        result = result.filter(i => (filterMap[filter] || []).includes(i.type));
      }
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortKey) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'created':
          aVal = a.createdAt || 0;
          bVal = b.createdAt || 0;
          break;
        case 'due':
          aVal = a.due || a.scheduledDate || '\uffff';
          bVal = b.due || b.scheduledDate || '\uffff';
          break;
        case 'status':
          aVal = a.status === 'done' ? 1 : 0;
          bVal = b.status === 'done' ? 1 : 0;
          break;
        case 'type':
          aVal = a.type || '';
          bVal = b.type || '';
          break;
        default:
          return 0;
      }
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [items, activeTab, filter, sortKey, sortAsc]);

  const todoItems = useMemo(() => filteredItems.filter(i => i.status !== 'done'), [filteredItems]);
  const doneItems = useMemo(() => filteredItems.filter(i => i.status === 'done'), [filteredItems]);

  // Counts
  const itemCount = useMemo(() => items.filter(i => i.type !== 'project').length, [items]);
  const projectCount = useMemo(() => items.filter(i => i.type === 'project').length, [items]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Parse time string "HH:MM" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const handleQuickAdd = async () => {
    if (!qaName.trim()) return;
    const today = formatDateYMD(new Date());
    const effectiveDate = qaDate || today;

    const startMinutes = parseTimeToMinutes(qaTimeStart);
    const dur = qaDuration ? parseInt(qaDuration, 10) : null;

    let recurrence = null;
    if (qaShowRecurrence && qaType === 'event') {
      const anchorDate = effectiveDate;
      const endObj = new Date();
      endObj.setFullYear(endObj.getFullYear() + 2);
      recurrence = {
        enabled: true,
        type: qaRecType,
        interval: qaRecInterval,
        daysOfWeek: qaRecType === 'weekly' ? (qaRecDays.length > 0 ? qaRecDays : [new Date().getDay()]) : null,
        dayOfMonth: new Date(effectiveDate + 'T00:00:00').getDate(),
        anchorDate,
        endDate: formatDateYMD(endObj),
      };
    }

    const itemData = {
      type: qaType,
      name: qaName.trim(),
      scheduledDate: effectiveDate,
      dateValue: effectiveDate,
      dateMode: qaType === 'event' ? 'event' : 'created',
      start: startMinutes,
      duration: dur,
      end: startMinutes != null && dur != null ? startMinutes + dur : null,
      tags: qaTag ? [qaTag] : [],
      recurrence,
    };

    try {
      await addItem(itemData);
      setQaName('');
      setQaDate('');
      setQaTimeStart('');
      setQaDuration('');
      setQaShowRecurrence(false);
      setQaRecDays([]);
    } catch (error) {
      logger.error('ui', 'Failed to add item', error?.message);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleRecDay = (day) => {
    setQaRecDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'items', label: 'Items', count: itemCount },
    { id: 'projects', label: 'Projects', count: projectCount },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'events', label: 'Events' },
    { id: 'timers', label: 'Timers' },
    { id: 'externals', label: 'Other' },
  ];

  const sortOptions = [
    { id: 'name', label: 'Name' },
    { id: 'created', label: 'Created' },
    { id: 'due', label: 'Due' },
    { id: 'status', label: 'Status' },
    { id: 'type', label: 'Type' },
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div
      className="organizer-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="organizer-modal" role="dialog" aria-modal="true" aria-labelledby="organizer-title">
        <div className="organizer-header">
          <h2 className="organizer-title" id="organizer-title">Organizer</h2>
          <div className="organizer-header-actions">
            <span className="projects-count">
              {activeTab === 'projects'
                ? `${projectCount} project${projectCount !== 1 ? 's' : ''}`
                : `${itemCount} item${itemCount !== 1 ? 's' : ''}`
              }
            </span>
            <button className="organizer-close-btn" onClick={onClose} aria-label="Close Organizer">×</button>
          </div>
        </div>

        <div className="organizer-workspace">
          {/* Tabs */}
          <div className="organizer-tabs" role="tablist" aria-label="Organizer sections" aria-orientation="vertical">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`organizer-tab-${tab.id}`}
                className={`organizer-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="organizer-tab-panel"
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="tab-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div
            className="organizer-content"
            id="organizer-tab-panel"
            role="tabpanel"
            aria-labelledby={`organizer-tab-${activeTab}`}
          >
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <>
              {/* Filter + Sort bar (items tab only) */}
              {activeTab === 'items' && (
                <div className="org-controls">
                  <div className="org-filter-bar">
                    {filters.map(f => (
                      <button
                        key={f.id}
                        className={`org-filter-btn ${filter === f.id ? 'active' : ''}`}
                        onClick={() => setFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="org-sort-bar">
                    {sortOptions.map(s => (
                      <button
                        key={s.id}
                        className={`org-sort-btn ${sortKey === s.id ? 'active' : ''}`}
                        onClick={() => handleSort(s.id)}
                      >
                        {s.label}
                        {sortKey === s.id && (
                          <span className="sort-arrow">{sortAsc ? '\u25B2' : '\u25BC'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick-add form */}
              {activeTab === 'items' && (
                <div className="org-quick-add">
                  <div className="org-qa-row">
                    <input
                      type="text"
                      className="org-qa-name"
                      placeholder="Add item..."
                      value={qaName}
                      onChange={(e) => setQaName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                    />
                    <select
                      className="org-qa-select"
                      value={qaType}
                      onChange={(e) => setQaType(e.target.value)}
                    >
                      <option value="note">Note</option>
                      <option value="event">Event</option>
                      <option value="timer">Timer</option>
                    </select>
                    <select
                      className="org-qa-select"
                      value={qaTag}
                      onChange={(e) => setQaTag(e.target.value)}
                    >
                      <option value="">no tag</option>
                      {TAG_OPTIONS.filter(Boolean).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button className="org-qa-btn" onClick={handleQuickAdd}>+</button>
                  </div>

                  <div className="org-qa-row org-qa-details">
                    <input
                      type="date"
                      className="org-qa-date"
                      value={qaDate}
                      onChange={(e) => setQaDate(e.target.value)}
                    />
                    {qaType === 'event' && (
                      <>
                        <input
                          type="time"
                          className="org-qa-time"
                          value={qaTimeStart}
                          onChange={(e) => setQaTimeStart(e.target.value)}
                          placeholder="Start"
                        />
                        <input
                          type="number"
                          className="org-qa-duration"
                          placeholder="min"
                          min="5"
                          step="5"
                          value={qaDuration}
                          onChange={(e) => setQaDuration(e.target.value)}
                        />
                        <button
                          className={`org-qa-rec-toggle ${qaShowRecurrence ? 'active' : ''}`}
                          onClick={() => setQaShowRecurrence(!qaShowRecurrence)}
                          title="Recurrence"
                        >
                          ↻
                        </button>
                      </>
                    )}
                  </div>

                  {/* Recurrence panel */}
                  {qaShowRecurrence && qaType === 'event' && (
                    <div className="org-rec-panel">
                      <div className="org-rec-row">
                        <select
                          className="org-qa-select"
                          value={qaRecType}
                          onChange={(e) => setQaRecType(e.target.value)}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <span className="org-rec-label">every</span>
                        <select
                          className="org-qa-select org-qa-interval"
                          value={qaRecInterval}
                          onChange={(e) => setQaRecInterval(parseInt(e.target.value, 10))}
                        >
                          {[1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="org-rec-label">{qaRecType === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                      </div>
                      {qaRecType === 'weekly' && (
                        <div className="org-rec-days">
                          {dayNames.map((name, idx) => (
                            <button
                              key={idx}
                              className={`org-rec-day ${qaRecDays.includes(idx) ? 'active' : ''}`}
                              onClick={() => toggleRecDay(idx)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Item list */}
              <div className="org-item-list">
                {filteredItems.length === 0 ? (
                  <div className="empty-state">
                    <p>{activeTab === 'projects' ? 'No projects yet' : 'No items yet'}</p>
                  </div>
                ) : (
                  <>
                    {/* Todo items */}
                    {todoItems.length > 0 && (
                      <div className="org-section">
                        {doneItems.length > 0 && (
                          <div className="org-section-title">Active ({todoItems.length})</div>
                        )}
                        {todoItems.map(item => (
                          <OrganizerItemRow
                            key={item.id}
                            item={item}
                            onToggleDone={() => toggleDone(item.id)}
                            onDelete={() => removeItem(item.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Done items */}
                    {doneItems.length > 0 && (
                      <div className="org-section org-section-done">
                        <div className="org-section-title">Done ({doneItems.length})</div>
                        {doneItems.map(item => (
                          <OrganizerItemRow
                            key={item.id}
                            item={item}
                            onToggleDone={() => toggleDone(item.id)}
                            onDelete={() => removeItem(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format minutes from midnight to 12-hour time string
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
 * Individual item row
 */
function OrganizerItemRow({ item, onToggleDone, onDelete }) {
  const isDone = item.status === 'done';
  const typeIcon = TYPE_ICONS[item.type] || '\u{1F4C4}';

  // Format date display
  let dateDisplay = '';
  if (item.scheduledDate) {
    dateDisplay = item.scheduledDate;
  } else if (item.due) {
    dateDisplay = item.due;
  }

  // Format time for events
  let timeDisplay = '';
  if (item.type === 'event' && item.start != null) {
    timeDisplay = formatTime12(item.start);
    if (item.duration) {
      timeDisplay += ` (${item.duration}m)`;
    }
  }

  // Tag display
  const tagStr = item.tags?.length > 0 ? item.tags[0] : '';

  // Recurrence indicator
  const hasRecurrence = item.recurrence?.enabled;

  return (
    <div className={`org-item-row ${isDone ? 'done' : ''}`}>
      <button
        className={`org-item-check ${isDone ? 'checked' : ''}`}
        onClick={onToggleDone}
        title={isDone ? 'Mark as todo' : 'Mark as done'}
      >
        {isDone ? '\u2713' : '\u25CB'}
      </button>

      <span className="org-item-type" title={item.type}>{typeIcon}</span>

      <div className="org-item-info">
        <span className={`org-item-name ${isDone ? 'strike' : ''}`}>{item.name}</span>
        <div className="org-item-meta">
          {dateDisplay && <span className="org-item-date">{dateDisplay}</span>}
          {timeDisplay && <span className="org-item-time">{timeDisplay}</span>}
          {tagStr && <span className="org-item-tag">{tagStr}</span>}
          {hasRecurrence && <span className="org-item-rec">↻</span>}
        </div>
      </div>

      <button
        className="org-item-delete"
        onClick={onDelete}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default OrganizerModal;
