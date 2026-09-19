const { ExecStore } = require('./store');
const { ExecRuntime } = require('./runtime');
function registerExecubriiz({ ipcMain, BrowserWindow, service, logger }) {
  const store = new ExecStore(service, logger);
  const runtime = new ExecRuntime(store, logger);
  const handlers = {
    'execubriiz-snapshot': (_event, id) => { const value = store.snapshot(id); logger.info('journal.execubriiz', 'Journal workspace read from local storage', { journalId: id }); return value; },
    'execubriiz-command': (_event, id, input) => { const result = store.command(id, input, runtime.protectedIds(id)); runtime.changed(id, input.action); return result; },
    'execubriiz-protect': (event, id, ids, surfaceId) => { runtime.setProtection(id, `${event.sender.id}:${String(surfaceId || '').slice(0, 100)}`, ids); return { ok: true }; },
    'execubriiz-trash': (_event, id) => store.trash(id),
    'execubriiz-trash-action': (_event, input) => store.trashAction(input),
  };
  for (const [channel, handler] of Object.entries(handlers)) ipcMain.handle(channel, async (...args) => {
    try { return handler(...args); }
    catch (error) { logger.error('journal.execubriiz', 'Journal action could not complete', { action: channel, reason: error.message }); throw error; }
  });
  store.on('changed', (journalId) => {
    for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.webContents.send('execubriiz-changed', { journalId });
  });
  const archive = (id) => { runtime.cancel(id); store.db.prepare("UPDATE exec_jobs SET status='cancelled' WHERE journal_id=? AND status IN ('queued','running')").run(id); };
  return { archive, close() { runtime.close(); for (const channel of Object.keys(handlers)) ipcMain.removeHandler(channel); } };
}
module.exports = { registerExecubriiz };
