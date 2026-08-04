import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BUILT_IN_THEMES, BUILT_IN_THEME_IDS, getBuiltInTheme } from './builtInThemes';
import { contrastRatio, generateTheme } from './chromap';
import { GLOBAL_TOKEN_REGISTRY, TARGET_REGISTRY, valuesForGlobalToken } from './themeRegistry';
import {
  createThemeDocument, EMPTY_THEME_LIBRARY, safeThemeLibrary,
  validateThemeDocument, validateThemeLibrary,
} from './themeSchema';
import {
  annotateThemeSurfaces, clearPickerHighlight, createThemeRuntime,
  observeThemeSurfaces, registeredTargetFromElement, rulesForOverrides,
  selectorForOverride, setPickerHighlight,
} from './themeRuntime';
import logger from '../lib/logger';

const ThemeContext = createContext(null);

const clone = (value) => structuredClone(value);
const same = (first, second) => JSON.stringify(first) === JSON.stringify(second);
const GENERATED_GLOBAL_TOKEN_IDS = Object.freeze([
  'canvas', 'recessed', 'panel', 'elevated', 'overlay',
  'textStrong', 'textPrimary', 'textSoft', 'textMuted', 'textFaint',
  'primary', 'secondary', 'tertiary', 'accentSoft',
  'success', 'warning', 'danger', 'border', 'borderStrong',
  'glowColor', 'glowStrength', 'panelRadius', 'controlRadius',
]);

