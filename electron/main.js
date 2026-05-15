const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL, fileURLToPath } = require('url');
const { logger, registerLoggerIPC } = require('./logger');
const filesystem = require('./filesystem');
const studio = require('./studio');
const github = require('./github');
const gdrive = require('./gdrive');
const agentConfig = require('./agent-config');
const agentFs = require('./agent-fs');
const agentTerminal = require('./agent-terminal');
const agentJobs = require('./agent-jobs-firestore');
const modelConfig = require('./model-config');
const toolBridge = require('./tool-bridge');
const langgraph = require('./langgraph-process');
const localDb = require('./local-db');
const yaml = require('js-yaml');

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
  "img-src 'self' data: blob: https:",
  "connect-src 'self' ws://localhost:* http://localhost:* http://127.0.0.1:2024 http://127.0.0.1:2025 https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.open-meteo.com https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://apis.google.com https://*.firebaseapp.com https://*.web.app",
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
      .map(f => {
        const htmlPath = path.join(dir, f);
        let meta = {};
        try {
          const metaPath = path.join(dir, `${f}.meta.json`);
          if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || {};
          }
        } catch { meta = {}; }
        const derivedTitle = f.replace(/^\d+-/, '').replace(/-/g, ' ').replace('.html', '');
        return {
          filename: f,
          title: meta.displayName || derivedTitle,
          size: fs.statSync(htmlPath).size,
          formFactor: meta.formFactor || 'float',
          source: meta.source || 'ai',
          renderEngine: meta.renderEngine || 'iframe',
          url: meta.url || '',
          createdAt: meta.createdAt || null,
          updatedAt: meta.updatedAt || null,
        };
      });
  } catch { return []; }
});

ipcMain.handle('canvas-load', async (event, filename) => {
  const fs = require('fs');
  try {
    return fs.readFileSync(path.join(agentConfig.DIRS.canvas, filename), 'utf8');
  } catch { return ''; }
});

