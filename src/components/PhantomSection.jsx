import { useState, useEffect, useRef, useCallback } from 'react';
import '../AppCombined.css';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

const PHANTOM_DIR = '/Users/alex/Documents/Cufolio/phantom';
const PYTHON = `${PHANTOM_DIR}/.venv/bin/python3`;

async function phantomCmd(...args) {
  const cmd = `${PYTHON} -m phantom ${args.join(' ')}`;
  const result = await api.agentRunCommand(cmd, PHANTOM_DIR);
  if (!result) throw new Error('No response from terminal');
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(result.stderr || result.stdout || 'Unknown error');
  }
}

function PhantomSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('playback');

  // Workflow list
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection and inspection
  const [selected, setSelected] = useState(null);
  const [inspecting, setInspecting] = useState(null);
  const [events, setEvents] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Run status
  const [status, setStatus] = useState(null);

  // Run options
  const [speed, setSpeed] = useState(1.0);
  const [loop, setLoop] = useState(1);
  const [loopDelay, setLoopDelay] = useState(0);

  const [error, setError] = useState('');

  const pollRef = useRef(null);
  const isRunning = status && ['running', 'waiting'].includes(status.status || status.state);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await phantomCmd('list');
      if (data.status === 'ok') {
        setWorkflows(data.workflows || []);
      } else {
        setError(data.message || 'Failed to list workflows');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const data = await phantomCmd('status');
      setStatus(data);
      if (!['running', 'waiting'].includes(data.status || data.state)) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { /* ignore poll errors */ }
  }, []);

  const startPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(pollStatus, 1500);
  }, [pollStatus]);

  useEffect(() => {
    if (isOpen) {
      loadWorkflows();
      pollStatus();
    }
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRunning && !pollRef.current) startPolling();
  }, [isRunning, startPolling]);

  const handleInspect = useCallback(async (wf) => {
    // Toggle off if already inspecting this workflow
    if (inspecting?.filename === wf.filename) {
      setInspecting(null);
      setEvents(null);
      return;
    }
    setInspecting(wf);
    setEvents(null);
    setInspectLoading(true);
    try {
      const data = await phantomCmd('inspect', `"${wf.name}"`);
      if (data.status === 'ok') {
        setEvents(data.events);
      } else {
        setError(data.message || 'Failed to inspect workflow');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setInspectLoading(false);
    }
  }, [inspecting]);

  const handleRun = useCallback(async (wf) => {
    const target = wf || selected;
    if (!target) return;
    setError('');
    try {
      const data = await phantomCmd(
        'run', `"${target.name}"`,
        '--speed', speed,
        '--loop', loop,
        '--loop-delay', loopDelay,
      );
      if (data.status === 'started') {
        setStatus({ status: 'running', workflow: data.workflow, loop, progress_pct: 0 });
        startPolling();
      } else {
        setError(data.message || 'Failed to start workflow');
      }
    } catch (e) {
      setError(e.message);
    }
  }, [selected, speed, loop, loopDelay, startPolling]);

  const handleStop = useCallback(async () => {
    try {
      await phantomCmd('stop');
      clearInterval(pollRef.current);
      pollRef.current = null;
      setStatus({ status: 'idle' });
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleLaunch = useCallback(async () => {
    try {
      await phantomCmd('record');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleDelete = useCallback(async (wf) => {
    if (!window.confirm(`Delete "${wf.name}"?`)) return;
    try {
      await phantomCmd('delete', `"${wf.name}"`);
      setWorkflows(prev => prev.filter(w => w.filename !== wf.filename));
      if (selected?.filename === wf.filename) setSelected(null);
      if (inspecting?.filename === wf.filename) { setInspecting(null); setEvents(null); }
    } catch (e) {
      setError(e.message);
    }
  }, [selected, inspecting]);

  const statusText = () => {
    if (!status) return null;
    const state = status.status || status.state || 'unknown';
    const pct = status.progress_pct ?? 0;
    if (state === 'idle') return null;
    if (state === 'running') return `${status.workflow} — ${pct}%`;
    if (state === 'waiting') return `${status.workflow} — waiting...`;
    if (state === 'completed') return `Done: ${status.workflow}`;
    if (state === 'stopped') return 'Stopped';
    if (state === 'error') return `Error: ${status.message || status.workflow}`;
    return state;
  };

  const statusClass = () => {
    if (!status) return '';
    return status.status || status.state || '';
  };

  return (
    <div className="phantom-section">

      {/* Toggle button (replaces old Record button) */}
      <button
        className={`phantom-toggle${isOpen ? ' open' : ''}${isRunning ? ' running' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className="phantom-toggle-dot" />
        <span className="phantom-toggle-label">Phantom</span>
        {isRunning && <span className="phantom-toggle-status">{statusText()}</span>}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="phantom-drawer">

          {/* Mode tabs */}
          <div className="phantom-tabs">
            <button
              className={`phantom-tab${tab === 'playback' ? ' active' : ''}`}
              onClick={() => setTab('playback')}
            >
              Playback
            </button>
            <button
              className={`phantom-tab${tab === 'record' ? ' active' : ''}`}
              onClick={() => setTab('record')}
            >
              Record
            </button>
          </div>

          {/* ── Playback tab ── */}
          {tab === 'playback' && (
            <div className="phantom-playback">

              {/* Status bar — only when not idle */}
              {status && statusClass() !== 'idle' && (
                <div className={`phantom-status ${statusClass()}`}>
                  <span className="phantom-status-dot" />
                  <span className="phantom-status-text">{statusText()}</span>
                  {isRunning && status.progress_pct != null && (
                    <div className="phantom-progress">
                      <div
                        className="phantom-progress-fill"
                        style={{ width: `${status.progress_pct}%` }}
                      />
                    </div>
                  )}
                  {status.elapsed != null && (
                    <span className="phantom-elapsed">{Math.round(status.elapsed)}s</span>
                  )}
                </div>
              )}

              {/* Workflow list header */}
              <div className="phantom-wf-header">
                <span>Workflows</span>
                <button
                  className="phantom-refresh"
                  onClick={loadWorkflows}
                  disabled={loading}
                >
                  {loading ? '…' : '↻'}
                </button>
              </div>

              {/* Workflow rows */}
              <div className="phantom-wf-list">
                {loading && workflows.length === 0 && (
                  <div className="phantom-empty">Loading…</div>
                )}
                {!loading && workflows.length === 0 && (
                  <div className="phantom-empty">No workflows. Use Record tab to create one.</div>
                )}
                {workflows.map(wf => (
                  <div key={wf.filename}>
                    <div
                      className={`phantom-wf-row${selected?.filename === wf.filename ? ' selected' : ''}`}
                      onClick={() => setSelected(wf)}
                    >
                      <div className="phantom-wf-info">
                        <span className="phantom-wf-name">{wf.name}</span>
                        <span className="phantom-wf-meta">
                          {wf.actions} actions · {wf.duration.toFixed(1)}s · {wf.resolution}
                        </span>
                      </div>
                      <button
                        className="phantom-wf-inspect"
                        title="Inspect events"
                        onClick={e => { e.stopPropagation(); handleInspect(wf); }}
                      >
                        {inspecting?.filename === wf.filename ? '▲' : '▼'}
                      </button>
                      <button
                        className="phantom-wf-run"
                        title="Run workflow"
                        disabled={isRunning}
                        onClick={e => { e.stopPropagation(); handleRun(wf); }}
                      >
                        ▶
                      </button>
                      <button
                        className="phantom-wf-del"
                        title="Delete workflow"
                        disabled={isRunning}
                        onClick={e => { e.stopPropagation(); handleDelete(wf); }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Event inspector — expands below the row */}
                    {inspecting?.filename === wf.filename && (
                      <div className="phantom-events">
                        {inspectLoading && (
                          <div className="phantom-empty">Loading events…</div>
                        )}
                        {!inspectLoading && events && events.map((ev, i) => (
                          <div key={i} className="phantom-event-row">{ev}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Run options */}
              <div className="phantom-run-opts">
                <label>
                  Speed
                  <input
                    type="number" min="0.1" max="10" step="0.5"
                    value={speed}
                    onChange={e => setSpeed(parseFloat(e.target.value) || 1)}
                  />
                  ×
                </label>
                <label>
                  Loop
                  <input
                    type="number" min="0" step="1"
                    value={loop}
                    onChange={e => setLoop(parseInt(e.target.value) || 1)}
                    title="0 = infinite"
                  />
                  ×
                </label>
                <label>
                  Delay
                  <input
                    type="number" min="0" step="1"
                    value={loopDelay}
                    onChange={e => setLoopDelay(parseFloat(e.target.value) || 0)}
                  />
                  s
                </label>
              </div>

              {/* Run / Stop */}
              <div className="phantom-actions">
                <button
                  className="phantom-btn primary"
                  disabled={!selected || isRunning}
                  onClick={() => handleRun()}
                >
                  ▶ Run {selected ? `"${selected.name}"` : 'selected'}
                </button>
                <button
                  className="phantom-btn danger"
                  disabled={!isRunning}
                  onClick={handleStop}
                >
                  ■ Stop
                </button>
              </div>
            </div>
          )}

          {/* ── Record tab ── */}
          {tab === 'record' && (
            <div className="phantom-record">
              <p className="phantom-record-desc">
                Launch Phantom to record a new workflow.
                The app handles accessibility permissions and captures your input.
              </p>
              <button className="phantom-btn record-launch" onClick={handleLaunch}>
                ◉ Launch Phantom
              </button>
              {workflows.length > 0 && (
                <p className="phantom-record-hint">
                  {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} saved
                </p>
              )}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="phantom-error">
              <span>{error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default PhantomSection;
