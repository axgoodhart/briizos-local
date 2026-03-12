import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * React hook that polls the LangGraph backend status via IPC.
 *
 * Polls at 3-second intervals while the backend is not yet running,
 * then switches to 10-second intervals once healthy.  If the backend
 * transitions away from 'running', reverts to 3-second polling.
 *
 * Returns: { status, ready, port, pid, restartCount, error }
 */

const POLL_FAST_MS = 3000;
const POLL_SLOW_MS = 10000;

export function useLangGraphStatus() {
  const [state, setState] = useState({
    status: 'unknown',
    ready: false,
    port: null,
    pid: null,
    restartCount: 0,
    error: null,
  });

  const intervalRef = useRef(null);
  const currentIntervalMs = useRef(POLL_FAST_MS);

  const fetchStatus = useCallback(async () => {
    try {
      if (!window.api?.langgraphGetStatus) {
        setState((prev) => ({
          ...prev,
          status: 'unavailable',
          ready: false,
          error: 'API not available',
        }));
        return null;
      }

      const result = await window.api.langgraphGetStatus();
      setState({
        status: result.status ?? 'unknown',
        ready: result.ready ?? false,
        port: result.port ?? null,
        pid: result.pid ?? null,
        restartCount: result.restartCount ?? 0,
        error: null,
      });
      return result;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.message ?? 'Unknown error',
      }));
      return null;
    }
  }, []);

  // Manage polling interval — adjust speed based on backend health
  const startPolling = useCallback(
    (intervalMs) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      currentIntervalMs.current = intervalMs;
      intervalRef.current = setInterval(async () => {
        const result = await fetchStatus();
        if (!result) return;

        // Switch polling rate based on health
        if (result.ready && currentIntervalMs.current !== POLL_SLOW_MS) {
          startPolling(POLL_SLOW_MS);
        } else if (!result.ready && currentIntervalMs.current !== POLL_FAST_MS) {
          startPolling(POLL_FAST_MS);
        }
      }, intervalMs);
    },
    [fetchStatus],
  );

  useEffect(() => {
    // Guard: no API available
    if (!window.api?.langgraphGetStatus) {
      setState((prev) => ({
        ...prev,
        status: 'unavailable',
        ready: false,
        error: 'API not available',
      }));
      return;
    }

    // Immediate fetch on mount
    fetchStatus().then((result) => {
      const ms = result?.ready ? POLL_SLOW_MS : POLL_FAST_MS;
      startPolling(ms);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchStatus, startPolling]);

  return state;
}

export default useLangGraphStatus;
