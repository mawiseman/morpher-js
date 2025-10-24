import { BaseComponent } from '../utils/base-component.js';

/**
 * ImageView - Individual image view with canvas and controls
 */
export class GuiImage extends BaseComponent {
  constructor() {
    super();
    this.image = null;
    this.project = null;
  }

  setImage(image, project) {
    this.image = image;
    this.project = project;

    // Listen to image events
    image.addEventListener('change', () => this.updateUI());
    image.addEventListener('load', () => {
      console.log('ImageModel load event received');
      this.updateCanvas();
    });

    this.render();
  }

  template() {
    if (!this.image) return '';

    return `
      <div class="gui-image">
        <div class="image-header">
          <button class="remove-btn" data-action="removeImage">×</button>
        </div>
        <div class="image-canvas-container">
          <canvas class="image-canvas"></canvas>
        </div>
        <div class="image-controls">
          <label>
            Weight: <span class="weight-value">${(this.image.targetWeight * 100).toFixed(0)}%</span>
            <input type="range" min="0" max="100" value="${this.image.targetWeight * 100}" data-control="weight">
          </label>
          <button data-action="upload">Upload Image</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    // Attach morpher image's source canvas (the rendered output)
    if (this.image && this.image.morpherImage) {
      const container = this.$('.image-canvas-container');
      if (container) {
        // Clear existing canvas
        const existing = container.querySelector('canvas');
        if (existing && existing !== this.image.morpherImage.source) {
          existing.remove();
        }

        // The Image class has a 'source' canvas that shows the rendered image
        if (this.image.morpherImage.source) {
          container.appendChild(this.image.morpherImage.source);
        }
      }
    }

    // Listen for image load events to update the canvas
    if (this.image && this.image.morpherImage) {
      this.image.morpherImage.on('load', () => {
        this.updateCanvas();
      });

      // Also listen for changes that might affect the canvas
      this.image.morpherImage.on('change', () => {
        this.updateCanvas();
      });
    }
  }

  /**
   * Update canvas display
   */
  updateCanvas() {
    console.log('updateCanvas called');
    const container = this.$('.image-canvas-container');
    if (container && this.image && this.image.morpherImage.source) {
      console.log('Updating canvas, source:', this.image.morpherImage.source);
      console.log('Source dimensions:', this.image.morpherImage.source.width, 'x', this.image.morpherImage.source.height);

      // Refresh canvas reference in case it changed
      const existing = container.querySelector('canvas');
      if (existing !== this.image.morpherImage.source) {
        if (existing) existing.remove();
        container.appendChild(this.image.morpherImage.source);
        console.log('Canvas appended to container');

        // Attach click listener to the new canvas
        this.attachCanvasClickListener();
      }
    } else {
      console.log('updateCanvas - missing:', { container: !!container, image: !!this.image, source: !!(this.image?.morpherImage?.source) });
    }
  }

  /**
   * Attach click listener to canvas for adding points
   */
  attachCanvasClickListener() {
    const canvas = this.image.morpherImage.source;
    if (!canvas) return;

    // Remove old listener if exists
    if (this._canvasClickHandler) {
      canvas.removeEventListener('click', this._canvasClickHandler);
    }

    // Create and attach new listener
    this._canvasClickHandler = (e) => {
      const rect = canvas.getBoundingClientRect();

      // Calculate actual coordinates accounting for canvas scaling
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      console.log('Canvas clicked at:', { x, y, canvasSize: { w: canvas.width, h: canvas.height } });
      this.image.addPoint(x, y);
    };

    canvas.addEventListener('click', this._canvasClickHandler);
    console.log('Canvas click listener attached');
  }

  attachEventListeners() {
    // Action buttons
    this.$$('[data-action]').forEach(btn => {
      this.on(btn, 'click', (e) => {
        const action = e.target.dataset.action;
        if (this[action]) {
          this[action]();
        }
      });
    });

    // Weight slider
    const weightSlider = this.$('[data-control=weight]');
    if (weightSlider) {
      this.on(weightSlider, 'input', (e) => {
        const value = parseFloat(e.target.value) / 100;
        this.image.setTargetWeight(value);
        this.project.updateWeights(this.image);
        this.updateWeightDisplay(value);
      });
    }

    // Canvas click listener will be attached in updateCanvas() when canvas is added
  }

  /**
   * Remove image (triggered by button click)
   */
  removeImage() {
    if (confirm('Remove this image?')) {
      this.project.removeImage(this.image);
    }
  }

  /**
   * Upload new image
   */
  upload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.image.setFile(file);
      }
    };
    input.click();
  }

  /**
   * Update UI elements
   */
  updateUI() {
    this.updateWeightDisplay(this.image.targetWeight);
  }

  /**
   * Update weight display
   */
  updateWeightDisplay(value) {
    const display = this.$('.weight-value');
    if (display) {
      display.textContent = `${(value * 100).toFixed(0)}%`;
    }
  }
}

customElements.define('gui-image', GuiImage);
