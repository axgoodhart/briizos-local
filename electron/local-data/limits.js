/**
 * Structured-data size limits shared by save-time validation
 * (local-data-service) and import-time guards (island-fs).
 *
 * SQLite itself copes with far more; the practical ceiling is the full
 * board state being serialized over IPC on every autosave (~0.5–1 KB per
 * file record), so these keep individual saves in the low-megabyte range.
 * Import guards enforce the same numbers *before* files reach the board,
 * so a save should never fail on size for imported content.
 */
module.exports = {
  ISLAND_MAX_PROJECTS: 2000,
  ISLAND_MAX_FILES_PER_PROJECT: 10000,
  // Total files accepted from a single drag-and-drop (may span projects).
  ISLAND_MAX_FILES_PER_DROP: 20000,
  // Directory entries examined before an import walk gives up (protects
  // against dropping e.g. a home directory — abort instead of hanging).
  ISLAND_MAX_SCAN_ENTRIES: 100000,
  // Island → Changes history entries kept (auto tags and File Hunter searches).
  ISLAND_MAX_CHANGES: 150,
  // Desks (saved views over islands) and saved island/card templates.
  ISLAND_MAX_DESKS: 200,
  ISLAND_MAX_TEMPLATES: 500,
};
