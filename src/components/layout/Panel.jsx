import { useState, useCallback } from 'react';
import '../../AppCombined.css';

/**
 * Panel wrapper component with header controls for minimize/maximize/close
 * Used as a reusable container for widgets in the tile layout system
 *
 * @param {Object} props
 * @param {string} props.title - Panel title displayed in header
 * @param {React.ReactNode} props.children - Panel content
 * @param {React.ReactNode} props.icon - Optional icon to display before title
 * @param {Function} props.onClose - Called when close button is clicked
 * @param {Function} props.onMinimize - Called when minimize button is clicked
 * @param {Function} props.onMaximize - Called when maximize button is clicked
 * @param {boolean} props.showControls - Whether to show control buttons (default: true)
 * @param {boolean} props.initialMinimized - Initial minimized state
 * @param {boolean} props.initialMaximized - Initial maximized state
 * @param {string} props.className - Additional CSS classes for the panel
 * @param {React.ReactNode} props.headerActions - Additional actions to show in header
 */
function Panel({
  title,
  children,
  icon,
  onClose,
  onMinimize,
  onMaximize,
  showControls = true,
  initialMinimized = false,
  initialMaximized = false,
  className = '',
  headerActions
}) {
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isMaximized, setIsMaximized] = useState(initialMaximized);

  const handleMinimize = useCallback(() => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    // If minimizing, ensure we're not maximized
    if (newMinimized && isMaximized) {
      setIsMaximized(false);
    }
    onMinimize?.(newMinimized);
  }, [isMinimized, isMaximized, onMinimize]);

  const handleMaximize = useCallback(() => {
    const newMaximized = !isMaximized;
    setIsMaximized(newMaximized);
    // If maximizing, ensure we're not minimized
    if (newMaximized && isMinimized) {
      setIsMinimized(false);
    }
    onMaximize?.(newMaximized);
  }, [isMaximized, isMinimized, onMaximize]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Build panel class names
  const panelClasses = [
    'panel',
    isMinimized && 'minimized',
    isMaximized && 'maximized',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClasses}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          {icon && <span className="panel-header-icon">{icon}</span>}
          <span className="panel-header-title">{title}</span>
        </div>

        <div className="panel-header-right">
          {/* Custom header actions */}
          {headerActions && (
            <div className="panel-header-actions">
              {headerActions}
            </div>
          )}

          {/* Control buttons */}
          {showControls && (
            <div className="panel-header-actions">
              {onMinimize !== undefined && (
                <button
                  className="panel-control-btn minimize"
                  onClick={handleMinimize}
                  title={isMinimized ? 'Restore' : 'Minimize'}
                  aria-label={isMinimized ? 'Restore panel' : 'Minimize panel'}
                >
                  {isMinimized ? '□' : '−'}
                </button>
              )}

              {onMaximize !== undefined && (
                <button
                  className="panel-control-btn maximize"
                  onClick={handleMaximize}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                  aria-label={isMaximized ? 'Restore panel' : 'Maximize panel'}
                >
                  {isMaximized ? '❐' : '□'}
                </button>
              )}

              {onClose !== undefined && (
                <button
                  className="panel-control-btn close"
                  onClick={handleClose}
                  title="Close"
                  aria-label="Close panel"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel Content - hidden when minimized */}
      {!isMinimized && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default Panel;
