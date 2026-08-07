import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AIVisibilityModal.css';

// The five stages of every AI process chain, in transport order. Audit event
// types map onto them 1:1 — this component renders the ai_turn_audit_events
// trail the agent runtime already records for every turn.
const STAGES = [
  { key: 'user', label: 'User input' },
  { key: 'app', label: 'Application packaging' },
  { key: 'transmit', label: 'Transmission' },
  { key: 'endpoint', label: 'Endpoint response' },
  { key: 'response', label: 'Application response' },
];
const STAGE_INDEX = Object.fromEntries(STAGES.map((stage, index) => [stage.key, index]));

function stageForEvent(eventType) {
  switch (eventType) {
    case 'turn_started': return 'user';
    case 'model_request': return 'app';
    case 'provider_http_request': return 'transmit';
    case 'provider_http_response': return 'endpoint';
    case 'model_response': return 'endpoint';
    case 'turn_completed': return 'response';
    case 'turn_error': return 'response';
    default: return 'app';
  }
}

function StageIcon({ stage }) {
  const shared = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
  if (stage === 'user') {
    return <svg {...shared}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>;
  }
  if (stage === 'app') {
    return <svg {...shared}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v10" /></svg>;
  }
  if (stage === 'transmit') {
    return <svg {...shared}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
  }
  if (stage === 'endpoint') {
    return <svg {...shared}><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /></svg>;
  }
  return <svg {...shared}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="3.5" /></svg>;
}

function chainStatus(events) {
  const last = events[events.length - 1];
  if (!last) return 'active';
  if (last.eventType === 'turn_error') return 'failed';
  if (last.eventType === 'turn_completed') {
    if (last.outcome === 'interrupted') return 'paused';
    return last.outcome === 'succeeded' ? 'completed' : 'failed';
  }
  return 'active';
}

