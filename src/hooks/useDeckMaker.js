/**
 * useDeckMaker — state machine for the Tasks Panel "New deck" flow.
 *
 *   idle → thinking → (clarifying → thinking …) → creating → idle
 *
 * Each round is one headless agent turn on a single `deck`-kind thread
 * (see src/lib/deckMaker.js). On success the deck lands as ONE parent
 * task + subtasks through the same logged, revision-checked write paths
 * the Tasks Panel already uses — a deck is a rendering style, not a new
 * data shape.
 *
 * Every step logs under `tasks.deck`, and both sides of the exchange are
 * appended to the thread ("all AI interactions are stored").
 */

import { useState, useRef, useCallback } from 'react';
import logger from '../lib/logger';
import {
  buildDeckPrompt,
  parseDeckResponse,
  createDeckThread,
  runDeckTurn,
  releaseDeckThread,
} from '../lib/deckMaker';
import { addSubtasks } from '../lib/localTasks';

const api = typeof window !== 'undefined' && window.api ? window.api : {};

// The ported ActionDeck rule is ONE clarifying question; allow a little
// slack, then stop rather than loop forever on an indecisive model.
const MAX_CLARIFICATIONS = 3;

export function useDeckMaker({ onDeckCreated } = {}) {
  const [status, setStatus] = useState('idle'); // idle | thinking | clarifying | creating
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);

  const goalRef = useRef(null);
  const threadRef = useRef(null);
  const clarifyCountRef = useRef(0);

  const finishThread = useCallback(() => {
    if (threadRef.current) {
      releaseDeckThread(threadRef.current);
      threadRef.current = null;
    }
  }, []);

  const resetRefs = useCallback(() => {
    goalRef.current = null;
    clarifyCountRef.current = 0;
  }, []);

  const runRound = useCallback(async (userText, { isAnswer = false } = {}) => {
    setStatus('thinking');
    setError(null);
    setQuestion(null);

    try {
      if (!threadRef.current) threadRef.current = await createDeckThread();
      const threadId = threadRef.current;

      await api.localData.threads.messages.append(threadId, { role: 'user', content: userText });
      const prompt = buildDeckPrompt(goalRef.current, isAnswer ? userText : null);
      const text = await runDeckTurn(threadId, prompt);
      await api.localData.threads.messages.append(threadId, { role: 'assistant', content: text });

      const parsed = parseDeckResponse(text);

      if (!parsed.isDone) {
        clarifyCountRef.current += 1;
        if (clarifyCountRef.current > MAX_CLARIFICATIONS) {
          throw new Error('The AI kept asking questions instead of building the deck. Try a more specific goal.');
        }
        logger.info('tasks.deck', 'Clarifying question asked', { question: parsed.clarifyingQuestion });
        setQuestion(parsed.clarifyingQuestion);
        setStatus('clarifying');
        return null;
      }

      setStatus('creating');
      const deckTitle = parsed.deckTitle || goalRef.current;
      const created = await api.localData.tasks.create({
        title: deckTitle,
        description: deckTitle === goalRef.current ? '' : `Deck goal: ${goalRef.current}`,
        status: 'pending',
        priority: 'normal',
      });
      const parentId = created.row.id;
      await addSubtasks(parentId, parsed.tasks.map((title) => ({ title })));
      logger.info('tasks.deck', `Deck created: "${deckTitle}"`, {
        taskId: parentId,
        steps: parsed.tasks.length,
      });

      finishThread();
      resetRefs();
      setStatus('idle');
      onDeckCreated?.(parentId);
      return parentId;
    } catch (err) {
      logger.error('tasks.deck', 'Deck creation failed', { error: err?.message });
      setError(err?.message || 'Deck creation failed');
      setStatus('idle');
      finishThread();
      resetRefs();
      return null;
    }
  }, [finishThread, resetRefs, onDeckCreated]);

  const startDeck = useCallback(async (goal) => {
    const trimmed = String(goal || '').trim();
    if (!trimmed || status !== 'idle') return null;
    goalRef.current = trimmed;
    clarifyCountRef.current = 0;
    logger.info('tasks.deck', 'Deck requested', { goal: trimmed });
    return runRound(trimmed);
  }, [runRound, status]);

  const answerClarification = useCallback(async (answer) => {
    const trimmed = String(answer || '').trim();
    if (!trimmed || status !== 'clarifying') return null;
    logger.info('tasks.deck', 'Clarification answered', { answer: trimmed });
    return runRound(trimmed, { isAnswer: true });
  }, [runRound, status]);

  const cancelDeck = useCallback(() => {
    logger.info('tasks.deck', 'Deck request cancelled');
    finishThread();
    resetRefs();
    setStatus('idle');
    setQuestion(null);
    setError(null);
  }, [finishThread, resetRefs]);

  return {
    status,
    question,
    error,
    startDeck,
    answerClarification,
    cancelDeck,
    isWorking: status === 'thinking' || status === 'creating',
  };
}

export default useDeckMaker;
