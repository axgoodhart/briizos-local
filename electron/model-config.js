/**
 * Model Configuration Reader
 *
 * Reads deerflow/config.yaml and extracts sanitized model information
 * for the Electron renderer. API keys are NEVER exposed to the renderer.
 *
 * Exports: getModels(), getModelConfig(name), getConfigPath(), checkApiKeyStatus()
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('./logger');

const CONFIG_PATH = path.resolve(__dirname, '../agent/config.yaml');

// ---------------------------------------------------------------------------
// Caching (mtime-based invalidation)
// ---------------------------------------------------------------------------

let cachedConfig = null;
let cachedMtime = null;

/**
 * Load and parse config.yaml with mtime-based caching.
 * Returns the parsed YAML object, or null on error.
 */
function loadConfig() {
  try {
    const stat = fs.statSync(CONFIG_PATH);
    const mtime = stat.mtimeMs;

    // Return cached config if file hasn't changed
    if (cachedConfig && cachedMtime === mtime) {
      return cachedConfig;
    }

    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = yaml.load(raw);

    cachedConfig = parsed;
    cachedMtime = mtime;

    logger.info('model-config', 'Loaded config.yaml', { path: CONFIG_PATH, models: parsed?.models?.length ?? 0 });
    return parsed;
  } catch (err) {
    logger.warn('model-config', 'Failed to load config.yaml', { path: CONFIG_PATH, error: err?.message });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider derivation
// ---------------------------------------------------------------------------

/**
 * Derive a provider name from the DeerFlow `use` field.
 * Maps langchain-style names to direct API provider names.
 * e.g. "langchain_anthropic:ChatAnthropic" -> "claude"
 */
function deriveProvider(useField) {
  if (!useField || typeof useField !== 'string') return 'unknown';

  const mod = String(useField).toLowerCase();

  // Robust mapping: handle various module path variants
  if (mod.includes('anthropic')) return 'claude';
  if (mod.includes('openai')) return 'openai';
  if (mod.includes('google_genai') || mod.includes('google') || mod.includes('gemini')) return 'gemini';

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return an array of safe model objects for the renderer.
 * Sensitive fields (api_key, google_api_key) are stripped.
 */
function getModels() {
  const config = loadConfig();
  if (!config || !Array.isArray(config.models)) {
    return [];
  }

  return config.models.map((m) => ({
    name: m.name,
    display_name: m.display_name || m.name,
    provider: deriveProvider(m.use),
    model: m.model,
    max_tokens: m.max_tokens || null,
    supports_vision: !!m.supports_vision,
    supports_thinking: !!m.when_thinking_enabled,
  }));
}

/**
 * Return a single model's safe config by name, or null if not found.
 */
function getModelConfig(modelName) {
  const models = getModels();
  return models.find((m) => m.name === modelName) || null;
}

/**
 * Return the resolved config file path (for debugging).
 */
function getConfigPath() {
  return CONFIG_PATH;
}

/**
 * Check which provider API keys are set in the environment.
 * Returns { anthropic: boolean, openai: boolean, google: boolean }.
 */
function checkApiKeyStatus() {
  const config = loadConfig();
  const models = Array.isArray(config?.models) ? config.models : [];

  const hasAnthropicFromConfig = models.some((m) => deriveProvider(m?.use) === 'claude' && !!m?.api_key);
  const hasOpenAIFromConfig = models.some((m) => deriveProvider(m?.use) === 'openai' && !!m?.api_key);
  const hasGeminiFromConfig = models.some((m) => deriveProvider(m?.use) === 'gemini' && !!m?.google_api_key);

  return {
    // Backward-compatible keys used by existing UI components
    anthropic: !!process.env.ANTHROPIC_API_KEY || hasAnthropicFromConfig,
    openai: !!process.env.OPENAI_API_KEY || hasOpenAIFromConfig,
    google: !!process.env.GEMINI_API_KEY || hasGeminiFromConfig,

    // Direct-provider aliases
    claude: !!process.env.ANTHROPIC_API_KEY || hasAnthropicFromConfig,
    gemini: !!process.env.GEMINI_API_KEY || hasGeminiFromConfig,
  };
}

/**
 * Return true if at least one configured model has credentials available.
 * Credentials may come from environment variables or from config.yaml fields.
 *
 * Note: This returns a boolean only; sensitive values are never returned.
 */
function isAIConfigured() {
  const config = loadConfig();
  const models = config?.models;
  if (!Array.isArray(models) || models.length === 0) return false;

  for (const m of models) {
    const provider = deriveProvider(m?.use);
    if (provider === 'openai') {
      if (!!process.env.OPENAI_API_KEY || !!m?.api_key) return true;
    } else if (provider === 'claude') {
      if (!!process.env.ANTHROPIC_API_KEY || !!m?.api_key) return true;
    } else if (provider === 'gemini') {
      if (!!process.env.GEMINI_API_KEY || !!m?.google_api_key) return true;
    }
  }

  return false;
}

module.exports = { getModels, getModelConfig, getConfigPath, checkApiKeyStatus, isAIConfigured };
