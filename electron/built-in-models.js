const BUILT_IN_MODELS = Object.freeze([
  { name: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', provider: 'claude', model: 'claude-sonnet-4-6', maxTokens: 64000, supportsVision: true, supportsThinking: true, thinking: { type: 'enabled' } },
  { name: 'claude-opus-4-6', displayName: 'Claude Opus 4.6', provider: 'claude', model: 'claude-opus-4-6', maxTokens: 32000, supportsVision: true, supportsThinking: true, thinking: { type: 'enabled', budget_tokens: 10000 } },
  { name: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5', provider: 'claude', model: 'claude-sonnet-4-5-20250929', maxTokens: 64000, supportsVision: true, supportsThinking: true, thinking: { type: 'enabled' } },
  { name: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5', provider: 'claude', model: 'claude-haiku-4-5-20251001', maxTokens: 16000, supportsVision: true, supportsThinking: false },
  { name: 'claude-opus-4-20250514', displayName: 'Claude Opus 4', provider: 'claude', model: 'claude-opus-4-20250514', maxTokens: 32000, supportsVision: true, supportsThinking: true, thinking: { type: 'enabled', budget_tokens: 10000 } },
  { name: 'gpt-5.4-2026-03-05', displayName: 'GPT-5.4', provider: 'openai', model: 'gpt-5.4-2026-03-05', maxTokens: 128000, supportsVision: true, supportsThinking: false },
  { name: 'gpt-5.2', displayName: 'GPT-5.2', provider: 'openai', model: 'gpt-5.2', maxTokens: 128000, supportsVision: true, supportsThinking: false },
  { name: 'gpt-5.1-codex-mini', displayName: 'GPT-5.1 Codex Mini', provider: 'openai', model: 'gpt-5.1-codex-mini', maxTokens: 32768, supportsVision: false, supportsThinking: false },
  { name: 'gpt-5-mini', displayName: 'GPT-5 Mini', provider: 'openai', model: 'gpt-5-mini', maxTokens: 32768, supportsVision: true, supportsThinking: false },
  { name: 'gpt-4.1-2025-04-14', displayName: 'GPT-4.1', provider: 'openai', model: 'gpt-4.1-2025-04-14', maxTokens: 32768, supportsVision: true, supportsThinking: false },
  { name: 'gpt-4.1-mini-2025-04-14', displayName: 'GPT-4.1 Mini', provider: 'openai', model: 'gpt-4.1-mini-2025-04-14', maxTokens: 32768, supportsVision: true, supportsThinking: false },
  { name: 'gpt-4.1-nano', displayName: 'GPT-4.1 Nano', provider: 'openai', model: 'gpt-4.1-nano', maxTokens: 16384, supportsVision: true, supportsThinking: false },
  { name: 'o3', displayName: 'o3', provider: 'openai', model: 'o3', maxTokens: 100000, supportsVision: true, supportsThinking: false },
  { name: 'o3-mini', displayName: 'o3-mini', provider: 'openai', model: 'o3-mini', maxTokens: 65536, supportsVision: false, supportsThinking: false },
  { name: 'o1', displayName: 'o1', provider: 'openai', model: 'o1', maxTokens: 100000, supportsVision: true, supportsThinking: false },
  { name: 'gemini-3.1-pro-preview', displayName: 'Gemini 3.1 Pro Preview', provider: 'gemini', model: 'gemini-3.1-pro-preview', maxTokens: 65536, supportsVision: true, supportsThinking: false },
  { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'gemini', model: 'gemini-2.5-pro', maxTokens: 65536, supportsVision: true, supportsThinking: false },
  { name: 'gemini-2.5-flash-preview-05-20', displayName: 'Gemini 2.5 Flash', provider: 'gemini', model: 'gemini-2.5-flash-preview-05-20', maxTokens: 65536, supportsVision: true, supportsThinking: false },
  { name: 'gemini-flash-latest', displayName: 'Gemini Flash Latest', provider: 'gemini', model: 'gemini-flash-latest', maxTokens: 65536, supportsVision: true, supportsThinking: false },
  { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'gemini', model: 'gemini-2.0-flash', maxTokens: 8192, supportsVision: true, supportsThinking: false },
]);

module.exports = { BUILT_IN_MODELS };
