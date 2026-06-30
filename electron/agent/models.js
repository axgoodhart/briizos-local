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

const DEFAULT_MODEL = 'gemini-2.5-flash';
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
    : models[0];

  if (!entry) {
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
    provider: providerForEntry(entry),
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
function createChatModel({ name = null, thinkingEnabled = false, reasoningEffort = null, temperature = null } = {}) {
  const resolved = resolveModelConfig(name);
  const modelName = resolved.model;
  const provider = resolved.provider;
  const apiKey = getApiKey(provider, resolved.raw);

  if (!apiKey) {
    logger.warn('agent.models', `No API key for ${provider}; model calls will fail`, { modelName });
  }

  const common = { model: modelName, streaming: true };
  if (temperature != null) common.temperature = temperature;

  switch (provider) {
    case 'claude': {
      const opts = { ...common, apiKey };
      if (resolved.maxTokens != null) opts.maxTokens = resolved.maxTokens;
      if (thinkingEnabled && resolved.supportsThinking) {
        opts.thinking = {
          ...(resolved.thinking || { type: 'enabled' }),
          budget_tokens: resolved.thinking?.budget_tokens || 4096,
        };
      }
      return new ChatAnthropic(opts);
    }
    case 'openai': {
      const opts = { ...common, apiKey };
      if (resolved.maxTokens != null) opts.maxTokens = resolved.maxTokens;
      if (reasoningEffort) opts.reasoningEffort = reasoningEffort;
      return new ChatOpenAI(opts);
    }
    case 'gemini':
    default: {
      const opts = { ...common, apiKey };
      if (resolved.maxTokens != null) opts.maxOutputTokens = resolved.maxTokens;
      return new ChatGoogleGenerativeAI(opts);
    }
  }
}

module.exports = { createChatModel, detectProvider, DEFAULT_MODEL, setLocalDataService };
