const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, powerMonitor, nativeImage } = require('electron');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { pathToFileURL, fileURLToPath } = require('url');
const { logger, registerLoggerIPC, setLogPersistence } = require('./logger');
const filesystem = require('./filesystem');
const studio = require('./studio');
const github = require('./github');
const gdrive = require('./gdrive');
const agentConfig = require('./agent-config');
const agentFs = require('./agent-fs');
const agentTerminal = require('./agent-terminal');
// In-process agent runtime — Electron main hosts the lead_agent graph
// directly (LangChain.js + LangGraph.js). No Python subprocess, no
// localhost HTTP tool-bridge; the renderer is reached via IPC.
const langgraph = require('./agent');
const codexProvider = require('./codex-provider');
const { LocalDataService } = require('./local-data-service');
const { registerLocalDataIPC } = require('./local-data-ipc');
const { CloudGateway } = require('./cloud-gateway');
const { AutomationRunner } = require('./automation-runner');
const operationReceipts = require('./agent-op-receipts');
// Forest filesystem discovery remains a bounded Main-process capability;
// all persistent Forest state is owned by LocalDataService.
const forestFs = require('./forest-fs');
// briizy work memory: supervised native capture helper + indexer + assistants.
// Screen data is local-only and stays outside the SyncContract entirely.
const { createBriizy } = require('./briizy');
const { registerBriizyIPC } = require('./briizy-ipc');
const { BriizyShell } = require('./briizy/shell');

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
let localDataService = null;
let unregisterLocalDataIPC = null;
let cloudGateway = null;
let automationRunner = null;
let briizy = null;
let briizyShell = null;
let unregisterBriizyIPC = null;
let mainWindow = null;
let shutdownStarted = false;

function ensureMacOSDockPresence(reason, { report = false } = {}) {
  if (process.platform !== 'darwin') return Promise.resolve();

  // Keep the workspace reachable even if a native window operation changed
  // the process type. The avatar prevents that transformation at its own call
  // site; this remains the recovery boundary whenever the workspace is opened.
  let activationPolicyApplied = null;
  if (typeof app.setActivationPolicy === 'function') {
    activationPolicyApplied = app.setActivationPolicy('regular');
  }

  const wasVisible = typeof app.dock?.isVisible === 'function'
    ? app.dock.isVisible()
    : null;
  if (wasVisible === false) {
    return Promise.resolve(app.dock.show())
      .then(() => {
        logger.warn('app', 'The briizOS Dock icon had disappeared and was restored.', {
          reason,
          activationPolicy: 'regular',
          activationPolicyApplied,
          dockIcon: 'restored',
          menuBarIcon: 'disabled',
        });
      })
      .catch((error) => {
        logger.error('app', 'The briizOS Dock icon could not be restored.', {
          reason,
          activationPolicy: 'regular',
          activationPolicyApplied,
          error: error?.message || String(error),
          nextStep: 'Quit and reopen briizOS; the workspace process is still running.',
        });
      });
  }

  if (report) {
    logger.info('app', 'briizOS is running as a regular macOS app with its Dock icon visible.', {
      reason,
      activationPolicy: 'regular',
      activationPolicyApplied,
      dockIcon: wasVisible === true ? 'visible' : 'visibility unavailable',
      menuBarIcon: 'disabled',
    });
  }
  return Promise.resolve();
}

function redactUrlApiKey(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.has('key')) {
      parsed.searchParams.set('key', '[redacted]');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function isFirebaseNetworkUrl(url) {
  return url.includes('identitytoolkit.googleapis.com')
    || url.includes('securetoken.googleapis.com')
    || url.includes('firebaseinstallations.googleapis.com')
    || url.includes('firestore.googleapis.com')
    || url.includes('firebaseapp.com')
    || url.includes('web.app');
}

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.m4v', '.mov', '.webm', '.ogv',
]);
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.oga', '.opus', '.aiff', '.aif',
]);

function inferMediaKind(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  return null;
}

function describeMediaPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const localPath = filePath.startsWith('file:') ? fileURLToPath(filePath) : filePath;
  const kind = inferMediaKind(localPath);
  if (!kind) return null;

  const stat = fs.statSync(localPath);
  if (!stat.isFile()) return null;

  return {
    id: localPath,
    path: localPath,
    sourceLocation: localPath,
    url: pathToFileURL(localPath).toString(),
    name: path.basename(localPath),
    size: stat.size,
    kind,
    type: `${kind}/${path.extname(localPath).slice(1).toLowerCase() || 'local'}`,
    lastModified: stat.mtimeMs,
    persistable: true,
  };
}

