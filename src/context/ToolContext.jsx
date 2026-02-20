import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getToolRegistry, getToolDefinitions } from '../lib/tools';

const ToolContext = createContext(null);

export function ToolProvider({ children, layoutHook }) {
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const pendingResolveRef = useRef(null);

  const executeTool = useCallback(async (toolName, params, appContext) => {
    const registry = getToolRegistry();
    const tool = registry[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const isAgentAuto = params?.__agentAuto === true;

    // Dynamic confirmation for runCommand based on terminal permission mode
    let needsConfirmation = tool.requiresConfirmation;
    if (!isAgentAuto && toolName === 'runCommand') {
      try {
        const config = await window.api.agentGetConfig();
        const mode = config?.terminal?.mode || 'ask-always';
        if (mode === 'no-asking') {
          needsConfirmation = false;
        } else if (mode === 'ask-destructive') {
          const { isDestructiveCommand } = await import('../lib/permissions.js');
          needsConfirmation = isDestructiveCommand(params.command);
        }
      } catch { /* fallback to confirmation */ }
    }
    if (isAgentAuto) {
      needsConfirmation = false;
    }

    if (needsConfirmation) {
      // Queue for user confirmation
      return new Promise((resolve, reject) => {
        pendingResolveRef.current = { resolve, reject };
        setPendingConfirmation({ toolName, params });
      });
    }

    // Execute immediately for read-only tools or permitted commands
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
      const result = await tool.handler(editedParams || pending.params, null, layoutHook);
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
