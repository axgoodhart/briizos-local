import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import logger from '../../lib/logger';
import { closeCanvas, importPaths, openFullView, openPanel, select, setCanvasViewport, setUi } from './store';
import {
  attachCamera, centerOn, detachCamera, frameRects, getCamera, getScale, onCamera, panBy, screenToWorld, zoomBy,
} from './camera';
import { trackPointer } from './gestures';
import { useStageInput } from './stageInput';
import { CARD_MIN, GLYPH, cardType } from './catalog';
import { snap } from './util';
import CardFrame from './CardFrame';
import { placeFromTool } from './Island';

// ==== CANVAS ====
const FRAME_PAD = 120;                 // world units around the cards when the canvas opens
const SNAPSHOT_MIN_PX = 24;

// Pictures for the desk Preview: one window capture, cropped per card. Webview cards keep their own.
async function takeSnapshots(stage, island) {
  if (!window.api.islandSnapshotCards) return null;
  const bounds = stage.getBoundingClientRect();
  const cards = [];
  stage.querySelectorAll('.fo-card[data-card-id]').forEach((el) => {
    const card = island.cards.find((c) => c.id === el.dataset.cardId);
    if (!card || card.kind === 'webview') return;
    const r = (el.querySelector('.fo-card__body') || el).getBoundingClientRect(); // body only: the desk card draws its own header
    const x = Math.max(r.left, bounds.left);
    const y = Math.max(r.top, bounds.top);
    const right = Math.min(r.right, bounds.right);
    const bottom = Math.min(r.bottom, bounds.bottom);
    if (right - x < SNAPSHOT_MIN_PX || bottom - y < SNAPSHOT_MIN_PX) return;
    cards.push({ cardId: card.id, rect: { x, y, width: right - x, height: bottom - y } });
  });
  if (!cards.length) return {};
  try {
    const viewport = { width: window.innerWidth, height: window.innerHeight }; // CSS px, so page zoom and Retina both map onto the capture
    const result = await window.api.islandSnapshotCards({ islandId: island.id, cards, viewport });
    return result?.snapshots || {};
  } catch (error) {
    logger.warn('island.preview', `Could not take the card pictures for “${island.name}”; the desk Preview keeps its last ones.`, { problem: error?.message });
    return null;
  }
}

