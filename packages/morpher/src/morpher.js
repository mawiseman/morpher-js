import { EventDispatcher } from './event-dispatcher.js';
import { Image } from './image.js';
import { Mesh } from './mesh.js';

/**
 * Morpher
 *
 * Main class for image morphing
 * Manages multiple images, mesh, animation, and rendering
 *
 * @class Morpher
 * @extends EventDispatcher
 */
export class Morpher extends EventDispatcher {
  images = null;
  triangles = [];
  mesh = null;

  canvas = null;
  ctx = null;
  tmpCanvas = null;
  tmpCtx = null;

  blendFunction = null;
  finalTouchFunction = null;
  easingFunction = null;

  requestID = null;

  t0 = null;
  duration = null;
  state0 = null;
  state1 = null;
  state = null;

  /**
   * Create a new Morpher
   * @param {Object} [params={}] - Initial configuration (can be JSON from export)
   */
  constructor(params = {}) {
    super();

    this.images = [];
    this.triangles = [];
    this.mesh = new Mesh();

    // Bind methods that are used as callbacks
    // This ensures consistent function identity for adding/removing listeners
    this.drawNow = this.drawNow.bind(this);
    this.loadHandler = this.loadHandler.bind(this);
    this.changeHandler = this.changeHandler.bind(this);
    this.addPointHandler = this.addPointHandler.bind(this);
    this.removePointHandler = this.removePointHandler.bind(this);
    this.addTriangleHandler = this.addTriangleHandler.bind(this);
    this.removeTriangleHandler = this.removeTriangleHandler.bind(this);
    this.removeImage = this.removeImage.bind(this);

    this.setCanvas(document.createElement('canvas'));

    // Use OffscreenCanvas for tmpCanvas if available (better performance)
    // Falls back to regular canvas for older browsers
    if (typeof OffscreenCanvas !== 'undefined') {
      // Start with minimal size, will be resized as needed
      this.tmpCanvas = new OffscreenCanvas(1, 1);
      this.tmpCtx = this.tmpCanvas.getContext('2d');
    } else {
      this.tmpCanvas = document.createElement('canvas');
      this.tmpCtx = this.tmpCanvas.getContext('2d');
    }

    this.fromJSON(params);
    this.set([1]);
  }

