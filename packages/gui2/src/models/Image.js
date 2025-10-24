import { Image as MorpherImage } from 'morpher-js';
import { generateId } from '../utils/storage.js';

/**
 * Image Model - represents an image in a project
 */
export class ImageModel extends EventTarget {
  constructor(data = {}, storage = null) {
    super();

    this.id = data.id || generateId();
    this.storage = storage;
    this.morpherImage = new MorpherImage();
    this.url = data.url || null;
    this.weight = data.weight || 0;
    this.targetWeight = data.targetWeight || 0;

    // Listen for load events to ensure we notify GUI
    this.morpherImage.on('load', () => {
      console.log('MorpherImage loaded! Source canvas:', this.morpherImage.source);
      console.log('Canvas size:', this.morpherImage.source.width, 'x', this.morpherImage.source.height);
      this.dispatchEvent(new CustomEvent('load'));
    });

    // Set initial weight
    if (this.weight > 0) {
      this.morpherImage.setWeight(this.weight);
    }

    // Load image if URL provided
    if (this.url) {
      this.morpherImage.setSrc(this.url);
    }
  }

  /**
   * Save image to storage
   */
  save() {
    if (this.storage) {
      const data = this.toJSON();
      this.storage.set(this.id, data);
    }
    this.dispatchEvent(new CustomEvent('save'));
    return this;
  }

  /**
   * Delete image from storage
   */
  destroy() {
    if (this.storage) {
      this.storage.remove(this.id);
    }

    // Cleanup morpher image
    if (this.morpherImage.dispose) {
      this.morpherImage.dispose();
    }

    this.dispatchEvent(new CustomEvent('destroy'));
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      url: this.url,
      weight: this.weight,
      targetWeight: this.targetWeight
    };
  }

  /**
   * Set image source (file or URL)
   */
  setFile(file) {
    if (file instanceof File) {
      // Create object URL for file
      const url = URL.createObjectURL(file);
      this.url = url;
      console.log('Setting image source from file:', url);
      this.morpherImage.setSrc(url);
    } else if (typeof file === 'string') {
      this.url = file;
      console.log('Setting image source from URL:', file);
      this.morpherImage.setSrc(file);
    }
    this.save();
    this.dispatchEvent(new CustomEvent('change', { detail: { file } }));
  }

  /**
   * Set weight
   */
  setWeight(weight) {
    this.weight = weight;
    this.morpherImage.setWeight(weight);
    this.save();
    this.dispatchEvent(new CustomEvent('change', { detail: { weight } }));
  }

  /**
   * Set target weight
   */
  setTargetWeight(targetWeight) {
    this.targetWeight = targetWeight;
    this.weight = targetWeight;
    this.morpherImage.setWeight(targetWeight);
    this.save();
    this.dispatchEvent(new CustomEvent('change:targetWeight', { detail: { targetWeight } }));
  }

  /**
   * Add point to image
   */
  addPoint(x, y) {
    this.morpherImage.addPoint({ x, y });
    this.dispatchEvent(new CustomEvent('point:add', { detail: { x, y } }));
  }

  /**
   * Split edge between two points
   */
  splitEdge(p1, p2) {
    this.morpherImage.splitEdge(p1, p2);
    this.dispatchEvent(new CustomEvent('edge:split', { detail: { p1, p2 } }));
  }
}
