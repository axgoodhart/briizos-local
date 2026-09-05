import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BUILT_IN_THEMES, BUILT_IN_THEME_IDS, getBuiltInTheme } from './builtInThemes';
import { contrastRatio, generateTheme } from './chromap';
import { GLOBAL_TOKEN_REGISTRY, TARGET_REGISTRY, valuesForGlobalToken } from './themeRegistry';
import {
  createThemeDocument, EMPTY_THEME_LIBRARY, safeThemeLibrary,
  validateThemeCss, validateThemeDocument, validateThemeLibrary, THEME_SCHEMA_VERSION,
} from './themeSchema';
import {
  annotateThemeSurfaces, clearPickerHighlight, createThemeRuntime,
  observeThemeSurfaces, selectorForOverride, setPickerHighlight, styleValueToCss,
} from './themeRuntime';
import {
  getElementTarget, getThemeSourceIndex, inspectThemeElement, materializeThemeCss, navigateThemeElement,
  parseThemeSource, setSelectionHighlight, setSourceRule, updateSourceDeclaration,
} from './themeSource';
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

function sourceContext(cssText, fallback = 'default') {
  const marker = cssText.match(/\/\*\s*briizOS theme-context:\s*([A-Za-z0-9._:-]+)\s*\*\//);
  const selector = cssText.match(/:root\s*\[data-theme\s*=\s*["']?([A-Za-z0-9._:-]+)/);
  return marker?.[1] || selector?.[1] || fallback;
}

function customDocument(theme) {
  return typeof theme?.cssText === 'string';
}

function cssProperty(property) {
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function isActiveRootDefinition(definition) {
  if (!/(^|,)\s*(?::root|html)(?=[\s[,.:#]|$)/.test(definition.selector || '')) return false;
  if (typeof document === 'undefined') return true;
  try {
    for (const condition of definition.conditions || []) {
      if (condition.name === 'media' && !window.matchMedia(condition.params).matches) return false;
      if (condition.name === 'supports' && !CSS.supports(condition.params)) return false;
      if (['container', 'scope', 'starting-style'].includes(condition.name)) return false;
    }
    return document.documentElement.matches(definition.selector);
  }
  catch { return false; }
}

function targetSelector(target, scope) {
  if (!target) return null;
  if (scope === 'unique' || scope === 'instance' && !target.instanceId) return target.selector;
  if (scope === 'class') return target.selectors?.find((selector) => selector.startsWith('.')) || target.selector;
  if (target.role && TARGET_REGISTRY[target.role]) return selectorForOverride(makeOverride(target, scope));
  return target.selector;
}

function editVariable(cssText, name, value, declarationId) {
  if (!/^--[A-Za-z0-9_-]+$/.test(name)) throw new Error('Enter a valid CSS custom property name beginning with --.');
  if (declarationId?.startsWith('structure:')) {
    const definition = getThemeSourceIndex(cssText).variables.find((entry) => entry.name === name)?.definitions.find((entry) => entry.id === declarationId);
    if (!definition) throw new Error('The structural definition moved. Select it again.');
    return setSourceRule(cssText, definition.selector, name, value, { important: definition.important, conditions: definition.conditions });
  }
  if (declarationId) return updateSourceDeclaration(cssText, declarationId, value);
  const variable = parseThemeSource(cssText).variables.find((entry) => entry.name === name);
  const rootDefinitions = variable?.definitions?.filter(isActiveRootDefinition) || [];
  const definition = rootDefinitions.at(-1);
  if (definition) return updateSourceDeclaration(cssText, definition.id, value);
  const structuralDefinition = getThemeSourceIndex(cssText).variables.find((entry) => entry.name === name)?.definitions?.filter((entry) => entry.readOnly && isActiveRootDefinition(entry)).at(-1);
  return setSourceRule(cssText, structuralDefinition?.selector || ':root', name, value, { important: structuralDefinition?.important || false, conditions: structuralDefinition?.conditions || [] });
}

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
  const draftRef = useRef(null);
  const libraryRef = useRef(EMPTY_THEME_LIBRARY);
  const editLogRef = useRef({ timer: null, key: null, count: 0, first: null, last: null });
  const originalLibraryRef = useRef(null);
  const libraryProtectedRef = useRef(true);
  const [requiresLibraryBackup, setRequiresLibraryBackup] = useState(false);
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
  const [selectionDetails, setSelectionDetails] = useState(null);

  draftRef.current = draftTheme;
  libraryRef.current = library;

  if (!runtimeRef.current && typeof document !== 'undefined') runtimeRef.current = createThemeRuntime(document);

  const customThemes = library.themes;
  const activeTheme = useMemo(() => (
    customThemes.find((theme) => theme.id === activeThemeId)
    || getBuiltInTheme(activeThemeId)
    || getBuiltInTheme('default')
  ), [activeThemeId, customThemes]);

  const previewTheme = draftTheme || activeTheme;
  const sourceCss = useMemo(() => materializeThemeCss(previewTheme), [previewTheme]);
  const sourceIndex = useMemo(() => getThemeSourceIndex(sourceCss), [sourceCss]);
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
        if (savedLibrary?.value && (parsed.migrated || parsed.warning)) {
          originalLibraryRef.current = savedLibrary.value;
          libraryProtectedRef.current = false;
          try {
            const priorBackup = await settings.get('ui_theme_library_backup');
            const previous = priorBackup?.value;
            const snapshots = previous?.kind === 'theme-library-recovery' && Array.isArray(previous.snapshots)
              ? previous.snapshots : previous ? [{ capturedAt: null, library: previous }] : [];
            if (!snapshots.some((snapshot) => same(snapshot.library, savedLibrary.value))) {
              await settings.set('ui_theme_library_backup', {
                kind: 'theme-library-recovery',
                snapshots: [...snapshots, { capturedAt: new Date().toISOString(), library: savedLibrary.value }],
              });
            }
            libraryProtectedRef.current = true;
            logger.info('config', 'Original theme library preserved before conversion or recovery', { existingBackups: snapshots.length, result: 'Original CSS and prior backups remain recoverable' });
          } catch (error) {
            setRequiresLibraryBackup(true);
            setWarning(`The original theme library could not be backed up. Export its recovery copy in Theme Studio before saving changes. ${error.message}`);
            logger.error('config', 'Theme library conversion is preview-only until its original is protected', { detail: error.message, nextStep: 'Export the original library from Theme Studio' });
          }
          if (cancelled) return;
        }
        setLibrary(parsed.library);
        logger.info('config', 'Theme library loaded', { themes: parsed.library.themes.length, schemaVersion: parsed.library.schemaVersion });
        if (parsed.warning) {
          setWarning(`Some custom themes could not be loaded: ${parsed.warning}`);
          logger.error('config', 'Some saved themes could not be loaded; the original library was left intact', { detail: parsed.warning });
        }
        if (parsed.migrated && !parsed.warning && libraryProtectedRef.current) {
          try {
            await settings.set('ui_theme_library', parsed.library);
            logger.info('config', 'Saved themes converted to complete independent CSS documents', { themes: parsed.library.themes.length, previousSchema: 1, schemaVersion: THEME_SCHEMA_VERSION, result: 'Original selectors, variables and scoped edits preserved in each theme file' });
          } catch (error) {
            setWarning(`Themes were converted for this session, but the converted library could not be saved: ${error.message}`);
            logger.error('config', 'Theme conversion could not be saved; the original library remains available', { detail: error.message });
          }
          if (cancelled) return;
        }
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
        logger.info('config', 'Saved appearance restored', { themeId: resolved.id, name: resolved.name || resolved.label });
      } catch (error) {
        if (cancelled) return;
        setLibrary(EMPTY_THEME_LIBRARY);
        setActiveThemeId('default');
        setWarning(`Theme settings could not be loaded. Dark Neon was restored. ${error.message || ''}`.trim());
        logger.error('config', 'Theme settings could not be loaded; Dark Neon was restored', { detail: error.message });
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
    if (!selectedTarget?.element) {
      setSelectionDetails(null);
      return;
    }
    const element = selectedTarget.element;
    let timer = null;
    const refresh = () => {
      timer = null;
      if (!element.isConnected) {
        let replacement = null;
        if (!selectedTarget.selector.includes(':nth-of-type(')) {
          try {
            const matches = document.querySelectorAll(selectedTarget.selector);
            if (matches.length === 1) replacement = getElementTarget(matches[0]);
          } catch { /* The source can temporarily remove or rename a selector. */ }
        }
        setSelectedTarget(replacement);
        setSelectionHighlight(replacement?.element || null);
        if (!replacement) logger.info('config', 'The inspected element left the document; pick an object again to continue');
        return;
      }
      setSelectionDetails(inspectThemeElement(element, sourceCss));
    };
    const schedule = () => { if (timer === null) timer = setTimeout(refresh, 80); };
    const observer = new MutationObserver((changes) => {
      const relevant = changes.some((change) => {
        const target = change.target.nodeType === 1 ? change.target : change.target.parentElement;
        if (target?.closest?.('[data-theme-studio]')) return false;
        if (change.type === 'childList') {
          const nodes = [...change.addedNodes, ...change.removedNodes];
          if (nodes.length && nodes.every((node) => node.nodeType === 1 && node.matches?.('[data-theme-studio]'))) return false;
        }
        return !element.isConnected || target?.contains(element) || element.contains(target);
      });
      if (relevant) schedule();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'], characterData: true });
    window.addEventListener('resize', schedule);
    refresh();
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); if (timer !== null) clearTimeout(timer); };
  }, [selectedTarget, sourceCss]);

  const selectElement = useCallback((element) => {
    const target = getElementTarget(element);
    setSelectedTarget(target);
    setSelectionHighlight(target?.element || null);
    if (target) logger.info('config', 'Theme inspection target selected', { target: target.label, selector: target.selector });
    return target;
  }, []);

  const navigateSelection = useCallback((direction) => {
    const element = navigateThemeElement(selectedTarget?.element, direction);
    if (element) selectElement(element);
    return element;
  }, [selectElement, selectedTarget]);

  useEffect(() => {
    if (!selectedTarget) return undefined;
    const handleNavigation = (event) => {
      if (!document.querySelector('aside[data-theme-studio]')) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],[role="separator"]')) return;
      const direction = { ArrowUp: 'parent', ArrowDown: 'child', ArrowLeft: 'previous', ArrowRight: 'next' }[event.key];
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      navigateSelection(direction);
    };
    window.addEventListener('keydown', handleNavigation, true);
    return () => window.removeEventListener('keydown', handleNavigation, true);
  }, [navigateSelection, selectedTarget]);

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
      const target = getElementTarget(event.target);
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
      const target = getElementTarget(event.target);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (!target) return;
      clearPickerHighlight(hoverRef.current);
      hoverRef.current = null;
      setPickerHint(null);
      selectElement(target.element);
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
  }, [pickerActive, selectElement]);

  const persistActiveId = useCallback(async (themeId) => {
    await settingApi().set('ui_theme', themeId);
  }, []);

  const performThemeSelection = useCallback(async (themeId) => {
    const custom = libraryRef.current.themes.find((theme) => theme.id === themeId);
    const builtIn = getBuiltInTheme(themeId);
    const resolved = custom || builtIn;
    if (!resolved) {
      setWarning(`Theme “${themeId}” is unavailable.`);
      return false;
    }
    setActiveThemeId(themeId);
    draftRef.current = null;
    setDraftTheme(null);
    savedDraftRef.current = null;
    draftOriginRef.current = null;
    setHistory({ past: [], future: [] });
    applyPreview(resolved);
    try {
      await persistActiveId(themeId);
      logger.info('config', 'Theme switched and saved', { themeId, name: resolved.name || resolved.label });
    } catch (error) {
      setWarning(`“${resolved.name || resolved.label}” is previewed, but the selection could not be saved: ${error.message}`);
      logger.error('config', 'Theme switch is previewed but could not be saved', { themeId, detail: error.message });
    }
    return true;
  }, [applyPreview, persistActiveId]);

  const selectTheme = useCallback((themeId) => {
    if (themeId === activeThemeId && !draftTheme) return Promise.resolve(true);
    if (isDirty) {
      setPendingChange({ type: 'theme', themeId });
      return Promise.resolve(false);
    }
    return performThemeSelection(themeId);
  }, [activeThemeId, draftTheme, isDirty, performThemeSelection]);

  const documentForEditing = useCallback(() => {
    if (draftRef.current) return clone(draftRef.current);
    if (customDocument(activeTheme)) return clone(activeTheme);
    const name = uniqueName(`${activeTheme.label} Copy`, library.themes);
    return createThemeDocument({ name, baseThemeId: activeTheme.id, mode: activeTheme.mode });
  }, [activeTheme, draftTheme, library.themes]);

  const beginDraft = useCallback(() => {
    if (draftTheme) return draftTheme;
    const next = documentForEditing();
    savedDraftRef.current = customDocument(activeTheme) ? clone(activeTheme) : clone(next);
    draftOriginRef.current = customDocument(activeTheme) ? 'saved' : 'built-in';
    draftRef.current = next;
    setDraftTheme(next);
    return next;
  }, [activeTheme, documentForEditing, draftTheme]);

  const flushEditLog = useCallback(() => {
    const pending = editLogRef.current;
    if (pending.timer) clearTimeout(pending.timer);
    if (pending.count) logger.info('config', 'Theme appearance edited in the live draft', {
      action: pending.key, edits: pending.count, from: pending.first, through: pending.last,
      result: 'Preview updated; save the theme to retain these edits',
    });
    editLogRef.current = { timer: null, key: null, count: 0, first: null, last: null };
  }, []);

  useEffect(() => () => {
    flushEditLog();
    setSelectionHighlight(null);
    runtimeRef.current?.cleanup();
  }, [flushEditLog]);

  const mutateDraft = useCallback((mutation, historyKey = 'change') => {
    try {
      const current = draftRef.current || documentForEditing();
      const next = mutation(clone(current));
      if (same(current, next)) return current;
      validateThemeCss(next.cssText);
      if (!draftRef.current) {
        savedDraftRef.current = customDocument(activeTheme) ? clone(activeTheme) : clone(current);
        draftOriginRef.current = customDocument(activeTheme) ? 'saved' : 'built-in';
      }
      next.updatedAt = Date.now();
      const now = performance.now();
      const coalesced = lastMutationRef.current.key === historyKey && now - lastMutationRef.current.at < 650;
      setHistory((state) => ({ past: coalesced ? state.past : [...state.past.slice(-49), clone(current)], future: [] }));
      lastMutationRef.current = { key: historyKey, at: now };
      draftRef.current = next;
      setDraftTheme(next);
      if (editLogRef.current.key !== historyKey) flushEditLog();
      const pending = editLogRef.current;
      if (pending.timer) clearTimeout(pending.timer);
      pending.key = historyKey;
      pending.count += 1;
      pending.first ||= new Date().toISOString();
      pending.last = new Date().toISOString();
      pending.timer = setTimeout(flushEditLog, 650);
      return next;
    } catch (error) {
      logger.error('config', 'Theme edit was not applied', { action: historyKey, detail: error.message });
      throw error;
    }
  }, [activeTheme, documentForEditing, flushEditLog]);

  const updateDeclaration = useCallback((declarationId, value) => (
    mutateDraft((draft) => ({ ...draft, cssText: updateSourceDeclaration(draft.cssText, declarationId, String(value)) }), `declaration:${declarationId}`)
  ), [mutateDraft]);

  const updateCssRule = useCallback((selector, property, value, options = {}) => (
    mutateDraft((draft) => ({ ...draft, cssText: setSourceRule(draft.cssText, selector, property, String(value), options) }), `rule:${selector}:${property}`)
  ), [mutateDraft]);

  const updateVariable = useCallback((name, value, declarationId) => (
    mutateDraft((draft) => ({ ...draft, cssText: editVariable(draft.cssText, name, String(value), declarationId) }), `variable:${name}:${declarationId || 'root'}`)
  ), [mutateDraft]);

  const replaceSourceCss = useCallback((cssText) => (
    mutateDraft((draft) => ({ ...draft, cssText: validateThemeCss(cssText), baseThemeId: sourceContext(cssText, draft.baseThemeId) }), 'source:replace')
  ), [mutateDraft]);

  const updateGlobalToken = useCallback((tokenId, value) => {
    const entries = valuesForGlobalToken(tokenId, value);
    mutateDraft((draft) => {
      let cssText = draft.cssText;
      Object.entries(entries).forEach(([name, nextValue]) => { cssText = editVariable(cssText, name, nextValue); });
      return { ...draft, cssText };
    }, `global:${tokenId}`);
  }, [mutateDraft]);

  const applyGeneratedTheme = useCallback((settings) => {
    const generated = generateTheme(settings);
    mutateDraft((draft) => {
      let cssText = draft.cssText;
      if (!/\/\*\s*briizOS legacy-custom\s*\*\//.test(cssText)) cssText += '\n/* briizOS legacy-custom */\n';
      GENERATED_GLOBAL_TOKEN_IDS.forEach((tokenId) => {
        const token = GLOBAL_TOKEN_REGISTRY[tokenId];
        if (!token) return;
        const value = generated.globals[tokenId];
        if (value === undefined) return;
        Object.entries(valuesForGlobalToken(tokenId, value)).forEach(([name, nextValue]) => {
          cssText = editVariable(cssText, name, nextValue);
        });
      });
      return { ...draft, mode: generated.settings.mode, generator: clone(generated.settings), cssText };
    }, `generator:${settings.seed}`);
    return generated;
  }, [mutateDraft]);

  const updateTargetStyle = useCallback((property, value, scope = 'role') => {
    const selector = targetSelector(selectedTarget, scope);
    if (!selector) return;
    return updateCssRule(selector, cssProperty(property), styleValueToCss(property, value), { important: true });
  }, [selectedTarget, updateCssRule]);

  const resetProperty = useCallback((property, scope = 'role') => {
    const selector = targetSelector(selectedTarget, scope);
    if (selector) return updateCssRule(selector, cssProperty(property), '');
  }, [selectedTarget, updateCssRule]);

  const resetTarget = useCallback((scope = 'role') => {
    const selector = targetSelector(selectedTarget, scope);
    if (!selector) return;
    mutateDraft((draft) => {
      let cssText = draft.cssText;
      const rules = parseThemeSource(cssText).rules.filter((rule) => rule.selector === selector);
      const properties = new Set(rules.flatMap((rule) => rule.declarations.map((declaration) => declaration.property)));
      properties.forEach((property) => { cssText = setSourceRule(cssText, selector, property, ''); });
      return { ...draft, cssText };
    }, `reset:${selector}`);
  }, [mutateDraft, selectedTarget]);

  const undo = useCallback(() => {
    flushEditLog();
    setHistory((state) => {
      if (!state.past.length || !draftTheme) return state;
      const previous = state.past[state.past.length - 1];
      draftRef.current = clone(previous);
      setDraftTheme(clone(previous));
      return { past: state.past.slice(0, -1), future: [clone(draftTheme), ...state.future].slice(0, 50) };
    });
    lastMutationRef.current = { key: null, at: 0 };
    logger.info('config', 'Theme edit undone', { available: history.past.length > 0 });
  }, [draftTheme, flushEditLog, history.past.length]);

  const redo = useCallback(() => {
    flushEditLog();
    setHistory((state) => {
      if (!state.future.length || !draftTheme) return state;
      const next = state.future[0];
      draftRef.current = clone(next);
      setDraftTheme(clone(next));
      return { past: [...state.past, clone(draftTheme)].slice(-50), future: state.future.slice(1) };
    });
    lastMutationRef.current = { key: null, at: 0 };
    logger.info('config', 'Theme edit redone', { available: history.future.length > 0 });
  }, [draftTheme, flushEditLog, history.future.length]);

  const saveDocument = useCallback(async (documentToSave) => {
    flushEditLog();
    try {
      if (!libraryProtectedRef.current) throw new Error('Export and keep the original library recovery copy before replacing the saved library.');
      const validated = validateThemeDocument({ ...documentToSave, updatedAt: Date.now() });
      const themes = [...libraryRef.current.themes.filter((theme) => theme.id !== validated.id), validated];
      const nextLibrary = validateThemeLibrary({ schemaVersion: THEME_SCHEMA_VERSION, themes });
      await settingApi().set('ui_theme_library', nextLibrary);
      libraryRef.current = nextLibrary;
      setLibrary(nextLibrary);
      try { await persistActiveId(validated.id); }
      catch (error) {
        setWarning(`“${validated.name}” was saved, but the startup theme selection could not be updated: ${error.message}`);
        logger.error('config', 'Theme saved but startup selection could not be saved', { themeId: validated.id, detail: error.message });
      }
      setActiveThemeId(validated.id);
      draftRef.current = clone(validated);
      setDraftTheme(draftRef.current);
      savedDraftRef.current = clone(validated);
      draftOriginRef.current = 'saved';
      setHistory({ past: [], future: [] });
      lastMutationRef.current = { key: null, at: 0 };
      applyPreview(validated);
      logger.info('config', 'Complete independent theme saved', { themeId: validated.id, name: validated.name, cssCharacters: validated.cssText.length });
      return validated;
    } catch (error) {
      logger.error('config', 'Theme could not be saved; the current draft remains available', { detail: error.message });
      throw error;
    }
  }, [applyPreview, flushEditLog, persistActiveId]);

  const save = useCallback(async () => {
    if (!draftRef.current) return activeTheme;
    return saveDocument(draftRef.current);
  }, [activeTheme, draftTheme, saveDocument]);

  const saveAs = useCallback(async (name) => {
    const source = draftRef.current || documentForEditing();
    const finalName = uniqueName(String(name || `${source.name} Copy`).trim().slice(0, 80), library.themes);
    const now = Date.now();
    const idBase = finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'custom-theme';
    const copy = { ...clone(source), id: uniqueId(`${idBase}-${now.toString(36)}`, library.themes), name: finalName, createdAt: now, updatedAt: now };
    return saveDocument(copy);
  }, [documentForEditing, draftTheme, library.themes, saveDocument]);

  const replaceDefault = useCallback(async () => {
    const source = draftRef.current || documentForEditing();
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
    flushEditLog();
    if (!draftTheme) return;
    if (draftOriginRef.current === 'saved' && savedDraftRef.current) {
      draftRef.current = clone(savedDraftRef.current);
      setDraftTheme(clone(savedDraftRef.current));
    } else {
      draftRef.current = null;
      setDraftTheme(null);
      savedDraftRef.current = null;
      draftOriginRef.current = null;
    }
    setHistory({ past: [], future: [] });
    lastMutationRef.current = { key: null, at: 0 };
    logger.info('config', 'Theme draft reverted to its saved appearance');
  }, [draftTheme, flushEditLog]);

  const discardDraft = useCallback(() => {
    flushEditLog();
    draftRef.current = null;
    setDraftTheme(null);
    savedDraftRef.current = null;
    draftOriginRef.current = null;
    setHistory({ past: [], future: [] });
    applyPreview(activeTheme);
    logger.info('config', 'Unsaved theme draft discarded', { themeId: activeTheme.id });
  }, [activeTheme, applyPreview, flushEditLog]);

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
    if (pending.type === 'replace') pending.onContinue?.();
  }, [discardDraft, pendingChange, performThemeSelection, save]);

  const requestClose = useCallback((onContinue) => {
    const finishClose = () => {
      setPickerActive(false);
      selectElement(null);
      onContinue?.();
    };
    if (!isDirty) {
      finishClose();
      return true;
    }
    setPendingChange({ type: 'close', onContinue: finishClose });
    return false;
  }, [isDirty, selectElement]);

  const openIndependentDraft = useCallback((next, message, details = {}) => {
    const apply = () => {
      flushEditLog();
      draftRef.current = next;
      setDraftTheme(next);
      savedDraftRef.current = null;
      draftOriginRef.current = 'unsaved';
      setHistory({ past: [], future: [] });
      lastMutationRef.current = { key: null, at: 0 };
      applyPreview(next);
      logger.info('config', message, { themeId: next.id, name: next.name, cssCharacters: next.cssText.length, ...details });
      return next;
    };
    if (draftRef.current && !same(draftRef.current, savedDraftRef.current)) {
      setPendingChange({ type: 'replace', onContinue: apply });
      return null;
    }
    return apply();
  }, [applyPreview, flushEditLog]);

  const importTheme = useCallback((input, filename = '') => {
    let valid;
    try {
      const cssInput = typeof input === 'string' && (/\.css$/i.test(filename) || !input.trimStart().startsWith('{'));
      const parsed = cssInput
        ? createThemeDocument({ name: filename.replace(/\.css$/i, '').slice(0, 80) || 'Imported Theme', cssText: input, baseThemeId: sourceContext(input), mode: previewTheme.mode || 'dark' })
        : typeof input === 'string' ? JSON.parse(input) : input;
      valid = validateThemeDocument(parsed);
    } catch (error) {
      logger.error('config', 'Theme import was not applied', { filename, detail: error.message });
      throw error;
    }
    const conflicts = [...library.themes, ...BUILT_IN_THEMES];
    const idConflict = conflicts.some((theme) => theme.id === valid.id);
    const nameConflict = conflicts.some((theme) => (theme.name || theme.label || '').toLowerCase() === valid.name.toLowerCase());
    const imported = {
      ...valid,
      id: idConflict ? uniqueId(`${valid.id}-imported`, conflicts) : valid.id,
      name: nameConflict ? uniqueName(`${valid.name} Imported`, conflicts) : valid.name,
      updatedAt: Date.now(),
    };
    return openIndependentDraft(imported, 'Complete theme imported into a new unsaved draft', { filename });
  }, [library.themes, openIndependentDraft, previewTheme.mode]);

  const exportJson = useCallback(() => {
    const source = draftRef.current || (customDocument(activeTheme) ? activeTheme : createThemeDocument({ id: activeTheme.id, name: activeTheme.label, baseThemeId: activeTheme.id, mode: activeTheme.mode }));
    logger.info('config', 'Complete theme JSON prepared for export', { themeId: source.id, cssCharacters: source.cssText.length });
    return JSON.stringify(source, null, 2);
  }, [activeTheme, draftTheme]);

  const exportCss = useCallback(() => {
    const source = draftRef.current || activeTheme;
    const cssText = materializeThemeCss(source);
    const result = /\/\*\s*briizOS theme-context:/.test(cssText)
      ? cssText : `/* briizOS theme-context: ${source.baseThemeId || source.id || 'default'} */\n${cssText}`;
    logger.info('config', 'Complete theme CSS prepared for export', { themeId: source.id, cssCharacters: result.length });
    return result;
  }, [activeTheme, draftTheme]);

  const duplicateTheme = useCallback((themeId = activeThemeId) => {
    const source = library.themes.find((theme) => theme.id === themeId) || getBuiltInTheme(themeId);
    if (!source) return null;
    const document = customDocument(source)
      ? clone(source)
      : createThemeDocument({ name: `${source.label} Copy`, baseThemeId: source.id, mode: source.mode });
    const name = uniqueName(`${source.name || source.label} Copy`, library.themes);
    const next = { ...document, id: uniqueId(`${themeId}-copy`, library.themes), name, createdAt: Date.now(), updatedAt: Date.now() };
    return openIndependentDraft(next, 'Theme duplicated as a complete independent draft', { sourceId: themeId });
  }, [activeThemeId, library.themes, openIndependentDraft]);

  const createIndependentTheme = useCallback((name = 'New Independent Theme', options = {}) => {
    const next = createThemeDocument({
      name: uniqueName(String(name).trim() || 'New Independent Theme', library.themes),
      baseThemeId: 'default', mode: 'dark',
      ...(typeof options.cssText === 'string' ? { cssText: validateThemeCss(options.cssText), baseThemeId: sourceContext(options.cssText) } : {}),
    });
    return openIndependentDraft(next, 'New independent theme draft created');
  }, [library.themes, openIndependentDraft]);

  const renameTheme = useCallback(async (themeId, name) => {
    const target = library.themes.find((theme) => theme.id === themeId);
    if (!target) throw new Error('Built-in themes cannot be renamed.');
    const source = draftRef.current?.id === themeId ? draftRef.current : target;
    const next = { ...source, name: uniqueName(String(name).trim().slice(0, 80), library.themes.filter((theme) => theme.id !== themeId)), updatedAt: Date.now() };
    return saveDocument(next);
  }, [draftTheme, library.themes, saveDocument]);

  const deleteTheme = useCallback(async (themeId) => {
    const target = library.themes.find((theme) => theme.id === themeId);
    if (!target) throw new Error('Built-in themes cannot be deleted.');
    try {
      if (!libraryProtectedRef.current) throw new Error('Export and keep the original library recovery copy before deleting a recovered theme.');
      const nextLibrary = validateThemeLibrary({ schemaVersion: THEME_SCHEMA_VERSION, themes: libraryRef.current.themes.filter((theme) => theme.id !== themeId) });
      await settingApi().set('ui_theme_library', nextLibrary);
      libraryRef.current = nextLibrary;
      setLibrary(nextLibrary);
      if (activeThemeId === themeId) await performThemeSelection(BUILT_IN_THEME_IDS.has(target.baseThemeId) ? target.baseThemeId : 'default');
      logger.info('config', 'Saved custom theme deleted', { themeId, name: target.name });
    } catch (error) {
      logger.error('config', 'Saved theme could not be deleted', { themeId, detail: error.message });
      throw error;
    }
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
    const definitions = sourceIndex.variables.find((entry) => entry.name === variable)?.definitions || [];
    const definition = definitions.filter(isActiveRootDefinition).at(-1);
    if (definition) return definition.value;
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }, [sourceIndex]);

  const getTargetOverride = useCallback((scope = 'role') => {
    const selector = targetSelector(selectedTarget, scope);
    if (!selector) return null;
    const rule = sourceIndex.rules.filter((entry) => entry.selector === selector).at(-1);
    if (!rule) return null;
    const styles = {};
    rule.declarations.forEach(({ property, value }) => {
      const key = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const length = value.match(/^([\d.]+)(px|rem|em)$/);
      if (['color', 'borderColor'].includes(key)) styles[key] = { kind: 'color', value };
      else if (key === 'background' && !/gradient\(/.test(value)) styles[key] = { kind: 'solid', color: value };
      else if (length) styles[key] = { kind: 'length', value: Number(length[1]), unit: length[2] };
      else if (['fontWeight', 'opacity'].includes(key)) styles[key] = { kind: 'number', value: Number(value) };
      else if (key === 'fontFamily') styles[key] = { kind: 'font', value };
      else if (['cornerShape', 'borderStyle'].includes(key)) styles[key] = { kind: 'keyword', value };
    });
    return { ...makeOverride(selectedTarget, scope), styles };
  }, [sourceIndex, selectedTarget]);

  const getTargetMatchCount = useCallback((scope = 'role') => {
    if (!selectedTarget) return 0;
    try { return document.querySelectorAll(targetSelector(selectedTarget, scope)).length; }
    catch { return 0; }
  }, [selectedTarget]);

  const exportOriginalLibrary = useCallback(() => {
    if (!originalLibraryRef.current) throw new Error('There is no pending original library to export.');
    logger.info('config', 'Original theme library prepared for recovery export');
    return JSON.stringify(originalLibraryRef.current, null, 2);
  }, []);

  const confirmOriginalLibraryProtected = useCallback(() => {
    libraryProtectedRef.current = true;
    setRequiresLibraryBackup(false);
    logger.info('config', 'Original theme library backup confirmed by the user; saving recovered themes is enabled');
  }, []);

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
    sourceCss, sourceIndex, selectionDetails, selectElement, navigateSelection,
    requiresLibraryBackup, exportOriginalLibrary, confirmOriginalLibraryProtected,
    updateDeclaration, updateCssRule, updateVariable, replaceSourceCss, createIndependentTheme,
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
    sourceCss, sourceIndex, selectionDetails, selectElement, navigateSelection,
    requiresLibraryBackup, exportOriginalLibrary, confirmOriginalLibraryProtected,
    updateDeclaration, updateCssRule, updateVariable, replaceSourceCss, createIndependentTheme,
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
