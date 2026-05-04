/**
 * ProtectedRoute — Route guard component for Ask Dreeso Memory.
 * Checks AuthContext for an authenticated session. Redirects to the
 * login/welcome screen if not authenticated. Wraps all authenticated
 * routes and passes through children when the user is authenticated.
 *
 * @module ProtectedRoute
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { SCREEN_IDS } from '@/utils/constants';

/**
 * ProtectedRoute component.
 * Route guard that checks AuthContext for an authenticated session.
 * If the user is not authenticated and loading has completed, redirects
 * to the welcome/login screen. While auth state is loading, displays
 * a minimal loading indicator. When authenticated, renders children.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child content to render when authenticated.
 * @param {string} [props.redirectScreenId] - Screen ID to redirect to when not authenticated.
 *   Defaults to SCREEN_IDS.WELCOME.
 * @param {function} [props.onRedirect] - Optional callback invoked when a redirect occurs.
 * @returns {import('react').ReactElement|null} The children when authenticated, a loading indicator
 *   while checking auth, or null during redirect.
 */
export function ProtectedRoute({
  children,
  redirectScreenId,
  onRedirect,
}) {
  const { isAuthenticated, loading } = useAuth();
  const { goToScreenById } = useApp();
  const navigate = useNavigate();

  const resolvedRedirectScreenId = typeof redirectScreenId === 'string' && redirectScreenId.trim() !== ''
    ? redirectScreenId
    : SCREEN_IDS.WELCOME;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (typeof onRedirect === 'function') {
        onRedirect();
      }

      navigate('/');
    }
  }, [loading, isAuthenticated, navigate, onRedirect]);

  // While auth state is being initialized, show a loading indicator
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-dreeso-dark-950"
        role="status"
        aria-label="Checking authentication"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4 animate-slide-in">
          <svg
            className="w-8 h-8 animate-spin text-dreeso-accent-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated after loading completes, render nothing (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — render children
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectScreenId: PropTypes.string,
  onRedirect: PropTypes.func,
};

export default ProtectedRoute;