import { useEffect, useRef, useState } from 'react';
import logger from '../../../lib/logger';
import { restartTerminal, updateCardData } from '../store';
import { GLYPH } from '../catalog';

// ==== WEBVIEW ====
const RETRY_EVERY_MS = 1500;
const RETRY_FOR_MS = 30000;

function normalizeUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^[a-z]+:\/\//i.test(text)) return text;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(text)) return `http://${text}`;
  return `https://${text}`;
}

export default function WebviewCard({ island, card }) {
  const holderRef = useRef(null);
  const viewRef = useRef(null);
  const retryRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(card.data.url || '');
  const [current, setCurrent] = useState(card.data.url || '');
  const [failed, setFailed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const url = card.data.url || '';
  const server = island.cards.find((c) => c.id === card.data.serverCardId)
    || island.cards.find((c) => c.kind === 'terminal' && c.data.command);

  // Only keep the page alive while the card is on screen.
  useEffect(() => {
    const holder = holderRef.current;
    const root = holder?.closest('.fo-desk') || null;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { root, rootMargin: '200px' });
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    const fail = (event) => {
      if (!event.isMainFrame || event.errorCode === -3) return;
      setFailed(true);
      logger.debug('island.card', `Webview card “${card.title}” could not reach its page`, { url: event.validatedURL, error: event.errorDescription });
    };
    const loaded = () => {
      setFailed(false);
      if (retryRef.current) {
        clearInterval(retryRef.current.timer);
        retryRef.current = null;
        setRestarting(false);
        logger.info('island.card', `“${card.title}” is reachable again after restarting its server`, { url });
      }
    };
    const navigated = (event) => setCurrent(event.url);
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
  }, [visible, url, card.title]);

  useEffect(() => () => { if (retryRef.current) clearInterval(retryRef.current.timer); }, []);

  const go = (value) => {
    const next = normalizeUrl(value);
    setDraft(next);
    setFailed(false);
    if (next === url) viewRef.current?.reload?.();
    else updateCardData(island.id, card.id, { url: next });
  };

  const restart = async () => {
    if (!server || restarting) return;
    setRestarting(true);
    const ok = await restartTerminal(island.id, server.id);
    if (!ok) { setRestarting(false); return; }
    const started = Date.now();
    retryRef.current = {
      timer: setInterval(() => {
        if (Date.now() - started > RETRY_FOR_MS) {
          clearInterval(retryRef.current.timer);
          retryRef.current = null;
          setRestarting(false);
          logger.warn('island.card', `“${card.title}” still cannot reach its page 30 seconds after restarting “${server.title}”`, { url, nextStep: `Check the output in the “${server.title}” terminal card.` });
          return;
        }
        viewRef.current?.reload?.();
      }, RETRY_EVERY_MS),
    };
  };

  return (
    <div className="fo-web">
      <form className="fo-web__bar" onSubmit={(e) => { e.preventDefault(); go(draft); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} placeholder="Address" />
        <button type="button" className="fo-icon-btn" onClick={() => go(draft || url)} title="Reload">
          <span className="fo-glyph">{GLYPH.refresh}</span>
        </button>
        <button type="button" className="fo-icon-btn" onClick={() => window.api.islandOpenExternal?.(current || url)} title="Open in browser" disabled={!url}>
          <span className="fo-glyph">{GLYPH.open}</span>
        </button>
      </form>
      <div ref={holderRef} className="fo-web__view">
        {visible && url ? (
          <webview ref={viewRef} src={url} partition="persist:island" allowpopups="true" className="fo-web__frame" />
        ) : (
          <div className="fo-web__idle">{url ? '' : <span className="fo-glyph">{GLYPH.open}</span>}</div>
        )}
        {failed && (
          <div className="fo-web__down" onDoubleClick={restart}>
            <strong>{server ? <>Double click<br />to restart server.</> : 'This page is not reachable.'}</strong>
            {server && <span className="fo-web__progress" data-busy={restarting ? 'true' : undefined} />}
          </div>
        )}
      </div>
    </div>
  );
}
