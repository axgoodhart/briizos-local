const OpenAI = require('openai');
const https = require('https');
const { logger } = require('./logger');

// Provider API keys (set from env or renderer)
const apiKeys = {
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  claude: process.env.ANTHROPIC_API_KEY || '',
};

let openai = null;

/**
 * Initialize OpenAI client
 */
function initAI() {
  const apiKey = apiKeys.openai || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error('ipc', 'OPENAI_API_KEY not found in environment');
    return false;
  }
  apiKeys.openai = apiKey;
  openai = new OpenAI({ apiKey });
  return true;
}

/**
 * Set an API key for a provider (called from renderer via IPC)
 */
function setApiKey(provider, key) {
  apiKeys[provider] = key;
  if (provider === 'openai' && key) {
    openai = new OpenAI({ apiKey: key });
  }
}

/**
 * Get configured providers (which have API keys)
 */
function getConfiguredProviders() {
  return {
    openai: !!apiKeys.openai,
    gemini: !!apiKeys.gemini,
    claude: !!apiKeys.claude,
  };
}

/**
 * Build file context section for system prompt
 */
function buildFileContextPrompt(fileContexts) {
  if (!fileContexts || fileContexts.length === 0) {
    return '';
  }

  let contextSection = '\n\nYou have access to the following files that the user has selected:\n\n';

  for (const file of fileContexts) {
    contextSection += `=== ${file.name} (${file.path}) ===\n`;
    contextSection += file.content;
    if (file.truncated) {
      contextSection += '\n[...content truncated due to size limit]';
    }
    contextSection += `\n=== END ${file.name} ===\n\n`;
  }

  contextSection += 'Reference these files when relevant to the user\'s questions.\n';

  return contextSection;
}

// ===== STREAMING IMPLEMENTATIONS =====

/**
 * Stream from OpenAI using the SDK
 */
async function streamOpenAI(event, streamId, messages, model, params) {
  if (!openai) {
    if (!apiKeys.openai) throw new Error('OpenAI API key not configured');
    openai = new OpenAI({ apiKey: apiKeys.openai });
  }

  const stream = await openai.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages,
    stream: true,
    temperature: params.temperature ?? 0.7,
    top_p: params.top_p ?? 1,
    max_tokens: params.max_tokens ?? 4096,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      event.sender.send('ai-stream-chunk', { streamId, chunk: content, type: 'text' });
    }
  }
}

/**
 * Stream from Gemini using raw HTTPS SSE
 */
function streamGemini(event, streamId, messages, model, params) {
  return new Promise((resolve, reject) => {
    const apiKey = apiKeys.gemini;
    if (!apiKey) return reject(new Error('Gemini API key not configured'));

    const effectiveModel = model || 'gemini-2.0-flash-exp';

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : (msg.role === 'system' ? 'user' : msg.role),
      parts: [{ text: msg.content }],
    }));

    const requestBody = JSON.stringify({
      contents,
      generationConfig: {
        temperature: params.temperature ?? 1.0,
        topP: params.top_p ?? 1.0,
        maxOutputTokens: params.max_tokens ?? 4096,
      },
    });

    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:streamGenerateContent?alt=sse&key=${apiKey}`
    );

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => reject(new Error(`Gemini API error ${res.statusCode}: ${body}`)));
        return;
      }

      let buffer = '';
      res.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                event.sender.send('ai-stream-chunk', { streamId, chunk: text, type: 'text' });
              }
            } catch (_) { /* ignore parse errors */ }
          }
        }
      });

      res.on('end', () => resolve());
      res.on('error', reject);
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Stream from Claude using raw HTTPS SSE
 */
function streamClaude(event, streamId, messages, model, params) {
  return new Promise((resolve, reject) => {
    const apiKey = apiKeys.claude;
    if (!apiKey) return reject(new Error('Anthropic API key not configured'));

    const effectiveModel = model || 'claude-sonnet-4-5-20250929';

    // Separate system message for Claude's API
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const claudeMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const requestBody = JSON.stringify({
      model: effectiveModel,
      max_tokens: params.max_tokens ?? 4096,
      temperature: params.temperature ?? 1.0,
      top_p: params.top_p ?? 1.0,
      messages: claudeMessages,
      stream: true,
      ...(systemMessage ? { system: systemMessage } : {}),
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => reject(new Error(`Claude API error ${res.statusCode}: ${body}`)));
        return;
      }

      let buffer = '';
      res.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'content_block_delta' && parsed?.delta?.text) {
                event.sender.send('ai-stream-chunk', {
                  streamId,
                  chunk: parsed.delta.text,
                  type: 'text',
                });
              }
            } catch (_) { /* ignore parse errors */ }
          }
        }
      });

      res.on('end', () => resolve());
      res.on('error', reject);
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

// ===== TOOL CALL PARSING =====

// Valid tool names for detection
const VALID_TOOLS = [
  'getScheduleSummary', 'searchNotes', 'findScheduleConflicts', 'lookupOnline',
  'openPanel', 'startTimer', 'tilePanels', 'createPrioritizedTaskList',
  'createSingleCalendarEvent', 'updateCalendarEvent', 'createRecurringCalendarEvent',
  'createThoughtStream', 'createNotePanel', 'setPanelColor', 'updateNoteContent',
  'movePanel', 'resizePanel', 'setPanelTitle', 'duplicatePanel', 'deletePanel',
  'minimizePanel', 'restorePanel', 'groupPanelsByType', 'stackPanelsVertically',
  'focusMode', 'closeAllPanels', 'minimizeAllPanels', 'completeTask',
];

/**
 * Parse accumulated text for tool call JSON blocks.
 * Returns { toolCalls: [{tool, params}], cleanText: string }
 */
function parseToolCalls(text) {
  const toolCalls = [];
  let cleanText = text;

  const jsonRegex = /```json\s*(\{[^`]*\})\s*```/g;
  let match;

  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool && VALID_TOOLS.includes(parsed.tool) && parsed.params && typeof parsed.params === 'object') {
        toolCalls.push({ tool: parsed.tool, params: parsed.params });
        cleanText = cleanText.replace(match[0], '');
      }
    } catch (_) { /* not valid JSON */ }
  }

  return { toolCalls, cleanText };
}

