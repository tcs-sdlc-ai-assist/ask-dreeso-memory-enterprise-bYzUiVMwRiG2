/**
 * SummaryPage — Session summary page for Ask Dreeso Memory (Screen 19).
 * Displays a summary of the current session: queries made, actions executed,
 * systems accessed, propagation events, and persona activity. Glassmorphism
 * cards with key metrics and a timeline of events.
 *
 * @module SummaryPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { SourcePanel } from '@/components/query/SourcePanel';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getLogs } from '@/services/auditLogger';
import { getData } from '@/services/dataManager';
import { APP_TITLE, APP_VERSION, SCREEN_IDS } from '@/utils/constants';

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
 * Map event type to a human-readable label.
 * @param {string} eventType - The audit log event type.
 * @returns {string} Human-readable label.
 */
function getEventTypeLabel(eventType) {
  if (typeof eventType !== 'string') return 'Event';

  switch (eventType) {
    case 'ACTION':
      return 'Action';
    case 'QUERY':
      return 'Query';
    case 'PROPAGATION':
      return 'Propagation';
    case 'PROPAGATION_STEP':
      return 'Update';
    case 'PROPAGATION_NOTIFICATION':
      return 'Notification';
    case 'LOGIN':
      return 'Login';
    case 'SIGNUP':
      return 'Signup';
    case 'PERSONA_SWITCH':
      return 'Switch';
    case 'LOGOUT':
      return 'Logout';
    case 'NAVIGATION':
      return 'Navigation';
    default:
      return eventType;
  }
}

/**
 * Map event type to a dot color.
 * @param {string} eventType - The audit log event type.
 * @returns {string} Hex color string.
 */
