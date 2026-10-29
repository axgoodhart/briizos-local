const { StylofactStore } = require('./store');
const { SplitClient } = require('./split');
const { readSampleFile, PICKER_EXTENSIONS } = require('./samples');

const normalizeQuote = (value) => String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

// A quote counts only if it is actually in the message it claims to come from.
async function verifyQuotes(quotes, split, logger) {
  const results = [];
  for (const quote of (Array.isArray(quotes) ? quotes : []).slice(0, 200)) {
    const base = { ...quote, text: String(quote?.text || ''), verified: false, reason: null };
    if (!Number.isInteger(quote?.conversation) || !Number.isInteger(quote?.index) || !base.text.trim()) {
      results.push({ ...base, reason: 'The quote did not name a message.' });
      continue;
    }
    try {
      const context = await split.context({ conversation: quote.conversation, index: quote.index, before: 0, after: 0 });
      const message = context.messages[0];
      const found = message && normalizeQuote(message.text).includes(normalizeQuote(base.text));
      results.push({
        ...base,
        verified: !!found,
        reason: found ? null : 'These words are not in the message it was said to come from.',
        title: context.title,
        date: message?.date || context.conversationDate || null,
        role: message?.role || null,
        messageText: message?.text || null,
      });
    } catch (error) {
      results.push({ ...base, reason: error.message });
    }
  }
  const dropped = results.filter((quote) => !quote.verified).length;
  logger.info('stylofact', `${results.length - dropped} of ${results.length} quotes were confirmed word for word against your history${dropped ? `; ${dropped} did not match and were dropped` : ''}.`, {
    confirmed: results.length - dropped, dropped,
  });
  return results;
}

function registerStylofact({ ipcMain, BrowserWindow, dialog, service, logger }) {
  const store = new StylofactStore(service, logger);
  const split = new SplitClient({ service, logger });

  const pickFiles = async () => {
    const result = await dialog.showOpenDialog({
      title: 'Add writing samples',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Writing', extensions: PICKER_EXTENSIONS }],
    });
    if (result.canceled) return { files: [], failures: [], canceled: true };
    const files = [];
    const failures = [];
    for (const filePath of result.filePaths) {
      try { files.push(await readSampleFile(filePath)); }
      catch (error) { failures.push({ filePath, reason: error.message }); logger.warn('stylofact.samples', 'A chosen file could not be read as writing.', { filePath, reason: error.message }); }
    }
    logger.info('stylofact.samples', `${files.length} file${files.length === 1 ? '' : 's'} read as writing samples${failures.length ? `; ${failures.length} could not be read` : ''}.`, { files: files.map((file) => ({ path: file.filePath, kind: file.kind, words: (file.text.match(/[\p{L}\p{N}]+/gu) || []).length })) });
    return { files, failures, canceled: false };
  };

  const chooseSplitFolder = async () => {
    const result = await dialog.showOpenDialog({ title: 'Choose the Split folder', buttonLabel: 'Use this folder', properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return split.settings();
    return split.saveSettings({ folder: result.filePaths[0] });
  };

  const handlers = {
    'stylofact-snapshot': async () => ({ ...store.snapshot(), split: await split.status({ quiet: true }) }),
    'stylofact-guide-save': (_event, guideId, expectedRevision, patch) => store.saveGuide(guideId, expectedRevision, patch),
    'stylofact-samples-add': (_event, guideId, input) => store.addSample(guideId, input),
    'stylofact-samples-update': (_event, sampleId, patch) => store.updateSample(sampleId, patch),
    'stylofact-samples-remove': (_event, sampleId) => store.removeSample(sampleId),
    'stylofact-samples-read': (_event, filePath) => readSampleFile(filePath),
    'stylofact-samples-pick': () => pickFiles(),
    'stylofact-pieces-create': (_event, input) => store.createPiece(input),
    'stylofact-pieces-update': (_event, pieceId, expectedRevision, patch) => store.updatePiece(pieceId, expectedRevision, patch),
    'stylofact-pieces-archive': (_event, pieceId) => store.archivePiece(pieceId),
    'stylofact-runs-record': (_event, input) => store.recordRun(input),
    'stylofact-quotes-verify': (_event, quotes) => verifyQuotes(quotes, split, logger),
    'stylofact-split-status': () => split.status(),
    'stylofact-split-context': (_event, input) => split.context(input || {}),
    'stylofact-split-start': () => split.ensureRunning(),
    'stylofact-split-stop': () => ({ stopped: split.stop() }),
    'stylofact-split-settings': (_event, patch) => split.saveSettings(patch || {}),
    'stylofact-split-choose-folder': () => chooseSplitFolder(),
  };

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, async (...args) => {
      try {
        return { ok: true, value: await handler(...args) };
      } catch (error) {
        logger.warn('stylofact', `A Stylofact action could not complete: ${channel.replace('stylofact-', '').replace(/-/g, ' ')}.`, { code: error?.code || 'STYLOFACT_ERROR', reason: error?.message });
        return { ok: false, error: { code: error?.code || 'STYLOFACT_ERROR', message: error?.message || 'Stylofact could not complete that action.' } };
      }
    });
  }

  store.on('changed', (change) => {
    for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.webContents.send('stylofact-changed', change);
  });

  return {
    split,
    store,
    close() {
      split.stop();
      for (const channel of Object.keys(handlers)) ipcMain.removeHandler(channel);
    },
  };
}

module.exports = { registerStylofact };
