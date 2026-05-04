/**
 * AuditLogPage — Audit log page for Ask Dreeso Memory (Screen 18).
 * Displays filterable, sortable audit log table with all recorded events
 * (queries, actions, logins, persona switches). Filters by event type,
 * persona, and date range. Export button for downloading logs as JSON.
 * Uses DataTable component.
 *
 * @module AuditLogPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/common/DataTable';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { getData } from '@/services/dataManager';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

/**
 * Valid event type filter options.
 * @type {object[]}
 */
const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'SIGNUP', label: 'Signup' },
  { value: 'PERSONA_SWITCH', label: 'Persona Switch' },
  { value: 'QUERY', label: 'Query' },
  { value: 'ACTION', label: 'Action' },
  { value: 'PROPAGATION', label: 'Propagation' },
  { value: 'PROPAGATION_STEP', label: 'Propagation Step' },
  { value: 'PROPAGATION_NOTIFICATION', label: 'Notification' },
  { value: 'NAVIGATION', label: 'Navigation' },
];

/**
 * Sort direction constants.
 * @type {Record<string, string>}
 */
const SORT_DIR = {
  ASC: 'asc',
  DESC: 'desc',
};

/**
 * Map event type to a semantic color class.
 * @param {string} eventType - The audit log event type.
 * @returns {string} Tailwind text color class.
 */
function getEventTypeColor(eventType) {
  if (typeof eventType !== 'string') return 'text-dreeso-dark-400';

  switch (eventType) {
    case 'ACTION':
      return 'text-semantic-success';
    case 'QUERY':
      return 'text-semantic-info';
    case 'PROPAGATION':
    case 'PROPAGATION_STEP':
      return 'text-dreeso-accent-400';
    case 'PROPAGATION_NOTIFICATION':
      return 'text-semantic-warning';
    case 'LOGIN':
    case 'SIGNUP':
    case 'PERSONA_SWITCH':
      return 'text-dreeso-dark-300';
    case 'LOGOUT':
      return 'text-semantic-error';
    case 'NAVIGATION':
      return 'text-dreeso-dark-400';
    default:
      return 'text-dreeso-dark-400';
  }
}

/**
 * Map event type to a badge class.
 * @param {string} eventType - The audit log event type.
 * @returns {string} Tailwind class string for the badge.
 */
function getEventTypeBadgeClass(eventType) {
  if (typeof eventType !== 'string') return 'text-dreeso-dark-400 bg-dreeso-dark-800/50 border-glass-border';

  switch (eventType) {
    case 'ACTION':
      return 'text-semantic-success bg-semantic-success/10 border-semantic-success/20';
    case 'QUERY':
      return 'text-semantic-info bg-semantic-info/10 border-semantic-info/20';
    case 'PROPAGATION':
    case 'PROPAGATION_STEP':
      return 'text-dreeso-accent-400 bg-dreeso-accent-500/10 border-dreeso-accent-500/20';
    case 'PROPAGATION_NOTIFICATION':
      return 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20';
    case 'LOGIN':
    case 'SIGNUP':
    case 'PERSONA_SWITCH':
      return 'text-dreeso-dark-300 bg-dreeso-dark-800/50 border-glass-border';
    case 'LOGOUT':
      return 'text-semantic-error bg-semantic-error/10 border-semantic-error/20';
    case 'NAVIGATION':
      return 'text-dreeso-dark-400 bg-dreeso-dark-800/50 border-glass-border';
    default:
      return 'text-dreeso-dark-400 bg-dreeso-dark-800/50 border-glass-border';
  }
}

/**
 * Format an ISO timestamp into a human-readable string.
 * @param {string} isoTimestamp - The ISO timestamp string.
 * @returns {string} A formatted date/time string, or empty string if invalid.
 */
function formatTimestamp(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.trim() === '') {
    return '';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (_err) {
    return '';
  }
}

/**
 * Format a relative time string from an ISO timestamp.
 * @param {string} isoTimestamp - The ISO timestamp string.
 * @returns {string} A relative time string like "2m ago".
 */
function formatRelativeTime(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.trim() === '') {
    return '';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTimestamp(isoTimestamp);
  } catch (_err) {
    return '';
  }
}

/**
 * Resolve persona name from persona ID.
 * @param {string} personaId - The persona ID.
 * @param {object[]} personaList - Array of persona objects.
 * @returns {string} The persona name, or the ID if not found.
 */
