import {
  getNotes, upsertNote, deleteNote,
  addTask, updateTask,
  getScheduleItems, addScheduleItem, updateScheduleItem,
} from './firestore';
import logger from './logger';

// Tool definitions - each has handler, requiresConfirmation, description, parameters
// Layout-incompatible tools return explanatory messages

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function resolvePanel(layoutHook, panelQuery) {
  if (!layoutHook || !panelQuery) return null;
  const normalized = panelQuery.toLowerCase();

  if (typeof layoutHook.getPanel === 'function') {
    const byId = layoutHook.getPanel(panelQuery);
    if (byId) return byId;
  }

  if (typeof layoutHook.getPanelByType === 'function') {
    const byType = layoutHook.getPanelByType(normalized);
    if (byType) return byType;
  }

  if (Array.isArray(layoutHook.panels)) {
    const byId = layoutHook.panels.find(p => p.id === panelQuery);
    if (byId) return byId;
    const byType = layoutHook.panels.find(p => (p.type || '').toLowerCase() === normalized);
    if (byType) return byType;
  }

  return null;
}

const tools = {
  // === READ-ONLY TOOLS (no confirmation) ===

  getScheduleSummary: {
    requiresConfirmation: false,
    description: 'Get a summary of scheduled events',
    parameters: { time_range: { type: 'string', description: 'Time range: "today", "tomorrow", "this week", "next week", "all"' } },
    handler: async (params, context) => {
      const { time_range = 'all' } = params;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Build date range
      let dates = [todayStr];
      if (time_range === 'tomorrow') {
        const tmrw = new Date(today);
        tmrw.setDate(tmrw.getDate() + 1);
        dates = [tmrw.toISOString().split('T')[0]];
      } else if (time_range === 'this week') {
        dates = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
      } else if (time_range === 'next week') {
        dates = [];
        for (let i = 7; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
      }

      // Use context events if available, otherwise query dates
      const events = context?.events || [];
      const filtered = time_range === 'all' ? events : events.filter(e => dates.includes(e.date));

      if (filtered.length === 0) {
        return { summary: `No events scheduled for ${time_range}.`, events: [], count: 0 };
      }

      const summary = filtered.map(e => `- ${e.date}: ${e.title}`).join('\n');
      return { summary: `Events for ${time_range}:\n${summary}`, events: filtered, count: filtered.length };
    },
  },

  searchNotes: {
    requiresConfirmation: false,
    description: 'Search through note panels',
    parameters: {
      query: { type: 'string', description: 'Search term' },
      topic_filter: { type: 'string', description: 'Filter by note title', optional: true },
    },
    handler: async (params, context) => {
      const { query, topic_filter } = params;
      const notes = context?.notes || await getNotes();

      const matching = notes.filter(note => {
        const content = (note.content || '').toLowerCase();
        const title = (note.title || '').toLowerCase();
        const q = query.toLowerCase();
        const topicMatch = !topic_filter || title.includes(topic_filter.toLowerCase());
        return topicMatch && (content.includes(q) || title.includes(q));
      }).map(note => {
        const idx = (note.content || '').toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, idx - 50);
        const end = Math.min((note.content || '').length, idx + query.length + 50);
        return { title: note.title, snippet: '...' + (note.content || '').substring(start, end) + '...', id: note.id };
      });

      if (matching.length === 0) return { results: [], summary: `No notes found matching "${query}".`, count: 0 };
      const summary = matching.map(n => `"${n.title}": ${n.snippet}`).join('\n\n');
      return { results: matching, summary: `Found ${matching.length} note(s) matching "${query}":\n\n${summary}`, count: matching.length };
    },
  },

  findScheduleConflicts: {
    requiresConfirmation: false,
    description: 'Find overlapping events in schedule',
    parameters: { time_range: { type: 'string', description: 'Time range to check', optional: true } },
    handler: async (params, context) => {
      const events = context?.events || [];
      const conflicts = [];
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          if (events[i].date === events[j].date) {
            conflicts.push({ event1: events[i].title, event2: events[j].title, date: events[i].date });
          }
        }
      }
      if (conflicts.length === 0) return { conflicts: [], summary: 'No scheduling conflicts found.', count: 0 };
      const summary = conflicts.map(c => `${c.date}: "${c.event1}" conflicts with "${c.event2}"`).join('\n');
      return { conflicts, summary: `Found ${conflicts.length} conflict(s):\n${summary}`, count: conflicts.length };
    },
  },

  lookupOnline: {
    requiresConfirmation: false,
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      source: { type: 'string', description: 'Specific source', optional: true },
    },
    handler: async (params) => {
      return { success: true, query: params.query, summary: `Web search for "${params.query}" is not yet configured. Connect a search API to enable this feature.` };
    },
  },

  // === AGENT FILESYSTEM TOOLS ===

  agentReadFile: {
    requiresConfirmation: false,
    description: 'Read a file from the filesystem',
    parameters: {
      path: { type: 'string', description: 'Absolute path to the file' },
    },
    handler: async (params) => {
      logger.debug('tools', 'agentReadFile reading', params.path);
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      logger.debug('tools', 'agentReadFile blacklist config', JSON.stringify(config?.filesystem?.blacklist));
      if (isPathBlacklisted(params.path, config?.filesystem?.blacklist)) {
        logger.debug('tools', 'agentReadFile BLOCKED by blacklist', params.path);
        return { error: `Blocked: "${params.path}" is blacklisted` };
      }
      const result = await window.api.agentReadFile(params.path);
      logger.debug('tools', 'agentReadFile IPC result', result.error || `success, ${result.totalSize} bytes`);
      if (result.error) return { success: false, message: result.error };
      return {
        success: true,
        message: result.truncated
          ? `Read ${params.path} (truncated, ${result.totalSize} bytes total)`
          : `Read ${params.path} (${result.totalSize} bytes)`,
        content: result.content,
      };
    },
  },

  agentReadFileBase64: {
    requiresConfirmation: false,
    description: 'Read a binary file from the filesystem as base64',
    parameters: {
      path: { type: 'string', description: 'Absolute path to the file' },
      maxSize: { type: 'number', description: 'Maximum bytes to read', optional: true },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.path, config?.filesystem?.blacklist)) {
        return { error: `Blocked: "${params.path}" is blacklisted` };
      }
      const result = await window.api.agentReadFileBase64(params.path, params.maxSize);
      if (result.error) return { success: false, message: result.error };
      return {
        success: true,
        message: `Read binary: ${result.path} (${result.totalSize} bytes)`,
        base64: result.base64,
        totalSize: result.totalSize,
        path: result.path,
      };
    },
  },

  agentWriteFile: {
    requiresConfirmation: true,
    description: 'Write content to a file (creates or overwrites)',
    parameters: {
      path: { type: 'string', description: 'Absolute path to write to' },
      content: { type: 'string', description: 'File content' },
      opId: { type: 'string', description: 'Idempotency key for this write operation', optional: true },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.path, config?.filesystem?.blacklist)) {
        return { error: `Blocked: "${params.path}" is blacklisted` };
      }
      const result = await window.api.agentWriteFile(params.path, params.content, params.opId);
      if (result.error) return { success: false, message: result.error };
      return { success: true, message: `Written: ${result.path} (${result.size} bytes)` };
    },
  },

  agentDeleteFile: {
    requiresConfirmation: true,
    description: 'Delete a file or directory',
    parameters: {
      path: { type: 'string', description: 'Absolute path to delete' },
      opId: { type: 'string', description: 'Idempotency key for this delete operation', optional: true },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.path, config?.filesystem?.blacklist)) {
        return { error: `Blocked: "${params.path}" is blacklisted` };
      }
      const result = await window.api.agentDeleteFile(params.path, params.opId);
      if (result.error) return { success: false, message: result.error };
      return { success: true, message: `Deleted: ${result.path}` };
    },
  },

  agentMoveFile: {
    requiresConfirmation: true,
    description: 'Move or rename a file (destructive)',
    parameters: {
      source: { type: 'string', description: 'Source path' },
      destination: { type: 'string', description: 'Destination path' },
      opId: { type: 'string', description: 'Idempotency key for this move operation', optional: true },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.source, config?.filesystem?.blacklist) ||
          isPathBlacklisted(params.destination, config?.filesystem?.blacklist)) {
        return { error: 'Blocked: source or destination is blacklisted' };
      }
      const result = await window.api.agentMoveFile(params.source, params.destination, params.opId);
      if (result.error) return { success: false, message: result.error };
      return { success: true, message: `Moved: ${result.from} -> ${result.to}` };
    },
  },

  agentCopyFile: {
    requiresConfirmation: true,
    description: 'Copy a file or directory (may create or overwrite files)',
    parameters: {
      source: { type: 'string', description: 'Source path' },
      destination: { type: 'string', description: 'Destination path' },
      opId: { type: 'string', description: 'Idempotency key for this copy operation', optional: true },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.source, config?.filesystem?.blacklist) ||
          isPathBlacklisted(params.destination, config?.filesystem?.blacklist)) {
        return { error: 'Blocked: source or destination is blacklisted' };
      }
      const result = await window.api.agentCopyFile(params.source, params.destination, params.opId);
      if (result.error) return { success: false, message: result.error };
      return { success: true, message: `Copied: ${result.from} -> ${result.to} (${result.size} bytes)` };
    },
  },

  agentListDir: {
    requiresConfirmation: false,
    description: 'List directory contents',
    parameters: {
      path: { type: 'string', description: 'Absolute directory path' },
    },
    handler: async (params) => {
      const { isPathBlacklisted } = await import('./permissions.js');
      const config = await window.api.agentGetConfig();
      if (isPathBlacklisted(params.path, config?.filesystem?.blacklist)) {
        return { error: `Blocked: "${params.path}" is blacklisted` };
      }
      const result = await window.api.agentListDir(params.path);
      if (result.error) return { success: false, message: result.error };
      const listing = result.entries.map(e =>
        `${e.isDirectory ? '[DIR]' : '[FILE]'} ${e.name}`
      ).join('\n');
      return {
        success: true,
        message: `${result.path} (${result.count} items):\n${listing}`,
        entries: result.entries,
      };
    },
  },

  // === AGENT TERMINAL TOOL ===

  runCommand: {
    requiresConfirmation: true,
    description: 'Execute a terminal command',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute' },
      cwd: { type: 'string', description: 'Working directory (optional)', optional: true },
      opId: { type: 'string', description: 'Idempotency key for this command execution', optional: true },
    },
    handler: async (params) => {
      const result = await window.api.agentRunCommand(params.command, params.cwd, params.opId);
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        success: result.success,
        message: result.success
          ? `$ ${params.command}\n${output || '(no output)'}`
          : `$ ${params.command}\nExit code: ${result.exitCode}\n${output}`,
        exitCode: result.exitCode,
      };
    },
  },

  // === CANVAS TOOLS ===

  openCanvas: {
    requiresConfirmation: false,
    description: 'Open the Live Canvas with HTML/CSS/JS content',
    parameters: {
      title: { type: 'string', description: 'Canvas title' },
      html: { type: 'string', description: 'HTML content' },
      css: { type: 'string', description: 'CSS styles', optional: true },
      js: { type: 'string', description: 'JavaScript code', optional: true },
    },
    handler: async (params) => {
      logger.debug('canvas', 'openCanvas', `title: ${params.title} | html: ${params.html?.substring(0, 200)} | css: ${params.css?.substring(0, 100)}`);
      window.dispatchEvent(new CustomEvent('briizos-canvas', {
        detail: { action: 'open', title: params.title, data: { html: params.html, css: params.css || '', js: params.js || '' } }
      }));
      const fullHtml = `<!DOCTYPE html><html><head><style>${params.css || ''}</style></head><body>${params.html}<script>${params.js || ''}<\/script></body></html>`;
      await window.api.canvasSave(params.title, fullHtml);
      return { success: true, message: `Canvas "${params.title}" opened.` };
    },
  },

  updateCanvas: {
    requiresConfirmation: false,
    description: 'Update the current Live Canvas content',
    parameters: {
      html: { type: 'string', description: 'Updated HTML', optional: true },
      css: { type: 'string', description: 'Updated CSS', optional: true },
      js: { type: 'string', description: 'Updated JS', optional: true },
    },
    handler: async (params) => {
      window.dispatchEvent(new CustomEvent('briizos-canvas', {
        detail: { action: 'update', data: { html: params.html, css: params.css, js: params.js } }
      }));
      return { success: true, message: 'Canvas updated.' };
    },
  },

  listCanvases: {
    requiresConfirmation: false,
    description: 'List saved canvases',
    parameters: {},
    handler: async () => {
      const canvases = await window.api.canvasList();
      if (canvases.length === 0) return { success: true, message: 'No saved canvases.' };
      const list = canvases.map(c => `- ${c.title} (${c.filename})`).join('\n');
      return { success: true, message: `Saved canvases:\n${list}`, canvases };
    },
  },

  loadCanvas: {
    requiresConfirmation: false,
    description: 'Load a previously saved canvas',
    parameters: {
      filename: { type: 'string', description: 'Canvas filename' },
    },
    handler: async (params) => {
      const html = await window.api.canvasLoad(params.filename);
      if (!html) return { success: false, message: 'Canvas not found.' };
      window.dispatchEvent(new CustomEvent('briizos-canvas', {
        detail: { action: 'open', title: params.filename.replace('.html', ''), data: { html, css: '', js: '' } }
      }));
      return { success: true, message: `Loaded canvas "${params.filename}".` };
    },
  },

  deleteCanvas: {
    requiresConfirmation: true,
    description: 'Delete a saved canvas from the Canvases library',
    parameters: {
      filename: { type: 'string', description: 'Canvas filename to delete' },
    },
    handler: async (params) => {
      if (!window.api?.canvasDelete) {
        return { success: false, message: 'Canvas IPC unavailable.' };
      }
      const res = await window.api.canvasDelete(params.filename);
      if (res?.success) {
        logger.info('canvases', 'Canvas deleted via tool', { filename: params.filename });
        return { success: true, message: `Deleted canvas "${params.filename}".` };
      }
      return { success: false, message: `Failed to delete: ${res?.error || 'unknown error'}` };
    },
  },

  renameCanvas: {
    requiresConfirmation: false,
    description: 'Rename a saved canvas in the Canvases library',
    parameters: {
      filename: { type: 'string', description: 'Canvas filename to rename' },
      newTitle: { type: 'string', description: 'New display title' },
    },
    handler: async (params) => {
      if (!window.api?.canvasRename) {
        return { success: false, message: 'Canvas IPC unavailable.' };
      }
      const res = await window.api.canvasRename(params.filename, params.newTitle);
      if (res?.success) {
        logger.info('canvases', 'Canvas renamed via tool', {
          oldFilename: params.filename,
          newFilename: res.filename,
          newTitle: params.newTitle,
        });
        return {
          success: true,
          message: `Renamed to "${params.newTitle}".`,
          filename: res.filename,
        };
      }
      return { success: false, message: `Failed to rename: ${res?.error || 'unknown error'}` };
    },
  },

  setCanvasFormFactor: {
    requiresConfirmation: false,
    description: 'Set how a saved canvas is rendered: float (draggable window), tile (Panel Tile), hybrid (both), or widget (stub)',
    parameters: {
      filename: { type: 'string', description: 'Canvas filename' },
      formFactor: { type: 'string', description: 'One of: float, tile, hybrid, widget' },
    },
    handler: async (params) => {
      if (!window.api?.canvasSaveMeta || !window.api?.canvasLoadMeta) {
        return { success: false, message: 'Canvas IPC unavailable.' };
      }
      const allowed = ['float', 'tile', 'hybrid', 'widget'];
      if (!allowed.includes(params.formFactor)) {
        return { success: false, message: `formFactor must be one of: ${allowed.join(', ')}` };
      }
      const existing = await window.api.canvasLoadMeta(params.filename);
      const merged = { ...(existing || {}), formFactor: params.formFactor };
      const res = await window.api.canvasSaveMeta(params.filename, merged);
      if (res?.success) {
        logger.info('canvases', 'Canvas form factor set via tool', {
          filename: params.filename,
          formFactor: params.formFactor,
        });
        return { success: true, message: `Canvas form factor set to "${params.formFactor}".` };
      }
      return { success: false, message: `Failed: ${res?.error || 'unknown error'}` };
    },
  },

  // === AGENT LOOP CONTROL SIGNALS ===

  taskComplete: {
    requiresConfirmation: false,
    description: 'Signal that the requested task has been fully and successfully completed. You MUST call this when the goal is achieved — the loop will not stop otherwise.',
    parameters: {
      summary: { type: 'string', description: 'One or two sentences describing what was accomplished' },
    },
    handler: async (params) => {
      return { success: true, completed: true, summary: params.summary };
    },
  },

  taskFailed: {
    requiresConfirmation: false,
    description: 'Signal that the task cannot be completed. Call this when you have exhausted all options or hit a hard blocker. Never silently stop.',
    parameters: {
      reason: { type: 'string', description: 'Why the task failed' },
      lastAction: { type: 'string', description: 'The last thing you tried', optional: true },
    },
    handler: async (params) => {
      return { success: false, failed: true, reason: params.reason };
    },
  },

  updateScratchpad: {
    requiresConfirmation: false,
    description: 'Update your working scratchpad (visible as a live iframe). Call at the start of each step with: current goal, steps completed so far, last result, and what you plan to do next.',
    parameters: {
      html: { type: 'string', description: 'Full HTML for the scratchpad. Include: goal, iteration count, action log, last result, next planned action.' },
    },
    handler: async () => {
      // Canvas dispatch is handled by the agent loop in useChat (it has session context).
      // This handler exists so the AI can call the tool — the loop intercepts it.
      return { success: true, message: 'Scratchpad updated.' };
    },
  },

  // === MEMORY TOOL ===

  updateAgentMemory: {
    requiresConfirmation: false,
    description: 'Update persistent agent memory/context',
    parameters: {
      content: { type: 'string', description: 'Full updated markdown content for agent memory' },
    },
    handler: async (params) => {
      await window.api.memoryWriteAgentContext(params.content);
      return { success: true, message: 'Agent memory updated.' };
    },
  },

  // === TASK/EVENT MANAGEMENT (confirmation required) ===

  completeTask: {
    requiresConfirmation: true,
    description: 'Mark a task as completed',
    parameters: { task_id: { type: 'string', description: 'Task ID or name' } },
    handler: async (params, context) => {
      const tasks = context?.tasks || [];
      const task = tasks.find(t =>
        t.id === params.task_id || (t.title || '').toLowerCase() === params.task_id.toLowerCase()
      );
      if (!task) throw new Error(`Task "${params.task_id}" not found`);
      await updateTask(task.id, { status: 'completed' });
      return { success: true, message: `Completed task "${task.title}"` };
    },
  },

  createThoughtStream: {
    requiresConfirmation: true,
    description: 'Create a new task',
    parameters: {
      text: { type: 'string', description: 'Task text' },
      priority: { type: 'string', description: 'Priority: high/medium/low', optional: true },
      due_date: { type: 'string', description: 'Due date YYYY-MM-DD', optional: true },
    },
    handler: async (params) => {
      const taskId = await addTask(params.text, { priority: params.priority || 'medium', dueDate: params.due_date || null });
      return { success: true, message: `Created task: "${params.text}"`, taskId };
    },
  },

  createPrioritizedTaskList: {
    requiresConfirmation: true,
    description: 'Create a prioritized list of tasks',
    parameters: { criteria: { type: 'string', description: 'Filtering criteria' } },
    handler: async (params, context) => {
      const tasks = (context?.tasks || []).filter(t => t.status !== 'completed');
      const markdown = tasks.length === 0
        ? 'No tasks found.'
        : tasks.map((t, i) => `${i + 1}. **${t.title}** - ${t.priority} priority`).join('\n');
      return { success: true, message: `Prioritized task list:\n${markdown}`, markdown };
    },
  },

  createSingleCalendarEvent: {
    requiresConfirmation: true,
    description: 'Create a one-time calendar event',
    parameters: {
      title: { type: 'string', description: 'Event title' },
      date: { type: 'string', description: 'Date YYYY-MM-DD' },
      time: { type: 'string', description: 'Time e.g. "9:00"', optional: true },
    },
    handler: async (params) => {
      const itemData = {
        title: params.time ? `${params.title} (${params.time})` : params.title,
        date: params.date,
        start_time: params.time || '09:00',
        end_time: params.time ? undefined : '10:00',
      };
      const id = await addScheduleItem(itemData);
      return { success: true, message: `Created event "${itemData.title}" on ${params.date}`, eventId: id };
    },
  },

  updateCalendarEvent: {
    requiresConfirmation: true,
    description: 'Update an existing calendar event',
    parameters: {
      event_title: { type: 'string', description: 'Event title to find' },
      new_date: { type: 'string', description: 'New date' },
      target_date: { type: 'string', description: 'Current date to find event', optional: true },
    },
    handler: async (params, context) => {
      const events = context?.events || [];
      const title = params.event_title.toLowerCase();
      const candidates = events.filter(e => (e.title || '').toLowerCase() === title);
      const event = params.target_date
        ? candidates.find(e => e.date === params.target_date)
        : candidates[0];
      if (!event) throw new Error(`Event "${params.event_title}" not found`);
      await updateScheduleItem(event.id, event.date, { date: params.new_date });
      return { success: true, message: `Updated "${event.title}" to ${params.new_date}` };
    },
  },

  createRecurringCalendarEvent: {
    requiresConfirmation: true,
    description: 'Create a recurring calendar event',
    parameters: {
      title: { type: 'string', description: 'Event title' },
      recurrence_rule: { type: 'string', description: 'Recurrence rule' },
    },
    handler: async (params) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const id = await addScheduleItem({
        title: params.title,
        date: todayStr,
        start_time: '09:00',
        end_time: '10:00',
        recurrence: params.recurrence_rule,
      });
      return { success: true, message: `Created recurring event "${params.title}" (${params.recurrence_rule})`, eventId: id };
    },
  },

  // === NOTE/PANEL MANAGEMENT (confirmation required) ===

  createNotePanel: {
    requiresConfirmation: true,
    description: 'Create a new note panel with content',
    parameters: {
      title: { type: 'string', description: 'Panel title' },
      content: { type: 'string', description: 'Initial content', optional: true },
    },
    handler: async (params) => {
      const id = await upsertNote({ title: params.title, content: params.content || '', color: '#fef08a' });
      return { success: true, message: `Created note panel "${params.title}"`, panelId: id };
    },
  },

  updateNoteContent: {
    requiresConfirmation: true,
    description: 'Update note content',
    parameters: {
      panel_id: { type: 'string', description: 'Panel ID or title' },
      new_content: { type: 'string', description: 'New content' },
    },
    handler: async (params, context) => {
      const notes = context?.notes || await getNotes();
      const note = notes.find(n => n.id === params.panel_id || (n.title || '').toLowerCase() === params.panel_id.toLowerCase());
      if (!note) throw new Error(`Note "${params.panel_id}" not found`);
      await upsertNote({ id: note.id, content: params.new_content });
      return { success: true, message: `Updated content for "${note.title}"` };
    },
  },

  setPanelColor: {
    requiresConfirmation: true,
    description: 'Change panel color',
    parameters: {
      panel_id: { type: 'string', description: 'Panel ID or title' },
      hue: { type: 'number', description: 'Hue 0-360' },
      saturation: { type: 'number', description: 'Saturation 0-100' },
      lightness: { type: 'number', description: 'Lightness 0-100' },
    },
    handler: async (params, context) => {
      const notes = context?.notes || await getNotes();
      const note = notes.find(n => n.id === params.panel_id || (n.title || '').toLowerCase() === params.panel_id.toLowerCase());
      if (!note) throw new Error(`Panel "${params.panel_id}" not found`);
      // Convert HSL to hex
      const h = params.hue / 360, s = params.saturation / 100, l = params.lightness / 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => { const k = (n + h * 12) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
      const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
      const hex = `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
      await upsertNote({ id: note.id, color: hex });
      return { success: true, message: `Set color for "${note.title}"` };
    },
  },

  setPanelTitle: {
    requiresConfirmation: true,
    description: 'Change panel title',
    parameters: {
      panel_id: { type: 'string', description: 'Panel ID or current title' },
      new_title: { type: 'string', description: 'New title' },
    },
    handler: async (params, context) => {
      const notes = context?.notes || await getNotes();
      const note = notes.find(n => n.id === params.panel_id || (n.title || '').toLowerCase() === params.panel_id.toLowerCase());
      if (!note) throw new Error(`Panel "${params.panel_id}" not found`);
      await upsertNote({ id: note.id, title: params.new_title });
      return { success: true, message: `Renamed panel to "${params.new_title}"` };
    },
  },

  deletePanel: {
    requiresConfirmation: true,
    description: 'Delete a panel',
    parameters: { panel_id: { type: 'string', description: 'Panel ID or title' } },
    handler: async (params, context) => {
      const notes = context?.notes || await getNotes();
      const note = notes.find(n => n.id === params.panel_id || (n.title || '').toLowerCase() === params.panel_id.toLowerCase());
      if (!note) throw new Error(`Panel "${params.panel_id}" not found`);
      await deleteNote(note.id);
      return { success: true, message: `Deleted panel "${note.title}"` };
    },
  },

  duplicatePanel: {
    requiresConfirmation: true,
    description: 'Duplicate an existing panel',
    parameters: { panel_id: { type: 'string', description: 'Panel ID or title' } },
    handler: async (params, context) => {
      const notes = context?.notes || await getNotes();
      const note = notes.find(n => n.id === params.panel_id || (n.title || '').toLowerCase() === params.panel_id.toLowerCase());
      if (!note) throw new Error(`Panel "${params.panel_id}" not found`);
      const newId = await upsertNote({ title: `${note.title} (Copy)`, content: note.content, color: note.color });
      return { success: true, message: `Duplicated panel "${note.title}"`, newPanelId: newId };
    },
  },

  // === LAYOUT-INCOMPATIBLE TOOLS (TileLayout doesn't support free positioning) ===

  movePanel: {
    requiresConfirmation: false,
    description: 'Move panel to specific coordinates',
    parameters: { panel_id: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } },
    handler: async () => ({ success: false, message: 'Panel layout is managed automatically in briizOS.2. Panels cannot be freely positioned.' }),
  },

  resizePanel: {
    requiresConfirmation: false,
    description: 'Resize panel',
    parameters: { panel_id: { type: 'string' }, width: { type: 'number' }, height: { type: 'number' } },
    handler: async () => ({ success: false, message: 'Panel layout is managed automatically in briizOS.2. Use the panel resize handles instead.' }),
  },

  openPanel: {
    requiresConfirmation: true,
    description: 'Open/show a panel',
    parameters: { panel_title: { type: 'string', description: 'Panel title' } },
    handler: async (params, context, layoutHook) => {
      const panel = resolvePanel(layoutHook, params.panel_title);
      if (!panel) return { success: false, message: `Panel "${params.panel_title}" not found` };

      if (layoutHook?.updatePanel) {
        layoutHook.updatePanel(panel.id, { visible: true });
        return { success: true, message: `Opened panel "${panel.id}"` };
      }
      if (layoutHook?.togglePanelVisibility && panel.visible === false) {
        layoutHook.togglePanelVisibility(panel.id);
        return { success: true, message: `Opened panel "${panel.id}"` };
      }
      return { success: true, message: `Panel "${panel.id}" is already open` };
    },
  },

  minimizePanel: {
    requiresConfirmation: true,
    description: 'Minimize a panel',
    parameters: { panel_id: { type: 'string', description: 'Panel ID or title' } },
    handler: async (params, context, layoutHook) => {
      const panel = resolvePanel(layoutHook, params.panel_id);
      if (!panel) return { success: false, message: `Panel "${params.panel_id}" not found` };

      if (layoutHook?.updatePanel) {
        layoutHook.updatePanel(panel.id, { visible: false });
        return { success: true, message: `Minimized panel "${panel.id}"` };
      }
      if (layoutHook?.togglePanelVisibility && panel.visible !== false) {
        layoutHook.togglePanelVisibility(panel.id);
        return { success: true, message: `Minimized panel "${panel.id}"` };
      }
      return { success: true, message: `Panel "${panel.id}" is already minimized` };
    },
  },

  restorePanel: {
    requiresConfirmation: true,
    description: 'Restore a minimized panel',
    parameters: { panel_id: { type: 'string', description: 'Panel ID or title' } },
    handler: async (params, context, layoutHook) => {
      const panel = resolvePanel(layoutHook, params.panel_id);
      if (!panel) return { success: false, message: `Panel "${params.panel_id}" not found` };

      if (layoutHook?.updatePanel) {
        layoutHook.updatePanel(panel.id, { visible: true });
        return { success: true, message: `Restored panel "${panel.id}"` };
      }
      if (layoutHook?.togglePanelVisibility && panel.visible === false) {
        layoutHook.togglePanelVisibility(panel.id);
        return { success: true, message: `Restored panel "${panel.id}"` };
      }
      return { success: true, message: `Panel "${panel.id}" is already visible` };
    },
  },

  tilePanels: {
    requiresConfirmation: false,
    description: 'Arrange panels in grid',
    parameters: {},
    handler: async () => ({ success: false, message: 'Panel tiling is managed automatically by the tile layout in briizOS.2.' }),
  },

  groupPanelsByType: {
    requiresConfirmation: false,
    description: 'Group panels by type',
    parameters: {},
    handler: async () => ({ success: false, message: 'Panel grouping is not supported in the tile layout of briizOS.2.' }),
  },

  stackPanelsVertically: {
    requiresConfirmation: false,
    description: 'Stack panels vertically',
    parameters: {
      panel_ids: {
        type: 'array',
        description: 'Optional array of panel IDs to stack',
        optional: true,
        items: { type: 'string' },
      },
    },
    handler: async () => ({ success: false, message: 'Panel stacking is managed automatically by the tile layout in briizOS.2.' }),
  },

  focusMode: {
    requiresConfirmation: true,
    description: 'Minimize all panels except one',
    parameters: { panel_id: { type: 'string', description: 'Panel to keep visible' } },
    handler: async (params) => {
      return { success: true, message: `Focus mode is not directly supported in tile layout. Use the panel visibility toggles instead.` };
    },
  },

  minimizeAllPanels: {
    requiresConfirmation: true,
    description: 'Minimize all panels',
    parameters: {},
    handler: async () => ({ success: true, message: 'Minimize all is not supported in tile layout.' }),
  },

  closeAllPanels: {
    requiresConfirmation: true,
    description: 'Close all panels',
    parameters: { confirm: { type: 'boolean' } },
    handler: async () => ({ success: true, message: 'Close all is not supported in tile layout. Panels are fixed layout components.' }),
  },

  startTimer: {
    requiresConfirmation: true,
    description: 'Start a timer',
    parameters: {
      duration_minutes: { type: 'number', description: 'Duration in minutes' },
      title: { type: 'string', description: 'Timer title', optional: true },
    },
    handler: async (params) => ({ success: false, message: 'Timer feature is not yet available in briizOS.2.' }),
  },
};

export function getToolDefinitions() {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

export function getToolRegistry() {
  return tools;
}

export default tools;
