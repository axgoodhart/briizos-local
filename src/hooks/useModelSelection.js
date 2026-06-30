// useModelSelection.js
import { useState, useEffect, useCallback } from 'react';

export function useModelSelection() {
  const [models, setModels] = useState([]);
  const [apiKeyStatus, setApiKeyStatus] = useState({ anthropic: false, openai: false, google: false });
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch models and API key status on mount
  useEffect(() => {
    async function load() {
      try {
        const [modelList, keyStatus, savedModel] = await Promise.all([
          window.api.getModels(),
          window.api.checkApiKeys(),
          window.api.localData.settings.get('selected_model'),
        ]);
        setModels(modelList || []);
        setApiKeyStatus(keyStatus || {});
        // If no model selected yet, or selected model no longer exists, pick first available
        if (modelList?.length > 0) {
          const stored = savedModel?.value || null;
          const stillExists = modelList.some(m => m.name === stored);
          if (!stored || !stillExists) {
            const firstAvailable = modelList[0]?.name;
            setSelectedModel(firstAvailable);
            await window.api.localData.settings.set('selected_model', firstAvailable);
          } else {
            setSelectedModel(stored);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Select a model — persist to briizos.db.
  const selectModel = useCallback((modelName) => {
    setSelectedModel(modelName);
    window.api.localData.settings.set('selected_model', modelName);
  }, []);

  // Group models by provider for display
  const modelsByProvider = models.reduce((acc, model) => {
    const provider = model.provider || 'other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});

  // Check if a specific model's provider has API key configured
  const isModelAvailable = useCallback((model) => {
    const provider = model.provider || 'other';
    return apiKeyStatus[provider] === true;
  }, [apiKeyStatus]);

  return {
    models,
    modelsByProvider,
    selectedModel,
    selectModel,
    apiKeyStatus,
    isModelAvailable,
    loading,
    error,
  };
}
