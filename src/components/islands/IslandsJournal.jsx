import { useEffect, useMemo, useState } from 'react';
import {
  addEntry, attach, canUndoTags, detach, getIsland, getState, markChangesSeen, openHunt, removeEntry, setChapter, setHunt,
  undoTagChange, updateIsland, useIslandVersion,
} from './store';
import { GLYPH, cardType } from './catalog';
import { isoDay, uid, whenShort } from './util';
import { AddLine, Check, EditableText } from './cards/fields';

// ==== JOURNAL ====
const LOG_LIMIT = 400;
const ENTRY_GLYPH = {
  log: GLYPH.compose, note: GLYPH.compose, stage: GLYPH.chevron, status: GLYPH.text, card: GLYPH.plus, file: GLYPH.file,
  agent: '􀆿', archive: GLYPH.archive, ship: '􀐚', step: GLYPH.check, tags: GLYPH.tag, search: GLYPH.search,
};
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function islandItems(island) {
  const items = [];
  island.milestones.forEach((m) => items.push({ id: m.id, date: m.date, text: m.label, kind: 'milestone', done: m.completed, island }));
  if (island.deadline) items.push({ id: `deadline-${island.id}`, date: island.deadline, text: 'Deadline', kind: 'deadline', island });
  island.cards.filter((c) => c.kind === 'ship' && c.data.shipDate).forEach((c) => items.push({ id: `ship-${c.id}`, date: c.data.shipDate, text: c.data.shipped ? 'Shipped' : `Ship: ${c.title}`, kind: 'ship', island }));
  return items;
}

