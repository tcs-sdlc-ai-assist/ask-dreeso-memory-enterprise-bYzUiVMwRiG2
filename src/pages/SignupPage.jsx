/**
 * SignupPage — Sign up page for Ask Dreeso Memory (Screen 2).
 * Full-screen dark background with centered glassmorphism card containing
 * SignupForm. Includes app branding, tagline, and animated background gradient
 * consistent with LoginPage styling. Includes link back to login.
 *
 * @module SignupPage
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { APP_TITLE, APP_VERSION, SCREEN_IDS } from '@/utils/constants';

/**
 * SignupPage component.
 * Renders a full-screen sign up page with app branding and SignupForm centered.
 * Includes an animated background gradient and glassmorphism styling consistent
 * with LoginPage. Provides a link back to the login page.
 *
 * @param {object} props
 * @param {function} [props.onSignupSuccess] - Optional callback after successful signup. Receives the session object.
 * @param {function} [props.onLoginClick] - Optional callback when the login link is clicked.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The signup page element.
 */
export function SignupPage({
  onSignupSuccess,
  onLoginClick,
  className = '',
}) {
  const { isAuthenticated } = useAuth();
  const { goToScreenById, addNotification } = useApp();

  /**
   * Handle successful signup from SignupForm.
   * @param {object} session - The session object.
   */
  const handleSignupSuccess = useCallback((session) => {
    if (typeof onSignupSuccess === 'function') {
      onSignupSuccess(session);
    }

    goToScreenById(SCREEN_IDS.PERSONA_SELECTION);
  }, [onSignupSuccess, goToScreenById]);

  /**
   * Handle login link click.
   */
  const handleLoginClick = useCallback(() => {
    if (typeof onLoginClick === 'function') {
      onLoginClick();
    }
  }, [onLoginClick]);

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
            Create your account to start exploring enterprise knowledge and memory intelligence.
          </p>

          {/* Version badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-900 border border-glass-border rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-dreeso-accent-500 animate-pulse-green" />
              v{APP_VERSION} — Interactive Prototype
            </span>
          </div>
        </div>

        {/* Signup form */}
        <div className="w-full animate-slide-in">
          <SignupForm
            animated
            title="Create Account"
            subtitle="Sign up to start using Ask Dreeso Memory"
            showTitle
            showSubtitle
            showLoginLink
            onSignupSuccess={handleSignupSuccess}
            onLoginClick={handleLoginClick}
          />
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

SignupPage.propTypes = {
  onSignupSuccess: PropTypes.func,
  onLoginClick: PropTypes.func,
  className: PropTypes.string,
};

export default SignupPage;