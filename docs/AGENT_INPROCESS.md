# In-Process Agent Port — Phase 2

**Date:** 2026-05-17
**Goal:** From "agent reconnected as Python middleware" to "agent integrated
inside the Electron runtime." Removes the Python subprocess and the
localhost HTTP tool-bridge. Closes the HTTPS / filesystem-isolation gap.

## What "integration" means here

Phase 1 (`docs/AGENT_REWIRE.md`) collapsed two competing AI loops to one
path — but the agent was still a separate Python process talking over
HTTP/SSE, with its own network stack and a sandboxed filesystem
disconnected from the user's Electron-trusted file/terminal handlers.

Phase 2 puts the agent **inside the app**:

```
InteractionPanel → useChat → window.api.langgraphStreamMessage   [IPC]
  → electron/main.js → electron/agent (in-process LangGraph.js)
    → lead_agent graph runs in Electron main
      → tools call the renderer registry directly via IPC:
        electron/agent/bridge.js → 'tool-bridge-execute' → useToolBridge
          → ToolContext.executeTool → src/lib/tools.js
```

No Python subprocess. No `uv run langgraph dev`. No uvicorn gateway. No
HTTP tool-bridge. No port 2024, no port 2025, no port 8001. The agent
is a worker inside the app; it reaches everything else through the
single renderer policy gate the user is building (`__briizosThreadId`).

## Module map (`electron/agent/`)

| File | Purpose |
|---|---|
| `index.js` | Public API matching the retired `langgraph-process.js` — `start`, `stop`, `getStatus`, `createThread`, `streamMessage`, `resumeRun`, `sendMessage`, `fetchSuggestions`, `setMainWindow`. |
| `lead-agent.js` | Graph builder + streaming runner using `@langchain/langgraph` `createReactAgent` with an in-process `MemorySaver` checkpointer. Maps LangChain.js events onto the SSE-shaped vocabulary `useChat.handleStreamEvent` already consumes. |
| `state.js` | `ThreadState` (port of `agent/src/agents/thread_state.py`) — messages + artifacts + viewedImages + title with reducers. |
| `models.js` | Provider-detected model factory (Anthropic / OpenAI / Gemini) reading API keys from the existing `.env`. |
| `system-prompt.js` | Initial system prompt with seams for skills / memory / subagent context (full DeerFlow prompt template port pending — see "Deferred"). |
| `tools.js` | 18 JS tools — 9 briizOS UI-state + 7 filesystem/terminal + 2 lookup. Every tool funnels through `bridge.callRendererTool`. |
| `bridge.js` | Direct IPC roundtrip from main → renderer. Replaces the HTTP tool-bridge. |

## Why this closes the gap the prior pass left open

The Phase-1 wiring kept Python as a subprocess. Two real defects of
that arrangement, both now fixed:

- **HTTPS / network model.** A Python subprocess runs its own network
  stack, bypassing Electron's `webRequest`, certificate handling, and
  proxy settings. With the agent in-process, every outbound call goes
  through Node's HTTPS stack inside the same app — auditable through
  the existing logging surface.
- **Filesystem.** The DeerFlow Python tools ran inside their own
  sandbox (`agent/.deer-flow/`). The user-trusted filesystem and
  terminal handlers in `electron/agent-fs.js` and `electron/agent-terminal.js`
  were unreachable from the agent. The new JS tool set exposes
  `agentReadFile / agentWriteFile / agentDeleteFile / agentMoveFile /
  agentCopyFile / agentListDir / runCommand` — all routed through the
  same policy gate the rest of the app uses.

## Deferred (CLAUDE.md §4)

Real follow-on work, not negotiable scope reductions:

- **Middleware stack port.** `lead_agent/agent.py` composes 12
  middlewares (`ThreadDataMiddleware`, `UploadsMiddleware`,
  `SandboxMiddleware`, `DanglingToolCallMiddleware`,
  `SummarizationMiddleware`, `TodoMiddleware`, `TitleMiddleware`,
  `MemoryMiddleware`, `ViewImageMiddleware`, `SubagentLimitMiddleware`,
  `ToolConfirmationMiddleware`, `ClarificationMiddleware`). Port
  iteratively — title and memory first (they're user-facing), then
  summarization (context management), then the rest.
- **Full system prompt template port.** `system-prompt.js` is a
  minimum-viable port. The full DeerFlow template (~395 lines: skills
  context, memory facts injection, plan-mode tweaks, agent-name
  overrides, subagent guidance) needs to land in `applyPromptTemplate`
  before behavior parity with the Python agent is claimed.
- **Subagents.** `agent/src/subagents/executor.py` is 491 lines of
  parallel subagent dispatch. Port `general_purpose` and `bash_agent`
  first; the full registry/config system afterwards.
- **Skills loader.** `agent/src/skills/loader.py` reads
  `agent/skills/` markdown skill definitions. Port the loader + parser
  into JS so the JS agent can use the same skills the Python agent did.
- **Memory.** `agent/src/agents/memory/` is the long-term memory
  queue + updater. The JS port reads/writes the same `memory.json` via
  Node `fs` directly — no gateway HTTP, no Python.
- **Checkpointer durability.** Currently `MemorySaver` (RAM-only).
  Swap for a SQLite-backed saver so thread state survives restarts.
- **Retire `agent/` and Python deps.** Once the middleware + subagents
  + skills land in JS at parity, the entire `agent/` Python tree moves
  to `.rewire-removed/` and the app ships with zero Python in the
  running runtime.

## Verification

- `node --check` passes on every file in `electron/agent/` plus the
  edited `main.js` / `preload.js`.
- `vite build` compiles all renderer modules cleanly with the new
  wiring (the renderer half didn't need to change — same IPC surface).
- The IPC name parity between `preload.js` ↔ `main.js` ↔ `useChat.js`
  was preserved verbatim, so no UI changes were necessary.

## Two-layer hygiene

Per CLAUDE.md §4: the symptom fixed here is "agent isn't actually in
the app." The structural change — moving the agent into the Electron
runtime and routing all tool calls through the renderer's single
policy gate — eliminates the entire class of "the agent runs in a
parallel world" defects (HTTPS bypass, filesystem isolation, separate
log streams, lifecycle drift). Future agent capabilities are added by
extending the JS graph/tools, not by adding more bridges.
