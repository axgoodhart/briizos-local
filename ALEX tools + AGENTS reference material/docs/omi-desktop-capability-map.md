# Desktop implementation reference and briizOS capability map

## Bottom line

The Omi macOS desktop tree is useful as one source library and architecture reference, not as a product dependency or a definition of briizOS. The feature ideas in this document belong to briizOS's existing product direction; the source is evidence about concrete implementation choices, lifecycle problems, and recovery paths. Its strongest relevant examples are a native always-on surface, Playwright browser bridge, screen/app observation pipeline, local Rewind/OCR store, proactive-assistant coordinator, notification delivery, and typed context-source kernel.

It is not a complete answer as shipped. Current Omi explicitly routes typed global-shortcut input back into its main app; it does not implement a general briizOS-style panel manager or a true macOS alarm; it has no desktop GitHub or iMessage connector; and its model-backed proactivity, identity, chat, profile synthesis, paywall, and telemetry are substantially tied to Omi services.

The repository is MIT-licensed, including permission to use, copy, modify, merge, publish, distribute, sublicense, and sell, provided the copyright and license notice are retained (`omi-main/LICENSE:1-13`; the desktop README also states MIT at `omi-main/desktop/macos/README.md:52-54`). This makes a selective adaptation into a locally owned briizOS runtime viable. It does **not** make Omi's hosted APIs, OAuth identities, or third-party services local; those need to be replaced.

## Capability-by-capability map

