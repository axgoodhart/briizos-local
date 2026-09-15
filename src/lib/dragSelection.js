import { useLayoutEffect } from 'react';

const leases = new Set();

/** One selection lock for native drags, custom drags, and resize gestures. */
export function lockDragSelection() {
  const lease = {};
  leases.add(lease);
  document.documentElement.classList.add('app-drag-selection-lock');
  window.getSelection()?.removeAllRanges();
  const release = () => {
    leases.delete(lease);
    if (!leases.size) document.documentElement.classList.remove('app-drag-selection-lock');
    for (const name of ['mouseup', 'pointerup', 'pointercancel', 'dragend', 'drop', 'blur']) {
      window.removeEventListener(name, release, true);
    }
  };
  for (const name of ['mouseup', 'pointerup', 'pointercancel', 'dragend', 'drop', 'blur']) {
    window.addEventListener(name, release, true);
  }
  return release;
}

export function useDragSelectionLock(active) {
  useLayoutEffect(() => active ? lockDragSelection() : undefined, [active]);
}

export function useNativeDragSelectionLock() {
  useLayoutEffect(() => {
    let release;
    const begin = () => { release?.(); release = lockDragSelection(); };
    const resize = event => { if (event.button === 0 && event.target.closest('.resize-handle')) begin(); };
    document.addEventListener('pointerdown', resize, true);
    document.addEventListener('dragstart', begin, true);
    return () => { release?.(); document.removeEventListener('dragstart', begin, true); document.removeEventListener('pointerdown', resize, true); };
  }, []);
}
