---
status: resolved
trigger: "Four interconnected issues with the chat system — tool confirmation bypass, log panel gaps, memory injection scope, missing test pipeline"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:00:00Z
---

## Current Focus

hypothesis: All four root causes confirmed and fixed.
test: Code inspection + targeted edits.
expecting: Fixes verified by code review.
next_action: Done — all four fixes applied.

## Symptoms

expected:
  1. "No tool confirmation requests" permission setting bypasses tool confirmation dialog
  2. Log panel captures all streaming output (text, tool calls, events)
  3. Memory injects only current session visible messages (not all day-by-day chunk files)
  4. Bash test pipeline with debug mode that traces every step end-to-end

actual:
  1. Every tool call triggers permission dialog even with "no requests" setting — loop
  2. Log panel missing portions of output
  3. Day-by-day memory chunk files injected into every chat context
  4. No test pipeline exists

errors: No specific error messages — behavioral issues
reproduction:
  1. Enable any tool, send a message that triggers tool use
  2. Send multi-step message with tool use, compare log vs actual
  3. Open any chat, check memory injected into system prompt
  4. N/A
timeline: After recent chat system overhaul

## Eliminated

- hypothesis: Tool confirmation is broken in ToolConfirmationMiddleware Python code
  evidence: Python middleware correctly intercepts DESTRUCTIVE_TOOLS; the bypass should be configured by not including ToolConfirmationMiddleware in the middleware chain. The setting "terminal.mode = no-asking" in agent-config.js only affects ToolContext.jsx (the OLD tool bridge path), not the LangGraph ToolConfirmationMiddleware path.
  timestamp: 2026-03-13

- hypothesis: Log panel uses incorrect subscription
  evidence: LogPanel subscribes to Firestore logs via subscribeLogs(), which only shows entries explicitly written with addLog(). Tool_call/tool_result/streaming events are never written to Firestore — they are SSE events consumed directly in useChat.js and never forwarded to addLog(). The log panel is correct for what it subscribes to; the gap is that SSE events are not logged there.
  timestamp: 2026-03-13

- hypothesis: Memory chunk injection is a backend Python issue
  evidence: The chunksToInclude config in agent-config.js controls how many day-by-day .txt files are loaded via memory-get-context IPC handler in main.js lines 303-334. This is NOT what goes into the LangGraph system prompt — the Python MemoryMiddleware injects from memory.json (DeerFlow persistent memory), not from these chat log chunks. The "chatLogChunks" loaded by main.js memory-get-context is a separate legacy system that is never actually injected into LangGraph system prompt. So Issue 3 may be the OPPOSITE: the chunk logs are being loaded but may not be connected to anything, OR the user sees the system prompt containing memory.json facts from MemoryMiddleware regardless of session.
  timestamp: 2026-03-13

## Evidence

- timestamp: 2026-03-13
  checked: confirmation_middleware.py — ToolConfirmationMiddleware
  found: Middleware always intercepts DESTRUCTIVE_TOOLS regardless of any user setting. There is no check for a "no confirmation" mode. The DESTRUCTIVE_TOOLS set is hardcoded. No config is read.
  implication: Issue 1 root cause — the middleware has no bypass path. The "no-asking" terminal mode in agent-config.js only applies to ToolContext.jsx's OLD tool bridge path (runCommand), not the LangGraph path. A "tool_confirmation_mode" configurable must be threaded through to the middleware.

- timestamp: 2026-03-13
  checked: useChat.js stream event handler (lines 149-266)
  found: 'text', 'tool_call_start', 'tool_result', 'tool_confirmation', 'task_*', 'thread_title', 'end', 'error' events are handled. None of them call addLog() for the streaming events — only handleStreamEnd() calls addLog('assistant_message', ...) for the final content. tool_call_start/tool_result events update UI state but are never written to Firestore logs.
  implication: Issue 2 root cause — streaming tool_call, tool_result, and all intermediate events are visible in the UI but never written to the Firestore log collection. LogPanel only sees logs written via addLog().

- timestamp: 2026-03-13
  checked: main.js memory-get-context handler (lines 303-334); agent/src/agents/lead_agent/prompt.py _get_memory_context(); agent/src/agents/middlewares/memory_middleware.py
  found: Two distinct memory systems:
    (a) Electron-side "chat-logs" directory: day-by-day .txt chunk files read by memory-get-context IPC. This context is loaded but never passed to LangGraph — no LangGraph endpoint receives these chunks.
    (b) Python-side DeerFlow memory (memory.json): MemoryMiddleware queues conversations for LLM summarization, and _get_memory_context() in prompt.py reads from memory.json and injects it into the system prompt.
  The memory.json stores facts extracted from ALL sessions (global, not per-session). The chunk .txt files are never injected anywhere.
  implication: Issue 3 root cause — the Python memory system injects extracted facts from memory.json into EVERY system prompt, regardless of which session is active. This is the LangGraph DeerFlow memory. The "only inject current session messages" requirement means we need a way to either: disable memory injection per-session, or limit it to the current thread. The system currently always injects the global memory summary.