function cssColorToHex(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split('').map((character) => character + character).join('')}`;
  }
  const match = trimmed.match(/^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*[,/]\s*([\d.]+))?/i);
  if (!match) return null;
  if (match[4] != null && Number(match[4]) === 0) return null;
  return `#${match.slice(1, 4).map((part) => (
    Math.min(255, Math.max(0, Math.round(Number(part)))).toString(16).padStart(2, '0')
  )).join('')}`;
}

function backgroundColors(structured, fallback) {
  if (structured?.kind === 'solid') return [cssColorToHex(structured.color)].filter(Boolean);
  if (structured?.kind === 'linear-gradient') return structured.stops.map((stop) => cssColorToHex(stop.color)).filter(Boolean);
  return [cssColorToHex(fallback)].filter(Boolean);
}

function uniqueName(base, themes) {
  const names = new Set(themes.map((theme) => (theme.name || theme.label || '').toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  let index = 2;
  while (names.has(`${base} ${index}`.toLowerCase())) index += 1;
  return `${base} ${index}`;
}

function uniqueId(base, themes) {
  const ids = new Set(themes.map((theme) => theme.id));
  let id = base;
  let index = 2;
  while (ids.has(id)) id = `${base}-${index++}`;
  return id;
}

function settingApi() {
  const api = window.api?.localData?.settings;
  if (api) return api;
  return {
    async get(key) {
      const value = window.localStorage?.getItem(`briizos.${key}`);
      return value == null ? null : { key, value: JSON.parse(value) };
    },
    async set(key, value) {
      window.localStorage?.setItem(`briizos.${key}`, JSON.stringify(value));
      return { key, value };
    },
  };
}

function overrideIdentity(target, scope) {
  if (scope === 'instance') return `${target.role}:instance:${target.instanceId}`;
  if (scope === 'component') return `${target.role}:component:${target.componentId}`;
  return `${target.role}:role`;
}

function makeOverride(target, scope) {
  return {
    id: overrideIdentity(target, scope),
    targetId: target.role,
    scope,
    ...(scope === 'component' ? { componentId: target.componentId } : {}),
    ...(scope === 'instance' ? { instanceId: target.instanceId } : {}),
    styles: {},
  };
}

export function ThemeProvider({ children }) {
  const runtimeRef = useRef(null);
  const hoverRef = useRef(null);
  const lastMutationRef = useRef({ key: null, at: 0 });
  const savedDraftRef = useRef(null);
  const draftOriginRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('default');
  const [library, setLibrary] = useState(EMPTY_THEME_LIBRARY);
  const [draftTheme, setDraftTheme] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [pickerActive, setPickerActive] = useState(false);
  const [pickerHint, setPickerHint] = useState(null);
  const [warning, setWarning] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);

  if (!runtimeRef.current && typeof document !== 'undefined') runtimeRef.current = createThemeRuntime(document);

  const customThemes = library.themes;
  const activeTheme = useMemo(() => (
    customThemes.find((theme) => theme.id === activeThemeId)
    || getBuiltInTheme(activeThemeId)
    || getBuiltInTheme('default')
  ), [activeThemeId, customThemes]);

  const previewTheme = draftTheme || activeTheme;
  const isDirty = useMemo(() => {
    if (!draftTheme) return false;
    return !same(draftTheme, savedDraftRef.current);
  }, [draftTheme]);

  const applyPreview = useCallback((theme) => {
    runtimeRef.current?.apply(theme);
    document.documentElement.classList.remove('theme-runtime-booting');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const settings = settingApi();
      try {
        const [savedTheme, savedLibrary] = await Promise.all([
          settings.get('ui_theme'), settings.get('ui_theme_library'),
        ]);
        if (cancelled) return;
        const parsed = safeThemeLibrary(savedLibrary?.value || EMPTY_THEME_LIBRARY);
        setLibrary(parsed.library);
        if (parsed.warning) setWarning(`Custom themes could not be loaded: ${parsed.warning}`);
        const requestedId = savedTheme?.value || 'default';
        const custom = parsed.library.themes.find((theme) => theme.id === requestedId);
        const builtIn = getBuiltInTheme(requestedId);
        const recoveredBase = getBuiltInTheme(parsed.invalidThemeBases?.[requestedId]);
        const resolved = custom || builtIn || recoveredBase || getBuiltInTheme('default');
        if (!custom && !builtIn && requestedId !== 'default') {
          setWarning(recoveredBase
            ? `“${requestedId}” is malformed. Its ${recoveredBase.label} base was restored.`
            : `“${requestedId}” is unavailable. Dark Neon was restored.`);
        }
        setActiveThemeId(resolved.id);
        applyPreview(resolved);
      } catch (error) {
        if (cancelled) return;
        setLibrary(EMPTY_THEME_LIBRARY);
        setActiveThemeId('default');
        setWarning(`Theme settings could not be loaded. Dark Neon was restored. ${error.message || ''}`.trim());
        applyPreview(getBuiltInTheme('default'));
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [applyPreview]);

  useEffect(() => {
    if (!ready) return undefined;
    annotateThemeSurfaces(document);
    return observeThemeSurfaces(document);
  }, [ready]);

  useEffect(() => {
    if (ready && previewTheme) applyPreview(previewTheme);
  }, [applyPreview, previewTheme, ready]);

  useEffect(() => {
    if (!pickerActive) {
      clearPickerHighlight(hoverRef.current);
      hoverRef.current = null;
      setPickerHint(null);
      document.documentElement.classList.remove('theme-picker-active');
      return undefined;
    }
    document.documentElement.classList.add('theme-picker-active');
    const handlePointerMove = (event) => {
      const target = registeredTargetFromElement(event.target);
      if (target?.element === hoverRef.current) return;
      clearPickerHighlight(hoverRef.current);
      hoverRef.current = target?.element || null;
      setPickerHighlight(hoverRef.current);
      setPickerHint(target ? { label: target.label, x: event.clientX, y: event.clientY } : null);
    };
    const interceptPress = (event) => {
      if (event.target?.closest?.('[data-theme-studio]')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };
    const handleClick = (event) => {
      if (event.target?.closest?.('[data-theme-studio]')) return;
      const target = registeredTargetFromElement(event.target);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (!target) return;
      clearPickerHighlight(hoverRef.current);
      hoverRef.current = null;
      setPickerHint(null);
      setSelectedTarget({
        role: target.role,
        componentId: target.componentId,
        instanceId: target.instanceId,
        label: target.label,
      });
      setPickerActive(false);
    };
    const handleKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setPickerActive(false);
    };
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerdown', interceptPress, true);
    window.addEventListener('mousedown', interceptPress, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerdown', interceptPress, true);
      window.removeEventListener('mousedown', interceptPress, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKey, true);
      document.documentElement.classList.remove('theme-picker-active');
      clearPickerHighlight(hoverRef.current);
      hoverRef.current = null;
      setPickerHint(null);
    };
  }, [pickerActive]);

  const persistActiveId = useCallback(async (themeId) => {
    await settingApi().set('ui_theme', themeId);
  }, []);

  const performThemeSelection = useCallback(async (themeId) => {
    const custom = library.themes.find((theme) => theme.id === themeId);
    const builtIn = getBuiltInTheme(themeId);
    const resolved = custom || builtIn;
    if (!resolved) {
      setWarning(`Theme “${themeId}” is unavailable.`);
      return false;
    }
    setActiveThemeId(themeId);
    setDraftTheme(null);
    savedDraftRef.current = null;
    draftOriginRef.current = null;
    setHistory({ past: [], future: [] });
    applyPreview(resolved);
    try {
      await persistActiveId(themeId);
    } catch (error) {
      setWarning(`“${resolved.name || resolved.label}” is previewed, but the selection could not be saved: ${error.message}`);
    }
    return true;
  }, [applyPreview, library.themes, persistActiveId]);

  const selectTheme = useCallback((themeId) => {
    if (themeId === activeThemeId && !draftTheme) return Promise.resolve(true);
    if (isDirty) {
      setPendingChange({ type: 'theme', themeId });
      return Promise.resolve(false);
    }
    return performThemeSelection(themeId);
  }, [activeThemeId, draftTheme, isDirty, performThemeSelection]);

  const documentForEditing = useCallback(() => {
    if (draftTheme) return clone(draftTheme);
    if (activeTheme?.variables) return clone(activeTheme);
    const name = uniqueName(`${activeTheme.label} Copy`, library.themes);
    return createThemeDocument({ name, baseThemeId: activeTheme.id, mode: activeTheme.mode });
  }, [activeTheme, draftTheme, library.themes]);

  const beginDraft = useCallback(() => {
    if (draftTheme) return draftTheme;
    const next = documentForEditing();
    savedDraftRef.current = activeTheme?.variables ? clone(activeTheme) : clone(next);
    draftOriginRef.current = activeTheme?.variables ? 'saved' : 'built-in';
    setDraftTheme(next);
    return next;
  }, [activeTheme, documentForEditing, draftTheme]);

  const mutateDraft = useCallback((mutation, historyKey = 'change') => {
    setDraftTheme((currentDraft) => {
      let current = currentDraft;
      if (!current) {
        current = documentForEditing();
        savedDraftRef.current = activeTheme?.variables ? clone(activeTheme) : clone(current);
        draftOriginRef.current = activeTheme?.variables ? 'saved' : 'built-in';
      }
      const before = clone(current);
      const next = mutation(clone(current));
      next.updatedAt = Date.now();
      const now = performance.now();
      const coalesced = lastMutationRef.current.key === historyKey && now - lastMutationRef.current.at < 650;
      setHistory((state) => ({ past: coalesced ? state.past : [...state.past.slice(-49), before], future: [] }));
      lastMutationRef.current = { key: historyKey, at: now };
      return next;
    });
  }, [activeTheme, documentForEditing]);

  const updateGlobalToken = useCallback((tokenId, value) => {
    const entries = valuesForGlobalToken(tokenId, value);
    mutateDraft((draft) => ({ ...draft, variables: { ...draft.variables, ...entries } }), `global:${tokenId}`);
  }, [mutateDraft]);

  const applyGeneratedTheme = useCallback((settings) => {
    const generated = generateTheme(settings);
    mutateDraft((draft) => {
      const variables = { ...draft.variables };
      GENERATED_GLOBAL_TOKEN_IDS.forEach((tokenId) => {
        const token = GLOBAL_TOKEN_REGISTRY[tokenId];
        if (!token) return;
        const value = generated.globals[tokenId];
        if (value === undefined) {
          token.variables.forEach((variable) => delete variables[variable]);
          return;
        }
        Object.assign(variables, valuesForGlobalToken(tokenId, value));
      });
      return { ...draft, mode: generated.settings.mode, generator: clone(generated.settings), variables };
    }, `generator:${settings.seed}`);
    return generated;
  }, [mutateDraft]);

  const updateTargetStyle = useCallback((property, value, scope = 'role') => {
    if (!selectedTarget) return;
    if (!TARGET_REGISTRY[selectedTarget.role]?.properties.includes(property)) return;
    if (scope === 'component' && !selectedTarget.componentId) return;
    if (scope === 'instance' && !selectedTarget.instanceId) return;
    mutateDraft((draft) => {
      const id = overrideIdentity(selectedTarget, scope);
      const overrides = clone(draft.overrides);
      const index = overrides.findIndex((override) => override.id === id);
      const override = index >= 0 ? overrides[index] : makeOverride(selectedTarget, scope);
      override.styles = { ...override.styles, [property]: clone(value) };
      if (index >= 0) overrides[index] = override;
      else overrides.push(override);
      return { ...draft, overrides };
    }, `target:${overrideIdentity(selectedTarget, scope)}:${property}`);
  }, [mutateDraft, selectedTarget]);

  const resetProperty = useCallback((property, scope = 'role') => {
    if (!selectedTarget) return;
    mutateDraft((draft) => {
      const id = overrideIdentity(selectedTarget, scope);
      const overrides = draft.overrides.map((override) => {
        if (override.id !== id) return override;
        const styles = { ...override.styles };
        delete styles[property];
        return { ...override, styles };
      }).filter((override) => Object.keys(override.styles).length > 0);
      return { ...draft, overrides };
    }, `reset:${overrideIdentity(selectedTarget, scope)}:${property}`);
  }, [mutateDraft, selectedTarget]);

  const resetTarget = useCallback((scope = 'role') => {
    if (!selectedTarget) return;
    mutateDraft((draft) => ({
      ...draft,
      overrides: draft.overrides.filter((override) => override.id !== overrideIdentity(selectedTarget, scope)),
    }), `reset:${overrideIdentity(selectedTarget, scope)}`);
  }, [mutateDraft, selectedTarget]);

  const undo = useCallback(() => {
    setHistory((state) => {
      if (!state.past.length || !draftTheme) return state;
      const previous = state.past[state.past.length - 1];
      setDraftTheme(clone(previous));
      return { past: state.past.slice(0, -1), future: [clone(draftTheme), ...state.future].slice(0, 50) };
    });
    lastMutationRef.current = { key: null, at: 0 };
  }, [draftTheme]);

  const redo = useCallback(() => {
    setHistory((state) => {
      if (!state.future.length || !draftTheme) return state;
      const next = state.future[0];
      setDraftTheme(clone(next));
      return { past: [...state.past, clone(draftTheme)].slice(-50), future: state.future.slice(1) };
    });
    lastMutationRef.current = { key: null, at: 0 };
  }, [draftTheme]);

  const saveDocument = useCallback(async (documentToSave) => {
    const validated = validateThemeDocument({ ...documentToSave, updatedAt: Date.now() });
    const themes = [...library.themes.filter((theme) => theme.id !== validated.id), validated];
    const nextLibrary = validateThemeLibrary({ schemaVersion: 1, themes });
    await settingApi().set('ui_theme_library', nextLibrary);
    await persistActiveId(validated.id);
    setLibrary(nextLibrary);
    setActiveThemeId(validated.id);
    setDraftTheme(clone(validated));
    savedDraftRef.current = clone(validated);
    draftOriginRef.current = 'saved';
    setHistory({ past: [], future: [] });
    applyPreview(validated);
    return validated;
  }, [applyPreview, library.themes, persistActiveId]);

  const save = useCallback(async () => {
    if (!draftTheme) return activeTheme;
    return saveDocument(draftTheme);
  }, [activeTheme, draftTheme, saveDocument]);

  const saveAs = useCallback(async (name) => {
    const source = draftTheme || documentForEditing();
    const finalName = uniqueName(String(name || `${source.name} Copy`).trim().slice(0, 80), library.themes);
    const now = Date.now();
    const idBase = finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'custom-theme';
    const copy = { ...clone(source), id: uniqueId(`${idBase}-${now.toString(36)}`, library.themes), name: finalName, createdAt: now, updatedAt: now };
    return saveDocument(copy);
  }, [documentForEditing, draftTheme, library.themes, saveDocument]);

  const replaceDefault = useCallback(async () => {
    const source = draftTheme || documentForEditing();
    const baseThemeId = source.baseThemeId;
    if (!BUILT_IN_THEME_IDS.has(baseThemeId)) throw new Error('This theme has no built-in default to replace.');
    if (source.id === baseThemeId) return save();
    const builtInLabel = getBuiltInTheme(baseThemeId)?.label || baseThemeId;
    const existing = library.themes.find((theme) => theme.id === baseThemeId);
    const now = Date.now();
    const replacement = {
      ...clone(source), id: baseThemeId, name: builtInLabel,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    logger.info('config', `Replacing default theme "${builtInLabel}" with current edits`, { themeId: baseThemeId, sourceId: source.id });
    try {
      const saved = await saveDocument(replacement);
      logger.info('config', `Default theme "${builtInLabel}" replaced`, { themeId: baseThemeId });
      return saved;
    } catch (error) {
      logger.error('config', `Failed to replace default theme "${builtInLabel}"`, error?.message);
      throw error;
    }
  }, [documentForEditing, draftTheme, library.themes, save, saveDocument]);

  const revert = useCallback(() => {
    if (!draftTheme) return;
    if (draftOriginRef.current === 'saved' && savedDraftRef.current) {
      setDraftTheme(clone(savedDraftRef.current));
    } else {
      setDraftTheme(null);
      savedDraftRef.current = null;
      draftOriginRef.current = null;
    }
    setHistory({ past: [], future: [] });
    lastMutationRef.current = { key: null, at: 0 };
  }, [draftTheme]);

  const discardDraft = useCallback(() => {
    setDraftTheme(null);
    savedDraftRef.current = null;
    draftOriginRef.current = null;
    setHistory({ past: [], future: [] });
    applyPreview(activeTheme);
  }, [activeTheme, applyPreview]);

  const resolvePendingChange = useCallback(async (choice) => {
    const pending = pendingChange;
    if (!pending) return;
    if (choice === 'keep') {
      setPendingChange(null);
      return;
    }
    if (choice === 'save') {
      try { await save(); }
      catch (error) {
        setWarning(`Theme changes could not be saved: ${error.message}`);
        return;
      }
    }
    if (choice === 'discard') discardDraft();
    setPendingChange(null);
    if (pending.type === 'theme') await performThemeSelection(pending.themeId);
    if (pending.type === 'close') pending.onContinue?.();
  }, [discardDraft, pendingChange, performThemeSelection, save]);

  const requestClose = useCallback((onContinue) => {
    if (!isDirty) {
      onContinue?.();
      return true;
    }
    setPendingChange({ type: 'close', onContinue });
    return false;
  }, [isDirty]);

  const importTheme = useCallback((input) => {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    const valid = validateThemeDocument(parsed);
    const conflicts = [...library.themes, ...BUILT_IN_THEMES];
    const idConflict = conflicts.some((theme) => theme.id === valid.id);
    const nameConflict = conflicts.some((theme) => (theme.name || theme.label || '').toLowerCase() === valid.name.toLowerCase());
    const imported = {
      ...valid,
      id: idConflict ? uniqueId(`${valid.id}-imported`, conflicts) : valid.id,
      name: nameConflict ? uniqueName(`${valid.name} Imported`, conflicts) : valid.name,
      updatedAt: Date.now(),
    };
    setDraftTheme(imported);
    savedDraftRef.current = null;
    draftOriginRef.current = 'unsaved';
    setHistory({ past: [], future: [] });
    applyPreview(imported);
    return imported;
  }, [applyPreview, library.themes]);

  const exportJson = useCallback(() => {
    const source = draftTheme || (activeTheme?.variables ? activeTheme : null);
    if (!source) throw new Error('Duplicate a built-in theme before exporting it.');
    return JSON.stringify(source, null, 2);
  }, [activeTheme, draftTheme]);

  const exportCss = useCallback(() => {
    const source = draftTheme || (activeTheme?.variables ? activeTheme : null);
    if (!source) throw new Error('Duplicate a built-in theme before exporting it.');
    const variables = Object.entries(source.variables).map(([name, value]) => `  ${name}: ${value};`).join('\n');
    return `/* briizOS Theme Studio · schema 1 · base ${source.baseThemeId} */\n:root[data-custom-theme="${source.id}"] {\n${variables}\n}\n\n${rulesForOverrides(source.overrides)}\n`;
  }, [activeTheme, draftTheme]);

  const duplicateTheme = useCallback((themeId = activeThemeId) => {
    const source = library.themes.find((theme) => theme.id === themeId) || getBuiltInTheme(themeId);
    if (!source) return null;
    const document = source.variables
      ? clone(source)
      : createThemeDocument({ name: `${source.label} Copy`, baseThemeId: source.id, mode: source.mode });
    const name = uniqueName(`${source.name || source.label} Copy`, library.themes);
    const next = { ...document, id: uniqueId(`${themeId}-copy`, library.themes), name, createdAt: Date.now(), updatedAt: Date.now() };
    setDraftTheme(next);
    savedDraftRef.current = null;
    draftOriginRef.current = 'unsaved';
    setHistory({ past: [], future: [] });
    applyPreview(next);
    return next;
  }, [activeThemeId, applyPreview, library.themes]);

  const renameTheme = useCallback(async (themeId, name) => {
    const target = library.themes.find((theme) => theme.id === themeId);
    if (!target) throw new Error('Built-in themes cannot be renamed.');
    const source = draftTheme?.id === themeId ? draftTheme : target;
    const next = { ...source, name: uniqueName(String(name).trim().slice(0, 80), library.themes.filter((theme) => theme.id !== themeId)), updatedAt: Date.now() };
    return saveDocument(next);
  }, [draftTheme, library.themes, saveDocument]);

  const deleteTheme = useCallback(async (themeId) => {
    const target = library.themes.find((theme) => theme.id === themeId);
    if (!target) throw new Error('Built-in themes cannot be deleted.');
    const nextLibrary = validateThemeLibrary({ schemaVersion: 1, themes: library.themes.filter((theme) => theme.id !== themeId) });
    await settingApi().set('ui_theme_library', nextLibrary);
    setLibrary(nextLibrary);
    if (activeThemeId === themeId) await performThemeSelection(target.baseThemeId);
  }, [activeThemeId, library.themes, performThemeSelection]);

  const restoreDefault = useCallback(async (themeId = activeThemeId) => {
    if (!BUILT_IN_THEME_IDS.has(themeId)) throw new Error('This theme has no built-in default to restore.');
    const builtInLabel = getBuiltInTheme(themeId)?.label || themeId;
    logger.info('config', `Restoring factory default for "${builtInLabel}"`, { themeId });
    try {
      await deleteTheme(themeId);
      logger.info('config', `Factory default restored for "${builtInLabel}"`, { themeId });
    } catch (error) {
      logger.error('config', `Failed to restore factory default for "${builtInLabel}"`, error?.message);
      throw error;
    }
  }, [activeThemeId, deleteTheme]);

  const getGlobalTokenValue = useCallback((tokenId) => {
    const token = GLOBAL_TOKEN_REGISTRY[tokenId];
    if (!token) return '';
    const variable = token.variables[0];
    if (draftTheme?.variables[variable] != null) return draftTheme.variables[variable];
    if (activeTheme?.variables?.[variable] != null) return activeTheme.variables[variable];
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }, [activeTheme, draftTheme]);

  const getTargetOverride = useCallback((scope = 'role') => {
    if (!selectedTarget || !draftTheme) return null;
    const id = overrideIdentity(selectedTarget, scope);
    return draftTheme.overrides.find((override) => override.id === id) || null;
  }, [draftTheme, selectedTarget]);

  const getTargetMatchCount = useCallback((scope = 'role') => {
    if (!selectedTarget) return 0;
    try { return document.querySelectorAll(selectorForOverride(makeOverride(selectedTarget, scope))).length; }
    catch { return 0; }
  }, [selectedTarget]);

  const contrastWarnings = useMemo(() => {
    if (!ready) return [];
    const canvas = cssColorToHex(getGlobalTokenValue('canvas'));
    const text = cssColorToHex(getGlobalTokenValue('textPrimary'));
    const border = cssColorToHex(getGlobalTokenValue('borderStrong'));
    const warnings = [];
    if (canvas && text && contrastRatio(text, canvas) < 4.5) warnings.push('Primary text is below 4.5:1 against the canvas.');
    if (canvas && border && contrastRatio(border, canvas) < 3) warnings.push('Strong borders are below 3:1 against the canvas.');

    (previewTheme?.overrides || []).forEach((override) => {
      let computed = null;
      try {
        const element = document.querySelector(selectorForOverride(override));
        if (element) computed = getComputedStyle(element);
      } catch { /* The schema already rejects invalid target identifiers. */ }
      const foreground = cssColorToHex(override.styles.color?.value) || cssColorToHex(computed?.color);
      const backgrounds = backgroundColors(override.styles.background, computed?.backgroundColor);
      const targetLabel = TARGET_REGISTRY[override.targetId]?.label || override.targetId;
      if (foreground && backgrounds.some((background) => contrastRatio(foreground, background) < 4.5)) {
        warnings.push(`${targetLabel} text is below 4.5:1 against its edited background.`);
      }
      const editedBorder = cssColorToHex(override.styles.borderColor?.value);
      if (editedBorder && backgrounds.some((background) => contrastRatio(editedBorder, background) < 3)) {
        warnings.push(`${targetLabel} border is below 3:1 against its edited background.`);
      }
    });
    return warnings;
  }, [getGlobalTokenValue, previewTheme, ready]);

  const value = useMemo(() => ({
    ready, activeTheme, activeThemeId, draftTheme, builtInThemes: BUILT_IN_THEMES, customThemes,
    isDirty, canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    selectedTarget, pickerActive, warning, pendingChange, contrastWarnings,
    selectTheme, beginDraft, updateGlobalToken, updateTargetStyle, applyGeneratedTheme,
    resetProperty, resetTarget, undo, redo, save, saveAs, revert,
    importTheme, exportJson, exportCss, duplicateTheme, renameTheme, deleteTheme,
    replaceDefault, restoreDefault,
    startPicker: () => setPickerActive(true), cancelPicker: () => setPickerActive(false),
    requestClose, resolvePendingChange, discardDraft, setWarning,
    getGlobalTokenValue, getTargetOverride, getTargetMatchCount,
  }), [
    activeTheme, activeThemeId, applyGeneratedTheme, beginDraft, contrastWarnings, customThemes,
    deleteTheme, discardDraft, draftTheme, exportCss, exportJson, getGlobalTokenValue,
    getTargetMatchCount, getTargetOverride, history.future.length, history.past.length,
    importTheme, isDirty, pendingChange, pickerActive, ready, renameTheme, requestClose,
    resetProperty, resetTarget, resolvePendingChange, revert, save, saveAs, selectTheme,
    selectedTarget, undo, updateGlobalToken, updateTargetStyle, warning, redo, duplicateTheme,
    replaceDefault, restoreDefault,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {ready ? children : null}
      {warning && (
        <div className="theme-runtime-warning" role="status">
          <span>{warning}</span>
          <button type="button" onClick={() => setWarning(null)} aria-label="Dismiss theme warning">×</button>
        </div>
      )}
      {pickerActive && pickerHint && (
        <div className="theme-picker-label" style={{ left: pickerHint.x + 14, top: pickerHint.y + 16 }}>
          {pickerHint.label}
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.');
  return context;
}
