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

const DATA_OBJECTS = [
  {
    key: 'tasks',
    title: 'Tasks',
    description: 'Tasks from the Tasks Panel, each with optional subtasks ("steps"/deck items). A task with subtasks renders as a deck.',
    fields: [
      'id, title, description',
      'status: pending | active | deferred | completed',
      'priority: low | normal | medium | high | urgent',
      'due_at (ISO timestamp or null)',
      'forest_project_id (backlink to a Forest project, or null)',
      'subtasks: [{ id, title, status, position }]',
    ],
    tools: ['briizos_list_tasks', 'briizos_get_task'],
  },
  {
    key: 'forest_projects',
    title: 'Forest projects',
    description: 'The user\'s real projects, from the Forest board. These are the ONLY "projects" in briizOS.',
    fields: [
      'id, name, tags',
      'milestones: [{ name, completed }] (project phases)',
      'files: attached file names/paths',
      'optional scoring fields when set: deadline (YYYY-MM-DD), importance (1-10), size (hours), relevance',
    ],
    tools: ['briizos_list_projects', 'briizos_get_project'],
  },
  {
    key: 'placements',
    title: 'Scheduled task sessions',
    description: 'Thin Calendar appearances of Tasks Panel tasks. The task value is joined live; recurring rows expand into occurrences at query time.',
    fields: [
      'id, ref_id (task id), occurrence_date',
      'start_minute, duration_minutes, recurrence',
      'session_completed (this occurrence happened)',
      'task: live task title, status, priority, project backlink',
    ],
    tools: ['briizos_list_placements', 'briizos_get_schedule'],
  },
  {
    key: 'organizer_events',
    title: 'Calendar events',
    description: 'Standalone calendar items (meetings, appointments). Scheduled tasks are NOT events — they are tasks appearing on the calendar.',
    fields: [
      'id, title, status, tags',
      'scheduled_start_at / scheduled_end_at (ISO timestamps)',
      'due_at, duration_seconds',
      'recurrence (rule object or null)',
    ],
    tools: ['briizos_query_organizer', 'briizos_get_schedule', 'findScheduleConflicts'],
  },
  {
    key: 'organizer_notes',
    title: 'Notes',
    description: 'Note panels (title + body), searchable by content.',
    fields: ['id, title, body, status, tags'],
    tools: ['briizos_search_notes', 'briizos_query_organizer'],
  },
  {
    key: 'timers',
    title: 'Timers',
    description: 'Timer items from the organizer domain.',
    fields: ['id, title, status, duration_seconds'],
    tools: ['briizos_query_organizer'],
  },
];

// Which objects each chat mode (modality) is told about. Modes absent from
// this map fall back to the full 'chat' slice; modes mapped to [] get no
// data section at all (research/code/report stay lean on tokens).
const MODALITY_SLICES = {
  chat: ['tasks', 'forest_projects', 'organizer_events', 'placements', 'organizer_notes', 'timers'],
  plan: ['tasks', 'forest_projects', 'organizer_events', 'placements', 'organizer_notes', 'timers'],
  planner: ['organizer_events', 'placements', 'tasks', 'forest_projects'],
  prioritize: ['forest_projects', 'tasks'],
  research: [],
  code: [],
  report: [],
};

// Keep the section well under the memory section's budget so prompt size
// stays predictable (~1.5k tokens at 4 chars/token).
const MAX_SECTION_CHARS = 6000;

function renderObject(objectDef) {
  return [
    `<object name="${objectDef.key}">`,
    `${objectDef.title}: ${objectDef.description}`,
    `Fields: ${objectDef.fields.join('; ')}`,
    `Read tools: ${objectDef.tools.join(', ')}`,
    '</object>',
  ].join('\n');
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

  let section = `<briizos_data>
briizOS keeps all app information in one local database, and you can query it directly. The objects below are readable right now with the listed tools — reads never need confirmation, and every query is logged for the user. Values are stored once; panels are views of them. "Projects" always means Forest projects.

${objects.map(renderObject).join('\n')}

Guidance:
- Query the database instead of guessing or asking the user for information it already holds.
- Prefer specific filters (status, type, date range) over unfiltered dumps.
- Writes go through separate briizos_* write tools, which may ask the user for confirmation.
</briizos_data>`;

  if (section.length > MAX_SECTION_CHARS) {
    section = `${section.slice(0, MAX_SECTION_CHARS)}\n...\n</briizos_data>`;
  }
  return section;
}

module.exports = {
  DATA_OBJECTS,
  MODALITY_SLICES,
  getDataCatalogSection,
};
