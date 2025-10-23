import { useState, useEffect, useCallback, useRef } from 'react';
import { Morpher, Image as MorpherImage } from '../../index.js';
import { LocalStorageManager, generateRandomColor } from '../utils/storage.js';

const projectsStorage = new LocalStorageManager('Projects');

/**
 * Hook for managing projects
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const projectsRef = useRef(projects);

  // Keep ref in sync with state
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const loadedProjects = projectsStorage.findAll().map(data => {
      const project = createProject(data);
      // Load images for this project
      const imagesStorage = new LocalStorageManager(`Images${data.id}`);
      const imageData = imagesStorage.findAll();

      project.images = imageData.map(imgData => createImage(imgData, project.morpher));

      // Restore morpher state
      if (data.morpher) {
        project.morpher.fromJSON(data.morpher, { hard: false, silent: true });
      }

      // Restore blend function if it exists and is valid
      if (data.blend_function && typeof data.blend_function === 'string' &&
          data.blend_function !== 'null' && data.blend_function !== 'undefined') {
        try {
          const fn = new Function('destination', 'source', 'weight', data.blend_function);
          project.morpher.blendFunction = fn;
          project.blendFunction = data.blend_function;
        } catch (err) {
          console.warn('Failed to restore blend function:', err);
        }
      }

      // Restore final touch function if it exists and is valid
      if (data.final_touch_function && typeof data.final_touch_function === 'string' &&
          data.final_touch_function !== 'null' && data.final_touch_function !== 'undefined') {
        try {
          const fn = new Function('canvas', data.final_touch_function);
          project.morpher.finalTouchFunction = fn;
          project.finalTouchFunction = data.final_touch_function;
        } catch (err) {
          console.warn('Failed to restore final touch function:', err);
        }
      }

      return project;
    });

    if (loadedProjects.length === 0) {
      // Create a default project if none exist
      const defaultProject = createNewProject();
      setProjects([defaultProject]);
    } else {
      setProjects(loadedProjects);
    }
  }, []);

  // Create a new project
  const createNewProject = useCallback(() => {
    const project = createProject({
      name: 'New Project',
      color: generateRandomColor(),
    });

    const savedProject = projectsStorage.create(project);
    project.id = savedProject.id;

    return project;
  }, []);

  // Add a new project
  const addProject = useCallback(() => {
    const project = createNewProject();
    setProjects(prev => {
      setCurrentIndex(prev.length); // Use prev.length instead of projects.length
      return [...prev, project];
    });
    return project;
  }, [createNewProject]);

  // Delete a project
  const deleteProject = useCallback((index) => {
    setProjects(prev => {
      const project = prev[index];
      if (!project) return prev;

      if (!confirm(`Are you sure you want to delete '${project.name}'?`)) {
        return prev;
      }

      // Delete project and its images from storage
      projectsStorage.delete(project.id);
      const imagesStorage = new LocalStorageManager(`Images${project.id}`);
      project.images.forEach(img => {
        if (img.id) {
          imagesStorage.delete(img.id);
        }
      });

      // Clean up morpher
      project.morpher.dispose();

      // Update current index
      setCurrentIndex(prevIndex => Math.max(0, Math.min(prevIndex, prev.length - 2)));

      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Update project
  const updateProject = useCallback((index, updates) => {
    setProjects(prev => {
      const newProjects = [...prev];
      newProjects[index] = { ...newProjects[index], ...updates };

      // Save to storage
      projectsStorage.update(newProjects[index]);

      return newProjects;
    });
  }, []);

  // Save project (including morpher state)
  const saveProject = useCallback((index) => {
    const project = projectsRef.current[index];
    if (!project) return;

    try {
      const morpherJSON = project.morpher.toJSON();
      // Remove src from images for storage
      const cleanedJSON = {
        ...morpherJSON,
        images: morpherJSON.images.map(img => ({ ...img, src: null }))
      };

      const updatedProject = {
        id: project.id,
        name: project.name,
        color: project.color,
        morpher: cleanedJSON,
      };

      // Only save functions if they exist (avoid saving null/undefined)
      if (project.blendFunction && typeof project.blendFunction === 'string') {
        updatedProject.blend_function = project.blendFunction;
      }
      if (project.finalTouchFunction && typeof project.finalTouchFunction === 'string') {
        updatedProject.final_touch_function = project.finalTouchFunction;
      }

      projectsStorage.update(updatedProject);
    } catch (err) {
      console.error('Error saving project:', err);
    }
  }, []);

  const currentProject = projects[currentIndex] || null;

  return {
    projects,
    currentProject,
    currentIndex,
    setCurrentIndex,
    addProject,
    deleteProject,
    updateProject,
    saveProject,
  };
}

/**
 * Create a new project object
 */
function createProject(data = {}) {
  const morpher = new Morpher();

  return {
    id: data.id || null,
    name: data.name || 'New Project',
    color: data.color || generateRandomColor(),
    morpher,
    images: [],
    blendFunction: data.blend_function || null,
    finalTouchFunction: data.final_touch_function || null,
  };
}

/**
 * Create a new image object
 */
function createImage(data = {}, morpher) {
  const morpherImage = new MorpherImage();

  return {
    id: data.id || null,
    morpherImage,
    weight: data.weight || 0,
    targetWeight: data.targetWeight || 0,
    url: data.url || '',
    file: data.file || null,
  };
}
