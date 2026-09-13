# briizOS Local → Mobile: feature audit and implementation recommendation

September 13, 2026 · Source-based audit of `briizOS.local` and `briizos.mobile`.

**Recommendation:** develop the complete capability in Local, adapt Mobile’s existing views into reduced or mirrored versions, and reconnect Firebase at the end. Preserve Local’s panel workspace. Make Mobile a companion for capture, conversation, review, and control, with desktop-dependent execution clearly attached to the Mac.

**Planning assumption confirmed by the owner:** Firebase commonality was intentionally removed. Restoring it is a small final integration task, not a prerequisite or major workstream. The disconnected paths below are an inventory finding, not the priority driving this plan. Agree on record shapes as each Local feature is built; do not turn that into an advance synchronization project.

The strongest existing foundations are Local’s agent, Tasks, Sources, Canvases, settings, and activity logs. Mobile has working provider chat, editable shared records, and device-local journals. Much of Mobile’s apparent feature breadth comes from demonstration screens rather than connected capabilities.

## Scope and evidence standard

The supplied list is a set of desired capabilities derived from screenshots, not proof that either repository implements them. This audit follows the current app entry points and implementation paths; a filename, dependency, prompt, or installed skill alone does not establish a usable feature. No app servers, builds, tests, or live provider requests were run. Appearance and runtime reliability remain unverified.

**Wired** means reachable UI with an implementation path, not runtime-certified. **Partial** means a meaningful subset or underlying capability exists. **Placeholder** means local UI state or example content without the necessary action/persistence. **Not found** means no implementation identified in the inspected active paths; it does not rule out standalone apps or inactive code elsewhere in this workspace.

The two repositories have separate Git histories. Local is Electron/React with SQLite-backed services; Mobile is a React/TypeScript browser app with Firestore and browser storage. This favors shared data contracts and behavior, without requiring identical view components.

## What each project has

Evidence links point to the source supporting each assessment. The recommendation column describes proposed work, not existing functionality.