function describeChain(events) {
  const first = events[0] || {};
  return {
    model: events.find((event) => event.model)?.model || 'model unresolved',
    provider: events.find((event) => event.provider)?.provider || null,
    kind: first.turnKind || 'turn',
    surface: first.modality || null,
  };
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function prettyJson(value, cap = 150000) {
  if (value == null) return null;
  let text;
  try { text = JSON.stringify(value, null, 2); } catch { text = String(value); }
  if (text.length > cap) {
    return `${text.slice(0, cap)}\n\n… truncated for display (${(text.length - cap).toLocaleString()} more characters). The complete record is stored locally in ai_turn_audit_events.`;
  }
  return text;
}

function InspectorSection({ title, text }) {
  if (!text) return null;
  return (
    <details className="aiviz-inspect-section" open={title === 'Request'}>
      <summary>{title}</summary>
      <pre>{text}</pre>
    </details>
  );
}

export default function AIVisibilityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [scaleMode, setScaleMode] = useState('time');
  const [focusedTurnId, setFocusedTurnId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [inspectError, setInspectError] = useState(null);
  const isOpenRef = useRef(false);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const api = typeof window !== 'undefined' ? window.api?.localData?.aiAudit : null;

  const refresh = useCallback(async () => {
    if (!api) return;
    try {
      const rows = await api.list({ limit: 400 });
      setSummaries(rows || []);
    } catch {
      // The timeline is an observability surface; a failed poll must never throw.
    }
  }, [api]);

  useEffect(() => {
    if (!api) return undefined;
    refresh();
    const timer = window.setInterval(() => {
      // Poll faster while the timeline is being watched.
      if (isOpenRef.current || document.visibilityState === 'visible') refresh();
    }, isOpen ? 2000 : 5000);
    return () => window.clearInterval(timer);
  }, [api, isOpen, refresh]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const chains = useMemo(() => {
    const byTurn = new Map();
    for (const event of summaries) {
      const list = byTurn.get(event.turnId) || [];
      list.push(event);
      byTurn.set(event.turnId, list);
    }
    const built = [...byTurn.entries()].map(([turnId, events]) => {
      const ordered = events.slice().sort((a, b) => a.sequence - b.sequence);
      const startMs = ordered[0]?.createdAtMs || 0;
      const endMs = ordered[ordered.length - 1]?.createdAtMs || startMs;
      const status = chainStatus(ordered);
      return {
        turnId,
        events: ordered,
        startMs,
        endMs,
        durationMs: status === 'active' ? null : endMs - startMs,
        status,
        ...describeChain(ordered),
      };
    });
    return built.sort((a, b) => b.startMs - a.startMs);
  }, [summaries]);

  const activeCount = useMemo(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    return chains.filter((chain) => (chain.status === 'active' || chain.status === 'paused') && chain.startMs >= cutoff).length;
  }, [chains]);

  const visibleChains = focusedTurnId
    ? chains.filter((chain) => chain.turnId === focusedTurnId)
    : chains.slice(0, 30);

  const window_ = useMemo(() => {
    if (!visibleChains.length) return { start: 0, end: 1 };
    const start = Math.min(...visibleChains.map((chain) => chain.startMs));
    const end = Math.max(...visibleChains.map((chain) => chain.endMs), start + 1);
    return { start, end };
  }, [visibleChains]);

  const inspect = useCallback(async (eventId) => {
    setSelectedEventId(eventId);
    setSelectedDetail(null);
    setInspectError(null);
    try {
      setSelectedDetail(await api.get(eventId));
    } catch (error) {
      setInspectError(error?.message || 'This event record could not be read.');
    }
  }, [api]);

  const closeInspector = () => { setSelectedEventId(null); setSelectedDetail(null); setInspectError(null); };

  if (!api) return null;

  return (
    <>
      <button
        type="button"
        className={`aiviz-pill${activeCount ? ' aiviz-pill-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open the AI visibility timeline"
        title="AI visibility — every AI process chain, live"
      >
        <span className="aiviz-pill-dot" />
        AI{activeCount ? ` · ${activeCount} active` : ''}
      </button>

      {isOpen && (
        <div className="aiviz-overlay" role="dialog" aria-modal="true" aria-label="AI visibility timeline">
          <section className="aiviz-modal">
            <header className="aiviz-header">
              <div>
                <h2>AI visibility</h2>
                <p>Every AI process chain, from your input to the application’s response. Recorded locally; click any step to see the exact data behind it.</p>
              </div>
              <div className="aiviz-controls">
                <div className="aiviz-toggle" role="group" aria-label="Timeline scale">
                  <button type="button" className={scaleMode === 'time' ? 'on' : ''} onClick={() => setScaleMode('time')}>Time scale</button>
                  <button type="button" className={scaleMode === 'stage' ? 'on' : ''} onClick={() => setScaleMode('stage')}>Normalize stages</button>
                </div>
                {focusedTurnId && <button type="button" className="aiviz-unfocus" onClick={() => setFocusedTurnId(null)}>Show all chains</button>}
                <button type="button" className="aiviz-close" onClick={() => setIsOpen(false)} aria-label="Close">×</button>
              </div>
            </header>

            <div className="aiviz-legend">
              {STAGES.map((stage) => (
                <span key={stage.key}><i className={`aiviz-node aiviz-stage-${stage.key}`}><StageIcon stage={stage.key} /></i>{stage.label}</span>
              ))}
            </div>

            <div className="aiviz-body">
              <div className="aiviz-chains">
                {!visibleChains.length && <p className="aiviz-empty">No AI activity has been recorded yet. Run anything that uses AI and its chain will appear here.</p>}
                {visibleChains.map((chain) => (
                  <article key={chain.turnId} className={`aiviz-chain aiviz-status-${chain.status}`}>
                    <button type="button" className="aiviz-chain-title" onClick={() => setFocusedTurnId(focusedTurnId === chain.turnId ? null : chain.turnId)}>
                      <strong>{chain.kind}{chain.surface ? ` · ${chain.surface}` : ''}</strong>
                      <span>{chain.model}{chain.provider ? ` (${chain.provider})` : ''}</span>
                      <span>{new Date(chain.startMs).toLocaleTimeString()}</span>
                      <em className="aiviz-chain-status">{chain.status}{chain.durationMs != null ? ` · ${formatDuration(chain.durationMs)}` : ''}</em>
                    </button>
                    <div className="aiviz-track">
                      <div className="aiviz-rail" />
                      {chain.events.map((event, index) => {
                        const stage = stageForEvent(event.eventType);
                        const left = scaleMode === 'time'
                          ? `${Math.min(97.5, ((event.createdAtMs - window_.start) / Math.max(1, window_.end - window_.start)) * 97.5)}%`
                          : `${(index / Math.max(1, chain.events.length - 1)) * 97.5}%`;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            style={{ left }}
                            className={`aiviz-node aiviz-stage-${stage}${event.id === selectedEventId ? ' aiviz-node-selected' : ''}${event.eventType === 'turn_error' || event.error ? ' aiviz-node-error' : ''}`}
                            onClick={() => inspect(event.id)}
                            title={`${event.eventType} · ${STAGES[STAGE_INDEX[stage]].label} · ${event.outcome}${event.requestBytes ? ` · req ${formatBytes(event.requestBytes)}` : ''}${event.responseBytes ? ` · res ${formatBytes(event.responseBytes)}` : ''}`}
                            aria-label={`Inspect ${event.eventType} at ${event.timestamp}`}
                          >
                            <StageIcon stage={stage} />
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>

              {selectedEventId && (
                <aside className="aiviz-inspector" aria-label="Action inspector">
                  <header>
                    <h3>Action inspector</h3>
                    <button type="button" onClick={closeInspector} aria-label="Close inspector">×</button>
                  </header>
                  {!selectedDetail && !inspectError && <p className="aiviz-empty">Loading the full event record…</p>}
                  {inspectError && <p className="aiviz-inspect-error">{inspectError}</p>}
                  {selectedDetail && (
                    <div className="aiviz-inspect-content">
                      <dl>
                        <div><dt>Event</dt><dd>{selectedDetail.eventType}</dd></div>
                        <div><dt>Outcome</dt><dd>{selectedDetail.outcome}</dd></div>
                        <div><dt>Model</dt><dd>{selectedDetail.model || '—'}</dd></div>
                        <div><dt>When</dt><dd>{new Date(selectedDetail.timestamp).toLocaleString()}</dd></div>
                        {selectedDetail.tokenUsage && <div><dt>Tokens</dt><dd>{prettyJson(selectedDetail.tokenUsage, 400)}</dd></div>}
                      </dl>
                      <InspectorSection title="Request" text={prettyJson(selectedDetail.request)} />
                      <InspectorSection title="Response" text={prettyJson(selectedDetail.response)} />
                      <InspectorSection title="Error" text={prettyJson(selectedDetail.error)} />
                      <InspectorSection title="Permission policy" text={prettyJson(selectedDetail.permissionPolicy)} />
                      <InspectorSection title="Effective configuration" text={prettyJson(selectedDetail.effectiveConfig)} />
                    </div>
                  )}
                </aside>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
