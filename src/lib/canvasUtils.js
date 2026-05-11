export const CANVAS_RENDER_ENGINES = Object.freeze({
  IFRAME: 'iframe',
  AUTO: 'auto',
  BROWSER: 'browser',
});

export const BROWSER_LIKE_UA = [
  'Mozilla/5.0',
  '(Macintosh; Intel Mac OS X 10_15_7)',
  'AppleWebKit/537.36',
  '(KHTML, like Gecko)',
  'Chrome/136.0.0.0',
  'Safari/537.36',
].join(' ');

const AUTO_BROWSER_HOST_PATTERNS = [
  /(^|\.)reddit\.com$/i,
];

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildUrlCanvasHtml(url, probeId = '') {
  const safeUrl = String(url || '').replace(/"/g, '&quot;');
  const safeProbeId = String(probeId || '').replace(/"/g, '&quot;');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html,body{margin:0;padding:0;width:100%;height:100%;background:#000}
    iframe{border:0;width:100%;height:100%}
  </style>
</head>
<body>
  <iframe id="canvas-url-frame" src="${safeUrl}" allow="autoplay; encrypted-media; fullscreen" referrerpolicy="no-referrer"></iframe>
  <script>
    (function () {
      const frame = document.getElementById('canvas-url-frame');
      const probeId = ${JSON.stringify(safeProbeId)};
      const postStatus = (status) => {
        try {
          window.parent.postMessage({ __briizCanvasProbe: true, probeId, status }, '*');
        } catch {}
      };

      const inspectFrame = () => {
        if (!frame) {
          postStatus('missing-frame');
          return;
        }
        try {
          const href = frame.contentWindow && frame.contentWindow.location ? frame.contentWindow.location.href : '';
          if (!href || href === 'about:blank') {
            postStatus('blocked');
            return;
          }
          postStatus('same-origin-loaded');
        } catch {
          postStatus('loaded');
        }
      };

      frame.addEventListener('load', () => {
        window.setTimeout(inspectFrame, 120);
      });
      frame.addEventListener('error', () => postStatus('blocked'));
      window.setTimeout(inspectFrame, 3000);
    })();
  <\/script>
</body>
</html>`;
}

export function extractUrlFromCanvasHtml(html = '') {
  const match = String(html).match(/<iframe[^>]+src="([^"]+)"/i);
  return match ? match[1] : '';
}

export function shouldPreferBrowserForUrl(rawUrl = '') {
  try {
    const url = new URL(String(rawUrl));
    return AUTO_BROWSER_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}
