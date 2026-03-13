/**
 * Firestore Persistence Layer for briizOS.2
 * Syncs with briizOS-Dev's Firebase collections
 *
 * Collection Structure (matches web app):
 * - users/{uid}/panels          (notes, type='note')
 * - users/{uid}/tasks           (tasks)
 * - users/{uid}/events          (schedule events)
 * - users/{uid}/organizer       (projects, type='project')
 *
 * Desktop-only collections:
 * - users/{uid}/desktopChatMessages/{id}
 * - users/{uid}/desktopSessions/{id}
 * - users/{uid}/desktopSelectedFiles/{id}
 * - users/{uid}/desktopSettings/config   (single doc)
 * - users/{uid}/desktopSettings/layout   (single doc)
 * - users/{uid}/desktopLogs/{id}
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureAuth, getCurrentUid } from './firebase';
import logger from './logger';
import { taskAdapter, organizerAdapter, calendarAdapter, noteAdapter } from './syncAdapters';

// =====================
// HELPER FUNCTIONS
// =====================

function removeUndefined(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTaskId() {
  return `tasks-${Date.now()}`;
}

function generateOrgItemId() {
  return `itm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateAgentJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeNested(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeNested);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = sanitizeNested(v);
    }
    return out;
  }
  return value;
}

/**
 * Safely convert any timestamp format to ISO string.
 * The web app stores timestamps as Date.now() numbers, but Firestore
 * serverTimestamp() merge-writes may overwrite them with Timestamp objects.
 * This handles both.
 */
function toISO(value) {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

/**
 * Get user-scoped collection references (web-compatible paths)
 */
function getUserCollections(uid) {
  const userDoc = doc(db, 'users', uid);
  return {
    panelsCol: collection(userDoc, 'panels'),
    tasksCol: collection(userDoc, 'tasks'),
    eventsCol: collection(userDoc, 'events'),
    organizerCol: collection(userDoc, 'organizer'),
    // Desktop-only (flattened to valid Firestore segment counts)
    chatMessagesCol: collection(userDoc, 'desktopChatMessages'),
    sessionsCol: collection(userDoc, 'desktopSessions'),
    selectedFilesCol: collection(userDoc, 'desktopSelectedFiles'),
    settingsDoc: doc(userDoc, 'desktopSettings', 'config'),
    layoutDoc: doc(userDoc, 'desktopSettings', 'layout'),
    logsCol: collection(userDoc, 'desktopLogs'),
    remoteChatCol: collection(userDoc, 'desktopRemoteChat'),
    agentJobsCol: collection(userDoc, 'desktopAgentJobs'),
    agentWorkersCol: collection(userDoc, 'desktopAgentWorkers'),
    agentToolOpsCol: collection(userDoc, 'desktopAgentToolOps'),
    agentEventsCol: collection(userDoc, 'desktopAgentEvents'),
    // App singletons
    minStackDoc: doc(userDoc, 'app', 'minStack'),
  };
}

/**
 * Subscribe to app/minStack in real-time (SyncContract §5)
 */
export function subscribeMinStack(callback) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { minStackDoc } = getUserCollections(uid);
  return onSnapshot(minStackDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const arr = Array.isArray(data.value) ? data.value.map(String) : [];
      callback(arr);
    } else {
      callback([]);
    }
  }, (error) => {
    logger.error('firestore', 'minStack subscription error', error?.message);
  });
}

// =====================
// COLOR TRANSFORM HELPERS
// =====================

/**
 * Convert hex color to HSL object for web compatibility
 */
function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return { h: 60, s: 97, l: 78 };
  hex = hex.replace('#', '');
  if (hex.length !== 6) return { h: 60, s: 97, l: 78 };

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Read customColor from Firestore — handles both legacy HSL objects and web hex strings
 */
function readCustomColor(value, fallback = '#fef08a') {
  if (!value) return fallback;
  // Web writes hex strings directly
  if (typeof value === 'string') return value;
  // Legacy local writes HSL objects {h, s, l}
  if (typeof value === 'object' && 'h' in value) return hslToHex(value);
  return fallback;
}

/**
 * Convert HSL object to hex color for desktop
 */
function hslToHex(hsl) {
  if (!hsl || typeof hsl !== 'object') return '#fef08a';
  const { h = 60, s = 97, l = 78 } = hsl;

  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// =====================
// NOTES FUNCTIONS (panels collection, type='note')
// =====================

/**
 * Subscribe to notes in real-time
 * Reads from panels collection where type === 'note'
 */
export function subscribeNotes(callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for notes subscription');
    return () => {};
  }

  const { panelsCol } = getUserCollections(uid);

  // Subscribe to full panels collection (matches web app — no where/orderBy)
  // Filter to notes client-side
  return onSnapshot(panelsCol, (snapshot) => {
    const notes = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.type !== 'note') return; // client-side filter
      const n = noteAdapter.normalizeOnRead(docSnap.id, data);
      notes.push({
        id: n.id,
        title: n.title,
        content: n.body,
        color: readCustomColor(n.customColor, data.color || '#fef08a'),
        position_x: n.position_x,
        position_y: n.position_y,
        width: n.width,
        height: n.height,
        is_pinned: n.active ? 1 : 0,
        is_docked: n.isDocked ? 1 : 0,
        created: toISO(n.createdAt),
        updated: toISO(n.updatedAt),
      });
    });
    // Sort client-side by updatedAt descending
    notes.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    callback(notes);
  }, (error) => {
    logger.error('firestore', 'Notes subscription error', error?.message);
  });
}

