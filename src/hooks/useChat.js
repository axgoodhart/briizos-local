import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import ChatAPI from '../lib/chat-api';
import SystemPrompt from '../lib/system-prompt';
import BriizTools from '../lib/briizos-tools';
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
const hasApi = typeof window !== 'undefined' && window.api;

const MODEL_STORAGE_KEY = 'briizos-selected-model';

const MODALITY_SKILL_MAP = {
  chat: null,
  research: 'deep-research',
  code: 'frontend-design',
  report: 'consulting-analysis',
  plan: null,
};

const FILE_CONTEXT_TOOL_CAPABILITIES = [
  '- `agentReadFile(path)`: Read file contents (subject to blacklist rules).',
  '- `agentListDir(path)`: List directory contents (subject to blacklist rules).',
  '- `agentWriteFile(path, content, opId?)`: Create/overwrite files.',
  '- `agentCopyFile(source, destination, opId?)`: Copy files or folders.',
  '- `agentMoveFile(source, destination, opId?)`: Move/rename files.',
  '- `agentDeleteFile(path, opId?)`: Delete files or folders.',
  '- `runCommand(command, cwd?, opId?)`: Run shell commands when needed.'
];

function buildFileContextAddendum(files = []) {
  if (!Array.isArray(files) || files.length === 0) return '';
  const lines = files
    .map((file) => file?.path)
    .filter(Boolean)
    .map((filePath) => `- ${filePath}`);
  if (lines.length === 0) return '';

  return [
    'Pinned filesystem context from the user:',
    ...lines,
    '',
    'Capabilities available for working with these paths (tools):',
    ...FILE_CONTEXT_TOOL_CAPABILITIES,
    '',
    'Prefer direct path-based tool calls when the user asks to inspect or modify pinned files.'
  ].join('\n');
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
  const [pendingToolConfirmation] = useState(null);
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

  const streamContentRef = useRef('');
  const toolCallsRef = useRef([]);
  const selectedModelRef = useRef(selectedModel || null);
  // Mirror suggestionsEnabled into a ref so sendMessage's stable closure
  // always reads the current value (otherwise toggling mid-session would
  // not reach the next request).
  const suggestionsEnabledRef = useRef(suggestionsEnabled);

  const chatAPIRef = useRef(null);
  const briizToolsRef = useRef(null);

  useEffect(() => {
    chatAPIRef.current = new ChatAPI();
    window.systemPrompt = new SystemPrompt();
    briizToolsRef.current = new BriizTools();
    window.briizTools = briizToolsRef.current;
  }, []);

  useEffect(() => { selectedModelRef.current = selectedModel || null; }, [selectedModel]);

  useEffect(() => {
    try {
      localStorage.setItem('briizos-suggestions-enabled', JSON.stringify(suggestionsEnabled));
    } catch {}
    // Keep the ref in sync for sendMessage's stable closure.
    suggestionsEnabledRef.current = suggestionsEnabled;
    // When the user turns suggestions OFF, immediately drop any chips
    // currently on screen so the toggle feels responsive.
    if (!suggestionsEnabled) {
      setSuggestions([]);
    }
  }, [suggestionsEnabled]);

  const uid = getCurrentUid();

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeChatMessages((firestoreMessages) => setMessages(firestoreMessages));
    return () => unsubscribe();
  }, [uid]);

  const checkConfig = useCallback(async () => {
    if (!hasApi) return;
    try {
      if (typeof api.isAIConfigured !== 'function') {
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
      const normalized = files.map((f) => ({ name: f.file_name, path: f.file_path }));
      setFilesInContext(normalized);
      return normalized;
    } catch (error) {
      logger.error('chat', 'Failed to load selected files', error?.message);
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

  const parseProviderFromModel = useCallback((modelName) => {
    if (!modelName) return 'gemini';
    const m = String(modelName).toLowerCase();
    if (m.includes('claude')) return 'claude';
    if (m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('openai')) return 'openai';
    if (m.includes('gemini')) return 'gemini';
    return 'gemini';
  }, []);

  const executeToolCall = useCallback(async (toolCall) => {
    const tc = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: toolCall.tool,
      args: toolCall.params || {},
      status: 'running',
    };
    toolCallsRef.current = [...toolCallsRef.current, tc];
    setToolCalls([...toolCallsRef.current]);

    try {
      const result = await briizToolsRef.current.execute(toolCall.tool, toolCall.params || {});
      toolCallsRef.current = toolCallsRef.current.map((t) => (t.id === tc.id ? { ...t, status: 'done', result } : t));
      setToolCalls([...toolCallsRef.current]);
      return result;
    } catch (error) {
      // A margerin 💬 ("return to chat for refinement") is NOT a
      // failure — it's a deliberate user decision to keep discussing
      // the call in the chat instead of running it. Mark the tool
      // card as 'returned' so the UI shows a subtle neutral state
      // instead of a red failure, and rethrow so the stream consumer
      // can skip the "[Tool failed: ...]" append below.
      const returnedToChat = Boolean(error?.__returnedToChat);
      toolCallsRef.current = toolCallsRef.current.map((t) =>
        t.id === tc.id
          ? {
              ...t,
              status: returnedToChat ? 'returned' : 'failed',
              error: error?.message,
            }
          : t,
      );
      setToolCalls([...toolCallsRef.current]);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (message, { isRemote = false } = {}) => {
    if (!message?.trim() || isLoading || !chatAPIRef.current) return null;

    setSuggestions([]);
    await addChatMessage('user', message);
    setIsLoading(true);

    try {
      let actualMessage = message;
      const skillName = MODALITY_SKILL_MAP[modality];
      if (skillName) actualMessage = `[Use skill: ${skillName}] ${message}`;
      else if (modality === 'plan') actualMessage = `[Plan mode] ${message}`;
      const selectedFiles = await loadSelectedFiles();
      const fileContextAddendum = buildFileContextAddendum(selectedFiles);

      const model = getSelectedModel() || 'gemini-2.5-flash';
      const provider = parseProviderFromModel(model);

      const streamId = `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCurrentStreamId(streamId);
      streamContentRef.current = '';
      setStreamingContent('');
      toolCallsRef.current = [];
      setToolCalls([]);

      const chatHistory = [...messages, { role: 'user', content: actualMessage }]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      // Don't ask for suggestions on relayed remote messages — the chips
      // are a UI affordance for the local interactive user only.
      const wantSuggestions = suggestionsEnabledRef.current && !isRemote;

      for await (const chunk of chatAPIRef.current.streamChat(
        chatHistory,
        provider,
        model,
        null,
        { suggestionsEnabled: wantSuggestions, contextAddendum: fileContextAddendum },
      )) {
        if (typeof chunk === 'string') {
          streamContentRef.current += chunk;
          setStreamingContent(streamContentRef.current);
        } else if (chunk && chunk.type === 'tool_call') {
          try {
            const result = await executeToolCall(chunk);
            const resultText = typeof result === 'string' ? result : (result?.summary || result?.message || JSON.stringify(result));
            streamContentRef.current += `\n\n[Tool executed: ${chunk.tool}]\n${resultText}`;
            setStreamingContent(streamContentRef.current);
          } catch (err) {
            // Returning the call to chat via the margerin 💬 icon is a
            // first-class user choice, not a failure. Leave the stream
            // text untouched — InteractionPanel's onChatReturn handler
            // will instead prepend a "re:" quote and refocus the
            // textarea so the user can discuss/refine the call.
            if (err && err.__returnedToChat) {
              // intentionally no-op on the streaming content
            } else {
              streamContentRef.current += `\n\n[Tool failed: ${chunk.tool}] ${err?.message || 'Unknown error'}`;
              setStreamingContent(streamContentRef.current);
            }
          }
        } else if (chunk && chunk.type === 'suggestions') {
          // Only update if the toggle is still on by the time the chunk
          // arrives — guards against the user flipping the switch off
          // mid-stream.
          if (suggestionsEnabledRef.current && Array.isArray(chunk.items) && chunk.items.length > 0) {
            setSuggestions(chunk.items);
          }
        }
      }

      if (streamContentRef.current) {
        await addChatMessage('assistant', streamContentRef.current);
        if (isRemote) {
          await addRemoteChatMessage('assistant', streamContentRef.current);
        }
        addLog('assistant_message', streamContentRef.current.slice(0, 1200)).catch(() => {});
      }

      setThreadTitle((prev) => prev || message.slice(0, 60));
    } catch (error) {
      logger.error('chat', 'Direct API stream failed', error?.message);
      await addChatMessage('assistant', `Error: ${error?.message || 'Unknown error'}`, true);
    } finally {
      setIsLoading(false);
      setCurrentStreamId(null);
      setStreamingContent('');
      streamContentRef.current = '';
    }

    return null;
  }, [isLoading, messages, modality, getSelectedModel, parseProviderFromModel, executeToolCall, loadSelectedFiles]);

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
      (remoteMsg) => {
        sendRemoteResponse(remoteMsg);
      }
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
      setModality('chat');
      setSuggestions([]);
      setThreadTitle(null);
    } catch (error) {
      logger.error('chat', 'Failed to clear history', error?.message);
    }
  }, []);

  const refreshFilesInContext = useCallback(async () => {
    await loadSelectedFiles();
  }, [loadSelectedFiles]);

  const approveToolConfirmation = useCallback(async () => {}, []);
  const rejectToolConfirmation = useCallback(async () => {}, []);

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
