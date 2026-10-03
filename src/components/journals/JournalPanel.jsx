import { useEffect, useMemo, useRef, useState } from 'react';
import '../../AppCombined.css';
import { api, JOURNALS_CHANGED_EVENT } from './api.js';
import { TEMPLATES } from './templates.js';
import { JournalView } from './JournalView.jsx';
import { JournalTrash } from './JournalTrash.jsx';
import {
  COVERS, PAGES, COVER_NAMES, PAGE_NAMES, getCoverUrl, getPageUrl,
} from './assets.js';
import {
  IMPORT_TARGETS, TEXT_FILE_ACCEPT, MAX_FILES, readTextFiles, buildFolios, previewImport,
} from './import.js';
import logger from '../../lib/logger';

/* ── SF Symbols from the supplied symbol catalog ───────────────────────── */

const Icon = {
  plus: <span className="jr-sf-symbol" aria-hidden="true">􀅼</span>,
  search: <span className="jr-sf-symbol" aria-hidden="true">􀊫</span>,
  chat: <span className="jr-sf-symbol" aria-hidden="true">􀒤</span>,
  home: <span className="jr-sf-symbol" aria-hidden="true">􀎞</span>,
  trash: <span className="jr-sf-symbol" aria-hidden="true">􀈑</span>,
  archive: <span className="jr-sf-symbol" aria-hidden="true">􀣔</span>,

};

/* ── Import section ──────────────────────────────────────────────────
   Pre-fills a new journal from text files. Each file becomes one page:
   aimed by hand at notes or a list, or left on "sort for me" so import.js
   reads its shape and decides. Long notes imports paginate themselves the
   moment the journal opens — the viewer's rebalance engine rolls overflow
   into continuation pages, so nothing here needs to think about paper. */

