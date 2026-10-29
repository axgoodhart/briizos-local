import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { diffLines } from 'diff';
import { SOURCE_FILE_TYPE } from '../FileTree';
import { useModelSelection } from '../../hooks/useModelSelection';
import { describeMeasurements, useStylofact, wordCount } from './useStylofact';

const STEPS = [
  { id: 'guide', number: '1', label: 'Guide' },
  { id: 'find', number: '2', label: 'Find' },
  { id: 'write', number: '3', label: 'Write' },
];
const RUN_LABELS = { guide: 'Style guide written', addendum: 'Form addendum written', find: 'Material found in your history', write: 'Piece written', review: 'Second-AI review' };
const BAND_TEXT = { sketch: 'enough for a rough sketch', provisional: 'enough for a provisional guide', solid: 'enough for a solid guide' };
const NEW_FORM = '__new__';

function openAuditTurn(turnId) {
  if (turnId) window.dispatchEvent(new CustomEvent('briizos:ai-visibility:open', { detail: { turnId } }));
}

const when = (timestamp) => (timestamp ? new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null);
const formLabel = (form) => (form === 'all' ? 'all writing' : form);

function StageError({ error, onDismiss }) {
  if (!error) return null;
  const detail = typeof error === 'object' ? error : { message: error };
  const providerLine = [detail.provider && detail.model ? `${detail.provider} · ${detail.model}` : detail.model || detail.provider, detail.status != null ? `HTTP ${detail.status}` : null, detail.code != null ? `code ${detail.code}` : null].filter(Boolean).join(' · ');
  return (
    <div className="stylofact-error" role="alert">
      <div className="stylofact-error-body">
        <span>{detail.message || 'Stylofact could not complete that step.'}</span>
        {providerLine && <small className="stylofact-error-provider">{providerLine}</small>}
        {detail.nextAction && <small className="stylofact-error-next"><strong>Next:</strong> {detail.nextAction}</small>}
        {detail.turnId && <button type="button" className="stylofact-text-button" onClick={() => openAuditTurn(detail.turnId)}>View the full AI record</button>}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}

function RunHistory({ runs }) {
  if (!runs.length) return null;
  const failed = runs.filter((run) => run.status === 'failed').length;
  return (
    <details className="stylofact-disclosure stylofact-run-history">
      <summary>AI runs · {runs.length}{failed ? ` · ${failed} failed` : ''}</summary>
      <ul aria-label="Recent Stylofact runs">
        {runs.slice(0, 12).map((run) => {
          const detail = run.result?.errorDetail || null;
          const turnId = run.agentTurnId || detail?.turnId || null;
          return (
            <li key={run.id} className={`stylofact-run stylofact-run-${run.status}`}>
              <div className="stylofact-run-head">
                <strong>{RUN_LABELS[run.stage] || run.stage}</strong>
                <span>{when(run.createdAt)} · {run.modelName || 'local'}</span>
                <em className={`stylofact-run-status status-${run.status}`}>{run.status}</em>
              </div>
              {run.status === 'failed' && run.error && <p className="stylofact-run-error">{run.error}</p>}
              {run.status === 'failed' && detail?.nextAction && <p className="stylofact-run-next"><strong>Next:</strong> {detail.nextAction}</p>}
              {turnId && <button type="button" className="stylofact-text-button" onClick={() => openAuditTurn(turnId)}>View the full AI record</button>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function FormPicker({ value, forms, onChange, disabled, label }) {
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const cleaned = draft.trim().toLowerCase();
    if (cleaned) onChange(cleaned);
    setNaming(false);
    setDraft('');
  };
  return (
    <span className="stylofact-form-picker">
      <select
        aria-label={label}
        value={naming ? NEW_FORM : value}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value === NEW_FORM) { setNaming(true); return; }
          setNaming(false);
          onChange(event.target.value);
        }}
      >
        <option value="all">all writing</option>
        {forms.map((form) => <option key={form} value={form}>{form}</option>)}
        <option value={NEW_FORM}>a new form…</option>
      </select>
      {naming && (
        <input
          autoFocus
          value={draft}
          placeholder="essays, blog, notes…"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') { setNaming(false); setDraft(''); } }}
        />
      )}
    </span>
  );
}

function SamplesBlock({ samples, forms, words, band, busy, onPick, onDrop, onPaste, onForm, onRename, onRemove, onError }) {
  const [addForm, setAddForm] = useState('all');
  const [label, setLabel] = useState('');
  const [draft, setDraft] = useState('');
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: SOURCE_FILE_TYPE,
    drop: async (item) => { try { await onDrop(item, addForm); } catch (dropError) { onError(dropError?.message || 'That file could not be added.'); } },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });
  const addPasted = async () => {
    try {
      await onPaste({ label: label.trim() || 'Pasted sample', form: addForm, text: draft });
      setDraft('');
      setLabel('');
    } catch (pasteError) { onError(pasteError?.message || 'That text could not be added.'); }
  };
  return (
    <div ref={drop} className={`stylofact-corpus ${isOver && canDrop ? 'is-dropping' : ''}`}>
      <div className="stylofact-source-summary" aria-live="polite">
        <strong>{samples.length} sample{samples.length === 1 ? '' : 's'}</strong>
        <span>{words.toLocaleString()} words</span>
        <span>{samples.length ? BAND_TEXT[band] : 'drop or add your own writing'}</span>
      </div>
      <div className="stylofact-sample-actions">
        <FormPicker value={addForm} forms={forms} onChange={setAddForm} disabled={busy} label="New samples count toward" />
        <button type="button" className="stylofact-button secondary" disabled={busy} onClick={async () => { try { const result = await onPick(addForm); result.failures.forEach((failure) => onError(`${failure.filePath.split('/').pop()}: ${failure.reason}`)); } catch (pickError) { onError(pickError?.message); } }}>Add files</button>
        <span className="stylofact-drop-hint">PDF, Pages, Word, RTF or text · or drop from Sources</span>
      </div>
      <details className="stylofact-disclosure">
        <summary>Paste text</summary>
        <div className="stylofact-source-form">
          <label className="stylofact-field"><span>Name</span><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Essay on Debussy" disabled={busy} /></label>
          <label className="stylofact-field stylofact-field-textarea"><span>Text</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={6} placeholder="Writing you wrote yourself…" disabled={busy} /></label>
          <div className="stylofact-source-actions">
            <span>{wordCount(draft).toLocaleString()} words</span>
            <button type="button" className="stylofact-button secondary" onClick={addPasted} disabled={busy || !draft.trim()}>Add sample</button>
          </div>
        </div>
      </details>
      {samples.length > 0 && (
        <ul className="stylofact-source-list" aria-label="Writing samples">
          {samples.map((sample) => (
            <li key={sample.id}>
              <div>
                <input className="stylofact-sample-name" defaultValue={sample.label} disabled={busy} aria-label="Sample name" onBlur={(event) => onRename(sample, event.target.value)} />
                <span>{sample.wordCount.toLocaleString()} words · {sample.origin === 'file' ? (sample.fileKind || 'file') : 'pasted'}{sample.truncated ? ' · cut at 400,000 characters' : ''}</span>
              </div>
              <FormPicker value={sample.form} forms={forms} onChange={(form) => onForm(sample, form)} disabled={busy} label={`Which writing “${sample.label}” counts toward`} />
              <button type="button" className="stylofact-icon-button" aria-label={`Remove ${sample.label}`} onClick={() => onRemove(sample)} disabled={busy}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuideEditor({ text, onSave, busy, placeholder, writtenAt, editedAt, label }) {
  const [draft, setDraft] = useState(text || '');
  const [preview, setPreview] = useState(!!text);
  useEffect(() => { setDraft(text || ''); }, [text]);
  const dirty = draft !== (text || '');
  const rows = Math.min(60, Math.max(14, draft.split('\n').length + 2));
  const save = async () => { if (dirty) await onSave(draft); };
  return (
    <div className="stylofact-guide-editor">
      <div className="stylofact-guide-tools">
        <strong>{label}</strong>
        <span className="stylofact-status-line">
          {writtenAt ? `written by the AI ${when(writtenAt)}` : text ? 'written by hand' : 'not written yet'}
          {editedAt ? ` · edited by hand ${when(editedAt)}` : ''}
          {dirty ? ' · unsaved changes' : ''}
        </span>
        <span className="stylofact-version-choice" role="group" aria-label="Guide view">
          <button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Read</button>
          <button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Edit</button>
        </span>
        {dirty && <button type="button" className="stylofact-button secondary" onClick={save} disabled={busy}>Save</button>}
      </div>
      {preview ? (
        <div className="stylofact-guide-preview stylofact-artifact-content">
          {draft.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown> : <p className="stylofact-empty">{placeholder}</p>}
        </div>
      ) : (
        <textarea className="stylofact-guide-text" value={draft} rows={rows} spellCheck placeholder={placeholder} disabled={busy} onChange={(event) => setDraft(event.target.value)} onBlur={save} />
      )}
    </div>
  );
}

function ProposalDiff({ proposal, onAccept, onDiscard, busy }) {
  const parts = useMemo(() => diffLines(proposal.current, proposal.proposed), [proposal]);
  const changed = parts.filter((part) => part.added || part.removed).reduce((total, part) => total + part.count, 0);
  return (
    <section className="stylofact-diff" aria-label="Suggested revision">
      <div className="stylofact-result-head">
        <strong>{proposal.kind === 'guide' ? 'Suggested revision of your guide' : `Suggested ${proposal.form} addendum`}</strong>
        <span>{changed} line{changed === 1 ? '' : 's'} would change · nothing is saved until you accept</span>
      </div>
      <pre>
        {parts.map((part, index) => {
          const lines = part.value.replace(/\n$/, '').split('\n');
          if (!part.added && !part.removed && lines.length > 6) {
            return (
              <span key={index} className="stylofact-diff-same">
                {lines.slice(0, 2).map((line, lineIndex) => <span key={`a${lineIndex}`} className="stylofact-diff-line">{line}{'\n'}</span>)}
                <span className="stylofact-diff-fold">… {lines.length - 4} unchanged lines …{'\n'}</span>
                {lines.slice(-2).map((line, lineIndex) => <span key={`b${lineIndex}`} className="stylofact-diff-line">{line}{'\n'}</span>)}
              </span>
            );
          }
          return (
            <span key={index} className={part.added ? 'stylofact-diff-added' : part.removed ? 'stylofact-diff-removed' : 'stylofact-diff-same'}>
              {lines.map((line, lineIndex) => <span key={lineIndex} className="stylofact-diff-line">{part.added ? '+ ' : part.removed ? '− ' : '  '}{line}{'\n'}</span>)}
            </span>
          );
        })}
      </pre>
      <div className="stylofact-callout-action">
        <button type="button" className="stylofact-button primary" onClick={onAccept} disabled={busy}>Accept the revision</button>
        <button type="button" className="stylofact-button secondary" onClick={onDiscard} disabled={busy}>Keep mine</button>
      </div>
    </section>
  );
}

function SplitRow({ split, busy, onStart, onStop, onChooseFolder, onAutoStart }) {
  if (!split) return null;
  const state = split.ready && split.messageSearch ? 'ready' : split.starting ? 'starting' : split.rebuilding ? 'rebuilding' : split.reachable && split.ready ? 'outdated' : 'off';
  const text = {
    ready: `Split is running · ${split.stats?.messages?.toLocaleString() || '?'} messages in ${split.stats?.conversations?.toLocaleString() || '?'} conversations${split.sourceRange?.end ? `, through ${split.sourceRange.end}` : ''}`,
    starting: 'Split is starting…',
    rebuilding: 'Split is rebuilding its index…',
    outdated: 'Split is running an older copy without message search. Stop it and start it again from the updated folder.',
    off: split.autoStart ? 'Split is not running. It starts on its own when you look for material.' : 'Split is not running.',
  }[state];
  return (
    <div className={`stylofact-split state-${state}`} aria-live="polite">
      <span className="stylofact-split-dot" />
      <span className="stylofact-split-state">{text}</span>
      <span className="stylofact-split-actions">
        {state !== 'ready' && state !== 'starting' && <button type="button" className="stylofact-text-button" onClick={onStart} disabled={busy}>Start Split</button>}
        {split.startedByBriizOS && state === 'ready' && <button type="button" className="stylofact-text-button" onClick={onStop} disabled={busy}>Stop Split</button>}
        <button type="button" className="stylofact-text-button" onClick={onChooseFolder} disabled={busy} title={split.detectedFolder || 'No Split folder found yet'}>{split.folder ? 'Change folder' : split.detectedFolder ? 'Folder found' : 'Choose folder'}</button>
        <label className="stylofact-split-auto"><input type="checkbox" checked={split.autoStart !== false} disabled={busy} onChange={(event) => onAutoStart(event.target.checked)} /> start when needed</label>
      </span>
    </div>
  );
}

function ContextViewer({ context, focusIndex, quoteText, onClose }) {
  if (!context) return null;
  const needle = String(quoteText || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return (
    <div className="stylofact-receipt-overlay" role="dialog" aria-modal="true" aria-label="The conversation around this quote">
      <section className="stylofact-source-viewer">
        <header><h3>{context.title || 'Untitled conversation'}</h3><button type="button" className="stylofact-icon-button" onClick={onClose} aria-label="Close">×</button></header>
        <div className="stylofact-conversation-context">
          {context.messages.map((message) => {
            const isFocus = message.index === focusIndex;
            const position = isFocus && needle ? message.text.indexOf(needle) : -1;
            return (
              <article key={message.index} className={`role-${message.role} ${isFocus ? 'is-evidence' : ''}`}>
                <span>{message.role === 'user' ? `You · ${message.date || ''}` : 'ChatGPT · context only'}</span>
                {position >= 0
                  ? <p>{message.text.slice(0, position)}<mark>{message.text.slice(position, position + needle.length)}</mark>{message.text.slice(position + needle.length)}</p>
                  : <p>{message.text}</p>}
              </article>
            );
          })}
        </div>
        <footer><code>conversation {context.conversation} · message {focusIndex + 1} of {context.messageCount}</code><strong>Split's lowercase copy</strong></footer>
      </section>
    </div>
  );
}

function DriftReadout({ drift }) {
  if (!drift?.status) return null;
  if (!drift.measurements?.length) return <p className="stylofact-hint">{drift.note}</p>;
  return (
    <div className="stylofact-drift">
      <div className="stylofact-result-head"><strong className={`stylofact-fit ${drift.status}`}>Compared with your samples: {drift.summary}</strong><span>{drift.note}</span></div>
      <div className="stylofact-fit-detail">
        {drift.measurements.map((entry) => <span key={entry.key} className={entry.status} title={`${entry.actual} vs ${entry.target} ${entry.unit}`}>{entry.sentence}</span>)}
      </div>
    </div>
  );
}

export default function StylofactPanel() {
  const { models, selectedModel, isModelAvailable } = useModelSelection();
  const s = useStylofact({ models, selectedModel, isModelAvailable });
  const [activeStage, setActiveStage] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const [context, setContext] = useState(null);
  const [requestDraft, setRequestDraft] = useState('');
  const actionPendingRef = useRef(false);
  const piece = s.selectedPiece;

  useEffect(() => {
    if (activeStage || s.isLoading || !s.guide) return;
    setActiveStage(s.guide.text?.trim() ? 'find' : 'guide');
  }, [activeStage, s.isLoading, s.guide]);
  useEffect(() => { setRequestDraft(piece?.request || ''); }, [piece?.id, piece?.request]);

  const busy = actionPending || !!s.runState;
  const measurements = s.guide?.measurements;
  const plainMeasurements = useMemo(() => describeMeasurements(measurements), [measurements]);
  const addendumForms = useMemo(() => [...new Set([...s.forms.filter((form) => s.samples.some((sample) => sample.form === form)), ...Object.keys(s.guide?.addenda || {})])].sort(), [s.forms, s.samples, s.guide?.addenda]);

  const act = async (task) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    setActionPending(true);
    s.setError(null);
    try { await task(); }
    catch (taskError) { s.setError(taskError?.aiTurn ? { message: taskError.message, ...taskError.aiTurn } : (taskError?.message || 'Stylofact could not complete that step.')); }
    finally { actionPendingRef.current = false; setActionPending(false); }
  };

  const saveRequest = async () => { if (piece && requestDraft !== (piece.request || '')) await s.updatePiece(piece, { request: requestDraft, title: requestDraft.trim().slice(0, 80) || piece.title }); };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); } catch { s.setError('Copy was unavailable. Select the text and copy it by hand.'); } };
  const openQuote = (quote) => act(async () => { setContext({ ...(await s.openContext(quote)), focusIndex: quote.index, quoteText: quote.text }); });

  if (s.isLoading || !s.guide) return <div className="stylofact-loading" aria-live="polite">Opening Stylofact…</div>;

  const keptQuotes = (piece?.quotes || []).filter((quote) => quote.chosen);
  const chosenText = piece ? (piece.chosen === 'review' && piece.review ? piece.review : piece.draft) : '';

  return (
    <section className="stylofact-panel" aria-label="Stylofact">
      <header className="stylofact-header">
        <h1>Stylofact</h1>
        {activeStage !== 'guide' && (
          <div className="stylofact-project-controls stylofact-piece-controls">
            <select aria-label="Open piece" value={piece?.id || ''} disabled={busy || !s.pieces.length} onChange={(event) => s.selectPiece(event.target.value)}>
              {!s.pieces.length && <option value="">No pieces yet</option>}
              {s.pieces.map((entry) => <option key={entry.id} value={entry.id}>{entry.title || 'Untitled piece'}</option>)}
            </select>
            <button type="button" className="stylofact-button secondary" disabled={busy} onClick={() => act(async () => { await s.createPiece(); setActiveStage('find'); })}>New piece</button>
            {piece && <button type="button" className="stylofact-icon-button" aria-label="Put this piece away" title="Put this piece away" disabled={busy} onClick={() => { if (window.confirm(`Put away “${piece.title}”? Its draft stays in local storage.`)) act(() => s.archivePiece(piece)); }}>×</button>}
          </div>
        )}
      </header>

      <nav className="stylofact-stage-navigation" aria-label="Stylofact steps">
        <ol>
          {STEPS.map((step, index) => {
            const done = (step.id === 'guide' && !!s.guide.text?.trim()) || (step.id === 'find' && keptQuotes.length > 0) || (step.id === 'write' && !!piece?.draft);
            return (
              <li key={step.id} className={done ? 'complete' : ''}>
                <button type="button" className={activeStage === step.id ? 'active' : ''} aria-current={activeStage === step.id ? 'step' : undefined} onClick={() => setActiveStage(step.id)}>
                  <span>{index + 1}</span>{step.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {s.runState && (
        <aside className="stylofact-running" aria-live="polite">
          <div><span className="stylofact-running-dot" />{s.runState.label}<small>{s.runState.model}</small></div>
          {s.streamPreview && <p>{s.streamPreview.slice(-360)}</p>}
        </aside>
      )}
      {s.pendingDecision && (
        <aside className="stylofact-decision" role="alertdialog" aria-live="assertive" aria-label="A paused AI run needs your decision">
          <div><strong>This run is paused and waiting for you</strong><p>{s.pendingDecision.summary}</p></div>
          <div className="stylofact-decision-actions">
            <button type="button" className="stylofact-decision-deny" onClick={() => s.resolveDecision(false)}>Refuse and continue</button>
            <button type="button" className="stylofact-decision-grant" onClick={() => s.resolveDecision(true)}>Allow</button>
          </div>
        </aside>
      )}
      <StageError error={s.error} onDismiss={() => s.setError(null)} />
      <RunHistory runs={s.runs} />

      <main key={activeStage} className="stylofact-scroll">
        {activeStage === 'guide' && (
          <section className="stylofact-section" aria-label="Your style guide">
            <SamplesBlock
              samples={s.samples} forms={s.forms} words={s.sampleWords} band={measurements?.scope?.confidenceBand || (s.sampleWords < 2500 ? 'sketch' : s.sampleWords < 5000 ? 'provisional' : 'solid')} busy={busy}
              onPick={(form) => s.pickSampleFiles(form)} onDrop={(item, form) => s.dropSampleFile(item, form)} onPaste={(input) => s.addPastedSample(input)}
              onForm={(sample, form) => act(() => s.setSampleForm(sample, form))} onRename={(sample, label) => act(() => s.renameSample(sample, label))} onRemove={(sample) => act(() => s.removeSample(sample))} onError={(message) => s.setError(message)}
            />
            <div className="stylofact-callout-action">
              <button type="button" className="stylofact-button primary" disabled={busy || !s.samples.length || !s.writerModel} onClick={() => act(() => s.writeGuide())}>
                {s.guide.text?.trim() ? 'Suggest a revision' : 'Write the guide'}
              </button>
              <span>{s.samples.length ? `${s.sampleWords.toLocaleString()} words · ${BAND_TEXT[measurements?.scope?.confidenceBand || (s.sampleWords < 2500 ? 'sketch' : s.sampleWords < 5000 ? 'provisional' : 'solid')]}` : 'add samples first'}{s.writerModel ? ` · ${s.writerModel}` : ' · no AI model available'}</span>
            </div>
            {s.proposal && <ProposalDiff proposal={s.proposal} busy={busy} onAccept={() => act(s.acceptProposal)} onDiscard={s.discardProposal} />}
            <GuideEditor
              label={s.guide.name || 'Your voice'} text={s.guide.text} busy={busy} writtenAt={s.guide.writtenAt} editedAt={s.guide.editedAt}
              placeholder="The guide appears here once written. You can also write or paste one yourself; your words are never overwritten."
              onSave={(text) => act(() => s.saveGuideText(text))}
            />
            {addendumForms.map((form) => (
              <div className="stylofact-addendum" key={form}>
                <GuideEditor
                  label={`Addendum · ${form}`} text={s.guide.addenda?.[form] || ''} busy={busy}
                  placeholder={`How your ${form} writing differs from the general guide. Written from the samples marked “${form}”.`}
                  onSave={(text) => act(() => s.saveAddendum(form, text))}
                />
                <div className="stylofact-callout-action">
                  <button type="button" className="stylofact-button secondary" disabled={busy || !s.samples.some((sample) => sample.form === form) || !s.writerModel} onClick={() => act(() => s.writeGuide({ form }))}>
                    {s.guide.addenda?.[form]?.trim() ? `Suggest a revision for ${form}` : `Write the ${form} addendum`}
                  </button>
                  <span>{s.samples.filter((sample) => sample.form === form).length} sample{s.samples.filter((sample) => sample.form === form).length === 1 ? '' : 's'} marked {form}</span>
                </div>
              </div>
            ))}
            {plainMeasurements.length > 0 && (
              <details className="stylofact-disclosure stylofact-metric-strip">
                <summary>Measurements · {measurements.scope.wordCount.toLocaleString()} words{s.guide.measuredAt ? ` · ${when(s.guide.measuredAt)}` : ''}</summary>
                <ul className="stylofact-measurement-lines">{plainMeasurements.map((line, index) => <li key={index}>{line}</li>)}</ul>
                <div className="stylofact-callout-action">
                  <button type="button" className="stylofact-text-button" disabled={busy || !s.samples.length} onClick={() => act(() => s.measure())}>Measure again</button>
                </div>
                <details className="stylofact-raw-measurements"><summary>Every count</summary><pre>{JSON.stringify(measurements, null, 2)}</pre></details>
              </details>
            )}
            <details className="stylofact-disclosure stylofact-model-settings">
              <summary>Models · {s.writerModel || 'none'}{s.reviewerModel && s.reviewerModel !== s.writerModel ? ` · reviewer ${s.reviewerModel}` : ''}</summary>
              <div className="stylofact-model-grid">
                <label className="stylofact-field"><span>Writes the guide and pieces</span>
                  <select value={s.writerModel || ''} disabled={busy || !s.availableModels.length} onChange={(event) => s.setWriterModel(event.target.value)}>
                    {s.availableModels.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
                  </select>
                </label>
                <label className="stylofact-field"><span>Second-AI reviewer</span>
                  <select value={s.reviewerModel || ''} disabled={busy || !s.availableModels.length} onChange={(event) => s.setReviewerModel(event.target.value)}>
                    {s.availableModels.map((model) => <option key={model.name} value={model.name}>{model.display_name || model.name}</option>)}
                  </select>
                </label>
              </div>
            </details>
          </section>
        )}

        {activeStage === 'find' && (
          <section className="stylofact-section" aria-label="Find material">
            {!piece ? (
              <div className="stylofact-empty-state">
                <p>Start a piece, then say in a sentence what it is about.</p>
                <button type="button" className="stylofact-button primary" disabled={busy} onClick={() => act(() => s.createPiece())}>New piece</button>
              </div>
            ) : (
              <>
                <label className="stylofact-field stylofact-field-query">
                  <span>What the piece is about</span>
                  <textarea value={requestDraft} rows={3} disabled={busy} placeholder="what I've said about modal harmony as emotional practice" onChange={(event) => setRequestDraft(event.target.value)} onBlur={() => act(saveRequest)} />
                </label>
                <div className="stylofact-sample-actions">
                  <span>Written as</span>
                  <FormPicker value={piece.form} forms={s.forms} disabled={busy} label="Which form this piece is" onChange={(form) => act(() => s.updatePiece(piece, { form }))} />
                  {piece.form !== 'all' && !s.guide.addenda?.[piece.form] && <span className="stylofact-hint">no {piece.form} addendum yet; the general guide will be used</span>}
                </div>
                <SplitRow split={s.split} busy={busy} onStart={() => act(s.splitStart)} onStop={() => act(s.splitStop)} onChooseFolder={() => act(s.splitChooseFolder)} onAutoStart={(value) => act(() => s.splitSetAutoStart(value))} />
                <div className="stylofact-callout-action">
                  <button type="button" className="stylofact-button primary" disabled={busy || !requestDraft.trim() || !s.writerModel} onClick={() => act(async () => { await saveRequest(); await s.findMaterial({ ...piece, request: requestDraft }); })}>
                    {piece.quotes?.length ? 'Search again' : 'Find material'}
                  </button>
                  <span>{piece.quotes?.length ? `${keptQuotes.length} of ${piece.quotes.length} quotes kept` : 'your ChatGPT history, your own messages only'}</span>
                </div>
                {piece.phrasings?.length > 0 && <div className="stylofact-query-row">{piece.phrasings.map((phrase) => <code key={phrase}>{phrase}</code>)}</div>}
                {s.lastFind?.dropped > 0 && <p className="stylofact-warning">{s.lastFind.dropped} suggested quote{s.lastFind.dropped === 1 ? ' was' : 's were'} dropped because the words were not in the message they were said to come from.</p>}
                {s.lastFind?.notes && <p className="stylofact-hint">{s.lastFind.notes}</p>}
                {piece.quotes?.length > 0 && (
                  <>
                    <div className="stylofact-selection-toolbar">
                      <strong>{keptQuotes.length} of {piece.quotes.length} kept</strong>
                      <button type="button" className="stylofact-text-button" disabled={busy} onClick={() => act(() => s.setQuoteChosen(piece, piece.quotes.map((quote) => quote.key), true))}>Keep all</button>
                      <button type="button" className="stylofact-text-button" disabled={busy} onClick={() => act(() => s.setQuoteChosen(piece, piece.quotes.map((quote) => quote.key), false))}>Keep none</button>
                      {keptQuotes.length > 0 && <button type="button" className="stylofact-button secondary" disabled={busy} onClick={() => setActiveStage('write')}>Go to Write</button>}
                    </div>
                    <div className="stylofact-extract-grid">
                      {piece.quotes.map((quote) => (
                        <label key={quote.key} className={`stylofact-extract ${quote.chosen ? 'selected' : ''}`}>
                          <input type="checkbox" checked={!!quote.chosen} disabled={busy} onChange={() => act(() => s.setQuoteChosen(piece, quote.key, !quote.chosen))} />
                          <span className="stylofact-extract-body">{quote.text}</span>
                          <span className="stylofact-extract-meta">
                            <strong>{quote.title || 'Untitled conversation'}</strong>{quote.date || ''}
                            <button type="button" className="stylofact-text-button" disabled={busy} onClick={(event) => { event.preventDefault(); openQuote(quote); }}>Open the conversation</button>
                          </span>
                          {quote.why && <em className="stylofact-quote-why">{quote.why}</em>}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {activeStage === 'write' && (
          <section className="stylofact-section" aria-label="Write the piece">
            {!piece ? (
              <div className="stylofact-empty-state"><p>Find material first.</p><button type="button" className="stylofact-button secondary" onClick={() => setActiveStage('find')}>Go to Find</button></div>
            ) : (
              <>
                <label className="stylofact-approval-toggle">
                  <input type="checkbox" checked={s.reviewEnabled} disabled={busy} onChange={(event) => s.setReviewEnabled(event.target.checked)} />
                  <span><strong>Second-AI review</strong><small>Off unless you turn it on. A second model reads the draft against your guide's checklist and offers a revision; you pick one.</small></span>
                </label>
                <div className="stylofact-callout-action">
                  <button type="button" className="stylofact-button primary" disabled={busy || !keptQuotes.length || !s.guide.text?.trim() || !s.writerModel} onClick={() => act(() => s.writePiece(piece))}>
                    {piece.draft ? 'Write it again' : 'Write the piece'}
                  </button>
                  <span>{!s.guide.text?.trim() ? 'write the guide first' : !keptQuotes.length ? 'keep at least one quote first' : `${keptQuotes.length} quote${keptQuotes.length === 1 ? '' : 's'} · ${formLabel(piece.form)}${piece.form !== 'all' && s.guide.addenda?.[piece.form] ? ' addendum' : ''} · guide revision ${s.guide.revision}`}</span>
                </div>
                {piece.draft && (
                  <>
                    <div className={`stylofact-draft-columns ${piece.review ? 'two' : ''}`}>
                      <article className={`stylofact-artifact-card is-open ${piece.chosen !== 'review' ? 'is-kept' : ''}`}>
                        <div className="stylofact-artifact-head">
                          <span className="stylofact-artifact-identity"><strong>Draft</strong><span>{wordCount(piece.draft).toLocaleString()} words</span></span>
                          <span className="stylofact-artifact-actions">
                            {piece.review && piece.chosen === 'review' && <button type="button" className="stylofact-text-button" disabled={busy} onClick={() => act(() => s.choosePieceVersion(piece, 'draft'))}>Keep this one</button>}
                            <button type="button" className="stylofact-text-button" onClick={() => copy(piece.draft)}>Copy</button>
                          </span>
                        </div>
                        <div className="stylofact-artifact-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{piece.draft}</ReactMarkdown></div>
                      </article>
                      {piece.review && (
                        <article className={`stylofact-artifact-card is-open ${piece.chosen === 'review' ? 'is-kept' : ''}`}>
                          <div className="stylofact-artifact-head">
                            <span className="stylofact-artifact-identity"><strong>Second-AI revision</strong><span>{wordCount(piece.review).toLocaleString()} words</span></span>
                            <span className="stylofact-artifact-actions">
                              {piece.chosen !== 'review' && <button type="button" className="stylofact-text-button" disabled={busy} onClick={() => act(() => s.choosePieceVersion(piece, 'review'))}>Keep this one</button>}
                              <button type="button" className="stylofact-text-button" onClick={() => copy(piece.review)}>Copy</button>
                            </span>
                          </div>
                          <div className="stylofact-artifact-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{piece.review}</ReactMarkdown></div>
                        </article>
                      )}
                    </div>
                    <DriftReadout drift={piece.drift} />
                    {chosenText && <div className="stylofact-output-bundle"><span>{piece.chosen === 'review' ? 'The revision is the kept version.' : 'The draft is the kept version.'}</span><button type="button" className="stylofact-button secondary" onClick={() => copy(chosenText)}>Copy the kept version</button></div>}
                  </>
                )}
              </>
            )}
          </section>
        )}
      </main>
      <ContextViewer context={context} focusIndex={context?.focusIndex} quoteText={context?.quoteText} onClose={() => setContext(null)} />
    </section>
  );
}
