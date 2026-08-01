const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('worker_threads');
const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');
const {
  chunkMessage,
  detectArchive,
  extractConversation,
  hashFile,
  sha256,
  streamConversations,
} = require('./parser');
const { diversifyCandidates, reciprocalRankFuse, safeFtsQuery } = require('./retrieval');

const INDEX_VERSION = 'stylofact-corpus/1';
const EMBEDDING_MODEL = 'mixedbread-ai/mxbai-embed-xsmall-v1';
const EMBEDDING_MODEL_REVISION = 'e6ac24e5d6efb8782b59de1647b3ececb4ece94e';
const EMBEDDING_MODEL_REF = `${EMBEDDING_MODEL}@${EMBEDDING_MODEL_REVISION}`;
const EMBEDDING_DIMENSIONS = 384;
const EMBEDDING_BATCH = 16;

const db = new Database(workerData.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');

let vectorAvailable = false;
let vectorError = null;
try {
  if (workerData.disableEmbeddings) throw new Error('Semantic embeddings are disabled for this test run.');
  sqliteVec.load(db);
  vectorAvailable = true;
} catch (error) {
  vectorError = error?.message || String(error);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS corpus_index_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS corpora (
    id TEXT PRIMARY KEY,
    source_kind TEXT NOT NULL,
    root_path TEXT NOT NULL,
    fingerprint TEXT,
    state TEXT NOT NULL DEFAULT 'scanning',
    semantic_ready INTEGER NOT NULL DEFAULT 0,
    index_version TEXT NOT NULL,
    embedding_model TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS source_files (
    corpus_id TEXT NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
    relative_path TEXT NOT NULL,
    absolute_path TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    mtime_ms INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    PRIMARY KEY (corpus_id, relative_path)
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corpus_id TEXT NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    title TEXT NOT NULL,
    conversation_at INTEGER,
    current_node TEXT,
    UNIQUE (corpus_id, conversation_id)
  );
  CREATE INDEX IF NOT EXISTS idx_corpus_conversations_file
    ON conversations(corpus_id, source_file);
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corpus_id TEXT NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    exact_text TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    message_at INTEGER,
    UNIQUE (corpus_id, message_id)
  );
  CREATE INDEX IF NOT EXISTS idx_corpus_messages_conversation
    ON messages(corpus_id, conversation_id, ordinal);
  CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corpus_id TEXT NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    conversation_title TEXT NOT NULL,
    message_id TEXT NOT NULL,
    chunk_id TEXT NOT NULL,
    start_char INTEGER NOT NULL,
    end_char INTEGER NOT NULL,
    exact_text TEXT NOT NULL,
    context_text TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    message_at INTEGER,
    embedded_model TEXT,
    UNIQUE (corpus_id, chunk_id)
  );
  CREATE INDEX IF NOT EXISTS idx_corpus_chunks_message
    ON chunks(corpus_id, message_id, start_char);
  CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    exact_text,
    conversation_title,
    content='chunks',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
  );
  CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
    INSERT INTO chunks_fts(rowid, exact_text, conversation_title)
    VALUES (new.id, new.exact_text, new.conversation_title);
  END;
  CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
    INSERT INTO chunks_fts(chunks_fts, rowid, exact_text, conversation_title)
    VALUES ('delete', old.id, old.exact_text, old.conversation_title);
  END;
  CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
    INSERT INTO chunks_fts(chunks_fts, rowid, exact_text, conversation_title)
    VALUES ('delete', old.id, old.exact_text, old.conversation_title);
    INSERT INTO chunks_fts(rowid, exact_text, conversation_title)
    VALUES (new.id, new.exact_text, new.conversation_title);
  END;
`);

if (vectorAvailable) {
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
      corpus_id TEXT PARTITION KEY,
      embedding FLOAT[${EMBEDDING_DIMENSIONS}]
    )`);
  } catch (error) {
    vectorAvailable = false;
    vectorError = error?.message || String(error);
  }
}

