import { useEffect, useId, useMemo, useRef, useState } from 'react';
import selectorParser from 'postcss-selector-parser';
import { useTheme } from '../../theme/ThemeProvider';
import logger from '../../lib/logger';

const PAGE_SIZE = 40;
const PROPERTY_OPTIONS = [
  'color', 'background', 'background-color', 'background-image', 'box-shadow', 'text-shadow',
  'border', 'border-color', 'border-width', 'border-style', 'border-radius', 'corner-shape',
  'outline', 'outline-offset', 'opacity', 'filter', 'backdrop-filter', 'font', 'font-family',
  'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform',
  'text-decoration', 'fill', 'stroke', 'accent-color', 'caret-color', 'color-scheme',
];
const STATES = [['', 'As selected'], [':hover', 'Hover'], [':focus-visible', 'Keyboard focus'], [':active', 'Pressed'], ['::before', 'Before'], ['::after', 'After']];
const countOf = (value) => Array.isArray(value) ? value.length : Number(value) || 0;
const textOfContext = (context) => Array.isArray(context)
  ? context.map((item) => typeof item === 'string' ? item : item.label || `@${item.name || ''} ${item.params || ''}`).join(' → ')
  : typeof context === 'string' ? context : '';
const declarationValue = (declaration) => `${declaration.value ?? ''}${declaration.important ? ' !important' : ''}`;

function editableColor(value) {
  const literal = String(value).replace(/\s*!important\s*$/i, '').trim();
  if (/^#[\da-f]{6}$/i.test(literal)) return literal;
  if (/^#[\da-f]{3}$/i.test(literal)) return `#${literal.slice(1).split('').map((digit) => digit + digit).join('')}`;
  const rgb = literal.match(/^rgb\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*\)$/i);
  if (rgb) return `#${rgb.slice(1).map((part) => Math.min(255, Math.max(0, Math.round(Number(part)))).toString(16).padStart(2, '0')).join('')}`;
  return null;
}

function reportEditError(error, context) {
  const message = error?.message || String(error);
  logger.error('settings.theme.editor', `Theme edit was not applied: ${message}`, { ...context, nextStep: 'Correct the highlighted CSS value, or press Escape to restore its current value.' });
  return message;
}

function assertResult(result) {
  if (result === false) throw new Error('This value could not be applied. Review the theme warning and try again.');
  if (result?.error) throw new Error(result.error);
}

export function CssValueEditor({ value, label, onCommit, multiline = false }) {
  const [draft, setDraft] = useState(String(value ?? ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fieldId = useId();
  const original = String(value ?? '');
  const color = editableColor(original);
  const draftRef = useRef(draft);
  const committingRef = useRef(false);
  useEffect(() => { setDraft(original); draftRef.current = original; setError(''); }, [original]);
  const commit = async () => {
    const next = draftRef.current.trim();
    if (next === original || committingRef.current) return;
    if (!next) { setError('Enter a CSS value. Use “initial” to reset the property.'); return; }
    committingRef.current = true;
    setBusy(true);
    const submitted = /!important\s*$/i.test(original) && !/!important\s*$/i.test(next) ? `${next} !important` : next;
    try { assertResult(await onCommit(submitted)); draftRef.current = submitted; setDraft(submitted); setError(''); }
    catch (failure) { setError(reportEditError(failure, { field: label })); }
    finally { committingRef.current = false; setBusy(false); }
  };
  const Input = multiline ? 'textarea' : 'input';
  return (
    <span className="theme-source-value">
      <span className="theme-source-value-control">
      <Input
        id={fieldId}
        className="theme-source-value-input"
        aria-label={label}
        title={/!important\s*$/i.test(original) ? 'This declaration keeps !important. Remove that marker in the full appearance stylesheet when needed.' : 'Enter a CSS value. Enter applies; Escape restores the current value.'}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-busy={busy}
        spellCheck={false}
        autoComplete="off"
        value={draft}
        rows={multiline ? 2 : undefined}
        onChange={(event) => { draftRef.current = event.target.value; setDraft(event.target.value); setError(''); }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (!multiline || event.metaKey || event.ctrlKey)) { event.preventDefault(); event.currentTarget.blur(); }
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); draftRef.current = original; setDraft(original); setError(''); event.currentTarget.blur(); }
        }}
      />
      {color && <input type="color" className="theme-source-color-input" value={color} aria-label={`Pick color for ${label}`} disabled={busy} onChange={(event) => { const next = `${event.target.value}${/!important\s*$/i.test(original) ? ' !important' : ''}`; draftRef.current = next; setDraft(next); commit(); }} />}
      </span>
      {error && <small id={`${fieldId}-error`} className="theme-source-error" role="alert">{error}</small>}
    </span>
  );
}

