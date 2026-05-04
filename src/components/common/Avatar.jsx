/**
 * Avatar — Persona avatar component displaying initials in a colored circle.
 * Accepts initials, colorTheme, and size props.
 * Used in navigation, persona selector, and user profile areas.
 *
 * @module Avatar
 */

import PropTypes from 'prop-types';

/**
 * Valid avatar size variants.
 * @type {string[]}
 */
const VALID_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * CSS class mappings for avatar sizes (dimensions).
 * @type {Record<string, string>}
 */
const SIZE_CLASSES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * CSS class mappings for text sizes within each avatar size.
 * @type {Record<string, string>}
 */
const TEXT_SIZE_CLASSES = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * Default color theme when none is provided.
 * @type {string}
 */
const DEFAULT_COLOR = '#17b363';

/**
 * Default initials when none are provided.
 * @type {string}
 */
const DEFAULT_INITIALS = '??';

/**
 * Resolve the initials string. Ensures it is a non-empty string
 * and truncates to a maximum of 2 characters.
 *
 * @param {string} [initials] - The initials to resolve.
 * @returns {string} The resolved initials string (max 2 characters).
 */
function resolveInitials(initials) {
  if (typeof initials !== 'string' || initials.trim() === '') {
    return DEFAULT_INITIALS;
  }
  return initials.trim().substring(0, 2).toUpperCase();
}

/**
 * Resolve the color theme. Ensures it is a valid CSS color string.
 *
 * @param {string} [colorTheme] - The color theme hex string.
 * @returns {string} The resolved color string.
 */
function resolveColor(colorTheme) {
  if (typeof colorTheme !== 'string' || colorTheme.trim() === '') {
    return DEFAULT_COLOR;
  }
  return colorTheme.trim();
}

/**
 * Resolve the size variant.
 *
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
 * Calculate a contrasting text color (white or dark) based on the background color.
 * Uses relative luminance to determine the best contrast.
 *
 * @param {string} hexColor - The background hex color string.
 * @returns {string} Either '#ffffff' or '#1a1a1c' for best contrast.
 */
function getContrastColor(hexColor) {
  if (typeof hexColor !== 'string') {
    return '#ffffff';
  }

  let hex = hexColor.replace('#', '');

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (hex.length !== 6) {
    return '#ffffff';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#ffffff';
  }

  // Relative luminance calculation (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1a1a1c' : '#ffffff';
}

/**
 * Avatar component.
 * Renders a circular avatar with persona initials and a colored background.
 * Supports multiple sizes and optional interactive states.
 *
 * @param {object} props
 * @param {string} [props.initials='??'] - The initials to display (max 2 characters).
 * @param {string} [props.colorTheme='#17b363'] - The background color hex string.
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] - The avatar size variant.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {function} [props.onClick] - Optional click handler. When provided, the avatar becomes interactive.
 * @param {boolean} [props.ring=false] - Whether to display a ring border around the avatar.
 * @param {string} [props.ariaLabel] - Accessible label for the avatar.
 * @returns {import('react').ReactElement} The avatar element.
 */
export function Avatar({
  initials,
  colorTheme,
  size = 'md',
  className = '',
  onClick,
  ring = false,
  ariaLabel,
}) {
  const resolvedInitials = resolveInitials(initials);
  const resolvedColor = resolveColor(colorTheme);
  const resolvedSize = resolveSize(size);
  const contrastColor = getContrastColor(resolvedColor);

  const isInteractive = typeof onClick === 'function';

  const sizeClass = SIZE_CLASSES[resolvedSize];
  const textSizeClass = TEXT_SIZE_CLASSES[resolvedSize];
  const ringClass = ring
    ? 'ring-2 ring-offset-2 ring-offset-dreeso-dark-950'
    : '';
  const interactiveClasses = isInteractive
    ? 'cursor-pointer transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dreeso-dark-950'
    : '';

  const combinedClassName = [
    'inline-flex items-center justify-center rounded-full shrink-0 select-none font-semibold',
    sizeClass,
    textSizeClass,
    ringClass,
    interactiveClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyle = {
    backgroundColor: resolvedColor,
    color: contrastColor,
  };

  if (ring) {
    inlineStyle['--tw-ring-color'] = resolvedColor;
  }

  const resolvedAriaLabel = typeof ariaLabel === 'string' && ariaLabel.trim() !== ''
    ? ariaLabel
    : `Avatar for ${resolvedInitials}`;

  const interactiveProps = {};

  if (isInteractive) {
    interactiveProps.onClick = onClick;
    interactiveProps.role = 'button';
    interactiveProps.tabIndex = 0;
    interactiveProps.onKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event);
      }
    };
  }

  return (
    <div
      className={combinedClassName}
      style={inlineStyle}
      aria-label={resolvedAriaLabel}
      {...interactiveProps}
    >
      {resolvedInitials}
    </div>
  );
}

Avatar.propTypes = {
  initials: PropTypes.string,
  colorTheme: PropTypes.string,
  size: PropTypes.oneOf(VALID_SIZES),
  className: PropTypes.string,
  onClick: PropTypes.func,
  ring: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default Avatar;