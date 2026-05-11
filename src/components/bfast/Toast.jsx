/**
 * Toast — post-hoc, fire-and-forget receipt.
 *
 * Visual: soft gradient pill, no buttons. Appears briefly after an
 * action has already been committed to confirm success (or failure).
 * Auto-dismisses; the user cannot interact with it beyond hovering
 * (which pauses the timer — handled by BfastBundle, not here).
 *
 * Tone variants:
 *   - 'success' (default) — soft purple gradient
 *   - 'info'              — neutral slate
 *   - 'error'             — muted red
 *
 * The Toast is stateless. All lifecycle (enqueue, auto-dismiss,
 * removal) is owned by bfast-queue.
 */

import { dismiss } from '../../lib/bfast-queue';

function Toast({ action }) {
  const { id, message, tone = 'info' } = action;

  const handleClick = () => {
    // Tapping a toast dismisses it early — this is a no-op convenience
    // gesture, not a confirmation.
    dismiss(id);
  };

  return (
    <div
      className={`bfast-toast bfast-toast--${tone}`}
      role="status"
      aria-live="polite"
      onClick={handleClick}
    >
      <span className="bfast-toast-message">{message}</span>
    </div>
  );
}

export default Toast;
