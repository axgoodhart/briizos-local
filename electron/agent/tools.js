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
const { QUERY_DATA_DOMAINS } = require('./data-catalog');

const { logger } = require('../logger');

const AGENT_DIR = path.resolve(__dirname, '../../agent');
const GRAPH_CONFIRMED_KEY = '__agentGraphConfirmed';

// Unified-database handle for direct read tools. Reads run in-process against
// local-data-service (same process as the agent) so they work even when the
// renderer is busy or absent (headless automation runs). Writes still go
// through the renderer bridge + confirmation policy.
let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

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
  'briizos_update_project_scoring',
  'briizos_schedule_task',
  'briizos_unschedule',
  'briizos_complete_placement',
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

const briizos_update_project_scoring = makeBridgeTool({
  name: 'briizos_update_project_scoring',
  description: 'Save optional deadline, importance (1-10), size in hours, or goal relevance on a project (an island in Islands). This is a persistent write and requires user confirmation. Never save inferred values without the user explicitly confirming them.',
  registryName: 'updateIslandProjectScoring',
  schema: z.object({
    project_id: z.string(),
    deadline: z.string().nullable().optional(),
    importance: z.number().int().min(1).max(10).nullable().optional(),
    size: z.number().min(0).nullable().optional(),
    relevance: z.string().nullable().optional(),
  }).refine(
    (input) => ['deadline', 'importance', 'size', 'relevance'].some((field) => input[field] !== undefined),
    { message: 'At least one scoring field is required' },
  ),
});

const briizos_schedule_task = makeBridgeTool({
  name: 'briizos_schedule_task',
  description: 'Schedule an existing task by creating a Calendar placement. This persistent write requires confirmation and never copies the task.',
  registryName: 'scheduleTask',
  schema: z.object({
    task_id: z.string(),
    date: z.string(),
    start_minute: z.number().int().min(0).max(1439),
    duration_minutes: z.number().int().min(1).max(1440),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().default('none'),
  }),
});

const briizos_unschedule = makeBridgeTool({
  name: 'briizos_unschedule',
  description: 'Archive one Calendar placement without changing its task. This persistent write requires confirmation.',
  registryName: 'unschedulePlacement',
  schema: z.object({ placement_id: z.string() }),
});

const briizos_complete_placement = makeBridgeTool({
  name: 'briizos_complete_placement',
  description: 'Complete or reopen one dated task session without changing the whole task. This persistent write requires confirmation.',
  registryName: 'completePlacement',
  schema: z.object({
    placement_id: z.string(),
    occurrence_date: z.string(),
    completed: z.boolean().optional().default(true),
  }),
});

// =============================================================================
// Unified-database read tools — direct, in-process queries against
// local-data-service. Read-only by construction (not in DESTRUCTIVE_TOOLS →
// never trigger confirmation). Every call logs an `agent.data` entry, which
// the main logger broadcasts to the LogPanel and prints to the terminal.
// The queryable surface these expose is documented in data-catalog.js and
// injected into the system prompt per chat mode.
// =============================================================================

