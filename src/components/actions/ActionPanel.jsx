/**
 * ActionPanel — Action execution panel component for Ask Dreeso Memory.
 * Displays available actions for the current query context in a glassmorphism card.
 * Each action shows label, target system, and execute button. On execute, calls
 * ActionExecutor, shows confirmation via Notification, and triggers
 * CrossDomainPropagator if applicable.
 *
 * @module ActionPanel
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { usePersona } from '@/contexts/PersonaContext';
import { useApp } from '@/contexts/AppContext';
import {
  executeAction,
  getActionsForPersona,
  getActionsByCategory,
  getActionPreview,
  validateActionExecution,
} from '@/services/actionExecutor';
import { propagate } from '@/services/crossDomainPropagator';

/**
 * Valid action type badge color mappings.
 * @type {Record<string, string>}
 */
const ACTION_TYPE_CLASSES = {
  reassign: 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20',
  approve: 'text-semantic-success bg-semantic-success/10 border-semantic-success/20',
  update: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  escalate: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
  create: 'text-dreeso-accent-400 bg-dreeso-accent-500/10 border-dreeso-accent-500/20',
  submit: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  reject: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
};

/**
 * Category icon SVG components.
 * @param {object} props
 * @param {string} props.category - The action category.
 * @returns {import('react').ReactElement} The icon SVG element.
 */
function CategoryIcon({ category }) {
  const resolved = typeof category === 'string' ? category.toLowerCase() : '';

  switch (resolved) {
    case 'workforce':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
        </svg>
      );
    case 'finance':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.514.111.987.29 1.388.545.669.424 1.112 1.048 1.112 1.78 0 .733-.443 1.357-1.112 1.78a4.614 4.614 0 01-1.388.546v.184a.75.75 0 01-1.5 0v-.184a4.614 4.614 0 01-1.388-.546C7.443 12.982 7 12.358 7 11.625c0-.733.443-1.356 1.112-1.78.401-.254.874-.434 1.388-.545V6.801a2.187 2.187 0 00-.736.363 1.35 1.35 0 00-.447.563.75.75 0 01-1.395-.55c.18-.46.5-.87.925-1.2a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      );
    case 'risk':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'management':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
          <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686A41.454 41.454 0 0110 18c-1.572 0-3.118-.12-4.637-.259C3.985 17.585 3 16.402 3 15.055z" />
        </svg>
      );
    case 'compliance':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      );
    case 'procurement':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h-.5a.75.75 0 000 1.5H2v2.607c0 .748.547 1.38 1.29 1.493A41.559 41.559 0 006.5 17c1.051 0 2.093-.04 3.125-.117A1.49 1.49 0 0011 15.393V13h.5a.75.75 0 000-1.5H11V4.607c0-.748-.547-1.38-1.29-1.493A41.559 41.559 0 006.5 3zM15 9.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm2.25.75a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" />
        </svg>
      );
    case 'sales':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
        </svg>
      );
    case 'schedule':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      );
    case 'reporting':
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
      );
  }
}

CategoryIcon.propTypes = {
  category: PropTypes.string,
};

/**
 * Resolve the badge class for an action type.
 * @param {string} actionType - The action type string.
 * @returns {string} The Tailwind class string for the badge.
 */
function resolveTypeBadgeClass(actionType) {
  if (typeof actionType === 'string' && ACTION_TYPE_CLASSES[actionType]) {
    return ACTION_TYPE_CLASSES[actionType];
  }
  return ACTION_TYPE_CLASSES.update;
}

/**
 * ConfirmationDialog — Modal confirmation dialog for action execution.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {object} props.action - The action object.
 * @param {object} props.preview - The action preview object.
 * @param {function} props.onConfirm - Callback when the user confirms.
 * @param {function} props.onCancel - Callback when the user cancels.
 * @param {boolean} props.isExecuting - Whether the action is currently executing.
 * @returns {import('react').ReactElement|null} The dialog element, or null if closed.
 */
