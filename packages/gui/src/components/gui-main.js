/**
 * Main Container Component
 *
 * Scrollable container that displays the current project.
 * Manages the layout of image tiles and add buttons.
 *
 * Events:
 * - None (container only)
 */

import { BaseComponent } from './base/BaseComponent.js';
import { projectStore } from '../models/ProjectStore.js';
import './gui-project.js';

class GuiMain extends BaseComponent {
  constructor() {
    super();
    this.currentProject = null;
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen to project store changes
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
    this.currentProject = projectStore.getCurrent();
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: var(--menu-bar-height, 60px);
          min-height: calc(100vh - var(--menu-bar-height, 60px));
          background-color: var(--color-background, #f5f5f5);
          overflow-y: auto;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-lg, 24px);
        }

        .project-container {
          width: 100%;
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xl, 32px);
          color: var(--color-text-secondary, #666);
        }

        .empty-state h2 {
          font-size: var(--font-size-xl, 24px);
          margin-bottom: var(--spacing-md, 16px);
          color: var(--color-text-primary, #333);
        }

        .empty-state p {
          font-size: var(--font-size-md, 16px);
          margin-bottom: var(--spacing-lg, 24px);
        }
      </style>

      <div class="main-container">
        ${this.currentProject ? `
          <div class="project-container">
            <gui-project project-id="${this.currentProject.id}"></gui-project>
          </div>
        ` : `
          <div class="empty-state">
            <h2>No Project Selected</h2>
            <p>Create a new project to get started.</p>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('gui-main', GuiMain);

export { GuiMain };
