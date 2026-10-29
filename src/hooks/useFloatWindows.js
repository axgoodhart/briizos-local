import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logger from '../lib/logger';

/**
 * Catalog of feature bodies that can live in an ambient float window. Types
 * match the grid panel types so the same renderPanel mapping serves both
 * shells. Media, Notes, and canvases keep their existing floating
 * implementations and are deliberately absent here.
 */
export const FLOAT_APPS = Object.freeze({
  interaction: { title: 'Chats', width: 560, height: 620 },
  sources: { title: 'Sources', width: 480, height: 600 },
  tasks: { title: 'Tasks', width: 470, height: 640 },
  journal: { title: 'Journals', width: 660, height: 580 },
  notefalls: { title: 'Notefalls', width: 540, height: 620 },
  island: { title: 'Islands', width: 760, height: 580 },
  stylofact: { title: 'Stylofact', width: 640, height: 700 },
});

const SETTINGS_KEY = 'ambient_workspace';
const BROWSER_KEY = 'briizos-ambient-workspace';
const SAVE_DEBOUNCE_MS = 600;
/* Float windows share the 21–79 z band with the existing fixed surfaces
   (the journal float sits at 30) so the two shells interleave instead of
   stacking as two separate worlds. */
const Z_BASE = 21;
const Z_CEILING = 79;
const EDGE_MARGIN = 48;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;

function viewportSize() {
  if (typeof window === 'undefined') return { vw: 1440, vh: 900 };
  return { vw: window.innerWidth, vh: window.innerHeight };
}

/* A window can never be lost: enough of its top edge always stays on
   screen to drag it back, and the top inset keeps windows (and their
   detached capsule titlebars) below the grid header while it is visible.
   A hidden or mid-layout page can briefly report a zero-sized viewport —
   clamping against that would corrupt every saved position, so degenerate
   viewports leave the window untouched. */
function clampBounds(win, topInset = 8) {
  const { vw, vh } = viewportSize();
  if (vw < MIN_WIDTH || vh < MIN_HEIGHT) return win;
  const width = Math.min(Math.max(Math.round(win.width) || 400, MIN_WIDTH), vw);
  const height = Math.min(Math.max(Math.round(win.height) || 300, MIN_HEIGHT), vh);
  const x = Math.min(Math.max(Math.round(win.x) || 0, EDGE_MARGIN - width), vw - EDGE_MARGIN);
  const y = Math.min(Math.max(Math.round(win.y) || 0, topInset), vh - EDGE_MARGIN);
  return { ...win, x, y, width, height };
}

function homeBounds(app, index = 0, topInset = 8) {
  const spec = FLOAT_APPS[app] || { width: 520, height: 480 };
  let { vw, vh } = viewportSize();
  if (vw < MIN_WIDTH || vh < MIN_HEIGHT) {
    vw = 1440;
    vh = 900;
  }
  const width = Math.min(spec.width, Math.max(MIN_WIDTH, vw - 120));
  const height = Math.min(spec.height, Math.max(MIN_HEIGHT, vh - topInset - 140));
  return {
    x: Math.max(24, Math.round((vw - width) / 2) + (index % 5) * 34 - 68),
    y: Math.max(topInset + 6, Math.round(topInset + (vh - topInset - height) / 2.6) + (index % 5) * 26),
    width,
    height,
  };
}

function normalizeStored(raw, topInset = 8) {
  const rows = Array.isArray(raw?.windows) ? raw.windows : [];
  const seen = new Set();
  const windows = [];
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const app = row.app === 'forest' ? 'island' : row.app;
    if (!FLOAT_APPS[app] || seen.has(app)) return;
    seen.add(app);
    windows.push(clampBounds({
      id: app,
      app,
      title: typeof row.title === 'string' && row.title ? row.title : FLOAT_APPS[app].title,
      x: Number(row.x),
      y: Number(row.y),
      width: Number(row.width) || FLOAT_APPS[app].width,
      height: Number(row.height) || FLOAT_APPS[app].height,
      z: Number.isFinite(row.z) ? row.z : Z_BASE,
      minimized: row.minimized === true,
      closed: row.closed === true,
      filled: row.filled === true,
      prevBounds: row.prevBounds && typeof row.prevBounds === 'object' ? row.prevBounds : null,
    }, topInset));
  });
  return windows;
}

