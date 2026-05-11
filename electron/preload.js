const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Platform info
  platform: process.platform,

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

  // Agent Filesystem API
  agentReadFile: (filePath, maxSize) => ipcRenderer.invoke('agent-fs-read', filePath, maxSize),
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
  logToTerminal: (payload) => ipcRenderer.send('log-to-terminal', payload),

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
  isAIConfigured: () => ipcRenderer.invoke('ai-is-configured'),

  // Direct AI API - Get API key for a provider (secure, main process only)
  getApiKey: (provider) => ipcRenderer.invoke('get-api-key', provider),

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

  // Health Check API
  healthCheck: () => ipcRenderer.invoke('health-check'),

  // Weather API
  weatherGetCurrent: (latitude, longitude) => ipcRenderer.invoke('weather-get-current', latitude, longitude),

  // Media API
  mediaOpenFiles: () => ipcRenderer.invoke('media-open-files'),
  mediaDescribeFiles: (filePaths) => ipcRenderer.invoke('media-describe-files', filePaths),
  mediaGetFilePath: (file) => webUtils.getPathForFile(file),
});
