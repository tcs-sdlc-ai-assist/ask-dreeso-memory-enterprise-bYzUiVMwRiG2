/**
 * QueryEngine service for Ask Dreeso Memory.
 * Implements processQuery and autosuggest functions for persona-scoped
 * query processing against mock/static JSON data.
 *
 * @module QueryEngine
 */

import { getData } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';

/**
 * Normalize a string for comparison by lowercasing and trimming.
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string.
 */
function normalize(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim();
}

/**
 * Tokenize a string into individual words for keyword matching.
 * Strips common punctuation and filters out empty tokens.
 * @param {string} str - The string to tokenize.
 * @returns {string[]} Array of lowercase word tokens.
 */
function tokenize(str) {
  return normalize(str)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Common stop words to exclude from keyword matching.
 * @type {Set<string>}
 */
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'in', 'on', 'of', 'and', 'or', 'to', 'a', 'an',
  'for', 'it', 'me', 'my', 'we', 'do', 'be', 'am', 'are', 'was', 'were',
  'show', 'what', 'how', 'can', 'all', 'this', 'that', 'with', 'from',
  'by', 'as', 'has', 'have', 'had', 'not', 'but', 'if', 'so', 'no',
  'up', 'out', 'its', 'our', 'any',
]);

/**
 * Filter out stop words from a token array.
 * @param {string[]} tokens - Array of word tokens.
 * @returns {string[]} Filtered tokens without stop words.
 */
function removeStopWords(tokens) {
  return tokens.filter((token) => !STOP_WORDS.has(token));
}

/**
 * Calculate a simple similarity score between two strings using keyword overlap.
 * Returns a value between 0 and 1.
 * @param {string} queryText - The query string.
 * @param {string} targetText - The target string to compare against.
 * @returns {number} Similarity score between 0 and 1.
 */
function calculateSimilarity(queryText, targetText) {
  const queryTokens = removeStopWords(tokenize(queryText));
  const targetTokens = removeStopWords(tokenize(targetText));

  if (queryTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  const targetSet = new Set(targetTokens);
  let matchCount = 0;

  for (let i = 0; i < queryTokens.length; i++) {
    if (targetSet.has(queryTokens[i])) {
      matchCount++;
      continue;
    }
    // Fuzzy match: check if any target token starts with or contains the query token
    for (const targetToken of targetSet) {
      if (targetToken.includes(queryTokens[i]) || queryTokens[i].includes(targetToken)) {
        matchCount += 0.7;
        break;
      }
    }
  }

  return matchCount / queryTokens.length;
}

/**
 * Calculate a fuzzy match score between two strings using character-level comparison.
 * Implements a simplified Levenshtein-based approach for short strings.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} Score between 0 and 1 where 1 is an exact match.
 */
function fuzzyScore(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 1;
  if (normA.length === 0 || normB.length === 0) return 0;

  // Check if one contains the other
  if (normB.includes(normA)) return 0.9;
  if (normA.includes(normB)) return 0.8;

  // Token-based similarity
  return calculateSimilarity(a, b);
}

/**
 * Find the best matching query from the queries dataset for a given query text and persona.
 * @param {string} queryText - The user's query text.
 * @param {string} personaId - The persona ID to scope the search.
 * @returns {{ query: object|null, score: number }} The best matching query object and its score.
 */
function findBestMatch(queryText, personaId) {
  const queries = getData('queries');

  // Filter queries for the given persona
  const personaQueries = queries.filter((q) => q.personaId === personaId);

  if (personaQueries.length === 0) {
    return { query: null, score: 0 };
  }

  let bestMatch = null;
  let bestScore = 0;

  for (let i = 0; i < personaQueries.length; i++) {
    const q = personaQueries[i];
    const score = fuzzyScore(queryText, q.queryText);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = q;
    }
  }

  return { query: bestMatch, score: bestScore };
}

/**
 * Build a default response when no matching query is found.
 * @param {string} queryText - The original query text.
 * @param {string} personaId - The persona ID.
 * @returns {object} A structured response object with default content.
 */
