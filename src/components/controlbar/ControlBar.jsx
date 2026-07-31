import './ControlBar.css';

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
      <path d={FOLDER_TAB_PATH} />
    </svg>
  );
}

function ControlBar({
  variant = 'dock',
  dockStyle = 'current',
  chatOpen,
  briiztormOpen,
  organizerOpen,
  calendarOpen,
  mediaOpen,
  notesOpen,
  canvasesOpen,
  onToggleChat,
  onToggleBriiztorm,
  onOpenOrganizer,
  onOpenCalendar,
  onToggleMedia,
  onToggleNotes,
  onToggleCanvases,
  canvasesPopoverSlot,
}) {
  if (variant === 'bar') {
    return <div className="control-bar-rail" aria-hidden="true" />;
  }

  return (
    <nav className={`control-bar-dock control-bar-dock--${dockStyle}`} aria-label="Control dock">
      <button
        type="button"
        className={`cb-toggle ${chatOpen ? 'active' : ''}`}
        data-dock-item="chat"
        onClick={onToggleChat}
        title="AI Chat Panel"
        aria-pressed={chatOpen}
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
        aria-pressed={briiztormOpen}
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
        aria-pressed={organizerOpen}
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
        aria-pressed={calendarOpen}
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
        aria-pressed={mediaOpen}
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
        aria-pressed={notesOpen}
      >
        <FolderTabShape />
        <span className="cb-icon" id="notes-icon">􁕍</span>
        <span className="cb-label">Notes</span>
      </button>

      <div className="cb-canvases-wrap">
        <button
          type="button"
          className={`cb-toggle ${canvasesOpen ? 'active' : ''}`}
          data-dock-item="canvases"
          onClick={onToggleCanvases}
          title="Canvases - Saved Mini-Apps (Cmd/Ctrl+Shift+K)"
          data-canvases-toggle="true"
          aria-pressed={canvasesOpen}
        >
          <FolderTabShape />
          <span className="cb-icon" id="canvases-icon">􀣰</span>
          <span className="cb-label">Canvases</span>
        </button>
        {canvasesPopoverSlot}
      </div>
    </nav>
  );
}

export default ControlBar;
