import { useState } from 'react';
import {
  ALL_DESK_ID, closePanel, createDesk, deleteDesk, deskIslands, getState, setUi, switchDesk, updateDesk,
} from './store';
import { DESK_RULES, GLYPH, ISLAND_VIEWS } from './catalog';

function Segmented({ value, options, onChange }) {
  return (
    <div className="fo-seg">
      {options.map(([id, label]) => (
        <button key={String(id)} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

function DeskEditor({ desk, onDone }) {
  const { projects } = getState();
  const isNew = !desk;
  const isAll = desk?.id === ALL_DESK_ID;
  const [draft, setDraft] = useState(() => ({
    name: desk?.name || '',
    rule: desk?.rule?.type === 'all' ? { type: 'all', value: '' } : { type: desk?.rule?.type || 'manual', value: desk?.rule?.value ?? '' },
    islandIds: desk?.islandIds || [],
    view: desk?.view || 'full',
    showAgents: desk?.showAgents !== false,
    dim: desk?.dim === true,
  }));
  const rule = DESK_RULES.find((r) => r.type === draft.rule.type);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (isNew) {
      if (!draft.name.trim()) return;
      const created = createDesk(draft);
      updateDesk(created.id, { dim: draft.dim });
    } else {
      updateDesk(desk.id, isAll ? { view: draft.view, showAgents: draft.showAgents, dim: draft.dim } : draft);
    }
    onDone();
  };

  return (
    <div className="fo-desk-editor">
      {!isAll && (
        <input className="fo-desk-editor__name" autoFocus={isNew} value={draft.name} placeholder="Desk name" onChange={(e) => set({ name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && save()} />
      )}
      {!isAll && (
        <div className="fo-row fo-row--top">
          <span className="fo-row__name">Holds</span>
          <div className="fo-desk-editor__rule">
            <select value={draft.rule.type} onChange={(e) => set({ rule: { type: e.target.value, value: '' } })}>
              {DESK_RULES.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
            </select>
            {rule?.input && (
              <input
                value={draft.rule.value}
                placeholder={rule.input === 'days' ? 'days' : rule.input === 'letter' ? 'Q' : rule.input === 'tag' ? 'music' : 'word'}
                type={rule.input === 'days' ? 'number' : 'text'}
                onChange={(e) => set({ rule: { ...draft.rule, value: e.target.value } })}
              />
            )}
          </div>
        </div>
      )}
      {!isAll && (
        <div className="fo-desk-editor__islands">
          {projects.map((island) => (
            <button
              key={island.id}
              type="button"
              className="fo-chip-btn"
              style={{ '--accent': island.accent }}
              aria-pressed={draft.islandIds.includes(island.id)}
              onClick={() => set({ islandIds: draft.islandIds.includes(island.id) ? draft.islandIds.filter((x) => x !== island.id) : [...draft.islandIds, island.id] })}
            >{island.name}</button>
          ))}
        </div>
      )}
      <div className="fo-row">
        <span className="fo-row__name">Islands show</span>
        <Segmented value={draft.view} options={ISLAND_VIEWS.map((v) => [v.id, v.label])} onChange={(view) => set({ view })} />
      </div>
      <div className="fo-row">
        <span className="fo-row__name">Agents</span>
        <Segmented value={draft.showAgents} options={[[true, 'Shown'], [false, 'Hidden']]} onChange={(showAgents) => set({ showAgents })} />
      </div>
      <div className="fo-row">
        <span className="fo-row__name">Dim</span>
        <Segmented value={draft.dim} options={[[false, 'Off'], [true, 'On']]} onChange={(dim) => set({ dim })} />
      </div>
      <div className="fo-desk-editor__actions">
        {!isNew && !isAll && (
          <button type="button" className="fo-danger fo-danger--small" onClick={() => { deleteDesk(desk.id); onDone(); }}>
            <span className="fo-glyph">{GLYPH.trash}</span>Delete desk
          </button>
        )}
        <button type="button" className="fo-btn" onClick={onDone}>Cancel</button>
        <button type="button" className="fo-loud" onClick={save} disabled={isNew && !draft.name.trim()}>{isNew ? 'Make desk' : 'Save'}</button>
      </div>
    </div>
  );
}

export default function DeskPanel() {
  const { desks, activeDeskId, ui } = getState();
  const editing = ui.deskEditId;
  const done = () => setUi({ deskEditId: null });

  return (
    <aside className="fo-drawer fo-drawer--left fo-desks" onPointerDown={(e) => e.stopPropagation()}>
      <header className="fo-drawer__head">
        <span className="fo-glyph">{GLYPH.desk}</span>
        <button type="button" className="fo-icon-btn" onClick={closePanel} title="Close"><span className="fo-glyph">{GLYPH.close}</span></button>
      </header>
      <ul className="fo-desks__list">
        {desks.map((desk) => (
          <li key={desk.id} className="fo-desks__item" aria-current={desk.id === activeDeskId ? 'true' : undefined}>
            <button type="button" className="fo-desks__switch" onClick={() => switchDesk(desk.id)}>
              <span className="fo-desks__name">{desk.name}</span>
              <span className="fo-whisper">{deskIslands(desk).length}</span>
            </button>
            <button type="button" className="fo-icon-btn" onClick={() => setUi({ deskEditId: desk.id })} title="Desk settings">
              <span className="fo-glyph">{GLYPH.gear}</span>
            </button>
            {editing === desk.id && <DeskEditor desk={desk} onDone={done} />}
          </li>
        ))}
      </ul>
      {editing === 'new' ? (
        <DeskEditor desk={null} onDone={done} />
      ) : (
        <button type="button" className="fo-desks__new" onClick={() => setUi({ deskEditId: 'new' })}>
          <span className="fo-glyph">{GLYPH.plus}</span>New desk
        </button>
      )}
    </aside>
  );
}
