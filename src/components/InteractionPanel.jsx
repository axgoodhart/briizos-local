import { useState, useEffect, useRef, useCallback, lazy, Suspense, Component } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../hooks/useChat';
import { useLangGraphStatus } from '../hooks/useLangGraphStatus';
import { useChatSettings } from '../context/ChatSettingsContext';
import { useTools } from '../context/ToolContext';
import ConfirmationToast from './ConfirmationToast';
import { addLog, addSelectedFile, removeSelectedFile } from '../lib/firestore';
import { SOURCE_FILE_TYPE } from './FileTree';
import logger from '../lib/logger';
import { useModelSelection } from '../hooks/useModelSelection';
import ModelPicker from './ModelPicker';

const REACTBITS_BACKGROUNDS = [
  { value: 'reactbits:Aurora', label: 'Aurora' },
  { value: 'reactbits:Balatro', label: 'Balatro' },
  { value: 'reactbits:Ballpit', label: 'Ballpit' },
  { value: 'reactbits:Beams', label: 'Beams' },
  { value: 'reactbits:ColorBends', label: 'Color Bends' },
  { value: 'reactbits:DarkVeil', label: 'Dark Veil' },
  { value: 'reactbits:Dither', label: 'Dither' },
  { value: 'reactbits:DotGrid', label: 'Dot Grid' },
  { value: 'reactbits:EvilEye', label: 'Evil Eye' },
  { value: 'reactbits:FaultyTerminal', label: 'Faulty Terminal' },
  { value: 'reactbits:FloatingLines', label: 'Floating Lines' },
  { value: 'reactbits:Galaxy', label: 'Galaxy' },
  { value: 'reactbits:GradientBlinds', label: 'Gradient Blinds' },
  { value: 'reactbits:Grainient', label: 'Grainient' },
  { value: 'reactbits:GridDistortion', label: 'Grid Distortion' },
  { value: 'reactbits:GridMotion', label: 'Grid Motion' },
  { value: 'reactbits:GridScan', label: 'Grid Scan' },
  { value: 'reactbits:Hyperspeed', label: 'Hyperspeed' },
  { value: 'reactbits:Iridescence', label: 'Iridescence' },
  { value: 'reactbits:LetterGlitch', label: 'Letter Glitch' },
  { value: 'reactbits:Lightning', label: 'Lightning' },
  { value: 'reactbits:LightPillar', label: 'Light Pillar' },
  { value: 'reactbits:LightRays', label: 'Light Rays' },
  { value: 'reactbits:LineWaves', label: 'Line Waves' },
  { value: 'reactbits:LiquidChrome', label: 'Liquid Chrome' },
  { value: 'reactbits:LiquidEther', label: 'Liquid Ether' },
  { value: 'reactbits:Mycelium', label: 'Mycelium' },
  { value: 'reactbits:Orb', label: 'Orb' },
  { value: 'reactbits:Particles', label: 'Particles' },
  { value: 'reactbits:PixelBlast', label: 'Pixel Blast' },
  { value: 'reactbits:PixelSnow', label: 'Pixel Snow' },
  { value: 'reactbits:Plasma', label: 'Plasma' },
  { value: 'reactbits:Prism', label: 'Prism' },
  { value: 'reactbits:PrismaticBurst', label: 'Prismatic Burst' },
  { value: 'reactbits:Radar', label: 'Radar' },
  { value: 'reactbits:RippleGrid', label: 'Ripple Grid' },
  { value: 'reactbits:ShapeGrid', label: 'Shape Grid' },
  { value: 'reactbits:Silk', label: 'Silk' },
  { value: 'reactbits:SoftAurora', label: 'Soft Aurora' },
  { value: 'reactbits:Spores', label: 'Spores' },
  { value: 'reactbits:Threads', label: 'Threads' },
  { value: 'reactbits:Tide', label: 'Tide' },
  { value: 'reactbits:Waves', label: 'Waves' },
];

