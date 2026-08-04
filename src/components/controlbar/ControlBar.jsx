import './ControlBar.css';
import { useEffect, useState } from 'react';
import briizyMoods from '../../briizy/assets/briizy-moods.png';

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

const EDITABLE_DOCK_ITEMS = Object.freeze([
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

function DockGlyph({ item, className, id, style }) {
  const props = { className, id, style, 'aria-hidden': 'true' };

  if (!item.icon) return <span {...props}>{item.glyph}</span>;

  if (item.icon === 'journal') {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4.5h10.2A3.8 3.8 0 0 1 19 8.3v11.2H8.8A3.8 3.8 0 0 0 5 23V4.5Z" />
        <path d="M5 19.5h10.2A3.8 3.8 0 0 1 19 23" />
        <path d="M9 8h6M9 11.5h6" />
      </svg>
    );
  }

  if (item.icon === 'forest') {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 4.2 6H14.5l4.3 5.4h-3.1l3.3 4.1H5.1l3.3-4.1H5.3L9.6 9H7.8L12 3Z" />
        <path d="M12 18.5V22" />
      </svg>
    );
  }

  if (item.icon === 'notefalls') {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3.5h10l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V3.5Z" />
        <path d="M15 3.5V8h4M8.5 12h7M8.5 15.5h5" />
      </svg>
    );
  }

  if (item.icon === 'sources') {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2.1" />
        <circle cx="6" cy="6.5" r="2" />
        <circle cx="18" cy="6.5" r="2" />
        <circle cx="6" cy="17.5" r="2" />
        <circle cx="18" cy="17.5" r="2" />
        <path d="m7.5 8 3 2.4m3 0 3-2.4m-9 8 3-2.4m3 0 3 2.4" />
      </svg>
    );
  }

  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="m7.5 9 1.5 1.5L11.5 8M13 9h3.5M7.5 15l1.5 1.5 2.5-2.5M13 15h3.5" />
    </svg>
  );
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
}) {
  const includedIds = dockItems.filter((id) => id !== 'controlBar');
  const included = includedIds.map((id) => DOCK_ITEMS_BY_ID.get(id)).filter(Boolean);
  const available = EDITABLE_DOCK_ITEMS.filter((item) => !includedIds.includes(item.id));
  const allItems = [...included, ...available];
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const optionHeld = useOptionHeld();
  const observationLabel = observationActive ? 'Observation on' : 'Observation off';

  const updateIncluded = (next) => onDockItemsChange?.(['controlBar', ...next]);

  const moveBefore = (movingId, targetId) => {
    if (!movingId || movingId === targetId) return;
    const next = includedIds.filter((id) => id !== movingId);
    const targetIndex = next.indexOf(targetId);
    if (targetIndex < 0) return;
    next.splice(targetIndex, 0, movingId);
    updateIncluded(next);
  };

  return (
    <section className="control-bar-rail" aria-label="Header dock editor">
      <button
        type="button"
        className={'cb-observation-toggle' + (observationActive ? ' is-active' : '')}
        onClick={onToggleObservation}
        disabled={!observationAvailable || observationBusy}
        aria-pressed={observationActive}
        title={observationAvailable
          ? `${observationActive ? 'Turn off' : 'Turn on'} briizy observation`
          : 'briizy observation is unavailable in this build'}
      >
        <span
          className="cb-briizy-avatar"
          aria-hidden="true"
          style={{ backgroundImage: `url(${briizyMoods})` }}
        />
        <span className="cb-observation-toggle__copy">
          <span className="cb-observation-toggle__name">briizy</span>
          <span className="cb-observation-toggle__state">{observationLabel}</span>
        </span>
      </button>

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
}) {
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
      />
    );
  }

  const dockItemProps = (id) => {
    const order = dockItems.indexOf(id);
    return {
      hidden: order < 0,
      style: { '--cb-dock-order': order < 0 ? 99 : order },
    };
  };

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
        {canvasesPopoverSlot}
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
    </nav>
  );
}

export default ControlBar;
