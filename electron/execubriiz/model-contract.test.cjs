const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatOpenAI } = require('@langchain/openai');
const { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } = require('@langchain/core/messages');
const { journalContract, bindJournalModel, parseToolArguments } = require('./model-contract');
const empty = () => ({ summary: null, answer: null, operations: [], reactions: [], researchQuestion: null });

function strictObjects(schema) {
  if (!schema || typeof schema !== 'object') return;
  if (schema.type === 'object') {
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
  }
  Object.values(schema).forEach((value) => {
    if (Array.isArray(value)) value.forEach(strictObjects);
    else if (value && typeof value === 'object') strictObjects(value);
  });
}

test('installed OpenAI adapter emits strict functions in both endpoint envelopes', () => {
  for (const useResponsesApi of [false, true]) {
    const model = new ChatOpenAI({ model: 'gpt-4.1', apiKey: 'offline-test', useResponsesApi });
    const bound = bindJournalModel(model, journalContract('openai'));
    const params = bound.invocationParams({});
    if (useResponsesApi) {
      assert.equal(params.tool_choice.type, 'allowed_tools');
      assert.equal(params.tool_choice.mode, 'required');
      assert.equal(params.tool_choice.tools.length, 4);
    } else assert.equal(params.tool_choice, 'required');
    assert.equal(params.parallel_tool_calls, false);
    for (const tool of params.tools) {
      const fn = useResponsesApi ? tool : tool.function;
      assert.equal(fn.strict, true);
      strictObjects(fn.parameters);
    }
  }
});

test('installed Claude adapter emits strict input_schema with compatible auto choice', () => {
  const model = new ChatAnthropic({ model: 'claude-sonnet-4-6', apiKey: 'offline-test' });
  const params = model.invocationParams(bindJournalModel(model, journalContract('claude')).config);
  assert.equal(params.tool_choice.type, 'auto');
  assert.equal(params.tool_choice.disable_parallel_tool_use, true);
  params.tools.forEach((tool) => { assert.equal(tool.strict, true); strictObjects(tool.input_schema); });
});

test('Gemini request carries declarations, nullable types, tool results and thought signature', () => {
  const model = new ChatGoogleGenerativeAI({ model: 'gemini-3.5-flash', apiKey: 'offline-test' });
  const bound = bindJournalModel(model, journalContract('gemini'));
  const request = model._buildGenerateContentRequest([
    new HumanMessage('Read the entry.'),
    new AIMessage({ content: '', tool_calls: [{ name: 'read_entry', id: 'read-1', args: { id: 'entry', start: null, length: null } }], additional_kwargs: { __gemini_function_call_thought_signatures__: { 'read-1': 'signature-from-provider' } } }),
    new ToolMessage({ name: 'read_entry', tool_call_id: 'read-1', content: JSON.stringify({ text: 'A complete entry.', eof: true, nextStart: null }) }),
  ], bound.config);
  assert.equal(request.toolConfig.functionCallingConfig.mode, 'ANY');
  assert.equal(request.toolConfig.functionCallingConfig.allowedFunctionNames.length, 4);
  const schema = request.tools[0].functionDeclarations[0].parameters;
  assert.equal(schema.properties.summary.nullable, true);
  assert.equal(schema.properties.summary.type, 'string');
  assert.equal(JSON.stringify(schema).includes('additionalProperties'), false);
  const parts = request.contents.flatMap((content) => content.parts);
  assert.equal(parts.find((part) => part.functionCall).thoughtSignature, 'signature-from-provider');
  assert.equal(parts.find((part) => part.functionResponse).functionResponse.name, 'read_entry');
});

test('local validation rejects empty objects, unknown fields, bad reads, and incomplete edits', () => {
  assert.throws(() => parseToolArguments('finish_journal_work', {}), /operations/);
  assert.throws(() => parseToolArguments('finish_journal_work', { ...empty(), surprise: true }), /Unrecognized/);
  assert.throws(() => parseToolArguments('read_entry', { id: 'e', start: -1, length: null }), /start/);
  assert.throws(() => parseToolArguments('finish_journal_work', empty(), 'summary'), /summary/);
  const schema = journalContract('openai').tools[0].function.parameters;
  const fields = schema.properties.operations.items.properties;
  const op = Object.fromEntries(Object.keys(fields).map((key) => [key, null]));
  assert.throws(() => parseToolArguments('finish_journal_work', { ...empty(), operations: [{ ...op, kind: 'edit', targetId: 'b' }] }), /text/);
  assert.deepEqual(parseToolArguments('finish_journal_work', empty(), 'live'), empty());
  assert.throws(() => journalContract('codex'), /function-calling/);
  assert.throws(() => bindJournalModel({ profile: { toolCalling: false }, bindTools() {} }, journalContract('gemini')), /does not support/);
});

test('journal loop returns validation feedback and named retrieval results before accepting completion', async () => {
  const models = require('../agent/models');
  const originals = { ...models };
  const transcript = [];
  const replies = [
    new AIMessageChunk({ content: '', tool_calls: [{ name: 'read_entry', id: 'read-1', args: { id: 'e', start: null, length: null } }] }),
    new AIMessageChunk({ content: '', tool_calls: [{ name: 'finish_journal_work', id: 'bad-result', args: {} }] }),
    new AIMessageChunk({ content: '', tool_calls: [{ name: 'finish_journal_work', id: 'done', args: empty() }] }),
  ];
  models.resolveChatModelRequest = () => ({ provider: 'gemini', profileName: 'test', model: 'test' });
  models.getRoutingModel = () => 'test';
  models.createChatModel = () => ({ bindTools: () => ({ async *stream(messages) { transcript.push([...messages]); yield replies.shift(); } }) });
  const runtimePath = require.resolve('./runtime');
  delete require.cache[runtimePath];
  try {
    const { ExecRuntime } = require('./runtime');
    const job = { kind: 'live', journal_id: 'j' };
    const runtime = {
      active: new Map([['job', { job }]]),
      store: { read: () => ({ prefs: {} }), entries: () => [{ id: 'e', text: 'Entry text', privacy: 'open' }] },
      context: () => ({ input: {}, maxInputChars: 100000 }),
      logger: { info() {}, warn() {} },
    };
    const result = await ExecRuntime.prototype.compose.call(runtime, 'job');
    assert.equal(result.usage.calls, 3);
    const read = transcript[1].find((m) => m.type === 'tool');
    assert.equal(read.name, 'read_entry');
    assert.equal(JSON.parse(read.content).eof, true);
    assert.equal(JSON.parse(read.content).nextStart, null);
    const correction = transcript[2].find((m) => m.type === 'tool' && m.tool_call_id === 'bad-result');
    assert.equal(correction.status, 'error');
    assert.match(correction.content, /operations/);
  } finally {
    Object.assign(models, originals);
    delete require.cache[runtimePath];
  }
});
