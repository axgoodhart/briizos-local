/**
 * briizy privacy gate — the ONE exclusion check (PLAN-BRIIZY.md I3).
 *
 * This module is called exactly once per tick, BEFORE the helper is asked to
 * capture anything. A frame from an excluded window is never written to disk,
 * never OCR'd, never handed to an assistant, and never reaches a model
 * provider — because it never exists. Consumers downstream do not re-check;
 * there is one gate and it runs first.
 *
 * Every function here is pure and synchronous so the exclusion rules are unit
 * testable without a database, a helper process, or Electron.
 */

/**
 * Bundle IDs denied by default. Password managers, the macOS login/lock
 * window, and the security agent that renders system credential prompts.
 * The user can remove any of these; the point is that the default is closed.
 */
const DEFAULT_EXCLUDED_BUNDLE_IDS = Object.freeze([
  // Password managers
  'com.1password.1password',
  'com.1password.1password7',
  'com.agilebits.onepassword',
  'com.agilebits.onepassword7',
  'com.bitwarden.desktop',
  'com.lastpass.LastPass',
  'com.lastpass.lastpassmacdesktop',
  'com.dashlane.Dashlane',
  'com.dashlane.dashlanephonefinal',
  'org.keepassxc.KeePassXC',
  'com.keepassx.keepassxc',
  'io.enpass.Enpass',
  'com.enpass.Enpass',
  'me.proton.pass.electron',
  'in.sinew.Enpass-Desktop',
  'com.apple.keychainaccess',
  // Credential / lock surfaces
  'com.apple.loginwindow',
  'com.apple.SecurityAgent',
  'com.apple.ScreenSaver.Engine',
  'com.apple.screensaver',
]);

/**
 * Window-title patterns denied by default, as source strings so they survive a
 * JSON round-trip through the settings store. Covers private/incognito browsing
 * windows (which report a normal browser bundle ID) and anything self-declaring
 * as a password surface.
 */
const DEFAULT_EXCLUDED_TITLE_PATTERNS = Object.freeze([
  '(?i)private browsing',
  '(?i)incognito',
  '(?i)\\(private\\)',
  '(?i)\\bpassword\\b',
  '(?i)\\bpasswords\\b',
  '(?i)keychain',
  '(?i)authenticator',
  '(?i)one-?time code',
]);

/** Reasons a frame can be denied. Surfaced in logs and in the status payload. */
const DENY_REASONS = Object.freeze({
  disabled: 'capture is disabled',
  paused: 'capture is paused',
  noWindow: 'no resolvable active window',
  excludedBundle: 'app is on the exclusion list',
  excludedTitle: 'window title matches an exclusion pattern',
  ownWindow: 'briizOS own window',
  screenLocked: 'screen is locked',
});

/**
 * Compile a stored pattern string into a RegExp. Supports a leading `(?i)`
 * inline flag (not natively supported in JS) so patterns stay portable strings.
 * An unparseable pattern fails CLOSED — it is treated as matching nothing but
 * is reported so the user can fix it, rather than silently disabling the rule
 * on a typo that could otherwise be read as "capture everything".
 */