function getEventDotColor(eventType) {
  if (typeof eventType !== 'string') return '#5a5a5f';

  switch (eventType) {
    case 'ACTION':
      return '#06c167';
    case 'QUERY':
      return '#276ef1';
    case 'PROPAGATION':
    case 'PROPAGATION_STEP':
      return '#17b363';
    case 'PROPAGATION_NOTIFICATION':
      return '#ffc043';
    case 'LOGIN':
    case 'SIGNUP':
    case 'PERSONA_SWITCH':
      return '#84848b';
    case 'LOGOUT':
      return '#e11900';
    case 'NAVIGATION':
      return '#5a5a5f';
    default:
      return '#5a5a5f';
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
 * TimelineEventCard — Renders a single event in the session timeline.
 *
 * @param {object} props
 * @param {object} props.entry - The audit log entry object.
 * @param {number} props.index - The entry index for staggered animation.
 * @param {boolean} props.isLast - Whether this is the last entry.
 * @returns {import('react').ReactElement|null} The timeline event card element.
 */
function TimelineEventCard({ entry, index, isLast }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 60}ms` };
  const badgeClass = getEventTypeBadgeClass(entry.eventType);
  const typeLabel = getEventTypeLabel(entry.eventType);
  const relativeTime = formatRelativeTime(entry.timestamp);
  const formattedTime = formatTimestamp(entry.timestamp);
  const dotColor = getEventDotColor(entry.eventType);

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <div className="flex gap-4">
        {/* Timeline connector */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="h-3 w-3 rounded-full shrink-0 mt-1.5"
            style={{ backgroundColor: dotColor }}
          />
          {!isLast && (
            <div className="w-px flex-1 min-h-[16px] bg-glass-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 hover:bg-glass-hover">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${badgeClass}`}
                >
                  {typeLabel}
                </span>
                {relativeTime && (
                  <span className="text-[10px] text-dreeso-dark-500" title={formattedTime}>
                    {relativeTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-dreeso-dark-200 leading-relaxed line-clamp-2">
                {entry.action || '—'}
              </p>
              {entry.personaId && (
                <p className="text-[10px] text-dreeso-dark-500">
                  Persona: <span className="text-dreeso-dark-400">{entry.personaId}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TimelineEventCard.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    timestamp: PropTypes.string,
    eventType: PropTypes.string,
    action: PropTypes.string,
    personaId: PropTypes.string,
    userId: PropTypes.string,
    details: PropTypes.object,
  }),
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool.isRequired,
};

/**
 * PersonaActivityCard — Renders a persona activity summary card.
 *
 * @param {object} props
 * @param {object} props.persona - The persona object.
 * @param {number} props.queryCount - Number of queries made by this persona.
 * @param {number} props.actionCount - Number of actions executed by this persona.
 * @param {number} props.propagationCount - Number of propagation events for this persona.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The persona activity card element.
 */
function PersonaActivityCard({ persona, queryCount, actionCount, propagationCount, index }) {
  if (!persona || typeof persona !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 100}ms` };
  const accentColor = persona.colorTheme || '#17b363';
  const totalEvents = queryCount + actionCount + propagationCount;

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
        <div className="space-y-3">
          {/* Persona header */}
          <div className="flex items-start gap-3">
            <Avatar
              initials={persona.avatarInitials}
              colorTheme={accentColor}
              size="md"
              ariaLabel={`Avatar for ${persona.name}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white leading-tight truncate">
                {persona.name}
              </h3>
              <p className="text-xs text-dreeso-dark-400 mt-0.5 truncate">
                {persona.role}
              </p>
              <span
                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded-lg"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}10`,
                  borderColor: `${accentColor}20`,
                }}
              >
                {totalEvents} event{totalEvents !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Activity breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#276ef1' }} />
                <span className="text-[11px] text-dreeso-dark-400">Queries</span>
              </div>
              <span className="text-[11px] text-dreeso-dark-300 font-medium">{queryCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#06c167' }} />
                <span className="text-[11px] text-dreeso-dark-400">Actions</span>
              </div>
              <span className="text-[11px] text-dreeso-dark-300 font-medium">{actionCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#17b363' }} />
                <span className="text-[11px] text-dreeso-dark-400">Propagations</span>
              </div>
              <span className="text-[11px] text-dreeso-dark-300 font-medium">{propagationCount}</span>
            </div>
          </div>

          {/* Activity bar */}
          {totalEvents > 0 && (
            <div className="h-1.5 w-full bg-dreeso-dark-800 rounded-full overflow-hidden flex">
              {queryCount > 0 && (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(queryCount / totalEvents) * 100}%`,
                    backgroundColor: '#276ef1',
                  }}
                />
              )}
              {actionCount > 0 && (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(actionCount / totalEvents) * 100}%`,
                    backgroundColor: '#06c167',
                  }}
                />
              )}
              {propagationCount > 0 && (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(propagationCount / totalEvents) * 100}%`,
                    backgroundColor: '#17b363',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

PersonaActivityCard.propTypes = {
  persona: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    avatarInitials: PropTypes.string,
    colorTheme: PropTypes.string,
  }),
  queryCount: PropTypes.number.isRequired,
  actionCount: PropTypes.number.isRequired,
  propagationCount: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * SystemAccessCard — Renders a single system access summary.
 *
 * @param {object} props
 * @param {object} props.system - The system object.
 * @param {number} props.accessCount - Number of times this system was accessed.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The system access card element.
 */
function SystemAccessCard({ system, accessCount, index }) {
  if (!system || typeof system !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 60}ms` };
  const systemColor = system.color || '#666666';

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 hover:bg-glass-hover">
        <div
          className="h-3 w-3 rounded-full shrink-0 animate-pulse-green"
          style={{ backgroundColor: systemColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">
            {system.shortName || system.name || 'Unknown System'}
          </p>
        </div>
        <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
          {accessCount} access{accessCount !== 1 ? 'es' : ''}
        </span>
      </div>
    </div>
  );
}

SystemAccessCard.propTypes = {
  system: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
  }),
  accessCount: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * SummaryPage component.
 * Session summary page (Screen 19). Displays a summary of the current session:
 * queries made, actions executed, systems accessed, propagation events, and
 * persona activity. Glassmorphism cards with key metrics and a timeline of events.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The summary page element.
 */
export function SummaryPage({ className = '' }) {
  const { currentPersonaId, currentPersona, personaList } = usePersona();
  const { session } = useAuth();
  const { addNotification, goToScreenById } = useApp();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [allLogs, setAllLogs] = useState([]);

  const mountedRef = useRef(true);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';
  const displayName = session
    ? session.displayName
    : (currentPersona ? currentPersona.name : 'User');

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load all audit logs
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        const logs = getLogs({});
        setAllLogs(logs);
      } catch (_err) {
        setAllLogs([]);
      }

      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  /**
   * All connected systems loaded from mock data.
   * @type {object[]}
   */
  const allSystems = useMemo(() => {
    return getData('systems');
  }, []);

  /**
   * Summary statistics computed from audit logs.
   * @type {object}
   */
  const summary = useMemo(() => {
    if (!Array.isArray(allLogs) || allLogs.length === 0) {
      return {
        totalEvents: 0,
        queries: 0,
        actions: 0,
        propagations: 0,
        propagationSteps: 0,
        notifications: 0,
        logins: 0,
        personaSwitches: 0,
        navigations: 0,
        uniquePersonas: 0,
        uniqueSystems: 0,
      };
    }

    let queries = 0;
    let actions = 0;
    let propagations = 0;
    let propagationSteps = 0;
    let notifications = 0;
    let logins = 0;
    let personaSwitches = 0;
    let navigations = 0;
    const personaSet = new Set();
    const systemSet = new Set();

    for (let i = 0; i < allLogs.length; i++) {
      const entry = allLogs[i];
      const eventType = entry.eventType;

      if (eventType === 'QUERY') queries++;
      else if (eventType === 'ACTION') actions++;
      else if (eventType === 'PROPAGATION') propagations++;
      else if (eventType === 'PROPAGATION_STEP') propagationSteps++;
      else if (eventType === 'PROPAGATION_NOTIFICATION') notifications++;
      else if (eventType === 'LOGIN' || eventType === 'SIGNUP') logins++;
      else if (eventType === 'PERSONA_SWITCH') personaSwitches++;
      else if (eventType === 'NAVIGATION') navigations++;

      if (entry.personaId) {
        personaSet.add(entry.personaId);
      }

      // Extract system references from details
      if (entry.details && typeof entry.details === 'object') {
        if (entry.details.targetSystem) {
          systemSet.add(entry.details.targetSystem);
        }
        if (typeof entry.details.affectedSystemsCount === 'number' && entry.details.affectedSystemsCount > 0) {
          // We know systems were accessed but don't have IDs here
        }
        if (entry.details.systemName) {
          systemSet.add(entry.details.systemName);
        }
        if (Array.isArray(entry.details.sourceSystems)) {
          for (let j = 0; j < entry.details.sourceSystems.length; j++) {
            systemSet.add(entry.details.sourceSystems[j]);
          }
        }
      }
    }

    return {
      totalEvents: allLogs.length,
      queries,
      actions,
      propagations,
      propagationSteps,
      notifications,
      logins,
      personaSwitches,
      navigations,
      uniquePersonas: personaSet.size,
      uniqueSystems: systemSet.size,
    };
  }, [allLogs]);

  /**
   * Per-persona activity breakdown.
   * @type {{ persona: object, queryCount: number, actionCount: number, propagationCount: number }[]}
   */
  const personaActivity = useMemo(() => {
    if (!Array.isArray(allLogs) || allLogs.length === 0 || !Array.isArray(personaList)) {
      return [];
    }

    const personaMap = {};

    for (let i = 0; i < allLogs.length; i++) {
      const entry = allLogs[i];
      const pid = entry.personaId;
      if (!pid) continue;

      if (!personaMap[pid]) {
        personaMap[pid] = { queries: 0, actions: 0, propagations: 0 };
      }

      if (entry.eventType === 'QUERY') personaMap[pid].queries++;
      else if (entry.eventType === 'ACTION') personaMap[pid].actions++;
      else if (entry.eventType === 'PROPAGATION' || entry.eventType === 'PROPAGATION_STEP' || entry.eventType === 'PROPAGATION_NOTIFICATION') personaMap[pid].propagations++;
    }

    return personaList
      .filter((persona) => personaMap[persona.id])
      .map((persona) => ({
        persona,
        queryCount: personaMap[persona.id].queries,
        actionCount: personaMap[persona.id].actions,
        propagationCount: personaMap[persona.id].propagations,
      }))
      .sort((a, b) => {
        const totalA = a.queryCount + a.actionCount + a.propagationCount;
        const totalB = b.queryCount + b.actionCount + b.propagationCount;
        return totalB - totalA;
      });
  }, [allLogs, personaList]);

  /**
   * System access counts from propagation step logs.
   * @type {{ system: object, accessCount: number }[]}
   */
  const systemAccess = useMemo(() => {
    if (!Array.isArray(allLogs) || allLogs.length === 0) {
      return [];
    }

    const systemCountMap = {};

    for (let i = 0; i < allLogs.length; i++) {
      const entry = allLogs[i];
      if (entry.eventType !== 'PROPAGATION_STEP' && entry.eventType !== 'PROPAGATION') continue;

      if (entry.details && typeof entry.details === 'object') {
        const targetSystem = entry.details.targetSystem;
        if (targetSystem && typeof targetSystem === 'string') {
          if (!systemCountMap[targetSystem]) {
            systemCountMap[targetSystem] = 0;
          }
          systemCountMap[targetSystem]++;
        }
      }
    }

    return allSystems
      .map((system) => ({
        system,
        accessCount: systemCountMap[system.id] || 0,
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }, [allLogs, allSystems]);

  /**
   * Active source system names for the SourcePanel.
   * @type {string[]}
   */
  const activeSources = useMemo(() => {
    return systemAccess
      .filter((item) => item.accessCount > 0)
      .map((item) => item.system.shortName || item.system.name);
  }, [systemAccess]);

  /**
   * Timeline events — most recent first, limited to 20.
   * @type {object[]}
   */
  const timelineEvents = useMemo(() => {
    if (!Array.isArray(allLogs)) return [];
    return allLogs.slice(0, 20);
  }, [allLogs]);

  /**
   * Session duration string.
   * @type {string}
   */
  const sessionDuration = useMemo(() => {
    if (!Array.isArray(allLogs) || allLogs.length === 0) {
      return '—';
    }

    // Logs are sorted newest first
    const newest = allLogs[0];
    const oldest = allLogs[allLogs.length - 1];

    if (!newest || !oldest || !newest.timestamp || !oldest.timestamp) {
      return '—';
    }

    try {
      const newestTime = new Date(newest.timestamp).getTime();
      const oldestTime = new Date(oldest.timestamp).getTime();
      if (isNaN(newestTime) || isNaN(oldestTime)) return '—';

      const diffMs = newestTime - oldestTime;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffSeconds < 60) return `${diffSeconds}s`;
      if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds % 60}s`;
      return `${diffHours}h ${diffMinutes % 60}m`;
    } catch (_err) {
      return '—';
    }
  }, [allLogs]);

  /**
   * Handle navigating to the audit log page.
   */
  const handleViewAuditLog = useCallback(() => {
    // Navigate to the closing screen which is the next in the flow
    goToScreenById(SCREEN_IDS.CLOSING);
  }, [goToScreenById]);

  /**
   * Handle navigating back to the cross-domain overview.
   */
  const handleBackToCrossDomain = useCallback(() => {
    navigate('/cross-domain');
  }, [navigate]);

  /**
   * Handle exporting session summary as JSON.
   */
  const handleExportSummary = useCallback(() => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        sessionSummary: {
          displayName,
          currentPersonaId,
          duration: sessionDuration,
          ...summary,
        },
        personaActivity: personaActivity.map((item) => ({
          personaId: item.persona.id,
          personaName: item.persona.name,
          queries: item.queryCount,
          actions: item.actionCount,
          propagations: item.propagationCount,
        })),
        systemAccess: systemAccess
          .filter((item) => item.accessCount > 0)
          .map((item) => ({
            systemId: item.system.id,
            systemName: item.system.shortName || item.system.name,
            accessCount: item.accessCount,
          })),
        recentEvents: timelineEvents.slice(0, 50),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `session-summary-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification('success', 'Session summary exported as JSON.');
    } catch (_err) {
      addNotification('error', 'Failed to export session summary.');
    }
  }, [displayName, currentPersonaId, sessionDuration, summary, personaActivity, systemAccess, timelineEvents, addNotification]);

  if (isLoading) {
    return (
      <Layout showNavbar showQueryBar keyboardEnabled>
        <div className={`space-y-6 ${className}`}>
          <SkeletonLoader variant="card" count={3} />
          <SkeletonLoader variant="text" count={4} />
          <SkeletonLoader variant="card" count={2} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar showQueryBar keyboardEnabled>
      <div className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-dreeso-accent-500/10 text-dreeso-accent-400 shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                  Session Summary
                </h1>
                <p className="text-sm text-dreeso-dark-300 leading-relaxed mt-1 max-w-2xl">
                  A comprehensive overview of your session activity — queries made, actions executed,
                  systems accessed, and cross-domain propagation events.
                </p>
                {currentPersona && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar
                      initials={currentPersona.avatarInitials}
                      colorTheme={resolvedAccentColor}
                      size="xs"
                      ariaLabel={`Avatar for ${currentPersona.name}`}
                    />
                    <span className="text-xs text-dreeso-dark-400">
                      {displayName} — {currentPersona.role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-accent-400 hover:text-dreeso-accent-300 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
                onClick={handleExportSummary}
                aria-label="Export session summary as JSON"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryStatCard
            label="Total Events"
            value={summary.totalEvents}
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
            value={summary.propagations + summary.propagationSteps}
            accentColor="#3bcd7e"
            index={3}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Notifications"
            value={summary.notifications}
            accentColor="#ffc043"
            index={4}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Session Duration"
            value={sessionDuration}
            accentColor="#84848b"
            index={5}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Source Panel */}
        <SourcePanel
          activeSources={activeSources}
          size="md"
          showLabel
          showCount
          animated
          compact={false}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Primary content area — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Event Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between animate-slide-in">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Event Timeline
                  </h2>
                </div>
                <span className="text-xs text-dreeso-dark-500">
                  {timelineEvents.length} event{timelineEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {timelineEvents.length > 0 ? (
                <div className="space-y-0 max-h-[600px] overflow-y-auto scrollbar-hide">
                  {timelineEvents.map((entry, index) => (
                    <TimelineEventCard
                      key={entry.id || `timeline-${index}`}
                      entry={entry}
                      index={index}
                      isLast={index === timelineEvents.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-in">
                  <svg className="w-8 h-8 text-dreeso-dark-600 mb-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-dreeso-dark-400">
                    No events recorded in this session yet.
                  </p>
                  <p className="text-xs text-dreeso-dark-500 mt-1">
                    Start by selecting a persona and exploring intelligence clusters.
                  </p>
                </div>
              )}
            </div>

            {/* Event type breakdown */}
            {summary.totalEvents > 0 && (
              <div className="animate-slide-in">
                <GlassCard
                  variant="sm"
                  animated={false}
                  hoverable={false}
                  noPadding
                  className="p-4"
                >
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                      Event Type Breakdown
                    </h3>

                    <div className="space-y-2">
                      {[
                        { label: 'Queries', count: summary.queries, color: '#276ef1' },
                        { label: 'Actions', count: summary.actions, color: '#06c167' },
                        { label: 'Propagations', count: summary.propagations, color: '#17b363' },
                        { label: 'Propagation Steps', count: summary.propagationSteps, color: '#3bcd7e' },
                        { label: 'Notifications', count: summary.notifications, color: '#ffc043' },
                        { label: 'Auth Events', count: summary.logins + summary.personaSwitches, color: '#84848b' },
                        { label: 'Navigation', count: summary.navigations, color: '#5a5a5f' },
                      ]
                        .filter((item) => item.count > 0)
                        .map((item, index) => {
                          const percentage = summary.totalEvents > 0
                            ? Math.round((item.count / summary.totalEvents) * 100)
                            : 0;

                          return (
                            <div key={`breakdown-${index}`} className="flex items-center gap-3">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs text-dreeso-dark-300 w-32 shrink-0">
                                {item.label}
                              </span>
                              <div className="flex-1 h-2 bg-dreeso-dark-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                              <span className="text-[11px] text-dreeso-dark-400 font-mono w-10 text-right shrink-0">
                                {item.count}
                              </span>
                              <span className="text-[10px] text-dreeso-dark-500 font-mono w-8 text-right shrink-0">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Persona Activity */}
            {personaActivity.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 animate-slide-in">
                  <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                  </svg>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Persona Activity
                  </h2>
                </div>

                <div className="space-y-3">
                  {personaActivity.map((item, index) => (
                    <PersonaActivityCard
                      key={item.persona.id}
                      persona={item.persona}
                      queryCount={item.queryCount}
                      actionCount={item.actionCount}
                      propagationCount={item.propagationCount}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Systems Accessed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between animate-slide-in">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Systems Accessed
                  </h2>
                </div>
                <span className="text-xs text-dreeso-dark-500">
                  {allSystems.length} total
                </span>
              </div>

              <div className="animate-slide-in">
                <GlassCard
                  variant="sm"
                  animated={false}
                  hoverable={false}
                  noPadding
                  className="p-4"
                >
                  <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-hide">
                    {systemAccess.map((item, index) => (
                      <SystemAccessCard
                        key={item.system.id}
                        system={item.system}
                        accessCount={item.accessCount}
                        index={index}
                      />
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Session info card */}
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
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                      Session Info
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">User</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">{displayName}</span>
                    </div>
                    {currentPersona && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-dreeso-dark-500">Current Persona</span>
                        <span className="text-[11px] text-dreeso-dark-300 font-medium">{currentPersona.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Duration</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">{sessionDuration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Personas Used</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">{summary.uniquePersonas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Persona Switches</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">{summary.personaSwitches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Version</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-mono">v{APP_VERSION}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Quick navigation */}
            <div className="animate-slide-in">
              <GlassCard
                variant="sm"
                animated={false}
                hoverable={false}
                noPadding
                className="p-4"
              >
                <div className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Quick Navigation
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                      onClick={handleBackToCrossDomain}
                    >
                      <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                      </svg>
                      Cross-Domain System Map
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                      onClick={handleViewAuditLog}
                    >
                      <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                      Continue to Closing
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                      onClick={() => navigate('/home')}
                    >
                      <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                      </svg>
                      Back to Home
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Keyboard shortcuts */}
            <div className="animate-slide-in">
              <GlassCard
                variant="sm"
                animated={false}
                hoverable={false}
                noPadding
                className="p-4"
              >
                <div className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        F
                      </kbd>
                      <span className="text-[11px] text-dreeso-dark-400">Next Screen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        N
                      </kbd>
                      <span className="text-[11px] text-dreeso-dark-400">Switch Persona</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        R
                      </kbd>
                      <span className="text-[11px] text-dreeso-dark-400">Restart Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        ←
                      </kbd>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        →
                      </kbd>
                      <span className="text-[11px] text-dreeso-dark-400">Navigate</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="animate-slide-in">
          <GlassCard
            variant="sm"
            animated={false}
            hoverable={false}
            noPadding
            className="p-4"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white">
                  Session Memory & Context
                </h3>
                <p className="text-xs text-dreeso-dark-300 leading-relaxed mt-1">
                  {APP_TITLE} preserves context across your entire session — every query, action, and
                  propagation event is tracked and connected. This session summary demonstrates how
                  the system builds institutional memory over time, enabling smarter follow-up queries
                  and more informed decision-making across all connected enterprise systems.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer branding */}
        <div className="flex items-center justify-center gap-2 pt-2 pb-4 animate-slide-in">
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

SummaryPage.propTypes = {
  className: PropTypes.string,
};

export default SummaryPage;