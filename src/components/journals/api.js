/* ── Journals API (IPC → local SQLite via window.api, the single bridge) ──
   Ported from Projungle. Falls back to in-memory stores when window.api
   isn't available (e.g. plain browser preview) so the views stay workable. */

const memJournals = [];
const memFolios = {}; // journalId → [folio]

/* Window event announcing journal data changed outside the listener's own
   surface (float ↔ shelf sync). detail: { journalId, deleted? }. */
export const JOURNALS_CHANGED_EVENT = 'briizos-journals-changed';

export const api = {
  list: () =>
    window.api?.journalsList
      ? window.api.journalsList()
      : Promise.resolve([...memJournals]),

  create: (input) => {
    if (window.api?.journalsCreate) return window.api.journalsCreate(input);
    const folios = (input.folios || []).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      journalId: String(Date.now()),
      type: f.type || 'notes',
      title: f.title || '',
      content: f.content ?? {},
      position: i,
    }));
    const j = { id: String(Date.now()), folioCount: folios.length, ...input };
    delete j.folios;
    memJournals.push(j);
    memFolios[j.id] = folios.map((f) => ({ ...f, journalId: j.id }));
    return Promise.resolve(j);
  },

  update: (journalId, patch) => {
    if (window.api?.journalsUpdate) return window.api.journalsUpdate(journalId, patch);
    const j = memJournals.find((x) => x.id === journalId);
    if (!j) return Promise.reject(new Error('Journal not found'));
    Object.assign(j, patch);
    return Promise.resolve({ ...j });
  },

  delete: (journalId) => {
    if (window.api?.journalsDelete) return window.api.journalsDelete(journalId);
    const index = memJournals.findIndex((journal) => journal.id === journalId);
    if (index >= 0) memJournals.splice(index, 1);
    delete memFolios[journalId];
    return Promise.resolve({ ok: true });
  },

  foliosList: (journalId) =>
    window.api?.foliosList
      ? window.api.foliosList(journalId)
      : Promise.resolve([...(memFolios[journalId] || [])]),

  // opts.afterId inserts the new folio directly after an existing one
  // (page-group rollover); default appends at the end.
  foliosCreate: (journalId, folio, opts) => {
    if (window.api?.foliosCreate) return window.api.foliosCreate(journalId, folio, opts);
    const list = (memFolios[journalId] = memFolios[journalId] || []);
    const f = {
      id: `${Date.now()}-${list.length}`,
      journalId,
      type: folio.type || 'notes',
      title: folio.title || '',
      content: folio.content ?? {},
      position: list.length,
    };
    const at = opts?.afterId ? list.findIndex((x) => x.id === opts.afterId) : -1;
    if (at >= 0) list.splice(at + 1, 0, f);
    else list.push(f);
    list.forEach((x, i) => { x.position = i; });
    const j = memJournals.find((x) => x.id === journalId);
    if (j) j.folioCount = list.length;
    return Promise.resolve({ ...f });
  },

  foliosDelete: (id) => {
    if (window.api?.foliosDelete) return window.api.foliosDelete(id);
    for (const [jid, list] of Object.entries(memFolios)) {
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) {
        list.splice(i, 1);
        const j = memJournals.find((x) => x.id === jid);
        if (j) j.folioCount = list.length;
        break;
      }
    }
    return Promise.resolve({ ok: true });
  },

  foliosUpdate: (id, patch) => {
    if (window.api?.foliosUpdate) return window.api.foliosUpdate(id, patch);
    for (const list of Object.values(memFolios)) {
      const f = list.find((x) => x.id === id);
      if (f) {
        Object.assign(f, patch);
        return Promise.resolve({ ...f });
      }
    }
    return Promise.reject(new Error('Folio not found'));
  },
};