function isoOrNull(ms) {
  return typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function dayBoundsMs(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return endOfDay ? parsed.getTime() + 24 * 60 * 60 * 1000 : parsed.getTime();
}

function localDateYmd(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function shiftedDateYmd(dayOffset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return localDateYmd(date);
}

function scheduleRange(timeRange) {
  if (timeRange === 'tomorrow') return { dateFrom: shiftedDateYmd(1), dateTo: shiftedDateYmd(1) };
  if (timeRange === 'this week') return { dateFrom: shiftedDateYmd(0), dateTo: shiftedDateYmd(6) };
  if (timeRange === 'next week') return { dateFrom: shiftedDateYmd(7), dateTo: shiftedDateYmd(13) };
  if (timeRange === 'all') return { dateFrom: shiftedDateYmd(0), dateTo: shiftedDateYmd(365) };
  return { dateFrom: shiftedDateYmd(0), dateTo: shiftedDateYmd(0) };
}

function compactTask(task, { includeLog = false } = {}) {
  const subtasks = (task.subtasks || []).map((step) => ({
    id: step.id,
    title: step.title,
    status: step.status,
    position: step.position,
    completed_at: isoOrNull(step.completed_at),
    revision: step.revision,
  }));
  const compact = {
    id: task.id,
    title: task.title,
    description: clipCatalogText(task.description || '', 4000),
    status: task.status,
    priority: task.priority,
    due_at: isoOrNull(task.due_at),
    project_id: task.project_id || null,
    island_project_id: task.island_project_id || null,
    source_key: task.source_key || null,
    automated: !!task.automated,
    created_at: isoOrNull(task.created_at),
    updated_at: isoOrNull(task.updated_at),
    revision: task.revision,
    subtasks,
  };
  if (includeLog) {
    compact.taskLog = (task.taskLog || []).slice(-10).map((entry) => ({
      timestamp: isoOrNull(entry.timestamp) || entry.timestamp,
      type: entry.type,
      message: clipCatalogText(entry.message, 2000),
    }));
  }
  return compact;
}

function compactIslandProject(project, { detailed = false } = {}) {
  const compact = {
    id: project.id,
    name: project.name,
    tags: project.tags || [],
    milestones: (project.milestones || []).map((milestone) => ({
      name: milestone.name || milestone.title || milestone.label || '',
      completed: !!milestone.completed,
    })),
    fileCount: (project.files || []).length,
    revision: project.revision,
  };
  // Islands projects (docs/island-desks/DECISIONS.md): where the project stands and what is on it.
  if (Array.isArray(project.stages) && project.stages.length) {
    compact.stage = project.stages[project.stage] || project.stages[0];
    compact.stages = project.stages;
  }
  if (project.status) compact.status = project.status;
  if (project.field) compact.field = project.field;
  if (project.rootPath) compact.folder = project.rootPath;
  if (project.webLaunch?.commandLine) {
    compact.webLaunch = {
      commandLine: project.webLaunch.commandLine,
      cwd: project.webLaunch.cwd || project.rootPath || '',
      urlTemplate: project.webLaunch.urlTemplate || 'http://127.0.0.1:{PORT}/',
      updatedAt: project.webLaunch.updatedAt || null,
    };
  }
  if (Array.isArray(project.cards)) {
    compact.cards = project.cards.map((card) => ({ kind: card.kind, title: card.title }));
  }
  // Optional prioritization scoring fields (live inside the project's
  // data_json when the user has set them).
  for (const field of ['deadline', 'importance', 'size', 'relevance']) {
    if (project[field] !== undefined && project[field] !== null && project[field] !== '') {
      compact[field] = project[field];
    }
  }
  if (detailed) {
    if (project.answers && Object.keys(project.answers).length) compact.about = project.answers;
    if (project.journal?.chapter) compact.chapter = String(project.journal.chapter).slice(0, 4000);
    if (Array.isArray(project.journal?.entries)) {
      compact.recentJournal = project.journal.entries.slice(0, 15).map((entry) => ({ at: entry.at, text: entry.text }));
    }
    compact.files = (project.files || []).slice(0, 50).map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      size: file.size ?? null,
      modified_at: file.modifiedAt || null,
      kind: file.typeGroup || null,
      tags: file.tags || [],
    }));
  }
  return compact;
}

function makeDataReadTool({ name, description, schema, run }) {
  return tool(
    async (input) => {
      const startedAt = Date.now();
      if (!localDataService) {
        logger.error('agent.data', `${name} failed: local data service unavailable`);
        return 'Error: briizOS local data is not available yet. Try again shortly.';
      }
      try {
        const { rows, payload } = run(input || {});
        logger.info('agent.data', `${name} → ${rows} row${rows === 1 ? '' : 's'}`, {
          args: input || {},
          rows,
          ms: Date.now() - startedAt,
        });
        return JSON.stringify(payload);
      } catch (err) {
        logger.error('agent.data', `${name} failed`, { args: input || {}, error: err?.message });
        return `Error: ${err?.message || 'query failed'}`;
      }
    },
    { name, description, schema },
  );
}

const briizos_list_tasks = makeDataReadTool({
  name: 'briizos_list_tasks',
  description: 'List tasks from the unified database, with their subtasks. Filter by status, priority, or project (island).',
  schema: z.object({
    status: z.enum([
      'pending', 'created', 'running', 'in_progress', 'active', 'waiting',
      'deferred', 'completed', 'cancelled', 'blocked',
    ]).optional(),
    priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).optional(),
    project_id: z.string().optional(),
    island_project_id: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional().default(50),
  }),
  run: (input) => {
    const filters = { limit: input.limit || 50 };
    if (input.status) filters.status = input.status;
    if (input.project_id) filters.projectId = input.project_id;
    if (input.island_project_id) filters.islandProjectId = input.island_project_id;
    let tasks = localDataService.listTasksDetailed(filters);
    if (input.priority) tasks = tasks.filter((task) => task.priority === input.priority);
    const payload = tasks.map((task) => compactTask(task));
    return { rows: payload.length, payload };
  },
});

