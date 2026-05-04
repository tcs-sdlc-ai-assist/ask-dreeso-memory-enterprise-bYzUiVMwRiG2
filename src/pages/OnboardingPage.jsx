/**
 * OnboardingPage — Onboarding page for Ask Dreeso Memory (Screen 3).
 * Displays after first login with welcome message, persona overview,
 * platform capabilities summary, and 'Get Started' CTA.
 * Animated step-through with glassmorphism cards. Skippable via keyboard shortcut.
 *
 * @module OnboardingPage
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePersona } from '@/contexts/PersonaContext';
import { useApp } from '@/contexts/AppContext';
import { getData } from '@/services/dataManager';
import { APP_TITLE, APP_VERSION, SCREEN_IDS } from '@/utils/constants';

/**
 * Total number of onboarding steps.
 * @type {number}
 */
const TOTAL_STEPS = 4;

/**
 * Platform capability items displayed in step 3.
 * @type {object[]}
 */
const CAPABILITIES = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Intelligent Query Engine',
    description: 'Ask natural language questions and receive structured, data-rich responses from across all connected enterprise systems.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
      </svg>
    ),
    title: '10 Connected Systems',
    description: 'Seamlessly integrates with SAP, Primavera P6, Procore, Salesforce, Workday, and more — all in real time.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zm-6.5 4a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    title: 'Cross-Domain Propagation',
    description: 'Actions automatically propagate across connected systems with full transparency, confidence scoring, and audit trails.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Persona-Scoped Intelligence',
    description: 'Every query, action, and insight is tailored to your role — showing only what matters to you with the right level of detail.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Full Audit Trail',
    description: 'Every query, action, and propagation is logged with timestamps, persona context, and system attribution for complete transparency.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Actionable Intelligence',
    description: 'Go beyond insights — execute actions directly from query responses with confirmation dialogs and real-time system updates.',
  },
];

/**
 * StepIndicator — Renders the step progress dots.
 *
 * @param {object} props
 * @param {number} props.currentStep - The current step index (0-based).
 * @param {number} props.totalSteps - Total number of steps.
 * @param {string} [props.accentColor] - The accent color for the active dot.
 * @returns {import('react').ReactElement} The step indicator element.
 */
function StepIndicator({ currentStep, totalSteps, accentColor }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={`step-dot-${index}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive
                ? 'w-8'
                : 'w-2'
            } ${
              isCompleted
                ? 'opacity-60'
                : isActive
                  ? 'opacity-100'
                  : 'opacity-30'
            }`}
            style={{
              backgroundColor: isActive || isCompleted
                ? (accentColor || '#17b363')
                : '#5a5a5f',
            }}
            aria-label={`Step ${index + 1} of ${totalSteps}${isActive ? ' — current' : isCompleted ? ' — completed' : ''}`}
          />
        );
      })}
    </div>
  );
}

StepIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  accentColor: PropTypes.string,
};

/**
 * CapabilityCard — Renders a single platform capability card.
 *
 * @param {object} props
 * @param {import('react').ReactElement} props.icon - The icon element.
 * @param {string} props.title - The capability title.
 * @param {string} props.description - The capability description.
 * @param {string} [props.accentColor] - The accent color.
 * @param {number} props.index - The card index for staggered animation.
 * @returns {import('react').ReactElement} The capability card element.
 */
