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
  forestProjectsUpdateScoring: 'local-data:forest-projects:update-scoring',
  tasksList: 'local-data:tasks:list',
  tasksGet: 'local-data:tasks:get',
  tasksAppendLog: 'local-data:tasks:append-log',
  tasksCreate: 'local-data:tasks:create',
  tasksUpdate: 'local-data:tasks:update',
  tasksArchive: 'local-data:tasks:archive',
  stepsList: 'local-data:task-steps:list',
  stepsCreate: 'local-data:task-steps:create',
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
  messagesList: 'local-data:messages:list',
  messagesAppend: 'local-data:messages:append',
  stylofactProjectsList: 'local-data:stylofact:projects:list',
  stylofactProjectsGet: 'local-data:stylofact:projects:get',
  stylofactProjectsCreate: 'local-data:stylofact:projects:create',
  stylofactProjectsUpdate: 'local-data:stylofact:projects:update',
  stylofactProjectsArchive: 'local-data:stylofact:projects:archive',
  stylofactSourcesCreate: 'local-data:stylofact:sources:create',
  stylofactSourcesArchive: 'local-data:stylofact:sources:archive',
  stylofactArtifactsList: 'local-data:stylofact:artifacts:list',
  stylofactArtifactsReplace: 'local-data:stylofact:artifacts:replace',
  stylofactRunsList: 'local-data:stylofact:runs:list',
  stylofactRunsCreate: 'local-data:stylofact:runs:create',
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
  logsAppend: 'local-data:logs:append',
  continuityStatus: 'local-data:continuity:status',
  continuityRestore: 'local-data:continuity:restore',
  changed: 'data:changed',
});

function serializeError(error) {
  if (error instanceof LocalDataError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'LOCAL_DATA_ERROR', message: 'Local data could not be updated' };
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
    [CHANNELS.forestProjectsUpdateScoring, (projectId, expectedRevision, patch) => (
      service.updateForestProjectScoring(projectId, expectedRevision, patch)
    )],
    [CHANNELS.tasksList, (filters) => service.listTasksDetailed(filters)],
    [CHANNELS.tasksGet, (taskId) => service.getTask(taskId)],
    [CHANNELS.tasksAppendLog, (taskId, entryType, message) => service.appendTaskLog(taskId, entryType, message)],
    [CHANNELS.tasksCreate, (input) => service.createTask(input)],
    [CHANNELS.tasksUpdate, (taskId, expectedRevision, patch) => service.updateTask(taskId, expectedRevision, patch)],
    [CHANNELS.tasksArchive, (taskId, expectedRevision) => service.archiveTask(taskId, expectedRevision)],
    [CHANNELS.stepsList, (taskId, filters) => service.listTaskSteps(taskId, filters)],
    [CHANNELS.stepsCreate, (taskId, input) => service.createTaskStep(taskId, input)],
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
    [CHANNELS.messagesList, (threadId) => service.listMessages(threadId)],
    [CHANNELS.messagesAppend, (threadId, input) => service.appendMessage(threadId, input)],
    [CHANNELS.stylofactProjectsList, (filters) => service.listStylofactProjects(filters)],
    [CHANNELS.stylofactProjectsGet, (projectId) => service.getStylofactProject(projectId)],
    [CHANNELS.stylofactProjectsCreate, (input) => service.createStylofactProject(input)],
    [CHANNELS.stylofactProjectsUpdate, (projectId, expectedRevision, patch) => service.updateStylofactProject(projectId, expectedRevision, patch)],
    [CHANNELS.stylofactProjectsArchive, (projectId, expectedRevision) => service.archiveStylofactProject(projectId, expectedRevision)],
    [CHANNELS.stylofactSourcesCreate, (projectId, input) => service.createStylofactSource(projectId, input)],
    [CHANNELS.stylofactSourcesArchive, (sourceId, expectedRevision) => service.archiveStylofactSource(sourceId, expectedRevision)],
    [CHANNELS.stylofactArtifactsList, (projectId) => service.listStylofactArtifacts(projectId)],
    [CHANNELS.stylofactArtifactsReplace, (projectId, artifacts) => service.replaceStylofactArtifacts(projectId, artifacts)],
    [CHANNELS.stylofactRunsList, (projectId, limit) => service.listStylofactRuns(projectId, limit)],
    [CHANNELS.stylofactRunsCreate, (projectId, input) => service.createStylofactRun(projectId, input)],
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
    [CHANNELS.logsAppend, (input) => service.appendLog(input)],
  ];

  for (const [channel, operation] of registrations) {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return { ok: true, value: operation(...args) };
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
