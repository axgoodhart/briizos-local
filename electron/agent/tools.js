/**
 * In-process JS tools for the lead_agent.
 *
 * Replaces agent/src/briizos/tools.py's external bridge behavior and
 * brings the previously-cut-off filesystem/terminal tools into the
 * agent's reach.
 *
 * Every tool here funnels through the renderer's single policy gate
 * (useToolBridge → ToolContext.executeTool), so __briizosThreadId is
 * always forwarded and the gate can resolve per-surface policy. No
 * tool bypasses the gate. The previous external HTTP bridge is retired.
 */

const fs = require('fs');
const path = require('path');
const { tool } = require('@langchain/core/tools');
const { HumanMessage, ToolMessage } = require('@langchain/core/messages');
const { Command, interrupt, writer } = require('@langchain/langgraph');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { getCheckpointer } = require('./checkpointer');
const { z } = require('zod');
const { callRendererTool } = require('./bridge');
const { ThreadState } = require('./state');
const { createChatModel } = require('./models');
const { getSkillsPromptSection } = require('./system-prompt');

const AGENT_DIR = path.resolve(__dirname, '../../agent');
const GRAPH_CONFIRMED_KEY = '__agentGraphConfirmed';

const DESTRUCTIVE_TOOLS = new Set([
  'bash',
  'write_file',
  'str_replace',
  'copy_file',
  'move_file',
  'delete_file',
  'briizos_create_note',
  'briizos_update_note',
  'briizos_delete_note',
  'briizos_create_task',
  'briizos_complete_task',
  'briizos_create_event',
  'briizos_update_event',
]);

const DESTRUCTIVE_VERBS = new Set([
  'rm', 'rmdir', 'mv', 'chmod', 'chown', 'chgrp', 'kill', 'killall',
  'pkill', 'mkfs', 'fdisk', 'dd', 'truncate', 'shred', 'launchctl',
  'systemctl', 'defaults', 'xattr',
]);

const SAFE_VERBS = new Set([
  'ls', 'cat', 'head', 'tail', 'less', 'more', 'echo', 'printf', 'pwd',
  'whoami', 'which', 'where', 'find', 'grep', 'rg', 'ag', 'ack', 'wc',
  'sort', 'uniq', 'diff', 'comm', 'file', 'stat', 'du', 'df', 'date',
  'cal', 'uptime', 'uname', 'env', 'printenv', 'set', 'cp', 'mkdir',
  'touch', 'curl', 'wget', 'ping', 'dig', 'nslookup', 'host', 'git',
  'node', 'npm', 'npx', 'python', 'python3', 'pip', 'brew', 'open',
  'top', 'ps', 'htop', 'lsof', 'netstat',
]);

// Convenience: pull thread_id out of the LangGraph RunnableConfig.
function threadIdFrom(config) {
  try {
    return (config?.configurable?.thread_id) || null;
  } catch {
    return null;
  }
}

// All tools return a string for the LLM. The renderer registry's
// handlers return objects like { success, message, ... }; we surface
// `message` if present, otherwise stringify.
function formatResult(result) {
  if (result == null) return '';
  if (typeof result === 'string') return result;
  if (typeof result.message === 'string') return result.message;
  try { return JSON.stringify(result); } catch { return String(result); }
}

function readAgentConfig() {
  return { skills: { path: './skills', container_path: '/mnt/skills' } };
}

function resolveSkillsRoot(config = readAgentConfig()) {
  const rawPath = config?.skills?.path || './skills';
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(AGENT_DIR, rawPath);
}

function mapReadableVirtualPath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') return inputPath;
  const config = readAgentConfig();
  const containerPath = (config?.skills?.container_path || '/mnt/skills').replace(/\/+$/, '');
  if (inputPath !== containerPath && !inputPath.startsWith(`${containerPath}/`)) return inputPath;

  const skillsRoot = resolveSkillsRoot(config);
  const relative = inputPath.slice(containerPath.length).replace(/^\/+/, '');
  const resolved = path.resolve(skillsRoot, relative);
  const rootWithSep = `${path.resolve(skillsRoot)}${path.sep}`;
  if (resolved !== path.resolve(skillsRoot) && !resolved.startsWith(rootWithSep)) {
    throw new Error('Access denied: skill path traversal detected');
  }
  return resolved;
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