function normalizeCoord(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

const CSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:",
  "img-src 'self' data: blob: https: file:",
  "connect-src 'self' ws://localhost:* http://localhost:* https://api.open-meteo.com https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://apis.google.com https://*.firebaseapp.com https://*.web.app",
  "frame-src 'self' blob: data: https: https://dex--briizos.us-central1.hosted.app http://localhost:* file: https://*.firebaseapp.com https://*.web.app https://apis.google.com",
  "media-src 'self' blob: data: https: file:",
  "worker-src 'self' blob:"
].join('; ') + ';';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 700,
    minWidth: 200,
    minHeight: 200,
    backgroundColor: '#0a1628',
    titleBarStyle: 'customButtonsOnHover',
    trafficLightPosition: { x: 4, y: 4 },
        title: 'briizOS',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: !isDev, // Allow cross-origin in dev for iframes
      allowRunningInsecureContent: isDev
    }
  });

  if (isDev) {
    // Clear HTTP cache on each dev start to avoid stale response confusion.
    mainWindow.webContents.session.clearCache()
      .then(() => logger.info('app', 'Dev HTTP cache cleared'))
      .catch((error) => logger.warn('app', 'Failed to clear dev HTTP cache', error?.message));
  }
  const { Menu } = require('electron');


  mainWindow.webContents.on('context-menu', (_event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        }
      }
    ]);
    menu.popup();
  });
  
  // In development, skip CSP header injection to avoid blocking local auth/network debugging.
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      // Only apply our CSP to the main frame and same-origin sub-resources.
      // Third-party sub-frame navigations (e.g. canvas URL iframes) should
      // keep whatever CSP the remote site sends — our app-level policy blocks
      // their scripts, styles, and network calls.
      const isMainFrame = details.resourceType === 'mainFrame';
      const isSameOrigin = details.url.startsWith('file://') ||
        details.url.startsWith('http://localhost');
      const isSubFrame = details.resourceType === 'subFrame';

      if (isMainFrame || (isSameOrigin && !isSubFrame)) {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [CSP]
          }
        });
      } else {
        // Let sub-frames (canvas iframes, embedded sites) use their own CSP
        callback({ responseHeaders: details.responseHeaders });
      }
    });
  }

  const authRequestFilter = {
    urls: [
      'https://identitytoolkit.googleapis.com/*',
      'https://securetoken.googleapis.com/*',
      'https://firebaseinstallations.googleapis.com/*'
    ]
  };

  mainWindow.webContents.session.webRequest.onBeforeRequest(authRequestFilter, (details, callback) => {
    logger.info('network', 'Auth request start', {
      method: details.method,
      url: redactUrlApiKey(details.url),
    });
    callback({});
  });

  mainWindow.webContents.session.webRequest.onCompleted(authRequestFilter, (details) => {
    logger.info('network', 'Auth request end', {
      method: details.method,
      url: redactUrlApiKey(details.url),
      statusCode: details.statusCode,
      fromCache: !!details.fromCache,
    });
  });

  // Log failed Firebase/Auth network requests for concrete diagnosis in terminal output.
  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    if (isFirebaseNetworkUrl(details.url) || details.url.includes('googleapis.com')) {
      logger.warn('network', 'Request failed', {
        url: redactUrlApiKey(details.url),
        method: details.method,
        error: details.error,
      });
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

// === File System IPC Handlers ===

ipcMain.handle('fs-list-directory', async (event, dirPath) => {
  return filesystem.listDirectory(dirPath);
});

ipcMain.handle('fs-get-home-dirs', async () => {
  return filesystem.getHomeDirs();
});

ipcMain.handle('fs-get-icloud-dirs', async () => {
  return filesystem.getICloudDirs();
});

ipcMain.handle('fs-read-file', async (event, filePath, maxSize) => {
  return filesystem.readFile(filePath, maxSize);
});

ipcMain.handle('fs-get-file-info', async (event, filePath) => {
  return filesystem.getFileInfo(filePath);
});

ipcMain.handle('fs-get-usb-drives', async () => {
  return filesystem.getUSBDrives();
});

// === Studio IPC Handlers ===

ipcMain.handle('studio-launch-tool', async (event, toolId) => {
  const customUrl = localDataService?.getSetting(`studio_${toolId}_url`)?.value || '';
  return studio.launchTool(toolId, customUrl);
});

ipcMain.handle('studio-get-tools-info', async () => {
  return studio.getToolsInfo();
});

// === GitHub IPC Handlers ===

ipcMain.handle('github-set-token', async (event, token) => {
  github.setToken(token);
  localDataService?.setSecret('github_token', token);
  return true;
});

ipcMain.handle('github-is-configured', async () => {
  return github.isConfigured();
});

ipcMain.handle('github-validate-token', async (event, token) => {
  return github.validateToken(token);
});

ipcMain.handle('github-list-repos', async (event, options) => {
  return github.listRepositories(options);
});

ipcMain.handle('github-get-repo', async (event, owner, repo) => {
  return github.getRepository(owner, repo);
});

ipcMain.handle('github-get-contents', async (event, owner, repo, path, ref) => {
  return github.getRepoContents(owner, repo, path, ref);
});

ipcMain.handle('github-get-file', async (event, owner, repo, path, maxSize) => {
  return github.getFileContent(owner, repo, path, maxSize);
});

ipcMain.handle('github-list-branches', async (event, owner, repo) => {
  return github.listBranches(owner, repo);
});

ipcMain.handle('github-search-repos', async (event, query) => {
  return github.searchRepositories(query);
});

// === Google Drive IPC Handlers ===

ipcMain.handle('gdrive-get-status', async () => {
  return gdrive.getConnectionStatus();
});

ipcMain.handle('gdrive-is-configured', async () => {
  return gdrive.isConfigured();
});

ipcMain.handle('gdrive-connect', async () => {
  return gdrive.startOAuthFlow();
});

ipcMain.handle('gdrive-disconnect', async () => {
  return gdrive.disconnect();
});

ipcMain.handle('gdrive-list-files', async (event, folderId) => {
  return gdrive.listFiles(folderId);
});

ipcMain.handle('gdrive-open-setup', async () => {
  gdrive.openSetupGuide();
  return { success: true };
});

// === Agent Config IPC Handlers ===

const DEFAULT_AGENT_CONFIG = Object.freeze({
  permissions: {
    chat: { mode: 'ask-always', blacklist: { paths: [], filetypes: [] } },
    task: { mode: 'ask-always', blacklist: { paths: [], filetypes: [] } },
  },
  memory: { chunksToInclude: 1 },
});
const DEFAULT_SKILLS_CONFIG = Object.freeze({
  'deep-research': true, bootstrap: true, 'skill-creator': true,
  'frontend-design': true, 'web-design-guidelines': true,
  'consulting-analysis': true, 'data-analysis': true,
  'chart-visualization': false, 'image-generation': false,
  'video-generation': false, 'podcast-generation': false,
  'ppt-generation': false, 'github-deep-research': false,
  'find-skills': false, 'surprise-me': false,
  'claude-to-deerflow': false, 'vercel-deploy': false,
});

function bootstrapBundledModelCredentials() {
  if (localDataService.getAppMeta('bundled_model_credentials_bootstrapped') === '1') return;
  const configPath = path.join(__dirname, '..', 'agent', 'config.yaml');
  if (!fs.existsSync(configPath)) return;
  const config = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
  const credentials = {};
  for (const model of config.models || []) {
    const use = String(model.use || '').toLowerCase();
    if (use.includes('anthropic') && model.api_key) credentials.claude ||= model.api_key;
    if (use.includes('openai') && model.api_key) credentials.openai ||= model.api_key;
    if ((use.includes('google') || use.includes('gemini')) && model.google_api_key) credentials.gemini ||= model.google_api_key;
  }
  for (const [provider, credential] of Object.entries(credentials)) {
    if (!localDataService.getProviderKeyStatus()[provider]) {
      localDataService.setProviderApiKey(provider, String(credential));
    }
  }
  if (Object.keys(credentials).length) {
    localDataService.setAppMeta('bundled_model_credentials_bootstrapped', '1');
  }
}

function readLocalAgentConfig() {
  const canonical = localDataService?.getSetting('agent_config')?.value || DEFAULT_AGENT_CONFIG;
  const { chat, task } = canonical.permissions;
  return {
    ...canonical,
    terminal: { mode: agentConfig.moreRestrictive(chat.mode, task.mode) },
    filesystem: {
      blacklist: {
        paths: Array.from(new Set([...(chat.blacklist.paths || []), ...(task.blacklist.paths || [])])),
        filetypes: Array.from(new Set([...(chat.blacklist.filetypes || []), ...(task.blacklist.filetypes || [])])),
      },
    },
  };
}

ipcMain.handle('agent-get-config', async () => {
  return readLocalAgentConfig();
});

ipcMain.handle('agent-update-config', async (_event, partial) => {
  const current = readLocalAgentConfig();
  const canonical = agentConfig.migrate({
    permissions: {
      chat: { ...current.permissions.chat, ...(partial?.permissions?.chat || {}) },
      task: { ...current.permissions.task, ...(partial?.permissions?.task || {}) },
    },
    memory: { ...current.memory, ...(partial?.memory || {}) },
  });
  localDataService.setSetting('agent_config', canonical);
  return readLocalAgentConfig();
});

// Resolve the effective permission policy for a surface ('chat' | 'task').
// Used by the renderer hard gate and per-task clamping. Unknown surface
// returns the most restrictive policy (fail-closed).
ipcMain.handle('agent-get-surface-policy', async (_event, surface) => {
  const config = readLocalAgentConfig();
  const policy = config.permissions[surface];
  return policy
    ? { surface, mode: policy.mode, blacklist: policy.blacklist }
    : { surface: 'unknown', mode: 'ask-always', blacklist: { paths: [], filetypes: [] } };
});

// === Agent Filesystem IPC Handlers ===

ipcMain.handle('agent-fs-read', async (event, filePath, maxSize) => {
  return agentFs.agentReadFile(filePath, maxSize);
});

ipcMain.handle('agent-fs-read-base64', async (event, filePath, maxSize) => {
  return agentFs.agentReadFileBase64(filePath, maxSize);
});

ipcMain.handle('agent-fs-write', async (event, filePath, content, opId) => {
  return agentFs.agentWriteFile(filePath, content, opId);
});

ipcMain.handle('agent-fs-delete', async (event, filePath, opId) => {
  return agentFs.agentDeleteFile(filePath, opId);
});

ipcMain.handle('agent-fs-move', async (event, source, destination, opId) => {
  return agentFs.agentMoveFile(source, destination, opId);
});

ipcMain.handle('agent-fs-copy', async (event, source, destination, opId) => {
  return agentFs.agentCopyFile(source, destination, opId);
});

ipcMain.handle('agent-fs-list', async (event, dirPath) => {
  return agentFs.agentListDirectory(dirPath);
});

// === Agent Terminal IPC Handlers ===

ipcMain.handle('agent-terminal-run', async (event, command, cwd, opId) => {
  return agentTerminal.runCommand(command, cwd, opId);
});

// === Agent Job Executor IPC Handlers ===

ipcMain.handle('cloud:set-session', async (_event, session) => {
  let result = await cloudGateway.setSession(session);
  if (result?.requiresRebindConfirmation) {
    const choice = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Keep current local binding', 'Rebind continuity'],
      defaultId: 0,
      cancelId: 0,
      message: 'This local workspace is linked to a different cloud account.',
      detail: 'Rebinding changes which account receives recovery snapshots. Local data will not be erased.',
    });
    if (choice.response !== 1) return { connected: false, rebindDeclined: true };
    result = await cloudGateway.setSession({ ...session, confirmRebind: true });
  }
  return result;
});
ipcMain.handle('cloud:clear-session', async () => cloudGateway.clearSession());
ipcMain.handle('cloud:get-status', async () => cloudGateway.status);
ipcMain.handle('cloud:recovery-offer', async () => cloudGateway.getRecoveryOffer());
ipcMain.handle('cloud:restore-continuity', async (_event, domains) => cloudGateway.restoreContinuity(domains || []));
ipcMain.handle('cloud:promote-device', async () => {
  const choice = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancel', 'Make this Mac primary'],
    defaultId: 0,
    cancelId: 0,
    message: 'Make this Mac the primary briizOS device?',
    detail: 'It will process remote task requests and publish continuity snapshots.',
  });
  return choice.response === 1 ? cloudGateway.promoteThisDevice() : cloudGateway.status;
});
ipcMain.handle('automation:execute-run', async (_event, runId, permissionRequest) => {
  const run = localDataService.getRun(runId);
  if (!run) throw new Error('Run not found');
  return automationRunner.execute(run, permissionRequest || null);
});

