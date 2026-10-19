import { useEffect, useMemo, useState } from 'react';
import {
  answerAgent, launchApperture, pauseAgent, pickIslandFolder, resumeAgent, setAgentFace, startAgent, updateCardData, useApperture,
} from '../store';
import { GLYPH } from '../catalog';
import { dedupe, whenShort } from '../util';

// ==== AGENT CARD ====
const FACES = [['agent', 'Agent'], ['apperture', 'Apperture']];
const COMMAND_LABEL = {
  goal: 'Goal', answer: 'Answered', pause: 'Paused', resume: 'Resumed', generate: 'Generated',
  refine: 'Refined', approve: 'Approved', implement: 'Implement', task: 'Task',
};
const SOURCE_LABEL = { briizos: 'briizOS', apperture: 'Apperture' };
const BOARD_STATUSES = [
  ['backlog', 'Backlog'], ['queue', 'Queued'], ['in_progress', 'In progress'], ['ai_review', 'AI review'],
  ['human_review', 'Review'], ['done', 'Done'], ['pr_created', 'PR'], ['error', 'Error'],
];
const STATUS_LABEL = Object.fromEntries(BOARD_STATUSES);
const ARTIFACT_LABEL = { code: 'Code', web: 'Web', mockup: 'Mockup', scene: 'Scene', sprites: 'Sprites' };
const LATEST_TASKS = 5;
const LATEST_ARTIFACTS = 6;
const LAUNCH_COOLDOWN_MS = 4000;          // keeps a double press from starting two Appertures
const MISSING_FETCH_DELAY_MS = 1500;      // lets the Tasks list land first

// One word for where the run is; the steps below carry the detail.
function phaseOf(task) {
  if (!task) return 'starting';
  if (task.status === 'completed') return 'done';
  if (task.status === 'waiting') return 'needs you';
  if (['cancelled', 'blocked'].includes(task.status)) return 'stopped';
  if (!task.automated) return 'paused';
  return (task.subtasks || []).length ? 'working' : 'planning';
}

const byNewest = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0);
const homeShort = (p) => p.replace(/^\/Users\/[^/]+/, '~');

export function AgentFaceToggle({ island, card }) {
  const face = card.data.face === 'apperture' ? 'apperture' : 'agent';
  return (
    <div className="fo-seg fo-agent__faces" role="group" aria-label="Card face">
      {FACES.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={face === id} onClick={() => setAgentFace(island.id, card.id, id)}>{label}</button>
      ))}
    </div>
  );
}

function GoalForm({ island, card }) {
  const [goal, setGoal] = useState(card.data.goal && !card.data.taskId ? card.data.goal : '');
  return (
    <form className="fo-agent__form" onSubmit={(e) => { e.preventDefault(); if (goal.trim()) startAgent(island.id, card.id, goal); }}>
      <textarea
        className="fo-agent__goal-input"
        value={goal}
        placeholder="What should the agent do?"
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) e.currentTarget.form.requestSubmit(); }}
      />
      <button type="submit" className="fo-loud" disabled={!goal.trim()}>
        <span className="fo-glyph">{GLYPH.bolt}</span>Start
      </button>
    </form>
  );
}

// Goals older than the Tasks list (or from before it loaded) are fetched one by one.
function useMissingTasks(ids, tasks) {
  const [fetched, setFetched] = useState({});
  const missing = ids.filter((id) => !tasks?.[id] && !(id in fetched)).join(',');
  useEffect(() => {
    if (!missing) return undefined;
    let live = true;
    const timer = setTimeout(() => {
      Promise.all(missing.split(',').map((id) => Promise.resolve(window.api.localData?.tasks?.get?.(id)).then((row) => [id, row || null], () => [id, null])))
        .then((pairs) => { if (live) setFetched((prev) => ({ ...prev, ...Object.fromEntries(pairs) })); });
    }, MISSING_FETCH_DELAY_MS);
    return () => { live = false; clearTimeout(timer); };
  }, [missing]);
  return fetched;
}

