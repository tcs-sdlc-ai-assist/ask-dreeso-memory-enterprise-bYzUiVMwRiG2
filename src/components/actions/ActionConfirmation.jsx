/**
 * ActionConfirmation — Action confirmation modal component for Ask Dreeso Memory.
 * Displays action details, affected systems, and cross-domain propagation effects
 * before execution. Includes confirm and cancel buttons. Shows propagation results
 * after execution with affected personas and systems listed.
 *
 * @module ActionConfirmation
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { usePersona } from '@/contexts/PersonaContext';
import { useApp } from '@/contexts/AppContext';
import {
  executeAction,
  getActionPreview,
  validateActionExecution,
} from '@/services/actionExecutor';
import { propagate } from '@/services/crossDomainPropagator';

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
 * AffectedSystemCard — Renders a single affected system with its effect description.
 *
 * @param {object} props
 * @param {object} props.system - The affected system object.
 * @returns {import('react').ReactElement} The affected system card element.
 */
function AffectedSystemCard({ system }) {
  if (!system || typeof system !== 'object') {
    return null;
  }

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 hover:bg-glass-hover">
      <div
        className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
        style={{ backgroundColor: system.color || '#666666' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {system.shortName || system.systemName || 'Unknown System'}
        </p>
        <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2 mt-0.5">
          {system.effect || 'System will be updated'}
        </p>
      </div>
    </div>
  );
}

AffectedSystemCard.propTypes = {
  system: PropTypes.shape({
    systemId: PropTypes.string,
    systemName: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    effect: PropTypes.string,
  }),
};

/**
 * PropagationStepCard — Renders a single propagation step result.
 *
 * @param {object} props
 * @param {object} props.step - The propagation step result object.
 * @returns {import('react').ReactElement} The propagation step card element.
 */
function PropagationStepCard({ step }) {
  if (!step || typeof step !== 'object') {
    return null;
  }

  const isSuccess = step.status === 'success';

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg">
      <div
        className={`h-2 w-2 rounded-full shrink-0 ${isSuccess ? 'animate-pulse-green' : 'opacity-40'}`}
        style={{ backgroundColor: step.color || '#17b363' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white truncate">
            {step.shortName || step.systemName || 'System'}
          </span>
          <span className="text-[10px] text-dreeso-dark-500 font-mono">
            {step.latency || ''}
          </span>
        </div>
        <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-1 mt-0.5">
          {step.dataUpdate || ''}
        </p>
      </div>
      <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
        {typeof step.confidence === 'number' ? `${Math.round(step.confidence * 100)}%` : ''}
      </span>
    </div>
  );
}

PropagationStepCard.propTypes = {
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
  }),
};

/**
 * NotificationCard — Renders a single notification for an affected persona.
 *
 * @param {object} props
 * @param {object} props.notification - The notification object.
 * @returns {import('react').ReactElement} The notification card element.
 */
function NotificationCard({ notification }) {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg">
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
  );
}

NotificationCard.propTypes = {
  notification: PropTypes.shape({
    personaId: PropTypes.string,
    personaName: PropTypes.string,
    role: PropTypes.string,
    message: PropTypes.string,
  }),
};

/**
 * PropagationResultPanel — Displays the full propagation result after action execution.
 *
 * @param {object} props
 * @param {object} props.result - The propagation result object.
 * @param {function} props.onDismiss - Callback to dismiss the result.
 * @returns {import('react').ReactElement|null} The propagation result panel element.
 */