function SourceLocation({ source }) {
  const context = textOfContext(source.context);
  return <small className="theme-source-location" title={[source.selector, context].filter(Boolean).join(' · ')}>{source.selector && <code>{source.selector}</code>}<span>{source.source || 'Theme CSS'}{source.line != null ? ` · line ${source.line}` : ''}</span>{context && <span>{context}</span>}</small>;
}

function VariableRow({ variable }) {
  const theme = useTheme();
  const definitions = variable.definitions?.length ? variable.definitions : [{ ...variable, id: variable.declarationId }];
  const uses = countOf(variable.uses);
  const renderDefinition = (definition, index) => (
    <div className="theme-source-variable-definition" key={definition.id || `${variable.name}-${index}`}>
      <SourceLocation source={definition} />
      <CssValueEditor value={declarationValue(definition)} label={`${variable.name}, ${definition.selector || 'definition'}${definition.line ? `, line ${definition.line}` : ''}`} onCommit={(value) => theme.updateVariable(variable.name, value, definition.id)} />
      {definition.readOnly && <small className="theme-source-location">Defined in the shared structure. Editing creates a value for this theme.</small>}
    </div>
  );
  return (
    <article className="theme-source-variable">
      <div className="theme-source-variable-heading"><code>{variable.name}</code><span className={uses ? '' : 'theme-source-unused'} title="References to this variable in the theme and application source">{uses} {uses === 1 ? 'use' : 'uses'}</span></div>
      {definitions.length === 1 ? renderDefinition(definitions[0], 0) : (
        <details className="theme-source-definitions">
          <summary><span>{definitions.length} definitions · choose the source to edit</span><code>{variable.value}</code></summary>
          {definitions.map(renderDefinition)}
        </details>
      )}
      {!uses && <small className="theme-source-location">No static references found; scripts or imported rules may still use this variable.</small>}
      {!variable.definitions?.length && <small className="theme-source-location">Referenced without a definition. Enter a value to define it for this theme.</small>}
    </article>
  );
}

function RuleEditor({ rule, open = false }) {
  const theme = useTheme();
  return (
    <details className="theme-source-rule" open={open || undefined}>
      <summary><code>{rule.selector}</code><span>{rule.declarations?.length || 0}</span></summary>
      <SourceLocation source={{ ...rule, selector: undefined }} />
      {(rule.inherited || rule.active === false || rule.active === null || rule.pseudo) && <p className="theme-source-note">{rule.inherited ? `Container rule from ${rule.inheritedFrom || 'an ancestor'}; computed values show whether it is inherited. ` : ''}{rule.active === false ? 'This state or condition is not active now. ' : ''}{rule.active === null ? 'This condition’s current activity is unknown. ' : ''}{rule.pseudo ? 'Pseudo-element styling. ' : ''}Edits keep this selector and its conditions.</p>}
      {(rule.declarations || []).map((declaration) => <label className="theme-source-declaration" key={declaration.id}><span>{declaration.property}</span><CssValueEditor value={declarationValue(declaration)} label={`${declaration.property} in ${rule.selector}, line ${declaration.line || rule.line}`} onCommit={(value) => theme.updateDeclaration(declaration.id, value)} /></label>)}
    </details>
  );
}

