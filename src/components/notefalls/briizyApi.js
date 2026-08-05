/* ── briizy work-memory API (IPC → Electron main via window.briizy) ────────
   Mirrors the shape of api.js: one thin wrapper with a graceful fallback so the
   Notefalls panel keeps working when briizy is absent — a browser preview, or a
   build where capture was never enabled. §4 assertion 4 requires exactly that:
   with capture disabled or unavailable, manual posts still work. */

import logger from '../../lib/logger';

const UNAVAILABLE_STATUS = Object.freeze({
  state: 'unavailable',
  enabled: false,
  paused: false,
  onboarded: false,
  helper: { state: 'unavailable', available: false },
  session: null,
  current: null,
  storage: null,
  totals: { frames: 0, duplicates: 0, ocr: 0, bytes: 0, errors: 0 },
  lastError: null,
});

const bridge = () => (typeof window !== 'undefined' ? window.briizy : null);

export const isBriizyAvailable = () => !!bridge();

/** Wrap a bridge call so a main-process error surfaces in the log, not as a crash. */
async function guard(label, run, fallback) {
  const api = bridge();
  if (!api) return fallback;
  try {
    return await run(api);
  } catch (error) {
    logger.warn('briizy', `${label} failed`, error?.message);
    return fallback;
  }
}

export const briizyApi = {
  getStatus: () => guard('status', (api) => api.getStatus(), UNAVAILABLE_STATUS),
  getConfig: () => guard('config:get', (api) => api.getConfig(), null),
  getDefaults: () => guard('defaults', (api) => api.getDefaults(), null),
  setConfig: (patch) => guard('config:set', (api) => api.setConfig(patch), null),
  completeOnboarding: (input) => guard('onboard', (api) => api.completeOnboarding(input), null),
  pause: (reason) => guard('pause', (api) => api.pause(reason), UNAVAILABLE_STATUS),
  resume: (reason) => guard('resume', (api) => api.resume(reason), UNAVAILABLE_STATUS),
  startDisplaySession: () => guard('display-session:start', (api) => api.startDisplaySession(), null),
  endDisplaySession: () => guard('display-session:end', (api) => api.endDisplaySession(), null),
  search: (query) => guard('search', (api) => api.search(query), []),
  listSessions: (filters) => guard('sessions:list', (api) => api.listSessions(filters), []),
  getSessionTimeline: (sessionId) => guard('session:timeline', (api) => api.getSessionTimeline(sessionId), null),
  getFrame: (frameId) => guard('frame:get', (api) => api.getFrame(frameId), null),
  getFrameImage: (frameId, options) => guard('frame:image', (api) => api.getFrameImage(frameId, options), null),
  explainCurrentWindow: () => guard('explain', (api) => api.explainCurrentWindow(), null),
  deleteHistory: (scope) => guard('history:delete', (api) => api.deleteHistory(scope), null),
  listProposals: (filters) => guard('proposals:list', (api) => api.listProposals(filters), []),
  decideProposal: (decision) => guard('proposals:decide', (api) => api.decideProposal(decision), null),
  getProposalHistory: (id) => guard('proposals:history', (api) => api.getProposalHistory(id), []),
  listStagedTasks: (filters) => guard('staged-tasks:list', (api) => api.listStagedTasks(filters), []),
  getLearningLog: (filters) => guard('learning-log', (api) => api.getLearningLog(filters),
    { facts: [], proposals: [], extractions: [] }),
  forgetFact: (factId) => guard('forget-fact', (api) => api.forgetFact(factId), null),
  getDailySummary: (options) => guard('daily-summary', (api) => api.getDailySummary(options), null),
  listGoals: (filters) => guard('goals:list', (api) => api.listGoals(filters), []),
  createGoal: (input) => guard('goals:create', (api) => api.createGoal(input), null),
  updateGoal: (goalId, patch) => guard('goals:update', (api) => api.updateGoal(goalId, patch), null),
  archiveGoal: (goalId) => guard('goals:archive', (api) => api.archiveGoal(goalId), null),
  getSessionFocus: (sessionId) => guard('session:focus', (api) => api.getSessionFocus(sessionId), null),
  onEvent: (callback) => {
    const api = bridge();
    if (!api?.onEvent) return () => {};
    return api.onEvent(callback);
  },
};

/** "4.2 GB", "812 MB" — storage figures shown in the capture drawer. */
export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(0)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(0)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

/** Human label for a CaptureState (§2). */
export function describeCaptureState(status) {
  const alternating = status?.captureStrategy === 'alternate' && status?.session?.kind !== 'display';
  switch (status?.state) {
    case 'capturingWindow': return alternating ? 'next screenshot: active window' : 'capturing active window';
    case 'capturingDisplay': return alternating ? 'next screenshot: full display' : 'capturing full display';
    case 'paused': return status?.enabled ? 'paused' : 'off';
    case 'permissionRequired': return 'needs Screen Recording permission';
    case 'unavailable': return 'unavailable on this machine';
    case 'error': return 'error';
    default: return 'unknown';
  }
}

export { UNAVAILABLE_STATUS };
