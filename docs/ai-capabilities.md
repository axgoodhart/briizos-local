# briizOS AI Capabilities Reference

This document explains how AI works inside briizOS.local. It has two parts:

- **Part 1** is for people who use briizOS but don't write code.
- **Part 2** is for AI agents and developers who need to understand the internals.

---

# Part 1: For Users

## What the AI Can Do

briizOS has a built-in AI assistant that lives inside the app. When you type a message in the **Interaction Panel** (the chat area), the AI reads your message, thinks about it, and replies — sometimes using tools to take actions on your behalf like creating notes, tasks, or calendar events.

### The Four AI Capabilities

briizOS routes AI through four separate "capabilities." Each one can use a different AI model if you want, or they can all share the same one.

| Capability | What it does |
|---|---|
| **Chat** | The main conversation. When you type a message and get a reply, this is it. |
| **Execubriiz live companion** | Reads along as you write a journal entry and offers ideas, connections, and board edits in real time. |
| **Execubriiz board & research** | Deeper work: curating your journal board, summarizing entries, running web research when something you wrote could use verification. |
| **Background helpers** | Invisible housekeeping — generates conversation titles, applies tags so you can find conversations later, and updates what the AI remembers about you. |

You can see and change which model powers each capability in the **AI Routing** section of Settings.

### Supported AI Providers

briizOS works with three cloud AI providers. You bring your own API key for whichever one(s) you want to use.

- **Anthropic (Claude)** — Claude Sonnet 4.6 is the default if nothing else is configured.
- **OpenAI (GPT)** — Full support including GPT-5.6, reasoning models (o1, o3), and the Responses API. Also supports reasoning effort levels: Fast, Light, Medium, High, Extra High, Max.
- **Google (Gemini)** — All current Gemini models.

There is also a **Codex Subscription** connector for users who authenticate through OpenAI's Codex app. Codex can power Chat but cannot power Execubriiz (which needs structured tool calls that Codex doesn't support).

### What the AI Can See and Do

**Things the AI can read (without asking):**
- Your tasks, subtasks, and their status/priority
- Your Forest projects, milestones, and files
- Your calendar events and scheduled task sessions
- Your organizer notes and timers
- Your screen memory captures (if enabled)
- Recent activity across the app
- Files on your computer (paths you share or pin)

**Things the AI asks permission before doing:**
- Creating, editing, or deleting notes
- Creating or completing tasks
- Creating or moving calendar events
- Scheduling or unscheduling tasks on the calendar
- Writing, moving, copying, or deleting files on your computer
- Running terminal commands that could change things
- Updating Forest project scores (deadline, importance, size, relevance)

The permission behavior depends on which mode you've chosen:
- **Ask always** — The AI asks before every action (safest)
- **Ask destructive** — The AI asks before things that change data, but reads freely
- **No asking** — The AI acts without asking (fastest, riskiest)

Certain file paths can also be **blacklisted** per surface so the AI can never touch them regardless of permission mode.

### Briizy: The Desktop Character

Briizy is one animated character that lives outside the briizOS window. Click it to open a compact quick-chat bubble; its replies use the same selected model, saved Chats history, permission rules, and Log Panel as the full Interaction Panel.

- The first quick-chat message starts a saved conversation in Chats.
- Further messages stay in that conversation while fewer than **10 minutes** have passed since your prior Briizy message.
- After 10 quiet minutes, the next message starts a new saved conversation; the earlier one remains available in Chats.
- If a request needs an approval or more space, **open in briizOS** takes you to Chats without losing the conversation.
- Briizy can also surface screen-memory observations and proposed actions. It remains one character and one entry point, not a second assistant.

### Experimental Briizy Capabilities

Goals, Focus, and Task agent are opt-in experimental capabilities in Briizy’s screen-memory settings. They are off by default and remain unavailable until you allow recognized screen text to be analysed by your selected model.

Use the **MODEL** tab in Settings to connect OpenAI, Anthropic, or Gemini and choose Briizy’s default model. Briizy’s own settings stay focused on what Briizy does with the work it sees.

- **Goals** compares a stable slice of captured work with your active Briizy goals. It can record progress or offer an evidence-backed suggestion.
- **Focus** records whether the work appears focused, adjacent, or drifting relative to your first active goal. Its feedback is ambient; it does not interrupt you with a popup.
- **Task agent** runs only after you accept a Briizy suggestion into a task. It can add a concise set of task steps, but it never starts or executes the work unless a separate automation setting is explicitly enabled.

