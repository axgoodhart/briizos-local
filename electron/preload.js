const { contextBridge, ipcRenderer, webUtils } = require('electron');

async function invokeLocalData(channel, ...args) {
  const response = await ipcRenderer.invoke(channel, ...args);
  if (response?.ok) return response.value;
  const error = new Error(response?.error?.message || 'Local data operation failed');
  error.code = response?.error?.code || 'LOCAL_DATA_ERROR';
  throw error;
}

contextBridge.exposeInMainWorld('api', {
  // Platform info
  platform: process.platform,

  // Generation-2 local data. Each method maps to one validated Main-process
  // command; the renderer never receives a SQL or filesystem escape hatch.
  localData: {
    getStatus: () => invokeLocalData('local-data:status'),
    getDomainRevisions: () => invokeLocalData('local-data:revisions'),
    settings: {
      list: () => invokeLocalData('local-data:settings:list'),
      get: (key) => invokeLocalData('local-data:settings:get', key),
      set: (key, value) => invokeLocalData('local-data:settings:set', key, value),
    },
    workspace: {
      getLayout: () => invokeLocalData('local-data:workspace:get-layout'),
      saveLayout: (layout) => invokeLocalData('local-data:workspace:save-layout', layout),
    },
    selectedFiles: {
      list: (purpose) => invokeLocalData('local-data:selected-files:list', purpose),
      add: (input) => invokeLocalData('local-data:selected-files:add', input),
      remove: (fileId, purpose) => invokeLocalData('local-data:selected-files:remove', fileId, purpose),
      clear: (purpose) => invokeLocalData('local-data:selected-files:clear', purpose),
    },
    media: {
      get: () => invokeLocalData('local-data:media:get'),
      save: (input) => invokeLocalData('local-data:media:save', input),
    },
    canvases: {
      list: (filters) => invokeLocalData('local-data:canvases:list', filters),
      get: (canvasId) => invokeLocalData('local-data:canvases:get', canvasId),
      create: (input) => invokeLocalData('local-data:canvases:create', input),
      update: (canvasId, expectedRevision, patch) =>
        invokeLocalData('local-data:canvases:update', canvasId, expectedRevision, patch),
      archive: (canvasId, expectedRevision) =>
        invokeLocalData('local-data:canvases:archive', canvasId, expectedRevision),
    },
    briiztorm: {
      get: () => invokeLocalData('local-data:briiztorm:get'),
      set: (key, value) => invokeLocalData('local-data:briiztorm:set', key, value),
    },
    tasks: {
      list: (filters) => invokeLocalData('local-data:tasks:list', filters),
      get: (taskId) => invokeLocalData('local-data:tasks:get', taskId),
      appendLog: (taskId, entryType, message) =>
        invokeLocalData('local-data:tasks:append-log', taskId, entryType, message),
      create: (input) => invokeLocalData('local-data:tasks:create', input),
      update: (taskId, expectedRevision, patch) =>
        invokeLocalData('local-data:tasks:update', taskId, expectedRevision, patch),
      archive: (taskId, expectedRevision) =>
        invokeLocalData('local-data:tasks:archive', taskId, expectedRevision),
      steps: {
        list: (taskId, filters) => invokeLocalData('local-data:task-steps:list', taskId, filters),
        create: (taskId, input) => invokeLocalData('local-data:task-steps:create', taskId, input),
        update: (stepId, expectedRevision, patch) =>
          invokeLocalData('local-data:task-steps:update', stepId, expectedRevision, patch),
        archive: (stepId, expectedRevision) =>
          invokeLocalData('local-data:task-steps:archive', stepId, expectedRevision),
      },
    },
    organizer: {
      list: (filters) => invokeLocalData('local-data:organizer:list', filters),
      create: (input) => invokeLocalData('local-data:organizer:create', input),
      update: (itemId, expectedRevision, patch) =>
        invokeLocalData('local-data:organizer:update', itemId, expectedRevision, patch),
      archive: (itemId, expectedRevision) =>
        invokeLocalData('local-data:organizer:archive', itemId, expectedRevision),
    },
    stickyNotes: {
      list: () => invokeLocalData('local-data:sticky-notes:list'),
      create: (input) => invokeLocalData('local-data:sticky-notes:create', input),
      update: (noteId, input) => invokeLocalData('local-data:sticky-notes:update', noteId, input),
      archive: (noteId) => invokeLocalData('local-data:sticky-notes:archive', noteId),
    },
    workspacePanels: {
      list: (filters) => invokeLocalData('local-data:workspace-panels:list', filters),
      save: (input) => invokeLocalData('local-data:workspace-panels:save', input),
      archive: (panelId, expectedRevision) =>
        invokeLocalData('local-data:workspace-panels:archive', panelId, expectedRevision),
    },
    threads: {
      list: (filters) => invokeLocalData('local-data:threads:list', filters),
      create: (input) => invokeLocalData('local-data:threads:create', input),
    },
    onChanged: (callback) => {
      const handler = (_event, change) => callback(change);
      ipcRenderer.on('data:changed', handler);
      return () => ipcRenderer.removeListener('data:changed', handler);
    },
  },

  // File System API
  listDirectory: (dirPath) => ipcRenderer.invoke('fs-list-directory', dirPath),
  getHomeDirs: () => ipcRenderer.invoke('fs-get-home-dirs'),
  getICloudDirs: () => ipcRenderer.invoke('fs-get-icloud-dirs'),
  getUSBDrives: () => ipcRenderer.invoke('fs-get-usb-drives'),
  onUSBDrivesChanged: (callback) => {
    ipcRenderer.on('usb-drives-changed', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('usb-drives-changed');
  },
  readFile: (filePath, maxSize) => ipcRenderer.invoke('fs-read-file', filePath, maxSize),
  getFileInfo: (filePath) => ipcRenderer.invoke('fs-get-file-info', filePath),

  // Studio API
  launchStudioTool: (toolId) => ipcRenderer.invoke('studio-launch-tool', toolId),
  getStudioToolsInfo: () => ipcRenderer.invoke('studio-get-tools-info'),

  // GitHub API
  githubSetToken: (token) => ipcRenderer.invoke('github-set-token', token),
  githubIsConfigured: () => ipcRenderer.invoke('github-is-configured'),
  githubValidateToken: (token) => ipcRenderer.invoke('github-validate-token', token),
  githubListRepos: (options) => ipcRenderer.invoke('github-list-repos', options),
  githubGetRepo: (owner, repo) => ipcRenderer.invoke('github-get-repo', owner, repo),
  githubGetContents: (owner, repo, path, ref) => ipcRenderer.invoke('github-get-contents', owner, repo, path, ref),
  githubGetFile: (owner, repo, path, maxSize) => ipcRenderer.invoke('github-get-file', owner, repo, path, maxSize),
  githubListBranches: (owner, repo) => ipcRenderer.invoke('github-list-branches', owner, repo),
  githubSearchRepos: (query) => ipcRenderer.invoke('github-search-repos', query),

  // Google Drive API
  gdriveGetStatus: () => ipcRenderer.invoke('gdrive-get-status'),
  gdriveIsConfigured: () => ipcRenderer.invoke('gdrive-is-configured'),
  gdriveConnect: () => ipcRenderer.invoke('gdrive-connect'),
  gdriveDisconnect: () => ipcRenderer.invoke('gdrive-disconnect'),
  gdriveListFiles: (folderId) => ipcRenderer.invoke('gdrive-list-files', folderId),
  gdriveOpenSetup: () => ipcRenderer.invoke('gdrive-open-setup'),

  // Agent Config API
  agentGetConfig: () => ipcRenderer.invoke('agent-get-config'),
  agentUpdateConfig: (partial) => ipcRenderer.invoke('agent-update-config', partial),
  agentGetSurfacePolicy: (surface) => ipcRenderer.invoke('agent-get-surface-policy', surface),

  // Agent Filesystem API
  agentReadFile: (filePath, maxSize) => ipcRenderer.invoke('agent-fs-read', filePath, maxSize),
  agentReadFileBase64: (filePath, maxSize) => ipcRenderer.invoke('agent-fs-read-base64', filePath, maxSize),
  agentWriteFile: (filePath, content, opId) => ipcRenderer.invoke('agent-fs-write', filePath, content, opId),
  agentDeleteFile: (filePath, opId) => ipcRenderer.invoke('agent-fs-delete', filePath, opId),
  agentMoveFile: (source, dest, opId) => ipcRenderer.invoke('agent-fs-move', source, dest, opId),
  agentCopyFile: (source, dest, opId) => ipcRenderer.invoke('agent-fs-copy', source, dest, opId),
  agentListDir: (dirPath) => ipcRenderer.invoke('agent-fs-list', dirPath),

  // Agent Terminal API
  agentRunCommand: (command, cwd, opId) => ipcRenderer.invoke('agent-terminal-run', command, cwd, opId),

  // Agent Jobs API
  agentExecuteJob: (job) => ipcRenderer.invoke('agent-jobs-execute', job),

  // Memory API
  memoryAppendLog: (chunkFilename, entry) => ipcRenderer.invoke('memory-append-log', chunkFilename, entry),
  memoryGetContext: () => ipcRenderer.invoke('memory-get-context'),
  memoryReadAgentContext: () => ipcRenderer.invoke('memory-read-agent-context'),
  memoryWriteAgentContext: (content) => ipcRenderer.invoke('memory-write-agent-context', content),
  memoryListChunks: () => ipcRenderer.invoke('memory-list-chunks'),
  memoryReadChunk: (filename) => ipcRenderer.invoke('memory-read-chunk', filename),
  memoryGetData: () => ipcRenderer.invoke('memory-get-data'),
  memoryDeleteFact: (factId) => ipcRenderer.invoke('memory-delete-fact', factId),

  // Skills API
  skillsList: () => ipcRenderer.invoke('skills-get-list'),
  skillsToggle: (name, enabled) => ipcRenderer.invoke('skills-toggle', name, enabled),

  // Logger API (fire-and-forget — logging must never block)
  terminalLogLevel: process.env.LOG_LEVEL || null,
  logToTerminal: (payload) => ipcRenderer.send('log-to-terminal', payload),
  getTerminalLogs: () => ipcRenderer.invoke('get-terminal-logs'),
  getTerminalLogLevel: () => ipcRenderer.invoke('get-terminal-log-level'),
  onTerminalLog: (callback) => {
    const handler = (_event, entry) => callback(entry);
    ipcRenderer.on('terminal-log-entry', handler);
    return () => ipcRenderer.removeListener('terminal-log-entry', handler);
  },

  // Canvas API
  canvasSave: (title, html) => ipcRenderer.invoke('canvas-save', title, html),
  canvasList: () => ipcRenderer.invoke('canvas-list'),
  canvasLoad: (filename) => ipcRenderer.invoke('canvas-load', filename),
  canvasDelete: (filename) => ipcRenderer.invoke('canvas-delete', filename),
  canvasSaveMeta: (filename, meta) => ipcRenderer.invoke('canvas-save-meta', filename, meta),
  canvasLoadMeta: (filename) => ipcRenderer.invoke('canvas-load-meta', filename),
  canvasRename: (oldFilename, newTitle) => ipcRenderer.invoke('canvas-rename', oldFilename, newTitle),

  // Model Config API
  getModels: () => ipcRenderer.invoke('models-get-list'),
  getModelConfig: (name) => ipcRenderer.invoke('models-get-config', name),
  checkApiKeys: () => ipcRenderer.invoke('models-check-api-keys'),
  setProviderApiKey: (provider, apiKey) => ipcRenderer.invoke('models-set-api-key', provider, apiKey),
  isAIConfigured: () => ipcRenderer.invoke('ai-is-configured'),

  // Tool execution bridge
  executeTool: (toolName, params) => ipcRenderer.invoke('execute-tool', toolName, params),

  // Tool Bridge API (relay tool execution requests from main process)
  onToolBridgeExecute: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('tool-bridge-execute', handler);
    return () => ipcRenderer.removeListener('tool-bridge-execute', handler);
  },
  toolBridgeResult: (requestId, result, error) =>
    ipcRenderer.send('tool-bridge-result', { requestId, result, error }),

  // LangGraph Agent Backend API — the single AI execution path.
  // The renderer never talks to model providers directly; all chat
  // flows through the Electron in-process LangGraph agent via these.
  langgraphGetStatus: () => ipcRenderer.invoke('langgraph-get-status'),
  langgraphCreateThread: () => ipcRenderer.invoke('langgraph-create-thread'),
  langgraphStreamMessage: (streamId, threadId, message, config) =>
    ipcRenderer.invoke('langgraph-stream-message', streamId, threadId, message, config),
  langgraphResumeRun: (streamId, threadId, response, config) =>
    ipcRenderer.invoke('langgraph-resume-run', streamId, threadId, response, config),
  langgraphSendMessage: (threadId, message, config) =>
    ipcRenderer.invoke('langgraph-send-message', threadId, message, config),
  langgraphFetchSuggestions: (recentMessages, n, config, threadId) =>
    ipcRenderer.invoke('langgraph-fetch-suggestions', recentMessages, n, config, threadId),
  // Push channel: every agent SSE event arrives here as
  // { streamId, type, payload }. Returns an unsubscribe function.
  onLanggraphStreamEvent: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('langgraph-stream-event', handler);
    return () => ipcRenderer.removeListener('langgraph-stream-event', handler);
  },

  // Health Check API
  healthCheck: () => ipcRenderer.invoke('health-check'),

  // Weather API
  weatherGetCurrent: (latitude, longitude) => ipcRenderer.invoke('weather-get-current', latitude, longitude),

  // Media API
  mediaOpenFiles: () => ipcRenderer.invoke('media-open-files'),
  mediaDescribeFiles: (filePaths) => ipcRenderer.invoke('media-describe-files', filePaths),
  mediaGetFilePath: (file) => webUtils.getPathForFile(file),

  // Forest API (journals, notefalls, infinite-forest project board) —
  // ported from Projungle. All local-only for now.
  journalsList: () => ipcRenderer.invoke('forest-journals-list'),
  journalsCreate: (input) => ipcRenderer.invoke('forest-journals-create', input),
  journalsDelete: (id) => ipcRenderer.invoke('forest-journals-delete', id),
  foliosList: (journalId) => ipcRenderer.invoke('forest-folios-list', journalId),
  foliosCreate: (journalId, folio, opts) => ipcRenderer.invoke('forest-folios-create', journalId, folio, opts),
  foliosDelete: (id) => ipcRenderer.invoke('forest-folios-delete', id),
  foliosUpdate: (id, patch) => ipcRenderer.invoke('forest-folios-update', id, patch),
  notefallsList: () => ipcRenderer.invoke('forest-notefalls-list'),
  notefallsCreate: (input) => ipcRenderer.invoke('forest-notefalls-create', input),
  notefallsUpdate: (id, patch) => ipcRenderer.invoke('forest-notefalls-update', id, patch),
  notefallsDelete: (id) => ipcRenderer.invoke('forest-notefalls-delete', id),
  notefallsAttachMedia: () => ipcRenderer.invoke('forest-notefalls-attach-media'),
  forestLoadState: () => ipcRenderer.invoke('forest-library-load'),
  forestSaveState: (state) => ipcRenderer.invoke('forest-library-save', state),
  forestImportPaths: (paths) => ipcRenderer.invoke('forest-library-import-paths', paths),
  forestOpenPath: (targetPath) => ipcRenderer.invoke('forest-shell-open-path', targetPath),
  forestShowItemInFolder: (targetPath) => ipcRenderer.invoke('forest-shell-show-item-in-folder', targetPath),
  forestHunterSearch: (keywords, excludePaths, customDirs) => ipcRenderer.invoke('forest-hunter-search', keywords, excludePaths, customDirs),
  forestHunterDefaultDirs: () => ipcRenderer.invoke('forest-hunter-default-dirs'),
  forestHunterQuery: (opts) => ipcRenderer.invoke('forest-hunter-query', opts),
  forestOpenDirectoryDialog: () => ipcRenderer.invoke('forest-dialog-open-directory'),
  forestFilehawkCheck: (filePaths) => ipcRenderer.invoke('forest-filehawk-check', filePaths),
  forestFilehawkLocate: (name, excludePaths, dirs) => ipcRenderer.invoke('forest-filehawk-locate', name, excludePaths, dirs),
  forestConsolidateProject: (name, filePaths) => ipcRenderer.invoke('forest-consolidate-project', name, filePaths),
});
