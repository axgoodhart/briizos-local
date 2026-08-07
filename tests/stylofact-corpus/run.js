const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');
const { LocalDataService } = require('../../electron/local-data-service');
const { StylofactCorpusService } = require('../../electron/stylofact-corpus');
const { chunkMessage, extractConversation, getMessagesInOrder } = require('../../electron/stylofact-corpus/parser');
const { diversifyCandidates, reciprocalRankFuse, safeFtsQuery } = require('../../electron/stylofact-corpus/retrieval');

function conversationFixture(userText = 'I keep returning to modal harmony as a practical language for emotional self-help.') {
  return {
    id: 'conversation-1',
    conversation_id: 'conversation-1',
    title: 'Music theory and self-help',
    create_time: 1700000000,
    current_node: 'assistant-current',
    mapping: {
      root: { id: 'root', parent: null, children: ['user-abandoned', 'user-current'], message: null },
      'user-abandoned': {
        id: 'user-abandoned', parent: 'root', children: ['assistant-abandoned'],
        message: { id: 'message-abandoned', author: { role: 'user' }, create_time: 1690000000, content: { content_type: 'text', parts: ['This abandoned branch must not be evidence.'] } },
      },
      'assistant-abandoned': {
        id: 'assistant-abandoned', parent: 'user-abandoned', children: [],
        message: { id: 'assistant-message-abandoned', author: { role: 'assistant' }, content: { content_type: 'text', parts: ['Old AI branch'] } },
      },
      'user-current': {
        id: 'user-current', parent: 'root', children: ['assistant-current'],
        message: { id: 'message-current', author: { role: 'user' }, create_time: 1700000100, content: { content_type: 'text', parts: [userText] } },
      },
      'assistant-current': {
        id: 'assistant-current', parent: 'user-current', children: [],
        message: { id: 'assistant-message-current', author: { role: 'assistant' }, create_time: 1700000200, content: { content_type: 'text', parts: ['AI context: perhaps connect modes to moods.'] } },
      },
    },
  };
}

function testPureFunctions() {
  const fixture = conversationFixture();
  const active = getMessagesInOrder(fixture);
  assert.deepEqual(active.map((node) => node.message.id), ['message-current', 'assistant-message-current']);
  const extracted = extractConversation(fixture, 'conversations.json');
  assert.equal(extracted.messages.filter((message) => message.role === 'user').length, 1);
  assert.equal(extracted.chunks.length, 1);
  assert.ok(extracted.chunks[0].contextText.includes('AI context'));
  assert.equal(extracted.chunks[0].exactText.includes('AI context'), false);

  const longText = `🪶 ${'A carefully preserved sentence. '.repeat(240)}\n\n${'A second exact paragraph. '.repeat(240)}`;
  const chunks = chunkMessage(longText);
  assert.ok(chunks.length > 1);
  chunks.forEach((chunk) => assert.equal(longText.slice(chunk.startChar, chunk.endChar), chunk.text));

  const lexical = [{ corpusId: 'c', chunkId: 'a', conversationId: 'one', exactText: 'music theory', score: 5 }];
  const semantic = [
    { corpusId: 'c', chunkId: 'b', conversationId: 'two', exactText: 'modal harmony', score: 0.9 },
    { corpusId: 'c', chunkId: 'a', conversationId: 'one', exactText: 'music theory', score: 0.8 },
  ];
  const fused = reciprocalRankFuse(lexical, semantic);
  assert.equal(fused[0].chunkId, 'a');
  assert.equal(diversifyCandidates(fused, { limit: 2 }).length, 2);
  assert.equal(safeFtsQuery('music theory?'), '"music" OR "theory"');
}

function testSqliteVecLoads() {
  const db = new Database(':memory:');
  sqliteVec.load(db);
  assert.match(db.prepare('SELECT vec_version() AS version').get().version, /^v?0\.1\./);
  db.exec('CREATE VIRTUAL TABLE vectors USING vec0(corpus_id TEXT PARTITION KEY, embedding FLOAT[3])');
  db.prepare('INSERT INTO vectors(rowid, corpus_id, embedding) VALUES (?, ?, ?)')
    .run(1n, 'one', Buffer.from(Float32Array.from([1, 0, 0]).buffer));
  const nearest = db.prepare('SELECT rowid FROM vectors WHERE corpus_id = ? AND embedding MATCH ? AND k = 1')
    .get('one', Buffer.from(Float32Array.from([1, 0, 0]).buffer));
  assert.equal(nearest.rowid, 1);
  db.close();
}

