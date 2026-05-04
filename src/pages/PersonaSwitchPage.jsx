/**
 * PersonaSwitchPage — Persona switch page for Ask Dreeso Memory (Screen 20).
 * Allows switching to a different persona mid-session. Displays all four persona
 * cards with current persona highlighted. On switch, resets session data, loads
 * new persona context, and redirects to new persona's home. Transition animation
 * between personas.
 *
 * @module PersonaSwitchPage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getData } from '@/services/dataManager';
import { log as auditLog } from '@/services/auditLogger';
import { APP_TITLE, APP_VERSION, SCREEN_IDS, PERSONA_LIST } from '@/utils/constants';

/**
 * Persona-specific descriptions for the switch page.
 * @type {Record<string, string>}
 */
const PERSONA_DESCRIPTIONS = {
  'persona-lukas': 'Strategic portfolio oversight, budget control, risk management, and executive reporting across all active projects.',
  'persona-elena': 'Detailed cost analysis, procurement intelligence, valuation tracking, and quantity benchmarking for project financials.',
  'persona-sophie': 'Schedule management, resource allocation, progress tracking, and stakeholder communications for active projects.',
  'persona-james': 'Sales pipeline management, client insights, market intelligence, and revenue forecasting for business development.',
};

/**
 * Focus area tags for each persona.
 * @type {Record<string, string[]>}
 */
const PERSONA_TAGS = {
  'persona-lukas': ['Portfolio', 'Strategy', 'Risk', 'Reporting'],
  'persona-elena': ['Cost', 'Procurement', 'Valuation', 'Analysis'],
  'persona-sophie': ['Schedule', 'Resources', 'Progress', 'Quality'],
  'persona-james': ['Pipeline', 'Clients', 'Market', 'Revenue'],
};

/**
 * Persona-specific cluster counts.
 * @type {Record<string, number>}
 */
const PERSONA_CLUSTER_COUNTS = {
  'persona-lukas': 6,
  'persona-elena': 6,
  'persona-sophie': 6,
  'persona-james': 6,
};

/**
 * Persona-specific action counts.
 * @type {Record<string, number>}
 */
const PERSONA_ACTION_COUNTS = {
  'persona-lukas': 8,
  'persona-elena': 7,
  'persona-sophie': 7,
  'persona-james': 5,
};

/**
 * Resolve the dashboard screen ID for a persona.
 * @param {string} personaId - The persona ID.
 * @returns {string} The screen ID for the persona's dashboard.
 */
function resolveDashboardScreenId(personaId) {
  switch (personaId) {
    case 'persona-lukas':
      return SCREEN_IDS.LUKAS_DASHBOARD;
    case 'persona-elena':
      return SCREEN_IDS.ELENA_DASHBOARD;
    case 'persona-sophie':
      return SCREEN_IDS.SOPHIE_DASHBOARD;
    case 'persona-james':
      return SCREEN_IDS.JAMES_DASHBOARD;
    default:
      return SCREEN_IDS.WELCOME;
  }
}

/**
 * TransitionOverlay — Renders a full-screen transition animation between personas.
 *
 * @param {object} props
 * @param {boolean} props.isVisible - Whether the overlay is visible.
 * @param {object|null} props.targetPersona - The persona being switched to.
 * @returns {import('react').ReactElement|null} The transition overlay element.
 */
function TransitionOverlay({ isVisible, targetPersona }) {
  if (!isVisible || !targetPersona) {
    return null;
  }

  const accentColor = targetPersona.colorTheme || '#17b363';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dreeso-dark-950/95 backdrop-blur-lg animate-scale-up">
      {/* Radial glow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-10"
        style={{ backgroundColor: accentColor }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-slide-in">
        {/* Spinner */}
        <div className="relative">
          <Avatar
            initials={targetPersona.avatarInitials}
            colorTheme={accentColor}
            size="xl"
            ring
            ariaLabel={`Switching to ${targetPersona.name}`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-20 w-20 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: accentColor,
                borderRightColor: `${accentColor}40`,
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-dreeso-dark-300">Switching to</p>
          <h2 className="text-xl font-semibold text-white">
            {targetPersona.name}
          </h2>
          <p className="text-xs text-dreeso-dark-400">
            {targetPersona.role}
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full animate-pulse-green"
            style={{ backgroundColor: accentColor, animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 rounded-full animate-pulse-green"
            style={{ backgroundColor: accentColor, animationDelay: '200ms' }}
          />
          <div
            className="h-2 w-2 rounded-full animate-pulse-green"
            style={{ backgroundColor: accentColor, animationDelay: '400ms' }}
          />
        </div>

        <p className="text-xs text-dreeso-dark-500">
          Loading persona context and intelligence clusters...
        </p>
      </div>
    </div>
  );
}

TransitionOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  targetPersona: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    avatarInitials: PropTypes.string,
    colorTheme: PropTypes.string,
  }),
};

