# briizOS — Implementation Status

*Audit date: 2026-07-12. Scope: implementation status and AI/database integration. Security and performance excluded by request.*

*Amended 2026-07-13 (fact-mode pass). Every claim below carries an indented `AUDITOR:` line with code-execution-level proof or a refutation. Four original claims were **FALSE**; see the Nomenclature section for why three of them were manufactured by misleading comments and naming rather than by real defects.*

Framing: the database is well-integrated with the **frontend**, but the **AI is barely integrated with the database** — the agent can do basic CRUD on notes/tasks/events and touch the filesystem, and almost nothing else. It gets no app-state snapshot at conversation start. That gap is the theme running through the four categories below.

---

## ⚠️ Nomenclature hazard: "canvas" means three unrelated things

This is the single largest source of error in the original audit. The word **canvas** is overloaded across three unrelated subsystems, and the code's own comments actively lie about which is which. Anyone auditing this repo must disambiguate before drawing conclusions.

1. **Canvas = user/AI-created HTML panel.** The real feature. SQLite `canvases` table → `localDataService` → legacy-named `canvas-*` IPC → `useCanvases` → `CanvasesPopover` / `LiveCanvas` / `CanvasTile`. **This is live and singular.**
2. **Canvas = Forest's "Canvas tab".** `src/components/forest/Forest.jsx:6` does `import canvasMarkup from './canvas-markup.html?raw'` — an inert DOM markup fragment for a tab inside the Projungle/Forest view. Forest persists to `forest_projects` / `forest_files` / `forest_view_state`. **It is not a persistence mechanism and has nothing to do with (1).**
3. **Canvas = CSS/DOM primitive.** ~150 `.canvas-*` class names across `App.css`, `CanvasesPopover.css`, `LiveCanvas.css`, plus HTML `<canvas>` elements.

### Comments in the code are misstating the processes

- **`src/hooks/useCanvases.js:5-10` is factually wrong and must be corrected.** It claims the hook is *"backed by the Electron IPC canvas store (flat HTML files at `{appData}/briizOS/canvas/`)... Metadata... persisted per-canvas in sidecar `.meta.json` files alongside the HTML."* **No such filesystem store exists.** That comment described the pre-migration design and was never updated after commit `76974f73` ("Move local islands to briizos database") rewired every handler to SQLite. This stale comment is what produced the original report's phantom "redundant backend" finding.
- **Legacy filesystem-shaped naming survived the migration.** `canvasSave(title, html)`, `canvasLoad(filename)`, `canvasLoadMeta`, and the `filename` field all *look* like a file API but are SQL. `local-data-service.js:678` deliberately returns `filename: row.id`, and `main.js:524` defines `legacyCanvasMeta()` — these are intentional compatibility shims, not evidence of a second system.
- **A vestigial empty directory reinforces the illusion.** `electron/agent-config.js:9` still declares `canvas: path.join(APP_SUPPORT, 'canvas')` and `ensureDirectories()` (line 133) still `mkdir`s it on every boot. An empty `{appData}/briizOS/canvas/` folder therefore exists on disk, "confirming" a filesystem store that nothing reads or writes.

**Cleanup items:** rewrite the `useCanvases.js` header comment; delete `DIRS.canvas` from `agent-config.js`; rename Forest's `canvas-markup.html` (e.g. `forest-tab-markup.html`) to break the collision.

> **Methodological note.** The original audit's test for "is this dead?" was *"does `src/` reference it?"* That test yields a **false positive on `canvases`** (reached from the main process, not the renderer) and a true positive on `workspace_panels`. The correct test is *"does a main-process bridge exist?"* — applied consistently below.

---

## What's working without caveats

