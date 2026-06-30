/**
 * Firebase Configuration for briizOS.2
 * Shares the same Firebase project as briizOS-Dev for data sync
 * Uses email/password authentication (matching briizOS-Dev)
 */
import logger from './logger';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  logger.error('auth', 'Firebase config missing required keys', missingKeys);
  logger.error('auth', 'Current config', firebaseConfig);
}

// Initialize Firebase (singleton pattern)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(async (error) => {
  logger.warn('auth', 'Failed to set browserLocalPersistence, falling back to inMemoryPersistence', error?.code || error?.message);
  try {
    await setPersistence(auth, inMemoryPersistence);
    logger.warn('auth', 'Using inMemoryPersistence fallback');
  } catch (fallbackError) {
    logger.error('auth', 'Failed to set auth persistence fallback', fallbackError?.code || fallbackError?.message);
  }
});

// Auth state tracking
let currentUser = null;
let authReady = false;
let authReadyCallbacks = [];

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
  authReadyCallbacks.forEach(cb => cb(user));
  authReadyCallbacks = [];
});

/**
 * Wait for auth to be ready
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    if (authReady) {
      resolve(currentUser);
    } else {
      authReadyCallbacks.push(resolve);
    }
  });
}

/**
 * Wait until persistence setup completes
 */
export async function waitForAuthPersistence() {
  await authPersistenceReady;
}

/**
 * Get current user (requires email/password login)
 * Returns null if not authenticated - user must log in
 */
export async function ensureAuth() {
  logger.debug('auth', 'ensureAuth called, waiting for auth state...');
  await waitForAuth();
  logger.debug('auth', 'Auth state ready', currentUser?.uid || 'null');

  // No longer auto-sign-in anonymously - user must authenticate
  return currentUser;
}

/**
 * Get current user UID (null if not authenticated)
 */
export function getCurrentUid() {
  return currentUser?.uid || null;
}

/**
 * Get current user email (null if not authenticated)
 */
export function getCurrentUserEmail() {
  return currentUser?.email || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!currentUser;
}

export { app, auth };
