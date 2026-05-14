/**
 * briizOS Tools - Tool execution bridge for the AI assistant
 * Adapted from briizOS.Web chat-module for Electron environment
 *
 * This module provides tool definitions and execution capabilities
 * that bridge AI tool calls to briizOS functionality.
 *
 * Execution path (as of the "no-langgraph" remediation):
 *   useChat → BriizTools.execute → direct call into src/lib/tools.js
 *   registry using the renderer-side handlers that are already wired to
 *   Firestore + the layout hook. This is the same shape useToolBridge
 *   uses for Python agent requests, minus the HTTP/IPC hops.
 *
 * Runtime wiring: App.jsx calls setBriizToolsContext({ appContext, layoutHook })
 * once the ToolProvider + AppContext are mounted, so the handlers receive
 * the data they need (tasks, notes, events) plus the layout hook for
 * panel-level tools.
 */

import { getToolRegistry } from './tools';
import { enqueueMargerin, toast } from './bfast-queue';
import { formatMargerinLabel, formatToastMessage } from './bfast-format';

// Runtime-injected context. Populated by App.jsx AppContent once the
// AppContext subscriptions and the layout hook are ready. Before that
// point, handlers that depend on context receive empty arrays/null and
// degrade gracefully (the real handlers already handle missing context).
let _briizToolsRuntime = { appContext: null, layoutHook: null };

/**
 * Inject the live appContext (notes/tasks/events/projects) and layoutHook
 * into the BriizTools execution pipeline. Call this from a useEffect in
 * AppContent whenever either changes.
 */
export function setBriizToolsContext({ appContext = null, layoutHook = null } = {}) {
  _briizToolsRuntime = { appContext, layoutHook };
}

export function getBriizToolsRuntime() {
  return _briizToolsRuntime;
}

class BriizTools {
  constructor() {
    this.tools = this.defineTools();
  }