const pausedCorpora = new Set();
const embeddingTasks = new Map();
let extractorPromise = null;
let lastModelProgressAt = 0;

async function modelCacheChecksum(rootPath) {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && !entry.name.endsWith('.lock')) files.push(absolute);
    }
  };
  walk(rootPath);
  files.sort();
  const manifest = [];
  for (const filePath of files) {
    manifest.push([path.relative(rootPath, filePath), await hashFile(filePath)]);
  }
  return sha256(JSON.stringify(manifest));
}

function modelCacheStats(rootPath) {
  let fileCount = 0;
  let totalBytes = 0;
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && !entry.name.endsWith('.lock')) {
        fileCount += 1;
        totalBytes += fs.statSync(absolute).size;
      }
    }
  };
  walk(rootPath);
  return { fileCount, totalBytes };
}

function postEvent(event, payload = {}) {
  parentPort.postMessage({ type: 'event', event, payload });
}

function reply(requestId, value, error = null) {
  parentPort.postMessage({ type: 'response', requestId, value, error });
}

function deleteFileRows(corpusId, relativePath) {
  if (vectorAvailable) {
    const rows = db.prepare(`
      SELECT ch.id FROM chunks ch
      JOIN conversations c ON c.corpus_id = ch.corpus_id AND c.conversation_id = ch.conversation_id
      WHERE c.corpus_id = ? AND c.source_file = ?
    `).all(corpusId, relativePath);
    const removeVector = db.prepare('DELETE FROM vec_chunks WHERE rowid = ?');
    const transaction = db.transaction(() => rows.forEach((row) => removeVector.run(BigInt(row.id))));
    transaction();
  }
  db.prepare('DELETE FROM conversations WHERE corpus_id = ? AND source_file = ?').run(corpusId, relativePath);
  db.prepare('DELETE FROM messages WHERE corpus_id = ? AND conversation_id NOT IN (SELECT conversation_id FROM conversations WHERE corpus_id = ?)')
    .run(corpusId, corpusId);
  db.prepare('DELETE FROM chunks WHERE corpus_id = ? AND conversation_id NOT IN (SELECT conversation_id FROM conversations WHERE corpus_id = ?)')
    .run(corpusId, corpusId);
  db.prepare('DELETE FROM source_files WHERE corpus_id = ? AND relative_path = ?').run(corpusId, relativePath);
}

const insertConversationRow = db.prepare(`
  INSERT INTO conversations (corpus_id, conversation_id, source_file, title, conversation_at, current_node)
  VALUES (@corpusId, @conversationId, @sourceFile, @title, @conversationAt, @currentNode)
  ON CONFLICT(corpus_id, conversation_id) DO UPDATE SET
    source_file = excluded.source_file,
    title = excluded.title,
    conversation_at = excluded.conversation_at,
    current_node = excluded.current_node
`);
const insertMessageRow = db.prepare(`
  INSERT INTO messages (
    corpus_id, conversation_id, message_id, ordinal, role, exact_text, source_hash, message_at
  ) VALUES (@corpusId, @conversationId, @messageId, @ordinal, @role, @text, @sourceHash, @messageAt)
  ON CONFLICT(corpus_id, message_id) DO UPDATE SET
    conversation_id = excluded.conversation_id,
    ordinal = excluded.ordinal,
    role = excluded.role,
    exact_text = excluded.exact_text,
    source_hash = excluded.source_hash,
    message_at = excluded.message_at
`);
const insertChunkRow = db.prepare(`
  INSERT INTO chunks (
    corpus_id, conversation_id, conversation_title, message_id, chunk_id,
    start_char, end_char, exact_text, context_text, source_hash, message_at, embedded_model
  ) VALUES (
    @corpusId, @conversationId, @conversationTitle, @messageId, @chunkId,
    @startChar, @endChar, @exactText, @contextText, @sourceHash, @messageAt, NULL
  )
  ON CONFLICT(corpus_id, chunk_id) DO UPDATE SET
    conversation_title = excluded.conversation_title,
    start_char = excluded.start_char,
    end_char = excluded.end_char,
    exact_text = excluded.exact_text,
    context_text = excluded.context_text,
    source_hash = excluded.source_hash,
    message_at = excluded.message_at,
    embedded_model = CASE
      WHEN chunks.context_text = excluded.context_text THEN chunks.embedded_model
      ELSE NULL
    END
`);

