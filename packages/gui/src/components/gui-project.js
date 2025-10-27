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
import { Morpher } from 'morpher-js';

class GuiProject extends BaseComponent {
  static get observedAttributes() {
    return ['project-id'];
  }

  constructor() {
    super();
    this.project = null;
    this.morpher = null;

    // Load zoom level from localStorage, default to 1.0
    const savedZoom = localStorage.getItem('morpher-zoom-level');
    this.zoomLevel = savedZoom ? parseFloat(savedZoom) : 1.0;

    // Load view mode from localStorage, default to 'horizontal'
    const savedViewMode = localStorage.getItem('morpher-view-mode');
    this.viewMode = savedViewMode || 'horizontal';
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
      this.handleMeshChange = () => {
        this.drawCanvases();
        this.syncMorpherPointsAndTriangles();
      };
      this.handleWeightsNormalized = () => this.updateWeightSliders();

      this.project.addEventListener('image:add', this.handleProjectImageAdd);
      this.project.addEventListener('image:remove', this.handleImageChange);
      this.project.addEventListener('weights:normalized', this.handleWeightsNormalized);

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

  updateWeightSliders() {
    // Update all weight sliders to reflect normalized weights
    this.project.images.forEach(img => {
      const slider = this.query(`.weight-slider[data-image-id="${img.id}"]`);
      const tile = this.query(`.image-tile[data-image-id="${img.id}"]`);

      if (slider) {
        slider.value = img.weight;
        const percentage = img.weight * 100;
        slider.style.background = `linear-gradient(to right, var(--color-primary, #007bff) 0%, var(--color-primary, #007bff) ${percentage}%, var(--color-border, #ddd) ${percentage}%, var(--color-border, #ddd) 100%)`;
      }

      if (tile) {
        const valueSpan = tile.querySelector('.weight-value');
        if (valueSpan) {
          valueSpan.textContent = img.weight.toFixed(2);
        }
      }
    });
  }

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

    // Zoom controls
    const zoomSlider = this.query('.zoom-slider');
    if (zoomSlider) {
      this.addTrackedListener(zoomSlider, 'input', (e) => {
        this.handleZoomChange(parseFloat(e.target.value));
      });
    }

    const zoomInBtn = this.query('.zoom-in');
    if (zoomInBtn) {
      this.addTrackedListener(zoomInBtn, 'click', () => {
        this.handleZoomChange(Math.min(10, this.zoomLevel + 0.5));
      });
    }

    const zoomOutBtn = this.query('.zoom-out');
    if (zoomOutBtn) {
      this.addTrackedListener(zoomOutBtn, 'click', () => {
        this.handleZoomChange(Math.max(0.5, this.zoomLevel - 0.5));
      });
    }

    const zoomResetBtn = this.query('.zoom-reset');
    if (zoomResetBtn) {
      this.addTrackedListener(zoomResetBtn, 'click', () => {
        this.handleZoomChange(1.0);
      });
    }

    // View mode toggle
    const viewModeToggle = this.query('.view-mode-toggle');
    if (viewModeToggle) {
      this.addTrackedListener(viewModeToggle, 'click', () => {
        this.toggleViewMode();
      });
    }

    // Synchronized scrolling in portrait mode
    this.setupSyncedScrolling();

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

  setupSyncedScrolling() {
    // Only sync scrolling in portrait mode
    if (this.viewMode !== 'portrait') return;

    const canvasContainers = this.queryAll('.canvas-container');
    if (canvasContainers.length < 2) return;

    // Track which container is being scrolled to prevent circular updates
    let isScrolling = false;

    canvasContainers.forEach((container, index) => {
      this.addTrackedListener(container, 'scroll', () => {
        if (isScrolling) return;

        isScrolling = true;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        // Sync scroll position to other containers
        canvasContainers.forEach((otherContainer, otherIndex) => {
          if (otherIndex !== index) {
            otherContainer.scrollLeft = scrollLeft;
            otherContainer.scrollTop = scrollTop;
          }
        });

        // Use requestAnimationFrame to reset the flag
        requestAnimationFrame(() => {
          isScrolling = false;
        });
      });
    });
  }

  handleZoomChange(newZoom) {
    this.zoomLevel = newZoom;

    // Save zoom level to localStorage
    localStorage.setItem('morpher-zoom-level', this.zoomLevel.toString());

    // Update the CSS variable
    const projectContainer = this.query('.project');
    if (projectContainer) {
      projectContainer.style.setProperty('--zoom-level', this.zoomLevel);
    }

    // Update zoom value display
    const zoomValue = this.query('.zoom-value');
    if (zoomValue) {
      zoomValue.textContent = `${this.zoomLevel.toFixed(1)}x`;
    }

    // Update slider value
    const zoomSlider = this.query('.zoom-slider');
    if (zoomSlider) {
      zoomSlider.value = this.zoomLevel;
    }

    // In portrait mode, manually scale canvas CSS dimensions
    if (this.viewMode === 'portrait') {
      const canvases = this.queryAll('.image-canvas');
      canvases.forEach(canvas => {
        // Get the natural dimensions from canvas attributes
        const naturalWidth = canvas.width;
        const naturalHeight = canvas.height;

        // Set CSS dimensions to natural * zoom
        canvas.style.width = `${naturalWidth * this.zoomLevel}px`;
        canvas.style.height = `${naturalHeight * this.zoomLevel}px`;
      });
    } else {
      // In horizontal mode, remove inline styles to use CSS
      const canvases = this.queryAll('.image-canvas');
      canvases.forEach(canvas => {
        canvas.style.width = '';
        canvas.style.height = '';
      });
    }

    // Redraw canvases after CSS changes are applied
    requestAnimationFrame(() => {
      this.drawCanvases();
    });
  }

  toggleViewMode() {
    // Toggle between horizontal and portrait mode
    this.viewMode = this.viewMode === 'horizontal' ? 'portrait' : 'horizontal';

    // Save view mode to localStorage
    localStorage.setItem('morpher-view-mode', this.viewMode);

    // Re-render to apply the new view mode
    this.render();

    // After render, apply zoom to canvases in portrait mode and setup synced scrolling
    requestAnimationFrame(() => {
      if (this.viewMode === 'portrait') {
        const canvases = this.queryAll('.image-canvas');
        canvases.forEach(canvas => {
          const naturalWidth = canvas.width;
          const naturalHeight = canvas.height;
          canvas.style.width = `${naturalWidth * this.zoomLevel}px`;
          canvas.style.height = `${naturalHeight * this.zoomLevel}px`;
        });

        // Setup synchronized scrolling for portrait mode
        this.setupSyncedScrolling();
      }
    });
  }

  /**
   * Get component styles
   * @returns {string} CSS styles for the component
   */
  getStyles() {
    return `
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

        .tiles-container.portrait-mode {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md, 16px);
          max-height: 85vh;
          overflow: hidden;
        }

        .tiles-container.portrait-mode .image-tile {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .tiles-container.portrait-mode .canvas-container {
          flex: 1;
          min-height: 0;
          overflow: auto;
          height: auto;
          position: relative;
        }

        .tiles-container.portrait-mode .image-canvas {
          display: block;
          max-width: none;
          max-height: none;
          /* Dimensions set via JavaScript in handleZoomChange */
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
          flex: 0 0 calc(300px * var(--zoom-level, 1));
          background: var(--color-surface, #fff);
          border-radius: 8px;
          padding: var(--spacing-md, 16px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
          transition: flex-basis 0.2s ease;
        }

        .canvas-container {
          width: 100%;
          height: calc(200px * var(--zoom-level, 1));
          background: var(--color-background, #f5f5f5);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          transition: height 0.2s ease;
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

        .url-label {
          font-size: var(--font-size-sm, 14px);
          color: var(--color-text-secondary, #666);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 4px);
        }

        .url-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          transition: border-color var(--transition-fast, 150ms ease);
        }

        .url-input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .weight-control {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 4px);
        }

        .weight-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-sm, 14px);
          color: var(--color-text-secondary, #666);
        }

        .weight-value {
          font-weight: 600;
          color: var(--color-primary, #007bff);
        }

        .weight-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border, #ddd);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .weight-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .weight-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .image-actions {
          display: flex;
          gap: var(--spacing-xs, 4px);
        }

        .btn-remove {
          flex: 1;
          padding: 8px 12px;
          background: var(--color-danger, #dc3545);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          cursor: pointer;
          transition: background var(--transition-fast, 150ms ease);
        }

        .btn-remove:hover {
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

        .preview-section {
          background: var(--color-surface, #fff);
          border-radius: 8px;
          padding: var(--spacing-lg, 24px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .preview-title {
          font-size: var(--font-size-lg, 18px);
          font-weight: 600;
          margin-bottom: var(--spacing-md, 16px);
          color: var(--color-text, #333);
        }

        .preview-canvas-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: var(--color-background, #f5f5f5);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          overflow: hidden;
        }

        .preview-canvas {
          max-width: 100%;
          height: auto;
          display: block;
          border: 1px solid var(--color-border, #ddd);
          background: #000;
        }

        .preview-placeholder {
          color: var(--color-text-secondary, #999);
          text-align: center;
          padding: var(--spacing-xl, 32px);
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
          padding: var(--spacing-md, 16px);
          background: var(--color-surface, #fff);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: var(--spacing-md, 16px);
        }

        .zoom-label {
          font-size: var(--font-size-md, 16px);
          font-weight: 600;
          color: var(--color-text, #333);
          min-width: 80px;
        }

        .zoom-slider {
          flex: 1;
          max-width: 300px;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border, #ddd);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .zoom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-primary, #007bff);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .zoom-buttons {
          display: flex;
          gap: var(--spacing-xs, 4px);
        }

        .zoom-button {
          padding: 8px 16px;
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease);
          color: var(--color-text, #333);
          font-weight: 500;
        }

        .zoom-button:hover {
          background: var(--color-surface-hover, #f8f9fa);
          border-color: var(--color-primary, #007bff);
        }

        .zoom-button:active {
          transform: scale(0.95);
        }

        .zoom-value {
          min-width: 50px;
          text-align: center;
          font-size: var(--font-size-md, 16px);
          font-weight: 600;
          color: var(--color-primary, #007bff);
        }

        .view-mode-toggle {
          margin-left: auto;
          padding: 8px 16px;
          background: var(--color-surface, #fff);
          border: 2px solid var(--color-primary, #007bff);
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease);
          color: var(--color-primary, #007bff);
          font-weight: 600;
        }

        .view-mode-toggle:hover {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .view-mode-toggle:active {
          transform: scale(0.95);
        }

        .view-mode-toggle.active {
          background: var(--color-primary, #007bff);
          color: white;
        }
      </style>
    `;
  }

  async handleFileSelect(event) {
    const files = event.target.files;
    const target = event.target;
    if (!files || files.length === 0 || !this.project) return;

    await this.processFiles(files);

    // Reset input (if it still exists after re-render)
    if (target) {
      target.value = '';
    }
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
      ${this.getStyles()}

      <div class="project" style="--zoom-level: ${this.zoomLevel}">
        ${hasImages ? `
          <div class="zoom-controls">
            <span class="zoom-label">Image Zoom:</span>
            <input
              type="range"
              class="zoom-slider"
              min="0.5"
              max="10"
              step="0.1"
              value="${this.zoomLevel}"
            />
            <span class="zoom-value">${this.zoomLevel.toFixed(1)}x</span>
            <div class="zoom-buttons">
              <button class="zoom-button zoom-out">-</button>
              <button class="zoom-button zoom-reset">Reset</button>
              <button class="zoom-button zoom-in">+</button>
            </div>
            <button class="view-mode-toggle ${this.viewMode === 'portrait' ? 'active' : ''}">
              ${this.viewMode === 'portrait' ? '📊 Horizontal View' : '📱 Portrait View'}
            </button>
          </div>
          <div class="tiles-container ${this.viewMode === 'portrait' ? 'portrait-mode' : ''}">
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
                  <label class="url-label">
                    Image URL:
                    <input
                      type="text"
                      class="url-input"
                      placeholder="Enter image URL..."
                      value="${this.escapeHTML(image.url || '')}"
                      data-image-id="${image.id}"
                    />
                  </label>
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

        ${hasImages && images.length >= 2 ? `
          <div class="preview-section">
            <h3 class="preview-title">Morph Preview</h3>
            <div class="preview-canvas-container">
              <canvas id="preview-canvas" class="preview-canvas"></canvas>
            </div>
          </div>
        ` : ''}

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

    // Apply saved zoom level and view mode settings after DOM is ready
    requestAnimationFrame(() => {
      // Apply zoom level to CSS variable
      const projectContainer = this.query('.project');
      if (projectContainer) {
        projectContainer.style.setProperty('--zoom-level', this.zoomLevel);
      }

      // Apply zoom to portrait mode canvases if needed
      if (this.viewMode === 'portrait') {
        const canvases = this.queryAll('.image-canvas');
        canvases.forEach(canvas => {
          const naturalWidth = canvas.width;
          const naturalHeight = canvas.height;
          canvas.style.width = `${naturalWidth * this.zoomLevel}px`;
          canvas.style.height = `${naturalHeight * this.zoomLevel}px`;
        });
      }

      this.initMorpher();
    });
  }

  /**
   * Draw images on canvases
   */
  /**
   * Calculate the actual drawing area of an image on a canvas (accounting for aspect ratio)
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {HTMLImageElement} img - The loaded image
   * @returns {Object} { offsetX, offsetY, drawWidth, drawHeight }
   */
  getImageDrawingArea(canvas, img) {
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

    return { offsetX, offsetY, drawWidth, drawHeight };
  }

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
        const { offsetX, offsetY, drawWidth, drawHeight } = this.getImageDrawingArea(canvas, img);

        // Store drawing area on canvas for mouse event handlers
        canvas.dataset.offsetX = offsetX;
        canvas.dataset.offsetY = offsetY;
        canvas.dataset.drawWidth = drawWidth;
        canvas.dataset.drawHeight = drawHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      // Scale line width based on canvas resolution
      ctx.lineWidth = Math.max(0.5, Math.min(3, width / 500));

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
    // Scale point sizes based on canvas resolution (accounts for zoom)
    const basePointSize = Math.max(3, Math.min(10, width / 200)); // Scale with image width
    const normalRadius = basePointSize;
    const hoveredRadius = basePointSize * 1.6;
    const normalLineWidth = Math.max(1, basePointSize / 2.5);
    const hoveredLineWidth = Math.max(2, basePointSize / 1.5);

    image.points.forEach((point) => {
      const x = offsetX + point.x * width;
      const y = offsetY + point.y * height;

      // Highlight if this point is being hovered
      const isHovered = this.hoveredPointId !== null && point.id === this.hoveredPointId;

      if (isHovered) {
        // Draw larger highlighted point
        ctx.fillStyle = '#ff6b00'; // Orange highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = hoveredLineWidth;

        ctx.beginPath();
        ctx.arc(x, y, hoveredRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // Draw normal point
        ctx.fillStyle = '#007bff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = normalLineWidth;

        ctx.beginPath();
        ctx.arc(x, y, normalRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
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

        // Update morpher preview
        this.updateMorpherWeights();
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

    // URL inputs
    const urlInputs = this.queryAll('.url-input');
    urlInputs.forEach(input => {
      this.addTrackedListener(input, 'change', async (e) => {
        const imageId = e.target.dataset.imageId;
        const url = e.target.value.trim();
        const image = this.project.images.find(img => img.id === imageId);

        if (!image) return;

        if (url) {
          // Set URL and try to load the image
          image.setUrl(url);
          try {
            await image.loadFromUrl(url);
            this.project.save();
            this.drawCanvases();
          } catch (error) {
            alert(`Failed to load image from URL: ${error.message}`);
            e.target.value = image.url || '';
          }
        }
      });
    });

    // Track hovered point ID across all canvases
    this.hoveredPointId = null;

    // Canvas interaction handling (add/drag mesh points)
    const canvases = this.queryAll('.image-canvas');
    canvases.forEach((canvas, canvasIndex) => {
      let draggedPointIndex = null;
      let isDragging = false;
      const imageId = canvas.dataset.imageId;
      const isFirstImage = canvasIndex === 0;

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

        // Get the actual image drawing area (accounting for aspect ratio)
        const offsetX = parseFloat(canvas.dataset.offsetX) || 0;
        const offsetY = parseFloat(canvas.dataset.offsetY) || 0;
        const drawWidth = parseFloat(canvas.dataset.drawWidth) || rect.width;
        const drawHeight = parseFloat(canvas.dataset.drawHeight) || rect.height;

        // Check if clicking near an existing point
        const clickRadius = 10; // pixels

        let nearestPointId = null;
        let nearestDistance = Infinity;

        image.points.forEach((point) => {
          const pointX = offsetX + point.x * drawWidth;
          const pointY = offsetY + point.y * drawHeight;
          const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

          if (distance < clickRadius && distance < nearestDistance) {
            nearestPointId = point.id;
            nearestDistance = distance;
          }
        });

        if (nearestPointId !== null) {
          // Start dragging existing point
          draggedPointIndex = nearestPointId;
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

        // Get the actual image drawing area (accounting for aspect ratio)
        const offsetX = parseFloat(canvas.dataset.offsetX) || 0;
        const offsetY = parseFloat(canvas.dataset.offsetY) || 0;
        const drawWidth = parseFloat(canvas.dataset.drawWidth) || rect.width;
        const drawHeight = parseFloat(canvas.dataset.drawHeight) || rect.height;

        if (isDragging && draggedPointIndex !== null) {
          // Update point position while dragging on this specific image
          // Convert mouse position to normalized coordinates (0-1) relative to image area
          const normalizedX = Math.max(0, Math.min(1, (x - offsetX) / drawWidth));
          const normalizedY = Math.max(0, Math.min(1, (y - offsetY) / drawHeight));
          image.updatePoint(draggedPointIndex, normalizedX, normalizedY);
        } else {
          // Update cursor and hover highlighting when over points
          const clickRadius = 10;
          let overPoint = false;
          let hoveredId = null;

          image.points.forEach((point) => {
            const pointX = offsetX + point.x * drawWidth;
            const pointY = offsetY + point.y * drawHeight;
            const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

            if (distance < clickRadius) {
              overPoint = true;
              hoveredId = point.id;
            }
          });

          // Update global hovered point ID if changed
          if (this.hoveredPointId !== hoveredId) {
            this.hoveredPointId = hoveredId;
            this.drawCanvases(); // Redraw all canvases to show highlight
          }

          // First image: crosshair for adding points, grab for dragging
          // Other images: default cursor (no adding), grab for dragging
          if (overPoint) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = isFirstImage ? 'crosshair' : 'default';
          }
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

        // Get the actual image drawing area (accounting for aspect ratio)
        const offsetX = parseFloat(canvas.dataset.offsetX) || 0;
        const offsetY = parseFloat(canvas.dataset.offsetY) || 0;
        const drawWidth = parseFloat(canvas.dataset.drawWidth) || rect.width;
        const drawHeight = parseFloat(canvas.dataset.drawHeight) || rect.height;

        if (isDragging) {
          // Finished dragging
          isDragging = false;
          draggedPointIndex = null;
          canvas.style.cursor = isFirstImage ? 'crosshair' : 'default';
        } else if (isFirstImage) {
          // Click without drag - add new point to ALL images at same position
          // (only allowed on first image)
          const normalizedX = (x - offsetX) / drawWidth;
          const normalizedY = (y - offsetY) / drawHeight;

          // Add to all images to keep them in sync
          // Use the first image to generate the ID, then use same ID for all images
          let pointId = null;
          this.project.images.forEach((img, idx) => {
            if (idx === 0) {
              // First image generates the ID
              pointId = img.addPoint(normalizedX, normalizedY);
            } else {
              // Other images use the same ID
              img.addPoint(normalizedX, normalizedY, pointId);
            }
          });
        }
      });

      this.addTrackedListener(canvas, 'mouseleave', () => {
        // Stop dragging if mouse leaves canvas
        if (isDragging) {
          isDragging = false;
          draggedPointIndex = null;
          canvas.style.cursor = isFirstImage ? 'crosshair' : 'default';
        }
      });

      this.addTrackedListener(canvas, 'contextmenu', (e) => {
        e.preventDefault(); // Prevent default context menu

        // Only allow deletion on first image
        if (!isFirstImage) {
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

        // Get the actual image drawing area (accounting for aspect ratio)
        const offsetX = parseFloat(canvas.dataset.offsetX) || 0;
        const offsetY = parseFloat(canvas.dataset.offsetY) || 0;
        const drawWidth = parseFloat(canvas.dataset.drawWidth) || rect.width;
        const drawHeight = parseFloat(canvas.dataset.drawHeight) || rect.height;

        // Check if right-clicking near an existing point
        const clickRadius = 10; // pixels

        let nearestPointId = null;
        let nearestDistance = Infinity;

        image.points.forEach((point) => {
          const pointX = offsetX + point.x * drawWidth;
          const pointY = offsetY + point.y * drawHeight;
          const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

          if (distance < clickRadius && distance < nearestDistance) {
            nearestPointId = point.id;
            nearestDistance = distance;
          }
        });

        if (nearestPointId !== null) {
          // Delete point from ALL images using the point ID
          this.project.images.forEach((img) => {
            const pointIndex = img.points.findIndex(p => p.id === nearestPointId);
            if (pointIndex !== -1) {
              img.points.splice(pointIndex, 1);
            }
          });

          // Now trigger triangulation and save once
          this.project.autoTriangulate();
          this.project.save();

          // Trigger re-render
          this.drawCanvases();
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

  /**
   * Initialize or update the Morpher instance
   */
  initMorpher() {
    const previewCanvas = this.query('#preview-canvas');

    // Only initialize if we have the preview canvas (means 2+ images)
    if (!previewCanvas || !this.project || this.project.images.length < 2) {
      // Dispose existing morpher if no longer needed
      if (this.morpher) {
        this.morpher.dispose();
        this.morpher = null;
      }
      return;
    }

    // If morpher already exists and is set up for this project, don't reinitialize
    if (this.morpher && this.morpher.images.length === this.project.images.length) {
      return;
    }

    // Create new morpher if needed
    if (!this.morpher) {
      this.morpher = new Morpher();

      // Manually set canvas WITHOUT triggering initial draw
      // (setCanvas() calls draw() which would try to draw with 0x0 canvas before images load)
      // The library now has a check to skip drawing when tmpCanvas is 0x0
      this.morpher.canvas = previewCanvas;
      this.morpher.ctx = previewCanvas.getContext('2d');

      // Use default (additive/lighter) blending for proper morphing with triangles
      // normalBlendFunction just fades between images without triangle transformation
      this.morpher.blendFunction = Morpher.defaultBlendFunction;

      // Listen for draw events
      this.morpher.addEventListener('draw', (e) => {
        console.log('🎨 Morpher drew with weights:', this.morpher.images.map((img, i) => `[${i}]=${img.weight.toFixed(2)}`).join(' '));
      });
    } else {
      // Clear existing images if reinitializing
      while (this.morpher.images.length > 0) {
        this.morpher.removeImage(this.morpher.images[0]);
      }
    }

    // Add images from project (without points first - will add after load)
    this.project.images.forEach((guiImage) => {
      if (guiImage.file) {
        this.morpher.addImage({
          src: guiImage.file
          // Don't pass points yet - need to convert from normalized to absolute coords
        });
      }
    });

    // Wait for images to load, then add points and sync triangles
    let attempts = 0;
    const checkLoad = () => {
      attempts++;
      const allLoaded = this.morpher.images.every(img => img.loaded);

      if (allLoaded) {
        // Now that images are loaded, convert and add points to FIRST image only
        // The morpher will automatically sync points to other images and the mesh
        const firstImage = this.morpher.images[0];
        const guiImage = this.project.images[0];

        if (firstImage && guiImage && guiImage.points.length > 0) {
          // Add points to EACH morpher image from its corresponding GUI image
          // This ensures each image has points at its own specific positions for morphing
          this.morpher.images.forEach((morpherImg, imgIdx) => {
            const guiImg = this.project.images[imgIdx];
            if (!guiImg) return;

            const imgWidth = morpherImg.el.naturalWidth || morpherImg.el.width;
            const imgHeight = morpherImg.el.naturalHeight || morpherImg.el.height;

            // Convert normalized points (0-1) to absolute pixel coordinates for this image
            guiImg.points.forEach(point => {
              const absX = point.x * imgWidth;
              const absY = point.y * imgHeight;
              morpherImg.addPoint({ x: absX, y: absY }, { silent: true });
            });
          });

          // Manually add points to mesh (use first image's coordinates)
          const imgWidth = firstImage.el.naturalWidth || firstImage.el.width;
          const imgHeight = firstImage.el.naturalHeight || firstImage.el.height;
          guiImage.points.forEach(point => {
            const absX = point.x * imgWidth;
            const absY = point.y * imgHeight;
            this.morpher.mesh.addPoint({ x: absX, y: absY });
          });
        }

        this.syncMorpherTriangles();
        this.updateMorpherWeights();
      } else if (attempts < 50) {
        setTimeout(checkLoad, 100);
      }
    };
    checkLoad();
  }

  /**
   * Sync points and triangles from project to morpher
   */
  syncMorpherPointsAndTriangles() {
    if (!this.morpher || !this.project) return;

    const firstMorpherImage = this.morpher.images[0];
    const firstGuiImage = this.project.images[0];

    if (!firstMorpherImage || !firstGuiImage) return;

    // Get image dimensions for coordinate conversion
    const imgWidth = firstMorpherImage.el.naturalWidth || firstMorpherImage.el.width;
    const imgHeight = firstMorpherImage.el.naturalHeight || firstMorpherImage.el.height;

    // Check if point counts match
    const needsPointSync = firstMorpherImage.points.length !== firstGuiImage.points.length;

    if (needsPointSync) {
      console.log('🔄 Syncing points:', firstGuiImage.points.length, 'GUI points vs', firstMorpherImage.points.length, 'morpher points');

      // Remove extra points from morpher (from all images)
      while (firstMorpherImage.points.length > firstGuiImage.points.length) {
        const lastPoint = firstMorpherImage.points[firstMorpherImage.points.length - 1];
        firstMorpherImage.removePoint(lastPoint);
      }

      // Add missing points to EACH morpher image from its corresponding GUI image
      // This ensures each image has points at its own specific positions for morphing
      for (let i = firstMorpherImage.points.length; i < firstGuiImage.points.length; i++) {
        // For each morpher image, get the point from the corresponding GUI image
        this.morpher.images.forEach((morpherImg, imgIdx) => {
          const guiImg = this.project.images[imgIdx];
          if (!guiImg || !guiImg.points[i]) return;

          const point = guiImg.points[i];
          const imgW = morpherImg.el.naturalWidth || morpherImg.el.width;
          const imgH = morpherImg.el.naturalHeight || morpherImg.el.height;
          const absX = point.x * imgW;
          const absY = point.y * imgH;

          // Add point to this specific image (silent to prevent intermediate redraws)
          morpherImg.addPoint({ x: absX, y: absY }, { silent: true });
          console.log(`  Image ${imgIdx} point ${i}: GUI(${point.x.toFixed(3)}, ${point.y.toFixed(3)}) -> (${absX.toFixed(1)}, ${absY.toFixed(1)})`);
        });
      }

      // Now add the points to the mesh manually (use first image's coordinates for mesh)
      for (let i = this.morpher.mesh.points.length; i < firstGuiImage.points.length; i++) {
        const point = firstGuiImage.points[i];
        const absX = point.x * imgWidth;
        const absY = point.y * imgHeight;
        this.morpher.mesh.addPoint({ x: absX, y: absY });
      }
    }

    // Sync triangles
    this.syncMorpherTriangles();

    // Redraw with updated points and triangles
    this.morpher.draw();
  }

  /**
   * Sync triangles from project to morpher
   */
  syncMorpherTriangles() {
    if (!this.morpher || !this.project) return;

    console.log(`🔺 Syncing ${this.project.triangles.length} triangles to morpher`);

    // Clear existing triangles from morpher
    while (this.morpher.triangles.length > 0) {
      this.morpher.triangles.pop();
    }

    // Clear triangles from all images
    this.morpher.images.forEach(img => {
      while (img.triangles.length > 0) {
        img.triangles.pop();
      }
    });

    // Add triangles from project
    this.project.triangles.forEach((triangle, idx) => {
      this.morpher.addTriangle(triangle[0], triangle[1], triangle[2]);
    });

    console.log(`  Morpher now has ${this.morpher.triangles.length} triangles`);
  }

  /**
   * Update morpher weights from project
   */
  updateMorpherWeights() {
    if (!this.morpher || !this.project) return;

    const weights = this.project.images.map(img => img.weight);
    this.morpher.set(weights);
    this.morpher.draw();
  }
}

customElements.define('gui-project', GuiProject);

export { GuiProject };
