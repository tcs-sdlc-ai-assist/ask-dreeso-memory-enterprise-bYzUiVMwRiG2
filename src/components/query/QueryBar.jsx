/**
 * QueryBar — Persistent query bar component fixed at the bottom of every screen.
 * Expands on focus with smooth animation. Displays autosuggest dropdown filtered
 * by current persona context. Submits queries via useQueryEngine hook.
 * Shows loading spinner during processing. Includes microphone icon placeholder
 * and clear button.
 *
 * @module QueryBar
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { usePersona } from '@/contexts/PersonaContext';
import { useQueryEngine } from '@/hooks/useQueryEngine';

/**
 * Maximum number of autosuggest results to display.
 * @type {number}
 */
const MAX_SUGGESTIONS = 6;

/**
 * Debounce delay for autosuggest input (ms).
 * @type {number}
 */
const SUGGEST_DEBOUNCE_MS = 200;

/**
 * Loading spinner component displayed during query processing.
 * @returns {import('react').ReactElement} The spinner element.
 */
function LoadingSpinner() {
  return (
    <svg
      className="w-5 h-5 animate-spin text-dreeso-accent-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Microphone icon placeholder component.
 * @returns {import('react').ReactElement} The microphone icon element.
 */
function MicrophoneIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
      <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
    </svg>
  );
}

/**
 * Search icon component.
 * @returns {import('react').ReactElement} The search icon element.
 */
function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-dreeso-dark-400 shrink-0"
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
  );
}

/**
 * Clear button icon component.
 * @returns {import('react').ReactElement} The clear icon element.
 */
function ClearIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>
  );
}

/**
 * Category icon mapping for suggestion items.
 * @param {string} category - The suggestion category.
 * @returns {import('react').ReactElement} The category icon element.
 */
function CategoryBadge({ category }) {
  if (typeof category !== 'string' || category.trim() === '') {
    return null;
  }

  return (
    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
      {category}
    </span>
  );
}

CategoryBadge.propTypes = {
  category: PropTypes.string,
};

/**
 * AutosuggestDropdown — Dropdown list of autosuggest results.
 *
 * @param {object} props
 * @param {object[]} props.suggestions - Array of suggestion objects.
 * @param {boolean} props.isLoading - Whether suggestions are loading.
 * @param {number} props.activeIndex - The currently highlighted suggestion index.
 * @param {function} props.onSelect - Callback when a suggestion is selected.
 * @param {function} props.onHover - Callback when a suggestion is hovered.
 * @returns {import('react').ReactElement|null} The dropdown element, or null if no suggestions.
 */
