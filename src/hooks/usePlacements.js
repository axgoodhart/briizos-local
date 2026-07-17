import { useCallback, useEffect, useState } from 'react';
import logger from '../lib/logger';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

/**
 * Live Calendar appearances for a bounded date range.
 *
 * A placement contains time context only. The service joins the referenced
 * task on every read, so title, priority, and task completion never drift.
 */
export function usePlacements({ dateFrom, dateTo }) {
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlacements = useCallback(async () => {
    if (!api.localData?.placements) {
      setPlacements([]);
      setIsLoading(false);
      return [];
    }
    try {
      const rows = await api.localData.placements.list({ dateFrom, dateTo, limit: 5000 });
      setPlacements(rows || []);
      return rows || [];
    } catch (error) {
      logger.error('calendar.placement', 'Failed to load scheduled tasks', { error: error?.message });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    setIsLoading(true);
    loadPlacements();
    const unsubscribe = api.localData?.onChanged?.((change) => {
      if (change?.domains?.some((domain) => domain === 'placements' || domain === 'tasks')) {
        loadPlacements();
      }
    });
    return unsubscribe;
  }, [loadPlacements]);

  const createPlacement = useCallback(async (input) => {
    const result = await api.localData.placements.create(input);
    logger.info('calendar.placement', 'Task scheduled', {
      placementId: result?.row?.id,
      taskId: input.refId,
      date: input.date,
      startMinute: input.startMinute,
      recurrence: input.recurrence?.type || null,
    });
    return result?.row;
  }, []);

  const updatePlacement = useCallback(async (placement, patch) => {
    const result = await api.localData.placements.update(placement.id, placement.revision, patch);
    logger.info('calendar.placement', 'Scheduled task moved', {
      placementId: placement.id,
      changes: Object.keys(patch),
    });
    return result?.row;
  }, []);

  const archivePlacement = useCallback(async (placement) => {
    const result = await api.localData.placements.archive(placement.id, placement.revision);
    logger.info('calendar.placement', 'Task unscheduled', {
      placementId: placement.id,
      taskId: placement.ref_id,
    });
    return result?.row;
  }, []);

  const setOccurrenceCompleted = useCallback(async (placement, occurrenceDate, completed) => {
    const result = await api.localData.placements.complete(
      placement.id,
      placement.revision,
      occurrenceDate,
      completed,
    );
    logger.info('calendar.placement', completed ? 'Scheduled session completed' : 'Scheduled session reopened', {
      placementId: placement.id,
      taskId: placement.ref_id,
      occurrenceDate,
    });
    return result?.row;
  }, []);

  return {
    placements,
    isLoading,
    loadPlacements,
    createPlacement,
    updatePlacement,
    archivePlacement,
    setOccurrenceCompleted,
  };
}

export default usePlacements;