| briizOS gap | What Omi actually implements | Assessment for briizOS |
|---|---|---|
| Text input outside the main window | Omi has a Carbon global hotkey manager (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/GlobalShortcutManager.swift:144-180`) and a non-activating, always-on-top `NSPanel` that joins all Spaces (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/FloatingControlBarWindow.swift:65-69`, `:148-161`). A complete floating text composer still exists and sends text plus dropped attachments (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/AskAIInputView.swift:6-26`, `:60-129`). However, the current user-facing shortcut deliberately summons the main Omi app (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/GlobalShortcutManager.swift:367-377`), and the floating manager calls the typed panel "retired" and says every user-facing typed path opens the main app (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/FloatingControlBarWindow.swift:3602-3619`). The floating input remains harness/automation-only, although it can focus without surfacing the main window (`:3617-3648`). | **Architecture present, current product behavior does not satisfy the gap.** Implement the briizOS global text surface using the demonstrated hotkey, non-activating panel, and focused composer pattern, while retaining briizOS's own interaction design and routing policy. |
| Use browsers on the user's behalf | Omi defines supported Chromium-family targets and extension detection, including Chrome, Brave, Edge, Arc, Opera, Chromium, Vivaldi, and Atlas (`omi-main/desktop/macos/Desktop/Sources/BrowserAutomationTarget.swift:4-34`, `:61-191`). It has a browser-extension setup UI and connection verification (`omi-main/desktop/macos/Desktop/Sources/BrowserExtensionSetup.swift:4-34`, `:490-557`). At agent startup it enables browser control only when use is enabled, a token exists, and the bridge extension is installed (`omi-main/desktop/macos/Desktop/Sources/Chat/AgentRuntimeProcess.swift:260-266`, `:2667-2686`). The TypeScript agent then mounts a Playwright MCP server in extension mode (`omi-main/desktop/macos/agent/src/index.ts:1411-1431`). | **Yes, conditionally.** This is the cleanest direct reference for a briizOS browser-control bridge. Preserve explicit setup and token gating, but bind it to briizOS's own agent runtime and browser profile instead of Omi auth. |
| Manage its own workspace/panel space | Omi's floating bar is highly self-managing: it persists position/size (`omi-main/desktop/macos/Desktop/Sources/FloatingControlBar/FloatingControlBarWindow.swift:70-73`), adapts to the physical notch and display, follows the cursor between displays, clamps itself to visible frames, and persists the new origin (`:1258-1317`, `:2400-2463`). It also changes its own window size by conversational state and restores the prior pill position. Its main app has only a basic fixed/minimum layout policy (`omi-main/desktop/macos/Desktop/Sources/MainWindow/DesktopWindowLayoutPolicy.swift:3-22`). No source found exposes general agent tools for arranging arbitrary internal panels or other application windows. | **Partial.** Reuse the robust overlay/display-placement policy. It does not replace the missing briizOS panel-space controller; briizOS still needs first-class panel inventory, geometry, move/resize/tile/close operations, and a layout planner. |
| Set an alarm or reminder | Omi's agent can create an internal action item described as a task/to-do/reminder and accepts `due_at` when the user supplies a time (`omi-main/desktop/macos/agent/src/runtime/omi-tool-manifest.ts:439-452`). A recurring-task scheduler polls every 60 seconds and starts background AI investigation for due recurring tasks (`omi-main/desktop/macos/Desktop/Sources/Services/RecurringTaskScheduler.swift:3-7`, `:22-65`). This is not a native alarm clock and the cited scheduler does not itself fire an alarm at the due time. | **Reminder/task substrate only; no true alarm.** Reuse due dates, recurrence, and notification presentation, but add a local scheduler with durable wake behavior and explicit audible/system notification delivery. |
| React to things it sees the user doing | The local plugin tracks active apps/windows, captures frames, and owns task, insight, memory, and suggestion assistants (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/ProactiveAssistantsPlugin.swift:39-68`). It registers all four assistants, starts an app-switch monitor and capture loop, and captures immediately (`:323-403`). The coordinator detects app/window context changes and notifies every assistant (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/Core/AssistantCoordinator.swift:122-170`, `:229-264`), then distributes frames with per-assistant backpressure and eligibility gates (`:321-359`). The context director waits for dwell, assembles a grounded snapshot and current frame, calls a reasoning model, validates citations, applies quiet/paywall/frequency gates, and presents a floating notification (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/Core/ContextProactivityEngine.swift:131-188`, `:397-437`, `:522-658`). | **Yes; the source demonstrates a working version of an architecture briizOS already needs.** Reuse the implementation knowledge around capture, transitions, assistant pacing, provenance, and notification delivery. Replace the Omi completion lane with a briizOS-owned model adapter. |
| Clearly accessible, modular, selectively included user context | Omi has an internal typed context model with separate `identity`, `memories`, `goals`, `tasks`, `screen`, `workspace`, and `surface` sources (`omi-main/desktop/macos/Desktop/Sources/Chat/AgentBridge.swift:299-313`). Each source is revisioned, outcome-labeled (`available`, `empty`, `unavailable`, `redacted`), size-bounded, and persisted per session (`omi-main/desktop/macos/agent/src/runtime/context-snapshot.ts:30-55`, `:77-199`). Chat refreshes and injects all standard sources automatically each turn (`omi-main/desktop/macos/Desktop/Sources/Providers/ChatProvider.swift:1803-1934`), while the kernel selects source sets by surface/role (`omi-main/desktop/macos/agent/src/runtime/context-snapshot.ts:671-702`). Completed turns can show which sources were admitted (`omi-main/desktop/macos/Desktop/Sources/Chat/MessageMetadata.swift:58-80`, `:113-121`). The inspected send path contains no user-controlled, per-conversation source selection; it builds the standard source list automatically. | **Strong internal contract, incomplete user control.** Use the typed source/revision/outcome design as implementation knowledge, then put a visible briizOS context tray in front of it: source modules, per-conversation toggles, scopes, previews, expiry, and a clear "included in this message" receipt. Automatic wholesale inclusion should not be the only mode. |
| Proactive behavior | Omi runs event/heartbeat capture, observes app and window transitions, extracts candidate tasks/memories/insights/suggestions, can resurface relevant open tasks, and delivers floating cards. The capture layer is change-gated and includes a visual-update fallback (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/ProactiveAssistantsPlugin.swift:110-130`, `:180-204`). The context director supports `suggest`, `insight`, `task_candidate`, `resurface`, or `silence`, with evidence requirements and suppression gates (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/Core/ContextProactivityEngine.swift:40-73`, `:522-607`). | **Yes, but model execution is vendor-bound as written.** The state machine and local evidence ledger are reusable; the Omi HTTP/model call is not. |
| Gmail | Omi reads Gmail through an already signed-in Chromium browser session and Gmail Atom feeds (`omi-main/desktop/macos/Desktop/Sources/GmailReaderService.swift:139-200`). It exposes account/profile selection and prevents a logical read from mixing browser profiles (`omi-main/desktop/macos/Desktop/Sources/Integrations/GmailAccountSelection.swift:9-58`). The Apps page presents Gmail as an import/sync connector (`omi-main/desktop/macos/Desktop/Sources/MainWindow/Pages/AppsPage.swift:770-779`, `:1636-1642`). Its synthesis of emails into memories/tasks is explicitly delegated to an Omi backend (`omi-main/desktop/macos/Desktop/Sources/GmailReaderService.swift:232-250`). | **Read/import exists; action/send is not established here.** The local browser-session reader and account picker are adaptable. Replace backend synthesis locally, and separately add Gmail API/send tools if briizOS should act on mail rather than only learn from it. |
| GitHub | No GitHub connector appears in the macOS Apps connector catalog; GitHub references in desktop source are UI content, release links, or observed page context rather than an account/action integration. A separate MIT-licensed plugin exists outside desktop: it supplies OAuth, repository selection, issue creation/listing, and a `code_feature` tool (`omi-main/plugins/omi-github-app/LICENSE:1-13`; `omi-main/plugins/omi-github-app/main.py:1-6`, `:68-148`; `omi-main/plugins/omi-github-app/github_client.py:9-30`, `:81-111`, `:143-181`). That plugin expects a hosted FastAPI-style service and GitHub OAuth secrets rather than a native local desktop connector. | **Not integrated in Omi desktop, but there is reusable API logic elsewhere in the repo.** Prefer a briizOS-owned GitHub App/PAT connector or the `gh` CLI locally; adapt the plugin's tool schemas and GitHub operations without its Railway/Omi-store assumptions. |
| iMessage | Omi recognizes Messages/iMessage as fast-changing apps for screen observation (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/ProactiveAssistantsPlugin.swift:125-130`) and probes `~/Library/Messages` only as one way to determine Full Disk Access (`omi-main/desktop/macos/Desktop/Sources/Providers/ChatToolExecutor.swift:2570-2582`). No iMessage database reader, message search connector, or send action was found in desktop source. | **No connector.** Screen-based recognition may notice visible commitments, but briizOS still needs an owned `chat.db` reader and a separately permissioned AppleScript/Accessibility send path. |

## Reusable local architecture versus Omi dependencies

### Reuse or adapt locally

- **Native global surface:** Carbon shortcuts, an `NSPanel` that can become key without raising the main window, all-Spaces behavior, cursor-screen tracking, notch/display geometry, and floating-card delivery.
- **Local observation and continuity:** app/window activation monitoring, ScreenCaptureKit capture, idle/change/heartbeat gates, privacy exclusions, local frame provenance, and the local GRDB/SQLite Rewind store. Rewind is explicitly a per-user Application Support database (`omi-main/desktop/macos/Desktop/Sources/Rewind/Core/RewindDatabase.swift:347`); OCR and embedding work are performed by the local indexer (`omi-main/desktop/macos/Desktop/Sources/Rewind/Services/RewindIndexer.swift:24`, `:271-323`).
- **Agent orchestration:** registered proactive assistants, serialized context switches, per-assistant backpressure, grounded notification decisions, task promotion/deduplication, and visible background-agent receipts.
- **Browser control:** browser-target discovery, extension setup, token storage, and conditional Playwright MCP injection.
- **Context kernel:** typed source kinds, semantic revision hashes, outcome states, expiry, per-session persistence, surface-aware projection, delta delivery, and response receipts.
- **Local connectors:** Gmail/Calendar browser-session reading, Apple Notes import, local file indexing, and Obsidian export are useful reference implementations. Keep user-initiated permission boundaries and explicit account/folder selection.

### Replace rather than inherit

- **Omi identity and model credentials:** production/model runtime startup requires Firebase-managed credentials (`omi-main/desktop/macos/Desktop/Sources/Chat/AgentRuntimeCredentialPolicy.swift:3-7`, `:24-44`). briizOS should use local owner identity and user-chosen provider keys or a local model.
- **Omi hosted backends:** production Python and Rust endpoints are hard-coded to Omi domains, with environment overrides mainly available to non-production bundles (`omi-main/desktop/macos/Desktop/Sources/DesktopBackendEnvironment.swift:3-7`, `:68-99`, `:119-153`).
- **Proactivity completion lane:** the director POSTs prompt text and optional screenshot pixels to `/v1/desktop/proactivity/completions` and requires an Omi auth header (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/Core/ProactiveLaneClient.swift:123-151`, `:154-215`). Replace this client with a local interface whose providers can be an on-device model, the user's own API key, or another explicitly selected endpoint.
- **Paywall coupling:** proactive monitoring refuses to start after trial expiry unless Omi's BYOK condition is active (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/ProactiveAssistantsPlugin.swift:259-273`). Remove this policy entirely from a locally owned briizOS implementation.
- **Backend profile synthesis/sync:** the local AI-profile history is useful, but synthesis and sync are delegated to backend endpoints (`omi-main/desktop/macos/Desktop/Sources/ProactiveAssistants/Services/AIUserProfileService.swift:225-260`, `:270-297`). Keep local records and make synthesis provider-pluggable.
- **Telemetry:** the shipped app initializes Sentry and PostHog during startup (`omi-main/desktop/macos/Desktop/Sources/OmiApp.swift:391-444`, `:474-502`; `omi-main/desktop/macos/Desktop/Sources/PostHogManager.swift:4-50`). A private briizOS adaptation should omit these packages/calls or replace them with local diagnostic logs under user control.

