import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AIVisibilityModal.css';

// The five stages of every AI process chain, in transport order. Audit event
// types map onto them — this component renders the ai_turn_audit_events
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
    case 'provider_http_error': return 'transmit';
    case 'provider_http_response': return 'endpoint';
    case 'model_response': return 'endpoint';
    case 'model_error': return 'endpoint';
    case 'model_incomplete': return 'endpoint';
    case 'turn_completed': return 'response';
    case 'turn_error': return 'response';
    default: return 'app';
  }
}

const EVENT_TITLES = {
  turn_started: 'Your input entered the AI runtime',
  model_request: 'briizOS packaged the provider request',
  provider_http_request: 'The request left this machine',
  provider_http_response: 'The provider answered over the network',
  provider_http_error: 'The network request to the provider failed',
  model_response: 'The model returned a response',
  model_error: 'The model call failed',
  model_incomplete: 'A model call ended without completing',
  turn_completed: 'The turn finished',
  turn_error: 'The turn failed',
};

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
  const last = events[events.length - 1] || {};
  return {
    model: events.find((event) => event.model)?.model || 'model unresolved',
    provider: events.find((event) => event.provider)?.provider || null,
    kind: first.turnKind || 'turn',
    surface: first.modality || null,
    label: events.find((event) => event.turnLabel)?.turnLabel || null,
    lastOutcome: last.outcome || null,
    errorMessage: [...events].reverse().find((event) => event.error?.message)?.error?.message || null,
  };
}

// Human label for a chain: the surface-supplied intent when present, otherwise
// a readable derivation from the audit metadata — never the raw envelope type.
function chainTitle(chain) {
  if (chain.label) return chain.label;
  const surfaceNames = {
    task: 'Background agent run',
    chat: 'Chat message',
    plan: 'Chat message · plan mode',
    prioritize: 'Prioritize assistant',
    planner: 'Day planner assistant',
    suggestions: 'Suggestion chips',
  };
  if (chain.kind === 'suggestion') return 'Suggestion chips';
  if (chain.kind === 'resume') {
    return `${surfaceNames[chain.surface] || 'AI run'} · resumed after your decision`;
  }
  return surfaceNames[chain.surface] || (chain.surface ? `${chain.kind} · ${chain.surface}` : 'Chat message');
}

