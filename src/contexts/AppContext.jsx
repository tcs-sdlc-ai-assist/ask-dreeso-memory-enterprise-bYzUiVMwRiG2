/**
 * AppContext — Root application context provider for Ask Dreeso Memory.
 * Composes AuthContext and PersonaContext into a single wrapper.
 * Manages global UI state (loading, notifications, screen flow index),
 * keyboard shortcut state, and theme.
 * Exports useApp hook.
 *
 * @module AppContext
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PersonaProvider, usePersona } from '@/contexts/PersonaContext';
import { getData } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';
import { getItem, setItem } from '@/utils/storage';
import {
  KEYBOARD_SHORTCUTS,
  TOTAL_SCREENS,
  SCREEN_IDS,
  ANIMATION_DURATION,
} from '@/utils/constants';

/**
 * @typedef {object} Notification
 * @property {string} id - Unique notification ID.
 * @property {string} type - Notification type ('success', 'warning', 'error', 'info').
 * @property {string} message - The notification message.
 * @property {number} duration - Duration in ms before auto-dismiss (0 = manual dismiss).
 * @property {string} timestamp - ISO timestamp when the notification was created.
 */

/**
 * @typedef {object} AppContextValue
 * @property {number} currentScreenIndex - The current screen flow index (0-based).
 * @property {object|null} currentScreen - The current screen flow object.
 * @property {object[]} screenFlow - The full screen flow array.
 * @property {function} goToScreen - Navigate to a screen by index.
 * @property {function} goToScreenById - Navigate to a screen by its ID.
 * @property {function} nextScreen - Navigate to the next screen.
 * @property {function} prevScreen - Navigate to the previous screen.
 * @property {Notification[]} notifications - Array of active notifications.
 * @property {function} addNotification - Add a notification.
 * @property {function} removeNotification - Remove a notification by ID.
 * @property {function} clearNotifications - Clear all notifications.
 * @property {boolean} globalLoading - Whether the app is in a global loading state.
 * @property {function} setGlobalLoading - Set the global loading state.
 * @property {string} theme - The current theme ('dark').
 * @property {boolean} keyboardShortcutsEnabled - Whether keyboard shortcuts are enabled.
 * @property {function} setKeyboardShortcutsEnabled - Enable or disable keyboard shortcuts.
 * @property {number} totalScreens - Total number of screens in the flow.
 */

const AppContext = createContext(null);

/**
 * localStorage key for persisting the current screen index.
 * @type {string}
 */
const SCREEN_INDEX_KEY = 'dreeso_screen_index';

/**
 * Maximum number of notifications to display at once.
 * @type {number}
 */
const MAX_NOTIFICATIONS = 5;

/**
 * Default notification auto-dismiss duration in ms.
 * @type {number}
 */
const DEFAULT_NOTIFICATION_DURATION = 5000;

/**
 * Generate a unique notification ID.
 * @returns {string} A unique notification identifier.
 */
function generateNotificationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `notif-${timestamp}-${random}`;
}

/**
 * Inner app provider that has access to Auth and Persona contexts.
 * Manages global UI state, screen flow, notifications, and keyboard shortcuts.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child components.
 * @returns {import('react').ReactElement} The provider element.
 */
