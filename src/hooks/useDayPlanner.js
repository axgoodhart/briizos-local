import { useCallback, useState } from 'react';
import logger from '../lib/logger';
import { runDayPlanner } from '../lib/dayPlanner';

const CLOSED_TASK_STATUSES = new Set(['completed', 'cancelled']);

export function useDayPlanner({ dateStr, events, placements, createPlacement, addItem }) {
  const [proposals, setProposals] = useState([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const planDay = useCallback(async () => {
    setIsPlanning(true);
    setError(null);
    setProposals([]);
    setSummary('');
    logger.info('agent.planner', 'Day planning started', { date: dateStr });
    try {
      const [tasks, forestState] = await Promise.all([
        window.api.localData.tasks.list({ limit: 500 }),
        window.api.forestLoadState(),
      ]);
      const openTasks = (tasks || []).filter((task) => !CLOSED_TASK_STATUSES.has(task.status));
      const result = await runDayPlanner({
        date: dateStr,
        events,
        placements,
        tasks: openTasks,
        projects: forestState?.projects || [],
      });
      const knownIds = new Set(openTasks.map((task) => task.id));
      const safeProposals = result.proposals.filter((proposal) => (
        proposal.kind !== 'task' || knownIds.has(proposal.taskId)
      ));
      setProposals(safeProposals);
      setSummary(result.summary);
      return safeProposals;
    } catch (planError) {
      setError(planError?.message || 'Day planning failed');
      return [];
    } finally {
      setIsPlanning(false);
    }
  }, [dateStr, events, placements]);

  const rejectProposal = useCallback((proposalId) => {
    setProposals((current) => current.filter((proposal) => proposal.id !== proposalId));
    logger.info('agent.planner', 'Day proposal rejected', { proposalId, date: dateStr });
  }, [dateStr]);

  const acceptProposal = useCallback(async (proposal) => {
    if (proposal.kind === 'task') {
      await createPlacement({
        refType: 'task',
        refId: proposal.taskId,
        date: dateStr,
        startMinute: proposal.startMinute,
        durationMinutes: proposal.durationMinutes,
      });
    } else {
      await addItem({
        type: 'event',
        name: proposal.title,
        scheduledDate: dateStr,
        start: proposal.startMinute,
        duration: proposal.durationMinutes,
        end: proposal.startMinute + proposal.durationMinutes,
      });
    }
    setProposals((current) => current.filter((candidate) => candidate.id !== proposal.id));
    logger.info('agent.planner', 'Day proposal accepted', {
      proposalId: proposal.id,
      kind: proposal.kind,
      date: dateStr,
    });
  }, [addItem, createPlacement, dateStr]);

  const clearProposals = useCallback(() => {
    setProposals([]);
    setSummary('');
    setError(null);
  }, []);

  return {
    proposals,
    summary,
    error,
    isPlanning,
    planDay,
    acceptProposal,
    rejectProposal,
    clearProposals,
  };
}

export default useDayPlanner;
