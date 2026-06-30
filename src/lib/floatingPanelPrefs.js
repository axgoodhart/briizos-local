export const PANEL_FILTER_LIMITS = Object.freeze({
  hueRotate: { min: 0, max: 360 },
  saturation: { min: 0, max: 200 },
  sepia: { min: 0, max: 100 },
  contrast: { min: 50, max: 200 },
});

export const PANEL_START_AS_OPTIONS = Object.freeze({
  TILE: 'layout-tile',
  FLOATING: 'floating-panel',
  LAST_USE: 'last-use',
});

export const PANEL_VIEW_OPTIONS = Object.freeze({
  TILE: 'layout-tile',
  FLOATING: 'floating-panel',
});

export const DEFAULT_PANEL_FILTERS = Object.freeze({
  hueRotate: 0,
  saturation: 100,
  sepia: 0,
  contrast: 100,
});

export const DEFAULT_ACTIONDECK_PANEL_SETTINGS = Object.freeze({
  filters: DEFAULT_PANEL_FILTERS,
  startAs: PANEL_START_AS_OPTIONS.TILE,
  lastUsedView: PANEL_VIEW_OPTIONS.TILE,
  pinToCurrentLocation: false,
  pinnedPosition: null,
  headerBg: '',
});

export const DEFAULT_CANVAS_PANEL_SETTINGS = Object.freeze({
  filters: DEFAULT_PANEL_FILTERS,
  startAs: PANEL_START_AS_OPTIONS.LAST_USE,
  lastUsedView: PANEL_VIEW_OPTIONS.FLOATING,
  pinToCurrentLocation: false,
  pinnedPosition: null,
  headerBg: '',
});

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.round(numeric), min), max);
}

function normalizePosition(position) {
  if (!position || typeof position !== 'object') return null;
  const x = Number(position.x);
  const y = Number(position.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.round(x), y: Math.round(y) };
}

function normalizeFilters(filters = {}, fallback = DEFAULT_PANEL_FILTERS) {
  return {
    hueRotate: clampNumber(
      filters.hueRotate,
      PANEL_FILTER_LIMITS.hueRotate.min,
      PANEL_FILTER_LIMITS.hueRotate.max,
      fallback.hueRotate
    ),
    saturation: clampNumber(
      filters.saturation,
      PANEL_FILTER_LIMITS.saturation.min,
      PANEL_FILTER_LIMITS.saturation.max,
      fallback.saturation
    ),
    sepia: clampNumber(
      filters.sepia,
      PANEL_FILTER_LIMITS.sepia.min,
      PANEL_FILTER_LIMITS.sepia.max,
      fallback.sepia
    ),
    contrast: clampNumber(
      filters.contrast,
      PANEL_FILTER_LIMITS.contrast.min,
      PANEL_FILTER_LIMITS.contrast.max,
      fallback.contrast
    ),
  };
}

export function normalizePanelSettings(raw = {}, fallback = DEFAULT_ACTIONDECK_PANEL_SETTINGS) {
  const startAsValues = Object.values(PANEL_START_AS_OPTIONS);
  const viewValues = Object.values(PANEL_VIEW_OPTIONS);

  return {
    filters: normalizeFilters(raw.filters, fallback.filters || DEFAULT_PANEL_FILTERS),
    startAs: startAsValues.includes(raw.startAs) ? raw.startAs : fallback.startAs,
    lastUsedView: viewValues.includes(raw.lastUsedView) ? raw.lastUsedView : fallback.lastUsedView,
    pinToCurrentLocation: Boolean(raw.pinToCurrentLocation),
    pinnedPosition: normalizePosition(raw.pinnedPosition),
    headerBg: typeof raw.headerBg === 'string' ? raw.headerBg : fallback.headerBg,
  };
}

export function buildPanelFilter(filters = DEFAULT_PANEL_FILTERS) {
  const normalized = normalizeFilters(filters, DEFAULT_PANEL_FILTERS);
  return [
    `hue-rotate(${normalized.hueRotate}deg)`,
    `saturate(${normalized.saturation}%)`,
    `sepia(${normalized.sepia}%)`,
    `contrast(${normalized.contrast}%)`,
  ].join(' ');
}

export function resolvePanelStartView(settings, fallback = PANEL_VIEW_OPTIONS.TILE) {
  const normalized = normalizePanelSettings(settings, {
    ...DEFAULT_ACTIONDECK_PANEL_SETTINGS,
    lastUsedView: fallback,
  });

  if (normalized.startAs === PANEL_START_AS_OPTIONS.LAST_USE) {
    return normalized.lastUsedView || fallback;
  }
  if (normalized.startAs === PANEL_START_AS_OPTIONS.FLOATING) {
    return PANEL_VIEW_OPTIONS.FLOATING;
  }
  return PANEL_VIEW_OPTIONS.TILE;
}

export function loadPanelSettings(storageKey, fallback = DEFAULT_ACTIONDECK_PANEL_SETTINGS) {
  return panelSettingsCache.get(storageKey) || normalizePanelSettings({}, fallback);
}

export function savePanelSettings(storageKey, settings, fallback = DEFAULT_ACTIONDECK_PANEL_SETTINGS) {
  const normalized = normalizePanelSettings(settings, fallback);
  panelSettingsCache.set(storageKey, normalized);
  if (storageKey === 'briizos.actiondeck.panel-settings') {
    window.api?.localData?.settings?.set('actiondeck_panel_settings', normalized).catch(() => {});
  }
}

const panelSettingsCache = new Map();

export async function hydratePanelSettings(storageKey, fallback = DEFAULT_ACTIONDECK_PANEL_SETTINGS) {
  if (storageKey !== 'briizos.actiondeck.panel-settings') return loadPanelSettings(storageKey, fallback);
  try {
    const saved = await window.api?.localData?.settings?.get('actiondeck_panel_settings');
    const normalized = normalizePanelSettings(saved?.value || {}, fallback);
    panelSettingsCache.set(storageKey, normalized);
    return normalized;
  } catch {
    return normalizePanelSettings({}, fallback);
  }
}
