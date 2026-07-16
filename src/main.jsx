import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import './index.css';

document.documentElement.classList.add('theme-runtime-booting');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
