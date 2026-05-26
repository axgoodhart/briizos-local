/**
 * useToolBridge — relays in-process agent tool calls into the single executor.
 *
 * The lead_agent runs inside Electron main (LangChain.js / LangGraph.js)
 * and calls back into the renderer's tool registry via direct IPC — no
 * HTTP, no localhost socket. The path is:
 *
 *   electron/agent → electron/agent/bridge.js → IPC 'tool-bridge-execute' →
 *     useToolBridge → ToolContext.executeTool → src/lib/tools.js handler
 *
 * IMPORTANT: this hook routes through `executeTool` (the ONE canonical
 * executor from ToolContext) rather than re-implementing registry lookup.
 * That guarantees the same registry + the same `layoutHook` wiring that the
 * rest of the app uses — previously this hook called `tool.handler` with no
 * layoutHook, silently breaking panel/layout tools. Routing through the
 * shared executor removes that whole class of drift.
 *
 * Confirmation is initiated by the LangGraph tool interrupt and still
 * enforced here by ToolContext's renderer-side hard gate. Bridge calls pass
 * `__agentAuto: true` plus the LangGraph thread id so the gate can resolve
 * the correct chat/task surface policy before any handler runs.
 *
 * Mount once in AppContent (App.jsx).
 *
 * @param {Function} executeTool - ToolContext.executeTool(toolName, params, appContext)
 * @param {Object}   appContext  - live app data (tasks/notes/events) for handlers
 */

import { useEffect, useRef } from 'react';
import logger from '../lib/logger';

export function useToolBridge(executeTool, appContext) {
  const executeToolRef = useRef(executeTool);
  const appContextRef = useRef(appContext);

  useEffect(() => { executeToolRef.current = executeTool; }, [executeTool]);
  useEffect(() => { appContextRef.current = appContext; }, [appContext]);

  useEffect(() => {
    if (!window.api?.onToolBridgeExecute) {
      logger.debug('tool-bridge', 'Preload bindings not available, skipping tool bridge setup');
      return undefined;
    }

    const cleanup = window.api.onToolBridgeExecute(async ({ requestId, toolName, params, threadId }) => {
      logger.info('tool.bridge', `Agent tool request: ${toolName}`, { requestId, threadId });

      try {
        // __agentAuto marks this as an agent-originated call (so the hard
        // gate engages); __briizosThreadId lets the gate resolve which
        // surface/policy governs it. No bypass — the gate decides.
        const result = await executeToolRef.current(
          toolName,
          { ...params, __agentAuto: true, __briizosThreadId: threadId || null },
          appContextRef.current,
        );
        logger.info('tool.bridge', `Tool executed: ${toolName}`, { requestId, success: result?.success });
        window.api.toolBridgeResult(requestId, result, null);
      } catch (err) {
        logger.error('tool.bridge', `Tool execution failed: ${toolName}`, { requestId, error: err?.message });
        window.api.toolBridgeResult(requestId, null, err?.message || 'Tool execution failed');
      }
    });

    return cleanup;
  }, []);
}

export default useToolBridge;
