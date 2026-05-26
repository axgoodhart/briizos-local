// ModelPicker.jsx
import { useState, useRef, useEffect } from 'react';

// Provider display config
const PROVIDER_LABELS = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  other: 'Other',
};

// Provider order
const PROVIDER_ORDER = ['claude', 'openai', 'gemini', 'other'];

export default function ModelPicker({ models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Find selected model's display name
  const selected = models.find(m => m.name === selectedModel);
  const displayName = selected?.display_name || selectedModel || 'Select model';

  return (
    <div ref={ref} className="model-picker" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="model-picker-trigger"
        style={{
          background: 'rgba(0,100,100)',
          border: '1px solid var(--border-color, #333)',
          borderRadius: '16px',
          cornerShape: 'var(--ui-corner-shape, round)',
          padding: '10px 0px',
          fontSize: '16px',
          color: 'var(--text-secondary, #aaa)',
          cursor: 'pointer',
          textAlign: 'center',
          justifyContent: 'center',
          display: 'flex',
          gap: '10px',
          width:'180px'
        }}
        title={`Current model: ${displayName}`}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div
          className="model-picker-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginBottom: '4px',
            background: 'var(--bg-secondary, #1a1a1a)',
            border: '1px solid var(--border-color, #333)',
            borderRadius: '8px',
            padding: '6px 0',
            minWidth: '220px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {PROVIDER_ORDER.map(provider => {
            const providerModels = modelsByProvider[provider];
            if (!providerModels || providerModels.length === 0) return null;
            const hasKey = apiKeyStatus[provider];

            return (
              <div key={provider}>
                <div style={{
                  padding: '4px 12px 2px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: hasKey ? 'var(--text-tertiary, #666)' : '#ff6b6b',
                  letterSpacing: '0.5px',
                }}>
                  {PROVIDER_LABELS[provider]}
                  {!hasKey && ' (no API key)'}
                </div>
                {providerModels.map(model => {
                  const available = isModelAvailable(model);
                  const isSelected = model.name === selectedModel;
                  return (
                    <button
                      key={model.name}
                      onClick={() => { selectModel(model.name); setOpen(false); }}
                      disabled={!available}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: isSelected ? 'var(--accent-bg, #2a2a3a)' : 'transparent',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: available
                          ? (isSelected ? 'var(--text-primary, #fff)' : 'var(--text-secondary, #ccc)')
                          : 'var(--text-disabled, #555)',
                        cursor: available ? 'pointer' : 'not-allowed',
                        opacity: available ? 1 : 0.5,
                      }}
                      title={!available ? `Set ${model.provider?.toUpperCase()}_API_KEY to use this model` : model.name}
                    >
                      {model.display_name || model.name}
                      {model.supports_vision && <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.5 }} title="Supports vision">V</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
