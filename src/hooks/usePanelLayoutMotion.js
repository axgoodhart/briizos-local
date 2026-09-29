import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import logger from '../lib/logger';

const geometryFrame = box => ({
  left: `${box.x}px`,
  top: `${box.y}px`,
  width: `${Math.max(0, box.width)}px`,
  height: `${Math.max(0, box.height)}px`,
});

function place(element, box) {
  element.style.setProperty('--panel-motion-x', `${box.x}px`);
  element.style.setProperty('--panel-motion-y', `${box.y}px`);
  element.style.setProperty('--panel-motion-width', `${Math.max(0, box.width)}px`);
  element.style.setProperty('--panel-motion-height', `${Math.max(0, box.height)}px`);
  element.dataset.layoutPositioned = 'true';
}

function relativeBox(element, origin) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
}

function columnFor(columns, panelId) {
  return columns.find(column => column.panels.some(panel => panel.panelId === panelId));
}

// A disappearing space closes against its next surviving neighbor, or the
// previous neighbor's far edge. The same calculation opens a new space in reverse.
function collapsedBox(panelId, fromColumns, toColumns, boxes, fallback) {
  const column = columnFor(fromColumns, panelId);
  if (!column) return { ...fallback, width: 0 };
  const survivingColumn = toColumns.find(candidate => candidate.id === column.id);
  if (survivingColumn) {
    const index = column.panels.findIndex(panel => panel.panelId === panelId);
    const next = column.panels.slice(index + 1).map(panel => boxes.get(panel.panelId)).find(Boolean);
    const previous = column.panels.slice(0, index).reverse().map(panel => boxes.get(panel.panelId)).find(Boolean);
    const neighbor = next || previous;
    if (neighbor) return { ...neighbor, y: next ? next.y : previous.y + previous.height, height: 0 };
    return { ...fallback, height: 0 };
  }
  const columnIndex = fromColumns.indexOf(column);
  const next = fromColumns.slice(columnIndex + 1)
    .flatMap(candidate => candidate.panels).map(panel => boxes.get(panel.panelId)).find(Boolean);
  const previous = fromColumns.slice(0, columnIndex).reverse()
    .flatMap(candidate => candidate.panels).map(panel => boxes.get(panel.panelId)).find(Boolean);
  return { ...fallback, x: next ? next.x : previous ? previous.x + previous.width : fallback.x, width: 0 };
}

function boxesMatch(first, second) {
  if (first.size !== second.size) return false;
  return [...first].every(([id, box]) => {
    const other = second.get(id);
    return other && ['x', 'y', 'width', 'height'].every(key => Math.abs(box[key] - other[key]) < 0.5);
  });
}

function milliseconds(styles, name) {
  const value = styles.getPropertyValue(name).trim();
  return Math.max(0, (parseFloat(value) || 0) * (value.endsWith('ms') ? 1 : 1000));
}

/**
 * Resize groups only own empty slots. Live panels remain siblings in a stable
 * layer, so changing column/stack topology never remounts their React content.
 * Presence outlives removal until its exit completes. A new request samples the
 * currently displayed boxes before canceling motion, avoiding a jump on reversal.
 */
