const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { logger, registerLoggerIPC } = require('./logger');
const filesystem = require('./filesystem');
const studio = require('./studio');
const github = require('./github');
const gdrive = require('./gdrive');
const agentConfig = require('./agent-config');
const agentFs = require('./agent-fs');
const agentTerminal = require('./agent-terminal');
const agentJobs = require('./agent-jobs-firestore');
const langgraphProcess = require('./langgraph-process');
const modelConfig = require('./model-config');
const toolBridge = require('./tool-bridge');

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

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

function normalizeCoord(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

const CSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' ws://localhost:* http://localhost:* http://127.0.0.1:2024 http://127.0.0.1:2025 https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.open-meteo.com https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://apis.google.com https://*.firebaseapp.com https://*.web.app",
  "frame-src 'self' blob: data: https://dex--briizos.us-central1.hosted.app http://localhost:* file: https://*.firebaseapp.com https://*.web.app https://apis.google.com",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:"
].join('; ') + ';';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0a1628',
    titleBarStyle: 'customButtonsOnHover',
    trafficLightPosition: { x: 4, y: 4 },
        title: 'briizOS',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
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

  // In development, skip CSP header injection to avoid blocking local auth/network debugging.
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP]
        }
      });
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
  return studio.launchTool(toolId);
});

ipcMain.handle('studio-get-tools-info', async () => {
  return studio.getToolsInfo();
});

// === GitHub IPC Handlers ===

