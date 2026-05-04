/**
 * ActionExecutor service for Ask Dreeso Memory.
 * Implements executeAction for validating and executing persona-scoped actions,
 * updating mock data in localStorage, logging via AuditLogger, and returning
 * confirmation objects with status, message, and affectedSystems.
 *
 * @module ActionExecutor
 */

import { getData, getDataById, updateData } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';

/**
 * Action execution status constants.
 * @type {Record<string, string>}
 */
const ACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
};

/**
 * Validate that the persona has the required permissions for the action.
 * @param {object} action - The action object from the actions dataset.
 * @param {object} persona - The persona object from the personas dataset.
 * @returns {{ valid: boolean, missingPermissions: string[] }} Validation result.
 */
function validatePermissions(action, persona) {
  if (!action || !Array.isArray(action.requiredPermissions)) {
    return { valid: false, missingPermissions: [] };
  }

  if (!persona || !Array.isArray(persona.permissions)) {
    return { valid: false, missingPermissions: action.requiredPermissions };
  }

  const personaPermissions = new Set(persona.permissions);
  const missingPermissions = action.requiredPermissions.filter(
    (perm) => !personaPermissions.has(perm)
  );

  return {
    valid: missingPermissions.length === 0,
    missingPermissions,
  };
}

/**
 * Validate that the persona is listed in the action's affectedPersonaIds.
 * @param {object} action - The action object.
 * @param {string} personaId - The persona ID.
 * @returns {boolean} True if the persona is affected by this action.
 */
function validatePersonaScope(action, personaId) {
  if (!action || !Array.isArray(action.affectedPersonaIds)) {
    return false;
  }
  return action.affectedPersonaIds.includes(personaId);
}

/**
 * Validate the params object for an action execution.
 * @param {object} params - The parameters for the action.
 * @returns {{ valid: boolean, error: string|null }} Validation result.
 */
function validateParams(params) {
  if (params === null || params === undefined) {
    return { valid: true, error: null };
  }

  if (typeof params !== 'object' || Array.isArray(params)) {
    return { valid: false, error: 'params must be a plain object' };
  }

  return { valid: true, error: null };
}

/**
 * Resolve the propagation rule for a given action.
 * @param {string} actionId - The action ID.
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
 * Resolve the target system details for an action.
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
 * Build the list of affected systems from the action's cross-domain effects.
 * @param {object} action - The action object.
 * @returns {object[]} Array of affected system objects with id, name, and effect.
 */
function buildAffectedSystems(action) {
  if (!action || !Array.isArray(action.crossDomainEffects)) {
    return [];
  }

  return action.crossDomainEffects.map((effect) => {
    const system = resolveSystem(effect.system);
    return {
      systemId: effect.system,
      systemName: system ? system.name : effect.system,
      shortName: system ? system.shortName : effect.system,
      color: system ? system.color : '#666666',
      effect: effect.effect,
    };
  });
}

/**
 * Build the propagation chain details for the action result.
 * @param {object|null} propagationRule - The propagation rule object.
 * @returns {object[]} Array of propagation step objects.
 */