| Requested area | briizOS Local | briizOS Mobile | Recommended fit |
|---|---|---|---|
| Core shell and navigation | **Wired equivalent:** configurable dock/header, tiled and floating panels, panel visibility, account and settings. The requested persistent sidebar and destination list are not the current shell. [L1] | **Wired reduced shell:** bottom navigation and Menu. Home, Journals, Files, Chats, Automations, Space and Skills are reachable. Settings menu opens Chats. No workspace switcher or upgrade flow found. [M1] | Retain both shells. Add capability access to the existing dock/Menu only when it cannot live within a current panel. Do not reproduce a subscription-product sidebar by default. |
| Multiple open tools, tabs, navigation controls, docked chat | **Wired equivalent:** concurrent panels, floats and full-screen panel control, plus Interaction chat. No general browser-tab workspace with back/forward/reload found. [L1] | **Partial:** code keeps a tabs array, but the tab bar is not rendered; only the selected view mounts. No persistent right chat pane. [M1] | Local keeps spatial multitasking. Mobile keeps one main view and persistent conversation state; use a return-to-chat control when another record is open. |
| Home/chat composer, models, persona, attachments, microphone, balance, suggestions | **Wired chat subset:** model picker, interaction modes, file attachment/context, persistent threads and messages. Modes are not managed personas. No microphone input or balance/allowance UI found in active chat. [L2] | **Split:** Chats has provider calls and data tools; Home has a separate dummy composer, hard-coded model choices and history, and a Send button without a handler. No wired microphone, persona or balance found. [M2][M3] | Make Home an entry into the same chat flow; extend the composer for voice and reusable posture selection. Derive suggestions from connected capabilities. Defer balance unless there is a real accounting need. |
| Chat history, search, View all | **Partial:** durable local threads/messages exist; no complete searchable history surface found in Interaction. [L2] | **Missing for current conversations:** Chats messages live in component state; navigating away unmounts that state. Menu’s chat count comes from organizer records, not this transcript. [M1][M3] | Add searchable history within Interaction/Chats, and retain the selected conversation across navigation. Mirror content and identifiers, not desktop window geometry. |
| Getting started, interview, first-job cards, tours | **Not found** as a coherent onboarding flow. Existing setup areas can supply prerequisites. [L1][L3] | **Not found** as a connected flow; placeholder Home is not an onboarding sequence. [M2] | Enhance Home/empty states and settings with resumable setup actions. The interview should become a chat mode using the same saved conversation. |
| My Space: Pages/Preview/Code/Meta, export, privacy, OG image, crawling | **Partial adjacent capability:** Canvases saves HTML plus metadata, supports code/file/URL sources and previews. No multi-page site editor, social metadata inheritance, crawling controls or publication lifecycle found. [L4] | **Placeholder:** Preview/Code buttons change selected state but render the same explanatory content; privacy is a label, not a saved control. [M4] | Extend Canvases with an optional site/project type and page metadata. Mobile Space becomes its preview and modest editing view. |
| My Files: hierarchical files, dates, search, refresh, create/delete | **Partial:** Sources browses local/iCloud/USB/GitHub sources, has Google Drive entry and file-to-chat selection; FileTree expands folders. Full file-management controls and unified file search are not established. [L5] | **Wired records browser, different meaning:** Files searches/sorts and creates, edits, archives or deletes organizer items, tasks and events. It is not a Mac filesystem browser or a tree of PDF/JPG/SVG files. [M5] | Enhance Sources for actual files. Preserve Mobile’s existing personal-data editor; distinguish Records from shared Files inside that view. |
| Global search / command palette, including skill folders | **Partial ingredients:** source browsing, activity search and agent note search; no unified command/search overlay found. [L5][L10] | **Partial ingredients:** Files search and chat note-search tool; no global search overlay found. [M5][M6] | One shared search entry over capability-specific indexes: records, files, skills, conversations, sites and actions. Search results should open their existing owner surface. |
| Skills: installed/catalog, search, descriptions, enable/install | **Partial real backend:** filesystem skill discovery, metadata parsing and prompt inclusion; list/toggle IPC exists but returns configuration entries. No active renderer consumer of those list/toggle methods found. [L6] | **Placeholder:** static example list; Installed/Hub changes styling, both render the same data, and download buttons lack handlers. [M7] | Add a Skills filter/detail mode within Sources, backed by actual discovered files. Mobile’s existing Skills view mirrors that registry and sends supported changes to Local. |
| Automations: schedules, recurrence, multiple times, notifications, prompt preview, save | **Partial strong execution:** task automation and run lifecycle are wired. Calendar has recurring placements, but these represent calendar occurrences; no durable scheduled-prompt trigger was identified. [L7][L8] | **Placeholder:** schedule pills and text input use local state; time/persona are fixed; Save, notification and preview/send controls are unwired. [M8] | Enhance Tasks with a schedule and saved instruction. Use Calendar for placement and the existing runner for execution. Mobile Automations edits and monitors those same definitions. |
| Integration hub and arbitrary services/MCP | **Partial:** real GitHub token and Google Drive connection paths, account controls and configurable Studio URLs. Installed `gog`/other skills may provide agent workflows but do not establish a connected hub for every named service. No generic MCP server registration/runtime found in active Electron paths. [L3][L6] | **Not available as a connected hub:** a SettingsView implementation contains example integration UI, but App does not route to it. [M1][M9] | Extend Settings → Integrations with connection records and exposed capabilities. Add services according to actual jobs; custom MCP is an adapter capability here, not another top-level tool page. |
| Authenticated browser use and login destination grid | **Partial adjacent capability:** URL canvases can use Electron webviews. This does not establish an agent-controlled authenticated-browser session manager. [L4] | **Not found:** no browser-login route or shared authenticated session support. [M1] | Enhance URL Canvases with browser sessions, navigation and explicit connection status. Integrations can link to the same login session. Mobile can open a page or request Mac browser work without pretending phone cookies are the Mac’s session. |
| Websites: name/folder/parent, templates and Create | **Partial:** canvas creation already accepts a name and code/file/URL input; flat saved HTML and sidecar metadata are not a multi-file site project. Studio Website URL is an external destination, not a builder. [L3][L4] | **Not found** beyond Space’s explanatory placeholder. [M4] | Add site creation to Canvases: folder-backed project, template choice, pages/assets and preview. Space and Websites should share this library, with a designated personal site. |
| AI settings: model/channel/persona, image/video allowances | **Partial:** Model settings, provider keys, Codex sign-in and Interaction modes are real. Current settings tabs are Model, briizy, Appearance, Integrations, Memory, Permissions and Health. Per-messaging-channel model/persona routing and allowance accounting were not found. [L2][L3] | **Partial:** Chats Settings persists provider/model choices, custom models, request parameters and keys in browser storage. Separate SettingsView is not routed. [M3][M9] | Expand current Model settings into reusable configuration with per-surface/channel overrides; Mobile shows applicable choices and whether work runs on phone or Mac. |
| External AI providers: Codex/Claude subscriptions, ACP and API keys | **Wired subset:** Codex subscription connection plus OpenAI/Claude/Gemini key configuration. Claude API access is not Claude Code subscription support. No comparable Claude Code subscription or arbitrary ACP-agent installation path found. [L3][L11] | **Wired key-based subset:** direct OpenAI/Gemini/Claude request implementations. No Codex/Claude subscription connection or ACP install flow found. Browser requests were not exercised. [M3] | Keep provider setup in Local settings and add adapters there. Mobile should select a connected Mac provider or its explicitly selected phone provider. |
| Personas with named postures, visual association and channel assignment | **Not found** as a persisted managed entity. Interaction modes and injected memory provide ingredients. [L2][L6] | **Placeholder references only:** fixed automation persona and example advanced permissions; no management/runtime binding. [M8][M9] | Add reusable persona records to Model settings and selectors in the existing composer. Store posture, response format and visual association; bind to runs/channels. Prompt guidance alone cannot guarantee model compliance. |
| Text/SMS, Email, Telegram, Discord, Slack channels | **Not found** as a managed multichannel product. Skills such as `imsg`/`gog` are potential tools, not proof of account connection, inbound routing or delivery handling. [L6] | **Not found** as a connected channel workflow; unused settings markup is insufficient. [M1][M9] | Extend Integrations with channel accounts and routing. Reuse conversations for incoming/outgoing messages, with channel, account and delivery state visible on each message. |
| Secrets/.env manager, API/MCP tokens, external-request concurrency and stop | **Partial:** provider credentials and environment loading exist; configurable chat/task execution permissions exist. No general secret-manager UI, externally consumable API-token manager, or external-request concurrency control with zero-stop semantics found. Internal subagent limits are a different control. [L3][L10][L11] | **Partial key settings only:** provider keys persist in browser storage. Advanced token/concurrency UI sits in unrouted SettingsView and is not a working manager. [M3][M9] | Enhance Local settings with connection secrets and external access controls. Keep external-request admission separate from destructive-action permission. Mobile mirrors status and allowed control actions, not raw Mac credentials. |
| Tools settings linking to integration, messaging, browser and file sync | **Partial:** agent tool registry and existing settings/source surfaces; no comprehensive user-facing linked directory found. [L3][L10] | **Wired narrow Tools tab** within Chats: schedule summary, note search, conflicts, note/task/event changes. This is separate from placeholder Skills. [M6] | Build a shared capability registry; Tools describes executable actions, Skills describes instructions, Integrations describes connections. Cross-link these rather than duplicate settings. |
| Devices, Local/Web connections, ten recent sightings and locations | **Partial real backend:** device identity, last-seen heartbeat, primary Mac selection and remote-command intake. Latest device state is overwritten; ten-sighting history and location UI were not found. [L9] | **Partial unrelated status:** Firestore session/data sync indicator. No subscriptions to Local device/run/continuity collections found. [M10] | Expand the existing status UI with Mac reachability and recent sightings. Write a bounded observation history and show location only when actually known. Web can remain a compatible participant without becoming this plan’s third target. |
| Ongoing agent task completion/status | **Wired:** task states and activity evidence; remote command runs can publish progress, result and error. Current runner reports coarse start/end progress, not a reliable detailed percentage of real-world completion. [L5][L7][L9] | **Partial:** current chat sending/tool feedback and data-sync status; no Local run tracking. [M3][M10] | Mirror task/run events into Automations and a compact status detail. Distinguish queued, running, waiting for confirmation, failed and completed; open the same task from status. |
| Terminal | **Partial backend:** agent shell command execution and visible activity/output evidence. No general interactive terminal panel identified. [L10] | **Not found** as a terminal or remote shell view. [M1][M6] | Add task-linked command/output detail to Sources/activity first. If interactive terminal work is wanted, a session view is justified; an activity log alone is not an interactive terminal. |
| Screenshot summary extras: computer snapshots and payments | **Capture foundation:** briizy capture/settings and screen-memory tooling exist. Payments/account billing not found. [L12][L10] | **Not found** as corresponding connected features. [M1] | Keep capture within briizy and status. Do not infer a payments requirement from the supplied summary; upgrade, billing and balances need their own product reason. |

