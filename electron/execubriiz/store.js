const { EventEmitter } = require('events');
const { randomUUID, createHash } = require('crypto');
const { emptyBoard, plain, paragraphs, applyOperation, locate, clone } = require('./document');
const PRIVACY = new Set(['open', 'invisible', 'private']);
const STRUCTURAL = new Set(['move', 'convert', 'retire']);
const newDraft = (privacy = 'open') => ({ id: randomUUID(), revision: 0, doc: { type: 'doc', content: paragraphs() }, privacy, editingId: null });
const hash = (data) => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const entryRow = (r) => ({ id: r.id, sessionId: r.session_id, journalId: r.journal_id, doc: JSON.parse(r.doc_json), text: r.plain_text, label: r.label, privacy: r.privacy, summary: r.summary, summaryRevision: r.summary_revision, revision: r.revision, createdAt: r.created_at, deletedAt: r.deleted_at });

class ExecStore extends EventEmitter {
  constructor(service, logger) { super(); this.service = service; this.db = service.db; this.logger = logger; }
  journal(id) {
    const row = this.db.prepare('SELECT * FROM journals WHERE id = ? AND deleted_at IS NULL').get(id);
    if (!row || row.mode !== 'execubriiz') throw new Error('This Execubriiz journal is unavailable');
    return row;
  }
  ensure(id) {
    this.journal(id);
    if (this.db.prepare('SELECT 1 FROM exec_workspaces WHERE journal_id = ?').get(id)) return;
    this.db.transaction(() => {
      const sessionId = randomUUID();
      this.db.prepare('INSERT INTO exec_sessions (id, journal_id, created_at) VALUES (?, ?, ?)').run(sessionId, id, Date.now());
      const state = { sessionId, draft: newDraft(), parkedDraft: null, board: emptyBoard(), generation: 1, contextRevision: 1,
        prefs: { intensity: 'full', paused: false, model: '', deepModel: '' }, focusId: null, proposals: [], dismissed: [], reactions: [], receipts: [], response: null, usage: { calls: 0, input: 0, output: 0 } };
      this.db.prepare('INSERT INTO exec_workspaces VALUES (?, ?, 1, ?)').run(id, JSON.stringify(state), Date.now());
      // Imports remain real entries, not invisible folios behind this journal mode.
      const folios = this.db.prepare('SELECT * FROM folios WHERE journal_id = ? AND deleted_at IS NULL ORDER BY position').all(id);
      for (const f of folios) {
        const data = JSON.parse(f.content_json);
        const doc = data.doc || { type: 'doc', content: paragraphs(data.body || data.items?.map((item) => item.text).join('\n') || f.title) };
        this.db.prepare('INSERT INTO exec_entries (id,journal_id,session_id,doc_json,plain_text,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(), id, sessionId, JSON.stringify(doc), plain(doc), f.created_at, Date.now());
      }
    })();
    this.logger.info('journal.execubriiz', 'Execubriiz session created in local storage', { journalId: id });
  }
  read(id) {
    this.ensure(id);
    const row = this.db.prepare('SELECT * FROM exec_workspaces WHERE journal_id = ?').get(id);
    return { ...JSON.parse(row.state_json), revision: row.revision };
  }
  entries(id, trash = false) {
    return this.db.prepare(`SELECT * FROM exec_entries WHERE journal_id = ? AND deleted_at IS ${trash ? 'NOT ' : ''}NULL ORDER BY created_at, id`).all(id).map(entryRow);
  }
  snapshot(id) {
    const state = this.read(id);
    return { ...state, entries: this.entries(id), sessions: this.db.prepare('SELECT id,created_at AS createdAt FROM exec_sessions WHERE journal_id = ? ORDER BY created_at').all(id),
      jobs: this.db.prepare("SELECT id,kind,status,error FROM exec_jobs WHERE journal_id = ? AND status IN ('queued','running','failed') ORDER BY created_at DESC LIMIT 12").all(id),
      canUndo: !!this.db.prepare('SELECT 1 FROM exec_board_history WHERE journal_id = ? LIMIT 1').get(id) };
  }
  save(id, state) {
    state.proposals = state.proposals.filter((proposal) => {
      try {
        return proposal.generation === state.generation && proposal.contextRevision === state.contextRevision
          && locate(state.board, proposal.operation.targetId).node.attrs.revision === proposal.operation.expectedRevision;
      } catch { return false; }
    });
    const { revision, ...value } = state;
    this.db.prepare('UPDATE exec_workspaces SET state_json = ?, revision = revision + 1, updated_at = ? WHERE journal_id = ?').run(JSON.stringify(value), Date.now(), id);
  }
  announce(id, action) {
    this.logger.info('journal.execubriiz', action, { journalId: id });
    this.emit('changed', id);
  }
  history(id, board, label) {
    this.db.prepare('INSERT INTO exec_board_history VALUES (?,?,?,?,?)').run(randomUUID(), id, JSON.stringify(board), label, Date.now());
  }
  enqueue(id, kind, payload = {}) {
    if (kind !== 'summary') this.db.prepare("UPDATE exec_jobs SET status='superseded',updated_at=? WHERE journal_id=? AND kind=? AND status='failed'").run(Date.now(), id, kind);
    if (['live', 'curate', 'research'].includes(kind)) this.db.prepare("UPDATE exec_jobs SET status = 'cancelled', updated_at = ? WHERE journal_id = ? AND kind = ? AND status = 'queued'").run(Date.now(), id, kind);
    const jobId = randomUUID();
    this.db.prepare('INSERT INTO exec_jobs (id,journal_id,kind,payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(jobId, id, kind, JSON.stringify(payload), Date.now(), Date.now());
    return jobId;
  }
  invalidate(id, state) {
    state.contextRevision += 1;
    state.proposals = [];
    state.response = null;
    this.db.prepare("UPDATE exec_jobs SET status = 'cancelled', updated_at = ? WHERE journal_id = ? AND status IN ('running','queued') AND kind != 'summary'").run(Date.now(), id);
    this.db.prepare("UPDATE exec_sessions SET summary = '', summary_revision = 0 WHERE journal_id = ?").run(id);
  }
  allowedSources(id, refs = []) {
    return refs.filter((ref) => this.db.prepare("SELECT 1 FROM exec_entries WHERE id = ? AND journal_id = ? AND privacy = 'open' AND deleted_at IS NULL").get(ref, id));
  }
  boardOp(id, state, op, actor, protectedIds = []) {
    if (op.generation != null && op.generation !== state.generation) throw new Error('The board was cleared or restored; this older change was not applied');
    const next = applyOperation(state.board, op, { actor, protectedIds });
    this.history(id, state.board, `${actor}: ${op.kind}`);
    state.board = next;
    state.reactions = state.reactions.filter((r) => { try { locate(next, r.targetId); return true; } catch { return false; } });
  }
  applyProposal(id, state, proposal, protectedIds = []) {
    if (proposal.contextRevision !== state.contextRevision || proposal.generation !== state.generation) throw new Error('This suggestion is out of date');
    this.boardOp(id, state, proposal.operation, 'ai', protectedIds);
    state.proposals = state.proposals.filter((p) => p.id !== proposal.id);
  }
  command(id, input, protectedIds = []) {
    this.ensure(id);
    if (!input || typeof input.action !== 'string') throw new Error('A journal action is required');
    let invalidated = false;
    this.db.transaction(() => {
      const s = this.read(id);
      if (input.requestId && s.receipts.includes(input.requestId)) return;
      const cancel = () => { this.invalidate(id, s); invalidated = true; };
      switch (input.action) {
        case 'draft': {
          if (input.draftId !== s.draft.id || input.expectedRevision !== s.draft.revision) throw new Error('The draft changed in another journal window. Your text is still in this editor; reopen to reconcile it.');
          if (!PRIVACY.has(input.privacy)) throw new Error('Unknown entry privacy');
          if (!input.doc || input.doc.type !== 'doc' || JSON.stringify(input.doc).length > 5000000) throw new Error('Invalid or oversized entry');
          if (input.privacy !== s.draft.privacy || !plain(input.doc).startsWith(plain(s.draft.doc))) cancel();
          s.draft = { ...s.draft, doc: input.doc, privacy: input.privacy, revision: s.draft.revision + 1 };
          break;
        }
        case 'finish': {
          if (input.draftId !== s.draft.id || input.expectedRevision !== s.draft.revision) throw new Error('Wait for your latest words to save before finishing');
          if (!plain(s.draft.doc).trim()) throw new Error('Write something before finishing this entry');
          const entryId = s.draft.editingId || s.draft.id;
          const current = this.db.prepare('SELECT * FROM exec_entries WHERE id = ? AND journal_id = ? AND deleted_at IS NULL').get(entryId, id);
          if (s.draft.editingId && !current) throw new Error('This entry was archived while you were editing');
          if (current && s.draft.entryRevision !== current.revision) throw new Error('This entry changed in another window. Your edited draft is preserved.');
          this.db.prepare(`INSERT INTO exec_entries (id,journal_id,session_id,doc_json,plain_text,privacy,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET doc_json=excluded.doc_json,plain_text=excluded.plain_text,privacy=excluded.privacy,summary='',summary_revision=0,revision=exec_entries.revision+1,updated_at=excluded.updated_at`)
            .run(entryId, id, current?.session_id || s.sessionId, JSON.stringify(s.draft.doc), plain(s.draft.doc), s.draft.privacy, Date.now(), Date.now());
          const privacy = s.draft.privacy;
          if (current) cancel();
          s.draft = s.parkedDraft || newDraft(privacy); s.parkedDraft = null;
          if (!s.prefs.paused && privacy !== 'private') this.enqueue(id, 'summary', { entryId });
          for (const proposal of [...s.proposals]) {
            try { this.applyProposal(id, s, proposal, protectedIds); } catch { s.proposals = s.proposals.filter((p) => p.id !== proposal.id); }
          }
          break;
        }
        case 'editEntry': {
          const entry = this.entries(id).find((e) => e.id === input.entryId);
          if (!entry) throw new Error('Entry is unavailable');
          if (s.draft.editingId) throw new Error('Finish the entry already open in the editor first');
          cancel(); s.parkedDraft = s.draft;
          s.draft = { ...newDraft(entry.privacy), doc: entry.doc, editingId: entry.id, entryRevision: entry.revision };
          break;
        }
        case 'cancelEdit':
          if (s.parkedDraft) {
            // Keep unfinished edits as a separate recoverable entry in Trash.
            this.db.prepare('INSERT INTO exec_entries (id,journal_id,session_id,doc_json,plain_text,privacy,created_at,updated_at,deleted_at) VALUES (?,?,?,?,?,?,?,?,?)').run(s.draft.id, id, s.sessionId, JSON.stringify(s.draft.doc), plain(s.draft.doc), s.draft.privacy, Date.now(), Date.now(), Date.now());
            cancel(); s.draft = s.parkedDraft; s.parkedDraft = null;
          }
          break;
        case 'newSession':
          if (plain(s.draft.doc).trim()) throw new Error('Finish the current entry before starting a new session');
          cancel(); s.sessionId = randomUUID(); s.focusId = null;
          this.db.prepare('INSERT INTO exec_sessions (id,journal_id,created_at) VALUES (?,?,?)').run(s.sessionId, id, Date.now());
          break;
        case 'entry': {
          const entry = this.entries(id).find((e) => e.id === input.entryId);
          if (!entry) throw new Error('Entry is unavailable');
          const privacy = input.privacy ?? entry.privacy;
          if (!PRIVACY.has(privacy)) throw new Error('Unknown entry privacy');
          this.db.prepare('UPDATE exec_entries SET label=?, privacy=?, revision=revision+1, summary=?, summary_revision=?, updated_at=? WHERE id=?')
            .run(String(input.label ?? entry.label).slice(0, 200), privacy, privacy === entry.privacy ? entry.summary : '', privacy === entry.privacy && entry.summaryRevision === entry.revision ? entry.revision + 1 : 0, Date.now(), entry.id);
          if (s.draft.editingId === entry.id) s.draft = { ...s.draft, entryRevision: entry.revision + 1 };
          if (privacy !== entry.privacy) {
            cancel(); s.reactions = s.reactions.map((r) => ({ ...r, sources: r.sources.filter((source) => source !== entry.id) }));
            if (s.draft.editingId === entry.id) s.draft = { ...s.draft, privacy, entryRevision: entry.revision + 1, revision: s.draft.revision + 1 };
          }
          break;
        }
        case 'archiveEntry':
          this.db.prepare('UPDATE exec_entries SET deleted_at=?,revision=revision+1 WHERE id=? AND journal_id=?').run(Date.now(), input.entryId, id);
          cancel(); if (s.focusId === input.entryId) s.focusId = null;
          s.reactions = s.reactions.map((r) => ({ ...r, sources: r.sources.filter((source) => source !== input.entryId) }));
          break;
        case 'restoreEntry':
          this.db.prepare('UPDATE exec_entries SET deleted_at=NULL,revision=revision+1 WHERE id=? AND journal_id=?').run(input.entryId, id);
          cancel(); break;
        case 'purgeEntry':
          if (input.confirmed !== true) throw new Error('Permanent deletion must be confirmed in Trash');
          this.db.prepare('DELETE FROM exec_entries WHERE id=? AND journal_id=? AND deleted_at IS NOT NULL').run(input.entryId, id);
          cancel(); break;
        case 'focus':
          if (input.entryId && !this.entries(id).some((e) => e.id === input.entryId && e.privacy !== 'private')) throw new Error('Private entries cannot be sent to AI');
          cancel(); s.focusId = input.entryId || null;
          if (!s.prefs.paused) this.enqueue(id, 'curate');
          break;
        case 'prefs':
          for (const [key, value] of Object.entries(input.prefs || {})) {
            if (!['intensity','paused','model','deepModel'].includes(key)) continue;
            if (key === 'intensity' && !['inbox','live','full'].includes(value)) throw new Error('Unknown support intensity');
            s.prefs[key] = key === 'paused' ? !!value : String(value).slice(0, 200);
          }
          cancel(); break;
        case 'board':
          this.boardOp(id, s, input.operation, 'user'); break;
        case 'clear':
          this.history(id, s.board, 'Clear board'); cancel(); s.board = emptyBoard(); s.reactions = []; s.generation += 1; break;
        case 'undo': {
          const history = this.db.prepare('SELECT * FROM exec_board_history WHERE journal_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(id);
          if (history) { cancel(); s.board = JSON.parse(history.board_json); s.generation += 1; this.db.prepare('DELETE FROM exec_board_history WHERE id=?').run(history.id); }
          break;
        }
        case 'proposal': {
          const p = s.proposals.find((p) => p.id === input.proposalId);
          if (!p) break;
          if (input.dismiss) { s.dismissed = [...s.dismissed.slice(-199), p.fingerprint]; s.proposals = s.proposals.filter((x) => x.id !== p.id); }
          else this.applyProposal(id, s, p, protectedIds);
          break;
        }
        case 'ask':
          if (s.draft.privacy === 'private' && !input.entryId) throw new Error('Switch this draft out of Private before asking about it');
          if (input.entryId && !this.entries(id).some((e) => e.id === input.entryId && e.privacy !== 'private')) throw new Error('Private entries cannot be sent to AI');
          s.response = null; this.enqueue(id, 'prompt', { intent: input.intent || 'ask', question: String(input.question || '').slice(0, 4000), entryId: input.entryId || null }); break;
        case 'dismissResponse': s.response = null; break;
        case 'analyze': if (!s.prefs.paused) this.enqueue(id, 'curate'); break;
        case 'retry':
          this.db.prepare("UPDATE exec_jobs SET status='queued',attempts=0,error=NULL,updated_at=? WHERE id=? AND journal_id=? AND status='failed'").run(Date.now(), input.jobId, id); break;
        default: throw new Error('Unknown Execubriiz action');
      }
      s.receipts = [...s.receipts.slice(-199), input.requestId || randomUUID()];
      this.save(id, s);
    })();
    if (invalidated) this.emit('invalidated', id);
    this.announce(id, `Journal ${input.action} saved`);
    return this.snapshot(id);
  }
  commitAI(job, context, output, protectedIds) {
    let rejected = 0;
    this.db.transaction(() => {
      const s = this.read(job.journal_id);
      const status = this.db.prepare('SELECT status FROM exec_jobs WHERE id=?').get(job.id)?.status;
      if (status !== 'running' || (job.kind !== 'summary' && (s.contextRevision !== context.contextRevision || s.generation !== context.generation))) throw new Error('This request was superseded by newer journal changes');
      if (job.kind === 'summary') {
        const entry = this.entries(job.journal_id).find((e) => e.id === context.entryId);
        if (!entry || entry.privacy === 'private' || entry.revision !== context.entryRevision) throw new Error('Entry summary is out of date');
        this.db.prepare('UPDATE exec_entries SET summary=?,summary_revision=? WHERE id=?').run(String(output.summary || '').slice(0, 400), entry.revision, entry.id);
        this.enqueue(job.journal_id, 'curate');
      } else if (job.kind === 'prompt') {
        s.response = { id: job.id, intent: context.intent, draftId: context.draftId, text: output.answer || output.summary || '', createdAt: Date.now() };
      } else if (job.kind === 'context') {
        this.db.prepare('UPDATE exec_sessions SET summary=?,summary_revision=? WHERE id=?').run(String(output.summary || '').slice(0, 6000), s.contextRevision, context.sessionId);
      } else {
        const staleTargets = new Set();
        for (const raw of output.operations || []) {
          if (!raw.targetId) continue;
          try { if (locate(context.board, raw.targetId).node.attrs.revision !== locate(s.board, raw.targetId).node.attrs.revision) staleTargets.add(raw.targetId); }
          catch { staleTargets.add(raw.targetId); }
        }
        for (const raw of (output.operations || []).slice(0, 12)) {
          try {
            if (raw.kind === 'pin') throw new Error('AI cannot set fixed sections');
            if (staleTargets.has(raw.targetId)) throw new Error('This idea changed while AI was working');
            const original = raw.targetId ? locate(s.board, raw.targetId).node : null;
            const operation = { ...raw, expectedRevision: original?.attrs.revision, generation: s.generation };
            if (STRUCTURAL.has(operation.kind)) {
              applyOperation(s.board, operation, { actor: 'ai', protectedIds });
              const fingerprint = hash({ operation, contextRevision: s.contextRevision });
              if (!s.dismissed.includes(fingerprint) && !s.proposals.some((p) => p.fingerprint === fingerprint || p.operation.targetId === operation.targetId)) s.proposals.push({ id: randomUUID(), operation, fingerprint, contextRevision: s.contextRevision, generation: s.generation, label: raw.label || (raw.kind === 'convert' ? `${raw.sectionKind}?` : `${raw.kind}?`), explanation: raw.reason || 'Organize the current ideas.', createdAt: Date.now() });
            } else this.boardOp(job.journal_id, s, operation, 'ai', protectedIds);
          } catch (error) { rejected += 1; this.logger.info('journal.execubriiz', 'An older or conflicting AI change was not applied', { jobId: job.id, reason: error.message }); }
        }
        for (const r of (output.reactions || []).slice(0, 8)) {
          try { locate(s.board, r.targetId); } catch { continue; }
          const url = /^https?:\/\//i.test(r.url || '') && context.verifiedUrls?.includes(r.url) ? r.url : null;
          const sources = this.allowedSources(job.journal_id, r.sources || []);
          if (r.url && !url) continue;
          if (!r.text?.trim()) continue;
          if (!s.reactions.some((old) => old.targetId === r.targetId && old.text === r.text)) s.reactions.push({ id: randomUUID(), targetId: r.targetId, text: r.text.slice(0, 500), url, sources, createdAt: Date.now() });
        }
        if (job.kind === 'curate' && s.prefs.intensity === 'full' && output.researchQuestion && !context.hasInvisible) this.enqueue(job.journal_id, 'research', { question: output.researchQuestion });
      }
      s.usage.calls += output.usage?.calls || 1; s.usage.input += output.usage?.input || 0; s.usage.output += output.usage?.output || 0;
      this.save(job.journal_id, s);
      this.db.prepare("UPDATE exec_jobs SET status='completed',updated_at=? WHERE id=?").run(Date.now(), job.id);
    })();
    this.announce(job.journal_id, 'AI journal work saved');
    return { rejected };
  }
  trash(journalId = null) {
    const journals = this.db.prepare('SELECT id,title,deleted_at AS deletedAt FROM journals WHERE deleted_at IS NOT NULL').all();
    const folios = this.db.prepare('SELECT f.id,f.title,f.journal_id AS journalId,f.deleted_at AS deletedAt FROM folios f JOIN journals j ON j.id=f.journal_id WHERE f.deleted_at IS NOT NULL AND j.deleted_at IS NULL').all();
    const entries = this.db.prepare('SELECT e.* FROM exec_entries e JOIN journals j ON j.id=e.journal_id WHERE e.deleted_at IS NOT NULL AND j.deleted_at IS NULL').all().map(entryRow);
    this.logger.info('journal.execubriiz', 'Journal Trash read', { journalId });
    return [...journals.map((r) => ({ ...r, kind: 'journal', journalId: r.id })), ...folios.map((r) => ({ ...r, kind: 'folio' })), ...entries.map((r) => ({ ...r, kind: 'entry', title: r.label || r.text.slice(0, 100) }))].filter((r) => !journalId || r.journalId === journalId);
  }
  trashAction(input) {
    const table = { journal: 'journals', folio: 'folios', entry: 'exec_entries' }[input.kind];
    if (!table) throw new Error('Unknown Trash item');
    if (input.purge && !input.confirmed) throw new Error('Confirm permanent deletion in Trash');
    const current = this.db.prepare(`SELECT * FROM ${table} WHERE id=? AND deleted_at IS NOT NULL`).get(input.id);
    if (!current) throw new Error('This item is no longer in Trash');
    this.db.transaction(() => {
      if (input.purge) this.db.prepare(`DELETE FROM ${table} WHERE id=? AND deleted_at IS NOT NULL`).run(input.id);
      else {
        this.db.prepare(`UPDATE ${table} SET deleted_at=NULL,revision=revision+1 WHERE id=?`).run(input.id);
        if (input.kind === 'journal') this.db.prepare('UPDATE folios SET deleted_at=NULL,archive_batch=NULL,revision=revision+1 WHERE journal_id=? AND (archive_batch=? OR (archive_batch IS NULL AND deleted_at=?))').run(input.id, input.id, current.deleted_at);
      }
    })();
    this.logger.info('journal.execubriiz', input.purge ? 'Trash item permanently deleted after confirmation' : 'Trash item restored', { id: input.id, kind: input.kind });
    const journalId = input.kind === 'journal' ? input.id : current.journal_id;
    this.emit('changed', journalId);
    return { ok: true };
  }
}
module.exports = { ExecStore, newDraft };
