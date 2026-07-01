import { useEffect, useMemo, useRef, useState } from 'react';
import './journals.css';
import { api } from './api.js';
import { TEMPLATES } from './templates.js';
import { JournalView } from './JournalView.jsx';
import logger from '../../lib/logger';

/* ── Assets ──────────────────────────────────────────────────────────
   Covers and page styles ship with the renderer. Journals store only the
   asset *name* (basename, no extension); URLs are resolved here at render
   time so the DB never holds build-specific paths. */

const COVER_URLS = import.meta.glob('./assets/covers/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const PAGE_URLS = import.meta.glob('./assets/pages/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

function toAssetMap(globbed) {
  const map = {};
  for (const [path, url] of Object.entries(globbed)) {
    const name = path.split('/').pop().replace(/\.webp$/i, '');
    map[name] = url;
  }
  return map;
}

const COVERS = toAssetMap(COVER_URLS);
const PAGES = toAssetMap(PAGE_URLS);
const COVER_NAMES = Object.keys(COVERS).sort();
const PAGE_NAMES = Object.keys(PAGES).sort();

/* ── Icons (inline SVG, stroke = currentColor) ───────────────────────── */

const Icon = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.5 4h6a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-1.2l-2.8 2.6V14h-2a5 5 0 0 1 0-10z" />
      <path d="M17.2 15.9a6.5 6.5 0 0 1-3 .9l-.9.8a4.6 4.6 0 0 0 3.4 1.5h.9l2.2 2v-2.4a4.2 4.2 0 0 0-2.6-2.8z" opacity="0.85" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3.6 4 10.4V20a1 1 0 0 0 1 1h4.6v-5.4h4.8V21H19a1 1 0 0 0 1-1v-9.6L12 3.6z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  ),
};

/* ── Create modal ────────────────────────────────────────────────────── */

function CreateJournalModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [cover, setCover] = useState(COVER_NAMES[0] || '');
  const [page, setPage] = useState(PAGE_NAMES[0] || '');
  const [templateId, setTemplateId] = useState('blank');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  const pickTemplate = (t) => {
    setTemplateId(t.id);
    // Templates suggest a cover/page; the user can still override below.
    if (t.cover && COVERS[t.cover]) setCover(t.cover);
    if (t.page && PAGES[t.page]) setPage(t.page);
  };

  useEffect(() => titleRef.current?.focus(), []);

  const commitTag = () => {
    const t = tagDraft.trim().replace(/,+$/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft('');
  };

  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      const mergedTags = [...new Set([...tags, ...(template.tags || [])])];
      // Deep-copy folios so journals never share template object references.
      const folios = JSON.parse(JSON.stringify(template.folios || []));
      await onCreate({ title: title.trim(), tags: mergedTags, cover, page, folios });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="jr-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jr-modal" role="dialog" aria-label="New journal" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2 className="jr-modal__title">new journal</h2>

        <label className="jr-field">
          <span className="jr-field__label">title</span>
          <input
            ref={titleRef}
            className="jr-input"
            type="text"
            value={title}
            placeholder="Name your journal…"
            onInput={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </label>

        <div className="jr-field">
          <span className="jr-field__label">template</span>
          <div className="jr-templates">
            {TEMPLATES.map((t) => (
              <button
                type="button"
                key={t.id}
                className={'jr-template' + (templateId === t.id ? ' is-selected' : '')}
                onClick={() => pickTemplate(t)}
              >
                <span className="jr-template__name">{t.name}</span>
                <span className="jr-template__tagline">{t.tagline}</span>
                <span className="jr-template__count">
                  {t.folios.length ? `${t.folios.length} prefab pages` : 'no pages'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="jr-field">
          <span className="jr-field__label">globaltags</span>
          <div className="jr-tagbox" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
            {tags.map((t) => (
              <span className="jr-tag" key={t}>
                {t}
                <button type="button" className="jr-tag__x" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
              </span>
            ))}
            <input
              className="jr-tagbox__input"
              type="text"
              value={tagDraft}
              placeholder={tags.length ? '' : 'Add tags (Enter or comma)…'}
              onInput={(e) => setTagDraft(e.currentTarget.value)}
              onKeyDown={onTagKey}
              onBlur={commitTag}
            />
          </div>
        </label>

        <div className="jr-field">
          <span className="jr-field__label">cover</span>
          <div className="jr-picker jr-picker--covers">
            {COVER_NAMES.map((name) => (
              <button
                type="button"
                key={name}
                className={'jr-swatch' + (cover === name ? ' is-selected' : '')}
                title={name}
                onClick={() => setCover(name)}
              >
                <img src={COVERS[name]} alt={name} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="jr-field">
          <span className="jr-field__label">page type</span>
          <div className="jr-picker jr-picker--pages">
            {PAGE_NAMES.map((name) => (
              <button
                type="button"
                key={name}
                className={'jr-swatch' + (page === name ? ' is-selected' : '')}
                title={name}
                onClick={() => setPage(name)}
              >
                <img src={PAGES[name]} alt={name} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="jr-modal__actions">
          <button type="button" className="jr-btn" onClick={onClose}>cancel</button>
          <button type="button" className="jr-btn jr-btn--primary" disabled={!title.trim() || busy} onClick={submit}>
            create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Journal card ────────────────────────────────────────────────────── */

function JournalCard({ journal, selected, onSelect }) {
  const url = COVERS[journal.cover];
  return (
    <button
      type="button"
      className={'jr-card' + (selected ? ' is-selected' : '')}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {url
        ? <img className="jr-card__cover" src={url} alt="" draggable={false} />
        : <span className="jr-card__cover jr-card__cover--missing" />}
      <span className="jr-card__plaque">
        <span className="jr-card__name">{journal.title}</span>
        <span className="jr-card__count">{journal.folioCount === 1 ? '1 folio' : `${journal.folioCount || 0} folios`}</span>
      </span>
    </button>
  );
}

/* ── Home view ───────────────────────────────────────────────────────── */

export function JournalPanel() {
  const [journals, setJournals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    api.list().then(setJournals).catch((err) => {
      logger.error('journal', 'journals:list failed', err?.message);
    });
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return journals;
    return journals.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [journals, query]);

  const handleCreate = async (input) => {
    const created = await api.create(input);
    setJournals((prev) => [...prev, created]);
    setSelectedId(created.id);
    logger.info('journal', 'Journal created', { id: created.id, title: created.title });
  };

  const selectedJournal = journals.find((journal) => journal.id === selectedId);

  const handleDelete = async () => {
    if (!selectedJournal || deleting) return;
    const folioLabel = selectedJournal.folioCount === 1 ? '1 folio' : `${selectedJournal.folioCount || 0} folios`;
    const confirmed = window.confirm(
      `Delete “${selectedJournal.title}” and its ${folioLabel}?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(selectedJournal.id);
      setJournals((prev) => prev.filter((journal) => journal.id !== selectedJournal.id));
      setSelectedId(null);
      setOpenId(null);
      logger.info('journal', 'Journal deleted', { id: selectedJournal.id, title: selectedJournal.title });
    } catch (err) {
      logger.error('journal', 'journals:delete failed', err?.message);
      window.alert(`Could not delete “${selectedJournal.title}”. Please try again.`);
    } finally {
      setDeleting(false);
    }
  };

  const openJournal = journals.find((j) => j.id === openId);

  return (
    <div className="panel journal-panel">
      <div className="panel-header">
        <span className="panel-header-title">Journal</span>
      </div>
      <div className="panel-content">
        {openJournal ? (
          <JournalView
            journal={openJournal}
            pageUrl={PAGES[openJournal.page]}
            coverUrl={COVERS[openJournal.cover]}
            onBack={() => setOpenId(null)}
          />
        ) : (
          <div className="journals-home" onClick={() => setSelectedId(null)}>
            <div className="jr-actions" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="jr-action" title="New journal" onClick={() => setCreating(true)}>
                {Icon.plus}
              </button>
              <button
                type="button"
                className={'jr-action' + (searchOpen ? ' is-active' : '')}
                title="Search journals"
                onClick={() => {
                  if (searchOpen) setQuery('');
                  setSearchOpen(!searchOpen);
                }}
              >
                {Icon.search}
              </button>
              <button type="button" className="jr-action is-stub" title="Chat (coming soon)" disabled>
                {Icon.chat}
              </button>
              <button
                type="button"
                className="jr-action jr-action--danger"
                title={selectedJournal ? `Delete ${selectedJournal.title}` : 'Select a journal to delete it'}
                aria-label={selectedJournal ? `Delete ${selectedJournal.title}` : 'Select a journal to delete it'}
                disabled={!selectedJournal || deleting}
                onClick={handleDelete}
              >
                {Icon.trash}
              </button>
              <button type="button" className="jr-action jr-action--current" title="Home" disabled>
                {Icon.home}
              </button>

              <div className={'jr-searchbar' + (searchOpen ? ' is-open' : '')}>
                <input
                  ref={searchRef}
                  className="jr-input jr-searchbar__input"
                  type="text"
                  value={query}
                  placeholder="Filter by title or globaltag…"
                  onInput={(e) => setQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setQuery('');
                      setSearchOpen(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="jr-grid">
              {visible.map((j) => (
                <JournalCard
                  key={j.id}
                  journal={j}
                  selected={selectedId === j.id}
                  onSelect={(e) => {
                    e.stopPropagation();
                    // First click selects (lights up the cover); second click opens.
                    if (selectedId === j.id) setOpenId(j.id);
                    else setSelectedId(j.id);
                  }}
                />
              ))}
              {!journals.length && (
                <p className="jr-empty">No journals yet — press <strong>+</strong> to make your first one.</p>
              )}
              {journals.length > 0 && !visible.length && (
                <p className="jr-empty">Nothing matches “{query}”.</p>
              )}
            </div>

            {creating && <CreateJournalModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
          </div>
        )}
      </div>
    </div>
  );
}
