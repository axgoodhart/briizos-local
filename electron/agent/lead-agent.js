/**
 * In-process lead_agent.
 *
 * Replaces agent/src/agents/lead_agent/agent.py:make_lead_agent. The
 * full middleware stack ports in iteratively — this pass establishes
 * the running graph + streaming with the tool surface and the
 * model factory in place. The renderer policy gate (useToolBridge →
 * ToolContext.executeTool) owns destructive-operation confirmation while
 * graph interrupt/clarification parity ports in.
 *
 * Streaming maps LangChain.js internal events onto the same SSE event
 * vocabulary the renderer (useChat.handleStreamEvent) already consumes
 * — text / tool_call_start / tool_result / thread_title / values /
 * end / error — so the renderer needs no further changes.
 */

const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { Command } = require('@langchain/langgraph');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { logger } = require('../logger');
const { ALL_TOOLS } = require('./tools');
const { ThreadState } = require('./state');
const { createChatModel } = require('./models');
const { applyPromptTemplate } = require('./system-prompt');
const { getCheckpointer } = require('./checkpointer');
const { createMemoryPostModelHook, createSummarizationPreModelHook } = require('./memory');
const { createTitlePostModelHook } = require('./title');
const { createViewImagePreModelHook } = require('./media');

// Single checkpointer across the process — keys multi-turn context by
// thread_id and persists according to agent/config.yaml. Created lazily so
// importing helpers like mapEvent has no storage side effects.
let checkpointer = null;
let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

function getLocalDataService() {
  return localDataService;
}

function getRuntimeCheckpointer() {
  if (!checkpointer) checkpointer = getCheckpointer();
  return checkpointer;
}

function combinePostModelHooks(...hooks) {
  return async (state, config) => {
    const update = {};
    for (const hook of hooks) {
      const next = await hook(state, config);
      if (next && typeof next === 'object') Object.assign(update, next);
    }
    return update;
  };
}

function combinePreModelHooks(...hooks) {
  return async (state, config) => {
    const update = {};
    let workingState = state;
    for (const hook of hooks) {
      const next = await hook(workingState, config);
      if (!next || typeof next !== 'object') continue;
      if (Array.isArray(next.messages)) {
        workingState = {
          ...workingState,
          messages: [...(workingState.messages || []), ...next.messages],
        };
      }
      Object.assign(update, next);
    }
    return update;
  };
}

function clampSubagentLimit(value) {
  return Math.max(2, Math.min(4, Number(value || 3)));
}

function createSubagentLimitPostModelHook(maxConcurrent) {
  const limit = clampSubagentLimit(maxConcurrent);
  return async (state) => {
    const messages = state?.messages || [];
    const last = messages[messages.length - 1];
    if (!last || typeof last._getType !== 'function' || last._getType() !== 'ai') return {};
    const toolCalls = Array.isArray(last.tool_calls) ? last.tool_calls : [];
    const taskIndices = toolCalls
      .map((call, index) => (call?.name === 'task' ? index : -1))
      .filter((index) => index >= 0);
    if (taskIndices.length <= limit) return {};

    const drop = new Set(taskIndices.slice(limit));
    const truncated = toolCalls.filter((_, index) => !drop.has(index));
    const updated = new AIMessage({
      id: last.id,
      content: last.content,
      tool_calls: truncated,
      additional_kwargs: last.additional_kwargs,
      response_metadata: last.response_metadata,
      usage_metadata: last.usage_metadata,
      name: last.name,
    });
    logger.warn('agent.subagents', 'Truncated excess task tool calls', {
      requested: taskIndices.length,
      kept: limit,
    });
    return { messages: [updated] };
  };
}

// Agent instances cached per (modelName | thinking | planMode | subagent) tuple,
// mirroring DeerFlowClient._agent_config_key so we don't rebuild the graph
// on every turn.
const agentCache = new Map();

function agentKey(opts) {
  return [
    opts.modelName || '',
    !!opts.thinkingEnabled,
    !!opts.planMode,
    !!opts.subagentEnabled,
    opts.maxConcurrentSubagents || 3,
    opts.agentName || '',
    Array.isArray(opts.availableSkills) ? opts.availableSkills.join(',') : '',
    opts.injectMemory !== false,
  ].join('|');
}

