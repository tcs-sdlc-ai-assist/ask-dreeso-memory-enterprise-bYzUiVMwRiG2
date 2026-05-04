/**
 * PersonaContext — React Context provider for persona state.
 * Provides getCurrentPersona, setPersona, personaList, and persona-specific
 * data loading. Reads persona definitions from mock data. Resets data scope
 * on persona switch. Consumed by all persona-aware components.
 *
 * @module PersonaContext
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getData, getDataById } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';
import { getItem, setItem } from '@/utils/storage';
import { PERSONA_KEY, PERSONA_LIST, PERSONA_IDS } from '@/utils/constants';

/**
 * @typedef {object} PersonaData
 * @property {string} id - The persona ID.
 * @property {string} name - The persona display name.
 * @property {string} role - The persona role title.
 * @property {string} avatarInitials - The persona avatar initials.
 * @property {string} colorTheme - The persona color theme hex string.
 * @property {string[]} permissions - Array of permission strings.
 * @property {string[]} clusterIds - Array of cluster IDs associated with the persona.
 */

/**
 * @typedef {object} PersonaContextValue
 * @property {string|null} currentPersonaId - The current persona ID, or null if none selected.
 * @property {PersonaData|null} currentPersona - The full persona object, or null if none selected.
 * @property {PersonaData[]} personaList - Array of all available persona objects.
 * @property {function} setPersona - Set the current persona by ID.
 * @property {function} getCurrentPersona - Get the current persona object.
 * @property {function} getPersonaById - Get a persona object by its ID.
 * @property {function} getPersonaClusters - Get clusters for the current persona.
 * @property {function} getPersonaPermissions - Get permissions for the current persona.
 * @property {function} hasPermission - Check if the current persona has a specific permission.
 * @property {boolean} loading - Whether the persona state is being initialized.
 */

const PersonaContext = createContext(null);

/**
 * Load the persisted persona ID from localStorage.
 * @returns {string|null} The stored persona ID, or null if not found or invalid.
 */
function loadPersistedPersona() {
  const personaId = getItem(PERSONA_KEY, null);
  if (personaId && typeof personaId === 'string' && PERSONA_LIST.includes(personaId)) {
    return personaId;
  }
  return null;
}

/**
 * Persist the persona ID to localStorage.
 * @param {string|null} personaId - The persona ID to persist, or null to clear.
 */
function persistPersona(personaId) {
  if (personaId) {
    setItem(PERSONA_KEY, personaId);
  }
}

/**
 * PersonaProvider component. Wraps children with PersonaContext.Provider.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child components.
 * @returns {import('react').ReactElement} The provider element.
 */
export function PersonaProvider({ children }) {
  const [currentPersonaId, setCurrentPersonaId] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * All available persona objects loaded from mock data.
   * @type {PersonaData[]}
   */
  const personaList = useMemo(() => {
    return getData('personas');
  }, []);

  /**
   * The full persona object for the currently selected persona.
   * @type {PersonaData|null}
   */
  const currentPersona = useMemo(() => {
    if (!currentPersonaId) {
      return null;
    }
    const persona = personaList.find((p) => p.id === currentPersonaId);
    return persona || null;
  }, [currentPersonaId, personaList]);

  // Initialize persona from localStorage on mount
  useEffect(() => {
    const storedPersonaId = loadPersistedPersona();
    if (storedPersonaId) {
      setCurrentPersonaId(storedPersonaId);
    }
    setLoading(false);
  }, []);

  /**
   * Set the current persona by ID. Persists to localStorage and logs the switch.
   *
   * @param {string} personaId - The persona ID to set as current.
   * @throws {Error} If personaId is not a valid persona ID.
   */
  const setPersona = useCallback((personaId) => {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      throw new Error('PersonaContext: personaId must be a non-empty string');
    }

    if (!PERSONA_LIST.includes(personaId)) {
      throw new Error(`PersonaContext: invalid persona ID "${personaId}"`);
    }

    const previousPersonaId = currentPersonaId;

    setCurrentPersonaId(personaId);
    persistPersona(personaId);

    // Log the persona switch
    auditLog('PERSONA_SWITCH', null, personaId, `Persona switched to: ${personaId}`, {
      previousPersonaId: previousPersonaId || null,
      newPersonaId: personaId,
    });
  }, [currentPersonaId]);

  /**
   * Get the current persona object.
   *
   * @returns {PersonaData|null} The current persona object, or null if none selected.
   */
  const getCurrentPersona = useCallback(() => {
    return currentPersona;
  }, [currentPersona]);

  /**
   * Get a persona object by its ID.
   *
   * @param {string} personaId - The persona ID to look up.
   * @returns {PersonaData|null} The persona object, or null if not found.
   */
  const getPersonaById = useCallback((personaId) => {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      return null;
    }

    return getDataById('personas', personaId);
  }, []);

  /**
   * Get clusters associated with the current persona.
   *
   * @returns {object[]} Array of cluster objects for the current persona.
   */
  const getPersonaClusters = useCallback(() => {
    if (!currentPersonaId) {
      return [];
    }

    const clusters = getData('clusters');
    return clusters
      .filter((c) => c.personaId === currentPersonaId)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [currentPersonaId]);

  /**
   * Get permissions for the current persona.
   *
   * @returns {string[]} Array of permission strings for the current persona.
   */
  const getPersonaPermissions = useCallback(() => {
    if (!currentPersona) {
      return [];
    }

    return Array.isArray(currentPersona.permissions) ? currentPersona.permissions : [];
  }, [currentPersona]);

  /**
   * Check if the current persona has a specific permission.
   *
   * @param {string} permission - The permission string to check.
   * @returns {boolean} True if the current persona has the permission.
   */
  const hasPermission = useCallback((permission) => {
    if (typeof permission !== 'string' || permission.trim() === '') {
      return false;
    }

    if (!currentPersona || !Array.isArray(currentPersona.permissions)) {
      return false;
    }

    return currentPersona.permissions.includes(permission);
  }, [currentPersona]);

  const value = useMemo(() => ({
    currentPersonaId,
    currentPersona,
    personaList,
    setPersona,
    getCurrentPersona,
    getPersonaById,
    getPersonaClusters,
    getPersonaPermissions,
    hasPermission,
    loading,
  }), [
    currentPersonaId,
    currentPersona,
    personaList,
    setPersona,
    getCurrentPersona,
    getPersonaById,
    getPersonaClusters,
    getPersonaPermissions,
    hasPermission,
    loading,
  ]);

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

PersonaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the PersonaContext.
 * Throws if used outside of a PersonaProvider.
 *
 * @returns {PersonaContextValue} The persona context value.
 */
export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === null) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}

export default PersonaContext;