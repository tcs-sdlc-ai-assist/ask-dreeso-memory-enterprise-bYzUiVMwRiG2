/**
 * AuthContext — React Context provider for authentication state.
 * Provides signup, login, logout, loginAsPersona, getCurrentSession,
 * and isAuthenticated. Stores session in localStorage.
 * Logs all auth events via AuditLogger.
 *
 * @module AuthContext
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getItem, setItem, removeItem } from '@/utils/storage';
import { getData, getDataById } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';
import { AUTH_KEY, SESSION_KEY, PERSONA_KEY, PERSONA_LIST } from '@/utils/constants';

/**
 * @typedef {object} UserSession
 * @property {string} sessionToken - Random session token string.
 * @property {string} userId - The user ID.
 * @property {string} personaId - The persona ID associated with the session.
 * @property {string} displayName - The user's display name.
 * @property {string} email - The user's email.
 * @property {string} expiresAt - ISO timestamp when the session expires.
 */

/**
 * @typedef {object} AuthContextValue
 * @property {UserSession|null} session - The current user session, or null if unauthenticated.
 * @property {boolean} isAuthenticated - Whether the user is currently authenticated.
 * @property {boolean} loading - Whether the auth state is being initialized.
 * @property {function} signup - Sign up a new user.
 * @property {function} login - Log in with email and password.
 * @property {function} logout - Log out the current user.
 * @property {function} loginAsPersona - Log in as a demo persona.
 * @property {function} getCurrentSession - Get the current session object.
 */

const AuthContext = createContext(null);

/**
 * Session expiry duration in milliseconds (24 hours).
 * @type {number}
 */
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a random session token string.
 * @returns {string} A random token.
 */
function generateSessionToken() {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  return `sess-${timestamp}-${random1}-${random2}`;
}

/**
 * Check whether a session has expired.
 * @param {UserSession|null} session - The session to check.
 * @returns {boolean} True if the session is expired or invalid.
 */
function isSessionExpired(session) {
  if (!session || !session.expiresAt) {
    return true;
  }
  return new Date(session.expiresAt).getTime() <= Date.now();
}

/**
 * Build a session object for a user.
 * @param {object} user - The user record.
 * @returns {UserSession} A new session object.
 */
function buildSession(user) {
  return {
    sessionToken: generateSessionToken(),
    userId: user.id,
    personaId: user.personaId,
    displayName: user.displayName || user.email,
    email: user.email,
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(),
  };
}

/**
 * Persist session to localStorage.
 * @param {UserSession} session - The session to persist.
 */
function persistSession(session) {
  setItem(SESSION_KEY, session);
  setItem(AUTH_KEY, { isAuthenticated: true, userId: session.userId });
  setItem(PERSONA_KEY, session.personaId);
}

/**
 * Clear session from localStorage.
 */
function clearPersistedSession() {
  removeItem(SESSION_KEY);
  removeItem(AUTH_KEY);
  removeItem(PERSONA_KEY);
}

/**
 * Load session from localStorage.
 * @returns {UserSession|null} The stored session, or null if not found or expired.
 */
function loadPersistedSession() {
  const session = getItem(SESSION_KEY, null);
  if (!session || isSessionExpired(session)) {
    clearPersistedSession();
    return null;
  }
  return session;
}

