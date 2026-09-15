import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import moodSheet from '../../briizy/assets/briizy-moods.png';
import { useInterfacePreferences } from '../../lib/interfacePreferences';
import { askBriizy, useBriizyConversation } from '../../lib/briizyConversation';

// Behavior is deliberately explicit here: hover/focus reveals, inactivity tucks,
// and replies select a sprite. Preferences are editable in System → briizy.
export default function BriizyCompanion({ onOpenChat, onOpenSettings, visible = true }) {
  const [preferences] = useInterfacePreferences();
  const conversation = useBriizyConversation();
  const [revealed, setRevealed] = useState(false);
  const [talking, setTalking] = useState(false);
  const [input, setInput] = useState('');
  const timer = useRef(null);
  const busy = ['queued', 'working', 'approval'].includes(conversation.status);
  const wake = () => {
    setRevealed(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (!busy && !input.trim()) { setRevealed(false); setTalking(false); } }, preferences.briizyIdleSeconds * 1000);
  };
  useEffect(() => {
    if (busy || conversation.response) { setRevealed(true); setTalking(true); }
    clearTimeout(timer.current);
    if (!busy && !input.trim()) timer.current = setTimeout(() => { setRevealed(false); setTalking(false); }, preferences.briizyIdleSeconds * 1000);
    return () => clearTimeout(timer.current);
  }, [busy, conversation.response, input, preferences.briizyIdleSeconds]);
  const tucked = preferences.briizyTuck && !revealed && !busy && !input.trim();
  const mood = conversation.status === 'error' ? 2 : busy ? 3 : talking ? 5 : tucked ? 4 : 0;
  if (!visible) return null;
  return createPortal(<aside className={`briizy-companion${preferences.dockEdge === 'right' ? ' is-left' : ''}${tucked ? ' is-tucked' : ''}${preferences.briizyMotion ? ' is-animated' : ''}`}
    aria-label="Briizy" onPointerMove={wake} onPointerDown={wake} onFocus={wake} onKeyDown={wake}>
    {talking && <div className="briizy-companion-bubble">
      <div className="briizy-companion-actions">
        <button type="button" onClick={onOpenSettings}>Behavior</button>
        <button type="button" onClick={onOpenChat}>Chats</button>
        <button type="button" aria-label="Tuck Briizy away" onClick={() => { setTalking(false); setRevealed(false); }}>×</button>
      </div>
      <div className="briizy-companion-response" role="status" aria-live="polite">
        {conversation.status === 'approval' ? 'Your approval is needed in Chats before I can continue.' : conversation.response || (busy ? 'Thinking…' : 'What’s on your mind?')}
      </div>
      <form onSubmit={event => {
        event.preventDefault();
        if (!input.trim() || busy) return;
        askBriizy(input.trim(), preferences.briizyNotes);
        setInput('');
        onOpenChat();
      }}>
        <input aria-label="Message Briizy" placeholder="Talk to Briizy…" value={input} onChange={event => setInput(event.target.value)} />
        <button type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>}
    <button className="briizy-companion-avatar" type="button" aria-label="Talk to Briizy" aria-expanded={talking}
      onClick={() => { setTalking(value => !value); wake(); }}>
      <span className="briizy-companion-sprite" style={{ backgroundImage: `url(${moodSheet})`, backgroundPositionX: `${mood * 20}%` }} />
    </button>
  </aside>, document.body);
}
