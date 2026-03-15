# AI Tool Catalog

Generated: `2026-03-13T10:20:23.421Z`
Source: `src/lib/tools.js`

## Summary
- Total tools: **43**
- Implemented: **33**
- Limited: **8**
- Stub: **2**

## Read-Only / Analysis
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `getScheduleSummary` | No | Get a summary of scheduled events | Implemented |
| `searchNotes` | No | Search through note panels | Implemented |
| `findScheduleConflicts` | No | Find overlapping events in schedule | Implemented |
| `lookupOnline` | No | Search the web for information | Stub |

## Filesystem Agent
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `agentReadFile` | No | Read a file from the filesystem | Implemented |
| `agentWriteFile` | No | Write content to a file (creates or overwrites) | Implemented |
| `agentDeleteFile` | Yes | Delete a file or directory | Implemented |
| `agentMoveFile` | Yes | Move or rename a file (destructive) | Implemented |
| `agentCopyFile` | No | Copy a file or directory (non-destructive) | Implemented |
| `agentListDir` | No | List directory contents | Implemented |

## Terminal
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `runCommand` | Yes* | Execute a terminal command | Implemented |

## Canvas
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `openCanvas` | No | Open the Live Canvas with HTML/CSS/JS content | Implemented |
| `updateCanvas` | No | Update the current Live Canvas content | Implemented |
| `listCanvases` | No | List saved canvases | Implemented |
| `loadCanvas` | No | Load a previously saved canvas | Implemented |

## Memory
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `updateAgentMemory` | No | Update persistent agent memory/context | Implemented |

## Tasks / Calendar / Notes
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `completeTask` | Yes | Mark a task as completed | Implemented |
| `createThoughtStream` | Yes | Create a new task | Implemented |
| `createPrioritizedTaskList` | Yes | Create a prioritized list of tasks | Implemented |
| `createSingleCalendarEvent` | Yes | Create a one-time calendar event | Implemented |
| `updateCalendarEvent` | Yes | Update an existing calendar event | Implemented |
| `createRecurringCalendarEvent` | Yes | Create a recurring calendar event | Implemented |
| `createNotePanel` | Yes | Create a new note panel with content | Implemented |
| `updateNoteContent` | Yes | Update note content | Implemented |
| `setPanelColor` | Yes | Change panel color | Implemented |
| `setPanelTitle` | Yes | Change panel title | Implemented |
| `deletePanel` | Yes | Delete a panel | Implemented |
| `duplicatePanel` | Yes | Duplicate an existing panel | Implemented |

## Panel/Layout Controls
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `movePanel` | No | Move panel to specific coordinates | Limited |
| `resizePanel` | No | Resize panel | Limited |
| `openPanel` | Yes | Open/show a panel | Implemented |
| `minimizePanel` | Yes | Minimize a panel | Implemented |
| `restorePanel` | Yes | Restore a minimized panel | Implemented |
| `tilePanels` | No | Arrange panels in grid | Limited |
| `groupPanelsByType` | No | Group panels by type | Limited |
| `stackPanelsVertically` | No | Stack panels vertically | Limited |
| `focusMode` | Yes | Minimize all panels except one | Limited |
| `minimizeAllPanels` | Yes | Minimize all panels | Limited |
| `closeAllPanels` | Yes | Close all panels | Limited |

## Timer
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `startTimer` | Yes | Start a timer | Stub |

## Uncategorized
| Tool | Confirm | Purpose | Status |
|---|---|---|---|
| `taskComplete` | No | Signal that the requested task has been fully and successfully completed. You MUST call this when the goal is achieved — the loop will not stop otherwise. | Implemented |
| `taskFailed` | No | Signal that the task cannot be completed. Call this when you have exhausted all options or hit a hard blocker. Never silently stop. | Implemented |
| `updateScratchpad` | No | Update your working scratchpad (visible as a live iframe). Call at the start of each step with: current goal, steps completed so far, last result, and what you plan to do next. | Implemented |

## Notes
- `runCommand` confirmation is dynamic: terminal mode can change behavior (`ask-always`, `ask-destructive`, `no-asking`) in `src/context/ToolContext.jsx`.

## Regenerate
- Run: `npm run tools:catalog`
