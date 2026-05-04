/**
 * HomePage — Persona home page for Ask Dreeso Memory (Screen 4).
 * Displays persona greeting, six intelligence clusters via ClusterGrid,
 * recent activity summary, and source panel overview. Serves as the main
 * dashboard for each persona. Responsive 12-column grid layout.
 *
 * @module HomePage
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClusterGrid } from '@/components/clusters/ClusterGrid';
import { SourcePanel } from '@/components/query/SourcePanel';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getData } from '@/services/dataManager';
import { getLogs } from '@/services/auditLogger';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

/**
 * Persona-specific greeting messages.
 * @type {Record<string, string>}
 */
const PERSONA_GREETINGS = {
  'persona-lukas': 'Here\'s your portfolio overview. Monitor strategic alignment, budget health, and risk exposure across all active projects.',
  'persona-elena': 'Here\'s your cost intelligence dashboard. Track budget variances, procurement pipelines, and valuation status across projects.',
  'persona-sophie': 'Here\'s your project command center. Monitor schedules, resource allocation, and milestone progress across your projects.',
  'persona-james': 'Here\'s your business development hub. Track pipeline health, client engagement, and market opportunities.',
};

/**
 * Persona-specific quick stat labels.
 * @type {Record<string, object[]>}
 */
const PERSONA_STATS = {
  'persona-lukas': [
    { label: 'Active Projects', value: '12', icon: 'briefcase' },
    { label: 'Portfolio Health', value: '94%', icon: 'heart' },
    { label: 'Open Risks', value: '14', icon: 'shield' },
  ],
  'persona-elena': [
    { label: 'Budget Utilization', value: '62%', icon: 'wallet' },
    { label: 'Active Packages', value: '42', icon: 'truck' },
    { label: 'Open Claims', value: '7', icon: 'file' },
  ],
  'persona-sophie': [
    { label: 'My Projects', value: '3', icon: 'calendar' },
    { label: 'At-Risk Milestones', value: '4', icon: 'alert' },
    { label: 'Team Members', value: '128', icon: 'users' },
  ],
  'persona-james': [
    { label: 'Pipeline Value', value: 'CHF 186M', icon: 'trending' },
    { label: 'Active Proposals', value: '9', icon: 'send' },
    { label: 'Win Rate YTD', value: '38%', icon: 'target' },
  ],
};

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_err) {
    return '';
  }
}

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
    default:
      return 'text-dreeso-dark-400';
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
 * QuickStatCard — Renders a single quick stat card.
 *
 * @param {object} props
 * @param {string} props.label - The stat label.
 * @param {string} props.value - The stat value.
 * @param {string} [props.accentColor] - The accent color.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement} The quick stat card element.
 */
function QuickStatCard({ label, value, accentColor, index }) {
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

QuickStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accentColor: PropTypes.string,
  index: PropTypes.number.isRequired,
};

/**
 * ActivityItem — Renders a single recent activity entry.
 *
 * @param {object} props
 * @param {object} props.entry - The audit log entry object.
 * @param {number} props.index - The item index for staggered animation.
 * @returns {import('react').ReactElement|null} The activity item element.
 */
function ActivityItem({ entry, index }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 60}ms` };
  const typeColor = getEventTypeColor(entry.eventType);
  const typeLabel = getEventTypeLabel(entry.eventType);
  const relativeTime = formatRelativeTime(entry.timestamp);

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <div className="flex items-start gap-3 px-3 py-2.5 bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 hover:bg-glass-hover">
        {/* Event type indicator */}
        <div className="flex items-center justify-center shrink-0 mt-0.5">
          <div
            className={`h-2 w-2 rounded-full shrink-0 ${entry.eventType === 'ACTION' || entry.eventType === 'PROPAGATION' ? 'animate-pulse-green' : ''}`}
            style={{
              backgroundColor:
                entry.eventType === 'ACTION' ? '#06c167' :
                entry.eventType === 'QUERY' ? '#276ef1' :
                entry.eventType === 'PROPAGATION' ? '#17b363' :
                entry.eventType === 'PROPAGATION_NOTIFICATION' ? '#ffc043' :
                '#5a5a5f',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${typeColor}`}>
              {typeLabel}
            </span>
            {relativeTime && (
              <span className="text-[10px] text-dreeso-dark-500">
                {relativeTime}
              </span>
            )}
          </div>
          <p className="text-xs text-dreeso-dark-200 leading-relaxed line-clamp-2">
            {entry.action || ''}
          </p>
        </div>
      </div>
    </div>
  );
}

ActivityItem.propTypes = {
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
};

/**
 * ConnectedSystemsStrip — Renders a horizontal strip of connected system indicators.
 *
 * @param {object} props
 * @param {string} [props.accentColor] - The accent color.
 * @returns {import('react').ReactElement} The connected systems strip element.
 */