/**
 * Get all notes (one-time fetch)
 */
export async function getNotes() {
  const user = await ensureAuth();
  if (!user) return [];

  const { panelsCol } = getUserCollections(user.uid);
  const snapshot = await getDocs(panelsCol);

  const notes = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.type !== 'note') return; // client-side filter
    const n = noteAdapter.normalizeOnRead(docSnap.id, data);
    notes.push({
      id: n.id,
      title: n.title,
      content: n.body,
      color: readCustomColor(n.customColor, data.color || '#fef08a'),
      position_x: n.position_x,
      position_y: n.position_y,
      width: n.width,
      height: n.height,
      is_pinned: n.active ? 1 : 0,
      is_docked: n.isDocked ? 1 : 0,
      created: toISO(n.createdAt),
      updated: toISO(n.updatedAt),
    });
  });

  notes.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  return notes;
}

/**
 * Add or update a note
 */
export async function upsertNote(noteData) {
  const user = await ensureAuth();
  if (!user) return null;

  const { panelsCol } = getUserCollections(user.uid);
  const noteId = noteData.id || generateId();

  const isNew = !noteData.id;
  const now = Date.now();

  const firestoreData = noteAdapter.prepareForWrite(removeUndefined({
    id: noteId,
    type: 'note',
    title: noteData.title,
    body: noteData.content,
    customColor: noteData.color ? hexToHsl(noteData.color) : null,
    position_x: noteData.position_x,
    position_y: noteData.position_y,
    width: noteData.width,
    height: noteData.height,
    active: noteData.is_pinned === 1,
    isDocked: noteData.is_docked === 1,
    tags: isNew ? [] : undefined,
    autoHeight: isNew ? true : undefined,
    expansionCount: isNew ? 0 : undefined,
    createdAt: isNew ? now : undefined,
  }), isNew);

  await setDoc(doc(panelsCol, noteId), firestoreData, { merge: true });
  return noteId;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId) {
  const user = await ensureAuth();
  if (!user) return false;

  const { panelsCol } = getUserCollections(user.uid);
  await deleteDoc(doc(panelsCol, noteId));
  return true;
}

// =====================
// TASKS FUNCTIONS (tasks collection)
// =====================

/**
 * Subscribe to tasks in real-time
 */
export function subscribeTasks(callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for tasks subscription');
    return () => {};
  }

  const { tasksCol } = getUserCollections(uid);

  return onSnapshot(tasksCol, (snapshot) => {
    const tasks = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const t = taskAdapter.normalizeOnRead(docSnap.id, data);
      const actions = t.actions;

      // Sort actions oldest first
      actions.sort((a, b) => (a.created || 0) - (b.created || 0));

      tasks.push({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate,
        parent_id: t.parentId,
        created: toISO(t.createdAt),
        type: t.type,
        position: t.position,
        subtasks: actions.map(a => ({
          id: a.id,
          title: a.title || '',
          status: a.completed ? 'completed' : 'pending',
          priority: a.priority || 'medium',
          parent_id: t.id,
          created: toISO(a.created),
        })),
      });
    });

    // Sort top-level: priority then newest first
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 4;
      const pb = priorityOrder[b.priority] || 4;
      if (pa !== pb) return pa - pb;
      return (b.created || '').localeCompare(a.created || '');
    });

    callback(tasks);
  }, (error) => {
    logger.error('firestore', 'Tasks subscription error', error?.message);
  });
}

/**
 * Add a new task
 */
export async function addTask(title, options = {}) {
  const user = await ensureAuth();
  if (!user) return null;

  const { tasksCol } = getUserCollections(user.uid);
  const taskId = generateTaskId();
  const now = Date.now();

  const firestoreData = taskAdapter.prepareForWrite(removeUndefined({
    id: taskId,
    type: 'jobPanel',
    title: title,
    completed: false,
    completedAt: null,
    status: 'running',
    priority: options.priority || 'medium',
    dueDate: options.dueDate || null,
    parentId: options.parentId || null,
    position: options.position || { x: 0, y: 0 },
    createdAt: now,
  }), true);

  await setDoc(doc(tasksCol, taskId), firestoreData);
  return taskId;
}

/**
 * Add multiple subtasks (actions) to a parent task document
 * Stored as an embedded actions array on the parent doc
 */
