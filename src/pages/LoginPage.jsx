/**
 * LoginPage — Login page for Ask Dreeso Memory (Screen 1).
 * Full-screen dark background with centered glassmorphism card containing
 * LoginForm and PersonaSelector side by side (desktop) or stacked (mobile).
 * Includes app branding, tagline, and animated background gradient.
 *
 * @module LoginPage
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { PersonaSelector } from '@/components/auth/PersonaSelector';
import { useAuth } from '@/contexts/AuthContext';
import { usePersona } from '@/contexts/PersonaContext';
import { APP_TITLE, APP_VERSION } from '@/utils/constants';

/**
 * LoginPage component.
 * Renders a full-screen login page with app branding, LoginForm, and
 * PersonaSelector. On desktop, the LoginForm and PersonaSelector are
 * displayed side by side. On mobile, they are stacked vertically.
 * Includes an animated background gradient and glassmorphism styling.
 *
 * @param {object} props
 * @param {function} [props.onLoginSuccess] - Optional callback after successful login. Receives the session object.
 * @param {function} [props.onPersonaSelected] - Optional callback after a persona is selected. Receives the persona ID.
 * @param {function} [props.onSignUpClick] - Optional callback when the sign up link is clicked.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The login page element.
 */
export function LoginPage({
  onLoginSuccess,
  onPersonaSelected,
  onSignUpClick,
  className = '',
}) {
  const { isAuthenticated } = useAuth();
  const { setPersona } = usePersona();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('persona');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle successful login from LoginForm.
   * @param {object} session - The session object.
   */
  const handleLoginSuccess = useCallback((session) => {
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(session);
    }
    if (session && session.personaId) {
      setPersona(session.personaId);
    }
    navigate('/onboarding');
  }, [onLoginSuccess, setPersona, navigate]);

  /**
   * Handle persona selection from PersonaSelector.
   * @param {string} personaId - The selected persona ID.
   */
  const handlePersonaSelected = useCallback((personaId) => {
    if (typeof onPersonaSelected === 'function') {
      onPersonaSelected(personaId);
    }
  }, [onPersonaSelected]);

  /**
   * Handle login complete from PersonaSelector.
   * @param {object} session - The session object.
   */
  const handleLoginComplete = useCallback((session) => {
    if (session && session.personaId) {
      setPersona(session.personaId);
    }
    navigate('/onboarding');
  }, [setPersona, navigate]);

  /**
   * Handle sign up link click.
   */
  const handleSignUpClick = useCallback(() => {
    if (typeof onSignUpClick === 'function') {
      onSignUpClick();
      return;
    }
    navigate('/signup');
  }, [onSignUpClick, navigate]);

  /**
   * Switch to the persona tab.
   */
  const handleTabPersona = useCallback(() => {
    setActiveTab('persona');
  }, []);

  /**
   * Switch to the email tab.
   */
  const handleTabEmail = useCallback(() => {
    setActiveTab('email');
  }, []);

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center bg-dreeso-dark-950 overflow-hidden ${className}`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[spin_60s_linear_infinite] opacity-[0.03]"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #17b363, #276ef1, #ffc043, #e11900, #17b363)',
          }}
        />
      </div>

      {/* Radial glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-dreeso-accent-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-semantic-info/5 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center gap-8 sm:gap-10">
        {/* Branding header */}
        <div className="text-center space-y-4 animate-slide-in">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-dreeso-accent-500 flex items-center justify-center shadow-accent-glow">
              <svg className="w-9 h-9 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.404 5.404a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zm8.131 8.132a.75.75 0 011.06 0l1.061 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.404 14.596a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm8.131-8.132a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.061 1.06l-1.06 1.06a.75.75 0 01-1.061 0z" />
                <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {APP_TITLE}
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg text-dreeso-dark-300 max-w-xl mx-auto leading-relaxed">
            Enterprise knowledge and memory assistant — connecting insights across your entire project ecosystem.
          </p>

          {/* Version badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-900 border border-glass-border rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-dreeso-accent-500 animate-pulse-green" />
              v{APP_VERSION} — Interactive Prototype
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-glass-white border border-glass-border rounded-xl backdrop-blur-md animate-slide-in">
          <button
            type="button"
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              activeTab === 'persona'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabPersona}
            aria-pressed={activeTab === 'persona'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Quick Start
            </span>
          </button>
          <button
            type="button"
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              activeTab === 'email'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabEmail}
            aria-pressed={activeTab === 'email'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
              </svg>
              Email Login
            </span>
          </button>
        </div>

        {/* Main content area */}
        <div className="w-full animate-slide-in">
          {activeTab === 'persona' ? (
            <PersonaSelector
              animated
              title="Select a Persona"
              showTitle
              subtitle="Choose a role to explore the system from their perspective."
              showSubtitle
              compact={false}
              onPersonaSelected={handlePersonaSelected}
              onLoginComplete={handleLoginComplete}
            />
          ) : (
            <LoginForm
              animated
              title="Welcome Back"
              subtitle="Sign in to continue to Ask Dreeso Memory"
              showTitle
              showSubtitle
              showSignUpLink
              onLoginSuccess={handleLoginSuccess}
              onSignUpClick={handleSignUpClick}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 animate-slide-in">
          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-dreeso-dark-400">10 Connected Systems</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-dreeso-dark-400">4 Persona Roles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-dreeso-dark-400">Cross-Domain Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-dreeso-dark-400">Real-time Propagation</span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-dreeso-dark-500">
            © {new Date().getFullYear()} Dreeso — Interactive Prototype
          </p>
        </div>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLoginSuccess: PropTypes.func,
  onPersonaSelected: PropTypes.func,
  onSignUpClick: PropTypes.func,
  className: PropTypes.string,
};

export default LoginPage;