// === Memory IPC Handlers ===

ipcMain.handle('memory-append-log', async () => ({ success: true }));

ipcMain.handle('memory-get-context', async () => {
  const config = readLocalAgentConfig();
  const chunksToInclude = config.memory?.chunksToInclude || 1;
  const profile = localDataService.getMemoryProfile();
  const summaries = localDataService.listConversationSummaries(Math.max(1, chunksToInclude));
  return { agentContext: profile.agentContext || '', chatLogChunks: summaries.map((item) => item.summary).join('\n---\n') };
});

ipcMain.handle('memory-read-agent-context', async () => {
  return localDataService.getMemoryProfile().agentContext || '';
});

ipcMain.handle('memory-write-agent-context', async (_event, content) => {
  localDataService.updateMemorySection('agentContext', content);
  return { success: true };
});

ipcMain.handle('memory-list-chunks', async () => {
  return localDataService.listConversationSummaries(100).map((item) => ({
    filename: item.id,
    size: Buffer.byteLength(item.summary, 'utf8'),
    threadId: item.thread_id,
    updatedAt: item.updated_at,
  }));
});

ipcMain.handle('memory-read-chunk', async (_event, summaryId) => {
  const idValue = String(summaryId || '');
  return localDataService.listConversationSummaries(1000).find((item) => item.id === idValue)?.summary || '';
});

