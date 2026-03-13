import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
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
import { useAppContext } from './useAppContext';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

const MODEL_STORAGE_KEY = 'briizos-selected-model';

const MODALITY_SKILL_MAP = {
  chat: null,
  research: 'deep-research',
  code: 'frontend-design',
  report: 'consulting-analysis',
  plan: null,
};

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
  const [modality, setModality] = useState('chat');
  const [subAgentTasks, setSubAgentTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('briizos-suggestions-enabled');
      return stored !== null ? JSON.parse(stored) : true;
    } catch { return true; }
  });

  const streamContentRef = useRef('');
  const streamIdRef = useRef(null);
  const toolCallsRef = useRef([]);
  const subAgentTasksRef = useRef([]);
  const threadIdRef = useRef(null);
  const isRemoteResponseRef = useRef(false);
  const messagesRef = useRef([]);
  const suggestionsEnabledRef = useRef(suggestionsEnabled);
  const selectedModelRef = useRef(selectedModel || null);

  // Contexts
  const appContext = useAppContext();

  // Keep refs for values used inside IPC listeners (avoids effect re-runs)
  const appContextRef = useRef(appContext);
  useEffect(() => { appContextRef.current = appContext; }, [appContext]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { suggestionsEnabledRef.current = suggestionsEnabled; }, [suggestionsEnabled]);
  useEffect(() => { selectedModelRef.current = selectedModel || null; }, [selectedModel]);

  // Persist suggestionsEnabled to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('briizos-suggestions-enabled', JSON.stringify(suggestionsEnabled));
    } catch {}
  }, [suggestionsEnabled]);

  // Re-check uid each render so subscription restarts when auth becomes ready
  const uid = getCurrentUid();

  // Subscribe to chat messages from Firestore
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeChatMessages((firestoreMessages) => {
      setMessages(firestoreMessages);
    });

    return () => unsubscribe();
  }, [uid]);

  // Check if AI is configured
  useEffect(() => {
    checkConfig();
    loadSelectedFiles();
  }, []);

  const checkConfig = useCallback(async () => {
    if (!hasApi) return;
    try {
      if (typeof api.isAIConfigured !== 'function') {
        // Older preload builds may not expose this; avoid noisy errors.
        setIsConfigured(true);
        return;
      }
      const configured = await api.isAIConfigured();
      setIsConfigured(configured);
    } catch (error) {
      logger.error('chat', 'Failed to check AI config', error?.message);
    }
  }, []);

  const loadSelectedFiles = useCallback(async () => {
    try {
      const files = await getSelectedFilesFirestore();
      const normalized = files.map(f => ({ name: f.file_name, path: f.file_path }));
      setFilesInContext(normalized);
      return normalized;
    } catch (error) {
      logger.error('chat', 'Failed to load selected files', error?.message);
      return [];
    }
  }, []);

  // Ensure a LangGraph thread exists, creating one if needed
  const ensureThread = useCallback(async () => {
    if (threadIdRef.current) return threadIdRef.current;
    if (!hasApi || !api.langgraphCreateThread) {
      throw new Error('LangGraph API not available');
    }
    const result = await api.langgraphCreateThread();
    const tid = result?.thread_id || result?.threadId || result;
    threadIdRef.current = tid;
    logger.debug('chat', 'Created LangGraph thread', tid);
    return tid;
  }, []);

  const getModelForRun = useCallback(() => {
    if (!hasApi) return null;
    const fromProp = selectedModelRef.current;
    if (fromProp) return fromProp;
    try {
      return localStorage.getItem(MODEL_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }, []);

  // Set up LangGraph stream event listener — register once, use refs for latest values
  useEffect(() => {
    if (!hasApi || !api.onLanggraphStreamEvent) return;

    const cleanup = api.onLanggraphStreamEvent((data) => {
      // Match by streamId
      if (data.streamId !== streamIdRef.current) return;

      switch (data.type) {
        case 'text': {
          streamContentRef.current += data.payload?.content || '';
          setStreamingContent(streamContentRef.current);
          break;
        }
        case 'tool_call_start': {
          const tc = {
            id: data.payload?.tool_call_id || data.payload?.id || `tc-${Date.now()}`,
            name: data.payload?.name || 'unknown',
            args: data.payload?.args || {},
            status: 'running',
          };
          toolCallsRef.current = [...toolCallsRef.current, tc];
          setToolCalls([...toolCallsRef.current]);
          break;
        }
        case 'tool_result': {
          const callId = data.payload?.tool_call_id || data.payload?.id;
          toolCallsRef.current = toolCallsRef.current.map((tc) =>
            tc.id === callId
              ? { ...tc, status: 'done', result: data.payload?.content || data.payload?.result }
              : tc
          );
          setToolCalls([...toolCallsRef.current]);
          break;
        }
        case 'tool_confirmation': {
          // Destructive tool intercepted -- show confirmation UI
          setPendingToolConfirmation({
            tool_name: data.payload?.tool_name || data.tool_name,
            tool_call_id: data.payload?.tool_call_id || data.tool_call_id,
            args: data.payload?.args || data.args || {},
            summary: data.payload?.summary || data.summary || 'Tool operation',
          });
          // Don't call handleStreamEnd -- keep loading state so user knows action is needed
          break;
        }
        case 'task_started': {
          const task = {
            id: data.task_id || data.payload?.task_id,
            description: data.description || data.payload?.description || 'Sub-agent task',
            status: 'running',
            messageCount: 0,
          };
          subAgentTasksRef.current = [...subAgentTasksRef.current, task];
          setSubAgentTasks([...subAgentTasksRef.current]);
          break;
        }
        case 'task_running': {
          const taskId = data.task_id || data.payload?.task_id;
          subAgentTasksRef.current = subAgentTasksRef.current.map((t) =>
            t.id === taskId
              ? { ...t, messageCount: data.message_index || data.payload?.message_index || t.messageCount + 1 }
              : t
          );
          setSubAgentTasks([...subAgentTasksRef.current]);
          break;
        }
        case 'task_completed': {
          const taskId = data.task_id || data.payload?.task_id;
          subAgentTasksRef.current = subAgentTasksRef.current.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed', result: data.result || data.payload?.result }
              : t
          );
          setSubAgentTasks([...subAgentTasksRef.current]);
          break;
        }
        case 'task_failed': {
          const taskId = data.task_id || data.payload?.task_id;
          subAgentTasksRef.current = subAgentTasksRef.current.map((t) =>
            t.id === taskId
              ? { ...t, status: 'failed', error: data.error || data.payload?.error || 'Task failed' }
              : t
          );
          setSubAgentTasks([...subAgentTasksRef.current]);
          break;
        }
        case 'task_timed_out': {
          const taskId = data.task_id || data.payload?.task_id;
          subAgentTasksRef.current = subAgentTasksRef.current.map((t) =>
            t.id === taskId
              ? { ...t, status: 'timed_out', error: data.error || data.payload?.error || 'Task timed out' }
              : t
          );
          setSubAgentTasks([...subAgentTasksRef.current]);
          break;
        }
        case 'end': {
          handleStreamEnd();
          break;
        }
        case 'error': {
          handleStreamError(data.payload?.error || data.payload?.message || 'Unknown streaming error');
          break;
        }
        default:
          // Ignore values, metadata, and other event types
          break;
      }
    });

    return () => cleanup();
  }, []); // empty deps — listener registered once, use refs for latest values

  // Handle stream end: persist to Firestore and reset state
  const handleStreamEnd = useCallback(async () => {
    const fullContent = streamContentRef.current;
    const currentToolCalls = toolCallsRef.current;

    // Save assistant message to Firestore
    if (fullContent) {
      await addChatMessage('assistant', fullContent);
    }

    // If tool calls occurred, save a structured tool call summary as a separate message
    if (currentToolCalls.length > 0) {
      const toolSummary = currentToolCalls.map((tc) => {
        const resultStr = tc.result
          ? (typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result))
          : '(no result)';
        return `[${tc.name}] ${tc.status === 'done' ? resultStr : 'incomplete'}`;
      }).join('\n');
      // Only save tool summary if there was no text content (avoid duplicate messages)
      if (!fullContent) {
        await addChatMessage('assistant', toolSummary);
      }
    }

    // Log assistant response to activity log
    if (fullContent) {
      addLog('assistant_message', fullContent.slice(0, 1200))
        .catch(err => logger.debug('chat', 'Failed to write assistant_message log', err?.message));
    }

    // Log to memory
    try {
      const { minifyChatText, getChunkFilename, formatLogPrefix } = await import('../lib/memory.js');
      const chunkFile = getChunkFilename();
      const entry = formatLogPrefix('assistant') + ' ' + minifyChatText(fullContent || '(tool calls only)');
      await api.memoryAppendLog(chunkFile, entry);
    } catch (e) {
      logger.error('memory', 'Failed to log assistant message', e?.message);
    }

    // Remote chat passthrough
    if (isRemoteResponseRef.current && fullContent) {
      try {
        await addRemoteChatMessage('assistant', fullContent);
      } catch (e) {
        logger.error('chat', 'Failed to write remote response', e?.message);
      }
      isRemoteResponseRef.current = false;
    }

    // Fetch follow-up suggestions (non-blocking, fire-and-forget)
    if (suggestionsEnabledRef.current && hasApi && api.langgraphGetSuggestions) {
      const lastMessages = [...(messagesRef.current || [])].slice(-4).map(m => ({
        role: m.role,
        content: m.content,
      }));
      // Include the just-streamed response
      if (fullContent) {
        lastMessages.push({ role: 'assistant', content: fullContent.slice(0, 2000) });
      }
      let suggestionModel = null;
      try {
        suggestionModel = selectedModelRef.current || localStorage.getItem(MODEL_STORAGE_KEY) || null;
      } catch {}
      api.langgraphGetSuggestions(lastMessages, 3, { model: suggestionModel })
        .then(results => setSuggestions(results || []))
        .catch(() => setSuggestions([]));
    }

    // Reset streaming state
    streamContentRef.current = '';
    streamIdRef.current = null;
    toolCallsRef.current = [];
    subAgentTasksRef.current = [];
    setStreamingContent('');
    setCurrentStreamId(null);
    setToolCalls([]);
    setSubAgentTasks([]);
    setIsLoading(false);
  }, []);

  // Handle stream error
  const handleStreamError = useCallback(async (errorMsg) => {
    await addChatMessage('assistant', `Error: ${errorMsg}`, true);

    isRemoteResponseRef.current = false;
    streamContentRef.current = '';
    streamIdRef.current = null;
    toolCallsRef.current = [];
    subAgentTasksRef.current = [];
    setStreamingContent('');
    setCurrentStreamId(null);
    setToolCalls([]);
    setSubAgentTasks([]);
    setIsLoading(false);
  }, []);

  // Subscribe to remote chat — auto-respond to incoming remote messages
  const isLoadingRef = useRef(false);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const sendRemoteResponse = useCallback(async (remoteMsg) => {
    if (isLoadingRef.current || !hasApi) return;

    // Add the remote message to local chat with [Remote] prefix
    await addChatMessage('user', `[Remote] ${remoteMsg.content}`);
    markRemoteChatRead(remoteMsg.id).catch(err => logger.debug('chat', 'Failed to mark remote chat read', err?.message));
    setIsLoading(true);
    isRemoteResponseRef.current = true;

    // Log to memory
    try {
      const { minifyChatText, getChunkFilename, formatLogPrefix } = await import('../lib/memory.js');
      const chunkFile = getChunkFilename();
      const entry = formatLogPrefix('user') + ' [Remote] ' + minifyChatText(remoteMsg.content);
      await api.memoryAppendLog(chunkFile, entry);
    } catch (e) {
      logger.error('memory', 'Failed to log remote message', e?.message);
    }

    // Ensure LangGraph thread exists
    try {
      const threadId = await ensureThread();
      const model = getModelForRun();

      // Generate stream ID
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      streamIdRef.current = streamId;
      streamContentRef.current = '';
      toolCallsRef.current = [];
      setCurrentStreamId(streamId);
      setStreamingContent('');
      setToolCalls([]);

      const result = await api.langgraphStreamMessage(threadId, `[Remote message] ${remoteMsg.content}`, {
        model,
        thinking: true,
        streamId,
      });
      if (result?.streamId && result.streamId !== streamIdRef.current) {
        streamIdRef.current = result.streamId;
        setCurrentStreamId(result.streamId);
      }
    } catch (error) {
      logger.error('chat', 'Remote response stream error', error?.message);
      await addChatMessage('assistant', `Error: ${error.message}`, true);
      setIsLoading(false);
      isRemoteResponseRef.current = false;
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }
  }, [ensureThread, getModelForRun]);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeRemoteChat(
      () => {},
      (remoteMsg) => {
        sendRemoteResponse(remoteMsg);
      }
    );

    return () => unsubscribe();
  }, [uid, sendRemoteResponse]);

  // Send a message using LangGraph streaming
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || isLoading || !hasApi) return null;

    // Clear previous suggestions
    setSuggestions([]);

    // Save user message to Firestore
    await addChatMessage('user', message);
    setIsLoading(true);

    // Log user message to memory
    try {
      const { minifyChatText, getChunkFilename, formatLogPrefix } = await import('../lib/memory.js');
      const chunkFile = getChunkFilename();
      const entry = formatLogPrefix('user') + ' ' + minifyChatText(message);
      await api.memoryAppendLog(chunkFile, entry);
    } catch (e) {
      logger.error('memory', 'Failed to log user message', e?.message);
    }

    // Refresh files in context
    await loadSelectedFiles();

    // Ensure LangGraph thread exists
    try {
      const threadId = await ensureThread();
      const model = getModelForRun();

      // Generate stream ID
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      streamIdRef.current = streamId;
      streamContentRef.current = '';
      toolCallsRef.current = [];
      setCurrentStreamId(streamId);
      setStreamingContent('');
      setToolCalls([]);

      // Prepend skill directive based on selected modality
      let actualMessage = message;
      const skillName = MODALITY_SKILL_MAP[modality];
      if (skillName) {
        actualMessage = `[Use skill: ${skillName}] ${message}`;
      } else if (modality === 'plan') {
        actualMessage = `[Plan mode] ${message}`;
      }

      // Stream via LangGraph IPC bridge
      const result = await api.langgraphStreamMessage(threadId, actualMessage, {
        model,
        thinking: true,
        plan_mode: modality === 'plan',
        streamId,
      });
      if (result?.streamId && result.streamId !== streamIdRef.current) {
        streamIdRef.current = result.streamId;
        setCurrentStreamId(result.streamId);
      }
    } catch (error) {
      logger.error('chat', 'Stream initiation error', error?.message);
      await addChatMessage('assistant', `Error: ${error.message}`, true);
      setIsLoading(false);
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }

    return null;
  }, [isLoading, modality, loadSelectedFiles, ensureThread, getModelForRun]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    try {
      await clearChatMessages();
      setMessages([]);
      setTokenUsage(null);
      setStreamingContent('');
      setToolCalls([]);
      toolCallsRef.current = [];
      // Reset thread so a new one is created next time
      threadIdRef.current = null;
      // Reset modality to default
      setModality('chat');
      // Clear suggestions
      setSuggestions([]);
    } catch (error) {
      logger.error('chat', 'Failed to clear history', error?.message);
    }
  }, []);

  // Approve a pending destructive tool confirmation
  const approveToolConfirmation = useCallback(async () => {
    const confirmation = pendingToolConfirmation;
    if (!confirmation || !hasApi) return;

    setPendingToolConfirmation(null);

    try {
      const threadId = threadIdRef.current;
      if (!threadId) {
        logger.error('chat', 'Cannot approve tool -- no thread');
        setIsLoading(false);
        return;
      }

      const model = getModelForRun();

      // Generate new stream ID for the resumed run
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      streamIdRef.current = streamId;
      streamContentRef.current = '';
      toolCallsRef.current = [];
      setCurrentStreamId(streamId);
      setStreamingContent('');
      setToolCalls([]);

      const result = await api.langgraphResumeRun(threadId, {
        approved: true,
        summary: confirmation.summary,
      }, { model, thinking: true, streamId });
      if (result?.streamId && result.streamId !== streamIdRef.current) {
        streamIdRef.current = result.streamId;
        setCurrentStreamId(result.streamId);
      }
    } catch (error) {
      logger.error('chat', 'Failed to approve tool', error?.message);
      await addChatMessage('assistant', `Error resuming after approval: ${error.message}`, true);
      setIsLoading(false);
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }
  }, [pendingToolConfirmation, getModelForRun]);

  // Reject a pending destructive tool confirmation
  const rejectToolConfirmation = useCallback(async () => {
    const confirmation = pendingToolConfirmation;
    if (!confirmation || !hasApi) return;

    setPendingToolConfirmation(null);

    try {
      const threadId = threadIdRef.current;
      if (!threadId) {
        logger.error('chat', 'Cannot reject tool -- no thread');
        setIsLoading(false);
        return;
      }

      const model = getModelForRun();

      // Generate new stream ID for the resumed run
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      streamIdRef.current = streamId;
      streamContentRef.current = '';
      toolCallsRef.current = [];
      setCurrentStreamId(streamId);
      setStreamingContent('');
      setToolCalls([]);

      const result = await api.langgraphResumeRun(threadId, {
        approved: false,
        summary: confirmation.summary,
      }, { model, thinking: true, streamId });
      if (result?.streamId && result.streamId !== streamIdRef.current) {
        streamIdRef.current = result.streamId;
        setCurrentStreamId(result.streamId);
      }
    } catch (error) {
      logger.error('chat', 'Failed to reject tool', error?.message);
      await addChatMessage('assistant', `Error resuming after rejection: ${error.message}`, true);
      setIsLoading(false);
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }
  }, [pendingToolConfirmation, getModelForRun]);

  // Refresh files in context
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
    modality,
    setModality,
    suggestions,
    suggestionsEnabled,
    setSuggestionsEnabled,
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
