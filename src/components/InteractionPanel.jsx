import { useState, useEffect, useRef, useCallback, lazy, Suspense, Component } from 'react';
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
import { useModelSelection } from '../hooks/useModelSelection';
import ModelPicker from './ModelPicker';

const CHAT_BACKGROUNDS = [
  { value: '', label: 'Default' },
  { value: 'assets/backgrounds/24h.html', label: '24h' },
  { value: 'assets/backgrounds/Aurora.html', label: 'Aurora' },
  { value: 'assets/backgrounds/Balatro.html', label: 'Balatro' },
  { value: 'assets/backgrounds/Ballpit.html', label: 'Ballpit' },
  { value: 'assets/backgrounds/Beams.html', label: 'Beams' },
  { value: 'assets/backgrounds/Butterflies.html', label: 'Butterflies' },
  { value: 'assets/backgrounds/ColorBends.html', label: 'ColorBends' },
  { value: 'assets/backgrounds/colorink.html', label: 'colorink' },
  { value: 'assets/backgrounds/Darkstars.html', label: 'Darkstars' },
  { value: 'assets/backgrounds/DarkVeil.html', label: 'DarkVeil' },
  { value: 'assets/backgrounds/darkwater.html', label: 'darkwater' },
  { value: 'assets/backgrounds/default-gradient.html', label: 'default-gradient' },
  { value: 'assets/backgrounds/Dither.html', label: 'Dither' },
  { value: 'assets/backgrounds/DotGrid.html', label: 'DotGrid' },
  { value: 'assets/backgrounds/EvilEye.html', label: 'EvilEye' },
  { value: 'assets/backgrounds/FaultyTerminal.html', label: 'FaultyTerminal' },
  { value: 'assets/backgrounds/FloatingLines.html', label: 'FloatingLines' },
  { value: 'assets/backgrounds/Galaxy.html', label: 'Galaxy' },
  { value: 'assets/backgrounds/gems.html', label: 'gems' },
  { value: 'assets/backgrounds/GlassClock.html', label: 'GlassClock' },
  { value: 'assets/backgrounds/GradientBlinds.html', label: 'GradientBlinds' },
  { value: 'assets/backgrounds/Grainient.html', label: 'Grainient' },
  { value: 'assets/backgrounds/GridMotion.html', label: 'GridMotion' },
  { value: 'assets/backgrounds/Insectiana.html', label: 'Insectiana' },
  { value: 'assets/backgrounds/Iridescence.html', label: 'Iridescence' },
  { value: 'assets/backgrounds/LetterGlitch.html', label: 'LetterGlitch' },
  { value: 'assets/backgrounds/Lightning.html', label: 'Lightning' },
  { value: 'assets/backgrounds/LightPillar.html', label: 'LightPillar' },
  { value: 'assets/backgrounds/LightRays.html', label: 'LightRays' },
  { value: 'assets/backgrounds/linetrance.html', label: 'linetrance' },
  { value: 'assets/backgrounds/LineWaves.html', label: 'LineWaves' },
  { value: 'assets/backgrounds/liquid.html', label: 'liquid' },
  { value: 'assets/backgrounds/LiquidChrome.html', label: 'LiquidChrome' },
  { value: 'assets/backgrounds/LiquidEther.html', label: 'LiquidEther' },
  { value: 'assets/backgrounds/Mycelium.html', label: 'Mycelium' },
  { value: 'assets/backgrounds/neuralnetworkbackground.html', label: 'neuralnetworkbackground' },
  { value: 'assets/backgrounds/Orb.html', label: 'Orb' },
  { value: 'assets/backgrounds/panning1.html', label: 'panning1' },
  { value: 'assets/backgrounds/panning2.html', label: 'panning2' },
  { value: 'assets/backgrounds/panning3.html', label: 'panning3' },
  { value: 'assets/backgrounds/Particles.html', label: 'Particles' },
  { value: 'assets/backgrounds/PixelBlast.html', label: 'PixelBlast' },
  { value: 'assets/backgrounds/PixelSnow.html', label: 'PixelSnow' },
  { value: 'assets/backgrounds/Plasma.html', label: 'Plasma' },
  { value: 'assets/backgrounds/portals.html', label: 'portals' },
  { value: 'assets/backgrounds/Prism.html', label: 'Prism' },
  { value: 'assets/backgrounds/PrismaticBurst.html', label: 'PrismaticBurst' },
  { value: 'assets/backgrounds/purdots.png', label: 'purdots' },
  { value: 'assets/backgrounds/Radar.html', label: 'Radar' },
  { value: 'assets/backgrounds/rainbo.html', label: 'rainbo' },
  { value: 'assets/backgrounds/rainpool.html', label: 'rainpool' },
  { value: 'assets/backgrounds/RippleGrid.html', label: 'RippleGrid' },
  { value: 'assets/backgrounds/RotoPulse.html', label: 'RotoPulse' },
  { value: 'assets/backgrounds/ShapeGrid.html', label: 'ShapeGrid' },
  { value: 'assets/backgrounds/Silk.html', label: 'Silk' },
  { value: 'assets/backgrounds/SoftAurora.html', label: 'SoftAurora' },
  { value: 'assets/backgrounds/Spheres.html', label: 'Spheres' },
  { value: 'assets/backgrounds/Spores.html', label: 'Spores' },
  { value: 'assets/backgrounds/Stars.html', label: 'Stars' },
  { value: 'assets/backgrounds/thing.html', label: 'thing' },
  { value: 'assets/backgrounds/Threads.html', label: 'Threads' },
  { value: 'assets/backgrounds/Tide.html', label: 'Tide' },
  { value: 'assets/backgrounds/torando.png', label: 'torando' },
  { value: 'assets/backgrounds/transformer.html', label: 'transformer' },
  { value: 'assets/backgrounds/vialinebg.html', label: 'vialinebg' },
  { value: 'assets/backgrounds/Wallpaper.html', label: 'Wallpaper' },
  { value: 'assets/backgrounds/wavepool.html', label: 'wavepool' },
  { value: 'assets/backgrounds/Waves.html', label: 'Waves' },
  { value: 'assets/backgrounds/Widget.html', label: 'Widget' }
];