function toolCallIdFrom(config) {
  return config?.toolCall?.id || config?.runId || `tool-${Date.now()}`;
}

function getPermissionPolicy(config) {
  const configurable = config?.configurable || {};
  const policy = configurable.permission_policy;
  if (policy && typeof policy === 'object') {
    const blacklist = policy.blacklist || {};
    return {
      surface: policy.surface || 'unknown',
      mode: policy.mode || configurable.tool_confirmation_mode || 'ask-always',
      blacklist: {
        paths: Array.isArray(blacklist.paths) ? blacklist.paths : [],
        filetypes: Array.isArray(blacklist.filetypes) ? blacklist.filetypes : [],
      },
    };
  }
  return {
    surface: 'unknown',
    mode: configurable.tool_confirmation_mode || 'ask-always',
    blacklist: { paths: [], filetypes: [] },
  };
}

function isPathBlacklisted(pathValue, blacklist = {}) {
  if (!pathValue || typeof pathValue !== 'string') return false;
  for (const blocked of blacklist.paths || []) {
    const prefix = String(blocked).replace(/\/+$/, '');
    if (pathValue === blocked || (prefix && pathValue.startsWith(`${prefix}/`))) return true;
  }
  const ext = pathValue.includes('.') ? `.${pathValue.split('.').pop().toLowerCase()}` : '';
  return !!ext && (blacklist.filetypes || []).map((ft) => String(ft).toLowerCase()).includes(ext);
}

function bashIsDestructive(command = '') {
  const trimmed = String(command || '').trim();
  if (!trimmed) return false;
  const first = trimmed.split(/\s+/)[0];
  let verb = first === 'sudo' ? trimmed.split(/\s+/)[1] || first : first;
  verb = verb.split('/').pop();
  if (DESTRUCTIVE_VERBS.has(verb)) return true;
  if (/[|;&]/.test(trimmed)) {
    return trimmed.split(/[|;&]+/).some((part) => bashIsDestructive(part));
  }
  if (trimmed.includes('>')) return true;
  return !SAFE_VERBS.has(verb);
}

