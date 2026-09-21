/**
 * Memory and long-context summarization for the in-process agent.
 *
 * Source parity:
 *   - agent/src/agents/middlewares/memory_middleware.py
 *   - agent/src/agents/memory/queue.py
 *   - agent/src/agents/memory/updater.py
 *   - agent/src/agents/memory/prompt.py
 *   - agent/src/config/summarization_config.py
 */

const crypto = require('crypto');
const { SystemMessage } = require('@langchain/core/messages');
const { logger } = require('../logger');
const { createChatModel, getRoutingModel } = require('./models');

const UPLOAD_BLOCK_RE = /<uploaded_files>[\s\S]*?<\/uploaded_files>\n*/gi;
const UPLOAD_SENTENCE_RE = /[^.!?]*\b(?:upload(?:ed|ing)?(?:\s+\w+){0,3}\s+(?:file|files?|document|documents?|attachment|attachments?)|file\s+upload|\/mnt\/user-data\/uploads\/|<uploaded_files>)[^.!?]*[.!?]?\s*/gi;
let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

const MEMORY_UPDATE_PROMPT = `You are a memory management system. Analyze the conversation and update the user's memory profile.

Current Memory State:
<current_memory>
{current_memory}
</current_memory>

New Conversation to Process:
<conversation>
{conversation}
</conversation>

Update these sections when useful:
- user.workContext: professional role, active projects, technologies
- user.personalContext: communication preferences, stable interests, personal context
- user.topOfMind: current priorities and active focus areas
- history.recentMonths: recent activities and explored topics
- history.earlierContext: older but still useful patterns
- history.longTermBackground: stable background context

Extract specific facts with category preference|knowledge|context|behavior|goal and confidence 0.0-1.0.
Only store useful, durable information. Do not record ephemeral file upload events or /mnt/user-data/uploads paths.

Return ONLY valid JSON:
{
  "user": {
    "workContext": { "summary": "...", "shouldUpdate": true },
    "personalContext": { "summary": "...", "shouldUpdate": false },
    "topOfMind": { "summary": "...", "shouldUpdate": true }
  },
  "history": {
    "recentMonths": { "summary": "...", "shouldUpdate": true },
    "earlierContext": { "summary": "...", "shouldUpdate": false },
    "longTermBackground": { "summary": "...", "shouldUpdate": false }
  },
  "newFacts": [
    { "content": "...", "category": "preference", "confidence": 0.9 }
  ],
  "factsToRemove": ["fact_id"]
}`;

function getConfig() {
  const local = localDataService?.getSetting?.('agent_config')?.value || {};
  return {
    memory: {
      enabled: true,
      injection_enabled: true,
      max_injection_tokens: 2000,
      fact_confidence_threshold: 0.7,
      max_facts: 100,
      debounce_seconds: 30,
      ...(local.memory || {}),
    },
    summarization: { enabled: false },
  };
}

function createEmptyMemory() {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    lastUpdated: now,
    user: {
      workContext: { summary: '', updatedAt: '' },
      personalContext: { summary: '', updatedAt: '' },
      topOfMind: { summary: '', updatedAt: '' },
    },
    history: {
      recentMonths: { summary: '', updatedAt: '' },
      earlierContext: { summary: '', updatedAt: '' },
      longTermBackground: { summary: '', updatedAt: '' },
    },
    facts: [],
  };
}

function loadMemory(agentName = null) {
  return localDataService?.getMemoryProfile(agentName) || createEmptyMemory();
}

function saveMemory(memoryData, agentName = null) {
  const next = { ...memoryData, lastUpdated: new Date().toISOString() };
  if (!localDataService) throw new Error('Local data is not ready for memory persistence');
  return localDataService.saveMemoryProfile(next, agentName).row;
}

function messageRole(message) {
  if (!message) return 'unknown';
  if (typeof message._getType === 'function') return message._getType();
  if (typeof message.getType === 'function') return message.getType();
  return message.type || message.role || 'unknown';
}

function messageContent(message) {
  const content = message?.content ?? '';
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') return part;
      if (part?.type === 'text') return part.text || '';
      return part?.text || '';
    }).filter(Boolean).join(' ');
  }
  return String(content);
}

function hasToolCalls(message) {
  return Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;
}

function filterMessagesForMemory(messages = []) {
  const filtered = [];
  let skipNextAi = false;

  for (const msg of messages) {
    const role = messageRole(msg);
    if (role === 'human') {
      const stripped = messageContent(msg).replace(UPLOAD_BLOCK_RE, '').trim();
      if (!stripped) {
        skipNextAi = true;
        continue;
      }
      filtered.push({ role: 'human', content: stripped });
      skipNextAi = false;
    } else if (role === 'ai' && !hasToolCalls(msg)) {
      if (skipNextAi) {
        skipNextAi = false;
        continue;
      }
      filtered.push({ role: 'ai', content: messageContent(msg) });
    }
  }

  return filtered;
}

