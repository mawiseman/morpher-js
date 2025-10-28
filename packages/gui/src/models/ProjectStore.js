/**
 * ProjectStore (Singleton)
 *
 * Central store for managing all projects in the application.
 * Provides:
 * - Project collection management (create, remove, list)
 * - Current project tracking (with next/prev navigation)
 * - localStorage persistence and hydration
 * - Global project events
 *
 * Events:
 * - reset - Fired when projects are loaded from storage
 * - add - Fired when a project is added
 * - remove - Fired when a project is removed
 * - change:current - Fired when current project changes
 */

import { Project } from './Project.js';
import { createNamespace } from '../utils/storage.js';

const STORAGE_NAMESPACE = 'morpher-gui';
const PROJECTS_INDEX_KEY = 'projects_index';
const CURRENT_INDEX_KEY = 'current_index';

/**
 * ProjectStore singleton class
 */
class ProjectStore extends EventTarget {
  constructor() {
    super();

    /**
     * @type {Project[]}
     */
    this.projects = [];

    /**
     * @type {number}
     */
    this.currentIndex = 0;

    /**
     * @type {Object} Namespaced storage helper
     */
    this.storage = createNamespace(STORAGE_NAMESPACE);

    // Auto-load on initialization
    this._autoLoadEnabled = true;
  }

  /**
   * Load all projects from localStorage
   * Creates a default project if none exist
   * @returns {Project[]} Loaded projects
   */
  load() {
    try {
      // Get list of project IDs
      const projectIds = this.storage.getItem(PROJECTS_INDEX_KEY, []);
      console.log('[ProjectStore] Loading projects, found IDs:', projectIds);

      // Load each project
      this.projects = projectIds
        .map(id => {
          try {
            const data = this.storage.getItem(`project_${id}`);
            if (data) {
              console.log(`[ProjectStore] Loaded project ${id}:`, data.name);
              return Project.fromJSON(data);
            }
            return null;
          } catch (e) {
            console.error(`Failed to load project ${id}:`, e);
            return null;
          }
        })
        .filter(Boolean); // Remove null entries

      // Load current index
      this.currentIndex = this.storage.getItem(CURRENT_INDEX_KEY, 0);
      console.log('[ProjectStore] Loaded projects:', this.projects.length, 'current index:', this.currentIndex);

      // Ensure index is valid
      if (this.currentIndex >= this.projects.length) {
        this.currentIndex = Math.max(0, this.projects.length - 1);
      }

      // Create default project if none exist
      if (this.projects.length === 0) {
        console.log('[ProjectStore] No projects found, creating default');
        this.create({ name: 'Default Project' });
      }

      this.dispatchEvent(new CustomEvent('reset', {
        detail: { projects: this.projects }
      }));

      return this.projects;
    } catch (e) {
      console.error('Failed to load projects:', e);
      return [];
    }
  }

  /**
   * Save the projects index to localStorage
   * @private
   */
  _saveIndex() {
    const projectIds = this.projects.map(p => p.id);
    this.storage.setItem(PROJECTS_INDEX_KEY, projectIds);
    this.storage.setItem(CURRENT_INDEX_KEY, this.currentIndex);
  }

  /**
   * Create a new project
   * @param {Object} attrs - Project attributes
   * @returns {Project} Created project
   */
  create(attrs = {}) {
    const project = new Project(attrs);
    this.projects.push(project);

    // Save to storage
    project.save();
    this._saveIndex();

    this.dispatchEvent(new CustomEvent('add', {
      detail: { project, index: this.projects.length - 1 }
    }));

    return project;
  }

  /**
   * Remove a project
   * @param {Project} project - Project to remove
   * @returns {boolean} Success
   */
  remove(project) {
    const index = this.projects.indexOf(project);
    if (index === -1) {
      return false;
    }

    // Dispose and remove
    project.dispose();
    this.projects.splice(index, 1);

    // Adjust current index if needed
    if (this.currentIndex >= this.projects.length) {
      this.currentIndex = Math.max(0, this.projects.length - 1);
    }

    // Ensure at least one project exists
    if (this.projects.length === 0) {
      this.create({ name: 'Default Project' });
    }

    this._saveIndex();

    this.dispatchEvent(new CustomEvent('remove', {
      detail: { project, index }
    }));

    return true;
  }

