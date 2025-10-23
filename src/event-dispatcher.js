/**
 * EventDispatcher
 *
 * Event system based on Backbone.Events
 * Provides on(), off(), and trigger() methods for event handling
 *
 * @class EventDispatcher
 */
export class EventDispatcher {
  eventSplitter = /\s+/;

  /**
   * Bind one or more space-separated events to a callback function
   * @param {string} events - Space-separated event names
   * @param {Function} callback - Callback function to execute
   * @param {Object} [context] - Context to bind the callback to
   * @returns {EventDispatcher} Returns this for chaining
   */
  on(events, callback, context) {
    if (!callback) return this;

    const eventList = events.split(this.eventSplitter);
    const calls = this._callbacks || (this._callbacks = {});

    let event;
    while ((event = eventList.shift())) {
      const list = calls[event] || (calls[event] = []);
      list.push(callback, context);
    }

    return this;
  }

  /**
   * Remove one or more callbacks
   * @param {string} [events] - Space-separated event names
   * @param {Function} [callback] - Specific callback to remove
   * @param {Object} [context] - Specific context to remove
   * @returns {EventDispatcher} Returns this for chaining
   */
  off(events, callback, context) {
    const calls = this._callbacks;
    if (!calls) return this;

    if (!(events || callback || context)) {
      delete this._callbacks;
      return this;
    }

    const eventList = events ? events.split(this.eventSplitter) : Object.keys(calls);

    let event;
    while ((event = eventList.shift())) {
      const list = calls[event];
      if (!(list && (callback || context))) {
        delete calls[event];
      } else {
        for (let i = list.length - 2; i >= 0; i -= 2) {
          if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
            list.splice(i, 2);
          }
        }
      }
    }

    return this;
  }

  /**
   * Trigger one or more events, firing all bound callbacks
   * @param {string} events - Space-separated event names
   * @param {...*} args - Arguments to pass to callbacks
   * @returns {EventDispatcher} Returns this for chaining
   */
  trigger(events, ...args) {
    const calls = this._callbacks;
    if (!calls) return this;

    const eventList = events.split(this.eventSplitter);

    let event;
    while ((event = eventList.shift())) {
      let all = calls.all;
      let list = calls[event];

      if (list) {
        list = list.slice();
        for (let i = 0; i < list.length; i += 2) {
          list[i].apply(list[i + 1] || this, args);
        }
      }

      if (all) {
        all = all.slice();
        const allArgs = [event].concat(args);
        for (let i = 0; i < all.length; i += 2) {
          all[i].apply(all[i + 1] || this, allArgs);
        }
      }
    }

    return this;
  }
}