Use the Log Panel to see every attempt, including when a capability stays quiet because there is no active goal, capture is paused, consent is off, or the recent screen text is not substantial enough to analyse.

### Execubriiz: The Journal AI

Execubriiz is a separate AI system that lives inside journal workspaces. Unlike Chat (which is a back-and-forth conversation), Execubriiz watches you write and maintains a **board** — a structured document of themes, notes, checklists, sequences, and diagrams that evolves alongside your entries.

How it works:
1. You open or create a journal in Execubriiz mode.
2. As you write a draft entry, Execubriiz notices (after a short delay) and analyzes what you wrote.
3. It may propose changes to the board: inserting new ideas, editing existing blocks, connecting themes, or attaching "reactions" (short annotations with optional source citations).
4. Structural proposals (moving sections, converting types, retiring blocks) appear as suggestions with a label and reason — they don't apply instantly.
5. When you finish an entry, Execubriiz summarizes it.
6. If something you wrote could benefit from external verification, Execubriiz can run a focused web search and attach the findings.

Execubriiz has three intensity levels:
- **Full** — live companion + board curation + research + summaries
- **Inbox** — summaries only, no live companion
- **Paused** — nothing runs

Each journal can also override which model Execubriiz uses, independent of the app-level routing.

### Memory: What the AI Remembers About You

After conversations, the AI updates a memory profile about you. This is stored locally in briizOS's database (not sent to the cloud). It includes:

- **Work context** — your professional role, active projects, technologies
- **Personal context** — communication preferences, interests
- **Top of mind** — your current priorities and focus areas
- **History** — recent and older topics you've explored
- **Remembered facts** — specific details extracted from conversations (with a confidence score)

This memory is injected into the system prompt so the AI knows who you are across conversations. Facts below a confidence threshold (default 0.7) are not stored. The memory caps at 100 facts, keeping the highest-confidence ones.

You can also write an **"About Me"** section that the AI sees in every conversation.

Memory updates are debounced (default 30 seconds after a conversation turn) so they don't slow down chat.

### Conversation Tags and Titles

After your first exchange, the AI automatically generates a short title for the conversation (max 6 words).

Tags are generated more carefully — the system runs five checks before asking the model:
1. The assistant must have finished a reply (not mid-tool-use)
2. The conversation can't already be at the tag limit
3. The conversation must have reached a checkpoint (2, 4, 8, 16, or 32 exchanges)
4. There must be enough substance (not just "hello" or "thanks")
5. The workspace's existing tags are loaded so the model can reuse them instead of inventing near-duplicates

Tags you manually remove from a conversation are **never re-suggested**.

### Chat Modes

The Chat panel supports different modes that change what context and skills the AI receives:
- **Chat** — general conversation
- **Prioritize** — focused on ranking and scoring your tasks and projects
- **Planner** — daily planning with your schedule and tasks
- **Research** — deep research mode
- **Code** — frontend design and code assistance
- **Report** — consulting-style analysis
- **Plan** — structured planning

Each mode may activate a specialized skill (a set of instructions the AI loads before responding) and connects to the appropriate data tools.

### Skills

Skills are packaged sets of instructions for specific tasks. briizOS ships with dozens of public skills (deep-research, consulting-analysis, day-planner, chart-visualization, image-generation, and many more) plus a custom skills folder for your own.

The AI loads the relevant skill when a chat mode or task matches, reads its instructions, and follows its workflow. Skills live in the `agent/skills/` directory and can be enabled or disabled in settings.

---

# Part 2: For AI Agents and Developers

## Architecture Overview

briizOS.local is an Electron desktop app. The AI runs **in-process** inside the Electron main process — there is no external Python server, no HTTP bridge, no separate port. The runtime is built on **LangChain.js** and **LangGraph.js**.

```
Renderer (React)                    Main Process (Electron/Node.js)
─────────────────                   ───────────────────────────────
InteractionPanel.sendMessage        
  → useChat.sendMessage             
    → IPC: langgraphStreamMessage ──→ electron/agent/index.js
                                       → lead-agent.js (LangGraph ReactAgent)
                                         ├── system-prompt.js (prompt construction)
                                         ├── models.js (provider factory)
                                         ├── tools.js (34 registered tools)
                                         ├── memory.js (long-term memory)
                                         ├── tags.js (auto-tagging)
                                         ├── title.js (title generation)
                                         ├── media.js (image viewing)
                                         ├── checkpointer.js (SQLite persistence)
                                         └── audit.js (credential redaction)
                                       → bridge.js ──→ IPC back to renderer
                                         → src/lib/tools.js (UI-state handlers)
    ← IPC: langgraph-stream-event ←──┘
      (text/tool_call_start/tool_result/
       tool_confirmation/clarification/
       thread_title/thread_tags/end/error)
```

