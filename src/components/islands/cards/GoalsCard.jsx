import { useMemo } from 'react';
import logger from '../../../lib/logger';
import { addEntry, refreshTasks, saveNow, updateCardData } from '../store';
import { GLYPH } from '../catalog';
import { uid } from '../util';
import { AddLine, Check, EditableText } from './fields';

async function sendToTasks(island, card, item) {
  try {
    await saveNow();
    const created = await window.api.localData.tasks.create({
      title: item.text.slice(0, 300),
      description: `From the island “${island.name}”, card “${card.title}”.`,
      status: 'pending',
      priority: 'normal',
      islandProjectId: island.id,
      sourceKey: `island-goal:${card.id}:${item.id}`,
    });
    const taskId = created?.row?.id;
    updateCardData(island.id, card.id, (data) => ({ items: (data.items || []).map((i) => (i.id === item.id ? { ...i, taskId } : i)) }));
    logger.info('island.card', `Sent “${item.text}” to the Tasks panel. Checking it off in either place checks it off in both.`, { island: island.name, taskId });
    refreshTasks();
  } catch (error) {
    logger.error('island.card', `Could not send “${item.text}” to the Tasks panel`, { problem: error?.message });
  }
}

async function setTaskDone(task, done) {
  try {
    const fresh = await window.api.localData.tasks.get(task.id);
    await window.api.localData.tasks.update(task.id, fresh.revision, { status: done ? 'completed' : 'pending' });
    refreshTasks();
  } catch (error) {
    logger.error('island.card', 'Could not update that task', { problem: error?.message, task: task.title });
  }
}

export default function GoalsCard({ island, card, tasks }) {
  const items = card.data.items || [];
  const taskMap = tasks || {};
  const linked = useMemo(() => Object.values(taskMap).filter((t) => t.island_project_id === island.id
    && !String(t.source_key || '').startsWith('island-agent:')
    && !String(t.source_key || '').startsWith('island-goal:')
    && !['cancelled'].includes(t.status)), [taskMap, island.id]);

  const toggle = (item) => {
    const task = item.taskId ? taskMap[item.taskId] : null;
    const done = task ? task.status !== 'completed' : !item.done;
    updateCardData(island.id, card.id, (data) => ({ items: (data.items || []).map((i) => (i.id === item.id ? { ...i, done } : i)) }));
    if (task) setTaskDone(task, done);
    if (done) addEntry(island.id, 'step', `Done: ${item.text}`);
  };

  return (
    <div className="fo-goals">
      <ul className="fo-goals__list">
        {items.map((item) => {
          const task = item.taskId ? taskMap[item.taskId] : null;
          const done = task ? task.status === 'completed' : item.done;
          return (
            <li key={item.id} className="fo-goals__item" data-done={done ? 'true' : undefined}>
              <Check done={done} onToggle={() => toggle(item)} />
              <EditableText
                multiline={false}
                value={item.text}
                onCommit={(text) => updateCardData(island.id, card.id, (data) => ({
                  items: text.trim() ? (data.items || []).map((i) => (i.id === item.id ? { ...i, text } : i)) : (data.items || []).filter((i) => i.id !== item.id),
                }))}
              />
              {item.taskId ? (
                <span className="fo-goals__linked fo-glyph" title="Also in the Tasks panel">{GLYPH.link}</span>
              ) : (
                <button type="button" className="fo-goals__send" onClick={() => sendToTasks(island, card, item)} title="Send to the Tasks panel">
                  <span className="fo-glyph">{GLYPH.share}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <AddLine
        placeholder="Add a step"
        onAdd={(text) => updateCardData(island.id, card.id, (data) => ({ items: [...(data.items || []), { id: uid('item'), text, done: false }] }))}
      />
      {linked.length > 0 && (
        <ul className="fo-goals__list fo-goals__list--tasks">
          {linked.map((task) => (
            <li key={task.id} className="fo-goals__item" data-done={task.status === 'completed' ? 'true' : undefined}>
              <Check done={task.status === 'completed'} onToggle={() => setTaskDone(task, task.status !== 'completed')} />
              <span className="fo-goals__task">{task.title}</span>
              <span className="fo-goals__linked fo-glyph" title="From the Tasks panel">{GLYPH.link}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
