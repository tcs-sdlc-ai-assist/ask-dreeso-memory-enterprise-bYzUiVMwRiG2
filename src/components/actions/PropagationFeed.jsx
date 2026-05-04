/**
 * PropagationFeed — Cross-domain propagation feed component for Ask Dreeso Memory.
 * Displays a live feed of propagation events showing which systems and personas
 * were affected by an action. Each entry shows timestamp, action type, affected
 * persona, system, and update description. Animated entry with slide-in.
 *
 * @module PropagationFeed
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { usePersona } from '@/contexts/PersonaContext';
import { useApp } from '@/contexts/AppContext';
import { getAllPropagationRules, getPropagationPreview } from '@/services/crossDomainPropagator';
import { getData, getDataById } from '@/services/dataManager';

/**
 * Action type badge color mappings.
 * @type {Record<string, string>}
 */
const ACTION_TYPE_CLASSES = {
  reassign: 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20',
  approve: 'text-semantic-success bg-semantic-success/10 border-semantic-success/20',
  update: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  escalate: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
  create: 'text-dreeso-accent-400 bg-dreeso-accent-500/10 border-dreeso-accent-500/20',
  submit: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  reject: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
};

/**
 * Propagation status badge color mappings.
 * @type {Record<string, string>}
 */
const STATUS_CLASSES = {
  success: 'text-semantic-success bg-semantic-success/10 border-semantic-success/20',
  partial: 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20',
  failed: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
  skipped: 'text-dreeso-dark-400 bg-dreeso-dark-800/50 border-glass-border',
  no_rule: 'text-dreeso-dark-400 bg-dreeso-dark-800/50 border-glass-border',
};

/**
 * Resolve the badge class for an action type.
 * @param {string} actionType - The action type string.
 * @returns {string} The Tailwind class string for the badge.
 */
function resolveTypeBadgeClass(actionType) {
  if (typeof actionType === 'string' && ACTION_TYPE_CLASSES[actionType]) {
    return ACTION_TYPE_CLASSES[actionType];
  }
  return ACTION_TYPE_CLASSES.update;
}

/**
 * Resolve the badge class for a propagation status.
 * @param {string} status - The status string.
 * @returns {string} The Tailwind class string for the badge.
 */
function resolveStatusBadgeClass(status) {
  if (typeof status === 'string' && STATUS_CLASSES[status]) {
    return STATUS_CLASSES[status];
  }
  return STATUS_CLASSES.success;
}

/**
 * Format an ISO timestamp into a short human-readable string.
 * @param {string} isoTimestamp - The ISO timestamp string.
 * @returns {string} A formatted time string, or empty string if invalid.
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

    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatTimestamp(isoTimestamp);
  } catch (_err) {
    return '';
  }
}

/**
 * SystemDot — Renders a small colored dot for a system.
 *
 * @param {object} props
 * @param {string} props.color - The system color hex string.
 * @param {boolean} [props.active=false] - Whether the dot should pulse.
 * @returns {import('react').ReactElement} The system dot element.
 */
function SystemDot({ color, active = false }) {
  return (
    <div
      className={`h-2.5 w-2.5 rounded-full shrink-0 ${active ? 'animate-pulse-green' : ''}`}
      style={{ backgroundColor: color || '#666666' }}
    />
  );
}

SystemDot.propTypes = {
  color: PropTypes.string,
  active: PropTypes.bool,
};

/**
 * PropagationStepEntry — Renders a single propagation step in the feed.
 *
 * @param {object} props
 * @param {object} props.step - The propagation step object.
 * @param {number} props.index - The step index for staggered animation.
 * @param {boolean} props.animated - Whether to apply slide-in animation.
 * @returns {import('react').ReactElement|null} The step entry element.
 */
