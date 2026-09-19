import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorToolbar } from './richtext';
import { ExecEditor, ExecubriizBoard } from './ExecubriizBoard';
import { journalClient, textOf, docOf } from './execubriiz-client';
import { JournalTrash } from './JournalTrash';
import logger from '../../lib/logger';

const stamp = (time) => new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const entryLabel = (entry) => entry.label || entry.text.replace(/\s+/g, ' ').slice(0, 100) || 'Untitled entry';

function EntryModal({ entry, session, onClose, onAction, onAsk, onError }) {
  const dialog = useRef(null); const [cover, setCover] = useState(null); const [copied, setCopied] = useState(false);
  useEffect(() => { dialog.current.showModal(); }, []);
  const act = (action, data, close = false) => onAction(action, data).then(() => close && onClose()).catch(onError);
  const copy = async () => {
    try {
      const html = dialog.current.querySelector('.exec-entry-preview .tiptap')?.innerHTML;
      if (html && window.ClipboardItem) await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([entry.text], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
      else await navigator.clipboard.writeText(entry.text);
      setCopied(true); logger.info('journal', 'Journal entry copied', { entryId: entry.id });
    }
    catch (error) { onError(error); }
  };
  return <dialog ref={dialog} className="exec-dialog exec-entry-modal" onCancel={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
    <div className="exec-entry-actions"><button disabled={entry.privacy === 'private'} onClick={() => act('focus', { entryId: entry.id }, true)}>FOCUS<br />ON THIS</button><button disabled={entry.privacy === 'private'} onClick={() => { onAsk(entry.id); onClose(); }}>ASK</button><button className="exec-archive" onClick={() => act('archiveEntry', { entryId: entry.id }, true)}>ARCHIVE</button><button className="exec-copy" onClick={copy}>{copied ? 'COPIED' : 'COPY'}</button><button className="exec-modal-close" aria-label="Close entry" onClick={onClose}>×</button></div>
    <div className="exec-entry-heading">{stamp(session?.createdAt || entry.createdAt)} Session <span>(“{entryLabel(entry)}”)</span></div>
    <div className="exec-entry-preview"><ExecEditor identity={entry.id} doc={entry.doc} readOnly label="Saved entry" /></div>
    <div className="exec-entry-privacy"><button title="Invisible: AI may use this for general ideas, without quotes or attribution" aria-label="Invisible" aria-pressed={entry.privacy === 'invisible'} onClick={() => act('entry', { entryId: entry.id, privacy: entry.privacy === 'invisible' ? 'open' : 'invisible' })}><span className="jr-sf-symbol">􀋭</span></button><button title="Private: do not send this entry to AI" aria-label="Private" aria-pressed={entry.privacy === 'private'} onClick={() => act('entry', { entryId: entry.id, privacy: entry.privacy === 'private' ? 'open' : 'private' })}><span className="jr-sf-symbol">{entry.privacy === 'private' ? '􀎡' : '􀎣'}</span></button></div>
    {cover !== null && <form className="exec-highlight-form" onSubmit={(e) => { e.preventDefault(); act('entry', { entryId: entry.id, label: cover }); setCover(null); }}><label>Chip label<input autoFocus value={cover} maxLength={200} onChange={(e) => setCover(e.target.value)} placeholder="Blank uses your opening words" /></label><button type="submit">save</button></form>}
    <footer><button onClick={() => setCover(window.getSelection()?.toString().trim() || entry.label || entry.text.slice(0, 80))}>Highlight cover</button><button onClick={() => act('editEntry', { entryId: entry.id }, true)}>open in editor</button></footer>
  </dialog>;
}

function Companion({ journalId, title, onClose, children, homeRequest }) {
  const frame = useRef(null); const drag = useRef(null);
  const home = () => ({ x: Math.max(8, window.innerWidth - Math.min(440, window.innerWidth - 16) - 18), y: Math.round(window.innerHeight * .125), width: Math.min(440, window.innerWidth - 16), height: Math.round(window.innerHeight * .75) });
  const [rect, setRect] = useState(home);
  useEffect(() => { if (homeRequest) setRect(home()); }, [homeRequest]);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(`exec-board-frame:${journalId}`)); if (saved?.width && saved?.height) setRect({ x: Math.max(8, Math.min(saved.x, window.innerWidth - 120)), y: Math.max(8, Math.min(saved.y, window.innerHeight - 80)), width: Math.max(280, Math.min(saved.width, window.innerWidth - 16)), height: Math.max(240, Math.min(saved.height, window.innerHeight - 16)) }); } catch { /* Unavailable preferences do not prevent writing. */ }
  }, [journalId]);
  const begin = (e, resize = false) => {
    if (e.button !== 0 || (!resize && e.target.closest('button'))) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, rect, resize };
  };
  const move = (e) => {
    const from = drag.current; if (!from) return;
    const dx = e.clientX - from.x; const dy = e.clientY - from.y;
    setRect(from.resize ? { ...from.rect, width: Math.max(280, Math.min(window.innerWidth - from.rect.x - 8, from.rect.width + dx)), height: Math.max(240, Math.min(window.innerHeight - from.rect.y - 8, from.rect.height + dy)) } : { ...from.rect, x: Math.min(window.innerWidth - 100, Math.max(0, from.rect.x + dx)), y: Math.min(window.innerHeight - 45, Math.max(0, from.rect.y + dy)) });
  };
  const end = () => {
    if (!drag.current) return; drag.current = null;
    try { localStorage.setItem(`exec-board-frame:${journalId}`, JSON.stringify(rect)); } catch { /* Geometry is optional. */ }
    logger.info('journal', 'Analysis companion moved or resized', { journalId, ...rect });
  };
  return createPortal(<div ref={frame} className="exec-companion" style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>
    <header onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}><span>{title} · board</span><button title="Return companion to its home position" onClick={() => setRect(home())}><span className="jr-sf-symbol">􀎞</span></button><button title="Hide analysis companion" onClick={onClose}>×</button></header>
    {children}<button className="exec-companion-resize" aria-label="Resize analysis companion" onPointerDown={(e) => begin(e, true)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>◢</button>
  </div>, document.body);
}

