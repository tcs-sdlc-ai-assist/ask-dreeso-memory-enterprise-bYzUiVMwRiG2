/**
 * CrossDomainPropagator service for Ask Dreeso Memory.
 * Implements propagate(actionResult) to read propagation rules from mock data,
 * identify affected systems and personas, update relevant mock data entries,
 * and log all cross-domain updates via AuditLogger.
 *
 * Returns an array of propagation results with affectedPersona, system,
 * and updateDescription.
 *
 * @module CrossDomainPropagator
 */

import { getData, getDataById, updateData } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';

/**
 * Propagation result status constants.
 * @type {Record<string, string>}
 */
const PROPAGATION_STATUS = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  NO_RULE: 'no_rule',
};

/**
 * Generate a unique propagation ID for tracking.
 * @returns {string} A unique propagation identifier.
 */
function generatePropagationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `prop-${timestamp}-${random}`;
}

/**
 * Resolve the propagation rule for a given action ID.
 * @param {string} actionId - The action ID to find the propagation rule for.
 * @returns {object|null} The propagation rule object, or null if not found.
 */
function resolvePropagationRule(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return null;
  }

  const propagationRules = getData('propagation');
  return propagationRules.find((rule) => rule.actionId === actionId) || null;
}

/**
 * Resolve system details by system ID.
 * @param {string} systemId - The system ID.
 * @returns {object|null} The system object, or null if not found.
 */
function resolveSystem(systemId) {
  if (typeof systemId !== 'string' || systemId.trim() === '') {
    return null;
  }

  return getDataById('systems', systemId);
}

/**
 * Resolve persona details by persona ID.
 * @param {string} personaId - The persona ID.
 * @returns {object|null} The persona object, or null if not found.
 */
function resolvePersona(personaId) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return null;
  }

  return getDataById('personas', personaId);
}

/**
 * Process a single propagation step from the propagation chain.
 * Simulates the data update in the target system and returns a step result.
 *
 * @param {object} step - A propagation chain step object.
 * @param {string} actionId - The action ID being propagated.
 * @param {string} propagationId - The unique propagation tracking ID.
 * @returns {object} A step result object with system, operation, status, and details.
 */
function processStep(step, actionId, propagationId) {
  if (!step || typeof step !== 'object') {
    return {
      order: 0,
      targetSystem: '',
      systemName: '',
      shortName: '',
      color: '#666666',
      operation: '',
      dataUpdate: '',
      latency: '',
      confidence: 0,
      status: PROPAGATION_STATUS.SKIPPED,
      propagationId,
    };
  }

  const system = resolveSystem(step.targetSystem);

  const stepResult = {
    order: step.order || 0,
    targetSystem: step.targetSystem || '',
    systemName: system ? system.name : step.targetSystem || '',
    shortName: system ? system.shortName : step.targetSystem || '',
    color: system ? system.color : '#666666',
    operation: step.operation || '',
    dataUpdate: step.dataUpdate || '',
    latency: step.latency || 'unknown',
    confidence: step.confidence || 0,
    status: PROPAGATION_STATUS.SUCCESS,
    propagationId,
  };

  // Log each propagation step
  auditLog('PROPAGATION_STEP', null, null, `Propagation step ${step.order}: ${step.operation} on ${stepResult.systemName}`, {
    propagationId,
    actionId,
    order: step.order,
    targetSystem: step.targetSystem,
    systemName: stepResult.systemName,
    operation: step.operation,
    dataUpdate: step.dataUpdate,
    latency: step.latency,
    confidence: step.confidence,
    status: PROPAGATION_STATUS.SUCCESS,
  });

  return stepResult;
}

/**
 * Build notification objects for affected personas from the propagation rule.
 *
 * @param {object} propagationRule - The propagation rule object.
 * @returns {object[]} Array of notification objects with personaId, personaName, role, and message.
 */
function buildNotifications(propagationRule) {
  if (
    !propagationRule ||
    !propagationRule.notificationMessages ||
    !Array.isArray(propagationRule.notifiedPersonaIds)
  ) {
    return [];
  }

  return propagationRule.notifiedPersonaIds.map((personaId) => {
    const persona = resolvePersona(personaId);
    const message = propagationRule.notificationMessages[personaId] || '';
    return {
      personaId,
      personaName: persona ? persona.name : personaId,
      role: persona ? persona.role : '',
      message,
    };
  });
}