export function StylesheetEditor({ onBufferChange, discardBufferRef }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(theme.sourceCss || '');
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const baseRef = useRef(theme.sourceCss || '');
  const fieldId = useId();
  const source = theme.sourceCss || '';
  const changedElsewhere = source !== baseRef.current;
  const modified = draft !== baseRef.current;
  useEffect(() => {
    if (draft === baseRef.current) { baseRef.current = source; setDraft(source); }
  }, [source, draft]);
  useEffect(() => { onBufferChange?.(modified); }, [modified, onBufferChange]);
  useEffect(() => {
    const discard = () => { baseRef.current = source; setDraft(source); setError(''); setApplied(false); };
    if (discardBufferRef) discardBufferRef.current = discard;
    return () => { if (discardBufferRef?.current === discard) discardBufferRef.current = null; };
  }, [discardBufferRef, source]);
  useEffect(() => {
    if (!modified) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [modified]);
  const reload = () => {
    if (modified && !window.confirm('Discard the unapplied stylesheet text and reload the current theme?')) return;
    baseRef.current = source; setDraft(source); setError(''); setApplied(false);
  };
  const apply = async () => {
    if (changedElsewhere && !window.confirm('The theme changed while this stylesheet was being edited. Replace its current appearance with the text below?')) return;
    setBusy(true);
    try { assertResult(await theme.replaceSourceCss(draft)); baseRef.current = draft; setError(''); setApplied(true); }
    catch (failure) { setError(reportEditError(failure, { field: 'Full appearance stylesheet' })); }
    finally { setBusy(false); }
  };
  return (
    <details className="theme-studio-advanced theme-source-full-editor">
      <summary>Full appearance stylesheet <span>{source.split('\n').length.toLocaleString()} lines</span></summary>
      <p className="theme-source-note">Edit every selector and state in this theme. Apply previews the text; Save keeps it. CSS export contains this complete stylesheet for Chromap.</p>
      <label className="theme-source-label" htmlFor={fieldId}>Appearance CSS</label>
      <textarea id={fieldId} value={draft} onChange={(event) => { setDraft(event.target.value); setError(''); setApplied(false); }} spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} />
      {changedElsewhere && <p className="theme-source-note">Other theme edits have changed the current stylesheet. Reload it or apply this text to replace it.</p>}
      {error && <p className="theme-source-error" id={`${fieldId}-error`} role="alert">{error}</p>}
      <div className="theme-source-actions"><button type="button" onClick={apply} disabled={busy || !modified}>{busy ? 'Applying…' : 'Apply stylesheet'}</button><button type="button" onClick={reload} disabled={busy || (!modified && !changedElsewhere)}>Reload current</button><span role="status">{applied ? 'Applied · save to keep' : modified ? 'Text not applied' : ''}</span></div>
    </details>
  );
}

