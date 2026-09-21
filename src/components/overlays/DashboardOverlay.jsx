import DockAppearanceSettings from '../controlbar/DockAppearanceSettings';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChatSettings } from '../../context/ChatSettingsContext';
import logger from '../../lib/logger';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import { useBriizyCapture } from '../../hooks/useBriizyCapture.js';
import CaptureSettingsPanel from '../briizy/CaptureSettingsPanel.jsx';
import { CHAT_BACKGROUNDS } from '../../lib/chatBackgrounds.js';
import {
  HEADER_DOCK_ORIENTATIONS,
  HEADER_DOCK_STYLES,
  HEADER_DOCK_STYLE_OPTIONS,
} from '../controlbar/dockPreferences.js';
import '../../AppCombined.css';
import '../InteractionToolbar.css';

const DOCK_PREVIEW_ITEMS = [
  { id: 'chat', glyph: '􀌮', accent: '#16df69' },
  { id: 'organizer', glyph: '􀱢', accent: '#2bff36' },
  { id: 'calendar', glyph: '􀉉', accent: '#ff7149' },
  { id: 'media', glyph: '􀢺', accent: '#43e8dd' },
];

const DOCK_PREVIEW_TAB_PATH = 'M 0 32 C 4 32 7 29 7 24 L 7 14 Q 7 1 20 1 L 36 1 Q 49 1 49 14 L 49 24 C 49 29 52 32 56 32';

/* ───────────────────────────
   Sub-components (kept small)
   ─────────────────────────── */

