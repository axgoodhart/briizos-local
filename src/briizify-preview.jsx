/**
 * briizify-preview — browser-only harness for the Tasks Panel +
 * briizify flow. Loaded by /briizify-preview.html in Vite dev; the
 * mock import MUST stay first so window.api exists before any app
 * module captures it at module scope.
 */
import './briizify-preview-mock';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OrganizerProvider } from './context/OrganizerContext';
import TasksPanel from './components/TasksPanel';
import './index.css';
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OrganizerProvider>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          boxSizing: 'border-box',
          background: '#050508',
        }}
      >
        <TasksPanel />
      </div>
    </OrganizerProvider>
  </StrictMode>,
);
