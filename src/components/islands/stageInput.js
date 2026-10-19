// Wheel and space-bar handling shared by the desk and the Canvas view: pinch or ⌘-wheel zooms,
// plain wheel pans unless something under the pointer can scroll, space held = hand.
import { useEffect, useState } from 'react';
import { panBy, zoomAt } from './camera';
import { canScrollWithin } from './gestures';

// ==== STAGE INPUT ====
const WHEEL_ZOOM = 0.0022;

const typing = () => /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;

export function useStageInput(stageRef) {
  const [spaceDown, setSpaceDown] = useState(false);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * WHEEL_ZOOM * (event.ctrlKey ? 4 : 1)));
        return;
      }
      if (canScrollWithin(event.target, stage, event.deltaX, event.deltaY)) return;
      event.preventDefault();
      panBy(-event.deltaX, -event.deltaY);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    const down = (e) => { if (e.code === 'Space' && !typing() && stage.matches(':hover')) { e.preventDefault(); setSpaceDown(true); } };
    const up = (e) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [stageRef]);
  return spaceDown;
}
