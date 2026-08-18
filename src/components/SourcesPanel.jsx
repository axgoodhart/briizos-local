import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import FileTree, { SOURCE_FILE_TYPE } from './FileTree';
import logger, { subscribeLogs } from '../lib/logger';
import {
  LOG_FACETS,
  activityMatchesQuery,
  buildLogActivities,
} from '../lib/logActivities';
import './SourcesPanel.logs.css';

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

const MUTED_LOG_TYPES_KEY = 'briizos.logs.mutedTypes';

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

function activityInterpretation(activity) {
  if (activity.level === 'error') {
    return `${activity.problemCount} recorded detail${activity.problemCount === 1 ? '' : 's'} report a failure. Expand the individual steps below to see what failed and what, if anything, continued.`;
  }
  if (activity.level === 'warn') {
    return `${activity.problemCount} recorded detail${activity.problemCount === 1 ? '' : 's'} need attention. The remaining details are retained to show what led to that warning.`;
  }
  if (activity.detailCount > 1) {
    return `${activity.detailCount} related details were combined under one activity identifier. Nothing was discarded; each original record is available below.`;
  }
  return logInterpretation(activity.details[0]);
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
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const logContainerRef = useRef(null);

  // Reading a live feed must never reflow under the reader: while the pointer
  // is over the list, the list is scrolled away from the top, or a card is
  // expanded, incoming entries queue behind a "N new" pill instead of moving
  // the boxes. Updates are also coalesced so at most ~1 re-render/second.
  const [isHoveringLogs, setIsHoveringLogs] = useState(false);
  const [isScrolledAwayLogs, setIsScrolledAwayLogs] = useState(false);
  const [pendingLogCount, setPendingLogCount] = useState(0);
  const logsPaused = isHoveringLogs || isScrolledAwayLogs || expandedActivityId !== null;
  const logsPausedRef = useRef(false);
  const latestLogsRef = useRef([]);
  const displayedLogIdsRef = useRef(new Set());
  const logPublishTimerRef = useRef(null);

  const [mutedLogTypes, setMutedLogTypes] = useState(() => {
    try { return new Set(JSON.parse(window.localStorage.getItem(MUTED_LOG_TYPES_KEY) || '[]')); }
    catch { return new Set(); }
  });

  const publishLogs = useCallback(() => {
    if (logPublishTimerRef.current) {
      clearTimeout(logPublishTimerRef.current);
      logPublishTimerRef.current = null;
    }
    displayedLogIdsRef.current = new Set(latestLogsRef.current.map((entry) => entry.id));
    setLogs(latestLogsRef.current);
    setPendingLogCount(0);
  }, []);

  const queueLogsUpdate = useCallback(() => {
    if (displayedLogIdsRef.current.size === 0) {
      publishLogs();
      return;
    }
    if (logsPausedRef.current) {
      const displayed = displayedLogIdsRef.current;
      setPendingLogCount(latestLogsRef.current.reduce(
        (count, entry) => count + (displayed.has(entry.id) ? 0 : 1),
        0,
      ));
      return;
    }
    if (logPublishTimerRef.current) return;
    logPublishTimerRef.current = setTimeout(() => {
      logPublishTimerRef.current = null;
      publishLogs();
    }, 900);
  }, [publishLogs]);

  useEffect(() => {
    logsPausedRef.current = logsPaused;
    if (logsPaused) return;
    const displayed = displayedLogIdsRef.current;
    const hasNews = latestLogsRef.current.length !== displayed.size
      || latestLogsRef.current.some((entry) => !displayed.has(entry.id));
    if (hasNews) publishLogs();
  }, [logsPaused, publishLogs]);

  const persistMutedLogTypes = useCallback((next) => {
    setMutedLogTypes(next);
    try { window.localStorage.setItem(MUTED_LOG_TYPES_KEY, JSON.stringify([...next])); }
    catch { /* A view preference that cannot persist is still applied for this session. */ }
  }, []);

  const muteActivityTypes = useCallback((activity) => {
    const next = new Set(mutedLogTypes);
    activity.details.forEach((detail) => { if (detail.type) next.add(detail.type); });
    persistMutedLogTypes(next);
  }, [mutedLogTypes, persistMutedLogTypes]);

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
  // still present in briizos.db. Incoming entries land in latestLogsRef and
  // reach the rendered list through queueLogsUpdate, which respects the
  // paused-while-reading state. Nothing here touches the scroll position.
  useEffect(() => {
    let mounted = true;
    let liveLogs = [];
    let persistedLogs = [];
    const receive = () => {
      if (!mounted) return;
      latestLogsRef.current = mergeLogLists(liveLogs, persistedLogs);
      queueLogsUpdate();
    };

    const unsubscribe = subscribeLogs((logData) => {
      liveLogs = logData;
      receive();
    });

    if (typeof api.localData?.logs?.list === 'function') {
      api.localData.logs.list({ limit: 500 })
        .then((entries) => {
          persistedLogs = Array.isArray(entries) ? entries : [];
          receive();
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
      if (logPublishTimerRef.current) clearTimeout(logPublishTimerRef.current);
    };
  }, [queueLogsUpdate]);

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
  const visibleLogs = useMemo(
    () => (mutedLogTypes.size ? logs.filter((entry) => !mutedLogTypes.has(entry.type)) : logs),
    [logs, mutedLogTypes],
  );
  const mutedEntryCount = logs.length - visibleLogs.length;
  const activities = useMemo(() => buildLogActivities(visibleLogs), [visibleLogs]);
  const filteredActivities = activities.filter((activity) => {
    if (logView === 'problems' && activity.problemCount === 0) return false;
    if (logView !== 'all' && logView !== 'problems' && !activity.facets.has(logView)) return false;
    return activityMatchesQuery(activity, normalizedLogQuery);
  });
  const facetCounts = useMemo(() => Object.fromEntries(LOG_FACETS.map(({ id }) => {
    const count = id === 'all'
      ? activities.length
      : id === 'problems'
        ? activities.filter((activity) => activity.problemCount > 0).length
        : activities.filter((activity) => activity.facets.has(id)).length;
    return [id, count];
  })), [activities]);
  const problemCount = visibleLogs.filter((entry) => entry.level === 'warn' || entry.level === 'error').length;
  const facetLabel = (facetId) => LOG_FACETS.find(({ id }) => id === facetId)?.label || facetId;

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
     <div className="source-list">
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
        <div className="settings-divider"></div>

        <div className="log-section">
          <div className="log-header">
            <span>Activity &amp; evidence</span>
            <span className="log-header-summary">
              {activities.length} activit{activities.length === 1 ? 'y' : 'ies'} · {visibleLogs.length} details · {problemCount} need attention
            </span>
          </div>
          <div className="log-filters" role="group" aria-label="Choose which activity logs to show">
            <div className="log-facet-list">
            {LOG_FACETS.map(({ id: view, label, description }) => (
              <button
                key={view}
                type="button"
                className={`log-filter-btn ${logView === view ? 'active' : ''}`}
                onClick={() => setLogView(view)}
                aria-pressed={logView === view}
                aria-label={`${description}: ${facetCounts[view] || 0} activities`}
                title={`${description} · ${facetCounts[view] || 0} activities`}
              >
                {label}
              </button>
            ))}
            </div>
            <input
              className="log-search"
              type="search"
              value={logQuery}
              onChange={(event) => setLogQuery(event.currentTarget.value)}
              placeholder="Search messages or evidence"
              aria-label="Search activity messages and evidence"
            />
            {mutedLogTypes.size > 0 && (
              <div className="log-muted-note">
                <span>{mutedLogTypes.size} event type{mutedLogTypes.size === 1 ? '' : 's'} muted · {mutedEntryCount} entr{mutedEntryCount === 1 ? 'y' : 'ies'} hidden</span>
                <button type="button" onClick={() => persistMutedLogTypes(new Set())}>unmute all</button>
              </div>
            )}
          </div>
          <div className="log-entries-shell">
            {logsPaused && pendingLogCount > 0 && (
              <button
                type="button"
                className="log-pending-pill"
                onClick={() => {
                  publishLogs();
                  logContainerRef.current?.scrollTo({ top: 0 });
                }}
              >
                Paused while you read · {pendingLogCount} new — show now
              </button>
            )}
            <div
              className="log-entries"
              ref={logContainerRef}
              onScroll={(event) => setIsScrolledAwayLogs(event.currentTarget.scrollTop > 8)}
              onMouseEnter={() => setIsHoveringLogs(true)}
              onMouseLeave={() => setIsHoveringLogs(false)}
            >
            {filteredActivities.length === 0 ? (
              <div className="log-entry log-empty">
                <span className="log-message">
                  {logs.length === 0 ? 'No activity has been recorded yet.' : 'No saved activity matches this view.'}
                </span>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const level = LOG_LEVEL_META[activity.level] || LOG_LEVEL_META.info;
                const expanded = expandedActivityId === activity.id;
                return (
                  <article
                    key={activity.id}
                    className={`log-entry log-activity-card log-level-${activity.level || 'info'}`}
                  >
                    <div className="log-row-wrap">
                      <button
                        type="button"
                        className="log-row"
                        onClick={() => setExpandedActivityId(expanded ? null : activity.id)}
                        aria-expanded={expanded}
                      >
                        <time
                          className="log-time"
                          dateTime={activity.endedAt}
                          title={`${formatLogDate(activity.endedAt)} at ${formatLogTime(activity.endedAt)}`}
                        >
                          {formatLogTime(activity.endedAt)}
                        </time>
                        <span className="log-level-label" title={level.label} aria-label={level.label}>
                          {level.glyph}
                        </span>
                        <span className={`log-type log-facet-${activity.facet}`}>{facetLabel(activity.facet)}</span>
                        <span className="log-message">{activity.title}</span>
                        {activity.detailCount > 1 && (
                          <span className="log-detail-count">{activity.detailCount} details</span>
                        )}
                        <span className="log-expand" aria-hidden="true">{expanded ? '−' : '+'}</span>
                      </button>
                      <button
                        type="button"
                        className="log-mute"
                        title={`Hide "${activity.details[0]?.type || 'this event type'}" from this feed — undo with "unmute all"`}
                        aria-label="Mute this event type"
                        onClick={() => muteActivityTypes(activity)}
                      >
                        mute
                      </button>
                    </div>
                    {expanded && (
                      <div className="log-data">
                        <p className="log-interpretation">{activityInterpretation(activity)}</p>
                        {activity.repeated.length > 0 && (
                          <div className="log-repeat-summary">
                            <strong>Repeated details folded into this card</strong>
                            {activity.repeated.map((repeat) => (
                              <span key={`${repeat.type}-${repeat.message}`}>
                                {repeat.count}× {repeat.message || humanizeLogToken(repeat.type)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="log-activity-meta">
                          {activity.activityId
                            ? <>Activity ID: <code>{activity.activityId}</code></>
                            : <>Legacy grouping: related records within a 10-minute window</>}
                        </div>
                        <div className="log-activity-details">
                          {activity.details.map((log) => {
                            const detailLevel = LOG_LEVEL_META[log.level] || LOG_LEVEL_META.info;
                            const rows = evidenceRows(log);
                            return (
                              <section className="log-detail" key={log.id}>
                                <div className="log-detail-header">
                                  <time dateTime={log.timestamp}>{formatLogTime(log.timestamp)}</time>
                                  <span aria-label={detailLevel.label}>{detailLevel.glyph}</span>
                                  <strong>{logCategoryLabel(log)}</strong>
                                  <code>{log.type || 'system.event'}</code>
                                </div>
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
                                  Source: <code>{log.source || 'system'}</code>
                                  {log.phase ? <>{' · '}Phase: <code>{log.phase}</code></> : null}
                                  {log.outcome ? <>{' · '}Outcome: <code>{log.outcome}</code></> : null}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SourcesPanel;
