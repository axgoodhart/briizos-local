import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import logger from '../../lib/logger';
import { addMilestone, closeFullView, importPaths, openCanvas, openPanel, relocateFile, select, toggleMilestone } from './store';
import { GLYPH, cardType } from './catalog';
import { pickFiles, trackPointer } from './gestures';
import { clamp, fileBadge, formatBytes, isAudio, isoDay, isVideo, relativeTime, toFileUrl, whenShort } from './util';
import CardFrame from './CardFrame';

// ==== MASONRY ====
const COL_MIN = 300;            // narrowest column before one is dropped
const COL_GAP = 18;
const CARD_H_MIN = 200;
const CARD_H_MAX = 560;
const WIDE_RATIO = 1.5;         // a card this much wider than a column spans two

// ==== TIMELINE ====
const DAY = 86400000;
const TL_MIN_SPAN = 6 * 3600000;        // can't zoom closer than six hours
const TL_MAX_SPAN = 30 * 365 * DAY;
const TL_LABEL_W = 132;                 // room a labelled node needs before the next shares its lane
const TL_LANES = 5;
const TL_PINCH_RATE = 0.012;
const TL_FIT_PAD = 0.07;
const HERO_MAX = 6;

const TYPE_ORDER = ['folder', 'document', 'code', 'image', 'video', 'audio', 'design', 'archive', 'data', 'other'];
const readable = (group) => (group === 'other' ? 'Other files' : group.charAt(0).toUpperCase() + group.slice(1));

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/* ── Cards, auto-arranged ─────────────────────────────────────────── */

function Masonry({ island, selectedCardId, terminals, tasks, fileStatus }) {
  const ref = useRef(null);
  const width = useWidth(ref);
  const ordered = useMemo(() => [...island.cards].sort((a, b) => (
    (b.id === island.mainCardId) - (a.id === island.mainCardId) || a.y - b.y || a.x - b.x
  )), [island.cards, island.mainCardId]);

  const layout = useMemo(() => {
    if (!width) return { items: [], height: 0 };
    const cols = Math.max(1, Math.floor((width + COL_GAP) / (COL_MIN + COL_GAP)));
    const colW = (width - COL_GAP * (cols - 1)) / cols;
    const heights = Array(cols).fill(0);
    const items = ordered.map((card) => {
      const span = cols > 1 && card.w >= colW * WIDE_RATIO ? 2 : 1;
      const w = colW * span + COL_GAP * (span - 1);
      const h = clamp(Math.round(card.h * (w / card.w)), CARD_H_MIN, CARD_H_MAX);
      let col = 0;
      let top = Infinity;
      for (let c = 0; c + span <= cols; c += 1) {
        const y = Math.max(...heights.slice(c, c + span));
        if (y < top) { top = y; col = c; }
      }
      for (let c = col; c < col + span; c += 1) heights[c] = top + h + COL_GAP;
      return { card, x: Math.round(col * (colW + COL_GAP)), y: top, w: Math.round(w), h };
    });
    return { items, height: Math.max(0, ...heights) - COL_GAP };
  }, [ordered, width]);

  return (
    <div ref={ref} className="fo-full__masonry" style={{ height: Math.max(layout.height, 0) }}>
      {layout.items.map(({ card, x, y, w, h }) => (
        <CardFrame
          key={card.id}
          island={island}
          card={{ ...card, x, y, w, h }}
          packed
          selected={selectedCardId === card.id}
          isMain={island.mainCardId === card.id}
          terminal={card.kind === 'terminal' ? terminals[card.id] : null}
          task={card.kind === 'agent' ? tasks[card.data.taskId] : null}
          tasks={card.kind === 'goals' || card.kind === 'agent' ? tasks : null}
          fileStatus={card.kind === 'docs' || card.kind === 'media' ? fileStatus : null}
        />
      ))}
      {!island.cards.length && <p className="fo-full__empty">No cards yet. Close this view and drag across the island to make one.</p>}
    </div>
  );
}

/* ── Timeline: scroll to pan, pinch to zoom ───────────────────────── */

