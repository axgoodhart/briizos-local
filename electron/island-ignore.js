/**
 * Island ignore rules — a .gitignore-style default list that keeps
 * dependency trees, build output, VCS internals, caches, and OS junk out
 * of board imports and Hunter/FileHawk scans.
 *
 * Pattern syntax (a small subset of .gitignore, matched against basenames,
 * case-insensitively):
 *   - `name`   matches a file or directory named `name`
 *   - `name/`  matches directories only
 *   - `*.ext`  `*` matches any run of characters
 *
 * Hidden entries (leading dot) are treated as ignored by `isHidden`;
 * callers exempt explicitly dropped roots so a user can still import a
 * hidden folder on purpose.
 */

const DEFAULT_IGNORES = [
  // Dependency trees
  'node_modules/', 'bower_components/', 'vendor/', 'Pods/', '.pnpm-store/',
  // VCS internals
  '.git/', '.hg/', '.svn/',
  // Build output
  'dist/', 'build/', 'out/', 'target/', 'DerivedData/',
  '.next/', '.nuxt/', '.output/',
  // Caches, coverage, environments
  'coverage/', '__pycache__/', '.pytest_cache/', '.cache/', '.parcel-cache/',
  '.turbo/', '.gradle/', '.terraform/', 'venv/', '.venv/', '.tox/',
  // IDE / tooling state
  '.idea/', '.vscode/',
  // Compiled artifacts
  '*.pyc', '*.pyo', '*.class', '*.o',
  // OS junk
  '.DS_Store', 'Thumbs.db', 'desktop.ini',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePattern(pattern) {
  const dirOnly = pattern.endsWith('/');
  const raw = dirOnly ? pattern.slice(0, -1) : pattern;
  const source = raw.split('*').map(escapeRegExp).join('.*');
  return { regex: new RegExp(`^${source}$`, 'i'), dirOnly };
}

const COMPILED = DEFAULT_IGNORES.map(compilePattern);

function isHidden(name) {
  return typeof name === 'string' && name.startsWith('.');
}

/**
 * @param {string} name      basename of the entry
 * @param {boolean} isDirectory
 */
function isIgnored(name, isDirectory) {
  if (typeof name !== 'string' || !name) return false;
  return COMPILED.some(({ regex, dirOnly }) => (!dirOnly || isDirectory) && regex.test(name));
}

module.exports = { DEFAULT_IGNORES, isHidden, isIgnored };
