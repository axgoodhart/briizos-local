// ModelPicker.jsx
import { useState, useRef, useEffect, useId } from 'react';

// Provider display config
const PROVIDER_LABELS = {
  claude: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
  other: 'Other',
};

// Provider order
const PROVIDER_ORDER = ['claude', 'openai', 'gemini', 'other'];

function moveRovingFocus(event, selectOnFocus = false) {
  const direction = {
    ArrowDown: 1,
    ArrowRight: 1,
    ArrowUp: -1,
    ArrowLeft: -1,
  }[event.key];
  const isBoundaryKey = event.key === 'Home' || event.key === 'End';
  if (!direction && !isBoundaryKey) return;

  const items = [...event.currentTarget.parentElement.querySelectorAll('button:not(:disabled)')];
  if (items.length === 0) return;
  event.preventDefault();

  const currentIndex = items.indexOf(event.currentTarget);
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? items.length - 1
      : (currentIndex + direction + items.length) % items.length;
  const nextItem = items[nextIndex];
  nextItem?.focus();
  if (selectOnFocus) nextItem?.click();
}

export default function ModelPicker({ models, modelsByProvider, selectedModel, selectModel, isModelAvailable, apiKeyStatus }) {
  const [pinned, setPinned] = useState(false);
  const ref = useRef(null);
  const pickerId = useId();

  const selected = models.find(m => m.name === selectedModel);
  const displayName = selected?.display_name || selectedModel || 'Select model';
  const providers = PROVIDER_ORDER.filter(provider => (
    modelsByProvider[provider]?.length > 0
  ));
  const providerKey = providers.join('|');
  const [activeProvider, setActiveProvider] = useState(selected?.provider || providers[0] || 'openai');

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setPinned(false);
    }
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      setPinned(false);
      ref.current?.querySelector('.model-picker-trigger')?.focus();
    }
    if (pinned) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pinned]);

  useEffect(() => {
    setActiveProvider(current => {
      if (selected?.provider && providers.includes(selected.provider)) return selected.provider;
      if (!providers.includes(current) && providers[0]) return providers[0];
      return current;
    });
  }, [providerKey, selected?.provider]);

  const activeModels = modelsByProvider[activeProvider] || [];
  const activeProviderLabel = PROVIDER_LABELS[activeProvider] || 'Models';
  const focusableModel = activeModels.find(model => model.name === selectedModel && isModelAvailable(model))
    || activeModels.find(isModelAvailable);

  return (
    <div ref={ref} className="model-picker">
      <button
        type="button"
        onClick={() => setPinned(current => !current)}
        className="model-picker-trigger"
        title={`Current model: ${displayName}`}
        aria-haspopup="dialog"
        aria-expanded={pinned}
        aria-controls={pickerId}
      >
        <span className="model-picker-trigger-label">{displayName}</span>
        <span className="model-picker-trigger-arrow" aria-hidden="true" />
      </button>

      <div id={pickerId} className="model-picker-dropdown" role="dialog" aria-label="Choose AI model">
        <div className="model-picker-providers" role="tablist" aria-label="AI providers">
          <div className="interaction-toolbar-section-title" aria-hidden="true">
            <span>Provider</span>
            <span>{providers.length}</span>
          </div>
          {providers.map(provider => {
            const isActive = provider === activeProvider;
            const hasKey = apiKeyStatus[provider];
            return (
              <button
                type="button"
                key={provider}
                className={`model-picker-provider ${isActive ? 'active' : ''} ${hasKey ? '' : 'unavailable'}`}
                onClick={() => setActiveProvider(provider)}
                onKeyDown={(event) => moveRovingFocus(event, true)}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`${pickerId}-models`}
                title={hasKey ? PROVIDER_LABELS[provider] : `${PROVIDER_LABELS[provider]} API key is not configured`}
              >
                <span>{PROVIDER_LABELS[provider]}</span>
                <span className="model-picker-provider-count">{modelsByProvider[provider].length}</span>
              </button>
            );
          })}
        </div>

        <div id={`${pickerId}-models`} className="model-picker-models" role="listbox" aria-label={`${activeProviderLabel} models`}>
          <div className="interaction-toolbar-section-title" aria-hidden="true">
            <span>{activeProviderLabel}</span>
            <span>{activeModels.length} models</span>
          </div>
          {!apiKeyStatus[activeProvider] && (
            <div className="model-picker-provider-note">Add an API key in Settings to use these models.</div>
          )}
          {activeModels.map(model => {
            const available = isModelAvailable(model);
            const isSelected = model.name === selectedModel;
            return (
              <button
                type="button"
                key={model.name}
                onClick={() => { selectModel(model.name); setPinned(false); }}
                onKeyDown={moveRovingFocus}
                disabled={!available}
                tabIndex={model.name === focusableModel?.name ? 0 : -1}
                className={`model-picker-option ${isSelected ? 'active' : ''}`}
                role="option"
                aria-selected={isSelected}
                title={!available ? `Set ${model.provider?.toUpperCase()}_API_KEY to use this model` : model.name}
              >
                <span className="model-picker-option-name">{model.display_name || model.name}</span>
                {model.supports_vision && <span className="model-vision-mark" title="Supports vision">Vision</span>}
              </button>
            );
          })}
          {activeModels.length === 0 && (
            <div className="model-picker-empty">No models are listed for this provider.</div>
          )}
        </div>
      </div>
    </div>
  );
}
