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

const crypto = require('crypto');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { Command } = require('@langchain/langgraph');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { toJSONSchema } = require('zod');
const { logger } = require('../logger');
const {
  ALL_TOOLS,
  setLocalDataService: setToolsLocalDataService,
  setStylofactCorpusService: setToolsStylofactCorpusService,
} = require('./tools');
const { ThreadState } = require('./state');
const {
  createChatModel,
  detectProvider,
  resolveChatModelRequest,
  setLocalDataService: setModelLocalDataService,
} = require('./models');
const {
  collectTokenUsage,
  providerErrorGuidance,
  sanitizeForAudit,
  serializeError,
} = require('./audit');
const { withProviderHttpAudit } = require('./provider-http-audit');
const { applyPromptTemplate, setLocalDataService: setPromptLocalDataService } = require('./system-prompt');
const { getCheckpointer, setLocalDataService: setCheckpointLocalDataService } = require('./checkpointer');
const {
  createMemoryPostModelHook,
  createSummarizationPreModelHook,
  setLocalDataService: setMemoryLocalDataService,
} = require('./memory');
const { createTitlePostModelHook } = require('./title');
const { createViewImagePreModelHook } = require('./media');

// Single checkpointer across the process — keys multi-turn context by
// thread_id and persists in briizos.db. Created lazily so
// importing helpers like mapEvent has no storage side effects.
let checkpointer = null;
let localDataService = null;
let cachedToolSchemasForAudit = null;
const AUDIT_BLOCK_CODES = new Set([
  'AI_AUDIT_REQUIRED_WRITE_FAILED',
  'AI_AUDIT_CONTEXT_MISSING',
  'AI_AUDIT_REQUEST_BODY_UNAVAILABLE',
  'AI_AUDIT_INVOCATION_MISSING',
]);

function setLocalDataService(service) {
  localDataService = service;
  setModelLocalDataService(service);
  setPromptLocalDataService(service);
  setCheckpointLocalDataService(service);
  setMemoryLocalDataService(service);
  setToolsLocalDataService(service);
}

function getLocalDataService() {
  return localDataService;
}

function setStylofactCorpusService(service) {
  setToolsStylofactCorpusService(service);
}

function getRuntimeCheckpointer() {
  if (!checkpointer) checkpointer = getCheckpointer();
  return checkpointer;
}

function boundToolSchemasForAudit(allowedTools = null) {
  const all = allToolSchemasForAudit();
  if (!Array.isArray(allowedTools)) return all;
  const allowed = new Set(allowedTools);
  return all.filter((schema) => allowed.has(schema.name));
}

function allToolSchemasForAudit() {
  if (cachedToolSchemasForAudit) return cachedToolSchemasForAudit;
  cachedToolSchemasForAudit = ALL_TOOLS.map((tool) => {
    let inputSchema;
    try {
      inputSchema = toJSONSchema(tool.schema);
    } catch (error) {
      inputSchema = {
        conversion_error: error?.message || 'The Zod schema could not be converted to JSON Schema.',
        langchain_schema: sanitizeForAudit(tool.schema),
      };
    }
    return {
      name: tool.name,
      description: tool.description || '',
      input_schema: inputSchema,
      response_format: tool.responseFormat || null,
      return_direct: !!tool.returnDirect,
    };
  });
  return cachedToolSchemasForAudit;
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
    opts.temperature ?? '',
    opts.topP ?? '',
    opts.maxTokens ?? '',
    opts.reasoningEffort || '',
    !!opts.planMode,
    !!opts.subagentEnabled,
    opts.maxConcurrentSubagents || 3,
    opts.agentName || '',
    Array.isArray(opts.availableSkills) ? opts.availableSkills.join(',') : '',
    opts.injectMemory !== false,
    opts.modality || '',
    Array.isArray(opts.allowedTools) ? opts.allowedTools.slice().sort().join(',') : '*',
  ].join('|');
}