export async function addSubtasks(parentId, subtasks) {
  const user = await ensureAuth();
  if (!user) return [];

  const { tasksCol } = getUserCollections(user.uid);
  const parentRef = doc(tasksCol, parentId);
  const parentSnap = await getDoc(parentRef);
  if (!parentSnap.exists()) return [];

  const parentData = parentSnap.data();
  const existingActions = Array.isArray(parentData.actions) ? [...parentData.actions] : [];
  const ids = [];

  for (const subtask of subtasks) {
    const actionId = generateTaskId();
    ids.push(actionId);
    const title = typeof subtask === 'string' ? subtask : subtask.title;
    const priority = typeof subtask === 'string' ? 'medium' : (subtask.priority || 'medium');

    existingActions.push({
      id: actionId,
      title: title,
      completed: false,
      completedAt: null,
      priority: priority,
      created: Date.now(),
    });
  }

  await setDoc(parentRef, {
    actions: existingActions,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return ids;
}

/**
 * Update a task or an action within a parent task
 * If parentId is provided in updates, it updates an action inside the parent's actions array
 */
export async function updateTask(id, updates) {
  const user = await ensureAuth();
  if (!user) return false;

  const { tasksCol } = getUserCollections(user.uid);

  // If this is a subtask/action update, modify the parent's actions array
  if (updates._parentId) {
    const parentRef = doc(tasksCol, updates._parentId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return false;

    const parentData = parentSnap.data();
    const actions = Array.isArray(parentData.actions) ? [...parentData.actions] : [];
    const actionIdx = actions.findIndex(a => a.id === id);
    if (actionIdx === -1) return false;

    if (updates.status !== undefined) {
      const isCompleted = updates.status === 'completed';
      actions[actionIdx].completed = isCompleted;
      actions[actionIdx].completedAt = isCompleted ? Date.now() : null;
    }
    if (updates.title !== undefined) {
      actions[actionIdx].title = updates.title;
    }
    if (updates.priority !== undefined) {
      actions[actionIdx].priority = updates.priority;
    }

    await setDoc(parentRef, { actions, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  }

  // Top-level task update
  const firestoreUpdates = { updatedAt: serverTimestamp() };

  if (updates.status !== undefined) {
    const isCompleted = updates.status === 'completed';
    firestoreUpdates.completed = isCompleted;
    firestoreUpdates.completedAt = isCompleted ? Date.now() : null;
    firestoreUpdates.status = isCompleted ? 'complete' : 'running';
  }
  if (updates.title !== undefined) {
    firestoreUpdates.title = updates.title;
  }
  if (updates.priority !== undefined) {
    firestoreUpdates.priority = updates.priority;
  }
  if (updates.dueDate !== undefined) {
    firestoreUpdates.dueDate = updates.dueDate;
  }
  if (updates.position !== undefined) {
    firestoreUpdates.position = updates.position;
  }

  await setDoc(doc(tasksCol, id), firestoreUpdates, { merge: true });
  return true;
}

/**
 * Delete a task (actions are embedded, so they go with it)
 * If _parentId is provided, deletes an action from the parent's actions array
 */
export async function deleteTask(id, options = {}) {
  const user = await ensureAuth();
  if (!user) return false;

  const { tasksCol } = getUserCollections(user.uid);

  // If deleting an action within a parent
  if (options._parentId) {
    const parentRef = doc(tasksCol, options._parentId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return false;

    const parentData = parentSnap.data();
    const actions = Array.isArray(parentData.actions) ? parentData.actions.filter(a => a.id !== id) : [];
    await setDoc(parentRef, { actions, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  }

  // Delete the whole task doc (actions embedded, go with it)
  await deleteDoc(doc(tasksCol, id));
  return true;
}

/**
 * Get a single task with its embedded actions (subtasks)
 */
export async function getTask(id) {
  const user = await ensureAuth();
  if (!user) return null;

  const { tasksCol } = getUserCollections(user.uid);
  const taskDoc = await getDoc(doc(tasksCol, id));
  if (!taskDoc.exists()) return null;

  const data = taskDoc.data();
  const t = taskAdapter.normalizeOnRead(taskDoc.id, data);
  const actions = t.actions;

  // Sort actions oldest first
  actions.sort((a, b) => (a.created || 0) - (b.created || 0));

  const task = {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate,
    parent_id: t.parentId,
    created: toISO(t.createdAt),
    position: t.position,
    subtasks: actions.map(a => ({
      id: a.id,
      title: a.title || '',
      status: a.completed ? 'completed' : 'pending',
      priority: a.priority || 'medium',
      parent_id: id,
      created: toISO(a.created),
    })),
  };

  return task;
}

// =====================
// SCHEDULE FUNCTIONS (events collection)
// =====================

/**
 * Subscribe to schedule for a specific date
 */
export function subscribeSchedule(dateStr, callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for schedule subscription');
    return () => {};
  }

  const { eventsCol } = getUserCollections(uid);
  const q = query(eventsCol, where('scheduledDate', '==', dateStr));

  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const c = calendarAdapter.normalizeOnRead(docSnap.id, data);
      const startMin = c.start ?? 540;
      const dur = c.durationMinutes ?? 60;
      items.push({
        id: c.id,
        title: c.title,
        description: c.body,
        date: c.scheduledDate || dateStr,
        start_time: c.time || minutesToTime(startMin),
        end_time: data.endTime || minutesToTime(startMin + dur),
        color: c.color,
        completed: c.completed ? 1 : 0,
        project_id: data.projectId || null,
        all_day: c.allDay ? 1 : 0,
      });
    });
    callback(items);
  }, (error) => {
    logger.error('firestore', 'Schedule subscription error', error?.message);
  });
}

/**
 * Subscribe to all schedule items (events collection)
 */
export function subscribeAllSchedule(callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for schedule subscription');
    return () => {};
  }

  const { eventsCol } = getUserCollections(uid);

  return onSnapshot(eventsCol, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const c = calendarAdapter.normalizeOnRead(docSnap.id, data);
      const date = normalizeDateStr(c.scheduledDate);
      if (!date) return;

      const startMin = c.start ?? 540;
      const dur = c.durationMinutes ?? 60;
      items.push({
        id: c.id,
        title: c.title,
        description: c.body,
        date,
        start_time: c.time || minutesToTime(startMin),
        end_time: data.endTime || minutesToTime(startMin + dur),
        color: c.color,
        completed: c.completed ? 1 : 0,
        project_id: data.projectId || null,
        all_day: c.allDay ? 1 : 0,
      });
    });
    callback(items);
  }, (error) => {
    logger.error('firestore', 'Schedule subscription error', error?.message);
  });
}

/**
 * Get schedule items for a specific date
 */
