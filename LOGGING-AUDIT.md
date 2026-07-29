# briizOS Logging Audit

Audit date: 2026-07-28

## Verdict

The existing logging is operational telemetry, not an explanation of what briizOS did. The code records useful evidence, but the Sources panel throws that evidence away and the terminal compresses it into machine labels plus JSON. Startup language also treats “a component was initialized” as if “the feature worked,” which is false for AI requests, task automation, location, and screen capture.

The audit covered the shared renderer and Electron loggers, the Sources-panel log renderer, SQLite log persistence, and at least 382 direct `logger.*` / `log.*` call sites across `electron/` and `src/`. It also inspected the indirect `_log` adapters used by briizy screen memory, the capture helper, the indexer, the coordinator, and the shell.

## Critical

1. **Chat is absent from the activity record.**
   - The user message is saved to `messages`, but `useChat` did not emit a corresponding transcript log.
   - Assistant logging truncated content to 1,200 characters.
   - Impact: a failed provider request leaves no plainly visible record of what the user sent.

2. **The Sources panel hides the evidence every log already contains.**
   - It renders only date, time, `[level:category]`, and `message`.
   - It never renders `data`, `type`, `threadId`, `sessionId`, or the exact error.
   - Impact: “Failed” has no visible cause or continuity.

3. **Electron-main logs are not written to SQLite.**
   - Renderer logs call `localData.logs.append`; Electron-main logs only go to the terminal and a 500-entry memory buffer.
   - Impact: startup, database, capture-helper, and provider-runtime evidence disappears after restart and cannot be inspected in Prisma Studio.

## High

1. **Readiness language overclaims proof.**
   - “Agent runtime ready” proves only that the in-process code initialized.
   - It does not prove a provider accepted a request, a model answered, or quota is available.

2. **Task automation wording implies work is running.**
   - “Task automation active” means a listener was installed.
   - It does not mean an automated task exists or is being processed.

3. **Screen-memory internals are anthropomorphic and implementation-led.**
   - “Helper ready,” “Coordinator started,” “Session opened,” and assistant registration logs describe machinery rather than capture cadence, OCR cadence, permission, or whether pixels were stored.
   - An automatic “session” is only a storage group for consecutive screen-history frames; it is not an AI or task-automation session.

4. **Terminal output makes evidence hard to parse.**
   - Category codes, fixed-width severity tokens, event-type prefixes, and raw single-line JSON compete with the actual outcome.
   - Nested data has no human-readable field labels.

## Medium

1. **Weather fallback logs describe intermediate failures but not the final effect.**
   - A location timeout, main-process weather failure, and renderer-fetch failure can appear as unrelated warnings.
   - The log must state that only the header weather is affected and whether timezone coordinates are being used.

2. **Generic failure wording is widespread.**
   - “Failed to…” often includes the exact error in structured data, but the current panel hides it.
   - Central evidence rendering resolves the entire class while individual high-value flows still need explicit effect/next-action wording.

3. **The panel shows only the current memory buffer.**
   - SQLite already has a filtered `listLogs` method, but it was not exposed to the renderer.
   - Impact: history disappears from the in-app panel even when it exists in the database.

## Positive Findings

- Renderer logs already use a shared entry shape with stable IDs, exact event types, levels, timestamps, thread IDs, session IDs, and structured evidence.
- SQLite has an append-only `logs` table and a query implementation that preserves structured JSON.
- User messages are appended before the provider call, so they can survive OpenAI quota failures once the schema and visibility gaps are closed.
- Capture configuration already contains the exact screenshot cadence, OCR cadence, retention, permission, and fallback state needed for honest explanations.

## Required Standard

Every visible log must answer these questions without requiring code knowledge:

1. What was attempted or observed?
2. What actually happened?
3. What evidence supports that statement?
4. What user-visible feature is affected?
5. If it failed or fell back, what happens next?

Developer identifiers and raw payloads remain available in expanded evidence; they are not the headline.

## Remediation Applied

- Every successful `messages` insert now emits the complete user or assistant text from the database boundary, so chat written by the main panel, planner, or deck maker follows the same rule.
- Electron-main and renderer activity is retained in SQLite; the in-app panel merges current activity with saved history and exposes complete structured evidence on expansion.
- The terminal uses ordinary category names, one-line explanations, labeled evidence, and an explicit SQLite pointer when a very large message is shortened for terminal readability.
- Startup, screen memory, task automation, location fallback, permissions, and AI-provider logs now distinguish preparation from proof of a completed result.
- AI turns have a separate append-only developer ledger containing provider/model settings, full LangChain message envelopes, system/tool traffic, duplicates, results, exact errors, and provider-reported token usage. OpenAI entries additionally retain the final serialized HTTP request body immediately before network dispatch (with credentials redacted); Anthropic and Gemini currently expose the complete LangChain provider boundary rather than their adapters’ private HTTP serialization.
- Required request and outcome records are fail-closed. The initial turn record is saved before the graph can contact any provider. OpenAI’s final serialized request is also saved and correlated to its LangChain invocation before network dispatch. Anthropic/Gemini expose their final request only at LangChain’s provider boundary, so a storage failure there stops the turn and prevents any success claim, while truthfully noting that provider dispatch may already have begun.
