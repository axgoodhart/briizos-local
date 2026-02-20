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
import { useChatSettings } from '../context/ChatSettingsContext';
import { useTools } from '../context/ToolContext';
import { useAppContext } from './useAppContext';
import { buildSystemPrompt } from '../lib/systemPrompt';
import { formatAppContext } from '../lib/contextProvider';
import { getToolDefinitions } from '../lib/tools';
import { enqueueToolJob } from '../lib/agentJobsFirestore';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && window.api;

// Valid tool names for parsing
const VALID_TOOLS = [
  'getScheduleSummary', 'searchNotes', 'findScheduleConflicts', 'lookupOnline',
  'openPanel', 'startTimer', 'tilePanels', 'createPrioritizedTaskList',
  'createSingleCalendarEvent', 'updateCalendarEvent', 'createRecurringCalendarEvent',
  'createThoughtStream', 'createNotePanel', 'setPanelColor', 'updateNoteContent',
  'movePanel', 'resizePanel', 'setPanelTitle', 'duplicatePanel', 'deletePanel',
  'minimizePanel', 'restorePanel', 'groupPanelsByType', 'stackPanelsVertically',
  'focusMode', 'closeAllPanels', 'minimizeAllPanels', 'completeTask',
  // Agent tools
  'agentReadFile', 'agentWriteFile', 'agentDeleteFile',
  'agentMoveFile', 'agentCopyFile', 'agentListDir',
  'runCommand',
  'openCanvas', 'updateCanvas', 'listCanvases', 'loadCanvas',
  'updateAgentMemory',
];

function parseToolCallObject(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (
      parsed
      && typeof parsed === 'object'
      && parsed.tool
      && VALID_TOOLS.includes(parsed.tool)
      && parsed.params
      && typeof parsed.params === 'object'
      && !Array.isArray(parsed.params)
    ) {
      return { tool: parsed.tool, params: parsed.params };
    }
  } catch (e) {
    logger.debug('chat', 'Failed to parse tool call JSON', e?.message);
  }
  return null;
}

function extractTopLevelJsonObjects(text, limit = 8) {
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push({
          raw: text.slice(start, i + 1),
          start,
          end: i + 1,
        });
        start = -1;
        if (objects.length >= limit) break;
      }
    }
  }

  return objects;
}

