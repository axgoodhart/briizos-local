/**
 * useChat — the single chat execution path.
 *
 * ARCHITECTURE (one path, in-process):
 *
 *   InteractionPanel.sendMessage
 *     → useChat.sendMessage
 *       → window.api.langgraphStreamMessage(streamId, threadId, msg, config)   [IPC]
 *         → electron/main.js → electron/agent (in-process LangGraph.js)
 *           → lead_agent graph runs inside Electron main; tools call the
 *             renderer registry directly via IPC (no HTTP, no port 2025):
 *             agent → bridge → useToolBridge → ToolContext.executeTool →
 *             src/lib/tools.js handlers (Electron-trusted fs/terminal/UI)
 *     ← Streamed events pushed back on the 'langgraph-stream-event' channel
 *       (text / tool_call_start / tool_result / tool_confirmation /
 *        clarification / thread_title / end / error)
 *
 * There is intentionally NO direct-to-provider streaming, NO renderer-side
 * system prompt, and NO renderer-side tool catalog. The in-process agent
 * owns the system prompt, the tool set, memory, and tool confirmation.
 *
 * Confirmation and clarification pause the graph via LangGraph interrupt
 * and resume through langgraphResumeRun. Tool execution still passes through
 * ToolContext.executeTool, keyed by __briizosThreadId.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import logger, { setActiveThread } from '../lib/logger';
import {
  registerSurfaceForThread,
  registerThreadSurface,
  unregisterThread,
  restrictivePolicy,
  permissionPoliciesEqual,
} from '../lib/agentSurfaces';

const api = typeof window !== 'undefined' && window.api ? window.api : {};
const hasApi = typeof window !== 'undefined' && !!window.api;

function describePermissionMode(mode) {
  if (mode === 'no-asking') return 'run allowed tool actions without asking first';
  if (mode === 'ask-destructive') return 'ask before tool actions that could cause damage';
  return 'ask before every tool action';
}

const MODALITY_SKILL_MAP = {
  chat: null,
  prioritize: 'prioritizer',
  planner: 'day-planner',
  research: 'deep-research',
  code: 'frontend-design',
  report: 'consulting-analysis',
  plan: null,
};

const FILE_CONTEXT_TOOL_CAPABILITIES = [
  '- `read_file(path)`: Read file contents (subject to blacklist rules).',
  '- `ls(path)`: List directory contents (subject to blacklist rules).',
  '- `write_file(path, content, opId?)`: Create/overwrite files.',
  '- `str_replace(path, old_str, new_str, opId?)`: Replace one exact string occurrence.',
  '- `copy_file(source, destination, opId?)`: Copy files or folders.',
  '- `move_file(source, destination, opId?)`: Move/rename files.',
  '- `delete_file(path, opId?)`: Delete files or folders.',
  '- `bash(command, cwd?, opId?)`: Run shell commands when needed.'
];

function buildFileContextAddendum(files = []) {
  if (!Array.isArray(files) || files.length === 0) return '';
  const lines = files
    .map((file) => file?.path)
    .filter(Boolean)
    .map((filePath) => `- ${filePath}`);
  if (lines.length === 0) return '';

  return [
    '',
    '---',
    '<uploaded_files>',
    'The following files were uploaded or pinned in this message:',
    '',
    ...lines,
    '',
    'You can read these files using the `read_file` tool with the paths shown above.',
    'Use `view_image` for jpg, jpeg, png, or webp files when visual inspection is needed.',
    '</uploaded_files>',
    '',
    'Capabilities available for working with these paths (tools):',
    ...FILE_CONTEXT_TOOL_CAPABILITIES,
    '',
    'Prefer direct path-based tool calls when the user asks to inspect or modify pinned files.'
  ].join('\n');
}

function threadKindForModality(modality) {
  return ['prioritize', 'planner'].includes(modality) ? modality : 'chat';
}

function candidateForPrompt(candidate) {
  if (candidate?.kind === 'project') {
    return {
      type: 'forest_project',
      id: candidate.id,
      name: candidate.name,
      deadline: candidate.deadline || null,
      importance: candidate.importance ?? null,
      size_hours: candidate.size ?? null,
      relevance: candidate.relevance || null,
      tags: Array.isArray(candidate.tags) ? candidate.tags : [],
      milestones: Array.isArray(candidate.milestones) ? candidate.milestones : [],
    };
  }
  return {
    type: 'task',
    id: candidate?.id,
    title: candidate?.title || '',
    description: candidate?.description || '',
    status: candidate?.status || 'pending',
    priority: candidate?.priority || 'normal',
    due_at: candidate?.dueAt || candidate?.due_at || null,
    project_id: candidate?.projectId || candidate?.project_id || null,
    forest_project_id: candidate?.forestProjectId || candidate?.forest_project_id || null,
    subtasks: Array.isArray(candidate?.subtasks)
      ? candidate.subtasks.map((step) => ({ title: step.title, status: step.status }))
      : [],
  };
}

function buildPrioritizeAddendum(candidates = []) {
  const selected = Array.isArray(candidates) ? candidates.filter((candidate) => candidate?.id) : [];
  if (!selected.length) {
    return [
      '',
      '---',
      '<prioritization_candidates source="self-serve">',
      'No candidates were pinned in the picker. Fetch open Forest projects and Tasks Panel tasks with the briizOS read tools, then prioritize the relevant active work.',
      '</prioritization_candidates>',
    ].join('\n');
  }
  return [
    '',
    '---',
    '<prioritization_candidates source="picker">',
    'Prioritize exactly these user-selected candidates:',
    ...selected.map((candidate) => JSON.stringify(candidateForPrompt(candidate))),
    '</prioritization_candidates>',
  ].join('\n');
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat({ selectedModel, requestSettings } = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [tokenUsage, setTokenUsage] = useState(null);
  const [filesInContext, setFilesInContext] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [toolCalls, setToolCalls] = useState([]);
  const [pendingToolConfirmation, setPendingToolConfirmation] = useState(null);
  const [pendingClarification, setPendingClarification] = useState(null);
  const [threadTitle, setThreadTitle] = useState(null);
  const threadTitleRef = useRef(null);
  const [modality, setModalityState] = useState('chat');
  const [isSwitchingThread, setIsSwitchingThread] = useState(true);
  const [subAgentTasks, setSubAgentTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const suggestionsHydratedRef = useRef(false);

  // Streaming/session refs (stable across renders).
  const streamContentRef = useRef('');
  const toolCallsRef = useRef([]);
  const subAgentTasksRef = useRef([]);
  const selectedModelRef = useRef(selectedModel || null);
  const requestSettingsRef = useRef(requestSettings || {});
  const suggestionsEnabledRef = useRef(suggestionsEnabled);
  const modalityRef = useRef(modality);
  const activeThreadKindRef = useRef('chat');

  // One LangGraph thread per chat session (multi-turn context lives in the
  // agent's checkpointer, keyed by this thread_id).
  const threadIdRef = useRef(null);
  // The streamId currently being consumed — used to filter the shared
  // 'langgraph-stream-event' subscription so stale streams are ignored.
  const activeStreamIdRef = useRef(null);
  const activeActivityIdRef = useRef(null);
  // Confirmation bookkeeping so approve/reject can resume the right run.
  const pendingConfirmRef = useRef(null);
  const pendingClarificationRef = useRef(null);
  // Effective permission policy for the chat surface (resolved at thread
  // creation). Drives permission_policy on every run so the agent runtime
  // and renderer gate agree.
  const chatPolicyRef = useRef(restrictivePolicy('chat'));

  useEffect(() => { selectedModelRef.current = selectedModel || null; }, [selectedModel]);
  useEffect(() => { requestSettingsRef.current = requestSettings || {}; }, [requestSettings]);
  useEffect(() => { modalityRef.current = modality; }, [modality]);

  useEffect(() => {
    suggestionsEnabledRef.current = suggestionsEnabled;
    if (!suggestionsEnabled) setSuggestions([]);
    if (suggestionsHydratedRef.current) {
      api.localData?.settings?.set('suggestions_enabled', suggestionsEnabled)
        .catch((error) => logger.warn('config', 'Failed to save suggestion preference', error?.message));
    }
  }, [suggestionsEnabled]);

  useEffect(() => {
    api.localData?.settings?.get('suggestions_enabled')
      .then((saved) => {
        if (typeof saved?.value === 'boolean') setSuggestionsEnabled(saved.value);
      })
      .catch((error) => logger.warn('config', 'Failed to load suggestion preference', error?.message))
      .finally(() => { suggestionsHydratedRef.current = true; });
  }, []);

  const desiredThreadKind = threadKindForModality(modality);

  useEffect(() => {
    let active = true;
    activeThreadKindRef.current = desiredThreadKind;
    threadIdRef.current = null;
    setActiveThread(null);
    setIsSwitchingThread(true);
    setMessages([]);
    setSuggestions([]);
    setThreadTitle(null);
    threadTitleRef.current = null;
    chatPolicyRef.current = restrictivePolicy('chat');

    const loadLatestThread = async () => {
      const threads = await api.localData.threads.list({ kind: desiredThreadKind, limit: 1 });
      if (!active || !threads.length) return;
      const thread = threads[0];
      const nextMessages = await api.localData.threads.messages.list(thread.id);
      if (!active) return;
      threadIdRef.current = thread.id;
      setActiveThread(thread.id);
      threadTitleRef.current = thread.title || null;
      setThreadTitle(thread.title || null);
      setMessages(nextMessages);
      try {
        chatPolicyRef.current = await registerSurfaceForThread(thread.id, 'chat');
      } catch {
        chatPolicyRef.current = restrictivePolicy('chat');
      }
    };

    loadLatestThread()
      .catch((error) => logger.error('chat', `Failed to load ${desiredThreadKind} history`, { error: error?.message }))
      .finally(() => {
        if (active) setIsSwitchingThread(false);
      });
    return () => { active = false; };
  }, [desiredThreadKind]);

  useEffect(() => {
    let active = true;
    let policyRefreshGeneration = 0;
    const unsubscribe = api.localData.onChanged((change) => {
      const threadId = threadIdRef.current;
      if (!threadId) return;

      if (change?.domains?.includes('threads')) {
        api.localData.threads.messages.list(threadId).then((next) => {
          if (active) setMessages(next);
        }).catch(() => {});
      }

      const settingKeys = change?.settingKeys;
      const permissionsMayHaveChanged = change?.domains?.includes('settings')
        && (!Array.isArray(settingKeys) || settingKeys.includes('agent_config'));
      if (permissionsMayHaveChanged) {
        const generation = ++policyRefreshGeneration;
        const previousPolicy = chatPolicyRef.current || restrictivePolicy('chat');
        const failClosedPolicy = restrictivePolicy('chat');
        const activityId = `settings:${change?.revision || 'unknown'}:agent_config`;

        // Close the brief async settings-read gap as well as the failure
        // path: neither the run config nor renderer gate keeps stale rules.
        chatPolicyRef.current = failClosedPolicy;
        registerThreadSurface(threadId, failClosedPolicy, { logChange: false });

        registerSurfaceForThread(threadId, 'chat', null, { logChange: false, activityId })
          .then((policy) => {
            if (!active || threadIdRef.current !== threadId) {
              registerThreadSurface(threadId, failClosedPolicy, { logChange: false });
              return;
            }
            if (generation !== policyRefreshGeneration) {
              registerThreadSurface(threadId, chatPolicyRef.current || failClosedPolicy, { logChange: false });
              return;
            }

            chatPolicyRef.current = policy || failClosedPolicy;
            if (!permissionPoliciesEqual(previousPolicy, chatPolicyRef.current)) {
              logger.info(
                'permissions.chat',
                `Chat permission settings changed. This open conversation will now ${describePermissionMode(chatPolicyRef.current.mode)}.`,
                {
                  threadId,
                  previousMode: previousPolicy.mode,
                  effectiveMode: chatPolicyRef.current.mode,
                },
                { activityId, outcome: 'applied' },
              );
            }
          })
          .catch((error) => {
            if (!active || generation !== policyRefreshGeneration) return;
            if (threadIdRef.current !== threadId) {
              registerThreadSurface(threadId, failClosedPolicy, { logChange: false });
              return;
            }
            chatPolicyRef.current = failClosedPolicy;
            registerThreadSurface(threadId, failClosedPolicy, { logChange: false });
            logger.error(
              'permissions.chat',
              'Chat permission settings changed, but briizOS could not load the new rule. This open conversation will ask before every tool action for safety.',
              { threadId, error: error?.message },
              { activityId, outcome: 'failed' },
            );
          });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setModality = useCallback((nextModality) => {
    if (!nextModality || nextModality === modalityRef.current) return;
    if (isLoading || pendingConfirmRef.current || pendingClarificationRef.current) return;
    modalityRef.current = nextModality;
    setModalityState(nextModality);
  }, [isLoading]);

  // ---------------------------------------------------------------------
  // Backend status → isConfigured (agent reachable, not "API keys set").
  // ---------------------------------------------------------------------
  const checkConfig = useCallback(async () => {
    if (!hasApi || typeof api.langgraphGetStatus !== 'function') {
      setIsConfigured(true);
      return;
    }
    try {
      const status = await api.langgraphGetStatus();
      // Surface backend state in the LogPanel (not just the terminal) so
      // "is the agent up?" is answerable from inside the app.
      // Don't hard-block the UI while the backend is still booting; only
      // flag "not configured" on a definitive failed/env_missing state.
      const blocked = status?.status === 'env_missing' || status?.status === 'failed';
      const reportedState = status?.status || 'unknown';
      const evidence = {
        reportedState,
        reportedAcceptingRequests: status?.ready,
        port: status?.port,
        pid: status?.pid,
        chatBlocked: blocked,
      };
      if (blocked) {
        logger.error(
          'agent.backend',
          `The AI request service reported "${reportedState}", so it cannot answer messages until that problem is fixed.`,
          evidence,
        );
      } else {
        logger.info(
          'agent.backend',
          `The AI request service completed its startup check with "${reportedState}". Chat stays available; each message will report whether its own AI request succeeds.`,
          evidence,
        );
      }
      setIsConfigured(!blocked);
    } catch (error) {
      logger.error(
        'agent.status',
        'briizOS could not complete the AI service startup check. Chat stays available, and each message will report its own request failure if the service cannot answer.',
        { error: error?.message },
      );
      setIsConfigured(true);
    }
  }, []);

  const loadSelectedFiles = useCallback(async () => {
    try {
      const files = await api.localData.selectedFiles.list('chat');
      const normalized = files.map((file) => ({ id: file.id, name: file.display_name, path: file.path }));
      setFilesInContext(normalized);
      return normalized;
    } catch (error) {
      logger.error('chat', 'Failed to load selected files', { error: error?.message });
      return [];
    }
  }, []);

  useEffect(() => {
    checkConfig();
    loadSelectedFiles();
  }, [checkConfig, loadSelectedFiles]);

  const getSelectedModel = useCallback(() => {
    const fromProp = selectedModelRef.current;
    if (fromProp) return fromProp;
    return null;
  }, []);

  const logTurn = useCallback((level, type, message, data, options = {}) => {
    const method = typeof logger[level] === 'function' ? logger[level] : logger.info;
    return method(type, message, data, {
      ...options,
      activityId: activeActivityIdRef.current,
    });
  }, []);

  // ---------------------------------------------------------------------
  // Single SSE event handler. Mutates refs then mirrors into state so the
  // UI contract (streamingContent / toolCalls / subAgentTasks / etc.)
  // is preserved exactly as before.
  // ---------------------------------------------------------------------
  const handleStreamEvent = useCallback((type, payload = {}) => {
    switch (type) {
      case 'text': {
        if (payload.content) {
          streamContentRef.current += payload.content;
          setStreamingContent(streamContentRef.current);
        }
        break;
      }
      case 'tool_call_start': {
        const tc = {
          id: payload.id || newId('tc'),
          name: payload.name,
          args: payload.args || {},
          status: 'running',
        };
        toolCallsRef.current = [...toolCallsRef.current, tc];
        setToolCalls([...toolCallsRef.current]);
        logTurn(
          'info',
          'tool.call',
          `The AI workflow reached the “${payload.name}” tool step. This records the start only; a later entry will report the returned result or failure.`,
          { toolCallId: tc.id, tool: payload.name, requestedArguments: tc.args, completedByThisEntry: false },
        );
        break;
      }
      case 'tool_result': {
        toolCallsRef.current = toolCallsRef.current.map((t) => {
          const match = (payload.tool_call_id && t.id === payload.tool_call_id)
            || (!payload.tool_call_id && t.name === payload.name && t.status === 'running');
          return match ? { ...t, status: 'done', result: payload.content } : t;
        });
        setToolCalls([...toolCallsRef.current]);
        logTurn(
          'info',
          'tool.result',
          `The “${payload.name || 'requested'}” tool returned a result to the AI workflow.`,
          {
            toolCallId: payload.tool_call_id || null,
            tool: payload.name || null,
            result: payload.content,
            effect: 'The AI can now use this result while composing its response.',
          },
        );
        break;
      }
      case 'tool_confirmation': {
        const conf = {
          summary: payload.summary || payload.tool_name,
          tool_name: payload.tool_name,
          tool_call_id: payload.tool_call_id,
          args: payload.args || {},
        };
        pendingConfirmRef.current = conf;
        setPendingToolConfirmation(conf);
        logTurn(
          'info',
          'agent.confirm',
          `The AI asked to use ${conf.tool_name}. No tool action will run until you approve or reject the request shown in the interaction panel.`,
          { tool: conf.tool_name, summary: conf.summary, args: conf.args },
        );
        break;
      }
      case 'clarification': {
        const clarification = {
          question: payload.question,
          clarification_type: payload.clarification_type || 'missing_info',
          context: payload.context || null,
          options: payload.options || [],
          message: payload.message || payload.question,
        };
        pendingClarificationRef.current = clarification;
        setPendingClarification(clarification);
        if (clarification.message) {
          streamContentRef.current += streamContentRef.current
            ? `\n\n${clarification.message}`
            : clarification.message;
          setStreamingContent(streamContentRef.current);
        }
        logTurn(
          'info',
          'agent.clarify',
          `The AI needs more information before it can continue. Its question was added to the conversation: ${clarification.question || 'No question text was provided.'}`,
          { question: clarification.question, options: clarification.options },
        );
        break;
      }
      case 'thread_title': {
        if (payload.title) {
          const titleChanged = threadTitleRef.current !== payload.title;
          threadTitleRef.current = payload.title;
          setThreadTitle((prev) => prev || payload.title);
          if (titleChanged && threadIdRef.current) api.localData.threads.update(threadIdRef.current, { title: payload.title }).catch(() => {});
        }
        break;
      }
      case 'values': {
        if (payload?.title) {
          const titleChanged = threadTitleRef.current !== payload.title;
          threadTitleRef.current = payload.title;
          setThreadTitle((prev) => prev || payload.title);
          if (titleChanged && threadIdRef.current) api.localData.threads.update(threadIdRef.current, { title: payload.title }).catch(() => {});
        }
        break;
      }
      case 'error': {
        streamContentRef.current += `\n\n[Agent error] ${payload?.message || 'Unknown error'}`;
        setStreamingContent(streamContentRef.current);
        logTurn(
          'error',
          'agent.stream',
          `The AI service reported an error while sending its response. The error text was added to the visible response: ${payload?.message || 'Unknown error'}`,
          { error: payload?.message },
        );
        break;
      }
      case 'end':
        break;
      default: {
        // DeerFlow sub-agent lifecycle events: task_started / task_progress /
        // task_completed / task_failed / task_timeout.
        if (typeof type === 'string' && type.startsWith('task_')) {
          const id = payload.task_id || payload.id || payload.name || newId('sa');
          const existing = subAgentTasksRef.current.find((t) => t.id === id);
          const base = existing || {
            id,
            description: payload.description || payload.title || payload.name || 'Sub-agent task',
            status: 'running',
            messageCount: 0,
          };
          let next = { ...base };
          if (type === 'task_started') next.status = 'running';
          else if (type === 'task_progress' || type === 'task_running') {
            next.status = 'running';
            next.messageCount = payload.message_index || ((base.messageCount || 0) + 1);
          }
          else if (type === 'task_completed') next.status = 'completed';
          else if (type === 'task_failed') { next.status = 'failed'; next.error = payload.error || payload.message; }
          else if (type === 'task_timeout' || type === 'task_timed_out') next.status = 'timed_out';

          subAgentTasksRef.current = existing
            ? subAgentTasksRef.current.map((t) => (t.id === id ? next : t))
            : [...subAgentTasksRef.current, next];
          setSubAgentTasks([...subAgentTasksRef.current]);
        }
        break;
      }
    }
  }, [logTurn]);

  // Persistent subscription to the agent stream push channel. Set up once;
  // filters by the active streamId so only the live turn is consumed.
  useEffect(() => {
    if (!hasApi || typeof api.onLanggraphStreamEvent !== 'function') {
      logger.warn(
        'agent.stream',
        'briizOS cannot display AI response updates because the desktop response channel is missing. A request may start, but its progress cannot reach this panel.',
      );
      return undefined;
    }
    const cleanup = api.onLanggraphStreamEvent(({ streamId, type, payload }) => {
      if (streamId !== activeStreamIdRef.current) return;
      try {
        handleStreamEvent(type, payload);
      } catch (err) {
        logTurn(
          'error',
          'agent.stream',
          'briizOS received an AI response update but could not display it. The current response may be incomplete.',
          { updateType: type, error: err?.message },
        );
      }
    });
    return cleanup;
  }, [handleStreamEvent, logTurn]);

  // ---------------------------------------------------------------------
  // Thread lifecycle
  // ---------------------------------------------------------------------
  const ensureThread = useCallback(async () => {
    if (threadIdRef.current) return threadIdRef.current;
    if (!hasApi || typeof api.langgraphCreateThread !== 'function') {
      throw new Error('Agent backend unavailable (no LangGraph IPC bindings)');
    }
    const kind = activeThreadKindRef.current || 'chat';
    const res = await api.langgraphCreateThread(kind);
    const threadId = res?.thread_id || res?.threadId || res;
    if (!threadId) throw new Error('Failed to create agent thread');
    threadIdRef.current = threadId;
    setActiveThread(threadId);
    // Resolve + register the chat-surface policy for this thread. Used by
    // both the renderer hard gate (bridge tools) and the run config.
    // Fail-closed if resolution fails.
    try {
      chatPolicyRef.current = await registerSurfaceForThread(threadId, 'chat');
    } catch {
      chatPolicyRef.current = restrictivePolicy('chat');
    }
    logTurn(
      'info',
      'agent.thread',
      `Started conversation ${threadId}. New messages and tool permission checks will use this conversation until you switch or clear it.`,
      {
        threadId,
        kind,
        permissionMode: chatPolicyRef.current?.mode,
      },
    );
    return threadId;
  }, [logTurn]);

  const buildConfig = useCallback(() => {
    const model = getSelectedModel();
    if (!model) throw new Error('No AI model is selected');
    const policy = chatPolicyRef.current || restrictivePolicy('chat');
    const params = requestSettingsRef.current || {};
    return {
      model,
      thinking: true,
      temperature: Number.isFinite(params.temperature) ? params.temperature : undefined,
      top_p: Number.isFinite(params.top_p) ? params.top_p : undefined,
      max_tokens: Number.isFinite(params.max_tokens) ? params.max_tokens : undefined,
      plan_mode: modalityRef.current === 'plan',
      // Chat mode → the agent's per-mode data catalog (electron/agent/data-catalog.js).
      modality: modalityRef.current,
      // Per-surface (chat column) effective level. permission_policy
      // carries the blacklist and confirmation level for bridge tools.
      tool_confirmation_mode: policy.mode || 'ask-always',
      permission_policy: policy,
      activity_id: activeActivityIdRef.current,
    };
  }, [getSelectedModel]);

  // Run one agent turn (fresh message OR a resume) over a single streamId,
  // accumulating into streamContentRef. Returns when the turn is fully done
  // (terminal end/error) OR paused awaiting tool confirmation.
  const runAgentTurn = useCallback(async (kind, args) => {
    const streamId = newId('stream');
    activeStreamIdRef.current = streamId;
    setCurrentStreamId(streamId);

    if (kind === 'message') {
      return api.langgraphStreamMessage(streamId, args.threadId, args.message, args.config);
    }
    return api.langgraphResumeRun(streamId, args.threadId, args.response, args.config);
  }, []);

  const finalizeAssistantTurn = useCallback(async ({ isRemote, skipSuggestions = false }) => {
    const content = streamContentRef.current;
    if (content) {
      const threadId = threadIdRef.current;
      await api.localData.threads.messages.append(threadId, {
        role: 'assistant',
        content,
        activityId: activeActivityIdRef.current,
        outcome: 'completed',
      });
    }

    // Follow-up suggestions are a local-user affordance only.
    if (!skipSuggestions && suggestionsEnabledRef.current && !isRemote && typeof api.langgraphFetchSuggestions === 'function') {
      try {
        const recent = [...messages, { role: 'assistant', content }]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));
        const items = await api.langgraphFetchSuggestions(
          recent,
          3,
          {
            model: getSelectedModel() || undefined,
            activity_id: activeActivityIdRef.current,
          },
          threadIdRef.current,
        );
        if (suggestionsEnabledRef.current && Array.isArray(items) && items.length > 0) {
          setSuggestions(items);
        }
      } catch (err) {
        logTurn('debug', 'agent.suggestions', 'Suggestion fetch failed', { error: err?.message });
      }
    }
    return content;
  }, [messages, getSelectedModel, logTurn]);

  const sendMessage = useCallback(async (message, { isRemote = false, prioritizeCandidates = [] } = {}) => {
    if (!message?.trim() || isLoading || isSwitchingThread) return null;
    if (!hasApi || typeof api.langgraphStreamMessage !== 'function') {
      return null;
    }

    setSuggestions([]);
    activeActivityIdRef.current = newId('activity');
    const isPrioritizeTurn = modalityRef.current === 'prioritize';
    const isPlannerTurn = modalityRef.current === 'planner';
    const selectedCandidates = Array.isArray(prioritizeCandidates) ? prioritizeCandidates : [];
    const pendingClarificationAnswer = pendingClarificationRef.current;
    const activeThreadId = pendingClarificationAnswer ? threadIdRef.current : await ensureThread();
    if (!activeThreadId) throw new Error('Cannot save a message without an agent thread');
    await api.localData.threads.messages.append(activeThreadId, {
      role: 'user',
      content: message,
      activityId: activeActivityIdRef.current,
      outcome: 'submitted',
    });
    setIsLoading(true);

    try {
      if (pendingClarificationAnswer) {
        const threadId = threadIdRef.current;
        if (!threadId) throw new Error('Cannot resume clarification without an agent thread');

        pendingClarificationRef.current = null;
        setPendingClarification(null);
        streamContentRef.current = '';
        setStreamingContent('');
        toolCallsRef.current = [];
        setToolCalls([]);
        subAgentTasksRef.current = [];
        setSubAgentTasks([]);
        pendingConfirmRef.current = null;

        logTurn(
          'info',
          'agent.clarify',
          `Your clarification answer was saved. The paused AI request is continuing in conversation ${threadId}.`,
          { threadId },
        );
        await runAgentTurn('resume', {
          threadId,
          response: { answer: message, clarification: pendingClarificationAnswer },
          config: buildConfig(),
        });

        if (pendingConfirmRef.current) {
          logTurn(
            'info',
            'chat',
            'The AI request paused before running a tool. It will continue after you approve or reject the request shown in the interaction panel.',
          );
          return null;
        }
        if (pendingClarificationRef.current) {
          const content = await finalizeAssistantTurn({ isRemote, skipSuggestions: true });
          if (isPrioritizeTurn) {
            logTurn('info', 'agent.prioritize', 'The prioritization request paused because the AI asked a clarification question. Its partial text was saved; no final prioritization is claimed.', {
              threadId,
              responseChars: content?.length || 0,
            });
          }
          return null;
        }

        const content = await finalizeAssistantTurn({ isRemote });
        if (isPrioritizeTurn) {
          logTurn('info', 'agent.prioritize', 'The prioritization AI response finished and its visible text was saved to this conversation.', {
            threadId,
            responseChars: content?.length || 0,
          });
        }
        return null;
      }

      let actualMessage = message;
      const skillName = MODALITY_SKILL_MAP[modalityRef.current];
      if (skillName) actualMessage = `[Use skill: ${skillName}] ${message}`;
      else if (modalityRef.current === 'plan') actualMessage = `[Plan mode] ${message}`;

      const selectedFiles = await loadSelectedFiles();
      actualMessage += buildFileContextAddendum(selectedFiles);
      if (isPrioritizeTurn) {
        actualMessage += buildPrioritizeAddendum(selectedCandidates);
      }
      const threadId = activeThreadId;

      // Reset per-turn accumulators.
      streamContentRef.current = '';
      setStreamingContent('');
      toolCallsRef.current = [];
      setToolCalls([]);
      subAgentTasksRef.current = [];
      setSubAgentTasks([]);
      pendingConfirmRef.current = null;

      const agentConfig = buildConfig();
      if (isPrioritizeTurn) {
        logTurn('info', 'agent.prioritize', selectedCandidates.length
          ? `${selectedCandidates.length} item${selectedCandidates.length === 1 ? ' was' : 's were'} selected as input for prioritization. No AI result has been produced yet.`
          : 'No items were selected manually, so the AI request may use its read-only task lookup. No AI result has been produced yet.', {
          threadId,
          candidates: selectedCandidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })),
        });
        logTurn('info', 'agent.prioritize', 'The prioritization request is being sent to the selected model. A later provider entry will prove success or report the exact failure.', {
          threadId,
          candidateCount: selectedCandidates.length,
          model: agentConfig.model,
        });
      }
      if (isPlannerTurn) {
        logTurn('info', 'agent.planner', 'The planning request is being sent to the selected model. A later provider entry will prove success or report the exact failure.', {
          threadId,
          model: agentConfig.model,
        });
      }
      logTurn(
        'info',
        'chat',
        'The saved user message is being sent to the AI service. Response text and tool requests will be added to this conversation as they arrive.',
        {
          threadId, isRemote, modality: modalityRef.current, model: agentConfig.model,
        },
      );

      await runAgentTurn('message', { threadId, message: actualMessage, config: agentConfig });

      // If the run paused for tool confirmation, hold the turn open — the
      // assistant message is persisted only once the run truly completes
      // (after approve/reject → resume). Otherwise finalize now.
      if (pendingConfirmRef.current) {
        logTurn(
          'info',
          'chat',
          'The AI request paused before running a tool. It will continue after you approve or reject the request shown in the interaction panel.',
        );
        if (isPrioritizeTurn) {
          logTurn('info', 'agent.prioritize', 'The prioritization request is paused before a tool action; the interaction panel is waiting for your Approve or Decline choice.', { threadId });
        }
        return null;
      }
      if (pendingClarificationRef.current) {
        const content = await finalizeAssistantTurn({ isRemote, skipSuggestions: true });
        if (isPrioritizeTurn) {
          logTurn('info', 'agent.prioritize', 'The prioritization request paused because the AI asked a clarification question. Its partial text was saved; no final prioritization is claimed.', {
            threadId,
            responseChars: content?.length || 0,
          });
        }
        return null;
      }

      const content = await finalizeAssistantTurn({ isRemote });
      if (isPrioritizeTurn) {
        logTurn('info', 'agent.prioritize', 'The prioritization AI response finished and its visible text was saved to this conversation.', {
          threadId,
          candidateCount: selectedCandidates.length,
          responseChars: content?.length || 0,
        });
      }
      if (isPlannerTurn) {
        logTurn('info', 'agent.planner', 'The planning AI response finished and its visible text was saved to this conversation.', {
          threadId,
          responseChars: content?.length || 0,
        });
      }
    } catch (error) {
      if (isPrioritizeTurn) {
        logTurn('error', 'agent.prioritize', 'The prioritization AI request ended without a normal response. The exact error is recorded below and will also be saved as a visible conversation message.', {
          error: error?.message,
        });
      }
      if (isPlannerTurn) {
        logTurn('error', 'agent.planner', 'The planning AI request ended without a normal response. The exact error is recorded below and will also be saved as a visible conversation message.', {
          error: error?.message,
        });
      }
      if (threadIdRef.current) {
        const partialContent = streamContentRef.current.trim();
        const errorContent = partialContent
          ? `${partialContent}\n\n[Response interrupted: ${error?.message || 'Unknown error'}]`
          : `Error: ${error?.message || 'Unknown error'}`;
        await api.localData.threads.messages.append(threadIdRef.current, {
          role: 'assistant',
          content: errorContent,
          isError: true,
          activityId: activeActivityIdRef.current,
          outcome: 'failed',
        });
      }
      logTurn(
        'error',
        'chat',
        'The AI request ended without a normal response. Any partial response and the reported error were saved together as an AI message in this conversation.',
        {
          threadId: threadIdRef.current,
          error: error?.message,
          partialResponseCharactersSaved: streamContentRef.current.trim().length,
        },
      );
    } finally {
      if (!pendingConfirmRef.current) {
        setIsLoading(false);
        setCurrentStreamId(null);
        setStreamingContent('');
        streamContentRef.current = '';
        activeStreamIdRef.current = null;
        activeActivityIdRef.current = null;
      }
    }

    return null;
  }, [isLoading, isSwitchingThread, loadSelectedFiles, ensureThread, runAgentTurn, buildConfig, finalizeAssistantTurn, logTurn]);

  // ---------------------------------------------------------------------
  // Tool confirmation resolution → resume the same thread.
  // ---------------------------------------------------------------------
  const resolveConfirmation = useCallback(async (approved) => {
    const conf = pendingConfirmRef.current;
    if (!conf) return;
    pendingConfirmRef.current = null;
    setPendingToolConfirmation(null);

    const threadId = threadIdRef.current;
    if (!threadId) {
      setIsLoading(false);
      return;
    }

    logTurn(
      'info',
      'agent.confirm',
      approved
        ? `You approved ${conf.tool_name}. The paused AI request is continuing with that approval.`
        : `You rejected ${conf.tool_name}. The tool will not run, and the paused AI request is continuing with your refusal.`,
      { threadId, tool: conf.tool_name, approved, summary: conf.summary },
    );

    try {
      await runAgentTurn('resume', {
        threadId,
        response: { approved, summary: conf.summary },
        config: buildConfig(),
      });

      if (pendingConfirmRef.current) {
        // Another confirmation surfaced — stay paused.
        return;
      }
      if (pendingClarificationRef.current) {
        const content = await finalizeAssistantTurn({ isRemote: false, skipSuggestions: true });
        if (modalityRef.current === 'prioritize') {
          logTurn('info', 'agent.prioritize', 'The prioritization request paused because the AI asked a clarification question. Its partial text was saved; no final prioritization is claimed.', {
            threadId,
            responseChars: content?.length || 0,
          });
        }
        return;
      }
      const content = await finalizeAssistantTurn({ isRemote: false });
      if (modalityRef.current === 'prioritize') {
        logTurn('info', 'agent.prioritize', 'After your confirmation choice, the prioritization AI response finished and its visible text was saved to this conversation.', {
          threadId,
          responseChars: content?.length || 0,
        });
      }
    } catch (error) {
      const partialContent = streamContentRef.current.trim();
      const errorContent = partialContent
        ? `${partialContent}\n\n[Response interrupted: ${error?.message || 'Unknown error'}]`
        : `Error: ${error?.message || 'Unknown error'}`;
      await api.localData.threads.messages.append(threadId, {
        role: 'assistant',
        content: errorContent,
        isError: true,
        activityId: activeActivityIdRef.current,
        outcome: 'failed',
      });
      logTurn(
        'error',
        'agent.confirm',
        'The AI request could not continue after your confirmation choice. Any partial response and the reported error were saved together as an AI message in this conversation.',
        {
          threadId,
          tool: conf.tool_name,
          approved,
          error: error?.message,
          partialResponseCharactersSaved: partialContent.length,
        },
      );
    } finally {
      if (!pendingConfirmRef.current) {
        setIsLoading(false);
        setCurrentStreamId(null);
        setStreamingContent('');
        streamContentRef.current = '';
        activeStreamIdRef.current = null;
        activeActivityIdRef.current = null;
      }
    }
  }, [runAgentTurn, buildConfig, finalizeAssistantTurn, logTurn]);

  const approveToolConfirmation = useCallback(() => resolveConfirmation(true), [resolveConfirmation]);
  const rejectToolConfirmation = useCallback(() => resolveConfirmation(false), [resolveConfirmation]);

  const clearHistory = useCallback(async () => {
    try {
      if (threadIdRef.current) await api.localData.threads.archive(threadIdRef.current);
      setMessages([]);
      setTokenUsage(null);
      setStreamingContent('');
      setCurrentStreamId(null);
      setToolCalls([]);
      toolCallsRef.current = [];
      setSubAgentTasks([]);
      subAgentTasksRef.current = [];
      modalityRef.current = 'chat';
      setModalityState('chat');
      setSuggestions([]);
      setThreadTitle(null);
      threadTitleRef.current = null;
      setPendingToolConfirmation(null);
      pendingConfirmRef.current = null;
      setPendingClarification(null);
      pendingClarificationRef.current = null;
      activeActivityIdRef.current = null;
      // New conversation → new agent thread.
      if (threadIdRef.current) unregisterThread(threadIdRef.current);
      chatPolicyRef.current = restrictivePolicy('chat');
      threadIdRef.current = null;
      activeStreamIdRef.current = null;
      setActiveThread(null);
    } catch (error) {
      logger.error('chat', 'Failed to clear history', { error: error?.message });
    }
  }, []);

  const refreshFilesInContext = useCallback(async () => {
    await loadSelectedFiles();
  }, [loadSelectedFiles]);

  return {
    messages,
    isLoading,
    isSwitchingThread,
    isConfigured,
    tokenUsage,
    filesInContext,
    streamingContent,
    currentStreamId,
    toolCalls,
    subAgentTasks,
    pendingToolConfirmation,
    pendingClarification,
    modality,
    setModality,
    suggestions,
    suggestionsEnabled,
    setSuggestionsEnabled,
    threadTitle,
    threadTitleRef,
    sendMessage,
    clearHistory,
    loadHistory: async () => {
      if (!threadIdRef.current) return [];
      const next = await api.localData.threads.messages.list(threadIdRef.current);
      setMessages(next);
      return next;
    },
    checkConfig,
    refreshFilesInContext,
    approveToolConfirmation,
    rejectToolConfirmation,
  };
}

export default useChat;
