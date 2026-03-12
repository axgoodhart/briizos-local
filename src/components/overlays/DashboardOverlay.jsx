import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllSettings, setSetting, addLog } from '../../lib/firestore';
import logger from '../../lib/logger';
import './DashboardOverlay.css';

const UI_THEME_STORAGE_KEY = 'briizos.ui_theme';
function applyUiTheme(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (!theme || theme === 'default') {
    root.removeAttribute('data-theme');
    return;
  }

  root.setAttribute('data-theme', theme);
}

/* ───────────────────────────
   Sub-components (kept small)
   ─────────────────────────── */

function ModelTab({ isOpen }) {
  const [modelList, setModelList] = useState([]);
  const [apiKeyStatus, setApiKeyStatus] = useState({ anthropic: false, openai: false, google: false });
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('briizos-selected-model') || null);

  useEffect(() => {
    if (!isOpen) return;
    loadModels();
  }, [isOpen]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const [models, keys] = await Promise.all([
        window.api.getModels(),
        window.api.checkApiKeys(),
      ]);
      setModelList(models || []);
      setApiKeyStatus(keys || {});
    } catch (err) {
      logger.error('config', 'Failed to load models', err?.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="settings-loading">Loading model configuration...</div>;
  }

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Model Configuration</h3>

      {/* Summary */}
      <div className="settings-field">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: 'rgba(0, 200, 200, 0.06)',
          borderRadius: 8,
          border: '1px solid rgba(0, 200, 200, 0.15)',
        }}>
          <span style={{
            fontSize: 13,
            color: 'var(--palette-accent-cyan, #00c8c8)',
            fontWeight: 600,
          }}>{providerCount} providers, {modelList.length} models configured</span>
        </div>
      </div>

      {/* Currently selected model */}
      {selectedModelObj && (
        <div className="settings-field">
          <label className="settings-label">Currently Selected</label>
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--palette-text-soft, #ccc)',
            }}>{selectedModelObj.display_name}</span>
            <span style={{
              fontSize: 11,
              color: 'var(--palette-text-muted, #888)',
              marginLeft: 8,
            }}>({selectedModelObj.provider})</span>
          </div>
        </div>
      )}

      <div className="settings-divider" />

      {/* Models grouped by provider */}
      {['anthropic', 'openai', 'google'].map(provider => {
        const models = modelsByProvider[provider];
        if (!models || models.length === 0) return null;
        const hasKey = apiKeyStatus[provider];
        const providerLabel = provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Google';
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
              <span style={{
                fontSize: 11,
                color: 'var(--palette-text-muted, #888)',
              }}>({models.length} models)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {models.map(model => (
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

      <div className="settings-divider" />

      <p className="settings-hint" style={{ fontStyle: 'normal' }}>
        Model selection is available in the chat toolbar. Edit deerflow/config.yaml to add or modify models.
      </p>
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
  const [contextLoading, setContextLoading] = useState(true);
  const [chunks, setChunks] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(true);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [chunkContent, setChunkContent] = useState('');
  const [chunkContentLoading, setChunkContentLoading] = useState(false);
  const [chunksToInclude, setChunksToInclude] = useState(3);

  useEffect(() => {
    if (!isOpen) return;
    loadMemoryData();
  }, [isOpen]);

  const loadMemoryData = async () => {
    // Load agent context
    setContextLoading(true);
    try {
      const content = await window.api.memoryReadAgentContext();
      setAgentContext(content || '');
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

    // Load config for chunksToInclude
    try {
      const config = await window.api.agentGetConfig();
      if (config?.memory?.chunksToInclude !== undefined) {
        setChunksToInclude(config.memory.chunksToInclude);
      }
    } catch (err) {
      logger.error('config', 'Failed to load agent config', err?.message);
    }
  };

  const handleContextBlur = async () => {
    try {
      await window.api.memoryWriteAgentContext(agentContext);
    } catch (err) {
      logger.error('config', 'Failed to save agent context', err?.message);
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

  const handleChunksToIncludeChange = async (val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setChunksToInclude(n);
    try {
      await window.api.agentUpdateConfig({ memory: { chunksToInclude: n } });
    } catch (err) {
      logger.error('config', 'Failed to update chunksToInclude', err?.message);
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
        <p className="settings-hint" style={{ fontStyle: 'normal' }}>
          This file (agent-context.md) is included in every AI request as persistent memory.
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

      {/* Chunk Inclusion Setting */}
      <h3 className="settings-section-title">Chat Log Context</h3>
      <div className="settings-field">
        <label className="settings-label">Include N most recent chunks in context</label>
        <input
          type="number"
          className="settings-input dashboard-chunks-input"
          min="0"
          value={chunksToInclude}
          onChange={(e) => handleChunksToIncludeChange(e.target.value)}
        />
      </div>

      <div className="settings-divider" />

      {/* Chat Log Chunks */}
      <h3 className="settings-section-title">Chat Log Chunks</h3>
      <div className="settings-field">
        {chunksLoading ? (
          <p className="settings-hint">Loading chunks...</p>
        ) : chunks.length === 0 ? (
          <p className="settings-hint">No chat log chunks found.</p>
        ) : (
          <div className="dashboard-chunk-list">
            {chunks.map(chunk => (
              <button
                key={chunk.filename}
                className={`dashboard-chunk-item ${selectedChunk === chunk.filename ? 'active' : ''}`}
                onClick={() => handleChunkClick(chunk.filename)}
                type="button"
              >
                <span className="dashboard-chunk-name">{chunk.filename}</span>
                <span className="dashboard-chunk-size">{formatSize(chunk.size)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chunk Preview */}
      {selectedChunk && (
        <div className="settings-field">
          <label className="settings-label">Preview: {selectedChunk}</label>
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

function PermissionsTab({ isOpen }) {
  const [terminalMode, setTerminalMode] = useState('ask-always');
  const [blacklistPaths, setBlacklistPaths] = useState([]);
  const [blacklistFiletypes, setBlacklistFiletypes] = useState([]);
  const [newPath, setNewPath] = useState('');
  const [newFiletype, setNewFiletype] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await window.api.agentGetConfig();
      if (config?.terminal?.mode) {
        setTerminalMode(config.terminal.mode);
      }
      if (config?.filesystem?.blacklist) {
        setBlacklistPaths(config.filesystem.blacklist.paths || []);
        setBlacklistFiletypes(config.filesystem.blacklist.filetypes || []);
      }
    } catch (err) {
      logger.error('config', 'Failed to load agent config', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalModeChange = async (mode) => {
    setTerminalMode(mode);
    try {
      await window.api.agentUpdateConfig({ terminal: { mode } });
    } catch (err) {
      logger.error('config', 'Failed to update terminal mode', err?.message);
    }
  };

  const handleAddPath = async () => {
    const trimmed = newPath.trim();
    if (!trimmed || blacklistPaths.includes(trimmed)) return;
    const updated = [...blacklistPaths, trimmed];
    setBlacklistPaths(updated);
    setNewPath('');
    try {
      await window.api.agentUpdateConfig({
        filesystem: { blacklist: { paths: updated, filetypes: blacklistFiletypes } }
      });
    } catch (err) {
      logger.error('config', 'Failed to update blacklist paths', err?.message);
    }
  };

  const handleRemovePath = async (path) => {
    const updated = blacklistPaths.filter(p => p !== path);
    setBlacklistPaths(updated);
    try {
      await window.api.agentUpdateConfig({
        filesystem: { blacklist: { paths: updated, filetypes: blacklistFiletypes } }
      });
    } catch (err) {
      logger.error('config', 'Failed to update blacklist paths', err?.message);
    }
  };

  const handleAddFiletype = async () => {
    let trimmed = newFiletype.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('.')) trimmed = '.' + trimmed;
    if (blacklistFiletypes.includes(trimmed)) return;
    const updated = [...blacklistFiletypes, trimmed];
    setBlacklistFiletypes(updated);
    setNewFiletype('');
    try {
      await window.api.agentUpdateConfig({
        filesystem: { blacklist: { paths: blacklistPaths, filetypes: updated } }
      });
    } catch (err) {
      logger.error('config', 'Failed to update blacklist filetypes', err?.message);
    }
  };

  const handleRemoveFiletype = async (ft) => {
    const updated = blacklistFiletypes.filter(f => f !== ft);
    setBlacklistFiletypes(updated);
    try {
      await window.api.agentUpdateConfig({
        filesystem: { blacklist: { paths: blacklistPaths, filetypes: updated } }
      });
    } catch (err) {
      logger.error('config', 'Failed to update blacklist filetypes', err?.message);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading permissions...</div>;
  }

  const terminalModes = [
    { value: 'ask-always', label: 'Ask always', desc: 'Prompt for confirmation before every terminal command.' },
    { value: 'ask-destructive', label: 'Ask destructive only', desc: 'Only ask for commands that could modify or delete data.' },
    { value: 'no-asking', label: 'No asking', desc: 'Execute all commands without confirmation.' }
  ];

  return (
    <div className="settings-section">
      {/* Terminal Mode */}
      <h3 className="settings-section-title">Terminal Mode</h3>
      <div className="settings-field">
        <div className="settings-radio-group">
          {terminalModes.map(m => (
            <label className="settings-radio" key={m.value}>
              <input
                type="radio"
                name="terminal-mode"
                value={m.value}
                checked={terminalMode === m.value}
                onChange={() => handleTerminalModeChange(m.value)}
              />
              <span className="radio-label">{m.label}</span>
              <span className="radio-desc">{m.desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      {/* Filesystem Blacklist — Paths */}
      <h3 className="settings-section-title">Filesystem Blacklist &mdash; Paths</h3>
      <div className="settings-field">
        <p className="settings-hint" style={{ fontStyle: 'normal' }}>
          The agent will be prevented from reading or modifying these paths.
        </p>
        <div className="dashboard-blacklist-table">
          {blacklistPaths.length === 0 ? (
            <p className="settings-hint">No blocked paths.</p>
          ) : (
            blacklistPaths.map(path => (
              <div className="dashboard-blacklist-row" key={path}>
                <span className="dashboard-blacklist-value">{path}</span>
                <button
                  className="dashboard-blacklist-remove"
                  onClick={() => handleRemovePath(path)}
                  type="button"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
        <div className="settings-input-group">
          <input
            type="text"
            className="settings-input"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddPath(); }}
            placeholder="/path/to/block"
          />
          <button
            className="settings-btn settings-btn-connect"
            onClick={handleAddPath}
            disabled={!newPath.trim()}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Filesystem Blacklist — Filetypes */}
      <h3 className="settings-section-title">Filesystem Blacklist &mdash; File Types</h3>
      <div className="settings-field">
        <p className="settings-hint" style={{ fontStyle: 'normal' }}>
          The agent will be prevented from reading or modifying files with these extensions.
        </p>
        <div className="dashboard-blacklist-table">
          {blacklistFiletypes.length === 0 ? (
            <p className="settings-hint">No blocked file types.</p>
          ) : (
            blacklistFiletypes.map(ft => (
              <div className="dashboard-blacklist-row" key={ft}>
                <span className="dashboard-blacklist-value">{ft}</span>
                <button
                  className="dashboard-blacklist-remove"
                  onClick={() => handleRemoveFiletype(ft)}
                  type="button"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
        <div className="settings-input-group">
          <input
            type="text"
            className="settings-input"
            value={newFiletype}
            onChange={(e) => setNewFiletype(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddFiletype(); }}
            placeholder=".pem"
          />
          <button
            className="settings-btn settings-btn-connect"
            onClick={handleAddFiletype}
            disabled={!newFiletype.trim()}
            type="button"
          >
            Add
          </button>
        </div>
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
              <span style={{ marginRight: 8, color: exists ? '#4ade80' : '#f87171' }}>
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
                <span style={{ marginRight: 8, color: '#4ade80' }}>{'\u2713'}</span>
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
        <p className="settings-hint" style={{ fontStyle: 'normal' }}>
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

function AppearanceTab({ settings, handleThemeChange }) {
  const currentTheme = settings.ui_theme || 'default';

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Theme</h3>
      <p className="settings-section-desc">
        Pick the visual style for the desktop UI.
      </p>

      <div className="settings-radio-group">
        <label className="settings-radio">
          <input
            type="radio"
            name="ui-theme"
            value="default"
            checked={currentTheme === 'default'}
            onChange={(e) => handleThemeChange(e.target.value)}
          />
          <span className="radio-label">Default Neon</span>
          <span className="radio-desc">Current dark neon interface.</span>
        </label>

        <label className="settings-radio">
          <input
            type="radio"
            name="ui-theme"
            value="mint-icecube"
            checked={currentTheme === 'mint-icecube'}
            onChange={(e) => handleThemeChange(e.target.value)}
          />
          <span className="radio-label">Mint Icecube</span>
          <span className="radio-desc">Frosted mint glass palette with cooler contrast.</span>
        </label>

              <label className="settings-radio">
          <input
            type="radio"
            name="ui-theme"
            value="great-wave"
            checked={currentTheme === 'great-wave'}
            onChange={(e) => handleThemeChange(e.target.value)}
          />
          <span className="radio-label">Great Wave</span>
          <span className="radio-desc">Kanagawan pallete with muted opacity.</span>
        </label>


<label className="settings-radio">
  <input
    type="radio"
    name="ui-theme"
    value="sherbert-sakura"
    checked={currentTheme === 'sherbert-sakura'}
    onChange={(e) => handleThemeChange(e.target.value)}
  />
  <span className="radio-label">Sherbert Sakura</span>
  <span className="radio-desc">A pastel-neon cherry blossom theme.</span>
</label>



<label className="settings-radio">
  <input
    type="radio"
    name="ui-theme"
    value="burnt-chestnut"
    checked={currentTheme === 'burnt-chestnut'}
    onChange={(e) => handleThemeChange(e.target.value)}
  />
  <span className="radio-label">Burnt Chestnut</span>
  <span className="radio-desc">A medium springtime theme.</span>
</label>




 
<label className="settings-radio">
  <input
    type="radio"
    name="ui-theme"
    value="verdigris"
    checked={currentTheme === 'verdigris'}
    onChange={(e) => handleThemeChange(e.target.value)}
  />
  <span className="radio-label">Verdigris</span>
  <span className="radio-desc">Tarnished bronze with a hint of gold and green.</span>
</label>


<label className="settings-radio">
  <input
    type="radio"
    name="ui-theme"
    value="space-glass"
    checked={currentTheme === 'space-glass'}
    onChange={(e) => handleThemeChange(e.target.value)}
  />
  <span className="radio-label">Space Glass</span>
  <span className="radio-desc">A dark space theme with twilight hue.</span>
</label>



        
      </div>
    </div>
  );
}

/* ─────────────────────
   Main DashboardOverlay
   ───────────────────── */

function DashboardOverlay({ isOpen, onClose }) {
  const { user, logout, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('model');
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState(null);
  const [isConnectingGdrive, setIsConnectingGdrive] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load settings when overlay opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadGdriveStatus();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const allSettings = await getAllSettings();
      const savedTheme = allSettings.ui_theme || localStorage.getItem(UI_THEME_STORAGE_KEY) || 'default';
      setSettings({ ...allSettings, ui_theme: savedTheme });
      localStorage.setItem(UI_THEME_STORAGE_KEY, savedTheme);
      applyUiTheme(savedTheme);
      if (allSettings.github_token && window.api?.githubSetToken) {
        window.api.githubSetToken(allSettings.github_token);
      }
    } catch (error) {
      logger.error('config', 'Failed to load settings', error?.message);
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

  const handleThemeChange = useCallback((theme) => {
    handleSettingChange('ui_theme', theme);
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme);
    applyUiTheme(theme);
  }, [handleSettingChange]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await setSetting(key, value);
      }
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

  const handleGdriveConnect = async () => {
    setIsConnectingGdrive(true);
    try {
      const result = await window.api.gdriveConnect();
      if (result.requiresCredentials) {
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
    if (e.key === 'Escape') onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'model', label: 'Model' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'memory', label: 'Memory' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'health', label: 'Health' }
  ];

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="modal-container dashboard-modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Dashboard</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
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
          {isLoading && activeTab !== 'memory' && activeTab !== 'permissions' && activeTab !== 'health' ? (
            <div className="settings-loading">Loading settings...</div>
          ) : (
            <>
              {activeTab === 'model' && (
                <ModelTab isOpen={isOpen} />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab
                  settings={settings}
                  handleThemeChange={handleThemeChange}
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

export default DashboardOverlay;
