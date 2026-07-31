export const HEADER_DOCK_STYLES = Object.freeze({
  CURRENT: 'current',
  MACOS: 'macos',
  TABS: 'tabs',
});

export const HEADER_DOCK_STYLE_OPTIONS = Object.freeze([
  {
    id: HEADER_DOCK_STYLES.CURRENT,
    label: 'Ambient',
    description: 'The original briizOS icons, quiet until you reach for them.',
  },
  {
    id: HEADER_DOCK_STYLES.MACOS,
    label: 'macOS Dock',
    description: 'A tactile icon shelf with magnification and active dots.',
  },
  {
    id: HEADER_DOCK_STYLES.TABS,
    label: 'Skeuomorphic Tabs',
    description: 'Folder-shaped controls joined to the header edge.',
  },
]);

const HEADER_DOCK_STYLE_STORAGE_KEY = 'briizos.headerDockStyle';
const VALID_HEADER_DOCK_STYLES = new Set(Object.values(HEADER_DOCK_STYLES));

export function normalizeHeaderDockStyle(value) {
  return VALID_HEADER_DOCK_STYLES.has(value) ? value : HEADER_DOCK_STYLES.CURRENT;
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
