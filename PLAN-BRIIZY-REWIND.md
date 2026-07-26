# PLAN — briizy + Rewind: porting omi-main into briizOS

*Drafted 2026-07-25. Scope: (1) **briizy**, the roaming agentic background entity, and (2) **Rewind**, snapshot+OCR searchable work memory. Source: `omi-main/desktop`. Target: briizOS Electron/React app.*

*Amended 2026-07-25 (finish-line scope). There are no interim releases — the user will not use the app until it reaches the target condition, so the phases below are **build order only**, not shipping milestones. Final scope includes video-chunk compaction, Goals + Focus assistants (with glow-edge feedback), TaskAgent (immediate execution or plan-staging into the Tasks panel with automation hookup), adjustable settings + editable prompts, and a coauthored "About me" profile. The single remaining deferral is semantic-search embeddings — exact OCR keyword matching confirmed sufficient for start. Note: Rewind's capture substrate accrues real OCR/disk data passively during development, so late-phase pieces (compaction, prompt tuning) can still be calibrated against real data before the finish line.*

---

## 0. The fundamental constraint

omi's desktop app is **native Swift** (ScreenCaptureKit, Apple Vision, GRDB/SQLite, NSWindow overlays, SwiftUI). briizOS is **Electron 40 + React 18 + better-sqlite3**. Nothing links directly. This is a **concept, schema, and pipeline port** — with one deliberate exception: a tiny compiled Swift helper binary for the two things macOS does natively and Electron does badly (screen capture of the active window with metadata, and Vision OCR). The app stays a TypeScript Electron app; the helper is a CLI tool the main process shells out to, like any other subprocess. This is what keeps the always-on loop low-overhead — Vision OCR is hardware-accelerated and effectively free compared to a JS OCR engine.

**Both features share one substrate.** Rewind's capture pipeline produces the frames; briizy's assistants consume the same frames. Build the pipeline once (Phase 1), then both features hang off it.

---

## 1. Source → target map

| omi source (`omi-main/desktop/Desktop/Sources/`) | What it is | briizOS target |
|---|---|---|
| `ScreenCaptureService.swift` (988 ln) | ScreenCaptureKit active-window capture, JPEG q0.8, max 3000px, AX window-title resolution w/ caching | **`briizy-eyes` Swift helper**, `capture` subcommand |
| `Rewind/Core/RewindOCRService.swift` (265 ln) | Vision OCR → text blocks with normalized bounding boxes + confidence | **`briizy-eyes` helper**, `ocr` subcommand (this file is ~directly reusable) |
| `Rewind/Services/RewindIndexer.swift` | capture→storage→OCR orchestration; OCR every 3rd frame, dedup, battery skip | `electron/rewind/indexer.js` (main process) |
| `Rewind/Services/PowerMonitor.swift` | pause on battery/low power | fold into indexer via Electron `powerMonitor` API |
| `Rewind/Core/RewindDatabase.swift` (3000 ln) | GRDB migrations incl. `screenshots_fts` FTS5 + sync triggers | schema migration `009_rewind.sql` (better-sqlite3 supports FTS5) |
| `Rewind/Core/RewindStorage.swift`, `RewindModels.swift` | frame records, retention | `localDataService` additions (repository pattern already in place) |
| `Rewind/Core/VideoChunkEncoder.swift` | compacts old JPEGs into video chunks | **in scope, built last in the Rewind track** — `briizy-eyes encode` subcommand (AVFoundation) + `electron/rewind/compactor.js` background job; JPEG+prune is the interim state during development only |
| `Rewind/Services/OCREmbeddingService.swift` | semantic embeddings over OCR text | **only remaining deferral** — exact keyword FTS confirmed sufficient for start |
| `Rewind/Core/GoalRecord.swift` + `GoalStorage.swift` | goal records backing the Goals assistant | goals table in migration `010_briizy.sql` + `localDataService` methods |
| `Rewind/UI/` (RewindPage, TimelineView, SearchBar, TimelinePlayer, ScreenshotThumbnail) | timeline scrubber + search UI | `src/components/rewind/` React port |
| `ProactiveAssistants/Core/AssistantCoordinator.swift` | frame fan-out, per-assistant throttling, backpressure, context-switch detection | `electron/briizy/coordinator.js` |
| `ProactiveAssistants/Core/WindowMonitor.swift` + `ContextDetection.swift` | app-switch events | frontmost-app polling via `briizy-eyes meta` (cheap, every tick) |
| `ProactiveAssistants/Core/GeminiClient.swift` | LLM analysis of frames | **already have it** — `electron/agent/models.js` (`@langchain/google-genai` et al.) |
| `ProactiveAssistants/Assistants/{Insight,TaskExtraction,MemoryExtraction,Goals,Focus}` + `TaskAgent/` | the six assistants | `electron/briizy/assistants/*.js` |
| `ProactiveAssistants/Services/{OverlayService,NotificationService,AssistantSettings}.swift` | glow overlay, notifications, settings | briizy overlay window IPC + Electron `Notification` + settings in `embedded_app_state` |
| `ProactiveAssistants/Services/AIUserProfileService.swift` | AI-maintained user profile | **"About me" profile** — coauthored by user + insight pipeline, injected into all assistant prompts |
| `ProactiveAssistants/UI/Glow*Window.swift` | edge-glow NSWindows | third transparent overlay window (same pattern as briizy avatar window) for Focus glow feedback |
| `ProactiveAssistants/UI/*PromptEditorWindow.swift` | editable assistant prompts | prompt editor in briizOS Settings, prompts stored in `embedded_app_state` with reset-to-default |
| `FloatingControlBar/` | docked pill window | **not porting** — decision: roaming avatar + bubbles instead |
| omi migration 6 (`proactive_extractions` + FTS) | insight/task/memory extraction storage | schema migration `010_briizy.sql` |

