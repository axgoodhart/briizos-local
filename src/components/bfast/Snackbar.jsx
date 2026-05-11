/**
 * Snackbar — post-hoc receipt with one optional action.
 *
 * Visual: yellow-stroke pill with a pulsing blue bead and underlined
 * message. Used for "something just happened and you might want to
 * undo/open/view it" moments. Auto-dismisses after durationMs
 * (default 5000), but the action button stays tappable until then.
 *
 * Unlike a Margerin, the primary effect has ALREADY happened by the
 * time a Snackbar shows. The action, if present, is a compensatory
 * follow-up ("Undo", "Open", "View", etc).
 *
 * The Snackbar is stateless. All lifecycle (enqueue, auto-dismiss,
 * removal) is owned by bfast-queue.
 */

import { dismiss } from '../../lib/bfast-queue';

function Snackbar({ action }) {
  const { id, message, action: innerAction } = action;

  const handleActionClick = (e) => {
    e.stopPropagation();
    try {
      if (innerAction && typeof innerAction.onPress === 'function') {
        innerAction.onPress();
      }
    } finally {
      dismiss(id);
    }
  };

  const handleRootClick = () => {
    // Tapping the body dismisses early without invoking the action.
    dismiss(id);
  };

  return (
    <div
      className="bfast-snackbar"
      role="status"
      aria-live="polite"
      onClick={handleRootClick}
    >
      <span className="bfast-snackbar-bead" aria-hidden="true" />
      <span className="bfast-snackbar-message">{message}</span>
      {innerAction && (
        <button
          type="button"
          className="bfast-snackbar-action"
          onClick={handleActionClick}
          aria-label={innerAction.label}
        >
          {innerAction.label}
        </button>
      )}
    </div>
  );
}

export default Snackbar;
