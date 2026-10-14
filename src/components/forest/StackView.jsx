import { useEffect, useMemo, useState } from 'react';
import {
  addCard, getState, islandTaskCount, liveAgentCount, select, setUi, startAgent,
} from './store';
import { ISLAND_PAD, PROJECT_QUESTIONS, cardType } from './catalog';
import { relativeTime } from './util';

// ==== STACK ====
const DEPTH = 260;
const SHIFT_X = 90;
const SHIFT_Y = -46;
const SHOWN_BEHIND = 4;
const PLANE_W = 760;

function Snapshot({ island }) {
  const right = Math.max(...island.cards.map((c) => c.x + c.w), 400);
  const bottom = Math.max(...island.cards.map((c) => c.y + c.h), 260);
  const scale = (PLANE_W - ISLAND_PAD * 2) / (right + 40);
  return (
    <div className="fo-plane__content">
      <h2 className="fo-plane__name">{island.name}</h2>
      <div className="fo-plane__cards" style={{ height: bottom * scale }}>
        {island.cards.map((card) => (
          <div
            key={card.id}
            className="fo-plane__card"
            data-kind={card.kind}
            style={{ left: card.x * scale, top: card.y * scale, width: card.w * scale, height: card.h * scale }}
          >
            {card.kind === 'thoughts' ? (
              <div className="fo-plane__qa">
                {(card.data.prompts?.length ? card.data.prompts : PROJECT_QUESTIONS).slice(0, 3).map((q) => (
                  <div key={q}><span>{q}</span><i /></div>
                ))}
              </div>
            ) : (
              <span className="fo-plane__card-title"><span className="fo-glyph">{cardType(card.kind).glyph}</span>{card.title}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAgent({ island, onPick }) {
  const [asking, setAsking] = useState(false);
  const live = island.cards.find((c) => c.kind === 'agent' && c.data.taskId && getState().tasks[c.data.taskId]?.status !== 'completed');
  if (live) {
    return <button type="button" className="fo-stack__fact" onClick={() => onPick(island, live.id)}>QUICK AGENT? <b>[{live.data.goal}]</b></button>;
  }
  if (asking) {
    return (
      <input
        className="fo-stack__goal"
        autoFocus
        placeholder="Goal"
        onBlur={() => setAsking(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAsking(false);
          if (e.key !== 'Enter' || !e.currentTarget.value.trim()) return;
          const goal = e.currentTarget.value.trim();
          const idle = island.cards.find((c) => c.kind === 'agent' && !c.data.taskId);
          const card = idle || addCard(island.id, { kind: 'agent', rect: { x: island.cards.reduce((m, c) => Math.max(m, c.x + c.w), 0) + 16, y: 0, w: 0, h: 0 }, select: false });
          if (card) startAgent(island.id, card.id, goal);
          setAsking(false);
        }}
      />
    );
  }
  return <button type="button" className="fo-stack__fact" onClick={() => setAsking(true)}>QUICK AGENT? <b>[GOAL NEEDED]</b></button>;
}

export default function StackView({ islands }) {
  const ordered = useMemo(() => [...islands].sort((a, b) => (Date.parse(b.lastSessionAt) || 0) - (Date.parse(a.lastSessionAt) || 0)), [islands]);
  const [index, setIndex] = useState(0);
  const front = ordered[Math.min(index, ordered.length - 1)];

  const pick = (island, cardId = null) => {
    if (!island) return;
    setUi({ stack: false, zoomTo: island.id, focusIslandId: island.id });
    select({ islandId: island.id, cardId });
  };

  useEffect(() => {
    let wheelLock = 0;
    const onKey = (e) => {
      if (/input|textarea/i.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setIndex((i) => Math.min(ordered.length - 1, i + 1)); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      if (e.key === 'Enter') pick(ordered[index]);
      if (e.key === 'Escape') setUi({ stack: false });
    };
    const onWheel = (e) => {
      if (!e.target.closest?.('.fo-stack')) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock < 260 || Math.abs(e.deltaY) < 8) return;
      wheelLock = now;
      setIndex((i) => Math.max(0, Math.min(ordered.length - 1, i + Math.sign(e.deltaY))));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel); };
  });

  if (!front) {
    return <div className="fo-stack"><div className="fo-stack__floor" /><p className="fo-desk__empty">No islands on this desk.</p></div>;
  }
  const tasks = islandTaskCount(front);
  const goalsCard = front.cards.find((c) => c.kind === 'goals');

  return (
    <div className="fo-stack" onPointerDown={(e) => e.stopPropagation()}>
      <div className="fo-stack__floor" aria-hidden="true" />
      <div className="fo-stack__scene">
        {ordered.map((island, i) => {
          const d = i - index;
          if (d < -1 || d > SHOWN_BEHIND) return null;
          return (
            <button
              key={island.id}
              type="button"
              className="fo-plane"
              data-front={d === 0 ? 'true' : undefined}
              data-gone={d < 0 ? 'true' : undefined}
              style={{
                '--accent': island.accent,
                '--accent-rgb': island.accentRgb,
                width: PLANE_W,
                transform: `translate3d(${d * SHIFT_X}px, ${d * SHIFT_Y}px, ${-d * DEPTH}px) rotateX(38deg) rotateZ(-7deg)`,
                zIndex: 100 - i,
              }}
              onClick={() => (d === 0 ? pick(island) : setIndex(i))}
            >
              <Snapshot island={island} />
            </button>
          );
        })}
      </div>
      <div className="fo-stack__facts" style={{ '--accent': front.accent }}>
        <h1 className="fo-stack__name">{front.name}</h1>
        <p className="fo-stack__fact">LAST SESSION: <b>{relativeTime(front.lastSessionAt).toUpperCase()}</b></p>
        <QuickAgent island={front} onPick={pick} />
        <button type="button" className="fo-stack__fact" onClick={() => pick(front, goalsCard?.id || null)}>
          TASK LIST? <b>[{tasks} {tasks === 1 ? 'ITEM' : 'ITEMS'}]</b>
        </button>
        {liveAgentCount(front) > 1 && <p className="fo-stack__fact">AGENTS: <b>{liveAgentCount(front)}</b></p>}
        <span className="fo-whisper fo-stack__count">{index + 1} / {ordered.length}</span>
      </div>
    </div>
  );
}