Not in scope from omi: audio/transcription stack, wearables/BLE, Rust backend, cloud sync, auth, agent-cloud VM.

---

## 2. Phase 1 — Capture substrate + `briizy-eyes` helper

The one new native artifact. Single-file Swift CLI, built by `scripts/build-briizy-eyes.sh` (swiftc, no Xcode project), output committed-ignored and produced at postinstall/build time, shipped in `electron/bin/`.

Subcommands (all print JSON to stdout):

- `briizy-eyes meta` — frontmost app name, window title, window bounds. Poll every tick (~1s); this is the context-switch signal (replaces omi's `WindowMonitor`).
- `briizy-eyes capture --out <path>` — active-window JPEG (q0.8, max 3000px) + metadata. Cropped from omi's `ScreenCaptureService.swift`, minus the caching/AX-fallback machinery it needs at 1s cadence (keep the SCShareableContent cache concept; drop Sentry/analytics).
- `briizy-eyes ocr <image>` — Vision OCR → `{ fullText, blocks: [{text, x, y, w, h, confidence}] }`. Port of `RewindOCRService.swift`, which is self-contained.

Electron side, `electron/rewind/indexer.js`, cadence copied from omi:

- capture every ~3s while active (configurable), OCR every 3rd frame, skip on frame-dedup (hash of window title + downsampled pixels), skip on battery via `powerMonitor`
- frames to `{appData}/briizOS/rewind/frames/YYYY-MM-DD/`, pruned by retention setting (default 30 days)
- hard **pause switch** and per-app blacklist (reuse blacklist pattern from `electron/agent-config.js`) — checked before every capture. Exclude briizOS's own window optionally, always exclude password-manager/private-browsing app names by default (omi's `ScreenRecordingPermissionPolicy` is the reference).

Permissions: Screen Recording TCC prompt fires on first capture; Accessibility optional (better window titles). Onboarding copy needed in Settings.

## 3. Phase 2 — Rewind storage, search, UI, agent tool

**Migration `009_rewind.sql`** (follows the checksummed forward-only engine):

- `rewind_frames(id, captured_at, app_name, window_title, image_path, ocr_status, created_at, deleted_at)` + indexes on `captured_at`, `app_name`
- `rewind_frames_fts` — FTS5 virtual table over `(ocr_text, window_title)` with the insert/update/delete sync triggers, structured exactly like omi's `createScreenshotsFTS` migration (RewindDatabase.swift:844-875)
- `rewind_ocr_blocks(frame_id, text, x, y, w, h, confidence)` — kept for search-highlight overlays in the timeline player

**Service layer:** `localDataService` gains `rewind.*` methods (list by time range, search FTS, get frame, prune) → IPC → preload, mirroring the existing repository/`domain_revisions`/`changed`-event pattern. The dormant recorder subsystem (`useRecorder.js`, recorder IPC) is the wiring template — same shape, new domain.