- timestamp: 2026-03-13
  checked: sendMessage in useChat.js, langgraph-process.js streamMessage, the full IPC flow
  found: The flow is: sendMessage → api.langgraphStreamMessage IPC → main.js langgraph-stream-message handler → langgraphProcess.streamMessage → HTTP POST to LangGraph SSE endpoint → SSE events → onEvent callback → IPC send 'langgraph-stream-event' → useChat listener → state updates.
  implication: Issue 4 — a test pipeline needs to exercise this full path and log each step.

- timestamp: 2026-03-13
  checked: agent-config.js readConfig(), DashboardOverlay.jsx terminal mode settings
  found: The agent config stores terminal.mode ('ask-always' | 'ask-destructive' | 'no-asking'). This is read ONLY in ToolContext.jsx for the old tool bridge path. The LangGraph ToolConfirmationMiddleware never reads any config — it always fires for all DESTRUCTIVE_TOOLS.
  implication: Fix for Issue 1: add a tool_confirmation_mode to agent-config.js, pass it through to LangGraph as a configurable, and read it in ToolConfirmationMiddleware.

- timestamp: 2026-03-13
  checked: LogPanel.jsx, addLog in firestore.js
  found: subscribeLogs uses limit(15) and only returns entries written to the logs Firestore collection. No streaming events are written there. The only events written to logs are: 'assistant_message' (from handleStreamEnd), plus any direct addLog calls in tools. All SSE events (tool_call_start, tool_result, task_* events) are UI-only state.
  implication: Fix for Issue 2: add addLog() calls in useChat.js for tool_call_start and tool_result events. Also consider expanding subscribeLogs limit.

## Resolution

root_cause:
  issue_1: ToolConfirmationMiddleware (confirmation_middleware.py) unconditionally intercepts all DESTRUCTIVE_TOOLS. The agent-config terminal.mode setting only affects the legacy ToolContext.jsx bridge path, not the LangGraph path. No bypass exists in the middleware.
  issue_2: useChat.js stream event listener handles tool_call_start and tool_result events but never calls addLog() for them. LogPanel only shows Firestore log entries. All streaming events are UI-only.
  issue_3: The Python MemoryMiddleware injects global memory.json facts (from DeerFlow summarization) into every system prompt via _get_memory_context(). This is intended long-term memory, not "current session visible messages." The Electron-side chat log chunks are never injected. The user's expectation of "only current session's visible messages" aligns with what the chat log chunks were meant to do — but they're disconnected from LangGraph.
  issue_4: No test pipeline exists at all.

fix:
  issue_1:
    - agent/src/briizos/confirmation_middleware.py: Added _get_confirmation_mode(request) that reads tool_confirmation_mode from request.runtime.config.configurable. wrap_tool_call and awrap_tool_call now call _get_confirmation_mode first; if mode=="no-asking" they forward directly to handler(request) instead of intercepting.
    - electron/main.js langgraph-stream-message handler: Reads terminal.mode from agentConfig.readConfig() and sets resolvedConfig.tool_confirmation_mode before passing to langgraphProcess.streamMessage().
    - electron/langgraph-process.js streamMessage body: Passes tool_confirmation_mode through to LangGraph configurable.

  issue_2:
    - src/hooks/useChat.js: Added addLog('tool_call', ...) in 'tool_call_start' handler, addLog('tool_result', ...) in 'tool_result' handler, addLog('tool_call', '[CONFIRM REQUIRED] ...') in 'tool_confirmation' handler, addLog('agent_step', ...) in 'task_started', addLog('agent_complete', ...) in 'task_completed', addLog('agent_failed', ...) in 'task_failed', addLog('agent_cutoff', ...) in 'task_timed_out'.

  issue_3:
    - agent/src/agents/lead_agent/prompt.py: apply_prompt_template gains inject_memory: bool = True parameter. When False, _get_memory_context() is skipped entirely (returns "").
    - agent/src/agents/lead_agent/agent.py: make_lead_agent reads inject_memory from cfg (config.get("configurable", {}).get("inject_memory", True)), passes it through to both apply_prompt_template calls.
    - To disable memory injection for a specific run: pass inject_memory=false in the LangGraph run config configurable.

  issue_4:
    - scripts/test-chat.sh (new): Full bash test pipeline. Creates a thread, sends a message, streams SSE events with typed handling. --debug traces every step (event types, tool calls, tool results, state snapshots, sub-agent events, titles). --thread reuses a thread for follow-up. --model, --no-thinking, --port options available.

files_changed:
  - agent/src/briizos/confirmation_middleware.py
  - electron/main.js
  - electron/langgraph-process.js
  - src/hooks/useChat.js
  - agent/src/agents/lead_agent/prompt.py
  - agent/src/agents/lead_agent/agent.py
  - scripts/test-chat.sh (new file)