function blacklistedTarget(toolName, args = {}, blacklist = {}) {
  const candidates = [];
  if (['write_file', 'str_replace', 'delete_file'].includes(toolName)) {
    candidates.push(args.file_path || args.path);
  } else if (['copy_file', 'move_file'].includes(toolName)) {
    candidates.push(args.source, args.destination);
  } else if (toolName === 'bash') {
    const command = args.command || '';
    for (const token of String(command).replace(/['"]/g, ' ').split(/\s+/)) {
      if (token.includes('/') || token.startsWith('.') || token.includes('.')) candidates.push(token);
    }
  }
  return candidates.find((candidate) => isPathBlacklisted(candidate, blacklist)) || null;
}

function formatToolSummary(toolName, args = {}) {
  if (toolName === 'bash') {
    const command = args.command || '';
    return command ? `bash: ${String(command).slice(0, 120)}` : 'bash: (empty command)';
  }
  if (toolName === 'write_file') return `write_file: ${args.file_path || args.path || ''}`;
  if (toolName === 'str_replace') return `str_replace: ${args.file_path || args.path || ''}`;
  if (toolName === 'copy_file') return `copy_file: ${args.source || ''} -> ${args.destination || ''}`;
  if (toolName === 'move_file') return `move_file: ${args.source || ''} -> ${args.destination || ''}`;
  if (toolName === 'delete_file') return `delete_file: ${args.path || ''}`;
  const keyArgs = Object.entries(args).slice(0, 2).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
  return keyArgs ? `${toolName}(${keyArgs})` : toolName;
}

function decideToolAction(toolName, args = {}, config = {}) {
  if (!DESTRUCTIVE_TOOLS.has(toolName)) return { action: 'pass', reason: '' };
  const policy = getPermissionPolicy(config);
  const blocked = blacklistedTarget(toolName, args, policy.blacklist);
  if (blocked) {
    return {
      action: 'deny',
      reason: `path "${blocked}" is blacklisted for the ${policy.surface} surface`,
    };
  }
  if (policy.mode === 'no-asking') return { action: 'pass', reason: '' };
  if (policy.mode === 'ask-destructive') {
    if (toolName.startsWith('briizos_')) return { action: 'pass', reason: '' };
    if (toolName === 'bash') {
      return bashIsDestructive(args.command || '') ? { action: 'confirm', reason: '' } : { action: 'pass', reason: '' };
    }
    return { action: 'confirm', reason: '' };
  }
  return { action: 'confirm', reason: '' };
}

function confirmToolCall(toolName, args, config) {
  const decision = decideToolAction(toolName, args, config);
  if (decision.action === 'pass') return { approved: true, confirmed: false };
  if (decision.action === 'deny') {
    return {
      approved: false,
      confirmed: false,
      message: `Error: blocked by permission policy - ${decision.reason}`,
    };
  }

  const summary = formatToolSummary(toolName, args);
  const response = interrupt({
    type: 'tool_confirmation',
    tool_name: toolName,
    tool_call_id: null,
    args,
    summary,
  });

  if (!response?.approved) {
    return {
      approved: false,
      confirmed: false,
      message: `User rejected ${summary}. Do not execute it. Ask how to proceed if needed.`,
    };
  }
  return { approved: true, confirmed: true };
}

function emitAgentEvent(payload) {
  try {
    writer(payload);
  } catch {
    // Not all direct tool invocations run inside a LangGraph writer context.
  }
}

function makeBridgeTool({ name, description, schema, registryName, mapParams }) {
  return tool(
    async (input, config) => {
      const decision = confirmToolCall(name, input, config);
      if (!decision.approved) return decision.message;
      const mapped = mapParams ? mapParams(input) : input;
      const params = decision.confirmed ? { ...mapped, [GRAPH_CONFIRMED_KEY]: true } : mapped;
      const result = await callRendererTool(registryName, params, threadIdFrom(config));
      return formatResult(result);
    },
    { name, description, schema },
  );
}

// =============================================================================
// briizOS UI-state tools — same names + semantics as Python tools.py
// =============================================================================

const briizos_create_note = makeBridgeTool({
  name: 'briizos_create_note',
  description: 'Create a new note panel in briizOS with the given title and optional content.',
  registryName: 'createNotePanel',
  schema: z.object({
    title: z.string(),
    content: z.string().optional().default(''),
  }),
});

const briizos_update_note = makeBridgeTool({
  name: 'briizos_update_note',
  description: 'Update the content of an existing note panel. Identify by panel ID or title.',
  registryName: 'updateNoteContent',
  schema: z.object({
    panel_id: z.string(),
    new_content: z.string(),
  }),
});

const briizos_search_notes = makeBridgeTool({
  name: 'briizos_search_notes',
  description: 'Search note panels for content matching the query.',
  registryName: 'searchNotes',
  schema: z.object({ query: z.string() }),
});

const briizos_delete_note = makeBridgeTool({
  name: 'briizos_delete_note',
  description: 'Delete a note panel. Identify by panel ID or title.',
  registryName: 'deletePanel',
  schema: z.object({ panel_id: z.string() }),
});

const briizos_create_task = makeBridgeTool({
  name: 'briizos_create_task',
  description: 'Create a new task with the given text and priority (high/medium/low).',
  registryName: 'createThoughtStream',
  schema: z.object({
    text: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  }),
});

const briizos_complete_task = makeBridgeTool({
  name: 'briizos_complete_task',
  description: 'Mark a task as completed. Use task ID or title.',
  registryName: 'completeTask',
  schema: z.object({ task_id: z.string() }),
});

const briizos_create_event = makeBridgeTool({
  name: 'briizos_create_event',
  description: 'Create a calendar event. Date is YYYY-MM-DD; time is optional (e.g. "9:00").',
  registryName: 'createSingleCalendarEvent',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    time: z.string().optional().default(''),
  }),
});

