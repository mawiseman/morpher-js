/**
 * Root Application Component
 *
 * Main entry point for the MorpherJS GUI application.
 * Coordinates the menu bar and main content area.
 *
 * Events:
 * - None (root component)
 */

import { BaseComponent } from './base/BaseComponent.js';
import { projectStore } from '../models/ProjectStore.js';
import './gui-menu-bar.js';
import './gui-main.js';

class GuiApp extends BaseComponent {
  connectedCallback() {
    super.connectedCallback();

    // ProjectStore auto-loads on module import, so no need to load here
  }

  addEventListeners() {
    // Listen to menu bar events
    const menuBar = this.query('gui-menu-bar');
    if (menuBar) {
      this.addTrackedListener(menuBar, 'help-click', () => {
        this.showHelp();
      });
    }
  }

  showHelp() {
    alert(`MorpherJS GUI

A modern image morphing editor built with Web Components.

Features:
- Create multiple morphing projects
- Add images via file upload
- Adjust blend weights
- Edit mesh points (coming soon)
- Export configurations

Controls:
- Click project name to rename
- Use ◀ ▶ to navigate between projects
- Click "New" to create a project
- Click "Delete" to remove current project
- Click "Add Image" to upload images
- Adjust sliders to set blend weights

For more information, visit:
https://github.com/anthropics/morpher-js`);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
          background-color: var(--color-background, #f5f5f5);
        }
      </style>

      <gui-menu-bar></gui-menu-bar>
      <gui-main></gui-main>
    `;

    this.addEventListeners();
  }
}

// Register the custom element
customElements.define('gui-app', GuiApp);

export { GuiApp };
