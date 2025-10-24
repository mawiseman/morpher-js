/**
 * LocalStorage wrapper with automatic JSON serialization
 */
export class LocalStorageManager {
  constructor(namespace = 'morpher') {
    this.namespace = namespace;
  }

  /**
   * Get key with namespace
   * @param {string} key
   * @returns {string}
   */
  _getKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Save item
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this._getKey(key), serialized);
      return true;
    } catch (e) {
      console.error('LocalStorage set error:', e);
      return false;
    }
  }

  /**
   * Get item
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this._getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('LocalStorage get error:', e);
      return defaultValue;
    }
  }

  /**
   * Remove item
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(this._getKey(key));
  }

  /**
   * Clear all items in namespace
   */
  clear() {
    const keys = Object.keys(localStorage);
    const prefix = `${this.namespace}:`;
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get all items in namespace
   * @returns {Array}
   */
  getAll() {
    const items = [];
    const keys = Object.keys(localStorage);
    const prefix = `${this.namespace}:`;

    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        const shortKey = key.substring(prefix.length);
        items.push({
          key: shortKey,
          value: this.get(shortKey)
        });
      }
    });

    return items;
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return localStorage.getItem(this._getKey(key)) !== null;
  }
}

/**
 * Generate a random color
 * @returns {string} hex color
 */
export function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
