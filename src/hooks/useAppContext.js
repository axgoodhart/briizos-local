import { useState, useEffect, useMemo } from 'react';
import { subscribeNotes, subscribeTasks, subscribeProjects, subscribeAllSchedule } from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';

/**
 * Subscribes to notes, tasks, events, projects from Firestore.
 * Returns state snapshot for system prompt builder.
 */
export function useAppContext() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);

  // Re-check uid each render so effect re-runs when auth becomes ready
  const uid = getCurrentUid();

  useEffect(() => {
    if (!uid) return;

    const unsubs = [];

    unsubs.push(subscribeNotes((data) => setNotes(data)));

    unsubs.push(subscribeTasks((data) => {
      // Flatten tasks + subtasks into a single list for context
      const flat = [];
      for (const task of data) {
        flat.push(task);
        if (task.subtasks) {
          flat.push(...task.subtasks);
        }
      }
      setTasks(flat);
    }));

    unsubs.push(subscribeAllSchedule((data) => setEvents(data)));

    unsubs.push(subscribeProjects((data) => setProjects(data)));

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [uid]);

  return useMemo(() => ({ notes, tasks, events, projects }), [notes, tasks, events, projects]);
}

export default useAppContext;