// === Canvas IPC Handlers ===

function legacyCanvasMeta(row) {
  return {
    displayName: row.title,
    formFactor: row.formFactor,
    source: row.source,
    renderEngine: row.renderEngine,
    url: row.url,
    ...(row.panelSettings || {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    revision: row.revision,
  };
}

ipcMain.handle('canvas-save', async (_event, title, html) => {
  const result = localDataService.createCanvas({ title, html, source: 'ai' });
  return { success: true, filename: result.row.id };
});

ipcMain.handle('canvas-list', async () => {
  return localDataService.listCanvases();
});

ipcMain.handle('canvas-load', async (_event, canvasId) => {
  return localDataService.getCanvas(canvasId).html;
});

ipcMain.handle('canvas-delete', async (_event, canvasId) => {
  const current = localDataService.getCanvas(canvasId);
  localDataService.archiveCanvas(canvasId, current.revision);
  return { success: true };
});

ipcMain.handle('canvas-save-meta', async (_event, canvasId, meta = {}) => {
  const current = localDataService.getCanvas(canvasId);
  const known = new Set(['displayName', 'formFactor', 'source', 'renderEngine', 'url', 'createdAt', 'updatedAt', 'revision']);
  const panelSettings = Object.fromEntries(Object.entries(meta).filter(([key]) => !known.has(key)));
  const patch = {
    title: meta.displayName || current.title,
    formFactor: meta.formFactor || current.formFactor,
    source: meta.source || current.source,
    renderEngine: meta.renderEngine || current.renderEngine,
    url: meta.url ?? current.url,
    panelSettings,
  };
  const result = localDataService.updateCanvas(canvasId, current.revision, patch);
  return { success: true, meta: legacyCanvasMeta(result.row) };
});

ipcMain.handle('canvas-load-meta', async (_event, canvasId) => {
  return legacyCanvasMeta(localDataService.getCanvas(canvasId));
});

ipcMain.handle('canvas-rename', async (_event, canvasId, newTitle) => {
  const current = localDataService.getCanvas(canvasId);
  const result = localDataService.updateCanvas(canvasId, current.revision, { title: newTitle });
  return { success: true, filename: canvasId, meta: legacyCanvasMeta(result.row) };
});

// === Weather IPC Handler ===

ipcMain.handle('weather-get-current', async (event, latitude, longitude) => {
  const lat = normalizeCoord(latitude, -90, 90);
  const lon = normalizeCoord(longitude, -180, 180);
  if (lat === null || lon === null) {
    return { ok: false, error: 'Invalid coordinates' };
  }

  const url = `${OPEN_METEO_BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Open-Meteo error ${response.status}`);
    }

    const payload = await response.json();
    const temperature = payload?.current?.temperature_2m;
    const weatherCode = payload?.current?.weather_code;

    if (typeof temperature !== 'number' || typeof weatherCode !== 'number') {
      throw new Error('Open-Meteo payload missing temperature/weather_code');
    }

    return { ok: true, temperature, weatherCode };
  } catch (error) {
    const message = timedOut ? 'Weather request timed out' : (error?.message || 'Failed to fetch weather');
    logger.warn('network', 'Weather request failed', { url, error: message });
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
});

