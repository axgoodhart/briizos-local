import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { CANVAS_RENDER_ENGINES } from '../lib/canvasUtils';

// The canvas library is backed by the Electron IPC canvas store
// (flat HTML files at {appData}/briizOS/canvas/). Metadata — form
// factor, display name, source — is persisted per-canvas in sidecar
// ".meta.json" files alongside the HTML. The hook owns the list state
// and exposes CRUD helpers that all ultimately call through
// window.api.canvas*.

const api = typeof window !== 'undefined' && window.api ? window.api : null;
const hasCanvasApi = !!(api && api.canvasList);

const DEFAULT_META = Object.freeze({
  formFactor: 'float',
  source: 'ai',
  renderEngine: CANVAS_RENDER_ENGINES.IFRAME,
  url: '',
});

function normalizeEntry(entry) {
  if (!entry) return null;
  return {
    id: entry.filename,
    filename: entry.filename,
    title: entry.title || entry.filename,
    size: entry.size || 0,
    formFactor: entry.formFactor || DEFAULT_META.formFactor,
    source: entry.source || DEFAULT_META.source,
    renderEngine: entry.renderEngine || DEFAULT_META.renderEngine,
    url: entry.url || DEFAULT_META.url,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  };
}

export function useCanvases() {
  const [canvases, setCanvases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!hasCanvasApi) {
      setCanvases([]);
      setIsLoading(false);
      return [];
    }
    try {
      const raw = await api.canvasList();
      const list = Array.isArray(raw) ? raw.map(normalizeEntry).filter(Boolean) : [];
      if (mountedRef.current) {
        setCanvases(list);
        setIsLoading(false);
      }
      return list;
    } catch (err) {
      logger.error('canvases', 'Failed to list canvases', { error: String(err) });
      if (mountedRef.current) {
        setCanvases([]);
        setIsLoading(false);
      }
      return [];
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  const loadHtml = useCallback(async (filename) => {
    if (!hasCanvasApi) return '';
    try {
      const html = await api.canvasLoad(filename);
      return html || '';
    } catch (err) {
      logger.error('canvases', 'Failed to load canvas HTML', { filename, error: String(err) });
      return '';
    }
  }, []);

  const loadMeta = useCallback(async (filename) => {
    if (!hasCanvasApi) return { ...DEFAULT_META };
    try {
      const meta = await api.canvasLoadMeta(filename);
      return { ...DEFAULT_META, ...(meta || {}) };
    } catch (err) {
      logger.error('canvases', 'Failed to load canvas meta', { filename, error: String(err) });
      return { ...DEFAULT_META };
    }
  }, []);

  const saveMeta = useCallback(async (filename, meta) => {
    if (!hasCanvasApi) return { success: false };
    try {
      const res = await api.canvasSaveMeta(filename, meta);
      if (res?.success) {
        logger.info('canvases', 'Canvas meta saved', { filename, meta });
      }
      await refresh();
      return res || { success: false };
    } catch (err) {
      logger.error('canvases', 'Failed to save canvas meta', { filename, error: String(err) });
      return { success: false, error: String(err) };
    }
  }, [refresh]);

  // Create a new canvas from raw HTML + initial meta. Returns the
  // saved entry (with filename) or null on failure.
  const createCanvas = useCallback(async ({
    title,
    html,
    formFactor = 'float',
    source = 'ai',
    meta = {},
  }) => {
    if (!hasCanvasApi) return null;
    const safeTitle = (title || 'Untitled Canvas').trim() || 'Untitled Canvas';
    try {
      const saveRes = await api.canvasSave(safeTitle, html || '<!doctype html><html><body></body></html>');
      if (!saveRes?.success || !saveRes.filename) {
        logger.error('canvases', 'Canvas save failed', { title: safeTitle, saveRes });
        return null;
      }
      const metaRes = await api.canvasSaveMeta(saveRes.filename, {
        displayName: safeTitle,
        formFactor,
        source,
        renderEngine: meta.renderEngine || (source === 'url' ? CANVAS_RENDER_ENGINES.BROWSER : CANVAS_RENDER_ENGINES.IFRAME),
        url: meta.url || '',
      });
      logger.info('canvases', 'Canvas created', {
        filename: saveRes.filename,
        title: safeTitle,
        formFactor,
        source,
      });
      await refresh();
      return {
        id: saveRes.filename,
        filename: saveRes.filename,
        title: safeTitle,
        formFactor,
        source,
        renderEngine: metaRes?.meta?.renderEngine || meta.renderEngine || DEFAULT_META.renderEngine,
        url: metaRes?.meta?.url || meta.url || '',
        meta: metaRes?.meta || {},
      };
    } catch (err) {
      logger.error('canvases', 'Failed to create canvas', { title: safeTitle, error: String(err) });
      return null;
    }
  }, [refresh]);

  const deleteCanvas = useCallback(async (filename) => {
    if (!hasCanvasApi) return { success: false };
    try {
      const res = await api.canvasDelete(filename);
      if (res?.success) {
        logger.info('canvases', 'Canvas deleted', { filename });
      } else {
        logger.error('canvases', 'Canvas delete failed', { filename, res });
      }
      await refresh();
      return res || { success: false };
    } catch (err) {
      logger.error('canvases', 'Failed to delete canvas', { filename, error: String(err) });
      return { success: false, error: String(err) };
    }
  }, [refresh]);

  const renameCanvas = useCallback(async (filename, newTitle) => {
    if (!hasCanvasApi) return { success: false };
    const safeTitle = String(newTitle || '').trim();
    if (!safeTitle) return { success: false, error: 'Empty title' };
    try {
      const res = await api.canvasRename(filename, safeTitle);
      if (res?.success) {
        logger.info('canvases', 'Canvas renamed', {
          oldFilename: filename,
          newFilename: res.filename,
          newTitle: safeTitle,
        });
      } else {
        logger.error('canvases', 'Canvas rename failed', { filename, res });
      }
      await refresh();
      return res || { success: false };
    } catch (err) {
      logger.error('canvases', 'Failed to rename canvas', { filename, error: String(err) });
      return { success: false, error: String(err) };
    }
  }, [refresh]);

  const setFormFactor = useCallback(async (filename, formFactor) => {
    if (!hasCanvasApi) return { success: false };
    try {
      const existing = await api.canvasLoadMeta(filename);
      const next = { ...(existing || {}), formFactor };
      const res = await api.canvasSaveMeta(filename, next);
      if (res?.success) {
        logger.info('canvases', 'Canvas form factor changed', { filename, formFactor });
      }
      await refresh();
      return res || { success: false };
    } catch (err) {
      logger.error('canvases', 'Failed to set canvas form factor', { filename, error: String(err) });
      return { success: false, error: String(err) };
    }
  }, [refresh]);

  const setRenderEngine = useCallback(async (filename, renderEngine) => {
    if (!hasCanvasApi) return { success: false };
    try {
      const existing = await api.canvasLoadMeta(filename);
      const next = { ...(existing || {}), renderEngine };
      const res = await api.canvasSaveMeta(filename, next);
      if (res?.success) {
        logger.info('canvases', 'Canvas render engine changed', { filename, renderEngine });
      }
      await refresh();
      return res || { success: false };
    } catch (err) {
      logger.error('canvases', 'Failed to set canvas render engine', { filename, error: String(err) });
      return { success: false, error: String(err) };
    }
  }, [refresh]);

  return {
    canvases,
    isLoading,
    refresh,
    loadHtml,
    loadMeta,
    saveMeta,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    setFormFactor,
    setRenderEngine,
  };
}

export default useCanvases;
