import logger from '../../lib/logger';
const clients = new Map();
export const textOf = (node) => !node ? '' : node.type === 'text' ? node.text || '' : (node.content || []).map(textOf).join(['paragraph', 'heading'].includes(node.type) ? '' : '\n');
export const docOf = (text = '') => ({ type: 'doc', content: String(text).split('\n').map((line) => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) })) });
export function journalClient(id) {
  if (clients.has(id)) return clients.get(id);
  const listeners = new Set();
  let state = null; let chain = Promise.resolve(); let pending = 0; let refreshing = null;
  const notify = () => listeners.forEach((fn) => fn(state));
  const client = {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); if (state) fn(state); return () => listeners.delete(fn); },
    async refresh() {
      if (refreshing) return refreshing;
      if (!window.api?.execubriiz) throw new Error(window.api ? 'Restart briizOS to load the updated journal connection, then reopen this journal.' : 'Open this journal in the desktop app to use its local database and AI connection.');
      refreshing = window.api.execubriiz.snapshot(id).then((next) => {
        if (!state || next.revision >= state.revision) { state = next; notify(); }
        return state;
      }).finally(() => { refreshing = null; });
      return refreshing;
    },
    command(action, data = {}) {
      pending += 1;
      const result = chain.catch(() => {}).then(async () => {
        if (!state) await client.refresh();
        const payload = typeof data === 'function' ? data(state) : data;
        const next = await window.api.execubriiz.command(id, { ...payload, action, requestId: crypto.randomUUID() });
        if (next.revision >= state.revision) { state = next; notify(); }
        logger.info('journal.execubriiz', `Journal ${action}`, { journalId: id });
        return state;
      }).finally(() => { pending -= 1; });
      chain = result;
      return result;
    },
  };
  window.api?.execubriiz?.subscribe((event) => {
    if (event.journalId !== id || !listeners.size) return;
    chain.catch(() => {}).then(() => client.refresh()).catch((error) => logger.warn('journal.execubriiz', 'Journal refresh failed', { reason: error.message }));
  });
  clients.set(id, client);
  return client;
}
