import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, Component } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../hooks/useChat';
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
    sendMessage,
    clearHistory,
    refreshFilesInContext,
    approveToolConfirmation,
    rejectToolConfirmation,
  } = useChat({ selectedModel, requestSettings: selectedRequestSettings });

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
            style={{ opacity: suggestionsEnabled ? 0.8 : 0.4 }}
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
          <div className="chat-input-toolbar">
            <ModelPicker
              models={models}
              modelsByProvider={modelsByProvider}
              selectedModel={selectedModel}
              selectModel={selectModel}
              isModelAvailable={isModelAvailable}
              apiKeyStatus={apiKeyStatus}
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
                        <div key={tc.id} style={{
                          borderLeft: `2px solid ${tc.status === 'running' ? '#fbbf24' : '#4ade80'}`,
                          padding: '6px 10px',
                          margin: '4px 0',
                          fontSize: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '0 4px 4px 0',
                        }}>
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
                            <span style={{
                              fontWeight: 600,
                              color: '#94a3b8',
                            }}>
                              {tc.name}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              opacity: 0.7,
                            }}>
                              {tc.status === 'running' ? 'Running...' : 'Done'}
                            </span>
                          </div>
                          {tc.status === 'done' && tc.result && (
                            <div style={{
                              marginTop: '4px',
                              fontSize: '12px',
                              opacity: 0.85,
                              maxHeight: '120px',
                              overflowY: 'auto',
                            }}>
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
                        <div key={task.id} style={{
                          borderLeft: `2px solid ${
                            task.status === 'running' ? '#818cf8' :
                            task.status === 'completed' ? '#4ade80' :
                            '#ef4444'
                          }`,
                          padding: '6px 10px',
                          marginBottom: '4px',
                          fontSize: '12px',
                          color: 'var(--text-secondary, #94a3b8)',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '0 4px 4px 0',
                        }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>
                            {task.status === 'running' ? '\u27F3' : task.status === 'completed' ? '\u2713' : '\u2717'}
                            {' '}{task.description}
                          </span>
                          {task.status === 'running' && task.messageCount > 0 && (
                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                              ({task.messageCount} steps)
                            </span>
                          )}
                          {task.status === 'failed' && task.error && (
                            <div style={{ marginTop: '2px', color: '#ef4444', fontSize: '11px' }}>
                              {task.error}
                            </div>
                          )}
                          {task.status === 'timed_out' && (
                            <div style={{ marginTop: '2px', color: '#f59e0b', fontSize: '11px' }}>
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
        <div className="lg-status-bar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#93c5fd',
          background: 'rgba(59, 130, 246, 0.08)',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            flexShrink: 0,
            background: '#93c5fd',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ flex: 1, lineHeight: '1.3' }}>
            <strong>Clarify:</strong> {pendingClarification.question}
          </span>
        </div>
      )}

      {/* Backend status indicator */}
      {lgStatus && lgStatus !== 'running' && lgStatus !== 'unknown' && lgStatus !== 'unavailable' && (
        <div className="lg-status-bar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          fontSize: '11px',
          color: lgStatus === 'failed' ? '#f87171'
            : lgStatus === 'env_missing' ? '#fb923c'
            : lgStatus === 'crashed' || lgStatus === 'error' ? '#f87171'
            : '#fbbf24',
          background: 'rgba(10, 22, 40, 0.7)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            flexShrink: 0,
            background: lgStatus === 'starting' ? '#fbbf24'
              : lgStatus === 'failed' ? '#f87171'
              : lgStatus === 'env_missing' ? '#fb923c'
              : '#f87171',
            animation: lgStatus === 'starting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
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
