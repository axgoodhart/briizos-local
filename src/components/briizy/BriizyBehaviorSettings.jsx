import { useState } from 'react';
import { useInterfacePreferences } from '../../lib/interfacePreferences';
import { PreferenceChoices } from '../controlbar/DockAppearanceSettings';

export default function BriizyBehaviorSettings() {
  const [preferences, update] = useInterfacePreferences();
  const [notes, setNotes] = useState(preferences.briizyNotes);
  return <div className="briizy-behavior-settings">
    <h3 className="settings-section-title">Briizy · behavior</h3>
    <PreferenceChoices label="Animation" value={preferences.briizyMotion} options={[[true, 'Animated'], [false, 'Still']]}
      onChange={briizyMotion => update({ briizyMotion })} />
    <PreferenceChoices label="Resting place" value={preferences.briizyTuck} options={[[true, 'Tucked at edge'], [false, 'Visible']]}
      onChange={briizyTuck => update({ briizyTuck })} />
    <label className="interface-choice-row">Tuck after inactivity
      <select value={preferences.briizyIdleSeconds} onChange={event => update({ briizyIdleSeconds: Number(event.target.value) })}>
        {[3, 5, 10, 20, 30, 60].map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}
      </select>
    </label>
    <label className="briizy-behavior-notes">
      <textarea value={notes} maxLength={4000} rows={4} onChange={event => setNotes(event.target.value)}
        placeholder="Describe tone, helpful habits, or preferences for Briizy’s replies…" />
      <button type="button" className="settings-btn" disabled={notes === preferences.briizyNotes}
        onClick={() => update({ briizyNotes: notes })}>Save response preferences</button>

    </label>
  </div>;
}