export async function getScheduleItems(options = {}) {
  const user = await ensureAuth();
  if (!user) return [];

  const { eventsCol } = getUserCollections(user.uid);
  const dateStr = options.date;
  if (!dateStr) return [];

  const q = query(eventsCol, where('scheduledDate', '==', dateStr));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const c = calendarAdapter.normalizeOnRead(docSnap.id, data);
    const startMin = c.start ?? 540;
    const dur = c.durationMinutes ?? 60;
    items.push({
      id: c.id,
      title: c.title,
      description: c.body,
      date: c.scheduledDate || dateStr,
      start_time: c.time || minutesToTime(startMin),
      end_time: data.endTime || minutesToTime(startMin + dur),
      color: c.color,
      completed: c.completed ? 1 : 0,
      project_id: data.projectId || null,
      all_day: c.allDay ? 1 : 0,
    });
  });

  return items;
}

/**
 * Add a schedule item
 */
export async function addScheduleItem(itemData) {
  const user = await ensureAuth();
  if (!user) return null;

  const { eventsCol } = getUserCollections(user.uid);
  const itemId = generateOrgItemId();
  const now = Date.now();
  const startMin = timeToMinutes(itemData.start_time);
  const endMin = timeToMinutes(itemData.end_time);
  const dur = endMin - startMin;

  const firestoreData = calendarAdapter.prepareForWrite(removeUndefined({
    id: itemId,
    type: 'event',
    title: itemData.title,
    body: itemData.description || '',
    scheduledDate: itemData.date,
    dateMode: 'event',
    time: itemData.start_time,
    endTime: itemData.end_time,
    start: startMin,
    durationMinutes: dur,
    end: startMin + dur,
    color: itemData.color || '#3b82f6',
    completed: false,
    completedAt: null,
    status: 'todo',
    allDay: itemData.all_day === 1,
    projectId: itemData.project_id || null,
    source: { mode: 'manual' },
    createdAt: now,
  }), true);

  await setDoc(doc(eventsCol, itemId), firestoreData);
  return itemId;
}

/**
 * Update a schedule item
 */
export async function updateScheduleItem(itemId, dateStr, updates) {
  const user = await ensureAuth();
  if (!user) return false;

  const { eventsCol } = getUserCollections(user.uid);
  const firestoreUpdates = { updatedAt: serverTimestamp() };

  if (updates.date !== undefined) {
    firestoreUpdates.scheduledDate = updates.date;
  }
  if (updates.scheduledDate !== undefined) {
    firestoreUpdates.scheduledDate = updates.scheduledDate;
  }
  if (updates.title !== undefined) {
    firestoreUpdates.title = updates.title;
  }
  if (updates.description !== undefined) {
    firestoreUpdates.body = updates.description;
  }
  if (updates.start_time !== undefined) {
    const startMin = timeToMinutes(updates.start_time);
    firestoreUpdates.time = updates.start_time;
    firestoreUpdates.start = startMin;
  }
  if (updates.end_time !== undefined) {
    firestoreUpdates.endTime = updates.end_time;
  }
  if (updates.start_time !== undefined && updates.end_time !== undefined) {
    const startMin = timeToMinutes(updates.start_time);
    const endMin = timeToMinutes(updates.end_time);
    const dur = endMin - startMin;
    firestoreUpdates.durationMinutes = dur;
    firestoreUpdates.end = startMin + dur;
  }
  if (updates.color !== undefined) firestoreUpdates.color = updates.color;
  if (updates.completed !== undefined) {
    const isCompleted = updates.completed === 1;
    firestoreUpdates.completed = isCompleted;
    firestoreUpdates.completedAt = isCompleted ? Date.now() : null;
    firestoreUpdates.status = isCompleted ? 'done' : 'todo';
  }

  await setDoc(doc(eventsCol, itemId), firestoreUpdates, { merge: true });
  return true;
}

/**
 * Delete a schedule item
 */
export async function deleteScheduleItem(itemId, dateStr) {
  const user = await ensureAuth();
  if (!user) return false;

  const { eventsCol } = getUserCollections(user.uid);
  await deleteDoc(doc(eventsCol, itemId));
  return true;
}

// =====================
// PROJECTS FUNCTIONS (organizer collection)
// =====================

/**
 * Subscribe to projects in real-time
 */
export function subscribeProjects(callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for projects subscription');
    return () => {};
  }

  const { organizerCol } = getUserCollections(uid);

  return onSnapshot(organizerCol, (snapshot) => {
    const projects = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only include project-type items (v1 also stores notes, events, timers here)
      if (data.type && data.type !== 'project') return;
      const o = organizerAdapter.normalizeOnRead(docSnap.id, data);
      projects.push({
        id: o.id,
        name: o.title,
        path: null,
        description: o.body,
        color: getDomainColor(o.domain) || o.color || '#3b82f6',
        status: o.completed ? 'completed' : (o.status === 'done' ? 'completed' : (o.status || 'active')),
        created: toISO(o.createdAt),
        updated: toISO(o.updatedAt),
        domain: o.domain,
        deadline: o.deadline,
        importance: o.importance,
        tasks: o.tasks,
        milestones: o.milestones,
      });
    });
    callback(projects);
  }, (error) => {
    logger.error('firestore', 'Projects subscription error', error?.message);
  });
}

/**
 * Get all projects (one-time fetch)
 */
