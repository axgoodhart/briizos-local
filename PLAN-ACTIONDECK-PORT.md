# Plan: ActionDeck Features → briizOS.Local (Native Port) + AI Data Access

Status: code-complete — Phases 0–6 implemented (Phase 1: 2026-07-16, Phases 2–6: 2026-07-17); in-app acceptance pending (user-run)
Scope: briizOS.local only (Web/Mobile parity comes free at the data layer via sync, but no Web/Mobile UI work is planned here)
Author: Claude (session 2026-07-16), grounded in a read of both codebases

---

## 0. The one-paragraph version

Before this port, ActionDeck ran inside briizOS as an **iframe** (now preserved only in unimported `src/components/overlays/ActionDeckColumn.legacy.jsx`). Its data lived in separate Firestore collections, its AI ran on a separate stack (Genkit → Gemini), nothing it did appeared in the Log Panel, and it could not see briizOS tasks or Forest projects. Phases 0–5 **rebuilt the three features natively** on briizOS.local's existing foundations—the unified local database, the in-process LangGraph agent, and the organizer/sync layer—and retired the iframe. The prerequisite data catalog gives the AI scoped access to the unified database and supplies real Forest projects and Tasks to the Prioritizer.

---

## 1. Plain-language map of the stack (read this first)

briizOS.local is an Electron app, which means it is really two programs talking to each other:

| Piece | What it is | Where it runs | What lives there |
|---|---|---|---|
| **Renderer** | The visible app (React) | A browser window | Panels: InteractionPanel, TasksPanel, CalendarModal, Forest, LogPanel |
| **Electron main** | The invisible engine | A background process on your Mac | The **unified database** (SQLite via `electron/local-data-service.js`) and the **AI agent** (`electron/agent/`, LangGraph running in-process) |
| **Firestore** | Google's cloud database | The cloud | The sync copy of organizer items, tasks, panels — governed by `SyncContract.md` |

Three facts that shape every decision below:

1. **The unified database is local-first.** Everything (tasks, organizer notes/events/projects/timers, Forest projects, chat threads, settings, logs) is one SQLite file on your Mac. It works with no internet. Firestore sync happens on top, through the SyncContract's canonical read/write functions. *Reliability: features built on it work offline. Footprint: no new servers, no new services.*
2. **The AI agent already lives inside the app.** It is not a cloud service — it's LangGraph.js running inside the Electron main process, calling whichever model you pick (Anthropic / OpenAI / Google). Its tools reach the app through a bridge, and every tool call already streams into the chat UI and the Log Panel. *Visibility: AI actions are inspectable. Footprint: porting ActionDeck's AI features adds zero new AI infrastructure.*
3. **The retired ActionDeck panel was a window into a different app.** The iframe version had its own login, its own data, its own Gemini calls, and logged nothing to the Log Panel. That's why "port" here meant *re-implement natively*, not "move the iframe."

What ActionDeck's features actually are (from reading its source):

- **TODAY view**: a per-day timeline of time blocks (start minute + duration), a quick-entry box, a date navigator, a picker that pulls existing project/casual tasks onto the day, an AI "recommend my day" button, and an AI chat panel about the day.
- **Prioritizer**: a form — pick projects (checkboxes), describe your goals and timing — the AI returns a ranked list plus markdown reasoning.
- **Deck Maker (Tasks page)**: give the AI a goal; if it's ambiguous the AI asks **one clarifying question**; then it produces a "deck" — a titled, collapsible stack of small tasks with an N/M progress count.

---

## 2. Design decisions (the load-bearing choices)

### D1 — Native port; retire the iframe at the end
`ActionDeckColumn.jsx` stayed untouched and available during the port. With native parity complete, Phase 5 removed every active import, export, toggle, shortcut, render route, and workspace restore path for the iframe. Its source is preserved as unimported `ActionDeckColumn.legacy.jsx/.css`; ActionDeck-the-web-app and its old data remain untouched.

### D2 — One data home: values stored once, appearances as context

Design principle (user directive, 2026-07-16): **information is the value; an appearance in a relevant context is currency.** Each piece of information lives in exactly one record; panels never get copies of it — they get *views*. The calendar is therefore a **query** ("everything carrying a time on date X"), not a collection things are copied into. Scheduling a task never copies it — it attaches a paper-thin appearance record (a *placement*) that says when the one existing task shows up.

