const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');
const { logger } = require('./logger');

/**
 * File System operations for briizOS
 * Provides IPC handlers for browsing the Mac filesystem
 */

const HOME_DIR = os.homedir();
const VOLUMES_PATH = '/Volumes';

// System volumes to filter out (not user-mounted drives)
const SYSTEM_VOLUMES = [
  'Macintosh HD',
  'Macintosh HD - Data',
  'Recovery',
  'Preboot',
  'VM',
  'Update',
  'com.apple.TimeMachine.localsnapshots',
  'Data'
];

// USB watcher state
let volumeWatcher = null;
const usbEvents = new EventEmitter();

/**
 * Get common home directories for LOCAL section
 */
function getHomeDirs() {
  const dirs = [
    { name: 'Documents', path: path.join(HOME_DIR, 'Documents') },
    { name: 'Downloads', path: path.join(HOME_DIR, 'Downloads') },
    { name: 'Desktop', path: path.join(HOME_DIR, 'Desktop') },
    { name: 'Pictures', path: path.join(HOME_DIR, 'Pictures') },
    { name: 'Music', path: path.join(HOME_DIR, 'Music') },
    { name: 'Movies', path: path.join(HOME_DIR, 'Movies') }
  ];

  // Filter to only existing directories
  return dirs.filter(dir => {
    try {
      return fs.existsSync(dir.path) && fs.statSync(dir.path).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * iCloud Drive path on macOS
 */
const ICLOUD_DRIVE_PATH = path.join(HOME_DIR, 'Library', 'Mobile Documents', 'com~apple~CloudDocs');

/**
 * Get iCloud Drive directories for iCloud section
 * Returns the root iCloud Drive folder contents if available
 */
function getICloudDirs() {
  try {
    // Check if iCloud Drive exists
    if (!fs.existsSync(ICLOUD_DRIVE_PATH)) {
      return { available: false, error: 'iCloud Drive not found', dirs: [] };
    }

    // Get root level folders/files in iCloud Drive
    const items = fs.readdirSync(ICLOUD_DRIVE_PATH, { withFileTypes: true });

    const dirs = items
      .filter(item => !item.name.startsWith('.')) // Hide hidden files
      .map(item => ({
        name: item.name,
        path: path.join(ICLOUD_DRIVE_PATH, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile()
      }))
      .sort((a, b) => {
        // Directories first, then files, alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    return { available: true, dirs };
  } catch (error) {
    logger.error('fs', 'Error accessing iCloud Drive', error?.message);
    return { available: false, error: error.message, dirs: [] };
  }
}

/**
 * Get USB drives mounted in /Volumes
 * Filters out system volumes like Macintosh HD
 * @returns {Object} { available: boolean, drives: Array, error?: string }
 */
function getUSBDrives() {
  try {
    // Check if /Volumes exists
    if (!fs.existsSync(VOLUMES_PATH)) {
      return { available: false, error: '/Volumes not found', drives: [] };
    }

    // Get all items in /Volumes
    const items = fs.readdirSync(VOLUMES_PATH, { withFileTypes: true });

    // Filter to only user-mounted drives (exclude system volumes)
    const drives = items
      .filter(item => {
        // Must be a directory
        if (!item.isDirectory()) return false;
        // Skip hidden volumes
        if (item.name.startsWith('.')) return false;
        // Skip system volumes
        if (SYSTEM_VOLUMES.includes(item.name)) return false;
        // Also filter out volumes that start with system prefixes
        if (item.name.startsWith('com.apple.')) return false;
        return true;
      })
      .map(item => ({
        name: item.name,
        path: path.join(VOLUMES_PATH, item.name),
        isDirectory: true,
        isFile: false,
        type: 'usb'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { available: true, drives };
  } catch (error) {
    logger.error('fs', 'Error accessing USB drives', error?.message);
    return { available: false, error: error.message, drives: [] };
  }
}

/**
 * Start watching /Volumes for mount/unmount events
 * @param {Function} callback - Called when drives change with { event: 'mount'|'unmount', drives: Array }
 */
function startUSBWatcher(callback) {
  if (volumeWatcher) {
    // Already watching
    return;
  }

  try {
    // Watch the /Volumes directory for changes
    volumeWatcher = fs.watch(VOLUMES_PATH, { persistent: false }, (eventType, filename) => {
      // Debounce by small delay - multiple events fire on mount/unmount
      if (volumeWatcher._debounceTimer) {
        clearTimeout(volumeWatcher._debounceTimer);
      }

      volumeWatcher._debounceTimer = setTimeout(() => {
        const result = getUSBDrives();
        if (callback) {
          callback({ event: eventType, filename, drives: result.drives });
        }
        usbEvents.emit('change', { event: eventType, filename, drives: result.drives });
      }, 500);
    });

    volumeWatcher.on('error', (err) => {
      logger.error('fs', 'USB watcher error', err?.message);
    });
  } catch (error) {
    logger.error('fs', 'Failed to start USB watcher', error?.message);
  }
}

/**
 * Stop watching for USB changes
 */
function stopUSBWatcher() {
  if (volumeWatcher) {
    if (volumeWatcher._debounceTimer) {
      clearTimeout(volumeWatcher._debounceTimer);
    }
    volumeWatcher.close();
    volumeWatcher = null;
  }
}

/**
 * Get the USB events emitter for subscribing to changes
 */
function getUSBEvents() {
  return usbEvents;
}

/**
 * List contents of a directory
 * @param {string} dirPath - Path to directory
 * @returns {Array} Array of file/folder objects
 */
function listDirectory(dirPath) {
  try {
    // Security check: ensure path is not trying to access system directories
    const resolvedPath = path.resolve(dirPath);

    // Allow home directory and subdirectories, plus /Volumes for USB
    const allowedPaths = [HOME_DIR, '/Volumes'];
    const isAllowed = allowedPaths.some(allowed =>
      resolvedPath === allowed || resolvedPath.startsWith(allowed + path.sep)
    );

    if (!isAllowed) {
      throw new Error('Access denied: Path not in allowed directories');
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    return items
      .filter(item => !item.name.startsWith('.')) // Hide hidden files
      .map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile()
      }))
      .sort((a, b) => {
        // Directories first, then files, alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    logger.error('fs', 'Error listing directory', error?.message);
    return { error: error.message };
  }
}

/**
 * Read file contents (for AI context)
 * @param {string} filePath - Path to file
 * @param {number} maxSize - Maximum size in bytes (default 100KB)
 * @returns {Object} File content or error
 */
function readFile(filePath, maxSize = 100 * 1024) {
  try {
    const resolvedPath = path.resolve(filePath);

    // Security check
    const allowedPaths = [HOME_DIR, '/Volumes'];
    const isAllowed = allowedPaths.some(allowed =>
      resolvedPath.startsWith(allowed + path.sep)
    );

    if (!isAllowed) {
      throw new Error('Access denied: Path not in allowed directories');
    }

    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      throw new Error('Not a file');
    }

    // Check file size
    if (stats.size > maxSize) {
      // Read only first maxSize bytes
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(maxSize);
      fs.readSync(fd, buffer, 0, maxSize, 0);
      fs.closeSync(fd);

      return {
        content: buffer.toString('utf8'),
        truncated: true,
        totalSize: stats.size,
        readSize: maxSize
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return {
      content,
      truncated: false,
      totalSize: stats.size,
      readSize: stats.size
    };
  } catch (error) {
    logger.error('fs', 'Error reading file', error?.message);
    return { error: error.message };
  }
}

/**
 * Get file info without reading content
 * @param {string} filePath - Path to file
 * @returns {Object} File stats
 */
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  getHomeDirs,
  getICloudDirs,
  getUSBDrives,
  startUSBWatcher,
  stopUSBWatcher,
  getUSBEvents,
  listDirectory,
  readFile,
  getFileInfo,
  HOME_DIR,
  ICLOUD_DRIVE_PATH,
  VOLUMES_PATH
};
