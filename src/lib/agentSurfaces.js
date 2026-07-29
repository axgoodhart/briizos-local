/**
 * agentSurfaces — renderer-side registry mapping an agent run's
 * `threadId` to the permission policy that governs its tool calls.
 *
 * WHY THIS EXISTS: the Python agent's bridge calls (port 2025) carry
 * only tool params. To enforce per-surface permissions in the renderer
 * hard gate (ToolContext) we must know which surface a given tool call
 * belongs to. The surface owner (useChat for 'chat', useTaskAutomation
 * for 'task') registers its thread's resolved policy here at run start;
 * the gate looks it up by the thread id forwarded through the bridge.
 *
 * FAIL-CLOSED: a tool call whose thread is unknown/unregistered (e.g. an
 * older agent that doesn't forward thread id, or a race) resolves to the
 * MOST RESTRICTIVE policy — ask-always + empty allow. The gate is
 * therefore safe even before the Python thread-id propagation lands; the
 * propagation only restores chat-vs-task granularity, it is not what
 * makes the gate safe.
 *
 * No React imports — usable from any module, like bfast-queue.
 */

import logger from './logger';

// Most restrictive → most permissive. Mirrors electron/agent-config LEVELS.
export const LEVELS = ['ask-always', 'ask-destructive', 'no-asking'];

export function levelRank(mode) {
  const i = LEVELS.indexOf(mode);
  return i === -1 ? 0 : i; // unknown → most restrictive
}

/** Clamp `requested` so it is never MORE permissive than `ceiling`. */
export function clampLevel(requested, ceiling) {
  if (!LEVELS.includes(requested) || !LEVELS.includes(ceiling)) return 'ask-always';
  return levelRank(requested) > levelRank(ceiling) ? ceiling : requested;
}

/** The single source of truth for "deny by default". */
export function restrictivePolicy(surface = 'unknown') {
  return { surface, mode: 'ask-always', blacklist: { paths: [], filetypes: [] } };
}

// threadId -> { surface, mode, blacklist }
const _registry = new Map();

/**
 * Register (or replace) the policy governing an agent thread.
 * `policy` = { surface: 'chat'|'task', mode, blacklist }.
 */
export function registerThreadSurface(threadId, policy) {
  if (!threadId) return;
  const safe = {
    surface: policy?.surface || 'unknown',
    mode: LEVELS.includes(policy?.mode) ? policy.mode : 'ask-always',
    blacklist: {
      paths: Array.isArray(policy?.blacklist?.paths) ? policy.blacklist.paths : [],
      filetypes: Array.isArray(policy?.blacklist?.filetypes) ? policy.blacklist.filetypes : [],
    },
  };
  _registry.set(threadId, safe);
  logger.info('permissions.surface', 'Permission rules applied to this conversation; no tool was run by this step', {
    threadId,
    surface: safe.surface,
    mode: safe.mode,
    effect: 'Future tool requests in this conversation will use these rules.',
  });
}

export function unregisterThread(threadId) {
  if (threadId) {
    _registry.delete(threadId);
    _gated.delete(threadId);
  }
}

// threadId -> array of { tool, reason, at } recorded when the hard gate
// blocks a headless (task-surface) tool call. useTaskAutomation drains
// this after each agent turn to pause the task to 'waiting'.
const _gated = new Map();

export function recordGatedToolCall(threadId, info) {
  if (!threadId) return;
  const list = _gated.get(threadId) || [];
  list.push({ tool: info?.tool || 'unknown', reason: info?.reason || 'blocked by permission policy', at: Date.now() });
  _gated.set(threadId, list);
  logger.warn('permissions.gate', 'A background tool request was blocked before it could take action', {
    threadId,
    tool: info?.tool,
    reason: info?.reason,
    effect: 'No tool was executed.',
  });
}

/** Drain and return any gated-tool events recorded for a thread. */
export function consumeGatedToolCalls(threadId) {
  if (!threadId || !_gated.has(threadId)) return [];
  const list = _gated.get(threadId);
  _gated.delete(threadId);
  return list;
}

/**
 * Resolve the policy for a thread. Unknown thread → fail-closed.
 * Always returns a usable policy object, never null.
 */
export function resolvePolicyForThread(threadId) {
  if (threadId && _registry.has(threadId)) {
    return _registry.get(threadId);
  }
  logger.warn(
    'permissions.surface',
    'This conversation has no registered permission rules, so every tool request will require confirmation',
    {
      threadId,
      mode: 'ask-always',
      effect: 'Nothing is approved automatically.',
    },
  );
  return restrictivePolicy('unknown');
}

/**
 * Fetch a surface's configured policy from the main process and register
 * it for `threadId`. For 'task', `requestedMode` (the per-task level)
 * is clamped so it can never exceed the Task column ceiling.
 *
 * Returns the effective policy that was registered.
 */
export async function registerSurfaceForThread(threadId, surface, requestedMode = null) {
  let policy = restrictivePolicy(surface);
  try {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (api && typeof api.agentGetSurfacePolicy === 'function') {
      const cfg = await api.agentGetSurfacePolicy(surface);
      if (cfg && typeof cfg === 'object') {
        const ceiling = LEVELS.includes(cfg.mode) ? cfg.mode : 'ask-always';
        const effectiveMode = requestedMode == null
          ? ceiling
          : clampLevel(requestedMode, ceiling);
        policy = {
          surface,
          mode: effectiveMode,
          blacklist: {
            paths: Array.isArray(cfg.blacklist?.paths) ? cfg.blacklist.paths : [],
            filetypes: Array.isArray(cfg.blacklist?.filetypes) ? cfg.blacklist.filetypes : [],
          },
        };
      }
    }
  } catch (err) {
    logger.error('permissions.surface', 'Permission settings could not be read, so this conversation will ask before every tool action', {
      surface,
      threadId,
      error: err?.message,
      mode: 'ask-always',
      effect: 'Nothing is approved automatically.',
    });
  }
  registerThreadSurface(threadId, policy);
  return policy;
}

export default {
  LEVELS,
  levelRank,
  clampLevel,
  restrictivePolicy,
  registerThreadSurface,
  unregisterThread,
  resolvePolicyForThread,
  registerSurfaceForThread,
  recordGatedToolCall,
  consumeGatedToolCalls,
};
