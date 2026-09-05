import { useEffect, useRef, useState } from 'react';
import { DEFAULT_GENERATOR_SETTINGS, surpriseGeneratorSettings } from '../../theme/chromap';
import { FONT_OPTIONS, GLOBAL_TOKEN_GROUPS } from '../../theme/themeRegistry';
import { useTheme } from '../../theme/ThemeProvider';
import { IndependentThemeForm, SelectionEditor, VariableInventory } from './SourceViews';
import logger from '../../lib/logger';
import '../../AppCombined.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const FONT_DATALIST_ID = 'theme-studio-font-families';

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
    probe.dataset.themeStudio = 'true';
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

function FontFamilyInput({ value, onValueChange, label }) {
  const [draft, setDraft] = useState(value || '');
  const draftRef = useRef(value || '');
  useEffect(() => { setDraft(value || ''); draftRef.current = value || ''; }, [value]);

  const commit = () => {
    const next = draftRef.current.trim();
    if (!next) {
      setDraft(value || '');
      return;
    }
    setDraft(next);
    if (next !== value) onValueChange(next);
  };

  return (
    <input
      className="theme-studio-font-input"
      type="text"
      list={FONT_DATALIST_ID}
      value={draft}
      placeholder="Type an installed font"
      title="Type any installed font family or CSS fallback stack"
      aria-label={label}
      onChange={(event) => {
        const next = event.target.value;
        draftRef.current = next;
        setDraft(next);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          event.stopPropagation();
          draftRef.current = value || '';
          setDraft(value || '');
          event.currentTarget.blur();
        }
      }}
    />
  );
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
  const { activeTheme, draftTheme, saveAs, renameTheme, setWarning } = useTheme();
  const [name, setName] = useState(action === 'rename' ? (draftTheme?.name || activeTheme?.name || '') : `${draftTheme?.name || activeTheme?.name || activeTheme?.label || 'Theme'} Copy`);
  const [busy, setBusy] = useState(false);
  const fieldId = `theme-studio-${action}-name`;
  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (action === 'rename') await renameTheme(activeTheme.id, name);
      else await saveAs(name);
      onCancel();
    } catch (error) {
      setWarning(`Theme could not be ${action === 'rename' ? 'renamed' : 'saved'}: ${error.message}`);
    } finally { setBusy(false); }
  };
  return (
    <form className="theme-studio-name-action" onSubmit={submit}>
      <label htmlFor={fieldId}>{action === 'rename' ? 'Rename theme' : 'Save a new theme'}</label>
      <div>
        <input id={fieldId} autoFocus value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        <button type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : action === 'rename' ? 'Rename' : 'Save theme'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function StudioHeader({ onClose, onBeforeNavigate }) {
  const theme = useTheme();
  const [nameAction, setNameAction] = useState(null);
  const importRef = useRef(null);
  const [busy, setBusy] = useState('');
  const isCustom = Boolean(theme.activeTheme?.variables);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!onBeforeNavigate()) return;
    setBusy('import');
    try { await theme.importTheme(await file.text(), file.name); }
    catch (error) { theme.setWarning(`Theme import rejected: ${error.message}`); logger.error('settings.theme.import', 'Theme file could not be imported.', { filename: file.name, error: error.message }); }
    finally { setBusy(''); }
  };

  const exportFile = (format) => {
    try {
      const id = theme.draftTheme?.id || theme.activeTheme?.id || 'theme';
      if (format === 'json') downloadText(`${id}.briiztheme.json`, theme.exportJson(), 'application/json');
      else downloadText(`${id}.css`, theme.exportCss(), 'text/css');
    } catch (error) { theme.setWarning(error.message); }
  };

  const exportRecovery = () => {
    try { downloadText('briizos-original-theme-library.json', theme.exportOriginalLibrary(), 'application/json'); }
    catch (error) { theme.setWarning(`The recovery copy could not be downloaded: ${error.message}`); }
  };

  const saveCurrent = async () => {
    setBusy('save');
    try { await theme.save(); }
    catch (error) { theme.setWarning(`Theme changes could not be saved: ${error.message}`); }
    finally { setBusy(''); }
  };

  const deleteCurrent = async () => {
    if (!isCustom) return;
    if (!window.confirm(`Delete “${theme.activeTheme.name}”? This cannot be undone.`)) return;
    try { await theme.deleteTheme(theme.activeTheme.id); }
    catch (error) { theme.setWarning(`Theme could not be deleted: ${error.message}`); }
  };

  const replaceTarget = theme.draftTheme || (isCustom ? theme.activeTheme : null);
  const replaceTargetId = replaceTarget?.baseThemeId;
  const canReplaceDefault = Boolean(replaceTargetId)
    && theme.builtInThemes.some((item) => item.id === replaceTargetId)
    && replaceTarget.id !== replaceTargetId;
  const canRestoreDefault = isCustom && theme.builtInThemes.some((item) => item.id === theme.activeTheme.id);

  const replaceDefaultNow = async () => {
    const label = theme.builtInThemes.find((item) => item.id === replaceTargetId)?.label || replaceTargetId;
    if (!window.confirm(`Replace “${label}”'s built-in appearance with your current edits? You can restore the original later from this menu.`)) return;
    try { await theme.replaceDefault(); }
    catch (error) { theme.setWarning(`Could not replace default: ${error.message}`); }
  };

  const restoreDefaultNow = async () => {
    if (!window.confirm(`Restore “${theme.activeTheme.name}” to its original built-in appearance? Your edits will be removed.`)) return;
    try { await theme.restoreDefault(theme.activeTheme.id); }
    catch (error) { theme.setWarning(`Could not restore default: ${error.message}`); }
  };

  return (
    <>
      <header className="theme-studio-header">
        {theme.requiresLibraryBackup && <div className="theme-studio-dirty-guard" role="alert"><span>Saving is paused to preserve the original library. Download and keep its recovery copy first.</span><div><button type="button" onClick={exportRecovery}>Download original library</button><button type="button" onClick={() => { if (window.confirm('Have you kept the original library backup? Continuing allows future saves to replace the recovered library.')) theme.confirmOriginalLibraryProtected(); }}>I kept the backup</button></div></div>}
        <div className="theme-studio-title-row">
          <div>
            <span className="theme-studio-kicker">briizOS / chromap</span>
            <strong>Theme Studio</strong>
          </div>
          <span className={`theme-studio-dirty-dot ${theme.isDirty ? 'active' : ''}`} title={theme.isDirty ? 'Unsaved changes' : 'Saved'} />
          <button className="theme-studio-icon-btn" type="button" onClick={onClose} aria-label="Close Theme Studio">×</button>
        </div>
        <select className="theme-studio-theme-select" aria-label="Current theme" value={theme.draftTheme?.id || theme.activeThemeId} disabled={Boolean(busy)} onChange={(event) => { if (onBeforeNavigate()) theme.selectTheme(event.target.value); }}>
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
          <button className="theme-studio-save" type="button" onClick={saveCurrent} disabled={!theme.isDirty || Boolean(busy)}>{busy === 'save' ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={() => setNameAction('saveAs')}>Save as</button>
          <button type="button" onClick={theme.revert} disabled={!theme.isDirty}>Revert</button>
          <span className="theme-studio-command-spacer" />
          <button className="theme-studio-icon-btn" type="button" onClick={theme.undo} disabled={!theme.canUndo} title="Undo" aria-label="Undo theme edit">↶</button>
          <button className="theme-studio-icon-btn" type="button" onClick={theme.redo} disabled={!theme.canRedo} title="Redo" aria-label="Redo theme edit">↷</button>
          <details className="theme-studio-more">
            <summary aria-label="Theme actions">•••</summary>
            <div>
              <button type="button" onClick={() => { if (onBeforeNavigate()) theme.duplicateTheme(); }}>Duplicate</button>
              <button type="button" disabled={!isCustom} onClick={() => setNameAction('rename')}>Rename</button>
              <button type="button" disabled={!canReplaceDefault} onClick={replaceDefaultNow}>Replace default</button>
              <button type="button" disabled={!canRestoreDefault} onClick={restoreDefaultNow}>Restore default</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => importRef.current?.click()}>{busy === 'import' ? 'Importing…' : 'Import CSS / JSON'}</button>
              <button type="button" onClick={() => exportFile('json')}>Export theme JSON</button>
              <button type="button" onClick={() => exportFile('css')}>Export full CSS</button>
              <button className="danger" type="button" disabled={!isCustom} onClick={deleteCurrent}>Delete</button>
            </div>
          </details>
          <input ref={importRef} className="theme-studio-file-input" type="file" accept="application/json,text/css,.json,.css" onChange={importFile} />
        </div>
      </header>
      {nameAction && <NameAction action={nameAction} onCancel={() => setNameAction(null)} />}
      <DirtyGuard />
      {theme.warning && <div className="theme-source-warning" role="alert"><span>{theme.warning}</span><button type="button" onClick={() => theme.setWarning('')} aria-label="Dismiss theme warning">×</button></div>}
    </>
  );
}

