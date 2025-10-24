/**
 * localStorage Wrapper Utility
 *
 * Provides a safe and convenient interface for working with browser localStorage.
 * Handles JSON serialization/deserialization and error handling.
 */

/**
 * Check if localStorage is available
 * @returns {boolean} - true if localStorage is supported and available
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get an item from localStorage
 *
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} - Parsed value or default value
 */
export function getItem(key, defaultValue = null) {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading from localStorage (key: ${key}):`, e);
    return defaultValue;
  }
}

/**
 * Set an item in localStorage
 *
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} - true if successful
 */
export function setItem(key, value) {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing to localStorage (key: ${key}):`, e);
    return false;
  }
}

/**
 * Remove an item from localStorage
 *
 * @param {string} key - Storage key
 * @returns {boolean} - true if successful
 */
export function removeItem(key) {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing from localStorage (key: ${key}):`, e);
    return false;
  }
}

/**
 * Clear all items from localStorage
 *
 * @returns {boolean} - true if successful
 */
export function clear() {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (e) {
    console.error('Error clearing localStorage:', e);
    return false;
  }
}

/**
 * Get all keys in localStorage
 *
 * @param {string} prefix - Optional prefix to filter keys
 * @returns {string[]} - Array of keys
 */
export function getKeys(prefix = '') {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return [];
  }

  try {
    const keys = Object.keys(localStorage);
    return prefix ? keys.filter((key) => key.startsWith(prefix)) : keys;
  } catch (e) {
    console.error('Error getting keys from localStorage:', e);
    return [];
  }
}

/**
 * Get multiple items from localStorage
 *
 * @param {string[]} keys - Array of storage keys
 * @returns {Object} - Object with key-value pairs
 */
export function getItems(keys) {
  const items = {};

  for (const key of keys) {
    items[key] = getItem(key);
  }

  return items;
}

/**
 * Set multiple items in localStorage
 *
 * @param {Object} items - Object with key-value pairs
 * @returns {boolean} - true if all successful
 */
export function setItems(items) {
  let allSuccess = true;

  for (const [key, value] of Object.entries(items)) {
    if (!setItem(key, value)) {
      allSuccess = false;
    }
  }

  return allSuccess;
}

/**
 * Check if a key exists in localStorage
 *
 * @param {string} key - Storage key
 * @returns {boolean} - true if key exists
 */
export function hasItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }

  return localStorage.getItem(key) !== null;
}

/**
 * Get storage size estimate in bytes
 *
 * @returns {number} - Estimated size in bytes
 */
export function getSize() {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += key.length + localStorage.getItem(key).length;
      }
    }
    return size;
  } catch (e) {
    console.error('Error calculating localStorage size:', e);
    return 0;
  }
}

/**
 * Storage event listener helper
 * Listen for storage changes from other tabs/windows
 *
 * @param {Function} callback - Callback function (event) => void
 * @returns {Function} - Cleanup function to remove listener
 */
export function onStorageChange(callback) {
  const handler = (event) => {
    callback({
      key: event.key,
      oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
      newValue: event.newValue ? JSON.parse(event.newValue) : null,
      url: event.url,
    });
  };

  window.addEventListener('storage', handler);

  return () => window.removeEventListener('storage', handler);
}

/**
 * Create a namespaced storage interface
 * Useful for isolating storage by feature/module
 *
 * @param {string} namespace - Namespace prefix
 * @returns {Object} - Namespaced storage interface
 */
export function createNamespace(namespace) {
  const prefix = `${namespace}:`;

  return {
    getItem: (key, defaultValue) => getItem(prefix + key, defaultValue),
    setItem: (key, value) => setItem(prefix + key, value),
    removeItem: (key) => removeItem(prefix + key),
    hasItem: (key) => hasItem(prefix + key),
    getKeys: () => getKeys(prefix).map((key) => key.replace(prefix, '')),
    clear: () => {
      const keys = getKeys(prefix);
      for (const key of keys) {
        removeItem(key);
      }
      return true;
    },
  };
}

// Default export for convenience
export default {
  isStorageAvailable,
  getItem,
  setItem,
  removeItem,
  clear,
  getKeys,
  getItems,
  setItems,
  hasItem,
  getSize,
  onStorageChange,
  createNamespace,
};
