import { Morpher } from 'morpher-js';
import { LocalStorageManager, generateRandomColor, generateId } from '../utils/storage.js';
import { ImageModel } from './Image.js';

/**
 * Project Model - represents a morphing project
 */
export class ProjectModel extends EventTarget {
  constructor(data = {}) {
    super();

    this.id = data.id || generateId();
    this.name = data.name || 'New Project';
    this.color = data.color || generateRandomColor();
    this.morpher = new Morpher();
    this.images = [];
    this.blendFunction = data.blend_function || null;
    this.finalTouchFunction = data.final_touch_function || null;

    // Initialize storage
    this.storage = new LocalStorageManager('Projects');
    this.imagesStorage = new LocalStorageManager(`Images${this.id}`);

    // Bind morpher events
    this.morpher.addEventListener('change', () => this.onMorpherChange());
    this.morpher.addEventListener('image:add', () => this.onMorpherChange());
    this.morpher.addEventListener('image:remove', () => this.onMorpherChange());

    // Update custom functions if provided
    if (this.blendFunction) {
      this.updateBlendFunction();
    }
    if (this.finalTouchFunction) {
      this.updateFinalTouchFunction();
    }

    // Load morpher state if exists
    if (data.morpher) {
      this.morpher.fromJSON(data.morpher, { hard: false, silent: true });
    }
  }

  /**
   * Save project to localStorage
   */
  save() {
    const data = this.toJSON();
    this.storage.set(this.id, data);
    this.dispatchEvent(new CustomEvent('save', { detail: data }));
    return this;
  }

  /**
   * Delete project from localStorage
   */
  destroy() {
    // Delete all images first
    this.images.forEach(image => image.destroy());
    this.images = [];

    // Delete project
    this.storage.remove(this.id);
    this.imagesStorage.clear();

    // Cleanup morpher
    if (this.morpher.dispose) {
      this.morpher.dispose();
    }

    this.dispatchEvent(new CustomEvent('destroy'));
  }

  /**
   * Convert project to JSON
   */
  toJSON() {
    const morpherJSON = this.morpher.toJSON();
    // Remove src from images (stored separately)
    morpherJSON.images?.forEach(img => {
      img.src = null;
    });

    return {
      id: this.id,
      name: this.name,
      color: this.color,
      blend_function: this.blendFunction,
      final_touch_function: this.finalTouchFunction,
      morpher: morpherJSON
    };
  }

  /**
   * Get export code (with image URLs)
   */
  getExportCode() {
    const json = this.morpher.toJSON();
    // Add image URLs
    json.images?.forEach((img, i) => {
      if (this.images[i]) {
        img.src = this.images[i].url;
      }
    });
    return JSON.stringify(json, null, 2);
  }

  /**
   * Add image to project
   */
  addImage(imageData = {}) {
    const image = new ImageModel(imageData, this.imagesStorage);
    this.images.push(image);
    this.morpher.addImage(image.morpherImage);

    // Listen to image changes
    image.addEventListener('change', () => this.onImageChange());

    // Listen to load to add default mesh points
    image.addEventListener('load', () => {
      console.log('Image loaded in project, setting up default mesh');
      // Add some default corner points if the mesh is empty
      if (image.morpherImage.points.length === 0) {
        const w = image.morpherImage.el.width || image.morpherImage.el.naturalWidth;
        const h = image.morpherImage.el.height || image.morpherImage.el.naturalHeight;

        if (w && h) {
          console.log('Adding default corner points for', w, 'x', h, 'image');
          // Add 4 corner points
          image.morpherImage.addPoint({ x: 0, y: 0 });
          image.morpherImage.addPoint({ x: w, y: 0 });
          image.morpherImage.addPoint({ x: 0, y: h });
          image.morpherImage.addPoint({ x: w, y: h });
        }
      }
    });

    this.dispatchEvent(new CustomEvent('image:add', { detail: image }));
    return image;
  }

  /**
   * Remove image from project
   */
  removeImage(image) {
    const index = this.images.indexOf(image);
    if (index > -1) {
      this.images.splice(index, 1);
      this.morpher.removeImage(image.morpherImage);
      image.destroy();
      this.dispatchEvent(new CustomEvent('image:remove', { detail: { image, index } }));
    }
  }

  /**
   * Load images from storage
   */
  loadImages() {
    const imageData = this.imagesStorage.getAll();
    imageData.forEach(({ value }) => {
      this.addImage(value);
    });
  }

  /**
   * Add triangle to mesh
   */
  addTriangle(p1, p2, p3) {
    this.morpher.addTriangle(p1, p2, p3);
  }

  /**
   * Update blend function
   */
  updateBlendFunction() {
    if (this.blendFunction) {
      try {
        // Using Function constructor instead of eval (safer)
        const fn = new Function('destination', 'source', 'weight', this.blendFunction);
        this.morpher.blendFunction = fn;
        this.morpher.draw();
      } catch (e) {
        console.error('Invalid blend function:', e);
      }
    } else {
      this.morpher.blendFunction = null;
      this.morpher.draw();
    }
  }

  /**
   * Update final touch function
   */
  updateFinalTouchFunction() {
    if (this.finalTouchFunction) {
      try {
        // Using Function constructor instead of eval (safer)
        const fn = new Function('canvas', this.finalTouchFunction);
        this.morpher.finalTouchFunction = fn;
        this.morpher.draw();
      } catch (e) {
        console.error('Invalid final touch function:', e);
      }
    } else {
      this.morpher.finalTouchFunction = null;
      this.morpher.draw();
    }
  }

  /**
   * Handle morpher changes
   */
  onMorpherChange() {
    this.save();
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Handle image changes
   */
  onImageChange() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Handle weight changes
   */
  updateWeights(changedImage) {
    let totalW = 0;
    for (const img of this.images) {
      if (img !== changedImage) {
        totalW += img.targetWeight;
      }
    }

    const defaultW = totalW > 0 ? 0 : 1;
    const maxW = (1 - changedImage.targetWeight) / (totalW || this.images.length - 1);

    for (const img of this.images) {
      if (img !== changedImage) {
        img.setWeight((defaultW || img.targetWeight) * maxW);
      }
    }
  }

  /**
   * Load project from storage
   */
  static load(id) {
    const storage = new LocalStorageManager('Projects');
    const data = storage.get(id);
    if (data) {
      const project = new ProjectModel(data);
      project.loadImages();
      return project;
    }
    return null;
  }

  /**
   * Get all projects from storage
   */
  static loadAll() {
    const storage = new LocalStorageManager('Projects');
    const projects = storage.getAll().map(({ value }) => {
      const project = new ProjectModel(value);
      project.loadImages();
      return project;
    });
    return projects;
  }
}
