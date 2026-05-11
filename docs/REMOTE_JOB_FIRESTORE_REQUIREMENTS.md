# Remote Job Firestore Requirements

This document maps the Firestore requirements for the message-first remote job model.

## Goal

A remote request like "text Roy the file on my desktop" should live as one job record from start to finish.

Whether the local agent uses zero tools, one shell command, five tool calls, or gets blocked by permissions should not change where that job is represented.

## Core rule

The canonical record for a remote "do this for me" request is a task doc in:

`users/{uid}/tasks/{taskId}`

Specifically:

- `type: "jobPanel"`
- `automated: true`
- user request stored in `title`
- user-visible timeline stored in `taskLog[]`
- execution metadata stored in nested `automation`

Tool tickets are not the canonical representation for this workflow.

## Bucket requirements

### 1. Canonical job bucket

Path:

`users/{uid}/tasks/{taskId}`

Why:

- already visible in existing job/task UI
- already supports `taskLog[]`
- already supports subtasks/steps through `actions[]`
- already has `status`, `completed`, `ignored`, and timestamps

Required fields for message-first remote jobs:

- `id`
- `type: "jobPanel"`
- `title`
- `status`
- `automated: true`
- `ignored: false`
- `createdAt`
- `updatedAt`
- `taskLog[]`
- `automation`
- `source`

Recommended nested `automation` shape:

- `mode: "message-first"`
- `state: "queued" | "running" | "waiting_for_user" | "blocked" | "completed" | "failed" | "cancelled"`
- `runnerId`
- `workerId`
- `threadId`
- `leaseUntil`
- `claimedAt`
- `lastHeartbeatAt`
- `nextRunAt`
- `currentAction`
- `currentTool`
- `awaitingUser`
- `blockedReason`
- `lastError`
- `createdBy`

### 2. User-visible log

Path:

Embedded on the same task doc as `taskLog[]`

Why:

- keeps the human request and its execution history together
- matches the existing task/job card UI
- supports entries like `status`, `question`, `response`, `error`, `tool`

Example entries:

- "Job queued from web"
- "Claimed by local runner"
- "Checking Desktop for task.txt"
- "Contacts permission denied"
- "Waiting for user response"

### 3. Step breakdown

Path:

Embedded on the same task doc as `actions[]`

Why:

- existing task system already knows how to display and persist step lists
- lets the agent break the request into visible subtasks without creating a second queue record

### 4. Worker heartbeat bucket

Path:

`users/{uid}/desktopAgentWorkers/{workerId}`

Why:

- operational visibility is still useful
- worker liveness should remain separate from the human job record

This bucket is optional for UX, but useful for debugging and claims.

### 5. Optional low-level event bucket

Path:

`users/{uid}/desktopAgentEvents/{eventId}`

Why:

- good for ops/debugging
- not required for the user-facing job lifecycle

This should remain secondary. The primary user story should still be understandable from the task doc plus `taskLog[]`.

## Non-requirements

These are not required for the canonical remote-job model:

- a separate tool-ticket queue per user request
- a separate "job response" bucket if replies can be represented as task log entries plus status changes
- a requirement that every job use tools

## Status model

Top-level task status should remain human-readable and UI-friendly.

Suggested top-level values:

- `queued`
- `active`
- `waiting`
- `completed`
- `failed`
- `cancelled`

Suggested nested `automation.state` values:

- `queued`
- `running`
- `waiting_for_user`
- `blocked`
- `completed`
- `failed`
- `cancelled`
- `needs_retry`

Rule of thumb:

- top-level `status` is for the human-facing job card
- nested `automation.state` is for runner/engine control

## Queue semantics

The queue is not a tool list.

The queue is a list of human requests represented as automated `jobPanel` task docs.

The local runner should:

1. claim one task doc
2. mark it active/running
3. run the main agent against that request
4. append logs and step updates back onto that same task doc
5. set waiting/completed/failed on that same task doc

## Current implementation direction

The Local Firestore layer now has foundational helpers for this model:

- `createAutomatedJobTask(...)`
- `appendTaskLogEntry(...)`
- `updateAutomatedJobTask(...)`
- `claimNextAutomatedTask(...)`
- `heartbeatAutomatedTask(...)`

These helpers intentionally keep the canonical job in `tasks`, even if tools are used during execution.