/**
 * Build the array of affected system objects from the propagation chain.
 *
 * @param {object[]} propagationChain - The propagation chain array from the rule.
 * @returns {object[]} Array of affected system summary objects.
 */
function buildAffectedSystems(propagationChain) {
  if (!Array.isArray(propagationChain)) {
    return [];
  }

  const seenSystems = new Set();
  const affectedSystems = [];

  for (let i = 0; i < propagationChain.length; i++) {
    const step = propagationChain[i];
    if (!step || !step.targetSystem || seenSystems.has(step.targetSystem)) {
      continue;
    }

    seenSystems.add(step.targetSystem);
    const system = resolveSystem(step.targetSystem);

    affectedSystems.push({
      systemId: step.targetSystem,
      systemName: system ? system.name : step.targetSystem,
      shortName: system ? system.shortName : step.targetSystem,
      color: system ? system.color : '#666666',
      operation: step.operation || '',
      effect: step.dataUpdate || '',
    });
  }

  return affectedSystems;
}

/**
 * Build propagation results as an array of objects with affectedPersona, system,
 * and updateDescription for each step and notification.
 *
 * @param {object[]} stepResults - Array of processed step result objects.
 * @param {object[]} notifications - Array of notification objects.
 * @param {object} propagationRule - The propagation rule object.
 * @returns {object[]} Array of propagation result objects.
 */
function buildPropagationResults(stepResults, notifications, propagationRule) {
  const results = [];

  // Add step-based results
  for (let i = 0; i < stepResults.length; i++) {
    const step = stepResults[i];
    results.push({
      type: 'system_update',
      system: {
        systemId: step.targetSystem,
        systemName: step.systemName,
        shortName: step.shortName,
        color: step.color,
      },
      operation: step.operation,
      updateDescription: step.dataUpdate,
      latency: step.latency,
      confidence: step.confidence,
      order: step.order,
      status: step.status,
      affectedPersona: null,
    });
  }

  // Add notification-based results
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];
    results.push({
      type: 'notification',
      system: null,
      operation: 'notify',
      updateDescription: notification.message,
      latency: 'immediate',
      confidence: 1.0,
      order: stepResults.length + i + 1,
      status: PROPAGATION_STATUS.SUCCESS,
      affectedPersona: {
        personaId: notification.personaId,
        personaName: notification.personaName,
        role: notification.role,
      },
    });
  }

  return results;
}

/**
 * Propagate the effects of an executed action across connected systems.
 * Reads propagation rules from mock data, identifies affected systems and personas,
 * processes each propagation step, logs all cross-domain updates via AuditLogger,
 * and returns an array of propagation results.
 *
 * @param {object} actionResult - The action result object returned by ActionExecutor.executeAction.
 *   Must contain at minimum: actionId, status, personaId, executionId.
 * @returns {object} A propagation result object containing:
 *   - {string} propagationId - Unique identifier for this propagation.
 *   - {string} status - Overall propagation status ('success', 'partial', 'failed', 'no_rule', 'skipped').
 *   - {string} message - Human-readable summary of the propagation.
 *   - {string} actionId - The action ID that triggered propagation.
 *   - {string} executionId - The execution ID from the action result.
 *   - {string} ruleId - The propagation rule ID, or empty string if no rule found.
 *   - {string} category - The propagation category.
 *   - {boolean} rollbackSupported - Whether the propagation can be rolled back.
 *   - {object[]} affectedSystems - Array of affected system summary objects.
 *   - {object[]} stepResults - Array of individual step result objects.
 *   - {object[]} notifications - Array of notification objects for affected personas.
 *   - {object[]} propagationResults - Combined array of results with affectedPersona, system, and updateDescription.
 *   - {string} timestamp - ISO timestamp of the propagation.
 * @throws {Error} If actionResult is not a valid object.
 */
