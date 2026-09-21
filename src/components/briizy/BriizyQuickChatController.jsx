import { useCallback, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useChatSettings } from '../../context/ChatSettingsContext';
import { useModelSelection } from '../../hooks/useModelSelection';
import logger from '../../lib/logger';

const SESSION_KEY = 'briizy_quick_chat_session';
export const BRIIZY_CONVERSATION_GAP_MS = 10 * 60 * 1000;

function sendToBriizy(requestId, update) {
  window.briizy?.shell?.sendChatResponse?.({ requestId, ...update });
}

/**
 * The one bridge between Briizy's desktop window and saved Chats.
 *
 * The pet owns only its compact presentation. This controller owns every
 * conversation concern so a Briizy message uses the same model, persistence,
 * logging, permission prompts, and tool rules as a message typed in Chats.
 */
export default function BriizyQuickChatController() {
  const { provider, currentSettings } = useChatSettings();
  const { models, selectedModel, loading: modelsLoading } = useModelSelection();
  const selectedProfile = models.find((model) => model.name === selectedModel) || null;
  const requestSettings = selectedProfile?.provider === provider ? currentSettings?.params : null;
  const {
    threadId,
    isLoading,
    isSwitchingThread,
    pendingToolConfirmation,
    openThread,
    startNewConversation,
    sendMessage,
  } = useChat({ selectedModel, requestSettings });
  const sessionRef = useRef({ threadId: null, lastMessageAt: 0 });

  useEffect(() => {
    let active = true;
    window.api?.localData?.settings?.get(SESSION_KEY)
      .then((saved) => {
        const value = saved?.value;
        if (!active || !value || typeof value !== 'object') return;
        const lastMessageAt = Number(value.lastMessageAt) || 0;
        sessionRef.current = {
          threadId: typeof value.threadId === 'string' ? value.threadId : null,
          lastMessageAt,
        };
      })
      .catch((error) => logger.warn('briizy.chat', 'Briizy could not restore its recent conversation, so the next message will begin a new one.', { error: error?.message }));
    return () => { active = false; };
  }, []);

  const saveSession = useCallback((next) => {
    sessionRef.current = next;
    window.api?.localData?.settings?.set(SESSION_KEY, next)
      .catch((error) => logger.warn('briizy.chat', 'Briizy could not save its recent conversation marker. The message itself is still saved in Chats.', { error: error?.message }));
  }, []);

  useEffect(() => {
    if (!pendingToolConfirmation) return;
    sendToBriizy(null, {
      status: 'approval',
      response: 'I need your approval in briizOS before I can continue.',
    });
  }, [pendingToolConfirmation]);

  useEffect(() => {
    const off = window.briizy?.onQuickChat?.(async (request) => {
      const requestId = request?.requestId;
      const message = typeof request?.message === 'string' ? request.message.trim() : '';
      if (!requestId || !message) return;
      if (modelsLoading || isSwitchingThread) {
        sendToBriizy(requestId, { status: 'error', response: 'Briizy is getting Chats ready. Please send that again in a moment.' });
        return;
      }
      if (!selectedModel) {
        sendToBriizy(requestId, { status: 'error', response: 'Choose an available model in Chats before asking Briizy.' });
        return;
      }
      if (isLoading || pendingToolConfirmation) {
        sendToBriizy(requestId, { status: 'error', response: 'I am still finishing the previous reply. Please wait a moment.' });
        return;
      }

      const now = Date.now();
      const prior = sessionRef.current;
      const isNewConversation = !prior.threadId || now - prior.lastMessageAt > BRIIZY_CONVERSATION_GAP_MS;
      try {
        if (isNewConversation) {
          startNewConversation();
          logger.info('briizy.chat', 'Briizy began a new saved conversation because there was no recent Briizy message for ten minutes.', {
            previousThreadId: prior.threadId,
            gapMinutes: prior.lastMessageAt ? Math.round((now - prior.lastMessageAt) / 60000) : null,
            effect: 'Earlier conversations remain saved in Chats. This message begins a separate conversation.',
          });
        } else if (prior.threadId !== threadId) {
          await openThread(prior.threadId);
        }

        sendToBriizy(requestId, { status: 'working', response: '' });
        await sendMessage(message, {
          onThread: (nextThreadId) => saveSession({ threadId: nextThreadId, lastMessageAt: now }),
          onResponse: (update) => sendToBriizy(requestId, update),
        });
      } catch (error) {
        logger.error('briizy.chat', 'Briizy could not send the quick-chat message. The conversation was left unchanged.', { error: error?.message });
        sendToBriizy(requestId, { status: 'error', response: error?.message || 'I could not send that. Please try again.' });
      }
    });
    return () => off?.();
  }, [isLoading, isSwitchingThread, modelsLoading, openThread, pendingToolConfirmation, selectedModel, sendMessage, saveSession, startNewConversation, threadId]);

  return null;
}
