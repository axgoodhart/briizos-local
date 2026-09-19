import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createNotesEditor } from './richtext';
import { docOf, textOf } from './execubriiz-client';
import TYPES from './execubriiz-types.json';

export function ExecEditor({ doc, identity, onChange, onEditor, onActive, readOnly = false, className = '', label = 'Journal writing' }) {
  const element = useRef(null); const editor = useRef(null); const callbacks = useRef({});
  const lastSaved = useRef(''); callbacks.current = { onChange, onEditor, onActive };
  useEffect(() => {
    const instance = createNotesEditor(element.current, doc, {
      editable: !readOnly,
      onSave: () => callbacks.current.onActive?.(false),
      onFocus: () => { callbacks.current.onEditor?.(instance); callbacks.current.onActive?.(true); },
      onTick: () => { if (editor.current) callbacks.current.onEditor?.(editor.current, true); },
      onUpdate: (value) => { lastSaved.current = JSON.stringify(value.getJSON()); callbacks.current.onChange?.(value.getJSON()); },
      onAttachmentRequest: async ({ position }) => {
        const images = await window.api?.journalsAttachImages?.();
        if (instance.isDestroyed || !images?.length) return;
        instance.commands.insertContentAt(position, images.filter((i) => i.url).map((i) => ({ type: 'journalImage', attrs: { src: i.url, alt: i.name || '' } })));
      },
    });
    editor.current = instance; instance.view.dom.setAttribute('aria-label', label);
    lastSaved.current = JSON.stringify(instance.getJSON());
    callbacks.current.onEditor?.(instance);
    return () => { callbacks.current.onActive?.(false); instance.destroy(); editor.current = null; };
  }, [identity]);
  useEffect(() => {
    const instance = editor.current; if (!instance) return;
    const next = JSON.stringify(doc);
    if (next !== lastSaved.current && !instance.isFocused) { instance.commands.setContent(doc, false); lastSaved.current = next; }
  }, [doc]);
  useEffect(() => editor.current?.setEditable(!readOnly), [readOnly]);
  return <div ref={element} className={`exec-rich ${className}`} />;
}

function Diagram({ section }) {
  const root = useRef(null); const [lines, setLines] = useState([]);
  useLayoutEffect(() => {
    const update = () => {
      const bounds = root.current?.getBoundingClientRect(); if (!bounds) return;
      const nodes = new Map([...root.current.querySelectorAll('[data-diagram-id]')].map((el) => [el.dataset.diagramId, el.getBoundingClientRect()]));
      setLines(section.attrs.edges.flatMap((edge) => {
        const a = nodes.get(edge.from); const b = nodes.get(edge.to); if (!a || !b) return [];
        return [{ key: `${edge.from}:${edge.to}`, x1: a.left + a.width / 2 - bounds.left, y1: a.bottom - bounds.top, x2: b.left + b.width / 2 - bounds.left, y2: b.top - bounds.top }];
      }));
    };
    update(); const observer = new ResizeObserver(update); observer.observe(root.current);
    document.fonts?.ready.then(update); return () => observer.disconnect();
  }, [section]);
  return <div className="exec-diagram" ref={root} aria-label="Idea diagram">
    <svg className="exec-diagram-lines" aria-hidden="true">{lines.map((l) => <path key={l.key} d={`M${l.x1},${l.y1} C${l.x1},${l.y1 + 16} ${l.x2},${l.y2 - 16} ${l.x2},${l.y2}`} />)}</svg>
    {section.content.map((block) => <div data-diagram-id={block.attrs.id} key={block.attrs.id} className="exec-diagram-node">{textOf(block) || 'Untitled idea'}</div>)}
  </div>;
}

