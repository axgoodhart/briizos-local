/**
 * useBriizyCapture — renderer-side view of the briizy capture pipeline.
 *
 * Holds live status/config, exposes the controls the Notefalls drawer needs, and
 * logs every user-initiated capture action to the LogPanel (Hard Rule 1). All
 * state comes from main over the `briizy:event` push channel, so the panel never
 * polls and never disagrees with the indexer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '../lib/logger';
import { briizyApi, isBriizyAvailable, UNAVAILABLE_STATUS } from '../components/notefalls/briizyApi';

export function useBriizyCapture() {
  const [status, setStatus] = useState(UNAVAILABLE_STATUS);
  const [config, setConfig] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  const available = isBriizyAvailable();

  const refresh = useCallback(async () => {
    const [nextStatus, nextConfig] = await Promise.all([
      briizyApi.getStatus(),
      briizyApi.getConfig(),
    ]);
    if (!mounted.current) return;
    if (nextStatus) setStatus(nextStatus);
    if (nextConfig) setConfig(nextConfig);
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    briizyApi.getDefaults().then((value) => {
      if (mounted.current && value) setDefaults(value);
    });

    const unsubscribe = briizyApi.onEvent(({ type, payload }) => {
      if (!mounted.current) return;
      if (type === 'status') setStatus(payload);
      else if (type === 'config') setConfig(payload);
      else if (type === 'paused' || type === 'resumed') refresh();
    });
    return () => {
      mounted.current = false;
      unsubscribe?.();
    };
  }, [refresh]);

  /** Run a control action, keeping the UI honest about in-flight state. */
  const act = useCallback(async (label, run, data) => {
    setBusy(true);
    logger.info('briizy', label, data);
    try {
      const result = await run();
      await refresh();
      return result;
    } catch (error) {
      logger.error('briizy', `${label} failed`, error?.message);
      return null;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [refresh]);

  /**
   * The single switch behind the composer's "auto capture is ON/OFF" control.
   * Turning it on for the first time runs onboarding rather than silently
   * enabling capture (I10).
   */
  const toggleCapture = useCallback(async (nextEnabled) => {
    const enable = nextEnabled ?? !status.enabled;
    if (enable && !status.onboarded) {
      return act('Capture onboarding accepted', () => briizyApi.completeOnboarding({ enabled: true }), {
        enabled: true,
      });
    }
    return act(`Capture turned ${enable ? 'on' : 'off'}`, () => briizyApi.setConfig({ enabled: enable }), {
      enabled: enable,
    });
  }, [act, status.enabled, status.onboarded]);

  const togglePause = useCallback(async () => {
    const paused = !!status.paused;
    return act(paused ? 'Capture resumed' : 'Capture paused',
      () => (paused ? briizyApi.resume('notefalls') : briizyApi.pause('notefalls')));
  }, [act, status.paused]);

  const toggleDisplaySession = useCallback(async () => {
    const active = status.session?.kind === 'display';
    return act(active ? 'Display session ended' : 'Display session started',
      () => (active ? briizyApi.endDisplaySession() : briizyApi.startDisplaySession()));
  }, [act, status.session?.kind]);

  const updateConfig = useCallback((patch) => (
    act('Capture settings changed', () => briizyApi.setConfig(patch), patch)
  ), [act]);

  const clearHistory = useCallback((scope) => (
    act('Screen history cleared', () => briizyApi.deleteHistory(scope), scope)
  ), [act]);

  return {
    available,
    status,
    config,
    defaults,
    busy,
    refresh,
    toggleCapture,
    togglePause,
    toggleDisplaySession,
    updateConfig,
    clearHistory,
  };
}

export default useBriizyCapture;