**UI:** `src/components/rewind/` — `RewindView` (timeline scrubber grouped by app/hour, thumbnail strip, keyboard scrub), `RewindSearchBar` (FTS query → result list → jump to frame), frame viewer with OCR-block highlight of matches. Model on omi's `Rewind/UI/*` but native to briizOS panel/theme conventions. Entry: dock button or overlay, wherever ActionDeck conventions put it.

**Agent bridge:** two new tools in `electron/agent/tools.js` (bringing bridged count 18 → 20):

- `search_screen_memory(query, time_range?)` → FTS results with app/window/time context snippets
- `get_recent_activity(minutes)` → compact digest of recent frames (apps, titles, OCR excerpts) — this also directly attacks the "AI has no app-state awareness" gap flagged in BRIIZOS-IMPLEMENTATION-REPORT.md

## 4. Phase 3 — briizy shell (the roaming avatar)

Second `BrowserWindow` created in `electron/main.js` alongside the main window:

- `transparent: true, frame: false, alwaysOnTop: 'screen-saver', hasShadow: false, resizable: false, skipTaskbar: true`, `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`
- **Click-through by default:** `setIgnoreMouseEvents(true, { forward: true })`; renderer reports pointer-over-avatar/bubble via mousemove forwarding and IPC-toggles interactivity on. This is the standard Electron overlay-pet pattern and the equivalent of omi's non-activating NSPanel windows.
- Window sized to a working region (or full-screen overlay with transparent body); avatar position animated in React/GSAP (already a dependency). Avatar art: the robot-planetoid asset (needs export into `public/assets/images/briizy/` — states: idle, attentive, speaking, working).
- **Bubble UI:** speech bubbles anchored to the avatar with title, body, and ✓/✗ (accept/dismiss) plus optional "open in briizOS" — matching the desktop mockups (appointment reminder, "Want to plan some work?", goal banner). Bubble actions IPC back to main.
- `briizy:*` IPC namespace: `briizy:show-suggestion`, `briizy:set-state`, `briizy:action-result`, plus settings (enable/disable, quiet hours, position preference).

## 5. Phase 4 — briizy engine (coordinator + 3 assistants)

`electron/briizy/coordinator.js`, a JS port of `AssistantCoordinator.swift`'s contract:

- subscribes to the Phase-1 indexer's frame stream; tracks `(appName, normalizedWindowTitle)`; fires `onContextSwitch` to all assistants on change (with omi's debounce-delay concept)
- per-assistant `analysisInterval` throttling and a busy-set for backpressure (never queue frames behind a slow LLM call — drop instead), exactly as omi does
- assistant contract (`electron/briizy/assistants/base.js`): `{ id, interval, onFrame(frame, ocr), onContextSwitch(ctx) }` → emits typed events the coordinator routes to outputs

The assistants (full finish-line roster):

1. **Insight/recommendations** (`insight.js`, from `Assistants/Insight/`) — periodic LLM pass over recent context ("user is reading music-theory reddit at 2pm on a work goal day") → suggestion events → briizy bubble with ✓/✗. Accepted suggestions can invoke existing agent tools / `automation-runner.js`.
2. **Task extraction** (`task-extraction.js`, from `Assistants/TaskExtraction/`) — detects commitments/action items in OCR text → staged tasks (staging table, not direct writes) → bubble or in-app review → accept creates real rows in existing tasks/`organizer_items` via `localDataService`.
3. **Memory extraction** (`memory-extraction.js`, from `Assistants/MemoryExtraction/`) — distills durable user facts from screen activity → candidate memories → dedupe → append to the agent memory system (`electron/agent/memory.js`), so chat-Claude in briizOS knows what desktop-briizy has seen.
4. **Goals** (`goals.js`, from `Assistants/Goals/` + `Rewind/Core/GoalStorage.swift`) — user-set goals (e.g. "Deliberate Time Use") stored in a `briizy_goals` table, surfaced as banners/bubbles; the assistant evaluates recent context against active goals and nudges accordingly. Needs a small goal-setting UI in briizOS (Settings or Organizer).
5. **Focus** (`focus.js`, from `Assistants/Focus/`) — focused/distracted classification of recent frames relative to active goal → glow-edge feedback around the active window (green/red) via a dedicated transparent overlay window, plus session focus stats.
6. **TaskAgent** (`task-agent.js`, from `Assistants/TaskAgent/`) — when a suggestion or extracted task is accepted, briizy can **either begin work immediately** (dispatch through the existing agent + `automation-runner.js` run-state machinery) **or stage a plan into the Tasks panel** as a task with sub-steps, where the user completes it manually or flips on automation (the existing `acceptCommand` flow). Every autonomous action logs to the run-event ledger; the existing tool-confirmation and blacklist gates apply.