function AppInnerProvider({ children }) {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
  const [theme] = useState('dark');
  const notificationTimersRef = useRef({});

  /**
   * The full screen flow array loaded from mock data.
   * @type {object[]}
   */
  const screenFlow = useMemo(() => {
    const data = getData('screenFlow');
    return Array.isArray(data) ? data.sort((a, b) => a.screenNumber - b.screenNumber) : [];
  }, []);

  /**
   * The current screen flow object.
   * @type {object|null}
   */
  const currentScreen = useMemo(() => {
    if (screenFlow.length === 0) return null;
    if (currentScreenIndex < 0 || currentScreenIndex >= screenFlow.length) return null;
    return screenFlow[currentScreenIndex];
  }, [currentScreenIndex, screenFlow]);

  /**
   * Total number of screens in the flow.
   * @type {number}
   */
  const totalScreens = screenFlow.length || TOTAL_SCREENS;

  // Initialize screen index from localStorage on mount
  useEffect(() => {
    const storedIndex = getItem(SCREEN_INDEX_KEY, 0);
    if (typeof storedIndex === 'number' && storedIndex >= 0 && storedIndex < screenFlow.length) {
      setCurrentScreenIndex(storedIndex);
    }
  }, [screenFlow.length]);

  // Cleanup notification timers on unmount
  useEffect(() => {
    const timers = notificationTimersRef.current;
    return () => {
      const timerIds = Object.keys(timers);
      for (let i = 0; i < timerIds.length; i++) {
        clearTimeout(timers[timerIds[i]]);
      }
    };
  }, []);

  /**
   * Navigate to a screen by index.
   *
   * @param {number} index - The screen index to navigate to.
   */
  const goToScreen = useCallback((index) => {
    if (typeof index !== 'number' || index < 0 || index >= screenFlow.length) {
      return;
    }

    setCurrentScreenIndex(index);
    setItem(SCREEN_INDEX_KEY, index);

    const screen = screenFlow[index];
    if (screen) {
      auditLog('NAVIGATION', null, screen.personaId || null, `Navigated to screen: ${screen.title}`, {
        screenId: screen.id,
        screenNumber: screen.screenNumber,
        screenTitle: screen.title,
        componentName: screen.componentName,
      });
    }
  }, [screenFlow]);

  /**
   * Navigate to a screen by its ID.
   *
   * @param {string} screenId - The screen ID to navigate to.
   */
  const goToScreenById = useCallback((screenId) => {
    if (typeof screenId !== 'string' || screenId.trim() === '') {
      return;
    }

    const index = screenFlow.findIndex((s) => s.id === screenId);
    if (index !== -1) {
      goToScreen(index);
    }
  }, [screenFlow, goToScreen]);

  /**
   * Navigate to the next screen.
   */
  const nextScreen = useCallback(() => {
    if (currentScreenIndex < screenFlow.length - 1) {
      goToScreen(currentScreenIndex + 1);
    }
  }, [currentScreenIndex, screenFlow.length, goToScreen]);

  /**
   * Navigate to the previous screen.
   */
  const prevScreen = useCallback(() => {
    if (currentScreenIndex > 0) {
      goToScreen(currentScreenIndex - 1);
    }
  }, [currentScreenIndex, goToScreen]);

  /**
   * Add a notification to the notification list.
   *
   * @param {string} type - Notification type ('success', 'warning', 'error', 'info').
   * @param {string} message - The notification message.
   * @param {number} [duration] - Duration in ms before auto-dismiss (0 = manual dismiss).
   * @returns {string} The notification ID.
   */
  const addNotification = useCallback((type, message, duration) => {
    if (typeof message !== 'string' || message.trim() === '') {
      return '';
    }

    const validTypes = ['success', 'warning', 'error', 'info'];
    const resolvedType = validTypes.includes(type) ? type : 'info';
    const resolvedDuration = typeof duration === 'number' ? duration : DEFAULT_NOTIFICATION_DURATION;

    const notification = {
      id: generateNotificationId(),
      type: resolvedType,
      message: message.trim(),
      duration: resolvedDuration,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => {
      const updated = [...prev, notification];
      // Enforce max notifications (FIFO)
      if (updated.length > MAX_NOTIFICATIONS) {
        const removed = updated.shift();
        if (removed && notificationTimersRef.current[removed.id]) {
          clearTimeout(notificationTimersRef.current[removed.id]);
          delete notificationTimersRef.current[removed.id];
        }
      }
      return updated;
    });

    // Auto-dismiss if duration > 0
    if (resolvedDuration > 0) {
      notificationTimersRef.current[notification.id] = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        delete notificationTimersRef.current[notification.id];
      }, resolvedDuration);
    }

    return notification.id;
  }, []);

  /**
   * Remove a notification by its ID.
   *
   * @param {string} notificationId - The notification ID to remove.
   */
  const removeNotification = useCallback((notificationId) => {
    if (typeof notificationId !== 'string' || notificationId.trim() === '') {
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    if (notificationTimersRef.current[notificationId]) {
      clearTimeout(notificationTimersRef.current[notificationId]);
      delete notificationTimersRef.current[notificationId];
    }
  }, []);

  /**
   * Clear all notifications.
   */
  const clearNotifications = useCallback(() => {
    const timers = notificationTimersRef.current;
    const timerIds = Object.keys(timers);
    for (let i = 0; i < timerIds.length; i++) {
      clearTimeout(timers[timerIds[i]]);
    }
    notificationTimersRef.current = {};
    setNotifications([]);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!keyboardShortcutsEnabled) {
      return;
    }

    /**
     * Handle keyboard events for navigation and shortcuts.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    function handleKeyDown(event) {
      // Ignore if user is typing in an input or textarea
      const tagName = event.target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      // Check current screen's keyboard shortcuts first
      if (currentScreen && currentScreen.keyboardShortcuts) {
        const targetScreenId = currentScreen.keyboardShortcuts[event.key];
        if (targetScreenId) {
          event.preventDefault();
          goToScreenById(targetScreenId);
          return;
        }
      }

      // Global shortcuts
      switch (event.key) {
        case KEYBOARD_SHORTCUTS.NEXT_SCREEN:
          event.preventDefault();
          nextScreen();
          break;
        case KEYBOARD_SHORTCUTS.PREV_SCREEN:
          event.preventDefault();
          prevScreen();
          break;
        case KEYBOARD_SHORTCUTS.HOME:
          event.preventDefault();
          goToScreen(0);
          break;
        case KEYBOARD_SHORTCUTS.CANCEL:
          event.preventDefault();
          clearNotifications();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    keyboardShortcutsEnabled,
    currentScreen,
    goToScreenById,
    nextScreen,
    prevScreen,
    goToScreen,
    clearNotifications,
  ]);

  const value = useMemo(() => ({
    currentScreenIndex,
    currentScreen,
    screenFlow,
    goToScreen,
    goToScreenById,
    nextScreen,
    prevScreen,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    globalLoading,
    setGlobalLoading,
    theme,
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled,
    totalScreens,
  }), [
    currentScreenIndex,
    currentScreen,
    screenFlow,
    goToScreen,
    goToScreenById,
    nextScreen,
    prevScreen,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    globalLoading,
    theme,
    keyboardShortcutsEnabled,
    totalScreens,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

AppInnerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * AppProvider component. Composes AuthProvider, PersonaProvider, and AppInnerProvider
 * into a single root wrapper for the application.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child components.
 * @returns {import('react').ReactElement} The composed provider element.
 */
export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <PersonaProvider>
        <AppInnerProvider>
          {children}
        </AppInnerProvider>
      </PersonaProvider>
    </AuthProvider>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the AppContext.
 * Throws if used outside of an AppProvider.
 *
 * @returns {AppContextValue} The app context value.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;