The screenshot list’s service names and model names are examples, not a verified compatibility commitment. Its misspelled vendor names should be corrected against the intended services during implementation. Its final characterization overstates what visible controls alone can prove, particularly payments, execution and connected-device behavior.

## Current data separation — reconnect at the end

**Mobile is not yet a reliable mirror of Local’s current data.** Local’s task hook calls `window.api.localData.tasks`; the active cloud gateway publishes continuity under `briizosLocalContinuity` and commands/runs/devices under their own `briizosLocal*` collections. Mobile binds `tasks`, `events`, `organizer`, `panels`, timer and minStack instead. Those are different paths. A “Live” label on Mobile currently describes those Firestore listeners, not Mac availability or successful Local synchronization. [L7][L9][M10]

Local continuity currently covers tasks, organizer and retained text. It is a snapshot/export mechanism, not a complete mobile read/write protocol. Chat transcripts, site projects and journals need explicit treatment. Mobile journals currently use browser localStorage, while Local journals use Electron APIs; a shared shelf is not established. [L9][L13][M11]

The parent SyncContract describes organizer/panel invariants for the shared Web data model. It does not explain Local’s newer SQLite authority and separate continuity path. Update the relevant mappings when Firebase is reconnected; do not assume old Firestore helpers are still the active persistence route. This is final integration housekeeping under the agreed planning assumption. [C1]

