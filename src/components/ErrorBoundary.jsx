import { Component } from 'react';
import log from '../lib/logger';

/* ── Crash guard ──────────────────────────────────────────────────────
   Without this, any uncaught render/effect error ANYWHERE in the tree
   (a bad TipTap transaction, a panel that assumes a prop that isn't
   there, etc.) unmounts the whole React root — the entire window goes
   blank with zero trace of what happened.

   This catches it, logs it through the unified logger (so it shows up
   in the Log Overlay and survives restart in SQLite/Firestore, same as
   every other action), and renders the real error instead of nothing.
   Scoped fix, not a root-cause fix — the actual bug that trips this
   still needs to be found per-case from the logged stack. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      log.error('ui.crash', error?.message || String(error), {
        stack: error?.stack,
        componentStack: info?.componentStack,
      });
    } catch {
      // Never let crash-logging itself throw.
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        data-theme-inline="error-boundary-div-1" style={{ position: 'fixed', inset: 0, zIndex: 999999, padding: 32, overflow: 'auto' }}
      >
        <h2 data-theme-inline="error-boundary-h2-1" style={{ marginTop: 0 }}>Something crashed</h2>
        <p data-theme-inline="error-boundary-p-1">{String(error?.message || error)}</p>
        <pre data-theme-inline="error-boundary-pre-1" style={{ whiteSpace: 'pre-wrap' }}>
          {error?.stack}
        </pre>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Try to recover
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
