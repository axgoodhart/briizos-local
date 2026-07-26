# PLAN — briizy: work memory and background intelligence

*Drafted 2026-07-26. Supersedes `PLAN-BRIIZY-REWIND.md` (kept intact as the original build map) and the GPT spec draft. This document merges them: **Part I is the contract** — invariants, interfaces, defaults, and tests that govern everything below. **Part II is the build map** — omi source to briizOS target, phase by phase. **Part III records which disagreements were settled and how**, so they are not reopened.*

*Source material: `omi-main/desktop` (MIT). Target: briizOS Electron 40 + React 18.*

---

# Part I — Contract

## 0. Verified baseline (checked 2026-07-26)

Both source plans and both assessments carried stale or unverifiable figures. Corrected:

| Claim | Status | Actual |
|---|---|---|
| Migrations run 001–008, so 009/010 are free | **✔** | `electron/local-data/schema/` ends at `008_calendar_placements.sql` |
| "18 → 20 agent tools" | **✘ stale** | `ALL_TOOLS` = 33 `BASE_TOOLS` + `task` = **34 total**; **21** are renderer bridges (`registryName`). The two new tools take it to **36**. |
| "tools.js has 38" | **✘ wrong** | See above. |
| "18 bridged `registryName:` entries" (`BRIIZOS-IMPLEMENTATION-REPORT.md`) | **✘ stale by 3** | 21 today. |
| Notefalls has a dormant auto-capture toggle | **✔ — and considerably more** | Toggle at `NotefallsPanel.jsx:73,121–125`, drawer stub at `:183`. **Plus** the session schema already exists: `forest-db.js:55–58` defines `capture_mode`, `session_start`, `session_end`, `screenshots`; `api.js` seeds posts with `captureMode:'auto'`, `sourceApp`, `sourceIcon`, and real session ranges; `NotefallsPanel.jsx:269` already renders an `auto-capture` badge. |
| Three databases already exist | **✔** | `forest-db.js:10–12` — `userData/forest.db`, `data/briizos-local.db`, agent checkpointer. A fourth is disqualifying. |
| `runs` / `run_events` exist | **✔** | `001_initial.sql:399,418` |
| `acceptCommand` exists | **✔** | `local-data-service.js:3166` |
| `embedded_app_state` exists | **✔** | `001_initial.sql:470` |
| Agent memory system exists | **✔** | `memory_sections` (`key`/`title`/`body`/`position`) and `memory_facts` at `001_initial.sql:360,372`; injection at `system-prompt.js:234–239`, formatting at `:191` |
| "AI has no app-state awareness" gap | **✔** | `BRIIZOS-IMPLEMENTATION-REPORT.md:96` and its auditor note |
| omi sources present | **✔** | `ScreenCaptureService.swift`, `Rewind/Core/{RewindOCRService,RewindDatabase,VideoChunkEncoder,GoalStorage}.swift`, and all six `ProactiveAssistants/Assistants/` directories |
| "Project CLAUDE.md — LogPanel rule, SyncContract, Hard Rule 1" | **✘ not found** | No `CLAUDE.md` or `AGENTS.md` at the briizOS root or in `.claude/`; the only ones in the tree are inside `omi-main/`. The *concepts* are real — SyncContract in `forest-db.js`, `src/lib/syncAdapters.js`, `src/lib/firestore.js`; LogPanel in `src/hooks/useChat.js` and `PLAN-ACTIONDECK-PORT.md` — but they are not a recorded rules file. Treated below as design preferences, not as binding prior rules. |

## 1. Invariants

Non-negotiable. Any phase that cannot be built without breaking one of these stops and gets re-planned.