## Recommended ownership-oriented port order

1. **External interaction shell:** adapt the global hotkey + non-activating panel + floating composer; wire it directly to briizOS conversations. This is small, visible, and restores the missing "AI is available anywhere" experience.
2. **Browser bridge:** adopt the browser-target/extension/Playwright bridge and expose its availability in the same tool registry briizOS already uses.
3. **Context kernel and tray:** implement Omi-style typed source modules behind a visible briizOS selector. Start with identity, memories, goals, tasks, current screen, recent activity, workspace, Gmail, GitHub, and iMessage.
4. **Local observation spine:** connect briizOS's existing Rewind/Briizy data to an Omi-style app/window transition coordinator, change-gated capture, provenance ledger, privacy exclusions, and per-assistant backpressure.
5. **Proactive delivery:** run task/memory/insight/resurface evaluators through a briizOS-owned provider interface and deliver cards through the global panel. Preserve Omi's evidence, dwell, snooze, deduplication, and quiet-time gates; discard its paywall and auth assumptions.
6. **Actions and connectors:** add durable local reminder/alarm scheduling, Gmail read/send, GitHub operations, and iMessage read/send as separate permissioned tools. Omi provides partial references for Gmail and GitHub, but not complete implementations for the whole set.

The correct reference strategy is therefore **implementation study, not an Omi-shaped briizOS**: learn from the macOS mechanisms and contracts, preserve hard-won lifecycle and recovery lessons where they fit, and implement the briizOS product direction through briizOS-owned interfaces.

