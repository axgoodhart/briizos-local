import { memo, useRef, useState } from 'react';
import { moveCard, removeCard, resizeCard, saveCardTemplate, select, setMainCard, updateCard } from './store';
import { getScale } from './camera';
import { trackPointer } from './gestures';
import { CARD_MIN, GLYPH, cardType } from './catalog';
import CardBody from './cards';

function CardMenu({ island, card, isMain, onRename, onClose }) {
  const [naming, setNaming] = useState(false);
  return (
    <div className="fo-menu fo-card__menu" onPointerDown={(e) => e.stopPropagation()}>
      {naming ? (
        <input
          className="fo-input"
          autoFocus
          defaultValue={card.title}
          placeholder="Template name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { saveCardTemplate(island.id, card.id, e.currentTarget.value); onClose(); }
            if (e.key === 'Escape') onClose();
          }}
        />
      ) : (
        <>
          <button type="button" className="fo-menu__item" onClick={() => { onRename(); onClose(); }}>Rename</button>
          {!isMain && <button type="button" className="fo-menu__item" onClick={() => { setMainCard(island.id, card.id); onClose(); }}>Make main view</button>}
          <button type="button" className="fo-menu__item" onClick={() => setNaming(true)}>Save as template</button>
          <button type="button" className="fo-menu__item" data-danger="true" onClick={() => { removeCard(island.id, card.id); onClose(); }}>Remove card</button>
        </>
      )}
    </div>
  );
}

const CardFrame = memo(function CardFrame({ island, card, packed, selected, isMain, terminal, task, tasks, fileStatus }) {
  const ref = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const type = cardType(card.kind);

  const startDrag = (event) => {
    if (event.button !== 0 || event.target.closest('button, input')) return;
    select({ islandId: island.id, cardId: card.id });
    if (packed) return;
    const el = ref.current;
    trackPointer(event, {
      threshold: 3,
      onMove: (dx, dy) => {
        const scale = getScale();
        el.style.left = `${card.x + dx / scale}px`;
        el.style.top = `${card.y + dy / scale}px`;
        el.dataset.moving = 'true';
      },
      onEnd: (dx, dy, e, clicked) => {
        delete el.dataset.moving;
        el.style.left = `${card.x}px`;
        el.style.top = `${card.y}px`;
        if (clicked) return;
        const scale = getScale();
        moveCard(island.id, card.id, { x: card.x + dx / scale, y: card.y + dy / scale });
      },
    });
  };

  const startResize = (event) => {
    const el = ref.current;
    trackPointer(event, {
      onMove: (dx, dy) => {
        const scale = getScale();
        el.style.width = `${Math.max(CARD_MIN.w, card.w + dx / scale)}px`;
        el.style.height = `${Math.max(CARD_MIN.h, card.h + dy / scale)}px`;
      },
      onEnd: (dx, dy) => {
        const scale = getScale();
        el.style.width = `${card.w}px`;
        el.style.height = `${card.h}px`;
        resizeCard(island.id, card.id, { w: card.w + dx / scale, h: card.h + dy / scale });
      },
    });
  };

  const commitTitle = (value) => {
    setRenaming(false);
    const title = value.trim();
    if (title && title !== card.title) updateCard(island.id, card.id, { title });
  };

  return (
    <article
      ref={ref}
      className="fo-card"
      data-card-id={card.id}
      data-kind={card.kind}
      data-selected={selected ? 'true' : undefined}
      data-main={isMain ? 'true' : undefined}
      style={{ left: card.x, top: card.y, width: card.w, height: card.h }}
      onPointerDown={(e) => { e.stopPropagation(); if (!selected) select({ islandId: island.id, cardId: card.id }); }}
    >
      <header className="fo-card__head" onPointerDown={startDrag}>
        <span className="fo-glyph fo-card__glyph">{type.glyph}</span>
        {renaming ? (
          <input
            className="fo-card__title-input"
            autoFocus
            defaultValue={card.title}
            onBlur={(e) => commitTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setRenaming(false);
            }}
          />
        ) : (
          <span className="fo-card__title" onDoubleClick={() => setRenaming(true)}>{card.title}</span>
        )}
        <button type="button" className="fo-card__more" onClick={() => setMenu((m) => !m)} title="Card options">
          <span className="fo-glyph">{GLYPH.more}</span>
        </button>
      </header>
      {menu && <CardMenu island={island} card={card} isMain={isMain} onRename={() => setRenaming(true)} onClose={() => setMenu(false)} />}
      <div className="fo-card__body">
        <CardBody island={island} card={card} terminal={terminal} task={task} tasks={tasks} fileStatus={fileStatus} selected={selected} />
      </div>
      {!packed && <div className="fo-card__resize" onPointerDown={startResize} />}
    </article>
  );
});

export default CardFrame;