ipcMain.handle('media-open-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Media',
        extensions: [
          'mp4', 'm4v', 'mov', 'webm', 'ogv',
          'mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'oga', 'opus', 'aiff', 'aif',
        ],
      },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { ok: true, files: [] };
  }

  const files = result.filePaths
    .map((filePath) => {
      try {
        return describeMediaPath(filePath);
      } catch (error) {
        logger.warn('media', 'Unable to describe media file', { filePath, error: error?.message });
        return null;
      }
    })
    .filter(Boolean);

  return { ok: true, files };
});

ipcMain.handle('media-describe-files', async (_event, filePaths = []) => {
  const files = filePaths
    .map((filePath) => {
      try {
        return describeMediaPath(filePath);
      } catch (error) {
        logger.warn('media', 'Unable to describe dropped media file', { filePath, error: error?.message });
        return null;
      }
    })
    .filter(Boolean);

  return { ok: true, files };
});

// === Health Check IPC Handler ===

ipcMain.handle('health-check', async () => {
  const fs = require('fs');
  const dirs = agentConfig.DIRS;
  const dirStatus = {};
  for (const [name, dirPath] of Object.entries(dirs)) {
    dirStatus[name] = fs.existsSync(dirPath);
  }
  return {
    timestamp: new Date().toISOString(),
    directories: dirStatus,
    aiConfigured: Object.values(localDataService.getProviderKeyStatus()).some(Boolean)
      || !!process.env.OPENAI_API_KEY
      || !!process.env.ANTHROPIC_API_KEY
      || !!process.env.GEMINI_API_KEY
      || !!process.env.GOOGLE_API_KEY,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('memory-get-data', async () => {
  return { ...localDataService.getMemoryProfile(), enabled: true };
});

ipcMain.handle('memory-delete-fact', async (_event, factId) => {
  localDataService.archiveMemoryFact(factId);
  return { success: true };
});

// === Skills IPC Handlers ===

ipcMain.handle('skills-get-list', async () => {
  const skills = localDataService.getSetting('skills_config')?.value || DEFAULT_SKILLS_CONFIG;
  return Object.entries(skills).map(([name, enabled]) => ({ name, enabled }));
});

ipcMain.handle('skills-toggle', async (_event, skillName, enabled) => {
  const skills = localDataService.getSetting('skills_config')?.value || { ...DEFAULT_SKILLS_CONFIG };
  localDataService.setSetting('skills_config', { ...skills, [skillName]: !!enabled });
  return { success: true };
});

// === Tool Execution Fallback (DEPRECATED, inert) ===
//
// There is exactly ONE tool execution path:
//
//   electron/agent (in-process lead_agent)
//     → electron/agent/bridge.js (direct IPC, no HTTP)
//       → 'tool-bridge-execute' → src/hooks/useToolBridge.js
//         → ToolContext.executeTool → src/lib/tools.js handler
//
// This 'execute-tool' IPC handler is NOT part of that path. It is kept
// only as a last-resort guard so any caller that somehow bypasses the
// registry (very early boot, unit tests, renderer crash recovery)
// doesn't hit a MethodNotFound. Every hit is logged loudly so a
// regression back to a second execution path is immediately visible.
ipcMain.handle('execute-tool', async (event, toolName, params) => {
  logger.warn(
    'tools',
    `execute-tool IPC fallback hit for "${toolName}" — this path is deprecated and inert; ` +
      'agent tool calls must flow through electron/agent/bridge.js → useToolBridge → ToolContext.executeTool.',
    params,
  );

  return {
    success: false,
    tool: toolName,
    params,
    message:
      `Tool "${toolName}" reached the deprecated main.js IPC fallback and was not executed. ` +
      'The canonical path is electron/agent → bridge → useToolBridge → ToolContext.executeTool → tools.js.',
    timestamp: new Date().toISOString(),
  };
});

// === Model Config IPC Handlers ===

ipcMain.handle('models-get-list', async () => localDataService.listModelProfiles());
ipcMain.handle('models-get-config', async (_, name) => localDataService.getModelProfile(name));
ipcMain.handle('models-check-api-keys', async () => {
  const local = localDataService.getProviderKeyStatus();
  const codex = await codexProvider.getAuthStatus();
  return {
    ...local,
    openai: local.openai || !!process.env.OPENAI_API_KEY,
    claude: local.claude || !!process.env.ANTHROPIC_API_KEY,
    anthropic: local.claude || !!process.env.ANTHROPIC_API_KEY,
    gemini: local.gemini || !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
    google: local.gemini || !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
    codex: codex.connected,
  };
});
ipcMain.handle('models-set-api-key', async (_event, provider, apiKey) => {
  localDataService.setProviderApiKey(provider, apiKey);
  return { success: true };
});
ipcMain.handle('ai-is-configured', async () => {
  const status = localDataService.getProviderKeyStatus();
  const codex = await codexProvider.getAuthStatus();
  return Object.values(status).some(Boolean)
    || !!process.env.OPENAI_API_KEY
    || !!process.env.ANTHROPIC_API_KEY
    || !!process.env.GEMINI_API_KEY
    || !!process.env.GOOGLE_API_KEY
    || codex.connected;
});
ipcMain.handle('codex-auth-status', async () => codexProvider.getAuthStatus({ refresh: true }));
ipcMain.handle('codex-auth-login', async () => codexProvider.login((url) => shell.openExternal(url)));
ipcMain.handle('codex-auth-logout', async () => codexProvider.logout());
codexProvider.on('auth-changed', (status) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) window.webContents.send('codex-auth-changed', status);
  });
});

