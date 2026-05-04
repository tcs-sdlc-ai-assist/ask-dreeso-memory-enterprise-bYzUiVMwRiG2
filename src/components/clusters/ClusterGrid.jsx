/**
 * ClusterGrid — Intelligence cluster grid component for Ask Dreeso Memory.
 * Loads six clusters for the current persona from mock data and renders them
 * in a responsive 3x2 grid (desktop), 2x3 (tablet), 1x6 (mobile).
 * Shows SkeletonLoader while loading. Passes cluster click events to parent
 * for query triggering.
 *
 * @module ClusterGrid
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { usePersona } from '@/contexts/PersonaContext';
import { IntelligenceCluster } from '@/components/clusters/IntelligenceCluster';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

/**
 * Maximum number of clusters to display in the grid.
 * @type {number}
 */
const MAX_CLUSTERS = 6;

/**
 * Simulated loading delay in milliseconds.
 * @type {number}
 */
const LOADING_DELAY_MS = 300;

/**
 * ClusterGrid component.
 * Loads intelligence clusters for the current persona and renders them
 * in a responsive grid layout. Shows skeleton loaders while data is loading.
 * Passes cluster click events to the parent for query triggering.
 *
 * @param {object} props
 * @param {function} [props.onQuerySubmit] - Callback when a cluster is clicked and triggers a query.
 *   Receives the query template string.
 * @param {function} [props.onClusterClick] - Optional generic click handler. Receives the cluster object.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the grid wrapper.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation to cluster cards.
 * @param {boolean} [props.showCategory=true] - Whether to display category badges on cluster cards.
 * @param {boolean} [props.showDescription=true] - Whether to display description text on cluster cards.
 * @param {boolean} [props.compact=false] - Whether to use compact layout for cluster cards.
 * @param {string} [props.accentColor] - Override accent color for cluster cards.
 * @param {string} [props.title=''] - Optional section title displayed above the grid.
 * @param {boolean} [props.showTitle=false] - Whether to display the section title.
 * @param {number} [props.maxClusters=6] - Maximum number of clusters to display.
 * @returns {import('react').ReactElement} The cluster grid element.
 */
export function ClusterGrid({
  onQuerySubmit,
  onClusterClick,
  className = '',
  animated = true,
  showCategory = true,
  showDescription = true,
  compact = false,
  accentColor,
  title = '',
  showTitle = false,
  maxClusters = MAX_CLUSTERS,
}) {
  const { currentPersonaId, getPersonaClusters } = usePersona();

  const [isLoading, setIsLoading] = useState(true);
  const [clusters, setClusters] = useState([]);

  /**
   * Resolved maximum number of clusters to display.
   * @type {number}
   */
  const resolvedMaxClusters = typeof maxClusters === 'number' && maxClusters > 0
    ? Math.min(maxClusters, MAX_CLUSTERS)
    : MAX_CLUSTERS;

  /**
   * Load clusters for the current persona.
   */
  useEffect(() => {
    if (!currentPersonaId) {
      setClusters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(() => {
      try {
        const personaClusters = getPersonaClusters();
        const sliced = personaClusters.slice(0, resolvedMaxClusters);
        setClusters(sliced);
      } catch (_err) {
        setClusters([]);
      }
      setIsLoading(false);
    }, LOADING_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [currentPersonaId, getPersonaClusters, resolvedMaxClusters]);

  /**
   * Handle query submission from a cluster card.
   * @param {string} queryTemplate - The query template string from the cluster.
   */
  const handleQuerySubmit = useCallback((queryTemplate) => {
    if (typeof onQuerySubmit === 'function' && typeof queryTemplate === 'string' && queryTemplate.trim() !== '') {
      onQuerySubmit(queryTemplate.trim());
    }
  }, [onQuerySubmit]);

  /**
   * Handle generic cluster click.
   * @param {object} cluster - The cluster object that was clicked.
   */
  const handleClusterClick = useCallback((cluster) => {
    if (typeof onClusterClick === 'function') {
      onClusterClick(cluster);
    }
  }, [onClusterClick]);

  const hasClusters = clusters.length > 0;
  const hasTitle = showTitle && typeof title === 'string' && title.trim() !== '';

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {hasTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
            {title}
          </h2>
        )}
        <SkeletonLoader variant="cluster" count={resolvedMaxClusters} />
      </div>
    );
  }

  // Show empty state when no persona is selected or no clusters available
  if (!currentPersonaId) {
    return (
      <div className={`w-full ${className}`}>
        {hasTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 mb-4">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400">
          Select a persona to view intelligence clusters.
        </div>
      </div>
    );
  }

  if (!hasClusters) {
    return (
      <div className={`w-full ${className}`}>
        {hasTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400 mb-4">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center py-12 text-sm text-dreeso-dark-400">
          No intelligence clusters available for this persona.
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {hasTitle && (
        <h2 className="text-sm font-medium uppercase tracking-wider text-dreeso-dark-400">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => (
          <IntelligenceCluster
            key={cluster.id}
            cluster={cluster}
            onQuerySubmit={handleQuerySubmit}
            onClick={handleClusterClick}
            animated={animated}
            showCategory={showCategory}
            showDescription={showDescription}
            compact={compact}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

ClusterGrid.propTypes = {
  onQuerySubmit: PropTypes.func,
  onClusterClick: PropTypes.func,
  className: PropTypes.string,
  animated: PropTypes.bool,
  showCategory: PropTypes.bool,
  showDescription: PropTypes.bool,
  compact: PropTypes.bool,
  accentColor: PropTypes.string,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  maxClusters: PropTypes.number,
};

export default ClusterGrid;