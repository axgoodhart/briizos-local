# PLAN-2 — Devil's Advocate Plan Check

Two passes over PLAN-1: is this the best way, and is there a smaller-footprint way?

## Pass 1 — Is PLAN-1 the best way?

### Alternative A: one monolithic `ProjectsPanel` inside `TileLayout`

Instead of a Control Bar popover, register a `projects` panel type in `TileLayout` that shows the project grid as a dockable panel. Less UI surface. Already fits the layout system.

- *Pros*: zero new positioning math, no popover, no anchor-rect wiring, persists naturally via `layoutRow`.
- *Cons*: **fatally ignores the user's core UX instruction.** The user explicitly asked for a "tool-tip-like folder window, fixed to appear right underneath the button itself." A dockable panel is not a tooltip under a button. It's the wrong affordance.
- *Verdict*: reject. The whole point of the request is the anchored popover feel.

### Alternative B: Organizer Modal gets a new tab

Add a "Projects" tab to the existing `OrganizerModal` so projects live alongside events/notes/tasks, all reached via the Organizer button.

- *Pros*: reuses an existing modal, zero new Control Bar real estate.
- *Cons*: The Organizer is already doing a lot (projects/categories/externals tab, per the `OrganizerModal` code). Stuffing app-launcher behavior into it breaks its mental model — Organizer is about metadata; Projects is about launchable code surfaces. Also the user specifically wants a new Control Bar button and a tooltip popover, not a modal.
- *Verdict*: reject. Wrong home.

### Alternative C: no custom popover — use a `<details>`/`<dialog>` element

Use the native `<dialog>` element with a manually computed `left/top` and `::backdrop`.

- *Pros*: browser-native behavior, less state to manage.
- *Cons*: `<dialog>` wants to be modal-ish and doesn't play nicely with "anchored to a trigger". Styling the backdrop gets messy. Electron compatibility is fine, but the cost of fighting the element's default behavior exceeds the benefit.
- *Verdict*: reject.

### Alternative D: make projects a first-class `addPanel({ type: 'project' })` and skip the popover entirely

Instead of a folder UI at all, every project is always a panel; the project list is just "the panels panel."

- *Pros*: ultra-minimal — no popover, no new layer.
- *Cons*: conflates panel management with project management, and the user is clear that (1) the folder is the home base, (2) projects can *also* be widgets, floats, or hybrids — not just panels. Also gives no place for the "+ create flow" to live.
- *Verdict*: reject.

### Alternative E: Floating Window only, no Panel Tile / Widget / Hybrid in this pass

Do the folder and the create flow, but only ship the Floating Window form factor in this pass; stub the others.

- *Pros*: half the code, same user-visible win on the headline feature.
- *Cons*: the user specifically listed all four form factors. Shipping only one means the next session has to rewire the surface rendering. But Panel Tile is very cheap because `addPanel` already exists, and Hybrid is literally the ActionDeck pattern. The marginal cost of Tile + Hybrid is low enough that it's worth keeping in scope. Widget is the expensive one and is a good candidate for a stub with a TODO.
- *Verdict*: **partially adopt** — keep Float + Tile + Hybrid in scope, stub Widget with a clear TODO and a placeholder "Widget mode is coming soon" message.

### Conclusion of Pass 1

PLAN-1 is the right overall shape. Only Alternative E has merit, and it converts into a scope tightening (stub the Widget form factor) rather than a rewrite.

## Pass 2 — Smaller-footprint approach

### Shrink 1: reuse `LiveCanvas.jsx` instead of cloning it into `ProjectSurface`

`LiveCanvas.jsx` is already a draggable iframe window that accepts `{ canvasData: { html, css, js } }`, `title`, `isOpen`, `onClose`. The Floating Window form factor is exactly this. Instead of building a new draggable iframe box inside `ProjectSurface.jsx`, render `<LiveCanvas ... />` for floating-form-factor projects directly.

- *Benefit*: kills ~120 lines of planned CSS/JSX and inherits all the bug fixes LiveCanvas has already accumulated.
- *Cost*: none — LiveCanvas already takes exactly the shape of data projects store.
- *Adopt*: yes.

### Shrink 2: there is no `ProjectSurface` at all

Follow from Shrink 1: if Floating is `<LiveCanvas />`, Tile is `addPanel({ type: 'project' })` routed through `renderPanel`, Widget is a stub, and Hybrid is "both at once," then `ProjectSurface` has nothing left to do — it degenerates into a switch in `App.jsx`. Delete `ProjectSurface.jsx` and `ProjectSurface.css` from the plan. For Tile mode, `renderPanel` returns a new small component `ProjectTile` that renders an iframe from the project's data. For Widget, return a "coming soon" stub. For Hybrid, mount both a `ProjectTile` via the layout and a `<LiveCanvas />` via the overlay list.

- *Benefit*: kills two files and a dispatcher.
- *Cost*: small — a `ProjectTile.jsx` component is still needed for panel-mounted projects, but it's ~40 lines (iframe + minimal header + logger).
- *Adopt*: yes.

### Shrink 3: projects go in a desktop-only collection (not `panels`)

