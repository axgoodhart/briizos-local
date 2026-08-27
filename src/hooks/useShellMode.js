import { useCallback, useEffect, useState } from 'react';
import logger from '../lib/logger';

/**
 * The chameleon switch: which shell surfaces are active.
 * - grid      → the masonry tile workspace only (classic)
 * - hybrid    → the grid and the floating window layer together
 * - windowed  → the floating window layer and dock only (ambient)
 */
export const SHELL_MODES = Object.freeze({
  GRID: 'grid',
  HYBRID: 'hybrid',
  WINDOWED: 'windowed',
});

const MODE_ORDER = [SHELL_MODES.GRID, SHELL_MODES.HYBRID, SHELL_MODES.WINDOWED];
const BROWSER_KEY = 'briizos-shell-mode';

export function normalizeShellMode(value) {
  return MODE_ORDER.includes(value) ? value : SHELL_MODES.GRID;
}

function readBrowserFallback() {
  try {
    return window.localStorage?.getItem(BROWSER_KEY) || null;
  } catch {
    return null;
  }
}

/* localStorage mirrors the setting so the browser-only dev build (no
   window.api bridge) keeps the choice across reloads too. */
function persistMode(mode) {
  try {
    window.localStorage?.setItem(BROWSER_KEY, mode);
  } catch { /* private mode etc. */ }
  window.api?.localData?.settings?.set('shell_mode', mode)?.catch((error) => {
    logger.warn('ui', 'Could not save shell_mode setting', error?.message);
  });
}

export function useShellMode() {
  const [mode, setModeState] = useState(SHELL_MODES.GRID);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored = null;
      try {
        const row = await window.api?.localData?.settings?.get('shell_mode');
        stored = row?.value ?? null;
      } catch (error) {
        logger.warn('ui', 'Could not read shell_mode setting', error?.message);
      }
      if (stored === null) stored = readBrowserFallback();
      if (!cancelled) {
        setModeState(normalizeShellMode(stored));
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback((nextMode) => {
    const normalized = normalizeShellMode(nextMode);
    setModeState((current) => {
      if (current === normalized) return current;
      persistMode(normalized);
      logger.info('ui', 'Shell mode changed', { mode: normalized });
      return normalized;
    });
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((current) => {
      const next = MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length];
      persistMode(next);
      logger.info('ui', 'Shell mode cycled', { mode: next });
      return next;
    });
  }, []);

  return {
    mode,
    setMode,
    cycleMode,
    isLoading,
    gridActive: mode !== SHELL_MODES.WINDOWED,
    floatActive: mode !== SHELL_MODES.GRID,
  };
}

export default useShellMode;
