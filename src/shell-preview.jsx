/**
 * shell-preview — browser-only harness for the full app shell, used to
 * exercise the chameleon layout modes (grid / duo / windowed) without
 * Electron. Loaded by /shell-preview.html in Vite dev; the mock import MUST
 * stay first so window.api exists before any app module captures it at
 * module scope.
 */
import './shell-preview-mock';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import './AppCombined.css';

document.documentElement.classList.add('theme-runtime-booting');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
