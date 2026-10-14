import { useState } from 'react';
import { answerAgent, pauseAgent, resumeAgent, startAgent, updateCardData } from '../store';
import { GLYPH } from '../catalog';
import { whenShort } from '../util';

// One word for where the run is; the steps below carry the detail.
function phaseOf(task) {
  if (!task) return 'starting';
  if (task.status === 'completed') return 'done';
  if (task.status === 'waiting') return 'needs you';
  if (['cancelled', 'blocked'].includes(task.status)) return 'stopped';
  if (!task.automated) return 'paused';
  return (task.subtasks || []).length ? 'working' : 'planning';
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

export default function AgentCard({ island, card, task }) {
  const [reply, setReply] = useState('');
  if (!card.data.taskId) return <div className="fo-agent"><GoalForm island={island} card={card} /></div>;

  const phase = phaseOf(task);
  const steps = task?.subtasks || [];
  const recent = (task?.taskLog || []).slice(-4).reverse();
  const question = phase === 'needs you' ? [...(task?.taskLog || [])].reverse().find((entry) => entry.type === 'question') : null;

  return (
    <div className="fo-agent" data-phase={phase}>
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
    </div>
  );
}
