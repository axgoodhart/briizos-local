/**
 * The roaming avatar and its speech bubbles (PLAN-BRIIZY.md §9).
 *
 * Two things carry the weight here:
 *
 * 1. Hit testing. The window is click-through with `forward: true`, so mousemove
 *    still arrives. Whenever the pointer enters the avatar or an open bubble we
 *    ask main to make the window interactive, and give that back the moment it
 *    leaves. Without this the overlay would either swallow every desktop click
 *    or never receive one.
 *
 * 2. Restraint. briizy drifts slowly, only speaks when given something to say,
 *    and never grabs focus. Accept/dismiss are forwarded to the runtime — this
 *    component decides nothing (I6).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import moodSheet from './assets/briizy-moods.png';

/** Sprite-sheet cell order in briizy-moods.png (6 frames, left to right). */
const AVATAR_CELLS = {
  idle: 0,
  working: 1,
  error: 2,
  thinking: 3,
  sleeping: 4,
  speaking: 5,
};

const AVATAR_WIDTH = 116;
/** Sheet cell is 330.5 x 499, so the character keeps its proportions at 0.662. */
const AVATAR_HEIGHT = Math.round(AVATAR_WIDTH * (499 / 330.5));

/** How long a bubble stays up before it retires itself, by urgency. */
const BUBBLE_TTL_MS = { high: 60000, normal: 30000, low: 18000 };
/** Idle drift: pick a new resting spot in this window of time. */
const DRIFT_MIN_MS = 22000;
const DRIFT_MAX_MS = 48000;
const EDGE_MARGIN = 28;

const shell = () => (typeof window !== 'undefined' ? window.briizy?.shell : null);

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

