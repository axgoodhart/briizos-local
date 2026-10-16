import { updateCardData } from '../store';
import { GLYPH } from '../catalog';
import { money, uid } from '../util';
import { EditableText } from './fields';

export default function MonetizeCard({ island, card }) {
  const rows = card.data.rows || [];
  const currency = card.data.currency || '$';
  const income = rows.filter((r) => r.kind !== 'cost').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const costs = rows.filter((r) => r.kind === 'cost').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const setRows = (fn) => updateCardData(island.id, card.id, (data) => ({ rows: fn(data.rows || []) }));

  return (
    <div className="fo-money">
      <table className="fo-money__table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-kind={row.kind}>
              <td>
                <button
                  type="button"
                  className="fo-money__kind"
                  onClick={() => setRows((all) => all.map((r) => (r.id === row.id ? { ...r, kind: r.kind === 'cost' ? 'income' : 'cost' } : r)))}
                  title={row.kind === 'cost' ? 'Cost — click for income' : 'Income — click for cost'}
                >{row.kind === 'cost' ? '−' : '+'}</button>
              </td>
              <td className="fo-money__label">
                <EditableText
                  multiline={false}
                  value={row.label}
                  onCommit={(label) => setRows((all) => (label.trim() ? all.map((r) => (r.id === row.id ? { ...r, label } : r)) : all.filter((r) => r.id !== row.id)))}
                />
              </td>
              <td className="fo-money__amount">
                <input
                  type="number"
                  step="0.01"
                  value={row.amount ?? 0}
                  onChange={(e) => setRows((all) => all.map((r) => (r.id === row.id ? { ...r, amount: Number(e.target.value) } : r)))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="fo-icon-btn"
        onClick={() => setRows((all) => [...all, { id: uid('row'), label: 'New line', amount: 0, kind: 'income' }])}
        title="Add a line"
      ><span className="fo-glyph">{GLYPH.plus}</span></button>
      <dl className="fo-money__totals">
        <div><dt>In</dt><dd>{money(income, currency)}</dd></div>
        <div><dt>Out</dt><dd>{money(costs, currency)}</dd></div>
        <div data-net={income - costs < 0 ? 'negative' : 'positive'}><dt>Net</dt><dd>{money(income - costs, currency)}</dd></div>
      </dl>
      <EditableText
        className="fo-money__note"
        value={card.data.note || ''}
        placeholder="How this makes money"
        onCommit={(note) => updateCardData(island.id, card.id, { note })}
      />
    </div>
  );
}
