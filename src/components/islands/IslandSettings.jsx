import { useState } from 'react';
import {
  ALL_DESK_ID, addCard, addTag, archiveIsland, closePanel, deleteIsland, getState, liveAgentCount, openPanel,
  openStepCount, pickIslandFolder, removeTag, saveIslandTemplate, select, setCover, setFog, setIslandOnDesk, setStage, setUi,
  updateIsland,
} from './store';
import { ACCENTS, GLYPH, cardType } from './catalog';
import { pickFiles } from './gestures';
import { EditableText } from './cards/fields';

async function chooseCover(island) {
  const [path] = await pickFiles({ multiple: false, accept: 'image/*,video/*' });
  if (path) setCover(island.id, { path, name: path.split('/').pop() });
}

function StageChips({ island }) {
  const [editing, setEditing] = useState(null);
  const setStages = (stages) => updateIsland(island.id, { stages, stage: Math.min(island.stage, stages.length - 1) });
  return (
    <div className="fo-settings__stages">
      {island.stages.map((stage, index) => (
        editing === index ? (
          <input
            key={index}
            className="fo-stage fo-stage--edit"
            autoFocus
            defaultValue={stage}
            onBlur={(e) => {
              setEditing(null);
              const value = e.target.value.trim();
              if (!value && island.stages.length > 1) setStages(island.stages.filter((_, i) => i !== index));
              else if (value) setStages(island.stages.map((s, i) => (i === index ? value : s)));
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(null); }}
          />
        ) : (
          <button
            key={index}
            type="button"
            className="fo-stage"
            aria-current={index === island.stage ? 'step' : undefined}
            onClick={() => setStage(island.id, index)}
            onDoubleClick={() => setEditing(index)}
            title="Click to move here · double-click to rename"
          >{index + 1} · {stage}</button>
        )
      ))}
      <button type="button" className="fo-stage fo-stage--add" onClick={() => { setStages([...island.stages, 'New stage']); setEditing(island.stages.length); }} title="Add a stage">
        <span className="fo-glyph">{GLYPH.plus}</span>
      </button>
      <span className="fo-whisper fo-settings__whisper">stages</span>
    </div>
  );
}

function assignAgent(island) {
  const idle = island.cards.find((c) => c.kind === 'agent' && !c.data.taskId);
  const card = idle || addCard(island.id, { kind: 'agent', rect: { x: island.cards.reduce((m, c) => Math.max(m, c.x + c.w), 0) + 16, y: 0, w: 0, h: 0 } });
  if (!card) return;
  select({ islandId: island.id, cardId: card.id });
  setUi({ panel: null, zoomTo: island.id });
}

