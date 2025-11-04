import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Image } from '../../src/models/Image.js';

describe('Image Model', () => {
  let image;

  beforeEach(() => {
    image = new Image();
  });

  describe('Constructor', () => {
    it('should create instance with default values', () => {
      expect(image).toBeInstanceOf(Image);
      expect(image).toBeInstanceOf(EventTarget);
      expect(image.id).toMatch(/^image_/);
      expect(image.url).toBe('');
      expect(image.file).toBe(null);
      expect(image.targetWeight).toBe(0);
      expect(image.weight).toBe(0);
      expect(image.x).toBe(0);
      expect(image.y).toBe(0);
    });

    it('should create instance with provided attributes', () => {
      const attrs = {
        id: 'test-image-1',
        url: 'https://example.com/image.jpg',
        file: 'data:image/png;base64,abc123',
        targetWeight: 0.5,
        weight: 0.4,
        x: 10,
        y: 20,
      };

      const img = new Image(attrs);

      expect(img.id).toBe('test-image-1');
      expect(img.url).toBe('https://example.com/image.jpg');
      expect(img.file).toBe('data:image/png;base64,abc123');
      expect(img.targetWeight).toBe(0.5);
      expect(img.weight).toBe(0.4);
      expect(img.x).toBe(10);
      expect(img.y).toBe(20);
    });

    it('should auto-generate ID if not provided', () => {
      const img1 = new Image();
      const img2 = new Image();

      expect(img1.id).toBeTruthy();
      expect(img2.id).toBeTruthy();
      expect(img1.id).not.toBe(img2.id);
    });
  });

  describe('File getter/setter', () => {
    it('should get file value', () => {
      image._file = 'data:image/png;base64,test';
      expect(image.file).toBe('data:image/png;base64,test');
    });

    it('should set file value', () => {
      image.file = 'data:image/png;base64,new';
      expect(image._file).toBe('data:image/png;base64,new');
    });

    it('should fire change:src event when file changes', (done) => {
      image.addEventListener('change:src', (e) => {
        expect(e.detail.file).toBe('data:image/png;base64,test');
        expect(e.detail.image).toBe(image);
        done();
      });

      image.file = 'data:image/png;base64,test';
    });

    it('should not fire event if file value does not change', () => {
      const handler = vi.fn();
      image.file = 'test';
      image.addEventListener('change:src', handler);
      image.file = 'test';

      expect(handler).not.toHaveBeenCalled();
    });

    it('should update morpherImage if available', () => {
      const mockMorpherImage = {
        setSrc: vi.fn(),
      };
      image.morpherImage = mockMorpherImage;

      image.file = 'data:image/png;base64,test';

      expect(mockMorpherImage.setSrc).toHaveBeenCalledWith('data:image/png;base64,test');
    });
  });

  describe('TargetWeight getter/setter', () => {
    it('should get targetWeight value', () => {
      image._targetWeight = 0.7;
      expect(image.targetWeight).toBe(0.7);
    });

    it('should set targetWeight and weight', () => {
      image.targetWeight = 0.5;
      expect(image._targetWeight).toBe(0.5);
      expect(image._weight).toBe(0.5);
    });

    it('should parse string values to float', () => {
      image.targetWeight = '0.75';
      expect(image.targetWeight).toBe(0.75);
      expect(image.weight).toBe(0.75);
    });

    it('should not update if value is the same', () => {
      image._targetWeight = 0.5;
      image._weight = 0.5;

      const handler = vi.fn();
      image.addEventListener('change:weight', handler);

      image.targetWeight = 0.5;

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Weight getter/setter', () => {
    it('should get weight value', () => {
      image._weight = 0.6;
      expect(image.weight).toBe(0.6);
    });

    it('should set weight value', () => {
      image.weight = 0.8;
      expect(image._weight).toBe(0.8);
    });

    it('should fire change:weight event', (done) => {
      image.addEventListener('change:weight', (e) => {
        expect(e.detail.weight).toBe(0.3);
        expect(e.detail.image).toBe(image);
        done();
      });

      image.weight = 0.3;
    });

    it('should update morpherImage if available', () => {
      const mockMorpherImage = {
        setWeight: vi.fn(),
      };
      image.morpherImage = mockMorpherImage;

      image.weight = 0.75;

      expect(mockMorpherImage.setWeight).toHaveBeenCalledWith(0.75);
    });

    it('should parse string values to float', () => {
      image.weight = '0.25';
      expect(image.weight).toBe(0.25);
    });

    it('should not fire event if value does not change', () => {
      const handler = vi.fn();
      image.weight = 0.5;
      image.addEventListener('change:weight', handler);
      image.weight = 0.5;

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('setUrl()', () => {
    it('should set URL and fire event', (done) => {
      image.addEventListener('change:url', (e) => {
        expect(e.detail.url).toBe('https://example.com/test.jpg');
        expect(e.detail.image).toBe(image);
        done();
      });

      image.setUrl('https://example.com/test.jpg');
      expect(image.url).toBe('https://example.com/test.jpg');
    });

    it('should not fire event if URL does not change', () => {
      const handler = vi.fn();
      image.url = 'test.jpg';
      image.addEventListener('change:url', handler);
      image.setUrl('test.jpg');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('addPoint()', () => {
    it('should delegate to morpherImage', () => {
      const mockMorpherImage = {
        addPoint: vi.fn(),
      };
      image.morpherImage = mockMorpherImage;

      image.addPoint(100, 200);

      expect(mockMorpherImage.addPoint).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should not throw if morpherImage is null', () => {
      expect(() => {
        image.addPoint(50, 50);
      }).not.toThrow();
    });
  });

  describe('splitEdge()', () => {
    it('should delegate to morpherImage', () => {
      const mockMorpherImage = {
        splitEdge: vi.fn(),
      };
      image.morpherImage = mockMorpherImage;

      const p1 = { x: 0, y: 0 };
      const p2 = { x: 100, y: 100 };
      image.splitEdge(p1, p2);

      expect(mockMorpherImage.splitEdge).toHaveBeenCalledWith(p1, p2);
    });

    it('should not throw if morpherImage is null', () => {
      expect(() => {
        image.splitEdge({ x: 0, y: 0 }, { x: 100, y: 100 });
      }).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should dispose morpherImage if available', () => {
      const mockMorpherImage = {
        dispose: vi.fn(),
      };
      image.morpherImage = mockMorpherImage;

      image.dispose();

      expect(mockMorpherImage.dispose).toHaveBeenCalled();
      expect(image.morpherImage).toBe(null);
    });

    it('should not throw if morpherImage is null', () => {
      expect(() => {
        image.dispose();
      }).not.toThrow();
    });

    it('should not throw if morpherImage has no dispose method', () => {
      image.morpherImage = {};
      expect(() => {
        image.dispose();
      }).not.toThrow();
    });
  });

  describe('toJSON()', () => {
    it('should serialize to JSON with src property', () => {
      image.id = 'test-img-1';
      image.url = 'test.jpg';
      image._file = 'data:image/png;base64,abc';
      image._targetWeight = 0.5;
      image._weight = 0.4;
      image.x = 10;
      image.y = 20;
      image.width = 100;
      image.height = 200;

      const json = image.toJSON();

      expect(json.id).toBe('test-img-1');
      expect(json.src).toBe('test.jpg');
      expect(json.file).toBe('data:image/png;base64,abc');
      expect(json.targetWeight).toBe(0.5);
      expect(json.weight).toBe(0.4);
      expect(json.x).toBe(10);
      expect(json.y).toBe(20);
      expect(json.width).toBe(100);
      expect(json.height).toBe(200);
      // Ensure 'url' property doesn't exist
      expect(json.url).toBeUndefined();
    });
  });

  describe('fromJSON()', () => {
    it('should create Image from JSON data with src property', () => {
      const data = {
        id: 'json-img-1',
        src: 'loaded.jpg',
        file: 'data:image/png;base64,xyz',
        targetWeight: 0.75,
        weight: 0.7,
        x: 5,
        y: 15,
      };

      const img = Image.fromJSON(data);

      expect(img).toBeInstanceOf(Image);
      expect(img.id).toBe('json-img-1');
      expect(img.url).toBe('loaded.jpg');
      expect(img.file).toBe('data:image/png;base64,xyz');
      expect(img.targetWeight).toBe(0.75);
      expect(img.weight).toBe(0.7);
      expect(img.x).toBe(5);
      expect(img.y).toBe(15);
    });

    it('should handle legacy url property for backward compatibility', () => {
      const data = {
        id: 'json-img-2',
        url: 'legacy.jpg',
        file: 'data:image/png;base64,xyz',
        targetWeight: 0.5,
        weight: 0.5,
      };

      const img = Image.fromJSON(data);

      expect(img).toBeInstanceOf(Image);
      expect(img.id).toBe('json-img-2');
      expect(img.url).toBe('legacy.jpg');
    });

    it('should prefer src over url if both are present', () => {
      const data = {
        id: 'json-img-3',
        src: 'new-source.jpg',
        url: 'old-source.jpg',
        file: 'data:image/png;base64,xyz',
      };

      const img = Image.fromJSON(data);

      expect(img).toBeInstanceOf(Image);
      expect(img.url).toBe('new-source.jpg');
    });
  });

  describe('Event handling', () => {
    it('should support EventTarget API', () => {
      const handler = vi.fn();

      image.addEventListener('change:weight', handler);
      image.weight = 0.5;

      expect(handler).toHaveBeenCalled();

      image.removeEventListener('change:weight', handler);
      image.weight = 0.6;

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit bubbling events', () => {
      const handler = vi.fn();
      image.addEventListener('change:weight', handler);

      image.weight = 0.5;

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.bubbles).toBe(true);
    });
  });
});
