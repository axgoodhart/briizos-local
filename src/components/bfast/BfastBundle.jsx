/**
 * BfastBundle — the single mount point for the three fast-feedback
 * UI elements: Toast, Snackbar, and Margerin.
 *
 * Subscribes to bfast-queue via useSyncExternalStore and renders:
 *   - at most ONE Margerin (head-of-queue) at the "hold" slot
 *   - all queued Toasts (stacked, vertical)
 *   - all queued Snackbars (stacked, vertical)
 *
 * Rationale: margerins gate the caller's Promise, so only one should
 * be presentable at a time to avoid ambiguous user intent. Toasts and
 * snackbars are non-gating and can pile up; the queue handles their
 * lifetimes.
 *
 * This file owns NO state of its own; it is pure view over
 * bfast-queue.
 */

import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getState,
  selectCurrentMargerin,
  selectToasts,
  selectSnackbars,
} from '../../lib/bfast-queue';
import Margerin from './Margerin';
import Toast from './Toast';
import Snackbar from './Snackbar';

import '../../AppCombined.css';

function BfastBundle() {
  const state = useSyncExternalStore(subscribe, getState, getState);

  const margerin = selectCurrentMargerin(state);
  const toasts = selectToasts(state);
  const snackbars = selectSnackbars(state);

  return (
    <div className="bfast-bundle" aria-live="polite">
      <div className="bfast-bundle-snackbars">
        {snackbars.map((s) => (
          <Snackbar key={s.id} action={s} />
        ))}
      </div>
      <div className="bfast-bundle-toasts">
        {toasts.map((t) => (
          <Toast key={t.id} action={t} />
        ))}
      </div>
      <div className="bfast-bundle-margerin-slot">
        {margerin && <Margerin key={margerin.id} action={margerin} />}
      </div>
    </div>
  );
}

export default BfastBundle;
