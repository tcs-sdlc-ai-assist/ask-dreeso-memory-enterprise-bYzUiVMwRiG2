/**
 * App — Root application component for Ask Dreeso Memory.
 * Wraps the entire app with AppContext (which composes AuthContext and PersonaContext).
 * Renders RouterProvider with the configured router.
 * Entry point for the React component tree.
 *
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import router from '@/router';

/**
 * App component.
 * Root component that wraps the application with the AppProvider context
 * (which internally composes AuthProvider and PersonaProvider) and renders
 * the RouterProvider with the configured browser router.
 *
 * @returns {import('react').ReactElement} The root application element.
 */
export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}