## Surface recommendation

| Existing owner | Enhancements it should absorb | Mobile expression |
|---|---|---|
| Interaction / Chats | Home composer, history, persona, voice, contextual first jobs and conversations from channels | Full conversation experience; compact settings; persistent draft and transcript |
| Tasks + Calendar | Saved automation instructions, schedule, prompt preview, run history and notification rule | Existing Automations view: list, edit common schedule fields, pause/resume, run details and confirmations |
| Sources | File management, shared-file access, skill inventory, searchable resource details and command/output evidence | Files keeps records and gains shared files; Skills remains a filtered registry view |
| Canvases | Site projects, personal Space, templates, page/code/metadata editing and authenticated browser canvases | Existing Space: site/page list, preview, text/metadata changes, request a larger edit on Mac |
| Settings | Models, providers, personas, integrations, channels, browser login links, secrets and external access | One settings destination with capability-aware choices; Mac-only setup hands off to Mac |
| Existing status/activity | Device reachability, ten sightings, run state, failed/blocked actions and result links | Compact strip with expandable device/run detail |

A unified search overlay is a justified new transient surface because it spans these owners. Full site editing can be a substantial Canvases mode rather than being squeezed into a tiny popover. A terminal session may also deserve a dedicated view if true interactive work is required. Enhancement should preserve a coherent interaction, not force every feature into the smallest existing box.

## Recommended implementation sequence

### 1. Unify conversation, history, providers and personas

Extend Local’s existing durable thread store with conversation search, named persona configuration and run-bound provider/model/persona selection. A persona’s posture and requested format should be recorded with the conversation; any structured behavior that must hold needs application validation and a visible retry/failure path, not only a stronger prompt. Retain current interaction modes where useful and make their relationship to personas explicit.

In Local, add microphone capture/transcription to the same composer when voice is wanted. Getting-started actions should lead into these real flows and use actual connection state. For the later Mobile adaptation, connect Home to Chats and move transcript/draft state out of the view that unmounts. Keep direct phone-provider chat as an explicit option rather than silently substituting execution environments. Settings should navigate to settings, not merely open a chat tab under a misleading label. Cross-device conversation continuity is connected in the final integration step.

**Local completion condition:** start a conversation, leave the view and return without losing it; find an earlier conversation; see its provider and persona; a first-job action produces a real draft/conversation. The Mobile adaptation preserves the same flow; cross-device continuation is a final integration acceptance scenario.

### 2. Turn Tasks into scheduled automation

Add a reusable automation definition linked to Tasks: instruction/context, schedule, timezone, provider/model/persona binding, notification rule, enabled state and next occurrence. Keep the definition separate from each execution run. Extend recurrence for Once, Hourly, Daily, Weekly, Monthly and multiple times; natural-language schedule input must resolve to a readable schedule preview before saving.

