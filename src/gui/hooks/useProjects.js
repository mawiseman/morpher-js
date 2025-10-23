import { useState, useEffect, useCallback } from 'react';
import { Morpher, Image as MorpherImage } from '../../index.js';
import { LocalStorageManager, generateRandomColor } from '../utils/storage.js';

const projectsStorage = new LocalStorageManager('Projects');

/**
 * Hook for managing projects
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    setProjects(prev => [...prev, project]);
    setCurrentIndex(projects.length);
    return project;
  }, [projects.length, createNewProject]);

  // Delete a project
  const deleteProject = useCallback((index) => {
    const project = projects[index];
    if (!project) return;

    if (!confirm(`Are you sure you want to delete '${project.name}'?`)) {
      return;
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

    setProjects(prev => prev.filter((_, i) => i !== index));
    setCurrentIndex(Math.max(0, currentIndex - 1));
  }, [projects, currentIndex]);

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
    const project = projects[index];
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
        blend_function: project.blendFunction,
        final_touch_function: project.finalTouchFunction,
      };

      projectsStorage.update(updatedProject);
    } catch (err) {
      console.error('Error saving project:', err);
    }
  }, [projects]);

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