### Entry Points

| File | Role |
|---|---|
| `electron/agent/index.js` | Public API — `start()`, `stop()`, `createThread()`, `streamMessage()`, `resumeRun()`, `sendMessage()`, `fetchSuggestions()` |
| `electron/agent/lead-agent.js` | The LangGraph agent graph — `getOrBuildAgent()`, `streamTurn()`, `resumeTurn()`, `sendTurn()`, `generateSuggestions()` |
| `electron/ai-routing.js` | Capability registry and routing resolution — `routingState()`, `setRoute()`, `testRoute()` |
| `electron/execubriiz/runtime.js` | Separate LangGraph `StateGraph` for journal AI — `ExecRuntime` class |
| `electron/execubriiz/store.js` | Persistence layer for Execubriiz journals — `ExecStore` extends `EventEmitter` |

### Model Factory (`electron/agent/models.js`)

Resolves model names to LangChain chat model instances. The resolution chain:

1. Look up the requested name in `localDataService.listModelProfiles()` (stored in `briizos.db`)
2. Match by `name`, `model`, or `display_name`
3. If no match and no name requested, use the model selected in the **MODEL** tab, then the profile marked `isDefault`, or the first profile
4. If no profiles exist at all, fall back to `claude-sonnet-4-6`

Provider detection logic (`detectProvider()`):
- String contains `codex` → `codex`
- String contains `anthropic` or `claude` → `claude`
- String contains `gpt`, `o1`, `o3`, `openai` → `openai`
- Everything else → `gemini`

Constructor classes:
- Claude: `ChatAnthropic` from `@langchain/anthropic`
- OpenAI: `AuditedChatOpenAI` (extends `ChatOpenAI` with invocation audit callbacks and audited HTTP fetch)
- Gemini: `ChatGoogleGenerativeAI` from `@langchain/google-genai`

API keys resolve in order: environment variable → `localDataService.getProviderApiKey()` (encrypted in `briizos.db`).

