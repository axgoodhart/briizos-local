import { useLayoutEffect, useRef } from 'react';
import '../../AppCombined.css'; // legacy board styles — scoped under .forest-shell, see hardening notes
import logger from '../../lib/logger';
// Legacy markup, injected verbatim so app.js finds the (now forest-prefixed)
// element IDs it expects.
import canvasMarkup from './canvas-markup.html?raw';
import { mountForest } from './app.js';

// A layout move can unmount and remount a panel in the same React commit.
// Retain its DOM until that commit finishes, without keeping closed boards alive.
const mountedBoards = new Map();

/**
 * Keep the board's DOM and transient state through layout relocation. Actual
 * close/reopen creates an isolated runtime and restores the saved board.
 */
export default function Forest({ instanceId = 'forest' }) {
  const hostRef = useRef(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let board = mountedBoards.get(instanceId);
    if (!board) {
      const element = document.createElement('div');
      element.className = 'forest-runtime';
      element.innerHTML = canvasMarkup;
      host.appendChild(element);
      board = { element, destroy: mountForest(element), lease: null };
      mountedBoards.set(instanceId, board);
    } else {
      host.appendChild(board.element);
      logger.debug('forest', 'Forest board preserved through layout change', { instanceId });
    }
    const lease = {};
    board.lease = lease;

    return () => {
      queueMicrotask(() => {
        if (board.lease !== lease) return;
        mountedBoards.delete(instanceId);
        board.destroy();
        board.element.remove();
        logger.debug('forest', 'Forest board released after panel closed', { instanceId });
      });
    };
  }, [instanceId]);

  return (
    <div className="panel forest-panel">
      <div className="panel-header">
        <span className="panel-header-title">Forest</span>
      </div>
      <div className="panel-content">
        <div className="forest-host" ref={hostRef} />
      </div>
    </div>
  );
}
