import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Project } from '../../src/models/Project.js';

// Import ProjectStore but prevent auto-load
const originalWindow = global.window;

describe('ProjectStore', () => {
  let ProjectStore;
  let store;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    // Dynamically import to avoid auto-load
    // We'll manually control loading
    global.window = undefined;
    const module = await import('../../src/models/ProjectStore.js?t=' + Date.now());
    ProjectStore = module.projectStore.constructor;
    global.window = originalWindow;

    // Create fresh instance
    store = new ProjectStore();
  });

  afterEach(() => {
    if (store) {
      store.projects.forEach(p => p.dispose());
      store.projects = [];
    }
    localStorage.clear();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(store).toBeInstanceOf(ProjectStore);
      expect(store).toBeInstanceOf(EventTarget);
      expect(store.projects).toEqual([]);
      expect(store.currentIndex).toBe(0);
    });

    it('should have storage namespace', () => {
      expect(store.storage).toBeDefined();
      expect(typeof store.storage.getItem).toBe('function');
    });
  });

  describe('load()', () => {
    it('should create default project if storage is empty', () => {
      const projects = store.load();

      expect(projects.length).toBe(1);
      expect(projects[0]).toBeInstanceOf(Project);
      expect(projects[0].name).toBe('Default Project');
    });

    it('should load projects from storage', () => {
      // Manually save some projects
      const proj1 = new Project({ id: 'proj1', name: 'Project 1' });
      const proj2 = new Project({ id: 'proj2', name: 'Project 2' });
      proj1.save();
      proj2.save();

      store.storage.setItem('projects_index', ['proj1', 'proj2']);
      store.storage.setItem('current_index', 1);

      const projects = store.load();

      expect(projects.length).toBe(2);
      expect(projects[0].id).toBe('proj1');
      expect(projects[1].id).toBe('proj2');
      expect(store.currentIndex).toBe(1);

      // Cleanup
      proj1.dispose();
      proj2.dispose();
    });

    it('should fire reset event', (done) => {
      store.addEventListener('reset', (e) => {
        expect(e.detail.projects).toBe(store.projects);
        done();
      });

      store.load();
    });

    it('should handle corrupt project data gracefully', () => {
      // Set up invalid data
      store.storage.setItem('projects_index', ['bad-id']);
      store.storage.setItem('project_bad-id', 'not valid json{{{');

      const projects = store.load();

      // Should create default project since loading failed
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Default Project');
    });

    it('should adjust invalid current index', () => {
      const proj1 = new Project({ id: 'proj1', name: 'Project 1' });
      proj1.save();

      store.storage.setItem('projects_index', ['proj1']);
      store.storage.setItem('current_index', 999); // Invalid

      store.load();

      expect(store.currentIndex).toBe(0); // Adjusted
    });
  });

  describe('create()', () => {
    beforeEach(() => {
      store.load(); // Ensure default project exists
    });

    it('should create new project', () => {
      const initialCount = store.projects.length;
      const project = store.create({ name: 'New Project' });

      expect(project).toBeInstanceOf(Project);
      expect(project.name).toBe('New Project');
      expect(store.projects.length).toBe(initialCount + 1);
      expect(store.projects).toContain(project);
    });

    it('should save project to storage', () => {
      const project = store.create({ name: 'Saved Project' });

      const saved = localStorage.getItem(`project_${project.id}`);
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved);
      expect(parsed.name).toBe('Saved Project');
    });

    it('should update projects index', () => {
      const project = store.create({ name: 'Indexed Project' });

      const index = store.storage.getItem('projects_index');
      expect(index).toContain(project.id);
    });

    it('should fire add event', (done) => {
      store.addEventListener('add', (e) => {
        expect(e.detail.project).toBeInstanceOf(Project);
        expect(e.detail.index).toBeGreaterThanOrEqual(0);
        done();
      });

      store.create({ name: 'Event Project' });
    });
  });

  describe('remove()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should remove project', () => {
      const project = store.create({ name: 'To Remove' });
      const initialCount = store.projects.length;

      const result = store.remove(project);

      expect(result).toBe(true);
      expect(store.projects.length).toBe(initialCount - 1);
      expect(store.projects).not.toContain(project);
    });

    it('should dispose project', () => {
      const project = store.create({ name: 'Dispose Test' });
      const disposeSpy = vi.spyOn(project, 'dispose');

      store.remove(project);

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should fire remove event', (done) => {
      const project = store.create({ name: 'Event Remove' });

      store.addEventListener('remove', (e) => {
        expect(e.detail.project).toBe(project);
        expect(typeof e.detail.index).toBe('number');
        done();
      });

      store.remove(project);
    });

    it('should ensure at least one project exists', () => {
      // Remove all projects
      while (store.projects.length > 0) {
        store.remove(store.projects[0]);
      }

      expect(store.projects.length).toBe(1);
      expect(store.projects[0].name).toBe('Default Project');
    });

    it('should adjust current index if needed', () => {
      const proj1 = store.create({ name: 'P1' });
      const proj2 = store.create({ name: 'P2' });

      store.setCurrent(store.projects.length - 1);
      const lastIndex = store.currentIndex;

      store.remove(proj2);

      expect(store.currentIndex).toBeLessThan(lastIndex);
    });

    it('should return false for non-existent project', () => {
      const otherProject = new Project();
      const result = store.remove(otherProject);
      expect(result).toBe(false);
    });
  });

  describe('removeAt()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should remove project by index', () => {
      store.create({ name: 'P1' });
      store.create({ name: 'P2' });

      const initialCount = store.projects.length;
      const result = store.removeAt(1);

      expect(result).toBe(true);
      expect(store.projects.length).toBe(initialCount - 1);
    });

    it('should return false for invalid index', () => {
      expect(store.removeAt(-1)).toBe(false);
      expect(store.removeAt(999)).toBe(false);
    });
  });

  describe('getCurrent()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should return current project', () => {
      const current = store.getCurrent();
      expect(current).toBe(store.projects[store.currentIndex]);
    });

    it('should return null if no projects', () => {
      store.projects = [];
      expect(store.getCurrent()).toBe(null);
    });
  });

  describe('setCurrent()', () => {
    beforeEach(() => {
      store.load();
      store.create({ name: 'P1' });
      store.create({ name: 'P2' });
    });

    it('should set current project by index', () => {
      const result = store.setCurrent(1);

      expect(result).toBe(true);
      expect(store.currentIndex).toBe(1);
    });

    it('should fire change:current event', (done) => {
      store.addEventListener('change:current', (e) => {
        expect(e.detail.index).toBe(2);
        expect(e.detail.oldIndex).toBe(0);
        expect(e.detail.project).toBe(store.projects[2]);
        done();
      });

      store.setCurrent(2);
    });

    it('should save current index to storage', () => {
      store.setCurrent(1);

      const savedIndex = store.storage.getItem('current_index');
      expect(savedIndex).toBe(1);
    });

    it('should return false for invalid index', () => {
      expect(store.setCurrent(-1)).toBe(false);
      expect(store.setCurrent(999)).toBe(false);
      expect(store.currentIndex).toBe(0); // Should not change
    });
  });

  describe('setCurrentProject()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should set current by project instance', () => {
      const project = store.create({ name: 'Target' });
      const index = store.projects.indexOf(project);

      const result = store.setCurrentProject(project);

      expect(result).toBe(true);
      expect(store.currentIndex).toBe(index);
    });

    it('should return false for non-existent project', () => {
      const otherProject = new Project();
      const result = store.setCurrentProject(otherProject);
      expect(result).toBe(false);
    });
  });

  describe('next()', () => {
    beforeEach(() => {
      store.load();
      store.create({ name: 'P1' });
      store.create({ name: 'P2' });
    });

    it('should navigate to next project', () => {
      store.setCurrent(0);
      const project = store.next();

      expect(store.currentIndex).toBe(1);
      expect(project).toBe(store.projects[1]);
    });

    it('should wrap around to first project', () => {
      store.setCurrent(store.projects.length - 1);
      const project = store.next();

      expect(store.currentIndex).toBe(0);
      expect(project).toBe(store.projects[0]);
    });
  });

  describe('previous()', () => {
    beforeEach(() => {
      store.load();
      store.create({ name: 'P1' });
      store.create({ name: 'P2' });
    });

    it('should navigate to previous project', () => {
      store.setCurrent(2);
      const project = store.previous();

      expect(store.currentIndex).toBe(1);
      expect(project).toBe(store.projects[1]);
    });

    it('should wrap around to last project', () => {
      store.setCurrent(0);
      const project = store.previous();

      expect(store.currentIndex).toBe(store.projects.length - 1);
      expect(project).toBe(store.projects[store.projects.length - 1]);
    });
  });

  describe('getAll()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should return all projects', () => {
      const all = store.getAll();
      expect(all).toBe(store.projects);
    });
  });

  describe('getById()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should find project by ID', () => {
      const project = store.create({ name: 'Find Me' });
      const found = store.getById(project.id);

      expect(found).toBe(project);
    });

    it('should return null for non-existent ID', () => {
      const found = store.getById('non-existent-id');
      expect(found).toBe(null);
    });
  });

  describe('getAt()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should get project by index', () => {
      const project = store.getAt(0);
      expect(project).toBe(store.projects[0]);
    });

    it('should return null for invalid index', () => {
      expect(store.getAt(-1)).toBe(null);
      expect(store.getAt(999)).toBe(null);
    });
  });

  describe('count()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should return project count', () => {
      const initialCount = store.count();
      store.create({ name: 'Count Test' });

      expect(store.count()).toBe(initialCount + 1);
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      store.load();
      store.create({ name: 'P1' });
      store.create({ name: 'P2' });
    });

    it('should remove all projects', () => {
      store.clear();

      expect(store.projects.length).toBe(1); // Default project
      expect(store.projects[0].name).toBe('Default Project');
      expect(store.currentIndex).toBe(0);
    });

    it('should clear storage', () => {
      store.clear();

      const keys = store.storage.getKeys();
      const projectKeys = keys.filter(k => k.startsWith('project_'));

      // Only default project should remain
      expect(projectKeys.length).toBe(1);
    });

    it('should fire reset event', (done) => {
      store.addEventListener('reset', (e) => {
        expect(e.detail.projects).toBe(store.projects);
        done();
      });

      store.clear();
    });
  });

  describe('exportAll()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should export all projects', () => {
      const proj1 = store.create({ name: 'Export 1' });
      const proj2 = store.create({ name: 'Export 2' });
      store.setCurrent(1);

      const exported = store.exportAll();

      expect(exported.version).toBe('2.0.0');
      expect(exported.currentIndex).toBe(1);
      expect(exported.projects.length).toBeGreaterThanOrEqual(2);
      expect(exported.projects.some(p => p.name === 'Export 1')).toBe(true);
      expect(exported.projects.some(p => p.name === 'Export 2')).toBe(true);
    });

    it('should exclude image data by default', () => {
      const proj = store.create({ name: 'Export Test' });
      proj.addImage({ url: 'test.jpg', file: 'data:base64' }, { skipSave: true });

      const exported = store.exportAll();
      const exportedProj = exported.projects.find(p => p.id === proj.id);

      expect(exportedProj.images[0].file).toBe(null);
    });

    it('should include image data when option is true', () => {
      const proj = store.create({ name: 'Export Test' });
      proj.addImage({ url: 'test.jpg', file: 'data:base64' }, { skipSave: true });

      const exported = store.exportAll({ includeImageData: true });
      const exportedProj = exported.projects.find(p => p.id === proj.id);

      expect(exportedProj.images[0].file).toBe('data:base64');
    });
  });

  describe('importAll()', () => {
    beforeEach(() => {
      store.load();
    });

    it('should import projects', () => {
      const data = {
        version: '2.0.0',
        currentIndex: 0,
        projects: [
          { id: 'import1', name: 'Imported 1' },
          { id: 'import2', name: 'Imported 2' },
        ],
      };

      store.importAll(data);

      expect(store.projects.length).toBe(2);
      expect(store.projects[0].name).toBe('Imported 1');
      expect(store.projects[1].name).toBe('Imported 2');
    });

    it('should replace existing projects by default', () => {
      store.create({ name: 'Existing' });
      const initialCount = store.projects.length;

      const data = {
        projects: [
          { id: 'new1', name: 'New 1' },
        ],
      };

      store.importAll(data);

      expect(store.projects.length).toBeLessThanOrEqual(initialCount);
      expect(store.projects[0].name).toBe('New 1');
    });

    it('should merge when merge option is true', () => {
      store.create({ name: 'Existing' });
      const initialCount = store.projects.length;

      const data = {
        projects: [
          { id: 'merged', name: 'Merged' },
        ],
      };

      store.importAll(data, { merge: true });

      expect(store.projects.length).toBe(initialCount + 1);
    });

    it('should restore current index', () => {
      const data = {
        currentIndex: 1,
        projects: [
          { id: 'p1', name: 'P1' },
          { id: 'p2', name: 'P2' },
          { id: 'p3', name: 'P3' },
        ],
      };

      store.importAll(data);

      expect(store.currentIndex).toBe(1);
    });

    it('should fire reset event', (done) => {
      const data = {
        projects: [
          { id: 'evt', name: 'Event Test' },
        ],
      };

      store.addEventListener('reset', (e) => {
        expect(e.detail.projects).toBe(store.projects);
        done();
      });

      store.importAll(data);
    });
  });

  describe('Event handling', () => {
    beforeEach(() => {
      store.load();
    });

    it('should support EventTarget API', () => {
      const handler = vi.fn();

      store.addEventListener('add', handler);
      store.create({ name: 'Event Test' });

      expect(handler).toHaveBeenCalled();

      store.removeEventListener('add', handler);
      store.create({ name: 'Event Test 2' });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
