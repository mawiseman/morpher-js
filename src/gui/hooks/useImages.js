import { useCallback } from 'react';
import { Image as MorpherImage } from '../../index.js';
import { LocalStorageManager } from '../utils/storage.js';

/**
 * Hook for managing images within a project
 */
export function useImages(project, updateProject, saveProject) {
  if (!project) {
    return {
      images: [],
      addImage: () => {},
      deleteImage: () => {},
      updateImage: () => {},
      setImageFile: () => {},
      setImageWeight: () => {},
    };
  }

  const imagesStorage = new LocalStorageManager(`Images${project.id}`);

  // Add a new image
  const addImage = useCallback(() => {
    const morpherImage = new MorpherImage();

    const imageData = {
      morpherImage,
      weight: 0,
      targetWeight: 0,
      url: '',
      file: null,
    };

    // Save to storage (exclude morpherImage)
    const imageDataForStorage = {
      weight: 0,
      targetWeight: 0,
      url: '',
      file: null,
    };
    const savedImage = imagesStorage.create(imageDataForStorage);
    imageData.id = savedImage.id;

    project.morpher.addImage(morpherImage);

    updateProject(project.index, {
      images: [...project.images, imageData]
    });

    return imageData;
  }, [project, updateProject, imagesStorage]);

  // Delete an image
  const deleteImage = useCallback((index) => {
    const image = project.images[index];
    if (!image) return;

    if (!confirm(`Are you sure you want to delete image '${image.url}'?`)) {
      return;
    }

    imagesStorage.delete(image.id);
    project.morpher.removeImage(image.morpherImage);

    const newImages = project.images.filter((_, i) => i !== index);
    updateProject(project.index, { images: newImages });
  }, [project, updateProject, imagesStorage]);

  // Update an image
  const updateImage = useCallback((index, updates) => {
    const newImages = [...project.images];
    newImages[index] = { ...newImages[index], ...updates };

    // Update morpherImage if needed
    if (updates.weight !== undefined) {
      newImages[index].morpherImage.setWeight(updates.weight);
    }
    if (updates.file !== undefined) {
      newImages[index].morpherImage.setSrc(updates.file);
    }

    // Find the project index in the projects array
    updateProject(project.index, { images: newImages });

    // Save to storage (exclude morpherImage from storage)
    const imageDataForStorage = {
      id: newImages[index].id,
      weight: newImages[index].weight,
      targetWeight: newImages[index].targetWeight,
      url: newImages[index].url,
      file: newImages[index].file,
    };
    imagesStorage.update(imageDataForStorage);
  }, [project, updateProject, imagesStorage]);

  // Set image from file
  const setImageFile = useCallback((index, file) => {
    if (!file.type.match('image.*')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target.result;
      const image = project.images[index];

      const updates = { file: fileData };

      // Set URL from filename if not already set
      if (!image.url) {
        const match = file.name.match(/[^\\/]+$/);
        if (match) {
          updates.url = match[0];
        }
      }

      updateImage(index, updates);
      saveProject(project.index);
    };

    reader.readAsDataURL(file);
  }, [project, updateImage, saveProject]);

  // Set image weight
  const setImageWeight = useCallback((index, targetWeight) => {
    const weight = parseFloat(targetWeight);
    updateImage(index, { targetWeight: weight, weight });

    // Normalize other image weights
    normalizeWeights(project, index, weight, updateImage);

    saveProject(project.index);
  }, [project, updateImage, saveProject]);

  return {
    images: project.images,
    addImage,
    deleteImage,
    updateImage,
    setImageFile,
    setImageWeight,
  };
}

/**
 * Normalize weights when one image's weight changes
 */
function normalizeWeights(project, changedIndex, newWeight, updateImage) {
  let totalW = 0;
  for (let i = 0; i < project.images.length; i++) {
    if (i !== changedIndex) {
      totalW += project.images[i].targetWeight;
    }
  }

  const defaultW = totalW > 0 ? 0 : 1;
  const maxW = (1 - newWeight) / (totalW || project.images.length - 1);

  for (let i = 0; i < project.images.length; i++) {
    if (i !== changedIndex) {
      const img = project.images[i];
      const normalizedWeight = (defaultW || img.targetWeight) * maxW;
      updateImage(i, { weight: normalizedWeight });
    }
  }
}