const briizos_update_event = makeBridgeTool({
  name: 'briizos_update_event',
  description: 'Move an existing calendar event to a new date (YYYY-MM-DD).',
  registryName: 'updateCalendarEvent',
  schema: z.object({
    event_title: z.string(),
    new_date: z.string(),
  }),
});

const briizos_get_schedule = makeBridgeTool({
  name: 'briizos_get_schedule',
  description: "Schedule summary. time_range ∈ {'today','tomorrow','this week','next week','all'}.",
  registryName: 'getScheduleSummary',
  schema: z.object({
    time_range: z.enum(['today', 'tomorrow', 'this week', 'next week', 'all']).optional().default('today'),
  }),
});

// =============================================================================
// Filesystem + terminal tools — the agent now has direct access to the
// same Electron-trusted handlers the rest of the app uses. This closes
// the "agent is cut off from filesystem work" gap.
// =============================================================================

const read_file = makeBridgeTool({
  name: 'read_file',
  description: 'Read the contents of a file at an absolute path. Subject to the renderer policy gate.',
  registryName: 'agentReadFile',
  schema: z.object({
    path: z.string().optional(),
    file_path: z.string().optional(),
  }),
  mapParams: (input) => ({ path: mapReadableVirtualPath(input.path || input.file_path) }),
});

const write_file = makeBridgeTool({
  name: 'write_file',
  description: 'Create or overwrite a file at an absolute path. Destructive - gated.',
  registryName: 'agentWriteFile',
  schema: z.object({
    path: z.string().optional(),
    file_path: z.string().optional(),
    content: z.string(),
    opId: z.string().optional(),
  }),
  mapParams: (input) => ({
    path: input.path || input.file_path,
    content: input.content,
    opId: input.opId,
  }),
});

const delete_file = makeBridgeTool({
  name: 'delete_file',
  description: 'Delete a file or folder at an absolute path. Destructive - gated.',
  registryName: 'agentDeleteFile',
  schema: z.object({
    path: z.string(),
    opId: z.string().optional(),
  }),
});

const move_file = makeBridgeTool({
  name: 'move_file',
  description: 'Move or rename a file/folder. Destructive - gated.',
  registryName: 'agentMoveFile',
  schema: z.object({
    source: z.string(),
    destination: z.string(),
    opId: z.string().optional(),
  }),
});

const copy_file = makeBridgeTool({
  name: 'copy_file',
  description: 'Copy a file or folder. Gated.',
  registryName: 'agentCopyFile',
  schema: z.object({
    source: z.string(),
    destination: z.string(),
    opId: z.string().optional(),
  }),
});

const ls = makeBridgeTool({
  name: 'ls',
  description: 'List directory contents at an absolute path.',
  registryName: 'agentListDir',
  schema: z.object({
    path: z.string().optional(),
    dir_path: z.string().optional(),
  }),
  mapParams: (input) => ({ path: mapReadableVirtualPath(input.path || input.dir_path || '.') }),
});

const bash = makeBridgeTool({
  name: 'bash',
  description: 'Run a shell command via the renderer policy gate (terminal.mode resolves confirmation).',
  registryName: 'runCommand',
  schema: z.object({
    command: z.string(),
    cwd: z.string().optional(),
    opId: z.string().optional(),
  }),
});

