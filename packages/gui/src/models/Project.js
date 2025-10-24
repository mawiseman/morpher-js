/**
 * Project Model
 *
 * Represents a morphing project containing multiple images and mesh data.
 * Manages:
 * - Morpher instance with all images
 * - Image collection
 * - Mesh/triangle data
 * - Custom blend and final touch functions
 * - Auto-saving to localStorage
 * - Weight normalization
 *
 * Events:
 * - change:name - Fired when project name changes
 * - change:color - Fired when project color changes
 * - image:add - Fired when image is added
 * - image:remove - Fired when image is removed
 * - morpher:change - Fired when morpher data changes
 */

import { generateId } from '../utils/id-generator.js';
import { randomPastelColor } from '../utils/colors.js';
import { Image } from './Image.js';
import { createNamespace } from '../utils/storage.js';

const STORAGE_NAMESPACE = 'morpher-gui';

export class Project extends EventTarget {
  /**
   * @param {Object} attrs - Project attributes
   * @param {string} [attrs.id] - Unique identifier
   * @param {string} [attrs.name='New Project'] - Project name
   * @param {string} [attrs.color] - Theme color (auto-generated if not provided)
   * @param {string} [attrs.blend_function=null] - Custom blend function code
   * @param {string} [attrs.final_touch_function=null] - Custom final touch function code
   * @param {Object} [attrs.morpher] - Morpher configuration data
   * @param {Array} [attrs.images] - Array of image data
   */
  constructor(attrs = {}) {
    super();

    this.id = attrs.id || generateId('project');
    this._name = attrs.name || 'New Project';
    this._color = attrs.color || randomPastelColor();
    this.blendFunction = attrs.blend_function || null;
    this.finalTouchFunction = attrs.final_touch_function || null;

    // Images collection
    this.images = [];

    // Mesh triangles (shared across all images)
    this.triangles = attrs.triangles || [];

    // Morpher instance will be created when needed
    // (requires the morpher library to be loaded)
    this.morpher = null;

    // Initialize from morpher data if provided
    if (attrs.morpher) {
      this._initFromMorpherData(attrs.morpher);
    }

    // Initialize images if provided
    if (attrs.images) {
      attrs.images.forEach(imgData => this.addImage(imgData, { skipSave: true }));
    }
  }

  /**
   * Get project name
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Set project name
   * Fires 'change:name' event
   * @param {string} value - New name
   */
  set name(value) {
    if (this._name !== value) {
      this._name = value;
      this.dispatchEvent(new CustomEvent('change:name', {
        detail: { name: value, project: this }
      }));
      this.save();
    }
  }

  /**
   * Get project color
   * @returns {string}
   */
  get color() {
    return this._color;
  }

  /**
   * Set project color
   * Fires 'change:color' event
   * @param {string} value - New color
   */
  set color(value) {
    if (this._color !== value) {
      this._color = value;
      this.dispatchEvent(new CustomEvent('change:color', {
        detail: { color: value, project: this }
      }));
      this.save();
    }
  }

  /**
   * Initialize morpher from saved data
   * @private
   * @param {Object} morpherData - Morpher configuration
   */
  _initFromMorpherData(morpherData) {
    // This will be implemented when morpher library is integrated
    // For now, store the data for later use
    this._morpherData = morpherData;
  }

  /**
   * Initialize the morpher instance
   * Should be called after the morpher library is loaded
   * @param {Class} MorpherClass - The Morpher class from the library
   */
  initMorpher(MorpherClass) {
    if (!this.morpher) {
      this.morpher = new MorpherClass(this._morpherData || {});

      // Listen to morpher changes
      this.morpher.addEventListener('change', () => {
        this.dispatchEvent(new CustomEvent('morpher:change', {
          detail: { morpher: this.morpher, project: this }
        }));
        this.save();
      });
    }
  }

  /**
   * Add an image to the project
   * @param {Image|Object} imageData - Image instance or data
   * @param {Object} options - Options
   * @param {boolean} [options.skipSave=false] - Skip auto-save
   * @returns {Image}
   */
  addImage(imageData, options = {}) {
    const image = imageData instanceof Image
      ? imageData
      : Image.fromJSON(imageData);

    // Copy points from first image if this is a new image without points
    if (this.images.length > 0 && image.points.length === 0) {
      const firstImage = this.images[0];
      if (firstImage.points.length > 0) {
        image.setPoints(firstImage.points);
      }
    }

    this.images.push(image);

    // Add to morpher if available
    if (this.morpher && image.morpherImage) {
      this.morpher.addImage(image.morpherImage);
    }

    // Listen to image changes
    image.addEventListener('change:weight', () => {
      this.handleWeightChange(image);
    });

    // Listen to point changes
    image.addEventListener('points:change', () => {
      if (!options.skipSave) {
        this.save();
      }
    });

    this.dispatchEvent(new CustomEvent('image:add', {
      detail: { image, project: this }
    }));

    if (!options.skipSave) {
      this.save();
    }

    return image;
  }

  /**
   * Remove an image from the project
   * @param {Image} image - Image to remove
   */
  removeImage(image) {
    const index = this.images.indexOf(image);
    if (index !== -1) {
      this.images.splice(index, 1);

      // Remove from morpher if available
      if (this.morpher && image.morpherImage) {
        this.morpher.removeImage(image.morpherImage);
      }

      // Clean up image
      image.dispose();

      this.dispatchEvent(new CustomEvent('image:remove', {
        detail: { image, index, project: this }
      }));

      this.save();
    }
  }

