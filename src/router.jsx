/**
 * Router configuration for Ask Dreeso Memory.
 * Defines all application routes using createBrowserRouter.
 * Authenticated routes are wrapped with ProtectedRoute.
 *
 * @module router
 */

import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { HomePage } from '@/pages/HomePage';
import { QueryPage } from '@/pages/QueryPage';
import { ActionPage } from '@/pages/ActionPage';
import { CrossDomainPage } from '@/pages/CrossDomainPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { SummaryPage } from '@/pages/SummaryPage';
import { PersonaSwitchPage } from '@/pages/PersonaSwitchPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * ProtectedRouteWrapper — Wraps a page component with ProtectedRoute.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - The child page component.
 * @returns {import('react').ReactElement} The protected route element.
 */
function ProtectedRouteWrapper({ children }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Application router configuration.
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRouteWrapper>
        <OnboardingPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRouteWrapper>
        <HomePage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/query',
    element: (
      <ProtectedRouteWrapper>
        <QueryPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/action',
    element: (
      <ProtectedRouteWrapper>
        <ActionPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/cross-domain',
    element: (
      <ProtectedRouteWrapper>
        <CrossDomainPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/audit-log',
    element: (
      <ProtectedRouteWrapper>
        <AuditLogPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/summary',
    element: (
      <ProtectedRouteWrapper>
        <SummaryPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '/persona-switch',
    element: (
      <ProtectedRouteWrapper>
        <PersonaSwitchPage />
      </ProtectedRouteWrapper>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;