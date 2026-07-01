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
const { logger } = require('../logger');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
let localDataService = null;

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
 * Create a chat model instance for use in a LangGraph agent.
 *
 * @param {object} opts
 * @param {string|null} opts.name              Model name (e.g. 'claude-sonnet-4-6').
 * @param {boolean} opts.thinkingEnabled       Enable extended thinking where supported.
 * @param {string|null} opts.reasoningEffort   e.g. 'minimal' | 'low' | 'medium' | 'high'.
 * @param {number|null} opts.temperature       Optional override.
 */
function createChatModel({ name = null, thinkingEnabled = false, reasoningEffort = null, temperature = null, topP = null, maxTokens = null } = {}) {
  const resolved = resolveModelConfig(name);
  const modelName = resolved.model;
  const provider = resolved.provider;
  const apiKey = getApiKey(provider, resolved.raw);

  if (!apiKey) {
    throw new Error(`No encrypted API credential is configured for ${provider}`);
  }

  const adapter = provider === 'claude' ? 'langchain_anthropic:ChatAnthropic'
    : provider === 'openai' ? 'langchain_openai:ChatOpenAI'
      : 'langchain_google_genai:ChatGoogleGenerativeAI';
  if (resolved.adapter && resolved.adapter !== adapter) {
    throw new Error(`Model adapter mismatch for ${resolved.name}`);
  }
  logger.info('agent.models', 'Model request configured', {
    profileName: resolved.name,
    modelName,
    provider,
    adapter,
    thinkingEnabled: thinkingEnabled && resolved.supportsThinking,
  });

  const common = { model: modelName, streaming: true };
  const outputTokens = maxTokens == null ? resolved.maxTokens : Math.min(maxTokens, resolved.maxTokens || maxTokens);
  const openAIReasoningModel = provider === 'openai' && (/^o[13](?:-|$)/.test(modelName) || /^gpt-5(?:\.|-|$)/.test(modelName));
  if (temperature != null && !openAIReasoningModel && !(provider === 'claude' && thinkingEnabled && resolved.supportsThinking)) {
    common.temperature = temperature;
  }

  switch (provider) {
    case 'claude': {
      const opts = { ...common, apiKey };
      if (outputTokens != null) opts.maxTokens = outputTokens;
      if (topP != null && !(thinkingEnabled && resolved.supportsThinking)) opts.topP = topP;
      if (thinkingEnabled && resolved.supportsThinking) {
        const configuredBudget = resolved.thinking?.budget_tokens || 4096;
        const budgetTokens = outputTokens == null
          ? configuredBudget
          : Math.min(configuredBudget, Math.max(1024, outputTokens - 1024));
        opts.thinking = {
          ...(resolved.thinking || { type: 'enabled' }),
          budget_tokens: budgetTokens,
        };
      }
      return new ChatAnthropic(opts);
    }
    case 'openai': {
      const opts = { ...common, apiKey };
      if (outputTokens != null) opts.maxTokens = outputTokens;
      if (topP != null && !openAIReasoningModel) opts.topP = topP;
      if (reasoningEffort) opts.reasoningEffort = reasoningEffort;
      return new ChatOpenAI(opts);
    }
    case 'gemini':
    default: {
      const opts = { ...common, apiKey };
      if (outputTokens != null) opts.maxOutputTokens = outputTokens;
      if (topP != null) opts.topP = topP;
      return new ChatGoogleGenerativeAI(opts);
    }
  }
}

module.exports = { createChatModel, detectProvider, DEFAULT_MODEL, setLocalDataService };
