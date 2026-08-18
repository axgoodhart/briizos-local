import { useEffect, useState } from 'react';
import './NewCanvasFlow.css';
import { buildUrlCanvasHtml, escapeHtml, CANVAS_RENDER_ENGINES } from '../../lib/canvasUtils';

const STEP = {
  PICK_SOURCE: 'pick-source',
  AI_NAME: 'ai-name',
  CODE_DETAILS: 'code-details',
  URL_DETAILS: 'url-details',
  FILE_PICKER: 'file-picker',
};

const CANVAS_FILE_MAX_SIZE = 2 * 1024 * 1024;

function buildCodeHtml({ html = '', css = '', js = '' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>html,body{margin:0;padding:0;width:100%;height:100%}${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;
}

function buildUrlHtml(url) {
  return buildUrlCanvasHtml(url);
}

function basename(filePath = '') {
  return String(filePath).split('/').filter(Boolean).pop() || '';
}

function titleFromFileName(fileName = '') {
  const name = basename(fileName);
  return name.replace(/\.[^.]+$/, '') || 'Untitled Canvas';
}

function extensionFor(fileName = '') {
  const parts = basename(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function normalizeFileItem(item, fallback = {}) {
  return {
    ...item,
    ...fallback,
    isDirectory: item?.isDirectory ?? fallback.isDirectory ?? false,
    isFile: item?.isFile ?? fallback.isFile ?? false,
  };
}

function buildHtmlFromFile({ fileName, content }) {
  const ext = extensionFor(fileName);
  if (['html', 'htm'].includes(ext)) return content;
  if (ext === 'svg') {
    return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:#05080a;display:grid;place-items:center}svg{max-width:100%;max-height:100%}</style></head>
<body>${content}</body>
</html>`;
  }
  if (ext === 'css') {
    return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%}${content}</style></head>
<body></body>
</html>`;
  }
  if (ext === 'js') {
    return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:#05080a;color:#dff;font-family:system-ui,sans-serif}</style></head>
<body><script>${content}<\/script></body>
</html>`;
  }
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;min-height:100%;background:#05080a;color:#dff;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}pre{margin:0;padding:24px;white-space:pre-wrap;word-break:break-word}</style></head>
<body><pre>${escapeHtml(content)}</pre></body>
</html>`;
}

function NewCanvasFlow({ onConfirm, onCancel }) {
  const [step, setStep] = useState(STEP.PICK_SOURCE);
  const [name, setName] = useState('');
  const [htmlText, setHtmlText] = useState('');
  const [cssText, setCssText] = useState('');
  const [jsText, setJsText] = useState('');
  const [url, setUrl] = useState('');
  const [fileItems, setFileItems] = useState([]);
  const [fileStack, setFileStack] = useState([]);
  const [currentDir, setCurrentDir] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileStatus, setFileStatus] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);

  useEffect(() => {
    if (step !== STEP.FILE_PICKER || fileItems.length > 0 || isFileLoading) return;
    loadFileRoots();
  }, [step, fileItems.length, isFileLoading]);

  const submit = (payload) => {
    onConfirm?.(payload);
  };

  const handleAiConfirm = () => {
    const finalName = name.trim() || 'Untitled Canvas';
    submit({
      source: 'ai',
      name: finalName,
      html: `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;padding:0;color:#8ff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100%;background:#001014}</style></head>
<body><div style="text-align:center;opacity:.7">Empty canvas — ask the onboard AI to fill it in.</div></body>
</html>`,
    });
  };

  const handleCodeConfirm = () => {
    const finalName = name.trim() || 'Untitled Canvas';
    submit({
      source: 'code',
      name: finalName,
      html: buildCodeHtml({ html: htmlText, css: cssText, js: jsText }),
    });
  };

  const handleUrlConfirm = () => {
    const finalName = name.trim() || url.trim() || 'Untitled Canvas';
    const finalUrl = url.trim();
    if (!finalUrl) return;
    submit({
      source: 'url',
      name: finalName,
      html: buildUrlHtml(finalUrl),
      meta: {
        url: finalUrl,
        renderEngine: CANVAS_RENDER_ENGINES.BROWSER,
      },
    });
  };

  const loadFileRoots = async () => {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.getHomeDirs) {
      setFileStatus('Filesystem access is not available.');
      return;
    }

    setIsFileLoading(true);
    setFileStatus('');
    try {
      const homeDirs = await api.getHomeDirs();
      const iCloud = api.getICloudDirs ? await api.getICloudDirs() : null;
      const usb = api.getUSBDrives ? await api.getUSBDrives() : null;
      const roots = [
        ...(Array.isArray(homeDirs) ? homeDirs.map(item => normalizeFileItem(item, { isDirectory: true })) : []),
        ...(iCloud?.available && Array.isArray(iCloud.dirs) ? iCloud.dirs.map(item => normalizeFileItem(item)) : []),
        ...(usb?.available && Array.isArray(usb.drives) ? usb.drives.map(item => normalizeFileItem(item, { isDirectory: true })) : []),
      ];
      setFileItems(roots);
      setCurrentDir(null);
      setFileStack([]);
      if (roots.length === 0) setFileStatus('No folders available.');
    } catch (err) {
      setFileStatus(err?.message || 'Could not load folders.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const openDirectory = async (item) => {
    if (!item?.isDirectory) return;
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.listDirectory) return;

    setIsFileLoading(true);
    setFileStatus('');
    setSelectedFile(null);
    try {
      const result = await api.listDirectory(item.path);
      if (result?.error) {
        setFileStatus(result.error);
        return;
      }
      setFileStack((prev) => [...prev, { dir: currentDir, items: fileItems }]);
      setCurrentDir(item);
      setFileItems(Array.isArray(result) ? result.map(item => normalizeFileItem(item)) : []);
    } catch (err) {
      setFileStatus(err?.message || 'Could not open folder.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const goBackInFiles = () => {
    setSelectedFile(null);
    setFileStatus('');
    setFileStack((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) {
        setCurrentDir(last.dir);
        setFileItems(last.items);
      }
      return next;
    });
  };

  const chooseFile = (item) => {
    if (!item?.isFile) return;
    setSelectedFile(item);
    if (!name.trim()) setName(titleFromFileName(item.name));
    setFileStatus('');
  };

  const handleFileConfirm = async () => {
    if (!selectedFile?.path) return;
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.readFile) {
      setFileStatus('Filesystem access is not available.');
      return;
    }

    setIsFileLoading(true);
    setFileStatus('');
    try {
      const result = await api.readFile(selectedFile.path, CANVAS_FILE_MAX_SIZE);
      if (result?.error) {
        setFileStatus(result.error);
        return;
      }
      const finalName = name.trim() || titleFromFileName(selectedFile.name);
      submit({
        source: 'file',
        name: finalName,
        html: buildHtmlFromFile({
          fileName: selectedFile.name,
          content: result?.content || '',
        }),
        meta: {
          renderEngine: CANVAS_RENDER_ENGINES.IFRAME,
        },
      });
    } catch (err) {
      setFileStatus(err?.message || 'Could not read file.');
    } finally {
      setIsFileLoading(false);
    }
  };

  return (
    <div className={`new-canvas-flow step-${step}`} onClick={(e) => e.stopPropagation()}>
      <div className="new-canvas-header">
        <span>New Canvas</span>
        <button type="button" className="new-canvas-close" onClick={onCancel}>x</button>
      </div>

      {step === STEP.PICK_SOURCE && (
        <div className="new-canvas-picker">
          <button
            type="button"
            className="new-canvas-option"
            onClick={() => setStep(STEP.AI_NAME)}
          >
            <span className="new-canvas-option-icon">􀪬</span>
            <span className="new-canvas-option-label">Start with AI</span>
            <span className="new-canvas-option-desc">Let the onboard AI scaffold it.</span>
          </button>
          <button
            type="button"
            className="new-canvas-option"
            onClick={() => setStep(STEP.CODE_DETAILS)}
          >
            <span className="new-canvas-option-icon">􀙤</span>
            <span className="new-canvas-option-label">Write your own code</span>
            <span className="new-canvas-option-desc">Paste HTML / CSS / JS.</span>
          </button>
          <button
            type="button"
            className="new-canvas-option"
            onClick={() => setStep(STEP.URL_DETAILS)}
          >
            <span className="new-canvas-option-icon">􀆪</span>
            <span className="new-canvas-option-label">Load a website</span>
            <span className="new-canvas-option-desc">Wrap a URL in an iframe.</span>
          </button>
          <button
            type="button"
            className="new-canvas-option"
            onClick={() => setStep(STEP.FILE_PICKER)}
          >
            <span className="new-canvas-option-icon">􀈕</span>
            <span className="new-canvas-option-label">Choose from files</span>
            <span className="new-canvas-option-desc">Import HTML, SVG, CSS, JS, or text.</span>
          </button>
        </div>
      )}

      {step === STEP.AI_NAME && (
        <div className="new-canvas-form">
          <label htmlFor="ncf-ai-name">Name</label>
          <input
            id="ncf-ai-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pomodoro Timer"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAiConfirm(); }}
          />
          <div className="new-canvas-actions">
            <button type="button" className="ncf-btn" onClick={() => setStep(STEP.PICK_SOURCE)}>Back</button>
            <button type="button" className="ncf-btn ncf-btn-primary" onClick={handleAiConfirm}>Create</button>
          </div>
        </div>
      )}

      {step === STEP.CODE_DETAILS && (
        <div className="new-canvas-form">
          <label htmlFor="ncf-code-name">Name</label>
          <input
            id="ncf-code-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Starfield Background"
          />
          <label htmlFor="ncf-code-html">HTML</label>
          <textarea
            id="ncf-code-html"
            value={htmlText}
            onChange={(e) => setHtmlText(e.target.value)}
            placeholder="<div>Hello world</div>"
            rows={4}
          />
          <label htmlFor="ncf-code-css">CSS</label>
          <textarea
            id="ncf-code-css"
            value={cssText}
            onChange={(e) => setCssText(e.target.value)}
            placeholder="body { background: #001; color: cyan; }"
            rows={3}
          />
          <label htmlFor="ncf-code-js">JS</label>
          <textarea
            id="ncf-code-js"
            value={jsText}
            onChange={(e) => setJsText(e.target.value)}
            placeholder="console.log('hello')"
            rows={3}
          />
          <div className="new-canvas-actions">
            <button type="button" className="ncf-btn" onClick={() => setStep(STEP.PICK_SOURCE)}>Back</button>
            <button type="button" className="ncf-btn ncf-btn-primary" onClick={handleCodeConfirm}>Create</button>
          </div>
        </div>
      )}

      {step === STEP.URL_DETAILS && (
        <div className="new-canvas-form">
          <label htmlFor="ncf-url">URL</label>
          <input
            id="ncf-url"
            type="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <label htmlFor="ncf-url-name">Name</label>
          <input
            id="ncf-url-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label for this site"
            onKeyDown={(e) => { if (e.key === 'Enter') handleUrlConfirm(); }}
          />
          <div className="new-canvas-actions">
            <button type="button" className="ncf-btn" onClick={() => setStep(STEP.PICK_SOURCE)}>Back</button>
            <button
              type="button"
              className="ncf-btn ncf-btn-primary"
              onClick={handleUrlConfirm}
              disabled={!url.trim()}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {step === STEP.FILE_PICKER && (
        <div className="new-canvas-file-flow">
          <div className="new-canvas-file-toolbar">
            <button
              type="button"
              className="ncf-btn"
              onClick={fileStack.length ? goBackInFiles : () => setStep(STEP.PICK_SOURCE)}
            >
              Back
            </button>
            <span title={currentDir?.path || 'Files'}>
              {currentDir?.name || 'Files'}
            </span>
          </div>

          <div className="new-canvas-file-list" aria-busy={isFileLoading}>
            {isFileLoading && fileItems.length === 0 ? (
              <div className="new-canvas-file-status">Loading...</div>
            ) : fileItems.length > 0 ? (
              fileItems.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  className={`new-canvas-file-row ${item.isDirectory ? 'is-folder' : 'is-file'} ${selectedFile?.path === item.path ? 'is-selected' : ''}`}
                  onClick={() => item.isDirectory ? openDirectory(item) : chooseFile(item)}
                  title={item.path}
                >
                  <span className="new-canvas-file-icon">{item.isDirectory ? '􀈕' : '􀈷'}</span>
                  <span className="new-canvas-file-name">{item.name}</span>
                </button>
              ))
            ) : (
              <div className="new-canvas-file-status">No files here.</div>
            )}
          </div>

          {fileStatus ? <div className="new-canvas-file-status is-error">{fileStatus}</div> : null}

          <div className="new-canvas-form new-canvas-file-details">
            <label htmlFor="ncf-file-name">Name</label>
            <input
              id="ncf-file-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedFile ? titleFromFileName(selectedFile.name) : 'Choose a file first'}
            />
            <div className="new-canvas-actions">
              <button type="button" className="ncf-btn" onClick={() => setStep(STEP.PICK_SOURCE)}>Cancel</button>
              <button
                type="button"
                className="ncf-btn ncf-btn-primary"
                onClick={handleFileConfirm}
                disabled={!selectedFile || isFileLoading}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewCanvasFlow;
