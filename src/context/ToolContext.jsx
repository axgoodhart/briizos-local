import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getToolRegistry, getToolDefinitions } from '../lib/tools';
import { isDestructiveCommand, isPathBlacklisted } from '../lib/permissions';
import { resolvePolicyForThread, recordGatedToolCall } from '../lib/agentSurfaces';
import logger from '../lib/logger';

const ToolContext = createContext(null);

/**
 * Error thrown when the hard permission gate blocks an agent tool call
 * that cannot be interactively confirmed (headless / unknown surface) or
 * that hits the filesystem blacklist. It is unbypassable by the model:
 * the gate runs in the renderer, after the agent, immediately before the
 * tool handler executes.
 */
export class PermissionGateError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = 'PermissionGateError';
    this.__gated = true;
    this.tool = info.tool;
    this.reason = info.reason || message;
    this.surface = info.surface;
  }
}

// Params on agent-originated calls (stamped by useToolBridge).
const AGENT_FLAG = '__agentAuto';
const THREAD_KEY = '__briizosThreadId';
const GRAPH_CONFIRMED_KEY = '__agentGraphConfirmed';

const REVERSIBLE_AGENT_UI_TOOLS = new Set([
  'createNotePanel',
  'updateNoteContent',
  'deletePanel',
  'createThoughtStream',
  'completeTask',
  'createSingleCalendarEvent',
  'updateCalendarEvent',
]);

// Pull every path-like argument a tool might touch, for blacklist checks.
function candidatePaths(params = {}) {
  return [params.path, params.source, params.destination, params.cwd].filter(
    (p) => typeof p === 'string' && p.length > 0,
  );
}

export function ToolProvider({ children, layoutHook }) {
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const pendingResolveRef = useRef(null);

  const executeTool = useCallback(async (toolName, params, appContext) => {
    const registry = getToolRegistry();
    const tool = registry[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const isAgentCall = params?.[AGENT_FLAG] === true || params?.[THREAD_KEY] != null;

    // -------------------------------------------------------------------
    // AGENT PATH — the hard gate. The agent never reaches the tool handler
    // without passing through this. There is no bypass flag.
    // -------------------------------------------------------------------
    if (isAgentCall) {
      const threadId = params?.[THREAD_KEY] || null;
      // Fail-closed: unknown thread → ask-always + empty allow.
      const policy = resolvePolicyForThread(threadId);

      // 1. Filesystem blacklist is a HARD DENY (not a confirmation) for
      //    every surface, including chat.
      for (const p of candidatePaths(params)) {
        if (isPathBlacklisted(p, policy.blacklist)) {
          const reason = `Path "${p}" is blacklisted for the ${policy.surface} surface`;
          if (policy.surface !== 'chat') recordGatedToolCall(threadId, { tool: toolName, reason });
          logger.warn('permissions.gate', 'Tool denied by blacklist', { toolName, threadId, surface: policy.surface, path: p });
          throw new PermissionGateError(reason, { tool: toolName, reason, surface: policy.surface });
        }
      }

      // 2. Confirmation level under the resolved policy mode.
      let needsConfirmation = !!tool.requiresConfirmation;
      if (policy.mode === 'no-asking') {
        needsConfirmation = false;
      } else if (policy.mode === 'ask-destructive') {
        if (REVERSIBLE_AGENT_UI_TOOLS.has(toolName)) {
          needsConfirmation = false;
        } else {
          needsConfirmation = toolName === 'runCommand'
          ? isDestructiveCommand(params.command || '')
          : !!tool.requiresConfirmation;
        }
      } else {
        // ask-always (or unknown mode → most restrictive)
        needsConfirmation = !!tool.requiresConfirmation;
      }

      if (params?.[GRAPH_CONFIRMED_KEY] === true) {
        needsConfirmation = false;
      }

      if (needsConfirmation) {
        if (policy.surface === 'chat') {
          // A human is present — surface the renderer confirmation modal.
          // The model cannot skip this; the Promise blocks tool execution.
          return new Promise((resolve, reject) => {
            pendingResolveRef.current = { resolve, reject };
            setPendingConfirmation({ toolName, params, appContext, surface: 'chat' });
          });
        }
        // Headless (task) or unknown surface — nobody can approve. Record
        // the block so useTaskAutomation pauses the task to 'waiting',
        // and deny this call.
        const reason = `${toolName} requires confirmation under '${policy.mode}' but the ${policy.surface} surface is headless`;
        recordGatedToolCall(threadId, { tool: toolName, reason });
        throw new PermissionGateError(reason, { tool: toolName, reason, surface: policy.surface });
      }

      return await tool.handler(params, appContext, layoutHook);
    }

    // -------------------------------------------------------------------
    // LOCAL UI PATH — direct user action in the app (not the agent).
    // Preserves prior behavior; uses the fail-closed legacy mirror.
    // -------------------------------------------------------------------
    let needsConfirmation = tool.requiresConfirmation;
    if (toolName === 'runCommand') {
      try {
        const config = await window.api.agentGetConfig();
        const mode = config?.terminal?.mode || 'ask-always';
        if (mode === 'no-asking') {
          needsConfirmation = false;
        } else if (mode === 'ask-destructive') {
          needsConfirmation = isDestructiveCommand(params.command || '');
        }
      } catch { /* fall back to confirmation */ }
    }

    if (needsConfirmation) {
      return new Promise((resolve, reject) => {
        pendingResolveRef.current = { resolve, reject };
        setPendingConfirmation({ toolName, params, appContext, surface: 'local' });
      });
    }

    return await tool.handler(params, appContext, layoutHook);
  }, [layoutHook]);

  const confirmAction = useCallback(async (editedParams) => {
    const pending = pendingConfirmation;
    const resolver = pendingResolveRef.current;
    if (!pending || !resolver) return;

    setPendingConfirmation(null);
    pendingResolveRef.current = null;

    try {
      const registry = getToolRegistry();
      const tool = registry[pending.toolName];
      const result = await tool.handler(editedParams || pending.params, pending.appContext || null, layoutHook);
      resolver.resolve(result);
    } catch (error) {
      resolver.reject(error);
    }
  }, [pendingConfirmation, layoutHook]);

  const cancelAction = useCallback(() => {
    const resolver = pendingResolveRef.current;
    setPendingConfirmation(null);
    pendingResolveRef.current = null;

    if (resolver) {
      resolver.reject(new Error('Action cancelled by user'));
    }
  }, []);

  const value = {
    executeTool,
    getToolDefinitions,
    pendingConfirmation,
    confirmAction,
    cancelAction,
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}

export function useTools() {
  const context = useContext(ToolContext);
  if (!context) throw new Error('useTools must be used within ToolProvider');
  return context;
}
