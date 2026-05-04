/**
 * useQueryEngine — Custom React hook wrapping QueryEngine service.
 * Provides submitQuery, suggestions, isLoading, response, and error state.
 * Handles simulated latency with setTimeout, manages loading states,
 * and integrates with PersonaContext for persona-scoped queries.
 *
 * @module useQueryEngine
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { processQuery, autosuggest } from '@/services/queryEngine';
import { generateCTAs } from '@/services/ctaFactory';
import { ANIMATION_DURATION } from '@/utils/constants';

/**
 * @typedef {object} QueryEngineState
 * @property {object|null} response - The structured query response object, or null if no query has been submitted.
 * @property {boolean} isLoading - Whether a query is currently being processed.
 * @property {string|null} error - The error message if the last query failed, or null.
 * @property {object[]} suggestions - Array of autosuggest suggestion objects.
 * @property {boolean} isSuggestLoading - Whether suggestions are currently being loaded.
 * @property {object[]} ctaBubbles - Array of CTA bubble objects generated from the last response.
 * @property {string} queryText - The current query text.
 */

/**
 * @typedef {object} QueryEngineReturn
 * @property {object|null} response - The structured query response object.
 * @property {boolean} isLoading - Whether a query is currently being processed.
 * @property {string|null} error - The error message if the last query failed.
 * @property {object[]} suggestions - Array of autosuggest suggestion objects.
 * @property {boolean} isSuggestLoading - Whether suggestions are currently being loaded.
 * @property {object[]} ctaBubbles - Array of CTA bubble objects from the last response.
 * @property {string} queryText - The current query text.
 * @property {function} submitQuery - Submit a query for processing.
 * @property {function} updateSuggestions - Update autosuggest results for partial input.
 * @property {function} clearResponse - Clear the current response and error state.
 * @property {function} clearSuggestions - Clear the current suggestions.
 * @property {function} setQueryText - Set the current query text without submitting.
 */

/**
 * Default simulated latency range for query processing (ms).
 * @type {{ min: number, max: number }}
 */
const SIMULATED_LATENCY = {
  min: 400,
  max: 1200,
};

/**
 * Default simulated latency for autosuggest (ms).
 * @type {number}
 */
const SUGGEST_LATENCY = 150;

/**
 * Generate a random latency value within the simulated range.
 * @returns {number} A random latency in milliseconds.
 */
function getRandomLatency() {
  return Math.floor(Math.random() * (SIMULATED_LATENCY.max - SIMULATED_LATENCY.min)) + SIMULATED_LATENCY.min;
}

/**
 * Custom React hook wrapping the QueryEngine service.
 * Provides submitQuery, suggestions, isLoading, response, and error state.
 * Handles simulated latency with setTimeout, manages loading states,
 * and integrates with PersonaContext for persona-scoped queries.
 *
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.personaId] - Override persona ID (defaults to current persona from context).
 * @param {boolean} [options.simulateLatency=true] - Whether to simulate network latency.
 * @param {number} [options.maxSuggestions=6] - Maximum number of autosuggest results.
 * @returns {QueryEngineReturn} The query engine hook state and methods.
 */
