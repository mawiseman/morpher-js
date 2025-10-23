import { EventDispatcher } from './event-dispatcher.js';
import { Mesh } from './mesh.js';

/**
 * Image
 *
 * Represents an image with an associated mesh for morphing
 * Handles image loading, positioning, and rendering
 *
 * @class Image
 * @extends EventDispatcher
 */
export class Image extends EventDispatcher {
  el = null;
  source = null;
  loaded = false;

  mesh = null;
  weight = 0;
  x = 0;
  y = 0;

  /**
   * Create a new Image
   * @param {Object} [json={}] - Image configuration
   */
  constructor(json = {}) {
    super();

    this.setImage(new window.Image());
    this.source = document.createElement('canvas');

    this.mesh = new Mesh();
    this.mesh.on('all', this.propagateMeshEvent.bind(this));
    this.mesh.on('change:bounds', this.refreshSource.bind(this));

    this.triangles = this.mesh.triangles;
    this.points = this.mesh.points;

    this.fromJSON(json);
  }

  /**
   * Remove this image
   */
  remove() {
    this.mesh.remove();
    this.trigger('remove', this);
  }

  // Setters & Getters

  /**
   * Set the image element
   * @param {HTMLImageElement|HTMLCanvasElement} imgEl - Image or canvas element
   */
  setImage(imgEl) {
    this.el = imgEl;

    switch (this.el.tagName) {
      case 'IMG':
        this.loaded = this.el.complete && this.el.naturalWidth !== 0;
        this.el.onload = this.loadHandler.bind(this);
        this.refreshSource();
        break;

      case 'CANVAS':
        this.loadHandler();
        break;
    }
  }

  /**
   * Set image source URL
   * @param {string} src - Image URL
   */
  setSrc(src) {
    this.loaded = false;
    this.el.src = src;
  }

  /**
   * Set image weight for morphing
   * @param {number} w - Weight value
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  setWeight(w, params = {}) {
    this.weight = w * 1;
    if (!params.silent) {
      this.trigger('change:weight change');
    }
  }

  /**
   * Get image weight
   * @returns {number} Current weight
   */
  getWeight() {
    return this.weight;
  }

  /**
   * Set X position
   * @param {number} x - X coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  setX(x, params = {}) {
    this.x = Math.round(x * 1);
    this.mesh.x = this.x;
    if (!params.silent) {
      this.trigger('change:x change');
    }
  }

  /**
   * Get X position
   * @returns {number} X coordinate
   */
  getX() {
    return this.x;
  }

  /**
   * Set Y position
   * @param {number} y - Y coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  setY(y, params = {}) {
    this.y = Math.round(y * 1);
    this.mesh.y = this.y;
    if (!params.silent) {
      this.trigger('change:y change');
    }
  }

  /**
   * Get Y position
   * @returns {number} Y coordinate
   */
  getY() {
    return this.y;
  }

  /**
   * Move to position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  moveTo(x, y, params = {}) {
    this.setX(x, { silent: true });
    this.setY(y, { silent: true });
    if (!params.silent) {
      this.trigger('change:x change:y change');
    }
  }

  // Image

  /**
   * Handle image load event
   */
  loadHandler() {
    this.loaded = true;
    this.refreshSource();
    this.trigger('load', this, this.el);
  }

  // Mesh Proxy

  /**
   * Set maximum mesh size
   */
  setMaxSize(...args) {
    this.mesh.setMaxSize(...args);
  }

  /**
   * Add point to mesh
   */
  addPoint(...args) {
    this.mesh.addPoint(...args);
  }

  /**
   * Remove point from mesh
   */
  removePoint(...args) {
    this.mesh.removePoint(...args);
  }

  /**
   * Make mesh compatible with another
   */
  makeCompatibleWith(...args) {
    this.mesh.makeCompatibleWith(...args);
  }

  /**
   * Get relative position of point
   */
  getRelativePositionOf(...args) {
    return this.mesh.getRelativePositionOf(...args);
  }

  /**
   * Split edge in mesh
   */
  splitEdge(...args) {
    this.mesh.splitEdge(...args);
  }

  /**
   * Add triangle to mesh
   */
  addTriangle(...args) {
    this.mesh.addTriangle(...args);
  }

  /**
   * Remove triangle from mesh
   */
  removeTriangle(...args) {
    this.mesh.removeTriangle(...args);
  }

  /**
   * Refresh mesh bounds
   */
  refreshBounds() {
    this.mesh.refreshBounds();
  }

  /**
   * Propagate mesh events
   * @param {string} type - Event type
   * @param {*} target - Event target
   * @param {...*} args - Additional arguments
   */
  propagateMeshEvent(type, target, ...args) {
    this.trigger(type, this, ...args);
  }

  // Drawing

  /**
   * Draw image with morphing
   * @param {CanvasRenderingContext2D} ctx - Destination context
   * @param {Mesh} mesh - Target mesh for morphing
   */
  draw(ctx, mesh) {
    for (let i = 0; i < this.triangles.length; i++) {
      const triangle = this.triangles[i];
      triangle.draw(this.source, ctx, mesh.triangles[i]);
    }
  }

  /**
   * Refresh source canvas
   */
  refreshSource() {
    if (!this.loaded) return;

    this.source.width = this.mesh.bounds.left + this.mesh.bounds.width;
    this.source.height = this.mesh.bounds.top + this.mesh.bounds.height;

    const ctx = this.source.getContext('2d');
    ctx.drawImage(this.el, 0, 0);
  }

  // JSON

  /**
   * Convert image to JSON
   * @returns {Object} Image data
   */
  toJSON() {
    const json = this.mesh.toJSON();
    json.src = this.el.src;
    json.x = this.x;
    json.y = this.y;
    return json;
  }

  /**
   * Load image from JSON
   * @param {Object} [json={}] - Image data
   * @param {Object} [params={}] - Optional parameters
   */
  fromJSON(json = {}, params = {}) {
    if (json.x !== undefined) {
      this.setX(json.x, params);
    }
    if (json.y !== undefined) {
      this.setY(json.y, params);
    }

    this.mesh.fromJSON(json, params);

    if (json.src) {
      this.setSrc(json.src);
    }
  }
}
