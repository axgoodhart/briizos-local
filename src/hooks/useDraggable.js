import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDraggable - Reusable hook for drag + resize behavior.
 *
 * @param {Object} options
 * @param {(id: string, pos: {x: number, y: number}) => void} options.onDragEnd
 * @param {(id: string, size: {width: number, height: number}) => void} options.onResizeEnd
 */
export default function useDraggable({ onDragEnd, onResizeEnd } = {}) {
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);

  // Live position/size stored in refs to avoid re-rendering everything
  const dragRef = useRef(null);   // { id, offsetX, offsetY, x, y }
  const resizeRef = useRef(null); // { id, startMouseX, startMouseY, startWidth, startHeight, width, height }

  // Force-update counter so the dragged/resized element can re-render
  const [, setTick] = useState(0);

  const handleDragStart = useCallback((id, e, { x, y }) => {
    dragRef.current = {
      id,
      offsetX: e.clientX - x,
      offsetY: e.clientY - y,
      x,
      y,
    };
    setDraggingId(id);
  }, []);

  const handleResizeStart = useCallback((id, e, { width, height }) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: width,
      startHeight: height,
      width,
      height,
    };
    setResizingId(id);
  }, []);

  const getPosition = useCallback((id) => {
    if (dragRef.current && dragRef.current.id === id) {
      return { x: dragRef.current.x, y: dragRef.current.y };
    }
    return null;
  }, []);

  const getSize = useCallback((id) => {
    if (resizeRef.current && resizeRef.current.id === id) {
      return { width: resizeRef.current.width, height: resizeRef.current.height };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!draggingId && !resizingId) return;

    const onMouseMove = (e) => {
      if (dragRef.current) {
        dragRef.current.x = e.clientX - dragRef.current.offsetX;
        dragRef.current.y = e.clientY - dragRef.current.offsetY;
        setTick((t) => t + 1);
      }

      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startMouseX;
        const dy = e.clientY - resizeRef.current.startMouseY;
        resizeRef.current.width = Math.max(180, resizeRef.current.startWidth + dx);
        resizeRef.current.height = Math.max(120, resizeRef.current.startHeight + dy);
        setTick((t) => t + 1);
      }
    };

    const onMouseUp = () => {
      if (dragRef.current) {
        const { id, x, y } = dragRef.current;
        dragRef.current = null;
        setDraggingId(null);
        onDragEnd?.(id, { x, y });
      }

      if (resizeRef.current) {
        const { id, width, height } = resizeRef.current;
        resizeRef.current = null;
        setResizingId(null);
        onResizeEnd?.(id, { width, height });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingId, resizingId, onDragEnd, onResizeEnd]);

  return {
    draggingId,
    resizingId,
    handleDragStart,
    handleResizeStart,
    getPosition,
    getSize,
  };
}
