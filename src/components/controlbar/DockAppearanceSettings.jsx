import { useInterfacePreferences } from '../../lib/interfacePreferences';

export function PreferenceChoices({ label, value, options, onChange }) {
  return <div className="interface-choice-row">
    <span>{label}</span>
    <div className="interface-choices" role="group" aria-label={label}>
      {options.map(([id, text]) => <button type="button" key={String(id)}
        className="settings-btn" aria-pressed={id === value}
        onClick={() => onChange(id)}>{text}</button>)}
    </div>
  </div>;
}

export default function DockAppearanceSettings() {
  const [preferences, update] = useInterfacePreferences();
  return <div className="dock-appearance-settings">
    <PreferenceChoices label="Dock icons · both modes" value={preferences.dockColors}
      options={[["monochrome", "Monochrome"], ["colored", "Colored"]]} onChange={dockColors => update({ dockColors })} />
    <PreferenceChoices label="Floating dock edge" value={preferences.dockEdge}
      options={[["top", "Top"], ["bottom", "Bottom"], ["left", "Left"], ["right", "Right"]]} onChange={dockEdge => update({ dockEdge })} />
    <PreferenceChoices label="Floating dock visibility" value={preferences.dockAutoHide}
      options={[[false, "Always visible"], [true, "Auto hide"]]} onChange={dockAutoHide => update({ dockAutoHide })} />
  </div>;
}