/**
 * PersonaSwitchCard — Renders a single persona card for the switch page.
 *
 * @param {object} props
 * @param {object} props.persona - The persona data object.
 * @param {boolean} props.isActive - Whether this persona is currently selected.
 * @param {boolean} props.isLoading - Whether a switch is in progress for this persona.
 * @param {boolean} props.isAnyLoading - Whether any switch is in progress.
 * @param {function} props.onSelect - Callback when the persona is selected.
 * @param {boolean} props.animated - Whether to apply slide-in animation.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The persona switch card element.
 */
function PersonaSwitchCard({ persona, isActive, isLoading, isAnyLoading, onSelect, animated, index }) {
  if (!persona || typeof persona !== 'object') {
    return null;
  }

  const description = PERSONA_DESCRIPTIONS[persona.id] || '';
  const tags = PERSONA_TAGS[persona.id] || [];
  const clusterCount = PERSONA_CLUSTER_COUNTS[persona.id] || 0;
  const actionCount = PERSONA_ACTION_COUNTS[persona.id] || 0;
  const accentColor = persona.colorTheme || '#17b363';

  const animationStyle = animated
    ? { animationDelay: `${index * 100}ms` }
    : {};

  const animationClass = animated ? 'animate-slide-in opacity-0' : '';

  /**
   * Handle card click — select this persona.
   */
  const handleClick = useCallback(() => {
    if (!isLoading && !isAnyLoading && typeof onSelect === 'function') {
      onSelect(persona.id);
    }
  }, [isLoading, isAnyLoading, onSelect, persona.id]);

  /**
   * Handle keyboard activation.
   * @param {import('react').KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !isLoading && !isAnyLoading) {
      event.preventDefault();
      if (typeof onSelect === 'function') {
        onSelect(persona.id);
      }
    }
  }, [isLoading, isAnyLoading, onSelect, persona.id]);

  return (
    <div
      className={`group ${animationClass}`}
      style={animationStyle}
    >
      <GlassCard
        variant="default"
        animated={false}
        hoverable
        noPadding
        className={`p-6 transition-all duration-200 ease-out hover:shadow-glass-lg ${
          isActive
            ? 'border-opacity-50 shadow-glass-lg'
            : 'hover:border-glass-hover'
        } ${isAnyLoading && !isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="space-y-4">
          {/* Header: Avatar + Name + Role */}
          <div className="flex items-start gap-4">
            <Avatar
              initials={persona.avatarInitials}
              colorTheme={accentColor}
              size="lg"
              ring={isActive}
              ariaLabel={`Avatar for ${persona.name}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white leading-tight truncate group-hover:text-dreeso-accent-300 transition-colors duration-150">
                {persona.name}
              </h3>
              <p className="text-sm text-dreeso-dark-400 mt-0.5 truncate">
                {persona.role}
              </p>
              {isActive && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Current Persona
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-dreeso-dark-300 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}

          {/* Focus area tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={`${persona.id}-tag-${tag}`}
                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded"
                  style={{
                    color: accentColor,
                    backgroundColor: `${accentColor}10`,
                    borderColor: `${accentColor}20`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] text-dreeso-dark-400">
                {clusterCount} clusters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] text-dreeso-dark-400">
                {actionCount} actions
              </span>
            </div>
            {Array.isArray(persona.permissions) && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] text-dreeso-dark-400">
                  {persona.permissions.length} permissions
                </span>
              </div>
            )}
          </div>

          {/* Switch button */}
          <button
            type="button"
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 ${
              isLoading
                ? 'bg-dreeso-dark-800/50 text-dreeso-dark-500 border border-glass-border cursor-not-allowed'
                : isActive
                  ? 'bg-dreeso-accent-500/10 text-dreeso-accent-400 border border-dreeso-accent-500/20 hover:bg-dreeso-accent-500/20 hover:text-dreeso-accent-300 focus:ring-dreeso-accent-500'
                  : isAnyLoading
                    ? 'bg-dreeso-dark-800/50 text-dreeso-dark-500 border border-glass-border cursor-not-allowed'
                    : 'text-white border border-glass-border hover:bg-glass-hover hover:border-glass-hover focus:ring-glass-border'
            }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isAnyLoading}
            aria-label={isActive ? `Currently active as ${persona.name}` : `Switch to ${persona.name}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Switching...
              </span>
            ) : isActive ? (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Currently Active
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                Switch to {persona.name.split(' ')[0]}
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

PersonaSwitchCard.propTypes = {
  persona: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    avatarInitials: PropTypes.string,
    colorTheme: PropTypes.string,
    permissions: PropTypes.arrayOf(PropTypes.string),
    clusterIds: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isAnyLoading: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  animated: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * SessionResetNotice — Renders a notice about session data being reset on switch.
 *
 * @param {object} props
 * @param {string} [props.accentColor] - The accent color.
 * @returns {import('react').ReactElement} The session reset notice element.
 */
function SessionResetNotice({ accentColor }) {
  return (
    <div className="animate-slide-in">
      <GlassCard
        variant="sm"
        animated={false}
        hoverable={false}
        noPadding
        className="p-4"
      >
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">
              What Happens When You Switch
            </h3>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-dreeso-dark-300 leading-relaxed">
                  Intelligence clusters and query suggestions update to the new persona&apos;s role.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-dreeso-dark-300 leading-relaxed">
                  Available actions and permissions change to match the new persona.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-dreeso-dark-300 leading-relaxed">
                  Your audit trail is preserved — all previous activity remains logged.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-dreeso-dark-300 leading-relaxed">
                  You&apos;ll be redirected to the new persona&apos;s dashboard.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

SessionResetNotice.propTypes = {
  accentColor: PropTypes.string,
};

/**
 * PersonaSwitchPage component.
 * Allows switching to a different persona mid-session. Displays all four persona
 * cards with current persona highlighted. On switch, resets session data, loads
 * new persona context, and redirects to new persona's home. Transition animation
 * between personas.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {function} [props.onPersonaSwitched] - Optional callback after a persona switch completes.
 *   Receives the new persona ID string.
 * @param {function} [props.onCancel] - Optional callback when the user cancels the switch.
 * @returns {import('react').ReactElement} The persona switch page element.
 */
export function PersonaSwitchPage({
  className = '',
  onPersonaSwitched,
  onCancel,
}) {
  const { currentPersonaId, currentPersona, personaList, setPersona } = usePersona();
  const { loginAsPersona, isAuthenticated } = useAuth();
  const { addNotification, goToScreenById } = useApp();
  const navigate = useNavigate();

  const [loadingPersonaId, setLoadingPersonaId] = useState(null);
  const [showTransition, setShowTransition] = useState(false);
  const [targetPersona, setTargetPersona] = useState(null);

  const mountedRef = useRef(true);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Handle persona selection — switch persona with transition animation.
   * @param {string} personaId - The persona ID to switch to.
   */
  const handleSelectPersona = useCallback((personaId) => {
    if (!personaId || typeof personaId !== 'string' || loadingPersonaId) {
      return;
    }

    // If selecting the current persona, just navigate to their dashboard
    if (personaId === currentPersonaId) {
      navigate('/home');
      return;
    }

    // Find the target persona for the transition overlay
    const target = personaList.find((p) => p.id === personaId);
    if (!target) {
      addNotification('error', 'Persona not found.');
      return;
    }

    setLoadingPersonaId(personaId);
    setTargetPersona(target);

    // Show transition overlay after a brief delay
    setTimeout(() => {
      if (!mountedRef.current) return;
      setShowTransition(true);
    }, 200);

    // Perform the actual switch after the transition animation starts
    setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        // Set the persona in PersonaContext
        setPersona(personaId);

        // Login as the persona via AuthContext
        if (isAuthenticated) {
          loginAsPersona(personaId);
        }

        // Log the switch
        auditLog('PERSONA_SWITCH', null, personaId, `Persona switched to ${target.name} from PersonaSwitchPage`, {
          previousPersonaId: currentPersonaId,
          newPersonaId: personaId,
          newPersonaName: target.name,
          source: 'PersonaSwitchPage',
        });

        addNotification('success', `Switched to ${target.name}`);

        if (typeof onPersonaSwitched === 'function') {
          onPersonaSwitched(personaId);
        }

        // Navigate to the new persona's dashboard after transition completes
        setTimeout(() => {
          if (!mountedRef.current) return;

          setShowTransition(false);
          setLoadingPersonaId(null);
          setTargetPersona(null);

          navigate('/home');
        }, 800);
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage = err && err.message ? err.message : 'Failed to switch persona';
        addNotification('error', errorMessage);
        setShowTransition(false);
        setLoadingPersonaId(null);
        setTargetPersona(null);
      }
    }, 600);
  }, [loadingPersonaId, currentPersonaId, personaList, setPersona, isAuthenticated, loginAsPersona, addNotification, onPersonaSwitched, goToScreenById]);

  /**
   * Handle cancel — navigate back to the current persona's dashboard.
   */
  const handleCancel = useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel();
      return;
    }

    if (currentPersonaId) {
      navigate('/home');
    } else {
      navigate('/');
    }
  }, [onCancel, currentPersonaId, navigate]);

  /**
   * All connected systems loaded from mock data.
   * @type {object[]}
   */
  const allSystems = useMemo(() => {
    return getData('systems');
  }, []);

  const isAnyLoading = loadingPersonaId !== null;

  return (
    <Layout showNavbar showQueryBar={false} keyboardEnabled>
      {/* Transition overlay */}
      <TransitionOverlay
        isVisible={showTransition}
        targetPersona={targetPersona}
      />

      <div className={`space-y-6 ${className}`}>
        {/* Page header */}
        <div className="animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center h-12 w-12 rounded-xl shrink-0"
                style={{
                  backgroundColor: `${resolvedAccentColor}15`,
                  color: resolvedAccentColor,
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                  Switch Persona
                </h1>
                <p className="text-sm text-dreeso-dark-300 leading-relaxed mt-1 max-w-2xl">
                  Choose a different role to explore the system from their perspective.
                  Each persona has unique intelligence clusters, actions, and permissions.
                </p>
                {currentPersona && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar
                      initials={currentPersona.avatarInitials}
                      colorTheme={resolvedAccentColor}
                      size="xs"
                      ariaLabel={`Current persona: ${currentPersona.name}`}
                    />
                    <span className="text-xs text-dreeso-dark-400">
                      Currently: <span className="text-white font-medium">{currentPersona.name}</span> — {currentPersona.role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel button */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border shrink-0"
              onClick={handleCancel}
              disabled={isAnyLoading}
              aria-label="Cancel and go back"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Persona cards — 8 columns on desktop */}
          <div className="col-span-12 lg:col-span-8">
            {/* Persona cards grid */}
            {Array.isArray(personaList) && personaList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {personaList.map((persona, index) => (
                  <PersonaSwitchCard
                    key={persona.id}
                    persona={persona}
                    isActive={persona.id === currentPersonaId}
                    isLoading={loadingPersonaId === persona.id}
                    isAnyLoading={isAnyLoading}
                    onSelect={handleSelectPersona}
                    animated
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400 animate-slide-in">
                No personas available.
              </div>
            )}
          </div>

          {/* Sidebar — 4 columns on desktop */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Session reset notice */}
            <SessionResetNotice accentColor={resolvedAccentColor} />

            {/* Connected systems */}
            <div className="animate-slide-in">
              <GlassCard
                variant="sm"
                animated={false}
                hoverable={false}
                noPadding
                className="p-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-dreeso-dark-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
                        Connected Systems
                      </h3>
                    </div>
                    <span className="text-[11px] text-dreeso-dark-500">
                      {allSystems.length} systems
                    </span>
                  </div>

                  <p className="text-xs text-dreeso-dark-300 leading-relaxed">
                    All personas share access to the same {allSystems.length} connected enterprise systems.
                    The difference is in the intelligence clusters, actions, and permissions available to each role.
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {allSystems.map((system) => (
                      <span
                        key={system.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-dreeso-dark-400 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap"
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: system.color || '#666666' }}
                        />
                        {system.shortName || system.name}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Keyboard shortcuts */}
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
                    {personaList.map((persona, index) => (
                      <div key={`shortcut-${persona.id}`} className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          {index + 1}
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">
                          {persona.name}
                        </span>
                        {persona.id === currentPersonaId && (
                          <span className="text-[10px] text-dreeso-accent-400 font-medium ml-auto">
                            active
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="pt-1 border-t border-glass-border/50">
                      <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                          N
                        </kbd>
                        <span className="text-[11px] text-dreeso-dark-400">Cycle Persona</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
                        F
                      </kbd>
                      <span className="text-[11px] text-dreeso-dark-400">Next Screen</span>
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

            {/* Quick navigation */}
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
                    Quick Navigation
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                      onClick={() => navigate('/')}
                      disabled={isAnyLoading}
                    >
                      <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                      </svg>
                      Back to Welcome
                    </button>
                    {currentPersonaId && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                        onClick={handleCancel}
                        disabled={isAnyLoading}
                      >
                        <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                        </svg>
                        Back to {currentPersona ? currentPersona.name.split(' ')[0] : ''}&apos;s Dashboard
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 text-left"
                      onClick={() => navigate('/cross-domain')}
                      disabled={isAnyLoading}
                    >
                      <svg className="w-3.5 h-3.5 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                      </svg>
                      Cross-Domain System Map
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
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

PersonaSwitchPage.propTypes = {
  className: PropTypes.string,
  onPersonaSwitched: PropTypes.func,
  onCancel: PropTypes.func,
};

export default PersonaSwitchPage;