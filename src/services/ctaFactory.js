/**
 * CTAFactory service for Ask Dreeso Memory.
 * Generates contextual, data-derived follow-up query suggestions (CTA bubbles)
 * based on query response data and persona context.
 *
 * @module CTAFactory
 */

import { getData } from '@/services/dataManager';
import { PERSONA_IDS, CLUSTER_CATEGORIES } from '@/utils/constants';

/**
 * Icon mapping by category for CTA bubbles.
 * @type {Record<string, string>}
 */
const CATEGORY_ICONS = {
  [CLUSTER_CATEGORIES.MANAGEMENT]: 'briefcase',
  [CLUSTER_CATEGORIES.FINANCE]: 'dollar-sign',
  [CLUSTER_CATEGORIES.RISK]: 'alert-triangle',
  [CLUSTER_CATEGORIES.REPORTING]: 'bar-chart',
  [CLUSTER_CATEGORIES.WORKFORCE]: 'users',
  [CLUSTER_CATEGORIES.COMPLIANCE]: 'clipboard-check',
  [CLUSTER_CATEGORIES.PROCUREMENT]: 'truck',
  [CLUSTER_CATEGORIES.SCHEDULE]: 'calendar',
  [CLUSTER_CATEGORIES.ANALYSIS]: 'search',
  [CLUSTER_CATEGORIES.SALES]: 'trending-up',
};

/**
 * Default icon when category is unknown.
 * @type {string}
 */
const DEFAULT_ICON = 'message-circle';

/**
 * Maximum number of CTA bubbles to generate.
 * @type {number}
 */
const MAX_CTAS = 4;

/**
 * Minimum number of CTA bubbles to generate.
 * @type {number}
 */
const MIN_CTAS = 3;

/**
 * Resolve the icon for a given category string.
 * @param {string} category - The category to resolve an icon for.
 * @returns {string} The icon name string.
 */
function resolveIcon(category) {
  if (typeof category !== 'string' || category.trim() === '') {
    return DEFAULT_ICON;
  }
  return CATEGORY_ICONS[category.toLowerCase()] || DEFAULT_ICON;
}

/**
 * Infer the category of a CTA text by matching keywords.
 * @param {string} text - The CTA text to analyze.
 * @returns {string} The inferred category string.
 */
function inferCategory(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return 'management';
  }

  const lower = text.toLowerCase();

  if (lower.includes('budget') || lower.includes('cost') || lower.includes('financial') || lower.includes('cash flow') || lower.includes('revenue') || lower.includes('variance')) {
    return CLUSTER_CATEGORIES.FINANCE;
  }
  if (lower.includes('risk') || lower.includes('mitigation') || lower.includes('escalat')) {
    return CLUSTER_CATEGORIES.RISK;
  }
  if (lower.includes('schedule') || lower.includes('milestone') || lower.includes('critical path') || lower.includes('delay') || lower.includes('timeline')) {
    return CLUSTER_CATEGORIES.SCHEDULE;
  }
  if (lower.includes('resource') || lower.includes('workforce') || lower.includes('team') || lower.includes('utilization') || lower.includes('capacity')) {
    return CLUSTER_CATEGORIES.WORKFORCE;
  }
  if (lower.includes('compliance') || lower.includes('audit') || lower.includes('governance') || lower.includes('quality') || lower.includes('ncr') || lower.includes('esg')) {
    return CLUSTER_CATEGORIES.COMPLIANCE;
  }
  if (lower.includes('procurement') || lower.includes('supplier') || lower.includes('subcontract') || lower.includes('claim') || lower.includes('vendor')) {
    return CLUSTER_CATEGORIES.PROCUREMENT;
  }
  if (lower.includes('report') || lower.includes('summary') || lower.includes('export') || lower.includes('dashboard') || lower.includes('kpi')) {
    return CLUSTER_CATEGORIES.REPORTING;
  }
  if (lower.includes('pipeline') || lower.includes('client') || lower.includes('proposal') || lower.includes('deal') || lower.includes('partner') || lower.includes('bid')) {
    return CLUSTER_CATEGORIES.SALES;
  }
  if (lower.includes('benchmark') || lower.includes('trend') || lower.includes('compar') || lower.includes('analys') || lower.includes('market') || lower.includes('competitor')) {
    return CLUSTER_CATEGORIES.ANALYSIS;
  }

  return CLUSTER_CATEGORIES.MANAGEMENT;
}

