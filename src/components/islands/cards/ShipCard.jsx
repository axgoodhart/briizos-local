import logger from '../../../lib/logger';
import { addEntry, updateCardData, updateIsland } from '../store';
import { GLYPH } from '../catalog';
import { uid, whenShort } from '../util';
import { AddLine, Check, EditableText } from './fields';

export default function ShipCard({ island, card }) {
  const steps = card.data.steps || [];
  const done = steps.filter((s) => s.done).length;
  const ready = steps.length > 0 && done === steps.length;

  const setSteps = (fn) => updateCardData(island.id, card.id, (data) => ({ steps: fn(data.steps || []) }));

  const ship = () => {
    const at = new Date().toISOString();
    updateCardData(island.id, card.id, { shipped: true, shippedAt: at });
    updateIsland(island.id, { stage: island.stages.length - 1 });
    addEntry(island.id, 'ship', `Shipped${card.data.url ? `: ${card.data.url}` : '.'}`);
    logger.info('island.card', `“${island.name}” was marked shipped`, { card: card.title, link: card.data.url || 'none' });
  };

  if (card.data.shipped) {
    return (
      <div className="fo-ship fo-ship--done">
        <span className="fo-ship__mark fo-glyph">{GLYPH.check}</span>
        <p className="fo-ship__when">Shipped {whenShort(card.data.shippedAt)}</p>
        {card.data.url && (
          <button type="button" className="fo-link" onClick={() => window.api.islandOpenExternal?.(card.data.url)}>{card.data.url}</button>
        )}
        <button type="button" className="fo-btn" onClick={() => updateCardData(island.id, card.id, { shipped: false, shippedAt: null })}>Reopen</button>
      </div>
    );
  }

  return (
    <div className="fo-ship">
      <ul className="fo-goals__list">
        {steps.map((step) => (
          <li key={step.id} className="fo-goals__item" data-done={step.done ? 'true' : undefined}>
            <Check done={step.done} onToggle={() => setSteps((all) => all.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s)))} />
            <EditableText
              multiline={false}
              value={step.text}
              onCommit={(text) => setSteps((all) => (text.trim() ? all.map((s) => (s.id === step.id ? { ...s, text } : s)) : all.filter((s) => s.id !== step.id)))}
            />
          </li>
        ))}
      </ul>
      <AddLine placeholder="Add a step" onAdd={(text) => setSteps((all) => [...all, { id: uid('step'), text, done: false }])} />
      <div className="fo-ship__fields">
        <label className="fo-row">
          <span className="fo-row__name">Date</span>
          <input type="date" value={card.data.shipDate || ''} onChange={(e) => updateCardData(island.id, card.id, { shipDate: e.target.value })} />
        </label>
        <label className="fo-row">
          <span className="fo-row__name">Where</span>
          <EditableText multiline={false} value={card.data.url || ''} placeholder="Link" onCommit={(url) => updateCardData(island.id, card.id, { url: url.trim() })} />
        </label>
      </div>
      <button type="button" className="fo-loud" disabled={!ready} onClick={ship}>
        <span className="fo-glyph">{GLYPH.check}</span>Shipped
      </button>
    </div>
  );
}