function getOrBuildAgent({
  modelName,
  thinkingEnabled,
  temperature,
  topP,
  maxTokens,
  reasoningEffort,
  planMode,
  subagentEnabled,
  maxConcurrentSubagents,
  agentName,
  availableSkills,
  injectMemory,
  modality,
  allowedTools,
}) {
  const key = agentKey({
    modelName,
    thinkingEnabled,
    temperature,
    topP,
    maxTokens,
    reasoningEffort,
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    availableSkills,
    injectMemory,
    modality,
    allowedTools,
  });
  const cached = agentCache.get(key);
  if (cached) return cached;

  let boundTools = ALL_TOOLS;
  if (Array.isArray(allowedTools)) {
    const allowed = new Set(allowedTools);
    boundTools = ALL_TOOLS.filter((tool) => allowed.has(tool.name));
    if (!boundTools.length) {
      throw new Error('allowed_tools matched no registered agent tools; refusing to run a tool-less agent by misconfiguration.');
    }
  }

  const llm = createChatModel({ name: modelName, thinkingEnabled, temperature, topP, maxTokens, reasoningEffort });
  const promptConfig = {
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    availableSkills,
    injectMemory,
    modality,
  };
  const prompt = (state) => [
    new SystemMessage(applyPromptTemplate(promptConfig)),
    ...(state.messages || []),
  ];

  const agent = createReactAgent({
    llm,
    tools: boundTools,
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
  logger.debug('agent.build', 'The local AI workflow was prepared with these settings. No model provider was contacted by this step.', {
    modelName,
    thinkingEnabled,
    temperature,
    topP,
    maxTokens,
    reasoningEffort,
    planMode,
    subagentEnabled,
    maxConcurrentSubagents,
    agentName,
    injectMemory,
    providerContactedByThisStep: false,
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

function appendAiAuditEvent(event) {
  if (!localDataService?.appendAiTurnAuditEvent) {
    logger.error(
      'agent.audit',
      'The AI request/response record could not be saved because local AI audit storage is unavailable.',
      {
        threadId: event.threadId,
        turnId: event.turnId,
        eventType: event.eventType,
      },
    );
    return null;
  }
  try {
    return localDataService.appendAiTurnAuditEvent({
      ...event,
      effectiveConfig: sanitizeForAudit(event.effectiveConfig || {}),
      permissionPolicy: event.permissionPolicy == null
        ? null
        : sanitizeForAudit(event.permissionPolicy),
      request: event.request == null ? null : sanitizeForAudit(event.request),
      response: event.response == null ? null : sanitizeForAudit(event.response),
      error: event.error == null ? null : sanitizeForAudit(event.error),
      tokenUsage: event.tokenUsage == null ? null : sanitizeForAudit(event.tokenUsage),
    });
  } catch (error) {
    logger.error(
      'agent.audit',
      'The AI request/response record could not be written to the local database.',
      {
        threadId: event.threadId,
        turnId: event.turnId,
        invocationId: event.invocationId || null,
        eventType: event.eventType,
        databaseError: error?.message,
      },
    );
    return null;
  }
}

function findAuditBlockError(error, seen = new Set()) {
  if (!error || typeof error !== 'object' || seen.has(error)) return null;
  seen.add(error);
  if (AUDIT_BLOCK_CODES.has(error.code)) return error;
  return findAuditBlockError(error.cause, seen)
    || findAuditBlockError(error.error, seen)
    || findAuditBlockError(error.originalError, seen);
}

function langChainEventEnvelope(evt) {
  return {
    stream_schema: 'LangChain streamEvents v2',
    event: evt?.event || null,
    name: evt?.name || null,
    run_id: evt?.run_id || null,
    parent_ids: evt?.parent_ids || [],
    tags: evt?.tags || [],
    metadata: evt?.metadata || {},
    data: evt?.data || {},
  };
}

function auditContextForModelEvent(evt, outerAuditContext) {
  const metadata = evt?.metadata || {};
  const reported = metadata.briizos_effective_model_config || null;
  const reportedProvider = reported?.provider
    || (metadata.ls_provider ? detectProvider(metadata.ls_provider) : null);
  const reportedModel = reported?.model || metadata.ls_model_name || null;
  return {
    ...outerAuditContext,
    provider: reportedProvider || outerAuditContext.provider,
    model: reportedModel || outerAuditContext.model,
    effectiveConfig: {
      ...outerAuditContext.effectiveConfig,
      invocation_model: reported || {
        provider: reportedProvider || outerAuditContext.provider,
        model: reportedModel || outerAuditContext.model,
        parameters_reported_by_langchain: {
          temperature: metadata.ls_temperature ?? null,
          top_p: metadata.ls_top_p ?? null,
          max_tokens: metadata.ls_max_tokens ?? null,
          thinking: metadata.ls_thinking ?? null,
        },
      },
      invocation_langchain_metadata: metadata,
    },
  };
}

function hasSavedUserChatMessage(threadId) {
  try {
    const messages = localDataService?.listMessages?.(threadId) || [];
    return messages.some((message) => message.role === 'user');
  } catch {
    return false;
  }
}

function providerLabel(provider) {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'claude') return 'Anthropic';
  if (provider === 'gemini') return 'Google Gemini';
  return provider || 'The AI provider';
}

/**
 * Log a turn failure with provider guidance, and return a renderer-ready
 * failure report so the same status/code/next-action the log gets is also
 * delivered to the surface that started the turn (chat, Stylofact, tasks) —
 * the user must never need a provider dashboard to learn what happened.
 */
function logTurnFailure({
  threadId,
  turnId,
  provider,
  model,
  errorDetails,
  activeProviderRequest,
  completedProviderRequests,
  receivedAssistantOutput,
}) {
  const guidance = providerErrorGuidance(errorDetails, provider, model);
  const savedUserMessage = hasSavedUserChatMessage(threadId);
  const exactStatus = guidance.status ?? errorDetails?.status ?? errorDetails?.statusCode ?? 'not supplied';
  const exactCode = guidance.code ?? errorDetails?.code ?? errorDetails?.type ?? 'not supplied';
  const exactMessage = errorDetails?.message || 'No provider error message was supplied.';
  let explanation;

  if (activeProviderRequest) {
    explanation = receivedAssistantOutput
      ? `${providerLabel(provider)} stopped the request to ${model || 'the selected model'} after a partial assistant response.`
      : `${providerLabel(provider)} rejected the request to ${model || 'the selected model'} before an assistant response was received.`;
  } else if (completedProviderRequests > 0) {
    explanation = `The AI turn stopped after ${completedProviderRequests} provider response${completedProviderRequests === 1 ? '' : 's'} because a later agent step failed.`;
  } else {
    explanation = `briizOS could not send the request to ${providerLabel(provider)} model ${model || 'the selected model'}.`;
  }

  const persistence = savedUserMessage
    ? 'The user’s chat message remains saved in the local Messages table.'
    : 'No user-visible chat message was found for this internal or resumed run.';
  logger.error(
    'agent.provider',
    `${explanation} ${persistence} Provider error: ${exactMessage} (status: ${exactStatus}; code: ${exactCode}). Next action: ${guidance.nextAction}`,
    {
      threadId,
      turnId,
      provider,
      model,
      userMessageSaved: savedUserMessage,
      providerRequestActiveAtFailure: activeProviderRequest,
      assistantOutputReceived: receivedAssistantOutput,
      completedProviderRequests,
      errorCategory: guidance.category,
      providerStatus: exactStatus,
      providerCode: exactCode,
      exactProviderError: errorDetails,
      nextAction: guidance.nextAction,
    },
  );
  return {
    turnId,
    threadId,
    provider,
    model,
    category: guidance.category,
    status: guidance.status ?? errorDetails?.status ?? errorDetails?.statusCode ?? null,
    code: guidance.code ?? errorDetails?.code ?? errorDetails?.type ?? null,
    nextAction: guidance.nextAction,
  };
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
async function streamAgentInput({
  threadId,
  input,
  config = {},
  onEvent,
  turnKind = 'message',
}) {
  const turnId = crypto.randomUUID();
  let auditWriteFailures = 0;
  let requiredAuditBlock = null;
  const recordAudit = (
    event,
    {
      requiredBeforeProvider = false,
      requiredAtProviderBoundary = false,
      requiredForOutcome = false,
    } = {},
  ) => {
    const saved = appendAiAuditEvent(event);
    if (!saved) {
      auditWriteFailures += 1;
      if (requiredBeforeProvider || requiredAtProviderBoundary || requiredForOutcome) {
        const beforeProvider = requiredBeforeProvider;
        const atProviderBoundary = requiredAtProviderBoundary;
        const error = new Error(
          beforeProvider
            ? 'The complete AI request record could not be saved, so briizOS stopped this turn before continuing to the provider.'
            : atProviderBoundary
              ? 'The AI provider boundary was reached, but its complete request event could not be saved. briizOS stopped the turn; provider dispatch may already have begun, and no success is being claimed.'
              : 'The provider returned or stopped, but briizOS could not save the required outcome record. This turn is not being reported as successful.',
        );
        error.code = 'AI_AUDIT_REQUIRED_WRITE_FAILED';
        error.auditEventType = event.eventType;
        error.auditStage = beforeProvider
          ? 'before_provider'
          : atProviderBoundary
            ? 'provider_boundary'
            : 'after_provider';
        // LangChain's generic AsyncCaller retries unknown errors. A local
        // audit-storage failure must stop immediately or it could duplicate an
        // already-received provider request while still lacking evidence.
        error.status = 400;
        error.statusCode = 400;
        requiredAuditBlock = error;
        throw error;
      }
    }
    return saved;
  };
  const requestedModel = config.model_name || config.model || null;
  const requestedProvider = detectProvider(requestedModel);
  const agentOptions = {
    modelName: config.model_name || config.model || null,
    thinkingEnabled: config.thinking_enabled ?? config.thinking ?? true,
    temperature: Number.isFinite(config.temperature) ? config.temperature : null,
    topP: Number.isFinite(config.top_p) ? config.top_p : null,
    maxTokens: Number.isFinite(config.max_tokens) ? config.max_tokens : null,
    reasoningEffort: config.reasoning_effort || null,
    planMode: !!(config.is_plan_mode ?? config.plan_mode),
    subagentEnabled: !!config.subagent_enabled,
    maxConcurrentSubagents: config.max_concurrent_subagents || 3,
    agentName: config.agent_name || null,
    availableSkills: config.available_skills || null,
    injectMemory: config.inject_memory !== false,
    modality: config.modality || null,
    allowedTools: Array.isArray(config.allowed_tools) ? config.allowed_tools : null,
  };
  const auditTurnKind = config.permission_policy?.surface === 'suggestions'
    ? 'suggestion'
    : turnKind;
  // Surface-supplied intent label ("Stylofact · Find material (Stage 2)").
  // Deliberately separate from `modality`, which feeds the system prompt.
  const turnLabel = typeof config.audit_label === 'string' && config.audit_label.trim()
    ? config.audit_label.trim().slice(0, 200)
    : null;
  const modality = config.modality || config.permission_policy?.surface || null;
  const userMessageSavedBeforeProvider = hasSavedUserChatMessage(threadId);
  const outerRequest = {
    input,
    requested_run_config: config,
    user_visible_transcript: {
      table: 'messages',
      user_message_saved_before_provider_request: userMessageSavedBeforeProvider,
    },
  };

  let resolvedModelRequest;
  try {
    resolvedModelRequest = resolveChatModelRequest({
      name: agentOptions.modelName,
      thinkingEnabled: agentOptions.thinkingEnabled,
      temperature: agentOptions.temperature,
      topP: agentOptions.topP,
      maxTokens: agentOptions.maxTokens,
      reasoningEffort: agentOptions.reasoningEffort,
    });
  } catch (error) {
    const errorDetails = serializeError(error);
    const effectiveConfig = {
      requested_model: requestedModel,
      requested_provider: requestedProvider,
      requested_run_config: config,
      modality,
      permission_policy: config.permission_policy || null,
    };
    recordAudit({
      threadId,
      turnId,
      invocationId: null,
      eventType: 'turn_error',
      turnKind: auditTurnKind,
      turnLabel,
      provider: requestedProvider,
      model: requestedModel,
      modality,
      outcome: 'failed_before_model_resolution',
      effectiveConfig,
      permissionPolicy: config.permission_policy || null,
      request: outerRequest,
      error: errorDetails,
    });
    const failureReport = logTurnFailure({
      threadId,
      turnId,
      provider: requestedProvider,
      model: requestedModel,
      errorDetails,
      activeProviderRequest: false,
      completedProviderRequests: 0,
      receivedAssistantOutput: false,
    });
    onEvent('error', {
      message: error?.message || 'The AI model settings could not be resolved.',
      ...failureReport,
    });
    return { turnId, outcome: 'failed' };
  }

  const effectiveConfig = {
    provider: resolvedModelRequest.provider,
    model: resolvedModelRequest.model,
    profile_name: resolvedModelRequest.profileName,
    adapter: resolvedModelRequest.adapter,
    adapter_constructor_options: resolvedModelRequest.constructorOptions,
    model_parameters: resolvedModelRequest.effectiveParameters,
    model_capabilities: resolvedModelRequest.modelCapabilities,
    modality,
    permission_policy: config.permission_policy || null,
    tool_confirmation_mode: config.tool_confirmation_mode || 'ask-always',
    graph: {
      plan_mode: agentOptions.planMode,
      subagent_enabled: agentOptions.subagentEnabled,
      max_concurrent_subagents: agentOptions.maxConcurrentSubagents,
      agent_name: agentOptions.agentName,
      available_skills: agentOptions.availableSkills,
      inject_memory: agentOptions.injectMemory,
      disable_memory_update: !!config.disable_memory_update,
      disable_title_generation: !!config.disable_title_generation,
      recursion_limit: 100,
    },
    bound_tool_schemas: boundToolSchemasForAudit(agentOptions.allowedTools),
    provider_transport_audit: resolvedModelRequest.provider === 'openai'
      ? {
        request_capture: 'Exact serialized HTTP request body immediately before fetch, with credentials redacted before database storage.',
        response_capture: 'HTTP status/headers plus the complete LangChain streamed response events.',
      }
      : {
        request_capture: 'Complete LangChain provider-boundary messages, tools, and effective adapter settings.',
        response_capture: 'Complete LangChain streamed response/completion/error events.',
        limitation: 'This provider adapter does not expose its final private HTTP serialization to briizOS.',
      },
    requested_run_config: config,
  };
  const auditBase = {
    threadId,
    turnId,
    turnKind: auditTurnKind,
    turnLabel,
    provider: resolvedModelRequest.provider,
    model: resolvedModelRequest.model,
    modality,
    effectiveConfig,
    permissionPolicy: config.permission_policy || null,
  };
  try {
    recordAudit(
      {
        ...auditBase,
        invocationId: null,
        eventType: 'turn_started',
        outcome: 'started',
        request: outerRequest,
      },
      { requiredBeforeProvider: true },
    );
  } catch (error) {
    logger.error(
      'agent.audit',
      'The AI turn did not start because its complete initial record could not be saved. No provider request was sent.',
      {
        threadId,
        turnId,
        failedAuditEventType: error.auditEventType || 'turn_started',
        auditStage: error.auditStage || 'before_provider',
        error: error.message,
      },
    );
    onEvent('error', { message: error.message, turnId, threadId });
    return { turnId, outcome: 'blocked_by_audit_storage' };
  }

  let agent;
  try {
    agent = getOrBuildAgent(agentOptions);
  } catch (error) {
    const errorDetails = serializeError(error);
    recordAudit({
      ...auditBase,
      invocationId: null,
      eventType: 'turn_error',
      outcome: 'failed_before_provider_request',
      request: outerRequest,
      error: errorDetails,
    });
    const failureReport = logTurnFailure({
      threadId,
      turnId,
      provider: resolvedModelRequest.provider,
      model: resolvedModelRequest.model,
      errorDetails,
      activeProviderRequest: false,
      completedProviderRequests: 0,
      receivedAssistantOutput: false,
    });
    onEvent('error', {
      message: error?.message || 'The AI provider request could not be prepared.',
      ...failureReport,
    });
    return { turnId, outcome: 'failed' };
  }

  const runtimeConfig = {
    configurable: {
      thread_id: threadId,
      model_name: config.model_name || config.model || null,
      model: config.model || config.model_name || null,
      tool_confirmation_mode: config.tool_confirmation_mode || 'ask-always',
      permission_policy: config.permission_policy || null,
      disable_memory_update: !!config.disable_memory_update,
      disable_title_generation: !!config.disable_title_generation,
      stylofact_project_id: config.stylofact_project_id || null,
      stylofact_retrieval_run_id: config.stylofact_retrieval_run_id || null,
      writer: (payload) => {
        if (payload?.type) onEvent(payload.type, payload);
      },
    },
    recursionLimit: 100,
  };

  const invocations = new Map();
  const anonymousInvocationIds = [];
  const failedInvocationEvents = [];
  let providerInvocationsStarted = 0;
  let providerInvocationsCompleted = 0;
  let receivedAssistantOutput = false;
  let interrupted = false;
  let lastChainEnd = null;
  const findInvocation = (runId) => {
    if (runId && invocations.has(runId)) return { key: runId, invocation: invocations.get(runId) };
    const fallbackKey = anonymousInvocationIds.find((key) => invocations.has(key))
      || (invocations.size === 1 ? invocations.keys().next().value : null);
    return fallbackKey
      ? { key: fallbackKey, invocation: invocations.get(fallbackKey) }
      : { key: null, invocation: null };
  };
  const removeInvocation = (key) => {
    if (!key) return;
    invocations.delete(key);
    const index = anonymousInvocationIds.indexOf(key);
    if (index >= 0) anonymousInvocationIds.splice(index, 1);
  };
  const providerHttpAuditContext = {
    onRequest: (wireRequest) => {
      const wireModel = wireRequest.body?.parsed_json_body?.model || auditBase.model;
      const invocationId = wireRequest.langchain_invocation_id || null;
      const wireAuditContext = {
        ...auditBase,
        provider: 'openai',
        model: wireModel,
      };
      const wireContext = {
        auditContext: wireAuditContext,
        invocationId,
        requestReference: {
          wire_request_id: wireRequest.wire_request_id,
          endpoint_path: wireRequest.endpoint_path,
          body_byte_length: wireRequest.body?.byte_length ?? null,
          original_body_sha256: wireRequest.body?.original_body_sha256 || null,
        },
      };
      recordAudit(
        {
          ...wireAuditContext,
          invocationId,
          eventType: 'provider_http_request',
          outcome: 'dispatching',
          request: {
            ...wireRequest,
            note: 'This is the OpenAI SDK’s final serialized fetch request. Its LangChain invocation ID comes directly from the model run manager, so concurrent calls do not rely on event arrival order. Credential-bearing values are redacted before SQLite storage.',
          },
        },
        { requiredBeforeProvider: true },
      );
      return wireContext;
    },
    onResponse: (wireResponse, wireContext = {}) => {
      recordAudit(
        {
          ...(wireContext.auditContext || auditBase),
          invocationId: wireContext.invocationId || null,
          eventType: 'provider_http_response',
          outcome: wireResponse.ok ? 'response_headers_received' : 'http_error_response_received',
          request: wireContext.requestReference || {
            wire_request_id: wireResponse.wire_request_id,
          },
          response: wireResponse,
        },
      );
    },
    onNetworkError: (wireRequest, error, wireContext = {}) => {
      recordAudit(
        {
          ...(wireContext.auditContext || auditBase),
          invocationId: wireContext.invocationId || null,
          eventType: 'provider_http_error',
          outcome: 'network_failed',
          request: wireContext.requestReference || wireRequest,
          error: serializeError(error),
        },
      );
    },
  };

  try {
    const providerAuditedEvents = withProviderHttpAudit(
      providerHttpAuditContext,
      () => agent.streamEvents(input, { ...runtimeConfig, version: 'v2' }),
    );
    for await (const evt of providerAuditedEvents) {
      const eventName = evt?.event;
      const invocationId = evt?.run_id || null;

      if (eventName === 'on_chat_model_start') {
        const stableInvocationId = invocationId || crypto.randomUUID();
        const invocationAuditContext = auditContextForModelEvent(evt, auditBase);
        const request = {
          boundary: 'LangChain on_chat_model_start before completion',
          event_envelope: langChainEventEnvelope(evt),
          provider_input_messages: evt?.data?.input ?? null,
          bound_tool_schemas: boundToolSchemasForAudit(agentOptions.allowedTools),
          effective_model_request: invocationAuditContext.effectiveConfig,
          note: 'Provider SDK credentials are deliberately redacted; prompts, duplicates, system/tool messages, schemas, and non-secret model settings are retained.',
        };
        invocations.set(stableInvocationId, {
          invocationId: stableInvocationId,
          auditContext: invocationAuditContext,
          request,
          streamedEvents: [],
          receivedOutput: false,
        });
        if (!invocationId) anonymousInvocationIds.push(stableInvocationId);
        providerInvocationsStarted += 1;
        recordAudit(
          {
            ...invocationAuditContext,
            invocationId: stableInvocationId,
            eventType: 'model_request',
            outcome: 'requested',
            request,
          },
          { requiredAtProviderBoundary: true },
        );
      } else if (eventName === 'on_chat_model_stream') {
        const { invocation } = findInvocation(invocationId);
        if (invocation) {
          invocation.streamedEvents.push(langChainEventEnvelope(evt));
          invocation.receivedOutput = true;
        }
      } else if (eventName === 'on_chat_model_end') {
        const { key: invocationKey, invocation } = findInvocation(invocationId);
        const request = invocation?.request || {
          note: 'LangChain did not emit a matching on_chat_model_start event.',
          inferred_from_completion_event: langChainEventEnvelope(evt),
        };
        const response = {
          completion_event: langChainEventEnvelope(evt),
          streamed_events: invocation?.streamedEvents || [],
        };
        const invocationAuditContext = invocation?.auditContext
          || auditContextForModelEvent(evt, auditBase);
        recordAudit(
          {
            ...invocationAuditContext,
            invocationId: invocation?.invocationId || invocationId || crypto.randomUUID(),
            eventType: 'model_response',
            outcome: 'succeeded',
            request,
            response,
            tokenUsage: collectTokenUsage(response),
          },
          { requiredForOutcome: true },
        );
        providerInvocationsCompleted += 1;
        removeInvocation(invocationKey);
      } else if (eventName === 'on_chat_model_error') {
        const { key: invocationKey, invocation } = findInvocation(invocationId);
        const rawModelError = evt?.data?.error || evt?.data || new Error('AI provider request failed');
        const auditBlockError = findAuditBlockError(rawModelError);
        if (auditBlockError) throw auditBlockError;
        const errorDetails = serializeError(rawModelError);
        const response = {
          streamed_events_before_error: invocation?.streamedEvents || [],
          error_event: langChainEventEnvelope(evt),
        };
        const invocationAuditContext = invocation?.auditContext
          || auditContextForModelEvent(evt, auditBase);
        recordAudit(
          {
            ...invocationAuditContext,
            invocationId: invocation?.invocationId || invocationId || crypto.randomUUID(),
            eventType: 'model_error',
            outcome: 'failed',
            request: invocation?.request || langChainEventEnvelope(evt),
            response,
            error: errorDetails,
            tokenUsage: collectTokenUsage(response),
          },
          { requiredForOutcome: true },
        );
        failedInvocationEvents.push({
          errorDetails,
          invocation,
          auditContext: invocationAuditContext,
        });
        removeInvocation(invocationKey);
      }

      if (eventName === 'on_chain_stream' && evt?.data?.chunk?.__interrupt__) {
        interrupted = true;
      }
      if (eventName === 'on_chain_end') lastChainEnd = langChainEventEnvelope(evt);

      const mapped = mapEvent(evt);
      if (mapped?.type === 'text' && mapped.payload?.content) {
        receivedAssistantOutput = true;
      }
      if (mapped) onEvent(mapped.type, mapped.payload);
    }

    if (failedInvocationEvents.length) {
      if (requiredAuditBlock) throw requiredAuditBlock;
      const failure = failedInvocationEvents[failedInvocationEvents.length - 1];
      recordAudit(
        {
          ...auditBase,
          invocationId: null,
          eventType: 'turn_error',
          outcome: 'failed',
          request: outerRequest,
          response: { last_chain_end: lastChainEnd },
          error: failure.errorDetails,
        },
        { requiredForOutcome: true },
      );
      const failureReport = logTurnFailure({
        threadId,
        turnId,
        provider: resolvedModelRequest.provider,
        model: resolvedModelRequest.model,
        errorDetails: failure.errorDetails,
        activeProviderRequest: true,
        completedProviderRequests: providerInvocationsCompleted,
        receivedAssistantOutput,
      });
      onEvent('error', {
        message: failure.errorDetails?.message || 'The AI provider request failed.',
        ...failureReport,
      });
      return { turnId, outcome: 'failed' };
    }

    const incompleteInvocations = [...invocations.values()];
    for (const invocation of incompleteInvocations) {
      const response = { streamed_events_before_stop: invocation.streamedEvents };
      recordAudit(
        {
          ...invocation.auditContext,
          invocationId: invocation.invocationId,
          eventType: 'model_incomplete',
          outcome: interrupted ? 'interrupted' : 'ended_without_model_completion',
          request: invocation.request,
          response,
          tokenUsage: collectTokenUsage(response),
        },
        { requiredForOutcome: true },
      );
    }
    invocations.clear();
    anonymousInvocationIds.length = 0;

    if (incompleteInvocations.length > 0 && !interrupted) {
      const incompleteError = {
        name: 'IncompleteModelRequest',
        message: `${incompleteInvocations.length} provider request${incompleteInvocations.length === 1 ? '' : 's'} started but emitted neither a completion nor an error event.`,
      };
      recordAudit(
        {
          ...auditBase,
          invocationId: null,
          eventType: 'turn_error',
          outcome: 'incomplete',
          request: outerRequest,
          response: {
            provider_invocations_started: providerInvocationsStarted,
            provider_invocations_completed: providerInvocationsCompleted,
            final_chain_event: lastChainEnd,
          },
          error: incompleteError,
        },
        { requiredForOutcome: true },
      );
      logger.error(
        'agent.provider',
        'The AI turn ended without a provider completion or provider error event, so briizOS is not reporting it as successful. Any partial response was preserved.',
        {
          threadId,
          turnId,
          provider: resolvedModelRequest.provider,
          model: resolvedModelRequest.model,
          incompleteProviderRequests: incompleteInvocations.length,
          receivedAssistantOutput,
        },
      );
      onEvent('error', {
        message: incompleteError.message,
        turnId,
        threadId,
        provider: resolvedModelRequest.provider,
        model: resolvedModelRequest.model,
      });
      return { turnId, outcome: 'incomplete' };
    }

    if (auditWriteFailures > 0) {
      const auditGapError = {
        name: 'AiAuditIncomplete',
        message: `${auditWriteFailures} required AI evidence write${auditWriteFailures === 1 ? '' : 's'} failed. The provider turn is not being reported as successful.`,
      };
      recordAudit(
        {
          ...auditBase,
          invocationId: null,
          eventType: 'turn_error',
          outcome: 'audit_incomplete',
          request: outerRequest,
          response: {
            provider_invocations_started: providerInvocationsStarted,
            provider_invocations_completed: providerInvocationsCompleted,
            interrupted,
            final_chain_event: lastChainEnd,
          },
          error: auditGapError,
        },
        { requiredForOutcome: true },
      );
      logger.error(
        'agent.audit',
        `${auditGapError.message} The user-visible message and any partial assistant response remain in the local transcript.`,
        {
          threadId,
          turnId,
          provider: resolvedModelRequest.provider,
          model: resolvedModelRequest.model,
          auditWriteFailures,
        },
      );
      onEvent('error', { message: auditGapError.message, turnId, threadId });
      return { turnId, outcome: 'blocked_by_audit_storage' };
    }

    recordAudit(
      {
        ...auditBase,
        invocationId: null,
        eventType: 'turn_completed',
        outcome: interrupted ? 'interrupted' : 'succeeded',
        request: outerRequest,
        response: {
          provider_invocations_started: providerInvocationsStarted,
          provider_invocations_completed: providerInvocationsCompleted,
          interrupted,
          final_chain_event: lastChainEnd,
        },
      },
      { requiredForOutcome: true },
    );
    const auditEvidence = auditWriteFailures === 0
      ? 'Full request/response envelopes and reported token usage were saved in AI Turn Audit Events.'
      : `${auditWriteFailures} AI audit database write${auditWriteFailures === 1 ? '' : 's'} failed; the agent.audit error entries identify which evidence could not be saved.`;
    logger[auditWriteFailures === 0 ? 'info' : 'error'](
      'agent.provider',
      interrupted
        ? `The ${providerLabel(resolvedModelRequest.provider)} ${resolvedModelRequest.model} turn paused for user input. ${auditEvidence}`
        : `${providerLabel(resolvedModelRequest.provider)} ${resolvedModelRequest.model} completed ${providerInvocationsCompleted} provider request${providerInvocationsCompleted === 1 ? '' : 's'}. ${auditEvidence}`,
      {
        threadId,
        turnId,
        provider: resolvedModelRequest.provider,
        model: resolvedModelRequest.model,
        providerInvocationsStarted,
        providerInvocationsCompleted,
        interrupted,
        userMessageWasSavedBeforeProvider: userMessageSavedBeforeProvider,
        auditWriteFailures,
      },
    );
    onEvent('end', {});
    return {
      turnId,
      outcome: interrupted
        ? 'interrupted'
        : auditWriteFailures === 0
          ? 'succeeded'
          : 'completed_with_audit_gap',
    };
  } catch (err) {
    const auditBlockError = findAuditBlockError(err) || requiredAuditBlock;
    if (auditBlockError) {
      logger.error(
        'agent.audit',
        auditBlockError.auditStage === 'after_provider'
          ? 'The AI turn was stopped because its required provider outcome record could not be saved. No successful provider response is claimed.'
          : auditBlockError.auditStage === 'provider_boundary'
            ? 'The AI turn was stopped because its provider-boundary request event could not be saved. The provider may already have received the request, but no provider success is claimed.'
            : 'The AI turn was stopped because its complete request evidence could not be guaranteed before network dispatch. No provider request was sent by the audited OpenAI transport, and no provider success is claimed.',
        {
          threadId,
          turnId,
          failedAuditEventType: auditBlockError.auditEventType || null,
          auditStage: auditBlockError.auditStage || null,
          providerRequestStartObserved: providerInvocationsStarted > 0,
          providerDispatchMayHaveStarted: auditBlockError.auditStage === 'provider_boundary',
          error: auditBlockError.message,
        },
      );
      onEvent('error', { message: auditBlockError.message, turnId, threadId });
      return { turnId, outcome: 'blocked_by_audit_storage' };
    }
    const errorDetails = serializeError(err);
    for (const invocation of invocations.values()) {
      const response = { streamed_events_before_error: invocation.streamedEvents };
      recordAudit({
        ...invocation.auditContext,
        invocationId: invocation.invocationId,
        eventType: 'model_error',
        outcome: 'failed',
        request: invocation.request,
        response,
        error: errorDetails,
        tokenUsage: collectTokenUsage(response),
      });
    }
    recordAudit({
      ...auditBase,
      invocationId: null,
      eventType: 'turn_error',
      outcome: 'failed',
      request: outerRequest,
      response: {
        provider_invocations_started: providerInvocationsStarted,
        provider_invocations_completed: providerInvocationsCompleted,
        partial_invocations: [...invocations.values()].map((invocation) => ({
          invocation_id: invocation.invocationId,
          streamed_events: invocation.streamedEvents,
        })),
        final_chain_event: lastChainEnd,
      },
      error: errorDetails,
      tokenUsage: collectTokenUsage([...invocations.values()].map((invocation) => invocation.streamedEvents)),
    });
    const failureReport = logTurnFailure({
      threadId,
      turnId,
      provider: resolvedModelRequest.provider,
      model: resolvedModelRequest.model,
      errorDetails,
      activeProviderRequest: invocations.size > 0 || failedInvocationEvents.length > 0,
      completedProviderRequests: providerInvocationsCompleted,
      receivedAssistantOutput,
    });
    onEvent('error', { message: err?.message || 'Agent stream failed', ...failureReport });
    return { turnId, outcome: 'failed' };
  }
}

async function streamTurn({ threadId, message, config = {}, onEvent }) {
  return streamAgentInput({
    threadId,
    input: { messages: [new HumanMessage(message)] },
    config,
    onEvent,
    turnKind: 'message',
  });
}

/**
 * Non-streaming variant — drains a full turn and returns the last AI text.
 * Used by headless task automation (kept as a thin wrapper around streamTurn
 * so there is one execution loop, not two).
 */
async function sendTurn({ threadId, message, config = {} }) {
  let lastText = '';
  let interruption = null;
  let reportedError = null;
  const turn = await streamTurn({
    threadId,
    message,
    config,
    onEvent: (type, payload) => {
      if (type === 'text' && payload.content) lastText += payload.content;
      if (type === 'tool_confirmation' || type === 'clarification') {
        interruption = { type, ...payload };
      }
      if (type === 'error') reportedError = payload?.message || 'The AI turn failed.';
    },
  });
  if (turn?.outcome === 'interrupted') {
    const content = lastText || JSON.stringify(interruption || { type: 'interrupted' });
    return { messages: [{ role: 'assistant', content }], outcome: turn.outcome, interruption };
  }
  if (turn?.outcome !== 'succeeded') {
    const error = new Error(reportedError || `The AI turn ended with “${turn?.outcome || 'unknown'}” instead of a completed response.`);
    error.code = 'AI_TURN_NOT_COMPLETED';
    error.outcome = turn?.outcome || 'unknown';
    throw error;
  }
  return { messages: [{ role: 'assistant', content: lastText }], outcome: turn.outcome };
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
    turnKind: 'resume',
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
  setStylofactCorpusService,
  getLocalDataService,
};