const reactBitsImportMap = {
  Aurora: () => import('@reactbits/Aurora/Aurora.tsx'),
  Balatro: () => import('@reactbits/Balatro/Balatro.tsx'),
  Ballpit: () => import('@reactbits/Ballpit/Ballpit.tsx'),
  Beams: () => import('@reactbits/Beams/Beams.tsx'),
  ColorBends: () => import('@reactbits/ColorBends/ColorBends.tsx'),
  DarkVeil: () => import('@reactbits/DarkVeil/DarkVeil.tsx'),
  Dither: () => import('@reactbits/Dither/Dither.tsx'),
  DotGrid: () => import('@reactbits/DotGrid/DotGrid.tsx'),
  EvilEye: () => import('@reactbits/EvilEye/EvilEye.tsx'),
  FaultyTerminal: () => import('@reactbits/FaultyTerminal/FaultyTerminal.tsx'),
  FloatingLines: () => import('@reactbits/FloatingLines/FloatingLines.tsx'),
  Galaxy: () => import('@reactbits/Galaxy/Galaxy.tsx'),
  GradientBlinds: () => import('@reactbits/GradientBlinds/GradientBlinds.tsx'),
  Grainient: () => import('@reactbits/Grainient/Grainient.tsx'),
  GridDistortion: () => import('@reactbits/GridDistortion/GridDistortion.tsx'),
  GridMotion: () => import('@reactbits/GridMotion/GridMotion.tsx'),
  GridScan: () => import('@reactbits/GridScan/GridScan.tsx'),
  Hyperspeed: () => import('@reactbits/Hyperspeed/Hyperspeed.tsx'),
  Iridescence: () => import('@reactbits/Iridescence/Iridescence.tsx'),
  LetterGlitch: () => import('@reactbits/LetterGlitch/LetterGlitch.tsx'),
  Lightning: () => import('@reactbits/Lightning/Lightning.tsx'),
  LightPillar: () => import('@reactbits/LightPillar/LightPillar.tsx'),
  LightRays: () => import('@reactbits/LightRays/LightRays.tsx'),
  LineWaves: () => import('@reactbits/LineWaves/LineWaves.tsx'),
  LiquidChrome: () => import('@reactbits/LiquidChrome/LiquidChrome.tsx'),
  LiquidEther: () => import('@reactbits/LiquidEther/LiquidEther.tsx'),
  Mycelium: () => import('@reactbits/Mycelium/Mycelium.tsx'),
  Orb: () => import('@reactbits/Orb/Orb.tsx'),
  Particles: () => import('@reactbits/Particles/Particles.tsx'),
  PixelBlast: () => import('@reactbits/PixelBlast/PixelBlast.tsx'),
  PixelSnow: () => import('@reactbits/PixelSnow/PixelSnow.tsx'),
  Plasma: () => import('@reactbits/Plasma/Plasma.tsx'),
  Prism: () => import('@reactbits/Prism/Prism.tsx'),
  PrismaticBurst: () => import('@reactbits/PrismaticBurst/PrismaticBurst.tsx'),
  Radar: () => import('@reactbits/Radar/Radar.tsx'),
  RippleGrid: () => import('@reactbits/RippleGrid/RippleGrid.tsx'),
  ShapeGrid: () => import('@reactbits/ShapeGrid/ShapeGrid.tsx'),
  Silk: () => import('@reactbits/Silk/Silk.tsx'),
  SoftAurora: () => import('@reactbits/SoftAurora/SoftAurora.tsx'),
  Spores: () => import('@reactbits/Spores/Spores.tsx'),
  Threads: () => import('@reactbits/Threads/Threads.tsx'),
  Tide: () => import('@reactbits/Tide/Tide.tsx'),
  Waves: () => import('@reactbits/Waves/Waves.tsx'),
};

const reactBitsComponentCache = {};
function getReactBitsComponent(name) {
  if (!reactBitsComponentCache[name]) {
    const importFn = reactBitsImportMap[name];
    if (!importFn) {
      console.error(`ReactBits background "${name}" not found in import map`);
      return () => null;
    }
    reactBitsComponentCache[name] = lazy(importFn);
  }
  return reactBitsComponentCache[name];
}

class ReactBitsErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    logger.error('ReactBits background crashed', { error: error.message, component: info?.componentStack?.slice(0, 200) });
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ReactBitsBackground({ name, blur }) {
  const Component = getReactBitsComponent(name);
  return (
    <div className="chat-bg-frame-container reactbits-bg" style={blur ? { filter: `blur(${blur}px)` } : undefined}>
      <ReactBitsErrorBoundary>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </ReactBitsErrorBoundary>
    </div>
  );
}

