import { useDragSelectionLock } from '../lib/dragSelection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { computeFloatingShellChrome } from '../lib/floatingShell';
import logger from '../lib/logger';

const DEFAULT_FLOATING_SIZE = {
  width: 720,
  height: 620,
};

const VIDEO_EXTENSIONS = new Set(['mp4', 'm4v', 'mov', 'webm', 'ogv']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'oga', 'opus', 'aiff', 'aif']);
const MEDIA_ACCEPT = [
  ...Array.from(VIDEO_EXTENSIONS, (ext) => `.${ext}`),
  ...Array.from(AUDIO_EXTENSIONS, (ext) => `.${ext}`),
].join(',');
const REPEAT_ORDER = ['off', 'all', 'one'];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function extensionFromName(name = '') {
  const [, ext = ''] = String(name).toLowerCase().match(/\.([^.]+)$/) || [];
  return ext;
}

function inferKind(name, type = '') {
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';

  const ext = extensionFromName(name);
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  return null;
}

function filePathToFileUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(filePath)) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  const absolutePath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `file://${absolutePath.split('/').map((part) => encodeURIComponent(part)).join('/')}`;
}

function sourceLocationFrom(fileLike = {}) {
  return fileLike.sourceLocation
    || fileLike.path
    || fileLike.filePath
    || fileLike.source?.path
    || null;
}

function trackKey(track) {
  return track.sourceLocation || track.path || `${track.name}:${track.size || 0}:${track.lastModified || 0}`;
}

