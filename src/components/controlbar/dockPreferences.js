import logger from '../../lib/logger.js';

export const HEADER_DOCK_STYLES = Object.freeze({
  CURRENT: 'current',
  MACOS: 'macos',
  TABS: 'tabs',
});

export const HEADER_DOCK_ORIENTATIONS = Object.freeze({
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
});

/* The Control Bar launcher is structural: it opens the editor for the rest of
   the header dock, so it always stays first. Every other item is optional and
   can be arranged from the expanded Control Bar. */
export const HEADER_DOCK_ITEM_IDS = Object.freeze([
  'controlBar',
  'chat',
  'briiztorm',
  'organizer',
  'calendar',
  'media',
  'notes',
  'canvases',
  'journal',
  'island',
  'notefalls',
  'sources',
  'tasks',
]);

// New panel launchers live in Ctrl Bar first. They only enter the compact
// header dock after someone explicitly pins them with its + control.
export const DEFAULT_HEADER_DOCK_ITEMS = Object.freeze([
  'controlBar',
  'chat',
  'briiztorm',
  'organizer',
  'calendar',
  'media',
  'notes',
  'canvases',
]);

export const HEADER_DOCK_STYLE_OPTIONS = Object.freeze([
  {
    id: HEADER_DOCK_STYLES.CURRENT,
    label: 'Ambient',
    description: 'Inactive items blur into the background.',
  },
  {
    id: HEADER_DOCK_STYLES.MACOS,
    label: 'App Dock',
    description: 'A familiar icon shelf with magnification and active dots.',
  },
  {
    id: HEADER_DOCK_STYLES.TABS,
    label: 'Skeuomorphic Tabs',
    description: 'Clear separation via foregrounded active tabs.',
  },
]);

const HEADER_DOCK_STYLE_STORAGE_KEY = 'briizos.headerDockStyle';
const HEADER_DOCK_ORIENTATION_STORAGE_KEY = 'briizos.headerDockOrientation';
const HEADER_DOCK_ITEMS_STORAGE_KEY = 'briizos.headerDockItems';
const VALID_HEADER_DOCK_STYLES = new Set(Object.values(HEADER_DOCK_STYLES));
const VALID_HEADER_DOCK_ORIENTATIONS = new Set(Object.values(HEADER_DOCK_ORIENTATIONS));
const VALID_HEADER_DOCK_ITEMS = new Set(HEADER_DOCK_ITEM_IDS);

export function normalizeHeaderDockStyle(value) {
  return VALID_HEADER_DOCK_STYLES.has(value) ? value : HEADER_DOCK_STYLES.CURRENT;
}

export function normalizeHeaderDockOrientation(value) {
  return VALID_HEADER_DOCK_ORIENTATIONS.has(value)
    ? value
    : HEADER_DOCK_ORIENTATIONS.HORIZONTAL;
}

export function normalizeHeaderDockItems(value) {
  const requested = Array.isArray(value) ? value : DEFAULT_HEADER_DOCK_ITEMS;
  const seen = new Set();
  const optionalItems = requested.filter((id) => {
    if (id === 'controlBar' || !VALID_HEADER_DOCK_ITEMS.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return ['controlBar', ...optionalItems];
}

export function getStoredHeaderDockStyle() {
  if (typeof window === 'undefined') return HEADER_DOCK_STYLES.CURRENT;

  try {
    return normalizeHeaderDockStyle(window.localStorage.getItem(HEADER_DOCK_STYLE_STORAGE_KEY));
  } catch {
    return HEADER_DOCK_STYLES.CURRENT;
  }
}

export function persistHeaderDockStyle(value) {
  const normalized = normalizeHeaderDockStyle(value);
  if (typeof window === 'undefined') return normalized;

  try {
    window.localStorage.setItem(HEADER_DOCK_STYLE_STORAGE_KEY, normalized);
  } catch {
    // The live preference still works when storage is unavailable.
  }

  return normalized;
}

export function getStoredHeaderDockOrientation() {
  if (typeof window === 'undefined') return HEADER_DOCK_ORIENTATIONS.HORIZONTAL;

  try {
    return normalizeHeaderDockOrientation(window.localStorage.getItem(HEADER_DOCK_ORIENTATION_STORAGE_KEY));
  } catch {
    return HEADER_DOCK_ORIENTATIONS.HORIZONTAL;
  }
}

export function persistHeaderDockOrientation(value) {
  const normalized = normalizeHeaderDockOrientation(value);
  if (typeof window === 'undefined') return normalized;

  try {
    window.localStorage.setItem(HEADER_DOCK_ORIENTATION_STORAGE_KEY, normalized);
  } catch {
    // The live preference still works when storage is unavailable.
  }

  return normalized;
}

export function getStoredHeaderDockItems() {
  if (typeof window === 'undefined') return [...DEFAULT_HEADER_DOCK_ITEMS];

  try {
    const raw = window.localStorage.getItem(HEADER_DOCK_ITEMS_STORAGE_KEY);
    const requested = raw ? JSON.parse(raw) : DEFAULT_HEADER_DOCK_ITEMS;
    const renamed = Array.isArray(requested) && requested.includes('forest')
      ? requested.map((id) => id === 'forest' ? 'island' : id)
      : requested;
    const normalized = normalizeHeaderDockItems(renamed);
    if (renamed !== requested) {
      window.localStorage.setItem(HEADER_DOCK_ITEMS_STORAGE_KEY, JSON.stringify(normalized));
      logger.info('ui.preferences', 'Updated the saved Control Bar shortcut to the Islands name');
    }
    return normalized;
  } catch {
    return [...DEFAULT_HEADER_DOCK_ITEMS];
  }
}

export function persistHeaderDockItems(value) {
  const normalized = normalizeHeaderDockItems(value);
  if (typeof window === 'undefined') return normalized;

  try {
    window.localStorage.setItem(HEADER_DOCK_ITEMS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The live dock still works when storage is unavailable.
  }

  return normalized;
}
