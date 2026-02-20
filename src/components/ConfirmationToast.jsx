import { useState, useEffect } from 'react';

function formatActionText(toolName, params) {
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
    case 'setPanelColor':
      return `Change color of "${params.panel_id}"`;
    case 'setPanelTitle':
      return `Rename "${params.panel_id}" to "${params.new_title}"`;
    case 'createPrioritizedTaskList':
      return `Create task list (${params.criteria})`;
    default:
      return `Execute ${toolName}`;
  }
}

function ConfirmationToast({ pendingConfirmation, onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    if (pendingConfirmation) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [pendingConfirmation]);

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(() => {
      onConfirm(pendingConfirmation.params);
      setToast({ type: 'success', message: `${pendingConfirmation.toolName} executed` });
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
        <div className={`confirmation-toast ${visible ? 'visible' : ''}`}>
          <div className="confirmation-toast-content">
            <div className="confirmation-toast-label">Action queued:</div>
            <div className="confirmation-toast-action">
              {formatActionText(pendingConfirmation.toolName, pendingConfirmation.params)}
            </div>
          </div>
          <div className="confirmation-toast-buttons">
            <button
              className="confirmation-btn confirm"
              onClick={handleConfirm}
              title="Confirm"
            >
              ✓
            </button>
            <button
              className="confirmation-btn cancel"
              onClick={handleCancel}
              title="Cancel"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success/error toast */}
      {toast && (
        <div className={`result-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}

export default ConfirmationToast;
