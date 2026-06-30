const { LocalDataError } = require('./local-data-service');

const CHANNELS = Object.freeze({
  status: 'local-data:status',
  revisions: 'local-data:revisions',
  tasksList: 'local-data:tasks:list',
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
  workspacePanelsList: 'local-data:workspace-panels:list',
  workspacePanelsSave: 'local-data:workspace-panels:save',
  workspacePanelsArchive: 'local-data:workspace-panels:archive',
  threadsList: 'local-data:threads:list',
  threadsCreate: 'local-data:threads:create',
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
    [CHANNELS.tasksList, (filters) => service.listTasks(filters)],
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
    [CHANNELS.workspacePanelsList, (filters) => service.listWorkspacePanels(filters)],
    [CHANNELS.workspacePanelsSave, (input) => service.saveWorkspacePanel(input)],
    [CHANNELS.workspacePanelsArchive, (panelId, expectedRevision) => service.archiveWorkspacePanel(panelId, expectedRevision)],
    [CHANNELS.threadsList, (filters) => service.listThreads(filters)],
    [CHANNELS.threadsCreate, (input) => service.createThread(input)],
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
