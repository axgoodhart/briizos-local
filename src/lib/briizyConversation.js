import { useSyncExternalStore } from 'react';
import logger from './logger';

let state = { id: null, status: 'idle', message: '', response: '' };
const listeners = new Set();
const snapshot = () => state;
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
function publish(patch) { state = { ...state, ...patch }; listeners.forEach(listener => listener()); }
export function useBriizyConversation() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
export function askBriizy(message, notes) {
  if (['queued', 'working', 'approval'].includes(state.status)) return;
  publish({ id: crypto.randomUUID(), status: 'queued', message, notes, response: '' });
  logger.info('briizy.input', 'Message received; waiting for the conversation to be ready');
}
export function claimBriizyRequest(id) {
  if (state.id !== id || state.status !== 'queued') return false;
  publish({ status: 'working' });
  return true;
}
export function reportBriizyResponse(id, update) {
  if (state.id !== id) return;
  publish(update);
  if (['done', 'error', 'approval'].includes(update.status)) {
    logger.info('briizy.response', `Briizy response: ${update.status}`, { requestId: id });
  }
}
