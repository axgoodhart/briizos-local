/**
 * Frame media on disk (PLAN-BRIIZY.md §7).
 *
 * The helper writes JPEGs; this module decides where they go, removes them when
 * retention says so, and reconciles the directory against the database. The
 * database is authoritative for metadata (I4) — files with no row are orphans
 * and files whose row is gone are garbage, and both are cleaned up here rather
 * than left to accumulate.
 *
 * Pure path/fs work only: no capture, no OCR, no policy. Keeping it separate is
 * what lets retention and recovery be unit tested without a helper process.
 */

const fs = require('fs');
const path = require('path');

const FRAME_EXTENSION = '.jpg';
const DAY_DIRECTORY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `{userData}/rewind/frames` — inside the app's own container, never in /tmp. */
function framesRoot(userDataPath) {
  return path.join(userDataPath, 'rewind', 'frames');
}

function mediaRoot(userDataPath) {
  return path.join(userDataPath, 'rewind', 'media');
}

/** Local (not UTC) day key, so a day folder matches the user's calendar day. */
function dayKey(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Absolute path for a new frame. Name carries the capture timestamp so a
 * directory listing sorts chronologically even with no database.
 */
function framePath(userDataPath, capturedAt, suffix) {
  const unique = String(suffix || Math.random().toString(36).slice(2, 10)).replace(/[^A-Za-z0-9-]/g, '');
  return path.join(
    framesRoot(userDataPath),
    dayKey(capturedAt),
    `${capturedAt}-${unique}${FRAME_EXTENSION}`,
  );
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * Hamming distance between two hex dHash strings. Distance ≤ threshold means
 * "same screen" — caret blink, spinner, clock tick (omi measured spinner = 1,
 * cursor shift = 4, real content change = 23).
 */
function hammingDistance(hexA, hexB) {
  if (typeof hexA !== 'string' || typeof hexB !== 'string' || !hexA || !hexB) return 64;
  let a;
  let b;
  try {
    a = BigInt(`0x${hexA}`);
    b = BigInt(`0x${hexB}`);
  } catch {
    return 64;
  }
  let xor = a ^ b;
  let bits = 0;
  while (xor > 0n) {
    if (xor & 1n) bits += 1;
    xor >>= 1n;
  }
  return bits;
}

/** Remove files, tolerating ones already gone. Returns what actually happened. */
function deleteFiles(paths = []) {
  let removed = 0;
  let missing = 0;
  let failed = 0;
  const errors = [];
  for (const filePath of paths) {
    if (!filePath) continue;
    try {
      fs.unlinkSync(filePath);
      removed += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') missing += 1;
      else {
        failed += 1;
        if (errors.length < 5) errors.push(`${path.basename(filePath)}: ${error.message}`);
      }
    }
  }
  return { removed, missing, failed, errors };
}

/** Drop day folders that no longer hold any frames. */
function pruneEmptyDayDirectories(userDataPath) {
  const root = framesRoot(userDataPath);
  if (!fs.existsSync(root)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !DAY_DIRECTORY_PATTERN.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    try {
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        removed += 1;
      }
    } catch { /* raced with a write; leave it */ }
  }
  return removed;
}

/** Walk the frames tree. Used for usage reporting and reconciliation. */
function listFrameFiles(userDataPath) {
  const root = framesRoot(userDataPath);
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !DAY_DIRECTORY_PATTERN.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(FRAME_EXTENSION)) continue;
      const filePath = path.join(dir, name);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) files.push({ path: filePath, bytes: stat.size, mtimeMs: stat.mtimeMs });
      } catch { /* vanished mid-walk */ }
    }
  }
  return files;
}

function diskUsage(userDataPath) {
  const files = listFrameFiles(userDataPath);
  return {
    files: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  };
}

/**
 * Reconcile disk against the database.
 *
 * `orphans` are files with no surviving row — safe to delete (a crash between
 * the helper's write and the row insert leaves exactly these). `missing` are
 * rows whose file is gone, which the caller marks so the UI does not offer a
 * frame it cannot show.
 */
function reconcile(userDataPath, knownPaths) {
  const known = knownPaths instanceof Set ? knownPaths : new Set(knownPaths || []);
  const files = listFrameFiles(userDataPath);
  const onDisk = new Set(files.map((file) => file.path));
  const orphans = files.filter((file) => !known.has(file.path));
  const missing = [...known].filter((filePath) => !onDisk.has(filePath));
  return {
    orphans,
    orphanBytes: orphans.reduce((sum, file) => sum + file.bytes, 0),
    missing,
    checked: files.length,
  };
}

/** Best-effort byte size, for accounting when the helper's number is absent. */
function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

module.exports = {
  FRAME_EXTENSION,
  dayKey,
  deleteFiles,
  diskUsage,
  ensureDirectory,
  fileSize,
  framePath,
  framesRoot,
  hammingDistance,
  listFrameFiles,
  mediaRoot,
  pruneEmptyDayDirectories,
  reconcile,
};