- **I1 — One briizy.** briizy is the *existing* LangGraph agent, extended. No second intelligence, no second memory, no parallel profile store. The "About me" profile is a row in `memory_sections`, not a blob in `embedded_app_state`; assistant prompts compose with `system-prompt.js`, they do not replace it.
- **I2 — Raw pixels never leave the disk.** Only OCR text plus app name, window title, and timestamp may reach a model provider. No image bytes, no file paths, no base64, ever — enforced by test, not by convention.
- **I3 — One privacy gate, checked first.** A single bundle-ID/window-title filter runs *before* storage, OCR, assistant processing, or any network call. Not one check per consumer. Default denials: password managers, private browsing windows, lock/login screens, plus user-defined app and title patterns.
- **I4 — Electron owns all durable metadata.** Frames index, OCR text, FTS, sessions, proposals, facts, settings — all in the existing migration-backed `briizos-local.db`. The helper owns only the media files it writes. No fourth database.
- **I5 — The helper is supervised, never autonomous.** A persistent child process over stdio, spawned and killed by Electron, with no network access and no ability to act. It exits when the parent dies. Not a daemon, not a socket service, not separately signed.
- **I6 — Accepting a proposal creates a pending, non-automated task.** `status: pending`, `automated: false`, source-linked to the proposal, via the existing `acceptCommand` path. Accepting performs no work. Automation is a separate, explicit act.
- **I7 — Every derived write is reversible and evidenced.** Facts, memories, and summaries carry provenance back to the frame or session that produced them, are visible in a "what briizy learned" log, and can be edited, deleted, or undone.
- **I8 — Storage is bounded by bytes, not only by days.** A hard cap enforced from the first capture, before compaction exists. Oldest frames are pruned when the cap is hit regardless of age.
- **I9 — Screen data never enters Firestore.** New tables stay outside SyncContract, matching the existing local-only treatment in `forest-db.js`.
- **I10 — Nothing is silently enabled.** Capture requires explicit first-run onboarding. The global pause switch stops capture *and* analysis together.

## 2. Interfaces

Validated at the IPC boundary. Frame identifiers are opaque; no archive path is ever returned to the renderer.

**`BriizyConfig`** — `enabled`, `captureIntervalMs`, `retentionDays`, `retentionBytes`, `ocrMode`, `ocrLanguages`, `batteryBehavior`, `excludedBundleIds[]`, `excludedTitlePatterns[]`, `inactivityThresholdMs`, `cloudTextAnalysisAllowed`, `summaryTimeLocal`, and per-assistant `{ enabled, intervalMs, model, prompt, quietHours }`.

**`CaptureState`** — `permissionRequired | paused | capturingWindow | capturingDisplay | unavailable | error`.

**`WorkMemoryQuery`** → `{ text, from, to, apps[], sessionId, limit }`; **`WorkMemoryResult`** → `{ frameId, sessionId, timestamp, appName, windowTitle, snippet, blocks[] }`.

**`BriizyProposal`** — `{ id, kind, urgency, summary, rationale, evidence[], state, snoozeUntil, createdTaskId }` where `state ∈ pending | accepted | dismissed | snoozed | expired`.

**`window.briizy`** — `getStatus`, `getConfig`, `setConfig`, `pause`, `resume`, `startDisplaySession`, `endDisplaySession`, `search`, `getSessionTimeline`, `getFrame`, `deleteHistory`, `decideProposal`.

## 3. Defaults

macOS 14+, Apple Silicon. After onboarding: active-window capture every **3s**; OCR every 3rd frame; retention **30 days or 10 GB, whichever comes first**; fast OCR; OCR deferred on battery; end-of-day summary at **18:00 local**; **all assistants in plan-staging mode** — immediate execution is a per-assistant opt-in, off until trusted; analysis model defaults to the cheapest configured provider.

Retention note: 10 GB is the binding constraint in practice at 3s cadence. The 30-day figure only becomes reachable once Phase 7 compaction lands; until then the byte cap will prune first, and that is the intended behaviour, not a bug.

## 4. Test plan

Unit: privacy exclusions, duplicate detection, OCR normalization, FTS ranking, session grouping, retention pruning under both caps, media recovery, proposal deduplication, fact revision and undo.

Integration: helper handshake and restart, IPC schema validation, Notefalls search-to-frame navigation, migration 009/010 forward-only application and checksum.

Named assertions, each a required test:

