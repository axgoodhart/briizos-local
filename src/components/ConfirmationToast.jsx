import { useState, useEffect, useRef } from 'react';

function formatActionText(toolName, params = {}) {
  switch (toolName) {
    case 'createNotePanel':
      return `Create note "${params.title}"`;
    case 'openPanel':
      return `Open panel "${params.panel_title}"`;
    case 'createSingleCalendarEvent':
      return `Create event "${params.title}" on ${params.date}${params.time ? ` at ${params.time}` : ''}`;
    case 'updateCalendarEvent':
      return `Move "${params.event_title}" to ${params.new_date}`;
    case 'createRecurringCalendarEvent':
      return `Create recurring event "${params.title}"`;
    case 'createThoughtStream':
      return `Create task "${params.text}"`;
    case 'completeTask':
      return `Complete task "${params.task_id}"`;
    case 'deletePanel':
      return `Delete panel "${params.panel_id}"`;
    case 'duplicatePanel':
      return `Duplicate panel "${params.panel_id}"`;
    case 'updateNoteContent':
      return `Update content of "${params.panel_id}"`;
    case 'agentWriteFile':
      return `Write file "${params.path}"`;
    case 'agentCopyFile':
      return `Copy "${params.source}" to "${params.destination}"`;
    case 'agentMoveFile':
      return `Move "${params.source}" to "${params.destination}"`;
    case 'agentDeleteFile':
      return `Delete "${params.path}"`;
    case 'runCommand':
      return `Run command "${params.command}"`;
    case 'setPanelColor':
      return `Change color of "${params.panel_id}"`;
    case 'setPanelTitle':
      return `Rename "${params.panel_id}" to "${params.new_title}"`;
    case 'createPrioritizedTaskList':
      return `Create task list (${params.criteria})`;
    case 'applyTaskPriorities': {
      const assignments = Array.isArray(params.assignments) ? params.assignments : [];
      const counts = assignments.reduce((summary, assignment) => ({
        ...summary,
        [assignment.priority]: (summary[assignment.priority] || 0) + 1,
      }), {});
      const bands = ['urgent', 'high', 'medium', 'normal', 'low']
        .filter((priority) => counts[priority])
        .map((priority) => `${counts[priority]} ${priority}`)
        .join(', ');
      return `Set ${assignments.length} task priorit${assignments.length === 1 ? 'y' : 'ies'}${bands ? ` (${bands})` : ''}`;
    }
    default:
      return `Execute ${toolName}`;
  }
}

function ConfirmationToast({ pendingConfirmation, onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const confirmationRef = useRef(null);

  useEffect(() => {
    if (pendingConfirmation) {
      setVisible(true);
      const frame = requestAnimationFrame(() => confirmationRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    } else {
      setVisible(false);
    }
    return undefined;
  }, [pendingConfirmation]);

  const handleConfirm = () => {
    const request = pendingConfirmation;
    if (!request) return;
    setVisible(false);
    setTimeout(() => {
      onConfirm(request.params);
      setToast({ type: 'success', message: 'Action approved.' });
      setTimeout(() => setToast(null), 3000);
    }, 300);
  };

  const handleCancel = () => {
    setVisible(false);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  return (
    <>
      {/* Confirmation notification */}
      {pendingConfirmation && (
        <section
          ref={confirmationRef}
          className={`confirmation-toast ${visible ? 'visible' : ''}`}
          role="alertdialog"
          aria-labelledby="tool-confirmation-title"
          aria-describedby="tool-confirmation-action tool-confirmation-note"
          tabIndex={-1}
        >
          <div className="confirmation-toast-content confirmation-request-copy">
            <div className="confirmation-toast-label confirmation-request-kicker">
              Approval needed
            </div>
            <h3 id="tool-confirmation-title" className="confirmation-request-title">
              Briizy is asking to perform an action
            </h3>
            <div
              id="tool-confirmation-action"
              className="confirmation-toast-action confirmation-request-action"
            >
              {formatActionText(pendingConfirmation.toolName, pendingConfirmation.params)}
            </div>
            <p id="tool-confirmation-note" className="confirmation-request-note">
              Nothing will run until you choose.
            </p>
          </div>
          <div className="confirmation-toast-buttons confirmation-request-actions" aria-label="Respond to requested action">
            <button
              type="button"
              className="confirmation-btn confirm confirmation-response-btn approve"
              onClick={handleConfirm}
            >
              Approve
            </button>
            <button
              type="button"
              className="confirmation-btn cancel confirmation-response-btn decline"
              onClick={handleCancel}
            >
              Decline
            </button>
          </div>
        </section>
      )}

      {/* Success/error toast */}
      {toast && (
        <div className={`result-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </>
  );
}

export default ConfirmationToast;
