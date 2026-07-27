/**
 * Frame compaction (PLAN-BRIIZY.md §13).
 *
 * Old loose JPEGs are folded into H.265 chunks by `briizy-helper encode`, and the
 * rows are rewritten to point at `(media_path, media_offset)` instead of
 * `image_path`. Only once this lands does the 30-day retention target become
 * reachable at all — until then the byte cap prunes first, which is the intended
 * behaviour (§3), not a bug.
 *
 * Rules that keep the archive addressable:
 *
 *   - A chunk is rolled when the day, the capture mode, or the frame dimensions
 *     change. Mixing dimensions inside one chunk would silently rescale frames.
 *   - Frame N of the chunk is `media_offset = N`, in captured_at order, with no
 *     gaps. The database rows are only rewritten if the helper reports encoding
 *     exactly the number of frames it was given.
 *   - JPEGs are deleted only after the rows are committed. A crash in between
 *     leaves recoverable duplicates, never unreachable frames.
 */

const fs = require('fs');
const path = require('path');
const storage = require('./storage');

/** Frames younger than this stay as loose JPEGs — they are the ones being browsed. */
const COMPACT_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
/** Playback rate of a chunk. Only used to map offsets to timestamps. */
const CHUNK_FPS = 6;
/** Frames per chunk. Small enough that extracting one frame stays fast. */
const MAX_CHUNK_FRAMES = 600;
/** Chunks encoded per pass, so a first run on a big archive stays interruptible. */
const MAX_CHUNKS_PER_RUN = 4;

class Compactor {
  constructor({ service, helper, logger, userDataPath }) {
    this.service = service;
    this.helper = helper;
    this.logger = logger;
    this.userDataPath = userDataPath;
    this.running = false;
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.compactor', message, data);
  }

  /**
   * Group compactable frames into chunk candidates. Grouping is what makes the
   * chunk playable: same day, same mode, same dimensions, contiguous in time.
   */
  planChunks({ olderThanMs = COMPACT_AFTER_MS } = {}) {
    const cutoff = Date.now() - olderThanMs;
    const frames = this.service.listRewindFrames({
      to: cutoff,
      limit: 5000,
      includePath: true,
    })
      // Oldest first, and only frames that still have a loose JPEG.
      .filter((frame) => frame.imagePath)
      .sort((a, b) => a.capturedAt - b.capturedAt);

    const chunks = [];
    let current = null;
    for (const frame of frames) {
      const key = [
        storage.dayKey(frame.capturedAt),
        frame.captureMode,
        frame.width || 0,
        frame.height || 0,
      ].join('|');
      if (!current || current.key !== key || current.frames.length >= MAX_CHUNK_FRAMES) {
        current = { key, frames: [] };
        chunks.push(current);
      }
      current.frames.push(frame);
    }
    // A chunk of one or two frames saves nothing worth the indirection.
    return chunks.filter((chunk) => chunk.frames.length >= 10);
  }

  chunkPath(chunk) {
    const [day, mode] = chunk.key.split('|');
    const first = chunk.frames[0];
    return path.join(
      storage.mediaRoot(this.userDataPath),
      day,
      `${mode}-${first.capturedAt}-${chunk.frames.length}.mov`,
    );
  }

  /** One compaction pass. Safe to call repeatedly; does nothing when caught up. */
  async run({ olderThanMs = COMPACT_AFTER_MS, maxChunks = MAX_CHUNKS_PER_RUN } = {}) {
    if (this.running) return { skipped: 'already running' };
    if (this.helper.getStatus().state !== 'ready') {
      return { skipped: 'helper not ready' };
    }
    this.running = true;
    const summary = { chunks: 0, frames: 0, beforeBytes: 0, afterBytes: 0, failed: 0 };

    try {
      const chunks = this.planChunks({ olderThanMs }).slice(0, maxChunks);
      if (!chunks.length) {
        this._log('debug', 'Nothing to compact');
        return { ...summary, skipped: 'nothing to compact' };
      }

      for (const chunk of chunks) {
        const outPath = this.chunkPath(chunk);
        const framePaths = chunk.frames.map((frame) => frame.imagePath);
        const beforeBytes = chunk.frames.reduce((sum, frame) => sum + (frame.bytes || 0), 0);

        let encoded;
        try {
          encoded = await this.helper.request('encode', {
            frames: framePaths,
            out: outPath,
            fps: CHUNK_FPS,
          }, { timeoutMs: 5 * 60 * 1000 });
        } catch (error) {
          summary.failed += 1;
          this._log('warn', 'Chunk encode failed', {
            frames: chunk.frames.length,
            error: error?.message,
            code: error?.code,
          });
          continue;
        }

        // Offsets are positional. If the helper skipped anything, the mapping is
        // no longer trustworthy — throw the chunk away rather than write rows
        // that point at the wrong moment.
        if (encoded.frames !== chunk.frames.length) {
          summary.failed += 1;
          this._log('warn', 'Chunk discarded — frame count mismatch would misalign offsets', {
            expected: chunk.frames.length,
            encoded: encoded.frames,
            skipped: encoded.skipped?.length || 0,
          });
          fs.rmSync(outPath, { force: true });
          continue;
        }

        const committed = this.service.compactRewindFrames({
          mediaPath: outPath,
          mediaBytes: encoded.bytes || storage.fileSize(outPath),
          frames: chunk.frames.map((frame, index) => ({ frameId: frame.frameId, mediaOffset: index })),
        });

        // Rows are committed; now the JPEGs are redundant.
        const removal = storage.deleteFiles(framePaths);
        summary.chunks += 1;
        summary.frames += chunk.frames.length;
        summary.beforeBytes += beforeBytes;
        summary.afterBytes += encoded.bytes || 0;

        this._log('info', 'Compacted a chunk', {
          day: chunk.key.split('|')[0],
          frames: chunk.frames.length,
          beforeMB: +(beforeBytes / 1024 ** 2).toFixed(2),
          afterMB: +((encoded.bytes || 0) / 1024 ** 2).toFixed(2),
          ratio: beforeBytes ? +(beforeBytes / (encoded.bytes || 1)).toFixed(1) : null,
          rowsUpdated: committed.updated,
          jpegsRemoved: removal.removed,
        });
      }

      storage.pruneEmptyDayDirectories(this.userDataPath);
      if (summary.chunks) {
        this._log('info', 'Compaction pass complete', {
          ...summary,
          savedMB: +((summary.beforeBytes - summary.afterBytes) / 1024 ** 2).toFixed(2),
        });
      }
      return summary;
    } finally {
      this.running = false;
    }
  }

  /**
   * Pull a compacted frame back out to a temporary JPEG so it can be displayed.
   * The caller is responsible for deleting the temp file.
   */
  async extractFrame(frameId) {
    const frame = this.service.getRewindFrame(frameId, { includePath: true });
    if (!frame?.mediaPath || frame.mediaOffset == null) return null;
    const out = path.join(
      storage.framesRoot(this.userDataPath),
      '.extracted',
      `${frameId}.jpg`,
    );
    try {
      const result = await this.helper.request('extract', {
        path: frame.mediaPath,
        index: frame.mediaOffset,
        out,
        fps: CHUNK_FPS,
      }, { timeoutMs: 30000 });
      return result.path;
    } catch (error) {
      this._log('warn', 'Frame extraction failed', {
        frameId,
        offset: frame.mediaOffset,
        error: error?.message,
      });
      return null;
    }
  }
}

module.exports = { Compactor, COMPACT_AFTER_MS, CHUNK_FPS, MAX_CHUNK_FRAMES };
