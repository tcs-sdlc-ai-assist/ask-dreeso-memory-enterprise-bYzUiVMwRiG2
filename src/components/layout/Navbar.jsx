/**
 * Navbar — Global navigation bar component for Ask Dreeso Memory.
 * Displays app logo/title, current persona avatar and name, navigation links,
 * persona switcher dropdown, and logout button.
 * Persistent across all screens. Responsive: collapses to hamburger on mobile.
 *
 * @module Navbar
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePersona } from '@/contexts/PersonaContext';
import { Avatar } from '@/components/common/Avatar';
import { APP_TITLE, SCREEN_IDS } from '@/utils/constants';

/**
 * Navigation link definitions.
 * @type {object[]}
 */
const NAV_LINKS = [
  {
    label: 'Home',
    screenId: SCREEN_IDS.WELCOME,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Query',
    screenId: null,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Audit Log',
    screenId: null,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
      </svg>
    ),
  },
];

/**
 * Resolve the query screen ID based on the current persona.
 * @param {string|null} personaId - The current persona ID.
 * @returns {string} The screen ID for the persona's query screen.
 */
function resolveQueryScreenId(personaId) {
  switch (personaId) {
    case 'persona-lukas':
      return SCREEN_IDS.LUKAS_QUERY;
    case 'persona-elena':
      return SCREEN_IDS.ELENA_QUERY;
    case 'persona-sophie':
      return SCREEN_IDS.SOPHIE_QUERY;
    case 'persona-james':
      return SCREEN_IDS.JAMES_QUERY;
    default:
      return SCREEN_IDS.WELCOME;
  }
}

/**
 * PersonaSwitcherDropdown — Dropdown menu for switching between personas.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the dropdown is open.
 * @param {function} props.onClose - Callback to close the dropdown.
 * @param {object[]} props.personaList - Array of persona objects.
 * @param {string|null} props.currentPersonaId - The currently selected persona ID.
 * @param {function} props.onSelectPersona - Callback when a persona is selected.
 * @returns {import('react').ReactElement|null} The dropdown element, or null if closed.
 */
