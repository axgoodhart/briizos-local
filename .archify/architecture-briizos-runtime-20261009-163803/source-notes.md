# briizOS runtime architecture — source notes

Source revision: `881061e74f60db796a1ba473fa73414c45d8bcd6`. Scope: `electron/` and `src/`. Static analysis on 9 October 2026.

The HTML component inspector links to the exact GitHub revision. Repeated model-factory, provider and database boxes denote shared roles at different call sites. Regions denote process or ownership slices rather than added isolation.

## Read the architecture

A is one complete API-key agent turn and renderer task creation. D is the direct Forest createChatModel path. B follows background capture, extraction, review and optional execution. J shows the independent journal worker.
Repeated factory, provider and database boxes are the same runtime roles at different call sites. Region boxes mark process or ownership slices; they do not imply extra sandboxes. Click any component for revision-pinned source evidence.

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

Forest auto-tags reads up to its excerpt budgets and sends project text using the Background helpers route. It has configuration/read budgets and error logs, but no ToolContext approval, agent blacklist or separate file-content egress consent.
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

Snapshot: electron/ and src/ runtime at revision 881061e74f60db796a1ba473fa73414c45d8bcd6, analyzed 9 October 2026. Existing dirty paths are recorded separately; cited source paths were unchanged in the starting worktree.
This is static source analysis. It identifies actual checks, trusted parameters and missing gates without starting the application or executing exploit probes. Diagram artifact validation is separate from application behavior verification.

## Component source passports

### Workspace shell

Grid / floating / hybrid; dock & header

