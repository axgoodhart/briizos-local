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

const DEFAULT_AVATAR_SIZE_PX = 70;
const AVATAR_SIZE_MIN_PX = 48;
const AVATAR_SIZE_MAX_PX = 140;
/** Sheet cell is 330.5 x 499, so the character keeps its proportions at 0.662. */
const AVATAR_ASPECT_RATIO = 499 / 330.5;

function normalizeAvatarSizePx(value) {
  const size = Math.round(Number(value));
  if (!Number.isFinite(size)) return DEFAULT_AVATAR_SIZE_PX;
  return Math.min(AVATAR_SIZE_MAX_PX, Math.max(AVATAR_SIZE_MIN_PX, size));
}

/** How long a bubble stays up before it retires itself, by urgency. */
const BUBBLE_TTL_MS = { high: 60000, normal: 30000, low: 18000 };
/** Idle drift: pick a new resting spot in this window of time. */
const DRIFT_MIN_MS = 22000;
const DRIFT_MAX_MS = 48000;
const EDGE_MARGIN = 28;
const WINDOW_PADDING_PX = 24;
const BUBBLE_WIDTH_PX = 296;

const shell = () => (typeof window !== 'undefined' ? window.briizy?.shell : null);

function getScreenWorkArea() {
  // In the small pet window, window.innerWidth is the window size, not the
  // screen. Use screen.availWidth/availHeight (workArea minus Dock/menu bar)
  // like OpenPets does with NSScreen.visibleFrame.
  const s = typeof window !== 'undefined' ? window.screen : null;
  if (s && s.availWidth && s.availHeight) {
    const availLeft = s.availLeft ?? 0;
    const availTop = s.availTop ?? 0;
    // Some environments report availLeft/Top, others just width/height.
    return {
      x: availLeft,
      y: availTop,
      width: s.availWidth,
      height: s.availHeight,
    };
  }
  // Fallback to inner viewport (e.g., tests)
  return { x: 0, y: 0, width: typeof window !== 'undefined' ? window.innerWidth : 1280, height: typeof window !== 'undefined' ? window.innerHeight : 800 };
}

function windowSizeFor(avatarW, avatarH, hasBubble) {
  if (hasBubble) {
    return {
      width: avatarW + BUBBLE_WIDTH_PX + WINDOW_PADDING_PX * 2 + 12,
      height: Math.max(avatarH, 160) + WINDOW_PADDING_PX * 2 + 24,
    };
  }
  return {
    width: avatarW + WINDOW_PADDING_PX * 2,
    height: avatarH + WINDOW_PADDING_PX * 2,
  };
}

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
  const [avatarSizePx, setAvatarSizePx] = useState(DEFAULT_AVATAR_SIZE_PX);

  const avatarWidth = normalizeAvatarSizePx(avatarSizePx);
  const avatarHeight = Math.round(avatarWidth * AVATAR_ASPECT_RATIO);

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
      if (payload?.avatarSizePx !== undefined) {
        setAvatarSizePx(normalizeAvatarSizePx(payload.avatarSizePx));
      }
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

  /* ── Idle drift (pet-style: move the window, not the inner div) ────── */
  // The window is now sized to the avatar (+ bubble when visible), so drift
  // moves the window origin via shell.updateBounds. The avatar itself stays
  // anchored inside the window (bottom padding) and only bobs.

  const syncWindowBounds = useCallback((hasBubble, nextSide) => {
    const { width: winW, height: winH } = windowSizeFor(avatarWidth, avatarHeight, hasBubble);
    // Notify main to resize; position stays where drift put it.
    shell()?.updateBounds?.({ width: winW, height: winH });
  }, [avatarWidth, avatarHeight]);

  const drift = useCallback(() => {
    const hasBubble = !!suggestionRef.current;
    const { width: winW, height: winH } = windowSizeFor(avatarWidth, avatarHeight, hasBubble);
    const workArea = getScreenWorkArea();
    const maxX = workArea.x + workArea.width - winW - EDGE_MARGIN;
    const maxY = workArea.y + workArea.height - winH - EDGE_MARGIN;
    const minX = workArea.x + EDGE_MARGIN;
    const minY = workArea.y + EDGE_MARGIN;
    // Stay along the right two-fifths of the screen: near enough to notice,
    // far enough from where most work happens. Like OpenPets default
    // windowOrigin at maxX -40, minY +40.
    const targetX = Math.max(minX, maxX - Math.random() * (workArea.width * 0.18));
    const targetY = Math.max(minY, minY + Math.random() * Math.max(1, maxY - minY));
    const nextSide = targetX > workArea.x + workArea.width * 0.5 ? 'left' : 'right';
    setSide(nextSide);

    // Move the window itself. Use immediate set when reduced motion, otherwise
    // the main process will animate via setBounds (no GSAP transform on the
    // wrapper — that would push the avatar outside the small window).
    shell()?.updateBounds?.({ x: targetX, y: targetY, width: winW, height: winH });
  }, [avatarWidth, avatarHeight]);

  useEffect(() => {
    const node = avatarRef.current;
    if (!node) return undefined;

    // Initial window already parked bottom-right by main. Just start bob.
    let bob = null;
    if (!prefersReducedMotion()) {
      bob = gsap.to(node, {
        yPercent: -3.5,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    // Ensure window size matches current avatar (no bubble yet).
    syncWindowBounds(false, side);

    const scheduleDrift = () => {
      driftTimer.current = window.setTimeout(() => {
        if (!suggestionRef.current && !interactiveRef.current) drift();
        scheduleDrift();
      }, DRIFT_MIN_MS + Math.random() * (DRIFT_MAX_MS - DRIFT_MIN_MS));
    };
    scheduleDrift();

    const onResize = () => {
      // Screen workArea changed — re-clamp is handled in main's fitToDisplay,
      // but side may need flipping if window straddles center.
      const workArea = getScreenWorkArea();
      // Keep window on-screen by drifting if needed; main also clamps.
      if (!suggestionRef.current && !interactiveRef.current) drift();
    };
    // Screen avail size change is not a window resize in small-window mode,
    // so listen to screen orientation if available.
    window.addEventListener('resize', onResize);
    return () => {
      bob?.kill();
      gsap.killTweensOf(node);
      window.clearTimeout(driftTimer.current);
      window.removeEventListener('resize', onResize);
    };
  }, [drift, syncWindowBounds, side]);

  // Keep window sized correctly when bubble appears/dismisses or avatar resizes.
  useEffect(() => {
    const hasBubble = !!(suggestion || result);
    syncWindowBounds(hasBubble, side);
  }, [suggestion, result, avatarWidth, avatarHeight, side, syncWindowBounds]);

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
        style={{ '--briizy-w': `${avatarWidth}px`, '--briizy-h': `${avatarHeight}px` }}
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
