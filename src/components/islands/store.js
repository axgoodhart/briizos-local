// Island store: desks > islands > cards. One module-level state shared by every
// mounted Island panel; saved through window.api.islandSaveState.
// Spec: docs/island-desks/DECISIONS.md
import { useSyncExternalStore, useCallback } from 'react';
import logger from '../../lib/logger';
import {
  ACCENTS, CARD_TEMPLATES, CARD_TYPES, DEFAULT_SHIP_STEPS, DEFAULT_STAGES, GRID, ISLAND_HEAD, ISLAND_MIN,
  ISLAND_PAD, ISLAND_RAIL, ISLAND_TEMPLATES, ISLAND_VIEWS, CARD_MIN, PROJECT_QUESTIONS, cardType,
} from './catalog';
import {
  accentForSeed, cleanTag, clamp, dedupe, hashString, hexToRgb, isMediaFile, normalizeText, rectsOverlap, snap, uid,
} from './util';

// ==== TIMING ====
const SAVE_DELAY_MS = 550;
const FILE_CHECK_EVERY_MS = 5 * 60 * 1000;
const AUTO_TAG_TARGET = 12;
const AUTO_TAG_START_DELAY_MS = 4000;
const AUTO_TAG_GAP_MS = 1200;
const AUTO_TAG_REJECTED_MAX = 100;
const CHANGES_MAX = 150;
const TAG_UNDO_WINDOW_MS = 7 * 86400000;
const JOURNAL_ENTRIES_MAX = 2000;
const TOAST_MS = 6000;
const OWN_SAVE_ECHO_MS = 1500;          // ignore the database change event caused by our own save

export const ALL_DESK_ID = 'desk-all';

/* ── State ─────────────────────────────────────────────────────────── */

const S = {
  loaded: false,
  loading: false,
  loadError: null,
  projects: [],
  desks: [],
  activeDeskId: ALL_DESK_ID,
  templates: { islands: [], cards: [] },
  changes: [],
  hunterDirs: [],
  viewport: { x: 260, y: 160, scale: 1 },
  ui: {
    selection: null,          // { islandId, cardId? }
    panel: null,              // 'settings' | 'journal' | 'desks' | 'hunt'
    panelIslandId: null,
    deskEditId: null,
    stack: false,
    minimap: true,
    query: '',
    tool: 'pointer',
    menu: null,               // new-card menu: { islandId, rect, screen }
    naming: null,             // new-island naming: { rect, screen }
    toasts: [],
    saveState: 'Ready',
    journalTab: 'log',
    focusIslandId: null,
  },
  fileStatus: {},             // path → 'ok' | 'missing'
  terminals: {},              // cardId → { running, cwd, command }
  tasks: {},                  // taskId → task row
  hunt: null,                 // File Hunter run for one island
};

let version = 0;
const listeners = new Set();
let saveTimer = null;
let pendingSaves = Promise.resolve();
let lastOwnSaveAt = 0;
let lastSaveError = null;
let attached = 0;
let stale = false;
let fileTimer = null;
let autoTagTimer = null;
let autoTagRunning = false;
let autoTagBlocked = false;
const autoTagSkipped = new Set();
const unsubscribers = [];

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return S;
}

