/**
 * ID Generator Utility
 *
 * Provides functions for generating unique identifiers.
 */

let counter = 0;

/**
 * Generate a unique numeric ID
 * Increments with each call
 *
 * @returns {number} - Unique numeric ID
 */
export function generateNumericId() {
  return ++counter;
}

/**
 * Generate a unique string ID with optional prefix
 *
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique string ID (e.g., 'id_123' or 'project_456')
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${++counter}`;
}

/**
 * Generate a random string ID
 * Uses timestamp and random number for uniqueness
 *
 * @param {number} length - Desired length of ID (default: 8)
 * @returns {string} - Random string ID
 */
export function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate a UUID v4 (random)
 * Follows RFC 4122 format
 *
 * @returns {string} - UUID string (e.g., '550e8400-e29b-41d4-a716-446655440000')
 */
export function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short unique ID
 * Based on timestamp and random number
 *
 * @returns {string} - Short ID (e.g., '1a2b3c4d')
 */
export function generateShortId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `${timestamp}${randomPart}`;
}

/**
 * Generate a timestamp-based ID
 * Useful for sorting by creation time
 *
 * @param {string} prefix - Optional prefix
 * @returns {string} - Timestamp-based ID
 */
export function generateTimestampId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Reset the counter
 * Useful for testing
 */
export function resetCounter() {
  counter = 0;
}

/**
 * Get current counter value
 *
 * @returns {number} - Current counter value
 */
export function getCounter() {
  return counter;
}

/**
 * Check if a string is a valid UUID
 *
 * @param {string} uuid - String to validate
 * @returns {boolean} - true if valid UUID
 */
export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a hash code from a string
 * Useful for generating consistent IDs from strings
 *
 * @param {string} str - Input string
 * @returns {number} - Hash code
 */
export function hashCode(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash);
}

/**
 * Generate a namespaced ID generator
 * Creates a scoped generator with its own counter
 *
 * @param {string} namespace - Namespace for the generator
 * @returns {Object} - Namespaced generator with generateId method
 */
export function createNamespacedGenerator(namespace) {
  let localCounter = 0;

  return {
    generateId() {
      return `${namespace}_${++localCounter}`;
    },
    reset() {
      localCounter = 0;
    },
    getCounter() {
      return localCounter;
    },
  };
}

// Default export
export default {
  generateNumericId,
  generateId,
  generateRandomId,
  generateUUID,
  generateShortId,
  generateTimestampId,
  resetCounter,
  getCounter,
  isValidUUID,
  hashCode,
  createNamespacedGenerator,
};
