import { useInterfacePreferences } from '../../lib/interfacePreferences';
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { EDITABLE_DOCK_ITEMS, DockGlyph } from '../controlbar/ControlBar';
import ShellModeSwitch from './ShellModeSwitch';

/** Dock item id → float app type (grid panel type). */
export const DOCK_FLOAT_APP_BY_ITEM = Object.freeze({
  chat: 'interaction',
  journal: 'journal',
  island: 'island',
  notefalls: 'notefalls',
  sources: 'sources',
  tasks: 'tasks',
});

const FLOAT_APP_TO_DOCK_ITEM = Object.fromEntries(
  Object.entries(DOCK_FLOAT_APP_BY_ITEM).map(([itemId, app]) => [app, itemId]),
);

const SETTINGS_ITEM = Object.freeze({ id: 'settings', label: 'System', glyph: '􀣋', accent: '#9fb6c9' });

function DockClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return <span className="fdock-clock" aria-label="Current time">{time}</span>;
}

/**
 * FloatDock — the bottom-center capsule of the windowed shell: app launcher,
 * minimized-window chips, clock, and the chameleon mode switch. Launch
 * semantics live in the App-level handler so grid pop-out, overlay toggles,
 * and float windows all route through one place.
 */
export function FloatDock({
  floats,
  shellMode,
  onShellModeChange,
  activeById = {},
  onLaunchItem,
  canvasesPopoverSlot = null,
}) {
  const canvasesBtnRef = useRef(null);
  const [preferences] = useInterfacePreferences();

  const renderedCanvasesPopover = isValidElement(canvasesPopoverSlot)
    ? cloneElement(canvasesPopoverSlot, { anchorRef: canvasesBtnRef })
    : canvasesPopoverSlot;

  const items = [...EDITABLE_DOCK_ITEMS, SETTINGS_ITEM];

  return (
    <div className={`fdock-host fdock-host--${preferences.dockEdge}${preferences.dockAutoHide ? ' is-auto-hide' : ''}`} data-dock-colors={preferences.dockColors} data-popover-open={!!canvasesPopoverSlot?.props?.isOpen}>
      {floats.minimizedWindows.length > 0 && (
        <div className="fdock-minirow" aria-label="Minimized windows">
          {floats.minimizedWindows.map((win) => {
            const item = EDITABLE_DOCK_ITEMS.find((entry) => entry.id === FLOAT_APP_TO_DOCK_ITEM[win.app]);
            return (
              <button
                key={win.id}
                type="button"
                className="fdock-mini"
                data-dock-item={item?.id}
                onClick={() => floats.restoreWindow(win.id)}
                title={`Restore ${win.title}`}
                aria-label={`Restore ${win.title}`}
              >
                {item
                  ? <DockGlyph item={item} className="fdock-mini-glyph" />
                  : <span className="fdock-mini-glyph" aria-hidden="true">❐</span>}
                <span className="fdock-mini-label">{win.title}</span>
              </button>
            );
          })}
        </div>
      )}

      <nav className="fdock" aria-label="Floating dock">
        <div className="fdock-scroll" role="group" aria-label="Applications">
          {items.map((item) => {
            const isCanvases = item.id === 'canvases';
            const button = (
              <button
                key={isCanvases ? undefined : item.id}
                ref={isCanvases ? canvasesBtnRef : undefined}
                type="button"
                data-dock-item={item.id}
                className={`fdock-item ${activeById[item.id] ? 'on' : ''}`}
                onClick={() => onLaunchItem?.(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-pressed={!!activeById[item.id]}
              >
                <DockGlyph item={item} className="fdock-glyph" />
                <span className="fdock-label">{item.label}</span>
              </button>
            );
            if (!isCanvases) return button;
            return (
              <span key={item.id} className="fdock-canvases-wrap">
                {button}
                {renderedCanvasesPopover}
              </span>
            );
          })}
        </div>
        <div className="fdock-side">
          <DockClock />
          <ShellModeSwitch mode={shellMode} onChange={onShellModeChange} compact />
        </div>
      </nav>
    </div>
  );
}

export default FloatDock;
