/* ── Assets ──────────────────────────────────────────────────────────
   Covers and page styles ship with the renderer. Journals store only the
   asset *name* (basename, no extension); URLs are resolved here at render
   time so the DB never holds build-specific paths.

   Shared by the shelf (JournalPanel) and the floating pop-out
   (JournalFloat), which mounts at the App root without the panel. */

import logger from '../../lib/logger';

const COVER_URLS = import.meta.glob('../../assets/covers/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const PAGE_URLS = import.meta.glob('../../assets/pages/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

function toAssetMap(globbed) {
  const map = {};
  for (const [path, url] of Object.entries(globbed)) {
    const name = path.split('/').pop().replace(/\.webp$/i, '');
    map[name] = url;
  }
  return map;
}

export const COVERS = toAssetMap(COVER_URLS);
export const PAGES = toAssetMap(PAGE_URLS);
export const COVER_NAMES = Object.keys(COVERS).sort();
export const PAGE_NAMES = Object.keys(PAGES).sort();

const reportedMissingAssets = new Set();

function reportMissingAsset(kind, name, context = {}) {
  if (typeof window === 'undefined' || !name) return;
  const reportKey = `${kind}:${name}`;
  if (reportedMissingAssets.has(reportKey)) return;
  reportedMissingAssets.add(reportKey);
  logger.error('journal.assets', `Journal ${kind} artwork is unavailable`, {
    assetName: name,
    journalId: context.journalId || null,
    surface: context.surface || 'unknown',
    effect: `The journal will use its ${kind} fallback instead of the selected artwork.`,
    result: 'Fallback',
    nextStep: `Restore ${name}.webp in src/assets/${kind}s, or choose another ${kind}.`,
  });
}

function assetUrl(map, kind, name, context) {
  if (!name) return undefined;
  const url = map[name];
  if (!url) reportMissingAsset(kind, name, context);
  return url;
}

export function getCoverUrl(name, context) {
  return assetUrl(COVERS, 'cover', name, context);
}

export function getPageUrl(name, context) {
  return assetUrl(PAGES, 'page', name, context);
}

if (typeof window !== 'undefined' && (!COVER_NAMES.length || !PAGE_NAMES.length)) {
  logger.error('journal.assets', 'Built-in Journal artwork catalog is incomplete', {
    coversFound: COVER_NAMES.length,
    pagesFound: PAGE_NAMES.length,
    effect: 'Journal creation choices and existing Journal artwork may appear blank.',
    result: 'Degraded',
    nextStep: 'Confirm the packaged renderer includes src/assets/covers and src/assets/pages.',
  });
}
