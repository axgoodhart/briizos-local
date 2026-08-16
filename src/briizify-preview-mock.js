/**
 * briizify-preview-mock — an in-memory window.api stand-in so the
 * Tasks Panel (and the briizify flow inside it) can be exercised in
 * a plain browser tab, no Electron required.
 *
 * Dev harness only: loaded exclusively by briizify-preview.html.
 * The mock "agent" reads the JSON payload briizify appends to its
 * prompt and answers with a deterministic priorifact (or one
 * clarifying question first, when ask_for_details is set).
 */

/* eslint-disable no-console */

function pad(value) { return String(value).padStart(2, '0'); }
const now = new Date();
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const nowMinute = () => new Date().getHours() * 60 + new Date().getMinutes();

const listeners = new Set();
function notify(domains) {
  listeners.forEach((listener) => {
    try { listener({ domains, revision: Date.now() }); } catch { /* noop */ }
  });
}

let taskSeq = 10;
const tasksRows = [
  {
    id: 'task-1', title: 'Complete SHEIN Returns', description: '', status: 'pending', priority: 'high',
    revision: 1, due_at: null, subtasks: [
      { id: 'st-1', title: 'Print label', status: 'pending', priority: 'medium' },
      { id: 'st-2', title: 'Box items', status: 'pending', priority: 'medium' },
    ], taskLog: [],
  },
  {
    id: 'task-2', title: 'Get HD from Stephen', description: '', status: 'pending', priority: 'normal',
    revision: 1, due_at: null, subtasks: [
      { id: 'st-3', title: 'Text Stephen', status: 'pending', priority: 'medium' },
    ], taskLog: [],
  },
];

const forestProjects = [
  { id: 'fp-1', name: '3D Zpyral', milestones: [] },
  { id: 'fp-2', name: 'alexgoodhart', milestones: [] },
  { id: 'fp-3', name: 'ComposerSite', milestones: [] },
  { id: 'fp-4', name: 'Sweep', importance: 5, size: 1, milestones: [] },
  { id: 'fp-5', name: 'Read a book', importance: 7, size: 2, relevance: 'rest and recharge', milestones: [] },
  { id: 'fp-6', name: 'Chromap', milestones: [] },
  { id: 'fp-7', name: 'Explorio', milestones: [] },
  { id: 'fp-8', name: 'I Want You Green', milestones: [] },
  { id: 'fp-9', name: 'Spruce', importance: 4, size: 1, milestones: [] },
  { id: 'fp-10', name: 'KYBDMIDI', milestones: [] },
  { id: 'fp-11', name: 'MidiFly', milestones: [] },
];

const organizerItems = [
  {
    id: 'ev-1', type: 'event', name: 'Lunch', scheduledDate: todayStr,
    start: 12 * 60 + 30, duration: 45, revision: 1,
  },
];

const placements = [
  {
    id: 'pl-1', ref_id: 'task-1', occurrence_date: todayStr,
    start_minute: 10 * 60, duration_minutes: 60, session_completed: false,
    revision: 1, task: { title: 'Complete SHEIN Returns', status: 'pending' },
  },
];

const settingsStore = new Map([['selected_model', 'mock-model']]);

const PREP = [
  'remember this is for relaxation.',
  'be in comfortable clothes',
  'silent mode electronics',
  'use proper lighting',
  'have some water nearby',
];
const STEPS = [
  'clear the immediate area',
  'set a gentle timer',
  'start with the smallest piece',
  'check the result once',
];
const SUPPORT = [
  'starting is the whole battle — 2 minutes counts',
  'nobody grades this; done beats perfect',
  'you can stop at the break guilt-free',
];

let askedOnce = false;