function useHistory(island, card, tasks, commands) {
  const ids = useMemo(() => dedupe([card.data.taskId, ...(card.data.history || [])]), [card.data.taskId, card.data.history]);
  const fetched = useMissingTasks(ids, tasks);
  return useMemo(() => {
    const own = new Set(ids);
    const goals = ids.map((id) => {
      const task = tasks?.[id] || fetched[id]; // undefined while looking, null once gone
      const text = task?.title || (id === card.data.taskId ? card.data.goal : '') || (task === null ? 'Removed from Tasks' : 'Looking up…');
      return { key: `task:${id}`, id, task, source: 'briizos', text, at: task?.created_at || 0 };
    });
    const lines = (commands || [])
      .filter((c) => (c.source === 'apperture' ? !c.islandId || c.islandId === island.id : c.islandId === island.id && c.cardId === card.id)) // Apperture lines stamped for another island stay off this card
      .filter((c) => !(c.kind === 'goal' && c.taskRef?.app === 'briizos' && own.has(c.taskRef.id))) // the goal row already stands for it
      .map((c) => ({ key: `cmd:${c.id}`, id: c.id, source: c.source, kind: c.kind, text: c.text, at: c.at }));
    return [...goals, ...lines].sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [ids, tasks, fetched, commands, island.id, card.id, card.data.taskId, card.data.goal]);
}

function CommandHistory({ rows }) {
  const [open, setOpen] = useState(null);
  if (!rows.length) return null;
  return (
    <section className="fo-agent__history">
      <h3 className="fo-agent__kicker">Commands <span className="fo-whisper">{rows.length}</span></h3>
      <ul className="fo-agent__cmds">
        {rows.map((row) => {
          const isOpen = open === row.id;
          const time = <time className="fo-whisper">{row.at ? whenShort(row.at) : ''}</time>;
          const source = <span className="fo-agent__src" data-source={row.source}>{SOURCE_LABEL[row.source] || row.source}</span>;
          if (!('task' in row)) {
            return (
              <li key={row.key} className="fo-agent__cmd" data-source={row.source}>
                <div className="fo-agent__cmd-line">
                  <span className="fo-agent__caret" />
                  <span className="fo-agent__cmd-text" title={row.text}><b>{COMMAND_LABEL[row.kind] || row.kind}</b> {row.text}</span>
                  {source}{time}
                </div>
              </li>
            );
          }
          const phase = row.task ? phaseOf(row.task) : row.task === null ? 'removed' : '…';
          const log = row.task?.taskLog || [];
          return (
            <li key={row.key} className="fo-agent__cmd" data-source="briizos" data-open={isOpen ? 'true' : undefined}>
              <button type="button" className="fo-agent__cmd-line" aria-expanded={isOpen} disabled={!row.task} onClick={() => setOpen(isOpen ? null : row.id)}>
                <span className="fo-glyph fo-agent__caret">{isOpen ? GLYPH.chevronDown : GLYPH.chevron}</span>
                <span className="fo-agent__cmd-text" title={row.text}>{row.text}</span>
                <span className="fo-agent__chip" data-status={phase}>{phase}</span>
                {source}{time}
              </button>
              {isOpen && (
                <ol className="fo-agent__tasklog">
                  {log.length ? log.map((entry) => (
                    <li key={entry.id} data-type={entry.type}>
                      <span>{entry.message}</span>
                      <time className="fo-whisper">{whenShort(entry.timestamp)}</time>
                    </li>
                  )) : <li className="fo-whisper">Nothing logged yet</li>}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AgentFace({ island, card, task, tasks }) {
  const [reply, setReply] = useState('');
  const summary = useApperture(island.rootPath);
  const rows = useHistory(island, card, tasks, summary?.ok ? summary.commands : null);
  const history = <CommandHistory rows={rows} />;
  if (!card.data.taskId) {
    return (
      <div className="fo-agent" data-history={rows.length ? 'true' : undefined}>
        <GoalForm island={island} card={card} />
        {history}
      </div>
    );
  }

  const phase = phaseOf(task);
  const steps = task?.subtasks || [];
  const recent = (task?.taskLog || []).slice(-4).reverse();
  const question = phase === 'needs you' ? [...(task?.taskLog || [])].reverse().find((entry) => entry.type === 'question') : null;

  return (
    <div className="fo-agent" data-phase={phase} data-history={rows.length ? 'true' : undefined}>
      <div className="fo-agent__goal">
        <p>{card.data.goal}</p>
        <span className="fo-agent__phase">{phase}</span>
      </div>
      {steps.length > 0 && (
        <ol className="fo-agent__steps">
          {steps.map((step) => (
            <li key={step.id} data-status={step.status}>
              <span className="fo-glyph">{step.status === 'completed' ? GLYPH.check : GLYPH.circle}</span>
              {step.title}
            </li>
          ))}
        </ol>
      )}
      {question && (
        <form className="fo-agent__reply" onSubmit={(e) => { e.preventDefault(); answerAgent(island.id, card.id, reply); setReply(''); }}>
          <p className="fo-agent__question">{question.message}</p>
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Answer" />
        </form>
      )}
      {recent.length > 0 && (
        <ul className="fo-agent__log">
          {recent.map((entry) => (
            <li key={entry.id} data-type={entry.type}>
              <span>{entry.message}</span>
              <span className="fo-whisper">{whenShort(entry.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="fo-agent__actions">
        {phase === 'paused' || phase === 'stopped' ? (
          <button type="button" className="fo-btn" onClick={() => resumeAgent(island.id, card.id)}>Resume</button>
        ) : phase !== 'done' ? (
          <button type="button" className="fo-btn" onClick={() => pauseAgent(island.id, card.id)}>Pause</button>
        ) : null}
        <button type="button" className="fo-btn" onClick={() => updateCardData(island.id, card.id, { taskId: null, goal: '' })}>New goal</button>
      </div>
      {history}
    </div>
  );
}

function LaunchButton({ island }) {
  const [launching, setLaunching] = useState(false);
  const launch = async () => {
    setLaunching(true);
    await launchApperture(island.id);
    setTimeout(() => setLaunching(false), LAUNCH_COOLDOWN_MS);
  };
  return (
    <button type="button" className="fo-loud fo-apx__launch" disabled={launching} onClick={launch}>
      <span className="fo-glyph">{GLYPH.open}</span>{launching ? 'Opening Apperture…' : 'Launch Apperture'}
    </button>
  );
}

function AppertureFace({ island }) {
  const summary = useApperture(island.rootPath);
  if (!island.rootPath) {
    return (
      <div className="fo-agent fo-apx" data-face="apperture">
        <p className="fo-apx__note">Apperture works on a project folder. Give this island its folder to see its board here and open it in Apperture.</p>
        <button type="button" className="fo-loud fo-apx__launch" onClick={() => pickIslandFolder(island.id)}>
          <span className="fo-glyph">{GLYPH.folder}</span>Choose project folder
        </button>
      </div>
    );
  }
  const project = summary?.ok ? summary.project : null;
  const board = summary?.ok ? summary.board : null;
  const tasks = board?.tasks || [];
  const artifacts = board?.artifacts || [];
  const counts = BOARD_STATUSES.map(([id, label]) => [id, label, tasks.filter((t) => t.status === id).length]).filter(([, , n]) => n > 0);
  const latest = [...tasks].sort(byNewest).slice(0, LATEST_TASKS);
  const builds = [...artifacts].sort(byNewest).slice(0, LATEST_ARTIFACTS);
  const where = !summary ? 'reading…'
    : board?.updatedAt ? `board updated ${whenShort(board.updatedAt)}`
      : project?.id ? 'opened in Apperture' : 'not opened in Apperture yet';

  return (
    <div className="fo-agent fo-apx" data-face="apperture">
      <div className="fo-agent__goal">
        <p>{project?.name || island.name}</p>
        {tasks.length > 0 && <span className="fo-agent__phase">{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>}
      </div>
      <span className="fo-whisper fo-apx__where" title={island.rootPath}>{homeShort(island.rootPath)} · {where}</span>
      {summary && !summary.ok && <p className="fo-apx__note" data-tone="error">{summary.error}</p>}
      {counts.length > 0 && (
        <div className="fo-apx__counts">
          {counts.map(([id, label, n]) => <span key={id} className="fo-agent__chip" data-status={id}>{label} <b>{n}</b></span>)}
        </div>
      )}
      {latest.length > 0 && (
        <section className="fo-apx__section">
          <h3 className="fo-agent__kicker">Latest tasks</h3>
          <ul className="fo-agent__cmds">
            {latest.map((t) => (
              <li key={t.specId || t.title} className="fo-agent__cmd">
                <div className="fo-agent__cmd-line">
                  <span className="fo-agent__cmd-text" title={t.title}>{t.title || t.specId}</span>
                  <span className="fo-agent__chip" data-status={t.status}>{STATUS_LABEL[t.status] || t.status}</span>
                  <time className="fo-whisper">{t.updatedAt ? whenShort(t.updatedAt) : ''}</time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {builds.length > 0 && (
        <section className="fo-apx__section">
          <h3 className="fo-agent__kicker">Builder</h3>
          <ul className="fo-agent__cmds">
            {builds.map((a) => (
              <li key={a.id} className="fo-agent__cmd">
                <div className="fo-agent__cmd-line">
                  <span className="fo-apx__kind" data-kind={a.kind}>{ARTIFACT_LABEL[a.kind] || a.kind}</span>
                  <span className="fo-agent__cmd-text" title={a.name}>{a.name || 'Untitled design'}</span>
                  <time className="fo-whisper">{a.updatedAt ? whenShort(a.updatedAt) : ''}</time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {summary?.ok && !tasks.length && !artifacts.length && (
        <p className="fo-apx__note">No Apperture tasks or Builder designs for this folder yet. Launch Apperture to start one; they show up here as they change.</p>
      )}
      <div className="fo-agent__actions">
        <LaunchButton island={island} />
      </div>
    </div>
  );
}

export default function AgentCard(props) {
  return props.card.data.face === 'apperture' ? <AppertureFace island={props.island} /> : <AgentFace {...props} />;
}