async function testIntegratedLexicalNavigator() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'briizos-stylofact-test-'));
  const archiveRoot = path.join(tempRoot, 'archive');
  fs.mkdirSync(archiveRoot);
  const archiveFile = path.join(archiveRoot, 'conversations.json');
  fs.writeFileSync(archiveFile, JSON.stringify([null, { id: 'malformed-without-mapping' }, conversationFixture()]));

  const logger = { info() {}, warn() {}, error() {} };
  const local = new LocalDataService({ databasePath: path.join(tempRoot, 'briizos.db'), logger });
  local.initialize();
  const project = local.createStylofactProject({ title: 'Corpus integration test' }).row;
  const navigator = new StylofactCorpusService({ service: local, userDataPath: tempRoot, logger, disableEmbeddings: true });

  try {
    await navigator.initialize();
    const workerStatus = await navigator.status();
    assert.equal(workerStatus.isolatedProcess, true);
    assert.notEqual(workerStatus.processId, process.pid);
    const connected = await navigator.connectArchive(project.id, archiveRoot);
    const corpusId = connected.corpus.id;
    const status = await navigator.refreshCorpus(corpusId);
    assert.equal(status.conversationCount, 1);
    assert.equal(status.userMessageCount, 1);
    assert.equal(status.contextMessageCount, 1);
    assert.equal(status.state, 'lexical-ready');

    // An incremental startup scan retains the completed keyword cache. Retrieval
    // must continue to use it instead of reporting that no archive is connected.
    local.updateStylofactCorpusStatus(corpusId, { state: 'scanning' });
    const scanningRetrieval = (await navigator.beginRetrieval(project.id, 'music theory while the archive is refreshing')).row;
    const scanningSearch = await navigator.searchHistory({
      projectId: project.id,
      retrievalRunId: scanningRetrieval.id,
      queries: [{ text: 'music theory' }],
    });
    assert.ok(scanningSearch.results.length >= 1);
    local.updateStylofactCorpusStatus(corpusId, { state: 'lexical-ready' });

    const retrieval = (await navigator.beginRetrieval(project.id, 'Find my idea connecting music theory with self-help.')).row;
    const search = await navigator.searchHistory({
      projectId: project.id,
      retrievalRunId: retrieval.id,
      queries: [{ text: 'music theory self-help', intent: 'literal and thematic match' }],
    });
    assert.equal(search.mode, 'lexical-only');
    assert.ok(search.results.length >= 1);
    assert.equal(search.results[0].role, 'user');
    assert.equal(search.results.some((result) => result.excerpt.includes('AI context')), false);

    const fetched = await navigator.fetchContext({
      projectId: project.id,
      retrievalRunId: retrieval.id,
      resultIds: [search.results[0].resultId],
    });
    assert.equal(fetched.verifiedPassages.length, 1);
    assert.equal(fetched.verifiedPassages[0].verified, true);
    assert.deepEqual(fetched.verifiedPassages[0].context.map((message) => message.role), ['user', 'assistant']);
    assert.equal(fetched.verifiedPassages[0].exactText, conversationFixture().mapping['user-current'].message.content.parts[0]);

    await navigator.completeRetrieval(retrieval.id, { status: 'completed', agentThreadId: 'thread-1', agentTurnId: 'turn-1' });
    const receipt = navigator.getRetrievalReceipt(retrieval.id);
    assert.equal(receipt.run.agentThreadId, 'thread-1');
    assert.equal(receipt.run.packedContext.length, 1);
    assert.equal(receipt.candidates.filter((candidate) => candidate.selected).length, 1);

    const source = await navigator.getSourceContext(receipt.candidates.find((candidate) => candidate.selected).locator);
    assert.equal(source.verified, true);
    assert.equal(source.context.find((message) => message.role === 'assistant').text.startsWith('AI context:'), true);

    const changedText = 'A newly indexed exact phrase about polyrhythm journaling and creative recovery.';
    fs.writeFileSync(archiveFile, JSON.stringify([conversationFixture(changedText)]));
    const changed = await navigator.refreshCorpus(corpusId);
    assert.equal(changed.userMessageCount, 1);
    const changedRetrieval = (await navigator.beginRetrieval(project.id, 'polyrhythm journaling creative recovery')).row;
    const changedSearch = await navigator.searchHistory({
      projectId: project.id,
      retrievalRunId: changedRetrieval.id,
      queries: [{ text: 'polyrhythm journaling creative recovery' }],
    });
    assert.ok(changedSearch.results.some((result) => result.excerpt.includes(changedText)));

    fs.renameSync(archiveRoot, `${archiveRoot}-moved`);
    const stale = await navigator.refreshCorpus(corpusId);
    assert.equal(stale.state, 'stale');
    const cached = await navigator.getSourceContext(receipt.candidates.find((candidate) => candidate.selected).locator);
    assert.equal(cached.exactText, source.exactText);
  } finally {
    await navigator.close();
    local.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

(async () => {
  testPureFunctions();
  testSqliteVecLoads();
  await testIntegratedLexicalNavigator();
  process.stdout.write('Stylofact corpus tests passed\n');
  process.exit(0);
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
