/**
 * crossDomainPropagator.test.js — Unit tests for CrossDomainPropagator service.
 * Tests propagation rule matching, multi-system updates, affected persona
 * identification, and audit log entries for propagation events.
 *
 * @module crossDomainPropagator.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  propagate,
  getPropagationRule,
  getAllPropagationRules,
  getPropagationRulesByCategory,
  getPropagationPreview,
  getAffectedSystems,
  getNotifiedPersonas,
} from '@/services/crossDomainPropagator';
import { executeAction } from '@/services/actionExecutor';
import { getLogs, clearLogs } from '@/services/auditLogger';
import { getData } from '@/services/dataManager';

describe('CrossDomainPropagator', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure data is initialized
    getData('personas');
    clearLogs();
  });

  describe('propagate', () => {
    describe('input validation', () => {
      it('throws an error when actionResult is null', () => {
        expect(() => {
          propagate(null);
        }).toThrow('CrossDomainPropagator: actionResult must be a valid object');
      });

      it('throws an error when actionResult is undefined', () => {
        expect(() => {
          propagate(undefined);
        }).toThrow('CrossDomainPropagator: actionResult must be a valid object');
      });

      it('throws an error when actionResult is a string', () => {
        expect(() => {
          propagate('invalid');
        }).toThrow('CrossDomainPropagator: actionResult must be a valid object');
      });

      it('throws an error when actionResult is an array', () => {
        expect(() => {
          propagate([1, 2, 3]);
        }).toThrow('CrossDomainPropagator: actionResult must be a valid object');
      });

      it('throws an error when actionResult is a number', () => {
        expect(() => {
          propagate(42);
        }).toThrow('CrossDomainPropagator: actionResult must be a valid object');
      });
    });

    describe('successful propagation', () => {
      it('propagates a successful action result and returns success status', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        expect(actionResult.status).toBe('success');

        const propResult = propagate(actionResult);

        expect(propResult).toBeDefined();
        expect(propResult.status).toBe('success');
        expect(propResult.propagationId).toBeTruthy();
        expect(propResult.propagationId).toMatch(/^prop-/);
        expect(propResult.actionId).toBe('action-escalate-risk');
        expect(propResult.executionId).toBe(actionResult.executionId);
      });

      it('returns a valid ISO timestamp', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(typeof propResult.timestamp).toBe('string');
        const date = new Date(propResult.timestamp);
        expect(isNaN(date.getTime())).toBe(false);
      });

      it('propagates action-reassign-task successfully', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.actionId).toBe('action-reassign-task');
        expect(propResult.ruleId).toBe('prop-reassign-task');
        expect(propResult.category).toBe('workforce');
      });

      it('propagates action-update-budget successfully', () => {
        const actionResult = executeAction('action-update-budget', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.actionId).toBe('action-update-budget');
        expect(propResult.ruleId).toBe('prop-update-budget');
        expect(propResult.category).toBe('finance');
      });

      it('propagates action-submit-proposal successfully', () => {
        const actionResult = executeAction('action-submit-proposal', {}, 'persona-james');
        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.actionId).toBe('action-submit-proposal');
        expect(propResult.ruleId).toBe('prop-submit-proposal');
        expect(propResult.category).toBe('sales');
      });

      it('propagates action-certify-payment successfully', () => {
        const actionResult = executeAction('action-certify-payment', {}, 'persona-elena');
        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.actionId).toBe('action-certify-payment');
        expect(propResult.ruleId).toBe('prop-certify-payment');
        expect(propResult.category).toBe('finance');
      });

      it('propagates action-approve-variation-order with multiple systems', () => {
        const actionResult = executeAction('action-approve-variation-order', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.affectedSystems.length).toBeGreaterThanOrEqual(3);
        expect(propResult.stepResults.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('skipped propagation', () => {
      it('returns skipped status when action result status is not success', () => {
        const failedResult = {
          status: 'unauthorized',
          actionId: 'action-escalate-risk',
          executionId: 'exec-test-123',
          personaId: 'persona-lukas',
        };

        const propResult = propagate(failedResult);

        expect(propResult.status).toBe('skipped');
        expect(propResult.message).toContain('skipped');
        expect(propResult.affectedSystems).toEqual([]);
        expect(propResult.stepResults).toEqual([]);
        expect(propResult.notifications).toEqual([]);
      });

      it('returns skipped status when action result status is failed', () => {
        const failedResult = {
          status: 'failed',
          actionId: 'action-escalate-risk',
          executionId: 'exec-test-456',
          personaId: 'persona-lukas',
        };

        const propResult = propagate(failedResult);

        expect(propResult.status).toBe('skipped');
      });

      it('returns skipped status when action result status is not_found', () => {
        const notFoundResult = {
          status: 'not_found',
          actionId: 'action-nonexistent',
          executionId: 'exec-test-789',
          personaId: 'persona-lukas',
        };

        const propResult = propagate(notFoundResult);

        expect(propResult.status).toBe('skipped');
      });

      it('returns skipped status when action result status is validation_error', () => {
        const validationResult = {
          status: 'validation_error',
          actionId: 'action-escalate-risk',
          executionId: 'exec-test-abc',
          personaId: 'persona-lukas',
        };

        const propResult = propagate(validationResult);

        expect(propResult.status).toBe('skipped');
      });
    });

    describe('no rule found', () => {
      it('returns no_rule status when no propagation rule exists for the action', () => {
        const actionResult = {
          status: 'success',
          actionId: 'action-nonexistent-no-rule',
          executionId: 'exec-test-norule',
          personaId: 'persona-lukas',
          category: 'management',
        };

        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('no_rule');
        expect(propResult.message).toContain('No propagation rule');
        expect(propResult.affectedSystems).toEqual([]);
        expect(propResult.stepResults).toEqual([]);
        expect(propResult.notifications).toEqual([]);
      });

      it('returns empty ruleId when no propagation rule is found', () => {
        const actionResult = {
          status: 'success',
          actionId: 'action-nonexistent-xyz',
          executionId: 'exec-test-norule2',
          personaId: 'persona-lukas',
        };

        const propResult = propagate(actionResult);

        expect(propResult.ruleId).toBe('');
      });
    });

    describe('propagation result structure', () => {
      it('returns all required fields in the propagation result', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult).toHaveProperty('propagationId');
        expect(propResult).toHaveProperty('status');
        expect(propResult).toHaveProperty('message');
        expect(propResult).toHaveProperty('actionId');
        expect(propResult).toHaveProperty('executionId');
        expect(propResult).toHaveProperty('ruleId');
        expect(propResult).toHaveProperty('category');
        expect(propResult).toHaveProperty('rollbackSupported');
        expect(propResult).toHaveProperty('affectedSystems');
        expect(propResult).toHaveProperty('stepResults');
        expect(propResult).toHaveProperty('notifications');
        expect(propResult).toHaveProperty('propagationResults');
        expect(propResult).toHaveProperty('timestamp');
      });

      it('returns propagationId with prop- prefix', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        expect(propResult.propagationId).toMatch(/^prop-/);
      });

      it('returns the correct ruleId for the action', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.ruleId).toBe('prop-escalate-risk');
      });

      it('returns the correct category for the propagation', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.category).toBe('risk');
      });

      it('returns rollbackSupported as a boolean', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(typeof propResult.rollbackSupported).toBe('boolean');
      });

      it('returns rollbackSupported true for action-reassign-task', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        expect(propResult.rollbackSupported).toBe(true);
      });

      it('returns rollbackSupported false for action-escalate-risk', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.rollbackSupported).toBe(false);
      });

      it('returns rollbackSupported false for action-submit-proposal', () => {
        const actionResult = executeAction('action-submit-proposal', {}, 'persona-james');
        const propResult = propagate(actionResult);

        expect(propResult.rollbackSupported).toBe(false);
      });

      it('returns rollbackSupported true for action-update-budget', () => {
        const actionResult = executeAction('action-update-budget', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.rollbackSupported).toBe(true);
      });
    });

    describe('multi-system updates (affectedSystems)', () => {
      it('returns affectedSystems as an array', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(Array.isArray(propResult.affectedSystems)).toBe(true);
        expect(propResult.affectedSystems.length).toBeGreaterThan(0);
      });

      it('returns affected system objects with systemId, systemName, shortName, color, and effect', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const system = propResult.affectedSystems[0];
        expect(system).toHaveProperty('systemId');
        expect(system).toHaveProperty('systemName');
        expect(system).toHaveProperty('shortName');
        expect(system).toHaveProperty('color');
        expect(system).toHaveProperty('effect');
        expect(typeof system.systemId).toBe('string');
        expect(typeof system.systemName).toBe('string');
        expect(typeof system.shortName).toBe('string');
        expect(typeof system.color).toBe('string');
        expect(typeof system.effect).toBe('string');
      });

      it('returns unique systems in affectedSystems (no duplicates)', () => {
        const actionResult = executeAction('action-approve-variation-order', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const systemIds = propResult.affectedSystems.map((s) => s.systemId);
        const uniqueIds = new Set(systemIds);
        expect(uniqueIds.size).toBe(systemIds.length);
      });

      it('includes correct systems for action-escalate-risk', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const systemIds = propResult.affectedSystems.map((s) => s.systemId);
        expect(systemIds).toContain('system-procore');
        expect(systemIds).toContain('system-primavera-p6');
        expect(systemIds).toContain('system-sap-fi');
      });

      it('includes correct systems for action-reassign-task', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        const systemIds = propResult.affectedSystems.map((s) => s.systemId);
        expect(systemIds).toContain('system-primavera-p6');
        expect(systemIds).toContain('system-workday');
        expect(systemIds).toContain('system-procore');
      });

      it('includes correct systems for action-approve-variation-order', () => {
        const actionResult = executeAction('action-approve-variation-order', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const systemIds = propResult.affectedSystems.map((s) => s.systemId);
        expect(systemIds).toContain('system-sap-fi');
        expect(systemIds).toContain('system-sap-mm');
        expect(systemIds).toContain('system-primavera-p6');
        expect(systemIds).toContain('system-procore');
      });

      it('includes correct systems for action-submit-proposal', () => {
        const actionResult = executeAction('action-submit-proposal', {}, 'persona-james');
        const propResult = propagate(actionResult);

        const systemIds = propResult.affectedSystems.map((s) => s.systemId);
        expect(systemIds).toContain('system-salesforce');
        expect(systemIds).toContain('system-sap-fi');
        expect(systemIds).toContain('system-workday');
      });
    });

    describe('step results', () => {
      it('returns stepResults as an array', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(Array.isArray(propResult.stepResults)).toBe(true);
        expect(propResult.stepResults.length).toBeGreaterThan(0);
      });

      it('returns step result objects with all required fields', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const step = propResult.stepResults[0];
        expect(step).toHaveProperty('order');
        expect(step).toHaveProperty('targetSystem');
        expect(step).toHaveProperty('systemName');
        expect(step).toHaveProperty('shortName');
        expect(step).toHaveProperty('color');
        expect(step).toHaveProperty('operation');
        expect(step).toHaveProperty('dataUpdate');
        expect(step).toHaveProperty('latency');
        expect(step).toHaveProperty('confidence');
        expect(step).toHaveProperty('status');
        expect(step).toHaveProperty('propagationId');
      });

      it('returns step results with success status', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.stepResults.length; i++) {
          expect(propResult.stepResults[i].status).toBe('success');
        }
      });

      it('returns step results ordered by order field', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 1; i < propResult.stepResults.length; i++) {
          expect(propResult.stepResults[i].order).toBeGreaterThan(propResult.stepResults[i - 1].order);
        }
      });

      it('returns step results with numeric confidence values', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.stepResults.length; i++) {
          expect(typeof propResult.stepResults[i].confidence).toBe('number');
          expect(propResult.stepResults[i].confidence).toBeGreaterThan(0);
          expect(propResult.stepResults[i].confidence).toBeLessThanOrEqual(1);
        }
      });

      it('returns step results with non-empty dataUpdate strings', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.stepResults.length; i++) {
          expect(typeof propResult.stepResults[i].dataUpdate).toBe('string');
          expect(propResult.stepResults[i].dataUpdate.length).toBeGreaterThan(0);
        }
      });

      it('returns step results with non-empty operation strings', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.stepResults.length; i++) {
          expect(typeof propResult.stepResults[i].operation).toBe('string');
          expect(propResult.stepResults[i].operation.length).toBeGreaterThan(0);
        }
      });

      it('returns the correct number of steps for action-approve-variation-order', () => {
        const actionResult = executeAction('action-approve-variation-order', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.stepResults.length).toBe(4);
      });

      it('returns the correct number of steps for action-reassign-task', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        expect(propResult.stepResults.length).toBe(3);
      });

      it('returns the propagationId in each step result', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.stepResults.length; i++) {
          expect(propResult.stepResults[i].propagationId).toBe(propResult.propagationId);
        }
      });
    });

    describe('affected persona identification (notifications)', () => {
      it('returns notifications as an array', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(Array.isArray(propResult.notifications)).toBe(true);
        expect(propResult.notifications.length).toBeGreaterThan(0);
      });

      it('returns notification objects with personaId, personaName, role, and message', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const notification = propResult.notifications[0];
        expect(notification).toHaveProperty('personaId');
        expect(notification).toHaveProperty('personaName');
        expect(notification).toHaveProperty('role');
        expect(notification).toHaveProperty('message');
        expect(typeof notification.personaId).toBe('string');
        expect(typeof notification.personaName).toBe('string');
        expect(typeof notification.role).toBe('string');
        expect(typeof notification.message).toBe('string');
      });

      it('returns non-empty notification messages', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        for (let i = 0; i < propResult.notifications.length; i++) {
          expect(propResult.notifications[i].message.length).toBeGreaterThan(0);
        }
      });

      it('notifies the correct personas for action-escalate-risk', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const notifiedPersonaIds = propResult.notifications.map((n) => n.personaId);
        expect(notifiedPersonaIds).toContain('persona-lukas');
        expect(notifiedPersonaIds).toContain('persona-sophie');
      });

      it('notifies the correct personas for action-reassign-task', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        const notifiedPersonaIds = propResult.notifications.map((n) => n.personaId);
        expect(notifiedPersonaIds).toContain('persona-sophie');
        expect(notifiedPersonaIds).toContain('persona-lukas');
      });

      it('notifies the correct personas for action-approve-variation-order', () => {
        const actionResult = executeAction('action-approve-variation-order', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const notifiedPersonaIds = propResult.notifications.map((n) => n.personaId);
        expect(notifiedPersonaIds).toContain('persona-lukas');
        expect(notifiedPersonaIds).toContain('persona-elena');
        expect(notifiedPersonaIds).toContain('persona-sophie');
      });

      it('notifies the correct personas for action-submit-proposal', () => {
        const actionResult = executeAction('action-submit-proposal', {}, 'persona-james');
        const propResult = propagate(actionResult);

        const notifiedPersonaIds = propResult.notifications.map((n) => n.personaId);
        expect(notifiedPersonaIds).toContain('persona-james');
        expect(notifiedPersonaIds).toContain('persona-lukas');
      });

      it('resolves persona names correctly in notifications', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const lukasNotif = propResult.notifications.find((n) => n.personaId === 'persona-lukas');
        const sophieNotif = propResult.notifications.find((n) => n.personaId === 'persona-sophie');

        expect(lukasNotif).toBeDefined();
        expect(lukasNotif.personaName).toBe('Lukas Müller');
        expect(lukasNotif.role).toBe('Project Director');

        expect(sophieNotif).toBeDefined();
        expect(sophieNotif.personaName).toBe('Sophie Dubois');
        expect(sophieNotif.role).toBe('Project Manager');
      });

      it('returns persona-specific notification messages', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const lukasNotif = propResult.notifications.find((n) => n.personaId === 'persona-lukas');
        const sophieNotif = propResult.notifications.find((n) => n.personaId === 'persona-sophie');

        expect(lukasNotif.message).not.toBe(sophieNotif.message);
        expect(lukasNotif.message.length).toBeGreaterThan(0);
        expect(sophieNotif.message.length).toBeGreaterThan(0);
      });
    });

    describe('propagation results (combined)', () => {
      it('returns propagationResults as an array', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(Array.isArray(propResult.propagationResults)).toBe(true);
        expect(propResult.propagationResults.length).toBeGreaterThan(0);
      });

      it('includes both system_update and notification types in propagationResults', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const types = propResult.propagationResults.map((r) => r.type);
        expect(types).toContain('system_update');
        expect(types).toContain('notification');
      });

      it('returns system_update results with system object', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const systemUpdates = propResult.propagationResults.filter((r) => r.type === 'system_update');
        expect(systemUpdates.length).toBeGreaterThan(0);

        const update = systemUpdates[0];
        expect(update.system).not.toBeNull();
        expect(update.system).toHaveProperty('systemId');
        expect(update.system).toHaveProperty('systemName');
        expect(update.system).toHaveProperty('shortName');
        expect(update.system).toHaveProperty('color');
        expect(update.affectedPersona).toBeNull();
      });

      it('returns notification results with affectedPersona object', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const notifications = propResult.propagationResults.filter((r) => r.type === 'notification');
        expect(notifications.length).toBeGreaterThan(0);

        const notif = notifications[0];
        expect(notif.system).toBeNull();
        expect(notif.affectedPersona).not.toBeNull();
        expect(notif.affectedPersona).toHaveProperty('personaId');
        expect(notif.affectedPersona).toHaveProperty('personaName');
        expect(notif.affectedPersona).toHaveProperty('role');
      });

      it('returns the correct total count of propagationResults', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        const expectedTotal = propResult.stepResults.length + propResult.notifications.length;
        expect(propResult.propagationResults.length).toBe(expectedTotal);
      });
    });

    describe('success message', () => {
      it('includes system count in success message', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const propResult = propagate(actionResult);

        expect(propResult.message).toContain('system');
        expect(propResult.message).toContain('notification');
      });

      it('includes notification count in success message', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        const propResult = propagate(actionResult);

        expect(propResult.message).toContain('notification');
      });
    });

    describe('audit logging integration', () => {
      it('logs a PROPAGATION event when propagation completes successfully', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        clearLogs();

        propagate(actionResult);

        const logs = getLogs({ eventType: 'PROPAGATION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const propLog = logs[0];
        expect(propLog.eventType).toBe('PROPAGATION');
        expect(propLog.action).toContain('Propagation completed');
        expect(propLog.details.actionId).toBe('action-escalate-risk');
        expect(propLog.details.status).toBe('success');
      });

      it('logs PROPAGATION_STEP events for each step in the chain', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        clearLogs();

        const propResult = propagate(actionResult);

        const stepLogs = getLogs({ eventType: 'PROPAGATION_STEP' });
        expect(stepLogs.length).toBe(propResult.stepResults.length);

        for (let i = 0; i < stepLogs.length; i++) {
          expect(stepLogs[i].eventType).toBe('PROPAGATION_STEP');
          expect(stepLogs[i].details.propagationId).toBe(propResult.propagationId);
          expect(stepLogs[i].details.actionId).toBe('action-escalate-risk');
        }
      });

      it('logs PROPAGATION_NOTIFICATION events for each notification', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        clearLogs();

        const propResult = propagate(actionResult);

        const notifLogs = getLogs({ eventType: 'PROPAGATION_NOTIFICATION' });
        expect(notifLogs.length).toBe(propResult.notifications.length);

        for (let i = 0; i < notifLogs.length; i++) {
          expect(notifLogs[i].eventType).toBe('PROPAGATION_NOTIFICATION');
          expect(notifLogs[i].details.propagationId).toBe(propResult.propagationId);
          expect(notifLogs[i].details.actionId).toBe('action-escalate-risk');
        }
      });

      it('logs a PROPAGATION event when propagation is skipped', () => {
        clearLogs();

        propagate({
          status: 'failed',
          actionId: 'action-escalate-risk',
          executionId: 'exec-test-skip',
          personaId: 'persona-lukas',
        });

        const logs = getLogs({ eventType: 'PROPAGATION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const propLog = logs[0];
        expect(propLog.details.status).toBe('skipped');
      });

      it('logs a PROPAGATION event when no rule is found', () => {
        clearLogs();

        propagate({
          status: 'success',
          actionId: 'action-nonexistent-norule',
          executionId: 'exec-test-norule',
          personaId: 'persona-lukas',
        });

        const logs = getLogs({ eventType: 'PROPAGATION' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const propLog = logs[0];
        expect(propLog.details.status).toBe('no_rule');
      });

      it('logs propagation details including ruleId and category', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        clearLogs();

        propagate(actionResult);

        const logs = getLogs({ eventType: 'PROPAGATION' });
        const propLog = logs[0];

        expect(propLog.details.ruleId).toBe('prop-reassign-task');
        expect(propLog.details.category).toBe('workforce');
        expect(typeof propLog.details.affectedSystemsCount).toBe('number');
        expect(typeof propLog.details.stepsProcessed).toBe('number');
        expect(typeof propLog.details.notificationsSent).toBe('number');
        expect(typeof propLog.details.rollbackSupported).toBe('boolean');
      });

      it('logs the correct persona ID in PROPAGATION_NOTIFICATION entries', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        clearLogs();

        propagate(actionResult);

        const notifLogs = getLogs({ eventType: 'PROPAGATION_NOTIFICATION' });
        const personaIds = notifLogs.map((l) => l.personaId);

        expect(personaIds).toContain('persona-lukas');
        expect(personaIds).toContain('persona-sophie');
      });

      it('logs step details including targetSystem and operation', () => {
        const actionResult = executeAction('action-reassign-task', {}, 'persona-sophie');
        clearLogs();

        propagate(actionResult);

        const stepLogs = getLogs({ eventType: 'PROPAGATION_STEP' });
        expect(stepLogs.length).toBeGreaterThan(0);

        const stepLog = stepLogs[0];
        expect(stepLog.details.targetSystem).toBeTruthy();
        expect(stepLog.details.operation).toBeTruthy();
        expect(stepLog.details.systemName).toBeTruthy();
        expect(typeof stepLog.details.order).toBe('number');
        expect(typeof stepLog.details.confidence).toBe('number');
      });
    });

    describe('unique propagation IDs', () => {
      it('generates unique propagation IDs for different propagations', () => {
        const actionResult1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const actionResult2 = executeAction('action-reassign-task', {}, 'persona-sophie');

        const propResult1 = propagate(actionResult1);
        const propResult2 = propagate(actionResult2);

        expect(propResult1.propagationId).not.toBe(propResult2.propagationId);
      });

      it('generates unique propagation IDs for the same action executed twice', () => {
        const actionResult1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
        const actionResult2 = executeAction('action-escalate-risk', {}, 'persona-lukas');

        const propResult1 = propagate(actionResult1);
        const propResult2 = propagate(actionResult2);

        expect(propResult1.propagationId).not.toBe(propResult2.propagationId);
      });
    });

    describe('handling missing fields in actionResult', () => {
      it('handles actionResult with missing actionId gracefully', () => {
        const result = propagate({
          status: 'success',
          executionId: 'exec-test-missing',
          personaId: 'persona-lukas',
        });

        expect(result.status).toBe('no_rule');
        expect(result.actionId).toBe('');
      });

      it('handles actionResult with missing executionId gracefully', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        delete actionResult.executionId;

        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
        expect(propResult.executionId).toBe('');
      });

      it('handles actionResult with missing personaId gracefully', () => {
        const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
        delete actionResult.personaId;

        const propResult = propagate(actionResult);

        expect(propResult.status).toBe('success');
      });
    });
  });

  describe('getPropagationRule', () => {
    it('returns a propagation rule for a valid action ID', () => {
      const rule = getPropagationRule('action-escalate-risk');

      expect(rule).toBeDefined();
      expect(rule).not.toBeNull();
      expect(rule.actionId).toBe('action-escalate-risk');
      expect(rule.ruleId).toBe('prop-escalate-risk');
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

    it('returns null for null action ID', () => {
      const rule = getPropagationRule(null);
      expect(rule).toBeNull();
    });

    it('returns a rule with propagationChain array', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(Array.isArray(rule.propagationChain)).toBe(true);
      expect(rule.propagationChain.length).toBeGreaterThan(0);
    });

    it('returns a rule with notifiedPersonaIds array', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(Array.isArray(rule.notifiedPersonaIds)).toBe(true);
      expect(rule.notifiedPersonaIds.length).toBeGreaterThan(0);
    });

    it('returns a rule with notificationMessages object', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(rule.notificationMessages).toBeDefined();
      expect(typeof rule.notificationMessages).toBe('object');
    });

    it('returns a rule with rollbackSupported boolean', () => {
      const rule = getPropagationRule('action-reassign-task');

      expect(rule).not.toBeNull();
      expect(typeof rule.rollbackSupported).toBe('boolean');
    });

    it('returns a rule with category string', () => {
      const rule = getPropagationRule('action-escalate-risk');

      expect(rule).not.toBeNull();
      expect(typeof rule.category).toBe('string');
      expect(rule.category).toBe('risk');
    });

    it('returns a rule with sourceSystem string', () => {
      const rule = getPropagationRule('action-escalate-risk');

      expect(rule).not.toBeNull();
      expect(typeof rule.sourceSystem).toBe('string');
      expect(rule.sourceSystem).toBe('system-procore');
    });
  });

  describe('getAllPropagationRules', () => {
    it('returns an array of all propagation rules', () => {
      const rules = getAllPropagationRules();

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('returns rules with ruleId and actionId fields', () => {
      const rules = getAllPropagationRules();

      for (let i = 0; i < rules.length; i++) {
        expect(rules[i]).toHaveProperty('ruleId');
        expect(rules[i]).toHaveProperty('actionId');
        expect(typeof rules[i].ruleId).toBe('string');
        expect(typeof rules[i].actionId).toBe('string');
      }
    });

    it('returns rules with propagationChain arrays', () => {
      const rules = getAllPropagationRules();

      for (let i = 0; i < rules.length; i++) {
        expect(Array.isArray(rules[i].propagationChain)).toBe(true);
        expect(rules[i].propagationChain.length).toBeGreaterThan(0);
      }
    });

    it('returns the expected number of propagation rules', () => {
      const rules = getAllPropagationRules();
      const propagationData = getData('propagation');

      expect(rules.length).toBe(propagationData.length);
    });

    it('includes rules for all action categories', () => {
      const rules = getAllPropagationRules();
      const categories = new Set(rules.map((r) => r.category));

      expect(categories.has('workforce')).toBe(true);
      expect(categories.has('finance')).toBe(true);
      expect(categories.has('risk')).toBe(true);
      expect(categories.has('management')).toBe(true);
      expect(categories.has('sales')).toBe(true);
      expect(categories.has('compliance')).toBe(true);
    });
  });

  describe('getPropagationRulesByCategory', () => {
    it('returns rules filtered by category', () => {
      const rules = getPropagationRulesByCategory('finance');

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      for (let i = 0; i < rules.length; i++) {
        expect(rules[i].category).toBe('finance');
      }
    });

    it('returns rules for workforce category', () => {
      const rules = getPropagationRulesByCategory('workforce');

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      for (let i = 0; i < rules.length; i++) {
        expect(rules[i].category).toBe('workforce');
      }
    });

    it('returns rules for risk category', () => {
      const rules = getPropagationRulesByCategory('risk');

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      for (let i = 0; i < rules.length; i++) {
        expect(rules[i].category).toBe('risk');
      }
    });

    it('returns rules for sales category', () => {
      const rules = getPropagationRulesByCategory('sales');

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      for (let i = 0; i < rules.length; i++) {
        expect(rules[i].category).toBe('sales');
      }
    });

    it('returns empty array for empty category', () => {
      const rules = getPropagationRulesByCategory('');
      expect(rules).toEqual([]);
    });

    it('returns empty array for non-string category', () => {
      const rules = getPropagationRulesByCategory(null);
      expect(rules).toEqual([]);
    });

    it('returns empty array for non-existent category', () => {
      const rules = getPropagationRulesByCategory('nonexistent-category');
      expect(rules).toEqual([]);
    });
  });

  describe('getPropagationPreview', () => {
    it('returns a preview for a valid action ID', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(preview).toBeDefined();
      expect(preview.ruleId).toBe('prop-escalate-risk');
      expect(preview.actionId).toBe('action-escalate-risk');
      expect(preview.category).toBe('risk');
    });

    it('returns propagationChain in the preview', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(Array.isArray(preview.propagationChain)).toBe(true);
      expect(preview.propagationChain.length).toBeGreaterThan(0);

      const step = preview.propagationChain[0];
      expect(step).toHaveProperty('order');
      expect(step).toHaveProperty('targetSystem');
      expect(step).toHaveProperty('systemName');
      expect(step).toHaveProperty('shortName');
      expect(step).toHaveProperty('color');
      expect(step).toHaveProperty('operation');
      expect(step).toHaveProperty('dataUpdate');
      expect(step).toHaveProperty('latency');
      expect(step).toHaveProperty('confidence');
    });

    it('returns affectedSystems in the preview', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(Array.isArray(preview.affectedSystems)).toBe(true);
      expect(preview.affectedSystems.length).toBeGreaterThan(0);

      const system = preview.affectedSystems[0];
      expect(system).toHaveProperty('systemId');
      expect(system).toHaveProperty('systemName');
      expect(system).toHaveProperty('shortName');
      expect(system).toHaveProperty('color');
    });

    it('returns notifiedPersonas in the preview', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(Array.isArray(preview.notifiedPersonas)).toBe(true);
      expect(preview.notifiedPersonas.length).toBeGreaterThan(0);

      const persona = preview.notifiedPersonas[0];
      expect(persona).toHaveProperty('personaId');
      expect(persona).toHaveProperty('personaName');
      expect(persona).toHaveProperty('role');
      expect(persona).toHaveProperty('message');
    });

    it('returns rollbackSupported in the preview', () => {
      const preview = getPropagationPreview('action-reassign-task');

      expect(typeof preview.rollbackSupported).toBe('boolean');
      expect(preview.rollbackSupported).toBe(true);
    });

    it('returns triggerDescription in the preview', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(typeof preview.triggerDescription).toBe('string');
      expect(preview.triggerDescription.length).toBeGreaterThan(0);
    });

    it('returns sourceSystem in the preview', () => {
      const preview = getPropagationPreview('action-escalate-risk');

      expect(typeof preview.sourceSystem).toBe('string');
      expect(preview.sourceSystem).toBe('system-procore');
    });

    it('returns empty preview for a non-existent action ID', () => {
      const preview = getPropagationPreview('action-nonexistent');

      expect(preview.ruleId).toBe('');
      expect(preview.actionId).toBe('action-nonexistent');
      expect(preview.propagationChain).toEqual([]);
      expect(preview.affectedSystems).toEqual([]);
      expect(preview.notifiedPersonas).toEqual([]);
      expect(preview.rollbackSupported).toBe(false);
    });

    it('returns empty preview for empty action ID', () => {
      const preview = getPropagationPreview('');

      expect(preview.ruleId).toBe('');
      expect(preview.actionId).toBe('');
      expect(preview.propagationChain).toEqual([]);
      expect(preview.affectedSystems).toEqual([]);
      expect(preview.notifiedPersonas).toEqual([]);
    });

    it('returns empty preview for non-string action ID', () => {
      const preview = getPropagationPreview(null);

      expect(preview.ruleId).toBe('');
      expect(preview.propagationChain).toEqual([]);
      expect(preview.affectedSystems).toEqual([]);
    });

    it('resolves system names correctly in propagation chain', () => {
      const preview = getPropagationPreview('action-reassign-task');

      const primaveraStep = preview.propagationChain.find((s) => s.targetSystem === 'system-primavera-p6');
      expect(primaveraStep).toBeDefined();
      expect(primaveraStep.systemName).toBe('Oracle Primavera P6');
      expect(primaveraStep.shortName).toBe('Primavera P6');
    });

    it('resolves persona names correctly in notifiedPersonas', () => {
      const preview = getPropagationPreview('action-reassign-task');

      const sophieNotif = preview.notifiedPersonas.find((n) => n.personaId === 'persona-sophie');
      expect(sophieNotif).toBeDefined();
      expect(sophieNotif.personaName).toBe('Sophie Dubois');
      expect(sophieNotif.role).toBe('Project Manager');
    });
  });

  describe('getAffectedSystems', () => {
    it('returns affected systems for a valid action ID', () => {
      const systems = getAffectedSystems('action-escalate-risk');

      expect(Array.isArray(systems)).toBe(true);
      expect(systems.length).toBeGreaterThan(0);
    });

    it('returns system objects with systemId, systemName, shortName, color, and effect', () => {
      const systems = getAffectedSystems('action-escalate-risk');

      const system = systems[0];
      expect(system).toHaveProperty('systemId');
      expect(system).toHaveProperty('systemName');
      expect(system).toHaveProperty('shortName');
      expect(system).toHaveProperty('color');
      expect(system).toHaveProperty('effect');
    });

    it('returns the correct systems for action-reassign-task', () => {
      const systems = getAffectedSystems('action-reassign-task');

      const systemIds = systems.map((s) => s.systemId);
      expect(systemIds).toContain('system-primavera-p6');
      expect(systemIds).toContain('system-workday');
      expect(systemIds).toContain('system-procore');
    });

    it('returns the correct systems for action-approve-procurement-award', () => {
      const systems = getAffectedSystems('action-approve-procurement-award');

      const systemIds = systems.map((s) => s.systemId);
      expect(systemIds).toContain('system-sap-mm');
      expect(systemIds).toContain('system-sap-fi');
      expect(systemIds).toContain('system-vendor-compliance-db');
      expect(systemIds).toContain('system-primavera-p6');
    });

    it('returns empty array for a non-existent action ID', () => {
      const systems = getAffectedSystems('action-nonexistent');
      expect(systems).toEqual([]);
    });

    it('returns empty array for empty action ID', () => {
      const systems = getAffectedSystems('');
      expect(systems).toEqual([]);
    });

    it('returns empty array for non-string action ID', () => {
      const systems = getAffectedSystems(null);
      expect(systems).toEqual([]);
    });

    it('returns unique systems (no duplicates)', () => {
      const systems = getAffectedSystems('action-approve-variation-order');

      const systemIds = systems.map((s) => s.systemId);
      const uniqueIds = new Set(systemIds);
      expect(uniqueIds.size).toBe(systemIds.length);
    });
  });

  describe('getNotifiedPersonas', () => {
    it('returns notified personas for a valid action ID', () => {
      const personas = getNotifiedPersonas('action-escalate-risk');

      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThan(0);
    });

    it('returns persona objects with personaId, personaName, role, and message', () => {
      const personas = getNotifiedPersonas('action-escalate-risk');

      const persona = personas[0];
      expect(persona).toHaveProperty('personaId');
      expect(persona).toHaveProperty('personaName');
      expect(persona).toHaveProperty('role');
      expect(persona).toHaveProperty('message');
      expect(typeof persona.personaId).toBe('string');
      expect(typeof persona.personaName).toBe('string');
      expect(typeof persona.role).toBe('string');
      expect(typeof persona.message).toBe('string');
    });

    it('returns the correct personas for action-escalate-risk', () => {
      const personas = getNotifiedPersonas('action-escalate-risk');

      const personaIds = personas.map((p) => p.personaId);
      expect(personaIds).toContain('persona-lukas');
      expect(personaIds).toContain('persona-sophie');
    });

    it('returns the correct personas for action-approve-variation-order', () => {
      const personas = getNotifiedPersonas('action-approve-variation-order');

      const personaIds = personas.map((p) => p.personaId);
      expect(personaIds).toContain('persona-lukas');
      expect(personaIds).toContain('persona-elena');
      expect(personaIds).toContain('persona-sophie');
    });

    it('returns the correct personas for action-update-client-engagement', () => {
      const personas = getNotifiedPersonas('action-update-client-engagement');

      const personaIds = personas.map((p) => p.personaId);
      expect(personaIds).toContain('persona-james');
    });

    it('returns non-empty messages for all notified personas', () => {
      const personas = getNotifiedPersonas('action-escalate-risk');

      for (let i = 0; i < personas.length; i++) {
        expect(personas[i].message.length).toBeGreaterThan(0);
      }
    });

    it('resolves persona names correctly', () => {
      const personas = getNotifiedPersonas('action-certify-payment');

      const elenaNotif = personas.find((p) => p.personaId === 'persona-elena');
      expect(elenaNotif).toBeDefined();
      expect(elenaNotif.personaName).toBe('Elena Rossi');
      expect(elenaNotif.role).toBe('Senior Quantity Surveyor');
    });

    it('returns empty array for a non-existent action ID', () => {
      const personas = getNotifiedPersonas('action-nonexistent');
      expect(personas).toEqual([]);
    });

    it('returns empty array for empty action ID', () => {
      const personas = getNotifiedPersonas('');
      expect(personas).toEqual([]);
    });

    it('returns empty array for non-string action ID', () => {
      const personas = getNotifiedPersonas(null);
      expect(personas).toEqual([]);
    });
  });

  describe('multiple propagations in sequence', () => {
    it('processes multiple propagations without interference', () => {
      const actionResult1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
      const actionResult2 = executeAction('action-reassign-task', {}, 'persona-sophie');
      const actionResult3 = executeAction('action-submit-proposal', {}, 'persona-james');

      const propResult1 = propagate(actionResult1);
      const propResult2 = propagate(actionResult2);
      const propResult3 = propagate(actionResult3);

      expect(propResult1.status).toBe('success');
      expect(propResult1.actionId).toBe('action-escalate-risk');
      expect(propResult1.category).toBe('risk');

      expect(propResult2.status).toBe('success');
      expect(propResult2.actionId).toBe('action-reassign-task');
      expect(propResult2.category).toBe('workforce');

      expect(propResult3.status).toBe('success');
      expect(propResult3.actionId).toBe('action-submit-proposal');
      expect(propResult3.category).toBe('sales');
    });

    it('generates unique propagation IDs across multiple propagations', () => {
      const actionResult1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
      const actionResult2 = executeAction('action-reassign-task', {}, 'persona-sophie');
      const actionResult3 = executeAction('action-submit-proposal', {}, 'persona-james');

      const propResult1 = propagate(actionResult1);
      const propResult2 = propagate(actionResult2);
      const propResult3 = propagate(actionResult3);

      const ids = new Set([propResult1.propagationId, propResult2.propagationId, propResult3.propagationId]);
      expect(ids.size).toBe(3);
    });

    it('logs each propagation separately in the audit log', () => {
      const actionResult1 = executeAction('action-escalate-risk', {}, 'persona-lukas');
      const actionResult2 = executeAction('action-reassign-task', {}, 'persona-sophie');
      clearLogs();

      propagate(actionResult1);
      propagate(actionResult2);

      const propLogs = getLogs({ eventType: 'PROPAGATION' });
      expect(propLogs.length).toBeGreaterThanOrEqual(2);

      const actionIds = propLogs.map((l) => l.details.actionId);
      expect(actionIds).toContain('action-escalate-risk');
      expect(actionIds).toContain('action-reassign-task');
    });
  });

  describe('end-to-end: execute action then propagate', () => {
    it('completes the full execute-then-propagate flow for action-escalate-risk', () => {
      const actionResult = executeAction('action-escalate-risk', {}, 'persona-lukas');
      expect(actionResult.status).toBe('success');

      const propResult = propagate(actionResult);
      expect(propResult.status).toBe('success');
      expect(propResult.actionId).toBe('action-escalate-risk');
      expect(propResult.affectedSystems.length).toBeGreaterThan(0);
      expect(propResult.stepResults.length).toBeGreaterThan(0);
      expect(propResult.notifications.length).toBeGreaterThan(0);
      expect(propResult.propagationResults.length).toBeGreaterThan(0);
    });

    it('completes the full execute-then-propagate flow for action-approve-procurement-award', () => {
      const actionResult = executeAction('action-approve-procurement-award', {}, 'persona-elena');
      expect(actionResult.status).toBe('success');

      const propResult = propagate(actionResult);
      expect(propResult.status).toBe('success');
      expect(propResult.actionId).toBe('action-approve-procurement-award');
      expect(propResult.ruleId).toBe('prop-approve-procurement-award');
      expect(propResult.category).toBe('procurement');
      expect(propResult.affectedSystems.length).toBeGreaterThanOrEqual(3);
      expect(propResult.stepResults.length).toBeGreaterThanOrEqual(3);
      expect(propResult.notifications.length).toBeGreaterThan(0);
    });

    it('completes the full execute-then-propagate flow for action-issue-ncr', () => {
      const actionResult = executeAction('action-issue-ncr', {}, 'persona-sophie');
      expect(actionResult.status).toBe('success');

      const propResult = propagate(actionResult);
      expect(propResult.status).toBe('success');
      expect(propResult.actionId).toBe('action-issue-ncr');
      expect(propResult.ruleId).toBe('prop-issue-ncr');
      expect(propResult.category).toBe('compliance');
      expect(propResult.rollbackSupported).toBe(false);
    });

    it('completes the full execute-then-propagate flow for action-generate-executive-report', () => {
      const actionResult = executeAction('action-generate-executive-report', {}, 'persona-lukas');
      expect(actionResult.status).toBe('success');

      const propResult = propagate(actionResult);
      expect(propResult.status).toBe('success');
      expect(propResult.actionId).toBe('action-generate-executive-report');
      expect(propResult.ruleId).toBe('prop-generate-executive-report');
      expect(propResult.category).toBe('reporting');
      expect(propResult.stepResults.length).toBe(4);
    });

    it('produces correct audit trail for the full flow', () => {
      clearLogs();

      const actionResult = executeAction('action-update-budget', {}, 'persona-lukas');
      const propResult = propagate(actionResult);

      // Should have ACTION log
      const actionLogs = getLogs({ eventType: 'ACTION' });
      expect(actionLogs.length).toBeGreaterThanOrEqual(1);

      // Should have PROPAGATION log
      const propLogs = getLogs({ eventType: 'PROPAGATION' });
      expect(propLogs.length).toBeGreaterThanOrEqual(1);

      // Should have PROPAGATION_STEP logs
      const stepLogs = getLogs({ eventType: 'PROPAGATION_STEP' });
      expect(stepLogs.length).toBe(propResult.stepResults.length);

      // Should have PROPAGATION_NOTIFICATION logs
      const notifLogs = getLogs({ eventType: 'PROPAGATION_NOTIFICATION' });
      expect(notifLogs.length).toBe(propResult.notifications.length);
    });
  });
});