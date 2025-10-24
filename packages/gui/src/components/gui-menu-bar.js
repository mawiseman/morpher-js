/**
 * Menu Bar Component
 *
 * Fixed top bar displaying:
 * - Help icon (?)
 * - Current project name (editable)
 * - Project controls (New, Delete, Previous, Next)
 * - Additional menu items
 *
 * Events:
 * - help-click - User clicked help icon
 * - project-new - User clicked new project button
 * - project-delete - User clicked delete project button
 * - project-prev - User clicked previous project button
 * - project-next - User clicked next project button
 * - project-rename - User renamed the project (detail: { name })
 */

import { BaseComponent } from './base/BaseComponent.js';
import { projectStore } from '../models/ProjectStore.js';

class GuiMenuBar extends BaseComponent {
  constructor() {
    super();
    this.currentProject = null;
    this.isEditing = false;
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen to project store events
    this.addTrackedListener(projectStore, 'change:current', () => {
      this.updateProject();
    });

    this.addTrackedListener(projectStore, 'add', () => {
      this.updateProject();
    });

    this.addTrackedListener(projectStore, 'remove', () => {
      this.updateProject();
    });

    this.addTrackedListener(projectStore, 'reset', () => {
      this.updateProject();
    });

    // Initial project
    this.updateProject();
  }

  updateProject() {
    const newProject = projectStore.getCurrent();

    if (this.currentProject) {
      // Remove listeners from old project
      this.currentProject.removeEventListener('change:name', this.handleProjectNameChange);
      this.currentProject.removeEventListener('change:color', this.handleProjectColorChange);
    }

    this.currentProject = newProject;

    if (this.currentProject) {
      // Listen to project changes
      this.handleProjectNameChange = () => this.render();
      this.handleProjectColorChange = () => this.render();

      this.currentProject.addEventListener('change:name', this.handleProjectNameChange);
      this.currentProject.addEventListener('change:color', this.handleProjectColorChange);
    }

    this.render();
  }

  addEventListeners() {
    // Help button
    const helpBtn = this.query('.help-btn');
    if (helpBtn) {
      this.addTrackedListener(helpBtn, 'click', () => {
        this.emit('help-click');
      });
    }

    // Project name (editable)
    const projectName = this.query('.project-name');
    if (projectName) {
      this.addTrackedListener(projectName, 'click', () => {
        this.startEditing();
      });

      this.addTrackedListener(projectName, 'blur', () => {
        this.stopEditing();
      });

      this.addTrackedListener(projectName, 'keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          projectName.blur();
        } else if (e.key === 'Escape') {
          projectName.textContent = this.currentProject?.name || 'New Project';
          projectName.blur();
        }
      });
    }

    // New project button
    const newBtn = this.query('.btn-new');
    if (newBtn) {
      this.addTrackedListener(newBtn, 'click', () => {
        this.emit('project-new');
        const project = projectStore.create({ name: 'New Project' });
        projectStore.setCurrentProject(project);
      });
    }

    // Delete project button
    const deleteBtn = this.query('.btn-delete');
    if (deleteBtn) {
      this.addTrackedListener(deleteBtn, 'click', () => {
        if (this.currentProject && projectStore.count() > 1) {
          if (confirm(`Delete project "${this.currentProject.name}"?`)) {
            this.emit('project-delete', { project: this.currentProject });
            projectStore.remove(this.currentProject);
          }
        }
      });
    }

    // Previous project button
    const prevBtn = this.query('.btn-prev');
    if (prevBtn) {
      this.addTrackedListener(prevBtn, 'click', () => {
        this.emit('project-prev');
        projectStore.previous();
      });
    }

    // Next project button
    const nextBtn = this.query('.btn-next');
    if (nextBtn) {
      this.addTrackedListener(nextBtn, 'click', () => {
        this.emit('project-next');
        projectStore.next();
      });
    }
  }

  startEditing() {
    this.isEditing = true;
    const projectName = this.query('.project-name');
    if (projectName) {
      projectName.contentEditable = 'true';
      projectName.focus();

      // Select all text
      const range = document.createRange();
      range.selectNodeContents(projectName);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  stopEditing() {
    this.isEditing = false;
    const projectName = this.query('.project-name');
    if (projectName && this.currentProject) {
      projectName.contentEditable = 'false';
      const newName = projectName.textContent.trim();

      if (newName && newName !== this.currentProject.name) {
        this.currentProject.name = newName;
        this.emit('project-rename', { name: newName });
      } else {
        // Restore original name if empty or unchanged
        projectName.textContent = this.currentProject.name;
      }
    }
  }

  render() {
    const project = this.currentProject;
    const projectName = project?.name || 'New Project';
    const projectColor = project?.color || 'rgb(180, 120, 200)';
    const projectCount = projectStore.count();
    const currentIndex = projectStore.currentIndex + 1;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--menu-bar-height, 60px);
          background-color: ${projectColor};
          color: white;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .menu-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 var(--spacing-md, 16px);
          max-width: 1400px;
          margin: 0 auto;
        }

        .menu-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
        }

        .menu-center {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
          flex: 1;
          justify-content: center;
        }

        .menu-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 8px);
        }

        .help-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast, 150ms ease);
        }

        .help-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .project-name {
          font-size: var(--font-size-lg, 20px);
          font-weight: 600;
          padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
          border-radius: 4px;
          cursor: pointer;
          transition: background var(--transition-fast, 150ms ease);
          user-select: none;
          outline: none;
        }

        .project-name:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .project-name[contenteditable="true"] {
          background: rgba(255, 255, 255, 0.2);
          cursor: text;
          user-select: text;
        }

        .project-counter {
          font-size: var(--font-size-sm, 14px);
          opacity: 0.9;
        }

        .btn {
          padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: var(--font-size-sm, 14px);
          border-radius: 4px;
          cursor: pointer;
          transition: background var(--transition-fast, 150ms ease);
          font-weight: 500;
        }

        .btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          font-family: 'ModernPictograms', sans-serif;
          font-size: 18px;
          padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        }

        .divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
        }
      </style>

      <div class="menu-bar">
        <div class="menu-left">
          <button class="help-btn" title="Help">?</button>
        </div>

        <div class="menu-center">
          <div class="project-name" title="Click to rename">${this.escapeHTML(projectName)}</div>
          <span class="project-counter">(${currentIndex}/${projectCount})</span>
        </div>

        <div class="menu-right">
          <button class="btn btn-new" title="New Project">New</button>
          <button class="btn btn-delete" title="Delete Project" ${projectCount <= 1 ? 'disabled' : ''}>Delete</button>
          <div class="divider"></div>
          <button class="btn btn-icon btn-prev" title="Previous Project">◀</button>
          <button class="btn btn-icon btn-next" title="Next Project">▶</button>
        </div>
      </div>
    `;

    this.addEventListeners();
  }
}

customElements.define('gui-menu-bar', GuiMenuBar);

export { GuiMenuBar };