function ModelTab({ isOpen }) {
  const [modelList, setModelList] = useState([]);
  const [apiKeyStatus, setApiKeyStatus] = useState({ anthropic: false, openai: false, google: false, codex: false });
  const [codexAuth, setCodexAuth] = useState({ installed: true, connected: false });
  const [codexAuthBusy, setCodexAuthBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [keyDrafts, setKeyDrafts] = useState({ openai: '', claude: '', gemini: '' });
  const [savingProvider, setSavingProvider] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    loadModels();
  }, [isOpen]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const [models, keys, savedModel, codexStatus] = await Promise.all([
        window.api.getModels(),
        window.api.checkApiKeys(),
        window.api.localData.settings.get('selected_model'),
        window.api.getCodexAuthStatus(),
      ]);
      setModelList(models || []);
      setSelectedModel(savedModel?.value || null);
      // Normalize provider key map to support both legacy and new slugs
      const normalized = {
        ...(keys || {}),
        // Ensure new slugs exist even if only legacy are returned
        claude: (keys && (keys.claude ?? keys.anthropic)) ?? false,
        gemini: (keys && (keys.gemini ?? keys.google)) ?? false,
        // Keep legacy slugs in sync with new slugs for any code paths that still read them
        anthropic: (keys && (keys.anthropic ?? keys.claude)) ?? false,
        google: (keys && (keys.google ?? keys.gemini)) ?? false,
      };
      setApiKeyStatus(normalized);
      setCodexAuth(codexStatus || { installed: false, connected: false });
    } catch (err) {
      logger.error('config', 'Failed to load models', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || typeof window.api?.onCodexAuthChanged !== 'function') return undefined;
    return window.api.onCodexAuthChanged(() => loadModels());
  }, [isOpen]);

  const toggleCodexAuth = async () => {
    setCodexAuthBusy(true);
    try {
      if (codexAuth.connected) await window.api.disconnectCodex();
      else await window.api.connectCodex();
      if (codexAuth.connected) await loadModels();
    } catch (error) {
      setCodexAuth((current) => ({ ...current, error: error?.message || 'ChatGPT sign-in could not be started.' }));
    } finally {
      setCodexAuthBusy(false);
    }
  };

  // Group models by provider
  const modelsByProvider = modelList.reduce((acc, model) => {
    const provider = model.provider || 'other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});

  const providerCount = Object.keys(modelsByProvider).length;
  const selectedModelObj = modelList.find(m => m.name === selectedModel);

  const saveProviderKey = async (provider) => {
    const apiKey = keyDrafts[provider]?.trim();
    if (!apiKey) return;
    setSavingProvider(provider);
    try {
      await window.api.setProviderApiKey(provider, apiKey);
      setKeyDrafts(prev => ({ ...prev, [provider]: '' }));
      const keys = await window.api.checkApiKeys();
      setApiKeyStatus(keys || {});
    } finally {
      setSavingProvider(null);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading model configuration...</div>;
  }

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Model Configuration</h3>

      {/* Summary */}
      <div className="settings-field">
        <div data-theme-inline="dashboard-overlay-div-1" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
          <span data-theme-inline="dashboard-overlay-span-1">{providerCount} providers, {modelList.length} models configured</span>
        </div>
      </div>

      {/* Currently selected model */}
      {selectedModelObj && (
        <div className="settings-field">
          <label className="settings-label">Currently Selected</label>
          <div data-theme-inline="dashboard-overlay-div-2" style={{ padding: '8px 12px' }}>
            <span data-theme-inline="dashboard-overlay-span-2">{selectedModelObj.display_name}</span>
            <span data-theme-inline="dashboard-overlay-span-3" style={{ marginLeft: 8 }}>({selectedModelObj.provider})</span>
          </div>
        </div>
      )}

      <div className="settings-divider" />

      <h3 className="settings-section-title">Provider Credentials</h3>
      <div className="settings-field codex-provider-auth">
        <label className="settings-label">
          Codex Subscription{codexAuth.connected ? ` · ${codexAuth.planType || 'connected'}` : ''}
        </label>
        <div className="codex-provider-auth-row">
          <div className="codex-provider-auth-copy">
            <strong>{codexAuth.connected ? codexAuth.email || 'ChatGPT connected' : 'Use ChatGPT plan inference'}</strong>
            <span>{codexAuth.error || (codexAuth.connected ? 'Codex is available as a chat provider.' : codexAuth.installed ? 'Sign in through OpenAI to add Codex beside your API providers.' : 'Install the Codex CLI to enable subscription sign-in.')}</span>
          </div>
          <button
            type="button"
            className="settings-btn"
            disabled={codexAuthBusy || (!codexAuth.installed && !codexAuth.connected)}
            onClick={toggleCodexAuth}
          >
            {codexAuthBusy ? 'Opening…' : codexAuth.connected ? 'Disconnect' : 'Connect ChatGPT'}
          </button>
        </div>
      </div>
      {['openai', 'claude', 'gemini'].map(provider => (
        <div className="settings-field" key={`key-${provider}`}>
          <label className="settings-label">
            {provider === 'claude' ? 'Anthropic' : provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key
            {apiKeyStatus[provider] ? ' · saved locally' : ''}
          </label>
          <div className="settings-input-group">
            <input
              type="password"
              className="settings-input"
              value={keyDrafts[provider]}
              onChange={(event) => setKeyDrafts(prev => ({ ...prev, [provider]: event.target.value }))}
              placeholder={apiKeyStatus[provider] ? 'Enter a replacement key' : 'Enter API key'}
            />
            <button
              type="button"
              className="settings-btn"
              disabled={!keyDrafts[provider]?.trim() || savingProvider === provider}
              onClick={() => saveProviderKey(provider)}
            >
              {savingProvider === provider ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ))}

      <div className="settings-divider" />

      {/* Models grouped by provider */}
      {['codex', 'claude', 'openai', 'gemini', 'other'].map(provider => {
        const models = modelsByProvider[provider];
        if (!models || models.length === 0) return null;
        const hasKey = apiKeyStatus[provider];
        const providerLabel =
          provider === 'claude' ? 'Claude' :
          provider === 'codex' ? 'Codex' :
          provider === 'openai' ? 'OpenAI' :
          provider === 'gemini' ? 'Gemini' : 'Other';
        return (
          <div key={provider} style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}>
              <span data-theme-inline="dashboard-overlay-span-4" data-theme-state-color={(hasKey ? '0' : '1')}>
                {providerLabel}
              </span>
              {!hasKey && (
                <span data-theme-inline="dashboard-overlay-span-5">({provider === 'codex' ? 'not connected' : 'no API key'})</span>
              )}
              <span data-theme-inline="dashboard-overlay-span-6">({models.length} models)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {models.map(model => (
                <div
                  key={model.name}
                  data-theme-inline="dashboard-overlay-div-3" data-theme-state-opacity={(hasKey ? '0' : '1')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span data-theme-inline="dashboard-overlay-span-7">{model.display_name}</span>
                    <span data-theme-inline="dashboard-overlay-span-8">{model.model}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {model.max_tokens && (
                      <span data-theme-inline="dashboard-overlay-span-9" style={{ padding: '2px 6px' }}>{(model.max_tokens / 1000).toFixed(0)}k tokens</span>
                    )}
                    {model.supports_thinking && (
                      <span data-theme-inline="dashboard-overlay-span-10" style={{ padding: '2px 6px' }}>thinking</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="settings-divider" />

      <p className="settings-hint" data-theme-inline="dashboard-overlay-settings-hint-1">
        Model selection and provider credentials are stored locally in briizos.db.
      </p>
    </div>
  );
}

function RoutingTab({ isOpen }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState('');
  const [testResults, setTestResults] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setState(await window.api.aiRouting.state());
    } catch (e) {
      setError(e?.message || String(e));
      logger.error('ai.routing', 'Failed to load AI routing state', { reason: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const changeRoute = async (capabilityId, value) => {
    setError('');
    try {
      const updated = await window.api.aiRouting.set(capabilityId, value);
      setState((prev) => prev && { ...prev, capabilities: prev.capabilities.map((c) => (c.id === capabilityId ? updated : c)) });
      setTestResults((prev) => ({ ...prev, [capabilityId]: null }));
    } catch (e) {
      const reason = e?.message || String(e);
      setError(reason);
      logger.error('ai.routing', 'AI routing could not be updated', { capability: capabilityId, reason });
    }
  };

  const testRoute = async (capabilityId) => {
    setTesting(capabilityId);
    setError('');
    try {
      const result = await window.api.aiRouting.test(capabilityId);
      setTestResults((prev) => ({ ...prev, [capabilityId]: result }));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setTesting('');
    }
  };

  if (loading) return <div className="settings-loading">Loading AI routing…</div>;
  if (!state) return <div className="settings-loading">{error || 'AI routing is unavailable.'}</div>;

  const defaultProfile = state.models.find((model) => model.isDefault) || state.models[0] || null;
  const defaultName = defaultProfile ? (defaultProfile.display_name || defaultProfile.name) : 'none configured';

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">AI routing</h3>
      <p className="settings-hint">Choose which model powers each briizOS capability, then test the route. Anything left on “App default” follows the default profile from the Model tab.</p>
      {error && <p className="routing-message is-error" role="alert">{error}</p>}
      <div className="routing-list">
        {state.capabilities.map((capability) => {
          const statusKind = capability.error || capability.incompatible ? 'error' : capability.missingKey ? 'warn' : 'ok';
          const statusText = capability.error
            || capability.incompatible
            || (capability.missingKey ? `No ${capability.provider} API key is saved — add one on the Model tab, or route this elsewhere.` : `Ready · ${capability.provider}`)
            || 'Not configured';
          const result = testResults[capability.id];
          return (
            <div className={`routing-card is-${statusKind}`} key={capability.id}>
              <div className="routing-card-head">
                <span className="routing-status" aria-hidden="true" />
                <div className="routing-card-title">
                  <h4>{capability.label}</h4>
                  <p>{capability.description}</p>
                </div>
                <button type="button" className="routing-test" disabled={testing === capability.id || !!capability.error} onClick={() => testRoute(capability.id)}>
                  {testing === capability.id ? 'testing…' : 'test'}
                </button>
              </div>
              <div className="routing-card-route">
                <select value={capability.override || ''} onChange={(e) => changeRoute(capability.id, e.target.value)} disabled={!!testing} aria-label={`Model for ${capability.label}`}>
                  <option value="">App default — {defaultName}</option>
                  {state.models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.display_name || model.name}{model.provider === 'codex' ? ' · Codex subscription' : ''}
                    </option>
                  ))}
                </select>
                <span className="routing-effective" title="The model a request will actually use right now">
                  {capability.effectiveName || '—'}
                  {capability.provider ? ` · ${capability.provider}` : ''}
                </span>
              </div>
              {capability.journalNote && <p className="routing-note">{capability.journalNote}</p>}
              <p className={`routing-message is-${statusKind}`}>{statusText}</p>
              {result && (
                <p className={`routing-message is-${result.ok ? 'ok' : 'error'}`} role="status">
                  {result.ok ? `Test call succeeded in ${(result.latencyMs / 1000).toFixed(1)} s — the provider accepted a request with this exact routing.` : `Test call failed: ${result.error}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntegrationsTab({
  user, isAuthenticated, settings, handleSettingChange,
  showGithubToken, setShowGithubToken, githubStatus, isValidatingGithub,
  handleGithubTokenChange, gdriveStatus, handleGdriveConnect, handleGdriveDisconnect,
  isConnectingGdrive, handleLogout, isLoggingOut
}) {
  const studioTools = [
    { key: 'studio_video_url', label: 'Video' },
    { key: 'studio_website_url', label: 'Website' },
    { key: 'studio_replicate_url', label: 'Replicate' },
    { key: 'studio_suno_url', label: 'Suno' },
    { key: 'studio_dalle_url', label: 'DALLE' },
    { key: 'studio_ideogram_url', label: 'Ideogram' },
    { key: 'studio_myaudio_url', label: 'MyAudio' },
    { key: 'studio_briizclerk_url', label: 'Briiz-Clerk' }
  ];

  return (
    <div className="settings-section">
      {/* Account */}
      <h3 className="settings-section-title">Account</h3>
      <div className="settings-field">
        {isAuthenticated && user ? (
          <div className="account-info">
            <div className="account-avatar">
              <span className="avatar-letter">
                {user.email ? user.email.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div className="account-details">
              <p className="account-email">{user.email}</p>
              <p className="account-uid">UID: {user.uid}</p>
            </div>
          </div>
        ) : (
          <p className="settings-hint">Not signed in</p>
        )}
      </div>
      <div className="settings-btn-group">
        <button
          className="settings-btn"
          onClick={() => window.api.cloud.promoteThisDevice().catch((error) => logger.warn('sync', 'Primary-device selection failed', error?.message))}
          disabled={!isAuthenticated}
          type="button"
        >
          Make This Mac Primary
        </button>
        <button
          className="settings-btn settings-btn-logout"
          onClick={handleLogout}
          disabled={isLoggingOut || !isAuthenticated}
          type="button"
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <div className="settings-divider" />

      {/* GitHub */}
      <h3 className="settings-section-title">GitHub</h3>
      <div className="settings-field">
        <label className="settings-label">Personal Access Token</label>
        <div className="settings-input-group">
          <input
            type={showGithubToken ? 'text' : 'password'}
            className="settings-input"
            value={settings.github_token || ''}
            onChange={(e) => handleGithubTokenChange(e.target.value)}
            placeholder="ghp_..."
          />
          <button
            className="settings-toggle-btn"
            onClick={() => setShowGithubToken(v => !v)}
            type="button"
          >
            {showGithubToken ? '\u25C9' : '\u25CB'}
          </button>
        </div>
        {isValidatingGithub && (
          <p className="settings-hint settings-validating">Validating token...</p>
        )}
        {githubStatus && !isValidatingGithub && (
          <p className={`settings-hint ${githubStatus.valid ? 'settings-success' : 'settings-error'}`}>
            {githubStatus.valid
              ? `Connected as ${githubStatus.user?.login || 'user'}`
              : `Error: ${githubStatus.error}`}
          </p>
        )}
        <p className="settings-hint">
          Create a token at{' '}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="settings-link">
            github.com/settings/tokens
          </a>
          {' '}with repo scope
        </p>
      </div>

      <div className="settings-divider" />

      {/* Google Drive */}
      <h3 className="settings-section-title">Google Drive</h3>
      <div className="settings-field">
        <div className="settings-integration-status">
          <span className={`status-indicator ${gdriveStatus?.isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {gdriveStatus?.isConnected
              ? 'Connected'
              : gdriveStatus?.status === 'error'
                ? 'Error'
                : 'Not connected'}
          </span>
        </div>
        {gdriveStatus?.error && (
          <p className="settings-hint settings-error">{gdriveStatus.error}</p>
        )}
        <div className="settings-btn-group">
          {gdriveStatus?.isConnected ? (
            <button
              className="settings-btn settings-btn-disconnect"
              onClick={handleGdriveDisconnect}
              type="button"
            >
              Disconnect
            </button>
          ) : (
            <button
              className="settings-btn settings-btn-connect"
              onClick={handleGdriveConnect}
              disabled={isConnectingGdrive}
              type="button"
            >
              {isConnectingGdrive ? 'Connecting...' : 'Connect Google Drive'}
            </button>
          )}
        </div>
        <p className="settings-hint">
          Requires Google API credentials. Visit{' '}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="settings-link">
            Google Cloud Console
          </a>
          {' '}to set up OAuth credentials.
        </p>
      </div>

      <div className="settings-divider" />

      {/* Studio URLs */}
      <h3 className="settings-section-title">Studio URLs</h3>
      <p className="settings-section-desc">
        Configure custom URLs for Studio tools. Leave empty to use defaults.
      </p>
      {studioTools.map(tool => (
        <div className="settings-field" key={tool.key}>
          <label className="settings-label">{tool.label} URL</label>
          <input
            type="url"
            className="settings-input"
            value={settings[tool.key] || ''}
            onChange={(e) => handleSettingChange(tool.key, e.target.value)}
            placeholder={`https://${tool.label.toLowerCase()}.example.com`}
          />
        </div>
      ))}
    </div>
  );
}

function MemoryTab({ isOpen }) {
  const [agentContext, setAgentContext] = useState('');
  const [memorySections, setMemorySections] = useState([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [chunks, setChunks] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(true);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [chunkContent, setChunkContent] = useState('');
  const [chunkContentLoading, setChunkContentLoading] = useState(false);
  const [facts, setFacts] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    loadMemoryData();
  }, [isOpen]);

  const loadMemoryData = async () => {
    // Load agent context
    setContextLoading(true);
    try {
      const sections = await window.api.localData.memory.sections.list();
      setAgentContext(sections.find((section) => section.key === 'agentContext')?.body || '');
      setMemorySections(sections.filter((section) => section.key !== 'agentContext'));
    } catch (err) {
      logger.error('config', 'Failed to load agent context', err?.message);
    } finally {
      setContextLoading(false);
    }

    // Load chunk list
    setChunksLoading(true);
    try {
      const list = await window.api.memoryListChunks();
      setChunks(list || []);
    } catch (err) {
      logger.error('config', 'Failed to list chunks', err?.message);
    } finally {
      setChunksLoading(false);
    }
    window.api.localData.memory.facts.list().then(setFacts)
      .catch((err) => logger.error('config', 'Failed to load memory facts', err?.message));
  };

  const handleContextBlur = async () => {
    try {
      await window.api.localData.memory.sections.update('agentContext', agentContext);
    } catch (err) {
      logger.error('config', 'Failed to save agent context', err?.message);
    }
  };

  const handleSectionBlur = async (section) => {
    try {
      await window.api.localData.memory.sections.update(section.key, section.body);
    } catch (err) {
      logger.error('config', 'Failed to save learned context', err?.message);
    }
  };

  const handleChunkClick = async (filename) => {
    if (selectedChunk === filename) {
      setSelectedChunk(null);
      setChunkContent('');
      return;
    }
    setSelectedChunk(filename);
    setChunkContentLoading(true);
    try {
      const content = await window.api.memoryReadChunk(filename);
      setChunkContent(content || '');
    } catch (err) {
      logger.error('config', 'Failed to read chunk', err?.message);
      setChunkContent('Error loading chunk');
    } finally {
      setChunkContentLoading(false);
    }
  };

  const handleFactDelete = async (factId) => {
    try {
      await window.api.localData.memory.facts.archive(factId);
      setFacts((current) => current.filter((fact) => fact.id !== factId));
    } catch (err) {
      logger.error('config', 'Failed to remove memory fact', err?.message);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="settings-section">
      {/* Agent Context Editor */}
      <h3 className="settings-section-title">Agent Context</h3>
      <div className="settings-field">
        <p className="settings-hint" data-theme-inline="dashboard-overlay-settings-hint-2">
          This local context is included in every AI request as persistent memory.
        </p>
        {contextLoading ? (
          <p className="settings-hint">Loading...</p>
        ) : (
          <textarea
            className="settings-input settings-textarea dashboard-agent-context"
            value={agentContext}
            onChange={(e) => setAgentContext(e.target.value)}
            onBlur={handleContextBlur}
            placeholder="Write persistent context for the AI agent..."
          />
        )}
      </div>

      <div className="settings-divider" />

      <h3 className="settings-section-title">Learned Context</h3>
      {memorySections.map((section) => (
        <div className="settings-field" key={section.key}>
          <label className="settings-label">{section.title}</label>
          <textarea
            className="settings-input settings-textarea"
            value={section.body}
            onChange={(event) => setMemorySections((current) => current.map((item) => (
              item.key === section.key ? { ...item, body: event.target.value } : item
            )))}
            onBlur={() => handleSectionBlur(section)}
            placeholder="The agent has not learned anything for this section yet."
          />
        </div>
      ))}

      <div className="settings-divider" />

      <h3 className="settings-section-title">Remembered Facts</h3>
      <div className="settings-field">
        {facts.length === 0 ? (
          <p className="settings-hint">No durable facts learned yet.</p>
        ) : facts.map((fact) => (
          <div className="memory-fact-item" key={fact.id}>
            <span className="memory-fact-category">{fact.category}</span>
            <span>{fact.content}</span>
            <button type="button" className="memory-fact-delete" onClick={() => handleFactDelete(fact.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="settings-divider" />

      <h3 className="settings-section-title">Conversation Summaries</h3>
      <div className="settings-field">
        {chunksLoading ? (
          <p className="settings-hint">Loading summaries...</p>
        ) : chunks.length === 0 ? (
          <p className="settings-hint">No long-conversation summaries yet.</p>
        ) : (
          <div className="dashboard-chunk-list">
            {chunks.map(chunk => (
              <button
                key={chunk.filename}
                className={`dashboard-chunk-item ${selectedChunk === chunk.filename ? 'active' : ''}`}
                onClick={() => handleChunkClick(chunk.filename)}
                type="button"
              >
                <span className="dashboard-chunk-name">{chunk.threadId || chunk.filename}</span>
                <span className="dashboard-chunk-size">{formatSize(chunk.size)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chunk Preview */}
      {selectedChunk && (
        <div className="settings-field">
          <label className="settings-label">Summary preview</label>
          {chunkContentLoading ? (
            <p className="settings-hint">Loading content...</p>
          ) : (
            <pre className="dashboard-chunk-preview">{chunkContent}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function _normalizeSurface(x) {
  const src = x && typeof x === 'object' ? x : {};
  const bl = src.blacklist || {};
  return {
    mode: ['ask-always', 'ask-destructive', 'no-asking'].includes(src.mode) ? src.mode : 'ask-always',
    blacklist: {
      paths: Array.isArray(bl.paths) ? bl.paths : [],
      filetypes: Array.isArray(bl.filetypes) ? bl.filetypes : [],
    },
  };
}

const PERM_SURFACES = [
  { key: 'chat', label: 'Chat', desc: 'Tools the agent uses while you chat with it (a human is present).' },
  { key: 'task', label: 'Task agents', desc: 'Tools used by background task automation. Runs headless; a per-task request may choose a stricter level but can never exceed this.' },
];

const PERM_MODES = [
  { value: 'ask-always', label: 'Ask always', desc: 'Confirm before every destructive tool (bash, file writes, mutations).' },
  { value: 'ask-destructive', label: 'Ask destructive only', desc: 'Confirm only genuinely destructive operations; reversible UI actions pass.' },
  { value: 'no-asking', label: 'No asking', desc: 'Execute destructive tools without confirmation (blacklist still blocks).' },
];

function PermissionsTab({ isOpen }) {
  const EMPTY = { mode: 'ask-always', blacklist: { paths: [], filetypes: [] } };
  const [perm, setPerm] = useState({ chat: EMPTY, task: EMPTY });
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ chat: { path: '', ft: '' }, task: { path: '', ft: '' } });

  useEffect(() => {
    if (!isOpen) return;
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await window.api.agentGetConfig();
      const pcfg = config?.permissions || {};
      setPerm({ chat: _normalizeSurface(pcfg.chat), task: _normalizeSurface(pcfg.task) });
    } catch (err) {
      logger.error('config', 'Failed to load permissions', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (next) => {
    setPerm(next);
    try {
      await window.api.agentUpdateConfig({ permissions: { chat: next.chat, task: next.task } });
    } catch (err) {
      logger.error('config', 'Failed to save permissions', err?.message);
    }
  };

  const setMode = (sk, mode) => persist({ ...perm, [sk]: { ...perm[sk], mode } });

  const addPath = (sk) => {
    const t = draft[sk].path.trim();
    if (!t || perm[sk].blacklist.paths.includes(t)) return;
    const next = { ...perm, [sk]: { ...perm[sk], blacklist: { ...perm[sk].blacklist, paths: [...perm[sk].blacklist.paths, t] } } };
    setDraft((d) => ({ ...d, [sk]: { ...d[sk], path: '' } }));
    persist(next);
  };

  const removePath = (sk, pth) => {
    const next = { ...perm, [sk]: { ...perm[sk], blacklist: { ...perm[sk].blacklist, paths: perm[sk].blacklist.paths.filter((x) => x !== pth) } } };
    persist(next);
  };

  const addFt = (sk) => {
    let t = draft[sk].ft.trim();
    if (!t) return;
    if (!t.startsWith('.')) t = '.' + t;
    if (perm[sk].blacklist.filetypes.includes(t)) return;
    const next = { ...perm, [sk]: { ...perm[sk], blacklist: { ...perm[sk].blacklist, filetypes: [...perm[sk].blacklist.filetypes, t] } } };
    setDraft((d) => ({ ...d, [sk]: { ...d[sk], ft: '' } }));
    persist(next);
  };

  const removeFt = (sk, ft) => {
    const next = { ...perm, [sk]: { ...perm[sk], blacklist: { ...perm[sk].blacklist, filetypes: perm[sk].blacklist.filetypes.filter((x) => x !== ft) } } };
    persist(next);
  };

  if (loading) {
    return <div className="settings-loading">Loading permissions...</div>;
  }

  return (
    <div className="settings-section">
      <p className="settings-hint" data-theme-inline="dashboard-overlay-settings-hint-3">
        Two independent permission policies. The agent cannot bypass these.
        <strong> Task agents</strong> run headless &mdash; if a tool needs
        confirmation the run can&rsquo;t grant, that task pauses for you.
      </p>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {PERM_SURFACES.map((sf) => {
          const cur = perm[sf.key];
          return (
            <div key={sf.key} style={{ flex: 1, minWidth: 0 }}>
              <h3 className="settings-section-title">{sf.label}</h3>
              <p className="settings-hint">{sf.desc}</p>
              <div className="settings-radio-group">
                {PERM_MODES.map((m) => (
                  <label className="settings-radio" key={m.value}>
                    <input
                      type="radio"
                      name={`perm-mode-${sf.key}`}
                      value={m.value}
                      checked={cur.mode === m.value}
                      onChange={() => setMode(sf.key, m.value)}
                    />
                    <span className="radio-label">{m.label}</span>
                    <span className="radio-desc">{m.desc}</span>
                  </label>
                ))}
              </div>

              <div className="settings-divider" />
              <h3 className="settings-section-title">Blacklist &mdash; Paths</h3>
              <div className="dashboard-blacklist-table">
                {cur.blacklist.paths.length === 0 ? (
                  <p className="settings-hint">No blocked paths.</p>
                ) : (
                  cur.blacklist.paths.map((pth) => (
                    <div className="dashboard-blacklist-row" key={pth}>
                      <span className="dashboard-blacklist-value">{pth}</span>
                      <button className="dashboard-blacklist-remove" type="button" onClick={() => removePath(sf.key, pth)} title="Remove">&times;</button>
                    </div>
                  ))
                )}
              </div>
              <div className="settings-input-group">
                <input
                  type="text"
                  className="settings-input"
                  value={draft[sf.key].path}
                  onChange={(e) => setDraft((d) => ({ ...d, [sf.key]: { ...d[sf.key], path: e.target.value } }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') addPath(sf.key); }}
                  placeholder="/path/to/block"
                />
                <button className="settings-btn settings-btn-connect" type="button" onClick={() => addPath(sf.key)} disabled={!draft[sf.key].path.trim()}>Add</button>
              </div>

              <div className="settings-divider" />
              <h3 className="settings-section-title">Blacklist &mdash; File Types</h3>
              <div className="dashboard-blacklist-table">
                {cur.blacklist.filetypes.length === 0 ? (
                  <p className="settings-hint">No blocked file types.</p>
                ) : (
                  cur.blacklist.filetypes.map((ft) => (
                    <div className="dashboard-blacklist-row" key={ft}>
                      <span className="dashboard-blacklist-value">{ft}</span>
                      <button className="dashboard-blacklist-remove" type="button" onClick={() => removeFt(sf.key, ft)} title="Remove">&times;</button>
                    </div>
                  ))
                )}
              </div>
              <div className="settings-input-group">
                <input
                  type="text"
                  className="settings-input"
                  value={draft[sf.key].ft}
                  onChange={(e) => setDraft((d) => ({ ...d, [sf.key]: { ...d[sf.key], ft: e.target.value } }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') addFt(sf.key); }}
                  placeholder=".pem"
                />
                <button className="settings-btn settings-btn-connect" type="button" onClick={() => addFt(sf.key)} disabled={!draft[sf.key].ft.trim()}>Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HealthTab({ isOpen }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    runHealthCheck();
  }, [isOpen]);

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.healthCheck();
      setHealthData(result);
      logger.info('config', 'Health check completed', result);
    } catch (err) {
      logger.error('config', 'Health check failed', err?.message);
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Running health check...</div>;
  }

  if (error) {
    return (
      <div className="settings-section">
        <h3 className="settings-section-title">Health Check Error</h3>
        <p className="settings-hint settings-error">{error}</p>
        <button className="settings-btn settings-btn-connect" onClick={runHealthCheck} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="settings-section">
      {/* Directories */}
      <h3 className="settings-section-title">Directories</h3>
      <div className="settings-field">
        <div className="dashboard-blacklist-table">
          {Object.entries(healthData.directories).map(([name, exists]) => (
            <div className="dashboard-blacklist-row" key={name}>
              <span data-theme-inline="dashboardoverlay-span-state-8" data-theme-state-color={(exists ? '0' : '1')} style={{ marginRight: 8 }}>
                {exists ? '\u2713' : '\u2717'}
              </span>
              <span className="dashboard-blacklist-value">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      {/* AI Providers */}
      <h3 className="settings-section-title">AI Providers</h3>
      <div className="settings-field">
        {healthData.aiProviders && healthData.aiProviders.length > 0 ? (
          <div className="dashboard-blacklist-table">
            {healthData.aiProviders.map(provider => (
              <div className="dashboard-blacklist-row" key={provider}>
                <span data-theme-inline="dashboard-overlay-span-11" style={{ marginRight: 8 }}>{'\u2713'}</span>
                <span className="dashboard-blacklist-value">{provider}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="settings-hint">No AI providers configured.</p>
        )}
      </div>

      <div className="settings-divider" />

      {/* System Info */}
      <h3 className="settings-section-title">System Info</h3>
      <div className="settings-field">
        <div className="dashboard-blacklist-table">
          <div className="dashboard-blacklist-row">
            <span className="dashboard-blacklist-value">
              Electron: {healthData.electronVersion}
            </span>
          </div>
          <div className="dashboard-blacklist-row">
            <span className="dashboard-blacklist-value">
              Node: {healthData.nodeVersion}
            </span>
          </div>
          <div className="dashboard-blacklist-row">
            <span className="dashboard-blacklist-value">
              Platform: {healthData.platform}
            </span>
          </div>
          <div className="dashboard-blacklist-row">
            <span className="dashboard-blacklist-value">
              Architecture: {healthData.arch}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Timestamp */}
      <h3 className="settings-section-title">Timestamp</h3>
      <div className="settings-field">
        <p className="settings-hint" data-theme-inline="dashboard-overlay-settings-hint-4">
          {new Date(healthData.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Re-run button */}
      <div className="settings-field">
        <button className="settings-btn settings-btn-connect" onClick={runHealthCheck} type="button">
          Re-run Health Check
        </button>
      </div>
    </div>
  );
}

function ThemeChatBgPicker({ theme, onClose, getThemeChatBackground, onSave }) {
  const current = getThemeChatBackground(theme);
  const [selectedBg, setSelectedBg] = useState(() => current?.background || '');
  const [blur, setBlur] = useState(() => current?.blur || 0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = () => {
    onSave(theme, selectedBg, blur);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="theme-chat-bg-picker"
    >
      <div className="theme-chat-bg-picker-header">
        <span className="theme-chat-bg-picker-title">ChatView for: {theme || 'default'}</span>
        <button className="theme-chat-bg-picker-close" onClick={onClose} type="button">&times;</button>
      </div>
      <div className="theme-chat-bg-picker-body">
        <div className="chat-bg-section-label">Backgrounds</div>
        {CHAT_BACKGROUNDS.map((bg) => (
          <button
            key={bg.value}
            className={`chat-bg-option ${selectedBg === bg.value ? 'active' : ''}`}
            onClick={() => setSelectedBg(bg.value)}
            type="button"
          >
            {bg.label}
          </button>
        ))}
        <div className="chat-bg-blur-slider">
          <label>Blur: {blur}px</label>
          <input
            type="range"
            min="0" max="30" step="1"
            value={blur}
            onChange={(e) => setBlur(parseInt(e.target.value))}
          />
        </div>
        <div className="theme-chat-bg-picker-actions">
          <button className="settings-btn settings-btn-connect" onClick={handleSave} type="button">
            Save
          </button>
          <button className="settings-btn" onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeRadio({ value, label, desc, currentTheme, handleThemeChange, chatView, onOpenChatViewPicker, onRestoreDefault }) {
  const handleButtonClick = (e) => {
    e.preventDefault();
    onOpenChatViewPicker(value);
  };

  const handleRestoreClick = (e) => {
    e.preventDefault();
    onRestoreDefault();
  };

  return (
    <label className="settings-radio settings-radio-theme">
      <input
        type="radio"
        name="ui-theme"
        value={value}
        checked={currentTheme === value}
        onChange={(e) => handleThemeChange(e.target.value)}
      />
      <div className="radio-theme-content">
        <div className="radio-theme-info">
          <span className="radio-label">{label}</span>
          <span className="radio-desc">{desc}</span>
        </div>
        <button
          className="settings-choose-chatview-btn"
          onClick={handleButtonClick}
          title="Choose ChatView background"
          type="button"
        >
          Choose ChatView{chatView ? `: ${chatView.label || '✓'}` : ''}
        </button>
        {onRestoreDefault && (
          <button
            className="settings-choose-chatview-btn"
            onClick={handleRestoreClick}
            title="Restore this theme's original built-in appearance"
            type="button"
          >
            Restore default
          </button>
        )}
      </div>
    </label>
  );
}

function DockStylePreview({ style }) {
  return (
    <span className={`dock-style-preview dock-style-preview--${style}`} aria-hidden="true">
      <span className="dock-style-preview-track">
        {DOCK_PREVIEW_ITEMS.map((item, index) => (
          <span
            key={item.id}
            className={`dock-style-preview-item ${index === 1 ? 'is-active' : ''}`}
            style={{ '--dock-preview-accent': item.accent }}
          >
            {style === 'tabs' && (
              <svg className="dock-style-preview-tab" viewBox="0 0 56 32" preserveAspectRatio="none">
                <path d={DOCK_PREVIEW_TAB_PATH} />
              </svg>
            )}
            <span className="dock-style-preview-glyph">{item.glyph}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function AppearanceTab({
  getThemeChatBackground,
  onOpenChatViewPicker,
  openPickerForTheme,
  onPickerSave,
  onOpenThemeStudio,
  headerDockStyle,
  onHeaderDockStyleChange,
  headerDockOrientation,
  onHeaderDockOrientationChange,
}) {
  const theme = useTheme();
  const currentTheme = theme.activeThemeId || 'default';
  const verticalDockAvailable = headerDockStyle === HEADER_DOCK_STYLES.CURRENT;

  const handleThemeChange = async (themeId) => {
    await theme.selectTheme(themeId);
  };

  const handleRestoreDefault = async (themeId) => {
    const label = theme.builtInThemes.find((item) => item.id === themeId)?.label || 'this theme';
    if (!window.confirm(`Restore "${label}" to its original built-in appearance? Your edits will be removed.`)) return;
    try { await theme.restoreDefault(themeId); }
    catch (error) { theme.setWarning?.(`Could not restore default: ${error.message}`); }
  };

  // A saved custom theme can share an id with a built-in (see "Replace default"
  // in Theme Studio) to intentionally shadow it. Substitute it in place rather
  // than listing both — otherwise two rows share a React key and the id looks
  // duplicated to the user.
  const overridesById = new Map(
    theme.customThemes.filter((item) => theme.builtInThemes.some((built) => built.id === item.id)).map((item) => [item.id, item]),
  );
  const extraCustomThemes = theme.customThemes.filter((item) => !overridesById.has(item.id));
  const visibleThemes = [
    ...theme.builtInThemes.map((item) => overridesById.get(item.id) || item),
    ...extraCustomThemes,
  ];

  const getChatViewLabel = (themeKey) => {
    const entry = getThemeChatBackground(themeKey);
    if (!entry || !entry.background) return null;
    const all = CHAT_BACKGROUNDS;
    const found = all.find(b => b.value === entry.background);
    return found ? { label: found.label } : { label: '✓' };
  };

  return (
    <div className="settings-section">
      <div className="appearance-interface-block">
        <h3 className="settings-section-title">Interface</h3>
        <DockAppearanceSettings />
        <fieldset className="dock-style-options">
          <legend className="appearance-visually-hidden">Header dock style</legend>
          {HEADER_DOCK_STYLE_OPTIONS.map((option) => (
            <label className="dock-style-option" key={option.id}>
              <input
                type="radio"
                name="header-dock-style"
                value={option.id}
                checked={headerDockStyle === option.id}
                onChange={() => onHeaderDockStyleChange(option.id)}
              />
              <DockStylePreview style={option.id} />
              <span className="dock-style-option-copy">
                <span className="dock-style-option-label">{option.label}</span>
                <span className="dock-style-option-description">{option.description}</span>
              </span>
              <span className="dock-style-option-check" aria-hidden="true">✓</span>
            </label>
          ))}
        </fieldset>

        <div className="dock-orientation-setting">
          <span className="dock-orientation-copy">
          </span>
          <fieldset className="dock-orientation-options" aria-describedby="dock-orientation-hint">
            <legend className="appearance-visually-hidden">Header position</legend>
            {[HEADER_DOCK_ORIENTATIONS.HORIZONTAL, HEADER_DOCK_ORIENTATIONS.VERTICAL].map((orientation) => {
              const disabled = orientation === HEADER_DOCK_ORIENTATIONS.VERTICAL && !verticalDockAvailable;
              return (
                <label
                  className={`dock-orientation-option ${disabled ? 'is-disabled' : ''}`}
                  key={orientation}
                  title={disabled ? 'Choose Ambient to use the vertical header' : undefined}
                >
                  <input
                    type="radio"
                    name="header-dock-orientation"
                    value={orientation}
                    checked={headerDockOrientation === orientation}
                    disabled={disabled}
                    onChange={() => onHeaderDockOrientationChange(orientation)}
                  />
                  <span className={`dock-orientation-mark dock-orientation-mark--${orientation}`} aria-hidden="true" />
                  <span>{orientation === HEADER_DOCK_ORIENTATIONS.HORIZONTAL ? 'Horizontal' : 'Vertical'}</span>
                </label>
              );
            })}
          </fieldset>
        </div>
      </div>

      <div className="appearance-section-rule" />

      <h3 className="settings-section-title">Theme
        <button className="settings-btn settings-btn-connect appearance-theme-studio-btn" type="button" onClick={onOpenThemeStudio}>
          Open Theme Studio
        </button></h3>


      <div className="settings-radio-group">
        {visibleThemes.map((item) => {
          const isOverride = overridesById.has(item.id);
          return (
            <ThemeRadio
              key={item.id}
              value={item.id}
              label={item.label || item.name}
              desc={isOverride ? 'Your edited version — replaces the built-in default.' : (item.description || `Custom theme based on ${item.baseThemeId}.`)}
              currentTheme={currentTheme}
              handleThemeChange={handleThemeChange}
              chatView={getChatViewLabel(item.id)}
              onOpenChatViewPicker={onOpenChatViewPicker}
              onRestoreDefault={isOverride ? () => handleRestoreDefault(item.id) : null}
            />
          );
        })}
      </div>

      {openPickerForTheme && (
        <ThemeChatBgPicker
          theme={openPickerForTheme}
          onClose={() => onOpenChatViewPicker(null)}
          getThemeChatBackground={getThemeChatBackground}
          onSave={onPickerSave}
        />
      )}
    </div>
  );
}

/**
 * briizy tab — screen capture, assistants, and history controls. The same
 * component the Notefalls drawer shows, so the two never disagree; this tab is
 * the findable home for it.
 */
function BriizyTab() {
  const capture = useBriizyCapture();
  if (!capture.available) {
    return (
      <div className="settings-section">
        <h3 className="settings-section-title">briizy — screen memory</h3>
        <p className="settings-hint">briizy is not available in this build.</p>
      </div>
    );
  }
  return (
    <div className="settings-section">
      <CaptureSettingsPanel capture={capture} />
    </div>
  );
}

/* ─────────────────────
   Main DashboardOverlay
   ───────────────────── */

function DashboardOverlay({
  isOpen,
  onClose,
  onOpenThemeStudio,
  initialTab,
  headerDockStyle,
  onHeaderDockStyleChange,
  headerDockOrientation,
  onHeaderDockOrientationChange,
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const { setThemeChatBackground, getThemeChatBackground } = useChatSettings();

  const [activeTab, setActiveTab] = useState('model');
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState(null);
  const [isConnectingGdrive, setIsConnectingGdrive] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openPickerForTheme, setOpenPickerForTheme] = useState(null);
  const settingsHydratedRef = useRef(false);
  const lastSavedSettingsRef = useRef('');
  const saveRevisionRef = useRef(0);

  // Load settings when overlay opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadGdriveStatus();
    }
  }, [isOpen]);

  // The menu-bar item can ask for a specific tab (e.g. "Settings…" → briizy).
  useEffect(() => {
    if (isOpen && initialTab) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const loadSettings = async () => {
    setIsLoading(true);
    settingsHydratedRef.current = false;
    try {
      const allSettings = await window.api.localData.settings.list();
      const dashboardSettings = { ...allSettings };
      delete dashboardSettings.ui_theme;
      delete dashboardSettings.ui_theme_library;
      lastSavedSettingsRef.current = JSON.stringify(dashboardSettings);
      setSettings(dashboardSettings);
      setSaveStatus('idle');
      settingsHydratedRef.current = true;
    } catch (error) {
      logger.error('config', 'Failed to load settings', error?.message);
      setSaveStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGdriveStatus = async () => {
    try {
      const status = await window.api.gdriveGetStatus();
      setGdriveStatus(status);
    } catch (error) {
      logger.error('config', 'Failed to load Google Drive status', error?.message);
    }
  };

  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleOpenChatViewPicker = useCallback((theme) => {
    setOpenPickerForTheme(theme);
  }, []);

  const handlePickerSave = useCallback((theme, background, blur) => {
    setThemeChatBackground(theme, background, blur);
  }, [setThemeChatBackground]);

  const persistSettings = useCallback(async (settingsSnapshot, revision) => {
    setSaveStatus('saving');
    try {
      for (const [key, value] of Object.entries(settingsSnapshot)) {
        if (!['github_token', 'ui_theme', 'ui_theme_library'].includes(key)) {
          await window.api.localData.settings.set(key, value);
        }
      }
      if (settingsSnapshot.github_token && window.api?.githubSetToken) {
        await window.api.githubSetToken(settingsSnapshot.github_token);
      }
      logger.info('settings.saved', 'Settings updated');
      if (revision === saveRevisionRef.current) {
        lastSavedSettingsRef.current = JSON.stringify(settingsSnapshot);
        setSaveStatus('saved');
      }
      return true;
    } catch (error) {
      logger.error('config', 'Failed to save settings', error?.message);
      if (revision === saveRevisionRef.current) setSaveStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || isLoading || !settingsHydratedRef.current) return undefined;
    const serializedSettings = JSON.stringify(settings);
    if (serializedSettings === lastSavedSettingsRef.current) return undefined;

    const revision = ++saveRevisionRef.current;
    setSaveStatus('pending');
    const timeoutId = window.setTimeout(() => {
      persistSettings(settings, revision);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, isOpen, persistSettings, settings]);

  const closeDashboard = useCallback(async () => {
    const serializedSettings = JSON.stringify(settings);
    if (settingsHydratedRef.current && serializedSettings !== lastSavedSettingsRef.current) {
      const revision = ++saveRevisionRef.current;
      const saved = await persistSettings(settings, revision);
      if (!saved) return;
    }
    onClose();
  }, [onClose, persistSettings, settings]);

  const handleGdriveConnect = async () => {
    setIsConnectingGdrive(true);
    try {
      const result = await window.api.gdriveConnect();
      if (result.requiresCredentials) {
        await window.api.gdriveOpenSetup();
      }
      await loadGdriveStatus();
      logger.info('gdrive.connect', result.error || 'Connection attempted');
    } catch (error) {
      logger.error('config', 'Failed to connect to Google Drive', error?.message);
    } finally {
      setIsConnectingGdrive(false);
    }
  };

  const handleGdriveDisconnect = async () => {
    try {
      await window.api.gdriveDisconnect();
      await loadGdriveStatus();
      logger.info('gdrive.disconnect', 'Disconnected from Google Drive');
    } catch (error) {
      logger.error('config', 'Failed to disconnect from Google Drive', error?.message);
    }
  };

  const validateGithubToken = async (token) => {
    if (!token || token.trim() === '') {
      setGithubStatus(null);
      return;
    }
    setIsValidatingGithub(true);
    try {
      const result = await window.api.githubValidateToken(token);
      setGithubStatus(result);
    } catch (error) {
      setGithubStatus({ valid: false, error: error.message });
    } finally {
      setIsValidatingGithub(false);
    }
  };

  const handleGithubTokenChange = useCallback((token) => {
    handleSettingChange('github_token', token);
    if (token.length > 10) {
      validateGithubToken(token);
    } else {
      setGithubStatus(null);
    }
  }, [handleSettingChange]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (error) {
      logger.error('config', 'Logout failed', error?.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeDashboard();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeDashboard();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'model', label: 'Model' },
    { id: 'routing', label: 'AI routing' },
    { id: 'briizy', label: 'briizy' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'memory', label: 'Memory' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'health', label: 'Health' }
  ];

  const saveStatusCopy = {
    pending: 'Waiting to save',
    saving: 'Saving',
    saved: 'Autosaved',
    error: 'Save failed',
  }[saveStatus];

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="modal-container dashboard-modal-container" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="dashboard-title">Dashboard</h2>
          <div className="modal-header-drag"></div>
          <div className="modal-header-actions">
            {saveStatus !== 'idle' && (
              <div
                className={`modal-autosave-status is-${saveStatus}`}
                role="status"
                aria-live="polite"
                title={saveStatusCopy}
              >
                {saveStatus === 'error' ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.25a7.75 7.75 0 1 1 0 15.5 7.75 7.75 0 0 1 0-15.5Zm0 3.1v5.2m0 3.1v.1" /></svg>
                ) : saveStatus === 'saved' ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.2 8.2 14l7.3-8" /></svg>
                ) : (
                  <svg className="modal-autosave-spinner" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.6 7A7 7 0 1 0 17 11" /><path d="m13.7 3.7 3.1 3.5 1.4-4.4" /></svg>
                )}
                <span>{saveStatusCopy}</span>
              </div>
            )}
            <button className="modal-close-btn" onClick={closeDashboard} aria-label="Close Dashboard">&times;</button>
          </div>
        </div>

        <div className="modal-workspace">
          {/* Tabs */}
          <div className="modal-tabs" role="tablist" aria-label="Dashboard sections" aria-orientation="vertical">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`dashboard-tab-${tab.id}`}
                className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="dashboard-tab-panel"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            className="modal-content"
            id="dashboard-tab-panel"
            role="tabpanel"
            aria-labelledby={`dashboard-tab-${activeTab}`}
          >
          {isLoading && activeTab !== 'routing' && activeTab !== 'memory' && activeTab !== 'permissions' && activeTab !== 'health' && activeTab !== 'briizy' ? (
            <div className="settings-loading">Loading settings...</div>
          ) : (
            <>
              {activeTab === 'model' && (
                <ModelTab isOpen={isOpen} />
              )}

              {activeTab === 'routing' && (
                <RoutingTab isOpen={isOpen} />
              )}

              {activeTab === 'briizy' && (
                <BriizyTab />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab
                  getThemeChatBackground={getThemeChatBackground}
                  onOpenChatViewPicker={handleOpenChatViewPicker}
                  openPickerForTheme={openPickerForTheme}
                  onPickerSave={handlePickerSave}
                  onOpenThemeStudio={onOpenThemeStudio}
                  headerDockStyle={headerDockStyle}
                  onHeaderDockStyleChange={onHeaderDockStyleChange}
                  headerDockOrientation={headerDockOrientation}
                  onHeaderDockOrientationChange={onHeaderDockOrientationChange}
                />
              )}

              {activeTab === 'integrations' && (
                <IntegrationsTab
                  user={user}
                  isAuthenticated={isAuthenticated}
                  settings={settings}
                  handleSettingChange={handleSettingChange}
                  showGithubToken={showGithubToken}
                  setShowGithubToken={setShowGithubToken}
                  githubStatus={githubStatus}
                  isValidatingGithub={isValidatingGithub}
                  handleGithubTokenChange={handleGithubTokenChange}
                  gdriveStatus={gdriveStatus}
                  handleGdriveConnect={handleGdriveConnect}
                  handleGdriveDisconnect={handleGdriveDisconnect}
                  isConnectingGdrive={isConnectingGdrive}
                  handleLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                />
              )}

              {activeTab === 'memory' && (
                <MemoryTab isOpen={isOpen} />
              )}

              {activeTab === 'permissions' && (
                <PermissionsTab isOpen={isOpen} />
              )}

              {activeTab === 'health' && (
                <HealthTab isOpen={isOpen} />
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverlay;