ipcMain.handle('canvas-delete', async (event, filename) => {
  const fs = require('fs');
  try {
    const dir = agentConfig.DIRS.canvas;
    const htmlPath = path.join(dir, filename);
    const metaPath = path.join(dir, `${filename}.meta.json`);
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('canvas-save-meta', async (event, filename, meta) => {
  const fs = require('fs');
  try {
    const metaPath = path.join(agentConfig.DIRS.canvas, `${filename}.meta.json`);
    const payload = { ...(meta || {}), updatedAt: Date.now() };
    if (!payload.createdAt) payload.createdAt = payload.updatedAt;
    fs.writeFileSync(metaPath, JSON.stringify(payload, null, 2), 'utf8');
    return { success: true, meta: payload };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('canvas-load-meta', async (event, filename) => {
  const fs = require('fs');
  try {
    const metaPath = path.join(agentConfig.DIRS.canvas, `${filename}.meta.json`);
    if (!fs.existsSync(metaPath)) return {};
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')) || {};
  } catch { return {}; }
});

ipcMain.handle('canvas-rename', async (event, oldFilename, newTitle) => {
  const fs = require('fs');
  try {
    const dir = agentConfig.DIRS.canvas;
    const oldHtml = path.join(dir, oldFilename);
    if (!fs.existsSync(oldHtml)) {
      return { success: false, error: 'Source canvas not found' };
    }
    const slug = String(newTitle || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
    const stampMatch = oldFilename.match(/^(\d+)-/);
    const stamp = stampMatch ? stampMatch[1] : String(Date.now());
    const newFilename = `${stamp}-${slug}.html`;
    const newHtml = path.join(dir, newFilename);
    if (newFilename !== oldFilename) {
      fs.renameSync(oldHtml, newHtml);
    }
    // Move sidecar
    const oldMeta = path.join(dir, `${oldFilename}.meta.json`);
    const newMeta = path.join(dir, `${newFilename}.meta.json`);
    let metaObj = {};
    if (fs.existsSync(oldMeta)) {
      try { metaObj = JSON.parse(fs.readFileSync(oldMeta, 'utf8')) || {}; } catch { metaObj = {}; }
      if (newFilename !== oldFilename) fs.unlinkSync(oldMeta);
    }
    metaObj.displayName = newTitle;
    metaObj.updatedAt = Date.now();
    if (!metaObj.createdAt) metaObj.createdAt = metaObj.updatedAt;
    fs.writeFileSync(newMeta, JSON.stringify(metaObj, null, 2), 'utf8');
    return { success: true, filename: newFilename, meta: metaObj };
  } catch (err) {
    return { success: false, error: String(err) };
  }
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
    aiConfigured: modelConfig.isAIConfigured(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

// === Memory IPC Handlers (Phase 8) - DISABLED ===
// Memory functionality disconnected as per requirements
// These handlers previously depended on langgraphProcess

ipcMain.handle('memory-get-data', async () => {
  logger.warn('memory', 'Memory functionality is currently disabled');
  return { facts: [], enabled: false };
});

ipcMain.handle('memory-delete-fact', async (event, factId) => {
  logger.warn('memory', 'Memory delete functionality is currently disabled');
  return { success: false, error: 'Memory functionality is currently disabled' };
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

// === Direct AI API - Get API Key for Provider ===

ipcMain.handle('get-api-key', async (event, provider) => {
  // Prefer environment variables if set
  const envKey = {
    gemini: process.env.GEMINI_API_KEY,
    google: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    chatgpt: process.env.OPENAI_API_KEY,
  }[provider];

  if (envKey) return envKey;

  // Fallback: read from agent/config.yaml (not the Electron appSupport config.json)
  try {
    const fs = require('fs');
    const configPath = path.resolve(__dirname, '../agent/config.yaml');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(raw);
      const models = Array.isArray(parsed?.models) ? parsed.models : [];

      // Find first model matching requested provider that contains a key
      const match = models.find((m) => {
        const p = deriveProviderFromModel(m);
        if (p !== provider) return false;
        if (provider === 'gemini' || provider === 'google') {
          return !!m?.google_api_key;
        }
        return !!m?.api_key;
      });

      if (match) {
        if (provider === 'gemini' || provider === 'google') {
          return match.google_api_key || null;
        }
        return match.api_key || null;
      }
    }
  } catch (err) {
    logger.warn('api', 'Failed to read API key from agent/config.yaml', err?.message);
  }

  return null;
});

// Helper to derive provider from model config
function deriveProviderFromModel(model) {
  if (!model?.use) return 'unknown';

  const useField = model.use;
  if (useField.includes('anthropic')) return 'claude';
  if (useField.includes('openai')) return 'openai';
  if (useField.includes('google')) return 'gemini';
  return 'unknown';
}

// === Tool Execution Bridge (DEPRECATED fallback) ===
//
// There is exactly ONE tool execution path:
//
//   Python agent → HTTP :2025 (tool-bridge) → IPC →
//     src/hooks/useToolBridge.js → ToolContext.executeTool →
//       src/lib/tools.js registry handler (real Firestore + layoutHook)
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
      'tool calls must reach src/lib/tools.js via the tool-bridge → useToolBridge → ToolContext.executeTool.',
    params,
  );

  return {
    success: false,
    tool: toolName,
    params,
    message:
      `Tool "${toolName}" reached the deprecated main.js IPC fallback and was not executed. ` +
      'The canonical path is tool-bridge (:2025) → useToolBridge → ToolContext.executeTool → tools.js.',
    timestamp: new Date().toISOString(),
  };
});

// === Model Config IPC Handlers ===

ipcMain.handle('models-get-list', async () => modelConfig.getModels());
ipcMain.handle('models-get-config', async (_, name) => modelConfig.getModelConfig(name));
ipcMain.handle('models-check-api-keys', async () => modelConfig.checkApiKeyStatus());
ipcMain.handle('ai-is-configured', async () => modelConfig.isAIConfigured());

// === LangGraph Agent Backend IPC ===
//
// THE canonical AI execution path. The renderer (useChat) talks to the
// Python DeerFlow/LangGraph agent exclusively through these handlers.
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

ipcMain.handle('langgraph-create-thread', async () => {
  const threadId = await langgraph.createThread();
  return { thread_id: threadId };
});

ipcMain.handle('langgraph-stream-message', async (event, streamId, threadId, message, config) => {
  logger.info('langgraph', 'IPC stream-message', { streamId, threadId });
  await langgraph.streamMessage(threadId, message, config || {}, makeStreamForwarder(event, streamId));
  return { ok: true, streamId };
});

ipcMain.handle('langgraph-resume-run', async (event, streamId, threadId, response, config) => {
  logger.info('langgraph', 'IPC resume-run', { streamId, threadId, approved: response?.approved });
  await langgraph.resumeRun(threadId, response || {}, config || {}, makeStreamForwarder(event, streamId));
  return { ok: true, streamId };
});

// Non-streaming synchronous turn — used by headless task automation
// (single source: same langgraph-process, no parallel client).
ipcMain.handle('langgraph-send-message', async (_event, threadId, message, config) => {
  return langgraph.sendMessage(threadId, message, config || {});
});

ipcMain.handle('langgraph-fetch-suggestions', async (_event, recentMessages, n, config) => {
  return langgraph.fetchSuggestions(recentMessages || [], n || 3, config || {});
});

// === App Lifecycle ===

app.whenReady().then(() => {
  // Register logger IPC (must be first — other modules may log during init)
  registerLoggerIPC(ipcMain);
  logger.info('app', 'briizOS starting (Agent Mode — LangGraph/DeerFlow backend)', {
    isDev,
    pid: process.pid,
    electron: process.versions.electron,
    node: process.versions.node,
    startedAt: new Date().toISOString(),
  });

  // Initialize agent App Support directories
  agentConfig.ensureDirectories();

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

  // Start tool bridge server and pass the main window for IPC relay.
  // The tool bridge (port 2025) is how the Python agent reaches the
  // renderer tool registry, so it must be up before the agent starts.
  toolBridge.setMainWindow(win);
  toolBridge.start();

  // Start the Python DeerFlow/LangGraph agent backend (LangGraph dev
  // server on :2024 + Gateway on :8001). This is the single AI engine.
  langgraph.start().then((ok) => {
    logger.info('app', 'LangGraph backend start requested', { ok, status: langgraph.getStatus()?.status });
  });

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

// Stop the agent backend and tool bridge before quit (fire-and-forget —
// Electron won't await async). Stop the agent first so in-flight tool
// calls can drain before the bridge they depend on goes away.
app.on('before-quit', () => {
  langgraph.stop();
  toolBridge.stop();
});

// Clean up watchers on quit
app.on('will-quit', () => {
  filesystem.stopUSBWatcher();
});
