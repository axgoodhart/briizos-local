import { useState, useEffect, useRef } from 'react';
import { subscribeLogs } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';

function LogPanel() {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  // Subscribe to logs from Firestore (real-time)
  useEffect(() => {
    if (!isAuthenticated) {
      setLogs([]);
      return () => {};
    }
    const unsubscribe = subscribeLogs((logData) => {
      // Newest first — most recent entries at the top
      setLogs(logData);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user?.uid]);

  // Scroll to top when new logs arrive (newest entries are at the top)
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  // Determine log level from action for styling
  const getLogLevel = (action) => {
    if (action.includes('error') || action.includes('fail') || action === 'agent_failed') return 'error';
    if (action.includes('warn')) return 'warn';
    if (action === 'assistant_message') return 'assistant';
    if (action === 'tool_call') return 'tool-call';
    if (action === 'tool_result') return 'tool-result';
    if (action === 'agent_step') return 'agent-step';
    if (action === 'agent_complete') return 'agent-complete';
    if (action === 'agent_cutoff') return 'warn';
    return 'info';
  };

  const getLevelClass = (level) => {
    switch (level) {
      case 'error': return 'log-error';
      case 'warn': return 'log-warn';
      case 'assistant': return 'log-assistant';
      case 'tool-call': return 'log-tool-call';
      case 'tool-result': return 'log-tool-result';
      case 'agent-step': return 'log-agent-step';
      case 'agent-complete': return 'log-agent-complete';
      default: return 'log-info';
    }
  };

  // Format timestamp for display
  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="panel log-panel">
      <div className="panel-header">Log</div>
      <div className="panel-content log-entries" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="log-entry log-info">
            <span className="log-message">No log entries yet...</span>
          </div>
        ) : (
          logs.map(log => {
            const level = getLogLevel(log.action);
            return (
              <div key={log.id} className={`log-entry ${getLevelClass(level)}`}>
                <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className="log-level">[{log.action.toUpperCase()}]</span>
                <span className="log-message">{log.message || ''}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default LogPanel;