export function VariableInventory({ onBufferChange, discardBufferRef }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('variables');
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const variables = theme.sourceIndex?.variables || [];
  const rules = theme.sourceIndex?.rules || [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (kind === 'rules') return rules.filter((rule) => [rule.selector, textOfContext(rule.context), ...(rule.declarations || []).map((item) => `${item.property} ${item.value}`)].some((text) => text?.toLowerCase().includes(needle)));
    return variables.filter((variable) => (filter !== 'unused' || !countOf(variable.uses)) && (filter !== 'repeated' || variable.definitions?.length > 1) && [variable.name, variable.value, ...(variable.definitions || []).map((item) => `${item.selector || ''} ${item.value || ''}`)].some((text) => text?.toLowerCase().includes(needle)));
  }, [query, kind, filter, variables, rules]);
  useEffect(() => setLimit(PAGE_SIZE), [query, kind, filter]);
  return (
    <section className="theme-source-inventory">
      <div className="theme-source-heading"><h3>Theme source</h3><span>{variables.length.toLocaleString()} variables · {rules.length.toLocaleString()} rules</span></div>
      <p className="theme-source-note">The complete appearance layer for this theme. Values keep their original selectors, order, and conditions.</p>
      <div className="theme-studio-segmented theme-source-switch" role="group" aria-label="Browse theme source">{[['variables', 'Variables'], ['rules', 'Rules & states']].map(([id, label]) => <button key={id} type="button" aria-pressed={kind === id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}>{label}</button>)}</div>
      <input className="theme-source-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === 'variables' ? 'Find a variable or value…' : 'Find a selector, property, or value…'} aria-label={kind === 'variables' ? 'Search theme variables' : 'Search theme rules'} />
      {kind === 'variables' && <label className="theme-source-filter"><span>Show</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All variables</option><option value="unused">No static uses</option><option value="repeated">Multiple definitions</option></select></label>}
      <p className="theme-source-count" role="status">{filtered.length.toLocaleString()} {kind === 'variables' ? 'variables' : 'rules'}{filtered.length > limit ? ` · showing ${limit}` : ''}</p>
      {filtered.slice(0, limit).map((item) => kind === 'variables' ? <VariableRow key={item.name} variable={item} /> : <RuleEditor key={item.id} rule={item} />)}
      {!filtered.length && <p className="theme-source-note">{query || filter !== 'all' ? 'No matches. Try another name, value, or filter.' : 'This theme has no source entries yet. Add appearance rules by picking an object, or import a CSS file.'}</p>}
      {filtered.length > limit && <button className="theme-source-more" type="button" onClick={() => setLimit((current) => current + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - limit)} more</button>}
      <StylesheetEditor onBufferChange={onBufferChange} discardBufferRef={discardBufferRef} />
    </section>
  );
}

export function IndependentThemeForm({ onBeforeNavigate }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [start, setStart] = useState('default');
  const [error, setError] = useState('');
  const fieldId = useId();
  const create = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    try { const result = theme.createIndependentTheme(name.trim(), start === 'blank' ? { cssText: '' } : {}); assertResult(result); setError(''); if (result) setName(''); }
    catch (failure) { setError(reportEditError(failure, { action: 'Create independent theme' })); }
  };
  return (
    <form className="theme-source-create" onSubmit={create}>
      <div className="theme-source-heading"><h3>Independent theme</h3></div>
      <p className="theme-source-note">Own every appearance rule. Later changes to another theme do not change this one.</p>
      <label className="theme-source-label" htmlFor={fieldId}>Theme name</label>
      <input id={fieldId} value={name} maxLength={80} placeholder="Name your theme" onChange={(event) => setName(event.target.value)} required />
      <label className="theme-source-filter"><span>Start with</span><select value={start} onChange={(event) => setStart(event.target.value)}><option value="default">Complete default appearance</option><option value="blank">Empty appearance stylesheet</option></select></label>
      {start === 'blank' && <p className="theme-source-note">The layout stays in place. Add appearance values from Selected or paste CSS in Global to style the empty theme.</p>}
      <div className="theme-source-actions"><button type="submit" disabled={!name.trim()}>Create independent theme</button></div>
      {error && <p className="theme-source-error" role="alert">{error}</p>}
    </form>
  );
}

function selectorMatchCount(selector) {
  if (!selector) return 0;
  try { return document.querySelectorAll(selector).length; }
  catch { return null; }
}

function selectorWithState(selector, state) {
  if (!selector || !state) return selector;
  try {
    const ast = selectorParser().astSync(selector);
    ast.each((entry) => {
      const part = selectorParser.pseudo({ value: state });
      const isPart = (node) => node.type === 'pseudo' && /^::|^:(before|after|first-line|first-letter)$/.test(node.value);
      const existingPart = entry.nodes.find(isPart);
      if (state.startsWith('::')) {
        if (existingPart) existingPart.replaceWith(part);
        else entry.append(part);
      } else if (!entry.nodes.some((node) => node.type === 'pseudo' && node.value === state)) {
        if (existingPart) entry.insertBefore(existingPart, part);
        else entry.append(part);
      }
    });
    return ast.toString();
  } catch { return `${selector}${state}`; }
}