PLAN-1 proposes reusing the `panels` collection with `type='project'` to inherit the Notes pattern. But projects store code (`html`/`css`/`js`), which is unlike anything on `panels` today and could be large. And the SyncContract risk is real — webpage-side code would see a new `type` value and might misinterpret it.

Alternative: add a desktop-only collection `desktopProjects` to `getUserCollections`. Desktop-only means no shared-web collision, no Organizer-shadow requirement, and `projectAdapter` gets simpler (no `ui.web.xywh` seeding).

- *Benefit*: SyncContract surface area is zero; web is unaffected; adapter code shrinks by ~30%; avoids the PLAN CHECK-5 risk around existing `project` type namespaces in `panels`.
- *Cost*: briizOS.Web cannot see projects (the user will need a future follow-up to expose them to web). The user said "ready to be edited" — they did not explicitly require web visibility. Web-visibility for projects can be Phase 2.
- *Adopt*: **yes**. This is a meaningful scope reduction.

### Shrink 4: no paired `orgId` creation

Notes paired Organizer items exist for SyncContract §4 web reachability. If projects are desktop-only (Shrink 3), there is no reason to create a paired organizer item per project. The `upsertProject` helper gets ~30 lines shorter.

- *Adopt*: yes.

### Shrink 5: reuse the existing `briizos-canvas` event bus, don't invent `briizos-project`

LiveCanvas already listens (via `App.jsx`) for `briizos-canvas` events. If a project's open form factor is Floating Window, we're *literally* rendering a `<LiveCanvas>` and can push updates through the existing event. The only extra behavior is that project updates also need to be persisted to Firestore, which the AI tool handler can do on the way through without involving the event bus at all.

- *Benefit*: no new DOM event, no new listener.
- *Cost*: Tile and Hybrid mounts would need their own update path. But Tile is an iframe re-rendered from React state — if the `useProjects` hook is the source of truth and listens to Firestore, any AI-driven change to project content will trip a Firestore snapshot and re-render the tile automatically.
- *Adopt*: yes. Kill `briizos-project` from the plan.

### Shrink 6: skip `useProjects` as a separate hook

`NotesWidget` inlines its own `subscribeNotes` call and manages state locally; it does not use a hook. The same approach for projects means one less file (`useProjects.js`). Pull the subscription logic into `ProjectsPopover` or a colocated `projectsState.js` helper.

- *Benefit*: one fewer file in `hooks/`, less indirection.
- *Cost*: `App.jsx` also needs to know about projects (for rendering open floaters and tiles). Two subscribers is ugly. **Counter-argument wins — keep `useProjects` as a single source of truth and consume it in both `App.jsx` and `ProjectsPopover`.**
- *Do not adopt*.

### Shrink 7: put the Projects popover inside `ControlBar.jsx` itself

Instead of mounting `ProjectsPopover` from `App.jsx`, mount it as a child of the `.cb-toggle` button in `ControlBar.jsx`. No anchor rect math.

- *Benefit*: zero positioning code — the popover is just `position: absolute; top: 100%; right: 0` on a `position: relative` button container.
- *Cost*: the popover can get clipped by the `.controlBar.closed` parent (which uses `max-height: 0` transitions). Mitigation: render the popover inside a portal that's still a sibling of the button in the DOM but escapes the clip via `overflow: visible` + high z-index. Or just accept that the popover is only visible when the Control Bar is open (which is fine, because the trigger button is in the Control Bar).
- *Adopt*: yes, with caveat — make the popover a sibling of the button container in the ControlBar tree, `position: absolute; top: calc(100% + 8px); left: <centered-under-button>`, z-index: 1000, and set the parent `.controlBar` wrapper to `overflow: visible` in the not-closed state. This removes all anchor-rect calculation from `App.jsx`.
- *Net effect*: `App.jsx` still owns `projectsOpen` state (so Escape can close it), but the popover JSX and positioning live in `ControlBar.jsx`.

## Verdict

PLAN-1 stands as the overall architecture. Adopt the following amendments:

1. **Stub Widget form factor** (Pass 1 Alternative E). Keep Float, Tile, and Hybrid real. Widget renders "Widget mode coming soon" with a TODO.
2. **Delete `ProjectSurface.jsx` / `.css`** from the plan (Shrink 2). Use `LiveCanvas` for Float; a new `ProjectTile.jsx` for Tile; a literal stub for Widget; dual-mount for Hybrid.
3. **Use a desktop-only `desktopProjects` collection** (Shrink 3). Update `getUserCollections` in `firestore.js`. Keep `projectAdapter` in `syncAdapters.js` but drop the `ui.web.xywh` seeding and the organizer pairing.
4. **No paired `orgId`** for projects (Shrink 4).
5. **No new `briizos-project` DOM event** (Shrink 5). AI writes go directly to Firestore via `upsertProject`, and the UI re-renders from the snapshot subscription.
6. **Popover lives inside `ControlBar.jsx`** (Shrink 7). No anchor-rect calculations in `App.jsx`; `App.jsx` only owns the `projectsOpen` boolean state and the open-project list.

These amendments remove three files (`ProjectSurface.jsx`, `ProjectSurface.css`, and the new event bus listener) and roughly 150 lines of planning-layer code while preserving every user-facing capability in UNDERSTANDING-2 except Widget form factor, which is stubbed.

Carry these amendments into PLAN CHECK-5.
