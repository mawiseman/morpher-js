/**
 * BaseComponent
 *
 * Base class for all Web Components in the MorpherJS GUI.
 * Provides common functionality for lifecycle management, event handling,
 * and Shadow DOM utilities.
 *
 * @example
 * class MyComponent extends BaseComponent {
 *   connectedCallback() {
 *     super.connectedCallback();
 *     // Custom initialization
 *   }
 *
 *   render() {
 *     this.shadowRoot.innerHTML = `
 *       <style>:host { display: block; }</style>
 *       <div>My Component</div>
 *     `;
 *   }
 * }
 *
 * customElements.define('my-component', MyComponent);
 */

export class BaseComponent extends HTMLElement {
  /**
   * Create a new component instance
   * Automatically attaches Shadow DOM with open mode
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._mounted = false;
    this._initialized = false;
    this._trackedListeners = new Map();
  }

  /**
   * Called when the element is inserted into the DOM
   * Override this in subclasses to add custom initialization
   */
  connectedCallback() {
    this._mounted = true;

    if (!this._initialized) {
      this._initialized = true;
      this.render();
      this.addEventListeners();
    }
  }

  /**
   * Called when the element is removed from the DOM
   * Override this in subclasses to add custom cleanup
   */
  disconnectedCallback() {
    this._mounted = false;
    this.removeEventListeners();
  }

  /**
   * Called when an observed attribute changes
   * Override this in subclasses to react to attribute changes
   *
   * @param {string} name - Attribute name
   * @param {string} oldValue - Previous value
   * @param {string} newValue - New value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this._mounted) {
      this.render();
    }
  }

  /**
   * Render the component's DOM
   * Override this in subclasses to define component structure
   *
   * @abstract
   */
  render() {
    // Override in subclasses
  }

  /**
   * Add event listeners
   * Override this in subclasses to set up event handlers
   *
   * @abstract
   */
  addEventListeners() {
    // Override in subclasses
  }

  /**
   * Remove event listeners
   * Override this in subclasses to clean up event handlers
   *
   * @abstract
   */
  removeEventListeners() {
    // Override in subclasses
    this._trackedListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._trackedListeners.clear();
  }

  /**
   * Add a tracked event listener
   * Automatically cleaned up in disconnectedCallback
   *
   * @param {EventTarget} element - Element to attach listener to
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @param {Object} options - addEventListener options
   */
  addTrackedListener(element, event, handler, options) {
    const key = `${Date.now()}_${event}_${Math.random()}`;
    element.addEventListener(event, handler, options);
    this._trackedListeners.set(key, { element, event, handler });
  }

  /**
   * Remove a tracked event listener
   *
   * @param {EventTarget} element - Element to remove listener from
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  removeTrackedListener(element, event, handler) {
    // Find and remove the listener
    for (const [key, value] of this._trackedListeners.entries()) {
      if (value.element === element && value.event === event && value.handler === handler) {
        element.removeEventListener(event, handler);
        this._trackedListeners.delete(key);
        break;
      }
    }
  }

  /**
   * Emit a custom event
   * Events automatically bubble and cross shadow DOM boundaries
   *
   * @param {string} eventName - Name of the event
   * @param {*} detail - Event detail data
   * @param {Object} options - Additional event options
   * @returns {boolean} - false if event was cancelled
   */
  emit(eventName, detail = {}, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: options.bubbles !== false, // Default true
      composed: options.composed !== false, // Default true
      cancelable: options.cancelable || false,
    });

    return this.dispatchEvent(event);
  }

  /**
   * Query a single element in Shadow DOM
   *
   * @param {string} selector - CSS selector
   * @returns {Element|null} - Found element or null
   */
  query(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Query all elements in Shadow DOM
   *
   * @param {string} selector - CSS selector
   * @returns {NodeList} - Found elements
   */
  queryAll(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Check if component is mounted in the DOM
   *
   * @returns {boolean} - true if mounted
   */
  get mounted() {
    return this._mounted;
  }

  /**
   * Set component property and trigger re-render
   * Useful for reactive properties
   *
   * @param {string} name - Property name
   * @param {*} value - Property value
   * @param {boolean} shouldRender - Whether to re-render (default: true)
   */
  setProp(name, value, shouldRender = true) {
    const oldValue = this[`_${name}`];

    if (oldValue !== value) {
      this[`_${name}`] = value;

      if (shouldRender && this._mounted) {
        this.render();
      }
    }
  }

  /**
   * Get component property
   *
   * @param {string} name - Property name
   * @returns {*} - Property value
   */
  getProp(name) {
    return this[`_${name}`];
  }

  /**
   * Create a style element with scoped CSS
   *
   * @param {string} css - CSS string
   * @returns {string} - Style tag with CSS
   */
  createStyle(css) {
    return `<style>${css}</style>`;
  }

  /**
   * Safely escape HTML to prevent XSS
   *
   * @param {string} unsafe - Unsafe string
   * @returns {string} - Escaped string
   */
  escapeHTML(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Request an animation frame update
   * Useful for smooth animations
   *
   * @param {Function} callback - Animation callback
   * @returns {number} - Animation frame ID
   */
  requestUpdate(callback) {
    return requestAnimationFrame(() => {
      if (this._mounted) {
        callback.call(this);
      }
    });
  }

  /**
   * Debounce a function call
   *
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle a function call
   *
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit time in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}