function statusText(chain, nowMs) {
  if (chain.status === 'active') return `running · ${formatDuration(Math.max(0, nowMs - chain.startMs))} so far`;
  if (chain.status === 'paused') return `waiting for your decision since ${new Date(chain.endMs).toLocaleTimeString()}`;
  const duration = formatDuration(chain.endMs - chain.startMs);
  if (chain.status === 'failed') {
    return chain.lastOutcome === 'abandoned'
      ? 'never finished · closed after the app exited'
      : `failed · ${duration}`;
  }
  return `done · ${duration}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Per-run node positions. Each chain is its own time axis: 0% is the turn's
 * first event, 100% is its last (or "now" for a still-running turn), so a
 * step that happened later sits further right and gaps show where the time
 * went. Overlapping neighbors are nudged apart just enough to stay clickable,
 * preserving time order.
 */
function positionEvents(chain, scaleMode, nowMs) {
  const events = chain.events;
  const axisEnd = chain.status === 'active' ? Math.max(nowMs, chain.endMs) : chain.endMs;
  const span = Math.max(1, axisEnd - chain.startMs);
  const MIN_GAP = 3.4;
  let positions;
  if (scaleMode === 'stage' || events.length === 1) {
    positions = events.map((event, index) => (
      events.length === 1 ? 0 : (index / (events.length - 1)) * 100
    ));
  } else {
    positions = events.map((event) => ((event.createdAtMs - chain.startMs) / span) * 100);
    for (let index = 1; index < positions.length; index += 1) {
      if (positions[index] < positions[index - 1] + MIN_GAP) {
        positions[index] = positions[index - 1] + MIN_GAP;
      }
    }
    for (let index = positions.length - 1; index >= 0; index -= 1) {
      const cap = 100 - (positions.length - 1 - index) * MIN_GAP;
      if (positions[index] > cap) positions[index] = Math.max(0, cap);
      else break;
    }
  }
  return { positions, span, axisEnd };
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

// Lightweight JSON syntax highlighting. The text is HTML-escaped first, so the
// only markup in the output is the spans this function adds.
function highlightJson(text) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
    (match, str, colon, keyword) => {
      if (str) {
        return colon
          ? `<span class="aiviz-j-key">${str}</span>${colon}`
          : `<span class="aiviz-j-str">${str}</span>`;
      }
      if (keyword) return `<span class="aiviz-j-kw">${keyword}</span>`;
      return `<span class="aiviz-j-num">${match}</span>`;
    },
  );
}

function JsonBlock({ value, cap = 150000 }) {
  const text = prettyJson(value, cap);
  if (!text) return null;
  if (text.length > 60000) return <pre className="aiviz-json">{text}</pre>;
  // eslint-disable-next-line react/no-danger
  return <pre className="aiviz-json" dangerouslySetInnerHTML={{ __html: highlightJson(text) }} />;
}

function InspectorSection({ title, value, open = false }) {
  if (value == null) return null;
  return (
    <details className="aiviz-inspect-section" open={open}>
      <summary>{title}</summary>
      <JsonBlock value={value} />
    </details>
  );
}

// Mirrors electron/agent/audit.js providerErrorGuidance so a stored error can
// be explained even when the live stream (which carries nextAction) is gone.
function errorGuidance(error, provider, model) {
  if (!error) return null;
  const text = JSON.stringify(error).toLowerCase();
  const status = Number(error.status ?? error.statusCode ?? NaN);
  const providerName = provider === 'openai' ? 'OpenAI'
    : provider === 'claude' ? 'Anthropic'
      : provider === 'gemini' ? 'Google Gemini'
        : provider || 'the AI provider';
  const modelName = model || 'the selected model';
  if (error.name === 'TurnAbandoned') {
    return 'briizOS exited before this run finished, so no outcome exists. Re-run the step; the events above show how far it got.';
  }
  if (/insufficient_quota|quota|billing|credit balance|resource_exhausted/.test(text)) {
    return `Check ${providerName} quota/billing, add provider credit if needed, or pick a different configured model before retrying ${modelName}.`;
  }
  if (status === 429 || /rate.?limit|too many requests/.test(text)) {
    return `Wait for the provider limit to reset, then retry; if it repeats, check ${providerName} rate limits or pick a different configured model.`;
  }
  if (status === 401 || /authentication|invalid.?api.?key|unauthorized/.test(text)) {
    return `Check the saved ${providerName} API credential, then retry or pick another configured provider/model.`;
  }
  if (status === 404 || /model.*not found|unknown model/.test(text)) {
    return `Choose a ${providerName} model this account can access, or update the selected model profile before retrying.`;
  }
  return `Review the exact provider error below, verify ${providerName} service/credentials and ${modelName}, then retry.`;
}

// Pull the provider-reported token counts out of the audit tokenUsage envelope.
function tokenSummary(tokenUsage) {
  const reported = tokenUsage?.providerReported;
  if (!Array.isArray(reported) || !reported.length) return null;
  const found = {};
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    for (const [key, child] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
      if (typeof child === 'number') {
        if (normalized === 'inputtokens' || normalized === 'prompttokens') found.input = child;
        else if (normalized === 'outputtokens' || normalized === 'completiontokens') found.output = child;
        else if (normalized === 'totaltokens') found.total = child;
      } else visit(child);
    }
  };
  reported.forEach((entry) => visit(entry.value));
  if (found.input == null && found.output == null && found.total == null) return null;
  const parts = [];
  if (found.input != null) parts.push(`${found.input.toLocaleString()} in`);
  if (found.output != null) parts.push(`${found.output.toLocaleString()} out`);
  if (found.total != null) parts.push(`${found.total.toLocaleString()} total`);
  return parts.join(' · ');
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
  const focusedTurnIdRef = useRef(null);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { focusedTurnIdRef.current = focusedTurnId; }, [focusedTurnId]);

  const api = typeof window !== 'undefined' ? window.api?.localData?.aiAudit : null;

  const refresh = useCallback(async () => {
    if (!api) return;
    try {
      let rows = await api.list({ limit: 400 });
      rows = rows || [];
      // A focused turn (opened from an error banner) may be older than the
      // rolling 400-event window; fetch it explicitly so the link always lands.
      const focused = focusedTurnIdRef.current;
      if (focused && !rows.some((row) => row.turnId === focused)) {
        try {
          const focusedRows = await api.list({ turnId: focused, limit: 400 });
          rows = [...rows, ...(focusedRows || [])];
        } catch {
          // The main list still renders; the focused chain just may be absent.
        }
      }
      setSummaries(rows);
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

  // Other surfaces (error banners, run history) open the timeline
  // focused on the exact turn behind their failure.
  useEffect(() => {
    const onOpenRequest = (event) => {
      const turnId = event?.detail?.turnId || null;
      focusedTurnIdRef.current = turnId;
      setFocusedTurnId(turnId);
      setIsOpen(true);
      refresh();
    };
    window.addEventListener('briizos:ai-visibility:open', onOpenRequest);
    return () => window.removeEventListener('briizos:ai-visibility:open', onOpenRequest);
  }, [refresh]);

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

  // ONE definition of "active", shared by the pill and the panel: a chain is
  // active exactly when its rows say ACTIVE. The startup sweep closes turns
  // orphaned by an app exit, so nothing stays "active" forever by accident.
  const counts = useMemo(() => ({
    active: chains.filter((chain) => chain.status === 'active').length,
    waiting: chains.filter((chain) => chain.status === 'paused').length,
  }), [chains]);

  const visibleChains = focusedTurnId
    ? chains.filter((chain) => chain.turnId === focusedTurnId)
    : chains.slice(0, 30);

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

  const nowMs = Date.now();
  const pillLabel = `${counts.active ? ` § ${counts.active} ` : ''}${counts.waiting ? `   ${counts.waiting} ` : ''}`;
  const selectedChain = selectedDetail
    ? chains.find((chain) => chain.turnId === selectedDetail.turnId)
    : null;

  return (
    <>
      <button
        type="button"
        className={`aiviz-pill${counts.active ? ' aiviz-pill-active' : ''}${!counts.active && counts.waiting ? ' aiviz-pill-waiting' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open the AI visibility timeline"
        title="AI visibility — every AI process chain, live"
      >
        <span className="aiviz-pill-dot" />
        {pillLabel}
      </button>

      {isOpen && (
        <div className="aiviz-overlay" role="dialog" aria-modal="true" aria-label="AI visibility timeline">
          <section className="aiviz-modal">
            <header className="aiviz-header">
              <div>
                <h2>AI visibility</h2>
                <p>Each run is its own timeline from your input to the application’s response — a step’s position shows when it happened within that run, and labeled gaps show where the time went. Click any step for the exact recorded data.</p>
              </div>
              <div className="aiviz-controls">
                <span className="aiviz-count-summary">
                  {counts.active} active · {counts.waiting} waiting for you · {chains.length - counts.active - counts.waiting} finished
                </span>
                <div className="aiviz-toggle" role="group" aria-label="Timeline scale">
                  <button type="button" className={scaleMode === 'time' ? 'on' : ''} onClick={() => setScaleMode('time')} title="Position each step by when it actually happened within its run">Elapsed time</button>
                  <button type="button" className={scaleMode === 'stage' ? 'on' : ''} onClick={() => setScaleMode('stage')} title="Space steps evenly to compare stage order across runs">Even spacing</button>
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
                {visibleChains.map((chain) => {
                  const { positions, axisEnd } = positionEvents(chain, scaleMode, nowMs);
                  const runSpan = Math.max(1, axisEnd - chain.startMs);
                  const lastPosition = positions[positions.length - 1] ?? 0;
                  return (
                    <article key={chain.turnId} className={`aiviz-chain aiviz-status-${chain.status}`}>
                      <button type="button" className="aiviz-chain-title" onClick={() => setFocusedTurnId(focusedTurnId === chain.turnId ? null : chain.turnId)} title="Focus this run">
                        <span className="aiviz-chain-dot" aria-hidden="true" />
                        <strong>{chainTitle(chain)}</strong>
                        <span className="aiviz-chain-sub">{chain.model}{chain.provider ? ` · ${chain.provider}` : ''}</span>
                        <span className="aiviz-chain-sub">{new Date(chain.startMs).toLocaleTimeString()}</span>
                        <em className="aiviz-chain-status">{statusText(chain, nowMs)}</em>
                      </button>
                      {chain.status === 'failed' && chain.errorMessage && (
                        <p className="aiviz-chain-error" title={chain.errorMessage}>{chain.errorMessage}</p>
                      )}
                      <div className="aiviz-track">
                        <div className="aiviz-track-inner">
                          <div className="aiviz-rail" />
                          <div
                            className={`aiviz-rail-progress${chain.status === 'failed' ? ' is-failed' : ''}`}
                            style={{ width: `${chain.status === 'active' && scaleMode === 'time' ? 100 : lastPosition}%` }}
                          />
                          {scaleMode === 'time' && chain.events.map((event, index) => {
                            if (index === 0) return null;
                            const gapMs = event.createdAtMs - chain.events[index - 1].createdAtMs;
                            if (gapMs < Math.max(750, runSpan * 0.14)) return null;
                            const mid = (positions[index - 1] + positions[index]) / 2;
                            return (
                              <span key={`gap-${event.id}`} className="aiviz-gap" style={{ left: `${mid}%` }}>
                                {formatDuration(gapMs)}
                              </span>
                            );
                          })}
                          {chain.events.map((event, index) => {
                            const stage = stageForEvent(event.eventType);
                            const offset = event.createdAtMs - chain.startMs;
                            return (
                              <button
                                key={event.id}
                                type="button"
                                style={{ left: `${positions[index]}%` }}
                                className={`aiviz-node aiviz-stage-${stage}${event.id === selectedEventId ? ' aiviz-node-selected' : ''}${event.eventType === 'turn_error' || event.eventType === 'model_error' || event.eventType === 'provider_http_error' || event.error ? ' aiviz-node-error' : ''}`}
                                onClick={() => inspect(event.id)}
                                title={`${STAGES[STAGE_INDEX[stage]].label} — ${event.eventType} · +${formatDuration(offset)} into the run · ${event.outcome}${event.requestBytes ? ` · req ${formatBytes(event.requestBytes)}` : ''}${event.responseBytes ? ` · res ${formatBytes(event.responseBytes)}` : ''}`}
                                aria-label={`Inspect ${event.eventType} at ${event.timestamp}`}
                              >
                                <StageIcon stage={stage} />
                              </button>
                            );
                          })}
                          {chain.status === 'active' && scaleMode === 'time' && (
                            <span className="aiviz-now" title="This run is still going">
                              <span className="aiviz-now-bar" />
                            </span>
                          )}
                        </div>
                        <div className="aiviz-axis">
                          <span>0s</span>
                          <span>{chain.status === 'active' ? `now · ${formatDuration(nowMs - chain.startMs)}` : formatDuration(chain.endMs - chain.startMs)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
                      <p className="aiviz-inspect-headline">
                        {EVENT_TITLES[selectedDetail.eventType] || selectedDetail.eventType}
                      </p>
                      <dl>
                        <div><dt>Step</dt><dd>{STAGES[STAGE_INDEX[stageForEvent(selectedDetail.eventType)]].label} · <code>{selectedDetail.eventType}</code></dd></div>
                        <div><dt>Outcome</dt><dd>{selectedDetail.outcome}</dd></div>
                        <div><dt>When</dt><dd>{new Date(selectedDetail.timestamp).toLocaleString()}{selectedChain ? ` · +${formatDuration(new Date(selectedDetail.timestamp).getTime() - selectedChain.startMs)} into the run` : ''}</dd></div>
                        <div><dt>Run</dt><dd>{selectedChain ? chainTitle(selectedChain) : selectedDetail.turnLabel || selectedDetail.turnKind}</dd></div>
                        <div><dt>Model</dt><dd>{selectedDetail.model || '—'}{selectedDetail.provider ? ` (${selectedDetail.provider})` : ''}</dd></div>
                        {tokenSummary(selectedDetail.tokenUsage) && <div><dt>Tokens</dt><dd>{tokenSummary(selectedDetail.tokenUsage)}</dd></div>}
                      </dl>
                      {selectedDetail.error && (
                        <div className="aiviz-inspect-error-box" role="alert">
                          <strong>{selectedDetail.error.message || 'The recorded error has no message.'}</strong>
                          {(selectedDetail.error.status || selectedDetail.error.statusCode || selectedDetail.error.code) && (
                            <span>
                              {selectedDetail.error.status || selectedDetail.error.statusCode ? `HTTP ${selectedDetail.error.status || selectedDetail.error.statusCode}` : null}
                              {selectedDetail.error.code ? ` · code ${selectedDetail.error.code}` : null}
                            </span>
                          )}
                          {errorGuidance(selectedDetail.error, selectedDetail.provider, selectedDetail.model) && (
                            <p><em>What to do next:</em> {errorGuidance(selectedDetail.error, selectedDetail.provider, selectedDetail.model)}</p>
                          )}
                        </div>
                      )}
                      <InspectorSection title="Error record" value={selectedDetail.error} open={!!selectedDetail.error} />
                      <InspectorSection title="Request" value={selectedDetail.request} open={!selectedDetail.error} />
                      <InspectorSection title="Response" value={selectedDetail.response} />
                      <InspectorSection title="Token usage" value={selectedDetail.tokenUsage} />
                      <InspectorSection title="Permission policy" value={selectedDetail.permissionPolicy} />
                      <InspectorSection title="Effective configuration" value={selectedDetail.effectiveConfig} />
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