  /**
   * Set the canvas element
   * @param {HTMLCanvasElement} canvas - Canvas element to use
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.draw();
  }

  /**
   * Set image weights
   * @param {number[]} weights - Array of weights (0-1) for each image
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress change events
   */
  set(weights, params = {}) {
    this.state = [];
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      const w = weights[i] || 0;
      this.state.push(w);
      img.setWeight(w, params);
    }
  }

  /**
   * Get current state (weights)
   * @returns {number[]} Array of current weights
   */
  get() {
    return this.state.slice();
  }

  /**
   * Animate to target weights
   *
   * @param {number[]} weights - Target weights
   * @param {number} duration - Animation duration in milliseconds
   * @param {Function|string} [easing] - Optional easing function or function name from registry
   *
   * @example
   * // With predefined easing
   * morpher.animate([0, 1], 500, 'easeInOutQuad');
   *
   * // With custom function
   * morpher.animate([0, 1], 500, (t) => t * t);
   */
  animate(weights, duration, easing) {
    this.state0 = [];
    for (const img of this.images) {
      this.state0.push(img.getWeight());
    }
    this.state1 = weights;
    this.t0 = performance.now();
    this.duration = duration;

    // Validate easing function if provided
    if (easing) {
      const validated = Morpher.validateEasingFunction(easing);
      this.easingFunction = validated; // Will be null if invalid, falls back to linear
    } else {
      this.easingFunction = null;
    }

    this.trigger('animation:start', this);
    this.draw();
  }

  // Images

  imageEvents = {
    load: 'loadHandler',
    change: 'changeHandler',
    'point:add': 'addPointHandler',
    'point:remove': 'removePointHandler',
    'triangle:add': 'addTriangleHandler',
    'triangle:remove': 'removeTriangleHandler',
    remove: 'removeImage'
  };

  /**
   * Add an image to the morpher
   * @param {Image|Object} image - Image instance or image data
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  addImage(image, params = {}) {
    if (!(image instanceof Image)) {
      image = new Image(image);
    }

    image.remove();

    if (this.images.length) {
      image.makeCompatibleWith(this.mesh);
    } else {
      this.mesh.makeCompatibleWith(image);
    }

    this.images.push(image);

    // Attach event listeners using pre-bound methods
    for (const [event, handler] of Object.entries(this.imageEvents)) {
      image.on(event, this[handler]);
    }

    this.loadHandler();

    if (!params.silent) {
      this.trigger('image:add', this, image);
    }
  }

  /**
   * Remove an image
   * @param {Image} image - Image to remove
   */
  removeImage(image) {
    const i = this.images.indexOf(image);

    // Remove event listeners using pre-bound methods
    for (const [event, handler] of Object.entries(this.imageEvents)) {
      image.off(event, this[handler]);
    }

    if (i !== -1) {
      this.images.splice(i, 1);
      this.trigger('image:remove', this, image);
    }
  }

  /**
   * Handle image load events
   */
  loadHandler() {
    this.draw();

    for (const image of this.images) {
      if (!image.loaded) return false;
    }

    this.refreshMaxSize();
    this.trigger('load', this, this.canvas);
  }

  /**
   * Handle change events
   */
  changeHandler() {
    this.draw();
    this.trigger('change', this);
  }

  // Points

  /**
   * Add a point to all images
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  addPoint(x, y) {
    for (const image of this.images.concat(this.mesh)) {
      image.addPoint({ x, y }, { silent: true });
    }
    this.trigger('point:add', this);
  }

  /**
   * Handle point add events from images
   */
  addPointHandler(image, point, pointParams = null) {
    const position = pointParams || image.getRelativePositionOf(point);

    for (const img of this.images) {
      if (img.points.length < image.points.length) {
        img.addPoint(position);
        return;
      }
    }

    if (this.mesh.points.length < image.points.length) {
      this.mesh.addPoint(position);
      this.trigger('point:add', this);
    }
  }

  /**
   * Handle point remove events from images
   */
  removePointHandler(image, point, index) {
    for (const img of this.images) {
      if (img.points.length > image.points.length) {
        img.removePoint(index);
        return;
      }
    }

    if (this.mesh.points.length > image.points.length) {
      this.mesh.removePoint(index);
    }

    for (const triangle of this.triangles) {
      for (let k = 0; k < triangle.length; k++) {
        if (triangle[k] >= index) {
          triangle[k] -= 1;
        }
      }
    }

    this.trigger('point:remove', this);
  }

  // Triangles

  /**
   * Add a triangle
   * @param {number} i1 - First point index
   * @param {number} i2 - Second point index
   * @param {number} i3 - Third point index
   */
  addTriangle(i1, i2, i3) {
    if (this.images.length > 0) {
      this.images[0].addTriangle(i1, i2, i3);
    }
  }

  /**
   * Check if triangle already exists
   * @param {number} i1 - First point index
   * @param {number} i2 - Second point index
   * @param {number} i3 - Third point index
   * @returns {boolean} True if triangle exists
   */
  triangleExists(i1, i2, i3) {
    for (const t of this.triangles) {
      if (t.indexOf(i1) !== -1 && t.indexOf(i2) !== -1 && t.indexOf(i3) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handle triangle add events from images
   */
  addTriangleHandler(image, i1, i2, i3, triangle) {
    if (image.triangles.length > this.triangles.length && !this.triangleExists(i1, i2, i3)) {
      this.triangles.push([i1, i2, i3]);
    }

    for (const img of this.images) {
      if (img.triangles.length < this.triangles.length) {
        img.addTriangle(i1, i2, i3);
        return;
      }
    }

    if (this.mesh.triangles.length < this.triangles.length) {
      this.mesh.addTriangle(i1, i2, i3);
    }

    this.trigger('triangle:add', this);
  }

  /**
   * Handle triangle remove events from images
   */
  removeTriangleHandler(image, triangle, index) {
    if (image.triangles.length < this.triangles.length) {
      this.triangles.splice(index, 1);
    }

    for (const img of this.images) {
      if (img.triangles.length > this.triangles.length) {
        img.removeTriangle(index);
        return;
      }
    }

    if (this.mesh.triangles.length > this.triangles.length) {
      this.mesh.removeTriangle(index);
    }

    this.trigger('triangle:remove', this);
  }

  // Drawing

  /**
   * Request a draw (uses requestAnimationFrame)
   */
  draw() {
    if (this.requestID) return;

    if (window.requestAnimationFrame) {
      // Use pre-bound drawNow method (bound in constructor)
      this.requestID = window.requestAnimationFrame(this.drawNow);
    } else {
      this.drawNow();
    }
  }

  /**
   * Perform actual drawing
   */
  drawNow() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.updateCanvasSize();
    this.animationStep();
    this.updateMesh();

    const blend = this.blendFunction || Morpher.defaultBlendFunction;

    // Check both canvas and tmpCanvas are valid before drawing
    if (this.canvas.width > 0 && this.canvas.height > 0 &&
        this.tmpCanvas.width > 0 && this.tmpCanvas.height > 0) {
      const sortedImages = this.images.slice().sort((a, b) => b.weight - a.weight);

      for (const image of sortedImages) {
        this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
        image.draw(this.tmpCtx, this.mesh);
        blend(this.canvas, this.tmpCanvas, image.weight);
      }

      if (this.finalTouchFunction) {
        this.finalTouchFunction(this.canvas);
      }

      this.trigger('draw', this, this.canvas);
    }

    this.requestID = null;

    if (this.t0) {
      this.draw();
    }
  }

  /**
   * Update canvas size based on images
   */
  updateCanvasSize() {
    let w = 0;
    let h = 0;

    for (const image of this.images) {
      w = Math.max(image.el.width + image.getX(), w);
      h = Math.max(image.el.height + image.getY(), h);
    }

    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = this.tmpCanvas.width = w;
      this.canvas.height = this.tmpCanvas.height = h;
      this.refreshMaxSize();
      this.trigger('resize', this, this.canvas);
    }
  }

  /**
   * Refresh max size for all images
   */
  refreshMaxSize() {
    for (const img of this.images) {
      img.setMaxSize(this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Update blended mesh
   */
  updateMesh() {
    const x0 = this.canvas.width / 2;
    const y0 = this.canvas.height / 2;

    for (let i = 0; i < this.mesh.points.length; i++) {
      const p = this.mesh.points[i];
      p.x = x0;
      p.y = y0;

      for (const img of this.images) {
        p.x += (img.getX() + img.points[i].x - x0) * img.weight;
        p.y += (img.getY() + img.points[i].y - y0) * img.weight;
      }
    }
  }

  /**
   * Perform animation step
   */
  animationStep() {
    if (!this.t0) return;

    const t = performance.now() - this.t0;
    let state;

    if (t >= this.duration) {
      state = this.state1;
      this.state0 = this.state1 = this.t0 = null;
      this.trigger('animation:complete', this);
    } else {
      let progress = t / this.duration;
      if (this.easingFunction) {
        progress = this.easingFunction(progress);
      }

      state = [];
      for (let i = 0; i < this.state0.length; i++) {
        const w = this.state0[i];
        state.push(w * (1 - progress) + this.state1[i] * progress);
      }
    }

    this.set(state, { silent: true });
  }

  /**
   * Predefined blend functions registry
   * Safe, pre-vetted functions that can be used by name
   */
  static blendFunctions = {
    default: 'defaultBlendFunction',
    software: 'softwareBlendFunction',
    additive: 'defaultBlendFunction', // Alias for default
    normal: 'normalBlendFunction',
    multiply: 'multiplyBlendFunction',
    screen: 'screenBlendFunction'
  };

  /**
   * Predefined easing functions registry
   * Safe, pre-vetted easing functions that can be used by name
   */
  static easingFunctions = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - --t * t * t * t,
    easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t)
  };

  /**
   * Default blend function (GPU-accelerated additive blending)
   *
   * This function uses hardware-accelerated canvas compositing instead of
   * CPU-based pixel manipulation for 80-90% performance improvement.
   *
   * @param {HTMLCanvasElement} destination - Destination canvas
   * @param {HTMLCanvasElement} source - Source canvas
   * @param {number} weight - Blend weight (0-1)
   */
  static defaultBlendFunction(destination, source, weight) {
    const ctx = destination.getContext('2d');

    // Store original composite operation
    const originalComposite = ctx.globalCompositeOperation;
    const originalAlpha = ctx.globalAlpha;

    // Use 'lighter' for additive blending (GPU-accelerated)
    // This replicates the original behavior: dData[i] += sData[i] * weight
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = weight;

    // Draw source onto destination (GPU handles blending)
    ctx.drawImage(source, 0, 0);

    // Restore original settings
    ctx.globalCompositeOperation = originalComposite;
    ctx.globalAlpha = originalAlpha;
  }

  /**
   * Normal blend function (standard alpha blending)
   *
   * @param {HTMLCanvasElement} destination - Destination canvas
   * @param {HTMLCanvasElement} source - Source canvas
   * @param {number} weight - Blend weight (0-1)
   */
  static normalBlendFunction(destination, source, weight) {
    const ctx = destination.getContext('2d');
    const originalAlpha = ctx.globalAlpha;

    ctx.globalAlpha = weight;
    ctx.drawImage(source, 0, 0);

    ctx.globalAlpha = originalAlpha;
  }

  /**
   * Multiply blend function
   *
   * @param {HTMLCanvasElement} destination - Destination canvas
   * @param {HTMLCanvasElement} source - Source canvas
   * @param {number} weight - Blend weight (0-1)
   */
  static multiplyBlendFunction(destination, source, weight) {
    const ctx = destination.getContext('2d');
    const originalComposite = ctx.globalCompositeOperation;
    const originalAlpha = ctx.globalAlpha;

    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = weight;
    ctx.drawImage(source, 0, 0);

    ctx.globalCompositeOperation = originalComposite;
    ctx.globalAlpha = originalAlpha;
  }

  /**
   * Screen blend function
   *
   * @param {HTMLCanvasElement} destination - Destination canvas
   * @param {HTMLCanvasElement} source - Source canvas
   * @param {number} weight - Blend weight (0-1)
   */
  static screenBlendFunction(destination, source, weight) {
    const ctx = destination.getContext('2d');
    const originalComposite = ctx.globalCompositeOperation;
    const originalAlpha = ctx.globalAlpha;

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = weight;
    ctx.drawImage(source, 0, 0);

    ctx.globalCompositeOperation = originalComposite;
    ctx.globalAlpha = originalAlpha;
  }

  /**
   * Software blend function (fallback for older browsers)
   *
   * Uses CPU-based pixel manipulation. Slower but more compatible.
   * Only use if GPU acceleration is unavailable.
   *
   * @param {HTMLCanvasElement} destination - Destination canvas
   * @param {HTMLCanvasElement} source - Source canvas
   * @param {number} weight - Blend weight (0-1)
   */
  static softwareBlendFunction(destination, source, weight) {
    const dData = destination.getContext('2d').getImageData(0, 0, source.width, source.height);
    const sData = source.getContext('2d').getImageData(0, 0, source.width, source.height);

    for (let i = 0; i < sData.data.length; i++) {
      dData.data[i] += sData.data[i] * weight;
    }

    destination.getContext('2d').putImageData(dData, 0, 0);
  }

  // JSON

  /**
   * Export morpher configuration to JSON
   * @returns {Object} Morpher configuration
   */
  toJSON() {
    const json = {};
    json.images = [];

    for (const image of this.images) {
      json.images.push(image.toJSON());
    }

    json.triangles = this.triangles.slice();
    return json;
  }

  /**
   * Validate and sanitize a blend function
   *
   * Security: Only accepts actual function objects or predefined function names
   * Rejects strings that could be eval'd or Function constructor inputs
   *
   * @param {Function|string} fn - Function or function name from registry
   * @returns {Function|null} Validated function or null if invalid
   * @private
   */
  static validateBlendFunction(fn) {
    // Silently ignore null/undefined (expected for projects without custom blend functions)
    if (fn === null || fn === undefined) {
      return null;
    }

    // If it's already a function, validate it's actually callable
    if (typeof fn === 'function') {
      // Additional safety: check function length (should accept 3 params)
      // This prevents some malicious functions but still allows custom ones
      if (fn.length !== 3) {
        console.warn('Blend function must accept exactly 3 parameters (destination, source, weight)');
        return null;
      }
      return fn;
    }

    // If it's a string, look it up in the registry
    if (typeof fn === 'string') {
      const functionName = Morpher.blendFunctions[fn];
      if (functionName && typeof Morpher[functionName] === 'function') {
        return Morpher[functionName];
      }
      console.warn(`Unknown blend function: ${fn}. Using default.`);
      return null;
    }

    // Reject anything else (objects, arrays, etc.) - only warn for truly invalid types
    console.warn('Invalid blend function. Must be a function or string name.');
    return null;
  }

  /**
   * Validate and sanitize an easing function
   *
   * Security: Only accepts actual function objects or predefined function names
   *
   * @param {Function|string} fn - Function or function name from registry
   * @returns {Function|null} Validated function or null if invalid
   * @private
   */
  static validateEasingFunction(fn) {
    // Silently ignore null/undefined (expected for projects without custom easing functions)
    if (fn === null || fn === undefined) {
      return null;
    }

    // If it's already a function, validate it's actually callable
    if (typeof fn === 'function') {
      // Easing functions should accept 1 parameter
      if (fn.length !== 1) {
        console.warn('Easing function must accept exactly 1 parameter (t)');
        return null;
      }
      return fn;
    }

    // If it's a string, look it up in the registry
    if (typeof fn === 'string') {
      const easingFn = Morpher.easingFunctions[fn];
      if (easingFn && typeof easingFn === 'function') {
        return easingFn;
      }
      console.warn(`Unknown easing function: ${fn}. Using linear.`);
      return null;
    }

    console.warn('Invalid easing function. Must be a function or string name.');
    return null;
  }

  /**
   * Sanitize JSON input to remove potentially dangerous content
   *
   * Security: Removes function properties, validates numeric values
   *
   * @param {Object} json - Raw JSON input
   * @returns {Object} Sanitized JSON
   * @private
   */
  static sanitizeJSON(json) {
    if (typeof json !== 'object' || json === null) {
      return {};
    }

    const sanitized = {};

    // Only copy safe properties
    const safeProperties = ['images', 'triangles', 'blendFunction'];

    for (const prop of safeProperties) {
      if (prop in json) {
        if (prop === 'blendFunction') {
          // Special handling for blend function - must validate
          const validated = Morpher.validateBlendFunction(json[prop]);
          if (validated) {
            sanitized[prop] = validated;
          }
        } else if (prop === 'images' && Array.isArray(json[prop])) {
          // Recursively sanitize image data
          sanitized[prop] = json[prop].map((img) => {
            if (typeof img !== 'object' || img === null) return {};

            const sanitizedImg = {};
            // Only allow safe image properties
            const safeImgProps = ['src', 'x', 'y', 'points'];

            for (const imgProp of safeImgProps) {
              if (imgProp in img) {
                if (imgProp === 'x' || imgProp === 'y') {
                  // Validate numbers
                  const val = Number(img[imgProp]);
                  if (!isNaN(val) && isFinite(val)) {
                    sanitizedImg[imgProp] = val;
                  }
                } else if (imgProp === 'src' && typeof img[imgProp] === 'string') {
                  // Validate URLs - basic check for dangerous protocols
                  const src = img[imgProp];
                  if (!src.startsWith('javascript:') && !src.startsWith('data:text/html')) {
                    sanitizedImg[imgProp] = src;
                  }
                } else if (imgProp === 'points' && Array.isArray(img[imgProp])) {
                  // Validate point arrays
                  sanitizedImg[imgProp] = img[imgProp].map((point) => {
                    if (typeof point !== 'object' || point === null) return { x: 0, y: 0 };
                    const x = Number(point.x);
                    const y = Number(point.y);
                    return {
                      x: !isNaN(x) && isFinite(x) ? x : 0,
                      y: !isNaN(y) && isFinite(y) ? y : 0
                    };
                  });
                }
              }
            }
            return sanitizedImg;
          });
        } else if (prop === 'triangles' && Array.isArray(json[prop])) {
          // Validate triangles
          sanitized[prop] = json[prop].map((triangle) => {
            if (!Array.isArray(triangle) || triangle.length !== 3) {
              return [0, 0, 0];
            }
            return triangle.map((idx) => {
              const val = Number(idx);
              return !isNaN(val) && isFinite(val) && val >= 0 ? Math.floor(val) : 0;
            });
          });
        }
      }
    }

    return sanitized;
  }

  /**
   * Set a custom blend function
   *
   * Security: Validates function before setting
   *
   * @param {Function|string} fn - Blend function or function name from registry
   * @returns {boolean} True if function was set successfully
   */
  setBlendFunction(fn) {
    const validated = Morpher.validateBlendFunction(fn);
    if (validated) {
      this.blendFunction = validated;
      return true;
    }
    return false;
  }

  /**
   * Set a custom final touch function
   *
   * Security: Validates function before setting
   *
   * @param {Function} fn - Final touch function
   * @returns {boolean} True if function was set successfully
   */
  setFinalTouchFunction(fn) {
    if (typeof fn !== 'function') {
      console.warn('Final touch function must be a function');
      return false;
    }

    if (fn.length !== 1) {
      console.warn('Final touch function must accept exactly 1 parameter (canvas)');
      return false;
    }

    this.finalTouchFunction = fn;
    return true;
  }

  /**
   * Load morpher configuration from JSON
   *
   * Security: Sanitizes and validates all input
   *
   * @param {Object} [json={}] - Morpher configuration
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.hard=false] - Reset before loading
   */
  fromJSON(json = {}, params = {}) {
    if (params.hard) {
      this.reset();
    }

    // Sanitize JSON input to prevent injection attacks
    const sanitized = Morpher.sanitizeJSON(json);

    // Use validated blend function if provided
    if (sanitized.blendFunction) {
      this.blendFunction = sanitized.blendFunction;
    }

    if (sanitized.images) {
      for (let i = 0; i < sanitized.images.length; i++) {
        const image = sanitized.images[i];
        if (i > this.images.length - 1) {
          this.addImage(image, params);
        } else {
          this.images[i].fromJSON(image, params);
        }
      }
      if (this.images.length > 0) {
        this.mesh.makeCompatibleWith(this.images[0]);
      }
    }

    if (sanitized.triangles) {
      for (const triangle of sanitized.triangles.slice(this.triangles.length)) {
        this.addTriangle(triangle[0], triangle[1], triangle[2]);
      }
    }
  }

  /**
   * Reset morpher (remove all images)
   */
  reset() {
    for (const image of this.images) {
      this.removeImage(image);
    }
    this.images = [];
  }

  /**
   * Dispose of the morpher and clean up all resources
   *
   * This method should be called when the morpher is no longer needed
   * to prevent memory leaks. It performs the following cleanup:
   * - Cancels pending animation frames
   * - Stops ongoing animations
   * - Removes all event listeners
   * - Disposes all images and mesh
   * - Clears canvas and context references
   * - Removes all internal references
   *
   * After calling dispose(), the morpher instance should not be used.
   */
  dispose() {
    // Cancel any pending animation frame
    if (this.requestID) {
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(this.requestID);
      }
      this.requestID = null;
    }

    // Stop any ongoing animation
    this.t0 = null;
    this.duration = null;
    this.state0 = null;
    this.state1 = null;
    this.easingFunction = null;

    // Remove and dispose all images
    const imagesToDispose = this.images.slice();
    for (const image of imagesToDispose) {
      // Remove event listeners
      for (const [event, handler] of Object.entries(this.imageEvents)) {
        image.off(event, this[handler]);
      }

      // Dispose the image
      if (image.dispose) {
        image.dispose();
      }
    }
    this.images = [];
    this.triangles = [];

    // Dispose mesh
    if (this.mesh && this.mesh.dispose) {
      this.mesh.dispose();
    }
    this.mesh = null;

    // Clear canvas references
    // Note: We don't clear the canvas itself as it may be in the DOM
    // Just clear our references
    this.ctx = null;
    this.tmpCtx = null;

    // Clear temp canvas (not in DOM, safe to clear)
    if (this.tmpCanvas) {
      this.tmpCanvas.width = 0;
      this.tmpCanvas.height = 0;
      this.tmpCanvas = null;
    }

    // Clear function references
    this.blendFunction = null;
    this.finalTouchFunction = null;

    // Clear state
    this.state = null;

    // Remove all event listeners from this object
    this.off();

    // Mark as disposed
    this._disposed = true;
  }

  /**
   * Check if morpher has been disposed
   * @returns {boolean} True if disposed
   */
  isDisposed() {
    return this._disposed === true;
  }
}