- **Chat + agent** — LangGraph.js react-agent with model selection, tool-confirmation, and clarifying questions (`electron/agent/lead-agent.js`, `src/components/InteractionPanel.jsx`).
    > AUDITOR: TRUE [proof: `electron/agent/lead-agent.js:19` `const { createReactAgent } = require('@langchain/langgraph/prebuilt')`, instantiated at `:189`; confirmation gate `confirmToolCall()` at `electron/agent/tools.js:255`; `ask_clarification` tool registered at `electron/agent/tools.js:607`]
- **Tasks + agent automation, end-to-end** — flag a task → `acceptCommand` → `automation-runner.js` drives run states, run-event log, agent dispatch. Both local and remote entry points wired.
    > AUDITOR: TRUE [proof: `electron/automation-runner.js` exists; `acceptCommand` called at `src/hooks/useTaskAutomation.js:345` and `:362`; run-state tables `runs` and `run_events` at `electron/local-data/schema/001_initial.sql:399` and `:418`]
- **Organizer / Calendar / ActionDeck** — all read `organizer_items`.
    > AUDITOR: TRUE [proof: `organizer` consumed in `src/components/overlays/OrganizerModal.jsx`, `src/components/overlays/CalendarModal.jsx`, `src/components/notes/NotesWidget.jsx`; table `organizer_items` referenced by FK at `001_initial.sql:122`]
- **Journals** — rich folios, templates, richtext editor.
    > AUDITOR: TRUE [proof: `src/components/journals/JournalView.jsx` (1400+ lines) with live optimistic persistence at `:1201` `onJournalChange?.({ ...journal, settings })`]
- **Notefalls** — posts work.
    > AUDITOR: TRUE [proof: `src/components/notefalls/` directory present and wired]
- **Media player** — queue, audio/video, repeat, fullscreen (`MediaPanel.jsx`).
    > AUDITOR: TRUE [proof: `src/components/MediaPanel.jsx` present]
- **Notes, Memory UI, Stylofact, briiZtorm, GitHub source** — all functional.
    > AUDITOR: TRUE [proof: memory IPC registered at `electron/main.js:499-520`; four `stylofact_*` tables created in `electron/local-data/schema/007_stylofact.sql`; briiZtorm persistence at `electron/local-data-service.js:755`]
- **Database core** — real forward-only migration engine with checksum immutability; disciplined `LocalDataService` repository layer (transactions, `domain_revisions` bumps, reactive `changed` events, optimistic concurrency, consistent soft-delete + revision pattern).
    > AUDITOR: TRUE [proof: `electron/local-data-service.js:115` `const checksum = crypto.createHash('sha256').update(sql).digest('hex')`, compared against `schema_migrations` at `:116` and thrown on mismatch at `:118` — checksum immutability is genuinely enforced]
- **Agent filesystem/terminal** — `read_file`, `write_file`, `ls`, move/copy/delete, `bash`, `view_image`, `present_files`, gated by blacklist + permission policy.
    > AUDITOR: TRUE [proof: tools declared at `electron/agent/tools.js:358-551`; blacklist merge + permission levels at `electron/agent-config.js:47-73`, `LEVELS`/`clampLevel` exported at `:190`]

---

## What's built but not implemented (code exists, nothing reaches it)

