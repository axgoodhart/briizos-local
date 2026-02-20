import { useState, useEffect, useCallback } from 'react';
import logger from '../lib/logger';
import {
  subscribeSessions,
  createSession,
  endSession,
  addSessionEvent,
  getSession as getSessionFirestore,
  deleteSession as deleteSessionFirestore,
  renameSession as renameSessionFirestore,
  exportSession as exportSessionFirestore,
} from '../lib/firestore';
import { getCurrentUid } from '../lib/firebase';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to sessions from Firestore
  useEffect(() => {
    const uid = getCurrentUid();
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeSessions((firestoreSessions) => {
      setSessions(firestoreSessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Start recording a new session
  const startRecording = useCallback(async (name) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sessionName = name || `Session ${timestamp}`;
      const session = await createSession(sessionName);
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
      await endSession(activeSession.id);
      const endedSession = { ...activeSession };
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
      await addSessionEvent(activeSession.id, eventType, eventData);
    } catch (error) {
      logger.error('ui', 'Failed to record event', error?.message);
    }
  }, [isRecording, activeSession]);

  // Get a specific session with full data
  const getSession = useCallback(async (sessionId) => {
    try {
      return await getSessionFirestore(sessionId);
    } catch (error) {
      logger.error('ui', 'Failed to get session', error?.message);
      throw error;
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await deleteSessionFirestore(sessionId);
    } catch (error) {
      logger.error('ui', 'Failed to delete session', error?.message);
      throw error;
    }
  }, []);

  // Rename a session
  const renameSession = useCallback(async (sessionId, newName) => {
    try {
      await renameSessionFirestore(sessionId, newName);
    } catch (error) {
      logger.error('ui', 'Failed to rename session', error?.message);
      throw error;
    }
  }, []);

  // Export a session as JSON
  const exportSession = useCallback(async (sessionId) => {
    try {
      return await exportSessionFirestore(sessionId);
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
    fetchSessions: () => {}, // No-op; real-time subscription handles this
  };
}

export default useRecorder;
