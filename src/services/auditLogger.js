/**
 * AuditLogger module for Ask Dreeso Memory.
 * Appends structured log entries to localStorage audit_log array.
 * Supports filtering by eventType, personaId, and date range.
 * Implements FIFO purge when log count exceeds maximum.
 *
 * @module AuditLogger
 */

import { getItem, setItem } from '@/utils/storage';
import { AUDIT_LOG_KEY } from '@/utils/constants';

/**
 * Maximum number of audit log entries to retain.
 * Oldest entries are purged when this limit is exceeded (FIFO).
 * @type {number}
 */
const MAX_LOG_ENTRIES = 1000;

/**
 * Retrieve all audit log entries from localStorage.
 * @returns {object[]} Array of audit log entry objects.
 */
function readLogs() {
  return getItem(AUDIT_LOG_KEY, []);
}

/**
 * Write audit log entries to localStorage.
 * @param {object[]} logs - Array of audit log entry objects.
 * @returns {boolean} True if the write succeeded.
 */
function writeLogs(logs) {
  return setItem(AUDIT_LOG_KEY, logs);
}

/**
 * Generate a unique log entry ID.
 * @returns {string} A unique string identifier for the log entry.
 */
function generateLogId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `log-${timestamp}-${random}`;
}

/**
 * Append a structured audit log entry to the audit log.
 * Automatically enforces the maximum log entry limit via FIFO purge.
 *
 * @param {string} eventType - The type of event (e.g., 'LOGIN', 'QUERY', 'ACTION', 'LOGOUT', 'SIGNUP', 'PERSONA_SWITCH').
 * @param {string|null} userId - The ID of the user who triggered the event, or null if unauthenticated.
 * @param {string|null} personaId - The persona ID associated with the event, or null if not applicable.
 * @param {string} action - A short description of the action performed.
 * @param {object} [details={}] - Additional structured details about the event.
 * @returns {object} The created audit log entry.
 */
export function log(eventType, userId, personaId, action, details = {}) {
  if (typeof eventType !== 'string' || eventType.trim() === '') {
    throw new Error('AuditLogger: eventType must be a non-empty string');
  }

  if (typeof action !== 'string' || action.trim() === '') {
    throw new Error('AuditLogger: action must be a non-empty string');
  }

  const entry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    eventType: eventType.trim(),
    userId: userId || null,
    personaId: personaId || null,
    action: action.trim(),
    details: details && typeof details === 'object' && !Array.isArray(details) ? details : {},
  };

  const logs = readLogs();
  logs.push(entry);

  // Enforce FIFO purge if over limit
  if (logs.length > MAX_LOG_ENTRIES) {
    const excess = logs.length - MAX_LOG_ENTRIES;
    logs.splice(0, excess);
  }

  writeLogs(logs);

  return entry;
}

/**
 * Retrieve audit log entries with optional filtering.
 *
 * @param {object} [filters={}] - Optional filter criteria.
 * @param {string} [filters.eventType] - Filter by event type (exact match).
 * @param {string} [filters.personaId] - Filter by persona ID (exact match).
 * @param {string} [filters.userId] - Filter by user ID (exact match).
 * @param {string} [filters.startDate] - Filter entries on or after this ISO date string.
 * @param {string} [filters.endDate] - Filter entries on or before this ISO date string.
 * @param {number} [filters.limit] - Maximum number of entries to return (most recent first).
 * @returns {object[]} Array of matching audit log entries, sorted newest first.
 */
export function getLogs(filters = {}) {
  let logs = readLogs();

  if (filters.eventType && typeof filters.eventType === 'string') {
    logs = logs.filter((entry) => entry.eventType === filters.eventType);
  }

  if (filters.personaId && typeof filters.personaId === 'string') {
    logs = logs.filter((entry) => entry.personaId === filters.personaId);
  }

  if (filters.userId && typeof filters.userId === 'string') {
    logs = logs.filter((entry) => entry.userId === filters.userId);
  }

  if (filters.startDate && typeof filters.startDate === 'string') {
    const startTime = new Date(filters.startDate).getTime();
    if (!isNaN(startTime)) {
      logs = logs.filter((entry) => new Date(entry.timestamp).getTime() >= startTime);
    }
  }

  if (filters.endDate && typeof filters.endDate === 'string') {
    const endTime = new Date(filters.endDate).getTime();
    if (!isNaN(endTime)) {
      logs = logs.filter((entry) => new Date(entry.timestamp).getTime() <= endTime);
    }
  }

  // Sort newest first
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (typeof filters.limit === 'number' && filters.limit > 0) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}

/**
 * Purge audit log entries older than the specified maximum age.
 *
 * @param {number} maxAgeMs - Maximum age in milliseconds. Entries older than this are removed.
 * @returns {number} The number of entries purged.
 */
export function purgeOldLogs(maxAgeMs) {
  if (typeof maxAgeMs !== 'number' || maxAgeMs <= 0) {
    throw new Error('AuditLogger: maxAgeMs must be a positive number');
  }

  const logs = readLogs();
  const cutoffTime = Date.now() - maxAgeMs;
  const filteredLogs = logs.filter((entry) => new Date(entry.timestamp).getTime() >= cutoffTime);
  const purgedCount = logs.length - filteredLogs.length;

  if (purgedCount > 0) {
    writeLogs(filteredLogs);
  }

  return purgedCount;
}

/**
 * Clear all audit log entries from localStorage.
 *
 * @returns {boolean} True if the operation succeeded.
 */
export function clearLogs() {
  return writeLogs([]);
}

/**
 * Get the total count of audit log entries.
 *
 * @returns {number} The number of entries in the audit log.
 */
export function getLogCount() {
  const logs = readLogs();
  return logs.length;
}

/**
 * Get the maximum number of log entries allowed.
 *
 * @returns {number} The maximum log entry limit.
 */
export function getMaxLogEntries() {
  return MAX_LOG_ENTRIES;
}