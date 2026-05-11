/**
 * bfast-format — prose helpers for the BfastBundle.
 *
 * Margerins show a pre-hoc intent label ("Add event 'Lunch' on Apr 10?").
 * Toasts show a post-hoc receipt ("Added 'Lunch' on Apr 10."). This file
 * owns the switch statements that map (toolName, params) → human text
 * for both forms so the UI components stay dumb and the executor in
 * briizos-tools.js has a single place to call for either framing.
 *
 * Guiding principle: action-oriented, present-tense or imperative for
 * margerins ("Add X?", "Move X to Y?"), past-tense or plain-verb for
 * toasts ("Added X.", "Moved X to Y."). Keep labels short — under ~60
 * chars — since they live inside a pill.
 *
 * When a tool name isn't covered, we fall back to a readable default
 * generated from the tool name's camelCase words and the first few
 * params so new tools show something reasonable without needing a
 * bespoke case first.
 */

// ---------- utilities ----------

function camelToWords(s) {
  return String(s)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function quote(v) {
  if (v == null) return '';
  const s = String(v).trim();
  if (!s) return '';
  return `'${s.length > 32 ? s.slice(0, 29) + '…' : s}'`;
}

function shortDate(d) {
  if (!d) return '';
  // Accept 'YYYY-MM-DD' or a Date-like string.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (!m) return String(d);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mi = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  if (mi < 0 || mi > 11) return String(d);
  return `${months[mi]} ${day}`;
}

function shortTime(t) {
  if (!t) return '';
  return String(t).trim();
}

// ---------- margerin labels (pre-hoc, question form) ----------

const MARGERIN_FORMATTERS = {
  // Calendar
  createSingleCalendarEvent: (p) => {
    const when = [shortDate(p.date), shortTime(p.time)].filter(Boolean).join(' ');
    return `Add event ${quote(p.title)}${when ? ' on ' + when : ''}?`;
  },
  createRecurringCalendarEvent: (p) => {
    const cadence = p.recurrence_type ? ` (${p.recurrence_type})` : '';
    return `Add recurring event ${quote(p.title)}${cadence}?`;
  },
  updateCalendarEvent: (p) => {
    const to = p.new_date ? ' to ' + shortDate(p.new_date) : '';
    return `Move ${quote(p.event_title)}${to}?`;
  },

  // Tasks
  completeTask: (p) => `Complete task ${quote(p.task_id)}?`,
  createThoughtStream: (p) => `Jot ${quote(p.text)}?`,
  createPrioritizedTaskList: (p) => `Build task list for ${quote(p.criteria)}?`,

  // Notes
  createNotePanel: (p) => `Create note ${quote(p.title)}?`,
  updateNoteContent: (p) => {
    const mode = p.mode === 'replace' ? 'Replace' : 'Append to';
    return `${mode} note ${quote(p.panel_id)}?`;
  },

  // Panels
  openPanel: (p) => `Open ${quote(p.panel_title)}?`,
  setPanelColor: (p) => `Recolor ${quote(p.panel_id)}?`,
  movePanel: (p) => `Move ${quote(p.panel_id)}?`,
  resizePanel: (p) => `Resize ${quote(p.panel_id)}?`,
  duplicatePanel: (p) => `Duplicate ${quote(p.panel_id)}?`,
  deletePanel: (p) => `Delete ${quote(p.panel_id)}?`,
  minimizePanel: (p) => `Minimize ${quote(p.panel_id)}?`,
  restorePanel: (p) => `Restore ${quote(p.panel_id)}?`,
  setPanelTitle: (p) => `Rename to ${quote(p.new_title)}?`,

  // Workspace
  tilePanels: () => 'Tile all panels?',
  groupPanelsByType: () => 'Group panels by type?',
  stackPanelsVertically: () => 'Stack panels vertically?',
  focusMode: (p) => `Focus on ${quote(p.panel_id)}?`,
  minimizeAllPanels: () => 'Minimize all panels?',
  closeAllPanels: () => 'Close all panels?',

  // Misc
  startTimer: (p) => {
    const t = quote(p.title) || 'timer';
    return `Start ${t} for ${p.duration_minutes ?? '?'} min?`;
  },
};

// ---------- toast messages (post-hoc, past-tense) ----------

const TOAST_FORMATTERS = {
  createSingleCalendarEvent: (p) => {
    const when = [shortDate(p.date), shortTime(p.time)].filter(Boolean).join(' ');
    return `Added ${quote(p.title)}${when ? ' on ' + when : ''}.`;
  },
  createRecurringCalendarEvent: (p) => `Added recurring ${quote(p.title)}.`,
  updateCalendarEvent: (p) => {
    const to = p.new_date ? ' to ' + shortDate(p.new_date) : '';
    return `Moved ${quote(p.event_title)}${to}.`;
  },
  completeTask: (p) => `Completed ${quote(p.task_id)}.`,
  createThoughtStream: (p) => `Jotted ${quote(p.text)}.`,
  createPrioritizedTaskList: (p) => `Built list for ${quote(p.criteria)}.`,
  createNotePanel: (p) => `Note ${quote(p.title)} created.`,
  updateNoteContent: (p) => `Note ${quote(p.panel_id)} updated.`,
  openPanel: (p) => `Opened ${quote(p.panel_title)}.`,
  setPanelColor: (p) => `Recolored ${quote(p.panel_id)}.`,
  movePanel: (p) => `Moved ${quote(p.panel_id)}.`,
  resizePanel: (p) => `Resized ${quote(p.panel_id)}.`,
  duplicatePanel: (p) => `Duplicated ${quote(p.panel_id)}.`,
  deletePanel: (p) => `Deleted ${quote(p.panel_id)}.`,
  minimizePanel: (p) => `Minimized ${quote(p.panel_id)}.`,
  restorePanel: (p) => `Restored ${quote(p.panel_id)}.`,
  setPanelTitle: (p) => `Renamed to ${quote(p.new_title)}.`,
  tilePanels: () => 'Panels tiled.',
  groupPanelsByType: () => 'Panels grouped.',
  stackPanelsVertically: () => 'Panels stacked.',
  focusMode: (p) => `Focused on ${quote(p.panel_id)}.`,
  minimizeAllPanels: () => 'All panels minimized.',
  closeAllPanels: () => 'All panels closed.',
  startTimer: (p) => {
    const t = quote(p.title) || 'Timer';
    return `${t} started for ${p.duration_minutes ?? '?'} min.`;
  },
};

// ---------- public API ----------

/**
 * Format a pre-hoc margerin label from a tool name + params.
 * Falls back to "Run Tool Name?" if no bespoke formatter is registered.
 */
export function formatMargerinLabel(toolName, params = {}) {
  const fn = MARGERIN_FORMATTERS[toolName];
  if (fn) {
    try {
      return fn(params);
    } catch {
      /* fall through to default */
    }
  }
  return `${camelToWords(toolName)}?`;
}

/**
 * Format a post-hoc success toast message from a tool name + params.
 * Falls back to "Tool name ran." if no bespoke formatter is registered.
 */
export function formatToastMessage(toolName, params = {}) {
  const fn = TOAST_FORMATTERS[toolName];
  if (fn) {
    try {
      return fn(params);
    } catch {
      /* fall through to default */
    }
  }
  return `${camelToWords(toolName)} ran.`;
}