function buildMockPlan(payload) {
  const win = payload.window || { startMinute: Math.min(nowMinute() + 15, 22 * 60 - 120), endMinute: 22 * 60 };
  const channels = payload.channels || {};
  const picks = [
    ...(payload.candidates || []).map((candidate) => ({
      kind: candidate.type, refId: candidate.id, title: candidate.name || candidate.title,
    })),
    ...(payload.custom_items || []).map((item) => ({ kind: 'custom', refId: null, title: item })),
  ];
  let cursor = Math.max(win.startMinute, Math.min(nowMinute() - 20, 1439));
  const activities = [];
  picks.forEach((pick, index) => {
    const duration = index === 0 ? 40 : 15;
    if (index === 3) {
      activities.push({ kind: 'break', refId: null, title: 'break', date: payload.date, startMinute: cursor, durationMinutes: 25 });
      cursor += 30;
    }
    const entry = {
      kind: pick.kind, refId: pick.refId, title: pick.title,
      date: payload.date, startMinute: cursor, durationMinutes: duration,
    };
    if (channels.preparation) entry.prep = PREP;
    if (channels.steps) entry.steps = STEPS;
    if (channels.support) entry.support = SUPPORT;
    activities.push(entry);
    cursor += duration + 5;
  });
  return {
    summary: `Mock priorifact: ${picks.length} picks packed into the ${payload.timeframe} window.`,
    activities,
  };
}

window.api = {
  platform: 'darwin',

  forestLoadState: async () => ({ projects: forestProjects }),

  langgraphCreateThread: async (kind) => ({ thread_id: `mock-${kind}-thread` }),

  langgraphSendMessage: async (threadId, message) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const lastBrace = message.lastIndexOf('\n{');
    const payload = JSON.parse(message.slice(lastBrace + 1));
    const isAnswerTurn = message.includes('The user answered your previous question with:');
    let reply;
    if (payload.ask_for_details && !askedOnce && !isAnswerTurn) {
      askedOnce = true;
      reply = { needsDetails: true, question: 'Mock check: any hard stop time I should plan around?' };
    } else {
      reply = buildMockPlan(payload);
    }
    return { messages: [{ role: 'assistant', content: JSON.stringify(reply) }] };
  },

  localData: {
    onChanged: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    settings: {
      get: async (key) => (settingsStore.has(key) ? { key, value: settingsStore.get(key) } : null),
      set: async (key, value) => {
        settingsStore.set(key, value);
        notify(['settings']);
        return { row: { key, value } };
      },
      list: async () => Object.fromEntries(settingsStore),
    },
    tasks: {
      list: async () => tasksRows.map((row) => ({ ...row })),
      get: async (id) => tasksRows.find((row) => row.id === id) || null,
      create: async (input) => {
        const row = {
          id: `task-${taskSeq += 1}`, title: input.title, description: input.description || '',
          status: input.status || 'pending', priority: input.priority || 'normal',
          revision: 1, due_at: input.dueAt || null, subtasks: [], taskLog: [],
        };
        tasksRows.push(row);
        notify(['tasks']);
        return { row };
      },
      update: async (id, revision, patch) => {
        const row = tasksRows.find((entry) => entry.id === id);
        if (row) Object.assign(row, patch, { revision: (row.revision || 1) + 1 });
        notify(['tasks']);
        return { row };
      },
      steps: {
        create: async (parentId, input) => {
          const parent = tasksRows.find((entry) => entry.id === parentId);
          const row = { id: `st-${taskSeq += 1}`, title: input.title, status: input.status || 'pending', priority: 'medium' };
          if (parent) parent.subtasks = [...(parent.subtasks || []), row];
          notify(['tasks']);
          return { row };
        },
      },
    },
    placements: {
      list: async () => placements.map((row) => ({ ...row })),
      create: async () => { throw new Error('not in mock'); },
    },
    organizer: {
      list: async () => organizerItems.map((row) => ({ ...row })),
      create: async () => { throw new Error('not in mock'); },
      update: async () => { throw new Error('not in mock'); },
      archive: async () => { throw new Error('not in mock'); },
    },
    stickyNotes: { archive: async () => { throw new Error('not in mock'); } },
    threads: {
      messages: {
        append: async (threadId, message) => {
          console.log('[mock thread]', threadId, message.role, String(message.content).slice(0, 120));
        },
      },
    },
  },
};

console.log('[briizify-preview] window.api mock installed —', todayStr);
