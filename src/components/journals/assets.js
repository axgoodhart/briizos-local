/* ── Assets ──────────────────────────────────────────────────────────
   Covers and page styles ship with the renderer. Journals store only the
   asset *name* (basename, no extension); URLs are resolved here at render
   time so the DB never holds build-specific paths.

   Shared by the shelf (JournalPanel) and the floating pop-out
   (JournalFloat), which mounts at the App root without the panel. */

const COVER_URLS = import.meta.glob('./assets/covers/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const PAGE_URLS = import.meta.glob('./assets/pages/*.webp', {
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