function resolvePersonaName(personaId, personaList) {
  if (typeof personaId !== 'string' || !personaId) return '—';
  const persona = personaList.find((p) => p.id === personaId);
  return persona ? persona.name : personaId;
}

/**
 * Format a date string for the date input value (YYYY-MM-DD).
 * @param {Date} date - The date object.
 * @returns {string} The formatted date string.
 */
function formatDateForInput(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * SummaryStatCard — Renders a single summary statistic card.
 *
 * @param {object} props
 * @param {string} props.label - The stat label.
 * @param {string|number} props.value - The stat value.
 * @param {string} [props.accentColor] - The accent color.
 * @param {import('react').ReactElement} [props.icon] - Optional icon element.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement} The summary stat card element.
 */
function SummaryStatCard({ label, value, accentColor, icon, index }) {
  const animationStyle = { animationDelay: `${index * 80}ms` };

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable
        noPadding
        className="p-4 transition-all duration-200 ease-out hover:shadow-glass-lg hover:border-glass-hover"
      >
        <div className="space-y-1.5">
          {icon && (
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg mb-2"
              style={{
                backgroundColor: accentColor ? `${accentColor}15` : 'rgba(23, 179, 99, 0.08)',
                color: accentColor || '#17b363',
              }}
            >
              {icon}
            </div>
          )}
          <p className="text-2xl font-semibold text-white leading-tight">
            {value}
          </p>
          <p className="text-xs text-dreeso-dark-400 leading-tight">
            {label}
          </p>
          <div
            className="h-0.5 w-8 rounded-full mt-1"
            style={{ backgroundColor: accentColor || '#17b363' }}
          />
        </div>
      </GlassCard>
    </div>
  );
}

SummaryStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accentColor: PropTypes.string,
  icon: PropTypes.node,
  index: PropTypes.number.isRequired,
};

/**
 * LogDetailPanel — Renders the detail panel for a selected log entry.
 *
 * @param {object} props
 * @param {object} props.entry - The audit log entry object.
 * @param {object[]} props.personaList - Array of persona objects.
 * @param {function} props.onClose - Callback to close the detail panel.
 * @returns {import('react').ReactElement|null} The detail panel element.
 */
