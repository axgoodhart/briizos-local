const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const APP_SUPPORT = path.join(app.getPath('appData'), 'briizOS');

const DIRS = {
  root: APP_SUPPORT,
  canvas: path.join(APP_SUPPORT, 'canvas'),
  memory: path.join(APP_SUPPORT, 'memory'),
  chatLogs: path.join(APP_SUPPORT, 'memory', 'chat-logs'),
};

const CONFIG_PATH = path.join(APP_SUPPORT, 'config.json');
const AGENT_CONTEXT_PATH = path.join(APP_SUPPORT, 'memory', 'agent-context.md');

function ensureDirectories() {
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({
      filesystem: { blacklist: { paths: [], filetypes: [] } },
      terminal: { mode: 'ask-always' },
      memory: { chunksToInclude: 1 },
    }, null, 2));
  }
  if (!fs.existsSync(AGENT_CONTEXT_PATH)) {
    fs.writeFileSync(AGENT_CONTEXT_PATH, '# Agent Memory\n\nNo memories stored yet.\n');
  }
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {
      filesystem: { blacklist: { paths: [], filetypes: [] } },
      terminal: { mode: 'ask-always' },
      memory: { chunksToInclude: 1 },
    };
  }
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function updateConfig(partial) {
  const config = readConfig();
  // Deep merge for nested objects
  for (const [key, value] of Object.entries(partial)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof config[key] === 'object') {
      config[key] = { ...config[key], ...value };
    } else {
      config[key] = value;
    }
  }
  writeConfig(config);
  return config;
}

module.exports = {
  APP_SUPPORT, DIRS, CONFIG_PATH, AGENT_CONTEXT_PATH,
  ensureDirectories, readConfig, writeConfig, updateConfig,
};
