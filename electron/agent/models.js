/**
 * JS model factory — replaces agent/src/models/factory.py.
 *
 * The Electron runtime resolves model profiles and encrypted credentials
 * through LocalDataService, keeping the agent on the same SQLite authority.
 *
 * Supported providers (mirrors the renderer model picker):
 *   - claude-* → @langchain/anthropic
 *   - gpt-* / o1* / o3* / openai-* → @langchain/openai
 *   - gemini-* → @langchain/google-genai
 *
 * Thinking / reasoning_effort are honored where the provider exposes
 * them. Falls back gracefully if a model declares thinking but the
 * caller has it disabled.
 */

const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { mergeConfigs } = require('@langchain/core/runnables');
const { logger } = require('../logger');
const {
  auditedProviderFetch,
  withProviderInvocationAudit,
} = require('./provider-http-audit');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const GPT_5_6_MODEL = /^gpt-5\.6(?:-|$)/i;
const GPT_5_6_REASONING_EFFORTS = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
const GPT_5_6_REASONING_LABELS = new Map([
  ['fast', 'none'],
  ['no reasoning', 'none'],
  ['fast / no reasoning', 'none'],
  ['none', 'none'],
  ['light', 'low'],
  ['low', 'low'],
  ['medium', 'medium'],
  ['high', 'high'],
  ['extra high', 'xhigh'],
  ['extra-high', 'xhigh'],
  ['xhigh', 'xhigh'],
  ['max', 'max'],
]);
let localDataService = null;

// Capability → field inside the single 'ai_routing' settings object. A
// null/absent value means "follow the app default model profile".
const ROUTING_FIELDS = {
  'execubriiz-live': 'execubriizLive',
  'execubriiz-deep': 'execubriizDeep',
  background: 'background',
};

