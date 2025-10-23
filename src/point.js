import { EventDispatcher } from './event-dispatcher.js';

/**
 * Point
 *
 * Represents a 2D point in the mesh
 * Can be constrained within mesh bounds
 *
 * @class Point
 * @extends EventDispatcher
 */
export class Point extends EventDispatcher {
  x = 0;
  y = 0;
  mesh = null;

  /**
   * Create a new Point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {Mesh} [params.mesh] - Parent mesh for bounds checking
   */
  constructor(x, y, params = {}) {
    super();

    if (params.mesh) {
      this.mesh = params.mesh;
    }

    this.setX(x, { silent: true });
    this.setY(y, { silent: true });
  }

  // Getters & Setters

  /**
   * Get X coordinate
   * @returns {number} X coordinate
   */
  getX() {
    return this.x;
  }

  /**
   * Set X coordinate with optional bounds checking
   * @param {number} x - New X coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress change events
   * @returns {Point} Returns this for chaining
   */
  setX(x, params = {}) {
    // Apply bounds if mesh has maxWidth
    if (this.mesh && this.mesh.maxWidth) {
      x = Math.max(-this.mesh.x, Math.min(this.mesh.maxWidth - this.mesh.x, x));
    }

    if (this.x !== x) {
      this.x = x;
      if (!params.silent) {
        this.trigger('change:x change', this);
      }
    }

    return this;
  }

  /**
   * Get Y coordinate
   * @returns {number} Y coordinate
   */
  getY() {
    return this.y;
  }

  /**
   * Set Y coordinate with optional bounds checking
   * @param {number} y - New Y coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress change events
   * @returns {Point} Returns this for chaining
   */
  setY(y, params = {}) {
    // Apply bounds if mesh has maxHeight
    if (this.mesh && this.mesh.maxHeight) {
      y = Math.max(-this.mesh.y, Math.min(this.mesh.maxHeight - this.mesh.y, y));
    }

    if (this.y !== y) {
      this.y = y;
      if (!params.silent) {
        this.trigger('change:y change', this);
      }
    }

    return this;
  }

  // Public Methods

  /**
   * Remove this point (triggers 'remove' event)
   */
  remove() {
    this.trigger('remove', this);
  }

  /**
   * Create a copy of this point
   * @returns {Point} New point with same coordinates
   */
  clone() {
    return new Point(this.x, this.y);
  }

  /**
   * Calculate distance to another point
   * @param {Point} point - Target point
   * @returns {number} Euclidean distance
   */
  distanceTo(point) {
    return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
  }

  /**
   * Apply matrix transformation to this point
   * @param {Matrix} matrix - Transformation matrix
   */
  transform(matrix) {
    const tmpX = matrix.get(0, 0) * this.x + matrix.get(0, 1) * this.y + matrix.get(0, 2);
    const tmpY = matrix.get(1, 0) * this.x + matrix.get(1, 1) * this.y + matrix.get(1, 2);
    this.x = tmpX;
    this.y = tmpY;
  }

  // JSON Serialization

  /**
   * Convert point to JSON
   * @returns {Object} Point data
   */
  toJSON() {
    return { x: this.x, y: this.y };
  }

  /**
   * Load point data from JSON
   * @param {Object} [json={}] - Point data
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.hard=false] - Reset before loading
   */
  fromJSON(json = {}, params = {}) {
    if (params.hard) {
      this.reset();
    }

    this.setX(json.x, params);
    this.setY(json.y, params);
  }

  /**
   * Reset point to null values
   */
  reset() {
    this.x = null;
    this.y = null;
  }

  // Memory Management

  /**
   * Dispose of this point and clean up resources
   *
   * Removes all event listeners and clears references to prevent memory leaks.
   * Call this when the point is no longer needed.
   *
   * @example
   * const point = new Point(100, 200);
   * // ... use point ...
   * point.dispose();
   */
  dispose() {
    // Clear mesh reference
    this.mesh = null;

    // Remove all event listeners from this object
    this.off();

    // Mark as disposed
    this._disposed = true;
  }

  /**
   * Check if point has been disposed
   * @returns {boolean} True if disposed
   */
  isDisposed() {
    return this._disposed === true;
  }
}
