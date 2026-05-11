/**
 * Chat API Module - Direct client-side streaming to AI providers
 * Adapted from briizOS.Web chat-module for Electron environment
 * 
 * This module provides direct API access to Gemini, Claude, and OpenAI
 * without requiring a LangGraph/LangChain backend.
 */

// Sentinel markers for the inline follow-up suggestions trailer.
// Kept distinct from the existing ```json``` tool-call fence so the two
// streaming parsers do not collide.
const SUGGESTIONS_START = '<<<BRIIZ_SUGGESTIONS>>>';
const SUGGESTIONS_END = '<<<END>>>';
// Longest partial prefix of SUGGESTIONS_START we might see at the tail of
// a streamed chunk. Used to know how much trailing text to hold back while
// waiting for confirmation that it is (or is not) the start of a sentinel.
const SUGGESTIONS_HOLDBACK = SUGGESTIONS_START.length;

class ChatAPI {
  constructor() {
    this.enableTools = true; // Enable tool calling by default
    this.buffer = ''; // Buffer for detecting JSON tool calls
    this.suggestionsEnabled = false; // Per-call flag, set in streamChat()
    this.suggestionsBuffer = ''; // Per-call buffer for sentinel detection
  }

  /**
   * Filter a streamed text chunk for the suggestions sentinel.
   *
   * Returns the portion that is safe to yield to the UI right now.
   * Holds back any trailing bytes that look like a partial or full sentinel
   * start so the user never sees the raw `<<<BRIIZ_SUGGESTIONS>>>...` tag
   * flicker mid-stream. Once the closing `<<<END>>>` arrives, the full
   * trailer is consumed and parsed by `flushSuggestionsTrailer()`.
   *
   * @param {string} text
   * @returns {string} Text safe to forward downstream (may be empty).
   */
  processForSuggestions(text) {
    if (!this.suggestionsEnabled) return text;
    if (typeof text !== 'string' || text.length === 0) return '';

    this.suggestionsBuffer += text;

    // Case 1: full sentinel start has been seen — hold everything from there on.
    const startIdx = this.suggestionsBuffer.indexOf(SUGGESTIONS_START);
    if (startIdx !== -1) {
      const safe = this.suggestionsBuffer.slice(0, startIdx);
      this.suggestionsBuffer = this.suggestionsBuffer.slice(startIdx);
      return safe;
    }

    // Case 2: no full start marker yet. Check if the tail of the buffer
    // could be a partial start. We only need to hold back at most
    // SUGGESTIONS_HOLDBACK - 1 trailing characters.
    const tail = this.suggestionsBuffer.slice(-SUGGESTIONS_HOLDBACK);
    let partialLen = 0;
    for (let i = 1; i <= tail.length; i++) {
      const candidate = tail.slice(-i);
      if (SUGGESTIONS_START.startsWith(candidate)) {
        partialLen = i;
      }
    }

    if (partialLen > 0) {
      const cut = this.suggestionsBuffer.length - partialLen;
      const safe = this.suggestionsBuffer.slice(0, cut);
      this.suggestionsBuffer = this.suggestionsBuffer.slice(cut);
      return safe;
    }

    // No partial — flush the whole buffer as safe text.
    const safe = this.suggestionsBuffer;
    this.suggestionsBuffer = '';
    return safe;
  }

  /**
   * Drain any held-back content at the end of a stream and try to extract
   * a complete suggestions trailer from it.
   *
   * @returns {{ items: string[] | null, leftoverText: string }}
   *   - items: parsed suggestions array (max 4) or null if no valid trailer
   *   - leftoverText: any held-back text that turned out NOT to be a trailer,
   *     so the caller can yield it back as plain message content.
   */
  flushSuggestionsTrailer() {
    if (!this.suggestionsEnabled || !this.suggestionsBuffer) {
      const leftover = this.suggestionsBuffer || '';
      this.suggestionsBuffer = '';
      return { items: null, leftoverText: leftover };
    }

    const buf = this.suggestionsBuffer;
    this.suggestionsBuffer = '';

    const re = new RegExp(
      SUGGESTIONS_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*(\\[[\\s\\S]*?\\])\\s*' +
      SUGGESTIONS_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const match = re.exec(buf);

    if (!match) {
      // Buffer held something that started like a sentinel but never closed.
      // Leak it back so the user sees it instead of silently dropping content.
      return { items: null, leftoverText: buf };
    }

    let items = null;
    try {
      const arr = JSON.parse(match[1]);
      if (Array.isArray(arr)) {
        const cleaned = arr
          .filter((s) => typeof s === 'string')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => (s.length > 120 ? s.slice(0, 120) : s))
          .slice(0, 4);
        if (cleaned.length > 0) items = cleaned;
      }
    } catch (_) {
      // Malformed JSON inside a valid sentinel pair — drop the trailer
      // (do not surface raw JSON garbage to the user).
      items = null;
    }

    const before = buf.slice(0, match.index);
    const after = buf.slice(match.index + match[0].length);
    const leftoverText = (before + after).trim() ? before + after : '';
    return { items, leftoverText };
  }

