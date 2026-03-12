/**
 * useToolBridge - React hook that handles tool execution requests from the
 * Electron main process tool bridge.
 *
 * When the LangGraph Python agent calls a briizOS tool, the request flows:
 *   Python -> HTTP POST -> tool-bridge.js (main) -> IPC -> renderer
 *
 * This hook listens for those IPC messages, looks up the tool in the existing
 * tools registry (src/lib/tools.js), executes it, and sends the result back
 * via IPC so the HTTP response can complete.
 *
 * Mount this hook once in AppContent (App.jsx).
 */

import { useEffect } from 'react';
import { getToolRegistry } from '../lib/tools';
import logger from '../lib/logger';

/**
 * @param {Function} executeTool - The executeTool function from ToolContext
 *   that handles confirmation gates. For bridge calls we bypass confirmation
 *   by passing __agentAuto: true.
 * @param {Object} appContext - The app context object (tasks, notes, events)
 *   passed to tool handlers for data lookups.
 */
export function useToolBridge(executeTool, appContext) {
  useEffect(() => {
    if (!window.api?.onToolBridgeExecute) {
      logger.debug('tool-bridge', 'Preload bindings not available, skipping tool bridge setup');
      return;
    }

    const cleanup = window.api.onToolBridgeExecute(async ({ requestId, toolName, params }) => {
      logger.info('tool-bridge', `Renderer received tool request: ${toolName}`, { requestId });

      try {
        const registry = getToolRegistry();
        const tool = registry[toolName];

        if (!tool) {
          const error = `Unknown tool: ${toolName}`;
          logger.warn('tool-bridge', error);
          window.api.toolBridgeResult(requestId, null, error);
          return;
        }

        // Execute the tool handler directly, bypassing confirmation gates.
        // The __agentAuto flag is the existing pattern in ToolContext.jsx for
        // agent-initiated tool calls that should not prompt the user.
        const result = await tool.handler(
          { ...params, __agentAuto: true },
          appContext,
        );

        logger.info('tool-bridge', `Tool executed: ${toolName}`, { requestId, success: result?.success });
        window.api.toolBridgeResult(requestId, result, null);
      } catch (err) {
        logger.error('tool-bridge', `Tool execution failed: ${toolName}`, err?.message);
        window.api.toolBridgeResult(requestId, null, err?.message || 'Tool execution failed');
      }
    });

    return cleanup;
  }, [executeTool, appContext]);
}

export default useToolBridge;