// === LangGraph Agent Backend IPC ===
//
// THE canonical AI execution path. The renderer (useChat) talks to the
// in-process Electron LangGraph agent exclusively through these handlers.
// There is no direct-to-provider streaming path anymore.
//
// Streaming model: the renderer generates a `streamId`, calls
// `langgraph-stream-message`, and subscribes to the `langgraph-stream-event`
// push channel. Every SSE event from the agent is forwarded as
// { streamId, type, payload }. The invoke promise resolves once the agent
// turn is fully finished (after the terminal 'end'/'error' event).

function makeStreamForwarder(event, streamId) {
  return (type, payload) => {
    try {
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('langgraph-stream-event', { streamId, type, payload });
      }
    } catch (err) {
      logger.warn('langgraph', 'Failed to forward stream event', err?.message);
    }
  };
}

ipcMain.handle('langgraph-get-status', async () => {
  return langgraph.getStatus();
});

ipcMain.handle('langgraph-create-thread', async (_event, kind) => {
  const threadId = await langgraph.createThread(kind || 'chat');
  return { thread_id: threadId };
});

ipcMain.handle('langgraph-stream-message', async (event, streamId, threadId, message, config) => {
  logger.debug('langgraph', 'The app window handed a saved chat message to the local AI workflow. Provider request and outcome evidence are recorded separately.', {
    streamId,
    threadId,
  });
  const result = await langgraph.streamMessage(threadId, message, config || {}, makeStreamForwarder(event, streamId));
  return { ok: true, streamId, turnId: result?.turnId || null, outcome: result?.outcome || null };
});

ipcMain.handle('langgraph-resume-run', async (event, streamId, threadId, response, config) => {
  logger.debug('langgraph', 'The app window handed a confirmation or clarification answer back to the paused AI workflow. This step does not claim the resumed provider request succeeded.', {
    streamId,
    threadId,
    approved: response?.approved,
  });
  await langgraph.resumeRun(threadId, response || {}, config || {}, makeStreamForwarder(event, streamId));
  return { ok: true, streamId };
});

// Non-streaming synchronous turn — used by headless task automation
// (single source: same in-process agent runtime, no parallel client).
ipcMain.handle('langgraph-send-message', async (_event, threadId, message, config) => {
  return langgraph.sendMessage(threadId, message, config || {});
});

ipcMain.handle('langgraph-fetch-suggestions', async (_event, recentMessages, n, config, threadId) => {
  return langgraph.fetchSuggestions(recentMessages || [], n || 3, config || {}, threadId || null);
});

// === Forest (journals, notefalls, infinite-forest project board) ===
// Legacy renderer channel names stay stable while briizos.db is the sole
// structured-data authority behind them.

ipcMain.handle('forest-journals-list', async () => localDataService.listJournals());
ipcMain.handle('forest-journals-create', async (_event, input) => {
  const result = localDataService.createJournal(input).row;
  logger.info('forest', 'Journal created', { id: result.id, title: result.title });
  return result;
});
ipcMain.handle('forest-journals-delete', async (_event, id) => {
  const result = localDataService.archiveJournal(id);
  logger.info('forest', 'Journal deleted', { id });
  return result;
});
ipcMain.handle('forest-journals-update', async (_event, id, patch) => {
  const result = localDataService.updateJournal(id, patch).row;
  logger.debug('forest', 'Journal updated', { id });
  return result;
});

ipcMain.handle('forest-folios-list', async (_event, journalId) => localDataService.listFolios(journalId));
ipcMain.handle('forest-folios-create', async (_event, journalId, folio, opts) => {
  const result = localDataService.createFolio(journalId, folio, opts).row;
  logger.info('forest', 'Folio created', { journalId, folioId: result.id, type: result.type });
  return result;
});
ipcMain.handle('forest-folios-delete', async (_event, id) => {
  const result = localDataService.archiveFolio(id);
  logger.info('forest', 'Folio deleted', { id });
  return result;
});
ipcMain.handle('forest-folios-update', async (_event, id, patch) => {
  const result = localDataService.updateFolio(id, patch).row;
  logger.debug('forest', 'Folio updated', { id });
  return result;
});
ipcMain.handle('forest-journals-attach-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'] }],
  });
  if (result.canceled) return [];
  return result.filePaths.map((filePath) => ({
    id: crypto.randomUUID(),
    path: filePath,
    url: pathToFileURL(filePath).toString(),
    kind: 'image',
    name: path.basename(filePath),
  }));
});

