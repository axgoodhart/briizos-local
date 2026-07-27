/**
 * Overlay renderer entry (PLAN-BRIIZY.md §9).
 *
 * A separate Vite entry from the main app: this window renders one avatar and its
 * bubbles over a transparent background, and shares nothing with the workspace
 * UI beyond the preload bridge.
 */

import { createRoot } from 'react-dom/client';
import { BriizyShell } from './BriizyShell.jsx';
import './briizy.css';

createRoot(document.getElementById('briizy-root')).render(<BriizyShell />);
