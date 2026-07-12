# briizOS — Implementation Status & Path Forward

*Audit date: 2026-07-12. Scope per request: what's unimplemented, how well the database is integrated, and how deeply the AI is wired into the data scheme. Security and performance were deliberately excluded.*

---

## Executive summary

briizOS is more real than most projects at this stage. The core productivity loop — chat, tasks, agent automation, organizer/calendar, journals, media, canvases, stylofact, and memory — is genuinely built and wired end-to-end through a disciplined SQLite service layer. The gap between what it purports and what it delivers lives in three places: **cloud sync covers only 3 of ~15 data domains**, **the AI agent is nearly blind to the app's own state** (it cannot see your theme, journals, media, or most of the schema), and **an abandoned theme-consolidation effort** left fragmented artifacts behind.

The single most important finding for your goals: the database is well-integrated with the *frontend*, but the *AI is not integrated with the database*. The agent can create notes, tasks, and calendar events and touch the real filesystem — and almost nothing else. It receives no snapshot of current app state when a conversation starts.

---

## 1. What it purports to do but has not implemented

### Genuine stubs (labeled "coming soon" in the UI)
These are honest placeholders the user can see:

- **Google Drive file browsing** — Drive connects/authenticates fine, but the file tree is stubbed: *"Connected - File browsing coming soon..."* (`src/components/SourcesPanel.jsx:593`). GitHub source browsing, by contrast, works.
- **Canvas "widget" form factor** — float/tile/hybrid all work; only "widget" toasts *"Widget mode — coming soon"* and bails (`src/App.jsx:595`).
- **Journals "Chat" button** — disabled stub on an otherwise rich journal feature (`src/components/journals/JournalPanel.jsx:345`).
- **Notefalls "screen sharing & auto-capture"** — a decorative button with no `onClick` handler at all; pure UI, no backend (`src/components/notefalls/NotefallsPanel.jsx:183`).

### Built but invisible (backend with no UI)
More consequential — real engineering that no user can reach:

- **The in-app Recorder** (`recorder_sessions` / `recorder_events`) has a complete service, IPC layer, and a `useRecorder` hook — but **zero components import it**. A fully-built subsystem is dead on arrival.
- Note there are **two unrelated "recorder" concepts**: the dead one above, and **Phantom** (`PhantomSection.jsx`), which *is* surfaced in the Tasks panel but shells out to an external Python app **hardcoded to `/Users/alex/Documents/Cufolio/phantom`** — so it works only on the author's machine and the target app isn't in this repo. Neither is shippable as-is.

### Aspirational schema (tables with no runtime code)
- **`briiztorm_projects`** and **`briiztorm_flight_presets`** are created by the initial migration and referenced *nowhere* in `electron/` or `src/`. The briiZtorm feature actually persists into `embedded_app_state` (keyed `app_id='briiztorm'`), so these two relational tables are pure dead schema.

### Cloud sync scope
Cloud sync is **real but narrow** (see §2). It advertises "continuity" but only synchronizes `tasks`, `organizer`, and `retainedText`. Journals, notefalls, canvases, media, forest, memory, threads/messages, and stylofact are all local-only.

---

## 2. How well integrated is the database?

**Very well — within one subsystem, and with caveats.**

### The good
- **Real migration engine.** `electron/local-data-service.js` runs forward-only SQL migrations from `electron/local-data/schema/*.sql` (7 files), records SHA-256 checksums, and refuses to boot if an applied migration's checksum changed. 49 runtime tables total.
- **Disciplined repository layer.** `LocalDataService` (~3,200 lines) centralizes SQL behind two consistent primitives: `_write`/`_writeDomains` (transaction + `domain_revisions` bump + conditional `sync_outbox` enqueue + a `changed` event that pushes reactive refreshes to all windows), and `_requireCurrent` (optimistic concurrency via `expectedRevision`, failing with `REVISION_CONFLICT`).
- **Consistent soft-delete + revision pattern.** `deleted_at IS NULL` filtering and `revision = revision + 1` bumps are applied uniformly. Archives set `deleted_at` rather than hard-deleting.
- **Cloud sync is genuinely implemented**, not stubbed. `electron/cloud-gateway.js` is a complete Firestore-REST engine: primary-device leasing/heartbeat, chunked + SHA-256-verified + revisioned snapshot upload with 3-revision retention, remote-command polling/execution, and recovery/restore. It's wired into `main.js` and `AuthContext.jsx`.