function LogView({ islands, single }) {
  const { changes } = getState();
  const islandIds = new Set(islands.map((i) => i.id));
  const rows = useMemo(() => {
    const list = [];
    islands.forEach((island) => island.journal.entries.forEach((entry) => list.push({ ...entry, island })));
    changes.filter((c) => islandIds.has(c.projectId)).forEach((change) => list.push({
      id: change.id, at: change.at, kind: change.kind === 'tags' ? 'tags' : 'search', change, island: getIsland(change.projectId),
    }));
    return list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, LOG_LIMIT);
  }, [islands, changes]); // eslint-disable-line react-hooks/exhaustive-deps

  let lastDay = null;
  return (
    <div className="fo-journal__log">
      {single && <AddLine placeholder="Log something" onAdd={(text) => addEntry(single.id, 'note', text)} />}
      {rows.map((row) => {
        const day = isoDay(row.at);
        const showDay = day !== lastDay;
        lastDay = day;
        return (
          <div key={row.id}>
            {showDay && <div className="fo-journal__day">{new Date(row.at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>}
            <div className="fo-journal__entry" data-kind={row.kind} style={{ '--accent': row.island?.accent }}>
              <span className="fo-glyph fo-journal__glyph">{ENTRY_GLYPH[row.kind] || GLYPH.compose}</span>
              <div className="fo-journal__text">
                {!single && row.island && <span className="fo-journal__island">{row.island.name}</span>}
                {row.change ? <ChangeText change={row.change} /> : <span>{row.text}</span>}
              </div>
              <span className="fo-whisper">{whenShort(row.at)}</span>
              {single && row.kind === 'note' && (
                <button type="button" className="fo-journal__remove" onClick={() => removeEntry(single.id, row.id)} title="Remove"><span className="fo-glyph">{GLYPH.close}</span></button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChangeText({ change }) {
  if (change.kind === 'tags') {
    return (
      <span>
        Auto tags: {change.tags.map((t) => `#${t}`).join(' ')}
        {change.undoneAt ? <span className="fo-whisper"> undone</span> : canUndoTags(change) && (
          <button type="button" className="fo-link" onClick={() => undoTagChange(change.id)}>Undo</button>
        )}
      </span>
    );
  }
  return (
    <span>
      File Hunter found {change.results.length}{change.description ? ` for “${change.description}”` : ''}
      {change.results.length > 0 && (
        <button type="button" className="fo-link" onClick={() => { openHunt(change.projectId); setHunt({ changeId: change.id }); }}>Review</button>
      )}
    </span>
  );
}

function CalendarView({ islands, single }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState(isoDay());
  const { projects } = getState();
  const items = useMemo(() => projects.flatMap(islandItems), [projects]);
  const entriesByDay = useMemo(() => {
    const map = new Map();
    islands.forEach((island) => island.journal.entries.forEach((e) => { const k = isoDay(e.at); map.set(k, (map.get(k) || 0) + 1); }));
    return map;
  }, [islands]);
  const shownIds = new Set(islands.map((i) => i.id));

  const first = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => isoDay(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const dayItems = items.filter((item) => item.date === day);

  const setMilestones = (island, fn) => updateIsland(island.id, { milestones: fn(island.milestones) });

  return (
    <div className="fo-journal__calendar">
      <div className="fo-cal__head">
        <button type="button" className="fo-icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><span className="fo-glyph">{GLYPH.chevronLeft}</span></button>
        <span>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
        <button type="button" className="fo-icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><span className="fo-glyph">{GLYPH.chevron}</span></button>
      </div>
      <div className="fo-cal__grid">
        {WEEKDAYS.map((w, i) => <span key={i} className="fo-cal__wd">{w}</span>)}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const onDay = items.filter((item) => item.date === date);
          return (
            <button
              key={date}
              type="button"
              className="fo-cal__day"
              aria-pressed={date === day}
              data-today={date === isoDay() ? 'true' : undefined}
              onClick={() => setDay(date)}
            >
              <span className="fo-cal__n">{Number(date.slice(8))}</span>
              <span className="fo-cal__dots">
                {onDay.slice(0, 4).map((item) => (
                  <i key={item.id} style={{ '--accent': item.island.accent }} data-faded={single && !shownIds.has(item.island.id) ? 'true' : undefined} />
                ))}
                {entriesByDay.get(date) ? <i className="fo-cal__entry-dot" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="fo-cal__list">
        <div className="fo-journal__day">{new Date(`${day}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        {dayItems.map((item) => (
          <div key={item.id} className="fo-cal__item" data-faded={single && !shownIds.has(item.island.id) ? 'true' : undefined} style={{ '--accent': item.island.accent }}>
            {item.kind === 'milestone' ? (
              <Check done={item.done} onToggle={() => setMilestones(item.island, (ms) => ms.map((m) => (m.id === item.id ? { ...m, completed: !m.completed } : m)))} />
            ) : <span className="fo-glyph">{item.kind === 'ship' ? '􀐚' : GLYPH.clock}</span>}
            <span className="fo-cal__text">{item.text}</span>
            {(!single || item.island.id !== single.id) && <span className="fo-whisper">{item.island.name}</span>}
            {item.kind === 'milestone' && (!single || item.island.id === single.id) && (
              <button type="button" className="fo-journal__remove" onClick={() => setMilestones(item.island, (ms) => ms.filter((m) => m.id !== item.id))} title="Remove"><span className="fo-glyph">{GLYPH.close}</span></button>
            )}
          </div>
        ))}
        {single && (
          <AddLine
            placeholder="Add a milestone on this day"
            onAdd={(label) => setMilestones(single, (ms) => [...ms, { id: uid('ms'), label, date: day, completed: false, description: '', estimatedDays: 0, fileIds: [], subtasks: [] }])}
          />
        )}
      </div>
    </div>
  );
}

function ChapterView({ islands, single }) {
  if (single) {
    return (
      <div className="fo-journal__chapter">
        <EditableText className="fo-journal__bible" value={single.journal.chapter} placeholder={`Everything about ${single.name}`} onCommit={(text) => setChapter(single.id, text)} />
      </div>
    );
  }
  return (
    <div className="fo-journal__chapters">
      {islands.map((island) => (
        <section key={island.id} className="fo-journal__section" style={{ '--accent': island.accent }}>
          <h3>{island.name}<span className="fo-whisper">{island.stages[island.stage]}</span></h3>
          <EditableText className="fo-journal__bible" value={island.journal.chapter} placeholder="Everything about this project" onCommit={(text) => setChapter(island.id, text)} />
          {island.cards.length > 0 && (
            <p className="fo-journal__cards">
              {island.cards.map((c) => <span key={c.id}><span className="fo-glyph">{cardType(c.kind).glyph}</span>{c.title}</span>)}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

export default function IslandsJournal({ islandId = null, onClose = null, embedded = false }) {
  useIslandVersion();
  const { projects, loaded, ui } = getState();
  const [tab, setTab] = useState(ui.journalTab || 'log');
  const single = islandId ? getIsland(islandId) : null;
  const islands = single ? [single] : projects;
  useEffect(() => { if (islandId) markChangesSeen(islandId); }, [islandId]);

  return (
    <aside
      className={`fo-journal${embedded ? ' fo-journal--embedded fo-scope' : ' fo-drawer'}`}
      style={single ? { '--accent': single.accent, '--accent-rgb': single.accentRgb } : undefined}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="fo-drawer__head">
        <span className="fo-glyph">{GLYPH.journal}</span>
        <span className="fo-drawer__title">{single ? single.name : 'Islands'}</span>
        <div className="fo-seg">
          {[['log', 'Log'], ['calendar', 'Calendar'], ['chapter', single ? 'Chapter' : 'Chapters']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {onClose && <button type="button" className="fo-icon-btn" onClick={onClose} title="Close"><span className="fo-glyph">{GLYPH.close}</span></button>}
      </header>
      <div className="fo-journal__body">
        {!loaded ? null : tab === 'log' ? <LogView islands={islands} single={single} />
          : tab === 'calendar' ? <CalendarView islands={islands} single={single} />
            : <ChapterView islands={islands} single={single} />}
      </div>
    </aside>
  );
}

// The islands journal opened from the Journals app: loads Island's data while open.
export function IslandsJournalStandalone({ onClose }) {
  useEffect(() => { attach(); return () => detach(); }, []);
  return <IslandsJournal embedded onClose={onClose} />;
}
