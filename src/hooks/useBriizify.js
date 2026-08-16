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

// Same spirit as the deck maker's rule: ask once, allow a little
// slack, then stop rather than loop on an indecisive model.
const MAX_CLARIFICATIONS = 2;

export function useBriizify() {
  const [status, setStatus] = useState('loading'); // loading | idle | thinking | clarifying | ready
  const [plan, setPlan] = useState(null);
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);

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
    isWorking: status === 'thinking',
  };
}

export default useBriizify;
