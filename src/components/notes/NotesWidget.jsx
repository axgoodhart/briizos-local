import { useDragSelectionLock } from '../../lib/dragSelection';
import { createPortal } from 'react-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { computeFloatingShellChrome } from '../../lib/floatingShell';
import logger from '../../lib/logger';
import '../../AppCombined.css';

/**
 * NotesWidget - Floating sticky notes system
 * - Drawer mode: Notes stacked on the right
 * - Floating mode: Notes can be torn off and dragged around
 * Content and placement are committed together through LocalDataService.
 */
function NotesWidget({ isOpen, onClose, drawerPosition, drawerDimensions, onDrawerChange }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, width: 250, height: 200 });

  // Drawer drag & resize state — initialize from persisted values
  const [drawerPos, setDrawerPos] = useState(drawerPosition || null);
  const [drawerSize, setDrawerSize] = useState(
    drawerDimensions || { width: 300, height: 520 }
  );
  const [draggingDrawer, setDraggingDrawer] = useState(false);
  const [resizingDrawer, setResizingDrawer] = useState(false);
  const [drawerDragOffset, setDrawerDragOffset] = useState({ x: 0, y: 0 });
  const [drawerResizeStart, setDrawerResizeStart] = useState({ mouseX: 0, mouseY: 0, width: 300, height: 520 });

  useDragSelectionLock(!!(draggingId || resizingId || draggingDrawer || resizingDrawer));

  useEffect(() => {
    if (!isOpen) return;
    // Reopening is a side-drawer action; a previous free drag must not strand it.
    const width = Math.min(drawerSize.width, window.innerWidth - 16);
    const height = Math.min(drawerSize.height, window.innerHeight - 16);
    const leftSide = drawerPos && drawerPos.x + width / 2 < window.innerWidth / 2;
    setDrawerPos({
      x: leftSide ? 8 : Math.max(8, window.innerWidth - width - 8),
      y: Math.max(8, Math.min(drawerPos?.y ?? window.innerHeight * .28, window.innerHeight - height - 8)),
    });
    logger.info('notes', 'Notes drawer opened at the window edge');
  }, [isOpen]);

  const MIN_NOTE_WIDTH = 220;
  const MIN_NOTE_HEIGHT = 170;
  const MIN_DRAWER_WIDTH = 240;
  const MIN_DRAWER_HEIGHT = 300;
  const TEXT_SAVE_DEBOUNCE_MS = 10_000;
  const REMOTE_REFRESH_DEBOUNCE_MS = 10_000;

  const drawerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const resetDrawerIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (document.documentElement.classList.contains('app-drag-selection-lock')) { resetDrawerIdle(); return; }
      drawerRef.current?.querySelector(':focus')?.blur();
      onCloseRef.current?.();
      logger.info('notes', 'Notes drawer tucked away after 10 seconds without interaction');
    }, 10_000);
  }, []);
  useEffect(() => {
    if (isOpen && !draggingDrawer && !resizingDrawer && !draggingId && !resizingId) resetDrawerIdle();
    else clearTimeout(idleTimerRef.current);
    return () => clearTimeout(idleTimerRef.current);
  }, [isOpen, draggingDrawer, resizingDrawer, draggingId, resizingId, resetDrawerIdle]);

  const isEditingTextRef = useRef(false);
  const pendingRemoteNotesRef = useRef(null);
  const remoteRefreshTimerRef = useRef(null);
  const pendingTextSavesRef = useRef(new Map());
  const textSaveTimersRef = useRef(new Map());

  const colors = ['#fef08a', '#a5f3fc', '#f0abfc', '#86efac', '#fca5a5', '#93c5fd'];

  // Compute position-aware 3D rotation
  const drawer3D = useMemo(() => {
    const rect = {
      x: drawerPos?.x ?? (window.innerWidth * 0.78 - drawerSize.width),
      y: drawerPos?.y ?? (window.innerHeight * 0.28),
      width: drawerSize.width,
      height: drawerSize.height,
    };
    return computeFloatingShellChrome(rect);
  }, [drawerPos, drawerSize]);

  const transformLocalNotes = useCallback((localNotes) => localNotes.map(note => ({
    ...note,
    title: note.title || '',
    content: note.content || '',
    color: note.color || '#fef08a',
    floating: !!note.floating,
    x: note.x ?? 100,
    y: note.y ?? 100,
    width: Math.max(note.width || 250, MIN_NOTE_WIDTH),
    height: Math.max(note.height || 200, MIN_NOTE_HEIGHT)
  })), []);

  const applyPendingRemoteNotes = useCallback(() => {
    if (remoteRefreshTimerRef.current) {
      clearTimeout(remoteRefreshTimerRef.current);
      remoteRefreshTimerRef.current = null;
    }

    if (isEditingTextRef.current) {
      remoteRefreshTimerRef.current = setTimeout(applyPendingRemoteNotes, REMOTE_REFRESH_DEBOUNCE_MS);
      return;
    }

    const pending = pendingRemoteNotesRef.current;
    if (!pending) return;
    pendingRemoteNotesRef.current = null;
    setNotes(pending);
    setLoading(false);
  }, []);

  const schedulePendingRemoteApply = useCallback(() => {
    if (!pendingRemoteNotesRef.current) return;
    if (remoteRefreshTimerRef.current) clearTimeout(remoteRefreshTimerRef.current);
    remoteRefreshTimerRef.current = setTimeout(applyPendingRemoteNotes, REMOTE_REFRESH_DEBOUNCE_MS);
  }, [applyPendingRemoteNotes]);

  const queueIncomingNotes = useCallback((localNotes) => {
    const transformed = transformLocalNotes(localNotes);
    if (isEditingTextRef.current) {
      pendingRemoteNotesRef.current = transformed;
      schedulePendingRemoteApply();
      setLoading(false);
      return;
    }

    if (remoteRefreshTimerRef.current) {
      clearTimeout(remoteRefreshTimerRef.current);
      remoteRefreshTimerRef.current = null;
    }
    pendingRemoteNotesRef.current = null;
    setNotes(transformed);
    setLoading(false);
  }, [schedulePendingRemoteApply, transformLocalNotes]);

  const buildLocalUpdates = useCallback((id, updates) => ({
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.color !== undefined && { color: updates.color }),
    ...(updates.floating !== undefined && { floating: updates.floating }),
    ...(updates.x !== undefined && { x: updates.x }),
    ...(updates.y !== undefined && { y: updates.y }),
    ...(updates.width !== undefined && { width: updates.width }),
    ...(updates.height !== undefined && { height: updates.height })
  }), []);

  const flushTextSave = useCallback((id) => {
    const timer = textSaveTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      textSaveTimersRef.current.delete(id);
    }

    const pending = pendingTextSavesRef.current.get(id);
    if (!pending) return;
    pendingTextSavesRef.current.delete(id);
    const { id: noteId, ...patch } = pending;
    window.api.localData.stickyNotes.update(noteId, patch).catch(error => {
      logger.error('ui', 'Failed to update note', error?.message);
    });
  }, []);

  const scheduleTextSave = useCallback((id, updates) => {
    const localUpdates = buildLocalUpdates(id, updates);
    const current = pendingTextSavesRef.current.get(id) || { id };
    pendingTextSavesRef.current.set(id, { ...current, ...localUpdates });

    const existingTimer = textSaveTimersRef.current.get(id);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => flushTextSave(id), TEXT_SAVE_DEBOUNCE_MS);
    textSaveTimersRef.current.set(id, timer);
  }, [buildLocalUpdates, flushTextSave]);

  const handleTextEditFocus = useCallback(() => {
    isEditingTextRef.current = true;
    if (remoteRefreshTimerRef.current) {
      clearTimeout(remoteRefreshTimerRef.current);
      remoteRefreshTimerRef.current = null;
    }
  }, []);

  const handleTextEditBlur = useCallback((id) => {
    flushTextSave(id);
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active?.closest?.('.note-input, .note-textarea')) {
        isEditingTextRef.current = false;
        schedulePendingRemoteApply();
      }
    }, 0);
  }, [flushTextSave, schedulePendingRemoteApply]);

  // Re-query committed notes after local organizer/workspace changes.
  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      try {
        queueIncomingNotes(await window.api.localData.stickyNotes.list());
      } catch (error) {
        logger.error('ui', 'Failed to load local notes', error?.message);
        setLoading(false);
      }
    };
    loadNotes();
    const unsubscribe = window.api.localData.onChanged((change) => {
      if (change?.domains?.some((domain) => domain === 'organizer' || domain === 'workspace')) loadNotes();
    });

    return () => {
      unsubscribe();
      if (remoteRefreshTimerRef.current) clearTimeout(remoteRefreshTimerRef.current);
      Array.from(pendingTextSavesRef.current.keys()).forEach(flushTextSave);
      textSaveTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [flushTextSave, queueIncomingNotes]);

  const addNote = async () => {
    const newNoteData = {
      title: 'New Note',
      content: '',
      color: colors[notes.length % colors.length],
      x: 100 + (notes.length * 20),
      y: 100 + (notes.length * 20),
      width: 250,
      height: 200
    };

    try {
      await window.api.localData.stickyNotes.create({
        title: newNoteData.title,
        content: newNoteData.content,
        color: newNoteData.color,
        floating: false,
        x: newNoteData.x,
        y: newNoteData.y,
        width: newNoteData.width,
        height: newNoteData.height,
      });
    } catch (error) {
      logger.error('ui', 'Failed to add note', error?.message);
    }
  };

  const updateNote = (id, updates) => {
    // Update local state immediately for responsiveness
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, ...updates } : note
    ));

    const isTextEdit = updates.title !== undefined || updates.content !== undefined;
    if (isTextEdit) {
      scheduleTextSave(id, updates);
      return;
    }

    if (updates.color !== undefined) logger.info('notes', 'Note color selected', { noteId: id, color: updates.color });
    if (updates.floating !== undefined) logger.info('notes', updates.floating ? 'Note floated out of drawer' : 'Note returned to drawer', { noteId: id });
    window.api.localData.stickyNotes.update(id, buildLocalUpdates(id, updates)).catch(error => {
      logger.error('ui', 'Failed to update note', error?.message);
    });
  };

  const handleDeleteNote = async (id) => {
    // Update local state immediately
    setNotes(notes.filter(note => note.id !== id));

    try {
      await window.api.localData.stickyNotes.archive(id);
    } catch (error) {
      logger.error('ui', 'Failed to delete note', error?.message);
    }
  };

  const tearOffNote = (id, e) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const rect = e.currentTarget.closest('.note-card').getBoundingClientRect();
    updateNote(id, {
      floating: true,
      x: rect.left,
      y: rect.top
    });
  };

  const dockNote = (id) => {
    updateNote(id, { floating: false });
  };

  // Drawer drag handler
  const handleDrawerDragStart = (e) => {
    if (
      e.target.closest('.note-card')
      || e.target.closest('.notes-add-btn')
      || e.target.closest('.notes-close-btn')
      || e.target.closest('.drawer-resize-handle')
    ) return;

    e.preventDefault();
    const drawerEl = e.currentTarget.closest('.notes-drawer');
    const rect = drawerEl.getBoundingClientRect();

    // If first drag, initialize position from current rendered position
    if (!drawerPos) {
      setDrawerPos({ x: rect.left, y: rect.top });
      setDrawerDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setDrawerDragOffset({ x: e.clientX - drawerPos.x, y: e.clientY - drawerPos.y });
    }
    setDraggingDrawer(true);
  };

  // Drawer resize handler
  const handleDrawerResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Initialize position if not set yet
    if (!drawerPos) {
      const drawerEl = e.currentTarget.closest('.notes-drawer');
      const rect = drawerEl.getBoundingClientRect();
      setDrawerPos({ x: rect.left, y: rect.top });
    }

    setResizingDrawer(true);
    setDrawerResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: drawerSize.width,
      height: drawerSize.height
    });
  };

  const handleMouseDown = (id, e) => {
    if (
      e.target.closest('button, input, textarea, select, a, [contenteditable]')
      || e.target.closest('.note-textarea')
      || e.target.closest('.note-resize-handle')
    ) return;

    const note = notes.find(n => n.id === id);
    if (!note?.floating) return;
    if (resizingId) return;

    e.preventDefault();
    setDraggingId(id);
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y
    });
  };

  const handleResizeStart = (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    const note = notes.find(n => n.id === id);
    if (!note?.floating) return;

    setResizingId(id);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: note.width,
      height: note.height
    });
  };

  const handleMouseMove = useCallback((e) => {
    // Drawer drag
    if (draggingDrawer) {
      setDrawerPos({
        x: e.clientX - drawerDragOffset.x,
        y: e.clientY - drawerDragOffset.y
      });
      return;
    }

    // Drawer resize
    if (resizingDrawer) {
      const dx = e.clientX - drawerResizeStart.mouseX;
      const dy = e.clientY - drawerResizeStart.mouseY;
      setDrawerSize({
        width: Math.max(MIN_DRAWER_WIDTH, drawerResizeStart.width + dx),
        height: Math.max(MIN_DRAWER_HEIGHT, drawerResizeStart.height + dy)
      });
      return;
    }

    if (resizingId) {
      const dx = e.clientX - resizeStart.mouseX;
      const dy = e.clientY - resizeStart.mouseY;
      const nextWidth = Math.max(MIN_NOTE_WIDTH, resizeStart.width + dx);
      const nextHeight = Math.max(MIN_NOTE_HEIGHT, resizeStart.height + dy);

      setNotes(prev => prev.map(n =>
        n.id === resizingId ? { ...n, width: nextWidth, height: nextHeight } : n
      ));
      return;
    }

    if (!draggingId) return;

    setNotes(prev => prev.map(n =>
      n.id === draggingId ? {
        ...n,
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      } : n
    ));
  }, [draggingId, dragOffset, resizingId, resizeStart, draggingDrawer, drawerDragOffset, resizingDrawer, drawerResizeStart]);

  const handleMouseUp = useCallback(() => {
    if (draggingDrawer) {
      setDraggingDrawer(false);
      if (onDrawerChange) onDrawerChange(drawerPos, drawerSize);
      return;
    }
    if (resizingDrawer) {
      setResizingDrawer(false);
      if (onDrawerChange) onDrawerChange(drawerPos, drawerSize);
      return;
    }

    if (draggingId) {
      const note = notes.find(n => n.id === draggingId);
      if (note) {
        window.api.localData.stickyNotes.update(draggingId, {
          x: note.x,
          y: note.y,
          width: note.width,
          height: note.height
        }).catch(err => logger.error('ui', 'Failed to save position', err?.message));
      }
    }

    if (resizingId) {
      const note = notes.find(n => n.id === resizingId);
      if (note) {
        window.api.localData.stickyNotes.update(resizingId, {
          x: note.x,
          y: note.y,
          width: Math.max(MIN_NOTE_WIDTH, Math.round(note.width)),
          height: Math.max(MIN_NOTE_HEIGHT, Math.round(note.height))
        }).catch(err => logger.error('ui', 'Failed to save note size', err?.message));
      }
    }

    setDraggingId(null);
    setResizingId(null);
  }, [draggingId, resizingId, notes, draggingDrawer, resizingDrawer, onDrawerChange, drawerPos, drawerSize]);

  useEffect(() => {
    if (draggingId || resizingId || draggingDrawer || resizingDrawer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('blur', handleMouseUp);
      window.addEventListener('pointercancel', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('blur', handleMouseUp);
        window.removeEventListener('pointercancel', handleMouseUp);
      };
    }
  }, [draggingId, resizingId, draggingDrawer, resizingDrawer, handleMouseMove, handleMouseUp]);

  // Separate docked and floating notes
  const dockedNotes = notes;
  const floatingNotes = notes.filter(n => n.floating);

  return createPortal(
    <>
      {/* Drawer */}
      <div
        ref={drawerRef}
        inert={isOpen ? undefined : ''}
        onPointerMove={isOpen ? resetDrawerIdle : undefined}
        onPointerDown={isOpen ? resetDrawerIdle : undefined}
        onKeyDown={isOpen ? resetDrawerIdle : undefined}
        onInput={isOpen ? resetDrawerIdle : undefined}
        onWheel={isOpen ? resetDrawerIdle : undefined}
        className={`notes-drawer ${isOpen ? 'open' : ''} ${draggingDrawer ? 'drawer-dragging' : ''} ${resizingDrawer ? 'drawer-resizing' : ''}`}
        style={{
          ...(drawerPos ? { left: drawerPos.x, top: drawerPos.y, right: 'auto' } : {}),
          width: drawerSize.width,
          height: drawerSize.height,
          transformOrigin: drawerPos && drawerPos.x < window.innerWidth / 2 ? 'left center' : 'right center',
          transform: isOpen
            ? 'perspective(800px) rotateY(0deg)'
            : 'perspective(800px) rotateY(-90deg)',
          boxShadow: isOpen ? drawer3D.boxShadow : undefined,
          borderRadius: drawer3D.borderRadius,
          borderTop: drawer3D.borderTop,
          borderBottom: drawer3D.borderBottom,
          borderLeft: drawer3D.borderLeft,
          borderRight: drawer3D.borderRight,
        }}
      >
        <div className="notes-drawer-header" onMouseDown={handleDrawerDragStart}>
          <span className="notes-title">Notes</span>
          <div className="notes-actions">
            <button className="notes-add-btn" onClick={addNote} title="New Note">+</button>
            <button className="notes-close-btn" onClick={onClose} title="Close">×</button>
          </div>
        </div>

        <div className="notes-drawer-content">
          {loading ? (
            <div className="notes-loading">Loading notes...</div>
          ) : dockedNotes.length === 0 ? (
            <div className="notes-empty">
              <p>No notes yet</p>
              <button className="create-note-btn" onClick={addNote}>Create a note</button>
            </div>
          ) : (
            dockedNotes.map(note => note.floating ? (
              <button key={note.id} type="button" className="note-shadow" style={{ '--note-color': note.color }}
                onClick={() => dockNote(note.id)} title="Return this floating note to the drawer">
                <span>{note.title || 'Untitled note'}</span><span>Floating · return to drawer</span>
              </button>
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={(updates) => updateNote(note.id, updates)}
                onDelete={() => handleDeleteNote(note.id)}
                onTearOff={(e) => tearOffNote(note.id, e)}
                onTextEditFocus={handleTextEditFocus}
                onTextEditBlur={() => handleTextEditBlur(note.id)}
                isDocked={true}
              />
            ))
          )}
        </div>
        <div
          className="drawer-resize-handle"
          onMouseDown={handleDrawerResizeStart}
        />
      </div>

      {/* Floating Notes */}
      {floatingNotes.map(note => (
        <div
          key={note.id}
          className={`floating-note ${draggingId === note.id ? 'dragging' : ''} ${resizingId === note.id ? 'resizing' : ''}`}
          style={{
            left: note.x,
            top: note.y,
            width: note.width,
            height: note.height,
            backgroundColor: note.color
          }}
          onMouseDown={(e) => handleMouseDown(note.id, e)}
        >
          <NoteCard
            note={note}
            onUpdate={(updates) => updateNote(note.id, updates)}
            onDelete={() => handleDeleteNote(note.id)}
            onDock={() => dockNote(note.id)}
            onResizeStart={(e) => handleResizeStart(note.id, e)}
            onTextEditFocus={handleTextEditFocus}
            onTextEditBlur={() => handleTextEditBlur(note.id)}
            isDocked={false}
          />
        </div>
      ))}
    </>, document.body
  );
}

