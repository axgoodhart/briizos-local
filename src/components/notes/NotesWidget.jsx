import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeNotes, upsertNote, deleteNote as deleteNoteFirestore } from '../../lib/firestore';
import { ensureAuth } from '../../lib/firebase';
import { computeFloatingShellChrome } from '../../lib/floatingShell';
import logger from '../../lib/logger';
import './NotesWidget.css';

/**
 * NotesWidget - Floating sticky notes system
 * - Drawer mode: Notes stacked on the right
 * - Floating mode: Notes can be torn off and dragged around
 * Connected to Firebase Firestore for sync with briizOS-Dev
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

  const MIN_NOTE_WIDTH = 220;
  const MIN_NOTE_HEIGHT = 170;
  const MIN_DRAWER_WIDTH = 240;
  const MIN_DRAWER_HEIGHT = 300;

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

  // Subscribe to notes from Firebase
  useEffect(() => {
    let unsubscribe = () => {};

    const setupSubscription = async () => {
      setLoading(true);
      await ensureAuth();

      unsubscribe = subscribeNotes((firebaseNotes) => {
        // Transform to component format
        const transformed = firebaseNotes.map(note => ({
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          color: note.color || '#fef08a',
          floating: !note.is_docked,
          x: note.position_x || 100,
          y: note.position_y || 100,
          width: Math.max(note.width || 250, MIN_NOTE_WIDTH),
          height: Math.max(note.height || 200, MIN_NOTE_HEIGHT)
        }));
        setNotes(transformed);
        setLoading(false);
      });
    };

    setupSubscription();

    return () => unsubscribe();
  }, []);

  const addNote = async () => {
    const newNoteData = {
      title: 'New Note',
      content: '',
      color: colors[notes.length % colors.length],
      is_docked: 1,
      position_x: 100 + (notes.length * 20),
      position_y: 100 + (notes.length * 20),
      width: 250,
      height: 200
    };

    try {
      await upsertNote(newNoteData);
      // Note: Real-time subscription will update the state
    } catch (error) {
      logger.error('ui', 'Failed to add note', error?.message);
    }
  };

  const updateNote = async (id, updates) => {
    // Update local state immediately for responsiveness
    setNotes(notes.map(note =>
      note.id === id ? { ...note, ...updates } : note
    ));

    // Transform updates for Firestore
    const firestoreUpdates = {
      id,
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.floating !== undefined && { is_docked: updates.floating ? 0 : 1 }),
      ...(updates.x !== undefined && { position_x: updates.x }),
      ...(updates.y !== undefined && { position_y: updates.y }),
      ...(updates.width !== undefined && { width: updates.width }),
      ...(updates.height !== undefined && { height: updates.height })
    };

    try {
      await upsertNote(firestoreUpdates);
    } catch (error) {
      logger.error('ui', 'Failed to update note', error?.message);
    }
  };

  const handleDeleteNote = async (id) => {
    // Update local state immediately
    setNotes(notes.filter(note => note.id !== id));

    try {
      await deleteNoteFirestore(id);
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
      e.target.closest('.note-input')
      || e.target.closest('.note-textarea')
      || e.target.closest('.note-resize-handle')
    ) return;

    const note = notes.find(n => n.id === id);
    if (!note?.floating) return;
    if (resizingId) return;

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
        upsertNote({
          id: draggingId,
          position_x: note.x,
          position_y: note.y,
          width: note.width,
          height: note.height
        }).catch(err => logger.error('ui', 'Failed to save position', err?.message));
      }
    }

    if (resizingId) {
      const note = notes.find(n => n.id === resizingId);
      if (note) {
        upsertNote({
          id: resizingId,
          position_x: note.x,
          position_y: note.y,
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
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, resizingId, draggingDrawer, resizingDrawer, handleMouseMove, handleMouseUp]);

  // Separate docked and floating notes
  const dockedNotes = notes.filter(n => !n.floating);
  const floatingNotes = notes.filter(n => n.floating);

  return (
    <>
      {/* Drawer */}
      <div
        className={`notes-drawer ${isOpen ? 'open' : ''} ${draggingDrawer ? 'drawer-dragging' : ''} ${resizingDrawer ? 'drawer-resizing' : ''}`}
        style={{
          ...(drawerPos ? { left: drawerPos.x, top: drawerPos.y, right: 'auto' } : {}),
          width: drawerSize.width,
          height: drawerSize.height,
          transformOrigin: 'center center',
          transform: isOpen
            ? `rotateY(${drawer3D.rotateY}deg) rotateX(${drawer3D.rotateX}deg)`
            : `rotateY(${drawer3D.closedRotateY}deg) rotateX(-10deg) translateX(${drawer3D.closedTranslateX}px)`,
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
            dockedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={(updates) => updateNote(note.id, updates)}
                onDelete={() => handleDeleteNote(note.id)}
                onTearOff={(e) => tearOffNote(note.id, e)}
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
            isDocked={false}
          />
        </div>
      ))}
    </>
  );
}

/**
 * Individual Note Card
 */
function NoteCard({ note, onUpdate, onDelete, onTearOff, onDock, onResizeStart, isDocked }) {
  return (
    <div
      className="note-card"
      style={{ borderTopColor: note.color }}
    >
      <div className="note-header">
        <input
          type="text"
          className="note-input"
          value={note.title}
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
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Write something..."
      />
      <div className="note-footer">
        <div className="color-picker">
          {['#fef08a', '#a5f3fc', '#f0abfc', '#86efac', '#fca5a5'].map(color => (
            <button
              key={color}
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
