/**
 * QueryPage — Query results page for Ask Dreeso Memory (Screens 5-12).
 * Displays query response, source panel with active system highlighting,
 * CTA bubbles, and action panel when applicable. Manages query flow state:
 * idle → loading → response → CTA selection → action execution.
 * Full-width responsive layout.
 *
 * @module QueryPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Layout } from '@/components/layout/Layout';
import { QueryBar } from '@/components/query/QueryBar';
import { QueryResponse } from '@/components/query/QueryResponse';
import { SourcePanel } from '@/components/query/SourcePanel';
import { CTABubbles } from '@/components/query/CTABubbles';
import { ActionPanel } from '@/components/actions/ActionPanel';
import { ActionConfirmation } from '@/components/actions/ActionConfirmation';
import { PropagationFeed } from '@/components/actions/PropagationFeed';
import { GlassCard } from '@/components/common/GlassCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Avatar } from '@/components/common/Avatar';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useQueryEngine } from '@/hooks/useQueryEngine';
import { generateCTAs } from '@/services/ctaFactory';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

/**
 * Query flow phase constants.
 * @type {Record<string, string>}
 */
const FLOW_PHASE = {
  IDLE: 'idle',
  LOADING: 'loading',
  RESPONSE: 'response',
  ACTION: 'action',
};

/**
 * Persona-specific idle messages.
 * @type {Record<string, string>}
 */
const PERSONA_IDLE_MESSAGES = {
  'persona-lukas': 'Ask about portfolio health, budget status, risk exposure, or workforce utilization across your projects.',
  'persona-elena': 'Ask about cost breakdowns, procurement pipelines, valuations, or subcontractor claims across active projects.',
  'persona-sophie': 'Ask about schedules, milestones, resource conflicts, or progress tracking across your project teams.',
  'persona-james': 'Ask about pipeline status, client health scores, market trends, or proposal deadlines.',
};

/**
 * Persona-specific query screen titles.
 * @type {Record<string, string>}
 */
const PERSONA_SCREEN_TITLES = {
  'persona-lukas': 'Strategic Intelligence',
  'persona-elena': 'Cost & Procurement Intelligence',
  'persona-sophie': 'Schedule & Resource Intelligence',
  'persona-james': 'Sales & Market Intelligence',
};

/**
 * IdleState — Renders the idle state with persona greeting and prompt.
 *
 * @param {object} props
 * @param {object|null} props.currentPersona - The current persona object.
 * @param {string} props.idleMessage - The idle message to display.
 * @param {string} props.screenTitle - The screen title.
 * @returns {import('react').ReactElement} The idle state element.
 */
function IdleState({ currentPersona, idleMessage, screenTitle }) {
  const accentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center animate-slide-in">
      {/* Icon */}
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-6"
        style={{
          backgroundColor: `${accentColor}15`,
          color: accentColor,
        }}
      >
        <svg className="w-8 h-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
        {screenTitle}
      </h1>

      {/* Description */}
      <p className="text-sm text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed mb-6">
        {idleMessage}
      </p>

      {/* Persona indicator */}
      {currentPersona && (
        <div className="flex items-center gap-2.5">
          <Avatar
            initials={currentPersona.avatarInitials}
            colorTheme={accentColor}
            size="sm"
            ariaLabel={`Avatar for ${currentPersona.name}`}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-white leading-tight">
              {currentPersona.name}
            </p>
            <p className="text-xs text-dreeso-dark-400 leading-tight">
              {currentPersona.role}
            </p>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center gap-2 mt-8">
        <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-dreeso-dark-500">
          Use the query bar below or click an intelligence cluster from your dashboard.
        </span>
      </div>
    </div>
  );
}

IdleState.propTypes = {
  currentPersona: PropTypes.object,
  idleMessage: PropTypes.string.isRequired,
  screenTitle: PropTypes.string.isRequired,
};

/**
 * LoadingState — Renders the loading state with skeleton loaders.
 *
 * @param {object} props
 * @param {string} props.queryText - The query text being processed.
 * @param {string} [props.accentColor] - The accent color.
 * @returns {import('react').ReactElement} The loading state element.
 */
function LoadingState({ queryText, accentColor }) {
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Query echo */}
      {queryText && (
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: accentColor || '#17b363' }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-dreeso-dark-300 italic leading-relaxed">
            &ldquo;{queryText}&rdquo;
          </p>
        </div>
      )}

      {/* Processing indicator */}
      <div className="flex items-center gap-3 px-4 py-3 bg-glass-white border border-glass-border rounded-xl">
        <svg className="w-5 h-5 animate-spin text-dreeso-accent-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">Processing your query...</p>
          <p className="text-xs text-dreeso-dark-400 mt-0.5">Searching across connected enterprise systems</p>
        </div>
      </div>

      {/* Skeleton response */}
      <SkeletonLoader variant="card" count={1} />

      {/* Skeleton source panel */}
      <SkeletonLoader variant="text" count={2} />
    </div>
  );
}

