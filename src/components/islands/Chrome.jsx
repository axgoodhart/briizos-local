import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_DESK_ID, arrangeByTags, clearTagFilter, createDesk, deskIslands, getState, openPanel, setUi, switchDesk, tagVocabulary,
  toast, toggleTagFilter,
} from './store';
import { frameRects, getCamera, onCamera, stageRect, zoomBy, screenToWorld } from './camera';
import { GLYPH, ISLAND_MIN } from './catalog';
import { hashString, snap } from './util';

// ==== TAG STRIP ====
const STRIP_TAGS_MAX = 18;

// The flower an active tag sprouts on (carried over from the old Forest strip).
function Bloom() {
  return (
    <svg className="fo-bloom" viewBox="0 0 28 72" preserveAspectRatio="none" aria-hidden="true">
      <path className="fo-bloom__stem" d="M14 70 C 10.5 58, 17.5 46, 13.8 12" fill="none" />
      <path className="fo-bloom__leaf fo-bloom__leaf--left" d="M13.2 44 C 6.4 42.6, 3.2 37.4, 2.6 32 C 8.8 33.4, 12.4 37.8, 13.2 44 Z" />
      <path className="fo-bloom__leaf fo-bloom__leaf--right" d="M14.6 34 C 21.4 32.4, 24.6 27.2, 25.2 21.8 C 19 23.2, 15.4 27.6, 14.6 34 Z" />
      <g className="fo-bloom__petals">
        <ellipse cx="8" cy="13" rx="4.4" ry="2.9" transform="rotate(-35 8 13)" />
        <ellipse cx="20" cy="13" rx="4.4" ry="2.9" transform="rotate(35 20 13)" />
        <ellipse className="fo-bloom__crown" cx="14" cy="10" rx="4.8" ry="3.2" />
      </g>
    </svg>
  );
}

// Grass along the bottom of the desk; the desk's tags grow on it and bloom when picked.
export function TagStrip({ desk }) {
  const { ui } = getState();
  const islands = deskIslands(desk);
  const tags = useMemo(() => [...tagVocabulary(islands).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, STRIP_TAGS_MAX), [islands]);
  const active = new Set(ui.tagFilter);
  const bloomed = useRef(new Set());   // flowers already up; only new ones play the sprout
  const sprouting = new Set();
  active.forEach((tag) => { if (!bloomed.current.has(tag)) sprouting.add(tag); });
  useEffect(() => { bloomed.current = new Set(active); });
  if (!tags.length && !active.size) return null;

  return (
    <div className="fo-tagstrip" onPointerDown={(e) => e.stopPropagation()}>
      <div className="fo-tagstrip__ground" aria-hidden="true" />
      <div className="fo-tagstrip__row">
        {tags.map(([tag, count]) => {
          const on = active.has(tag);
          const seed = hashString(tag);
          const style = on ? {
            '--bloom-lift': `${48 + (seed % 13)}px`,
            '--bloom-dur': `${420 + ((seed >>> 4) % 200)}ms`,
            '--bloom-delay': `${((seed >>> 8) % 5) * 30}ms`,
            '--bloom-flutter': `${2600 + ((seed >>> 6) % 1400)}ms`,
          } : undefined;
          return (
            <span key={tag} className="fo-tagstrip__slot" data-bloomed={on ? 'true' : undefined} data-sprouting={sprouting.has(tag) ? 'true' : undefined} style={style}>
              {on && <Bloom />}
              <button type="button" className="fo-tagstrip__tag" aria-pressed={on} onClick={() => toggleTagFilter(tag)} title={on ? 'Clear this tag' : 'Show only islands with this tag'}>
                #{tag}<span>{count}</span>
              </button>
            </span>
          );
        })}
        {active.size > 0 && <button type="button" className="fo-tagstrip__clear" onClick={clearTagFilter}>clear</button>}
      </div>
    </div>
  );
}

// ==== TOOLS ====
const TOOLS = [
  { id: 'pointer', glyph: GLYPH.smartpoint, title: 'Select and draw new things' },
  { id: 'terminal', glyph: '􀩼', title: 'Terminal — drag on an island' },
  { id: 'doc', glyph: GLYPH.file, title: 'Document — drag on an island' },
  { id: 'attach', glyph: GLYPH.attach, title: 'Bring in files — drag on an island' },
  { id: 'folder', glyph: GLYPH.folder, title: 'Link a folder — drag on an island' },
  { id: 'web', glyph: '􀆪', title: 'Webview — drag on an island' },
  { id: 'text', glyph: GLYPH.text, title: 'Thoughts — drag on an island' },
  { id: 'pencil', glyph: GLYPH.pencil, title: 'Visual planning — drag on an island' },
];