  /**
   * Define all available tools with their schemas
   */
  defineTools() {
    return {
      // Read-Only Tools
      getScheduleSummary: {
        name: 'getScheduleSummary',
        description: 'View scheduled events for a given time range',
        parameters: {
          time_range: {
            type: 'string',
            description: 'Time range to check (e.g., "today", "this week", "next 3 days")',
            optional: false
          }
        }
      },
      searchNotes: {
        name: 'searchNotes',
        description: 'Search through notes with optional topic filter',
        parameters: {
          query: {
            type: 'string',
            description: 'Search query string',
            optional: false
          },
          topic_filter: {
            type: 'string',
            description: 'Optional topic/category filter',
            optional: true
          }
        }
      },
      lookupOnline: {
        name: 'lookupOnline',
        description: 'Search the web and optionally create a panel with results',
        parameters: {
          query: {
            type: 'string',
            description: 'Search query',
            optional: false
          },
          target: {
            type: 'string',
            description: 'Optional target for results (e.g., "panel", "clipboard")',
            optional: true
          },
          source: {
            type: 'string',
            description: 'Optional source preference (e.g., "google", "duckduckgo")',
            optional: true
          }
        }
      },
      findScheduleConflicts: {
        name: 'findScheduleConflicts',
        description: 'Find overlapping events in the schedule',
        parameters: {
          time_range: {
            type: 'string',
            description: 'Optional time range to check for conflicts',
            optional: true
          }
        }
      },

      // Panel Management Tools
      openPanel: {
        name: 'openPanel',
        description: 'Open an existing panel by title',
        parameters: {
          panel_title: {
            type: 'string',
            description: 'Title of the panel to open',
            optional: false
          }
        }
      },
      createNotePanel: {
        name: 'createNotePanel',
        description: 'Create a new note panel with optional content',
        parameters: {
          title: {
            type: 'string',
            description: 'Title for the new note panel',
            optional: false
          },
          content: {
            type: 'string',
            description: 'Optional initial content for the note',
            optional: true
          }
        }
      },
      updateNoteContent: {
        name: 'updateNoteContent',
        description: 'Update content of a note panel',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to update',
            optional: false
          },
          new_content: {
            type: 'string',
            description: 'New content to add or replace',
            optional: false
          },
          mode: {
            type: 'string',
            description: 'Update mode: "append" (default) or "replace"',
            optional: true
          }
        }
      },
      setPanelColor: {
        name: 'setPanelColor',
        description: 'Change panel color using HSL values',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel',
            optional: false
          },
          hue: {
            type: 'number',
            description: 'Hue value (0-360)',
            optional: false
          },
          saturation: {
            type: 'number',
            description: 'Saturation value (0-100)',
            optional: false
          },
          lightness: {
            type: 'number',
            description: 'Lightness value (0-100)',
            optional: false
          }
        }
      },
      movePanel: {
        name: 'movePanel',
        description: 'Move panel to specific coordinates',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel',
            optional: false
          },
          x: {
            type: 'number',
            description: 'X coordinate',
            optional: false
          },
          y: {
            type: 'number',
            description: 'Y coordinate',
            optional: false
          }
        }
      },
      resizePanel: {
        name: 'resizePanel',
        description: 'Resize panel to specific dimensions',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel',
            optional: false
          },
          width: {
            type: 'number',
            description: 'Width in pixels',
            optional: false
          },
          height: {
            type: 'number',
            description: 'Height in pixels',
            optional: false
          }
        }
      },
      duplicatePanel: {
        name: 'duplicatePanel',
        description: 'Duplicate an existing panel',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to duplicate',
            optional: false
          }
        }
      },
      deletePanel: {
        name: 'deletePanel',
        description: 'Delete a panel',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to delete',
            optional: false
          }
        }
      },
      minimizePanel: {
        name: 'minimizePanel',
        description: 'Minimize a panel',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to minimize',
            optional: false
          }
        }
      },
      restorePanel: {
        name: 'restorePanel',
        description: 'Restore a minimized panel',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to restore',
            optional: false
          }
        }
      },
      setPanelTitle: {
        name: 'setPanelTitle',
        description: 'Change panel title',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or current title of the panel',
            optional: false
          },
          new_title: {
            type: 'string',
            description: 'New title for the panel',
            optional: false
          }
        }
      },

      // Workspace Organization Tools
      tilePanels: {
        name: 'tilePanels',
        description: 'Arrange all panels in a grid layout',
        parameters: {}
      },
      groupPanelsByType: {
        name: 'groupPanelsByType',
        description: 'Auto-arrange panels grouped by their type',
        parameters: {}
      },
      stackPanelsVertically: {
        name: 'stackPanelsVertically',
        description: 'Stack panels vertically',
        parameters: {
          panel_ids: {
            type: 'array',
            description: 'Optional array of panel IDs to stack',
            optional: true,
            items: { type: 'string' }
          }
        }
      },
      focusMode: {
        name: 'focusMode',
        description: 'Minimize all panels except one for focused work',
        parameters: {
          panel_id: {
            type: 'string',
            description: 'ID or title of the panel to keep open',
            optional: false
          }
        }
      },
      minimizeAllPanels: {
        name: 'minimizeAllPanels',
        description: 'Minimize all active panels',
        parameters: {}
      },
      closeAllPanels: {
        name: 'closeAllPanels',
        description: 'Close all panels (requires confirmation)',
        parameters: {
          confirm: {
            type: 'boolean',
            description: 'Must be true to confirm closing all panels',
            optional: false
          }
        }
      },

      // Task & Event Management Tools
      completeTask: {
        name: 'completeTask',
        description: 'Mark a task as completed',
        parameters: {
          task_id: {
            type: 'string',
            description: 'ID or title of the task to complete',
            optional: false
          }
        }
      },
      createThoughtStream: {
        name: 'createThoughtStream',
        description: 'Create a floating thoughtstream task',
        parameters: {
          text: {
            type: 'string',
            description: 'Content of the thought',
            optional: false
          },
          priority: {
            type: 'string',
            description: 'Optional priority level (low, medium, high)',
            optional: true
          },
          due_date: {
            type: 'string',
            description: 'Optional due date (YYYY-MM-DD)',
            optional: true
          }
        }
      },
      createPrioritizedTaskList: {
        name: 'createPrioritizedTaskList',
        description: 'Generate a prioritized task list based on criteria',
        parameters: {
          criteria: {
            type: 'string',
            description: 'Criteria for prioritization (e.g., "due today", "high priority", "project X")',
            optional: false
          }
        }
      },
      createSingleCalendarEvent: {
        name: 'createSingleCalendarEvent',
        description: 'Create a one-time calendar event',
        parameters: {
          title: {
            type: 'string',
            description: 'Event title',
            optional: false
          },
          date: {
            type: 'string',
            description: 'Event date (YYYY-MM-DD)',
            optional: false
          },
          time: {
            type: 'string',
            description: 'Event time (e.g., "9am", "2:30pm", "14:00")',
            optional: true
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (default: 60)',
            optional: true
          }
        }
      },
      updateCalendarEvent: {
        name: 'updateCalendarEvent',
        description: 'Move or modify an existing calendar event',
        parameters: {
          event_title: {
            type: 'string',
            description: 'Title of the event to update',
            optional: false
          },
          new_date: {
            type: 'string',
            description: 'New date (YYYY-MM-DD)',
            optional: false
          },
          target_date: {
            type: 'string',
            description: 'Original date if title is ambiguous (YYYY-MM-DD)',
            optional: true
          }
        }
      },
      createRecurringCalendarEvent: {
        name: 'createRecurringCalendarEvent',
        description: 'Create a recurring calendar event',
        parameters: {
          title: {
            type: 'string',
            description: 'Event title',
            optional: false
          },
          recurrence_type: {
            type: 'string',
            description: 'Recurrence type: "weekly" or "monthly"',
            optional: false
          },
          days_of_week: {
            type: 'array',
            description: 'Array of day numbers, 0=Sun through 6=Sat',
            optional: false,
            items: { type: 'number' }
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
            optional: true
          },
          time: {
            type: 'string',
            description: 'Event time (e.g., "9am", "2:30pm")',
            optional: true
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (default: 60)',
            optional: true
          }
        }
      },

      // Workspace Tools
      startTimer: {
        name: 'startTimer',
        description: 'Create a timer with optional title',
        parameters: {
          duration_minutes: {
            type: 'number',
            description: 'Timer duration in minutes',
            optional: false
          },
          title: {
            type: 'string',
            description: 'Optional timer title',
            optional: true
          }
        }
      },

      // Filesystem + terminal tools
      agentReadFile: {
        name: 'agentReadFile',
        description: 'Read a file from the filesystem',
        parameters: {
          path: {
            type: 'string',
            description: 'Absolute path to the file',
            optional: false
          }
        }
      },
      agentWriteFile: {
        name: 'agentWriteFile',
        description: 'Write content to a file (creates or overwrites)',
        parameters: {
          path: {
            type: 'string',
            description: 'Absolute path to write to',
            optional: false
          },
          content: {
            type: 'string',
            description: 'File content',
            optional: false
          },
          opId: {
            type: 'string',
            description: 'Optional idempotency key',
            optional: true
          }
        }
      },
      agentDeleteFile: {
        name: 'agentDeleteFile',
        description: 'Delete a file or directory',
        parameters: {
          path: {
            type: 'string',
            description: 'Absolute path to delete',
            optional: false
          },
          opId: {
            type: 'string',
            description: 'Optional idempotency key',
            optional: true
          }
        }
      },
      agentMoveFile: {
        name: 'agentMoveFile',
        description: 'Move or rename a file (destructive)',
        parameters: {
          source: {
            type: 'string',
            description: 'Source path',
            optional: false
          },
          destination: {
            type: 'string',
            description: 'Destination path',
            optional: false
          },
          opId: {
            type: 'string',
            description: 'Optional idempotency key',
            optional: true
          }
        }
      },
      agentCopyFile: {
        name: 'agentCopyFile',
        description: 'Copy a file or directory (non-destructive)',
        parameters: {
          source: {
            type: 'string',
            description: 'Source path',
            optional: false
          },
          destination: {
            type: 'string',
            description: 'Destination path',
            optional: false
          },
          opId: {
            type: 'string',
            description: 'Optional idempotency key',
            optional: true
          }
        }
      },
      agentListDir: {
        name: 'agentListDir',
        description: 'List directory contents',
        parameters: {
          path: {
            type: 'string',
            description: 'Absolute directory path',
            optional: false
          }
        }
      },
      runCommand: {
        name: 'runCommand',
        description: 'Execute a terminal command',
        parameters: {
          command: {
            type: 'string',
            description: 'Shell command to execute',
            optional: false
          },
          cwd: {
            type: 'string',
            description: 'Working directory (optional)',
            optional: true
          },
          opId: {
            type: 'string',
            description: 'Optional idempotency key',
            optional: true
          }
        }
      },

      // Canvases Library Tools (user-saved mini-apps)
      deleteCanvas: {
        name: 'deleteCanvas',
        description: 'Delete a saved canvas from the Canvases library',
        parameters: {
          filename: {
            type: 'string',
            description: 'Canvas filename to delete',
            optional: false
          }
        }
      },
      renameCanvas: {
        name: 'renameCanvas',
        description: 'Rename a saved canvas in the Canvases library',
        parameters: {
          filename: {
            type: 'string',
            description: 'Canvas filename to rename',
            optional: false
          },
          newTitle: {
            type: 'string',
            description: 'New display title for the canvas',
            optional: false
          }
        }
      },
      setCanvasFormFactor: {
        name: 'setCanvasFormFactor',
        description: 'Set how a saved canvas is rendered: float (draggable window), tile (Panel Tile), hybrid (both), or widget (stub)',
        parameters: {
          filename: {
            type: 'string',
            description: 'Canvas filename',
            optional: false
          },
          formFactor: {
            type: 'string',
            description: 'One of: float, tile, hybrid, widget',
            optional: false
          }
        }
      }
    };
  }

  /**
   * Get all tool definitions as an array
   */
  getToolDefinitions() {
    return Object.values(this.tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Execute a tool by name with given parameters
   */
  async execute(toolName, params) {
    console.log(`🔧 Executing tool: ${toolName}`, params);

    // Check if tool exists
    if (!this.tools[toolName]) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Validate required parameters
    const tool = this.tools[toolName];
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      if (!paramDef.optional && !(paramName in params)) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
    }

    // Execute the tool
    try {
      const result = await this.executeToolInternal(toolName, params);
      console.log(`✅ Tool ${toolName} executed successfully:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${toolName} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Internal tool execution - routes to the real in-renderer handler
   * registry (src/lib/tools.js) first. Falls back to the legacy IPC stub
   * only if the registry is unavailable (e.g. during very early boot or
   * unit tests).
   *
   * This bypasses electron/main.js's `execute-tool` IPC handler entirely
   * for normal operation, which means tool calls that originate from the
   * chat land on the exact same handlers the LangGraph tool-bridge uses
   * — no HTTP server, no main-process round-trip, no universal fake
   * success response.
   */
  async executeToolInternal(toolName, params) {
    // Primary path: direct call into the tools.js registry (reuses the
    // real Firestore-backed handlers + the layoutHook-backed panel ops).
    //
    // Note the deliberate split between "registry lookup" and "handler
    // execution" below. Only the lookup is guarded by try/catch — once
    // we have a handler in hand, any error it throws must propagate to
    // useChat's executeToolCall so the tool card renders as 'failed'
    // with the real error message. Swallowing the error and falling
    // through to the IPC stub would mask real failures behind a
    // fake-success response, which is the bug this whole remediation
    // exists to fix.
    let tool = null;
    try {
      const registry = getToolRegistry();
      tool = registry?.[toolName] || null;
    } catch (err) {
      console.warn(
        `[briiz-tools] Registry lookup failed for "${toolName}":`,
        err?.message,
      );
    }

    if (tool && typeof tool.handler === 'function') {
      const { appContext, layoutHook } = getBriizToolsRuntime();

      // ---- Pre-hoc margerin gate ---------------------------------
      // If the registry entry is marked requiresConfirmation, push a
      // margerin onto the bfast queue and await the user's decision
      // before touching the handler. The margerin resolves ✓/✕/💬
      // into one of three Promise outcomes:
      //   ✓  → we run the handler, post a success toast, return result
      //   ✕  → we re-throw a clean "cancelled" error (failed card)
      //   💬 → we re-throw an error with .__returnedToChat = true; the
      //        useChat catch is expected to suppress the failed card
      //        and the InteractionPanel chat-return subscription
      //        refocuses the textarea with a "re:" prepend.
      //
      // Read-only / non-gated tools skip this entirely and execute
      // immediately, preserving the fast path for reads.
      if (tool.requiresConfirmation) {
        const label = formatMargerinLabel(toolName, params);
        let decision;
        try {
          decision = await enqueueMargerin({ toolName, params, label });
        } catch (err) {
          // Cancel or chat-return: both take this branch. The chat-
          // return error already carries __returnedToChat for useChat
          // and the chat subscription in InteractionPanel.
          throw err;
        }
        if (!decision?.__approved) {
          // Shouldn't happen — enqueueMargerin rejects on cancel — but
          // be defensive.
          throw new Error('Margerin did not resolve approved');
        }
      }

      // __agentAuto mirrors the useToolBridge pattern so the real
      // handlers skip the user-confirmation gate that ToolContext
      // normally enforces. Chat-originated calls have already been
      // vetted by the margerin above (or were read-only), so no
      // second prompt is needed.
      const result = await tool.handler(
        { ...params, __agentAuto: true },
        appContext,
        layoutHook,
      );

      // Post-hoc toast: only fire for gated (write) tools, so reads
      // stay quiet. The toast is best-effort — a toast failure must
      // never affect the caller's result.
      if (tool.requiresConfirmation) {
        try {
          toast(formatToastMessage(toolName, params), { tone: 'success' });
        } catch (err) {
          console.warn('[briiz-tools] success toast failed', err);
        }
      }

      return result;
    }

    // Tool name not found in the real registry — surface the drift
    // before falling back.
    console.warn(`[briiz-tools] Tool "${toolName}" not found in tools.js registry`);

    // Last-resort fallback: legacy IPC handler in electron/main.js.
    // Deprecated for chat-originated calls; only reached if the tools.js
    // registry is somehow unavailable (very early boot, bundler issue,
    // unit tests). main.js now returns a structured failure here rather
    // than a fake success so the regression is visible to the caller.
    if (typeof window !== 'undefined' && window.api?.executeTool) {
      return await window.api.executeTool(toolName, params);
    }

    // Development/testing fallback.
    return this.executeMockTool(toolName, params);
  }

  /**
   * Mock tool execution for development/testing
   */
  executeMockTool(toolName, params) {
    // Return mock results for development
    const mockResults = {
      getScheduleSummary: { events: [], summary: 'No events found for the specified time range.' },
      searchNotes: { notes: [], summary: 'No notes matching the query were found.' },
      lookupOnline: { results: [], summary: `Search for "${params.query}" would be performed here.` },
      findScheduleConflicts: { conflicts: [], summary: 'No scheduling conflicts found.' },
      openPanel: { success: true, message: `Panel "${params.panel_title}" would be opened.` },
      createNotePanel: { success: true, panelId: `note-${Date.now()}`, message: `Note panel "${params.title}" created.` },
      updateNoteContent: { success: true, message: `Panel "${params.panel_id}" content updated.` },
      setPanelColor: { success: true, message: `Panel "${params.panel_id}" color updated to HSL(${params.hue}, ${params.saturation}%, ${params.lightness}%).` },
      movePanel: { success: true, message: `Panel "${params.panel_id}" moved to (${params.x}, ${params.y}).` },
      resizePanel: { success: true, message: `Panel "${params.panel_id}" resized to ${params.width}x${params.height}.` },
      duplicatePanel: { success: true, newPanelId: `dup-${Date.now()}`, message: `Panel "${params.panel_id}" duplicated.` },
      deletePanel: { success: true, message: `Panel "${params.panel_id}" deleted.` },
      minimizePanel: { success: true, message: `Panel "${params.panel_id}" minimized.` },
      restorePanel: { success: true, message: `Panel "${params.panel_id}" restored.` },
      setPanelTitle: { success: true, message: `Panel renamed to "${params.new_title}".` },
      tilePanels: { success: true, message: 'All panels arranged in a grid layout.' },
      groupPanelsByType: { success: true, message: 'Panels grouped by type.' },
      stackPanelsVertically: { success: true, message: 'Panels stacked vertically.' },
      focusMode: { success: true, message: `Focus mode activated for panel "${params.panel_id}".` },
      minimizeAllPanels: { success: true, message: 'All panels minimized.' },
      closeAllPanels: { success: true, message: 'All panels closed.' },
      completeTask: { success: true, message: `Task "${params.task_id}" marked as complete.` },
      createThoughtStream: { success: true, thoughtId: `thought-${Date.now()}`, message: 'Thought stream created.' },
      createPrioritizedTaskList: { success: true, tasks: [], message: 'Prioritized task list created.' },
      createSingleCalendarEvent: { success: true, eventId: `event-${Date.now()}`, message: `Event "${params.title}" created for ${params.date}.` },
      updateCalendarEvent: { success: true, message: `Event "${params.event_title}" moved to ${params.new_date}.` },
      createRecurringCalendarEvent: { success: true, eventId: `recurring-${Date.now()}`, message: `Recurring event "${params.title}" created.` },
      startTimer: { success: true, timerId: `timer-${Date.now()}`, message: `Timer "${params.title || 'Timer'}" started for ${params.duration_minutes} minutes.` }
    };

    return mockResults[toolName] || { success: true, message: `Tool ${toolName} executed.` };
  }
}

// Export for use in briizOS
export default BriizTools;

// Also expose to window for legacy compatibility
if (typeof window !== 'undefined') {
  window.BriizTools = BriizTools;
  window.briizTools = new BriizTools();
}