function PropagationResultPanel({ result, onDismiss }) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const isSuccess = result.status === 'success';
  const isPartial = result.status === 'partial';

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <svg className="w-5 h-5 text-semantic-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : isPartial ? (
            <svg className="w-5 h-5 text-semantic-warning shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-semantic-error shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isSuccess ? 'Propagation Complete' : isPartial ? 'Partial Propagation' : 'Propagation Failed'}
            </h3>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">
              {result.message || ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 p-1.5 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
          onClick={onDismiss}
          aria-label="Dismiss propagation result"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Propagation steps */}
      {Array.isArray(result.stepResults) && result.stepResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
            Cross-Domain Updates ({result.stepResults.length})
          </h4>
          <div className="space-y-1.5">
            {result.stepResults.map((step, index) => (
              <PropagationStepCard
                key={`prop-step-${index}`}
                step={step}
              />
            ))}
          </div>
        </div>
      )}

      {/* Affected systems summary */}
      {Array.isArray(result.affectedSystems) && result.affectedSystems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
            Affected Systems ({result.affectedSystems.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.affectedSystems.map((system, index) => (
              <span
                key={`affected-sys-${index}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
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
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
            Notifications Sent ({result.notifications.length})
          </h4>
          <div className="space-y-1.5">
            {result.notifications.map((notification, index) => (
              <NotificationCard
                key={`notif-${index}`}
                notification={notification}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rollback info */}
      <div className="flex items-center gap-2 text-xs pt-1">
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
            <span className="text-semantic-warning">This propagation cannot be reversed</span>
          </>
        )}
      </div>
    </div>
  );
}

PropagationResultPanel.propTypes = {
  result: PropTypes.object,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * ActionConfirmation component.
 * Displays action details, affected systems, and cross-domain propagation effects
 * before execution. Includes confirm and cancel buttons. Shows propagation results
 * after execution with affected personas and systems listed.
 *
 * Can be used as an inline panel or as a modal overlay depending on the `modal` prop.
 *
 * @param {object} props
 * @param {object} props.action - The action object to confirm and execute.
 * @param {boolean} [props.isOpen=false] - Whether the confirmation is visible.
 * @param {boolean} [props.modal=true] - Whether to render as a modal overlay or inline panel.
 * @param {function} [props.onConfirm] - Callback after successful action execution. Receives the action result.
 * @param {function} [props.onCancel] - Callback when the user cancels.
 * @param {function} [props.onPropagationComplete] - Callback when propagation completes. Receives the propagation result.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {boolean} [props.animated=true] - Whether to apply animations.
 * @param {boolean} [props.showPropagationPreview=true] - Whether to show the propagation chain preview before execution.
 * @param {boolean} [props.showAffectedSystems=true] - Whether to show affected systems.
 * @param {boolean} [props.showNotifications=true] - Whether to show notification previews.
 * @param {string} [props.accentColor] - Override accent color.
 * @returns {import('react').ReactElement|null} The action confirmation element, or null if not open.
 */
export function ActionConfirmation({
  action,
  isOpen = false,
  modal = true,
  onConfirm,
  onCancel,
  onPropagationComplete,
  className = '',
  animated = true,
  showPropagationPreview = true,
  showAffectedSystems = true,
  showNotifications = true,
  accentColor: overrideAccentColor,
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const { addNotification } = useApp();

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [propagationResult, setPropagationResult] = useState(null);
  const [phase, setPhase] = useState('confirm'); // 'confirm' | 'result'

  const resolvedAccentColor = overrideAccentColor
    || (currentPersona ? currentPersona.colorTheme : '#17b363');

  /**
   * Action preview data including affected systems, propagation chain, and notifications.
   * @type {object}
   */
  const preview = useMemo(() => {
    if (!action || !action.id) {
      return null;
    }

    try {
      return getActionPreview(action.id);
    } catch (_err) {
      return null;
    }
  }, [action]);

  /**
   * Validation result for the current persona executing this action.
   * @type {object}
   */
  const validation = useMemo(() => {
    if (!action || !action.id || !currentPersonaId) {
      return { canExecute: false, reasons: ['No action or persona selected'] };
    }

    return validateActionExecution(action.id, currentPersonaId);
  }, [action, currentPersonaId]);

  /**
   * Handle confirm button click — execute the action and propagate.
   */
  const handleConfirm = useCallback(() => {
    if (!action || !action.id || !currentPersonaId || isExecuting) {
      return;
    }

    setIsExecuting(true);

    // Simulate a small delay for UX
    setTimeout(() => {
      try {
        const result = executeAction(action.id, {}, currentPersonaId);
        setExecutionResult(result);

        if (result.status === 'success') {
          addNotification('success', `Action "${result.actionLabel}" executed successfully.`);

          // Trigger cross-domain propagation
          try {
            const propResult = propagate(result);
            setPropagationResult(propResult);
            setPhase('result');

            if (typeof onPropagationComplete === 'function') {
              onPropagationComplete(propResult);
            }

            if (propResult.notifications && propResult.notifications.length > 0) {
              addNotification(
                'info',
                `${propResult.notifications.length} notification(s) sent to affected personas.`
              );
            }
          } catch (_propErr) {
            setPhase('result');
            addNotification('warning', 'Action executed but propagation encountered an issue.');
          }

          if (typeof onConfirm === 'function') {
            onConfirm(result);
          }
        } else if (result.status === 'unauthorized') {
          addNotification('error', result.message || 'You are not authorized to perform this action.');
        } else {
          addNotification('error', result.message || 'Action execution failed.');
        }
      } catch (err) {
        const errorMessage = err && err.message ? err.message : 'An unexpected error occurred.';
        addNotification('error', errorMessage);
      }

      setIsExecuting(false);
    }, 600);
  }, [action, currentPersonaId, isExecuting, addNotification, onConfirm, onPropagationComplete]);

  /**
   * Handle cancel button click.
   */
  const handleCancel = useCallback(() => {
    if (isExecuting) {
      return;
    }

    setPhase('confirm');
    setExecutionResult(null);
    setPropagationResult(null);

    if (typeof onCancel === 'function') {
      onCancel();
    }
  }, [isExecuting, onCancel]);

  /**
   * Handle dismiss of propagation result — reset to initial state.
   */
  const handleDismissResult = useCallback(() => {
    setPhase('confirm');
    setExecutionResult(null);
    setPropagationResult(null);

    if (typeof onCancel === 'function') {
      onCancel();
    }
  }, [onCancel]);

  if (!isOpen || !action) {
    return null;
  }

  const hasPreview = preview !== null;
  const hasAffectedSystems = hasPreview && Array.isArray(preview.affectedSystems) && preview.affectedSystems.length > 0;
  const hasPropagationChain = hasPreview && Array.isArray(preview.propagationChain) && preview.propagationChain.length > 0;
  const hasNotifications = hasPreview && Array.isArray(preview.notifications) && preview.notifications.length > 0;
  const typeBadgeClass = resolveTypeBadgeClass(action.type);
  const animationClass = animated ? 'animate-scale-up' : '';

  /**
   * Render the confirmation content (before execution).
   * @returns {import('react').ReactElement} The confirmation content.
   */
  function renderConfirmContent() {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
            style={{
              backgroundColor: `${resolvedAccentColor}15`,
              color: resolvedAccentColor,
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight">
              {action.label || 'Confirm Action'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${typeBadgeClass}`}
              >
                {action.type || 'action'}
              </span>
              <span className="text-[11px] text-dreeso-dark-500">
                {action.category || 'General'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {action.description && (
          <p className="text-sm text-dreeso-dark-200 leading-relaxed">
            {action.description}
          </p>
        )}

        {/* Confirmation message */}
        {hasPreview && preview.confirmationMessage && (
          <div className="px-3 py-2.5 bg-semantic-warning/5 border border-semantic-warning/20 rounded-xl">
            <p className="text-xs text-dreeso-dark-200 leading-relaxed">
              {preview.confirmationMessage}
            </p>
          </div>
        )}

        {/* Target system */}
        {hasPreview && preview.targetSystemName && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-dreeso-dark-400">
              Target: <span className="text-dreeso-dark-200 font-medium">{preview.targetSystemName}</span>
            </span>
          </div>
        )}

        {/* Affected systems */}
        {showAffectedSystems && hasAffectedSystems && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Affected Systems ({preview.affectedSystems.length})
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
              {preview.affectedSystems.map((system, index) => (
                <AffectedSystemCard
                  key={`affected-${index}`}
                  system={system}
                />
              ))}
            </div>
          </div>
        )}

        {/* Propagation chain preview */}
        {showPropagationPreview && hasPropagationChain && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Propagation Chain ({preview.propagationChain.length} steps)
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
              {preview.propagationChain.map((step, index) => (
                <div
                  key={`chain-${index}`}
                  className="flex items-center gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-dreeso-dark-800 text-[10px] font-mono text-dreeso-dark-400 shrink-0">
                    {step.order || index + 1}
                  </div>
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: step.color || '#666666' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-white truncate block">
                      {step.shortName || step.systemName || 'System'}
                    </span>
                  </div>
                  <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
                    {step.operation || ''}
                  </span>
                  <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
                    {step.latency || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification previews */}
        {showNotifications && hasNotifications && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Personas to Notify ({preview.notifications.length})
            </h3>
            <div className="space-y-1.5">
              {preview.notifications.map((notification, index) => (
                <NotificationCard
                  key={`notif-preview-${index}`}
                  notification={notification}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rollback info */}
        {hasPreview && (
          <div className="flex items-center gap-2 text-xs">
            {preview.rollbackSupported ? (
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
                <span className="text-semantic-warning">This action cannot be undone</span>
              </>
            )}
          </div>
        )}

        {/* Validation warnings */}
        {!validation.canExecute && Array.isArray(validation.reasons) && validation.reasons.length > 0 && (
          <div className="px-3 py-2.5 bg-semantic-error/5 border border-semantic-error/20 rounded-xl">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-semantic-error shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-semantic-error">Cannot Execute</p>
                <ul className="mt-1 space-y-0.5">
                  {validation.reasons.map((reason, index) => (
                    <li key={`reason-${index}`} className="text-[11px] text-dreeso-dark-400">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-glass-border/50">
          <button
            type="button"
            className="px-4 py-2 text-sm text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
            onClick={handleCancel}
            disabled={isExecuting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              isExecuting || !validation.canExecute
                ? 'bg-dreeso-accent-500/50 text-white/50 cursor-not-allowed'
                : 'bg-dreeso-accent-500 text-white hover:bg-dreeso-accent-600 hover:shadow-accent-glow'
            }`}
            onClick={handleConfirm}
            disabled={isExecuting || !validation.canExecute}
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Executing...
              </span>
            ) : (
              'Confirm & Execute'
            )}
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render the result content (after execution).
   * @returns {import('react').ReactElement} The result content.
   */
  function renderResultContent() {
    return (
      <div className="space-y-4">
        {/* Execution result header */}
        {executionResult && (
          <div className="flex items-start gap-3 pb-3 border-b border-glass-border/50">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-semantic-success/10 text-semantic-success shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white">
                {executionResult.actionLabel || 'Action Executed'}
              </h2>
              <p className="text-xs text-dreeso-dark-400 mt-0.5">
                {executionResult.message || 'Action completed successfully'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-dreeso-dark-500 font-mono">
                  ID: {executionResult.executionId || '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Propagation result */}
        {propagationResult && (
          <PropagationResultPanel
            result={propagationResult}
            onDismiss={handleDismissResult}
          />
        )}

        {/* Close button */}
        {!propagationResult && (
          <div className="flex items-center justify-end pt-2 border-t border-glass-border/50">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
              onClick={handleDismissResult}
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render as modal overlay
  if (modal) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-dreeso-dark-950/80 backdrop-blur-sm ${animationClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Confirm action: ${action.label || 'Action'}`}
      >
        <div className={`w-full max-w-lg bg-dreeso-dark-900/95 backdrop-blur-lg border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden ${className}`}>
          <div className="px-6 py-5 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {phase === 'confirm' ? renderConfirmContent() : renderResultContent()}
          </div>
        </div>
      </div>
    );
  }

  // Render as inline panel
  return (
    <div className={`w-full ${animationClass} ${className}`}>
      <GlassCard
        variant="default"
        animated={animated}
        className="space-y-0"
      >
        {phase === 'confirm' ? renderConfirmContent() : renderResultContent()}
      </GlassCard>
    </div>
  );
}

ActionConfirmation.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    targetSystem: PropTypes.string,
    category: PropTypes.string,
    confirmationMessage: PropTypes.string,
    affectedPersonaIds: PropTypes.arrayOf(PropTypes.string),
    crossDomainEffects: PropTypes.arrayOf(PropTypes.object),
    requiredPermissions: PropTypes.arrayOf(PropTypes.string),
    priority: PropTypes.number,
  }),
  isOpen: PropTypes.bool,
  modal: PropTypes.bool,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  onPropagationComplete: PropTypes.func,
  className: PropTypes.string,
  animated: PropTypes.bool,
  showPropagationPreview: PropTypes.bool,
  showAffectedSystems: PropTypes.bool,
  showNotifications: PropTypes.bool,
  accentColor: PropTypes.string,
};

export default ActionConfirmation;