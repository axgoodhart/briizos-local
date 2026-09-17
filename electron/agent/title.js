/**
 * Thread title generation.
 *
 * Source parity:
 *   - agent/src/agents/middlewares/title_middleware.py
 *   - agent/src/config/title_config.py
 */

const { createChatModel } = require('./models');
const DEFAULT_PROMPT = 'Generate a concise title (max {max_words} words) for this conversation.\nUser: {user_msg}\nAssistant: {assistant_msg}\n\nReturn ONLY the title, no quotes, no explanation.';

function readConfig() {
  return { title: { enabled: true, max_words: 6, max_chars: 60 } };
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

function shouldGenerateTitle(state, config = readConfig()) {
  const titleConfig = config.title || {};
  if (titleConfig.enabled === false) return false;
  if (state?.title) return false;
  const messages = state?.messages || [];
  const userMessages = messages.filter((msg) => messageRole(msg) === 'human');
  const assistantMessages = messages.filter((msg) => messageRole(msg) === 'ai');
  if (userMessages.length !== 1 || assistantMessages.length < 1) return false;
  const last = messages[messages.length - 1];
  return messageRole(last) === 'ai' && !hasToolCalls(last);
}

function fallbackTitle(userMsg, maxChars) {
  const limit = Math.min(maxChars || 60, 50);
  if (!userMsg) return 'New Conversation';
  return userMsg.length > limit ? `${userMsg.slice(0, limit).trimEnd()}...` : userMsg;
}

async function generateTitle(state, { modelName = null } = {}) {
  const config = readConfig();
  const titleConfig = config.title || {};
  const maxWords = titleConfig.max_words || 6;
  const maxChars = titleConfig.max_chars || 60;
  const userMsg = messageContent((state.messages || []).find((msg) => messageRole(msg) === 'human')).slice(0, 500);
  const assistantMsg = messageContent((state.messages || []).find((msg) => messageRole(msg) === 'ai')).slice(0, 500);

  const prompt = (titleConfig.prompt_template || DEFAULT_PROMPT)
    .replace('{max_words}', String(maxWords))
    .replace('{user_msg}', userMsg)
    .replace('{assistant_msg}', assistantMsg);

  try {
    const model = createChatModel({ name: titleConfig.model_name || modelName || null, thinkingEnabled: false });
    const response = await model.invoke(prompt);
    const raw = response.content;
    const text = Array.isArray(raw)
      ? raw.map((p) => (typeof p === 'string' ? p : p?.text || '')).filter(Boolean).join(' ')
      : String(raw || '');
    const title = text.trim().replace(/^["']|["']$/g, '');
    return title ? title.slice(0, maxChars) : fallbackTitle(userMsg, maxChars);
  } catch {
    return fallbackTitle(userMsg, maxChars);
  }
}

function createTitlePostModelHook({ modelName = null } = {}) {
  return async (state, config) => {
    if (config?.configurable?.disable_title_generation) return {};
    if (!shouldGenerateTitle(state)) return {};
    const title = await generateTitle(state, { modelName });
    return title ? { title } : {};
  };
}

module.exports = {
  createTitlePostModelHook,
  generateTitle,
  shouldGenerateTitle,
};
