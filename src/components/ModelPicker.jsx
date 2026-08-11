// ModelPicker.jsx
import { useState, useRef, useEffect } from 'react';

// Provider display config
const PROVIDER_LABELS = {
  claude: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
  other: 'Other',
};

// Provider order
const PROVIDER_ORDER = ['claude', 'openai', 'gemini', 'other'];

export default function ModelPicker({ models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = models.find(m => m.name === selectedModel);
  const displayName = selected?.display_name || selectedModel || 'Select model';
  const providers = PROVIDER_ORDER.filter(provider => (
    modelsByProvider[provider]?.length > 0
  ));
  const providerKey = providers.join('|');
  const [activeProvider, setActiveProvider] = useState(selected?.provider || providers[0] || 'openai');

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    setActiveProvider(current => {
      if (selected?.provider && providers.includes(selected.provider)) return selected.provider;
      if (!providers.includes(current) && providers[0]) return providers[0];
      return current;
    });
  }, [providerKey, selected?.provider]);

  const activeModels = modelsByProvider[activeProvider] || [];

  return (
    <div ref={ref} className="model-picker">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className="model-picker-trigger"
        title={`Current model: ${displayName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="model-picker-trigger-label">{displayName}</span>
        <span className="model-picker-trigger-arrow" aria-hidden="true">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="model-picker-dropdown" role="dialog" aria-label="Choose AI model">
          <div className="model-picker-providers" role="tablist" aria-label="AI providers">
            {providers.map(provider => {
              const isActive = provider === activeProvider;
              const hasKey = apiKeyStatus[provider];
              return (
                <button
                  type="button"
                  key={provider}
                  className={`model-picker-provider ${isActive ? 'active' : ''} ${hasKey ? '' : 'unavailable'}`}
                  onClick={() => setActiveProvider(provider)}
                  role="tab"
                  aria-selected={isActive}
                  title={hasKey ? PROVIDER_LABELS[provider] : `${PROVIDER_LABELS[provider]} API key is not configured`}
                >
                  {PROVIDER_LABELS[provider]}
                </button>
              );
            })}
          </div>

          <div className="model-picker-models" role="listbox" aria-label={`${PROVIDER_LABELS[activeProvider] || 'Provider'} models`}>
            {activeModels.map(model => {
              const available = isModelAvailable(model);
              const isSelected = model.name === selectedModel;
              return (
                <button
                  type="button"
                  key={model.name}
                  onClick={() => { selectModel(model.name); setOpen(false); }}
                  disabled={!available}
                  className={`model-picker-option ${isSelected ? 'active' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  title={!available ? `Set ${model.provider?.toUpperCase()}_API_KEY to use this model` : model.name}
                >
                  <span>{model.display_name || model.name}</span>
                  {model.supports_vision && <span className="model-vision-mark" title="Supports vision">V</span>}
                </button>
              );
            })}
            {activeModels.length === 0 && (
              <div className="model-picker-empty">No models are available for this provider.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
