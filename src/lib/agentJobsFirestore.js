import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, ensureAuth, getCurrentUid } from './firebase';
import logger from './logger';

const COLLECTIONS = {
  jobs: 'desktopAgentJobs',
  workers: 'desktopAgentWorkers',
  toolOps: 'desktopAgentToolOps',
  events: 'desktopAgentEvents',
};

const DEFAULTS = {
  workerCount: 3,
  leaseMs: 45000,
  pollMs: 1500,
  heartbeatMs: 4000,
  maxRetries: 3,
};

const activeRunners = new Map();

function nowMs() {
  return Date.now();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeValue(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = sanitizeValue(v);
    }
    return out;
  }
  return value;
}

function getUserRefs(uid) {
  const userDoc = doc(db, 'users', uid);
  return {
    jobsCol: collection(userDoc, COLLECTIONS.jobs),
    workersCol: collection(userDoc, COLLECTIONS.workers),
    eventsCol: collection(userDoc, COLLECTIONS.events),
    toolOpDoc: (opId) => doc(userDoc, COLLECTIONS.toolOps, opId),
    jobDoc: (jobId) => doc(userDoc, COLLECTIONS.jobs, jobId),
    workerDoc: (workerId) => doc(userDoc, COLLECTIONS.workers, workerId),
  };
}

async function resolveUid(optionalUid) {
  if (optionalUid) return optionalUid;
  const current = getCurrentUid();
  if (current) return current;
  const user = await ensureAuth();
  return user?.uid || null;
}

async function addEvent(uid, type, payload = {}) {
  try {
    const { eventsCol } = getUserRefs(uid);
    await addDoc(eventsCol, {
      type,
      payload: sanitizeValue(payload),
      createdAt: nowMs(),
      createdAtServer: serverTimestamp(),
    });
  } catch (error) {
    logger.debug('agent-jobs', `Failed to write event (${type})`, error?.message);
  }
}

async function claimNextJob(uid, workerId, leaseMs) {
  const { jobsCol, jobDoc } = getUserRefs(uid);
  const now = nowMs();

  const [pendingSnap, runningSnap] = await Promise.all([
    getDocs(query(jobsCol, where('status', '==', 'pending'), limit(25))),
    getDocs(query(jobsCol, where('status', '==', 'running'), limit(25))),
  ]);

  const candidates = [];
  pendingSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if ((data.nextRunAt || 0) <= now) {
      candidates.push({
        id: docSnap.id,
        score: data.nextRunAt || data.createdAt || 0,
      });
    }
  });

  runningSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if ((data.leaseUntil || 0) <= now) {
      candidates.push({
        id: docSnap.id,
        score: data.leaseUntil || data.createdAt || 0,
      });
    }
  });

  candidates.sort((a, b) => a.score - b.score);

  for (const candidate of candidates) {
    try {
      const claimed = await runTransaction(db, async (tx) => {
        const ref = jobDoc(candidate.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return null;
        const data = snap.data();
        const t = nowMs();
        const isPending = data.status === 'pending' && (data.nextRunAt || 0) <= t;
        const isExpiredLease = data.status === 'running' && (data.leaseUntil || 0) <= t;
        if (!isPending && !isExpiredLease) return null;

        const leaseUntil = t + leaseMs;
        tx.update(ref, {
          status: 'running',
          workerId,
          leaseUntil,
          startedAt: data.startedAt || t,
          updatedAt: t,
          updatedAtServer: serverTimestamp(),
        });

        return {
          id: snap.id,
          ...data,
          status: 'running',
          workerId,
          leaseUntil,
        };
      });

      if (claimed) return claimed;
    } catch (error) {
      logger.debug('agent-jobs', 'Claim race lost, trying next candidate', error?.message);
    }
  }

  return null;
}

async function updateHeartbeat(uid, workerId, state, currentJobId = null) {
  const { workerDoc } = getUserRefs(uid);
  await setDoc(workerDoc(workerId), {
    workerId,
    state,
    currentJobId,
    lastSeenAt: nowMs(),
    lastSeenAtServer: serverTimestamp(),
  }, { merge: true });
}