export async function getProjects() {
  const user = await ensureAuth();
  if (!user) return [];

  const { organizerCol } = getUserCollections(user.uid);
  const snapshot = await getDocs(organizerCol);

  const projects = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.type && data.type !== 'project') return;
    const o = organizerAdapter.normalizeOnRead(docSnap.id, data);
    projects.push({
      id: o.id,
      name: o.title,
      path: null,
      description: o.body,
      color: getDomainColor(o.domain) || o.color || '#3b82f6',
      status: o.completed ? 'completed' : (o.status === 'done' ? 'completed' : (o.status || 'active')),
      created: toISO(o.createdAt),
      updated: toISO(o.updatedAt),
      domain: o.domain,
      deadline: o.deadline,
      importance: o.importance,
      tasks: o.tasks,
      milestones: o.milestones,
    });
  });

  return projects;
}

/**
 * Add or update a project
 */
export async function upsertProject(projectData) {
  const user = await ensureAuth();
  if (!user) return null;

  const { organizerCol } = getUserCollections(user.uid);
  const projectId = projectData.id || generateId();

  const isNew = !projectData.id;
  const now = Date.now();

  const firestoreData = organizerAdapter.prepareForWrite(removeUndefined({
    id: projectId,
    type: 'project',
    title: projectData.name,
    body: projectData.description,
    domain: projectData.domain,
    status: projectData.status === 'completed' ? 'done' : projectData.status,
    completedAt: projectData.status === 'completed' ? now : null,
    deadline: projectData.deadline,
    importance: projectData.importance || 5,
    size: projectData.size || 1,
    relevance: projectData.relevance || '',
    tags: projectData.tags || [],
    tasks: projectData.tasks || [],
    milestones: projectData.milestones || [],
    groupMemberships: isNew ? [] : undefined,
    inStream: isNew ? false : undefined,
    attachments: isNew ? [] : undefined,
    links: isNew ? [] : undefined,
    panelType: isNew ? null : undefined,
    panelId: isNew ? null : undefined,
    accent: isNew ? null : undefined,
    chat: isNew ? null : undefined,
    external: isNew ? null : undefined,
    source: isNew ? { mode: 'organizer' } : undefined,
    owner: isNew ? 'User1' : undefined,
    visibility: isNew ? 'private' : undefined,
    syncSource: isNew ? 'briizos' : undefined,
    createdAt: isNew ? now : undefined,
    lastModified: now,
  }), isNew);

  await setDoc(doc(organizerCol, projectId), firestoreData, { merge: true });
  return projectId;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId) {
  const user = await ensureAuth();
  if (!user) return false;

  const { organizerCol } = getUserCollections(user.uid);
  await deleteDoc(doc(organizerCol, projectId));
  return true;
}

// =====================
// CHAT MESSAGES (desktop-only)
// =====================

export function subscribeChatMessages(callback) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { chatMessagesCol } = getUserCollections(uid);
  const q = query(chatMessagesCol, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        role: data.role,
        content: data.content,
        timestamp: toISO(data.timestamp),
        isError: data.isError || false,
      });
    });
    callback(messages);
  }, (error) => {
    logger.error('firestore', 'Chat messages subscription error', error?.message);
  });
}

export async function getChatMessages() {
  const user = await ensureAuth();
  if (!user) return [];

  const { chatMessagesCol } = getUserCollections(user.uid);
  const q = query(chatMessagesCol, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);

  const messages = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    messages.push({
      id: docSnap.id,
      role: data.role,
      content: data.content,
      timestamp: toISO(data.timestamp),
      isError: data.isError || false,
    });
  });
  return messages;
}

export async function addChatMessage(role, content, isError = false) {
  const user = await ensureAuth();
  if (!user) return null;

  const { chatMessagesCol } = getUserCollections(user.uid);
  const msgId = generateId();

  await setDoc(doc(chatMessagesCol, msgId), {
    role,
    content,
    isError,
    timestamp: serverTimestamp(),
  });
  return msgId;
}

export async function clearChatMessages() {
  const user = await ensureAuth();
  if (!user) return false;

  const { chatMessagesCol } = getUserCollections(user.uid);
  const snapshot = await getDocs(chatMessagesCol);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
  return true;
}

// =====================
// SESSIONS (desktop-only)
// =====================

export function subscribeSessions(callback) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { sessionsCol } = getUserCollections(uid);
  const q = query(sessionsCol, orderBy('startTime', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const sessions = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: docSnap.id,
        name: data.name,
        start_time: toISO(data.startTime),
        end_time: data.endTime ? toISO(data.endTime) : null,
        data: data.data || null,
      });
    });
    callback(sessions);
  }, (error) => {
    logger.error('firestore', 'Sessions subscription error', error?.message);
  });
}

export async function getSessions() {
  const user = await ensureAuth();
  if (!user) return [];

  const { sessionsCol } = getUserCollections(user.uid);
  const q = query(sessionsCol, orderBy('startTime', 'desc'));
  const snapshot = await getDocs(q);

  const sessions = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    sessions.push({
      id: docSnap.id,
      name: data.name,
      start_time: toISO(data.startTime),
      end_time: data.endTime ? toISO(data.endTime) : null,
    });
  });
  return sessions;
}

export async function createSession(name) {
  const user = await ensureAuth();
  if (!user) return null;

  const { sessionsCol } = getUserCollections(user.uid);
  const sessionId = generateId();

  await setDoc(doc(sessionsCol, sessionId), {
    name,
    startTime: serverTimestamp(),
    endTime: null,
    data: { events: [] },
  });

  return { id: sessionId, name, startTime: new Date().toISOString() };
}

export async function endSession(sessionId) {
  const user = await ensureAuth();
  if (!user) return false;

  const { sessionsCol } = getUserCollections(user.uid);
  await setDoc(doc(sessionsCol, sessionId), { endTime: serverTimestamp() }, { merge: true });
  return true;
}