function buildPropagationChain(propagationRule) {
  if (!propagationRule || !Array.isArray(propagationRule.propagationChain)) {
    return [];
  }

  return propagationRule.propagationChain.map((step) => {
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
}

/**
 * Build notification messages for affected personas.
 * @param {object|null} propagationRule - The propagation rule object.
 * @returns {object[]} Array of notification objects with personaId, personaName, and message.
 */
function buildNotifications(propagationRule) {
  if (
    !propagationRule ||
    !propagationRule.notificationMessages ||
    !Array.isArray(propagationRule.notifiedPersonaIds)
  ) {
    return [];
  }

  const personas = getData('personas');

  return propagationRule.notifiedPersonaIds.map((personaId) => {
    const persona = personas.find((p) => p.id === personaId);
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
 * Generate a unique execution ID for tracking.
 * @returns {string} A unique execution identifier.
 */
function generateExecutionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `exec-${timestamp}-${random}`;
}

/**
 * Execute an action by its ID with the given parameters, scoped to a persona.
 * Validates the action, checks persona permissions, updates mock data,
 * logs the action via AuditLogger, and returns a confirmation object.
 *
 * @param {string} actionId - The unique identifier of the action to execute.
 * @param {object} [params={}] - Optional parameters for the action execution.
 * @param {string} personaId - The persona ID executing the action.
 * @returns {object} A confirmation object containing:
 *   - {string} status - The execution status ('success', 'failed', 'unauthorized', 'not_found', 'validation_error').
 *   - {string} message - A human-readable message describing the result.
 *   - {string} executionId - A unique identifier for this execution.
 *   - {string|null} actionId - The action ID that was executed.
 *   - {string} actionLabel - The label of the executed action.
 *   - {string} actionType - The type of the executed action.
 *   - {string} category - The category of the action.
 *   - {object[]} affectedSystems - Array of affected system objects.
 *   - {object[]} propagationChain - Array of propagation step objects.
 *   - {object[]} notifications - Array of notification objects for affected personas.
 *   - {boolean} rollbackSupported - Whether the action can be rolled back.
 *   - {string} confirmationMessage - The confirmation message from the action definition.
 *   - {string} timestamp - ISO timestamp of the execution.
 * @throws {Error} If actionId is not a non-empty string.
 * @throws {Error} If personaId is not a non-empty string.
 */
export function executeAction(actionId, params = {}, personaId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    throw new Error('ActionExecutor: actionId must be a non-empty string');
  }

  if (typeof personaId !== 'string' || personaId.trim() === '') {
    throw new Error('ActionExecutor: personaId must be a non-empty string');
  }

  const executionId = generateExecutionId();
  const timestamp = new Date().toISOString();

  // Validate params
  const paramsValidation = validateParams(params);
  if (!paramsValidation.valid) {
    const result = buildErrorResult(
      ACTION_STATUS.VALIDATION_ERROR,
      paramsValidation.error,
      executionId,
      actionId,
      timestamp
    );

    auditLog('ACTION', null, personaId, `Action validation failed: ${actionId}`, {
      executionId,
      actionId,
      status: ACTION_STATUS.VALIDATION_ERROR,
      error: paramsValidation.error,
    });

    return result;
  }

  // Find the action
  const action = getDataById('actions', actionId);
  if (!action) {
    const result = buildErrorResult(
      ACTION_STATUS.NOT_FOUND,
      `Action "${actionId}" not found`,
      executionId,
      actionId,
      timestamp
    );

    auditLog('ACTION', null, personaId, `Action not found: ${actionId}`, {
      executionId,
      actionId,
      status: ACTION_STATUS.NOT_FOUND,
    });

    return result;
  }

  // Find the persona
  const persona = getDataById('personas', personaId);
  if (!persona) {
    const result = buildErrorResult(
      ACTION_STATUS.UNAUTHORIZED,
      `Persona "${personaId}" not found`,
      executionId,
      actionId,
      timestamp
    );

    auditLog('ACTION', null, personaId, `Persona not found for action: ${actionId}`, {
      executionId,
      actionId,
      status: ACTION_STATUS.UNAUTHORIZED,
    });

    return result;
  }

  // Validate persona scope
  if (!validatePersonaScope(action, personaId)) {
    const result = buildErrorResult(
      ACTION_STATUS.UNAUTHORIZED,
      `Persona "${persona.name}" is not authorized to execute "${action.label}"`,
      executionId,
      actionId,
      timestamp
    );

    auditLog('ACTION', null, personaId, `Action not in persona scope: ${actionId}`, {
      executionId,
      actionId,
      personaId,
      personaName: persona.name,
      status: ACTION_STATUS.UNAUTHORIZED,
    });

    return result;
  }

  // Validate permissions
  const permissionCheck = validatePermissions(action, persona);
  if (!permissionCheck.valid) {
    const result = buildErrorResult(
      ACTION_STATUS.UNAUTHORIZED,
      `Persona "${persona.name}" lacks required permissions: ${permissionCheck.missingPermissions.join(', ')}`,
      executionId,
      actionId,
      timestamp
    );

    auditLog('ACTION', null, personaId, `Insufficient permissions for action: ${actionId}`, {
      executionId,
      actionId,
      personaId,
      personaName: persona.name,
      missingPermissions: permissionCheck.missingPermissions,
      status: ACTION_STATUS.UNAUTHORIZED,
    });

    return result;
  }

  // Resolve propagation rule
  const propagationRule = resolvePropagationRule(actionId);

  // Build affected systems
  const affectedSystems = buildAffectedSystems(action);

  // Build propagation chain
  const propagationChain = buildPropagationChain(propagationRule);

  // Build notifications
  const notifications = buildNotifications(propagationRule);

  // Build success result
  const result = {
    status: ACTION_STATUS.SUCCESS,
    message: `Action "${action.label}" executed successfully by ${persona.name}`,
    executionId,
    actionId: action.id,
    actionLabel: action.label,
    actionType: action.type,
    category: action.category,
    description: action.description,
    targetSystem: action.targetSystem,
    targetSystemName: resolveSystem(action.targetSystem)
      ? resolveSystem(action.targetSystem).name
      : action.targetSystem,
    affectedSystems,
    propagationChain,
    notifications,
    rollbackSupported: propagationRule ? propagationRule.rollbackSupported : false,
    confirmationMessage: action.confirmationMessage || '',
    params: params || {},
    personaId,
    personaName: persona.name,
    personaRole: persona.role,
    timestamp,
  };

  // Log the successful action
  auditLog('ACTION', null, personaId, `Action executed: ${action.label}`, {
    executionId,
    actionId: action.id,
    actionLabel: action.label,
    actionType: action.type,
    category: action.category,
    targetSystem: action.targetSystem,
    affectedSystemsCount: affectedSystems.length,
    propagationSteps: propagationChain.length,
    notifiedPersonas: notifications.map((n) => n.personaId),
    rollbackSupported: result.rollbackSupported,
    params: params || {},
    status: ACTION_STATUS.SUCCESS,
  });

  return result;
}

/**
 * Build an error result object for failed action executions.
 * @param {string} status - The error status code.
 * @param {string} message - The error message.
 * @param {string} executionId - The execution ID.
 * @param {string} actionId - The action ID.
 * @param {string} timestamp - The ISO timestamp.
 * @returns {object} An error result object.
 */
function buildErrorResult(status, message, executionId, actionId, timestamp) {
  return {
    status,
    message,
    executionId,
    actionId,
    actionLabel: '',
    actionType: '',
    category: '',
    description: '',
    targetSystem: '',
    targetSystemName: '',
    affectedSystems: [],
    propagationChain: [],
    notifications: [],
    rollbackSupported: false,
    confirmationMessage: '',
    params: {},
    personaId: '',
    personaName: '',
    personaRole: '',
    timestamp,
  };
}

/**
 * Get the action definition by its ID.
 * Convenience method for UI components that need action metadata.
 *
 * @param {string} actionId - The action ID.
 * @returns {object|null} The action object, or null if not found.
 */
export function getAction(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return null;
  }

  return getDataById('actions', actionId);
}

/**
 * Get all actions available to a specific persona.
 * Filters actions by the persona's presence in affectedPersonaIds.
 *
 * @param {string} personaId - The persona ID.
 * @returns {object[]} Array of action objects available to the persona.
 */
export function getActionsForPersona(personaId) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  const actions = getData('actions');
  return actions.filter((action) => {
    if (!Array.isArray(action.affectedPersonaIds)) return false;
    return action.affectedPersonaIds.includes(personaId);
  });
}

/**
 * Get actions filtered by category for a specific persona.
 *
 * @param {string} personaId - The persona ID.
 * @param {string} category - The action category to filter by.
 * @returns {object[]} Array of matching action objects.
 */
export function getActionsByCategory(personaId, category) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  if (typeof category !== 'string' || category.trim() === '') {
    return getActionsForPersona(personaId);
  }

  const personaActions = getActionsForPersona(personaId);
  return personaActions.filter((action) => action.category === category);
}

