import { SHELL_MODES } from '../../hooks/useShellMode';

/* Glyphs are SF Symbols from the SF Pro font (private-use codepoints):
   U+1003DF rectangle.split.3x1 and U+1003DE dock.rectangle. */
const MODE_OPTIONS = [
  { id: SHELL_MODES.GRID, label: 'Grid', glyph: '\u{1003DF}', hint: 'Masonry grid only' },
  { id: SHELL_MODES.HYBRID, label: 'Duo', glyph: '\u{1003DE}', hint: 'Grid + floating windows' },
  { id: SHELL_MODES.WINDOWED, label: 'Float', glyph: '\u{1003DE}', hint: 'Floating windows only' },
];

/* Hybrid stays wired up (useShellMode, cycleMode, App handlers) but is not
   offered in the control for now. */
const HIDDEN_MODES = new Set([SHELL_MODES.HYBRID]);
const VISIBLE_OPTIONS = MODE_OPTIONS.filter((option) => !HIDDEN_MODES.has(option.id));

/**
 * ShellModeSwitch — the chameleon control. One segmented control rendered in
 * the grid header and in the floating dock, so at least one instance is
 * visible in every mode.
 */
export function ShellModeSwitch({ mode, onChange, compact = false }) {
  return (
    <div
      className={`shell-mode-switch ${compact ? 'is-compact' : ''}`}
      role="group"
      aria-label="Layout mode"
    >
      {VISIBLE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`shell-mode-option ${mode === option.id ? 'on' : ''}`}
          onClick={() => onChange(option.id)}
          title={`${option.label} — ${option.hint}`}
          aria-pressed={mode === option.id}
          aria-label={`${option.label} layout: ${option.hint}`}
        >
          <span className="shell-mode-glyph" aria-hidden="true">{option.glyph}</span>
          <span className="shell-mode-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default ShellModeSwitch;
