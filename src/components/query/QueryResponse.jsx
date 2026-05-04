/**
 * QueryResponse — Query response display component for Ask Dreeso Memory.
 * Renders structured response in a glassmorphism card with title, summary text,
 * data table (if present), and chart placeholder. Includes slide-in animation
 * on mount. Displays source systems used and response timestamp.
 *
 * @module QueryResponse
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { GlassCard } from '@/components/common/GlassCard';
import { DataTable } from '@/components/common/DataTable';

/**
 * Format an ISO timestamp into a human-readable string.
 * @param {string} isoTimestamp - The ISO timestamp string.
 * @returns {string} A formatted date/time string, or empty string if invalid.
 */
function formatTimestamp(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.trim() === '') {
    return '';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (_err) {
    return '';
  }
}

/**
 * Format a match score as a percentage string.
 * @param {number} score - The match score between 0 and 1.
 * @returns {string} The formatted percentage string.
 */
function formatMatchScore(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return '';
  }
  return `${Math.round(score * 100)}%`;
}

/**
 * Resolve the color class for a match score.
 * @param {number} score - The match score between 0 and 1.
 * @returns {string} The Tailwind text color class.
 */
function getMatchScoreColor(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return 'text-dreeso-dark-400';
  }
  if (score >= 0.8) return 'text-semantic-success';
  if (score >= 0.5) return 'text-semantic-warning';
  if (score > 0) return 'text-semantic-error';
  return 'text-dreeso-dark-400';
}

/**
 * SourceSystemBadge — Renders a single source system badge.
 *
 * @param {object} props
 * @param {string} props.name - The source system name.
 * @returns {import('react').ReactElement} The badge element.
 */
function SourceSystemBadge({ name }) {
  if (typeof name !== 'string' || name.trim() === '') {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-dreeso-dark-300 bg-dreeso-dark-800/60 border border-glass-border rounded-lg whitespace-nowrap">
      <svg
        className="w-3 h-3 text-dreeso-dark-400 shrink-0"
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
      {name}
    </span>
  );
}

SourceSystemBadge.propTypes = {
  name: PropTypes.string.isRequired,
};

/**
 * ChartPlaceholder — Renders a placeholder for chart data.
 *
 * @param {object} props
 * @param {object} props.chart - The chart data object.
 * @returns {import('react').ReactElement} The chart placeholder element.
 */
