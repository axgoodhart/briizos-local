import { useState } from 'react';
import {
  HUNT_DATE_RANGES, HUNT_KINDS, HUNT_MODES, addHuntResults, addHunterDir, closePanel, getState, removeHunterDir, setHunt, startHunt,
} from './store';
import { GLYPH } from './catalog';
import { fileBadge, relativeTime } from './util';

export default function HuntPanel({ island }) {
  const { hunt, changes, hunterDirs } = getState();
  const [picked, setPicked] = useState(new Set());
  if (!hunt) return null;
  const change = changes.find((c) => c.id === hunt.changeId);
  const results = change?.results || [];
  const added = new Set(change?.addedPaths || []);

  return (
    <aside className="fo-drawer fo-hunt" style={{ '--accent': island.accent, '--accent-rgb': island.accentRgb }} onPointerDown={(e) => e.stopPropagation()}>
      <header className="fo-drawer__head">
        <span className="fo-glyph">{GLYPH.search}</span>
        <span className="fo-drawer__title">{island.name}</span>
        <button type="button" className="fo-icon-btn" onClick={closePanel} title="Close"><span className="fo-glyph">{GLYPH.close}</span></button>
      </header>
      <textarea
        className="fo-hunt__desc"
        value={hunt.description}
        placeholder="Describe the files, or leave empty to use what the island is about"
        onChange={(e) => setHunt({ description: e.target.value })}
      />
      <div className="fo-tags">
        {HUNT_KINDS.map((kind) => (
          <button key={kind.key} type="button" className="fo-chip-btn" aria-pressed={!!hunt.kinds[kind.key]} onClick={() => setHunt({ kinds: { ...hunt.kinds, [kind.key]: !hunt.kinds[kind.key] } })}>{kind.label}</button>
        ))}
      </div>
      <div className="fo-row">
        <span className="fo-row__name">When</span>
        <select value={hunt.dateRange} onChange={(e) => setHunt({ dateRange: e.target.value })}>
          {HUNT_DATE_RANGES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      <div className="fo-row">
        <span className="fo-row__name">How many</span>
        <div className="fo-seg">
          {HUNT_MODES.map(([id, label]) => <button key={id} type="button" aria-pressed={hunt.mode === id} onClick={() => setHunt({ mode: id })}>{label}</button>)}
        </div>
      </div>
      <div className="fo-row fo-row--top">
        <span className="fo-row__name">Where</span>
        <div className="fo-tags">
          {hunterDirs.length === 0 && <span className="fo-whisper">your usual folders</span>}
          {hunterDirs.map((dir) => (
            <span key={dir} className="fo-tag" title={dir}>{dir.split('/').pop()}
              <button type="button" onClick={() => removeHunterDir(dir)}><span className="fo-glyph">{GLYPH.close}</span></button>
            </span>
          ))}
          <button type="button" className="fo-icon-btn" onClick={addHunterDir} title="Add a folder"><span className="fo-glyph">{GLYPH.plus}</span></button>
        </div>
      </div>
      {hunt.error && <p className="fo-hunt__error">{hunt.error}</p>}
      <button type="button" className="fo-loud" disabled={hunt.running} onClick={startHunt}>
        <span className="fo-glyph">{GLYPH.search}</span>{hunt.running ? hunt.stage || 'Searching…' : 'Find'}
      </button>
      {change && (
        <div className="fo-hunt__results">
          {change.summary && <p className="fo-hunt__summary">{change.summary}</p>}
          <ul>
            {results.map((result, index) => (
              <li key={result.path} className="fo-hunt__result" data-added={added.has(result.path) ? 'true' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    disabled={added.has(result.path)}
                    checked={added.has(result.path) || picked.has(index)}
                    onChange={() => setPicked((p) => { const n = new Set(p); n.has(index) ? n.delete(index) : n.add(index); return n; })}
                  />
                  <span className="fo-docs__badge">{fileBadge(result)}</span>
                  <span className="fo-hunt__name" title={result.path}>{result.name}</span>
                  <span className="fo-whisper">{relativeTime(result.modifiedAt)}</span>
                </label>
                <button type="button" className="fo-icon-btn" onClick={() => window.api.islandShowItemInFolder(result.path)} title="Show in Finder"><span className="fo-glyph">{GLYPH.folder}</span></button>
              </li>
            ))}
          </ul>
          {results.length > 0 && (
            <div className="fo-hunt__add">
              <button type="button" className="fo-btn" disabled={!picked.size} onClick={() => { addHuntResults(change.id, [...picked]); setPicked(new Set()); }}>Add chosen</button>
              <button type="button" className="fo-btn" onClick={() => addHuntResults(change.id, results.map((_, i) => i))}>Add all</button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
