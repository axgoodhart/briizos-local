// Pointer tracking for drags, resizes and marquees on the desk.
import { lockDragSelection } from '../../lib/dragSelection';

export function trackPointer(event, { onMove, onEnd, threshold = 0 }) {
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startY = event.clientY;
  let moved = threshold === 0;
  const release = lockDragSelection();
  const move = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < threshold) return;
    moved = true;
    onMove?.(dx, dy, e);
  };
  const finish = (e, cancelled = false) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('blur', cancel);
    release();
    onEnd?.(e ? e.clientX - startX : 0, e ? e.clientY - startY : 0, e, cancelled || !moved);
  };
  const up = (e) => finish(e);
  const cancel = () => finish(null, true);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('blur', cancel);
}

// True when an element under the pointer can still scroll in the wheel's direction.
export function canScrollWithin(target, boundary, dx, dy) {
  let el = target;
  while (el && el !== boundary) {
    const style = el.nodeType === 1 ? getComputedStyle(el) : null;
    if (style) {
      const scrollY = /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
      const scrollX = /(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
      if (scrollY && dy !== 0) {
        if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
      }
      if (scrollX && dx !== 0) {
        if ((dx < 0 && el.scrollLeft > 0) || (dx > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

export function pickFiles({ multiple = true, accept = '' } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.addEventListener('change', () => {
      const paths = Array.from(input.files || []).map((file) => window.api.mediaGetFilePath(file)).filter(Boolean);
      resolve(paths);
    }, { once: true });
    input.click();
  });
}