Use the existing AutomationRunner for due occurrences. Add durable trigger tracking so a restart or reconnect does not execute the same occurrence twice. Specify missed-run and overlap behavior: recommended default is no overlapping run of the same automation, and a visible missed-run state rather than an unexpected burst after the Mac wakes. Calendar recurrence alone does not execute prompts. Any “preview prompt” that calls providers or changes external data must show what it will do before execution.

Define Mobile’s existing Automations view against these records and run events for the later adaptation. Reuse one schedule editor model on both platforms; compact the presentation on Mobile. Surface recipes only when their required integration is available, otherwise open the matching connection setup.

**Local completion condition:** a scheduled task survives restart, executes once per occurrence while Local is available, reports missed/blocked/failed runs honestly, and can be edited or paused from Tasks. Mobile editing and acknowledgement connect at the end.

### 3. Connect resources, skills, services and channels

Extend Sources with actual file actions and a Skills mode backed by discovered metadata, enabled state and installation source. Make installation/update actions operate on real files and refresh the same registry used by the agent. Provide one search entry that returns typed results and opens the relevant existing surface.

Extend Settings → Integrations with connection records, setup requirements, usable tool capabilities and status. Begin with existing GitHub/Drive and the connections needed for chosen automation recipes. Add custom MCP support as another connection adapter. Installed CLI-oriented skills can be reused when their runtime and authentication are available; they should not be advertised as connected services merely because a SKILL.md exists.

Channels share this connection model but also need inbound handling, recipient/account identity, outbound delivery status and model/persona routing. Add general secrets and external API access here when those connections require them. Expose an external-request admission limit where zero stops new external requests; keep its scope visibly separate from in-flight work and destructive execution permissions.

**Local completion condition:** a skill shown as enabled is actually available to the agent; a connection reports whether its tools can run; a message shows its correct channel/account and delivery outcome. Mobile later reflects the same connection state without requiring copied Mac credentials.

### 4. Extend Canvases into Space, Websites and browser work

Keep existing single-file canvases usable. Add a site project with parent folder, pages, assets, templates, Preview/Code/Meta modes, page metadata inheritance, social image preview and export. Use the requested Blank, Blog, Event Registration, Presentation, Dashboard, Marketing, Portfolio and Knowledge Base options as templates over one project structure. Do not confuse the presentation template with a separate hosting product.

Treat the personal Space as a designated site in that library. Publication/privacy/crawling controls should describe actual serving behavior and publication state; a “Private” badge alone cannot implement it. Prepare an export or publication preview before asking for any destructive or externally visible action required by the chosen flow.

Extend URL canvases with navigation, authenticated session ownership and a connection to agent browser actions. A browser view, a login session and an agent’s ability to operate that session are separate capabilities that should share one visible status. Mobile gets previews, small edits and task requests; complex code/layout editing and desktop login remain available on Local through an explicit handoff.

**Local completion condition:** create a site, edit two pages, see metadata inheritance and export a complete project; log into a browser canvas and visibly verify which Mac session agent work will use. Mobile preview follows in its adaptation.

### 5. Finish Local status and guidance; adapt the Mobile surfaces

Add Local run status alongside the scheduled-task work, then complete its ten-sighting history and practical location labels as the relevant device information becomes available. Expand status into task detail and existing activity evidence, not a second dashboard of duplicate numbers. Finish tours/empty states around the actual capabilities delivered in phases 1–4. Add billing or quotas only if a concrete product requirement emerges.

Adapt the existing Mobile views using the surface table: full chat and personal-record interaction; compact automation control; resource and skill browsing; site preview and small edits; concise settings and status. Replace demonstration controls with the corresponding Local-defined behavior. Keep phone drafts and phone-only provider chat usable independently. Do not reproduce Local's whole spatial workspace on a narrow screen. Build these adaptations against the agreed records and actions; reconnect their shared transport as the final step.

**Completion condition:** each requested capability has a working Local home and a deliberate Mobile treatment—full, reduced, mirrored, or an explicit Mac handoff—with no dummy Save/Download/privacy controls presented as completed features.

### 6. Restore Firebase commonality

