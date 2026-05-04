/**
 * IntelligenceCluster — Single intelligence cluster card component.
 * Renders a glassmorphism card with cluster icon, label, description,
 * and click handler. On click, triggers the cluster's query template
 * via the query engine. Includes hover elevation and subtle glow animation.
 *
 * @module IntelligenceCluster
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { usePersona } from '@/contexts/PersonaContext';

/**
 * Valid cluster category values.
 * @type {string[]}
 */
const VALID_CATEGORIES = [
  'management',
  'finance',
  'risk',
  'reporting',
  'workforce',
  'compliance',
  'procurement',
  'schedule',
  'analysis',
  'sales',
];

/**
 * Icon SVG components mapped by icon name.
 * @param {object} props
 * @param {string} props.name - The icon name string.
 * @returns {import('react').ReactElement} The icon SVG element.
 */
function ClusterIcon({ name }) {
  const resolvedName = typeof name === 'string' ? name.toLowerCase() : '';

  switch (resolvedName) {
    case 'eye':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25zM1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25zM7 8a1 1 0 011 1 2 2 0 104 0 1 1 0 011-1h3.75A2.25 2.25 0 0119 10.25v5.5A2.25 2.25 0 0116.75 18H3.25A2.25 2.25 0 011 15.75v-5.5A2.25 2.25 0 013.25 8H7z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
        </svg>
      );
    case 'chart-bar':
    case 'bar-chart':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.822 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm.177-9a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 007.55 6zm2.7 2a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75zm2.7-1a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
        </svg>
      );
    case 'clipboard-check':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      );
    case 'calculator':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
      );
    case 'trending-up':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
        </svg>
      );
    case 'truck':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h-.5a.75.75 0 000 1.5H2v2.607c0 .748.547 1.38 1.29 1.493A41.559 41.559 0 006.5 17c1.051 0 2.093-.04 3.125-.117A1.49 1.49 0 0011 15.393V13h.5a.75.75 0 000-1.5H11V4.607c0-.748-.547-1.38-1.29-1.493A41.559 41.559 0 006.5 3zM15 9.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zm2.25.75a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" />
        </svg>
      );
    case 'file-text':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
        </svg>
      );
    case 'layers':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M1 12.5A4.5 4.5 0 005.5 17H15a4 4 0 001.866-7.539 3.504 3.504 0 00-4.504-4.272A4.5 4.5 0 004.06 8.235 4.502 4.502 0 001 12.5z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
          <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686A41.454 41.454 0 0110 18c-1.572 0-3.118-.12-4.637-.259C3.985 17.585 3 16.402 3 15.055z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      );
    case 'alert-triangle':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'user-check':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
      );
    case 'message-circle':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 3.925 1 5.261v4.478c0 1.336.993 2.506 2.43 2.737.526.084 1.055.157 1.588.218.365.042.634.35.634.718v2.134a.75.75 0 001.164.625l3.086-2.057a1.5 1.5 0 01.832-.253c1.257 0 2.496-.088 3.696-.257 1.437-.231 2.43-1.401 2.43-2.737V5.261c0-1.336-.993-2.506-2.43-2.737A36.677 36.677 0 0010 2z" clipRule="evenodd" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      );
    case 'funnel':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M16.555 5.412a8.028 8.028 0 00-3.503-2.81 14.899 14.899 0 011.663 4.472 8.547 8.547 0 001.84-1.662zM13.326 7.825a13.43 13.43 0 00-2.413-5.773 8.087 8.087 0 00-1.826 0 13.43 13.43 0 00-2.413 5.773A8.473 8.473 0 0010 8.5c1.18 0 2.304-.24 3.326-.675zM14.558 9.05a9.97 9.97 0 01-4.558 1.1 9.97 9.97 0 01-4.558-1.1A14.393 14.393 0 006.95 15H13.05a14.393 14.393 0 001.508-5.95zM6.948 2.602A14.899 14.899 0 005.285 7.074a8.547 8.547 0 01-1.84-1.662 8.028 8.028 0 013.503-2.81zM2.545 7.074A9.97 9.97 0 002 10c0 1.04.159 2.042.453 2.982a14.393 14.393 0 012.497-1.032A15.867 15.867 0 014.558 9.05a10.02 10.02 0 01-2.013-1.976zM5.45 15.5a15.867 15.867 0 01-.5-2.55 14.393 14.393 0 00-2.497-1.032A8.028 8.028 0 005.45 15.5zM14.55 15.5a8.028 8.028 0 002.997-3.582 14.393 14.393 0 00-2.497 1.032 15.867 15.867 0 01-.5 2.55zM17.455 12.982A9.97 9.97 0 0018 10c0-1.04-.159-2.042-.453-2.982a10.02 10.02 0 01-2.013 1.976 15.867 15.867 0 01-.392 2.938 14.393 14.393 0 012.313 1.05z" />
        </svg>
      );
    case 'send':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
        </svg>
      );
    case 'dollar-sign':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.514.111.987.29 1.388.545.669.424 1.112 1.048 1.112 1.78 0 .733-.443 1.357-1.112 1.78a4.614 4.614 0 01-1.388.546v.184a.75.75 0 01-1.5 0v-.184a4.614 4.614 0 01-1.388-.546C7.443 12.982 7 12.358 7 11.625c0-.733.443-1.356 1.112-1.78.401-.254.874-.434 1.388-.545V6.801a2.187 2.187 0 00-.736.363 1.35 1.35 0 00-.447.563.75.75 0 01-1.395-.55c.18-.46.5-.87.925-1.2a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      );
    case 'handshake':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
        </svg>
      );
    case 'search':
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
      );
  }
}