  /**
   * Remove a project by index
   * @param {number} index - Project index
   * @returns {boolean} Success
   */
  removeAt(index) {
    if (index >= 0 && index < this.projects.length) {
      return this.remove(this.projects[index]);
    }
    return false;
  }

  /**
   * Get the current project
   * @returns {Project|null}
   */
  getCurrent() {
    return this.projects[this.currentIndex] || null;
  }

  /**
   * Set the current project by index
   * @param {number} index - Project index
   * @returns {boolean} Success
   */
  setCurrent(index) {
    if (index >= 0 && index < this.projects.length) {
      const oldIndex = this.currentIndex;
      this.currentIndex = index;

      this._saveIndex();

      this.dispatchEvent(new CustomEvent('change:current', {
        detail: {
          index,
          oldIndex,
          project: this.projects[index]
        }
      }));

      return true;
    }
    return false;
  }

  /**
   * Set the current project by project instance
   * @param {Project} project - Project to set as current
   * @returns {boolean} Success
   */
  setCurrentProject(project) {
    const index = this.projects.indexOf(project);
    if (index !== -1) {
      return this.setCurrent(index);
    }
    return false;
  }

  /**
   * Navigate to the next project
   * Wraps around to first project if at end
   * @returns {Project|null} New current project
   */
  next() {
    const newIndex = (this.currentIndex + 1) % this.projects.length;
    this.setCurrent(newIndex);
    return this.getCurrent();
  }

  /**
   * Navigate to the previous project
   * Wraps around to last project if at beginning
   * @returns {Project|null} New current project
   */
  previous() {
    const newIndex = this.currentIndex - 1;
    const wrapped = newIndex < 0 ? this.projects.length - 1 : newIndex;
    this.setCurrent(wrapped);
    return this.getCurrent();
  }

  /**
   * Get all projects
   * @returns {Project[]}
   */
  getAll() {
    return this.projects;
  }

  /**
   * Get a project by ID
   * @param {string} id - Project ID
   * @returns {Project|null}
   */
  getById(id) {
    return this.projects.find(p => p.id === id) || null;
  }

  /**
   * Get a project by index
   * @param {number} index - Project index
   * @returns {Project|null}
   */
  getAt(index) {
    return this.projects[index] || null;
  }

  /**
   * Get the number of projects
   * @returns {number}
   */
  count() {
    return this.projects.length;
  }

  /**
   * Clear all projects
   * Removes all from storage and creates a new default project
   */
  clear() {
    // Dispose all projects
    this.projects.forEach(project => project.dispose());
    this.projects = [];
    this.currentIndex = 0;

    // Clear storage
    this.storage.clear();

    // Create new default project
    this.create({ name: 'Default Project' });

    this.dispatchEvent(new CustomEvent('reset', {
      detail: { projects: this.projects }
    }));
  }

  /**
   * Export all projects as JSON
   * @param {Object} options - Export options
   * @param {boolean} [options.includeImageData=false] - Include base64 image data
   * @returns {Object}
   */
  exportAll(options = {}) {
    return {
      version: '2.0.0',
      currentIndex: this.currentIndex,
      projects: this.projects.map(p => p.toJSON(options)),
    };
  }

  /**
   * Import projects from JSON
   * @param {Object} data - Exported data
   * @param {Object} options - Import options
   * @param {boolean} [options.merge=false] - Merge with existing projects
   */
  importAll(data, options = {}) {
    if (!options.merge) {
      this.clear();
    }

    if (data.projects && Array.isArray(data.projects)) {
      data.projects.forEach(projectData => {
        const project = Project.fromJSON(projectData);
        this.projects.push(project);
        project.save();
      });

      if (typeof data.currentIndex === 'number') {
        this.currentIndex = Math.min(
          data.currentIndex,
          this.projects.length - 1
        );
      }

      this._saveIndex();

      this.dispatchEvent(new CustomEvent('reset', {
        detail: { projects: this.projects }
      }));
    }
  }
}

// Create and export singleton instance
export const projectStore = new ProjectStore();

// Auto-load projects when module is imported
if (typeof window !== 'undefined') {
  // Load after a microtask to allow event listeners to be registered
  Promise.resolve().then(() => {
    projectStore.load();
  });
}
