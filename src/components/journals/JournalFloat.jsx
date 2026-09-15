import { useDragSelectionLock } from '../../lib/dragSelection';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../AppCombined.css';
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

/* Float geometry mirrors the CSS (.journal-float / .journal-float__header
   in journals.css — keep these in sync when either changes): the frame has
   no padding, just fixed shell borders and the 34px header. The remaining
   surface stays at the page's exact 3:4 proportion, so resize never
   creates letterboxing or crops the page. */
const FLOAT_PAGE_ASPECT = 3 / 4;
const FLOAT_SHELL_BORDER_X = 4;
const FLOAT_SHELL_BORDER_Y = 7;
const FLOAT_HEADER_HEIGHT = 34;
const DEFAULT_FLOAT_WIDTH = 620;
const MIN_W = 320;
const HOME_HEIGHT_RATIO = 0.75;
const HOME_VIEWPORT_GUTTER = 12;

/* Click-and-hold drag: the pointer must stay put this long (and this
   still) before the frame grabs the window. Early movement or release
   means the user was editing text, so the hold cancels. */
const HOLD_MS = 400;
const HOLD_SLOP = 6;
const GRAB_PULSE_MS = 500;

export function normalizeJournalFloatSize(size = {}) {
  const requestedWidth = Number(size.width);
  const width = Math.max(
    MIN_W,
    Number.isFinite(requestedWidth) ? requestedWidth : DEFAULT_FLOAT_WIDTH,
  );
  const height = Math.round(
    FLOAT_SHELL_BORDER_Y
      + FLOAT_HEADER_HEIGHT
      + (width - FLOAT_SHELL_BORDER_X) / FLOAT_PAGE_ASPECT,
  );
  return { width, height };
}

const DEFAULT_FLOAT_SIZE = normalizeJournalFloatSize();

export function getJournalFloatHomeRect(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
) {
  const safeViewportWidth = Math.max(1, Number(viewportWidth) || 1280);
  const safeViewportHeight = Math.max(1, Number(viewportHeight) || 800);
  const height = Math.round(safeViewportHeight * HOME_HEIGHT_RATIO);
  const idealWidth = Math.round(
    FLOAT_SHELL_BORDER_X
      + Math.max(0, height - FLOAT_SHELL_BORDER_Y - FLOAT_HEADER_HEIGHT) * FLOAT_PAGE_ASPECT,
  );
  const availableWidth = Math.max(1, safeViewportWidth - HOME_VIEWPORT_GUTTER * 2);
  const width = Math.min(availableWidth, Math.max(Math.min(MIN_W, availableWidth), idealWidth));

  return {
    x: Math.round((safeViewportWidth - width) / 2),
    y: Math.round((safeViewportHeight - height) / 2),
    width,
    height,
  };
}