LoadingState.propTypes = {
  queryText: PropTypes.string,
  accentColor: PropTypes.string,
};

/**
 * ErrorState — Renders the error state with retry option.
 *
 * @param {object} props
 * @param {string} props.error - The error message.
 * @param {function} props.onRetry - Callback to retry the query.
 * @returns {import('react').ReactElement} The error state element.
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-slide-in">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-semantic-error/10 mb-4">
        <svg className="w-7 h-7 text-semantic-error" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        Query Failed
      </h2>
      <p className="text-sm text-dreeso-dark-300 max-w-md mx-auto leading-relaxed mb-6">
        {error || 'An unexpected error occurred while processing your query. Please try again.'}
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
        onClick={onRetry}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 002.63 8.395a.75.75 0 001.449.39z" clipRule="evenodd" />
        </svg>
        Try Again
      </button>
    </div>
  );
}

ErrorState.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

/**
 * QueryPage component.
 * Displays query response, source panel with active system highlighting,
 * CTA bubbles, and action panel when applicable. Manages query flow state:
 * idle → loading → response → CTA selection → action execution.
 * Full-width responsive layout.
 *
 * @param {object} props
 * @param {string} [props.initialQuery] - Optional initial query to submit on mount.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {boolean} [props.showActionPanel=true] - Whether to show the action panel when response is actionable.
 * @param {boolean} [props.showSourcePanel=true] - Whether to show the source panel.
 * @param {boolean} [props.showCTABubbles=true] - Whether to show CTA follow-up bubbles.
 * @param {boolean} [props.showPropagationFeed=true] - Whether to show the propagation feed after action execution.
 * @param {function} [props.onQuerySubmit] - Optional callback when a query is submitted.
 * @param {function} [props.onResponseReceived] - Optional callback when a response is received.
 * @param {function} [props.onActionExecuted] - Optional callback when an action is executed.
 * @param {function} [props.onPropagationComplete] - Optional callback when propagation completes.
 * @returns {import('react').ReactElement} The query page element.
 */
