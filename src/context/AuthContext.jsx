/**
 * AuthContext - Authentication state management for briizOS.2
 * Provides email/password authentication matching briizOS-Dev
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, waitForAuthPersistence } from '../lib/firebase';
import logger from '../lib/logger';

const AuthContext = createContext(null);
const AUTH_REQUEST_TIMEOUT_MS = 20000;

function withAuthTimeout(authPromise, operationLabel) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const timeoutError = new Error(`${operationLabel} timed out`);
      timeoutError.code = 'auth/request-timeout';
      reject(timeoutError);
    }, AUTH_REQUEST_TIMEOUT_MS);

    authPromise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function shouldAutoCreateFromLoginError(error) {
  return error?.code === 'auth/user-not-found'
    || error?.code === 'auth/invalid-credential'
    || error?.code === 'auth/invalid-login-credentials';
}

function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network request failed. Check your connection and try again.';
    case 'auth/request-timeout':
      return 'Authentication request timed out. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a moment.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    default:
      return error?.message || error?.code || 'Authentication failed.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (authError) => {
        logger.error('auth', 'onAuthStateChanged error', authError?.message);
        setError(getAuthErrorMessage(authError));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   * Auto-create account if sign-in indicates an unknown user
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    const normalizedEmail = normalizeEmail(email);

    try {
      await waitForAuthPersistence();
      const userCredential = await withAuthTimeout(
        signInWithEmailAndPassword(auth, normalizedEmail, password),
        'Sign in'
      );
      return userCredential.user;
    } catch (signInErr) {
      if (shouldAutoCreateFromLoginError(signInErr)) {
        // Auto-create account if sign-in fails due unknown email semantics.
        try {
          await waitForAuthPersistence();
          const userCredential = await withAuthTimeout(
            createUserWithEmailAndPassword(auth, normalizedEmail, password),
            'Account creation'
          );
          return userCredential.user;
        } catch (createErr) {
          // Existing account + wrong password path when Firebase returns invalid-credential.
          if (createErr?.code === 'auth/email-already-in-use') {
            try {
              await waitForAuthPersistence();
              const userCredential = await withAuthTimeout(
                signInWithEmailAndPassword(auth, normalizedEmail, password),
                'Sign in retry'
              );
              return userCredential.user;
            } catch (retryErr) {
              setError(getAuthErrorMessage(retryErr));
              throw retryErr;
            }
          }

          setError(getAuthErrorMessage(createErr));
          throw createErr;
        }
      }

      setError(getAuthErrorMessage(signInErr));
      throw signInErr;
    }
  }, []);

  /**
   * Create a new account with email and password
   */
  const signup = useCallback(async (email, password) => {
    setError(null);
    const normalizedEmail = normalizeEmail(email);

    try {
      await waitForAuthPersistence();
      const userCredential = await withAuthTimeout(
        createUserWithEmailAndPassword(auth, normalizedEmail, password),
        'Sign up'
      );
      return userCredential.user;
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err;
    }
  }, []);

  /**
   * Sign out the current user
   */
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err;
    }
  }, []);

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
