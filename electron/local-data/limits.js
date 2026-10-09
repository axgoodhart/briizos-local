/**
 * Structured-data size limits shared by save-time validation
 * (local-data-service) and import-time guards (forest-fs).
 *
 * SQLite itself copes with far more; the practical ceiling is the full
 * board state being serialized over IPC on every autosave (~0.5–1 KB per
 * file record), so these keep individual saves in the low-megabyte range.
 * Import guards enforce the same numbers *before* files reach the board,
 * so a save should never fail on size for imported content.
 */
module.exports = {
  FOREST_MAX_PROJECTS: 2000,
  FOREST_MAX_FILES_PER_PROJECT: 10000,
  // Total files accepted from a single drag-and-drop (may span projects).
  FOREST_MAX_FILES_PER_DROP: 20000,
  // Directory entries examined before an import walk gives up (protects
  // against dropping e.g. a home directory — abort instead of hanging).
  FOREST_MAX_SCAN_ENTRIES: 100000,
  // Forest → Changes history entries kept (auto tags and File Hunter searches).
  FOREST_MAX_CHANGES: 150,
};
