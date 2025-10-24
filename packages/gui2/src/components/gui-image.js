import { BaseComponent } from '../utils/base-component.js';

/**
 * ImageView - Individual image view with canvas and controls
 */
export class GuiImage extends BaseComponent {
  constructor() {
    super();
    this.image = null;
    this.project = null;
    this.selectedPoints = []; // Track selected points for triangle creation
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

      // Listen for point additions to redraw points
      this.image.morpherImage.on('point:add', () => {
        console.log('Point added event received');
        this.drawPoints();
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
      } else {
        // Canvas already exists, just redraw points
        this.drawPoints();
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

      // Check if clicking near an existing point (within 10px radius)
      const points = this.image.morpherImage.points;
      let clickedPointIndex = -1;
      const clickRadius = 10;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const distance = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        if (distance < clickRadius) {
          clickedPointIndex = i;
          break;
        }
      }

      if (clickedPointIndex !== -1) {
        // Clicked on existing point - toggle selection
        console.log('Point', clickedPointIndex, 'clicked');
        this.togglePointSelection(clickedPointIndex);
      } else {
        // Clicked on empty area - add new point
        console.log('Canvas clicked at:', { x, y, canvasSize: { w: canvas.width, h: canvas.height } });
        this.image.addPoint(x, y);
      }

      // Redraw points after adding/selecting
      this.drawPoints();
    };

    canvas.addEventListener('click', this._canvasClickHandler);
    console.log('Canvas click listener attached');

    // Draw existing points
    this.drawPoints();
  }

  /**
   * Toggle point selection for triangle creation
   */
  togglePointSelection(pointIndex) {
    const index = this.selectedPoints.indexOf(pointIndex);

    if (index !== -1) {
      // Deselect point
      this.selectedPoints.splice(index, 1);
      console.log('Point', pointIndex, 'deselected. Selected:', this.selectedPoints);
    } else {
      // Select point
      this.selectedPoints.push(pointIndex);
      console.log('Point', pointIndex, 'selected. Selected:', this.selectedPoints);

      // If 3 points selected, create triangle
      if (this.selectedPoints.length === 3) {
        console.log('Creating triangle with points:', this.selectedPoints);
        this.project.addTriangle(
          this.selectedPoints[0],
          this.selectedPoints[1],
          this.selectedPoints[2]
        );
        // Clear selection after creating triangle
        this.selectedPoints = [];
        console.log('Triangle created, selection cleared');
      }
    }
  }

  /**
   * Draw visual markers for mesh points on the canvas
   */
  drawPoints() {
    const canvas = this.image.morpherImage.source;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const points = this.image.morpherImage.points;

    // Save current canvas state
    ctx.save();

    // Redraw the base image first
    if (this.image.morpherImage.loaded) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.image.morpherImage.el, 0, 0);
    }

    // Draw each point as a circle
    if (points && points.length > 0) {
      console.log(`Drawing ${points.length} points on canvas`);

      points.forEach((point, index) => {
        const isSelected = this.selectedPoints.includes(index);

        // Draw point circle with different style if selected
        ctx.beginPath();
        ctx.arc(point.x, point.y, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ff6b6b' : '#4a9eff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Draw point number
        ctx.fillStyle = '#ffffff';
        ctx.font = isSelected ? 'bold 14px sans-serif' : 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index, point.x, point.y);
      });
    }

    // Restore canvas state
    ctx.restore();

    console.log('Points drawn on canvas');
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
