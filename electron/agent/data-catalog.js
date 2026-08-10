/**
 * briizOS data catalog — the single source of truth for what the agent can
 * query from the unified local database (SQLite via local-data-service).
 *
 * Consumers:
 *   1. system-prompt.js renders getDataCatalogSection(modality) into the lead
 *      agent's system prompt, so each chat mode is told exactly which objects
 *      it can query and with which read tools.
 *   2. tools.js implements the read tools listed here (names must match).
 *
 * Data philosophy (user directive, 2026-07-16): information is stored ONCE as
 * a value; panels and contexts are appearances (views) of those values.
 * "Projects" always means Forest projects — organizer `type='project'` rows
 * are a legacy concept and are deliberately absent from this catalog.
 *
 * This module is dependency-free on purpose: it can be unit-tested with plain
 * node and never drifts behind an Electron import.
 */

const BROWSE_TOOL = 'briizos_query_data';

const DATA_OBJECTS = [
  {
    key: 'tasks',
    title: 'Tasks',
    category: 'work',
    description: 'Tasks from the Tasks Panel, each with optional subtasks ("steps"/deck items). A task with subtasks renders as a deck.',
    fields: [
      'id, title, description',
      'status: pending | created | running | in_progress | active | waiting | deferred | completed | cancelled | blocked',
      'priority: low | normal | medium | high | urgent',
      'due_at (ISO timestamp or null)',
      'forest_project_id (backlink to a Forest project, or null)',
      'subtasks: [{ id, title, status, position }]',
      'taskLog, created_at, updated_at, revision',
    ],
    relationships: ['forest_project_id → forest_projects.id', 'placements.ref_id → tasks.id'],
    filters: ['status', 'priority', 'project_id', 'forest_project_id', 'limit'],
    tools: ['briizos_list_tasks', 'briizos_get_task'],
  },
  {
    key: 'forest_projects',
    title: 'Forest projects',
    category: 'work',
    description: 'The user\'s real projects, from the Forest board. These are the ONLY "projects" in briizOS.',
    fields: [
      'id, name, tags',
      'milestones: [{ name, completed }] (project phases)',
      'files: attached file names/paths',
      'optional scoring fields when set: deadline (YYYY-MM-DD), importance (1-10), size (hours), relevance',
      'revision',
    ],
    relationships: ['tasks.forest_project_id → forest_projects.id', 'files belong to exactly one Forest project appearance'],
    filters: ['limit; use project_id with briizos_get_project for detail'],
    tools: ['briizos_list_projects', 'briizos_get_project'],
  },
  {
    key: 'placements',
    title: 'Scheduled task sessions',
    category: 'time',
    description: 'Thin Calendar appearances of Tasks Panel tasks. The task value is joined live; recurring rows expand into occurrences at query time.',
    fields: [
      'id, ref_id (task id), occurrence_date',
      'start_minute, duration_minutes, recurrence',
      'session_completed (this occurrence happened)',
      'task: live task title, status, priority, project backlink',
    ],
    relationships: ['ref_id → tasks.id; a task can have many placements'],
    filters: ['date_from, date_to, ref_id, limit'],
    tools: ['briizos_list_placements', 'briizos_get_schedule'],
  },
  {
    key: 'organizer_events',
    title: 'Calendar events',
    category: 'time',
    description: 'Standalone calendar items (meetings, appointments). Scheduled tasks are NOT events — they are tasks appearing on the calendar.',
    fields: [
      'id, title, body, status, tags',
      'scheduled_start_at / scheduled_end_at (ISO timestamps)',
      'due_at, duration_seconds',
      'recurrence (rule object or null)',
      'created_at, updated_at, revision',
    ],
    relationships: ['Calendar is a union view of organizer_events + placements'],
    filters: ['type=event, date_from, date_to, limit'],
    tools: ['briizos_query_organizer', 'briizos_get_schedule', 'findScheduleConflicts'],
  },
  {
    key: 'organizer_notes',
    title: 'Notes',
    category: 'knowledge',
    description: 'Note panels (title + body), searchable by content.',
    fields: ['id, title, body, status, tags', 'created_at, updated_at, revision'],
    relationships: ['A sticky note is an organizer note with workspace appearance metadata'],
    filters: ['query text with briizos_search_notes; type=note with briizos_query_organizer'],
    tools: ['briizos_search_notes', 'briizos_query_organizer'],
  },
  {
    key: 'timers',
    title: 'Timers',
    category: 'time',
    description: 'Timer items from the organizer domain.',
    fields: ['id, title, body, status, duration_seconds, tags', 'created_at, updated_at, revision'],
    relationships: ['Stored as organizer items with type=timer'],
    filters: ['type=timer, date_from, date_to, limit'],
    tools: ['briizos_query_organizer'],
  },
  {
    key: 'journals',
    title: 'Journals and folios',
    category: 'knowledge',
    description: 'Journal notebooks and their ordered folios. Folios are typed pages whose content is structured JSON.',
    fields: ['journal: id, title, tags, cover, page, folioCount', 'folio: id, journalId, type, title, content, position', 'createdAt, updatedAt, revision'],
    relationships: ['folios.journalId → journals.id', 'Notefall posts may link to a journal'],
    filters: ['domain=journals, id (journal), query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'notefall_posts',
    title: 'Notefall posts',
    category: 'knowledge',
    description: 'Quick captures and recorder-derived posts, including notes, tags, media, screenshots, source, and session timing.',
    fields: ['id, body, notes, tags, statusDot', 'authorType, sourceApp, captureMode', 'journalId, media, screenshots, sessionStart, sessionEnd', 'createdAt, updatedAt, revision'],
    relationships: ['journalId → journals.id', 'attachments → files.id'],
    filters: ['domain=notefall_posts, id, parent_id (journal), query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'canvases',
    title: 'Canvases',
    category: 'creation',
    description: 'Saved mini-apps and HTML documents, including their source, render engine, form factor, and panel settings.',
    fields: ['id, title, size, source, url', 'renderEngine, formFactor, panelSettings', 'html (detail only), createdAt, updatedAt, revision'],
    relationships: ['Workspace panels can point to canvases'],
    filters: ['domain=canvases, id, query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'files',
    title: 'Known files',
    category: 'knowledge',
    description: 'Files indexed by briizOS through Forest, Media, Notefall attachments, or chat selection. This is metadata; use read_file for contents.',
    fields: ['id, path, display_name, kind, size, modified_at, availability', 'selected, in_media_queue, forest_project_count', 'created_at, updated_at, revision'],
    relationships: ['Referenced by Forest files, Notefall attachments, Media queue items, and selected chat files'],
    filters: ['domain=files, id, query, kind, status (availability), limit'],
    tools: [BROWSE_TOOL, 'read_file'],
  },
  {
    key: 'conversations',
    title: 'Conversation history',
    category: 'history',
    description: 'Stored chat, planner, prioritizer, and deck threads with ordered user, assistant, system, and tool messages.',
    fields: ['thread: id, kind, title, model_profile_id, status', 'message: id, sequence, role, content, isError, timestamp', 'created_at, updated_at, revision'],
    relationships: ['messages.threadId → threads.id', 'planner/prioritize/deck interactions use distinct thread kinds'],
    filters: ['domain=conversations, id (thread), query, kind, status, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'memory',
    title: 'Agent memory',
    category: 'history',
    description: 'The structured long-term profile and individual memory facts used to carry user context between conversations.',
    fields: ['workContext, personalContext, topOfMind', 'recentMonths, earlierContext, longTermBackground, agentContext', 'facts: id, content, category, confidence, source, timestamps'],
    relationships: ['facts may cite a source conversation thread'],
    filters: ['domain=memory, id (agent key), query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'recorder_sessions',
    title: 'Recorder sessions',
    category: 'history',
    description: 'Named activity-recording sessions and their ordered timestamped events.',
    fields: ['id, name, start_time, end_time, revision', 'events: id, type, timestamp, data'],
    relationships: ['Recorder-derived captures may also appear in Notefall'],
    filters: ['domain=recorder_sessions, id, query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'automation_runs',
    title: 'Automation runs',
    category: 'activity',
    description: 'Accepted commands and their execution runs, progress, result or error, linked task/thread, and ordered events.',
    fields: ['id, instruction, source, status, progressCurrent/progressTotal', 'taskId, threadId, resultSummary, errorCode/errorMessage', 'events, startedAt, finishedAt, createdAt, updatedAt, revision'],
    relationships: ['taskId → tasks.id', 'threadId → conversations.id'],
    filters: ['domain=automation_runs, id, query, status, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'media',
    title: 'Media queue and playback state',
    category: 'activity',
    description: 'The ordered local media queue plus the current item, playback position, volume, repeat, and shuffle state.',
    fields: ['tracks: queue_id, file_id, path, display_name, kind, size, availability', 'currentItemId, currentTime, volume, isMuted, repeatMode, shuffle, panelState, revision'],
    relationships: ['tracks reference files.id'],
    filters: ['domain=media, id (file or queue item), query, kind, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'briiztorm',
    title: 'briiZtorm state',
    category: 'creation',
    description: 'The 3D project-space state: projects, visual theme, flight settings, and saved flight presets.',
    fields: ['projects', 'theme', 'flightSettings', 'flightPresets'],
    relationships: ['This is a separate visual project representation, not the canonical Forest project domain'],
    filters: ['domain=briiztorm, query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'workspace',
    title: 'Workspace layout',
    category: 'configuration',
    description: 'The current columns, visible/hidden panels, panel sizing, links, and workspace-level layout state.',
    fields: ['layout version, columns, hiddenPanels, workspace', 'panels: id, feature_key, linked organizer/canvas, column, position, size, visible, view_mode', 'revision, updatedAt'],
    relationships: ['Panels may link to organizer notes/events or canvases; layout is appearance state, never a copy of content'],
    filters: ['domain=workspace, id (panel), kind (feature), status (visible|hidden), limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'settings',
    title: 'App and model settings',
    category: 'configuration',
    description: 'Non-secret user preferences, enabled skills, model profiles, permission policy, and provider-key availability booleans.',
    fields: ['setting keys and values (sensitive-looking keys recursively redacted)', 'model profile: name, provider, model, capabilities, default', 'provider key status: configured true/false only; key values are never readable'],
    relationships: ['threads may reference a model profile'],
    filters: ['domain=settings, query, include_content, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'logs',
    title: 'Log Panel entries',
    category: 'activity',
    description: 'The inspectable audit trail for app, AI, calendar, task, sync, and tool activity.',
    fields: ['id, type, source, category, message, data, level', 'threadId, sessionId, taskId, timestamp'],
    relationships: ['Entries may link to a conversation, recorder session, or task'],
    filters: ['domain=logs, id, query, kind (category), status (level), parent_id (thread), date_from, date_to, limit'],
    tools: [BROWSE_TOOL],
  },
  {
    key: 'system_status',
    title: 'Local data status',
    category: 'configuration',
    description: 'Database generation/schema status, per-domain revisions, and domains waiting for continuity sync.',
    fields: ['ready, storageGeneration, schemaVersion', 'domain revisions and updated_at', 'pending sync domains with revision/status metadata'],
    relationships: ['Describes freshness and sync state; it does not expose sync payloads or device identity'],
    filters: ['domain=system_status'],
    tools: [BROWSE_TOOL],
  },
];

// Explicitly documented exclusions keep "comprehensive" from turning into
// accidental credential or internal execution-state access.
const RESTRICTED_OBJECTS = [
  { key: 'secrets', reason: 'Encrypted provider credentials are never exposed to agent read tools.' },
  { key: 'sync_internals', reason: 'Raw outbox payloads, remote cursors, and shared-text mirrors remain service-internal.' },
  { key: 'agent_checkpoints', reason: 'LangGraph checkpoints and checkpoint writes are execution internals, not user information.' },
  { key: 'operation_receipts', reason: 'Idempotency receipts and request hashes remain execution internals.' },
  { key: 'identity_metadata', reason: 'Device identity and raw app metadata are not included in model context.' },
];

const QUERY_DATA_DOMAINS = DATA_OBJECTS
  .filter((objectDef) => objectDef.tools.includes(BROWSE_TOOL))
  .map((objectDef) => objectDef.key);

// Which objects each chat mode (modality) is told about. Modes absent from
// this map fall back to the full 'chat' slice; modes mapped to [] get no
// data section at all. Specialized modes receive only their useful domains.
const MODALITY_SLICES = {
  chat: DATA_OBJECTS.map((objectDef) => objectDef.key),
  plan: [
    'tasks', 'forest_projects', 'organizer_events', 'placements', 'organizer_notes', 'timers',
    'journals', 'notefall_posts', 'conversations', 'automation_runs', 'recorder_sessions',
  ],
  planner: ['organizer_events', 'placements', 'tasks', 'forest_projects'],
  prioritize: ['forest_projects', 'tasks'],
  research: ['organizer_notes', 'journals', 'notefall_posts', 'canvases', 'forest_projects', 'files', 'conversations'],
  code: ['forest_projects', 'files', 'canvases', 'conversations', 'automation_runs', 'logs', 'system_status'],
  report: ['tasks', 'forest_projects', 'organizer_events', 'placements', 'journals', 'notefall_posts', 'conversations', 'automation_runs', 'recorder_sessions', 'logs'],
};

// Chat gets a compact view of every readable domain. Whole objects are
// omitted instead of slicing raw XML when the budget is reached.
const MAX_SECTION_CHARS = 14000;

function renderObject(objectDef) {
  const lines = [
    `<object name="${objectDef.key}" category="${objectDef.category}">`,
    `${objectDef.title}: ${objectDef.description}`,
    `Fields: ${objectDef.fields.join('; ')}`,
  ];
  if (objectDef.relationships?.length) lines.push(`Relationships: ${objectDef.relationships.join('; ')}`);
  if (objectDef.filters?.length) lines.push(`Query filters: ${objectDef.filters.join('; ')}`);
  lines.push(`Read tools: ${objectDef.tools.join(', ')}`, '</object>');
  return lines.join('\n');
}

/**
 * Render the <briizos_data> system-prompt section for a chat mode.
 * Returns '' when the mode's slice is empty (prompt unchanged for that mode).
 */
function getDataCatalogSection(modality) {
  const slice = MODALITY_SLICES[modality] || MODALITY_SLICES.chat;
  if (!slice.length) return '';

  const byKey = new Map(DATA_OBJECTS.map((objectDef) => [objectDef.key, objectDef]));
  const objects = slice.map((key) => byKey.get(key)).filter(Boolean);
  if (!objects.length) return '';

  const header = `<briizos_data>
briizOS keeps all app information in one local database, and you can query it directly. The objects below are readable right now with the listed tools — reads never need confirmation, and every query is logged for the user. Values are stored once; panels are views of them. "Projects" always means Forest projects.
`;
  const guidance = `Guidance:
- Query the database instead of guessing or asking the user for information it already holds.
- Prefer specific filters (status, type, date range) over unfiltered dumps.
- Use include_content=false for discovery, then request one exact record with include_content=true.
- briizos_query_data covers the lower-frequency domains; the dedicated task/project/calendar tools remain the clearest path for core work.
- Never request unavailable internal data: ${RESTRICTED_OBJECTS.map((objectDef) => objectDef.key).join(', ')}.
- Writes go through separate briizos_* write tools, which may ask the user for confirmation.
</briizos_data>`;

  const blocks = [];
  const omitted = [];
  for (const objectDef of objects) {
    const block = renderObject(objectDef);
    const projected = [header, ...blocks, block, guidance].join('\n\n');
    if (projected.length <= MAX_SECTION_CHARS) blocks.push(block);
    else omitted.push(objectDef.key);
  }
  const omission = omitted.length
    ? `\n<catalog_budget_note>Additional readable objects omitted from this turn's prompt: ${omitted.join(', ')}. They remain available through ${BROWSE_TOOL}.</catalog_budget_note>\n`
    : '';
  return [header, blocks.join('\n'), omission, guidance].filter(Boolean).join('\n');
}

module.exports = {
  BROWSE_TOOL,
  DATA_OBJECTS,
  QUERY_DATA_DOMAINS,
  RESTRICTED_OBJECTS,
  MODALITY_SLICES,
  getDataCatalogSection,
};