// Selectors must return values that stay identical until they change (objects are replaced on write).
export function useIsland(selector) {
  const getSnapshot = useCallback(() => selector(S), [selector]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useIslandVersion() {
  return useSyncExternalStore(subscribe, () => version);
}

function log(level, type, message, data) {
  (logger[level] || logger.info)(type, message, data);
}

/* ── Normalizing and migrating saved data ──────────────────────────── */

function normalizeFile(file = {}) {
  const ext = file.typeGroup === 'folder' ? '' : normalizeText(file.ext || (file.name?.split('.').pop() ?? '')).replace(/^\./, '');
  return {
    ...file,
    id: file.id || uid('file'),
    name: file.name || 'Untitled',
    path: file.path || '',
    ext,
    size: Number(file.size || 0),
    modifiedAt: file.modifiedAt || new Date().toISOString(),
    typeGroup: file.typeGroup || 'other',
    previewable: Boolean(file.previewable),
    filehawk: file.filehawk === true,
    owned: file.owned === true,
    tags: dedupe((file.tags || []).map(cleanTag)),
  };
}

function normalizeCard(card = {}) {
  const type = cardType(card.kind);
  return {
    id: card.id || uid('card'),
    kind: CARD_TYPES.some((t) => t.kind === card.kind) ? card.kind : 'docs',
    title: typeof card.title === 'string' && card.title.trim() ? card.title : type.label,
    x: snap(Number.isFinite(Number(card.x)) ? Number(card.x) : 0),
    y: snap(Number.isFinite(Number(card.y)) ? Number(card.y) : 0),
    w: snap(Math.max(CARD_MIN.w, Number(card.w) || type.w)),
    h: snap(Math.max(CARD_MIN.h, Number(card.h) || type.h)),
    data: card.data && typeof card.data === 'object' ? card.data : {},
    createdAt: card.createdAt || new Date().toISOString(),
    updatedAt: card.updatedAt || card.createdAt || new Date().toISOString(),
  };
}

function normalizeWebLaunch(value) {
  if (!value || typeof value !== 'object' || typeof value.commandLine !== 'string' || !value.commandLine.trim()) return null;
  return {
    commandLine: value.commandLine.trim(),
    cwd: typeof value.cwd === 'string' ? value.cwd.trim() : '',
    urlTemplate: typeof value.urlTemplate === 'string' && value.urlTemplate.trim()
      ? value.urlTemplate.trim() : 'http://127.0.0.1:{PORT}/',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

// Old Island projects become islands: their files go into a Docs/Code card and a Media card.
function cardsFromFiles(files, coverFileId) {
  const media = files.filter(isMediaFile);
  const docs = files.filter((file) => !isMediaFile(file));
  const cards = [];
  let x = 0;
  if (media.length) {
    cards.push(normalizeCard({ kind: 'media', title: 'Media', x, y: 0, w: 380, h: 320, data: { fileIds: media.map((f) => f.id), coverFileId } }));
    x += 380 + GRID * 2;
  }
  if (docs.length) {
    cards.push(normalizeCard({ kind: 'docs', title: 'Files', x, y: 0, w: 340, h: 420, data: { fileIds: docs.map((f) => f.id) } }));
  }
  return cards;
}

function islandSizeFor(cards, current = {}) {
  const right = cards.reduce((max, c) => Math.max(max, c.x + c.w), 0);
  const bottom = cards.reduce((max, c) => Math.max(max, c.y + c.h), 0);
  return {
    w: snap(Math.max(ISLAND_MIN.w, current.w || 0, right + ISLAND_PAD * 2 + 160)),
    h: snap(Math.max(ISLAND_MIN.h, current.h || 0, bottom + ISLAND_HEAD + ISLAND_RAIL + ISLAND_PAD)),
  };
}

function normalizeIsland(project = {}) {
  const x = Number(project.x);
  const y = Number(project.y);
  const accentHex = project.accent || accentForSeed(project.name || project.id || uid()).hex;
  const files = (project.files || []).map(normalizeFile);
  const migrated = !Array.isArray(project.cards);
  const cards = (migrated ? cardsFromFiles(files, project.coverFileId) : project.cards).map(normalizeCard);
  const size = islandSizeFor(cards, { w: Number(project.w) || 0, h: Number(project.h) || 0 });
  const stages = Array.isArray(project.stages) && project.stages.length ? project.stages.map(String) : [...DEFAULT_STAGES];
  const lastFileTouch = files.reduce((max, f) => Math.max(max, Date.parse(f.modifiedAt) || 0), 0);
  const island = {
    ...project,
    id: project.id || uid('island'),
    name: project.name || 'Untitled island',
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    w: size.w,
    h: size.h,
    tags: dedupe((project.tags || []).map(cleanTag)),
    accent: accentHex,
    accentRgb: project.accentRgb || hexToRgb(accentHex),
    createdAt: project.createdAt || new Date().toISOString(),
    files,
    cards,
    mainCardId: cards.some((c) => c.id === project.mainCardId) ? project.mainCardId : (cards[0]?.id || null),
    milestones: (project.milestones || []).map((m) => ({
      id: m.id || uid('ms'),
      label: m.label || 'Milestone',
      date: m.date || new Date().toISOString().slice(0, 10),
      completed: Boolean(m.completed),
      description: m.description || '',
      estimatedDays: Number(m.estimatedDays) || 0,
      fileIds: Array.isArray(m.fileIds) ? m.fileIds : [],
      subtasks: (m.subtasks || []).map((s) => ({ id: s.id || uid('st'), text: s.text || '', done: Boolean(s.done) })),
    })),
    stages,
    stage: clamp(Number.isInteger(project.stage) ? project.stage : 0, 0, stages.length - 1),
    status: typeof project.status === 'string' ? project.status : '',
    field: typeof project.field === 'string' ? project.field : '',
    rootPath: typeof project.rootPath === 'string' ? project.rootPath : '',
    webLaunch: normalizeWebLaunch(project.webLaunch),
    answers: project.answers && typeof project.answers === 'object' ? project.answers : {},
    journal: {
      entries: Array.isArray(project.journal?.entries) ? project.journal.entries : [],
      chapter: typeof project.journal?.chapter === 'string' ? project.journal.chapter : '',
    },
    lastSessionAt: project.lastSessionAt || new Date(Math.max(lastFileTouch, Date.parse(project.createdAt) || 0) || Date.now()).toISOString(),
    deadline: typeof project.deadline === 'string' ? project.deadline : '',
    importance: Number.isInteger(project.importance) && project.importance >= 1 && project.importance <= 10 ? project.importance : null,
    size: project.size !== null && project.size !== undefined && project.size !== '' && Number.isFinite(Number(project.size)) && Number(project.size) >= 0
      ? Number(project.size) : null,
    relevance: typeof project.relevance === 'string' ? project.relevance : '',
    autoTag: {
      signature: typeof project.autoTag?.signature === 'string' ? project.autoTag.signature : '',
      checkedAt: project.autoTag?.checkedAt || null,
      rejected: dedupe((project.autoTag?.rejected || []).map(cleanTag)).slice(-AUTO_TAG_REJECTED_MAX),
    },
  };
  delete island.revision;
  delete island.expanded;
  if (migrated) {
    island.journal.entries = [{
      id: uid('entry'), at: new Date().toISOString(), kind: 'log',
      text: `Became an island. Its ${files.length} file${files.length === 1 ? '' : 's'} were placed into cards; nothing on disk moved.`,
    }];
  }
  return island;
}

function allDesk() {
  return {
    id: ALL_DESK_ID, name: 'All islands', builtIn: true, rule: { type: 'all' }, islandIds: [], layout: {},
    view: 'full', islandViews: {}, showAgents: true, dim: false, viewport: null, createdAt: new Date(0).toISOString(),
  };
}

function normalizeDesk(desk = {}) {
  return {
    id: desk.id || uid('desk'),
    name: desk.name || 'Untitled desk',
    builtIn: desk.id === ALL_DESK_ID,
    rule: desk.rule && typeof desk.rule === 'object' ? { type: desk.rule.type || 'manual', value: desk.rule.value ?? '' } : { type: 'manual', value: '' },
    islandIds: Array.isArray(desk.islandIds) ? desk.islandIds : [],
    layout: desk.layout && typeof desk.layout === 'object' ? desk.layout : {},
    view: ISLAND_VIEWS.some((v) => v.id === desk.view) ? desk.view : 'full',
    islandViews: desk.islandViews && typeof desk.islandViews === 'object' ? desk.islandViews : {},
    showAgents: desk.showAgents !== false,
    dim: desk.dim === true,
    viewport: desk.viewport && Number.isFinite(desk.viewport.scale) ? desk.viewport : null,
    createdAt: desk.createdAt || new Date().toISOString(),
  };
}

function normalizeChange(change) {
  if (!change || (change.kind !== 'tags' && change.kind !== 'search')) return null;
  return {
    ...change,
    id: change.id || uid('change'),
    at: change.at || new Date().toISOString(),
    projectName: change.projectName || 'Untitled island',
    seen: change.seen !== false,
    tags: Array.isArray(change.tags) ? change.tags : [],
    filesRead: Array.isArray(change.filesRead) ? change.filesRead : [],
    results: Array.isArray(change.results) ? change.results : [],
    addedPaths: Array.isArray(change.addedPaths) ? change.addedPaths : [],
    aiNotes: Array.isArray(change.aiNotes) ? change.aiNotes : [],
  };
}

function serialize() {
  return {
    version: 2,
    viewport: { ...S.viewport },
    hunterDirs: [...S.hunterDirs],
    changes: S.changes,
    desks: S.desks.map((desk) => ({ ...desk, builtIn: undefined })),
    activeDeskId: S.activeDeskId,
    templates: S.templates,
    projects: S.projects,
  };
}

/* ── Loading, saving, background work ─────────────────────────────── */

export async function load() {
  if (S.loading) return;
  S.loading = true;
  S.loadError = null;
  setUi({ saveState: 'Loading…' });
  try {
    await pendingSaves;
    const saved = await window.api.islandLoadState();
    const projects = (saved.projects || []).map(normalizeIsland);
    const desks = [allDesk(), ...(saved.desks || []).filter((d) => d && d.id !== ALL_DESK_ID).map(normalizeDesk)];
    const savedAll = (saved.desks || []).find((d) => d?.id === ALL_DESK_ID);
    if (savedAll) desks[0] = { ...normalizeDesk(savedAll), name: 'All islands', builtIn: true, rule: { type: 'all' } };
    const migratedCount = (saved.projects || []).filter((p) => !Array.isArray(p.cards)).length;
    Object.assign(S, {
      projects,
      desks,
      activeDeskId: desks.some((d) => d.id === saved.activeDeskId) ? saved.activeDeskId : ALL_DESK_ID,
      templates: {
        islands: Array.isArray(saved.templates?.islands) ? saved.templates.islands : [],
        cards: Array.isArray(saved.templates?.cards) ? saved.templates.cards : [],
      },
      changes: (saved.changes || []).map(normalizeChange).filter(Boolean),
      hunterDirs: Array.isArray(saved.hunterDirs) ? saved.hunterDirs : [],
      viewport: { x: 260, y: 160, scale: 1, ...(saved.viewport || {}) },
      loaded: true,
    });
    stale = false;
    setUi({ saveState: 'Ready' });
    log('info', 'island', `Islands opened with ${projects.length} island${projects.length === 1 ? '' : 's'} and ${desks.length} desk${desks.length === 1 ? '' : 's'}`, {
      desk: activeDesk().name,
      ...(migratedCount ? { carriedOver: `${migratedCount} older Island project${migratedCount === 1 ? ' was' : 's were'} turned into islands. Their files were placed into cards; nothing on disk moved.` } : {}),
    });
    if (migratedCount) scheduleSave(true);
    refreshTasks();
    checkFiles();
    queueAutoTag(AUTO_TAG_START_DELAY_MS);
  } catch (error) {
    S.loadError = error?.message || 'Unknown problem';
    setUi({ saveState: 'Could not load' });
    log('error', 'island', 'Islands could not load. Nothing was changed or saved.', {
      problem: S.loadError,
      nextStep: 'Press Retry in Islands. If it keeps failing, restart briizOS.',
    });
  } finally {
    S.loading = false;
    emit();
  }
}

export function attach() {
  attached += 1;
  if (attached > 1) return;
  if (!S.loaded || stale) load();
  unsubscribers.push(window.api.onIslandTerminalData?.(onTerminalData) || (() => {}));
  unsubscribers.push(window.api.onIslandTerminalState?.(onTerminalState) || (() => {}));
  unsubscribers.push(window.api.onIslandHuntProgress?.(onHuntProgress) || (() => {}));
  unsubscribers.push(window.api.localData?.onChanged?.(onDataChanged) || (() => {}));
  fileTimer = setInterval(checkFiles, FILE_CHECK_EVERY_MS);
}

export function detach() {
  attached = Math.max(0, attached - 1);
  if (attached > 0) return;
  if (saveTimer) { clearTimeout(saveTimer); void saveNow(); }
  unsubscribers.splice(0).forEach((off) => off?.());
  clearInterval(fileTimer);
  clearTimeout(autoTagTimer);
  stale = true;
}

export function scheduleSave(immediate = false) {
  if (!S.loaded) return;
  clearTimeout(saveTimer);
  setUi({ saveState: '◔' }, false);
  saveTimer = setTimeout(saveNow, immediate ? 60 : SAVE_DELAY_MS);
}

export async function saveNow() {
  saveTimer = null;
  if (!S.loaded) return;
  const snapshot = serialize();
  const saving = pendingSaves.then(() => {
    lastOwnSaveAt = Date.now();
    return window.api.islandSaveState(snapshot);
  });
  pendingSaves = saving.catch(() => {});
  try {
    await saving;
    lastOwnSaveAt = Date.now();
    lastSaveError = null;
    setUi({ saveState: `✓ ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` });
  } catch (error) {
    const message = error?.message || 'Unknown problem';
    const rejected = /INVALID_INPUT|too large|too long|max \d|must be/i.test(message);
    setUi({ saveState: rejected ? 'Not saved — too large' : 'Not saved' });
    if (message !== lastSaveError) {
      lastSaveError = message;
      log('error', 'island', rejected
        ? 'Islands could not save: the database refused the changes as too large or malformed. Your last saved version is intact.'
        : 'Islands could not save its latest changes. Your last saved version is intact.', { problem: message, nextStep: 'Keep working; Islands retries on the next change. Restart briizOS if this repeats.' });
    }
  }
}

// Another part of briizOS (e.g. the AI saving priority signals) changed a project: take those fields.
async function onDataChanged(change) {
  if (change?.domains?.includes('tasks')) refreshTasks();
  if (!change?.domains?.includes('island') || Date.now() - lastOwnSaveAt < OWN_SAVE_ECHO_MS || !S.loaded) return;
  try {
    const saved = await window.api.islandLoadState();
    let touched = 0;
    S.projects = S.projects.map((island) => {
      const fresh = saved.projects?.find((p) => p.id === island.id);
      if (!fresh) return island;
      const patch = {};
      ['deadline', 'importance', 'size', 'relevance'].forEach((key) => {
        const value = fresh[key] ?? (key === 'deadline' || key === 'relevance' ? '' : null);
        if (value !== island[key]) patch[key] = value;
      });
      if (!Object.keys(patch).length) return island;
      touched += 1;
      return { ...island, ...patch };
    });
    if (touched) {
      log('info', 'island.island', `Islands picked up priority changes made elsewhere in briizOS for ${touched} island${touched === 1 ? '' : 's'}`);
      emit();
    }
  } catch {
    /* the next open reloads everything */
  }
}

/* ── UI state ──────────────────────────────────────────────────────── */

export function setUi(patch, notify = true) {
  S.ui = { ...S.ui, ...patch };
  if (notify) emit();
}

export function toast(text, action = null) {
  const item = { id: uid('toast'), text, action };
  setUi({ toasts: [...S.ui.toasts, item].slice(-4) });
  setTimeout(() => setUi({ toasts: S.ui.toasts.filter((t) => t.id !== item.id) }), TOAST_MS);
}

export function dismissToast(id) {
  setUi({ toasts: S.ui.toasts.filter((t) => t.id !== id) });
}

export function select(selection) {
  setUi({ selection });
}

export function openPanel(panel, islandId) {
  setUi({ panel, panelIslandId: islandId === undefined ? S.ui.panelIslandId : islandId });
  if (islandId) touchIsland(islandId, false);
}

export function closePanel() {
  setUi({ panel: null });
}

/* ── Reads ─────────────────────────────────────────────────────────── */

export const getIsland = (id) => S.projects.find((p) => p.id === id) || null;
export const getCard = (islandId, cardId) => getIsland(islandId)?.cards.find((c) => c.id === cardId) || null;
export const activeDesk = () => S.desks.find((d) => d.id === S.activeDeskId) || S.desks[0] || allDesk();

const AGENT_LIVE = new Set(['active', 'in_progress', 'running', 'waiting', 'pending']);

export function agentRuns(island) {
  return island.cards
    .filter((c) => c.kind === 'agent' && c.data.taskId)
    .map((c) => ({ card: c, task: S.tasks[c.data.taskId] || null }));
}

export function liveAgentCount(island) {
  return agentRuns(island).filter(({ task }) => task && task.automated && AGENT_LIVE.has(task.status)).length;
}

export function openStepCount(island) {
  const local = island.cards.reduce((sum, c) => {
    if (c.kind === 'goals') return sum + (c.data.items || []).filter((i) => !i.done).length;
    if (c.kind === 'ship') return sum + (c.data.steps || []).filter((s) => !s.done).length;
    return sum;
  }, 0);
  return local;
}

export function islandTaskCount(island) {
  const goals = island.cards.filter((c) => c.kind === 'goals').reduce((sum, c) => sum + (c.data.items || []).filter((i) => !i.done).length, 0);
  const linked = Object.values(S.tasks).filter((t) => t.island_project_id === island.id && !t.source_key?.startsWith('island-agent:') && !['completed', 'cancelled'].includes(t.status)).length;
  return goals + linked;
}

function deskMatches(desk, island) {
  const value = String(desk.rule?.value ?? '').trim();
  switch (desk.rule?.type) {
    case 'all': return true;
    case 'manual': return false;
    case 'tag': return !!value && island.tags.includes(cleanTag(value.replace(/^#/, '')));
    case 'text': {
      if (!value) return false;
      const q = normalizeText(value);
      return [island.name, island.status, island.field, ...island.tags, ...island.files.map((f) => f.name)].some((s) => normalizeText(s).includes(q));
    }
    case 'startsWith': return !!value && normalizeText(island.name).startsWith(normalizeText(value));
    case 'activeWithin': {
      const days = Number(value) || 30;
      return Date.now() - (Date.parse(island.lastSessionAt) || 0) <= days * 86400000;
    }
    case 'deadlineWithin': {
      if (!island.deadline) return false;
      const days = Number(value) || 30;
      return Date.parse(`${island.deadline}T23:59:59`) - Date.now() <= days * 86400000;
    }
    case 'hasAgents': return island.cards.some((c) => c.kind === 'agent');
    default: return false;
  }
}

export function deskIslands(desk = activeDesk()) {
  const pinned = new Set(desk.islandIds || []);
  const list = S.projects.filter((island) => pinned.has(island.id) || deskMatches(desk, island));
  if (desk.rule?.type === 'activeWithin') list.sort((a, b) => (Date.parse(b.lastSessionAt) || 0) - (Date.parse(a.lastSessionAt) || 0));
  return list;
}

// Islands without a saved spot on a desk line up along its length, in order.
export function deskPositions(desk, islands) {
  const positions = {};
  if (desk.id === ALL_DESK_ID) {
    islands.forEach((island) => { positions[island.id] = { x: island.x, y: island.y }; });
    return positions;
  }
  let cursor = 0;
  islands.forEach((island) => {
    const saved = desk.layout?.[island.id];
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      positions[island.id] = saved;
      cursor = Math.max(cursor, saved.x + island.w + 160);
    }
  });
  islands.forEach((island) => {
    if (positions[island.id]) return;
    positions[island.id] = { x: cursor, y: 0 };
    cursor += island.w + 160;
  });
  return positions;
}

export function islandView(desk, island) {
  return desk.islandViews?.[island.id] || desk.view || 'full';
}

export function visibleCards(desk, island) {
  return cardsForView(island, islandView(desk, island), desk.showAgents);
}

export function cardsForView(island, view = 'full', showAgents = true) {
  let cards = island.cards;
  if (!showAgents) cards = cards.filter((c) => c.kind !== 'agent');
  if (view === 'main') {
    const main = cards.find((c) => c.id === island.mainCardId) || cards[0];
    return main ? [main] : [];
  }
  const def = ISLAND_VIEWS.find((v) => v.id === view);
  if (def?.kinds) cards = cards.filter((c) => def.kinds.includes(c.kind));
  return cards;
}

/* ── Islands ───────────────────────────────────────────────────────── */

function writeIsland(id, fn, { save = true, touch = true } = {}) {
  let changed = null;
  S.projects = S.projects.map((island) => {
    if (island.id !== id) return island;
    const next = fn(island);
    if (!next || next === island) return island;
    changed = touch ? { ...next, lastSessionAt: new Date().toISOString() } : next;
    return changed;
  });
  if (!changed) return null;
  emit();
  if (save) scheduleSave();
  return changed;
}

export function touchIsland(id, save = true) {
  writeIsland(id, (island) => ({ ...island }), { save });
}

export function addEntry(islandId, kind, text, extra = {}) {
  if (!text) return;
  writeIsland(islandId, (island) => ({
    ...island,
    journal: {
      ...island.journal,
      entries: [{ id: uid('entry'), at: new Date().toISOString(), kind, text, ...extra }, ...island.journal.entries].slice(0, JOURNAL_ENTRIES_MAX),
    },
  }));
}

export function updateEntry(islandId, entryId, patch) {
  writeIsland(islandId, (island) => ({
    ...island,
    journal: { ...island.journal, entries: island.journal.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) },
  }));
}

export function removeEntry(islandId, entryId) {
  writeIsland(islandId, (island) => ({
    ...island,
    journal: { ...island.journal, entries: island.journal.entries.filter((e) => e.id !== entryId) },
  }));
}

export function setChapter(islandId, chapter) {
  writeIsland(islandId, (island) => ({ ...island, journal: { ...island.journal, chapter } }));
}

function templateById(id) {
  return [...ISLAND_TEMPLATES, ...S.templates.islands].find((t) => t.id === id) || ISLAND_TEMPLATES[0];
}

// Template cards are laid out left to right in the island's content area.
function cardsFromTemplate(template) {
  let x = 0;
  const cards = [];
  let mainCardId = null;
  (template.cards || []).forEach((tc) => {
    const type = cardType(tc.kind);
    const card = normalizeCard({
      kind: tc.kind,
      title: tc.title,
      x: Number.isFinite(tc.x) ? tc.x : x,
      y: Number.isFinite(tc.y) ? tc.y : 0,
      w: tc.w || type.w,
      h: tc.h || type.h,
      data: JSON.parse(JSON.stringify(tc.data || {})),
    });
    if (tc.main) mainCardId = card.id;
    x = Math.max(x, card.x + card.w + GRID * 2);
    cards.push(card);
  });
  return { cards, mainCardId: mainCardId || cards[0]?.id || null };
}

export function createIsland({ name, rect, templateId = 'tpl-blank' }) {
  const template = templateById(templateId);
  const accent = ACCENTS[(S.projects.length + hashString(name)) % ACCENTS.length];
  const { cards, mainCardId } = cardsFromTemplate(template);
  const desk = activeDesk();
  const size = islandSizeFor(cards, { w: snap(rect?.w || 0), h: snap(rect?.h || 0) });
  const island = normalizeIsland({
    id: uid('island'),
    name: name.trim() || 'Untitled island',
    x: snap(rect?.x ?? 0),
    y: snap(rect?.y ?? 0),
    w: size.w,
    h: size.h,
    accent: accent.hex,
    accentRgb: accent.rgb,
    cards,
    mainCardId,
    stages: template.stages || DEFAULT_STAGES,
    stage: 0,
    files: [],
    tags: desk.rule?.type === 'tag' && desk.rule.value ? [cleanTag(String(desk.rule.value).replace(/^#/, ''))] : [],
    journal: { entries: [{ id: uid('entry'), at: new Date().toISOString(), kind: 'log', text: template.builtIn && template.id !== 'tpl-blank' ? `Started from the “${template.name}” template.` : 'Started.' }], chapter: '' },
    templateId: template.id,
  });
  S.projects = [...S.projects, island];
  if (desk.id !== ALL_DESK_ID) {
    writeDesk(desk.id, (d) => ({
      ...d,
      islandIds: deskMatches(d, island) ? d.islandIds : dedupe([...d.islandIds, island.id]),
      layout: { ...d.layout, [island.id]: { x: island.x, y: island.y } },
    }), false);
  }
  emit();
  scheduleSave(true);
  log('info', 'island.island', `Made the island “${island.name}”${template.id !== 'tpl-blank' ? ` from the “${template.name}” template` : ''}`, {
    desk: desk.name,
    cards: cards.map((c) => `${cardType(c.kind).label}: ${c.title}`),
  });
  return island;
}

export function updateIsland(id, patch, note = null) {
  const before = getIsland(id);
  const after = writeIsland(id, (island) => ({ ...island, ...patch }));
  if (!before || !after) return;
  if (note) addEntry(id, note.kind || 'log', note.text);
  if (patch.name && patch.name !== before.name) {
    log('info', 'island.island', `Renamed the island “${before.name}” to “${patch.name}”`);
  }
}

export function setStage(id, stageIndex) {
  const island = getIsland(id);
  if (!island) return;
  const index = clamp(stageIndex, 0, island.stages.length - 1);
  if (index === island.stage) return;
  updateIsland(id, { stage: index }, { kind: 'stage', text: `Moved to ${island.stages[index]}.` });
  log('info', 'island.island', `“${island.name}” moved to the stage “${island.stages[index]}”`, { from: island.stages[island.stage] });
}

export function moveIsland(id, pos) {
  const desk = activeDesk();
  const x = snap(pos.x);
  const y = snap(pos.y);
  if (desk.id === ALL_DESK_ID) writeIsland(id, (island) => ({ ...island, x, y }), { touch: false });
  else writeDesk(desk.id, (d) => ({ ...d, layout: { ...d.layout, [id]: { x, y } } }));
}

export function resizeIsland(id, size) {
  writeIsland(id, (island) => {
    const fit = islandSizeFor(island.cards, {});
    return { ...island, w: snap(Math.max(fit.w - 160, size.w)), h: snap(Math.max(fit.h, size.h)) };
  }, { touch: false });
}

export function deleteIsland(id) {
  const island = getIsland(id);
  if (!island) return;
  const index = S.projects.findIndex((p) => p.id === id);
  const deskRefs = S.desks.filter((d) => d.islandIds.includes(id) || d.layout[id]).map((d) => ({ id: d.id, islandIds: d.islandIds, layout: d.layout }));
  S.projects = S.projects.filter((p) => p.id !== id);
  S.desks = S.desks.map((d) => {
    if (!d.islandIds.includes(id) && !d.layout[id]) return d;
    const layout = { ...d.layout };
    delete layout[id];
    return { ...d, islandIds: d.islandIds.filter((x) => x !== id), layout };
  });
  if (S.ui.panelIslandId === id) setUi({ panel: null, panelIslandId: null }, false);
  if (S.ui.selection?.islandId === id) setUi({ selection: null }, false);
  emit();
  scheduleSave(true);
  log('info', 'island.island', `Deleted the island “${island.name}”. Files you brought in were not touched; they stay where they are on your Mac.`, {
    cards: island.cards.length,
    referencedFiles: island.files.filter((f) => !f.owned).length,
  });
  toast(`Deleted “${island.name}”`, {
    label: 'Undo',
    run: () => {
      S.projects = [...S.projects.slice(0, index), island, ...S.projects.slice(index)];
      S.desks = S.desks.map((d) => {
        const ref = deskRefs.find((r) => r.id === d.id);
        return ref ? { ...d, islandIds: ref.islandIds, layout: ref.layout } : d;
      });
      emit();
      scheduleSave(true);
      log('info', 'island.island', `Brought back the island “${island.name}”`);
    },
  });
}

export function setAnswer(islandId, question, text) {
  writeIsland(islandId, (island) => ({ ...island, answers: { ...island.answers, [question]: text } }));
}

/* ── Cards ─────────────────────────────────────────────────────────── */

function writeCard(islandId, cardId, fn, options) {
  return writeIsland(islandId, (island) => {
    let found = false;
    const cards = island.cards.map((card) => {
      if (card.id !== cardId) return card;
      const next = fn(card);
      if (!next || next === card) return card;
      found = true;
      return { ...next, updatedAt: new Date().toISOString() };
    });
    return found ? { ...island, cards } : island;
  }, options);
}

export function updateCard(islandId, cardId, patch) {
  return writeCard(islandId, cardId, (card) => ({ ...card, ...patch }));
}

export function updateCardData(islandId, cardId, patch) {
  return writeCard(islandId, cardId, (card) => ({ ...card, data: { ...card.data, ...(typeof patch === 'function' ? patch(card.data) : patch) } }));
}

// Find the nearest free spot for a rectangle among the island's other cards.
function freeSpot(island, rect, ignoreId = null) {
  const others = island.cards.filter((c) => c.id !== ignoreId);
  const fits = (r) => r.x >= 0 && r.y >= 0 && !others.some((c) => rectsOverlap(r, c, GRID));
  if (fits(rect)) return rect;
  for (let step = 1; step < 200; step += 1) {
    const d = step * GRID * 2;
    const tries = [
      { ...rect, x: rect.x + d }, { ...rect, y: rect.y + d }, { ...rect, x: rect.x - d }, { ...rect, y: rect.y - d },
      { ...rect, x: rect.x + d, y: rect.y + d },
    ];
    const ok = tries.find(fits);
    if (ok) return ok;
  }
  const right = others.reduce((max, c) => Math.max(max, c.x + c.w), 0);
  return { ...rect, x: right + GRID * 2, y: 0 };
}

export function addCard(islandId, { kind, title, rect, data = {}, template = null, select: shouldSelect = true }) {
  const island = getIsland(islandId);
  if (!island) return null;
  const type = cardType(kind);
  const base = {
    x: snap(rect?.x ?? 0),
    y: snap(rect?.y ?? 0),
    w: snap(Math.max(CARD_MIN.w, rect?.w >= CARD_MIN.w ? rect.w : (template?.w || type.w))),
    h: snap(Math.max(CARD_MIN.h, rect?.h >= CARD_MIN.h ? rect.h : (template?.h || type.h))),
  };
  const spot = freeSpot(island, base);
  const initialData = kind === 'ship' && !data.steps ? { steps: DEFAULT_SHIP_STEPS.map((s) => ({ ...s, id: uid('step') })), ...data } : data;
  const card = normalizeCard({
    kind,
    title: title || template?.title || type.label,
    ...spot,
    data: JSON.parse(JSON.stringify({ ...(template?.data || {}), ...initialData })),
  });
  writeIsland(islandId, (current) => {
    const cards = [...current.cards, card];
    const size = islandSizeFor(cards, current);
    return { ...current, cards, w: size.w, h: size.h, mainCardId: current.mainCardId || card.id };
  });
  addEntry(islandId, 'card', `Added the ${type.label} card “${card.title}”.`, { ref: card.id });
  log('info', 'island.card', `Added a ${type.label} card to “${island.name}”`, { card: card.title, template: template?.name || 'none' });
  if (shouldSelect) select({ islandId, cardId: card.id });
  return card;
}

export function moveCard(islandId, cardId, pos) {
  const island = getIsland(islandId);
  const card = island?.cards.find((c) => c.id === cardId);
  if (!card) return;
  const spot = freeSpot(island, { ...card, x: Math.max(0, snap(pos.x)), y: Math.max(0, snap(pos.y)) }, cardId);
  writeIsland(islandId, (current) => {
    const cards = current.cards.map((c) => (c.id === cardId ? { ...c, x: spot.x, y: spot.y } : c));
    const size = islandSizeFor(cards, current);
    return { ...current, cards, w: size.w, h: size.h };
  });
}

export function resizeCard(islandId, cardId, size) {
  writeIsland(islandId, (current) => {
    const cards = current.cards.map((c) => (c.id === cardId ? { ...c, w: snap(Math.max(CARD_MIN.w, size.w)), h: snap(Math.max(CARD_MIN.h, size.h)) } : c));
    const fit = islandSizeFor(cards, current);
    return { ...current, cards, w: fit.w, h: fit.h };
  });
}

export function removeCard(islandId, cardId) {
  const island = getIsland(islandId);
  const index = island?.cards.findIndex((c) => c.id === cardId) ?? -1;
  if (index < 0) return;
  const card = island.cards[index];
  const wasMain = island.mainCardId === cardId;
  writeIsland(islandId, (current) => {
    const cards = current.cards.filter((c) => c.id !== cardId);
    return { ...current, cards, mainCardId: wasMain ? (cards[0]?.id || null) : current.mainCardId };
  });
  if (card.kind === 'terminal') window.api.islandTerminalStop?.({ cardId, label: card.title });
  if (card.kind === 'webview') window.api.islandPreviewRelease?.({ cardId, reason: 'the card was removed' });
  if (S.ui.selection?.cardId === cardId) select({ islandId });
  addEntry(islandId, 'card', `Removed the ${cardType(card.kind).label} card “${card.title}”.`);
  log('info', 'island.card', `Removed the card “${card.title}” from “${island.name}”. No files were deleted.`);
  toast(`Removed “${card.title}”`, {
    label: 'Undo',
    run: () => {
      writeIsland(islandId, (current) => {
        const cards = [...current.cards];
        cards.splice(Math.min(index, cards.length), 0, card);
        return { ...current, cards, mainCardId: wasMain ? card.id : current.mainCardId };
      });
      log('info', 'island.card', `Brought back the card “${card.title}”`);
    },
  });
}

export function setMainCard(islandId, cardId) {
  const card = getCard(islandId, cardId);
  if (!card) return;
  updateIsland(islandId, { mainCardId: cardId });
  log('info', 'island.card', `“${card.title}” is now the main view of “${getIsland(islandId)?.name}”`);
}

/* ── Desks ─────────────────────────────────────────────────────────── */

function writeDesk(id, fn, notify = true) {
  let changed = false;
  S.desks = S.desks.map((desk) => {
    if (desk.id !== id) return desk;
    const next = fn(desk);
    if (!next || next === desk) return desk;
    changed = true;
    return next;
  });
  if (changed && notify) {
    emit();
    scheduleSave();
  }
  return changed;
}

export function switchDesk(id) {
  const desk = S.desks.find((d) => d.id === id);
  if (!desk || id === S.activeDeskId) return;
  S.activeDeskId = id;
  setUi({ selection: null, menu: null, naming: null, focusIslandId: null });
  scheduleSave();
  log('info', 'island.desk', `Switched to the desk “${desk.name}”`, { islands: deskIslands(desk).length });
}

export function createDesk({ name, rule = { type: 'manual', value: '' }, islandIds = [], view = 'full', showAgents = true }) {
  const desk = normalizeDesk({ id: uid('desk'), name: name.trim() || 'Untitled desk', rule, islandIds, view, showAgents });
  S.desks = [...S.desks, desk];
  S.activeDeskId = desk.id;
  setUi({ selection: null });
  scheduleSave(true);
  log('info', 'island.desk', `Made the desk “${desk.name}”`, { rule: rule.type, value: rule.value || 'none', islands: deskIslands(desk).length });
  return desk;
}

export function updateDesk(id, patch) {
  if (id === ALL_DESK_ID) {
    const allowed = { ...patch };
    delete allowed.name;
    delete allowed.rule;
    writeDesk(id, (d) => ({ ...d, ...allowed }));
    return;
  }
  writeDesk(id, (d) => ({ ...d, ...patch }));
}

export function setDeskViewport(id, viewport) {
  writeDesk(id, (d) => ({ ...d, viewport }), false);
  if (id === ALL_DESK_ID) S.viewport = viewport;
  clearTimeout(setDeskViewport.timer);
  setDeskViewport.timer = setTimeout(() => scheduleSave(), 800);
}

export function deleteDesk(id) {
  const desk = S.desks.find((d) => d.id === id);
  if (!desk || desk.builtIn) return;
  S.desks = S.desks.filter((d) => d.id !== id);
  if (S.activeDeskId === id) S.activeDeskId = ALL_DESK_ID;
  emit();
  scheduleSave(true);
  log('info', 'island.desk', `Deleted the desk “${desk.name}”. Its islands are untouched; desks only show islands.`);
  toast(`Deleted the desk “${desk.name}”`, {
    label: 'Undo',
    run: () => { S.desks = [...S.desks, desk]; emit(); scheduleSave(true); },
  });
}

export function setIslandOnDesk(deskId, islandId, on) {
  writeDesk(deskId, (d) => ({ ...d, islandIds: on ? dedupe([...d.islandIds, islandId]) : d.islandIds.filter((x) => x !== islandId) }));
}

export function setIslandView(islandId, viewId) {
  const desk = activeDesk();
  writeDesk(desk.id, (d) => ({ ...d, islandViews: { ...d.islandViews, [islandId]: viewId } }));
  log('info', 'island.desk', `On “${desk.name}”, “${getIsland(islandId)?.name}” now shows ${ISLAND_VIEWS.find((v) => v.id === viewId)?.label || viewId}`);
}

/* ── Templates ─────────────────────────────────────────────────────── */

function cardForTemplate(card) {
  const data = { ...card.data };
  delete data.taskId;
  delete data.history;
  delete data.fileIds;
  delete data.openFileId;
  delete data.notes;
  return { kind: card.kind, title: card.title, x: card.x, y: card.y, w: card.w, h: card.h, data };
}

export function saveIslandTemplate(islandId, name) {
  const island = getIsland(islandId);
  if (!island) return;
  const template = {
    id: uid('tpl'), name: name.trim() || island.name, stages: [...island.stages], createdAt: new Date().toISOString(),
    cards: island.cards.map((c) => ({ ...cardForTemplate(c), main: c.id === island.mainCardId })),
  };
  S.templates = { ...S.templates, islands: [...S.templates.islands, template] };
  emit();
  scheduleSave(true);
  toast(`Saved “${template.name}” as an island template`);
  log('info', 'island.island', `Saved “${island.name}” as the island template “${template.name}”. Files are not part of templates; only the cards and stages are.`, { cards: template.cards.length });
}

export function saveCardTemplate(islandId, cardId, name) {
  const card = getCard(islandId, cardId);
  if (!card) return;
  const template = { id: uid('ctpl'), name: name.trim() || card.title, createdAt: new Date().toISOString(), ...cardForTemplate(card) };
  S.templates = { ...S.templates, cards: [...S.templates.cards, template] };
  emit();
  scheduleSave(true);
  toast(`Saved “${template.name}” as a card template`);
  log('info', 'island.card', `Saved the card “${card.title}” as the template “${template.name}”`);
}

export function deleteTemplate(kind, id) {
  const list = kind === 'island' ? 'islands' : 'cards';
  const template = S.templates[list].find((t) => t.id === id);
  S.templates = { ...S.templates, [list]: S.templates[list].filter((t) => t.id !== id) };
  emit();
  scheduleSave(true);
  if (template) log('info', 'island', `Deleted the ${kind} template “${template.name}”`);
}

export const allIslandTemplates = () => [...ISLAND_TEMPLATES, ...S.templates.islands];
export const allCardTemplates = () => [...CARD_TEMPLATES, ...S.templates.cards];

/* ── Files ─────────────────────────────────────────────────────────── */

export function addFilesToIsland(islandId, rawFiles, { cardId = null, source = 'drop' } = {}) {
  const island = getIsland(islandId);
  if (!island) return 0;
  const known = new Set(island.files.map((f) => f.path));
  const added = rawFiles.map(normalizeFile).filter((f) => f.path && !known.has(f.path) && known.add(f.path));
  if (!added.length) return 0;
  const target = cardId ? island.cards.find((c) => c.id === cardId) : null;
  writeIsland(islandId, (current) => {
    let cards = current.cards;
    const place = (files, kind, title) => {
      if (!files.length) return;
      const into = target && (target.kind === kind || target.kind === 'docs') ? target : cards.find((c) => c.kind === kind);
      if (into) {
        cards = cards.map((c) => (c.id === into.id ? { ...c, data: { ...c.data, fileIds: dedupe([...(c.data.fileIds || []), ...files.map((f) => f.id)]) } } : c));
      } else {
        const type = cardType(kind);
        const spot = freeSpot({ cards }, { x: 0, y: 0, w: type.w, h: type.h });
        cards = [...cards, normalizeCard({ kind, title, ...spot, data: { fileIds: files.map((f) => f.id) } })];
      }
    };
    place(added.filter(isMediaFile), 'media', 'Media');
    place(added.filter((f) => !isMediaFile(f)), 'docs', 'Files');
    const size = islandSizeFor(cards, current);
    return { ...current, files: [...current.files, ...added], cards, w: size.w, h: size.h, mainCardId: current.mainCardId || cards[0]?.id || null };
  });
  addEntry(islandId, 'file', `Brought in ${added.length} file${added.length === 1 ? '' : 's'}: ${added.slice(0, 4).map((f) => f.name).join(', ')}${added.length > 4 ? '…' : ''}`);
  log('info', 'island.files', `Added ${added.length} file${added.length === 1 ? '' : 's'} to “${island.name}”. They stay where they are on your Mac; the island only points to them.`, {
    source,
    files: added.slice(0, 20).map((f) => f.path),
  });
  queueAutoTag();
  return added.length;
}

export function removeFileFromCard(islandId, cardId, fileId) {
  const island = getIsland(islandId);
  const file = island?.files.find((f) => f.id === fileId);
  if (!file) return;
  writeIsland(islandId, (current) => {
    const cards = current.cards.map((c) => (c.id === cardId ? { ...c, data: { ...c.data, fileIds: (c.data.fileIds || []).filter((id) => id !== fileId) } } : c));
    const stillUsed = cards.some((c) => (c.data.fileIds || []).includes(fileId));
    return { ...current, cards, files: stillUsed ? current.files : current.files.filter((f) => f.id !== fileId) };
  });
  log('info', 'island.files', `Took “${file.name}” off its card in “${island.name}”. The file itself was not touched.`, { path: file.path });
}

export async function importPaths(paths, { islandId = null, cardId = null, rect = null } = {}) {
  if (!paths.length) return;
  setUi({ saveState: 'Bringing files in…' });
  try {
    const imported = await window.api.islandImportPaths(paths);
    if (imported?.rejected) {
      toast(`Not brought in: ${imported.rejected.message}`);
      log('warn', 'island.files', `These files were not brought in: ${imported.rejected.message}`, imported.stats);
      return;
    }
    const groups = imported?.groups || [];
    if (!groups.length) {
      toast('Nothing to bring in (hidden or ignored files only)');
      return;
    }
    if (islandId) {
      const files = groups.flatMap((g) => g.files || []);
      const count = addFilesToIsland(islandId, files, { cardId, source: 'drop' });
      toast(count ? `Brought in ${count} file${count === 1 ? '' : 's'}` : 'Those files are already on this island');
      return;
    }
    let x = rect?.x ?? 0;
    groups.forEach((group) => {
      const island = createIsland({ name: group.name || 'Untitled island', rect: { x, y: rect?.y ?? 0, w: 0, h: 0 } });
      addFilesToIsland(island.id, group.files || [], { source: 'drop' });
      if (group.rootPath) updateIsland(island.id, { rootPath: group.rootPath });
      x += (getIsland(island.id)?.w || 800) + 160;
    });
  } catch (error) {
    toast('Could not bring those files in');
    log('error', 'island.files', 'The dropped files could not be brought in. Nothing was changed.', { problem: error?.message });
  } finally {
    setUi({ saveState: 'Ready' });
  }
}

export async function createOwnedDoc(islandId, cardId, fileName = 'Untitled.md', content = '') {
  const island = getIsland(islandId);
  if (!island) return null;
  try {
    const record = await window.api.islandOwnedCreate({ islandId, islandName: island.name, fileName, content });
    addFilesToIsland(islandId, [record], { cardId, source: 'made in briizOS' });
    if (cardId) updateCardData(islandId, cardId, (data) => ({ fileIds: dedupe([...(data.fileIds || []), record.id]), openFileId: record.id, newDoc: undefined, newDocBody: undefined }));
    return record;
  } catch (error) {
    toast('Could not make the document');
    log('error', 'island.files', `Could not make a new document in “${island.name}”`, { problem: error?.message });
    return null;
  }
}

export async function checkFiles() {
  const paths = dedupe(S.projects.flatMap((p) => p.files.map((f) => f.path)));
  if (!paths.length || !window.api.islandFilehawkCheck) return;
  try {
    const results = await window.api.islandFilehawkCheck(paths);
    const status = {};
    const watchedChanges = [];
    const byPath = new Map(results.map((r) => [r.path, r]));
    results.forEach((r) => { status[r.path] = r.exists ? 'ok' : 'missing'; });
    S.projects = S.projects.map((island) => {
      let changed = false;
      const files = island.files.map((file) => {
        const info = byPath.get(file.path);
        if (!info?.exists || info.modifiedAt === file.modifiedAt) return file;
        changed = true;
        if (file.filehawk) watchedChanges.push({ island, file });
        return { ...file, modifiedAt: info.modifiedAt, size: info.size };
      });
      return changed ? { ...island, files } : island;
    });
    S.fileStatus = status;
    const missing = Object.values(status).filter((s) => s === 'missing').length;
    emit();
    watchedChanges.forEach(({ island, file }) => addEntry(island.id, 'file', `“${file.name}” changed on disk.`));
    log(missing ? 'warn' : 'debug', 'island.files', missing
      ? `${missing} file${missing === 1 ? '' : 's'} on your islands could not be found where Islands expected ${missing === 1 ? 'it' : 'them'}. They show a warning on their cards with a “Find it” button.`
      : 'Every file on your islands is where Islands expects it.', { checked: paths.length });
  } catch (error) {
    log('warn', 'island.files', 'Islands could not check whether your files are still in place', { problem: error?.message });
  }
}

export async function relocateFile(islandId, fileId) {
  const island = getIsland(islandId);
  const file = island?.files.find((f) => f.id === fileId);
  if (!file) return;
  toast(`Looking for “${file.name}”…`);
  try {
    const hits = await window.api.islandFilehawkLocate(file.name, [], S.hunterDirs);
    const found = (hits?.results || hits || []).find?.((h) => h.path && h.path !== file.path);
    if (!found) {
      toast(`Could not find “${file.name}” anywhere searched`);
      log('warn', 'island.files', `FileHawk could not find “${file.name}” on this Mac`, { lastKnownPath: file.path });
      return;
    }
    writeIsland(islandId, (current) => ({
      ...current,
      files: current.files.map((f) => (f.id === fileId ? { ...f, path: found.path, modifiedAt: found.modifiedAt || f.modifiedAt, size: found.size ?? f.size } : f)),
    }));
    S.fileStatus = { ...S.fileStatus, [found.path]: 'ok' };
    addEntry(islandId, 'file', `Found “${file.name}” in its new place.`);
    log('info', 'island.files', `FileHawk found “${file.name}” in a new place and updated the island to point there. The file was not moved.`, { from: file.path, to: found.path });
    toast(`Found “${file.name}”`);
  } catch (error) {
    log('error', 'island.files', `FileHawk could not search for “${file.name}”`, { problem: error?.message });
  }
}

export async function archiveIsland(islandId) {
  const island = getIsland(islandId);
  if (!island) return;
  const filePaths = island.files.map((f) => f.path);
  if (!filePaths.length) {
    toast('This island has no files to archive yet');
    return;
  }
  toast(`Making a dated archive of “${island.name}”…`);
  try {
    const result = await window.api.islandArchiveIsland({ islandName: island.name, filePaths });
    addEntry(islandId, 'archive', `Made a dated archive (${result.copied} file${result.copied === 1 ? '' : 's'}).`, { path: result.zipPath });
    toast('Archive made', { label: 'Show', run: () => window.api.islandShowItemInFolder(result.zipPath) });
  } catch (error) {
    toast('Could not make the archive');
    log('error', 'island.archive', `Could not archive “${island.name}”. Your files were not changed.`, { problem: error?.message });
  }
}

/* ── Terminal cards ────────────────────────────────────────────────── */

const terminalListeners = new Map(); // cardId → Set(fn)

export function onTerminal(cardId, fn) {
  if (!terminalListeners.has(cardId)) terminalListeners.set(cardId, new Set());
  terminalListeners.get(cardId).add(fn);
  return () => terminalListeners.get(cardId)?.delete(fn);
}

function onTerminalData({ cardId, data, total }) {
  terminalListeners.get(cardId)?.forEach((fn) => fn(data, total));
}

function onTerminalState(payload) {
  S.terminals = { ...S.terminals, [payload.cardId]: { ...(S.terminals[payload.cardId] || {}), ...payload } };
  emit();
}

export async function runTerminal(islandId, cardId, command) {
  const card = getCard(islandId, cardId);
  const island = getIsland(islandId);
  if (!card || !command.trim()) return;
  const cwd = card.data.cwd || S.terminals[cardId]?.cwd || island.rootPath || '';
  updateCardData(islandId, cardId, (data) => ({
    command: command.trim(),
    history: dedupe([command.trim(), ...(data.history || [])]).slice(0, 50),
  }));
  try {
    const result = await window.api.islandTerminalRun({ cardId, command: command.trim(), cwd, label: `${island.name} · ${card.title}` });
    if (result?.cwd && !card.data.cwd) updateCardData(islandId, cardId, { cwd: result.cwd });
  } catch (error) {
    toast('The terminal could not run that');
    log('error', 'island.terminal', 'A terminal card could not start its command', { problem: error?.message, command });
  }
}

export function stopTerminal(islandId, cardId) {
  const card = getCard(islandId, cardId);
  window.api.islandTerminalStop?.({ cardId, label: card?.title });
}

export async function restartTerminal(islandId, cardId) {
  const card = getCard(islandId, cardId);
  if (!card?.data.command) return false;
  if (S.terminals[cardId]?.running) {
    stopTerminal(islandId, cardId);
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => (!S.terminals[cardId]?.running || Date.now() - started > 4000 ? resolve() : setTimeout(tick, 150));
      tick();
    });
  }
  await runTerminal(islandId, cardId, card.data.command);
  log('info', 'island.terminal', `Restarted “${card.title}” from its webview card`, { command: card.data.command });
  return true;
}

/* ── Agents (real briizOS tasks run by task automation) ────────────── */

export async function refreshTasks() {
  try {
    const rows = await window.api.localData?.tasks?.list?.({});
    if (!Array.isArray(rows)) return;
    const islandIds = new Set(S.projects.map((p) => p.id));
    const next = {};
    rows.filter((t) => t.island_project_id && islandIds.has(t.island_project_id)).forEach((t) => { next[t.id] = t; });
    S.tasks = next;
    emit();
  } catch {
    /* tasks show again on the next change */
  }
}

function agentBrief(island, card, goal) {
  const others = island.cards.filter((c) => c.id !== card.id).map((c) => `${cardType(c.kind).label} “${c.title}”`).join(', ') || 'none';
  const answers = PROJECT_QUESTIONS.map((q) => (island.answers[q] ? `${q} ${island.answers[q]}` : '')).filter(Boolean).join('\n');
  return [
    `Island: ${island.name}`,
    island.rootPath ? `Project folder: ${island.rootPath}` : '',
    island.webLaunch ? `Remembered web launch: ${island.webLaunch.commandLine}\nRun from: ${island.webLaunch.cwd || island.rootPath}\nOpen at: ${island.webLaunch.urlTemplate}` : '',
    `Stage: ${island.stages[island.stage]} (${island.stage + 1} of ${island.stages.length})`,
    island.status ? `Status: ${island.status}` : '',
    `Other cards on the island: ${others}`,
    answers ? `About the project:\n${answers}` : '',
    '',
    `Goal: ${goal}`,
  ].filter((line) => line !== '').join('\n');
}

export async function startAgent(islandId, cardId, goal) {
  const island = getIsland(islandId);
  const card = getCard(islandId, cardId);
  if (!island || !card || !goal.trim()) return;
  try {
    await saveNow();
    const created = await window.api.localData.tasks.create({
      title: goal.trim().slice(0, 300),
      description: agentBrief(island, card, goal.trim()),
      status: 'pending',
      priority: 'normal',
      automated: false,
      islandProjectId: islandId,
      sourceKey: `island-agent:${cardId}:${Date.now()}`,
    });
    const taskId = created?.row?.id;
    if (!taskId) throw new Error('The task was not created');
    const { automateTask } = await import('../../lib/taskAutomation');
    await automateTask(taskId);
    updateCardData(islandId, cardId, (data) => ({ goal: goal.trim(), taskId, history: dedupe([taskId, ...(data.history || [])]).slice(0, 20) }));
    addEntry(islandId, 'agent', `Gave an agent the goal: ${goal.trim()}`, { ref: cardId });
    log('info', 'island.agent', `Started an agent on “${island.name}”. It runs as a briizOS task, so its steps and permission requests also appear in the Tasks panel.`, {
      goal: goal.trim(),
      taskId,
      note: 'Today agents advance only while the briizOS window is open (docs/island-desks/DECISIONS.md → Background agents).',
    });
    refreshTasks();
  } catch (error) {
    toast('The agent could not start');
    log('error', 'island.agent', `Could not start an agent on “${island.name}”`, { problem: error?.message, goal });
  }
}

export async function pauseAgent(islandId, cardId) {
  const card = getCard(islandId, cardId);
  const task = S.tasks[card?.data.taskId];
  if (!task) return;
  try {
    const fresh = await window.api.localData.tasks.get(task.id);
    await window.api.localData.tasks.update(task.id, fresh.revision, { automated: false, status: 'pending' });
    addEntry(islandId, 'agent', `Paused the agent working on: ${task.title}`);
    log('info', 'island.agent', 'Paused an island\'s agent. Its steps so far are kept; starting it again resumes from the next unchecked step.', { goal: task.title });
    refreshTasks();
  } catch (error) {
    log('error', 'island.agent', 'Could not pause the agent', { problem: error?.message });
  }
}

export async function resumeAgent(islandId, cardId) {
  const card = getCard(islandId, cardId);
  if (!card?.data.taskId) return;
  try {
    const { automateTask } = await import('../../lib/taskAutomation');
    await automateTask(card.data.taskId);
    addEntry(islandId, 'agent', `Resumed the agent on: ${card.data.goal}`);
    log('info', 'island.agent', 'Resumed an island\'s agent', { goal: card.data.goal });
    refreshTasks();
  } catch (error) {
    log('error', 'island.agent', 'Islands could not resume the agent', { problem: error?.message });
  }
}

export async function answerAgent(islandId, cardId, text) {
  const card = getCard(islandId, cardId);
  if (!card?.data.taskId || !text.trim()) return;
  try {
    const { handleUserResponse } = await import('../../lib/taskAutomation');
    await handleUserResponse(card.data.taskId, text.trim());
    addEntry(islandId, 'agent', `Answered the agent: ${text.trim()}`);
    log('info', 'island.agent', 'Answered a question from an island\'s agent', { goal: card.data.goal });
    refreshTasks();
  } catch (error) {
    log('error', 'island.agent', 'Could not send your answer to the agent', { problem: error?.message });
  }
}

/* ── Auto tags (same behavior as the previous project board) ── */

function fileSignature(island) {
  return String(hashString(island.files.map((f) => f.path).sort().join('\n')));
}

function needsAutoTag(island) {
  const signature = fileSignature(island);
  return island.files.length > 0 && island.tags.length < AUTO_TAG_TARGET && island.autoTag.signature !== signature && !autoTagSkipped.has(`${island.id}:${signature}`);
}

export function queueAutoTag(delay = AUTO_TAG_GAP_MS) {
  if (autoTagBlocked || autoTagRunning || !attached) return;
  clearTimeout(autoTagTimer);
  autoTagTimer = setTimeout(runAutoTagQueue, delay);
}

async function runAutoTagQueue() {
  if (!S.loaded || autoTagRunning || autoTagBlocked || !attached) return;
  const pending = S.projects.filter(needsAutoTag);
  if (!pending.length) return;
  autoTagRunning = true;
  try {
    const configured = await window.api.isAIConfigured?.();
    if (!configured) {
      autoTagBlocked = true;
      log('warn', 'island.autotag', `Island auto tags are waiting: ${pending.length} island${pending.length === 1 ? ' has' : 's have'} fewer than ${AUTO_TAG_TARGET} tags, but no AI model is connected, so no files were read and nothing was changed.`, {
        islands: pending.map((p) => p.name),
        nextStep: 'Connect OpenAI, Claude or Gemini in Settings → Model, then reopen Islands.',
      });
      return;
    }
    for (const island of pending) {
      if (!attached || autoTagBlocked) return;
      const live = getIsland(island.id);
      if (live && needsAutoTag(live)) await autoTagIsland(live);
      await new Promise((r) => setTimeout(r, AUTO_TAG_GAP_MS));
    }
  } finally {
    autoTagRunning = false;
  }
}

async function autoTagIsland(island) {
  const signature = fileSignature(island);
  const result = await window.api.islandAutoTag({
    projectId: island.id,
    name: island.name,
    tags: [...island.tags],
    rejected: [...island.autoTag.rejected],
    need: AUTO_TAG_TARGET - island.tags.length,
    files: island.files.slice(0, 400).map((f) => ({ name: f.name, path: f.path, ext: f.ext, typeGroup: f.typeGroup, size: f.size })),
    milestones: island.milestones.map((m) => m.label).slice(0, 20),
    relevance: island.relevance,
  }).catch((error) => ({ ok: false, error: error?.message || 'Unknown problem' }));
  const live = getIsland(island.id);
  if (!live) return;
  if (!result?.ok) {
    autoTagSkipped.add(`${island.id}:${signature}`);
    if (/Settings/.test(result?.error || '')) autoTagBlocked = true;
    return;
  }
  const rejected = new Set(live.autoTag.rejected);
  const added = dedupe((result.tags || []).map(cleanTag)).filter((t) => t && !live.tags.includes(t) && !rejected.has(t)).slice(0, Math.max(0, AUTO_TAG_TARGET - live.tags.length));
  writeIsland(island.id, (current) => ({
    ...current,
    tags: dedupe([...current.tags, ...added]),
    autoTag: { ...current.autoTag, signature, checkedAt: new Date().toISOString() },
  }), { touch: false });
  if (added.length) {
    addChange({ kind: 'tags', projectId: island.id, projectName: island.name, tags: added, filesRead: (result.filesRead || []).map((f) => ({ name: f.name, lines: f.lines })), model: result.model || '' });
  }
}

export function removeTag(islandId, tag) {
  writeIsland(islandId, (island) => ({
    ...island,
    tags: island.tags.filter((t) => t !== tag),
    autoTag: { ...island.autoTag, rejected: dedupe([...island.autoTag.rejected, tag]).slice(-AUTO_TAG_REJECTED_MAX) },
  }));
}

export function addTag(islandId, raw) {
  const tag = cleanTag(raw.replace(/^#/, ''));
  if (!tag) return;
  writeIsland(islandId, (island) => ({ ...island, tags: dedupe([...island.tags, tag]) }));
}

/* ── Changes (auto tags and File Hunter), shown in the journal log ── */

function addChange(change) {
  const entry = normalizeChange({ ...change, id: uid('change'), at: new Date().toISOString(), seen: false });
  S.changes = [entry, ...S.changes].slice(0, CHANGES_MAX);
  emit();
  scheduleSave(true);
  return entry;
}

export function markChangesSeen(islandId) {
  if (!S.changes.some((c) => c.projectId === islandId && !c.seen)) return;
  S.changes = S.changes.map((c) => (c.projectId === islandId ? { ...c, seen: true } : c));
  emit();
  scheduleSave();
}

export function canUndoTags(change) {
  return change.kind === 'tags' && !change.undoneAt && Date.now() - Date.parse(change.at) < TAG_UNDO_WINDOW_MS;
}

export function undoTagChange(changeId) {
  const change = S.changes.find((c) => c.id === changeId);
  const island = getIsland(change?.projectId);
  if (!change || !island || !canUndoTags(change)) return;
  const undo = new Set(change.tags);
  writeIsland(island.id, (current) => ({
    ...current,
    tags: current.tags.filter((t) => !undo.has(t)),
    autoTag: { ...current.autoTag, rejected: dedupe([...current.autoTag.rejected, ...change.tags]).slice(-AUTO_TAG_REJECTED_MAX) },
  }));
  S.changes = S.changes.map((c) => (c.id === changeId ? { ...c, undoneAt: new Date().toISOString() } : c));
  emit();
  log('info', 'island.autotag', `Undid auto tags on “${island.name}”. Islands will not suggest these tags for this island again.`, { removed: change.tags.map((t) => `#${t}`) });
}

export function addHuntResults(changeId, indexes) {
  const change = S.changes.find((c) => c.id === changeId);
  const island = getIsland(change?.projectId);
  if (!change || !island) return;
  const picked = indexes.map((i) => change.results[i]).filter(Boolean);
  const count = addFilesToIsland(island.id, picked.map((r) => ({ ...r, id: uid('file'), tags: [] })), { source: 'File Hunter' });
  S.changes = S.changes.map((c) => (c.id === changeId ? { ...c, addedPaths: dedupe([...c.addedPaths, ...picked.map((r) => r.path)]) } : c));
  emit();
  scheduleSave(true);
  if (count) toast(`Added ${count} file${count === 1 ? '' : 's'} to “${island.name}”`);
}

/* ── File Hunter ───────────────────────────────────────────────────── */

export const HUNT_KINDS = [
  { key: 'docs', label: 'Docs and Code', on: true },
  { key: 'media', label: 'Image and Video', on: true },
  { key: 'mail', label: 'Emails and Texts', on: false },
  { key: 'books', label: 'PDF and ebooks', on: true },
  { key: 'folders', label: 'Folders', on: false },
];
export const HUNT_DATE_RANGES = [
  ['any', 'any time'], ['day', 'past day'], ['week', 'past week'], ['month', 'past month'],
  ['quarter', 'past 3 months'], ['year', 'past year'], ['older', 'over a year ago'],
];
export const HUNT_MODES = [['single', 'Single'], ['top', 'Top Hits'], ['all', 'Exhaustive']];

export function openHunt(islandId) {
  S.hunt = S.hunt?.islandId === islandId ? S.hunt : {
    islandId,
    description: '',
    kinds: Object.fromEntries(HUNT_KINDS.map((k) => [k.key, k.on])),
    dateRange: 'any',
    mode: 'top',
    running: false,
    runId: null,
    stage: '',
    error: '',
    changeId: null,
  };
  setUi({ panel: 'hunt', panelIslandId: islandId });
}

export function setHunt(patch) {
  S.hunt = { ...S.hunt, ...patch };
  emit();
}

function onHuntProgress(update) {
  if (!S.hunt?.running || S.hunt.runId !== update?.runId) return;
  setHunt({ stage: update.message || S.hunt.stage });
}

export async function startHunt() {
  const hunt = S.hunt;
  const island = getIsland(hunt?.islandId);
  if (!hunt || !island || hunt.running) return;
  if (hunt.mode === 'single' && !hunt.description.trim()) { setHunt({ error: 'Single mode needs a description of the file.' }); return; }
  if (!Object.values(hunt.kinds).some(Boolean)) { setHunt({ error: 'Pick at least one kind of file.' }); return; }
  const runId = uid('hunt');
  setHunt({ running: true, runId, stage: 'Starting…', error: '', changeId: null });
  let result;
  try {
    result = await window.api.islandHuntRun({
      runId,
      project: { name: island.name, tags: [...island.tags], fileNames: island.files.slice(0, 25).map((f) => f.name) },
      description: hunt.description.trim(),
      kinds: { ...hunt.kinds },
      dateRange: hunt.dateRange,
      mode: hunt.mode,
      excludePaths: island.files.map((f) => f.path),
      customDirs: [...S.hunterDirs],
    });
  } catch (error) {
    result = { ok: false, error: error?.message || 'Unknown problem' };
    log('error', 'island.hunter', `File Hunter could not start a search for “${island.name}”. Nothing was added.`, { problem: result.error });
  }
  if (S.hunt?.runId !== runId) return;
  if (!result?.ok) { setHunt({ running: false, stage: '', error: result?.error || 'The search failed.' }); return; }
  const entry = addChange({
    kind: 'search',
    projectId: island.id,
    projectName: island.name,
    mode: hunt.mode,
    description: hunt.description.trim(),
    kinds: HUNT_KINDS.filter((k) => hunt.kinds[k.key]).map((k) => k.label),
    dateRange: hunt.dateRange,
    summary: result.summary || '',
    engine: result.engine || 'spotlight',
    totalMatches: result.totalMatches || 0,
    truncated: !!result.truncated,
    aiNotes: result.ai?.notes || [],
    results: result.results || [],
    addedPaths: [],
  });
  setHunt({ running: false, stage: '', changeId: entry.id });
}

export async function addHunterDir() {
  const dir = await window.api.islandOpenDirectoryDialog?.();
  if (!dir) return;
  S.hunterDirs = dedupe([...S.hunterDirs, dir]);
  emit();
  scheduleSave(true);
  log('info', 'island.hunter', 'Added a folder to File Hunter searches', { folder: dir });
}

export function removeHunterDir(dir) {
  S.hunterDirs = S.hunterDirs.filter((d) => d !== dir);
  emit();
  scheduleSave(true);
}