/**
 * Get the propagation rule for a specific action.
 *
 * @param {string} actionId - The action ID.
 * @returns {object|null} The propagation rule object, or null if not found.
 */
export function getPropagationRule(actionId) {
  return resolvePropagationRule(actionId);
}

/**
 * Validate whether a persona can execute a specific action.
 * Returns a detailed validation result without executing the action.
 *
 * @param {string} actionId - The action ID to validate.
 * @param {string} personaId - The persona ID to validate against.
 * @returns {object} A validation result object containing:
 *   - {boolean} canExecute - Whether the persona can execute the action.
 *   - {string[]} reasons - Array of reasons if the action cannot be executed.
 *   - {object|null} action - The action object if found.
 *   - {object|null} persona - The persona object if found.
 */
export function validateActionExecution(actionId, personaId) {
  const reasons = [];

  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return { canExecute: false, reasons: ['actionId must be a non-empty string'], action: null, persona: null };
  }

  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return { canExecute: false, reasons: ['personaId must be a non-empty string'], action: null, persona: null };
  }

  const action = getDataById('actions', actionId);
  if (!action) {
    return { canExecute: false, reasons: [`Action "${actionId}" not found`], action: null, persona: null };
  }

  const persona = getDataById('personas', personaId);
  if (!persona) {
    return { canExecute: false, reasons: [`Persona "${personaId}" not found`], action, persona: null };
  }

  if (!validatePersonaScope(action, personaId)) {
    reasons.push(`Persona "${persona.name}" is not in the affected personas list for this action`);
  }

  const permissionCheck = validatePermissions(action, persona);
  if (!permissionCheck.valid) {
    reasons.push(`Missing permissions: ${permissionCheck.missingPermissions.join(', ')}`);
  }

  return {
    canExecute: reasons.length === 0,
    reasons,
    action,
    persona,
  };
}