function normalizeTrack(fileLike = {}) {
  const sourceLocation = sourceLocationFrom(fileLike);
  const url = fileLike.url || filePathToFileUrl(sourceLocation);
  const kind = fileLike.kind || inferKind(fileLike.name || sourceLocation, fileLike.type);
  if (!kind || !url) return null;

  return {
    id: fileLike.id || sourceLocation || trackKey(fileLike) || `${fileLike.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    path: sourceLocation,
    sourceLocation,
    url,
    name: fileLike.name || (sourceLocation ? sourceLocation.split(/[\\/]/).pop() : 'Untitled media'),
    size: Number(fileLike.size) || 0,
    type: fileLike.type || `${kind}/${extensionFromName(fileLike.name || sourceLocation) || 'local'}`,
    kind,
    lastModified: fileLike.lastModified || null,
    persistable: !!(fileLike.persistable || sourceLocation),
    objectUrl: !!fileLike.objectUrl && !sourceLocation,
  };
}

function MediaPanel({
  floating = false,
  onClose = null,
  panelPosition = null,
  panelDimensions = null,
  onPanelChange = null,
}) {
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [shuffle, setShuffle] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [shellHidden, setShellHidden] = useState(false);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const [panelPos, setPanelPos] = useState(panelPosition || null);
  const [panelSize, setPanelSize] = useState(panelDimensions || DEFAULT_FLOATING_SIZE);
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [resizingPanel, setResizingPanel] = useState(false);
  useDragSelectionLock(!!(draggingPanel || resizingPanel));
  const [panelDragOffset, setPanelDragOffset] = useState({ x: 0, y: 0 });
  const [panelResizeStart, setPanelResizeStart] = useState({
    mouseX: 0,
    mouseY: 0,
    width: DEFAULT_FLOATING_SIZE.width,
    height: DEFAULT_FLOATING_SIZE.height,
  });
  const [shellChrome, setShellChrome] = useState(() => computeFloatingShellChrome({
    x: 0,
    y: 0,
    width: DEFAULT_FLOATING_SIZE.width,
    height: DEFAULT_FLOATING_SIZE.height,
  }));

  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const panelFrameRef = useRef(null);
  const objectUrlsRef = useRef(new Set());
  const pendingResumeTimeRef = useRef(0);
  const shouldAutoPlayRef = useRef(false);

  const activeTrack = tracks[currentIndex] || null;
  const currentSecond = Math.floor(currentTime);

  const revokeObjectUrl = useCallback((url) => {
    if (!url || !objectUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }, []);

  const revokeTrackUrl = useCallback((track) => {
    if (track?.objectUrl) revokeObjectUrl(track.url);
  }, [revokeObjectUrl]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await window.api.localData.media.get();
        const savedTracks = Array.isArray(saved?.tracks)
          ? saved.tracks.map((track) => normalizeTrack({
            ...track,
            id: track.queue_id,
            name: track.display_name,
            lastModified: track.modified_at,
            persistable: true,
          })).filter((track) => track?.path)
          : [];
        const savedSourceLocations = savedTracks.map((track) => track.sourceLocation || track.path).filter(Boolean);

        const restoredIndex = saved?.currentItemId
          ? savedTracks.findIndex((track) => track.id === saved.currentItemId)
          : 0;
        setTracks(savedTracks);
        setCurrentIndex(Math.min(Math.max(restoredIndex, 0), Math.max(savedTracks.length - 1, 0)));
        setVolume(Number.isFinite(saved.volume) ? saved.volume : 100);
        setIsMuted(!!saved.isMuted);
        setRepeatMode(REPEAT_ORDER.includes(saved.repeatMode) ? saved.repeatMode : 'off');
        setShuffle(!!saved.shuffle);
        setLibraryOpen(saved.panelState?.queueOpen !== false);
        setShellHidden(!!saved.panelState?.shellHidden);
        pendingResumeTimeRef.current = Number(saved.currentTime) || 0;

        const api = typeof window !== 'undefined' ? window.api : null;
        if (savedSourceLocations.length && api?.mediaDescribeFiles) {
          api.mediaDescribeFiles(savedSourceLocations)
            .then((result) => {
              const refreshedTracks = (result?.files || []).map(normalizeTrack).filter(Boolean);
              if (refreshedTracks.length) {
                const bySource = new Map(refreshedTracks.map((track) => [track.sourceLocation || track.path, track]));
                setTracks((currentTracks) => currentTracks.map((track) => bySource.get(track.sourceLocation || track.path) || track));
              }
            })
            .catch((err) => logger.warn('media', 'Unable to refresh stored media library', err?.message));
        }
      } catch (err) {
        logger.warn('media', 'Unable to restore media state', err?.message);
      } finally {
        setHasRestoredState(true);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (!hasRestoredState) return;
    const persistableTracks = tracks
      .map((track) => {
        const sourceLocation = track.sourceLocation || track.path;
        if (!sourceLocation) return null;
        return {
          ...track,
          id: sourceLocation,
          path: sourceLocation,
          sourceLocation,
          url: track.url?.startsWith('blob:') ? filePathToFileUrl(sourceLocation) : (track.url || filePathToFileUrl(sourceLocation)),
          persistable: true,
          objectUrl: false,
        };
      })
      .filter(Boolean);
    const activeSourceLocation = activeTrack?.sourceLocation || activeTrack?.path;
    const activePersistedIndex = activeSourceLocation
      ? persistableTracks.findIndex((track) => track.sourceLocation === activeSourceLocation)
      : -1;

    window.api?.localData?.media?.save({
      tracks: persistableTracks.map((track) => ({
        path: track.sourceLocation,
        displayName: track.name,
        kind: track.kind,
        size: track.size || null,
        modifiedAt: track.lastModified || null,
      })),
      currentIndex: Math.max(activePersistedIndex, 0),
      currentTime: currentSecond,
      volume,
      isMuted,
      repeatMode,
      shuffle,
      queueOpen: libraryOpen,
      shellHidden,
    }).catch((err) => logger.warn('media', 'Unable to save media state', err?.message));
  }, [
    activeTrack,
    currentSecond,
    hasRestoredState,
    isMuted,
    libraryOpen,
    repeatMode,
    shellHidden,
    shuffle,
    tracks,
    volume,
  ]);

  useEffect(() => {
    const updateShellChrome = () => {
      if (!panelFrameRef.current) return;
      const rect = panelFrameRef.current.getBoundingClientRect();
      setShellChrome(computeFloatingShellChrome(rect));
    };

    updateShellChrome();
    const frameId = window.requestAnimationFrame(updateShellChrome);
    window.addEventListener('resize', updateShellChrome);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && panelFrameRef.current) {
      resizeObserver = new ResizeObserver(() => updateShellChrome());
      resizeObserver.observe(panelFrameRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateShellChrome);
      resizeObserver?.disconnect();
    };
  }, [floating, panelPos, panelSize, libraryOpen, shellHidden]);

  useEffect(() => {
    setError(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeTrack?.id]);

  const createObjectTrack = useCallback((file) => {
    const kind = inferKind(file.name, file.type);
    if (!kind) return null;

    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);

    return normalizeTrack({
      id: `session:${file.name}:${file.size}:${file.lastModified}:${Math.random().toString(36).slice(2)}`,
      url,
      name: file.name,
      size: file.size,
      type: file.type,
      kind,
      lastModified: file.lastModified,
      persistable: false,
      objectUrl: true,
    });
  }, []);

  const createSourceTrack = useCallback((file, filePath) => {
    const kind = inferKind(file.name || filePath, file.type);
    if (!kind || !filePath) return null;

    return normalizeTrack({
      id: filePath,
      path: filePath,
      sourceLocation: filePath,
      url: filePathToFileUrl(filePath),
      name: file.name,
      size: file.size,
      type: file.type,
      kind,
      lastModified: file.lastModified,
      persistable: true,
    });
  }, []);

  const describeBrowserFiles = useCallback(async (files) => {
    const fileList = Array.from(files || []);
    const api = typeof window !== 'undefined' ? window.api : null;
    const pathEntries = [];
    const sessionFiles = [];

    for (const file of fileList) {
      if (!inferKind(file.name, file.type)) continue;

      let filePath = '';
      try {
        filePath = api?.mediaGetFilePath ? api.mediaGetFilePath(file) : '';
      } catch {
        filePath = '';
      }

      if (filePath) {
        pathEntries.push({ file, filePath });
      } else {
        sessionFiles.push(file);
      }
    }

    const tracksFromPaths = [];
    if (pathEntries.length && api?.mediaDescribeFiles) {
      let byPath = new Map();
      try {
        const result = await api.mediaDescribeFiles(pathEntries.map((entry) => entry.filePath));
        byPath = new Map((result?.files || []).map((file) => [file.path, normalizeTrack(file)]));
      } catch (err) {
        logger.warn('media', 'Unable to describe selected media files', err?.message);
      }
      pathEntries.forEach(({ file, filePath }) => {
        const described = byPath.get(filePath);
        tracksFromPaths.push(described || createSourceTrack(file, filePath));
      });
    } else {
      sessionFiles.push(...pathEntries.map((entry) => entry.file));
    }

    return [
      ...tracksFromPaths.filter(Boolean),
      ...sessionFiles.map(createObjectTrack).filter(Boolean),
    ];
  }, [createObjectTrack, createSourceTrack]);

  const addTracks = useCallback((incomingTracks, { replace = false, autoplay = false } = {}) => {
    const normalized = incomingTracks.map(normalizeTrack).filter(Boolean);
    if (!normalized.length) {
      setError('Choose supported audio or video.');
      return;
    }

    setTracks((previous) => {
      const base = replace ? [] : previous;
      const seen = new Set(base.map(trackKey));
      const nextTracks = [...base];
      let firstNewIndex = -1;

      normalized.forEach((track) => {
        const key = trackKey(track);
        if (seen.has(key)) return;
        seen.add(key);
        if (firstNewIndex === -1) firstNewIndex = nextTracks.length;
        nextTracks.push(track);
      });

      if (firstNewIndex === -1) {
        setError('Those files are already in the playlist.');
        return previous;
      }

      if (replace || !previous.length) {
        pendingResumeTimeRef.current = 0;
        shouldAutoPlayRef.current = autoplay;
        setCurrentIndex(firstNewIndex);
      }

      setError(null);
      return nextTracks;
    });
  }, []);

  const openPicker = async () => {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (api?.mediaOpenFiles) {
      try {
        const result = await api.mediaOpenFiles();
        addTracks(result?.files || [], { autoplay: !tracks.length });
      } catch (err) {
        setError(err?.message || 'Unable to open media files.');
      }
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileInput = async (e) => {
    const nextTracks = await describeBrowserFiles(e.target.files);
    addTracks(nextTracks, { autoplay: !tracks.length });
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const nextTracks = await describeBrowserFiles(e.dataTransfer.files);
    addTracks(nextTracks, { autoplay: !tracks.length });
  };

  const playTrackAt = useCallback((index, { autoplay = isPlaying, resumeTime = 0 } = {}) => {
    if (index < 0 || index >= tracks.length) return;
    if (index === currentIndex) {
      const element = mediaRef.current;
      if (autoplay && element?.paused) {
        element.play().catch((err) => setError(err?.message || 'Unable to play media.'));
      }
      return;
    }
    pendingResumeTimeRef.current = resumeTime;
    shouldAutoPlayRef.current = autoplay;
    setCurrentIndex(index);
  }, [currentIndex, isPlaying, tracks.length]);

  const getRandomIndex = useCallback(() => {
    if (tracks.length <= 1) return currentIndex;
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    }
    return nextIndex;
  }, [currentIndex, tracks.length]);

  const skipToNext = useCallback(({ fromEnded = false } = {}) => {
    if (!tracks.length) return;

    if (fromEnded && repeatMode === 'one') {
      pendingResumeTimeRef.current = 0;
      shouldAutoPlayRef.current = true;
      setCurrentIndex((index) => index);
      const element = mediaRef.current;
      if (element) {
        element.currentTime = 0;
        element.play().catch((err) => setError(err?.message || 'Unable to replay media.'));
      }
      return;
    }

    if (shuffle) {
      playTrackAt(getRandomIndex(), { autoplay: fromEnded || isPlaying });
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < tracks.length) {
      playTrackAt(nextIndex, { autoplay: fromEnded || isPlaying });
      return;
    }

    if (repeatMode === 'all') {
      playTrackAt(0, { autoplay: fromEnded || isPlaying });
      return;
    }

    setIsPlaying(false);
  }, [currentIndex, getRandomIndex, isPlaying, playTrackAt, repeatMode, shuffle, tracks.length]);

  const skipToPrevious = () => {
    const element = mediaRef.current;
    if (element && element.currentTime > 3) {
      element.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (!tracks.length) return;
    if (shuffle) {
      playTrackAt(getRandomIndex(), { autoplay: isPlaying });
      return;
    }

    const previousIndex = currentIndex - 1;
    if (previousIndex >= 0) {
      playTrackAt(previousIndex, { autoplay: isPlaying });
    } else if (repeatMode === 'all') {
      playTrackAt(tracks.length - 1, { autoplay: isPlaying });
    }
  };

  const handlePlayPause = async () => {
    const element = mediaRef.current;
    if (!element || !activeTrack) return;

    try {
      if (element.paused) {
        await element.play();
      } else {
        element.pause();
      }
    } catch (err) {
      setError(err?.message || 'Unable to play media.');
    }
  };

  const handleStop = () => {
    const element = mediaRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    const element = mediaRef.current;
    if (!element) return;
    const nextTime = Number(e.target.value);
    element.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (e) => {
    const element = mediaRef.current;
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (element) {
      element.volume = newVolume / 100;
      element.muted = false;
    }
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    const element = mediaRef.current;
    if (!element) return;
    const nextMuted = !element.muted;
    element.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const cycleRepeat = () => {
    setRepeatMode((mode) => {
      const index = REPEAT_ORDER.indexOf(mode);
      return REPEAT_ORDER[(index + 1) % REPEAT_ORDER.length];
    });
  };

  const handleFullscreen = async () => {
    const element = mediaRef.current;
    if (!element?.requestFullscreen) return;
    try {
      await element.requestFullscreen();
    } catch (err) {
      logger.warn('media', 'Fullscreen request failed', err?.message);
    }
  };

  const clearLibrary = () => {
    const element = mediaRef.current;
    if (element) {
      element.pause();
      element.removeAttribute('src');
      element.load?.();
    }
    tracks.forEach(revokeTrackUrl);
    setTracks([]);
    setCurrentIndex(0);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const removeTrack = (index) => {
    setTracks((previous) => {
      const track = previous[index];
      if (!track) return previous;
      revokeTrackUrl(track);
      if (index === currentIndex) {
        shouldAutoPlayRef.current = isPlaying;
      }

      const nextTracks = previous.filter((_, trackIndex) => trackIndex !== index);
      if (!nextTracks.length) {
        setCurrentIndex(0);
      } else if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (index === currentIndex) {
        setCurrentIndex(Math.min(currentIndex, nextTracks.length - 1));
      }
      return nextTracks;
    });
  };

  const moveTrack = (index, direction) => {
    setTracks((previous) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= previous.length) return previous;
      const nextTracks = [...previous];
      const [track] = nextTracks.splice(index, 1);
      nextTracks.splice(nextIndex, 0, track);

      if (currentIndex === index) setCurrentIndex(nextIndex);
      else if (currentIndex === nextIndex) setCurrentIndex(index);
      return nextTracks;
    });
  };

  const handleLoadedMetadata = (e) => {
    const element = e.currentTarget;
    const nextDuration = element.duration || 0;
    setDuration(nextDuration);
    element.volume = volume / 100;
    element.muted = isMuted;

    const resumeTime = pendingResumeTimeRef.current;
    if (resumeTime > 0 && resumeTime < nextDuration - 1) {
      element.currentTime = resumeTime;
      setCurrentTime(resumeTime);
    }
    pendingResumeTimeRef.current = 0;

    if (shouldAutoPlayRef.current) {
      shouldAutoPlayRef.current = false;
      element.play().catch((err) => setError(err?.message || 'Unable to play media.'));
    }
  };

  const handlePanelKeyDown = (e) => {
    if (e.target.closest('input, button')) return;
    if (e.key === ' ') {
      e.preventDefault();
      handlePlayPause();
    } else if (e.key === 'ArrowRight') {
      const element = mediaRef.current;
      if (element) element.currentTime = Math.min((element.currentTime || 0) + 10, duration || Infinity);
    } else if (e.key === 'ArrowLeft') {
      const element = mediaRef.current;
      if (element) element.currentTime = Math.max((element.currentTime || 0) - 10, 0);
    } else if (e.key.toLowerCase() === 'n') {
      skipToNext();
    } else if (e.key.toLowerCase() === 'p') {
      skipToPrevious();
    }
  };

  const handlePanelDragStart = (e) => {
    if (!floating) return;
    if (
      e.target.closest('button')
      || e.target.closest('input')
      || e.target.closest('label')
      || e.target.closest('.media-panel-resize-handle')
    ) return;

    e.preventDefault();
    const panelEl = panelFrameRef.current;
    if (!panelEl) return;
    const rect = panelEl.getBoundingClientRect();

    if (!panelPos) {
      setPanelPos({ x: rect.left, y: rect.top });
      setPanelDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setPanelDragOffset({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
    }
    setDraggingPanel(true);
  };

  const handlePanelResizeStart = (e) => {
    if (!floating) return;
    e.preventDefault();
    e.stopPropagation();

    if (!panelPos && panelFrameRef.current) {
      const rect = panelFrameRef.current.getBoundingClientRect();
      setPanelPos({ x: rect.left, y: rect.top });
    }

    setResizingPanel(true);
    setPanelResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    });
  };

  const handleFloatingMove = useCallback((e) => {
    if (draggingPanel) {
      setPanelPos({
        x: e.clientX - panelDragOffset.x,
        y: e.clientY - panelDragOffset.y,
      });
      return;
    }

    if (resizingPanel) {
      const dx = e.clientX - panelResizeStart.mouseX;
      const dy = e.clientY - panelResizeStart.mouseY;
      setPanelSize({
        width: Math.max(420, panelResizeStart.width + dx),
        height: Math.max(340, panelResizeStart.height + dy),
      });
    }
  }, [draggingPanel, panelDragOffset, resizingPanel, panelResizeStart]);

  const handleFloatingUp = useCallback(() => {
    if (!draggingPanel && !resizingPanel) return;

    setDraggingPanel(false);
    setResizingPanel(false);

    if (onPanelChange) {
      const rect = panelFrameRef.current?.getBoundingClientRect();
      const nextPos = rect ? { x: rect.left, y: rect.top } : panelPos;
      onPanelChange(nextPos, panelSize);
    }
  }, [draggingPanel, resizingPanel, onPanelChange, panelPos, panelSize]);

  useEffect(() => {
    if (!draggingPanel && !resizingPanel) return;

    window.addEventListener('mousemove', handleFloatingMove);
    window.addEventListener('mouseup', handleFloatingUp);
    window.addEventListener('blur', handleFloatingUp);
    window.addEventListener('pointercancel', handleFloatingUp);
    return () => {
      window.removeEventListener('mousemove', handleFloatingMove);
      window.removeEventListener('mouseup', handleFloatingUp);
      window.removeEventListener('blur', handleFloatingUp);
      window.removeEventListener('pointercancel', handleFloatingUp);
    };
  }, [draggingPanel, resizingPanel, handleFloatingMove, handleFloatingUp]);

  const subtitle = activeTrack
    ? activeTrack.name
    : 'Drop or browse';
  const repeatLabel = repeatMode === 'one' ? '􀊟' : repeatMode === 'all' ? '􀯠' : '􀊞';
  const isQueueVisible = libraryOpen && tracks.length > 0 && !shellHidden;

  const renderMediaElement = () => {
    if (!activeTrack) return null;

    const sharedProps = {
      ref: mediaRef,
      src: activeTrack.url,
      className: activeTrack.kind === 'video' ? 'media-video' : 'media-audio',
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: (e) => setCurrentTime(e.currentTarget.currentTime || 0),
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onEnded: () => skipToNext({ fromEnded: true }),
      onError: () => setError('This file could not be decoded by Chromium.'),
    };

    if (activeTrack.kind === 'video') {
      return (
        <video
          key={activeTrack.id}
          {...sharedProps}
          playsInline
          onClick={handlePlayPause}
          onDoubleClick={handleFullscreen}
        />
      );
    }

    return (
      <div className="media-audio-shell">
        <div className="media-audio-card">
          <div className="media-audio-glyph">AUDIO</div>
          <div className="media-audio-name">{activeTrack.name}</div>
          <div className="media-audio-meta">{formatTime(duration)} / {formatBytes(activeTrack.size)}</div>
        </div>
        <audio key={activeTrack.id} {...sharedProps} />
      </div>
    );
  };

  const renderInner = () => (
    <div
      className={`media-panel-shell ${shellHidden ? 'shell-hidden' : ''} ${isPlaying ? 'is-playing' : ''}`}
      style={{
        transform: `perspective(960px) rotateY(${shellChrome.rotateY}deg) rotateX(${shellChrome.rotateX}deg)`,
        boxShadow: shellChrome.boxShadow,
        borderRadius: shellChrome.borderRadius,
        borderTop: shellChrome.borderTop,
        borderBottom: shellChrome.borderBottom,
        borderLeft: shellChrome.borderLeft,
        borderRight: shellChrome.borderRight,
      }}
      tabIndex={0}
      onKeyDown={handlePanelKeyDown}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingFile(false);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        className="media-file-input"
        onChange={handleFileInput}
      />

      <div
        className={`panel-header media-panel-header ${floating ? 'draggable' : ''}`}
        onMouseDown={handlePanelDragStart}
      >
        <div className="media-panel-title-wrap">
          <span className="media-panel-title">Media</span>
          <span className="media-panel-subtitle">{subtitle}</span>
        </div>

        <div className="panel-header-actions media-panel-actions">
          <button className="panel-header-btn media-panel-settings-btn" onClick={() => setLibraryOpen((value) => !value)} title="Toggle library" aria-label="Toggle library">
            􀋷
          </button>
          <button className="panel-header-btn media-panel-settings-btn" onClick={() => setShellHidden((value) => !value)} title="Hide shell" aria-label="Hide shell">
            {shellHidden ? '􀏡' : '􂮨'}
          </button>
          <button className="panel-header-btn media-panel-settings-btn" onClick={openPicker} title="Add media" aria-label="Add media">
            􀑎
          </button>
          {floating && onClose && (
            <button className="panel-header-btn media-panel-close-btn" onClick={onClose} title="Close Media" aria-label="Close Media">
              􀆄
            </button>
          )}
        </div>
      </div>

      <div className="panel-content media-panel-content">
        <div className={`media-panel-body ${isDraggingFile ? 'dragging-file' : ''}`}>
          {!activeTrack ? (
            <div className={`media-dropzone ${isDraggingFile ? 'dragging' : ''}`}>
              <div className="media-empty-text">Drop media</div>
              <button className="media-browse-button" onClick={openPicker}>
                Browse
              </button>
              {error && <div className="media-error">{error}</div>}
            </div>
          ) : (
            <div className={`media-workspace ${isQueueVisible ? 'with-queue' : 'solo'}`}>
              <main className="media-main">
                <div className="media-stage">
                  {renderMediaElement()}
                </div>

                <div className="media-progress">
                  <span className="media-time">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeek}
                    className="media-progress-slider"
                    disabled={!duration}
                  />
                  <span className="media-time">{formatTime(duration)}</span>
                </div>

                <div className="media-controls">
                  <button className="media-control-btn" onClick={skipToPrevious} title="Previous" disabled={tracks.length < 2 && currentTime <= 3}>
                    􀊊
                  </button>
                  <button className={`media-control-btn media-play-btn ${isPlaying ? 'playing' : ''}`} onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                      {isPlaying ? '􀊆' : '􀊄'}
                  </button>
                  <button className="media-control-btn" onClick={handleStop} title="Stop">
                      􀛷
                  </button>
                  <button className="media-control-btn" onClick={() => skipToNext()} title="Next" disabled={tracks.length < 2 && repeatMode !== 'all'}>
                      􀊌
                  </button>
                  <button className={`media-control-btn ${shuffle ? 'active' : ''}`} onClick={() => setShuffle((value) => !value)} title="Shuffle">
                      􀊝
                  </button>
                  <button className={`media-control-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={cycleRepeat} title="Repeat">
                    {repeatLabel}
                  </button>
                  <button className="media-control-btn" onClick={handleToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                      {isMuted ? '􀊣' : '􀊠'}
                  </button>
                  <button className="media-control-btn" onClick={handleFullscreen} title="Fullscreen" disabled={activeTrack.kind !== 'video'}>
                      􀷘
                  </button>

                  <div className="media-volume">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="media-volume-slider"
                      aria-label="Volume"
                    />
                  </div>
                </div>

                {error && <div className="media-error">{error}</div>}
              </main>

              {isQueueVisible && (
                <aside className="media-playlist">
                  <div className="media-playlist-header">
                    <span>Library</span>
                    <div className="media-playlist-actions">
                      <button onClick={openPicker} title="Add media">+</button>
                      <button onClick={clearLibrary} title="Clear library">Clear</button>
                    </div>
                  </div>
                  <div className="media-playlist-list">
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={`media-track-row ${index === currentIndex ? 'active' : ''}`}
                        onDoubleClick={() => playTrackAt(index, { autoplay: true })}
                      >
                        <button className="media-track-main" onClick={() => playTrackAt(index, { autoplay: isPlaying })}>
                          <span className="media-track-index">{String(index + 1).padStart(2, '0')}</span>
                          <span className="media-track-copy">
                            <span className="media-track-name">{track.name}</span>
                            <span className="media-track-meta">{track.kind} / {formatBytes(track.size) || 'local'}</span>
                          </span>
                        </button>
                        <div className="media-track-actions">
                          <button onClick={() => moveTrack(index, -1)} disabled={index === 0} title="Move up">^</button>
                          <button onClick={() => moveTrack(index, 1)} disabled={index === tracks.length - 1} title="Move down">v</button>
                          <button onClick={() => removeTrack(index)} title="Remove">x</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (floating) {
    const fallbackX = typeof window !== 'undefined'
      ? Math.max(36, window.innerWidth * 0.58 - panelSize.width / 2)
      : 140;
    const fallbackY = typeof window !== 'undefined'
      ? Math.max(72, window.innerHeight * 0.16)
      : 110;

    return (
      <div
        ref={panelFrameRef}
        className={`media-floating-panel ${draggingPanel ? 'dragging' : ''} ${resizingPanel ? 'resizing' : ''}`}
        style={{
          left: panelPos?.x ?? fallbackX,
          top: panelPos?.y ?? fallbackY,
          width: panelSize.width,
          height: panelSize.height,
        }}
      >
        {renderInner()}
        <div className="media-panel-resize-handle" onMouseDown={handlePanelResizeStart} />
      </div>
    );
  }

  return (
    <div ref={panelFrameRef} className="media-panel">
      {renderInner()}
    </div>
  );
}

export default MediaPanel;
