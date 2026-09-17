import { useBriizyConversation, claimBriizyRequest, reportBriizyResponse } from '../lib/briizyConversation';
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, Component } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat, threadKindForModality } from '../hooks/useChat';
import { useChatSettings } from '../context/ChatSettingsContext';
import { useTools } from '../context/ToolContext';
import ConfirmationToast from './ConfirmationToast';
import { onChatReturn } from '../lib/bfast-queue';
import { formatMargerinLabel } from '../lib/bfast-format';
import { SOURCE_FILE_TYPE } from './FileTree';
import logger from '../lib/logger';
import { CHAT_BACKGROUNDS } from '../lib/chatBackgrounds';
import { syncThemeTokensIntoFrame } from '../lib/backgroundFrame';
import { useModelSelection } from '../hooks/useModelSelection';
import ModelPicker from './ModelPicker';
import ConversationBrowser, {
  CONVERSATION_DATE_BUCKETS,
  conversationDateRange,
  conversationDateCounts,
} from './ConversationBrowser';
import '../AppCombined.css';

// 'prioritize' left the chat surface: it now lives in the Tasks Panel
// as briizify (see components/briizify/BriizifySection.jsx).
const MODALITIES = [
  { id: 'planner', label: 'Day' },
  { id: 'chat', label: 'Chat' },
  { id: 'research', label: 'Research' },
  { id: 'code', label: 'Code' },
  { id: 'report', label: 'Report' }
];

const EMPTY_CONVERSATION_TOTALS = { all: 0, today: 0, week: 0, month: 0, earlier: 0 };

const TOOL_NAME_REGEX = '[A-Za-z][A-Za-z0-9_]*';

function parseToolCallJson(text) {
  const trimmed = text.trim();

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1]);
      if (parsed?.tool && parsed?.params && typeof parsed.params === 'object') {
        return {
          tool: parsed.tool,
          params: parsed.params,
          remainingText: trimmed.replace(fencedMatch[0], '').trim(),
        };
      }
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.tool && parsed?.params && typeof parsed.params === 'object') {
      return { tool: parsed.tool, params: parsed.params, remainingText: '' };
    }
  } catch {
    // no-op
  }

  return null;
}

function classifyAssistantMessage(content) {
  const trimmed = (content || '').trim();

  const toolErrorRegex = new RegExp(`^\\[Error:\\s*(${TOOL_NAME_REGEX})\\]\\s*([\\s\\S]*)$`, 'i');
  const errorMatch = trimmed.match(toolErrorRegex);
  if (errorMatch) {
    return {
      type: 'tool-error',
      tool: errorMatch[1],
      body: errorMatch[2]?.trim() || '',
    };
  }

  const toolResultRegex = new RegExp(`^\\[(${TOOL_NAME_REGEX})\\]\\s*([\\s\\S]*)$`);
  const resultMatch = trimmed.match(toolResultRegex);
  if (resultMatch) {
    return {
      type: 'tool-result',
      tool: resultMatch[1],
      body: resultMatch[2]?.trim() || '',
    };
  }

  const parsedCall = parseToolCallJson(trimmed);
  if (parsedCall) {
    return {
      type: 'tool-call',
      tool: parsedCall.tool,
      params: parsedCall.params,
      body: parsedCall.remainingText,
    };
  }

  return { type: 'normal', body: content };
}

// Legacy prioritize threads embedded a machine-readable HTML comment;
// keep stripping it from rendered/copied content so old history stays clean.
const PRIORITY_ORDER_COMMENT = /<!--\s*briizos-priority-order:\s*(\[[\s\S]*?\])\s*-->/i;

function visiblePriorityContent(content) {
  return String(content || '').replace(PRIORITY_ORDER_COMMENT, '').trim();
}