function timelineItems(island, files) {
  const items = [];
  const at = (iso) => Date.parse(iso);
  items.push({ id: 'born', t: at(island.createdAt), kind: 'born', label: 'Island made' });
  island.milestones.forEach((m) => items.push({ id: m.id, t: at(`${m.date}T12:00:00`), kind: 'milestone', label: m.label, done: m.completed, milestone: m }));
  if (island.deadline) items.push({ id: 'deadline', t: at(`${island.deadline}T12:00:00`), kind: 'deadline', label: 'Deadline' });
  island.cards.filter((c) => c.kind === 'ship' && c.data.shipDate).forEach((c) => items.push({
    id: `ship-${c.id}`, t: at(`${c.data.shipDate}T12:00:00`), kind: 'ship', label: c.data.shipped ? 'Shipped' : `Ship: ${c.title}`,
  }));
  island.journal.entries.forEach((e) => items.push({ id: e.id, t: at(e.at), kind: 'entry', label: e.text, entryKind: e.kind }));
  files.forEach((f) => items.push({ id: `file-${f.id}`, t: at(f.modifiedAt), kind: 'file', label: f.name, file: f }));
  return items.filter((item) => Number.isFinite(item.t)).sort((a, b) => a.t - b.t);
}

function fitWindow(items) {
  const now = Date.now();
  if (!items.length) return { start: now - 30 * DAY, end: now + 30 * DAY };
  let start = Math.min(items[0].t, now);
  let end = Math.max(items[items.length - 1].t, now);
  const span = Math.max(end - start, 2 * DAY);
  start -= span * TL_FIT_PAD;
  end = start + span * (1 + TL_FIT_PAD * 2);
  return { start, end };
}

function spanLabel(ms) {
  const days = ms / DAY;
  if (days < 1) return `${Math.max(1, Math.round(ms / 3600000))} hours across`;
  if (days < 45) return `${Math.round(days)} days across`;
  if (days < 400) return `${Math.round(days / 30.4)} months across`;
  return `${(days / 365).toFixed(1)} years across`;
}

function axisTicks(start, end) {
  const span = end - start;
  const days = span / DAY;
  const pct = (t) => ((t - start) / span) * 100;
  const tiers = [];
  const years = [];
  for (let y = new Date(start).getFullYear(); y <= new Date(end).getFullYear(); y += 1) {
    const t = new Date(y, 0, 1).getTime();
    if (t >= start - span * 0.05 && t <= end + span * 0.05) years.push({ key: `y${y}`, pct: pct(t), text: String(y) });
  }
  tiers.push({ id: 'years', opacity: clamp(days / 180, 0.3, 1), items: years });
  const months = [];
  const format = days < 60 ? 'long' : days > 400 ? 'narrow' : 'short';
  const m = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 1);
  while (m.getTime() <= end && months.length < 400) {
    const t = m.getTime();
    if (t >= start - span * 0.05) months.push({ key: `m${t}`, pct: pct(t), text: m.toLocaleDateString([], { month: format }) });
    m.setMonth(m.getMonth() + 1);
  }
  tiers.push({ id: 'months', opacity: clamp(days / 14, 0.2, 0.9), items: months });
  if (days < 120) {
    const step = days > 60 ? 10 : days > 30 ? 5 : 1;
    const list = [];
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() <= end && list.length < 400) {
      if (d.getDate() === 1 || d.getDate() % step === 0) {
        const t = d.getTime();
        if (t >= start - span * 0.02) list.push({ key: `d${t}`, pct: pct(t), text: d.getDate() === 1 ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : String(d.getDate()) });
      }
      d.setDate(d.getDate() + 1);
    }
    tiers.push({ id: 'days', opacity: clamp(40 / days, 0, 1), items: list });
  }
  if (days < 10) {
    const step = days > 5 ? 12 : days > 2 ? 6 : days > 0.5 ? 3 : 1;
    const list = [];
    const h = new Date(start);
    h.setMinutes(0, 0, 0);
    while (h.getTime() <= end && list.length < 400) {
      if (h.getHours() % step === 0) {
        const t = h.getTime();
        if (t >= start - span * 0.02) list.push({ key: `h${t}`, pct: pct(t), text: h.toLocaleTimeString([], { hour: 'numeric' }) });
      }
      h.setHours(h.getHours() + 1);
    }
    tiers.push({ id: 'hours', opacity: clamp(2 / days, 0, 1), items: list });
  }
  return tiers;
}

