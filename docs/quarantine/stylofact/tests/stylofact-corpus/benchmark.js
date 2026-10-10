const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { LocalDataService } = require('../../electron/local-data-service');
const { StylofactCorpusService } = require('../../electron/stylofact-corpus');

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

(async () => {
  const archiveRoot = process.argv[2];
  if (!archiveRoot) throw new Error('Pass a Split or ChatGPT archive folder to benchmark.');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'briizos-stylofact-benchmark-'));
  const logger = { info() {}, warn() {}, error() {} };
  const local = new LocalDataService({ databasePath: path.join(tempRoot, 'briizos.db'), logger });
  local.initialize();
  const project = local.createStylofactProject({ title: 'Corpus benchmark' }).row;
  const navigator = new StylofactCorpusService({ service: local, userDataPath: tempRoot, logger, disableEmbeddings: true });
  try {
    await navigator.initialize();
    const importStarted = Date.now();
    const connected = await navigator.connectArchive(project.id, archiveRoot);
    const corpus = await navigator.refreshCorpus(connected.corpus.id);
    const importMs = Date.now() - importStarted;
    const knownAnswers = await navigator._call('sampleKnownAnswers', { corpusId: corpus.id, limit: 30 });
    assert.equal(knownAnswers.length, 30);
    const latencies = [];
    let recalled = 0;
    for (const known of knownAnswers) {
      const retrieval = (await navigator.beginRetrieval(project.id, known.query)).row;
      const started = Date.now();
      await navigator.searchHistory({
        projectId: project.id,
        retrievalRunId: retrieval.id,
        queries: [{ text: known.query, intent: 'fixed known-answer benchmark' }],
        limit: 20,
      });
      latencies.push(Date.now() - started);
      const receipt = navigator.getRetrievalReceipt(retrieval.id);
      if (receipt.candidates.some((candidate) => candidate.locator.chunkId === known.expectedChunkId && candidate.finalRank <= 20)) recalled += 1;
      await navigator.completeRetrieval(retrieval.id, { status: 'completed' });
    }
    const report = {
      archive: path.resolve(archiveRoot),
      conversations: corpus.conversationCount,
      userMessages: corpus.userMessageCount,
      assistantContextMessages: corpus.contextMessageCount,
      chunks: corpus.chunkCount,
      lexicalImportSeconds: Number((importMs / 1000).toFixed(2)),
      knownAnswerQueries: knownAnswers.length,
      recallAt20: recalled / knownAnswers.length,
      warmSearchP50Ms: percentile(latencies.slice(1), 0.5),
      warmSearchP95Ms: percentile(latencies.slice(1), 0.95),
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    assert.ok(report.recallAt20 >= 0.9, `Recall@20 ${report.recallAt20} was below 0.90`);
    assert.ok(report.warmSearchP95Ms < 1000, `Warm search p95 ${report.warmSearchP95Ms}ms exceeded 1000ms`);
  } finally {
    await navigator.close();
    local.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
