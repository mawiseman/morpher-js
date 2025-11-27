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
  // Static stylesheet shared across all instances (Constructable Stylesheet API)
  static styleSheet = new CSSStyleSheet();
  static stylesInitialized = false;

  static get observedAttributes() {
    return ['project-id'];
  }

  constructor() {
    super();

    // Initialize styles once for all instances (performance optimization)
    if (!GuiProject.stylesInitialized) {
      GuiProject.initializeStyles();
      GuiProject.stylesInitialized = true;
    }

    // Adopt the stylesheet into this instance's Shadow DOM
    this.shadowRoot.adoptedStyleSheets = [GuiProject.styleSheet];

    this.project = null;
    this.morpher = null;

    // Load zoom level from localStorage, default to 1.0
    const savedZoom = localStorage.getItem('morpher-zoom-level');
    this.zoomLevel = savedZoom ? parseFloat(savedZoom) : 1.0;
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
        // Force morpher reinit to apply new triangulation
        this.reinitMorpherPreview();
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

    // View/Edit JSON button
    const viewJsonBtn = this.query('.btn-view-json');
    if (viewJsonBtn) {
      this.addTrackedListener(viewJsonBtn, 'click', () => {
        this.showProjectJsonModal();
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
        this.handleZoomChange(Math.min(10, this.zoomLevel + 0.25));
      });
    }

    const zoomOutBtn = this.query('.zoom-out');
    if (zoomOutBtn) {
      this.addTrackedListener(zoomOutBtn, 'click', () => {
        this.handleZoomChange(Math.max(0.25, this.zoomLevel - 0.25));
      });
    }

    const zoomResetBtn = this.query('.zoom-reset');
    if (zoomResetBtn) {
      this.addTrackedListener(zoomResetBtn, 'click', () => {
        this.handleZoomChange(1.0);
      });
    }

    // Synchronized scrolling
    this.setupSyncedScrolling();

    // Drag and drop
    const sourceImagesRow = this.query('.source-images-row');
    if (sourceImagesRow) {
      this.addTrackedListener(sourceImagesRow, 'dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sourceImagesRow.classList.add('drag-over');
      });

      this.addTrackedListener(sourceImagesRow, 'dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sourceImagesRow.classList.remove('drag-over');
      });

      this.addTrackedListener(sourceImagesRow, 'drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sourceImagesRow.classList.remove('drag-over');
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
    if (newZoom !== undefined) {
      this.zoomLevel = newZoom;
      // Save zoom level to localStorage
      localStorage.setItem('morpher-zoom-level', this.zoomLevel.toString());
    }

    // Update zoom value display
    const zoomValue = this.query('.zoom-value');
    if (zoomValue) {
      zoomValue.textContent = `${this.zoomLevel.toFixed(2)}x`;
    }

    // Update slider value
    const zoomSlider = this.query('.zoom-slider');
    if (zoomSlider) {
      zoomSlider.value = this.zoomLevel;
    }

    // Scale canvas CSS dimensions based on zoom
    const canvases = this.queryAll('.image-canvas');
    canvases.forEach(canvas => {
      const container = canvas.parentElement; // .canvas-container
      if (!container) return;

      // Get the natural dimensions from dataset (stored during image load)
      const naturalWidth = parseFloat(canvas.dataset.naturalWidth) || canvas.width;
      const naturalHeight = parseFloat(canvas.dataset.naturalHeight) || canvas.height;

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate size to fit container while maintaining aspect ratio (this is 1x zoom)
      const imgAspect = naturalWidth / naturalHeight;
      const containerAspect = containerWidth / containerHeight;

      let baseFitWidth, baseFitHeight;
      if (imgAspect > containerAspect) {
        // Image is wider - fit to width
        baseFitWidth = containerWidth;
        baseFitHeight = containerWidth / imgAspect;
      } else {
        // Image is taller - fit to height
        baseFitHeight = containerHeight;
        baseFitWidth = containerHeight * imgAspect;
      }

      // Apply zoom multiplier to the fitted size
      canvas.style.width = `${baseFitWidth * this.zoomLevel}px`;
      canvas.style.height = `${baseFitHeight * this.zoomLevel}px`;
    });

    // Redraw canvases after CSS changes are applied
    requestAnimationFrame(() => {
      this.drawCanvases();
    });
  }

  /**
   * Save the scroll position for a specific canvas container
   * @param {string} imageId - The ID of the image
   * @param {HTMLElement} container - The canvas container element
   */
  saveCanvasScrollPosition(imageId, container) {
    const scrollData = {
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop
    };
    localStorage.setItem(`morpher-canvas-scroll-${imageId}`, JSON.stringify(scrollData));
  }

  /**
   * Restore the scroll position for a specific canvas container
   * @param {string} imageId - The ID of the image
   * @param {HTMLElement} container - The canvas container element
   */
  restoreCanvasScrollPosition(imageId, container) {
    const savedData = localStorage.getItem(`morpher-canvas-scroll-${imageId}`);
    if (savedData) {
      try {
        const scrollData = JSON.parse(savedData);
        container.scrollLeft = scrollData.scrollLeft;
        container.scrollTop = scrollData.scrollTop;
      } catch (e) {
        console.error(`Failed to parse scroll data for image ${imageId}:`, e);
      }
    }
  }

  /**
   * Utility: Find an image by its ID
   * @param {string} imageId - The image ID to search for
   * @returns {Object|undefined} The image object or undefined if not found
   */
  findImageById(imageId) {
    if (!this.project) {
      return undefined;
    }
    return this.project.images.find(img => img.id === imageId);
  }

  /**
   * Utility: Update slider background gradient based on percentage
   * @param {HTMLElement} slider - The slider element
   * @param {number} percentage - The percentage value (0-100)
   */
  updateSliderBackground(slider, percentage) {
    slider.style.background = `linear-gradient(to right, var(--color-primary, #007bff) 0%, var(--color-primary, #007bff) ${percentage}%, var(--color-border, #ddd) ${percentage}%, var(--color-border, #ddd) 100%)`;
  }

  /**
   * Utility: Get canvas coordinates and drawing area information
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {MouseEvent} event - The mouse event
   * @returns {Object} Object containing { x, y, offsetX, offsetY, drawWidth, drawHeight, rect }
   */
  getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();

    // Mouse position in CSS pixels
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;

    // Calculate scale factor between canvas buffer and CSS dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Convert to canvas buffer coordinates
    const x = cssX * scaleX;
    const y = cssY * scaleY;

    // Get stored drawing area (in canvas buffer coordinates)
    const offsetX = parseFloat(canvas.dataset.offsetX) || 0;
    const offsetY = parseFloat(canvas.dataset.offsetY) || 0;
    const drawWidth = parseFloat(canvas.dataset.drawWidth) || canvas.width;
    const drawHeight = parseFloat(canvas.dataset.drawHeight) || canvas.height;

    return { x, y, offsetX, offsetY, drawWidth, drawHeight, rect };
  }

  /**
   * Utility: Find nearest point to a given position
   * @param {Array} points - Array of point objects with x, y, id properties
   * @param {number} x - X coordinate to search from
   * @param {number} y - Y coordinate to search from
   * @param {number} offsetX - Canvas offset X
   * @param {number} offsetY - Canvas offset Y
   * @param {number} drawWidth - Canvas drawing width
   * @param {number} drawHeight - Canvas drawing height
   * @param {number} maxDistance - Maximum distance to consider (default: 10 pixels)
   * @returns {Object|null} Object with { pointId, distance } or null if none found
   */
  findNearestPoint(points, x, y, offsetX, offsetY, drawWidth, drawHeight, maxDistance = 10) {
    let nearestPointId = null;
    let nearestDistance = Infinity;

    points.forEach((point) => {
      const pointX = offsetX + point.x * drawWidth;
      const pointY = offsetY + point.y * drawHeight;
      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

      if (distance < maxDistance && distance < nearestDistance) {
        nearestPointId = point.id;
        nearestDistance = distance;
      }
    });

    return nearestPointId !== null ? { pointId: nearestPointId, distance: nearestDistance } : null;
  }

  findNearestMidpoint(midpoints, x, y, offsetX, offsetY, drawWidth, drawHeight, maxDistance = 12) {
    let nearestMidpointId = null;
    let nearestMidpoint = null;
    let nearestDistance = Infinity;

    if (!midpoints || midpoints.length === 0) {
      return null;
    }

    midpoints.forEach((midpoint) => {
      const midpointX = offsetX + midpoint.x * drawWidth;
      const midpointY = offsetY + midpoint.y * drawHeight;
      const distance = Math.sqrt(Math.pow(x - midpointX, 2) + Math.pow(y - midpointY, 2));

      if (distance < maxDistance && distance < nearestDistance) {
        nearestMidpointId = midpoint.id;
        nearestMidpoint = midpoint;
        nearestDistance = distance;
      }
    });

    return nearestMidpointId !== null ? { midpointId: nearestMidpointId, midpoint: nearestMidpoint, distance: nearestDistance } : null;
  }

  /**
   * Generate zoom controls HTML
   * @returns {string} Zoom controls template
   */
  getZoomControlsTemplate() {
    return `
      <div class="zoom-controls">
        <button class="btn-add-images add-image-btn">+ Add Images</button>
        <button class="btn-view-json">View / Edit JSON</button>
        <span class="zoom-label">Zoom:</span>
        <input
          type="range"
          class="zoom-slider"
          min="0.25"
          max="10"
          step="0.25"
          value="${this.zoomLevel}"
        />
        <span class="zoom-value">${this.zoomLevel.toFixed(2)}x</span>
        <div class="zoom-buttons">
          <button class="zoom-button zoom-out">-</button>
          <button class="zoom-button zoom-reset">Reset</button>
          <button class="zoom-button zoom-in">+</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate image tile HTML
   * @param {Object} image - Image object
   * @returns {string} Image tile template
   */
  getImageTileTemplate(image) {
    return `
      <div class="image-tile" data-image-id="${image.id}">
        <div class="canvas-container">
          <canvas
            class="image-canvas"
            data-image-id="${image.id}"
          ></canvas>
        </div>
        <div class="image-controls">
          <div class="weight-control">
            <label class="weight-label">
              <span>Weight:</span>
              <span class="weight-value">${image.targetWeight.toFixed(2)}</span>
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
          <div class="button-row">
            <input
              type="text"
              class="sitecore-id-input"
              placeholder="Sitecore ID"
              value="${image.sitecoreId || ''}"
              data-image-id="${image.id}"
              title="Sitecore ID"
            />
            <button class="btn-delete" data-image-id="${image.id}">Delete Image</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize component styles (called once for all instances)
   * Uses Constructable Stylesheets API for optimal performance
   */
  static initializeStyles() {
    GuiProject.styleSheet.replaceSync(`
        :host {
          display: block;
          width: 100%;
        }

        .project {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Zoom Controls Row */
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
          background: var(--color-surface, #fff);
          border-bottom: 1px solid var(--color-border, #ddd);
          flex-shrink: 0;
        }

        .btn-add-images,
        .btn-view-json {
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: var(--border-radius, 4px);
          font-size: var(--font-size-sm, 14px);
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-add-images:hover,
        .btn-view-json:hover {
          background: var(--color-primary-hover, #0056b3);
        }

        .btn-view-json {
          background: var(--color-secondary, #6c757d);
        }

        .btn-view-json:hover {
          background: var(--color-secondary-hover, #5a6268);
        }

        /* Source Images Row (50vh) */
        .source-images-row {
          height: 50vh;
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          background: var(--color-background, #f5f5f5);
          border-bottom: 2px solid var(--color-border, #ddd);
        }

        .image-tile {
          flex: 0 0 auto;
          min-width: 50vw;
          max-width: 1000px;
          width: 50vw;
          display: flex;
          flex-direction: column;
          background: var(--color-surface, #fff);
          border-right: 1px solid var(--color-border, #ddd);
        }

        .image-tile:last-child {
          border-right: none;
        }

        .canvas-container {
          flex: 1;
          position: relative;
          overflow: auto;
          background: var(--color-background, #f5f5f5);
        }

        .image-canvas {
          display: block;
          cursor: crosshair;
        }

        /* Image Controls (below canvas) */
        .image-controls {
          flex-shrink: 0;
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
          background: var(--color-surface, #fff);
          border-top: 1px solid var(--color-border, #ddd);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
        }

        /* Morph Preview Row (50vh) */
        .morph-preview-row {
          height: 50vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-background, #f5f5f5);
          overflow: hidden;
        }

        .preview-canvas {
          max-width: 100%;
          max-height: 100%;
          display: block;
          background: #000;
        }

        /* Scrollbar styling */
        .source-images-row::-webkit-scrollbar,
        .canvas-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .source-images-row::-webkit-scrollbar-track,
        .canvas-container::-webkit-scrollbar-track {
          background: var(--color-surface, #fff);
        }

        .source-images-row::-webkit-scrollbar-thumb,
        .canvas-container::-webkit-scrollbar-thumb {
          background: var(--color-border, #ddd);
          border-radius: 4px;
        }

        .source-images-row::-webkit-scrollbar-thumb:hover,
        .canvas-container::-webkit-scrollbar-thumb:hover {
          background: var(--color-border-hover, #ccc);
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

        /* Button row container */
        .button-row {
          display: flex;
          gap: 8px;
          width: 100%;
          align-items: center;
        }

        /* Sitecore ID Input */
        .sitecore-id-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          font-family: inherit;
          background: var(--color-surface, #fff);
          color: var(--color-text, #333);
          transition: border-color 0.2s;
        }

        .sitecore-id-input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .sitecore-id-input::placeholder {
          color: var(--color-text-muted, #999);
        }

        /* Delete button */
        .btn-delete {
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

        .btn-delete:hover {
          background: var(--color-danger-hover, #c82333);
        }

        /* JSON Modal */
        .json-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }

        .json-modal.active {
          display: flex;
        }

        .json-modal-content {
          background: var(--color-surface, #fff);
          border-radius: 8px;
          padding: var(--spacing-lg, 24px);
          max-width: 1200px;
          width: 90%;
          height: 75vh;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .json-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md, 16px);
        }

        .json-modal-title {
          font-size: var(--font-size-lg, 18px);
          font-weight: 600;
          color: var(--color-text, #333);
        }

        .json-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--color-text-secondary, #666);
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .json-modal-close:hover {
          color: var(--color-text, #333);
        }

        .json-textarea {
          flex: 1;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 12px;
          padding: var(--spacing-sm, 8px);
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          resize: none;
          margin-bottom: var(--spacing-md, 16px);
        }

        .json-modal-actions {
          display: flex;
          gap: var(--spacing-sm, 8px);
          justify-content: flex-end;
        }

        .json-btn-copy,
        .json-btn-update,
        .json-btn-cancel {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: var(--font-size-sm, 14px);
          cursor: pointer;
          transition: background var(--transition-fast, 150ms ease);
        }

        .json-btn-copy {
          background: var(--color-secondary, #6c757d);
          color: white;
        }

        .json-btn-copy:hover {
          background: #5a6268;
        }

        .json-btn-update {
          background: var(--color-success, #28a745);
          color: white;
        }

        .json-btn-update:hover {
          background: #218838;
        }

        .json-btn-cancel {
          background: var(--color-surface, #fff);
          color: var(--color-text, #333);
          border: 1px solid var(--color-border, #ddd);
        }

        .json-btn-cancel:hover {
          background: var(--color-surface-hover, #f8f9fa);
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
    `);
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

    // Styles are already adopted in constructor - no need to include them here!
    this.shadowRoot.innerHTML = `
      <div class="project">
        ${this.getZoomControlsTemplate()}

        <div class="source-images-row">
          ${images.map(image => this.getImageTileTemplate(image)).join('')}
        </div>

        <div class="morph-preview-row">
          <canvas id="preview-canvas" class="preview-canvas"></canvas>
        </div>

        <input type="file" id="file-input" class="file-input" accept="image/*" multiple />

        <!-- JSON Modal -->
        <div class="json-modal">
          <div class="json-modal-content">
            <div class="json-modal-header">
              <h3 class="json-modal-title">Project JSON Data</h3>
              <button class="json-modal-close">&times;</button>
            </div>
            <textarea class="json-textarea" spellcheck="false"></textarea>
            <div class="json-modal-actions">
              <button class="json-btn-copy">Copy to Clipboard</button>
              <button class="json-btn-update">Update JSON</button>
              <button class="json-btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.addImageEventListeners();
    this.drawCanvases();

    // Initialize morpher and apply zoom after DOM is ready
    requestAnimationFrame(() => {
      this.initMorpher();
      this.handleZoomChange();
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

        // Store natural image dimensions for zoom calculations
        canvas.dataset.naturalWidth = img.naturalWidth;
        canvas.dataset.naturalHeight = img.naturalHeight;

        // Set canvas buffer dimensions
        // When zoomed, use natural dimensions to allow full scrolling
        if (this.zoomLevel !== 1.0) {
          // Use natural dimensions for canvas buffer so we can scroll the full zoomed image
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        } else {
          // Set canvas dimensions to match its rendered size
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

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

    // Draw midpoint markers (gray squares)
    if (image.midpoints && image.midpoints.length > 0) {
      const midpointSize = Math.max(4, Math.min(8, width / 250));
      const hoveredMidpointSize = midpointSize * 1.4;

      image.midpoints.forEach((midpoint) => {
        const x = offsetX + midpoint.x * width;
        const y = offsetY + midpoint.y * height;

        // Highlight if this midpoint is being hovered
        const isHovered = this.hoveredMidpointId !== null && midpoint.id === this.hoveredMidpointId;
        const size = isHovered ? hoveredMidpointSize : midpointSize;

        if (isHovered) {
          // Draw highlighted midpoint (orange)
          ctx.fillStyle = '#ff6b00';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
        } else {
          // Draw normal midpoint (gray)
          ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
        }

        // Draw square
        ctx.beginPath();
        ctx.rect(x - size / 2, y - size / 2, size, size);
        ctx.fill();
        ctx.stroke();
      });
    }

    // Draw points for this specific image (circles on top)
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
    this.addWeightSliderListeners();
    this.addCanvasInteractionListeners();
    this.addSitecoreIdListeners();
    this.addDeleteButtonListeners();
  }

  /**
   * Add event listeners for weight sliders
   */
  addWeightSliderListeners() {
    const sliders = this.queryAll('.weight-slider');
    sliders.forEach(slider => {
      const handleWeightInput = (e) => {
        // Update the model to trigger weight normalization
        const imageId = e.target.dataset.imageId;
        const value = parseFloat(e.target.value);
        const percentage = value * 100;
        const image = this.findImageById(imageId);

        if (!image) {
          return;
        }

        // Update the changed image's targetWeight
        // This will trigger handleWeightChange in Project model
        image.targetWeight = value;

        // Update current slider background gradient
        this.updateSliderBackground(e.target, percentage);

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
              this.updateSliderBackground(otherSlider, otherPercentage);
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
  }

  /**
   * Add event listeners for Sitecore ID inputs
   */
  addSitecoreIdListeners() {
    const inputs = this.queryAll('.sitecore-id-input');
    inputs.forEach(input => {
      this.addTrackedListener(input, 'input', (e) => {
        const imageId = e.target.dataset.imageId;
        const value = e.target.value;
        const image = this.findImageById(imageId);

        if (image) {
          image.sitecoreId = value;
          // Save to localStorage
          this.project.save();
        }
      });
    });
  }

  /**
   * Find which triangle contains a given point using barycentric coordinates
   * @param {number} px - Point X coordinate (normalized 0-1)
   * @param {number} py - Point Y coordinate (normalized 0-1)
   * @param {Image} image - Image to check points against
   * @returns {number|null} Triangle index or null if point is outside all triangles
   */
  findTriangleContainingPoint(px, py, image) {
    for (let i = 0; i < this.project.triangles.length; i++) {
      const [idx1, idx2, idx3] = this.project.triangles[i];
      const p1 = image.points[idx1];
      const p2 = image.points[idx2];
      const p3 = image.points[idx3];

      if (!p1 || !p2 || !p3) continue;

      // Use barycentric coordinates to test if point is inside triangle
      const denominator = ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
      if (Math.abs(denominator) < 0.0001) continue; // Degenerate triangle

      const a = ((p2.y - p3.y) * (px - p3.x) + (p3.x - p2.x) * (py - p3.y)) / denominator;
      const b = ((p3.y - p1.y) * (px - p3.x) + (p1.x - p3.x) * (py - p3.y)) / denominator;
      const c = 1 - a - b;

      // Point is inside triangle if all barycentric coordinates are between 0 and 1
      if (a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1) {
        return i;
      }
    }

    return null;
  }

  /**
   * Split a triangle into 3 smaller triangles by adding an interior point
   * @param {number} triangleIndex - Index of triangle to split
   * @param {number} newPointId - ID of the new interior point
   */
  subdivideTriangle(triangleIndex, newPointId) {
    const triangle = this.project.triangles[triangleIndex];
    const [idx1, idx2, idx3] = triangle;

    // Get the new point's index
    const newPointIndex = this.project.images[0].points.findIndex(p => p.id === newPointId);

    // Remove the old triangle
    this.project.triangles.splice(triangleIndex, 1);

    // Add 3 new triangles connecting the new point to each edge
    this.project.triangles.push([idx1, idx2, newPointIndex]);
    this.project.triangles.push([idx2, idx3, newPointIndex]);
    this.project.triangles.push([idx3, idx1, newPointIndex]);

    // Update midpoints for all images
    this.project.images.forEach(image => {
      image.updateMidpoints(this.project.triangles);
    });

    // Save and redraw
    this.project.save();
    this.drawCanvases();
  }

  /**
   * Create triangles when a midpoint is converted to a corner point
   * Finds all triangles containing the edge and splits them
   * @param {Object} midpoint - The midpoint with point1Id and point2Id
   * @param {number} newPointId - The newly created corner point ID
   */
  createTrianglesForMidpoint(midpoint, newPointId) {
    const { point1Id, point2Id } = midpoint;

    // Find all triangles that contain this edge
    const trianglesToKeep = [];
    const newTriangles = [];

    this.project.triangles.forEach((triangle) => {
      const [idx1, idx2, idx3] = triangle;

      // Get the actual point IDs from indices
      const p1 = this.project.images[0].points[idx1];
      const p2 = this.project.images[0].points[idx2];
      const p3 = this.project.images[0].points[idx3];

      if (!p1 || !p2 || !p3) {
        trianglesToKeep.push(triangle);
        return;
      }

      // Check if this triangle contains the edge
      const hasEdge = (
        (p1.id === point1Id && p2.id === point2Id) ||
        (p2.id === point1Id && p1.id === point2Id) ||
        (p2.id === point1Id && p3.id === point2Id) ||
        (p3.id === point1Id && p2.id === point2Id) ||
        (p3.id === point1Id && p1.id === point2Id) ||
        (p1.id === point1Id && p3.id === point2Id)
      );

      if (hasEdge) {
        // This triangle needs to be split
        // Find the opposite point (the point not on the edge)
        let oppositePoint;
        if (p1.id === point1Id || p1.id === point2Id) {
          if (p2.id === point1Id || p2.id === point2Id) {
            oppositePoint = p3;
          } else {
            oppositePoint = p2;
          }
        } else {
          oppositePoint = p1;
        }

        // Find indices for point1, point2, opposite, and new point
        const point1Index = this.project.images[0].points.findIndex(p => p.id === point1Id);
        const point2Index = this.project.images[0].points.findIndex(p => p.id === point2Id);
        const oppositeIndex = this.project.images[0].points.findIndex(p => p.id === oppositePoint.id);
        const newPointIndex = this.project.images[0].points.findIndex(p => p.id === newPointId);

        // Add two new triangles connecting the new point to the opposite point
        // These replace the old edge (point1-point2) with two new edges (point1-newPoint and newPoint-point2)
        newTriangles.push([point1Index, newPointIndex, oppositeIndex]);
        newTriangles.push([newPointIndex, point2Index, oppositeIndex]);
      } else {
        // Keep this triangle as-is
        trianglesToKeep.push(triangle);
      }
    });

    // Replace triangles array with kept triangles + new triangles
    this.project.triangles = [...trianglesToKeep, ...newTriangles];

    // Update midpoints for all images
    this.project.images.forEach(image => {
      image.updateMidpoints(this.project.triangles);
    });

    // Save and redraw
    this.project.save();
    this.drawCanvases();
  }

  /**
   * Add event listeners for canvas interactions (point adding, dragging, deletion)
   */
  addCanvasInteractionListeners() {
    // Track hovered point ID across all canvases
    this.hoveredPointId = null;
    this.hoveredMidpointId = null;

    const canvases = this.queryAll('.image-canvas');
    canvases.forEach((canvas) => {
      let draggedPointIndex = null;
      let draggedMidpointId = null;
      let isDragging = false;
      let isDraggingMidpoint = false;
      const imageId = canvas.dataset.imageId;

      this.addTrackedListener(canvas, 'mousedown', (e) => {
        // Only handle left-click (button 0)
        if (e.button !== 0) {
          return;
        }

        const image = this.findImageById(imageId);
        if (!image) {
          return;
        }

        const coords = this.getCanvasCoordinates(canvas, e);

        // Check for corner points first (higher priority)
        const nearestPoint = this.findNearestPoint(
          image.points,
          coords.x,
          coords.y,
          coords.offsetX,
          coords.offsetY,
          coords.drawWidth,
          coords.drawHeight
        );

        if (nearestPoint) {
          // Start dragging existing corner point
          draggedPointIndex = nearestPoint.pointId;
          isDragging = true;
          canvas.style.cursor = 'grabbing';
          return;
        }

        // Check for midpoints (lower priority)
        const nearestMidpoint = this.findNearestMidpoint(
          image.midpoints,
          coords.x,
          coords.y,
          coords.offsetX,
          coords.offsetY,
          coords.drawWidth,
          coords.drawHeight
        );

        if (nearestMidpoint) {
          // Convert midpoint to a real corner point and start dragging
          const midpoint = nearestMidpoint.midpoint;

          // Add the new point at the midpoint position to all images
          let newPointId = null;
          const currentImage = this.findImageById(imageId);

          this.project.images.forEach((img) => {
            // Find the corresponding midpoint on this image (by edge)
            const mp = img.midpoints.find(m =>
              (m.point1Id === midpoint.point1Id && m.point2Id === midpoint.point2Id) ||
              (m.point1Id === midpoint.point2Id && m.point2Id === midpoint.point1Id)
            );

            const x = mp ? mp.x : midpoint.x;
            const y = mp ? mp.y : midpoint.y;

            if (img === currentImage) {
              newPointId = img.addPoint(x, y);
            } else {
              img.addPoint(x, y, newPointId);
            }
          });

          // Find the opposite point and create new triangles
          this.createTrianglesForMidpoint(midpoint, newPointId);

          // Start dragging the newly created point
          draggedPointIndex = newPointId;
          isDragging = true;
          canvas.style.cursor = 'grabbing';
        }
      });

      this.addTrackedListener(canvas, 'mousemove', (e) => {
        const image = this.findImageById(imageId);
        if (!image) {
          return;
        }

        const coords = this.getCanvasCoordinates(canvas, e);

        if (isDragging && draggedPointIndex !== null) {
          // Update point position while dragging on this specific image
          // Convert mouse position to normalized coordinates (0-1) relative to image area
          const normalizedX = Math.max(0, Math.min(1, (coords.x - coords.offsetX) / coords.drawWidth));
          const normalizedY = Math.max(0, Math.min(1, (coords.y - coords.offsetY) / coords.drawHeight));
          image.updatePoint(draggedPointIndex, normalizedX, normalizedY);
        } else {
          // Update cursor and hover highlighting when over points or midpoints
          const nearestPoint = this.findNearestPoint(
            image.points,
            coords.x,
            coords.y,
            coords.offsetX,
            coords.offsetY,
            coords.drawWidth,
            coords.drawHeight
          );

          const nearestMidpoint = this.findNearestMidpoint(
            image.midpoints,
            coords.x,
            coords.y,
            coords.offsetX,
            coords.offsetY,
            coords.drawWidth,
            coords.drawHeight
          );

          const hoveredPointId = nearestPoint ? nearestPoint.pointId : null;
          const hoveredMidpointId = nearestMidpoint ? nearestMidpoint.midpointId : null;

          // Update global hovered IDs if changed
          let needsRedraw = false;

          if (this.hoveredPointId !== hoveredPointId) {
            this.hoveredPointId = hoveredPointId;
            needsRedraw = true;
          }

          if (this.hoveredMidpointId !== hoveredMidpointId) {
            this.hoveredMidpointId = hoveredMidpointId;
            needsRedraw = true;
          }

          if (needsRedraw) {
            this.drawCanvases(); // Redraw all canvases to show highlight
          }

          // Update cursor: prioritize points over midpoints
          if (nearestPoint) {
            canvas.style.cursor = 'grab';
          } else if (nearestMidpoint) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = 'crosshair';
          }
        }
      });

      this.addTrackedListener(canvas, 'mouseup', (e) => {
        // Only handle left-click (button 0)
        if (e.button !== 0) {
          return;
        }

        if (isDragging) {
          // Finished dragging
          isDragging = false;
          draggedPointIndex = null;
          canvas.style.cursor = 'crosshair';
          // Note: midpoints are automatically updated by the points:change event handler in Project.js
        } else {
          // Click without drag - add new point
          const coords = this.getCanvasCoordinates(canvas, e);
          const normalizedX = (coords.x - coords.offsetX) / coords.drawWidth;
          const normalizedY = (coords.y - coords.offsetY) / coords.drawHeight;

          const currentImage = this.findImageById(imageId);
          if (!currentImage) return;

          // If we have less than 3 points, just add the point
          if (currentImage.points.length < 3) {
            let pointId = null;
            this.project.images.forEach((img) => {
              if (img === currentImage) {
                pointId = img.addPoint(normalizedX, normalizedY);
              } else {
                img.addPoint(normalizedX, normalizedY, pointId);
              }
            });
          } else if (this.project.triangles.length > 0) {
            // If we have triangles, find which triangle contains this point and split it
            const triangleIndex = this.findTriangleContainingPoint(normalizedX, normalizedY, currentImage);

            // Add the point to all images first
            let pointId = null;
            this.project.images.forEach((img) => {
              if (img === currentImage) {
                pointId = img.addPoint(normalizedX, normalizedY);
              } else {
                img.addPoint(normalizedX, normalizedY, pointId);
              }
            });

            if (triangleIndex !== null) {
              // Point is inside a triangle - split it into 3 new triangles
              this.subdivideTriangle(triangleIndex, pointId);
            } else {
              // Point is outside all triangles - retriangulate to incorporate it
              this.project.autoTriangulate();
            }
          }
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

        const image = this.findImageById(imageId);
        if (!image) {
          return;
        }

        const coords = this.getCanvasCoordinates(canvas, e);
        const nearest = this.findNearestPoint(
          image.points,
          coords.x,
          coords.y,
          coords.offsetX,
          coords.offsetY,
          coords.drawWidth,
          coords.drawHeight
        );

        if (nearest) {
          // Delete point from ALL images using the point ID
          this.project.images.forEach((img) => {
            const pointIndex = img.points.findIndex(p => p.id === nearest.pointId);
            if (pointIndex !== -1) {
              img.points.splice(pointIndex, 1);
            }
          });

          // Now trigger triangulation and save once
          this.project.autoTriangulate();
          this.project.save();

          // Trigger re-render and reinit morpher preview
          this.drawCanvases();
          this.reinitMorpherPreview();
        }
      });

      // Track scroll position for this canvas container
      const canvasContainer = canvas.parentElement; // .canvas-container
      if (canvasContainer) {
        this.addTrackedListener(canvasContainer, 'scroll', () => {
          this.saveCanvasScrollPosition(imageId, canvasContainer);
        });

        // Restore scroll position after DOM is painted
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.restoreCanvasScrollPosition(imageId, canvasContainer);
          });
        });
      }
    });
  }

  /**
   * Show the JSON modal for the entire project
   */
  showProjectJsonModal() {
    const modal = this.query('.json-modal');
    const textarea = this.query('.json-textarea');
    const copyBtn = this.query('.json-btn-copy');
    const updateBtn = this.query('.json-btn-update');
    const cancelBtn = this.query('.json-btn-cancel');
    const closeBtn = this.query('.json-modal-close');

    // Get project data as JSON (using toJSON method)
    const projectData = this.project.toJSON();

    // Display formatted JSON
    textarea.value = JSON.stringify(projectData, null, 2);

    // Clear any image-specific data
    delete modal.dataset.currentImageId;

    // Show modal
    modal.classList.add('active');

    // Copy button
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        textarea.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
      }
    };

    // Update button
    const handleUpdate = () => {
      try {
        const updatedData = JSON.parse(textarea.value);

        // Validate project structure
        if (!updatedData.images || !Array.isArray(updatedData.images)) {
          alert('Invalid JSON: images array is required');
          return;
        }

        // Update the project using fromJSON
        this.project.fromJSON(updatedData);
        this.project.save();

        // Redraw everything
        this.render();

        // Close modal
        modal.classList.remove('active');
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    };

    // Cancel/Close handlers
    const handleClose = () => {
      modal.classList.remove('active');
    };

    // Add one-time event listeners
    copyBtn.addEventListener('click', handleCopy, { once: true });
    updateBtn.addEventListener('click', handleUpdate, { once: true });
    cancelBtn.addEventListener('click', handleClose, { once: true });
    closeBtn.addEventListener('click', handleClose, { once: true });

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleClose();
      }
    };
    modal.addEventListener('click', handleBackgroundClick, { once: true });
  }

  /**
   * Add event listeners for delete buttons
   */
  addDeleteButtonListeners() {
    const deleteButtons = this.queryAll('.btn-delete');
    deleteButtons.forEach(btn => {
      this.addTrackedListener(btn, 'click', (e) => {
        const imageId = e.target.dataset.imageId;
        const image = this.findImageById(imageId);

        if (image && confirm(`Delete image "${image.url}"?`)) {
          this.project.removeImage(image);
        }
      });
    });
  }

  /**
   * Force reinitialize the morpher preview (used when points/triangles change)
   */
  reinitMorpherPreview() {
    // Dispose existing morpher to force full reinit
    if (this.morpher) {
      this.morpher.dispose();
      this.morpher = null;
    }

    // Reinitialize from scratch
    this.initMorpher();
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

    // Size the preview canvas to fill its container
    const previewContainer = previewCanvas.parentElement;
    if (previewContainer) {
      const containerRect = previewContainer.getBoundingClientRect();
      previewCanvas.width = containerRect.width;
      previewCanvas.height = containerRect.height;
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
        // Morpher draw complete
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

    // Update positions of existing points in all morpher images
    // This is critical for dragging to work correctly
    this.morpher.images.forEach((morpherImg, imgIdx) => {
      const guiImg = this.project.images[imgIdx];
      if (!guiImg) return;

      const imgW = morpherImg.el.naturalWidth || morpherImg.el.width;
      const imgH = morpherImg.el.naturalHeight || morpherImg.el.height;

      // Update each point's position
      for (let i = 0; i < Math.min(morpherImg.points.length, guiImg.points.length); i++) {
        const guiPoint = guiImg.points[i];
        const morpherPoint = morpherImg.points[i];

        // Convert from normalized (0-1) to absolute pixel coordinates
        const absX = guiPoint.x * imgW;
        const absY = guiPoint.y * imgH;

        // Update morpher point position
        morpherPoint.x = absX;
        morpherPoint.y = absY;
      }
    });

    // Also update mesh points (use first image's coordinates)
    for (let i = 0; i < Math.min(this.morpher.mesh.points.length, firstGuiImage.points.length); i++) {
      const guiPoint = firstGuiImage.points[i];
      const meshPoint = this.morpher.mesh.points[i];

      const absX = guiPoint.x * imgWidth;
      const absY = guiPoint.y * imgHeight;

      meshPoint.x = absX;
      meshPoint.y = absY;
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