function Proposal({ proposal, active, quiet, onAction, onError }) {
  const [remaining, setRemaining] = useState(8); const fired = useRef(false);
  useEffect(() => { setRemaining(8); fired.current = false; }, [proposal.id]);
  useEffect(() => {
    if (!active || !quiet || fired.current) return;
    const timer = setInterval(() => { if (document.visibilityState === 'visible') setRemaining((value) => Math.max(0, value - 0.25)); }, 250);
    return () => clearInterval(timer);
  }, [active, quiet]);
  useEffect(() => {
    if (remaining > 0 || fired.current) return;
    fired.current = true; onAction('proposal', { proposalId: proposal.id }).catch(onError);
  }, [remaining]);
  return <aside className="exec-proposal" aria-label="Suggested board change">
    <span className="exec-proposal-label">··· → {proposal.label}</span>
    <span className="exec-proposal-controls"><span>{active ? quiet ? `${Math.ceil(remaining)}s` : 'held' : 'next'}</span>
      <button title={proposal.explanation} onClick={() => onAction('proposal', { proposalId: proposal.id }).catch(onError)}>apply</button>
      <button onClick={() => onAction('proposal', { proposalId: proposal.id, dismiss: true }).catch(onError)}>dismiss</button>
    </span><small>{proposal.explanation}</small>
  </aside>;
}

