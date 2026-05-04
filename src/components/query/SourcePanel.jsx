/**
 * SourcePanel — Source transparency panel component for Ask Dreeso Memory.
 * Renders a horizontal strip of dots, one per connected system.
 * Dots pulse green with animation when their system was used in the current
 * query response. Inactive dots are muted grey. Tooltip on hover shows
 * system name. Positioned below the query response area.
 *
 * @module SourcePanel
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getData } from '@/services/dataManager';

/**
 * Valid dot size variants.
 * @type {string[]}
 */
const VALID_SIZES = ['sm', 'md', 'lg'];

/**
 * CSS class mappings for dot sizes.
 * @type {Record<string, string>}
 */
const DOT_SIZE_CLASSES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3.5 w-3.5',
  lg: 'h-4.5 w-4.5',
};

/**
 * CSS class mappings for tooltip offset by size.
 * @type {Record<string, string>}
 */
const TOOLTIP_OFFSET_CLASSES = {
  sm: '-top-8',
  md: '-top-9',
  lg: '-top-10',
};

/**
 * Resolve the size variant.
 * @param {string} [size='md'] - The size variant.
 * @returns {string} The resolved size variant.
 */
function resolveSize(size) {
  if (typeof size === 'string' && VALID_SIZES.includes(size)) {
    return size;
  }
  return 'md';
}

/**
 * Normalize source system names from a query response for matching.
 * The response sourceSystems may contain display names like "SAP Finance"
 * while the systems data has names like "SAP Financial Accounting".
 * This function creates a set of normalized strings for fuzzy matching.
 *
 * @param {string[]} sourceSystems - Array of source system display names from the response.
 * @returns {Set<string>} A set of normalized lowercase source system strings.
 */
function normalizeSourceSystems(sourceSystems) {
  if (!Array.isArray(sourceSystems)) {
    return new Set();
  }

  const normalized = new Set();

  for (let i = 0; i < sourceSystems.length; i++) {
    const source = sourceSystems[i];
    if (typeof source === 'string' && source.trim() !== '') {
      normalized.add(source.toLowerCase().trim());
    }
  }

  return normalized;
}

/**
 * Check whether a system matches any of the active source systems.
 * Uses fuzzy matching to handle display name variations.
 *
 * @param {object} system - The system object from the systems dataset.
 * @param {Set<string>} normalizedSources - Set of normalized source system strings.
 * @returns {boolean} True if the system is active in the current response.
 */
function isSystemActive(system, normalizedSources) {
  if (!system || normalizedSources.size === 0) {
    return false;
  }

  const systemName = (system.name || '').toLowerCase().trim();
  const shortName = (system.shortName || '').toLowerCase().trim();

  // Exact match on name or shortName
  if (normalizedSources.has(systemName) || normalizedSources.has(shortName)) {
    return true;
  }

  // Fuzzy match: check if any source contains or is contained by the system name/shortName
  for (const source of normalizedSources) {
    if (
      systemName.includes(source) ||
      source.includes(systemName) ||
      shortName.includes(source) ||
      source.includes(shortName)
    ) {
      return true;
    }

    // Handle common abbreviations (e.g., "SAP Finance" matches "SAP Financial Accounting")
    const sourceWords = source.split(/\s+/);
    const nameWords = systemName.split(/\s+/);
    const shortWords = shortName.split(/\s+/);

    let matchCount = 0;
    for (let w = 0; w < sourceWords.length; w++) {
      const word = sourceWords[w];
      if (word.length < 2) continue;

      for (let n = 0; n < nameWords.length; n++) {
        if (nameWords[n].startsWith(word) || word.startsWith(nameWords[n])) {
          matchCount++;
          break;
        }
      }

      for (let s = 0; s < shortWords.length; s++) {
        if (shortWords[s].startsWith(word) || word.startsWith(shortWords[s])) {
          matchCount++;
          break;
        }
      }
    }

    if (sourceWords.length > 0 && matchCount >= Math.ceil(sourceWords.length * 0.5)) {
      return true;
    }
  }

  return false;
}

/**
 * Single system dot component with tooltip and pulse animation.
 *
 * @param {object} props
 * @param {object} props.system - The system object.
 * @param {boolean} props.isActive - Whether the system is active in the current response.
 * @param {string} props.size - The dot size variant.
 * @returns {import('react').ReactElement} The system dot element.
 */
