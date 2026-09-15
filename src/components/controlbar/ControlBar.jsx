import '../../AppCombined.css';
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import briizyLogoAwake from '../../briizy/assets/briizy-logo-awake.png';
import briizyLogoAsleep from '../../briizy/assets/briizy-logo-asleep.png';

const AVATAR_SIZE_MIN_PX = 48;
const AVATAR_SIZE_MAX_PX = 140;
const DEFAULT_AVATAR_SIZE_PX = 70;

function normalizeAvatarSizePx(value) {
  const size = Math.round(Number(value));
  if (!Number.isFinite(size)) return DEFAULT_AVATAR_SIZE_PX;
  return Math.min(AVATAR_SIZE_MAX_PX, Math.max(AVATAR_SIZE_MIN_PX, size));
}

const FOLDER_TAB_PATH = [
  'M 0 48',
  'C 6 48 10 44 10 36',
  'L 10 22',
  'Q 10 2 30 2',
  'L 54 2',
  'Q 74 2 74 22',
  'L 74 36',
  'C 74 44 78 48 84 48',
].join(' ');

function FolderTabShape() {
  return (
    <svg className="cb-tab-shape" viewBox="0 0 84 48" preserveAspectRatio="none" aria-hidden="true">
      <path className="cb-tab-occluder" d={FOLDER_TAB_PATH} />
      <path className="cb-tab-face" d={FOLDER_TAB_PATH} />
    </svg>
  );
}

export const EDITABLE_DOCK_ITEMS = Object.freeze([
  { id: 'chat', label: 'Chats', glyph: '􀌮', accent: '#16df69' },
  { id: 'briiztorm', label: 'briiZtorm', glyph: '􁅥', accent: '#f54ba3' },
  { id: 'organizer', label: 'Organizer', glyph: '􀱢', accent: '#2bff36' },
  { id: 'calendar', label: 'Calendar', glyph: '􀉉', accent: '#ff7149' },
  { id: 'media', label: 'Media', glyph: '􀢺', accent: '#43e8dd' },
  { id: 'notes', label: 'Notes', glyph: '􁕍', accent: '#e7dc91' },
  { id: 'canvases', label: 'Canvases', glyph: '􀏜', accent: '#24d9e6' },
  { id: 'journal', label: 'Journals', glyph: '􀬒', accent: '#e5a76a' },
  { id: 'forest', label: 'Forest', glyph: '􁝯', accent: '#7ee7a1' },
  { id: 'notefalls', label: 'Notefalls', glyph: '􀢾', accent: '#bda6ff' },
  { id: 'sources', label: 'Sources', glyph: '􀫥', accent: '#74dcea' },
  { id: 'tasks', label: 'Tasks', glyph: '􀷾', accent: '#ffd36b' },
]);

const DEFAULT_HEADER_DOCK_ITEM_IDS = Object.freeze([
  'controlBar', 'chat', 'briiztorm', 'organizer', 'calendar', 'media', 'notes', 'canvases',
]);

const DOCK_ITEMS_BY_ID = new Map(EDITABLE_DOCK_ITEMS.map((item) => [item.id, item]));

export function DockGlyph({ item, className, id, style }) {
  const glyph = item.glyph || DOCK_ITEMS_BY_ID.get(item.id)?.glyph || '􀷾';
  return <span className={className} id={id} style={style} aria-hidden="true">{glyph}</span>;
}

function HeaderDockButton({ item, active, onLaunch, dockItemProps }) {
  return (
    <button
      type="button"
      className={`cb-toggle ${active ? 'active' : ''}`}
      data-dock-item={item.id}
      onClick={onLaunch}
      title={item.label}
      aria-label={item.label}
      aria-pressed={active}
      {...dockItemProps(item.id)}
    >
      <FolderTabShape />
      <DockGlyph item={item} className="cb-icon" id={`${item.id}-icon`} />
      <span className="cb-label">{item.label}</span>
    </button>
  );
}

