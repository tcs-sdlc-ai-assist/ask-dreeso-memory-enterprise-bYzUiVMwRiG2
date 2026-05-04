/**
 * Notification — Toast notification component for action confirmations,
 * cross-domain updates, and error messages.
 * Supports success, warning, error, and info variants.
 * Auto-dismisses after configurable duration.
 * Positioned fixed top-right with slide-in animation.
 *
 * @module Notification
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '@/contexts/AppContext';

/**
 * Valid notification type variants.
 * @type {string[]}
 */
const VALID_TYPES = ['success', 'warning', 'error', 'info'];

/**
 * Icon SVG paths for each notification type.
 * @type {Record<string, import('react').ReactElement>}
 */
const TYPE_ICONS = {
  success: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * CSS class mappings for each notification type.
 * @type {Record<string, string>}
 */
const TYPE_CLASSES = {
  success: 'border-semantic-success/40 text-semantic-success',
  warning: 'border-semantic-warning/40 text-semantic-warning',
  error: 'border-semantic-error/40 text-semantic-error',
  info: 'border-semantic-info/40 text-semantic-info',
};

/**
 * Background color classes for each notification type.
 * @type {Record<string, string>}
 */
const TYPE_BG_CLASSES = {
  success: 'bg-semantic-success/10',
  warning: 'bg-semantic-warning/10',
  error: 'bg-semantic-error/10',
  info: 'bg-semantic-info/10',
};

/**
 * Single notification toast item.
 *
 * @param {object} props
 * @param {string} props.id - Unique notification ID.
 * @param {'success'|'warning'|'error'|'info'} props.type - Notification type variant.
 * @param {string} props.message - The notification message text.
 * @param {function} props.onDismiss - Callback to dismiss the notification.
 * @returns {import('react').ReactElement} The notification toast element.
 */
function NotificationItem({ id, type, message, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const mountedRef = useRef(true);

  const resolvedType = VALID_TYPES.includes(type) ? type : 'info';

  useEffect(() => {
    mountedRef.current = true;
    // Trigger slide-in animation on mount
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(true);
      }
    }, 10);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  /**
   * Handle dismiss with exit animation.
   */
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    const timer = setTimeout(() => {
      if (typeof onDismiss === 'function') {
        onDismiss(id);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const baseClasses = 'flex items-start gap-3 w-full max-w-sm p-4 border rounded-xl backdrop-blur-md shadow-glass transition-all duration-200 ease-out';
  const typeClasses = TYPE_CLASSES[resolvedType];
  const bgClasses = TYPE_BG_CLASSES[resolvedType];

  const visibilityClasses = isExiting
    ? 'opacity-0 translate-x-4'
    : isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-4';

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${bgClasses} ${visibilityClasses}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="mt-0.5">
        {TYPE_ICONS[resolvedType]}
      </div>
      <p className="flex-1 text-sm text-white leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        className="shrink-0 p-1 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

NotificationItem.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(VALID_TYPES).isRequired,
  message: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * NotificationContainer — Renders all active notifications from AppContext.
 * Positioned fixed top-right with stacked slide-in animation.
 *
 * @returns {import('react').ReactElement|null} The notification container element, or null if no notifications.
 */
export function NotificationContainer() {
  const { notifications, removeNotification } = useApp();

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            id={notification.id}
            type={notification.type}
            message={notification.message}
            onDismiss={removeNotification}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Standalone Notification toast component.
 * Can be used independently of AppContext for single notification display.
 *
 * @param {object} props
 * @param {'success'|'warning'|'error'|'info'} [props.type='info'] - Notification type variant.
 * @param {string} props.message - The notification message text.
 * @param {boolean} [props.visible=true] - Whether the notification is visible.
 * @param {number} [props.duration=5000] - Auto-dismiss duration in ms (0 = no auto-dismiss).
 * @param {function} [props.onDismiss] - Callback when the notification is dismissed.
 * @param {string} [props.className=''] - Additional CSS classes.
 * @returns {import('react').ReactElement|null} The notification element, or null if not visible.
 */
export function Notification({
  type = 'info',
  message,
  visible = true,
  duration = 5000,
  onDismiss,
  className = '',
}) {
  const [isShown, setIsShown] = useState(visible);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const resolvedType = VALID_TYPES.includes(type) ? type : 'info';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setIsShown(true);
      setIsExiting(false);
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setIsVisible(true);
        }
      }, 10);
      return () => clearTimeout(timer);
    } else {
      handleDismissInternal();
    }
  }, [visible]);

  // Auto-dismiss timer
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isShown && duration > 0) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (mountedRef.current) {
          handleDismissInternal();
        }
      }, duration);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isShown, duration]);

  /**
   * Handle dismiss with exit animation.
   */
  function handleDismissInternal() {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      if (mountedRef.current) {
        setIsShown(false);
        if (typeof onDismiss === 'function') {
          onDismiss();
        }
      }
    }, 200);
  }

  if (!isShown || typeof message !== 'string' || message.trim() === '') {
    return null;
  }

  const baseClasses = 'flex items-start gap-3 w-full max-w-sm p-4 border rounded-xl backdrop-blur-md shadow-glass transition-all duration-200 ease-out';
  const typeClasses = TYPE_CLASSES[resolvedType];
  const bgClasses = TYPE_BG_CLASSES[resolvedType];

  const visibilityClasses = isExiting
    ? 'opacity-0 translate-x-4'
    : isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-4';

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${bgClasses} ${visibilityClasses} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="mt-0.5">
        {TYPE_ICONS[resolvedType]}
      </div>
      <p className="flex-1 text-sm text-white leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        className="shrink-0 p-1 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
        onClick={handleDismissInternal}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

Notification.propTypes = {
  type: PropTypes.oneOf(VALID_TYPES),
  message: PropTypes.string.isRequired,
  visible: PropTypes.bool,
  duration: PropTypes.number,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default Notification;