function PersonaSwitcherDropdown({ isOpen, onClose, personaList, currentPersonaId, onSelectPersona }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-dreeso-dark-900/95 backdrop-blur-lg border border-glass-border rounded-xl shadow-glass-lg z-50 overflow-hidden animate-scale-up"
      role="menu"
      aria-label="Persona switcher"
    >
      <div className="px-4 py-3 border-b border-glass-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400">
          Switch Persona
        </p>
      </div>
      <div className="py-1">
        {Array.isArray(personaList) && personaList.map((persona) => {
          const isActive = persona.id === currentPersonaId;
          return (
            <button
              key={persona.id}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-glass-hover text-white'
                  : 'text-dreeso-dark-200 hover:bg-glass-hover hover:text-white'
              }`}
              role="menuitem"
              onClick={() => {
                onSelectPersona(persona.id);
                onClose();
              }}
            >
              <Avatar
                initials={persona.avatarInitials}
                colorTheme={persona.colorTheme}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{persona.name}</p>
                <p className="text-xs text-dreeso-dark-400 truncate">{persona.role}</p>
              </div>
              {isActive && (
                <svg className="w-4 h-4 text-dreeso-accent-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

PersonaSwitcherDropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  personaList: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentPersonaId: PropTypes.string,
  onSelectPersona: PropTypes.func.isRequired,
};

/**
 * MobileMenu — Slide-down mobile navigation menu.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the mobile menu is open.
 * @param {function} props.onClose - Callback to close the menu.
 * @param {function} props.onNavigate - Callback when a nav link is clicked.
 * @param {string|null} props.currentPersonaId - The currently selected persona ID.
 * @param {object|null} props.currentPersona - The current persona object.
 * @param {object[]} props.personaList - Array of persona objects.
 * @param {function} props.onSelectPersona - Callback when a persona is selected.
 * @param {function} props.onLogout - Callback when logout is clicked.
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated.
 * @returns {import('react').ReactElement|null} The mobile menu element, or null if closed.
 */
function MobileMenu({
  isOpen,
  onClose,
  onNavigate,
  currentPersonaId,
  currentPersona,
  personaList,
  onSelectPersona,
  onLogout,
  isAuthenticated,
}) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-glass-border bg-dreeso-dark-950/95 backdrop-blur-lg animate-slide-in">
      {/* Nav Links */}
      <div className="px-4 py-3 space-y-1">
        {NAV_LINKS.map((link) => {
          const screenId = link.label === 'Query'
            ? resolveQueryScreenId(currentPersonaId)
            : link.screenId;

          return (
            <button
              key={link.label}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dreeso-dark-200 hover:bg-glass-hover hover:text-white transition-colors duration-150"
              onClick={() => {
                if (screenId) {
                  onNavigate(screenId);
                }
                onClose();
              }}
            >
              {link.icon}
              <span>{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* Persona Switcher */}
      <div className="px-4 py-3 border-t border-glass-border/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 mb-2 px-3">
          Personas
        </p>
        <div className="space-y-1">
          {Array.isArray(personaList) && personaList.map((persona) => {
            const isActive = persona.id === currentPersonaId;
            return (
              <button
                key={persona.id}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-glass-hover text-white'
                    : 'text-dreeso-dark-200 hover:bg-glass-hover hover:text-white'
                }`}
                onClick={() => {
                  onSelectPersona(persona.id);
                  onClose();
                }}
              >
                <Avatar
                  initials={persona.avatarInitials}
                  colorTheme={persona.colorTheme}
                  size="xs"
                />
                <span className="truncate">{persona.name}</span>
                {isActive && (
                  <svg className="w-4 h-4 text-dreeso-accent-400 shrink-0 ml-auto" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <div className="px-4 py-3 border-t border-glass-border/50">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors duration-150"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  currentPersonaId: PropTypes.string,
  currentPersona: PropTypes.object,
  personaList: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectPersona: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

/**
 * Navbar component.
 * Global navigation bar displayed persistently across all screens.
 * Includes app logo/title, current persona avatar and name, navigation links,
 * persona switcher dropdown, and logout button.
 * Responsive: collapses to hamburger menu on mobile.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @returns {import('react').ReactElement} The navbar element.
 */
export function Navbar({ className = '' }) {
  const { goToScreenById, currentScreenIndex, totalScreens } = useApp();
  const { isAuthenticated, logout, loginAsPersona } = useAuth();
  const { currentPersonaId, currentPersona, personaList, setPersona } = usePersona();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);

  /**
   * Handle navigation to a screen by ID.
   * @param {string} screenId - The screen ID to navigate to.
   */
  const handleNavigate = useCallback((screenId) => {
    if (typeof screenId === 'string' && screenId.trim() !== '') {
      goToScreenById(screenId);
    }
  }, [goToScreenById]);

  /**
   * Handle persona selection from the switcher.
   * @param {string} personaId - The persona ID to switch to.
   */
  const handleSelectPersona = useCallback((personaId) => {
    try {
      setPersona(personaId);
      if (isAuthenticated) {
        loginAsPersona(personaId);
      }
    } catch (_err) {
      // Persona switch failure is non-critical
    }
  }, [setPersona, isAuthenticated, loginAsPersona]);

  /**
   * Handle logout action.
   */
  const handleLogout = useCallback(() => {
    logout();
    goToScreenById(SCREEN_IDS.WELCOME);
  }, [logout, goToScreenById]);

  /**
   * Toggle mobile menu.
   */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsPersonaDropdownOpen(false);
  }, []);

  /**
   * Toggle persona dropdown.
   */
  const togglePersonaDropdown = useCallback(() => {
    setIsPersonaDropdownOpen((prev) => !prev);
  }, []);

  /**
   * Close persona dropdown.
   */
  const closePersonaDropdown = useCallback(() => {
    setIsPersonaDropdownOpen(false);
  }, []);

  /**
   * Close mobile menu.
   */
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const screenProgress = totalScreens > 0
    ? `${currentScreenIndex + 1} / ${totalScreens}`
    : '';

  return (
    <nav
      className={`w-full bg-dreeso-dark-950/80 backdrop-blur-lg border-b border-glass-border sticky top-0 z-40 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 rounded-lg px-1 py-0.5"
              onClick={() => handleNavigate(SCREEN_IDS.WELCOME)}
              aria-label="Go to home screen"
            >
              <div className="h-7 w-7 rounded-lg bg-dreeso-accent-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.404 5.404a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zm8.131 8.132a.75.75 0 011.06 0l1.061 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.404 14.596a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm8.131-8.132a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.061 1.06l-1.06 1.06a.75.75 0 01-1.061 0z" />
                  <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white hidden sm:block group-hover:text-dreeso-accent-300 transition-colors duration-150">
                {APP_TITLE}
              </span>
            </button>

            {/* Screen progress indicator */}
            {screenProgress && (
              <span className="text-xs text-dreeso-dark-400 hidden lg:block ml-2">
                {screenProgress}
              </span>
            )}
          </div>

          {/* Center: Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const screenId = link.label === 'Query'
                ? resolveQueryScreenId(currentPersonaId)
                : link.screenId;

              return (
                <button
                  key={link.label}
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dreeso-dark-300 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                  onClick={() => {
                    if (screenId) {
                      handleNavigate(screenId);
                    }
                  }}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Persona & Actions */}
          <div className="flex items-center gap-2">
            {/* Current Persona (Desktop) */}
            {currentPersona && (
              <div className="hidden md:flex items-center relative">
                <button
                  type="button"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                  onClick={togglePersonaDropdown}
                  aria-expanded={isPersonaDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`Current persona: ${currentPersona.name}. Click to switch persona.`}
                >
                  <Avatar
                    initials={currentPersona.avatarInitials}
                    colorTheme={currentPersona.colorTheme}
                    size="xs"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                      {currentPersona.name}
                    </p>
                    <p className="text-[10px] text-dreeso-dark-400 leading-tight truncate max-w-[120px]">
                      {currentPersona.role}
                    </p>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-dreeso-dark-400 transition-transform duration-150 ${isPersonaDropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                <PersonaSwitcherDropdown
                  isOpen={isPersonaDropdownOpen}
                  onClose={closePersonaDropdown}
                  personaList={personaList}
                  currentPersonaId={currentPersonaId}
                  onSelectPersona={handleSelectPersona}
                />
              </div>
            )}

            {/* No persona selected indicator (Desktop) */}
            {!currentPersona && (
              <div className="hidden md:flex items-center relative">
                <button
                  type="button"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                  onClick={togglePersonaDropdown}
                  aria-expanded={isPersonaDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Select a persona"
                >
                  <Avatar
                    initials="??"
                    colorTheme="#5a5a5f"
                    size="xs"
                  />
                  <span className="hidden lg:block text-xs text-dreeso-dark-400">
                    Select Persona
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-dreeso-dark-400 transition-transform duration-150 ${isPersonaDropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                <PersonaSwitcherDropdown
                  isOpen={isPersonaDropdownOpen}
                  onClose={closePersonaDropdown}
                  personaList={personaList}
                  currentPersonaId={currentPersonaId}
                  onSelectPersona={handleSelectPersona}
                />
              </div>
            )}

            {/* Logout Button (Desktop) */}
            {isAuthenticated && (
              <button
                type="button"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-dreeso-dark-400 hover:text-semantic-error hover:bg-semantic-error/10 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {/* Hamburger Button (Mobile) */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-dreeso-dark-300 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onNavigate={handleNavigate}
        currentPersonaId={currentPersonaId}
        currentPersona={currentPersona}
        personaList={personaList}
        onSelectPersona={handleSelectPersona}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />
    </nav>
  );
}

Navbar.propTypes = {
  className: PropTypes.string,
};

export default Navbar;