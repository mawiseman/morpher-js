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

import { generateShortId } from '../utils/id-generator.js';

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
   * @param {string} [attrs.sitecoreId=''] - Sitecore ID for external reference
   */
  constructor(attrs = {}) {
    super();

    this.id = attrs.id || `image_${generateShortId()}`;
    this.url = attrs.url || '';
    this._file = attrs.file || null;
    this._targetWeight = attrs.targetWeight ?? 0;
    this._weight = attrs.weight ?? 0;
    this.x = attrs.x ?? 0;
    this.y = attrs.y ?? 0;
    this.sitecoreId = attrs.sitecoreId || '';

    // Store actual image dimensions for coordinate conversion
    this.width = attrs.width || 0;
    this.height = attrs.height || 0;

    // Mesh points for this image (normalized coordinates 0-1)
    // Points now have format: { id: number, x: number, y: number }
    this.points = attrs.points || [];

    // Track next available point ID
    this.nextPointId = attrs.nextPointId || 0;

    // If we have points without IDs, assign them IDs now
    if (this.points.length > 0 && !this.points[0].hasOwnProperty('id')) {
      this.points = this.points.map((p, idx) => ({
        id: idx,
        x: p.x,
        y: p.y
      }));
      this.nextPointId = this.points.length;
    }

    // Midpoint markers for triangle edges
    // Format: { id: number, point1Id: number, point2Id: number, x: number, y: number }
    this.midpoints = attrs.midpoints || [];
    this.nextMidpointId = attrs.nextMidpointId || 0;

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
          // Store image dimensions
          this.width = img.width;
          this.height = img.height;

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

          // Load image to get dimensions
          const img = new window.Image();
          img.onload = () => {
            this.width = img.width;
            this.height = img.height;
            resolve();
          };
          img.onerror = reject;
          img.src = e.target.result;
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
   * @param {number} [id] - Optional point ID (if not provided, will auto-increment)
   * @returns {number} Point ID
   */
  addPoint(x, y, id = null) {
    // Use provided ID or generate new one
    const pointId = id !== null ? id : this.nextPointId++;

    const point = { id: pointId, x, y };
    this.points.push(point);

    // Ensure nextPointId is always larger than any existing ID
    if (id !== null && id >= this.nextPointId) {
      this.nextPointId = id + 1;
    }

    this.dispatchEvent(new CustomEvent('points:change', {
      detail: { type: 'point:add', point, image: this }
    }));

    return pointId;
  }

  /**
   * Update a point's position by ID
   * @param {number} id - Point ID
   * @param {number} x - X coordinate (0-1 normalized)
   * @param {number} y - Y coordinate (0-1 normalized)
   */
  updatePoint(id, x, y) {
    const point = this.points.find(p => p.id === id);
    if (point) {
      point.x = x;
      point.y = y;

      this.dispatchEvent(new CustomEvent('points:change', {
        detail: { type: 'point:update', id, point, image: this }
      }));
    }
  }

  /**
   * Remove a point from this image's mesh by ID
   * @param {number} id - Point ID
   */
  removePoint(id) {
    const index = this.points.findIndex(p => p.id === id);
    if (index !== -1) {
      this.points.splice(index, 1);

      this.dispatchEvent(new CustomEvent('points:change', {
        detail: { type: 'point:remove', id, image: this }
      }));
    }
  }

  /**
   * Set all points (used for copying from another image)
   * @param {Array} points - Array of {id, x, y} points
   */
  setPoints(points) {
    this.points = points.map(p => ({ id: p.id, x: p.x, y: p.y })); // Deep copy

    this.dispatchEvent(new CustomEvent('points:change', {
      detail: { type: 'points:set', points: this.points, image: this }
    }));
  }

  /**
   * Update midpoints based on triangles
   * Generates midpoint markers for each unique edge
   * @param {Array} triangles - Array of [index1, index2, index3] triangles
   */
  updateMidpoints(triangles) {
    if (!triangles || triangles.length === 0 || this.points.length < 3) {
      this.midpoints = [];
      return;
    }

    // Collect all unique edges (as point ID pairs)
    const edgeSet = new Set();
    const edges = [];

    triangles.forEach(triangle => {
      const [idx1, idx2, idx3] = triangle;

      // Get point IDs from indices
      const p1 = this.points[idx1];
      const p2 = this.points[idx2];
      const p3 = this.points[idx3];

      if (!p1 || !p2 || !p3) return;

      // Add three edges (normalize order to avoid duplicates)
      const addEdge = (pointA, pointB) => {
        const id1 = pointA.id;
        const id2 = pointB.id;
        const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            point1Id: id1,
            point2Id: id2,
            point1: pointA,
            point2: pointB
          });
        }
      };

      addEdge(p1, p2);
      addEdge(p2, p3);
      addEdge(p3, p1);
    });

    // Create midpoints for each edge
    this.midpoints = edges.map((edge, index) => {
      const midX = (edge.point1.x + edge.point2.x) / 2;
      const midY = (edge.point1.y + edge.point2.y) / 2;

      return {
        id: index,
        point1Id: edge.point1Id,
        point2Id: edge.point2Id,
        x: midX,
        y: midY
      };
    });

    this.nextMidpointId = this.midpoints.length;
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
    // Convert normalized points (0-1) to absolute pixel coordinates
    const absolutePoints = this.points.map(point => ({
      id: point.id,
      x: Math.round(point.x * this.width),
      y: Math.round(point.y * this.height)
    }));

    // Convert normalized midpoints to absolute coordinates
    const absoluteMidpoints = this.midpoints.map(midpoint => ({
      id: midpoint.id,
      point1Id: midpoint.point1Id,
      point2Id: midpoint.point2Id,
      x: Math.round(midpoint.x * this.width),
      y: Math.round(midpoint.y * this.height)
    }));

    return {
      id: this.id,
      src: this.url,
      file: this._file,
      targetWeight: this._targetWeight,
      weight: this._weight,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      sitecoreId: this.sitecoreId,
      points: absolutePoints,
      nextPointId: this.nextPointId,
      midpoints: absoluteMidpoints,
      nextMidpointId: this.nextMidpointId,
    };
  }

  /**
   * Create Image from JSON data
   * @param {Object} data - JSON data
   * @returns {Image}
   */
  static fromJSON(data) {
    // Support both 'src' (new) and 'url' (legacy) for backward compatibility
    // Prefer 'src' if both are present
    if (data.src) {
      data.url = data.src;
    } else if (data.url) {
      // Legacy 'url' property, use it as the source
      data.url = data.url;
    }

    // If we have width/height and points, convert absolute coordinates to normalized
    if (data.width && data.height && data.points && data.points.length > 0) {
      // Check if points are already normalized (values between 0-1) or absolute (larger values)
      const firstPoint = data.points[0];
      const isAbsolute = firstPoint.x > 1 || firstPoint.y > 1 ||
                        (firstPoint.x === Math.round(firstPoint.x) && firstPoint.y === Math.round(firstPoint.y));

      if (isAbsolute) {
        // Convert absolute to normalized
        data.points = data.points.map(point => ({
          id: point.id,
          x: point.x / data.width,
          y: point.y / data.height
        }));
      }
    }

    // Convert midpoints from absolute to normalized if needed
    if (data.width && data.height && data.midpoints && data.midpoints.length > 0) {
      const firstMidpoint = data.midpoints[0];
      const isAbsolute = firstMidpoint.x > 1 || firstMidpoint.y > 1 ||
                        (firstMidpoint.x === Math.round(firstMidpoint.x) && firstMidpoint.y === Math.round(firstMidpoint.y));

      if (isAbsolute) {
        data.midpoints = data.midpoints.map(midpoint => ({
          id: midpoint.id,
          point1Id: midpoint.point1Id,
          point2Id: midpoint.point2Id,
          x: midpoint.x / data.width,
          y: midpoint.y / data.height
        }));
      }
    }

    return new Image(data);
  }
}
