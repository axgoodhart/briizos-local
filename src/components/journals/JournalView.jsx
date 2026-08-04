import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { TEMPLATES } from './templates.js';
import {
  createNotesEditor, EditorToolbar, FONT_FAMILIES, LINE_HEIGHTS, WRENCH_ICON,
  getSystemFonts, loadSystemFonts, canQueryLocalFonts,
} from './richtext.jsx';
import logger from '../../lib/logger';

/* ── Journal viewer — open book ───────────────────────────────────────
   Renders a journal's folios two-up. Everything that looks interactive
   is interactive: dashboard stats compute live from sibling folios (and
   targets/manual stats are click-to-edit), prompts have answer fields,
   tracker cells and todo items edit and delete. All edits persist via
   folios:update. */

/* ── Widget compute engine ───────────────────────────────────────────── */

const DAY = 86400000;

function parseDate(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

function parseNum(s) {
  const n = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

/* Returns the computed raw value, or null when the source can't resolve
   (missing sibling, no rows yet, unparseable dates…). */
function computeWidget(widget, folios) {
  const src = widget.source;
  if (!src) return null;
  const f = folios.find((x) => x.type === src.from && x.title === src.folio);
  if (!f) return null;

  if (src.from === 'tracker') {
    const cols = f.content?.columns || [];
    const rows = f.content?.rows || [];
    const ci = src.column ? cols.indexOf(src.column) : -1;
    const di = cols.findIndex((c) => /date/i.test(c));
    const now = new Date();

    switch (src.agg) {
      case 'count':
        return rows.length;
      case 'countWeek':
        return rows.filter((r) => {
          if (di < 0) return true;
          const d = parseDate(r[di]);
          return d ? now - d < 7 * DAY && now - d >= -DAY : false;
        }).length;
      case 'sumMonth':
        if (ci < 0) return null;
        return rows
          .filter((r) => {
            if (di < 0) return true;
            const d = parseDate(r[di]);
            return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((a, r) => a + parseNum(r[ci]), 0);
      case 'sumNum':
        if (ci < 0) return null;
        return rows.reduce((a, r) => a + parseNum(r[ci]), 0);
      case 'topValue': {
        if (ci < 0) return null;
        const tally = {};
        for (const r of rows) {
          const v = String(r[ci] || '').trim();
          if (v) tally[v] = (tally[v] || 0) + 1;
        }
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : null;
      }
      case 'daysSinceLast': {
        const dates = rows.map((r) => parseDate(r[di >= 0 ? di : 0])).filter(Boolean);
        if (!dates.length) return null;
        const last = Math.max(...dates.map((d) => +d));
        return Math.max(0, Math.floor((Date.now() - last) / DAY));
      }
      default:
        return null;
    }
  }

  if (src.from === 'todo') {
    const items = f.content?.items || [];
    if (src.agg === 'doneRatio') {
      return items.length ? Math.round((100 * items.filter((i) => i.done).length) / items.length) : 0;
    }
    if (src.agg === 'count') return items.length;
    return null;
  }

  return null;
}

function formatValue(v, format) {
  if (v === null || v === undefined) return '—';
  if (format === 'money') return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (format === 'days') return `${v} ${v === 1 ? 'day' : 'days'}`;
  if (format === 'hours') return `${v}h`;
  if (typeof v === 'number' && String(v).length > 6) return v.toFixed(1);
  return String(v);
}

/* ── Page groups ──────────────────────────────────────────────────────
   Consecutive folios sharing a type+title form one "pagegroup": a single
   continuity rendered as numbered pages ("Notes — pg. 3 of 10"). Groups
   carry their own tag strip (stored on the group's first folio) and are
   the unit the sidebar jumps between.

   A row with `content.groupStart` begins a NEW group even when its
   type+title matches the row above. Deliberate folio creation (folio+,
   template folios) stamps it; overflow pages born from typing rollover
   don't, so they keep extending their group. */

const groupKeyOf = (f) => `${f.type}|${f.title}`;

/* True when `next` continues `folio`'s pagegroup: same type+title and not
   an explicit new-folio start. */
const continuesGroup = (folio, next) =>
  !!next && groupKeyOf(next) === groupKeyOf(folio) && !next.content?.groupStart;

function computeGroups(folios) {
  const out = [];
  (folios || []).forEach((f, i) => {
    const key = groupKeyOf(f);
    const last = out[out.length - 1];
    if (last && last.key === key && !f.content?.groupStart) last.folios.push(f);
    else out.push({ key, type: f.type, title: f.title || TYPE_LABELS[f.type] || 'page', folios: [f], start: i });
  });
  return out;
}

/* ── Canvas project @mentions ─────────────────────────────────────────
   Notes text mentioning "@<canvas project name>" links that project to
   the journal; the sidebar then lists its files (with duplicate-name
   detection). Projects come from the legacy canvas store (library:load). */

function collectDocText(node, out) {
  if (!node) return;
  if (typeof node.text === 'string') out.push(node.text);
  (node.content || []).forEach((c) => collectDocText(c, out));
}

function folioText(folio) {
  const c = folio.content || {};
  const out = [];
  // notes
  if (c.doc && typeof c.doc === 'object') collectDocText(c.doc, out);
  else if (typeof c.body === 'string') out.push(c.body.replace(/<[^>]+>/g, ' '));
  // todo
  (c.items || []).forEach((it) => out.push(String(it?.text || '')));
  // tracker
  (c.rows || []).forEach((r) => (Array.isArray(r) ? r : []).forEach((cell) => out.push(String(cell || ''))));
  // prompts
  if (c.intro) out.push(String(c.intro));
  (c.prompts || []).forEach((p) => out.push(String(p || '')));
  (c.answers || []).forEach((a) => out.push(String(a || '')));
  // dashboard
  if (c.note) out.push(String(c.note));
  return out.join('\n');
}

/* Unique file rows for a project, flagging duplicate basenames. */
function projectFileRows(project) {
  const files = project.files || [];
  const counts = {};
  for (const f of files) {
    const n = String(f.name || '').toLowerCase();
    counts[n] = (counts[n] || 0) + 1;
  }
  const seen = new Set();
  const rows = [];
  for (const f of files) {
    const n = String(f.name || '').toLowerCase();
    if (seen.has(n)) continue;
    seen.add(n);
    rows.push({ file: f, dups: counts[n] });
  }
  return rows;
}

/* ── Page geometry ────────────────────────────────────────────────────
   Pages have a FIXED logical size, like real paper. Text therefore breaks
   at exactly the same word regardless of window size or screen resolution;
   the whole book scales (CSS transform) to fit the panel instead of
   reflowing. Sizes are unscaled CSS px, padding included. */

const PAGE_W = 540;
const PAGE_H = 720;
const SPINE_W = 3;
const STACK_GAP = 14; // vertical gap between pages in a scrolled folio's seamed stack

/* Vocabulary (matches the UI, which predates some of these identifiers):
   - FOLIO: a template-born content section (Notes, List, Log…). In code,
     a folio is a "pagegroup" — consecutive same type+title rows.
   - PAGE: one physical paper face. In code (and the DB), each page is a
     row of the `folios` table — the naming is historical.
   Notes are SPATIAL folios: layout is deterministic, pages keep their
   normalized geometry everywhere, and small screens scale the canvas
   down rather than reflowing text. A future FLUID folio type would
   reflow responsively instead. */

/* ── Overflow rebalance ───────────────────────────────────────────────
   Pages have a fixed height (the paper must END so the page texture stays
   honest). One primitive keeps a page and its next-in-group sibling in
   equilibrium: optionally merge the sibling's blocks onto the end of this
   page, then pop trailing blocks until the page fits. Growth pushes the
   tail forward; shrinkage pulls text back. Rebalance transactions skip
   the undo stack so ⌘Z only ever undoes the user's own typing. */

function rebalancePage(editor, proseEl, getNextBlocks) {
  const body = proseEl?.closest('.jv-page__body');
  if (!body || !editor || editor.isDestroyed) return null;
  const fits = () => body.scrollHeight <= body.clientHeight + 1;

  const selFrom = editor.state.selection.from;
  const wasFocused = editor.isFocused;
  let pulled = false;

  if (fits()) {
    // Underflow path: only bother pulling when at least ~a line of paper
    // is free below the last block (rect math is scale-proof: the ratio
    // between rect and client heights undoes any ancestor transform).
    if (!getNextBlocks) return null;
    const pm = proseEl.querySelector('.ProseMirror');
    const lastBlock = pm?.lastElementChild;
    if (!lastBlock) return null;
    const bodyRect = body.getBoundingClientRect();
    if (!bodyRect.height || !body.clientHeight) return null;
    const ratio = bodyRect.height / body.clientHeight;
    const free = (bodyRect.bottom - lastBlock.getBoundingClientRect().bottom) / ratio;
    if (free < 20) return null;
    const nextBlocks = getNextBlocks();
    if (!Array.isArray(nextBlocks) || !nextBlocks.length) return null;
    pulled = true;
    editor.chain().command(({ tr, state }) => {
      tr.setMeta('addToHistory', false);
      tr.insert(state.doc.content.size, nextBlocks.map((n) => state.schema.nodeFromJSON(n)));
      return true;
    }).run();
  }

  const moved = [];
  let cutStart = null;
  while (!fits() && editor.state.doc.childCount > 1) {
    const doc = editor.state.doc;
    const last = doc.child(doc.childCount - 1);
    moved.unshift(last.toJSON());
    cutStart = doc.content.size - last.nodeSize;
    editor.chain().command(({ tr }) => {
      tr.setMeta('addToHistory', false);
      tr.delete(doc.content.size - last.nodeSize, doc.content.size);
      return true;
    }).run();
  }

  if (!pulled && !moved.length) return null;
  // If the caret sat inside a block that just moved off the page, report
  // where it should land on the next page (offset within the moved run).
  const caretRel =
    wasFocused && cutStart !== null && selFrom >= cutStart ? selFrom - cutStart : null;
  return { moved, pulled, caretRel };
}

/* ── Inline-editable value (click → input → Enter/blur saves) ────────── */

function InlineEdit({ value, display, onCommit, class: cls }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!editing) {
    return (
      <button
        type="button"
        className={'jv-editable ' + (cls || '')}
        title="Click to edit"
        onClick={() => {
          setDraft(String(value ?? ''));
          setEditing(true);
        }}
      >
        {display}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    if (draft !== String(value ?? '')) onCommit(draft);
  };
  return (
    <input
      className={'jv-editable__input ' + (cls || '')}
      type="text"
      value={draft}
      ref={(el) => el?.focus()}
      onInput={(e) => setDraft(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
}

/* ── Folio renderers ─────────────────────────────────────────────────── */

function DashboardFolio({ folio, siblings, onSave }) {
  const { widgets = [], note } = folio.content || {};

  const saveWidget = (i, patch) => {
    const next = widgets.map((w, j) => (j === i ? { ...w, ...patch } : w));
    onSave({ content: { ...folio.content, widgets: next } });
  };

  return (
    <div className="jv-dashboard">
      {widgets.map((w, i) => {
        const computed = computeWidget(w, siblings);
        const live = computed !== null;
        const value = live ? computed : w.value;

        if (w.kind === 'progress') {
          const target = Number(w.target) || 1;
          const num = typeof value === 'number' ? value : parseNum(value);
          const pct = Math.min(100, (num / target) * 100);
          return (
            <div className={'jv-widget jv-widget--progress' + (num > target ? ' is-over' : '')} key={i}>
              <span className="jv-widget__label">
                {w.label}
                {live && <em className="jv-live">live</em>}
              </span>
              <div className="jv-bar">
                <div className="jv-bar__fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="jv-widget__hint">
                {formatValue(num, w.format)} /{' '}
                <InlineEdit
                  value={w.target}
                  display={formatValue(target, w.format)}
                  onCommit={(v) => saveWidget(i, { target: parseNum(v) || target })}
                />
              </span>
            </div>
          );
        }

        return (
          <div className="jv-widget" key={i}>
            {live || !w.editable ? (
              <span className="jv-widget__value">{formatValue(value, w.format)}</span>
            ) : (
              <InlineEdit
                value={w.value}
                display={formatValue(w.value, w.format)}
                className="jv-widget__value"
                onCommit={(v) => saveWidget(i, { value: v })}
              />
            )}
            <span className="jv-widget__label">
              {w.label}
              {live && <em className="jv-live">live</em>}
            </span>
            {w.hint && <span className="jv-widget__hint">{w.hint}</span>}
          </div>
        );
      })}
      {note && <p className="jv-dashboard__note">{note}</p>}
    </div>
  );
}

function TrackerFolio({ folio, onSave }) {
  const { columns = [] } = folio.content || {};
  const rows = folio.content?.rows || [];
  const [draft, setDraft] = useState(() => columns.map(() => ''));
  const [editCell, setEditCell] = useState(null); // [row, col]
  const [cellDraft, setCellDraft] = useState('');

  const saveRows = (next) => onSave({ content: { ...folio.content, rows: next } });

  const addRow = () => {
    if (!draft.some((c) => c.trim())) return;
    saveRows([...rows, draft.map((c) => c.trim())]);
    setDraft(columns.map(() => ''));
  };

  const commitCell = () => {
    if (!editCell) return;
    const [ri, ci] = editCell;
    const next = rows.map((r, i) =>
      i === ri ? columns.map((_, j) => (j === ci ? cellDraft.trim() : r[j] || '')) : r,
    );
    setEditCell(null);
    saveRows(next);
  };

  return (
    <div className="jv-tracker">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c}>{c}</th>)}
            <th className="jv-tracker__rowctl" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {columns.map((_, ci) =>
                editCell && editCell[0] === ri && editCell[1] === ci ? (
                  <td>
                    <input
                      type="text"
                      value={cellDraft}
                      ref={(el) => el?.focus()}
                      onInput={(e) => setCellDraft(e.currentTarget.value)}
                      onBlur={commitCell}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitCell();
                        if (e.key === 'Escape') setEditCell(null);
                      }}
                    />
                  </td>
                ) : (
                  <td
                    className="jv-cell"
                    title="Click to edit"
                    onClick={() => {
                      setEditCell([ri, ci]);
                      setCellDraft(r[ci] || '');
                    }}
                  >
                    {r[ci] || ''}
                  </td>
                ),
              )}
              <td className="jv-tracker__rowctl">
                <button
                  type="button"
                  className="jv-x"
                  title="Delete row"
                  onClick={() => saveRows(rows.filter((_, i) => i !== ri))}
                >×</button>
              </td>
            </tr>
          ))}
          <tr className="jv-tracker__draft">
            {columns.map((c, j) => (
              <td key={c}>
                <input
                  type="text"
                  value={draft[j]}
                  placeholder={c}
                  onInput={(e) => {
                    const d = [...draft];
                    d[j] = e.currentTarget.value;
                    setDraft(d);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                />
              </td>
            ))}
            <td className="jv-tracker__rowctl" />
          </tr>
        </tbody>
      </table>
      <button type="button" className="jv-minibtn" onClick={addRow}>+ add row</button>
    </div>
  );
}

function TodoFolio({ folio, onSave }) {
  const items = folio.content?.items || [];
  const [draft, setDraft] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const save = (next) => onSave({ content: { ...folio.content, items: next } });

  const addItem = () => {
    const t = draft.trim();
    if (!t) return;
    save([...items, { text: t, done: false }]);
    setDraft('');
  };

  const commitEdit = () => {
    const t = editDraft.trim();
    setEditIdx(null);
    if (t) save(items.map((x, j) => (j === editIdx ? { ...x, text: t } : x)));
  };

  return (
    <div className="jv-todo">
      {items.map((it, i) => (
        <div className={'jv-todo__item' + (it.done ? ' is-done' : '')} key={i}>
          <input
            type="checkbox"
            checked={it.done}
            onChange={() => save(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
          />
          {editIdx === i ? (
            <input
              className="jv-todo__editinput"
              type="text"
              value={editDraft}
              ref={(el) => el?.focus()}
              onInput={(e) => setEditDraft(e.currentTarget.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditIdx(null);
              }}
            />
          ) : (
            <span
              className="jv-todo__text"
              title="Click to edit"
              onClick={() => {
                setEditIdx(i);
                setEditDraft(it.text);
              }}
            >
              {it.text}
            </span>
          )}
          <button
            type="button"
            className="jv-x"
            title="Delete item"
            onClick={() => save(items.filter((_, j) => j !== i))}
          >×</button>
        </div>
      ))}
      <div className="jv-todo__add">
        <input
          type="text"
          value={draft}
          placeholder="Add an item…"
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
      </div>
    </div>
  );
}

function PromptsFolio({ folio, onSave }) {
  const { intro, prompts = [] } = folio.content || {};
  const [answers, setAnswers] = useState(() => {
    const a = folio.content?.answers || [];
    return prompts.map((_, i) => a[i] || '');
  });

  const commit = () => onSave({ content: { ...folio.content, answers } });

  return (
    <div className="jv-prompts">
      {intro && <p className="jv-prompts__intro">{intro}</p>}
      <ol>
        {prompts.map((p, i) => (
          <li key={i}>
            <span className="jv-prompts__q">{p}</span>
            <textarea
              className="jv-prompts__answer"
              value={answers[i]}
              placeholder="Write your answer…"
              rows={2}
              onInput={(e) => {
                const next = [...answers];
                next[i] = e.currentTarget.value;
                setAnswers(next);
              }}
              onBlur={commit}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotesFolio({
  folio, onSave, onRebalanced, pullSource, registerEditor, registerRebalance, onEditorReady, onTick,
  onAttachmentRequest,
}) {
  const hostRef = useRef(null);
  const edRef = useRef(null);
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const saveRef = useRef(onSave);
  const rebalRef = useRef(onRebalanced);
  const pullRef = useRef(pullSource);
  const readyRef = useRef(onEditorReady);
  const attachmentRef = useRef(onAttachmentRequest);
  const contentRef = useRef(folio.content);
  saveRef.current = onSave;
  rebalRef.current = onRebalanced;
  pullRef.current = pullSource;
  readyRef.current = onEditorReady;
  attachmentRef.current = onAttachmentRequest;
  contentRef.current = folio.content;

  useEffect(() => {
    /* Persist only when the doc actually changed since the last write. */
    const persist = () => {
      const ed = edRef.current;
      if (!ed || ed.isDestroyed) return;
      const doc = ed.getJSON();
      const s = JSON.stringify(doc);
      if (s === lastSavedRef.current) return;
      lastSavedRef.current = s;
      saveRef.current({ content: { ...contentRef.current, doc, body: undefined } });
    };

    /* The live loop: pages END at the paper edge. Runs debounced while
       typing (not just on blur), so overflow rolls forward, freed space
       pulls text back, and the caret follows its block onto a new page. */
    const run = () => {
      const ed = edRef.current;
      if (!ed || ed.isDestroyed) return;
      if (ed.view?.composing) return schedule(); // let IME finish first
      // Pulling merges sibling state into this editor, so only the page
      // being actively edited may pull — keeps a single writer per folio.
      let srcInfo = null;
      const getNextBlocks = ed.isFocused && pullRef.current
        ? () => {
            srcInfo = pullRef.current();
            return srcInfo ? srcInfo.blocks : null;
          }
        : null;
      const res = rebalancePage(ed, hostRef.current, getNextBlocks);
      persist();
      if (res && rebalRef.current) {
        rebalRef.current({
          moved: res.moved,
          pulledFromId: res.pulled && srcInfo ? srcInfo.folioId : null,
          caretRel: res.caretRel,
        });
      }
      readyRef.current?.(folio.id, ed);
    };

    const schedule = (ms = 320) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, ms);
    };

    // Older notes stored a plain `body` string; seed the editor with it once.
    const initial = folio.content?.doc || folio.content?.body || '';
    const ed = createNotesEditor(hostRef.current, initial, {
      onSave: persist, // blur
      onTick,
      onFocus: () => registerEditor(folio.id, ed, { focus: true }),
      onUpdate: () => schedule(),
      onAttachmentRequest: ({ position }) => attachmentRef.current?.({ folioId: folio.id, position }),
    });
    edRef.current = ed;
    lastSavedRef.current = JSON.stringify(folio.content?.doc ?? null);
    registerEditor(folio.id, ed);
    registerRebalance?.(folio.id, () => schedule(0));

    // Image dimensions resolve after their node is inserted. Reflow once that
    // happens so a newly attached image can move to the next paper face just
    // like a paragraph that grows past the edge.
    const onImageLoad = (event) => {
      if (event.target?.matches?.('img[data-journal-image]')) schedule(0);
    };
    hostRef.current?.addEventListener('load', onImageLoad, true);

    // First layout pass: trim legacy/overlong docs once the page exists.
    const raf = requestAnimationFrame(() => schedule(0));

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
      hostRef.current?.removeEventListener('load', onImageLoad, true);
      registerRebalance?.(folio.id, null);
      registerEditor(folio.id, null);
      ed.destroy();
      edRef.current = null;
    };
  }, [folio.id]);

  // A rebalance can land in a folio that's already on screen — refresh its
  // editor when content changes underneath it (never mid-typing).
  useEffect(() => {
    const ed = edRef.current;
    if (!ed || ed.isDestroyed || ed.isFocused) return;
    const doc = folio.content?.doc;
    if (doc && typeof doc === 'object' && JSON.stringify(doc) !== JSON.stringify(ed.getJSON())) {
      ed.commands.setContent(doc);
      lastSavedRef.current = JSON.stringify(doc);
      readyRef.current?.(folio.id, ed);
    }
  }, [folio.content?.doc]);

  return (
    <div className="rt-host">
      <div className="rt-prose" ref={hostRef} />
    </div>
  );
}

const RENDERERS = {
  dashboard: DashboardFolio,
  tracker: TrackerFolio,
  todo: TodoFolio,
  prompts: PromptsFolio,
  notes: NotesFolio,
};

const TYPE_LABELS = {
  dashboard: 'dashboard',
  tracker: 'log',
  todo: 'list',
  prompts: 'prompts',
  notes: 'notes',
};

/* ── À la carte page picker ──────────────────────────────────────────
   Add any blank page type, or borrow a single prefab page from any
   template, into the open journal. */

const BLANK_PAGES = [
  { label: 'Notes', folio: { type: 'notes', title: 'Notes', content: { body: '' } } },
  { label: 'To-do list', folio: { type: 'todo', title: 'List', content: { items: [] } } },
  {
    label: 'Log',
    folio: { type: 'tracker', title: 'Log', content: { columns: ['Date', 'Entry', 'Notes'], rows: [] } },
  },
];

function AddPageModal({ onClose, onPick }) {
  return (
    <div className="jr-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jr-modal" role="dialog" aria-label="Add folio" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2 className="jr-modal__title">add a folio</h2>

        <div className="jr-field">
          <span className="jr-field__label">blank folios</span>
          <div className="jv-pagepick">
            {BLANK_PAGES.map((b) => (
              <button type="button" key={b.label} className="jv-pagepick__item" onClick={() => onPick(b.folio)}>
                <span className="jv-pagepick__name">{b.label}</span>
                <span className="jv-pagepick__from">blank</span>
              </button>
            ))}
          </div>
        </div>

        {TEMPLATES.filter((t) => t.folios.length).map((t) => (
          <div className="jr-field" key={t.id}>
            <span className="jr-field__label">from {t.name}</span>
            <div className="jv-pagepick">
              {t.folios.map((f) => (
                <button
                  type="button"
                  key={f.title}
                  className="jv-pagepick__item"
                  onClick={() => onPick(JSON.parse(JSON.stringify(f)))}
                >
                  <span className="jv-pagepick__name">{f.title}</span>
                  <span className="jv-pagepick__from">{TYPE_LABELS[f.type] || f.type}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="jr-modal__actions">
          <button type="button" className="jr-btn" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  );
}

function JournalAttachmentModal({ onClose, onAttach }) {
  const [picking, setPicking] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, []);

  const chooseImages = async () => {
    setPicking(true);
    try {
      const images = await api.attachImages();
      if (images?.length) onAttach(images);
    } catch (error) {
      logger.error('journal', 'Image attachment picker failed', error?.message);
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="jr-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="jr-modal jv-attachment-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Attach images"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      >
        <h2 className="jr-modal__title">attach images</h2>
        <p className="jv-attachment-modal__copy">
          Choose one or more local images to insert at the <code>//+</code> marker. The journal keeps a local file reference, so the image stays private to this Mac.
        </p>
        <div className="jr-modal__actions">
          <button type="button" className="jr-btn" onClick={onClose} disabled={picking}>cancel</button>
          <button type="button" className="jr-btn jr-btn--primary" onClick={chooseImages} disabled={picking}>
            {picking ? 'opening picker…' : 'choose images'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Per-journal typography ──────────────────────────────────────────
   H1/H2/H3 + body fonts, base size, and line height live on the journal
   (journal.settings.typography) and reach the prose through CSS variables
   on .jv-root — so headings are journal-tunable, not hardcoded. */

const DEFAULT_TYPO = {
  h1: "Jost, 'SF Pro', system-ui, sans-serif",
  h2: "Jost, 'SF Pro', system-ui, sans-serif",
  h3: "Jost, 'SF Pro', system-ui, sans-serif",
  body: "Georgia, 'Times New Roman', serif",
  size: 14,
  lineHeight: 1.65,
};

function FontSelect({ value, onChange }) {
  const systemFonts = getSystemFonts();
  const known =
    FONT_FAMILIES.some((f) => f.value === value) ||
    (systemFonts || []).some((f) => f.value === value);
  return (
    <select className="jr-input jv-typo__select" value={value} onChange={(e) => onChange(e.currentTarget.value)}>
      {FONT_FAMILIES.map((f) => (
        <option key={f.label} value={f.value}>{f.label}</option>
      ))}
      {!known && <option value={value}>{String(value).replace(/['"]/g, '').split(',')[0]}</option>}
      {systemFonts?.length > 0 && (
        <optgroup label="my computer">
          {systemFonts.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function TypographyModal({ typo, onChange, onClose }) {
  const [, force] = useState(0);
  const fonts = getSystemFonts();
  const set = (k, val) => onChange({ ...typo, [k]: val });

  return (
    <div className="jr-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jr-modal jv-typo" role="dialog" aria-label="Typography" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2 className="jr-modal__title">typography</h2>

        {[['h1', 'H1 font'], ['h2', 'H2 font'], ['h3', 'H3 font'], ['body', 'body font']].map(([k, label]) => (
          <label className="jr-field" key={k}>
            <span className="jr-field__label">{label}</span>
            <FontSelect value={typo[k]} onChange={(val) => set(k, val)} />
          </label>
        ))}

        <div className="jv-typo__pair">
          <label className="jr-field">
            <span className="jr-field__label">base size</span>
            <input
              className="jr-input"
              type="number"
              min="10"
              max="28"
              value={typo.size}
              onInput={(e) => set('size', parseInt(e.currentTarget.value, 10) || DEFAULT_TYPO.size)}
            />
          </label>
          <label className="jr-field">
            <span className="jr-field__label">line height</span>
            <select
              className="jr-input"
              value={String(typo.lineHeight)}
              onChange={(e) => set('lineHeight', parseFloat(e.currentTarget.value))}
            >
              {LINE_HEIGHTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>

        {canQueryLocalFonts() && !fonts && (
          <button
            type="button"
            className="jr-btn"
            onClick={() => loadSystemFonts().then(() => force((n) => n + 1))}
          >
            use my computer's fonts…
          </button>
        )}
        {fonts && <p className="jv-typo__hint">{fonts.length} fonts loaded from your computer.</p>}

        <div className="jr-modal__actions">
          <button type="button" className="jr-btn" onClick={() => { onChange(null); onClose(); }}>reset</button>
          <button type="button" className="jr-btn jr-btn--primary" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page + spread ───────────────────────────────────────────────────── */

/* The page-head title, editable in place. Commit on Enter/blur, Escape
   cancels. Renaming goes through onRename, which renames the whole
   pagegroup (title is half the group key, so a lone renamed page would
   split off its own folio). */
function FolioTitle({ folio, onRename }) {
  const [draft, setDraft] = useState(folio.title);
  const cancelRef = useRef(false);
  useEffect(() => setDraft(folio.title), [folio.id, folio.title]);

  if (!onRename) return <h3>{folio.title}</h3>;
  return (
    <input
      className="jv-page__titleedit"
      type="text"
      value={draft}
      placeholder={TYPE_LABELS[folio.type] || folio.type}
      aria-label="Folio title"
      title="Rename this folio"
      onInput={(e) => setDraft(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') {
          cancelRef.current = true;
          setDraft(folio.title);
          e.currentTarget.blur();
        }
      }}
      onBlur={() => {
        if (cancelRef.current) {
          cancelRef.current = false;
          return;
        }
        onRename(draft);
      }}
    />
  );
}

function FolioPage({
  folio, siblings, pageUrl, onSave, onDelete, onRename,
  onRebalanced, pullSource, registerEditor, registerRebalance, onEditorReady, onTick, onAttachmentRequest,
}) {
  if (!folio) return <div className="jv-page jv-page--empty" />;
  const Renderer = RENDERERS[folio.type] || NotesFolio;
  // Notes pages have a hard end (overflow rolls over); other types scroll.
  const fixed = folio.type === 'notes';
  return (
    <div className="jv-page" style={pageUrl ? { backgroundImage: `url(${pageUrl})` } : undefined}>
      <div className={'jv-page__paper' + (fixed ? ' jv-page__paper--fixed' : '')}>
        <header className="jv-page__head">
          <FolioTitle folio={folio} onRename={onRename} />
          <span className="jv-page__type">
            {TYPE_LABELS[folio.type] || folio.type}
            {onDelete && (
              <button type="button" className="jv-x" title="Remove this page" onClick={onDelete}>×</button>
            )}
          </span>
        </header>
        <div className="jv-page__body">
          <Renderer
            folio={folio}
            siblings={siblings}
            onSave={onSave}
            onRebalanced={onRebalanced}
            pullSource={pullSource}
            registerEditor={registerEditor}
            registerRebalance={registerRebalance}
            onEditorReady={onEditorReady}
            onTick={onTick}
            onAttachmentRequest={onAttachmentRequest}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Seamed scroll stack ─────────────────────────────────────────────
   A scroll-toggled folio renders as one page-slot column you scroll
   through: the folio's pages stacked with thin seams. Pagination stays
   fully live underneath — every stacked page keeps the exact PAGE_W×PAGE_H
   geometry (scrollbar hidden to preserve width parity), so line breaks are
   identical to the paginated view and the rebalance engine is untouched.
   Only pages near the viewport mount live editors; the rest are ghosts. */

function ScrollStack({ group, pageUrl, cursorFolioId, folioPageProps, onVisiblePage, registerScrollApi }) {
  const scrollRef = useRef(null);
  const pages = group.folios;
  const step = PAGE_H + STACK_GAP;

  const [win, setWin] = useState(() => {
    const i = Math.max(0, pages.findIndex((f) => f.id === cursorFolioId));
    return { from: Math.max(0, i - 1), to: i + 2 };
  });

  // Land on the page the reader was on when the stack mounts.
  useEffect(() => {
    const i = pages.findIndex((f) => f.id === cursorFolioId);
    if (i > 0 && scrollRef.current) scrollRef.current.scrollTop = i * step;
  }, []);

  // Let the view (page jumper, caret handoff) scroll this stack by page id.
  const stackId = pages[0]?.id;
  useEffect(() => {
    registerScrollApi?.(stackId, (id, smooth) => {
      const i = pages.findIndex((f) => f.id === id);
      if (i >= 0 && scrollRef.current) {
        scrollRef.current.scrollTo({ top: i * step, behavior: smooth ? 'smooth' : 'auto' });
      }
      return i >= 0;
    });
    return () => registerScrollApi?.(stackId, null);
  }, [stackId, pages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const first = Math.floor(el.scrollTop / step);
    const last = Math.floor((el.scrollTop + el.clientHeight) / step);
    const from = Math.max(0, first - 1);
    const to = last + 1;
    setWin((w) => (w.from === from && w.to === to ? w : { from, to }));
    const eye = Math.min(pages.length - 1, Math.max(0, Math.round(el.scrollTop / step)));
    onVisiblePage?.(pages[eye]);
  };

  return (
    <div className="jv-scrollstack" ref={scrollRef} onScroll={onScroll} style={{ rowGap: `${STACK_GAP}px` }}>
      {pages.map((f, i) =>
        i >= win.from && i <= win.to ? (
          <div className="jv-scrollstack__page" key={f.id} style={{ height: `${PAGE_H}px` }}>
            <FolioPage {...folioPageProps(f)} />
          </div>
        ) : (
          <div
            className="jv-scrollstack__page jv-page jv-scrollstack__ghost"
            key={f.id}
            style={{ height: `${PAGE_H}px`, backgroundImage: pageUrl ? `url(${pageUrl})` : undefined }}
          />
        ),
      )}
    </div>
  );
}

/* ── Sidebar: folio jumps + linked project files ─────────────────────── */

function Sidebar({ open, query, setQuery, groups, currentIdx, onJumpGroup, projects }) {
  const q = query.trim().toLowerCase();
  const visible = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => !q || g.title.toLowerCase().includes(q));
  const visibleProjects = projects.filter((p) => !q || p.name.toLowerCase().includes(q));

  const openFile = (file) => {
    if (file?.path) window.api?.forestOpenPath?.(file.path);
  };

  return (
    <aside className={'jvs' + (open ? '' : ' is-closed')}>
      <div className="jvs__top">
        <input
          className="jvs__search"
          type="text"
          value={query}
          placeholder="search"
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
        <div className="jvs__groups">
          {visible.map(({ g, i }) => (
            <button
              type="button"
              key={`${g.key}-${g.start}`}
              className={'jvs__group' + (i === currentIdx ? ' is-current' : '')}
              title={g.folios.length > 1 ? `${g.folios.length} pages` : '1 page'}
              onClick={() => onJumpGroup(g)}
            >
              {g.title}
            </button>
          ))}
          {!visible.length && <p className="jvs__hint">No pages match.</p>}
        </div>
      </div>

      <div className="jvs__files">
        <h4 className="jvs__filehead">project files</h4>
        {visibleProjects.map((p) => (
          <div className="jvs__proj" key={p.id || p.name}>
            <span className="jvs__projname">{p.name}</span>
            {projectFileRows(p).map(({ file, dups }) => (
              <div className="jvs__filerow" key={file.id || file.path || file.name}>
                <button
                  type="button"
                  className="jvs__file"
                  title={file.path || file.name}
                  onClick={() => openFile(file)}
                >
                  {file.name}
                </button>
                {dups > 1 && <span className="jvs__dup">{dups} duplicates?</span>}
              </div>
            ))}
          </div>
        ))}
        {!projects.length && (
          <p className="jvs__hint">Mention a canvas project with <strong>@Name</strong> on any page to link its files here.</p>
        )}
      </div>
    </aside>
  );
}

/* ── Bottom bar: group chip · page jumper · group tag strip ──────────── */

function PageJumper({ group, page, onJump }) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page, group?.key, group?.start]);
  if (!group) return null;

  const commit = () => {
    const n = Math.max(1, Math.min(group.folios.length, parseInt(draft, 10) || page));
    setDraft(String(n));
    if (n !== page) onJump(group.folios[n - 1]);
  };

  return (
    <span className="jvb__pageno">
      pg.{' '}
      <input
        className="jvb__pageinput"
        type="text"
        inputMode="numeric"
        value={draft}
        onInput={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setDraft(String(page));
        }}
      />{' '}
      of {group.folios.length}
    </span>
  );
}

function TagStrip({ tags, onSave }) {
  const [draft, setDraft] = useState('');
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const collapseTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(collapseTimerRef.current), []);

  const onEnter = () => {
    clearTimeout(collapseTimerRef.current);
    if (!hoverExpanded) logger.info('journal', 'Tag strip expanded', { tagCount: tags.length });
    setHoverExpanded(true);
  };

  const onLeave = () => {
    clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      setHoverExpanded(false);
      logger.info('journal', 'Tag strip collapsed', { tagCount: tags.length });
    }, 400);
  };

  const commit = () => {
    const t = draft.trim().replace(/^#/, '').replace(/,+$/, '');
    setDraft('');
    if (!t) return;
    // Tags must be meaningfully different words — dedupe case-insensitively.
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onSave([...tags, t]);
  };

  return (
    <div className="jvb__tagswrap">
      <div
        className={'jvb__tags' + (hoverExpanded ? ' is-expanded' : '')}
        title="Pagegroup tags"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {tags.map((t) => (
          <span className="jr-tag" key={t}>
            {t}
            <button type="button" className="jr-tag__x" aria-label={`Remove ${t}`} onClick={() => onSave(tags.filter((x) => x !== t))}>×</button>
          </span>
        ))}
        <input
          className="jvb__taginput"
          type="text"
          value={draft}
          placeholder={tags.length ? '' : 'tag…'}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              onSave(tags.slice(0, -1));
            }
          }}
          onBlur={commit}
        />
      </div>
    </div>
  );
}

function FloatFolioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 3.5h9a2 2 0 0 1 2 2v15h-11z" />
      <path d="M8.25 7h5.5M8.25 10h5.5M8.25 13h3.25" />
      <path d="m10 20.5 3.2-4 3.3 4" />
    </svg>
  );
}

function FloatJournalHeader({
  title,
  coverUrl,
  tray,
  hasFolios,
  hasEditor,
  canPrev,
  canNext,
  onToggleTray,
  onPrev,
  onNext,
  chrome,
}) {
  return (
    <div
      className="panel-header journal-float__header"
      onMouseDown={chrome?.onDragStart}
      style={coverUrl ? { '--journal-float-cover': `url(${coverUrl})` } : undefined}
    >
      <span className="journal-float__title">{title}</span>

      <div className="journal-float__tools" role="toolbar" aria-label="Journal tools">
        <button
          type="button"
          className={'journal-float__mode-btn' + (tray === 'folio' ? ' is-active' : '')}
          title="Folio tools"
          aria-label="Folio tools"
          aria-expanded={tray === 'folio'}
          aria-controls="journal-float-tools"
          disabled={!hasFolios}
          onClick={() => onToggleTray('folio')}
        >
          <FloatFolioIcon />
        </button>

        <button
          type="button"
          className={'journal-float__mode-btn journal-float__mode-btn--format' + (tray === 'format' ? ' is-active' : '')}
          title="Formatting tools"
          aria-label="Formatting tools"
          aria-expanded={tray === 'format'}
          aria-controls="journal-float-tools"
          disabled={!hasEditor}
          onClick={() => onToggleTray('format')}
        >
          <strong>B</strong><em>I</em><span>U</span>
        </button>

        <div className="journal-float__page-turner" role="group" aria-label="Turn pages">
          <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="Previous page">‹</button>
          <span aria-hidden="true" />
          <button type="button" onClick={onNext} disabled={!canNext} aria-label="Next page">›</button>
        </div>
      </div>

      {(chrome?.onDock || chrome?.onClose) && (
        <div className="panel-header-actions journal-float__window-actions">
          {chrome.onDock && (
            <button type="button" className="panel-header-btn" onClick={chrome.onDock} title="Dock to Journals panel" aria-label="Dock to Journals panel">⤓</button>
          )}
          {chrome.onClose && (
            <button type="button" className="panel-header-btn" onClick={chrome.onClose} title="Close" aria-label="Close">×</button>
          )}
        </div>
      )}
    </div>
  );
}

export function JournalView({
  journal,
  pageUrl,
  coverUrl,
  onBack,
  onJournalChange,
  variant = 'panel',
  onPopOut = null,
  floatChrome = null,
}) {
  /* Float variant: the slimmed-down pop-out editor. Always single-page,
     no sidebar/typography/tag chrome; the floating shell owns close/dock. */
  const isFloat = variant === 'float';
  const [folios, setFolios] = useState(null); // null = loading
  const [cursor, setCursor] = useState(0); // index of the folio under the eye
  const [adding, setAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sideQuery, setSideQuery] = useState('');
  const [canvasProjects, setCanvasProjects] = useState([]);
  const [typoOpen, setTypoOpen] = useState(false);
  const [typoDraft, setTypoDraft] = useState(null); // live preview before persist
  const [attachmentRequest, setAttachmentRequest] = useState(null); // { folioId, position }
  const [narrow, setNarrow] = useState(false); // <800px: one page at a time
  const [scale, setScale] = useState(1);
  const [, setTick] = useState(0); // re-renders the shared toolbar on editor transactions

  // Async handlers (rebalance) need the current list without stale closures.
  const foliosRef = useRef(null);
  foliosRef.current = folios;

  const rootRef = useRef(null);
  const bookRef = useRef(null);
  const portRef = useRef(null);
  const floatTrayRef = useRef(null);
  const wheelRef = useRef({ acc: 0, t: 0, lock: 0 });
  const pendingCaretRef = useRef(null); // { folioId, pos } → focus lands after content does

  // Live notes editors, keyed by folio id; the shared toolbar binds to the
  // focused one (or the first visible one).
  const editorsRef = useRef(new Map());
  const [activeEditorId, setActiveEditorId] = useState(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [floatTray, setFloatTray] = useState(null); // null | 'format' | 'folio'

  // Per-folio rebalance triggers, so typography/font changes can reflow
  // every mounted page.
  const rebalanceFnsRef = useRef(new Map());
  const registerRebalance = (folioId, fn) => {
    if (fn) rebalanceFnsRef.current.set(folioId, fn);
    else rebalanceFnsRef.current.delete(folioId);
  };
  const rebalanceAll = () => rebalanceFnsRef.current.forEach((fn) => fn());

  const registerEditor = (folioId, editorInstance, opts) => {
    if (editorInstance) {
      editorsRef.current.set(folioId, editorInstance);
      if (opts?.focus) setActiveEditorId(folioId);
      else setTick((t) => t + 1); // mounted: make toolbar appear
    } else {
      editorsRef.current.delete(folioId);
      setActiveEditorId((id) => (id === folioId ? null : id));
      setTick((t) => t + 1); // remove stale toolbar/header availability
    }
  };

  const onEditorTick = () => setTick((t) => t + 1);

  const requestAttachment = useCallback((request) => {
    if (!request?.folioId || !Number.isInteger(request.position)) return;
    setAttachmentRequest(request);
  }, []);

  const attachImagesToNote = useCallback((images) => {
    const request = attachmentRequest;
    const editor = request ? editorsRef.current.get(request.folioId) : null;
    const attachable = (images || []).filter((image) => image?.url);

    if (!request || !editor || editor.isDestroyed || !attachable.length) {
      setAttachmentRequest(null);
      return;
    }

    const content = [
      ...attachable.map((image) => ({
        type: 'journalImage',
        attrs: { src: image.url, alt: image.name || 'Journal attachment' },
      })),
      { type: 'paragraph' },
    ];
    editor.chain().focus().insertContentAt(request.position, content).run();
    setAttachmentRequest(null);
    logger.info('journal', 'Images attached to note', {
      folioId: request.folioId,
      count: attachable.length,
    });
  }, [attachmentRequest]);

  const dismissAttachmentRequest = useCallback(() => {
    const request = attachmentRequest;
    setAttachmentRequest(null);
    if (!request) return;
    requestAnimationFrame(() => {
      const editor = editorsRef.current.get(request.folioId);
      if (editor && !editor.isDestroyed) editor.commands.focus();
    });
  }, [attachmentRequest]);

  useEffect(() => {
    api.foliosList(journal.id).then(setFolios).catch((err) => {
      logger.error('journal', 'folios:list failed', err?.message);
      setFolios([]);
    });
  }, [journal.id]);

  // Forest projects (the infinite-forest board store) for @mention file linking.
  useEffect(() => {
    window.api?.forestLoadState?.()
      .then((s) => setCanvasProjects(Array.isArray(s?.projects) ? s.projects : []))
      .catch(() => {});
  }, []);

  /* Narrow layout keys off the journal panel's own width, not the screen,
     so a squeezed split-view behaves like a small window. The float variant
     is always narrow regardless of width. */
  const narrowMode = isFloat || narrow;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setNarrow(w < 800);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Typography: saved on the journal, previewed via draft, applied through
     CSS variables. Any change reflows the mounted pages. */
  const typo = typoDraft || { ...DEFAULT_TYPO, ...(journal.settings?.typography || {}) };
  const typoKey = JSON.stringify(typo);
  useEffect(() => {
    const t = setTimeout(rebalanceAll, 80); // let the CSS variables land first
    return () => clearTimeout(t);
  }, [typoKey]);
  useEffect(() => {
    document.fonts?.ready?.then?.(() => rebalanceAll()); // webfont metrics settle late
  }, []);

  const closeTypo = () => {
    setTypoOpen(false);
    if (!typoDraft) return;
    const settings = { ...(journal.settings || {}), typography: typoDraft };
    onJournalChange?.({ ...journal, settings }); // optimistic
    setTypoDraft(null);
    api.update(journal.id, { settings })
      .then((updated) => onJournalChange?.(updated))
      .catch((err) => logger.error('journal', 'journals:update failed', err?.message));
  };

  /* ── Folios + slot layout ─────────────────────────────────────────
     The bifold shows SLOTS. A paginated folio contributes one slot per
     page; a scroll-toggled folio collapses into a single scrolling slot
     rendered where its pages would have been. */
  const count = folios?.length || 0;
  const maxIdx = Math.max(0, count - 1);
  const cur = Math.min(cursor, maxIdx);
  const curFolio = folios?.[cur];

  const groups = useMemo(() => computeGroups(folios), [folios]);
  const isScrolled = (g) => g.type === 'notes' && !!g.folios[0]?.content?.groupScroll;
  const slots = useMemo(() => {
    const out = [];
    for (const g of groups) {
      if (isScrolled(g)) out.push({ kind: 'scroll', group: g });
      else g.folios.forEach((f) => out.push({ kind: 'page', folio: f }));
    }
    return out;
  }, [groups]);

  let slotIdx = slots.findIndex((s) =>
    s.kind === 'page' ? s.folio.id === curFolio?.id : s.group.folios.some((f) => f.id === curFolio?.id));
  if (slotIdx < 0) slotIdx = 0;

  /* A lone slot (e.g. one scrolled folio and nothing else) presents as a
     single centered page rather than facing an empty ghost. */
  const single = narrowMode || slots.length === 1;
  const leftSlotIdx = single ? slotIdx : slotIdx - (slotIdx % 2);
  const leftSlot = slots[leftSlotIdx];
  const rightSlot = single ? undefined : slots[leftSlotIdx + 1];
  const slotFolio = (s) => (s ? (s.kind === 'page' ? s.folio : s.group.folios[0]) : undefined);
  const canPrev = leftSlotIdx > 0;
  const canNext = single ? leftSlotIdx < slots.length - 1 : leftSlotIdx + 2 <= slots.length - 1;
  const goPrev = () => { if (canPrev) jumpToFolio(slotFolio(slots[leftSlotIdx - (single ? 1 : 2)])); };
  const goNext = () => { if (canNext) jumpToFolio(slotFolio(slots[leftSlotIdx + (single ? 1 : 2)])); };

  /* The folio under the eye follows the cursor; inside a scrolled folio
     that's the page most visible in the stack. */
  const activeFolio = curFolio;
  const activeGroupIdx = activeFolio
    ? groups.findIndex((g) => g.folios.some((f) => f.id === activeFolio.id))
    : -1;
  const activeGroup = activeGroupIdx >= 0 ? groups[activeGroupIdx] : null;
  const activePage = activeGroup
    ? activeGroup.folios.findIndex((f) => f.id === activeFolio.id) + 1
    : 0;
  const activeScrolled = activeGroup ? isScrolled(activeGroup) : false;

  const toggleActiveScroll = () => {
    if (!activeGroup) return;
    const first = activeGroup.folios[0];
    saveFolio(first)({ content: { ...first.content, groupScroll: !first.content?.groupScroll } });
  };

  /* Fixed page geometry: pages are always PAGE_W×PAGE_H CSS px, so line
     breaks never move; the book scales to whatever space is available. */
  const naturalW = single ? PAGE_W : PAGE_W * 2 + SPINE_W;
  const naturalH = PAGE_H;
  const hasBook = count > 0;
  useLayoutEffect(() => {
    const el = portRef.current;
    if (!el) return;
    const compute = () => {
      /* clientWidth/clientHeight are the port's true layout dimensions.
         getBoundingClientRect includes the float's opening perspective tilt,
         which made the first scale too small until a resize remeasured it. */
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width && height) setScale(Math.min(width / naturalW, height / naturalH, 2.2));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalW, hasBook]);

  /* Narrow mode: a vertical scroll gesture flips pages, unless something
     inside the page (tracker, list…) can still scroll itself. */
  const onPortWheel = (e) => {
    if (!narrowMode) return;
    let el = e.target;
    while (el && el !== e.currentTarget) {
      if (el.scrollHeight > el.clientHeight + 1) {
        const oy = getComputedStyle(el).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          const down = e.deltaY > 0;
          if ((down && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (!down && el.scrollTop > 0)) return;
        }
      }
      el = el.parentElement;
    }
    const now = Date.now();
    const w = wheelRef.current;
    if (now - w.t > 400) w.acc = 0;
    w.t = now;
    if (now < w.lock) return;
    w.acc += e.deltaY;
    if (Math.abs(w.acc) > 120) {
      if (w.acc > 0) goNext(); else goPrev();
      w.acc = 0;
      w.lock = now + 450;
    }
  };

  /* Scrolled folios register a scroll-by-page-id handle here (keyed by
     their first page id), so the jumper and caret handoff can reach them. */
  const scrollApisRef = useRef(new Map());
  const registerScrollApi = (stackId, fn) => {
    if (fn) scrollApisRef.current.set(stackId, fn);
    else scrollApisRef.current.delete(stackId);
  };

  const jumpToFolio = (target) => {
    if (!target) return;
    const idx = (foliosRef.current || []).findIndex((f) => f.id === target.id);
    if (idx >= 0) setCursor(idx);
    for (const fn of scrollApisRef.current.values()) if (fn(target.id, true)) break;
  };

  /* Cursor tracks the page the reader has scrolled to inside a stack. */
  const onStackEye = (f) => {
    const i = (foliosRef.current || []).findIndex((x) => x.id === f.id);
    if (i >= 0) setCursor((p) => (p === i ? p : i));
  };

  /* Journal text → linked canvas projects (sidebar "project files"). */
  const linkedProjects = useMemo(() => {
    if (!folios?.length || !canvasProjects.length) return [];
    const text = folios.map(folioText).join('\n').toLowerCase();
    return canvasProjects.filter((p) => p.name && text.includes('@' + p.name.toLowerCase()));
  }, [folios, canvasProjects]);

  /* Group tags live on the group's first folio (content.groupTags). */
  const activeTags = activeGroup?.folios[0]?.content?.groupTags || [];
  const saveActiveTags = (tags) => {
    if (!activeGroup) return;
    const first = activeGroup.folios[0];
    saveFolio(first)({ content: { ...first.content, groupTags: tags } });
  };

  /* A pending caret waits for its destination page's editor to hold the
     rolled-over content, then focus lands at the equivalent spot. */
  const consumePendingCaret = (folioId, ed) => {
    const pend = pendingCaretRef.current;
    if (!pend || pend.folioId !== folioId || !ed || ed.isDestroyed) return;
    pendingCaretRef.current = null;
    requestAnimationFrame(() => {
      if (ed.isDestroyed) return;
      try {
        ed.commands.focus(Math.max(1, Math.min(pend.pos, ed.state.doc.content.size - 1)));
      } catch {
        ed.commands.focus('start');
      }
    });
  };

  /* What an actively-edited notes page may pull back from: the next folio
     of the same group — unless someone's caret lives there, or it's blank. */
  const pullSourceFor = (folio) => () => {
    const list = foliosRef.current || [];
    const idx = list.findIndex((f) => f.id === folio.id);
    const next = idx >= 0 ? list[idx + 1] : null;
    if (!continuesGroup(folio, next)) return null;
    const nextEd = editorsRef.current.get(next.id);
    if (nextEd && !nextEd.isDestroyed && nextEd.isFocused) return null; // never yank under a live cursor
    const doc = next.content?.doc;
    const blocks = doc && typeof doc === 'object' ? doc.content || [] : null;
    if (!blocks || !blocks.length) return null;
    const blank = blocks.length === 1 && blocks[0].type === 'paragraph' && !(blocks[0].content || []).length;
    return blank ? null : { folioId: next.id, blocks };
  };

  /* A page finished rebalancing: its shed tail becomes the next page of
     the group — replacing that page's doc when its blocks were pulled into
     the merge, prepending otherwise, or growing the group by a fresh page.
     The caret follows its own block onto the next page. */
  const handleRebalanced = (folio) => ({ moved, pulledFromId, caretRel }) => {
    const list = foliosRef.current || [];
    const idx = list.findIndex((f) => f.id === folio.id);
    if (idx < 0) return;
    const next = list[idx + 1];
    const sameGroup = continuesGroup(folio, next);

    const writeNext = (target, doc) => {
      if (JSON.stringify(target.content?.doc) === JSON.stringify(doc)) return;
      const patch = { content: { ...target.content, doc, body: undefined } };
      setFolios((prev) => prev.map((f) => (f.id === target.id ? { ...f, ...patch } : f)));
      api.foliosUpdate(target.id, patch).catch((err) => logger.error('journal', 'rebalance update failed', err?.message));
    };

    if (pulledFromId && sameGroup && next.id === pulledFromId) {
      // The merge consumed the next page's blocks; the tail IS its new doc.
      writeNext(next, { type: 'doc', content: moved.length ? moved : [{ type: 'paragraph' }] });
      if (caretRel != null) {
        pendingCaretRef.current = { folioId: next.id, pos: caretRel };
        jumpToFolio(next); // content-sync in the target editor consumes it
      }
      return;
    }

    if (!moved || !moved.length) return;

    if (sameGroup) {
      // Pull was skipped (blank page, or a caret lives there) — prepend.
      const nextEd = editorsRef.current.get(next.id);
      if (nextEd && !nextEd.isDestroyed) {
        nextEd.chain().command(({ tr, state }) => {
          tr.setMeta('addToHistory', false);
          tr.insert(0, moved.map((n) => state.schema.nodeFromJSON(n)));
          return true;
        }).run();
        writeNext(next, nextEd.getJSON());
        // The prepend can overflow that page in turn — cascade explicitly,
        // since rebalance transactions don't self-trigger onUpdate.
        rebalanceFnsRef.current.get(next.id)?.();
        if (caretRel != null) {
          pendingCaretRef.current = { folioId: next.id, pos: caretRel };
          jumpToFolio(next);
          consumePendingCaret(next.id, nextEd); // content is already in place
        }
      } else {
        const existing = next.content?.doc && typeof next.content.doc === 'object'
          ? next.content.doc.content || []
          : [];
        writeNext(next, { type: 'doc', content: [...moved, ...existing] });
        if (caretRel != null) {
          pendingCaretRef.current = { folioId: next.id, pos: caretRel };
          jumpToFolio(next);
        }
      }
    } else {
      const spec = {
        type: folio.type,
        title: folio.title,
        content: { doc: { type: 'doc', content: moved } },
      };
      api.foliosCreate(journal.id, spec, { afterId: folio.id }).then((created) => {
        setFolios((prev) => {
          const i = (prev || []).findIndex((f) => f.id === folio.id);
          const nextList = [...(prev || [])];
          nextList.splice(i + 1, 0, created);
          return nextList;
        });
        if (caretRel != null) {
          pendingCaretRef.current = { folioId: created.id, pos: caretRel };
          requestAnimationFrame(() => jumpToFolio(created)); // after the list lands
        }
      }).catch((err) => logger.error('journal', 'rebalance create failed', err?.message));
    }
  };

  // Toolbar binds to the focused notes editor if mounted, else the first
  // mounted one (only visible pages — incl. a stack's window — mount).
  const mountedNoteIds = [...editorsRef.current.keys()];
  const toolbarId = activeEditorId && editorsRef.current.has(activeEditorId)
    ? activeEditorId
    : mountedNoteIds[0];
  const toolbarEditor = toolbarId ? editorsRef.current.get(toolbarId) : null;
  useEffect(() => { setToolbarCollapsed(false); }, [toolbarId]);
  useEffect(() => {
    if (isFloat && floatTray === 'format' && !toolbarEditor) setFloatTray(null);
  }, [isFloat, floatTray, toolbarEditor]);

  const toggleFloatTray = (next) => {
    setFloatTray((current) => (current === next ? null : next));
  };

  /* The float grows by the revealed tool row's measured height. That keeps
     the page itself at full size instead of reintroducing letterboxing while
     either toolbar is open. */
  useEffect(() => {
    const reportHeight = floatChrome?.onTrayHeightChange;
    if (!isFloat || !reportHeight) return undefined;
    const tray = floatTrayRef.current;
    if (!tray) {
      reportHeight(0);
      return undefined;
    }

    const report = () => reportHeight(tray.getBoundingClientRect().height);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(tray);
    return () => observer.disconnect();
  }, [isFloat, floatTray, folios?.length, toolbarEditor, floatChrome?.onTrayHeightChange]);

  const addPage = (spec) => {
    /* Folio+ means a NEW folio: stamp groupStart so the row starts its own
       pagegroup instead of merging into a same-type+title group above it.
       Overflow pages (handleRebalanced) stay unstamped continuations. */
    const stamped = { ...spec, content: { ...(spec.content || {}), groupStart: true } };
    api.foliosCreate(journal.id, stamped).then((created) => {
      const newIdx = foliosRef.current?.length ?? 0;
      setFolios((prev) => [...(prev || []), created]);
      setCursor(newIdx); // jump to the new page
      setAdding(false);
    }).catch((err) => logger.error('journal', 'folios:create failed', err?.message));
  };

  const deleteFolio = (folio) => () => {
    if (!window.confirm(`Remove the page “${folio.title}”? Its contents will be lost.`)) return;
    // Folio-level flags (tags, scroll, the new-folio start marker) ride on
    // the first page — hand them to the next page before deleting their
    // carrier. Without the groupStart hand-off, a folio losing its first
    // page would silently merge into a same-type+title group above it.
    const gs = computeGroups(foliosRef.current || []);
    const g = gs.find((x) => x.folios.some((f) => f.id === folio.id));
    if (g && g.folios[0].id === folio.id && g.folios[1]) {
      const heir = g.folios[1];
      const carry = {};
      if (folio.content?.groupTags) carry.groupTags = folio.content.groupTags;
      if (folio.content?.groupScroll) carry.groupScroll = folio.content.groupScroll;
      if (folio.content?.groupStart) carry.groupStart = true;
      if (Object.keys(carry).length) saveFolio(heir)({ content: { ...heir.content, ...carry } });
    }
    api.foliosDelete(folio.id).then(() => {
      setFolios((prev) => {
        const next = prev.filter((f) => f.id !== folio.id);
        setCursor((c) => Math.max(0, Math.min(c, next.length - 1)));
        return next;
      });
    }).catch((err) => logger.error('journal', 'folios:delete failed', err?.message));
  };

  /* Renaming a folio renames its whole pagegroup in one motion — the
     title is half the group key, so a lone renamed page would split off
     its own folio. If the new name makes this group's key collide with a
     neighbouring group of the same type, groupStart stamps keep the
     boundary from fusing (legacy groups may not carry one yet). */
  const renameFolio = (folio) => (rawTitle) => {
    const title = String(rawTitle ?? '').trim();
    if (title === folio.title) return;
    const gs = computeGroups(foliosRef.current || []);
    const gi = gs.findIndex((x) => x.folios.some((f) => f.id === folio.id));
    if (gi < 0) return;
    const g = gs[gi];
    const newKey = `${g.type}|${title}`;

    const patches = new Map();
    g.folios.forEach((f) => patches.set(f.id, { title }));
    const first = g.folios[0];
    const prev = gs[gi - 1];
    if (prev && prev.key === newKey && !first.content?.groupStart) {
      patches.set(first.id, { title, content: { ...first.content, groupStart: true } });
    }
    const after = gs[gi + 1];
    const afterFirst = after?.folios[0];
    if (afterFirst && after.key === newKey && !afterFirst.content?.groupStart) {
      patches.set(afterFirst.id, { content: { ...afterFirst.content, groupStart: true } });
    }

    /* Dashboard widgets bind to their source folio BY TITLE (see
       computeWidgetValue) — retarget any widget pointing at this group's
       old name so live stats survive the rename. */
    const oldTitle = folio.title;
    (foliosRef.current || []).forEach((f) => {
      if (f.type !== 'dashboard') return;
      const widgets = f.content?.widgets;
      if (!Array.isArray(widgets)) return;
      const points = (w) => w?.source && w.source.from === g.type && w.source.folio === oldTitle;
      if (!widgets.some(points)) return;
      const nextWidgets = widgets.map((w) => (points(w) ? { ...w, source: { ...w.source, folio: title } } : w));
      const base = patches.get(f.id) || {};
      patches.set(f.id, { ...base, content: { ...f.content, ...(base.content || {}), widgets: nextWidgets } });
    });

    setFolios((prevList) => prevList.map((f) => (patches.has(f.id) ? { ...f, ...patches.get(f.id) } : f)));
    Promise.all([...patches.entries()].map(([id, patch]) => api.foliosUpdate(id, patch)))
      .then(() => {
        logger.info('journal', 'Folio renamed', {
          journalId: journal.id,
          from: folio.title || '(untitled)',
          to: title || '(untitled)',
          pages: g.folios.length,
        });
      })
      .catch((err) => logger.error('journal', 'folios:update rename failed', err?.message));
  };

  const saveFolio = (folio) => (patch) => {
    // Optimistic local update so live dashboard widgets refresh instantly.
    setFolios((prev) => prev.map((f) => (f.id === folio.id ? { ...f, ...patch } : f)));
    api.foliosUpdate(folio.id, patch).then((updated) => {
      setFolios((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }).catch((err) => logger.error('journal', 'folios:update failed', err?.message));
  };

  useEffect(() => {
    /* Panel variant listens on window (it owns the whole panel). The float
       listens on its own root only, so a book open in the tile and a float
       never both flip pages on one keypress; float Escape is handled by the
       App-level overlay chain, not here. */
    const target = isFloat ? rootRef.current : window;
    if (!target) return;
    const onKey = (e) => {
      // Don't hijack arrows/Escape while typing in a field or the editor.
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (el?.closest?.('.jv-float-tray')) return; // arrows scroll/navigate the open tray
      if (!isFloat && e.key === 'Escape') onBack();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    target.addEventListener('keydown', onKey);
    return () => target.removeEventListener('keydown', onKey);
  }, [leftSlotIdx, slots.length, single, onBack, isFloat]);

  const renderSlot = (slot, emptyKey) => {
    if (!slot) return <div className="jv-page jv-page--empty" key={emptyKey} />;
    if (slot.kind === 'scroll') {
      return (
        <ScrollStack
          key={`stack-${slot.group.folios[0].id}`}
          group={slot.group}
          pageUrl={pageUrl}
          cursorFolioId={curFolio?.id}
          folioPageProps={folioPageProps}
          onVisiblePage={onStackEye}
          registerScrollApi={registerScrollApi}
        />
      );
    }
    return <FolioPage key={slot.folio.id} {...folioPageProps(slot.folio)} />;
  };

  const folioPageProps = (folio) => ({
    folio,
    siblings: folios,
    pageUrl,
    onSave: folio ? saveFolio(folio) : undefined,
    onDelete: folio ? deleteFolio(folio) : undefined,
    onRename: folio ? renameFolio(folio) : undefined,
    onRebalanced: folio ? handleRebalanced(folio) : undefined,
    pullSource: folio ? pullSourceFor(folio) : undefined,
    registerEditor,
    registerRebalance,
    onEditorReady: consumePendingCaret,
    onTick: onEditorTick,
    onAttachmentRequest: requestAttachment,
  });

  return (
    <>
      {isFloat && (
        <FloatJournalHeader
          title={journal.title}
          coverUrl={coverUrl}
          tray={floatTray}
          hasFolios={folios?.length > 0}
          hasEditor={!!toolbarEditor}
          canPrev={canPrev}
          canNext={canNext}
          onToggleTray={toggleFloatTray}
          onPrev={goPrev}
          onNext={goNext}
          chrome={floatChrome}
        />
      )}
      <div
        className={'jv-root' + (narrowMode ? ' is-narrow' : '') + (isFloat ? ' is-float' : '')}
        ref={rootRef}
        tabIndex={-1}
        style={{
          '--jv-h1-font': typo.h1,
          '--jv-h2-font': typo.h2,
          '--jv-h3-font': typo.h3,
          '--jv-body-font': typo.body,
          '--jv-body-size': `${typo.size}px`,
          '--jv-lh': String(typo.lineHeight),
        }}
      >
      {!isFloat && coverUrl && (
        <div
          className="jv-backdrop"
          style={{ backgroundImage: `url(${coverUrl})` }}
          aria-hidden="true"
        />
      )}
      {folios === null && (
        <>
          {!isFloat && (
            <div className="jv-topbar">
              <button type="button" className="jr-btn" onClick={onBack}>← shelf</button>
              <h2 className="jv-title">{journal.title}</h2>
            </div>
          )}
          <p className="jr-empty">Opening…</p>
        </>
      )}

      {folios?.length === 0 && (
        <>
          {!isFloat && (
            <div className="jv-topbar">
              <button type="button" className="jr-btn" onClick={onBack}>← shelf</button>
              <h2 className="jv-title">{journal.title}</h2>
              <button type="button" className="jr-btn" onClick={() => setAdding(true)}>+ folio</button>
            </div>
          )}
          {isFloat ? (
            <div className="jv-empty-state is-float">
              <p className="jr-empty">No folios yet.</p>
              <button type="button" className="jr-btn" onClick={() => setAdding(true)}>+ folio</button>
            </div>
          ) : (
            <p className="jr-empty">No folios yet — press <strong>+ folio</strong> to add one.</p>
          )}
        </>
      )}

      {toolbarEditor && !isFloat && (
        <EditorToolbar
          editor={toolbarEditor}
          key={toolbarId}
          toolbarId={toolbarId}
          rootRef={rootRef}
          bookRef={bookRef}
          collapsed={toolbarCollapsed}
          onToggleCollapsed={() => setToolbarCollapsed((c) => !c)}
        />
      )}

      {isFloat && folios?.length > 0 && floatTray === 'format' && toolbarEditor && (
        <div ref={floatTrayRef} className="jv-float-tray jv-float-tray--format" id="journal-float-tools">
          <div className="jv-float-tray__scroll" role="region" tabIndex={0} aria-label="Formatting tools; scroll horizontally for more">
            <EditorToolbar
              editor={toolbarEditor}
              key={`tray-${toolbarId}`}
              toolbarId={toolbarId}
              rootRef={rootRef}
              bookRef={bookRef}
              collapsed={false}
              placement="tray"
              onDismiss={() => setFloatTray(null)}
            />
          </div>
        </div>
      )}

      {isFloat && folios?.length > 0 && floatTray === 'folio' && (
        <div ref={floatTrayRef} className="jv-float-tray jv-float-tray--folio" id="journal-float-tools">
          <div className="jv-float-tray__scroll" role="region" tabIndex={0} aria-label="Folio tools; scroll horizontally for more">
            <div className="jvb jvb--float">
              <button type="button" className="jr-btn" onClick={() => setAdding(true)}>+ folio</button>
              {activeGroup && <span className="jvb__chip">{activeGroup.title}</span>}
              <PageJumper group={activeGroup} page={activePage} onJump={jumpToFolio} />
              {activeGroup?.type === 'notes' && (
                <button
                  type="button"
                  className={'jvb__scrolltoggle' + (activeScrolled ? ' is-on' : '')}
                  title={activeScrolled
                    ? 'Back to page-by-page reading'
                    : 'Read this folio as one continuous scroll'}
                  onClick={toggleActiveScroll}
                >{activeScrolled ? '⧉ pages' : '⇳ scroll'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {folios?.length > 0 && (
        <div className="jv-main">
          {!isFloat && (
            <Sidebar
              open={sidebarOpen && !narrowMode}
              query={sideQuery}
              setQuery={setSideQuery}
              groups={groups}
              currentIdx={activeGroupIdx}
              onJumpGroup={(g) => jumpToFolio(g.folios[0])}
              projects={linkedProjects}
            />
          )}
          {!isFloat && (
            <button
              type="button"
              className="jvs-toggle"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >{sidebarOpen ? '‹' : '›'}</button>
          )}

          <div className="jv-center">
            <div className="jv-book" ref={bookRef}>
              {!isFloat && (
                <button
                  type="button"
                  className="jv-nav"
                  disabled={!canPrev}
                  onClick={goPrev}
                  aria-label={single ? 'Previous page' : 'Previous spread'}
                >‹</button>
              )}

              <div className="jv-bookport" ref={portRef} onWheel={onPortWheel}>
                <div
                  className="jv-bookscale"
                  style={{ width: `${naturalW}px`, height: `${naturalH}px`, transform: `scale(${scale})` }}
                >
                  <div className={'jv-spread' + (single ? ' jv-spread--single' : '')}>
                    {renderSlot(leftSlot, 'empty-left')}
                    {!single && <div className="jv-spine" />}
                    {!single && renderSlot(rightSlot, 'empty-right')}
                  </div>
                </div>
              </div>

              {!isFloat && (
                <button
                  type="button"
                  className="jv-nav right"
                  disabled={!canNext}
                  onClick={goNext}
                  aria-label={single ? 'Next page' : 'Next spread'}
                >›</button>
              )}
            </div>

            {!isFloat && (
              <div className="jvb">
                <button type="button" className="jr-btn" title="Typography" onClick={() => setTypoOpen(true)}>Aa</button>
                {onPopOut && (
                <button type="button" className="jr-btn" title="Pop out journal" aria-label="Pop out journal" onClick={onPopOut}>↗</button>
                )}
                <button type="button" className="jr-btn" onClick={() => setAdding(true)}>+ folio</button>
                <span className="jv-pageno">
                  {single
                    ? `page ${slotIdx + 1} / ${slots.length}`
                    : `spread ${Math.floor(leftSlotIdx / 2) + 1} / ${Math.max(1, Math.ceil(slots.length / 2))}`}
                </span>
                {activeGroup && <span className="jvb__chip">{activeGroup.title}</span>}
                <PageJumper
                  group={activeGroup}
                  page={activePage}
                  onJump={jumpToFolio}
                />
                {activeGroup?.type === 'notes' && (
                  <button
                    type="button"
                    className={'jvb__scrolltoggle' + (activeScrolled ? ' is-on' : '')}
                    title={activeScrolled
                      ? 'Back to page-by-page reading'
                      : 'Read this folio as one continuous scroll'}
                    onClick={toggleActiveScroll}
                  >{activeScrolled ? '⧉ pages' : '⇳ scroll'}</button>
                )}
                {activeGroup && <TagStrip tags={activeTags} onSave={saveActiveTags} />}
                {toolbarEditor && toolbarCollapsed && (
                  <button
                    type="button"
                    className="jv-wrench"
                    title="Show formatting toolbar"
                    aria-label="Show formatting toolbar"
                    onClick={() => {
                      setToolbarCollapsed(false);
                      logger.info('journal', 'Toolbar restored from wrench', { folioId: toolbarId });
                    }}
                  >
                    {WRENCH_ICON}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {adding && <AddPageModal onClose={() => setAdding(false)} onPick={addPage} />}
      {attachmentRequest && (
        <JournalAttachmentModal
          onClose={dismissAttachmentRequest}
          onAttach={attachImagesToNote}
        />
      )}
      {typoOpen && (
        <TypographyModal
          typo={typo}
          onChange={(t) => setTypoDraft(t || { ...DEFAULT_TYPO })}
          onClose={closeTypo}
        />
      )}
      </div>
    </>
  );
}
