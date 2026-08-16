/**
 * useBriizify — state machine for the Tasks Panel briizify flow.
 *
 *   idle → thinking → (clarifying → thinking …) → ready
 *
 * Each round is one headless agent turn on a single 'briizify'-kind
 * thread (see src/lib/briizify.js). The finished plan (the
 * "priorifact") persists in the validated local-data settings store
 * under 'briizify_plan' so it survives reloads; ending the plan
 * writes null. Both sides of every exchange are appended to the
 * thread ("all AI interactions are stored").
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import logger from '../lib/logger';
import {
  buildBriizifyPrompt,
  parseBriizifyResponse,
  createBriizifyThread,
  runBriizifyTurn,
  releaseBriizifyThread,
} from '../lib/briizify';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const SETTINGS_KEY = 'briizify_plan';
const SAVED_FLOWS_KEY = 'briizify_saved_flows';
const MAX_TARGET_EXTENSIONS = 3;
const TARGET_EXTENSION_MINUTES = 5;
const MAX_PLAN_ACTIVITIES = 48;

function absoluteActivityMinute(activity) {
  return Date.parse(`${activity.date}T00:00:00Z`) / 60000 + activity.startMinute;
}

function activitySlotFromAbsolute(absoluteMinute) {
  const dayOrdinal = Math.floor(absoluteMinute / 1440);
  return {
    date: new Date(dayOrdinal * 86400000).toISOString().slice(0, 10),
    startMinute: absoluteMinute - dayOrdinal * 1440,
  };
}

// Same spirit as the deck maker's rule: ask once, allow a little
// slack, then stop rather than loop on an indecisive model.
const MAX_CLARIFICATIONS = 2;

export function useBriizify() {
  const [status, setStatus] = useState('loading'); // loading | idle | thinking | clarifying | ready
  const [plan, setPlan] = useState(null);
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState('idle');
  const [saveFlowStatus, setSaveFlowStatus] = useState('idle');
  const [extendingActivityId, setExtendingActivityId] = useState(null);
  const [scheduleStatus, setScheduleStatus] = useState('idle');
  const [actionError, setActionError] = useState(null);

  const threadRef = useRef(null);
  const requestRef = useRef(null);
  const clarifyCountRef = useRef(0);
  const planRef = useRef(null);
  const scheduleMutationRef = useRef(false);

  useEffect(() => { planRef.current = plan; }, [plan]);

  // Load the persisted priorifact once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await api.localData?.settings?.get(SETTINGS_KEY);
        if (!active) return;
        const value = stored?.value || null;
        if (value && Array.isArray(value.activities) && value.activities.length > 0) {
          setPlan(value);
          setStatus('ready');
        } else {
          setStatus('idle');
        }
      } catch (loadError) {
        if (!active) return;
        logger.warn('tasks.briizify', 'Could not load the saved priorifact; starting fresh.', {
          error: loadError?.message,
        });
        setStatus('idle');
      }
    })();
    return () => { active = false; };
  }, []);

  const persist = useCallback(async (nextPlan) => {
    planRef.current = nextPlan;
    setPlan(nextPlan);
    setStatus(nextPlan ? 'ready' : 'idle');
    try {
      await api.localData?.settings?.set(SETTINGS_KEY, nextPlan);
    } catch (saveError) {
      // The plan still lives in memory for this session; only the
      // reload persistence is degraded.
      logger.warn('tasks.briizify', 'The priorifact could not be saved and will not survive a reload.', {
        error: saveError?.message,
      });
    }
  }, []);

  const finishThread = useCallback(() => {
    if (threadRef.current) {
      releaseBriizifyThread(threadRef.current);
      threadRef.current = null;
    }
  }, []);

  const resetRequest = useCallback(() => {
    requestRef.current = null;
    clarifyCountRef.current = 0;
  }, []);

  const runRound = useCallback(async (userText, { isAnswer = false } = {}) => {
    setStatus('thinking');
    setError(null);
    setQuestion(null);

    const request = requestRef.current;
    try {
      if (!threadRef.current) threadRef.current = await createBriizifyThread();
      const threadId = threadRef.current;

      await api.localData.threads.messages.append(threadId, { role: 'user', content: userText });
      const prompt = buildBriizifyPrompt(request, isAnswer ? userText : null);
      const text = await runBriizifyTurn(threadId, prompt);
      await api.localData.threads.messages.append(threadId, { role: 'assistant', content: text });

      const parsed = parseBriizifyResponse(text, {
        channels: request.channels,
        defaultDate: request.date,
      });

      if (parsed.needsDetails) {
        clarifyCountRef.current += 1;
        if (clarifyCountRef.current > MAX_CLARIFICATIONS) {
          throw new Error('briizify kept asking questions instead of planning. Try more specific candidates.');
        }
        logger.info('tasks.briizify', 'Clarifying question asked', { question: parsed.question });
        setQuestion(parsed.question);
        setStatus('clarifying');
        return null;
      }

      const nextPlan = {
        version: 1,
        generatedAt: Date.now(),
        date: request.date,
        timeframe: request.timeframe,
        window: request.pickTimeForMe ? null : request.window,
        channels: request.channels,
        summary: parsed.summary,
        activities: parsed.activities,
        threadId,
      };
      finishThread();
      resetRequest();
      await persist(nextPlan);
      logger.info('tasks.briizify', `Priorifact created: ${nextPlan.activities.length} activities`, {
        date: nextPlan.date,
        timeframe: nextPlan.timeframe,
      });
      return nextPlan;
    } catch (roundError) {
      logger.error('tasks.briizify', 'briizify request failed', { error: roundError?.message });
      setError(roundError?.message || 'briizify request failed');
      setStatus(planRef.current ? 'ready' : 'idle');
      finishThread();
      resetRequest();
      return null;
    }
  }, [finishThread, persist, resetRequest]);

  /** Kick off a plan request with the fully-assembled setup payload. */
  const generate = useCallback(async (payload) => {
    if (status === 'thinking' || status === 'clarifying') return null;
    requestRef.current = payload;
    clarifyCountRef.current = 0;
    const scopeLabel = payload.timeframe === 'today' ? payload.date : 'this week';
    const pickedCount = payload.candidates.length + (payload.customItems?.length || 0);
    logger.info('tasks.briizify', 'briizify requested', { date: payload.date, timeframe: payload.timeframe, picked: pickedCount });
    return runRound(`briizify: prioritize ${pickedCount} picks for ${scopeLabel}.`);
  }, [runRound, status]);

  const answerClarification = useCallback(async (answer) => {
    const trimmed = String(answer || '').trim();
    if (!trimmed || status !== 'clarifying') return null;
    logger.info('tasks.briizify', 'Clarification answered', { answer: trimmed });
    return runRound(trimmed, { isAnswer: true });
  }, [runRound, status]);

  const cancelRequest = useCallback(() => {
    logger.info('tasks.briizify', 'briizify request cancelled');
    finishThread();
    resetRequest();
    setQuestion(null);
    setError(null);
    setStatus(planRef.current ? 'ready' : 'idle');
  }, [finishThread, resetRequest]);

  const endPlan = useCallback(async () => {
    logger.info('tasks.briizify', 'Priorifact ended');
    await persist(null);
  }, [persist]);

  /**
   * Insert a break after the given activity and push every later
   * activity on the same date back by the break's length.
   */
  const addBreak = useCallback(async (afterActivityId, minutes = 15) => {
    const current = planRef.current;
    if (!current || current.pauseState || scheduleMutationRef.current) return;
    const anchor = current.activities.find((activity) => activity.id === afterActivityId);
    if (!anchor) return;
    const breakStart = Math.min(anchor.startMinute + anchor.durationMinutes, 1439);
    const inserted = {
      id: `bzfa-${Date.now()}-break`,
      kind: 'break',
      refId: null,
      title: 'break',
      date: anchor.date,
      startMinute: breakStart,
      durationMinutes: minutes,
    };
    const shifted = current.activities.map((activity) => {
      if (activity.date !== anchor.date || activity.startMinute < breakStart || activity.id === anchor.id) {
        return activity;
      }
      return {
        ...activity,
        startMinute: Math.min(activity.startMinute + minutes, 1439 - Math.min(activity.durationMinutes, 1439)),
      };
    });
    const activities = [...shifted, inserted]
      .sort((a, b) => (a.date === b.date ? a.startMinute - b.startMinute : a.date < b.date ? -1 : 1));
    scheduleMutationRef.current = true;
    setScheduleStatus('working');
    try {
      const nextPlan = { ...current, activities };
      delete nextPlan.savedFlowId;
      await persist(nextPlan);
    } finally {
      scheduleMutationRef.current = false;
      setScheduleStatus('idle');
    }
  }, [persist]);

  const removeActivity = useCallback(async (activityId) => {
    const current = planRef.current;
    if (!current || scheduleMutationRef.current) return;
    const activities = current.activities.filter((activity) => activity.id !== activityId);
    if (!activities.some((activity) => activity.kind !== 'break')) {
      await persist(null);
      return;
    }
    const calendarBlocks = { ...(current.calendarBlocks || {}) };
    const targetExtensions = { ...(current.targetExtensions || {}) };
    delete calendarBlocks[activityId];
    delete targetExtensions[activityId];
    scheduleMutationRef.current = true;
    setScheduleStatus('working');
    try {
      const nextPlan = { ...current, activities, calendarBlocks, targetExtensions };
      delete nextPlan.savedFlowId;
      await persist(nextPlan);
    } finally {
      scheduleMutationRef.current = false;
      setScheduleStatus('idle');
    }
  }, [persist]);

  const activityTimestamp = useCallback((activity) => {
    const [year, month, day] = String(activity.date).split('-').map(Number);
    return new Date(year, month - 1, day).getTime() + activity.startMinute * 60000;
  }, []);

  const syncCalendarActivity = useCallback(async (calendarBlock, previous, next) => {
    if (!calendarBlock) return calendarBlock;

    if (calendarBlock.kind === 'placement') {
      const live = (await api.localData.placements.list({ id: calendarBlock.id, limit: 1 }))?.[0];
      if (!live) return null;
      const patch = {};
      if (previous.date !== next.date) patch.date = next.date;
      if (previous.startMinute !== next.startMinute) patch.startMinute = next.startMinute;
      if (previous.durationMinutes !== next.durationMinutes) patch.durationMinutes = next.durationMinutes;
      if (!Object.keys(patch).length) return { ...calendarBlock, revision: live.revision };
      const result = await api.localData.placements.update(live.id, live.revision, patch);
      return { ...calendarBlock, revision: result?.row?.revision ?? live.revision + 1 };
    }

    if (calendarBlock.kind === 'event') {
      const live = (await api.localData.organizer.list({ type: 'event', limit: 5000 }))
        ?.find((item) => item.id === calendarBlock.id);
      if (!live) return null;
      const patch = {};
      if (previous.title !== next.title) patch.title = next.title;
      if (
        previous.date !== next.date
        || previous.startMinute !== next.startMinute
        || previous.durationMinutes !== next.durationMinutes
      ) {
        const scheduledStartAt = activityTimestamp(next);
        patch.scheduledStartAt = scheduledStartAt;
        patch.scheduledEndAt = scheduledStartAt + next.durationMinutes * 60000;
        patch.durationSeconds = next.durationMinutes * 60;
      }
      if (!Object.keys(patch).length) return { ...calendarBlock, revision: live.revision };
      const result = await api.localData.organizer.update(live.id, live.revision, patch);
      return { ...calendarBlock, revision: result?.row?.revision ?? live.revision + 1 };
    }

    return calendarBlock;
  }, [activityTimestamp]);

  const commitActivityMutation = useCallback(async (
    current,
    nextActivities,
    changedActivityIds,
    { clearPause = false, logMessage = 'Priorifact schedule changed' } = {},
  ) => {
    if (!current || scheduleMutationRef.current) return false;
    scheduleMutationRef.current = true;
    setScheduleStatus('working');
    setActionError(null);
    try {
      const previousById = new Map(current.activities.map((activity) => [activity.id, activity]));
      const nextById = new Map(nextActivities.map((activity) => [activity.id, activity]));
      const calendarBlocks = { ...(current.calendarBlocks || {}) };

      for (const activityId of new Set(changedActivityIds)) {
        const previous = previousById.get(activityId);
        const next = nextById.get(activityId);
        if (!previous || !next || !calendarBlocks[activityId]) continue;
        const synced = await syncCalendarActivity(calendarBlocks[activityId], previous, next);
        if (synced) calendarBlocks[activityId] = synced;
        else {
          delete calendarBlocks[activityId];
          logger.warn('tasks.briizify', 'A missing Calendar block was detached from the priorifact', { activityId });
        }
      }

      const validIds = new Set(nextActivities.map((activity) => activity.id));
      Object.keys(calendarBlocks).forEach((activityId) => {
        if (!validIds.has(activityId)) delete calendarBlocks[activityId];
      });
      const activities = [...nextActivities].sort((a, b) => (
        a.date === b.date ? a.startMinute - b.startMinute : a.date < b.date ? -1 : 1
      ));
      const nextPlan = { ...current, activities, calendarBlocks };
      delete nextPlan.savedFlowId;
      if (clearPause) delete nextPlan.pauseState;
      await persist(nextPlan);
      logger.info('tasks.briizify', logMessage, { activities: activities.length });
      return true;
    } catch (mutationError) {
      setActionError(mutationError?.message || 'Could not update this plan.');
      logger.error('tasks.briizify', 'Priorifact schedule mutation failed', {
        error: mutationError?.message,
      });
      return false;
    } finally {
      scheduleMutationRef.current = false;
      setScheduleStatus('idle');
    }
  }, [persist, syncCalendarActivity]);

  /** Add each activity once, preserving live Task linkage wherever it exists. */
  const addToCalendar = useCallback(async () => {
    const current = planRef.current;
    if (!current || calendarStatus === 'working') return false;
    setCalendarStatus('working');
    setActionError(null);
    const calendarBlocks = { ...(current.calendarBlocks || {}) };

    try {
      for (const activity of current.activities) {
        if (calendarBlocks[activity.id]) continue;
        let calendarBlock;

        if (activity.kind === 'task' && activity.refId && await api.localData?.tasks?.get(activity.refId)) {
          const result = await api.localData.placements.create({
            refType: 'task',
            refId: activity.refId,
            date: activity.date,
            startMinute: activity.startMinute,
            durationMinutes: activity.durationMinutes,
            recurrence: null,
          });
          calendarBlock = {
            kind: 'placement',
            id: result?.row?.id,
            revision: result?.row?.revision,
          };
        } else {
          const scheduledStartAt = activityTimestamp(activity);
          const result = await api.localData.organizer.create({
            type: 'event',
            title: activity.kind === 'break' ? 'Break' : activity.title,
            body: 'briizify priorifact block',
            status: 'pending',
            scheduledStartAt,
            scheduledEndAt: scheduledStartAt + activity.durationMinutes * 60000,
            durationSeconds: activity.durationMinutes * 60,
            tags: ['briizify'],
          });
          calendarBlock = {
            kind: 'event',
            id: result?.row?.id,
            revision: result?.row?.revision,
          };
        }

        if (!calendarBlock.id) throw new Error(`Calendar did not return a block for “${activity.title}”.`);
        calendarBlocks[activity.id] = calendarBlock;
      }

      await persist({ ...current, calendarBlocks });
      setCalendarStatus('done');
      logger.info('tasks.briizify', 'Priorifact added to Calendar', {
        activities: current.activities.length,
      });
      return true;
    } catch (calendarError) {
      if (Object.keys(calendarBlocks).length !== Object.keys(current.calendarBlocks || {}).length) {
        await persist({ ...current, calendarBlocks });
      }
      setCalendarStatus('error');
      setActionError(calendarError?.message || 'Could not add the priorifact to Calendar.');
      logger.error('tasks.briizify', 'Could not add priorifact to Calendar', {
        error: calendarError?.message,
      });
      return false;
    }
  }, [activityTimestamp, calendarStatus, persist]);

  /** Save a date-independent template; the invocation UI will consume this later. */
  const saveFlow = useCallback(async () => {
    const current = planRef.current;
    if (!current || current.savedFlowId || saveFlowStatus === 'working') return false;
    setSaveFlowStatus('working');
    setActionError(null);
    try {
      const stored = await api.localData?.settings?.get(SAVED_FLOWS_KEY);
      const flows = Array.isArray(stored?.value) ? stored.value : [];
      const dates = current.activities.map((activity) => activity.date).sort();
      const anchorDate = dates[0] || current.date;
      const anchorOrdinal = Date.parse(`${anchorDate}T00:00:00Z`) / 86400000;
      const flowId = `bzf-flow-${Date.now()}`;
      const flow = {
        id: flowId,
        savedAt: Date.now(),
        summary: current.summary || '',
        timeframe: current.timeframe,
        window: current.window || null,
        channels: current.channels || {},
        activities: current.activities.map((activity) => ({
          kind: activity.kind,
          refId: activity.refId || null,
          title: activity.title,
          dayOffset: Math.round(Date.parse(`${activity.date}T00:00:00Z`) / 86400000 - anchorOrdinal),
          startMinute: activity.startMinute,
          durationMinutes: activity.durationMinutes,
          prep: activity.prep || [],
          steps: activity.steps || [],
          support: activity.support || [],
        })),
      };
      await api.localData.settings.set(SAVED_FLOWS_KEY, [...flows, flow]);
      await persist({ ...current, savedFlowId: flowId });
      setSaveFlowStatus('done');
      logger.info('tasks.briizify', 'Priorifact saved as a reusable flow', { flowId });
      return true;
    } catch (saveError) {
      setSaveFlowStatus('error');
      setActionError(saveError?.message || 'Could not save this flow.');
      logger.error('tasks.briizify', 'Could not save reusable flow', { error: saveError?.message });
      return false;
    }
  }, [persist, saveFlowStatus]);

  /** Extend one activity target by five minutes, including its Calendar block when present. */
  const extendActivity = useCallback(async (activityId) => {
    const current = planRef.current;
    const activity = current?.activities.find((candidate) => candidate.id === activityId);
    const extensionCount = current?.targetExtensions?.[activityId] || 0;
    if (!current || !activity || current.pauseState || extensionCount >= MAX_TARGET_EXTENSIONS || extendingActivityId) return false;

    setExtendingActivityId(activityId);
    setActionError(null);
    try {
      const durationMinutes = activity.durationMinutes + TARGET_EXTENSION_MINUTES;
      const calendarBlocks = { ...(current.calendarBlocks || {}) };
      const calendarBlock = calendarBlocks[activityId];

      if (calendarBlock?.kind === 'placement') {
        const live = (await api.localData.placements.list({ id: calendarBlock.id, limit: 1 }))?.[0];
        if (!live) throw new Error('The linked Calendar block is no longer available.');
        const result = await api.localData.placements.update(live.id, live.revision, { durationMinutes });
        calendarBlocks[activityId] = {
          ...calendarBlock,
          revision: result?.row?.revision ?? live.revision + 1,
        };
      } else if (calendarBlock?.kind === 'event') {
        const live = (await api.localData.organizer.list({ type: 'event', limit: 5000 }))
          ?.find((item) => item.id === calendarBlock.id);
        if (!live) throw new Error('The linked Calendar block is no longer available.');
        const scheduledStartAt = activityTimestamp(activity);
        const result = await api.localData.organizer.update(live.id, live.revision, {
          scheduledEndAt: scheduledStartAt + durationMinutes * 60000,
          durationSeconds: durationMinutes * 60,
        });
        calendarBlocks[activityId] = {
          ...calendarBlock,
          revision: result?.row?.revision ?? live.revision + 1,
        };
      }

      const activities = current.activities.map((candidate) => (
        candidate.id === activityId ? { ...candidate, durationMinutes } : candidate
      ));
      const targetExtensions = {
        ...(current.targetExtensions || {}),
        [activityId]: extensionCount + 1,
      };
      const nextPlan = { ...current, activities, targetExtensions, calendarBlocks };
      delete nextPlan.savedFlowId;
      await persist(nextPlan);
      logger.info('tasks.briizify', 'Activity target extended', {
        activityId,
        minutes: TARGET_EXTENSION_MINUTES,
        extensionCount: extensionCount + 1,
      });
      return true;
    } catch (extendError) {
      setActionError(extendError?.message || 'Could not extend this target.');
      logger.error('tasks.briizify', 'Could not extend activity target', {
        activityId,
        error: extendError?.message,
      });
      return false;
    } finally {
      setExtendingActivityId(null);
    }
  }, [activityTimestamp, extendingActivityId, persist]);

  const updateActivity = useCallback(async (activityId, patch) => {
    const current = planRef.current;
    const activity = current?.activities.find((candidate) => candidate.id === activityId);
    if (!current || !activity || current.pauseState) return false;

    const nextPatch = {};
    if (patch.title !== undefined) {
      const title = String(patch.title).trim().slice(0, 60);
      if (!title) {
        setActionError('An activity name cannot be empty.');
        return false;
      }
      nextPatch.title = title;
    }
    if (patch.startMinute !== undefined) {
      const startMinute = patch.startMinute === null ? Number.NaN : Number(patch.startMinute);
      if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1439) {
        setActionError('Choose a valid start time.');
        return false;
      }
      nextPatch.startMinute = startMinute;
    }
    if (patch.durationMinutes !== undefined) {
      const durationMinutes = Number(patch.durationMinutes);
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
        setActionError('Duration must be between 1 and 1440 minutes.');
        return false;
      }
      nextPatch.durationMinutes = durationMinutes;
    }
    if (!Object.keys(nextPatch).length) return false;
    if (!Object.entries(nextPatch).some(([field, value]) => activity[field] !== value)) return true;

    const nextActivities = current.activities.map((candidate) => (
      candidate.id === activityId ? { ...candidate, ...nextPatch } : candidate
    ));
    return commitActivityMutation(current, nextActivities, [activityId], {
      logMessage: 'Priorifact activity edited',
    });
  }, [commitActivityMutation]);

  const swapActivities = useCallback(async (sourceId, targetId) => {
    const current = planRef.current;
    if (!current || current.pauseState || sourceId === targetId) return false;
    const source = current.activities.find((activity) => activity.id === sourceId);
    const target = current.activities.find((activity) => activity.id === targetId);
    if (!source || !target || source.kind === 'break' || target.kind === 'break') return false;
    if (source.date !== target.date) {
      setActionError('Activities can only swap slots within the same day.');
      return false;
    }

    const dayActivities = current.activities
      .filter((activity) => activity.date === source.date)
      .sort((a, b) => a.startMinute - b.startMinute);
    const sourceIndex = dayActivities.findIndex((activity) => activity.id === sourceId);
    const targetIndex = dayActivities.findIndex((activity) => activity.id === targetId);
    const slotGaps = dayActivities.map((activity, index) => (
      index === 0
        ? 0
        : Math.max(0, activity.startMinute - (
          dayActivities[index - 1].startMinute + dayActivities[index - 1].durationMinutes
        ))
    ));
    const reordered = [...dayActivities];
    [reordered[sourceIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[sourceIndex]];

    let cursor = dayActivities[0].startMinute;
    const repacked = reordered.map((activity, index) => {
      if (index > 0) cursor += slotGaps[index];
      if (cursor > 1439) return null;
      const next = { ...activity, startMinute: cursor };
      cursor += activity.durationMinutes;
      return next;
    });
    if (repacked.some((activity) => activity === null)) {
      setActionError('Those activities do not fit before the end of the day in that order.');
      return false;
    }

    const repackedById = new Map(repacked.map((activity) => [activity.id, activity]));
    const changedIds = repacked
      .filter((activity) => activity.startMinute !== current.activities.find((item) => item.id === activity.id)?.startMinute)
      .map((activity) => activity.id);
    const nextActivities = current.activities.map((activity) => repackedById.get(activity.id) || activity);
    return commitActivityMutation(current, nextActivities, changedIds, {
      logMessage: 'Priorifact activities swapped',
    });
  }, [commitActivityMutation]);

  const addActivity = useCallback(async (date) => {
    const current = planRef.current;
    if (!current || current.pauseState) return null;
    if (current.activities.length >= MAX_PLAN_ACTIVITIES) {
      setActionError(`A priorifact can contain up to ${MAX_PLAN_ACTIVITIES} activities.`);
      return null;
    }
    const targetDate = date || current.date;
    const dayActivities = current.activities
      .filter((activity) => activity.date === targetDate)
      .sort((a, b) => a.startMinute - b.startMinute);
    const last = dayActivities[dayActivities.length - 1];
    const startMinute = last
      ? last.startMinute + last.durationMinutes + 5
      : current.window?.startMinute ?? 9 * 60;
    if (startMinute > 1409) {
      setActionError('There is no 30-minute slot left on this day.');
      return null;
    }
    const activity = {
      id: `bzfa-${Date.now()}-custom`,
      kind: 'custom',
      refId: null,
      title: 'New activity',
      date: targetDate,
      startMinute,
      durationMinutes: 30,
      prep: [],
      steps: [],
      support: [],
    };
    const saved = await commitActivityMutation(current, [...current.activities, activity], [], {
      logMessage: 'Activity added to priorifact',
    });
    return saved ? activity : null;
  }, [commitActivityMutation]);

  const togglePause = useCallback(async (activityId, currentMinute) => {
    const current = planRef.current;
    if (!current || scheduleMutationRef.current) return false;

    if (!current.pauseState) {
      const anchor = current.activities.find((activity) => activity.id === activityId);
      if (!anchor) return false;
      scheduleMutationRef.current = true;
      setScheduleStatus('working');
      setActionError(null);
      try {
        await persist({
          ...current,
          pauseState: {
            startedAt: Date.now(),
            anchorActivityId: anchor.id,
            anchorDate: anchor.date,
            anchorMinute: currentMinute,
          },
        });
        logger.info('tasks.briizify', 'Priorifact paused', { activityId: anchor.id });
        return true;
      } catch (pauseError) {
        setActionError(pauseError?.message || 'Could not pause this plan.');
        return false;
      } finally {
        scheduleMutationRef.current = false;
        setScheduleStatus('idle');
      }
    }

    const pauseState = current.pauseState;
    const anchor = current.activities.find((activity) => activity.id === pauseState.anchorActivityId);
    if (!anchor) {
      const nextPlan = { ...current };
      delete nextPlan.pauseState;
      await persist(nextPlan);
      return false;
    }
    const pausedMinutes = Math.max(1, Math.ceil((Date.now() - pauseState.startedAt) / 60000));
    const anchorAbsolute = absoluteActivityMinute(anchor);
    const wasInProgress = pauseState.anchorMinute >= anchor.startMinute
      && pauseState.anchorMinute < anchor.startMinute + anchor.durationMinutes;
    const nextActivities = current.activities.map((activity) => {
      const absoluteMinute = absoluteActivityMinute(activity);
      if (activity.id === anchor.id && wasInProgress) {
        return {
          ...activity,
          durationMinutes: Math.min(1440, activity.durationMinutes + pausedMinutes),
        };
      }
      const shouldShift = wasInProgress
        ? absoluteMinute > anchorAbsolute
        : absoluteMinute >= anchorAbsolute;
      if (!shouldShift) return activity;
      return { ...activity, ...activitySlotFromAbsolute(absoluteMinute + pausedMinutes) };
    });
    const changedIds = nextActivities
      .filter((activity, index) => (
        activity.date !== current.activities[index].date
        || activity.startMinute !== current.activities[index].startMinute
        || activity.durationMinutes !== current.activities[index].durationMinutes
      ))
      .map((activity) => activity.id);
    return commitActivityMutation(current, nextActivities, changedIds, {
      clearPause: true,
      logMessage: `Priorifact resumed after ${pausedMinutes} minutes`,
    });
  }, [commitActivityMutation, persist]);

  return {
    status,
    plan,
    question,
    error,
    generate,
    answerClarification,
    cancelRequest,
    endPlan,
    addBreak,
    removeActivity,
    addToCalendar,
    saveFlow,
    extendActivity,
    updateActivity,
    swapActivities,
    addActivity,
    togglePause,
    calendarStatus,
    saveFlowStatus,
    extendingActivityId,
    scheduleStatus,
    actionError,
    maxTargetExtensions: MAX_TARGET_EXTENSIONS,
    isWorking: status === 'thinking',
  };
}

export default useBriizify;