function useOptionHeld() {
  const [optionHeld, setOptionHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Alt') setOptionHeld(true);
    };
    const onKeyUp = (event) => {
      if (event.key === 'Alt') setOptionHeld(false);
    };
    const onBlur = () => setOptionHeld(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return optionHeld;
}

function DockEditor({
  dockItems = DEFAULT_HEADER_DOCK_ITEM_IDS,
  onDockItemsChange,
  onLaunchItem,
  observationActive = false,
  observationAvailable = false,
  observationBusy = false,
  onToggleObservation,
  avatarVisible = true,
  avatarSizePx = DEFAULT_AVATAR_SIZE_PX,
  onAvatarVisibilityChange,
  onAvatarSizeChange,
}) {
  const includedIds = dockItems.filter((id) => id !== 'controlBar');
  const included = includedIds.map((id) => DOCK_ITEMS_BY_ID.get(id)).filter(Boolean);
  const available = EDITABLE_DOCK_ITEMS.filter((item) => !includedIds.includes(item.id));
  const allItems = [...included, ...available];
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [avatarVisibleDraft, setAvatarVisibleDraft] = useState(avatarVisible);
  const currentAvatarSize = normalizeAvatarSizePx(avatarSizePx);
  const [avatarSizeDraft, setAvatarSizeDraft] = useState(currentAvatarSize);
  const committedAvatarSizeRef = useRef(currentAvatarSize);
  const optionHeld = useOptionHeld();

  useEffect(() => {
    setAvatarVisibleDraft(avatarVisible);
  }, [avatarVisible]);

  useEffect(() => {
    committedAvatarSizeRef.current = currentAvatarSize;
    setAvatarSizeDraft(currentAvatarSize);
  }, [currentAvatarSize]);

  const updateIncluded = (next) => onDockItemsChange?.(['controlBar', ...next]);

  const moveBefore = (movingId, targetId) => {
    if (!movingId || movingId === targetId) return;
    const next = includedIds.filter((id) => id !== movingId);
    const targetIndex = next.indexOf(targetId);
    if (targetIndex < 0) return;
    next.splice(targetIndex, 0, movingId);
    updateIncluded(next);
  };

  const commitAvatarSize = (value) => {
    const nextSize = normalizeAvatarSizePx(value);
    setAvatarSizeDraft(nextSize);
    if (nextSize === committedAvatarSizeRef.current) return;
    committedAvatarSizeRef.current = nextSize;
    onAvatarSizeChange?.(nextSize);
  };

  return (
    <section className="control-bar-rail" aria-label="Header dock editor">
      <section
        className={'cb-briizy-presence' + (avatarVisibleDraft ? ' is-visible' : ' is-invisible')}
        aria-label="Briizy on-screen appearance"
      >
        <button
          type="button"
          className={'cb-observation-toggle' + (observationActive ? ' is-active' : '')}
          onClick={onToggleObservation}
          disabled={!observationAvailable || observationBusy}
          aria-pressed={observationActive}
          title={observationAvailable
            ? `${observationActive ? 'Turn off' : 'Turn on'} briizy observation capture`
            : 'briizy observation is unavailable in this build'}
          aria-label={observationAvailable
            ? `${observationActive ? 'Turn off' : 'Turn on'} briizy observation capture`
            : 'briizy observation is unavailable in this build'}
        >
          <img
            className="cb-briizy-avatar"
            src={observationActive ? briizyLogoAwake : briizyLogoAsleep}
            alt=""
          />
        </button>

        <label className="cb-briizy-size" htmlFor="briizy-avatar-size">
          <output className="cb-briizy-size__value" htmlFor="briizy-avatar-size">{avatarSizeDraft} px</output>
          <input
            id="briizy-avatar-size"
            className="cb-briizy-size__range"
            type="range"
            min={AVATAR_SIZE_MIN_PX}
            max={AVATAR_SIZE_MAX_PX}
            step="1"
            value={avatarSizeDraft}
            disabled={!observationAvailable || observationBusy}
            aria-valuetext={`${avatarSizeDraft} pixels`}
            style={{ '--cb-avatar-size-progress': `${((avatarSizeDraft - AVATAR_SIZE_MIN_PX) / (AVATAR_SIZE_MAX_PX - AVATAR_SIZE_MIN_PX)) * 100}%` }}
            onChange={(event) => setAvatarSizeDraft(normalizeAvatarSizePx(event.currentTarget.value))}
            onPointerUp={(event) => commitAvatarSize(event.currentTarget.value)}
            onBlur={(event) => commitAvatarSize(event.currentTarget.value)}
            onKeyUp={(event) => {
              if (['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp'].includes(event.key)) {
                commitAvatarSize(event.currentTarget.value);
              }
            }}
          />
        </label>
        </section>
<section className="cb-briizy-vis-toggles">
        <fieldset className="cb-briizy-visibility" n={!observationAvailable || observationBusy}>
          <legend className="cb-sr-only">Briizy visibility</legend>
          <label className="cb-briizy-visibility__option">
            <input
              type="radio"
              name="briizy-avatar-visibility"
              checked={avatarVisibleDraft}
              onChange={() => {
                setAvatarVisibleDraft(true);
                onAvatarVisibilityChange?.(true);
              }}
            />
            <span>Visible</span>
          </label>
          <label className="cb-briizy-visibility__option">
            <input
              type="radio"
              name="briizy-avatar-visibility"
              checked={!avatarVisibleDraft}
              onChange={() => {
                setAvatarVisibleDraft(false);
                onAvatarVisibilityChange?.(false);
              }}
            />
            <span>Invisible</span>
          </label>
        </fieldset>
      </section>

      <span className="cb-editor__rule" aria-hidden="true" />

      <div className="cb-editor__dock" aria-label="All panel launchers">
        <div className="cb-editor__items">
          {allItems.map((item) => {
            const inHeaderDock = includedIds.includes(item.id);
            const removeMode = inHeaderDock && optionHeld && hoveredItemId === item.id;
            return (
            <div
              className={`cb-editor__item ${inHeaderDock ? 'is-pinned' : 'is-unpinned'}${removeMode ? ' is-remove-mode' : ''}`}
              key={item.id}
              draggable={inHeaderDock}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', item.id);
              }}
              onDragOver={(event) => {
                if (inHeaderDock) event.preventDefault();
              }}
              onDrop={(event) => {
                if (!inHeaderDock) return;
                event.preventDefault();
                moveBefore(event.dataTransfer.getData('text/plain'), item.id);
              }}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId((current) => (current === item.id ? null : current))}
              title={inHeaderDock ? `Drag ${item.label} to reorder the header dock` : `${item.label} is not in the header dock`}
            >
              {inHeaderDock && !removeMode && (
                <span className="cb-editor__marker cb-editor__marker--pinned" aria-label={`${item.label} is in the header dock`}>⌃</span>
              )}
              {removeMode && (
                <button
                  type="button"
                  className="cb-editor__marker cb-editor__marker--remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    updateIncluded(includedIds.filter((id) => id !== item.id));
                  }}
                  aria-label={`Remove ${item.label} from the header dock`}
                  title={`Remove ${item.label} from the header dock`}
                >
                  ×
                </button>
              )}
              {!inHeaderDock && (
                <button
                  type="button"
                  className="cb-editor__marker cb-editor__marker--add"
                  onClick={(event) => {
                    event.stopPropagation();
                    updateIncluded([...includedIds, item.id]);
                  }}
                  aria-label={`Add ${item.label} to the header dock`}
                  title={`Add ${item.label} to the header dock`}
                >
                  +
                </button>
              )}
              <button
                type="button"
                className="cb-editor__launch"
                onClick={() => {
                  if (removeMode) {
                    updateIncluded(includedIds.filter((id) => id !== item.id));
                    return;
                  }
                  onLaunchItem?.(item.id);
                }}
                aria-label={removeMode ? `Remove ${item.label} from the header dock` : `Launch ${item.label}`}
                title={removeMode ? `Remove ${item.label} from the header dock` : `Launch ${item.label}`}
              >
                <DockGlyph item={item} className="cb-editor__glyph" style={{ color: item.accent }} />
                <span className="cb-editor__item-label">{item.label}</span>
              </button>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ControlBar({
  variant = 'dock',
  dockStyle = 'current',
  orientation = 'horizontal',
  controlBarOpen,
  chatOpen,
  briiztormOpen,
  organizerOpen,
  calendarOpen,
  mediaOpen,
  notesOpen,
  canvasesOpen,
  journalOpen,
  forestOpen,
  notefallsOpen,
  sourcesOpen,
  tasksOpen,
  onToggleControlBar,
  onToggleChat,
  onToggleBriiztorm,
  onOpenOrganizer,
  onOpenCalendar,
  onToggleMedia,
  onToggleNotes,
  onToggleCanvases,
  onToggleJournal,
  onToggleForest,
  onToggleNotefalls,
  onToggleSources,
  onToggleTasks,
  canvasesPopoverSlot,
  dockItems = DEFAULT_HEADER_DOCK_ITEM_IDS,
  onDockItemsChange,
  onLaunchItem,
  observationActive,
  observationAvailable,
  observationBusy,
  onToggleObservation,
  avatarVisible,
  avatarSizePx,
  onAvatarVisibilityChange,
  onAvatarSizeChange,
}) {
  const canvasesToggleRef = useRef(null);

  /* Open panels ordered oldest → newest. The skeuomorphic tabs stack by this
     order, so a tab's tails only rest on tabs raised longer ago. Closing a
     panel drops it back into the resting pile. */
  const activeById = {
    controlBar: controlBarOpen,
    chat: chatOpen,
    briiztorm: briiztormOpen,
    organizer: organizerOpen,
    calendar: calendarOpen,
    media: mediaOpen,
    notes: notesOpen,
    canvases: canvasesOpen,
    journal: journalOpen,
    forest: forestOpen,
    notefalls: notefallsOpen,
    sources: sourcesOpen,
    tasks: tasksOpen,
  };
  const [tabOrder, setTabOrder] = useState(() =>
    Object.keys(activeById).filter((id) => activeById[id])
  );

  useEffect(() => {
    setTabOrder((prev) => {
      const kept = prev.filter((id) => activeById[id]);
      const opened = Object.keys(activeById).filter(
        (id) => activeById[id] && !kept.includes(id)
      );
      if (kept.length === prev.length && opened.length === 0) return prev;
      return [...kept, ...opened];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controlBarOpen, chatOpen, briiztormOpen, organizerOpen, calendarOpen,
    mediaOpen, notesOpen, canvasesOpen, journalOpen, forestOpen,
    notefallsOpen, sourcesOpen, tasksOpen,
  ]);

  if (variant === 'bar') {
    return (
      <DockEditor
        dockItems={dockItems}
        onDockItemsChange={onDockItemsChange}
        onLaunchItem={onLaunchItem}
        observationActive={observationActive}
        observationAvailable={observationAvailable}
        observationBusy={observationBusy}
        onToggleObservation={onToggleObservation}
        avatarVisible={avatarVisible}
        avatarSizePx={avatarSizePx}
        onAvatarVisibilityChange={onAvatarVisibilityChange}
        onAvatarSizeChange={onAvatarSizeChange}
      />
    );
  }

  const dockItemProps = (id) => {
    const order = dockItems.indexOf(id);
    return {
      hidden: order < 0,
      style: {
        '--cb-dock-order': order < 0 ? 99 : order,
        '--cb-tab-recency': tabOrder.indexOf(id) + 1,
      },
    };
  };

  const renderedCanvasesPopover = isValidElement(canvasesPopoverSlot)
    ? cloneElement(canvasesPopoverSlot, { anchorRef: canvasesToggleRef })
    : canvasesPopoverSlot;

  return (
    <nav className={`control-bar-dock control-bar-dock--${dockStyle} control-bar-dock--${orientation}`} aria-label="Control dock">

      <button
        type="button"
        className={`cb-toggle cb-toggle--control-bar ${controlBarOpen ? 'active' : ''}`}
        id="controlBarToggle"
        data-dock-item="controlBar"
        onClick={onToggleControlBar}
        title="Show Control Bar"
        aria-label="Control Bar"
        aria-pressed={controlBarOpen}
        {...dockItemProps('controlBar')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="controlBar-icon">􂞹</span>
        <span className="cb-label">Ctrl Bar</span>
      </button>

      <div className="control-bar-dock__scroll" role="group" aria-label="Dock applications">
      <button
        type="button"
        className={`cb-toggle ${chatOpen ? 'active' : ''}`}
        data-dock-item="chat"
        onClick={onToggleChat}
        title="AI Chat Panel"
        aria-label="Chats"
        aria-pressed={chatOpen}
        {...dockItemProps('chat')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="chatpanel-icon">􀌮</span>
        <span className="cb-label">Chats</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${briiztormOpen ? 'active' : ''}`}
        data-dock-item="briiztorm"
        onClick={onToggleBriiztorm}
        title="briiZtorm - 3D Project View"
        aria-label="briiZtorm"
        aria-pressed={briiztormOpen}
        {...dockItemProps('briiztorm')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="briiztorm-icon">􁅥</span>
        <span className="cb-label">briiZtorm</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${organizerOpen ? 'active' : ''}`}
        data-dock-item="organizer"
        onClick={onOpenOrganizer}
        title="Organizer - Project Management"
        aria-label="Organizer"
        aria-pressed={organizerOpen}
        {...dockItemProps('organizer')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="organizer-icon">􀱢</span>
        <span className="cb-label">Organizer</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${calendarOpen ? 'active' : ''}`}
        data-dock-item="calendar"
        onClick={onOpenCalendar}
        title="Calendar - Daily Schedule"
        aria-label="Calendar"
        aria-pressed={calendarOpen}
        {...dockItemProps('calendar')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="calendar-icon">􀉉</span>
        <span className="cb-label">Calendar</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${mediaOpen ? 'active' : ''}`}
        data-dock-item="media"
        onClick={onToggleMedia}
        title="Media"
        aria-label="Media"
        aria-pressed={mediaOpen}
        {...dockItemProps('media')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="media-icon">􀢺</span>
        <span className="cb-label">Media</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${notesOpen ? 'active' : ''}`}
        data-dock-item="notes"
        onClick={onToggleNotes}
        title="Notes - Quick Notes"
        aria-label="Notes"
        aria-pressed={notesOpen}
        {...dockItemProps('notes')}
      >
        <FolderTabShape />
        <span className="cb-icon" id="notes-icon">􁕍</span>
        <span className="cb-label">Notes</span>
      </button>

      <div className="cb-canvases-wrap" {...dockItemProps('canvases')}>
        <button
          ref={canvasesToggleRef}
          type="button"
          className={`cb-toggle ${canvasesOpen ? 'active' : ''}`}
          data-dock-item="canvases"
          onClick={onToggleCanvases}
          title="Canvases - Saved Mini-Apps (Cmd/Ctrl+Shift+K)"
          data-canvases-toggle="true"
          aria-label="Canvases"
          aria-pressed={canvasesOpen}
        >
          <FolderTabShape />
          <span className="cb-icon" id="canvases-icon">􀏜</span>
          <span className="cb-label">Canvases</span>
        </button>
        {renderedCanvasesPopover}
      </div>

      <HeaderDockButton
        item={DOCK_ITEMS_BY_ID.get('journal')}
        active={journalOpen}
        onLaunch={onToggleJournal}
        dockItemProps={dockItemProps}
      />
      <HeaderDockButton
        item={DOCK_ITEMS_BY_ID.get('forest')}
        active={forestOpen}
        onLaunch={onToggleForest}
        dockItemProps={dockItemProps}
      />
      <HeaderDockButton
        item={DOCK_ITEMS_BY_ID.get('notefalls')}
        active={notefallsOpen}
        onLaunch={onToggleNotefalls}
        dockItemProps={dockItemProps}
      />
      <HeaderDockButton
        item={DOCK_ITEMS_BY_ID.get('sources')}
        active={sourcesOpen}
        onLaunch={onToggleSources}
        dockItemProps={dockItemProps}
      />
      <HeaderDockButton
        item={DOCK_ITEMS_BY_ID.get('tasks')}
        active={tasksOpen}
        onLaunch={onToggleTasks}
        dockItemProps={dockItemProps}
      />
      </div>
    </nav>
  );
}

export default ControlBar;