function ConnectedSystemsStrip({ accentColor }) {
  const allSystems = useMemo(() => {
    return getData('systems');
  }, []);

  return (
    <GlassCard
      variant="sm"
      animated
      hoverable={false}
      noPadding
      className="p-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Connected Systems
            </h3>
          </div>
          <span className="text-[11px] text-dreeso-dark-500">
            {allSystems.length} systems
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allSystems.map((system) => (
            <span
              key={system.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap transition-colors duration-150 hover:bg-glass-hover"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0 animate-pulse-green"
                style={{ backgroundColor: system.color || '#666666' }}
              />
              {system.shortName || system.name}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

ConnectedSystemsStrip.propTypes = {
  accentColor: PropTypes.string,
};

/**
 * HomePage component.
 * Displays persona greeting, six intelligence clusters via ClusterGrid,
 * recent activity summary, and source panel overview. Serves as the main
 * dashboard for each persona. Responsive 12-column grid layout.
 *
 * @param {object} props
 * @param {function} [props.onQuerySubmit] - Callback when a cluster triggers a query.
 * @param {function} [props.onClusterClick] - Callback when a cluster is clicked.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The home page element.
 */
export function HomePage({
  onQuerySubmit,
  onClusterClick,
  className = '',
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const { session } = useAuth();
  const { goToScreenById, addNotification } = useApp();
  const navigate = useNavigate();

  const [recentActivity, setRecentActivity] = useState([]);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';
  const displayName = session
    ? session.displayName
    : (currentPersona ? currentPersona.name : 'there');
  const firstName = displayName ? displayName.split(' ')[0] : 'there';

  const greeting = currentPersonaId && PERSONA_GREETINGS[currentPersonaId]
    ? PERSONA_GREETINGS[currentPersonaId]
    : 'Welcome to your personalized dashboard. Explore intelligence clusters and insights tailored to your role.';

  const stats = currentPersonaId && PERSONA_STATS[currentPersonaId]
    ? PERSONA_STATS[currentPersonaId]
    : [];

  // Load recent activity from audit log
  useEffect(() => {
    try {
      const filters = {};
      if (currentPersonaId) {
        filters.personaId = currentPersonaId;
      }
      filters.limit = 8;

      const logs = getLogs(filters);
      setRecentActivity(logs);
    } catch (_err) {
      setRecentActivity([]);
    }
  }, [currentPersonaId]);

  /**
   * Handle query submission from a cluster.
   * @param {string} queryTemplate - The query template string.
   */
  const handleQuerySubmit = useCallback((queryTemplate) => {
    if (typeof onQuerySubmit === 'function') {
      onQuerySubmit(queryTemplate);
    }

    // Actual route navigation with query parameter
    navigate(`/query?q=${encodeURIComponent(queryTemplate)}`);
  }, [onQuerySubmit, navigate]);

  /**
   * Handle cluster click.
   * @param {object} cluster - The cluster object.
   */
  const handleClusterClick = useCallback((cluster) => {
    if (typeof onClusterClick === 'function') {
      onClusterClick(cluster);
    }
  }, [onClusterClick]);

  /**
   * Get the current time-based greeting prefix.
   * @returns {string} A greeting prefix like "Good morning".
   */
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // No persona selected state
  if (!currentPersonaId || !currentPersona) {
    return (
      <Layout showNavbar showQueryBar={false} keyboardEnabled>
        <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
          <div className="text-center space-y-4 animate-slide-in">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-dreeso-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dreeso-dark-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Select a Persona
            </h1>
            <p className="text-sm text-dreeso-dark-400 max-w-md mx-auto">
              Choose a persona from the navigation bar to view your personalized dashboard.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
              onClick={() => goToScreenById(SCREEN_IDS.PERSONA_SELECTION)}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Choose Persona
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar showQueryBar keyboardEnabled>
      <div className={`space-y-6 ${className}`}>
        {/* Greeting header */}
        <div className="animate-slide-in">
          <div className="flex items-start gap-4 sm:gap-5">
            <Avatar
              initials={currentPersona.avatarInitials}
              colorTheme={resolvedAccentColor}
              size="lg"
              ring
              ariaLabel={`Avatar for ${currentPersona.name}`}
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                {timeGreeting}, {firstName}
              </h1>
              <p className="text-sm text-dreeso-dark-300 leading-relaxed max-w-2xl">
                {greeting}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded-lg"
                  style={{
                    color: resolvedAccentColor,
                    backgroundColor: `${resolvedAccentColor}10`,
                    borderColor: `${resolvedAccentColor}20`,
                  }}
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full animate-pulse-green"
                    style={{ backgroundColor: resolvedAccentColor }}
                  />
                  {currentPersona.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <QuickStatCard
                key={`stat-${index}-${stat.label}`}
                label={stat.label}
                value={stat.value}
                accentColor={resolvedAccentColor}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Main content grid: Clusters + Sidebar */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Intelligence Clusters — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8">
            <ClusterGrid
              onQuerySubmit={handleQuerySubmit}
              onClusterClick={handleClusterClick}
              animated
              showCategory
              showDescription
              compact={false}
              accentColor={resolvedAccentColor}
              title="Intelligence Clusters"
              showTitle
              maxClusters={6}
            />
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Recent Activity */}
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
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        Recent Activity
                      </h3>
                    </div>
                    <span className="text-[11px] text-dreeso-dark-500">
                      {recentActivity.length} events
                    </span>
                  </div>

                  {recentActivity.length > 0 ? (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-hide">
                      {recentActivity.map((entry, index) => (
                        <ActivityItem
                          key={entry.id || `activity-${index}`}
                          entry={entry}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <svg className="w-6 h-6 text-dreeso-dark-600 mb-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-dreeso-dark-400">
                        No recent activity yet.
                      </p>
                      <p className="text-[11px] text-dreeso-dark-500 mt-0.5">
                        Start by clicking a cluster above.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Connected Systems */}
            <ConnectedSystemsStrip accentColor={resolvedAccentColor} />
          </div>
        </div>

        {/* Source Panel Overview */}
        <SourcePanel
          activeSources={[]}
          size="md"
          showLabel
          showCount
          animated
          compact={false}
        />

        {/* Keyboard shortcut hints */}
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
      </div>
    </Layout>
  );
}

HomePage.propTypes = {
  onQuerySubmit: PropTypes.func,
  onClusterClick: PropTypes.func,
  className: PropTypes.string,
};

export default HomePage;