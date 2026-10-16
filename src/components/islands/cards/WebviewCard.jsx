import { useEffect, useRef, useState } from 'react';
import logger from '../../../lib/logger';
import { updateCardData, updateIsland } from '../store';
import { GLYPH } from '../catalog';
import { toFileUrl } from '../util';

// ==== WEBVIEW ====
const CAPTURE_AFTER_LOAD_MS = 700;
const PHASE = { REST: 'rest', OPENING: 'opening', LIVE: 'live', RETRY: 'retry' };

function normalizeUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^[a-z]+:\/\//i.test(text)) return text;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(text)) return `http://${text}`;
  return `https://${text}`;
}

function isLoopback(value) {
  try {
    const host = new URL(normalizeUrl(value)).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

function launchDraft(island) {
  const remembered = island.webLaunch || {};
  return {
    rootPath: island.rootPath || '',
    commandLine: remembered.commandLine || '',
    cwd: remembered.cwd || island.rootPath || '',
    urlTemplate: remembered.urlTemplate || 'http://127.0.0.1:{PORT}/',
  };
}

function shortPath(value) {
  return String(value || '').replace(/^\/Users\/[^/]+/, '~');
}

export default function WebviewCard({ island, card }) {
  const url = card.data.url || '';
  const projectMode = Boolean(island.rootPath)
    && card.data.previewMode !== 'url'
    && (card.data.previewMode === 'project' || !url || isLoopback(url));
  const holderRef = useRef(null);
  const viewRef = useRef(null);
  const phaseRef = useRef(PHASE.REST);
  const wakeTokenRef = useRef(0);
  const projectRequestedRef = useRef(false);
  const captureTimerRef = useRef(null);
  const captureInFlightRef = useRef(null);
  const mountedRef = useRef(true);
  const currentRef = useRef(card.data.url || '');
  const returnToPreviewRef = useRef(null);
  const openedModeRef = useRef(projectMode ? 'project' : 'url');
  const [phase, setPhaseState] = useState(PHASE.REST);
  const [draft, setDraft] = useState(projectMode ? '' : url);
  const [current, setCurrent] = useState(url);
  const [runtimeUrl, setRuntimeUrl] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupIssue, setSetupIssue] = useState('');
  const [recipe, setRecipe] = useState(() => launchDraft(island));
  const canWake = projectMode || Boolean(url);
  const previewSrc = card.data.previewPath ? toFileUrl(card.data.previewPath) : '';

  const setPhase = (next) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhaseState(next);
  };

  const clearCaptureTimer = () => {
    if (!captureTimerRef.current) return;
    clearTimeout(captureTimerRef.current);
    captureTimerRef.current = null;
  };

  const releaseProject = (reason) => {
    if (!projectRequestedRef.current) return Promise.resolve();
    projectRequestedRef.current = false;
    return Promise.resolve(window.api.islandPreviewRelease?.({ cardId: card.id, reason })).catch(() => {});
  };

  const captureFrame = async () => {
    if (captureInFlightRef.current) return captureInFlightRef.current;
    const view = viewRef.current;
    if (!view?.capturePage || !window.api.islandPreviewSaveCapture) return undefined;
    const task = (async () => {
      try {
        const image = await view.capturePage();
        if (!image || image.isEmpty()) return;
        const saved = await window.api.islandPreviewSaveCapture({ cardId: card.id, dataUrl: image.toDataURL() });
        if (saved?.path) {
          updateCardData(island.id, card.id, { previewPath: saved.path, previewCapturedAt: saved.capturedAt });
        }
      } catch (error) {
        logger.warn('island.card', `“${card.title}” could not update its resting image`, {
          url: currentRef.current || runtimeUrl || url,
          problem: error?.message || String(error),
          nextStep: 'The previous useful image was kept. Open the card and return to its preview to try again.',
        });
      }
    })();
    captureInFlightRef.current = task;
    try { await task; } finally {
      if (captureInFlightRef.current === task) captureInFlightRef.current = null;
    }
    return undefined;
  };

  const returnToPreview = async (reason, capture = true) => {
    const wasActive = phaseRef.current === PHASE.LIVE || phaseRef.current === PHASE.OPENING;
    if (!wasActive) return;
    const token = ++wakeTokenRef.current;
    clearCaptureTimer();
    if (capture && phaseRef.current === PHASE.LIVE) await captureFrame();
    if (!mountedRef.current || token !== wakeTokenRef.current) return;
    await releaseProject(reason);
    if (!mountedRef.current || token !== wakeTokenRef.current) return;
    setRuntimeUrl('');
    setPhase(PHASE.REST);
    logger.info('island.card', `Returned “${card.title}” to its resting image`, { reason });
  };
  returnToPreviewRef.current = returnToPreview;

  const wake = async (choice = {}) => {
    const mode = choice.mode || (projectMode ? 'project' : 'url');
    const address = normalizeUrl(choice.url ?? url);
    const rootPath = choice.rootPath ?? island.rootPath;
    const launch = Object.prototype.hasOwnProperty.call(choice, 'launch') ? choice.launch : (island.webLaunch || null);
    if (mode === 'url' && !address) return { ok: false };
    if (mode === 'project' && !rootPath) return { ok: false };
    const token = ++wakeTokenRef.current;
    clearCaptureTimer();
    await releaseProject('the card opened a different page');
    if (!mountedRef.current || token !== wakeTokenRef.current) return;
    setRuntimeUrl('');
    setPhase(PHASE.OPENING);
    try {
      let nextUrl = address;
      if (mode === 'project') {
        if (!window.api.islandPreviewAcquire) throw new Error('The local preview runtime is unavailable.');
        projectRequestedRef.current = true;
        if (card.data.previewMode !== 'project') updateCardData(island.id, card.id, { previewMode: 'project' });
        const result = await window.api.islandPreviewAcquire({ cardId: card.id, rootPath, launch });
        nextUrl = result?.url || '';
        if (!nextUrl) throw new Error('The local preview did not provide a page.');
      }
      if (!mountedRef.current || token !== wakeTokenRef.current) {
        await releaseProject('the card was put away before its page opened');
        return;
      }
      currentRef.current = nextUrl;
      setCurrent(nextUrl);
      setRuntimeUrl(nextUrl);
      openedModeRef.current = mode;
      setPhase(PHASE.LIVE);
      return { ok: true, url: nextUrl };
    } catch (error) {
      if (!mountedRef.current || token !== wakeTokenRef.current) return { ok: false, error };
      await releaseProject('opening failed');
      setRuntimeUrl('');
      setPhase(PHASE.RETRY);
      logger.warn('island.card', `“${card.title}” could not open`, {
        project: mode === 'project' ? rootPath : null,
        url: mode === 'url' ? address : null,
        problem: error?.message || String(error),
        errorCode: error?.code || null,
        nextStep: 'Press Retry, or use “Choose what this opens” on the card to teach the Island another launch.',
      });
      return { ok: false, error };
    }
  };

  const go = (value) => {
    const next = normalizeUrl(value);
    setDraft(next);
    if (!next && island.rootPath) {
      updateCardData(island.id, card.id, { url: '', previewMode: 'project' });
      void wake({ mode: 'project' });
      return;
    }
    updateCardData(island.id, card.id, { url: next, previewMode: 'url' });
    if (next) void wake({ mode: 'url', url: next });
    else void returnToPreview('the address was cleared', false);
  };

  const reload = () => {
    if (phaseRef.current === PHASE.LIVE) viewRef.current?.reload?.();
    else if (phaseRef.current !== PHASE.OPENING) void wake();
  };

  const withSuggestion = async (rootPath, base) => {
    if (!rootPath || !window.api.islandPreviewSuggest) return base;
    try {
      const suggestion = await window.api.islandPreviewSuggest({ rootPath });
      return {
        ...base,
        rootPath,
        commandLine: suggestion?.commandLine || '',
        cwd: suggestion?.cwd || rootPath,
        urlTemplate: suggestion?.urlTemplate || 'http://127.0.0.1:{PORT}/',
      };
    } catch {
      return { ...base, rootPath, cwd: base.cwd || rootPath };
    }
  };

  const openSetup = async () => {
    await returnToPreview('the launch choices were opened');
    if (!mountedRef.current) return;
    let next = launchDraft(island);
    if (!island.webLaunch) next = await withSuggestion(next.rootPath, next);
    if (!mountedRef.current) return;
    setRecipe(next);
    setSetupIssue('');
    setSetupOpen(true);
  };

  const chooseRecipeFolder = async () => {
    const rootPath = await window.api.islandOpenDirectoryDialog?.({
      title: 'Choose what this Island opens',
      buttonLabel: 'Choose project',
    });
    if (!rootPath) return;
    const next = await withSuggestion(rootPath, {
      ...recipe, rootPath, cwd: rootPath, commandLine: '', urlTemplate: 'http://127.0.0.1:{PORT}/',
    });
    if (mountedRef.current) {
      setRecipe(next);
      setSetupIssue('');
    }
  };

  const tryAndRemember = async (event) => {
    event.preventDefault();
    const launch = {
      commandLine: recipe.commandLine.trim(),
      cwd: recipe.cwd.trim(),
      urlTemplate: recipe.urlTemplate.trim(),
    };
    const rootPath = recipe.rootPath.trim();
    if (!rootPath || !launch.commandLine || !launch.cwd || !launch.urlTemplate) {
      setSetupIssue('Choose a project and fill in its command, working folder, and address.');
      return;
    }
    setSetupIssue('');
    setSetupOpen(false);
    const result = await wake({ mode: 'project', rootPath, launch });
    if (!result?.ok) {
      if (mountedRef.current) {
        setSetupIssue('That choice did not open, so it was not remembered.');
        setSetupOpen(true);
      }
      return;
    }
    const remembered = { ...launch, updatedAt: new Date().toISOString() };
    updateIsland(island.id, { rootPath, webLaunch: remembered });
    logger.info('island.card', `Remembered how “${island.name}” opens`, {
      project: rootPath, command: launch.commandLine, cwd: launch.cwd, address: launch.urlTemplate,
    });
  };

  const useAutomatic = async () => {
    const rootPath = recipe.rootPath.trim();
    if (!rootPath) {
      setSetupIssue('Choose a project folder first.');
      return;
    }
    setSetupIssue('');
    setSetupOpen(false);
    const result = await wake({ mode: 'project', rootPath, launch: null });
    if (!result?.ok) {
      if (mountedRef.current) {
        setSetupIssue('Automatic opening did not work. Your remembered choice was kept.');
        setSetupOpen(true);
      }
      return;
    }
    updateIsland(island.id, { rootPath, webLaunch: null });
    logger.info('island.card', `“${island.name}” returned to automatic Webview opening`, { project: rootPath });
  };

  useEffect(() => { setDraft(projectMode ? '' : url); }, [url, projectMode]);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || typeof IntersectionObserver === 'undefined') return undefined;
    const root = holder?.closest('.fo-desk') || null;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) void returnToPreviewRef.current?.('the card left the visible desk');
    }, { root, rootMargin: '0px', threshold: 0.01 });
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== PHASE.LIVE) return undefined;
    const view = viewRef.current;
    if (!view) return undefined;
    const fail = (event) => {
      if (!event.isMainFrame || event.errorCode === -3) return;
      ++wakeTokenRef.current;
      clearCaptureTimer();
      void releaseProject('its page became unreachable');
      setRuntimeUrl('');
      setPhase(PHASE.RETRY);
      logger.warn('island.card', `“${card.title}” could not reach its page`, {
        url: event.validatedURL || runtimeUrl,
        problem: event.errorDescription,
        errorCode: event.errorCode,
        nextStep: 'Press Retry after reviewing Island webviews in Logs.',
      });
    };
    const loaded = () => {
      clearCaptureTimer();
      captureTimerRef.current = setTimeout(() => void captureFrame(), CAPTURE_AFTER_LOAD_MS);
      logger.info('island.card', `Opened “${card.title}” in its Webview card`, {
        mode: openedModeRef.current, url: currentRef.current || runtimeUrl,
      });
    };
    const navigated = (event) => {
      currentRef.current = event.url;
      setCurrent(event.url);
    };
    view.addEventListener('did-fail-load', fail);
    view.addEventListener('did-finish-load', loaded);
    view.addEventListener('did-navigate', navigated);
    view.addEventListener('did-navigate-in-page', navigated);
    return () => {
      view.removeEventListener('did-fail-load', fail);
      view.removeEventListener('did-finish-load', loaded);
      view.removeEventListener('did-navigate', navigated);
      view.removeEventListener('did-navigate-in-page', navigated);
    };
  }, [phase, runtimeUrl, projectMode, card.title]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ++wakeTokenRef.current;
      clearCaptureTimer();
      void releaseProject('the Webview card closed');
    };
  }, [card.id]);

  return (
    <div className="fo-web">
      <form className="fo-web__bar" data-project={projectMode ? 'true' : undefined} onSubmit={(e) => { e.preventDefault(); go(draft); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} placeholder="Address" aria-label="Web address" />
        <button
          type="button"
          className="fo-icon-btn"
          onClick={() => (setupOpen ? setSetupOpen(false) : void openSetup())}
          title="Choose what this opens"
          aria-label="Choose what this opens"
          aria-pressed={setupOpen}
        >
          <span className="fo-glyph">{GLYPH.gear}</span>
        </button>
        <button type="button" className="fo-icon-btn" onClick={reload} title="Reload" aria-label="Reload" disabled={!canWake || phase === PHASE.OPENING}>
          <span className="fo-glyph">{GLYPH.refresh}</span>
        </button>
        <button type="button" className="fo-icon-btn" onClick={() => window.api.islandOpenExternal?.(current || runtimeUrl || url)} title="Open in browser" aria-label="Open in browser" disabled={projectMode ? phase !== PHASE.LIVE : !url}>
          <span className="fo-glyph">{GLYPH.open}</span>
        </button>
        {(phase === PHASE.LIVE || phase === PHASE.OPENING) && (
          <button type="button" className="fo-icon-btn" onClick={() => void returnToPreview('the preview control was pressed')} title="Return to preview" aria-label="Return to preview">
            <span className="fo-glyph">{GLYPH.eyeClosed}</span>
          </button>
        )}
      </form>
      <div ref={holderRef} className="fo-web__view">
        {setupOpen ? (
          <form className="fo-web__setup" aria-labelledby={`web-launch-${card.id}`} onSubmit={tryAndRemember}>
            <div className="fo-web__setup-head">
              <div>
                <h3 id={`web-launch-${card.id}`}>Choose what this opens</h3>
                <p>Remembered by this Island.</p>
              </div>
              <button type="button" className="fo-icon-btn" onClick={() => setSetupOpen(false)} title="Close" aria-label="Close launch choices">
                <span className="fo-glyph">{GLYPH.close}</span>
              </button>
            </div>

            <label className="fo-web__setup-field">
              <span>Project folder</span>
              <button type="button" className="fo-web__folder-choice" onClick={() => void chooseRecipeFolder()}>
                <span title={recipe.rootPath}>{recipe.rootPath ? shortPath(recipe.rootPath) : 'Choose a folder'}</span>
                <span className="fo-glyph" aria-hidden="true">{GLYPH.folder}</span>
              </button>
            </label>

            <label className="fo-web__setup-field">
              <span>Start it with</span>
              <input
                value={recipe.commandLine}
                onChange={(event) => setRecipe((currentRecipe) => ({ ...currentRecipe, commandLine: event.target.value }))}
                placeholder="python3 -m flask --app server.py run --port {PORT}"
                spellCheck={false}
                autoComplete="off"
              />
            </label>

            <label className="fo-web__setup-field">
              <span>Run from</span>
              <input
                value={recipe.cwd}
                onChange={(event) => setRecipe((currentRecipe) => ({ ...currentRecipe, cwd: event.target.value }))}
                placeholder="Project folder"
                spellCheck={false}
                autoComplete="off"
              />
            </label>

            <label className="fo-web__setup-field">
              <span>Open at</span>
              <input
                value={recipe.urlTemplate}
                onChange={(event) => setRecipe((currentRecipe) => ({ ...currentRecipe, urlTemplate: event.target.value }))}
                placeholder="http://127.0.0.1:{PORT}/"
                spellCheck={false}
                autoComplete="off"
              />
            </label>

            {setupIssue && <p className="fo-web__setup-issue" role="alert">{setupIssue}</p>}

            <div className="fo-web__setup-actions">
              <button type="button" className="fo-web__automatic" onClick={() => void useAutomatic()}>Use automatic</button>
              <button type="submit" className="fo-web__remember">Try &amp; remember</button>
            </div>
          </form>
        ) : phase === PHASE.LIVE && runtimeUrl ? (
          <webview ref={viewRef} src={runtimeUrl} partition="persist:island" allowpopups="true" className="fo-web__frame" />
        ) : phase === PHASE.RETRY ? (
          <button type="button" className="fo-web__retry" onClick={() => void wake()}>
            <span className="fo-glyph" aria-hidden="true">{GLYPH.ladybug}</span>
            <span>Retry?</span>
          </button>
        ) : (
          <button
            type="button"
            className="fo-web__poster"
            data-opening={phase === PHASE.OPENING ? 'true' : undefined}
            onClick={() => void wake()}
            disabled={!canWake || phase === PHASE.OPENING}
            aria-label={phase === PHASE.OPENING ? 'Opening Webview' : 'Open Webview'}
            aria-busy={phase === PHASE.OPENING ? 'true' : undefined}
          >
            {previewSrc
              ? <img src={previewSrc} alt="" draggable="false" />
              : <span className="fo-glyph fo-web__empty-mark" aria-hidden="true">{GLYPH.open}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
