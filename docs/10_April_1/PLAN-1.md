# PLAN-1 — Bird's-eye Plan

## Bird's-eye summary

This change introduces a **Projects** subsystem to `briizOS.local`: a Control-Bar-anchored folder popover that stores user- or AI-authored mini-apps, each of which can be mounted in the workspace as one of four form factors. The change adds a new control bar toggle, a new popover component, a new "create project" flow, a new Firestore CRUD slice, a new `project` panel type, a new `briizos-project` event bus, and AI tool hooks to read/write projects.

Architecturally, Projects is a fresh feature slice that borrows heavily from three existing patterns that already work in the codebase:

1. **Notes pattern** — for Firestore-backed lists of user items that persist across sessions (subscribe/upsert/delete, Organizer shadow, SyncContract adapter).
2. **LiveCanvas pattern** — for sandbox-iframed `{ html, css, js }` surfaces that render AI-authored or user-authored code.
3. **ActionDeck pattern** — for the Panel Tile / floating window hybrid form factor (the component accepts both `embedded` and `floating` modes and is mounted from two different places in `App.jsx`).

Nothing existing is removed. The Control Bar's current five toggles and their behaviors are untouched; a sixth toggle is added at the end of the row. The new popover lives in a new subdirectory `src/components/projects/`. Rendering a project uses a new generic `ProjectSurface` wrapper that delegates to the appropriate form-factor mount.

The popover is deliberately cheap: it is not draggable, not resizable, and always anchors under its Control Bar button via fixed positioning relative to the button's rendered rect.

## Affected files

### New files (create)

- `src/components/projects/ProjectsPopover.jsx` — the tooltip-like folder window; receives `anchorRect`, `isOpen`, `onClose`, `onOpenProject`, reads project list via `subscribeProjects`.
- `src/components/projects/ProjectsPopover.css` — popover styling (dark glassy, cyan-teal accent, tail pointer).
- `src/components/projects/ProjectCard.jsx` — per-project row/card in the popover (icon + name + form-factor badge + context menu).
- `src/components/projects/NewProjectFlow.jsx` — the two-step create modal (AI / code / URL → name).
- `src/components/projects/NewProjectFlow.css`
- `src/components/projects/ProjectSurface.jsx` — form-factor dispatcher; renders a Floating Window, Panel Tile content, Control Bar Widget, or Hybrid based on the project's `formFactor`.
- `src/components/projects/ProjectSurface.css`
- `src/components/projects/index.js` — barrel exports (`ProjectsPopover`, `ProjectSurface`, `NewProjectFlow`).
- `src/hooks/useProjects.js` — thin hook around `subscribeProjects`/`upsertProject`/`deleteProject` + open/close state per project (mirrors `useLayout.updateWorkspace` pattern for persistence of open state).

### Modified files

