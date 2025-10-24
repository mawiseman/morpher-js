/**
 * BaseComponent - Base class for all Web Components
 * Provides common functionality like templating, event handling, and lifecycle
 */
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this._listeners = new Map();
  }

  /**
   * Called when element is connected to DOM
   */
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Called when element is removed from DOM
   */
  disconnectedCallback() {
    this.cleanup();
  }

  /**
   * Render the component - override in subclasses
   */
  render() {
    const template = this.template();
    if (template) {
      this.innerHTML = template;
    }
  }

  /**
   * Template method - override in subclasses
   * @returns {string} HTML template
   */
  template() {
    return '';
  }

  /**
   * Attach event listeners - override in subclasses
   */
  attachEventListeners() {
    // Override in subclasses
  }

  /**
   * Cleanup - remove event listeners, etc.
   */
  cleanup() {
    // Remove all registered listeners
    this._listeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this._listeners.clear();
  }

  /**
   * Register an event listener for cleanup
   * @param {Element} element
   * @param {string} event
   * @param {Function} handler
   */
  on(element, event, handler) {
    element.addEventListener(event, handler);

    if (!this._listeners.has(element)) {
      this._listeners.set(element, []);
    }
    this._listeners.get(element).push({ event, handler });
  }

  /**
   * Query selector helper
   * @param {string} selector
   * @returns {Element}
   */
  $(selector) {
    return this.querySelector(selector);
  }

  /**
   * Query selector all helper
   * @param {string} selector
   * @returns {NodeList}
   */
  $$(selector) {
    return this.querySelectorAll(selector);
  }

  /**
   * Dispatch a custom event
   * @param {string} eventName
   * @param {*} detail
   */
  emit(eventName, detail = null) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Update attributes
   * @param {Object} attrs
   */
  updateAttributes(attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        this.removeAttribute(key);
      } else {
        this.setAttribute(key, value);
      }
    });
  }

  /**
   * Show element
   */
  show() {
    this.style.display = '';
    this.classList.add('visible');
  }

  /**
   * Hide element
   */
  hide() {
    this.style.display = 'none';
    this.classList.remove('visible');
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
}
