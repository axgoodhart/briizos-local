const fs = require('fs');
const path = require('path');
const agentConfig = require('./agent-config');
const { logger } = require('./logger');

const MAX_RECEIPTS = 5000;
const RECEIPTS_PATH = path.join(agentConfig.DIRS.root, 'agent-op-receipts.json');

let cache = null;

function loadReceipts() {
  if (cache) return cache;

  try {
    if (!fs.existsSync(RECEIPTS_PATH)) {
      cache = {};
      return cache;
    }
    const raw = fs.readFileSync(RECEIPTS_PATH, 'utf8');
    cache = JSON.parse(raw);
    if (!cache || typeof cache !== 'object') {
      cache = {};
    }
  } catch (error) {
    logger.warn('agent-ops', 'Failed to load op receipts, resetting', error?.message);
    cache = {};
  }

  return cache;
}

function persistReceipts() {
  try {
    fs.writeFileSync(RECEIPTS_PATH, JSON.stringify(cache || {}, null, 2), 'utf8');
  } catch (error) {
    logger.warn('agent-ops', 'Failed to persist op receipts', error?.message);
  }
}

function pruneReceipts(store) {
  const keys = Object.keys(store);
  if (keys.length <= MAX_RECEIPTS) return;

  keys
    .sort((a, b) => (store[a]?.savedAt || 0) - (store[b]?.savedAt || 0))
    .slice(0, keys.length - MAX_RECEIPTS)
    .forEach((key) => {
      delete store[key];
    });
}

function getReceipt(opId) {
  if (!opId) return null;
  const store = loadReceipts();
  return store[opId] || null;
}

function recordReceipt(opId, result) {
  if (!opId) return;
  const store = loadReceipts();
  store[opId] = {
    savedAt: Date.now(),
    result,
  };
  pruneReceipts(store);
  persistReceipts();
}

module.exports = {
  getReceipt,
  recordReceipt,
};