**"About me" profile** (from `AIUserProfileService.swift`): a living preferences/context document injected into every assistant prompt and the chat agent's system prompt. Coauthored — the user edits it directly in Settings, and the insight/memory pipeline proposes additions (shown as diffs to accept/reject, never silently written). Stored versioned in `embedded_app_state`.

**Settings + custom prompts:** every assistant gets adjustable settings (enable/disable, analysis interval, model choice, quiet hours) and a user-editable prompt with reset-to-default, both in briizOS Settings — the port of omi's `AssistantSettings` + per-assistant prompt-editor windows.

**Migration `010_briizy.sql`** (modeled on omi migration 6 + staged-task storage): `briizy_extractions(id, kind, content, reasoning, context_summary, source_frame_id, status, created_at)` + `briizy_extractions_fts`; `briizy_staged_tasks`; suggestion log with accepted/dismissed outcomes (feedback loop → prompt context, so briizy learns what you dismiss).

Every extraction/suggestion is a logged row — this is the "logging/awareness" half of briizy: a reviewable ledger inside briizOS of what the engine observed, suggested, and did.

## 6. Sequencing & effort shape

Build order (not releases — single finish line at the end):

1. **Phase 1** — `briizy-eyes` + indexer + pause/blacklist. Everything depends on it; once it runs, real capture data accrues passively for later tuning. *(Biggest unknown: swiftc build script + TCC permission flow.)*
2. **Phase 2** — 009 migration, service/IPC, Rewind UI, 2 agent tools. Mechanical; follows established patterns.
3. **Phase 3** — overlay window + avatar + bubbles with stub suggestions (can develop in parallel with Phase 2; only needs IPC, not the engine).
4. **Phase 4** — coordinator + core assistants (insight, task extraction, memory extraction) + 010 migration (incl. goals table), wiring bubbles to real events. Settings + prompt editors land here.
5. **Phase 5** — Goals + Focus assistants: goal-setting UI, goal evaluation, glow-edge overlay window. "About me" profile + coauthoring flow.
6. **Phase 6** — TaskAgent: immediate-execution path through `automation-runner.js` and plan-staging path into the Tasks panel (tasks + `task_steps` sub-steps, automation activation via existing `acceptCommand`).
7. **Phase 7** — video-chunk compaction (`briizy-eyes encode` + compactor job), tuned against the disk data accumulated since Phase 1.

Only deferral: OCR embeddings/semantic search — exact keyword matching is the accepted starting condition.

## 7. Risks & open questions

- **Disk growth:** JPEG-only retention at ~3s cadence is real storage until Phase 7's video compaction lands. Interim (dev-only): aggressive dedup, active-window-only crops, 30-day prune, storage meter in Settings.
- **TaskAgent autonomy:** the immediate-execution path runs unattended agent work. Safeguards: everything routes through the existing run-state machinery (`runs`/`run_events` tables), tool-confirmation policy and filesystem blacklist apply unchanged, and per-assistant settings can force plan-staging-only mode.
- **TCC friction:** Screen Recording permission is app-bundle-scoped; in dev it attaches to Electron/terminal. `run.sh`-style dev note needed.
- **LLM cost/priv:** assistants make periodic model calls on screen content. Default the analysis model to the cheapest configured provider; every prompt/response loggable; pause switch is global (capture AND analysis).
- **Overlay vs. full-screen apps/spaces:** `screen-saver` level + visibleOnFullScreen covers most; needs manual testing over full-screen video.
- **Avatar art:** robot-planetoid state sprites don't exist in `public/assets` yet — asset task, not code.
- **Open decision (deferred, low-stakes):** whether Rewind's viewer lives as a dock-level view or an overlay panel — decide when building Phase 2 UI.
