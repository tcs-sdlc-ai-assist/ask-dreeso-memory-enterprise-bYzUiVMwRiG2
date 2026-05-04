/**
 * NotFoundPage — 404 Not Found page for Ask Dreeso Memory.
 * Displays a styled error message with glassmorphism card, link back to home,
 * and consistent dark theme. Handles unknown routes gracefully.
 *
 * @module NotFoundPage
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { useApp } from '@/contexts/AppContext';
import { usePersona } from '@/contexts/PersonaContext';
import { APP_TITLE, APP_VERSION, SCREEN_IDS } from '@/utils/constants';

/**
 * NotFoundPage component.
 * Renders a full-screen 404 error page with glassmorphism styling,
 * a descriptive error message, and navigation options to return to
 * the home screen or persona selection. Includes animated background
 * gradient consistent with other full-screen pages.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {function} [props.onGoHome] - Optional callback when the user clicks the home button.
 * @returns {import('react').ReactElement} The 404 page element.
 */
export function NotFoundPage({ className = '', onGoHome }) {
  const { goToScreenById, goToScreen } = useApp();
  const { currentPersonaId, currentPersona } = usePersona();
  const navigate = useNavigate();

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  /**
   * Handle navigating back to the welcome/home screen.
   */
  const handleGoHome = useCallback(() => {
    if (typeof onGoHome === 'function') {
      onGoHome();
      return;
    }

    navigate('/');
  }, [onGoHome, navigate]);

  /**
   * Handle navigating to the persona selection screen.
   */
  const handleGoToPersonaSelection = useCallback(() => {
    navigate('/persona-switch');
  }, [navigate]);

  /**
   * Handle navigating to the current persona's dashboard.
   */
  const handleGoToDashboard = useCallback(() => {
    if (!currentPersonaId) {
      navigate('/');
      return;
    }

    navigate('/home');
  }, [currentPersonaId, navigate]);

  /**
   * Handle restarting the flow from the beginning.
   */
  const handleRestart = useCallback(() => {
    goToScreen(0);
  }, [goToScreen]);

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
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-5"
        style={{ backgroundColor: resolvedAccentColor }}
      />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-semantic-error/5 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center gap-8">
        {/* Error card */}
        <div className="w-full animate-slide-in">
          <GlassCard
            variant="default"
            animated={false}
            className="space-y-6"
          >
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-semantic-error/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-semantic-error" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Error code */}
            <div className="text-center space-y-3">
              <p className="text-6xl sm:text-7xl font-semibold text-white tracking-tight">
                404
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">
                Page Not Found
              </h1>
              <p className="text-sm text-dreeso-dark-300 leading-relaxed max-w-sm mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                Let&apos;s get you back on track.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-3">
              {/* Primary: Go Home */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
                onClick={handleGoHome}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                </svg>
                Go to Home
              </button>

              {/* Secondary options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50"
                  onClick={handleGoToPersonaSelection}
                >
                  <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                  </svg>
                  Choose Persona
                </button>

                {currentPersonaId ? (
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50"
                    onClick={handleGoToDashboard}
                  >
                    <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                    </svg>
                    Dashboard
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50"
                    onClick={handleRestart}
                  >
                    <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 002.63 8.395a.75.75 0 001.449.39z" clipRule="evenodd" />
                    </svg>
                    Restart
                  </button>
                )}
              </div>
            </div>

            {/* Help hint */}
            <div className="px-3 py-2.5 bg-glass-white border border-glass-border rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-dreeso-dark-300 leading-relaxed">
                  This is an interactive prototype. Use the navigation bar or keyboard shortcuts to explore different screens and personas.
                </p>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                  F
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Next Screen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                  R
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Restart</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                  N
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Switch Persona</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer branding */}
        <div className="flex items-center justify-center gap-2 animate-slide-in">
          <svg
            className="w-3 h-3 text-dreeso-accent-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
            <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] text-dreeso-dark-500">
            {APP_TITLE} — v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}

NotFoundPage.propTypes = {
  className: PropTypes.string,
  onGoHome: PropTypes.func,
};

export default NotFoundPage;