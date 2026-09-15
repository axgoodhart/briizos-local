import { useSyncExternalStore } from 'react';
import logger from './logger';

const KEY = 'briizos.interfacePreferences';
export const INTERFACE_DEFAULTS = Object.freeze({
  dockColors: 'colored',
  dockEdge: 'bottom',
  dockAutoHide: false,
  briizyMotion: true,
  briizyTuck: true,
  briizyIdleSeconds: 10,
  briizyNotes: '',
});

function normalize(raw = {}) {
  return {
    dockColors: raw.dockColors === 'monochrome' ? 'monochrome' : 'colored',
    dockEdge: ['top', 'bottom', 'left', 'right'].includes(raw.dockEdge) ? raw.dockEdge : 'bottom',
    dockAutoHide: raw.dockAutoHide === true,
    briizyMotion: raw.briizyMotion !== false,
    briizyTuck: raw.briizyTuck !== false,
    briizyIdleSeconds: Math.max(3, Math.min(60, Number(raw.briizyIdleSeconds) || 10)),
    briizyNotes: typeof raw.briizyNotes === 'string' ? raw.briizyNotes.slice(0, 4000) : '',
  };
}

function read() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
  catch { return { ...INTERFACE_DEFAULTS }; }
}
let current = read();
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => current;

export function setInterfacePreferences(patch) {
  current = normalize({ ...current, ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
    logger.info('ui.preferences', 'Interface preferences saved', { changed: Object.keys(patch) });
  } catch (error) {
    logger.error('ui.preferences', 'The preference changed for this session but could not be saved', { error: error.message });
  }
  listeners.forEach(listener => listener());
}

export function useInterfacePreferences() {
  return [useSyncExternalStore(subscribe, snapshot, () => INTERFACE_DEFAULTS), setInterfacePreferences];
}