Reconnect the shared records, settings, device state and run updates through the existing Firebase setup. Update the adapters and contract to the record shapes established during Local implementation. Include conversation persistence, schedule definitions/results, journals and site metadata where the selected Mobile treatment calls for them; keep window geometry platform-specific. Preserve existing records and phone drafts when mapping their identities. This is the small final integration pass requested by the owner, not a preceding architecture rebuild.

Show Mac-unavailable and pending-change states honestly. Retain duplicate-operation handling and visible conflict outcomes already associated with record revisions. Destructive effects require explicit confirmation, while external connection admission stays separate from execution permission. Meaningful Local actions and failures continue to appear in the existing activity panel.

**Final integration acceptance:** Local changes appear on Mobile; a phone edit is acknowledged on Local; a conversation can continue across devices; automation completion/failure reaches the phone; an unavailable Mac is visibly unavailable; reconnecting preserves edits without repeating an execution. These are proposed acceptance scenarios, not checks performed in this audit.

## Design assessment and priority

**Visual verdict deferred:** no live interface was inspected, so a responsible pass/fail judgment on spacing, legibility or generic visual styling is not possible. Source does establish functional information-architecture problems.

Local’s reusable panel shell, durable task runner and searchable activity evidence are strong foundations. Mobile’s existing record editor and distinct single-view navigation are worth retaining. The highest-priority product work is completing the Local capabilities through those existing surfaces. Mobile adaptation then addresses its two unequal chat entry points, placeholder Save/Download/privacy controls, misleading Settings navigation, and Files meaning different things on each device. The intentionally disconnected persistence paths are handled at the end. None of this requires replacing briizOS’s visual identity.

When implementing, preserve Local’s canonical structural/theme CSS model, dense layout and glyph conventions. Adapt hierarchy and control placement to narrow widths rather than shrinking desktop panels. Every added flow needs readable pending, empty, loading, error, offline and saved states; keyboard/focus behavior on Local; touch operation and draft retention on Mobile. Actual rendered critique and interaction verification should happen when requested for implementation.

**Start with Local conversation/persona configuration, then scheduled Tasks.** These establish the reusable agent configuration and execution behavior that the remaining features need. Extend Sources/Settings and Canvases next, adapt Mobile to those completed capabilities, and restore Firebase commonality last.

## Source references

[L1]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/App.jsx:322
[L2]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/hooks/useChat.js:235
[L3]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/overlays/DashboardOverlay.jsx:30
[L4]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/hooks/useCanvases.js:5
[L5]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/SourcesPanel.jsx:592
[L6]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/agent/system-prompt.js:46
[L7]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/automation-runner.js:140
[L8]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/calendar/AddFromPicker.jsx:89
[L9]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/cloud-gateway.js:162
[L10]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/agent/tools.js:1062
[L11]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/codex-provider.js:22
[L12]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/briizy/CaptureSettingsPanel.jsx
[L13]: /Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/journals/api.js:14
[M1]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/App.tsx:14
[M2]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/HomeView.tsx:4
[M3]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/ChatsView.tsx:94
[M4]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/SpaceView.tsx:4
[M5]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/FilesView.tsx:322
[M6]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/services/mobileToolRegistry.ts:25
[M7]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/SkillsView.tsx:13
[M8]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/AutomationsView.tsx:4
[M9]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/SettingsView.tsx:8
[M10]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/services/mobileSyncService.ts:256
[M11]: /Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/features/journals/journalStore.ts:215
[C1]: /Users/alex/Documents/Cufolio/briizOS/SyncContract.md:3

Additional implementation anchors: [Local task authority](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/hooks/useTasks.js:15), [current automation eligibility](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/lib/localTasks.js:53), [skill list/toggle IPC](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/electron/main.js:808), [chat controls and model picker](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/InteractionPanel.jsx:517), [URL canvas renderer](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/canvases/CanvasSurface.jsx:54), [canvas creation](/Users/alex/Documents/Cufolio/briizOS/briizOS.local/src/components/canvases/NewCanvasFlow.jsx:87), [mobile provider calls](/Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/services/chatApi.ts:166), [mobile saved settings and keys](/Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/services/chatSettings.ts:104), [mobile Settings navigation](/Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/views/MenuView.tsx:101), [mobile status meaning](/Users/alex/Documents/Cufolio/briizOS/briizos.mobile/src/components/SyncStatusStrip.tsx:9).