export async function addSessionEvent(sessionId, eventType, eventData) {
  const user = await ensureAuth();
  if (!user) return false;

  const { sessionsCol } = getUserCollections(user.uid);
  const sessionDoc = doc(sessionsCol, sessionId);
  const snapshot = await getDoc(sessionDoc);
  if (!snapshot.exists()) return false;

  const data = snapshot.data();
  const events = data.data?.events || [];
  events.push({
    type: eventType,
    timestamp: new Date().toISOString(),
    data: eventData,
  });

  await setDoc(sessionDoc, { data: { events } }, { merge: true });
  return true;
}

export async function getSession(sessionId) {
  const user = await ensureAuth();
  if (!user) return null;

  const { sessionsCol } = getUserCollections(user.uid);
  const snapshot = await getDoc(doc(sessionsCol, sessionId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    start_time: toISO(data.startTime),
    end_time: data.endTime ? toISO(data.endTime) : null,
    data: data.data || { events: [] },
  };
}

export async function deleteSession(sessionId) {
  const user = await ensureAuth();
  if (!user) return false;

  const { sessionsCol } = getUserCollections(user.uid);
  await deleteDoc(doc(sessionsCol, sessionId));
  return true;
}

export async function renameSession(sessionId, newName) {
  const user = await ensureAuth();
  if (!user) return false;

  const { sessionsCol } = getUserCollections(user.uid);
  await setDoc(doc(sessionsCol, sessionId), { name: newName }, { merge: true });
  return true;
}

export async function exportSession(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return null;
  return JSON.stringify(session, null, 2);
}

// =====================
// SELECTED FILES (desktop-only)
// =====================

export async function getSelectedFiles() {
  const user = await ensureAuth();
  if (!user) return [];

  const { selectedFilesCol } = getUserCollections(user.uid);
  const q = query(selectedFilesCol, orderBy('addedAt', 'desc'));
  const snapshot = await getDocs(q);

  const files = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    files.push({
      id: docSnap.id,
      file_path: data.filePath,
      file_name: data.fileName,
      added_at: toISO(data.addedAt),
    });
  });
  return files;
}

export async function addSelectedFile(filePath, fileName) {
  const user = await ensureAuth();
  if (!user) return null;

  const { selectedFilesCol } = getUserCollections(user.uid);
  // Use a safe ID derived from the file path
  const fileId = btoa(filePath).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 128);

  await setDoc(doc(selectedFilesCol, fileId), {
    filePath,
    fileName,
    addedAt: serverTimestamp(),
  });
  return fileId;
}

export async function removeSelectedFile(filePath) {
  const user = await ensureAuth();
  if (!user) return false;

  const { selectedFilesCol } = getUserCollections(user.uid);
  const fileId = btoa(filePath).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 128);
  await deleteDoc(doc(selectedFilesCol, fileId));
  return true;
}

export async function clearSelectedFiles() {
  const user = await ensureAuth();
  if (!user) return false;

  const { selectedFilesCol } = getUserCollections(user.uid);
  const snapshot = await getDocs(selectedFilesCol);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
  return true;
}

// =====================
// SETTINGS (desktop-only)
// =====================

export async function getAllSettings() {
  const user = await ensureAuth();
  if (!user) return {};

  const { settingsDoc } = getUserCollections(user.uid);
  const snapshot = await getDoc(settingsDoc);
  if (!snapshot.exists()) return {};
  return snapshot.data() || {};
}

export async function setSetting(key, value) {
  const user = await ensureAuth();
  if (!user) return false;

  const { settingsDoc } = getUserCollections(user.uid);
  await setDoc(settingsDoc, { [key]: value }, { merge: true });
  return true;
}

export async function getSetting(key) {
  const settings = await getAllSettings();
  return settings[key] || null;
}

// =====================
// LAYOUT (desktop-only)
// =====================

export async function getLayout() {
  const user = await ensureAuth();
  if (!user) return null;

  const { layoutDoc } = getUserCollections(user.uid);
  const snapshot = await getDoc(layoutDoc);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    config: typeof data.config === 'string' ? JSON.parse(data.config) : data.config,
    updatedAt: toISO(data.updatedAt),
  };
}

export async function saveLayout(config) {
  const user = await ensureAuth();
  if (!user) return false;

  const { layoutDoc } = getUserCollections(user.uid);
  await setDoc(layoutDoc, {
    config,
    updatedAt: serverTimestamp(),
  });
  return true;
}

// =====================
// LOGS (desktop-only)
// =====================

export async function getLogs(limitCount = 100) {
  const user = await ensureAuth();
  if (!user) return [];

  const { logsCol } = getUserCollections(user.uid);
  const q = query(logsCol, orderBy('timestamp', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);

  const logs = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    logs.push({
      id: docSnap.id,
      timestamp: toISO(data.timestamp),
      action: data.action,
      message: data.message,
    });
  });
  return logs;
}

export async function addLog(action, message = null) {
  const user = await ensureAuth();
  if (!user) return null;

  const { logsCol } = getUserCollections(user.uid);
  const logId = generateId();

  await setDoc(doc(logsCol, logId), {
    action,
    message,
    timestamp: serverTimestamp(),
  });
  return logId;
}

export function subscribeLogs(callback, limitCount = 15) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { logsCol } = getUserCollections(uid);
  const q = query(logsCol, orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      logs.push({
        id: docSnap.id,
        timestamp: toISO(data.timestamp),
        action: data.action,
        message: data.message,
      });
    });
    callback(logs);
  }, (error) => {
    logger.error('firestore', 'Logs subscription error', error?.message);
  });
}