1. Intercept every outgoing model request and assert it contains no image bytes, no archive paths, and no text originating from an excluded window. (**I2**, **I3**)
2. Accepting a proposal creates exactly one task with `status: pending`, `automated: false`, and cannot trigger an action. (**I6**)
3. Killing Electron leaves no surviving helper process. (**I5**)
4. With capture disabled or unavailable, existing chat, manual Notefalls posts, tasks, and conversation memory all still work. (**I1**)
5. No new table appears in any Firestore sync adapter. (**I9**)
6. At default cadence on AC power, new OCR is searchable within 30 seconds; backpressure drops obsolete frames rather than queueing them.

Scenario coverage: Screen Recording permission granted, denied, and revoked mid-session; sleep and wake; window hidden and reopened; helper crash; multiple displays; fullscreen Spaces; private browsing; excluded apps; battery OCR deferral; missed end-of-day summary; both clear-history flows.

---

# Part II — Build map

## 5. The constraint

omi's desktop app is native Swift — ScreenCaptureKit, Vision, GRDB, NSWindow overlays, SwiftUI. briizOS is Electron 40 + React 18 + better-sqlite3. Nothing links directly; this is a concept, schema, and pipeline port. The one native artifact is a small Swift helper for the two things macOS does natively and Electron does badly: active-window capture with metadata, and Vision OCR. Vision is hardware-accelerated and effectively free next to a JS OCR engine, which is what makes an always-on loop viable.

Per **I5**, the helper is a **persistent child process speaking newline-delimited JSON over stdio** — not a per-call CLI, and not a signed background daemon. A one-shot binary cannot keep the `SCShareableContent` cache warm and would spawn a process every second just to poll the frontmost window. A daemon buys lifecycle independence nobody wants here.

Both features share one substrate: the capture pipeline produces frames, and Rewind and the assistants both consume them. Build it once, in Phase 1.

## 6. Source → target

