/**
 * ActionPage — Action execution page for Ask Dreeso Memory (Screens 13-15).
 * Displays action confirmation modal, execution progress, and result summary
 * including cross-domain propagation feed. Shows affected systems and personas
 * with animated updates.
 *
 * @module ActionPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ActionPanel } from '@/components/actions/ActionPanel';
import { ActionConfirmation } from '@/components/actions/ActionConfirmation';
import { PropagationFeed } from '@/components/actions/PropagationFeed';
import { SourcePanel } from '@/components/query/SourcePanel';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  getActionsForPersona,
  getActionPreview,
  validateActionExecution,
} from '@/services/actionExecutor';
import { getData } from '@/services/dataManager';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

/**
 * Action page flow phase constants.
 * @type {Record<string, string>}
 */
const FLOW_PHASE = {
  BROWSE: 'browse',
  CONFIRM: 'confirm',
  EXECUTING: 'executing',
  RESULT: 'result',
};

/**
 * Persona-specific action page titles.
 * @type {Record<string, string>}
 */
const PERSONA_ACTION_TITLES = {
  'persona-lukas': 'Cross-Domain Actions',
  'persona-elena': 'Budget & Procurement Actions',
  'persona-sophie': 'Schedule & Resource Actions',
  'persona-james': 'Sales & Proposal Actions',
};

/**
 * Persona-specific action page descriptions.
 * @type {Record<string, string>}
 */
const PERSONA_ACTION_DESCRIPTIONS = {
  'persona-lukas': 'Execute strategic actions that propagate across connected enterprise systems. Each action triggers real-time updates with full transparency.',
  'persona-elena': 'Execute cost, budget, and procurement actions with cross-domain propagation to SAP, Primavera, and connected systems.',
  'persona-sophie': 'Execute schedule, resource, and task management actions with real-time propagation across project systems.',
  'persona-james': 'Execute sales, proposal, and client engagement actions with cross-domain updates to CRM and financial systems.',
};

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
 * ExecutionResultCard — Displays the result of an action execution.
 *
 * @param {object} props
 * @param {object} props.result - The action execution result object.
 * @param {string} [props.accentColor] - The accent color.
 * @returns {import('react').ReactElement|null} The execution result card element.
 */
