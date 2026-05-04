/**
 * Low-level localStorage abstraction utility.
 * Provides JSON-safe read/write operations with graceful error handling.
 * Foundation for DataManager and AuditLogger.
 */

/**
 * Retrieve a value from localStorage by key, automatically parsing JSON.
 * @param {string} key - The localStorage key to retrieve.
 * @param {*} [defaultValue=null] - Value to return if key is not found or parse fails.
 * @returns {*} The parsed value, or defaultValue if not found or on parse error.
 */
export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return defaultValue;
  }
}

/**
 * Store a value in localStorage, automatically stringifying to JSON.
 * @param {string} key - The localStorage key to set.
 * @param {*} value - The value to store (will be JSON-stringified).
 * @returns {boolean} True if the operation succeeded, false otherwise.
 */
export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Remove a single item from localStorage by key.
 * @param {string} key - The localStorage key to remove.
 * @returns {boolean} True if the operation succeeded, false otherwise.
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Clear all items from localStorage.
 * @returns {boolean} True if the operation succeeded, false otherwise.
 */
export function clear() {
  try {
    localStorage.clear();
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get all keys currently stored in localStorage.
 * Optionally filter by a prefix string.
 * @param {string} [prefix=''] - If provided, only keys starting with this prefix are returned.
 * @returns {string[]} An array of matching localStorage keys.
 */
export function getKeys(prefix = '') {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (_error) {
    return [];
  }
}

/**
 * Check whether a key exists in localStorage.
 * @param {string} key - The localStorage key to check.
 * @returns {boolean} True if the key exists, false otherwise.
 */
export function hasKey(key) {
  try {
    return localStorage.getItem(key) !== null;
  } catch (_error) {
    return false;
  }
}