function ChartPlaceholder({ chart }) {
  if (!chart || typeof chart !== 'object') {
    return null;
  }

  const title = chart.title || 'Chart';
  const type = chart.type || 'bar';
  const data = Array.isArray(chart.data) ? chart.data : [];

  return (
    <div className="bg-dreeso-dark-900/50 border border-glass-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-dreeso-dark-200">
          {title}
        </h4>
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
          {type}
        </span>
      </div>

      {data.length > 0 && (
        <div className="space-y-2">
          {data.map((item, index) => {
            const label = item.label || `Item ${index + 1}`;
            const value = typeof item.value === 'number' ? item.value : 0;
            const maxValue = Math.max(...data.map((d) => (typeof d.value === 'number' ? Math.abs(d.value) : 0)), 1);
            const barWidth = Math.max(Math.abs(value) / maxValue * 100, 2);

            return (
              <div key={`chart-item-${index}`} className="flex items-center gap-3">
                <span className="text-xs text-dreeso-dark-400 w-24 truncate shrink-0 text-right">
                  {label}
                </span>
                <div className="flex-1 h-5 bg-dreeso-dark-800 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md bg-dreeso-accent-500/60 transition-all duration-500 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs text-dreeso-dark-300 w-14 text-right shrink-0 font-mono">
                  {typeof item.value === 'number' ? item.value : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {data.length === 0 && (
        <div className="flex items-center justify-center h-24 text-xs text-dreeso-dark-500">
          No chart data available
        </div>
      )}
    </div>
  );
}

ChartPlaceholder.propTypes = {
  chart: PropTypes.object.isRequired,
};

/**
 * CTABubble — Renders a single CTA follow-up suggestion bubble.
 *
 * @param {object} props
 * @param {string} props.text - The CTA text.
 * @param {function} [props.onClick] - Optional click handler.
 * @returns {import('react').ReactElement} The CTA bubble element.
 */
function CTABubble({ text, onClick }) {
  if (typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  const isInteractive = typeof onClick === 'function';

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-2 text-xs text-dreeso-dark-200 bg-glass-white border border-glass-border rounded-xl transition-all duration-150 text-left ${
        isInteractive
          ? 'cursor-pointer hover:bg-glass-hover hover:text-white hover:border-dreeso-accent-500/30 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500/50'
          : 'cursor-default'
      }`}
      onClick={isInteractive ? () => onClick(text) : undefined}
      aria-label={`Follow-up query: ${text}`}
    >
      <svg
        className="w-3 h-3 text-dreeso-accent-400 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
          clipRule="evenodd"
        />
      </svg>
      <span className="line-clamp-2">{text}</span>
    </button>
  );
}

CTABubble.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

/**
 * QueryResponse component.
 * Renders a structured query response in a glassmorphism card with title,
 * summary text, data tables (if present), chart placeholders, source systems,
 * CTA follow-up bubbles, and response timestamp. Includes slide-in animation
 * on mount.
 *
 * @param {object} props
 * @param {object} props.response - The structured query response object from QueryEngine.
 * @param {string} [props.response.title] - The response title.
 * @param {string} [props.response.summary] - The response summary text.
 * @param {object[]} [props.response.dataTables] - Array of data table objects.
 * @param {object[]} [props.response.chartsData] - Array of chart data objects.
 * @param {string[]} [props.response.sourceSystems] - Array of source system names.
 * @param {string[]} [props.response.ctaBubbles] - Array of CTA follow-up query strings.
 * @param {number} [props.response.matchScore] - The match score between 0 and 1.
 * @param {string} [props.response.timestamp] - ISO timestamp of the response.
 * @param {string} [props.response.queryText] - The original query text.
 * @param {boolean} [props.response.actionable] - Whether the response has actionable items.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {function} [props.onCTAClick] - Optional callback when a CTA bubble is clicked.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {boolean} [props.showMatchScore=false] - Whether to display the match score.
 * @param {boolean} [props.showTimestamp=true] - Whether to display the response timestamp.
 * @param {boolean} [props.showSourceSystems=true] - Whether to display source systems.
 * @param {boolean} [props.showCTAs=true] - Whether to display CTA follow-up bubbles.
 * @param {boolean} [props.showCharts=true] - Whether to display chart placeholders.
 * @returns {import('react').ReactElement|null} The query response element, or null if no response.
 */
export function QueryResponse({
  response,
  className = '',
  onCTAClick,
  animated = true,
  showMatchScore = false,
  showTimestamp = true,
  showSourceSystems = true,
  showCTAs = true,
  showCharts = true,
}) {
  /**
   * Memoized formatted timestamp.
   * @type {string}
   */
  const formattedTimestamp = useMemo(() => {
    if (!response || !response.timestamp) return '';
    return formatTimestamp(response.timestamp);
  }, [response]);

  /**
   * Memoized match score display.
   * @type {{ text: string, colorClass: string }}
   */
  const matchScoreDisplay = useMemo(() => {
    if (!response || typeof response.matchScore !== 'number') {
      return { text: '', colorClass: '' };
    }
    return {
      text: formatMatchScore(response.matchScore),
      colorClass: getMatchScoreColor(response.matchScore),
    };
  }, [response]);

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return null;
  }

  const {
    title,
    summary,
    dataTables,
    chartsData,
    sourceSystems,
    ctaBubbles,
    queryText,
    actionable,
  } = response;

  const hasTitle = typeof title === 'string' && title.trim() !== '';
  const hasSummary = typeof summary === 'string' && summary.trim() !== '';
  const hasDataTables = Array.isArray(dataTables) && dataTables.length > 0;
  const hasCharts = Array.isArray(chartsData) && chartsData.length > 0;
  const hasSourceSystems = Array.isArray(sourceSystems) && sourceSystems.length > 0;
  const hasCTAs = Array.isArray(ctaBubbles) && ctaBubbles.length > 0;
  const hasQueryText = typeof queryText === 'string' && queryText.trim() !== '';

  return (
    <GlassCard
      variant="default"
      animated={animated}
      className={`space-y-5 ${className}`}
    >
      {/* Header section */}
      <div className="space-y-3">
        {/* Query text echo */}
        {hasQueryText && (
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-dreeso-accent-400 shrink-0 mt-0.5"
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
            <p className="text-sm text-dreeso-dark-300 italic leading-relaxed">
              &ldquo;{queryText}&rdquo;
            </p>
          </div>
        )}

        {/* Title */}
        {hasTitle && (
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white leading-tight">
              {title}
            </h2>
            {actionable && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dreeso-accent-400 bg-dreeso-accent-500/10 border border-dreeso-accent-500/20 rounded-lg">
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5A.75.75 0 013.75 10zm14.5 0a.75.75 0 01-.75-.75h-1.5a.75.75 0 010 1.5h1.5a.75.75 0 01.75-.75zM5.05 16.95a.75.75 0 011.06 0l1.06-1.06a.75.75 0 01-1.06-1.061l-1.06 1.06a.75.75 0 010 1.06zm9.9 0a.75.75 0 010-1.06l-1.06-1.061a.75.75 0 01-1.061 1.06l1.06 1.06a.75.75 0 011.06 0zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z"
                    clipRule="evenodd"
                  />
                </svg>
                Actionable
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {hasSummary && (
          <p className="text-sm text-dreeso-dark-200 leading-relaxed">
            {summary}
          </p>
        )}
      </div>

      {/* Data Tables */}
      {hasDataTables && (
        <div className="space-y-4">
          {dataTables.map((table, index) => {
            if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
              return null;
            }

            return (
              <DataTable
                key={table.tableId || `table-${index}`}
                columns={table.columns}
                rows={table.rows}
                title={table.title || ''}
                striped
                hoverable
                semanticColors
                compact={false}
              />
            );
          })}
        </div>
      )}

      {/* Charts */}
      {showCharts && hasCharts && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-dreeso-dark-300">
            Visualizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartsData.map((chart, index) => (
              <ChartPlaceholder
                key={chart.chartId || `chart-${index}`}
                chart={chart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Source Systems */}
      {showSourceSystems && hasSourceSystems && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
            Source Systems
          </h3>
          <div className="flex flex-wrap gap-2">
            {sourceSystems.map((system, index) => (
              <SourceSystemBadge
                key={`source-${index}`}
                name={typeof system === 'string' ? system : ''}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA Follow-up Bubbles */}
      {showCTAs && hasCTAs && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-dreeso-dark-400">
            Follow-up Questions
          </h3>
          <div className="flex flex-wrap gap-2">
            {ctaBubbles.map((cta, index) => {
              const ctaText = typeof cta === 'string' ? cta : '';
              if (ctaText.trim() === '') return null;

              return (
                <CTABubble
                  key={`cta-${index}`}
                  text={ctaText}
                  onClick={onCTAClick}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Timestamp & Match Score */}
      <div className="flex items-center justify-between pt-3 border-t border-glass-border/50">
        <div className="flex items-center gap-3">
          {showTimestamp && formattedTimestamp && (
            <span className="text-[11px] text-dreeso-dark-500">
              {formattedTimestamp}
            </span>
          )}
          {showMatchScore && matchScoreDisplay.text && (
            <span className={`text-[11px] font-mono ${matchScoreDisplay.colorClass}`}>
              Match: {matchScoreDisplay.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-dreeso-accent-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z"
            />
            <path
              fillRule="evenodd"
              d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[11px] text-dreeso-dark-500">
            Ask Dreeso Memory
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

QueryResponse.propTypes = {
  response: PropTypes.shape({
    title: PropTypes.string,
    summary: PropTypes.string,
    dataTables: PropTypes.arrayOf(
      PropTypes.shape({
        tableId: PropTypes.string,
        title: PropTypes.string,
        columns: PropTypes.array,
        rows: PropTypes.array,
      })
    ),
    chartsData: PropTypes.arrayOf(
      PropTypes.shape({
        chartId: PropTypes.string,
        type: PropTypes.string,
        title: PropTypes.string,
        data: PropTypes.array,
      })
    ),
    sourceSystems: PropTypes.arrayOf(PropTypes.string),
    ctaBubbles: PropTypes.arrayOf(PropTypes.string),
    matchScore: PropTypes.number,
    timestamp: PropTypes.string,
    queryText: PropTypes.string,
    actionable: PropTypes.bool,
    queryId: PropTypes.string,
    clusterId: PropTypes.string,
    personaId: PropTypes.string,
  }),
  className: PropTypes.string,
  onCTAClick: PropTypes.func,
  animated: PropTypes.bool,
  showMatchScore: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  showSourceSystems: PropTypes.bool,
  showCTAs: PropTypes.bool,
  showCharts: PropTypes.bool,
};

export default QueryResponse;