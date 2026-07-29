import { useState, useEffect, useRef, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import FileTree, { SOURCE_FILE_TYPE } from './FileTree';
import logger, { subscribeLogs } from '../lib/logger';

/**
 * DraggableGithubFile - A draggable GitHub file item for the source panel
 */
function DraggableGithubFile({ item, githubPath, isSelected, onNavigateFolder }) {
  const [{ isDragging }, drag] = useDrag({
    type: SOURCE_FILE_TYPE,
    item: { path: githubPath, name: item.name, isDirectory: item.isDirectory },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div
      ref={!item.isDirectory ? drag : undefined}
      className={`github-file-item ${item.isDirectory ? 'folder' : 'file'} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClick={() => item.isDirectory ? onNavigateFolder(item) : null}
    >
      <span className="file-icon">
        {item.isDirectory ? '📁' : '📄'}
      </span>
      <span className="file-name">{item.name}</span>
      {item.isDirectory && <span className="folder-arrow">&rarr;</span>}
    </div>
  );
}

// Safe API access helper (still needed for filesystem/GitHub/GDrive IPC)
const api = window.api || {};
const hasApi = typeof window !== 'undefined' && window.api;

const LOG_LEVEL_META = {
  debug: { label: 'Technical detail', glyph: '·' },
  info: { label: 'Recorded', glyph: 'i' },
  warn: { label: 'Needs attention', glyph: '!' },
  error: { label: 'Failed', glyph: '×' },
};

const LOG_CATEGORY_LABELS = {
  agent: 'AI',
  automation: 'Task automation',
  briizy: 'Screen memory',
  'screen-memory': 'Screen memory',
  canvas: 'Canvas',
  chat: 'Chat',
  database: 'Local database',
  fs: 'Files',
  network: 'Network',
  permissions: 'Permissions',
  settings: 'Settings',
  sync: 'Cloud sync',
  system: 'App',
  task: 'Tasks',
  ui: 'Interface',
  weather: 'Header weather',
};

function humanizeLogToken(value) {
  return String(value || 'system')
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function logCategoryLabel(log) {
  const category = log.category || log.action || 'system';
  return LOG_CATEGORY_LABELS[category] || humanizeLogToken(category);
}

function printableEvidence(value) {
  if (value == null) return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function evidenceRows(log) {
  const rows = [];
  if (log.threadId) rows.push(['Chat thread', log.threadId]);
  if (log.sessionId) rows.push(['App session', log.sessionId]);
  if (log.taskId) rows.push(['Task', log.taskId]);
  if (log.data && typeof log.data === 'object' && !Array.isArray(log.data)) {
    Object.entries(log.data).forEach(([key, value]) => {
      rows.push([humanizeLogToken(key), printableEvidence(value)]);
    });
  } else if (log.data !== undefined && log.data !== null) {
    rows.push(['Recorded detail', printableEvidence(log.data)]);
  }
  return rows;
}

function logInterpretation(log) {
  if (log.type === 'chat.user_message') {
    return 'This is the user-visible message saved locally before briizOS asked a model provider for a response.';
  }
  if (log.type === 'chat.assistant_message') {
    return 'This is the user-visible assistant response saved to the same local chat thread.';
  }
  if (log.level === 'error') {
    return 'This operation did not finish. The exact recorded error and affected identifiers are shown below.';
  }
  if (log.level === 'warn') {
    return 'One operation failed, paused, or used a fallback. briizOS continued only where the message says it did.';
  }
  if (log.level === 'debug') {
    return 'This is an internal trace step. It is evidence about implementation activity, not proof of a user-visible result.';
  }
  return 'briizOS recorded this step or observed state. It does not, by itself, prove that a later network or AI request succeeded.';
}

function mergeLogLists(...lists) {
  const byId = new Map();
  lists.flat().forEach((entry) => {
    if (entry?.id) byId.set(entry.id, entry);
  });
  return [...byId.values()]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 500);
}

function SourcesPanel() {
  const [expandedSections, setExpandedSections] = useState({
    local: true,
    icloud: false,
    usb: false,
    github: false,
    gdrive: false
  });

  const [homeDirs, setHomeDirs] = useState([]);
  const [iCloudDirs, setICloudDirs] = useState([]);
  const [iCloudAvailable, setICloudAvailable] = useState(false);
  const [usbDrives, setUsbDrives] = useState([]);
  const [isLoadingUSB, setIsLoadingUSB] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isLoadingDirs, setIsLoadingDirs] = useState(true);
  const [isLoadingICloud, setIsLoadingICloud] = useState(true);

  // GitHub state
  const [githubConfigured, setGithubConfigured] = useState(false);
  const [githubUser, setGithubUser] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoContents, setRepoContents] = useState([]);
  const [repoPath, setRepoPath] = useState('');
  const [isLoadingRepoContents, setIsLoadingRepoContents] = useState(false);

  // Google Drive state
  const [gdriveStatus, setGdriveStatus] = useState(null);
  const [isLoadingGdrive, setIsLoadingGdrive] = useState(true);

  const [logs, setLogs] = useState([]);
  const [logView, setLogView] = useState('all');
  const [logQuery, setLogQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const logContainerRef = useRef(null);

  // Fetch home directories on mount
  useEffect(() => {
    if (!hasApi) {
      setIsLoadingDirs(false);
      return;
    }

    const loadHomeDirs = async () => {
      try {
        const dirs = await api.getHomeDirs();
        // Transform to file tree format
        const transformed = dirs.map(dir => ({
          name: dir.name,
          path: dir.path,
          isDirectory: true,
          isFile: false
        }));
        setHomeDirs(transformed);
      } catch (error) {
        logger.error('fs', 'Failed to load home directories', error?.message);
      } finally {
        setIsLoadingDirs(false);
      }
    };

    loadHomeDirs();
  }, []);

  // Fetch iCloud directories on mount
  useEffect(() => {
    if (!hasApi) {
      setIsLoadingICloud(false);
      return;
    }

    const loadICloudDirs = async () => {
      try {
        const result = await api.getICloudDirs();
        if (result.available) {
          setICloudDirs(result.dirs);
          setICloudAvailable(true);
        } else {
          setICloudAvailable(false);
        }
      } catch (error) {
        logger.error('fs', 'Failed to load iCloud directories', error?.message);
        setICloudAvailable(false);
      } finally {
        setIsLoadingICloud(false);
      }
    };

    loadICloudDirs();
  }, []);

  // Fetch USB drives on mount and subscribe to changes
  useEffect(() => {
    if (!hasApi) {
      setIsLoadingUSB(false);
      return;
    }

    const loadUSBDrives = async () => {
      try {
        const result = await api.getUSBDrives();
        if (result.available) {
          setUsbDrives(result.drives);
        } else {
          setUsbDrives([]);
        }
      } catch (error) {
        logger.error('fs', 'Failed to load USB drives', error?.message);
        setUsbDrives([]);
      } finally {
        setIsLoadingUSB(false);
      }
    };

    loadUSBDrives();

    // Subscribe to USB drive changes (mount/unmount)
    const cleanup = api.onUSBDrivesChanged?.((data) => {
      setUsbDrives(data.drives || []);
    });

    return cleanup || (() => {});
  }, []);

  // Load selected files from the local authority on mount.
  useEffect(() => {
    const loadSelectedFiles = async () => {
      try {
        const files = await window.api.localData.selectedFiles.list('chat');
        const paths = new Set(files.map(f => f.path));
        setSelectedFiles(paths);
      } catch (error) {
        logger.error('fs', 'Failed to load selected files', error?.message);
      }
    };

    loadSelectedFiles();
  }, []);

  // Load Google Drive status on mount
  useEffect(() => {
    if (!hasApi) {
      setIsLoadingGdrive(false);
      return;
    }

    const loadGdriveStatus = async () => {
      try {
        const status = await api.gdriveGetStatus();
        setGdriveStatus(status);
      } catch (error) {
        logger.error('fs', 'Failed to load Google Drive status', error?.message);
      } finally {
        setIsLoadingGdrive(false);
      }
    };

    loadGdriveStatus();
  }, []);

  // Check GitHub configuration on mount
  useEffect(() => {
    if (!hasApi) return;

    const checkGithubConfig = async () => {
      try {
        const result = await api.githubIsConfigured();
        setGithubConfigured(result.configured);
        if (result.configured && result.user) {
          setGithubUser(result.user);
        }
      } catch (error) {
        logger.error('fs', 'Failed to check GitHub config', error?.message);
      }
    };

    checkGithubConfig();
  }, []);

  // Load GitHub repos when section is expanded and configured
  useEffect(() => {
    if (!hasApi) return;

    const loadGithubRepos = async () => {
      if (!expandedSections.github || !githubConfigured || githubRepos.length > 0) {
        return;
      }

      setIsLoadingGithub(true);
      setGithubError(null);

      try {
        const repos = await api.githubListRepos({ per_page: 50 });
        if (repos.error) {
          setGithubError(repos.error);
        } else {
          setGithubRepos(repos);
        }
      } catch (error) {
        setGithubError(error.message);
      } finally {
        setIsLoadingGithub(false);
      }
    };

    loadGithubRepos();
  }, [expandedSections.github, githubConfigured, githubRepos.length]);

  // Load repo contents when a repo is selected
  const loadRepoContents = useCallback(async (owner, repo, path = '') => {
    if (!hasApi) return;
    setIsLoadingRepoContents(true);
    try {
      const contents = await api.githubGetContents(owner, repo, path);
      if (contents.error) {
        logger.error('fs', 'Failed to load repo contents', contents.error);
        setRepoContents([]);
      } else {
        setRepoContents(contents);
      }
      setRepoPath(path);
    } catch (error) {
      logger.error('fs', 'Failed to load repo contents', error?.message);
      setRepoContents([]);
    } finally {
      setIsLoadingRepoContents(false);
    }
  }, []);

  // Handle repo selection
  const handleSelectRepo = useCallback((repo) => {
    const [owner, repoName] = repo.full_name.split('/');
    setSelectedRepo(repo);
    setRepoPath('');
    loadRepoContents(owner, repoName, '');
  }, [loadRepoContents]);

  // Handle navigating into a folder in a repo
  const handleNavigateRepoFolder = useCallback((item) => {
    if (!selectedRepo) return;
    const [owner, repoName] = selectedRepo.full_name.split('/');
    if (item.isDirectory) {
      loadRepoContents(owner, repoName, item.path);
    }
  }, [selectedRepo, loadRepoContents]);

  // Handle going back to parent folder in repo
  const handleRepoGoBack = useCallback(() => {
    if (!selectedRepo || !repoPath) return;
    const [owner, repoName] = selectedRepo.full_name.split('/');
    const parentPath = repoPath.split('/').slice(0, -1).join('/');
    loadRepoContents(owner, repoName, parentPath);
  }, [selectedRepo, repoPath, loadRepoContents]);

  // Handle going back to repo list
  const handleBackToRepoList = useCallback(() => {
    setSelectedRepo(null);
    setRepoContents([]);
    setRepoPath('');
  }, []);

  // Periodically refresh selected files to stay in sync with drops
  useEffect(() => {
    const refreshSelectedFiles = async () => {
      try {
        const files = await window.api.localData.selectedFiles.list('chat');
        const paths = new Set(files.map(f => f.path));
        setSelectedFiles(paths);
      } catch (error) {
        logger.error('fs', 'Failed to refresh selected files', error?.message);
      }
    };

    const interval = setInterval(refreshSelectedFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  // Merge the current live stream with SQLite history. Before this, the panel
  // discarded its own persisted logs on every restart even though they were
  // still present in briizos.db.
  useEffect(() => {
    let mounted = true;
    let liveLogs = [];
    let persistedLogs = [];
    const publish = () => {
      if (mounted) setLogs(mergeLogLists(liveLogs, persistedLogs));
    };

    const unsubscribe = subscribeLogs((logData) => {
      liveLogs = logData;
      publish();
    });

    if (typeof api.localData?.logs?.list === 'function') {
      api.localData.logs.list({ limit: 500 })
        .then((entries) => {
          persistedLogs = Array.isArray(entries) ? entries : [];
          publish();
        })
        .catch((error) => {
          logger.warn('ui.logs', 'The activity panel could not load earlier SQLite logs; current-session logs are still visible.', {
            error: error?.message,
            effect: 'Only prior app-session history is missing from this panel.',
          });
        });
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Keep newest logs visible.
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatLogDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatLogTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const normalizedLogQuery = logQuery.trim().toLowerCase();
  const filteredLogs = logs.filter((entry) => {
    const isChatTranscript = entry.type === 'chat.user_message'
      || entry.type === 'chat.assistant_message';
    if (logView === 'chat' && !isChatTranscript) return false;
    if (logView === 'problems' && entry.level !== 'warn' && entry.level !== 'error') return false;
    if (!normalizedLogQuery) return true;
    let evidence = '';
    try { evidence = JSON.stringify(entry.data || ''); } catch { evidence = String(entry.data || ''); }
    return [
      entry.message,
      entry.type,
      entry.category,
      entry.level,
      evidence,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedLogQuery));
  });

  const problemCount = logs.filter((entry) => entry.level === 'warn' || entry.level === 'error').length;
  const chatCount = logs.filter((entry) => (
    entry.type === 'chat.user_message' || entry.type === 'chat.assistant_message'
  )).length;

  return (
    <div className="panel sources-panel">
      <div className="panel-header">
        <span>Sources</span>
        <div className="panel-header-actions">
          <span className="selected-count">
            {selectedFiles.size > 0 && `${selectedFiles.size} selected`}
          </span>
          <button className="panel-header-btn" title="Expand">⬚</button>
        </div>
      </div>
      <div className="panel-content">

        <div className="log-section">
          <div className="log-header">
            <span>Activity &amp; evidence</span>
            <span className="log-header-summary">{logs.length} shown · {problemCount} need attention</span>
          </div>
          <div className="log-filters" role="group" aria-label="Choose which activity logs to show">
            {[
              ['all', `Everything (${logs.length})`],
              ['chat', `Chat (${chatCount})`],
              ['problems', `Problems (${problemCount})`],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                className={`log-filter-btn ${logView === view ? 'active' : ''}`}
                onClick={() => setLogView(view)}
                aria-pressed={logView === view}
              >
                {label}
              </button>
            ))}
            <input
              className="log-search"
              type="search"
              value={logQuery}
              onChange={(event) => setLogQuery(event.currentTarget.value)}
              placeholder="Search messages or evidence"
              aria-label="Search activity messages and evidence"
            />
          </div>
          <div className="log-entries" ref={logContainerRef}>
            {filteredLogs.length === 0 ? (
              <div className="log-entry log-empty">
                <span className="log-message">
                  {logs.length === 0 ? 'No activity has been recorded yet.' : 'No saved activity matches this view.'}
                </span>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const level = LOG_LEVEL_META[log.level] || LOG_LEVEL_META.info;
                const expanded = expandedLogId === log.id;
                const rows = evidenceRows(log);
                return (
                  <article
                    key={log.id}
                    className={`log-entry log-level-${log.level || 'info'} ${log.type === 'chat.user_message' || log.type === 'chat.assistant_message' ? 'log-chat-entry' : ''}`}
                  >
                    <button
                      type="button"
                      className="log-row"
                      onClick={() => setExpandedLogId(expanded ? null : log.id)}
                      aria-expanded={expanded}
                    >
                      <time
                        className="log-time"
                        dateTime={log.timestamp}
                        title={`${formatLogDate(log.timestamp)} at ${formatLogTime(log.timestamp)}`}
                      >
                        {formatLogTime(log.timestamp)}
                      </time>
                      <span className="log-level-label" title={level.label} aria-label={level.label}>
                        {level.glyph}
                      </span>
                      <span className="log-type">{logCategoryLabel(log)}</span>
                      <span className="log-message">{log.message || 'No explanation was recorded.'}</span>
                      <span className="log-expand" aria-hidden="true">{expanded ? '−' : '+'}</span>
                    </button>
                    {expanded && (
                      <div className="log-data">
                        <p className="log-interpretation">{logInterpretation(log)}</p>
                        <p className="log-full-message">{log.message || 'No explanation was recorded.'}</p>
                        {rows.length > 0 && (
                          <dl className="log-evidence-list">
                            {rows.map(([label, value], index) => (
                              <div className="log-evidence-row" key={`${label}-${index}`}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <div className="log-developer-id">
                          Developer event: <code>{log.type || 'system.event'}</code>
                          {' · '}Source: <code>{log.source || 'system'}</code>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
     
        {/* LOCAL Section */}
        <div className="source-section">
          <div
            className="source-header local"
            onClick={() => toggleSection('local')}
          >
            <span>LOCAL</span>
            <span className="source-toggle">{expandedSections.local ? '−' : '+'}</span>
          </div>
          {expandedSections.local && (
            <div className="source-items-tree">
              {isLoadingDirs ? (
                <div className="loading-message">Loading directories...</div>
              ) : homeDirs.length === 0 ? (
                <div className="empty-message">No directories found</div>
              ) : (
                <FileTree
                  rootItems={homeDirs}
                  selectedFiles={selectedFiles}
                />
              )}
            </div>
          )}
        </div>

        {/* iCloud Section */}
        <div className="source-section">
          <div
            className="source-header icloud"
            onClick={() => toggleSection('icloud')}
          >
            <span>iCloud</span>
            <span className="source-toggle">{expandedSections.icloud ? '−' : '+'}</span>
          </div>
          {expandedSections.icloud && (
            <div className="source-items-tree">
              {isLoadingICloud ? (
                <div className="loading-message">Loading iCloud Drive...</div>
              ) : !iCloudAvailable ? (
                <div className="empty-message">iCloud Drive not available</div>
              ) : iCloudDirs.length === 0 ? (
                <div className="empty-message">iCloud Drive is empty</div>
              ) : (
                <FileTree
                  rootItems={iCloudDirs}
                  selectedFiles={selectedFiles}
                />
              )}
            </div>
          )}
        </div>

        {/* USB Drives Section */}
        <div className="source-section">
          <div
            className="source-header usb"
            onClick={() => toggleSection('usb')}
          >
            <span>USB Drives</span>
            <span className="source-toggle">{expandedSections.usb ? '−' : '+'}</span>
          </div>
          {expandedSections.usb && (
            <div className="source-items-tree">
              {isLoadingUSB ? (
                <div className="loading-message">Scanning for USB drives...</div>
              ) : usbDrives.length === 0 ? (
                <div className="empty-message">No USB drives connected</div>
              ) : (
                <FileTree
                  rootItems={usbDrives}
                  selectedFiles={selectedFiles}
                />
              )}
            </div>
          )}
        </div>

        {/* GitHub Section */}
        <div className="source-section">
          <div
            className="source-header github"
            onClick={() => toggleSection('github')}
          >
            <span>GitHub</span>
            <div className="source-header-right">
              {githubConfigured && githubUser && (
                <span className="source-status connected" title={`Connected as ${githubUser.login}`}>●</span>
              )}
              <span className="source-toggle">{expandedSections.github ? '−' : '+'}</span>
            </div>
          </div>
          {expandedSections.github && (
            <div className="source-items-tree github-content">
              {!githubConfigured ? (
                <div className="github-not-configured">
                  <div className="source-status-indicator">
                    <span className="status-dot disconnected" />
                    <span className="status-text">Not connected</span>
                  </div>
                  <div className="source-setup-hint">
                    Configure in Settings → Integrations
                  </div>
                </div>
              ) : isLoadingGithub ? (
                <div className="loading-message">Loading repositories...</div>
              ) : githubError ? (
                <div className="github-error">
                  <div className="source-error-message">{githubError}</div>
                </div>
              ) : selectedRepo ? (
                /* Repo file browser */
                <div className="github-repo-browser">
                  <div className="github-browser-header">
                    <button
                      className="github-back-btn"
                      onClick={handleBackToRepoList}
                      title="Back to repositories"
                    >
                      ← Repos
                    </button>
                    <span className="github-current-repo">{selectedRepo.name}</span>
                  </div>
                  {repoPath && (
                    <div className="github-path-nav">
                      <button
                        className="github-up-btn"
                        onClick={handleRepoGoBack}
                        title="Go to parent folder"
                      >
                        ↑ Up
                      </button>
                      <span className="github-current-path">/{repoPath}</span>
                    </div>
                  )}
                  {isLoadingRepoContents ? (
                    <div className="loading-message">Loading contents...</div>
                  ) : repoContents.length === 0 ? (
                    <div className="empty-message">Empty folder</div>
                  ) : (
                    <div className="github-file-list">
                      {repoContents.map(item => {
                        const githubPath = `github://${selectedRepo.full_name}/${item.path}`;
                        const isSelected = selectedFiles.has(githubPath);
                        return (
                          <DraggableGithubFile
                            key={item.path}
                            item={item}
                            githubPath={githubPath}
                            isSelected={isSelected}
                            onNavigateFolder={handleNavigateRepoFolder}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Repository list */
                <div className="github-repo-list">
                  {githubRepos.length === 0 ? (
                    <div className="empty-message">No repositories found</div>
                  ) : (
                    githubRepos.map(repo => (
                      <div
                        key={repo.id}
                        className="github-repo-item"
                        onClick={() => handleSelectRepo(repo)}
                        title={repo.description || repo.name}
                      >
                        <span className="repo-icon">{repo.private ? '🔒' : '📦'}</span>
                        <span className="repo-name">{repo.name}</span>
                        {repo.language && (
                          <span className="repo-language">{repo.language}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Google Drive Section */}
        <div className="source-section">
          <div
            className="source-header gdrive"
            onClick={() => toggleSection('gdrive')}
          >
            <span>Google Drive</span>
            <div className="source-header-right">
              {gdriveStatus?.isConnected && (
                <span className="source-status connected" title="Connected">●</span>
              )}
              <span className="source-toggle">{expandedSections.gdrive ? '−' : '+'}</span>
            </div>
          </div>
          {expandedSections.gdrive && (
            <div className="source-items-tree">
              {isLoadingGdrive ? (
                <div className="loading-message">Checking connection...</div>
              ) : gdriveStatus?.isConnected ? (
                <div className="coming-soon">Connected - File browsing coming soon...</div>
              ) : (
                <div className="gdrive-not-connected">
                  <div className="source-status-indicator">
                    <span className={`status-dot ${gdriveStatus?.status === 'error' ? 'error' : 'disconnected'}`} />
                    <span className="status-text">
                      {gdriveStatus?.status === 'error' ? 'Connection error' : 'Not connected'}
                    </span>
                  </div>
                  {gdriveStatus?.error && (
                    <div className="source-error-message">{gdriveStatus.error}</div>
                  )}
                  <div className="source-setup-hint">
                    Configure in Settings → Integrations
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default SourcesPanel;