const briizos_get_task = makeDataReadTool({
  name: 'briizos_get_task',
  description: 'Get one task by id, including subtasks and its recent activity log.',
  schema: z.object({ task_id: z.string() }),
  run: (input) => {
    const task = localDataService.getTask(input.task_id);
    if (!task) return { rows: 0, payload: { error: `No task with id ${input.task_id}` } };
    return { rows: 1, payload: compactTask(task, { includeLog: true }) };
  },
});

const briizos_list_projects = makeDataReadTool({
  name: 'briizos_list_projects',
  description: "List the user's projects, shown as islands in the Islands app (the only kind of project in briizOS), with stage, status, cards, folder, remembered web launch, milestones, tags, and prioritization scoring fields when set.",
  schema: z.object({
    limit: z.number().int().min(1).max(200).optional().default(100),
  }),
  run: (input) => {
    const projects = (localDataService.getIslandState().projects || []).slice(0, input.limit || 100);
    const payload = projects.map((project) => compactIslandProject(project));
    return { rows: payload.length, payload };
  },
});

const briizos_get_project = makeDataReadTool({
  name: 'briizos_get_project',
  description: 'Get one project (island) by id, including stage, status, cards, folder, remembered web launch, milestones, attached files, its answers to the project questions, its chapter and recent journal entries.',
  schema: z.object({ project_id: z.string() }),
  run: (input) => {
    const project = (localDataService.getIslandState().projects || [])
      .find((candidate) => candidate.id === input.project_id);
    if (!project) return { rows: 0, payload: { error: `No project (island) with id ${input.project_id}` } };
    return { rows: 1, payload: compactIslandProject(project, { detailed: true }) };
  },
});

const briizos_query_organizer = makeDataReadTool({
  name: 'briizos_query_organizer',
  description: 'Query organizer items (calendar events, notes, timers) from the unified database, optionally within a date window (YYYY-MM-DD). Recurring items are always included, flagged with their recurrence rule.',
  schema: z.object({
    type: z.enum(['event', 'note', 'timer']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional().default(100),
  }),
  run: (input) => {
    const filters = { limit: 1000 };
    if (input.type) filters.type = input.type;
    const fromMs = input.date_from ? dateFilterMs(input.date_from, false) : null;
    const toMs = input.date_to ? dateFilterMs(input.date_to, true) : null;
    if (fromMs !== null && toMs !== null && fromMs >= toMs) {
      throw new Error('date_from must be on or before date_to.');
    }
    const items = localDataService.listOrganizerItems(filters).filter((item) => {
      if (item.recurrence) return true;
      if (fromMs === null && toMs === null) return true;
      const anchor = item.scheduled_start_at ?? item.due_at;
      if (anchor == null) return fromMs === null;
      if (fromMs !== null && anchor < fromMs) return false;
      if (toMs !== null && anchor >= toMs) return false;
      return true;
    });
    const payload = items.slice(0, input.limit || 100).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: clipCatalogText(item.body || '', 4000),
      status: item.status,
      parent_id: item.parent_id || null,
      scheduled_start_at: isoOrNull(item.scheduled_start_at),
      scheduled_end_at: isoOrNull(item.scheduled_end_at),
      due_at: isoOrNull(item.due_at),
      duration_seconds: item.duration_seconds ?? null,
      recurrence: item.recurrence || null,
      tags: item.tags || [],
      created_at: isoOrNull(item.created_at),
      updated_at: isoOrNull(item.updated_at),
      revision: item.revision,
    }));
    return { rows: payload.length, payload };
  },
});

const briizos_list_placements = makeDataReadTool({
  name: 'briizos_list_placements',
  description: 'List scheduled task appearances, joined live to their tasks and expanded into dated occurrences. Session completion and whole-task completion are separate fields.',
  schema: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    ref_id: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional().default(100),
  }),
  run: (input) => {
    const defaultDate = localDateYmd();
    const dateFrom = input.date_from || input.date_to || defaultDate;
    const dateTo = input.date_to || input.date_from || defaultDate;
    const placements = localDataService.listPlacements({
      dateFrom,
      dateTo,
      refId: input.ref_id,
      limit: 5000,
    }).slice(0, input.limit || 100);
    return { rows: placements.length, payload: placements };
  },
});

