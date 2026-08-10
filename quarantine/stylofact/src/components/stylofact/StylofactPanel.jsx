import { useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SOURCE_FILE_TYPE } from '../FileTree';
import { useStylofact } from './useStylofact';
import './StylofactPanel.css';

const PIPELINE_STEPS = [
  { id: 'voice', number: '1', label: 'Voice' },
  { id: 'theme', number: '2', label: 'Material' },
  { id: 'review', number: '3', label: 'Review' },
  { id: 'blueprint', number: '4', label: 'Blueprint' },
  { id: 'generate', number: '5', label: 'Generate' },
];

function visibleStage(projectStage) {
  if (projectStage === 'extract') return 'review';
  if (projectStage === 'complete') return 'generate';
  return PIPELINE_STEPS.some((step) => step.id === projectStage) ? projectStage : 'voice';
}

const RUN_STAGE_LABELS = {
  voice: 'Voice profile (measured locally)',
  extract: 'Find material (Stage 2 extraction)',
  blueprint: 'Build blueprint (Stage 4)',
  generate: 'Generate content (Stages 5–6)',
};

// Open the AI visibility timeline focused on the audit turn behind a run, so
// the exact request/response/error evidence is one click away — never a trip
// to the provider's dashboard.
function openAuditTurn(turnId) {
  if (!turnId) return;
  window.dispatchEvent(new CustomEvent('briizos:ai-visibility:open', { detail: { turnId } }));
}

