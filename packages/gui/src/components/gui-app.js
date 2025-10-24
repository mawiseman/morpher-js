/**
 * Root Application Component
 *
 * This is the main entry point for the GUI application.
 * It will be enhanced with full functionality in later tasks.
 */

class GuiApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
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
      </style>

      <div class="container">
        <h1>MorpherJS GUI</h1>
        <p>Application is initializing...</p>
        <p>Component structure created successfully!</p>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('gui-app', GuiApp);

export { GuiApp };
