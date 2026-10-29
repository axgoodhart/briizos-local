import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logger from '../../lib/logger.js';
import { registerSurfaceForThread, unregisterThread } from '../../lib/agentSurfaces';
import { analyzeStylometry, corpusFromSamples, describeMeasurements, evaluateVoiceFit } from '../../lib/stylofactMetrics';

// ==== STYLOFACT RUNS ====
const EXEMPLAR_PATH = '/mnt/skills/custom/stylofact/EXEMPLAR.md';
const FIND_BUDGET = { searches: 8, context_reads: 24, quotes: 20 };
const MAX_TOKENS = { guide: 20000, addendum: 12000, find: 24000, write: 32000, review: 32000 };
const STAGE_LABELS = {
  guide: 'Stylofact · Write the style guide',
  addendum: 'Stylofact · Write a form addendum',
  find: 'Stylofact · Find material in your history',
  write: 'Stylofact · Write the piece',
  review: 'Stylofact · Second-AI review',
};
const REVIEW_KEY = 'stylofact.review';
const MODEL_KEY = 'stylofact.models';

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const wordCount = (text) => (String(text || '').match(/[\p{L}\p{N}]+/gu) || []).length;
const stripFences = (text) => String(text || '').trim().replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/i, '').trim();
const quoteKey = (quote) => `${quote.conversation}:${quote.index}:${String(quote.text || '').length}:${String(quote.text || '').slice(0, 24)}`;

function decodeJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through to the bracket scan */ }
  const start = cleaned.search(/[[{]/);
  if (start < 0) throw new Error('The AI did not return the structured answer this step needs. Try the step again.');
  const opening = cleaned[start];
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === opening) depth += 1;
    else if (char === closing) {
      depth -= 1;
      if (depth === 0) return JSON.parse(cleaned.slice(start, index + 1));
    }
  }
  throw new Error('The AI returned an incomplete answer. Try the step again.');
}

// Read-only by design: a headless run can never stall on a permission it has no window to answer.
const allowedToolsFor = (stage) => (stage === 'find' ? ['read_file', 'history_search', 'history_context'] : ['read_file']);

function makeAgentConfig(model, stage, permissionPolicy) {
  return {
    model,
    audit_label: STAGE_LABELS[stage] || `Stylofact · ${stage}`,
    thinking: true,
    max_tokens: MAX_TOKENS[stage] || 16000,
    plan_mode: false,
    subagent_enabled: false,
    available_skills: ['stylofact'],
    inject_memory: false,
    disable_memory_update: true,
    disable_title_generation: true,
    allowed_tools: allowedToolsFor(stage),
    tool_confirmation_mode: permissionPolicy?.mode || 'ask-always',
    permission_policy: permissionPolicy || null,
  };
}

function readStored(key, fallback) {
  try { const raw = window.localStorage.getItem(key); return raw == null ? fallback : JSON.parse(raw); } catch { return fallback; }
}
function writeStored(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* a per-window preference; fine to lose */ }
}

