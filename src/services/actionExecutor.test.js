/**
 * actionExecutor.test.js — Unit tests for ActionExecutor service.
 * Tests executeAction with valid and invalid actions, mock data updates,
 * audit logging, confirmation object structure, and permission validation.
 *
 * @module actionExecutor.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeAction,
  getAction,
  getActionsForPersona,
  getActionsByCategory,
  getPropagationRule,
  validateActionExecution,
  getActionPreview,
} from '@/services/actionExecutor';
import { getLogs, clearLogs } from '@/services/auditLogger';
import { getData } from '@/services/dataManager';

describe('ActionExecutor', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure data is initialized
    getData('personas');
    clearLogs();
  });

  describe('executeAction', () => {
    describe('input validation', () => {
      it('throws an error when actionId is empty', () => {
        expect(() => {
          executeAction('', {}, 'persona-lukas');
        }).toThrow('ActionExecutor: actionId must be a non-empty string');
      });

      it('throws an error when actionId is not a string', () => {
        expect(() => {
          executeAction(null, {}, 'persona-lukas');
        }).toThrow('ActionExecutor: actionId must be a non-empty string');
      });

      it('throws an error when personaId is empty', () => {
        expect(() => {
          executeAction('action-reassign-task', {}, '');
        }).toThrow('ActionExecutor: personaId must be a non-empty string');
      });

      it('throws an error when personaId is not a string', () => {
        expect(() => {
          executeAction('action-reassign-task', {}, undefined);
        }).toThrow('ActionExecutor: personaId must be a non-empty string');
      });

      it('throws an error when actionId is only whitespace', () => {
        expect(() => {
          executeAction('   ', {}, 'persona-lukas');
        }).toThrow('ActionExecutor: actionId must be a non-empty string');
      });

      it('throws an error when personaId is only whitespace', () => {
        expect(() => {
          executeAction('action-reassign-task', {}, '   ');
        }).toThrow('ActionExecutor: personaId must be a non-empty string');
      });
    });

    describe('successful execution', () => {
      it('executes a valid action for an authorized persona and returns success', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result).toBeDefined();
        expect(result.status).toBe('success');
        expect(result.actionId).toBe('action-escalate-risk');
        expect(result.actionLabel).toBe('Escalate Risk');
        expect(result.actionType).toBe('escalate');
        expect(result.personaId).toBe('persona-lukas');
        expect(result.personaName).toBe('Lukas Müller');
      });

      it('returns a valid executionId with exec- prefix', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result.executionId).toBeTruthy();
        expect(result.executionId).toMatch(/^exec-/);
      });

      it('returns a valid ISO timestamp', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(typeof result.timestamp).toBe('string');
        const date = new Date(result.timestamp);
        expect(isNaN(date.getTime())).toBe(false);
      });

      it('executes action-reassign-task for persona-sophie', () => {
        const result = executeAction('action-reassign-task', {}, 'persona-sophie');

        expect(result.status).toBe('success');
        expect(result.actionId).toBe('action-reassign-task');
        expect(result.actionLabel).toBe('Reassign Task');
        expect(result.actionType).toBe('reassign');
        expect(result.category).toBe('workforce');
        expect(result.personaId).toBe('persona-sophie');
      });

      it('executes action-update-budget for persona-lukas', () => {
        const result = executeAction('action-update-budget', {}, 'persona-lukas');

        expect(result.status).toBe('success');
        expect(result.actionLabel).toBe('Update Budget Allocation');
        expect(result.actionType).toBe('update');
        expect(result.category).toBe('finance');
      });

      it('executes action-submit-proposal for persona-james', () => {
        const result = executeAction('action-submit-proposal', {}, 'persona-james');

        expect(result.status).toBe('success');
        expect(result.actionLabel).toBe('Submit Proposal');
        expect(result.actionType).toBe('submit');
        expect(result.category).toBe('sales');
      });

      it('executes action-certify-payment for persona-elena', () => {
        const result = executeAction('action-certify-payment', {}, 'persona-elena');

        expect(result.status).toBe('success');
        expect(result.actionLabel).toBe('Certify Interim Payment');
        expect(result.actionType).toBe('approve');
        expect(result.category).toBe('finance');
      });

      it('passes params through to the result', () => {
        const params = { taskId: 'task-123', newAssignee: 'user-456' };
        const result = executeAction('action-reassign-task', params, 'persona-sophie');

        expect(result.status).toBe('success');
        expect(result.params).toEqual(params);
      });

      it('accepts null params without error', () => {
        const result = executeAction('action-escalate-risk', null, 'persona-lukas');

        expect(result.status).toBe('success');
      });

      it('accepts undefined params without error', () => {
        const result = executeAction('action-escalate-risk', undefined, 'persona-lukas');

        expect(result.status).toBe('success');
      });
    });

    describe('action not found', () => {
      it('returns not_found status for a non-existent action', () => {
        const result = executeAction('action-nonexistent-999', {}, 'persona-lukas');

        expect(result.status).toBe('not_found');
        expect(result.message).toContain('not found');
        expect(result.actionId).toBe('action-nonexistent-999');
      });

      it('returns empty arrays for affectedSystems and propagationChain when action not found', () => {
        const result = executeAction('action-nonexistent-999', {}, 'persona-lukas');

        expect(result.affectedSystems).toEqual([]);
        expect(result.propagationChain).toEqual([]);
        expect(result.notifications).toEqual([]);
      });
    });

    describe('unauthorized execution', () => {
      it('returns unauthorized when persona is not in affectedPersonaIds', () => {
        // action-submit-proposal affects persona-james and persona-lukas, not persona-elena
        const result = executeAction('action-submit-proposal', {}, 'persona-elena');

        expect(result.status).toBe('unauthorized');
        expect(result.message).toContain('not authorized');
      });

      it('returns unauthorized when persona is not found', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-nonexistent');

        expect(result.status).toBe('unauthorized');
        expect(result.message).toContain('not found');
      });

      it('returns unauthorized when persona lacks required permissions', () => {
        // action-update-budget requires approve_budgets and manage_costs
        // persona-sophie does not have approve_budgets
        const result = executeAction('action-update-budget', {}, 'persona-sophie');

        // Sophie is not in affectedPersonaIds for this action, so it should be unauthorized
        expect(result.status).toBe('unauthorized');
      });

      it('returns unauthorized for action-approve-procurement-award by persona-sophie', () => {
        // action-approve-procurement-award affects persona-elena and persona-lukas, not persona-sophie
        const result = executeAction('action-approve-procurement-award', {}, 'persona-sophie');

        expect(result.status).toBe('unauthorized');
      });
    });

    describe('validation error', () => {
      it('returns validation_error when params is an array', () => {
        const result = executeAction('action-escalate-risk', [1, 2, 3], 'persona-lukas');

        expect(result.status).toBe('validation_error');
        expect(result.message).toContain('params must be a plain object');
      });

      it('returns validation_error when params is a string', () => {
        const result = executeAction('action-escalate-risk', 'invalid', 'persona-lukas');

        expect(result.status).toBe('validation_error');
      });
    });

    describe('confirmation object structure', () => {
      it('returns all required fields in the confirmation object', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('executionId');
        expect(result).toHaveProperty('actionId');
        expect(result).toHaveProperty('actionLabel');
        expect(result).toHaveProperty('actionType');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('targetSystem');
        expect(result).toHaveProperty('targetSystemName');
        expect(result).toHaveProperty('affectedSystems');
        expect(result).toHaveProperty('propagationChain');
        expect(result).toHaveProperty('notifications');
        expect(result).toHaveProperty('rollbackSupported');
        expect(result).toHaveProperty('confirmationMessage');
        expect(result).toHaveProperty('params');
        expect(result).toHaveProperty('personaId');
        expect(result).toHaveProperty('personaName');
        expect(result).toHaveProperty('personaRole');
        expect(result).toHaveProperty('timestamp');
      });

      it('returns affectedSystems as an array of objects with systemId, systemName, shortName, color, and effect', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(Array.isArray(result.affectedSystems)).toBe(true);
        expect(result.affectedSystems.length).toBeGreaterThan(0);

        const system = result.affectedSystems[0];
        expect(system).toHaveProperty('systemId');
        expect(system).toHaveProperty('systemName');
        expect(system).toHaveProperty('shortName');
        expect(system).toHaveProperty('color');
        expect(system).toHaveProperty('effect');
        expect(typeof system.systemId).toBe('string');
        expect(typeof system.systemName).toBe('string');
        expect(typeof system.effect).toBe('string');
      });

      it('returns propagationChain as an array of objects with order, targetSystem, operation, and dataUpdate', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(Array.isArray(result.propagationChain)).toBe(true);
        expect(result.propagationChain.length).toBeGreaterThan(0);

        const step = result.propagationChain[0];
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('targetSystem');
        expect(step).toHaveProperty('systemName');
        expect(step).toHaveProperty('shortName');
        expect(step).toHaveProperty('color');
        expect(step).toHaveProperty('operation');
        expect(step).toHaveProperty('dataUpdate');
        expect(step).toHaveProperty('latency');
        expect(step).toHaveProperty('confidence');
        expect(typeof step.order).toBe('number');
        expect(typeof step.confidence).toBe('number');
      });

      it('returns notifications as an array of objects with personaId, personaName, role, and message', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(Array.isArray(result.notifications)).toBe(true);
        expect(result.notifications.length).toBeGreaterThan(0);

        const notification = result.notifications[0];
        expect(notification).toHaveProperty('personaId');
        expect(notification).toHaveProperty('personaName');
        expect(notification).toHaveProperty('role');
        expect(notification).toHaveProperty('message');
        expect(typeof notification.personaId).toBe('string');
        expect(typeof notification.personaName).toBe('string');
        expect(typeof notification.message).toBe('string');
      });

      it('returns rollbackSupported as a boolean', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(typeof result.rollbackSupported).toBe('boolean');
      });

      it('returns confirmationMessage as a string', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(typeof result.confirmationMessage).toBe('string');
        expect(result.confirmationMessage.length).toBeGreaterThan(0);
      });

      it('returns the correct target system name', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result.targetSystem).toBe('system-procore');
        expect(result.targetSystemName).toBeTruthy();
      });

      it('returns personaRole in the result', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result.personaRole).toBe('Project Director');
      });
    });

    describe('rollback support', () => {
      it('returns rollbackSupported true for action-reassign-task', () => {
        const result = executeAction('action-reassign-task', {}, 'persona-sophie');

        expect(result.rollbackSupported).toBe(true);
      });

      it('returns rollbackSupported false for action-escalate-risk', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result.rollbackSupported).toBe(false);
      });

      it('returns rollbackSupported true for action-update-budget', () => {
        const result = executeAction('action-update-budget', {}, 'persona-lukas');

        expect(result.rollbackSupported).toBe(true);
      });

      it('returns rollbackSupported false for action-submit-proposal', () => {
        const result = executeAction('action-submit-proposal', {}, 'persona-james');

        expect(result.rollbackSupported).toBe(false);
      });
    });

    describe('audit logging integration', () => {
      it('logs an ACTION event when an action is executed successfully', () => {
        executeAction('action-escalate-risk', {}, 'persona-lukas');

        const logs = getLogs({ eventType: 'ACTION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.eventType).toBe('ACTION');
        expect(latestLog.personaId).toBe('persona-lukas');
        expect(latestLog.action).toContain('Action executed');
      });

      it('logs action details including executionId and actionId', () => {
        const result = executeAction('action-escalate-risk', {}, 'persona-lukas');

        const logs = getLogs({ eventType: 'ACTION' });
        const latestLog = logs[0];

        expect(latestLog.details).toBeDefined();
        expect(latestLog.details.executionId).toBe(result.executionId);
        expect(latestLog.details.actionId).toBe('action-escalate-risk');
        expect(latestLog.details.status).toBe('success');
      });

      it('logs an ACTION event when action is not found', () => {
        executeAction('action-nonexistent', {}, 'persona-lukas');

        const logs = getLogs({ eventType: 'ACTION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.details.status).toBe('not_found');
      });

      it('logs an ACTION event when persona is unauthorized', () => {
        executeAction('action-submit-proposal', {}, 'persona-elena');

        const logs = getLogs({ eventType: 'ACTION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.details.status).toBe('unauthorized');
      });

      it('logs an ACTION event when params validation fails', () => {
        executeAction('action-escalate-risk', [1, 2], 'persona-lukas');

        const logs = getLogs({ eventType: 'ACTION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.details.status).toBe('validation_error');
      });

      it('logs the correct persona ID in the audit entry', () => {
        executeAction('action-submit-proposal', {}, 'persona-james');

        const logs = getLogs({ eventType: 'ACTION', personaId: 'persona-james' });
        expect(logs.length).toBeGreaterThanOrEqual(1);
        expect(logs[0].personaId).toBe('persona-james');
      });

      it('logs affectedSystemsCount and propagationSteps for successful actions', () => {
        executeAction('action-escalate-risk', {}, 'persona-lukas');

        const logs = getLogs({ eventType: 'ACTION' });
        const latestLog = logs[0];

        expect(typeof latestLog.details.affectedSystemsCount).toBe('number');
        expect(latestLog.details.affectedSystemsCount).toBeGreaterThan(0);
        expect(typeof latestLog.details.propagationSteps).toBe('number');
        expect(latestLog.details.propagationSteps).toBeGreaterThan(0);
      });
    });

    describe('unique execution IDs', () => {
      it('generates unique execution IDs for different executions', () => {
        const result1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const result2 = executeAction('action-escalate-risk', {}, 'persona-lukas');

        expect(result1.executionId).not.toBe(result2.executionId);
      });

      it('generates execution IDs with the exec- prefix', () => {
        const result = executeAction('action-reassign-task', {}, 'persona-sophie');

        expect(result.executionId).toMatch(/^exec-/);
      });
    });

    describe('error result structure', () => {
      it('returns empty arrays and strings for error results', () => {
        const result = executeAction('action-nonexistent', {}, 'persona-lukas');

        expect(result.affectedSystems).toEqual([]);
        expect(result.propagationChain).toEqual([]);
        expect(result.notifications).toEqual([]);
        expect(result.actionLabel).toBe('');
        expect(result.actionType).toBe('');
        expect(result.category).toBe('');
        expect(result.rollbackSupported).toBe(false);
      });
    });
  });

  describe('getAction', () => {
    it('returns an action by its ID', () => {
      const action = getAction('action-escalate-risk');

      expect(action).toBeDefined();
      expect(action).not.toBeNull();
      expect(action.id).toBe('action-escalate-risk');
      expect(action.label).toBe('Escalate Risk');
      expect(action.type).toBe('escalate');
    });

    it('returns null for a non-existent action ID', () => {
      const action = getAction('action-nonexistent-999');
      expect(action).toBeNull();
    });

    it('returns null for empty action ID', () => {
      const action = getAction('');
      expect(action).toBeNull();
    });

    it('returns null for non-string action ID', () => {
      const action = getAction(null);
      expect(action).toBeNull();
    });

    it('returns an action with all expected fields', () => {
      const action = getAction('action-reassign-task');

      expect(action).not.toBeNull();
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('type');
      expect(action).toHaveProperty('label');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('targetSystem');
      expect(action).toHaveProperty('affectedPersonaIds');
      expect(action).toHaveProperty('crossDomainEffects');
      expect(action).toHaveProperty('category');
      expect(action).toHaveProperty('requiredPermissions');
      expect(action).toHaveProperty('priority');
    });
  });

  describe('getActionsForPersona', () => {
    it('returns actions for persona-lukas', () => {
      const actions = getActionsForPersona('persona-lukas');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].affectedPersonaIds).toContain('persona-lukas');
      }
    });

    it('returns actions for persona-elena', () => {
      const actions = getActionsForPersona('persona-elena');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].affectedPersonaIds).toContain('persona-elena');
      }
    });

    it('returns actions for persona-sophie', () => {
      const actions = getActionsForPersona('persona-sophie');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].affectedPersonaIds).toContain('persona-sophie');
      }
    });

    it('returns actions for persona-james', () => {
      const actions = getActionsForPersona('persona-james');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].affectedPersonaIds).toContain('persona-james');
      }
    });

    it('returns empty array for empty personaId', () => {
      const actions = getActionsForPersona('');
      expect(actions).toEqual([]);
    });

    it('returns empty array for non-string personaId', () => {
      const actions = getActionsForPersona(null);
      expect(actions).toEqual([]);
    });

    it('returns empty array for non-existent persona', () => {
      const actions = getActionsForPersona('persona-nonexistent');
      expect(actions).toEqual([]);
    });

    it('returns different actions for different personas', () => {
      const lukasActions = getActionsForPersona('persona-lukas');
      const jamesActions = getActionsForPersona('persona-james');

      const lukasIds = new Set(lukasActions.map((a) => a.id));
      const jamesIds = new Set(jamesActions.map((a) => a.id));

      // They should have at least some different actions
      let uniqueToJames = 0;
      for (const id of jamesIds) {
        if (!lukasIds.has(id)) {
          uniqueToJames++;
        }
      }
      expect(uniqueToJames).toBeGreaterThan(0);
    });
  });

  describe('getActionsByCategory', () => {
    it('returns actions filtered by category for a persona', () => {
      const actions = getActionsByCategory('persona-lukas', 'finance');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].category).toBe('finance');
        expect(actions[i].affectedPersonaIds).toContain('persona-lukas');
      }
    });

    it('returns actions for workforce category for persona-sophie', () => {
      const actions = getActionsByCategory('persona-sophie', 'workforce');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].category).toBe('workforce');
      }
    });

    it('returns actions for sales category for persona-james', () => {
      const actions = getActionsByCategory('persona-james', 'sales');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);

      for (let i = 0; i < actions.length; i++) {
        expect(actions[i].category).toBe('sales');
      }
    });

    it('returns all persona actions when category is empty', () => {
      const allActions = getActionsForPersona('persona-lukas');
      const noCategoryActions = getActionsByCategory('persona-lukas', '');

      expect(noCategoryActions.length).toBe(allActions.length);
    });

    it('returns empty array for non-existent category', () => {
      const actions = getActionsByCategory('persona-lukas', 'nonexistent-category');
      expect(actions).toEqual([]);
    });

    it('returns empty array for empty personaId', () => {
      const actions = getActionsByCategory('', 'finance');
      expect(actions).toEqual([]);
    });
  });

  describe('getPropagationRule', () => {
    it('returns a propagation rule for a valid action ID', () => {
      const rule = getPropagationRule('action-escalate-risk');

      expect(rule).toBeDefined();
      expect(rule).not.toBeNull();
      expect(rule.actionId).toBe('action-escalate-risk');
      expect(rule.ruleId).toBeTruthy();
      expect(Array.isArray(rule.propagationChain)).toBe(true);
      expect(rule.propagationChain.length).toBeGreaterThan(0);
    });

    it('returns null for a non-existent action ID', () => {
      const rule = getPropagationRule('action-nonexistent');
      expect(rule).toBeNull();
    });

    it('returns null for empty action ID', () => {
      const rule = getPropagationRule('');
      expect(rule).toBeNull();
    });

    it('returns null for non-string action ID', () => {
      const rule = getPropagationRule(undefined);
      expect(rule).toBeNull();
    });

    it('returns a rule with notifiedPersonaIds', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(Array.isArray(rule.notifiedPersonaIds)).toBe(true);
      expect(rule.notifiedPersonaIds.length).toBeGreaterThan(0);
    });

    it('returns a rule with rollbackSupported field', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(typeof rule.rollbackSupported).toBe('boolean');
      expect(rule.rollbackSupported).toBe(true);
    });
  });

  describe('validateActionExecution', () => {
    it('returns canExecute true for an authorized persona', () => {
      const validation = validateActionExecution('action-escalate-risk', 'persona-lukas');

      expect(validation.canExecute).toBe(true);
      expect(validation.reasons).toEqual([]);
      expect(validation.action).not.toBeNull();
      expect(validation.persona).not.toBeNull();
    });

    it('returns canExecute false when action is not found', () => {
      const validation = validateActionExecution('action-nonexistent', 'persona-lukas');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
      expect(validation.reasons[0]).toContain('not found');
      expect(validation.action).toBeNull();
    });

    it('returns canExecute false when persona is not found', () => {
      const validation = validateActionExecution('action-escalate-risk', 'persona-nonexistent');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
      expect(validation.reasons[0]).toContain('not found');
      expect(validation.persona).toBeNull();
    });

    it('returns canExecute false when persona is not in affectedPersonaIds', () => {
      // action-submit-proposal affects persona-james and persona-lukas, not persona-elena
      const validation = validateActionExecution('action-submit-proposal', 'persona-elena');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
      expect(validation.reasons.some((r) => r.includes('not in the affected personas'))).toBe(true);
    });

    it('returns canExecute false when persona lacks required permissions', () => {
      // action-approve-procurement-award requires manage_costs and approve_budgets
      // persona-sophie does not have approve_budgets
      // But first check if sophie is in affectedPersonaIds
      const validation = validateActionExecution('action-approve-procurement-award', 'persona-sophie');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
    });

    it('returns canExecute false for empty actionId', () => {
      const validation = validateActionExecution('', 'persona-lukas');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
    });

    it('returns canExecute false for empty personaId', () => {
      const validation = validateActionExecution('action-escalate-risk', '');

      expect(validation.canExecute).toBe(false);
      expect(validation.reasons.length).toBeGreaterThan(0);
    });

    it('returns the action and persona objects when both are found', () => {
      const validation = validateActionExecution('action-escalate-risk', 'persona-lukas');

      expect(validation.action).not.toBeNull();
      expect(validation.action.id).toBe('action-escalate-risk');
      expect(validation.persona).not.toBeNull();
      expect(validation.persona.id).toBe('persona-lukas');
    });

    it('validates action-reassign-task for persona-sophie as executable', () => {
      const validation = validateActionExecution('action-reassign-task', 'persona-sophie');

      expect(validation.canExecute).toBe(true);
      expect(validation.reasons).toEqual([]);
    });

    it('validates action-submit-proposal for persona-james as executable', () => {
      const validation = validateActionExecution('action-submit-proposal', 'persona-james');

      expect(validation.canExecute).toBe(true);
      expect(validation.reasons).toEqual([]);
    });
  });

  describe('getActionPreview', () => {
    it('returns a preview for a valid action ID', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(preview).toBeDefined();
      expect(preview.actionId).toBe('action-escalate-risk');
      expect(preview.actionLabel).toBe('Escalate Risk');
      expect(preview.actionType).toBe('escalate');
      expect(preview.category).toBe('risk');
    });

    it('returns affectedSystems in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(Array.isArray(preview.affectedSystems)).toBe(true);
      expect(preview.affectedSystems.length).toBeGreaterThan(0);

      const system = preview.affectedSystems[0];
      expect(system).toHaveProperty('systemId');
      expect(system).toHaveProperty('systemName');
      expect(system).toHaveProperty('effect');
    });

    it('returns propagationChain in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(Array.isArray(preview.propagationChain)).toBe(true);
      expect(preview.propagationChain.length).toBeGreaterThan(0);

      const step = preview.propagationChain[0];
      expect(step).toHaveProperty('order');
      expect(step).toHaveProperty('targetSystem');
      expect(step).toHaveProperty('operation');
      expect(step).toHaveProperty('dataUpdate');
      expect(step).toHaveProperty('latency');
      expect(step).toHaveProperty('confidence');
    });

    it('returns notifications in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(Array.isArray(preview.notifications)).toBe(true);
      expect(preview.notifications.length).toBeGreaterThan(0);

      const notification = preview.notifications[0];
      expect(notification).toHaveProperty('personaId');
      expect(notification).toHaveProperty('personaName');
      expect(notification).toHaveProperty('message');
    });

    it('returns rollbackSupported in the preview', () => {
      const preview = getActionPreview('action-reassign-task');

      expect(typeof preview.rollbackSupported).toBe('boolean');
      expect(preview.rollbackSupported).toBe(true);
    });

    it('returns confirmationMessage in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(typeof preview.confirmationMessage).toBe('string');
      expect(preview.confirmationMessage.length).toBeGreaterThan(0);
    });

    it('returns description in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(typeof preview.description).toBe('string');
      expect(preview.description.length).toBeGreaterThan(0);
    });

    it('returns targetSystem and targetSystemName in the preview', () => {
      const preview = getActionPreview('action-escalate-risk');

      expect(preview.targetSystem).toBe('system-procore');
      expect(preview.targetSystemName).toBeTruthy();
    });

    it('returns empty preview for a non-existent action ID', () => {
      const preview = getActionPreview('action-nonexistent');

      expect(preview.actionId).toBe('action-nonexistent');
      expect(preview.actionLabel).toBe('');
      expect(preview.affectedSystems).toEqual([]);
      expect(preview.propagationChain).toEqual([]);
      expect(preview.notifications).toEqual([]);
      expect(preview.rollbackSupported).toBe(false);
    });

    it('returns empty preview for empty action ID', () => {
      const preview = getActionPreview('');

      expect(preview.actionId).toBe('');
      expect(preview.actionLabel).toBe('');
      expect(preview.affectedSystems).toEqual([]);
    });

    it('returns empty preview for non-string action ID', () => {
      const preview = getActionPreview(null);

      expect(preview.actionId).toBe('');
      expect(preview.affectedSystems).toEqual([]);
    });
  });

  describe('multiple executions in sequence', () => {
    it('processes multiple actions without interference', () => {
      const result1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
      const result2 = executeAction('action-reassign-task', {}, 'persona-sophie');
      const result3 = executeAction('action-submit-proposal', {}, 'persona-james');

      expect(result1.status).toBe('success');
      expect(result1.actionId).toBe('action-escalate-risk');
      expect(result1.personaId).toBe('persona-lukas');

      expect(result2.status).toBe('success');
      expect(result2.actionId).toBe('action-reassign-task');
      expect(result2.personaId).toBe('persona-sophie');

      expect(result3.status).toBe('success');
      expect(result3.actionId).toBe('action-submit-proposal');
      expect(result3.personaId).toBe('persona-james');
    });

    it('logs each action separately in the audit log', () => {
      executeAction('action-escalate-risk', {}, 'persona-lukas');
      executeAction('action-reassign-task', {}, 'persona-sophie');
      executeAction('action-submit-proposal', {}, 'persona-james');

      const logs = getLogs({ eventType: 'ACTION' });
      expect(logs.length).toBeGreaterThanOrEqual(3);

      const personaIds = logs.map((l) => l.personaId);
      expect(personaIds).toContain('persona-lukas');
      expect(personaIds).toContain('persona-sophie');
      expect(personaIds).toContain('persona-james');
    });

    it('generates unique execution IDs across multiple executions', () => {
      const result1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
      const result2 = executeAction('action-reassign-task', {}, 'persona-sophie');
      const result3 = executeAction('action-submit-proposal', {}, 'persona-james');

      const ids = new Set([result1.executionId, result2.executionId, result3.executionId]);
      expect(ids.size).toBe(3);
    });
  });

  describe('cross-domain effects', () => {
    it('includes cross-domain effects for action-approve-variation-order', () => {
      const result = executeAction('action-approve-variation-order', {}, 'persona-lukas');

      expect(result.status).toBe('success');
      expect(result.affectedSystems.length).toBeGreaterThanOrEqual(3);

      const systemIds = result.affectedSystems.map((s) => s.systemId);
      expect(systemIds).toContain('system-sap-fi');
      expect(systemIds).toContain('system-sap-mm');
      expect(systemIds).toContain('system-primavera-p6');
    });

    it('includes propagation chain steps for action-approve-variation-order', () => {
      const result = executeAction('action-approve-variation-order', {}, 'persona-lukas');

      expect(result.propagationChain.length).toBeGreaterThanOrEqual(3);

      // Steps should be ordered
      for (let i = 1; i < result.propagationChain.length; i++) {
        expect(result.propagationChain[i].order).toBeGreaterThan(result.propagationChain[i - 1].order);
      }
    });

    it('includes notifications for multiple personas for action-approve-variation-order', () => {
      const result = executeAction('action-approve-variation-order', {}, 'persona-lukas');

      expect(result.notifications.length).toBeGreaterThanOrEqual(2);

      const notifiedPersonaIds = result.notifications.map((n) => n.personaId);
      expect(notifiedPersonaIds).toContain('persona-lukas');
      expect(notifiedPersonaIds).toContain('persona-elena');
      expect(notifiedPersonaIds).toContain('persona-sophie');
    });
  });

  describe('action categories', () => {
    it('correctly categorizes workforce actions', () => {
      const result = executeAction('action-reassign-task', {}, 'persona-sophie');
      expect(result.category).toBe('workforce');
    });

    it('correctly categorizes finance actions', () => {
      const result = executeAction('action-update-budget', {}, 'persona-lukas');
      expect(result.category).toBe('finance');
    });

    it('correctly categorizes risk actions', () => {
      const result = executeAction('action-escalate-risk', {}, 'persona-lukas');
      expect(result.category).toBe('risk');
    });

    it('correctly categorizes sales actions', () => {
      const result = executeAction('action-submit-proposal', {}, 'persona-james');
      expect(result.category).toBe('sales');
    });

    it('correctly categorizes compliance actions', () => {
      const result = executeAction('action-issue-ncr', {}, 'persona-sophie');
      expect(result.category).toBe('compliance');
    });

    it('correctly categorizes management actions', () => {
      const result = executeAction('action-approve-rfi', {}, 'persona-sophie');
      expect(result.category).toBe('management');
    });
  });
});