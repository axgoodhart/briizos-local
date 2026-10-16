# briizOS runtime architecture — source notes

Source revision: `5eccc633d948c6487e32e187be9edc0ebcd80200`. Refreshed 15 October 2026. Static comparison with `881061e74f60db796a1ba473fa73414c45d8bcd6`.

The model retains the original runtime map and adds the Islands implementation. `island-ui` remains the diagram node ID for saved links; the label is Islands. CodeGraph tools were unavailable in this session. Source locations come from the repository and the inspected revision diff.

## Read the architecture

A follows an API-key agent turn and task creation. I follows the Islands workspace and its services. D follows direct island auto-tags. B follows screen memory and proposed tasks. J is the separate Execubriiz worker.

Repeated factory, provider and database boxes are the same runtime roles at different call sites. Region boxes mark process or ownership slices; they do not imply extra sandboxes. Click any component for revision-pinned source evidence.

## Islands identity and data migration

The app uses Islands names throughout the renderer, Electron IPC, database and theme selectors. The IslandsPanel.jsx entry mounts IslandsApp and a shared React store. Migration 017 renames saved project tables and task links in place, keeping existing project data available.

Older projects become islands on load, with files grouped into Docs/Code and Media cards and a migration journal entry. No files move. The store serializes version 2; saveIslandState writes the desks/templates view payload through the Islands API.

## Desks, cards and rendering

A desk holds a manual selection or rule-based view of shared islands, with its own camera, positions, dim setting and card visibility. The same island can appear on several desks. Hiding Agent cards only hides their presentation.

Cards cover Monetize, Terminal, Webview, Thoughts/Discussions, Media, Agent, Docs/Code, Goals/Todo, Visual Planning and Ship/Finish. Islands and cards have reusable templates and a chosen main card. Off-screen islands are culled; webviews mount only near the visible area.

## One Islands journal, two entrances

Opening the journal from an island scopes its log and chapter to that project; the calendar retains other islands with faded entries. Opening Islands from the Journals shelf shows all projects through the same store.

This journal reads island entries, shared auto-tag / Hunter changes, milestones, deadlines and ship dates. It does not use the ordinary journal entry tables or Execubriiz worker. Auto-tags retain undo; File Hunter results still require selection.

## Island agents use the task system

An Agent card saves the island, creates a task linked by islandProjectId, then enables automation. The app-window listener obtains the task permission choice and dispatches an accepted run to the main AutomationRunner. Task updates feed the card; pause, resume and answers use the same task.

Closing a desk or hiding Agent cards is not a pause command. The local task entry flow and renderer tools still depend on the main app window. Main-runner existence alone does not prove window-independent completion.

## References, owned documents and archives

Imported files stay where they are and appear as references. FileHawk checks missing paths and can locate moved files. Docs/Code previews originals; its save endpoint restricts writes by a lexical path check beneath userData/Islands. That check is not a symlink-canonicalization claim.

App-created documents live under userData/Islands. Archive creates a dated ZIP under Documents/briizOS Island Archives, copying source files and reporting missing paths. The old consolidate IPC still exists, but Islands uses islandArchiveIsland.

## Terminal and Webview are working cards

Terminal cards call islandTerminalRun directly. Main launches a login shell through /usr/bin/script, streams output, retains a bounded replay buffer, and stops children on app quit. This path does not call ToolContext or the agent terminal approval gate.

Webview cards use persist:island, unload when off-screen, and can restart their linked terminal command when a page fails. Terminal output supports colors and progress, but is not a full terminal emulator for screen-redrawing applications.

## Updated model request adapters

The checked-in profile catalog now includes GPT-6.1 Sol, GPT-6 Luna, Claude 5.5 and Gemini 3.8 Flash; retired IDs include Gemini 3.7 Flash and gemini-omni-flash. These are repository configuration facts, not a claim of current provider availability.

The model factory routes GPT-5.6/GPT-6 through Responses and forwards GPT-6 reasoning through the installed adapter. It rejects none for GPT-6.1 Sol, uses adaptive thinking for Claude 5.5, and omits custom sampling for Gemini. Provider selection and content-consent boundaries remain distinct.

## Renderer ownership

React owns panels, shell layout, appContext and the live tool registry. Main owns structured writes; data:changed reloads renderer state. ThemeProvider/Chromap work from AppCombined.css.

The mounted Sources activity view is the actual log UI in this checkout; AGENTS.md names LogPanel.jsx, but that file is absent. Media playback and recorder session history are distinct features.

## Approval levels are narrower than their labels

Graph ask-always interrupts only tools in DESTRUCTIVE_TOOLS. Renderer ask-always checks requiresConfirmation; read-only tools and openCanvas can proceed. Unknown threads use this same rule, not deny-everything.

ask-destructive lets briizos_* mutations pass the graph; renderer exempts its reversible UI set, while other flagged mutations still ask. no-asking disables confirmation but the renderer still checks configured paths.

## Approval integrity gaps

ToolContext trusts __agentGraphConfirmed to skip confirmation; it is forwarded in renderer params rather than bound to a main-owned one-use authorization. Blacklist checks still precede that flag.

confirmAction invokes the handler directly with edited params; it does not rerun the per-surface gate. bridge.js accepts tool results by requestId without checking reply sender. Raw filesystem/terminal/structured IPC also skips the renderer executor.

## Shell and path gates are heuristic

Renderer isDestructiveCommand returns safe for a recognized first verb before checking compound commands or redirection. Graph parsing examines separators first, but treats node, python, git, curl and other powerful tools as safe verbs.