  /**
   * Add a triangle to the mesh
   * @param {number} p1 - First point index
   * @param {number} p2 - Second point index
   * @param {number} p3 - Third point index
   */
  addTriangle(p1, p2, p3) {
    this.triangles.push([p1, p2, p3]);

    this.dispatchEvent(new CustomEvent('mesh:change', {
      detail: { type: 'triangle:add', triangle: [p1, p2, p3], project: this }
    }));

    this.save();

    if (this.morpher) {
      this.morpher.addTriangle(p1, p2, p3);
    }
  }

  /**
   * Update the custom blend function
   * @param {string} code - JavaScript function code
   * @throws {Error} If code is invalid
   */
  updateBlendFunction(code) {
    try {
      // Validate the function
      const fn = new Function('destination', 'source', 'weight', code);

      if (this.morpher) {
        this.morpher.blendFunction = fn;
      }

      this.blendFunction = code;
      this.save();
    } catch (e) {
      throw new Error(`Invalid blend function: ${e.message}`);
    }
  }

  /**
   * Update the custom final touch function
   * @param {string} code - JavaScript function code
   * @throws {Error} If code is invalid
   */
  updateFinalTouchFunction(code) {
    try {
      // Validate the function
      const fn = new Function('canvas', code);

      if (this.morpher) {
        this.morpher.finalTouchFunction = fn;
      }

      this.finalTouchFunction = code;
      this.save();
    } catch (e) {
      throw new Error(`Invalid final touch function: ${e.message}`);
    }
  }

  /**
   * Handle weight changes and auto-normalize
   * When one image's weight changes, adjust others proportionally
   * @param {Image} changedImage - The image whose weight changed
   */
  handleWeightChange(changedImage) {
    if (this.images.length <= 1) return;

    // Calculate total weight of other images
    const otherImages = this.images.filter(img => img !== changedImage);
    const totalOtherWeight = otherImages.reduce((sum, img) => sum + img.targetWeight, 0);

    // Calculate remaining weight to distribute
    const remainingWeight = 1 - changedImage.targetWeight;

    if (remainingWeight <= 0) {
      // If changed image has weight 1, set all others to 0
      otherImages.forEach(img => {
        img.weight = 0;
      });
    } else if (totalOtherWeight > 0) {
      // Proportionally adjust other images
      otherImages.forEach(img => {
        img.weight = (img.targetWeight / totalOtherWeight) * remainingWeight;
      });
    } else {
      // Evenly distribute among other images
      const evenWeight = remainingWeight / otherImages.length;
      otherImages.forEach(img => {
        img.weight = evenWeight;
      });
    }

    this.save();
  }

  /**
   * Serialize project to JSON
   * @param {Object} options - Serialization options
   * @param {boolean} [options.includeImageData=false] - Include base64 image data
   * @returns {Object}
   */
  toJSON(options = {}) {
    const data = {
      id: this.id,
      name: this._name,
      color: this._color,
      blend_function: this.blendFunction,
      final_touch_function: this.finalTouchFunction,
      triangles: this.triangles,
      images: this.images.map(img => {
        const imgData = img.toJSON();
        // Optionally exclude large base64 data
        if (!options.includeImageData) {
          imgData.file = null;
        }
        return imgData;
      }),
    };

    // Add morpher data if available
    if (this.morpher && typeof this.morpher.toJSON === 'function') {
      data.morpher = this.morpher.toJSON();

      // Replace image src with URLs (not base64)
      if (data.morpher.images) {
        data.morpher.images.forEach((img, i) => {
          if (this.images[i]) {
            img.src = this.images[i].url;
          }
        });
      }
    } else if (this._morpherData) {
      data.morpher = this._morpherData;
    }

    return data;
  }

  /**
   * Save project to localStorage
   * @returns {boolean} Success
   */
  save() {
    try {
      // Save with image data to persist uploaded images
      const storage = createNamespace(STORAGE_NAMESPACE);
      const json = this.toJSON({ includeImageData: true });
      storage.setItem(`project_${this.id}`, json);
      return true;
    } catch (e) {
      console.error('Failed to save project:', e);
      // If quota exceeded, try without image data
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, saving without image data');
        try {
          const storage = createNamespace(STORAGE_NAMESPACE);
          const json = this.toJSON({ includeImageData: false });
          storage.setItem(`project_${this.id}`, json);
          return true;
        } catch (e2) {
          console.error('Failed to save even without image data:', e2);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Dispose all images
    this.images.forEach(img => img.dispose());
    this.images = [];

    // Dispose morpher
    if (this.morpher && typeof this.morpher.dispose === 'function') {
      this.morpher.dispose();
    }
    this.morpher = null;

    // Remove from storage
    try {
      const storage = createNamespace(STORAGE_NAMESPACE);
      storage.removeItem(`project_${this.id}`);
    } catch (e) {
      console.error('Failed to remove project from storage:', e);
    }
  }

  /**
   * Create Project from JSON data
   * @param {Object} data - JSON data
   * @returns {Project}
   */
  static fromJSON(data) {
    return new Project(data);
  }
}