async function executeWithIdempotency(uid, job, executeTool) {
  if (!executeTool) {
    throw new Error('No executeTool callback configured for agent worker');
  }
  if (job.type && job.type !== 'tool') {
    throw new Error(`Unsupported job type: ${job.type || 'unknown'}`);
  }
  if (!job.tool) {
    throw new Error('Missing job tool');
  }

  const { toolOpDoc } = getUserRefs(uid);
  const opId = job.opId || `op_${job.id}`;
  const opRef = toolOpDoc(opId);
  const existing = await getDoc(opRef);
  if (existing.exists()) {
    const op = existing.data();
    if (op.status === 'done') {
      return {
        result: op.result || { success: true, message: 'Reused previous result.' },
        deduped: true,
        opId,
      };
    }
  }

  await setDoc(opRef, {
    opId,
    jobId: job.id,
    tool: job.tool,
    status: 'running',
    startedAt: nowMs(),
    startedAtServer: serverTimestamp(),
  }, { merge: true });

  try {
    const params = {
      ...(job.params || {}),
      opId,
      __agentAuto: true,
    };
    const result = await executeTool(job.tool, params);
    await setDoc(opRef, {
      status: 'done',
      completedAt: nowMs(),
      completedAtServer: serverTimestamp(),
      result: sanitizeValue(result),
    }, { merge: true });
    return { result, deduped: false, opId };
  } catch (error) {
    await setDoc(opRef, {
      status: 'failed',
      completedAt: nowMs(),
      completedAtServer: serverTimestamp(),
      error: error?.message || String(error),
    }, { merge: true });
    throw error;
  }
}

async function finalizeJobSuccess(uid, workerId, job, result, deduped) {
  const { jobDoc } = getUserRefs(uid);
  await setDoc(jobDoc(job.id), {
    status: 'done',
    workerId,
    leaseUntil: 0,
    finishedAt: nowMs(),
    updatedAt: nowMs(),
    updatedAtServer: serverTimestamp(),
    deduped: !!deduped,
    result: sanitizeValue(result),
  }, { merge: true });
}

async function finalizeJobFailure(uid, workerId, job, error) {
  const { jobDoc } = getUserRefs(uid);
  const nextRetry = (job.retryCount || 0) + 1;
  const maxRetries = job.maxRetries ?? DEFAULTS.maxRetries;
  const shouldRetry = nextRetry <= maxRetries;
  const retryDelay = Math.min(60000, 1000 * (2 ** Math.min(nextRetry, 6)));
  const nextRunAt = nowMs() + retryDelay;

  await setDoc(jobDoc(job.id), {
    status: shouldRetry ? 'pending' : 'failed',
    workerId,
    leaseUntil: 0,
    retryCount: nextRetry,
    nextRunAt: shouldRetry ? nextRunAt : null,
    updatedAt: nowMs(),
    updatedAtServer: serverTimestamp(),
    lastError: error?.message || String(error),
  }, { merge: true });

  return { shouldRetry, nextRetry, maxRetries };
}

export async function enqueueToolJob(tool, params = {}, options = {}) {
  const uid = await resolveUid(options.uid);
  if (!uid) {
    throw new Error('Cannot enqueue job: user is not authenticated');
  }

  const { jobDoc } = getUserRefs(uid);
  const jobId = options.jobId || generateId('job');
  const opId = options.opId || `op_${jobId}`;
  const now = nowMs();
  const job = {
    id: jobId,
    type: 'tool',
    tool,
    params: sanitizeValue(params),
    opId,
    status: 'pending',
    workerId: null,
    leaseUntil: 0,
    retryCount: 0,
    maxRetries: options.maxRetries ?? DEFAULTS.maxRetries,
    nextRunAt: options.nextRunAt ?? now,
    createdAt: now,
    updatedAt: now,
    source: sanitizeValue(options.source || { type: 'manual' }),
  };

  await setDoc(jobDoc(jobId), {
    ...job,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  }, { merge: false });
  await addEvent(uid, 'job_enqueued', { jobId, tool, opId, source: job.source });
  return job;
}