export function useQueryEngine(options = {}) {
  const {
    personaId: overridePersonaId = null,
    simulateLatency = true,
    maxSuggestions = 6,
  } = options;

  const { currentPersonaId } = usePersona();
  const resolvedPersonaId = overridePersonaId || currentPersonaId;

  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [ctaBubbles, setCtaBubbles] = useState([]);
  const [queryText, setQueryText] = useState('');

  const queryTimerRef = useRef(null);
  const suggestTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Track mounted state for safe async updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (queryTimerRef.current !== null) {
        clearTimeout(queryTimerRef.current);
        queryTimerRef.current = null;
      }
      if (suggestTimerRef.current !== null) {
        clearTimeout(suggestTimerRef.current);
        suggestTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Submit a query for processing against the QueryEngine.
   * Simulates network latency and manages loading/error states.
   *
   * @param {string} text - The query text to submit.
   * @returns {Promise<object|null>} The query response object, or null on error.
   */
  const submitQuery = useCallback((text) => {
    if (typeof text !== 'string' || text.trim() === '') {
      setError('Please enter a query');
      return Promise.resolve(null);
    }

    if (!resolvedPersonaId) {
      setError('No persona selected. Please select a persona first.');
      return Promise.resolve(null);
    }

    // Cancel any pending query timer
    if (queryTimerRef.current !== null) {
      clearTimeout(queryTimerRef.current);
      queryTimerRef.current = null;
    }

    const trimmedText = text.trim();
    setQueryText(trimmedText);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setCtaBubbles([]);

    return new Promise((resolve) => {
      const latency = simulateLatency ? getRandomLatency() : 0;

      queryTimerRef.current = setTimeout(() => {
        queryTimerRef.current = null;

        if (!mountedRef.current) {
          resolve(null);
          return;
        }

        try {
          const queryResponse = processQuery(trimmedText, resolvedPersonaId);

          if (!mountedRef.current) {
            resolve(null);
            return;
          }

          setResponse(queryResponse);
          setIsLoading(false);
          setError(null);

          // Generate CTA bubbles from the response
          try {
            const ctas = generateCTAs(queryResponse, resolvedPersonaId);
            if (mountedRef.current) {
              setCtaBubbles(ctas);
            }
          } catch (_ctaError) {
            // CTA generation failure is non-critical; use response ctaBubbles as fallback
            if (mountedRef.current && queryResponse && Array.isArray(queryResponse.ctaBubbles)) {
              setCtaBubbles(
                queryResponse.ctaBubbles.map((text, index) => ({
                  text,
                  icon: 'message-circle',
                  category: 'management',
                  priority: index + 1,
                }))
              );
            }
          }

          resolve(queryResponse);
        } catch (err) {
          if (!mountedRef.current) {
            resolve(null);
            return;
          }

          const errorMessage = err && err.message ? err.message : 'An error occurred while processing your query';
          setError(errorMessage);
          setIsLoading(false);
          setResponse(null);
          setCtaBubbles([]);
          resolve(null);
        }
      }, latency);
    });
  }, [resolvedPersonaId, simulateLatency]);

  /**
   * Update autosuggest results for partial input text.
   * Simulates a short latency for realistic UX.
   *
   * @param {string} partialText - The partial text input from the user.
   */
  const updateSuggestions = useCallback((partialText) => {
    if (!resolvedPersonaId) {
      setSuggestions([]);
      return;
    }

    // Cancel any pending suggest timer
    if (suggestTimerRef.current !== null) {
      clearTimeout(suggestTimerRef.current);
      suggestTimerRef.current = null;
    }

    if (typeof partialText !== 'string' || partialText.trim() === '') {
      setIsSuggestLoading(true);

      suggestTimerRef.current = setTimeout(() => {
        suggestTimerRef.current = null;

        if (!mountedRef.current) {
          return;
        }

        try {
          const results = autosuggest('', resolvedPersonaId, maxSuggestions);
          if (mountedRef.current) {
            setSuggestions(results);
            setIsSuggestLoading(false);
          }
        } catch (_err) {
          if (mountedRef.current) {
            setSuggestions([]);
            setIsSuggestLoading(false);
          }
        }
      }, SUGGEST_LATENCY);

      return;
    }

    setIsSuggestLoading(true);

    suggestTimerRef.current = setTimeout(() => {
      suggestTimerRef.current = null;

      if (!mountedRef.current) {
        return;
      }

      try {
        const results = autosuggest(partialText.trim(), resolvedPersonaId, maxSuggestions);
        if (mountedRef.current) {
          setSuggestions(results);
          setIsSuggestLoading(false);
        }
      } catch (_err) {
        if (mountedRef.current) {
          setSuggestions([]);
          setIsSuggestLoading(false);
        }
      }
    }, SUGGEST_LATENCY);
  }, [resolvedPersonaId, maxSuggestions]);

  /**
   * Clear the current response, error, and CTA bubbles.
   */
  const clearResponse = useCallback(() => {
    // Cancel any pending query timer
    if (queryTimerRef.current !== null) {
      clearTimeout(queryTimerRef.current);
      queryTimerRef.current = null;
    }

    setResponse(null);
    setError(null);
    setCtaBubbles([]);
    setIsLoading(false);
  }, []);

  /**
   * Clear the current suggestions.
   */
  const clearSuggestions = useCallback(() => {
    // Cancel any pending suggest timer
    if (suggestTimerRef.current !== null) {
      clearTimeout(suggestTimerRef.current);
      suggestTimerRef.current = null;
    }

    setSuggestions([]);
    setIsSuggestLoading(false);
  }, []);

  // Clear state when persona changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    setCtaBubbles([]);
    setSuggestions([]);
    setIsLoading(false);
    setIsSuggestLoading(false);
    setQueryText('');

    if (queryTimerRef.current !== null) {
      clearTimeout(queryTimerRef.current);
      queryTimerRef.current = null;
    }
    if (suggestTimerRef.current !== null) {
      clearTimeout(suggestTimerRef.current);
      suggestTimerRef.current = null;
    }
  }, [resolvedPersonaId]);

  return {
    response,
    isLoading,
    error,
    suggestions,
    isSuggestLoading,
    ctaBubbles,
    queryText,
    submitQuery,
    updateSuggestions,
    clearResponse,
    clearSuggestions,
    setQueryText,
  };
}

export default useQueryEngine;