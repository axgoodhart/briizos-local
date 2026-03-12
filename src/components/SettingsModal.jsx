import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllSettings, setSetting, addLog } from '../lib/firestore';
import { useChatSettings } from '../context/ChatSettingsContext';
import logger from '../lib/logger';

function SettingsModal({ isOpen, onClose }) {
  const { user, logout, isAuthenticated } = useAuth();
  const chatSettings = useChatSettings();
  const [activeTab, setActiveTab] = useState('account');
  const [aiSubTab, setAiSubTab] = useState('openai');
  const [showKeys, setShowKeys] = useState({ openai: false, gemini: false, claude: false, openclaw: false });
  const [settings, setSettings] = useState({});
  const [gatewayStatus, setGatewayStatus] = useState(null); // null | 'checking' | 'online' | 'offline' | 'launching'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState(null);
  const [isConnectingGdrive, setIsConnectingGdrive] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [memoryData, setMemoryData] = useState(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [deletingFact, setDeletingFact] = useState(null);

  const loadMemoryData = async () => {
    setMemoryLoading(true);
    try {
      const result = await window.api.memoryGetData();
      setMemoryData(result);
    } catch (error) {
      logger.error('config', 'Failed to load memory data', error?.message);
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleDeleteFact = async (factId) => {
    setDeletingFact(factId);
    try {
      const result = await window.api.memoryDeleteFact(factId);
      if (result?.success) {
        setMemoryData(prev => prev ? {
          ...prev,
          data: {
            ...prev.data,
            facts: prev.data.facts.filter(f => f.id !== factId)
          }
        } : prev);
      }
    } catch (error) {
      logger.error('config', 'Failed to delete fact', error?.message);
    } finally {
      setDeletingFact(null);
    }
  };

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadGdriveStatus();
      if (activeTab === 'memory') loadMemoryData();
    }
  }, [isOpen]);

  // Load memory data when switching to memory tab
  useEffect(() => {
    if (activeTab === 'memory' && memoryData === null && isOpen) {
      loadMemoryData();
    }
  }, [activeTab]);

  const loadGdriveStatus = async () => {
    try {
      const status = await window.api.gdriveGetStatus();
      setGdriveStatus(status);
    } catch (error) {
      logger.error('config', 'Failed to load Google Drive status', error?.message);
    }
  };

  const handleGdriveConnect = async () => {
    setIsConnectingGdrive(true);
    try {
      const result = await window.api.gdriveConnect();
      if (result.requiresCredentials) {
        // Open setup guide if credentials are missing
        await window.api.gdriveOpenSetup();
      }
      await loadGdriveStatus();
      await addLog('gdrive_connect', result.error || 'Connection attempted');
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
      await addLog('gdrive_disconnect', 'Disconnected from Google Drive');
    } catch (error) {
      logger.error('config', 'Failed to disconnect from Google Drive', error?.message);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const allSettings = await getAllSettings();
      setSettings(allSettings);
      // Push GitHub token to main process if available
      if (allSettings.github_token && window.api?.githubSetToken) {
        window.api.githubSetToken(allSettings.github_token);
      }
    } catch (error) {
      logger.error('config', 'Failed to load settings', error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all settings
      for (const [key, value] of Object.entries(settings)) {
        await setSetting(key, value);
      }
      // Push GitHub token to main process
      if (settings.github_token && window.api?.githubSetToken) {
        window.api.githubSetToken(settings.github_token);
      }
      await addLog('settings_saved', 'Settings updated');
      onClose();
    } catch (error) {
      logger.error('config', 'Failed to save settings', error?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

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

  const handleGithubTokenChange = (token) => {
    handleSettingChange('github_token', token);
    // Debounce validation
    if (token.length > 10) {
      validateGithubToken(token);
    } else {
      setGithubStatus(null);
    }
  };


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

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'api', label: 'API Config' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'memory', label: 'Memory' },
    { id: 'model', label: 'AI Model' },
    { id: 'studio', label: 'Studio URLs' }
  ];

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
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="modal-content">
          {isLoading ? (
            <div className="settings-loading">Loading settings...</div>
          ) : (
            <>
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="settings-section">
                  <h3 className="settings-section-title">Account Information</h3>
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

                  <div className="settings-divider" />

                  <h3 className="settings-section-title">Session</h3>
                  <div className="settings-field">
                    <p className="settings-hint">
                      Your data is synced securely to the cloud and accessible from any device with your account.
                    </p>
                    <div className="settings-btn-group" style={{ marginTop: '1rem' }}>
                      <button
                        className="settings-btn settings-btn-logout"
                        onClick={handleLogout}
                        disabled={isLoggingOut || !isAuthenticated}
                        type="button"
                      >
                        {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Config Tab */}
              {activeTab === 'api' && (
                <div className="settings-section">
                  <div className="settings-field">
                    <label className="settings-label">OpenAI API Key</label>
                    <div className="settings-input-group">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        className="settings-input"
                        value={settings.openai_api_key || ''}
                        onChange={(e) => handleSettingChange('openai_api_key', e.target.value)}
                        placeholder="sk-..."
                      />
                      <button
                        className="settings-toggle-btn"
                        onClick={() => setShowApiKey(!showApiKey)}
                        type="button"
                      >
                        {showApiKey ? '◉' : '○'}
                      </button>
                    </div>
                    <p className="settings-hint">
                      Leave empty to use OPENAI_API_KEY environment variable
                    </p>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="settings-section">
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
                        onClick={() => setShowGithubToken(!showGithubToken)}
                        type="button"
                      >
                        {showGithubToken ? '◉' : '○'}
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
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="settings-link"
                      >
                        github.com/settings/tokens
                      </a>
                      {' '}with repo scope
                    </p>
                  </div>

                  <div className="settings-divider" />

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
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="settings-link"
                      >
                        Google Cloud Console
                      </a>
                      {' '}to set up OAuth credentials.
                    </p>
                  </div>
                </div>
              )}

              {/* AI Model Tab - Full Provider Settings */}
              {activeTab === 'model' && chatSettings && (
                <div className="settings-section">
                  {/* Provider tabs */}
                  <div className="settings-provider-tabs">
                    {['openai', 'gemini', 'claude', 'openclaw'].map(p => (
                      <button
                        key={p}
                        className={`provider-tab ${chatSettings.provider === p ? 'active' : ''}`}
                        onClick={() => {
                          chatSettings.setProvider(p);
                          setAiSubTab(p);
                          if (p === 'openclaw' && window.api?.openclawGatewayStatus) {
                            setGatewayStatus('checking');
                            window.api.openclawGatewayStatus().then(r => setGatewayStatus(r.online ? 'online' : 'offline'));
                          }
                        }}
                        type="button"
                      >
                        {p === 'openai' ? 'OpenAI' : p === 'gemini' ? 'Gemini' : p === 'claude' ? 'Claude' : 'OpenClaw'}
                      </button>
                    ))}
                  </div>

                  {/* Model dropdown */}
                  <div className="settings-field">
                    <label className="settings-label">Model</label>
                    <select
                      className="settings-input settings-select"
                      value={chatSettings.currentSettings.model}
                      onChange={(e) => chatSettings.updateModel(e.target.value)}
                    >
                      {chatSettings.getAllModels(chatSettings.provider).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* OpenClaw Gateway Controls */}
                  {chatSettings.provider === 'openclaw' && (
                    <div className="settings-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        className="provider-tab"
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          background: gatewayStatus === 'launching' ? '#555' : '#1a73e8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: gatewayStatus === 'launching' ? 'wait' : 'pointer',
                        }}
                        disabled={gatewayStatus === 'launching'}
                        onClick={async () => {
                          if (!window.api?.openclawLaunchGateway) return;
                          setGatewayStatus('launching');
                          try {
                            await window.api.openclawLaunchGateway();
                            // Wait a moment for the gateway to become reachable
                            await new Promise(r => setTimeout(r, 3000));
                            const s = await window.api.openclawGatewayStatus();
                            setGatewayStatus(s.online ? 'online' : 'offline');
                          } catch {
                            setGatewayStatus('offline');
                          }
                        }}
                        type="button"
                      >
                        {gatewayStatus === 'launching' ? 'Launching...' : 'Launch Gateway'}
                      </button>
                      <span style={{
                        fontSize: 12,
                        color: gatewayStatus === 'online' ? '#4caf50' : gatewayStatus === 'checking' || gatewayStatus === 'launching' ? '#ff9800' : '#f44336',
                      }}>
                        {gatewayStatus === 'online' ? 'Gateway Online' : gatewayStatus === 'checking' ? 'Checking...' : gatewayStatus === 'launching' ? 'Starting...' : gatewayStatus === 'offline' ? 'Gateway Offline' : ''}
                      </span>
                    </div>
                  )}

                  {/* Parameter sliders */}
                  <div className="settings-field">
                    <label className="settings-label">
                      Temperature: {chatSettings.currentSettings.params.temperature}
                    </label>
                    <input
                      type="range"
                      className="settings-slider"
                      min="0" max="2" step="0.1"
                      value={chatSettings.currentSettings.params.temperature}
                      onChange={(e) => chatSettings.updateParams({ temperature: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">
                      Top P: {chatSettings.currentSettings.params.top_p}
                    </label>
                    <input
                      type="range"
                      className="settings-slider"
                      min="0" max="1" step="0.05"
                      value={chatSettings.currentSettings.params.top_p}
                      onChange={(e) => chatSettings.updateParams({ top_p: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">
                      Max Tokens: {chatSettings.currentSettings.params.max_tokens}
                    </label>
                    <input
                      type="range"
                      className="settings-slider"
                      min="256" max="40000" step="256"
                      value={chatSettings.currentSettings.params.max_tokens}
                      onChange={(e) => chatSettings.updateParams({ max_tokens: parseInt(e.target.value) })}
                    />
                  </div>

                  {/* Custom system prompt */}
                  <div className="settings-field">
                    <label className="settings-label">Custom System Prompt (optional)</label>
                    <textarea
                      className="settings-input settings-textarea"
                      value={chatSettings.currentSettings.prompt || ''}
                      onChange={(e) => chatSettings.updatePrompt(e.target.value)}
                      placeholder="Leave empty to use the default tool-enabled prompt..."
                      rows={3}
                    />
                  </div>

                  <div className="settings-divider" />

                  {/* API Keys */}
                  <h3 className="settings-section-title">API Keys</h3>
                  {['openai', 'gemini', 'claude', 'openclaw'].map(p => (
                    <div className="settings-field" key={`key-${p}`}>
                      <label className="settings-label">
                        {p === 'openai' ? 'OpenAI' : p === 'gemini' ? 'Gemini' : p === 'claude' ? 'Anthropic' : 'OpenClaw Gateway Token'} {p !== 'openclaw' ? 'API Key' : ''}
                      </label>
                      <div className="settings-input-group">
                        <input
                          type={showKeys[p] ? 'text' : 'password'}
                          className="settings-input"
                          value={settings[`${p}_api_key`] || ''}
                          onChange={(e) => {
                            handleSettingChange(`${p}_api_key`, e.target.value);
                            if (window.api?.setAIKey) {
                              window.api.setAIKey(p, e.target.value);
                            }
                          }}
                          placeholder={p === 'openai' ? 'sk-...' : p === 'gemini' ? 'AIza...' : p === 'claude' ? 'sk-ant-...' : 'gateway-token...'}
                        />
                        <button
                          className="settings-toggle-btn"
                          onClick={() => setShowKeys(prev => ({ ...prev, [p]: !prev[p] }))}
                          type="button"
                        >
                          {showKeys[p] ? '◉' : '○'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Studio URLs Tab */}
              {activeTab === 'studio' && (
                <div className="settings-section">
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
              )}

              {/* Memory Tab */}
              {activeTab === 'memory' && (
                <div className="settings-section">
                  {memoryLoading ? (
                    <div className="settings-loading">Loading memory...</div>
                  ) : !memoryData || !memoryData.data ? (
                    <div className="memory-empty">
                      No memory data available. Chat with the agent to start building memory.
                    </div>
                  ) : (
                    <>
                      {/* Refresh button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={loadMemoryData}
                          style={{
                            padding: '4px 12px',
                            fontSize: 11,
                            background: 'rgba(0, 200, 200, 0.1)',
                            border: '1px solid rgba(0, 200, 200, 0.25)',
                            borderRadius: 6,
                            color: 'var(--palette-accent-cyan)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          Refresh
                        </button>
                      </div>

                      {/* Context Summary Section */}
                      <h3 className="settings-section-title">Context</h3>
                      {(() => {
                        const user = memoryData.data.user;
                        const contextItems = [
                          { key: 'workContext', label: 'Work' },
                          { key: 'personalContext', label: 'Personal' },
                          { key: 'topOfMind', label: 'Top of Mind' },
                        ].filter(item => user?.[item.key] && user[item.key].trim());

                        if (contextItems.length === 0) {
                          return <div className="memory-empty">No context stored yet.</div>;
                        }

                        return contextItems.map(item => (
                          <div key={item.key} className="memory-context-item">
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--palette-accent-cyan)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>{item.label}</span>
                            <p style={{
                              fontSize: 13,
                              color: 'var(--palette-text-soft)',
                              margin: '4px 0 0 0',
                              lineHeight: 1.5,
                            }}>{user[item.key]}</p>
                          </div>
                        ));
                      })()}

                      <div className="settings-divider" />

                      {/* Facts Section */}
                      <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Facts
                        {memoryData.data.facts && memoryData.data.facts.length > 0 && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 400,
                            color: 'var(--palette-text-muted)',
                            textTransform: 'none',
                            letterSpacing: 0,
                          }}>({memoryData.data.facts.length})</span>
                        )}
                      </h3>

                      {!memoryData.data.facts || memoryData.data.facts.length === 0 ? (
                        <div className="memory-empty">
                          No facts stored yet. The agent will learn about you over time.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {memoryData.data.facts.map(fact => {
                            const categoryColors = {
                              preference: { bg: 'rgba(66, 133, 244, 0.15)', text: '#64b5f6', border: 'rgba(66, 133, 244, 0.3)' },
                              knowledge: { bg: 'rgba(76, 175, 80, 0.15)', text: '#81c784', border: 'rgba(76, 175, 80, 0.3)' },
                              context: { bg: 'rgba(158, 158, 158, 0.15)', text: '#bdbdbd', border: 'rgba(158, 158, 158, 0.3)' },
                              behavior: { bg: 'rgba(171, 71, 188, 0.15)', text: '#ce93d8', border: 'rgba(171, 71, 188, 0.3)' },
                              goal: { bg: 'rgba(255, 152, 0, 0.15)', text: '#ffb74d', border: 'rgba(255, 152, 0, 0.3)' },
                            };
                            const colors = categoryColors[fact.category] || categoryColors.context;
                            const isDeleting = deletingFact === fact.id;

                            return (
                              <div
                                key={fact.id}
                                className="memory-fact-row"
                                style={{ opacity: isDeleting ? 0.4 : 1 }}
                              >
                                <span className="memory-fact-category" style={{
                                  background: colors.bg,
                                  color: colors.text,
                                  border: `1px solid ${colors.border}`,
                                }}>{fact.category}</span>
                                <span className="memory-fact-content">{fact.content}</span>
                                <span className="memory-fact-confidence">
                                  {Math.round((fact.confidence || 0) * 100)}%
                                </span>
                                <button
                                  type="button"
                                  className="memory-fact-delete"
                                  onClick={() => handleDeleteFact(fact.id)}
                                  disabled={isDeleting}
                                  title="Delete fact"
                                >
                                  {isDeleting ? '...' : '\u00d7'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-save"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