function LogDetailPanel({ entry, personaList, onClose }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const badgeClass = getEventTypeBadgeClass(entry.eventType);
  const formattedTime = formatTimestamp(entry.timestamp);
  const personaName = resolvePersonaName(entry.personaId, personaList);

  return (
    <div className="animate-slide-in">
      <GlassCard
        variant="sm"
        animated={false}
        hoverable={false}
        noPadding
        className="p-4"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${badgeClass}`}
              >
                {entry.eventType || 'Event'}
              </span>
              <span className="text-[10px] text-dreeso-dark-500 font-mono">
                {entry.id || '—'}
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 p-1.5 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={onClose}
              aria-label="Close detail panel"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Action description */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
              Action
            </p>
            <p className="text-sm text-dreeso-dark-200 leading-relaxed">
              {entry.action || '—'}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            {/* Timestamp */}
            {formattedTime && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  Timestamp
                </span>
                <span className="text-xs text-dreeso-dark-300">
                  {formattedTime}
                </span>
              </div>
            )}

            {/* Persona */}
            {entry.personaId && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  Persona
                </span>
                <span className="text-xs text-dreeso-dark-300">
                  {personaName}
                </span>
              </div>
            )}

            {/* User ID */}
            {entry.userId && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  User ID
                </span>
                <span className="text-xs text-dreeso-dark-300 font-mono">
                  {entry.userId}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          {entry.details && typeof entry.details === 'object' && Object.keys(entry.details).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                Details
              </p>
              <div className="bg-dreeso-dark-900/50 border border-glass-border rounded-xl p-3 max-h-48 overflow-y-auto scrollbar-hide">
                <pre className="text-[11px] text-dreeso-dark-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

LogDetailPanel.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    timestamp: PropTypes.string,
    eventType: PropTypes.string,
    action: PropTypes.string,
    personaId: PropTypes.string,
    userId: PropTypes.string,
    details: PropTypes.object,
  }),
  personaList: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * LogEntryRow — Renders a single audit log entry as a clickable row.
 *
 * @param {object} props
 * @param {object} props.entry - The audit log entry object.
 * @param {object[]} props.personaList - Array of persona objects.
 * @param {boolean} props.isSelected - Whether this entry is currently selected.
 * @param {function} props.onSelect - Callback when the entry is selected.
 * @param {number} props.index - The row index for staggered animation.
 * @returns {import('react').ReactElement|null} The log entry row element.
 */
function LogEntryRow({ entry, personaList, isSelected, onSelect, index }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const badgeClass = getEventTypeBadgeClass(entry.eventType);
  const relativeTime = formatRelativeTime(entry.timestamp);
  const formattedTime = formatTimestamp(entry.timestamp);
  const personaName = resolvePersonaName(entry.personaId, personaList);

  const handleClick = useCallback(() => {
    if (typeof onSelect === 'function') {
      onSelect(entry);
    }
  }, [entry, onSelect]);

  const handleKeyDown = useCallback((event) => {
    if ((event.key === 'Enter' || event.key === ' ') && typeof onSelect === 'function') {
      event.preventDefault();
      onSelect(entry);
    }
  }, [entry, onSelect]);

  return (
    <tr
      className={`transition-colors duration-150 cursor-pointer ${
        isSelected
          ? 'bg-dreeso-accent-500/5 border-l-2 border-l-dreeso-accent-500'
          : 'hover:bg-glass-hover border-l-2 border-l-transparent'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
      aria-label={`${entry.eventType}: ${entry.action}`}
    >
      {/* Timestamp */}
      <td className="px-4 py-3 text-xs text-dreeso-dark-400 whitespace-nowrap" title={formattedTime}>
        {relativeTime}
      </td>

      {/* Event Type */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${badgeClass}`}
        >
          {entry.eventType || '—'}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-sm text-dreeso-dark-100 max-w-xs truncate">
        {entry.action || '—'}
      </td>

      {/* Persona */}
      <td className="px-4 py-3 text-xs text-dreeso-dark-300 whitespace-nowrap">
        {personaName}
      </td>

      {/* User ID */}
      <td className="px-4 py-3 text-[11px] text-dreeso-dark-500 font-mono whitespace-nowrap">
        {entry.userId || '—'}
      </td>
    </tr>
  );
}

LogEntryRow.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    timestamp: PropTypes.string,
    eventType: PropTypes.string,
    action: PropTypes.string,
    personaId: PropTypes.string,
    userId: PropTypes.string,
    details: PropTypes.object,
  }),
  personaList: PropTypes.arrayOf(PropTypes.object).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * AuditLogPage component.
 * Displays filterable, sortable audit log table with all recorded events
 * (queries, actions, logins, persona switches). Filters by event type,
 * persona, and date range. Export button for downloading logs as JSON.
 * Uses DataTable component for structured data display.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The audit log page element.
 */
export function AuditLogPage({ className = '' }) {
  const { currentPersonaId, currentPersona, personaList } = usePersona();
  const { session } = useAuth();
  const { addNotification, goToScreenById } = useApp();

  const {
    logs,
    isLoading,
    error,
    totalCount,
    maxEntries,
    fetchFilteredLogs,
    clearLogs,
    purgeOld,
    refreshLogs,
    refreshCount,
  } = useAuditLog();

  const [filterEventType, setFilterEventType] = useState('');
  const [filterPersonaId, setFilterPersonaId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState(SORT_DIR.DESC);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const mountedRef = useRef(true);
  const PAGE_SIZE = 25;

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch logs on mount and when filters change
  useEffect(() => {
    const filters = {};

    if (filterEventType) {
      filters.eventType = filterEventType;
    }
    if (filterPersonaId) {
      filters.personaId = filterPersonaId;
    }
    if (filterStartDate) {
      filters.startDate = new Date(filterStartDate).toISOString();
    }
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filters.endDate = endDate.toISOString();
    }

    fetchFilteredLogs(filters);
    setCurrentPage(0);
    setSelectedEntry(null);
  }, [filterEventType, filterPersonaId, filterStartDate, filterEndDate, fetchFilteredLogs]);

  /**
   * Sorted and paginated logs.
   * @type {object[]}
   */
  const sortedLogs = useMemo(() => {
    if (!Array.isArray(logs) || logs.length === 0) {
      return [];
    }

    const sorted = [...logs].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'timestamp':
          aVal = new Date(a.timestamp || 0).getTime();
          bVal = new Date(b.timestamp || 0).getTime();
          break;
        case 'eventType':
          aVal = (a.eventType || '').toLowerCase();
          bVal = (b.eventType || '').toLowerCase();
          break;
        case 'action':
          aVal = (a.action || '').toLowerCase();
          bVal = (b.action || '').toLowerCase();
          break;
        case 'personaId':
          aVal = resolvePersonaName(a.personaId, personaList).toLowerCase();
          bVal = resolvePersonaName(b.personaId, personaList).toLowerCase();
          break;
        default:
          aVal = new Date(a.timestamp || 0).getTime();
          bVal = new Date(b.timestamp || 0).getTime();
      }

      if (aVal < bVal) return sortDirection === SORT_DIR.ASC ? -1 : 1;
      if (aVal > bVal) return sortDirection === SORT_DIR.ASC ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [logs, sortField, sortDirection, personaList]);

  /**
   * Paginated logs for the current page.
   * @type {object[]}
   */
  const paginatedLogs = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return sortedLogs.slice(start, start + PAGE_SIZE);
  }, [sortedLogs, currentPage]);

  /**
   * Total number of pages.
   * @type {number}
   */
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
  }, [sortedLogs]);

  /**
   * Summary statistics for the current filtered logs.
   * @type {object}
   */
  const summary = useMemo(() => {
    if (!Array.isArray(logs) || logs.length === 0) {
      return { total: 0, queries: 0, actions: 0, propagations: 0, logins: 0, other: 0 };
    }

    let queries = 0;
    let actions = 0;
    let propagations = 0;
    let logins = 0;
    let other = 0;

    for (let i = 0; i < logs.length; i++) {
      const eventType = logs[i].eventType;
      if (eventType === 'QUERY') queries++;
      else if (eventType === 'ACTION') actions++;
      else if (eventType === 'PROPAGATION' || eventType === 'PROPAGATION_STEP' || eventType === 'PROPAGATION_NOTIFICATION') propagations++;
      else if (eventType === 'LOGIN' || eventType === 'LOGOUT' || eventType === 'SIGNUP' || eventType === 'PERSONA_SWITCH') logins++;
      else other++;
    }

    return {
      total: logs.length,
      queries,
      actions,
      propagations,
      logins,
      other,
    };
  }, [logs]);

  /**
   * Handle sort column click.
   * @param {string} field - The field to sort by.
   */
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection((prev) => prev === SORT_DIR.ASC ? SORT_DIR.DESC : SORT_DIR.ASC);
    } else {
      setSortField(field);
      setSortDirection(SORT_DIR.DESC);
    }
    setCurrentPage(0);
  }, [sortField]);

  /**
   * Handle event type filter change.
   * @param {import('react').ChangeEvent<HTMLSelectElement>} event - The change event.
   */
  const handleEventTypeChange = useCallback((event) => {
    setFilterEventType(event.target.value);
  }, []);

  /**
   * Handle persona filter change.
   * @param {import('react').ChangeEvent<HTMLSelectElement>} event - The change event.
   */
  const handlePersonaChange = useCallback((event) => {
    setFilterPersonaId(event.target.value);
  }, []);

  /**
   * Handle start date filter change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleStartDateChange = useCallback((event) => {
    setFilterStartDate(event.target.value);
  }, []);

  /**
   * Handle end date filter change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleEndDateChange = useCallback((event) => {
    setFilterEndDate(event.target.value);
  }, []);

  /**
   * Handle clearing all filters.
   */
  const handleClearFilters = useCallback(() => {
    setFilterEventType('');
    setFilterPersonaId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedEntry(null);
    setCurrentPage(0);
  }, []);

  /**
   * Handle selecting a log entry.
   * @param {object} entry - The selected log entry.
   */
  const handleSelectEntry = useCallback((entry) => {
    setSelectedEntry((prev) => {
      if (prev && prev.id === entry.id) {
        return null;
      }
      return entry;
    });
  }, []);

  /**
   * Handle closing the detail panel.
   */
  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  /**
   * Handle exporting logs as JSON.
   */
  const handleExportJSON = useCallback(() => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalEntries: sortedLogs.length,
        filters: {
          eventType: filterEventType || 'all',
          personaId: filterPersonaId || 'all',
          startDate: filterStartDate || 'none',
          endDate: filterEndDate || 'none',
        },
        entries: sortedLogs,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification('success', `Exported ${sortedLogs.length} audit log entries as JSON.`);
    } catch (_err) {
      addNotification('error', 'Failed to export audit log.');
    }
  }, [sortedLogs, filterEventType, filterPersonaId, filterStartDate, filterEndDate, addNotification]);

  /**
   * Handle clearing all logs.
   */
  const handleClearLogs = useCallback(() => {
    const success = clearLogs();
    if (success) {
      addNotification('success', 'All audit log entries have been cleared.');
      setSelectedEntry(null);
      setCurrentPage(0);
    } else {
      addNotification('error', 'Failed to clear audit log.');
    }
  }, [clearLogs, addNotification]);

  /**
   * Handle purging old logs (older than 7 days).
   */
  const handlePurgeOld = useCallback(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const purgedCount = purgeOld(sevenDaysMs);
    if (purgedCount >= 0) {
      addNotification('success', `Purged ${purgedCount} audit log entries older than 7 days.`);
      setSelectedEntry(null);
      setCurrentPage(0);
    } else {
      addNotification('error', 'Failed to purge old audit log entries.');
    }
  }, [purgeOld, addNotification]);

  /**
   * Handle refreshing logs.
   */
  const handleRefresh = useCallback(() => {
    refreshLogs();
    refreshCount();
    addNotification('info', 'Audit log refreshed.');
  }, [refreshLogs, refreshCount, addNotification]);

  /**
   * Handle next page.
   */
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  /**
   * Handle previous page.
   */
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  /**
   * Render the sort indicator for a column header.
   * @param {string} field - The field name.
   * @returns {import('react').ReactElement} The sort indicator element.
   */
  function renderSortIndicator(field) {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-dreeso-dark-600 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
        </svg>
      );
    }

    return sortDirection === SORT_DIR.ASC ? (
      <svg className="w-3 h-3 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 15a.75.75 0 01-.75-.75V4.612L7.29 6.573a.75.75 0 01-1.08-1.04l3.25-3.5a.75.75 0 011.08 0l3.25 3.5a.75.75 0 01-1.08 1.04l-1.96-2.11v9.638A.75.75 0 0110 15z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 5a.75.75 0 01.75.75v9.638l1.96-2.11a.75.75 0 111.08 1.04l-3.25 3.5a.75.75 0 01-1.08 0l-3.25-3.5a.75.75 0 111.08-1.04l1.96 2.11V5.75A.75.75 0 0110 5z" clipRule="evenodd" />
      </svg>
    );
  }

  const hasFilters = filterEventType || filterPersonaId || filterStartDate || filterEndDate;

  if (isLoading && logs.length === 0) {
    return (
      <Layout showNavbar showQueryBar keyboardEnabled>
        <div className={`space-y-6 ${className}`}>
          <SkeletonLoader variant="card" count={3} />
          <SkeletonLoader variant="table" count={1} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar showQueryBar keyboardEnabled>
      <div className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="flex items-start justify-between animate-slide-in">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{
                backgroundColor: `${resolvedAccentColor}15`,
                color: resolvedAccentColor,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">
                Audit Log
              </h1>
              <p className="text-xs text-dreeso-dark-400 mt-0.5">
                {totalCount} total entries — max {maxEntries}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={handleRefresh}
              aria-label="Refresh audit log"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 002.63 8.395a.75.75 0 001.449.39z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-accent-400 hover:text-dreeso-accent-300 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
              onClick={handleExportJSON}
              aria-label="Export audit log as JSON"
              disabled={sortedLogs.length === 0}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Export JSON
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryStatCard
            label="Total Events"
            value={summary.total}
            accentColor="#17b363"
            index={0}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Queries"
            value={summary.queries}
            accentColor="#276ef1"
            index={1}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Actions"
            value={summary.actions}
            accentColor="#06c167"
            index={2}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Propagations"
            value={summary.propagations}
            accentColor="#3bcd7e"
            index={3}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Auth Events"
            value={summary.logins}
            accentColor="#ffc043"
            index={4}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Other"
            value={summary.other}
            accentColor="#5a5a5f"
            index={5}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <div className="animate-slide-in">
          <GlassCard
            variant="sm"
            animated={false}
            hoverable={false}
            noPadding
            className="p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Filters
                  </h3>
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    className="text-xs text-dreeso-dark-400 hover:text-white transition-colors duration-150 focus:outline-none"
                    onClick={handleClearFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Event Type filter */}
                <div className="space-y-1">
                  <label htmlFor="filter-event-type" className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                    Event Type
                  </label>
                  <select
                    id="filter-event-type"
                    value={filterEventType}
                    onChange={handleEventTypeChange}
                    className="w-full bg-glass-white backdrop-blur-md border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-200 focus:border-dreeso-accent-500 focus:shadow-accent-glow appearance-none cursor-pointer"
                  >
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-dreeso-dark-900 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Persona filter */}
                <div className="space-y-1">
                  <label htmlFor="filter-persona" className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                    Persona
                  </label>
                  <select
                    id="filter-persona"
                    value={filterPersonaId}
                    onChange={handlePersonaChange}
                    className="w-full bg-glass-white backdrop-blur-md border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-200 focus:border-dreeso-accent-500 focus:shadow-accent-glow appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-dreeso-dark-900 text-white">All Personas</option>
                    {Array.isArray(personaList) && personaList.map((persona) => (
                      <option key={persona.id} value={persona.id} className="bg-dreeso-dark-900 text-white">
                        {persona.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date filter */}
                <div className="space-y-1">
                  <label htmlFor="filter-start-date" className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                    From Date
                  </label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={handleStartDateChange}
                    className="w-full bg-glass-white backdrop-blur-md border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-200 focus:border-dreeso-accent-500 focus:shadow-accent-glow cursor-pointer"
                  />
                </div>

                {/* End Date filter */}
                <div className="space-y-1">
                  <label htmlFor="filter-end-date" className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                    To Date
                  </label>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate}
                    onChange={handleEndDateChange}
                    className="w-full bg-glass-white backdrop-blur-md border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-200 focus:border-dreeso-accent-500 focus:shadow-accent-glow cursor-pointer"
                  />
                </div>
              </div>

              {/* Active filter badges */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filterEventType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                      Type: {filterEventType}
                      <button
                        type="button"
                        className="ml-0.5 hover:text-white transition-colors"
                        onClick={() => setFilterEventType('')}
                        aria-label={`Remove event type filter: ${filterEventType}`}
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filterPersonaId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                      Persona: {resolvePersonaName(filterPersonaId, personaList)}
                      <button
                        type="button"
                        className="ml-0.5 hover:text-white transition-colors"
                        onClick={() => setFilterPersonaId('')}
                        aria-label="Remove persona filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filterStartDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                      From: {filterStartDate}
                      <button
                        type="button"
                        className="ml-0.5 hover:text-white transition-colors"
                        onClick={() => setFilterStartDate('')}
                        aria-label="Remove start date filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filterEndDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                      To: {filterEndDate}
                      <button
                        type="button"
                        className="ml-0.5 hover:text-white transition-colors"
                        onClick={() => setFilterEndDate('')}
                        aria-label="Remove end date filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Primary content area */}
          <div className={`${selectedEntry ? 'col-span-12 lg:col-span-8' : 'col-span-12'} space-y-4`}>
            {/* Error state */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-semantic-error/5 border border-semantic-error/20 rounded-xl animate-slide-in" role="alert">
                <svg className="w-4 h-4 text-semantic-error shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-semantic-error leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Log table */}
            <div className="animate-slide-in">
              <div className="w-full overflow-x-auto rounded-xl border border-glass-border scrollbar-hide">
                <table className="w-full min-w-full border-collapse" role="table" aria-label="Audit log entries">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-dreeso-dark-900/80 backdrop-blur-sm border-b border-glass-border">
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap cursor-pointer hover:text-white transition-colors duration-150"
                        scope="col"
                        onClick={() => handleSort('timestamp')}
                        aria-sort={sortField === 'timestamp' ? (sortDirection === SORT_DIR.ASC ? 'ascending' : 'descending') : 'none'}
                      >
                        <span className="flex items-center gap-1.5">
                          Time
                          {renderSortIndicator('timestamp')}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap cursor-pointer hover:text-white transition-colors duration-150"
                        scope="col"
                        onClick={() => handleSort('eventType')}
                        aria-sort={sortField === 'eventType' ? (sortDirection === SORT_DIR.ASC ? 'ascending' : 'descending') : 'none'}
                      >
                        <span className="flex items-center gap-1.5">
                          Type
                          {renderSortIndicator('eventType')}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap cursor-pointer hover:text-white transition-colors duration-150"
                        scope="col"
                        onClick={() => handleSort('action')}
                        aria-sort={sortField === 'action' ? (sortDirection === SORT_DIR.ASC ? 'ascending' : 'descending') : 'none'}
                      >
                        <span className="flex items-center gap-1.5">
                          Action
                          {renderSortIndicator('action')}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap cursor-pointer hover:text-white transition-colors duration-150"
                        scope="col"
                        onClick={() => handleSort('personaId')}
                        aria-sort={sortField === 'personaId' ? (sortDirection === SORT_DIR.ASC ? 'ascending' : 'descending') : 'none'}
                      >
                        <span className="flex items-center gap-1.5">
                          Persona
                          {renderSortIndicator('personaId')}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap"
                        scope="col"
                      >
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/50">
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((entry, index) => (
                        <LogEntryRow
                          key={entry.id || `log-${index}`}
                          entry={entry}
                          personaList={personaList}
                          isSelected={selectedEntry !== null && selectedEntry.id === entry.id}
                          onSelect={handleSelectEntry}
                          index={index}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-sm text-dreeso-dark-400"
                        >
                          {hasFilters
                            ? 'No audit log entries match the current filters.'
                            : 'No audit log entries recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {sortedLogs.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-3">
                  <div className="text-xs text-dreeso-dark-500">
                    Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedLogs.length)} of {sortedLogs.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border ${
                        currentPage === 0
                          ? 'text-dreeso-dark-600 border-glass-border cursor-not-allowed'
                          : 'text-dreeso-dark-300 hover:text-white border-glass-border hover:bg-glass-hover'
                      }`}
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      aria-label="Previous page"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-dreeso-dark-400">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border ${
                        currentPage >= totalPages - 1
                          ? 'text-dreeso-dark-600 border-glass-border cursor-not-allowed'
                          : 'text-dreeso-dark-300 hover:text-white border-glass-border hover:bg-glass-hover'
                      }`}
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1}
                      aria-label="Next page"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Row count */}
              {sortedLogs.length > 0 && sortedLogs.length <= PAGE_SIZE && (
                <div className="text-xs text-dreeso-dark-500 text-right pt-2">
                  {sortedLogs.length} {sortedLogs.length === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          </div>

          {/* Detail sidebar — 4 columns on desktop */}
          {selectedEntry && (
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <LogDetailPanel
                entry={selectedEntry}
                personaList={personaList}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>

        {/* Management actions */}
        <div className="animate-slide-in">
          <GlassCard
            variant="sm"
            animated={false}
            hoverable={false}
            noPadding
            className="p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                  Log Management
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                  onClick={handlePurgeOld}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  Purge Entries Older Than 7 Days
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-semantic-error hover:text-white bg-semantic-error/5 border border-semantic-error/20 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-semantic-error/50"
                  onClick={handleClearLogs}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                  Clear All Logs
                </button>
              </div>

              <div className="px-3 py-2 bg-glass-white border border-glass-border rounded-xl">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[11px] text-dreeso-dark-300 leading-relaxed">
                    The audit log retains up to {maxEntries} entries using FIFO (first-in, first-out) purging.
                    Older entries are automatically removed when the limit is reached. Use the export function
                    to save logs before purging.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Keyboard shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-4 animate-slide-in">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
              F
            </kbd>
            <span className="text-[10px] text-dreeso-dark-500">Next Screen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
              N
            </kbd>
            <span className="text-[10px] text-dreeso-dark-500">Switch Persona</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
              R
            </kbd>
            <span className="text-[10px] text-dreeso-dark-500">Restart</span>
          </div>
        </div>

        {/* Footer branding */}
        <div className="flex items-center justify-center gap-2 pb-4 animate-slide-in">
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
            {APP_TITLE}
          </span>
        </div>
      </div>
    </Layout>
  );
}

AuditLogPage.propTypes = {
  className: PropTypes.string,
};

export default AuditLogPage;