## Language-abstracted implementation notebook

This section deliberately describes systems rather than Swift, TypeScript, Electron, or React code. The purpose is to retain implementation knowledge even if briizOS uses a different language, process boundary, UI framework, database, or model provider.

### 1. System-wide AI input

**End-user experience**

The user presses a configurable shortcut from any application. A small text surface appears on the current display, receives focus without opening or raising the main briizOS window, accepts text and attachments, and sends the message into a persistent conversation. Escape dismisses it; sending can leave a compact working indicator and later show the reply in the same surface.

**Abstract components**

- Global shortcut registrar.
- Current-display resolver.
- Non-activating, always-on-top auxiliary window.
- Composer state: draft, attachments, focus, input method composition, sending state.
- Conversation router shared with the main app.
- Compact response and failure presentation.

**Control flow**

1. Register the chosen shortcut and retain the operating-system registration handle.
2. On activation, resolve the display containing the pointer or active window.
3. Create or reuse one auxiliary window; move it into the display's visible frame.
4. Activate only the input surface and focus the editor.
5. Validate that composed text is complete and that either text or attachments exist.
6. Submit through the same conversation service used by the main app.
7. Project streaming, completion, tool confirmation, and failure states back into the auxiliary surface.
8. Persist the draft and conversation identity independently of window visibility.

**State ownership and reliability**

The window does not own the conversation. It renders a shared conversation session and can disappear without cancelling the turn. Shortcut registration must be observable: registration failure, collision, setting changes, and unregistration all need explicit state. Window geometry must be clamped after display changes and restored only when still valid. Omi demonstrates system-wide Carbon registration and collision-aware re-registration (`GlobalShortcutManager.swift:124-180`, `:198-234`), a non-activating panel (`FloatingControlBarWindow.swift:65-69`), all-Spaces behavior (`:148-161`), and a composer that handles input composition, attachment drops, and send validation (`AskAIInputView.swift:6-26`, `:60-147`).

**briizOS implementation implication**

This should be a small native macOS companion window connected to briizOS's existing agent and SQLite thread runtime. Electron can own the conversation; a native helper can own the global shortcut/window if Electron's focus behavior is not reliable enough. The user should experience one AI with two entrances, not a second chat application.

### 2. Persistent floating presence and voice input

**End-user experience**

A small ambient control remains available across Spaces. It can accept text, push-to-talk, or hands-free voice, indicate listening/thinking/speaking, show proactive cards, and expand only for the content currently needed.

**Abstract components**

- One authoritative voice-turn state machine.
- Audio input owner and device router.
- Realtime transport adapter.
- Floating presentation reducer.
- Voice output player.
- Interruption, cancellation, and stale-session gates.

**Control flow**

All voice entry points—global shortcut, mouse button, and automation—enter the same reducer. The reducer owns transitions such as idle → listening → committed → thinking → speaking → idle. Audio capture and transcript persistence must never be duplicated by individual views. Omi explicitly documents that every push-to-talk ingress uses one `PushToTalkManager`, while the realtime controller is the single mutable voice-session owner (`FloatingControlBar/ARCHITECTURE.md:5-16`, `:36-51`).

**Failure handling**

- A second start during an active turn resolves through the reducer rather than opening another microphone.
- Transport replacement ends or migrates the old session before admitting new audio.
- Too-short audio, missing permission, missing device, network failure, and output interruption each become visible states.
- A stale provider callback is rejected when it no longer matches the active session generation.

**briizOS implementation implication**

Voice should be another ingress into the same turn journal used by typed chat. The visual surface can remain uniquely briizOS; the reusable lesson is single ownership of microphones, sessions, and durable turns.

### 3. Browser operation

**End-user experience**

After one explicit setup, the AI can use the browser in which the user is already signed in. It opens a dedicated automation tab, completes browser tasks there, avoids taking over unrelated tabs, reports what it changed, and exposes when browser control is disconnected.