function ExecutionResultCard({ result, accentColor }) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const isSuccess = result.status === 'success';
  const formattedTime = formatTimestamp(result.timestamp);

  return (
    <div className="animate-slide-in">
      <GlassCard
        variant="default"
        animated={false}
        hoverable={false}
        className="space-y-4"
      >
        {/* Status header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${
              isSuccess
                ? 'bg-semantic-success/10 text-semantic-success'
                : 'bg-semantic-error/10 text-semantic-error'
            }`}
          >
            {isSuccess ? (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight">
              {result.actionLabel || 'Action Executed'}
            </h2>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">
              {result.message || ''}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {result.actionType && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                  {result.actionType}
                </span>
              )}
              {result.category && (
                <span className="text-[11px] text-dreeso-dark-500">
                  {result.category}
                </span>
              )}
              {result.executionId && (
                <span className="text-[10px] text-dreeso-dark-500 font-mono">
                  ID: {result.executionId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target system */}
        {result.targetSystemName && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-dreeso-dark-400">
              Target: <span className="text-dreeso-dark-200 font-medium">{result.targetSystemName}</span>
            </span>
          </div>
        )}

        {/* Affected systems */}
        {Array.isArray(result.affectedSystems) && result.affectedSystems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Affected Systems ({result.affectedSystems.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.affectedSystems.map((system, index) => (
                <span
                  key={`result-sys-${index}`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0 animate-pulse-green"
                    style={{ backgroundColor: system.color || '#666666' }}
                  />
                  {system.shortName || system.systemName || 'System'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notifications sent */}
        {Array.isArray(result.notifications) && result.notifications.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Personas Notified ({result.notifications.length})
            </h3>
            <div className="space-y-1.5">
              {result.notifications.map((notification, index) => (
                <div
                  key={`result-notif-${index}`}
                  className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                >
                  <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
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
                    <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2 mt-0.5">
                      {notification.message || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rollback info */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-glass-border/50">
          {result.rollbackSupported ? (
            <>
              <svg className="w-3.5 h-3.5 text-semantic-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-semantic-success">Rollback supported — changes can be reversed</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-semantic-warning shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-semantic-warning">This action cannot be reversed</span>
            </>
          )}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-dreeso-dark-500">
              {formattedTime}
            </span>
            <div className="flex items-center gap-1.5">
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
        )}
      </GlassCard>
    </div>
  );
}

ExecutionResultCard.propTypes = {
  result: PropTypes.object,
  accentColor: PropTypes.string,
};

/**
 * ExecutingState — Renders the executing state with progress animation.
 *
 * @param {object} props
 * @param {object|null} props.action - The action being executed.
 * @param {string} [props.accentColor] - The accent color.
 * @returns {import('react').ReactElement} The executing state element.
 */
function ExecutingState({ action, accentColor }) {
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Processing indicator */}
      <GlassCard
        variant="default"
        animated={false}
        hoverable={false}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 animate-spin text-dreeso-accent-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Executing Action...
            </p>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">
              {action ? `Processing "${action.label}" across connected systems` : 'Processing action across connected systems'}
            </p>
          </div>
        </div>

        {/* Simulated progress steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-semantic-success animate-pulse-green" />
            <span className="text-xs text-dreeso-dark-200">Validating permissions...</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-semantic-info animate-pulse-green" style={{ animationDelay: '200ms' }} />
            <span className="text-xs text-dreeso-dark-300">Preparing cross-domain updates...</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-dreeso-dark-500 animate-pulse-green" style={{ animationDelay: '400ms' }} />
            <span className="text-xs text-dreeso-dark-400">Propagating to connected systems...</span>
          </div>
        </div>
      </GlassCard>

      {/* Skeleton for result */}
      <SkeletonLoader variant="card" count={1} />
    </div>
  );
}

ExecutingState.propTypes = {
  action: PropTypes.object,
  accentColor: PropTypes.string,
};

/**
 * BrowseState — Renders the browse state with available actions.
 *
 * @param {object} props
 * @param {object|null} props.currentPersona - The current persona object.
 * @param {string} props.pageTitle - The page title.
 * @param {string} props.pageDescription - The page description.
 * @returns {import('react').ReactElement} The browse state element.
 */
function BrowseState({ currentPersona, pageTitle, pageDescription }) {
  const accentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center animate-slide-in">
      {/* Icon */}
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-6"
        style={{
          backgroundColor: `${accentColor}15`,
          color: accentColor,
        }}
      >
        <svg className="w-8 h-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
        {pageTitle}
      </h2>

      {/* Description */}
      <p className="text-sm text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed mb-6">
        {pageDescription}
      </p>

      {/* Persona indicator */}
      {currentPersona && (
        <div className="flex items-center gap-2.5">
          <Avatar
            initials={currentPersona.avatarInitials}
            colorTheme={accentColor}
            size="sm"
            ariaLabel={`Avatar for ${currentPersona.name}`}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-white leading-tight">
              {currentPersona.name}
            </p>
            <p className="text-xs text-dreeso-dark-400 leading-tight">
              {currentPersona.role}
            </p>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center gap-2 mt-8">
        <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-dreeso-dark-500">
          Select an action from the panel to see its cross-domain effects before executing.
        </span>
      </div>
    </div>
  );
}

BrowseState.propTypes = {
  currentPersona: PropTypes.object,
  pageTitle: PropTypes.string.isRequired,
  pageDescription: PropTypes.string.isRequired,
};

/**
 * ActionPage component.
 * Displays action confirmation modal, execution progress, and result summary
 * including cross-domain propagation feed. Shows affected systems and personas
 * with animated updates.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {function} [props.onActionExecuted] - Optional callback when an action is executed.
 * @param {function} [props.onPropagationComplete] - Optional callback when propagation completes.
 * @param {string} [props.initialActionId] - Optional action ID to pre-select on mount.
 * @returns {import('react').ReactElement} The action page element.
 */
export function ActionPage({
  className = '',
  onActionExecuted,
  onPropagationComplete,
  initialActionId,
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const { session } = useAuth();
  const { addNotification, goToScreenById } = useApp();
  const navigate = useNavigate();

  const [flowPhase, setFlowPhase] = useState(FLOW_PHASE.BROWSE);
  const [selectedAction, setSelectedAction] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [propagationEvents, setPropagationEvents] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const contentRef = useRef(null);
  const mountedRef = useRef(true);
  const initialActionProcessedRef = useRef(false);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  const pageTitle = currentPersonaId && PERSONA_ACTION_TITLES[currentPersonaId]
    ? PERSONA_ACTION_TITLES[currentPersonaId]
    : 'Cross-Domain Actions';

  const pageDescription = currentPersonaId && PERSONA_ACTION_DESCRIPTIONS[currentPersonaId]
    ? PERSONA_ACTION_DESCRIPTIONS[currentPersonaId]
    : 'Execute actions that propagate across connected enterprise systems with full transparency and audit trails.';

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Process initial action ID on mount if provided
  useEffect(() => {
    if (
      initialActionId &&
      typeof initialActionId === 'string' &&
      initialActionId.trim() !== '' &&
      currentPersonaId &&
      !initialActionProcessedRef.current
    ) {
      initialActionProcessedRef.current = true;

      try {
        const preview = getActionPreview(initialActionId);
        if (preview && preview.actionLabel) {
          setSelectedAction({
            id: initialActionId,
            type: preview.actionType,
            label: preview.actionLabel,
            description: preview.description,
            category: preview.category,
            targetSystem: preview.targetSystem,
            confirmationMessage: preview.confirmationMessage,
          });
          setIsConfirmOpen(true);
          setFlowPhase(FLOW_PHASE.CONFIRM);
        }
      } catch (_err) {
        // Silently ignore if action not found
      }
    }
  }, [initialActionId, currentPersonaId]);

  // Reset state when persona changes
  useEffect(() => {
    setFlowPhase(FLOW_PHASE.BROWSE);
    setSelectedAction(null);
    setExecutionResult(null);
    setPropagationEvents([]);
    setIsConfirmOpen(false);
    initialActionProcessedRef.current = false;
  }, [currentPersonaId]);

  /**
   * Handle action executed from ActionPanel.
   * @param {object} actionResult - The action execution result.
   */
  const handleActionExecuted = useCallback((actionResult) => {
    if (!mountedRef.current) return;

    setExecutionResult(actionResult);
    setFlowPhase(FLOW_PHASE.RESULT);
    setIsConfirmOpen(false);

    if (typeof onActionExecuted === 'function') {
      onActionExecuted(actionResult);
    }

    // Scroll to top of content
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [onActionExecuted]);

  /**
   * Handle propagation complete from ActionPanel or ActionConfirmation.
   * @param {object} propagationResult - The propagation result object.
   */
  const handlePropagationComplete = useCallback((propagationResult) => {
    if (!mountedRef.current) return;

    if (propagationResult && typeof propagationResult === 'object') {
      setPropagationEvents((prev) => [
        {
          ...propagationResult,
          actionLabel: propagationResult.actionLabel || (selectedAction ? selectedAction.label : 'Action'),
          actionType: propagationResult.actionType || (selectedAction ? selectedAction.type : ''),
          category: propagationResult.category || (selectedAction ? selectedAction.category : ''),
          timestamp: propagationResult.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    if (typeof onPropagationComplete === 'function') {
      onPropagationComplete(propagationResult);
    }
  }, [selectedAction, onPropagationComplete]);

  /**
   * Handle confirm action from ActionConfirmation.
   * @param {object} actionResult - The action execution result.
   */
  const handleConfirmAction = useCallback((actionResult) => {
    handleActionExecuted(actionResult);
  }, [handleActionExecuted]);

  /**
   * Handle cancel from ActionConfirmation.
   */
  const handleCancelConfirm = useCallback(() => {
    setIsConfirmOpen(false);
    setSelectedAction(null);
    setFlowPhase(FLOW_PHASE.BROWSE);
  }, []);

  /**
   * Handle reset — return to browse state.
   */
  const handleReset = useCallback(() => {
    setFlowPhase(FLOW_PHASE.BROWSE);
    setSelectedAction(null);
    setExecutionResult(null);
    setPropagationEvents([]);
    setIsConfirmOpen(false);
  }, []);

  /**
   * Active source systems from the execution result.
   * @type {string[]}
   */
  const activeSources = useMemo(() => {
    if (!executionResult || !Array.isArray(executionResult.affectedSystems)) {
      return [];
    }
    return executionResult.affectedSystems.map((sys) => sys.systemName || sys.shortName || '');
  }, [executionResult]);

  /**
   * Available actions count for the current persona.
   * @type {number}
   */
  const availableActionsCount = useMemo(() => {
    if (!currentPersonaId) return 0;
    try {
      return getActionsForPersona(currentPersonaId).length;
    } catch (_err) {
      return 0;
    }
  }, [currentPersonaId]);

  // No persona selected state
  if (!currentPersonaId || !currentPersona) {
    return (
      <Layout showNavbar showQueryBar={false} keyboardEnabled>
        <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
          <div className="text-center space-y-4 animate-slide-in">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-dreeso-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dreeso-dark-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Select a Persona
            </h1>
            <p className="text-sm text-dreeso-dark-400 max-w-md mx-auto">
              Choose a persona from the navigation bar to view available actions.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
              onClick={() => navigate('/persona-switch')}
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
      <div ref={contentRef} className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="flex items-center justify-between animate-slide-in">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{
                backgroundColor: `${resolvedAccentColor}15`,
                color: resolvedAccentColor,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-dreeso-dark-400 mt-0.5">
                {currentPersona.name} — {currentPersona.role}
              </p>
            </div>
          </div>

          {/* Reset / New Action button */}
          {flowPhase !== FLOW_PHASE.BROWSE && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={handleReset}
              aria-label="New action"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
              New Action
            </button>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Primary content area — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Browse state — show intro */}
            {flowPhase === FLOW_PHASE.BROWSE && (
              <BrowseState
                currentPersona={currentPersona}
                pageTitle={pageTitle}
                pageDescription={pageDescription}
              />
            )}

            {/* Confirm state — show confirmation modal inline */}
            {flowPhase === FLOW_PHASE.CONFIRM && selectedAction && (
              <ActionConfirmation
                action={selectedAction}
                isOpen={isConfirmOpen}
                modal={false}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelConfirm}
                onPropagationComplete={handlePropagationComplete}
                animated
                showPropagationPreview
                showAffectedSystems
                showNotifications
                accentColor={resolvedAccentColor}
              />
            )}

            {/* Executing state */}
            {flowPhase === FLOW_PHASE.EXECUTING && (
              <ExecutingState
                action={selectedAction}
                accentColor={resolvedAccentColor}
              />
            )}

            {/* Result state */}
            {flowPhase === FLOW_PHASE.RESULT && executionResult && (
              <div className="space-y-6">
                {/* Execution result card */}
                <ExecutionResultCard
                  result={executionResult}
                  accentColor={resolvedAccentColor}
                />

                {/* Source Panel */}
                {activeSources.length > 0 && (
                  <SourcePanel
                    activeSources={activeSources}
                    size="md"
                    showLabel
                    showCount
                    animated
                    compact={false}
                  />
                )}

                {/* Propagation Feed */}
                {propagationEvents.length > 0 && (
                  <PropagationFeed
                    events={propagationEvents}
                    title="Cross-Domain Propagation"
                    showTitle
                    animated
                    compact={false}
                    maxEvents={10}
                  />
                )}

                {/* Action completed — next steps */}
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
                        Next Steps
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50"
                          onClick={handleReset}
                        >
                          <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Execute Another Action
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50"
                          onClick={() => {
                            navigate('/query');
                          }}
                        >
                          <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                          </svg>
                          Ask a Follow-up Query
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Action Panel */}
            <div className="animate-slide-in">
              <ActionPanel
                title="Available Actions"
                showTitle
                animated
                compact
                accentColor={resolvedAccentColor}
                onActionExecuted={handleActionExecuted}
                onPropagationComplete={handlePropagationComplete}
                maxActions={6}
              />
            </div>

            {/* Action summary card */}
            {flowPhase === FLOW_PHASE.RESULT && executionResult && (
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
                        Execution Summary
                      </h3>
                    </div>

                    {/* Action label */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                        Action
                      </p>
                      <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                        {executionResult.actionLabel || '—'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                        Status
                      </p>
                      <span className={`text-xs font-medium ${
                        executionResult.status === 'success' ? 'text-semantic-success' :
                        executionResult.status === 'unauthorized' ? 'text-semantic-error' :
                        'text-semantic-warning'
                      }`}>
                        {executionResult.status === 'success' ? 'Success' :
                         executionResult.status === 'unauthorized' ? 'Unauthorized' :
                         'Failed'}
                      </span>
                    </div>

                    {/* Systems affected */}
                    {Array.isArray(executionResult.affectedSystems) && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Systems
                        </p>
                        <span className="text-xs text-dreeso-dark-300">
                          {executionResult.affectedSystems.length} affected
                        </span>
                      </div>
                    )}

                    {/* Notifications */}
                    {Array.isArray(executionResult.notifications) && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Notifications
                        </p>
                        <span className="text-xs text-dreeso-dark-300">
                          {executionResult.notifications.length} sent
                        </span>
                      </div>
                    )}

                    {/* Propagation events */}
                    {propagationEvents.length > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Propagations
                        </p>
                        <span className="text-xs text-dreeso-dark-300">
                          {propagationEvents.length} event{propagationEvents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Execution ID */}
                    {executionResult.executionId && (
                      <div className="pt-1 border-t border-glass-border/50">
                        <p className="text-[10px] text-dreeso-dark-500 font-mono">
                          ID: {executionResult.executionId}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Connected systems overview */}
            {flowPhase === FLOW_PHASE.BROWSE && (
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
                        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        Connected Systems
                      </h3>
                    </div>

                    <SourcePanel
                      activeSources={[]}
                      size="sm"
                      showLabel={false}
                      showCount
                      animated={false}
                      compact
                    />

                    <div className="px-3 py-2 bg-glass-white border border-glass-border rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-[11px] text-dreeso-dark-300 leading-relaxed">
                          Actions propagate across connected systems in real time. Each step shows latency, confidence, and affected data.
                        </p>
                      </div>
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

ActionPage.propTypes = {
  className: PropTypes.string,
  onActionExecuted: PropTypes.func,
  onPropagationComplete: PropTypes.func,
  initialActionId: PropTypes.string,
};

export default ActionPage;