/**
 * CTABubbles — CTA follow-up bubbles component for Ask Dreeso Memory.
 * Renders 3-4 tappable bubble buttons after each query response.
 * Each bubble displays follow-up query text with hover scale animation.
 * On click, triggers a new query via useQueryEngine.
 * Styled as pill-shaped with persona accent color.
 *
 * @module CTABubbles
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePersona } from '@/contexts/PersonaContext';

/**
 * Maximum number of CTA bubbles to display.
 * @type {number}
 */
const MAX_BUBBLES = 4;

/**
 * Minimum number of CTA bubbles to display (if available).
 * @type {number}
 */
const MIN_BUBBLES = 3;

/**
 * Icon mapping by category for CTA bubbles.
 * @param {string} category - The category string.
 * @returns {import('react').ReactElement} The icon SVG element.
 */
function CategoryIcon({ category }) {
  const resolvedCategory = typeof category === 'string' ? category.toLowerCase() : '';

  switch (resolvedCategory) {
    case 'finance':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.514.111.987.29 1.388.545.669.424 1.112 1.048 1.112 1.78 0 .733-.443 1.357-1.112 1.78a4.614 4.614 0 01-1.388.546v.184a.75.75 0 01-1.5 0v-.184a4.614 4.614 0 01-1.388-.546C7.443 12.982 7 12.358 7 11.625c0-.733.443-1.356 1.112-1.78.401-.254.874-.434 1.388-.545V6.801a2.187 2.187 0 00-.736.363 1.35 1.35 0 00-.447.563.75.75 0 01-1.395-.55c.18-.46.5-.87.925-1.2a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      );
    case 'risk':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'schedule':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      );
    case 'workforce':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
        </svg>
      );
    case 'compliance':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      );
    case 'procurement':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h-.5a.75.75 0 000 1.5H2v2.607c0 .748.547 1.38 1.29 1.493A41.559 41.559 0 006.5 17c1.051 0 2.093-.04 3.125-.117A1.49 1.49 0 0011 15.393V13h.5a.75.75 0 000-1.5H11V4.607c0-.748-.547-1.38-1.29-1.493A41.559 41.559 0 006.5 3zM15 9.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm2.25.75a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" />
        </svg>
      );
    case 'reporting':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
        </svg>
      );
    case 'sales':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
        </svg>
      );
    case 'analysis':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
      );
  }
}

CategoryIcon.propTypes = {
  category: PropTypes.string,
};

/**
 * Single CTA bubble button component.
 *
 * @param {object} props
 * @param {string} props.text - The follow-up query text.
 * @param {string} [props.category] - The category of the suggestion.
 * @param {string} [props.accentColor] - The persona accent color hex string.
 * @param {function} props.onClick - Callback when the bubble is clicked.
 * @returns {import('react').ReactElement|null} The CTA bubble element.
 */
