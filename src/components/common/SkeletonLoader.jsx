/**
 * SkeletonLoader — Reusable skeleton loader component with shimmer animation.
 * Accepts variant prop (text, card, table, cluster) and count prop.
 * Renders animated placeholder shapes matching the target content type
 * using Tailwind animate-pulse and custom shimmer gradient.
 *
 * @module SkeletonLoader
 */

import PropTypes from 'prop-types';

/**
 * Valid skeleton variant types.
 * @type {string[]}
 */
const VALID_VARIANTS = ['text', 'card', 'table', 'cluster'];

/**
 * Render a single text skeleton line.
 * @param {object} props
 * @param {number} props.index - The line index for key and width variation.
 * @returns {import('react').ReactElement} A shimmer text line element.
 */
function TextSkeleton({ index }) {
  const widths = ['w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-4/5'];
  const widthClass = widths[index % widths.length];

  return (
    <div className="space-y-2">
      <div
        className={`h-4 ${widthClass} shimmer-block`}
      />
    </div>
  );
}

TextSkeleton.propTypes = {
  index: PropTypes.number.isRequired,
};

/**
 * Render a single card skeleton.
 * @returns {import('react').ReactElement} A shimmer card element.
 */
function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full shimmer-block" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 shimmer-block" />
          <div className="h-3 w-1/3 shimmer-block" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full shimmer-block" />
        <div className="h-3 w-5/6 shimmer-block" />
        <div className="h-3 w-3/4 shimmer-block" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-20 rounded-lg shimmer-block" />
        <div className="h-6 w-16 rounded-lg shimmer-block" />
      </div>
    </div>
  );
}

/**
 * Render a single table skeleton with header and rows.
 * @returns {import('react').ReactElement} A shimmer table element.
 */
function TableSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      {/* Table header */}
      <div className="flex items-center space-x-4 pb-3 border-b border-glass-border">
        <div className="h-4 w-1/6 shimmer-block" />
        <div className="h-4 w-1/4 shimmer-block" />
        <div className="h-4 w-1/6 shimmer-block" />
        <div className="h-4 w-1/5 shimmer-block" />
        <div className="h-4 w-1/6 shimmer-block" />
      </div>
      {/* Table rows */}
      {[0, 1, 2, 3, 4].map((rowIndex) => (
        <div
          key={`table-row-${rowIndex}`}
          className="flex items-center space-x-4 py-2"
        >
          <div className="h-3 w-1/6 shimmer-block" />
          <div className="h-3 w-1/4 shimmer-block" />
          <div className="h-3 w-1/6 shimmer-block" />
          <div className="h-3 w-1/5 shimmer-block" />
          <div className="h-3 w-1/6 shimmer-block" />
        </div>
      ))}
    </div>
  );
}

/**
 * Render a single cluster skeleton card.
 * @returns {import('react').ReactElement} A shimmer cluster element.
 */
function ClusterSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-lg shimmer-block" />
        <div className="h-5 w-2/5 shimmer-block" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full shimmer-block" />
        <div className="h-3 w-4/5 shimmer-block" />
      </div>
      <div className="pt-1">
        <div className="h-8 w-full rounded-xl shimmer-block" />
      </div>
    </div>
  );
}

/**
 * Render the appropriate skeleton variant.
 * @param {string} variant - The skeleton variant type.
 * @param {number} index - The item index for key generation and variation.
 * @returns {import('react').ReactElement} The skeleton element for the variant.
 */
function renderVariant(variant, index) {
  switch (variant) {
    case 'text':
      return <TextSkeleton index={index} />;
    case 'card':
      return <CardSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'cluster':
      return <ClusterSkeleton />;
    default:
      return <TextSkeleton index={index} />;
  }
}

/**
 * SkeletonLoader component.
 * Renders animated placeholder shapes matching the target content type.
 *
 * @param {object} props
 * @param {'text'|'card'|'table'|'cluster'} [props.variant='text'] - The skeleton variant to render.
 * @param {number} [props.count=1] - Number of skeleton items to render.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @returns {import('react').ReactElement} The skeleton loader element.
 */
export function SkeletonLoader({ variant = 'text', count = 1, className = '' }) {
  const resolvedVariant = VALID_VARIANTS.includes(variant) ? variant : 'text';
  const resolvedCount = typeof count === 'number' && count > 0 ? Math.min(count, 20) : 1;

  const isGrid = resolvedVariant === 'card' || resolvedVariant === 'cluster';

  const items = [];
  for (let i = 0; i < resolvedCount; i++) {
    items.push(
      <div key={`skeleton-${resolvedVariant}-${i}`} className="animate-pulse">
        {renderVariant(resolvedVariant, i)}
      </div>
    );
  }

  if (isGrid && resolvedCount > 1) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
        role="status"
        aria-label="Loading content"
        aria-busy="true"
      >
        {items}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 ${className}`}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      {items}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(VALID_VARIANTS),
  count: PropTypes.number,
  className: PropTypes.string,
};

export default SkeletonLoader;