import { useState, useEffect, useRef } from 'react';
import './BriiztormOverlay.css';

/**
 * BriiztormOverlay - Full-screen 3D project visualization
 *
 * States:
 * - closed: Not visible
 * - opening: Sliding down, blur clearing
 * - open: Fully visible and interactive
 * - sleeping: Window lost focus, blur + hue-rotate animation
 * - closing: Blurring out before slide up
 */
function BriiztormOverlay({ isOpen, onClose }) {
  const [state, setState] = useState('closed');
  const iframeRef = useRef(null);

  // Handle open/close transitions
  useEffect(() => {
    if (isOpen && state === 'closed') {
      setState('opening');
      // After slide animation, set to open
      const timer = setTimeout(() => setState('open'), 400);
      return () => clearTimeout(timer);
    } else if (!isOpen && (state === 'open' || state === 'sleeping')) {
      handleClose();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageMessage = async (event) => {
      if (event.source !== iframeRef.current?.contentWindow || event.origin !== window.location.origin) return;
      const message = event.data;
      if (message?.type === 'briiztorm:state:load') {
        try {
          const state = await window.api.localData.briiztorm.get();
          event.source.postMessage({ type: 'briiztorm:state:loaded', requestId: message.requestId, state }, event.origin);
        } catch (error) {
          event.source.postMessage({ type: 'briiztorm:state:error', requestId: message.requestId, message: error.message }, event.origin);
        }
      }
      if (message?.type === 'briiztorm:state:set') {
        window.api.localData.briiztorm.set(message.key, message.value).catch(() => {});
      }
    };
    window.addEventListener('message', handleStorageMessage);
    return () => window.removeEventListener('message', handleStorageMessage);
  }, []);


  const handleClose = () => {
    setState('closing');
    // Wait for blur animation before closing
    setTimeout(() => {
      setState('closed');
      onClose?.();
    }, 350);
  };

  // Don't render if fully closed
  if (state === 'closed' && !isOpen) {
    return null;
  }

  const overlayClass = `briiztorm-overlay ${state}`;

  return (
    <div className={overlayClass}>
      <div className="briiztorm-header">
        <span className="briiztorm-title">briiZtorm</span>
        <div className="briiztorm-controls">
          <button
            className="briiztorm-btn minimize"
            onClick={handleClose}
            title="Minimize"
          >
            —
          </button>
        </div>
      </div>
      <div className="briiztorm-content">
        <iframe
          ref={iframeRef}
          src="/apps/briiztorm/briiztorm2.html"
          className="briiztorm-frame"
          title="briiZtorm 3D Project View"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </div>
  );
}

export default BriiztormOverlay;