Blacklists compare strings before main resolves paths. ~/ expansion, .. components and symlinks are not canonicalized by these checks. Shell arguments are not comprehensively governed by the filesystem blacklist. These are code-based limitations, not exploit-test results.

## Screen-text consent has a second route

Briizy assistants require cloudTextAnalysisAllowed and the pixel/path-pattern scan. The main agent tools search_screen_memory and get_recent_activity read saved OCR without that flag, then return it as model-visible tool output.

The egress scanner catches known data URI, image magic, binary buffers and selected POSIX path forms. It is a pattern filter, not a universal prohibition on sensitive text or arbitrary path encodings.

## Capture controls and actual enforcement

Capture defaults off; cloud text analysis defaults off. setConfig({enabled:true}) can start the helper without checking onboardedAt. macOS Screen Recording remains an enforced native gate. Avatar visibility is independent of recording.

Automatic capture defaults to alternating active-window and full-display screenshots. Exclusions examine frontmost metadata; a permitted front window does not exclude other visible windows from the display image.

## Direct calls do not inherit chat policy

Island auto-tags use the shared store queue and Background helpers model route. File-path changes trigger excerpt reads. Tags feed search and desk rules; the journal records changes and offers undo. These direct calls do not enter ToolContext.

A configured model/key is a readiness condition. It does not authorize every external transmission. createChatModel checks profiles/adapters/credentials and rejects Codex subscription calls; it does not centralize content consent.

## Background helpers and routing

The graph adds title, tags, memory extraction and summarization calls when their hook conditions allow. Model selection order is call-site specific; title/memory helpers can inherit the active model ahead of Background routing.

Briizy assistants use their own configured model or app default; base.callModel does not consult the Background route. Execubriiz uses journal model settings, then live/deep AI route, then app default.

## Journal-specific authority

Execubriiz starts with full intensity and unpaused preferences. Private entries are filtered in code; Invisible entries may be supplied to the model and withheld from visible source citations.

Schema/budget/generation/revision/protected/fixed checks govern journal commits. Some content edits apply automatically; structural edits become proposals. Full curation can enqueue web research only when the context has no Invisible material. General chat/task permissions do not govern this worker.

## Embedded content is a weak boundary

Canvas srcDoc permits scripts with same-origin and forms. The URL probe checks its payload/probeId, but not event.origin or event.source. Same-origin scripted content weakens separation from the privileged parent; exact reach is inferred and was not exercised.

Main disables webSecurity and allows insecure content in development, skips CSP injection there, and enables webviewTag. Production CSP still includes unsafe-inline/unsafe-eval. This map does not claim a tested exploit or an isolated canvas security sandbox.

## Codex is a distinct child process

Selecting a Codex profile spawns the installed codex app-server --stdio and uses its ChatGPT OAuth. thread/start and resume request read-only sandbox with approvalPolicy never. Those controls are owned by the installed CLI.

BriizOS forwards text deltas from that provider; this adapter does not wire the renderer tool bridge or dynamic tools. General createChatModel explicitly refuses Codex subscription models.

## Cloud ownership and remote execution

Renderer Firebase Auth supplies UID, project ID and token to CloudGateway. Main checks required fields and confirms rebinding, then uses bearer-authenticated Firestore REST. Server security rules and external web/mobile producers are outside electron/ and src/ evidence.

Primary lease, target device, schema/kind, expiry and deduplication gate command intake. Accepted remote execute_task commands auto-dispatch without a fresh local start approval; task ceiling and subsequent tool interruptions still apply. Device lease coordination uses reads/writes, not an atomic lock.

## Storage and observability

Main initializes userData/briizos.db with better-sqlite3, WAL and foreign keys. Structured writes use transactions/revisions; logs, AI audit, checkpoints, operation receipts and encrypted secrets share this authority. Captured pixels live in the local rewind archive.

safeStorage fails closed when encryption is unavailable for saved secrets. Environment API keys take precedence for model calls. Operation receipts deduplicate effects; they are not human approvals. Graph initial audit storage is required before send, while direct helpers have their own narrower logs.

## External dependencies and dormant code

Runtime packages: Electron + Node, React/ReactDOM, LangGraph/LangChain adapters, Zod, better-sqlite3, Firebase, Tiptap, theme PostCSS, React DnD, Three/GSAP. See package.json and the component source passports.

GitHub REST reads are implemented. Google Drive OAuth/list/download are explicit placeholders. iCloud and USB are mounted filesystem access. Native Studio/site launches are external handoffs. Legacy agent Python and old local-db/Firestore modules exist, but they are not the main agent/persistence paths traced here.

## Scope and evidence limits

Snapshot: electron/ and src/ runtime at revision 5eccc633d948c6487e32e187be9edc0ebcd80200, refreshed 15 October 2026. Runtime changes since 9 October were traced; unchanged source spans retain their established interpretation. Starting pending paths are recorded separately.

Static source analysis. The current HTML is regenerated without the optional verification commands, per project instructions. Prior checks and captures belong only to the archived October 9 artifact.

## Component source passports

### Workspace shell

Grid / floating / hybrid; dock & header