/**
 * AuthProvider component. Wraps children with AuthContext.Provider.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child components.
 * @returns {import('react').ReactElement} The provider element.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedSession = loadPersistedSession();
    if (storedSession) {
      setSession(storedSession);
    }
    setLoading(false);
  }, []);

  /**
   * Sign up a new user with email, password, and personaId.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @param {string} personaId - The persona ID to associate.
   * @returns {UserSession} The new session.
   * @throws {Error} If validation fails or email already exists.
   */
  const signup = useCallback((email, password, personaId) => {
    if (typeof email !== 'string' || email.trim() === '') {
      throw new Error('Email is required');
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (typeof personaId !== 'string' || !PERSONA_LIST.includes(personaId)) {
      throw new Error('Invalid persona selected');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const users = getData('users');

    // Check if email already exists
    const existingUser = users.find(
      (u) => u.email && u.email.toLowerCase() === trimmedEmail
    );
    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Resolve persona for display name
    const persona = getDataById('personas', personaId);
    const displayName = persona ? persona.name : trimmedEmail;

    // Create new user
    const newUser = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
      email: trimmedEmail,
      password: password,
      personaId: personaId,
      displayName: displayName,
      createdAt: new Date().toISOString(),
    };

    // Add user to data store
    const updatedUsers = [...users, newUser];
    const { setData } = require('@/services/dataManager');
    setData('users', updatedUsers);

    // Create session
    const newSession = buildSession(newUser);
    persistSession(newSession);
    setSession(newSession);

    // Log signup event
    auditLog('SIGNUP', newUser.id, personaId, `User signed up: ${trimmedEmail}`, {
      userId: newUser.id,
      email: trimmedEmail,
      personaId: personaId,
    });

    return newSession;
  }, []);

  /**
   * Log in with email and password.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {UserSession} The new session.
   * @throws {Error} If credentials are invalid.
   */
  const login = useCallback((email, password) => {
    if (typeof email !== 'string' || email.trim() === '') {
      throw new Error('Email is required');
    }
    if (typeof password !== 'string' || password.trim() === '') {
      throw new Error('Password is required');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const users = getData('users');

    const user = users.find(
      (u) => u.email && u.email.toLowerCase() === trimmedEmail
    );

    if (!user || user.password !== password) {
      auditLog('LOGIN', null, null, `Failed login attempt: ${trimmedEmail}`, {
        email: trimmedEmail,
        reason: 'Invalid email or password',
      });
      throw new Error('Invalid email or password');
    }

    const newSession = buildSession(user);
    persistSession(newSession);
    setSession(newSession);

    auditLog('LOGIN', user.id, user.personaId, `User logged in: ${trimmedEmail}`, {
      userId: user.id,
      email: trimmedEmail,
      personaId: user.personaId,
    });

    return newSession;
  }, []);

  /**
   * Log out the current user.
   */
  const logout = useCallback(() => {
    const currentSession = session;

    clearPersistedSession();
    setSession(null);

    if (currentSession) {
      auditLog('LOGOUT', currentSession.userId, currentSession.personaId, `User logged out: ${currentSession.email}`, {
        userId: currentSession.userId,
        email: currentSession.email,
        personaId: currentSession.personaId,
      });
    }
  }, [session]);

  /**
   * Log in as a demo persona (quick persona switch).
   *
   * @param {string} personaId - The persona ID to log in as.
   * @returns {UserSession} The new session.
   * @throws {Error} If the persona is invalid or no demo user exists.
   */
  const loginAsPersona = useCallback((personaId) => {
    if (typeof personaId !== 'string' || !PERSONA_LIST.includes(personaId)) {
      throw new Error('Invalid persona ID');
    }

    const users = getData('users');
    const user = users.find((u) => u.personaId === personaId);

    if (!user) {
      // Create a temporary demo user for this persona
      const persona = getDataById('personas', personaId);
      const demoUser = {
        id: `demo-${personaId}`,
        email: `${personaId}@dreeso.com`,
        password: 'demo1234',
        personaId: personaId,
        displayName: persona ? persona.name : personaId,
        createdAt: new Date().toISOString(),
      };

      const newSession = buildSession(demoUser);
      persistSession(newSession);
      setSession(newSession);

      auditLog('PERSONA_SWITCH', demoUser.id, personaId, `Demo login as persona: ${demoUser.displayName}`, {
        userId: demoUser.id,
        personaId: personaId,
        displayName: demoUser.displayName,
        isDemoLogin: true,
      });

      return newSession;
    }

    const newSession = buildSession(user);
    persistSession(newSession);
    setSession(newSession);

    auditLog('PERSONA_SWITCH', user.id, personaId, `Persona login: ${user.displayName}`, {
      userId: user.id,
      email: user.email,
      personaId: personaId,
      displayName: user.displayName,
    });

    return newSession;
  }, []);

  /**
   * Get the current session object.
   *
   * @returns {UserSession|null} The current session, or null if not authenticated.
   */
  const getCurrentSession = useCallback(() => {
    if (session && isSessionExpired(session)) {
      clearPersistedSession();
      setSession(null);
      return null;
    }
    return session;
  }, [session]);

  const isAuthenticated = session !== null && !isSessionExpired(session);

  const value = {
    session,
    isAuthenticated,
    loading,
    signup,
    login,
    logout,
    loginAsPersona,
    getCurrentSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the AuthContext.
 * Throws if used outside of an AuthProvider.
 *
 * @returns {AuthContextValue} The auth context value.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;