/**
 * BriizyConfig — defaults, normalization, and the assistant sub-config
 * (PLAN-BRIIZY.md §2 interfaces, §3 defaults).
 *
 * Config is persisted by LocalDataService in `embedded_app_state` under
 * app_id 'briizy' (I4 — no fourth store, no JSON file on the side). This module
 * is pure: it knows the shape and the defaults, and it clamps whatever comes
 * back from disk or from the renderer into that shape. Anything unrecognized is
 * dropped rather than passed through, so a stale stored blob can never widen
 * what the pipeline does.
 */

const {
  DEFAULT_EXCLUDED_BUNDLE_IDS,
  DEFAULT_EXCLUDED_TITLE_PATTERNS,
} = require('./privacy');

const GIB = 1024 * 1024 * 1024;

/** Capture states exposed to the renderer (§2 CaptureState). */
const CAPTURE_STATES = Object.freeze([
  'permissionRequired',
  'paused',
  'capturingWindow',
  'capturingDisplay',
  'unavailable',
  'error',
]);

const OCR_MODES = Object.freeze(['fast', 'accurate']);
const BATTERY_BEHAVIORS = Object.freeze(['ignore', 'deferOcr', 'pauseCapture']);

/** The six assistants from the omi port (§6). Ids are stable storage keys. */
const ASSISTANT_IDS = Object.freeze([
  'insight',
  'taskExtraction',
  'memoryExtraction',
  'goals',
  'focus',
  'taskAgent',
]);

/**
 * Per-assistant defaults. Note `immediateExecution: false` on every one:
 * plan-staging mode is the default and immediate execution is a per-assistant
 * opt-in that stays off until trusted (§3, I6).
 */
function defaultAssistant(id) {
  const intervals = {
    insight: 15 * 60 * 1000,
    taskExtraction: 10 * 60 * 1000,
    memoryExtraction: 20 * 60 * 1000,
    goals: 30 * 60 * 1000,
    focus: 5 * 60 * 1000,
    taskAgent: 30 * 60 * 1000,
  };
  return {
    // Phase 4 turns these on after their prompts exist; Phase 1/2 ship with the
    // pipeline running and nothing analysing it.
    enabled: false,
    intervalMs: intervals[id] ?? 15 * 60 * 1000,
    model: null, // null = cheapest configured provider (§3)
    prompt: null, // null = built-in default prompt, editable in Settings
    quietHours: null, // e.g. { from: '22:00', to: '08:00' }
    immediateExecution: false,
  };
}

function defaults() {
  return {
    // I10 — nothing silently enabled. Onboarding flips this.
    enabled: false,
    onboardedAt: null,
    captureIntervalMs: 3000,
    ocrEveryNthFrame: 3,
    retentionDays: 30,
    // I8 — byte cap enforced from the first capture, before compaction exists.
    // At 3s cadence this is the binding constraint until Phase 7 lands.
    retentionBytes: 10 * GIB,
    ocrMode: 'fast',
    ocrLanguages: ['en-US'],
    batteryBehavior: 'deferOcr',
    excludedBundleIds: [...DEFAULT_EXCLUDED_BUNDLE_IDS],
    excludedTitlePatterns: [...DEFAULT_EXCLUDED_TITLE_PATTERNS],
    // briizOS's own windows ARE recorded by default — the person using this
    // app is building it. The visible switch to turn that off lives in the
    // exclusions section of the settings.
    captureOwnWindow: true,
    inactivityThresholdMs: 5 * 60 * 1000,
    // I2 — OCR text may reach a provider only with this on; still user-gated.
    cloudTextAnalysisAllowed: false,
    summaryTimeLocal: '18:00',
    assistants: Object.fromEntries(ASSISTANT_IDS.map((id) => [id, defaultAssistant(id)])),
  };
}

function clampInt(value, fallback, { min, max }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function stringList(value, fallback, { max = 500, maxLength = 300 } = {}) {
  if (!Array.isArray(value)) return [...fallback];
  const out = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed || trimmed.length > maxLength) continue;
    if (!out.includes(trimmed)) out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

function timeOfDay(value, fallback) {
  if (typeof value !== 'string') return fallback;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim()) ? value.trim() : fallback;
}

function quietHours(value) {
  if (!value || typeof value !== 'object') return null;
  const from = timeOfDay(value.from, null);
  const to = timeOfDay(value.to, null);
  return from && to ? { from, to } : null;
}

