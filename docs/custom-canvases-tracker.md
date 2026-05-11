# Custom Canvases — Implementation Tracker

> Generated 2026-04-20. Source: codebase audit of briizOS.local.

---

## Implemented

| Area | Detail | Files |
|------|--------|-------|
| **CRUD operations** | Create, list, load, delete, rename canvases via IPC | `electron/main.js`, `electron/preload.js`, `src/hooks/useCanvases.js` |
| **Storage backend** | HTML files + `.meta.json` sidecars in `{appData}/briizOS/canvas/` | `electron/main.js`, `electron/agent-config.js` |
| **Metadata** | displayName, formFactor, source, createdAt, updatedAt per canvas | `useCanvases.js`, IPC handlers |
| **Creation flow** | 3-source wizard: AI scaffold, custom HTML/CSS/JS, URL iframe | `NewCanvasFlow.jsx` |
| **Float form factor** | Draggable overlay window rendering canvas in sandboxed iframe | `LiveCanvas.jsx`, `LiveCanvas.css` |
| **Tile form factor** | Canvas rendered as a panel tile in the layout grid | `CanvasTile.jsx`, panel case `'canvas'` in `App.jsx` |
| **Hybrid form factor** | Opens as both float + tile simultaneously; closing tile falls back to float | `App.jsx` (`handleOpenCanvas`, tile close handler) |
| **Popover library UI** | Card grid with empty state, loading state, create button | `CanvasesPopover.jsx`, `CanvasCard.jsx` |
| **Card context menu** | Rename, delete, form-factor picker on each card | `CanvasCard.jsx` |
| **Tool system** | 7 tools: openCanvas, updateCanvas, listCanvases, loadCanvas, deleteCanvas, renameCanvas, setCanvasFormFactor | `src/lib/tools.js` |
| **Event bridge** | `briizos-canvas` CustomEvent dispatched by tools, consumed by App | `tools.js` → `App.jsx` listener |
| **Keyboard shortcuts** | Cmd/Shift+V toggle live canvas, Cmd/Shift+K toggle library | `App.jsx` |
| **Workspace persistence** | `openCanvases` map saved/restored with layout workspace | `App.jsx` |
| **Iframe sandbox** | `allow-scripts allow-forms allow-same-origin` | `LiveCanvas.jsx`, `CanvasTile.jsx` |
| **Save from float** | Save button on LiveCanvas for canvases opened from popover | `LiveCanvas.jsx` |

---

## Bugs

| Bug | Status | Detail | Fix |
|-----|--------|--------|-----|
| **Tile panel lingers after delete** | FIXED | `handleDeleteCanvas` never called `removePanel` to tear down the tile from the layout tree. | Added `removePanel(panelId)` call before state cleanup. Uses `removePanel` (full removal) not `togglePanelVisibility` (which would just hide it). |
| **Float overlay persists on create-then-delete** | FIXED | Float cleanup already existed but depended on `floatingCanvas` ref being current. Now the entire delete path (panel + float + state) runs unconditionally. | Covered by the same `handleDeleteCanvas` rewrite. |
| **Rename orphans tile panel** | FIXED | When a canvas was renamed, `openCanvases` key was updated but the layout panel ID (`canvas:{oldFilename}`) was never swapped. Tile panel became a ghost referencing a nonexistent file. | `handleRenameCanvas` now calls `removePanel(old)` + `addPanel(new)` for tile/hybrid canvases, and updates `floatingCanvas` ref. |
| **Form-factor change leaves stale panels** | FIXED | Switching an open canvas from tile→float left the tile panel in the layout. Switching float→tile left the float overlay open. | `handleSetCanvasFormFactor` now diffs had/wants for both tile and float, adding or removing each independently. |
| **CSP blocks canvas site loading** | FIXED | Three layers conspired to break canvases: (1) `onHeadersReceived` in `electron/main.js` stamped the app's restrictive CSP onto every HTTP response including third-party sub-frames — external sites' scripts, fetches, and sub-resources all violated it. (2) `LiveCanvas.jsx` used `sandbox="allow-scripts"` without `allow-same-origin`, giving `srcDoc` iframes an opaque origin that blocks all network requests. (3) URL canvases nest an iframe-inside-an-iframe, and sandbox restrictions propagate downward. | `electron/main.js`: `onHeadersReceived` now only applies CSP to main frame and same-origin resources; third-party sub-frames keep their own CSP. `LiveCanvas.jsx`: sandbox changed to `allow-scripts allow-same-origin allow-forms` to match `CanvasTile.jsx`. |

---

## Explicitly Missing (stubbed in code)

| Area | Evidence | Location |
|------|----------|----------|
| **Widget form factor** | Shows toast "Widget mode — coming soon"; logged as stub | `App.jsx` lines 379-382, 445-446 |

---

## Inferred Missing

These are not referenced anywhere in canvas code and would be expected for a complete feature:

| Area | Rationale |
|------|-----------|
| **Search / filter** | Popover lists all canvases with no search input, filter, or sort controls. Unscalable past ~20 items. |
| **Duplicate canvas** | No copy/clone operation exists. Users must manually recreate. |
| **Export / import** | No way to share a canvas file outside the app or import one from disk. |
| **Canvas templates** | AI scaffold creates an empty placeholder. No pre-built template gallery. |
| **Edit existing canvas** | No in-app code editor for modifying a saved canvas's HTML/CSS/JS after creation. The only edit path is the AI `updateCanvas` tool. |
| **Version history / undo** | No snapshots or revision tracking. Overwrites are destructive. |
| **Canvas preview thumbnail** | Cards show title + form-factor badge only. No visual preview or screenshot. |
| **Error handling in iframes** | No crash boundary, load-error fallback, or infinite-loop protection for user-supplied JS. |
| **Canvas resize / dimensions** | Float window is fixed at 700×500. No per-canvas size memory or user-resizable presets. |
| **Drag-and-drop reorder** | Library list is sorted reverse-chronological with no manual ordering. |
| ~~**Lifecycle sync between state and layout**~~ | ~~FIXED — delete, rename, and form-factor change now explicitly sync `openCanvases` with `removePanel`/`addPanel`.~~ |
| **Confirmation on delete** | `deleteCanvas` tool requires confirmation, but the UI card menu does not appear to have a confirm step. |
| **Tests** | Zero test files for any canvas component, hook, or IPC handler. |
| **Documentation** | No user-facing docs or developer docs for the canvas system. |
| **Accessibility** | Popover has `role="dialog"` and `aria-label`, but cards/menus lack keyboard navigation, focus trapping, and screen-reader announcements. |