const MODALITIES = [
  { id: 'chat', label: 'Chat' },
  { id: 'research', label: 'Research' },
  { id: 'code', label: 'Code' },
  { id: 'report', label: 'Report' },
  { id: 'plan', label: 'Plan' },
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

function InteractionPanel() {
  const { provider, setProvider, currentSettings, chatBackground, setChatBackground, chatBgBlur, setChatBgBlur, getThemeChatBackground } = useChatSettings();
  const { models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus, loading: modelsLoading } = useModelSelection();
  const selectedProfile = models.find((model) => model.name === selectedModel) || null;
  const selectedRequestSettings = selectedProfile?.provider === provider ? currentSettings?.params : null;
  const {
    messages,
    isLoading,
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

  useEffect(() => {
    if (selectedProfile?.provider && selectedProfile.provider !== provider) {
      setProvider(selectedProfile.provider);
    }
  }, [selectedProfile?.provider, provider, setProvider]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'default';
      setActiveTheme(theme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

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
  const scrollContainerRef = useRef(null);

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
    if (!message || isLoading) return;

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
    try {
      await navigator.clipboard.writeText(msg.content);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = msg.content;
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

  const showWelcome = messages.length === 0 && !isLoading && !streamingContent;

  const providerLabel = {
    openai: 'OpenAI',
    gemini: 'Gemini',
    claude: 'Claude',
  }[selectedProfile?.provider || provider] || selectedProfile?.provider || provider;

  return (
    <div ref={drop} className={`panel interaction-panel ${isOver && canDrop ? 'drop-active' : ''} ${canDrop ? 'can-drop' : ''}`}>
      <div className="panel-header" id="chat-header">
        <span
          className="chat-header-label"

        >
          
        </span>
        {!modelsLoading && models.length > 0 && (
          <div className="chat-input-toolbar" style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 0', gap: '8px' }}>
            <ModelPicker
              models={models}
              modelsByProvider={modelsByProvider}
              selectedModel={selectedModel}
              selectModel={selectModel}
              isModelAvailable={isModelAvailable}
              apiKeyStatus={apiKeyStatus}
            />
            <div className="modality-selector" style={{ display: 'flex', gap: '4%' }}>
              {MODALITIES.map(m => (
                <button
                  key={m.id}
                  className={`modality-chip ${modality === m.id ? 'active' : ''}`}
                  onClick={() => setModality(m.id)}
                  title={`${m.label} mode`}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: modality === m.id ? 600 : 400,
                    border: `1px solid ${modality === m.id ? 'rgba(0, 200, 200, 0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '12px',
                    background: modality === m.id ? 'rgba(0, 200, 200, 0.15)' : 'transparent',
                    color: modality === m.id ? 'var(--palette-accent-cyan-soft, #7dd3fc)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}


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

      <div className={`chat-container ${collapsed ? 'collapsed' : ''} ${resolvedChatBg ? 'has-custom-bg' : ''}`}>
        {resolvedChatBg ? (
          <div className="chat-bg-frame-container" style={resolvedChatBgBlur ? { filter: `blur(${resolvedChatBgBlur}px)` } : undefined}>
            <iframe
              className="chat-bg-frame"
              src={resolvedChatBg}
              sandbox="allow-scripts"
              loading="lazy"
            />
          </div>
        ) : null}

        {showBgPicker && (
          <div className="chat-bg-picker">
            <div className="chat-bg-section-label">HTML Backgrounds</div>
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


        {showWelcome ? (
          <>
            <div className="briiz-logo">briizOS</div>
            {!isConfigured && (
              <div className="config-warning">
                No AI provider configured. Add API keys in Settings.
              </div>
            )}
          </>
        ) : (
          <div className="messages-list" ref={scrollContainerRef}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const structured = isUser ? null : classifyAssistantMessage(msg.content);

              return (
                <div
                  key={msg.id || index}
                  className={`chat-message ${isUser ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}
                  data-msg-index={index}
                  onClick={(e) => handleMessageClick(e, index, isUser ? 'user' : 'assistant')}
                >
                  <div className="message-role">{isUser ? 'You' : 'briizOS'}</div>
                  <div className="message-content markdown-body">
                    {isUser && <>{msg.content}</>}

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
                        {msg.content}
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

      {/* Tool Confirmation Bar */}
      {pendingToolConfirmation && (
        <div className="lg-status-bar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#fbbf24',
          background: 'rgba(251, 191, 36, 0.08)',
          borderTop: '1px solid rgba(251, 191, 36, 0.2)',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            flexShrink: 0,
            background: '#fbbf24',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ flex: 1, lineHeight: '1.3' }}>
            <strong>Confirm:</strong> {pendingToolConfirmation.summary}
          </span>
          <button
            onClick={approveToolConfirmation}
            style={{
              padding: '3px 12px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid rgba(74, 222, 128, 0.4)',
              borderRadius: '4px',
              background: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              cursor: 'pointer',
            }}
          >
            Approve
          </button>
          <button
            onClick={rejectToolConfirmation}
            style={{
              padding: '3px 12px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '4px',
              background: 'rgba(248, 113, 113, 0.15)',
              color: '#f87171',
              cursor: 'pointer',
            }}
          >
            Reject
          </button>
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
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={!lgReady
              ? 'Waiting for AI backend...'
              : pendingClarification
                ? 'Answer the clarification...'
                : filesInContext.length > 0
                  ? `Ask about ${filesInContext.length} file(s)...`
                  : "Ask anything (\u2318+Enter)"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !lgReady || modelsLoading || !selectedModel}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading || !lgReady || modelsLoading || !selectedModel}
          >
            {isLoading ? '...' : '\u2192'}
          </button>
        </div>
      </div>


      {/* Confirmation Toast */}
      <ConfirmationToast
        pendingConfirmation={pendingConfirmation}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
}

export default InteractionPanel;
