/**
 * CrossDomainPage — Cross-domain propagation summary page for Ask Dreeso Memory (Screens 16-17).
 * Shows full propagation results: which actions triggered updates in which systems,
 * affected personas, and downstream effects. Includes timeline visualization and
 * system-by-system breakdown.
 *
 * @module CrossDomainPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Layout } from '@/components/layout/Layout';
import { PropagationFeed } from '@/components/actions/PropagationFeed';
import { SourcePanel } from '@/components/query/SourcePanel';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getData, getDataById } from '@/services/dataManager';
import {
  getAllPropagationRules,
  getPropagationPreview,
  getAffectedSystems,
  getNotifiedPersonas,
} from '@/services/crossDomainPropagator';
import { getLogs } from '@/services/auditLogger';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

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
 * SystemBreakdownCard — Renders a single system breakdown card showing
 * all propagation steps that affect this system.
 *
 * @param {object} props
 * @param {object} props.system - The system object.
 * @param {object[]} props.steps - Array of propagation steps affecting this system.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The system breakdown card element.
 */
function SystemBreakdownCard({ system, steps, index }) {
  const [expanded, setExpanded] = useState(false);

  if (!system || typeof system !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 80}ms` };
  const systemColor = system.color || '#666666';

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable={false}
        noPadding
        className="overflow-hidden"
      >
        {/* System header */}
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-glass-hover focus:outline-none focus:ring-1 focus:ring-glass-border rounded-xl"
          onClick={handleToggle}
          aria-expanded={expanded}
          aria-label={`${system.shortName || system.name}: ${steps.length} propagation steps. ${expanded ? 'Collapse' : 'Expand'} details.`}
        >
          <div
            className="h-3 w-3 rounded-full shrink-0 animate-pulse-green"
            style={{ backgroundColor: systemColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">
                {system.shortName || system.name || 'Unknown System'}
              </span>
              <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
                {steps.length} step{steps.length !== 1 ? 's' : ''}
              </span>
            </div>
            {system.description && (
              <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-1 mt-0.5">
                {system.description}
              </p>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-dreeso-dark-400 transition-transform duration-150 shrink-0 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-glass-border/50 pt-3">
            {steps.map((step, stepIndex) => (
              <div
                key={`sys-step-${stepIndex}`}
                className="flex items-start gap-2.5 px-3 py-2.5 bg-glass-white border border-glass-border rounded-lg"
              >
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-dreeso-dark-800 text-[10px] font-mono text-dreeso-dark-400 shrink-0 mt-0.5">
                  {step.order || stepIndex + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  {step.dataUpdate && (
                    <p className="text-[11px] text-dreeso-dark-300 leading-relaxed">
                      {step.dataUpdate}
                    </p>
                  )}
                  {step.actionLabel && (
                    <p className="text-[10px] text-dreeso-dark-500">
                      Triggered by: <span className="text-dreeso-dark-300">{step.actionLabel}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

SystemBreakdownCard.propTypes = {
  system: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    description: PropTypes.string,
  }),
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * AffectedPersonaCard — Renders a single affected persona card showing
 * all notifications they would receive.
 *
 * @param {object} props
 * @param {object} props.persona - The persona object.
 * @param {object[]} props.notifications - Array of notification objects for this persona.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The affected persona card element.
 */
function AffectedPersonaCard({ persona, notifications, index }) {
  if (!persona || typeof persona !== 'object') {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 80}ms` };
  const accentColor = persona.colorTheme || '#17b363';

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
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded-lg"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}10`,
                  borderColor: `${accentColor}20`,
                }}
              >
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-1.5">
              {notifications.map((notification, notifIndex) => (
                <div
                  key={`persona-notif-${notifIndex}`}
                  className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                >
                  <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-dreeso-dark-300 leading-relaxed line-clamp-3">
                      {notification.message || ''}
                    </p>
                    {notification.actionLabel && (
                      <p className="text-[10px] text-dreeso-dark-500 mt-1">
                        From: <span className="text-dreeso-dark-400">{notification.actionLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

AffectedPersonaCard.propTypes = {
  persona: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    avatarInitials: PropTypes.string,
    colorTheme: PropTypes.string,
  }),
  notifications: PropTypes.arrayOf(PropTypes.object).isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * TimelineEntry — Renders a single entry in the propagation timeline.
 *
 * @param {object} props
 * @param {object} props.rule - The propagation rule object.
 * @param {object} props.action - The action object.
 * @param {object} props.preview - The propagation preview object.
 * @param {number} props.index - The entry index for staggered animation.
 * @param {boolean} props.isLast - Whether this is the last entry.
 * @returns {import('react').ReactElement|null} The timeline entry element.
 */
function TimelineEntry({ rule, action, preview, index, isLast }) {
  const [expanded, setExpanded] = useState(false);

  if (!rule || !action) {
    return null;
  }

  const animationStyle = { animationDelay: `${index * 100}ms` };
  const typeBadgeClass = resolveTypeBadgeClass(rule.actionType);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const hasChain = preview && Array.isArray(preview.propagationChain) && preview.propagationChain.length > 0;
  const hasNotifications = preview && Array.isArray(preview.notifiedPersonas) && preview.notifiedPersonas.length > 0;
  const hasAffectedSystems = preview && Array.isArray(preview.affectedSystems) && preview.affectedSystems.length > 0;

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <div className="flex gap-4">
        {/* Timeline connector */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-dreeso-dark-800 border border-glass-border text-xs font-mono text-dreeso-dark-400">
            {index + 1}
          </div>
          {!isLast && (
            <div className="w-px flex-1 min-h-[24px] bg-glass-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-6">
          <GlassCard
            variant="sm"
            animated={false}
            hoverable={false}
            noPadding
            className="overflow-hidden"
          >
            {/* Header */}
            <button
              type="button"
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-glass-hover focus:outline-none focus:ring-1 focus:ring-glass-border rounded-xl"
              onClick={handleToggle}
              aria-expanded={expanded}
              aria-label={`${action.label}: ${expanded ? 'Collapse' : 'Expand'} propagation details.`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">
                    {action.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${typeBadgeClass}`}
                  >
                    {rule.actionType || 'action'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {rule.category && (
                    <span className="text-[11px] text-dreeso-dark-400">
                      {rule.category}
                    </span>
                  )}
                  {hasAffectedSystems && (
                    <span className="text-[11px] text-dreeso-dark-500">
                      • {preview.affectedSystems.length} system{preview.affectedSystems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {hasNotifications && (
                    <span className="text-[11px] text-dreeso-dark-500">
                      • {preview.notifiedPersonas.length} persona{preview.notifiedPersonas.length !== 1 ? 's' : ''} notified
                    </span>
                  )}
                </div>
                {rule.triggerDescription && (
                  <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2">
                    {rule.triggerDescription}
                  </p>
                )}
                {/* Affected systems dots */}
                {hasAffectedSystems && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {preview.affectedSystems.map((system, sysIndex) => (
                      <div
                        key={`timeline-sys-dot-${sysIndex}`}
                        className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse-green"
                        style={{ backgroundColor: system.color || '#666666' }}
                        title={system.shortName || system.systemName || ''}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {rule.rollbackSupported ? (
                  <span className="text-[10px] text-semantic-success">Reversible</span>
                ) : (
                  <span className="text-[10px] text-semantic-warning">Irreversible</span>
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
                {/* Description */}
                {action.description && (
                  <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                    {action.description}
                  </p>
                )}

                {/* Propagation chain */}
                {hasChain && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                      Propagation Chain ({preview.propagationChain.length} steps)
                    </h4>
                    <div className="space-y-1.5">
                      {preview.propagationChain.map((step, stepIndex) => (
                        <div
                          key={`timeline-chain-${stepIndex}`}
                          className="flex items-center gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                        >
                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-dreeso-dark-800 text-[10px] font-mono text-dreeso-dark-400 shrink-0">
                            {step.order || stepIndex + 1}
                          </div>
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: step.color || '#666666' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white truncate">
                                {step.shortName || step.systemName || 'System'}
                              </span>
                              {step.operation && (
                                <span className="px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                                  {step.operation}
                                </span>
                              )}
                            </div>
                            {step.dataUpdate && (
                              <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2 mt-0.5">
                                {step.dataUpdate}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            {step.latency && (
                              <span className="text-[10px] text-dreeso-dark-500 font-mono">
                                {step.latency}
                              </span>
                            )}
                            {typeof step.confidence === 'number' && (
                              <span className="text-[10px] text-dreeso-dark-500 font-mono">
                                {Math.round(step.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notified personas */}
                {hasNotifications && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                      Notified Personas ({preview.notifiedPersonas.length})
                    </h4>
                    <div className="space-y-1.5">
                      {preview.notifiedPersonas.map((notif, notifIndex) => (
                        <div
                          key={`timeline-notif-${notifIndex}`}
                          className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-white">
                                {notif.personaName || 'Unknown'}
                              </span>
                              {notif.role && (
                                <span className="text-[10px] text-dreeso-dark-500">
                                  ({notif.role})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2 mt-0.5">
                              {notif.message || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-[10px] text-dreeso-dark-500 font-mono pt-1 border-t border-glass-border/30">
                  {rule.ruleId && (
                    <span>Rule: {rule.ruleId}</span>
                  )}
                  {rule.sourceSystem && (
                    <span>Source: {rule.sourceSystem}</span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

TimelineEntry.propTypes = {
  rule: PropTypes.object.isRequired,
  action: PropTypes.object.isRequired,
  preview: PropTypes.object,
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool.isRequired,
};

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
 * CrossDomainPage component.
 * Cross-domain propagation summary page (Screens 16-17). Shows full propagation
 * results: which actions triggered updates in which systems, affected personas,
 * and downstream effects. Includes timeline visualization and system-by-system breakdown.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {object[]} [props.propagationEvents=[]] - Optional array of propagation events to display.
 * @param {function} [props.onEventClick] - Optional callback when a propagation event is clicked.
 * @returns {import('react').ReactElement} The cross-domain page element.
 */
export function CrossDomainPage({
  className = '',
  propagationEvents = [],
  onEventClick,
}) {
  const { currentPersonaId, currentPersona, personaList } = usePersona();
  const { session } = useAuth();
  const { addNotification, goToScreenById } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [currentPersonaId]);

  /**
   * All propagation rules from the dataset.
   * @type {object[]}
   */
  const allRules = useMemo(() => {
    try {
      return getAllPropagationRules();
    } catch (_err) {
      return [];
    }
  }, []);

  /**
   * All actions from the dataset.
   * @type {object[]}
   */
  const allActions = useMemo(() => {
    return getData('actions');
  }, []);

  /**
   * All systems from the dataset.
   * @type {object[]}
   */
  const allSystems = useMemo(() => {
    return getData('systems');
  }, []);

  /**
   * All personas from the dataset.
   * @type {object[]}
   */
  const allPersonas = useMemo(() => {
    return getData('personas');
  }, []);

  /**
   * Timeline entries built from propagation rules and actions.
   * @type {{ rule: object, action: object, preview: object }[]}
   */
  const timelineEntries = useMemo(() => {
    return allRules.map((rule) => {
      const action = allActions.find((a) => a.id === rule.actionId);
      let preview = null;
      try {
        preview = getPropagationPreview(rule.actionId);
      } catch (_err) {
        preview = null;
      }
      return {
        rule,
        action: action || { id: rule.actionId, label: rule.actionId, description: '', type: rule.actionType, category: rule.category },
        preview,
      };
    });
  }, [allRules, allActions]);

  /**
   * System-by-system breakdown: for each system, collect all propagation steps that affect it.
   * @type {{ system: object, steps: object[] }[]}
   */
  const systemBreakdown = useMemo(() => {
    const systemStepsMap = {};

    for (let i = 0; i < timelineEntries.length; i++) {
      const { rule, action, preview } = timelineEntries[i];
      if (!preview || !Array.isArray(preview.propagationChain)) continue;

      for (let j = 0; j < preview.propagationChain.length; j++) {
        const step = preview.propagationChain[j];
        const systemId = step.targetSystem;
        if (!systemId) continue;

        if (!systemStepsMap[systemId]) {
          systemStepsMap[systemId] = [];
        }
        systemStepsMap[systemId].push({
          ...step,
          actionLabel: action.label,
          actionId: action.id,
          ruleId: rule.ruleId,
          category: rule.category,
        });
      }
    }

    return allSystems
      .filter((system) => systemStepsMap[system.id] && systemStepsMap[system.id].length > 0)
      .map((system) => ({
        system,
        steps: systemStepsMap[system.id],
      }))
      .sort((a, b) => b.steps.length - a.steps.length);
  }, [timelineEntries, allSystems]);

  /**
   * Persona-by-persona breakdown: for each persona, collect all notifications.
   * @type {{ persona: object, notifications: object[] }[]}
   */
  const personaBreakdown = useMemo(() => {
    const personaNotifMap = {};

    for (let i = 0; i < timelineEntries.length; i++) {
      const { rule, action, preview } = timelineEntries[i];
      if (!preview || !Array.isArray(preview.notifiedPersonas)) continue;

      for (let j = 0; j < preview.notifiedPersonas.length; j++) {
        const notif = preview.notifiedPersonas[j];
        const personaId = notif.personaId;
        if (!personaId) continue;

        if (!personaNotifMap[personaId]) {
          personaNotifMap[personaId] = [];
        }
        personaNotifMap[personaId].push({
          ...notif,
          actionLabel: action.label,
          actionId: action.id,
          ruleId: rule.ruleId,
          category: rule.category,
        });
      }
    }

    return allPersonas
      .filter((persona) => personaNotifMap[persona.id] && personaNotifMap[persona.id].length > 0)
      .map((persona) => ({
        persona,
        notifications: personaNotifMap[persona.id],
      }))
      .sort((a, b) => b.notifications.length - a.notifications.length);
  }, [timelineEntries, allPersonas]);

  /**
   * Summary statistics.
   * @type {object}
   */
  const summary = useMemo(() => {
    const totalRules = allRules.length;
    const totalSystems = systemBreakdown.length;
    const totalPersonas = personaBreakdown.length;
    let totalSteps = 0;
    let reversibleCount = 0;

    for (let i = 0; i < allRules.length; i++) {
      const rule = allRules[i];
      if (Array.isArray(rule.propagationChain)) {
        totalSteps += rule.propagationChain.length;
      }
      if (rule.rollbackSupported) {
        reversibleCount++;
      }
    }

    const categorySet = new Set();
    for (let i = 0; i < allRules.length; i++) {
      if (allRules[i].category) {
        categorySet.add(allRules[i].category);
      }
    }

    return {
      totalRules,
      totalSystems,
      totalPersonas,
      totalSteps,
      reversibleCount,
      irreversibleCount: totalRules - reversibleCount,
      categories: categorySet.size,
    };
  }, [allRules, systemBreakdown, personaBreakdown]);

  /**
   * Recent propagation audit log entries.
   * @type {object[]}
   */
  const recentPropagationLogs = useMemo(() => {
    try {
      return getLogs({ eventType: 'PROPAGATION', limit: 10 });
    } catch (_err) {
      return [];
    }
  }, []);

  /**
   * Build propagation events for the PropagationFeed from external events or from rules.
   * @type {object[]}
   */
  const feedEvents = useMemo(() => {
    if (Array.isArray(propagationEvents) && propagationEvents.length > 0) {
      return propagationEvents;
    }

    // Build preview events from propagation rules
    return timelineEntries.slice(0, 10).map((entry) => {
      const { rule, action, preview } = entry;
      return {
        propagationId: `preview-${rule.ruleId}`,
        status: 'success',
        message: rule.triggerDescription || '',
        actionId: rule.actionId,
        actionLabel: action.label,
        actionType: rule.actionType || '',
        category: rule.category || '',
        executionId: '',
        ruleId: rule.ruleId || '',
        rollbackSupported: rule.rollbackSupported || false,
        affectedSystems: preview ? preview.affectedSystems || [] : [],
        stepResults: preview ? (preview.propagationChain || []).map((step) => ({
          ...step,
          status: 'success',
        })) : [],
        notifications: preview ? preview.notifiedPersonas || [] : [],
        timestamp: new Date().toISOString(),
      };
    });
  }, [propagationEvents, timelineEntries]);

  const handleTabTimeline = useCallback(() => {
    setActiveTab('timeline');
  }, []);

  const handleTabSystems = useCallback(() => {
    setActiveTab('systems');
  }, []);

  const handleTabPersonas = useCallback(() => {
    setActiveTab('personas');
  }, []);

  const handleTabFeed = useCallback(() => {
    setActiveTab('feed');
  }, []);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  if (isLoading) {
    return (
      <Layout showNavbar showQueryBar keyboardEnabled>
        <div className={`space-y-6 ${className}`}>
          <SkeletonLoader variant="card" count={3} />
          <SkeletonLoader variant="text" count={4} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar showQueryBar keyboardEnabled>
      <div className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="animate-slide-in">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-dreeso-accent-500/10 text-dreeso-accent-400 shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zm-6.5 4a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                Cross-Domain System Map
              </h1>
              <p className="text-sm text-dreeso-dark-300 leading-relaxed mt-1 max-w-2xl">
                A comprehensive overview of all cross-domain propagation paths showing data flow relationships,
                affected systems, and persona notifications across the entire platform.
              </p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryStatCard
            label="Propagation Rules"
            value={summary.totalRules}
            accentColor="#17b363"
            index={0}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Connected Systems"
            value={summary.totalSystems}
            accentColor="#276ef1"
            index={1}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Affected Personas"
            value={summary.totalPersonas}
            accentColor="#ffc043"
            index={2}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Total Steps"
            value={summary.totalSteps}
            accentColor="#06c167"
            index={3}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Reversible"
            value={summary.reversibleCount}
            accentColor="#06c167"
            index={4}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 002.63 8.395a.75.75 0 001.449.39z" clipRule="evenodd" />
              </svg>
            }
          />
          <SummaryStatCard
            label="Categories"
            value={summary.categories}
            accentColor="#e11900"
            index={5}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Source Panel */}
        <SourcePanel
          activeSources={allSystems.map((s) => s.shortName || s.name)}
          size="md"
          showLabel
          showCount
          animated
          compact={false}
        />

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-glass-white border border-glass-border rounded-xl backdrop-blur-md animate-slide-in overflow-x-auto scrollbar-hide">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabTimeline}
            aria-pressed={activeTab === 'timeline'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              Timeline
            </span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 whitespace-nowrap ${
              activeTab === 'systems'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabSystems}
            aria-pressed={activeTab === 'systems'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
              </svg>
              Systems ({summary.totalSystems})
            </span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 whitespace-nowrap ${
              activeTab === 'personas'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabPersonas}
            aria-pressed={activeTab === 'personas'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Personas ({summary.totalPersonas})
            </span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-dreeso-accent-500/15 text-dreeso-accent-400 border border-dreeso-accent-500/20'
                : 'text-dreeso-dark-300 hover:text-white hover:bg-glass-hover border border-transparent'
            }`}
            onClick={handleTabFeed}
            aria-pressed={activeTab === 'feed'}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
              </svg>
              Feed
            </span>
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Primary content area — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Timeline tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 animate-slide-in">
                  Propagation Timeline ({timelineEntries.length} rules)
                </h2>
                <div className="space-y-0">
                  {timelineEntries.map((entry, index) => (
                    <TimelineEntry
                      key={entry.rule.ruleId || `timeline-${index}`}
                      rule={entry.rule}
                      action={entry.action}
                      preview={entry.preview}
                      index={index}
                      isLast={index === timelineEntries.length - 1}
                    />
                  ))}
                </div>
                {timelineEntries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-in">
                    <svg className="w-8 h-8 text-dreeso-dark-600 mb-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-dreeso-dark-400">
                      No propagation rules found.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Systems tab */}
            {activeTab === 'systems' && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 animate-slide-in">
                  System-by-System Breakdown ({systemBreakdown.length} systems)
                </h2>
                <div className="space-y-3">
                  {systemBreakdown.map((item, index) => (
                    <SystemBreakdownCard
                      key={item.system.id}
                      system={item.system}
                      steps={item.steps}
                      index={index}
                    />
                  ))}
                </div>
                {systemBreakdown.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-in">
                    <svg className="w-8 h-8 text-dreeso-dark-600 mb-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-dreeso-dark-400">
                      No system breakdown data available.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Personas tab */}
            {activeTab === 'personas' && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 animate-slide-in">
                  Affected Personas ({personaBreakdown.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {personaBreakdown.map((item, index) => (
                    <AffectedPersonaCard
                      key={item.persona.id}
                      persona={item.persona}
                      notifications={item.notifications}
                      index={index}
                    />
                  ))}
                </div>
                {personaBreakdown.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-in">
                    <svg className="w-8 h-8 text-dreeso-dark-600 mb-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                    </svg>
                    <p className="text-sm text-dreeso-dark-400">
                      No affected personas found.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Feed tab */}
            {activeTab === 'feed' && (
              <PropagationFeed
                events={feedEvents}
                title="Propagation Events"
                showTitle
                animated
                compact={false}
                maxEvents={10}
                emptyMessage="No propagation events available."
                onEventClick={onEventClick}
              />
            )}
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Overview card */}
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
                      Platform Overview
                    </h3>
                  </div>

                  <p className="text-xs text-dreeso-dark-300 leading-relaxed">
                    {APP_TITLE} connects {allSystems.length} enterprise systems through {allRules.length} propagation
                    rules, enabling real-time cross-domain updates with full transparency and audit trails.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Reversible Actions</span>
                      <span className="text-[11px] text-semantic-success font-medium">{summary.reversibleCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Irreversible Actions</span>
                      <span className="text-[11px] text-semantic-warning font-medium">{summary.irreversibleCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Action Categories</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">{summary.categories}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-dreeso-dark-500">Avg Steps per Rule</span>
                      <span className="text-[11px] text-dreeso-dark-300 font-medium">
                        {summary.totalRules > 0 ? (summary.totalSteps / summary.totalRules).toFixed(1) : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Connected systems list */}
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
                        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        All Systems
                      </h3>
                    </div>
                    <span className="text-[11px] text-dreeso-dark-500">
                      {allSystems.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-hide">
                    {allSystems.map((system) => {
                      const breakdown = systemBreakdown.find((sb) => sb.system.id === system.id);
                      const stepCount = breakdown ? breakdown.steps.length : 0;

                      return (
                        <div
                          key={system.id}
                          className="flex items-center gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 hover:bg-glass-hover"
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse-green"
                            style={{ backgroundColor: system.color || '#666666' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {system.shortName || system.name}
                            </p>
                          </div>
                          {stepCount > 0 && (
                            <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
                              {stepCount} step{stepCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Recent propagation logs */}
            {recentPropagationLogs.length > 0 && (
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
                        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        Recent Audit Logs
                      </h3>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                      {recentPropagationLogs.map((entry, index) => (
                        <div
                          key={entry.id || `log-${index}`}
                          className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                        >
                          <div className="h-2 w-2 rounded-full bg-dreeso-accent-400 shrink-0 mt-1.5 animate-pulse-green" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-dreeso-dark-200 leading-relaxed line-clamp-2">
                              {entry.action || ''}
                            </p>
                            {entry.timestamp && (
                              <p className="text-[10px] text-dreeso-dark-500 mt-0.5">
                                {formatTimestamp(entry.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

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
                  How Cross-Domain Propagation Works
                </h3>
                <p className="text-xs text-dreeso-dark-300 leading-relaxed mt-1">
                  When an action is executed in {APP_TITLE}, it triggers a propagation chain that automatically
                  updates all connected enterprise systems. Each step shows the target system, operation type,
                  data update description, expected latency, and confidence score. Affected personas are
                  automatically notified with context-specific messages. All propagation events are logged
                  in the audit trail for complete transparency.
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

CrossDomainPage.propTypes = {
  className: PropTypes.string,
  propagationEvents: PropTypes.arrayOf(PropTypes.object),
  onEventClick: PropTypes.func,
};

export default CrossDomainPage;