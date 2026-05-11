# UNDERSTANDING-2 — End-state Task Understanding

## Restatement of the request

Add a new button to the `briizOS.local` Control Bar. When pressed, it opens a small "tooltip-like" folder window pinned directly underneath the button. The window is a browsable folder of **user-defined mini-apps** — canvases that were either authored by the onboard AI or hand-written by the user. Each item in the folder is a launchable, editable mini-app that can manifest in the workspace as one of four form factors: a Control Bar widget, a floating window, a Panel Tile, or a Panel Tile / floating window mix (the same hybrid pattern ActionDeck already uses).

Inside the folder window, a bottom-right "+" button creates a new mini-app. The creation flow asks the user up front what kind of starting point they want: **AI-authored**, **raw code the user types**, or **a loaded website URL** (the same mechanism used today for briizOS.Web externals). Then the user gives it a name; once confirmed, the new mini-app is saved into the folder and is immediately available to open, edit, or hand off to the onboard AI for further work.

The onboard AI has read/edit access to every item in the folder — it can read the contents, modify them in place, and use them as live surfaces for its own output.

## End-state UX description

### The new Control Bar button

The Control Bar grows a sixth toggle, to the right of Notes. Its icon is a folder/app-launcher glyph in the same SF-Symbol style as its neighbors, with a matching cyan-teal accent. Label (`.cb-label`): something short like **PROJECTS** or **APPS** (working name: **Projects**).

### The tooltip folder window

Clicking the new button opens a compact panel that appears **fixed to the Control Bar, anchored directly under the Projects toggle**. Visually it reads as a tool-tip / popover:

- A small arrow / tail points up to the triggering button.
- It does **not** cover the whole screen, and it is not draggable (the first release). It stays pinned to its button.
- Clicking anywhere outside it, or clicking the Projects toggle again, closes it.
- Press Escape closes it (same order as the other overlays).
- It has dark glassy styling consistent with ControlBar and LiveCanvas — `backdrop-filter: blur`, translucent black, cyan/teal 1px border, slight box-shadow.

Contents, top to bottom:

- A thin header bar with the title "Projects" and a subtle close-X.
- A scrollable grid / list of project cards — one per saved mini-app. Each card shows: icon (based on form factor), name, and a tiny badge for its form factor (Widget / Float / Tile / Hybrid). Right-clicking (or long-pressing) a card reveals **Open**, **Rename**, **Change form factor**, **Delete**.
- Clicking a card **opens / launches** the mini-app in whatever form factor it was last saved as.
- A pinned **"+"** button in the bottom-right corner of the popover, matching the cyan-teal accent language. Empty state of the window (no projects yet) also centers this "+" as the primary call to action, with a one-line helper "Create your first project".

### The "+" create flow

Pressing the "+" opens a tiny sub-popover / modal in front of the folder window with three large choices as the first step:

1. **Start with AI** — the project is born empty and the onboard AI is invited to scaffold it. The chat panel may focus or prefill with a stub prompt; the AI has write access via the existing canvas event pattern.
2. **Write your own code** — the project opens empty in the project's editor (code-first), giving the user raw HTML/CSS/JS fields to paste into.
3. **Load a website** — prompts for a URL and creates a project backed by an iframe pointing at that URL, identical to the briizOS.Web "externals" panel behavior.

After the user picks one, the flow asks for a **name** (single line, Enter to confirm). Once named:

