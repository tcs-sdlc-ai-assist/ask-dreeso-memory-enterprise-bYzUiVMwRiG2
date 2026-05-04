/**
 * GlassCard — Reusable glassmorphism card component.
 * Applies backdrop-blur, semi-transparent background, subtle border,
 * and slide-in animation. Accepts children, className override, and onClick handler.
 * Foundation for response cards, cluster cards, and action panels.
 *
 * @module GlassCard
 */

import PropTypes from 'prop-types';

/**
 * Valid GlassCard size variants.
 * @type {string[]}
 */
const VALID_VARIANTS = ['default', 'sm', 'lg'];

/**
 * CSS class mappings for each variant.
 * @type {Record<string, string>}
 */
const VARIANT_CLASSES = {
  default: 'bg-glass-white backdrop-blur-md border border-glass-border rounded-2xl shadow-glass',
  sm: 'bg-glass-white backdrop-blur-sm border border-glass-border rounded-xl shadow-glass-sm',
  lg: 'bg-glass-white backdrop-blur-lg border border-glass-border rounded-4xl shadow-glass-lg',
};

/**
 * CSS class mappings for padding by variant.
 * @type {Record<string, string>}
 */
const PADDING_CLASSES = {
  default: 'p-6',
  sm: 'p-4',
  lg: 'p-8',
};

/**
 * GlassCard component.
 * Renders a glassmorphism-styled card with optional hover effects,
 * slide-in animation, and click handling.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child content to render inside the card.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the card.
 * @param {'default'|'sm'|'lg'} [props.variant='default'] - The card size variant.
 * @param {function} [props.onClick] - Optional click handler. When provided, the card becomes interactive with hover effects.
 * @param {boolean} [props.animated=true] - Whether to apply the slide-in animation.
 * @param {boolean} [props.hoverable=false] - Whether to apply hover effects (auto-enabled when onClick is provided).
 * @param {boolean} [props.noPadding=false] - Whether to remove default padding.
 * @param {string} [props.as='div'] - The HTML element to render as.
 * @returns {import('react').ReactElement} The glass card element.
 */
export function GlassCard({
  children,
  className = '',
  variant = 'default',
  onClick,
  animated = true,
  hoverable = false,
  noPadding = false,
  as: Component = 'div',
}) {
  const resolvedVariant = VALID_VARIANTS.includes(variant) ? variant : 'default';
  const isInteractive = typeof onClick === 'function';
  const isHoverable = hoverable || isInteractive;

  const baseClasses = VARIANT_CLASSES[resolvedVariant];
  const paddingClass = noPadding ? '' : PADDING_CLASSES[resolvedVariant];
  const animationClass = animated ? 'animate-slide-in' : '';
  const hoverClasses = isHoverable
    ? 'transition-all duration-200 ease-out hover:bg-glass-hover hover:shadow-glass-lg'
    : '';
  const cursorClass = isInteractive ? 'cursor-pointer' : '';

  const combinedClassName = [
    baseClasses,
    paddingClass,
    animationClass,
    hoverClasses,
    cursorClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
    <Component
      className={combinedClassName}
      {...interactiveProps}
    >
      {children}
    </Component>
  );
}

GlassCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(VALID_VARIANTS),
  onClick: PropTypes.func,
  animated: PropTypes.bool,
  hoverable: PropTypes.bool,
  noPadding: PropTypes.bool,
  as: PropTypes.string,
};

export default GlassCard;