/**
 * bfast-queue — the module-level state + pub/sub for the BfastBundle
 * (Toast, Snackbar, Margerin) UI family.
 *
 * This file is the non-React brain of the bundle. React components in
 * src/components/bfast subscribe to it via `subscribe()`, and callers
 * anywhere in the renderer (useChat → BriizTools.executeToolInternal
 * for the chat path, imperative `toast()`/`snackbar()` calls from
 * anywhere) push into it via the API below.
 *
 * Conceptual model: one ordered queue of pending "actions" where each
 * action is one of three kinds:
 *
 *   - 'margerin'  — pre-hoc intent hold. Has a pending Promise that
 *                   stays unresolved until the user taps ✓ / ✕ / 💬.
 *                   Defaults to ✓ (approve). Supports scroll-wheel
 *                   rotation between the three icons while the pointer
 *                   is over the pill.
 *
 *   - 'toast'     — post-hoc fire-and-forget receipt. Auto-dismisses
 *                   after `durationMs` (default 2500).
 *
 *   - 'snackbar'  — post-hoc receipt with one optional action. Auto-
 *                   dismisses after `durationMs` (default 5000) unless
 *                   the user taps the action.
 *
 * Margerins are gating: the caller awaits enqueueMargerin() and blocks
 * on the user's decision. Toasts and snackbars are non-gating: the
 * caller returns immediately and the bundle handles their lifecycle.
 *
 * This file has NO React imports. It can be used from any module and
 * is tree-shakeable.
 */

// ---------- internal state ----------

let _state = {
  /** Queue of actions awaiting presentation / dismissal. */
  actions: [],
};

const _listeners = new Set();

/** Listeners specifically for the 💬-chat-return event. */
const _chatReturnListeners = new Set();