- [src/App.jsx:1315–1347](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1315-L1347)
- [src/App.jsx:1396–1585](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1396-L1585)
- [src/main.jsx:1–17](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/main.jsx#L1-L17)

### Dashboard & Settings

Models, AI routes, permissions & capture

- [src/App.jsx:1680–1703](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1680-L1703)
- [src/components/overlays/DashboardOverlay.jsx:1–15](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/overlays/DashboardOverlay.jsx#L1-L15)
- [src/components/overlays/DashboardOverlay.jsx:49–69](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/overlays/DashboardOverlay.jsx#L49-L69)

### Theme Studio & Chromap

One AppCombined.css; editable theme state

- [src/App.jsx:61–68](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L61-L68)
- [src/theme/ThemeProvider.jsx:1–17](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/theme/ThemeProvider.jsx#L1-L17)
- [src/theme/ThemeProvider.jsx:121–131](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/theme/ThemeProvider.jsx#L121-L131)

### Briizy avatar & quick chat

Separate overlay window; chat proxy — Visibility ≠ capture

- [electron/briizy/shell.js:119–156](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/shell.js#L119-L156)
- [src/components/briizy/BriizyQuickChatController.jsx:22–35](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/briizy/BriizyQuickChatController.jsx#L22-L35)
- [src/briizy/BriizyShell.jsx:1–32](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/briizy/BriizyShell.jsx#L1-L32)

### Interaction & Conversations

Chat, Day, Research, Code, Report

- [src/components/InteractionPanel.jsx:1–33](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/InteractionPanel.jsx#L1-L33)
- [src/App.jsx:1319–1320](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1319-L1320)

### Tasks, Briizify & decks

Prioritization, steps and automation

- [src/components/TasksPanel.jsx:1–31](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/TasksPanel.jsx#L1-L31)
- [src/components/TasksPanel.jsx:550–565](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/TasksPanel.jsx#L550-L565)
- [src/hooks/useTaskAutomation.js:37–62](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useTaskAutomation.js#L37-L62)

### Sources & activity logs

Local files, GitHub, Drive setup & logs

- [src/components/SourcesPanel.jsx:152–198](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/SourcesPanel.jsx#L152-L198)
- [src/components/SourcesPanel.jsx:501–534](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/SourcesPanel.jsx#L501-L534)
- [src/components/SourcesPanel.jsx:590–605](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/SourcesPanel.jsx#L590-L605)

### Journals & Execubriiz

Shelf, floating editor & Islands journal

- [src/components/journals/JournalPanel.jsx:499–516](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/journals/JournalPanel.jsx#L499-L516)
- [src/components/journals/JournalPanel.jsx:598–614](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/journals/JournalPanel.jsx#L598-L614)
- [src/components/journals/ExecubriizView.jsx:1–32](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/journals/ExecubriizView.jsx#L1-L32)

### Notefalls & screen memory

Timeline, proposals, goals and learning

- [src/App.jsx:1336–1337](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1336-L1337)
- [src/components/notefalls/NotefallsPanel.jsx:1–35](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/notefalls/NotefallsPanel.jsx#L1-L35)
- [electron/preload.js:36–59](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/preload.js#L36-L59)

### Islands & File Hunter

Desks → islands → cards; shared journal

- [src/components/islands/IslandsPanel.jsx:1–16](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsPanel.jsx#L1-L16)
- [src/components/islands/IslandsApp.jsx:18–91](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsApp.jsx#L18-L91)
- [src/components/islands/store.js:304–341](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L304-L341)

### Organizer, Calendar & Notes

Projects, placements and sticky notes

- [src/App.jsx:1595–1622](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1595-L1622)
- [src/context/OrganizerContext.jsx:1–35](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/OrganizerContext.jsx#L1-L35)
- [src/hooks/usePlacements.js:1–30](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/usePlacements.js#L1-L30)

### Canvases & Live Canvas

HTML tools / embedded sites / saved tiles

- [src/App.jsx:1339–1347](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1339-L1347)
- [src/App.jsx:1660–1678](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1660-L1678)
- [src/components/canvases/CanvasSurface.jsx:54–78](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/canvases/CanvasSurface.jsx#L54-L78)

### Media & recorder history

Audio/video files; app activity sessions

- [src/App.jsx:1322–1324](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1322-L1324)
- [src/hooks/useRecorder.js:9–39](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useRecorder.js#L9-L39)
- [electron/main.js:729–777](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L729-L777)

### Briiztorm, audit & Bfast

3D projects, AI evidence & notices

- [src/App.jsx:1589–1594](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1589-L1594)
- [src/App.jsx:1608–1610](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1608-L1610)
- [src/App.jsx:1707–1710](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1707-L1710)

### Login & cloud identity

Firebase email/password; local data lives on

- [src/context/AuthContext.jsx:78–106](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/AuthContext.jsx#L78-L106)
- [src/App.jsx:1707–1707](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L1707-L1707)

### Canvas script boundary

Scripts + same-origin + forms permitted — Weak isolation • inferred risk

- [src/components/canvases/CanvasSurface.jsx:31–45](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/canvases/CanvasSurface.jsx#L31-L45)
- [src/components/canvases/CanvasSurface.jsx:58–78](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/canvases/CanvasSurface.jsx#L58-L78)
- [electron/main.js:221–227](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L221-L227)

### A1 • useChat sends

Save input; register chat surface policy — Selected files join prompt

- [src/hooks/useChat.js:771–803](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useChat.js#L771-L803)
- [src/hooks/useChat.js:928–977](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useChat.js#L928-L977)

### A2 • preload window.api

Typed functions invoke Electron IPC — Isolation ≠ authorization

- [electron/preload.js:437–452](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/preload.js#L437-L452)

### A3 • main chat handlers

stream / resume; caller config forwarded — No sender/policy clamp here

- [electron/main.js:915–958](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L915-L958)

### A4 • provider dispatcher

API-key → graph; Codex → app-server

- [electron/agent/index.js:99–124](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/index.js#L99-L124)

### A5 • audit-before-send

Initial audit row required or turn stops — Availability gate, not consent

- [electron/agent/lead-agent.js:783–806](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L783-L806)

### A6 • lead LangGraph

Prompt + tools + hooks; streamEvents v2 — In main process • no AI server

- [electron/agent/lead-agent.js:241–281](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L241-L281)
- [electron/agent/lead-agent.js:940–955](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L940-L955)
- [electron/agent/checkpointer.js:329–350](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/checkpointer.js#L329-L350)

### A7 • createChatModel

Profile / adapter / key must resolve — No universal consent gate

- [electron/agent/models.js:69–99](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L69-L99)
- [electron/agent/models.js:237–314](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L237-L314)
- [electron/agent/models.js:343–390](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L343-L390)

### A8 • model provider

OpenAI / Anthropic / Google; SDK network — Provider output is untrusted

- [electron/agent/models.js:377–390](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L377-L390)
- [electron/agent/lead-agent.js:951–1033](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L951-L1033)

### Agent direct data reads

Catalog includes island cards & journals — Read results can join prompt

- [electron/agent/tools.js:482–530](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L482-L530)
- [electron/agent/tools.js:533–554](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L533-L554)
- [electron/agent/tools.js:594–615](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L594-L615)

### Title, tags & memory hooks

Additional invoke calls; automatic writes — Optional background side calls

- [electron/agent/lead-agent.js:271–280](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L271-L280)
- [electron/agent/title.js:57–89](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/title.js#L57-L89)
- [electron/agent/memory.js:341–360](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/memory.js#L341-L360)

### A9 • registered graph tool

Example: briizos_create_task → registry

- [electron/agent/tools.js:269–280](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L269-L280)
- [electron/agent/tools.js:321–329](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L321-L329)

### A10 • graph tool decision

Deny / pass / interrupt for listed tools — no-asking disables confirmation

- [electron/agent/tools.js:210–258](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L210-L258)
- [electron/agent/tools.js:43–77](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L43-L77)

### A11 • renderer tool IPC

Request ID + params + thread; 60s wait — Reply sender not validated

- [electron/agent/bridge.js:31–40](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/bridge.js#L31-L40)
- [electron/agent/bridge.js:52–75](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/bridge.js#L52-L75)
- [electron/agent/tools.js:272–276](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L272-L276)

### A12 • useToolBridge

Stamp agent flag and originating thread — Keeps graph-confirmed flag

- [src/hooks/useToolBridge.js:45–74](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useToolBridge.js#L45-L74)

### A13 • ToolContext gate

Blacklist; mode + requiresConfirmation — Graph flag skips confirmation

- [src/context/ToolContext.jsx:66–120](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/ToolContext.jsx#L66-L120)
- [src/lib/agentSurfaces.js:131–148](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/agentSurfaces.js#L131-L148)
- [src/lib/permissions.js:27–74](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/permissions.js#L27-L74)

### A14 • tools.js handler

createThoughtStream → localData.tasks — Renderer owns live UI context

- [src/lib/tools.js:24–31](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/tools.js#L24-L31)
- [src/lib/tools.js:607–618](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/tools.js#L607-L618)

### A15 • structured-data IPC

tasks:create forwards validated input — No tool approval at this seam

- [electron/local-data-ipc.js:121–126](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-ipc.js#L121-L126)
- [electron/local-data-ipc.js:187–198](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-ipc.js#L187-L198)

### A16 • LocalDataService

Transaction + revision + changed event — Main owns authoritative writes

- [electron/local-data-service.js:1103–1138](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L1103-L1138)
- [electron/local-data-service.js:1241–1270](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L1241-L1270)
- [electron/local-data-service.js:1145–1152](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L1145-L1152)

### briizos.db • shared authority

Tasks, messages, settings, audit & state — better-sqlite3 • WAL

- [electron/main.js:1142–1170](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1142-L1170)
- [electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L212-L219)

### A17 • data:changed

Domain notification to all app windows

- [electron/local-data-ipc.js:201–206](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-ipc.js#L201-L206)

### A18 • result returns

handler → hook → bridge → graph — Next model sees tool result

- [src/hooks/useToolBridge.js:61–74](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useToolBridge.js#L61-L74)
- [electron/agent/bridge.js:33–39](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/bridge.js#L33-L39)
- [electron/agent/tools.js:272–277](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L272-L277)

### A19 • visible response

Stream text/tools; save assistant output

- [src/hooks/useChat.js:550–567](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useChat.js#L550-L567)
- [src/hooks/useChat.js:807–840](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useChat.js#L807-L840)
- [electron/main.js:915–942](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L915-L942)

### Approval / reject / clarification

Chat resumes graph; tasks can wait — Rejection prevents listed action

- [src/hooks/useChat.js:1069–1097](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useChat.js#L1069-L1097)
- [src/context/ToolContext.jsx:103–117](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/ToolContext.jsx#L103-L117)
- [electron/automation-runner.js:193–202](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L193-L202)

### A20 • task appears

useTasks reloads after domain change

- [src/hooks/useTasks.js:1–100](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useTasks.js#L1-L100)
- [src/components/TasksPanel.jsx:1–31](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/TasksPanel.jsx#L1-L31)

### D1 • Island auto-tag queue

Attached store; changed file-path list — Automatic when AI configured

- [src/components/islands/store.js:1367–1406](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1367-L1406)

### D2 • islandAutoTag IPC

Project paths, names & excerpts request — No chat/task consent check

- [src/components/islands/store.js:1408–1420](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1408-L1420)
- [electron/main.js:1102–1108](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1102-L1108)

### D3 • Island excerpt reader

Read file beginnings within size budgets — No agent blacklist applied

- [electron/island-ai.js:145–189](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L145-L189)
- [electron/island-ai.js:192–222](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L192-L222)

### Project files on this Mac

Plain text/code; actual paths supplied

- [electron/island-ai.js:145–161](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L145-L161)
- [src/components/islands/store.js:1408–1420](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1408-L1420)

### D4 • createChatModel

Background route → profile → key — invoke without LangGraph turn

- [electron/island-ai.js:91–103](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L91-L103)
- [electron/agent/models.js:343–390](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L343-L390)

### D5 • chosen API provider

File excerpts + project metadata leave Mac — Credentials ≠ content consent

- [electron/island-ai.js:212–222](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L212-L222)
- [electron/agent/models.js:377–390](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L377-L390)

### D6 • parse & clean tags

JSON, dedupe, rejection & tag limits

- [electron/island-ai.js:222–241](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L222-L241)

### D7 • Tags & journal change

Merge tags for rules; journal offers undo — No per-tag approval

- [src/components/islands/store.js:1421–1437](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1421-L1437)
- [src/components/islands/store.js:1455–1487](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1455-L1487)
- [src/components/islands/IslandsJournal.jsx:67–85](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsJournal.jsx#L67-L85)

### D8 • Islands autosave IPC

Queued snapshots → islandSaveState

- [src/components/islands/store.js:374–406](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L374-L406)
- [electron/main.js:1048–1052](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1048-L1052)

### D9 • same briizos.db

Islands, desks, cards, templates & journal

- [electron/local-data-service.js:2406–2457](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L2406-L2457)
- [electron/local-data-service.js:2234–2258](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L2234-L2258)

### B1 • capture settings

Capture & cloud-text switches are separate — Both default off

- [electron/preload.js:26–34](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/preload.js#L26-L34)
- [electron/rewind/config.js:75–106](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/config.js#L75-L106)

### B2 • capture privacy gate

Enabled; pause; lock; app/title exclusion — No onboardedAt requirement

- [electron/rewind/indexer.js:461–485](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/indexer.js#L461-L485)
- [electron/rewind/privacy.js:113–157](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/privacy.js#L113-L157)
- [electron/briizy/index.js:261–281](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/index.js#L261-L281)

### B3 • Swift helper child

ScreenCaptureKit + Vision OCR; stdio — OS Screen Recording gate

- [electron/rewind/helper.js:113–132](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/helper.js#L113-L132)
- [electron/briizy-helper/BriizyHelper.swift:454–506](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy-helper/BriizyHelper.swift#L454-L506)

### Mac windows / full display

Frontmost metadata governs exclusions — Display may include other apps

- [electron/rewind/privacy.js:122–157](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/privacy.js#L122-L157)
- [electron/rewind/config.js:83–101](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/config.js#L83-L101)

### B4 • local image archive

Helper writes JPEG; compactor retains media — userData / rewind

- [electron/briizy-helper/BriizyHelper.swift:478–503](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy-helper/BriizyHelper.swift#L478-L503)
- [electron/rewind/storage.js:25–47](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/storage.js#L25-L47)
- [electron/rewind/compactor.js:1–40](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/compactor.js#L1-L40)

### B5 • indexer / retention

Dedup; OCR row; frame event; retention — Main owns row, helper owns file

- [electron/rewind/indexer.js:672–735](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/indexer.js#L672-L735)
- [electron/rewind/indexer.js:736–773](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/indexer.js#L736-L773)

### B6 • assistant coordinator

Stable segment; enabled/quiet/busy/throttle — Drops stale batches

- [electron/briizy/coordinator.js:215–255](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/coordinator.js#L215-L255)
- [electron/briizy/coordinator.js:264–292](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/coordinator.js#L264-L292)

### B7 • same briizos.db

OCR, frame metadata, sessions & search

- [electron/rewind/indexer.js:681–696](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/indexer.js#L681-L696)
- [electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L212-L219)

### B8 • cloud-text consent

Must allow analysis; reject pixel/path forms — Pattern filter, not full DLP

- [electron/briizy/assistants/base.js:131–154](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/base.js#L131-L154)
- [electron/rewind/privacy.js:168–205](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/rewind/privacy.js#L168-L205)

### B9 • task-extraction assistant

OCR-only prompt; parse JSON & confidence

- [electron/briizy/assistants/task-extraction.js:51–75](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/task-extraction.js#L51-L75)

### B10 • createChatModel

Per-assistant model or app default — Does not use Background route

- [electron/briizy/assistants/base.js:163–178](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/base.js#L163-L178)
- [electron/agent/models.js:147–155](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L147-L155)

### B11 • API model provider

Screen OCR + app/title/time; no pixels

- [electron/briizy/assistants/base.js:55–87](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/base.js#L55-L87)
- [electron/briizy/assistants/base.js:138–168](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/base.js#L138-L168)

### B12 • proposals & staged tasks

Assistant writes extraction + proposal rows — Does not create executable task

- [electron/briizy/assistants/task-extraction.js:104–154](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/task-extraction.js#L104-L154)

### B13 • Notefalls / avatar inbox

Present proposal with provenance

- [electron/briizy/assistants/task-extraction.js:137–150](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/task-extraction.js#L137-L150)
- [electron/preload.js:45–49](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/preload.js#L45-L49)

### B14 • accept / dismiss / snooze

Decision IPC marks actor as user — IPC assumes a human decision

- [electron/briizy/index.js:590–623](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/index.js#L590-L623)

### B15 • accepted task

Real task committed after acceptance

- [electron/briizy/index.js:605–623](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/index.js#L605-L623)
- [electron/local-data-service.js:5515–5560](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L5515-L5560)

### B16 • TaskAgent planning

Plan steps; execution separately opt-in

- [electron/briizy/assistants/task-agent.js:84–115](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/briizy/assistants/task-agent.js#L84-L115)

### B17 • AutomationRunner

Task mode clamped to configured ceiling — Only if immediateExecution

- [electron/automation-runner.js:51–69](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L51-L69)
- [electron/automation-runner.js:158–192](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L158-L192)

### B18 • same agent sendMessage

Run → graph; interrupt → waiting for user — Renderer tools need app window

- [electron/agent/index.js:117–124](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/index.js#L117-L124)
- [electron/automation-runner.js:193–208](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L193-L208)

### Consent gap • agent OCR reads

Search/history tools ignore cloud-text flag — Main read tools skip ToolContext

- [electron/agent/tools.js:1461–1504](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L1461-L1504)
- [electron/agent/tools.js:1508–1546](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L1508-L1546)

### Normal graph continuation

OCR results become tool context

- [electron/agent/tools.js:533–554](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L533-L554)
- [electron/agent/lead-agent.js:260–281](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L260-L281)

### Chat model sees OCR result

No Briizy consent check on this path — Consent coverage is incomplete

- [electron/agent/tools.js:1488–1499](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L1488-L1499)
- [electron/agent/lead-agent.js:260–267](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/lead-agent.js#L260-L267)

### Saved screen-text archive

Existing history remains queryable

- [electron/agent/tools.js:1477–1504](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/tools.js#L1477-L1504)

### Execubriiz journal worker

Durable jobs; live / summary / curate — Full, unpaused is initial state

- [electron/execubriiz/runtime.js:17–34](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L17-L34)
- [electron/execubriiz/runtime.js:56–96](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L56-L96)
- [electron/execubriiz/store.js:24–25](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/store.js#L24-L25)

### Journal context & privacy

Private excluded; Invisible sent to model — Separate from chat/task policy

- [electron/execubriiz/runtime.js:115–145](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L115-L145)
- [electron/execubriiz/runtime.js:228–238](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L228-L238)

### Direct journal model stream

Scoped model → live/deep route → default — Bound journal tools only

- [electron/execubriiz/runtime.js:163–193](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L163-L193)
- [electron/execubriiz/model-contract.js:1–50](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/model-contract.js#L1-L50)

### Journal API model provider

Finish/retrieve contract; bounded rounds

- [electron/execubriiz/runtime.js:188–248](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L188-L248)

### Journal board updates

Changed IPC → editor, reactions & status

- [electron/execubriiz/index.js:7–18](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/index.js#L7-L18)
- [src/components/journals/execubriiz-client.js:1–42](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/journals/execubriiz-client.js#L1-L42)

### ExecStore • same briizos.db

Transaction checks generations/revisions — Authoritative commit in main

- [electron/execubriiz/store.js:235–244](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/store.js#L235-L244)
- [electron/execubriiz/store.js:280–285](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/store.js#L280-L285)

### Journal mutation controls

Content may auto-apply; structure proposed — Protected/fixed/revision checks

- [electron/execubriiz/store.js:251–278](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/store.js#L251-L278)
- [electron/execubriiz/runtime.js:250–254](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L250-L254)

### Optional online research

Full curate; block Invisible context — No execution tools granted

- [electron/execubriiz/store.js:278–278](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/store.js#L278-L278)
- [electron/execubriiz/runtime.js:170–175](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/runtime.js#L170-L175)

### Provider web-search APIs

OpenAI / Anthropic / Google search tools — Question leaves Mac

- [electron/execubriiz/search.js:3–21](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/execubriiz/search.js#L3-L21)

### Any exposed renderer caller

window.api has raw file / shell methods — Can skip ToolContext entirely

- [electron/preload.js:355–365](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/preload.js#L355-L365)

### Privileged IPC gap

File / shell handlers trust invocation — No sender/approval recheck

- [electron/main.js:519–550](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L519-L550)
- [electron/local-data-ipc.js:187–198](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-ipc.js#L187-L198)

### Main filesystem / terminal

fs write/delete/move; bash -c spawn — Operation receipt ≠ approval

- [electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent-fs.js#L68-L105)
- [electron/agent-terminal.js:5–25](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent-terminal.js#L5-L25)

### OS files & child shell

User-account filesystem and inherited env — No app command sandbox

- [electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent-fs.js#L68-L105)
- [electron/agent-terminal.js:17–25](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent-terminal.js#L17-L25)

### Codex provider alternative

agent/index branches on profile provider

- [electron/agent/index.js:47–49](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/index.js#L47-L49)
- [electron/agent/index.js:99–105](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/index.js#L99-L105)

### Codex app-server child

Local JSON-RPC over stdio; own OAuth — read-only / approval never

- [electron/codex-provider.js:151–155](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/codex-provider.js#L151-L155)
- [electron/codex-provider.js:399–454](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/codex-provider.js#L399-L454)

### ChatGPT subscription

App-server owns actual model transport — No briizOS tool bridge wired

- [electron/codex-provider.js:429–454](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/codex-provider.js#L429-L454)
- [electron/codex-provider.js:261–275](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/codex-provider.js#L261-L275)

### Same chat stream display

Agent-message deltas → useChat events

- [electron/codex-provider.js:206–215](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/codex-provider.js#L206-L215)
- [electron/agent/index.js:99–105](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/index.js#L99-L105)

### Firebase Auth renderer

ID token + UID handed to main gateway — Cloud identity ≠ local tool approval

- [src/context/AuthContext.jsx:78–106](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/AuthContext.jsx#L78-L106)
- [src/lib/firebase.js:1–40](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/firebase.js#L1-L40)

### Gateway session binding

Require fields; confirm UID rebind — Main trusts supplied token/UID

- [electron/cloud-gateway.js:77–89](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L77-L89)
- [electron/main.js:555–569](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L555-L569)

### CloudGateway in main

Primary lease; target/schema/expiry checks — Remote command auto-dispatch

- [electron/cloud-gateway.js:163–194](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L163-L194)
- [electron/cloud-gateway.js:199–227](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L199-L227)

### Firebase services

Auth + Firestore REST; user collections — Server rules outside this slice

- [electron/cloud-gateway.js:124–142](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L124-L142)
- [electron/cloud-gateway.js:199–227](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L199-L227)
- [src/context/AuthContext.jsx:6–12](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/context/AuthContext.jsx#L6-L12)

### Remote AutomationRunner

Task ceiling applies; no local start prompt — Tool interrupt can stop the run

- [electron/main.js:1171–1181](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1171-L1181)
- [electron/automation-runner.js:51–69](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L51-L69)
- [electron/automation-runner.js:182–202](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/automation-runner.js#L182-L202)

### Local authority / continuity

Tasks, organizer & retainedText snapshots

- [electron/cloud-gateway.js:8–8](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L8-L8)
- [electron/cloud-gateway.js:263–286](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/cloud-gateway.js#L263-L286)
- [electron/main.js:1142–1147](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1142-L1147)

### OS-backed secret encryption

safeStorage protects saved API keys — Environment keys take precedence

- [electron/local-data-service.js:4318–4346](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L4318-L4346)
- [electron/agent/models.js:182–189](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L182-L189)

### Main + renderer logger

Live events + SQLite audit/log history — Logs do not grant authority

- [src/lib/logger.js:143–156](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/logger.js#L143-L156)
- [electron/logger.js:227–236](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/logger.js#L227-L236)
- [electron/main.js:1148–1151](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1148-L1151)

### Sources requests

Local / USB / GitHub; Drive setup UI

- [src/components/SourcesPanel.jsx:1–10](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/SourcesPanel.jsx#L1-L10)
- [electron/main.js:330–346](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L330-L346)
- [electron/main.js:367–428](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L367-L428)

### GitHub adapter in main

REST reads; configured personal token — Token encrypted when saved

- [electron/github.js:22–48](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/github.js#L22-L48)
- [electron/github.js:232–251](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/github.js#L232-L251)

### GitHub REST API

Repos, branches, file contents & search

- [electron/github.js:22–48](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/github.js#L22-L48)
- [electron/github.js:344–357](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/github.js#L344-L357)

### Google Drive placeholder

OAuth, list and download unimplemented — No working Drive service edge

- [electron/gdrive.js:65–88](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/gdrive.js#L65-L88)
- [electron/gdrive.js:120–134](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/gdrive.js#L120-L134)

### Local file / Studio adapters

Folder APIs; Spotlight; app/site launch

- [electron/main.js:330–361](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L330-L361)
- [electron/main.js:1078–1101](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1078-L1101)
- [electron/studio.js:59–78](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/studio.js#L59-L78)

### Mac folders / iCloud / USB

OS APIs and mounted paths; no iCloud API

- [electron/main.js:330–353](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L330-L353)
- [electron/main.js:1230–1237](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1230-L1237)
- [electron/island-ai.js:8–13](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L8-L13)

### Geolocation & Open-Meteo

Header coords → main weather fetch — Credential / OS permission + fallback

- [src/App.jsx:101–147](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/App.jsx#L101-L147)
- [electron/main.js:690–727](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L690-L727)

### Browser sites & Studio apps

Canvas webview or shell.openExternal — Third-party content boundary

- [src/components/canvases/CanvasSurface.jsx:58–78](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/canvases/CanvasSurface.jsx#L58-L78)
- [electron/studio.js:59–78](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/studio.js#L59-L78)

### I1 • Desk view

Manual or rule-based; canvas / stack

- [src/components/islands/store.js:499–575](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L499-L575)
- [src/components/islands/IslandsApp.jsx:64–91](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsApp.jsx#L64-L91)
- [src/components/islands/DeskView.jsx:26–67](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/DeskView.jsx#L26-L67)

### I2 • Island = project

One project may appear on many desks

- [src/components/islands/store.js:181–245](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L181-L245)
- [src/components/islands/store.js:525–553](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L525-L553)

### I3 • Cards inside an island

Main view, content, tools & templates

- [src/components/islands/catalog.js:1–19](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/catalog.js#L1-L19)
- [src/components/islands/store.js:808–835](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L808-L835)
- [src/components/islands/store.js:972–1017](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L972-L1017)

### I4 • Shared React store

State survives layout moves; migrate old — Islands names used throughout the app

- [src/components/islands/store.js:181–245](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L181-L245)
- [src/components/islands/store.js:289–341](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L289-L341)
- [src/components/islands/store.js:353–406](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L353-L406)

### I5 • islandSaveState IPC

Serialize projects, desks & templates

- [src/components/islands/store.js:289–301](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L289-L301)
- [src/components/islands/store.js:381–406](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L381-L406)
- [electron/main.js:1048–1052](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L1048-L1052)

### I6 • LocalDataService

Validate payload; commit transaction

- [electron/local-data-service.js:2326–2360](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L2326-L2360)
- [electron/local-data-service.js:2406–2457](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L2406-L2457)

### I7 • Same briizos.db

island_projects / files / view_state

- [electron/local-data-service.js:2406–2457](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/local-data-service.js#L2406-L2457)

### I8 • Shared Islands journal

Log / calendar / chapters; scoped view — Separate from Execubriiz

- [src/components/islands/IslandsJournal.jsx:26–36](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsJournal.jsx#L26-L36)
- [src/components/islands/IslandsJournal.jsx:88–156](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsJournal.jsx#L88-L156)
- [src/components/islands/IslandsJournal.jsx:189–226](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsJournal.jsx#L189-L226)

### I9 • Agent card starts task

Save island; create task; mark automated

- [src/components/islands/store.js:1274–1320](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1274-L1320)
- [src/lib/taskAutomation.js:17–28](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/lib/taskAutomation.js#L17-L28)

### I10 • Task permission flow

Renderer listener asks; clamps policy — Requires main app window

- [src/hooks/useTaskAutomation.js:146–229](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useTaskAutomation.js#L146-L229)
- [src/hooks/useTaskAutomation.js:552–627](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useTaskAutomation.js#L552-L627)

### I11 • Shared AutomationRunner

Main run → graph → renderer tools — Same authority as path B17 / A

- [src/hooks/useTaskAutomation.js:598–619](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/hooks/useTaskAutomation.js#L598-L619)
- [electron/main.js:586–591](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/main.js#L586-L591)
- [electron/agent/bridge.js:53–65](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/bridge.js#L53-L65)

### I12 • Agent card progress

Task updates, pause, resume & answers

- [src/components/islands/store.js:409–413](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L409-L413)
- [src/components/islands/store.js:1260–1271](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1260-L1271)
- [src/components/islands/store.js:1322–1363](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1322-L1363)

### I13 • Docs / Code card

Preview references; edit owned docs

- [src/components/islands/cards/DocsCard.jsx:44–80](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/DocsCard.jsx#L44-L80)
- [src/components/islands/store.js:1108–1121](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1108-L1121)

### I14 • Workspace file service

Preview / owned write / dated archive — Owned writes use root-path check

- [electron/island-workspace.js:69–137](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L69-L137)
- [electron/island-workspace.js:141–174](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L141-L174)
- [electron/island-workspace.js:324–334](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L324-L334)

### I15 • App-created documents

userData / Islands / project documents

- [electron/island-workspace.js:25–27](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L25-L27)
- [electron/island-workspace.js:65–97](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L65-L97)

### Webview card

Visible page; optional server restart — persist:island browser partition

- [src/components/islands/cards/WebviewCard.jsx:18–39](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/WebviewCard.jsx#L18-L39)
- [src/components/islands/cards/WebviewCard.jsx:81–104](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/WebviewCard.jsx#L81-L104)
- [src/components/islands/cards/WebviewCard.jsx:100–126](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/WebviewCard.jsx#L100-L126)

### Referenced original files

Paths stay in place; FileHawk locates

- [src/components/islands/store.js:1067–1105](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1067-L1105)
- [src/components/islands/store.js:1123–1178](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1123-L1178)
- [electron/island-workspace.js:100–137](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L100-L137)

### Dated ZIP archives

Documents / briizOS Island Archives — Copies; original files stay put

- [electron/island-workspace.js:29–31](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L29-L31)
- [electron/island-workspace.js:141–174](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L141-L174)

### I16 • Terminal card

Run / stop / replay; server restart

- [src/components/islands/cards/TerminalCard.jsx:22–59](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/TerminalCard.jsx#L22-L59)
- [src/components/islands/store.js:1219–1256](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1219-L1256)

### I17 • Main shell service

script → login shell; tracks child PID — Direct IPC; outside ToolContext

- [electron/island-workspace.js:210–232](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L210-L232)
- [electron/island-workspace.js:273–313](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L273-L313)
- [electron/island-workspace.js:324–334](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L324-L334)

### I18 • OS command / server

Command runs in chosen working folder

- [electron/island-workspace.js:196–224](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L196-L224)

### I19 • Terminal output

Stream + bounded replay into card — No full-screen terminal emulator

- [electron/island-workspace.js:234–268](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L234-L268)
- [electron/island-workspace.js:291–305](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-workspace.js#L291-L305)
- [src/components/islands/cards/TerminalCard.jsx:22–48](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/cards/TerminalCard.jsx#L22-L48)

### I20 • File Hunter

Choose description, kinds & date range

- [src/components/islands/store.js:1542–1564](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1542-L1564)

### I21 • Main file search

AI plan/rank; Spotlight or folder walk — Plain matching fallback

- [electron/island-ai.js:510–595](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/island-ai.js#L510-L595)

### I22 • Review found files

Hunter panel + journal; select results — Only chosen results are added

- [src/components/islands/store.js:1566–1584](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1566-L1584)
- [src/components/islands/store.js:1489–1500](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1489-L1500)
- [src/components/islands/IslandsJournal.jsx:67–85](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/IslandsJournal.jsx#L67-L85)

### I23 • Island file cards

Add references; save through same store

- [src/components/islands/store.js:1021–1053](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1021-L1053)
- [src/components/islands/store.js:1489–1500](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/store.js#L1489-L1500)

## Additional revision evidence

- [electron/built-in-models.js:1–48](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/built-in-models.js#L1-L48)
- [electron/agent/models.js:69–99](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L69-L99)
- [electron/agent/models.js:237–314](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/agent/models.js#L237-L314)
- [electron/logger.js:46–61](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/electron/logger.js#L46-L61)
- [src/components/islands/catalog.js:1–19](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/catalog.js#L1-L19)
- [src/components/islands/DeskView.jsx:26–67](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/islands/DeskView.jsx#L26-L67)
- [src/components/journals/JournalPanel.jsx:598–614](https://github.com/axgoodhart/briizos-local/blob/5eccc633d948c6487e32e187be9edc0ebcd80200/src/components/journals/JournalPanel.jsx#L598-L614)
