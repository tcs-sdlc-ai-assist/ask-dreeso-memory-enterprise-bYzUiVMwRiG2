/**
 * Layout — Main layout wrapper component for Ask Dreeso Memory.
 * Renders Navbar at top, main content area in the center with responsive
 * 12-column grid, and a persistent QueryBar at the bottom.
 * Handles global keyboard controls via useKeyboardControls hook.
 * Wraps all authenticated pages.
 *
 * @module Layout
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { NotificationContainer } from '@/components/common/Notification';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { useApp } from '@/contexts/AppContext';
import { usePersona } from '@/contexts/PersonaContext';

/**
 * Layout component.
 * Provides the main application shell with Navbar at top, a responsive
 * 12-column grid content area in the center, and a persistent query bar
 * area at the bottom. Integrates global keyboard controls and notification
 * container overlay.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child content to render in the main content area.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the main content area.
 * @param {boolean} [props.showNavbar=true] - Whether to display the Navbar.
 * @param {boolean} [props.showQueryBar=true] - Whether to display the persistent QueryBar area at the bottom.
 * @param {boolean} [props.keyboardEnabled=true] - Whether keyboard controls are enabled.
 * @param {boolean} [props.fullWidth=false] - Whether to use full width instead of max-width container.
 * @param {function} [props.onSpacePress] - Optional callback when Space is pressed.
 * @returns {import('react').ReactElement} The layout element.
 */
export function Layout({
  children,
  className = '',
  showNavbar = true,
  showQueryBar = true,
  keyboardEnabled = true,
  fullWidth = false,
  onSpacePress,
}) {
  const { currentScreen, addNotification } = useApp();
  const { currentPersonaId, currentPersona } = usePersona();
  const navigate = useNavigate();

  /**
   * Handle advance screen callback for keyboard controls.
   */
  const handleAdvance = useCallback(() => {
    // Keyboard advance is handled by useKeyboardControls internally
  }, []);

  /**
   * Handle restart callback for keyboard controls.
   */
  const handleRestart = useCallback(() => {
    addNotification('info', 'Flow restarted from the beginning.');
  }, [addNotification]);

  /**
   * Handle next persona callback for keyboard controls.
   */
  const handleNextPersona = useCallback(() => {
    // Persona switch is handled by useKeyboardControls internally
  }, []);

  /**
   * Handle logout callback for keyboard controls.
   */
  const handleLogout = useCallback(() => {
    addNotification('info', 'You have been logged out.');
  }, [addNotification]);

  // Initialize keyboard controls
  useKeyboardControls({
    enabled: keyboardEnabled,
    onSpacePress: onSpacePress || null,
    onAdvance: handleAdvance,
    onRestart: handleRestart,
    onNextPersona: handleNextPersona,
    onLogout: handleLogout,
  });

  const containerClass = fullWidth
    ? 'w-full px-4 sm:px-6 lg:px-8'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <div className="flex flex-col min-h-screen bg-dreeso-dark-950 text-white">
      {/* Notification overlay */}
      <NotificationContainer />

      {/* Navbar */}
      {showNavbar && <Navbar />}

      {/* Main content area */}
      <main
        className={`flex-1 flex flex-col ${showQueryBar ? 'pb-20' : ''}`}
        role="main"
        aria-label="Main content"
      >
        <div className={`${containerClass} w-full py-6 flex-1 ${className}`}>
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            <div className="col-span-12">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Persistent QueryBar area at bottom */}
      {showQueryBar && currentPersonaId && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-dreeso-dark-950/90 backdrop-blur-lg border-t border-glass-border"
          role="complementary"
          aria-label="Query bar"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              {/* Persona indicator */}
              {currentPersona && (
                <div
                  className="hidden sm:flex items-center gap-2 shrink-0"
                  aria-label={`Current persona: ${currentPersona.name}`}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: currentPersona.colorTheme }}
                  />
                  <span className="text-xs text-dreeso-dark-400 truncate max-w-[100px]">
                    {currentPersona.name}
                  </span>
                </div>
              )}

              {/* Query input placeholder */}
              <div
                className="flex-1 glass-input flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-150"
                onClick={() => navigate('/query')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/query')}
              >
                <svg
                  className="w-4 h-4 text-dreeso-dark-400 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-dreeso-dark-400">
                  Ask a question...
                </span>
              </div>

              {/* Keyboard shortcut hints */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                  F
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Next</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded ml-1">
                  N
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Persona</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded ml-1">
                  R
                </kbd>
                <span className="text-[10px] text-dreeso-dark-500">Restart</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer when no query bar but still need some breathing room */}
      {!showQueryBar && (
        <div className="h-4 shrink-0" />
      )}
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  showNavbar: PropTypes.bool,
  showQueryBar: PropTypes.bool,
  keyboardEnabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onSpacePress: PropTypes.func,
};

export default Layout;