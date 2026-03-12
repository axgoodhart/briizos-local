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

const CONFIG_PATH = path.resolve(__dirname, '../../deerflow/config.yaml');

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
 * e.g. "langchain_anthropic:ChatAnthropic" -> "anthropic"
 */
function deriveProvider(useField) {
  if (!useField || typeof useField !== 'string') return 'unknown';

  const modulePart = useField.split(':')[0];
  if (modulePart.startsWith('langchain_anthropic')) return 'anthropic';
  if (modulePart.startsWith('langchain_openai')) return 'openai';
  if (modulePart.startsWith('langchain_google_genai')) return 'google';
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
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GEMINI_API_KEY,
  };
}

module.exports = { getModels, getModelConfig, getConfigPath, checkApiKeyStatus };