- The project is saved to the folder (Firestore-backed under the user's account).
- The popover closes and the project card appears in the folder window, highlighted briefly.
- The new project is **opened in its default form factor** so the user can start editing immediately.

Default form factor on create is **floating window** (the lowest-friction surface, same as LiveCanvas). The user can change form factor afterward via the card's context menu.

### The four form factors

When a project is opened, it can take any of these shapes — all four share the same underlying `{ html, css, js, externalUrl }` data and just differ in how they mount:

- **Control Bar Widget** — a compact, live-rendered chip inside the Control Bar itself, to the right of the Projects button. Good for small status/ticker/timer-style widgets. Constrained height, full Control Bar width available.
- **Floating Window** — same draggable floating iframe box as LiveCanvas uses today. Movable, resizable. Default for new projects.
- **Panel Tile** — opens as a first-class panel inside `TileLayout`. Dockable, stackable, resizable alongside sources/interaction/tasks.
- **Panel Tile + Floating Window mix** — the ActionDeck pattern: can be a docked tile and a floating window at the same time, or toggle between them via a pop-out button.

### Onboard AI access

The onboard AI (running through `useChat` / `briizos-tools` / `useToolBridge`) gets three new tool-shaped affordances:

- `projects.list()` — lists the user's projects by id, name, form factor, and updated time.
- `projects.read(id)` — returns the project's current `{ html, css, js, externalUrl, formFactor, name }`.
- `projects.write(id, patch)` — merges a patch onto the project, updating Firestore and, if the project is currently open, live-updating its rendered surface (via the existing `briizos-canvas` event channel or a new sibling `briizos-project` event).

These are in scope to stub / plumb now; the full tool-catalog wiring can be completed in a follow-up if time is short.

### State across sessions

- The list of projects and their contents persist across sessions in Firestore under the user's account (new `users/{uid}/projects` subcollection, adhering to SyncContract shape).
- Whether the folder window is open at the time of close is **not** persisted — it always starts closed on a fresh session (matches how Organizer/Calendar behave today). The fact that individual projects may be *open* (e.g., a floating window was open when the user quit) should be persisted via the existing `layoutRow.workspace.*` pattern, the same way `notesOpen` and `actionDeckFloating` are today.

## In-scope behaviors

- A new Projects toggle in `ControlBar` with matching styling.
- A new `ProjectsFolder` popover anchored under that toggle, with close-on-outside-click and Escape.
- A `ProjectCard` list rendered from Firestore, with an empty state.
- A `NewProjectFlow` that asks {AI / Code / URL} → name → create.
- Firestore CRUD (`subscribeProjects`, `upsertProject`, `deleteProject`) in `src/lib/firestore.js`, backed by a new `users/{uid}/projects` subcollection, and the corresponding adapter entry in `src/lib/syncAdapters.js`.
- Workspace persistence of per-project "is open" state, consistent with how Notes/ActionDeck persist open-ness.
- At least two form factors working end-to-end in this pass: **Floating Window** (reusing LiveCanvas-style rendering) and **Panel Tile** (via `addPanel({ type: 'project', projectId, ... })`). The Control Bar Widget and Hybrid form factors can be stubbed with clearly-marked TODOs if they turn out to be bigger than expected.
- Logger entries for every meaningful action (create, rename, delete, open, change form factor, AI read/write).

## Out-of-scope / deferred

- Real-time collaborative editing between briizOS.Local and briizOS.Web for project contents (the SyncContract touch should just get us to eventual consistency; live collab is a separate effort).
- A full code editor with syntax highlighting inside the Floating Window form factor. A plain textarea per field (HTML / CSS / JS / URL) is acceptable for this pass; Monaco/CodeMirror can be added later.
- Advanced card management: tagging, search, grouping by form factor, drag-to-reorder.
- Import/export of projects to `.html` files.
- The three new AI tools being added to the catalog consumed by the model — plumbing them through `briizos-tools.js` and `generate-tool-catalog.mjs` is in scope, but prompt-tuning the AI to actually use them well is deferred.

## Open questions

1. **Folder window width.** How wide should the popover be? Proposing a fixed ~360px width × up to ~480px height with internal scroll.
2. **Where exactly should the "+" button sit in the Control Bar?** The user described *a new command bar button* that launches the folder; separately the user describes the "+" that lives inside the bottom-right of the folder window. I'm reading these as two distinct buttons (the outer Projects toggle on the Control Bar; the inner "+" in the folder popover). Confirming that interpretation.
3. **Default form factor on open** after creation: I'm proposing Floating Window. OK?
4. **Where does the Control Bar Widget physically render** when a project chooses that form factor? Proposing: an inline slot to the right of the existing toggles, with max-width and horizontal overflow scroll if multiple widgets are active. This should be reviewed.

I will proceed on the assumptions above and call these out again in PLAN-2 so they can be revisited cheaply.