const str_replace = tool(
  async (input, config) => {
    const decision = confirmToolCall('str_replace', input, config);
    if (!decision.approved) return decision.message;

    const filePath = input.path || input.file_path;
    if (!filePath) return 'Error: path or file_path is required';
    const oldText = input.old_str ?? input.old_string;
    const newText = input.new_str ?? input.new_string;
    if (typeof oldText !== 'string' || oldText.length === 0) return 'Error: old_str is required';
    if (typeof newText !== 'string') return 'Error: new_str is required';

    const readResult = await callRendererTool('agentReadFile', { path: filePath }, threadIdFrom(config));
    if (!readResult?.success || typeof readResult.content !== 'string') {
      return readResult?.message || readResult?.error || `Error: could not read ${filePath}`;
    }

    const occurrences = readResult.content.split(oldText).length - 1;
    if (occurrences === 0) return `Error: old_str was not found in ${filePath}`;
    if (occurrences > 1) return `Error: old_str appears ${occurrences} times in ${filePath}; provide a more specific replacement.`;

    const result = await callRendererTool(
      'agentWriteFile',
      {
        path: filePath,
        content: readResult.content.replace(oldText, newText),
        opId: input.opId,
        ...(decision.confirmed ? { [GRAPH_CONFIRMED_KEY]: true } : {}),
      },
      threadIdFrom(config)
    );
    return formatResult(result);
  },
  {
    name: 'str_replace',
    description: 'Replace one exact string occurrence in a file. Destructive - gated.',
    schema: z.object({
      path: z.string().optional(),
      file_path: z.string().optional(),
      old_str: z.string().optional(),
      old_string: z.string().optional(),
      new_str: z.string().optional(),
      new_string: z.string().optional(),
      opId: z.string().optional(),
    }),
  }
);

const view_image = tool(
  async (input, config) => {
    const imagePath = input.image_path || input.path;
    if (!imagePath) return 'Error: image_path is required';
    const ext = path.extname(imagePath).toLowerCase();
    const valid = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (!valid.has(ext)) return `Error: Unsupported image format: ${ext}. Supported formats: ${[...valid].join(', ')}`;

    const result = await callRendererTool(
      'agentReadFileBase64',
      { path: imagePath, maxSize: input.max_size || 5 * 1024 * 1024 },
      threadIdFrom(config)
    );
    if (!result?.success || !result.base64) {
      return result?.message || result?.error || `Error: could not read image ${imagePath}`;
    }

    return new Command({
      update: {
        viewedImages: {
          [imagePath]: {
            base64: result.base64,
            mime_type: mimeTypeFor(imagePath),
          },
        },
        messages: [
          new ToolMessage({
            content: 'Successfully read image',
            tool_call_id: toolCallIdFrom(config),
            name: 'view_image',
          }),
        ],
      },
    });
  },
  {
    name: 'view_image',
    description: 'Read an image file and make it available for visual analysis. Use for jpg, jpeg, png, or webp images.',
    schema: z.object({
      image_path: z.string().optional(),
      path: z.string().optional(),
      max_size: z.number().optional(),
    }),
  }
);

const present_files = tool(
  async (input, config) => {
    const filepaths = Array.isArray(input.filepaths) ? input.filepaths : [];
    if (filepaths.length === 0) return 'Error: filepaths must include at least one path';
    return new Command({
      update: {
        artifacts: filepaths,
        messages: [
          new ToolMessage({
            content: 'Successfully presented files',
            tool_call_id: toolCallIdFrom(config),
            name: 'present_files',
          }),
        ],
      },
    });
  },
  {
    name: 'present_files',
    description: 'Make generated files visible to the user for viewing or rendering in the client interface.',
    schema: z.object({
      filepaths: z.array(z.string()),
    }),
  }
);

// =============================================================================
// Auxiliary read-only tools the agent benefits from out of the box.
// =============================================================================

const findScheduleConflicts = makeBridgeTool({
  name: 'findScheduleConflicts',
  description: 'Find conflicting calendar events for a time range.',
  registryName: 'findScheduleConflicts',
  schema: z.object({ time_range: z.string().optional() }),
});

