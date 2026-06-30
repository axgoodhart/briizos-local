import { useState, useEffect, useCallback } from 'react';
import logger from '../lib/logger';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const next = await window.api.localData.recorder.list();
    setSessions(next);
    setIsLoading(false);
    return next;
  }, []);

  // Recorder state is local-first and refreshes when Main commits a change.
  useEffect(() => {
    fetchSessions().catch((error) => {
      logger.error('ui', 'Failed to load recording sessions', error?.message);
      setIsLoading(false);
    });

    const unsubscribe = window.api.localData.onChanged((change) => {
      if (change?.domains?.includes('recorder')) fetchSessions().catch(() => {});
    });
    return () => unsubscribe();
  }, [fetchSessions]);

  // Start recording a new session
  const startRecording = useCallback(async (name) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sessionName = name || `Session ${timestamp}`;
      const { row: session } = await window.api.localData.recorder.create(sessionName);
      setActiveSession(session);
      setIsRecording(true);
      return session;
    } catch (error) {
      logger.error('ui', 'Failed to start recording', error?.message);
      throw error;
    }
  }, []);

  // Stop the current recording
  const stopRecording = useCallback(async () => {
    if (!activeSession) return null;

    try {
      const { row: endedSession } = await window.api.localData.recorder.end(activeSession.id);
      setActiveSession(null);
      setIsRecording(false);
      return endedSession;
    } catch (error) {
      logger.error('ui', 'Failed to stop recording', error?.message);
      throw error;
    }
  }, [activeSession]);

  // Toggle recording on/off
  const toggleRecording = useCallback(async (name) => {
    if (isRecording) {
      return await stopRecording();
    } else {
      return await startRecording(name);
    }
  }, [isRecording, startRecording, stopRecording]);

  // Record an event to the current session
  const recordEvent = useCallback(async (eventType, eventData) => {
    if (!isRecording || !activeSession) return;
    try {
      await window.api.localData.recorder.addEvent(activeSession.id, eventType, eventData);
    } catch (error) {
      logger.error('ui', 'Failed to record event', error?.message);
    }
  }, [isRecording, activeSession]);

  // Get a specific session with full data
  const getSession = useCallback(async (sessionId) => {
    try {
      return await window.api.localData.recorder.get(sessionId);
    } catch (error) {
      logger.error('ui', 'Failed to get session', error?.message);
      throw error;
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await window.api.localData.recorder.archive(sessionId);
    } catch (error) {
      logger.error('ui', 'Failed to delete session', error?.message);
      throw error;
    }
  }, []);

  // Rename a session
  const renameSession = useCallback(async (sessionId, newName) => {
    try {
      await window.api.localData.recorder.rename(sessionId, newName);
    } catch (error) {
      logger.error('ui', 'Failed to rename session', error?.message);
      throw error;
    }
  }, []);

  // Export a session as JSON
  const exportSession = useCallback(async (sessionId) => {
    try {
      const session = await window.api.localData.recorder.get(sessionId);
      return JSON.stringify(session, null, 2);
    } catch (error) {
      logger.error('ui', 'Failed to export session', error?.message);
      throw error;
    }
  }, []);

  return {
    isRecording,
    activeSession,
    sessions,
    isLoading,
    startRecording,
    stopRecording,
    toggleRecording,
    recordEvent,
    getSession,
    deleteSession,
    renameSession,
    exportSession,
    fetchSessions,
  };
}

export default useRecorder;