| omi source (`omi-main/desktop/Desktop/Sources/`) | What it is | briizOS target |
|---|---|---|
| `ScreenCaptureService.swift` | ScreenCaptureKit active-window capture, JPEG q0.8, max 3000px, AX title resolution with caching | `briizy-helper`, `capture` command |
| `Rewind/Core/RewindOCRService.swift` | Vision OCR → text blocks, normalized boxes, confidence | `briizy-helper`, `ocr` command — near-directly reusable |
| `Rewind/Core/VideoChunkEncoder.swift` | compacts old JPEGs into video chunks | `briizy-helper`, `encode` command (AVAssetWriter / VideoToolbox H.265, replacing omi's broken ffmpeg dependency) + `electron/rewind/compactor.js`. **Phase 7.** |
| `Rewind/Services/RewindIndexer.swift` | capture → storage → OCR orchestration, OCR every 3rd frame, dedup, battery skip | `electron/rewind/indexer.js` |
| `Rewind/Services/PowerMonitor.swift` | pause on battery / low power | folded into the indexer via Electron `powerMonitor` |
| `Rewind/Core/RewindDatabase.swift` | GRDB migrations incl. `screenshots_fts` FTS5 and sync triggers | migration `009_rewind.sql` — better-sqlite3 supports FTS5 |
| `Rewind/Core/RewindStorage.swift`, `RewindModels.swift` | frame records, retention | `localDataService` additions, existing repository pattern |
| `Rewind/Core/GoalRecord.swift`, `GoalStorage.swift` | goal records | `briizy_goals` in `010_briizy.sql` |
| `Rewind/UI/*` | timeline scrubber, search, player | **folded into Notefalls** — see §8 |
| `ProactiveAssistants/Core/AssistantCoordinator.swift` | frame fan-out, throttling, backpressure, context-switch detection | `electron/briizy/coordinator.js` |
| `ProactiveAssistants/Core/WindowMonitor.swift`, `ContextDetection.swift` | app-switch events | `briizy-helper meta` poll each tick |
| `ProactiveAssistants/Core/GeminiClient.swift` | LLM analysis | **already have it** — `electron/agent/models.js` |
| `ProactiveAssistants/Assistants/{Insight,TaskExtraction,MemoryExtraction,Goals,Focus,TaskAgent}` | the six assistants | `electron/briizy/assistants/*.js` |
| `ProactiveAssistants/Services/AIUserProfileService.swift` | AI-maintained profile | **a `memory_sections` row**, coauthored — not a new store (**I1**) |
| `ProactiveAssistants/Services/{Overlay,Notification,AssistantSettings}.swift` | glow overlay, notifications, settings | overlay window IPC, Electron `Notification`, settings in `embedded_app_state` |
| `ProactiveAssistants/UI/*PromptEditorWindow.swift` | editable prompts | prompt editor in Settings, prompts in `embedded_app_state`, reset-to-default |
| `FloatingControlBar/` | docked pill | **not porting** — roaming avatar and bubbles instead |
| omi migration 6 (`proactive_extractions` + FTS) | extraction storage | `010_briizy.sql` |

Excluded from the port: audio and transcription, wearables and BLE, the Rust backend, cloud sync, auth, the agent VM, Firebase, telemetry, paywalls.

## 7. Phase 1 — capture substrate

`scripts/build-briizy-helper.sh` (swiftc, no Xcode project) → `electron/bin/`, gitignored, built at postinstall.

Commands, newline-delimited JSON over stdio:

- `meta` — frontmost app, window title, bounds. Polled each tick (~1s); this is the context-switch signal.
- `capture --out <path>` — active-window JPEG plus metadata.
- `ocr <image>` — `{ fullText, blocks: [{ text, x, y, w, h, confidence }] }`.

`electron/rewind/indexer.js`: capture every ~3s while active, OCR every 3rd frame, skip on dedup (window title + downsampled pixel hash), skip on battery. Frames to `{appData}/briizOS/rewind/frames/YYYY-MM-DD/`. Pruned against **both** caps (**I8**).

The privacy gate (**I3**) is a single module called before capture, not before storage. A frame from an excluded window is never written to disk in the first place. Global pause halts capture and analysis together (**I10**).

Permissions: Screen Recording TCC fires on first capture; Accessibility is optional and improves titles. In development the grant attaches to Electron or the terminal — needs a `run.sh` note. Onboarding copy required (**I10**).

## 8. Phase 2 — storage, search, and Notefalls integration

**Migration `009_rewind.sql`:**

- `rewind_frames(id, captured_at, session_id, app_name, window_title, image_path, media_offset, phash, ocr_status, created_at, deleted_at)`, indexed on `captured_at` and `app_name`
- `rewind_frames_fts` — FTS5 over `(ocr_text, window_title)` with insert/update/delete sync triggers, structured as omi's `createScreenshotsFTS`
- `rewind_ocr_blocks(frame_id, text, x, y, w, h, confidence)` — for match highlighting
- `rewind_sessions(id, started_at, ended_at, kind, top_apps, headline)` — split at day boundaries, sleep/wake, explicit display-session bounds, or the inactivity threshold

**Service layer:** `localDataService` gains `rewind.*` (list by range, FTS search, get frame, prune) → IPC → preload, following the existing repository / `domain_revisions` / `changed`-event pattern. The dormant recorder subsystem (`src/hooks/useRecorder.js`) is the wiring template.

**UI — Notefalls, not a new panel.** The verified baseline settles this: `forest-db.js:55–58` already carries `capture_mode`, `session_start`, `session_end`, and `screenshots`, `api.js` already seeds auto-capture sessions, and `NotefallsPanel.jsx:269` already renders the badge. The work is activation, not construction:

- wire the live toggle at `NotefallsPanel.jsx:73,121–125` to real capture state, with pause/resume, display-session start, storage usage, and settings in the drawer stub at `:183`
- session cards in the existing chronological feed: time range, top apps, thumbnail, generated headline — **one card per session, never one per frame**
- expanding a card opens the existing drawer as an app/window timeline and filmstrip; selecting a segment shows the frame, its OCR text, and any derived facts
- one search field over both manual post text and OCR history; OCR hits group by session and open at the matching frame rather than flooding the feed

**Agent tools:** two additions to `electron/agent/tools.js`, taking `ALL_TOOLS` from **34 to 36** (bridged count stays 21 — these are main-process tools, not renderer bridges):

- `search_screen_memory(query, time_range?)` → FTS results with app, window, and time context
- `get_recent_activity(minutes)` → compact digest of recent frames; this directly closes the app-state awareness gap at `BRIIZOS-IMPLEMENTATION-REPORT.md:96`

## 9. Phase 3 — briizy shell

Second `BrowserWindow` in `electron/main.js`: `transparent`, `frame: false`, `alwaysOnTop: 'screen-saver'`, `hasShadow: false`, `skipTaskbar: true`, `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`.

Click-through by default via `setIgnoreMouseEvents(true, { forward: true })`; the renderer reports pointer-over-avatar and toggles interactivity by IPC. Avatar position animated with GSAP (already a dependency at `package.json:39`). Speech bubbles anchored to the avatar carry title, body, ✓/✗, and an optional "open in briizOS". `briizy:*` IPC namespace: `show-suggestion`, `set-state`, `action-result`, plus settings.

Menu-bar item: Show, Pause/Resume, Start/Stop Display Session, Settings, Quit. Closing the main window hides it and monitoring continues; explicit Quit flushes and stops the helper.

Buildable against stub suggestions in parallel with Phase 2 — it needs the IPC surface, not the engine.

## 10. Phase 4 — coordinator and core assistants

`electron/briizy/coordinator.js`, porting `AssistantCoordinator.swift`'s contract: subscribes to the indexer's frame stream, tracks `(appName, normalizedWindowTitle)`, fires `onContextSwitch` with omi's debounce, throttles per-assistant, and holds a busy-set so frames are **dropped rather than queued** behind a slow call.

Assistants process **context batches after a segment closes**, never once per frame. Contract in `assistants/base.js`: `{ id, interval, onFrame, onContextSwitch, onSegmentClose }`.

1. **`insight.js`** — periodic pass over recent context → suggestions → bubble with ✓/✗.
2. **`task-extraction.js`** — commitments and action items in OCR text → `briizy_staged_tasks` → review. Accept creates a real task via `acceptCommand` (`local-data-service.js:3166`), pending and non-automated (**I6**).
3. **`memory-extraction.js`** — durable facts → dedupe → `memory_facts` under an appropriate `memory_section`, so chat-briizy knows what desktop-briizy saw (**I1**). High-confidence only auto-saves; everything is reversible and evidenced (**I7**).

**"About me"** is a `memory_sections` row, edited directly in Settings, with pipeline-proposed additions shown as accept/reject diffs — never silently written. It reaches prompts through the existing injection path at `system-prompt.js:234–239`; no parallel mechanism.

**Settings and prompts:** per-assistant enable, interval, model, quiet hours, and an editable prompt with reset-to-default.

**Migration `010_briizy.sql`:** `briizy_extractions(id, kind, content, reasoning, context_summary, source_frame_id, source_session_id, status, created_at)` + FTS; `briizy_staged_tasks`; `briizy_proposals` with the `BriizyProposal` state machine and outcome log; `briizy_goals`.

Proposals surface in a quiet Notefalls inbox and a restrained edge rail. Only urgent ones may raise a notification.

**Daily summary:** one Notefalls post at the configured time — activity themes, facts learned, possible commitments, insights, unresolved proposals. If the app was asleep, generated once after the next wake.

## 11. Phase 5 — Goals and Focus

`goals.js` evaluates recent context against active `briizy_goals` and nudges; needs a small goal-setting UI. `focus.js` classifies focused/distracted relative to the active goal, with glow-edge feedback via a dedicated transparent overlay window and session focus stats.

## 12. Phase 6 — TaskAgent

Accepted suggestions can stage a plan into the Tasks panel as a task with `task_steps` sub-steps, where automation is activated through the existing `acceptCommand` flow. Immediate execution through `automation-runner.js` exists but is **off by default** and enabled per-assistant (**I6**, §3). Every autonomous action logs to `runs` / `run_events` (`001_initial.sql:399,418`); tool-confirmation policy and the filesystem blacklist apply unchanged.

## 13. Phase 7 — compaction

`briizy-helper encode` + `electron/rewind/compactor.js`: old JPEGs into H.265 chunks via AVAssetWriter, rolled when display, dimensions, or capture mode change. `rewind_frames.media_offset` already carries the pointer. Tuned against the real disk data that has been accruing since Phase 1. Only after this lands does the 30-day retention target become reachable.

**Only deferral:** OCR embeddings and semantic search. FTS5 keyword matching is the accepted starting condition, and the archive and Notefalls contracts are shaped so semantic search can be added later without changing either.

---

# Part III — Adjudication record

Both plans were assessed by their own author, and each author picked itself. The verdicts therefore cancel; the **concessions** do not, because each one cuts against its author's interest. Seven of nine differences were settled by mutual concession before this merge began.

| # | Question | Resolution | Basis |
|---|---|---|---|
| 1 | Viewer: new Rewind panel or Notefalls? | **Notefalls** | Conceded by A's author, then confirmed much more strongly by the baseline check — the session schema already exists (`forest-db.js:55–58`, `api.js`, `NotefallsPanel.jsx:269`). A second panel would duplicate shipped structure. |
| 2 | Who owns the database? | **Electron owns metadata, FTS, memory, proposals; helper owns media only** | Conceded by B's author. Three databases already exist (`forest-db.js:10–12`); a fourth is disqualifying. |
| 3 | Helper shape | **Persistent stdio child process** | A's own author corrected A's per-call CLI toward a long-lived process; B's daemon minus socket, signing, and heartbeat lands in the same place. |
| 4 | Autonomy default | **Staging-only; immediate execution opt-in** | Conceded by A's author. B had it right. |
| 5 | What reaches the model | **OCR text plus app/window/time only** | Conceded by A's author. The one place A inherited an omi default it should not have. Now **I2**, enforced by test. |
| 6 | Storage bound | **Byte cap from first capture** | Conceded by A's author. Now **I8**. |
| 7 | Verification | **B's test plan, adopted wholesale** | A had none. |
| 8 | Identity and memory | **One briizy; "About me" is a `memory_sections` row** | *Live disagreement, resolved for B.* A's separate profile in `embedded_app_state` alongside the existing agent memory is two memory systems wearing one name. `memory_sections` already has `key`/`title`/`body`/`position` (`001_initial.sql:360`) and an injection path (`system-prompt.js:234–239`), so the fix costs almost nothing now and a great deal later. Now **I1**. |
| 9 | Scope and sequencing | **A's full roster, A's build order, B's discipline** | *Live disagreement, resolved for A.* Scope was already decided — no interim releases, single finish line. B re-opened it. But the orders barely differ: B's steps 1–4 map onto A's phases 1–4, and A already defers Goals/Focus to 5, TaskAgent to 6, compaction to 7. B's own closing line ("keep A as the long-term feature inventory") is a labelling difference. Retention was the real residue: byte cap now, 30-day target after Phase 7. |

**On the decisive argument for A.** A's assessment led with visibility — that B's self-governing helper would be invisible to the LogPanel, citing "the project CLAUDE.md" and "Hard Rule 1." No such file exists for briizOS (see §0). The underlying concern is still sound and is honoured here: every step of the pipeline is orchestrated by the Electron main process and therefore logged. But it was adopted on merit, not on the authority claimed for it.

**What each plan was actually good for.** They are different genres, which is why picking a winner discarded half the material. A is a port map — source file to target file, migration numbers, what is reusable as-is. B is a product spec — invariants, state enums, interface contracts, failure cases. A had no verification story; B had no file map. This document is B's contract governing A's map.

## 14. Open questions

- **Session segmentation threshold.** The inactivity gap that closes a session is configurable, but the default needs calibrating against real captured data — available from Phase 1 onward.
- **Proposal fatigue.** The dismissal log feeds back into prompt context so briizy learns what gets rejected. Whether that is sufficient, or whether a hard daily proposal ceiling is needed, is a Phase 4 tuning question.
- **Overlay over fullscreen apps.** `screen-saver` level plus `visibleOnFullScreen` covers most cases; needs manual testing over fullscreen video and across Spaces.
- **Avatar art.** State sprites (idle, attentive, speaking, working) do not exist in `public/assets/` yet. An asset task, not a code task, but it blocks Phase 3 looking like anything.
- **Stale figures elsewhere.** `BRIIZOS-IMPLEMENTATION-REPORT.md` cites 18 bridged tools; the real count is 21. Worth a refresh pass on that document independently of this plan.