- `src/components/controlbar/ControlBar.jsx` — add a sixth `cb-toggle` button for Projects; receive `projectsOpen`, `onToggleProjects`; forward a ref to the button so `App.jsx` can compute the popover anchor rect.
- `src/components/controlbar/ControlBar.css` — add `#projects-icon` color/border styling and ensure the `+`-containing popover's parent doesn't clip.
- `src/components/controlbar/index.js` — unchanged (barrel is single-export).
- `src/App.jsx` — import and mount `ProjectsPopover`; add `projectsOpen`/`setProjectsOpen` state; add `onToggleProjects` wiring; add Escape handling; add keyboard shortcut `Cmd/Ctrl+Shift+P`; import and mount `ProjectSurface` instances for each currently-open floating/widget project; add a `project` case to `renderPanel` for panel-tile-mounted projects; add a `briizos-project` event listener analogous to the existing `briizos-canvas` handler for live AI updates.
- `src/components/layout/TileLayout.jsx` — no structural change; the `project` panel type is handled by `App.renderPanel`'s switch, so TileLayout itself is unchanged.
- `src/lib/firestore.js` — add `subscribeProjects(callback)`, `getProjects()`, `upsertProject(projectData)`, `deleteProject(projectId)`. Use the existing `panelsCol` with `type === 'project'` so web can see the docs too (cheap web reachability without new collection; follows the Notes precedent). Also update `getUserCollections` only if a new collection path is preferred (we're not adding one in PLAN-1).
- `src/lib/syncAdapters.js` — add a `projectAdapter` with `normalizeOnRead` and `prepareForWrite`, following `noteAdapter`'s shape. Canonical fields: `id`, `type='project'`, `title`, `formFactor`, `source` (`'ai' | 'code' | 'url'`), `html`, `css`, `js`, `externalUrl`, `ui.local.xywh`, `createdAt`, `updatedAt`. Strip legacy aliases. Mirror the note adapter's `ui.local.xywh` rule for positions.
- `src/lib/briizos-tools.js` — register three new tool names (`projects_list`, `projects_read`, `projects_write`) that call the new firestore helpers and dispatch `briizos-project` events when the project is open. Return results in the standard `{ ok, data }` / `{ ok: false, error }` shape the other tools use.
- `src/lib/tools.js` — wire the three tool handlers if tools.js is where dispatch happens (confirm in PLAN CHECK-5 by reading briizos-tools.js and tools.js end-to-end).
- `src/lib/logger.js` — no change. Just use `logger.info('projects', ...)` etc. from the new code; there is no need to register the category in advance.

## Step-by-step broad strokes

1. **Decide on Firestore shape.** Go with `panels` collection, `type='project'`. This matches the Notes precedent exactly, keeps briizOS.Web reachable automatically, and avoids touching `getUserCollections`. Confirm in PLAN CHECK-5 that there's no pre-existing panel type called `project`.
2. **Add `projectAdapter`** to `syncAdapters.js`, copying the structure of `noteAdapter` and renaming for project-specific canonical keys. Store positions of floating-mode projects at `ui.local.xywh` the same way notes do. Strip all flat aliases.
3. **Add Firestore helpers** in `firestore.js`: `subscribeProjects`, `getProjects`, `upsertProject`, `deleteProject`. Follow the exact skeleton of `subscribeNotes`/`upsertNote`/`deleteNote` including the paired Organizer item creation on new projects (for web reachability and SyncContract §4 compliance). Log every call through `logger`.
4. **Create `useProjects` hook** that wires `subscribeProjects` to local state and exposes `{ projects, createProject, renameProject, deleteProject, updateProjectContent, setFormFactor }`. Creation accepts `{ source, name }` and returns the new project id.
5. **Build `ProjectsPopover`**: a fixed-position absolutely-positioned `div` anchored under the Control Bar button via an `anchorRect` prop. Listens for outside clicks and Escape. Renders the list of `ProjectCard`s from `useProjects`. Shows an empty state with a large `+` CTA. Always renders a bottom-right floating `+` button that opens `NewProjectFlow`.
6. **Build `NewProjectFlow`**: two-step modal-ish component. Step 1 — three large buttons (AI / Code / URL). If URL, prompt for a URL in the same step. Step 2 — name input + Enter to confirm. On confirm, calls `createProject({ source, name, externalUrl? })`, closes the flow, and emits an `onCreated(projectId)` callback so the popover can immediately open the new project.
7. **Build `ProjectCard`**: name, icon, form-factor badge, click-to-open, right-click (or ⋯) menu with rename / change form factor / delete.
8. **Build `ProjectSurface`**: given a `project`, renders the correct form factor:
   - `floating` — a LiveCanvas-shaped draggable iframe (share `LiveCanvas.css` or duplicate the pieces we need into `ProjectSurface.css`).
   - `tile` — intentionally empty: TileLayout mounts this via `App.renderPanel` instead, so `ProjectSurface` is not used in tile mode.
   - `widget` — compact inline element rendered inside the Control Bar row.
   - `hybrid` — render both `tile` (when panel is present) and `floating` (when `floatingOpen` is true), matching the ActionDeck dual-mount pattern.
9. **Wire `ControlBar`**: add the new `cb-toggle` after Notes with a folder-style glyph; forward `buttonRef` up to App so the popover can measure its anchor. Add `#projects-icon` styling. Also allocate an inline slot for widget-form-factor projects to the right of the toggles (can be a bare `<div className="cb-widget-slot">{children}</div>`).
10. **Wire `App.jsx`**: add `projectsOpen`, `setProjectsOpen`; pass `onToggleProjects`; mount `ProjectsPopover` with an `anchorRect` computed from the ControlBar button ref; add `ProjectSurface` renders for each open floating/widget/hybrid-floating project; add the `project` case to `renderPanel`; add a `briizos-project` custom event listener that updates an in-memory cache of currently-open projects; add Escape handling; add `Cmd/Ctrl+Shift+P` shortcut.
11. **Persist open-state** via `updateWorkspace({ projectsOpen: false, projectOpenState: { [projectId]: { floating: true, tile: false } } })`. Always start `projectsOpen` closed per UNDERSTANDING-2 decision.
12. **Plumb AI tools** in `briizos-tools.js`: add `projects_list`, `projects_read`, `projects_write` handlers. `projects_write(id, patch)` calls `upsertProject`, then (if the project is open) dispatches `window.dispatchEvent(new CustomEvent('briizos-project', { detail: { projectId, patch }}))`. Add a matching listener in `App.jsx` that updates the rendered surface.
13. **Logger calls** on create, open, close, form-factor change, rename, delete, AI read, AI write. Category: `'projects'`.
14. **Manual smoke test checklist** (not code): run `npm run dev`, log in, click Projects toggle, verify popover appears under the button, create an AI project, create a code project, create a URL project, rename one, change one to Tile, change one to Hybrid, quit and relaunch, verify persistence.

## Data / state changes

- **New Firestore doc shape** on `users/{uid}/panels` where `type === 'project'`:
  ```
  {
    id: string,
    type: 'project',
    title: string,
    formFactor: 'widget' | 'float' | 'tile' | 'hybrid',
    source: 'ai' | 'code' | 'url',
    html: string,
    css: string,
    js: string,
    externalUrl: string,
    ui: { local: { xywh: {x,y,w,h} }, web: { xywh: {x,y,w,h} } },
    orgId: string,    // paired organizer item, like notes
    createdAt: number,
    updatedAt: serverTimestamp,
  }
  ```
- **New workspace keys** on `layoutRow.workspace` for persistence via existing `updateWorkspace`:
  - `projectsOpen` — always reset to `false` on session start (explicitly not persisted into open state).
  - `projectOpenState: { [projectId]: { floating, tile } }` — which projects are currently mounted and in what form.
- **New panel type** `project` handled by `renderPanel` in `App.jsx`. The existing `addPanel`/`togglePanelVisibility` from `useLayout` handle the rest without modification.
- **New custom DOM events**: `briizos-project` with `detail: { action: 'open' | 'update' | 'close', projectId, patch?, formFactor? }`.

## Risks / unknowns

- **Anchor-rect positioning** — the popover must stay glued under the Control Bar button even when the Control Bar is the hidden/collapsed state (`.closed`). Need to verify the Control Bar's positioning in the layout so a fixed-position popover lines up. Low risk, but needs a quick read of `layout.css` and the header CSS.
- **SyncContract compliance** — adding a new `type='project'` to the shared `panels` collection is something briizOS.Web will see. Per `briizOS/CLAUDE.md` §2 the contract must be honored. PLAN CHECK-5 must confirm that `SyncContract.md` in the parent folder either (a) already reserves a `project` type, or (b) that adding one doesn't conflict with existing type values. If it conflicts, fall back to a desktop-only collection `desktopProjects` keyed under `getUserCollections`.
- **AI tool catalog regen** — `scripts/generate-tool-catalog.mjs` may need to be re-run after adding tools. If it's a build-time generator, PLAN CHECK-5 must confirm whether it's automatic or manual.
- **Existing `project` namespace** — it is plausible that `briizos-tools.js` or `tools.js` already has project-shaped tool names. PLAN CHECK-5 needs to grep for `project` / `projects_` to avoid a collision.
- **ControlBar's current `#controlBar` wrapper** has two class forms (`controlBar closed` on the outer wrapper vs `control-bar open/closed` on the inner). I need to pick the right anchor ancestor; will inspect in PLAN CHECK-5.
- **`+` vs "command bar" phrasing** — the user's prompt says "a new command bar button should launch a tool-tip-like folder window" and separately says "The user, when clicking on the bottom right '+' button…". I am reading these as two distinct buttons, with the Control Bar button being an icon toggle (not a "+") and the `+` being inside the popover. If the user actually meant a single `+` button on the Control Bar, the plan still holds — only the icon glyph changes.