/**
 * Build a CTA bubble object from text, with inferred category and icon.
 * @param {string} text - The CTA bubble text.
 * @param {number} priority - The priority ranking (1 = highest).
 * @param {string} [category] - Optional explicit category override.
 * @returns {object} A CTA bubble object with text, icon, category, and priority.
 */
function buildCTABubble(text, priority, category) {
  const resolvedCategory = category || inferCategory(text);
  return {
    text: text,
    icon: resolveIcon(resolvedCategory),
    category: resolvedCategory,
    priority: priority,
  };
}

/**
 * Extract CTA bubbles from the query response's ctaBubbles array.
 * @param {object} queryResponse - The query response object.
 * @returns {object[]} Array of CTA bubble objects derived from response ctaBubbles.
 */
function extractResponseCTAs(queryResponse) {
  if (!queryResponse || !Array.isArray(queryResponse.ctaBubbles)) {
    return [];
  }

  return queryResponse.ctaBubbles
    .filter((text) => typeof text === 'string' && text.trim() !== '')
    .map((text, index) => buildCTABubble(text.trim(), index + 1));
}

/**
 * Get persona-specific autosuggest entries that are contextually relevant
 * to the current query response.
 * @param {string} personaId - The persona ID.
 * @param {object} queryResponse - The query response object.
 * @param {number} maxResults - Maximum number of suggestions to return.
 * @returns {object[]} Array of CTA bubble objects from autosuggest data.
 */