// Read the app-level routing override for a capability. Chat is intentionally
// excluded: it persists its choice as the legacy 'selected_model' setting.
function getRoutingModel(capabilityId) {
  const field = ROUTING_FIELDS[capabilityId];
  if (!field || !localDataService) return null;
  const value = localDataService.getSetting?.('ai_routing')?.value?.[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

class AuditedChatOpenAI extends ChatOpenAI {
  async invoke(input, options = {}) {
    const invocationRef = { runId: null };
    const correlationCallback = {
      name: 'briizos-openai-wire-correlation',
      awaitHandlers: true,
      handleChatModelStart: (_llm, _messages, runId) => {
        invocationRef.runId = runId || null;
      },
    };
    const auditedOptions = mergeConfigs(options, { callbacks: [correlationCallback] });
    return withProviderInvocationAudit(
      invocationRef,
      () => super.invoke(input, auditedOptions),
    );
  }

  // ChatOpenAI.bindTools() calls withConfig(). Preserve this subclass so the
  // invocation callback and transport audit are not lost after tools bind.
  withConfig(config) {
    const model = new AuditedChatOpenAI(this.fields);
    model.defaultOptions = {
      ...this.defaultOptions,
      ...config,
    };
    return model;
  }
}

function setLocalDataService(service) {
  localDataService = service;
}

function detectProvider(name) {
  const m = String(name || '').toLowerCase();
  if (m.includes('openai_codex') || m.includes('codex-subscription') || m === 'codex') return 'codex';
  if (m.includes('anthropic') || m.includes('claude')) return 'claude';
  if (m.includes('langchain_openai') || m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('openai')) return 'openai';
  if (m.includes('langchain_google_genai') || m.includes('google') || m.includes('gemini')) return 'gemini';
  return 'gemini';
}

function providerForEntry(entry) {
  return detectProvider(`${entry?.use || ''} ${entry?.model || ''} ${entry?.name || ''}`);
}

function getConfiguredModels() {
  return localDataService?.listModelProfiles?.() || [];
}

function resolveModelConfig(requestedName) {
  const models = getConfiguredModels();
  const requested = requestedName ? String(requestedName) : null;
  const selectedName = localDataService?.getSetting?.('selected_model')?.value;
  const entry = requested
    ? models.find((m) => m.name === requested || m.model === requested || m.display_name === requested)
    : models.find((m) => m.name === selectedName || m.model === selectedName || m.display_name === selectedName)
      || models.find((model) => model.isDefault)
      || models[0];

  if (!entry) {
    if (requested) throw new Error(`Unknown configured model: ${requested}`);
    return {
      name: requested || DEFAULT_MODEL,
      model: requested || DEFAULT_MODEL,
      provider: detectProvider(requested || DEFAULT_MODEL),
      maxTokens: null,
      supportsThinking: false,
      thinking: null,
      raw: null,
    };
  }

  return {
    name: entry.name || entry.model || DEFAULT_MODEL,
    model: entry.model || entry.name || DEFAULT_MODEL,
    provider: entry.provider || providerForEntry(entry),
    adapter: entry.adapter || null,
    maxTokens: Number.isFinite(entry.maxTokens) ? entry.maxTokens : null,
    supportsThinking: !!entry.supportsThinking,
    thinking: entry.thinking || null,
    raw: entry,
  };
}

function getApiKey(provider, modelEntry = null) {
  switch (provider) {
    case 'claude':
      return process.env.ANTHROPIC_API_KEY || localDataService?.getProviderApiKey?.('claude') || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || localDataService?.getProviderApiKey?.('openai') || '';
    case 'gemini':
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || localDataService?.getProviderApiKey?.('gemini') || '';
    default: return '';
  }
}

function isGpt56Model(modelName) {
  return GPT_5_6_MODEL.test(String(modelName || ''));
}

/**
 * GPT-5.6 accepts API values none|low|medium|high|xhigh|max. briizOS uses
 * human-facing labels for those standard efforts, but must never send `light`
 * or `ultra` directly to OpenAI. Ultra is a separate beta multi-agent mode.
 */
function normalizeGpt56ReasoningEffort(value) {
  if (value == null || String(value).trim() === '') return 'medium';
  const label = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  if (label === 'ultra') {
    throw new Error('GPT-5.6 Ultra is a separate Responses multi-agent beta mode, not a reasoning effort. Choose Max for a single-agent request.');
  }
  const effort = GPT_5_6_REASONING_LABELS.get(label) || label;
  if (!GPT_5_6_REASONING_EFFORTS.has(effort)) {
    throw new Error(`Unsupported GPT-5.6 reasoning effort: ${value}. Choose Light, Medium, High, Extra High, Max, or Fast / No reasoning.`);
  }
  return effort;
}

/**
 * Resolve the exact non-secret constructor settings that will reach the
 * provider adapter. Keeping this separate from credential lookup lets the
 * audit ledger explain failed configuration/model resolution without ever
 * receiving an API key.
 *
 * @param {object} opts
 * @param {string|null} opts.name              Model name (e.g. 'claude-sonnet-4-6').
 * @param {boolean} opts.thinkingEnabled       Enable extended thinking where supported.
 * @param {string|null} opts.reasoningEffort   GPT-5.6: none|low|medium|high|xhigh|max, with UI labels such as Light and Extra High accepted.
 * @param {number|null} opts.temperature       Optional override.
 */
function resolveChatModelRequest({
  name = null,
  thinkingEnabled = false,
  reasoningEffort = null,
  temperature = null,
  topP = null,
  maxTokens = null,
} = {}) {
  const resolved = resolveModelConfig(name);
  const modelName = resolved.model;
  const provider = resolved.provider;
  const adapter = provider === 'codex' ? 'openai_codex:AppServer'
    : provider === 'claude' ? 'langchain_anthropic:ChatAnthropic'
    : provider === 'openai' ? 'langchain_openai:ChatOpenAI'
      : 'langchain_google_genai:ChatGoogleGenerativeAI';
  if (resolved.adapter && resolved.adapter !== adapter) {
    throw new Error(`Model adapter mismatch for ${resolved.name}`);
  }

  const common = { model: modelName, streaming: true };
  const outputTokens = maxTokens == null ? resolved.maxTokens : Math.min(maxTokens, resolved.maxTokens || maxTokens);
  const gpt56Model = provider === 'openai' && isGpt56Model(modelName);
  const openAIReasoningModel = provider === 'openai' && (/^o[13](?:-|$)/.test(modelName) || /^gpt-5(?:\.|-|$)/.test(modelName));
  const effectiveOpenAIReasoningEffort = provider === 'openai'
    ? (gpt56Model ? normalizeGpt56ReasoningEffort(reasoningEffort) : reasoningEffort || null)
    : null;
  if (temperature != null && !openAIReasoningModel && !(provider === 'claude' && thinkingEnabled && resolved.supportsThinking)) {
    common.temperature = temperature;
  }

  let constructorOptions;
  switch (provider) {
    case 'codex': {
      constructorOptions = { streaming: true, subscriptionAuth: true };
      break;
    }
    case 'claude': {
      constructorOptions = { ...common };
      if (outputTokens != null) constructorOptions.maxTokens = outputTokens;
      if (topP != null && !(thinkingEnabled && resolved.supportsThinking)) constructorOptions.topP = topP;
      if (thinkingEnabled && resolved.supportsThinking) {
        const configuredBudget = resolved.thinking?.budget_tokens || 4096;
        const budgetTokens = outputTokens == null
          ? configuredBudget
          : Math.min(configuredBudget, Math.max(1024, outputTokens - 1024));
        constructorOptions.thinking = {
          ...(resolved.thinking || { type: 'enabled' }),
          budget_tokens: budgetTokens,
        };
      }
      break;
    }
    case 'openai': {
      constructorOptions = { ...common, maxRetries: 0 };
      if (outputTokens != null) constructorOptions.maxTokens = outputTokens;
      if (topP != null && !openAIReasoningModel) constructorOptions.topP = topP;
      if (gpt56Model) constructorOptions.useResponsesApi = true;
      if (effectiveOpenAIReasoningEffort) constructorOptions.reasoning = { effort: effectiveOpenAIReasoningEffort };
      break;
    }
    case 'gemini':
    default: {
      constructorOptions = { ...common };
      if (outputTokens != null) constructorOptions.maxOutputTokens = outputTokens;
      if (topP != null) constructorOptions.topP = topP;
      break;
    }
  }

  return {
    provider,
    model: modelName,
    profileName: resolved.name,
    adapter,
    constructorOptions,
    effectiveParameters: {
      streaming: true,
      temperature: constructorOptions.temperature ?? null,
      top_p: constructorOptions.topP ?? null,
      max_tokens: outputTokens ?? null,
      provider_max_tokens_parameter: provider === 'gemini'
        ? 'maxOutputTokens'
        : gpt56Model ? 'max_output_tokens' : 'maxTokens',
      thinking: constructorOptions.thinking || false,
      reasoning_effort: constructorOptions.reasoning?.effort ?? null,
      provider_reasoning_parameter: gpt56Model && constructorOptions.reasoning ? 'reasoning.effort' : null,
      openai_endpoint: gpt56Model ? '/v1/responses' : null,
    },
    modelCapabilities: {
      supports_thinking: resolved.supportsThinking,
      openai_reasoning_model: openAIReasoningModel,
      openai_responses_api: gpt56Model,
      gpt_5_6: gpt56Model,
    },
  };
}

/**
 * Create a chat model instance for use in a LangGraph agent.
 */
function createChatModel(options = {}) {
  const request = resolveChatModelRequest(options);
  const resolved = resolveModelConfig(options.name);
  if (request.provider === 'codex') {
    throw new Error('Codex Subscription turns must use the Codex app-server provider path.');
  }
  const apiKey = getApiKey(request.provider, resolved.raw);
  if (!apiKey) {
    throw new Error(`No encrypted API credential is configured for ${request.provider}`);
  }

  logger.info('agent.models', 'AI request settings were resolved locally. The provider has not accepted or processed the request yet.', {
    profileName: request.profileName,
    modelName: request.model,
    provider: request.provider,
    adapter: request.adapter,
    effectiveParameters: request.effectiveParameters,
    providerContactedByThisStep: false,
  });

  const constructorOptions = {
    ...request.constructorOptions,
    apiKey,
    metadata: {
      briizos_effective_model_config: {
        provider: request.provider,
        model: request.model,
        profile_name: request.profileName,
        adapter: request.adapter,
        parameters: request.effectiveParameters,
        capabilities: request.modelCapabilities,
      },
    },
  };
  switch (request.provider) {
    case 'claude':
      return new ChatAnthropic(constructorOptions);
    case 'openai':
      return new AuditedChatOpenAI({
        ...constructorOptions,
        configuration: {
          fetch: auditedProviderFetch,
          maxRetries: 0,
        },
      });
    case 'gemini':
    default:
      return new ChatGoogleGenerativeAI(constructorOptions);
  }
}

module.exports = {
  createChatModel,
  detectProvider,
  resolveChatModelRequest,
  getRoutingModel,
  ROUTING_FIELDS,
  isGpt56Model,
  normalizeGpt56ReasoningEffort,
  DEFAULT_MODEL,
  setLocalDataService,
};