function ConfirmationDialog({ isOpen, action, preview, onConfirm, onCancel, isExecuting }) {
  if (!isOpen || !action) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dreeso-dark-950/80 backdrop-blur-sm animate-scale-up"
      role="dialog"
      aria-modal="true"
      aria-label={`Confirm action: ${action.label}`}
    >
      <div className="w-full max-w-lg bg-dreeso-dark-900/95 backdrop-blur-lg border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-semantic-warning/10 text-semantic-warning shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {action.label}
              </h2>
              <p className="text-xs text-dreeso-dark-400 mt-0.5">
                {action.type ? action.type.charAt(0).toUpperCase() + action.type.slice(1) : 'Action'} — {action.category || 'General'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto scrollbar-hide">
          {/* Confirmation message */}
          {preview && preview.confirmationMessage && (
            <p className="text-sm text-dreeso-dark-200 leading-relaxed">
              {preview.confirmationMessage}
            </p>
          )}

          {/* Affected systems */}
          {preview && Array.isArray(preview.affectedSystems) && preview.affectedSystems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                Affected Systems
              </h3>
              <div className="space-y-1.5">
                {preview.affectedSystems.map((system, index) => (
                  <div
                    key={`affected-${index}`}
                    className="flex items-start gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: system.color || '#666666' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {system.shortName || system.systemName}
                      </p>
                      <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2">
                        {system.effect}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rollback info */}
          {preview && (
            <div className="flex items-center gap-2 text-xs">
              {preview.rollbackSupported ? (
                <>
                  <svg className="w-3.5 h-3.5 text-semantic-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-semantic-success">Rollback supported</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-semantic-warning shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-semantic-warning">This action cannot be undone</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-xl transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
            onClick={onCancel}
            disabled={isExecuting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              isExecuting
                ? 'bg-dreeso-accent-500/50 text-white/50 cursor-not-allowed'
                : 'bg-dreeso-accent-500 text-white hover:bg-dreeso-accent-600 hover:shadow-accent-glow'
            }`}
            onClick={onConfirm}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Executing...
              </span>
            ) : (
              'Confirm & Execute'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  action: PropTypes.object,
  preview: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isExecuting: PropTypes.bool.isRequired,
};

/**
 * PropagationResult — Displays the propagation chain result after action execution.
 *
 * @param {object} props
 * @param {object} props.result - The propagation result object.
 * @param {function} props.onDismiss - Callback to dismiss the result.
 * @returns {import('react').ReactElement|null} The propagation result element.
 */
function PropagationResult({ result, onDismiss }) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const isSuccess = result.status === 'success';
  const isPartial = result.status === 'partial';

  return (
    <div className="space-y-3 animate-slide-in">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <svg className="w-4 h-4 text-semantic-success shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : isPartial ? (
            <svg className="w-4 h-4 text-semantic-warning shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-semantic-error shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-medium text-dreeso-dark-200">
            {result.message}
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 p-1 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
          onClick={onDismiss}
          aria-label="Dismiss propagation result"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Propagation steps */}
      {Array.isArray(result.stepResults) && result.stepResults.length > 0 && (
        <div className="space-y-1.5">
          {result.stepResults.map((step, index) => (
            <div
              key={`step-${index}`}
              className="flex items-center gap-2.5 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0 animate-pulse-green"
                style={{ backgroundColor: step.color || '#17b363' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white truncate">
                    {step.shortName || step.systemName}
                  </span>
                  <span className="text-[10px] text-dreeso-dark-500 font-mono">
                    {step.latency}
                  </span>
                </div>
                <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-1">
                  {step.dataUpdate}
                </p>
              </div>
              <span className="text-[10px] text-dreeso-dark-500 font-mono shrink-0">
                {typeof step.confidence === 'number' ? `${Math.round(step.confidence * 100)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notifications */}
      {Array.isArray(result.notifications) && result.notifications.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-500">
            Notifications Sent
          </h4>
          {result.notifications.map((notification, index) => (
            <div
              key={`notif-${index}`}
              className="flex items-start gap-2 px-3 py-2 bg-glass-white border border-glass-border rounded-lg"
            >
              <svg className="w-3.5 h-3.5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-white">
                  {notification.personaName}
                </span>
                <p className="text-[11px] text-dreeso-dark-400 leading-relaxed line-clamp-2">
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

PropagationResult.propTypes = {
  result: PropTypes.object,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * Single action card component.
 *
 * @param {object} props
 * @param {object} props.action - The action object.
 * @param {string} [props.accentColor] - The persona accent color.
 * @param {function} props.onExecute - Callback when the execute button is clicked.
 * @param {boolean} props.canExecute - Whether the persona can execute this action.
 * @param {string[]} [props.reasons] - Reasons why the action cannot be executed.
 * @returns {import('react').ReactElement} The action card element.
 */
function ActionCard({ action, accentColor, onExecute, canExecute, reasons }) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const targetSystemName = action.targetSystem || '';
  const typeBadgeClass = resolveTypeBadgeClass(action.type);

  return (
    <div className="group">
      <GlassCard
        variant="sm"
        animated={false}
        hoverable
        noPadding
        className="p-4 transition-all duration-200 ease-out hover:shadow-glass-lg hover:border-glass-hover"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor: accentColor ? `${accentColor}15` : 'rgba(23, 179, 99, 0.08)',
                color: accentColor || '#17b363',
              }}
            >
              <CategoryIcon category={action.category} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white leading-tight truncate group-hover:text-dreeso-accent-300 transition-colors duration-150">
                {action.label}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${typeBadgeClass}`}
                >
                  {action.type}
                </span>
                <span className="text-[10px] text-dreeso-dark-500 truncate">
                  {action.category}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-dreeso-dark-300 leading-relaxed line-clamp-2">
            {action.description}
          </p>

          {/* Target system */}
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3 h-3 text-dreeso-dark-500 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[11px] text-dreeso-dark-500 truncate">
              {targetSystemName}
            </span>
          </div>

          {/* Execute button */}
          <button
            type="button"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              canExecute
                ? 'bg-dreeso-accent-500/10 text-dreeso-accent-400 border border-dreeso-accent-500/20 hover:bg-dreeso-accent-500/20 hover:text-dreeso-accent-300'
                : 'bg-dreeso-dark-800/50 text-dreeso-dark-500 border border-glass-border cursor-not-allowed'
            }`}
            onClick={canExecute ? () => onExecute(action) : undefined}
            disabled={!canExecute}
            aria-label={canExecute ? `Execute ${action.label}` : `Cannot execute ${action.label}`}
            title={!canExecute && Array.isArray(reasons) && reasons.length > 0 ? reasons.join('; ') : ''}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            {canExecute ? 'Execute Action' : 'Insufficient Permissions'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

ActionCard.propTypes = {
  action: PropTypes.object.isRequired,
  accentColor: PropTypes.string,
  onExecute: PropTypes.func.isRequired,
  canExecute: PropTypes.bool.isRequired,
  reasons: PropTypes.arrayOf(PropTypes.string),
};

/**
 * ActionPanel component.
 * Displays available actions for the current query context in a glassmorphism card.
 * Each action shows label, target system, and execute button. On execute, calls
 * ActionExecutor, shows confirmation via Notification, and triggers
 * CrossDomainPropagator if applicable.
 *
 * @param {object} props
 * @param {string} [props.category] - Optional category to filter actions.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {string} [props.title='Available Actions'] - Section title.
 * @param {boolean} [props.showTitle=true] - Whether to display the section title.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {boolean} [props.compact=false] - Whether to use compact layout.
 * @param {string} [props.accentColor] - Override accent color.
 * @param {function} [props.onActionExecuted] - Callback when an action is successfully executed.
 * @param {function} [props.onPropagationComplete] - Callback when propagation completes.
 * @param {number} [props.maxActions=6] - Maximum number of actions to display.
 * @returns {import('react').ReactElement} The action panel element.
 */
export function ActionPanel({
  category,
  className = '',
  title = 'Available Actions',
  showTitle = true,
  animated = true,
  compact = false,
  accentColor: overrideAccentColor,
  onActionExecuted,
  onPropagationComplete,
  maxActions = 6,
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const { addNotification } = useApp();

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPreview, setConfirmPreview] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [propagationResult, setPropagationResult] = useState(null);

  const resolvedAccentColor = overrideAccentColor
    || (currentPersona ? currentPersona.colorTheme : '#17b363');

  /**
   * Available actions for the current persona, optionally filtered by category.
   * @type {{ action: object, canExecute: boolean, reasons: string[] }[]}
   */
  const actionItems = useMemo(() => {
    if (!currentPersonaId) {
      return [];
    }

    const actions = category
      ? getActionsByCategory(currentPersonaId, category)
      : getActionsForPersona(currentPersonaId);

    const resolvedMax = typeof maxActions === 'number' && maxActions > 0
      ? Math.min(maxActions, 20)
      : 6;

    return actions.slice(0, resolvedMax).map((action) => {
      const validation = validateActionExecution(action.id, currentPersonaId);
      return {
        action,
        canExecute: validation.canExecute,
        reasons: validation.reasons,
      };
    });
  }, [currentPersonaId, category, maxActions]);

  /**
   * Handle execute button click — open confirmation dialog.
   * @param {object} action - The action to execute.
   */
  const handleExecuteClick = useCallback((action) => {
    if (!action || !action.id) {
      return;
    }

    try {
      const preview = getActionPreview(action.id);
      setConfirmAction(action);
      setConfirmPreview(preview);
    } catch (_err) {
      setConfirmAction(action);
      setConfirmPreview(null);
    }
  }, []);

  /**
   * Handle confirmation — execute the action and propagate.
   */
  const handleConfirm = useCallback(() => {
    if (!confirmAction || !currentPersonaId) {
      return;
    }

    setIsExecuting(true);

    // Simulate a small delay for UX
    setTimeout(() => {
      try {
        const result = executeAction(confirmAction.id, {}, currentPersonaId);

        if (result.status === 'success') {
          addNotification('success', `Action "${result.actionLabel}" executed successfully.`);

          // Trigger cross-domain propagation
          try {
            const propResult = propagate(result);
            setPropagationResult(propResult);

            if (typeof onPropagationComplete === 'function') {
              onPropagationComplete(propResult);
            }

            if (propResult.notifications && propResult.notifications.length > 0) {
              addNotification(
                'info',
                `${propResult.notifications.length} notification(s) sent to affected personas.`
              );
            }
          } catch (_propErr) {
            addNotification('warning', 'Action executed but propagation encountered an issue.');
          }

          if (typeof onActionExecuted === 'function') {
            onActionExecuted(result);
          }
        } else if (result.status === 'unauthorized') {
          addNotification('error', result.message || 'You are not authorized to perform this action.');
        } else {
          addNotification('error', result.message || 'Action execution failed.');
        }
      } catch (err) {
        const errorMessage = err && err.message ? err.message : 'An unexpected error occurred.';
        addNotification('error', errorMessage);
      }

      setIsExecuting(false);
      setConfirmAction(null);
      setConfirmPreview(null);
    }, 600);
  }, [confirmAction, currentPersonaId, addNotification, onActionExecuted, onPropagationComplete]);

  /**
   * Handle cancel — close confirmation dialog.
   */
  const handleCancel = useCallback(() => {
    if (!isExecuting) {
      setConfirmAction(null);
      setConfirmPreview(null);
    }
  }, [isExecuting]);

  /**
   * Handle dismiss propagation result.
   */
  const handleDismissPropagation = useCallback(() => {
    setPropagationResult(null);
  }, []);

  const hasActions = actionItems.length > 0;
  const hasTitle = showTitle && typeof title === 'string' && title.trim() !== '';
  const animationClass = animated ? 'animate-slide-in' : '';

  // No persona selected
  if (!currentPersonaId) {
    return (
      <div className={`w-full ${className}`}>
        {hasTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 mb-4">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400">
          Select a persona to view available actions.
        </div>
      </div>
    );
  }

  // No actions available
  if (!hasActions) {
    return (
      <div className={`w-full ${className}`}>
        {hasTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 mb-4">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400">
          No actions available for this persona{category ? ` in the "${category}" category` : ''}.
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${animationClass} ${className}`}>
      {hasTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
            {title}
          </h2>
          <span className="text-xs text-dreeso-dark-500">
            {actionItems.length} {actionItems.length === 1 ? 'action' : 'actions'}
          </span>
        </div>
      )}

      {/* Propagation result */}
      {propagationResult && (
        <GlassCard variant="sm" animated className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
            Cross-Domain Propagation
          </h3>
          <PropagationResult
            result={propagationResult}
            onDismiss={handleDismissPropagation}
          />
        </GlassCard>
      )}

      {/* Action cards grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {actionItems.map(({ action, canExecute, reasons }) => (
          <ActionCard
            key={action.id}
            action={action}
            accentColor={resolvedAccentColor}
            onExecute={handleExecuteClick}
            canExecute={canExecute}
            reasons={reasons}
          />
        ))}
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={confirmAction !== null}
        action={confirmAction}
        preview={confirmPreview}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isExecuting={isExecuting}
      />
    </div>
  );
}

ActionPanel.propTypes = {
  category: PropTypes.string,
  className: PropTypes.string,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  animated: PropTypes.bool,
  compact: PropTypes.bool,
  accentColor: PropTypes.string,
  onActionExecuted: PropTypes.func,
  onPropagationComplete: PropTypes.func,
  maxActions: PropTypes.number,
};

export default ActionPanel;