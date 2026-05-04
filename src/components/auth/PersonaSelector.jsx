/**
 * PersonaSelector — Persona demo login selector component for Ask Dreeso Memory.
 * Displays four persona cards with avatar, name, role, and 'Login as' button.
 * Used on the login screen for quick persona switching. Each card has
 * persona-specific accent color and hover animation.
 *
 * @module PersonaSelector
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { usePersona } from '@/contexts/PersonaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

/**
 * Role description mappings for each persona.
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
 * PersonaCard — Renders a single persona card with avatar, name, role,
 * description, focus tags, and login button.
 *
 * @param {object} props
 * @param {object} props.persona - The persona data object.
 * @param {boolean} props.isActive - Whether this persona is currently selected.
 * @param {boolean} props.isLoading - Whether a login is in progress for this persona.
 * @param {function} props.onSelect - Callback when the persona is selected.
 * @param {boolean} props.animated - Whether to apply slide-in animation.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement|null} The persona card element.
 */
function PersonaCard({ persona, isActive, isLoading, onSelect, animated, index }) {
  if (!persona || typeof persona !== 'object') {
    return null;
  }

  const description = PERSONA_DESCRIPTIONS[persona.id] || '';
  const tags = PERSONA_TAGS[persona.id] || [];
  const accentColor = persona.colorTheme || '#17b363';

  const animationStyle = animated
    ? { animationDelay: `${index * 100}ms` }
    : {};

  const animationClass = animated ? 'animate-slide-in opacity-0' : '';

  /**
   * Handle card click — select this persona.
   */
  const handleClick = useCallback(() => {
    if (!isLoading && typeof onSelect === 'function') {
      onSelect(persona.id);
    }
  }, [isLoading, onSelect, persona.id]);

  /**
   * Handle keyboard activation.
   * @param {import('react').KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !isLoading) {
      event.preventDefault();
      if (typeof onSelect === 'function') {
        onSelect(persona.id);
      }
    }
  }, [isLoading, onSelect, persona.id]);

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
        }`}
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
                  Active
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

          {/* Login button */}
          <button
            type="button"
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 ${
              isLoading
                ? 'bg-dreeso-dark-800/50 text-dreeso-dark-500 border border-glass-border cursor-not-allowed'
                : isActive
                  ? 'bg-dreeso-accent-500/10 text-dreeso-accent-400 border border-dreeso-accent-500/20 hover:bg-dreeso-accent-500/20 hover:text-dreeso-accent-300 focus:ring-dreeso-accent-500'
                  : 'text-white border border-glass-border hover:bg-glass-hover hover:border-glass-hover focus:ring-glass-border'
            }`}
            style={
              !isLoading && !isActive
                ? {
                    '--btn-accent': accentColor,
                  }
                : {}
            }
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label={`Login as ${persona.name}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                {isActive ? 'Currently Active' : `Login as ${persona.name.split(' ')[0]}`}
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

PersonaCard.propTypes = {
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
  onSelect: PropTypes.func.isRequired,
  animated: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * PersonaSelector component.
 * Displays four persona cards with avatar, name, role, and 'Login as' button.
 * Used on the login screen for quick persona switching. Each card has
 * persona-specific accent color and hover animation.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation to persona cards.
 * @param {string} [props.title='Select a Persona'] - Section title displayed above the cards.
 * @param {boolean} [props.showTitle=true] - Whether to display the section title.
 * @param {string} [props.subtitle=''] - Optional subtitle text below the title.
 * @param {boolean} [props.showSubtitle=true] - Whether to display the subtitle.
 * @param {boolean} [props.compact=false] - Whether to use compact layout (2 columns on mobile).
 * @param {function} [props.onPersonaSelected] - Optional callback after a persona is successfully selected.
 *   Receives the persona ID string.
 * @param {function} [props.onLoginComplete] - Optional callback after login is complete.
 *   Receives the session object.
 * @returns {import('react').ReactElement} The persona selector element.
 */
export function PersonaSelector({
  className = '',
  animated = true,
  title = 'Select a Persona',
  showTitle = true,
  subtitle = 'Choose a role to explore the system from their perspective.',
  showSubtitle = true,
  compact = false,
  onPersonaSelected,
  onLoginComplete,
}) {
  const { currentPersonaId, personaList, setPersona } = usePersona();
  const { loginAsPersona } = useAuth();
  const { addNotification } = useApp();

  const [loadingPersonaId, setLoadingPersonaId] = useState(null);

  /**
   * Handle persona selection — set persona and login.
   * @param {string} personaId - The persona ID to select.
   */
  const handleSelectPersona = useCallback((personaId) => {
    if (!personaId || typeof personaId !== 'string' || loadingPersonaId) {
      return;
    }

    setLoadingPersonaId(personaId);

    // Simulate a small delay for UX
    setTimeout(() => {
      try {
        // Set the persona in PersonaContext
        setPersona(personaId);

        // Login as the persona via AuthContext
        const session = loginAsPersona(personaId);

        // Find the persona name for the notification
        const persona = personaList.find((p) => p.id === personaId);
        const personaName = persona ? persona.name : personaId;

        addNotification('success', `Logged in as ${personaName}`);

        if (typeof onPersonaSelected === 'function') {
          onPersonaSelected(personaId);
        }

        if (typeof onLoginComplete === 'function') {
          onLoginComplete(session);
        }
      } catch (err) {
        const errorMessage = err && err.message ? err.message : 'Failed to login as persona';
        addNotification('error', errorMessage);
      }

      setLoadingPersonaId(null);
    }, 400);
  }, [loadingPersonaId, setPersona, loginAsPersona, personaList, addNotification, onPersonaSelected, onLoginComplete]);

  const hasTitle = showTitle && typeof title === 'string' && title.trim() !== '';
  const hasSubtitle = showSubtitle && typeof subtitle === 'string' && subtitle.trim() !== '';
  const animationClass = animated ? 'animate-slide-in' : '';

  const gridClass = compact
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6';

  return (
    <div
      className={`w-full space-y-6 ${animationClass} ${className}`}
      role="region"
      aria-label="Persona selector"
    >
      {/* Header */}
      {(hasTitle || hasSubtitle) && (
        <div className="text-center space-y-2">
          {hasTitle && (
            <h2 className="text-xl font-semibold text-white">
              {title}
            </h2>
          )}
          {hasSubtitle && (
            <p className="text-sm text-dreeso-dark-400 max-w-lg mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Persona cards grid */}
      {Array.isArray(personaList) && personaList.length > 0 ? (
        <div className={gridClass}>
          {personaList.map((persona, index) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isActive={persona.id === currentPersonaId}
              isLoading={loadingPersonaId === persona.id}
              onSelect={handleSelectPersona}
              animated={animated}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400">
          No personas available.
        </div>
      )}

      {/* Keyboard shortcut hints */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {personaList.map((persona, index) => (
          <div
            key={`hint-${persona.id}`}
            className="flex items-center gap-1.5"
          >
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
              {index + 1}
            </kbd>
            <span className="text-[10px] text-dreeso-dark-500 hidden sm:inline">
              {persona.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

PersonaSelector.propTypes = {
  className: PropTypes.string,
  animated: PropTypes.bool,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  subtitle: PropTypes.string,
  showSubtitle: PropTypes.bool,
  compact: PropTypes.bool,
  onPersonaSelected: PropTypes.func,
  onLoginComplete: PropTypes.func,
};

export default PersonaSelector;