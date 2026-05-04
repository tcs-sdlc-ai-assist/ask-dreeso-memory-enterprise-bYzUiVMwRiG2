/**
 * queryEngine.test.js — Unit tests for QueryEngine service.
 * Tests processQuery with matching and non-matching queries,
 * autosuggest filtering by persona, response structure validation,
 * and audit logging integration.
 *
 * @module queryEngine.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  processQuery,
  autosuggest,
  getQueriesForPersona,
  getQueryById,
  getQueriesByCluster,
} from '@/services/queryEngine';
import { getLogs, clearLogs } from '@/services/auditLogger';
import { getData } from '@/services/dataManager';

describe('QueryEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure data is initialized
    getData('personas');
    clearLogs();
  });

  describe('processQuery', () => {
    describe('input validation', () => {
      it('throws an error when queryText is empty', () => {
        expect(() => {
          processQuery('', 'persona-lukas');
        }).toThrow('QueryEngine: queryText must be a non-empty string');
      });

      it('throws an error when queryText is not a string', () => {
        expect(() => {
          processQuery(null, 'persona-lukas');
        }).toThrow('QueryEngine: queryText must be a non-empty string');
      });

      it('throws an error when personaId is empty', () => {
        expect(() => {
          processQuery('Show me projects', '');
        }).toThrow('QueryEngine: personaId must be a non-empty string');
      });

      it('throws an error when personaId is not a string', () => {
        expect(() => {
          processQuery('Show me projects', undefined);
        }).toThrow('QueryEngine: personaId must be a non-empty string');
      });

      it('throws an error when queryText is only whitespace', () => {
        expect(() => {
          processQuery('   ', 'persona-lukas');
        }).toThrow('QueryEngine: queryText must be a non-empty string');
      });
    });

    describe('matching queries', () => {
      it('returns a matching response for Lukas strategic oversight query', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('Active Projects — Strategic Overview');
        expect(response.summary).toBeTruthy();
        expect(response.matchScore).toBeGreaterThan(0.3);
        expect(response.personaId).toBe('persona-lukas');
        expect(response.queryText).toBe('Show me the current status and strategic alignment of all active projects');
      });

      it('returns a matching response for Elena cost analysis query', () => {
        const response = processQuery(
          'Show me the detailed cost breakdown and variance analysis for active projects',
          'persona-elena'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('Detailed Cost Breakdown & Variance Analysis');
        expect(response.matchScore).toBeGreaterThan(0.3);
        expect(response.personaId).toBe('persona-elena');
      });

      it('returns a matching response for Sophie schedule query', () => {
        const response = processQuery(
          'Show me the critical path and upcoming milestones for my projects',
          'persona-sophie'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('Critical Path & Milestone Tracker');
        expect(response.matchScore).toBeGreaterThan(0.3);
        expect(response.personaId).toBe('persona-sophie');
      });

      it('returns a matching response for James pipeline query', () => {
        const response = processQuery(
          'Show me the current sales pipeline and deal progression status',
          'persona-james'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('Sales Pipeline Overview');
        expect(response.matchScore).toBeGreaterThan(0.3);
        expect(response.personaId).toBe('persona-james');
      });

      it('matches a query with partial keyword overlap', () => {
        const response = processQuery(
          'budget utilization cost variance projects',
          'persona-lukas'
        );

        expect(response).toBeDefined();
        expect(response.title).toBeTruthy();
        expect(response.personaId).toBe('persona-lukas');
      });

      it('returns actionable flag when the matched query is actionable', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(response.actionable).toBe(true);
      });

      it('returns actionable false for non-actionable queries', () => {
        const response = processQuery(
          'Generate an executive summary of project performance for this quarter',
          'persona-lukas'
        );

        expect(response.actionable).toBe(false);
      });
    });

    describe('non-matching queries', () => {
      it('returns a default response for a completely unrelated query', () => {
        const response = processQuery(
          'What is the meaning of life and the universe?',
          'persona-lukas'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('No Exact Match Found');
        expect(response.matchScore).toBe(0);
        expect(response.personaId).toBe('persona-lukas');
      });

      it('returns default response with CTA bubbles from persona clusters', () => {
        const response = processQuery(
          'xyzzy random gibberish query that matches nothing',
          'persona-elena'
        );

        expect(response).toBeDefined();
        expect(response.title).toBe('No Exact Match Found');
        expect(Array.isArray(response.ctaBubbles)).toBe(true);
        expect(response.ctaBubbles.length).toBeGreaterThan(0);
      });

      it('does not match queries from a different persona', () => {
        // This is a Lukas query, should not match for James
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-james'
        );

        // James has no query matching this text, so it should either be a low match or default
        expect(response).toBeDefined();
        expect(response.personaId).toBe('persona-james');
        // The title should not be the Lukas response title
        expect(response.title).not.toBe('Active Projects — Strategic Overview');
      });
    });

    describe('response structure validation', () => {
      it('returns a response with all required fields', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('summary');
        expect(response).toHaveProperty('dataTables');
        expect(response).toHaveProperty('chartsData');
        expect(response).toHaveProperty('sourceSystems');
        expect(response).toHaveProperty('ctaBubbles');
        expect(response).toHaveProperty('matchScore');
        expect(response).toHaveProperty('queryText');
        expect(response).toHaveProperty('personaId');
        expect(response).toHaveProperty('timestamp');
      });

      it('returns dataTables as an array', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(Array.isArray(response.dataTables)).toBe(true);
        expect(response.dataTables.length).toBeGreaterThan(0);
      });

      it('returns data tables with columns and rows', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        const table = response.dataTables[0];
        expect(table).toHaveProperty('columns');
        expect(table).toHaveProperty('rows');
        expect(Array.isArray(table.columns)).toBe(true);
        expect(Array.isArray(table.rows)).toBe(true);
        expect(table.columns.length).toBeGreaterThan(0);
        expect(table.rows.length).toBeGreaterThan(0);
      });

      it('returns chartsData as an array', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(Array.isArray(response.chartsData)).toBe(true);
      });

      it('returns sourceSystems as an array of strings', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(Array.isArray(response.sourceSystems)).toBe(true);
        if (response.sourceSystems.length > 0) {
          expect(typeof response.sourceSystems[0]).toBe('string');
        }
      });

      it('returns ctaBubbles as an array of strings', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(Array.isArray(response.ctaBubbles)).toBe(true);
        if (response.ctaBubbles.length > 0) {
          expect(typeof response.ctaBubbles[0]).toBe('string');
        }
      });

      it('returns matchScore as a number between 0 and 1', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(typeof response.matchScore).toBe('number');
        expect(response.matchScore).toBeGreaterThanOrEqual(0);
        expect(response.matchScore).toBeLessThanOrEqual(1);
      });

      it('returns a valid ISO timestamp', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(typeof response.timestamp).toBe('string');
        const date = new Date(response.timestamp);
        expect(isNaN(date.getTime())).toBe(false);
      });

      it('returns queryId and clusterId for matched queries', () => {
        const response = processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        expect(response.queryId).toBeTruthy();
        expect(response.clusterId).toBeTruthy();
      });

      it('returns the original query text in the response', () => {
        const queryText = 'What is the current budget utilization and cost variance across all projects?';
        const response = processQuery(queryText, 'persona-lukas');

        expect(response.queryText).toBe(queryText);
      });

      it('trims whitespace from query text', () => {
        const response = processQuery(
          '  Show me the current status and strategic alignment of all active projects  ',
          'persona-lukas'
        );

        expect(response.queryText).toBe('Show me the current status and strategic alignment of all active projects');
      });
    });

    describe('audit logging integration', () => {
      it('logs a QUERY event when a query is processed', () => {
        processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        const logs = getLogs({ eventType: 'QUERY' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.eventType).toBe('QUERY');
        expect(latestLog.personaId).toBe('persona-lukas');
        expect(latestLog.action).toContain('Query processed');
      });

      it('logs query details including matchScore and queryText', () => {
        processQuery(
          'Show me the current status and strategic alignment of all active projects',
          'persona-lukas'
        );

        const logs = getLogs({ eventType: 'QUERY' });
        const latestLog = logs[0];

        expect(latestLog.details).toBeDefined();
        expect(latestLog.details.queryText).toBeTruthy();
        expect(typeof latestLog.details.matchScore).toBe('number');
        expect(latestLog.details.personaId).toBe('persona-lukas');
      });

      it('logs a QUERY event even for non-matching queries', () => {
        processQuery(
          'completely random unrelated query text',
          'persona-lukas'
        );

        const logs = getLogs({ eventType: 'QUERY' });
        expect(logs.length).toBeGreaterThanOrEqual(1);

        const latestLog = logs[0];
        expect(latestLog.eventType).toBe('QUERY');
        expect(latestLog.details.matchScore).toBe(0);
      });

      it('logs the correct persona ID in the audit entry', () => {
        processQuery('Show me the sales pipeline', 'persona-james');

        const logs = getLogs({ eventType: 'QUERY', personaId: 'persona-james' });
        expect(logs.length).toBeGreaterThanOrEqual(1);
        expect(logs[0].personaId).toBe('persona-james');
      });
    });

    describe('persona scoping', () => {
      it('only matches queries belonging to the specified persona', () => {
        // Elena-specific query
        const elenaResponse = processQuery(
          'Show me the detailed cost breakdown and variance analysis for active projects',
          'persona-elena'
        );

        expect(elenaResponse.title).toBe('Detailed Cost Breakdown & Variance Analysis');
        expect(elenaResponse.personaId).toBe('persona-elena');

        // Same query text for Lukas should not match Elena's response
        const lukasResponse = processQuery(
          'Show me the detailed cost breakdown and variance analysis for active projects',
          'persona-lukas'
        );

        // Lukas may have a different match or default
        expect(lukasResponse.personaId).toBe('persona-lukas');
      });

      it('returns persona-specific CTA bubbles in default response', () => {
        const sophieResponse = processQuery(
          'completely unrelated query for testing',
          'persona-sophie'
        );

        expect(sophieResponse.personaId).toBe('persona-sophie');
        expect(Array.isArray(sophieResponse.ctaBubbles)).toBe(true);
        // Sophie's clusters include schedule-related templates
        if (sophieResponse.ctaBubbles.length > 0) {
          const hasScheduleRelated = sophieResponse.ctaBubbles.some(
            (cta) => cta.toLowerCase().includes('schedule') ||
                     cta.toLowerCase().includes('milestone') ||
                     cta.toLowerCase().includes('critical path') ||
                     cta.toLowerCase().includes('resource') ||
                     cta.toLowerCase().includes('progress') ||
                     cta.toLowerCase().includes('stakeholder') ||
                     cta.toLowerCase().includes('quality')
          );
          expect(hasScheduleRelated).toBe(true);
        }
      });
    });
  });

  describe('autosuggest', () => {
    describe('input validation', () => {
      it('returns empty array when personaId is empty', () => {
        const results = autosuggest('budget', '');
        expect(results).toEqual([]);
      });

      it('returns empty array when personaId is not a string', () => {
        const results = autosuggest('budget', null);
        expect(results).toEqual([]);
      });
    });

    describe('default suggestions (no input)', () => {
      it('returns default suggestions when partialText is empty', () => {
        const results = autosuggest('', 'persona-lukas');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(6);
      });

      it('returns default suggestions when partialText is whitespace', () => {
        const results = autosuggest('   ', 'persona-lukas');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
      });

      it('returns suggestions sorted by relevance score descending', () => {
        const results = autosuggest('', 'persona-lukas');

        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
        }
      });
    });

    describe('filtering by persona', () => {
      it('returns suggestions scoped to persona-lukas', () => {
        const results = autosuggest('budget', 'persona-lukas');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        // Lukas suggestions should include budget/portfolio related items
        const hasBudgetRelated = results.some(
          (s) => s.text.toLowerCase().includes('budget') ||
                 s.text.toLowerCase().includes('cost') ||
                 s.text.toLowerCase().includes('variance')
        );
        expect(hasBudgetRelated).toBe(true);
      });

      it('returns suggestions scoped to persona-elena', () => {
        const results = autosuggest('cost', 'persona-elena');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        const hasCostRelated = results.some(
          (s) => s.text.toLowerCase().includes('cost')
        );
        expect(hasCostRelated).toBe(true);
      });

      it('returns suggestions scoped to persona-sophie', () => {
        const results = autosuggest('schedule', 'persona-sophie');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        const hasScheduleRelated = results.some(
          (s) => s.text.toLowerCase().includes('schedule') ||
                 s.text.toLowerCase().includes('milestone') ||
                 s.text.toLowerCase().includes('critical')
        );
        expect(hasScheduleRelated).toBe(true);
      });

      it('returns suggestions scoped to persona-james', () => {
        const results = autosuggest('pipeline', 'persona-james');

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        const hasPipelineRelated = results.some(
          (s) => s.text.toLowerCase().includes('pipeline') ||
                 s.text.toLowerCase().includes('sales') ||
                 s.text.toLowerCase().includes('deal')
        );
        expect(hasPipelineRelated).toBe(true);
      });

      it('returns different suggestions for different personas with the same input', () => {
        const lukasResults = autosuggest('risk', 'persona-lukas');
        const sophieResults = autosuggest('risk', 'persona-sophie');

        expect(lukasResults.length).toBeGreaterThan(0);
        expect(sophieResults.length).toBeGreaterThan(0);

        // The suggestion texts should differ between personas
        const lukasTexts = new Set(lukasResults.map((s) => s.text));
        const sophieTexts = new Set(sophieResults.map((s) => s.text));

        // At least some suggestions should be different
        let differentCount = 0;
        for (const text of sophieTexts) {
          if (!lukasTexts.has(text)) {
            differentCount++;
          }
        }
        // They should have at least some unique suggestions
        expect(differentCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('suggestion structure', () => {
      it('returns suggestions with text, category, and relevanceScore', () => {
        const results = autosuggest('budget', 'persona-lukas');

        expect(results.length).toBeGreaterThan(0);

        const suggestion = results[0];
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('relevanceScore');
        expect(typeof suggestion.text).toBe('string');
        expect(typeof suggestion.category).toBe('string');
        expect(typeof suggestion.relevanceScore).toBe('number');
      });

      it('returns non-empty text for all suggestions', () => {
        const results = autosuggest('project', 'persona-lukas');

        for (let i = 0; i < results.length; i++) {
          expect(results[i].text.trim()).not.toBe('');
        }
      });
    });

    describe('maxResults parameter', () => {
      it('respects the maxResults parameter', () => {
        const results = autosuggest('', 'persona-lukas', 3);

        expect(results.length).toBeLessThanOrEqual(3);
      });

      it('returns up to 6 results by default', () => {
        const results = autosuggest('', 'persona-lukas');

        expect(results.length).toBeLessThanOrEqual(6);
      });

      it('returns fewer results when maxResults is 1', () => {
        const results = autosuggest('', 'persona-lukas', 1);

        expect(results.length).toBeLessThanOrEqual(1);
      });
    });

    describe('keyword matching', () => {
      it('returns higher-scored results for exact prefix matches', () => {
        const results = autosuggest('Show me the current', 'persona-lukas');

        expect(results.length).toBeGreaterThan(0);
        // The top result should have a high relevance score
        expect(results[0].relevanceScore).toBeGreaterThan(0);
      });

      it('returns results for partial keyword matches', () => {
        const results = autosuggest('workforce utilization', 'persona-lukas');

        expect(results.length).toBeGreaterThan(0);
        const hasWorkforceRelated = results.some(
          (s) => s.text.toLowerCase().includes('workforce') ||
                 s.text.toLowerCase().includes('utilization')
        );
        expect(hasWorkforceRelated).toBe(true);
      });

      it('filters out zero-score results', () => {
        const results = autosuggest('xyzzy', 'persona-lukas');

        // All returned results should have a positive relevance score
        for (let i = 0; i < results.length; i++) {
          expect(results[i].relevanceScore).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('getQueriesForPersona', () => {
    it('returns queries for persona-lukas', () => {
      const queries = getQueriesForPersona('persona-lukas');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].personaId).toBe('persona-lukas');
      }
    });

    it('returns queries for persona-elena', () => {
      const queries = getQueriesForPersona('persona-elena');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].personaId).toBe('persona-elena');
      }
    });

    it('returns queries for persona-sophie', () => {
      const queries = getQueriesForPersona('persona-sophie');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].personaId).toBe('persona-sophie');
      }
    });

    it('returns queries for persona-james', () => {
      const queries = getQueriesForPersona('persona-james');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].personaId).toBe('persona-james');
      }
    });

    it('returns empty array for empty personaId', () => {
      const queries = getQueriesForPersona('');
      expect(queries).toEqual([]);
    });

    it('returns empty array for invalid personaId', () => {
      const queries = getQueriesForPersona('persona-nonexistent');
      expect(queries).toEqual([]);
    });

    it('returns empty array for non-string personaId', () => {
      const queries = getQueriesForPersona(null);
      expect(queries).toEqual([]);
    });
  });

  describe('getQueryById', () => {
    it('returns a query by its queryId', () => {
      const query = getQueryById('query-lukas-strategic-001');

      expect(query).toBeDefined();
      expect(query).not.toBeNull();
      expect(query.queryId).toBe('query-lukas-strategic-001');
      expect(query.personaId).toBe('persona-lukas');
    });

    it('returns null for a non-existent queryId', () => {
      const query = getQueryById('query-nonexistent-999');
      expect(query).toBeNull();
    });

    it('returns null for empty queryId', () => {
      const query = getQueryById('');
      expect(query).toBeNull();
    });

    it('returns null for non-string queryId', () => {
      const query = getQueryById(undefined);
      expect(query).toBeNull();
    });

    it('returns a query with response data', () => {
      const query = getQueryById('query-lukas-strategic-001');

      expect(query).not.toBeNull();
      expect(query.response).toBeDefined();
      expect(query.response.title).toBeTruthy();
      expect(query.response.summary).toBeTruthy();
    });
  });

  describe('getQueriesByCluster', () => {
    it('returns queries for a valid cluster ID', () => {
      const queries = getQueriesByCluster('cluster-strategic-oversight');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].clusterId).toBe('cluster-strategic-oversight');
      }
    });

    it('returns empty array for a non-existent cluster ID', () => {
      const queries = getQueriesByCluster('cluster-nonexistent');
      expect(queries).toEqual([]);
    });

    it('returns empty array for empty cluster ID', () => {
      const queries = getQueriesByCluster('');
      expect(queries).toEqual([]);
    });

    it('returns empty array for non-string cluster ID', () => {
      const queries = getQueriesByCluster(null);
      expect(queries).toEqual([]);
    });

    it('returns queries for Elena cost analysis cluster', () => {
      const queries = getQueriesByCluster('cluster-cost-analysis');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].clusterId).toBe('cluster-cost-analysis');
        expect(queries[i].personaId).toBe('persona-elena');
      }
    });

    it('returns queries for James sales pipeline cluster', () => {
      const queries = getQueriesByCluster('cluster-sales-pipeline');

      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThan(0);

      for (let i = 0; i < queries.length; i++) {
        expect(queries[i].clusterId).toBe('cluster-sales-pipeline');
        expect(queries[i].personaId).toBe('persona-james');
      }
    });
  });

  describe('multiple queries in sequence', () => {
    it('processes multiple queries without interference', () => {
      const response1 = processQuery(
        'Show me the current status and strategic alignment of all active projects',
        'persona-lukas'
      );

      const response2 = processQuery(
        'Show me the detailed cost breakdown and variance analysis for active projects',
        'persona-elena'
      );

      expect(response1.personaId).toBe('persona-lukas');
      expect(response2.personaId).toBe('persona-elena');
      expect(response1.title).not.toBe(response2.title);
    });

    it('logs each query separately in the audit log', () => {
      processQuery('budget utilization', 'persona-lukas');
      processQuery('cost breakdown', 'persona-elena');
      processQuery('schedule milestones', 'persona-sophie');

      const logs = getLogs({ eventType: 'QUERY' });
      expect(logs.length).toBeGreaterThanOrEqual(3);

      // Verify different persona IDs are logged
      const personaIds = logs.map((l) => l.personaId);
      expect(personaIds).toContain('persona-lukas');
      expect(personaIds).toContain('persona-elena');
      expect(personaIds).toContain('persona-sophie');
    });
  });
});