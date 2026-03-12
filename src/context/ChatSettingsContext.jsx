// DEPRECATED: Legacy pre-LangGraph provider settings. Chat visual settings
// (chatBackground, chatBgBlur) still active. Provider/model settings superseded
// by LangGraph model-config.js. Remove when all consumers migrated.
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { setSetting, getSetting } from '../lib/firestore';
import logger from '../lib/logger';

const ChatSettingsContext = createContext(null);

const DEFAULT_MODELS = {
  openai: ['gpt-5.4', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o', 'o3-mini', 'o4-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
  claude: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514'],
};

const DEFAULT_STATE = {
  provider: 'openai',
  providers: {
    openai: { model: 'gpt-5.4', prompt: '', params: { top_p: 1, temperature: 0.7, max_tokens: 4096 }, customModels: [] },
    gemini: { model: 'gemini-2.5-flash', prompt: '', params: { top_p: 1, temperature: 1.0, max_tokens: 4096 }, customModels: [] },
    claude: { model: 'claude-sonnet-4-5-20250929', prompt: '', params: { top_p: 1, temperature: 1.0, max_tokens: 4096 }, customModels: [] },
  },
  snapshots: [],
  chatBackground: '',
  chatBgBlur: 0,
};

const LS_KEY = 'briizos2.chatSettings.v1';

export function ChatSettingsProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch (e) {
      logger.debug('config', 'localStorage read failed', e?.message);
      return DEFAULT_STATE;
    }
  });

  const syncTimeoutRef = useRef(null);

  // Persist to localStorage immediately, debounce Firestore sync
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) { logger.debug('config', 'localStorage write failed', e?.message); }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      setSetting('chatConfig', state).catch(err => logger.error('config', 'Firestore chatConfig sync failed', err?.message));
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [state]);

  // Load from Firestore on mount (merge with localStorage)
  useEffect(() => {
    getSetting('chatConfig').then((remote) => {
      if (remote) {
        setState(prev => ({ ...DEFAULT_STATE, ...remote, ...prev }));
      }
    }).catch(err => logger.error('config', 'Firestore chatConfig load failed', err?.message));
  }, []);

  const setProvider = useCallback((provider) => {
    setState(prev => ({ ...prev, provider }));
  }, []);

  const currentSettings = state.providers[state.provider] || DEFAULT_STATE.providers.openai;

  const updateModel = useCallback((model) => {
    setState(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [prev.provider]: { ...prev.providers[prev.provider], model },
      },
    }));
  }, []);

  const updateParams = useCallback((params) => {
    setState(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [prev.provider]: {
          ...prev.providers[prev.provider],
          params: { ...prev.providers[prev.provider].params, ...params },
        },
      },
    }));
  }, []);

  const updatePrompt = useCallback((prompt) => {
    setState(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [prev.provider]: { ...prev.providers[prev.provider], prompt },
      },
    }));
  }, []);

  const addCustomModel = useCallback((model) => {
    setState(prev => {
      const prov = prev.providers[prev.provider];
      if (prov.customModels.includes(model)) return prev;
      return {
        ...prev,
        providers: {
          ...prev.providers,
          [prev.provider]: { ...prov, customModels: [...prov.customModels, model] },
        },
      };
    });
  }, []);

  const getAllModels = useCallback((provider) => {
    const p = provider || state.provider;
    const defaults = DEFAULT_MODELS[p] || [];
    const custom = state.providers[p]?.customModels || [];
    return [...defaults, ...custom];
  }, [state]);

  const saveSnapshot = useCallback((name) => {
    setState(prev => ({
      ...prev,
      snapshots: [...prev.snapshots, { name, timestamp: Date.now(), state: { ...prev, snapshots: [] } }],
    }));
  }, []);

  const loadSnapshot = useCallback((index) => {
    setState(prev => {
      const snap = prev.snapshots[index];
      if (!snap) return prev;
      return { ...snap.state, snapshots: prev.snapshots };
    });
  }, []);

  const deleteSnapshot = useCallback((index) => {
    setState(prev => ({
      ...prev,
      snapshots: prev.snapshots.filter((_, i) => i !== index),
    }));
  }, []);

  const setChatBackground = useCallback((chatBackground) => {
    setState(prev => ({ ...prev, chatBackground }));
  }, []);

  const setChatBgBlur = useCallback((chatBgBlur) => {
    setState(prev => ({ ...prev, chatBgBlur }));
  }, []);

  const value = {
    provider: state.provider,
    setProvider,
    currentSettings,
    updateModel,
    updateParams,
    updatePrompt,
    addCustomModel,
    getAllModels,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    snapshots: state.snapshots,
    DEFAULT_MODELS,
    chatBackground: state.chatBackground || '',
    setChatBackground,
    chatBgBlur: state.chatBgBlur || 0,
    setChatBgBlur,
  };

  return (
    <ChatSettingsContext.Provider value={value}>
      {children}
    </ChatSettingsContext.Provider>
  );
}

export function useChatSettings() {
  const context = useContext(ChatSettingsContext);
  if (!context) throw new Error('useChatSettings must be used within ChatSettingsProvider');
  return context;
}
