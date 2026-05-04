/**
 * useKeyboardControls — Custom React hook for keyboard shortcut handling.
 * Implements keyboard controls: F (advance screen), Space (render response),
 * N (next persona), R (restart flow), L (logout).
 * Attaches keydown listener, dispatches actions via AppContext, and cleans up on unmount.
 *
 * @module useKeyboardControls
 */

import { useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePersona } from '@/contexts/PersonaContext';
import { PERSONA_LIST } from '@/utils/constants';

/**
 * @typedef {object} KeyboardControlsOptions
 * @property {boolean} [enabled=true] - Whether keyboard controls are active.
 * @property {function} [onSpacePress] - Optional callback when Space is pressed (render response).
 * @property {function} [onAdvance] - Optional callback when F is pressed (advance screen).
 * @property {function} [onRestart] - Optional callback when R is pressed (restart flow).
 * @property {function} [onNextPersona] - Optional callback when N is pressed (next persona).
 * @property {function} [onLogout] - Optional callback when L is pressed (logout).
 */

/**
 * @typedef {object} KeyboardControlsReturn
 * @property {boolean} enabled - Whether keyboard controls are currently enabled.
 */

/**
 * Custom React hook implementing keyboard shortcut handling.
 *
 * Key mappings:
 * - F: Advance to the next screen in the flow.
 * - Space: Trigger a render response action (calls onSpacePress callback).
 * - N: Switch to the next persona in the persona list.
 * - R: Restart the flow by navigating to screen index 0.
 * - L: Log out the current user.
 *
 * Attaches a keydown listener on mount, dispatches actions via AppContext,
 * AuthContext, and PersonaContext, and cleans up on unmount.
 *
 * @param {KeyboardControlsOptions} [options={}] - Configuration options.
 * @returns {KeyboardControlsReturn} The keyboard controls state.
 */
export function useKeyboardControls(options = {}) {
  const {
    enabled = true,
    onSpacePress = null,
    onAdvance = null,
    onRestart = null,
    onNextPersona = null,
    onLogout = null,
  } = options;

  const { nextScreen, goToScreen } = useApp();
  const { logout, isAuthenticated } = useAuth();
  const { currentPersonaId, setPersona, personaList } = usePersona();

  const optionsRef = useRef(options);
  optionsRef.current = {
    onSpacePress,
    onAdvance,
    onRestart,
    onNextPersona,
    onLogout,
  };

  /**
   * Advance to the next screen in the flow.
   */
  const handleAdvanceScreen = useCallback(() => {
    if (typeof optionsRef.current.onAdvance === 'function') {
      optionsRef.current.onAdvance();
    }
    nextScreen();
  }, [nextScreen]);

  /**
   * Handle Space key press for rendering response.
   */
  const handleSpacePress = useCallback(() => {
    if (typeof optionsRef.current.onSpacePress === 'function') {
      optionsRef.current.onSpacePress();
    }
  }, []);

  /**
   * Switch to the next persona in the persona list.
   */
  const handleNextPersona = useCallback(() => {
    if (typeof optionsRef.current.onNextPersona === 'function') {
      optionsRef.current.onNextPersona();
    }

    if (!currentPersonaId) {
      if (PERSONA_LIST.length > 0) {
        setPersona(PERSONA_LIST[0]);
      }
      return;
    }

    const currentIndex = PERSONA_LIST.indexOf(currentPersonaId);
    const nextIndex = (currentIndex + 1) % PERSONA_LIST.length;
    setPersona(PERSONA_LIST[nextIndex]);
  }, [currentPersonaId, setPersona]);

  /**
   * Restart the flow by navigating to screen index 0.
   */
  const handleRestart = useCallback(() => {
    if (typeof optionsRef.current.onRestart === 'function') {
      optionsRef.current.onRestart();
    }
    goToScreen(0);
  }, [goToScreen]);

  /**
   * Log out the current user.
   */
  const handleLogout = useCallback(() => {
    if (typeof optionsRef.current.onLogout === 'function') {
      optionsRef.current.onLogout();
    }
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    /**
     * Handle keydown events for keyboard shortcuts.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    function handleKeyDown(event) {
      // Ignore if user is typing in an input, textarea, or select
      const tagName = event.target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      // Ignore if modifier keys are held (allow browser shortcuts)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key) {
        case 'f':
        case 'F':
          event.preventDefault();
          handleAdvanceScreen();
          break;

        case ' ':
          event.preventDefault();
          handleSpacePress();
          break;

        case 'n':
        case 'N':
          event.preventDefault();
          handleNextPersona();
          break;

        case 'r':
        case 'R':
          event.preventDefault();
          handleRestart();
          break;

        case 'l':
        case 'L':
          event.preventDefault();
          handleLogout();
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
    enabled,
    handleAdvanceScreen,
    handleSpacePress,
    handleNextPersona,
    handleRestart,
    handleLogout,
  ]);

  return {
    enabled,
  };
}

export default useKeyboardControls;