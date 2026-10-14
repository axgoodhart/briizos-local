import { useCallback, useState } from 'react';
import logger from '../lib/logger';
import { runDayPlanner } from '../lib/dayPlanner';

const CLOSED_TASK_STATUSES = new Set(['completed', 'cancelled']);

export function useDayPlanner({ dateStr, events, placements, createPlacement, addItem }) {
  const [proposals, setProposals] = useState([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const planDay = useCallback(async (preferredCandidate = null) => {
    setIsPlanning(true);
    setError(null);
    setProposals([]);
    setSummary('');
    logger.info('agent.planner', 'Day planning started', {
      date: dateStr,
      preferredCandidate: preferredCandidate?.id || null,
    });
    try {
      const [tasks, forestState] = await Promise.all([
        window.api.localData.tasks.list({ limit: 500 }),
        window.api.forestLoadState(),
      ]);
      const openTasks = (tasks || []).filter((task) => !CLOSED_TASK_STATUSES.has(task.status));
      const projects = forestState?.projects || [];
      const result = await runDayPlanner({
        date: dateStr,
        events,
        placements,
        tasks: openTasks,
        projects,
        preferredCandidate,
      });
      const knownIds = new Set(openTasks.map((task) => task.id));
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const safeProposals = result.proposals
        .filter((proposal) => (
          (proposal.kind !== 'task' || knownIds.has(proposal.taskId))
          && (proposal.kind !== 'forest_project' || projectsById.has(proposal.projectId))
        ))
        .map((proposal) => proposal.kind === 'forest_project'
          ? { ...proposal, project: projectsById.get(proposal.projectId) }
          : proposal);
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

  const acceptProposal = useCallback(async (proposal, handlers = {}) => {
    setError(null);
    try {
      if (proposal.kind === 'task') {
        await createPlacement({
          refType: 'task',
          refId: proposal.taskId,
          date: dateStr,
          startMinute: proposal.startMinute,
          durationMinutes: proposal.durationMinutes,
        });
      } else if (proposal.kind === 'forest_project') {
        if (typeof handlers.promoteForestSource !== 'function' || !proposal.project) {
          throw new Error('This island is no longer available to schedule');
        }
        await handlers.promoteForestSource({
          kind: 'forest',
          title: proposal.title,
          project: proposal.project,
          milestone: null,
          sourceKey: `forest-project:${proposal.projectId}`,
        }, {
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
      return true;
    } catch (acceptError) {
      setError(acceptError?.message || 'Could not accept this proposal');
      logger.error('agent.planner', 'Day proposal acceptance failed', {
        proposalId: proposal.id,
        error: acceptError?.message,
      });
      return false;
    }
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