function PropagationStepEntry({ step, index, animated }) {
  if (!step || typeof step !== 'object') {
    return null;
  }

  const animationStyle = animated
    ? { animationDelay: `${index * 100}ms` }
    : {};

  const animationClass = animated ? 'animate-slide-in opacity-0' : '';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 hover:bg-glass-hover ${animationClass}`}
      style={animationStyle}
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <SystemDot color={step.color} active={step.status === 'success'} />
        {step.showConnector !== false && (
          <div className="w-px h-full min-h-[16px] bg-glass-border mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-white truncate">
            {step.shortName || step.systemName || 'System'}
          </span>
          {step.operation && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
              {step.operation}
            </span>
          )}
          {step.latency && (
            <span className="text-[10px] text-dreeso-dark-500 font-mono">
              {step.latency}
            </span>
          )}
          {typeof step.confidence === 'number' && (
            <span className="text-[10px] text-dreeso-dark-500 font-mono ml-auto shrink-0">
              {Math.round(step.confidence * 100)}%
            </span>
          )}
        </div>

        {/* Data update description */}
        {step.dataUpdate && (
          <p className="text-[11px] text-dreeso-dark-300 leading-relaxed line-clamp-2">
            {step.dataUpdate}
          </p>
        )}
      </div>
    </div>
  );
}

PropagationStepEntry.propTypes = {
  step: PropTypes.shape({
    order: PropTypes.number,
    targetSystem: PropTypes.string,
    systemName: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    operation: PropTypes.string,
    dataUpdate: PropTypes.string,
    latency: PropTypes.string,
    confidence: PropTypes.number,
    status: PropTypes.string,
    showConnector: PropTypes.bool,
  }),
  index: PropTypes.number.isRequired,
  animated: PropTypes.bool.isRequired,
};

/**
 * NotificationEntry — Renders a single notification in the feed.
 *
 * @param {object} props
 * @param {object} props.notification - The notification object.
 * @param {number} props.index - The entry index for staggered animation.
 * @param {boolean} props.animated - Whether to apply slide-in animation.
 * @returns {import('react').ReactElement|null} The notification entry element.
 */
function NotificationEntry({ notification, index, animated }) {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  const animationStyle = animated
    ? { animationDelay: `${index * 100}ms` }
    : {};

  const animationClass = animated ? 'animate-slide-in opacity-0' : '';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 hover:bg-glass-hover ${animationClass}`}
      style={animationStyle}
    >
      {/* Icon */}
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-semantic-info/10 text-semantic-info shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white">
            {notification.personaName || 'Unknown'}
          </span>
          {notification.role && (
            <span className="text-[10px] text-dreeso-dark-500">
              ({notification.role})
            </span>
          )}
        </div>
        {notification.message && (
          <p className="text-[11px] text-dreeso-dark-300 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        )}
      </div>
    </div>
  );
}

NotificationEntry.propTypes = {
  notification: PropTypes.shape({
    personaId: PropTypes.string,
    personaName: PropTypes.string,
    role: PropTypes.string,
    message: PropTypes.string,
  }),
  index: PropTypes.number.isRequired,
  animated: PropTypes.bool.isRequired,
};

/**
 * PropagationEventCard — Renders a single propagation event in the feed.
 * Shows the action that triggered propagation, affected systems, and notifications.
 *
 * @param {object} props
 * @param {object} props.event - The propagation event object.
 * @param {boolean} props.animated - Whether to apply slide-in animation.
 * @param {boolean} props.expanded - Whether the event details are expanded.
 * @param {function} props.onToggle - Callback to toggle expanded state.
 * @param {number} props.index - The event index for staggered animation.
 * @returns {import('react').ReactElement|null} The event card element.
 */