function compilePattern(source) {
  if (typeof source !== 'string' || !source.trim()) return null;
  let body = source;
  let flags = '';
  const inline = /^\(\?([imsu]+)\)/.exec(body);
  if (inline) {
    flags = inline[1];
    body = body.slice(inline[0].length);
  }
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

/** Compile a list of pattern strings, dropping (and reporting) invalid ones. */
function compilePatterns(sources = []) {
  const compiled = [];
  const invalid = [];
  for (const source of sources) {
    const regex = compilePattern(source);
    if (regex) compiled.push({ source, regex });
    else invalid.push(source);
  }
  return { compiled, invalid };
}

/**
 * The gate. Given the helper's `meta` result and the effective config, decide
 * whether this window may be captured.
 *
 * @returns {{ allowed: boolean, reason?: string, detail?: string }}
 */
function evaluate(meta, config = {}, runtime = {}) {
  if (config.enabled === false) return { allowed: false, reason: DENY_REASONS.disabled };
  if (runtime.paused) return { allowed: false, reason: DENY_REASONS.paused };
  if (runtime.screenLocked) return { allowed: false, reason: DENY_REASONS.screenLocked };

  const bundleId = typeof meta?.bundleId === 'string' ? meta.bundleId : '';
  const windowTitle = typeof meta?.windowTitle === 'string' ? meta.windowTitle : '';
  const appName = typeof meta?.appName === 'string' ? meta.appName : '';

  // A display-session capture has no single owning window; the rest of the
  // rules still apply to whatever is frontmost.
  if (!bundleId && !windowTitle && !appName) {
    return { allowed: false, reason: DENY_REASONS.noWindow };
  }

  // briizOS's own windows are recorded like any other app unless the user
  // turns "record briizOS itself" off in the exclusions UI. (Until 2026-07-27
  // this was hardcoded to deny, invisibly — which made the app look dead to
  // the one person whose main window is briizOS: its developer.) When off, the
  // rationale stands: a screenshot of the log panel showing OCR of the
  // previous screenshot is noise at best and a feedback loop at worst.
  const ownBundleIds = runtime.ownBundleIds || [];
  if (config.captureOwnWindow === false && bundleId && ownBundleIds.includes(bundleId)) {
    return { allowed: false, reason: DENY_REASONS.ownWindow, detail: bundleId };
  }

  const excludedBundleIds = Array.isArray(config.excludedBundleIds)
    ? config.excludedBundleIds
    : DEFAULT_EXCLUDED_BUNDLE_IDS;
  if (bundleId && excludedBundleIds.some((entry) => entry.toLowerCase() === bundleId.toLowerCase())) {
    return { allowed: false, reason: DENY_REASONS.excludedBundle, detail: bundleId };
  }

  const patternSources = Array.isArray(config.excludedTitlePatterns)
    ? config.excludedTitlePatterns
    : DEFAULT_EXCLUDED_TITLE_PATTERNS;
  const { compiled } = compilePatterns(patternSources);
  const haystacks = [windowTitle, appName].filter(Boolean);
  for (const { source, regex } of compiled) {
    if (haystacks.some((value) => regex.test(value))) {
      return { allowed: false, reason: DENY_REASONS.excludedTitle, detail: source };
    }
  }

  return { allowed: true };
}

/**
 * I2 belt-and-braces: assert a payload bound for a model provider carries no
 * image bytes and no filesystem paths. Used by the assistants and by the
 * required egress test, so the invariant is enforced by code rather than
 * by reviewer attention.
 *
 * @returns {{ clean: boolean, violations: string[] }}
 */
const FORBIDDEN_PATTERNS = Object.freeze([
  { name: 'data-uri-image', regex: /data:image\/[a-z+]+;base64,/i },
  { name: 'jpeg-magic-base64', regex: /\/9j\/[A-Za-z0-9+/]{40,}/ },
  { name: 'png-magic-base64', regex: /iVBORw0KGgo[A-Za-z0-9+/]{20,}/ },
  { name: 'absolute-posix-path', regex: /(^|["'\s(])\/(?:Users|Applications|Library|System|private|tmp|var)\//i },
  { name: 'file-url', regex: /file:\/\//i },
  { name: 'frames-archive-path', regex: /rewind[/\\]frames/i },
]);

function assertNoPixelEgress(payload) {
  const violations = [];
  const seen = new WeakSet();

  const visit = (value, path) => {
    if (value == null) return;
    if (typeof value === 'string') {
      for (const { name, regex } of FORBIDDEN_PATTERNS) {
        if (regex.test(value)) violations.push(`${path}: ${name}`);
      }
      return;
    }
    if (typeof value === 'object') {
      if (Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof ArrayBuffer) {
        violations.push(`${path}: binary-buffer`);
        return;
      }
      if (seen.has(value)) return;
      seen.add(value);
      if (Array.isArray(value)) {
        value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
        return;
      }
      for (const [key, entry] of Object.entries(value)) visit(entry, `${path}.${key}`);
    }
  };

  visit(payload, '$');
  return { clean: violations.length === 0, violations };
}

module.exports = {
  DEFAULT_EXCLUDED_BUNDLE_IDS,
  DEFAULT_EXCLUDED_TITLE_PATTERNS,
  DENY_REASONS,
  compilePattern,
  compilePatterns,
  evaluate,
  assertNoPixelEgress,
};