export function TopBar({ desk, focusIsland }) {
  const { ui } = getState();
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && searchRef.current?.closest('.fo-root')?.matches(':hover')) {
        e.preventDefault();
        searchRef.current.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const newIsland = () => {
    const rect = stageRect();
    const at = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setUi({ naming: { rect: { x: snap(at.x - ISLAND_MIN.w), y: snap(at.y - ISLAND_MIN.h / 2), w: ISLAND_MIN.w * 2, h: ISLAND_MIN.h * 1.4 }, screen: { x: rect.left + rect.width / 2 - 140, y: rect.top + 80 } } });
  };

  const jumpToMatch = () => {
    const q = ui.query.trim().toLowerCase().replace(/^#/, '');
    if (!q) return;
    const hit = deskIslands(desk).find((i) => [i.name, ...i.tags, i.status].some((t) => String(t).toLowerCase().includes(q)));
    if (hit) setUi({ zoomTo: hit.id, selection: { islandId: hit.id } });
    else toast('Nothing on this desk matches');
  };

  return (
    <header className="fo-top">
      <div className="fo-top__left">
        <button type="button" className="fo-top__btn" onClick={newIsland} title="New island"><span className="fo-glyph">{GLYPH.plus}</span></button>
        <button type="button" className="fo-top__btn" aria-pressed={ui.panel === 'desks'} onClick={() => setUi({ panel: ui.panel === 'desks' ? null : 'desks' })} title="Desks">
          <span className="fo-glyph">{GLYPH.sidebar}</span>
        </button>
        <button type="button" className="fo-top__desk" onClick={() => setUi({ panel: 'desks' })}>
          <span className="fo-glyph">{GLYPH.laptop}</span>{desk.name}
        </button>
        {focusIsland && (
          <nav className="fo-top__crumbs">
            <span className="fo-glyph">{GLYPH.chevron}</span>
            <button type="button" onClick={() => setUi({ zoomTo: focusIsland.id })}>{focusIsland.name}</button>
          </nav>
        )}

        <button type="button" className="fo-controls__new" onClick={() => setUi({ panel: 'desks', deskEditId: 'new' })}>
          <span className="fo-glyph">{GLYPH.plus}</span>
        </button>

      </div>
      <div className="fo-top__brand">islands</div>
      <div className="fo-top__right">
        <span className="fo-whisper fo-top__save">{ui.saveState}</span>
        <label className="fo-top__search">
          <span className="fo-glyph">{GLYPH.search}</span>
          <input
            ref={searchRef}
            value={ui.query}
            placeholder="Search"
            onChange={(e) => setUi({ query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') jumpToMatch();
              if (e.key === 'Escape') setUi({ query: '' });
            }}
          />
          {ui.query.trim() && (
            <button
              type="button"
              className="fo-top__save-desk"
              title="Make a desk from this search"
              onClick={() => {
                const value = ui.query.trim();
                createDesk({ name: value, rule: value.startsWith('#') ? { type: 'tag', value: value.slice(1) } : { type: 'text', value } });
                setUi({ query: '' });
              }}
            ><span className="fo-glyph">{GLYPH.desk}</span></button>
          )}
        </label>
        <button
          type="button"
          className="fo-top__btn"
          aria-pressed={ui.panel === 'journal'}
          onClick={() => (ui.panel === 'journal' ? setUi({ panel: null }) : openPanel('journal', focusIsland?.id || ui.selection?.islandId || null))}
          title="Journal"
        ><span className="fo-glyph">{GLYPH.journal}</span></button>
      </div>
    </header>
  );
}

export function ToolPalette({ tool }) {
  return (
    <div className="fo-tools" role="toolbar">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="fo-tools__btn"
          aria-pressed={tool === t.id}
          onClick={() => setUi({ tool: t.id })}
          title={t.title}
        ><span className="fo-glyph">{t.glyph}</span></button>
      ))}
    </div>
  );
}

export function DeskControls({ desk, rects, stack, minimap }) {
  const [zoom, setZoom] = useState(Math.round(getCamera().scale * 100));
  const [switcher, setSwitcher] = useState(false);
  const { desks } = getState();
  useEffect(() => onCamera((cam) => setZoom(Math.round(cam.scale * 100))), []);

  return (
    <div className="fo-controls">

      <div className="fo-controls__row">
        <button type="button" className="fo-controls__btn" aria-pressed={stack} onClick={() => setUi({ stack: !stack })} title="Flip through islands">
          <span className="fo-glyph">{GLYPH.stack}</span>
        </button>
        <button type="button" className="fo-controls__btn" aria-pressed={minimap} onClick={() => setUi({ minimap: !minimap })} title="Map">
          <span className="fo-glyph">{GLYPH.map}</span>
        </button>
        {!stack && (
          <button type="button" className="fo-controls__btn" onClick={() => { const next = arrangeByTags(); if (next.length) requestAnimationFrame(() => frameRects(next)); }} title="Arrange islands by tag">
            <span className="fo-glyph">{GLYPH.tag}</span>
          </button>
        )}
        <div className="fo-controls__zoom">
          <button type="button" onClick={() => zoomBy(1 / 1.2)} title="Zoom out"><span className="fo-glyph">{GLYPH.minus}</span></button>
          <button
            type="button"
            className="fo-controls__pct"
            title="Fit the desk"
            onClick={() => frameRects(rects)}
          >{zoom}%</button>
          <button type="button" onClick={() => zoomBy(1.2)} title="Zoom in"><span className="fo-glyph">{GLYPH.plus}</span></button>
        </div>
      </div>
    </div>
  );
}
