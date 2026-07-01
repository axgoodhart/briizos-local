import { useState, useEffect, useMemo } from 'react';
import logger from '../lib/logger';

/**
 * Re-queries notes, tasks, events, and projects from briizos.db.
 * Returns state snapshot for system prompt builder.
 */
export function useAppContext() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [taskRows, organizerRows, stickyRows] = await Promise.all([
          window.api.localData.tasks.list(),
          window.api.localData.organizer.list(),
          window.api.localData.stickyNotes.list(),
        ]);
        if (!active) return;
        const flat = [];
        for (const task of taskRows || []) {
          flat.push(task);
          if (task.subtasks) flat.push(...task.subtasks);
        }
        setTasks(flat);
        const rows = organizerRows || [];
        setNotes(stickyRows || []);
        setEvents(rows.filter((item) => item.type === 'event').map((item) => ({
          ...item,
          date: item.scheduled_start_at
            ? new Date(item.scheduled_start_at).toISOString().slice(0, 10)
            : null,
        })));
        setProjects(rows.filter((item) => item.type === 'project').map((item) => ({ ...item, name: item.title })));
      } catch (error) {
        logger.error('app-context', 'Failed to load local app context', error?.message);
      }
    };
    load();
    const unsubscribe = window.api?.localData?.onChanged?.((change) => {
      if (change?.domains?.some((domain) => domain === 'tasks' || domain === 'organizer')) load();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return useMemo(() => ({ notes, tasks, events, projects }), [notes, tasks, events, projects]);
}

export default useAppContext;
