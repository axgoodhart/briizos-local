/**
 * OrganizerContext - Unified organizer data shared between Organizer and Calendar
 *
 * Single subscription to users/{uid}/organizer/ collection provides all item types
 * (notes, events, timers, projects, etc.) to any component that needs them.
 * Also merges legacy events from users/{uid}/events/ for backward compatibility.
 */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeOrganizerItems,
  subscribeLegacyEvents,
  addOrganizerItem,
  updateOrganizerItem,
  toggleOrganizerItemDone,
  deleteOrganizerItem,
} from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';
import { useAuth } from './AuthContext';

const OrganizerContext = createContext(null);

export function OrganizerProvider({ children }) {
  const { user } = useAuth();
  const [orgItems, setOrgItems] = useState([]);
  const [legacyEvents, setLegacyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to organizer collection
  useEffect(() => {
    if (!user) {
      setOrgItems([]);
      setLegacyEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let orgReady = false;
    let legReady = false;

    const checkReady = () => {
      if (orgReady && legReady) setLoading(false);
    };

    const unsubOrg = subscribeOrganizerItems((items) => {
      setOrgItems(items);
      orgReady = true;
      checkReady();
    });

    const unsubLeg = subscribeLegacyEvents((items) => {
      setLegacyEvents(items);
      legReady = true;
      checkReady();
    });

    return () => {
      unsubOrg();
      unsubLeg();
    };
  }, [user]);

  // Merge organizer items with legacy events (dedup by id, organizer wins)
  const items = useMemo(() => {
    const idSet = new Set(orgItems.map(i => i.id));
    const merged = [...orgItems];
    for (const leg of legacyEvents) {
      if (!idSet.has(leg.id)) {
        merged.push(leg);
      }
    }
    return merged;
  }, [orgItems, legacyEvents]);

  // Derived collections
  const projects = useMemo(() => items.filter(i => i.type === 'project'), [items]);
  const events = useMemo(() => items.filter(i => i.type === 'event'), [items]);
  const notes = useMemo(() => items.filter(i => i.type === 'note'), [items]);
  const timers = useMemo(() => items.filter(i => i.type === 'timer'), [items]);

  // CRUD wrappers
  const addItem = useCallback(async (data) => {
    return addOrganizerItem(data);
  }, []);

  const updateItem = useCallback(async (id, updates) => {
    return updateOrganizerItem(id, updates);
  }, []);

  const toggleDone = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    return toggleOrganizerItemDone(id, item.status === 'done');
  }, [items]);

  const removeItem = useCallback(async (id) => {
    return deleteOrganizerItem(id);
  }, []);

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