/* Keep every z inside the shared band; compress when the counter would
   climb past the modal overlays' territory. */
function withTopZ(windows, id) {
  const maxZ = windows.reduce((acc, win) => Math.max(acc, win.z), Z_BASE - 1);
  let next = windows.map((win) => (win.id === id ? { ...win, z: maxZ + 1 } : win));
  if (maxZ + 1 > Z_CEILING) {
    const order = [...next].sort((a, b) => a.z - b.z).map((win) => win.id);
    next = next.map((win) => ({ ...win, z: Z_BASE + order.indexOf(win.id) }));
  }
  return next;
}

export function useFloatWindows({ topInset = 8 } = {}) {
  const [windows, setWindows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const topInsetRef = useRef(topInset);
  topInsetRef.current = topInset;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored = null;
      try {
        const row = await window.api?.localData?.settings?.get(SETTINGS_KEY);
        stored = row?.value ?? null;
      } catch (error) {
        logger.warn('ui', 'Could not read ambient workspace', error?.message);
      }
      if (stored === null) {
        try {
          stored = JSON.parse(window.localStorage?.getItem(BROWSER_KEY) || 'null');
        } catch {
          stored = null;
        }
      }
      if (!cancelled) {
        setWindows(normalizeStored(stored, topInsetRef.current));
        setIsLoading(false);
        loadedRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* When the grid header appears or disappears the usable top edge moves —
     re-clamp so no capsule titlebar is stranded underneath it. */
  useEffect(() => {
    setWindows((prev) => {
      let changed = false;
      const next = prev.map((win) => {
        const clamped = clampBounds(win, topInset);
        if (clamped.y !== win.y || clamped.x !== win.x) {
          changed = true;
          return clamped;
        }
        return win;
      });
      return changed ? next : prev;
    });
  }, [topInset]);

  useEffect(() => {
    if (!loadedRef.current || isLoading) return undefined;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const payload = {
        version: 1,
        windows: windows.map(({ id, app, title, x, y, width, height, z, minimized, closed, filled, prevBounds }) => ({
          id, app, title, x, y, width, height, z, minimized, closed, filled, prevBounds,
        })),
      };
      try {
        window.localStorage?.setItem(BROWSER_KEY, JSON.stringify(payload));
      } catch { /* ignore */ }
      window.api?.localData?.settings?.set(SETTINGS_KEY, payload)?.catch((error) => {
        logger.warn('ui', 'Could not save ambient workspace', error?.message);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [windows, isLoading]);

  /* Re-clamp after the app window itself resizes so nothing strands
     off screen. */
  useEffect(() => {
    let timer = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setWindows((prev) => {
          let changed = false;
          const next = prev.map((win) => {
            const clamped = clampBounds(win, topInsetRef.current);
            if (clamped.x !== win.x || clamped.y !== win.y || clamped.width !== win.width || clamped.height !== win.height) {
              changed = true;
              return clamped;
            }
            return win;
          });
          return changed ? next : prev;
        });
      }, 250);
    };
    window.addEventListener('resize', onResize);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const openWindow = useCallback((app) => {
    if (!FLOAT_APPS[app]) return null;
    setWindows((prev) => {
      const existing = prev.find((win) => win.app === app);
      if (existing) {
        logger.info('ui', 'Float window restored with its remembered size and position', { app });
        return withTopZ(
          prev.map((win) => (win.app === app ? { ...win, minimized: false, closed: false } : win)),
          existing.id,
        );
      }
      const created = clampBounds({
        id: app,
        app,
        title: FLOAT_APPS[app].title,
        ...homeBounds(app, prev.length, topInsetRef.current),
        z: Z_BASE,
        minimized: false,
        filled: false,
        prevBounds: null,
      }, topInsetRef.current);
      logger.info('ui', 'Float window opened', { app });
      return withTopZ([...prev, created], created.id);
    });
    return app;
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      if (!prev.some((win) => win.id === id)) return prev;
      logger.info('ui', 'Float window closed', { app: id });
      return prev.map((win) => win.id === id ? { ...win, closed: true, minimized: false } : win);
    });
  }, []);

  const focusWindow = useCallback((id) => {
    setWindows((prev) => {
      const target = prev.find((win) => win.id === id);
      if (!target) return prev;
      const topZ = prev.reduce((acc, win) => Math.max(acc, win.z), Z_BASE - 1);
      if (target.z === topZ && !target.minimized && !target.closed) return prev;
      return withTopZ(
        prev.map((win) => (win.id === id ? { ...win, minimized: false, closed: false } : win)),
        id,
      );
    });
  }, []);

  const minimizeWindow = useCallback((id) => {
    logger.info('ui', 'Float window minimized to dock', { app: id });
    setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, minimized: true } : win)));
  }, []);

  const restoreWindow = useCallback((id) => {
    focusWindow(id);
  }, [focusWindow]);

  const moveWindow = useCallback((id, { x, y }) => {
    logger.info('ui', 'Float window position remembered', { app: id, x, y });
    setWindows((prev) => prev.map((win) => (win.id === id ? clampBounds({ ...win, x, y }, topInsetRef.current) : win)));
  }, []);

  const resizeWindow = useCallback((id, { width, height }) => {
    logger.info('ui', 'Float window size remembered', { app: id, width, height });
    setWindows((prev) => prev.map((win) => (win.id === id ? clampBounds({ ...win, width, height }, topInsetRef.current) : win)));
  }, []);

  /* Return Home restores the app's useful default size, centered. It is a
     position action only — feature-owned "Back"/"Dock to" actions stay
     separate. */
  const returnHome = useCallback((id) => {
    logger.info('ui', 'Float window returned home', { app: id });
    setWindows((prev) => withTopZ(
      prev.map((win) => (
        win.id === id
          ? clampBounds({
            ...win,
            ...homeBounds(win.app, 0, topInsetRef.current),
            filled: false,
            prevBounds: null,
            minimized: false,
          }, topInsetRef.current)
          : win
      )),
      id,
    ));
  }, []);

  /* Fill Screen expands to the host's usable area and remembers the prior
     placement; toggling again restores it. */
  const toggleFill = useCallback((id) => {
    setWindows((prev) => withTopZ(
      prev.map((win) => {
        if (win.id !== id) return win;
        if (win.filled) {
          const prevBounds = win.prevBounds || homeBounds(win.app, 0, topInsetRef.current);
          return clampBounds({ ...win, ...prevBounds, filled: false, prevBounds: null }, topInsetRef.current);
        }
        return {
          ...win,
          filled: true,
          minimized: false,
          prevBounds: { x: win.x, y: win.y, width: win.width, height: win.height },
        };
      }),
      id,
    ));
  }, []);

  const getWindow = useCallback((app) => windows.find((win) => win.app === app && !win.closed) || null, [windows]);

  const topWindowId = useMemo(() => {
    let top = null;
    windows.forEach((win) => {
      if (win.minimized || win.closed) return;
      if (!top || win.z > top.z) top = win;
    });
    return top?.id || null;
  }, [windows]);

  const minimizedWindows = useMemo(() => windows.filter((win) => win.minimized && !win.closed), [windows]);

  return {
    windows: windows.filter((win) => !win.closed),
    minimizedWindows,
    topWindowId,
    isLoading,
    getWindow,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    moveWindow,
    resizeWindow,
    returnHome,
    toggleFill,
  };
}

export default useFloatWindows;