function getOrBuildAgent({
  modelName,
  thinkingEnabled,
  planMode,
  subagentEnabled,
  maxConcurrentSubagents,
  agentName,
  availableSkills,
  injectMemory,
}) {
  const key = agentKey({
    modelName,
    thinkingEnabled,
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    availableSkills,
    injectMemory,
  });
  const cached = agentCache.get(key);
  if (cached) return cached;

  const llm = createChatModel({ name: modelName, thinkingEnabled });
  const promptConfig = {
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    availableSkills,
    injectMemory,
  };
  const prompt = (state) => [
    new SystemMessage(applyPromptTemplate(promptConfig)),
    ...(state.messages || []),
  ];

  const agent = createReactAgent({
    llm,
    tools: ALL_TOOLS,
    prompt,
    stateSchema: ThreadState,
    checkpointer: getRuntimeCheckpointer(),
    preModelHook: combinePreModelHooks(
      createViewImagePreModelHook(),
      createSummarizationPreModelHook({ modelName }),
    ),
    postModelHook: combinePostModelHooks(
      createSubagentLimitPostModelHook(maxConcurrentSubagents),
      createTitlePostModelHook({ modelName }),
      createMemoryPostModelHook({ modelName, agentName }),
    ),
  });

  agentCache.set(key, agent);
  logger.info('agent.build', 'lead_agent built', {
    modelName,
    thinkingEnabled,
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    injectMemory,
  });
  return agent;
}

/**
 * Convert a LangChain.js event into one of the renderer's SSE event types.
 * Returns null for events the renderer doesn't consume.
 */
function mapEvent(evt) {
  const name = evt?.event;
  const data = evt?.data || {};

  if (name === 'on_chain_stream' && data?.chunk?.__interrupt__) {
    const interruptValue = data.chunk.__interrupt__[0]?.value || {};
    if (interruptValue.type === 'tool_confirmation') {
      return {
        type: 'tool_confirmation',
        payload: {
          tool_name: interruptValue.tool_name,
          tool_call_id: interruptValue.tool_call_id,
          args: interruptValue.args || {},
          summary: interruptValue.summary || interruptValue.tool_name,
        },
      };
    }
    if (interruptValue.type === 'clarification') {
      return {
        type: 'clarification',
        payload: {
          question: interruptValue.question,
          clarification_type: interruptValue.clarification_type,
          context: interruptValue.context,
          options: interruptValue.options || [],
          message: interruptValue.message || interruptValue.question,
        },
      };
    }
  }

  if (name === 'on_chain_stream' && data?.chunk) {
    const title = data.chunk?.post_model_hook?.title
      || data.chunk?.agent?.title
      || data.chunk?.title;
    if (title) return { type: 'thread_title', payload: { title } };
  }

  if (name === 'on_chain_end' && data?.output?.title) {
    return { type: 'thread_title', payload: { title: data.output.title } };
  }

  if (name === 'on_chat_model_stream') {
    const chunk = data.chunk;
    let text = '';
    const content = chunk?.content;
    if (typeof content === 'string') text = content;
    else if (Array.isArray(content)) {
      for (const block of content) {
        if (typeof block === 'string') text += block;
        else if (block && block.type === 'text' && block.text) text += block.text;
      }
    }
    if (!text) return null;
    return { type: 'text', payload: { content: text } };
  }

  if (name === 'on_tool_start') {
    return {
      type: 'tool_call_start',
      payload: {
        id: evt.run_id,
        name: evt.name,
        args: data.input || {},
      },
    };
  }

  if (name === 'on_tool_end') {
    const output = data.output;
    const content = typeof output === 'string' ? output : (output?.content ?? JSON.stringify(output));
    return {
      type: 'tool_result',
      payload: {
        tool_call_id: evt.run_id,
        name: evt.name,
        content,
      },
    };
  }

  return null;
}

/**
 * Stream one agent turn for a given thread, emitting renderer-shaped events.
 *
 * @param {object} opts
 * @param {string} opts.threadId
 * @param {string} opts.message
 * @param {object} opts.config           { model, thinking, plan_mode, subagent_enabled, tool_confirmation_mode }
 * @param {(type: string, payload: object) => void} opts.onEvent
 */