function formatConversationForUpdate(messages = []) {
  return messages.map((msg) => {
    const content = String(msg.content || '').slice(0, 1000);
    return msg.role === 'human' ? `User: ${content}` : `Assistant: ${content}`;
  }).join('\n\n');
}

function stripUploadMentions(memoryData) {
  for (const section of ['user', 'history']) {
    for (const value of Object.values(memoryData[section] || {})) {
      if (value && typeof value.summary === 'string') {
        value.summary = value.summary.replace(UPLOAD_SENTENCE_RE, '').replace(/  +/g, ' ').trim();
      }
    }
  }
  memoryData.facts = (memoryData.facts || []).filter((fact) => {
    UPLOAD_SENTENCE_RE.lastIndex = 0;
    return !UPLOAD_SENTENCE_RE.test(fact.content || '');
  });
  return memoryData;
}

function parseJsonResponse(text) {
  // LLM response.content may be an array of content blocks when using the Responses API.
  const normalized = Array.isArray(text)
    ? text.map((p) => (typeof p === 'string' ? p : p?.text || '')).filter(Boolean).join('')
    : text;
  let clean = String(normalized || '').trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }
  return JSON.parse(clean);
}

function applyMemoryUpdates(currentMemory, updateData, threadId, config = getConfig()) {
  const next = JSON.parse(JSON.stringify(currentMemory || createEmptyMemory()));
  const now = new Date().toISOString();
  next.user ||= createEmptyMemory().user;
  next.history ||= createEmptyMemory().history;
  next.facts ||= [];

  for (const section of ['workContext', 'personalContext', 'topOfMind']) {
    const update = updateData?.user?.[section];
    if (update?.shouldUpdate && update.summary) next.user[section] = { summary: update.summary, updatedAt: now };
  }

  for (const section of ['recentMonths', 'earlierContext', 'longTermBackground']) {
    const update = updateData?.history?.[section];
    if (update?.shouldUpdate && update.summary) next.history[section] = { summary: update.summary, updatedAt: now };
  }

  const removeIds = new Set(updateData?.factsToRemove || []);
  if (removeIds.size > 0) next.facts = next.facts.filter((fact) => !removeIds.has(fact.id));

  const threshold = config?.memory?.fact_confidence_threshold ?? 0.7;
  for (const fact of updateData?.newFacts || []) {
    const confidence = Number(fact.confidence ?? 0.5);
    if (!fact.content || confidence < threshold) continue;
    next.facts.push({
      id: `fact_${crypto.randomBytes(4).toString('hex')}`,
      content: fact.content,
      category: fact.category || 'context',
      confidence,
      createdAt: now,
      source: threadId || 'unknown',
    });
  }

  const maxFacts = config?.memory?.max_facts ?? 100;
  if (next.facts.length > maxFacts) {
    next.facts = next.facts.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, maxFacts);
  }

  return stripUploadMentions(next);
}

async function updateMemoryFromConversation({ messages, threadId, agentName = null, modelName = null }) {
  const config = getConfig();
  if (config?.memory?.enabled === false) return false;
  const filtered = filterMessagesForMemory(messages);
  if (!filtered.some((msg) => msg.role === 'human') || !filtered.some((msg) => msg.role === 'ai')) return false;

  const currentMemory = loadMemory(agentName);
  const prompt = MEMORY_UPDATE_PROMPT
    .replace('{current_memory}', JSON.stringify(currentMemory, null, 2))
    .replace('{conversation}', formatConversationForUpdate(filtered));
  const model = createChatModel({ name: modelName || config?.memory?.model_name || getRoutingModel('background'), thinkingEnabled: false });
  const response = await model.invoke(prompt);
  const updateData = parseJsonResponse(response.content);
  const updated = applyMemoryUpdates(currentMemory, updateData, threadId, config);
  saveMemory(updated, agentName);
  return true;
}

const memoryQueue = {
  pending: new Map(),
  timer: null,
  processing: false,
};

function queueMemoryUpdate(item) {
  const config = getConfig();
  if (config?.memory?.enabled === false) return;
  if (!item?.threadId) return;
  memoryQueue.pending.set(item.threadId, item);
  if (memoryQueue.timer) clearTimeout(memoryQueue.timer);
  const delayMs = Math.max(0, Number(config?.memory?.debounce_seconds ?? 30)) * 1000;
  memoryQueue.timer = setTimeout(() => {
    flushMemoryQueue().catch((err) => logger.warn('agent.memory', 'Memory queue flush failed', { error: err?.message }));
  }, delayMs);
  if (typeof memoryQueue.timer.unref === 'function') memoryQueue.timer.unref();
}