function PropagationEventCard({ event, animated, expanded, onToggle, index }) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const typeBadgeClass = resolveTypeBadgeClass(event.actionType);
  const statusBadgeClass = resolveStatusBadgeClass(event.status);
  const timestamp = event.timestamp ? formatRelativeTime(event.timestamp) : '';
  const formattedTime = event.timestamp ? formatTimestamp(event.timestamp) : '';

  const hasSteps = Array.isArray(event.stepResults) && event.stepResults.length > 0;
  const hasNotifications = Array.isArray(event.notifications) && event.notifications.length > 0;
  const hasAffectedSystems = Array.isArray(event.affectedSystems) && event.affectedSystems.length > 0;

  const animationStyle = animated
    ? { animationDelay: `${index * 150}ms` }
    : {};

  const animationClass = animated ? 'animate-slide-in opacity-0' : '';

  return (
    <div
      className={`${animationClass}`}
      style={animationStyle}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable={false}
        noPadding
        className="overflow-hidden"
      >
        {/* Event header — clickable to expand/collapse */}
        <button
          type="button"
          className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-glass-hover focus:outline-none focus:ring-1 focus:ring-glass-border rounded-xl"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`Propagation event: ${event.actionLabel || 'Action'}. ${expanded ? 'Collapse' : 'Expand'} details.`}
        >
          {/* Status indicator */}
          <div className="flex items-center justify-center shrink-0 mt-0.5">
            {event.status === 'success' ? (
              <svg className="w-4.5 h-4.5 text-semantic-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : event.status === 'partial' ? (
              <svg className="w-4.5 h-4.5 text-semantic-warning" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : event.status === 'failed' ? (
              <svg className="w-4.5 h-4.5 text-semantic-error" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-dreeso-dark-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Event info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {event.actionLabel || 'Action'}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${typeBadgeClass}`}
              >
                {event.actionType || 'action'}
              </span>
            </div>

            {/* Summary line */}
            <div className="flex items-center gap-2 flex-wrap">
              {event.category && (
                <span className="text-[11px] text-dreeso-dark-400">
                  {event.category}
                </span>
              )}
              {hasAffectedSystems && (
                <span className="text-[11px] text-dreeso-dark-500">
                  • {event.affectedSystems.length} system{event.affectedSystems.length !== 1 ? 's' : ''}
                </span>
              )}
              {hasNotifications && (
                <span className="text-[11px] text-dreeso-dark-500">
                  • {event.notifications.length} notification{event.notifications.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Affected systems dots */}
            {hasAffectedSystems && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {event.affectedSystems.map((system, sysIndex) => (
                  <SystemDot
                    key={`sys-dot-${sysIndex}`}
                    color={system.color}
                    active={event.status === 'success'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right side: timestamp and expand indicator */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {timestamp && (
              <span className="text-[10px] text-dreeso-dark-500" title={formattedTime}>
                {timestamp}
              </span>
            )}
            <svg
              className={`w-3.5 h-3.5 text-dreeso-dark-400 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-glass-border/50 pt-3">
            {/* Message */}
            {event.message && (
              <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                {event.message}
              </p>
            )}

            {/* Propagation steps */}
            {hasSteps && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  Cross-Domain Updates ({event.stepResults.length})
                </h4>
                <div className="space-y-1.5">
                  {event.stepResults.map((step, stepIndex) => (
                    <PropagationStepEntry
                      key={`step-${stepIndex}`}
                      step={{
                        ...step,
                        showConnector: stepIndex < event.stepResults.length - 1,
                      }}
                      index={stepIndex}
                      animated={animated}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Affected systems summary */}
            {hasAffectedSystems && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  Affected Systems ({event.affectedSystems.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.affectedSystems.map((system, sysIndex) => (
                    <span
                      key={`affected-sys-${sysIndex}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap"
                    >
                      <SystemDot color={system.color} active={false} />
                      {system.shortName || system.systemName || 'System'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            {hasNotifications && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                  Notifications Sent ({event.notifications.length})
                </h4>
                <div className="space-y-1.5">
                  {event.notifications.map((notification, notifIndex) => (
                    <NotificationEntry
                      key={`notif-${notifIndex}`}
                      notification={notification}
                      index={notifIndex}
                      animated={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rollback info */}
            <div className="flex items-center gap-2 text-xs pt-1">
              {event.rollbackSupported ? (
                <>
                  <svg className="w-3.5 h-3.5 text-semantic-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-semantic-success">Rollback supported</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-semantic-warning shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-semantic-warning">This propagation cannot be reversed</span>
                </>
              )}
            </div>

            {/* Execution metadata */}
            <div className="flex items-center gap-3 text-[10px] text-dreeso-dark-500 font-mono pt-1 border-t border-glass-border/30">
              {event.propagationId && (
                <span>ID: {event.propagationId}</span>
              )}
              {event.ruleId && (
                <span>Rule: {event.ruleId}</span>
              )}
              {event.executionId && (
                <span>Exec: {event.executionId}</span>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

PropagationEventCard.propTypes = {
  event: PropTypes.shape({
    propagationId: PropTypes.string,
    status: PropTypes.string,
    message: PropTypes.string,
    actionId: PropTypes.string,
    actionLabel: PropTypes.string,
    actionType: PropTypes.string,
    category: PropTypes.string,
    executionId: PropTypes.string,
    ruleId: PropTypes.string,
    rollbackSupported: PropTypes.bool,
    affectedSystems: PropTypes.arrayOf(PropTypes.object),
    stepResults: PropTypes.arrayOf(PropTypes.object),
    notifications: PropTypes.arrayOf(PropTypes.object),
    timestamp: PropTypes.string,
  }),
  animated: PropTypes.bool.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * PropagationFeed component.
 * Displays a live feed of propagation events showing which systems and personas
 * were affected by an action. Each entry shows timestamp, action type, affected
 * persona, system, and update description. Animated entry with slide-in.
 *
 * Can be fed events externally via the `events` prop, or it can display
 * a preview of all available propagation rules from the dataset.
 *
 * @param {object} props
 * @param {object[]} [props.events=[]] - Array of propagation result objects to display.
 *   Each object should match the shape returned by CrossDomainPropagator.propagate().
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {string} [props.title='Propagation Feed'] - Section title.
 * @param {boolean} [props.showTitle=true] - Whether to display the section title.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {boolean} [props.showPreview=false] - Whether to show a preview of all propagation rules
 *   when no events are provided.
 * @param {boolean} [props.compact=false] - Whether to use compact layout.
 * @param {number} [props.maxEvents=10] - Maximum number of events to display.
 * @param {string} [props.emptyMessage='No propagation events yet.'] - Message when no events.
 * @param {function} [props.onEventClick] - Optional callback when an event is clicked.
 * @returns {import('react').ReactElement} The propagation feed element.
 */
export function PropagationFeed({
  events = [],
  className = '',
  title = 'Propagation Feed',
  showTitle = true,
  animated = true,
  showPreview = false,
  compact = false,
  maxEvents = 10,
  emptyMessage = 'No propagation events yet.',
  onEventClick,
}) {
  const { currentPersonaId } = usePersona();

  const [expandedEvents, setExpandedEvents] = useState({});

  /**
   * Resolved maximum number of events to display.
   * @type {number}
   */
  const resolvedMaxEvents = typeof maxEvents === 'number' && maxEvents > 0
    ? Math.min(maxEvents, 50)
    : 10;

  /**
   * Build preview events from propagation rules when showPreview is true and no events provided.
   * @type {object[]}
   */
  const previewEvents = useMemo(() => {
    if (!showPreview || (Array.isArray(events) && events.length > 0)) {
      return [];
    }

    try {
      const rules = getAllPropagationRules();
      const actions = getData('actions');

      return rules
        .slice(0, resolvedMaxEvents)
        .map((rule) => {
          const action = actions.find((a) => a.id === rule.actionId);
          const preview = getPropagationPreview(rule.actionId);

          return {
            propagationId: `preview-${rule.ruleId}`,
            status: 'success',
            message: rule.triggerDescription || '',
            actionId: rule.actionId,
            actionLabel: action ? action.label : rule.actionId,
            actionType: rule.actionType || '',
            category: rule.category || '',
            executionId: '',
            ruleId: rule.ruleId || '',
            rollbackSupported: rule.rollbackSupported || false,
            affectedSystems: preview.affectedSystems || [],
            stepResults: (preview.propagationChain || []).map((step) => ({
              ...step,
              status: 'success',
            })),
            notifications: preview.notifiedPersonas || [],
            timestamp: new Date().toISOString(),
          };
        });
    } catch (_err) {
      return [];
    }
  }, [showPreview, events, resolvedMaxEvents]);

  /**
   * The resolved list of events to display.
   * @type {object[]}
   */
  const displayEvents = useMemo(() => {
    const sourceEvents = Array.isArray(events) && events.length > 0
      ? events
      : previewEvents;

    return sourceEvents.slice(0, resolvedMaxEvents);
  }, [events, previewEvents, resolvedMaxEvents]);

  /**
   * Toggle the expanded state of an event.
   * @param {string} eventId - The event propagation ID.
   */
  const handleToggleExpand = useCallback((eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));

    if (typeof onEventClick === 'function') {
      const event = displayEvents.find((e) => e.propagationId === eventId);
      if (event) {
        onEventClick(event);
      }
    }
  }, [displayEvents, onEventClick]);

  const hasEvents = displayEvents.length > 0;
  const hasTitle = showTitle && typeof title === 'string' && title.trim() !== '';
  const animationClass = animated ? 'animate-slide-in' : '';

  /**
   * Summary counts for the feed header.
   */
  const summary = useMemo(() => {
    if (!hasEvents) {
      return { total: 0, success: 0, partial: 0, failed: 0, systems: 0 };
    }

    let success = 0;
    let partial = 0;
    let failed = 0;
    const systemSet = new Set();

    for (let i = 0; i < displayEvents.length; i++) {
      const event = displayEvents[i];
      if (event.status === 'success') success++;
      else if (event.status === 'partial') partial++;
      else if (event.status === 'failed') failed++;

      if (Array.isArray(event.affectedSystems)) {
        for (let j = 0; j < event.affectedSystems.length; j++) {
          const sys = event.affectedSystems[j];
          if (sys.systemId) systemSet.add(sys.systemId);
        }
      }
    }

    return {
      total: displayEvents.length,
      success,
      partial,
      failed,
      systems: systemSet.size,
    };
  }, [displayEvents, hasEvents]);

  return (
    <div
      className={`w-full space-y-4 ${animationClass} ${className}`}
      role="feed"
      aria-label="Propagation events feed"
    >
      {/* Header */}
      {hasTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zm-6.5 4a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
              {title}
            </h2>
          </div>
          {hasEvents && (
            <div className="flex items-center gap-3 text-xs text-dreeso-dark-500">
              <span>{summary.total} event{summary.total !== 1 ? 's' : ''}</span>
              {summary.systems > 0 && (
                <span>• {summary.systems} system{summary.systems !== 1 ? 's' : ''}</span>
              )}
              {summary.success > 0 && (
                <span className="text-semantic-success">{summary.success} ✓</span>
              )}
              {summary.partial > 0 && (
                <span className="text-semantic-warning">{summary.partial} ⚠</span>
              )}
              {summary.failed > 0 && (
                <span className="text-semantic-error">{summary.failed} ✗</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Events list */}
      {hasEvents ? (
        <div className={`space-y-3 ${compact ? 'max-h-96 overflow-y-auto scrollbar-hide' : ''}`}>
          {displayEvents.map((event, index) => {
            const eventId = event.propagationId || `event-${index}`;
            const isExpanded = expandedEvents[eventId] === true;

            return (
              <PropagationEventCard
                key={eventId}
                event={event}
                animated={animated}
                expanded={isExpanded}
                onToggle={() => handleToggleExpand(eventId)}
                index={index}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-8 h-8 text-dreeso-dark-600 mb-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zm-6.5 4a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-4.95-1.05a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm9.9 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-dreeso-dark-400">
            {emptyMessage}
          </p>
          <p className="text-xs text-dreeso-dark-500 mt-1">
            Execute an action to see cross-domain propagation events here.
          </p>
        </div>
      )}
    </div>
  );
}

PropagationFeed.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      propagationId: PropTypes.string,
      status: PropTypes.string,
      message: PropTypes.string,
      actionId: PropTypes.string,
      actionLabel: PropTypes.string,
      actionType: PropTypes.string,
      category: PropTypes.string,
      executionId: PropTypes.string,
      ruleId: PropTypes.string,
      rollbackSupported: PropTypes.bool,
      affectedSystems: PropTypes.arrayOf(PropTypes.object),
      stepResults: PropTypes.arrayOf(PropTypes.object),
      notifications: PropTypes.arrayOf(PropTypes.object),
      propagationResults: PropTypes.arrayOf(PropTypes.object),
      timestamp: PropTypes.string,
    })
  ),
  className: PropTypes.string,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  animated: PropTypes.bool,
  showPreview: PropTypes.bool,
  compact: PropTypes.bool,
  maxEvents: PropTypes.number,
  emptyMessage: PropTypes.string,
  onEventClick: PropTypes.func,
};

export default PropagationFeed;