**GPT-5.6 specifics:** Uses the Responses API (`useResponsesApi: true`). Reasoning effort values are normalized through `normalizeGpt56ReasoningEffort()` — accepts UI labels like "Light", "Extra High", maps to API values `none|low|medium|high|xhigh|max`. "Ultra" is explicitly rejected with an error (it's a separate multi-agent beta, not a reasoning level).

**Extended thinking (Claude):** When `thinkingEnabled` and the model profile has `supportsThinking: true`, a `thinking` block is added to constructor options with a budget calculated from the configured budget or available output tokens.

### AI Routing (`electron/ai-routing.js`)

Four registered capabilities:

```javascript
CAPABILITIES = [
  { id: 'chat',             routingField: null },             // uses 'selected_model' setting
  { id: 'execubriiz-live',  routingField: 'execubriizLive' }, // inside 'ai_routing' setting
  { id: 'execubriiz-deep',  routingField: 'execubriizDeep' },
  { id: 'background',       routingField: 'background' },
]
```

Resolution order for each capability:
1. Per-capability routing override (stored in the `ai_routing` settings object)
2. For Chat specifically: the `selected_model` setting
3. The model selected in the **MODEL** tab
4. App default model profile

`testRoute()` checks Execubriiz routes using the journal's actual function declarations and validates a `finish_journal_work` response. Other routes use a minimal text probe. The 45-second timeout aborts the underlying request. A successful journal probe establishes a valid result for that probe, not guaranteed success on every journal task.

### System Prompt (`electron/agent/system-prompt.js`)

Built by `applyPromptTemplate()`, which composes these sections:

1. **Role** — "You are {agent_name}, a personal AI assistant in briizOS."
2. **Soul** — Optional custom personality from `agent/.deer-flow/agents/{name}/SOUL.md`
3. **Memory context** — Injected from `getMemoryContext()` (up to `max_injection_tokens`, default 2000)
4. **Thinking style** — Instructions for structured reasoning
5. **Clarification system** — Mandatory clarify-before-act workflow with typed scenarios
6. **Data catalog** — Per-modality data object descriptions from `data-catalog.js`
7. **Skills** — Available skill names, descriptions, and file paths
8. **Subagent system** — When enabled: decompose/delegate/synthesize instructions with hard concurrency limit
9. **Working directory** — File management tool descriptions
10. **Response style** — Clear, personal, action-oriented, contextual
11. **Critical reminders** — Clarification first, skill loading, language consistency
12. **Current date** — `YYYY-MM-DD, Weekday`

### Tool Catalog (`electron/agent/tools.js`)

34 tools in `ALL_TOOLS`, organized into categories:

**Write tools (require confirmation via `confirmToolCall()`):**
- `briizos_create_note`, `briizos_update_note`, `briizos_delete_note`
- `briizos_create_task`, `briizos_complete_task`
- `briizos_create_event`, `briizos_update_event`
- `briizos_update_project_scoring`
- `briizos_schedule_task`, `briizos_unschedule`, `briizos_complete_placement`
- `write_file`, `str_replace`, `copy_file`, `move_file`, `delete_file`
- `bash`

**Read tools (no confirmation, direct SQLite queries):**
- `briizos_list_tasks`, `briizos_get_task`
- `briizos_list_projects`, `briizos_get_project`
- `briizos_query_organizer`
- `briizos_list_placements`, `briizos_get_schedule`
- `briizos_query_data` (generic catalog browser)
- `briizos_search_notes`
- `briizos_search_screen_memory`
- `briizos_get_recent_activity`
- `read_file`, `ls`

**System tools:**
- `view_image` — base64-encodes an image file for the model to see
- `ask_clarification` — interrupts the graph to request user input (typed: `missing_info`, `ambiguous_requirement`, `approach_choice`, `risk_confirmation`, `suggestion`)
- `task` — launches a subagent (general-purpose or bash)

**Tool confirmation flow:**
1. `decideToolAction()` checks if the tool is in `DESTRUCTIVE_TOOLS`
2. If destructive, checks the permission policy (`no-asking` / `ask-destructive` / `ask-always`)
3. Checks the path blacklist
4. If confirmation needed, calls LangGraph `interrupt()` which pauses the graph
5. The renderer shows the confirmation dialog; the user approves or rejects
6. `resumeRun()` continues the graph with the response

**Bash safety:** `bashIsDestructive()` checks the first verb against `DESTRUCTIVE_VERBS` (rm, kill, chmod, etc.) and `SAFE_VERBS` (ls, cat, grep, git, etc.). Pipe chains are checked recursively. Output redirection (`>`) is always destructive.

### Lead Agent Graph (`electron/agent/lead-agent.js`)

Built with `createReactAgent()` from `@langchain/langgraph/prebuilt`. The graph is cached per unique configuration key (model, thinking, temperature, plan mode, subagent settings, skills, modality, allowed tools).

**Pre-model hooks** (run before each LLM call):
1. `viewImagePreModelHook` — resolves pending image views
2. `summarizationPreModelHook` — compresses old messages when conversation exceeds token/message triggers

**Post-model hooks** (run after each LLM response):
1. `subagentLimitPostModelHook` — truncates excess `task` tool calls beyond the concurrency limit (2–4)
2. `titlePostModelHook` — generates conversation title after the first user+assistant exchange
3. `tagPostModelHook` — runs the G1–G5 gate checks and generates tags at checkpoints
4. `memoryPostModelHook` — queues a debounced memory update

**Streaming events** emitted to the renderer via `mapEvent()`:
- `text` — incremental response content
- `tool_call_start` — tool invocation beginning
- `tool_result` — tool output
- `tool_confirmation` — graph interrupt for user approval
- `clarification` — graph interrupt for user input
- `thread_title` — auto-generated title
- `thread_tags` — updated tag list
- `values` — full state snapshot
- `end` — stream complete
- `error` — failure

### Memory System (`electron/agent/memory.js`)

Two-layer memory architecture:

**Layer 1: Conversation summary** (optional, configured via `summarization` settings)
- Triggers on message count, token count, or context fraction
- Keeps recent messages intact, summarizes older ones into a `SystemMessage`
- Cached by content hash per thread

**Layer 2: Long-term memory profile** (always on by default)
- Sections: `user.workContext`, `user.personalContext`, `user.topOfMind`, `user.aboutMe`, `history.recentMonths`, `history.earlierContext`, `history.longTermBackground`
- Facts: extracted with `category` (preference/knowledge/context/behavior/goal) and `confidence` (0.0–1.0)
- Threshold: only facts with confidence >= 0.7 stored (configurable)
- Cap: 100 facts max, sorted by confidence when trimming
- Update process: filters messages (strips upload blocks, tool-call-only turns), formats as conversation text, sends to model with `MEMORY_UPDATE_PROMPT`, parses JSON response, applies updates
- Debounced: queued per-thread, flushes after 30 seconds of quiet
- Upload mentions are stripped from both summaries and facts
- Uses the `background` routing model

### Tag System (`electron/agent/tags.js`)

Five sequential gates (G1–G5) that must all pass before the model is asked:

| Gate | Check | Purpose |
|---|---|---|
| G1 | Turn shape | Only after a completed AI reply, never on subagent/suggestion runs |
| G2 | Tag cap | Stop if conversation already has max tags |
| G3 | Checkpoint | Only evaluate at exchanges 2, 4, 8, 16, 32 |
| G4 | Substance | Min 2 exchanges, 120 user chars, 12 distinct content words, not smalltalk |
| G5 | Vocabulary | Load workspace's existing tags for reuse; fail if DB unavailable |

Post-processing (8 steps): normalize → length check → banlist filter → dismissed-tag filter → dedup → per-run cap → per-thread cap → persist.

Constants: `MAX_TAGS_PER_THREAD` and `MAX_NEW_TAGS_PER_EVALUATION` are imported from `local-data-service.js` (single authority). `EVALUATION_CHECKPOINTS = [2, 4, 8, 16, 32]`.

### Execubriiz Runtime (`electron/execubriiz/runtime.js`)

A separate `StateGraph` (not the main chat agent) with two nodes:
1. **compose** — builds context (board, draft, entries, search results), calls the model with structured output, gets back operations + reactions + research questions
2. **commit** — applies the model's operations to the board document

Job kinds and priority order: `prompt` > `live` > `summary` > others.

Concurrency: max 3 active jobs globally, max 1 per kind per journal. Live jobs are rate-limited (min 3 seconds between runs per journal). Draft changes debounce 1.2–6 seconds before triggering a live job.

The model returns function arguments matching the shared contract in `electron/execubriiz/model-contract.js`: `summary`, `answer`, `operations` (max 12), `reactions` (max 8), and `researchQuestion`. Every field is required; unused scalar fields are null and unused lists are empty. Operation-specific requirements are checked locally before document application.

Provider requests use function calling for both retrieval and result submission, rather than mixing a text-JSON response format with tools:

- OpenAI: strict function parameter schemas, all object properties required, additional properties rejected, parallel calls disabled. Responses uses the native `allowed_tools` required-choice object because the installed adapter drops string `tool_choice` values on that endpoint. All journal functions remain eligible; no last-round final tool is forced.
- Claude: strict `input_schema` declarations with automatic tool choice, compatible with thinking modes/model variants that reject forced tool selection.
- Gemini: generateContent function declarations with OpenAPI-style nullable fields, `ANY` mode and an explicit list of all journal functions. Original model messages retain thought signatures, and tool results carry both name and call ID.

Entry reads include character offsets and end-of-entry information. Invalid arguments receive field-specific tool error responses. Prose and unknown JSON objects are not treated as successful journal results. The exchange limit counts retrieval and rejected replies separately; exhausting it does not imply five malformed responses. Logs identify the job, resolved model, provider, contract, tool calls, validation issues and stop reason.

Offline regression coverage exercises the installed adapters' request builders and a read/rejection/correction conversation (`node --test electron/execubriiz/model-contract.test.cjs`). It does not establish the cause of past Gemini responses whose arguments were not retained, or establish live provider success.

Protocol references: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling), [Claude tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview).

