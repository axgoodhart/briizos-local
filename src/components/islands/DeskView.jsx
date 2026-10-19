import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_DESK_ID, deskPositions, getState, importPaths, matchesTagFilter, select, setDeskViewport, setUi,
} from './store';
import {
  attachCamera, detachCamera, frameRects, getCamera, getScale, onCamera, panBy, screenToWorld, viewRect,
} from './camera';
import { trackPointer } from './gestures';
import { useStageInput } from './stageInput';
import { ISLAND_MIN } from './catalog';
import { normalizeText, rectsOverlap, snap } from './util';
import Island from './Island';
import Minimap from './Minimap';

// ==== DESK INPUT ====
const MIN_MARQUEE_PX = 48;
const CULL_MARGIN = 0.5;               // islands within half a screen of the view stay drawn

function matchesQuery(island, query) {
  if (!query) return true;
  const q = normalizeText(query.replace(/^#/, ''));
  return [island.name, island.status, island.field, ...island.tags, ...island.cards.map((c) => c.title)]
    .some((text) => normalizeText(text).includes(q));
}

export default function DeskView({ desk, islands }) {
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const [summary, setSummary] = useState(false);
  const [marquee, setMarquee] = useState(null);
  const spaceDown = useStageInput(stageRef);
  const [visibleKey, setVisibleKey] = useState(null);
  const S = getState();
  const { ui } = S;
  const arrangement = ui.tagArrangement?.deskId === desk.id ? ui.tagArrangement : null;
  const positions = arrangement ? arrangement.positions : deskPositions(desk, islands);
  const sizeOf = (island) => arrangement?.sizes[island.id] || { w: island.w, h: island.h };
  const latest = useRef({ islands, positions, sizeOf });
  latest.current = { islands, positions, sizeOf };
  const lineRef = useRef(desk.previewZoom);   // the zoom line is a desk setting; read live without re-attaching the camera
  lineRef.current = desk.previewZoom;

  // Only islands near the view are in the page; the rest cost no graphics memory.
  const cull = () => {
    const view = viewRect(CULL_MARGIN);
    const { islands: list, positions: pos, sizeOf: sz } = latest.current;
    const key = list.filter((i) => pos[i.id] && rectsOverlap(view, { ...pos[i.id], ...sz(i) })).map((i) => i.id).join(',');
    setVisibleKey((was) => (was === key ? was : key));
  };
  useEffect(cull);
  const visibleIds = useMemo(() => (visibleKey === null ? null : new Set(visibleKey.split(','))), [visibleKey]);

  // Camera per desk: its saved view, or everything framed.
  useLayoutEffect(() => {
    const saved = desk.viewport || (desk.id === ALL_DESK_ID ? S.viewport : null);
    attachCamera(stageRef.current, worldRef.current, saved);
    if (!saved) {
      requestAnimationFrame(() => frameRects(islands.map((i) => ({ ...positions[i.id], w: i.w, h: i.h })), { animate: false }));
    }
    setSummary(getScale() < lineRef.current);
    let timer = null;
    let frame = 0;
    const off = onCamera((cam) => {
      setSummary((was) => (was !== cam.scale < lineRef.current ? cam.scale < lineRef.current : was));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(cull);
      clearTimeout(timer);
      timer = setTimeout(() => setDeskViewport(desk.id, getCamera()), 500);
    });
    return () => { off(); clearTimeout(timer); cancelAnimationFrame(frame); detachCamera(worldRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desk.id]);

  useEffect(() => { setSummary(getScale() < desk.previewZoom); }, [desk.previewZoom]);

  const startPan = (event) => {
    let last = { x: 0, y: 0 };
    trackPointer(event, {
      onMove: (dx, dy) => { panBy(dx - last.x, dy - last.y); last = { x: dx, y: dy }; },
    });
  };

  const onStagePointerDown = (event) => {
    if (event.target !== stageRef.current && event.target !== worldRef.current && !event.target.classList?.contains('fo-desk__grid')) return;
    if (spaceDown || event.button === 1 || ui.tool === 'hand') { startPan(event); return; }
    if (event.button !== 0) return;
    setUi({ menu: null, naming: null }, false);
    const origin = screenToWorld(event.clientX, event.clientY);
    trackPointer(event, {
      threshold: 4,
      onMove: (dx, dy) => {
        const scale = getScale();
        setMarquee({ x: Math.min(origin.x, origin.x + dx / scale), y: Math.min(origin.y, origin.y + dy / scale), w: Math.abs(dx / scale), h: Math.abs(dy / scale) });
      },
      onEnd: (dx, dy, e, clicked) => {
        setMarquee(null);
        if (clicked) { select(null); setUi({ focusIslandId: null }); return; }
        if (Math.abs(dx) < MIN_MARQUEE_PX || Math.abs(dy) < MIN_MARQUEE_PX) return;
        const scale = getScale();
        const rect = {
          x: snap(Math.min(origin.x, origin.x + dx / scale)),
          y: snap(Math.min(origin.y, origin.y + dy / scale)),
          w: snap(Math.max(ISLAND_MIN.w, Math.abs(dx / scale))),
          h: snap(Math.max(ISLAND_MIN.h, Math.abs(dy / scale))),
        };
        setUi({ naming: { rect, screen: { x: e.clientX, y: e.clientY } } });
      },
    });
  };

  const onDoubleClick = (event) => {
    if (event.target !== stageRef.current && event.target !== worldRef.current && !event.target.classList?.contains('fo-desk__grid')) return;
    const at = screenToWorld(event.clientX, event.clientY);
    setUi({ naming: { rect: { x: snap(at.x), y: snap(at.y), w: ISLAND_MIN.w * 2, h: ISLAND_MIN.h * 1.4 }, screen: { x: event.clientX, y: event.clientY } } });
  };

  const onDragOver = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
    event.preventDefault();
    const paths = Array.from(event.dataTransfer.files || []).map((f) => window.api.mediaGetFilePath(f)).filter(Boolean);
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const islandId = hit?.closest('[data-island-id]')?.dataset.islandId || null;
    const cardId = hit?.closest('[data-card-id]')?.dataset.cardId || null;
    importPaths(paths, { islandId, cardId, rect: screenToWorld(event.clientX, event.clientY) });
  };

  return (
    <main
      ref={stageRef}
      className="fo-desk"
      data-panning={spaceDown || ui.tool === 'hand' ? 'true' : undefined}
      onPointerDown={onStagePointerDown}
      onDoubleClick={onDoubleClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      tabIndex={-1}
    >
      {!desk.dim && (
        <div className="fo-aurora" aria-hidden="true"><i className="fo-aurora__a" /><i className="fo-aurora__b" /><i className="fo-aurora__c" /></div>
      )}
      <div className="fo-desk__grid" aria-hidden="true" />
      <div ref={worldRef} className="fo-world">
        {islands.filter((island) => !visibleIds || visibleIds.has(island.id) || ui.selection?.islandId === island.id).map((island) => (
          <Island
            key={island.id}
            island={island}
            x={positions[island.id].x}
            y={positions[island.id].y}
            viewId={desk.islandViews?.[island.id] || desk.view}
            showAgents={desk.showAgents}
            summary={summary}
            selected={ui.selection?.islandId === island.id}
            selectedCardId={ui.selection?.islandId === island.id ? ui.selection.cardId || null : null}
            dimmed={!matchesQuery(island, ui.query) || !matchesTagFilter(island, ui.tagFilter)}
            tool={ui.tool}
            fileStatus={S.fileStatus}
            terminals={S.terminals}
            tasks={S.tasks}
            forcedSize={arrangement?.sizes[island.id] || null}
          />
        ))}
        {arrangement?.rows.map((row) => (
          <div key={row.tag || 'none'} className="fo-desk__rowlabel" style={{ left: row.x, top: row.y - 96 }}>
            {row.tag ? `#${row.tag}` : 'no tags'}<span className="fo-whisper">{row.count}</span>
          </div>
        ))}
        {marquee && (
          <div className="fo-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
        )}
      </div>
      {!islands.length && (
        <div className="fo-desk__empty">
          Drag across empty space to make an island.
        </div>
      )}
      {ui.minimap && <Minimap desk={desk} islands={islands} positions={positions} />}
    </main>
  );
}