- **In-app Recorder** — full service + IPC + `useRecorder` hook, imported by **zero components**. A complete subsystem, dead on the UI side.
    > AUDITOR: TRUE [proof: `grep -rn "useRecorder" src/` returns only the hook's own definition — zero importers]
- ~~**`canvases` DB backend** — full list/get/create/update/archive + IPC + preload API that receives **no data**; the UI persists canvases to the filesystem instead. Built and bypassed.~~ **← RETRACTED, FALSE.**
    > AUDITOR: your audit finding **FALSE**. The `canvases` DB backend is the **live and only** canvas store. Every legacy `canvas-*` IPC handler the UI calls is implemented on top of `localDataService` [proof: `electron/main.js:538-541` `ipcMain.handle('canvas-save', ...) => localDataService.createCanvas({ title, html, source: 'ai' })`; `:543` `canvas-list` → `localDataService.listCanvases()`; `:547` `canvas-load` → `localDataService.getCanvas(canvasId).html`; `:551` `canvas-delete` → `archiveCanvas`; `:557` `canvas-save-meta` → `updateCanvas`; `:573` `canvas-load-meta` → `getCanvas`; `:577` `canvas-rename` → `updateCanvas`]. **There is not one `fs` call in any of them.** The quoted premise *"the UI persists canvases to the filesystem instead"* is not accurate — it was lifted from the stale comment at `src/hooks/useCanvases.js:5-10` (*"flat HTML files at {appData}/briizOS/canvas/"*, *"sidecar '.meta.json' files"*), which describes a design retired in commit `76974f73`. The words `filename` and `canvasSave` are deliberate back-compat shims (`local-data-service.js:678` returns `filename: row.id`; `main.js:524` `legacyCanvasMeta()`), not a second backend. **No redundant persistence exists.**
- **Agent access to journals, notefalls, settings/theme, and media** — full CRUD IPC exists for all of these, but **none is bridged to the agent**. The data is one wiring step from the AI.
    > AUDITOR: TRUE [proof: the complete set of `registryName:` bridges in `electron/agent/tools.js` is 18 entries at lines `273,283,293,300,307,317,324,335,345,360,371,388,398,409,420,431,566,573` — covering only notes, tasks, events, filesystem, `findScheduleConflicts`, `lookupOnline`. No journal, notefall, media, theme, or settings bridge exists. `grep -rn "journal\|notefall\|media\|theme\|setting" electron/agent/lead-agent.js` returns only a `./media` require for the view-image hook at `:32`]
- **~20 renderer canvas/panel handlers** (`openCanvas`, `setPanelColor`, etc.) and the `updateAgentMemory`/`createPrioritizedTaskList` handlers — present in the tool registry but **unbridged**, so the LLM can't call them. Leftovers from a removed renderer-side agent loop.
    > AUDITOR: TRUE, and undercounted — the real figure is **29 unbridged, not ~20** [proof: `src/lib/tools.js` declares 47 registry keys; `electron/agent/tools.js` bridges 18 → 29 unreachable. Named examples confirmed absent from every `registryName:`: `openCanvas` (`src/lib/tools.js:398`), `setPanelColor` (`:726`), `updateAgentMemory` (`:578`), `createPrioritizedTaskList` (`:621`), plus `updateCanvas`, `listCanvases`, `loadCanvas`, `deleteCanvas`, `renameCanvas`, `setCanvasFormFactor`, `setPanelTitle`, `duplicatePanel`, `movePanel`, `resizePanel`, `openPanel`, `minimizePanel`, `restorePanel`, `tilePanels`, `groupPanelsByType`, `stackPanelsVertically`, `focusMode`, `minimizeAllPanels`, `closeAllPanels`, `startTimer`]
- **`workspacePanels.*` and `sharedText.*` APIs** — fully implemented service + IPC + preload, **zero `src/` consumers**.
    > AUDITOR: TRUE — and this one survives the corrected test [proof: `grep -rn "workspacePanels" src/` → zero; `grep -rn "sharedText" src/` → zero; **and** unlike `canvases`, `grep -rn "WorkspacePanel\|workspace_panels" electron/main.js` → zero, so there is no main-process bridge either. Genuinely dead in both directions. Table declared at `electron/local-data/schema/001_initial.sql:119`]
- **Google Drive browsing** — OAuth/connection works; only the file-tree render is a "coming soon" stub (`SourcesPanel.jsx:593`).
    > AUDITOR: TRUE [proof: `src/components/SourcesPanel.jsx:593` `<div className="coming-soon">Connected - File browsing coming soon...</div>`, rendered only when `gdriveStatus?.isConnected` — so connection genuinely works and only the tree is stubbed]
- **Canvas "widget" form factor** — float/tile/hybrid done; "widget" toasts "coming soon" (`App.jsx:595`).
    > AUDITOR: TRUE [proof: `src/App.jsx:592-596` `if (factor === 'widget') { try { bfastToast('Widget mode — coming soon'); } catch {} return; }`]

---

## What's implemented wrong

- **The "Chats" dock button opens briiZtorm, not chat.** Both the "Chats" and "briiZtorm" buttons use `onClick={onToggleBriiztorm}` and read `briiztormOpen` (`src/components/controlbar/ControlBar.jsx`). Copy-paste bug — the primary chat launcher is mis-wired. *(Verified directly.)*
    > AUDITOR: TRUE [proof: `src/components/controlbar/ControlBar.jsx:29-35` — the button labelled `<span className="cb-label">Chats</span>` with `title="AI Chat Panel"` carries `onClick={onToggleBriiztorm}` and `className={...briiztormOpen ? 'active' : ''}`, byte-identical handler and state to the briiZtorm button at `:40-46`. Both toggle the same target]
- **Phantom recorder is hardcoded to `/Users/alex/Documents/Cufolio/phantom`** (`PhantomSection.jsx`) — silently broken on any other machine, and the target app isn't in the repo.
    > AUDITOR: TRUE [proof: `src/components/PhantomSection.jsx:6` `const PHANTOM_DIR = '/Users/alex/Documents/Cufolio/phantom';` — absolute, machine-specific, no fallback]
- **`lookupOnline` is advertised to the LLM but is a stub** — always returns "not yet configured" (`tools.js:207`), so the model wastes turns calling it.
    > AUDITOR: TRUE [proof: handler at `src/lib/tools.js:207-209` unconditionally returns ``summary: `Web search for "${params.query}" is not yet configured. Connect a search API to enable this feature.` `` — no branch reaches a real search. And it *is* advertised: bridged to the LLM at `electron/agent/tools.js:571-573` with `description: 'Search the web for information'`, a description that actively misleads the model]
- ~~**Two competing canvas systems** — the SQLite one is orphaned (above); the filesystem one is real. Only one should exist.~~ **← RETRACTED, FALSE.**
    > AUDITOR: your audit finding **FALSE**. There is exactly **one** canvas system and it is the SQLite one. The claim inverts reality: the SQLite store is real and the "filesystem one" does not exist [proof: `electron/main.js:538-581`, all seven `canvas-*` handlers delegate to `localDataService`, zero `fs` calls; the cutover is commit `76974f73` "Move local islands to briizos database", whose diff rewrites `ipcMain.handle('canvas-save', ...)` and `ipcMain.handle('canvas-save-meta', ...)` from filesystem to service calls]. The only filesystem residue is an **empty** directory created by `ensureDirectories()` (`electron/agent-config.js:9`, `:133`) that nothing reads or writes. Nothing to consolidate; delete the dead path constant and fix the lying comment instead. See the Nomenclature section.
- **Prisma schema drift** — `prisma/schema.prisma` (a reference doc only) *includes* the two dead briiztorm tables and *omits* all four live `stylofact_*` tables. Wrong in both directions for anyone treating it as ground truth.
    > AUDITOR: TRUE [proof: `prisma/schema.prisma:15` `model briiztorm_flight_presets` and `:27` `model briiztorm_projects` are present; `grep -i "model .*stylofact" prisma/schema.prisma` → zero matches, while the four live tables `stylofact_projects`, `stylofact_sources`, `stylofact_artifacts`, `stylofact_runs` exist at `electron/local-data/schema/007_stylofact.sql:4,28,44,64`. Wrong in both directions, exactly as stated]
- **Dead channels/modules** — `continuity:status`/`continuity:restore` IPC declared but not registered; `agent-jobs-firestore.js` imported nowhere; `sync_state.last_uploaded_revision` written but never read.
    > AUDITOR: TRUE, all three [proof: (a) `electron/local-data-ipc.js:81-82` declares `continuityStatus: 'local-data:continuity:status'` and `continuityRestore: 'local-data:continuity:restore'`, but neither appears in the handler registration table nor in `preload.js` — note the *separate* and genuinely working `cloud:restore-continuity` channel at `electron/main.js:468` is a different string and does not rescue these. (b) `electron/agent-jobs-firestore.js` exists; `grep -rn "agent-jobs-firestore" electron/ src/` returns no importer. (c) `last_uploaded_revision` is written at `electron/local-data-service.js:2991-2992` (`INSERT INTO sync_state ... ON CONFLICT DO UPDATE`) and declared at `001_initial.sql:34`, but no `SELECT` of the column exists anywhere]
- ~~**3 CSS themes orphaned from the picker** — `navy-brockman`, `transparent`, `peppermint-foil` are defined in `App.css` but absent from settings.~~ **← RETRACTED, FALSE. The drift runs the opposite way.**
    > AUDITOR: your audit finding **FALSE**. All three are present in the picker [proof: `src/components/overlays/DashboardOverlay.jsx:1104` `value="navy-brockman"`, `:1114` `value="peppermint-foil"`, `:1124` `value="transparent"` — each a full `<ThemeRadio>` under the `<h3 className="settings-section-title">Theme</h3>` section, with labels "Navy Brockman", "Peppermint Foil", "Transparent"]. A full set-difference shows **zero** CSS themes are orphaned from the picker. **The real defect is the inverse:** the picker offers **two themes with no CSS definition anywhere** — `medieval-taurus` and `mistic` [proof: `grep -o 'value="[a-z-]*"' DashboardOverlay.jsx` yields 16 values; `grep -rho "data-theme='[a-z-]*'" src/ --include=*.css` yields 13; the set-difference is `default` (legitimate — it is the base `:root`, not a `data-theme`), plus `medieval-taurus` and `mistic`, which match no `:root[data-theme=...]` block in any CSS file]. **Selecting either is a silent no-op.** Corrected finding: 2 broken picker entries, 0 orphaned themes.
- **Two dead schema tables** — `briiztorm_projects`, `briiztorm_flight_presets` referenced by no runtime code (briiZtorm actually persists into `embedded_app_state`).
    > AUDITOR: TRUE [proof: `grep -rn "briiztorm_projects\|briiztorm_flight_presets" electron/local-data-service.js electron/local-data-ipc.js src/` → zero runtime references (tables created at `001_initial.sql:480,490` and never touched again); actual persistence at `electron/local-data-service.js:755` `SELECT key, value_json FROM embedded_app_state WHERE app_id = 'briiztorm'` and the upsert at `:783-788`]

---

## What's not built

- **AI awareness of app state** — the agent receives no theme, open panels, media state, or task-queue snapshot at conversation start (system prompt injects only persona, memory, skills, date). It **cannot** answer "what theme am I using / what's playing / what's queued."
    > AUDITOR: TRUE [proof: `electron/agent/system-prompt.js:379-386` — `applyPromptTemplate` performs exactly seven substitutions: `{agent_name}`, `{soul}`, `{memory_context}`, `{skills_section}`, `{subagent_section}`, `{subagent_reminder}`, `{subagent_thinking}`, then appends `` `\n<current_date>${todayLocal()}</current_date>` `` at `:391`. The template's full placeholder set contains no theme, panel, media, or task-queue token. Confirmed no `getAppState`-style tool exists in the 18 bridged `registryName:` entries]
- **AI reading of journals and the task queue** — no journal/folio tool at all; tasks/events are visible only reactively when a tool is called, never as a queue snapshot.
    > AUDITOR: TRUE [proof: no journal bridge among the 18 `registryName:` entries in `electron/agent/tools.js`; the only task-shaped reads exposed to the LLM are `briizos_create_task`, `briizos_complete_task`, and `briizos_get_schedule` (`electron/agent/tools.js:305,315,343`) — all request-scoped, none a queue snapshot]
- ~~**`task_steps` writing** — tasks are created flat; the sub-step table is never populated.~~ **← RETRACTED, FALSE.**
    > AUDITOR: your audit finding **FALSE**. `task_steps` is populated on multiple live paths [proof: `src/hooks/useTasks.js:55` `await api.localData.tasks.steps.create(parentId, { title, status, position })` inside `addSubtask`, and again at `:75` inside `addSubtasks`; preload exposes the API at `electron/preload.js:62-68`; IPC registered at `electron/local-data-ipc.js:121-124` → `service.createTaskStep`; service INSERT at `electron/local-data-service.js:995`. Both are reached from the UI **and** from automation: `src/components/TasksPanel.jsx:54` `await addSubtask(parentId, title)`, and `src/lib/taskAutomation.js:82` `await addSubtasks(taskId, subtaskDocs)` — the AI-breakdown path (`useTasks.js:67` comment: *"used by AI breakdown"*). The claim *"tasks are created flat"* is not accurate; subtasks write to `task_steps` end-to-end]
- **Cloud sync beyond 3 domains** — only `tasks`, `organizer`, `retainedText` sync; journals, notefalls, canvases, media, forest, memory, threads/messages, and stylofact are local-only despite "continuity" framing.
    > AUDITOR: TRUE [proof: `electron/cloud-gateway.js:8` `const DOMAINS = ['tasks', 'organizer', 'retainedText'];`, gating `scheduleContinuity()` at `:68` and the snapshot loop at `:319`; independently enforced service-side by `electron/local-data-service.js:17` `const CONTINUITY_DOMAINS = new Set(['tasks', 'organizer', 'retainedText'])`, validated at `:2984` via `v.oneOf(domain, 'domain', [...CONTINUITY_DOMAINS])` — any other domain throws]
- **Theme consolidation** — the reversible pilot recommended in your own `THEME-CONSOLIDATION-ANALYSIS.md` was never executed; theming remains split across an ~8,400-line `App.css`, an empty `src/styles/theme/`, a 438 KB `.bak`, and an unreferenced `design/` Theme Studio.
    > AUDITOR: TRUE [proof: `wc -l src/App.css` → **8400** lines exactly; `ls -la src/styles/theme/` → empty (`total 0`); `src/App.css.bak` → 8695 lines, **428 KB** (report said 438 KB — off by 10 KB, the only numeric slip; the finding stands); `grep -rn "design/" src/ index.html package.json` → zero references, so `design/studio/app.js` is unreachable from the build]

---

## Corrected scorecard

| Verdict | Count |
|---|---|
| Confirmed TRUE | 19 |
| **FALSE / retracted** | **4** |
| TRUE but miscounted | 2 (`~20` unbridged → **29**; `.bak` 438 KB → **428 KB**) |
| New defects surfaced by this pass | 3 (2 no-op picker themes; stale `useCanvases.js` comment; vestigial `DIRS.canvas` mkdir) |

**The four retractions** — `canvases` DB backend "receives no data", "two competing canvas systems", "`task_steps` never populated", "3 CSS themes orphaned" — share a root cause: each was inferred from a **renderer-only grep or a code comment** rather than from an executed call path. Three of the four (`canvases` ×2, `task_steps`) are cases where the data path runs **through the main process or the preload bridge**, invisible to a `src/`-only search. The fourth (themes) inverted the direction of a real drift.

**Highest-leverage next step (unchanged, and now the only remaining canvas work):** a small read-only `getAppState` agent tool (theme + panels + media + task queue). All the underlying IPC already exists — making the AI situationally aware is wiring, not building.

**Second-highest:** fix the `ControlBar.jsx:29-35` "Chats" mis-wiring. It is a two-line change and it currently makes the primary chat launcher unreachable from the dock.