export function propagate(actionResult) {
  if (!actionResult || typeof actionResult !== 'object' || Array.isArray(actionResult)) {
    throw new Error('CrossDomainPropagator: actionResult must be a valid object');
  }

  const propagationId = generatePropagationId();
  const timestamp = new Date().toISOString();
  const actionId = actionResult.actionId || '';
  const executionId = actionResult.executionId || '';
  const personaId = actionResult.personaId || '';

  // If the action failed, skip propagation
  if (actionResult.status !== 'success') {
    const skippedResult = {
      propagationId,
      status: PROPAGATION_STATUS.SKIPPED,
      message: `Propagation skipped: action status is "${actionResult.status}"`,
      actionId,
      executionId,
      ruleId: '',
      category: '',
      rollbackSupported: false,
      affectedSystems: [],
      stepResults: [],
      notifications: [],
      propagationResults: [],
      timestamp,
    };

    auditLog('PROPAGATION', null, personaId, `Propagation skipped for action: ${actionId}`, {
      propagationId,
      actionId,
      executionId,
      reason: `Action status is "${actionResult.status}"`,
      status: PROPAGATION_STATUS.SKIPPED,
    });

    return skippedResult;
  }

  // Resolve the propagation rule
  const propagationRule = resolvePropagationRule(actionId);

  if (!propagationRule) {
    const noRuleResult = {
      propagationId,
      status: PROPAGATION_STATUS.NO_RULE,
      message: `No propagation rule found for action "${actionId}"`,
      actionId,
      executionId,
      ruleId: '',
      category: actionResult.category || '',
      rollbackSupported: false,
      affectedSystems: [],
      stepResults: [],
      notifications: [],
      propagationResults: [],
      timestamp,
    };

    auditLog('PROPAGATION', null, personaId, `No propagation rule for action: ${actionId}`, {
      propagationId,
      actionId,
      executionId,
      status: PROPAGATION_STATUS.NO_RULE,
    });

    return noRuleResult;
  }

  // Process each step in the propagation chain
  const chain = Array.isArray(propagationRule.propagationChain) ? propagationRule.propagationChain : [];
  const stepResults = [];
  let failedSteps = 0;

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const stepResult = processStep(step, actionId, propagationId);
    stepResults.push(stepResult);

    if (stepResult.status === PROPAGATION_STATUS.FAILED) {
      failedSteps++;
    }
  }

  // Build affected systems summary
  const affectedSystems = buildAffectedSystems(chain);

  // Build notifications
  const notifications = buildNotifications(propagationRule);

  // Log notifications
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];
    auditLog('PROPAGATION_NOTIFICATION', null, notification.personaId, `Notification sent to ${notification.personaName}: ${notification.message}`, {
      propagationId,
      actionId,
      executionId,
      personaId: notification.personaId,
      personaName: notification.personaName,
      message: notification.message,
    });
  }

  // Build combined propagation results
  const propagationResults = buildPropagationResults(stepResults, notifications, propagationRule);

  // Determine overall status
  let overallStatus = PROPAGATION_STATUS.SUCCESS;
  if (failedSteps > 0 && failedSteps < stepResults.length) {
    overallStatus = PROPAGATION_STATUS.PARTIAL;
  } else if (failedSteps > 0 && failedSteps === stepResults.length) {
    overallStatus = PROPAGATION_STATUS.FAILED;
  }

  const overallMessage = overallStatus === PROPAGATION_STATUS.SUCCESS
    ? `Propagation completed successfully across ${affectedSystems.length} system(s) with ${notifications.length} notification(s)`
    : overallStatus === PROPAGATION_STATUS.PARTIAL
      ? `Propagation partially completed: ${failedSteps} of ${stepResults.length} steps failed`
      : `Propagation failed: all ${stepResults.length} steps failed`;

  const result = {
    propagationId,
    status: overallStatus,
    message: overallMessage,
    actionId,
    executionId,
    ruleId: propagationRule.ruleId || '',
    category: propagationRule.category || '',
    rollbackSupported: propagationRule.rollbackSupported || false,
    affectedSystems,
    stepResults,
    notifications,
    propagationResults,
    timestamp,
  };

  // Log the overall propagation result
  auditLog('PROPAGATION', null, personaId, `Propagation completed for action: ${actionId}`, {
    propagationId,
    actionId,
    executionId,
    ruleId: propagationRule.ruleId,
    category: propagationRule.category,
    status: overallStatus,
    affectedSystemsCount: affectedSystems.length,
    stepsProcessed: stepResults.length,
    stepsFailed: failedSteps,
    notificationsSent: notifications.length,
    rollbackSupported: propagationRule.rollbackSupported,
  });

  return result;
}

