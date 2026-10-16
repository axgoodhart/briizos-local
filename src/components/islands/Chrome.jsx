import { useEffect, useRef, useState } from 'react';
import {
  ALL_DESK_ID, createDesk, deskIslands, getState, openPanel, setUi, switchDesk, toast,
} from './store';
import { frameRects, getCamera, onCamera, stageRect, zoomBy, screenToWorld } from './camera';
import { GLYPH, ISLAND_MIN } from './catalog';
import { snap } from './util';

// ==== TOOLS ====
const TOOLS = [
  { id: 'pointer', glyph: GLYPH.pointer, title: 'Select and draw new things' },
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
     <div className="fo-controls__desk-wrap">
        <button type="button" className="fo-controls__new" onClick={() => setUi({ panel: 'desks', deskEditId: 'new' })}>
          <span className="fo-glyph">{GLYPH.plus}</span>
        </button>

       
        {switcher && (
          <div className="fo-menu fo-controls__switcher" onPointerDown={(e) => e.stopPropagation()}>
            {desks.map((d) => (
              <button key={d.id} type="button" className="fo-menu__item" aria-pressed={d.id === desk.id} onClick={() => { switchDesk(d.id); setSwitcher(false); }}>
                {d.name}<span className="fo-whisper">{deskIslands(d).length}</span>
              </button>
            ))}   
          </div>
        )}
        <button
          type="button"
          className="fo-controls__desk"
          onClick={() => (stack ? setUi({ stack: false }) : setSwitcher((s) => !s))}
          title={stack ? 'Back to the desk' : 'Switch desk'}
        >
          <span className="fo-glyph">{GLYPH.stack}</span>{desk.id === ALL_DESK_ID ? 'All islands' : desk.name}
        </button>
      </div>
      <div className="fo-controls__row">
        <button type="button" className="fo-controls__btn" aria-pressed={stack} onClick={() => setUi({ stack: !stack })} title="Flip through islands">
          <span className="fo-glyph">{GLYPH.stack}</span>
        </button>
        <button type="button" className="fo-controls__btn" aria-pressed={minimap} onClick={() => setUi({ minimap: !minimap })} title="Map">
          <span className="fo-glyph">{GLYPH.map}</span>
        </button>
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