// ===== MAIN STREAMING ENTRYPOINT =====

/**
 * Stream chat to renderer via IPC events
 */
async function streamChat(event, streamId, messages, provider, model, params) {
  try {
    switch (provider) {
      case 'openai':
        await streamOpenAI(event, streamId, messages, model, params);
        break;
      case 'gemini':
        await streamGemini(event, streamId, messages, model, params);
        break;
      case 'claude':
        await streamClaude(event, streamId, messages, model, params);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    event.sender.send('ai-stream-done', { streamId });
  } catch (error) {
    logger.error('ipc', 'Stream error', error?.message);
    event.sender.send('ai-stream-error', { streamId, error: error.message });
  }
}

// ===== BACKWARD-COMPAT: Non-streaming chat =====

async function chat(userMessage, fileContexts = [], history = []) {
  if (!openai) {
    if (!initAI()) {
      throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to your environment.');
    }
  }

  let systemPrompt = `You are briizOS, a helpful AI assistant integrated into a personal workspace application.
You help the user manage tasks, answer questions, and assist with creative projects.
Be concise but helpful.`;

  const fileContextSection = buildFileContextPrompt(fileContexts);
  if (fileContextSection) {
    systemPrompt += fileContextSection;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 1000,
    temperature: 0.7
  });

  const assistantMessage = completion.choices[0].message.content;
  const usage = completion.usage ? {
    total_tokens: completion.usage.total_tokens,
    prompt_tokens: completion.usage.prompt_tokens,
    completion_tokens: completion.usage.completion_tokens
  } : null;

  return {
    message: assistantMessage,
    usage,
    filesInContext: fileContexts.map(f => ({ name: f.name, path: f.path }))
  };
}

function isConfigured() {
  return !!(apiKeys.openai || apiKeys.gemini || apiKeys.claude);
}

/**
 * AI-powered task breakdown (backward compat for TasksPanel)
 */
async function breakdownTask(taskId, taskTitle) {
  if (!openai) {
    if (!initAI()) {
      throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to your environment.');
    }
  }

  const systemPrompt = `You are a task breakdown assistant. Break complex tasks into smaller, actionable subtasks.
Rules:
1. Break into 2-6 subtasks
2. Each subtask should be specific and actionable
3. Ordered logically
4. Priority: "high" for critical, "medium" for normal, "low" for nice-to-haves

Respond ONLY with valid JSON:
{
  "subtasks": [{"title": "Subtask title", "priority": "high"}],
  "reasoning": "Brief explanation"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Break down this task into subtasks: "${taskTitle}"` }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  const responseText = completion.choices[0].message.content.trim();
  let result;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    logger.error('ipc', 'Failed to parse AI response', parseError?.message);
    throw new Error('Failed to parse AI response');
  }

  if (!result.subtasks || !Array.isArray(result.subtasks)) {
    throw new Error('Invalid response structure: missing subtasks array');
  }

  result.subtasks = result.subtasks.map(st => ({
    title: st.title || 'Untitled subtask',
    priority: ['high', 'medium', 'low'].includes(st.priority) ? st.priority : 'medium'
  }));

  return result;
}

module.exports = {
  initAI,
  chat,
  isConfigured,
  breakdownTask,
  streamChat,
  getConfiguredProviders,
  setApiKey,
  parseToolCalls,
  buildFileContextPrompt,
};
