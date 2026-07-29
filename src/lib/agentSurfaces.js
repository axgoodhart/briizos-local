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

function normalizedPolicy(policy) {
  return {
    surface: policy?.surface || 'unknown',
    mode: LEVELS.includes(policy?.mode) ? policy.mode : 'ask-always',
    blacklist: {
      paths: [...(Array.isArray(policy?.blacklist?.paths) ? policy.blacklist.paths : [])].sort(),
      filetypes: [...(Array.isArray(policy?.blacklist?.filetypes) ? policy.blacklist.filetypes : [])].sort(),
    },
  };
}

export function permissionPoliciesEqual(left, right) {
  return JSON.stringify(normalizedPolicy(left)) === JSON.stringify(normalizedPolicy(right));
}

// threadId -> { surface, mode, blacklist }
const _registry = new Map();
const _unknownWarningThreads = new Set();

/**
 * Register (or replace) the policy governing an agent thread.
 * `policy` = { surface: 'chat'|'task', mode, blacklist }.
 */
export function registerThreadSurface(threadId, policy, options = {}) {
  if (!threadId) return { changed: false, policy: restrictivePolicy() };
  const safe = normalizedPolicy(policy);
  const previous = _registry.get(threadId) || null;
  const changed = !previous || !permissionPoliciesEqual(previous, safe);
  if (!changed) return { changed: false, policy: previous, previous };
  _registry.set(threadId, safe);
  _unknownWarningThreads.delete(threadId);
  if (options.logChange !== false) {
    logger.info(
      'permissions.surface',
      previous
        ? 'Permission rules changed for this conversation; no tool was run by this update.'
        : 'Permission rules were loaded for this conversation; no tool was run by this setup step.',
      {
        threadId,
        surface: safe.surface,
        previousMode: previous?.mode || null,
        effectiveMode: safe.mode,
        effect: 'Future tool requests in this conversation will use these rules.',
      },
      { activityId: options.activityId || null },
    );
  }
  return { changed: true, policy: safe, previous };
}

export function unregisterThread(threadId) {
  if (threadId) {
    _registry.delete(threadId);
    _gated.delete(threadId);
    _unknownWarningThreads.delete(threadId);
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
  const warningKey = threadId || 'missing-thread';
  if (!_unknownWarningThreads.has(warningKey)) {
    _unknownWarningThreads.add(warningKey);
    logger.warn(
      'permissions.surface',
      'This conversation has no registered permission rules, so every tool request will require confirmation',
      {
        threadId,
        mode: 'ask-always',
        effect: 'Nothing is approved automatically. This unchanged fallback will not be logged again for the same conversation.',
      },
    );
  }
  return restrictivePolicy('unknown');
}

/**
 * Fetch a surface's configured policy from the main process and register
 * it for `threadId`. For 'task', `requestedMode` (the per-task level)
 * is clamped so it can never exceed the Task column ceiling.
 *
 * Returns the effective policy that was registered.
 */
export async function registerSurfaceForThread(threadId, surface, requestedMode = null, options = {}) {
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
    }, { activityId: options.activityId || null, outcome: 'failed' });
  }
  registerThreadSurface(threadId, policy, options);
  return policy;
}

export default {
  LEVELS,
  levelRank,
  clampLevel,
  restrictivePolicy,
  permissionPoliciesEqual,
  registerThreadSurface,
  unregisterThread,
  resolvePolicyForThread,
  registerSurfaceForThread,
  recordGatedToolCall,
  consumeGatedToolCalls,
};