function getContextualSuggestions(personaId, queryResponse, maxResults) {
  const autosuggestData = getData('autosuggest');
  const personaEntry = autosuggestData.find((entry) => entry.personaId === personaId);

  if (!personaEntry || !Array.isArray(personaEntry.suggestions)) {
    return [];
  }

  const responseCategory = queryResponse.clusterId
    ? getCategoryFromCluster(queryResponse.clusterId)
    : null;

  const existingTexts = new Set(
    (queryResponse.ctaBubbles || []).map((t) => typeof t === 'string' ? t.toLowerCase().trim() : '')
  );

  // Filter suggestions that are related but not duplicates
  const scored = personaEntry.suggestions
    .filter((s) => {
      if (!s.text || typeof s.text !== 'string') return false;
      return !existingTexts.has(s.text.toLowerCase().trim());
    })
    .map((s) => {
      let score = s.relevanceScore || 0.5;

      // Boost score if category matches the response context
      if (responseCategory && s.category === responseCategory) {
        score *= 1.3;
      }

      // Boost score for related categories
      const relatedCategories = getRelatedCategories(responseCategory);
      if (relatedCategories.includes(s.category)) {
        score *= 1.15;
      }

      return {
        text: s.text,
        category: s.category,
        score: score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map((s, index) => buildCTABubble(s.text, index + 1, s.category));
}

/**
 * Get the category associated with a cluster ID.
 * @param {string} clusterId - The cluster ID.
 * @returns {string|null} The category string, or null if not found.
 */
function getCategoryFromCluster(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim() === '') {
    return null;
  }

  const clusters = getData('clusters');
  const cluster = clusters.find((c) => c.id === clusterId);
  return cluster ? cluster.category : null;
}

/**
 * Get categories that are related to a given category.
 * Used for boosting contextually adjacent suggestions.
 * @param {string|null} category - The base category.
 * @returns {string[]} Array of related category strings.
 */
function getRelatedCategories(category) {
  if (!category) return [];

  const relationships = {
    [CLUSTER_CATEGORIES.MANAGEMENT]: [CLUSTER_CATEGORIES.REPORTING, CLUSTER_CATEGORIES.RISK, CLUSTER_CATEGORIES.WORKFORCE],
    [CLUSTER_CATEGORIES.FINANCE]: [CLUSTER_CATEGORIES.PROCUREMENT, CLUSTER_CATEGORIES.REPORTING, CLUSTER_CATEGORIES.ANALYSIS],
    [CLUSTER_CATEGORIES.RISK]: [CLUSTER_CATEGORIES.MANAGEMENT, CLUSTER_CATEGORIES.COMPLIANCE, CLUSTER_CATEGORIES.SCHEDULE],
    [CLUSTER_CATEGORIES.REPORTING]: [CLUSTER_CATEGORIES.MANAGEMENT, CLUSTER_CATEGORIES.FINANCE, CLUSTER_CATEGORIES.ANALYSIS],
    [CLUSTER_CATEGORIES.WORKFORCE]: [CLUSTER_CATEGORIES.MANAGEMENT, CLUSTER_CATEGORIES.SCHEDULE],
    [CLUSTER_CATEGORIES.COMPLIANCE]: [CLUSTER_CATEGORIES.RISK, CLUSTER_CATEGORIES.MANAGEMENT],
    [CLUSTER_CATEGORIES.PROCUREMENT]: [CLUSTER_CATEGORIES.FINANCE, CLUSTER_CATEGORIES.ANALYSIS],
    [CLUSTER_CATEGORIES.SCHEDULE]: [CLUSTER_CATEGORIES.RISK, CLUSTER_CATEGORIES.WORKFORCE],
    [CLUSTER_CATEGORIES.ANALYSIS]: [CLUSTER_CATEGORIES.FINANCE, CLUSTER_CATEGORIES.REPORTING],
    [CLUSTER_CATEGORIES.SALES]: [CLUSTER_CATEGORIES.FINANCE, CLUSTER_CATEGORIES.ANALYSIS],
  };

  return relationships[category] || [];
}

/**
 * Get fallback CTA bubbles from cluster query templates for a persona.
 * @param {string} personaId - The persona ID.
 * @param {number} maxResults - Maximum number of results.
 * @returns {object[]} Array of CTA bubble objects from cluster templates.
 */
function getClusterFallbackCTAs(personaId, maxResults) {
  const clusters = getData('clusters');
  const personaClusters = clusters
    .filter((c) => c.personaId === personaId)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .slice(0, maxResults);

  return personaClusters.map((c, index) =>
    buildCTABubble(c.queryTemplate, index + 1, c.category)
  );
}

/**
 * Analyze data tables in the query response to generate data-driven CTAs.
 * Looks for patterns like "Red" health, high variance, overdue items, etc.
 * @param {object} queryResponse - The query response object.
 * @returns {string[]} Array of data-derived CTA text strings.
 */
function analyzeResponseData(queryResponse) {
  const dataDrivenCTAs = [];

  if (!queryResponse || !Array.isArray(queryResponse.dataTables)) {
    return dataDrivenCTAs;
  }

  for (let t = 0; t < queryResponse.dataTables.length; t++) {
    const table = queryResponse.dataTables[t];
    if (!table || !Array.isArray(table.rows) || !Array.isArray(table.columns)) {
      continue;
    }

    const columns = table.columns.map((col) => (typeof col === 'string' ? col.toLowerCase() : ''));

    // Look for health/status columns with concerning values
    const healthIndex = columns.findIndex((col) =>
      col.includes('health') || col.includes('status') || col.includes('risk level')
    );

    if (healthIndex !== -1) {
      for (let r = 0; r < table.rows.length; r++) {
        const row = table.rows[r];
        if (!Array.isArray(row)) continue;

        const cellValue = typeof row[healthIndex] === 'string' ? row[healthIndex].toLowerCase() : '';
        if (cellValue === 'red' || cellValue === 'high' || cellValue === 'critical' || cellValue === 'at risk' || cellValue === 'flagged') {
          const projectName = row[0] || 'the flagged item';
          dataDrivenCTAs.push(`Show me details for ${projectName}`);
          break;
        }
      }
    }

    // Look for variance columns with significant values
    const varianceIndex = columns.findIndex((col) =>
      col.includes('variance') || col.includes('overdue')
    );

    if (varianceIndex !== -1) {
      for (let r = 0; r < table.rows.length; r++) {
        const row = table.rows[r];
        if (!Array.isArray(row)) continue;

        const cellValue = typeof row[varianceIndex] === 'string' ? row[varianceIndex] : '';
        const numericValue = parseFloat(cellValue.replace(/[^0-9.\-+]/g, ''));
        if (!isNaN(numericValue) && numericValue > 3) {
          const itemName = row[0] || 'the item with high variance';
          dataDrivenCTAs.push(`Drill into the ${itemName} variance details`);
          break;
        }
      }
    }
  }

  return dataDrivenCTAs;
}

/**
 * Generate contextual CTA (Call-to-Action) bubbles based on a query response
 * and persona context. Produces 3-4 follow-up query suggestions as CTA bubble
 * objects with text, icon, category, and priority.
 *
 * The generation strategy:
 * 1. Extract CTAs from the query response's ctaBubbles array (primary source)
 * 2. Analyze response data tables for data-driven insights
 * 3. Supplement with contextual autosuggest entries for the persona
 * 4. Fall back to cluster query templates if insufficient CTAs
 *
 * @param {object} queryResponse - The structured query response object from QueryEngine.
 * @param {string} personaId - The persona ID to scope CTA generation.
 * @returns {object[]} Array of 3-4 CTA bubble objects, each with:
 *   - {string} text - The follow-up query suggestion text.
 *   - {string} icon - The icon name for the CTA bubble.
 *   - {string} category - The category of the suggestion.
 *   - {number} priority - The priority ranking (1 = highest).
 * @throws {Error} If personaId is not a non-empty string.
 */
export function generateCTAs(queryResponse, personaId) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    throw new Error('CTAFactory: personaId must be a non-empty string');
  }

  const ctaBubbles = [];
  const seenTexts = new Set();

  /**
   * Add a CTA bubble to the result set, deduplicating by normalized text.
   * @param {object} bubble - The CTA bubble object.
   * @returns {boolean} True if the bubble was added, false if duplicate.
   */
  function addBubble(bubble) {
    if (!bubble || typeof bubble.text !== 'string' || bubble.text.trim() === '') {
      return false;
    }
    const normalizedText = bubble.text.toLowerCase().trim();
    if (seenTexts.has(normalizedText)) {
      return false;
    }
    seenTexts.add(normalizedText);
    ctaBubbles.push(bubble);
    return true;
  }

  // Step 1: Extract CTAs from the query response
  if (queryResponse) {
    const responseCTAs = extractResponseCTAs(queryResponse);
    for (let i = 0; i < responseCTAs.length && ctaBubbles.length < MAX_CTAS; i++) {
      addBubble(responseCTAs[i]);
    }
  }

  // Step 2: Analyze response data for data-driven CTAs
  if (queryResponse && ctaBubbles.length < MAX_CTAS) {
    const dataDrivenTexts = analyzeResponseData(queryResponse);
    for (let i = 0; i < dataDrivenTexts.length && ctaBubbles.length < MAX_CTAS; i++) {
      addBubble(buildCTABubble(dataDrivenTexts[i], ctaBubbles.length + 1));
    }
  }

  // Step 3: Supplement with contextual autosuggest entries
  if (ctaBubbles.length < MIN_CTAS) {
    const needed = MAX_CTAS - ctaBubbles.length;
    const contextualSuggestions = getContextualSuggestions(personaId, queryResponse || {}, needed + 2);
    for (let i = 0; i < contextualSuggestions.length && ctaBubbles.length < MAX_CTAS; i++) {
      addBubble(contextualSuggestions[i]);
    }
  }

  // Step 4: Fall back to cluster query templates
  if (ctaBubbles.length < MIN_CTAS) {
    const needed = MIN_CTAS - ctaBubbles.length;
    const fallbackCTAs = getClusterFallbackCTAs(personaId, needed + 2);
    for (let i = 0; i < fallbackCTAs.length && ctaBubbles.length < MIN_CTAS; i++) {
      addBubble(fallbackCTAs[i]);
    }
  }

  // Re-assign priorities based on final order
  for (let i = 0; i < ctaBubbles.length; i++) {
    ctaBubbles[i].priority = i + 1;
  }

  return ctaBubbles.slice(0, MAX_CTAS);
}