const NODE_GLYPH = { born: GLYPH.circle, milestone: GLYPH.check, deadline: GLYPH.clock, ship: '􀐚', entry: GLYPH.compose, file: GLYPH.file };

function Timeline({ island, files }) {
  const ref = useRef(null);
  const width = useWidth(ref);
  const items = useMemo(() => timelineItems(island, files), [island, files]);
  const [win, setWin] = useState(() => fitWindow(items));
  const [pending, setPending] = useState(null);   // { t, x } while naming a new milestone
  const [hover, setHover] = useState(null);
  const span = win.end - win.start;
  const xOf = (t) => ((t - win.start) / span) * width;
  const tOf = (x) => win.start + (x / width) * span;

  const zoomAt = (x, factor) => setWin((w) => {
    const s = w.end - w.start;
    const next = clamp(s * factor, TL_MIN_SPAN, TL_MAX_SPAN);
    const anchor = w.start + (x / Math.max(width, 1)) * s;
    const start = anchor - (anchor - w.start) * (next / s);
    return { start, end: start + next };
  });
  const panBy = (dx) => setWin((w) => { const s = w.end - w.start; const shift = -(dx / Math.max(width, 1)) * s; return { start: w.start + shift, end: w.end + shift }; });
  const fit = () => setWin(fitWindow(items));
  const today = () => setWin((w) => { const s = w.end - w.start; return { start: Date.now() - s / 2, end: Date.now() + s / 2 }; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      const x = e.clientX - el.getBoundingClientRect().left;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(x, Math.exp(e.deltaY * TL_PINCH_RATE)); return; }
      const dx = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      panBy(-dx);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [width]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPan = (event) => {
    if (event.button !== 0 || event.target.closest('button, input')) return;
    const origin = win;
    const el = ref.current;
    trackPointer(event, {
      threshold: 3,
      onMove: (dx) => {
        el.dataset.panning = 'true';
        const shift = -(dx / Math.max(width, 1)) * (origin.end - origin.start);
        setWin({ start: origin.start + shift, end: origin.end + shift });
      },
      onEnd: () => { delete el.dataset.panning; },
    });
  };

  const onDoubleClick = (event) => {
    if (event.target.closest('button, input, .fo-tl__node')) return;
    const x = event.clientX - ref.current.getBoundingClientRect().left;
    setPending({ t: tOf(x), x });
  };

  const placeMilestone = (label) => {
    if (!pending) return;
    addMilestone(island.id, { label, date: isoDay(new Date(pending.t)) });
    setPending(null);
  };

  const openItem = (item) => {
    if (item.kind === 'milestone') toggleMilestone(island.id, item.id);
    else if (item.kind === 'file') {
      window.api.islandOpenPath(item.file.path);
      logger.info('island.files', `Opened “${item.file.name}” in its own app from the timeline of “${island.name}”.`, { path: item.file.path });
    } else if (item.kind === 'entry') openPanel('journal', island.id);
  };

  // Lanes: a labelled node keeps TL_LABEL_W to itself; crowded nodes drop to dots.
  const placed = useMemo(() => {
    if (!width) return [];
    const laneEnd = Array(TL_LANES).fill(-Infinity);
    const out = [];
    items.forEach((item) => {
      const x = xOf(item.t);
      if (x < -TL_LABEL_W || x > width + TL_LABEL_W) return;
      let lane = laneEnd.findIndex((end) => end <= x);
      const labelled = lane !== -1;
      if (lane === -1) lane = laneEnd.indexOf(Math.min(...laneEnd));
      laneEnd[lane] = labelled ? x + TL_LABEL_W : laneEnd[lane];
      out.push({ ...item, x, lane, labelled });
    });
    return out;
  }, [items, win, width]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiers = useMemo(() => axisTicks(win.start, win.end), [win]);
  const nowX = xOf(Date.now());
  const done = island.milestones.filter((m) => m.completed).length;

  return (
    <div className="fo-tl">
      <div className="fo-tl__bar">
        <span className="fo-whisper">{spanLabel(span)}</span>
        {island.milestones.length > 0 && <span className="fo-whisper">{done} of {island.milestones.length} milestones done</span>}
        <span className="fo-tl__hint fo-whisper">pinch or ⌘-scroll to zoom · scroll sideways to move · double-click to place a milestone</span>
        <button type="button" className="fo-icon-btn" onClick={() => zoomAt(width / 2, 1.5)} title="Zoom out"><span className="fo-glyph">{GLYPH.minus}</span></button>
        <button type="button" className="fo-icon-btn" onClick={() => zoomAt(width / 2, 1 / 1.5)} title="Zoom in"><span className="fo-glyph">{GLYPH.plus}</span></button>
        <button type="button" className="fo-chip-btn" onClick={today}>Today</button>
        <button type="button" className="fo-chip-btn" onClick={fit}>Fit</button>
      </div>
      <div ref={ref} className="fo-tl__track" onPointerDown={startPan} onDoubleClick={onDoubleClick} onPointerLeave={() => setHover(null)}>
        <div className="fo-tl__axis">
          {tiers.map((tier) => (
            <div key={tier.id} className="fo-tl__tier" data-tier={tier.id} style={{ opacity: tier.opacity }}>
              {tier.items.map((tick) => <span key={tick.key} className="fo-tl__tick" style={{ left: `${tick.pct}%` }}>{tick.text}</span>)}
            </div>
          ))}
        </div>
        <div className="fo-tl__line" />
        {nowX >= 0 && nowX <= width && <div className="fo-tl__now" style={{ left: nowX }}><span>now</span></div>}
        {placed.map((item) => (
          <button
            key={item.id}
            type="button"
            className="fo-tl__node"
            data-kind={item.kind}
            data-done={item.done ? 'true' : undefined}
            data-labelled={item.labelled ? 'true' : undefined}
            style={{ left: item.x, '--lane': item.lane }}
            title={`${item.label} · ${whenShort(item.t)}`}
            onPointerEnter={() => setHover(item.id)}
            onClick={(e) => { e.stopPropagation(); openItem(item); }}
          >
            <span className="fo-tl__dot"><span className="fo-glyph">{NODE_GLYPH[item.kind]}</span></span>
            {(item.labelled || hover === item.id) && (
              <span className="fo-tl__label">
                <b>{item.label}</b>
                <span className="fo-whisper">{whenShort(item.t)}</span>
              </span>
            )}
          </button>
        ))}
        {pending && (
          <div className="fo-tl__pending" style={{ left: pending.x }} onPointerDown={(e) => e.stopPropagation()}>
            <span className="fo-whisper">{new Date(pending.t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <input
              className="fo-input"
              autoFocus
              placeholder="Milestone"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) placeMilestone(e.currentTarget.value.trim());
                if (e.key === 'Escape') setPending(null);
              }}
              onBlur={() => setPending(null)}
            />
          </div>
        )}
        {!items.length && <p className="fo-full__empty">Nothing dated yet. Double-click the track to place a milestone.</p>}
      </div>
    </div>
  );
}

/* ── Files, grouped by kind ───────────────────────────────────────── */

function Files({ island, files, fileStatus, query, onQuery }) {
  const cardsByFile = useMemo(() => {
    const map = new Map();
    island.cards.forEach((card) => (card.data.fileIds || []).forEach((id) => map.set(id, [...(map.get(id) || []), card.title])));
    return map;
  }, [island.cards]);
  const groups = useMemo(() => {
    const map = new Map();
    files.forEach((f) => map.set(f.typeGroup, [...(map.get(f.typeGroup) || []), f]));
    return [...map.entries()].sort((a, b) => {
      const ia = TYPE_ORDER.indexOf(a[0]); const ib = TYPE_ORDER.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [files]);

  const open = (file) => {
    window.api.islandOpenPath(file.path);
    logger.info('island.files', `Opened “${file.name}” in its own app from the full view of “${island.name}”.`, { path: file.path });
  };
  const reveal = (file) => {
    window.api.islandShowItemInFolder(file.path);
    logger.info('island.files', `Showed “${file.name}” in the Finder from the full view of “${island.name}”.`, { path: file.path });
  };
  const add = async () => {
    const paths = await pickFiles();
    if (paths.length) importPaths(paths, { islandId: island.id });
  };

  return (
    <div className="fo-full__files">
      <div className="fo-full__filebar">
        <input className="fo-input fo-full__search" value={query} placeholder="Find a file" onChange={(e) => onQuery(e.target.value)} />
        <span className="fo-whisper">{files.length === island.files.length ? `${files.length} files` : `${files.length} of ${island.files.length} files`}</span>
        <button type="button" className="fo-chip-btn" onClick={add}>Add files</button>
      </div>
      {groups.map(([group, list]) => (
        <details key={group} className="fo-full__group" open>
          <summary>{readable(group)}<span className="fo-whisper">{list.length}</span></summary>
          <div className="fo-full__rows">
            {list.map((file) => {
              const missing = fileStatus?.[file.path] === 'missing';
              const homes = cardsByFile.get(file.id) || [];
              return (
                <div key={file.id} className="fo-docs__row fo-full__row" data-missing={missing ? 'true' : undefined} title={file.path}>
                  <button type="button" className="fo-docs__file" onClick={() => open(file)}>
                    <span className="fo-docs__badge">{fileBadge(file)}</span>
                    <span className="fo-full__filename">{file.name}</span>
                    <span className="fo-whisper fo-full__filesub">
                      {missing ? 'missing' : `${formatBytes(file.size)} · ${relativeTime(file.modifiedAt)}`}
                      {homes.length > 0 && ` · ${homes.join(', ')}`}
                    </span>
                  </button>
                  {file.tags.length > 0 && <span className="fo-whisper fo-full__filetags">{file.tags.map((t) => `#${t}`).join(' ')}</span>}
                  {missing && <button type="button" className="fo-chip-btn" onClick={() => relocateFile(island.id, file.id)}>Find</button>}
                  <button type="button" className="fo-icon-btn" onClick={() => reveal(file)} title="Show in Finder"><span className="fo-glyph">{GLYPH.folder}</span></button>
                </div>
              );
            })}
          </div>
        </details>
      ))}
      {!files.length && <p className="fo-full__empty">{island.files.length ? 'No files match.' : 'No files on this island yet.'}</p>}
    </div>
  );
}

/* ── The view ─────────────────────────────────────────────────────── */

export default function FullView({ island, selectedCardId, terminals, tasks, fileStatus }) {
  const [activeTags, setActiveTags] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const scrollRef = useRef(null);
  const sections = { cards: useRef(null), timeline: useRef(null), files: useRef(null) };
  const [section, setSection] = useState('cards');

  useEffect(() => { setActiveTags(new Set()); setQuery(''); scrollRef.current?.scrollTo(0, 0); }, [island.id]);

  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    return island.files.filter((f) => (!activeTags.size || f.tags.some((t) => activeTags.has(t))) && (!q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)));
  }, [island.files, activeTags, query]);
  const hero = useMemo(() => {
    const media = island.files.filter((f) => f.previewable && !isAudio(f) && f.path !== island.cover?.path);
    return island.cover ? [{ id: 'cover', ...island.cover, ext: island.cover.name.split('.').pop() }] : media.slice(0, HERO_MAX);
  }, [island.files, island.cover]);
  const tags = useMemo(() => [...new Set([...island.tags, ...island.files.flatMap((f) => f.tags)])], [island.tags, island.files]);
  const done = island.milestones.filter((m) => m.completed).length;
  const progress = island.milestones.length ? Math.round((done / island.milestones.length) * 100) : null;

  const toggleTag = (tag) => setActiveTags((prev) => { const next = new Set(prev); if (next.has(tag)) next.delete(tag); else next.add(tag); return next; });
  const jump = (id) => { setSection(id); sections[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const jumpToCard = (card) => {
    select({ islandId: island.id, cardId: card.id });
    jump('cards');
    requestAnimationFrame(() => scrollRef.current?.querySelector(`[data-card-id="${card.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  // The nav follows the section under the top of the page.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => setSection(e.target.dataset.section));
    }, { root, rootMargin: '-20% 0px -70% 0px' });
    Object.values(sections).forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
  }, [island.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      className="fo-full"
      style={{ '--accent': island.accent, '--accent-rgb': island.accentRgb }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="fo-full__head">
        <div className="fo-full__tab">
          <span className="fo-full__tab-label">Full view</span>
          <button type="button" className="fo-island__gear" onClick={() => openPanel('settings', island.id)} title="Island settings"><span className="fo-glyph">{GLYPH.gear}</span></button>
        </div>
        <nav className="fo-seg fo-full__nav">
          {[['cards', `Cards ${island.cards.length}`], ['timeline', 'Timeline'], ['files', `Files ${island.files.length}`]].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={section === id} onClick={() => jump(id)}>{label}</button>
          ))}
        </nav>
        <button type="button" className="fo-icon-btn fo-full__journal" onClick={() => openCanvas(island.id)} title="Open on its own canvas"><span className="fo-glyph">􀥩</span></button>
        <button type="button" className="fo-icon-btn fo-full__close" onClick={() => openPanel('journal', island.id)} title="Journal"><span className="fo-glyph">{GLYPH.journal}</span></button>
        <button type="button" className="fo-icon-btn fo-full__close" onClick={closeFullView} title="Back to the desk (Esc)"><span className="fo-glyph">{GLYPH.close}</span></button>
      </header>

      <div ref={scrollRef} className="fo-full__scroll">
        {hero.length > 0 && (
          <div className="fo-full__hero" data-cover={island.cover ? 'true' : undefined} aria-hidden="true">
            {hero.map((f) => (isVideo(f)
              ? <video key={f.id} src={toFileUrl(f.path)} muted playsInline preload="metadata" />
              : <img key={f.id} src={toFileUrl(f.path)} alt="" loading="lazy" draggable={false} />))}
          </div>
        )}
        <h1 className="fo-full__name">{island.name}</h1>
        <div className="fo-full__meta">
          <span className="fo-full__pill">{island.stages[island.stage]}</span>
          <span className="fo-full__pill">{island.files.length} file{island.files.length === 1 ? '' : 's'}</span>
          <span className="fo-full__pill">made {relativeTime(island.createdAt)}</span>
          <span className="fo-full__pill">last session {relativeTime(island.lastSessionAt)}</span>
          {progress !== null && <span className="fo-full__pill" data-progress="true">{progress}%</span>}
          {island.deadline && <span className="fo-full__pill" data-deadline="true">due {new Date(`${island.deadline}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>}
        </div>
        {tags.length > 0 && (
          <div className="fo-full__tags">
            {tags.map((tag) => (
              <button key={tag} type="button" className="fo-chip-btn" aria-pressed={activeTags.has(tag)} onClick={() => toggleTag(tag)}>#{tag}</button>
            ))}
            {activeTags.size > 0 && <button type="button" className="fo-link" onClick={() => setActiveTags(new Set())}>Clear</button>}
          </div>
        )}

        <div ref={sections.cards} data-section="cards" className="fo-full__section">
          <Masonry island={island} selectedCardId={selectedCardId} terminals={terminals} tasks={tasks} fileStatus={fileStatus} />
        </div>
        <div ref={sections.timeline} data-section="timeline" className="fo-full__section">
          <Timeline island={island} files={files} />
        </div>
        <div ref={sections.files} data-section="files" className="fo-full__section">
          <Files island={island} files={files} fileStatus={fileStatus} query={query} onQuery={setQuery} />
        </div>
      </div>

      <div className="fo-full__rail">
        {island.cards.map((card) => {
          const task = card.kind === 'agent' ? tasks[card.data.taskId] : null;
          const live = (card.kind === 'terminal' && terminals[card.id]?.running)
            || (task && task.automated && ['active', 'in_progress', 'running', 'pending'].includes(task.status));
          return (
            <button
              key={card.id}
              type="button"
              className="fo-full__node"
              data-kind={card.kind}
              data-live={live ? 'true' : undefined}
              data-waiting={task?.status === 'waiting' ? 'true' : undefined}
              aria-pressed={selectedCardId === card.id}
              title={card.title}
              onClick={() => jumpToCard(card)}
            >
              <span className="fo-glyph">{cardType(card.kind).glyph}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