  /**
   * Resolve API key for a provider from environment or config
   */
  async ensureApiKey(provider) {
    // In Electron, API keys are managed by the main process
    // We'll call the main process to get the appropriate key
    if (typeof window !== 'undefined' && window.api?.getApiKey) {
      const key = await window.api.getApiKey(provider);
      if (key) return key;
    }

    // Fallback: try to get from localStorage (for development)
    const keyMap = {
      gemini: 'GEMINI_API_KEY',
      google: 'GEMINI_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      chatgpt: 'OPENAI_API_KEY',
    };

    const storageKey = keyMap[provider];
    if (!storageKey) throw new Error(`Unknown provider: ${provider}`);

    let key = null;
    try {
      key = localStorage.getItem(storageKey);
    } catch (_) {}

    if (!key) {
      throw new Error(`${provider} API key not configured. Please set it in settings.`);
    }

    return key;
  }

  /**
   * Inject system prompt with tool definitions
   * @param {Array} messages
   * @param {string|null} customPrompt
   * @param {Object} [opts]
   * @param {boolean} [opts.suggestionsEnabled=false]
   * @param {string} [opts.contextAddendum] - Extra runtime context appended to system prompt
   */
  injectSystemPrompt(messages, customPrompt = null, opts = {}) {
    const hasSystem = messages.some(m => m.role === 'system');
    if (hasSystem) return messages;

    // Always start with the base tool-enabled prompt
    let systemContent = '';
    if (this.enableTools && window.systemPrompt) {
      systemContent = window.systemPrompt.getSystemPrompt({
        suggestionsEnabled: !!opts.suggestionsEnabled,
      });
    }

    // Append custom prompt (doesn't replace — tools stay available)
    if (customPrompt && customPrompt.trim()) {
      systemContent += `\n\n# User Custom Instructions\n\n${customPrompt.trim()}`;
    }

    // Append runtime context addendum (selected files, capabilities, etc.)
    if (opts.contextAddendum && opts.contextAddendum.trim()) {
      systemContent += `\n\n# Runtime Context\n\n${opts.contextAddendum.trim()}`;
    }

    if (!systemContent) return messages;

    return [{ role: 'system', content: systemContent }, ...messages];
  }