// =====================
// ORGANIZER ITEMS (unified collection - matches briizOS-Dev v1)
// =====================

/**
 * Normalize date string: handles both YYYY-MM-DD and YYYYMMDD formats
 */
export function normalizeDateStr(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
  }
  return dateStr;
}

export function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateYMD(str) {
  if (!str) return new Date();
  const normalized = normalizeDateStr(str);
  if (!normalized) return new Date();
  const [y, m, d] = normalized.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/**
 * Normalize a Firestore organizer doc into a unified item shape
 * compatible with both v1 items and v2 projects.
 */
function normalizeOrganizerItem(id, data) {
  const o = organizerAdapter.normalizeOnRead(id, data);
  return {
    ...o,
    // Keep legacy 'name' field for internal Local UI compat (maps from canonical 'title')
    name: o.title,
    // Normalize dates through Local helpers
    scheduledDate: normalizeDateStr(o.scheduledDate),
    due: normalizeDateStr(o.due),
    dateValue: normalizeDateStr(o.dateValue),
    // Project-specific color from domain
    color: getDomainColor(o.domain) || o.color || null,
  };
}

/**
 * Subscribe to ALL organizer items (unified collection).
 * Reads notes, events, timers, projects, chats, externals from
 * the same collection v1 writes to.
 */
export function subscribeOrganizerItems(callback) {
  const uid = getCurrentUid();
  if (!uid) {
    logger.warn('firestore', 'No user authenticated for organizer items subscription');
    return () => {};
  }

  const { organizerCol } = getUserCollections(uid);

  return onSnapshot(organizerCol, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push(normalizeOrganizerItem(docSnap.id, data));
    });
    callback(items);
  }, (error) => {
    logger.error('firestore', 'Organizer items subscription error', error?.message);
  });
}

/**
 * Add a new organizer item (any type: note, event, timer, etc.)
 * Writes in v1-compatible format to the organizer collection.
 */
