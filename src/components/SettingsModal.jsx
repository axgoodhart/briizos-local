import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllSettings, setSetting, addLog } from '../lib/firestore';
import logger from '../lib/logger';

function SettingsModal({ isOpen, onClose }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [modelList, setModelList] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState({ anthropic: false, openai: false, google: false, claude: false, gemini: false });
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
  const [skillsData, setSkillsData] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [backendLoading, setBackendLoading] = useState(false);

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

  const loadSkillsData = async () => {
    setSkillsLoading(true);
    try {
      const result = await window.api.skillsList();
      setSkillsData(result || []);
    } catch (error) {
      logger.error('config', 'Failed to load skills', error?.message);
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleSkillToggle = async (skillName, currentEnabled) => {
    // Optimistic update
    setSkillsData(prev => prev.map(s =>
      s.name === skillName ? { ...s, enabled: !currentEnabled } : s
    ));
    try {
      const result = await window.api.skillsToggle(skillName, !currentEnabled);
      if (!result?.success) {
        // Revert on failure
        setSkillsData(prev => prev.map(s =>
          s.name === skillName ? { ...s, enabled: currentEnabled } : s
        ));
      }
    } catch (error) {
      logger.error('config', 'Failed to toggle skill', error?.message);
      // Revert on error
      setSkillsData(prev => prev.map(s =>
        s.name === skillName ? { ...s, enabled: currentEnabled } : s
      ));
    }
  };

  const loadBackendStatus = async () => {
    setBackendLoading(true);
    try {
      const result = await window.api.healthCheck();
      setBackendStatus(result);
    } catch (error) {
      logger.error('config', 'Failed to load backend status', error?.message);
    } finally {
      setBackendLoading(false);
    }
  };

  const loadModels = async () => {
    setModelLoading(true);
    try {
      const [models, keys] = await Promise.all([
        window.api.getModels(),
        window.api.checkApiKeys(),
      ]);
      setModelList(models || []);
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
    } catch (error) {
      logger.error('config', 'Failed to load models', error?.message);
    } finally {
      setModelLoading(false);
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

  // Load models when switching to model tab
  useEffect(() => {
    if (activeTab === 'model' && modelList.length === 0 && isOpen) {
      loadModels();
    }
  }, [activeTab]);

  // Load skills when switching to skills tab
  useEffect(() => {
    if (activeTab === 'skills' && skillsData.length === 0 && isOpen) {
      loadSkillsData();
    }
  }, [activeTab]);

  // Load backend status when switching to backend tab
  useEffect(() => {
    if (activeTab === 'backend' && backendStatus === null && isOpen) {
      loadBackendStatus();
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
    { id: 'skills', label: 'Skills' },
    { id: 'model', label: 'AI Model' },
    { id: 'studio', label: 'Studio URLs' },
    { id: 'backend', label: 'Backend' }
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

              {/* AI Model Tab - LangGraph Model List */}
              {activeTab === 'model' && (
                <div className="settings-section">
                  <h3 className="settings-section-title">AI Models</h3>
                  {modelLoading ? (
                    <div className="settings-loading">Loading models...</div>
                  ) : modelList.length === 0 ? (
                    <div className="settings-field">
                      <p className="settings-hint">No models configured. Check agent/config.yaml.</p>
                    </div>
                  ) : (
                    <>
                      {/* Group models by provider */}
                      {['claude', 'openai', 'gemini'].map(provider => {
                        const providerModels = modelList.filter(m => m.provider === provider);
                        if (providerModels.length === 0) return null;
                        const hasKey = apiKeyStatus[provider];
                        const providerLabel = provider === 'claude' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Gemini';
                        return (
                          <div key={provider} style={{ marginBottom: 16 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 8,
                            }}>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: hasKey ? 'var(--palette-accent-cyan, #00c8c8)' : '#ff6b6b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                {providerLabel}
                              </span>
                              {!hasKey && (
                                <span style={{
                                  fontSize: 11,
                                  color: '#ff6b6b',
                                  fontWeight: 500,
                                }}>(no API key)</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {providerModels.map(model => (
                                <div
                                  key={model.name}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    opacity: hasKey ? 1 : 0.5,
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span style={{
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: 'var(--palette-text-soft, #ccc)',
                                    }}>{model.display_name}</span>
                                    <span style={{
                                      fontSize: 11,
                                      color: 'var(--palette-text-muted, #888)',
                                    }}>{model.model}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {model.max_tokens && (
                                      <span style={{
                                        fontSize: 10,
                                        color: 'var(--palette-text-muted, #888)',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                      }}>{(model.max_tokens / 1000).toFixed(0)}k tokens</span>
                                    )}
                                    {model.supports_thinking && (
                                      <span style={{
                                        fontSize: 10,
                                        color: 'var(--palette-accent-cyan, #00c8c8)',
                                        background: 'rgba(0, 200, 200, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                      }}>thinking</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <div className="settings-divider" />

                  <p className="settings-hint" style={{ fontStyle: 'normal' }}>
                    Model selection is available in the chat toolbar. Edit agent/config.yaml to add or modify models.
                  </p>
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

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="settings-section">
                  {skillsLoading ? (
                    <div className="settings-loading">Loading skills...</div>
                  ) : skillsData.length === 0 ? (
                    <div className="memory-empty">
                      No skills found. Check agent/extensions_config.json.
                    </div>
                  ) : (
                    <>
                      {/* Refresh button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={loadSkillsData}
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

                      {/* Enabled skills */}
                      {(() => {
                        const enabled = skillsData.filter(s => s.enabled);
                        const disabled = skillsData.filter(s => !s.enabled);
                        const formatName = (name) =>
                          name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                        return (
                          <>
                            {enabled.length > 0 && (
                              <>
                                <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  Enabled
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 400,
                                    color: 'var(--palette-text-muted)',
                                    textTransform: 'none',
                                    letterSpacing: 0,
                                  }}>({enabled.length})</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {enabled.map(skill => (
                                    <div key={skill.name} className="skills-row">
                                      <span className="skills-name">{formatName(skill.name)}</span>
                                      <button
                                        type="button"
                                        className={`skills-toggle ${skill.enabled ? 'active' : ''}`}
                                        onClick={() => handleSkillToggle(skill.name, skill.enabled)}
                                        title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                                      >
                                        <span className="skills-toggle-dot" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {enabled.length > 0 && disabled.length > 0 && (
                              <div className="settings-divider" />
                            )}

                            {disabled.length > 0 && (
                              <>
                                <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  Disabled
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 400,
                                    color: 'var(--palette-text-muted)',
                                    textTransform: 'none',
                                    letterSpacing: 0,
                                  }}>({disabled.length})</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {disabled.map(skill => (
                                    <div key={skill.name} className="skills-row">
                                      <span className="skills-name">{formatName(skill.name)}</span>
                                      <button
                                        type="button"
                                        className={`skills-toggle ${skill.enabled ? 'active' : ''}`}
                                        onClick={() => handleSkillToggle(skill.name, skill.enabled)}
                                        title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                                      >
                                        <span className="skills-toggle-dot" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* Backend Tab */}
              {activeTab === 'backend' && (
                <div className="settings-section">
                  {backendLoading ? (
                    <div className="settings-loading">Loading backend status...</div>
                  ) : !backendStatus ? (
                    <div className="memory-empty">
                      Unable to retrieve backend status.
                    </div>
                  ) : (
                    <>
                      {/* Refresh button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={loadBackendStatus}
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

                      <h3 className="settings-section-title">AI Runtime</h3>

                      <div className="backend-status-row">
                        <span className="backend-status-label">Status</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="backend-status-dot"
                            style={{
                              background: backendStatus.aiConfigured ? '#4caf50' : '#f44336',
                            }}
                          />
                          <span className="backend-status-value" style={{
                            color: backendStatus.aiConfigured ? '#81c784' : '#ff8a80',
                          }}>
                            {backendStatus.aiConfigured ? 'ready' : 'not configured'}
                          </span>
                        </span>
                      </div>

                      {backendStatus.port && (
                        <div className="backend-status-row">
                          <span className="backend-status-label">Port</span>
                          <span className="backend-status-value">{backendStatus.port}</span>
                        </div>
                      )}

                      {typeof backendStatus.restartCount === 'number' && (
                        <div className="backend-status-row">
                          <span className="backend-status-label">Restart Count</span>
                          <span className="backend-status-value">{backendStatus.restartCount}</span>
                        </div>
                      )}

                      {backendStatus.error && (
                        <>
                          <div className="settings-divider" />
                          <div className="backend-status-row">
                            <span className="backend-status-label" style={{ color: '#ff8a80' }}>Error</span>
                            <span className="backend-status-value" style={{ color: '#ff8a80' }}>{backendStatus.error}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
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