function SystemDot({ system, isActive, size }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleFocus = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleBlur = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const resolvedSize = resolveSize(size);
  const dotSizeClass = DOT_SIZE_CLASSES[resolvedSize];
  const tooltipOffsetClass = TOOLTIP_OFFSET_CLASSES[resolvedSize];

  const systemColor = system.color || '#5a5a5f';
  const displayName = system.shortName || system.name || 'Unknown System';

  const activeClasses = isActive
    ? 'animate-pulse-green'
    : 'opacity-30';

  const dotStyle = isActive
    ? { backgroundColor: systemColor }
    : { backgroundColor: '#5a5a5f' };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="img"
      aria-label={`${displayName}${isActive ? ' — active source' : ' — inactive'}`}
    >
      <div
        className={`${dotSizeClass} rounded-full shrink-0 transition-all duration-300 ${activeClasses}`}
        style={dotStyle}
      />

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`absolute ${tooltipOffsetClass} left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-up`}
        >
          <div className="bg-dreeso-dark-900/95 backdrop-blur-md border border-glass-border rounded-lg px-2.5 py-1.5 shadow-glass-sm whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: systemColor }}
              />
              <span className="text-[11px] font-medium text-white leading-tight">
                {displayName}
              </span>
            </div>
            {isActive && (
              <p className="text-[10px] text-dreeso-accent-400 mt-0.5 leading-tight">
                Active source
              </p>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-dreeso-dark-900/95 border-r border-b border-glass-border rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}

SystemDot.propTypes = {
  system: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  size: PropTypes.oneOf(VALID_SIZES),
};

/**
 * SourcePanel component.
 * Renders a horizontal strip of dots, one per connected enterprise system.
 * Dots pulse green with animation when their system was used in the current
 * query response. Inactive dots are muted grey. Tooltip on hover shows
 * system name. Positioned below the query response area.
 *
 * @param {object} props
 * @param {string[]} [props.activeSources=[]] - Array of source system names that are active
 *   in the current query response (from response.sourceSystems).
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @param {'sm'|'md'|'lg'} [props.size='md'] - The dot size variant.
 * @param {boolean} [props.showLabel=true] - Whether to display the "Source Systems" label.
 * @param {boolean} [props.showCount=true] - Whether to display the active/total count.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {boolean} [props.compact=false] - Whether to use compact spacing.
 * @returns {import('react').ReactElement} The source panel element.
 */
export function SourcePanel({
  activeSources = [],
  className = '',
  size = 'md',
  showLabel = true,
  showCount = true,
  animated = true,
  compact = false,
}) {
  /**
   * All connected systems loaded from mock data.
   * @type {object[]}
   */
  const allSystems = useMemo(() => {
    return getData('systems');
  }, []);

  /**
   * Normalized set of active source system names for matching.
   * @type {Set<string>}
   */
  const normalizedSources = useMemo(() => {
    return normalizeSourceSystems(activeSources);
  }, [activeSources]);

  /**
   * Systems with their active state resolved.
   * @type {{ system: object, isActive: boolean }[]}
   */
  const systemStates = useMemo(() => {
    return allSystems.map((system) => ({
      system,
      isActive: isSystemActive(system, normalizedSources),
    }));
  }, [allSystems, normalizedSources]);

  /**
   * Count of active systems.
   * @type {number}
   */
  const activeCount = useMemo(() => {
    return systemStates.filter((s) => s.isActive).length;
  }, [systemStates]);

  const resolvedSize = resolveSize(size);
  const animationClass = animated ? 'animate-slide-in' : '';
  const gapClass = compact ? 'gap-2' : 'gap-3';
  const paddingClass = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={`w-full ${animationClass} ${className}`}
      role="region"
      aria-label="Source systems panel"
    >
      <div
        className={`flex items-center ${gapClass} ${paddingClass} bg-glass-white backdrop-blur-sm border border-glass-border rounded-xl`}
      >
        {/* Label */}
        {showLabel && (
          <div className="flex items-center gap-1.5 shrink-0">
            <svg
              className="w-3.5 h-3.5 text-dreeso-dark-400 shrink-0"
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
            <span className="text-[11px] font-medium uppercase tracking-wider text-dreeso-dark-400 hidden sm:inline">
              Sources
            </span>
          </div>
        )}

        {/* Separator */}
        {showLabel && (
          <div className="h-4 w-px bg-glass-border shrink-0 hidden sm:block" />
        )}

        {/* System dots */}
        <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'} flex-wrap`}>
          {systemStates.map(({ system, isActive }) => (
            <SystemDot
              key={system.id}
              system={system}
              isActive={isActive}
              size={resolvedSize}
            />
          ))}
        </div>

        {/* Active count */}
        {showCount && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <span className="text-[11px] text-dreeso-dark-500">
              {activeCount}/{allSystems.length}
            </span>
            {activeCount > 0 && (
              <span className="text-[11px] text-dreeso-accent-400 font-medium">
                active
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

SourcePanel.propTypes = {
  activeSources: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  size: PropTypes.oneOf(VALID_SIZES),
  showLabel: PropTypes.bool,
  showCount: PropTypes.bool,
  animated: PropTypes.bool,
  compact: PropTypes.bool,
};

export default SourcePanel;