function CTABubble({ text, category, accentColor, onClick }) {
  if (typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  const isInteractive = typeof onClick === 'function';

  /**
   * Handle bubble click.
   */
  const handleClick = useCallback(() => {
    if (isInteractive) {
      onClick(text);
    }
  }, [isInteractive, onClick, text]);

  /**
   * Handle keyboard activation.
   * @param {import('react').KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    if ((event.key === 'Enter' || event.key === ' ') && isInteractive) {
      event.preventDefault();
      onClick(text);
    }
  }, [isInteractive, onClick, text]);

  const accentBorderStyle = accentColor
    ? { borderColor: `${accentColor}30` }
    : {};

  const accentHoverStyle = accentColor
    ? {
        '--cta-accent': accentColor,
        '--cta-accent-bg': `${accentColor}10`,
        '--cta-accent-border': `${accentColor}40`,
      }
    : {};

  return (
    <button
      type="button"
      className={[
        'group inline-flex items-center gap-2 px-4 py-2.5 text-xs text-dreeso-dark-200',
        'bg-glass-white border border-glass-border rounded-full',
        'transition-all duration-200 ease-out text-left',
        isInteractive
          ? 'cursor-pointer hover:scale-105 hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 hover:shadow-glass-sm focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50 active:scale-100'
          : 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...accentBorderStyle, ...accentHoverStyle }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`Follow-up query: ${text}`}
    >
      <span
        className="transition-colors duration-200 text-dreeso-accent-400 group-hover:text-dreeso-accent-300"
        style={accentColor ? { color: accentColor } : {}}
      >
        <CategoryIcon category={category} />
      </span>
      <span className="line-clamp-2 leading-relaxed">{text}</span>
    </button>
  );
}

CTABubble.propTypes = {
  text: PropTypes.string.isRequired,
  category: PropTypes.string,
  accentColor: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

/**
 * CTABubbles component.
 * Renders 3-4 tappable follow-up query bubble buttons after each query response.
 * Each bubble displays follow-up query text with hover scale animation.
 * On click, triggers a new query via the provided onQuerySubmit callback.
 * Styled as pill-shaped with persona accent color.
 *
 * @param {object} props
 * @param {Array} props.bubbles - Array of CTA bubble objects or strings. Each item can be:
 *   - A string (used as the bubble text)
 *   - An object with { text: string, category?: string, icon?: string, priority?: number, actionId?: string }
 * @param {function} props.onQuerySubmit - Callback when a bubble is clicked. Receives the query text string.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @param {string} [props.title='Follow-up Questions'] - Optional section title.
 * @param {boolean} [props.showTitle=true] - Whether to display the section title.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {string} [props.accentColor] - Override persona accent color. Defaults to current persona's colorTheme.
 * @returns {import('react').ReactElement|null} The CTA bubbles element, or null if no bubbles.
 */
export function CTABubbles({
  bubbles,
  onQuerySubmit,
  className = '',
  title = 'Follow-up Questions',
  showTitle = true,
  animated = true,
  accentColor: overrideAccentColor,
}) {
  const { currentPersona } = usePersona();

  const resolvedAccentColor = overrideAccentColor
    || (currentPersona ? currentPersona.colorTheme : null);

  /**
   * Handle bubble click — triggers a new query.
   * @param {string} queryText - The follow-up query text.
   */
  const handleBubbleClick = useCallback((queryText) => {
    if (typeof onQuerySubmit === 'function' && typeof queryText === 'string' && queryText.trim() !== '') {
      onQuerySubmit(queryText.trim());
    }
  }, [onQuerySubmit]);

  // Normalize bubbles input
  if (!Array.isArray(bubbles) || bubbles.length === 0) {
    return null;
  }

  const normalizedBubbles = bubbles
    .map((bubble, index) => {
      if (typeof bubble === 'string') {
        return {
          text: bubble.trim(),
          category: '',
          priority: index + 1,
        };
      }

      if (bubble && typeof bubble === 'object' && !Array.isArray(bubble)) {
        return {
          text: typeof bubble.text === 'string' ? bubble.text.trim() : '',
          category: typeof bubble.category === 'string' ? bubble.category : '',
          priority: typeof bubble.priority === 'number' ? bubble.priority : index + 1,
        };
      }

      return null;
    })
    .filter((bubble) => bubble !== null && bubble.text !== '')
    .slice(0, MAX_BUBBLES);

  if (normalizedBubbles.length === 0) {
    return null;
  }

  const animationClass = animated ? 'animate-slide-in' : '';

  return (
    <div className={`space-y-3 ${animationClass} ${className}`}>
      {showTitle && typeof title === 'string' && title.trim() !== '' && (
        <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedBubbles.map((bubble, index) => (
          <CTABubble
            key={`cta-bubble-${index}-${bubble.priority}`}
            text={bubble.text}
            category={bubble.category}
            accentColor={resolvedAccentColor}
            onClick={handleBubbleClick}
          />
        ))}
      </div>
    </div>
  );
}

CTABubbles.propTypes = {
  bubbles: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        text: PropTypes.string,
        category: PropTypes.string,
        icon: PropTypes.string,
        priority: PropTypes.number,
        actionId: PropTypes.string,
        description: PropTypes.string,
      }),
    ])
  ).isRequired,
  onQuerySubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  animated: PropTypes.bool,
  accentColor: PropTypes.string,
};

export default CTABubbles;