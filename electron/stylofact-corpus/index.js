const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { Worker } = require('worker_threads');
const { detectArchive, sha256 } = require('./parser');

const DIRECT_CONTEXT_LIMIT = 80000;
const MAX_SEARCH_CALLS = 3;
const MAX_SEARCH_QUERIES = 8;
const MAX_PACKED_PASSAGES = 20;
const MAX_PACKED_CHARACTERS = 80000;

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
    this.closed = false;
  }

  async initialize() {
    if (this.worker) return this.status();
    this.worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: {
        databasePath: path.join(this.userDataPath, 'stylofact-corpus.db'),
        modelCachePath: path.join(this.userDataPath, 'stylofact-models'),
        disableEmbeddings: this.disableEmbeddings,
      },
    });
    this.worker.on('message', (message) => this._onMessage(message));
    this.worker.on('error', (error) => this._onWorkerFailure(error));
    this.worker.on('exit', (code) => {
      if (!this.closed && code !== 0) this._onWorkerFailure(new Error(`Stylofact corpus worker stopped with code ${code}`));
    });
    const status = await this.status();
    for (const corpus of this.service.listStylofactCorpora()) {
      this._watchCorpus(corpus);
      if (fs.existsSync(corpus.rootPath)) {
        this.refreshCorpus(corpus.id).catch((error) => this._markError(corpus.id, error));
      } else {
        this.service.updateStylofactCorpusStatus(corpus.id, {
          state: 'stale',
          progressMessage: 'The connected archive folder is unavailable. Cached search remains intact.',
          error: 'Source folder unavailable',
        });
      }
    }
    this.logger?.info?.('stylofact.corpus', 'The local Stylofact corpus navigator started inside briizOS.', {
      sidecarPath: path.join(this.userDataPath, 'stylofact-corpus.db'),
      vectorAvailable: status.vectorAvailable,
      manualServerRequired: false,
    });
    return status;
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

  _onWorkerFailure(error) {
    this.logger?.error?.('stylofact.corpus', 'The Stylofact corpus worker failed.', { error: error?.message });
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
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
      } else if (event === 'lexical-ready') {
        this._writeCounts(corpusId, payload, 'lexical-ready', 'Keyword search is ready; semantic preparation continues locally.');
      } else if (event === 'embedding-progress') {
        this._writeProgress(corpusId, {
          state: 'semantic-indexing',
          embeddedChunkCount: payload.current,
          progressCurrent: payload.current,
          progressTotal: payload.total,
          progressMessage: payload.message,
          error: null,
        });
      } else if (event === 'semantic-ready') {
        this._writeCounts(corpusId, payload, 'ready', 'Keyword and semantic search are ready.');
      } else if (event === 'paused') {
        this._writeCounts(corpusId, payload, 'paused', 'Semantic indexing is paused. Keyword search remains ready.', true);
      } else if (event === 'embedding-error') {
        this.service.updateStylofactCorpusStatus(corpusId, {
          state: 'lexical-ready',
          progressMessage: 'Semantic search is unavailable; Stylofact will use exact keyword search.',
          error: payload.error,
        });
      } else if (event === 'model-progress') {
        const percent = Number.isFinite(payload.progress) ? ` ${Math.round(payload.progress)}%` : '';
        this.service.listStylofactCorpora({ includeInternal: true })
          .filter((corpus) => corpus.state === 'semantic-indexing')
          .forEach((corpus) => this._writeProgress(corpus.id, {
            state: 'semantic-indexing',
            progressMessage: `${payload.status === 'done' ? 'Verified' : 'Downloading'} local semantic model${percent}${payload.file ? ` · ${payload.file}` : ''}`,
            error: null,
          }));
      } else if (event === 'model-ready') {
        this.service.listStylofactCorpora({ includeInternal: true }).forEach((corpus) => {
          this.service.updateStylofactCorpusStatus(corpus.id, {
            embeddingModelChecksum: payload.checksum,
            progressMessage: payload.changedFromPreviousCache
              ? 'The pinned local model cache changed and its new checksum was recorded.'
              : corpus.progressMessage,
          });
        });
      }
    } catch (error) {
      this.logger?.warn?.('stylofact.corpus', 'Could not persist corpus progress.', { event, corpusId, error: error?.message });
    }
    this.emit('progress', { event, payload });
  }

  _writeProgress(corpusId, patch) {
    if (!corpusId) return;
    const now = Date.now();
    const last = this.progressWrittenAt.get(corpusId) || 0;
    const terminal = ['ready', 'lexical-ready', 'paused', 'error', 'stale'].includes(patch.state);
    if (!terminal && now - last < 1000) return;
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
    if (!this.worker) return Promise.reject(new Error('Stylofact corpus navigator is not ready.'));
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
    const archive = detectArchive(rootPath);
    const created = this.service.createStylofactCorpus({
      name: path.basename(archive.rootPath) || 'Chat history',
      sourceKind: archive.sourceKind,
      rootPath: archive.rootPath,
    });
    this.service.linkStylofactProjectCorpus(projectId, created.row.id);
    this._watchCorpus(created.row);
    this.refreshCorpus(created.row.id).catch((error) => this._markError(created.row.id, error));
    return {
      corpus: this.service.getStylofactCorpus(created.row.id),
      linkedCorpora: this.service.listStylofactProjectCorpora(projectId),
    };
  }

  linkProjectCorpus(projectId, corpusId) {
    return this.service.linkStylofactProjectCorpus(projectId, corpusId);
  }

  unlinkProjectCorpus(projectId, corpusId) {
    return this.service.unlinkStylofactProjectCorpus(projectId, corpusId);
  }

  refreshCorpus(corpusId, { rebuild = false } = {}) {
    if (this.refreshing.has(corpusId)) return this.refreshing.get(corpusId);
    const corpus = this.getCorpusStatus(corpusId);
    if (corpus.sourceKind === 'project-sources') return Promise.resolve(corpus);
    if (!fs.existsSync(corpus.rootPath)) {
      this.service.updateStylofactCorpusStatus(corpusId, {
        state: 'stale',
        progressMessage: 'The connected archive folder is unavailable. Cached search remains intact.',
        error: 'Source folder unavailable',
      });
      return Promise.resolve(this.getCorpusStatus(corpusId));
    }
    this.service.updateStylofactCorpusStatus(corpusId, {
      state: 'scanning',
      progressCurrent: 0,
      progressTotal: 0,
      progressMessage: rebuild ? 'Rebuilding the local archive index…' : 'Checking the archive for changes…',
      error: null,
    });
    const promise = this._call('indexArchive', { corpusId, rootPath: corpus.rootPath, rebuild })
      .then(() => this.getCorpusStatus(corpusId))
      .catch((error) => {
        this._markError(corpusId, error);
        throw error;
      })
      .finally(() => this.refreshing.delete(corpusId));
    this.refreshing.set(corpusId, promise);
    return promise;
  }

  rebuildCorpus(corpusId) {
    return this.refreshCorpus(corpusId, { rebuild: true });
  }

  async setIndexingPaused(corpusId, paused) {
    await this._call('setPaused', { corpusId, paused: !!paused });
    this.service.updateStylofactCorpusStatus(corpusId, {
      state: paused ? 'paused' : 'semantic-indexing',
      paused: !!paused,
      progressMessage: paused ? 'Semantic indexing is paused. Keyword search remains ready.' : 'Semantic indexing resumed.',
    });
    return this.getCorpusStatus(corpusId);
  }

  _watchCorpus(corpus) {
    if (!corpus || corpus.sourceKind === 'project-sources' || this.watchers.has(corpus.id) || !fs.existsSync(corpus.rootPath)) return;
    let timer = null;
    try {
      const watcher = fs.watch(corpus.rootPath, { recursive: process.platform !== 'linux' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.refreshCorpus(corpus.id).catch((error) => this._markError(corpus.id, error));
        }, 1500);
      });
      this.watchers.set(corpus.id, { watcher, clear: () => clearTimeout(timer) });
    } catch (error) {
      this.logger?.warn?.('stylofact.corpus', 'The archive could not be watched; startup and manual refresh still work.', {
        corpusId: corpus.id,
        error: error?.message,
      });
    }
  }

  _markError(corpusId, error) {
    try {
      const corpus = this.service.getStylofactCorpus(corpusId);
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
    }
    if (corpus.sourceFingerprint !== fingerprint || !['lexical-ready', 'semantic-indexing', 'ready', 'paused'].includes(corpus.state)) {
      await this._call('indexDocuments', { corpusId, projectId, documents: sources, fingerprint });
    }
    return this.getCorpusStatus(corpusId);
  }

  async beginRetrieval(projectId, queryText) {
    const projectSourceCorpus = await this.prepareProjectSources(projectId);
    const thematicSources = this.service.listStylofactSources(projectId, 'thematic');
    const thematicCharacters = thematicSources.reduce((sum, source) => sum + source.bodyText.length, 0);
    const linked = this.service.listStylofactProjectCorpora(projectId)
      .filter((corpus) => (
        (corpus.sourceKind !== 'project-sources' || corpus.id === projectSourceCorpus?.id)
        && ['lexical-ready', 'semantic-indexing', 'ready', 'paused', 'stale'].includes(corpus.state)
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
    return this.service.beginStylofactRetrieval(projectId, queryText, snapshot, directContexts);
  }

  async searchHistory({ projectId, retrievalRunId, queries, limit = 20 }) {
    const receipt = this.service.getStylofactRetrievalReceipt(retrievalRunId);
    if (receipt.run.projectId !== projectId) throw new Error('This retrieval receipt belongs to another Stylofact project.');
    const priorSearches = receipt.run.searchPlan?.searches?.length || 0;
    if (priorSearches >= MAX_SEARCH_CALLS) throw new Error('Stylofact completed its initial search and two permitted follow-up rounds.');
    const priorQueries = (receipt.run.searchPlan?.searches || [])
      .reduce((sum, search) => sum + (search.queries?.length || 0), 0);
    const remainingQueries = Math.max(0, MAX_SEARCH_QUERIES - priorQueries);
    if (!remainingQueries) throw new Error('Stylofact reached its eight-query evidence budget for this run.');
    const boundedQueries = (queries || []).slice(0, Math.min(4, remainingQueries));
    const corpusIds = receipt.run.corpusSnapshot.map((corpus) => corpus.corpusId).filter(Boolean);
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
    return {
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
  }

  async fetchContext({ projectId, retrievalRunId, resultIds, before = 1, after = 1 }) {
    const receipt = this.service.getStylofactRetrievalReceipt(retrievalRunId);
    if (receipt.run.projectId !== projectId) throw new Error('This retrieval receipt belongs to another Stylofact project.');
    const requested = new Set((resultIds || []).map(String));
    const remainingPassages = Math.max(0, MAX_PACKED_PASSAGES - receipt.run.packedContext.length);
    const candidates = receipt.candidates.filter((candidate) => requested.has(candidate.id)).slice(0, remainingPassages);
    const contexts = [];
    let characters = receipt.run.packedContext.reduce((sum, context) => sum + String(context.exactText || '').length, 0);
    for (const candidate of candidates) {
      const context = await this._call('sourceContext', {
        corpusId: candidate.locator.corpusId,
        chunkId: candidate.locator.chunkId,
        sourceHash: candidate.locator.sourceHash,
        before,
        after,
      });
      if (characters + context.exactText.length > MAX_PACKED_CHARACTERS) break;
      contexts.push(context);
      characters += context.exactText.length;
    }
    this.service.selectStylofactRetrievalContext(retrievalRunId, contexts);
    return {
      retrievalRunId,
      verifiedPassages: contexts,
      passageCount: contexts.length,
      packedCharacters: characters,
      policy: 'Only role=user exactText is evidence. role=assistant entries are labeled surrounding context only.',
    };
  }

  completeRetrieval(retrievalRunId, input) {
    return this.service.completeStylofactRetrieval(retrievalRunId, input);
  }

  getRetrievalReceipt(retrievalRunId) {
    return this.service.getStylofactRetrievalReceipt(retrievalRunId);
  }

  getSourceContext(locator) {
    if (locator.retrievalRunId) {
      const receipt = this.service.getStylofactRetrievalReceipt(locator.retrievalRunId);
      const snapshot = receipt.run.packedContext.find((context) => (
        context.locator?.corpusId === locator.corpusId
        && context.locator?.chunkId === locator.chunkId
        && context.locator?.sourceHash === locator.sourceHash
      ));
      if (snapshot) return Promise.resolve(snapshot);
    }
    return this._call('sourceContext', {
      corpusId: locator.corpusId,
      chunkId: locator.chunkId,
      sourceHash: locator.sourceHash,
      before: 1,
      after: 1,
    });
  }

  async close() {
    this.closed = true;
    this.watchers.forEach(({ watcher, clear }) => {
      clear();
      watcher.close();
    });
    this.watchers.clear();
    if (!this.worker) return;
    try { await this._call('close'); } catch { /* Worker may already be gone. */ }
    await this.worker.terminate();
    this.worker = null;
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
