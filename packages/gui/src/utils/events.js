/**
 * Event Utility Functions
 *
 * Provides helper functions for working with DOM events and custom events.
 */

/**
 * Create a custom event with detail data
 *
 * @param {string} eventName - Name of the event
 * @param {*} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {CustomEvent} - Custom event instance
 */
export function createEvent(eventName, detail = {}, options = {}) {
  return new CustomEvent(eventName, {
    detail,
    bubbles: options.bubbles !== false,
    composed: options.composed !== false,
    cancelable: options.cancelable || false,
  });
}

/**
 * Dispatch a custom event on an element
 *
 * @param {EventTarget} target - Target element
 * @param {string} eventName - Name of the event
 * @param {*} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {boolean} - false if event was cancelled
 */
export function dispatch(target, eventName, detail = {}, options = {}) {
  const event = createEvent(eventName, detail, options);
  return target.dispatchEvent(event);
}

/**
 * Add an event listener with automatic cleanup
 * Returns a cleanup function to remove the listener
 *
 * @param {EventTarget} target - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - addEventListener options
 * @returns {Function} - Cleanup function
 */
export function on(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * Add a one-time event listener
 *
 * @param {EventTarget} target - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - addEventListener options
 * @returns {Function} - Cleanup function
 */
export function once(target, event, handler, options = {}) {
  return on(target, event, handler, { ...options, once: true });
}

/**
 * Wait for an event to occur (returns a Promise)
 *
 * @param {EventTarget} target - Target element
 * @param {string} event - Event name
 * @param {number} timeout - Optional timeout in milliseconds
 * @returns {Promise} - Promise that resolves with the event
 */
export function waitForEvent(target, event, timeout) {
  return new Promise((resolve, reject) => {
    const cleanup = once(target, event, (e) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve(e);
    });

    let timeoutId;
    if (timeout) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
      }, timeout);
    }
  });
}

/**
 * Debounce an event handler
 * Delays execution until after wait milliseconds have elapsed since last call
 *
 * @param {Function} handler - Event handler
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced handler
 */
export function debounce(handler, wait) {
  let timeout;
  return function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => handler.apply(this, args), wait);
  };
}

/**
 * Throttle an event handler
 * Ensures handler is called at most once per limit milliseconds
 *
 * @param {Function} handler - Event handler
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} - Throttled handler
 */
export function throttle(handler, limit) {
  let inThrottle;
  return function throttled(...args) {
    if (!inThrottle) {
      handler.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Delegate event handling to a parent element
 * Useful for dynamically added elements
 *
 * @param {Element} parent - Parent element
 * @param {string} event - Event name
 * @param {string} selector - CSS selector for target elements
 * @param {Function} handler - Event handler
 * @returns {Function} - Cleanup function
 */
export function delegate(parent, event, selector, handler) {
  const delegatedHandler = (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e);
    }
  };

  return on(parent, event, delegatedHandler);
}

/**
 * Prevent default and stop propagation
 *
 * @param {Event} event - DOM event
 */
export function prevent(event) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Get mouse/touch position relative to an element
 *
 * @param {MouseEvent|TouchEvent} event - Mouse or touch event
 * @param {Element} element - Reference element
 * @returns {{x: number, y: number}} - Relative position
 */
export function getRelativePosition(event, element) {
  const rect = element.getBoundingClientRect();

  // Handle touch events
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Check if event target matches a selector
 *
 * @param {Event} event - DOM event
 * @param {string} selector - CSS selector
 * @returns {boolean} - true if matches
 */
export function matches(event, selector) {
  return event.target.matches(selector);
}

/**
 * Get the closest ancestor matching a selector
 *
 * @param {Event} event - DOM event
 * @param {string} selector - CSS selector
 * @returns {Element|null} - Matching ancestor or null
 */
export function closest(event, selector) {
  return event.target.closest(selector);
}

/**
 * Create an event emitter
 * Simple pub/sub implementation
 *
 * @returns {Object} - Event emitter with on, off, emit methods
 */
export function createEmitter() {
  const events = new Map();

  return {
    on(event, handler) {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event).push(handler);

      return () => this.off(event, handler);
    },

    off(event, handler) {
      if (!events.has(event)) {
        return;
      }

      const handlers = events.get(event);
      const index = handlers.indexOf(handler);

      if (index !== -1) {
        handlers.splice(index, 1);
      }

      if (handlers.length === 0) {
        events.delete(event);
      }
    },

    emit(event, data) {
      if (!events.has(event)) {
        return;
      }

      const handlers = events.get(event);
      for (const handler of handlers) {
        handler(data);
      }
    },

    clear() {
      events.clear();
    },

    has(event) {
      return events.has(event) && events.get(event).length > 0;
    },
  };
}

/**
 * Add keyboard shortcut handler
 *
 * @param {string} keys - Key combination (e.g., 'ctrl+s', 'cmd+shift+p')
 * @param {Function} handler - Handler function
 * @param {Element} target - Target element (default: document)
 * @returns {Function} - Cleanup function
 */
export function onShortcut(keys, handler, target = document) {
  const keysArray = keys.toLowerCase().split('+');
  const modifiers = {
    ctrl: keysArray.includes('ctrl'),
    cmd: keysArray.includes('cmd') || keysArray.includes('meta'),
    shift: keysArray.includes('shift'),
    alt: keysArray.includes('alt'),
  };

  const key = keysArray[keysArray.length - 1];

  const shortcutHandler = (e) => {
    const matchesModifiers =
      (modifiers.ctrl === (e.ctrlKey || false)) &&
      (modifiers.cmd === (e.metaKey || false)) &&
      (modifiers.shift === (e.shiftKey || false)) &&
      (modifiers.alt === (e.altKey || false));

    const matchesKey = e.key.toLowerCase() === key || e.code.toLowerCase() === key.toLowerCase();

    if (matchesModifiers && matchesKey) {
      prevent(e);
      handler(e);
    }
  };

  return on(target, 'keydown', shortcutHandler);
}

// Default export
export default {
  createEvent,
  dispatch,
  on,
  once,
  waitForEvent,
  debounce,
  throttle,
  delegate,
  prevent,
  getRelativePosition,
  matches,
  closest,
  createEmitter,
  onShortcut,
};