ClusterIcon.propTypes = {
  name: PropTypes.string,
};

/**
 * Category badge color mappings.
 * @type {Record<string, string>}
 */
const CATEGORY_BADGE_CLASSES = {
  management: 'text-dreeso-accent-400 bg-dreeso-accent-500/10 border-dreeso-accent-500/20',
  finance: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  risk: 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20',
  reporting: 'text-dreeso-dark-300 bg-dreeso-dark-700/50 border-dreeso-dark-600/30',
  workforce: 'text-dreeso-accent-300 bg-dreeso-accent-500/10 border-dreeso-accent-500/20',
  compliance: 'text-semantic-success bg-semantic-success/10 border-semantic-success/20',
  procurement: 'text-semantic-info bg-semantic-info/10 border-semantic-info/20',
  schedule: 'text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20',
  analysis: 'text-dreeso-dark-300 bg-dreeso-dark-700/50 border-dreeso-dark-600/30',
  sales: 'text-semantic-error bg-semantic-error/10 border-semantic-error/20',
};

/**
 * Resolve the badge class for a category.
 * @param {string} category - The category string.
 * @returns {string} The Tailwind class string for the badge.
 */
function resolveBadgeClass(category) {
  if (typeof category === 'string' && CATEGORY_BADGE_CLASSES[category]) {
    return CATEGORY_BADGE_CLASSES[category];
  }
  return CATEGORY_BADGE_CLASSES.management;
}

/**
 * IntelligenceCluster component.
 * Renders a single intelligence cluster card with glassmorphism styling,
 * cluster icon, label, description, category badge, and click handler.
 * On click, triggers the cluster's query template via the provided callback.
 * Includes hover elevation and subtle glow animation.
 *
 * @param {object} props
 * @param {object} props.cluster - The cluster data object.
 * @param {string} props.cluster.id - The unique cluster ID.
 * @param {string} props.cluster.label - The cluster display label.
 * @param {string} [props.cluster.description] - The cluster description text.
 * @param {string} [props.cluster.icon] - The icon name for the cluster.
 * @param {string} [props.cluster.queryTemplate] - The query template to trigger on click.
 * @param {string} [props.cluster.category] - The cluster category.
 * @param {number} [props.cluster.priority] - The cluster priority (lower = higher priority).
 * @param {function} [props.onQuerySubmit] - Callback when the cluster is clicked. Receives the query template string.
 * @param {function} [props.onClick] - Optional generic click handler. Receives the cluster object.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {boolean} [props.showCategory=true] - Whether to display the category badge.
 * @param {boolean} [props.showDescription=true] - Whether to display the description text.
 * @param {boolean} [props.compact=false] - Whether to use compact layout.
 * @param {string} [props.accentColor] - Override accent color. Defaults to current persona's colorTheme.
 * @returns {import('react').ReactElement|null} The intelligence cluster card element, or null if no cluster.
 */