| ActionDeck concept | briizOS.local home | Why |
|---|---|---|
| `TodayItem` that represents working on a task | **A placement** — a thin appearance record in a new placements domain: `{id, refType:'task', refId, date, startMinute, durationMinutes, recurrence?, completedDates?}`. Holds time context only; title/status always read live from the task | One value, any number of appearances: a task can have Tue *and* Thu sessions, or a recurring "daily at 9" rule, without ever being copied. A recurring placement stays ONE row — occurrences are expanded at query time, never materialized into copies. |
| `TodayItem` that is a standalone event (meeting, appointment) | **Organizer `event` item** — fields `scheduledDate`, `start`, `duration`, `end`, `completed` already exist and CalendarModal already reads them | A meeting is its own value, not an appearance of some other record. Written through the canonical organizer path, as today. |
| `TaskDeck` | **Parent task + subtasks** in the tasks domain (`localData.tasks` + `steps`) | The schema already models exactly this (title, position, status, progress). A "deck" is a rendering style, not a new table. |
| ActionDeck `Project` scoring fields (deadline, importance 1–10, size hours, relevance) | **Optional fields inside Forest project `data_json`** | Forest projects are the user's real projects. `data_json` is a flexible column — adding optional keys is not a schema migration. |
| TODAY's AI chat history (ActionDeck stored it *on the schedule doc*) | **A normal chat thread** (threads domain, `kind: 'planner'`) | Threads already persist, list, and filter by kind. Keeping chat out of organizer docs honors SyncContract invariant #1 (organizer holds *information*, not app state). |

