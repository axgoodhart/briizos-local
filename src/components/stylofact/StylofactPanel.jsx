import { useEffect, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SOURCE_FILE_TYPE } from '../FileTree';
import { useStylofact } from './useStylofact';
import './StylofactPanel.css';

const PIPELINE_STEPS = [
  ['voice', '01', 'Voice'],
  ['theme', '02', 'Material'],
  ['review', '03', 'Select'],
  ['blueprint', '04', 'Shape'],
  ['generate', '05', 'Publish'],
];

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

  return (
    <div ref={drop} className={`stylofact-corpus ${isOver && canDrop ? 'is-dropping' : ''}`}>
      <div className="stylofact-corpus-heading">
        <div>
          <span className="stylofact-kicker">{isVoice ? 'Your rhetoric' : 'Your raw material'}</span>
          <h3>{isVoice ? 'Voice corpus' : 'Thematic corpus'}</h3>
        </div>
        <span className="stylofact-drop-hint">Drop a text file here</span>
      </div>
      <p className="stylofact-hint">
        {isVoice
          ? 'Add only writing you authored in your own voice. Separate genres are better than a mixed pile.'
          : 'Add chats, notes, excerpts, or documents that contain the ideas you want to recover. Stylofact preserves every chosen extract verbatim.'}
      </p>
      <label className="stylofact-field">
        <span>Source label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={isVoice ? 'e.g. Essays, spring 2026' : 'e.g. Music theory notes'}
          disabled={disabled}
        />
      </label>
      <label className="stylofact-field stylofact-field-textarea">
        <span>Paste text</span>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={isVoice ? 'Paste self-authored prose…' : 'Paste noisy conversations, notes, or excerpts…'}
          disabled={disabled}
          rows={5}
        />
      </label>
      <div className="stylofact-source-actions">
        <span>{wordCount(draft).toLocaleString()} words ready</span>
        <button type="button" className="stylofact-button secondary" onClick={addDraft} disabled={disabled || !draft.trim()}>
          Add source
        </button>
      </div>
      {sources.length > 0 && (
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
    <div className="stylofact-metric-strip" aria-label="Measured voice corpus summary">
      <div><span>Corpus</span><strong>{scope.wordCount.toLocaleString()} words</strong></div>
      <div><span>Confidence</span><strong className={`confidence-${scope.confidenceBand}`}>{scope.confidenceBand}</strong></div>
      <div><span>Sentence mean</span><strong>{sentenceMean} words</strong></div>
      <div><span>Moving TTR</span><strong>{ttr}</strong></div>
      <details>
        <summary>Measurements</summary>
        <pre>{JSON.stringify(metrics, null, 2)}</pre>
      </details>
      {!corpus && <span className="stylofact-warning">Add your writing to generate measurements.</span>}
    </div>
  );
}

function StageMarker({ project }) {
  const stage = project?.stage || 'voice';
  const stageIndex = PIPELINE_STEPS.findIndex(([id]) => id === stage);
  return (
    <ol className="stylofact-stage-marker" aria-label="Stylofact pipeline progress">
      {PIPELINE_STEPS.map(([id, number, label], index) => (
        <li key={id} className={index <= stageIndex || stage === 'complete' ? 'complete' : ''}>
          <span>{number}</span>{label}
        </li>
      ))}
    </ol>
  );
}

function ProfilePreview({ project, onUsePrimary, onUseReview }) {
  const profile = project?.styleProfile?.stylofact_profile || project?.styleProfile;
  const review = project?.styleReview?.review;
  if (!profile || !Object.keys(profile).length) return null;
  return (
    <div className="stylofact-profile-preview">
      <div className="stylofact-result-head">
        <span className="stylofact-kicker">Versioned directive</span>
        {review?.verdict && <span className="stylofact-badge">Independent review: {review.verdict}</span>}
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
        <ul className="stylofact-limitations">
          {profile.profile_scope.limitations.map((limitation, index) => <li key={`${limitation}-${index}`}>{limitation}</li>)}
        </ul>
      )}
    </div>
  );
}