export function IntelligenceCluster({
  cluster,
  onQuerySubmit,
  onClick,
  className = '',
  animated = true,
  showCategory = true,
  showDescription = true,
  compact = false,
  accentColor: overrideAccentColor,
}) {
  const { currentPersona } = usePersona();

  const resolvedAccentColor = overrideAccentColor
    || (currentPersona ? currentPersona.colorTheme : '#17b363');

  /**
   * Handle cluster card click.
   */
  const handleClick = useCallback(() => {
    if (!cluster) {
      return;
    }

    if (typeof onClick === 'function') {
      onClick(cluster);
    }

    if (typeof onQuerySubmit === 'function' && typeof cluster.queryTemplate === 'string' && cluster.queryTemplate.trim() !== '') {
      onQuerySubmit(cluster.queryTemplate.trim());
    }
  }, [cluster, onClick, onQuerySubmit]);

  if (!cluster || typeof cluster !== 'object' || Array.isArray(cluster)) {
    return null;
  }

  const {
    id,
    label,
    description,
    icon,
    queryTemplate,
    category,
    priority,
  } = cluster;

  const hasLabel = typeof label === 'string' && label.trim() !== '';
  const hasDescription = typeof description === 'string' && description.trim() !== '';
  const hasQueryTemplate = typeof queryTemplate === 'string' && queryTemplate.trim() !== '';
  const resolvedCategory = typeof category === 'string' && VALID_CATEGORIES.includes(category)
    ? category
    : 'management';

  if (!hasLabel) {
    return null;
  }

  const iconContainerStyle = {
    backgroundColor: `${resolvedAccentColor}15`,
    color: resolvedAccentColor,
  };

  const glowBorderStyle = {
    '--cluster-accent': resolvedAccentColor,
  };

  const animationClass = animated ? 'animate-slide-in' : '';
  const paddingClass = compact ? 'p-4' : 'p-5';

  return (
    <div
      className={`group ${animationClass} ${className}`}
      style={glowBorderStyle}
    >
      <GlassCard
        variant="sm"
        animated={false}
        hoverable
        noPadding
        onClick={handleClick}
        className={`${paddingClass} transition-all duration-200 ease-out hover:shadow-glass-lg hover:border-glass-hover`}
      >
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {/* Header: Icon + Label */}
          <div className="flex items-start gap-3">
            {/* Icon container */}
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={iconContainerStyle}
            >
              <ClusterIcon name={icon} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Label */}
              <h3 className="text-sm font-semibold text-white leading-tight truncate group-hover:text-dreeso-accent-300 transition-colors duration-150">
                {label}
              </h3>

              {/* Category badge */}
              {showCategory && (
                <span
                  className={`inline-flex items-center mt-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded ${resolveBadgeClass(resolvedCategory)}`}
                >
                  {resolvedCategory}
                </span>
              )}
            </div>

            {/* Arrow indicator */}
            <div className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-4 h-4 text-dreeso-dark-400 group-hover:text-dreeso-accent-400 transition-colors duration-150"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Description */}
          {showDescription && hasDescription && (
            <p className={`text-xs text-dreeso-dark-300 leading-relaxed ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {description}
            </p>
          )}

          {/* Query template preview */}
          {hasQueryTemplate && !compact && (
            <div className="flex items-center gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-3 h-3 text-dreeso-dark-500 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[11px] text-dreeso-dark-500 truncate">
                {queryTemplate}
              </span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

IntelligenceCluster.propTypes = {
  cluster: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    queryTemplate: PropTypes.string,
    category: PropTypes.string,
    priority: PropTypes.number,
    personaId: PropTypes.string,
  }).isRequired,
  onQuerySubmit: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  animated: PropTypes.bool,
  showCategory: PropTypes.bool,
  showDescription: PropTypes.bool,
  compact: PropTypes.bool,
  accentColor: PropTypes.string,
};

export default IntelligenceCluster;