/**
 * Generate CTA bubbles for a specific cluster, independent of a query response.
 * Useful for dashboard cluster cards that need follow-up suggestions.
 *
 * @param {string} clusterId - The cluster ID to generate CTAs for.
 * @param {string} personaId - The persona ID to scope CTA generation.
 * @param {number} [maxResults=4] - Maximum number of CTAs to return.
 * @returns {object[]} Array of CTA bubble objects.
 */
export function generateClusterCTAs(clusterId, personaId, maxResults = 4) {
  if (typeof clusterId !== 'string' || clusterId.trim() === '') {
    return [];
  }

  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  const clusters = getData('clusters');
  const cluster = clusters.find((c) => c.id === clusterId);

  if (!cluster) {
    return getClusterFallbackCTAs(personaId, maxResults);
  }

  const category = cluster.category;
  const ctaBubbles = [];
  const seenTexts = new Set();

  // Get autosuggest entries matching the cluster category
  const autosuggestData = getData('autosuggest');
  const personaEntry = autosuggestData.find((entry) => entry.personaId === personaId);

  if (personaEntry && Array.isArray(personaEntry.suggestions)) {
    const categorySuggestions = personaEntry.suggestions
      .filter((s) => s.category === category && typeof s.text === 'string')
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    for (let i = 0; i < categorySuggestions.length && ctaBubbles.length < maxResults; i++) {
      const text = categorySuggestions[i].text.trim();
      const normalizedText = text.toLowerCase();
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        ctaBubbles.push(buildCTABubble(text, ctaBubbles.length + 1, category));
      }
    }

    // Add related category suggestions if needed
    if (ctaBubbles.length < maxResults) {
      const relatedCategories = getRelatedCategories(category);
      const relatedSuggestions = personaEntry.suggestions
        .filter((s) => relatedCategories.includes(s.category) && typeof s.text === 'string')
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      for (let i = 0; i < relatedSuggestions.length && ctaBubbles.length < maxResults; i++) {
        const text = relatedSuggestions[i].text.trim();
        const normalizedText = text.toLowerCase();
        if (!seenTexts.has(normalizedText)) {
          seenTexts.add(normalizedText);
          ctaBubbles.push(buildCTABubble(text, ctaBubbles.length + 1, relatedSuggestions[i].category));
        }
      }
    }
  }

  // Fall back to cluster templates if still insufficient
  if (ctaBubbles.length < MIN_CTAS) {
    const fallbacks = getClusterFallbackCTAs(personaId, maxResults);
    for (let i = 0; i < fallbacks.length && ctaBubbles.length < maxResults; i++) {
      const normalizedText = fallbacks[i].text.toLowerCase().trim();
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        ctaBubbles.push({ ...fallbacks[i], priority: ctaBubbles.length + 1 });
      }
    }
  }

  return ctaBubbles.slice(0, maxResults);
}