Operations: `insert`, `edit`, `move`, `convert`, `retire`, `addSection`, `rename`, `done`. Structural operations (`move`, `convert`, `retire`) become proposals that apply after a delay, not immediately.

Protected IDs: when a dialog is open over board content, those block IDs are protected from AI edits for 15 seconds.

### Renderer Integration

**`src/hooks/useChat.js`** — The single chat execution path:
- Creates threads via `window.api.langgraphCreateThread()`
- Sends messages via `window.api.langgraphStreamMessage()` with config including model name, thinking settings, temperature, permission policy, modality, files, and tool restrictions
- Handles all stream events and updates React state
- Manages tool confirmation resume via `window.api.langgraphResumeRun()`
- Supports chat modes via `threadKindForModality()` — maps modalities to thread kinds

**`src/hooks/useModelSelection.js`** — Model picker state. Loads profiles from `window.api.getModels()`, checks API key status, persists selection to `selected_model` setting.

**`src/components/briizy/BriizyQuickChatController.jsx`** — The desktop character's bridge into the normal chat engine. It keeps Briizy's active saved conversation for 10 minutes after the last message, then begins the next quick-chat message in a new saved conversation. The desktop window receives live reply, error, and approval states through Electron IPC; it does not run a second AI system.

**`src/context/ChatSettingsContext.jsx`** — Legacy provider settings (deprecated for model selection, still active for chat visual settings like background and blur). Default models listed for reference only; actual model resolution goes through `electron/agent/models.js`.

