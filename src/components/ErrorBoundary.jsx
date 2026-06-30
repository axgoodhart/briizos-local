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
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          padding: 32,
          fontFamily: "'Roboto Mono', monospace",
          color: '#e0e0e0',
          background: '#0a0a0a',
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: '#ef4444', marginTop: 0 }}>Something crashed</h2>
        <p style={{ fontSize: 14 }}>{String(error?.message || error)}</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
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