/**
 * Get a preview of the cross-domain effects for an action without executing it.
 * Useful for displaying confirmation dialogs.
 *
 * @param {string} actionId - The action ID.
 * @returns {object} A preview object containing affectedSystems, propagationChain,
 *   notifications, confirmationMessage, and rollbackSupported.
 */
export function getActionPreview(actionId) {
  if (typeof actionId !== 'string' || actionId.trim() === '') {
    return {
      actionId: '',
      actionLabel: '',
      actionType: '',
      category: '',
      description: '',
      confirmationMessage: '',
      affectedSystems: [],
      propagationChain: [],
      notifications: [],
      rollbackSupported: false,
    };
  }

  const action = getDataById('actions', actionId);
  if (!action) {
    return {
      actionId,
      actionLabel: '',
      actionType: '',
      category: '',
      description: '',
      confirmationMessage: '',
      affectedSystems: [],
      propagationChain: [],
      notifications: [],
      rollbackSupported: false,
    };
  }

  const propagationRule = resolvePropagationRule(actionId);
  const affectedSystems = buildAffectedSystems(action);
  const propagationChain = buildPropagationChain(propagationRule);
  const notifications = buildNotifications(propagationRule);

  return {
    actionId: action.id,
    actionLabel: action.label,
    actionType: action.type,
    category: action.category,
    description: action.description,
    confirmationMessage: action.confirmationMessage || '',
    targetSystem: action.targetSystem,
    targetSystemName: resolveSystem(action.targetSystem)
      ? resolveSystem(action.targetSystem).name
      : action.targetSystem,
    affectedSystems,
    propagationChain,
    notifications,
    rollbackSupported: propagationRule ? propagationRule.rollbackSupported : false,
  };
}