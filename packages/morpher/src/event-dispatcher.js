/**
 * EventDispatcher
 *
 * Modern event system based on native EventTarget
 * Provides on(), off(), and trigger() methods for backward compatibility
 * while using native browser events under the hood for better performance
 *
 * Features:
 * - Native EventTarget for optimal performance
 * - Backward compatible on/off/trigger API
 * - Space-separated event names support
 * - Special 'all' event that catches everything
 * - Context binding support
 *
 * @class EventDispatcher
 * @extends EventTarget
 */
export class EventDispatcher extends EventTarget {
  /**
   * Regular expression for splitting space-separated event names
   */
  eventSplitter = /\s+/;

  /**
   * Create a new EventDispatcher
   */
  constructor() {
    super();

    /**
     * Map to track event listeners for proper removal
     * Structure: eventName -> [{ callback, context, wrapper }, ...]
     * @private
     */
    this._eventCallbacks = new Map();
  }

  /**
   * Bind one or more space-separated events to a callback function
   *
   * @param {string} events - Space-separated event names (e.g., "change load" or "change")
   * @param {Function} callback - Callback function to execute
   * @param {Object} [context] - Context to bind the callback to (this value)
   * @returns {EventDispatcher} Returns this for chaining
   *
   * @example
   * dispatcher.on('load', handleLoad);
   * dispatcher.on('change:x change:y', handleMove, this);
   * dispatcher.on('all', handleAnyEvent); // Catches all events
   */
  on(events, callback, context) {
    if (!callback) return this;

    // Split space-separated events
    const eventList = events.split(this.eventSplitter);

    for (const event of eventList) {
      // Create wrapper function that applies context
      const wrapper = (e) => {
        // Extract arguments from CustomEvent detail or use native event
        const args = e.detail && Array.isArray(e.detail.args) ? e.detail.args : [e];
        callback.apply(context || this, args);
      };

      // Store callback info for removal
      if (!this._eventCallbacks.has(event)) {
        this._eventCallbacks.set(event, []);
      }
      this._eventCallbacks.get(event).push({ callback, context, wrapper });

      // Add native event listener
      this.addEventListener(event, wrapper);
    }

    return this;
  }

  /**
   * Remove one or more callbacks
   *
   * If no arguments provided, removes all event listeners
   * If only events provided, removes all listeners for those events
   * If events and callback provided, removes specific callback
   * If all three provided, removes callback with specific context
   *
   * @param {string} [events] - Space-separated event names
   * @param {Function} [callback] - Specific callback to remove
   * @param {Object} [context] - Specific context to remove
   * @returns {EventDispatcher} Returns this for chaining
   *
   * @example
   * dispatcher.off(); // Remove all listeners
   * dispatcher.off('load'); // Remove all 'load' listeners
   * dispatcher.off('load', handleLoad); // Remove specific listener
   * dispatcher.off('load', handleLoad, this); // Remove with context
   */
  off(events, callback, context) {
    // Remove all listeners if no arguments
    if (!(events || callback || context)) {
      // Remove all event listeners
      for (const [event, listeners] of this._eventCallbacks) {
        for (const { wrapper } of listeners) {
          this.removeEventListener(event, wrapper);
        }
      }
      this._eventCallbacks.clear();
      return this;
    }

    // Get list of events to process
    const eventList = events ? events.split(this.eventSplitter) : Array.from(this._eventCallbacks.keys());

    for (const event of eventList) {
      const listeners = this._eventCallbacks.get(event);
      if (!listeners) continue;

      // Remove all listeners for this event if no callback/context specified
      if (!(callback || context)) {
        for (const { wrapper } of listeners) {
          this.removeEventListener(event, wrapper);
        }
        this._eventCallbacks.delete(event);
      } else {
        // Remove specific listeners matching callback/context
        const remaining = [];

        for (const listener of listeners) {
          const callbackMatches = !callback || listener.callback === callback;
          const contextMatches = !context || listener.context === context;

          if (callbackMatches && contextMatches) {
            // Remove this listener
            this.removeEventListener(event, listener.wrapper);
          } else {
            // Keep this listener
            remaining.push(listener);
          }
        }

        if (remaining.length > 0) {
          this._eventCallbacks.set(event, remaining);
        } else {
          this._eventCallbacks.delete(event);
        }
      }
    }

    return this;
  }

  /**
   * Trigger one or more events, firing all bound callbacks
   *
   * Supports space-separated event names
   * Automatically triggers 'all' event listeners for any event
   *
   * @param {string} events - Space-separated event names
   * @param {...*} args - Arguments to pass to callbacks
   * @returns {EventDispatcher} Returns this for chaining
   *
   * @example
   * dispatcher.trigger('load', image, canvas);
   * dispatcher.trigger('change:x change:y', point);
   * dispatcher.trigger('draw'); // No arguments
   */
  trigger(events, ...args) {
    // Split space-separated events
    const eventList = events.split(this.eventSplitter);

    for (const event of eventList) {
      // Create CustomEvent with arguments in detail
      const customEvent = new CustomEvent(event, {
        detail: { args },
        bubbles: false,
        cancelable: false
      });

      // Dispatch the event
      this.dispatchEvent(customEvent);

      // Also trigger 'all' listeners if this isn't already 'all'
      if (event !== 'all' && this._eventCallbacks.has('all')) {
        const allEvent = new CustomEvent('all', {
          detail: { args: [event, ...args] },
          bubbles: false,
          cancelable: false
        });
        this.dispatchEvent(allEvent);
      }
    }

    return this;
  }

  /**
   * Alias for on() - addEventListener compatibility
   * @deprecated Use on() instead
   */
  addEventListener(type, listener, options) {
    // Call parent EventTarget.addEventListener
    return super.addEventListener(type, listener, options);
  }

  /**
   * Alias for off() - removeEventListener compatibility
   * @deprecated Use off() instead
   */
  removeEventListener(type, listener, options) {
    // Call parent EventTarget.removeEventListener
    return super.removeEventListener(type, listener, options);
  }

  /**
   * Alias for trigger() - dispatchEvent compatibility
   * @deprecated Use trigger() instead
   */
  dispatchEvent(event) {
    // Call parent EventTarget.dispatchEvent
    return super.dispatchEvent(event);
  }
}