  /**
   * Parse text for JSON tool calls
   */
  parseForToolCalls(text) {
    const results = [];
    this.buffer += text;

    // Look for JSON blocks with tool calls
    const jsonRegex = /```json\s*(\{[^`]*\})\s*```/g;
    let match;

    // Valid tool names to prevent false positives
    const validTools = [
      // Original tools
      'getScheduleSummary', 'searchNotes', 'findScheduleConflicts', 'lookupOnline',
      'openPanel', 'startTimer', 'tilePanels',
      'createPrioritizedTaskList',
      'createSingleCalendarEvent', 'updateCalendarEvent', 'createRecurringCalendarEvent',
      'createThoughtStream',
      // Phase 1: Core AI Tool Expansion
      'createNotePanel', 'setPanelColor', 'updateNoteContent', 'movePanel', 'resizePanel', 'setPanelTitle',
      // Phase 2: Advanced Panel Operations
      'duplicatePanel', 'deletePanel', 'minimizePanel', 'restorePanel',
      // Phase 3: Workspace Organization
      'groupPanelsByType', 'stackPanelsVertically', 'focusMode', 'closeAllPanels', 'minimizeAllPanels',
      // Phase 4: Task Management
      'completeTask',
      // Filesystem + terminal tools
      'agentReadFile', 'agentWriteFile', 'agentDeleteFile', 'agentMoveFile', 'agentCopyFile', 'agentListDir', 'runCommand'
    ];

    while ((match = jsonRegex.exec(this.buffer)) !== null) {
      try {
        const jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);

        // Strict validation: must have tool and params, tool must be valid
        if (parsed.tool &&
            typeof parsed.tool === 'string' &&
            validTools.includes(parsed.tool) &&
            parsed.params &&
            typeof parsed.params === 'object') {

          console.log('Valid tool call detected:', parsed.tool);

          results.push({
            type: 'tool_call',
            tool: parsed.tool,
            params: parsed.params
          });

          // Remove the JSON block from buffer
          this.buffer = this.buffer.replace(match[0], '');
        } else {
          console.log('Invalid tool call ignored:', parsed);
        }
      } catch (e) {
        // Not valid JSON, continue
        console.debug('JSON parse error:', e);
      }
    }

    // Flush text that's unlikely to contain a JSON block
    if (this.buffer.length > 500 && !this.buffer.includes('```json')) {
      const textToYield = this.buffer;
      this.buffer = '';
      results.push({ type: 'text', content: textToYield });
    }

    return results;
  }

  /**
   * Flush remaining buffer
   */
  flushBuffer() {
    const results = [];
    if (this.buffer) {
      results.push({ type: 'text', content: this.buffer });
      this.buffer = '';
    }
    return results;
  }

  /**
   * ===== GEMINI DIRECT API =====
   */
  async *streamGemini(messages, model, apiKey, params = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : (msg.role === 'system' ? 'user' : msg.role),
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      contents,
      generationConfig: {
        temperature: params.temperature ?? 1.0,
        topP: params.top_p ?? 1.0,
        maxOutputTokens: params.max_tokens ?? 1024,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.body) throw new Error('No response body from Gemini');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                if (this.enableTools) {
                  // Parse for tool calls
                  const parsed = this.parseForToolCalls(text);
                  for (const item of parsed) {
                    if (item.type === 'tool_call') {
                      yield item;
                    } else if (item.type === 'text') {
                      const safe = this.processForSuggestions(item.content);
                      if (safe) yield safe;
                    }
                  }
                } else {
                  const safe = this.processForSuggestions(text);
                  if (safe) yield safe;
                }
              }
            } catch (_) { /* ignore parse errors */ }
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  /**
   * ===== CLAUDE DIRECT API =====
   */
  async *streamClaude(messages, model, apiKey, params = {}) {
    const url = 'https://api.anthropic.com/v1/messages';

    const claudeMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    const systemMessage = messages.find(m => m.role === 'system')?.content;

    const requestBody = {
      model,
      max_tokens: params.max_tokens ?? 4096,
      temperature: params.temperature ?? 1.0,
      top_p: params.top_p ?? 1.0,
      messages: claudeMessages,
      stream: true,
    };

    if (systemMessage) {
      requestBody.system = systemMessage;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.body) throw new Error('No response body from Claude');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data?.delta?.text) {
                const text = data.delta.text;
                if (this.enableTools) {
                  // Parse for tool calls
                  const parsed = this.parseForToolCalls(text);
                  for (const item of parsed) {
                    if (item.type === 'tool_call') {
                      yield item;
                    } else if (item.type === 'text') {
                      const safe = this.processForSuggestions(item.content);
                      if (safe) yield safe;
                    }
                  }
                } else {
                  const safe = this.processForSuggestions(text);
                  if (safe) yield safe;
                }
              }
            } catch (_) { /* ignore parse errors */ }
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  /**
   * ===== OPENAI DIRECT API (Responses API, streaming SSE) =====
   * Uses /v1/responses with stream=true and parses response.output_text.delta events.
   */
  async *streamOpenAI(messages, model, apiKey, params = {}) {
    const url = 'https://api.openai.com/v1/responses';

    // Build a simple chat transcript to feed into Responses API input
    // Format: ROLE: content\n\n...
    const transcript = messages
      .map(m => `${(m.role || 'user').toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const requestBody = {
      model,
      input: transcript,
      stream: true,
      temperature: params.temperature ?? 1.0,
      top_p: params.top_p ?? 1.0,
      // Responses API uses max_output_tokens (not max_tokens)
      max_output_tokens: params.max_tokens ?? 1024,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.body) throw new Error('No response body from OpenAI Responses API');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;

          // Handle "event:" lines (ignored) and "data:" lines with JSON
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const evt = JSON.parse(dataStr);

              // Typical streaming text event: { "type": "response.output_text.delta", "delta": "..." }
              if (evt?.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
                const content = evt.delta;
                if (this.enableTools) {
                  const parsedItems = this.parseForToolCalls(content);
                  for (const item of parsedItems) {
                    if (item.type === 'tool_call') {
                      yield item;
                    } else if (item.type === 'text') {
                      const safe = this.processForSuggestions(item.content);
                      if (safe) yield safe;
                    }
                  }
                } else {
                  const safe = this.processForSuggestions(content);
                  if (safe) yield safe;
                }
              }

              // Completed event
              if (evt?.type === 'response.completed') {
                return;
              }

              // Error events
              if (evt?.type === 'response.error' || evt?.error) {
                const msg = evt?.error?.message || 'OpenAI Responses API error';
                throw new Error(msg);
              }
            } catch (_) {
              // Ignore JSON parse errors of non-data payloads
            }
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch (_) {}
    }
  }

  /**
   * ===== MAIN STREAMING ENTRYPOINT =====
   * @param {Array} messages
   * @param {string} provider
   * @param {string} model
   * @param {Object|null} params
   * @param {Object} [opts]
   * @param {boolean} [opts.suggestionsEnabled=false]
   * @param {string} [opts.contextAddendum]
   *        When true, the system prompt is augmented to ask the model
   *        for a 4-item follow-up suggestions trailer, and the stream
   *        will yield a final `{ type: 'suggestions', items: [...] }`
   *        chunk after the main answer completes.
   */
  async *streamChat(messages, provider = 'gemini', model = 'gemini-2.5-flash', params = null, opts = {}) {
    // Get settings from SettingsManager if available and params not explicitly provided
    let effectiveProvider = provider;
    let effectiveModel = model;
    let effectiveParams = params;
    let customPrompt = null;

    if (window.settingsManager && !params) {
      const settings = window.settingsManager.getAllSettings();
      effectiveProvider = settings.provider || provider;
      effectiveModel = settings.model || model;
      effectiveParams = settings.params || {
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1024
      };
      customPrompt = settings.prompt;
    } else if (!effectiveParams) {
      // Default params if no settings manager and no explicit params
      effectiveParams = {
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1024
      };
    }

    // Allow global overrides
    effectiveProvider = (window.CHAT_API_PROVIDER || effectiveProvider);
    effectiveModel = (window.CHAT_API_MODEL || effectiveModel);

    // Reset per-call buffers
    this.buffer = '';
    this.suggestionsBuffer = '';
    this.suggestionsEnabled = !!opts.suggestionsEnabled;

    // Inject system prompt (custom or tool-enabled)
    const messagesWithSystem = this.injectSystemPrompt(messages, customPrompt, {
      suggestionsEnabled: this.suggestionsEnabled,
      contextAddendum: opts.contextAddendum || '',
    });

    // LOG: Full message payload being sent
    console.group(`🤖 AI Request to ${effectiveProvider} (${effectiveModel})`);
    console.log('📤 Messages being sent:', messagesWithSystem);
    console.log('📋 System prompt length:', messagesWithSystem.find(m => m.role === 'system')?.content.length || 0, 'chars');
    console.log('💬 User messages:', messagesWithSystem.filter(m => m.role === 'user').length);
    console.log('🔧 Tools enabled:', this.enableTools);
    console.log('💡 Suggestions trailer requested:', this.suggestionsEnabled);
    console.log('⚙️  Parameters:', effectiveParams);
    console.groupEnd();

    const apiKey = await this.ensureApiKey(effectiveProvider);
    switch (effectiveProvider) {
      case 'gemini':
      case 'google':
        yield* this.streamGemini(messagesWithSystem, effectiveModel, apiKey, effectiveParams);
        break;
      case 'claude':
      case 'anthropic':
        yield* this.streamClaude(messagesWithSystem, effectiveModel, apiKey, effectiveParams);
        break;
      case 'openai':
      case 'chatgpt':
        yield* this.streamOpenAI(messagesWithSystem, effectiveModel, apiKey, effectiveParams);
        break;
      default:
        throw new Error(`Unknown provider: ${effectiveProvider}`);
    }

    // Flush any remaining tool-call buffer at the end. Text from the
    // flush still has to go through the suggestions filter so that a
    // sentinel that lived entirely in the tail isn't surfaced to the UI.
    const remaining = this.flushBuffer();
    for (const item of remaining) {
      if (item.type === 'text') {
        const safe = this.processForSuggestions(item.content);
        if (safe) yield safe;
      } else if (item.type === 'tool_call') {
        yield item;
      }
    }

    // Drain the suggestions buffer. This either yields the parsed
    // 4 follow-ups, leaks back held-back text that turned out not to
    // be a sentinel, or both (in that order).
    const trailer = this.flushSuggestionsTrailer();
    if (trailer.leftoverText) {
      yield trailer.leftoverText;
    }
    if (trailer.items && trailer.items.length > 0) {
      yield { type: 'suggestions', items: trailer.items };
    }

    // LOG: Stream complete
    console.log('✅ AI stream completed', trailer.items ? `(+${trailer.items.length} suggestions)` : '');
  }
}

// Export for use in briizOS
export default ChatAPI;