async function flushMemoryQueue() {
  if (memoryQueue.processing) return;
  memoryQueue.processing = true;
  if (memoryQueue.timer) clearTimeout(memoryQueue.timer);
  memoryQueue.timer = null;
  const items = [...memoryQueue.pending.values()];
  memoryQueue.pending.clear();

  try {
    for (const item of items) {
      try {
        await updateMemoryFromConversation(item);
        logger.info('agent.memory', 'Memory updated', { threadId: item.threadId });
      } catch (err) {
        logger.warn('agent.memory', 'Memory update skipped', { threadId: item.threadId, error: err?.message });
      }
    }
  } finally {
    memoryQueue.processing = false;
  }
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function totalMessageTokens(messages = []) {
  return messages.reduce((sum, msg) => sum + estimateTokens(messageContent(msg)), 0);
}

function summarizationConfig() {
  return getConfig()?.summarization || {};
}

function shouldSummarize(messages = [], config = summarizationConfig()) {
  if (config.enabled === false) return false;
  const triggers = Array.isArray(config.trigger) ? config.trigger : (config.trigger ? [config.trigger] : []);
  if (triggers.length === 0) return false;
  const tokenCount = totalMessageTokens(messages);
  for (const trigger of triggers) {
    if (trigger.type === 'messages' && messages.length >= Number(trigger.value)) return true;
    if (trigger.type === 'tokens' && tokenCount >= Number(trigger.value)) return true;
    if (trigger.type === 'fraction' && tokenCount >= 128000 * Number(trigger.value)) return true;
  }
  return false;
}

function keepRecentMessages(messages = [], keep = {}) {
  if (keep.type === 'tokens') {
    const out = [];
    let tokens = 0;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msgTokens = estimateTokens(messageContent(messages[i]));
      if (tokens + msgTokens > Number(keep.value || 3000)) break;
      tokens += msgTokens;
      out.unshift(messages[i]);
    }
    return out;
  }
  const count = Number(keep.value || 10);
  return messages.slice(Math.max(0, messages.length - count));
}

function summaryCacheKey(messages = []) {
  const text = messages.map((msg) => `${messageRole(msg)}:${messageContent(msg)}`).join('\n');
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function summarizeMessages(messages, { threadId, modelName = null } = {}) {
  const config = summarizationConfig();
  const contentHash = summaryCacheKey(messages);
  const cached = threadId && localDataService?.getConversationSummary(threadId, contentHash);
  if (cached) return cached.summary;

  const text = messages.map((msg) => `${messageRole(msg)}: ${messageContent(msg).slice(0, 2000)}`).join('\n\n');
  const prompt = config.summary_prompt || `Summarize this conversation history for an assistant that will continue the same task. Preserve user goals, decisions, constraints, file paths, tool results, open questions, and unresolved work. Be concise but specific.\n\n<conversation>\n${text}\n</conversation>`;
  const model = createChatModel({ name: config.model_name || modelName || getRoutingModel('background'), thinkingEnabled: false });
  const response = await model.invoke(prompt);
  const summary = String(response.content || '').trim();

  if (threadId && localDataService) {
    localDataService.saveConversationSummary({
      threadId,
      firstSequence: 0,
      lastSequence: Math.max(0, messages.length - 1),
      contentHash,
      summary,
    });
  }
  return summary;
}

function createSummarizationPreModelHook({ modelName = null } = {}) {
  return async (state, config) => {
    const messages = state?.messages || [];
    const sumConfig = summarizationConfig();
    if (!shouldSummarize(messages, sumConfig)) return {};

    const keep = sumConfig.keep || { type: 'messages', value: 10 };
    const recent = keepRecentMessages(messages, keep);
    const older = messages.slice(0, Math.max(0, messages.length - recent.length));
    if (older.length === 0) return {};

    try {
      const summary = await summarizeMessages(older, {
        threadId: config?.configurable?.thread_id,
        modelName,
      });
      return {
        llmInputMessages: [
          new SystemMessage(`Conversation summary so far:\n${summary}`),
          ...recent,
        ],
      };
    } catch (err) {
      logger.warn('agent.summary', 'Summarization failed; using full context', { error: err?.message });
      return {};
    }
  };
}

function createMemoryPostModelHook({ modelName = null, agentName = null } = {}) {
  return async (state, config) => {
    if (config?.configurable?.disable_memory_update) return {};
    const messages = state?.messages || [];
    const last = messages[messages.length - 1];
    if (messageRole(last) !== 'ai' || hasToolCalls(last)) return {};
    queueMemoryUpdate({
      threadId: config?.configurable?.thread_id,
      messages,
      agentName,
      modelName,
    });
    return {};
  };
}

module.exports = {
  createMemoryPostModelHook,
  createSummarizationPreModelHook,
  filterMessagesForMemory,
  formatConversationForUpdate,
  updateMemoryFromConversation,
  flushMemoryQueue,
  applyMemoryUpdates,
  shouldSummarize,
  setLocalDataService,
};
