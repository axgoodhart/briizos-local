const { LocalDataError } = require('./local-data-service');

const CHANNELS = Object.freeze({
  status: 'local-data:status',
  revisions: 'local-data:revisions',
  settingsList: 'local-data:settings:list',
  settingsGet: 'local-data:settings:get',
  settingsSet: 'local-data:settings:set',
  workspaceGetLayout: 'local-data:workspace:get-layout',
  workspaceSaveLayout: 'local-data:workspace:save-layout',
  selectedFilesList: 'local-data:selected-files:list',
  selectedFilesAdd: 'local-data:selected-files:add',
  selectedFilesRemove: 'local-data:selected-files:remove',
  selectedFilesClear: 'local-data:selected-files:clear',
  mediaGet: 'local-data:media:get',
  mediaSave: 'local-data:media:save',
  canvasesList: 'local-data:canvases:list',
  canvasesGet: 'local-data:canvases:get',
  canvasesCreate: 'local-data:canvases:create',
  canvasesUpdate: 'local-data:canvases:update',
  canvasesArchive: 'local-data:canvases:archive',
  briiztormGet: 'local-data:briiztorm:get',
  briiztormSet: 'local-data:briiztorm:set',
  islandProjectsUpdateScoring: 'local-data:island-projects:update-scoring',
  tasksList: 'local-data:tasks:list',
  tasksGet: 'local-data:tasks:get',
  tasksAppendLog: 'local-data:tasks:append-log',
  tasksCreate: 'local-data:tasks:create',
  tasksUpdate: 'local-data:tasks:update',
  tasksArchive: 'local-data:tasks:archive',
  placementsList: 'local-data:placements:list',
  placementsCreate: 'local-data:placements:create',
  placementsUpdate: 'local-data:placements:update',
  placementsArchive: 'local-data:placements:archive',
  placementsComplete: 'local-data:placements:complete',
  stepsList: 'local-data:task-steps:list',
  stepsCreate: 'local-data:task-steps:create',
  stepsCreateMany: 'local-data:task-steps:create-many',
  stepsUpdate: 'local-data:task-steps:update',
  stepsArchive: 'local-data:task-steps:archive',
  organizerList: 'local-data:organizer:list',
  organizerCreate: 'local-data:organizer:create',
  organizerUpdate: 'local-data:organizer:update',
  organizerArchive: 'local-data:organizer:archive',
  stickyNotesList: 'local-data:sticky-notes:list',
  stickyNotesCreate: 'local-data:sticky-notes:create',
  stickyNotesUpdate: 'local-data:sticky-notes:update',
  stickyNotesArchive: 'local-data:sticky-notes:archive',
  workspacePanelsList: 'local-data:workspace-panels:list',
  workspacePanelsSave: 'local-data:workspace-panels:save',
  workspacePanelsArchive: 'local-data:workspace-panels:archive',
  threadsList: 'local-data:threads:list',
  threadsCreate: 'local-data:threads:create',
  threadsUpdate: 'local-data:threads:update',
  threadsArchive: 'local-data:threads:archive',
  threadsTagsList: 'local-data:threads:tags:list',
  threadsTagsSet: 'local-data:threads:tags:set',
  messagesList: 'local-data:messages:list',
  messagesAppend: 'local-data:messages:append',
  memorySectionsList: 'local-data:memory:sections:list',
  memorySectionsUpdate: 'local-data:memory:sections:update',
  memoryFactsList: 'local-data:memory:facts:list',
  memoryFactsArchive: 'local-data:memory:facts:archive',
  memorySummariesList: 'local-data:memory:summaries:list',
  recorderList: 'local-data:recorder:list',
  recorderGet: 'local-data:recorder:get',
  recorderCreate: 'local-data:recorder:create',
  recorderEnd: 'local-data:recorder:end',
  recorderAddEvent: 'local-data:recorder:add-event',
  recorderRename: 'local-data:recorder:rename',
  recorderArchive: 'local-data:recorder:archive',
  commandsAccept: 'local-data:commands:accept',
  runsList: 'local-data:runs:list',
  runsGet: 'local-data:runs:get',
  runsTransition: 'local-data:runs:transition',
  sharedTextList: 'local-data:shared-text:list',
  sharedTextImport: 'local-data:shared-text:import',
  logsList: 'local-data:logs:list',
  aiAuditList: 'local-data:ai-audit:list',
  aiAuditGet: 'local-data:ai-audit:get',
  logsAppend: 'local-data:logs:append',
  continuityStatus: 'local-data:continuity:status',
  continuityRestore: 'local-data:continuity:restore',
  changed: 'data:changed',
});