ipcMain.handle('forest-notefalls-list', async () => localDataService.listNotefallPosts());
ipcMain.handle('forest-notefalls-create', async (_event, input) => {
  const result = localDataService.createNotefallPost(input).row;
  logger.info('forest', 'Notefalls post created', { id: result.id });
  return result;
});
ipcMain.handle('forest-notefalls-update', async (_event, id, patch) => {
  const result = localDataService.updateNotefallPost(id, patch).row;
  logger.debug('forest', 'Notefalls post updated', { id });
  return result;
});
ipcMain.handle('forest-notefalls-delete', async (_event, id) => {
  const result = localDataService.archiveNotefallPost(id);
  logger.info('forest', 'Notefalls post deleted', { id });
  return result;
});
ipcMain.handle('forest-notefalls-attach-media', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'] }],
  });
  if (result.canceled) return [];
  return result.filePaths.map((filePath) => ({
    id: crypto.randomUUID(),
    path: filePath,
    kind: 'image',
    name: path.basename(filePath),
  }));
});

ipcMain.handle('forest-library-load', async () => localDataService.getForestState());
ipcMain.handle('forest-library-save', async (_event, state) => {
  const result = localDataService.saveForestState(state);
  logger.debug('forest', 'Board state saved', { projectCount: state?.projects?.length ?? 0 });
  return result;
});
ipcMain.handle('forest-library-import-paths', async (_event, inputPaths) => {
  const result = await forestFs.importDroppedPaths(inputPaths);
  if (result.rejected) {
    logger.warn('forest', 'Import rejected', { reason: result.rejected.reason, ...result.stats });
  } else {
    logger.info('forest', 'Files imported into board', {
      groups: result.groups.length,
      files: result.stats.files,
      ignored: result.stats.ignored,
      paths: inputPaths?.length ?? 0,
    });
  }
  return result;
});

ipcMain.handle('forest-shell-open-path', async (_event, targetPath) => {
  if (!targetPath) return '';
  return shell.openPath(targetPath);
});
ipcMain.handle('forest-shell-show-item-in-folder', async (_event, targetPath) => {
  if (targetPath) shell.showItemInFolder(targetPath);
  return { ok: true };
});

ipcMain.handle('forest-hunter-search', async (_event, keywords, excludePaths, customDirs) =>
  forestFs.hunterSearch(keywords, excludePaths, customDirs),
);
ipcMain.handle('forest-hunter-default-dirs', async () => forestFs.hunterDefaultDirs());
ipcMain.handle('forest-hunter-query', async (_event, opts) => forestFs.huntFiles(opts || {}));

