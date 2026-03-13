import './ControlBar.css';

function ControlBar({
  isOpen,
  briiztormOpen,
  actionDeckOpen,
  notesOpen,
  onToggleBriiztorm,
  onToggleActionDeck,
  onOpenOrganizer,
  onOpenCalendar,
  onToggleNotes,
}) {
  return (
    <div className={`control-bar ${isOpen ? 'open' : 'closed'}`}>
      <div className="control-bar-toggles">
        <button
          className={`cb-toggle ${briiztormOpen ? 'active' : ''}`}
          onClick={onToggleBriiztorm}
          title="briiZtorm - 3D Project View"
        >
          <span className="cb-icon" id="briiztorm-icon">􁅥</span>
          <span className="cb-label">briiZtorm</span>
        </button>

        <button
          className={`cb-toggle ${actionDeckOpen ? 'active' : ''}`}
          onClick={onToggleActionDeck}
          title="ActionDeck - Task Management"
        >
          <span className="cb-icon" id="actiondeck-icon">􁙕</span>
          <span className="cb-label">ActionDeck</span>
        </button>

        <button
          className="cb-toggle"
          onClick={onOpenOrganizer}
          title="Organizer - Project Management"
        >
          <span className="cb-icon" id="organizer-icon">􀱢</span>
          <span className="cb-label">Organizer</span>
        </button>

        <button
          className="cb-toggle"
          onClick={onOpenCalendar}
          title="Calendar - Daily Schedule"
        >
          <span className="cb-icon" id="calendar-icon">􀉉</span>
          <span className="cb-label">Calendar</span>
        </button>

        <button
          className={`cb-toggle ${notesOpen ? 'active' : ''}`}
          onClick={onToggleNotes}
          title="Notes - Quick Notes"
        >
          <span className="cb-icon" id="notes-icon">􀓕􀈊</span>
          <span className="cb-label">Notes</span>
        </button>

      </div>
    </div>
  );
}

export default ControlBar;
