import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BROWSER_LIKE_UA,
  buildUrlCanvasHtml,
  CANVAS_RENDER_ENGINES,
  extractUrlFromCanvasHtml,
  shouldPreferBrowserForUrl,
} from '../../lib/canvasUtils';

function CanvasSurface({
  title,
  html = '',
  meta = {},
  canvasKey = '',
  className = '',
  onPromoteBrowser,
}) {
  const webviewRef = useRef(null);
  const [effectiveEngine, setEffectiveEngine] = useState(meta.renderEngine || CANVAS_RENDER_ENGINES.IFRAME);
  const isUrlCanvas = meta.source === 'url' || !!meta.url;
  const url = meta.url || extractUrlFromCanvasHtml(html);
  const probeId = `${canvasKey || title || 'canvas'}::${url}`;
  const shouldBypassIframe = isUrlCanvas
    && effectiveEngine === CANVAS_RENDER_ENGINES.AUTO
    && shouldPreferBrowserForUrl(url);

  useEffect(() => {
    setEffectiveEngine(meta.renderEngine || CANVAS_RENDER_ENGINES.IFRAME);
  }, [meta.renderEngine, canvasKey]);

  useEffect(() => {
    if (!isUrlCanvas || effectiveEngine !== CANVAS_RENDER_ENGINES.AUTO) return undefined;

    const handleMessage = (event) => {
      const data = event?.data;
      if (!data?.__briizCanvasProbe || data.probeId !== probeId) return;
      if (data.status === 'blocked' || data.status === 'missing-frame') {
        setEffectiveEngine(CANVAS_RENDER_ENGINES.BROWSER);
        onPromoteBrowser?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [effectiveEngine, isUrlCanvas, onPromoteBrowser, probeId]);

  const iframeDoc = useMemo(() => {
    if (isUrlCanvas && url) {
      return buildUrlCanvasHtml(url, probeId);
    }
    return html || '';
  }, [html, isUrlCanvas, probeId, url]);

  const showBrowserSurface = isUrlCanvas
    && !!url
    && (effectiveEngine === CANVAS_RENDER_ENGINES.BROWSER || shouldBypassIframe);

  if (showBrowserSurface) {
    return (
      <webview
        ref={webviewRef}
        className={className}
        src={url}
        useragent={BROWSER_LIKE_UA}
        allowpopups="true"
        style={{ width: '100%', height: '100%', display: 'inline-flex', background: '#000' }}
      />
    );
  }

  return (
    <iframe
      srcDoc={iframeDoc}
      sandbox="allow-scripts allow-same-origin allow-forms"
      className={className}
      title={title}
      style={{ width: '100%', height: '100%', border: 0, background: '#000' }}
    />
  );
}

export default CanvasSurface;