### The caveats
- **Three storage layers, not one.** The clean repository story holds only for `local-data`. The **forest** subsystem (journals, folios, notefalls, forest board) runs through a *separate* path (`forest-db.js` / `forest-fs.js`, exposed as `window.api.foliosList` etc.), and **canvases** run through a *third* filesystem path. So "the database" is really three databases with different conventions.
- **Two competing canvas systems — one is orphaned.** The SQLite `canvases` table has a complete backend (list/get/create/update/archive + IPC + preload API) that receives **no data**, because the actual UI (`src/hooks/useCanvases.js`) persists canvases to the *filesystem* instead. A fully-built DB feature sits bypassed.
- **Prisma schema is stale and misleading.** `prisma/schema.prisma` is a reference doc only (runtime uses better-sqlite3). It *includes* the two dead briiztorm tables but *omits* all four `stylofact_*` tables the live app actually uses (added in migration 007, never back-ported). Anyone trusting it as ground truth gets phantom tables and misses real ones.
- **Dead channels & modules.** `local-data-ipc.js` declares `continuity:status` / `continuity:restore` handlers that aren't in the registration array — callers would get "No handler registered" (the working path is `cloud:restore-continuity`). `electron/agent-jobs-firestore.js` is imported nowhere. `sync_state.last_uploaded_revision` is written but never read.

### Orphaned tables (no read and no write anywhere)
`briiztorm_projects`, `briiztorm_flight_presets`. Additionally `canvases` (DB) and `retained_text`/`shared_text_mirrors` are effectively orphaned from the frontend (written by internal paths only, or with no UI consumer).

---

## 3. How well is the AI integrated into the data scheme?

**This is the weakest part of the system, and it directly answers your questions.**

The running agent is an in-process **LangGraph.js** react-agent (`electron/agent/lead-agent.js`) — the Python `agent/` directory is now just config + a skills tree. The LLM only sees the tools in `electron/agent/tools.js`. That surface is small.

### Your specific questions, answered

| Can the AI… | Answer | Why |
|---|---|---|
| **Read info saved to journals?** | **No.** | No journal/folio tool exists. Full CRUD IPC exists (`preload.js`) but is never bridged to the agent. `grep` of the agent tool file for "journal/folio" = zero hits. |
| **View what tasks are queued?** | **Partially.** | It can create/complete tasks and summarize *calendar events*, but only reactively — it reads `context.{tasks,events,notes}` populated live by the renderer *when it calls a tool*. It gets no queue snapshot up front, never touches `task_steps`, and `getScheduleSummary` silently returns empty if that context isn't populated. |
| **Know the current theme / appearance?** | **No.** | There is no settings/theme tool. The agent literally cannot answer "what theme am I using?" The `settings` IPC is ready to bridge; nothing does. |
| **Know what's playing (media)?** | **No.** | No media tool. `media.get` IPC exists, unbridged. |
| **See canvases / open panels / layout?** | **No (as agent).** | ~20 canvas/panel handlers exist in the *renderer* registry but none are bridged to the LLM — leftovers from a removed renderer-side agent loop. |
| **Read/write its own memory as a tool?** | **Read only, automatically.** | Memory facts are injected into the system prompt at build time and saved by a post-response hook. There is no memory *tool*; the `updateAgentMemory` handler exists but is unbridged. |

### What the AI actually can do
- **Notes, tasks, calendar events** — basic CRUD, all routed through `organizer_items` / `tasks`.
- **Real filesystem + terminal** — `read_file`, `write_file`, `ls`, `move`/`copy`/`delete`, `bash`, `view_image`, `present_files` (operating on the OS filesystem, gated by a blacklist + permission policy).
- **Sub-agent delegation, clarifying questions, schedule-conflict detection.**

