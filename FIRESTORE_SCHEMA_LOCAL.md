# briizOS.Local Firestore Schema Map (`src/lib/firestore.js`)

This table reflects what `briizOS.Local` writes to Firestore today (primarily via `src/lib/firestore.js`).

| Firestore path | Fields written | Nomenclature notes |
| --- | --- | --- |
| `users/{uid}/panels/{noteId}` | `type` (`note`), `title`, `content`, `customColor` (`{h,s,l}`), `color`, `x`, `y`, `width`, `w`, `height`, `h`, `active`, `isDocked`, `createdAt`, `updatedAt` | Dual size keys (`width` + `w`, `height` + `h`). Timestamp style is Firestore `serverTimestamp()`. |
| `users/{uid}/tasks/{taskId}` | `type`, `name`, `title`, `completed`, `status`, `priority`, `dueDate`, `parentId`, `createdAt`, `updatedAt` | Uses both `name` and `title`. Subtasks are separate docs linked by `parentId`. |
| `users/{uid}/events/{eventId}` | `type` (`event`), `name`, `title`, `description`, `scheduledDate`, `time`, `endTime`, `startMinute`, `durationMinutes`, `color`, `completed`, `allDay`, `projectId`, `createdAt`, `updatedAt` | Mixed time/date representation (`time` strings + minute integers). |
| `users/{uid}/organizer/{id}` (project flow) | `type` (`project`), `name`, `description`, `domain`, `status`, `completed`, `deadline`, `importance`, `size`, `relevance`, `tags[]`, `tasks[]`, `milestones[]`, `createdAt`, `updatedAt` | Project writes use numeric `Date.now()` timestamps, not Firestore timestamp sentinels. |
| `users/{uid}/organizer/{id}` (organizer-item flow) | `type`, `name`, `body`, `createdAt`, `updatedAt`, `scheduledDate`, `start`, `end`, `due`, `duration`, `completedAt`, `status`, `priority`, `tags[]`, `source`, `dateMode`, `dateValue`, `recurrence`, `owner`, `visibility`, `syncSource`, `lastModified`, `history[]` | Also numeric timestamps (`Date.now()`). Shares same collection as projects, so schema is polymorphic/disjoint. |
| `users/{uid}/desktopChatMessages/{msgId}` | `role`, `content`, `isError`, `timestamp` | Desktop-only chat log; `timestamp` is `serverTimestamp()`. |
| `users/{uid}/desktopSessions/{sessionId}` | `name`, `startTime`, `endTime`, `data` (notably `data.events[]`) | `data.events[]` entries use ISO string `timestamp` and arbitrary event payload in `data`. |
| `users/{uid}/desktopSelectedFiles/{fileId}` | `filePath`, `fileName`, `addedAt` | `fileId` is derived from base64(filePath) and sanitized. |
| `users/{uid}/desktopSettings/config` | Dynamic key/value settings via `{ [key]: value }` | Common keys from UI: `chatConfig`, `github_token`, `openai_api_key`, `gemini_api_key`, `claude_api_key`, `studio_video_url`, `studio_website_url`, `studio_replicate_url`, `studio_suno_url`, `studio_dalle_url`, `studio_ideogram_url`, `studio_myaudio_url`, `studio_briizclerk_url`. |
| `users/{uid}/desktopSettings/layout` | `config`, `updatedAt` | `config` typically contains `{ panels: [...], version }`. |
| `users/{uid}/desktopLogs/{logId}` | `action`, `message`, `timestamp` | Desktop-only operational logs. |
| `users/{uid}/desktopRemoteChat/{msgId}` | `role`, `content`, `timestamp`, `read` | Remote chat bridge collection; `read` toggled with merge writes. |
| `users/{uid}/desktopAgentJobs/{jobId}` | `id`, `type` (`tool`), `tool`, `params`, `opId`, `status`, `workerId`, `leaseUntil`, `retryCount`, `maxRetries`, `nextRunAt`, `createdAt`, `updatedAt`, `finishedAt`, `result`, `lastError`, `source`, `createdAtServer`, `updatedAtServer` | Queue consumed by autonomous workers. Remote/web can enqueue by writing one doc. |
| `users/{uid}/desktopAgentWorkers/{workerId}` | `workerId`, `state`, `currentJobId`, `lastSeenAt`, `lastSeenAtServer` | Worker heartbeat/lease visibility. |
| `users/{uid}/desktopAgentToolOps/{opId}` | `opId`, `jobId`, `tool`, `status`, `startedAt`, `completedAt`, `result`, `error`, `startedAtServer`, `completedAtServer` | Idempotency ledger keyed by `opId`; reused result on duplicate ops. |
| `users/{uid}/desktopAgentEvents/{eventId}` | `type`, `payload`, `createdAt`, `createdAtServer` | Append-only execution/event log for tracing and UI timelines. |

Deletion behavior:
- `deleteDoc` is used for note/task/event/project/organizer/session/selected-file/remote-chat item deletion paths.
- Some clears use `writeBatch` deletes (`tasks` subtasks + parent, chat history clear, selected files clear).

## Verified Non-Firestore Persistence (Local App)

| Concern | Storage location | Key/schema |
| --- | --- | --- |
| Chat settings local cache | `localStorage` | `briizos2.chatSettings.v1` |
| Firestore SDK cache | IndexedDB (Firebase-managed) | Enabled via `initializeFirestore(...persistentLocalCache(...))` in `src/lib/firebase.js` |

Notes:
- Direct Firestore SDK calls are centralized in `src/lib/firestore.js`; other app code calls this layer.
- Timestamp conventions are mixed across flows (`serverTimestamp()` vs numeric `Date.now()`), including within the same top-level user namespace.

## Remote enqueue helper (web/online)

`src/lib/firestore.js` now exposes:
- `enqueueRemoteAgentToolJob(tool, params, options)` -> `{ jobId, opId }`
- `subscribeAgentJob(jobId, callback)` -> live status/result updates
- `subscribeAgentEvents(callback, maxItems)` -> live execution log

Minimal enqueue payload equivalent:
- Path: `users/{uid}/desktopAgentJobs/{jobId}`
- Required fields: `type: "tool"`, `tool`, `params`, `status: "pending"`, `createdAt`, `updatedAt`
- Recommended fields: `opId`, `nextRunAt`, `retryCount`, `maxRetries`, `source`