const briizos_get_schedule = makeDataReadTool({
  name: 'briizos_get_schedule',
  description: "Get the union schedule of standalone events and task placements. time_range is today, tomorrow, this week, next week, or all (the next year).",
  schema: z.object({
    time_range: z.enum(['today', 'tomorrow', 'this week', 'next week', 'all']).optional().default('today'),
  }),
  run: (input) => {
    const range = scheduleRange(input.time_range || 'today');
    const payload = localDataService.listSchedule(range);
    return { rows: payload.length, payload };
  },
});

const MAX_CATALOG_PAYLOAD_CHARS = 120000;
const SENSITIVE_CATALOG_KEYS = new Set([
  'apikey', 'secret', 'secrets', 'password', 'accesstoken', 'refreshtoken',
  'encryptedvalue', 'credential', 'credentials', 'authorization', 'auth',
  'bearer', 'sessioncookie',
]);

function clipCatalogText(value, maxChars) {
  const text = String(value ?? '');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 24))}… [content clipped]`;
}

function sensitiveCatalogKey(key) {
  const normalized = String(key || '').replace(/[-_]/g, '').toLowerCase();
  if (SENSITIVE_CATALOG_KEYS.has(normalized)) return true;
  return ['apikey', 'password', 'accesstoken', 'refreshtoken', 'clientsecret', 'privatekey']
    .some((suffix) => normalized.endsWith(suffix));
}

function compactCatalogValue(value, options = {}, depth = 0) {
  const stringLimit = options.stringLimit || 1200;
  const arrayLimit = options.arrayLimit || 50;
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return clipCatalogText(value, stringLimit);
  if (depth >= 7) return '[nested data omitted]';
  if (Array.isArray(value)) {
    const items = value.slice(0, arrayLimit).map((item) => compactCatalogValue(item, options, depth + 1));
    if (value.length > arrayLimit) items.push(`[${value.length - arrayLimit} more items omitted]`);
    return items;
  }
  if (typeof value === 'object') {
    const out = {};
    const entries = Object.entries(value);
    entries.slice(0, 100).forEach(([key, item]) => {
      out[key] = sensitiveCatalogKey(key) ? '[redacted]' : compactCatalogValue(item, options, depth + 1);
    });
    if (entries.length > 100) out.__omitted_fields = entries.length - 100;
    return out;
  }
  return String(value);
}

function catalogMatches(value, query) {
  if (!query) return true;
  try {
    return JSON.stringify(value).toLowerCase().includes(query);
  } catch {
    return String(value).toLowerCase().includes(query);
  }
}

function catalogResult(domain, items, input, totalMatches = items.length, extra = {}) {
  const options = input.include_content
    ? { stringLimit: 12000, arrayLimit: 100 }
    : { stringLimit: 1200, arrayLimit: 50 };
  const returned = [];
  let usedChars = 0;
  for (const item of items.slice(0, input.limit || 50)) {
    let compact = compactCatalogValue(item, options);
    let serialized = JSON.stringify(compact);
    if (serialized.length > 50000) {
      compact = compactCatalogValue(item, { stringLimit: 2000, arrayLimit: 25 });
      serialized = JSON.stringify(compact);
    }
    if (serialized.length > MAX_CATALOG_PAYLOAD_CHARS) {
      compact = compactCatalogValue(item, { stringLimit: 500, arrayLimit: 10 });
      serialized = JSON.stringify(compact);
    }
    if (serialized.length > MAX_CATALOG_PAYLOAD_CHARS) {
      compact = {
        notice: 'Record exceeded the safe tool-result budget. Query a narrower child record for full detail.',
        preview: clipCatalogText(serialized, 60000),
      };
      serialized = JSON.stringify(compact);
    }
    if (returned.length && usedChars + serialized.length > MAX_CATALOG_PAYLOAD_CHARS) break;
    returned.push(compact);
    usedChars += serialized.length;
  }
  return {
    rows: returned.length,
    payload: {
      domain,
      returned: returned.length,
      total_matches: totalMatches,
      truncated: returned.length < totalMatches,
      items: returned,
      ...extra,
    },
  };
}

function dateFilterMs(value, endOfDay = false) {
  if (!value) return undefined;
  const timestamp = dayBoundsMs(value, endOfDay);
  if (timestamp == null) throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD.`);
  return timestamp;
}