### What context the agent gets at conversation start
Only: agent name, a SOUL.md persona file, memory profile (work/personal/top-of-mind + up to 30 facts), the enabled-skills list, sub-agent instructions, and the **current date**. **No theme, no open panels, no media state, no task queue.** There is no live app-state snapshot reaching the model.

---

## 4. Obvious wins waiting to be picked up

Ordered roughly by value-to-effort:

1. **Give the agent read access to app state.** A tiny `getAppState` bridge tool (theme, open panels, media now-playing, queued tasks) would make the agent situationally aware. All the underlying IPC (`settings`, `media.get`, `workspace.getLayout`) already exists — this is wiring, not building.
2. **Expose journals/folios and notefalls to the agent.** Full CRUD IPC is already built for both. For a "notebook workspace," an AI that can't read your notes is the biggest missed opportunity here.
3. **Activate the `canvases` DB backend *or* delete it.** Pick one canvas persistence path; right now a complete backend is dead weight and the filesystem path is the real one.
4. **Ship the Recorder UI.** A complete backend + IPC + hook is sitting unused — a single panel would light it up.
5. **Google Drive browsing.** OAuth already works; only the file-tree render is stubbed.
6. **Canvas "widget" form factor** and the small journal/notefall stubs — near-complete affordances.

---

## 5. Failures hiding in plain sight

1. **The "Chats" dock button opens briiZtorm, not chat.** In `src/components/controlbar/ControlBar.jsx`, both the "Chats" button and the "briiZtorm" button use `onClick={onToggleBriiztorm}` and read `briiztormOpen`. A copy-paste bug: the primary chat launcher is mis-wired to the 3D view. (Confirmed by direct read.)
2. **Phantom is hardcoded to the author's home directory** — silently broken for any other machine or user.
3. **A whole recorder subsystem is invisible** (§1) — built, tested-looking, unreachable.
4. **Prisma schema drift** (§2) — the most-likely-consulted "schema of record" is wrong in both directions.
5. **The abandoned theme consolidation** (§6) — fragmented artifacts that will mislead the next person to touch styling.

---

## 6. Theming (fragmentation snapshot)

Theming is spread across four disconnected artifacts: the runtime source of truth is a **monolithic ~8,400-line `src/App.css`** defining 13 themes via `[data-theme]` blocks; `src/styles/theme/` is an **empty** modular-theme scaffold; `src/App.css.bak` is a **438 KB** refactor backup; and `design/` is a **standalone, unreferenced "Theme Studio" web app**. Three themes (`navy-brockman`, `transparent`, `peppermint-foil`) are defined in CSS but missing from the settings picker.

Your existing `THEME-CONSOLIDATION-ANALYSIS.md` concludes that a naive token flattening is **impossible without loss** (331 variable names collapse to 310 distinct signatures; only 19 exact aliases are mechanically safe) and recommends a **reversible pilot** — foundations/recipes added alongside legacy vars, exact aliases only, slice-by-slice migration. That pilot has **not** been executed; all legacy vars remain.

---

## Path forward (suggested sequencing)

**Now (days):** Fix the ControlBar chat button. Add a read-only `getAppState` agent tool (theme + panels + media + task queue). Correct or regenerate the Prisma schema. Delete or clearly quarantine dead code (briiztorm tables, `agent-jobs-firestore.js`, one of the two canvas systems).

**Next (weeks):** Bridge journals/notefalls into the agent (read first, then write). Ship the Recorder UI. Finish Google Drive browsing. Decide the canvas persistence story.

**Later:** Expand cloud-sync domains beyond the current three, or explicitly document it as "task/organizer continuity only." Execute the theme-consolidation pilot from your own analysis doc.

The through-line: **briizOS has built more than it exposes.** The highest-leverage work isn't new features — it's connecting the AI to the data that already exists, and retiring the scaffolding that no longer does anything.