const CHAT_BACKGROUNDS = [
  { value: '', label: 'Default' },
  { value: 'assets/backgrounds/24h.html', label: '24h' },
{ value: 'assets/backgrounds/Butterflies.html', label: 'Butterflies' },
{ value: 'assets/backgrounds/Darkstars.html', label: 'Darkstars' },
{ value: 'assets/backgrounds/GlassClock.html', label: 'GlassClock' },
{ value: 'assets/backgrounds/Insectiana.html', label: 'Insectiana' },
{ value: 'assets/backgrounds/RotoPulse.html', label: 'RotoPulse' },
{ value: 'assets/backgrounds/Spheres.html', label: 'Spheres' },
{ value: 'assets/backgrounds/Stars.html', label: 'Stars' },
{ value: 'assets/backgrounds/Wallpaper.html', label: 'Wallpaper' },
{ value: 'assets/backgrounds/Widget.html', label: 'Widget' },
{ value: 'assets/backgrounds/butterflies.html', label: 'butterflies' },
{ value: 'assets/backgrounds/colorink.html', label: 'colorink' },
{ value: 'assets/backgrounds/darkwater.html', label: 'darkwater' },
{ value: 'assets/backgrounds/default-gradient.html', label: 'default-gradient' },
{ value: 'assets/backgrounds/linetrance.html', label: 'linetrance' },
{ value: 'assets/backgrounds/liquid.html', label: 'liquid' },
{ value: 'assets/backgrounds/neuralnetworkbackground.html', label: 'neuralnetworkbackground' },
{ value: 'assets/backgrounds/portals.html', label: 'portals' },
{ value: 'assets/backgrounds/rainbo.html', label: 'rainbo' },
{ value: 'assets/backgrounds/rainpool.html', label: 'rainpool' },
{ value: 'assets/backgrounds/thing.html', label: 'thing' },
{ value: 'assets/backgrounds/transformer.html', label: 'transformer' },
{ value: 'assets/backgrounds/univer.html', label: 'univer' },
{ value: 'assets/backgrounds/vialinebg.html', label: 'vialinebg' },
{ value: 'assets/backgrounds/visualizer5.html', label: 'visualizer5' },
{ value: 'assets/backgrounds/visualizer6.html', label: 'visualizer6' },
{ value: 'assets/backgrounds/wavepool.html', label: 'wavepool' }
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
  const {
    messages,
    isLoading,
    isConfigured,
    filesInContext,
    streamingContent,
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
    refreshFilesInContext,
    approveToolConfirmation,
    rejectToolConfirmation,
  } = useChat();

  const { status: lgStatus, ready: lgReady } = useLangGraphStatus();
  const { provider, currentSettings, chatBackground, setChatBackground, chatBgBlur, setChatBgBlur } = useChatSettings();
  const { pendingConfirmation, confirmAction, cancelAction } = useTools();
  const { models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus, loading: modelsLoading } = useModelSelection();

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
        await addSelectedFile(item.path, item.name);
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
  const handleRemoveFromContext = useCallback(async (filePath) => {
    try {
      await removeSelectedFile(filePath);
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
  }[provider] || provider;

  return (
    <div ref={drop} className={`panel interaction-panel ${isOver && canDrop ? 'drop-active' : ''} ${canDrop ? 'can-drop' : ''}`}>
      <div className="panel-header" id="chat-header">
        <span
          className="chat-header-label"
          onClick={() => setShowBgPicker(!showBgPicker)}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
          title="Change chat background"
          style={{ cursor: 'pointer' }}
        >
          Chat
        </span>

                {threadTitle && (
          <div ref={threadTitleRef} className="chat-thread-title">{threadTitle}</div>
        )}


        <div className="panel-header-actions">
          <span className="provider-indicator" title={`${providerLabel} / ${currentSettings.model}`}>
            {providerLabel}
          </span>
          <button
            className={`panel-header-btn ${suggestionsEnabled ? '' : 'disabled-indicator'}`}
            onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
            title={suggestionsEnabled ? 'Suggestions on' : 'Suggestions off'}
            style={{ fontSize: '10px', opacity: suggestionsEnabled ? 0.8 : 0.4 }}
          >
            ?
          </button>
          {messages.length > 0 && (
            <>
              <button
                className="panel-header-btn"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? '▼' : '▲'}
              </button>
              <button
                className="panel-header-btn"
                onClick={handleClearHistory}
                title="Clear chat"
              >
                ×
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
                {file.name}
                <button
                  className="context-file-remove"
                  onClick={() => handleRemoveFromContext(file.path)}
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

      <div className={`chat-container ${collapsed ? 'collapsed' : ''} ${chatBackground ? 'has-custom-bg' : ''}`}>
        {chatBackground && chatBackground.startsWith('reactbits:') ? (
          <ReactBitsBackground name={chatBackground.replace('reactbits:', '')} blur={chatBgBlur} />
        ) : chatBackground ? (
          <div className="chat-bg-frame-container" style={chatBgBlur ? { filter: `blur(${chatBgBlur}px)` } : undefined}>
            <iframe
              className="chat-bg-frame"
              src={chatBackground}
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
                className={`chat-bg-option ${chatBackground === bg.value ? 'active' : ''}`}
                onClick={() => {
                  setChatBackground(bg.value);
                  setShowBgPicker(false);
                }}
              >
                {bg.label}
              </button>
            ))}
            <div className="chat-bg-section-label">React Bits</div>
            {REACTBITS_BACKGROUNDS.map((bg) => (
              <button
                key={bg.value}
                className={`chat-bg-option ${chatBackground === bg.value ? 'active' : ''}`}
                onClick={() => {
                  setChatBackground(bg.value);
                  setShowBgPicker(false);
                }}
              >
                {bg.label}
              </button>
            ))}
            <div className="chat-bg-blur-slider">
              <label>Blur: {chatBgBlur}px</label>
              <input
                type="range"
                min="0" max="30" step="1"
                value={chatBgBlur}
                onChange={(e) => setChatBgBlur(parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

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

            {/* Suggested follow-ups */}
            {suggestions.length > 0 && !isLoading && (
              <div className="suggestion-chips">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => setInputValue(s)}
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
            <div className="modality-selector" style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
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
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={!lgReady ? 'Waiting for AI backend...' : filesInContext.length > 0 ? `Ask about ${filesInContext.length} file(s)...` : "Ask anything (\u2318+Enter)"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !lgReady}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading || !lgReady}
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
