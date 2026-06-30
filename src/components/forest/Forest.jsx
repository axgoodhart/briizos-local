import { useEffect, useRef } from 'react';
import './styles.css'; // legacy board styles — scoped under .forest-shell, see hardening notes
import logger from '../../lib/logger';
// Legacy markup, injected verbatim so app.js finds the (now forest-prefixed)
// element IDs it expects.
import canvasMarkup from './canvas-markup.html?raw';
// The hardened legacy script, imported as a URL and loaded via a classic
// <script> tag (not bundled as a module) so it runs in global scope, exactly
// like the original Projungle setup.
import legacyScriptUrl from './app.js?url';

/**
 * Forest — the infinite-forest project board (ported from Projungle's
 * Canvas tab). Unlike Projungle's own tab bar (which mounted this exactly
 * once and never unmounted), briizOS.local's panel system can close, reopen,
 * and remount this component. The hardening pass made app.js's boot/teardown
 * idempotent for that reason: every mount injects a fresh <script> (so all
 * top-level state/DOM lookups re-resolve cleanly), and every unmount calls
 * window.__forestDestroy() to remove the listeners/interval that mount
 * registered, before tearing down the markup itself.
 */
export default function Forest() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // The markup must be in the DOM before app.js's top-level
    // getElementById(...) calls run.
    host.innerHTML = canvasMarkup;

    const script = document.createElement('script');
    script.src = legacyScriptUrl;
    script.dataset.briizForest = 'true';
    document.body.appendChild(script);

    const onForestLog = (event) => {
      const { level, message, data } = event.detail || {};
      const fn = logger[level] || logger.info;
      fn('forest', message, data);
    };
    window.addEventListener('forest:log', onForestLog);

    return () => {
      window.removeEventListener('forest:log', onForestLog);
      // Undo app.js's global listeners/interval before the script tag and
      // markup go away, so nothing keeps firing against now-detached nodes.
      try {
        window.__forestDestroy?.();
      } catch (err) {
        logger.warn('forest', 'Forest teardown threw', err?.message);
      }
      delete window.__forestDestroy;
      script.remove();
      host.innerHTML = '';
    };
  }, []);

  return (
    <div className="panel forest-panel">
      <div className="panel-header">
        <span className="panel-header-title">Forest</span>
      </div>
      <div className="panel-content">
        <div className="forest-host" ref={hostRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
