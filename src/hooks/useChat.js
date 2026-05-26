/**
 * useChat — the single chat execution path.
 *
 * ARCHITECTURE (one path, in-process):
 *
 *   InteractionPanel.sendMessage
 *     → useChat.sendMessage
 *       → window.api.langgraphStreamMessage(streamId, threadId, msg, config)   [IPC]
 *         → electron/main.js → electron/agent (in-process LangGraph.js)
 *           → lead_agent graph runs inside Electron main; tools call the
 *             renderer registry directly via IPC (no HTTP, no port 2025):
 *             agent → bridge → useToolBridge → ToolContext.executeTool →
 *             src/lib/tools.js handlers (Electron-trusted fs/terminal/UI)
 *     ← Streamed events pushed back on the 'langgraph-stream-event' channel
 *       (text / tool_call_start / tool_result / tool_confirmation /
 *        clarification / thread_title / end / error)
 *
 * There is intentionally NO direct-to-provider streaming, NO renderer-side
 * system prompt, and NO renderer-side tool catalog. The in-process agent
 * owns the system prompt, the tool set, memory, and tool confirmation.
 *
 * Confirmation and clarification pause the graph via LangGraph interrupt
 * and resume through langgraphResumeRun. Tool execution still passes through
 * ToolContext.executeTool, keyed by __briizosThreadId.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import logger, { setActiveThread } from '../lib/logger';
import { registerSurfaceForThread, unregisterThread, restrictivePolicy } from '../lib/agentSurfaces';
import {
  subscribeChatMessages,
  addChatMessage,
  addLog,
  clearChatMessages,
  getSelectedFiles as getSelectedFilesFirestore,
  subscribeRemoteChat,
  addRemoteChatMessage,
  markRemoteChatRead,
} from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && !!window.api;

const MODEL_STORAGE_KEY = 'briizos-selected-model';

const MODALITY_SKILL_MAP = {
  chat: null,
  research: 'deep-research',
  code: 'frontend-design',
  report: 'consulting-analysis',
  plan: null,
};

const FILE_CONTEXT_TOOL_CAPABILITIES = [
  '- `read_file(path)`: Read file contents (subject to blacklist rules).',
  '- `ls(path)`: List directory contents (subject to blacklist rules).',
  '- `write_file(path, content, opId?)`: Create/overwrite files.',
  '- `str_replace(path, old_str, new_str, opId?)`: Replace one exact string occurrence.',
  '- `copy_file(source, destination, opId?)`: Copy files or folders.',
  '- `move_file(source, destination, opId?)`: Move/rename files.',
  '- `delete_file(path, opId?)`: Delete files or folders.',
  '- `bash(command, cwd?, opId?)`: Run shell commands when needed.'
];

function buildFileContextAddendum(files = []) {
  if (!Array.isArray(files) || files.length === 0) return '';
  const lines = files
    .map((file) => file?.path)
    .filter(Boolean)
    .map((filePath) => `- ${filePath}`);
  if (lines.length === 0) return '';

  return [
    '',
    '---',
    '<uploaded_files>',
    'The following files were uploaded or pinned in this message:',
    '',
    ...lines,
    '',
    'You can read these files using the `read_file` tool with the paths shown above.',
    'Use `view_image` for jpg, jpeg, png, or webp files when visual inspection is needed.',
    '</uploaded_files>',
    '',
    'Capabilities available for working with these paths (tools):',
    ...FILE_CONTEXT_TOOL_CAPABILITIES,
    '',
    'Prefer direct path-based tool calls when the user asks to inspect or modify pinned files.'
  ].join('\n');
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat({ selectedModel } = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [tokenUsage, setTokenUsage] = useState(null);
  const [filesInContext, setFilesInContext] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [toolCalls, setToolCalls] = useState([]);
  const [pendingToolConfirmation, setPendingToolConfirmation] = useState(null);
  const [pendingClarification, setPendingClarification] = useState(null);
  const [threadTitle, setThreadTitle] = useState(null);
  const threadTitleRef = useRef(null);
  const [modality, setModality] = useState('chat');
  const [subAgentTasks, setSubAgentTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('briizos-suggestions-enabled');
      return stored !== null ? JSON.parse(stored) : true;
    } catch { return true; }
  });

  // Streaming/session refs (stable across renders).
  const streamContentRef = useRef('');
  const toolCallsRef = useRef([]);
  const subAgentTasksRef = useRef([]);
  const selectedModelRef = useRef(selectedModel || null);
  const suggestionsEnabledRef = useRef(suggestionsEnabled);
  const modalityRef = useRef(modality);

  // One LangGraph thread per chat session (multi-turn context lives in the
  // agent's checkpointer, keyed by this thread_id).
  const threadIdRef = useRef(null);
  // The streamId currently being consumed — used to filter the shared
  // 'langgraph-stream-event' subscription so stale streams are ignored.
  const activeStreamIdRef = useRef(null);
  // Confirmation bookkeeping so approve/reject can resume the right run.
  const pendingConfirmRef = useRef(null);
  const pendingClarificationRef = useRef(null);
  // Effective permission policy for the chat surface (resolved at thread
  // creation). Drives permission_policy on every run so the agent runtime
  // and renderer gate agree.
  const chatPolicyRef = useRef(restrictivePolicy('chat'));

  useEffect(() => { selectedModelRef.current = selectedModel || null; }, [selectedModel]);
  useEffect(() => { modalityRef.current = modality; }, [modality]);

  useEffect(() => {
    try {
      localStorage.setItem('briizos-suggestions-enabled', JSON.stringify(suggestionsEnabled));
    } catch {}
    suggestionsEnabledRef.current = suggestionsEnabled;
    if (!suggestionsEnabled) setSuggestions([]);
  }, [suggestionsEnabled]);

  const uid = getCurrentUid();

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeChatMessages((firestoreMessages) => setMessages(firestoreMessages));
    return () => unsubscribe();
  }, [uid]);

  // ---------------------------------------------------------------------
  // Backend status → isConfigured (agent reachable, not "API keys set").
  // ---------------------------------------------------------------------
  const checkConfig = useCallback(async () => {
    if (!hasApi || typeof api.langgraphGetStatus !== 'function') {
      setIsConfigured(true);
      return;
    }
    try {
      const status = await api.langgraphGetStatus();
      // Surface backend state in the LogPanel (not just the terminal) so
      // "is the agent up?" is answerable from inside the app.
      logger.info('agent.backend', `Agent backend status: ${status?.status || 'unknown'}`, {
        ready: status?.ready, port: status?.port, pid: status?.pid,
      });
      // Don't hard-block the UI while the backend is still booting; only
      // flag "not configured" on a definitive failed/env_missing state.
      const blocked = status?.status === 'env_missing' || status?.status === 'failed';
      setIsConfigured(!blocked);
    } catch (error) {
      logger.error('agent.status', 'Failed to read LangGraph status', { error: error?.message });
      setIsConfigured(true);
    }
  }, []);

  const loadSelectedFiles = useCallback(async () => {
    try {
      const files = await getSelectedFilesFirestore();
      const normalized = files.map((f) => ({ name: f.file_name, path: f.file_path }));
      setFilesInContext(normalized);
      return normalized;
    } catch (error) {
      logger.error('chat', 'Failed to load selected files', { error: error?.message });
      return [];
    }
  }, []);

  useEffect(() => {
    checkConfig();
    loadSelectedFiles();
  }, [checkConfig, loadSelectedFiles]);

  const getSelectedModel = useCallback(() => {
    const fromProp = selectedModelRef.current;
    if (fromProp) return fromProp;
    try {
      return localStorage.getItem(MODEL_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------
  // Single SSE event handler. Mutates refs then mirrors into state so the
  // UI contract (streamingContent / toolCalls / subAgentTasks / etc.)
  // is preserved exactly as before.
  // ---------------------------------------------------------------------
  const handleStreamEvent = useCallback((type, payload = {}) => {
    switch (type) {
      case 'text': {
        if (payload.content) {
          streamContentRef.current += payload.content;
          setStreamingContent(streamContentRef.current);
        }
        break;
      }
      case 'tool_call_start': {
        const tc = {
          id: payload.id || newId('tc'),
          name: payload.name,
          args: payload.args || {},
          status: 'running',
        };
        toolCallsRef.current = [...toolCallsRef.current, tc];
        setToolCalls([...toolCallsRef.current]);
        logger.info('tool.call', `Agent tool: ${payload.name}`, { id: tc.id, args: tc.args });
        break;
      }
      case 'tool_result': {
        toolCallsRef.current = toolCallsRef.current.map((t) => {
          const match = (payload.tool_call_id && t.id === payload.tool_call_id)
            || (!payload.tool_call_id && t.name === payload.name && t.status === 'running');
          return match ? { ...t, status: 'done', result: payload.content } : t;
        });
        setToolCalls([...toolCallsRef.current]);
        break;
      }
      case 'tool_confirmation': {
        const conf = {
          summary: payload.summary || payload.tool_name,
          tool_name: payload.tool_name,
          tool_call_id: payload.tool_call_id,
          args: payload.args || {},
        };
        pendingConfirmRef.current = conf;
        setPendingToolConfirmation(conf);
        logger.info('agent.confirm', `Tool confirmation requested: ${conf.tool_name}`, { summary: conf.summary });
        break;
      }
      case 'clarification': {
        const clarification = {
          question: payload.question,
          clarification_type: payload.clarification_type || 'missing_info',
          context: payload.context || null,
          options: payload.options || [],
          message: payload.message || payload.question,
        };
        pendingClarificationRef.current = clarification;
        setPendingClarification(clarification);
        if (clarification.message) {
          streamContentRef.current += streamContentRef.current
            ? `\n\n${clarification.message}`
            : clarification.message;
          setStreamingContent(streamContentRef.current);
        }
        logger.info('agent.clarify', 'Clarification requested', { question: clarification.question });
        break;
      }
      case 'thread_title': {
        if (payload.title) {
          threadTitleRef.current = payload.title;
          setThreadTitle((prev) => prev || payload.title);
        }
        break;
      }
      case 'values': {
        if (payload?.title) {
          threadTitleRef.current = payload.title;
          setThreadTitle((prev) => prev || payload.title);
        }
        break;
      }
      case 'error': {
        logger.error('agent.stream', 'Agent stream error', { message: payload?.message });
        streamContentRef.current += `\n\n[Agent error] ${payload?.message || 'Unknown error'}`;
        setStreamingContent(streamContentRef.current);
        break;
      }
      case 'end':
        break;
      default: {
        // DeerFlow sub-agent lifecycle events: task_started / task_progress /
        // task_completed / task_failed / task_timeout.
        if (typeof type === 'string' && type.startsWith('task_')) {
          const id = payload.task_id || payload.id || payload.name || newId('sa');
          const existing = subAgentTasksRef.current.find((t) => t.id === id);
          const base = existing || {
            id,
            description: payload.description || payload.title || payload.name || 'Sub-agent task',
            status: 'running',
            messageCount: 0,
          };
          let next = { ...base };
          if (type === 'task_started') next.status = 'running';
          else if (type === 'task_progress' || type === 'task_running') {
            next.status = 'running';
            next.messageCount = payload.message_index || ((base.messageCount || 0) + 1);
          }
          else if (type === 'task_completed') next.status = 'completed';
          else if (type === 'task_failed') { next.status = 'failed'; next.error = payload.error || payload.message; }
          else if (type === 'task_timeout' || type === 'task_timed_out') next.status = 'timed_out';

          subAgentTasksRef.current = existing
            ? subAgentTasksRef.current.map((t) => (t.id === id ? next : t))
            : [...subAgentTasksRef.current, next];
          setSubAgentTasks([...subAgentTasksRef.current]);
        }
        break;
      }
    }
  }, []);

  // Persistent subscription to the agent stream push channel. Set up once;
  // filters by the active streamId so only the live turn is consumed.
  useEffect(() => {
    if (!hasApi || typeof api.onLanggraphStreamEvent !== 'function') {
      logger.warn('agent.stream', 'LangGraph stream channel unavailable (preload bindings missing)');
      return undefined;
    }
    const cleanup = api.onLanggraphStreamEvent(({ streamId, type, payload }) => {
      if (streamId !== activeStreamIdRef.current) return;
      try {
        handleStreamEvent(type, payload);
      } catch (err) {
        logger.error('agent.stream', 'Stream event handler threw', { type, error: err?.message });
      }
    });
    return cleanup;
  }, [handleStreamEvent]);

  // ---------------------------------------------------------------------
  // Thread lifecycle
  // ---------------------------------------------------------------------
  const ensureThread = useCallback(async () => {
    if (threadIdRef.current) return threadIdRef.current;
    if (!hasApi || typeof api.langgraphCreateThread !== 'function') {
      throw new Error('Agent backend unavailable (no LangGraph IPC bindings)');
    }
    const res = await api.langgraphCreateThread();
    const threadId = res?.thread_id || res?.threadId || res;
    if (!threadId) throw new Error('Failed to create agent thread');
    threadIdRef.current = threadId;
    setActiveThread(threadId);
    // Resolve + register the chat-surface policy for this thread. Used by
    // both the renderer hard gate (bridge tools) and the run config.
    // Fail-closed if resolution fails.
    try {
      chatPolicyRef.current = await registerSurfaceForThread(threadId, 'chat');
    } catch {
      chatPolicyRef.current = restrictivePolicy('chat');
    }
    logger.info('agent.thread', 'Agent thread created', { threadId, mode: chatPolicyRef.current?.mode });
    return threadId;
  }, []);

  const buildConfig = useCallback(() => {
    const model = getSelectedModel() || undefined;
    const policy = chatPolicyRef.current || restrictivePolicy('chat');
    return {
      model,
      thinking: true,
      plan_mode: modalityRef.current === 'plan',
      // Per-surface (chat column) effective level. permission_policy
      // carries the blacklist and confirmation level for bridge tools.
      tool_confirmation_mode: policy.mode || 'ask-always',
      permission_policy: policy,
    };
  }, [getSelectedModel]);

  // Run one agent turn (fresh message OR a resume) over a single streamId,
  // accumulating into streamContentRef. Returns when the turn is fully done
  // (terminal end/error) OR paused awaiting tool confirmation.
  const runAgentTurn = useCallback(async (kind, args) => {
    const streamId = newId('stream');
    activeStreamIdRef.current = streamId;
    setCurrentStreamId(streamId);

    if (kind === 'message') {
      return api.langgraphStreamMessage(streamId, args.threadId, args.message, args.config);
    }
    return api.langgraphResumeRun(streamId, args.threadId, args.response, args.config);
  }, []);

  const finalizeAssistantTurn = useCallback(async ({ isRemote, skipSuggestions = false }) => {
    const content = streamContentRef.current;
    if (content) {
      await addChatMessage('assistant', content);
      if (isRemote) {
        try { await addRemoteChatMessage('assistant', content); } catch {}
      }
      addLog('assistant_message', content.slice(0, 1200)).catch(() => {});
    }

    // Follow-up suggestions are a local-user affordance only.
    if (!skipSuggestions && suggestionsEnabledRef.current && !isRemote && typeof api.langgraphFetchSuggestions === 'function') {
      try {
        const recent = [...messages, { role: 'assistant', content }]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));
        const items = await api.langgraphFetchSuggestions(
          recent,
          3,
          { model: getSelectedModel() || undefined },
          threadIdRef.current,
        );
        if (suggestionsEnabledRef.current && Array.isArray(items) && items.length > 0) {
          setSuggestions(items);
        }
      } catch (err) {
        logger.debug('agent.suggestions', 'Suggestion fetch failed', { error: err?.message });
      }
    }
  }, [messages, getSelectedModel]);

  const sendMessage = useCallback(async (message, { isRemote = false } = {}) => {
    if (!message?.trim() || isLoading) return null;
    if (!hasApi || typeof api.langgraphStreamMessage !== 'function') {
      await addChatMessage('assistant', 'Error: the AI agent backend is not available.', true);
      return null;
    }

    setSuggestions([]);
    const pendingClarificationAnswer = pendingClarificationRef.current;
    await addChatMessage('user', message);
    setIsLoading(true);

    try {
      if (pendingClarificationAnswer) {
        const threadId = threadIdRef.current;
        if (!threadId) throw new Error('Cannot resume clarification without an agent thread');

        pendingClarificationRef.current = null;
        setPendingClarification(null);
        streamContentRef.current = '';
        setStreamingContent('');
        toolCallsRef.current = [];
        setToolCalls([]);
        subAgentTasksRef.current = [];
        setSubAgentTasks([]);
        pendingConfirmRef.current = null;

        logger.info('agent.clarify', 'Resuming after clarification', { threadId });
        await runAgentTurn('resume', {
          threadId,
          response: { answer: message, clarification: pendingClarificationAnswer },
          config: buildConfig(),
        });

        if (pendingConfirmRef.current) {
          logger.info('chat', 'Turn paused awaiting tool confirmation');
          return null;
        }
        if (pendingClarificationRef.current) {
          await finalizeAssistantTurn({ isRemote, skipSuggestions: true });
          return null;
        }

        await finalizeAssistantTurn({ isRemote });
        return null;
      }

      let actualMessage = message;
      const skillName = MODALITY_SKILL_MAP[modalityRef.current];
      if (skillName) actualMessage = `[Use skill: ${skillName}] ${message}`;
      else if (modalityRef.current === 'plan') actualMessage = `[Plan mode] ${message}`;

      const selectedFiles = await loadSelectedFiles();
      actualMessage += buildFileContextAddendum(selectedFiles);

      const threadId = await ensureThread();

      // Reset per-turn accumulators.
      streamContentRef.current = '';
      setStreamingContent('');
      toolCallsRef.current = [];
      setToolCalls([]);
      subAgentTasksRef.current = [];
      setSubAgentTasks([]);
      pendingConfirmRef.current = null;

      logger.info('chat', 'Dispatching message to agent', { threadId, isRemote, modality: modalityRef.current });

      await runAgentTurn('message', { threadId, message: actualMessage, config: buildConfig() });

      // If the run paused for tool confirmation, hold the turn open — the
      // assistant message is persisted only once the run truly completes
      // (after approve/reject → resume). Otherwise finalize now.
      if (pendingConfirmRef.current) {
        logger.info('chat', 'Turn paused awaiting tool confirmation');
        return null;
      }
      if (pendingClarificationRef.current) {
        await finalizeAssistantTurn({ isRemote, skipSuggestions: true });
        return null;
      }

      await finalizeAssistantTurn({ isRemote });
    } catch (error) {
      logger.error('chat', 'Agent turn failed', { error: error?.message });
      await addChatMessage('assistant', `Error: ${error?.message || 'Unknown error'}`, true);
    } finally {
      if (!pendingConfirmRef.current) {
        setIsLoading(false);
        setCurrentStreamId(null);
        setStreamingContent('');
        streamContentRef.current = '';
        activeStreamIdRef.current = null;
      }
    }

    return null;
  }, [isLoading, loadSelectedFiles, ensureThread, runAgentTurn, buildConfig, finalizeAssistantTurn]);

  // ---------------------------------------------------------------------
  // Tool confirmation resolution → resume the same thread.
  // ---------------------------------------------------------------------
  const resolveConfirmation = useCallback(async (approved) => {
    const conf = pendingConfirmRef.current;
    if (!conf) return;
    pendingConfirmRef.current = null;
    setPendingToolConfirmation(null);

    const threadId = threadIdRef.current;
    if (!threadId) {
      setIsLoading(false);
      return;
    }

    logger.info('agent.confirm', `Tool ${approved ? 'approved' : 'rejected'}: ${conf.tool_name}`, { summary: conf.summary });

    try {
      await runAgentTurn('resume', {
        threadId,
        response: { approved, summary: conf.summary },
        config: buildConfig(),
      });

      if (pendingConfirmRef.current) {
        // Another confirmation surfaced — stay paused.
        return;
      }
      if (pendingClarificationRef.current) {
        await finalizeAssistantTurn({ isRemote: false, skipSuggestions: true });
        return;
      }
      await finalizeAssistantTurn({ isRemote: false });
    } catch (error) {
      logger.error('agent.confirm', 'Resume after confirmation failed', { error: error?.message });
      await addChatMessage('assistant', `Error: ${error?.message || 'Unknown error'}`, true);
    } finally {
      if (!pendingConfirmRef.current) {
        setIsLoading(false);
        setCurrentStreamId(null);
        setStreamingContent('');
        streamContentRef.current = '';
        activeStreamIdRef.current = null;
      }
    }
  }, [runAgentTurn, buildConfig, finalizeAssistantTurn]);

  const approveToolConfirmation = useCallback(() => resolveConfirmation(true), [resolveConfirmation]);
  const rejectToolConfirmation = useCallback(() => resolveConfirmation(false), [resolveConfirmation]);

  // ---------------------------------------------------------------------
  // Remote chat relay (unchanged contract)
  // ---------------------------------------------------------------------
  const isLoadingRef = useRef(false);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const sendRemoteResponse = useCallback(async (remoteMsg) => {
    if (isLoadingRef.current || !remoteMsg?.content) return;
    await addChatMessage('user', `[Remote] ${remoteMsg.content}`);
    try { await markRemoteChatRead(remoteMsg.id); } catch {}
    await sendMessage(`[Remote message] ${remoteMsg.content}`, { isRemote: true });
  }, [sendMessage]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeRemoteChat(
      () => {},
      (remoteMsg) => { sendRemoteResponse(remoteMsg); }
    );
    return () => unsubscribe();
  }, [uid, sendRemoteResponse]);

  const clearHistory = useCallback(async () => {
    try {
      await clearChatMessages();
      setMessages([]);
      setTokenUsage(null);
      setStreamingContent('');
      setCurrentStreamId(null);
      setToolCalls([]);
      toolCallsRef.current = [];
      setSubAgentTasks([]);
      subAgentTasksRef.current = [];
      setModality('chat');
      setSuggestions([]);
      setThreadTitle(null);
      threadTitleRef.current = null;
      setPendingToolConfirmation(null);
      pendingConfirmRef.current = null;
      setPendingClarification(null);
      pendingClarificationRef.current = null;
      // New conversation → new agent thread.
      if (threadIdRef.current) unregisterThread(threadIdRef.current);
      chatPolicyRef.current = restrictivePolicy('chat');
      threadIdRef.current = null;
      activeStreamIdRef.current = null;
      setActiveThread(null);
    } catch (error) {
      logger.error('chat', 'Failed to clear history', { error: error?.message });
    }
  }, []);

  const refreshFilesInContext = useCallback(async () => {
    await loadSelectedFiles();
  }, [loadSelectedFiles]);

  return {
    messages,
    isLoading,
    isConfigured,
    tokenUsage,
    filesInContext,
    streamingContent,
    currentStreamId,
    toolCalls,
    subAgentTasks,
    pendingToolConfirmation,
    pendingClarification,
    modality,
    setModality,
    suggestions,
    suggestionsEnabled,
    setSuggestionsEnabled,
    threadTitle,
    threadTitleRef,
    sendMessage,
    clearHistory,
    loadHistory: () => {},
    checkConfig,
    refreshFilesInContext,
    approveToolConfirmation,
    rejectToolConfirmation,
  };
}

export default useChat;