const insertExtractedConversation = db.transaction((corpusId, extracted) => {
  insertConversationRow.run({ corpusId, ...extracted });
  extracted.messages.forEach((message) => insertMessageRow.run({ corpusId, ...message }));
  extracted.chunks.forEach((chunk) => insertChunkRow.run({ corpusId, ...chunk }));
});

function corpusCounts(corpusId) {
  return {
    conversations: db.prepare('SELECT COUNT(*) AS value FROM conversations WHERE corpus_id = ?').get(corpusId).value,
    userMessages: db.prepare("SELECT COUNT(*) AS value FROM messages WHERE corpus_id = ? AND role = 'user'").get(corpusId).value,
    contextMessages: db.prepare("SELECT COUNT(*) AS value FROM messages WHERE corpus_id = ? AND role = 'assistant'").get(corpusId).value,
    chunks: db.prepare('SELECT COUNT(*) AS value FROM chunks WHERE corpus_id = ?').get(corpusId).value,
    embeddedChunks: vectorAvailable
      ? db.prepare('SELECT COUNT(*) AS value FROM chunks WHERE corpus_id = ? AND embedded_model = ?').get(corpusId, EMBEDDING_MODEL_REF).value
      : 0,
  };
}

function sourceFingerprint(corpusId) {
  const rows = db.prepare(`
    SELECT relative_path, content_hash FROM source_files WHERE corpus_id = ? ORDER BY relative_path
  `).all(corpusId);
  return sha256(JSON.stringify(rows));
}