export function useStylofact({ models = [], selectedModel = null, isModelAvailable } = {}) {
  const api = typeof window !== 'undefined' ? window.api?.stylofact : null;
  const [snapshot, setSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runState, setRunState] = useState(null);
  const [streamPreview, setStreamPreview] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [lastFind, setLastFind] = useState(null);
  const [storedModels, setStoredModels] = useState(() => readStored(MODEL_KEY, {}));
  const [reviewEnabled, setReviewEnabledState] = useState(() => readStored(REVIEW_KEY, false) === true);
  const streamsRef = useRef(new Map());
  const snapshotRef = useRef(null);
  const reloadTimerRef = useRef(null);

  const availableModels = useMemo(
    () => models.filter((model) => typeof isModelAvailable !== 'function' || isModelAvailable(model)),
    [models, isModelAvailable],
  );
  const pickModel = (wanted) => (wanted && availableModels.some((model) => model.name === wanted) ? wanted : null);
  const defaultModel = pickModel(selectedModel) || availableModels[0]?.name || null;
  const writerModel = pickModel(storedModels.writer) || defaultModel;
  const reviewerModel = pickModel(storedModels.reviewer) || writerModel;
  const setWriterModel = useCallback((name) => { const next = { ...storedModels, writer: name }; setStoredModels(next); writeStored(MODEL_KEY, next); }, [storedModels]);
  const setReviewerModel = useCallback((name) => { const next = { ...storedModels, reviewer: name }; setStoredModels(next); writeStored(MODEL_KEY, next); }, [storedModels]);
  const setReviewEnabled = useCallback((enabled) => { setReviewEnabledState(!!enabled); writeStored(REVIEW_KEY, !!enabled); logger.info('stylofact.write', enabled ? 'Second-AI review turned on for new drafts.' : 'Second-AI review turned off for new drafts.'); }, []);

  const reload = useCallback(async () => {
    if (!api) return null;
    const next = await api.snapshot();
    snapshotRef.current = next;
    setSnapshot(next);
    return next;
  }, [api]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!api) { setError('Stylofact needs the desktop data bridge.'); setIsLoading(false); return; }
      try { await reload(); } catch (loadError) { if (alive) setError(loadError?.message || 'Stylofact could not load.'); }
      finally { if (alive) setIsLoading(false); }
    })();
    const unsubscribe = api?.subscribe?.(() => {
      clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = setTimeout(() => { reload().catch(() => {}); }, 150);
    });
    return () => { alive = false; unsubscribe?.(); clearTimeout(reloadTimerRef.current); };
  }, [api, reload]);

  const refreshSplit = useCallback(async () => {
    if (!api) return null;
    const split = await api.split.status();
    setSnapshot((current) => (current ? { ...current, split } : current));
    return split;
  }, [api]);

  // ---- the AI run plumbing -------------------------------------------------
  useEffect(() => {
    if (!window.api?.onLanggraphStreamEvent) return undefined;
    const unsubscribe = window.api.onLanggraphStreamEvent(({ streamId, type, payload }) => {
      const run = streamsRef.current.get(streamId);
      if (!run) return;
      if (type === 'text' && payload?.content) { run.text += payload.content; setStreamPreview(run.text); }
      if (type === 'tool_confirmation') {
        run.paused = true;
        setPendingDecision({ streamId, threadId: run.threadId, stage: run.stage, summary: payload?.summary || payload?.tool_name || 'A tool request needs your approval.' });
      }
      if (type === 'clarification') {
        streamsRef.current.delete(streamId);
        setPendingDecision(null);
        const failure = new Error(`The AI paused to ask: “${payload?.question || 'no question text was provided'}”. Stylofact steps run on their own, so add the missing detail and run the step again.`);
        failure.aiTurn = { threadId: run.threadId, stage: run.stage };
        run.reject(failure);
      }
      if (type === 'error') {
        streamsRef.current.delete(streamId);
        setPendingDecision(null);
        const failure = new Error(payload?.message || 'The Stylofact AI run failed.');
        failure.aiTurn = { stage: run.stage, threadId: payload?.threadId || run.threadId || null, turnId: payload?.turnId || null, provider: payload?.provider || null, model: payload?.model || null, status: payload?.status ?? null, code: payload?.code ?? null, nextAction: payload?.nextAction || null };
        run.reject(failure);
      }
      if (type === 'end') {
        if (run.paused) return;
        streamsRef.current.delete(streamId);
        setPendingDecision(null);
        run.resolve(run.text);
      }
    });
    return () => {
      unsubscribe?.();
      streamsRef.current.forEach((run) => run.reject(new Error('Stylofact was closed before the run completed.')));
      streamsRef.current.clear();
    };
  }, []);

  const runAgent = useCallback(async ({ stage, model, prompt, label }) => {
    if (!model) throw new Error('Choose an available AI model first.');
    if (!window.api?.langgraphCreateThread || !window.api?.langgraphStreamMessage) throw new Error('Stylofact cannot reach the local AI runtime.');
    const thread = await window.api.langgraphCreateThread('stylofact');
    const threadId = thread?.thread_id;
    if (!threadId) throw new Error('Stylofact could not open an AI workspace.');
    const permissionPolicy = await registerSurfaceForThread(threadId, 'task');
    const streamId = newId(`stylofact-${stage}`);
    setRunState({ stage, model, label: label || `${STAGE_LABELS[stage]?.replace('Stylofact · ', '') || stage}…` });
    setStreamPreview('');
    let resolveStream;
    let rejectStream;
    const completed = new Promise((resolve, reject) => { resolveStream = resolve; rejectStream = reject; });
    completed.catch(() => {});
    streamsRef.current.set(streamId, { text: '', resolve: resolveStream, reject: rejectStream, threadId, stage, paused: false });
    logger.info(`stylofact.${stage === 'review' || stage === 'write' ? 'write' : stage === 'find' ? 'find' : 'guide'}`, `${STAGE_LABELS[stage]} was sent to ${model}.`, { threadId, stage, promptCharacters: prompt.length });
    try {
      const invocation = await window.api.langgraphStreamMessage(streamId, threadId, `[Use skill: stylofact]\n\n${prompt}`, makeAgentConfig(model, stage, permissionPolicy));
      const text = await completed;
      return { text, threadId, turnId: invocation?.turnId || null };
    } catch (runError) {
      const active = streamsRef.current.get(streamId);
      if (active) { streamsRef.current.delete(streamId); active.reject(runError); }
      throw runError;
    } finally {
      unregisterThread(threadId);
      setRunState(null);
    }
  }, []);

  const resolveDecision = useCallback(async (approved) => {
    const decision = pendingDecision;
    if (!decision) return;
    const run = streamsRef.current.get(decision.streamId);
    setPendingDecision(null);
    if (!run) return;
    try {
      run.paused = false;
      await window.api.langgraphResumeRun(decision.streamId, decision.threadId, { approved: !!approved });
    } catch (resumeError) {
      streamsRef.current.delete(decision.streamId);
      run.reject(new Error(resumeError?.message || 'The paused Stylofact run could not be resumed.'));
    }
  }, [pendingDecision]);

  const recordRun = useCallback(async (stage, status, details = {}) => {
    if (!api) return;
    try {
      await api.recordRun({
        stage, status, pieceId: details.pieceId || null, guideId: details.guideId || snapshotRef.current?.guide?.id || null,
        modelName: details.modelName || null, input: details.input || {}, result: details.result || (details.errorDetail ? { errorDetail: details.errorDetail } : {}),
        error: details.error || null, agentThreadId: details.agentThreadId || details.errorDetail?.threadId || null, agentTurnId: details.agentTurnId || details.errorDetail?.turnId || null,
      });
    } catch { /* a missing history row must not discard a successful result */ }
  }, [api]);

  const failureDetail = (runError) => (runError?.aiTurn ? { ...runError.aiTurn } : null);

  // ---- samples -----------------------------------------------------------------
  const guide = snapshot?.guide || null;
  const samples = snapshot?.samples || [];
  const pieces = snapshot?.pieces || [];
  const runs = snapshot?.runs || [];
  const split = snapshot?.split || null;
  const forms = useMemo(() => {
    const names = new Set();
    samples.forEach((sample) => { if (sample.form !== 'all') names.add(sample.form); });
    pieces.forEach((piece) => { if (piece.form !== 'all') names.add(piece.form); });
    return [...names].sort();
  }, [samples, pieces]);
  const sampleWords = useMemo(() => samples.reduce((total, sample) => total + (sample.wordCount || 0), 0), [samples]);

  const requireGuide = () => { const current = snapshotRef.current?.guide; if (!api || !current) throw new Error('Stylofact storage is not ready.'); return current; };

  const addPastedSample = useCallback(async ({ label, form, text }) => {
    const current = requireGuide();
    if (!String(text || '').trim()) throw new Error('Paste some of your writing first.');
    const saved = await api.addSample(current.id, { origin: 'paste', label, form, text });
    logger.info('stylofact.samples', `Pasted sample “${saved.label}” added (${saved.wordCount.toLocaleString()} words).`, { sampleId: saved.id, form: saved.form });
    await reload();
    return saved;
  }, [api, reload]);

  const addFileSamples = useCallback(async (files, form) => {
    const current = requireGuide();
    const added = [];
    for (const file of files) {
      const saved = await api.addSample(current.id, { origin: 'file', label: file.label, form, text: file.text, filePath: file.filePath, fileKind: file.kind, truncated: file.truncated });
      added.push(saved);
      logger.info('stylofact.samples', `File sample “${saved.label}” added (${saved.wordCount.toLocaleString()} words${file.pages ? `, ${file.pages} pages` : ''}${file.truncated ? ', cut at 400,000 characters' : ''}).`, { sampleId: saved.id, filePath: file.filePath, kind: file.kind, form });
    }
    if (added.length) await reload();
    return added;
  }, [api, reload]);

  const pickSampleFiles = useCallback(async (form) => {
    if (!api) throw new Error('Stylofact storage is not ready.');
    const result = await api.pickSampleFiles();
    if (result.canceled) return { added: [], failures: [] };
    const added = await addFileSamples(result.files, form);
    return { added, failures: result.failures || [] };
  }, [api, addFileSamples]);

  const dropSampleFile = useCallback(async (item, form) => {
    if (!api) throw new Error('Stylofact storage is not ready.');
    if (!item?.path) throw new Error('This file has no readable location on disk.');
    const file = await api.readSampleFile(item.path);
    return addFileSamples([file], form);
  }, [api, addFileSamples]);

  const setSampleForm = useCallback(async (sample, form) => { await api.updateSample(sample.id, { form }); await reload(); }, [api, reload]);
  const renameSample = useCallback(async (sample, label) => { if (label.trim() && label !== sample.label) { await api.updateSample(sample.id, { label }); await reload(); } }, [api, reload]);
  const removeSample = useCallback(async (sample) => { await api.removeSample(sample.id); await reload(); }, [api, reload]);

  // ---- measuring and the guide ----------------------------------------------------
  const samplesFor = (form) => (form ? samples.filter((sample) => sample.form === form) : samples);
  const measureSamples = useCallback((form = null) => {
    const chosen = samplesFor(form);
    const metrics = analyzeStylometry(corpusFromSamples(chosen), { sampleCount: chosen.length, forms: [...new Set(chosen.map((sample) => sample.form))] });
    return { metrics, chosen };
  }, [samples]);

  const saveGuide = useCallback(async (patch) => {
    const current = requireGuide();
    try {
      const saved = await api.saveGuide(current.id, current.revision, patch);
      await reload();
      return saved;
    } catch (saveError) {
      if (saveError?.code !== 'REVISION_CONFLICT') throw saveError;
      const fresh = await reload();
      const saved = await api.saveGuide(fresh.guide.id, fresh.guide.revision, patch);
      await reload();
      return saved;
    }
  }, [api, reload]);

  const measure = useCallback(async () => {
    const { metrics, chosen } = measureSamples(null);
    if (!chosen.length) throw new Error('Add at least one writing sample first.');
    await saveGuide({ measurements: metrics, reason: 'measure' });
    logger.info('stylofact.guide', `Your ${chosen.length} sample${chosen.length === 1 ? '' : 's'} were measured: ${metrics.scope.wordCount.toLocaleString()} words, ${metrics.scope.confidenceBand === 'solid' ? 'enough for a solid guide' : metrics.scope.confidenceBand === 'provisional' ? 'enough for a provisional guide' : 'only enough for a rough sketch'}.`, { words: metrics.scope.wordCount, sentences: metrics.scope.sentenceCount, confidence: metrics.scope.confidenceBand });
    return metrics;
  }, [measureSamples, saveGuide]);

  const writeGuide = useCallback(async ({ form = null } = {}) => {
    const current = requireGuide();
    const { metrics, chosen } = measureSamples(form);
    if (!chosen.length) throw new Error(form ? `Add a sample marked “${form}” first.` : 'Add at least one writing sample first.');
    if (!form) await saveGuide({ measurements: metrics, reason: 'measure' });
    const existing = form ? (current.addenda?.[form] || '') : current.text;
    const handEdited = !!current.editedAt && !!existing.trim();
    const request = {
      operation: 'write_guide',
      exemplar_path: EXEMPLAR_PATH,
      form,
      samples: chosen.map((sample) => ({ label: sample.label, form: sample.form, text: sample.text })),
      measurements: { ...metrics, plain: describeMeasurements(metrics) },
      scope: { sampleCount: chosen.length, wordCount: metrics.scope.wordCount, confidenceBand: metrics.scope.confidenceBand },
      existing_guide: existing.trim() ? existing : null,
      hand_edited: handEdited,
    };
    const stage = form ? 'addendum' : 'guide';
    try {
      const response = await runAgent({ stage, model: writerModel, prompt: JSON.stringify(request), label: form ? `Writing the ${form} addendum…` : existing.trim() ? 'Suggesting a revision of your style guide…' : 'Writing your style guide…' });
      const text = stripFences(response.text);
      if (!text) throw new Error('The AI returned an empty guide. Try again.');
      let outcome;
      if (existing.trim()) {
        setProposal({ kind: form ? 'addendum' : 'guide', form, current: existing, proposed: text });
        outcome = 'proposed';
        logger.info('stylofact.guide', form ? `A revised ${form} addendum is ready to compare with the current one.` : 'A revised style guide is ready to compare with the current one. Nothing changes until you accept it.', { characters: text.length });
      } else if (form) {
        await saveGuide({ addenda: { ...(current.addenda || {}), [form]: text }, reason: 'ai' });
        outcome = 'saved';
      } else {
        await saveGuide({ text, reason: 'ai' });
        outcome = 'saved';
      }
      await recordRun(stage, 'completed', { guideId: current.id, modelName: writerModel, input: { form, samples: chosen.length, words: metrics.scope.wordCount, handEdited }, result: { outcome, characters: text.length }, agentThreadId: response.threadId, agentTurnId: response.turnId });
      return { outcome, text };
    } catch (runError) {
      await recordRun(stage, 'failed', { guideId: current.id, modelName: writerModel, input: { form, samples: chosen.length }, error: runError?.message, errorDetail: failureDetail(runError) });
      throw runError;
    }
  }, [measureSamples, saveGuide, runAgent, writerModel, recordRun]);

  const acceptProposal = useCallback(async () => {
    if (!proposal) return;
    const current = requireGuide();
    if (proposal.kind === 'guide') await saveGuide({ text: proposal.proposed, reason: 'ai' });
    else await saveGuide({ addenda: { ...(current.addenda || {}), [proposal.form]: proposal.proposed }, reason: 'ai' });
    logger.info('stylofact.guide', proposal.kind === 'guide' ? 'The revised style guide was accepted and saved.' : `The revised ${proposal.form} addendum was accepted and saved.`);
    setProposal(null);
  }, [proposal, saveGuide]);

  const discardProposal = useCallback(() => {
    if (proposal) logger.info('stylofact.guide', proposal.kind === 'guide' ? 'The suggested guide revision was discarded; your current guide stands.' : `The suggested ${proposal.form} addendum was discarded.`);
    setProposal(null);
  }, [proposal]);

  const saveGuideText = useCallback(async (text) => {
    const current = requireGuide();
    if (text === current.text) return current;
    return saveGuide({ text, reason: 'edit' });
  }, [saveGuide]);

  const saveAddendum = useCallback(async (form, text) => {
    const current = requireGuide();
    if ((current.addenda?.[form] || '') === text) return current;
    return saveGuide({ addenda: { ...(current.addenda || {}), [form]: text }, reason: 'edit' });
  }, [saveGuide]);

  const renameGuide = useCallback(async (name) => { if (name.trim()) await saveGuide({ name, reason: 'edit' }); }, [saveGuide]);

  // ---- pieces --------------------------------------------------------------------
  const selectedPiece = useMemo(() => pieces.find((piece) => piece.id === selectedPieceId) || pieces[0] || null, [pieces, selectedPieceId]);

  const createPiece = useCallback(async ({ request = '', form = 'all', title = '' } = {}) => {
    if (!api) throw new Error('Stylofact storage is not ready.');
    const created = await api.createPiece({ request, form, title });
    setSelectedPieceId(created.id);
    setLastFind(null);
    await reload();
    return created;
  }, [api, reload]);

  const updatePiece = useCallback(async (piece, patch) => {
    if (!api || !piece) throw new Error('No piece is open.');
    try {
      const saved = await api.updatePiece(piece.id, piece.revision, patch);
      await reload();
      return saved;
    } catch (saveError) {
      if (saveError?.code !== 'REVISION_CONFLICT') throw saveError;
      const fresh = await reload();
      const latest = fresh.pieces.find((entry) => entry.id === piece.id);
      if (!latest) throw saveError;
      const saved = await api.updatePiece(latest.id, latest.revision, patch);
      await reload();
      return saved;
    }
  }, [api, reload]);

  const archivePiece = useCallback(async (piece) => {
    if (!api || !piece) return;
    await api.archivePiece(piece.id);
    if (selectedPieceId === piece.id) setSelectedPieceId(null);
    await reload();
  }, [api, reload, selectedPieceId]);

  const findMaterial = useCallback(async (piece) => {
    if (!piece) throw new Error('Start a piece first.');
    if (!String(piece.request || '').trim()) throw new Error('Say in a sentence what the piece is about.');
    setRunState({ stage: 'find', model: writerModel, label: 'Making sure Split is running…' });
    try {
      await api.split.start();
    } catch (splitError) {
      setRunState(null);
      await refreshSplit();
      throw splitError;
    }
    await refreshSplit();
    const request = { operation: 'find_material', request: piece.request, form: piece.form, budget: FIND_BUDGET };
    try {
      const response = await runAgent({ stage: 'find', model: writerModel, prompt: JSON.stringify(request), label: 'Searching your history and reading the promising messages…' });
      const parsed = decodeJson(response.text);
      const phrasings = Array.isArray(parsed?.phrasings) ? parsed.phrasings.filter((entry) => typeof entry === 'string').slice(0, 40) : [];
      const rawQuotes = Array.isArray(parsed?.quotes) ? parsed.quotes : [];
      const verified = await api.verifyQuotes(rawQuotes.map((quote) => ({ conversation: quote?.conversation, index: quote?.index, text: quote?.text, why: quote?.why, title: quote?.title, date: quote?.date })));
      const seen = new Set();
      const quotes = verified.filter((quote) => quote.verified).map((quote) => ({
        key: quoteKey(quote), conversation: quote.conversation, index: quote.index, text: quote.text, why: quote.why || '', title: quote.title || '', date: quote.date || null, chosen: false,
      })).filter((quote) => (seen.has(quote.key) ? false : seen.add(quote.key)));
      const dropped = verified.length - quotes.length;
      await updatePiece(piece, { phrasings, quotes, stage: 'choose' });
      const summary = { found: quotes.length, dropped, notes: typeof parsed?.notes === 'string' ? parsed.notes : '' };
      setLastFind(summary);
      logger.info('stylofact.find', `${quotes.length} quote${quotes.length === 1 ? '' : 's'} from your history ${quotes.length === 1 ? 'is' : 'are'} ready to choose from for “${piece.title}”${dropped ? `; ${dropped} did not match your messages word for word and were dropped` : ''}.`, { pieceId: piece.id, phrasings, found: quotes.length, dropped });
      await recordRun('find', 'completed', { pieceId: piece.id, modelName: writerModel, input: { request: piece.request, form: piece.form, phrasings }, result: summary, agentThreadId: response.threadId, agentTurnId: response.turnId });
      return summary;
    } catch (runError) {
      await recordRun('find', 'failed', { pieceId: piece.id, modelName: writerModel, input: { request: piece.request }, error: runError?.message, errorDetail: failureDetail(runError) });
      throw runError;
    }
  }, [api, writerModel, runAgent, refreshSplit, updatePiece, recordRun]);

  const setQuoteChosen = useCallback(async (piece, keys, chosen) => {
    const wanted = new Set(Array.isArray(keys) ? keys : [keys]);
    const quotes = piece.quotes.map((quote) => (wanted.has(quote.key) ? { ...quote, chosen } : quote));
    await updatePiece(piece, { quotes });
  }, [updatePiece]);

  const writePiece = useCallback(async (piece, { review = reviewEnabled } = {}) => {
    const current = requireGuide();
    if (!piece) throw new Error('Start a piece first.');
    if (!current.text.trim()) throw new Error('Write the style guide first; the piece is written from it.');
    const chosen = (piece.quotes || []).filter((quote) => quote.chosen);
    if (!chosen.length) throw new Error('Keep at least one quote first.');
    const addendum = piece.form !== 'all' ? current.addenda?.[piece.form] || null : null;
    const quotesForPrompt = chosen.map((quote) => ({ text: quote.text, title: quote.title, date: quote.date }));
    const request = { operation: 'write_piece', request: piece.request, form: piece.form, guide: current.text, addendum, quotes: quotesForPrompt, length: null };
    try {
      const response = await runAgent({ stage: 'write', model: writerModel, prompt: JSON.stringify(request), label: 'Writing the piece from your guide and quotes…' });
      const draft = stripFences(response.text);
      if (!draft) throw new Error('The AI returned an empty draft. Try again.');
      let reviewText = '';
      let reviewResponse = null;
      if (review) {
        reviewResponse = await runAgent({ stage: 'review', model: reviewerModel, prompt: JSON.stringify({ operation: 'review_piece', guide: current.text, addendum, draft, quotes: quotesForPrompt }), label: 'A second model is reading the draft against your guide…' });
        reviewText = stripFences(reviewResponse.text);
      }
      const drift = evaluateVoiceFit(draft, current.measurements);
      await updatePiece(piece, { draft, review: reviewText, chosen: 'draft', drift, stage: 'done', guideRevision: current.revision });
      logger.info('stylofact.write', `A draft of “${piece.title}” was written (${wordCount(draft).toLocaleString()} words)${reviewText ? ` with a second-AI revision (${wordCount(reviewText).toLocaleString()} words)` : ''}. Compared with your samples: ${drift.summary || drift.note}.`, { pieceId: piece.id, words: wordCount(draft), reviewed: !!reviewText, drift: drift.status });
      await recordRun('write', 'completed', { pieceId: piece.id, modelName: writerModel, input: { quotes: chosen.length, form: piece.form, review }, result: { words: wordCount(draft), reviewed: !!reviewText, drift: drift.status, reviewerThreadId: reviewResponse?.threadId || null, reviewerTurnId: reviewResponse?.turnId || null }, agentThreadId: response.threadId, agentTurnId: response.turnId });
      return { draft, review: reviewText, drift };
    } catch (runError) {
      await recordRun('write', 'failed', { pieceId: piece.id, modelName: writerModel, input: { quotes: chosen.length, review }, error: runError?.message, errorDetail: failureDetail(runError) });
      throw runError;
    }
  }, [reviewEnabled, runAgent, writerModel, reviewerModel, updatePiece, recordRun]);

  const choosePieceVersion = useCallback(async (piece, which) => {
    const current = requireGuide();
    const text = which === 'review' ? piece.review : piece.draft;
    const drift = evaluateVoiceFit(text, current.measurements);
    await updatePiece(piece, { chosen: which, drift });
    logger.info('stylofact.write', which === 'review' ? 'The second-AI revision is now the kept version.' : 'The first draft is now the kept version.', { pieceId: piece.id });
  }, [updatePiece]);

  // ---- Split ----------------------------------------------------------------------
  const splitStart = useCallback(async () => { try { await api.split.start(); } finally { await refreshSplit(); } }, [api, refreshSplit]);
  const splitStop = useCallback(async () => { await api.split.stop(); await refreshSplit(); }, [api, refreshSplit]);
  const splitChooseFolder = useCallback(async () => { await api.split.chooseFolder(); await refreshSplit(); }, [api, refreshSplit]);
  const splitSetAutoStart = useCallback(async (autoStart) => { await api.split.saveSettings({ autoStart }); await refreshSplit(); }, [api, refreshSplit]);
  const openContext = useCallback((quote) => api.split.context({ conversation: quote.conversation, index: quote.index, before: 2, after: 2 }), [api]);

  return {
    guide, samples, pieces, runs, split, forms, sampleWords,
    availableModels, writerModel, reviewerModel, setWriterModel, setReviewerModel, reviewEnabled, setReviewEnabled,
    isLoading, error, setError, runState, streamPreview, pendingDecision, resolveDecision, proposal, lastFind,
    selectedPiece, selectPiece: setSelectedPieceId,
    addPastedSample, pickSampleFiles, dropSampleFile, setSampleForm, renameSample, removeSample,
    measure, measureSamples, writeGuide, acceptProposal, discardProposal, saveGuideText, saveAddendum, renameGuide,
    createPiece, updatePiece, archivePiece, findMaterial, setQuoteChosen, writePiece, choosePieceVersion,
    refreshSplit, splitStart, splitStop, splitChooseFolder, splitSetAutoStart, openContext,
  };
}

export { describeMeasurements, wordCount };
