const TEN_MINUTES = 10 * 60 * 1000;
const LEVEL_WEIGHT = { debug: 0, info: 1, warn: 2, error: 3 };

export const LOG_FACETS = [
  { id: 'all', label: 'all', description: 'Every recorded activity' },
  { id: 'access', label: 'access', description: 'Permission rules and permission gates' },
  { id: 'auto', label: 'auto', description: 'AI execution and task automation' },
  { id: 'briizy', label: 'briizy', description: 'Screen capture and screen memory' },
  { id: 'cal-loc', label: 'cal/loc', description: 'Calendar, content, weather, and location' },
  { id: 'chat', label: 'chat', description: 'Conversation messages and responses' },
  { id: 'config', label: 'config', description: 'Settings, models, and local database' },
  { id: 'files', label: 'files', description: 'Files and media' },
  { id: 'plans', label: 'plans', description: 'Tasks, planning, and organization' },
  { id: 'sync', label: 'sync', description: 'Accounts, network, and cloud sync' },
  { id: 'tools', label: 'tools', description: 'Tool requests and results' },
  { id: 'ui', label: 'ui', description: 'App startup and interface behavior' },
  { id: 'problems', label: 'problems', description: 'Activities that need attention' },
];

function beginsWithAny(value, prefixes) {
  return prefixes.some((prefix) => value === prefix
    || value.startsWith(`${prefix}.`)
    || value.startsWith(`${prefix}-`)
    || value.startsWith(`${prefix} `));
}

export function facetForLog(log) {
  const tokens = [log?.type, log?.category]
    .map((value) => String(value || '').toLowerCase())
    .filter(Boolean);
  const matches = (prefixes) => tokens.some((token) => beginsWithAny(token, prefixes));
  if (matches(['permissions'])) return 'access';
  if (matches(['chat'])) return 'chat';
  if (matches(['tool', 'tools', 'tool-bridge'])) return 'tools';
  if (matches(['briizy', 'rewind', 'screen-memory'])) return 'briizy';
  if (matches([
    'calendar', 'event', 'weather', 'location', 'canvas', 'canvases', 'journal', 'notefalls',
  ])) return 'cal-loc';
  if (matches([
    'config', 'settings', 'local-data', 'local-db', 'database', 'model-config',
  ])) return 'config';
  if (matches(['fs', 'files', 'media'])) return 'files';
  if (matches([
    'auth', 'sync', 'cloud-gateway', 'firestore', 'network', 'gdrive',
  ])) return 'sync';
  if (matches([
    'agent', 'agent-jobs', 'automation', 'task-automation', 'langgraph',
  ])) return 'auto';
  if (matches(['task', 'tasks', 'forest', 'organizer', 'planner', 'plans'])) return 'plans';
  return 'ui';
}

function logTime(log) {
  const timestamp = new Date(log?.timestamp || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function legacyActivityKey(log) {
  if (log?.type === 'chat.user_message' || log?.type === 'chat.assistant_message') {
    return `message:${log.id}`;
  }
  const timeBucket = Math.floor(logTime(log) / TEN_MINUTES);
  const rootType = String(log?.type || log?.category || 'system').split(/[.-]/)[0];
  return [
    'legacy',
    log?.sessionId || 'unknown-session',
    facetForLog(log),
    rootType,
    timeBucket,
  ].join(':');
}

function activityKey(log) {
  const explicit = log?.activityId
    || log?.data?.activityId
    || log?.turnId
    || log?.data?.turnId
    || log?.runId
    || log?.data?.runId;
  return explicit ? `activity:${explicit}` : legacyActivityKey(log);
}

function highestLevel(logs) {
  return logs.reduce((highest, log) => (
    (LEVEL_WEIGHT[log?.level] ?? 1) > (LEVEL_WEIGHT[highest] ?? 1)
      ? log.level
      : highest
  ), 'debug');
}

function primaryFacet(logs, facets) {
  if (facets.has('chat')) return 'chat';
  if (facets.has('access')) return 'access';
  const counts = new Map();
  logs.forEach((log) => {
    const facet = facetForLog(log);
    counts.set(facet, (counts.get(facet) || 0) + 1);
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'ui';
}

function shortText(value, max = 150) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function activityTitle(logs, level) {
  const userMessage = logs.find((log) => log.type === 'chat.user_message');
  if (userMessage) {
    const content = userMessage.data?.content
      || String(userMessage.message || '').split('\n').slice(1).join('\n')
      || userMessage.message;
    return `Message sent: ${shortText(content) || 'No message text was recorded.'}`;
  }
  if (level === 'error' || level === 'warn') {
    const problem = [...logs].reverse().find((log) => log.level === level)
      || [...logs].reverse().find((log) => log.level === 'error' || log.level === 'warn');
    if (problem?.message) return shortText(problem.message);
  }
  const latestMeaningful = [...logs].reverse().find((log) => log.message);
  return shortText(latestMeaningful?.message) || 'Activity was recorded without an explanation.';
}

function repeatedDetails(logs) {
  const counts = new Map();
  logs.forEach((log) => {
    const key = `${log.type || 'event'}\u0000${log.message || ''}`;
    const current = counts.get(key) || { type: log.type, message: log.message, count: 0 };
    current.count += 1;
    counts.set(key, current);
  });
  return [...counts.values()]
    .filter(({ count }) => count > 1)
    .sort((left, right) => right.count - left.count);
}

export function buildLogActivities(logs = []) {
  const grouped = new Map();
  logs.forEach((log) => {
    if (!log?.id) return;
    const key = activityKey(log);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(log);
  });

  return [...grouped.entries()].map(([key, entries]) => {
    const details = [...entries].sort((left, right) => logTime(left) - logTime(right));
    const facets = new Set(details.map(facetForLog));
    const level = highestLevel(details);
    const startedAt = details[0]?.timestamp;
    const endedAt = details[details.length - 1]?.timestamp;
    return {
      id: key,
      activityId: key.startsWith('activity:') ? key.slice('activity:'.length) : null,
      details,
      detailCount: details.length,
      problemCount: details.filter((log) => log.level === 'warn' || log.level === 'error').length,
      level,
      facets,
      facet: primaryFacet(details, facets),
      title: activityTitle(details, level),
      startedAt,
      endedAt,
      repeated: repeatedDetails(details),
    };
  }).sort((left, right) => (
    new Date(right.endedAt || 0).getTime() - new Date(left.endedAt || 0).getTime()
  ));
}

export function activityMatchesQuery(activity, query) {
  if (!query) return true;
  return activity.details.some((entry) => {
    let evidence = '';
    try { evidence = JSON.stringify(entry.data || ''); } catch { evidence = String(entry.data || ''); }
    return [
      entry.message,
      entry.type,
      entry.category,
      entry.level,
      entry.activityId,
      evidence,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
}
