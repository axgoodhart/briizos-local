import { useEffect, useRef, useState } from 'react';
import { DEFAULT_GENERATOR_SETTINGS, surpriseGeneratorSettings } from '../../theme/chromap';
import { FONT_OPTIONS, GLOBAL_TOKEN_GROUPS, TARGET_REGISTRY } from '../../theme/themeRegistry';
import { useTheme } from '../../theme/ThemeProvider';
import './ThemeStudio.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function rgbToHex(value) {
  const match = value?.match?.(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]].map((part) => clamp(Math.round(Number(part)), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function colorInputValue(value, fallback = '#777777') {
  if (/^#[0-9a-f]{6}$/i.test(value || '')) return value.slice(0, 7);
  if (/^#[0-9a-f]{3}$/i.test(value || '')) return `#${value.slice(1).split('').map((part) => part + part).join('')}`;
  const direct = rgbToHex(value);
  if (direct) return direct;
  if (typeof document !== 'undefined' && value && !value.includes('gradient')) {
    const probe = document.createElement('span');
    probe.style.color = value;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const resolved = rgbToHex(getComputedStyle(probe).color);
    probe.remove();
    if (resolved) return resolved;
  }
  return fallback;
}

function numericValue(value, token) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return token.min || 0;
  if ((token.id === 'motionFast' || token.id === 'motionNormal') && /(^|\s)[\d.]+s\b/.test(value) && !value.includes('ms')) return number * 1000;
  return number;
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function DirtyGuard() {
  const { pendingChange, resolvePendingChange } = useTheme();
  if (!pendingChange) return null;
  return (
    <div className="theme-studio-dirty-guard" role="alert">
      <span>Keep these unsaved edits?</span>
      <div>
        <button type="button" onClick={() => resolvePendingChange('save')}>Save</button>
        <button type="button" onClick={() => resolvePendingChange('discard')}>Discard</button>
        <button type="button" onClick={() => resolvePendingChange('keep')}>Keep editing</button>
      </div>
    </div>
  );
}

function NameAction({ action, onCancel }) {
  const { activeTheme, draftTheme, saveAs, renameTheme } = useTheme();
  const [name, setName] = useState(action === 'rename' ? (draftTheme?.name || activeTheme?.name || '') : `${draftTheme?.name || activeTheme?.name || activeTheme?.label || 'Theme'} Copy`);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (action === 'rename') await renameTheme(activeTheme.id, name);
      else await saveAs(name);
      onCancel();
    } finally { setBusy(false); }
  };
  return (
    <form className="theme-studio-name-action" onSubmit={submit}>
      <label>{action === 'rename' ? 'Rename theme' : 'Save a new theme'}</label>
      <div>
        <input autoFocus value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        <button type="submit" disabled={busy || !name.trim()}>{busy ? '…' : 'OK'}</button>
        <button type="button" onClick={onCancel}>×</button>
      </div>
    </form>
  );
}

function StudioHeader({ onClose }) {
  const theme = useTheme();
  const [nameAction, setNameAction] = useState(null);
  const importRef = useRef(null);
  const isCustom = Boolean(theme.activeTheme?.variables);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try { theme.importTheme(await file.text()); }
    catch (error) { theme.setWarning(`Theme import rejected: ${error.message}`); }
  };

  const exportFile = (format) => {
    try {
      const id = theme.draftTheme?.id || theme.activeTheme?.id || 'theme';
      if (format === 'json') downloadText(`${id}.briiztheme.json`, theme.exportJson(), 'application/json');
      else downloadText(`${id}.css`, theme.exportCss(), 'text/css');
    } catch (error) { theme.setWarning(error.message); }
  };

  const deleteCurrent = async () => {
    if (!isCustom) return;
    if (!window.confirm(`Delete “${theme.activeTheme.name}”? This cannot be undone.`)) return;
    await theme.deleteTheme(theme.activeTheme.id);
  };

  return (
    <>
      <header className="theme-studio-header" data-theme-role="header">
        <div className="theme-studio-title-row">
          <div>
            <span className="theme-studio-kicker">briizOS / chromap</span>
            <strong>Theme Studio</strong>
          </div>
          <span className={`theme-studio-dirty-dot ${theme.isDirty ? 'active' : ''}`} title={theme.isDirty ? 'Unsaved changes' : 'Saved'} />
          <button className="theme-studio-icon-btn" type="button" onClick={onClose} aria-label="Close Theme Studio">×</button>
        </div>
        <select className="theme-studio-theme-select" value={theme.draftTheme?.id || theme.activeThemeId} onChange={(event) => theme.selectTheme(event.target.value)}>
          <optgroup label="Built-in">
            {theme.builtInThemes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </optgroup>
          {theme.customThemes.length > 0 && (
            <optgroup label="Custom">
              {theme.customThemes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </optgroup>
          )}
          {theme.draftTheme && !theme.customThemes.some((item) => item.id === theme.draftTheme.id) && <option value={theme.draftTheme.id}>{theme.draftTheme.name} — draft</option>}
        </select>
        <div className="theme-studio-command-row">
          <button className="theme-studio-save" type="button" onClick={theme.save} disabled={!theme.isDirty}>Save</button>
          <button type="button" onClick={() => setNameAction('saveAs')}>Save as</button>
          <button type="button" onClick={theme.revert} disabled={!theme.isDirty}>Revert</button>
          <span className="theme-studio-command-spacer" />
          <button className="theme-studio-icon-btn" type="button" onClick={theme.undo} disabled={!theme.canUndo} title="Undo">↶</button>
          <button className="theme-studio-icon-btn" type="button" onClick={theme.redo} disabled={!theme.canRedo} title="Redo">↷</button>
          <details className="theme-studio-more">
            <summary aria-label="Theme actions">•••</summary>
            <div>
              <button type="button" onClick={() => theme.duplicateTheme()}>Duplicate</button>
              <button type="button" disabled={!isCustom} onClick={() => setNameAction('rename')}>Rename</button>
              <button type="button" onClick={() => importRef.current?.click()}>Import JSON</button>
              <button type="button" onClick={() => exportFile('json')}>Export JSON</button>
              <button type="button" onClick={() => exportFile('css')}>Export CSS</button>
              <button className="danger" type="button" disabled={!isCustom} onClick={deleteCurrent}>Delete</button>
            </div>
          </details>
          <input ref={importRef} className="theme-studio-file-input" type="file" accept="application/json,.json" onChange={importFile} />
        </div>
      </header>
      {nameAction && <NameAction action={nameAction} onCancel={() => setNameAction(null)} />}
      <DirtyGuard />
    </>
  );
}

function GeneratorView() {
  const { draftTheme, activeTheme, applyGeneratedTheme, setWarning } = useTheme();
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_GENERATOR_SETTINGS,
    mode: activeTheme?.mode || 'dark',
    ...(draftTheme?.generator || {}),
  }));

  useEffect(() => {
    if (draftTheme?.generator) setSettings({ ...DEFAULT_GENERATOR_SETTINGS, ...draftTheme.generator });
  }, [draftTheme?.id]);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    const generated = applyGeneratedTheme(next);
    if (generated.warnings.length) setWarning(generated.warnings.join(' '));
  };

  const surprise = () => update(surpriseGeneratorSettings(settings));
  return (
    <div className="theme-studio-view theme-studio-generator">
      <div className="theme-studio-intro">
        <span>PERCEPTUAL GENERATOR</span>
        <p>Build a coherent palette around one anchor. The inherited theme keeps its authored materials unless you replace them.</p>
      </div>
      <div className="theme-studio-segmented" role="group" aria-label="Theme mode">
        {['dark', 'light'].map((mode) => <button type="button" key={mode} className={settings.mode === mode ? 'active' : ''} onClick={() => update({ mode })}>{mode}</button>)}
      </div>
      <div className="theme-studio-anchor-grid">
        <label><span>Primary anchor</span><input type="color" value={settings.primaryAnchor} onChange={(event) => update({ primaryAnchor: event.target.value })} /></label>
        <label><span>Secondary</span><input type="color" value={settings.secondaryAnchor || settings.primaryAnchor} onChange={(event) => update({ secondaryAnchor: event.target.value })} /></label>
      </div>
      <label className="theme-studio-field"><span>Harmony</span><select value={settings.harmony} onChange={(event) => update({ harmony: event.target.value })}><option value="analogous">Analogous</option><option value="complementary">Complementary</option><option value="split-complementary">Split complementary</option><option value="triadic">Triadic</option></select></label>
      {[['temperature', 'Temperature', -100, 100], ['saturation', 'Saturation', 0, 100], ['contrast', 'Contrast', 0, 100], ['glowStrength', 'Glow', 0, 60]].map(([id, label, min, max]) => (
        <label className="theme-studio-range" key={id}><span>{label}<output>{settings[id]}</output></span><input type="range" min={min} max={max} value={settings[id]} onChange={(event) => update({ [id]: Number(event.target.value) })} /></label>
      ))}
      <label className="theme-studio-field"><span>Material</span><select value={settings.material} onChange={(event) => update({ material: event.target.value })}><option value="inherit">Inherit base recipes</option><option value="flat">Flat</option><option value="layered">Layered</option><option value="glass">Glass</option></select></label>
      <label className="theme-studio-field"><span>Seed</span><input type="number" min="1" max="2147483647" value={settings.seed} onChange={(event) => update({ seed: Number(event.target.value) || 1 })} /></label>
      <button className="theme-studio-surprise" type="button" onClick={surprise}><span>Surprise me</span><small>New harmony, treatment, and deterministic seed</small></button>
    </div>
  );
}

