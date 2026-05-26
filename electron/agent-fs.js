const fs = require('fs');
const path = require('path');
const os = require('os');
const { logger } = require('./logger');
const { getReceipt, recordReceipt } = require('./agent-op-receipts');

// Expand ~ to home directory (Node.js path.resolve does NOT do this)
function expandHome(filePath) {
  if (filePath === '~') return os.homedir();
  if (filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function agentReadFile(filePath, maxSize = 500 * 1024) {
  try {
    const resolved = path.resolve(expandHome(filePath));
    logger.debug('fs', 'agent readFile', { filePath, resolved });
    const stats = fs.statSync(resolved);
    if (!stats.isFile()) return { error: 'Not a file' };

    if (stats.size > maxSize) {
      const fd = fs.openSync(resolved, 'r');
      const buffer = Buffer.alloc(maxSize);
      fs.readSync(fd, buffer, 0, maxSize, 0);
      fs.closeSync(fd);
      return { content: buffer.toString('utf8'), truncated: true, totalSize: stats.size };
    }

    return { content: fs.readFileSync(resolved, 'utf8'), truncated: false, totalSize: stats.size };
  } catch (error) {
    return { error: error.message };
  }
}

function agentReadFileBase64(filePath, maxSize = 5 * 1024 * 1024) {
  try {
    const resolved = path.resolve(expandHome(filePath));
    logger.debug('fs', 'agent readFileBase64', { filePath, resolved });
    const stats = fs.statSync(resolved);
    if (!stats.isFile()) return { error: 'Not a file' };
    if (stats.size > maxSize) return { error: `File too large (${stats.size} bytes, max ${maxSize})` };
    return {
      base64: fs.readFileSync(resolved).toString('base64'),
      truncated: false,
      totalSize: stats.size,
      path: resolved,
    };
  } catch (error) {
    return { error: error.message };
  }
}

function replayIfPresent(opId) {
  const receipt = getReceipt(opId);
  if (!receipt) return null;
  return {
    ...receipt.result,
    idempotentReplay: true,
    opId,
  };
}

function remember(opId, result) {
  if (!opId) return;
  recordReceipt(opId, result);
}

function agentWriteFile(filePath, content, opId = null) {
  const replay = replayIfPresent(opId);
  if (replay) return replay;
  try {
    const resolved = path.resolve(expandHome(filePath));
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolved, content, 'utf8');
    const stats = fs.statSync(resolved);
    const result = { success: true, path: resolved, size: stats.size };
    remember(opId, result);
    return result;
  } catch (error) {
    const result = { error: error.message };
    remember(opId, result);
    return result;
  }
}

function agentDeleteFile(filePath, opId = null) {
  const replay = replayIfPresent(opId);
  if (replay) return replay;
  try {
    const resolved = path.resolve(expandHome(filePath));
    if (!fs.existsSync(resolved)) {
      const result = { error: 'File not found' };
      remember(opId, result);
      return result;
    }
    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) {
      fs.rmSync(resolved, { recursive: true });
    } else {
      fs.unlinkSync(resolved);
    }
    const result = { success: true, path: resolved };
    remember(opId, result);
    return result;
  } catch (error) {
    const result = { error: error.message };
    remember(opId, result);
    return result;
  }
}

function agentMoveFile(source, destination, opId = null) {
  const replay = replayIfPresent(opId);
  if (replay) return replay;
  try {
    const resolvedSrc = path.resolve(expandHome(source));
    const resolvedDest = path.resolve(expandHome(destination));
    if (!fs.existsSync(resolvedSrc)) {
      const result = { error: 'Source not found' };
      remember(opId, result);
      return result;
    }
    const destDir = path.dirname(resolvedDest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(resolvedSrc, resolvedDest);
    const result = { success: true, from: resolvedSrc, to: resolvedDest };
    remember(opId, result);
    return result;
  } catch (error) {
    const result = { error: error.message };
    remember(opId, result);
    return result;
  }
}

function agentCopyFile(source, destination, opId = null) {
  const replay = replayIfPresent(opId);
  if (replay) return replay;
  try {
    const resolvedSrc = path.resolve(expandHome(source));
    const resolvedDest = path.resolve(expandHome(destination));
    if (!fs.existsSync(resolvedSrc)) {
      const result = { error: 'Source not found' };
      remember(opId, result);
      return result;
    }
    const destDir = path.dirname(resolvedDest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(resolvedSrc, resolvedDest, { recursive: true });
    const stats = fs.statSync(resolvedDest);
    const result = { success: true, from: resolvedSrc, to: resolvedDest, size: stats.size };
    remember(opId, result);
    return result;
  } catch (error) {
    const result = { error: error.message };
    remember(opId, result);
    return result;
  }
}

function agentListDirectory(dirPath) {
  try {
    const resolved = path.resolve(expandHome(dirPath));
    logger.debug('fs', 'agent listDir', { dirPath, resolved });
    if (!fs.existsSync(resolved)) return { error: 'Directory not found' };
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) return { error: 'Not a directory' };

    const items = fs.readdirSync(resolved, { withFileTypes: true });
    const entries = items
      .filter(item => !item.name.startsWith('.'))
      .map(item => ({
        name: item.name,
        path: path.join(resolved, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    return { entries, count: entries.length, path: resolved };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  agentReadFile, agentReadFileBase64, agentWriteFile, agentDeleteFile,
  agentMoveFile, agentCopyFile, agentListDirectory,
};
