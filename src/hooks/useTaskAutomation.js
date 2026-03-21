/**
 * useTaskAutomation Hook — STUBBED
 *
 * Previously subscribed to Firestore automated tasks via onSnapshot,
 * which triggered processTask() on every doc change — including our own
 * writes — creating an infinite loop.
 *
 * FUTURE: Follow useChat.js streaming pattern:
 * 1. automateTask() creates a thread + starts streaming via langgraphStreamMessage
 * 2. Agent orchestrates breakdown/resume/verify (not JS frontend)
 * 3. Stream events drive taskLog writes (like chat → activity log)
 * 4. No Firestore subscription triggers agent calls
 * 5. Use tool_confirmation_mode: 'no-asking' for headless execution
 *
 * Reference: src/hooks/useChat.js (streaming), agent/src/tools/builtins/task_tool.py
 * Archive: src/_archive/task-automation/useTaskAutomation.js
 */

import { useEffect } from 'react';
import logger from '../lib/logger';

export function useTaskAutomation() {
  useEffect(() => {
    logger.info('task-automation', 'Task automation mounted (engine stubbed)');
  }, []);
}

export default useTaskAutomation;