function queryCatalogData(input) {
  const domain = input.domain;
  const query = String(input.query || '').trim().toLowerCase();
  const limit = input.limit || 50;

  if (domain === 'journals') {
    let journals = localDataService.listJournals();
    if (input.id) journals = journals.filter((journal) => journal.id === input.id);
    const items = [];
    for (const journal of journals) {
      const needsFolios = !!(input.id || input.include_content || query);
      // Execubriiz entry access belongs to its journal-scoped reader. Imported
      // folios are not a back door around an entry's later privacy choice.
      const folios = needsFolios && journal.mode !== 'execubriiz' ? localDataService.listFolios(journal.id) : [];
      const item = needsFolios ? { ...journal, folios } : journal;
      if (catalogMatches(item, query)) items.push(item);
    }
    return catalogResult(domain, items, input, items.length);
  }

  if (domain === 'notefall_posts') {
    let posts = localDataService.listNotefallPosts();
    if (input.id) posts = posts.filter((post) => post.id === input.id);
    if (input.parent_id) posts = posts.filter((post) => post.journalId === input.parent_id);
    posts = posts.filter((post) => catalogMatches(post, query));
    return catalogResult(domain, posts, input, posts.length);
  }

  if (domain === 'canvases') {
    let canvases = localDataService.listCanvases({ query: query || undefined });
    if (input.id) canvases = canvases.filter((canvas) => canvas.id === input.id);
    const items = [];
    for (const canvas of canvases) {
      const needsDetail = !!(input.id || input.include_content);
      const detail = needsDetail ? localDataService.getCanvas(canvas.id) : canvas;
      items.push(input.id || input.include_content ? detail : { ...canvas, content_match: query ? true : undefined });
    }
    return catalogResult(domain, items, input, items.length);
  }

  if (domain === 'files') {
    const validAvailability = ['available', 'missing', 'unknown'];
    if (input.status && !validAvailability.includes(input.status)) {
      throw new Error('For files, status must be available, missing, or unknown.');
    }
    let files = localDataService.listExternalFiles({
      id: input.id,
      kind: input.kind,
      availability: input.status,
      query: query || undefined,
      limit,
    });
    return catalogResult(domain, files, input, files.length);
  }

  if (domain === 'conversations') {
    let threads = localDataService.listThreads({ id: input.id, kind: input.kind, query: query || undefined, limit: 500 });
    if (input.status) threads = threads.filter((thread) => thread.status === input.status);
    const totalMatches = threads.length;
    const items = [];
    for (const thread of threads) {
      const messages = (input.id || input.include_content || query)
        ? localDataService.listMessages(thread.id)
        : [];
      const item = input.id || input.include_content
        ? { ...thread, messages }
        : query
          ? {
              ...thread,
              matching_messages: messages
                .filter((message) => catalogMatches(message, query))
                .slice(0, 10),
            }
          : thread;
      if (catalogMatches({ thread, messages }, query)) items.push(item);
      if (items.length >= limit) break;
    }
    return catalogResult(domain, items, input, totalMatches);
  }

  if (domain === 'memory') {
    const profile = localDataService.getMemoryProfile(input.id || null);
    if (query) {
      profile.facts = (profile.facts || []).filter((fact) => catalogMatches(fact, query));
      if (!catalogMatches(profile, query)) return catalogResult(domain, [], input, 0);
    }
    return catalogResult(domain, [profile], input, 1);
  }

  if (domain === 'recorder_sessions') {
    let sessions = localDataService.listRecorderSessions();
    if (input.id) sessions = sessions.filter((session) => session.id === input.id);
    const items = [];
    for (const session of sessions) {
      const detail = input.id || input.include_content || query
        ? localDataService.getRecorderSession(session.id)
        : session;
      if (catalogMatches(detail, query)) items.push(detail);
    }
    return catalogResult(domain, items, input, items.length);
  }

  if (domain === 'automation_runs') {
    const statuses = input.status ? [input.status] : [];
    let runs = localDataService.listRuns({ statuses });
    if (input.id) runs = runs.filter((run) => run.id === input.id);
    runs = runs.filter((run) => catalogMatches(run, query));
    if (input.id || input.include_content) {
      runs = runs.map((run) => localDataService.getRun(run.id) || run);
    }
    return catalogResult(domain, runs, input, runs.length);
  }

  if (domain === 'media') {
    const state = localDataService.getMediaState();
    let tracks = state.tracks || [];
    if (input.id) tracks = tracks.filter((track) => track.file_id === input.id || track.queue_id === input.id);
    if (input.kind) tracks = tracks.filter((track) => track.kind === input.kind);
    tracks = tracks.filter((track) => catalogMatches(track, query)).slice(0, limit);
    if ((input.id || input.kind || query) && !tracks.length) return catalogResult(domain, [], input, 0);
    return catalogResult(domain, [{ ...state, tracks }], input, 1, { track_matches: tracks.length });
  }

  if (domain === 'briiztorm') {
    const state = localDataService.getBriiztormState();
    if (query && !catalogMatches(state, query)) return catalogResult(domain, [], input, 0);
    return catalogResult(domain, [state], input, 1);
  }

  if (domain === 'workspace') {
    const layout = localDataService.getWorkspaceLayout();
    let panels = localDataService.listWorkspacePanels();
    if (input.id) panels = panels.filter((panel) => panel.id === input.id);
    if (input.kind) panels = panels.filter((panel) => panel.feature_key === input.kind);
    if (input.status === 'visible') panels = panels.filter((panel) => panel.visible);
    else if (input.status === 'hidden') panels = panels.filter((panel) => !panel.visible);
    else if (input.status) throw new Error('For workspace, status must be visible or hidden.');
    if (input.id && !panels.length) return catalogResult(domain, [], input, 0);
    const item = { layout, panels: panels.slice(0, limit) };
    if (query && !catalogMatches(item, query)) return catalogResult(domain, [], input, 0);
    return catalogResult(domain, [item], input, 1, { panel_matches: panels.length });
  }

  if (domain === 'settings') {
    const settings = { ...localDataService.listSettings() };
    delete settings.actiondeck_panel_settings;
    let settingEntries = Object.entries(settings);
    if (query) settingEntries = settingEntries.filter(([key, value]) => catalogMatches({ key, value }, query));
    const item = {
      settings: Object.fromEntries(settingEntries),
      model_profiles: localDataService.listModelProfiles(),
      provider_keys_configured: localDataService.getProviderKeyStatus(),
    };
    if (query && !catalogMatches(item, query)) return catalogResult(domain, [], input, 0);
    return catalogResult(domain, [item], input, 1, { setting_matches: settingEntries.length });
  }

  if (domain === 'logs') {
    const logs = localDataService.listLogs({
      id: input.id,
      category: input.kind,
      level: input.status,
      threadId: input.parent_id,
      query: query || undefined,
      since: dateFilterMs(input.date_from, false),
      until: input.date_to ? dateFilterMs(input.date_to, true) - 1 : undefined,
      limit,
    });
    return catalogResult(domain, logs, input, logs.length);
  }

  if (domain === 'system_status') {
    const item = {
      database: localDataService.getStatus(),
      domain_revisions: localDataService.getDomainRevisions(),
      pending_sync_domains: localDataService.getPendingSyncDomains(),
    };
    return catalogResult(domain, [item], input, 1);
  }

  throw new Error(`Unsupported data domain: ${domain}`);
}

