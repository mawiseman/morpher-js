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
    }

    // Load new project
    this.project = projectStore.getById(projectId);

    if (this.project) {
      // Listen to project changes
      this.handleImageChange = () => this.render();
      this.project.addEventListener('image:add', this.handleImageChange);
      this.project.addEventListener('image:remove', this.handleImageChange);
    }

    this.render();
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

    for (const file of files) {
      try {
        const image = this.project.addImage({
          url: file.name,
          targetWeight: 0,
        });

        // Load the file
        await image.setSrc(file);

        this.emit('image-add', { image });
      } catch (error) {
        console.error('Error loading image:', error);
        alert(`Failed to load image: ${file.name}`);
      }
    }

    // Reset input
    event.target.value = '';
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
        }

        .image-preview {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
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
          width: 100%;
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
                  ${image.file ? `
                    <img class="image-preview" src="${image.file}" alt="${this.escapeHTML(image.url)}" />
                  ` : `
                    <div class="canvas-placeholder">Loading...</div>
                  `}
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
  }

  addImageEventListeners() {
    // Weight sliders
    const sliders = this.queryAll('.weight-slider');
    sliders.forEach(slider => {
      this.addTrackedListener(slider, 'input', (e) => {
        const imageId = e.target.dataset.imageId;
        const value = parseFloat(e.target.value);
        const image = this.project.images.find(img => img.id === imageId);

        if (image) {
          image.targetWeight = value;

          // Update display
          const tile = this.query(`[data-image-id="${imageId}"]`);
          if (tile) {
            const valueSpan = tile.querySelector('.weight-value');
            if (valueSpan) {
              valueSpan.textContent = value.toFixed(2);
            }
          }
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
