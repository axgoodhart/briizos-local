# Agent Backend Reintegration — Single Path Rewire

**Date:** 2026-05-15
**Goal:** briizOS.Local had two competing AI execution paths. Consolidate to
one: the Python DeerFlow/LangGraph agent in `agent/`. Remove the direct
browser→provider streaming path entirely.

## The problem

The "remove langchain" commit had severed the frontend from the `agent/`
backend and substituted a direct-to-provider streaming path (`chat-api.js`).
The Python agent, its tool-bridge, and its IPC plumbing still existed but
nothing started the Python process or routed chat through it. Tool
registries, system prompts, streaming loops, and confirmation gates were
duplicated across JS and Python. The chat UI only ever used the direct path.

## The single canonical path (after rewire)

```
InteractionPanel.sendMessage
  → useChat.sendMessage
    → window.api.langgraphStreamMessage(streamId, threadId, msg, config)   [IPC]
      → electron/main.js  → langgraph-process.streamMessage                [SSE :2024]
        → LangGraph dev server, graph "lead_agent" (DeerFlow agent)
          → agent turn runs; when it needs a briizOS UI-state tool:
              agent → HTTP POST :2025 (tool-bridge)
                → electron/tool-bridge.js → IPC
                  → useToolBridge → ToolContext.executeTool  (THE one executor)
                    → src/lib/tools.js handler → firestore.js adapters
  ← SSE events (text / tool_call_start / tool_result / tool_confirmation /
     task_* / thread_title / values / end / error) pushed on
     'langgraph-stream-event' → useChat renders + persists final message
```

There is exactly one AI loop, one tool executor (`ToolContext.executeTool`),
one system prompt (Python `apply_prompt_template`), one tool catalog (the
Python agent's tools; `briizos_*` tools bridge to the renderer registry),
and one confirmation authority (the agent's Python middleware, surfaced via
the `tool_confirmation` SSE event and resolved with `langgraphResumeRun`).

## What changed

| File | Change |
|---|---|
| `electron/main.js` | Require + lifecycle-manage `langgraph-process`; added `langgraph-*` IPC handlers + SSE→renderer push; updated startup log & deprecated `execute-tool` notice |
| `electron/preload.js` | Exposed `langgraphGetStatus/CreateThread/StreamMessage/ResumeRun/SendMessage/FetchSuggestions` + `onLanggraphStreamEvent` |
| `src/hooks/useChat.js` | Rewritten to stream from the agent via IPC; renders SSE events; owns thread lifecycle; confirmation → resume. No provider calls, no local tool execution |
| `src/hooks/useToolBridge.js` | Routes through the canonical `ToolContext.executeTool` (fixes the missing-`layoutHook` bug structurally; removes duplicate registry logic) |
| `src/App.jsx` | Removed `setBriizToolsContext` import + effect (context now flows via ToolContext only) |
| `package.json` | Added `dev:debug` (CLAUDE.md §3) |
| `.gitignore` | Ignore quarantine + verify dirs |

**Removed (quarantined in `.rewire-removed/`):** `chat-api.js`,
`system-prompt.js`, `briizos-tools.js`, `lib/useTaskAutomation.js` (dead,
called non-existent IPC). They were moved, not `git rm`'d, because this
sandbox cannot unlink tracked files — see `.rewire-removed/README.md` for
the one-line permanent-delete command to run on your machine.

## Compliance

**Logging (CLAUDE.md §1, §3):** All new chat/tool/agent/backend actions log
via the renderer `logger` (visible in LogPanel) under `chat` / `tool.*` /
`agent.*` categories; backend status is surfaced into the LogPanel too.
`dev:debug` activates debug-level structured terminal logging in the
existing `[HH:MM:SS] [category] LEVEL msg {data}` format.

**SyncContract (CLAUDE.md §2):** The rewire introduces no new write path.
The agent's briizOS tools reach the *existing* `tools.js` handlers
(`upsertNote`/`addTask`/`addScheduleItem`) which already write through the
`noteAdapter`/`taskAdapter`/`calendarAdapter` envelope in `syncAdapters`.
Compliance is preserved by reuse; adapters were not modified.

**Verification:** `node --check` passes on all changed electron files;
`vite build` transforms all 474 modules and builds clean with no
unresolved imports and zero references to the removed files. Backend
coherence (langgraph dev → `lead_agent` → `briizos_*` → :2025 bridge)
confirmed intact and runnable (`agent/.venv` has `langgraph`; config wires
the 9 briizOS tools).

## Deferred (two-layer hygiene, CLAUDE.md §4)

These are intentionally out of the chat-rewire scope and recorded here
rather than half-done:

- **Permanent delete:** run the `git rm` in `.rewire-removed/README.md`.
- **`useAgentWorkers` / `agentJobsFirestore`:** a dormant autonomous
  Firestore-job subsystem. It already uses the same `ToolContext.executeTool`,
  so it is *not* a competing tool executor — but it has no producer and is
  unrelated to chat. Left intact; converge or remove in a dedicated pass.
- **Task automation:** `src/hooks/useTaskAutomation.js` is a live no-op
  stub. The `langgraphStreamMessage`/`langgraphSendMessage` IPC it needs to
  become agent-driven now exists; wiring it is a separate feature.
- **Pre-existing build advisories** (taskAutomation dynamic/static import
  mix; >500 kB chunk) predate this work and were not touched.
- **Stream cancellation:** no explicit cancel IPC; an in-flight turn runs
  to completion. Add a `langgraph-cancel` + AbortController hook later.