async function indexArchive({ corpusId, rootPath, rebuild = false }) {
  const archive = detectArchive(rootPath);
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO corpora (id, source_kind, root_path, state, semantic_ready, index_version, embedding_model, updated_at)
    VALUES (?, ?, ?, 'scanning', 0, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET source_kind=excluded.source_kind, root_path=excluded.root_path,
      state='scanning', semantic_ready=0, index_version=excluded.index_version,
      embedding_model=excluded.embedding_model, updated_at=excluded.updated_at
  `).run(corpusId, archive.sourceKind, archive.rootPath, INDEX_VERSION, EMBEDDING_MODEL_REF, timestamp);

  if (rebuild) {
    const files = db.prepare('SELECT relative_path FROM source_files WHERE corpus_id = ?').all(corpusId);
    files.forEach((row) => deleteFileRows(corpusId, row.relative_path));
  }

  const known = new Map(db.prepare('SELECT * FROM source_files WHERE corpus_id = ?').all(corpusId)
    .map((row) => [row.relative_path, row]));
  const currentRelativePaths = new Set();
  let completedFiles = 0;

  for (const filePath of archive.files) {
    const relativePath = path.relative(archive.rootPath, filePath);
    currentRelativePaths.add(relativePath);
    const stat = fs.statSync(filePath);
    const previous = known.get(relativePath);
    if (!rebuild && previous && previous.byte_size === stat.size && Math.round(previous.mtime_ms) === Math.round(stat.mtimeMs)) {
      completedFiles += 1;
      postEvent('index-progress', { corpusId, current: completedFiles, total: archive.files.length, message: `Checked ${relativePath}` });
      continue;
    }

    const contentHash = await hashFile(filePath);
    if (!rebuild && previous?.content_hash === contentHash) {
      db.prepare(`UPDATE source_files SET byte_size=?, mtime_ms=?, absolute_path=? WHERE corpus_id=? AND relative_path=?`)
        .run(stat.size, stat.mtimeMs, filePath, corpusId, relativePath);
      completedFiles += 1;
      continue;
    }

    deleteFileRows(corpusId, relativePath);
    let fileConversationCount = 0;
    for await (const conversation of streamConversations(filePath)) {
      if (!conversation?.mapping || typeof conversation.mapping !== 'object') continue;
      const extracted = extractConversation(conversation, relativePath);
      insertExtractedConversation(corpusId, extracted);
      fileConversationCount += 1;
      if (fileConversationCount % 100 === 0) {
        postEvent('index-progress', {
          corpusId,
          current: completedFiles,
          total: archive.files.length,
          message: `Indexed ${fileConversationCount.toLocaleString()} conversations from ${relativePath}`,
        });
      }
    }
    db.prepare(`
      INSERT INTO source_files (corpus_id, relative_path, absolute_path, byte_size, mtime_ms, content_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(corpusId, relativePath, filePath, stat.size, stat.mtimeMs, contentHash);
    completedFiles += 1;
    postEvent('index-progress', { corpusId, current: completedFiles, total: archive.files.length, message: `Indexed ${relativePath}` });
  }

  for (const relativePath of known.keys()) {
    if (!currentRelativePaths.has(relativePath)) deleteFileRows(corpusId, relativePath);
  }

  const fingerprint = sourceFingerprint(corpusId);
  const counts = corpusCounts(corpusId);
  db.prepare(`UPDATE corpora SET fingerprint=?, state='lexical-ready', semantic_ready=0, updated_at=? WHERE id=?`)
    .run(fingerprint, Date.now(), corpusId);
  const result = { sourceKind: archive.sourceKind, fingerprint, counts, vectorAvailable, vectorError };
  postEvent('lexical-ready', { corpusId, ...result });
  startEmbedding(corpusId);
  return result;
}

async function indexDocuments({ corpusId, projectId, documents = [], fingerprint }) {
  const sourceKind = 'project-sources';
  const rootPath = `briizos://stylofact-project/${projectId}`;
  db.prepare(`
    INSERT INTO corpora (id, source_kind, root_path, state, semantic_ready, index_version, embedding_model, updated_at)
    VALUES (?, ?, ?, 'scanning', 0, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET state='scanning', semantic_ready=0, updated_at=excluded.updated_at
  `).run(corpusId, sourceKind, rootPath, INDEX_VERSION, EMBEDDING_MODEL_REF, Date.now());

  const previous = db.prepare('SELECT fingerprint FROM corpora WHERE id = ?').get(corpusId)?.fingerprint;
  if (previous !== fingerprint) {
    const files = db.prepare('SELECT relative_path FROM source_files WHERE corpus_id = ?').all(corpusId);
    files.forEach((row) => deleteFileRows(corpusId, row.relative_path));
    documents.forEach((document, index) => {
      const text = String(document.bodyText || '');
      const conversationId = `source:${document.id}`;
      const title = String(document.label || `Thematic source ${index + 1}`);
      const messageId = `source-message:${document.id}`;
      const sourceHash = sha256(text);
      const chunks = chunkMessage(text).map((chunk, chunkIndex) => ({
        conversationId,
        conversationTitle: title,
        messageId,
        chunkId: `${messageId}:${chunkIndex}`,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        exactText: chunk.text,
        contextText: `Source: ${title}\nAlex: ${chunk.text}`,
        sourceHash,
        messageAt: document.updatedAt ? Date.parse(document.updatedAt) : null,
      }));
      insertExtractedConversation(corpusId, {
        conversationId,
        title,
        conversationAt: document.updatedAt ? Date.parse(document.updatedAt) : null,
        currentNode: messageId,
        sourceFile: `source:${document.id}`,
        messages: [{
          conversationId,
          messageId,
          ordinal: 0,
          role: 'user',
          text,
          sourceHash,
          messageAt: document.updatedAt ? Date.parse(document.updatedAt) : null,
        }],
        chunks,
      });
      db.prepare(`
        INSERT INTO source_files (corpus_id, relative_path, absolute_path, byte_size, mtime_ms, content_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(corpusId, `source:${document.id}`, rootPath, Buffer.byteLength(text), Date.now(), sourceHash);
    });
  }
  const counts = corpusCounts(corpusId);
  db.prepare(`UPDATE corpora SET fingerprint=?, state='lexical-ready', semantic_ready=0, updated_at=? WHERE id=?`)
    .run(fingerprint, Date.now(), corpusId);
  const result = { sourceKind, fingerprint, counts, vectorAvailable, vectorError };
  postEvent('lexical-ready', { corpusId, ...result });
  startEmbedding(corpusId);
  return result;
}

async function getExtractor() {
  if (!vectorAvailable) throw new Error(vectorError || 'The sqlite-vec extension is unavailable.');
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const transformers = await import('@huggingface/transformers');
      fs.mkdirSync(workerData.modelCachePath, { recursive: true });
      transformers.env.cacheDir = workerData.modelCachePath;
      transformers.env.allowRemoteModels = true;
      const cacheBefore = modelCacheStats(workerData.modelCachePath);
      postEvent('model-load-start', {
        embeddingModel: EMBEDDING_MODEL_REF,
        cacheFileCount: cacheBefore.fileCount,
        cacheBytes: cacheBefore.totalBytes,
        cachePresent: cacheBefore.fileCount > 0,
      });
      const progressCallback = (progress) => {
        const now = Date.now();
        const isContinuousProgress = progress?.status === 'progress' || progress?.status === 'progress_total';
        if (isContinuousProgress && now - lastModelProgressAt < 400) return;
        if (isContinuousProgress) lastModelProgressAt = now;
        postEvent('model-progress', {
          status: progress?.status || 'downloading',
          model: progress?.name || progress?.model || EMBEDDING_MODEL,
          file: progress?.file || null,
          cachePresent: cacheBefore.fileCount > 0,
          progress: Number.isFinite(progress?.progress) ? progress.progress : null,
          loaded: progress?.loaded || null,
          total: progress?.total || null,
        });
      };
      const extractor = await transformers.pipeline('feature-extraction', EMBEDDING_MODEL, {
        dtype: 'q8',
        revision: EMBEDDING_MODEL_REVISION,
        progress_callback: progressCallback,
      });
      const checksum = await modelCacheChecksum(workerData.modelCachePath);
      const cacheAfter = modelCacheStats(workerData.modelCachePath);
      const checksumKey = `embedding-model-checksum:${EMBEDDING_MODEL_REF}`;
      const previous = db.prepare('SELECT value FROM corpus_index_meta WHERE key = ?').get(checksumKey)?.value;
      db.prepare('INSERT OR REPLACE INTO corpus_index_meta (key, value) VALUES (?, ?)').run(checksumKey, checksum);
      postEvent('model-ready', {
        embeddingModel: EMBEDDING_MODEL_REF,
        checksum,
        changedFromPreviousCache: !!previous && previous !== checksum,
        cacheFileCount: cacheAfter.fileCount,
        cacheBytes: cacheAfter.totalBytes,
        cacheGrew: cacheAfter.fileCount > cacheBefore.fileCount || cacheAfter.totalBytes > cacheBefore.totalBytes,
      });
      return extractor;
    })().catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }
  return extractorPromise;
}

function floatBuffer(values) {
  const array = values instanceof Float32Array ? values : Float32Array.from(values);
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}

async function embedTexts(texts, { query = false } = {}) {
  const extractor = await getExtractor();
  const prepared = query
    ? texts.map((text) => `Represent this sentence for searching relevant passages: ${text}`)
    : texts;
  const output = await extractor(prepared, { pooling: 'mean', normalize: true });
  const data = output.data;
  const dimensions = output.dims?.[output.dims.length - 1] || EMBEDDING_DIMENSIONS;
  return prepared.map((_text, index) => data.slice(index * dimensions, (index + 1) * dimensions));
}

function startEmbedding(corpusId) {
  if (!vectorAvailable || embeddingTasks.has(corpusId)) return;
  const task = embedCorpus(corpusId)
    .catch((error) => {
      db.prepare("UPDATE corpora SET state='lexical-ready', semantic_ready=0, updated_at=? WHERE id=?")
        .run(Date.now(), corpusId);
      postEvent('embedding-error', { corpusId, error: error?.message || String(error) });
    })
    .finally(() => embeddingTasks.delete(corpusId));
  embeddingTasks.set(corpusId, task);
}

async function embedCorpus(corpusId) {
  db.prepare("UPDATE corpora SET state='semantic-indexing', semantic_ready=0, updated_at=? WHERE id=?")
    .run(Date.now(), corpusId);
  let counts = corpusCounts(corpusId);
  postEvent('embedding-progress', { corpusId, current: counts.embeddedChunks, total: counts.chunks, message: 'Preparing local semantic search model…' });
  await getExtractor();
  const selectBatch = db.prepare(`
    SELECT id, context_text FROM chunks
    WHERE corpus_id = ? AND (embedded_model IS NULL OR embedded_model != ?)
    ORDER BY id LIMIT ?
  `);
  const removeVector = db.prepare('DELETE FROM vec_chunks WHERE rowid = ?');
  const insertVector = db.prepare('INSERT INTO vec_chunks(rowid, corpus_id, embedding) VALUES (?, ?, ?)');
  const markEmbedded = db.prepare('UPDATE chunks SET embedded_model = ? WHERE id = ?');
  const persistBatch = db.transaction((rows, vectors) => {
    rows.forEach((row, index) => {
      removeVector.run(BigInt(row.id));
      insertVector.run(BigInt(row.id), corpusId, floatBuffer(vectors[index]));
      markEmbedded.run(EMBEDDING_MODEL_REF, row.id);
    });
  });

  while (!pausedCorpora.has(corpusId)) {
    const rows = selectBatch.all(corpusId, EMBEDDING_MODEL_REF, EMBEDDING_BATCH);
    if (!rows.length) break;
    const vectors = await embedTexts(rows.map((row) => row.context_text));
    persistBatch(rows, vectors);
    counts = corpusCounts(corpusId);
    postEvent('embedding-progress', {
      corpusId,
      current: counts.embeddedChunks,
      total: counts.chunks,
      message: `Prepared ${counts.embeddedChunks.toLocaleString()} of ${counts.chunks.toLocaleString()} semantic passages`,
    });
    await new Promise((resolve) => setImmediate(resolve));
  }

  if (pausedCorpora.has(corpusId)) {
    db.prepare("UPDATE corpora SET state='paused', semantic_ready=0, updated_at=? WHERE id=?").run(Date.now(), corpusId);
    postEvent('paused', { corpusId, counts: corpusCounts(corpusId) });
    return;
  }
  counts = corpusCounts(corpusId);
  db.prepare("UPDATE corpora SET state='ready', semantic_ready=1, updated_at=? WHERE id=?").run(Date.now(), corpusId);
  postEvent('semantic-ready', { corpusId, counts });
}

function rowToCandidate(row, score) {
  return {
    corpusId: row.corpus_id,
    conversationId: row.conversation_id,
    conversationTitle: row.conversation_title,
    messageId: row.message_id,
    chunkId: row.chunk_id,
    startChar: row.start_char,
    endChar: row.end_char,
    exactText: row.exact_text,
    sourceHash: row.source_hash,
    messageAt: row.message_at,
    score,
  };
}

function lexicalSearch(corpusId, query, limit) {
  const match = safeFtsQuery(query);
  if (!match) return [];
  try {
    return db.prepare(`
      SELECT c.*, bm25(chunks_fts, 1.0, 2.0) AS distance
      FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid
      WHERE chunks_fts MATCH ? AND c.corpus_id = ?
      ORDER BY distance ASC LIMIT ?
    `).all(match, corpusId, limit).map((row) => rowToCandidate(row, -Number(row.distance || 0)));
  } catch {
    return [];
  }
}

async function semanticSearch(corpusId, query, limit) {
  if (!vectorAvailable) return [];
  const status = db.prepare('SELECT semantic_ready FROM corpora WHERE id = ?').get(corpusId);
  if (!status?.semantic_ready) return [];
  const [embedding] = await embedTexts([query], { query: true });
  const neighbors = db.prepare(`
    SELECT rowid, distance FROM vec_chunks
    WHERE corpus_id = ? AND embedding MATCH ? AND k = ?
  `).all(corpusId, floatBuffer(embedding), limit);
  if (!neighbors.length) return [];
  const selectChunk = db.prepare('SELECT * FROM chunks WHERE id = ?');
  return neighbors.map((neighbor) => {
    const row = selectChunk.get(neighbor.rowid);
    return row ? rowToCandidate(row, 1 - Number(neighbor.distance || 0)) : null;
  }).filter(Boolean);
}

async function searchHistory({ corpusIds = [], queries = [], limit = 20 }) {
  const normalizedCorpusIds = [...new Set(corpusIds.map(String))];
  const normalizedQueries = queries.map((entry) => typeof entry === 'string' ? entry : entry?.text)
    .map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 4);
  const aggregate = new Map();
  let usedSemantic = false;
  const queryTrace = [];

  for (const query of normalizedQueries) {
    const lexical = [];
    const semantic = [];
    for (const corpusId of normalizedCorpusIds) {
      lexical.push(...lexicalSearch(corpusId, query, 60));
      const vectorRows = await semanticSearch(corpusId, query, 60);
      if (vectorRows.length) usedSemantic = true;
      semantic.push(...vectorRows);
    }
    const fused = reciprocalRankFuse(lexical, semantic);
    fused.forEach((candidate) => {
      const key = `${candidate.corpusId}:${candidate.chunkId}`;
      const current = aggregate.get(key) || { ...candidate, fusionScore: 0, matchedQueries: [] };
      current.fusionScore += candidate.fusionScore;
      current.matchedQueries.push(query);
      if (candidate.bm25Rank && (!current.bm25Rank || candidate.bm25Rank < current.bm25Rank)) {
        current.bm25Rank = candidate.bm25Rank;
        current.bm25Score = candidate.bm25Score;
      }
      if (candidate.semanticRank && (!current.semanticRank || candidate.semanticRank < current.semanticRank)) {
        current.semanticRank = candidate.semanticRank;
        current.semanticScore = candidate.semanticScore;
      }
      aggregate.set(key, current);
    });
    queryTrace.push({ query, lexicalCandidates: lexical.length, semanticCandidates: semantic.length });
  }

  const fused = [...aggregate.values()].sort((a, b) => b.fusionScore - a.fusionScore);
  const selected = diversifyCandidates(fused, { limit: Math.min(20, Math.max(1, limit)), lambda: 0.75, maxPerConversation: 3 });
  const selectedKeys = new Set(selected.map((candidate) => `${candidate.corpusId}:${candidate.chunkId}`));
  const excluded = fused.slice(0, 200).filter((candidate) => !selectedKeys.has(`${candidate.corpusId}:${candidate.chunkId}`))
    .map((candidate) => ({ ...candidate, exclusionReason: 'Lower fused relevance, duplicate context, or conversation diversity limit' }));
  return {
    mode: usedSemantic ? 'hybrid' : 'lexical-only',
    queries: normalizedQueries,
    queryTrace,
    selected,
    excluded,
    searchedCorpusIds: normalizedCorpusIds,
  };
}

function sourceContext({ corpusId, chunkId, sourceHash = null, before = 1, after = 1 }) {
  const chunk = db.prepare('SELECT * FROM chunks WHERE corpus_id = ? AND chunk_id = ?').get(corpusId, chunkId);
  if (!chunk) throw new Error('That archived passage is no longer in the local index.');
  if (sourceHash && chunk.source_hash !== sourceHash) {
    throw new Error('The live archive message changed after this retrieval receipt was created. Open the immutable receipt snapshot instead.');
  }
  const message = db.prepare('SELECT * FROM messages WHERE corpus_id = ? AND message_id = ?').get(corpusId, chunk.message_id);
  if (!message || message.exact_text.slice(chunk.start_char, chunk.end_char) !== chunk.exact_text) {
    throw new Error('Stylofact stopped because the archived quotation could not be verified exactly.');
  }
  const lower = Math.max(0, message.ordinal - Math.max(0, Math.min(3, before)));
  const upper = message.ordinal + Math.max(0, Math.min(3, after));
  const context = db.prepare(`
    SELECT message_id, ordinal, role, exact_text, source_hash, message_at
    FROM messages WHERE corpus_id = ? AND conversation_id = ? AND ordinal BETWEEN ? AND ?
    ORDER BY ordinal
  `).all(corpusId, message.conversation_id, lower, upper).map((row) => ({
    messageId: row.message_id,
    ordinal: row.ordinal,
    role: row.role,
    text: row.exact_text,
    sourceHash: row.source_hash,
    messageAt: row.message_at,
  }));
  return {
    locator: {
      corpusId,
      conversationId: chunk.conversation_id,
      messageId: chunk.message_id,
      chunkId: chunk.chunk_id,
      sourceHash: chunk.source_hash,
      startChar: chunk.start_char,
      endChar: chunk.end_char,
    },
    conversationTitle: chunk.conversation_title,
    messageAt: chunk.message_at,
    exactText: chunk.exact_text,
    context,
    verified: true,
  };
}

function setPaused({ corpusId, paused }) {
  if (paused) pausedCorpora.add(corpusId);
  else {
    pausedCorpora.delete(corpusId);
    startEmbedding(corpusId);
  }
  return { corpusId, paused: !!paused };
}

function sampleKnownAnswers({ corpusId, limit = 30 }) {
  const pool = db.prepare(`
    SELECT chunk_id, conversation_title, exact_text
    FROM chunks
    WHERE corpus_id = ? AND length(exact_text) BETWEEN 160 AND 1600
    ORDER BY source_hash
    LIMIT 600
  `).all(corpusId);
  if (!pool.length) return [];
  const stop = new Set(['about', 'after', 'again', 'because', 'before', 'could', 'every', 'first', 'from', 'have', 'into', 'just', 'more', 'other', 'really', 'should', 'some', 'than', 'that', 'their', 'there', 'these', 'they', 'this', 'those', 'through', 'very', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your']);
  const count = Math.min(Math.max(1, limit), pool.length);
  const stride = pool.length / count;
  return Array.from({ length: count }, (_, index) => pool[Math.floor(index * stride)]).map((row) => {
    const words = String(row.exact_text).match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || [];
    const chosen = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower.length < 5 || stop.has(lower) || chosen.some((entry) => entry.toLowerCase() === lower)) continue;
      chosen.push(word);
      if (chosen.length >= 8) break;
    }
    return {
      query: chosen.join(' '),
      expectedChunkId: row.chunk_id,
      conversationTitle: row.conversation_title,
      evidencePreview: row.exact_text.slice(0, 180),
    };
  }).filter((entry) => entry.query);
}

async function handle(command, payload) {
  if (command === 'indexArchive') return indexArchive(payload);
  if (command === 'indexDocuments') return indexDocuments(payload);
  if (command === 'searchHistory') return searchHistory(payload);
  if (command === 'sourceContext') return sourceContext(payload);
  if (command === 'setPaused') return setPaused(payload);
  if (command === 'sampleKnownAnswers') return sampleKnownAnswers(payload);
  if (command === 'status') return { vectorAvailable, vectorError, indexVersion: INDEX_VERSION, embeddingModel: EMBEDDING_MODEL_REF };
  if (command === 'close') {
    db.close();
    return { closed: true };
  }
  throw new Error(`Unknown Stylofact corpus worker command: ${command}`);
}

parentPort.on('message', async ({ requestId, command, payload }) => {
  try {
    reply(requestId, await handle(command, payload || {}));
  } catch (error) {
    reply(requestId, null, { message: error?.message || String(error), stack: error?.stack || null });
  }
});

postEvent('ready', { vectorAvailable, vectorError, indexVersion: INDEX_VERSION, embeddingModel: EMBEDDING_MODEL_REF });
