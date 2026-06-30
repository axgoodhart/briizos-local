import { useEffect, useRef } from 'react';
import logger from '../lib/logger';
import { addLog, addRemoteChatMessage } from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';
import { startAgentWorkers, stopAgentWorkers } from '../lib/agentJobsFirestore';

const AGENT_WORKER_COUNT = 3;

export function useAgentWorkers(executeTool, appContext) {
  const uid = getCurrentUid();
  const executeToolRef = useRef(executeTool);
  const appContextRef = useRef(appContext);

  useEffect(() => {
    executeToolRef.current = executeTool;
  }, [executeTool]);

  useEffect(() => {
    appContextRef.current = appContext;
  }, [appContext]);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    const startWorkers = async () => {
      try {
        await startAgentWorkers({
          uid,
          workerCount: AGENT_WORKER_COUNT,
          executeTool: async (toolName, params) =>
            executeToolRef.current(toolName, params, appContextRef.current),
          onJobResult: async ({ job, result }) => {
            if (cancelled) return;
            if (job?.source?.kind !== 'chat-tool-call') return;

            const resultText = result?.summary || result?.message || JSON.stringify(result);
            addLog('tool_result', `${job.tool}: ${String(resultText)}`.slice(0, 1200))
              .catch(err => logger.debug('agent-jobs', 'Failed to write tool_result log', err?.message));

            if (job?.source?.remoteReply) {
              try {
                await addRemoteChatMessage('assistant', `[${job.tool}] ${resultText}`);
              } catch (e) {
                logger.debug('agent-jobs', 'Failed to write remote tool result', e?.message);
              }
            }
          },
          onJobError: async ({ job, error, terminal }) => {
            if (cancelled) return;
            if (!terminal) return;
            if (job?.source?.kind !== 'chat-tool-call') return;

            const msg = error?.message || String(error);
            addLog('tool_error', `${job?.tool || 'job'}: ${msg}`.slice(0, 1200))
              .catch(err => logger.debug('agent-jobs', 'Failed to write tool_error log', err?.message));
          },
        });
      } catch (error) {
        logger.error('agent-jobs', 'Failed to start autonomous workers', error?.message);
      }
    };

    startWorkers();

    return () => {
      cancelled = true;
      stopAgentWorkers(uid).catch((error) => {
        logger.debug('agent-jobs', 'Failed to stop autonomous workers', error?.message);
      });
    };
  }, [uid]);
}

export default useAgentWorkers;
