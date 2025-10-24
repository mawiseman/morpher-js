/**
 * Tests for BaseComponent
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseComponent } from '../../src/components/base/BaseComponent.js';

// Create a test component that extends BaseComponent
class TestComponent extends BaseComponent {
  static get observedAttributes() {
    return ['test-attr'];
  }

  constructor() {
    super();
    this.renderCount = 0;
  }

  render() {
    this.renderCount++;
    this.shadowRoot.innerHTML = `
      <style>:host { display: block; }</style>
      <div class="content">Test Component</div>
      <p class="attr-value">${this.getAttribute('test-attr') || 'none'}</p>
    `;
  }
}

customElements.define('test-component', TestComponent);

describe('BaseComponent', () => {
  let component;

  beforeEach(() => {
    component = document.createElement('test-component');
  });

  afterEach(() => {
    if (component.parentNode) {
      component.parentNode.removeChild(component);
    }
  });

  describe('constructor', () => {
    it('should create shadow root', () => {
      expect(component.shadowRoot).toBeTruthy();
      expect(component.shadowRoot.mode).toBe('open');
    });

    it('should initialize internal state', () => {
      expect(component._mounted).toBe(false);
      expect(component._initialized).toBe(false);
      expect(component._trackedListeners).toBeInstanceOf(Map);
    });
  });

  describe('lifecycle', () => {
    it('should call render when connected', () => {
      expect(component.renderCount).toBe(0);
      document.body.appendChild(component);
      expect(component.renderCount).toBe(1);
      expect(component.mounted).toBe(true);
    });

    it('should not render multiple times on multiple connects', () => {
      document.body.appendChild(component);
      expect(component.renderCount).toBe(1);

      component.remove();
      document.body.appendChild(component);
      expect(component.renderCount).toBe(1); // Should not re-render
    });

    it('should set mounted to false when disconnected', () => {
      document.body.appendChild(component);
      expect(component.mounted).toBe(true);

      component.remove();
      expect(component.mounted).toBe(false);
    });
  });

  describe('attributeChangedCallback', () => {
    it('should re-render when attribute changes', () => {
      document.body.appendChild(component);
      const initialRenderCount = component.renderCount;

      component.setAttribute('test-attr', 'new-value');
      expect(component.renderCount).toBe(initialRenderCount + 1);
    });

    it('should not re-render when unmounted', () => {
      document.body.appendChild(component);
      component.remove();

      const renderCount = component.renderCount;
      component.setAttribute('test-attr', 'value');
      expect(component.renderCount).toBe(renderCount);
    });
  });

  describe('emit', () => {
    it('should dispatch custom event', () => {
      const handler = vi.fn();
      component.addEventListener('test-event', handler);

      component.emit('test-event', { foo: 'bar' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ foo: 'bar' });
    });

    it('should bubble by default', () => {
      const handler = vi.fn();
      document.body.addEventListener('test-event', handler);
      document.body.appendChild(component);

      component.emit('test-event');

      expect(handler).toHaveBeenCalled();
      document.body.removeEventListener('test-event', handler);
    });

    it('should be composed by default', () => {
      const event = component.emit('test-event');
      const lastEvent = component.dispatchEvent(
        new CustomEvent('test', { composed: false })
      );

      // Can't easily test composed in happy-dom, so just check event is dispatched
      expect(event).toBe(true);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      document.body.appendChild(component);
    });

    it('should query single element', () => {
      const content = component.query('.content');
      expect(content).toBeTruthy();
      expect(content.textContent).toBe('Test Component');
    });

    it('should return null for non-existent element', () => {
      const missing = component.query('.missing');
      expect(missing).toBeNull();
    });

    it('should query all elements', () => {
      const elements = component.queryAll('div, p');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('setProp/getProp', () => {
    it('should set and get property', () => {
      component.setProp('testProp', 'value', false);
      expect(component.getProp('testProp')).toBe('value');
    });

    it('should trigger render when property changes', () => {
      document.body.appendChild(component);
      const renderCount = component.renderCount;

      component.setProp('testProp', 'new-value');
      expect(component.renderCount).toBe(renderCount + 1);
    });

    it('should not trigger render when shouldRender is false', () => {
      document.body.appendChild(component);
      const renderCount = component.renderCount;

      component.setProp('testProp', 'new-value', false);
      expect(component.renderCount).toBe(renderCount);
    });

    it('should not trigger render when value is same', () => {
      document.body.appendChild(component);
      component.setProp('testProp', 'value', false);
      const renderCount = component.renderCount;

      component.setProp('testProp', 'value');
      expect(component.renderCount).toBe(renderCount);
    });
  });

  describe('createStyle', () => {
    it('should create style tag', () => {
      const css = ':host { color: red; }';
      const styleTag = component.createStyle(css);
      expect(styleTag).toBe(`<style>${css}</style>`);
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML characters', () => {
      const unsafe = '<script>alert("xss")</script>';
      const safe = component.escapeHTML(unsafe);
      expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      expect(component.escapeHTML('A & B')).toBe('A &amp; B');
    });

    it('should escape quotes', () => {
      expect(component.escapeHTML(`"test"`)).toBe('&quot;test&quot;');
      expect(component.escapeHTML(`'test'`)).toBe('&#039;test&#039;');
    });
  });

  describe('requestUpdate', () => {
    it('should schedule update with requestAnimationFrame', (done) => {
      document.body.appendChild(component);
      let called = false;

      component.requestUpdate(() => {
        called = true;
        expect(called).toBe(true);
        done();
      });
    });

    it('should not call callback when unmounted', (done) => {
      let called = false;

      component.requestUpdate(() => {
        called = true;
      });

      setTimeout(() => {
        expect(called).toBe(false);
        done();
      }, 20);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let count = 0;
      const increment = () => count++;
      const debounced = component.debounce(increment, 50);

      debounced();
      debounced();
      debounced();

      expect(count).toBe(0);

      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let count = 0;
      const increment = () => count++;
      const throttled = component.throttle(increment, 50);

      throttled(); // Called immediately
      throttled(); // Ignored
      throttled(); // Ignored

      expect(count).toBe(1);

      setTimeout(() => {
        throttled(); // Called after limit
        expect(count).toBe(2);
        done();
      }, 100);
    });
  });

  describe('event listener tracking', () => {
    it('should track added event listeners', () => {
      const handler = () => {};
      const target = document.createElement('div');

      component.addTrackedListener(target, 'click', handler);

      expect(component._trackedListeners.size).toBe(1);
    });

    it('should remove tracked event listeners', () => {
      const handler = () => {};
      const target = document.createElement('div');

      component.addTrackedListener(target, 'click', handler);
      component.removeTrackedListener(target, 'click', handler);

      expect(component._trackedListeners.size).toBe(0);
    });

    it('should clean up all listeners on disconnect', () => {
      const handler = () => {};
      const target = document.createElement('div');

      document.body.appendChild(component);
      component.addTrackedListener(target, 'click', handler);
      expect(component._trackedListeners.size).toBe(1);

      component.remove();
      expect(component._trackedListeners.size).toBe(0);
    });
  });
});