const lookupOnline = makeBridgeTool({
  name: 'lookupOnline',
  description: 'Look up information online. The renderer chooses the source.',
  registryName: 'lookupOnline',
  schema: z.object({
    query: z.string(),
    source: z.string().optional(),
  }),
});

const ask_clarification = tool(
  async (input) => {
    const question = input.question || '';
    const clarificationType = input.clarification_type || 'missing_info';
    const options = Array.isArray(input.options) ? input.options : [];
    const messageParts = [];
    if (input.context) messageParts.push(String(input.context), '', question);
    else messageParts.push(question);
    if (options.length > 0) {
      messageParts.push('', ...options.map((option, index) => `${index + 1}. ${option}`));
    }

    const response = interrupt({
      type: 'clarification',
      question,
      clarification_type: clarificationType,
      context: input.context || null,
      options,
      message: messageParts.filter((part) => part !== null && part !== undefined).join('\n'),
    });

    const answer = typeof response === 'string' ? response : response?.answer;
    return answer
      ? `User clarification: ${answer}`
      : 'The user did not provide clarification.';
  },
  {
    name: 'ask_clarification',
    description: 'Ask the user for one clarification before proceeding when required information is missing, ambiguous, risky, or preference-dependent.',
    schema: z.object({
      question: z.string(),
      clarification_type: z.enum([
        'missing_info',
        'ambiguous_requirement',
        'approach_choice',
        'risk_confirmation',
        'suggestion',
      ]).optional().default('missing_info'),
      context: z.string().optional(),
      options: z.array(z.string()).optional(),
    }),
  }
);

const SUBAGENT_CONFIGS = {
  'general-purpose': {
    name: 'general-purpose',
    systemPrompt: `You are a general-purpose subagent working on a delegated task. Complete the task autonomously and return a clear, actionable result.

<guidelines>
- Focus on the delegated task
- Use available tools as needed
- Do not ask for clarification; work with the provided information
- Return a concise summary of what you accomplished, findings, paths, artifacts, and issues
</guidelines>`,
    allowedTools: null,
    disallowedTools: new Set(['task', 'ask_clarification']),
    maxTurns: 50,
    timeoutSeconds: 900,
  },
  bash: {
    name: 'bash',
    systemPrompt: `You are a bash command execution specialist. Execute requested commands carefully and report results clearly.

<guidelines>
- Execute dependent commands one at a time
- Summarize verbose output
- Use absolute paths where possible
- Report failures with the command and relevant stderr/stdout
</guidelines>`,
    allowedTools: new Set(['bash', 'ls', 'read_file', 'write_file', 'str_replace']),
    disallowedTools: new Set(['task', 'ask_clarification']),
    maxTurns: 30,
    timeoutSeconds: 900,
  },
};

function getSubagentConfig(name) {
  const base = SUBAGENT_CONFIGS[name];
  if (!base) return null;
  const appConfig = readAgentConfig();
  const timeout = appConfig?.subagents?.agents?.[name]?.timeout_seconds
    || appConfig?.subagents?.timeout_seconds
    || base.timeoutSeconds;
  return { ...base, timeoutSeconds: timeout };
}

function filterSubagentTools(allTools, subagentConfig) {
  return allTools.filter((candidate) => {
    if (candidate.name === 'task') return false;
    if (subagentConfig.disallowedTools?.has(candidate.name)) return false;
    if (subagentConfig.allowedTools && !subagentConfig.allowedTools.has(candidate.name)) return false;
    return true;
  });
}

function withTimeout(promise, timeoutMs) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Execution timed out after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    }),
  ]).finally(() => clearTimeout(timer));
}

function textFromChunkContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (typeof block === 'string') return block;
      if (block?.type === 'text') return block.text || '';
      return block?.text || '';
    }).join('');
  }
  return '';
}