- [src/App.jsx:1315–1347](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1315-L1347)
- [src/App.jsx:1396–1585](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1396-L1585)
- [src/main.jsx:1–17](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/main.jsx#L1-L17)

### Dashboard & Settings

Models, AI routes, permissions & capture

- [src/App.jsx:1680–1703](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1680-L1703)
- [src/components/overlays/DashboardOverlay.jsx:1–15](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/overlays/DashboardOverlay.jsx#L1-L15)
- [src/components/overlays/DashboardOverlay.jsx:49–69](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/overlays/DashboardOverlay.jsx#L49-L69)

### Theme Studio & Chromap

One AppCombined.css; editable theme state

- [src/App.jsx:61–68](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L61-L68)
- [src/theme/ThemeProvider.jsx:1–17](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/theme/ThemeProvider.jsx#L1-L17)
- [src/theme/ThemeProvider.jsx:121–131](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/theme/ThemeProvider.jsx#L121-L131)

### Briizy avatar & quick chat

Separate overlay window; chat proxy — Visibility ≠ capture

- [electron/briizy/shell.js:119–156](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/shell.js#L119-L156)
- [src/components/briizy/BriizyQuickChatController.jsx:22–35](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/briizy/BriizyQuickChatController.jsx#L22-L35)
- [src/briizy/BriizyShell.jsx:1–32](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/briizy/BriizyShell.jsx#L1-L32)

### Interaction & Conversations

Chat, Day, Research, Code, Report

- [src/components/InteractionPanel.jsx:1–33](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/InteractionPanel.jsx#L1-L33)
- [src/App.jsx:1319–1320](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1319-L1320)

### Tasks, Briizify & decks

Prioritization, steps and automation

- [src/components/TasksPanel.jsx:1–31](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/TasksPanel.jsx#L1-L31)
- [src/components/TasksPanel.jsx:550–565](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/TasksPanel.jsx#L550-L565)
- [src/hooks/useTaskAutomation.js:37–62](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useTaskAutomation.js#L37-L62)

### Sources & activity logs

Local files, GitHub, Drive setup & logs

- [src/components/SourcesPanel.jsx:152–198](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/SourcesPanel.jsx#L152-L198)
- [src/components/SourcesPanel.jsx:501–534](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/SourcesPanel.jsx#L501-L534)
- [src/components/SourcesPanel.jsx:590–605](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/SourcesPanel.jsx#L590-L605)

### Journals & Execubriiz

Shelf, floating editor, board and Trash

- [src/App.jsx:1325–1335](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1325-L1335)
- [src/App.jsx:1641–1659](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1641-L1659)
- [src/components/journals/ExecubriizView.jsx:1–32](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/journals/ExecubriizView.jsx#L1-L32)

### Notefalls & screen memory

Timeline, proposals, goals and learning

- [src/App.jsx:1336–1337](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1336-L1337)
- [src/components/notefalls/NotefallsPanel.jsx:1–35](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/notefalls/NotefallsPanel.jsx#L1-L35)
- [electron/preload.js:36–59](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L36-L59)

### Forest & File Hunter

Project files, FileHawk, tags & changes

- [src/components/forest/Forest.jsx:1–35](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/Forest.jsx#L1-L35)
- [src/components/forest/app.js:1587–1609](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1587-L1609)
- [src/App.jsx:1338–1339](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1338-L1339)

### Organizer, Calendar & Notes

Projects, placements and sticky notes

- [src/App.jsx:1595–1622](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1595-L1622)
- [src/context/OrganizerContext.jsx:1–35](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/OrganizerContext.jsx#L1-L35)
- [src/hooks/usePlacements.js:1–30](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/usePlacements.js#L1-L30)

### Canvases & Live Canvas

HTML tools / embedded sites / saved tiles

- [src/App.jsx:1339–1347](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1339-L1347)
- [src/App.jsx:1660–1678](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1660-L1678)
- [src/components/canvases/CanvasSurface.jsx:54–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L54-L78)

### Media & recorder history

Audio/video files; app activity sessions

- [src/App.jsx:1322–1324](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1322-L1324)
- [src/hooks/useRecorder.js:9–39](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useRecorder.js#L9-L39)
- [electron/main.js:728–776](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L728-L776)

### Briiztorm, audit & Bfast

3D projects, AI evidence & notices

- [src/App.jsx:1589–1594](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1589-L1594)
- [src/App.jsx:1608–1610](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1608-L1610)
- [src/App.jsx:1707–1710](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1707-L1710)

### Login & cloud identity

Firebase email/password; local data lives on

- [src/context/AuthContext.jsx:78–106](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/AuthContext.jsx#L78-L106)
- [src/App.jsx:1707–1707](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L1707-L1707)

### Canvas script boundary

Scripts + same-origin + forms permitted — Weak isolation • inferred risk

- [src/components/canvases/CanvasSurface.jsx:31–45](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L31-L45)
- [src/components/canvases/CanvasSurface.jsx:58–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L58-L78)
- [electron/main.js:220–226](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L220-L226)

### A1 • useChat sends

Save input; register chat surface policy — Selected files join prompt

- [src/hooks/useChat.js:771–803](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L771-L803)
- [src/hooks/useChat.js:928–977](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L928-L977)

### A2 • preload window.api

Typed functions invoke Electron IPC — Isolation ≠ authorization

- [electron/preload.js:437–452](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L437-L452)

### A3 • main chat handlers

stream / resume; caller config forwarded — No sender/policy clamp here

- [electron/main.js:914–957](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L914-L957)

### A4 • provider dispatcher

API-key → graph; Codex → app-server

- [electron/agent/index.js:99–124](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L99-L124)

### A5 • audit-before-send

Initial audit row required or turn stops — Availability gate, not consent

- [electron/agent/lead-agent.js:783–806](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L783-L806)

### A6 • lead LangGraph

Prompt + tools + hooks; streamEvents v2 — In main process • no AI server

- [electron/agent/lead-agent.js:241–281](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L241-L281)
- [electron/agent/lead-agent.js:940–955](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L940-L955)
- [electron/agent/checkpointer.js:329–350](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/checkpointer.js#L329-L350)

### A7 • createChatModel

Profile / adapter / key must resolve — No universal consent gate

- [electron/agent/models.js:109–157](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L109-L157)
- [electron/agent/models.js:294–341](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L294-L341)

### A8 • model provider

OpenAI / Anthropic / Google; SDK network — Provider output is untrusted

- [electron/agent/models.js:328–341](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L328-L341)
- [electron/agent/lead-agent.js:951–1033](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L951-L1033)

### Agent direct data reads

Local catalog queries; no renderer gate — Read results can join prompt

- [electron/agent/tools.js:517–538](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L517-L538)
- [electron/agent/tools.js:969–984](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L969-L984)

### Title, tags & memory hooks

Additional invoke calls; automatic writes — Optional background side calls

- [electron/agent/lead-agent.js:271–280](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L271-L280)
- [electron/agent/title.js:57–89](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/title.js#L57-L89)
- [electron/agent/memory.js:341–360](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/memory.js#L341-L360)

### A9 • registered graph tool

Example: briizos_create_task → registry

- [electron/agent/tools.js:269–280](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L269-L280)
- [electron/agent/tools.js:321–329](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L321-L329)

### A10 • graph tool decision

Deny / pass / interrupt for listed tools — no-asking disables confirmation

- [electron/agent/tools.js:210–258](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L210-L258)
- [electron/agent/tools.js:43–77](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L43-L77)

### A11 • renderer tool IPC

Request ID + params + thread; 60s wait — Reply sender not validated

- [electron/agent/bridge.js:31–40](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/bridge.js#L31-L40)
- [electron/agent/bridge.js:52–75](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/bridge.js#L52-L75)
- [electron/agent/tools.js:272–276](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L272-L276)

### A12 • useToolBridge

Stamp agent flag and originating thread — Keeps graph-confirmed flag

- [src/hooks/useToolBridge.js:45–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useToolBridge.js#L45-L74)

### A13 • ToolContext gate

Blacklist; mode + requiresConfirmation — Graph flag skips confirmation

- [src/context/ToolContext.jsx:66–120](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L66-L120)
- [src/lib/agentSurfaces.js:131–148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/agentSurfaces.js#L131-L148)
- [src/lib/permissions.js:27–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/permissions.js#L27-L74)

### A14 • tools.js handler

createThoughtStream → localData.tasks — Renderer owns live UI context

- [src/lib/tools.js:24–31](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/tools.js#L24-L31)
- [src/lib/tools.js:607–618](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/tools.js#L607-L618)

### A15 • structured-data IPC

tasks:create forwards validated input — No tool approval at this seam

- [electron/local-data-ipc.js:121–126](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-ipc.js#L121-L126)
- [electron/local-data-ipc.js:187–198](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-ipc.js#L187-L198)

### A16 • LocalDataService

Transaction + revision + changed event — Main owns authoritative writes

- [electron/local-data-service.js:1103–1138](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1103-L1138)
- [electron/local-data-service.js:1241–1270](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1241-L1270)
- [electron/local-data-service.js:1145–1152](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1145-L1152)

### briizos.db • shared authority

Tasks, messages, settings, audit & state — better-sqlite3 • WAL

- [electron/main.js:1139–1167](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1139-L1167)
- [electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L212-L219)

### A17 • data:changed

Domain notification to all app windows

- [electron/local-data-ipc.js:201–206](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-ipc.js#L201-L206)

### A18 • result returns

handler → hook → bridge → graph — Next model sees tool result

- [src/hooks/useToolBridge.js:61–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useToolBridge.js#L61-L74)
- [electron/agent/bridge.js:33–39](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/bridge.js#L33-L39)
- [electron/agent/tools.js:272–277](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L272-L277)

### A19 • visible response

Stream text/tools; save assistant output

- [src/hooks/useChat.js:550–567](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L550-L567)
- [src/hooks/useChat.js:807–840](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L807-L840)
- [electron/main.js:914–941](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L914-L941)

### Approval / reject / clarification

Chat resumes graph; tasks can wait — Rejection prevents listed action

- [src/hooks/useChat.js:1069–1097](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L1069-L1097)
- [src/context/ToolContext.jsx:103–117](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L103-L117)
- [electron/automation-runner.js:193–202](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L193-L202)

### A20 • task appears

useTasks reloads after domain change

- [src/hooks/useTasks.js:1–100](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useTasks.js#L1-L100)
- [src/components/TasksPanel.jsx:1–31](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/TasksPanel.jsx#L1-L31)

### D1 • Forest tag queue

Mounted board; changed file signature — Automatic when AI configured

- [src/components/forest/app.js:1593–1638](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1593-L1638)

### D2 • forestAutoTag IPC

Project paths, names & excerpts request — No chat/task consent check

- [src/components/forest/app.js:1641–1652](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1641-L1652)
- [electron/main.js:1102–1104](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1102-L1104)

### D3 • Forest excerpt reader

Read file beginnings within size budgets — No agent blacklist applied

- [electron/forest-ai.js:145–189](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L145-L189)
- [electron/forest-ai.js:192–222](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L192-L222)

### Project files on this Mac

Plain text/code; actual paths supplied

- [electron/forest-ai.js:145–161](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L145-L161)
- [src/components/forest/app.js:1643–1651](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1643-L1651)

### D4 • createChatModel

Background route → profile → key — invoke without LangGraph turn

- [electron/forest-ai.js:91–103](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L91-L103)
- [electron/agent/models.js:294–341](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L294-L341)

### D5 • chosen API provider

File excerpts + project metadata leave Mac — Credentials ≠ content consent

- [electron/forest-ai.js:212–222](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L212-L222)
- [electron/agent/models.js:328–341](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L328-L341)

### D6 • parse & clean tags

JSON, dedupe, rejection & tag limits

- [electron/forest-ai.js:222–241](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L222-L241)

### D7 • visible tags added

Merge live tags; add change; repaint — No per-tag approval

- [src/components/forest/app.js:1655–1682](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1655-L1682)

### D8 • Forest autosave IPC

Board state → main setForestState

- [src/components/forest/app.js:543–552](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L543-L552)
- [electron/main.js:1047–1051](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1047-L1051)

### D9 • same briizos.db

Forest projects and board state stored

- [electron/main.js:1047–1051](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1047-L1051)
- [electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L212-L219)

### B1 • capture settings

Capture & cloud-text switches are separate — Both default off

- [electron/preload.js:26–34](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L26-L34)
- [electron/rewind/config.js:75–106](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/config.js#L75-L106)

### B2 • capture privacy gate

Enabled; pause; lock; app/title exclusion — No onboardedAt requirement

- [electron/rewind/indexer.js:461–485](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/indexer.js#L461-L485)
- [electron/rewind/privacy.js:113–157](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L113-L157)
- [electron/briizy/index.js:261–281](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/index.js#L261-L281)

### B3 • Swift helper child

ScreenCaptureKit + Vision OCR; stdio — OS Screen Recording gate

- [electron/rewind/helper.js:113–132](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/helper.js#L113-L132)
- [electron/briizy-helper/BriizyHelper.swift:454–506](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy-helper/BriizyHelper.swift#L454-L506)

### Mac windows / full display

Frontmost metadata governs exclusions — Display may include other apps

- [electron/rewind/privacy.js:122–157](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L122-L157)
- [electron/rewind/config.js:83–101](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/config.js#L83-L101)

### B4 • local image archive

Helper writes JPEG; compactor retains media — userData / rewind

- [electron/briizy-helper/BriizyHelper.swift:478–503](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy-helper/BriizyHelper.swift#L478-L503)
- [electron/rewind/storage.js:25–47](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/storage.js#L25-L47)
- [electron/rewind/compactor.js:1–40](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/compactor.js#L1-L40)

### B5 • indexer / retention

Dedup; OCR row; frame event; retention — Main owns row, helper owns file

- [electron/rewind/indexer.js:672–735](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/indexer.js#L672-L735)
- [electron/rewind/indexer.js:736–773](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/indexer.js#L736-L773)

### B6 • assistant coordinator

Stable segment; enabled/quiet/busy/throttle — Drops stale batches

- [electron/briizy/coordinator.js:215–255](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/coordinator.js#L215-L255)
- [electron/briizy/coordinator.js:264–292](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/coordinator.js#L264-L292)

### B7 • same briizos.db

OCR, frame metadata, sessions & search

- [electron/rewind/indexer.js:681–696](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/indexer.js#L681-L696)
- [electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L212-L219)

### B8 • cloud-text consent

Must allow analysis; reject pixel/path forms — Pattern filter, not full DLP

- [electron/briizy/assistants/base.js:131–154](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/base.js#L131-L154)
- [electron/rewind/privacy.js:168–205](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L168-L205)

### B9 • task-extraction assistant

OCR-only prompt; parse JSON & confidence

- [electron/briizy/assistants/task-extraction.js:51–75](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/task-extraction.js#L51-L75)

### B10 • createChatModel

Per-assistant model or app default — Does not use Background route

- [electron/briizy/assistants/base.js:163–178](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/base.js#L163-L178)
- [electron/agent/models.js:113–121](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L113-L121)

### B11 • API model provider

Screen OCR + app/title/time; no pixels

- [electron/briizy/assistants/base.js:55–87](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/base.js#L55-L87)
- [electron/briizy/assistants/base.js:138–168](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/base.js#L138-L168)

### B12 • proposals & staged tasks

Assistant writes extraction + proposal rows — Does not create executable task

- [electron/briizy/assistants/task-extraction.js:104–154](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/task-extraction.js#L104-L154)

### B13 • Notefalls / avatar inbox

Present proposal with provenance

- [electron/briizy/assistants/task-extraction.js:137–150](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/task-extraction.js#L137-L150)
- [electron/preload.js:45–49](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L45-L49)

### B14 • accept / dismiss / snooze

Decision IPC marks actor as user — IPC assumes a human decision

- [electron/briizy/index.js:590–623](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/index.js#L590-L623)

### B15 • accepted task

Real task committed after acceptance

- [electron/briizy/index.js:605–623](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/index.js#L605-L623)
- [electron/local-data-service.js:5499–5544](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L5499-L5544)

### B16 • TaskAgent planning

Plan steps; execution separately opt-in

- [electron/briizy/assistants/task-agent.js:84–115](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/task-agent.js#L84-L115)

### B17 • AutomationRunner

Task mode clamped to configured ceiling — Only if immediateExecution

- [electron/automation-runner.js:51–69](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L51-L69)
- [electron/automation-runner.js:158–192](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L158-L192)

### B18 • same agent sendMessage

Run → graph; interrupt → waiting for user — Renderer tools need app window

- [electron/agent/index.js:117–124](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L117-L124)
- [electron/automation-runner.js:193–208](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L193-L208)

### Consent gap • agent OCR reads

Search/history tools ignore cloud-text flag — Main read tools skip ToolContext

- [electron/agent/tools.js:1445–1488](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1445-L1488)
- [electron/agent/tools.js:1492–1530](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1492-L1530)

### Normal graph continuation

OCR results become tool context

- [electron/agent/tools.js:517–538](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L517-L538)
- [electron/agent/lead-agent.js:260–281](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L260-L281)

### Chat model sees OCR result

No Briizy consent check on this path — Consent coverage is incomplete

- [electron/agent/tools.js:1472–1483](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1472-L1483)
- [electron/agent/lead-agent.js:260–267](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L260-L267)

### Saved screen-text archive

Existing history remains queryable

- [electron/agent/tools.js:1461–1488](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1461-L1488)

### Execubriiz journal worker

Durable jobs; live / summary / curate — Full, unpaused is initial state

- [electron/execubriiz/runtime.js:17–34](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L17-L34)
- [electron/execubriiz/runtime.js:56–96](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L56-L96)
- [electron/execubriiz/store.js:24–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L24-L25)

### Journal context & privacy

Private excluded; Invisible sent to model — Separate from chat/task policy

- [electron/execubriiz/runtime.js:115–145](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L115-L145)
- [electron/execubriiz/runtime.js:228–238](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L228-L238)

### Direct journal model stream

Scoped model → live/deep route → default — Bound journal tools only

- [electron/execubriiz/runtime.js:163–193](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L163-L193)
- [electron/execubriiz/model-contract.js:1–50](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/model-contract.js#L1-L50)

### Journal API model provider

Finish/retrieve contract; bounded rounds

- [electron/execubriiz/runtime.js:188–248](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L188-L248)

### Journal board updates

Changed IPC → editor, reactions & status

- [electron/execubriiz/index.js:7–18](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/index.js#L7-L18)
- [src/components/journals/execubriiz-client.js:1–42](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/journals/execubriiz-client.js#L1-L42)

### ExecStore • same briizos.db

Transaction checks generations/revisions — Authoritative commit in main

- [electron/execubriiz/store.js:235–244](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L235-L244)
- [electron/execubriiz/store.js:280–285](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L280-L285)

### Journal mutation controls

Content may auto-apply; structure proposed — Protected/fixed/revision checks

- [electron/execubriiz/store.js:251–278](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L251-L278)
- [electron/execubriiz/runtime.js:250–254](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L250-L254)

### Optional online research

Full curate; block Invisible context — No execution tools granted

- [electron/execubriiz/store.js:278–278](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L278-L278)
- [electron/execubriiz/runtime.js:170–175](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L170-L175)

### Provider web-search APIs

OpenAI / Anthropic / Google search tools — Question leaves Mac

- [electron/execubriiz/search.js:3–21](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/search.js#L3-L21)

### Any exposed renderer caller

window.api has raw file / shell methods — Can skip ToolContext entirely

- [electron/preload.js:355–365](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L355-L365)

### Privileged IPC gap

File / shell handlers trust invocation — No sender/approval recheck

- [electron/main.js:518–549](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L518-L549)
- [electron/local-data-ipc.js:187–198](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-ipc.js#L187-L198)

### Main filesystem / terminal

fs write/delete/move; bash -c spawn — Operation receipt ≠ approval

- [electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-fs.js#L68-L105)
- [electron/agent-terminal.js:5–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-terminal.js#L5-L25)

### OS files & child shell

User-account filesystem and inherited env — No app command sandbox

- [electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-fs.js#L68-L105)
- [electron/agent-terminal.js:17–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-terminal.js#L17-L25)

### Codex provider alternative

agent/index branches on profile provider

- [electron/agent/index.js:47–49](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L47-L49)
- [electron/agent/index.js:99–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L99-L105)

### Codex app-server child

Local JSON-RPC over stdio; own OAuth — read-only / approval never

- [electron/codex-provider.js:151–155](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L151-L155)
- [electron/codex-provider.js:399–454](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L399-L454)

### ChatGPT subscription

App-server owns actual model transport — No briizOS tool bridge wired

- [electron/codex-provider.js:429–454](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L429-L454)
- [electron/codex-provider.js:261–275](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L261-L275)

### Same chat stream display

Agent-message deltas → useChat events

- [electron/codex-provider.js:206–215](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L206-L215)
- [electron/agent/index.js:99–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L99-L105)

### Firebase Auth renderer

ID token + UID handed to main gateway — Cloud identity ≠ local tool approval

- [src/context/AuthContext.jsx:78–106](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/AuthContext.jsx#L78-L106)
- [src/lib/firebase.js:1–40](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/firebase.js#L1-L40)

### Gateway session binding

Require fields; confirm UID rebind — Main trusts supplied token/UID

- [electron/cloud-gateway.js:77–89](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L77-L89)
- [electron/main.js:554–568](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L554-L568)

### CloudGateway in main

Primary lease; target/schema/expiry checks — Remote command auto-dispatch

- [electron/cloud-gateway.js:163–194](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L163-L194)
- [electron/cloud-gateway.js:199–227](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L199-L227)

### Firebase services

Auth + Firestore REST; user collections — Server rules outside this slice

- [electron/cloud-gateway.js:124–142](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L124-L142)
- [electron/cloud-gateway.js:199–227](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L199-L227)
- [src/context/AuthContext.jsx:6–12](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/AuthContext.jsx#L6-L12)

### Remote AutomationRunner

Task ceiling applies; no local start prompt — Tool interrupt can stop the run

- [electron/main.js:1168–1178](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1168-L1178)
- [electron/automation-runner.js:51–69](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L51-L69)
- [electron/automation-runner.js:182–202](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L182-L202)

### Local authority / continuity

Tasks, organizer & retainedText snapshots

- [electron/cloud-gateway.js:8–8](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L8-L8)
- [electron/cloud-gateway.js:263–286](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L263-L286)
- [electron/main.js:1139–1144](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1139-L1144)

### OS-backed secret encryption

safeStorage protects saved API keys — Environment keys take precedence

- [electron/local-data-service.js:4302–4330](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L4302-L4330)
- [electron/agent/models.js:148–155](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L148-L155)

### Main + renderer logger

Live events + SQLite audit/log history — Logs do not grant authority

- [src/lib/logger.js:143–156](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/logger.js#L143-L156)
- [electron/logger.js:218–227](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/logger.js#L218-L227)
- [electron/main.js:1145–1148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1145-L1148)

### Sources requests

Local / USB / GitHub; Drive setup UI

- [src/components/SourcesPanel.jsx:1–10](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/SourcesPanel.jsx#L1-L10)
- [electron/main.js:329–345](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L329-L345)
- [electron/main.js:366–427](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L366-L427)

### GitHub adapter in main

REST reads; configured personal token — Token encrypted when saved

- [electron/github.js:22–48](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/github.js#L22-L48)
- [electron/github.js:232–251](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/github.js#L232-L251)

### GitHub REST API

Repos, branches, file contents & search

- [electron/github.js:22–48](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/github.js#L22-L48)
- [electron/github.js:344–357](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/github.js#L344-L357)

### Google Drive placeholder

OAuth, list and download unimplemented — No working Drive service edge

- [electron/gdrive.js:65–88](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/gdrive.js#L65-L88)
- [electron/gdrive.js:120–134](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/gdrive.js#L120-L134)

### Local file / Studio adapters

Folder APIs; Spotlight; app/site launch

- [electron/main.js:329–360](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L329-L360)
- [electron/main.js:1077–1100](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1077-L1100)
- [electron/studio.js:59–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/studio.js#L59-L78)

### Mac folders / iCloud / USB

OS APIs and mounted paths; no iCloud API

- [electron/main.js:329–352](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L329-L352)
- [electron/main.js:1227–1234](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1227-L1234)
- [electron/forest-ai.js:8–13](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L8-L13)

### Geolocation & Open-Meteo

Header coords → main weather fetch — Credential / OS permission + fallback

- [src/App.jsx:101–147](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/App.jsx#L101-L147)
- [electron/main.js:689–726](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L689-L726)

### Browser sites & Studio apps

Canvas webview or shell.openExternal — Third-party content boundary

- [src/components/canvases/CanvasSurface.jsx:58–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L58-L78)
- [electron/studio.js:59–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/studio.js#L59-L78)

## Directed relationships

Each relationship is supported by the source passports of its endpoints. Gate limitations are qualified in the analysis cards above.

- Canvases & Live Canvas → Canvas script boundary: renders
- A1 • useChat sends → A2 • preload window.api: invoke
- A2 • preload window.api → A3 • main chat handlers: IPC
- A3 • main chat handlers → A4 • provider dispatcher: dispatch
- A4 • provider dispatcher → A5 • audit-before-send: API-key
- A5 • audit-before-send → A6 • lead LangGraph: recorded
- A6 • lead LangGraph → A7 • createChatModel: build
- A7 • createChatModel → A8 • model provider: request
- A6 • lead LangGraph → A9 • registered graph tool: tool call
- A9 • registered graph tool → A10 • graph tool decision: decide
- A10 • graph tool decision → A11 • renderer tool IPC: allowed
- A11 • renderer tool IPC → A12 • useToolBridge: IPC
- A12 • useToolBridge → A13 • ToolContext gate: execute
- A13 • ToolContext gate → A14 • tools.js handler: allowed
- A14 • tools.js handler → A15 • structured-data IPC: create
- A15 • structured-data IPC → A16 • LocalDataService: forward
- A16 • LocalDataService → briizos.db • shared authority: commit
- A16 • LocalDataService → A17 • data:changed: emit
- A17 • data:changed → A20 • task appears: reload
- A15 • structured-data IPC → A18 • result returns: return
- A6 • lead LangGraph → A19 • visible response: final stream
- A8 • model provider → A6 • lead LangGraph: model reply
- A6 • lead LangGraph → Agent direct data reads: read only
- A6 • lead LangGraph → Title, tags & memory hooks: hooks
- A10 • graph tool decision → Approval / reject / clarification: interrupt
- Approval / reject / clarification → A10 • graph tool decision: resume
- A18 • result returns → A6 • lead LangGraph: next turn
- D1 • Forest tag queue → D2 • forestAutoTag IPC: IPC
- D2 • forestAutoTag IPC → D3 • Forest excerpt reader: read
- D3 • Forest excerpt reader → Project files on this Mac: opens
- D3 • Forest excerpt reader → D4 • createChatModel: prompt
- D4 • createChatModel → D5 • chosen API provider: invoke
- D5 • chosen API provider → D6 • parse & clean tags: reply
- D6 • parse & clean tags → D7 • visible tags added: return
- D7 • visible tags added → D8 • Forest autosave IPC: autosave
- D8 • Forest autosave IPC → D9 • same briizos.db: write
- B1 • capture settings → B2 • capture privacy gate: configure
- B2 • capture privacy gate → B3 • Swift helper child: permitted
- B3 • Swift helper child → Mac windows / full display: capture
- B3 • Swift helper child → B4 • local image archive: JPEG
- B3 • Swift helper child → B5 • indexer / retention: metadata
- B5 • indexer / retention → B6 • assistant coordinator: frame
- B5 • indexer / retention → B7 • same briizos.db: OCR row
- B6 • assistant coordinator → B8 • cloud-text consent: batch
- B8 • cloud-text consent → B9 • task-extraction assistant: allowed
- B9 • task-extraction assistant → B10 • createChatModel: prompt
- B10 • createChatModel → B11 • API model provider: invoke
- B9 • task-extraction assistant → B12 • proposals & staged tasks: stage
- B12 • proposals & staged tasks → B13 • Notefalls / avatar inbox: publish
- B13 • Notefalls / avatar inbox → B14 • accept / dismiss / snooze: decision
- B14 • accept / dismiss / snooze → B15 • accepted task: accept
- B15 • accepted task → B16 • TaskAgent planning: plan
- B16 • TaskAgent planning → B17 • AutomationRunner: opt-in
- B17 • AutomationRunner → B18 • same agent sendMessage: send
- Consent gap • agent OCR reads → Saved screen-text archive: query
- Consent gap • agent OCR reads → Normal graph continuation: OCR
- Normal graph continuation → Chat model sees OCR result: next call
- B11 • API model provider → B9 • task-extraction assistant: reply
- Execubriiz journal worker → Journal context & privacy: context
- Journal context & privacy → Direct journal model stream: eligible
- Direct journal model stream → Journal API model provider: stream
- Journal API model provider → Journal mutation controls: validated
- Journal mutation controls → ExecStore • same briizos.db: commit
- ExecStore • same briizos.db → Journal board updates: notify
- Journal mutation controls → Optional online research: full mode
- Optional online research → Provider web-search APIs: search
- Any exposed renderer caller → Privileged IPC gap: raw IPC
- Privileged IPC gap → Main filesystem / terminal: executes
- Main filesystem / terminal → OS files & child shell: effects
- Codex provider alternative → Codex app-server child: stdio
- Codex app-server child → ChatGPT subscription: OAuth
- Codex app-server child → Same chat stream display: text
- Firebase Auth renderer → Gateway session binding: session
- Gateway session binding → CloudGateway in main: bind
- CloudGateway in main → Firebase services: Bearer
- CloudGateway in main → Remote AutomationRunner: dispatch
- CloudGateway in main → Local authority / continuity: snapshot
- OS-backed secret encryption → Local authority / continuity: store key
- Sources requests → GitHub adapter in main: IPC
- GitHub adapter in main → GitHub REST API: token
- Local file / Studio adapters → Mac folders / iCloud / USB: OS calls
- Local file / Studio adapters → Browser sites & Studio apps: launch

## Authorization reference

### Graph and renderer approval

Graph ask-always interrupts only tools in DESTRUCTIVE_TOOLS. Renderer ask-always checks requiresConfirmation; read-only tools and openCanvas can proceed. Unknown threads use this same rule, not deny-everything.
ask-destructive lets briizos_* mutations pass the graph; renderer exempts its reversible UI set, while other flagged mutations still ask. no-asking disables confirmation but the renderer still checks configured paths.

Evidence:
- [A10 • graph tool decision — electron/agent/tools.js:210–258](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L210-L258)
- [A10 • graph tool decision — electron/agent/tools.js:43–77](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L43-L77)
- [A13 • ToolContext gate — src/context/ToolContext.jsx:66–120](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L66-L120)
- [A13 • ToolContext gate — src/lib/agentSurfaces.js:131–148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/agentSurfaces.js#L131-L148)
- [A13 • ToolContext gate — src/lib/permissions.js:27–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/permissions.js#L27-L74)
- [Approval / reject / clarification — src/hooks/useChat.js:1069–1097](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/hooks/useChat.js#L1069-L1097)
- [Approval / reject / clarification — src/context/ToolContext.jsx:103–117](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L103-L117)
- [Approval / reject / clarification — electron/automation-runner.js:193–202](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L193-L202)

### Approval attribution and raw authority

ToolContext trusts __agentGraphConfirmed to skip confirmation; it is forwarded in renderer params rather than bound to a main-owned one-use authorization. Blacklist checks still precede that flag.
confirmAction invokes the handler directly with edited params; it does not rerun the per-surface gate. bridge.js accepts tool results by requestId without checking reply sender. Raw filesystem/terminal/structured IPC also skips the renderer executor.

Evidence:
- [A13 • ToolContext gate — src/context/ToolContext.jsx:66–120](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L66-L120)
- [A13 • ToolContext gate — src/lib/agentSurfaces.js:131–148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/agentSurfaces.js#L131-L148)
- [A13 • ToolContext gate — src/lib/permissions.js:27–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/permissions.js#L27-L74)
- [A11 • renderer tool IPC — electron/agent/bridge.js:31–40](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/bridge.js#L31-L40)
- [A11 • renderer tool IPC — electron/agent/bridge.js:52–75](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/bridge.js#L52-L75)
- [A11 • renderer tool IPC — electron/agent/tools.js:272–276](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L272-L276)
- [Any exposed renderer caller — electron/preload.js:355–365](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L355-L365)
- [Privileged IPC gap — electron/main.js:518–549](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L518-L549)
- [Privileged IPC gap — electron/local-data-ipc.js:187–198](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-ipc.js#L187-L198)
- [Main filesystem / terminal — electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-fs.js#L68-L105)
- [Main filesystem / terminal — electron/agent-terminal.js:5–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-terminal.js#L5-L25)

### Shell and path restrictions

Renderer isDestructiveCommand returns safe for a recognized first verb before checking compound commands or redirection. Graph parsing examines separators first, but treats node, python, git, curl and other powerful tools as safe verbs.
Blacklists compare strings before main resolves paths. ~/ expansion, .. components and symlinks are not canonicalized by these checks. Shell arguments are not comprehensively governed by the filesystem blacklist. These are code-based limitations, not exploit-test results.

Evidence:
- [A10 • graph tool decision — electron/agent/tools.js:210–258](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L210-L258)
- [A10 • graph tool decision — electron/agent/tools.js:43–77](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L43-L77)
- [A13 • ToolContext gate — src/context/ToolContext.jsx:66–120](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/ToolContext.jsx#L66-L120)
- [A13 • ToolContext gate — src/lib/agentSurfaces.js:131–148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/agentSurfaces.js#L131-L148)
- [A13 • ToolContext gate — src/lib/permissions.js:27–74](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/permissions.js#L27-L74)
- [Main filesystem / terminal — electron/agent-fs.js:68–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-fs.js#L68-L105)
- [Main filesystem / terminal — electron/agent-terminal.js:5–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent-terminal.js#L5-L25)

### Agent OCR consent coverage

Briizy assistants require cloudTextAnalysisAllowed and the pixel/path-pattern scan. The main agent tools search_screen_memory and get_recent_activity read saved OCR without that flag, then return it as model-visible tool output.
The egress scanner catches known data URI, image magic, binary buffers and selected POSIX path forms. It is a pattern filter, not a universal prohibition on sensitive text or arbitrary path encodings.

Evidence:
- [B8 • cloud-text consent — electron/briizy/assistants/base.js:131–154](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/assistants/base.js#L131-L154)
- [B8 • cloud-text consent — electron/rewind/privacy.js:168–205](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L168-L205)
- [Consent gap • agent OCR reads — electron/agent/tools.js:1445–1488](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1445-L1488)
- [Consent gap • agent OCR reads — electron/agent/tools.js:1492–1530](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L1492-L1530)
- [Normal graph continuation — electron/agent/tools.js:517–538](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/tools.js#L517-L538)
- [Normal graph continuation — electron/agent/lead-agent.js:260–281](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/lead-agent.js#L260-L281)

### Capture authorization

Capture defaults off; cloud text analysis defaults off. setConfig({enabled:true}) can start the helper without checking onboardedAt. macOS Screen Recording remains an enforced native gate. Avatar visibility is independent of recording.
Automatic capture defaults to alternating active-window and full-display screenshots. Exclusions examine frontmost metadata; a permitted front window does not exclude other visible windows from the display image.

Evidence:
- [B1 • capture settings — electron/preload.js:26–34](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L26-L34)
- [B1 • capture settings — electron/rewind/config.js:75–106](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/config.js#L75-L106)
- [B2 • capture privacy gate — electron/rewind/indexer.js:461–485](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/indexer.js#L461-L485)
- [B2 • capture privacy gate — electron/rewind/privacy.js:113–157](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L113-L157)
- [B2 • capture privacy gate — electron/briizy/index.js:261–281](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy/index.js#L261-L281)
- [B3 • Swift helper child — electron/rewind/helper.js:113–132](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/helper.js#L113-L132)
- [B3 • Swift helper child — electron/briizy-helper/BriizyHelper.swift:454–506](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/briizy-helper/BriizyHelper.swift#L454-L506)
- [Mac windows / full display — electron/rewind/privacy.js:122–157](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/privacy.js#L122-L157)
- [Mac windows / full display — electron/rewind/config.js:83–101](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/rewind/config.js#L83-L101)

### Direct external calls

Forest auto-tags reads up to its excerpt budgets and sends project text using the Background helpers route. It has configuration/read budgets and error logs, but no ToolContext approval, agent blacklist or separate file-content egress consent.
A configured model/key is a readiness condition. It does not authorize every external transmission. createChatModel checks profiles/adapters/credentials and rejects Codex subscription calls; it does not centralize content consent.

Evidence:
- [D1 • Forest tag queue — src/components/forest/app.js:1593–1638](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1593-L1638)
- [D2 • forestAutoTag IPC — src/components/forest/app.js:1641–1652](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/forest/app.js#L1641-L1652)
- [D2 • forestAutoTag IPC — electron/main.js:1102–1104](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1102-L1104)
- [D3 • Forest excerpt reader — electron/forest-ai.js:145–189](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L145-L189)
- [D3 • Forest excerpt reader — electron/forest-ai.js:192–222](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L192-L222)
- [D4 • createChatModel — electron/forest-ai.js:91–103](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/forest-ai.js#L91-L103)
- [D4 • createChatModel — electron/agent/models.js:294–341](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L294-L341)

### Journal mutation authority

Execubriiz starts with full intensity and unpaused preferences. Private entries are filtered in code; Invisible entries may be supplied to the model and withheld from visible source citations.
Schema/budget/generation/revision/protected/fixed checks govern journal commits. Some content edits apply automatically; structural edits become proposals. Full curation can enqueue web research only when the context has no Invisible material. General chat/task permissions do not govern this worker.

Evidence:
- [Execubriiz journal worker — electron/execubriiz/runtime.js:17–34](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L17-L34)
- [Execubriiz journal worker — electron/execubriiz/runtime.js:56–96](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L56-L96)
- [Execubriiz journal worker — electron/execubriiz/store.js:24–25](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L24-L25)
- [Journal context & privacy — electron/execubriiz/runtime.js:115–145](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L115-L145)
- [Journal context & privacy — electron/execubriiz/runtime.js:228–238](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L228-L238)
- [Direct journal model stream — electron/execubriiz/runtime.js:163–193](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L163-L193)
- [Direct journal model stream — electron/execubriiz/model-contract.js:1–50](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/model-contract.js#L1-L50)
- [ExecStore • same briizos.db — electron/execubriiz/store.js:235–244](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L235-L244)
- [ExecStore • same briizos.db — electron/execubriiz/store.js:280–285](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L280-L285)
- [Journal mutation controls — electron/execubriiz/store.js:251–278](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L251-L278)
- [Journal mutation controls — electron/execubriiz/runtime.js:250–254](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L250-L254)
- [Optional online research — electron/execubriiz/store.js:278–278](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/store.js#L278-L278)
- [Optional online research — electron/execubriiz/runtime.js:170–175](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/execubriiz/runtime.js#L170-L175)

### Embedded content isolation

Canvas srcDoc permits scripts with same-origin and forms. The URL probe checks its payload/probeId, but not event.origin or event.source. Same-origin scripted content weakens separation from the privileged parent; exact reach is inferred and was not exercised.
Main disables webSecurity and allows insecure content in development, skips CSP injection there, and enables webviewTag. Production CSP still includes unsafe-inline/unsafe-eval. This map does not claim a tested exploit or an isolated canvas security sandbox.

Evidence:
- [Canvas script boundary — src/components/canvases/CanvasSurface.jsx:31–45](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L31-L45)
- [Canvas script boundary — src/components/canvases/CanvasSurface.jsx:58–78](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/components/canvases/CanvasSurface.jsx#L58-L78)
- [Canvas script boundary — electron/main.js:220–226](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L220-L226)
- [A2 • preload window.api — electron/preload.js:437–452](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/preload.js#L437-L452)

### Codex sandbox ownership

Selecting a Codex profile spawns the installed codex app-server --stdio and uses its ChatGPT OAuth. thread/start and resume request read-only sandbox with approvalPolicy never. Those controls are owned by the installed CLI.
BriizOS forwards text deltas from that provider; this adapter does not wire the renderer tool bridge or dynamic tools. General createChatModel explicitly refuses Codex subscription models.

Evidence:
- [Codex provider alternative — electron/agent/index.js:47–49](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L47-L49)
- [Codex provider alternative — electron/agent/index.js:99–105](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/index.js#L99-L105)
- [Codex app-server child — electron/codex-provider.js:151–155](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L151-L155)
- [Codex app-server child — electron/codex-provider.js:399–454](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L399-L454)
- [ChatGPT subscription — electron/codex-provider.js:429–454](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L429-L454)
- [ChatGPT subscription — electron/codex-provider.js:261–275](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/codex-provider.js#L261-L275)

### Remote command authority

Renderer Firebase Auth supplies UID, project ID and token to CloudGateway. Main checks required fields and confirms rebinding, then uses bearer-authenticated Firestore REST. Server security rules and external web/mobile producers are outside electron/ and src/ evidence.
Primary lease, target device, schema/kind, expiry and deduplication gate command intake. Accepted remote execute_task commands auto-dispatch without a fresh local start approval; task ceiling and subsequent tool interruptions still apply. Device lease coordination uses reads/writes, not an atomic lock.

Evidence:
- [Firebase Auth renderer — src/context/AuthContext.jsx:78–106](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/context/AuthContext.jsx#L78-L106)
- [Firebase Auth renderer — src/lib/firebase.js:1–40](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/firebase.js#L1-L40)
- [Gateway session binding — electron/cloud-gateway.js:77–89](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L77-L89)
- [Gateway session binding — electron/main.js:554–568](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L554-L568)
- [CloudGateway in main — electron/cloud-gateway.js:163–194](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L163-L194)
- [CloudGateway in main — electron/cloud-gateway.js:199–227](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/cloud-gateway.js#L199-L227)
- [Remote AutomationRunner — electron/main.js:1168–1178](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1168-L1178)
- [Remote AutomationRunner — electron/automation-runner.js:51–69](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L51-L69)
- [Remote AutomationRunner — electron/automation-runner.js:182–202](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/automation-runner.js#L182-L202)

### Persistence, credentials and evidence

Main initializes userData/briizos.db with better-sqlite3, WAL and foreign keys. Structured writes use transactions/revisions; logs, AI audit, checkpoints, operation receipts and encrypted secrets share this authority. Captured pixels live in the local rewind archive.
safeStorage fails closed when encryption is unavailable for saved secrets. Environment API keys take precedence for model calls. Operation receipts deduplicate effects; they are not human approvals. Graph initial audit storage is required before send, while direct helpers have their own narrower logs.

Evidence:
- [A16 • LocalDataService — electron/local-data-service.js:1103–1138](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1103-L1138)
- [A16 • LocalDataService — electron/local-data-service.js:1241–1270](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1241-L1270)
- [A16 • LocalDataService — electron/local-data-service.js:1145–1152](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L1145-L1152)
- [briizos.db • shared authority — electron/main.js:1139–1167](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1139-L1167)
- [briizos.db • shared authority — electron/local-data-service.js:212–219](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L212-L219)
- [OS-backed secret encryption — electron/local-data-service.js:4302–4330](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/local-data-service.js#L4302-L4330)
- [OS-backed secret encryption — electron/agent/models.js:148–155](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/agent/models.js#L148-L155)
- [Main + renderer logger — src/lib/logger.js:143–156](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/src/lib/logger.js#L143-L156)
- [Main + renderer logger — electron/logger.js:218–227](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/logger.js#L218-L227)
- [Main + renderer logger — electron/main.js:1145–1148](https://github.com/axgoodhart/briizos-local/blob/881061e74f60db796a1ba473fa73414c45d8bcd6/electron/main.js#L1145-L1148)

