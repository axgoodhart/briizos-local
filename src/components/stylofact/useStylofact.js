import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeStylometry, compileStyleProfile, corpusFromSources, evaluateVoiceFit } from '../../lib/stylofactMetrics';

const MAX_AGENT_CORPUS_CHARACTERS = 180000;
const MAX_GENERATION_FORMATS = 4;
const MAX_VARIATIONS = 6;

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sampleForAgent(text, maxCharacters = MAX_AGENT_CORPUS_CHARACTERS) {
  const value = String(text || '');
  if (value.length <= maxCharacters) return { text: value, sampled: false, sourceCharacters: value.length };
  const slices = 4;
  const sliceLength = Math.floor(maxCharacters / slices);
  const step = Math.floor((value.length - sliceLength) / (slices - 1));
  const chunks = Array.from({ length: slices }, (_, index) => {
    const start = Math.min(value.length - sliceLength, index * step);
    return value.slice(start, start + sliceLength);
  });
  return {
    text: `${chunks.join('\n\n[... corpus sampled between excerpts ...]\n\n')}`,
    sampled: true,
    sourceCharacters: value.length,
  };
}

function decodeJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Models sometimes add one explanatory sentence around otherwise valid JSON.
  }

  const start = cleaned.search(/[\[{]/);
  if (start < 0) throw new Error('The model did not return structured JSON. Try the stage again.');
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
  throw new Error('The model returned incomplete JSON. Try the stage again.');
}

function normalizeExtraction(payload, corpus) {
  const extracted = Array.isArray(payload?.extracted_artifacts) ? payload.extracted_artifacts : [];
  const seen = new Set();
  const valid = extracted.reduce((results, artifact, index) => {
    const verbatim = typeof artifact?.verbatim_text === 'string' ? artifact.verbatim_text : '';
    if (!verbatim.trim() || !corpus.includes(verbatim)) return results;
    const baseId = String(artifact.artifact_id || `ART-${String(index + 1).padStart(3, '0')}`).replace(/\s+/g, '-');
    const artifactId = seen.has(baseId) ? `${baseId}-${index + 1}` : baseId;
    seen.add(artifactId);
    results.push({
      artifact_id: artifactId,
      verbatim_text: verbatim,
      matched_passes: Array.isArray(artifact.matched_passes) ? artifact.matched_passes : [],
      relevance_score: Number.isFinite(Number(artifact.relevance_score)) ? Number(artifact.relevance_score) : 0,
      provenance: artifact.provenance && typeof artifact.provenance === 'object' ? artifact.provenance : {},
    });
    return results;
  }, []);
  return {
    search_parameters: payload?.search_parameters || {},
    extracted_artifacts: valid,
    corpus_diagnostics: {
      ...(payload?.corpus_diagnostics || {}),
      total_artifacts_found: valid.length,
      rejected_nonverbatim_artifacts: extracted.length - valid.length,
    },
  };
}

function normalizeBlueprint(payload) {
  return payload?.blueprint ? payload : { blueprint: payload || {} };
}

function normalizeOutputs(payload) {
  const outputs = Array.isArray(payload?.outputs) ? payload.outputs : [];
  return outputs
    .filter((output) => typeof output?.content === 'string' && output.content.trim())
    .map((output, index) => ({
      medium: String(output.medium || 'content'),
      variation: Number.isInteger(output.variation) && output.variation > 0 ? output.variation : index + 1,
      title: String(output.title || ''),
      content: output.content,
      sourceArtifactIds: Array.isArray(output.source_artifact_ids) ? output.source_artifact_ids.map(String) : [],
      deploymentNote: String(output.deployment_note || ''),
    }));
}

function profileForGeneration(project) {
  const profile = project?.styleProfile?.stylofact_profile || project?.styleProfile || {};
  const storedMetrics = project?.styleMetrics && Object.keys(project.styleMetrics).length ? project.styleMetrics : null;
  const measuredProfile = {
    ...profile,
    measured_metrics: storedMetrics || profile.measured_metrics || {},
  };
  const review = project?.styleReview?.review;
  if (project?.profileChoice === 'review' && review?.revised_generation_directive) {
    return {
      ...measuredProfile,
      generation_directive: review.revised_generation_directive,
      independent_review: review,
    };
  }
  return measuredProfile;
}

function makeAgentConfig(model, stage) {
  const maxTokens = stage === 'generate' || stage === 'generate-review' ? 48000
    : stage === 'extract' ? 22000
      : 16000;
  return {
    model,
    thinking: true,
    max_tokens: maxTokens,
    plan_mode: false,
    subagent_enabled: false,
    available_skills: ['stylofact'],
    inject_memory: false,
    disable_memory_update: true,
    disable_title_generation: true,
    tool_confirmation_mode: 'ask-always',
  };
}

function modelNameFor(models, selectedModel, available) {
  if (selectedModel && available.some((model) => model.name === selectedModel)) return selectedModel;
  return available[0]?.name || null;
}

function independentCriticFor(primaryModel, requestedCritic, availableModels) {
  const primary = availableModels.find((model) => model.name === primaryModel);
  const requested = availableModels.find((model) => model.name === requestedCritic);
  if (requested && requested.provider !== primary?.provider) return requested.name;
  return availableModels.find((model) => model.provider !== primary?.provider)?.name || null;
}

export function useStylofact({ models = [], selectedModel, isModelAvailable } = {}) {
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runState, setRunState] = useState(null);
  const [error, setError] = useState(null);
  const [streamPreview, setStreamPreview] = useState('');
  const projectRef = useRef(null);
  const streamsRef = useRef(new Map());

  const availableModels = useMemo(
    () => models.filter((model) => typeof isModelAvailable !== 'function' || isModelAvailable(model)),
    [models, isModelAvailable],
  );
  const defaultPrimaryModel = modelNameFor(models, selectedModel, availableModels);
  const defaultCriticModel = useMemo(() => {
    const primary = availableModels.find((model) => model.name === defaultPrimaryModel);
    return availableModels.find((model) => model.provider !== primary?.provider)?.name || null;
  }, [availableModels, defaultPrimaryModel]);

  useEffect(() => { projectRef.current = project; }, [project]);

  const api = typeof window !== 'undefined' ? window.api?.localData?.stylofact : null;

  const hydrate = useCallback(async (projectId) => {
    if (!api) return null;
    const result = await api.projects.get(projectId);
    setProject(result.project);
    setSources(result.sources || []);
    setArtifacts(result.artifacts || []);
    setRuns(result.runs || []);
    projectRef.current = result.project;
    return result;
  }, [api]);

  const refreshProjects = useCallback(async () => {
    if (!api) return [];
    const listed = await api.projects.list({ limit: 100 });
    setProjects(listed || []);
    return listed || [];
  }, [api]);

  const createProject = useCallback(async (overrides = {}) => {
    if (!api) throw new Error('Stylofact storage is not available.');
    const created = await api.projects.create({
      title: overrides.title || 'Untitled Stylofact',
      primaryModel: overrides.primaryModel ?? defaultPrimaryModel,
      criticModel: overrides.criticModel ?? defaultCriticModel,
      approvalMode: overrides.approvalMode || 'manual',
    });
    await refreshProjects();
    return hydrate(created.row.id);
  }, [api, defaultCriticModel, defaultPrimaryModel, hydrate, refreshProjects]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!api) {
        if (alive) {
          setError('Stylofact needs the desktop data bridge.');
          setIsLoading(false);
        }
        return;
      }
      try {
        const listed = await refreshProjects();
        if (!alive) return;
        if (listed[0]) await hydrate(listed[0].id);
        else await createProject();
      } catch (loadError) {
        if (alive) setError(loadError?.message || 'Stylofact could not load.');
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api, createProject, hydrate, refreshProjects]);

  useEffect(() => {
    if (!window.api?.onLanggraphStreamEvent) return undefined;
    const unsubscribe = window.api.onLanggraphStreamEvent(({ streamId, type, payload }) => {
      const run = streamsRef.current.get(streamId);
      if (!run) return;
      if (type === 'text' && payload?.content) {
        run.text += payload.content;
        setStreamPreview(run.text);
      }
      if (type === 'error') {
        streamsRef.current.delete(streamId);
        run.reject(new Error(payload?.message || 'The Stylofact agent failed.'));
      }
      if (type === 'end') {
        streamsRef.current.delete(streamId);
        run.resolve(run.text);
      }
    });
    return () => {
      unsubscribe?.();
      streamsRef.current.forEach((run) => run.reject(new Error('Stylofact was closed before the run completed.')));
      streamsRef.current.clear();
    };
  }, []);

  const runAgent = useCallback(async ({ stage, model, prompt }) => {
    if (!model) throw new Error('Choose an available primary model first.');
    if (!window.api?.langgraphCreateThread || !window.api?.langgraphStreamMessage) {
      throw new Error('Stylofact cannot reach the local AI runtime.');
    }
    const thread = await window.api.langgraphCreateThread('stylofact');
    const threadId = thread?.thread_id;
    if (!threadId) throw new Error('Stylofact could not create an AI workspace.');
    const streamId = newId(`stylofact-${stage}`);
    setRunState({ stage, model, label: `Running ${stage.replace(/-/g, ' ')}…` });
    setStreamPreview('');
    let resolveStream;
    let rejectStream;
    const completed = new Promise((resolve, reject) => {
      resolveStream = resolve;
      rejectStream = reject;
    });
    // The renderer receives stream events while the IPC promise is still
    // pending. Attach a rejection observer immediately so an early agent
    // error is delivered to the caller without becoming an unhandled promise.
    completed.catch(() => {});
    streamsRef.current.set(streamId, { text: '', resolve: resolveStream, reject: rejectStream });
    try {
      await window.api.langgraphStreamMessage(
        streamId,
        threadId,
        `[Use skill: stylofact]\n\n${prompt}`,
        makeAgentConfig(model, stage),
      );
      const text = await completed;
      return { text, threadId };
    } catch (runError) {
      const active = streamsRef.current.get(streamId);
      if (active) {
        streamsRef.current.delete(streamId);
        active.reject(runError);
      }
      throw runError;
    } finally {
      setRunState(null);
    }
  }, []);

  const recordRun = useCallback(async (stage, status, details) => {
    const activeProject = projectRef.current;
    if (!api || !activeProject) return;
    try {
      const created = await api.runs.create(activeProject.id, {
        stage,
        modelName: details?.modelName || activeProject.primaryModel,
        criticModelName: details?.criticModelName || activeProject.criticModel,
        status,
        input: details?.input || {},
        result: details?.result || {},
        error: details?.error || null,
      });
      setRuns((current) => [created.row, ...current]);
    } catch {
      // A failed audit-log append must not discard a successful user artifact.
    }
  }, [api]);

  const updateProject = useCallback(async (patch) => {
    const current = projectRef.current;
    if (!api || !current) throw new Error('No Stylofact project is active.');
    try {
      const result = await api.projects.update(current.id, current.revision, patch);
      setProject(result.row);
      projectRef.current = result.row;
      await refreshProjects();
      return result.row;
    } catch (updateError) {
      if (updateError?.code === 'REVISION_CONFLICT') {
        const refreshed = await hydrate(current.id);
        const retry = await api.projects.update(refreshed.project.id, refreshed.project.revision, patch);
        setProject(retry.row);
        projectRef.current = retry.row;
        await refreshProjects();
        return retry.row;
      }
      throw updateError;
    }
  }, [api, hydrate, refreshProjects]);

  const selectProject = useCallback(async (projectId) => {
    setIsLoading(true);
    setError(null);
    try { return await hydrate(projectId); }
    finally { setIsLoading(false); }
  }, [hydrate]);

  const addSource = useCallback(async (role, source) => {
    const current = projectRef.current;
    if (!api || !current) throw new Error('No Stylofact project is active.');
    if (!String(source?.bodyText || '').trim()) throw new Error('Paste text or drop a readable text file first.');
    await api.sources.create(current.id, { role, ...source });
    await hydrate(current.id);
    await refreshProjects();
  }, [api, hydrate, refreshProjects]);

  const dropSource = useCallback(async (role, item) => {
    const path = item?.path;
    if (!path) throw new Error('This file does not have a readable local path.');
    const result = await window.api?.agentReadFile?.(path, 750 * 1024);
    if (!result?.content || result.error) throw new Error(result?.error || 'The dropped file could not be read as text.');
    return addSource(role, {
      origin: 'drop',
      label: item.name || path.split('/').pop() || 'Dropped source',
      filePath: path,
      bodyText: result.content,
      provenance: { totalSize: result.totalSize || null, truncated: !!result.truncated },
    });
  }, [addSource]);

  const removeSource = useCallback(async (source) => {
    if (!api || !source) return;
    await api.sources.archive(source.id, source.revision);
    if (projectRef.current) {
      await hydrate(projectRef.current.id);
      await refreshProjects();
    }
  }, [api, hydrate, refreshProjects]);

  const styleSources = useMemo(() => sources.filter((source) => source.role === 'style'), [sources]);
  const thematicSources = useMemo(() => sources.filter((source) => source.role === 'thematic'), [sources]);
  const styleCorpus = useMemo(() => corpusFromSources(styleSources, { includeSourceLabels: false }), [styleSources]);
  const thematicCorpus = useMemo(() => corpusFromSources(thematicSources), [thematicSources]);
  const activeProfile = useMemo(() => profileForGeneration(project), [project]);

  const runVoiceAnalysis = useCallback(async () => {
    const current = projectRef.current;
    if (!current) throw new Error('No Stylofact project is active.');
    if (!styleCorpus.trim()) throw new Error('Add self-authored writing to the voice corpus first.');
    const metrics = analyzeStylometry(styleCorpus, {
      sourceCount: styleSources.length,
      genresOrMedia: ['user-supplied voice corpus'],
      mixedGenres: styleSources.length > 1,
    });
    const styleProfile = compileStyleProfile(metrics);
    try {
      const saved = await updateProject({
        stage: 'theme',
        profileChoice: 'primary',
        styleMetrics: metrics,
        styleProfile,
        styleReview: {},
      });
      await recordRun('voice', 'completed', {
        modelName: 'local:stylofact-metrics',
        criticModelName: null,
        input: {
          sourceCount: styleSources.length,
          wordCount: metrics.scope.wordCount,
          corpusFingerprint: metrics.scope.corpusFingerprint,
          deterministic: true,
        },
        result: {
          analyzerVersion: metrics.analyzerVersion,
          profileBuilder: styleProfile.stylofact_profile.profile_builder,
          confidenceBand: metrics.scope.confidenceBand,
        },
      });
      return saved;
    } catch (runError) {
      await recordRun('voice', 'failed', { modelName: 'local:stylofact-metrics', criticModelName: null, error: runError?.message });
      throw runError;
    }
  }, [recordRun, styleCorpus, styleSources.length, updateProject]);

  const runExtraction = useCallback(async () => {
    const current = projectRef.current;
    if (!current) throw new Error('No Stylofact project is active.');
    if (!current.targetPrompt?.trim()) throw new Error('Describe the idea you want to find in the thematic corpus.');
    if (!thematicCorpus.trim()) throw new Error('Add notes, conversations, or other thematic material first.');
    const primaryModel = current.primaryModel || defaultPrimaryModel;
    const sample = sampleForAgent(thematicCorpus);
    const request = {
      operation: 'thematic_extraction',
      user_prompt: current.targetPrompt,
      corpus_sampling: { sampled: sample.sampled, original_character_count: sample.sourceCharacters },
      noisy_corpus: sample.text,
      instructions: 'Execute Stage 2 exactly. Apply the zero-alteration rule. Return only the required JSON object.',
    };
    try {
      const response = await runAgent({ stage: 'extract', model: primaryModel, prompt: JSON.stringify(request) });
      const extraction = normalizeExtraction(decodeJson(response.text), thematicCorpus);
      const allIds = extraction.extracted_artifacts.map((artifact) => artifact.artifact_id);
      const saved = await updateProject({
        stage: current.approvalMode === 'automatic' ? 'blueprint' : 'review',
        extraction,
        selectedArtifactIds: current.approvalMode === 'automatic' ? allIds : [],
      });
      await recordRun('extract', 'completed', {
        modelName: primaryModel,
        input: { sourceCount: thematicSources.length, sampled: sample.sampled, query: current.targetPrompt },
        result: { acceptedArtifactCount: extraction.extracted_artifacts.length, rejectedNonverbatim: extraction.corpus_diagnostics.rejected_nonverbatim_artifacts },
      });
      return { saved, extraction };
    } catch (runError) {
      await recordRun('extract', 'failed', { error: runError?.message });
      throw runError;
    }
  }, [defaultPrimaryModel, recordRun, runAgent, thematicCorpus, thematicSources.length, updateProject]);

  const approveArtifacts = useCallback(async (artifactIds) => {
    if (!Array.isArray(artifactIds) || !artifactIds.length) {
      throw new Error('Choose at least one extracted thought before moving on.');
    }
    return updateProject({ stage: 'blueprint', selectedArtifactIds: artifactIds });
  }, [updateProject]);

  const buildBlueprint = useCallback(async () => {
    const current = projectRef.current;
    if (!current) throw new Error('No Stylofact project is active.');
    const selected = (current.extraction?.extracted_artifacts || [])
      .filter((artifact) => current.selectedArtifactIds?.includes(artifact.artifact_id));
    if (!selected.length) throw new Error('Approve at least one extract before requesting a blueprint.');
    const primaryModel = current.primaryModel || defaultPrimaryModel;
    const request = {
      operation: 'dissemination_blueprint',
      user_prompt: current.targetPrompt,
      active_style_profile: activeProfile,
      approved_artifacts: selected,
      instructions: 'Execute Stage 4 exactly. Use only approved artifacts as factual material. Return only the required JSON object.',
    };
    try {
      const response = await runAgent({ stage: 'blueprint', model: primaryModel, prompt: JSON.stringify(request) });
      const blueprint = normalizeBlueprint(decodeJson(response.text));
      const saved = await updateProject({ stage: 'generate', blueprint });
      await recordRun('blueprint', 'completed', {
        modelName: primaryModel,
        input: { approvedArtifactCount: selected.length },
        result: { workingTitle: blueprint?.blueprint?.working_title || '' },
      });
      return saved;
    } catch (runError) {
      await recordRun('blueprint', 'failed', { error: runError?.message });
      throw runError;
    }
  }, [activeProfile, defaultPrimaryModel, recordRun, runAgent, updateProject]);

  const generateArtifacts = useCallback(async ({ formats, variations }) => {
    const current = projectRef.current;
    if (!current) throw new Error('No Stylofact project is active.');
    if (!current.blueprint?.blueprint && !current.blueprint?.working_title) {
      throw new Error('Create a dissemination blueprint before generating content.');
    }
    const requestedFormats = [...new Set((formats || []).map(String).filter(Boolean))].slice(0, MAX_GENERATION_FORMATS);
    if (!requestedFormats.length) throw new Error('Choose at least one output medium.');
    const variationCount = Math.max(1, Math.min(MAX_VARIATIONS, Number.parseInt(variations, 10) || 1));
    const primaryModel = current.primaryModel || defaultPrimaryModel;
    const criticModel = independentCriticFor(primaryModel, current.criticModel || defaultCriticModel, availableModels);
    const request = {
      operation: 'generate_content_variations',
      active_style_profile: activeProfile,
      blueprint: current.blueprint,
      formats: requestedFormats,
      variation_count: variationCount,
      instructions: 'Execute Stages 5 and 6 exactly. Return only the required JSON object. Do not invent unsupported facts.',
    };
    try {
      const response = await runAgent({ stage: 'generate', model: primaryModel, prompt: JSON.stringify(request) });
      const primaryOutputs = normalizeOutputs(decodeJson(response.text));
      if (!primaryOutputs.length) throw new Error('The model returned no usable content variations. Try a smaller request.');
      let reviewedOutputs = [];
      if (criticModel) {
        const reviewRequest = {
          operation: 'review_generated_content',
          active_style_profile: activeProfile,
          blueprint: current.blueprint,
          drafts: primaryOutputs,
          instructions: 'Execute the Stage 5 and 6 reviewer task. Return exactly one revised output for each supplied draft. Return only the required JSON object.',
        };
        const reviewResponse = await runAgent({ stage: 'generate-review', model: criticModel, prompt: JSON.stringify(reviewRequest) });
        reviewedOutputs = normalizeOutputs(decodeJson(reviewResponse.text));
      }
      const reviewedByKey = new Map(reviewedOutputs.map((output) => [`${output.medium}:${output.variation}`, output]));
      const savedArtifacts = primaryOutputs.map((output) => {
        const revised = reviewedByKey.get(`${output.medium}:${output.variation}`);
        const finalContent = revised?.content || output.content;
        return {
          medium: output.medium,
          variation: output.variation,
          title: revised?.title || output.title,
          content: finalContent,
          draftContent: output.content,
          criticContent: revised?.content || null,
          voiceEvaluation: evaluateVoiceFit(finalContent, activeProfile),
          sourceBrief: { sourceArtifactIds: output.sourceArtifactIds, deploymentNote: revised?.deploymentNote || output.deploymentNote },
          primaryModel,
          criticModel,
        };
      });
      const persisted = await api.artifacts.replace(current.id, savedArtifacts);
      setArtifacts(persisted.rows || []);
      const saved = await updateProject({
        stage: 'complete',
        generationOptions: { formats: requestedFormats, variations: variationCount, reviewedBySecondProvider: !!criticModel },
      });
      await recordRun('generate', 'completed', {
        modelName: primaryModel,
        criticModelName: criticModel,
        input: { formats: requestedFormats, variations: variationCount },
        result: { outputCount: savedArtifacts.length, reviewedOutputCount: reviewedOutputs.length },
      });
      await refreshProjects();
      return { saved, artifacts: persisted.rows || [] };
    } catch (runError) {
      await recordRun('generate', 'failed', { error: runError?.message });
      throw runError;
    }
  }, [activeProfile, api, availableModels, defaultCriticModel, defaultPrimaryModel, recordRun, refreshProjects, runAgent, updateProject]);

  const chooseArtifactVersion = useCallback(async (artifactId, version) => {
    const current = projectRef.current;
    if (!api || !current) return;
    const next = artifacts.map((artifact) => ({
      medium: artifact.medium,
      variation: artifact.variation,
      title: artifact.title,
      content: artifact.id === artifactId && version === 'draft' ? artifact.draftContent : artifact.id === artifactId && version === 'critic'
        ? (artifact.criticContent || artifact.content)
        : artifact.content,
      draftContent: artifact.draftContent,
      criticContent: artifact.criticContent,
      voiceEvaluation: artifact.voiceEvaluation,
      sourceBrief: artifact.sourceBrief,
      primaryModel: artifact.primaryModel,
      criticModel: artifact.criticModel,
    }));
    const persisted = await api.artifacts.replace(current.id, next);
    setArtifacts(persisted.rows || []);
    await refreshProjects();
  }, [api, artifacts, refreshProjects]);

  const archiveProject = useCallback(async (target = projectRef.current) => {
    if (!api || !target) return;
    await api.projects.archive(target.id, target.revision);
    const listed = await refreshProjects();
    if (listed[0]) await hydrate(listed[0].id);
    else await createProject();
  }, [api, createProject, hydrate, refreshProjects]);

  return {
    projects,
    project,
    sources,
    styleSources,
    thematicSources,
    styleCorpus,
    thematicCorpus,
    activeProfile,
    artifacts,
    runs,
    availableModels,
    defaultPrimaryModel,
    defaultCriticModel,
    isLoading,
    runState,
    streamPreview,
    error,
    setError,
    createProject,
    selectProject,
    updateProject,
    addSource,
    dropSource,
    removeSource,
    runVoiceAnalysis,
    runExtraction,
    approveArtifacts,
    buildBlueprint,
    generateArtifacts,
    chooseArtifactVersion,
    archiveProject,
  };
}
