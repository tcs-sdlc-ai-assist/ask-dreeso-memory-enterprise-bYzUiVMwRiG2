/**
 * dataManager.test.js — Unit tests for DataManager service.
 * Tests getData, setData, updateData, deleteData, resetData,
 * localStorage interaction, and initial data loading from mock JSON.
 *
 * @module dataManager.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getData,
  setData,
  updateData,
  deleteData,
  resetData,
  getEntityNames,
  getDataById,
  getSchemaVersion,
} from '@/services/dataManager';

describe('DataManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getData', () => {
    describe('input validation', () => {
      it('throws an error when entity is empty', () => {
        expect(() => {
          getData('');
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is not a string', () => {
        expect(() => {
          getData(null);
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is undefined', () => {
        expect(() => {
          getData(undefined);
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is only whitespace', () => {
        expect(() => {
          getData('   ');
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is a number', () => {
        expect(() => {
          getData(42);
        }).toThrow('DataManager: entity must be a non-empty string');
      });
    });

    describe('initial data loading', () => {
      it('loads personas data from mock JSON on first access', () => {
        const personas = getData('personas');

        expect(Array.isArray(personas)).toBe(true);
        expect(personas.length).toBe(4);
      });

      it('loads actions data from mock JSON on first access', () => {
        const actions = getData('actions');

        expect(Array.isArray(actions)).toBe(true);
        expect(actions.length).toBeGreaterThan(0);
      });

      it('loads clusters data from mock JSON on first access', () => {
        const clusters = getData('clusters');

        expect(Array.isArray(clusters)).toBe(true);
        expect(clusters.length).toBeGreaterThan(0);
      });

      it('loads queries data from mock JSON on first access', () => {
        const queries = getData('queries');

        expect(Array.isArray(queries)).toBe(true);
        expect(queries.length).toBeGreaterThan(0);
      });

      it('loads systems data from mock JSON on first access', () => {
        const systems = getData('systems');

        expect(Array.isArray(systems)).toBe(true);
        expect(systems.length).toBe(10);
      });

      it('loads users data from mock JSON on first access', () => {
        const users = getData('users');

        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBe(4);
      });

      it('loads propagation data from mock JSON on first access', () => {
        const propagation = getData('propagation');

        expect(Array.isArray(propagation)).toBe(true);
        expect(propagation.length).toBeGreaterThan(0);
      });

      it('loads autosuggest data from mock JSON on first access', () => {
        const autosuggest = getData('autosuggest');

        expect(Array.isArray(autosuggest)).toBe(true);
        expect(autosuggest.length).toBe(4);
      });

      it('loads screenFlow data from mock JSON on first access', () => {
        const screenFlow = getData('screenFlow');

        expect(Array.isArray(screenFlow)).toBe(true);
        expect(screenFlow.length).toBe(20);
      });
    });

    describe('localStorage persistence', () => {
      it('persists data to localStorage after first access', () => {
        getData('personas');

        const storedData = JSON.parse(localStorage.getItem('dreeso_data_personas'));
        expect(storedData).not.toBeNull();
        expect(Array.isArray(storedData)).toBe(true);
        expect(storedData.length).toBe(4);
      });

      it('returns data from localStorage on subsequent access', () => {
        const firstAccess = getData('personas');
        const secondAccess = getData('personas');

        expect(firstAccess).toEqual(secondAccess);
      });

      it('persists schema version to localStorage', () => {
        getData('personas');

        const storedVersion = JSON.parse(localStorage.getItem('dreeso_data_schema_version'));
        expect(storedVersion).toBe(getSchemaVersion());
      });
    });

    describe('data structure validation', () => {
      it('returns personas with correct fields', () => {
        const personas = getData('personas');

        const persona = personas[0];
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('role');
        expect(persona).toHaveProperty('avatarInitials');
        expect(persona).toHaveProperty('colorTheme');
        expect(persona).toHaveProperty('permissions');
        expect(persona).toHaveProperty('clusterIds');
      });

      it('returns actions with correct fields', () => {
        const actions = getData('actions');

        const action = actions[0];
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

      it('returns systems with correct fields', () => {
        const systems = getData('systems');

        const system = systems[0];
        expect(system).toHaveProperty('id');
        expect(system).toHaveProperty('name');
        expect(system).toHaveProperty('shortName');
        expect(system).toHaveProperty('color');
        expect(system).toHaveProperty('icon');
        expect(system).toHaveProperty('description');
      });

      it('returns clusters with correct fields', () => {
        const clusters = getData('clusters');

        const cluster = clusters[0];
        expect(cluster).toHaveProperty('id');
        expect(cluster).toHaveProperty('personaId');
        expect(cluster).toHaveProperty('label');
        expect(cluster).toHaveProperty('description');
        expect(cluster).toHaveProperty('icon');
        expect(cluster).toHaveProperty('queryTemplate');
        expect(cluster).toHaveProperty('category');
        expect(cluster).toHaveProperty('priority');
      });

      it('returns users with correct fields', () => {
        const users = getData('users');

        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('password');
        expect(user).toHaveProperty('personaId');
        expect(user).toHaveProperty('displayName');
        expect(user).toHaveProperty('createdAt');
      });

      it('returns propagation rules with correct fields', () => {
        const propagation = getData('propagation');

        const rule = propagation[0];
        expect(rule).toHaveProperty('ruleId');
        expect(rule).toHaveProperty('actionId');
        expect(rule).toHaveProperty('actionType');
        expect(rule).toHaveProperty('triggerDescription');
        expect(rule).toHaveProperty('sourceSystem');
        expect(rule).toHaveProperty('propagationChain');
        expect(rule).toHaveProperty('notifiedPersonaIds');
        expect(rule).toHaveProperty('notificationMessages');
        expect(rule).toHaveProperty('rollbackSupported');
        expect(rule).toHaveProperty('category');
      });

      it('returns screenFlow entries with correct fields', () => {
        const screenFlow = getData('screenFlow');

        const screen = screenFlow[0];
        expect(screen).toHaveProperty('id');
        expect(screen).toHaveProperty('screenNumber');
        expect(screen).toHaveProperty('title');
        expect(screen).toHaveProperty('description');
        expect(screen).toHaveProperty('componentName');
      });
    });

    describe('non-existent entity', () => {
      it('returns empty array for an entity not in defaults', () => {
        const data = getData('nonexistent_entity');

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
      });
    });

    describe('specific persona data', () => {
      it('contains Lukas Müller persona', () => {
        const personas = getData('personas');
        const lukas = personas.find((p) => p.id === 'persona-lukas');

        expect(lukas).toBeDefined();
        expect(lukas.name).toBe('Lukas Müller');
        expect(lukas.role).toBe('Project Director');
        expect(lukas.avatarInitials).toBe('LM');
      });

      it('contains Elena Rossi persona', () => {
        const personas = getData('personas');
        const elena = personas.find((p) => p.id === 'persona-elena');

        expect(elena).toBeDefined();
        expect(elena.name).toBe('Elena Rossi');
        expect(elena.role).toBe('Senior Quantity Surveyor');
        expect(elena.avatarInitials).toBe('ER');
      });

      it('contains Sophie Dubois persona', () => {
        const personas = getData('personas');
        const sophie = personas.find((p) => p.id === 'persona-sophie');

        expect(sophie).toBeDefined();
        expect(sophie.name).toBe('Sophie Dubois');
        expect(sophie.role).toBe('Project Manager');
        expect(sophie.avatarInitials).toBe('SD');
      });

      it('contains James Carter persona', () => {
        const personas = getData('personas');
        const james = personas.find((p) => p.id === 'persona-james');

        expect(james).toBeDefined();
        expect(james.name).toBe('James Carter');
        expect(james.role).toBe('Sales Director');
        expect(james.avatarInitials).toBe('JC');
      });
    });

    describe('specific user data', () => {
      it('contains demo user for Lukas', () => {
        const users = getData('users');
        const lukasUser = users.find((u) => u.email === 'lukas.muller@dreeso.com');

        expect(lukasUser).toBeDefined();
        expect(lukasUser.password).toBe('demo1234');
        expect(lukasUser.personaId).toBe('persona-lukas');
        expect(lukasUser.displayName).toBe('Lukas Müller');
      });

      it('contains demo user for Elena', () => {
        const users = getData('users');
        const elenaUser = users.find((u) => u.email === 'elena.rossi@dreeso.com');

        expect(elenaUser).toBeDefined();
        expect(elenaUser.password).toBe('demo1234');
        expect(elenaUser.personaId).toBe('persona-elena');
      });

      it('contains demo user for Sophie', () => {
        const users = getData('users');
        const sophieUser = users.find((u) => u.email === 'sophie.dubois@dreeso.com');

        expect(sophieUser).toBeDefined();
        expect(sophieUser.password).toBe('demo1234');
        expect(sophieUser.personaId).toBe('persona-sophie');
      });

      it('contains demo user for James', () => {
        const users = getData('users');
        const jamesUser = users.find((u) => u.email === 'james.carter@dreeso.com');

        expect(jamesUser).toBeDefined();
        expect(jamesUser.password).toBe('demo1234');
        expect(jamesUser.personaId).toBe('persona-james');
      });
    });

    describe('specific system data', () => {
      it('contains all 10 connected systems', () => {
        const systems = getData('systems');

        expect(systems.length).toBe(10);

        const systemIds = systems.map((s) => s.id);
        expect(systemIds).toContain('system-procore');
        expect(systemIds).toContain('system-sap-mm');
        expect(systemIds).toContain('system-sap-fi');
        expect(systemIds).toContain('system-navisworks');
        expect(systemIds).toContain('system-primavera-p6');
        expect(systemIds).toContain('system-salesforce');
        expect(systemIds).toContain('system-workday');
        expect(systemIds).toContain('system-vendor-compliance-db');
        expect(systemIds).toContain('system-esg-registry');
        expect(systemIds).toContain('system-amsterdam-authority-portal');
      });
    });
  });

  describe('setData', () => {
    describe('input validation', () => {
      it('throws an error when entity is empty', () => {
        expect(() => {
          setData('', []);
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is not a string', () => {
        expect(() => {
          setData(null, []);
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when data is not an array', () => {
        expect(() => {
          setData('personas', 'not an array');
        }).toThrow('DataManager: data must be an array');
      });

      it('throws an error when data is an object', () => {
        expect(() => {
          setData('personas', { id: 'test' });
        }).toThrow('DataManager: data must be an array');
      });

      it('throws an error when data is null', () => {
        expect(() => {
          setData('personas', null);
        }).toThrow('DataManager: data must be an array');
      });

      it('throws an error when data is a number', () => {
        expect(() => {
          setData('personas', 42);
        }).toThrow('DataManager: data must be an array');
      });
    });

    describe('successful operations', () => {
      it('replaces all records for an entity', () => {
        const newPersonas = [
          { id: 'persona-test', name: 'Test User', role: 'Tester' },
        ];

        const result = setData('personas', newPersonas);

        expect(result).toBe(true);

        const retrieved = getData('personas');
        expect(retrieved.length).toBe(1);
        expect(retrieved[0].id).toBe('persona-test');
        expect(retrieved[0].name).toBe('Test User');
      });

      it('can set an empty array', () => {
        const result = setData('personas', []);

        expect(result).toBe(true);

        const retrieved = getData('personas');
        expect(retrieved).toEqual([]);
      });

      it('persists data to localStorage', () => {
        const newData = [{ id: 'test-1', value: 'hello' }];
        setData('personas', newData);

        const storedData = JSON.parse(localStorage.getItem('dreeso_data_personas'));
        expect(storedData).toEqual(newData);
      });

      it('overwrites existing data completely', () => {
        // First set
        setData('personas', [{ id: 'first', name: 'First' }]);

        // Second set
        setData('personas', [{ id: 'second', name: 'Second' }]);

        const retrieved = getData('personas');
        expect(retrieved.length).toBe(1);
        expect(retrieved[0].id).toBe('second');
      });

      it('can set data for a custom entity key', () => {
        const customData = [{ id: 'custom-1', data: 'test' }];
        const result = setData('custom_entity', customData);

        expect(result).toBe(true);

        const retrieved = getData('custom_entity');
        expect(retrieved).toEqual(customData);
      });
    });
  });

  describe('updateData', () => {
    describe('input validation', () => {
      it('throws an error when entity is empty', () => {
        expect(() => {
          updateData('', 'id-1', { name: 'Updated' });
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is not a string', () => {
        expect(() => {
          updateData(null, 'id-1', { name: 'Updated' });
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when id is empty', () => {
        expect(() => {
          updateData('personas', '', { name: 'Updated' });
        }).toThrow('DataManager: id must be a non-empty string');
      });

      it('throws an error when id is not a string', () => {
        expect(() => {
          updateData('personas', null, { name: 'Updated' });
        }).toThrow('DataManager: id must be a non-empty string');
      });

      it('throws an error when id is only whitespace', () => {
        expect(() => {
          updateData('personas', '   ', { name: 'Updated' });
        }).toThrow('DataManager: id must be a non-empty string');
      });

      it('throws an error when update is not a plain object', () => {
        expect(() => {
          updateData('personas', 'persona-lukas', 'not an object');
        }).toThrow('DataManager: update must be a plain object');
      });

      it('throws an error when update is an array', () => {
        expect(() => {
          updateData('personas', 'persona-lukas', [1, 2, 3]);
        }).toThrow('DataManager: update must be a plain object');
      });

      it('throws an error when update is null', () => {
        expect(() => {
          updateData('personas', 'persona-lukas', null);
        }).toThrow('DataManager: update must be a plain object');
      });
    });

    describe('successful operations', () => {
      it('updates a record by id and returns the updated record', () => {
        // Ensure data is loaded
        getData('personas');

        const updated = updateData('personas', 'persona-lukas', { name: 'Lukas Updated' });

        expect(updated).not.toBeNull();
        expect(updated.id).toBe('persona-lukas');
        expect(updated.name).toBe('Lukas Updated');
        // Original fields should be preserved
        expect(updated.role).toBe('Project Director');
        expect(updated.avatarInitials).toBe('LM');
      });

      it('persists the update to localStorage', () => {
        getData('personas');

        updateData('personas', 'persona-elena', { role: 'Lead QS' });

        const retrieved = getData('personas');
        const elena = retrieved.find((p) => p.id === 'persona-elena');
        expect(elena.role).toBe('Lead QS');
      });

      it('does not affect other records in the entity', () => {
        getData('personas');

        updateData('personas', 'persona-lukas', { name: 'Updated Lukas' });

        const retrieved = getData('personas');
        const elena = retrieved.find((p) => p.id === 'persona-elena');
        expect(elena.name).toBe('Elena Rossi');

        const sophie = retrieved.find((p) => p.id === 'persona-sophie');
        expect(sophie.name).toBe('Sophie Dubois');
      });

      it('merges update fields into the existing record', () => {
        getData('personas');

        const updated = updateData('personas', 'persona-james', {
          name: 'James Updated',
          customField: 'new value',
        });

        expect(updated.name).toBe('James Updated');
        expect(updated.customField).toBe('new value');
        expect(updated.role).toBe('Sales Director');
        expect(updated.colorTheme).toBe('#e11900');
      });

      it('can update nested fields', () => {
        getData('personas');

        const updated = updateData('personas', 'persona-lukas', {
          permissions: ['view_all_projects', 'custom_permission'],
        });

        expect(updated.permissions).toEqual(['view_all_projects', 'custom_permission']);
      });
    });

    describe('record not found', () => {
      it('returns null when the record id does not exist', () => {
        getData('personas');

        const result = updateData('personas', 'persona-nonexistent', { name: 'Test' });

        expect(result).toBeNull();
      });

      it('does not modify the entity when record is not found', () => {
        const originalPersonas = getData('personas');
        const originalLength = originalPersonas.length;

        updateData('personas', 'persona-nonexistent', { name: 'Test' });

        const afterUpdate = getData('personas');
        expect(afterUpdate.length).toBe(originalLength);
      });
    });
  });

  describe('deleteData', () => {
    describe('input validation', () => {
      it('throws an error when entity is empty', () => {
        expect(() => {
          deleteData('', 'id-1');
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is not a string', () => {
        expect(() => {
          deleteData(null, 'id-1');
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when id is empty', () => {
        expect(() => {
          deleteData('personas', '');
        }).toThrow('DataManager: id must be a non-empty string');
      });

      it('throws an error when id is not a string', () => {
        expect(() => {
          deleteData('personas', null);
        }).toThrow('DataManager: id must be a non-empty string');
      });

      it('throws an error when id is only whitespace', () => {
        expect(() => {
          deleteData('personas', '   ');
        }).toThrow('DataManager: id must be a non-empty string');
      });
    });

    describe('successful operations', () => {
      it('deletes a record by id and returns true', () => {
        getData('personas');

        const result = deleteData('personas', 'persona-lukas');

        expect(result).toBe(true);
      });

      it('removes the record from the entity', () => {
        getData('personas');

        deleteData('personas', 'persona-lukas');

        const retrieved = getData('personas');
        const lukas = retrieved.find((p) => p.id === 'persona-lukas');
        expect(lukas).toBeUndefined();
      });

      it('reduces the record count by one', () => {
        const originalPersonas = getData('personas');
        const originalLength = originalPersonas.length;

        deleteData('personas', 'persona-lukas');

        const afterDelete = getData('personas');
        expect(afterDelete.length).toBe(originalLength - 1);
      });

      it('does not affect other records', () => {
        getData('personas');

        deleteData('personas', 'persona-lukas');

        const retrieved = getData('personas');
        const elena = retrieved.find((p) => p.id === 'persona-elena');
        expect(elena).toBeDefined();
        expect(elena.name).toBe('Elena Rossi');

        const sophie = retrieved.find((p) => p.id === 'persona-sophie');
        expect(sophie).toBeDefined();

        const james = retrieved.find((p) => p.id === 'persona-james');
        expect(james).toBeDefined();
      });

      it('persists the deletion to localStorage', () => {
        getData('personas');

        deleteData('personas', 'persona-elena');

        const storedData = JSON.parse(localStorage.getItem('dreeso_data_personas'));
        const elena = storedData.find((p) => p.id === 'persona-elena');
        expect(elena).toBeUndefined();
      });

      it('can delete multiple records sequentially', () => {
        getData('personas');

        deleteData('personas', 'persona-lukas');
        deleteData('personas', 'persona-elena');

        const retrieved = getData('personas');
        expect(retrieved.length).toBe(2);

        const ids = retrieved.map((p) => p.id);
        expect(ids).not.toContain('persona-lukas');
        expect(ids).not.toContain('persona-elena');
        expect(ids).toContain('persona-sophie');
        expect(ids).toContain('persona-james');
      });
    });

    describe('record not found', () => {
      it('returns false when the record id does not exist', () => {
        getData('personas');

        const result = deleteData('personas', 'persona-nonexistent');

        expect(result).toBe(false);
      });

      it('does not modify the entity when record is not found', () => {
        const originalPersonas = getData('personas');
        const originalLength = originalPersonas.length;

        deleteData('personas', 'persona-nonexistent');

        const afterDelete = getData('personas');
        expect(afterDelete.length).toBe(originalLength);
      });
    });
  });

  describe('resetData', () => {
    it('resets all data to default values', () => {
      // Modify some data
      getData('personas');
      setData('personas', [{ id: 'modified', name: 'Modified' }]);

      // Verify modification
      const modified = getData('personas');
      expect(modified.length).toBe(1);
      expect(modified[0].id).toBe('modified');

      // Reset
      const result = resetData();
      expect(result).toBe(true);

      // Verify reset
      const afterReset = getData('personas');
      expect(afterReset.length).toBe(4);

      const lukas = afterReset.find((p) => p.id === 'persona-lukas');
      expect(lukas).toBeDefined();
      expect(lukas.name).toBe('Lukas Müller');
    });

    it('restores all entities to their defaults', () => {
      // Modify multiple entities
      getData('personas');
      getData('systems');
      setData('personas', []);
      setData('systems', []);

      expect(getData('personas').length).toBe(0);
      expect(getData('systems').length).toBe(0);

      // Reset
      resetData();

      // Verify all entities are restored
      expect(getData('personas').length).toBe(4);
      expect(getData('systems').length).toBe(10);
      expect(getData('actions').length).toBeGreaterThan(0);
      expect(getData('clusters').length).toBeGreaterThan(0);
      expect(getData('queries').length).toBeGreaterThan(0);
      expect(getData('propagation').length).toBeGreaterThan(0);
      expect(getData('autosuggest').length).toBe(4);
      expect(getData('screenFlow').length).toBe(20);
      expect(getData('users').length).toBe(4);
    });

    it('returns true on successful reset', () => {
      getData('personas');

      const result = resetData();

      expect(result).toBe(true);
    });

    it('restores schema version after reset', () => {
      getData('personas');

      resetData();

      const storedVersion = JSON.parse(localStorage.getItem('dreeso_data_schema_version'));
      expect(storedVersion).toBe(getSchemaVersion());
    });

    it('restores deleted records after reset', () => {
      getData('personas');
      deleteData('personas', 'persona-lukas');
      deleteData('personas', 'persona-elena');

      const afterDelete = getData('personas');
      expect(afterDelete.length).toBe(2);

      resetData();

      const afterReset = getData('personas');
      expect(afterReset.length).toBe(4);

      const lukas = afterReset.find((p) => p.id === 'persona-lukas');
      expect(lukas).toBeDefined();

      const elena = afterReset.find((p) => p.id === 'persona-elena');
      expect(elena).toBeDefined();
    });

    it('restores updated records after reset', () => {
      getData('personas');
      updateData('personas', 'persona-lukas', { name: 'Modified Name' });

      const afterUpdate = getData('personas');
      const modified = afterUpdate.find((p) => p.id === 'persona-lukas');
      expect(modified.name).toBe('Modified Name');

      resetData();

      const afterReset = getData('personas');
      const restored = afterReset.find((p) => p.id === 'persona-lukas');
      expect(restored.name).toBe('Lukas Müller');
    });
  });

  describe('getEntityNames', () => {
    it('returns an array of entity name strings', () => {
      const names = getEntityNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it('includes all expected entity names', () => {
      const names = getEntityNames();

      expect(names).toContain('actions');
      expect(names).toContain('autosuggest');
      expect(names).toContain('clusters');
      expect(names).toContain('personas');
      expect(names).toContain('propagation');
      expect(names).toContain('queries');
      expect(names).toContain('screenFlow');
      expect(names).toContain('systems');
      expect(names).toContain('users');
    });

    it('returns exactly 9 entity names', () => {
      const names = getEntityNames();

      expect(names.length).toBe(9);
    });
  });

  describe('getDataById', () => {
    describe('input validation', () => {
      it('throws an error when entity is empty', () => {
        expect(() => {
          getDataById('', 'id-1');
        }).toThrow('DataManager: entity must be a non-empty string');
      });

      it('throws an error when entity is not a string', () => {
        expect(() => {
          getDataById(null, 'id-1');
        }).toThrow('DataManager: entity must be a non-empty string');
      });
    });

    describe('successful lookups', () => {
      it('returns a persona by id', () => {
        const persona = getDataById('personas', 'persona-lukas');

        expect(persona).not.toBeNull();
        expect(persona.id).toBe('persona-lukas');
        expect(persona.name).toBe('Lukas Müller');
        expect(persona.role).toBe('Project Director');
      });

      it('returns a system by id', () => {
        const system = getDataById('systems', 'system-procore');

        expect(system).not.toBeNull();
        expect(system.id).toBe('system-procore');
        expect(system.name).toBe('Procore');
        expect(system.shortName).toBe('Procore');
      });

      it('returns an action by id', () => {
        const action = getDataById('actions', 'action-escalate-risk');

        expect(action).not.toBeNull();
        expect(action.id).toBe('action-escalate-risk');
        expect(action.label).toBe('Escalate Risk');
        expect(action.type).toBe('escalate');
      });

      it('returns a user by id', () => {
        const user = getDataById('users', 'user-001');

        expect(user).not.toBeNull();
        expect(user.id).toBe('user-001');
        expect(user.email).toBe('lukas.muller@dreeso.com');
      });

      it('returns a cluster by id', () => {
        const cluster = getDataById('clusters', 'cluster-strategic-oversight');

        expect(cluster).not.toBeNull();
        expect(cluster.id).toBe('cluster-strategic-oversight');
        expect(cluster.personaId).toBe('persona-lukas');
        expect(cluster.label).toBe('Strategic Oversight');
      });

      it('returns each persona by id', () => {
        const lukas = getDataById('personas', 'persona-lukas');
        const elena = getDataById('personas', 'persona-elena');
        const sophie = getDataById('personas', 'persona-sophie');
        const james = getDataById('personas', 'persona-james');

        expect(lukas).not.toBeNull();
        expect(elena).not.toBeNull();
        expect(sophie).not.toBeNull();
        expect(james).not.toBeNull();

        expect(lukas.name).toBe('Lukas Müller');
        expect(elena.name).toBe('Elena Rossi');
        expect(sophie.name).toBe('Sophie Dubois');
        expect(james.name).toBe('James Carter');
      });
    });

    describe('record not found', () => {
      it('returns null for a non-existent id', () => {
        const result = getDataById('personas', 'persona-nonexistent');

        expect(result).toBeNull();
      });

      it('returns null for an empty id', () => {
        const result = getDataById('personas', '');

        expect(result).toBeNull();
      });

      it('returns null for a non-string id', () => {
        const result = getDataById('personas', null);

        expect(result).toBeNull();
      });

      it('returns null for undefined id', () => {
        const result = getDataById('personas', undefined);

        expect(result).toBeNull();
      });
    });
  });

  describe('getSchemaVersion', () => {
    it('returns a non-empty string', () => {
      const version = getSchemaVersion();

      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('returns a semver-like version string', () => {
      const version = getSchemaVersion();

      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('returns 1.0.0 as the current version', () => {
      const version = getSchemaVersion();

      expect(version).toBe('1.0.0');
    });
  });

  describe('localStorage interaction', () => {
    it('initializes all entities on first getData call', () => {
      // Before any call, localStorage should be empty
      expect(localStorage.length).toBe(0);

      // First call triggers initialization
      getData('personas');

      // After initialization, localStorage should have all entities + schema version
      expect(localStorage.length).toBeGreaterThan(1);
    });

    it('does not re-initialize when schema version matches', () => {
      // First initialization
      getData('personas');

      // Modify data
      setData('personas', [{ id: 'modified', name: 'Modified' }]);

      // Access again — should NOT re-initialize since schema version matches
      const retrieved = getData('personas');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('modified');
    });

    it('stores data with the correct key prefix', () => {
      getData('personas');

      const key = 'dreeso_data_personas';
      const storedData = localStorage.getItem(key);
      expect(storedData).not.toBeNull();
    });

    it('stores schema version with the correct key', () => {
      getData('personas');

      const key = 'dreeso_data_schema_version';
      const storedVersion = localStorage.getItem(key);
      expect(storedVersion).not.toBeNull();
    });
  });

  describe('data integrity across operations', () => {
    it('maintains data integrity after set, update, and delete operations', () => {
      // Load initial data
      const initialPersonas = getData('personas');
      expect(initialPersonas.length).toBe(4);

      // Add a new record via setData (replace all)
      const newPersonas = [
        ...initialPersonas,
        { id: 'persona-new', name: 'New Persona', role: 'Tester' },
      ];
      setData('personas', newPersonas);
      expect(getData('personas').length).toBe(5);

      // Update the new record
      const updated = updateData('personas', 'persona-new', { role: 'Senior Tester' });
      expect(updated.role).toBe('Senior Tester');

      // Delete the new record
      const deleted = deleteData('personas', 'persona-new');
      expect(deleted).toBe(true);
      expect(getData('personas').length).toBe(4);

      // Original records should still be intact
      const lukas = getDataById('personas', 'persona-lukas');
      expect(lukas).not.toBeNull();
      expect(lukas.name).toBe('Lukas Müller');
    });

    it('handles rapid sequential operations correctly', () => {
      getData('personas');

      // Rapid updates
      updateData('personas', 'persona-lukas', { name: 'Update 1' });
      updateData('personas', 'persona-lukas', { name: 'Update 2' });
      updateData('personas', 'persona-lukas', { name: 'Update 3' });

      const lukas = getDataById('personas', 'persona-lukas');
      expect(lukas.name).toBe('Update 3');
    });

    it('handles delete followed by getData correctly', () => {
      getData('users');

      deleteData('users', 'user-001');
      deleteData('users', 'user-002');

      const users = getData('users');
      expect(users.length).toBe(2);

      const user001 = users.find((u) => u.id === 'user-001');
      expect(user001).toBeUndefined();

      const user002 = users.find((u) => u.id === 'user-002');
      expect(user002).toBeUndefined();
    });
  });

  describe('cross-entity operations', () => {
    it('operations on one entity do not affect another entity', () => {
      getData('personas');
      getData('systems');

      setData('personas', []);

      const personas = getData('personas');
      expect(personas.length).toBe(0);

      const systems = getData('systems');
      expect(systems.length).toBe(10);
    });

    it('reset restores all entities independently', () => {
      getData('personas');
      getData('systems');
      getData('actions');

      setData('personas', []);
      setData('systems', []);
      deleteData('actions', 'action-escalate-risk');

      resetData();

      expect(getData('personas').length).toBe(4);
      expect(getData('systems').length).toBe(10);

      const escalateRisk = getDataById('actions', 'action-escalate-risk');
      expect(escalateRisk).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles setting data with complex nested objects', () => {
      const complexData = [
        {
          id: 'complex-1',
          nested: {
            level1: {
              level2: {
                value: 'deep',
              },
            },
          },
          array: [1, 2, [3, 4]],
        },
      ];

      setData('custom_complex', complexData);

      const retrieved = getData('custom_complex');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].nested.level1.level2.value).toBe('deep');
      expect(retrieved[0].array).toEqual([1, 2, [3, 4]]);
    });

    it('handles setting data with special characters in values', () => {
      const specialData = [
        {
          id: 'special-1',
          name: 'Lukas Müller — Project Director',
          description: 'Contains "quotes" and \'apostrophes\' and <html> tags',
          unicode: '日本語テスト',
        },
      ];

      setData('custom_special', specialData);

      const retrieved = getData('custom_special');
      expect(retrieved[0].name).toBe('Lukas Müller — Project Director');
      expect(retrieved[0].unicode).toBe('日本語テスト');
    });

    it('handles updating a record with an empty object (no-op merge)', () => {
      getData('personas');

      const original = getDataById('personas', 'persona-lukas');
      const updated = updateData('personas', 'persona-lukas', {});

      expect(updated).not.toBeNull();
      expect(updated.name).toBe(original.name);
      expect(updated.role).toBe(original.role);
    });

    it('handles getData for the same entity multiple times', () => {
      const first = getData('personas');
      const second = getData('personas');
      const third = getData('personas');

      expect(first.length).toBe(second.length);
      expect(second.length).toBe(third.length);
    });
  });
});