function _nextId() {
  return `bfast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function _notify() {
  for (const fn of _listeners) fn(_state);
}

function _update(producer) {
  _state = producer(_state);
  _notify();
}

// ---------- subscription API (consumed by React) ----------

/**
 * Subscribe to state changes. Returns an unsubscribe function.
 * The listener is called immediately with the current state so that
 * useSyncExternalStore can snapshot correctly.
 */
export function subscribe(listener) {
  _listeners.add(listener);
  listener(_state);
  return () => _listeners.delete(listener);
}

/** Snapshot of the current state. */
export function getState() {
  return _state;
}

/**
 * Subscribe to chat-return events. Fired when the user taps 💬 on a
 * margerin. The listener receives `{ toolName, params, label }`.
 * InteractionPanel uses this to focus the textarea and prepend a
 * "re:" quote.
 */
export function onChatReturn(listener) {
  _chatReturnListeners.add(listener);
  return () => _chatReturnListeners.delete(listener);
}

function _emitChatReturn(payload) {
  for (const fn of _chatReturnListeners) {
    try { fn(payload); } catch (err) { console.warn('[bfast] chat-return listener threw', err); }
  }
}

// ---------- margerin API ----------

/**
 * Enqueue a margerin and return a Promise that resolves/rejects based
 * on the user's decision.
 *
 * Resolution shape:
 *   - ✓  →  resolve({ __approved: true })
 *   - ✕  →  reject(Error('Action cancelled by user'))
 *   - 💬 →  reject(Error with .__returnedToChat = true)
 *
 * Callers in briizos-tools.js interpret these three outcomes:
 *   - __approved: run the real handler
 *   - cancelled: propagate the error so the tool card shows "failed"
 *   - __returnedToChat: propagate a special error so useChat suppresses
 *     the tool-failed card and the InteractionPanel handler takes over
 *     to refocus the input and prepend the "re:" quote.
 */
export function enqueueMargerin({ toolName, params, label }) {
  return new Promise((resolve, reject) => {
    const id = _nextId();
    _update((s) => ({
      ...s,
      actions: [
        ...s.actions,
        {
          id,
          kind: 'margerin',
          toolName,
          params,
          label,
          selectedIcon: 'check',
          createdAt: Date.now(),
          _resolve: resolve,
          _reject: reject,
        },
      ],
    }));
  });
}

/**
 * Rotate the currently-selected icon on a margerin. Called by the
 * Margerin component in response to wheel events. Cycles through
 * ['check', 'x', 'chat'] in the direction indicated.
 */
export function rotateSelectedIcon(id, direction) {
  const order = ['check', 'x', 'chat'];
  _update((s) => ({
    ...s,
    actions: s.actions.map((a) => {
      if (a.id !== id || a.kind !== 'margerin') return a;
      const i = order.indexOf(a.selectedIcon);
      const next = direction > 0
        ? order[(i + 1) % order.length]
        : order[(i - 1 + order.length) % order.length];
      return { ...a, selectedIcon: next };
    }),
  }));
}

/**
 * Explicitly set the selected icon on a margerin. Called when the user
 * directly clicks one of the three icons rather than scrolling.
 */
export function setSelectedIcon(id, icon) {
  if (!['check', 'x', 'chat'].includes(icon)) return;
  _update((s) => ({
    ...s,
    actions: s.actions.map((a) =>
      a.id === id && a.kind === 'margerin' ? { ...a, selectedIcon: icon } : a,
    ),
  }));
}

/**
 * Commit a margerin: run the action corresponding to `icon` (or the
 * currently-selected icon if `icon` is omitted). Removes the action
 * from the queue and resolves/rejects its Promise.
 */
export function commitMargerin(id, icon = null) {
  const action = _state.actions.find((a) => a.id === id && a.kind === 'margerin');
  if (!action) return;
  const chosen = icon || action.selectedIcon || 'check';
  _update((s) => ({
    ...s,
    actions: s.actions.filter((a) => a.id !== id),
  }));

  if (chosen === 'check') {
    action._resolve({ __approved: true });
  } else if (chosen === 'x') {
    action._reject(new Error('Action cancelled by user'));
  } else if (chosen === 'chat') {
    const err = new Error('Returned to chat for refinement');
    err.__returnedToChat = true;
    err.__toolName = action.toolName;
    err.__params = action.params;
    err.__label = action.label;
    action._reject(err);
    _emitChatReturn({
      toolName: action.toolName,
      params: action.params,
      label: action.label,
    });
  }
}

// ---------- toast API ----------

/**
 * Enqueue a toast. Returns the action id so callers can dismiss early
 * if needed.
 *
 * @param {string} message
 * @param {object} opts
 * @param {'info'|'success'|'error'} [opts.tone='info']
 * @param {number} [opts.durationMs=2500]
 */
export function toast(message, opts = {}) {
  const id = _nextId();
  const durationMs = opts.durationMs ?? 2500;
  _update((s) => ({
    ...s,
    actions: [
      ...s.actions,
      {
        id,
        kind: 'toast',
        message,
        tone: opts.tone || 'info',
        createdAt: Date.now(),
        durationMs,
      },
    ],
  }));
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }
  return id;
}

// ---------- snackbar API ----------

/**
 * Enqueue a snackbar with one optional action.
 *
 * @param {string} message
 * @param {object} [action] { label, onPress }
 * @param {object} [opts]
 * @param {number} [opts.durationMs=5000]
 */
export function snackbar(message, action = null, opts = {}) {
  const id = _nextId();
  const durationMs = opts.durationMs ?? 5000;
  _update((s) => ({
    ...s,
    actions: [
      ...s.actions,
      {
        id,
        kind: 'snackbar',
        message,
        action,
        createdAt: Date.now(),
        durationMs,
      },
    ],
  }));
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }
  return id;
}

/**
 * Dismiss any queued action by id. Used by auto-timers for
 * toasts/snackbars and by direct user dismissal.
 */
export function dismiss(id) {
  _update((s) => ({
    ...s,
    actions: s.actions.filter((a) => a.id !== id),
  }));
}

/**
 * Clear the entire queue, rejecting any pending margerins with a
 * "cleared" error. Intended for test teardown or route changes.
 */
export function clearAll() {
  for (const a of _state.actions) {
    if (a.kind === 'margerin') {
      a._reject(new Error('Bfast queue cleared'));
    }
  }
  _update((s) => ({ ...s, actions: [] }));
}

// ---------- selectors ----------

/** Return the current margerin if any (only one is active at a time). */
export function selectCurrentMargerin(state = _state) {
  return state.actions.find((a) => a.kind === 'margerin') || null;
}

/** Return all toasts currently queued. Multiple can coexist. */
export function selectToasts(state = _state) {
  return state.actions.filter((a) => a.kind === 'toast');
}

/** Return all snackbars currently queued. Multiple can coexist. */
export function selectSnackbars(state = _state) {
  return state.actions.filter((a) => a.kind === 'snackbar');
}
