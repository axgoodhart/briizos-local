/**
 * briizy capture settings — one component, two homes.
 *
 * Rendered in the Dashboard's "briizy" tab (the findable home) and inside the
 * Notefalls session drawer (where it historically lived). Extracted from
 * NotefallsPanel.jsx on 2026-07-27 after the settings proved undiscoverable
 * buried in the drawer alone.
 *
 * `capture` is the object returned by useBriizyCapture(). `onClose` is
 * optional: the Notefalls drawer passes it, the Dashboard tab does not.
 */

import { useCallback, useEffect, useState } from 'react';
import { briizyApi, describeCaptureState, formatBytes } from '../notefalls/briizyApi.js';
import { relativeTime } from '../notefalls/dates.js';
import logger from '../../lib/logger';
import '../notefalls/notefalls.css';

/* ── Assistant settings + "what briizy learned" ─────────────────────── */

const ASSISTANT_LABELS = {
  insight: 'Insights',
  taskExtraction: 'Commitments',
  memoryExtraction: 'Memory',
  goals: 'Goals',
  focus: 'Focus',
  taskAgent: 'Task agent',
};

const ASSISTANT_BLURBS = {
  insight: 'Occasionally points out a blocker or contradiction it can see on screen.',
  taskExtraction: 'Spots things you have committed to and stages them for review.',
  memoryExtraction: 'Remembers durable facts about you, so chat knows what the desktop saw.',
  goals: 'Checks recent work against your active goals.',
  focus: 'Notices when you have drifted off the goal you set.',
  taskAgent: 'Turns an accepted suggestion into a plan with steps.',
};