async function streamAgentInput({ threadId, input, config = {}, onEvent }) {
  const agent = getOrBuildAgent({
    modelName: config.model_name || config.model || null,
    thinkingEnabled: config.thinking_enabled ?? config.thinking ?? true,
    planMode: !!(config.is_plan_mode ?? config.plan_mode),
    subagentEnabled: !!config.subagent_enabled,
    maxConcurrentSubagents: config.max_concurrent_subagents || 3,
    agentName: config.agent_name || null,
    availableSkills: config.available_skills || null,
    injectMemory: config.inject_memory !== false,
  });

  const runtimeConfig = {
    configurable: {
      thread_id: threadId,
      model_name: config.model_name || config.model || null,
      model: config.model || config.model_name || null,
      tool_confirmation_mode: config.tool_confirmation_mode || 'ask-always',
      permission_policy: config.permission_policy || null,
      disable_memory_update: !!config.disable_memory_update,
      disable_title_generation: !!config.disable_title_generation,
      writer: (payload) => {
        if (payload?.type) onEvent(payload.type, payload);
      },
    },
    recursionLimit: 100,
  };

  try {
    for await (const evt of agent.streamEvents(input, { ...runtimeConfig, version: 'v2' })) {
      const mapped = mapEvent(evt);
      if (mapped) onEvent(mapped.type, mapped.payload);
    }
    onEvent('end', {});
  } catch (err) {
    logger.error('agent.stream', 'streamTurn failed', { threadId, error: err?.message });
    onEvent('error', { message: err?.message || 'Agent stream failed' });
  }
}

async function streamTurn({ threadId, message, config = {}, onEvent }) {
  return streamAgentInput({
    threadId,
    input: { messages: [new HumanMessage(message)] },
    config,
    onEvent,
  });
}

/**
 * Non-streaming variant — drains a full turn and returns the last AI text.
 * Used by headless task automation (kept as a thin wrapper around streamTurn
 * so there is one execution loop, not two).
 */
async function sendTurn({ threadId, message, config = {} }) {
  let lastText = '';
  await streamTurn({
    threadId,
    message,
    config,
    onEvent: (type, payload) => {
      if (type === 'text' && payload.content) lastText += payload.content;
    },
  });
  return { messages: [{ role: 'assistant', content: lastText }] };
}

function parseSuggestions(text, n) {
  const clean = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).slice(0, n);
    if (Array.isArray(parsed.suggestions)) return parsed.suggestions.map(String).filter(Boolean).slice(0, n);
  } catch {
    // Fall through to line parsing.
  }
  return clean
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, n);
}

async function generateSuggestions({ threadId, recentMessages = [], n = 3, config = {} }) {
  const context = recentMessages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
  const prompt = `Generate ${n} concise follow-up suggestion chips for the user based on this recent conversation.

Rules:
- Return ONLY a JSON array of strings
- Each string should be a useful next message the user could send
- No explanations, no markdown
- Do not call tools

<recent_conversation>
${context}
</recent_conversation>`;

  const suggestionThreadId = `${threadId || 'suggestions'}:suggestions`;
  const response = await sendTurn({
    threadId: suggestionThreadId,
    message: prompt,
    config: {
      ...config,
      inject_memory: false,
      disable_memory_update: true,
      disable_title_generation: true,
      tool_confirmation_mode: 'no-asking',
      permission_policy: {
        surface: 'suggestions',
        mode: 'no-asking',
        blacklist: { paths: [], filetypes: [] },
      },
    },
  });
  return parseSuggestions(response.messages?.[0]?.content || '', n);
}

/**
 * Resume a paused graph interrupt (tool confirmation or clarification).
 */
async function resumeTurn({ threadId, response, config = {}, onEvent }) {
  return streamAgentInput({
    threadId,
    input: new Command({ resume: response || {} }),
    config,
    onEvent,
  });
}

function resetCache() {
  agentCache.clear();
}

module.exports = {
  streamTurn,
  sendTurn,
  resumeTurn,
  generateSuggestions,
  parseSuggestions,
  resetCache,
  mapEvent,
  setLocalDataService,
  getLocalDataService,
};
