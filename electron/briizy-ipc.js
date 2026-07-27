/**
 * briizy IPC surface (PLAN-BRIIZY.md §2 `window.briizy`).
 *
 * Same shape as local-data-ipc.js: one validated main-process command per
 * channel, an { ok, value } / { ok, error } envelope, and a push channel for
 * pipeline events. The renderer gets no SQL, no filesystem escape hatch, and no
 * archive path — frame identifiers are opaque and images arrive as data URLs.
 */

const CHANNELS = Object.freeze({
  status: 'briizy:status',
  defaults: 'briizy:defaults',
  configGet: 'briizy:config:get',
  configSet: 'briizy:config:set',
  onboard: 'briizy:onboard',
  pause: 'briizy:pause',
  resume: 'briizy:resume',
  displaySessionStart: 'briizy:display-session:start',
  displaySessionEnd: 'briizy:display-session:end',
  search: 'briizy:search',
  sessionsList: 'briizy:sessions:list',
  sessionTimeline: 'briizy:session:timeline',
  frameGet: 'briizy:frame:get',
  frameImage: 'briizy:frame:image',
  recentActivity: 'briizy:recent-activity',
  explain: 'briizy:explain-current-window',
  historyDelete: 'briizy:history:delete',
  proposalsList: 'briizy:proposals:list',
  proposalDecide: 'briizy:proposals:decide',
  proposalHistory: 'briizy:proposals:history',
  stagedTasksList: 'briizy:staged-tasks:list',
  learningLog: 'briizy:learning-log',
  forgetFact: 'briizy:forget-fact',
  goalsList: 'briizy:goals:list',
  goalCreate: 'briizy:goals:create',
  goalUpdate: 'briizy:goals:update',
  goalArchive: 'briizy:goals:archive',
  dailySummary: 'briizy:daily-summary',
  coordinatorStatus: 'briizy:coordinator-status',
  event: 'briizy:event',
});

/** Pipeline events forwarded to every window as { type, payload }. */
const FORWARDED_EVENTS = Object.freeze([
  'status',
  'config',
  'frame',
  'context-switch',
  'session-open',
  'session-close',
  'session-card',
  'paused',
  'resumed',
  'suggestion',
  'proposal',
  'proposal-decided',
  'daily-summary',
]);

function serializeError(error) {
  return {
    code: error?.code || 'BRIIZY_ERROR',
    message: error?.message || 'briizy operation failed',
  };
}

function registerBriizyIPC({ ipcMain, BrowserWindow, briizy, logger }) {
  const registrations = [
    [CHANNELS.status, () => briizy.getStatus()],
    [CHANNELS.defaults, () => briizy.getDefaults()],
    [CHANNELS.configGet, () => briizy.getConfig()],
    [CHANNELS.configSet, (patch) => briizy.setConfig(patch || {})],
    [CHANNELS.onboard, (input) => briizy.completeOnboarding(input || {})],
    [CHANNELS.pause, (reason) => briizy.pause(typeof reason === 'string' ? reason : 'user')],
    [CHANNELS.resume, (reason) => briizy.resume(typeof reason === 'string' ? reason : 'user')],
    [CHANNELS.displaySessionStart, () => briizy.startDisplaySession()],
    [CHANNELS.displaySessionEnd, () => briizy.endDisplaySession()],
    [CHANNELS.search, (query) => briizy.search(query || {})],
    [CHANNELS.sessionsList, (filters) => briizy.listSessions(filters || {})],
    [CHANNELS.sessionTimeline, (sessionId) => briizy.getSessionTimeline(sessionId)],
    [CHANNELS.frameGet, (frameId) => briizy.getFrame(frameId)],
    // Only the two safe options are threaded through; `includePath` has no
    // route from the renderer by construction.
    [CHANNELS.frameImage, (frameId, options) => briizy.getFrameImage(frameId, {
      maxWidth: Number(options?.maxWidth) || undefined,
      full: options?.full === true,
    })],
    [CHANNELS.recentActivity, (minutes) => briizy.getRecentActivity(Number(minutes) || 30)],
    [CHANNELS.explain, () => briizy.explainCurrentWindow()],
    [CHANNELS.historyDelete, (scope) => briizy.deleteHistory(scope || {})],
    [CHANNELS.proposalsList, (filters) => briizy.listProposals(filters || {})],
    [CHANNELS.proposalDecide, (decision) => briizy.decideProposal(decision || {})],
    [CHANNELS.proposalHistory, (proposalId) => briizy.getProposalHistory(proposalId)],
    [CHANNELS.stagedTasksList, (filters) => briizy.listStagedTasks(filters || {})],
    [CHANNELS.learningLog, (filters) => briizy.getLearningLog(filters || {})],
    [CHANNELS.forgetFact, (factId) => briizy.forgetFact(factId)],
    [CHANNELS.goalsList, (filters) => briizy.service.listBriizyGoals(filters || {})],
    [CHANNELS.goalCreate, (input) => briizy.service.createBriizyGoal(input || {})],
    [CHANNELS.goalUpdate, (goalId, patch) => briizy.service.updateBriizyGoal(goalId, patch || {})],
    [CHANNELS.goalArchive, (goalId) => briizy.service.archiveBriizyGoal(goalId)],
    // Preview or force today's summary from Settings, without waiting for 18:00.
    [CHANNELS.dailySummary, (options) => (
      options?.post === true
        ? briizy._maybePostDailySummary({ force: true })
        : briizy.buildDailySummary()
    )],
    [CHANNELS.coordinatorStatus, () => briizy.getCoordinatorStatus()],
  ];

  for (const [channel, operation] of registrations) {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return { ok: true, value: await operation(...args) };
      } catch (error) {
        logger?.warn?.('briizy', `IPC operation failed: ${channel}`, serializeError(error));
        return { ok: false, error: serializeError(error) };
      }
    });
  }

  const broadcast = (type) => (payload) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) window.webContents.send(CHANNELS.event, { type, payload });
    });
  };

  const listeners = FORWARDED_EVENTS.map((type) => {
    const handler = broadcast(type);
    briizy.on(type, handler);
    return { type, handler };
  });

  return () => {
    listeners.forEach(({ type, handler }) => briizy.off(type, handler));
    registrations.forEach(([channel]) => ipcMain.removeHandler(channel));
  };
}

module.exports = { CHANNELS, FORWARDED_EVENTS, registerBriizyIPC };
