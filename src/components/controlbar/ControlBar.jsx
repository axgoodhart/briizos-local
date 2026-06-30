import './ControlBar.css';

function ControlBar({
  variant = 'dock',
  briiztormOpen,
  actionDeckOpen,
  organizerOpen,
  calendarOpen,
  mediaOpen,
  notesOpen,
  canvasesOpen,
  onToggleBriiztorm,
  onToggleActionDeck,
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
    <nav className="control-bar-dock" aria-label="Control dock">
      <button
        type="button"
        className={`cb-toggle ${briiztormOpen ? 'active' : ''}`}
        onClick={onToggleBriiztorm}
        title="AI Chat Panel"
        aria-pressed={briiztormOpen}
      >
        <span className="cb-icon" id="chatpanel-icon">􀌮</span>
        <span className="cb-label">Chats</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${briiztormOpen ? 'active' : ''}`}
        onClick={onToggleBriiztorm}
        title="briiZtorm - 3D Project View"
        aria-pressed={briiztormOpen}
      >
        <span className="cb-icon" id="briiztorm-icon">􁅥</span>
        <span className="cb-label">briiZtorm</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${actionDeckOpen ? 'active' : ''}`}
        onClick={onToggleActionDeck}
        title="ActionDeck - Task Management"
        aria-pressed={actionDeckOpen}
      >
        <span className="cb-icon" id="actiondeck-icon">􁙕</span>
        <span className="cb-label">ActionDeck</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${organizerOpen ? 'active' : ''}`}
        onClick={onOpenOrganizer}
        title="Organizer - Project Management"
        aria-pressed={organizerOpen}
      >
        <span className="cb-icon" id="organizer-icon">􀱢</span>
        <span className="cb-label">Organizer</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${calendarOpen ? 'active' : ''}`}
        onClick={onOpenCalendar}
        title="Calendar - Daily Schedule"
        aria-pressed={calendarOpen}
      >
        <span className="cb-icon" id="calendar-icon">􀉉</span>
        <span className="cb-label">Calendar</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${mediaOpen ? 'active' : ''}`}
        onClick={onToggleMedia}
        title="Media"
        aria-pressed={mediaOpen}
      >
        <span className="cb-icon" id="media-icon">􀢺</span>
        <span className="cb-label">Media</span>
      </button>

      <button
        type="button"
        className={`cb-toggle ${notesOpen ? 'active' : ''}`}
        onClick={onToggleNotes}
        title="Notes - Quick Notes"
        aria-pressed={notesOpen}
      >
        <span className="cb-icon" id="notes-icon">􁕍</span>
        <span className="cb-label">Notes</span>
      </button>

      <div className="cb-canvases-wrap">
        <button
          type="button"
          className={`cb-toggle ${canvasesOpen ? 'active' : ''}`}
          onClick={onToggleCanvases}
          title="Canvases - Saved Mini-Apps (Cmd/Ctrl+Shift+K)"
          data-canvases-toggle="true"
          aria-pressed={canvasesOpen}
        >
          <span className="cb-icon" id="canvases-icon">􀣰</span>
          <span className="cb-label">Canvases</span>
        </button>
        {canvasesPopoverSlot}
      </div>
    </nav>
  );
}

export default ControlBar;