function GlobalToken({ token }) {
  const { getGlobalTokenValue, updateGlobalToken } = useTheme();
  const value = getGlobalTokenValue(token.id);
  if (token.type === 'color') {
    return (
      <label className="theme-studio-color-token">
        <span>{token.label}</span>
        <span className="theme-studio-color-control"><code>{value || 'inherit'}</code><input type="color" value={colorInputValue(value)} onChange={(event) => updateGlobalToken(token.id, event.target.value)} /></span>
      </label>
    );
  }
  if (token.type === 'range') {
    const current = numericValue(value, token);
    return <label className="theme-studio-range"><span>{token.label}<output>{Math.round(current)}{token.unit}</output></span><input type="range" min={token.min} max={token.max} step={token.step} value={current} onChange={(event) => updateGlobalToken(token.id, Number(event.target.value))} /></label>;
  }
  if (token.type === 'font') {
    return <label className="theme-studio-field"><span>{token.label}</span><select value={FONT_OPTIONS.some((font) => font.value === value) ? value : ''} onChange={(event) => updateGlobalToken(token.id, event.target.value)}><option value="" disabled>{value || 'Choose font'}</option>{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label>;
  }
  return <label className="theme-studio-field"><span>{token.label}</span><select value={value || token.options[0].value} onChange={(event) => updateGlobalToken(token.id, event.target.value)}>{token.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function GlobalView() {
  const { contrastWarnings } = useTheme();
  const primaryGroups = GLOBAL_TOKEN_GROUPS.filter((group) => !group.advanced);
  const advancedGroups = GLOBAL_TOKEN_GROUPS.filter((group) => group.advanced);
  return (
    <div className="theme-studio-view">
      {contrastWarnings.length > 0 && <div className="theme-studio-contrast-warning">{contrastWarnings.map((warning) => <span key={warning}>△ {warning}</span>)}</div>}
      {primaryGroups.map((group) => <section className="theme-studio-token-section" key={group.id}><h3>{group.label}</h3>{group.tokens.map((token) => <GlobalToken key={token.id} token={token} />)}</section>)}
      <details className="theme-studio-advanced">
        <summary>Advanced controls <span>{advancedGroups.reduce((count, group) => count + group.tokens.length, 0)}</span></summary>
        {advancedGroups.map((group) => <section className="theme-studio-token-section" key={group.id}><h3>{group.label}</h3>{group.tokens.map((token) => <GlobalToken key={token.id} token={token} />)}</section>)}
      </details>
    </div>
  );
}

function ResetButton({ property, scope }) {
  const { resetProperty } = useTheme();
  return <button className="theme-studio-reset" type="button" title={`Reset ${property}`} onClick={() => resetProperty(property, scope)}>↺</button>;
}

function SelectedColor({ property, label, value, scope, onChange }) {
  const source = value?.value || value?.color || '#777777';
  return (
    <label className="theme-studio-color-token selected">
      <span>{label}</span>
      <span className="theme-studio-color-control"><code>{source}</code><input type="color" value={colorInputValue(source)} onChange={(event) => onChange(event.target.value)} /><ResetButton property={property} scope={scope} /></span>
    </label>
  );
}

function SelectedView() {
  const theme = useTheme();
  const [scope, setScope] = useState('role');
  const selected = theme.selectedTarget;
  useEffect(() => setScope('role'), [selected?.role, selected?.componentId, selected?.instanceId]);
  if (!selected) {
    return <div className="theme-studio-empty"><span>NO OBJECT SELECTED</span><p>Choose Pick object, then click any outlined surface in briizOS.</p><button type="button" onClick={theme.startPicker}>Pick object</button></div>;
  }
  const override = theme.getTargetOverride(scope);
  const styles = override?.styles || {};
  const allowed = TARGET_REGISTRY[selected.role]?.properties || [];
  const set = (property, value) => theme.updateTargetStyle(property, value, scope);
  const length = (property, label, max = 48) => {
    if (!allowed.includes(property)) return null;
    const value = styles[property]?.value || 0;
    return <label className="theme-studio-range"><span>{label}<output>{value}px</output></span><span className="theme-studio-range-reset"><input type="range" min="0" max={max} value={value} onChange={(event) => set(property, { kind: 'length', value: Number(event.target.value), unit: 'px' })} /><ResetButton property={property} scope={scope} /></span></label>;
  };
  return (
    <div className="theme-studio-view theme-studio-selected">
      <div className="theme-studio-selection-heading"><span>SELECTED OBJECT</span><strong>{selected.label}</strong><small>{selected.componentId || 'Application'}{selected.instanceId ? ` / ${selected.instanceId}` : ''}</small></div>
      <div className="theme-studio-scope-list">
        <label><input type="radio" checked={scope === 'role'} onChange={() => setScope('role')} />All objects with this role <b>{theme.getTargetMatchCount('role')}</b></label>
        {selected.componentId && <label><input type="radio" checked={scope === 'component'} onChange={() => setScope('component')} />This component family <b>{theme.getTargetMatchCount('component')}</b></label>}
        {selected.instanceId && <label><input type="radio" checked={scope === 'instance'} onChange={() => setScope('instance')} />This instance <b>{theme.getTargetMatchCount('instance')}</b></label>}
      </div>
      <div className="theme-studio-selected-actions"><button type="button" onClick={theme.startPicker}>Pick another</button><button type="button" onClick={() => theme.resetTarget(scope)}>Reset target</button></div>
      <section className="theme-studio-token-section">
        <h3>Paint</h3>
        {allowed.includes('color') && <SelectedColor property="color" label="Foreground" value={styles.color} scope={scope} onChange={(color) => set('color', { kind: 'color', value: color })} />}
        {allowed.includes('background') && <>
          <SelectedColor property="background" label="Background" value={styles.background} scope={scope} onChange={(color) => set('background', { kind: 'solid', color })} />
          <details className="theme-studio-gradient"><summary>Linear gradient</summary><div>
            <label><span>Angle</span><input type="range" min="0" max="360" value={styles.background?.kind === 'linear-gradient' ? styles.background.angle : 145} onChange={(event) => set('background', { kind: 'linear-gradient', angle: Number(event.target.value), stops: styles.background?.kind === 'linear-gradient' ? styles.background.stops : [{ color: '#222222', position: 0 }, { color: '#555555', position: 100 }] })} /></label>
            {[0, 1].map((index) => <label key={index}><span>Stop {index + 1}</span><input type="color" value={styles.background?.kind === 'linear-gradient' ? styles.background.stops[index].color : index ? '#555555' : '#222222'} onChange={(event) => { const background = styles.background?.kind === 'linear-gradient' ? structuredClone(styles.background) : { kind: 'linear-gradient', angle: 145, stops: [{ color: '#222222', position: 0 }, { color: '#555555', position: 100 }] }; background.stops[index].color = event.target.value; set('background', background); }} /></label>)}
          </div></details>
        </>}
        {allowed.includes('borderColor') && <SelectedColor property="borderColor" label="Border" value={styles.borderColor} scope={scope} onChange={(color) => set('borderColor', { kind: 'color', value: color })} />}
        {allowed.includes('boxShadow') && <SelectedColor property="boxShadow" label="Shadow / glow" value={styles.boxShadow} scope={scope} onChange={(color) => set('boxShadow', { kind: 'shadow', color, x: 0, y: 8, blur: styles.boxShadow?.blur || 24, spread: styles.boxShadow?.spread || 0, intensity: styles.boxShadow?.intensity ?? 0.45 })} />}
      </section>
      <section className="theme-studio-token-section"><h3>Shape</h3>{length('borderWidth', 'Border width', 12)}{allowed.includes('borderStyle') && <label className="theme-studio-field"><span>Border style</span><span className="theme-studio-select-reset"><select value={styles.borderStyle?.value || 'solid'} onChange={(event) => set('borderStyle', { kind: 'keyword', value: event.target.value })}><option>solid</option><option>dashed</option><option>dotted</option><option>double</option><option>none</option></select><ResetButton property="borderStyle" scope={scope} /></span></label>}{length('borderRadius', 'Radius', 64)}{allowed.includes('opacity') && <label className="theme-studio-range"><span>Opacity<output>{Math.round((styles.opacity?.value ?? 1) * 100)}%</output></span><span className="theme-studio-range-reset"><input type="range" min="0" max="1" step="0.01" value={styles.opacity?.value ?? 1} onChange={(event) => set('opacity', { kind: 'number', value: Number(event.target.value) })} /><ResetButton property="opacity" scope={scope} /></span></label>}</section>
      <details className="theme-studio-advanced"><summary>Type & spacing</summary><section className="theme-studio-token-section">{allowed.includes('fontFamily') && <label className="theme-studio-field"><span>Font</span><span className="theme-studio-select-reset"><select value={styles.fontFamily?.value || ''} onChange={(event) => set('fontFamily', { kind: 'font', value: event.target.value })}><option value="">Inherited</option>{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select><ResetButton property="fontFamily" scope={scope} /></span></label>}{length('fontSize', 'Font size', 72)}{allowed.includes('fontWeight') && <label className="theme-studio-range"><span>Weight<output>{styles.fontWeight?.value || 400}</output></span><span className="theme-studio-range-reset"><input type="range" min="100" max="900" step="100" value={styles.fontWeight?.value || 400} onChange={(event) => set('fontWeight', { kind: 'number', value: Number(event.target.value) })} /><ResetButton property="fontWeight" scope={scope} /></span></label>}{length('letterSpacing', 'Letter spacing', 12)}{length('padding', 'Safe padding', 64)}{length('minHeight', 'Minimum height', 120)}</section></details>
    </div>
  );
}

export default function ThemeStudio({ isOpen, width, onWidthChange, onClose }) {
  const theme = useTheme();
  const [view, setView] = useState('global');
  const resizeRef = useRef(null);
  useEffect(() => { if (theme.selectedTarget) setView('selected'); }, [theme.selectedTarget]);
  useEffect(() => () => window.removeEventListener('pointermove', resizeRef.current), []);
  if (!isOpen) return null;
  const startResize = (event) => {
    event.preventDefault();
    const originX = event.clientX;
    const originWidth = width;
    const move = (moveEvent) => onWidthChange(clamp(originWidth + originX - moveEvent.clientX, 300, 480));
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); resizeRef.current = null; };
    resizeRef.current = move;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end, { once: true });
  };
  return (
    <aside className="theme-studio" style={{ width }} data-theme-studio="true" aria-label="Theme Studio">
      <div
        className="theme-studio-resize"
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') onWidthChange(width + 10);
          if (event.key === 'ArrowRight') onWidthChange(width - 10);
        }}
        role="separator"
        tabIndex={0}
        aria-valuemin={300}
        aria-valuemax={480}
        aria-valuenow={width}
        aria-orientation="vertical"
        aria-label="Resize Theme Studio"
      />
      <StudioHeader onClose={onClose} />
      <nav className="theme-studio-nav" aria-label="Theme Studio views">
        {[['create', 'Create'], ['global', 'Global'], ['selected', 'Selected']].map(([id, label]) => <button type="button" key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}{id === 'selected' && theme.selectedTarget ? <span /> : null}</button>)}
        <button className={theme.pickerActive ? 'picker active' : 'picker'} type="button" onClick={theme.pickerActive ? theme.cancelPicker : theme.startPicker}>{theme.pickerActive ? 'Cancel pick' : 'Pick object'}</button>
      </nav>
      <main className="theme-studio-content">{view === 'create' && <GeneratorView />}{view === 'global' && <GlobalView />}{view === 'selected' && <SelectedView />}</main>
    </aside>
  );
}