function StageError({ error, onDismiss }) {
  if (!error) return null;
  const detail = typeof error === 'object' ? error : { message: error };
  const providerLine = [
    detail.provider && detail.model ? `${detail.provider} · ${detail.model}` : detail.model || detail.provider,
    detail.status != null ? `HTTP ${detail.status}` : null,
    detail.code != null ? `code ${detail.code}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <div className="stylofact-error" role="alert">
      <div className="stylofact-error-body">
        <span>{detail.message || 'Stylofact could not complete that step.'}</span>
        {providerLine && <small className="stylofact-error-provider">{providerLine}</small>}
        {detail.nextAction && <small className="stylofact-error-next"><strong>Next:</strong> {detail.nextAction}</small>}
        {detail.turnId && (
          <button type="button" className="stylofact-text-button" onClick={() => openAuditTurn(detail.turnId)}>
            View the full AI record
          </button>
        )}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error">×</button>
    </div>
  );
}

function RunHistory({ runs }) {
  if (!runs.length) return null;
  const failedCount = runs.filter((run) => run.status === 'failed').length;
  return (
    <details className="stylofact-disclosure stylofact-run-history">
      <summary>Run history · {runs.length}{failedCount ? ` · ${failedCount} failed` : ''}</summary>
      <ul aria-label="Recent Stylofact runs">
        {runs.slice(0, 12).map((run) => {
          const detail = run.result?.errorDetail || null;
          const turnId = run.agentTurnId || detail?.turnId || null;
          return (
            <li key={run.id} className={`stylofact-run stylofact-run-${run.status}`}>
              <div className="stylofact-run-head">
                <strong>{RUN_STAGE_LABELS[run.stage] || run.stage}</strong>
                <span>{new Date(run.createdAt).toLocaleString()} · {run.modelName || 'local'}</span>
                <em className={`stylofact-run-status status-${run.status}`}>{run.status}</em>
              </div>
              {run.status === 'failed' && run.error && <p className="stylofact-run-error">{run.error}</p>}
              {run.status === 'failed' && detail?.nextAction && <p className="stylofact-run-next"><strong>Next:</strong> {detail.nextAction}</p>}
              {turnId && (
                <button type="button" className="stylofact-text-button" onClick={() => openAuditTurn(turnId)}>
                  View the full AI record
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

const OUTPUT_FORMATS = [
  { id: 'slide_deck_script', label: 'Slide deck script', note: 'Narration and visual beats for video or slides.' },
  { id: 'infographic_brief', label: 'Infographic brief', note: 'A concise editorial and visual specification.' },
  { id: 'short_form_social', label: 'Short-form social', note: 'A tightly deployed post or thread starter.' },
  { id: 'advertisement_copy', label: 'Advertisement copy', note: 'A compact persuasive set with a clear action.' },
  { id: 'blog_post', label: 'Blog post', note: 'A developed argument with a readable arc.' },
  { id: 'technical_writing', label: 'Technical writing', note: 'A structured explanation for a practical audience.' },
];

function wordCount(text) {
  return String(text || '').match(/[\p{L}\p{N}]+/gu)?.length || 0;
}

function CorpusWorkbench({ role, sources, onAdd, onDrop, onRemove, disabled, onError }) {
  const [label, setLabel] = useState('');
  const [draft, setDraft] = useState('');
  const isVoice = role === 'style';
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: SOURCE_FILE_TYPE,
    drop: async (item) => {
      try { await onDrop(role, item); }
      catch (error) { onError(error?.message || 'That source could not be added.'); }
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  const addDraft = async () => {
    try {
      await onAdd(role, {
        origin: 'paste',
        label: label.trim() || (isVoice ? 'Pasted voice sample' : 'Pasted thematic material'),
        bodyText: draft,
        provenance: { manuallyPasted: true },
      });
      setDraft('');
      setLabel('');
    } catch (error) {
      onError(error?.message || 'That source could not be added.');
    }
  };

  const sourceWordCount = sources.reduce((total, source) => total + wordCount(source.bodyText), 0);

  return (
    <div ref={drop} className={`stylofact-corpus ${isOver && canDrop ? 'is-dropping' : ''}`}>
      <div className="stylofact-source-summary" aria-live="polite">
        <strong>{sources.length} source{sources.length === 1 ? '' : 's'}</strong>
        <span>{sourceWordCount.toLocaleString()} words</span>
        <span>Drop a text file anywhere in this area</span>
      </div>
      <details className="stylofact-disclosure">
        <summary>{isVoice ? 'Add writing sample' : 'Add pasted material'}</summary>
        <div className="stylofact-source-form">
          <label className="stylofact-field">
            <span>Name</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={isVoice ? 'Essays, spring 2026' : 'Music theory notes'}
              disabled={disabled}
            />
          </label>
          <label className="stylofact-field stylofact-field-textarea">
            <span>Text</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={isVoice ? 'Paste writing you authored…' : 'Paste conversations, notes, or excerpts…'}
              disabled={disabled}
              rows={5}
            />
          </label>
          <div className="stylofact-source-actions">
            <span>{wordCount(draft).toLocaleString()} words</span>
            <button type="button" className="stylofact-button secondary" onClick={addDraft} disabled={disabled || !draft.trim()}>
              Add source
            </button>
          </div>
        </div>
      </details>
      {sources.length > 0 && (
        <details className="stylofact-disclosure stylofact-source-review">
          <summary>Review sources</summary>
          <ul className="stylofact-source-list" aria-label={`${isVoice ? 'Voice' : 'Thematic'} sources`}>
            {sources.map((source) => (
              <li key={source.id}>
                <div>
                  <strong>{source.label || 'Untitled source'}</strong>
                  <span>{wordCount(source.bodyText).toLocaleString()} words{source.provenance?.truncated ? ' · excerpted from a larger file' : ''}</span>
                </div>
                <button type="button" className="stylofact-icon-button" aria-label={`Remove ${source.label || 'source'}`} onClick={() => onRemove(source)} disabled={disabled}>×</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function MetricStrip({ project, corpus }) {
  const metrics = project?.styleMetrics;
  const scope = metrics?.scope;
  if (!scope) return null;
  const sentenceMean = metrics?.syntax?.sentenceLengthWords?.mean;
  const ttr = metrics?.lexical?.movingAverageTtr100;
  return (
    <details className="stylofact-disclosure stylofact-metric-strip">
      <summary>{scope.wordCount.toLocaleString()} measured words · {scope.confidenceBand} confidence</summary>
      <div className="stylofact-measurement-grid" aria-label="Measured voice corpus summary">
        <div><span>Average sentence</span><strong>{sentenceMean} words</strong></div>
        <div><span>Vocabulary variation</span><strong>{ttr}</strong></div>
      </div>
      <details className="stylofact-raw-measurements">
        <summary>Raw measurements</summary>
        <pre>{JSON.stringify(metrics, null, 2)}</pre>
      </details>
      {!corpus && <span className="stylofact-warning">Add your writing to generate measurements.</span>}
    </details>
  );
}

function CorpusNavigatorCard({ corpora, busy, onConnect, onRefresh, onRebuild, onPause, onUnlink }) {
  const visible = corpora.filter((corpus) => corpus.sourceKind !== 'project-sources');
  return (
    <div className="stylofact-navigator" aria-label="Chat history corpus">
      <div className="stylofact-navigator-head">
        <button type="button" className="stylofact-button secondary" onClick={onConnect} disabled={busy}>
          {visible.length ? 'Connect another archive' : 'Connect an archive'}
        </button>
      </div>
      {!visible.length ? (
        <p className="stylofact-empty">No archive connected.</p>
      ) : visible.map((corpus) => {
        const total = Math.max(0, corpus.progressTotal || corpus.chunkCount || 0);
        const current = Math.min(total, Math.max(0, corpus.progressCurrent || 0));
        return (
          <article className="stylofact-corpus-status" key={corpus.id}>
            <div className="stylofact-corpus-status-title">
              <div><strong>{corpus.name}</strong><span>{corpus.rootPath}</span></div>
              <span className={`stylofact-index-state state-${corpus.state}`}>{corpus.state.replace(/-/g, ' ')}</span>
            </div>
            <div className="stylofact-corpus-counts">
              <span><strong>{corpus.conversationCount.toLocaleString()}</strong> conversations</span>
              <span><strong>{corpus.userMessageCount.toLocaleString()}</strong> Alex messages</span>
              <span><strong>{corpus.contextMessageCount.toLocaleString()}</strong> AI context turns</span>
            </div>
            {['scanning', 'semantic-indexing'].includes(corpus.state) && <progress className="stylofact-index-progress" aria-label={corpus.progressMessage || 'Indexing progress'} max={total || 1} value={current} />}
            <p>{corpus.progressMessage || 'Waiting to inspect this archive.'}{corpus.error ? ` ${corpus.error}` : ''}</p>
            <details className="stylofact-disclosure stylofact-archive-options">
              <summary>Archive options</summary>
              <div className="stylofact-corpus-status-actions">
                <button type="button" className="stylofact-text-button" onClick={() => onRefresh(corpus)} disabled={busy || corpus.state === 'scanning'}>Refresh</button>
                {['semantic-indexing', 'paused'].includes(corpus.state) && <button type="button" className="stylofact-text-button" onClick={() => onPause(corpus, !corpus.paused)} disabled={busy || !corpus.chunkCount}>{corpus.paused ? 'Resume semantic search' : 'Pause semantic search'}</button>}
                <button type="button" className="stylofact-text-button" onClick={() => onRebuild(corpus)} disabled={busy || corpus.state === 'scanning'}>Rebuild index</button>
                <button type="button" className="stylofact-text-button danger" onClick={() => onUnlink(corpus)} disabled={busy}>Disconnect</button>
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}

function SourceViewer({ source, onClose }) {
  if (!source) return null;
  return (
    <div className="stylofact-receipt-overlay" role="dialog" aria-modal="true" aria-label="Archived source context">
      <section className="stylofact-source-viewer">
        <header><h3>{source.conversationTitle}</h3><button type="button" className="stylofact-icon-button" onClick={onClose} aria-label="Close source">×</button></header>
        <div className="stylofact-conversation-context">
          {source.context.map((message) => (
            <article key={message.messageId} className={`role-${message.role} ${message.messageId === source.locator.messageId ? 'is-evidence' : ''}`}>
              <span>{message.role === 'user' ? 'Alex · evidence' : 'AI · context only'}</span>
              {message.messageId === source.locator.messageId ? (
                <p>{message.text.slice(0, source.locator.startChar)}<mark>{message.text.slice(source.locator.startChar, source.locator.endChar)}</mark>{message.text.slice(source.locator.endChar)}</p>
              ) : <p>{message.text}</p>}
            </article>
          ))}
        </div>
        <footer><code>{source.locator.messageId} · chars {source.locator.startChar}–{source.locator.endChar}</code><strong>Exact text verified</strong></footer>
      </section>
    </div>
  );
}

function RetrievalReceipt({ receipt, onClose, onOpenSource }) {
  if (!receipt) return null;
  const { run, candidates } = receipt;
  const selected = candidates.filter((candidate) => candidate.selected);
  const omitted = candidates.filter((candidate) => !candidate.selected);
  const directContexts = run.packedContext.filter((context) => context.directProjectSource);
  const searches = run.searchPlan?.searches || [];
  return (
    <div className="stylofact-receipt-overlay" role="dialog" aria-modal="true" aria-label="Stylofact search receipt">
      <section className="stylofact-receipt">
        <header><h3>Search receipt</h3><button type="button" className="stylofact-icon-button" onClick={onClose} aria-label="Close receipt">×</button></header>
        <div className="stylofact-receipt-summary">
          <div><span>Mode</span><strong>{run.searchMode.replace(/-/g, ' ')}</strong></div><div><span>Corpora</span><strong>{run.corpusSnapshot.length}</strong></div><div><span>Searches</span><strong>{searches.length}</strong></div><div><span>Sent to AI</span><strong>{run.packedContext.length} passages</strong></div><div><span>Elapsed</span><strong>{run.durationMs == null ? 'running' : `${(run.durationMs / 1000).toFixed(1)}s`}</strong></div>
        </div>
        <div className="stylofact-receipt-section"><h4>What Stylofact searched</h4><p>{run.queryText}</p>{searches.map((search, index) => <div className="stylofact-query-row" key={`${search.at}-${index}`}>{(search.queries || []).map((query) => <code key={typeof query === 'string' ? query : query.text}>{typeof query === 'string' ? query : query.text}</code>)}</div>)}</div>
        <div className="stylofact-receipt-section"><h4>Verified passages sent to the extractor</h4>{directContexts.map((context) => <article className="stylofact-receipt-candidate selected" key={context.locator.sourceId}><div><strong>{context.conversationTitle}</strong><span>Direct project source</span></div><p>{context.exactText}</p></article>)}{selected.length ? selected.map((candidate) => <article className="stylofact-receipt-candidate selected" key={candidate.id}><div><strong>{candidate.conversationTitle}</strong><span>{candidate.messageAt ? new Date(candidate.messageAt).toLocaleDateString() : 'Date unavailable'} · fused {candidate.fusionScore.toFixed(4)}</span></div><p>{candidate.exactText}</p><button type="button" className="stylofact-text-button" onClick={() => onOpenSource(candidate.locator)}>Open exact context</button></article>) : !directContexts.length && <p>No fetched archive passage was sent during this run.</p>}</div>
        {omitted.length > 0 && <details className="stylofact-receipt-omitted"><summary>{omitted.length} ranked candidates not sent</summary>{omitted.slice(0, 80).map((candidate) => <div key={candidate.id}><strong>{candidate.conversationTitle}</strong><span>{candidate.exclusionReason || 'Not fetched by the extraction agent'}</span></div>)}</details>}
        <details className="stylofact-receipt-raw"><summary>Raw trace and audit identifiers</summary><pre>{JSON.stringify(receipt, null, 2)}</pre></details>
      </section>
    </div>
  );
}

function StageNavigation({ activeStage, projectStage, onSelect }) {
  const completedIndex = projectStage === 'complete'
    ? PIPELINE_STEPS.length - 1
    : PIPELINE_STEPS.findIndex((step) => step.id === visibleStage(projectStage));
  return (
    <nav className="stylofact-stage-navigation" aria-label="Stylofact pipeline">
      <ol>
        {PIPELINE_STEPS.map((step, index) => (
          <li key={step.id} className={index < completedIndex || projectStage === 'complete' ? 'complete' : ''}>
            <button
              type="button"
              className={activeStage === step.id ? 'active' : ''}
              aria-current={activeStage === step.id ? 'step' : undefined}
              onClick={() => onSelect(step.id)}
            >
              <span>{step.number}</span>
              {step.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ProfilePreview({ project, onUsePrimary, onUseReview }) {
  const profile = project?.styleProfile?.stylofact_profile || project?.styleProfile;
  const review = project?.styleReview?.review;
  if (!profile || !Object.keys(profile).length) return null;
  return (
    <div className="stylofact-profile-preview">
      <div className="stylofact-result-head">
        <strong>Voice profile ready</strong>
        {review?.verdict && <span>Review: {review.verdict}</span>}
      </div>
      <p>{profile.generation_directive || 'The profile has no generation directive yet.'}</p>
      {review?.reviewer_note && <p className="stylofact-review-note">{review.reviewer_note}</p>}
      {review?.revised_generation_directive && (
        <div className="stylofact-profile-choice" role="group" aria-label="Choose the active generation directive">
          <button type="button" className={project.profileChoice !== 'review' ? 'active' : ''} onClick={onUsePrimary}>Use primary directive</button>
          <button type="button" className={project.profileChoice === 'review' ? 'active' : ''} onClick={onUseReview}>Use reviewed directive</button>
        </div>
      )}
      {profile.profile_scope?.limitations?.length > 0 && (
        <details className="stylofact-disclosure stylofact-limitations">
          <summary>Profile limitations</summary>
          <ul>
            {profile.profile_scope.limitations.map((limitation, index) => <li key={`${limitation}-${index}`}>{limitation}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function ArtifactCard({ artifact, onChooseVersion, onCopy }) {
  const evaluation = artifact.voiceEvaluation || {};
  return (
    <details className="stylofact-artifact-card">
      <summary className="stylofact-artifact-head">
        <span className="stylofact-artifact-identity">
          <strong>{artifact.title || `Variation ${artifact.variation}`}</strong>
          <span>{artifact.medium.replace(/_/g, ' ')}</span>
        </span>
        <span className={`stylofact-fit ${evaluation.status || 'insufficient_data'}`}>Voice fit: {evaluation.status || 'insufficient data'}</span>
      </summary>
      <div className="stylofact-artifact-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
      </div>
      <div className="stylofact-artifact-actions">
        <button type="button" className="stylofact-text-button" onClick={() => onCopy(artifact.content)}>Copy</button>
        {artifact.criticContent && (
          <div className="stylofact-version-choice" role="group" aria-label={`Choose variation ${artifact.variation} version`}>
            <button type="button" onClick={() => onChooseVersion(artifact.id, 'draft')}>Primary</button>
            <button type="button" onClick={() => onChooseVersion(artifact.id, 'critic')}>Reviewed</button>
          </div>
        )}
      </div>
      {evaluation.measurements?.length > 0 && (
        <div className="stylofact-fit-detail">
          {evaluation.measurements.filter((measurement) => measurement.status !== 'insufficient_data').map((measurement) => (
            <span key={measurement.metric} className={measurement.status}>{measurement.metric}: {measurement.status}</span>
          ))}
        </div>
      )}
    </details>
  );
}

export default function StylofactPanel({ models, selectedModel, isModelAvailable }) {
  const {
    projects,
    project,
    styleSources,
    thematicSources,
    styleCorpus,
    thematicCorpus,
    artifacts,
    runs,
    corpora,
    availableModels,
    defaultPrimaryModel,
    isLoading,
    runState,
    streamPreview,
    pendingDecision,
    resolveDecision,
    error,
    setError,
    createProject,
    selectProject,
    updateProject,
    addSource,
    dropSource,
    removeSource,
    connectArchive,
    refreshCorpus,
    rebuildCorpus,
    setCorpusPaused,
    unlinkCorpus,
    getRetrievalReceipt,
    getSourceContext,
    runVoiceAnalysis,
    runExtraction,
    approveArtifacts,
    buildBlueprint,
    generateArtifacts,
    chooseArtifactVersion,
  } = useStylofact({ models, selectedModel, isModelAvailable });
  const [projectTitle, setProjectTitle] = useState('');
  const [targetPrompt, setTargetPrompt] = useState('');
  const [selectedExtracts, setSelectedExtracts] = useState([]);
  const [formats, setFormats] = useState(['short_form_social']);
  const [variations, setVariations] = useState(2);
  const [receipt, setReceipt] = useState(null);
  const [sourceView, setSourceView] = useState(null);
  const [activeStage, setActiveStage] = useState(() => visibleStage(project?.stage));
  const [actionPending, setActionPending] = useState(false);
  const actionPendingRef = useRef(false);

  useEffect(() => {
    setProjectTitle(project?.title || '');
    setTargetPrompt(project?.targetPrompt || '');
    setSelectedExtracts(project?.selectedArtifactIds || []);
    if (project?.generationOptions?.formats?.length) setFormats(project.generationOptions.formats);
    if (project?.generationOptions?.variations) setVariations(project.generationOptions.variations);
  }, [project?.id, project?.title, project?.targetPrompt, project?.selectedArtifactIds, project?.generationOptions]);

  useEffect(() => {
    setActiveStage(visibleStage(project?.stage));
  }, [project?.id, project?.stage]);

  const criticOptions = availableModels;
  const extractions = project?.extraction?.extracted_artifacts || [];
  const busy = actionPending || !!runState;
  const hasSearchableCorpus = corpora.some((corpus) => (
    ['scanning', 'lexical-ready', 'semantic-indexing', 'ready', 'paused', 'stale'].includes(corpus.state)
    && corpus.chunkCount > 0
  ));
  const latestRetrievalRunId = project?.extraction?.corpus_diagnostics?.retrieval_run_id
    || runs.find((run) => run.retrievalRunId)?.retrievalRunId
    || null;

  const act = async (task) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    setActionPending(true);
    setError(null);
    try { await task(); }
    catch (taskError) {
      // Keep the runtime's structured failure (provider, status, next action,
      // audit turn id) so the banner can explain what happened in-app.
      setError(taskError?.aiTurn
        ? { message: taskError.message, ...taskError.aiTurn }
        : (taskError?.message || 'Stylofact could not complete that step.'));
    }
    finally {
      actionPendingRef.current = false;
      setActionPending(false);
    }
  };

  const saveTargetPrompt = async () => {
    if (targetPrompt !== (project?.targetPrompt || '')) await updateProject({ targetPrompt });
  };

  const saveProjectTitle = async () => {
    if (projectTitle.trim() && projectTitle !== (project?.title || '')) await updateProject({ title: projectTitle });
  };

  const toggleFormat = (format) => {
    setFormats((current) => {
      if (current.includes(format)) return current.filter((entry) => entry !== format);
      return current.length >= 4 ? current : [...current, format];
    });
  };

  const toggleExtract = (artifactId) => {
    setSelectedExtracts((current) => current.includes(artifactId)
      ? current.filter((id) => id !== artifactId)
      : [...current, artifactId]);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError('Copy was unavailable. Select the content and copy it manually.');
    }
  };

  const openReceipt = async (retrievalRunId = latestRetrievalRunId) => {
    if (!retrievalRunId) return;
    setReceipt(await getRetrievalReceipt(retrievalRunId));
  };

  const openSource = async (locator) => {
    setSourceView(await getSourceContext(locator));
  };

  if (isLoading || !project) {
    return <div className="stylofact-loading" aria-live="polite">Preparing Stylofact…</div>;
  }

  return (
    <section className="stylofact-panel" aria-label="Stylofact content pipeline">
      <header className="stylofact-header">
        <h1>Stylofact</h1>
        <div className="stylofact-project-controls">
          <label>
            <span className="sr-only">Active Stylofact project</span>
            <select value={project.id} onChange={(event) => act(() => selectProject(event.target.value))} disabled={busy}>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.title || 'Untitled Stylofact'}</option>)}
            </select>
          </label>
          <details className="stylofact-project-menu">
            <summary>Project</summary>
            <div>
              <label className="stylofact-field stylofact-project-title">
                <span>Name</span>
                <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} onBlur={() => act(saveProjectTitle)} disabled={busy} placeholder="Project title" />
              </label>
              <button type="button" className="stylofact-button secondary" onClick={() => act(() => createProject())} disabled={busy}>New project</button>
            </div>
          </details>
        </div>
      </header>

      <StageNavigation activeStage={activeStage} projectStage={project.stage} onSelect={setActiveStage} />

      {runState && (
        <aside className="stylofact-running" aria-live="polite">
          <div><span className="stylofact-running-dot" />{runState.label}<small>{runState.model}</small></div>
          {streamPreview && <p>{streamPreview.slice(-360)}</p>}
        </aside>
      )}
      {pendingDecision && (
        <aside className="stylofact-decision" role="alertdialog" aria-live="assertive" aria-label="A paused AI process needs your decision">
          <div>
            <strong>This run is paused and awaiting your decision</strong>
            <p>{pendingDecision.summary}</p>
          </div>
          <div className="stylofact-decision-actions">
            <button type="button" className="stylofact-decision-deny" onClick={() => resolveDecision(false)}>Refuse and continue</button>
            <button type="button" className="stylofact-decision-grant" onClick={() => resolveDecision(true)}>Grant permission</button>
          </div>
        </aside>
      )}
      <StageError error={error} onDismiss={() => setError(null)} />
      <RunHistory runs={runs} />

      <main key={activeStage} className="stylofact-scroll">
        {activeStage === 'voice' && <section className="stylofact-section" aria-label="Voice stage">
          <details className="stylofact-disclosure stylofact-model-settings">
            <summary>Model settings</summary>
            <div className="stylofact-model-grid">
              <label className="stylofact-field">
                <span>Generation model</span>
                <select value={project.primaryModel || defaultPrimaryModel || ''} onChange={(event) => act(() => updateProject({ primaryModel: event.target.value }))} disabled={busy || !availableModels.length}>
                  {availableModels.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
                </select>
              </label>
              <label className="stylofact-field">
                <span>Reviewer</span>
                <select value={project.criticModel && criticOptions.some((model) => model.name === project.criticModel) ? project.criticModel : criticOptions[0]?.name || ''} onChange={(event) => act(() => updateProject({ criticModel: event.target.value || null }))} disabled={busy || !criticOptions.length}>
                  {!criticOptions.length && <option value="">Unavailable</option>}
                  {criticOptions.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
                </select>
              </label>
            </div>
          </details>
          <CorpusWorkbench role="style" sources={styleSources} onAdd={addSource} onDrop={dropSource} onRemove={(source) => act(() => removeSource(source))} disabled={busy} onError={setError} />
          <MetricStrip project={project} corpus={styleCorpus} />
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(runVoiceAnalysis)} disabled={busy || !styleCorpus.trim()}>
              Create voice profile
            </button>
            <span>{wordCount(styleCorpus).toLocaleString()} source words ready</span>
          </div>
          <ProfilePreview
            project={project}
            onUsePrimary={() => act(() => updateProject({ profileChoice: 'primary' }))}
            onUseReview={() => act(() => updateProject({ profileChoice: 'review' }))}
          />
        </section>}

        {activeStage === 'theme' && <section className="stylofact-section" aria-label="Material stage">
          <label className="stylofact-field stylofact-field-query">
            <span>What should Stylofact find?</span>
            <textarea value={targetPrompt} onChange={(event) => setTargetPrompt(event.target.value)} onBlur={() => act(saveTargetPrompt)} disabled={busy} rows={3} placeholder="Find my notes about…" />
          </label>
          <div className="stylofact-material-sources">
            <details className="stylofact-disclosure">
              <summary>Archives{hasSearchableCorpus ? ' · connected' : ''}</summary>
              <CorpusNavigatorCard
                corpora={corpora}
                busy={busy}
                onConnect={() => act(connectArchive)}
                onRefresh={(corpus) => act(() => refreshCorpus(corpus))}
                onRebuild={(corpus) => {
                  if (window.confirm('Rebuild this local search index from the connected archive? The original archive will not be changed.')) act(() => rebuildCorpus(corpus));
                }}
                onPause={(corpus, paused) => act(() => setCorpusPaused(corpus, paused))}
                onUnlink={(corpus) => {
                  if (window.confirm('Disconnect this archive from the current Stylofact project? The cached local index will be kept.')) act(() => unlinkCorpus(corpus));
                }}
              />
            </details>
            <details className="stylofact-disclosure">
              <summary>Pasted material{thematicSources.length ? ` · ${thematicSources.length}` : ''}</summary>
              <CorpusWorkbench role="thematic" sources={thematicSources} onAdd={addSource} onDrop={dropSource} onRemove={(source) => act(() => removeSource(source))} disabled={busy} onError={setError} />
            </details>
          </div>
          <details className="stylofact-disclosure stylofact-workflow-options">
            <summary>Workflow options</summary>
            <label className="stylofact-approval-toggle">
              <input type="checkbox" checked={project.approvalMode === 'automatic'} onChange={(event) => act(() => updateProject({ approvalMode: event.target.checked ? 'automatic' : 'manual' }))} disabled={busy} />
              <span><strong>Build the blueprint automatically</strong><small>Skip manual selection and use every verified result.</small></span>
            </label>
          </details>
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(async () => {
              await saveTargetPrompt();
              const result = await runExtraction();
              if (result.saved.approvalMode === 'automatic' && result.extraction.extracted_artifacts.length) await buildBlueprint();
            })} disabled={busy || (!thematicCorpus.trim() && !hasSearchableCorpus) || !targetPrompt.trim()}>
              Find material
            </button>
            <span>{hasSearchableCorpus ? 'Archive ready' : thematicSources.length ? `${thematicSources.length} pasted source${thematicSources.length === 1 ? '' : 's'} ready` : 'Connect an archive or add pasted material'}</span>
          </div>
        </section>}

        {activeStage === 'review' && <section className="stylofact-section" aria-label="Review stage">
          {extractions.length === 0 ? (
            <div className="stylofact-empty-state">
              <p>Find material before selecting evidence.</p>
              <button type="button" className="stylofact-button secondary" onClick={() => setActiveStage('theme')}>Go to material</button>
            </div>
          ) : (
            <>
              <div className="stylofact-selection-toolbar">
                <strong>{selectedExtracts.length} of {extractions.length} selected</strong>
                <button type="button" className="stylofact-text-button" onClick={() => setSelectedExtracts(extractions.map((artifact) => artifact.artifact_id))}>Select all</button>
                <button type="button" className="stylofact-text-button" onClick={() => setSelectedExtracts([])}>Clear</button>
              </div>
              <div className="stylofact-extract-grid">
                {extractions.map((artifact) => (
                  <label key={artifact.artifact_id} className={`stylofact-extract ${selectedExtracts.includes(artifact.artifact_id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedExtracts.includes(artifact.artifact_id)} onChange={() => toggleExtract(artifact.artifact_id)} disabled={busy} />
                    <span className="stylofact-extract-body">{artifact.verbatim_text}</span>
                    <span className="stylofact-extract-meta"><strong>{artifact.relevance_score.toFixed(2)}</strong>{artifact.provenance?.source_tag || 'Unlabelled source'}</span>
                  </label>
                ))}
              </div>
              {project.extraction?.corpus_diagnostics?.rejected_nonverbatim_artifacts > 0 && <p className="stylofact-warning">{project.extraction.corpus_diagnostics.rejected_nonverbatim_artifacts} model-proposed extract(s) were omitted because they did not match the supplied corpus exactly.</p>}
              <div className="stylofact-callout-action">
                <button type="button" className="stylofact-button primary" onClick={() => act(async () => {
                  await approveArtifacts(selectedExtracts);
                  await buildBlueprint();
                })} disabled={busy || !selectedExtracts.length}>Build blueprint</button>
                <button type="button" className="stylofact-button secondary" onClick={() => act(async () => {
                  await saveTargetPrompt();
                  await runExtraction();
                })} disabled={busy}>Search again</button>
                {latestRetrievalRunId && <button type="button" className="stylofact-button secondary" onClick={() => act(openReceipt)} disabled={busy}>View search receipt</button>}
              </div>
            </>
          )}
        </section>}

        {activeStage === 'blueprint' && <section className="stylofact-section" aria-label="Blueprint stage">
          {project.blueprint?.blueprint || project.blueprint?.working_title ? (
            <div className="stylofact-blueprint">
              <h3>{project.blueprint.blueprint?.working_title || project.blueprint.working_title || 'Untitled blueprint'}</h3>
              <p>{project.blueprint.blueprint?.central_claim || project.blueprint.central_claim}</p>
              <div className="stylofact-blueprint-columns">
                <div><span>Tentpoles</span><ul>{(project.blueprint.blueprint?.content_tentpoles || project.blueprint.content_tentpoles || []).map((item, index) => <li key={`${item.title}-${index}`}>{item.title || item.purpose}</li>)}</ul></div>
                <div><span>Recommended media</span><ul>{(project.blueprint.blueprint?.recommended_media || project.blueprint.recommended_media || []).map((item, index) => <li key={`${item.medium}-${index}`}>{item.medium?.replace(/_/g, ' ')}</li>)}</ul></div>
              </div>
            </div>
          ) : <div className="stylofact-empty-state"><p>Select evidence before building a blueprint.</p><button type="button" className="stylofact-button secondary" onClick={() => setActiveStage('review')}>Go to review</button></div>}
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(buildBlueprint)} disabled={busy || !project.selectedArtifactIds?.length || !project.styleProfile || !Object.keys(project.styleProfile).length}>{project.blueprint?.blueprint || project.blueprint?.working_title ? 'Rebuild blueprint' : 'Build blueprint'}</button>
          </div>
        </section>}

        {activeStage === 'generate' && <section className="stylofact-section" aria-label="Generate stage">
          <div className="stylofact-output-controls">
            <div className="stylofact-format-list" role="group" aria-label="Output media">
              {OUTPUT_FORMATS.map((format) => (
                <label key={format.id} className={formats.includes(format.id) ? 'selected' : ''}>
                  <input type="checkbox" checked={formats.includes(format.id)} onChange={() => toggleFormat(format.id)} disabled={busy || (!formats.includes(format.id) && formats.length >= 4)} />
                  <span><strong>{format.label}</strong><small>{format.note}</small></span>
                </label>
              ))}
            </div>
            <label className="stylofact-field stylofact-variation-field">
              <span>Variations per medium</span>
              <input type="number" min="1" max="6" value={variations} onChange={(event) => setVariations(event.target.value)} disabled={busy} />
            </label>
          </div>
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(() => generateArtifacts({ formats, variations }))} disabled={busy || !formats.length || !(project.blueprint?.blueprint || project.blueprint?.working_title)}>Generate content</button>
            {!project.blueprint?.blueprint && !project.blueprint?.working_title && <button type="button" className="stylofact-button secondary" onClick={() => setActiveStage('blueprint')}>Go to blueprint</button>}
          </div>
          {artifacts.length > 0 && (
            <>
              <div className="stylofact-output-bundle">
                <span>{artifacts.length} deployable variation{artifacts.length === 1 ? '' : 's'} ready.</span>
                <button type="button" className="stylofact-button secondary" onClick={() => copy(artifacts.map((artifact) => `# ${artifact.title || `${artifact.medium} · variation ${artifact.variation}`}\n\n${artifact.content}`).join('\n\n---\n\n'))}>Copy output bundle</button>
              </div>
              <div className="stylofact-artifact-grid">
                {artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} onChooseVersion={(id, version) => act(() => chooseArtifactVersion(id, version))} onCopy={copy} />)}
              </div>
            </>
          )}
        </section>}
      </main>
      <RetrievalReceipt receipt={receipt} onClose={() => setReceipt(null)} onOpenSource={(locator) => act(() => openSource(locator))} />
      <SourceViewer source={sourceView} onClose={() => setSourceView(null)} />
    </section>
  );
}