export function ExecubriizView({ journal, variant = 'panel', onBack, onPopOut, floatChrome = null, floatHomeRequest = 0 }) {
  const client = useMemo(() => journalClient(journal.id), [journal.id]);
  const [state, setState] = useState(client.get()); const stateRef = useRef(state); stateRef.current = state;
  const [error, setError] = useState(''); const [saveStatus, setSaveStatus] = useState('saved');
  const [activeEditor, setActiveEditor] = useState(null); const [, tick] = useState(0);
  const [entryId, setEntryId] = useState(null); const [trash, setTrash] = useState(false);
  const [models, setModels] = useState([]); const [narrow, setNarrow] = useState(variant === 'float');
  const [boardOpen, setBoardOpen] = useState(true); const [finishing, setFinishing] = useState(false);
  const [ask, setAsk] = useState(null); const [question, setQuestion] = useState('');
  const [composerPrivacy, setComposerPrivacy] = useState(state?.draft.privacy || 'open');
  const root = useRef(null); const composer = useRef(null); const pending = useRef(null); const timer = useRef(null); const mounted = useRef(true);
  const submittedDraft = useRef(null);
  const surfaceId = useRef(crypto.randomUUID());
  const onError = useCallback((e) => { if (mounted.current) setError(e?.message || String(e)); logger.error('journal.execubriiz', 'Journal action failed', { journalId: journal.id, reason: e?.message || String(e) }); }, [journal.id]);
  const command = useCallback((action, input = {}) => client.command(action, input), [client]);
  const capture = useCallback((editor, transaction = false) => {
    if (editor.isDestroyed) return;
    if (!transaction || editor.isFocused) setActiveEditor(editor);
    if (editor.isFocused) tick((n) => n + 1);
  }, []);
  const recoveryKey = `exec-draft-recovery:${journal.id}`;
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const value = pending.current;
    if (!value) return client.get();
    pending.current = null;
    submittedDraft.current = { id: value.draftId, revision: value.baseRevision + 1 };
    if (mounted.current) setSaveStatus('saving…');
    try {
      const next = await client.command('draft', { doc: value.doc, privacy: value.privacy, draftId: value.draftId, expectedRevision: value.baseRevision });
      if (!pending.current) {
        try { localStorage.removeItem(recoveryKey); } catch { /* The authoritative database save already succeeded. */ }
        if (mounted.current) setSaveStatus('saved');
      }
      return next;
    } catch (e) { if (!pending.current) pending.current = value; submittedDraft.current = null; if (mounted.current) setSaveStatus('not saved · retry'); onError(e); throw e; }
  }, [client, recoveryKey, onError]);
  const draftChanged = (doc, privacy = composerPrivacy) => {
    const latest = client.get().draft;
    const value = { doc, privacy, draftId: latest.id, baseRevision: pending.current?.baseRevision ?? Math.max(latest.revision, submittedDraft.current?.id === latest.id ? submittedDraft.current.revision : 0) };
    pending.current = value; setSaveStatus('saving…');
    try { localStorage.setItem(recoveryKey, JSON.stringify(value)); } catch (e) { logger.warn('journal.execubriiz', 'Temporary draft recovery copy unavailable', { reason: e.message }); }
    clearTimeout(timer.current); timer.current = setTimeout(() => flush().catch(() => {}), 350);
  };
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = client.subscribe((next) => { setState(next); if (!pending.current) setComposerPrivacy(next.draft.privacy); });
    client.refresh().then((next) => {
      try {
        const backup = JSON.parse(localStorage.getItem(recoveryKey));
        if (backup?.draftId === next.draft.id) {
          if (JSON.stringify(backup.doc) === JSON.stringify(next.draft.doc) && backup.privacy === next.draft.privacy) localStorage.removeItem(recoveryKey);
          else {
            pending.current = backup; composer.current?.commands.setContent(backup.doc, false); setComposerPrivacy(backup.privacy);
            flush().catch(() => {});
          }
        }
      } catch (e) { onError(e); }
    }).catch(onError);
    window.api?.getModels?.().then(setModels).catch(onError);
    const observer = new ResizeObserver(([entry]) => setNarrow(variant === 'float' || entry.contentRect.width < 800));
    observer.observe(root.current);
    return () => { mounted.current = false; unsubscribe(); observer.disconnect(); flush().catch(() => {}); };
  }, [client]);
  const finish = async () => {
    if (finishing) return;
    setFinishing(true); setError('');
    try { await flush(); await command('finish', (s) => ({ draftId: s.draft.id, expectedRevision: s.draft.revision })); }
    catch (e) { onError(e); } finally { setFinishing(false); }
  };
  const act = useCallback(async (action, data) => {
    if (['editEntry','cancelEdit','newSession','focus','ask'].includes(action)) await flush();
    return command(action, data);
  }, [command, flush]);
  const changePrivacy = (privacy) => {
    setComposerPrivacy(privacy); draftChanged(composer.current?.getJSON() || state.draft.doc, privacy); flush().catch(() => {});
  };
  const prompt = (intent) => act('ask', { intent }).catch(onError);
  const newSession = async () => {
    try { await flush(); if (textOf(client.get().draft.doc).trim()) await command('finish', (s) => ({ draftId: s.draft.id, expectedRevision: s.draft.revision })); await command('newSession'); }
    catch (e) { onError(e); }
  };
  const leave = async (callback) => { try { await flush(); callback?.(); } catch { /* Stay with the unsaved draft. */ } };
  const protectedIds = useCallback((ids) => { window.api?.execubriiz?.protect(journal.id, ids, surfaceId.current).catch(onError); }, [journal.id, onError]);
  const insertedStarter = useRef(null);
  useEffect(() => {
    const response = state?.response;
    if (response?.intent !== 'starter' || !response.text || response.id === insertedStarter.current || response.draftId !== state.draft.id || textOf(composer.current?.getJSON()).trim()) return;
    insertedStarter.current = response.id;
    composer.current?.commands.insertContent(docOf(response.text).content);
    command('dismissResponse').catch(onError);
  }, [state?.response]);
  const selectedEntry = state?.entries.find((entry) => entry.id === entryId);
  const firstInSession = new Set();
  const firstIds = new Set(state?.entries.filter((entry) => { if (firstInSession.has(entry.sessionId)) return false; firstInSession.add(entry.sessionId); return true; }).map((entry) => entry.id));
  const busyJobs = state?.jobs.filter((job) => ['running', 'queued'].includes(job.status)) || [];
  const failedJob = state?.jobs.find((job) => job.status === 'failed');
  const board = state && <ExecubriizBoard state={state} onAction={act} onError={onError} onEntry={setEntryId} onEditor={capture} onProtected={protectedIds} visible={boardOpen} />;
  return <div ref={root} className={`exec-journal${narrow ? ' is-narrow' : ''}${variant === 'float' ? ' is-floating' : ''}`}>
    <header className="exec-topbar" onMouseDown={(e) => { if (variant === 'float' && !e.target.closest('button')) floatChrome?.onDragStart?.(e); }}>{variant !== 'float' && <button title="Back to journals" onClick={() => leave(onBack)}>‹</button>}<strong>{journal.title}</strong><span className="exec-mode-label">execubriiz</span>
      <button title={boardOpen ? 'Hide working board' : 'Show working board'} aria-pressed={boardOpen} onClick={() => { setBoardOpen(!boardOpen); logger.info('journal', 'Analysis board visibility changed', { visible: !boardOpen }); }}>board</button>
      <button title="Journal Trash" onClick={() => setTrash(true)}><span className="jr-sf-symbol">􀈑</span></button>
      {onPopOut && <button title="Float journal" onClick={() => leave(onPopOut)}>↗</button>}
      {variant === 'float' && floatChrome?.onDock && <button title="Dock to Journals panel" onClick={() => leave(floatChrome.onDock)}>⤓</button>}
      {variant === 'float' && floatChrome?.onClose && <button title="Close floating journal" onClick={() => leave(floatChrome.onClose)}>×</button>}
    </header>
    {!state ? <div className="exec-loading">{error || 'Opening your writing and working board…'}</div> : <>
      <div className={`exec-spread${!boardOpen ? ' board-hidden' : ''}`}>
        <div className="exec-writing">
          <div className="exec-entry-grid" aria-label="Saved journal entries">{state.entries.length ? state.entries.map((entry) => <button key={entry.id} className={`exec-chip is-${entry.privacy}${firstIds.has(entry.id) ? ' is-session-start' : ''}${state.focusId === entry.id ? ' is-focused' : ''}`} title={`${stamp(entry.createdAt)} · ${entry.privacy} · ${entryLabel(entry)}`} onClick={() => { setEntryId(entry.id); logger.info('journal', 'Journal entry opened', { entryId: entry.id }); }}>
            <span className="exec-chip-label">{entryLabel(entry)}</span><span className="exec-chip-rail" aria-label={entry.privacy}><span /></span>
          </button>) : <div className="exec-chip-empty">Your opening words become the cover of each entry.<span>Finish one below to begin this session.</span></div>}</div>
          <div className="exec-session-bar"><span>{stamp(state.sessions.find((s) => s.id === state.sessionId)?.createdAt || Date.now())} session</span>{state.focusId && <button title="Clear entry focus" onClick={() => act('focus', { entryId: null }).catch(onError)}>focused · ×</button>}<button onClick={newSession} disabled={finishing}>new session</button></div>
          {activeEditor && !activeEditor.isDestroyed && <EditorToolbar editor={activeEditor} placement="docked" toolbarId={`exec-toolbar-${journal.id}`} />}
          {ask && <form className="exec-ask" onSubmit={(e) => { e.preventDefault(); act('ask', { intent: 'ask', entryId: ask === 'draft' ? null : ask, question }).then(() => { setAsk(null); setQuestion(''); }).catch(onError); }}><label>Ask about {ask === 'draft' ? 'this draft' : 'this entry'}<input autoFocus value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would help you think this through?" /></label><button disabled={!question.trim()}>ask</button><button type="button" aria-label="Cancel question" onClick={() => setAsk(null)}>×</button></form>}
          {state.response?.text && <div className="exec-response"><p>{state.response.text}</p>{state.response.intent === 'starter' && <button onClick={() => { composer.current?.commands.insertContent(docOf(state.response.text).content); command('dismissResponse').catch(onError); }}>insert into entry</button>}<button title="Dismiss writing prompt" onClick={() => command('dismissResponse').catch(onError)}>×</button></div>}
          <div className="exec-composer" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); finish(); } }}>
            {state.draft.editingId && <div className="exec-edit-banner">editing saved entry <button onClick={() => act('cancelEdit').catch(onError)}>return to draft</button></div>}
            <ExecEditor key={state.draft.id} identity={state.draft.id} doc={state.draft.doc} onChange={draftChanged} onEditor={(editor, transaction) => { composer.current = editor; capture(editor, transaction); }} readOnly={finishing} label="Write your journal entry" />
          </div>
          <div className="exec-compose-actions"><div className="exec-prompt-actions"><button disabled={composerPrivacy === 'private'} onClick={() => prompt('prompt')}>prompt me</button><button disabled={composerPrivacy === 'private'} onClick={() => prompt('starter')}>start me off</button><button disabled={composerPrivacy === 'private'} onClick={() => setAsk('draft')}>ask</button></div>
            <button className={`exec-privacy-toggle is-${composerPrivacy}`} title="Private keeps this draft out of AI requests" aria-pressed={composerPrivacy === 'private'} onClick={() => changePrivacy(composerPrivacy === 'private' ? 'open' : 'private')}>private<small>{composerPrivacy === 'private' ? 'ON' : 'OFF'}</small></button>
            <button className={`exec-invisible-toggle${composerPrivacy === 'invisible' ? ' is-active' : ''}`} aria-label="Invisible: use without attribution" aria-pressed={composerPrivacy === 'invisible'} title="Invisible: AI can use general ideas, without quotes or attribution" onClick={() => changePrivacy(composerPrivacy === 'invisible' ? 'open' : 'invisible')}><span className="jr-sf-symbol">􀋭</span></button>
          </div>
          <div className="exec-finish-row"><button className="exec-save-status" onClick={() => flush().catch(() => {})}>{saveStatus}</button><button className="exec-finish" disabled={finishing} onClick={finish}>{finishing ? 'saving…' : state.draft.editingId ? 'save entry' : 'finish entry'}<small>⌘↵</small></button></div>
        </div>
        {!narrow && boardOpen && board}
      </div>
      <footer className="exec-status"><div className={`exec-processing${busyJobs.length ? ' is-busy' : ''}`} role="status"><i /><span>{state.prefs.paused ? 'AI paused · writing stays open' : busyJobs.length ? `${busyJobs.some((job) => job.status === 'running') ? 'processing' : 'queued'}…` : 'ready when you are'}</span></div>
        <details className="exec-settings"><summary>support</summary><div><label>Intensity<select value={state.prefs.intensity} onChange={(e) => command('prefs', { prefs: { intensity: e.target.value } }).catch(onError)}><option value="inbox">Inbox-only assistant</option><option value="live">Live chronicler</option><option value="full">Full suite support</option></select></label>
          <label>Live model<select value={state.prefs.model} onChange={(e) => command('prefs', { prefs: { model: e.target.value } }).catch(onError)}><option value="">Use configured default</option>{models.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}</select></label>
          <label>Deeper work<select value={state.prefs.deepModel} onChange={(e) => command('prefs', { prefs: { deepModel: e.target.value } }).catch(onError)}><option value="">Same as live model</option>{models.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}</select></label>
          <p>Full suite adds source-backed online reactions. No external actions are executed. API profiles are required; Codex Subscription remains available in Chat.</p><small>{state.usage.calls} completed calls · {state.usage.input.toLocaleString()} input / {state.usage.output.toLocaleString()} output tokens</small>
        </div></details><button onClick={() => command('prefs', { prefs: { paused: !state.prefs.paused } }).catch(onError)}>{state.prefs.paused ? 'resume AI' : 'pause AI'}</button>
      </footer>
      {(error || failedJob) && <div className="exec-error" role="alert"><span>{error || failedJob.error}</span>{failedJob && <button onClick={() => command('retry', { jobId: failedJob.id }).then(() => setError('')).catch(onError)}>retry AI</button>}{error && <button aria-label="Dismiss message" onClick={() => setError('')}>×</button>}</div>}
      {narrow && boardOpen && <Companion journalId={journal.id} title={journal.title} homeRequest={floatHomeRequest} onClose={() => setBoardOpen(false)}>{board}</Companion>}
      {selectedEntry && <EntryModal key={selectedEntry.id} entry={selectedEntry} session={state.sessions.find((s) => s.id === selectedEntry.sessionId)} onClose={() => setEntryId(null)} onAction={act} onAsk={setAsk} onError={onError} />}
    </>}
    {trash && <JournalTrash journalId={journal.id} onClose={() => setTrash(false)} />}
  </div>;
}