function CapabilityCard({ icon, title, description, accentColor, index }) {
  const animationStyle = { animationDelay: `${index * 100}ms` };

  return (
    <div
      className="animate-slide-in opacity-0"
      style={animationStyle}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable
        noPadding
        className="p-4 transition-all duration-200 ease-out hover:shadow-glass-lg hover:border-glass-hover h-full"
      >
        <div className="space-y-2.5">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
            style={{
              backgroundColor: accentColor ? `${accentColor}15` : 'rgba(23, 179, 99, 0.08)',
              color: accentColor || '#17b363',
            }}
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs text-dreeso-dark-300 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

CapabilityCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accentColor: PropTypes.string,
  index: PropTypes.number.isRequired,
};

/**
 * PersonaOverviewCard — Renders a persona overview card for the onboarding step.
 *
 * @param {object} props
 * @param {object} props.persona - The persona object.
 * @param {boolean} props.isCurrentPersona - Whether this is the current persona.
 * @returns {import('react').ReactElement|null} The persona overview card element.
 */
function PersonaOverviewCard({ persona, isCurrentPersona }) {
  if (!persona || typeof persona !== 'object') {
    return null;
  }

  const accentColor = persona.colorTheme || '#17b363';

  return (
    <div className={`${isCurrentPersona ? 'ring-1 ring-offset-1 ring-offset-dreeso-dark-950 rounded-2xl' : ''}`}
      style={isCurrentPersona ? { '--tw-ring-color': accentColor } : {}}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable={false}
        noPadding
        className={`p-4 transition-all duration-200 ${isCurrentPersona ? 'border-opacity-50 shadow-glass-lg' : ''}`}
      >
        <div className="flex items-start gap-3">
          <Avatar
            initials={persona.avatarInitials}
            colorTheme={accentColor}
            size="md"
            ring={isCurrentPersona}
            ariaLabel={`Avatar for ${persona.name}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white leading-tight truncate">
                {persona.name}
              </h3>
              {isCurrentPersona && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg shrink-0">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-dreeso-dark-400 mt-0.5 truncate">
              {persona.role}
            </p>
            {Array.isArray(persona.permissions) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {persona.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={`${persona.id}-perm-${perm}`}
                    className="px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider border rounded"
                    style={{
                      color: accentColor,
                      backgroundColor: `${accentColor}10`,
                      borderColor: `${accentColor}20`,
                    }}
                  >
                    {perm.replace(/_/g, ' ')}
                  </span>
                ))}
                {persona.permissions.length > 3 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-medium text-dreeso-dark-500">
                    +{persona.permissions.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

PersonaOverviewCard.propTypes = {
  persona: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    avatarInitials: PropTypes.string,
    colorTheme: PropTypes.string,
    permissions: PropTypes.arrayOf(PropTypes.string),
  }),
  isCurrentPersona: PropTypes.bool.isRequired,
};

/**
 * OnboardingPage component.
 * Displays after first login with welcome message, persona overview,
 * platform capabilities summary, and 'Get Started' CTA.
 * Animated step-through with glassmorphism cards. Skippable via keyboard shortcut.
 *
 * @param {object} props
 * @param {function} [props.onComplete] - Optional callback when onboarding is completed or skipped.
 * @param {function} [props.onSkip] - Optional callback when onboarding is skipped.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The onboarding page element.
 */
export function OnboardingPage({
  onComplete,
  onSkip,
  className = '',
}) {
  const { session } = useAuth();
  const { currentPersonaId, currentPersona, personaList } = usePersona();
  const { goToScreenById, addNotification } = useApp();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const mountedRef = useRef(true);

  const resolvedAccentColor = currentPersona ? currentPersona.colorTheme : '#17b363';
  const displayName = session ? session.displayName : (currentPersona ? currentPersona.name : 'there');

  /**
   * All connected systems loaded from mock data.
   * @type {object[]}
   */
  const allSystems = getData('systems');

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Handle completing the onboarding.
   */
  const handleComplete = useCallback(() => {
    addNotification('success', 'Welcome aboard! Let\'s explore your dashboard.');

    if (typeof onComplete === 'function') {
      onComplete();
    }

    // Navigate to dashboard
    navigate('/home');

  }, [currentPersonaId, goToScreenById, addNotification, onComplete, navigate]);

  /**
   * Handle skipping the onboarding.
   */
  const handleSkip = useCallback(() => {
    addNotification('info', 'Onboarding skipped. You can explore at your own pace.');

    if (typeof onSkip === 'function') {
      onSkip();
    }

    handleComplete();
  }, [addNotification, onSkip, handleComplete]);

  /**
   * Handle advancing to the next step.
   */
  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  /**
   * Handle going back to the previous step.
   */
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Keyboard shortcut handler
  useEffect(() => {
    /**
     * Handle keyboard events for onboarding navigation.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    function handleKeyDown(event) {
      const tagName = event.target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrev();
          break;
        case 'Escape':
        case 's':
        case 'S':
          event.preventDefault();
          handleSkip();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, handleSkip]);

  /**
   * Render step 1: Welcome message.
   * @returns {import('react').ReactElement} The welcome step content.
   */
  function renderWelcomeStep() {
    return (
      <div className="space-y-6 text-center animate-slide-in">
        {/* Logo */}
        <div className="flex justify-center">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-accent-glow"
            style={{ backgroundColor: resolvedAccentColor }}
          >
            <svg className="w-11 h-11 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.404 5.404a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zm8.131 8.132a.75.75 0 011.06 0l1.061 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.404 14.596a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm8.131-8.132a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.061 1.06l-1.06 1.06a.75.75 0 01-1.061 0z" />
              <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Welcome text */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Welcome, {displayName}!
          </h1>
          <p className="text-base sm:text-lg text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed">
            {APP_TITLE} is your enterprise knowledge and memory assistant — connecting insights across your entire project ecosystem.
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{allSystems.length}</p>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">Connected Systems</p>
          </div>
          <div className="h-8 w-px bg-glass-border" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{personaList.length}</p>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">Persona Roles</p>
          </div>
          <div className="h-8 w-px bg-glass-border" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">24</p>
            <p className="text-xs text-dreeso-dark-400 mt-0.5">Intelligence Clusters</p>
          </div>
        </div>

        {/* Immediate Get Started for Step 0 */}
        <div className="pt-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 bg-dreeso-accent-500 hover:bg-dreeso-accent-600 hover:shadow-accent-glow"
            onClick={handleComplete}
          >
            Get Started
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render step 2: Persona overview.
   * @returns {import('react').ReactElement} The persona overview step content.
   */
  function renderPersonaStep() {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Your Role & Peers
          </h2>
          <p className="text-sm text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed">
            {APP_TITLE} adapts to each persona&apos;s role, showing tailored intelligence clusters, actions, and insights.
            {currentPersona && (
              <span> You&apos;re currently exploring as <span className="font-medium text-white">{currentPersona.name}</span> — {currentPersona.role}.</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.isArray(personaList) && personaList.map((persona) => (
            <PersonaOverviewCard
              key={persona.id}
              persona={persona}
              isCurrentPersona={persona.id === currentPersonaId}
            />
          ))}
        </div>

        {currentPersona && (
          <div className="px-4 py-3 bg-glass-white border border-glass-border rounded-xl">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-semantic-info shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-dreeso-dark-300 leading-relaxed">
                You can switch between personas at any time using the persona switcher in the navigation bar, or press <kbd className="px-1 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">N</kbd> to cycle through personas.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /**
   * Render step 3: Platform capabilities.
   * @returns {import('react').ReactElement} The capabilities step content.
   */
  function renderCapabilitiesStep() {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Platform Capabilities
          </h2>
          <p className="text-sm text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed">
            Explore the key features that make {APP_TITLE} your single source of truth across all enterprise systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((capability, index) => (
            <CapabilityCard
              key={`capability-${index}`}
              icon={capability.icon}
              title={capability.title}
              description={capability.description}
              accentColor={resolvedAccentColor}
              index={index}
            />
          ))}
        </div>

        {/* Connected systems strip */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400 text-center">
            Connected Enterprise Systems
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {allSystems.map((system) => (
              <span
                key={system.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: system.color || '#666666' }}
                />
                {system.shortName || system.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render step 4: Get Started CTA.
   * @returns {import('react').ReactElement} The get started step content.
   */
  function renderGetStartedStep() {
    return (
      <div className="space-y-8 text-center animate-slide-in">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-semantic-success/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-semantic-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Ready message */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            You&apos;re All Set!
          </h2>
          <p className="text-base text-dreeso-dark-300 max-w-lg mx-auto leading-relaxed">
            Your personalized dashboard is ready. Start by exploring your intelligence clusters or ask a question using the query bar.
          </p>
        </div>

        {/* Quick tips */}
        <div className="max-w-md mx-auto">
          <GlassCard variant="sm" animated={false} className="space-y-3 text-left">
            <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
              Quick Tips
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-5 w-5 rounded bg-dreeso-accent-500/10 text-dreeso-accent-400 shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold">1</span>
                </div>
                <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                  Click on any <span className="font-medium text-white">intelligence cluster</span> to trigger a pre-built query for your role.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-5 w-5 rounded bg-dreeso-accent-500/10 text-dreeso-accent-400 shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold">2</span>
                </div>
                <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                  Use the <span className="font-medium text-white">query bar</span> at the bottom to ask natural language questions.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center h-5 w-5 rounded bg-dreeso-accent-500/10 text-dreeso-accent-400 shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold">3</span>
                </div>
                <p className="text-xs text-dreeso-dark-200 leading-relaxed">
                  Follow the <span className="font-medium text-white">CTA bubbles</span> after each response for contextual follow-up queries.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Keyboard shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">F</kbd>
            <span className="text-[10px] text-dreeso-dark-500">Next Screen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">N</kbd>
            <span className="text-[10px] text-dreeso-dark-500">Switch Persona</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">R</kbd>
            <span className="text-[10px] text-dreeso-dark-500">Restart</span>
          </div>
        </div>

        {/* Get Started button */}
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 bg-dreeso-accent-500 hover:bg-dreeso-accent-600 hover:shadow-accent-glow"
            onClick={handleComplete}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render the current step content.
   * @returns {import('react').ReactElement} The current step content.
   */
  function renderCurrentStep() {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderPersonaStep();
      case 2:
        return renderCapabilitiesStep();
      case 3:
        return renderGetStartedStep();
      default:
        return renderWelcomeStep();
    }
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center bg-dreeso-dark-950 overflow-hidden ${className}`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[spin_60s_linear_infinite] opacity-[0.03]"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #17b363, #276ef1, #ffc043, #e11900, #17b363)',
          }}
        />
      </div>

      {/* Radial glow accents */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-5"
        style={{ backgroundColor: resolvedAccentColor }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center gap-8">
        {/* Skip button */}
        {!isLastStep && (
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dreeso-dark-400 hover:text-white bg-glass-white border border-glass-border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={handleSkip}
              aria-label="Skip onboarding"
            >
              Skip
              <kbd className="px-1 py-0.5 text-[9px] font-mono text-dreeso-dark-500 bg-dreeso-dark-800 border border-glass-border rounded">
                Esc
              </kbd>
            </button>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex flex-col items-center gap-3">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            accentColor={resolvedAccentColor}
          />
          <span className="text-[11px] text-dreeso-dark-500">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Step content */}
        <div className="w-full">
          {renderCurrentStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between w-full max-w-md pt-4">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border ${
              isFirstStep
                ? 'text-dreeso-dark-600 cursor-not-allowed'
                : 'text-dreeso-dark-300 hover:text-white bg-glass-white border border-glass-border hover:bg-glass-hover'
            }`}
            onClick={handlePrev}
            disabled={isFirstStep}
            aria-label="Previous step"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          {!isLastStep ? (
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 bg-dreeso-accent-500 hover:bg-dreeso-accent-600 hover:shadow-accent-glow"
              onClick={handleNext}
              aria-label="Next step"
            >
              Next
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-dreeso-dark-500">
            v{APP_VERSION} — Interactive Prototype
          </p>
        </div>
      </div>
    </div>
  );
}

OnboardingPage.propTypes = {
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
  className: PropTypes.string,
};

export default OnboardingPage;