function buildDefaultResponse(queryText, personaId) {
  const clusters = getData('clusters');
  const personaClusters = clusters.filter((c) => c.personaId === personaId);

  const ctaBubbles = personaClusters
    .slice(0, 4)
    .map((c) => c.queryTemplate);

  return {
    title: 'No Exact Match Found',
    summary: `I couldn't find an exact match for "${queryText}". Here are some suggested queries you can try based on your role.`,
    dataTables: [],
    chartsData: [],
    sourceSystems: [],
    ctaBubbles,
    matchScore: 0,
    queryText,
    personaId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a structured response from a matched query record.
 * @param {object} matchedQuery - The matched query record from the dataset.
 * @param {string} queryText - The original query text.
 * @param {number} matchScore - The similarity score of the match.
 * @returns {object} A structured response object.
 */
function buildResponse(matchedQuery, queryText, matchScore) {
  const response = matchedQuery.response;

  return {
    title: response.title || '',
    summary: response.summary || '',
    dataTables: response.dataTables || [],
    chartsData: response.chartsData || [],
    sourceSystems: response.sourceSystems || [],
    ctaBubbles: response.ctaBubbles || [],
    matchScore,
    queryId: matchedQuery.queryId,
    clusterId: matchedQuery.clusterId,
    queryText,
    personaId: matchedQuery.personaId,
    actionable: matchedQuery.actionable || false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process a query for a given persona. Matches the query text against
 * the mock query dataset using keyword matching and fuzzy search.
 * Returns a structured response object and logs the query via AuditLogger.
 *
 * @param {string} queryText - The user's query text.
 * @param {string} personaId - The persona ID to scope the query.
 * @returns {object} A structured response object containing title, summary,
 *   dataTables, chartsData, sourceSystems, ctaBubbles, matchScore, and metadata.
 * @throws {Error} If queryText is not a non-empty string.
 * @throws {Error} If personaId is not a non-empty string.
 */
export function processQuery(queryText, personaId) {
  if (typeof queryText !== 'string' || queryText.trim() === '') {
    throw new Error('QueryEngine: queryText must be a non-empty string');
  }

  if (typeof personaId !== 'string' || personaId.trim() === '') {
    throw new Error('QueryEngine: personaId must be a non-empty string');
  }

  const trimmedQuery = queryText.trim();
  const { query: bestMatch, score } = findBestMatch(trimmedQuery, personaId);

  // Threshold for accepting a match
  const MATCH_THRESHOLD = 0.3;

  let response;

  if (bestMatch && score >= MATCH_THRESHOLD) {
    response = buildResponse(bestMatch, trimmedQuery, score);
  } else {
    response = buildDefaultResponse(trimmedQuery, personaId);
  }

  // Log the query via AuditLogger
  auditLog('QUERY', null, personaId, `Query processed: ${trimmedQuery}`, {
    queryText: trimmedQuery,
    personaId,
    matchScore: response.matchScore,
    queryId: response.queryId || null,
    clusterId: response.clusterId || null,
    resultTitle: response.title,
    sourceSystemsCount: response.sourceSystems.length,
    ctaBubblesCount: response.ctaBubbles.length,
  });

  return response;
}

/**
 * Provide autosuggest results for a partial query text, scoped to a persona.
 * Searches the autosuggest dataset and falls back to cluster query templates.
 *
 * @param {string} partialText - The partial text input from the user.
 * @param {string} personaId - The persona ID to scope suggestions.
 * @param {number} [maxResults=6] - Maximum number of suggestions to return.
 * @returns {object[]} Array of suggestion objects with text, category, and relevanceScore.
 */
export function autosuggest(partialText, personaId, maxResults = 6) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  if (typeof partialText !== 'string' || partialText.trim() === '') {
    // Return top suggestions for the persona when no input
    return getDefaultSuggestions(personaId, maxResults);
  }

  const trimmedInput = partialText.trim();
  const normalizedInput = normalize(trimmedInput);

  const autosuggestData = getData('autosuggest');
  const personaSuggestions = autosuggestData.find((entry) => entry.personaId === personaId);

  if (!personaSuggestions || !Array.isArray(personaSuggestions.suggestions)) {
    return getClusterSuggestions(personaId, trimmedInput, maxResults);
  }

  const suggestions = personaSuggestions.suggestions;

  // Score each suggestion against the partial input
  const scored = suggestions.map((suggestion) => {
    const normalizedSuggestion = normalize(suggestion.text);

    let score = 0;

    // Exact prefix match gets highest score
    if (normalizedSuggestion.startsWith(normalizedInput)) {
      score = 1.0;
    }
    // Contains the full input
    else if (normalizedSuggestion.includes(normalizedInput)) {
      score = 0.85;
    }
    // Token-based matching
    else {
      score = calculateSimilarity(trimmedInput, suggestion.text);
    }

    // Weight by the suggestion's own relevance score
    const weightedScore = score * (suggestion.relevanceScore || 0.5);

    return {
      text: suggestion.text,
      category: suggestion.category,
      relevanceScore: weightedScore,
      originalRelevance: suggestion.relevanceScore,
    };
  });

  // Filter out zero-score results and sort by weighted score descending
  const filtered = scored
    .filter((s) => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  // If we have fewer results than desired, supplement with cluster suggestions
  if (filtered.length < maxResults) {
    const clusterSuggestions = getClusterSuggestions(personaId, trimmedInput, maxResults - filtered.length);
    const existingTexts = new Set(filtered.map((s) => normalize(s.text)));

    for (let i = 0; i < clusterSuggestions.length; i++) {
      if (!existingTexts.has(normalize(clusterSuggestions[i].text))) {
        filtered.push(clusterSuggestions[i]);
      }
      if (filtered.length >= maxResults) break;
    }
  }

  return filtered;
}

/**
 * Get default suggestions for a persona when no input is provided.
 * Returns the top suggestions sorted by relevance score.
 *
 * @param {string} personaId - The persona ID.
 * @param {number} maxResults - Maximum number of suggestions.
 * @returns {object[]} Array of suggestion objects.
 */
function getDefaultSuggestions(personaId, maxResults) {
  const autosuggestData = getData('autosuggest');
  const personaSuggestions = autosuggestData.find((entry) => entry.personaId === personaId);

  if (!personaSuggestions || !Array.isArray(personaSuggestions.suggestions)) {
    return getClusterSuggestions(personaId, '', maxResults);
  }

  return personaSuggestions.suggestions
    .slice()
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, maxResults)
    .map((s) => ({
      text: s.text,
      category: s.category,
      relevanceScore: s.relevanceScore,
    }));
}

/**
 * Get suggestions from cluster query templates for a persona.
 * Used as a fallback when autosuggest data is insufficient.
 *
 * @param {string} personaId - The persona ID.
 * @param {string} partialText - The partial text to match against.
 * @param {number} maxResults - Maximum number of suggestions.
 * @returns {object[]} Array of suggestion objects derived from clusters.
 */
function getClusterSuggestions(personaId, partialText, maxResults) {
  const clusters = getData('clusters');
  const personaClusters = clusters
    .filter((c) => c.personaId === personaId)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  if (!partialText || partialText.trim() === '') {
    return personaClusters.slice(0, maxResults).map((c) => ({
      text: c.queryTemplate,
      category: c.category,
      relevanceScore: 1 - (c.priority || 1) * 0.1,
    }));
  }

  const scored = personaClusters.map((c) => {
    const score = calculateSimilarity(partialText, c.queryTemplate);
    return {
      text: c.queryTemplate,
      category: c.category,
      relevanceScore: score,
    };
  });

  return scored
    .filter((s) => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

/**
 * Get all available queries for a given persona.
 *
 * @param {string} personaId - The persona ID.
 * @returns {object[]} Array of query objects for the persona.
 */
export function getQueriesForPersona(personaId) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  const queries = getData('queries');
  return queries.filter((q) => q.personaId === personaId);
}

/**
 * Get a specific query by its queryId.
 *
 * @param {string} queryId - The unique query identifier.
 * @returns {object|null} The query object, or null if not found.
 */
export function getQueryById(queryId) {
  if (typeof queryId !== 'string' || queryId.trim() === '') {
    return null;
  }

  const queries = getData('queries');
  return queries.find((q) => q.queryId === queryId) || null;
}

/**
 * Get queries associated with a specific cluster.
 *
 * @param {string} clusterId - The cluster identifier.
 * @returns {object[]} Array of query objects for the cluster.
 */
export function getQueriesByCluster(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim() === '') {
    return [];
  }

  const queries = getData('queries');
  return queries.filter((q) => q.clusterId === clusterId);
}