function GeneratorView({ onBeforeNavigate }) {
  const { draftTheme, activeTheme, applyGeneratedTheme, setWarning } = useTheme();
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_GENERATOR_SETTINGS,
    mode: activeTheme?.mode || 'dark',
    ...(draftTheme?.generator || {}),
  }));

  useEffect(() => {
    setSettings({
      ...DEFAULT_GENERATOR_SETTINGS,
      mode: draftTheme?.mode || activeTheme?.mode || 'dark',
      ...(draftTheme?.generator || {}),
    });
  }, [activeTheme?.id, draftTheme?.id]);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    const generated = applyGeneratedTheme(next);
    if (generated.warnings.length) setWarning(generated.warnings.join(' '));
  };

  const surprise = () => update(surpriseGeneratorSettings(settings));
  return (
    <div className="theme-studio-view theme-studio-generator">
      <IndependentThemeForm onBeforeNavigate={onBeforeNavigate} />
      <div className="theme-studio-intro">
        <span>PERCEPTUAL GENERATOR</span>
        <p>Reshape the current theme’s palette around one anchor. Its complete appearance stays editable in Global.</p>
      </div>
      <div className="theme-studio-segmented" role="group" aria-label="Theme mode">
        {['dark', 'light'].map((mode) => <button type="button" key={mode} className={settings.mode === mode ? 'active' : ''} onClick={() => update({ mode })}>{mode}</button>)}
      </div>
      <div className="theme-studio-anchor-grid">
        <label><span>Primary anchor</span><input type="color" value={settings.primaryAnchor} onChange={(event) => update({ primaryAnchor: event.target.value })} /></label>
        <div>
          <label className="theme-studio-secondary-label"><input type="checkbox" checked={Boolean(settings.secondaryAnchor)} onChange={(event) => update({ secondaryAnchor: event.target.checked ? settings.primaryAnchor : '' })} />Secondary</label>
          <input type="color" aria-label="Secondary anchor color" disabled={!settings.secondaryAnchor} value={settings.secondaryAnchor || settings.primaryAnchor} onChange={(event) => update({ secondaryAnchor: event.target.value })} />
        </div>
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
    return <label className="theme-studio-field"><span>{token.label}</span><FontFamilyInput value={value} label={`${token.label} font family`} onValueChange={(next) => updateGlobalToken(token.id, next)} /></label>;
  }
  return <label className="theme-studio-field"><span>{token.label}</span><select value={value || token.options[0].value} onChange={(event) => updateGlobalToken(token.id, event.target.value)}>{token.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function GlobalView({ onBufferChange, discardBufferRef }) {
  const { contrastWarnings } = useTheme();
  return (
    <div className="theme-studio-view">
      {contrastWarnings.length > 0 && <div className="theme-studio-contrast-warning">{contrastWarnings.map((warning) => <span key={warning}>△ {warning}</span>)}</div>}
      <VariableInventory onBufferChange={onBufferChange} discardBufferRef={discardBufferRef} />
      <details className="theme-studio-advanced">
        <summary>Palette & material shortcuts</summary>
        <p className="theme-source-note">Convenient controls for the shared theme variables. The complete variable and rule inventory is above.</p>
        {GLOBAL_TOKEN_GROUPS.map((group) => <section className="theme-studio-token-section" key={group.id}><h3>{group.label}</h3>{group.tokens.map((token) => <GlobalToken key={token.id} token={token} />)}</section>)}
      </details>
    </div>
  );
}

export default function ThemeStudio({ isOpen, width, onWidthChange, onClose }) {
  const theme = useTheme();
  const [view, setView] = useState('global');
  const [unappliedSource, setUnappliedSource] = useState(false);
  const discardBufferRef = useRef(null);
  const resizeRef = useRef(null);
  useEffect(() => { if (theme.selectedTarget) setView('selected'); }, [theme.selectedTarget]);
  useEffect(() => () => resizeRef.current?.(), []);
  const beforeNavigate = () => {
    if (!unappliedSource) return true;
    if (!window.confirm('Discard the stylesheet text that has not been applied? Choose Cancel, then Apply stylesheet in Global to keep it.')) return false;
    discardBufferRef.current?.();
    setUnappliedSource(false);
    return true;
  };
  const close = () => { if (beforeNavigate()) onClose(); };
  if (!isOpen) return null;
  const startResize = (event) => {
    event.preventDefault();
    const originX = event.clientX;
    const originWidth = width;
    const move = (moveEvent) => onWidthChange(clamp(originWidth + originX - moveEvent.clientX, 300, 480));
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); resizeRef.current = null; };
    resizeRef.current?.();
    resizeRef.current = end;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end, { once: true });
  };
  return (
    <aside className="theme-studio" style={{ width }} data-theme-studio="true" aria-label="Theme Studio">
      <datalist id={FONT_DATALIST_ID}>{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</datalist>
      <div
        className="theme-studio-resize"
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          event.stopPropagation();
          if (event.key === 'ArrowLeft') onWidthChange(clamp(width + 10, 300, 480));
          if (event.key === 'ArrowRight') onWidthChange(clamp(width - 10, 300, 480));
        }}
        role="separator"
        tabIndex={0}
        aria-valuemin={300}
        aria-valuemax={480}
        aria-valuenow={width}
        aria-orientation="vertical"
        aria-label="Resize Theme Studio"
      />
      <StudioHeader onClose={close} onBeforeNavigate={beforeNavigate} />
      <nav className="theme-studio-nav" aria-label="Theme Studio views">
        {[['create', 'Create'], ['global', 'Global'], ['selected', 'Selected']].map(([id, label]) => <button type="button" key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}{id === 'selected' && theme.selectedTarget ? <span /> : null}</button>)}
        <button className={theme.pickerActive ? 'picker active' : 'picker'} type="button" onClick={theme.pickerActive ? theme.cancelPicker : theme.startPicker}>{theme.pickerActive ? 'Cancel pick' : 'Pick object'}</button>
      </nav>
      <main className="theme-studio-content">
        <div hidden={view !== 'create'}><GeneratorView onBeforeNavigate={beforeNavigate} /></div>
        <div hidden={view !== 'global'}><GlobalView onBufferChange={setUnappliedSource} discardBufferRef={discardBufferRef} /></div>
        <div hidden={view !== 'selected'}><SelectionEditor /></div>
      </main>
    </aside>
  );
}
