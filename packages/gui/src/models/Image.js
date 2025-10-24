/**
 * Image Model
 *
 * Represents a single image in a morphing project.
 * Wraps the Morpher library's Image class and provides:
 * - URL and file (base64) management
 * - Weight tracking (target and actual)
 * - Event emission for changes
 * - Serialization for storage
 *
 * Events:
 * - change:src - Fired when image source changes
 * - change:weight - Fired when weight changes
 * - change:url - Fired when URL changes
 */

import { generateId } from '../utils/id-generator.js';

export class Image extends EventTarget {
  /**
   * @param {Object} attrs - Image attributes
   * @param {string} [attrs.id] - Unique identifier
   * @param {string} [attrs.url=''] - Image URL
   * @param {string} [attrs.file=null] - Base64 image data
   * @param {number} [attrs.targetWeight=0] - Target blend weight (0-1)
   * @param {number} [attrs.weight=0] - Actual blend weight (0-1)
   * @param {number} [attrs.x=0] - X position offset
   * @param {number} [attrs.y=0] - Y position offset
   */
  constructor(attrs = {}) {
    super();

    this.id = attrs.id || generateId('image');
    this.url = attrs.url || '';
    this._file = attrs.file || null;
    this._targetWeight = attrs.targetWeight ?? 0;
    this._weight = attrs.weight ?? 0;
    this.x = attrs.x ?? 0;
    this.y = attrs.y ?? 0;

    // Mesh points for this image (normalized coordinates 0-1)
    this.points = attrs.points || [];

    // Reference to Morpher library's Image instance (set by Project)
    this.morpherImage = null;
  }

  /**
   * Get the image file (base64 data)
   * @returns {string|null}
   */
  get file() {
    return this._file;
  }

  /**
   * Set the image file (base64 data)
   * Fires 'change:src' event
   * @param {string|null} value - Base64 image data
   */
  set file(value) {
    if (this._file !== value) {
      this._file = value;

      // Update morpher image if available
      if (this.morpherImage && value) {
        this.morpherImage.setSrc(value);
      }

      this.dispatchEvent(new CustomEvent('change:src', {
        detail: { file: value, image: this }
      }));
    }
  }

  /**
   * Get the target weight
   * @returns {number}
   */
  get targetWeight() {
    return this._targetWeight;
  }

  /**
   * Set the target weight
   * Also updates the actual weight and morpher image
   * Fires 'change:weight' event
   * @param {number} value - Target weight (0-1)
   */
  set targetWeight(value) {
    const newValue = parseFloat(value);
    if (this._targetWeight !== newValue) {
      this._targetWeight = newValue;
      this.weight = newValue;
    }
  }

  /**
   * Get the actual weight
   * @returns {number}
   */
  get weight() {
    return this._weight;
  }

  /**
   * Set the actual weight
   * Updates morpher image and fires event
   * @param {number} value - Actual weight (0-1)
   */
  set weight(value) {
    const newValue = parseFloat(value);
    if (this._weight !== newValue) {
      this._weight = newValue;

      // Update morpher image if available
      if (this.morpherImage) {
        this.morpherImage.setWeight(this._weight);
      }

      this.dispatchEvent(new CustomEvent('change:weight', {
        detail: { weight: this._weight, image: this }
      }));
    }
  }

  /**
   * Set the image URL
   * Fires 'change:url' event
   * @param {string} value - Image URL
   */
  setUrl(value) {
    if (this.url !== value) {
      this.url = value;
      this.dispatchEvent(new CustomEvent('change:url', {
        detail: { url: value, image: this }
      }));
    }
  }

  /**
   * Set the image source from a File object or URL
   * Converts File to base64 data URL
   * @param {File|string} source - File object or URL string
   * @returns {Promise<void>}
   */
  async setSrc(source) {
    if (typeof source === 'string') {
      this.setUrl(source);

      // Load image from URL
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // Convert to base64
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          this.file = canvas.toDataURL();
          resolve();
        };

        img.onerror = reject;
        img.src = source;
      });
    } else if (source instanceof File) {
      // Read file as data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          this.file = e.target.result;
          this.setUrl(source.name);
          resolve();
        };

        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }
  }

  /**
   * Add a point to this image's mesh
   * (Delegates to morpher image)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  addPoint(x, y) {
    if (this.morpherImage) {
      this.morpherImage.addPoint({ x, y });
    }
  }

  /**
   * Split an edge between two points
   * (Delegates to morpher image)
   * @param {Object} p1 - First point
   * @param {Object} p2 - Second point
   */
  splitEdge(p1, p2) {
    if (this.morpherImage) {
      this.morpherImage.splitEdge(p1, p2);
    }
  }

  /**
   * Add a point to this image's mesh
   * @param {number} x - X coordinate (0-1 normalized)
   * @param {number} y - Y coordinate (0-1 normalized)
   * @returns {number} Point index
   */
  addPoint(x, y) {
    const point = { x, y };
    this.points.push(point);

    this.dispatchEvent(new CustomEvent('points:change', {
      detail: { type: 'point:add', point, image: this }
    }));

    return this.points.length - 1;
  }

  /**
   * Update a point's position
   * @param {number} index - Point index
   * @param {number} x - X coordinate (0-1 normalized)
   * @param {number} y - Y coordinate (0-1 normalized)
   */
  updatePoint(index, x, y) {
    if (index >= 0 && index < this.points.length) {
      this.points[index] = { x, y };

      this.dispatchEvent(new CustomEvent('points:change', {
        detail: { type: 'point:update', index, point: { x, y }, image: this }
      }));
    }
  }

  /**
   * Remove a point from this image's mesh
   * @param {number} index - Point index
   */
  removePoint(index) {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);

      this.dispatchEvent(new CustomEvent('points:change', {
        detail: { type: 'point:remove', index, image: this }
      }));
    }
  }

  /**
   * Set all points (used for copying from another image)
   * @param {Array} points - Array of {x, y} points
   */
  setPoints(points) {
    this.points = points.map(p => ({ x: p.x, y: p.y })); // Deep copy

    this.dispatchEvent(new CustomEvent('points:change', {
      detail: { type: 'points:set', points: this.points, image: this }
    }));
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.morpherImage && typeof this.morpherImage.dispose === 'function') {
      this.morpherImage.dispose();
    }
    this.morpherImage = null;
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      url: this.url,
      file: this._file,
      targetWeight: this._targetWeight,
      weight: this._weight,
      x: this.x,
      y: this.y,
      points: this.points,
    };
  }

  /**
   * Create Image from JSON data
   * @param {Object} data - JSON data
   * @returns {Image}
   */
  static fromJSON(data) {
    return new Image(data);
  }
}