export function usePanelLayoutMotion(columns, fullscreenPanelId) {
  const rootRef = useRef(null);
  const surfaceRef = useRef(null);
  const slotsRef = useRef(new Map());
  const carriersRef = useRef(new Map());
  const observerRef = useRef(null);
  const frameRef = useRef(null);
  const runRef = useRef(null);
  const previousRef = useRef(null);
  const latestRef = useRef(null);
  const startRef = useRef(null);
  const livePanels = useMemo(() => columns.flatMap(column => column.panels), [columns]);
  const presenceKey = JSON.stringify(livePanels.map(panel => panel.panelId));
  const [presence, setPresence] = useState({ key: presenceKey, panels: livePanels });

  if (presence.key !== presenceKey) {
    const ids = new Set(livePanels.map(panel => panel.panelId));
    setPresence({ key: presenceKey, panels: [
      ...livePanels, ...presence.panels.filter(panel => !ids.has(panel.panelId)),
    ] });
  }

  const liveById = new Map(livePanels.map(panel => [panel.panelId, panel]));
  const panels = presence.panels.map(panel => liveById.get(panel.panelId) || panel);

  const registerSlot = useCallback((id, element) => {
    const previous = slotsRef.current.get(id);
    if (previous) observerRef.current?.unobserve(previous);
    if (element) {
      slotsRef.current.set(id, element);
      observerRef.current?.observe(element);
    } else {
      slotsRef.current.delete(id);
    }
  }, []);

  const registerCarrier = useCallback((id, element) => {
    if (element) carriersRef.current.set(id, element);
    else carriersRef.current.delete(id);
  }, []);

  const pruneExits = useCallback(() => {
    const ids = new Set(latestRef.current.panels.map(panel => panel.panelId));
    setPresence(current => {
      const kept = current.panels.filter(panel => ids.has(panel.panelId));
      return kept.length === current.panels.length ? current : { ...current, panels: kept };
    });
  }, []);

  const measureTargets = useCallback(() => {
    const origin = rootRef.current.getBoundingClientRect();
    const targets = new Map();
    latestRef.current.panels.forEach(panel => {
      const slot = slotsRef.current.get(panel.panelId);
      if (!slot) return;
      targets.set(panel.panelId, panel.panelId === latestRef.current.fullscreenPanelId
        ? { x: 0, y: 0, width: origin.width, height: origin.height }
        : relativeBox(slot, origin));
    });
    return targets;
  }, []);

  const cancelRun = useCallback(() => {
    const run = runRef.current;
    runRef.current = null;
    if (run) {
      run.animations.forEach(animation => animation.cancel());
      run.placeholders.forEach(element => element.remove());
      run.transfers.forEach(id => {
        const element = carriersRef.current.get(id);
        if (!element) return;
        element.removeAttribute('data-layout-transfer');
        if (!element.hasAttribute('data-layout-inactive')) element.removeAttribute('inert');
      });
    }
    rootRef.current?.classList.remove('is-layout-changing');
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    rootRef.current?.classList.add('is-layout-changing');
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      startRef.current?.();
    });
  }, []);

  useLayoutEffect(() => {
    latestRef.current = { columns, panels: livePanels, fullscreenPanelId };

    startRef.current = () => {
      const root = rootRef.current;
      if (!root) return;
      const current = latestRef.current;
      const previous = previousRef.current;
      const origin = root.getBoundingClientRect();
      const targets = measureTargets();
      const sources = new Map();
      carriersRef.current.forEach((element, id) => {
        if (!element.hasAttribute('data-layout-positioned')) return;
        const styles = getComputedStyle(element);
        sources.set(id, { ...relativeBox(element, origin), opacity: styles.opacity, filter: styles.filter });
      });
      const interruptedTransfers = runRef.current?.transfers || new Set();
      cancelRun();
      previousRef.current = current;

      const settle = () => {
        measureTargets().forEach((box, id) => {
          const element = carriersRef.current.get(id);
          if (element) {
            place(element, box);
            element.removeAttribute('data-layout-exiting');
          }
        });
        cancelRun();
        pruneExits();
      };

      const styles = getComputedStyle(root);
      const duration = milliseconds(styles, '--panel-layout-duration');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const unchanged = boxesMatch(sources, targets) && [...sources.values()].every(box =>
        Number(box.opacity) === 1 && (box.filter === 'none' || box.filter === 'brightness(1)'));
      if (!previous || reduced || !duration || !origin.width || !origin.height || unchanged) {
        settle();
        return;
      }

      const transfers = new Set();
      targets.forEach((box, id) => {
        if (!sources.has(id) || fullscreenPanelId || previous.fullscreenPanelId) return;
        const before = columnFor(previous.columns, id);
        const after = columnFor(current.columns, id);
        if (interruptedTransfers.has(id) || (before && after && before.id !== after.id
          && (before.panels.length > 1 || after.panels.length > 1))) transfers.add(id);
      });

      const exitTime = transfers.size ? milliseconds(styles, '--panel-transfer-exit-duration') : 0;
      const revealTime = transfers.size ? milliseconds(styles, '--panel-transfer-enter-duration') : 0;
      const totalTime = exitTime + duration + revealTime;
      const easing = styles.getPropertyValue('--panel-layout-easing').trim();
      const enterFilter = `brightness(${styles.getPropertyValue('--panel-enter-brightness').trim()})`;
      const exitFilter = `brightness(${styles.getPropertyValue('--panel-exit-brightness').trim()})`;
      const normalFilter = 'brightness(1)';
      const focusedElement = document.activeElement;
      const run = { animations: [], placeholders: [], transfers, targets };
      runRef.current = run;
      root.classList.add('is-layout-changing');

      const animate = (element, frames, timing = {}) => {
        const animation = element.animate(frames, { duration, easing, fill: 'both', ...timing });
        run.animations.push(animation);
      };
      const placeholder = (from, to, receiving = false) => {
        const element = document.createElement('div');
        element.className = 'panel-layout-placeholder';
        element.setAttribute('aria-hidden', 'true');
        place(element, to);
        surfaceRef.current.appendChild(element);
        run.placeholders.push(element);
        animate(element, [geometryFrame(from), geometryFrame(to)], { delay: exitTime });
        if (receiving) animate(element, [{ opacity: 1 }, { opacity: 0 }], {
          delay: exitTime + duration, duration: revealTime,
        });
      };

      try {
        carriersRef.current.forEach((element, id) => {
          const from = sources.get(id);
          const to = targets.get(id);
          if (!from && !to) return;
          if (to) {
            place(element, to);
            element.removeAttribute('data-layout-exiting');
          } else {
            element.dataset.layoutExiting = 'true';
          }

          if (transfers.has(id)) {
            const closing = collapsedBox(id, previous.columns, current.columns, targets, from);
            const opening = collapsedBox(id, current.columns, previous.columns, sources, to);
            placeholder(from, closing);
            placeholder(opening, to, true);
            element.dataset.layoutTransfer = 'true';
            element.setAttribute('inert', '');
            animate(element, [
              { ...geometryFrame(from), opacity: from.opacity, filter: from.filter, offset: 0 },
              { ...geometryFrame(from), opacity: 0, filter: exitFilter, offset: exitTime / totalTime },
              { ...geometryFrame(to), opacity: 0, filter: enterFilter, offset: (exitTime + duration) / totalTime },
              { ...geometryFrame(to), opacity: 1, filter: normalFilter, offset: 1 },
            ], { duration: totalTime, easing: 'linear' });
          } else if (!to) {
            const closing = collapsedBox(id, previous.columns, current.columns, targets, from);
            animate(element, [
              { ...geometryFrame(from), opacity: from.opacity, filter: from.filter },
              { ...geometryFrame(closing), opacity: 0, filter: exitFilter },
            ], { delay: exitTime });
          } else if (!from) {
            const opening = collapsedBox(id, current.columns, previous.columns, sources,
              { ...to, x: origin.width });
            animate(element, [
              { ...geometryFrame(opening), opacity: 0, filter: enterFilter },
              { ...geometryFrame(to), opacity: 1, filter: normalFilter },
            ], { delay: exitTime });
          } else {
            const frames = [geometryFrame(from), geometryFrame(to)];
            if (Number(from.opacity) !== 1 || (from.filter !== 'none' && from.filter !== normalFilter)) {
              Object.assign(frames[0], { opacity: from.opacity, filter: from.filter });
              Object.assign(frames[1], { opacity: 1, filter: normalFilter });
            }
            animate(element, frames, { delay: exitTime });
          }
        });

        Promise.all(run.animations.map(animation => animation.finished)).then(() => {
          if (runRef.current !== run) return;
          settle();
          if (focusedElement instanceof HTMLElement && focusedElement.isConnected
            && document.activeElement === document.body && !focusedElement.closest('[inert]')) {
            focusedElement.focus({ preventScroll: true });
          }
          const entered = [...targets.keys()].filter(id => !sources.has(id));
          const exited = [...sources.keys()].filter(id => !targets.has(id));
          if (entered.length || exited.length || transfers.size) {
            logger.info('ui.layout.motion', 'Panel transition finished; content is ready in its new position', {
              entered, exited, transferred: [...transfers], durationMs: totalTime,
            });
          }
        }).catch(error => {
          if (runRef.current !== run) return;
          logger.warn('ui.layout.motion', 'Panel motion was interrupted; the requested layout has been applied', {
            reason: error?.message,
          });
          settle();
        });
      } catch (error) {
        logger.warn('ui.layout.motion', 'Panel animation could not play; the requested layout has been applied', {
          reason: error?.message,
        });
        settle();
      }
    };

    schedule();
  }, [columns, fullscreenPanelId, livePanels, cancelRun, measureTargets, pruneExits, schedule]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      if (frameRef.current !== null || !latestRef.current) return;
      const targets = measureTargets();
      if (runRef.current) {
        if (!boxesMatch(targets, runRef.current.targets)) schedule();
        return;
      }
      // Pointer resizing and window resizing track directly, without lag.
      targets.forEach((box, id) => {
        const element = carriersRef.current.get(id);
        if (element) place(element, box);
      });
    });
    observerRef.current = observer;
    observer.observe(rootRef.current);
    slotsRef.current.forEach(element => observer.observe(element));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.addEventListener('change', schedule);
    return () => {
      observer.disconnect();
      observerRef.current = null;
      reducedMotion.removeEventListener('change', schedule);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      cancelRun();
    };
  }, [cancelRun, measureTargets, schedule]);

  return { rootRef, surfaceRef, panels, registerSlot, registerCarrier };
}
