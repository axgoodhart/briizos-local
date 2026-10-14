import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Text that edits in place and saves when you leave it.
export function EditableText({ value, onCommit, placeholder = '', multiline = true, className = '' }) {
  const ref = useRef(null);
  const [draft, setDraft] = useState(value || '');
  const focused = useRef(false);

  useEffect(() => { if (!focused.current) setDraft(value || ''); }, [value]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !multiline) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, multiline]);

  const commit = () => {
    focused.current = false;
    if ((draft || '') !== (value || '')) onCommit(draft);
  };

  const Tag = multiline ? 'textarea' : 'input';
  return (
    <Tag
      ref={ref}
      className={`fo-edit ${className}`}
      value={draft}
      rows={multiline ? 1 : undefined}
      placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { setDraft(value || ''); e.currentTarget.blur(); }
        if (e.key === 'Enter' && (!multiline || e.metaKey)) { e.preventDefault(); e.currentTarget.blur(); }
      }}
    />
  );
}

// One-line input that adds an item on Enter and clears itself.
export function AddLine({ placeholder, onAdd }) {
  const [text, setText] = useState('');
  return (
    <input
      className="fo-addline"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && text.trim()) {
          onAdd(text.trim());
          setText('');
        }
      }}
    />
  );
}

export function Check({ done, onToggle, title }) {
  return (
    <button type="button" className="fo-check" aria-pressed={done} onClick={onToggle} title={title}>
      <span className="fo-glyph">{done ? '􀆅' : ''}</span>
    </button>
  );
}