**Abstract components**

- Installed-browser discovery.
- Selected-browser preference.
- Browser extension or debugging-protocol bridge.
- Authenticated handshake token.
- Capability probe.
- Browser automation tool server.
- Per-task tab ownership policy.

**Control flow**

1. Discover supported installed browsers and their profile roots.
2. Let the user choose which browser/profile the assistant may use.
3. Verify the bridge extension and token with a live handshake.
4. Advertise browser tools to the agent only while that handshake is healthy.
5. On the first browser action for a task, create one assistant-owned tab.
6. Route navigation, inspection, typing, clicking, downloading, and screenshots through that tab.
7. Reuse the tab through the task and close or retain it according to an explicit policy.
8. If the bridge disappears, withdraw the capability and return a specific recovery instruction.

Omi's target resolver separates browser discovery from extension readiness (`BrowserAutomationTarget.swift:4-34`, `:61-191`, `:193-275`). Its runtime enables Playwright only when the feature is enabled, the token exists, and the selected browser has the extension (`AgentRuntimeProcess.swift:2667-2686`), then mounts Playwright MCP (`desktop/macos/agent/src/index.ts:1411-1431`). Its agent prompt also instructs browser work to use one dedicated tab rather than hijacking the user's current tab (`ChatProvider.swift:990`).

**briizOS implementation implication**

The browser bridge is a separately permissioned capability, not general execution permission. The network request, browser mutation, and destructive submission boundaries should remain distinguishable in the Log Panel and confirmation system.

### 4. Native macOS operation and messaging

**End-user experience**

The AI can interact with native applications such as Messages, Mail, Notes, Reminders, Calendar, Finder, and third-party desktop apps, while asking before sending, deleting, purchasing, or making other consequential changes.

**Abstract components**

- Application capability registry.
- AppleScript adapter for apps with scripting dictionaries.
- Accessibility adapter for visible controls.
- Screen observation/screenshot verification.
- Read, draft, and execute permission tiers.
- Post-action verifier.

**Control flow**

1. Resolve the requested application and preferred control mechanism.
2. Read current state without mutation when possible.
3. Prepare the intended action and show the exact external effect when confirmation is required.
4. Execute through AppleScript, Accessibility, or browser automation.
5. Verify by reading the resulting state or capturing visible evidence.
6. Record both the requested effect and verified outcome.

Omi's execute-mode prompt identifies Playwright for web apps and AppleScript/System Events for native apps, including Messages, and requires verification before reporting completion (`ProactiveTaskExecute.swift:31-66`). That is evidence of an operational policy, not a complete first-class iMessage connector.

**briizOS implementation implication**

iMessage should become two explicit tools: a local, read-only conversation/search adapter and a separately confirmed send adapter. Visible UI control is a fallback, not the canonical data model. The send tool should never infer a recipient silently when multiple contacts match.

### 5. Observation and searchable continuity

**End-user experience**

When enabled, briizOS remembers what application and work context was visible, lets the user search that history, cites the original moment, and can use recent activity when asked. Excluded apps and paused periods remain genuinely absent.

**Abstract components**

- Active application/window monitor.
- Capture cadence policy.
- Screenshot capture service.
- Duplicate/change detector.
- OCR pipeline.
- Local metadata and media store.
- Full-text and semantic indexes.
- Retention/compaction service.
- Privacy exclusion gate before capture.

**Control flow**

1. Observe app/window activation and idle state.
2. Apply exclusion and pause policy before requesting pixels.
3. Capture on meaningful change plus a bounded heartbeat.
4. Hash the image and discard near-duplicates.
5. Persist provenance: time, app, window, session, dimensions, and storage location.
6. Run OCR and indexing asynchronously with backpressure.
7. Compact old frames while preserving searchable text and evidence pointers.
8. Answer searches with citations to stored frames or sessions.

Omi starts a window monitor, power-aware capture loop, and immediate first capture while registering task, insight, memory, and suggestion assistants (`ProactiveAssistantsPlugin.swift:323-403`). Its Rewind data is local per-user application data and its indexer performs OCR and embedding work (`RewindDatabase.swift:347`; `RewindIndexer.swift:24`, `:271-323`).

**briizOS implementation implication**

briizOS already has a local Swift capture helper, Rewind tables, OCR fields, and Briizy analysis modules. The missing work is not another capture subsystem; it is dependable lifecycle management, indexed retrieval, visible health, and connection to proactive delivery.

### 6. Context transitions, buckets, and workstreams

**End-user experience**

briizOS recognizes that moving from one window to another may be a continuation of the same project or a genuine context change. It accumulates durable understanding of recurring work without treating every screenshot as a new topic.

**Abstract components**

