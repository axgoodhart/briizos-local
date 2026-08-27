import { SHELL_MODES } from '../../hooks/useShellMode';

const MODE_OPTIONS = [
  { id: SHELL_MODES.GRID, label: 'Grid', glyph: '▦', hint: 'Masonry grid only' },
  { id: SHELL_MODES.HYBRID, label: 'Duo', glyph: '◧', hint: 'Grid + floating windows' },
  { id: SHELL_MODES.WINDOWED, label: 'Float', glyph: '❐', hint: 'Floating windows only' },
];

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
      {MODE_OPTIONS.map((option) => (
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
