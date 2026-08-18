/**
 * LoginOverlay - Email/Password authentication overlay for briizOS.2
 * Styled to match briizOS-Dev login screen
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import logger from '../lib/logger';
import '../AppCombined.css';

function LoginOverlay() {
  const { login, signup, error, clearError, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [visible, setVisible] = useState(true);
  const emailRef = useRef(null);

  // Focus email input on mount
  useEffect(() => {
    if (emailRef.current && !isAuthenticated) {
      emailRef.current.focus();
    }
  }, [isAuthenticated]);

  // Handle fade out when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setVisible(false);
    }
  }, [isAuthenticated]);

  // Clear errors when inputs change
  useEffect(() => {
    if (localError || error) {
      setLocalError('');
      clearError();
    }
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      // Error is already set in context
      logger.error('auth', 'Login error', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setLocalError('');
    clearError();
  };

  // Don't render if loading initial auth state or already authenticated
  if (loading) {
    return (
      <div className="login-overlay">
        <div className="login-container">
          <div className="login-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!visible) {
    return null;
  }

  const displayError = localError || error;

  return (
    <div className={`login-overlay ${isAuthenticated ? 'hide' : ''}`}>
      <div className="login-container">
        {/* Logo Area */}
        <div className="login-logo-wrap">
          <div className="login-logo-circle" />
          <div className="login-logo-text">briizOS</div>
        </div>

        <div className="login-subtitle">
          before work: <span>breath</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            ref={emailRef}
            type="email"
            className="login-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
          />

          <input
            type="password"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {displayError && (
            <div className="login-error">{displayError}</div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'LOADING...' : isSignup ? 'CREATE ACCOUNT' : 'INITIALIZE SYSTEM'}
          </button>
          <button type="button" className="login-btn" onClick={() => setVisible(false)} disabled={isSubmitting}>
            CONTINUE OFFLINE
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="login-toggle">
          <span onClick={toggleMode} className="login-toggle-link">
            {isSignup ? 'Already have an account? Log in' : 'New user? Create account'}
          </span>
        </div>

        {/* Info Footer */}
        <div className="login-info">
          Local work is always available; sign-in adds recovery and remote task requests.
          <br />
          <span className="login-footer-author">by alexgoodh.art</span>
        </div>
      </div>
    </div>
  );
}

export default LoginOverlay;