function ArtifactCard({ artifact, onChooseVersion, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const evaluation = artifact.voiceEvaluation || {};
  return (
    <article className="stylofact-artifact-card">
      <div className="stylofact-artifact-head">
        <div>
          <span className="stylofact-kicker">{artifact.medium.replace(/_/g, ' ')}</span>
          <h4>{artifact.title || `Variation ${artifact.variation}`}</h4>
        </div>
        <span className={`stylofact-fit ${evaluation.status || 'insufficient_data'}`}>voice fit: {evaluation.status || 'insufficient data'}</span>
      </div>
      <div className={`stylofact-artifact-content ${expanded ? 'expanded' : ''}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
      </div>
      <div className="stylofact-artifact-actions">
        <button type="button" className="stylofact-text-button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Collapse' : 'Read'}</button>
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
    </article>
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
    availableModels,
    defaultPrimaryModel,
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
  } = useStylofact({ models, selectedModel, isModelAvailable });
  const [projectTitle, setProjectTitle] = useState('');
  const [targetPrompt, setTargetPrompt] = useState('');
  const [selectedExtracts, setSelectedExtracts] = useState([]);
  const [formats, setFormats] = useState(['short_form_social']);
  const [variations, setVariations] = useState(2);

  useEffect(() => {
    setProjectTitle(project?.title || '');
    setTargetPrompt(project?.targetPrompt || '');
    setSelectedExtracts(project?.selectedArtifactIds || []);
    if (project?.generationOptions?.formats?.length) setFormats(project.generationOptions.formats);
    if (project?.generationOptions?.variations) setVariations(project.generationOptions.variations);
  }, [project?.id, project?.title, project?.targetPrompt, project?.selectedArtifactIds, project?.generationOptions]);

  const criticOptions = useMemo(() => {
    const primary = availableModels.find((model) => model.name === (project?.primaryModel || defaultPrimaryModel));
    return availableModels.filter((model) => model.provider !== primary?.provider);
  }, [availableModels, defaultPrimaryModel, project?.primaryModel]);
  const extractions = project?.extraction?.extracted_artifacts || [];
  const busy = !!runState;

  const act = async (task) => {
    setError(null);
    try { await task(); }
    catch (taskError) { setError(taskError?.message || 'Stylofact could not complete that step.'); }
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

  if (isLoading || !project) {
    return <div className="stylofact-loading" aria-live="polite">Preparing Stylofact…</div>;
  }

  return (
    <section className="stylofact-panel" aria-label="Stylofact content pipeline">
      <header className="stylofact-header">
        <div className="stylofact-wordmark">
          <h1>stylofact    <small>stylometrically aligned artifact generator</small> </h1>
       
        </div>
        <div className="stylofact-project-controls">
          <label className="stylofact-project-title">
            <span className="sr-only">Project title</span>
            <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} onBlur={() => act(saveProjectTitle)} disabled={busy} placeholder="Project title" />
          </label>
          <label>
            <span className="sr-only">Active Stylofact project</span>
            <select value={project.id} onChange={(event) => act(() => selectProject(event.target.value))} disabled={busy}>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.title || 'Untitled Stylofact'}</option>)}
            </select>
          </label>
          <button type="button" className="stylofact-button secondary" onClick={() => act(() => createProject())} disabled={busy}>New</button>
        </div>
      </header>

      <StageMarker project={project} />

      {runState && (
        <aside className="stylofact-running" aria-live="polite">
          <div><span className="stylofact-running-dot" />{runState.label}<small>{runState.model}</small></div>
          {streamPreview && <p>{streamPreview.slice(-360)}</p>}
        </aside>
      )}
      {error && <div className="stylofact-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}

      <div className="stylofact-scroll">
        <section className="stylofact-section is-voice" aria-labelledby="stylofact-voice-title">
          <div className="stylofact-section-intro">
            <span className="stylofact-step-number">01</span>
            <div>
              <span className="stylofact-kicker">Voice calibration</span>
              <p>Stylofact measures the corpus locally and derives a practical, versioned directive from those measurements. Models are used only in the later writing stages.</p>
            </div>
          </div>
          <div className="stylofact-model-grid">
            <label className="stylofact-field">
              <span>Generation model</span>
              <select value={project.primaryModel || defaultPrimaryModel || ''} onChange={(event) => act(() => updateProject({ primaryModel: event.target.value }))} disabled={busy || !availableModels.length}>
                {availableModels.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
              </select>
              <small>Used for extraction, planning, and content generation; voice measurement runs locally.</small>
            </label>
            <label className="stylofact-field">
              <span>Generation reviewer</span>
              <select value={project.criticModel && criticOptions.some((model) => model.name === project.criticModel) ? project.criticModel : criticOptions[0]?.name || ''} onChange={(event) => act(() => updateProject({ criticModel: event.target.value || null }))} disabled={busy || !criticOptions.length}>
                {!criticOptions.length && <option value="">No second provider available</option>}
                {criticOptions.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
              </select>
              <small>{criticOptions.length ? 'A different provider can review generated content; it never changes local measurements.' : 'Add a key for another provider to enable generation review.'}</small>
            </label>
          </div>
          <CorpusWorkbench role="style" sources={styleSources} onAdd={addSource} onDrop={dropSource} onRemove={(source) => act(() => removeSource(source))} disabled={busy} onError={setError} />
          <MetricStrip project={project} corpus={styleCorpus} />
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(runVoiceAnalysis)} disabled={busy || !styleCorpus.trim()}>
              Measure voice corpus
            </button>
            <span>Profiles under 2,500 words are marked exploratory; 5,000+ same-medium words form a usable baseline.</span>
          </div>
          <ProfilePreview
            project={project}
            onUsePrimary={() => act(() => updateProject({ profileChoice: 'primary' }))}
            onUseReview={() => act(() => updateProject({ profileChoice: 'review' }))}
          />
        </section>

        <section className="stylofact-section" aria-labelledby="stylofact-material-title">
          <div className="stylofact-section-intro">
            <span className="stylofact-step-number">02</span>
            <div>
              <span className="stylofact-kicker">Idea recovery</span>
              <h2 id="stylofact-material-title">Find the thought inside the noise.</h2>
              <p>The extractor makes literal, semantic, and contextual passes, then keeps only exact source text with provenance.</p>
            </div>
          </div>
          <label className="stylofact-field stylofact-field-query">
            <span>What are you trying to make?</span>
            <textarea value={targetPrompt} onChange={(event) => setTargetPrompt(event.target.value)} onBlur={() => act(saveTargetPrompt)} disabled={busy} rows={3} placeholder="e.g. Find my literary-fiction fragments for a book about self-help through music theory." />
          </label>
          <label className="stylofact-approval-toggle">
            <input type="checkbox" checked={project.approvalMode === 'automatic'} onChange={(event) => act(() => updateProject({ approvalMode: event.target.checked ? 'automatic' : 'manual' }))} disabled={busy} />
            <span><strong>Proceed automatically</strong><small>After an extraction, immediately draft the blueprint from all verified results.</small></span>
          </label>
          <CorpusWorkbench role="thematic" sources={thematicSources} onAdd={addSource} onDrop={dropSource} onRemove={(source) => act(() => removeSource(source))} disabled={busy} onError={setError} />
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(async () => {
              await saveTargetPrompt();
              const result = await runExtraction();
              if (result.saved.approvalMode === 'automatic' && result.extraction.extracted_artifacts.length) await buildBlueprint();
            })} disabled={busy || !thematicCorpus.trim() || !targetPrompt.trim()}>
              Extract useful material
            </button>
            <span>{thematicSources.length ? `${thematicSources.length} thematic source${thematicSources.length === 1 ? '' : 's'} ready.` : 'Add noisy material first.'}</span>
          </div>
        </section>

        <section className="stylofact-section" aria-labelledby="stylofact-review-title">
          <div className="stylofact-section-intro">
            <span className="stylofact-step-number">03</span>
            <div>
              <span className="stylofact-kicker">Human checkpoint</span>
              <h2 id="stylofact-review-title">Choose the evidence.</h2>
              <p>Nothing here has been rewritten. Keep the exact source thoughts that should anchor the content.</p>
            </div>
          </div>
          {extractions.length === 0 ? (
            <p className="stylofact-empty">Run an extraction to review source-grounded material here.</p>
          ) : (
            <>
              <div className="stylofact-selection-toolbar">
                <span>{selectedExtracts.length} of {extractions.length} selected</span>
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
                })} disabled={busy || !selectedExtracts.length}>Approve and draft blueprint</button>
                <button type="button" className="stylofact-button secondary" onClick={() => act(async () => {
                  await saveTargetPrompt();
                  await runExtraction();
                })} disabled={busy}>Search again</button>
              </div>
            </>
          )}
        </section>

        <section className="stylofact-section" aria-labelledby="stylofact-shape-title">
          <div className="stylofact-section-intro">
            <span className="stylofact-step-number">04</span>
            <div>
              <span className="stylofact-kicker">Editorial architecture</span>
              <h2 id="stylofact-shape-title">Give the idea a form.</h2>
              <p>The blueprint delineates structure, content tentpoles, rhetorical style, and dissemination goals before it drafts anything.</p>
            </div>
          </div>
          {project.blueprint?.blueprint || project.blueprint?.working_title ? (
            <div className="stylofact-blueprint">
              <h3>{project.blueprint.blueprint?.working_title || project.blueprint.working_title || 'Untitled blueprint'}</h3>
              <p>{project.blueprint.blueprint?.central_claim || project.blueprint.central_claim}</p>
              <div className="stylofact-blueprint-columns">
                <div><span>Tentpoles</span><ul>{(project.blueprint.blueprint?.content_tentpoles || project.blueprint.content_tentpoles || []).map((item, index) => <li key={`${item.title}-${index}`}>{item.title || item.purpose}</li>)}</ul></div>
                <div><span>Recommended media</span><ul>{(project.blueprint.blueprint?.recommended_media || project.blueprint.recommended_media || []).map((item, index) => <li key={`${item.medium}-${index}`}>{item.medium?.replace(/_/g, ' ')}</li>)}</ul></div>
              </div>
            </div>
          ) : <p className="stylofact-empty">Approve extracts, then let Stylofact turn only those thoughts into an editorial plan.</p>}
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(buildBlueprint)} disabled={busy || !project.selectedArtifactIds?.length || !project.styleProfile || !Object.keys(project.styleProfile).length}>Build dissemination blueprint</button>
            <span>It will not treat unapproved source material as evidence.</span>
          </div>
        </section>

        <section className="stylofact-section is-output" aria-labelledby="stylofact-publish-title">
          <div className="stylofact-section-intro">
            <span className="stylofact-step-number">05</span>
            <div>
              <span className="stylofact-kicker">Deployable forms</span>
              <h2 id="stylofact-publish-title">Choose the artifact, then the variations.</h2>
              <p>The second provider revises completed drafts when one is configured; both versions remain available.</p>
            </div>
          </div>
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
              <small>Up to four media and six variations each in V1.</small>
            </label>
          </div>
          <div className="stylofact-callout-action">
            <button type="button" className="stylofact-button primary" onClick={() => act(() => generateArtifacts({ formats, variations }))} disabled={busy || !formats.length || !(project.blueprint?.blueprint || project.blueprint?.working_title)}>Generate selected content</button>
            <span>Each output gets a transparent local metric comparison—not a claim of identity.</span>
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
        </section>
      </div>
    </section>
  );
}
