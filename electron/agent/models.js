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
let localDataService = null;

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
  const entry = requested
    ? models.find((m) => m.name === requested || m.model === requested || m.display_name === requested)
    : models.find((model) => model.isDefault) || models[0];

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

/**
 * Resolve the exact non-secret constructor settings that will reach the
 * provider adapter. Keeping this separate from credential lookup lets the
 * audit ledger explain failed configuration/model resolution without ever
 * receiving an API key.
 *
 * @param {object} opts
 * @param {string|null} opts.name              Model name (e.g. 'claude-sonnet-4-6').
 * @param {boolean} opts.thinkingEnabled       Enable extended thinking where supported.
 * @param {string|null} opts.reasoningEffort   e.g. 'minimal' | 'low' | 'medium' | 'high'.
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
  const adapter = provider === 'claude' ? 'langchain_anthropic:ChatAnthropic'
    : provider === 'openai' ? 'langchain_openai:ChatOpenAI'
      : 'langchain_google_genai:ChatGoogleGenerativeAI';
  if (resolved.adapter && resolved.adapter !== adapter) {
    throw new Error(`Model adapter mismatch for ${resolved.name}`);
  }

  const common = { model: modelName, streaming: true };
  const outputTokens = maxTokens == null ? resolved.maxTokens : Math.min(maxTokens, resolved.maxTokens || maxTokens);
  const openAIReasoningModel = provider === 'openai' && (/^o[13](?:-|$)/.test(modelName) || /^gpt-5(?:\.|-|$)/.test(modelName));
  if (temperature != null && !openAIReasoningModel && !(provider === 'claude' && thinkingEnabled && resolved.supportsThinking)) {
    common.temperature = temperature;
  }

  let constructorOptions;
  switch (provider) {
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
      if (reasoningEffort) constructorOptions.reasoningEffort = reasoningEffort;
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
      provider_max_tokens_parameter: provider === 'gemini' ? 'maxOutputTokens' : 'maxTokens',
      thinking: constructorOptions.thinking || false,
      reasoning_effort: constructorOptions.reasoningEffort ?? null,
    },
    modelCapabilities: {
      supports_thinking: resolved.supportsThinking,
      openai_reasoning_model: openAIReasoningModel,
    },
  };
}

/**
 * Create a chat model instance for use in a LangGraph agent.
 */
function createChatModel(options = {}) {
  const request = resolveChatModelRequest(options);
  const resolved = resolveModelConfig(options.name);
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
  DEFAULT_MODEL,
  setLocalDataService,
};
