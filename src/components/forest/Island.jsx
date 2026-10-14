import { memo, useMemo, useRef, useState } from 'react';
import {
  cardsForView, moveIsland, openPanel, resizeIsland, select, setIslandView, setUi, updateIsland, addCard,
  importPaths, getIsland, addFilesToIsland,
} from './store';
import { getScale, screenToWorld } from './camera';
import { pickFiles, trackPointer } from './gestures';
import {
  CARD_MIN, GLYPH, GRID, ISLAND_HEAD, ISLAND_MIN, ISLAND_PAD, ISLAND_RAIL, ISLAND_VIEWS, cardType,
} from './catalog';
import { snap, uid } from './util';
import CardFrame from './CardFrame';

// Palette tools that make a card directly when you drag on an island.
export const TOOL_KINDS = { terminal: 'terminal', doc: 'docs', web: 'webview', text: 'thoughts', pencil: 'planning' };

function packCards(cards) {
  let x = 0;
  return [...cards]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((card) => {
      const placed = { ...card, x, y: 0 };
      x += card.w + GRID * 2;
      return placed;
    });
}

function chipsFor(island) {
  const counts = new Map();
  island.cards.forEach((card) => {
    const files = card.kind === 'docs' || card.kind === 'media' ? (card.data.fileIds || []).length : 0;
    counts.set(card.kind, (counts.get(card.kind) || 0) + (files || 1));
  });
  return [...counts.entries()].map(([kind, count]) => ({ kind, count, glyph: cardType(kind).glyph }));
}

function IslandSummary({ island, onAdd }) {
  const chips = useMemo(() => chipsFor(island), [island]);
  return (
    <div className="fo-summary">
      <div className="fo-summary__chips">
        {chips.map((chip) => (
          <span key={chip.kind} className="fo-summary__chip" data-kind={chip.kind}>
            <span className="fo-glyph">{chip.glyph}</span>×{chip.count}
          </span>
        ))}
        <button type="button" className="fo-summary__add" onClick={onAdd} title="Add a card">{GLYPH.plus}</button>
      </div>
      <h2 className="fo-summary__name">{island.name}</h2>
    </div>
  );
}

