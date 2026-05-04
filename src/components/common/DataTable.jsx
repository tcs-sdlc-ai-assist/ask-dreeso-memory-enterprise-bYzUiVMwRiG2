/**
 * DataTable — Reusable data table component with fixed header, zebra-striped rows,
 * and responsive horizontal scroll. Accepts columns and rows arrays.
 * Implements Uber Design System table guidelines with proper alignment rules.
 *
 * @module DataTable
 */

import PropTypes from 'prop-types';

/**
 * Valid column alignment values.
 * @type {string[]}
 */
const VALID_ALIGNMENTS = ['left', 'center', 'right'];

/**
 * CSS class mappings for column alignment.
 * @type {Record<string, string>}
 */
const ALIGNMENT_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Resolve the alignment class for a column.
 * @param {string} [align='left'] - The alignment value.
 * @returns {string} The Tailwind alignment class.
 */
function resolveAlignment(align) {
  if (typeof align === 'string' && VALID_ALIGNMENTS.includes(align)) {
    return ALIGNMENT_CLASSES[align];
  }
  return ALIGNMENT_CLASSES.left;
}

/**
 * Normalize columns input. Supports two formats:
 * 1. Array of objects with { key, label, align }
 * 2. Array of strings (used as both key and label)
 *
 * @param {Array} columns - The columns definition.
 * @returns {object[]} Normalized array of column objects with key, label, and align.
 */
function normalizeColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [];
  }

  return columns.map((col, index) => {
    if (typeof col === 'string') {
      return {
        key: col,
        label: col,
        align: 'left',
        _index: index,
      };
    }

    if (col && typeof col === 'object' && !Array.isArray(col)) {
      return {
        key: col.key || col.label || `col-${index}`,
        label: col.label || col.key || `Column ${index + 1}`,
        align: VALID_ALIGNMENTS.includes(col.align) ? col.align : 'left',
        _index: index,
      };
    }

    return {
      key: `col-${index}`,
      label: `Column ${index + 1}`,
      align: 'left',
      _index: index,
    };
  });
}

/**
 * Resolve the cell value from a row. Supports two row formats:
 * 1. Array of values (positional, matched by column index)
 * 2. Object with keys matching column keys
 *
 * @param {Array|object} row - The row data.
 * @param {object} column - The normalized column object.
 * @returns {string} The resolved cell value as a string.
 */
function resolveCellValue(row, column) {
  if (Array.isArray(row)) {
    const value = row[column._index];
    return value !== null && value !== undefined ? String(value) : '';
  }

  if (row && typeof row === 'object') {
    const value = row[column.key];
    return value !== null && value !== undefined ? String(value) : '';
  }

  return '';
}

/**
 * Determine the semantic color class for a cell value based on common status patterns.
 * @param {string} value - The cell value string.
 * @returns {string} Additional Tailwind class for semantic coloring, or empty string.
 */
function getSemanticColorClass(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const lower = value.toLowerCase().trim();

  if (lower === 'green' || lower === 'on track' || lower === 'compliant' || lower === 'current' || lower === 'achieved') {
    return 'text-semantic-success';
  }

  if (lower === 'amber' || lower === 'at risk' || lower === 'minor deviation' || lower === 'medium' || lower === 'below target' || lower === 'action required' || lower === 'tight') {
    return 'text-semantic-warning';
  }

  if (lower === 'red' || lower === 'flagged' || lower === 'critical' || lower === 'high' || lower === 'overdue' || lower === 'delayed' || lower === 'disputed') {
    return 'text-semantic-error';
  }

  if (lower === 'new' || lower === 'pending' || lower === 'under review' || lower === 'negotiation' || lower === 'pending review') {
    return 'text-semantic-info';
  }

  return '';
}

/**
 * DataTable component.
 * Renders a responsive data table with fixed header, zebra-striped rows,
 * and glassmorphism styling consistent with the design system.
 *
 * @param {object} props
 * @param {Array} props.columns - Array of column definitions. Each item can be:
 *   - A string (used as both key and label, left-aligned)
 *   - An object with { key: string, label: string, align?: 'left'|'center'|'right' }
 * @param {Array} props.rows - Array of row data. Each item can be:
 *   - An array of values (positional, matched by column index)
 *   - An object with keys matching column keys
 * @param {string} [props.title=''] - Optional table title displayed above the table.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @param {boolean} [props.striped=true] - Whether to apply zebra-striped row styling.
 * @param {boolean} [props.compact=false] - Whether to use compact row padding.
 * @param {boolean} [props.hoverable=true] - Whether rows have hover effects.
 * @param {boolean} [props.semanticColors=true] - Whether to apply semantic coloring to status values.
 * @param {string} [props.emptyMessage='No data available'] - Message to display when rows are empty.
 * @returns {import('react').ReactElement} The data table element.
 */
export function DataTable({
  columns,
  rows,
  title = '',
  className = '',
  striped = true,
  compact = false,
  hoverable = true,
  semanticColors = true,
  emptyMessage = 'No data available',
}) {
  const normalizedColumns = normalizeColumns(columns);

  const hasValidColumns = normalizedColumns.length > 0;
  const hasRows = Array.isArray(rows) && rows.length > 0;

  const cellPaddingClass = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPaddingClass = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={`w-full ${className}`}>
      {typeof title === 'string' && title.trim() !== '' && (
        <h3 className="text-sm font-medium text-dreeso-dark-300 mb-3">
          {title}
        </h3>
      )}
      <div className="w-full overflow-x-auto rounded-xl border border-glass-border scrollbar-hide">
        <table className="w-full min-w-full border-collapse" role="table">
          {hasValidColumns && (
            <thead className="sticky top-0 z-10">
              <tr className="bg-dreeso-dark-900/80 backdrop-blur-sm border-b border-glass-border">
                {normalizedColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`${headerPaddingClass} ${resolveAlignment(col.align)} text-xs font-semibold uppercase tracking-wider text-dreeso-dark-400 whitespace-nowrap`}
                    scope="col"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-glass-border/50">
            {hasValidColumns && hasRows ? (
              rows.map((row, rowIndex) => {
                const stripeClass = striped && rowIndex % 2 === 1
                  ? 'bg-glass-white/30'
                  : 'bg-transparent';
                const hoverClass = hoverable
                  ? 'hover:bg-glass-hover transition-colors duration-150'
                  : '';

                return (
                  <tr
                    key={`row-${rowIndex}`}
                    className={`${stripeClass} ${hoverClass}`}
                  >
                    {normalizedColumns.map((col) => {
                      const cellValue = resolveCellValue(row, col);
                      const semanticClass = semanticColors
                        ? getSemanticColorClass(cellValue)
                        : '';
                      const textColorClass = semanticClass || 'text-dreeso-dark-100';

                      return (
                        <td
                          key={`row-${rowIndex}-${col.key}`}
                          className={`${cellPaddingClass} ${resolveAlignment(col.align)} text-sm ${textColorClass} whitespace-nowrap`}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={hasValidColumns ? normalizedColumns.length : 1}
                  className="px-4 py-8 text-center text-sm text-dreeso-dark-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasRows && (
        <div className="mt-2 text-xs text-dreeso-dark-500 text-right">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        align: PropTypes.oneOf(VALID_ALIGNMENTS),
      }),
    ])
  ).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ])
  ).isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  striped: PropTypes.bool,
  compact: PropTypes.bool,
  hoverable: PropTypes.bool,
  semanticColors: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

export default DataTable;