function AddAppearanceRule({ selector, initialProperty, onUsed }) {
  const theme = useTheme();
  const [property, setProperty] = useState('color');
  const [value, setValue] = useState('');
  const [important, setImportant] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState('');
  const propertyId = useId();
  const valueId = useId();
  const inputRef = useRef(null);
  useEffect(() => {
    if (!initialProperty) return;
    setProperty(initialProperty.property); setValue(initialProperty.value); setApplied(''); setError('');
    inputRef.current?.focus(); onUsed();
  }, [initialProperty, onUsed]);
  const add = async (event) => {
    event.preventDefault();
    try {
      assertResult(await theme.updateCssRule(selector, property.trim(), value.trim(), { important }));
      setError(''); setApplied(`${property.trim()} applied · save to keep`);
    } catch (failure) { setError(reportEditError(failure, { selector, property })); setApplied(''); }
  };
  return (
    <form className="theme-source-add" onSubmit={add}>
      <h3>Add or override a value</h3>
      <code className="theme-source-target-selector">{selector}</code>
      <div className="theme-source-add-fields"><label htmlFor={propertyId}>Property<input id={propertyId} value={property} list={`${propertyId}-options`} onChange={(event) => { setProperty(event.target.value); setApplied(''); }} placeholder="border-radius" spellCheck={false} required /></label><label htmlFor={valueId}>CSS value<input ref={inputRef} id={valueId} value={value} onChange={(event) => { setValue(event.target.value); setError(''); setApplied(''); }} placeholder="12px" spellCheck={false} required /></label></div>
      <datalist id={`${propertyId}-options`}>{PROPERTY_OPTIONS.map((item) => <option key={item} value={item} />)}</datalist>
      <div className="theme-source-actions"><label className="theme-source-important"><input type="checkbox" checked={important} onChange={(event) => { setImportant(event.target.checked); setApplied(''); }} />!important</label><button type="submit" disabled={!selector || !property.trim() || !value.trim()}>Apply value</button></div>
      {error && <p className="theme-source-error" role="alert">{error}</p>}
      {applied && <p className="theme-source-count" role="status">{applied}</p>}
    </form>
  );
}

