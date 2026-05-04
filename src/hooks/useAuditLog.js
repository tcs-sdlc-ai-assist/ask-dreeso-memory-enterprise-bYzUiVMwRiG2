/**
 * useAuditLog — Custom React hook wrapping AuditLogger service.
 * Provides logEvent, getLogs, clearLogs functions with React state integration.
 * Used by components that need to display or export audit data.
 *
 * @module useAuditLog
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  log as auditLog,
  getLogs as fetchLogs,
  clearLogs as clearAllLogs,
  purgeOldLogs,
  getLogCount,
  getMaxLogEntries,
} from '@/services/auditLogger';

/**
 * @typedef {object} AuditLogFilters
 * @property {string} [eventType] - Filter by event type (exact match).
 * @property {string} [personaId] - Filter by persona ID (exact match).
 * @property {string} [userId] - Filter by user ID (exact match).
 * @property {string} [startDate] - Filter entries on or after this ISO date string.
 * @property {string} [endDate] - Filter entries on or before this ISO date string.
 * @property {number} [limit] - Maximum number of entries to return (most recent first).
 */

/**
 * @typedef {object} AuditLogReturn
 * @property {object[]} logs - Array of audit log entries matching the current filters.
 * @property {boolean} isLoading - Whether the logs are currently being loaded.
 * @property {string|null} error - The error message if the last operation failed, or null.
 * @property {number} totalCount - Total number of audit log entries (unfiltered).
 * @property {number} maxEntries - Maximum number of log entries allowed.
 * @property {function} logEvent - Log a new audit event.
 * @property {function} fetchFilteredLogs - Fetch logs with optional filters and update state.
 * @property {function} clearLogs - Clear all audit log entries.
 * @property {function} purgeOld - Purge audit log entries older than a given age.
 * @property {function} refreshLogs - Refresh the current log view with existing filters.
 * @property {function} refreshCount - Refresh the total log count.
 */

/**
 * Custom React hook wrapping the AuditLogger service.
 * Provides logEvent, getLogs, and clearLogs functions with React state integration.
 * Used by components that need to display or export audit data.
 *
 * @param {AuditLogFilters} [initialFilters={}] - Optional initial filters to apply when loading logs.
 * @returns {AuditLogReturn} The audit log hook state and methods.
 */
export function useAuditLog(initialFilters = {}) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const filtersRef = useRef(initialFilters);
  const mountedRef = useRef(true);

  // Track mounted state for safe async updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Maximum number of log entries allowed.
   * @type {number}
   */
  const maxEntries = getMaxLogEntries();

  /**
   * Refresh the total log count from the audit logger.
   */
  const refreshCount = useCallback(() => {
    try {
      const count = getLogCount();
      if (mountedRef.current) {
        setTotalCount(count);
      }
    } catch (_err) {
      // Non-critical; silently ignore count refresh errors
    }
  }, []);

  /**
   * Fetch logs with optional filters and update state.
   *
   * @param {AuditLogFilters} [filters={}] - Optional filter criteria.
   * @returns {object[]} Array of matching audit log entries.
   */
  const fetchFilteredLogs = useCallback((filters = {}) => {
    if (!mountedRef.current) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedFilters = typeof filters === 'object' && filters !== null && !Array.isArray(filters)
        ? filters
        : {};

      filtersRef.current = resolvedFilters;

      const result = fetchLogs(resolvedFilters);

      if (mountedRef.current) {
        setLogs(result);
        setIsLoading(false);
        setTotalCount(getLogCount());
      }

      return result;
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Failed to fetch audit logs';

      if (mountedRef.current) {
        setError(errorMessage);
        setIsLoading(false);
        setLogs([]);
      }

      return [];
    }
  }, []);

  /**
   * Refresh the current log view with existing filters.
   *
   * @returns {object[]} Array of matching audit log entries.
   */
  const refreshLogs = useCallback(() => {
    return fetchFilteredLogs(filtersRef.current);
  }, [fetchFilteredLogs]);

  /**
   * Log a new audit event via the AuditLogger service.
   *
   * @param {string} eventType - The type of event (e.g., 'LOGIN', 'QUERY', 'ACTION').
   * @param {string|null} userId - The ID of the user who triggered the event, or null.
   * @param {string|null} personaId - The persona ID associated with the event, or null.
   * @param {string} action - A short description of the action performed.
   * @param {object} [details={}] - Additional structured details about the event.
   * @returns {object|null} The created audit log entry, or null on error.
   */
  const logEvent = useCallback((eventType, userId, personaId, action, details = {}) => {
    try {
      if (typeof eventType !== 'string' || eventType.trim() === '') {
        setError('eventType must be a non-empty string');
        return null;
      }

      if (typeof action !== 'string' || action.trim() === '') {
        setError('action must be a non-empty string');
        return null;
      }

      const entry = auditLog(eventType, userId, personaId, action, details);

      if (mountedRef.current) {
        setError(null);
        setTotalCount(getLogCount());
      }

      return entry;
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Failed to log audit event';

      if (mountedRef.current) {
        setError(errorMessage);
      }

      return null;
    }
  }, []);

  /**
   * Clear all audit log entries.
   *
   * @returns {boolean} True if the operation succeeded.
   */
  const clearLogs = useCallback(() => {
    try {
      const success = clearAllLogs();

      if (mountedRef.current) {
        setLogs([]);
        setTotalCount(0);
        setError(null);
      }

      return success;
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Failed to clear audit logs';

      if (mountedRef.current) {
        setError(errorMessage);
      }

      return false;
    }
  }, []);

  /**
   * Purge audit log entries older than the specified maximum age.
   *
   * @param {number} maxAgeMs - Maximum age in milliseconds. Entries older than this are removed.
   * @returns {number} The number of entries purged, or -1 on error.
   */
  const purgeOld = useCallback((maxAgeMs) => {
    try {
      if (typeof maxAgeMs !== 'number' || maxAgeMs <= 0) {
        if (mountedRef.current) {
          setError('maxAgeMs must be a positive number');
        }
        return -1;
      }

      const purgedCount = purgeOldLogs(maxAgeMs);

      if (mountedRef.current) {
        setError(null);
        setTotalCount(getLogCount());
        // Refresh the current view after purge
        fetchFilteredLogs(filtersRef.current);
      }

      return purgedCount;
    } catch (err) {
      const errorMessage = err && err.message ? err.message : 'Failed to purge old audit logs';

      if (mountedRef.current) {
        setError(errorMessage);
      }

      return -1;
    }
  }, [fetchFilteredLogs]);

  // Initialize total count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return {
    logs,
    isLoading,
    error,
    totalCount,
    maxEntries,
    logEvent,
    fetchFilteredLogs,
    clearLogs,
    purgeOld,
    refreshLogs,
    refreshCount,
  };
}

export default useAuditLog;