function parseToolCalls(text) {
  const toolCalls = [];
  let cleanText = text;

  // 1) Parse fenced JSON blocks
  const fencedMatches = [];
  const fencedRegex = /```json\s*([\s\S]*?)```/gi;
  let match;
  while ((match = fencedRegex.exec(text)) !== null) {
    fencedMatches.push({
      full: match[0],
      json: match[1],
      index: match.index,
    });
  }

  for (const fenced of fencedMatches) {
    const parsed = parseToolCallObject(fenced.json);
    if (parsed) {
      toolCalls.push(parsed);
      cleanText = cleanText.replace(fenced.full, '');
    }
  }

  // 2) Parse if full message is a raw JSON tool call (no markdown fence)
  const trimmed = cleanText.trim();
  const fullParsed = parseToolCallObject(trimmed);
  if (fullParsed) {
    toolCalls.push(fullParsed);
    return { toolCalls, cleanText: '' };
  }

  // 3) Parse top-level JSON objects embedded in text
  const candidates = extractTopLevelJsonObjects(cleanText);
  const validCandidates = [];
  for (const candidate of candidates) {
    const parsed = parseToolCallObject(candidate.raw);
    if (parsed) {
      validCandidates.push({ ...candidate, parsed });
    }
  }

  if (validCandidates.length > 0) {
    // Remove from end to preserve indexes
    for (let i = validCandidates.length - 1; i >= 0; i--) {
      const candidate = validCandidates[i];
      cleanText = cleanText.slice(0, candidate.start) + cleanText.slice(candidate.end);
    }
    toolCalls.push(...validCandidates.map(c => c.parsed));
  }

  return { toolCalls, cleanText };
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [tokenUsage, setTokenUsage] = useState(null);
  const [filesInContext, setFilesInContext] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState(null);

  const streamContentRef = useRef('');
  const streamIdRef = useRef(null);
  const isRemoteResponseRef = useRef(false);

  // Contexts
  const { provider, currentSettings } = useChatSettings();
  const { executeTool } = useTools();
  const appContext = useAppContext();

  // Keep refs for values used inside IPC listeners (avoids effect re-runs)
  const executeToolRef = useRef(executeTool);
  const appContextRef = useRef(appContext);
  useEffect(() => { executeToolRef.current = executeTool; }, [executeTool]);
  useEffect(() => { appContextRef.current = appContext; }, [appContext]);

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

    // Build system prompt + context (same flow as sendMessage)
    const latestFiles = await loadSelectedFiles();
    const toolDefs = getToolDefinitions();
    const appContextStr = formatAppContext(appContextRef.current);

    let fileContextStr = '';
    const filesToUse = latestFiles && latestFiles.length > 0 ? latestFiles : filesInContext;
    if (filesToUse.length > 0) {
      const fileContents = [];
      for (const file of filesToUse) {
        try {
          const result = await api.readFile(file.path);
          if (result && !result.error) {
            fileContents.push(`=== ${file.name} ===\n${result.content}\n=== END ===`);
          }
        } catch (e) { logger.debug('chat', 'Failed to read file for context', e?.message); }
      }
      if (fileContents.length > 0) {
        fileContextStr = '\n\nFiles in context:\n' + fileContents.join('\n\n');
      }
    }

    let memoryContext = null;
    try { memoryContext = await api.memoryGetContext(); } catch (e) { logger.debug('memory', 'Failed to get memory context', e?.message); }

    const systemPrompt = buildSystemPrompt(toolDefs, appContextStr, fileContextStr, memoryContext);
    const customPrompt = currentSettings.prompt;
    const effectiveSystemPrompt = (customPrompt && customPrompt.trim()) ? customPrompt : systemPrompt;

    const recentHistory = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    const apiMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...recentHistory,
      { role: 'user', content: `[Remote message] ${remoteMsg.content}` },
    ];

    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    streamIdRef.current = streamId;
    streamContentRef.current = '';
    setCurrentStreamId(streamId);
    setStreamingContent('');

    const model = currentSettings.model;
    const params = currentSettings.params || {};

    try {
      await api.streamChat(streamId, apiMessages, provider, model, params);
    } catch (error) {
      logger.error('chat', 'Remote response stream error', error?.message);
      await addChatMessage('assistant', `Error: ${error.message}`, true);
      setIsLoading(false);
      isRemoteResponseRef.current = false;
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }
  }, [messages, filesInContext, loadSelectedFiles, provider, currentSettings]);

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

  // Set up stream listeners — register once, use refs for latest values
  useEffect(() => {
    if (!hasApi) return;

    const cleanupChunk = api.onStreamChunk((data) => {
      if (data.streamId !== streamIdRef.current) return;

      if (data.type === 'text') {
        streamContentRef.current += data.chunk;
        setStreamingContent(streamContentRef.current);
      }
    });

    const cleanupDone = api.onStreamDone(async (data) => {
      if (data.streamId !== streamIdRef.current) return;

      const fullContent = streamContentRef.current;

      // Parse for tool calls
      const { toolCalls, cleanText } = parseToolCalls(fullContent);
      logger.debug('chat', 'Stream done, tool calls found', `${toolCalls.length}: ${toolCalls.map(t => t.tool).join(', ')}`);
      if (toolCalls.length > 0) {
        logger.debug('chat', 'Content lengths', `raw: ${fullContent.length} | clean: ${cleanText.trim().length}`);
      }

      // Save assistant message to Firestore
      const displayContent = cleanText.trim() || (toolCalls.length > 0 ? `_Using ${toolCalls.map(t => t.tool).join(', ')}..._` : fullContent);
      await addChatMessage('assistant', displayContent);

      // Log assistant message to memory
      try {
        const { minifyChatText, getChunkFilename, formatLogPrefix } = await import('../lib/memory.js');
        const chunkFile = getChunkFilename();
        const entry = formatLogPrefix('assistant') + ' ' + minifyChatText(fullContent);
        await api.memoryAppendLog(chunkFile, entry);
      } catch (e) {
        logger.error('memory', 'Failed to log assistant message', e?.message);
      }

      // Enqueue tool calls for autonomous worker execution
      for (const tc of toolCalls) {
        addLog('tool_call', `${tc.tool} ${JSON.stringify(tc.params)}`.slice(0, 800))
          .catch(err => logger.debug('chat', 'Failed to write tool_call log', err?.message));

        logger.debug('chat', `Queueing tool: ${tc.tool}`, JSON.stringify(tc.params).substring(0, 200));
        try {
          const queued = await enqueueToolJob(tc.tool, tc.params, {
            uid: getCurrentUid() || undefined,
            source: {
              kind: 'chat-tool-call',
              streamId: data.streamId,
              remoteReply: isRemoteResponseRef.current,
            },
          });
          logger.debug('chat', `Tool queued: ${tc.tool}`, queued.id);
        } catch (error) {
          logger.error('chat', `Tool queue error: ${tc.tool}`, error?.message);
          await addChatMessage('assistant', `[Error: ${tc.tool}] ${error?.message || 'Failed to queue job'}`, true);
          addLog('tool_error', `${tc.tool}: ${error?.message || 'Failed to queue job'}`.slice(0, 1200))
            .catch(err => logger.debug('chat', 'Failed to write tool_error log', err?.message));
        }
      }

      // If this was a response to a remote message, write back to remote chat
      if (isRemoteResponseRef.current) {
        try {
          await addRemoteChatMessage('assistant', displayContent);
        } catch (e) {
          logger.error('chat', 'Failed to write remote response', e?.message);
        }
        isRemoteResponseRef.current = false;
      }

      // Reset streaming state
      streamContentRef.current = '';
      streamIdRef.current = null;
      setStreamingContent('');
      setCurrentStreamId(null);
      setIsLoading(false);
    });

    const cleanupError = api.onStreamError(async (data) => {
      if (data.streamId !== streamIdRef.current) return;

      await addChatMessage('assistant', `Error: ${data.error}`, true);

      isRemoteResponseRef.current = false;
      streamContentRef.current = '';
      streamIdRef.current = null;
      setStreamingContent('');
      setCurrentStreamId(null);
      setIsLoading(false);
    });

    return () => {
      cleanupChunk();
      cleanupDone();
      cleanupError();
    };
  }, []); // empty deps — listeners registered once, use refs for latest values

  // Send a message using streaming
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || isLoading || !hasApi) return null;

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
    const latestFiles = await loadSelectedFiles();

    // Build system prompt with tools + context
    const toolDefs = getToolDefinitions();
    const appContextStr = formatAppContext(appContextRef.current);

    // Build file context string
    let fileContextStr = '';
    const filesToUse = latestFiles && latestFiles.length > 0 ? latestFiles : filesInContext;
    if (filesToUse.length > 0) {
      const fileContents = [];
      for (const file of filesToUse) {
        try {
          const result = await api.readFile(file.path);
          if (result && !result.error) {
            fileContents.push(`=== ${file.name} ===\n${result.content}\n=== END ===`);
          }
        } catch (e) { logger.debug('chat', 'Failed to read file for context', e?.message); }
      }
      if (fileContents.length > 0) {
        fileContextStr = '\n\nFiles in context:\n' + fileContents.join('\n\n');
      }
    }

    // Fetch memory context
    let memoryContext = null;
    try {
      memoryContext = await api.memoryGetContext();
    } catch (e) { logger.debug('memory', 'Failed to get memory context', e?.message); }

    const systemPrompt = buildSystemPrompt(toolDefs, appContextStr, fileContextStr, memoryContext);

    // Use custom prompt override if set
    const customPrompt = currentSettings.prompt;
    const effectiveSystemPrompt = (customPrompt && customPrompt.trim())
      ? customPrompt
      : systemPrompt;

    // Build messages array
    const recentHistory = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    const apiMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...recentHistory,
      { role: 'user', content: message },
    ];

    // Generate stream ID
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    streamIdRef.current = streamId;
    streamContentRef.current = '';
    setCurrentStreamId(streamId);
    setStreamingContent('');

    // Start streaming
    const model = currentSettings.model;
    const params = currentSettings.params || {};

    try {
      await api.streamChat(streamId, apiMessages, provider, model, params);
    } catch (error) {
      logger.error('chat', 'Stream initiation error', error?.message);
      await addChatMessage('assistant', `Error: ${error.message}`, true);
      setIsLoading(false);
      streamIdRef.current = null;
      setCurrentStreamId(null);
    }

    return null;
  }, [isLoading, messages, filesInContext, loadSelectedFiles, provider, currentSettings]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    try {
      await clearChatMessages();
      setMessages([]);
      setTokenUsage(null);
      setStreamingContent('');
    } catch (error) {
      logger.error('chat', 'Failed to clear history', error?.message);
    }
  }, []);

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
    sendMessage,
    clearHistory,
    loadHistory: () => {},
    checkConfig,
    refreshFilesInContext,
  };
}

export default useChat;