function serializeError(error) {
  if (error instanceof LocalDataError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: error?.code || 'LOCAL_DATA_ERROR',
    message: error?.message || 'Local data could not be updated',
  };
}

function registerLocalDataIPC({ ipcMain, BrowserWindow, service, logger }) {
  const registrations = [
    [CHANNELS.status, () => service.getStatus()],
    [CHANNELS.revisions, () => service.getDomainRevisions()],
    [CHANNELS.settingsList, () => service.listSettings()],
    [CHANNELS.settingsGet, (key) => service.getSetting(key)],
    [CHANNELS.settingsSet, (key, value) => service.setSetting(key, value)],
    [CHANNELS.workspaceGetLayout, () => service.getWorkspaceLayout()],
    [CHANNELS.workspaceSaveLayout, (layout) => service.saveWorkspaceLayout(layout)],
    [CHANNELS.selectedFilesList, (purpose) => service.listSelectedFiles(purpose)],
    [CHANNELS.selectedFilesAdd, (input) => service.addSelectedFile(input)],
    [CHANNELS.selectedFilesRemove, (fileId, purpose) => service.removeSelectedFile(fileId, purpose)],
    [CHANNELS.selectedFilesClear, (purpose) => service.clearSelectedFiles(purpose)],
    [CHANNELS.mediaGet, () => service.getMediaState()],
    [CHANNELS.mediaSave, (input) => service.saveMediaState(input)],
    [CHANNELS.canvasesList, (filters) => service.listCanvases(filters)],
    [CHANNELS.canvasesGet, (canvasId) => service.getCanvas(canvasId)],
    [CHANNELS.canvasesCreate, (input) => service.createCanvas(input)],
    [CHANNELS.canvasesUpdate, (canvasId, expectedRevision, patch) => service.updateCanvas(canvasId, expectedRevision, patch)],
    [CHANNELS.canvasesArchive, (canvasId, expectedRevision) => service.archiveCanvas(canvasId, expectedRevision)],
    [CHANNELS.briiztormGet, () => service.getBriiztormState()],
    [CHANNELS.briiztormSet, (key, value) => service.setBriiztormState(key, value)],
    [CHANNELS.islandProjectsUpdateScoring, (projectId, expectedRevision, patch) => (
      service.updateIslandProjectScoring(projectId, expectedRevision, patch)
    )],
    [CHANNELS.tasksList, (filters) => service.listTasksDetailed(filters)],
    [CHANNELS.tasksGet, (taskId) => service.getTask(taskId)],
    [CHANNELS.tasksAppendLog, (taskId, entryType, message) => service.appendTaskLog(taskId, entryType, message)],
    [CHANNELS.tasksCreate, (input) => service.createTask(input)],
    [CHANNELS.tasksUpdate, (taskId, expectedRevision, patch) => service.updateTask(taskId, expectedRevision, patch)],
    [CHANNELS.tasksArchive, (taskId, expectedRevision) => service.archiveTask(taskId, expectedRevision)],
    [CHANNELS.placementsList, (filters) => service.listPlacements(filters)],
    [CHANNELS.placementsCreate, (input) => service.createPlacement(input)],
    [CHANNELS.placementsUpdate, (placementId, expectedRevision, patch) => (
      service.updatePlacement(placementId, expectedRevision, patch)
    )],
    [CHANNELS.placementsArchive, (placementId, expectedRevision) => (
      service.archivePlacement(placementId, expectedRevision)
    )],
    [CHANNELS.placementsComplete, (placementId, expectedRevision, occurrenceDate, completed) => (
      service.setPlacementOccurrenceCompleted(placementId, expectedRevision, occurrenceDate, completed)
    )],
    [CHANNELS.stepsList, (taskId, filters) => service.listTaskSteps(taskId, filters)],
    [CHANNELS.stepsCreate, (taskId, input) => service.createTaskStep(taskId, input)],
    [CHANNELS.stepsCreateMany, (taskId, inputs) => service.createTaskSteps(taskId, inputs)],
    [CHANNELS.stepsUpdate, (stepId, expectedRevision, patch) => service.updateTaskStep(stepId, expectedRevision, patch)],
    [CHANNELS.stepsArchive, (stepId, expectedRevision) => service.archiveTaskStep(stepId, expectedRevision)],
    [CHANNELS.organizerList, (filters) => service.listOrganizerItems(filters)],
    [CHANNELS.organizerCreate, (input) => service.createOrganizerItem(input)],
    [CHANNELS.organizerUpdate, (itemId, expectedRevision, patch) => service.updateOrganizerItem(itemId, expectedRevision, patch)],
    [CHANNELS.organizerArchive, (itemId, expectedRevision) => service.archiveOrganizerItem(itemId, expectedRevision)],
    [CHANNELS.stickyNotesList, () => service.listStickyNotes()],
    [CHANNELS.stickyNotesCreate, (input) => service.createStickyNote(input)],
    [CHANNELS.stickyNotesUpdate, (noteId, input) => service.updateStickyNote(noteId, input)],
    [CHANNELS.stickyNotesArchive, (noteId) => service.archiveStickyNote(noteId)],
    [CHANNELS.workspacePanelsList, (filters) => service.listWorkspacePanels(filters)],
    [CHANNELS.workspacePanelsSave, (input) => service.saveWorkspacePanel(input)],
    [CHANNELS.workspacePanelsArchive, (panelId, expectedRevision) => service.archiveWorkspacePanel(panelId, expectedRevision)],
    [CHANNELS.threadsList, (filters) => service.listThreads(filters)],
    [CHANNELS.threadsCreate, (input) => service.createThread(input)],
    [CHANNELS.threadsUpdate, (threadId, patch) => service.updateThread(threadId, patch)],
    [CHANNELS.threadsArchive, (threadId) => service.archiveThread(threadId)],
    [CHANNELS.threadsTagsList, (filters) => service.listThreadTags(filters)],
    // Source is fixed to 'user' here: everything arriving from the renderer is
    // a person editing chips, and only that path may dismiss a model tag.
    [CHANNELS.threadsTagsSet, (threadId, tags) => service.setThreadTags(threadId, tags, { source: 'user' })],
    [CHANNELS.messagesList, (threadId) => service.listMessages(threadId)],
    [CHANNELS.messagesAppend, (threadId, input) => service.appendMessage(threadId, input)],
    [CHANNELS.memorySectionsList, () => service.listMemorySections()],
    [CHANNELS.memorySectionsUpdate, (key, body) => service.updateMemorySection(key, body)],
    [CHANNELS.memoryFactsList, () => service.listMemoryFacts()],
    [CHANNELS.memoryFactsArchive, (factId) => service.archiveMemoryFact(factId)],
    [CHANNELS.memorySummariesList, (limit) => service.listConversationSummaries(limit)],
    [CHANNELS.recorderList, () => service.listRecorderSessions()],
    [CHANNELS.recorderGet, (sessionId) => service.getRecorderSession(sessionId)],
    [CHANNELS.recorderCreate, (name) => service.createRecorderSession(name)],
    [CHANNELS.recorderEnd, (sessionId) => service.endRecorderSession(sessionId)],
    [CHANNELS.recorderAddEvent, (sessionId, eventType, data) => service.addRecorderEvent(sessionId, eventType, data)],
    [CHANNELS.recorderRename, (sessionId, name) => service.renameRecorderSession(sessionId, name)],
    [CHANNELS.recorderArchive, (sessionId) => service.archiveRecorderSession(sessionId)],
    [CHANNELS.commandsAccept, (input) => service.acceptCommand(input)],
    [CHANNELS.runsList, (filters) => service.listRuns(filters)],
    [CHANNELS.runsGet, (runId) => service.getRun(runId)],
    [CHANNELS.runsTransition, (runId, status, input) => service.transitionRun(runId, status, input)],
    [CHANNELS.sharedTextList, (ownerAppId) => service.listSharedTextMirrors(ownerAppId)],
    [CHANNELS.sharedTextImport, (ownerAppId, remoteId) => service.importSharedTextMirror(ownerAppId, remoteId)],
    [CHANNELS.logsList, (filters) => service.listLogs(filters)],
    [CHANNELS.logsAppend, (input) => service.appendLog(input)],
    [CHANNELS.aiAuditList, (filters) => service.listAiTurnAuditEventSummaries(filters)],
    [CHANNELS.aiAuditGet, (eventId) => service.getAiTurnAuditEvent(eventId)],
  ];

  for (const [channel, operation] of registrations) {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return { ok: true, value: await operation(...args) };
      } catch (error) {
        logger?.warn?.('local-data', `IPC operation failed: ${channel}`, {
          code: error?.code || 'LOCAL_DATA_ERROR',
          message: error?.message,
        });
        return { ok: false, error: serializeError(error) };
      }
    });
  }

  const forwardChange = (change) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) window.webContents.send(CHANNELS.changed, change);
    });
  };
  service.on('changed', forwardChange);

  return () => {
    service.off('changed', forwardChange);
    registrations.forEach(([channel]) => ipcMain.removeHandler(channel));
  };
}

module.exports = { CHANNELS, registerLocalDataIPC };
