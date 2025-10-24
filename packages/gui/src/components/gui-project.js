/**
 * Project Component
 *
 * Displays all images in a project as a horizontal scrollable list of tiles.
 * Shows an "Add Image" button at the end.
 *
 * Attributes:
 * - project-id: The ID of the project to display
 *
 * Events:
 * - image-add - User clicked add image button
 */

import { BaseComponent } from './base/BaseComponent.js';
import { projectStore } from '../models/ProjectStore.js';

class GuiProject extends BaseComponent {
  static get observedAttributes() {
    return ['project-id'];
  }

  constructor() {
    super();
    this.project = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'project-id' && oldValue !== newValue) {
      this.loadProject(newValue);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    const projectId = this.getAttribute('project-id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  loadProject(projectId) {
    // Remove listeners from old project
    if (this.project) {
      this.project.removeEventListener('image:add', this.handleImageChange);
      this.project.removeEventListener('image:remove', this.handleImageChange);
      // Remove listeners from all images
      this.project.images.forEach((image) => {
        image.removeEventListener('change:src', this.handleImageChange);
        image.removeEventListener('points:change', this.handleMeshChange);
      });
    }

    // Load new project
    this.project = projectStore.getById(projectId);

    if (this.project) {
      // Listen to project changes
      this.handleImageChange = () => this.render();
      this.handleMeshChange = () => this.drawCanvases();

      this.project.addEventListener('image:add', this.handleProjectImageAdd);
      this.project.addEventListener('image:remove', this.handleImageChange);

      // Listen to all existing images for src and points changes
      // (weight changes are handled manually in the slider to avoid re-renders)
      this.project.images.forEach((image) => {
        image.addEventListener('change:src', this.handleImageChange);
        image.addEventListener('points:change', this.handleMeshChange);
      });
    }

    this.render();
  }

  handleProjectImageAdd = (event) => {
    // When a new image is added, attach listeners to it
    const image = event.detail?.image;
    if (image) {
      image.addEventListener('change:src', this.handleImageChange);
      image.addEventListener('points:change', this.handleMeshChange);
      // Don't listen to weight changes - handled manually in slider
    }
    this.render();
  };

  addEventListeners() {
    // Add image button
    const addBtn = this.query('.add-image-btn');
    if (addBtn) {
      this.addTrackedListener(addBtn, 'click', () => {
        this.handleAddImage();
      });
    }

    // File input
    const fileInput = this.query('#file-input');
    if (fileInput) {
      this.addTrackedListener(fileInput, 'change', (e) => {
        this.handleFileSelect(e);
      });
    }

    // Drag and drop
    const tilesContainer = this.query('.tiles-container');
    if (tilesContainer) {
      this.addTrackedListener(tilesContainer, 'dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tilesContainer.classList.add('drag-over');
      });

      this.addTrackedListener(tilesContainer, 'dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tilesContainer.classList.remove('drag-over');
      });

      this.addTrackedListener(tilesContainer, 'drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tilesContainer.classList.remove('drag-over');
        this.handleDrop(e);
      });
    }
  }

  handleAddImage() {
    // Trigger file input
    const fileInput = this.query('#file-input');
    if (fileInput) {
      fileInput.click();
    }
  }

  async handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0 || !this.project) return;

    await this.processFiles(files);

    // Reset input
    event.target.value = '';
  }

  async handleDrop(event) {
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Filter to only image files
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please drop image files only');
      return;
    }

    await this.processFiles(imageFiles);
  }

  async processFiles(files) {
    if (!this.project) return;

    for (const file of files) {
      try {
        // Add image without auto-save (file data not loaded yet)
        const image = this.project.addImage({
          url: file.name,
          targetWeight: 0,
        }, { skipSave: true });

        // Load the file data
        await image.setSrc(file);

        // Now save with the loaded image data
        this.project.save();

        this.emit('image-add', { image });
      } catch (error) {
        console.error('Error loading image:', error);
        alert(`Failed to load image: ${file.name}`);
      }
    }
  }

  render() {
    if (!this.project) {
      this.shadowRoot.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #999;">
          Project not found
        </div>
      `;
      return;
    }

    const images = this.project.images;
    const hasImages = images.length > 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .project {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 16px);
        }

        .tiles-container {
          display: flex;
          gap: var(--spacing-md, 16px);
          overflow-x: auto;
          padding-bottom: var(--spacing-md, 16px);
          transition: background-color 0.2s ease, border-color 0.2s ease;
          padding: var(--spacing-md, 16px);
          margin: calc(-1 * var(--spacing-md, 16px));
          border: 2px dashed transparent;
          border-radius: 8px;
        }

        .tiles-container.drag-over {
          background-color: rgba(0, 123, 255, 0.05);
          border-color: var(--color-primary, #007bff);
        }

        .tiles-container::-webkit-scrollbar {
          height: 8px;
        }

        .tiles-container::-webkit-scrollbar-track {
          background: var(--color-surface, #fff);
          border-radius: 4px;
        }

        .tiles-container::-webkit-scrollbar-thumb {
          background: var(--color-border, #ddd);
          border-radius: 4px;
        }

        .tiles-container::-webkit-scrollbar-thumb:hover {
          background: var(--color-border-hover, #ccc);
        }

        .image-tile {
          flex: 0 0 300px;
          background: var(--color-surface, #fff);
          border-radius: 8px;
          padding: var(--spacing-md, 16px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
        }

        .canvas-container {
          width: 100%;
          height: 200px;
          background: var(--color-background, #f5f5f5);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .canvas-placeholder {
          color: var(--color-text-secondary, #999);
          font-size: var(--font-size-sm, 14px);
          position: absolute;
          z-index: 1;
        }

        .image-canvas {
          width: 100%;
          height: 100%;
          display: block;
          image-rendering: auto;
        }

        .image-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 4px);
        }

        .image-url {
          font-size: var(--font-size-sm, 14px);
          color: var(--color-text-secondary, #666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .weight-control {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 4px);
        }

        .weight-label {
          font-size: var(--font-size-sm, 14px);
          color: var(--color-text-secondary, #666);
        }

        .weight-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border, #ddd);
          outline: none;
          cursor: pointer;
        }

        /* Webkit (Chrome, Safari, Edge) - Track */
        .weight-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: transparent;
        }

        /* Webkit - Thumb */
        .weight-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: grab;
          margin-top: -6px; /* Centers thumb on track (18px - 6px) / 2 */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.1s ease;
        }

        .weight-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .weight-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }

        /* Firefox - Track */
        .weight-slider::-moz-range-track {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border, #ddd);
          border: none;
        }

        /* Firefox - Thumb */
        .weight-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: grab;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.1s ease;
        }

        .weight-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        .weight-slider::-moz-range-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }

        /* Firefox - Progress (filled portion) */
        .weight-slider::-moz-range-progress {
          height: 6px;
          border-radius: 3px;
          background: var(--color-primary, #007bff);
        }

        .image-actions {
          display: flex;
          gap: var(--spacing-xs, 4px);
        }

        .btn {
          padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: var(--font-size-sm, 14px);
          transition: background var(--transition-fast, 150ms ease);
        }

        .btn:hover {
          background: var(--color-primary-hover, #0056b3);
        }

        .btn-secondary {
          background: var(--color-secondary, #6c757d);
        }

        .btn-secondary:hover {
          background: var(--color-secondary-hover, #545b62);
        }

        .btn-danger {
          background: var(--color-danger, #dc3545);
        }

        .btn-danger:hover {
          background: var(--color-danger-hover, #c82333);
        }

        .add-tile {
          flex: 0 0 300px;
          background: var(--color-surface, #fff);
          border: 2px dashed var(--color-border, #ddd);
          border-radius: 8px;
          padding: var(--spacing-md, 16px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease);
        }

        .add-tile:hover {
          border-color: var(--color-primary, #007bff);
          background: var(--color-surface-hover, #f8f9fa);
        }

        .add-tile-content {
          text-align: center;
          color: var(--color-text-secondary, #666);
        }

        .add-icon {
          font-size: 48px;
          margin-bottom: var(--spacing-sm, 8px);
          color: var(--color-primary, #007bff);
        }

        .add-text {
          font-size: var(--font-size-md, 16px);
        }

        .file-input {
          display: none;
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xl, 32px);
          color: var(--color-text-secondary, #999);
        }
      </style>

      <div class="project">
        ${hasImages ? `
          <div class="tiles-container">
            ${images.map((image, index) => `
              <div class="image-tile" data-image-id="${image.id}">
                <div class="canvas-container">
                  <canvas
                    class="image-canvas"
                    data-image-id="${image.id}"
                  ></canvas>
                  ${!image.file ? `
                    <div class="canvas-placeholder">Loading...</div>
                  ` : ''}
                </div>
                <div class="image-info">
                  <div class="image-url" title="${this.escapeHTML(image.url)}">${this.escapeHTML(image.url || 'Untitled')}</div>
                </div>
                <div class="weight-control">
                  <label class="weight-label">
                    Weight: <span class="weight-value">${image.targetWeight.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    class="weight-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value="${image.targetWeight}"
                    data-image-id="${image.id}"
                    style="background: linear-gradient(to right, var(--color-primary, #007bff) 0%, var(--color-primary, #007bff) ${image.targetWeight * 100}%, var(--color-border, #ddd) ${image.targetWeight * 100}%, var(--color-border, #ddd) 100%);"
                  />
                </div>
                <div class="image-actions">
                  <button class="btn btn-secondary btn-move" data-image-id="${image.id}">Move</button>
                  <button class="btn btn-danger btn-delete" data-image-id="${image.id}">Delete</button>
                </div>
              </div>
            `).join('')}

            <div class="add-tile add-image-btn">
              <div class="add-tile-content">
                <div class="add-icon">+</div>
                <div class="add-text">Add Image</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="empty-state">
            <p>No images yet. Click below to add your first image.</p>
            <div class="tiles-container">
              <div class="add-tile add-image-btn">
                <div class="add-tile-content">
                  <div class="add-icon">+</div>
                  <div class="add-text">Add Image</div>
                </div>
              </div>
            </div>
          </div>
        `}

        <input
          type="file"
          id="file-input"
          class="file-input"
          accept="image/*"
          multiple
        />
      </div>
    `;

    this.addEventListeners();
    this.addImageEventListeners();
    this.drawCanvases();
  }

  /**
   * Draw images on canvases
   */
  drawCanvases() {
    if (!this.project) return;

    this.project.images.forEach(image => {
      if (!image.file) return;

      // Capture the image ID for the closure
      const imageId = image.id;
      const img = new window.Image();

      img.onload = () => {
        // Re-query for the canvas to ensure we have the correct one
        // (in case DOM was updated between starting load and onload firing)
        const canvas = this.query(`.image-canvas[data-image-id="${imageId}"]`);
        if (!canvas) return; // Canvas might have been removed

        // Set canvas dimensions to match its rendered size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');

        // Calculate dimensions to fit image in canvas while maintaining aspect ratio
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
          // Image is wider - fit to width
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgAspect;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          // Image is taller - fit to height
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgAspect;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw image centered and scaled
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Draw mesh overlay for this specific image
        const projectImage = this.project.images.find(img => img.id === imageId);
        if (projectImage) {
          this.drawMeshOverlay(ctx, offsetX, offsetY, drawWidth, drawHeight, projectImage);
        }
      };

      img.src = image.file;
    });
  }

  /**
   * Draw mesh overlay (points and triangles) on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} offsetX - Image X offset
   * @param {number} offsetY - Image Y offset
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {Image} image - Image model with points
   */
  drawMeshOverlay(ctx, offsetX, offsetY, width, height, image) {
    if (!image || !image.points || image.points.length === 0) {
      return;
    }

    // Draw triangles (shared across all images)
    if (this.project.triangles && this.project.triangles.length > 0) {
      ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
      ctx.lineWidth = 1;

      this.project.triangles.forEach(([p1, p2, p3]) => {
        const point1 = image.points[p1];
        const point2 = image.points[p2];
        const point3 = image.points[p3];

        if (!point1 || !point2 || !point3) {
          return;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX + point1.x * width, offsetY + point1.y * height);
        ctx.lineTo(offsetX + point2.x * width, offsetY + point2.y * height);
        ctx.lineTo(offsetX + point3.x * width, offsetY + point3.y * height);
        ctx.closePath();
        ctx.stroke();
      });
    }

    // Draw points for this specific image
    ctx.fillStyle = '#007bff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    image.points.forEach((point) => {
      const x = offsetX + point.x * width;
      const y = offsetY + point.y * height;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  }

  addImageEventListeners() {
    // Weight sliders
    const sliders = this.queryAll('.weight-slider');
    sliders.forEach(slider => {
      const handleWeightInput = (e) => {
        // Update the model to trigger weight normalization
        const imageId = e.target.dataset.imageId;
        const value = parseFloat(e.target.value);
        const percentage = value * 100;
        const image = this.project.images.find(img => img.id === imageId);

        if (!image) return;

        // Update the changed image's targetWeight
        // This will trigger handleWeightChange in Project model
        image.targetWeight = value;

        // Update current slider background gradient
        e.target.style.background = `linear-gradient(to right, var(--color-primary, #007bff) 0%, var(--color-primary, #007bff) ${percentage}%, var(--color-border, #ddd) ${percentage}%, var(--color-border, #ddd) 100%)`;

        // Update current slider display
        const tile = this.query(`[data-image-id="${imageId}"]`);
        if (tile) {
          const valueSpan = tile.querySelector('.weight-value');
          if (valueSpan) {
            valueSpan.textContent = value.toFixed(2);
          }
        }

        // Update all OTHER sliders to reflect normalized weights
        this.project.images.forEach(img => {
          if (img.id !== imageId) {
            const otherSlider = this.query(`.weight-slider[data-image-id="${img.id}"]`);
            const otherTile = this.query(`[data-image-id="${img.id}"]`);

            if (otherSlider) {
              // Update slider value
              otherSlider.value = img.weight;

              // Update slider background
              const otherPercentage = img.weight * 100;
              otherSlider.style.background = `linear-gradient(to right, var(--color-primary, #007bff) 0%, var(--color-primary, #007bff) ${otherPercentage}%, var(--color-border, #ddd) ${otherPercentage}%, var(--color-border, #ddd) 100%)`;
            }

            if (otherTile) {
              // Update display text
              const otherValueSpan = otherTile.querySelector('.weight-value');
              if (otherValueSpan) {
                otherValueSpan.textContent = img.weight.toFixed(2);
              }
            }
          }
        });
      };

      const handleWeightChange = (e) => {
        // Save to localStorage when user releases the slider
        if (this.project) {
          this.project.save();
        }
      };

      // input = while dragging (update model + all sliders for live normalization)
      // change = on release (save to localStorage)
      this.addTrackedListener(slider, 'input', handleWeightInput);
      this.addTrackedListener(slider, 'change', handleWeightChange);
    });

    // Canvas interaction handling (add/drag mesh points)
    const canvases = this.queryAll('.image-canvas');
    canvases.forEach(canvas => {
      let draggedPointIndex = null;
      let isDragging = false;
      const imageId = canvas.dataset.imageId;

      this.addTrackedListener(canvas, 'mousedown', (e) => {
        // Only handle left-click (button 0)
        if (e.button !== 0) {
          return;
        }

        if (!this.project) {
          return;
        }

        const image = this.project.images.find(img => img.id === imageId);
        if (!image) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // Check if clicking near an existing point
        const clickRadius = 10; // pixels

        let nearestPoint = null;
        let nearestDistance = Infinity;

        image.points.forEach((point, index) => {
          const pointX = point.x * canvasWidth;
          const pointY = point.y * canvasHeight;
          const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

          if (distance < clickRadius && distance < nearestDistance) {
            nearestPoint = index;
            nearestDistance = distance;
          }
        });

        if (nearestPoint !== null) {
          // Start dragging existing point
          draggedPointIndex = nearestPoint;
          isDragging = true;
          canvas.style.cursor = 'grabbing';
        }
      });

      this.addTrackedListener(canvas, 'mousemove', (e) => {
        if (!this.project) {
          return;
        }

        const image = this.project.images.find(img => img.id === imageId);
        if (!image) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        if (isDragging && draggedPointIndex !== null) {
          // Update point position while dragging on this specific image
          const normalizedX = Math.max(0, Math.min(1, x / canvasWidth));
          const normalizedY = Math.max(0, Math.min(1, y / canvasHeight));
          image.updatePoint(draggedPointIndex, normalizedX, normalizedY);
        } else {
          // Update cursor when hovering over points
          const clickRadius = 10;
          let overPoint = false;

          image.points.forEach((point) => {
            const pointX = point.x * canvasWidth;
            const pointY = point.y * canvasHeight;
            const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

            if (distance < clickRadius) {
              overPoint = true;
            }
          });

          canvas.style.cursor = overPoint ? 'grab' : 'crosshair';
        }
      });

      this.addTrackedListener(canvas, 'mouseup', (e) => {
        // Only handle left-click (button 0)
        if (e.button !== 0) {
          return;
        }

        if (!this.project) {
          return;
        }

        const image = this.project.images.find(img => img.id === imageId);
        if (!image) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        if (isDragging) {
          // Finished dragging
          isDragging = false;
          draggedPointIndex = null;
          canvas.style.cursor = 'crosshair';
        } else {
          // Click without drag - add new point to ALL images at same position
          const normalizedX = x / canvasWidth;
          const normalizedY = y / canvasHeight;

          // Add to all images to keep them in sync
          this.project.images.forEach(img => {
            img.addPoint(normalizedX, normalizedY);
          });
        }
      });

      this.addTrackedListener(canvas, 'mouseleave', () => {
        // Stop dragging if mouse leaves canvas
        if (isDragging) {
          isDragging = false;
          draggedPointIndex = null;
          canvas.style.cursor = 'crosshair';
        }
      });

      this.addTrackedListener(canvas, 'contextmenu', (e) => {
        e.preventDefault(); // Prevent default context menu

        if (!this.project) {
          return;
        }

        const image = this.project.images.find(img => img.id === imageId);
        if (!image) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // Check if right-clicking near an existing point
        const clickRadius = 10; // pixels

        let nearestPoint = null;
        let nearestDistance = Infinity;

        image.points.forEach((point, index) => {
          const pointX = point.x * canvasWidth;
          const pointY = point.y * canvasHeight;
          const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

          if (distance < clickRadius && distance < nearestDistance) {
            nearestPoint = index;
            nearestDistance = distance;
          }
        });

        if (nearestPoint !== null) {
          console.log('[gui-project] Deleting point index:', nearestPoint, 'from all', this.project.images.length, 'images');

          // Delete point from ALL images to keep them in sync
          this.project.images.forEach((img, idx) => {
            console.log(`  - Removing point ${nearestPoint} from image ${idx} (currently has ${img.points.length} points)`);
            img.removePoint(nearestPoint);
          });

          console.log('[gui-project] After deletion, first image has', this.project.images[0].points.length, 'points');
        }
      });
    });

    // Delete buttons
    const deleteButtons = this.queryAll('.btn-delete');
    deleteButtons.forEach(btn => {
      this.addTrackedListener(btn, 'click', (e) => {
        const imageId = e.target.dataset.imageId;
        const image = this.project.images.find(img => img.id === imageId);

        if (image && confirm(`Delete image "${image.url}"?`)) {
          this.project.removeImage(image);
        }
      });
    });
  }
}

customElements.define('gui-project', GuiProject);

export { GuiProject };
