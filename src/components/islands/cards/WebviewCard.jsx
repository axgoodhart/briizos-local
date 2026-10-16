import { useEffect, useRef, useState } from 'react';
import logger from '../../../lib/logger';
import { updateCardData } from '../store';
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
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
  } catch {
    return false;
  }
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
  const [phase, setPhaseState] = useState(PHASE.REST);
  const [draft, setDraft] = useState(projectMode ? '' : url);
  const [current, setCurrent] = useState(url);
  const [runtimeUrl, setRuntimeUrl] = useState('');
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
    if (mode === 'url' && !address) return;
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
        const result = await window.api.islandPreviewAcquire({ cardId: card.id, rootPath: island.rootPath });
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
      setPhase(PHASE.LIVE);
    } catch (error) {
      if (!mountedRef.current || token !== wakeTokenRef.current) return;
      await releaseProject('opening failed');
      setRuntimeUrl('');
      setPhase(PHASE.RETRY);
      logger.warn('island.card', `“${card.title}” could not open`, {
        project: mode === 'project' ? island.rootPath : null,
        url: mode === 'url' ? address : null,
        problem: error?.message || String(error),
        errorCode: error?.code || null,
        nextStep: 'Press Retry after reviewing Island webviews in Logs.',
      });
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
        mode: projectMode ? 'project' : 'url', url: currentRef.current || runtimeUrl,
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
        {phase === PHASE.LIVE && runtimeUrl ? (
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
