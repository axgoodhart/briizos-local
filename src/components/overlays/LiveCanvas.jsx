import { useState, useRef, useEffect, useCallback } from 'react';
import logger from '../../lib/logger';
import './LiveCanvas.css';

function LiveCanvas({ isOpen, onClose, canvasData, title }) {
  const [position, setPosition] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const iframeRef = useRef(null);

  const srcdoc = canvasData ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>html,body{margin:0;padding:0;width:100%;height:100%}${canvasData.css || ''}</style>
</head>
<body>
  ${canvasData.html || ''}
  <script>${canvasData.js || ''}<\/script>
</body>
</html>` : '';

  // Diagnostic logging
  if (isOpen && canvasData) {
    logger.debug('canvas', 'LiveCanvas rendering with data', {
      htmlLen: canvasData.html?.length || 0,
      cssLen: canvasData.css?.length || 0,
      jsLen: canvasData.js?.length || 0,
      srcdocLen: srcdoc.length,
    });
  }

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.canvas-close-btn')) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (iframeRef.current && canvasData) {
      iframeRef.current.srcdoc = srcdoc;
    }
  }, [canvasData, srcdoc]);

  if (!isOpen || !canvasData) return null;

  return (
    <div className="canvas-backdrop">
      <div
        className="canvas-modal"
        style={{ left: position.x, top: position.y }}
      >
        <div className="canvas-header" onMouseDown={handleMouseDown}>
          <span className="canvas-title">{title || 'Canvas'}</span>
          <button className="canvas-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="canvas-body">
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            className="canvas-iframe"
            title="Live Canvas"
          />
        </div>
      </div>
    </div>
  );
}

export default LiveCanvas;
