import logger from './logger';
import {
  restrictivePolicy,
  registerThreadSurface,
  unregisterThread,
  consumeGatedToolCalls,
} from './agentSurfaces';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

function extractText(response) {
  const messages = response?.messages;
  const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
  return typeof last?.content === 'string' ? last.content : '';
}

export function buildDayPlannerPrompt({ date, events, placements, tasks, projects }) {
  const payload = {
    date,
    current_schedule: [
      ...events.map((event) => ({
        kind: 'event',
        id: event.id,
        title: event.name || event.title,
        startMinute: event.start,
        durationMinutes: event.duration || 60,
        completed: event.status === 'done' || event.status === 'completed',
      })),
      ...placements.map((placement) => ({
        kind: 'task',
        placementId: placement.id,
        taskId: placement.ref_id,
        title: placement.task?.title,
        startMinute: placement.start_minute,
        durationMinutes: placement.duration_minutes,
        sessionCompleted: placement.session_completed,
        taskCompleted: placement.task?.status === 'completed',
      })),
    ],
    open_tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueAt: task.due_at || null,
      forestProjectId: task.forest_project_id || null,
    })),
    forest_projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      deadline: project.deadline || null,
      importance: project.importance ?? null,
      size: project.size ?? null,
      relevance: project.relevance || null,
      openMilestones: (project.milestones || [])
        .filter((milestone) => !milestone.completed)
        .map((milestone) => milestone.label || milestone.name || milestone.title),
    })),
  };

  return [
    'You are briizOS Day Planner. Shape a realistic day from the user\'s existing work and fixed events.',
    'Respect existing blocks. Prefer open tasks that are important, timely, relevant, and realistically sized.',
    'Leave breathing room. Do not fill every minute. Never move or duplicate an existing block.',
    'For existing work, use kind "task" and copy the exact task id. Use kind "event" only for a genuinely new standalone block such as lunch, travel, or a break.',
    'Return 1-8 proposals. If the day is already full, return fewer or none and explain that briefly.',
    'This turn is text-only: do not call tools.',
    '',
    'Respond with ONLY JSON:',
    '{"summary":"one sentence","proposals":[{"kind":"task|event","taskId":"required for task","title":"short title","startMinute":540,"durationMinutes":60,"reason":"brief reason"}]}',
    '',
    JSON.stringify(payload),
  ].join('\n');
}

export function parseDayPlannerResponse(text) {
  const clean = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The planner did not return its proposal JSON.');
  let parsed;
  try {
    parsed = JSON.parse(clean.slice(start, end + 1));
  } catch {
    throw new Error('The planner returned malformed proposal JSON.');
  }

  const proposals = (Array.isArray(parsed.proposals) ? parsed.proposals : []).slice(0, 8).map((proposal, index) => {
    const kind = proposal?.kind === 'task' ? 'task' : proposal?.kind === 'event' ? 'event' : null;
    const title = String(proposal?.title || '').trim();
    const startMinute = Number(proposal?.startMinute);
    const durationMinutes = Number(proposal?.durationMinutes);
    const taskId = proposal?.taskId == null ? null : String(proposal.taskId);
    if (!kind || !title || !Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1439) return null;
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) return null;
    if (kind === 'task' && !taskId) return null;
    return {
      id: `day-proposal-${Date.now()}-${index}`,
      kind,
      taskId,
      title,
      startMinute,
      durationMinutes,
      reason: String(proposal?.reason || '').trim(),
    };
  }).filter(Boolean);
  return { summary: String(parsed.summary || '').trim(), proposals };
}

export async function runDayPlanner(input) {
  if (!api.langgraphCreateThread || !api.langgraphSendMessage) throw new Error('Agent backend unavailable');
  const created = await api.langgraphCreateThread('planner');
  const threadId = created?.thread_id || created?.threadId || created;
  if (!threadId) throw new Error('Could not create a planner thread');
  const policy = restrictivePolicy('task');
  registerThreadSurface(threadId, policy);

  const userMessage = `Plan my day for ${input.date}.`;
  await api.localData.threads.messages.append(threadId, { role: 'user', content: userMessage });
  try {
    const model = (await api.localData.settings.get('selected_model'))?.value || undefined;
    const startedAt = Date.now();
    const response = await api.langgraphSendMessage(threadId, buildDayPlannerPrompt(input), {
      model,
      modality: 'planner',
      thinking: true,
      tool_confirmation_mode: policy.mode,
      permission_policy: policy,
    });
    const text = extractText(response);
    await api.localData.threads.messages.append(threadId, { role: 'assistant', content: text });
    const gated = consumeGatedToolCalls(threadId);
    if (gated.length) throw new Error('The planner tried to use a tool; no schedule changes were made.');
    const parsed = parseDayPlannerResponse(text);
    logger.info('agent.planner', 'Day plan proposed', {
      threadId,
      date: input.date,
      proposals: parsed.proposals.length,
      ms: Date.now() - startedAt,
    });
    return { ...parsed, threadId };
  } catch (error) {
    logger.error('agent.planner', 'Day planning failed', { threadId, date: input.date, error: error?.message });
    throw error;
  } finally {
    unregisterThread(threadId);
  }
}

export default runDayPlanner;
