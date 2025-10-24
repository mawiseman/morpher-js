import { BaseComponent } from '../utils/base-component.js';
import './gui-image.js';

/**
 * ProjectView - Individual project view
 */
export class GuiProject extends BaseComponent {
  constructor() {
    super();
    this.project = null;
    this.imageViews = [];
  }

  setProject(project) {
    this.project = project;

    // Listen to project events
    project.addEventListener('image:add', (e) => this.onImageAdd(e.detail));
    project.addEventListener('image:remove', (e) => this.onImageRemove(e.detail));

    this.render();
  }

  template() {
    if (!this.project) return '';

    return `
      <div class="project">
        <div class="project-header">
          <h2>${this.project.name}</h2>
          <div class="project-actions">
            <button data-action="addImage">+ Add Image</button>
            <button data-action="export">Export JSON</button>
            <button data-action="editBlendFunction">Edit Blend Function</button>
            <button data-action="editFinalTouchFunction">Edit Final Touch</button>
          </div>
        </div>
        <div class="images-grid"></div>
        <div class="preview-container">
          <h3>Preview</h3>
          <div class="preview"></div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    // Render existing images
    if (this.project && this.project.images) {
      this.project.images.forEach(image => this.addImageView(image));
    }

    // Attach morpher canvas to preview
    if (this.project && this.project.morpher.canvas) {
      const preview = this.$('.preview');
      if (preview) {
        preview.appendChild(this.project.morpher.canvas);
      }
    }
  }

  attachEventListeners() {
    this.$$('[data-action]').forEach(btn => {
      this.on(btn, 'click', (e) => {
        const action = e.target.dataset.action;
        if (this[action]) {
          this[action]();
        }
      });
    });
  }

  /**
   * Add image to project
   */
  addImage() {
    const image = this.project.addImage();
    // Open file picker
    this.openFileForImage(image);
  }

  /**
   * Open file picker for image
   */
  openFileForImage(image) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        image.setFile(file);
      }
    };
    input.click();
  }

  /**
   * Export project to JSON
   */
  export() {
    const code = this.project.getExportCode();
    const popup = this.showCodePopup(code);
  }

  /**
   * Show code popup
   */
  showCodePopup(code) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content">
        <h3>Export Code</h3>
        <textarea readonly>${code}</textarea>
        <button onclick="this.closest('.popup').remove()">Close</button>
        <button onclick="navigator.clipboard.writeText(this.previousElementSibling.previousElementSibling.value)">Copy</button>
      </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector('textarea').select();
  }

  /**
   * Edit blend function
   */
  editBlendFunction() {
    const currentCode = this.project.blendFunction || `// Custom blend function
// destination: target canvas
// source: source canvas
// weight: blend weight (0-1)

const ctx = destination.getContext('2d');
ctx.globalAlpha = weight;
ctx.globalCompositeOperation = 'lighter';
ctx.drawImage(source, 0, 0);
ctx.globalAlpha = 1.0;
ctx.globalCompositeOperation = 'source-over';`;

    const code = prompt('Edit Blend Function:', currentCode);
    if (code !== null) {
      this.project.blendFunction = code;
      this.project.updateBlendFunction();
      this.project.save();
    }
  }

  /**
   * Edit final touch function
   */
  editFinalTouchFunction() {
    const currentCode = this.project.finalTouchFunction || `// Final touch function
// canvas: the final canvas element

const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

// Example: Apply alpha threshold
for (let i = 3; i < data.length; i += 4) {
  if (data[i] < 10) {
    data[i] = 0;
  }
}

ctx.putImageData(imageData, 0, 0);`;

    const code = prompt('Edit Final Touch Function:', currentCode);
    if (code !== null) {
      this.project.finalTouchFunction = code;
      this.project.updateFinalTouchFunction();
      this.project.save();
    }
  }

  /**
   * Handle image add
   */
  onImageAdd(image) {
    this.addImageView(image);
  }

  /**
   * Handle image remove
   */
  onImageRemove({ image, index }) {
    if (this.imageViews[index]) {
      this.imageViews[index].remove();
      this.imageViews.splice(index, 1);
    }
  }

  /**
   * Add image view
   */
  addImageView(image) {
    const imageView = document.createElement('gui-image');
    imageView.setImage(image, this.project);
    this.imageViews.push(imageView);

    const grid = this.$('.images-grid');
    if (grid) {
      grid.appendChild(imageView);
    }
  }
}

customElements.define('gui-project', GuiProject);
