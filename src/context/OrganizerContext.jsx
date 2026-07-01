/** SQLite-backed organizer data shared between Organizer and Calendar. */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import logger from '../lib/logger';

const OrganizerContext = createContext(null);

export function OrganizerProvider({ children }) {
  const [orgItems, setOrgItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const toDate = (timestamp) => {
    if (timestamp == null) return null;
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const minutes = (timestamp) => timestamp == null ? null : new Date(timestamp).getHours() * 60 + new Date(timestamp).getMinutes();
  const mapItem = useCallback((row) => ({
    id: row.id,
    type: row.type,
    name: row.title,
    title: row.title,
    content: row.body,
    body: row.body,
    status: row.status || 'pending',
    scheduledDate: toDate(row.scheduled_start_at),
    dateValue: toDate(row.scheduled_start_at),
    start: minutes(row.scheduled_start_at),
    end: minutes(row.scheduled_end_at),
    due: toDate(row.due_at),
    duration: row.duration_seconds == null ? null : Math.round(row.duration_seconds / 60),
    recurrence: row.recurrence,
    tags: row.tags || [],
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: row.revision,
  }), []);

  const loadItems = useCallback(async () => {
    try {
      const rows = await window.api.localData.organizer.list();
      setOrgItems((rows || []).map(mapItem));
    } catch (error) {
      logger.error('organizer', 'Failed to load local organizer data', error?.message);
    } finally {
      setLoading(false);
    }
  }, [mapItem]);

  useEffect(() => {
    loadItems();
    // The local-data bridge is only present in the Electron renderer (via
    // preload). Guard the subscription so a missing bridge degrades to an
    // empty organizer instead of crashing the whole app at mount.
    const unsubscribe = window.api?.localData?.onChanged?.((change) => {
      if (change?.domains?.includes('organizer')) loadItems();
    });
    return unsubscribe;
  }, [loadItems]);

  const items = orgItems;

  // Derived collections
  const projects = useMemo(() => items.filter(i => i.type === 'project'), [items]);
  const events = useMemo(() => items.filter(i => i.type === 'event'), [items]);
  const notes = useMemo(() => items.filter(i => i.type === 'note'), [items]);
  const timers = useMemo(() => items.filter(i => i.type === 'timer'), [items]);

  // CRUD wrappers
  const addItem = useCallback(async (data) => {
    const startAt = data.scheduledDate
      ? new Date(`${data.scheduledDate}T00:00:00`).getTime() + (data.start || 0) * 60000
      : null;
    const result = await window.api.localData.organizer.create({
      type: data.type,
      title: data.name || data.title || '',
      body: data.content || data.body || '',
      status: data.status || 'pending',
      scheduledStartAt: startAt,
      scheduledEndAt: startAt != null && data.end != null ? startAt + (data.end - (data.start || 0)) * 60000 : null,
      dueAt: data.due ? new Date(`${data.due}T00:00:00`).getTime() : null,
      durationSeconds: data.duration == null ? null : data.duration * 60,
      recurrence: data.recurrence || null,
      tags: data.tags || [],
      parentId: data.parentId || null,
    });
    return result.row.id;
  }, []);

  const updateItem = useCallback(async (id, updates) => {
    const current = items.find((item) => item.id === id);
    if (!current) return null;
    const patch = {};
    if (updates.name !== undefined || updates.title !== undefined) patch.title = updates.name ?? updates.title;
    if (updates.content !== undefined || updates.body !== undefined) patch.body = updates.content ?? updates.body;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.recurrence !== undefined) patch.recurrence = updates.recurrence;
    return window.api.localData.organizer.update(id, current.revision, patch);
  }, [items]);

  const toggleDone = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    return updateItem(id, { status: item.status === 'done' ? 'pending' : 'done' });
  }, [items, updateItem]);

  const removeItem = useCallback(async (id) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return null;
    if (item.type === 'note') return window.api.localData.stickyNotes.archive(id);
    return window.api.localData.organizer.archive(id, item.revision);
  }, [items]);

  const value = useMemo(() => ({
    items, projects, events, notes, timers,
    loading, addItem, updateItem, toggleDone, removeItem,
  }), [items, projects, events, notes, timers, loading,
       addItem, updateItem, toggleDone, removeItem]);

  return (
    <OrganizerContext.Provider value={value}>
      {children}
    </OrganizerContext.Provider>
  );
}

export function useOrganizer() {
  const ctx = useContext(OrganizerContext);
  if (!ctx) throw new Error('useOrganizer must be used within OrganizerProvider');
  return ctx;
}