export function BriizyShell() {
  const [avatar, setAvatar] = useState('idle');
  const [status, setStatus] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [result, setResult] = useState(null);
  const [focus, setFocus] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [side, setSide] = useState('left');

  const avatarRef = useRef(null);
  const bubbleRef = useRef(null);
  const interactiveRef = useRef(false);
  const driftTimer = useRef(null);
  const bubbleTimer = useRef(null);
  /** Lets the drift scheduler see the current suggestion without re-subscribing. */
  const suggestionRef = useRef(null);

  /* ── Interactivity handshake ─────────────────────────────────────── */

  const setInteractive = useCallback((next) => {
    if (interactiveRef.current === next) return;
    interactiveRef.current = next;
    shell()?.setInteractive(next);
  }, []);

  useEffect(() => {
    const pad = 8;
    const within = (rect, x, y) => (
      rect && x >= rect.left - pad && x <= rect.right + pad
      && y >= rect.top - pad && y <= rect.bottom + pad
    );

    const onMove = (event) => {
      const overAvatar = within(avatarRef.current?.getBoundingClientRect(), event.clientX, event.clientY);
      const overBubble = within(bubbleRef.current?.getBoundingClientRect(), event.clientX, event.clientY);
      const over = overAvatar || overBubble;
      setHovered(overAvatar);
      setInteractive(over);
    };

    // A pointer that leaves the window entirely must release interactivity, or a
    // fast exit can leave the overlay swallowing clicks.
    const onLeave = () => {
      setHovered(false);
      setInteractive(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [setInteractive]);

  /* ── Main-process wiring ─────────────────────────────────────────── */

  useEffect(() => {
    const bridge = shell();
    if (!bridge) return undefined;

    const offState = bridge.onState((payload) => {
      if (payload?.avatar) setAvatar(payload.avatar);
      if (payload?.status) setStatus(payload.status);
    });
    const offSuggestion = bridge.onSuggestion((payload) => {
      setSuggestion(payload);
      setResult(null);
    });
    const offDismiss = bridge.onDismissSuggestion((payload) => {
      setSuggestion((current) => (!payload?.id || current?.id === payload.id ? null : current));
    });
    const offFocus = bridge.onFocus?.((payload) => setFocus(payload?.state ? payload : null));
    const offResult = bridge.onActionResult((payload) => {
      setResult(payload);
      // Let the outcome read for a beat, then clear the bubble.
      window.setTimeout(() => {
        setResult(null);
        setSuggestion(null);
      }, 2600);
    });

    bridge.ready();
    return () => {
      offState?.();
      offSuggestion?.();
      offDismiss?.();
      offFocus?.();
      offResult?.();
    };
  }, []);

  /* ── Bubble lifetime ────────────────────────────────────────────── */

  useEffect(() => {
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    if (!suggestion || result) return undefined;
    const ttl = BUBBLE_TTL_MS[suggestion.urgency] ?? BUBBLE_TTL_MS.normal;
    bubbleTimer.current = window.setTimeout(() => setSuggestion(null), ttl);
    return () => window.clearTimeout(bubbleTimer.current);
  }, [suggestion, result]);

  /* ── Idle drift ──────────────────────────────────────────────────── */

  const drift = useCallback(() => {
    const node = avatarRef.current;
    if (!node) return;
    const maxX = window.innerWidth - AVATAR_WIDTH - EDGE_MARGIN;
    const maxY = window.innerHeight - AVATAR_HEIGHT - EDGE_MARGIN;
    // Stay along the right two-fifths of the screen: near enough to notice,
    // far enough from where most work happens.
    const targetX = Math.max(EDGE_MARGIN, maxX - Math.random() * (window.innerWidth * 0.18));
    const targetY = Math.max(EDGE_MARGIN, EDGE_MARGIN + Math.random() * Math.max(1, maxY - EDGE_MARGIN));
    // Bubbles flip to whichever side has room.
    setSide(targetX > window.innerWidth * 0.5 ? 'left' : 'right');

    if (prefersReducedMotion()) {
      gsap.set(node, { x: targetX, y: targetY });
    } else {
      gsap.to(node, { x: targetX, y: targetY, duration: 4.5, ease: 'sine.inOut' });
    }
  }, []);

  useEffect(() => {
    const node = avatarRef.current;
    if (!node) return undefined;

    // Start parked bottom-right, then drift from there.
    gsap.set(node, {
      x: window.innerWidth - AVATAR_WIDTH - EDGE_MARGIN * 2,
      y: window.innerHeight - AVATAR_HEIGHT - EDGE_MARGIN * 2,
    });

    let bob = null;
    if (!prefersReducedMotion()) {
      // A slow hover bob, so a propeller-driven robot does not look frozen.
      bob = gsap.to(node, {
        yPercent: -3.5,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    const scheduleDrift = () => {
      driftTimer.current = window.setTimeout(() => {
        // Never move while a bubble is open or the pointer is on it — moving out
        // from under the cursor is the most annoying thing an overlay can do.
        if (!suggestionRef.current && !interactiveRef.current) drift();
        scheduleDrift();
      }, DRIFT_MIN_MS + Math.random() * (DRIFT_MAX_MS - DRIFT_MIN_MS));
    };
    scheduleDrift();

    const onResize = () => drift();
    window.addEventListener('resize', onResize);

    return () => {
      bob?.kill();
      gsap.killTweensOf(node);
      window.clearTimeout(driftTimer.current);
      window.removeEventListener('resize', onResize);
    };
  }, [drift]);

  useEffect(() => { suggestionRef.current = suggestion; }, [suggestion]);

  /* ── Actions ─────────────────────────────────────────────────────── */

  const decide = async (verdict) => {
    if (!suggestion) return;
    setAvatar('thinking');
    await shell()?.decide({ id: suggestion.id, verdict, kind: suggestion.kind });
  };

  const openInApp = () => {
    shell()?.openInApp({
      route: suggestion?.route || 'notefalls',
      sessionId: suggestion?.sessionId,
      frameId: suggestion?.frameId,
    });
    setSuggestion(null);
  };

  const effectiveAvatar = useMemo(() => {
    if (result) return result.result?.ok ? 'working' : 'error';
    if (suggestion) return 'speaking';
    return avatar;
  }, [avatar, suggestion, result]);

  const cell = AVATAR_CELLS[effectiveAvatar] ?? AVATAR_CELLS.idle;
  const statusLine = status ? describeStatus(status) : '';

  return (
    <div className="briizy-stage">
      {/* Ambient focus feedback: a coloured screen edge, no popup, no sound, and
          nothing to dismiss. Rendered in the existing overlay rather than a
          second transparent window — this one already covers the display and is
          already click-through. */}
      {focus && (
        <div
          className={`briizy-glow is-${focus.state}`}
          title={focus.note || `${focus.state} — ${focus.goal || ''}`}
        />
      )}

      <div
        className={`briizy-avatar-wrap briizy-avatar-wrap--${side}`}
        ref={avatarRef}
        style={{ '--briizy-w': `${AVATAR_WIDTH}px`, '--briizy-h': `${AVATAR_HEIGHT}px` }}
      >
        {(suggestion || result) && (
          <div
            className={`briizy-bubble briizy-bubble--${side}${result ? ' is-result' : ''}`}
            ref={bubbleRef}
          >
            {result ? (
              <p className="briizy-bubble__result">
                {result.result?.ok
                  ? (result.decision?.verdict === 'accept' ? 'Added to your tasks — nothing started.' : 'Dismissed.')
                  : `Couldn't do that: ${result.result?.reason || 'unknown reason'}`}
              </p>
            ) : (
              <>
                {suggestion.title && <p className="briizy-bubble__title">{suggestion.title}</p>}
                <p className="briizy-bubble__body">{suggestion.summary || suggestion.body}</p>
                {suggestion.rationale && (
                  <p className="briizy-bubble__why">{suggestion.rationale}</p>
                )}
                <div className="briizy-bubble__actions">
                  <button
                    type="button"
                    className="briizy-btn briizy-btn--accept"
                    onClick={() => decide('accept')}
                    title="Add this as a pending task — nothing runs on its own"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="briizy-btn briizy-btn--dismiss"
                    onClick={() => decide('dismiss')}
                    title="Dismiss"
                  >
                    ✗
                  </button>
                  <button type="button" className="briizy-btn briizy-btn--open" onClick={openInApp}>
                    open in briizOS
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {hovered && !suggestion && statusLine && (
          <div className={`briizy-tip briizy-tip--${side}`}>{statusLine}</div>
        )}

        <button
          type="button"
          className={`briizy-avatar is-${effectiveAvatar}${hovered ? ' is-hovered' : ''}`}
          style={{
            backgroundImage: `url(${moodSheet})`,
            backgroundPositionX: `${cell * -100}%`,
          }}
          onClick={() => shell()?.openInApp({ route: 'notefalls' })}
          onContextMenu={(event) => {
            event.preventDefault();
            shell()?.hide();
          }}
          aria-label={`briizy — ${effectiveAvatar}. Click to open briizOS, right-click to hide.`}
        />
      </div>
    </div>
  );
}

/** One short line for the hover tip — what briizy is doing right now. */
function describeStatus(status) {
  switch (status.state) {
    case 'capturingWindow': return `watching ${status.current?.appName || 'the active window'}`;
    case 'capturingDisplay': return 'recording this display';
    case 'paused': return status.enabled ? 'paused' : 'off';
    case 'permissionRequired': return 'needs Screen Recording permission';
    case 'unavailable': return 'capture helper unavailable';
    case 'error': return status.lastError || 'something went wrong';
    default: return 'idle';
  }
}

export default BriizyShell;
