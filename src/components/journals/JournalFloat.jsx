import { useCallback, useEffect, useRef, useState } from 'react';
import './journals.css';
import { api, JOURNALS_CHANGED_EVENT } from './api.js';
import { COVERS, PAGES } from './assets.js';
import { JournalView } from './JournalView.jsx';
import { computeFloatingShellChrome } from '../../lib/floatingShell';
import logger from '../../lib/logger';

/* ── JournalFloat ────────────────────────────────────────────────────
   A journal torn off the shelf: a fixed-position draggable/resizable
   shell hosting the slim (single-page) JournalView, mounted at the App
   root so it outlives the Journals panel tile. The shell adopts the same
   position-based perspective chrome as the notes drawer and media panel
   (computeFloatingShellChrome). Position/size persist to the workspace
   via onPanelChange; the journal id itself persists in App state.

   Cross-surface sync rides the `briizos-journals-changed` window event:
   the float announces itself on close/unmount (so the shelf refreshes
   folio counts) and closes itself when the shelf deletes its journal. */

const DEFAULT_FLOAT_SIZE = { width: 620, height: 800 };
const MIN_W = 420;
const MIN_H = 520;

export function JournalFloat({
  journalId,
  onClose = null,
  onDock = null,
  panelPosition = null,
  panelDimensions = null,
  onPanelChange = null,
}) {
  const [journal, setJournal] = useState(null); // null = loading
  const [panelPos, setPanelPos] = useState(panelPosition || null);
  const [panelSize, setPanelSize] = useState(panelDimensions || DEFAULT_FLOAT_SIZE);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    mouseX: 0,
    mouseY: 0,
    width: DEFAULT_FLOAT_SIZE.width,
    height: DEFAULT_FLOAT_SIZE.height,
  });
  const [shellChrome, setShellChrome] = useState(() => computeFloatingShellChrome({
    x: 0,
    y: 0,
    width: DEFAULT_FLOAT_SIZE.width,
    height: DEFAULT_FLOAT_SIZE.height,
  }));

  const frameRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /* Load the journal row. No single-row IPC exists, so filter the list;
     a miss self-heals a stale persisted id (journal deleted between
     sessions) by closing the float. */
  useEffect(() => {
    let cancelled = false;
    setJournal(null);
    api.list().then((list) => {
      if (cancelled) return;
      const row = list.find((j) => j.id === journalId);
      if (!row) {
        logger.warn('journal', 'Floating journal missing, closing float', { journalId });
        onCloseRef.current?.();
        return;
      }
      setJournal(row);
      logger.info('journal', 'Journal loaded into float', { journalId, title: row.title });
    }).catch((err) => {
      if (cancelled) return;
      logger.error('journal', 'journals:list failed loading float', err?.message);
      onCloseRef.current?.();
    });
    return () => { cancelled = true; };
  }, [journalId]);

  /* Shelf deleted this journal → close; announce our own edits on
     unmount so the shelf refreshes folio counts/titles. */
  useEffect(() => {
    const onChanged = (e) => {
      if (e.detail?.deleted && e.detail?.journalId === journalId) {
        logger.info('journal', 'Floating journal closed', { journalId, reason: 'deleted' });
        onCloseRef.current?.();
      }
    };
    window.addEventListener(JOURNALS_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(JOURNALS_CHANGED_EVENT, onChanged);
      window.dispatchEvent(new CustomEvent(JOURNALS_CHANGED_EVENT, { detail: { journalId } }));
    };
  }, [journalId]);

  /* Position-based perspective chrome, recomputed as the float moves or
     resizes — same engine as the notes drawer and media panel. */
  useEffect(() => {
    const updateShellChrome = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      setShellChrome(computeFloatingShellChrome(rect));
    };

    updateShellChrome();
    const frameId = window.requestAnimationFrame(updateShellChrome);
    window.addEventListener('resize', updateShellChrome);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && frameRef.current) {
      resizeObserver = new ResizeObserver(() => updateShellChrome());
      resizeObserver.observe(frameRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateShellChrome);
      resizeObserver?.disconnect();
    };
  }, [panelPos, panelSize]);

  const handleDragStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.journal-float__resize')) return;

    e.preventDefault();
    const frameEl = frameRef.current;
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();

    if (!panelPos) {
      setPanelPos({ x: rect.left, y: rect.top });
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setDragOffset({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
    }
    setDragging(true);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!panelPos && frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect();
      setPanelPos({ x: rect.left, y: rect.top });
    }

    setResizing(true);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    });
  };

  const handleFloatingMove = useCallback((e) => {
    if (dragging) {
      setPanelPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
      return;
    }

    if (resizing) {
      const dx = e.clientX - resizeStart.mouseX;
      const dy = e.clientY - resizeStart.mouseY;
      setPanelSize({
        width: Math.max(MIN_W, resizeStart.width + dx),
        height: Math.max(MIN_H, resizeStart.height + dy),
      });
    }
  }, [dragging, dragOffset, resizing, resizeStart]);

  const handleFloatingUp = useCallback(() => {
    if (!dragging && !resizing) return;

    const wasDragging = dragging;
    setDragging(false);
    setResizing(false);

    const rect = frameRef.current?.getBoundingClientRect();
    const nextPos = rect ? { x: rect.left, y: rect.top } : panelPos;
    onPanelChange?.(nextPos, panelSize);
    logger.info('journal', wasDragging ? 'Floating journal moved' : 'Floating journal resized', {
      journalId,
      x: Math.round(nextPos?.x ?? 0),
      y: Math.round(nextPos?.y ?? 0),
      width: Math.round(panelSize.width),
      height: Math.round(panelSize.height),
    });
  }, [dragging, resizing, onPanelChange, panelPos, panelSize, journalId]);

  useEffect(() => {
    if (!dragging && !resizing) return;

    window.addEventListener('mousemove', handleFloatingMove);
    window.addEventListener('mouseup', handleFloatingUp);
    return () => {
      window.removeEventListener('mousemove', handleFloatingMove);
      window.removeEventListener('mouseup', handleFloatingUp);
    };
  }, [dragging, resizing, handleFloatingMove, handleFloatingUp]);

  const fallbackX = typeof window !== 'undefined'
    ? Math.max(36, window.innerWidth * 0.58 - panelSize.width / 2)
    : 140;
  const fallbackY = typeof window !== 'undefined'
    ? Math.max(72, window.innerHeight * 0.16)
    : 110;

  return (
    <div
      ref={frameRef}
      className={`journal-float ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''}`}
      style={{
        left: panelPos?.x ?? fallbackX,
        top: panelPos?.y ?? fallbackY,
        width: panelSize.width,
        height: panelSize.height,
      }}
    >
      <div
        className="journal-float__shell"
        style={{
          transform: `perspective(960px) rotateY(${shellChrome.rotateY}deg) rotateX(${shellChrome.rotateX}deg)`,
          boxShadow: shellChrome.boxShadow,
          borderRadius: shellChrome.borderRadius,
          borderTop: shellChrome.borderTop,
          borderBottom: shellChrome.borderBottom,
          borderLeft: shellChrome.borderLeft,
          borderRight: shellChrome.borderRight,
        }}
      >
        {journal ? (
          <JournalView
            journal={journal}
            pageUrl={PAGES[journal.page]}
            coverUrl={COVERS[journal.cover]}
            variant="float"
            onBack={onClose}
            floatChrome={{
              onDragStart: handleDragStart,
              onDock,
              onClose,
            }}
            onJournalChange={(updated) => {
              setJournal((prev) => ({ ...prev, ...updated }));
              window.dispatchEvent(new CustomEvent(JOURNALS_CHANGED_EVENT, { detail: { journalId: updated.id } }));
            }}
          />
        ) : (
          <>
            <div className="panel-header journal-float__header" onMouseDown={handleDragStart}>
              <span className="journal-float__title">Journal</span>
              <div className="panel-header-actions journal-float__window-actions">
                {onDock && (
                  <button type="button" className="panel-header-btn" onClick={onDock} title="Dock to Journals panel" aria-label="Dock to Journals panel">⤓</button>
                )}
                {onClose && (
                  <button type="button" className="panel-header-btn" onClick={onClose} title="Close" aria-label="Close">×</button>
                )}
              </div>
            </div>
            <p className="jr-empty journal-float__loading">Opening…</p>
          </>
        )}
      </div>
      <div className="journal-float__resize" onMouseDown={handleResizeStart} />
    </div>
  );
}