### Bridge (`electron/agent/bridge.js`)

Direct IPC between main process (agent) and renderer (tool handlers):
- Main → Renderer: `webContents.send('tool-bridge-execute', { requestId, toolName, params, threadId })`
- Renderer → Main: `ipcMain.on('tool-bridge-result', { requestId, result, error })`
- 60-second timeout per call
- No HTTP, no socket, no port

### Audit (`electron/agent/audit.js`)

Every AI model call is audited. The audit system:
- Redacts credentials (API keys, tokens, passwords) from logged payloads — never redacts prompts or message content
- Captures token usage from provider responses
- Provides `providerErrorGuidance()` for common failure modes
- `AuditedChatOpenAI` subclass wraps every OpenAI invoke with HTTP wire-level audit and run-ID correlation

### Provider HTTP Audit (`electron/agent/provider-http-audit.js`)

Wraps the fetch transport to capture raw request/response bodies going to AI providers. Every HTTP call is logged with:
- Full request body (credentials redacted)
- Response status and headers
- Response body for error cases
- Timing data

Audit failures generate specific codes (`AI_AUDIT_REQUIRED_WRITE_FAILED`, `AI_AUDIT_CONTEXT_MISSING`, etc.) that the lead agent checks.

### Data Catalog (`electron/agent/data-catalog.js`)

Defines the queryable surface injected into the system prompt per chat mode. Objects:
- `tasks` — with subtasks, status, priority, Forest project backlinks
- `forest_projects` — milestones, files, scoring fields
- `placements` — scheduled task sessions with live task joins
- `organizer_events` — standalone calendar items
- `organizer_notes` — note items
- `screen_memory` — captured screen observations
- `recent_activity` — cross-domain activity feed

Each object documents its fields, relationships, filters, and which tools query it.

### Thread State (`electron/agent/state.js`)

LangGraph `Annotation.Root` with these channels:
- `messages` — standard LangGraph messages annotation
- `sandbox` — last-write-wins
- `threadData` — last-write-wins
- `title` — last-write-wins (set by title hook)
- `tags` — last-write-wins (full visible list after auto-tagger)
- `artifacts` — merge + dedupe reducer
- `todos` — last-write-wins
- `uploadedFiles` — last-write-wins
- `viewedImages` — merge dict reducer (empty `{}` clears)

### Checkpointer (`electron/agent/checkpointer.js`)

SQLite-backed checkpoint saver for LangGraph conversation persistence. Keyed by `thread_id`. Shared across the process — one checkpointer instance for the lead agent, one for each Execubriiz journal.

### Skills System

Skills are Markdown files with YAML frontmatter (`name`, `description`) discovered by walking `agent/skills/public/` and `agent/skills/custom/`. The agent loads a skill by calling `read_file` on its `SKILL.md` path, then follows the instructions inside.

Currently shipped public skills include: `deep-research`, `consulting-analysis`, `day-planner`, `prioritizer`, `frontend-design`, `data-analysis`, `chart-visualization`, `image-generation`, `video-generation`, `podcast-generation`, `web-design-guidelines`, and 30+ more.

Skills can be enabled/disabled per-skill in settings. The skill system is injected into the prompt via `getSkillsPromptSection()`.

### Key Settings Keys

| Setting key | Purpose |
|---|---|
| `selected_model` | Active chat and Briizy default model profile name |
| `ai_routing` | Object: `{ execubriizLive, execubriizDeep, background }` — per-capability model overrides |
| `agent_config` | Memory and skill configuration |
| `skills_config` | Per-skill enabled/disabled flags |
| `chat_config` | Legacy provider settings + chat visual settings |

### Logging Contract

Per AGENTS.md rule 1: every meaningful AI action produces a log entry in the LogPanel. The agent logs:
- Model resolution (profile, provider, adapter, parameters)
- Tool invocations (name, args, result, timing)
- Memory updates (thread, success/failure)
- Tag evaluations (gate results, model suggestions, kept/dropped with reasons)
- Title generation
- Audit entries (HTTP wire, credential redaction)
- Errors with contextual next-step guidance
