const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { LocalDataService } = require('../../electron/local-data-service');
const { StylofactCorpusService } = require('../../electron/stylofact-corpus');

const MODEL_ID = 'mixedbread-ai/mxbai-embed-xsmall-v1';
const MODEL_REVISION = 'e6ac24e5d6efb8782b59de1647b3ececb4ece94e';

async function loadExtractor(transformers, cacheDir) {
  transformers.env.cacheDir = cacheDir;
  return transformers.pipeline('feature-extraction', MODEL_ID, {
    dtype: 'q8',
    revision: MODEL_REVISION,
  });
}

function conversationFixture() {
  return {
    id: 'semantic-conversation',
    title: 'Music and emotional practice',
    current_node: 'assistant-1',
    mapping: {
      root: { id: 'root', parent: null, children: ['user-1'], message: null },
      'user-1': {
        id: 'user-1', parent: 'root', children: ['assistant-1'],
        message: { id: 'user-message-1', author: { role: 'user' }, content: { content_type: 'text', parts: ['I use modal harmony as a practical language for emotional self-help.'] } },
      },
      'assistant-1': {
        id: 'assistant-1', parent: 'user-1', children: [],
        message: { id: 'assistant-message-1', author: { role: 'assistant' }, content: { content_type: 'text', parts: ['AI context only.'] } },
      },
    },
  };
}

(async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'briizos-stylofact-model-'));
  const cacheDir = path.join(tempRoot, 'stylofact-models');
  fs.mkdirSync(cacheDir);
  let navigator = null;
  let local = null;
  try {
    const transformers = await import('@huggingface/transformers');
    transformers.env.allowRemoteModels = true;
    let extractor = await loadExtractor(transformers, cacheDir);
    const output = await extractor([
      'A local semantic search smoke test.',
      'A second passage verifies batched indexing output.',
    ], { pooling: 'mean', normalize: true });
    assert.equal(output.dims[0], 2);
    assert.equal(output.dims.at(-1), 384);
    const magnitude = Math.sqrt([...output.data.slice(0, 384)].reduce((sum, value) => sum + (value * value), 0));
    assert.ok(Math.abs(magnitude - 1) < 0.01);
    await extractor.dispose?.();
    extractor = null;

    transformers.env.allowRemoteModels = false;
    const offlineExtractor = await loadExtractor(transformers, cacheDir);
    const offline = await offlineExtractor('The cached model must work without network access.', { pooling: 'mean', normalize: true });
    assert.equal(offline.dims.at(-1), 384);
    await offlineExtractor.dispose?.();

    const archiveRoot = path.join(tempRoot, 'archive');
    fs.mkdirSync(archiveRoot);
    fs.writeFileSync(path.join(archiveRoot, 'conversations.json'), JSON.stringify([conversationFixture()]));
    const logger = { info() {}, warn() {}, error() {} };
    local = new LocalDataService({ databasePath: path.join(tempRoot, 'briizos.db'), logger });
    local.initialize();
    const project = local.createStylofactProject({ title: 'Semantic worker test' }).row;
    navigator = new StylofactCorpusService({ service: local, userDataPath: tempRoot, logger });
    await navigator.initialize();
    const connected = await navigator.connectArchive(project.id, archiveRoot);
    await navigator.refreshCorpus(connected.corpus.id);
    let corpus = navigator.getCorpusStatus(connected.corpus.id);
    const deadline = Date.now() + 30000;
    while (corpus.state !== 'ready' && Date.now() < deadline) {
      if (corpus.error) throw new Error(corpus.error);
      await new Promise((resolve) => setTimeout(resolve, 100));
      corpus = navigator.getCorpusStatus(corpus.id);
    }
    assert.equal(corpus.state, 'ready');
    assert.equal(corpus.embeddedChunkCount, 1);
    assert.ok(corpus.embeddingModelChecksum);
    const retrieval = (await navigator.beginRetrieval(project.id, 'using musical modes to help emotions')).row;
    const semanticSearch = await navigator.searchHistory({
      projectId: project.id,
      retrievalRunId: retrieval.id,
      queries: [{ text: 'using musical modes to help emotions' }],
    });
    assert.equal(semanticSearch.mode, 'hybrid');
    assert.equal(semanticSearch.results[0].role, 'user');
    process.stdout.write('Stylofact semantic model and integrated hybrid worker passed online and from offline cache\n');
  } finally {
    await navigator?.close();
    local?.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
})().then(() => process.exit(0)).catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