function normalizeAssistant(id, value) {
  const base = defaultAssistant(id);
  if (!value || typeof value !== 'object') return base;
  return {
    enabled: value.enabled === true,
    intervalMs: clampInt(value.intervalMs, base.intervalMs, { min: 60 * 1000, max: 24 * 60 * 60 * 1000 }),
    model: typeof value.model === 'string' && value.model.trim() ? value.model.trim().slice(0, 200) : null,
    prompt: typeof value.prompt === 'string' && value.prompt.trim() ? value.prompt.slice(0, 20000) : null,
    quietHours: quietHours(value.quietHours),
    immediateExecution: value.immediateExecution === true,
  };
}

/**
 * Normalize an arbitrary stored/incoming object into a complete, safe config.
 * Never throws — an unusable field falls back to its default.
 */
function normalize(input) {
  const base = defaults();
  if (!input || typeof input !== 'object') return base;

  return {
    enabled: input.enabled === true,
    onboardedAt: Number.isFinite(Number(input.onboardedAt)) && Number(input.onboardedAt) > 0
      ? Math.round(Number(input.onboardedAt))
      : null,
    // 1s floor: below that the WindowServer contention outweighs the extra frames.
    captureIntervalMs: clampInt(input.captureIntervalMs, base.captureIntervalMs, {
      min: 1000,
      max: 5 * 60 * 1000,
    }),
    ocrEveryNthFrame: clampInt(input.ocrEveryNthFrame, base.ocrEveryNthFrame, { min: 1, max: 30 }),
    retentionDays: clampInt(input.retentionDays, base.retentionDays, { min: 1, max: 3650 }),
    retentionBytes: clampInt(input.retentionBytes, base.retentionBytes, {
      min: 256 * 1024 * 1024,
      max: 2000 * GIB,
    }),
    ocrMode: OCR_MODES.includes(input.ocrMode) ? input.ocrMode : base.ocrMode,
    ocrLanguages: stringList(input.ocrLanguages, base.ocrLanguages, { max: 10, maxLength: 20 }),
    batteryBehavior: BATTERY_BEHAVIORS.includes(input.batteryBehavior)
      ? input.batteryBehavior
      : base.batteryBehavior,
    excludedBundleIds: stringList(input.excludedBundleIds, base.excludedBundleIds),
    excludedTitlePatterns: stringList(input.excludedTitlePatterns, base.excludedTitlePatterns),
    captureOwnWindow: input.captureOwnWindow !== false,
    inactivityThresholdMs: clampInt(input.inactivityThresholdMs, base.inactivityThresholdMs, {
      min: 30 * 1000,
      max: 6 * 60 * 60 * 1000,
    }),
    cloudTextAnalysisAllowed: input.cloudTextAnalysisAllowed === true,
    summaryTimeLocal: timeOfDay(input.summaryTimeLocal, base.summaryTimeLocal),
    assistants: Object.fromEntries(
      ASSISTANT_IDS.map((id) => [id, normalizeAssistant(id, input.assistants?.[id])]),
    ),
  };
}

/** Merge a partial patch over the current config, then re-normalize. */
function merge(current, patch) {
  const base = normalize(current);
  if (!patch || typeof patch !== 'object') return base;
  const assistants = { ...base.assistants };
  if (patch.assistants && typeof patch.assistants === 'object') {
    for (const id of ASSISTANT_IDS) {
      if (patch.assistants[id]) {
        assistants[id] = normalizeAssistant(id, { ...base.assistants[id], ...patch.assistants[id] });
      }
    }
  }
  return normalize({ ...base, ...patch, assistants });
}

/**
 * True when `now` falls inside a quiet-hours window. Handles windows that wrap
 * past midnight (22:00 → 08:00).
 */
function inQuietHours(hours, now = new Date()) {
  if (!hours?.from || !hours?.to) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [fromH, fromM] = hours.from.split(':').map(Number);
  const [toH, toM] = hours.to.split(':').map(Number);
  const from = fromH * 60 + fromM;
  const to = toH * 60 + toM;
  return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

module.exports = {
  ASSISTANT_IDS,
  BATTERY_BEHAVIORS,
  CAPTURE_STATES,
  OCR_MODES,
  defaultAssistant,
  defaults,
  inQuietHours,
  merge,
  normalize,
};
