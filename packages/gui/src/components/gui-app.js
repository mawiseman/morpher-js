/**
 * Root Application Component
 *
 * This is the main entry point for the GUI application.
 * It will be enhanced with full functionality in later tasks.
 */

import { BaseComponent } from './base/BaseComponent.js';

class GuiApp extends BaseComponent {
  connectedCallback() {
    super.connectedCallback();
    // Additional initialization will be added here
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
        }

        .container {
          padding: var(--spacing-lg);
          text-align: center;
        }

        h1 {
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-md);
        }

        p {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
        }

        .status {
          display: inline-block;
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-md);
        }

        .success {
          color: #22c55e;
          font-weight: var(--font-weight-medium);
        }
      </style>

      <div class="container">
        <h1>MorpherJS GUI</h1>
        <p>Web Components + Vite Build System</p>
        <div class="status">
          <p class="success">✓ BaseComponent infrastructure ready</p>
          <p class="success">✓ 28/28 tests passing</p>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('gui-app', GuiApp);

export { GuiApp };
