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
  const [actionError, setActionError] = useState(null);

  const threadRef = useRef(null);
  const requestRef = useRef(null);
  const clarifyCountRef = useRef(0);
  const planRef = useRef(null);

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
    if (!current) return;
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
    await persist({ ...current, activities });
  }, [persist]);

  const removeActivity = useCallback(async (activityId) => {
    const current = planRef.current;
    if (!current) return;
    const activities = current.activities.filter((activity) => activity.id !== activityId);
    if (!activities.some((activity) => activity.kind !== 'break')) {
      await persist(null);
      return;
    }
    await persist({ ...current, activities });
  }, [persist]);

  const activityTimestamp = useCallback((activity) => {
    const [year, month, day] = String(activity.date).split('-').map(Number);
    return new Date(year, month - 1, day).getTime() + activity.startMinute * 60000;
  }, []);

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
    if (!current || !activity || extensionCount >= MAX_TARGET_EXTENSIONS || extendingActivityId) return false;

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
      await persist({ ...current, activities, targetExtensions, calendarBlocks });
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
    calendarStatus,
    saveFlowStatus,
    extendingActivityId,
    actionError,
    maxTargetExtensions: MAX_TARGET_EXTENSIONS,
    isWorking: status === 'thinking',
  };
}

export default useBriizify;
