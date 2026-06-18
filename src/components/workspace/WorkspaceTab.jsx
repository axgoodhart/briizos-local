import { useLayoutEffect, useRef, useState } from 'react';

const TAB_HEIGHT = 32;
const FLARE = 8;
const RADIUS = 20;
const PAD_X = 14;
const FLARE_TANGENT = 4;

function buildPath(width) {
  return [
    `M 0 ${TAB_HEIGHT}`,
    `C 5 ${TAB_HEIGHT} ${FLARE} ${TAB_HEIGHT - FLARE_TANGENT} ${FLARE} ${TAB_HEIGHT - FLARE}`,
    `L ${FLARE} ${RADIUS}`,
    `Q ${FLARE} 0 ${FLARE + RADIUS} 0`,
    `L ${width - FLARE - RADIUS} 0`,
    `Q ${width - FLARE} 0 ${width - FLARE} ${RADIUS}`,
    `L ${width - FLARE} ${TAB_HEIGHT - FLARE}`,
    `C ${width - FLARE} ${TAB_HEIGHT - FLARE_TANGENT} ${width - 5} ${TAB_HEIGHT} ${width} ${TAB_HEIGHT}`,
  ].join(' ');
}

export default function WorkspaceTab({ label, glyph, active, onSelect }) {
  const contentRef = useRef(null);
  const [width, setWidth] = useState(120);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.ceil(el.scrollWidth + PAD_X * 2 + FLARE * 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label, glyph]);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`workspace-tab${active ? ' is-active' : ''}`}
      style={{ width: `${width}px` }}
      onClick={onSelect}
      title={label}
    >
      <svg
        className="workspace-tab__shape"
        width={width}
        height={TAB_HEIGHT}
        viewBox={`0 0 ${width} ${TAB_HEIGHT}`}
        aria-hidden="true"
      >
        <path d={buildPath(width)} />
      </svg>
      <span className="workspace-tab__content" ref={contentRef}>
        <span className="workspace-tab__glyph">{glyph}</span>
        <span className="workspace-tab__label">{label}</span>
      </span>
    </button>
  );
}