function NodeRail({ island, cards, height, terminals, tasks }) {
  return (
    <div className="fo-rail" aria-hidden="false">
      {cards.map((card) => {
        const cx = ISLAND_PAD + card.x + card.w / 2;
        const top = ISLAND_HEAD + card.y + card.h;
        const task = card.kind === 'agent' ? tasks[card.data.taskId] : null;
        const live = (card.kind === 'terminal' && terminals[card.id]?.running)
          || (task && task.automated && ['active', 'in_progress', 'running', 'pending'].includes(task.status));
        const waiting = task?.status === 'waiting';
        return (
          <div key={card.id} className="fo-rail__node-wrap" style={{ left: cx, top, height: height - top }}>
            <span className="fo-rail__line" />
            <button
              type="button"
              className="fo-rail__node"
              data-kind={card.kind}
              data-live={live ? 'true' : undefined}
              data-waiting={waiting ? 'true' : undefined}
              title={card.title}
              onClick={(e) => {
                e.stopPropagation();
                if (card.kind === 'thoughts') setUi({ questions: { islandId: island.id } });
                select({ islandId: island.id, cardId: card.id });
              }}
            >
              <span className="fo-glyph">{cardType(card.kind).glyph}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ViewMenu({ islandId, current, onClose }) {
  return (
    <div className="fo-menu fo-island__viewmenu" onPointerDown={(e) => e.stopPropagation()}>
      {ISLAND_VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          className="fo-menu__item"
          aria-pressed={current === view.id}
          onClick={() => { setIslandView(islandId, view.id); onClose(); }}
        >{view.label}</button>
      ))}
    </div>
  );
}

const Island = memo(function Island({
  island, x, y, viewId, showAgents, summary, selected, selectedCardId, dimmed, tool, fileStatus, terminals, tasks,
}) {
  const ref = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [viewMenu, setViewMenu] = useState(false);
  const [marquee, setMarquee] = useState(null);
  const view = viewId || 'full';
  const packed = view !== 'full';
  const visible = useMemo(() => cardsForView(island, view, showAgents), [island, view, showAgents]);
  const cards = useMemo(() => (packed ? packCards(visible) : visible), [visible, packed]);
  const size = useMemo(() => {
    if (!packed) return { w: island.w, h: island.h };
    const right = cards.reduce((m, c) => Math.max(m, c.x + c.w), 0);
    const bottom = cards.reduce((m, c) => Math.max(m, c.y + c.h), 0);
    return { w: Math.max(ISLAND_MIN.w, right + ISLAND_PAD * 2), h: Math.max(ISLAND_MIN.h, bottom + ISLAND_HEAD + ISLAND_RAIL + ISLAND_PAD) };
  }, [packed, cards, island.w, island.h]);
  const viewLabel = ISLAND_VIEWS.find((v) => v.id === view)?.label || 'Full view';

  const startMove = (event) => {
    if (event.button !== 0 || event.target.closest('.fo-island__gear, .fo-summary__add')) return;
    const onView = !!event.target.closest('.fo-island__view');
    const el = ref.current;
    trackPointer(event, {
      threshold: 3,
      onMove: (dx, dy) => {
        const scale = getScale();
        el.style.left = `${x + dx / scale}px`;
        el.style.top = `${y + dy / scale}px`;
        el.dataset.moving = 'true';
      },
      onEnd: (dx, dy, e, clicked) => {
        delete el.dataset.moving;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        if (clicked) {
          if (onView) setViewMenu((v) => !v);
          else select({ islandId: island.id });
          return;
        }
        const scale = getScale();
        moveIsland(island.id, { x: x + dx / scale, y: y + dy / scale });
      },
    });
  };

  const startResize = (event) => {
    const el = ref.current;
    trackPointer(event, {
      onMove: (dx, dy) => {
        const scale = getScale();
        el.style.width = `${Math.max(ISLAND_MIN.w, size.w + dx / scale)}px`;
        el.style.height = `${Math.max(ISLAND_MIN.h, size.h + dy / scale)}px`;
      },
      onEnd: (dx, dy) => {
        const scale = getScale();
        el.style.width = `${size.w}px`;
        el.style.height = `${size.h}px`;
        resizeIsland(island.id, { w: size.w + dx / scale, h: size.h + dy / scale });
      },
    });
  };

  // Ground coordinates are relative to the island's card area.
  const groundPoint = (clientX, clientY) => {
    const at = screenToWorld(clientX, clientY);
    return { x: at.x - x - ISLAND_PAD, y: at.y - y - ISLAND_HEAD };
  };

  const placeFromTool = async (rect, screen) => {
    if (tool === 'attach') {
      const paths = await pickFiles();
      if (paths.length) importPaths(paths, { islandId: island.id });
      return;
    }
    if (tool === 'folder') {
      const dir = await window.api.forestOpenDirectoryDialog?.();
      if (!dir) return;
      const name = dir.split('/').filter(Boolean).pop() || dir;
      const record = { id: uid('file'), name, path: dir, typeGroup: 'folder', ext: '', size: 0, modifiedAt: new Date().toISOString() };
      const card = addCard(island.id, { kind: 'docs', title: name, rect, data: { fileIds: [], openFileId: record.id } });
      addFilesToIsland(island.id, [record], { cardId: card?.id, source: 'linked folder' });
      if (!getIsland(island.id)?.rootPath) updateIsland(island.id, { rootPath: dir });
      return;
    }
    if (TOOL_KINDS[tool]) {
      addCard(island.id, { kind: TOOL_KINDS[tool], rect });
      return;
    }
    setUi({ menu: { islandId: island.id, rect, screen } });
  };

  const onGroundPointerDown = (event) => {
    if (event.target !== event.currentTarget || event.button !== 0 || tool === 'hand') return;
    setUi({ menu: null, naming: null }, false);
    const origin = groundPoint(event.clientX, event.clientY);
    trackPointer(event, {
      threshold: 4,
      onMove: (dx, dy) => {
        const scale = getScale();
        setMarquee({
          x: Math.min(origin.x, origin.x + dx / scale), y: Math.min(origin.y, origin.y + dy / scale),
          w: Math.abs(dx / scale), h: Math.abs(dy / scale),
        });
      },
      onEnd: (dx, dy, e, clicked) => {
        setMarquee(null);
        if (clicked) { select({ islandId: island.id }); return; }
        const scale = getScale();
        const w = Math.abs(dx / scale);
        const h = Math.abs(dy / scale);
        if (w < CARD_MIN.w / 3 && h < CARD_MIN.h / 3) return;
        const rect = {
          x: snap(Math.max(0, Math.min(origin.x, origin.x + dx / scale))),
          y: snap(Math.max(0, Math.min(origin.y, origin.y + dy / scale))),
          w: snap(Math.max(CARD_MIN.w, w)),
          h: snap(Math.max(CARD_MIN.h, h)),
        };
        placeFromTool(rect, { x: e.clientX, y: e.clientY });
      },
    });
  };

  const onGroundDoubleClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const at = groundPoint(event.clientX, event.clientY);
    setUi({ menu: { islandId: island.id, rect: { x: snap(Math.max(0, at.x)), y: snap(Math.max(0, at.y)), w: 0, h: 0 }, screen: { x: event.clientX, y: event.clientY } } });
  };

  const commitName = (value) => {
    setRenaming(false);
    const name = value.trim();
    if (name && name !== island.name) updateIsland(island.id, { name });
  };

  return (
    <section
      ref={ref}
      className="fo-island"
      data-island-id={island.id}
      data-selected={selected ? 'true' : undefined}
      data-dimmed={dimmed ? 'true' : undefined}
      data-summary={summary ? 'true' : undefined}
      style={{ left: x, top: y, width: size.w, height: size.h, '--accent': island.accent, '--accent-rgb': island.accentRgb }}
    >
      {summary ? (
        <div className="fo-island__summary-hit" onPointerDown={startMove} onDoubleClick={() => setUi({ zoomTo: island.id })}>
          <IslandSummary island={island} onAdd={(e) => { e.stopPropagation(); select({ islandId: island.id }); setUi({ focusIslandId: island.id, zoomTo: island.id }); }} />
        </div>
      ) : (
        <>
          <header className="fo-island__head">
            <div className="fo-island__tab" onPointerDown={startMove}>
              <button type="button" className="fo-island__view">{viewLabel}</button>
              <button type="button" className="fo-island__gear" onClick={(e) => { e.stopPropagation(); openPanel('settings', island.id); }} title="Island settings">
                <span className="fo-glyph">{GLYPH.gear}</span>
              </button>
            </div>
            {viewMenu && <ViewMenu islandId={island.id} current={view} onClose={() => setViewMenu(false)} />}
            {renaming ? (
              <input
                className="fo-island__name-input"
                defaultValue={island.name}
                autoFocus
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => commitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setRenaming(false);
                }}
              />
            ) : (
              <h2 className="fo-island__name" onPointerDown={startMove} onDoubleClick={() => setRenaming(true)}>{island.name}</h2>
            )}
          </header>
          <div
            className="fo-island__ground"
            data-tool={tool}
            style={{ left: ISLAND_PAD, top: ISLAND_HEAD, width: size.w - ISLAND_PAD * 2, height: size.h - ISLAND_HEAD - ISLAND_RAIL }}
            onPointerDown={onGroundPointerDown}
            onDoubleClick={onGroundDoubleClick}
          >
            {cards.map((card) => (
              <CardFrame
                key={card.id}
                island={island}
                card={card}
                packed={packed}
                selected={selectedCardId === card.id}
                isMain={island.mainCardId === card.id}
                terminal={card.kind === 'terminal' ? terminals[card.id] : null}
                task={card.kind === 'agent' ? tasks[card.data.taskId] : null}
                tasks={card.kind === 'goals' ? tasks : null}
                fileStatus={card.kind === 'docs' || card.kind === 'media' ? fileStatus : null}
              />
            ))}
            {marquee && <div className="fo-marquee fo-marquee--card" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
          </div>
          <NodeRail island={island} cards={cards} height={size.h} terminals={terminals} tasks={tasks} />
          {!packed && <div className="fo-island__resize" onPointerDown={startResize} />}
        </>
      )}
    </section>
  );
});

export default Island;