export function AssistantSettings({ capture }) {
  const { config, defaults, busy, updateAssistant, updateConfig } = capture;
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  if (!config) return null;

  const defaultPrompt = (id) => defaults?.assistantPrompts?.[id] || '';
  const shipped = new Set(['insight', 'taskExtraction', 'memoryExtraction']);

  return (
    <div className="nf-capture__assistants">
      <span className="nf-drawer__label">what briizy does with what it sees</span>

      <label className="nf-capture__consent">
        <input
          type="checkbox"
          checked={config.cloudTextAnalysisAllowed}
          disabled={busy}
          onChange={(e) => updateConfig({ cloudTextAnalysisAllowed: e.currentTarget.checked })}
        />
        <span>
          Let briizy send recognized <strong>text</strong> to your configured model to analyse.
          Images never leave your Mac. With this off, capture and search still work and the
          assistants below stay idle.
        </span>
      </label>

      {Object.entries(config.assistants).map(([id, assistant]) => (
        <div className={'nf-capture__assistant' + (shipped.has(id) ? '' : ' is-soon')} key={id}>
          <div className="nf-capture__assistant-head">
            <label className="nf-capture__assistant-toggle">
              <input
                type="checkbox"
                checked={assistant.enabled}
                disabled={busy || !shipped.has(id) || !config.cloudTextAnalysisAllowed}
                onChange={(e) => updateAssistant(id, { enabled: e.currentTarget.checked })}
              />
              <span className="nf-capture__assistant-name">{ASSISTANT_LABELS[id] || id}</span>
            </label>
            {!shipped.has(id) && <span className="nf-capture__soon">built, not yet verified</span>}
            {shipped.has(id) && (
              <>
                <select
                  value={assistant.intervalMs}
                  disabled={busy || !assistant.enabled}
                  onChange={(e) => updateAssistant(id, { intervalMs: Number(e.currentTarget.value) })}
                >
                  <option value={5 * 60000}>at most every 5 min</option>
                  <option value={10 * 60000}>at most every 10 min</option>
                  <option value={15 * 60000}>at most every 15 min</option>
                  <option value={30 * 60000}>at most every 30 min</option>
                  <option value={60 * 60000}>at most hourly</option>
                </select>
                <button
                  type="button"
                  className="nf-capture__btn"
                  onClick={() => {
                    setEditing((current) => (current === id ? null : id));
                    setDraft(assistant.prompt || defaultPrompt(id));
                  }}
                >
                  {editing === id ? 'close' : 'prompt'}
                </button>
              </>
            )}
          </div>
          <p className="nf-capture__hint">{ASSISTANT_BLURBS[id]}</p>

          {editing === id && (
            <div className="nf-capture__prompt">
              <textarea
                value={draft}
                rows={10}
                onInput={(e) => setDraft(e.currentTarget.value)}
                spellCheck={false}
              />
              <div className="nf-capture__actions">
                <button
                  type="button"
                  className="nf-capture__btn is-accept"
                  disabled={busy}
                  onClick={async () => {
                    await updateAssistant(id, { prompt: draft });
                    setEditing(null);
                  }}
                >
                  save prompt
                </button>
                <button
                  type="button"
                  className="nf-capture__btn"
                  disabled={busy}
                  onClick={() => setDraft(defaultPrompt(id))}
                >
                  reset to default
                </button>
                {assistant.prompt && (
                  <button
                    type="button"
                    className="nf-capture__btn"
                    disabled={busy}
                    onClick={async () => {
                      await updateAssistant(id, { prompt: null });
                      setEditing(null);
                    }}
                  >
                    use the default
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Goals (§11) ─────────────────────────────────────────────────────
   Small on purpose. Goals only matter because the goals and focus assistants
   read them; there is no goal-tracking product hiding in here. */

export function GoalSettings() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    briizyApi.listGoals({ status: 'active' }).then((rows) => setGoals(rows || []));
  }, []);
  useEffect(load, [load]);

  const add = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await briizyApi.createGoal({ title: trimmed });
      logger.info('briizy', 'Goal created', { title: trimmed });
      setTitle('');
      load();
    } finally {
      setBusy(false);
    }
  };

  const finish = async (goal, status) => {
    await briizyApi.updateGoal(goal.id, { status });
    logger.info('briizy', `Goal marked ${status}`, { goalId: goal.id });
    load();
  };

  return (
    <div className="nf-capture__goals">
      <span className="nf-drawer__label">goals</span>
      <p className="nf-capture__hint">
        What you are trying to get done. briizy checks recent work against these and tints
        the screen edge when you have drifted. With no goals set, both stay quiet.
      </p>
      {goals.map((goal) => (
        <div className="nf-capture__goal" key={goal.id}>
          <span className="nf-capture__goal-title">{goal.title}</span>
          {goal.lastEvaluatedAt && (
            <span className="nf-capture__goal-meta">
              last checked {relativeTime(goal.lastEvaluatedAt)}
            </span>
          )}
          <button type="button" className="nf-capture__btn" onClick={() => finish(goal, 'achieved')}>
            done
          </button>
          <button type="button" className="nf-capture__btn" onClick={() => finish(goal, 'abandoned')}>
            drop
          </button>
        </div>
      ))}
      <div className="nf-capture__goal-add">
        <input
          type="text"
          placeholder="e.g. ship the briizy capture pipeline"
          value={title}
          onInput={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button type="button" className="nf-capture__btn is-accept" disabled={busy || !title.trim()} onClick={add}>
          add goal
        </button>
      </div>
    </div>
  );
}

/** I7 made visible: what briizy wrote, where it came from, and how to undo it. */
export function LearningLog() {
  const [log, setLog] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    briizyApi.getLearningLog({ limit: 50 }).then(setLog);
  }, [open]);

  const forget = async (factId) => {
    await briizyApi.forgetFact(factId);
    logger.info('briizy', 'Fact forgotten', { factId });
    setLog(await briizyApi.getLearningLog({ limit: 50 }));
  };

  return (
    <div className="nf-capture__learning">
      <button type="button" className="nf-capture__btn" onClick={() => setOpen((v) => !v)}>
        {open ? 'hide what briizy learned' : 'what briizy learned'}
      </button>
      {open && (
        <div className="nf-capture__learning-body">
          {!log && <p className="nf-capture__hint">loading…</p>}
          {log && !log.facts.length && (
            <p className="nf-capture__hint">Nothing learned from your screen yet.</p>
          )}
          {log?.facts.map((fact) => (
            <div className="nf-capture__fact" key={fact.id}>
              <span className="nf-capture__fact-text">{fact.factText}</span>
              <span className="nf-capture__fact-meta">
                {new Date(fact.createdAt).toLocaleString('en-GB')}
                {fact.confidence != null ? ` · confidence ${Math.round(fact.confidence * 100)}%` : ''}
              </span>
              <button type="button" className="nf-capture__btn is-danger" onClick={() => forget(fact.id)}>
                forget
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── The capture settings sheet ─────────────────────────────────────── */

export default function CaptureSettingsPanel({ capture, onClose }) {
  const { status, config, defaults, busy, togglePause, updateConfig, clearHistory } = capture;
  const storage = status.storage;
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="nf-capture">
      <div className="nf-capture__head">
        <span className="nf-drawer__label">screen sharing &amp; auto-capture</span>
        {onClose && (
          <button type="button" className="nf-capture__close" onClick={onClose} aria-label="Close">×</button>
        )}
      </div>

      <div className="nf-capture__row">
        <span className={'nf-capture__dot is-' + (status.state || 'unknown')} />
        <span className="nf-capture__state">{describeCaptureState(status)}</span>
        {status.current?.appName && (
          <span className="nf-capture__current">{status.current.appName}</span>
        )}
      </div>

      {status.state === 'permissionRequired' && (
        <p className="nf-capture__hint">
          macOS has not granted Screen Recording to briizOS yet. Open System Settings → Privacy &amp;
          Security → Screen Recording, enable briizOS, then quit and reopen the app.
        </p>
      )}
      {status.state === 'unavailable' && (
        <p className="nf-capture__hint">
          The capture helper is not built. Run <code>npm run helper:build</code> and restart.
          {status.helper?.lastError ? ` (${status.helper.lastError})` : ''}
        </p>
      )}

      <div className="nf-capture__actions">
        <button type="button" className="nf-capture__btn" onClick={togglePause} disabled={busy || !status.enabled}>
          {status.paused ? 'Resume capture' : 'Pause capture'}
        </button>
      </div>

      {storage && (
        <div className="nf-capture__storage">
          <div className="nf-capture__bar">
            <span className="nf-capture__fill" style={{ width: `${Math.min(100, storage.percentOfCap)}%` }} />
          </div>
          <span className="nf-capture__usage">
            {formatBytes(storage.bytes)} of {formatBytes(storage.retentionBytes)} · {storage.frames.toLocaleString()} frames
            · {storage.sessions} session{storage.sessions === 1 ? '' : 's'}
            {storage.pendingOcr ? ` · ${storage.pendingOcr} awaiting OCR` : ''}
          </span>
        </div>
      )}

      {config && (
        <div className="nf-capture__fields">
          <label className="nf-capture__field">
            <span>capture every</span>
            <select
              value={config.captureIntervalMs}
              onChange={(e) => updateConfig({ captureIntervalMs: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={1000}>1 second</option>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={15000}>15 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>keep for</span>
            <select
              value={config.retentionDays}
              onChange={(e) => updateConfig({ retentionDays: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>disk cap</span>
            <select
              value={config.retentionBytes}
              onChange={(e) => updateConfig({ retentionBytes: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={2 * 1024 ** 3}>2 GB</option>
              <option value={5 * 1024 ** 3}>5 GB</option>
              <option value={10 * 1024 ** 3}>10 GB</option>
              <option value={25 * 1024 ** 3}>25 GB</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>text recognition</span>
            <select
              value={config.ocrMode}
              onChange={(e) => updateConfig({ ocrMode: e.currentTarget.value })}
              disabled={busy}
            >
              <option value="fast">fast</option>
              <option value="accurate">accurate</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>on battery</span>
            <select
              value={config.batteryBehavior}
              onChange={(e) => updateConfig({ batteryBehavior: e.currentTarget.value })}
              disabled={busy}
            >
              <option value="deferOcr">defer text recognition</option>
              <option value="pauseCapture">pause capture</option>
              <option value="ignore">carry on</option>
            </select>
          </label>
        </div>
      )}

      {config && (
        <div className="nf-capture__exclusions">
          <span className="nf-drawer__label">never captured</span>
          <label className="nf-capture__consent">
            <input
              type="checkbox"
              checked={config.captureOwnWindow !== false}
              disabled={busy}
              onChange={(e) => updateConfig({ captureOwnWindow: e.currentTarget.checked })}
            />
            <span>
              Record briizOS itself. On, briizOS&apos;s own windows — chat, notes, this settings
              page — enter screen history like any other app. Off, briizy never photographs its
              own app, which makes it look idle whenever briizOS is in front.
            </span>
          </label>
          <p className="nf-capture__hint">
            {config.excludedBundleIds.length} app{config.excludedBundleIds.length === 1 ? '' : 's'} and{' '}
            {config.excludedTitlePatterns.length} window-title pattern
            {config.excludedTitlePatterns.length === 1 ? '' : 's'} are excluded before anything is written to
            disk — password managers, the lock screen, and private-browsing windows by default.
          </p>
          {defaults && (
            <details className="nf-capture__details">
              <summary>show the list</summary>
              <ul>
                {config.excludedBundleIds.map((id) => <li key={id}><code>{id}</code></li>)}
                {config.excludedTitlePatterns.map((pattern) => <li key={pattern}><code>{pattern}</code></li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <AssistantSettings capture={capture} />
      <GoalSettings />
      <LearningLog />

      <div className="nf-capture__danger">
        {confirmingClear ? (
          <>
            <span className="nf-capture__hint">Delete every captured frame and session? This cannot be undone.</span>
            <button
              type="button"
              className="nf-capture__btn is-danger"
              onClick={async () => {
                await clearHistory({ all: true });
                setConfirmingClear(false);
              }}
              disabled={busy}
            >
              Yes, delete everything
            </button>
            <button type="button" className="nf-capture__btn" onClick={() => setConfirmingClear(false)}>Cancel</button>
          </>
        ) : (
          <button type="button" className="nf-capture__btn is-danger" onClick={() => setConfirmingClear(true)}>
            Clear all screen history
          </button>
        )}
      </div>
    </div>
  );
}
