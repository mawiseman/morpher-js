/**
 * Web Worker Manager
 *
 * Manages Web Worker instances and provides a clean API for
 * offloading heavy computations to background threads.
 *
 * Features:
 * - Automatic worker initialization and cleanup
 * - Promise-based API for worker communication
 * - Worker pooling for parallel operations
 * - Graceful fallback when workers unavailable
 */

export class WorkerManager {
  meshWorker = null;
  blendWorker = null;
  workersSupported = false;

  /**
   * Initialize worker manager
   */
  constructor() {
    this.workersSupported = typeof Worker !== 'undefined';

    if (this.workersSupported) {
      this.initializeWorkers();
    }
  }

  /**
   * Initialize Web Workers
   * @private
   */
  initializeWorkers() {
    try {
      // Create workers using Vite's worker syntax
      // In production, Vite will bundle these as separate chunks
      this.meshWorker = new Worker(
        new URL('./workers/mesh-worker.js', import.meta.url),
        { type: 'module' }
      );

      this.blendWorker = new Worker(
        new URL('./workers/blend-worker.js', import.meta.url),
        { type: 'module' }
      );

      // Set up error handlers
      this.meshWorker.onerror = (error) => {
        console.error('Mesh worker error:', error);
      };

      this.blendWorker.onerror = (error) => {
        console.error('Blend worker error:', error);
      };
    } catch (error) {
      console.warn('Failed to initialize Web Workers, falling back to main thread:', error);
      this.workersSupported = false;
    }
  }

  /**
   * Update mesh using worker (or main thread fallback)
   *
   * @param {Object} data - Mesh calculation data
   * @param {Array} data.meshPoints - Current mesh points
   * @param {Array} data.images - Image data with positions, weights, and points
   * @param {number} data.canvasWidth - Canvas width
   * @param {number} data.canvasHeight - Canvas height
   * @returns {Promise<Array>} Updated mesh points
   */
  async updateMesh(data) {
    if (!this.workersSupported || !this.meshWorker) {
      // Fallback to synchronous main thread calculation
      return this.updateMeshSync(data);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Mesh worker timeout'));
      }, 5000);

      const handler = (e) => {
        clearTimeout(timeout);
        this.meshWorker.removeEventListener('message', handler);

        if (e.data.type === 'meshUpdated') {
          resolve(e.data.data.points);
        } else {
          reject(new Error('Unexpected worker response'));
        }
      };

      this.meshWorker.addEventListener('message', handler);
      this.meshWorker.postMessage({
        type: 'updateMesh',
        data
      });
    });
  }

  /**
   * Synchronous mesh update (fallback)
   * @private
   */
  updateMeshSync(data) {
    const { meshPoints, images, canvasWidth, canvasHeight } = data;

    const x0 = canvasWidth / 2;
    const y0 = canvasHeight / 2;

    return meshPoints.map((point, i) => {
      let x = x0;
      let y = y0;

      for (const img of images) {
        x += (img.x + img.points[i].x - x0) * img.weight;
        y += (img.y + img.points[i].y - y0) * img.weight;
      }

      return { x, y };
    });
  }

  /**
   * Perform software blend using worker (or main thread fallback)
   *
   * @param {ImageData} destination - Destination image data
   * @param {ImageData} source - Source image data
   * @param {number} weight - Blend weight (0-1)
   * @param {string} [mode='additive'] - Blend mode (additive, multiply, screen)
   * @returns {Promise<ImageData>} Blended image data
   */
  async softwareBlend(destination, source, weight, mode = 'additive') {
    if (!this.workersSupported || !this.blendWorker) {
      // Fallback to synchronous main thread calculation
      return this.softwareBlendSync(destination, source, weight, mode);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Blend worker timeout'));
      }, 10000);

      const handler = (e) => {
        clearTimeout(timeout);
        this.blendWorker.removeEventListener('message', handler);

        if (e.data.type === 'blendComplete') {
          resolve(e.data.data.result);
        } else if (e.data.type === 'blendError') {
          reject(new Error(e.data.data.error));
        } else {
          reject(new Error('Unexpected worker response'));
        }
      };

      this.blendWorker.addEventListener('message', handler);

      // Map mode to worker message type
      const messageType = mode === 'multiply' ? 'multiplyBlend' :
                          mode === 'screen' ? 'screenBlend' :
                          'softwareBlend';

      this.blendWorker.postMessage({
        type: messageType,
        data: { destination, source, weight }
      });
    });
  }

  /**
   * Synchronous software blend (fallback)
   * @private
   */
  softwareBlendSync(destination, source, weight, mode = 'additive') {
    const dData = destination.data;
    const sData = source.data;
    const length = Math.min(dData.length, sData.length);

    switch (mode) {
      case 'multiply':
        for (let i = 0; i < length; i += 4) {
          dData[i] = (dData[i] * sData[i] * weight) / 255;
          dData[i + 1] = (dData[i + 1] * sData[i + 1] * weight) / 255;
          dData[i + 2] = (dData[i + 2] * sData[i + 2] * weight) / 255;
          dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * weight);
        }
        break;

      case 'screen':
        for (let i = 0; i < length; i += 4) {
          dData[i] = 255 - ((255 - dData[i]) * (255 - sData[i] * weight)) / 255;
          dData[i + 1] = 255 - ((255 - dData[i + 1]) * (255 - sData[i + 1] * weight)) / 255;
          dData[i + 2] = 255 - ((255 - dData[i + 2]) * (255 - sData[i + 2] * weight)) / 255;
          dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * weight);
        }
        break;

      default: // additive
        for (let i = 0; i < length; i += 4) {
          dData[i] = Math.min(255, dData[i] + sData[i] * weight);
          dData[i + 1] = Math.min(255, dData[i + 1] + sData[i + 1] * weight);
          dData[i + 2] = Math.min(255, dData[i + 2] + sData[i + 2] * weight);
          dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * weight);
        }
    }

    return destination;
  }

  /**
   * Dispose of workers and clean up resources
   */
  dispose() {
    if (this.meshWorker) {
      this.meshWorker.terminate();
      this.meshWorker = null;
    }

    if (this.blendWorker) {
      this.blendWorker.terminate();
      this.blendWorker = null;
    }
  }

  /**
   * Check if workers are supported and initialized
   * @returns {boolean} True if workers are available
   */
  isSupported() {
    return this.workersSupported && !!this.meshWorker && !!this.blendWorker;
  }
}

// Singleton instance
let instance = null;

/**
 * Get the global worker manager instance
 * @returns {WorkerManager} Worker manager instance
 */
export function getWorkerManager() {
  if (!instance) {
    instance = new WorkerManager();
  }
  return instance;
}
