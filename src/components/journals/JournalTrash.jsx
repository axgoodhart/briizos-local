import { useEffect, useRef, useState } from 'react';
import { JOURNALS_CHANGED_EVENT } from './api';
import logger from '../../lib/logger';

export function JournalTrash({ journalId = null, onClose }) {
  const dialog = useRef(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const reload = async () => {
    if (!window.api?.execubriiz) { setError('Restart the desktop app to load Journal Trash.'); setItems([]); return; }
    try { setItems(await window.api.execubriiz.trash(journalId)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { dialog.current.showModal(); reload(); }, []);
  const act = async (item, purge = false) => {
    if (purge && !window.confirm(`Permanently delete “${item.title || 'Untitled entry'}”? This cannot be restored from Journal Trash.`)) return;
    setBusy(true); setError('');
    try {
      await window.api.execubriiz.trashAction({ id: item.id, kind: item.kind, purge, confirmed: purge });
      logger.info('journal', purge ? 'Journal Trash item permanently deleted' : 'Journal Trash item restored', { id: item.id, kind: item.kind });
      window.dispatchEvent(new CustomEvent(JOURNALS_CHANGED_EVENT, { detail: { journalId: item.journalId } }));
      await reload();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const visible = (items || []).filter((item) => (!sessionFilter || item.sessionId === sessionFilter) && `${item.title} ${item.kind}`.toLowerCase().includes(filter.toLowerCase()));
  const sessions = [...new Map((items || []).filter((item) => item.sessionId).map((item) => [item.sessionId, item])).values()];
  const purgeVisible = async () => {
    if (!visible.length || !window.confirm(`Permanently delete these ${visible.length} visible archived items? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try {
      for (const item of visible) await window.api.execubriiz.trashAction({ id: item.id, kind: item.kind, purge: true, confirmed: true });
      window.dispatchEvent(new CustomEvent(JOURNALS_CHANGED_EVENT)); await reload();
    } catch (e) { setError(e.message); await reload(); } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="exec-dialog exec-trash" onCancel={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
    <header><h2>Journal Trash</h2><button onClick={onClose} aria-label="Close Trash">×</button></header>
    <p>Archived entries, pages and journals stay here until you restore or permanently delete them.</p>
    <input aria-label="Filter Journal Trash" placeholder="Find an archived item…" value={filter} onChange={(e) => setFilter(e.target.value)} />
    <div className="exec-trash-filter"><select aria-label="Filter by session" value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}><option value="">all sessions</option>{sessions.map((item, index) => <option key={item.sessionId} value={item.sessionId}>{new Date(item.createdAt).toLocaleDateString()} · session {index + 1}</option>)}</select><button disabled={busy || !visible.length} className="exec-danger" onClick={purgeVisible}>delete shown forever</button></div>
    {error && <p role="alert" className="exec-error">{error}</p>}
    {items === null ? <p>Reading Trash…</p> : !visible.length ? <p className="exec-empty">Nothing archived here.</p> : <div className="exec-trash-list">{visible.map((item) => <div key={`${item.kind}:${item.id}`} className="exec-trash-row">
      <div><strong>{item.title || 'Untitled entry'}</strong><small>{item.kind} · {new Date(item.deletedAt).toLocaleDateString()}</small></div>
      <button disabled={busy} onClick={() => act(item)}>restore</button><button className="exec-danger" disabled={busy} onClick={() => act(item, true)}>delete forever</button>
    </div>)}</div>}
  </dialog>;
}