- Context normalizer for app names and window titles.
- Visit state machine with entry, dwell, and departure.
- Context bucket store.
- Fact extractor with provenance.
- Cross-application workstream resolver.
- Freshness and confidence policy.
- Delivery ledger.

**Control flow**

1. Normalize the active app/window identity.
2. Compare it with the current visit and debounce transient switching.
3. Close a qualified departing visit and open the arriving visit.
4. Extract grounded facts from the visit rather than from isolated frames.
5. Merge repeated visits into a context bucket.
6. Bind related buckets across applications to a workstream.
7. Expire, supersede, or reject facts as new evidence arrives.
8. Use bucket and workstream context for retrieval and proactive decisions.

Omi's coordinator serializes context transitions, keeps only the latest transition observed during an in-flight write, and triggers visit-level proactivity (`AssistantCoordinator.swift:8-40`, `:122-237`). Its schema separates visits, buckets, versions, entries, facts, workstreams, candidates, bindings, and deliveries (`ContextBucketSchema.swift:5-18`).

**briizOS implementation implication**

This is a useful missing layer between briizOS's raw frame archive and its long-term memory. It should be implemented in locally owned tables with source-frame/session references and reversible derived facts.

### 7. Proactive decision and delivery

**End-user experience**

The system sometimes stays silent. When it interrupts, the message is timely, grounded in visible evidence, non-repetitive, and actionable. The user can dismiss, snooze, accept, or execute it, and those choices change future behavior.

**Abstract components**

- Trigger sources: context entry/departure, dwell, due task, meeting completion, or periodic review.
- Free preflight gates: enabled state, quiet hours, snooze, recent delivery, available presentation surface.
- Context assembler.
- Decision model returning a closed set such as silence, insight, suggestion, task candidate, or resurfacing.
- Evidence validator.
- Deduplication and budget ledger.
- Delivery surface and outcome recorder.

**Control flow**

1. Receive a qualified trigger rather than reacting to every frame.
2. Run all inexpensive gates before assembling context or calling a model.
3. Reserve a delivery attempt to prevent duplicate concurrent decisions.
4. Assemble current evidence, relevant tasks, recent deliveries, and related workstream facts.
5. Ask the decision model for a typed result that includes grounding.
6. Reject stale, ungrounded, duplicate, or no-longer-permitted results.
7. Deliver through the floating surface or system notification.
8. Record presentation, click, dismissal, snooze, acceptance, and execution outcomes.

Omi's director performs presentation preflight, live gate rebuilding, attempt reservation, task selection, workstream pooling, candidate validation, model evaluation, freshness checks, and delivery suppression (`ContextProactivityEngine.swift:224-430`). Its notification service tracks per-assistant and global throttling and records click/dismiss behavior (`NotificationService.swift:81-119`, `:218-295`).

**briizOS implementation implication**

This logic should run against briizOS's own provider interface and local ledger. No paywall belongs in the gate. The Log Panel should explain both interruptions and important suppressions in plain language.

### 8. Reminders, scheduled actions, and alarms

**End-user experience**

The user can ask for a reminder, an audible alarm, a recurring check, or a future agent action and receive the correct kind of behavior even after the app sleeps or restarts.

**Abstract components**

- Durable schedule table with timezone and recurrence.
- Scheduler that computes the next occurrence.
- Wake/relaunch integration.
- Delivery channel: in-app card, macOS notification, sound, or automated agent run.
- Idempotency key and fired-occurrence ledger.
- Snooze, dismiss, cancel, and reschedule actions.

**Control flow**

1. Parse the requested temporal intent and confirm ambiguous dates or destructive future actions.
2. Store the schedule before acknowledging success.
3. Register the next occurrence with an operating-system-backed or durable wake mechanism.
4. On wake, atomically claim the occurrence using its idempotency key.
5. Deliver the selected alert or start the authorized task.
6. Persist the outcome and compute the next recurrence.

Omi demonstrates due dates, recurring task computation, a 60-second due-task scheduler, and native notification delivery, but not a true alarm contract (`RecurringTaskScheduler.swift:3-65`; `NotificationService.swift:330-360`).

**briizOS implementation implication**

Do not collapse alarms, reminders, calendar events, and automated tasks into one vague tool. They share scheduling infrastructure but have different user promises. An alarm must make noise at the requested time; a reminder must remain visible; a calendar event changes the calendar; an automated task may have external effects and needs stored authorization.

### 9. Connectors: Gmail, Calendar, Apple Notes, GitHub, and iMessage

**End-user experience**

Each service has a visible connection state, a clear account or folder choice, specific readable scopes, separate action permissions, and an explanation when credentials or access expire.

**Abstract connector contract**