export async function startAgentWorkers(options = {}) {
  const uid = await resolveUid(options.uid);
  if (!uid) {
    throw new Error('Cannot start workers: user is not authenticated');
  }

  if (activeRunners.has(uid)) {
    return activeRunners.get(uid);
  }

  const workerCount = Math.max(1, options.workerCount || DEFAULTS.workerCount);
  const leaseMs = Math.max(5000, options.leaseMs || DEFAULTS.leaseMs);
  const pollMs = Math.max(400, options.pollMs || DEFAULTS.pollMs);
  const heartbeatMs = Math.max(1000, options.heartbeatMs || DEFAULTS.heartbeatMs);
  const executeTool = options.executeTool;
  const onJobResult = options.onJobResult;
  const onJobError = options.onJobError;
  const runnerId = generateId('runner');

  const runner = {
    uid,
    runnerId,
    stopRequested: false,
    workerIds: [],
    workers: [],
  };
  activeRunners.set(uid, runner);

  logger.info('agent-jobs', 'Starting worker pool', { uid, workerCount, runnerId });
  await addEvent(uid, 'workers_started', { runnerId, workerCount });

  for (let index = 0; index < workerCount; index++) {
    const workerId = `${runnerId}_w${index + 1}`;
    runner.workerIds.push(workerId);
    const workerPromise = (async () => {
      let nextHeartbeat = 0;
      while (!runner.stopRequested) {
        try {
          const now = nowMs();
          if (now >= nextHeartbeat) {
            await updateHeartbeat(uid, workerId, 'idle', null);
            nextHeartbeat = now + heartbeatMs;
          }

          const job = await claimNextJob(uid, workerId, leaseMs);
          if (!job) {
            await sleep(pollMs);
            continue;
          }

          await updateHeartbeat(uid, workerId, 'running', job.id);
          await addEvent(uid, 'job_claimed', { workerId, jobId: job.id, tool: job.tool });

          try {
            const execution = await executeWithIdempotency(uid, job, executeTool);
            await finalizeJobSuccess(uid, workerId, job, execution.result, execution.deduped);
            await addEvent(uid, 'job_done', {
              workerId,
              jobId: job.id,
              tool: job.tool,
              deduped: execution.deduped,
            });
            if (onJobResult) {
              try {
                await onJobResult({
                  workerId,
                  job,
                  result: execution.result,
                  deduped: execution.deduped,
                });
              } catch (callbackError) {
                logger.warn('agent-jobs', 'onJobResult callback failed', callbackError?.message);
              }
            }
          } catch (error) {
            const retryState = await finalizeJobFailure(uid, workerId, job, error);
            await addEvent(uid, retryState.shouldRetry ? 'job_retry' : 'job_failed', {
              workerId,
              jobId: job.id,
              tool: job.tool,
              error: error?.message || String(error),
              retryCount: retryState.nextRetry,
              maxRetries: retryState.maxRetries,
            });
            if (onJobError) {
              try {
                await onJobError({
                  workerId,
                  job,
                  error,
                  terminal: !retryState.shouldRetry,
                  retryCount: retryState.nextRetry,
                  maxRetries: retryState.maxRetries,
                });
              } catch (callbackError) {
                logger.warn('agent-jobs', 'onJobError callback failed', callbackError?.message);
              }
            }
          }
        } catch (loopError) {
          logger.error('agent-jobs', `Worker loop error (${workerId})`, loopError?.message);
          await sleep(pollMs);
        } finally {
          await updateHeartbeat(uid, workerId, 'idle', null).catch(() => {});
        }
      }

      await updateHeartbeat(uid, workerId, 'stopped', null);
    })();

    runner.workers.push(workerPromise);
  }

  return runner;
}

export async function stopAgentWorkers(uidArg = null) {
  const uid = uidArg || getCurrentUid();
  if (!uid) return;
  const runner = activeRunners.get(uid);
  if (!runner) return;

  runner.stopRequested = true;
  await Promise.allSettled(runner.workers);
  activeRunners.delete(uid);
  logger.info('agent-jobs', 'Stopped worker pool', { uid, runnerId: runner.runnerId });
  await addEvent(uid, 'workers_stopped', { runnerId: runner.runnerId });
}

export function isAgentWorkersRunning(uidArg = null) {
  const uid = uidArg || getCurrentUid();
  if (!uid) return false;
  return activeRunners.has(uid);
}