export function ExecubriizBoard({ state, onAction, onError, onEntry, onEditor, onProtected, visible = true }) {
  const [editing, setEditing] = useState(new Set()); const editingRef = useRef(new Set());
  const [interacting, setInteracting] = useState(false); const [visibleArea, setVisibleArea] = useState(true);
  const [connector, setConnector] = useState('');
  const boardRef = useRef(null); const drafts = useRef(new Map()); const timers = useRef(new Map()); const previousPositions = useRef(new Map());
  const submittedRevisions = useRef(new Map()); const saving = useRef(new Set());
  const sections = state.board.content;
  const activeProposal = state.proposals[0]?.id;
  const protect = (id, active) => {
    const set = new Set(editingRef.current); active ? set.add(id) : set.delete(id); editingRef.current = set; setEditing(set);
    onProtected([...new Set([...set, ...drafts.current.keys(), ...saving.current])]);
  };
  const update = (block, doc) => {
    const id = block.attrs.id;
    const existing = drafts.current.get(id);
    drafts.current.set(id, { doc, expectedRevision: existing?.expectedRevision ?? Math.max(block.attrs.revision, submittedRevisions.current.get(id) || 0) });
    clearTimeout(timers.current.get(id));
    timers.current.set(id, setTimeout(() => save(id), 450));
  };
  const save = (id) => {
    const value = drafts.current.get(id); if (!value) return;
    drafts.current.delete(id); clearTimeout(timers.current.get(id)); saving.current.add(id);
    submittedRevisions.current.set(id, value.expectedRevision + 1);
    onAction('board', { operation: { kind: 'edit', targetId: id, expectedRevision: value.expectedRevision, content: value.doc.content, generation: state.generation } }).catch((error) => {
      if (!drafts.current.has(id)) drafts.current.set(id, value);
      submittedRevisions.current.delete(id); onError(new Error(`${error.message} Your unsaved board wording is still in its editor.`));
    }).finally(() => { saving.current.delete(id); onProtected([...new Set([...editingRef.current, ...drafts.current.keys(), ...saving.current])]); });
  };
  useEffect(() => {
    const timer = setInterval(() => onProtected([...new Set([...editingRef.current, ...drafts.current.keys(), ...saving.current])]), 4000);
    const observer = new IntersectionObserver(([entry]) => setVisibleArea(entry.isIntersecting)); observer.observe(boardRef.current);
    return () => { clearInterval(timer); observer.disconnect(); for (const id of drafts.current.keys()) save(id); for (const timer of timers.current.values()) clearTimeout(timer); onProtected([]); };
  }, []);
  useLayoutEffect(() => {
    const positions = new Map();
    for (const el of boardRef.current.querySelectorAll('[data-board-id]')) {
      const rect = el.getBoundingClientRect(); const before = previousPositions.current.get(el.dataset.boardId); positions.set(el.dataset.boardId, rect);
      if (before && !matchMedia('(prefers-reduced-motion: reduce)').matches && Math.abs(before.top - rect.top) > 2) el.animate([{ transform: `translateY(${before.top - rect.top}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    previousPositions.current = positions;
  }, [state.board]);
  useLayoutEffect(() => {
    const element = boardRef.current;
    const update = () => {
      const proposal = state.proposals.find((p) => p.operation.kind === 'move');
      if (!proposal) { setConnector(''); return; }
      const nodes = new Map([...element.querySelectorAll('[data-board-id]')].map((el) => [el.dataset.boardId, el]));
      const from = nodes.get(proposal.operation.targetId); const to = nodes.get(proposal.operation.beforeId || proposal.operation.sectionId);
      if (!from || !to) { setConnector(''); return; }
      const bounds = element.getBoundingClientRect(); const a = from.getBoundingClientRect(); const b = to.getBoundingClientRect();
      const y1 = a.top - bounds.top + 10; const y2 = b.top - bounds.top;
      if (y1 < 30 || y2 < 30 || y1 > bounds.height || y2 > bounds.height) { setConnector(''); return; }
      const x1 = Math.max(5, a.left - bounds.left - 3); const x2 = Math.max(9, b.left - bounds.left);
      setConnector(`M${x1},${y1} H4 V${y2} H${x2} m-4,-3 l4,3 l-4,3`);
    };
    update(); const observer = new ResizeObserver(update); observer.observe(element);
    const scroll = element.querySelector('.exec-board-scroll'); scroll?.addEventListener('scroll', update, { passive: true });
    document.fonts?.ready.then(update);
    return () => { observer.disconnect(); scroll?.removeEventListener('scroll', update); };
  }, [state.board, state.proposals]);
  const operate = (operation) => onAction('board', { operation: { ...operation, generation: state.generation } }).catch(onError);
  const reorder = (list, item, direction, sectionId) => {
    const index = list.indexOf(item); const before = direction < 0 ? list[index - 1] : list[index + 2];
    operate({ kind: 'move', targetId: item.attrs.id, expectedRevision: item.attrs.revision, sectionId, beforeId: before?.attrs.id });
  };
  const proposals = (id) => state.proposals.filter((p) => p.operation.targetId === id).map((proposal) => <Proposal key={proposal.id} proposal={proposal} active={activeProposal === proposal.id} quiet={visible && visibleArea && !editing.size && !interacting} onAction={onAction} onError={onError} />);
  return <div className="exec-board" ref={boardRef} onPointerDown={() => setInteracting(true)} onPointerUp={() => setInteracting(false)} onPointerCancel={() => setInteracting(false)} onPointerLeave={() => setInteracting(false)}>
    <div className="exec-board-toolbar"><span>working board</span><button title="Analyze current writing" onClick={() => onAction('analyze').catch(onError)}>reflect</button><button disabled={!state.canUndo} onClick={() => onAction('undo').catch(onError)}>undo</button><button title="Clear the board; entries are kept and Undo can restore it" onClick={() => onAction('clear').catch(onError)}>clear</button></div>
    {connector && <svg className="exec-reflow-connector" aria-hidden="true"><path d={connector} /></svg>}
    <div className="exec-board-scroll">
      {sections.map((section, index) => <section className={`exec-section exec-section--${section.attrs.kind}${section.attrs.fixed ? ' is-fixed' : ''}`} key={section.attrs.id} data-board-id={section.attrs.id}>
        <header className="exec-section-header"><input aria-label="Section title" placeholder={TYPES.find((t) => t.id === section.attrs.kind)?.label} defaultValue={section.attrs.title} key={`${section.attrs.id}:${section.attrs.title}`} onFocus={() => protect(section.attrs.id, true)} onBlur={(e) => { protect(section.attrs.id, false); if (e.target.value !== section.attrs.title) operate({ kind: 'rename', targetId: section.attrs.id, title: e.target.value, expectedRevision: section.attrs.revision }); }} />
          <div className="exec-section-tools"><button aria-pressed={section.attrs.fixed} title={section.attrs.fixed ? 'Allow this section to move' : 'Keep this section here; contents stay editable'} onClick={() => operate({ kind: 'pin', targetId: section.attrs.id, fixed: !section.attrs.fixed })}><span className="jr-sf-symbol">􀎧</span></button>
            <select aria-label="Section format" value={section.attrs.kind} onChange={(e) => operate({ kind: 'convert', targetId: section.attrs.id, sectionKind: e.target.value })}>{TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
            <button disabled={index === 0} title="Move section up" onClick={() => reorder(sections, section, -1)}>↑</button><button disabled={index === sections.length - 1} title="Move section down" onClick={() => reorder(sections, section, 1)}>↓</button>
          </div></header>
        {proposals(section.attrs.id)}
        {section.attrs.kind === 'diagram' && section.content.length > 0 && <Diagram section={section} />}
        <div className={section.attrs.kind === 'diagram' ? 'exec-diagram-outline' : ''}>
          {section.content.map((block, blockIndex) => <div className={`exec-idea${block.attrs.done ? ' is-done' : ''}`} key={block.attrs.id} data-board-id={block.attrs.id}>
            {section.attrs.kind === 'checklist' ? <input type="checkbox" className="exec-check" aria-label={`Complete ${textOf(block).slice(0, 70)}`} checked={block.attrs.done} onChange={(e) => operate({ kind: 'done', targetId: block.attrs.id, done: e.target.checked })} /> : section.attrs.kind === 'sequence' ? <span className="exec-step">{blockIndex + 1}</span> : <span className="exec-orb" aria-hidden="true" />}
            <div className="exec-idea-content"><ExecEditor identity={`${block.attrs.id}:${state.generation}`} doc={{ type: 'doc', content: block.content }} onChange={(doc) => update(block, doc)} onEditor={onEditor} onActive={(active) => { protect(block.attrs.id, active); if (!active) save(block.attrs.id); }} label="Edit board idea" />
              {proposals(block.attrs.id)}
              {state.reactions.filter((r) => r.targetId === block.attrs.id).map((reaction) => <div className="exec-reaction" key={reaction.id}><span aria-hidden="true">●●●</span><div>{reaction.url ? <a href={reaction.url} target="_blank" rel="noreferrer">{reaction.text}</a> : <span>{reaction.text}</span>}{reaction.sources.map((id) => <button key={id} onClick={() => onEntry(id)} title="Open source entry">↗ entry</button>)}</div></div>)}
            </div>
            <div className="exec-idea-tools"><button title="Move idea up" disabled={blockIndex === 0} onClick={() => reorder(section.content, block, -1)}>↑</button><button title="Move idea down" disabled={blockIndex === section.content.length - 1} onClick={() => reorder(section.content, block, 1)}>↓</button>
              {sections.length > 1 && <select aria-label="Move idea to section" value="" onChange={(e) => { if (e.target.value) operate({ kind: 'move', targetId: block.attrs.id, sectionId: e.target.value }); }}><option value="">↗</option>{sections.filter((s) => s !== section).map((s) => <option key={s.attrs.id} value={s.attrs.id}>{s.attrs.title || TYPES.find((type) => type.id === s.attrs.kind).label}</option>)}</select>}
              <button title="Remove idea (Undo can restore it)" onClick={() => operate({ kind: 'retire', targetId: block.attrs.id })}>×</button></div>
          </div>)}
        </div>
        {!section.content.length && <p className="exec-empty">{sections.length === 1 ? 'Write on the left. Ideas will gather here—and you can edit them yourself.' : 'An open space for this part of your thinking.'}</p>}
        <button className="exec-add-idea" onClick={() => operate({ kind: 'insert', targetId: section.attrs.id, text: 'New idea' })}>+ idea</button>
      </section>)}
      <div className="exec-add-section"><span>+ section</span>{TYPES.map((type) => <button title={type.hint} key={type.id} onClick={() => operate({ kind: 'addSection', sectionKind: type.id })}>{type.label.toLowerCase()}</button>)}</div>
    </div>
  </div>;
}