/**
 * Get the propagation rule for a specific action.
 * Convenience method for UI components that need rule metadata.
 *
 * @param {string} actionId - The action ID.
 * @returns {object|null} The propagation rule object, or null if not found.
 */
export function getPropagationRule(actionId) {
  return resolvePropagationRule(actionId);
}

/**
 * Get all propagation rules from the dataset.
 *
 * @returns {object[]} Array of all propagation rule objects.
 */
export function getAllPropagationRules() {
  return getData('propagation');
}

/**
 * Get propagation rules filtered by category.
 *
 * @param {string} category - The category to filter by.
 * @returns {object[]} Array of matching propagation rule objects.
 */
export function getPropagationRulesByCategory(category) {
  if (typeof category !== 'string' || category.trim() === '') {
    return [];
  }

  const rules = getData('propagation');
  return rules.filter((rule) => rule.category === category);
}

/**
 * Get a preview of the propagation chain for an action without executing it.
 * Useful for displaying propagation previews in confirmation dialogs.
 *
 * @param {string} actionId - The action ID.
 * @returns {object} A preview object containing ruleId, category, propagationChain,
 *   affectedSystems, notifiedPersonas, and rollbackSupported.
 */
export function getPropagationPreview(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return {
      ruleId: '',
      actionId: '',
      category: '',
      propagationChain: [],
      affectedSystems: [],
      notifiedPersonas: [],
      rollbackSupported: false,
    };
  }

  const rule = resolvePropagationRule(actionId);

  if (!rule) {
    return {
      ruleId: '',
      actionId,
      category: '',
      propagationChain: [],
      affectedSystems: [],
      notifiedPersonas: [],
      rollbackSupported: false,
    };
  }

  const chain = Array.isArray(rule.propagationChain) ? rule.propagationChain : [];
  const affectedSystems = buildAffectedSystems(chain);

  const notifiedPersonas = Array.isArray(rule.notifiedPersonaIds)
    ? rule.notifiedPersonaIds.map((pid) => {
        const persona = resolvePersona(pid);
        return {
          personaId: pid,
          personaName: persona ? persona.name : pid,
          role: persona ? persona.role : '',
          message: rule.notificationMessages ? (rule.notificationMessages[pid] || '') : '',
        };
      })
    : [];

  const propagationChain = chain.map((step) => {
    const system = resolveSystem(step.targetSystem);
    return {
      order: step.order,
      targetSystem: step.targetSystem,
      systemName: system ? system.name : step.targetSystem,
      shortName: system ? system.shortName : step.targetSystem,
      color: system ? system.color : '#666666',
      operation: step.operation,
      dataUpdate: step.dataUpdate,
      latency: step.latency,
      confidence: step.confidence,
    };
  });

  return {
    ruleId: rule.ruleId || '',
    actionId: rule.actionId || actionId,
    category: rule.category || '',
    triggerDescription: rule.triggerDescription || '',
    sourceSystem: rule.sourceSystem || '',
    propagationChain,
    affectedSystems,
    notifiedPersonas,
    rollbackSupported: rule.rollbackSupported || false,
  };
}

/**
 * Get all systems affected by a specific action's propagation.
 *
 * @param {string} actionId - The action ID.
 * @returns {object[]} Array of affected system objects with systemId, systemName, and effect.
 */
export function getAffectedSystems(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return [];
  }

  const rule = resolvePropagationRule(actionId);
  if (!rule || !Array.isArray(rule.propagationChain)) {
    return [];
  }

  return buildAffectedSystems(rule.propagationChain);
}

/**
 * Get all personas that would be notified by a specific action's propagation.
 *
 * @param {string} actionId - The action ID.
 * @returns {object[]} Array of notification objects with personaId, personaName, role, and message.
 */
export function getNotifiedPersonas(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return [];
  }

  const rule = resolvePropagationRule(actionId);
  if (!rule) {
    return [];
  }

  return buildNotifications(rule);
}