function ImportSection({ docs, targets, onDocs, onTarget, onRemove }) {
  const inputRef = useRef(null);
  const [skipped, setSkipped] = useState([]);
  const [reading, setReading] = useState(false);

  const pick = async (fileList) => {
    if (!fileList?.length) return;
    setReading(true);
    try {
      const result = await readTextFiles(fileList);
      setSkipped(result.skipped);
      onDocs(result.docs);
      if (result.docs.length) {
        logger.info('journal', 'Import files read', { count: result.docs.length });
      }
      if (result.skipped.length) {
        logger.warn('journal', 'Import skipped files', { count: result.skipped.length });
      }
    } catch (err) {
      logger.error('journal', 'Import read failed', err?.message);
      setSkipped([{ name: 'those files', reason: 'could not be read' }]);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="jr-field">
      <span className="jr-field__label">import</span>
      <div className="jr-import">
        <input
          ref={inputRef}
          className="jr-import__file"
          type="file"
          multiple
          accept={TEXT_FILE_ACCEPT}
          onChange={(e) => {
            pick(e.currentTarget.files);
            e.currentTarget.value = ''; // let the same file be re-picked
          }}
        />
        <div className="jr-import__head">
          <button type="button" className="jr-btn" disabled={reading} onClick={() => inputRef.current?.click()}>
            {reading ? 'reading…' : 'choose text files…'}
          </button>
          <span className="jr-import__hint">
            {docs.length
              ? `${docs.length} file${docs.length === 1 ? '' : 's'} — one page each`
              : 'Text or markdown. Each file fills its own page.'}
          </span>
        </div>

        {docs.length > 0 && (
          <ul className="jr-import__list">
            {docs.map((doc) => {
              const target = targets[doc.id] || 'auto';
              const preview = previewImport(doc, target);
              return (
                <li className="jr-import__row" key={doc.id}>
                  <div className="jr-import__meta">
                    <span className="jr-import__name" title={doc.name}>{doc.name}</span>
                    <span className="jr-import__preview">
                      → {preview.type === 'todo' ? 'list' : 'notes'} · {preview.label}
                      {preview.reason ? ` · ${preview.reason}` : ''}
                    </span>
                  </div>
                  <div className="jr-import__targets" role="group" aria-label={`Page type for ${doc.name}`}>
                    {IMPORT_TARGETS.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className={'jr-import__target' + (target === t.id ? ' is-selected' : '')}
                        title={t.hint}
                        aria-pressed={target === t.id}
                        onClick={() => onTarget(doc.id, t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="jr-import__drop"
                    title={`Remove ${doc.name}`}
                    aria-label={`Remove ${doc.name}`}
                    onClick={() => onRemove(doc.id)}
                  >×</button>
                </li>
              );
            })}
          </ul>
        )}

        {skipped.length > 0 && (
          <p className="jr-import__skipped">
            Skipped {skipped.map((s) => `${s.name} (${s.reason})`).join(', ')}.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Create modal ────────────────────────────────────────────────────── */

function CreateJournalModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [cover, setCover] = useState(COVER_NAMES[0] || '');
  const [page, setPage] = useState(PAGE_NAMES[0] || '');
  const [templateId, setTemplateId] = useState('blank');
  const [importDocs, setImportDocs] = useState([]);
  const [importTargets, setImportTargets] = useState({}); // docId → 'auto'|'notes'|'todo'
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  const pickTemplate = (t) => {
    setTemplateId(t.id);
    // Templates suggest a cover/page; the user can still override below.
    if (t.cover && getCoverUrl(t.cover, { surface: `new journal template: ${t.id}` })) setCover(t.cover);
    if (t.page && getPageUrl(t.page, { surface: `new journal template: ${t.id}` })) setPage(t.page);
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

  /* Files land after the template's prefab pages, in the order they were
     picked, so a template's dashboard still opens the book. The cap counts
     across picks, not per pick — re-opening the chooser can't sneak past it. */
  const addImportDocs = (incoming) => {
    setImportDocs((prev) => {
      const seen = new Set(prev.map((d) => d.id));
      return [...prev, ...incoming.filter((d) => !seen.has(d.id))].slice(0, MAX_FILES);
    });
  };

  const removeImportDoc = (docId) => {
    setImportDocs((prev) => prev.filter((d) => d.id !== docId));
    setImportTargets(({ [docId]: _dropped, ...rest }) => rest);
  };

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      const mergedTags = [...new Set([...tags, ...(template.tags || [])])];
      // Deep-copy folios so journals never share template object references.
      const folios = JSON.parse(JSON.stringify(template.folios || []));
      const imported = buildFolios(importDocs, importTargets);
      await onCreate({
        title: title.trim(), tags: mergedTags, cover, page, mode: template.mode || 'journal', folios: [...folios, ...imported],
      });
      if (imported.length) {
        logger.info('journal', 'Journal pre-filled from files', {
          files: imported.length,
          notes: imported.filter((f) => f.type === 'notes').length,
          lists: imported.filter((f) => f.type === 'todo').length,
        });
      }
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
                  {t.mode === 'execubriiz' ? 'entries + working board' : t.folios.length ? `${t.folios.length} prefab pages` : 'no pages'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ImportSection
          docs={importDocs}
          targets={importTargets}
          onDocs={addImportDocs}
          onTarget={(docId, target) => setImportTargets((prev) => ({ ...prev, [docId]: target }))}
          onRemove={removeImportDoc}
        />

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

function JournalCard({ journal, selected, onSelect, onPopOut }) {
  const url = getCoverUrl(journal.cover, { journalId: journal.id, surface: 'shelf' });
  const coverRef = useRef(null);
  /* The wrapper exists because a <button> can't nest the tear-off button;
     it carries the grid sizing the card used to own. */
  return (
    <div className={'jr-cardwrap' + (selected ? ' is-selected' : '')}>
      <button
        type="button"
        className={'jr-card' + (selected ? ' is-selected' : '')}
        onClick={onSelect}
        aria-pressed={selected}
      >
        {url
          ? <img ref={coverRef} className="jr-card__cover" src={url} alt="" draggable={false} />
          : <span ref={coverRef} className="jr-card__cover jr-card__cover--missing" />}
        <span className="jr-card__plaque">
          <span className="jr-card__name">{journal.title}</span>
          <span className="jr-card__count">{journal.mode === 'execubriiz' ? 'execubriiz' : journal.folioCount === 1 ? '1 folio' : `${journal.folioCount || 0} folios`}</span>
        </span>
      </button>
      {selected && onPopOut && (
        <button
          type="button"
          className="jr-card__popout"
          title={`Pop out ${journal.title}`}
          aria-label={`Pop out ${journal.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPopOut(journal, coverRef.current?.getBoundingClientRect() || null);
          }}
        >↗</button>
      )}
    </div>
  );
}

/* ── Home view ───────────────────────────────────────────────────────── */

export function JournalPanel({
  onPopOutJournal = null,
  floatingJournalId = null,
  onFloatingJournalHome = null,
  pendingOpenJournalId = null,
  onPendingOpenHandled = null,
}) {
  const [journals, setJournals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const [headerSlot, setHeaderSlot] = useState(null); // header host for the open journal's tool row

  useEffect(() => {
    api.list().then(setJournals).catch((err) => {
      logger.error('journal', 'journals:list failed', err?.message);
    });
  }, []);

  /* The floating editor announces its edits (and its closing) via a window
     event; refetch so shelf folio counts and titles stay fresh. */
  useEffect(() => {
    const onChanged = () => {
      api.list().then(setJournals).catch((err) => {
        logger.error('journal', 'journals:list refresh failed', err?.message);
      });
    };
    window.addEventListener(JOURNALS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(JOURNALS_CHANGED_EVENT, onChanged);
  }, []);

  /* Dock hand-off: the float closed and asked us to open its journal in
     the book view. Waits for the initial list load when the panel mounts
     fresh as part of the dock. */
  useEffect(() => {
    if (!pendingOpenJournalId) return;
    if (journals.some((j) => j.id === pendingOpenJournalId)) {
      setSelectedId(pendingOpenJournalId);
      setOpenId(pendingOpenJournalId);
      onPendingOpenHandled?.();
      logger.info('journal', 'Docked journal opened in panel', { journalId: pendingOpenJournalId });
    }
  }, [pendingOpenJournalId, journals, onPendingOpenHandled]);

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
    /* Every template-born folio starts its own pagegroup (see the
       groupStart contract in JournalView's computeGroups). */
    const folios = (input.folios || []).map((f) => ({
      ...f,
      content: { ...(f.content || {}), groupStart: true },
    }));
    const created = await api.create({ ...input, folios });
    setJournals((prev) => [...prev, created]);
    setSelectedId(created.id);
    if (created.mode === 'execubriiz') setOpenId(created.id);
    logger.info('journal', 'Journal created', { id: created.id, title: created.title });
  };

  const selectedJournal = journals.find((journal) => journal.id === selectedId);

  const handleDelete = async () => {
    if (!selectedJournal || deleting) return;
    setDeleting(true);
    try {
      await api.delete(selectedJournal.id);
      setJournals((prev) => prev.filter((journal) => journal.id !== selectedJournal.id));
      setSelectedId(null);
      setOpenId(null);
      // Tell a float holding this journal to close itself.
      window.dispatchEvent(new CustomEvent(JOURNALS_CHANGED_EVENT, {
        detail: { journalId: selectedJournal.id, deleted: true },
      }));
      logger.info('journal', 'Journal archived to Trash; it can be restored there', { id: selectedJournal.id, title: selectedJournal.title });
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
        <div className="panel-header-tools" ref={setHeaderSlot} />
      </div>
      <div className="panel-content">
        {openJournal ? (
          <JournalView
            journal={openJournal}
            pageUrl={getPageUrl(openJournal.page, { journalId: openJournal.id, surface: 'panel' })}
            coverUrl={getCoverUrl(openJournal.cover, { journalId: openJournal.id, surface: 'panel' })}
            onBack={() => setOpenId(null)}
            headerSlot={headerSlot}
            onJournalChange={(updated) =>
              setJournals((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)))}
            onPopOut={onPopOutJournal ? () => {
              // Pop out and hand the panel back to the shelf. The app
              // places every newly floating journal at its home rect.
              onPopOutJournal(openJournal.id, null, 'book');
              setOpenId(null);
            } : null}
          />
        ) : (
          <div className="journals-home" onClick={() => setSelectedId(null)}>



              <button
                type="button"
                className="jr-action jr-action--current jr-home-button"
                title={floatingJournalId ? 'Center floating journal' : 'Home'}
                aria-label={floatingJournalId ? 'Center floating journal' : 'Home'}
                disabled={!floatingJournalId || !onFloatingJournalHome}
                onClick={onFloatingJournalHome}
              >
                {Icon.home}
              </button>

              <div className="jr-actions" onClick={(e) => e.stopPropagation()}>

                <div className="jr-panel-control-group" id="jr-search">

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

              <button type="button" className="jr-action" title="New journal" onClick={() => setCreating(true)}>
                {Icon.plus}
              </button>




              <button type="button" className="jr-action is-stub" title="Chat (coming soon)" disabled>
                {Icon.chat}
              </button>
              <div className="jr-panel-control-group">
              <button
                type="button"
                className="jr-action jr-action--danger"
                title={selectedJournal ? `Archive ${selectedJournal.title}` : 'Select a journal to archive it'}
                aria-label={selectedJournal ? `Archive ${selectedJournal.title}` : 'Select a journal to archive it'}
                disabled={!selectedJournal || deleting}
                onClick={handleDelete}
              >
                {Icon.trash}
              </button>

                <button
                  type="button"
                  className="jr-action"
                  onClick={() => setTrashOpen(true)}>{Icon.archive}</button></div>


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
                  onPopOut={onPopOutJournal
                    ? (journal, coverRect) => onPopOutJournal(journal.id, coverRect, 'shelf')
                    : null}
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
      {trashOpen && <JournalTrash onClose={() => setTrashOpen(false)} />}
    </div>
  );
}