function InteractionPanel({ showPanelBackground = true }) {
  const { provider, setProvider, currentSettings, chatBackground, setChatBackground, chatBgBlur, setChatBgBlur, getThemeChatBackground } = useChatSettings();
  const { models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus, loading: modelsLoading } = useModelSelection();
  const selectedProfile = models.find((model) => model.name === selectedModel) || null;
  const selectedRequestSettings = selectedProfile?.provider === provider ? currentSettings?.params : null;
  const {
    messages,
    isLoading,
    isSwitchingThread,
    isConfigured,
    filesInContext,
    streamingContent,
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
    threadId,
    threadTags,
    openThread,
    startNewConversation,
    syncThreadTags,
    sendMessage,
    clearHistory,
    refreshFilesInContext,
    approveToolConfirmation,
    rejectToolConfirmation,
  } = useChat({ selectedModel, requestSettings: selectedRequestSettings });

  const briizyRequest = useBriizyConversation();
  useEffect(() => {
    if (briizyRequest.status !== 'queued' || isLoading || isSwitchingThread || modelsLoading || pendingToolConfirmation) return;
    if (!selectedModel) {
      reportBriizyResponse(briizyRequest.id, { status: 'error', response: 'Choose an available model in Chats, then send your message again.' });
      return;
    }
    if (!claimBriizyRequest(briizyRequest.id)) return;
    const id = briizyRequest.id;
    const message = briizyRequest.notes
      ? `${briizyRequest.message}\n\n[Briizy response preferences supplied by the user]\n${briizyRequest.notes}`
      : briizyRequest.message;
    sendMessage(message, { onResponse: update => reportBriizyResponse(id, update) })
      .catch(error => reportBriizyResponse(id, { status: 'error', response: error.message }));
  }, [briizyRequest, isLoading, isSwitchingThread, modelsLoading, selectedModel, pendingToolConfirmation, sendMessage]);

  const lgStatus = 'running';
  const lgReady = true;
  // Resolve theme-specific chat background
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'default';
    }
    return 'default';
  });
  const [resolvedChatBg, setResolvedChatBg] = useState(chatBackground);
  const [resolvedChatBgBlur, setResolvedChatBgBlur] = useState(chatBgBlur);
  const bgIframeRef = useRef(null);

  useEffect(() => {
    if (selectedProfile?.provider && selectedProfile.provider !== provider) {
      setProvider(selectedProfile.provider);
    }
  }, [selectedProfile?.provider, provider, setProvider]);

  // Theme-token sync into the background iframe lives in
  // lib/backgroundFrame.js, shared with the ambient full-window background.
  const syncThemeTokensToIframe = useCallback(() => {
    syncThemeTokensIntoFrame(bgIframeRef.current);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'default';
      setActiveTheme(theme);
      syncThemeTokensToIframe();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [syncThemeTokensToIframe]);

  useEffect(() => {
    const themeEntry = getThemeChatBackground?.(activeTheme);
    if (themeEntry && themeEntry.background) {
      setResolvedChatBg(themeEntry.background);
      setResolvedChatBgBlur(themeEntry.blur ?? 0);
    } else {
      setResolvedChatBg(chatBackground);
      setResolvedChatBgBlur(chatBgBlur);
    }
  }, [activeTheme, chatBackground, chatBgBlur, getThemeChatBackground]);

  // When user picks a bg from the InteractionPanel picker, also save to theme mapping
  const handleChatBgSelect = useCallback((bgValue) => {
    setChatBackground(bgValue);
    setShowBgPicker(false);
  }, [setChatBackground]);
  const { pendingConfirmation, confirmAction, cancelAction } = useTools();
  const [inputValue, setInputValue] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { index, role, x, y }
  const [showBgPicker, setShowBgPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const confirmationPanelRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ---- Toolbar section: a two-mode surface (models / conversations) --------
  // The segmented switch is the shared header row. It owns the open state that
  // the model picker's trigger used to own, so both modes open and close the
  // same way and the panel has exactly one expansion owner.
  const [toolbarMode, setToolbarMode] = useState('models');
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationTotals, setConversationTotals] = useState(EMPTY_CONVERSATION_TOTALS);
  const [tagVocabulary, setTagVocabulary] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationFacet, setConversationFacet] = useState('all');
  const [conversationTagFilter, setConversationTagFilter] = useState([]);
  const [conversationDateBucket, setConversationDateBucket] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [threadsRevision, setThreadsRevision] = useState(0);
  const toolbarRef = useRef(null);
  const browserOpenedRef = useRef(false);
  const lastFilterSignatureRef = useRef(null);
  const conversationsRef = useRef([]);
  const previewThreadRef = useRef(null);
  const conversationKind = threadKindForModality(modality);
  const conversationsActive = toolbarExpanded && toolbarMode === 'conversations';
  const modelsActive = toolbarExpanded && toolbarMode === 'models';
  const modelDisplayName = selectedProfile?.display_name || selectedModel || 'Select model';

  useEffect(() => {
    if (!pendingToolConfirmation) return undefined;
    const frame = requestAnimationFrame(() => confirmationPanelRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pendingToolConfirmation]);

  useEffect(() => {
    const openPlanner = (event) => {
      const date = event.detail?.date;
      setModality('planner');
      setCollapsed(false);
      setInputValue(date
        ? `Help me think through ${date}. `
        : 'Help me think through my day. ');
      requestAnimationFrame(() => textareaRef.current?.focus());
    };
    window.addEventListener('briizos-open-planner-chat', openPlanner);
    return () => window.removeEventListener('briizos-open-planner-chat', openPlanner);
  }, [setModality]);

  // Drop zone for dragging source files into chat
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: SOURCE_FILE_TYPE,
    drop: async (item) => {
      try {
        await window.api.localData.selectedFiles.add({
          path: item.path,
          displayName: item.name,
          kind: 'file',
          purpose: 'chat',
        });
        await refreshFilesInContext();
      } catch (error) {
        logger.error('chat', 'Failed to add file to context', error?.message);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // Remove a file from context
  const handleRemoveFromContext = useCallback(async (fileId) => {
    try {
      await window.api.localData.selectedFiles.remove(fileId, 'chat');
      await refreshFilesInContext();
    } catch (error) {
      logger.error('chat', 'Failed to remove file from context', error?.message);
    }
  }, [refreshFilesInContext]);

  // ---- Conversation browser: data, subscription, and actions --------------
  // ConversationBrowser is presentational. The query, the tag vocabulary, the
  // preview transcript, the change subscription, and every log entry live here,
  // so there is exactly one owner of each.
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadConversationVocabulary = useCallback(async () => {
    try {
      const rows = await window.api.localData.threads.tags.list({ kind: conversationKind });
      setTagVocabulary(Array.isArray(rows) ? rows : []);
    } catch (error) {
      // A missing vocabulary only costs the Tags facet its rows. The list and
      // the preview still work, so this is deliberately not fatal.
      setTagVocabulary([]);
      logger.error('chat', 'Could not read the workspace tag list, so the Tags filter has nothing to offer. Conversations are still listed and can still be opened.', error?.message);
    }
  }, [conversationKind]);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const range = conversationDateRange(conversationDateBucket);
      const query = conversationSearch.trim();
      // The second read is the unfiltered list. Facet counts come from it so
      // the numbers keep saying what else is there instead of collapsing to
      // whatever the current filter already shows.
      const [rows, everything] = await Promise.all([
        window.api.localData.threads.list({
          kind: conversationKind,
          query: query || undefined,
          tags: conversationTagFilter.length > 0 ? conversationTagFilter : undefined,
          since: range.since,
          until: range.until,
        }),
        window.api.localData.threads.list({ kind: conversationKind }),
      ]);
      const listed = Array.isArray(rows) ? rows : [];
      const totals = conversationDateCounts(Array.isArray(everything) ? everything : []);
      setConversations(listed);
      setConversationTotals(totals);
      return { listed, totals };
    } catch (error) {
      setConversations([]);
      setConversationTotals(EMPTY_CONVERSATION_TOTALS);
      logger.error('chat', 'Could not read the saved conversation list, so the conversation browser is empty. Your conversations are untouched and reopening the browser tries again.', error?.message);
      return null;
    } finally {
      setConversationsLoading(false);
    }
  }, [conversationKind, conversationSearch, conversationTagFilter, conversationDateBucket]);

  useEffect(() => {
    if (!conversationsActive) return undefined;
    let active = true;
    loadConversationVocabulary();
    loadConversations().then((result) => {
      if (!active || !result) return;
      if (!browserOpenedRef.current) {
        browserOpenedRef.current = true;
        logger.info(
          'chat.browser_opened',
          `Conversation browser opened. ${result.totals.all} saved conversations are listed; opening one replaces what the chat panel shows but does not delete anything.`,
          { kind: conversationKind, listed: result.listed.length, total: result.totals.all },
        );
      }
      const query = conversationSearch.trim();
      const bucket = CONVERSATION_DATE_BUCKETS.find((entry) => entry.id === conversationDateBucket);
      const isFiltered = !!query || conversationTagFilter.length > 0 || !!conversationDateBucket;
      const signature = JSON.stringify([query, conversationTagFilter, conversationDateBucket]);
      if (!isFiltered) {
        lastFilterSignatureRef.current = null;
        return;
      }
      // One entry per distinct filter, not one per background refresh.
      if (signature === lastFilterSignatureRef.current) return;
      lastFilterSignatureRef.current = signature;
      logger.debug(
        'chat.browser_filtered',
        `Filter applied — search "${query}", tags [${conversationTagFilter.join(', ')}], date bucket "${bucket ? bucket.label.toLowerCase() : 'any'}". ${result.listed.length} of ${result.totals.all} conversations match.`,
        {
          kind: conversationKind,
          query,
          tags: conversationTagFilter,
          dateBucket: conversationDateBucket,
          matched: result.listed.length,
          total: result.totals.all,
        },
      );
    });
    return () => { active = false; };
  }, [
    conversationsActive,
    threadsRevision,
    conversationKind,
    conversationSearch,
    conversationTagFilter,
    conversationDateBucket,
    loadConversations,
    loadConversationVocabulary,
  ]);

  // Closing the browser arms the next "opened" entry, so reopening it is
  // reported while a background refresh is not.
  useEffect(() => {
    if (!conversationsActive) browserOpenedRef.current = false;
  }, [conversationsActive]);

  useEffect(() => {
    if (!conversationsActive || !selectedThreadId) {
      setPreviewMessages([]);
      return undefined;
    }
    let active = true;
    // Drop the previous transcript when the selection moves, so the preview
    // column never shows one conversation's messages under another's name. A
    // background refresh of the same conversation leaves it on screen instead
    // of blinking.
    if (previewThreadRef.current !== selectedThreadId) {
      previewThreadRef.current = selectedThreadId;
      setPreviewMessages([]);
    }
    window.api.localData.threads.messages.list(selectedThreadId)
      .then((rows) => {
        if (active) setPreviewMessages(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        if (active) setPreviewMessages([]);
        logger.error('chat', 'Could not read the previewed conversation, so the preview column is blank. The conversation itself is unchanged and can still be opened.', error?.message);
      });
    return () => { active = false; };
  }, [conversationsActive, selectedThreadId, threadsRevision]);

  // The browser refreshes from the same committed-change feed the rest of the
  // app uses, so new conversations, renames, and tag writes appear on their own.
  useEffect(() => {
    if (typeof window.api?.localData?.onChanged !== 'function') return undefined;
    return window.api.localData.onChanged((change) => {
      if (change?.domains?.includes('threads')) setThreadsRevision((revision) => revision + 1);
    });
  }, []);

  // Each mode reads its own thread kind, so a selection made against the
  // previous list would point at a conversation this one does not contain.
  useEffect(() => {
    setSelectedThreadId(null);
    setPreviewMessages([]);
  }, [conversationKind]);

  // The model can add tags mid-conversation; useChat sees that on the stream
  // before the database change event lands. Mirroring it keeps the open
  // conversation's row and tag strip current without a second read.
  useEffect(() => {
    if (!threadId || !Array.isArray(threadTags)) return;
    setConversations((rows) => rows.map((row) => (
      row.id === threadId ? { ...row, tags: threadTags } : row
    )));
  }, [threadId, threadTags]);

  const handleToolbarSegment = useCallback((mode) => {
    // The active segment collapses the section; an inactive one switches mode
    // and keeps it open.
    if (toolbarExpanded && toolbarMode === mode) {
      setToolbarExpanded(false);
      return;
    }
    setToolbarMode(mode);
    setToolbarExpanded(true);
  }, [toolbarExpanded, toolbarMode]);

  const collapseToolbar = useCallback(() => setToolbarExpanded(false), []);

  // The switch took over the open state the model picker's trigger used to
  // own, so the outside-click and Escape dismissals move here with it.
  useEffect(() => {
    if (!toolbarExpanded) return undefined;
    function handleClick(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) setToolbarExpanded(false);
    }
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      setToolbarExpanded(false);
      toolbarRef.current?.querySelector(`.interaction-toolbar-switch-segment.${toolbarMode}`)?.focus();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toolbarExpanded, toolbarMode]);

  // Picking a model closes the section, exactly as it did while the model
  // picker owned its own trigger.
  const handleSelectModel = useCallback((modelName) => {
    selectModel(modelName);
    setToolbarExpanded(false);
  }, [selectModel]);

  const handleOpenConversation = useCallback(async (conversationId) => {
    const row = conversationsRef.current.find((conversation) => conversation.id === conversationId);
    const title = row?.title?.trim() || 'Untitled conversation';
    try {
      const opened = await openThread(conversationId);
      const messageCount = Array.isArray(opened) ? opened.length : (row?.messageCount ?? 0);
      setToolbarExpanded(false);
      logger.info(
        'chat.conversation_opened',
        `Opened conversation "${title}" (${conversationId}). The chat panel now shows its ${messageCount} saved messages, and new messages continue this conversation instead of the previous one.`,
        { threadId: conversationId, title, messageCount },
      );
    } catch (error) {
      logger.error('chat', `Could not open the conversation "${title}". The chat panel still shows the conversation you were already in, and nothing was lost.`, error?.message);
    }
  }, [openThread]);

  const handleNewConversation = useCallback(async () => {
    const previousThreadId = threadId;
    try {
      await startNewConversation();
      setSelectedThreadId(null);
      setPreviewMessages([]);
      setToolbarExpanded(false);
      logger.info(
        'chat.conversation_started',
        'Started a new conversation. The previous conversation was left intact and can be reopened from the conversation browser.',
        { previousThreadId },
      );
    } catch (error) {
      logger.error('chat', 'Could not start a new conversation, so the chat panel is still in the current one. Nothing was lost.', error?.message);
    }
  }, [startNewConversation, threadId]);

  const handleSetConversationTags = useCallback(async (conversationId, tags) => {
    const row = conversationsRef.current.find((conversation) => conversation.id === conversationId);
    const title = row?.title?.trim() || 'Untitled conversation';
    try {
      const result = await window.api.localData.threads.tags.set(conversationId, tags);
      const saved = Array.isArray(result?.row?.tags) ? result.row.tags : tags;
      setConversations((rows) => rows.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, tags: saved, tagState: result?.row?.tagState ?? conversation.tagState }
          : conversation
      )));
      // Editing the open conversation's tags brings the live chat state in
      // line. State only — the write above is the write, and syncThreadTags
      // ignores an id that is not the open conversation.
      syncThreadTags?.(conversationId, saved);
      await loadConversationVocabulary();
      // No log entry here on purpose. The local data service writes exactly one
      // 'chat.tags_edited' entry inside the write above, from what was actually
      // stored. Logging again from here would put two lines in the log panel
      // for one edit, and this side only knows what it asked for.
    } catch (error) {
      logger.error('chat', `Could not save the tags for "${title}", so its tags are unchanged. The conversation itself is unaffected.`, error?.message);
    }
  }, [syncThreadTags, loadConversationVocabulary]);

  const handleConversationFacet = useCallback((nextFacet) => {
    setConversationFacet(nextFacet);
    // "All" is the unfiltered view, so choosing it drops the filters the other
    // two facets were holding.
    if (nextFacet === 'all') {
      setConversationTagFilter([]);
      setConversationDateBucket(null);
    }
  }, []);

  const handleToggleConversationTag = useCallback((tag) => {
    setConversationTagFilter((current) => (
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    ));
  }, []);

  const handleClearConversationFilters = useCallback(() => {
    setConversationSearch('');
    setConversationTagFilter([]);
    setConversationDateBucket(null);
    setConversationFacet('all');
  }, []);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Refresh files in context periodically
  useEffect(() => {
    const interval = setInterval(refreshFilesInContext, 10000);
    return () => clearInterval(interval);
  }, [refreshFilesInContext]);

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '100%';
    el.style.height = '100%';
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [inputValue, adjustTextarea]);

  // Subscribe to bfast-queue chat-return events. When the user taps
  // 💬 on a margerin, the queue emits { toolName, params, label } and
  // we refocus the textarea with a "re:" quote prepended so the user
  // can discuss/refine the call instead of running it. The quote is
  // preserved across re-renders via setInputValue + textareaRef.focus.
  useEffect(() => {
    const unsubscribe = onChatReturn(({ toolName, params, label }) => {
      const preview = label || formatMargerinLabel(toolName, params || {});
      const quote = `re: ${preview}\n\n`;
      setInputValue((prev) => {
        // Don't double-prepend if the user already has a re: quote
        // for this exact call staged.
        if (prev.startsWith(quote)) return prev;
        // If there's draft text, keep it below the quote.
        return prev ? `${quote}${prev}` : quote;
      });
      // Focus and move the caret to the end on the next tick so the
      // value has committed.
      setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const end = el.value.length;
        try { el.setSelectionRange(end, end); } catch { /* noop */ }
      }, 0);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (modelsLoading || !selectedModel) return;
    const message = inputValue.trim();
    if (!message || isLoading || isSwitchingThread) return;

    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';
    await sendMessage(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
  };

  const handleCopyMessage = async (index) => {
    const msg = messages[index];
    if (!msg) return;
    const copyContent = visiblePriorityContent(msg.content);
    try {
      await navigator.clipboard.writeText(copyContent);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = copyContent;
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setTooltip(null);
  };

  const handleEditMessage = (index) => {
    const msg = messages[index];
    if (!msg || msg.role !== 'user') return;
    setInputValue(msg.content);
    setTooltip(null);
    textareaRef.current?.focus();
  };

  const handleMessageClick = (e, index, role) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    setTooltip({ index, role });
  };

  // Close tooltip on outside click
  useEffect(() => {
    if (!tooltip) return;
    const handler = () => setTooltip(null);
    setTimeout(() => document.addEventListener('click', handler), 50);
    return () => document.removeEventListener('click', handler);
  }, [tooltip]);

  // Close bg picker on outside click
  useEffect(() => {
    if (!showBgPicker) return;
    const handler = (e) => {
      if (!e.target.closest('.chat-bg-picker') && !e.target.closest('.chat-header-label')) {
        setShowBgPicker(false);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 50);
    return () => document.removeEventListener('click', handler);
  }, [showBgPicker]);

  const userMessageIndexes = messages
    .map((msg, idx) => (msg.role === 'user' ? idx : -1))
    .filter(idx => idx >= 0);

  const showWelcome = messages.length === 0 && !isLoading && !isSwitchingThread && !streamingContent;

  const providerLabel = {
    codex: 'CDX',
    openai: 'OAI',
    gemini: 'GEM',
    claude: 'CLD',
  }[selectedProfile?.provider || provider] || selectedProfile?.provider || provider;

  return (
    <div ref={drop} className={`panel interaction-panel ${isOver && canDrop ? 'drop-active' : ''} ${canDrop ? 'can-drop' : ''}`}>
      <div className="panel-header" id="chat-header">
        <span
          className="chat-header-label"

        >
          
        </span>



                {threadTitle && (
          <div ref={threadTitleRef} className="chat-thread-title">{threadTitle}</div>
        )}


        <div className="panel-header-actions">
          <span className="provider-indicator" title={selectedProfile?.display_name || selectedModel || providerLabel}>
            {providerLabel}
          </span>
          <button 
            className="panel-header-btn interaction-header-icon interaction-bg-picker-btn"
            onClick={() => setShowBgPicker(!showBgPicker)}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            title="Change chat background"
            style={{ cursor: 'pointer' }}
          >􀌆</button>
          <button
            className={`panel-header-btn interaction-header-icon interaction-suggestions-btn ${suggestionsEnabled ? '' : 'disabled-indicator'}`}
            onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
            title={suggestionsEnabled
              ? 'Follow-up suggestions: ON (click to disable)'
              : 'Follow-up suggestions: OFF (click to enable)'}
            aria-pressed={suggestionsEnabled}
            data-theme-inline="interactionpanel-button-state-2" data-theme-state-opacity={(suggestionsEnabled ? '0' : '1')}
          >
            􀌴
          </button>
          {messages.length > 0 && (
            <>
              <button
                className="panel-header-btn interaction-header-icon interaction-collapse-btn"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? '􀁍' : '􀁎'}
              </button>
              <button
                className="panel-header-btn interaction-header-icon interaction-clear-btn"
                onClick={handleClearHistory}
                title="Clear chat"
              >
                ♻
              </button>
            </>
          )}
        </div>
      </div>

      {/* Files in context indicator */}
      {filesInContext.length > 0 && (
        <div className="files-in-context">
          <span className="context-label">Context:</span>
          <div className="context-files">
            {filesInContext.map((file, index) => (
              <span key={file.path || index} className="context-file" title={file.path}>
                <span className="context-file-name">{file.name}</span>
                <button
                  className="context-file-remove"
                  onClick={() => handleRemoveFromContext(file.id)}
                  title="Remove from context"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone overlay */}
      {isOver && canDrop && (
        <div className="drop-overlay">
          <span className="drop-overlay-text">Drop to add to context</span>
        </div>
      )}

      <div className={`chat-container ${collapsed ? 'collapsed' : ''} ${showPanelBackground && resolvedChatBg ? 'has-custom-bg' : ''}`}>
        {showPanelBackground && resolvedChatBg ? (
          <div className="chat-bg-frame-container" style={resolvedChatBgBlur ? { filter: `blur(${resolvedChatBgBlur}px)` } : undefined}>
            <iframe
              ref={bgIframeRef}
              className="chat-bg-frame"
              src={resolvedChatBg}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              onLoad={syncThemeTokensToIframe}
            />
          </div>
        ) : null}

        {showBgPicker && (
          <div className="chat-bg-picker">
            <div className="chat-bg-section-label">Backgrounds</div>
            {CHAT_BACKGROUNDS.map((bg) => (
              <button
                key={bg.value}
                className={`chat-bg-option ${resolvedChatBg === bg.value ? 'active' : ''}`}
                onClick={() => handleChatBgSelect(bg.value)}
              >
                {bg.label}
              </button>
            ))}
            <div className="chat-bg-blur-slider">
              <label>Blur: {resolvedChatBgBlur}px</label>
              <input
                type="range"
                min="0" max="30" step="1"
                value={resolvedChatBgBlur}
                onChange={(e) => setChatBgBlur(parseInt(e.target.value))}
              />
            </div>
          </div>)}

        {!modelsLoading && models.length > 0 && (
          <div className="chat-input-toolbar" ref={toolbarRef}>
            {/* The segmented switch is the shared header row for both modes.
              * Collapsed, both segments still render, so either side of the
              * section is one click away. */}
            <div className="interaction-toolbar-switch" role="group" aria-label="Toolbar section">
              <button
                type="button"
                className={`interaction-toolbar-switch-segment conversations ${conversationsActive ? 'active' : ''}`}
                onClick={() => handleToolbarSegment('conversations')}
                title={conversationsActive ? 'Close the conversation browser' : 'Browse saved conversations'}
                aria-haspopup="dialog"
                aria-expanded={conversationsActive}
              >
                <span>Conversations</span>
                <span aria-hidden="true">􀆊</span>
              </button>
              <button
                type="button"
                className={`interaction-toolbar-switch-segment models ${modelsActive ? 'active' : ''}`}
                onClick={() => handleToolbarSegment('models')}
                title={`Current model: ${modelDisplayName}`}
                aria-haspopup="dialog"
                aria-expanded={modelsActive}
              >
                <span className="model-picker-trigger-label">{modelDisplayName}</span>
                <span className="model-picker-trigger-arrow" aria-hidden="true" />
              </button>
            </div>

            {toolbarMode === 'models' ? (
              <>
                <ModelPicker
                  models={models}
                  modelsByProvider={modelsByProvider}
                  selectedModel={selectedModel}
                  selectModel={handleSelectModel}
                  isModelAvailable={isModelAvailable}
                  apiKeyStatus={apiKeyStatus}
                  renderTrigger={false}
                />
                <div className="modality-selector" role="group" aria-label="Interaction mode">
                  <div className="interaction-toolbar-section-title" aria-hidden="true">
                    <span>Mode</span>
                    <span>{MODALITIES.length}</span>
                  </div>
                  {MODALITIES.map(m => (
                    <button
                      key={m.id}
                      className={`modality-chip ${modality === m.id ? 'active' : ''}`}
                      onClick={() => setModality(m.id)}
                      disabled={isLoading || isSwitchingThread || !!pendingClarification || !!pendingToolConfirmation || !!pendingConfirmation}
                      title={`${m.label} mode`}
                      aria-pressed={modality === m.id}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <ConversationBrowser
                conversations={conversations}
                tagVocabulary={tagVocabulary}
                totals={conversationTotals}
                activeThreadId={threadId}
                selectedThreadId={selectedThreadId}
                onSelect={setSelectedThreadId}
                onOpen={handleOpenConversation}
                onNewConversation={handleNewConversation}
                onSetTags={handleSetConversationTags}
                onClose={collapseToolbar}
                search={conversationSearch}
                onSearchChange={setConversationSearch}
                facet={conversationFacet}
                onFacetChange={handleConversationFacet}
                selectedTags={conversationTagFilter}
                onToggleTag={handleToggleConversationTag}
                dateBucket={conversationDateBucket}
                onDateBucketChange={setConversationDateBucket}
                onClearFilters={handleClearConversationFilters}
                loading={conversationsLoading}
                previewMessages={previewMessages}
              />
            )}
          </div>
        )}

        {showWelcome ? (
          <>
            <div className="briiz-logo">briizOS</div>
            {!isConfigured && (
              <div className="config-warning">
                No AI provider configured. Connect ChatGPT or add an API key in Settings.
              </div>
            )}
          </>
        ) : (
          <div className="messages-list" ref={scrollContainerRef}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const visibleContent = isUser ? msg.content : visiblePriorityContent(msg.content);
              const structured = isUser ? null : classifyAssistantMessage(visibleContent);

              return (
                <div
                  key={msg.id || index}
                  className={`chat-message ${isUser ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}
                  data-msg-index={index}
                  onClick={(e) => handleMessageClick(e, index, isUser ? 'user' : 'assistant')}
                >
                  <div className="message-role">{isUser ? 'You' : 'briizOS'}</div>
                  <div className="message-content markdown-body">
                    {isUser && <>{visibleContent}</>}

                    {!isUser && structured?.type === 'tool-call' && (
                      <div className="tool-message tool-call">
                        <div className="tool-label">Tool Call</div>
                        <div className="tool-name">{structured.tool}</div>
                        <pre className="tool-json">{JSON.stringify(structured.params, null, 2)}</pre>
                        {structured.body && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {structured.body}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}

                    {!isUser && structured?.type === 'tool-result' && (
                      <div className="tool-message tool-result">
                        <div className="tool-label">Tool Result</div>
                        <div className="tool-name">{structured.tool}</div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {structured.body || '(no output)'}
                        </ReactMarkdown>
                      </div>
                    )}

                    {!isUser && structured?.type === 'tool-error' && (
                      <div className="tool-message tool-error">
                        <div className="tool-label">Tool Error</div>
                        <div className="tool-name">{structured.tool}</div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {structured.body || 'Unknown error'}
                        </ReactMarkdown>
                      </div>
                    )}

                    {!isUser && structured?.type === 'normal' && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {structured.body}
                      </ReactMarkdown>
                    )}

                  </div>
                  {tooltip && tooltip.index === index && (
                    <div className={`message-tooltip-${isUser ? 'user' : 'assistant'}`}>
                      <button className="tooltip-btn" onClick={() => handleCopyMessage(tooltip.index)}>
                        Copy
                      </button>
                      {tooltip.role === 'user' && (
                        <button className="tooltip-btn" onClick={() => handleEditMessage(tooltip.index)}>
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming message */}
            {(isLoading || streamingContent) && (
              <div className={`chat-message assistant streaming`}>
                <div className="message-role">briizOS</div>
                <div className="message-content markdown-body">
                  {streamingContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  ) : (
                    <span className="typing-indicator">Thinking...</span>
                  )}

                  {/* Active tool calls */}
                  {toolCalls && toolCalls.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {toolCalls.map((tc) => (
                        <div key={tc.id} data-theme-inline="interaction-panel-div-1" data-theme-state-border-left={(tc.status === 'running' ? '0' : '1')} style={{ padding: '6px 10px', margin: '4px 0' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span style={{
                              width: '14px',
                              display: 'inline-block',
                              textAlign: 'center',
                              animation: tc.status === 'running' ? 'spin 1s linear infinite' : 'none',
                            }}>
                              {tc.status === 'running' ? '\u27F3' : '\u2713'}
                            </span>
                            <span data-theme-inline="interaction-panel-span-1">
                              {tc.name}
                            </span>
                            <span data-theme-inline="interaction-panel-span-2">
                              {tc.status === 'running' ? 'Running...' : 'Done'}
                            </span>
                          </div>
                          {tc.status === 'done' && tc.result && (
                            <div data-theme-inline="interaction-panel-div-2" style={{ marginTop: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active sub-agent tasks */}
                  {subAgentTasks && subAgentTasks.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {subAgentTasks.map((task) => (
                        <div key={task.id} data-theme-inline="interaction-panel-div-3" data-theme-state-border-left={(task.status === 'running' ? '0' : (task.status === 'completed' ? '1' : '2'))} style={{ padding: '6px 10px', marginBottom: '4px' }}>
                          <span data-theme-inline="interaction-panel-span-3">
                            {task.status === 'running' ? '\u27F3' : task.status === 'completed' ? '\u2713' : '\u2717'}
                            {' '}{task.description}
                          </span>
                          {task.status === 'running' && task.messageCount > 0 && (
                            <span data-theme-inline="interaction-panel-span-4" style={{ marginLeft: '8px' }}>
                              ({task.messageCount} steps)
                            </span>
                          )}
                          {task.status === 'failed' && task.error && (
                            <div data-theme-inline="interaction-panel-div-4" style={{ marginTop: '2px' }}>
                              {task.error}
                            </div>
                          )}
                          {task.status === 'timed_out' && (
                            <div data-theme-inline="interaction-panel-div-5" style={{ marginTop: '2px' }}>
                              Timed out
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggested follow-ups
              * Click  → auto-send the suggestion as a new user message.
              * Shift-click (or Alt-click) → fill the input for editing.
              * Hidden while a turn is in flight or the toggle is off.
              */}
            {suggestionsEnabled && suggestions.length > 0 && !isLoading && (
              <div className="suggestion-chips" role="group" aria-label="Follow-up suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={`${i}-${s}`}
                    className="suggestion-chip"
                    type="button"
                    aria-label={`Send follow-up: ${s}`}
                    title={`Click to send · Shift-click to edit first`}
                    onClick={(e) => {
                      if (e.shiftKey || e.altKey) {
                        setInputValue(s);
                        textareaRef.current?.focus();
                        return;
                      }
                      sendMessage(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll nav dots */}
      {userMessageIndexes.length > 2 && !collapsed && (
        <div className="chat-nav-track">
          {userMessageIndexes.map((msgIdx, i) => (
            <div
              key={msgIdx}
              className={`chat-nav-dot ${i === userMessageIndexes.length - 1 ? 'active' : ''}`}
              onClick={() => {
                const el = scrollContainerRef.current?.querySelector(`[data-msg-index="${msgIdx}"]`);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      )}

      {/* Clarification Bar */}
      {pendingClarification && !pendingToolConfirmation && (
        <div className="lg-status-bar" data-theme-inline="interaction-panel-lg-status-bar-1" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
          <span data-theme-inline="interaction-panel-span-5" style={{ width: '6px', height: '6px', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span data-theme-inline="interaction-panel-span-6" style={{ flex: 1 }}>
            <strong>Clarify:</strong> {pendingClarification.question}
          </span>
        </div>
      )}

      {/* Backend status indicator */}
      {lgStatus && lgStatus !== 'running' && lgStatus !== 'unknown' && lgStatus !== 'unavailable' && (
        <div className="lg-status-bar" data-theme-inline="interaction-panel-lg-status-bar-2" data-theme-state-color={(lgStatus === 'failed' ? '0' : (lgStatus === 'env_missing' ? '1' : (lgStatus === 'crashed' || lgStatus === 'error' ? '0' : '2')))} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px' }}>
          <span data-theme-inline="interaction-panel-span-7" data-theme-state-background={(lgStatus === 'starting' ? '0' : (lgStatus === 'failed' ? '1' : (lgStatus === 'env_missing' ? '2' : '1')))} style={{ width: '6px', height: '6px', flexShrink: 0, animation: lgStatus === 'starting' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
          <span>
            {lgStatus === 'starting' && 'Starting...'}
            {(lgStatus === 'crashed' || lgStatus === 'error') && 'Reconnecting...'}
            {lgStatus === 'failed' && 'Backend unavailable'}
            {lgStatus === 'env_missing' && 'Python environment not found'}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className={`chat-input-area ${pendingToolConfirmation || pendingConfirmation ? 'has-confirmation' : ''}`}>
          <ConfirmationToast
            pendingConfirmation={pendingToolConfirmation ? null : pendingConfirmation}
            onConfirm={confirmAction}
            onCancel={cancelAction}
          />

          {pendingToolConfirmation ? (
            <section
              ref={confirmationPanelRef}
              className="chat-confirmation-request"
              role="alertdialog"
              aria-labelledby="agent-confirmation-title"
              aria-describedby="agent-confirmation-action agent-confirmation-note"
              tabIndex={-1}
            >
              <div className="confirmation-request-copy">
                <div className="confirmation-request-kicker">Approval needed</div>
                <h3 id="agent-confirmation-title" className="confirmation-request-title">
                  Briizy is asking to perform an action
                </h3>
                <p id="agent-confirmation-action" className="confirmation-request-action">
                  {pendingToolConfirmation.summary}
                </p>
                <p id="agent-confirmation-note" className="confirmation-request-note">
                  Nothing will run until you choose.
                </p>
              </div>
              <div className="confirmation-request-actions" aria-label="Respond to requested action">
                <button
                  type="button"
                  className="confirmation-response-btn approve"
                  onClick={approveToolConfirmation}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="confirmation-response-btn decline"
                  onClick={rejectToolConfirmation}
                >
                  Decline
                </button>
              </div>
            </section>
          ) : !pendingConfirmation ? (
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder={!lgReady
                  ? 'Waiting for AI backend...'
                  : pendingClarification
                    ? 'Answer the clarification...'
                    : modality === 'planner'
                      ? 'Ask about your schedule or shape a day… (⌘+Enter)'
                    : filesInContext.length > 0
                      ? `Ask about ${filesInContext.length} file(s)...`
                      : "Ask anything (\u2318+Enter)"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || isSwitchingThread || !lgReady || modelsLoading || !selectedModel}
                rows={1}
              />
              <button
                className="chat-send-btn"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isLoading || isSwitchingThread || !lgReady || modelsLoading || !selectedModel}
              >
                {isLoading ? '...' : '\u2192'}
              </button>
            </div>
          ) : null}
      </div>
    </div>
  );
}

export default InteractionPanel;
