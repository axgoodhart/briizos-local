# UNDERSTANDING-1 — Project Orientation

## Project name

**briizOS** (this pass targets the `briizOS.local` deployment — the Electron desktop build).

Per `briizOS/CLAUDE.md`: "briizOS is a single project with two deployments that communicate with each other" — `briizOS.local` (Electron desktop) and `briizOS.Web` — sharing a common Firestore SyncContract.

## Project purpose

An AI-assisted workspace "desktop OS". The user sees a custom header, a retractable Control Bar of tool toggles, and a tile-based main layout (`Panel`/`TileLayout`) hosting panels (sources, chat interaction, tasks, action deck). On top of that sits a fleet of overlays (BriiZtorm 3D view, ActionDeck, Organizer, Calendar, LiveCanvas, Dashboard/Settings, NotesWidget). An onboard AI assistant (via `useChat` + `briizos-tools.js` + `useToolBridge`) can read and mutate the workspace through a tool-call pipeline.

## Tech stack

- **Runtime**: Electron 40 desktop shell wrapping a Vite 6 / React 18 renderer.
- **UI**: React 18, hand-rolled CSS with `--theme-…` custom-property tokens, `react-resizable-panels` for the tile layout, GSAP for motion, `react-dnd` for drag/drop, `@react-three/*` + `three` for BriiZtorm, `face-api.js`, `ogl`.
- **AI**: `openai` SDK, plus an in-repo LangGraph-style agent worker (`src/hooks/useAgentWorkers.js`, `src/lib/briizos-tools.js`, `src/lib/tools.js`, `src/lib/system-prompt.js`). The AI fires `briizos-canvas` DOM events to open/update the LiveCanvas.
- **Persistence**: Firebase Firestore (`src/lib/firebase.js`, `src/lib/firestore.js`, `src/lib/syncAdapters.js`) under a `users/{uid}/panels|tasks|events|organizer|desktop*` schema shared with briizOS.Web. Desktop-only collections live under `desktop*`.
- **Build**: `vite.config.js`, `electron/main.js` (Electron main process + IPC). There is also a `scripts/generate-tool-catalog.mjs` for AI tool catalog generation.

## Design / aesthetic

Dark, glassy, cyan-teal tinted "sci-fi OS" UI. Components lean on `backdrop-filter: blur(...)`, translucent black backgrounds, cyan/teal accent borders, and SF-Symbols-style glyphs in `cb-icon` buttons. Themeable via CSS custom properties of the form `--theme-components-<area>-<component>-<prop>-<hash>`. NotesWidget does fancy per-quadrant 3D border/shadow warping. ActionDeck supports docked (column) and floating (torn-off) modes. LiveCanvas is a draggable floating window with an iframe body that hosts sandboxed HTML/CSS/JS.

## File organization (relevant to this pass)

```
briizOS/briizOS.local/
├── CLAUDE.md                         # .local project rules (read-only pointer to parent)
├── package.json                      # vite + electron + react + firebase + openai
├── electron/                         # Electron main process and preload
├── index.html                        # root HTML shell
├── vite.config.js                    # Vite config
├── public/
│   └── apps/briiztorm                # static external apps (non-React)
└── src/
    ├── App.jsx                       # top-level app: header, ControlBar mount,
    │                                 #   TileLayout mount, overlay/modal mounts,
    │                                 #   keyboard shortcuts, canvas event bridge
    ├── App.css
    ├── main.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── ChatSettingsContext.jsx
    │   ├── OrganizerContext.jsx
    │   └── ToolContext.jsx           # wires briizos-tools to layout + appContext
    ├── hooks/
    │   ├── useLayout.js              # tile layout state, workspace persistence
    │   ├── useAppContext.js
    │   ├── useAgentWorkers.js        # background AI workers
    │   ├── useToolBridge.js          # maps AI tool calls to real handlers
    │   └── useChat.js                # chat pipeline
    ├── lib/
    │   ├── briizos-tools.js          # exposes setBriizToolsContext({ appContext, layoutHook })
    │   ├── tools.js                  # concrete tool handlers
    │   ├── firestore.js              # panels/tasks/events/organizer CRUD + subscribe
    │   ├── syncAdapters.js           # normalize/denormalize for SyncContract
    │   ├── system-prompt.js          # AI system prompt assembly
    │   └── logger.js                 # renderer logger (everything must log)
    └── components/
        ├── controlbar/
        │   ├── ControlBar.jsx        # horizontal toggle bar (briiZtorm, ActionDeck,
        │   │                         #   Organizer, Calendar, Notes)
        │   ├── ControlBar.css
        │   └── index.js
        ├── layout/
        │   ├── TileLayout.jsx        # row-of-columns-of-stacks panel layout
        │   ├── Panel.jsx
        │   ├── layout.css
        │   └── index.js
        ├── overlays/
        │   ├── BriiztormOverlay.{jsx,css}
        │   ├── ActionDeckColumn.{jsx,css}   # floating/docked mix pattern
        │   ├── CalendarModal.{jsx,css}
        │   ├── OrganizerModal.{jsx,css}
        │   ├── DashboardOverlay.{jsx,css}   # replaces settings modal
        │   ├── LiveCanvas.{jsx,css}         # draggable iframe canvas host
        │   └── index.js
        ├── notes/
        │   ├── NotesWidget.{jsx,css}        # floating/drawer notes, Firestore-backed
        │   └── index.js
        ├── bfast/
        │   └── BfastBundle.jsx              # toasts, snackbars, intent holds
        ├── InteractionPanel.jsx             # chat panel (AI I/O)
        ├── SourcesPanel.jsx
        ├── TasksPanel.jsx
        ├── LogPanel.jsx                     # mandatory log destination
        └── SettingsModal.jsx
```

### Key patterns the plan must respect

- **Everything logs.** `briizOS/CLAUDE.md` §1 mandates every meaningful action log through `src/lib/logger.js` and appear in `LogPanel`. New features must hook the logger.
- **SyncContract compliance.** Any new persisted state goes through `firestore.js` + `syncAdapters.js` and must map cleanly to the shared `users/{uid}/panels|organizer|tasks|events|desktop*` schema. Panels are the native "thing with visual state" unit; organizer items are their metadata shadow.
- **Workspace persistence pattern.** `App.jsx` already uses `layoutRow.workspace.*` via `useLayout().updateWorkspace(...)` to persist overlay-open flags (`notesOpen`, `actionDeckFloating`, `controlBarOpen`) and the notes drawer pos/size. New floating-container state should ride the same rail.
- **Canvas event pattern.** The existing AI → canvas bridge is a `window.dispatchEvent(new CustomEvent('briizos-canvas', { detail: { action, title, data }}))` handled by `App.jsx`. That is the template for AI-authored UI surfaces.
- **Overlay vs panel split.** Control-bar-toggled overlays live in `src/components/overlays/`; tile-layout-native things live as panels in `TileLayout`. ActionDeck is the existing example of a component that can be both docked (as a layout panel) and floating (as an overlay) at once.
- **Control Bar's `+` button does not yet exist.** Today the Control Bar has exactly 5 toggles (briiZtorm, ActionDeck, Organizer, Calendar, Notes) rendered in a flex row. There is no "+" button and no folder-window concept yet.