ipcMain.handle('github-set-token', async (event, token) => {
  github.setToken(token);
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

ipcMain.handle('agent-get-config', async () => {
  return agentConfig.readConfig();
});

ipcMain.handle('agent-update-config', async (event, partial) => {
  return agentConfig.updateConfig(partial);
});

// === Agent Filesystem IPC Handlers ===

ipcMain.handle('agent-fs-read', async (event, filePath, maxSize) => {
  return agentFs.agentReadFile(filePath, maxSize);
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

ipcMain.handle('agent-jobs-execute', async (event, job) => {
  return agentJobs.executeAgentJob(job);
});

// === Memory IPC Handlers ===

ipcMain.handle('memory-append-log', async (event, chunkFilename, entry) => {
  const fs = require('fs');
  const logPath = path.join(agentConfig.DIRS.chatLogs, chunkFilename);
  fs.appendFileSync(logPath, entry + '\n', 'utf8');
  return { success: true };
});

ipcMain.handle('memory-get-context', async () => {
  const fs = require('fs');
  const config = agentConfig.readConfig();
  const chunksToInclude = config.memory?.chunksToInclude || 1;

  let agentContext = '';
  try {
    agentContext = fs.readFileSync(agentConfig.AGENT_CONTEXT_PATH, 'utf8');
  } catch (e) { logger.warn('memory', 'Failed to read context', e?.message); }

  let chatLogChunks = '';
  try {
    const logDir = agentConfig.DIRS.chatLogs;
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir)
        .filter(f => f.endsWith('.txt'))
        .sort()
        .reverse()
        .slice(0, chunksToInclude);

      const chunks = files.map(f => {
        try { return fs.readFileSync(path.join(logDir, f), 'utf8'); } catch { return ''; }
      }).filter(Boolean);

      if (chunks.length > 0) {
        chatLogChunks = chunks.join('\n---\n');
      }
    }
  } catch (e) { logger.warn('memory', 'Failed to read context', e?.message); }

  return { agentContext, chatLogChunks };
});

ipcMain.handle('memory-read-agent-context', async () => {
  const fs = require('fs');
  try {
    return fs.readFileSync(agentConfig.AGENT_CONTEXT_PATH, 'utf8');
  } catch { return ''; }
});

ipcMain.handle('memory-write-agent-context', async (event, content) => {
  const fs = require('fs');
  fs.writeFileSync(agentConfig.AGENT_CONTEXT_PATH, content, 'utf8');
  return { success: true };
});

ipcMain.handle('memory-list-chunks', async () => {
  const fs = require('fs');
  try {
    const logDir = agentConfig.DIRS.chatLogs;
    if (!fs.existsSync(logDir)) return [];
    return fs.readdirSync(logDir)
      .filter(f => f.endsWith('.txt'))
      .sort()
      .reverse()
      .map(f => ({
        filename: f,
        size: fs.statSync(path.join(logDir, f)).size,
      }));
  } catch { return []; }
});

ipcMain.handle('memory-read-chunk', async (event, filename) => {
  const fs = require('fs');
  try {
    return fs.readFileSync(path.join(agentConfig.DIRS.chatLogs, filename), 'utf8');
  } catch { return ''; }
});

// === Canvas IPC Handlers ===

ipcMain.handle('canvas-save', async (event, title, html) => {
  const fs = require('fs');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${Date.now()}-${slug}.html`;
  const filepath = path.join(agentConfig.DIRS.canvas, filename);
  fs.writeFileSync(filepath, html, 'utf8');
  return { success: true, filename, path: filepath };
});

ipcMain.handle('canvas-list', async () => {
  const fs = require('fs');
  try {
    const dir = agentConfig.DIRS.canvas;
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.html'))
      .sort()
      .reverse()
      .map(f => ({
        filename: f,
        title: f.replace(/^\d+-/, '').replace(/-/g, ' ').replace('.html', ''),
        size: fs.statSync(path.join(dir, f)).size,
      }));
  } catch { return []; }
});

ipcMain.handle('canvas-load', async (event, filename) => {
  const fs = require('fs');
  try {
    return fs.readFileSync(path.join(agentConfig.DIRS.canvas, filename), 'utf8');
  } catch { return ''; }
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
    langgraphStatus: langgraphProcess.getStatus(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

// === Memory IPC Handlers (Phase 8) ===

ipcMain.handle('memory-get-data', async () => {
  const { fetchMemory } = require('./langgraph-process');
  return await fetchMemory();
});

ipcMain.handle('memory-delete-fact', async (event, factId) => {
  const { deleteFact } = require('./langgraph-process');
  return await deleteFact(factId);
});

// === Skills IPC Handlers ===

ipcMain.handle('skills-get-list', async () => {
  const fs = require('fs');
  const configPath = path.resolve(__dirname, '../agent/extensions_config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    const skills = data.skills || {};
    return Object.entries(skills).map(([name, config]) => ({
      name,
      enabled: !!config.enabled,
    }));
  } catch (error) {
    logger.warn('skills', 'Failed to read extensions_config.json', error?.message);
    return [];
  }
});

ipcMain.handle('skills-toggle', async (event, skillName, enabled) => {
  const fs = require('fs');
  const configPath = path.resolve(__dirname, '../agent/extensions_config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    if (data.skills && data.skills[skillName]) {
      data.skills[skillName].enabled = enabled;
    }
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    logger.warn('skills', 'Failed to toggle skill', { skillName, error: error?.message });
    return { success: false, error: error?.message || 'Failed to toggle skill' };
  }
});

// === LangGraph Status API ===

ipcMain.handle('langgraph-get-status', async () => langgraphProcess.getStatus());

// === LangGraph Agent API ===

ipcMain.handle('langgraph-create-thread', async () => {
  return langgraphProcess.createThread();
});

ipcMain.handle('langgraph-stream-message', async (event, threadId, message, config) => {
  const streamId = config?.streamId || `lg-stream-${Date.now()}`;
  const sender = event.sender;

  // Resolve tool_confirmation_mode from agent config when not explicitly set by caller.
  // Maps terminal.mode ("ask-always" | "ask-destructive" | "no-asking") to the same
  // value expected by ToolConfirmationMiddleware on the Python side.
  const resolvedConfig = { ...(config || {}) };
  if (!resolvedConfig.tool_confirmation_mode) {
    try {
      const agentCfg = agentConfig.readConfig();
      resolvedConfig.tool_confirmation_mode = agentCfg?.terminal?.mode || 'ask-always';
    } catch {
      resolvedConfig.tool_confirmation_mode = 'ask-always';
    }
  }

  langgraphProcess.streamMessage(threadId, message, resolvedConfig, (type, payload) => {
    if (!sender.isDestroyed()) {
      sender.send('langgraph-stream-event', { streamId, type, payload: payload || {} });
    }
  }).catch(err => {
    if (!sender.isDestroyed()) {
      sender.send('langgraph-stream-event', { streamId, type: 'error', payload: { message: err?.message || 'Stream failed' } });
    }
  });

  return { streamId };
});

// === LangGraph Resume Run (Tool Confirmation) ===

ipcMain.handle('langgraph-resume-run', async (event, threadId, response, config) => {
  const streamId = config?.streamId || `lg-resume-${Date.now()}`;
  const sender = event.sender;

  langgraphProcess.resumeRun(threadId, response, config || {}, (type, payload) => {
    if (!sender.isDestroyed()) {
      sender.send('langgraph-stream-event', { streamId, type, payload: payload || {} });
    }
  }).catch(err => {
    if (!sender.isDestroyed()) {
      sender.send('langgraph-stream-event', { streamId, type: 'error', payload: { message: err?.message || 'Resume failed' } });
    }
  });

  return { streamId };
});

// === LangGraph Suggestions API ===

ipcMain.handle('langgraph-get-suggestions', async (event, recentMessages, n, config) => {
  return langgraphProcess.fetchSuggestions(recentMessages, n || 3, config || {});
});

// === Model Config IPC Handlers ===

ipcMain.handle('models-get-list', async () => modelConfig.getModels());
ipcMain.handle('models-get-config', async (_, name) => modelConfig.getModelConfig(name));
ipcMain.handle('models-check-api-keys', async () => modelConfig.checkApiKeyStatus());
ipcMain.handle('ai-is-configured', async () => modelConfig.isAIConfigured());

// === App Lifecycle ===

app.whenReady().then(() => {
  // Register logger IPC (must be first — other modules may log during init)
  registerLoggerIPC(ipcMain);
  logger.info('app', 'briizOS starting', {
    isDev,
    pid: process.pid,
    electron: process.versions.electron,
    node: process.versions.node,
    startedAt: new Date().toISOString(),
  });

  // Initialize agent App Support directories
  agentConfig.ensureDirectories();

  // Start LangGraph backend process
  langgraphProcess.start().then(started => {
    if (started) {
      logger.info('app', 'LangGraph process started', { port: langgraphProcess.getPort() });
    } else {
      logger.warn('app', 'LangGraph process failed to start', langgraphProcess.getStatus());
    }
  }).catch(err => {
    logger.error('app', 'LangGraph process start error', err?.message);
  });

  // Start USB drive watcher
  filesystem.startUSBWatcher((data) => {
    // Send USB change event to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('usb-drives-changed', data);
      }
    });
  });

  const win = createWindow();

  // Start tool bridge server and pass the main window for IPC relay
  toolBridge.setMainWindow(win);
  toolBridge.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      toolBridge.setMainWindow(newWin);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Stop LangGraph process and tool bridge before quit (fire-and-forget — Electron won't wait for async)
app.on('before-quit', () => {
  toolBridge.stop();
  langgraphProcess.stop();
});

// Clean up watchers on quit
app.on('will-quit', () => {
  filesystem.stopUSBWatcher();
});
