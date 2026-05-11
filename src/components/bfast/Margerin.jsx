/**
 * Margerin — the pre-hoc intent-hold pill.
 *
 * One instance of this renders at a time (BfastBundle only passes in
 * the current head-of-queue margerin). The component is stateless
 * aside from hover tracking; all authoritative state lives in
 * bfast-queue.
 *
 * Interaction surface:
 *   - Click anywhere on the pill          → commit currently-selected icon
 *   - Click directly on one of the three
 *     icons (primary inside the pill or
 *     either secondary icon beneath)      → commit THAT icon
 *   - Scroll wheel while pointer is
 *     over the pill                       → rotate selected icon
 *
 * Visual rules:
 *   - The currently-selected icon renders inside the pill on the right.
 *   - The two unselected icons render beneath the pill as secondary
 *     affordances at reduced opacity.
 *   - The pill label is the action preview (e.g. "Add event 'Lunch'
 *     on Apr 10").
 */

import { useCallback, useRef } from 'react';
import {
  rotateSelectedIcon,
  setSelectedIcon,
  commitMargerin,
} from '../../lib/bfast-queue';

const ICON_ORDER = ['check', 'x', 'chat'];

const ICON_GLYPH = {
  check: '\u2713',  // ✓
  x:     '\u2715',  // ✕
  chat:  '\u{1F4AC}', // 💬
};

const ICON_TITLE = {
  check: 'Approve and run',
  x:     'Cancel',
  chat:  'Return to chat for refinement',
};

function Margerin({ action }) {
  const { id, label, selectedIcon } = action;
  const wheelAccumRef = useRef(0);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Accumulate deltaY so a single gentle flick (small delta) still
      // rotates exactly one step, and big scrolls don't over-rotate.
      wheelAccumRef.current += e.deltaY;
      const threshold = 20;
      if (Math.abs(wheelAccumRef.current) >= threshold) {
        const direction = wheelAccumRef.current > 0 ? 1 : -1;
        rotateSelectedIcon(id, direction);
        wheelAccumRef.current = 0;
      }
    },
    [id],
  );

  const handlePillClick = useCallback(() => {
    commitMargerin(id);
  }, [id]);

  const handleIconClick = useCallback(
    (e, icon) => {
      e.stopPropagation();
      setSelectedIcon(id, icon);
      commitMargerin(id, icon);
    },
    [id],
  );

  const secondaryIcons = ICON_ORDER.filter((i) => i !== selectedIcon);

  return (
    <div className="bfast-margerin-root">
      <button
        type="button"
        className={`bfast-margerin-pill bfast-margerin-pill--${selectedIcon}`}
        onClick={handlePillClick}
        onWheel={handleWheel}
        aria-label={`${label}. ${ICON_TITLE[selectedIcon]}. Scroll to change action.`}
      >
        <span className="bfast-margerin-label">{label}</span>
        <span
          className={`bfast-margerin-icon bfast-margerin-icon--primary bfast-margerin-icon--${selectedIcon}`}
          aria-hidden="true"
        >
          {ICON_GLYPH[selectedIcon]}
        </span>
      </button>
      <div className="bfast-margerin-secondary-row" aria-hidden="false">
        {secondaryIcons.map((icon) => (
          <button
            type="button"
            key={icon}
            className={`bfast-margerin-icon bfast-margerin-icon--secondary bfast-margerin-icon--${icon}`}
            onClick={(e) => handleIconClick(e, icon)}
            title={ICON_TITLE[icon]}
            aria-label={ICON_TITLE[icon]}
          >
            {ICON_GLYPH[icon]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Margerin;