- `probe`: report actual current availability, not a saved connected flag.
- `selectIdentity`: choose an account/profile/folder when more than one exists.
- `read`: retrieve bounded normalized records with source identifiers.
- `search`: query without importing everything.
- `import`: optionally derive local context with provenance.
- `act`: draft or mutate externally through a separate permission boundary.
- `verify`: prove the external effect.
- `disconnect`: revoke local credentials and stop future access.

**Implementation notes by service**

- Gmail: Omi reads through an existing Chromium session and Atom feeds, snapshots one selected profile for the whole logical read, and classifies missing browser, missing login, expired session, decryption, and network failures (`GmailReaderService.swift:74-137`, `:139-229`). This is useful reading/import logic, not a complete send integration.
- Google Calendar: its reader similarly distinguishes no browser, not signed in, expired session, cookie decryption, configuration, and network failures rather than reporting one generic error (`CalendarReaderService.swift:43-81`, `:98-217`).
- Apple Notes: it requires an explicit user-initiated read, opens the selected Notes store read-only, and classifies folder/access/schema failures (`AppleNotesReaderService.swift:11-63`, `:116-180`).
- GitHub: the desktop app is not the reference; repository API logic exists in the separate plugin, while briizOS already has a partial token-backed source browser. A first-class connector needs repository search/read plus separately confirmed issue, comment, branch, commit, and pull-request operations.
- iMessage: Omi supplies only native-app automation guidance and visible-screen recognition. briizOS needs a local `chat.db` reader/search index plus a separately confirmed Messages send operation.

### 10. Modular user context and per-conversation composition

**End-user experience**

Before or during a conversation, the user can see what the AI currently knows and choose modules such as identity, people, current priorities, projects, recent activity, screen, files, messages, mail, calendar, journals, or a custom context note. Each module can be included once, pinned to the conversation, scoped, previewed, or excluded.

**Abstract components**

- Typed context-source registry.
- Source outcome: available, empty, unavailable, denied, stale, or redacted.
- Semantic revision hash.
- Size estimate and compaction policy.
- Conversation context manifest.
- Per-message admission receipt.
- Source preview and provenance UI.

**Control flow**

1. Each source provider produces a bounded snapshot plus revision, timestamp, provenance, and outcome.
2. The conversation stores a manifest of selected sources and their scope.
3. Before a turn, refresh only selected or mandatory sources.
4. Compare revisions and transmit only changed material when supported.
5. Apply the context budget visibly, compacting lower-priority sources rather than silently dropping them.
6. Persist exactly which revisions were admitted to the turn.
7. Show that receipt to the user and let them remove or correct context.

Omi provides typed `identity`, `memories`, `goals`, `tasks`, `screen`, `workspace`, and `surface` sources (`AgentBridge.swift:299-313`), revisioned outcome-bearing snapshots (`context-snapshot.ts:30-55`, `:77-199`), and admitted-source receipts (`MessageMetadata.swift:58-80`, `:113-121`). It generally chooses sources automatically by surface (`context-snapshot.ts:671-702`), so the visible modular composer remains a briizOS requirement rather than an Omi feature to reproduce.

### 11. Agent runtime, tools, subagents, and artifacts

**End-user experience**

The assistant can perform multi-step work, show what it is doing, request confirmation at the moment an external effect is proposed, delegate bounded work, and return durable results such as files, drafts, canvases, or task updates.

**Abstract components**

- Durable turn journal.
- Capability registry with availability and risk metadata.
- Tool proposal/authorization/execution/result lifecycle.
- Background run registry.
- Subagent task and receipt model.
- Artifact store with lifecycle states and provenance.
- Recovery/reconciliation process after restart.

**Control flow**

1. Persist the user turn before model execution.
2. Materialize the permitted context and advertised capabilities.
3. Stream model output and tool proposals into the journal.
4. Authorize each proposal against its surface and permission policy.
5. Execute through the capability owner, not through the UI view.
6. Persist results and produced artifacts before rendering completion.
7. Let background/subagent work continue independently of the presenting window.
8. Reconcile incomplete turns and runs after crashes or restarts.

**briizOS implementation implication**

briizOS already has LangGraph threads, checkpoints, tool confirmation, automation runs, and canvases. The notes from Omi are most useful around single runtime ownership, journal-first durability, capability withdrawal when dependencies fail, and artifacts that survive the view which presented them.

### 12. Self-managed briizOS panel space

**End-user experience**

The agent understands every visible panel and can open, close, resize, move, tile, focus, or restore panels to support the current activity without creating overlap, losing work, or surprising the user.

**Abstract components**

- Canonical panel registry and geometry snapshot.
- Layout constraint model.
- Deterministic layout planner.
- Reversible layout command set.
- User lock/pin and preferred-home-position metadata.
- Transactional apply/rollback.

**Control flow**

