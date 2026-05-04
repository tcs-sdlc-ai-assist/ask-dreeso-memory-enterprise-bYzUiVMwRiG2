/**
 * AuthContext.test.jsx — Unit tests for AuthContext.
 * Tests signup, login, logout, loginAsPersona, session persistence
 * in localStorage, and invalid credential handling.
 *
 * @module AuthContext.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SESSION_KEY, AUTH_KEY, PERSONA_KEY } from '@/utils/constants';

/**
 * Helper to render the useAuth hook within an AuthProvider.
 * @returns {import('@testing-library/react').RenderHookResult} The render hook result.
 */
function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts with no session and isAuthenticated false', () => {
      const { result } = renderAuthHook();

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('useAuth outside provider', () => {
    it('throws an error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('login', () => {
    it('logs in with valid credentials and returns a session', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      expect(session).toBeDefined();
      expect(session.email).toBe('lukas.muller@dreeso.com');
      expect(session.displayName).toBe('Lukas Müller');
      expect(session.personaId).toBe('persona-lukas');
      expect(session.sessionToken).toBeTruthy();
      expect(session.expiresAt).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.session).not.toBeNull();
      expect(result.current.session.email).toBe('lukas.muller@dreeso.com');
    });

    it('persists session to localStorage after login', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.login('elena.rossi@dreeso.com', 'demo1234');
      });

      const storedSession = JSON.parse(localStorage.getItem(SESSION_KEY));
      expect(storedSession).not.toBeNull();
      expect(storedSession.email).toBe('elena.rossi@dreeso.com');
      expect(storedSession.personaId).toBe('persona-elena');

      const storedAuth = JSON.parse(localStorage.getItem(AUTH_KEY));
      expect(storedAuth).not.toBeNull();
      expect(storedAuth.isAuthenticated).toBe(true);

      const storedPersona = JSON.parse(localStorage.getItem(PERSONA_KEY));
      expect(storedPersona).toBe('persona-elena');
    });

    it('throws an error for invalid email', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.login('nonexistent@dreeso.com', 'demo1234');
        });
      }).toThrow('Invalid email or password');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
    });

    it('throws an error for invalid password', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.login('lukas.muller@dreeso.com', 'wrongpassword');
        });
      }).toThrow('Invalid email or password');

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('throws an error for empty email', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.login('', 'demo1234');
        });
      }).toThrow('Email is required');
    });

    it('throws an error for empty password', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.login('lukas.muller@dreeso.com', '');
        });
      }).toThrow('Password is required');
    });

    it('handles case-insensitive email matching', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.login('LUKAS.MULLER@DREESO.COM', 'demo1234');
      });

      expect(session).toBeDefined();
      expect(session.displayName).toBe('Lukas Müller');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('trims whitespace from email', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.login('  lukas.muller@dreeso.com  ', 'demo1234');
      });

      expect(session).toBeDefined();
      expect(session.email).toBe('lukas.muller@dreeso.com');
    });
  });

  describe('logout', () => {
    it('clears session and sets isAuthenticated to false', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears session from localStorage on logout', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_KEY)).toBeNull();
      expect(localStorage.getItem(PERSONA_KEY)).toBeNull();
    });

    it('does not throw when logging out without a session', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signup', () => {
    it('creates a new user and returns a session', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.signup('newuser@example.com', 'password123', 'persona-lukas');
      });

      expect(session).toBeDefined();
      expect(session.email).toBe('newuser@example.com');
      expect(session.personaId).toBe('persona-lukas');
      expect(session.sessionToken).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('persists session to localStorage after signup', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.signup('signuptest@example.com', 'password123', 'persona-elena');
      });

      const storedSession = JSON.parse(localStorage.getItem(SESSION_KEY));
      expect(storedSession).not.toBeNull();
      expect(storedSession.email).toBe('signuptest@example.com');
      expect(storedSession.personaId).toBe('persona-elena');
    });

    it('throws an error for empty email', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.signup('', 'password123', 'persona-lukas');
        });
      }).toThrow('Email is required');
    });

    it('throws an error for short password', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.signup('test@example.com', '12345', 'persona-lukas');
        });
      }).toThrow('Password must be at least 6 characters');
    });

    it('throws an error for invalid persona ID', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.signup('test@example.com', 'password123', 'invalid-persona');
        });
      }).toThrow('Invalid persona selected');
    });

    it('throws an error for duplicate email', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.signup('lukas.muller@dreeso.com', 'password123', 'persona-lukas');
        });
      }).toThrow('An account with this email already exists');
    });
  });

  describe('loginAsPersona', () => {
    it('logs in as a demo persona and returns a session', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.loginAsPersona('persona-lukas');
      });

      expect(session).toBeDefined();
      expect(session.personaId).toBe('persona-lukas');
      expect(session.displayName).toBe('Lukas Müller');
      expect(session.sessionToken).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('logs in as each persona successfully', () => {
      const personaIds = ['persona-lukas', 'persona-elena', 'persona-sophie', 'persona-james'];
      const expectedNames = ['Lukas Müller', 'Elena Rossi', 'Sophie Dubois', 'James Carter'];

      for (let i = 0; i < personaIds.length; i++) {
        const { result } = renderAuthHook();

        let session;
        act(() => {
          session = result.current.loginAsPersona(personaIds[i]);
        });

        expect(session.personaId).toBe(personaIds[i]);
        expect(session.displayName).toBe(expectedNames[i]);
        expect(result.current.isAuthenticated).toBe(true);
      }
    });

    it('persists session to localStorage after loginAsPersona', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.loginAsPersona('persona-sophie');
      });

      const storedSession = JSON.parse(localStorage.getItem(SESSION_KEY));
      expect(storedSession).not.toBeNull();
      expect(storedSession.personaId).toBe('persona-sophie');

      const storedPersona = JSON.parse(localStorage.getItem(PERSONA_KEY));
      expect(storedPersona).toBe('persona-sophie');
    });

    it('throws an error for invalid persona ID', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.loginAsPersona('invalid-persona');
        });
      }).toThrow('Invalid persona ID');
    });

    it('throws an error for empty persona ID', () => {
      const { result } = renderAuthHook();

      expect(() => {
        act(() => {
          result.current.loginAsPersona('');
        });
      }).toThrow('Invalid persona ID');
    });

    it('replaces existing session when switching personas', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.loginAsPersona('persona-lukas');
      });

      expect(result.current.session.personaId).toBe('persona-lukas');

      act(() => {
        result.current.loginAsPersona('persona-james');
      });

      expect(result.current.session.personaId).toBe('persona-james');
      expect(result.current.session.displayName).toBe('James Carter');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('getCurrentSession', () => {
    it('returns the current session when authenticated', () => {
      const { result } = renderAuthHook();

      act(() => {
        result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      let currentSession;
      act(() => {
        currentSession = result.current.getCurrentSession();
      });

      expect(currentSession).not.toBeNull();
      expect(currentSession.email).toBe('lukas.muller@dreeso.com');
    });

    it('returns null when not authenticated', () => {
      const { result } = renderAuthHook();

      let currentSession;
      act(() => {
        currentSession = result.current.getCurrentSession();
      });

      expect(currentSession).toBeNull();
    });
  });

  describe('session persistence', () => {
    it('restores session from localStorage on mount', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const mockSession = {
        sessionToken: 'sess-test-token',
        userId: 'user-001',
        personaId: 'persona-lukas',
        displayName: 'Lukas Müller',
        email: 'lukas.muller@dreeso.com',
        expiresAt: futureDate,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.session).not.toBeNull();
      expect(result.current.session.email).toBe('lukas.muller@dreeso.com');
      expect(result.current.session.personaId).toBe('persona-lukas');
    });

    it('does not restore an expired session from localStorage', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const mockSession = {
        sessionToken: 'sess-expired-token',
        userId: 'user-001',
        personaId: 'persona-lukas',
        displayName: 'Lukas Müller',
        email: 'lukas.muller@dreeso.com',
        expiresAt: pastDate,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));

      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
    });

    it('clears localStorage when expired session is found', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const mockSession = {
        sessionToken: 'sess-expired-token',
        userId: 'user-001',
        personaId: 'persona-lukas',
        displayName: 'Lukas Müller',
        email: 'lukas.muller@dreeso.com',
        expiresAt: pastDate,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(mockSession));
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated: true, userId: 'user-001' }));

      renderAuthHook();

      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_KEY)).toBeNull();
    });

    it('does not restore session when localStorage is empty', () => {
      const { result } = renderAuthHook();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('session token generation', () => {
    it('generates unique session tokens for different logins', () => {
      const { result } = renderAuthHook();

      let session1;
      act(() => {
        session1 = result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      act(() => {
        result.current.logout();
      });

      let session2;
      act(() => {
        session2 = result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      expect(session1.sessionToken).not.toBe(session2.sessionToken);
    });

    it('generates session tokens with the sess- prefix', () => {
      const { result } = renderAuthHook();

      let session;
      act(() => {
        session = result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      expect(session.sessionToken).toMatch(/^sess-/);
    });
  });

  describe('session expiry', () => {
    it('sets session expiry to 24 hours in the future', () => {
      const { result } = renderAuthHook();

      const beforeLogin = Date.now();

      let session;
      act(() => {
        session = result.current.login('lukas.muller@dreeso.com', 'demo1234');
      });

      const expiresAt = new Date(session.expiresAt).getTime();
      const expectedMin = beforeLogin + 24 * 60 * 60 * 1000 - 1000;
      const expectedMax = beforeLogin + 24 * 60 * 60 * 1000 + 5000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('loading state', () => {
    it('sets loading to false after initialization', () => {
      const { result } = renderAuthHook();

      expect(result.current.loading).toBe(false);
    });
  });
});