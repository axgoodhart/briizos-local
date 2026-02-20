import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChatSettings } from '../../context/ChatSettingsContext';
import { getAllSettings, setSetting, addLog } from '../../lib/firestore';
import logger from '../../lib/logger';
import './DashboardOverlay.css';

/* ───────────────────────────
   Sub-components (kept small)
   ─────────────────────────── */

function ModelTab({ chatSettings, settings, showKeys, setShowKeys, handleSettingChange }) {
  if (!chatSettings) return null;

  return (
    <div className="settings-section">
      {/* Provider tabs */}
      <div className="settings-provider-tabs">
        {['openai', 'gemini', 'claude'].map(p => (
          <button
            key={p}
            className={`provider-tab ${chatSettings.provider === p ? 'active' : ''}`}
            onClick={() => chatSettings.setProvider(p)}
            type="button"
          >
            {p === 'openai' ? 'OpenAI' : p === 'gemini' ? 'Gemini' : 'Claude'}
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

      {/* Parameter sliders */}
      <div className="settings-field">
        <label className="settings-label">
          Temperature: {chatSettings.currentSettings.params.temperature}
        </label>
        <input
          type="range" className="settings-slider"
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
          type="range" className="settings-slider"
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
          type="range" className="settings-slider"
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
      {['openai', 'gemini', 'claude'].map(p => (
        <div className="settings-field" key={`key-${p}`}>
          <label className="settings-label">
            {p === 'openai' ? 'OpenAI' : p === 'gemini' ? 'Gemini' : 'Anthropic'} API Key
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
              placeholder={p === 'openai' ? 'sk-...' : p === 'gemini' ? 'AIza...' : 'sk-ant-...'}
            />
            <button
              className="settings-toggle-btn"
              onClick={() => setShowKeys(prev => ({ ...prev, [p]: !prev[p] }))}
              type="button"
            >
              {showKeys[p] ? '\u25C9' : '\u25CB'}
            </button>
          </div>
        </div>
      ))}
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

/* ─────────────────────
   Main DashboardOverlay
   ───────────────────── */

function DashboardOverlay({ isOpen, onClose }) {
  const { user, logout, isAuthenticated } = useAuth();
  const chatSettings = useChatSettings();

  const [activeTab, setActiveTab] = useState('model');
  const [showKeys, setShowKeys] = useState({ openai: false, gemini: false, claude: false });
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
      setSettings(allSettings);
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
                <ModelTab
                  chatSettings={chatSettings}
                  settings={settings}
                  showKeys={showKeys}
                  setShowKeys={setShowKeys}
                  handleSettingChange={handleSettingChange}
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
