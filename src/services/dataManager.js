/**
 * DataManager module for Ask Dreeso Memory.
 * Implements CRUD operations for all mock/static JSON data entities.
 * Loads initial data from /src/data/ into localStorage on first use.
 * All operations are scoped by entity key and persisted via localStorage.
 *
 * @module DataManager
 */

import { getItem, setItem, removeItem, getKeys } from '@/utils/storage';
import { DATA_PREFIX } from '@/utils/constants';

import actionsData from '@/data/actions.json';
import autosuggestData from '@/data/autosuggest.json';
import clustersData from '@/data/clusters.json';
import personasData from '@/data/personas.json';
import propagationData from '@/data/propagation.json';
import queriesData from '@/data/queries.json';
import screenFlowData from '@/data/screenFlow.json';
import systemsData from '@/data/systems.json';
import usersData from '@/data/users.json';

/**
 * Registry of all available data entities and their default data.
 * @type {Record<string, any[]>}
 */
const DEFAULT_DATA = {
  actions: actionsData,
  autosuggest: autosuggestData,
  clusters: clustersData,
  personas: personasData,
  propagation: propagationData,
  queries: queriesData,
  screenFlow: screenFlowData,
  systems: systemsData,
  users: usersData,
};

/**
 * Schema version for data migration detection.
 * Increment this when the data schema changes.
 * @type {string}
 */
const SCHEMA_VERSION = '1.0.0';

/**
 * localStorage key for the schema version.
 * @type {string}
 */
const SCHEMA_VERSION_KEY = `${DATA_PREFIX}schema_version`;

/**
 * Build the full localStorage key for a given entity.
 * @param {string} entity - The entity name.
 * @returns {string} The namespaced localStorage key.
 */
function buildKey(entity) {
  return `${DATA_PREFIX}${entity}`;
}

/**
 * Check whether initial data has been loaded into localStorage.
 * @returns {boolean} True if data has been initialized.
 */
function isInitialized() {
  const version = getItem(SCHEMA_VERSION_KEY, null);
  return version === SCHEMA_VERSION;
}

/**
 * Load all default data entities into localStorage.
 * Called on first use or after a schema version change.
 */
function initializeData() {
  const entityNames = Object.keys(DEFAULT_DATA);
  for (let i = 0; i < entityNames.length; i++) {
    const entity = entityNames[i];
    const key = buildKey(entity);
    setItem(key, DEFAULT_DATA[entity]);
  }
  setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
}

/**
 * Ensure data is initialized in localStorage.
 * If not yet initialized or schema version has changed, load defaults.
 */
function ensureInitialized() {
  if (!isInitialized()) {
    initializeData();
  }
}

/**
 * Validate that the given entity name is a known entity.
 * @param {string} entity - The entity name to validate.
 * @throws {Error} If the entity is not recognized.
 */
function validateEntity(entity) {
  if (typeof entity !== 'string' || entity.trim() === '') {
    throw new Error(`DataManager: entity must be a non-empty string, received: ${entity}`);
  }
}

/**
 * Retrieve all records for a given entity.
 * Initializes data from defaults if not yet loaded.
 *
 * @param {string} entity - The entity name (e.g., 'actions', 'personas', 'queries').
 * @returns {any[]} An array of entity records. Returns an empty array if entity has no data.
 */
export function getData(entity) {
  validateEntity(entity);
  ensureInitialized();

  const key = buildKey(entity);
  const data = getItem(key, null);

  if (data === null) {
    // Entity exists in defaults but not yet in localStorage
    if (DEFAULT_DATA[entity]) {
      setItem(key, DEFAULT_DATA[entity]);
      return [...DEFAULT_DATA[entity]];
    }
    return [];
  }

  return data;
}

/**
 * Replace all records for a given entity.
 *
 * @param {string} entity - The entity name.
 * @param {any[]} data - The new array of records to store.
 * @returns {boolean} True if the operation succeeded.
 */
export function setData(entity, data) {
  validateEntity(entity);
  ensureInitialized();

  if (!Array.isArray(data)) {
    throw new Error(`DataManager: data must be an array for entity "${entity}"`);
  }

  const key = buildKey(entity);
  return setItem(key, data);
}

/**
 * Update a single record within an entity by its id.
 * Merges the update object into the existing record.
 *
 * @param {string} entity - The entity name.
 * @param {string} id - The unique identifier of the record to update.
 * @param {object} update - An object containing the fields to update.
 * @returns {object|null} The updated record, or null if not found.
 */
export function updateData(entity, id, update) {
  validateEntity(entity);
  ensureInitialized();

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error(`DataManager: id must be a non-empty string, received: ${id}`);
  }

  if (typeof update !== 'object' || update === null || Array.isArray(update)) {
    throw new Error(`DataManager: update must be a plain object for entity "${entity}"`);
  }

  const records = getData(entity);
  let updatedRecord = null;

  const updatedRecords = records.map((record) => {
    if (record.id === id) {
      updatedRecord = { ...record, ...update };
      return updatedRecord;
    }
    return record;
  });

  if (updatedRecord !== null) {
    const key = buildKey(entity);
    setItem(key, updatedRecords);
  }

  return updatedRecord;
}

/**
 * Delete a single record from an entity by its id.
 *
 * @param {string} entity - The entity name.
 * @param {string} id - The unique identifier of the record to delete.
 * @returns {boolean} True if a record was found and deleted, false otherwise.
 */
export function deleteData(entity, id) {
  validateEntity(entity);
  ensureInitialized();

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error(`DataManager: id must be a non-empty string, received: ${id}`);
  }

  const records = getData(entity);
  const originalLength = records.length;
  const filteredRecords = records.filter((record) => record.id !== id);

  if (filteredRecords.length < originalLength) {
    const key = buildKey(entity);
    setItem(key, filteredRecords);
    return true;
  }

  return false;
}

/**
 * Reset all data entities to their default values from /src/data/.
 * Clears all entity keys from localStorage and re-initializes.
 *
 * @returns {boolean} True if the reset succeeded.
 */
export function resetData() {
  try {
    const keys = getKeys(DATA_PREFIX);
    for (let i = 0; i < keys.length; i++) {
      removeItem(keys[i]);
    }
    initializeData();
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get a list of all available entity names.
 *
 * @returns {string[]} Array of entity name strings.
 */
export function getEntityNames() {
  return Object.keys(DEFAULT_DATA);
}

/**
 * Get a single record by entity and id.
 *
 * @param {string} entity - The entity name.
 * @param {string} id - The unique identifier of the record.
 * @returns {object|null} The matching record, or null if not found.
 */
export function getDataById(entity, id) {
  validateEntity(entity);
  ensureInitialized();

  const records = getData(entity);
  const record = records.find((r) => r.id === id);
  return record || null;
}

/**
 * Get the current schema version.
 *
 * @returns {string} The current schema version string.
 */
export function getSchemaVersion() {
  return SCHEMA_VERSION;
}