export default function CanvasView({ island, selectedCardId, tool, fileStatus, terminals, tasks }) {
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const [marquee, setMarquee] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [closing, setClosing] = useState(false);
  const spaceDown = useStageInput(stageRef);
  const islandRef = useRef(island);
  islandRef.current = island;

  // Camera: the island's remembered canvas view, else every card framed.
  useLayoutEffect(() => {
    attachCamera(stageRef.current, worldRef.current, island.canvasViewport);
    if (!island.canvasViewport) {
      const rects = island.cards.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
      requestAnimationFrame(() => frameRects(rects.length ? rects : [{ x: 0, y: 0, w: 1200, h: 700 }], { pad: FRAME_PAD, maxScale: 1, animate: false }));
    }
    setZoom(Math.round(getScale() * 100));
    let timer = null;
    const off = onCamera((cam) => {
      setZoom(Math.round(cam.scale * 100));
      clearTimeout(timer);
      timer = setTimeout(() => setCanvasViewport(island.id, getCamera()), 500);
    });
    return () => { off(); clearTimeout(timer); detachCamera(worldRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island.id]);

  const leave = async () => {
    if (closing) return;
    setClosing(true);
    const snapshots = await takeSnapshots(stageRef.current, islandRef.current);
    closeCanvas({ snapshots });
  };
  const toFullScreen = async () => {
    if (closing) return;
    setClosing(true);
    const snapshots = await takeSnapshots(stageRef.current, islandRef.current);
    closeCanvas({ snapshots });
    openFullView(islandRef.current.id);
  };

  useEffect(() => {
    window.addEventListener('island-canvas-close', leave);
    return () => window.removeEventListener('island-canvas-close', leave);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const isGround = (target) => target === stageRef.current || target === worldRef.current || target.classList?.contains('fo-desk__grid') || target.classList?.contains('fo-canvas__ground');

  const startPan = (event) => {
    let last = { x: 0, y: 0 };
    trackPointer(event, { onMove: (dx, dy) => { panBy(dx - last.x, dy - last.y); last = { x: dx, y: dy }; } });
  };

  // Empty canvas: drag with the pointer tool draws a new card, like the island's ground on the desk.
  const onPointerDown = (event) => {
    if (!isGround(event.target)) return;
    if (spaceDown || event.button === 1 || tool === 'hand') { startPan(event); return; }
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
        if (clicked) { select({ islandId: island.id }); return; }
        const scale = getScale();
        const w = Math.abs(dx / scale);
        const h = Math.abs(dy / scale);
        if (w < CARD_MIN.w / 3 && h < CARD_MIN.h / 3) return;
        const rect = {
          x: snap(Math.min(origin.x, origin.x + dx / scale)),
          y: snap(Math.min(origin.y, origin.y + dy / scale)),
          w: snap(Math.max(CARD_MIN.w, w)),
          h: snap(Math.max(CARD_MIN.h, h)),
        };
        placeFromTool(island, tool, rect, { x: e.clientX, y: e.clientY });
      },
    });
  };

  const onDoubleClick = (event) => {
    if (!isGround(event.target)) return;
    const at = screenToWorld(event.clientX, event.clientY);
    setUi({ menu: { islandId: island.id, rect: { x: snap(at.x), y: snap(at.y), w: 0, h: 0 }, screen: { x: event.clientX, y: event.clientY } } });
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
    const cardId = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-card-id]')?.dataset.cardId || null;
    importPaths(paths, { islandId: island.id, cardId, rect: screenToWorld(event.clientX, event.clientY) });
  };

  const jumpTo = (card) => {
    select({ islandId: island.id, cardId: card.id });
    centerOn(card.x + card.w / 2, card.y + card.h / 2);
  };

  return (
    <main
      ref={stageRef}
      className="fo-desk fo-canvas"
      style={{ '--accent': island.accent, '--accent-rgb': island.accentRgb }}
      data-panning={spaceDown || tool === 'hand' ? 'true' : undefined}
      data-closing={closing ? 'true' : undefined}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      tabIndex={-1}
    >
      <div className="fo-desk__grid" aria-hidden="true" />
      <div ref={worldRef} className="fo-world">
        <div className="fo-canvas__ground" data-tool={tool} />
        {island.cards.map((card) => (
          <CardFrame
            key={card.id}
            island={island}
            card={card}
            packed={false}
            selected={selectedCardId === card.id}
            isMain={island.mainCardId === card.id}
            terminal={card.kind === 'terminal' ? terminals[card.id] : null}
            task={card.kind === 'agent' ? tasks[card.data.taskId] : null}
            tasks={card.kind === 'goals' || card.kind === 'agent' ? tasks : null}
            fileStatus={card.kind === 'docs' || card.kind === 'media' ? fileStatus : null}
          />
        ))}
        {marquee && <div className="fo-marquee fo-marquee--card" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
      </div>

      <div className="fo-canvas__frame" aria-hidden="true" />
      <div className="fo-canvas__tab" onPointerDown={(e) => e.stopPropagation()}>
        <span className="fo-full__tab-label">Canvas</span>
        <button type="button" className="fo-island__gear" onClick={() => openPanel('settings', island.id)} title="Island settings"><span className="fo-glyph">{GLYPH.gear}</span></button>
      </div>
      <div className="fo-canvas__corner" onPointerDown={(e) => e.stopPropagation()}>
        <div className="fo-controls__zoom fo-canvas__zoom">
          <button type="button" onClick={() => zoomBy(1 / 1.2)} title="Zoom out"><span className="fo-glyph">{GLYPH.minus}</span></button>
          <button
            type="button"
            className="fo-controls__pct"
            title="Fit every card"
            onClick={() => frameRects(island.cards.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })), { pad: FRAME_PAD, maxScale: 1 })}
          >{zoom}%</button>
          <button type="button" onClick={() => zoomBy(1.2)} title="Zoom in"><span className="fo-glyph">{GLYPH.plus}</span></button>
        </div>
        <button type="button" className="fo-icon-btn fo-full__close" onClick={() => openPanel('journal', island.id)} title="Journal"><span className="fo-glyph">{GLYPH.journal}</span></button>
        <button type="button" className="fo-icon-btn fo-full__close" onClick={toFullScreen} title="Full screen view"><span className="fo-glyph">{GLYPH.plus}</span></button>
        <button type="button" className="fo-icon-btn fo-full__close" onClick={leave} title="Back to the desk (Esc)"><span className="fo-glyph">{GLYPH.close}</span></button>
      </div>
      {!island.cards.length && <p className="fo-desk__empty">Drag across the canvas to make a card.</p>}

      <div className="fo-full__rail fo-canvas__rail" onPointerDown={(e) => e.stopPropagation()}>
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
              onClick={() => jumpTo(card)}
            >
              <span className="fo-glyph">{cardType(card.kind).glyph}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