export async function addOrganizerItem(itemData) {
  const user = await ensureAuth();
  if (!user) return null;

  const { organizerCol } = getUserCollections(user.uid);
  const itemId = itemData.id || `itm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const now = Date.now();

  const firestoreData = organizerAdapter.prepareForWrite(removeUndefined({
    id: itemId,
    type: itemData.type || 'note',
    title: itemData.name || itemData.title,
    body: itemData.body || '',
    createdAt: now,
    scheduledDate: itemData.scheduledDate || null,
    start: itemData.start ?? null,
    end: itemData.end ?? null,
    due: itemData.due || null,
    duration: itemData.duration ?? null,
    completedAt: null,
    status: 'todo',
    priority: itemData.priority || 'auto',
    tags: itemData.tags || [],
    groupMemberships: itemData.groupMemberships || [],
    inStream: itemData.inStream ?? false,
    attachments: itemData.attachments || [],
    links: itemData.links || [],
    panelType: itemData.panelType || null,
    panelId: itemData.panelId || null,
    accent: itemData.accent || null,
    chat: itemData.chat || null,
    external: itemData.external || null,
    reminderEventId: itemData.reminderEventId || null,
    source: itemData.source || { mode: 'organizer' },
    dateMode: itemData.dateMode || (itemData.type === 'event' ? 'event' : 'created'),
    dateValue: itemData.dateValue || itemData.scheduledDate || formatDateYMD(new Date()),
    recurrence: itemData.recurrence || null,
    owner: 'User1',
    visibility: 'private',
    syncSource: 'briizos',
    lastModified: now,
    history: [],
  }), true);

  await setDoc(doc(organizerCol, itemId), firestoreData);
  return itemId;
}

/**
 * Update an organizer item (partial merge)
 */
export async function updateOrganizerItem(itemId, updates) {
  const user = await ensureAuth();
  if (!user) return false;

  const { organizerCol } = getUserCollections(user.uid);
  const firestoreUpdates = { ...updates, updatedAt: serverTimestamp(), lastModified: Date.now() };
  await setDoc(doc(organizerCol, itemId), firestoreUpdates, { merge: true });
  return true;
}

/**
 * Toggle an organizer item's done/todo status
 */
export async function toggleOrganizerItemDone(itemId, currentlyDone) {
  const now = Date.now();
  const updates = currentlyDone
    ? { completedAt: null, status: 'todo', lastModified: now }
    : { completedAt: now, status: 'done', lastModified: now };
  return updateOrganizerItem(itemId, updates);
}

/**
 * Delete an organizer item
 */
export async function deleteOrganizerItem(itemId) {
  const user = await ensureAuth();
  if (!user) return false;

  const { organizerCol } = getUserCollections(user.uid);
  await deleteDoc(doc(organizerCol, itemId));
  return true;
}

/**
 * Subscribe to legacy events collection (backward compatibility).
 * Returns events from users/{uid}/events/ for items created by v2.
 */
export function subscribeLegacyEvents(callback) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { eventsCol } = getUserCollections(uid);

  return onSnapshot(eventsCol, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const c = calendarAdapter.normalizeOnRead(docSnap.id, data);
      items.push({
        id: c.id,
        type: 'event',
        name: c.title,
        title: c.title,
        body: c.body,
        status: c.status,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        scheduledDate: normalizeDateStr(c.scheduledDate),
        start: c.start ?? (c.time ? timeToMinutes(c.time) : null),
        end: c.end ?? null,
        duration: c.durationMinutes,
        due: null,
        dateMode: 'event',
        dateValue: normalizeDateStr(c.scheduledDate),
        priority: data.priority || 'auto',
        tags: Array.isArray(data.tags) ? data.tags : [],
        source: data.source || { mode: 'manual' },
        recurrence: data.recurrence || null,
        domain: null,
        color: c.color,
        _fromLegacyEvents: true,
      });
    });
    callback(items);
  }, (error) => {
    logger.error('firestore', 'Legacy events subscription error', error?.message);
  });
}

// =====================
// REMOTE CHAT
// =====================

/**
 * Subscribe to remote chat messages in real-time.
 * Calls callback with all messages, sorted by timestamp.
 * Also calls onNewRemote(msg) for each new 'remote' message (for auto-response).
 */
export function subscribeRemoteChat(callback, onNewRemote) {
  const uid = getCurrentUid();
  if (!uid) return () => {};

  const { remoteChatCol } = getUserCollections(uid);
  const q = query(remoteChatCol, orderBy('timestamp', 'asc'));
  let initialLoad = true;

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        role: data.role,
        content: data.content,
        timestamp: toISO(data.timestamp),
        read: data.read || false,
      });
    });
    callback(messages);

    // After initial load, fire onNewRemote for added 'remote' messages
    if (initialLoad) {
      initialLoad = false;
      return;
    }
    if (onNewRemote) {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.role === 'remote') {
            onNewRemote({
              id: change.doc.id,
              role: data.role,
              content: data.content,
              timestamp: toISO(data.timestamp),
            });
          }
        }
      });
    }
  }, (error) => {
    logger.error('firestore', 'Remote chat subscription error', error?.message);
  });
}

/**
 * Add a message to the remote chat collection.
 * Used to write AI responses back so the remote user can see them.
 */
export async function addRemoteChatMessage(role, content) {
  const user = await ensureAuth();
  if (!user) return null;

  const { remoteChatCol } = getUserCollections(user.uid);
  const msgId = generateId();

  await setDoc(doc(remoteChatCol, msgId), {
    role,
    content,
    timestamp: serverTimestamp(),
    read: false,
  });
  return msgId;
}

/**
 * Mark a remote chat message as read.
 */
export async function markRemoteChatRead(messageId) {
  const user = await ensureAuth();
  if (!user) return;

  const { remoteChatCol } = getUserCollections(user.uid);
  await setDoc(doc(remoteChatCol, messageId), { read: true }, { merge: true });
}

// =====================
// REMOTE AGENT JOBS
// =====================

/**
 * Enqueue a remote tool job for desktop workers.
 * This is the online/web entrypoint: create one Firestore doc and workers will pick it up.
 */
export async function enqueueRemoteAgentToolJob(tool, params = {}, options = {}) {
  const user = await ensureAuth();
  if (!user) return null;

  const { agentJobsCol } = getUserCollections(user.uid);
  const now = Date.now();
  const jobId = options.jobId || generateAgentJobId();
  const opId = options.opId || `op_${jobId}`;

  const jobData = removeUndefined({
    id: jobId,
    type: 'tool',
    tool,
    params: sanitizeNested(params),
    opId,
    status: 'pending',
    workerId: null,
    leaseUntil: 0,
    retryCount: 0,
    maxRetries: options.maxRetries ?? 3,
    nextRunAt: options.nextRunAt ?? now,
    createdAt: now,
    updatedAt: now,
    source: sanitizeNested(options.source || { kind: 'remote-web' }),
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await setDoc(doc(agentJobsCol, jobId), jobData, { merge: false });
  return { jobId, opId };
}

/**
 * Subscribe to one remote agent job status.
 */
export function subscribeAgentJob(jobId, callback) {
  const uid = getCurrentUid();
  if (!uid) return () => {};
  const { agentJobsCol } = getUserCollections(uid);
  const jobDoc = doc(agentJobsCol, jobId);

  return onSnapshot(jobDoc, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    const data = docSnap.data() || {};
    callback({
      id: docSnap.id,
      ...data,
      createdAt: toISO(data.createdAtServer || data.createdAt),
      updatedAt: toISO(data.updatedAtServer || data.updatedAt),
      finishedAt: (data.finishedAtServer || data.finishedAt)
        ? toISO(data.finishedAtServer || data.finishedAt)
        : null,
    });
  }, (error) => {
    logger.error('firestore', 'Agent job subscription error', error?.message);
  });
}

/**
 * Subscribe to latest agent events (execution log).
 */
export function subscribeAgentEvents(callback, maxItems = 100) {
  const uid = getCurrentUid();
  if (!uid) return () => {};
  const { agentEventsCol } = getUserCollections(uid);
  const q = query(agentEventsCol, orderBy('createdAt', 'desc'), limit(maxItems));

  return onSnapshot(q, (snapshot) => {
    const events = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      events.push({
        id: docSnap.id,
        type: data.type || 'unknown',
        payload: data.payload || {},
        createdAt: toISO(data.createdAtServer || data.createdAt),
      });
    });
    callback(events.reverse());
  }, (error) => {
    logger.error('firestore', 'Agent events subscription error', error?.message);
  });
}

// =====================
// UTILITY FUNCTIONS
// =====================

function timeToMinutes(timeStr) {
  if (!timeStr) return 540; // default 9 AM
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getDomainColor(domain) {
  const colors = {
    coding: '#00e5e5',
    music: '#e040fb',
    poetry: '#ffc107',
    theatre: '#ff5722',
    'visual-art': '#4caf50',
    theory: '#2196f3',
    health: '#8bc34a',
    home: '#9e9e9e',
  };
  return colors[domain] || null;
}