/**
 * Individual Note Card
 */
function NoteCard({ note, onUpdate, onDelete, onTearOff, onDock, onResizeStart, onTextEditFocus, onTextEditBlur, isDocked }) {
  return (
    <div
      className="note-card"
      data-theme-role="card"
      data-theme-component="Notes"
      data-theme-instance={note.id}
      style={{ borderTopColor: note.color, '--note-color': note.color }}
    >
      <div className="note-header">
        <input
          type="text"
          className="note-input"
          value={note.title}
          onFocus={onTextEditFocus}
          onBlur={onTextEditBlur}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Title..."
        />
        <div className="note-controls">
          {isDocked ? (
            <button
              className="note-btn tear-off"
              onClick={onTearOff}
              title="Tear off (make floating)"
            >
              ↗
            </button>
          ) : (
            <button
              className="note-btn dock"
              onClick={onDock}
              title="Dock (return to drawer)"
            >
              ↙
            </button>
          )}
          <button
            className="note-btn delete"
            onClick={onDelete}
            title="Delete note"
          >
            ×
          </button>
        </div>
      </div>
      <textarea
        className="note-textarea"
        value={note.content}
        onFocus={onTextEditFocus}
        onBlur={onTextEditBlur}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Write something..."
      />
      <div className="note-footer">
        <div className="color-picker">
          {['#fef08a', '#a5f3fc', '#f0abfc', '#86efac', '#fca5a5', '#93c5fd'].map((color, index) => (
            <button
              key={color}
              type="button"
              aria-label={`Note color: ${['yellow', 'cyan', 'pink', 'green', 'coral', 'blue'][index]}`}
              aria-pressed={note.color === color}
              title={['Yellow', 'Cyan', 'Pink', 'Green', 'Coral', 'Blue'][index]}
              onMouseDown={(event) => event.stopPropagation()}
              className={`color-dot ${note.color === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => onUpdate({ color })}
            />
          ))}
        </div>
      </div>
      {!isDocked && (
        <div
          className="note-resize-handle"
          title="Resize note"
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
}

export default NotesWidget;
