function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function smoothWindow(t, center = 0.5, width = 0.25) {
  return smoothstep((t - (center - width)) / (2 * width));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function computeFloatingShellChrome(shellRect) {
  if (typeof window === 'undefined') {
    return {
      rotateY: 0,
      rotateX: 0,
      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.35)',
      borderRadius: '28px',
      borderTop: '1px solid rgba(155, 220, 200, 0.24)',
      borderBottom: '1px solid rgba(155, 220, 200, 0.24)',
      borderLeft: '1px solid rgba(155, 220, 200, 0.24)',
      borderRight: '1px solid rgba(155, 220, 200, 0.24)',
      closedRotateY: 0,
      closedTranslateX: 0,
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const cx = (shellRect.x + shellRect.width / 2) / vw;
  const cy = (shellRect.y + shellRect.height / 2) / vh;

  const rotateY = -30 * (cx * 2 - 1);
  const rotateX = 10 * (cy * 2 - 1);

  const shadowX = Math.round(12 * (cx * 2 - 1));
  const shadowY = Math.round(8 * (cy * 2 - 1));
  const boxShadow = `inset ${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.6)`;

  const leftBias = 1 - cx;
  const rightBias = cx;
  const topBias = 1 - cy;
  const bottomBias = cy;

  const tx = smoothWindow(cx, 0.5, 0.25);
  const ty = smoothWindow(cy, 0.5, 0.25);

  const tlMix = clamp01(tx * leftBias + ty * topBias);
  const trMix = clamp01(tx * rightBias + ty * topBias);
  const brMix = clamp01(tx * rightBias + ty * bottomBias);
  const blMix = clamp01(tx * leftBias + ty * bottomBias);

  const outerR = 80;
  const innerR = 24;
  const borderRadius = [
    lerp(innerR, outerR, tlMix),
    lerp(innerR, outerR, trMix),
    lerp(innerR, outerR, brMix),
    lerp(innerR, outerR, blMix),
  ].map((r) => `${Math.round(r)}px`).join(' ');

  const brightA = 0.45;
  const dimA = 0.12;
  const borderAlphaTop = lerp(dimA, brightA, clamp01(topBias * ty));
  const borderAlphaBottom = lerp(dimA, brightA, clamp01(bottomBias * ty));
  const borderAlphaLeft = lerp(dimA, brightA, clamp01(leftBias * tx));
  const borderAlphaRight = lerp(dimA, brightA, clamp01(rightBias * tx));

  const borderTop = `2px solid rgba(155,220,200,${borderAlphaTop.toFixed(3)})`;
  const borderBottom = `5px solid rgba(155,220,200,${borderAlphaBottom.toFixed(3)})`;
  const borderLeft = `2px solid rgba(155,220,200,${borderAlphaLeft.toFixed(3)})`;
  const borderRight = `2px solid rgba(155,220,200,${borderAlphaRight.toFixed(3)})`;

  const closedRotateY = cx > 0.5 ? 90 : -90;
  const closedTranslateX = cx > 0.5 ? 20 : -20;

  return {
    rotateY,
    rotateX,
    boxShadow,
    borderRadius,
    borderTop,
    borderBottom,
    borderLeft,
    borderRight,
    closedRotateY,
    closedTranslateX,
  };
}