export function QueryPage({
  initialQuery,
  className = '',
  showActionPanel = true,
  showSourcePanel = true,
  showCTABubbles = true,
  showPropagationFeed = true,
  onQuerySubmit,
  onResponseReceived,
  onActionExecuted,
  onPropagationComplete,
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const { session } = useAuth();
  const { addNotification, goToScreenById, currentScreen } = useApp();

  const {
    submitQuery,
    clearResponse,
    clearSuggestions,
    response,
    isLoading,
    error,
    ctaBubbles,
    queryText,
    setQueryText,
  } = useQueryEngine();

  const [flowPhase, setFlowPhase] = useState(FLOW_PHASE.IDLE);
  const [propagationEvents, setPropagationEvents] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isActionConfirmOpen, setIsActionConfirmOpen] = useState(false);
  const [lastQueryText, setLastQueryText] = useState('');

  const contentRef = useRef(null);
  const mountedRef = useRef(true);
  const initialQueryProcessedRef = useRef(false);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  const idleMessage = currentPersonaId && PERSONA_IDLE_MESSAGES[currentPersonaId]
    ? PERSONA_IDLE_MESSAGES[currentPersonaId]
    : 'Ask a question to explore insights from across your connected enterprise systems.';

  const screenTitle = currentPersonaId && PERSONA_SCREEN_TITLES[currentPersonaId]
    ? PERSONA_SCREEN_TITLES[currentPersonaId]
    : 'Query Intelligence';

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Process initial query on mount if provided
  useEffect(() => {
    if (
      initialQuery &&
      typeof initialQuery === 'string' &&
      initialQuery.trim() !== '' &&
      currentPersonaId &&
      !initialQueryProcessedRef.current
    ) {
      initialQueryProcessedRef.current = true;
      handleQuerySubmit(initialQuery.trim());
    }
  }, [initialQuery, currentPersonaId]);

  // Also check currentScreen for query text from screen flow
  useEffect(() => {
    if (
      currentScreen &&
      currentScreen.personaId &&
      currentScreen.personaId === currentPersonaId &&
      !initialQueryProcessedRef.current
    ) {
      // Check if this screen has an associated query from the screen flow
      const screenId = currentScreen.id;
      if (
        screenId === SCREEN_IDS.LUKAS_QUERY ||
        screenId === SCREEN_IDS.ELENA_QUERY ||
        screenId === SCREEN_IDS.SOPHIE_QUERY ||
        screenId === SCREEN_IDS.JAMES_QUERY
      ) {
        // The query will be triggered by the user or by initialQuery prop
      }
    }
  }, [currentScreen, currentPersonaId]);

  // Sync flow phase with loading/response/error states
  useEffect(() => {
    if (isLoading) {
      setFlowPhase(FLOW_PHASE.LOADING);
    } else if (error) {
      setFlowPhase(FLOW_PHASE.RESPONSE);
    } else if (response) {
      setFlowPhase(FLOW_PHASE.RESPONSE);

      if (typeof onResponseReceived === 'function') {
        onResponseReceived(response);
      }
    }
  }, [isLoading, error, response, onResponseReceived]);

  // Reset state when persona changes
  useEffect(() => {
    setFlowPhase(FLOW_PHASE.IDLE);
    setPropagationEvents([]);
    setSelectedAction(null);
    setIsActionConfirmOpen(false);
    setLastQueryText('');
    initialQueryProcessedRef.current = false;
  }, [currentPersonaId]);

  /**
   * Handle query submission from QueryBar or CTA bubbles.
   * @param {string} text - The query text to submit.
   */
  const handleQuerySubmit = useCallback((text) => {
    if (typeof text !== 'string' || text.trim() === '') {
      return;
    }

    if (!currentPersonaId) {
      addNotification('warning', 'Please select a persona before querying.');
      return;
    }

    const trimmedText = text.trim();
    setLastQueryText(trimmedText);
    setFlowPhase(FLOW_PHASE.LOADING);
    setPropagationEvents([]);
    setSelectedAction(null);
    setIsActionConfirmOpen(false);

    if (typeof onQuerySubmit === 'function') {
      onQuerySubmit(trimmedText);
    }

    submitQuery(trimmedText);

    // Scroll to top of content
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPersonaId, addNotification, onQuerySubmit, submitQuery]);

  /**
   * Handle CTA bubble click — triggers a follow-up query.
   * @param {string} ctaText - The CTA text to submit as a new query.
   */
  const handleCTAClick = useCallback((ctaText) => {
    if (typeof ctaText === 'string' && ctaText.trim() !== '') {
      handleQuerySubmit(ctaText.trim());
    }
  }, [handleQuerySubmit]);

  /**
   * Handle response received from QueryBar.
   * @param {object} queryResponse - The query response object.
   */
  const handleResponseReceived = useCallback((queryResponse) => {
    if (queryResponse && typeof onResponseReceived === 'function') {
      onResponseReceived(queryResponse);
    }
  }, [onResponseReceived]);

  /**
   * Handle action executed from ActionPanel.
   * @param {object} actionResult - The action execution result.
   */
  const handleActionExecuted = useCallback((actionResult) => {
    setFlowPhase(FLOW_PHASE.ACTION);

    if (typeof onActionExecuted === 'function') {
      onActionExecuted(actionResult);
    }
  }, [onActionExecuted]);

  /**
   * Handle propagation complete from ActionPanel or ActionConfirmation.
   * @param {object} propagationResult - The propagation result object.
   */
  const handlePropagationComplete = useCallback((propagationResult) => {
    if (propagationResult && typeof propagationResult === 'object') {
      setPropagationEvents((prev) => [
        {
          ...propagationResult,
          actionLabel: propagationResult.actionLabel || lastQueryText || 'Action',
          actionType: propagationResult.actionType || '',
          timestamp: propagationResult.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    if (typeof onPropagationComplete === 'function') {
      onPropagationComplete(propagationResult);
    }
  }, [lastQueryText, onPropagationComplete]);

  /**
   * Handle retry after error.
   */
  const handleRetry = useCallback(() => {
    if (lastQueryText) {
      handleQuerySubmit(lastQueryText);
    } else {
      clearResponse();
      setFlowPhase(FLOW_PHASE.IDLE);
    }
  }, [lastQueryText, handleQuerySubmit, clearResponse]);

  /**
   * Handle clearing the current query and returning to idle.
   */
  const handleClearQuery = useCallback(() => {
    clearResponse();
    clearSuggestions();
    setFlowPhase(FLOW_PHASE.IDLE);
    setLastQueryText('');
    setPropagationEvents([]);
    setSelectedAction(null);
    setIsActionConfirmOpen(false);
  }, [clearResponse, clearSuggestions]);

  /**
   * Active source systems from the current response.
   * @type {string[]}
   */
  const activeSources = useMemo(() => {
    if (!response || !Array.isArray(response.sourceSystems)) {
      return [];
    }
    return response.sourceSystems;
  }, [response]);

  /**
   * Whether the current response is actionable.
   * @type {boolean}
   */
  const isActionable = useMemo(() => {
    return response && response.actionable === true;
  }, [response]);

  /**
   * Resolved CTA bubbles from the response or ctaFactory.
   * @type {object[]}
   */
  const resolvedCTABubbles = useMemo(() => {
    if (Array.isArray(ctaBubbles) && ctaBubbles.length > 0) {
      return ctaBubbles;
    }

    if (response && Array.isArray(response.ctaBubbles) && response.ctaBubbles.length > 0) {
      return response.ctaBubbles.map((text, index) => ({
        text: typeof text === 'string' ? text : '',
        category: 'management',
        priority: index + 1,
      }));
    }

    return [];
  }, [ctaBubbles, response]);

  // No persona selected state
  if (!currentPersonaId || !currentPersona) {
    return (
      <Layout showNavbar showQueryBar={false} keyboardEnabled>
        <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
          <div className="text-center space-y-4 animate-slide-in">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-dreeso-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dreeso-dark-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Select a Persona
            </h1>
            <p className="text-sm text-dreeso-dark-400 max-w-md mx-auto">
              Choose a persona from the navigation bar to start querying.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-dreeso-accent-500 rounded-xl hover:bg-dreeso-accent-600 hover:shadow-accent-glow transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500"
              onClick={() => goToScreenById(SCREEN_IDS.PERSONA_SELECTION)}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Choose Persona
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar showQueryBar={false} keyboardEnabled>
      <div ref={contentRef} className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="flex items-center justify-between animate-slide-in">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{
                backgroundColor: `${resolvedAccentColor}15`,
                color: resolvedAccentColor,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">
                {screenTitle}
              </h1>
              <p className="text-xs text-dreeso-dark-400 mt-0.5">
                {currentPersona.name} — {currentPersona.role}
              </p>
            </div>
          </div>

          {/* Clear / New Query button */}
          {flowPhase !== FLOW_PHASE.IDLE && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={handleClearQuery}
              aria-label="New query"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
              New Query
            </button>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Primary content area — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Query Bar */}
            <QueryBar
              placeholder={`Ask ${currentPersona.name.split(' ')[0]} a question...`}
              onQuerySubmit={handleQuerySubmit}
              onResponseReceived={handleResponseReceived}
              disabled={false}
              showPersonaIndicator
            />

            {/* Flow phase content */}
            {flowPhase === FLOW_PHASE.IDLE && (
              <IdleState
                currentPersona={currentPersona}
                idleMessage={idleMessage}
                screenTitle={screenTitle}
              />
            )}

            {flowPhase === FLOW_PHASE.LOADING && (
              <LoadingState
                queryText={lastQueryText}
                accentColor={resolvedAccentColor}
              />
            )}

            {flowPhase === FLOW_PHASE.RESPONSE && error && (
              <ErrorState
                error={error}
                onRetry={handleRetry}
              />
            )}

            {flowPhase === FLOW_PHASE.RESPONSE && response && !error && (
              <div className="space-y-6">
                {/* Query Response */}
                <QueryResponse
                  response={response}
                  onCTAClick={handleCTAClick}
                  animated
                  showMatchScore={false}
                  showTimestamp
                  showSourceSystems
                  showCTAs={false}
                  showCharts
                />

                {/* Source Panel */}
                {showSourcePanel && (
                  <SourcePanel
                    activeSources={activeSources}
                    size="md"
                    showLabel
                    showCount
                    animated
                    compact={false}
                  />
                )}

                {/* CTA Bubbles */}
                {showCTABubbles && resolvedCTABubbles.length > 0 && (
                  <CTABubbles
                    bubbles={resolvedCTABubbles}
                    onQuerySubmit={handleCTAClick}
                    title="Follow-up Questions"
                    showTitle
                    animated
                    accentColor={resolvedAccentColor}
                  />
                )}
              </div>
            )}

            {flowPhase === FLOW_PHASE.ACTION && response && !error && (
              <div className="space-y-6">
                {/* Query Response (kept visible) */}
                <QueryResponse
                  response={response}
                  onCTAClick={handleCTAClick}
                  animated={false}
                  showMatchScore={false}
                  showTimestamp
                  showSourceSystems
                  showCTAs={false}
                  showCharts
                />

                {/* Source Panel */}
                {showSourcePanel && (
                  <SourcePanel
                    activeSources={activeSources}
                    size="md"
                    showLabel
                    showCount
                    animated={false}
                    compact={false}
                  />
                )}

                {/* Propagation Feed */}
                {showPropagationFeed && propagationEvents.length > 0 && (
                  <PropagationFeed
                    events={propagationEvents}
                    title="Cross-Domain Propagation"
                    showTitle
                    animated
                    compact={false}
                    maxEvents={5}
                  />
                )}

                {/* CTA Bubbles */}
                {showCTABubbles && resolvedCTABubbles.length > 0 && (
                  <CTABubbles
                    bubbles={resolvedCTABubbles}
                    onQuerySubmit={handleCTAClick}
                    title="Follow-up Questions"
                    showTitle
                    animated={false}
                    accentColor={resolvedAccentColor}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Action Panel — shown when response is actionable */}
            {showActionPanel && isActionable && (flowPhase === FLOW_PHASE.RESPONSE || flowPhase === FLOW_PHASE.ACTION) && (
              <div className="animate-slide-in">
                <ActionPanel
                  title="Available Actions"
                  showTitle
                  animated
                  compact
                  accentColor={resolvedAccentColor}
                  onActionExecuted={handleActionExecuted}
                  onPropagationComplete={handlePropagationComplete}
                  maxActions={4}
                />
              </div>
            )}

            {/* Query context card */}
            {(flowPhase === FLOW_PHASE.RESPONSE || flowPhase === FLOW_PHASE.ACTION) && response && (
              <div className="animate-slide-in">
                <GlassCard
                  variant="sm"
                  animated={false}
                  hoverable={false}
                  noPadding
                  className="p-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        Query Context
                      </h3>
                    </div>

                    {/* Query text */}
                    {response.queryText && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Query
                        </p>
                        <p className="text-xs text-dreeso-dark-200 leading-relaxed line-clamp-3">
                          {response.queryText}
                        </p>
                      </div>
                    )}

                    {/* Match info */}
                    {typeof response.matchScore === 'number' && response.matchScore > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Confidence
                        </p>
                        <span className={`text-xs font-mono ${
                          response.matchScore >= 0.8 ? 'text-semantic-success' :
                          response.matchScore >= 0.5 ? 'text-semantic-warning' :
                          'text-semantic-error'
                        }`}>
                          {Math.round(response.matchScore * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Source systems count */}
                    {Array.isArray(response.sourceSystems) && response.sourceSystems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
                          Sources
                        </p>
                        <span className="text-xs text-dreeso-dark-300">
                          {response.sourceSystems.length} system{response.sourceSystems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Actionable badge */}
                    {isActionable && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.75 10zm14.5 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-dreeso-accent-400 font-medium">
                          Actionable Response
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    {response.timestamp && (
                      <div className="pt-1 border-t border-glass-border/50">
                        <p className="text-[10px] text-dreeso-dark-500">
                          {new Date(response.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Propagation events sidebar (compact) */}
            {showPropagationFeed && flowPhase === FLOW_PHASE.RESPONSE && propagationEvents.length > 0 && (
              <div className="animate-slide-in">
                <PropagationFeed
                  events={propagationEvents}
                  title="Recent Propagations"
                  showTitle
                  animated={false}
                  compact
                  maxEvents={3}
                />
              </div>
            )}

            {/* Keyboard shortcuts */}
            {flowPhase === FLOW_PHASE.IDLE && (
              <div className="animate-slide-in">
                <GlassCard
                  variant="sm"
                  animated={false}
                  hoverable={false}
                  noPadding
                  className="p-4"
                >
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          F
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">Next Screen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          N
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">Switch Persona</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          R
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">Restart Flow</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          ←
                        </kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          →
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">Navigate</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <div className="flex items-center justify-center gap-2 pt-2 pb-4 animate-slide-in">
          <svg
            className="w-3 h-3 text-dreeso-accent-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
            <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] text-dreeso-dark-500">
            {APP_TITLE}
          </span>
        </div>
      </div>
    </Layout>
  );
}

QueryPage.propTypes = {
  initialQuery: PropTypes.string,
  className: PropTypes.string,
  showActionPanel: PropTypes.bool,
  showSourcePanel: PropTypes.bool,
  showCTABubbles: PropTypes.bool,
  showPropagationFeed: PropTypes.bool,
  onQuerySubmit: PropTypes.func,
  onResponseReceived: PropTypes.func,
  onActionExecuted: PropTypes.func,
  onPropagationComplete: PropTypes.func,
};

export default QueryPage;