/**
 * useToolBridge — relays agent tool calls into the single tool executor.
 *
 * When the Python DeerFlow/LangGraph agent invokes a briizOS UI-state tool
 * it POSTs to the Electron tool-bridge (port 2025), which relays via IPC:
 *
 *   Python agent → HTTP :2025 → electron/tool-bridge.js → IPC →
 *     useToolBridge → ToolContext.executeTool → src/lib/tools.js handler
 *
 * IMPORTANT: this hook routes through `executeTool` (the ONE canonical
 * executor from ToolContext) rather than re-implementing registry lookup.
 * That guarantees the same registry + the same `layoutHook` wiring that the
 * rest of the app uses — previously this hook called `tool.handler` with no
 * layoutHook, silently breaking panel/layout tools. Routing through the
 * shared executor removes that whole class of drift.
 *
 * Confirmation is owned by the agent's Python middleware, so bridge calls
 * pass `__agentAuto: true` to bypass the renderer-side confirmation gate
 * (no double-confirm).
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

    const cleanup = window.api.onToolBridgeExecute(async ({ requestId, toolName, params }) => {
      logger.info('tool.bridge', `Agent tool request: ${toolName}`, { requestId });

      try {
        const result = await executeToolRef.current(
          toolName,
          { ...params, __agentAuto: true },
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
