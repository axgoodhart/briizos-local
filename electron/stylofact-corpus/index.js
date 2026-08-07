const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { app, utilityProcess } = require('electron');
const { detectArchive, sha256 } = require('./parser');

const DIRECT_CONTEXT_LIMIT = 80000;
const MAX_SEARCH_CALLS = 3;
const MAX_SEARCH_QUERIES = 8;
const MAX_PACKED_PASSAGES = 20;
const MAX_PACKED_CHARACTERS = 80000;
const LOG_PROGRESS_STEP = 10;

function formatByteCount(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class StylofactCorpusService extends EventEmitter {
  constructor({ service, userDataPath, logger, disableEmbeddings = false } = {}) {
    super();
    if (!service) throw new Error('StylofactCorpusService requires LocalDataService');
    if (!userDataPath) throw new Error('StylofactCorpusService requires userDataPath');
    this.service = service;
    this.userDataPath = userDataPath;
    this.logger = logger;
    this.disableEmbeddings = disableEmbeddings;
    this.worker = null;
    this.pending = new Map();
    this.watchers = new Map();
    this.refreshing = new Map();
    this.progressWrittenAt = new Map();
    this.loggedProgress = new Map();
    this.modelLoadStartedAt = null;
    this.semanticFallbackStarted = false;
    this.workerRecovery = null;
    this.closed = false;
  }

  _log(level, message, data = {}, opts = {}) {
    const write = this.logger?.[level];
    if (typeof write !== 'function') return;
    try {
      write('stylofact.corpus', message, {
        area: 'Stylofact / Chat History Corpus',
        ...data,
      }, {
        source: 'system',
        ...opts,
      });
    } catch {
      // Logging must never interrupt corpus indexing or retrieval.
    }
  }

  _corpusLogData(corpusId, data = {}) {
    let corpus = null;
    try { corpus = corpusId ? this.service.getStylofactCorpus(corpusId) : null; } catch { /* Logging must not mask the original operation. */ }
    return {
      corpusId: corpusId || null,
      corpusName: corpus?.name || null,
      archiveFormat: corpus?.sourceKind || null,
      sourceFolder: corpus?.sourceKind === 'project-sources' ? null : corpus?.rootPath || null,
      corpusState: corpus?.state || null,
      indexVersion: corpus?.indexVersion || null,
      embeddingModel: corpus?.embeddingModel || null,
      ...data,
    };
  }

  _logProgressMilestone(key, current, total, message, data = {}, step = LOG_PROGRESS_STEP) {
    const safeCurrent = Math.max(0, Number(current) || 0);
    const safeTotal = Math.max(0, Number(total) || 0);
    const percentage = safeTotal > 0 ? Math.min(100, Math.round((safeCurrent / safeTotal) * 100)) : 0;
    const milestone = safeTotal > 0 && safeCurrent >= safeTotal
      ? 100
      : Math.floor(percentage / step) * step;
    const previous = this.loggedProgress.get(key);
    if (previous !== undefined && milestone <= previous) return;
    this.loggedProgress.set(key, milestone);
    this._log('info', message, {
      ...data,
      progress: `${percentage}%`,
      completed: safeCurrent,
      total: safeTotal,
    }, { phase: 'progress' });
  }

  _resetCorpusProgress(corpusId) {
    for (const key of this.loggedProgress.keys()) {
      if (key.startsWith(`${corpusId}:`)) this.loggedProgress.delete(key);
    }
  }

  async initialize() {
    if (this.worker) return this.status();
    this._log('info', 'Starting the local Stylofact Corpus Navigator.', {
      sidecarDatabase: path.join(this.userDataPath, 'stylofact-corpus.db'),
      modelCache: path.join(this.userDataPath, 'stylofact-models'),
      manualServerRequired: false,
      privacy: 'Archive text stays local; only receipt-selected evidence can enter a Stage 2 prompt.',
    }, { phase: 'start' });
    await app.whenReady();
    this._startWorker({ disableEmbeddings: this.disableEmbeddings });
    const status = await this.status();
    for (const corpus of this.service.listStylofactCorpora()) {
      this._watchCorpus(corpus);
      if (fs.existsSync(corpus.rootPath)) {
        this.refreshCorpus(corpus.id, { reason: 'app-startup' }).catch(() => {});
      } else {
        this.service.updateStylofactCorpusStatus(corpus.id, {
          state: 'stale',
          progressMessage: 'The connected archive folder is unavailable. Cached search remains intact.',
          error: 'Source folder unavailable',
        });
        this._log('warn', 'A connected chat archive is unavailable; its cached index was preserved.', this._corpusLogData(corpus.id, {
          cachedChunks: corpus.chunkCount,
          result: corpus.chunkCount ? 'Cached keyword search remains available.' : 'No searchable cache is available yet.',
          nextStep: 'Reconnect the drive or move the folder back, then use Refresh in the Chat History Corpus card.',
        }), { outcome: 'fallback' });
      }
    }
    this._log('info', 'The local Stylofact corpus navigator started inside briizOS.', {
      sidecarPath: path.join(this.userDataPath, 'stylofact-corpus.db'),
      vectorAvailable: status.vectorAvailable,
      manualServerRequired: false,
      nextStep: 'No action is required unless a corpus card reports a warning.',
    }, { outcome: 'success' });
    return status;
  }

  _startWorker({ disableEmbeddings }) {
    const workerData = {
      databasePath: path.join(this.userDataPath, 'stylofact-corpus.db'),
      modelCachePath: path.join(this.userDataPath, 'stylofact-models'),
      disableEmbeddings: !!disableEmbeddings,
    };
    const worker = utilityProcess.fork(path.join(__dirname, 'worker.js'), [], {
      env: {
        ...process.env,
        STYLOFACT_CORPUS_WORKER_DATA: JSON.stringify(workerData),
      },
      serviceName: disableEmbeddings
        ? 'Stylofact Corpus Navigator (keyword only)'
        : 'Stylofact Corpus Navigator',
      stdio: 'inherit',
      allowLoadingUnsignedLibraries: process.platform === 'darwin',
    });
    this.worker = worker;
    let fatalError = null;
    worker.on('message', (message) => this._onMessage(message));
    worker.on('error', (type, location) => {
      fatalError = new Error(`Stylofact corpus utility process ${type || 'failed'}${location ? ` at ${location}` : ''}`);
    });
    worker.on('exit', (code) => {
      if (this.closed || this.worker !== worker || code === 0) return;
      this._onWorkerFailure(
        fatalError || new Error(`Stylofact corpus utility process stopped with code ${code}`),
        worker,
      );
    });
    return worker;
  }

  _onMessage(message) {
    if (message?.type === 'response') {
      const pending = this.pending.get(message.requestId);
      if (!pending) return;
      this.pending.delete(message.requestId);
      if (message.error) {
        const error = new Error(message.error.message || 'Stylofact corpus worker failed');
        error.stack = message.error.stack || error.stack;
        pending.reject(error);
      } else pending.resolve(message.value);
      return;
    }
    if (message?.type === 'event') this._onWorkerEvent(message.event, message.payload || {});
  }

  _onWorkerFailure(error, failedWorker = this.worker) {
    if (failedWorker && this.worker !== failedWorker) return;
    this.worker = null;
    this._log('error', 'The local Stylofact corpus worker stopped unexpectedly.', {
      error: error?.message || String(error),
      result: this.disableEmbeddings || this.semanticFallbackStarted
        ? 'The interface remains available; the worker could not be recovered automatically.'
        : 'briizOS remains open. Stylofact is restarting safely with keyword search only.',
      nextStep: 'Existing source archives and cached keyword indexes are not deleted by this failure.',
    }, { outcome: 'failed' });
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
    if (this.closed || this.disableEmbeddings || this.semanticFallbackStarted) return;
    this.semanticFallbackStarted = true;
    this.workerRecovery = Promise.resolve()
      .then(() => {
        if (this.closed) return null;
        this._startWorker({ disableEmbeddings: true });
        return this.status();
      })
      .then((status) => {
        if (!status || this.closed) return;
        this.service.listStylofactCorpora({ includeInternal: true }).forEach((corpus) => {
          if (!corpus.chunkCount) return;
          this.service.updateStylofactCorpusStatus(corpus.id, {
            state: 'lexical-ready',
            progressCurrent: corpus.chunkCount,
            progressTotal: corpus.chunkCount,
            progressMessage: 'Keyword search is ready. Semantic search was disabled after its isolated process stopped.',
            error: 'Local semantic search stopped unexpectedly; keyword search remains available.',
          });
        });
        this._log('warn', 'Stylofact recovered from a semantic engine failure without closing briizOS.', {
          fallback: 'The isolated corpus process restarted with exact keyword search only.',
          archiveSafety: 'The source archive and completed keyword index were preserved.',
          nextStep: 'Find material can continue now. Retrieval receipts will identify the mode as lexical-only.',
        }, { outcome: 'fallback' });
      })
      .catch((recoveryError) => {
        this._log('error', 'Stylofact could not restart its keyword-search process.', {
          error: recoveryError?.message || String(recoveryError),
          archiveSafety: 'The source archive and cached index files remain on disk.',
          nextStep: 'Restart briizOS to retry the local corpus navigator.',
        }, { outcome: 'failed' });
      })
      .finally(() => {
        this.workerRecovery = null;
      });
  }

  _onWorkerEvent(event, payload) {
    const corpusId = payload.corpusId;
    try {
      if (event === 'index-progress') {
        this._writeProgress(corpusId, {
          state: 'scanning',
          progressCurrent: payload.current,
          progressTotal: payload.total,
          progressMessage: payload.message,
          error: null,
        });
        this._logProgressMilestone(
          `${corpusId}:lexical-index`,
          payload.current,
          payload.total,
          'Stylofact is checking the connected archive and updating its keyword index.',
          this._corpusLogData(corpusId, {
            currentItem: payload.message || null,
            searchAvailability: 'Previously cached search remains available while this check runs.',
          }),
        );
      } else if (event === 'lexical-ready') {
        this._writeCounts(corpusId, payload, 'lexical-ready', 'Keyword search is ready; semantic preparation continues locally.');
        const counts = payload.counts || {};
        this._log('info', 'Stylofact keyword search is ready for this corpus.', this._corpusLogData(corpusId, {
          conversations: counts.conversations || 0,
          alexMessages: counts.userMessages || 0,
          assistantContextMessages: counts.contextMessages || 0,
          evidencePassages: counts.chunks || 0,
          sourceFingerprint: payload.fingerprint || null,
          evidencePolicy: 'Only Alex-authored user messages are primary evidence.',
          nextStep: 'Stylofact can search now; semantic preparation will continue in the background.',
        }), { phase: 'complete', outcome: 'success' });
      } else if (event === 'embedding-progress') {
        this._writeProgress(corpusId, {
          state: 'semantic-indexing',
          embeddedChunkCount: payload.current,
          progressCurrent: payload.current,
          progressTotal: payload.total,
          progressMessage: payload.message,
          error: null,
        });
        this._logProgressMilestone(
          `${corpusId}:semantic-index`,
          payload.current,
          payload.total,
          'Stylofact is preparing local semantic search passages.',
          this._corpusLogData(corpusId, {
            modelLocation: 'Local briizOS model cache',
            privacy: 'Archive passages are embedded on this Mac and are not uploaded for indexing.',
          }),
        );
      } else if (event === 'semantic-ready') {
        this._writeCounts(corpusId, payload, 'ready', 'Keyword and semantic search are ready.');
        const counts = payload.counts || {};
        this._log('info', 'Stylofact keyword and semantic search are fully ready.', this._corpusLogData(corpusId, {
          evidencePassages: counts.chunks || 0,
          semanticPassages: counts.embeddedChunks || 0,
          retrievalMode: 'Hybrid keyword + semantic search',
          nextStep: 'No action is required; future Stage 2 runs can use the completed local index.',
        }), { phase: 'complete', outcome: 'success' });
      } else if (event === 'paused') {
        this._writeCounts(corpusId, payload, 'paused', 'Semantic indexing is paused. Keyword search remains ready.', true);
        this._log('info', 'Stylofact semantic indexing reached a safe pause point.', this._corpusLogData(corpusId, {
          keywordSearch: 'Ready',
          semanticPassagesPrepared: payload.counts?.embeddedChunks || 0,
          nextStep: 'Use Resume semantic search in the corpus card whenever background preparation should continue.',
        }), { phase: 'paused', outcome: 'success' });
      } else if (event === 'embedding-error') {
        this.service.updateStylofactCorpusStatus(corpusId, {
          state: 'lexical-ready',
          progressMessage: 'Semantic search is unavailable; Stylofact will use exact keyword search.',
          error: payload.error,
        });
        this._log('error', 'Stylofact could not prepare semantic search and switched to keyword-only retrieval.', this._corpusLogData(corpusId, {
          error: payload.error || 'Unknown semantic indexing error',
          fallback: 'Cached keyword search remains available and will be visibly labeled lexical-only in receipts.',
          archiveSafety: 'The source archive and its cached messages were not changed or deleted.',
          nextStep: 'Use Refresh to retry. If the model download was interrupted, confirm internet access and keep briizOS open during the retry.',
        }), { outcome: 'fallback' });
      } else if (event === 'model-load-start') {
        this.modelLoadStartedAt = Date.now();
        this.loggedProgress.delete('semantic-model:download');
        this.loggedProgress.delete('semantic-model:asset-request');
        this.service.listStylofactCorpora({ includeInternal: true })
          .filter((corpus) => corpus.state === 'semantic-indexing')
          .forEach((corpus) => this._writeProgress(corpus.id, {
            state: 'semantic-indexing',
            progressMessage: payload.cachePresent
              ? 'Checking the cached local semantic model and fetching any missing pinned files…'
              : 'Starting the one-time local semantic model download…',
            error: null,
          }, { force: true }));
        this._log('info', payload.cachePresent
          ? 'Stylofact is checking its cached local semantic model.'
          : 'Stylofact started the one-time local semantic model download.', {
          embeddingModel: payload.embeddingModel || null,
          cacheStatus: payload.cachePresent ? 'Local model files found; missing pinned files will be downloaded if necessary.' : 'Empty; model files must be downloaded.',
          cachedFiles: payload.cacheFileCount || 0,
          cachedSize: formatByteCount(payload.cacheBytes),
          networkPurpose: 'Only pinned model assets may be requested from Hugging Face; chat archive text is never sent.',
          modelCache: path.join(this.userDataPath, 'stylofact-models'),
          nextStep: payload.cachePresent ? 'No action is required while the cache is verified.' : 'Keep briizOS open and connected to the internet until model verification succeeds.',
        }, { phase: payload.cachePresent ? 'cache-check' : 'network' });
      } else if (event === 'model-progress') {
        const percent = Number.isFinite(payload.progress) ? ` ${Math.round(payload.progress)}%` : '';
        const modelAction = payload.status === 'done' || payload.status === 'ready'
          ? 'Verified'
          : payload.cachePresent ? 'Checking cached or missing' : 'Downloading';
        this.service.listStylofactCorpora({ includeInternal: true })
          .filter((corpus) => corpus.state === 'semantic-indexing')
          .forEach((corpus) => this._writeProgress(corpus.id, {
            state: 'semantic-indexing',
            progressMessage: `${modelAction} local semantic model files${percent}${payload.file ? ` · ${payload.file}` : ''}`,
            error: null,
          }));
        if (payload.status === 'download' && !this.loggedProgress.has('semantic-model:asset-request')) {
          this.loggedProgress.set('semantic-model:asset-request', 1);
          this._log('info', 'Transformers.js requested the pinned semantic model assets.', {
            model: payload.model || null,
            firstAsset: payload.file || null,
            cacheBehavior: 'Each file is read from the local cache when present and downloaded only when missing.',
            privacy: 'No chat messages are included in this request.',
          }, { phase: 'model-assets' });
        }
        if (payload.status === 'progress_total' && Number.isFinite(payload.progress)) {
          this._logProgressMilestone(
            'semantic-model:download',
            payload.progress,
            100,
            'The local semantic model setup is progressing.',
            {
              embeddingModel: payload.model || null,
              transferred: formatByteCount(payload.loaded),
              expectedSize: formatByteCount(payload.total),
              currentAsset: payload.file || null,
            },
            25,
          );
        }
      } else if (event === 'model-ready') {
        this.service.listStylofactCorpora({ includeInternal: true }).forEach((corpus) => {
          this.service.updateStylofactCorpusStatus(corpus.id, {
            embeddingModelChecksum: payload.checksum,
            progressMessage: payload.changedFromPreviousCache
              ? 'The pinned local model cache changed and its new checksum was recorded.'
              : corpus.progressMessage,
          });
        });
        this._log('info', 'The pinned local semantic model was verified successfully.', {
          embeddingModel: payload.embeddingModel || null,
          checksum: payload.checksum || null,
          cachedFiles: payload.cacheFileCount || 0,
          cachedSize: formatByteCount(payload.cacheBytes),
          cacheChanged: !!payload.changedFromPreviousCache,
          modelFilesAddedOrExpanded: !!payload.cacheGrew,
          networkResult: payload.cacheGrew
            ? 'The local cache gained or expanded pinned model files during setup.'
            : 'The existing local cache was verified without increasing its stored size.',
          durationMs: this.modelLoadStartedAt ? Date.now() - this.modelLoadStartedAt : null,
          offlineResult: 'The verified cache can be used without network access on future runs.',
          nextStep: 'Semantic passage preparation will continue locally; no action is required.',
        }, { phase: 'complete', outcome: 'success' });
      }
    } catch (error) {
      this._log('warn', 'Stylofact could not persist a corpus progress update.', this._corpusLogData(corpusId, {
        workerEvent: event,
        error: error?.message || String(error),
        result: 'Indexing may still be running, but the corpus card and Log Panel may temporarily show stale progress.',
        nextStep: 'Use Refresh after the current operation settles if the displayed state does not recover.',
      }), { outcome: 'degraded' });
    }
    this.emit('progress', { event, payload });
  }

  _writeProgress(corpusId, patch, { force = false } = {}) {
    if (!corpusId) return;
    const now = Date.now();
    const last = this.progressWrittenAt.get(corpusId) || 0;
    const terminal = ['ready', 'lexical-ready', 'paused', 'error', 'stale'].includes(patch.state);
    let stateChanged = false;
    try {
      const current = this.service.getStylofactCorpus(corpusId);
      stateChanged = !!patch.state && current?.state !== patch.state;
    } catch {
      // The status write below will surface a missing corpus with its normal error.
    }
    if (!force && !terminal && !stateChanged && now - last < 1000) return;
    this.progressWrittenAt.set(corpusId, now);
    this.service.updateStylofactCorpusStatus(corpusId, patch);
  }

  _writeCounts(corpusId, payload, state, progressMessage, paused = false) {
    const counts = payload.counts || {};
    this._writeProgress(corpusId, {
      state,
      sourceFingerprint: payload.fingerprint,
      conversationCount: counts.conversations,
      userMessageCount: counts.userMessages,
      contextMessageCount: counts.contextMessages,
      chunkCount: counts.chunks,
      embeddedChunkCount: counts.embeddedChunks,
      progressCurrent: state === 'ready' ? counts.chunks : counts.embeddedChunks || counts.chunks,
      progressTotal: counts.chunks,
      progressMessage,
      lastIndexedAt: Date.now(),
      paused,
      error: payload.vectorAvailable === false ? payload.vectorError : null,
    });
  }

  _call(command, payload = {}) {
    if (!this.worker) {
      return Promise.reject(new Error(this.workerRecovery
        ? 'Stylofact corpus navigator is recovering with keyword search. Try again in a moment.'
        : 'Stylofact corpus navigator is not ready.'));
    }
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage({ requestId, command, payload });
    });
  }

  status() {
    return this._call('status');
  }

  listCorpora() {
    return this.service.listStylofactCorpora();
  }

  getCorpusStatus(corpusId) {
    const corpus = this.service.getStylofactCorpus(corpusId);
    if (!corpus) throw new Error('Stylofact corpus not found.');
    return corpus;
  }

  async connectArchive(projectId, rootPath) {
    const startedAt = Date.now();
    this._log('info', 'Checking the selected folder for a supported chat archive.', {
      projectId,
      selectedFolder: rootPath,
      supportedFormats: ['Split conversation folder', 'ChatGPT export folder'],
    }, { phase: 'start' });
    try {
      const archive = detectArchive(rootPath);
      const created = this.service.createStylofactCorpus({
        name: path.basename(archive.rootPath) || 'Chat history',
        sourceKind: archive.sourceKind,
        rootPath: archive.rootPath,
      });
      this.service.linkStylofactProjectCorpus(projectId, created.row.id);
      this._watchCorpus(created.row);
      this._log('info', created.created
        ? 'The chat archive was connected and saved to this Stylofact project.'
        : 'The existing chat archive connection was linked to this Stylofact project.', this._corpusLogData(created.row.id, {
        projectId,
        databaseWrite: created.created ? 'Created corpus registry record and project link.' : 'Reused corpus registry record and saved project link.',
        evidencePolicy: 'Only Alex-authored user messages can become primary evidence.',
        durationMs: Date.now() - startedAt,
        nextStep: 'Keyword indexing starts automatically; watch this Log Panel or the corpus card for readiness.',
      }), { phase: 'complete', outcome: 'success' });
      this.refreshCorpus(created.row.id, { reason: 'archive-connected' }).catch(() => {});
      return {
        corpus: this.service.getStylofactCorpus(created.row.id),
        linkedCorpora: this.service.listStylofactProjectCorpora(projectId),
      };
    } catch (error) {
      this._log('error', 'The selected folder could not be connected as a chat archive.', {
        projectId,
        selectedFolder: rootPath,
        error: error?.message || String(error),
        databaseResult: 'No new corpus connection was saved.',
        nextStep: 'Choose the folder that directly contains the Split conversations or ChatGPT conversations.json file.',
      }, { outcome: 'failed' });
      throw error;
    }
  }

  linkProjectCorpus(projectId, corpusId) {
    const result = this.service.linkStylofactProjectCorpus(projectId, corpusId);
    this._log('info', 'A chat corpus was linked to a Stylofact project.', this._corpusLogData(corpusId, {
      projectId,
      databaseWrite: 'Saved project-to-corpus link.',
      linkedCorpusCount: result.rows?.length || 0,
    }), { outcome: 'success' });
    return result;
  }

  unlinkProjectCorpus(projectId, corpusId) {
    const corpusData = this._corpusLogData(corpusId, { projectId });
    const result = this.service.unlinkStylofactProjectCorpus(projectId, corpusId);
    this._log('info', 'A chat corpus was disconnected from this Stylofact project.', {
      ...corpusData,
      databaseWrite: 'Removed only the project link.',
      cacheResult: 'The rebuildable local corpus index was retained for other projects and future relinking.',
      linkedCorpusCount: result.rows?.length || 0,
    }, { outcome: 'success' });
    return result;
  }

  refreshCorpus(corpusId, { rebuild = false, reason = 'manual-refresh' } = {}) {
    if (this.refreshing.has(corpusId)) {
      this._log('info', 'Stylofact reused the archive refresh already in progress.', this._corpusLogData(corpusId, {
        requestedReason: reason,
        databaseResult: 'No duplicate indexing job was started.',
      }));
      return this.refreshing.get(corpusId);
    }
    const corpus = this.getCorpusStatus(corpusId);
    if (corpus.sourceKind === 'project-sources') return Promise.resolve(corpus);
    if (!fs.existsSync(corpus.rootPath)) {
      this.service.updateStylofactCorpusStatus(corpusId, {
        state: 'stale',
        progressMessage: 'The connected archive folder is unavailable. Cached search remains intact.',
        error: 'Source folder unavailable',
      });
      this._log('warn', 'Stylofact could not refresh because the connected archive folder is unavailable.', this._corpusLogData(corpusId, {
        requestedReason: reason,
        cachedChunks: corpus.chunkCount,
        fallback: corpus.chunkCount ? 'Cached keyword search remains available.' : 'No cached passages are currently searchable.',
        databaseWrite: 'Marked the connection stale without deleting cached evidence.',
        nextStep: 'Reconnect the drive or restore the folder, then choose Refresh.',
      }), { outcome: 'fallback' });
      return Promise.resolve(this.getCorpusStatus(corpusId));
    }
    this._resetCorpusProgress(corpusId);
    this.service.updateStylofactCorpusStatus(corpusId, {
      state: 'scanning',
      chunkCount: rebuild ? 0 : corpus.chunkCount,
      embeddedChunkCount: rebuild ? 0 : corpus.embeddedChunkCount,
      progressCurrent: 0,
      progressTotal: 0,
      progressMessage: rebuild ? 'Rebuilding the local archive index…' : 'Checking the archive for changes…',
      error: null,
    });
    const startedAt = Date.now();
    this._log('info', rebuild
      ? 'Stylofact started rebuilding the local chat archive index.'
      : 'Stylofact started checking the chat archive for changes.', this._corpusLogData(corpusId, {
      requestedReason: reason,
      operation: rebuild ? 'Full rebuild of the disposable sidecar index' : 'Incremental fingerprint and archive scan',
      sourceSafety: 'The original archive is read-only and will not be modified.',
      cachedSearch: corpus.chunkCount ? 'The prior cached index remains available until replacement data is ready.' : 'No prior cached index is available.',
    }), { phase: 'start' });
    const promise = this._call('indexArchive', { corpusId, rootPath: corpus.rootPath, rebuild })
      .then(() => {
        const updated = this.getCorpusStatus(corpusId);
        this._log('info', rebuild
          ? 'Stylofact finished rebuilding the keyword archive index.'
          : 'Stylofact finished checking and updating the keyword archive index.', this._corpusLogData(corpusId, {
          requestedReason: reason,
          state: updated.state,
          conversations: updated.conversationCount,
          alexMessages: updated.userMessageCount,
          evidencePassages: updated.chunkCount,
          durationMs: Date.now() - startedAt,
          databaseWrite: 'Committed the updated corpus fingerprint, counts, messages, and keyword index to local storage.',
          nextStep: updated.state === 'ready' ? 'No action is required.' : 'Semantic preparation continues locally in the background.',
        }), { phase: 'complete', outcome: 'success' });
        return updated;
      })
      .catch((error) => {
        this._markError(corpusId, error);
        throw error;
      })
      .finally(() => this.refreshing.delete(corpusId));
    this.refreshing.set(corpusId, promise);
    return promise;
  }

  rebuildCorpus(corpusId) {
    return this.refreshCorpus(corpusId, { rebuild: true, reason: 'manual-rebuild' });
  }

  async setIndexingPaused(corpusId, paused) {
    this._log('info', paused ? 'Pausing Stylofact semantic indexing.' : 'Resuming Stylofact semantic indexing.', this._corpusLogData(corpusId, {
      requestedState: paused ? 'paused' : 'semantic-indexing',
      keywordSearch: 'Remains available',
    }), { phase: 'start' });
    await this._call('setPaused', { corpusId, paused: !!paused });
    this.service.updateStylofactCorpusStatus(corpusId, {
      state: paused ? 'paused' : 'semantic-indexing',
      paused: !!paused,
      progressMessage: paused ? 'Semantic indexing is paused. Keyword search remains ready.' : 'Semantic indexing resumed.',
    });
    const updated = this.getCorpusStatus(corpusId);
    this._log('info', paused ? 'Stylofact semantic indexing is paused.' : 'Stylofact semantic indexing resumed.', this._corpusLogData(corpusId, {
      databaseWrite: `Saved semantic indexing state as ${paused ? 'paused' : 'running'}.`,
      keywordSearch: 'Ready',
      nextStep: paused ? 'Use Resume semantic search whenever preparation should continue.' : 'No action is required while background preparation continues.',
    }), { phase: 'complete', outcome: 'success' });
    return updated;
  }

  _watchCorpus(corpus) {
    if (!corpus || corpus.sourceKind === 'project-sources' || this.watchers.has(corpus.id) || !fs.existsSync(corpus.rootPath)) return;
    let timer = null;
    try {
      const watcher = fs.watch(corpus.rootPath, { recursive: process.platform !== 'linux' }, () => {
        if (!timer) {
          this._log('info', 'Stylofact noticed a change in the connected archive.', this._corpusLogData(corpus.id, {
            automaticAction: 'A debounced incremental refresh will start after file activity settles.',
            sourceSafety: 'The archive is watched read-only.',
          }), { phase: 'detected' });
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          this.refreshCorpus(corpus.id, { reason: 'archive-file-change' }).catch(() => {});
        }, 1500);
      });
      this.watchers.set(corpus.id, { watcher, clear: () => clearTimeout(timer) });
      this._log('info', 'Automatic read-only archive watching is active.', this._corpusLogData(corpus.id, {
        automaticAction: 'Changed conversations will be fingerprinted and incrementally reindexed while briizOS is running.',
        manualServerRequired: false,
      }), { outcome: 'success' });
    } catch (error) {
      this._log('warn', 'Stylofact could not watch the archive for live changes.', this._corpusLogData(corpus.id, {
        error: error?.message || String(error),
        fallback: 'The archive is still checked at app startup and when Refresh is selected.',
        nextStep: 'No action is required unless immediate updates matter; use Refresh after adding conversations.',
      }), { outcome: 'fallback' });
    }
  }

  _markError(corpusId, error) {
    let corpus = null;
    try {
      corpus = this.service.getStylofactCorpus(corpusId);
      this.service.updateStylofactCorpusStatus(corpusId, {
        state: corpus?.chunkCount ? 'lexical-ready' : 'error',
        progressMessage: corpus?.chunkCount
          ? 'The latest refresh failed; cached keyword search remains available.'
          : 'The archive could not be indexed.',
        error: error?.message || String(error),
      });
    } catch {
      // The corpus may have been removed while a worker operation was finishing.
    }
    this._log('error', 'Stylofact could not finish the latest corpus operation.', this._corpusLogData(corpusId, {
      error: error?.message || String(error),
      fallback: corpus?.chunkCount ? 'The previous cached keyword index remains available.' : 'No searchable cached index is available yet.',
      databaseWrite: corpus ? 'Saved the failure state without deleting corpus records or cached source text.' : 'The corpus record was no longer available to update.',
      sourceSafety: 'The original archive was not modified.',
      nextStep: 'Review the error above, restore folder or internet access if mentioned, then use Refresh.',
    }), { outcome: corpus?.chunkCount ? 'fallback' : 'failed' });
  }

  async prepareProjectSources(projectId) {
    const sources = this.service.listStylofactSources(projectId, 'thematic');
    const totalCharacters = sources.reduce((sum, source) => sum + source.bodyText.length, 0);
    if (totalCharacters <= DIRECT_CONTEXT_LIMIT && sources.length <= MAX_PACKED_PASSAGES) return null;
    const corpusId = `project-sources-${projectId}`;
    const rootPath = `briizos://stylofact-project/${projectId}`;
    const fingerprint = sha256(JSON.stringify(sources.map((source) => [source.id, source.revision, sha256(source.bodyText)])));
    let corpus = this.service.getStylofactCorpus(corpusId);
    if (!corpus) {
      corpus = this.service.createStylofactCorpus({
        id: corpusId,
        name: 'Project thematic sources',
        sourceKind: 'project-sources',
        rootPath,
      }).row;
      this.service.linkStylofactProjectCorpus(projectId, corpusId);
      this._log('info', 'Stylofact created a local search index for large project thematic material.', this._corpusLogData(corpusId, {
        projectId,
        thematicSources: sources.length,
        thematicCharacters: totalCharacters,
        databaseWrite: 'Created an internal corpus record and linked it to the project.',
        privacy: 'These project sources remain local until selected evidence is sent during Stage 2.',
      }), { outcome: 'success' });
    }
    if (corpus.sourceFingerprint !== fingerprint || !['lexical-ready', 'semantic-indexing', 'ready', 'paused'].includes(corpus.state)) {
      const startedAt = Date.now();
      this._resetCorpusProgress(corpusId);
      this._log('info', 'Stylofact started indexing large project thematic material.', this._corpusLogData(corpusId, {
        projectId,
        thematicSources: sources.length,
        thematicCharacters: totalCharacters,
        sourceFingerprint: fingerprint,
      }), { phase: 'start' });
      try {
        await this._call('indexDocuments', { corpusId, projectId, documents: sources, fingerprint });
        this._log('info', 'Stylofact finished the keyword index for large project thematic material.', this._corpusLogData(corpusId, {
          projectId,
          durationMs: Date.now() - startedAt,
          databaseWrite: 'Saved exact source passages, offsets, hashes, and keyword index records locally.',
          nextStep: 'Semantic preparation continues in the background.',
        }), { phase: 'complete', outcome: 'success' });
      } catch (error) {
        this._markError(corpusId, error);
        throw error;
      }
    }
    return this.getCorpusStatus(corpusId);
  }

  async beginRetrieval(projectId, queryText) {
    const startedAt = Date.now();
    this._log('info', 'Stylofact started preparing a transparent Stage 2 retrieval run.', {
      projectId,
      promptPreview: String(queryText || '').slice(0, 500),
      promptCharacters: String(queryText || '').length,
      databaseRead: 'Reading linked corpus readiness and project thematic source metadata.',
    }, { phase: 'start' });
    try {
      const projectSourceCorpus = await this.prepareProjectSources(projectId);
      const thematicSources = this.service.listStylofactSources(projectId, 'thematic');
      const thematicCharacters = thematicSources.reduce((sum, source) => sum + source.bodyText.length, 0);
      const linked = this.service.listStylofactProjectCorpora(projectId)
        .filter((corpus) => (
          (corpus.sourceKind !== 'project-sources' || corpus.id === projectSourceCorpus?.id)
          && ['scanning', 'lexical-ready', 'semantic-indexing', 'ready', 'paused', 'stale'].includes(corpus.state)
          && corpus.chunkCount > 0
        ));
      if (!linked.length) throw new Error('Connect a chat archive or add thematic material before extracting ideas.');
      const snapshot = linked.map((corpus) => ({
        corpusId: corpus.id,
        name: corpus.name,
        sourceKind: corpus.sourceKind,
        state: corpus.state,
        sourceFingerprint: corpus.sourceFingerprint,
        conversations: corpus.conversationCount,
        userMessages: corpus.userMessageCount,
        assistantContextMessages: corpus.contextMessageCount,
        chunks: corpus.chunkCount,
        embeddedChunks: corpus.embeddedChunkCount,
        evidenceRole: 'user',
        assistantContextTurns: 1,
        indexVersion: corpus.indexVersion,
        embeddingModel: corpus.embeddingModel,
        embeddingModelChecksum: corpus.embeddingModelChecksum,
      }));
      const directContexts = thematicCharacters <= DIRECT_CONTEXT_LIMIT && thematicSources.length <= MAX_PACKED_PASSAGES
        ? thematicSources.map((source) => ({
          locator: { sourceId: source.id, startChar: 0, endChar: source.bodyText.length },
          conversationTitle: source.label || 'Project thematic source',
          messageAt: source.updatedAt || null,
          exactText: source.bodyText,
          context: [{ messageId: `source-message:${source.id}`, role: 'user', text: source.bodyText }],
          verified: true,
          directProjectSource: true,
        }))
        : [];
      if (directContexts.length) snapshot.unshift({
        corpusId: null,
        name: 'Direct project thematic material',
        sourceKind: 'direct-project-sources',
        sourceCount: directContexts.length,
        characters: thematicCharacters,
        evidenceRole: 'user',
      });
      const result = this.service.beginStylofactRetrieval(projectId, queryText, snapshot, directContexts);
      this._log('info', 'Stylofact created the Stage 2 retrieval receipt and corpus snapshot.', {
        projectId,
        retrievalRunId: result.row?.id || null,
        eligibleCorpora: linked.map((corpus) => ({
          corpusId: corpus.id,
          name: corpus.name,
          state: corpus.state,
          passages: corpus.chunkCount,
          retrievalMode: corpus.chunkCount > 0 && corpus.embeddedChunkCount >= corpus.chunkCount
            ? 'hybrid'
            : 'lexical-only until semantic preparation finishes',
        })),
        directThematicPassages: directContexts.length,
        databaseWrite: 'Saved the prompt, eligible corpus snapshot, initial exact context, and running status.',
        durationMs: Date.now() - startedAt,
        nextStep: 'The Stage 2 agent may now ask up to eight visible archive questions.',
      }, { phase: 'complete', outcome: 'success' });
      return result;
    } catch (error) {
      this._log('error', 'Stylofact could not begin the Stage 2 corpus retrieval run.', {
        projectId,
        error: error?.message || String(error),
        databaseResult: 'No usable running retrieval receipt was created.',
        nextStep: 'Connect a ready archive or add thematic material, then try Extract useful material again.',
      }, { outcome: 'failed' });
      throw error;
    }
  }

  async searchHistory({ projectId, retrievalRunId, queries, limit = 20 }) {
    const receipt = this.service.getStylofactRetrievalReceipt(retrievalRunId);
    if (receipt.run.projectId !== projectId) {
      this._log('error', 'Stylofact blocked a corpus search with a mismatched project receipt.', {
        projectId,
        retrievalRunId,
        receiptProjectId: receipt.run.projectId,
        result: 'No archive search or database write was performed.',
      }, { outcome: 'blocked' });
      throw new Error('This retrieval receipt belongs to another Stylofact project.');
    }
    const priorSearches = receipt.run.searchPlan?.searches?.length || 0;
    if (priorSearches >= MAX_SEARCH_CALLS) {
      this._log('warn', 'Stylofact stopped an additional archive search at the follow-up-round limit.', {
        projectId,
        retrievalRunId,
        completedSearchRounds: priorSearches,
        allowedSearchRounds: MAX_SEARCH_CALLS,
        result: 'No additional archive search was performed.',
      }, { outcome: 'budget-enforced' });
      throw new Error('Stylofact completed its initial search and two permitted follow-up rounds.');
    }
    const priorQueries = (receipt.run.searchPlan?.searches || [])
      .reduce((sum, search) => sum + (search.queries?.length || 0), 0);
    const remainingQueries = Math.max(0, MAX_SEARCH_QUERIES - priorQueries);
    if (!remainingQueries) {
      this._log('warn', 'Stylofact stopped an additional archive search at the eight-query evidence limit.', {
        projectId,
        retrievalRunId,
        completedQueries: priorQueries,
        allowedQueries: MAX_SEARCH_QUERIES,
        result: 'No additional archive search was performed.',
      }, { outcome: 'budget-enforced' });
      throw new Error('Stylofact reached its eight-query evidence budget for this run.');
    }
    const boundedQueries = (queries || []).slice(0, Math.min(4, remainingQueries));
    const corpusIds = receipt.run.corpusSnapshot.map((corpus) => corpus.corpusId).filter(Boolean);
    const startedAt = Date.now();
    this._log('info', 'Stylofact asked the local archive a new set of retrieval questions.', {
      projectId,
      retrievalRunId,
      searchRound: priorSearches + 1,
      questions: boundedQueries,
      eligibleCorpusIds: corpusIds,
      candidatePolicy: 'Up to 60 keyword and 60 semantic candidates per question, fused and diversified locally.',
      databaseRead: 'Reading only the linked local corpus sidecar indexes.',
      promptSafety: 'Archive text is treated as quoted data, never as instructions.',
    }, { phase: 'search' });
    try {
      const result = await this._call('searchHistory', { corpusIds, queries: boundedQueries, limit: Math.min(20, limit) });
      const withIds = [...result.selected, ...result.excluded].map((candidate) => ({
        ...candidate,
        id: crypto.randomUUID(),
        exclusionReason: candidate.exclusionReason || null,
      }));
      await this.service.appendStylofactRetrievalCandidates(retrievalRunId, withIds, {
        mode: result.mode,
        queries: boundedQueries,
        queryTrace: result.queryTrace,
        searchedCorpusIds: result.searchedCorpusIds,
        rrfK: 60,
        mmrLambda: 0.75,
        maxPerConversation: 3,
      });
      const selectedIds = new Set(result.selected.map((candidate) => `${candidate.corpusId}:${candidate.chunkId}`));
      const response = {
        retrievalRunId,
        mode: result.mode,
        queries: result.queries,
        results: withIds.filter((candidate) => selectedIds.has(`${candidate.corpusId}:${candidate.chunkId}`)).map((candidate) => ({
          resultId: candidate.id,
          conversationTitle: candidate.conversationTitle,
          date: candidate.messageAt ? new Date(candidate.messageAt).toISOString() : null,
          role: 'user',
          excerpt: candidate.exactText.slice(0, 1400),
          matchedQueries: candidate.matchedQueries,
          ranking: {
            bm25: candidate.bm25Rank || null,
            semantic: candidate.semanticRank || null,
            fused: candidate.finalRank || null,
          },
        })),
        instruction: 'Fetch context for promising resultIds before quoting them. Search excerpts are previews, not approved evidence.',
      };
      this._log('info', 'Stylofact completed the local archive search and saved its candidate receipt.', {
        projectId,
        retrievalRunId,
        searchRound: priorSearches + 1,
        questions: boundedQueries,
        retrievalMode: result.mode,
        selectedPreviews: result.selected.length,
        omittedCandidates: result.excluded.length,
        queryTrace: result.queryTrace,
        rankingPolicy: 'RRF k=60; MMR lambda=0.75; maximum three initial hits per conversation.',
        databaseWrite: 'Saved every considered candidate, channel ranks, final rank, selection state, and exclusion reason.',
        durationMs: Date.now() - startedAt,
        nextStep: 'The agent may fetch exact context for promising result IDs before quoting them.',
      }, { phase: 'complete', outcome: 'success' });
      return response;
    } catch (error) {
      this._log('error', 'Stylofact could not complete the local archive search.', {
        projectId,
        retrievalRunId,
        questions: boundedQueries,
        error: error?.message || String(error),
        durationMs: Date.now() - startedAt,
        nextStep: 'The Stage 2 run can retry within its search budget or continue with already verified context.',
      }, { outcome: 'failed' });
      throw error;
    }
  }

  async fetchContext({ projectId, retrievalRunId, resultIds, before = 1, after = 1 }) {
    const receipt = this.service.getStylofactRetrievalReceipt(retrievalRunId);
    if (receipt.run.projectId !== projectId) {
      this._log('error', 'Stylofact blocked an exact-context request with a mismatched project receipt.', {
        projectId,
        retrievalRunId,
        receiptProjectId: receipt.run.projectId,
        result: 'No archive context was read or added to the model payload.',
      }, { outcome: 'blocked' });
      throw new Error('This retrieval receipt belongs to another Stylofact project.');
    }
    const requested = new Set((resultIds || []).map(String));
    const remainingPassages = Math.max(0, MAX_PACKED_PASSAGES - receipt.run.packedContext.length);
    const candidates = receipt.candidates.filter((candidate) => requested.has(candidate.id)).slice(0, remainingPassages);
    const contexts = [];
    let characters = receipt.run.packedContext.reduce((sum, context) => sum + String(context.exactText || '').length, 0);
    const startedAt = Date.now();
    this._log('info', 'Stylofact started fetching exact archived context for promising search results.', {
      projectId,
      retrievalRunId,
      requestedResultIds: [...requested],
      eligibleResults: candidates.length,
      adjacentTurnsRequested: { before, after },
      remainingPassageBudget: remainingPassages,
      remainingCharacterBudget: Math.max(0, MAX_PACKED_CHARACTERS - characters),
      databaseRead: 'Reading exact cached source text by corpus, chunk, and source hash.',
    }, { phase: 'fetch-context' });
    try {
      let stoppedAtCharacterLimit = false;
      for (const candidate of candidates) {
        const context = await this._call('sourceContext', {
          corpusId: candidate.locator.corpusId,
          chunkId: candidate.locator.chunkId,
          sourceHash: candidate.locator.sourceHash,
          before,
          after,
        });
        if (characters + context.exactText.length > MAX_PACKED_CHARACTERS) {
          stoppedAtCharacterLimit = true;
          break;
        }
        contexts.push(context);
        characters += context.exactText.length;
      }
      this.service.selectStylofactRetrievalContext(retrievalRunId, contexts);
      const response = {
        retrievalRunId,
        verifiedPassages: contexts,
        passageCount: contexts.length,
        packedCharacters: characters,
        policy: 'Only role=user exactText is evidence. role=assistant entries are labeled surrounding context only.',
      };
      this._log('info', 'Stylofact verified and saved exact archive passages for Stage 2.', {
        projectId,
        retrievalRunId,
        requestedPassages: requested.size,
        verifiedPassages: contexts.length,
        packedCharacters: characters,
        stoppedAtCharacterLimit,
        sourceLocators: contexts.map((context) => context.locator),
        evidencePolicy: 'Only exact role=user text is evidence; adjacent assistant turns remain visibly labeled AI context.',
        databaseWrite: 'Saved the immutable exact-text payload and marked its candidates selected in the retrieval receipt.',
        durationMs: Date.now() - startedAt,
      }, { phase: 'complete', outcome: 'success' });
      return response;
    } catch (error) {
      this._log('error', 'Stylofact could not fetch or verify exact archive context.', {
        projectId,
        retrievalRunId,
        requestedResultIds: [...requested],
        error: error?.message || String(error),
        sourceSafety: 'Unverified text was not added to the Stage 2 context.',
        nextStep: 'The agent can choose another receipt candidate or finish with already verified passages.',
      }, { outcome: 'failed' });
      throw error;
    }
  }

  completeRetrieval(retrievalRunId, input) {
    const result = this.service.completeStylofactRetrieval(retrievalRunId, input);
    const failed = result.row?.status === 'failed';
    this._log(failed ? 'error' : 'info', failed
      ? 'The Stylofact retrieval run finished with an error.'
      : 'The Stylofact retrieval run completed and its receipt was finalized.', {
      retrievalRunId,
      projectId: result.row?.projectId || null,
      status: result.row?.status || input?.status || 'completed',
      durationMs: result.row?.durationMs || null,
      agentThreadId: result.row?.agentThreadId || input?.agentThreadId || null,
      agentTurnId: result.row?.agentTurnId || input?.agentTurnId || null,
      error: result.row?.error || input?.error || null,
      databaseWrite: 'Saved completion status, duration, agent audit identifiers, and any failure detail.',
      nextStep: failed ? 'Open the run or Log Panel for the failure detail, then retry Stage 2 if appropriate.' : 'Use View search receipt to inspect every question, candidate, rank, omission, and exact model context.',
    }, { phase: 'complete', outcome: failed ? 'failed' : 'success' });
    return result;
  }

  getRetrievalReceipt(retrievalRunId) {
    const receipt = this.service.getStylofactRetrievalReceipt(retrievalRunId);
    this._log('info', 'The Stylofact search receipt was opened from local storage.', {
      retrievalRunId,
      projectId: receipt.run.projectId,
      status: receipt.run.status,
      candidates: receipt.candidates.length,
      selectedPassages: receipt.run.packedContext.length,
      exactContextCharacters: receipt.run.packedContext.reduce((sum, context) => sum + String(context.exactText || '').length, 0),
      databaseRead: 'Read the immutable retrieval run, search trace, candidate records, and exact context snapshot.',
    }, { outcome: 'success' });
    return receipt;
  }

  getSourceContext(locator) {
    if (locator.retrievalRunId) {
      const receipt = this.service.getStylofactRetrievalReceipt(locator.retrievalRunId);
      const snapshot = receipt.run.packedContext.find((context) => (
        context.locator?.corpusId === locator.corpusId
        && context.locator?.chunkId === locator.chunkId
        && context.locator?.sourceHash === locator.sourceHash
      ));
      if (snapshot) {
        this._log('info', 'Opened exact source context from the immutable Stylofact receipt snapshot.', {
          retrievalRunId: locator.retrievalRunId,
          sourceLocator: locator,
          evidenceRole: 'user',
          assistantContextLabel: 'AI context',
          databaseRead: 'Read the exact passage saved with the completed retrieval run.',
          sourceResult: 'The receipt snapshot is shown even if the live archive later changes or moves.',
        }, { outcome: 'success' });
        return Promise.resolve(snapshot);
      }
    }
    const startedAt = Date.now();
    return this._call('sourceContext', {
      corpusId: locator.corpusId,
      chunkId: locator.chunkId,
      sourceHash: locator.sourceHash,
      before: 1,
      after: 1,
    }).then((context) => {
      this._log('info', 'Opened exact source context from the live local corpus cache.', this._corpusLogData(locator.corpusId, {
        sourceLocator: locator,
        evidenceRole: 'user',
        assistantContextLabel: 'AI context',
        databaseRead: 'Read exact cached source text and adjacent labeled turns by stable locator.',
        durationMs: Date.now() - startedAt,
      }), { outcome: 'success' });
      return context;
    }).catch((error) => {
      this._log('error', 'Stylofact could not open the requested exact source context.', this._corpusLogData(locator.corpusId, {
        sourceLocator: locator,
        error: error?.message || String(error),
        nextStep: 'Open the immutable retrieval receipt when available, or refresh the corpus if the live source changed.',
      }), { outcome: 'failed' });
      throw error;
    });
  }

  async close() {
    this._log('info', 'Stopping the local Stylofact Corpus Navigator.', {
      activeArchiveWatchers: this.watchers.size,
      pendingWorkerRequests: this.pending.size,
      cacheResult: 'Corpus and model caches remain on disk for the next briizOS session.',
    }, { phase: 'stop' });
    this.closed = true;
    this.watchers.forEach(({ watcher, clear }) => {
      clear();
      watcher.close();
    });
    this.watchers.clear();
    if (!this.worker) return;
    const worker = this.worker;
    try { await this._call('close'); } catch { /* Worker may already be gone. */ }
    worker.kill();
    this.worker = null;
    this._log('info', 'The local Stylofact Corpus Navigator stopped cleanly.', {
      cacheResult: 'No source archives or cached indexes were deleted.',
    }, { phase: 'complete', outcome: 'success' });
  }
}

module.exports = {
  DIRECT_CONTEXT_LIMIT,
  MAX_PACKED_CHARACTERS,
  MAX_PACKED_PASSAGES,
  MAX_SEARCH_CALLS,
  MAX_SEARCH_QUERIES,
  StylofactCorpusService,
};