export function JournalFloat({
  journalId,
  onClose = null,
  onDock = null,
  homeRequest = 0,
  onPanelChange = null,
}) {
  const initialHomeRect = useRef(getJournalFloatHomeRect()).current;
  const [journal, setJournal] = useState(null); // null = loading
  const [panelPos, setPanelPos] = useState({ x: initialHomeRect.x, y: initialHomeRect.y });
  const [panelSize, setPanelSize] = useState({
    width: initialHomeRect.width,
    height: initialHomeRect.height,
  });
  const [trayHeight, setTrayHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [grabPulse, setGrabPulse] = useState(false);
  useDragSelectionLock(!!(dragging || resizing));

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
  const onPanelChangeRef = useRef(onPanelChange);
  onCloseRef.current = onClose;
  onPanelChangeRef.current = onPanelChange;

  /* Opening and Home share one canonical runtime-relative placement.
     Recompute rather than reuse persisted geometry so the result follows
     the current briizOS window, including after the app window changes. */
  useEffect(() => {
    const homeRect = getJournalFloatHomeRect();
    const nextPos = { x: homeRect.x, y: homeRect.y };
    const nextSize = { width: homeRect.width, height: homeRect.height };
    setPanelPos(nextPos);
    setPanelSize(nextSize);
    onPanelChangeRef.current?.(nextPos, nextSize);
    logger.info('journal', 'Floating journal returned home', {
      journalId,
      x: homeRect.x,
      y: homeRect.y,
      width: homeRect.width,
      height: homeRect.height,
    });
  }, [journalId, homeRequest]);

  /* Load the journal row. No single-row IPC exists, so filter the list;
     a miss self-heals a stale persisted id (journal deleted between
     sessions) by closing the float. */
  useEffect(() => {
    let cancelled = false;
    setJournal(null);
    setTrayHeight(0);
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

  /* The page surface is a text editor, so mousedown must reach it untouched
     (caret placement, selection, double-click word-select). The frame only
     grabs the window when the pointer holds still for HOLD_MS; moving or
     releasing early cancels the hold and leaves the editor alone. The
     header keeps ordinary single-press drag via its own handler, which
     preventDefaults before this one runs. */
  const holdTimerRef = useRef(null);
  const cancelHoldRef = useRef(() => {});

  const handleFrameMouseDown = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.journal-float__resize')) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const cancelHold = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      window.removeEventListener('mousemove', onHoldMove);
      window.removeEventListener('mouseup', cancelHold);
    };
    const onHoldMove = (ev) => {
      if (Math.abs(ev.clientX - startX) > HOLD_SLOP || Math.abs(ev.clientY - startY) > HOLD_SLOP) cancelHold();
    };

    cancelHoldRef.current = cancelHold;
    window.addEventListener('mousemove', onHoldMove);
    window.addEventListener('mouseup', cancelHold);

    holdTimerRef.current = setTimeout(() => {
      cancelHold();
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (!panelPos) setPanelPos({ x: rect.left, y: rect.top });
      setDragOffset({ x: startX - rect.left, y: startY - rect.top });
      /* The un-prevented mousedown may have armed a text selection; clear
         it so dragging the window doesn't also smear a selection. */
      window.getSelection()?.removeAllRanges();
      setDragging(true);
      setGrabPulse(true);
      logger.info('journal', 'Floating journal drag armed via click-and-hold', { journalId });
    }, HOLD_MS);
  };

  /* Pending hold must not outlive the component. */
  useEffect(() => () => cancelHoldRef.current(), []);

  useEffect(() => {
    if (!grabPulse) return undefined;
    const timer = setTimeout(() => setGrabPulse(false), GRAB_PULSE_MS);
    return () => clearTimeout(timer);
  }, [grabPulse]);

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
      const horizontalChange = Math.abs(dx) / Math.max(1, resizeStart.width);
      const verticalChange = Math.abs(dy) / Math.max(1, resizeStart.height);
      const widthFromHeight = FLOAT_SHELL_BORDER_X
        + Math.max(
          0,
          resizeStart.height + dy
            - FLOAT_SHELL_BORDER_Y
            - FLOAT_HEADER_HEIGHT,
        ) * FLOAT_PAGE_ASPECT;
      const nextWidth = verticalChange > horizontalChange
        ? widthFromHeight
        : resizeStart.width + dx;
      setPanelSize(normalizeJournalFloatSize({ width: nextWidth }));
    }
  }, [dragging, dragOffset, resizing, resizeStart]);

  const handleTrayHeightChange = useCallback((height) => {
    const nextHeight = Math.max(0, Math.ceil(height || 0));
    setTrayHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

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
      window.addEventListener('blur', handleFloatingUp);
      window.addEventListener('pointercancel', handleFloatingUp);
    return () => {
      window.removeEventListener('mousemove', handleFloatingMove);
      window.removeEventListener('mouseup', handleFloatingUp);
        window.removeEventListener('blur', handleFloatingUp);
        window.removeEventListener('pointercancel', handleFloatingUp);
    };
  }, [dragging, resizing, handleFloatingMove, handleFloatingUp]);

  return (
    <div
      ref={frameRef}
      className={`journal-float ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''} ${grabPulse ? 'grab-pulse' : ''}`}
      style={{
        left: panelPos.x,
        top: panelPos.y,
        width: panelSize.width,
        height: panelSize.height + trayHeight,
      }}
      onMouseDown={handleFrameMouseDown}
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
              onTrayHeightChange: handleTrayHeightChange,
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