function AutosuggestDropdown({ suggestions, isLoading, activeIndex, onSelect, onHover }) {
  if ((!Array.isArray(suggestions) || suggestions.length === 0) && !isLoading) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 bg-dreeso-dark-900/95 backdrop-blur-lg border border-glass-border rounded-xl shadow-glass-lg z-50 overflow-hidden animate-scale-up"
      role="listbox"
      aria-label="Query suggestions"
    >
      {isLoading && suggestions.length === 0 && (
        <div className="px-4 py-3 flex items-center gap-2 text-sm text-dreeso-dark-400">
          <LoadingSpinner />
          <span>Loading suggestions...</span>
        </div>
      )}
      {Array.isArray(suggestions) && suggestions.length > 0 && (
        <div className="py-1 max-h-64 overflow-y-auto scrollbar-hide">
          {suggestions.map((suggestion, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`suggestion-${index}`}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100 ${
                  isActive
                    ? 'bg-glass-hover text-white'
                    : 'text-dreeso-dark-200 hover:bg-glass-hover hover:text-white'
                }`}
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(suggestion)}
                onMouseEnter={() => onHover(index)}
              >
                <svg
                  className="w-3.5 h-3.5 text-dreeso-dark-500 shrink-0"
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
                <span className="flex-1 truncate">{suggestion.text}</span>
                {suggestion.category && (
                  <CategoryBadge category={suggestion.category} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

AutosuggestDropdown.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool.isRequired,
  activeIndex: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired,
};

/**
 * QueryBar component.
 * Persistent query bar fixed at the bottom of every screen.
 * Expands on focus with smooth animation. Displays autosuggest dropdown
 * filtered by current persona context. Submits queries via useQueryEngine hook.
 * Shows loading spinner during processing. Includes microphone icon placeholder
 * and clear button.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {string} [props.placeholder='Ask a question...'] - Placeholder text for the input.
 * @param {function} [props.onQuerySubmit] - Optional callback when a query is submitted.
 * @param {function} [props.onResponseReceived] - Optional callback when a response is received.
 * @param {boolean} [props.disabled=false] - Whether the query bar is disabled.
 * @param {boolean} [props.showPersonaIndicator=true] - Whether to show the persona indicator.
 * @returns {import('react').ReactElement} The query bar element.
 */
export function QueryBar({
  className = '',
  placeholder = 'Ask a question...',
  onQuerySubmit,
  onResponseReceived,
  disabled = false,
  showPersonaIndicator = true,
}) {
  const { currentPersonaId, currentPersona } = usePersona();
  const {
    submitQuery,
    updateSuggestions,
    clearResponse,
    clearSuggestions,
    suggestions,
    isSuggestLoading,
    isLoading,
    error,
    response,
    queryText,
    setQueryText,
  } = useQueryEngine({ maxSuggestions: MAX_SUGGESTIONS });

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Notify parent when response is received
  useEffect(() => {
    if (response && typeof onResponseReceived === 'function') {
      onResponseReceived(response);
    }
  }, [response, onResponseReceived]);

  // Clear input when persona changes
  useEffect(() => {
    setInputValue('');
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, [currentPersonaId]);

  /**
   * Handle input value changes with debounced autosuggest.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    setInputValue(value);
    setActiveIndex(-1);

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!currentPersonaId) {
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      if (mountedRef.current) {
        updateSuggestions(value);
        setShowSuggestions(true);
      }
    }, SUGGEST_DEBOUNCE_MS);
  }, [currentPersonaId, updateSuggestions]);

  /**
   * Handle query submission.
   * @param {string} [text] - Optional text to submit. Defaults to inputValue.
   */
  const handleSubmit = useCallback((text) => {
    const submitText = typeof text === 'string' ? text : inputValue;

    if (!submitText || submitText.trim() === '') {
      return;
    }

    if (!currentPersonaId) {
      return;
    }

    setShowSuggestions(false);
    setActiveIndex(-1);

    if (typeof onQuerySubmit === 'function') {
      onQuerySubmit(submitText.trim());
    }

    submitQuery(submitText.trim());
  }, [inputValue, currentPersonaId, onQuerySubmit, submitQuery]);

  /**
   * Handle form submission.
   * @param {import('react').FormEvent} event - The form submit event.
   */
  const handleFormSubmit = useCallback((event) => {
    event.preventDefault();
    handleSubmit();
  }, [handleSubmit]);

  /**
   * Handle suggestion selection.
   * @param {object} suggestion - The selected suggestion object.
   */
  const handleSuggestionSelect = useCallback((suggestion) => {
    if (!suggestion || typeof suggestion.text !== 'string') {
      return;
    }

    setInputValue(suggestion.text);
    setShowSuggestions(false);
    setActiveIndex(-1);
    handleSubmit(suggestion.text);
  }, [handleSubmit]);

  /**
   * Handle suggestion hover.
   * @param {number} index - The hovered suggestion index.
   */
  const handleSuggestionHover = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  /**
   * Handle keyboard navigation in the autosuggest dropdown.
   * @param {import('react').KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    if (!showSuggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      if (event.key === 'Escape') {
        setShowSuggestions(false);
        setIsFocused(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= suggestions.length ? 0 : next;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? suggestions.length - 1 : next;
        });
        break;

      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[activeIndex]);
        } else {
          handleSubmit();
        }
        break;

      case 'Escape':
        event.preventDefault();
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;

      case 'Tab':
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;

      default:
        break;
    }
  }, [showSuggestions, suggestions, activeIndex, handleSuggestionSelect, handleSubmit]);

  /**
   * Handle input focus.
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);

    if (currentPersonaId) {
      updateSuggestions(inputValue);
      setShowSuggestions(true);
    }
  }, [currentPersonaId, inputValue, updateSuggestions]);

  /**
   * Handle clear button click.
   */
  const handleClear = useCallback(() => {
    setInputValue('');
    setActiveIndex(-1);
    clearResponse();
    clearSuggestions();
    setShowSuggestions(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [clearResponse, clearSuggestions]);

  const isDisabled = disabled || !currentPersonaId;
  const hasInput = inputValue.trim().length > 0;

  const containerClasses = [
    'relative w-full transition-all duration-200 ease-out',
    isFocused ? 'max-w-3xl' : 'max-w-2xl',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputContainerClasses = [
    'flex items-center gap-2 rounded-xl border backdrop-blur-md transition-all duration-200',
    isFocused
      ? 'bg-dreeso-dark-900/90 border-dreeso-accent-500/50 shadow-accent-glow'
      : 'bg-glass-white border-glass-border shadow-glass-sm',
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    'px-4 py-3',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role="search"
      aria-label="Query search bar"
    >
      {/* Autosuggest Dropdown */}
      {showSuggestions && !isLoading && (
        <AutosuggestDropdown
          suggestions={suggestions}
          isLoading={isSuggestLoading}
          activeIndex={activeIndex}
          onSelect={handleSuggestionSelect}
          onHover={handleSuggestionHover}
        />
      )}

      <form onSubmit={handleFormSubmit} className="w-full">
        <div className={inputContainerClasses}>
          {/* Persona indicator */}
          {showPersonaIndicator && currentPersona && (
            <div
              className="hidden sm:flex items-center gap-1.5 shrink-0 pr-2 border-r border-glass-border/50"
              aria-label={`Current persona: ${currentPersona.name}`}
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: currentPersona.colorTheme }}
              />
              <span className="text-xs text-dreeso-dark-400 truncate max-w-[80px]">
                {currentPersona.name}
              </span>
            </div>
          )}

          {/* Search icon or loading spinner */}
          <div className="shrink-0">
            {isLoading ? <LoadingSpinner /> : <SearchIcon />}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm text-white placeholder-dreeso-dark-400 outline-none min-w-0"
            placeholder={currentPersonaId ? placeholder : 'Select a persona to start querying...'}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            autoComplete="off"
            aria-label="Query input"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
          />

          {/* Clear button */}
          {hasInput && !isLoading && (
            <button
              type="button"
              className="shrink-0 p-1 rounded-lg text-dreeso-dark-400 hover:text-white hover:bg-glass-hover transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
              onClick={handleClear}
              aria-label="Clear query"
            >
              <ClearIcon />
            </button>
          )}

          {/* Microphone icon placeholder */}
          <button
            type="button"
            className="shrink-0 p-1 rounded-lg text-dreeso-dark-500 hover:text-dreeso-dark-300 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
            aria-label="Voice input (coming soon)"
            title="Voice input (coming soon)"
            disabled={isDisabled}
          >
            <MicrophoneIcon />
          </button>

          {/* Submit button */}
          <button
            type="submit"
            className={`shrink-0 p-1.5 rounded-lg transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              hasInput && !isLoading && !isDisabled
                ? 'text-dreeso-accent-400 hover:text-dreeso-accent-300 hover:bg-dreeso-accent-500/10'
                : 'text-dreeso-dark-500 cursor-not-allowed'
            }`}
            disabled={!hasInput || isLoading || isDisabled}
            aria-label="Submit query"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && !isLoading && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-4 py-2 bg-semantic-error/10 border border-semantic-error/30 rounded-xl text-xs text-semantic-error">
          {error}
        </div>
      )}
    </div>
  );
}

QueryBar.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  onQuerySubmit: PropTypes.func,
  onResponseReceived: PropTypes.func,
  disabled: PropTypes.bool,
  showPersonaIndicator: PropTypes.bool,
};

export default QueryBar;