import { useState, useEffect, useRef, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import FileTree, { SOURCE_FILE_TYPE } from './FileTree';
import {
  getSelectedFiles,
  getSetting,
} from '../lib/firestore';
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

  // Load selected files from Firestore on mount
  useEffect(() => {
    const loadSelectedFiles = async () => {
      try {
        const files = await getSelectedFiles();
        const paths = new Set(files.map(f => f.file_path));
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
        // Load GitHub token from Firestore and push to main process
        const token = await getSetting('github_token');
        if (token && api.githubSetToken) {
          api.githubSetToken(token);
        }
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
        const files = await getSelectedFiles();
        const paths = new Set(files.map(f => f.file_path));
        setSelectedFiles(paths);
      } catch (error) {
        logger.error('fs', 'Failed to refresh selected files', error?.message);
      }
    };

    const interval = setInterval(refreshSelectedFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to the unified local log stream (renderer + Electron main).
  useEffect(() => {
    const unsubscribe = subscribeLogs((logData) => {
      setLogs(logData.slice(0, 80));
    });

    return () => unsubscribe();
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

        {/*Logs Section */}

        {/* Log Section */}
        <div className="log-section">
          <div className="log-header">Log</div>
          <div className="log-entries" ref={logContainerRef}>
            {logs.length === 0 ? (
              <div className="log-entry">
                <span className="log-message">No activity yet...</span>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-date">{formatLogDate(log.timestamp)}</span>
                  <span className="log-time">{formatLogTime(log.timestamp)}</span>
                  <span className="log-action">[{log.level || 'info'}:{log.category || log.action || 'system'}]</span>
                  {log.message && <span className="log-message">{log.message}</span>}
                </div>
              ))
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