const briizos_query_data = makeDataReadTool({
  name: 'briizos_query_data',
  description: `Browse lower-frequency briizOS data domains (${QUERY_DATA_DOMAINS.join(', ')}). Start with summaries, then set id and include_content=true for exact detail. This tool is read-only and never returns credentials.`,
  schema: z.object({
    domain: z.enum(QUERY_DATA_DOMAINS),
    id: z.string().optional(),
    parent_id: z.string().optional(),
    query: z.string().max(500).optional(),
    kind: z.string().max(100).optional(),
    status: z.string().max(100).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    include_content: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  run: queryCatalogData,
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
// briizy work memory (PLAN-BRIIZY.md §8)
//
// Main-process tools, not renderer bridges: they read the local frames index
// directly, so the bridged tool count is unchanged. What crosses to the model is
// OCR text plus app name, window title and timestamp — never image bytes and
// never an archive path (I2). The service layer strips paths for us; the
// truncation here is about prompt budget, not privacy.
// =============================================================================

/** Parse an ISO string or epoch value into epoch ms; undefined when absent. */
function toEpochMs(value, label) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be an ISO date-time or epoch milliseconds`);
  return parsed;
}

/** Per-result OCR excerpt cap, so a dense IDE frame cannot dominate the turn. */
const SCREEN_MEMORY_EXCERPT_CHARS = 400;

const briizos_search_screen_memory = makeDataReadTool({
  name: 'briizos_search_screen_memory',
  description: [
    'Full-text search the user\'s own screen history (OCR text and window titles captured on this Mac).',
    'Use this to answer "what was that thing I was looking at", to recover a name, number, error message,',
    'or link the user saw earlier, or to ground an answer in what they actually had on screen.',
    'Returns matching moments with the app, window title, time and a text snippet — never images.',
    'Returns an empty list when screen capture is off or nothing matches; say so rather than guessing.',
  ].join(' '),
  schema: z.object({
    query: z.string().min(1).max(500).describe('Keywords to search for. Terms are ANDed.'),
    after: z.string().optional().describe('Only moments at or after this ISO date-time.'),
    before: z.string().optional().describe('Only moments at or before this ISO date-time.'),
    apps: z.array(z.string()).max(20).optional().describe('Restrict to these application names.'),
    limit: z.number().int().min(1).max(50).optional().default(15),
  }),
  run: (input) => {
    const query = {
      text: input.query,
      limit: input.limit || 15,
    };
    const after = toEpochMs(input.after, 'after');
    const before = toEpochMs(input.before, 'before');
    if (after !== undefined) query.from = after;
    if (before !== undefined) query.to = before;
    if (Array.isArray(input.apps) && input.apps.length) query.apps = input.apps;

    const results = localDataService.searchRewindFrames(query);
    const payload = {
      query: input.query,
      matches: results.map((result) => ({
        frame_id: result.frameId,
        session_id: result.sessionId,
        at: new Date(result.capturedAt).toISOString(),
        app: result.appName,
        window_title: result.windowTitle,
        snippet: result.snippet,
        excerpt: (result.ocrText || '').replace(/\s+/g, ' ').trim().slice(0, SCREEN_MEMORY_EXCERPT_CHARS),
      })),
    };
    if (!payload.matches.length) {
      payload.note = 'No screen history matched. Capture may be off, or the archive may not go back that far.';
    }
    return { rows: payload.matches.length, payload };
  },
});

const briizos_get_recent_activity = makeDataReadTool({
  name: 'briizos_get_recent_activity',
  description: [
    'Summarize what the user has been doing on this Mac over the last N minutes:',
    'which apps and windows, and short excerpts of the text that was on screen.',
    'Use this when the user refers to what they are "working on" or says "this" / "here" without naming it,',
    'and before offering help that depends on their current context.',
    'Returns an empty summary when screen capture is off.',
  ].join(' '),
  schema: z.object({
    minutes: z.number().int().min(1).max(1440).optional().default(30)
      .describe('How far back to look, in minutes. Capped at 24 hours.'),
  }),
  run: (input) => {
    const minutes = input.minutes || 30;
    const digest = localDataService.getRecentRewindActivity(minutes);
    const payload = {
      window: {
        minutes: digest.windowMinutes,
        from: new Date(digest.since).toISOString(),
        to: new Date(digest.until).toISOString(),
      },
      apps: digest.apps.map((app) => ({
        app: app.appName,
        moments: app.frames,
        first_seen: new Date(app.firstSeen).toISOString(),
        last_seen: new Date(app.lastSeen).toISOString(),
      })),
      windows: digest.titles.map((title) => ({
        app: title.appName,
        window_title: title.windowTitle,
        last_seen: new Date(title.lastSeen).toISOString(),
      })),
      on_screen_text: digest.excerpts.map((excerpt) => ({
        app: excerpt.appName,
        window_title: excerpt.windowTitle,
        at: new Date(excerpt.capturedAt).toISOString(),
        excerpt: excerpt.excerpt,
      })),
    };
    if (!payload.apps.length) {
      payload.note = 'No recent screen activity recorded. Screen capture may be off or paused.';
    }
    return { rows: payload.apps.length, payload };
  },
});

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
  briizos_update_project_scoring,
  briizos_schedule_task,
  briizos_unschedule,
  briizos_complete_placement,
  briizos_get_schedule,
  briizos_list_tasks,
  briizos_get_task,
  briizos_list_projects,
  briizos_get_project,
  briizos_query_organizer,
  briizos_list_placements,
  briizos_query_data,
  briizos_search_screen_memory,
  briizos_get_recent_activity,
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
  setLocalDataService,
};