const task = tool(
  async (input, config) => {
    const subagentType = input.subagent_type || 'general-purpose';
    const subagentConfig = getSubagentConfig(subagentType);
    if (!subagentConfig) return `Error: Unknown subagent type '${subagentType}'. Available: general-purpose, bash`;

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const description = input.description || subagentType;
    const maxTurns = Number(input.max_turns || subagentConfig.maxTurns);
    const skillsSection = getSkillsPromptSection();
    const systemPrompt = skillsSection
      ? `${subagentConfig.systemPrompt}\n\n${skillsSection}`
      : subagentConfig.systemPrompt;
    const threadId = threadIdFrom(config);

    emitAgentEvent({ type: 'task_started', task_id: taskId, description, subagent_type: subagentType });

    const run = async () => {
      const modelName = config?.configurable?.model_name || config?.configurable?.model || null;
      const llm = createChatModel({ name: modelName, thinkingEnabled: false });
      const subagent = createReactAgent({
        llm,
        tools: filterSubagentTools(BASE_TOOLS, subagentConfig),
        prompt: systemPrompt,
        stateSchema: ThreadState,
        checkpointer: getCheckpointer(),
      });

      let finalText = '';
      let progressText = '';
      for await (const evt of subagent.streamEvents(
        { messages: [new HumanMessage(input.prompt || '')] },
        {
          configurable: {
            thread_id: `${threadId || 'subagent'}:${taskId}`,
            model_name: modelName,
            tool_confirmation_mode: 'no-asking',
            writer: (payload) => emitAgentEvent(payload),
          },
          recursionLimit: maxTurns,
          version: 'v2',
        }
      )) {
        if (evt.event === 'on_chat_model_stream') {
          const text = textFromChunkContent(evt.data?.chunk?.content);
          if (text) progressText += text;
        } else if (evt.event === 'on_chat_model_end' && progressText.trim()) {
          finalText = progressText.trim();
          emitAgentEvent({
            type: 'task_running',
            task_id: taskId,
            message: finalText,
            message_index: 1,
            total_messages: 1,
          });
        }
      }
      return finalText || 'No response generated';
    };

    try {
      const result = await withTimeout(run(), Number(subagentConfig.timeoutSeconds || 900) * 1000);
      emitAgentEvent({ type: 'task_completed', task_id: taskId, result });
      return `Task Succeeded. Result: ${result}`;
    } catch (err) {
      const timedOut = /timed out/i.test(err?.message || '');
      emitAgentEvent({
        type: timedOut ? 'task_timed_out' : 'task_failed',
        task_id: taskId,
        error: err?.message || 'Subagent failed',
      });
      return timedOut
        ? `Task timed out. Error: ${err?.message}`
        : `Task failed. Error: ${err?.message || 'Subagent failed'}`;
    }
  },
  {
    name: 'task',
    description: 'Delegate a complex task to a specialized subagent in isolated context. Use for parallel research, exploration, or command-heavy work.',
    schema: z.object({
      description: z.string(),
      prompt: z.string(),
      subagent_type: z.enum(['general-purpose', 'bash']),
      max_turns: z.number().optional(),
    }),
  }
);

// =============================================================================
// Public set used by the lead_agent.
// =============================================================================

const BASE_TOOLS = [
  briizos_create_note,
  briizos_update_note,
  briizos_search_notes,
  briizos_delete_note,
  briizos_create_task,
  briizos_complete_task,
  briizos_create_event,
  briizos_update_event,
  briizos_get_schedule,
  ls,
  read_file,
  write_file,
  str_replace,
  view_image,
  present_files,
  copy_file,
  move_file,
  delete_file,
  bash,
  ask_clarification,
  findScheduleConflicts,
  lookupOnline,
];

const ALL_TOOLS = [
  ...BASE_TOOLS,
  task,
];

module.exports = {
  ALL_TOOLS,
  bashIsDestructive,
  decideToolAction,
  formatToolSummary,
  mapReadableVirtualPath,
};