/**
 * Generate action-oriented CTA bubbles based on available actions for a persona.
 * These CTAs suggest executable actions rather than follow-up queries.
 *
 * @param {string} personaId - The persona ID.
 * @param {string} [category] - Optional category to filter actions.
 * @param {number} [maxResults=3] - Maximum number of action CTAs to return.
 * @returns {object[]} Array of action CTA bubble objects with text, icon, category, priority, and actionId.
 */
export function generateActionCTAs(personaId, category, maxResults = 3) {
  if (typeof personaId !== 'string' || personaId.trim() === '') {
    return [];
  }

  const actions = getData('actions');

  // Filter actions relevant to the persona
  const personaActions = actions
    .filter((action) => {
      if (!Array.isArray(action.affectedPersonaIds)) return false;
      return action.affectedPersonaIds.includes(personaId);
    })
    .filter((action) => {
      if (category && typeof category === 'string') {
        return action.category === category;
      }
      return true;
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  return personaActions.slice(0, maxResults).map((action, index) => ({
    text: action.label,
    icon: resolveIcon(action.category),
    category: action.category,
    priority: index + 1,
    actionId: action.id,
    description: action.description,
  }));
}

/**
 * Get the icon name for a given category.
 * Exposed for use by UI components that need category icons.
 *
 * @param {string} category - The category string.
 * @returns {string} The icon name.
 */
export function getIconForCategory(category) {
  return resolveIcon(category);
}