1. Read the current viewport, panel inventory, minimum sizes, locks, focus, and saved preferences.
2. Convert the agent's semantic intent—such as “show sources beside chat”—into a deterministic layout proposal.
3. Validate bounds, minimum sizes, collisions, and protected panels.
4. Preview or apply the proposal according to permission settings.
5. Persist one layout transaction and retain the previous snapshot for undo.
6. Log the human-readable effect and every adjusted panel.

Omi's floating window contains useful multi-display clamping and self-restoration logic, but its main workspace is not a general panel manager. This capability must be designed around briizOS's existing `LayoutRow`, panel registry, placement data, and floating-shell preferences.

## Cross-cutting patterns worth retaining

| Pattern | Language-independent rule | Why it matters in briizOS |
|---|---|---|
| One owner per scarce resource | One component owns microphone, capture loop, conversation, scheduler claim, or browser tab; views only project state. | Prevents duplicate capture, double sends, competing timers, and inconsistent UI. |
| Capability follows health | Advertise a tool only while its dependency is configured and responding. | The AI cannot promise browser, mail, or capture work that is currently unavailable. |
| Read before effect | Inspect current state, prepare the intended mutation, confirm when needed, execute, then verify. | External actions become dependable and understandable. |
| Durable intent before acknowledgement | Store a message, schedule, task, or command before telling the user it exists. | Restarting cannot erase something the app already claimed to remember. |
| Idempotent execution | Every scheduled occurrence and external command has a stable key and can be claimed once. | Retries do not create duplicate messages, events, tasks, or alarms. |
| Generation/freshness fences | Async results carry the owner/session/context generation that requested them. | Old model, capture, or connector results cannot overwrite current state. |
| Derived knowledge keeps provenance | Every fact, suggestion, task candidate, or memory points to the evidence that produced it. | The user can inspect, correct, forget, or distrust what the system inferred. |
| Silence is a first-class outcome | Proactive evaluation may explicitly decide not to interrupt. | “Proactive” does not become constant notification noise. |
| Suppression before paid work | Run privacy, state, quiet-time, deduplication, and presentation gates before model inference. | Saves resources and avoids generating content that cannot be shown. |
| Presentation is not ownership | Floating bar, main chat, notification, and panel are views of shared durable state. | Work continues and remains accessible when a surface closes. |
| Separate read, network, and execution permission | Being allowed to contact a service is not permission to mutate it; being allowed to read locally is not permission to send externally. | Matches briizOS's intended local ownership and explicit destructive-effect confirmations. |
| Visible operational truth | Connection, permission, capture, model, and scheduler health are user-visible and logged. | The app stops pretending a configured feature is a working feature. |

## Feature inventory for future briizOS planning

| System | Omi implementation knowledge available | briizOS present foundation | Remaining briizOS product work |
|---|---|---|---|
| Global text surface | Strong | Main chat and Electron windowing | Native global shortcut, auxiliary composer, shared turn projection |
| Floating assistant | Strong | Briizy avatar shell | Integrate text, voice, proactive cards, and agent status into one owned surface |
| Voice/PTT | Strong | Model/chat providers, no equivalent unified voice turn found | Single microphone/session state machine and transcript journaling |
| Browser control | Strong | Browser-rendering canvases only | Browser bridge, setup, capability health, dedicated-tab policy |
| Native app operation | Policy and generic automation references | Tool and permission bridges | Typed macOS capabilities, verification, service-specific adapters |
| Screen continuity | Strong | Swift capture helper, Rewind tables, OCR/search tools | Reliable lifecycle, indexing, health, retention, user-facing retrieval |
| Context/workstreams | Strong | Sessions, extractions, memory facts | Visit/bucket/workstream layer connecting evidence to durable context |
| Proactivity | Strong | Briizy assistants and proposal tables | Dependable triggers, local decision provider, delivery, feedback loop |
| Notifications | Strong | In-app toasts/logs | macOS notifications, floating cards, click routes, throttle and snooze |
| Alarms/reminders | Partial | Tasks, calendar, automation | Durable wake scheduler and distinct alarm/reminder/action contracts |
| Gmail | Read/import reference | No first-class connector | Account selection, read/search, local synthesis, draft/send tools |
| Calendar | Read/import and event-tool reference | Calendar UI and schedule data | External calendar account bridge and verified mutations |
| Apple Notes | Strong read/import reference | Internal notes/journals | Explicit local import connector if desired |
| GitHub | Partial plugin/API reference | Token-backed repository source browser | First-class read/action tools and visible connection health |
| iMessage | Generic native automation only | None | Local history/search plus separately confirmed send |
| Modular context | Strong internal contracts, weak user composition | Memory sections and file attachments | Visible per-conversation source mixer and admission receipts |
| Panel management | Overlay geometry only | Layout engine and panel metadata | Deterministic agent-facing layout planner with undo |
| Agent runs/artifacts | Strong lifecycle reference | LangGraph, runs, tools, canvases | Unified journal, durable artifacts, recovery, visible background work |
