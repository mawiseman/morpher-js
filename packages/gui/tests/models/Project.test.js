import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Project } from '../../src/models/Project.js';
import { Image } from '../../src/models/Image.js';

describe('Project Model', () => {
  let project;

  beforeEach(() => {
    project = new Project();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up
    if (project) {
      project.dispose();
    }
    localStorage.clear();
  });

  describe('Constructor', () => {
    it('should create instance with default values', () => {
      expect(project).toBeInstanceOf(Project);
      expect(project).toBeInstanceOf(EventTarget);
      expect(project.id).toMatch(/^project_/);
      expect(project.name).toBe('New Project');
      expect(project.color).toBeTruthy(); // Random pastel color
      expect(project.blendFunction).toBe(null);
      expect(project.finalTouchFunction).toBe(null);
      expect(project.images).toEqual([]);
      expect(project.morpher).toBe(null);
    });

    it('should create instance with provided attributes', () => {
      const attrs = {
        id: 'test-project-1',
        name: 'Test Project',
        color: 'rgb(100, 150, 200)',
        blend_function: 'return destination + source * weight;',
        final_touch_function: 'ctx.filter = "blur(2px)";',
      };

      const proj = new Project(attrs);

      expect(proj.id).toBe('test-project-1');
      expect(proj.name).toBe('Test Project');
      expect(proj.color).toBe('rgb(100, 150, 200)');
      expect(proj.blendFunction).toBe('return destination + source * weight;');
      expect(proj.finalTouchFunction).toBe('ctx.filter = "blur(2px)";');
    });

    it('should auto-generate ID and color if not provided', () => {
      const proj1 = new Project();
      const proj2 = new Project();

      expect(proj1.id).toBeTruthy();
      expect(proj2.id).toBeTruthy();
      expect(proj1.id).not.toBe(proj2.id);

      expect(proj1.color).toBeTruthy();
      expect(proj2.color).toBeTruthy();
    });

    it('should initialize images from attributes', () => {
      const attrs = {
        images: [
          { id: 'img1', url: 'test1.jpg' },
          { id: 'img2', url: 'test2.jpg' },
        ],
      };

      const proj = new Project(attrs);

      expect(proj.images.length).toBe(2);
      expect(proj.images[0]).toBeInstanceOf(Image);
      expect(proj.images[0].id).toBe('img1');
      expect(proj.images[1].id).toBe('img2');

      proj.dispose();
    });
  });

  describe('Name getter/setter', () => {
    it('should get name value', () => {
      project._name = 'Test Name';
      expect(project.name).toBe('Test Name');
    });

    it('should set name and fire event', (done) => {
      project.addEventListener('change:name', (e) => {
        expect(e.detail.name).toBe('New Name');
        expect(e.detail.project).toBe(project);
        done();
      });

      project.name = 'New Name';
      expect(project._name).toBe('New Name');
    });

    it('should not fire event if name does not change', () => {
      const handler = vi.fn();
      project.name = 'Test';
      project.addEventListener('change:name', handler);
      project.name = 'Test';

      expect(handler).not.toHaveBeenCalled();
    });

    it('should save to localStorage when name changes', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.name = 'New Name';
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Color getter/setter', () => {
    it('should get color value', () => {
      project._color = 'rgb(255, 0, 0)';
      expect(project.color).toBe('rgb(255, 0, 0)');
    });

    it('should set color and fire event', (done) => {
      project.addEventListener('change:color', (e) => {
        expect(e.detail.color).toBe('rgb(0, 255, 0)');
        expect(e.detail.project).toBe(project);
        done();
      });

      project.color = 'rgb(0, 255, 0)';
      expect(project._color).toBe('rgb(0, 255, 0)');
    });

    it('should not fire event if color does not change', () => {
      const handler = vi.fn();
      project.color = 'red';
      project.addEventListener('change:color', handler);
      project.color = 'red';

      expect(handler).not.toHaveBeenCalled();
    });

    it('should save to localStorage when color changes', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.color = 'blue';
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('addImage()', () => {
    it('should add Image instance', () => {
      const img = new Image({ id: 'img1', url: 'test.jpg' });
      const result = project.addImage(img, { skipSave: true });

      expect(result).toBe(img);
      expect(project.images.length).toBe(1);
      expect(project.images[0]).toBe(img);
    });

    it('should create Image from data object', () => {
      const imgData = { id: 'img1', url: 'test.jpg' };
      const result = project.addImage(imgData, { skipSave: true });

      expect(result).toBeInstanceOf(Image);
      expect(project.images.length).toBe(1);
      expect(project.images[0].id).toBe('img1');
    });

    it('should fire image:add event', (done) => {
      project.addEventListener('image:add', (e) => {
        expect(e.detail.image).toBeInstanceOf(Image);
        expect(e.detail.project).toBe(project);
        done();
      });

      project.addImage({ url: 'test.jpg' }, { skipSave: true });
    });

    it('should listen to image weight changes', () => {
      const handleWeightChangeSpy = vi.spyOn(project, 'handleWeightChange');
      const img = project.addImage({ url: 'test.jpg' }, { skipSave: true });

      img.weight = 0.5;

      expect(handleWeightChangeSpy).toHaveBeenCalledWith(img);
    });

    it('should save to localStorage by default', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.addImage({ url: 'test.jpg' });
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should skip save when skipSave option is true', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.addImage({ url: 'test.jpg' }, { skipSave: true });
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeImage()', () => {
    it('should remove image from project', () => {
      const img = project.addImage({ url: 'test.jpg' }, { skipSave: true });
      expect(project.images.length).toBe(1);

      project.removeImage(img);
      expect(project.images.length).toBe(0);
    });

    it('should fire image:remove event', (done) => {
      const img = project.addImage({ url: 'test.jpg' }, { skipSave: true });

      project.addEventListener('image:remove', (e) => {
        expect(e.detail.image).toBe(img);
        expect(e.detail.index).toBe(0);
        expect(e.detail.project).toBe(project);
        done();
      });

      project.removeImage(img);
    });

    it('should dispose image', () => {
      const img = project.addImage({ url: 'test.jpg' }, { skipSave: true });
      const disposeSpy = vi.spyOn(img, 'dispose');

      project.removeImage(img);
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should save to localStorage', () => {
      const img = project.addImage({ url: 'test.jpg' }, { skipSave: true });
      const saveSpy = vi.spyOn(project, 'save');

      project.removeImage(img);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should not throw if image is not in project', () => {
      const img = new Image();
      expect(() => {
        project.removeImage(img);
      }).not.toThrow();
    });
  });

  describe('addTriangle()', () => {
    it('should delegate to morpher if available', () => {
      const mockMorpher = {
        addTriangle: vi.fn(),
      };
      project.morpher = mockMorpher;

      project.addTriangle(0, 1, 2);
      expect(mockMorpher.addTriangle).toHaveBeenCalledWith(0, 1, 2);
    });

    it('should not throw if morpher is null', () => {
      expect(() => {
        project.addTriangle(0, 1, 2);
      }).not.toThrow();
    });
  });

  describe('updateBlendFunction()', () => {
    it('should validate and set blend function code', () => {
      const code = 'return destination + source * weight;';
      expect(() => {
        project.updateBlendFunction(code);
      }).not.toThrow();

      expect(project.blendFunction).toBe(code);
    });

    it('should throw error for invalid code', () => {
      const invalidCode = 'this is not valid javascript {{{';
      expect(() => {
        project.updateBlendFunction(invalidCode);
      }).toThrow('Invalid blend function');
    });

    it('should save to localStorage', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.updateBlendFunction('return 0;');
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('updateFinalTouchFunction()', () => {
    it('should validate and set final touch function code', () => {
      const code = 'ctx.filter = "blur(5px)";';
      expect(() => {
        project.updateFinalTouchFunction(code);
      }).not.toThrow();

      expect(project.finalTouchFunction).toBe(code);
    });

    it('should throw error for invalid code', () => {
      const invalidCode = 'invalid code @#$%';
      expect(() => {
        project.updateFinalTouchFunction(invalidCode);
      }).toThrow('Invalid final touch function');
    });

    it('should save to localStorage', () => {
      const saveSpy = vi.spyOn(project, 'save');
      project.updateFinalTouchFunction('return;');
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('handleWeightChange()', () => {
    it('should normalize weights when changed image has weight 1', () => {
      const img1 = project.addImage({ url: 'test1.jpg' }, { skipSave: true });
      const img2 = project.addImage({ url: 'test2.jpg' }, { skipSave: true });

      img1.targetWeight = 1;
      project.handleWeightChange(img1);

      expect(img2.weight).toBe(0);
    });

    it('should proportionally distribute remaining weight', () => {
      const img1 = project.addImage({ url: 'test1.jpg' }, { skipSave: true });
      const img2 = project.addImage({ url: 'test2.jpg' }, { skipSave: true });
      const img3 = project.addImage({ url: 'test3.jpg' }, { skipSave: true });

      img2.targetWeight = 0.4;
      img3.targetWeight = 0.2;

      img1.targetWeight = 0.3;
      project.handleWeightChange(img1);

      // Remaining weight: 1 - 0.3 = 0.7
      // Total other weight: 0.4 + 0.2 = 0.6
      // img2 should get: (0.4 / 0.6) * 0.7 ≈ 0.467
      // img3 should get: (0.2 / 0.6) * 0.7 ≈ 0.233

      expect(img2.weight).toBeCloseTo(0.467, 2);
      expect(img3.weight).toBeCloseTo(0.233, 2);
    });

    it('should evenly distribute if other images have no weight', () => {
      const img1 = project.addImage({ url: 'test1.jpg' }, { skipSave: true });
      const img2 = project.addImage({ url: 'test2.jpg' }, { skipSave: true });
      const img3 = project.addImage({ url: 'test3.jpg' }, { skipSave: true });

      img1.targetWeight = 0.4;
      project.handleWeightChange(img1);

      // Remaining weight: 0.6
      // Distributed evenly: 0.6 / 2 = 0.3
      expect(img2.weight).toBeCloseTo(0.3, 5);
      expect(img3.weight).toBeCloseTo(0.3, 5);
    });

    it('should not fail with single image', () => {
      const img1 = project.addImage({ url: 'test1.jpg' }, { skipSave: true });

      expect(() => {
        img1.targetWeight = 1;
        project.handleWeightChange(img1);
      }).not.toThrow();
    });
  });

  describe('toJSON()', () => {
    it('should serialize project to JSON', () => {
      project.id = 'test-proj-1';
      project.name = 'Test Project';
      project.color = 'rgb(100, 200, 150)';
      project.blendFunction = 'test code';
      project.finalTouchFunction = 'final code';
      project.addImage({ id: 'img1', url: 'test.jpg' }, { skipSave: true });

      const json = project.toJSON();

      expect(json.id).toBe('test-proj-1');
      expect(json.name).toBe('Test Project');
      expect(json.color).toBe('rgb(100, 200, 150)');
      expect(json.blend_function).toBe('test code');
      expect(json.final_touch_function).toBe('final code');
      expect(json.images).toHaveLength(1);
      expect(json.images[0].id).toBe('img1');
    });

    it('should exclude image data by default', () => {
      const img = project.addImage({ url: 'test.jpg', file: 'data:base64' }, { skipSave: true });

      const json = project.toJSON();

      expect(json.images[0].file).toBe(null);
    });

    it('should include image data when option is true', () => {
      const img = project.addImage({ url: 'test.jpg', file: 'data:base64' }, { skipSave: true });

      const json = project.toJSON({ includeImageData: true });

      expect(json.images[0].file).toBe('data:base64');
    });
  });

  describe('save()', () => {
    it('should save to localStorage', () => {
      project.id = 'save-test-1';
      project.name = 'Save Test';

      const result = project.save();

      expect(result).toBe(true);

      const saved = localStorage.getItem('project_save-test-1');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved);
      expect(parsed.id).toBe('save-test-1');
      expect(parsed.name).toBe('Save Test');
    });

    it('should return false on error', () => {
      // Create a project that will fail to serialize
      project.id = 'error-test';

      // Mock localStorage to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = project.save();

      expect(result).toBe(false);

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('dispose()', () => {
    it('should dispose all images', () => {
      const img1 = project.addImage({ url: 'test1.jpg' }, { skipSave: true });
      const img2 = project.addImage({ url: 'test2.jpg' }, { skipSave: true });

      const spy1 = vi.spyOn(img1, 'dispose');
      const spy2 = vi.spyOn(img2, 'dispose');

      project.dispose();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(project.images).toEqual([]);
    });

    it('should dispose morpher if available', () => {
      const mockMorpher = {
        dispose: vi.fn(),
      };
      project.morpher = mockMorpher;

      project.dispose();

      expect(mockMorpher.dispose).toHaveBeenCalled();
      expect(project.morpher).toBe(null);
    });

    it('should remove from localStorage', () => {
      project.id = 'dispose-test';
      project.save();

      expect(localStorage.getItem('project_dispose-test')).toBeTruthy();

      project.dispose();

      expect(localStorage.getItem('project_dispose-test')).toBe(null);
    });
  });

  describe('fromJSON()', () => {
    it('should create Project from JSON data', () => {
      const data = {
        id: 'json-proj-1',
        name: 'Loaded Project',
        color: 'rgb(50, 100, 150)',
        blend_function: 'blend code',
        final_touch_function: 'final code',
        images: [
          { id: 'img1', url: 'test1.jpg' },
          { id: 'img2', url: 'test2.jpg' },
        ],
      };

      const proj = Project.fromJSON(data);

      expect(proj).toBeInstanceOf(Project);
      expect(proj.id).toBe('json-proj-1');
      expect(proj.name).toBe('Loaded Project');
      expect(proj.color).toBe('rgb(50, 100, 150)');
      expect(proj.blendFunction).toBe('blend code');
      expect(proj.finalTouchFunction).toBe('final code');
      expect(proj.images).toHaveLength(2);

      proj.dispose();
    });
  });

  describe('Event handling', () => {
    it('should support EventTarget API', () => {
      const handler = vi.fn();

      project.addEventListener('change:name', handler);
      project.name = 'Test';

      expect(handler).toHaveBeenCalled();

      project.removeEventListener('change:name', handler);
      project.name = 'Test 2';

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit morpher:change when morpher changes', (done) => {
      const mockMorpher = new EventTarget();
      mockMorpher.addEventListener = EventTarget.prototype.addEventListener;
      mockMorpher.dispatchEvent = EventTarget.prototype.dispatchEvent;
      mockMorpher.toJSON = () => ({});

      project.morpher = mockMorpher;

      // Re-initialize to set up listener
      project.morpher = null;
      project.initMorpher(function() {
        return mockMorpher;
      });

      project.addEventListener('morpher:change', (e) => {
        expect(e.detail.morpher).toBe(mockMorpher);
        expect(e.detail.project).toBe(project);
        done();
      });

      mockMorpher.dispatchEvent(new Event('change'));
    });
  });
});