export default function IslandSettings({ island }) {
  const [more, setMore] = useState(false);
  const [templateName, setTemplateName] = useState(null);
  const { desks } = getState();
  const agents = liveAgentCount(island);
  const steps = openStepCount(island);
  const entries = island.journal.entries.length;
  const manualDesks = desks.filter((d) => d.id !== ALL_DESK_ID);

  return (
    <aside className="fo-drawer fo-settings" style={{ '--accent': island.accent, '--accent-rgb': island.accentRgb }} onPointerDown={(e) => e.stopPropagation()}>
      <header className="fo-settings__crumb">
        <span className="fo-glyph">{GLYPH.desk}</span>
        <span className="fo-whisper">project</span>
        <EditableText
          className="fo-settings__field"
          multiline={false}
          value={island.field}
          placeholder="field · kind"
          onCommit={(field) => updateIsland(island.id, { field })}
        />
        <button type="button" className="fo-icon-btn" onClick={closePanel} title="Close"><span className="fo-glyph">{GLYPH.close}</span></button>
      </header>

      <EditableText className="fo-settings__title" value={island.name} onCommit={(name) => name.trim() && updateIsland(island.id, { name: name.trim() })} />

      <div className="fo-settings__stats">
        <button type="button" onClick={() => openPanel('journal', island.id)}><b>{entries}</b> {entries === 1 ? 'entry' : 'entries'}</button>
        <span><b>{steps}</b> open {steps === 1 ? 'step' : 'steps'}</span>
        <span><b>{agents}</b> {agents === 1 ? 'agent' : 'agents'}</span>
      </div>

      <div className="fo-settings__status">
        <EditableText value={island.status} placeholder="Where it stands" onCommit={(status) => updateIsland(island.id, { status }, status.trim() ? { kind: 'status', text: status.trim() } : null)} />
        <span className="fo-whisper fo-settings__whisper">status</span>
      </div>

      <StageChips island={island} />

      <div className="fo-settings__rows">
        <label className="fo-row">
          <span className="fo-row__name">Main View</span>
          <select value={island.mainCardId || ''} onChange={(e) => updateIsland(island.id, { mainCardId: e.target.value || null })}>
            {island.cards.map((c) => <option key={c.id} value={c.id}>{c.title} ({cardType(c.kind).label})</option>)}
          </select>
        </label>
        <div className="fo-row">
          <span className="fo-row__name">Accent</span>
          <div className="fo-swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                type="button"
                className="fo-swatch"
                style={{ '--swatch': a.hex }}
                aria-pressed={island.accent.toLowerCase() === a.hex.toLowerCase()}
                onClick={() => updateIsland(island.id, { accent: a.hex, accentRgb: a.rgb })}
                title={a.hex}
              />
            ))}
          </div>
        </div>

        <label className="fo-row">
          <span className="fo-row__name">Fog</span>
          <input type="checkbox" checked={island.fog} onChange={(e) => setFog(island.id, e.target.checked)} />
          <span className="fo-row__value">{island.fog ? 'frame and name only, at any zoom' : 'cards show'}</span>
        </label>
        <div className="fo-row">
          <span className="fo-row__name">Cover</span>
          <span className="fo-row__value" title={island.cover?.path}>{island.cover ? island.cover.name : 'none'}</span>
          <button type="button" className="fo-icon-btn" title={island.cover ? 'Choose another cover' : 'Choose a cover image'} onClick={() => chooseCover(island)}>
            <span className="fo-glyph">􀏅</span>
          </button>
          {island.cover && (
            <button type="button" className="fo-icon-btn" title="Remove the cover" onClick={() => setCover(island.id, null)}>
              <span className="fo-glyph">{GLYPH.close}</span>
            </button>
          )}
        </div>

        <button type="button" className="fo-settings__more" aria-expanded={more} onClick={() => setMore((m) => !m)}>
          <span className="fo-glyph">{more ? GLYPH.chevronDown : GLYPH.chevron}</span>More
        </button>
        {more && (
          <>
            <label className="fo-row">
              <span className="fo-row__name">Folder</span>
              <span className="fo-row__value" title={island.rootPath}>{island.rootPath ? island.rootPath.replace(/^\/Users\/[^/]+/, '~') : 'none'}</span>
              <button type="button" className="fo-icon-btn" title="Choose the project folder" onClick={() => pickIslandFolder(island.id)}>
                <span className="fo-glyph">{GLYPH.folder}</span>
              </button>
            </label>
            <label className="fo-row">
              <span className="fo-row__name">Deadline</span>
              <input type="date" value={island.deadline || ''} onChange={(e) => updateIsland(island.id, { deadline: e.target.value })} />
            </label>
            <label className="fo-row">
              <span className="fo-row__name">Importance</span>
              <input type="number" min="1" max="10" step="1" value={island.importance ?? ''} placeholder="1–10"
                onChange={(e) => {
                  const n = Number(e.target.value);
                  updateIsland(island.id, { importance: e.target.value === '' ? null : Math.max(1, Math.min(10, Math.round(n))) });
                }}
              />
            </label>
            <label className="fo-row">
              <span className="fo-row__name">Size</span>
              <input type="number" min="0" step="0.25" value={island.size ?? ''} placeholder="hours"
                onChange={(e) => updateIsland(island.id, { size: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
              />
            </label>
            <div className="fo-row fo-row--top">
              <span className="fo-row__name">Relevance</span>
              <EditableText value={island.relevance} placeholder="Why this matters now" onCommit={(relevance) => updateIsland(island.id, { relevance })} />
            </div>
            <div className="fo-row fo-row--top">
              <span className="fo-row__name">Tags</span>
              <div className="fo-tags">
                {island.tags.map((tag) => (
                  <span key={tag} className="fo-tag">#{tag}
                    <button type="button" onClick={() => removeTag(island.id, tag)} title="Remove"><span className="fo-glyph">{GLYPH.close}</span></button>
                  </span>
                ))}
                <input className="fo-tags__add" placeholder="+ tag" onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) { addTag(island.id, e.currentTarget.value); e.currentTarget.value = ''; }
                }} />
              </div>
            </div>
            {manualDesks.length > 0 && (
              <div className="fo-row fo-row--top">
                <span className="fo-row__name">Desks</span>
                <div className="fo-tags">
                  {manualDesks.map((d) => (
                    <button key={d.id} type="button" className="fo-chip-btn" aria-pressed={d.islandIds.includes(island.id)} onClick={() => setIslandOnDesk(d.id, island.id, !d.islandIds.includes(island.id))}>{d.name}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="fo-row">
              <span className="fo-row__name">Template</span>
              {templateName === null ? (
                <button type="button" className="fo-btn" onClick={() => setTemplateName(island.name)}>Save as template</button>
              ) : (
                <input className="fo-input" autoFocus value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                  onBlur={() => setTemplateName(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { saveIslandTemplate(island.id, templateName); setTemplateName(null); }
                    if (e.key === 'Escape') setTemplateName(null);
                  }}
                />
              )}
            </div>
            <div className="fo-row">
              <span className="fo-row__name">Archive</span>
              <button type="button" className="fo-btn" onClick={() => archiveIsland(island.id)}>Make a dated copy</button>
            </div>
          </>
        )}
      </div>

      <div className="fo-settings__actions">
        <button type="button" className="fo-tile" onClick={() => openPanel('journal', island.id)}>
          <span className="fo-glyph">{GLYPH.journal}</span>Open journal
        </button>
        <button type="button" className="fo-tile fo-tile--loud" onClick={() => assignAgent(island)}>
          <span className="fo-glyph">{GLYPH.bolt}</span>Assign agent
        </button>
      </div>
      <button type="button" className="fo-danger" onClick={() => deleteIsland(island.id)}>
        <span className="fo-glyph">{GLYPH.trash}</span>Delete project
      </button>
    </aside>
  );
}