**Placements — the appearance record (v1; user follow-up: multi-slot and recurring scheduling are regular real-world needs):** scheduling always creates a placement, never a copy. The placements domain lives in `local-data-service` like every other domain (ids, revisions, input validation, `onChanged` events, soft delete). Two kinds of "done" fall out of this honestly: **session done** ("the Tuesday 2 pm slot happened" — recorded in `completedDates`, keyed by occurrence date so recurring rules work) versus **task done** ("the work itself is finished" — the task's own `status`). The block's checkbox marks the session; a clearly-labeled "mark task done" sits in the block popover; blocks of a completed task render struck-through. Recurrence reuses the app's existing rule shape (`src/lib/recurrence.js`) and the same expand-at-query-time approach CalendarModal already uses for recurring organizer events. Referential hygiene: archiving a task archives its placements inside the same service-layer write — the orphan-appearance bug is prevented at layer 2, not by UI discipline. Placements are local-only in v1 (no Firestore adapter until a second client actually connects) and never touch organizer docs. Scheduling a **Forest milestone** works by promotion: pulling a milestone onto the day creates a real task (backlinked via the existing `projectId` field) and places *that* — one scheduling mechanism everywhere. (Longer-term, milestones and tasks may deserve outright unification; noted for the Organizer-rescope era, out of scope here.)

**Prohibited-pattern check (SyncContract):** no new panel-doc writes, no legacy aliases (`content`/`name`/`text`/top-level `x/y/w/h`), all organizer writes flow through the existing create/update paths that use the canonical adapters. Task scheduling lives in a new local placements domain (appearance records; no Firestore adapter until a second client actually connects); only standalone events touch organizer docs. The AI never touches Firestore directly — it reads the local SQLite only; sync stays the single Firestore touchpoint. Per user note (2026-07-16): **briizOS.Web and briizos.mobile are not actually connected right now**, so schema evolution here carries no cross-client breakage risk; we keep writes contract-clean anyway so reconnecting them later is a non-event, but Web/Mobile parity is context, not a constraint. *(Note: CLAUDE.md references SyncContract §9/§10, but the contract has 8 sections — those references are stale and should be corrected in CLAUDE.md as part of Phase 0.)*

**Organizer rescope (future, decided):** the Organizer *UI* is slated to be rewritten as a prisma-studio-style browser over all briizOS data. That does not change this plan: "organizer" here always means the *data domain* (the SyncContract's source of truth), not the UI. Standalone events remain organizer docs, scheduled tasks live in the tasks table, and both are simply rows the future browser will show — the D5 data catalog is a natural backbone for that browser when the rescope happens. One consequence is baked in everywhere below: organizer `type: 'project'` items are **not** a surfaced concept and no new feature builds on them; "projects" in briizOS means **Forest projects**.

### D3 — One AI stack: re-implement Genkit flows as agent skills + structured runs
ActionDeck's three Genkit flows (`intelligent-project-prioritization`, `breakdown-task-flow`, `recommend-today-flow`) become **skills** (`agent/skills/custom/*/SKILL.md`) plus, where a strict shape is needed (timeline recommendations), a structured-output run validated before use. The prompts port almost verbatim — including the Deck Maker's "ask one clarifying question if ambiguous" rule, which maps directly onto the agent's **existing clarification interrupt** (already wired end-to-end in `useChat.js` → `pendingClarification`). No Genkit dependency is added; models come from the user's existing model picker.

One more rule, per user direction: **every AI interaction is stored for now.** Planner runs, prioritizer runs, and deck-maker runs each persist as a kind-tagged thread (`planner` / `prioritize` / `deck`) in the threads domain, alongside their LogPanel entries — no stateless one-shot calls. Retention can be revisited once the Organizer-as-browser rescope lands and makes this history easy to inspect and prune.

### D4 — AI data access: main-process reads, bridged-and-confirmed writes
Today the agent's briizOS tools are write-heavy (`briizos_create_note/task/event`, …) with only two reads (`briizos_search_notes`, `briizos_get_schedule`), both round-tripping through the renderer bridge. The port needs broad, cheap, reliable reads:

- **New read tools run in Electron main, directly against `localDataService`** (the agent and the database are in the same process). Reads work even when the renderer is busy or during background automation runs; they are fast; they cannot mutate anything.
- **Write tools keep the existing path**: renderer bridge → `ToolContext` → confirmation policy. Mutations stay visible and user-gated exactly as now. Phase 4 adds three: `briizos_schedule_task` (creates a placement), `briizos_unschedule` (archives one), `briizos_complete_placement` (marks an occurrence done).
- **Every read still logs** — a `agent.data` log entry per query (tool name, filters, row count, duration) into the logs domain so it shows in the LogPanel, plus structured terminal output under `npm run dev:debug` (which already exists: `LOG_LEVEL=debug`).

New read tools (names final at implementation, shapes validated with the existing `electron/local-data/validation` module):

| Tool | Returns | Backing store |
|---|---|---|
| `briizos_list_tasks({status?, priority?, dueBefore?, projectId?, limit})` | tasks + subtask progress | tasks domain |
| `briizos_get_task({id})` | full task incl. subtasks + taskLog | tasks domain |
| `briizos_list_projects({limit?})` | Forest projects — the only surfaced project concept | `forest_projects` |
| `briizos_get_project({id})` | Forest project detail: milestones, files, tags, scoring fields | `forest_projects` + `forest_files` |
| `briizos_query_organizer({types?, dateFrom?, dateTo?, limit})` | events/notes/timers in range | organizer domain |
| `briizos_list_placements({dateFrom?, dateTo?, refId?})` *(Phase 4)* | appearance records joined to their task values, recurrence expanded | placements + tasks |
| `briizos_query_data({domain, id?, parent_id?, query?, kind?, status?, date_from?, date_to?, include_content?, limit?})` *(Phase 6)* | bounded summaries or exact detail for journals, Notefall, canvases, known files, conversations, memory, recorder, Stylofact, automations, Media, briiZtorm, workspace, non-secret settings, logs, and data status | unified local domains via their service-layer reads |
| *(existing)* `briizos_get_schedule`, `briizos_search_notes` | unchanged in v1; in Phase 4 `get_schedule` returns the union view (events + scheduled tasks); migrating both to main-process reads is a hygiene TODO | — |

### D5 — The Data Catalog: one source of truth for "what can the AI see"
New module `electron/agent/data-catalog.js`:

- Enumerates every queryable user-facing object: tasks, subtasks, organizer notes/events/timers, placements, Forest projects/files, journals/folios, Notefall posts, canvases, known files, conversations, memory, recorder sessions, Stylofact projects, automation runs, Media, briiZtorm, workspace state, non-secret settings/model profiles, logs, and local data status.
- Renders a **system-prompt section** (same pattern as the existing skills/memory sections in `system-prompt.js`, with a token budget like memory's `max_injection_tokens`).
- Carries a **per-modality relevance map** — this is requirement 2.1's "prompts that provide the information relevant to the chat mode":

| Chat mode (modality) | Catalog injected |
|---|---|
| `chat` | compact summary of all objects |
| `prioritize` *(new)* | Forest projects + tasks, with scoring fields explained |
| `planner` *(new, used by Calendar day view)* | today's schedule + open tasks + projects |
| `research` | notes, journals/folios, Notefall, canvases, Forest projects/files, conversations, Stylofact |
| `code` | Forest projects/files, canvases, conversations, automation runs, logs, local data status |
| `report` | work/calendar state, journals, Notefall, conversations, runs, recorder history, logs |
| `plan` | work/calendar state plus notes, journals, Notefall, conversations, runs, recorder history |

Phase 6 restored `scripts/generate-tool-catalog.mjs`: `npm run tools:catalog` now writes `electron/agent/DATA-CATALOG.md` directly from the live registry, while `npm run tools:catalog:check` can detect drift. The registry also explicitly records data that remains unavailable by design (credentials, raw sync internals, checkpoints, operation receipts, and device identity).

---

## 3. Workstream A — TODAY view → Calendar

**Target:** `src/components/overlays/CalendarModal.jsx` grows a real **day-plan timeline**; the month grid stays as-is.

| Step | What | Details |
|---|---|---|
| A1 | **Day timeline component** (`DayTimeline.jsx`) | Replaces the flat list in the daily panel: hour grid (default 06:00–22:00, scrollable to full day), blocks positioned by `start`/`duration`, complete-toggle on click, edit/delete popover. Data is a **union view**: organizer events/timers for the date (via `useOrganizer()`, like today's `selectedDayItems`) plus that date's placements — recurrence expanded — joined live to their tasks (`localData.placements.list`), styled by origin. |
| A2 | **Day navigator** | Prev-day / Today / next-day arrows in the daily panel header (month nav already exists; keyboard arrows already move the selected day). |
| A3 | **Quick entry v2** | Extend the existing quick-add parser with duration syntax — `"9am 90m Rehearse set"` → start 540, duration 90. Small, isolated change to `parseQuickAdd`. |
| A4 | **"Add from…" source picker** | Modal listing open tasks (`localData.tasks.list`) and Forest projects/milestones. Picking a task **places it** — creates a placement (date/start/duration, optional recurrence); no copy of the task is created, and one task can hold several placements. Picking a Forest milestone first promotes it to a task (backlinked via `projectId`), then places it. Un-scheduling archives the placement; the task itself is untouched. The block's checkbox completes that *session*; "mark task done" sits one click away in the block popover. |
| A5 | **AI "Plan my day"** | Button in the day view. Gathers current schedule + open tasks + projects (via the D4 read tools), runs the ported `recommend-today` prompt as a structured run (persisted as a `planner`-kind thread — all AI interactions are stored), and renders proposals as **ghost blocks** with per-block Accept/Reject. Accepting a proposal either stamps schedule fields onto the referenced task (an update to the value) or, for genuinely new standalone blocks, creates an organizer event through `OrganizerContext.addItem` — both logged and contract-clean. The optional "chat about my day" affordance opens the InteractionPanel in `planner` modality with a `kind:'planner'` thread. |

Sequencing inside A: ship A1–A3 first (manual planning parity, no AI), then A4, then A5.

**As built (2026-07-17):** Calendar now keeps its month grid and adds a scrollable 24-hour day timeline with overlap lanes, previous/today/next navigation, duration-aware quick entry, live event/task styling, editing, unscheduling/deletion, and an error boundary. Migration 008 adds revision-checked placements with expand-at-query-time daily/weekly/monthly recurrence and per-occurrence completion; task archive soft-archives every appearance in the same transaction. `Add from…` places existing Tasks Panel work and promotes Forest projects/milestones to reusable tasks before placing them. Because the pre-existing `tasks.project_id` is database-constrained to legacy Organizer projects, promoted Forest work uses the additive, contract-honest `forest_project_id` instead; a stable `source_key` prevents repeat promotion from duplicating a milestone task. `Plan my day` runs a stored, text-only `planner` thread, validates its JSON, shows ghost blocks, and writes nothing until each proposal is accepted. Planner chat has its own modality/skill/thread, the agent gets a logged union schedule plus placement read tool, and the three placement writes remain confirmation-gated. Phase 5 made the native planner permanent, removed its temporary rollout gate, and added a focused handoff from Prioritizer; a top-ranked Forest project remains a ghost proposal until Accept promotes it to one reusable task and places that task.

**Plain terms:** the calendar becomes a day planner over your one database. A block is either a real event, or a task showing up in a time slot via a paper-thin *placement* — never a copy. Ticking a block says "that session happened" (recurring blocks tick per-day); finishing the task itself is its own clearly-labeled action, and a finished task's blocks show struck-through. Everything works offline, and every add/complete/AI-suggestion shows up in the Log Panel. (Web/Mobile aren't connected today; when they are, this data is already in the synced database.)

## 4. Workstream B — Prioritizer → Interaction Panel

**Target:** `src/components/InteractionPanel.jsx` + `useChat.js` + one new skill.

| Step | What | Details |
|---|---|---|
| B1 | **New modality `prioritize`** | Add to `MODALITY_SKILL_MAP` → skill `agent/skills/custom/prioritizer/SKILL.md`, a direct port of ActionDeck's prioritization prompt (deadline / importance / size / relevance → ranked list + markdown reasoning). |
| B2 | **Candidate picker (requirement 2.2)** | When the modality is `prioritize`, the panel shows a chip row of candidates fetched from the unified DB — **Forest projects and TasksPanel tasks** (organizer `project` items are deliberately excluded; they are not a surfaced concept). Multi-select; the message box carries goals/timing. Selection is serialized into the outgoing message the same way pinned files already are (`buildFileContextAddendum` pattern → `buildPrioritizeAddendum`). |
| B3 | **Self-serve fallback** | If the user picks nothing, the skill instructs the agent to fetch candidates itself via `briizos_list_projects` / `briizos_list_tasks` — the tool calls are visible in the chat and the Log Panel. |
| B4 | **Result → action** (phase 2 of B) | Under the ranked output, action chips: "Apply as task priorities" (task `priority` updates through the existing confirmed write path) and "Schedule top pick today" (hands off to the A5 planner). |

**As built (2026-07-17):** `prioritize` now owns a real `prioritize`-kind thread (switching modes restores the latest chat of the matching kind), loads live Forest projects and active Tasks Panel tasks into a compact multi-select rail, and serializes exact selected records into the agent turn. Leaving the rail empty invokes the logged read-tool fallback. The direct ActionDeck prompt is ported into `agent/skills/custom/prioritizer/SKILL.md`; starts, candidate choices, finishes, and failures log under `agent.prioritize`. Forest's project viewer now has a four-field Priority Signals editor backed by a narrow revision-checked `data_json` update, and the agent can save user-confirmed values through the confirmation-gated `briizos_update_project_scoring` tool. Phase 5 made the modality permanent, removed its temporary rollout gate, and added B4: a hidden validated rank manifest powers `Apply as task priorities` through the confirmation-gated, revision-checked task write path, while `Schedule top pick today` opens A5 with the exact top task or Forest project as its focus.

**Missing-data handling (decided — optional fields):** Forest projects gain **optional scoring fields** (deadline / importance / size / relevance) inside their `data_json`, edited via a small affordance in the Forest project viewer — built in Phase 3 alongside the modality. When fields are empty, the skill has the agent ask inline, and the answers can be written back through a confirmed write so the prioritizer gets smarter with each run.

**Plain terms:** prioritization stops being a separate app with its own copy of "projects." You pick from your *real* projects and tasks, the reasoning arrives as a normal chat answer you can question, and each data fetch the AI performs is a logged, visible tool call.

## 5. Workstream C — Task Deck Maker → Tasks Panel

**Target:** `src/components/TasksPanel.jsx` + `useTasks.js` + one new skill. Smallest workstream — briizOS already has subtasks, AI breakdown, and the clarification loop.

| Step | What | Details |
|---|---|---|
| C1 | **"New deck" entry point** | Input for a goal ("plan a birthday party") → one headless agent turn with the ported `breakdown-task-flow` prompt, including its rule: ambiguous/emotional goals get exactly **one clarifying question** first. **As built (2026-07-17):** the prompt lives in `src/lib/deckMaker.js` (single source, no skill-file indirection; a chat-surface SKILL.md variant is deferred until wanted), the clarify loop runs inline in the Tasks Panel on one `deck`-kind thread (both sides stored), and the run is fail-closed text-only — any tool attempt aborts it. On completion: one parent task (deck title) + subtasks via the existing revision-checked, logged write paths (`useDeckMaker.js`). |
| C2 | **Deck rendering** | Any task with subtasks renders deck-style: collapsible, `N / M` progress count, dimmed + struck-through when all complete (parity with ActionDeck's `task-deck.tsx`). Extends the existing expansion + progress-badge rendering; no data change. |
| C3 | **Keep both paths** | The existing per-task "Help me plan" breakdown stays (decompose an *existing* task); "New deck" is the from-scratch path. |

**Plain terms:** same Tasks Panel, one new button. Decks are ordinary tasks-with-subtasks in your one database — nothing new to sync, back up, or migrate.

## 6. Workstream D — AI data access foundation

Everything in sections D4/D5 above, built **first**, because A5, B, and C all consume it:

1. `electron/agent/data-catalog.js` (object registry + prompt-section renderer + per-modality map).
2. Read tools in `electron/agent/tools.js` backed by `localDataService` directly; zod input schemas; registered as safe verbs (no confirmation needed — they cannot mutate).
3. `agent.data` logging: one entry per read (tool, filters, row count, ms) → LogPanel + `LOG_LEVEL=debug` terminal format `[HH:MM:SS] [agent.data] DEBUG briizos_list_tasks {status:'pending', rows:12, ms:3}`.
4. System-prompt wiring in `system-prompt.js` (new dynamic section, token-budgeted).
5. Modality plumbing: `useChat.buildConfig()` already sends config per turn — add the modality so the main process picks the right catalog slice.
6. Extend `scripts/generate-tool-catalog.mjs` so docs and prompt never drift.

## 7. Hard-rule compliance (CLAUDE.md)

**Rule 1 — everything logs to the Log Panel.** New categories: `calendar` (view open, block create/edit/toggle/delete, quick-add parse), `tasks.deck` (deck requested, clarification asked/answered, deck created), `agent.prioritize` (candidates picked, run started/finished), `agent.planner` (proposals shown, accepted/rejected per block), `agent.data` (every read tool call). Acceptance for every phase includes "action visible in LogPanel."

**Rule 2 — SyncContract.** All new persistent state is organizer items or tasks through existing canonical paths; no panel-doc writes; no legacy aliases; AI reads local DB only. Also: ActionDeck's own `briizos.ts` reads `users/{uid}/snapshots/app` — a legacy side-channel outside the contract; retiring the iframe retires that read (worth noting in the retro).

**Rule 3 — debug logging.** `npm run dev:debug` already exists (`LOG_LEVEL=debug electron .`). Every new AI/persistence operation emits the structured `[HH:MM:SS] [category] LEVEL message {data}` format through the existing logger; no new script needed, CLAUDE.md's "script does not exist yet" note can be updated.

**Rule 4 — two-layer resolution, applied preventively.** Layer-2 hygiene built into each workstream: zod/validation-module schemas on every new tool input; revision checks on every task/organizer write (already enforced by `local-data-service`); structured-output validation on the planner run (malformed AI output → visible error, never a silent bad write); error boundary around the new DayTimeline; temporary settings gates during rollout (removed in Phase 5 after parity); one generator for tool catalog + prompt section so they can't diverge.

## 8. Phases, order, and acceptance

| Phase | Contents | Size | Acceptance check |
|---|---|---|---|
| **0. Pre-flight** ✅ | §9 decisions signed off (2026-07-16); CLAUDE.md §9/§10 pointer + dev:debug note corrected. Feature flags now land with each feature phase instead (Phase 1's read tools ship unflagged — they are read-only and inert until called) | XS (hours) | Done 2026-07-16 |
| **1. Data access (D)** 🔨 | Catalog, read tools, prompt sections, logging — **code-complete 2026-07-16**: `data-catalog.js` (new), 5 read tools in `tools.js`, `{data_section}` in `system-prompt.js`, modality threaded `useChat → lead-agent`. Verified: syntax on all files, per-mode prompt assembly, and the exact service queries against a scratch SQLite DB | M (2–4 days) | In chat: "what tasks do I have?" and "list my forest projects" answer correctly from the unified DB, tool calls visible in chat + LogPanel, structured logs under dev:debug — **this in-app check is the remaining acceptance step** |
| **2. Deck Maker (C)** 🔨 | New-deck flow, deck rendering — **code-complete 2026-07-17**: `src/lib/deckMaker.js` (prompt + strict JSON parser + fail-closed turn), `src/hooks/useDeckMaker.js` (state machine, `deck`-kind thread, `tasks.deck` logging), Tasks Panel form + inline clarify UI + `N / M` badge + all-done dimming (`App.css`) | S–M (1–3 days) | **User-run acceptance:** type a goal in "New deck…" → deck appears as parent+subtasks and auto-opens; an ambiguous goal (e.g. "fix that thing") triggers exactly one clarifying question inline; `tasks.deck` entries visible in LogPanel; nothing is executed by the AI (text-only run) |
| **3. Prioritizer (B1–B3)** 🔨 | **Code-complete 2026-07-17:** `prioritizer` skill; dedicated stored thread kind; live Forest/task candidate rail + exact message context; logged self-serve fallback; optional Forest scoring fields with revision-checked mini editor and confirmed AI write-back | M (3–5 days) | **User-run acceptance:** Forest projects **and** active tasks appear as options; selected candidates produce ranked markdown + reasoning; empty selection visibly calls the project/task read tools; Priority Signals edits survive reopen and influence the next run; `agent.prioritize` entries appear in LogPanel |
| **4. Calendar / TODAY (A)** 🔨 | **Code-complete 2026-07-17:** A1–A5; native day timeline/navigation; duration quick-add; placement domain with multi-slot + recurring sessions; Forest/task picker; stored structured planner + ghost-block decisions; planner chat/read/write tools/logging | L (6–9 days) | **User-run acceptance:** schedule the same task twice and confirm both blocks stay joined to one task; try a recurring session and complete only one date; edit/unschedule a block; promote the same Forest milestone twice without duplicate tasks; run “Plan my day” and Accept/Reject ghost blocks; confirm `calendar`, `calendar.placement`, `agent.planner`, and `agent.data` entries in LogPanel |
| **5. Retirement & polish** 🔨 | **Code-complete 2026-07-17:** embedded iframe routes/toggle/shortcut/export removed; stale layout appearances purged; source archived as unimported legacy files; temporary native rollout flags removed; B4 confirmed priority application + focused A5 handoff; retirement retro below | S (1–2 days) | **User-run acceptance:** no ActionDeck toggle or tile returns after relaunch; latest Prioritize result shows both action chips; Apply asks for confirmation and changes live task badges; Schedule opens today, runs the planner around the exact top pick, and leaves an Accept/Reject ghost block; `agent.prioritize` / `agent.planner` entries appear in LogPanel |
| **6. Comprehensive data catalog** 🔨 | **Code-complete 2026-07-17:** expanded the prompt registry from 6 to 21 user-facing object families; added one bounded, read-only `briizos_query_data` tool for 15 lower-frequency domains; added safe file/log service reads, whole-record payload budgets, recursive credential redaction, modality-specific slices, explicit internal-data exclusions, and generated catalog documentation | M | Source reviewed only; automated and in-app testing intentionally not run at user direction. Runtime acceptance remains user-run. |

Order rationale: D unblocks everything; C is the cheapest end-to-end proof of the skill+clarification pattern; B exercises the catalog; A is the largest UI build and lands last, in three sub-steps that are each independently useful.

### Phase 5 retirement retro — 2026-07-17

- **What was retired:** briizOS no longer imports or mounts `ActionDeckColumn`, exposes its Control Bar button or `⌘/Ctrl+Shift+A` shortcut, restores its floating state, or recognizes it as a tile type. A one-time workspace cleanup removes old visible/hidden ActionDeck appearances before paint. The component and stylesheet were renamed to `.legacy` files rather than deleted, so the old implementation remains inspectable without entering the production bundle.
- **What replaced it:** Deck Maker lives on the native Tasks Panel; prioritization lives in the stored `prioritize` chat mode over real Forest projects/tasks; TODAY lives in native Calendar over organizer events plus task placements. All three now use the one local database and the existing log/confirmation surfaces.
- **Legacy data decision:** there is deliberately no migration or deletion of the separate ActionDeck app's records. Its web app can still be used independently. Retired panel preferences and temporary rollout-setting rows may remain inert in an existing SQLite file; the app neither reads nor lists the rollout gates now.
- **Snapshot-read finding:** ActionDeck's `briizos.ts` read `users/{uid}/snapshots/app` directly, outside briizOS's SyncContract. Because the iframe is no longer reachable from briizOS, that legacy Firestore side-channel—and its separate Genkit/Gemini execution path—no longer runs inside briizOS. Native reads now come only from the local data service and are logged as `agent.data`.
- **B4 safety boundary:** the readable ranking carries an invisible exact-ID manifest. Applying priorities is a confirmed write and keeps per-task revision checks (rank 1 → urgent, 2–3 → high, 4–6 → medium, the rest → normal); scheduling sends the exact top pick into the text-only A5 proposal run. No calendar value is written until the user accepts a ghost block, including Forest-project promotion.

## 9. Decisions — resolved 2026-07-16

1. **Prioritizer sources: Forest projects + tasks only.** Organizer `project` items are not a surfaced concept — the Organizer UI itself will be rescoped into a database browser — so nothing new is built on them (see the Organizer-rescope note in §2 D2).
2. **Old ActionDeck data can be lost.** No import, no migration step; iframe retirement is a pure removal.
3. **~~Completing a linked day-block: ask each time~~ — superseded 2026-07-16 by decision 6.** Under the values/appearances model there is no linked copy to reconcile: the block on the calendar *is* the task, so checking it off anywhere is one checkbox and the toast question no longer exists.
4. **Forest scoring fields: yes, as optional fields** — deadline / importance / size / relevance on the Forest project, built in Phase 3; inline-ask remains the fallback when they're empty (see §4).
5. **All AI interactions are stored for now** — every planner / prioritizer / deck run persists as a kind-tagged thread plus its LogPanel entries (see §2 D3). Revisit retention once the Organizer-as-browser rescope makes this history easy to inspect and prune.
6. **Data philosophy: information as value, appearances in context as currency** (user directive, 2026-07-16). Every piece of information is stored once; panels are views, never copies. Encoded in §2 D2 — it reshaped Workstream A (scheduling creates thin placement records; the calendar is a union query) and deleted old decision 3. Follow-up the same day: multi-slot **and recurring** scheduling are regular real-world needs, so the placements table ships in v1 (Phase 4) rather than as a deferred evolution, with session-done vs task-done tracked as two honest facts. Companion fact: Web/Mobile are not connected today, so this reshaping risks no other client.

## 10. What could go wrong (named risks)

- **Prompt-section bloat**: injecting the catalog into every turn costs tokens → mitigated by per-modality slices + a token budget like memory's.
- **Structured planner output is malformed**: validated before render; failure shows an error card, never writes.
- **Project concept drift**: "projects" means Forest projects everywhere; the data catalog states this explicitly so the AI never resurrects organizer `project` items.
- **CalendarModal complexity creep**: mitigated by keeping DayTimeline isolated behind its error boundary while leaving the month-grid data path intact.
- **New placements domain**: additive table, validated inputs, revision-checked like every other domain; task-archive cascades placement-archive inside the service layer (the classic orphan-record bug is prevented at layer 2, not by UI discipline); rollback can leave the additive table safely unused.
- **Iframe removed too early**: resolved by keeping it through native parity and retiring it only in Phase 5; the unimported legacy source remains available for comparison.