ipcMain.handle('forest-dialog-open-directory', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Add Hunter search directory',
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('forest-filehawk-check', async (_event, filePaths) => forestFs.filehawkCheck(filePaths));
ipcMain.handle('forest-filehawk-locate', async (_event, name, excludePaths, dirs) =>
  forestFs.filehawkLocate(name, excludePaths, dirs),
);

ipcMain.handle('forest-consolidate-project', async (_event, projectName, filePaths) =>
  forestFs.consolidateProject(projectName, filePaths),
);

// === App Lifecycle ===

app.whenReady().then(() => {
  // Register logger IPC (must be first — other modules may log during init)
  registerLoggerIPC(ipcMain);
  logger.info('app', 'briizOS opened. This confirms only that the desktop process started; database, screen capture, task automation, location, and AI-provider results are reported separately.', {
    isDev,
    pid: process.pid,
    electron: process.versions.electron,
    node: process.versions.node,
    startedAt: new Date().toISOString(),
  });
  ensureMacOSDockPresence('app-startup', { report: true });

  // Generation-2 structured state is owned by this one Main-process service.
  // Existing feature stores remain untouched until their reviewed cutover phase.
  localDataService = new LocalDataService({
    databasePath: path.join(app.getPath('userData'), 'briizos.db'),
    safeStorage,
    logger,
  });
  localDataService.initialize();
  // Main-process logs exist before the database opens. Attach the sink now and
  // flush those startup entries so Prisma Studio and the in-app log retain the
  // same evidence that appeared in the terminal.
  setLogPersistence((entry) => localDataService?.appendLog(entry));
  localDataService.ensureDefaultModelProfiles();
  bootstrapBundledModelCredentials();
  if (!localDataService.getSetting('agent_config')) {
    localDataService.setSetting('agent_config', DEFAULT_AGENT_CONFIG);
  }
  if (!localDataService.getSetting('skills_config')) {
    localDataService.setSetting('skills_config', DEFAULT_SKILLS_CONFIG);
  }
  const storedGithubToken = localDataService.getSecret('github_token');
  if (storedGithubToken) github.setToken(storedGithubToken);
  unregisterLocalDataIPC = registerLocalDataIPC({
    ipcMain,
    BrowserWindow,
    service: localDataService,
    logger,
  });
  langgraph.setLocalDataService(localDataService);
  operationReceipts.setLocalDataService(localDataService);
  cloudGateway = new CloudGateway({
    service: localDataService,
    logger,
    appVersion: app.getVersion(),
    executeRemoteCommand: (run) => automationRunner.execute(run),
  });
  automationRunner = new AutomationRunner({
    service: localDataService,
    agent: langgraph,
    logger,
    onRunChanged: (run) => cloudGateway.publishRun(run),
    onThreadPolicyChanged: (payload) => {
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) window.webContents.send('automation-thread-policy', payload);
      });
    },
  });

  // briizy runtime. Nothing captures until the user completes onboarding (I10);
  // start() only loads config and reports state when capture is off.
  briizy = createBriizy({
    service: localDataService,
    logger,
    powerMonitor,
    nativeImage,
    userDataPath: app.getPath('userData'),
    // Never capture briizOS itself. In dev the frontmost app is Electron.
    ownBundleIds: [app.getName(), 'com.briizos.app', 'com.github.Electron', 'com.electron.briizos'],
    // Automation is reachable only by the TaskAgent, and only when immediate
    // execution has been explicitly enabled for it (I6, §12). Everything else in
    // briizy stages and stops.
    automation: {
      acceptCommand: (input) => localDataService.acceptCommand(input),
      executeRun: (runId) => {
        const run = localDataService.getRun(runId);
        if (!run) throw new Error('Run not found');
        return automationRunner.execute(run, null);
      },
    },
  });
  unregisterBriizyIPC = registerBriizyIPC({ ipcMain, BrowserWindow, briizy, logger });
  briizy.start();

  // Avatar overlay. Its on-screen presence is intentionally
  // independent of capture: someone can hide the character while their local
  // screen memory runs, or leave it visibly asleep while capture is off.
  briizyShell = new BriizyShell({
    briizy,
    logger,
    electron: require('electron'),
    isDev,
  });
  briizyShell.start({ getMainWindow: () => ensureMainWindow() });
  const syncBriizyAvatarPresentation = (config = briizy.getConfig()) => {
    briizyShell?.applyPresentation(config);
  };
  syncBriizyAvatarPresentation();
  briizy.on('config', syncBriizyAvatarPresentation);

  // Start USB drive watcher
  filesystem.startUSBWatcher((data) => {
    // Send USB change event to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('usb-drives-changed', data);
      }
    });
  });

  ensureMainWindow();

  langgraph.start().then((ok) => {
    const status = langgraph.getStatus();
    logger.info(
      'agent',
      'The local AI request engine initialized. No model provider has been contacted yet, so this does not prove that OpenAI, Claude, or Gemini will accept a request.',
      {
        initialized: ok === true,
        runtimeState: status?.status,
        inProcess: status?.inProcess,
        checkpointer: status?.checkpointer,
      },
    );
  }).catch((error) => {
    logger.error(
      'agent',
      'The local AI request engine did not initialize, so chat and automated AI turns cannot start.',
      { error: error?.message, effect: 'Messages can still be saved locally, but no model response can be requested.' },
    );
  });

  app.on('activate', () => {
    ensureMacOSDockPresence('app-activated');
    // Not `getAllWindows().length === 0` any more: the briizy overlay is also a
    // BrowserWindow, so that test would never be true once the shell is up.
    ensureMainWindow();
  });
});

/**
 * The workspace window, creating it if it is gone. Also rebinds the agent
 * bridge, which needs a live renderer to reach the tool registry.
 */
function ensureMainWindow() {
  void ensureMacOSDockPresence('workspace-window-ensured');
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (!mainWindow.isVisible()) mainWindow.show();
    return mainWindow;
  }
  mainWindow = createWindow();
  mainWindow.on('closed', () => { mainWindow = null; });
  // Wire the renderer window into the in-process agent bridge so the
  // lead_agent (running here in main) can reach the renderer tool
  // registry via IPC. No HTTP socket; no port 2025.
  langgraph.setMainWindow(mainWindow);
  return mainWindow;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Stop the in-process agent runtime before quit (clears caches; nothing
// to spawn-kill since the agent lives inside this process).
app.on('before-quit', (event) => {
  if (!shutdownStarted) {
    event.preventDefault();
    shutdownStarted = true;
    // Explicit Quit flushes and stops the helper (§9). The helper also exits on
    // its own when this process dies (stdin EOF + parent-pid watchdog), so a
    // crash or SIGKILL cannot leave it running either (I5).
    Promise.race([
      Promise.all([
        cloudGateway?.flushContinuity() || Promise.resolve(),
        briizy?.stop() || Promise.resolve(),
      ]),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).finally(() => app.quit());
    return;
  }
  langgraph.stop();
  briizyShell?.stop();
  briizyShell = null;
  unregisterBriizyIPC?.();
  unregisterBriizyIPC = null;
  briizy?.helper?.stop();
  briizy = null;
  cloudGateway?.close();
  cloudGateway = null;
  automationRunner?.close();
  automationRunner = null;
  unregisterLocalDataIPC?.();
  unregisterLocalDataIPC = null;
  localDataService?.close();
  localDataService = null;
});

// Clean up watchers on quit
app.on('will-quit', () => {
  filesystem.stopUSBWatcher();
});