export function SelectionEditor() {
  const theme = useTheme();
  const selected = theme.selectedTarget;
  const details = theme.selectionDetails;
  const [scope, setScope] = useState('element');
  const [chosenSelector, setChosenSelector] = useState('');
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [initialProperty, setInitialProperty] = useState(null);
  const element = selected?.element;
  const selectors = [...new Set([...(details?.selectors || selected?.selectors || []), ...(details?.rules || []).map((rule) => rule.selector)].filter((selector) => typeof selector === 'string' && selector))];
  useEffect(() => { setScope('element'); setChosenSelector(''); setState(''); setQuery(''); setLimit(PAGE_SIZE); setInitialProperty(null); }, [element]);
  useEffect(() => setLimit(PAGE_SIZE), [query]);
  if (!selected) return <div className="theme-studio-empty"><span>NO OBJECT SELECTED</span><p>Pick any object, then move through its containers, children, and siblings with the arrow keys.</p><button type="button" onClick={theme.startPicker}>Pick object</button></div>;
  const rules = details?.rules || [];
  const selector = scope === 'element' ? (selected.selector || details?.selector || '') : chosenSelector || selectors[0] || '';
  const targetSelector = selectorWithState(selector, state);
  const matchCount = selectorMatchCount(selector);
  const filteredRules = rules.filter((rule) => [rule.selector, ...(rule.declarations || []).map((item) => `${item.property} ${item.value}`)].some((text) => text?.toLowerCase().includes(query.trim().toLowerCase())));
  const computed = details?.properties || [];
  const inline = details?.inline || [];
  return (
    <div className="theme-studio-view theme-studio-selected theme-source-selected">
      <div className="theme-studio-selection-heading"><span>SELECTED OBJECT</span><strong>{details?.label || selected.label}</strong></div>
      <nav className="theme-source-breadcrumb" aria-label="Selected object containers">{(details?.ancestors || []).map((ancestor, index) => <button key={`${ancestor.label}-${index}`} type="button" title={ancestor.label} onClick={() => theme.selectElement(ancestor.element)}>{ancestor.label}</button>)}<span aria-current="true">{details?.label || selected.label}</span></nav>
      <div className="theme-source-navigation" role="group" aria-label="Move selection through the document">
        {[['previous', '←', 'Previous sibling', !element?.previousElementSibling], ['parent', '↑', 'Parent container', !element?.parentElement], ['child', '↓', 'First child', !element?.firstElementChild], ['next', '→', 'Next sibling', !element?.nextElementSibling]].map(([direction, glyph, label, disabled]) => <button key={direction} type="button" disabled={disabled} onClick={() => theme.navigateSelection(direction)} aria-label={label} title={label}><span aria-hidden="true">{glyph}</span><small>{direction === 'previous' ? 'Previous' : direction === 'next' ? 'Next' : direction === 'parent' ? 'Parent' : 'Child'}</small></button>)}
        <button type="button" onClick={theme.startPicker}>Pick again</button>
      </div>
      <p className="theme-source-note">Arrow keys move selection when you are not typing: ↑ parent, ↓ child, ← / → siblings.</p>
      {details?.warning && <p className="theme-source-notice" role="status">{details.warning}</p>}
      <fieldset className="theme-source-scope"><legend>Apply new values to</legend><label><input type="radio" name="theme-source-scope" checked={scope === 'element'} onChange={() => setScope('element')} />This element <span>1</span></label><label><input type="radio" name="theme-source-scope" checked={scope === 'selector'} disabled={!selectors.length} onChange={() => setScope('selector')} />Existing selector <span>{scope === 'selector' && matchCount != null ? `${matchCount} matches` : `${selectors.length} available`}</span></label>{scope === 'selector' && <select aria-label="Existing selector to edit" value={chosenSelector || selectors[0] || ''} onChange={(event) => setChosenSelector(event.target.value)}>{selectors.map((item) => <option key={item} value={item}>{item}</option>)}</select>}<label className="theme-source-state"><span>State / part</span><select aria-label="State or pseudo-element to style" value={state} onChange={(event) => setState(event.target.value)}>{STATES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></fieldset>
      <AddAppearanceRule selector={targetSelector} initialProperty={initialProperty} onUsed={() => setInitialProperty(null)} />
      <section className="theme-source-matched"><div className="theme-source-heading"><h3>Authored rules</h3><span>{rules.length} selectors</span></div><p className="theme-source-note">These edits affect each displayed selector and keep its cascade position. The scope above applies to new values.</p><input type="search" className="theme-source-search" aria-label="Filter selected object rules" placeholder="Find a property, selector, or value…" value={query} onChange={(event) => setQuery(event.target.value)} />{filteredRules.slice(0, limit).map((rule) => <RuleEditor key={rule.id} rule={rule} />)}{!filteredRules.length && <p className="theme-source-note">{query ? 'No matching authored rules. Try another search.' : 'No direct appearance rule matches this element. Add a value above, or move up to its container.'}</p>}{filteredRules.length > limit && <button type="button" className="theme-source-more" onClick={() => setLimit((current) => current + PAGE_SIZE)}>Show more rules</button>}</section>
      {!!inline.length && <details className="theme-studio-advanced"><summary>Inline values from the app <span>{inline.length}</span></summary><p className="theme-source-note">The component sets these values directly. Use a theme override above to change their appearance; !important can override an ordinary inline value.</p>{inline.map((item) => <div className="theme-source-computed" key={item.property}><span>{item.property}</span><code>{declarationValue(item)}</code><button type="button" onClick={() => setInitialProperty(item)} aria-label={`Use inline ${item.property} as an override`}>Use</button></div>)}</details>}
      <details className="theme-studio-advanced"><summary>Computed appearance <span>{computed.length}</span></summary><p className="theme-source-note">What the browser paints now, including inheritance and active states. Use a value to start an explicit override.</p>{computed.map((item) => <div className="theme-source-computed" key={item.property}><span>{item.property}</span><code>{item.value}</code><button type="button" onClick={() => setInitialProperty(item)} aria-label={`Use computed ${item.property} as an override`}>Use</button></div>)}</details>
    </div>
  );
}
