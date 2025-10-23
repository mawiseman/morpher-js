/**
 * Image Loader with ImageBitmap support
 *
 * Provides optimized image loading using modern browser APIs:
 * - ImageBitmap for faster decoding and rendering
 * - Lazy loading with Intersection Observer
 * - Preloading and caching
 *
 * ImageBitmap benefits:
 * - Decoded on load (no decode during render)
 * - Can be transferred to workers
 * - Better memory management
 * - Faster drawImage() calls
 */

export class ImageLoader {
  static cache = new Map();
  static imageBitmapSupported = typeof createImageBitmap !== 'undefined';

  /**
   * Load an image with ImageBitmap optimization
   *
   * @param {string} url - Image URL
   * @param {Object} [options={}] - Loading options
   * @param {boolean} [options.useCache=true] - Use cache
   * @param {string} [options.colorSpaceConversion='default'] - Color space
   * @param {string} [options.imageOrientation='from-image'] - Image orientation
   * @param {string} [options.premultiplyAlpha='default'] - Alpha premultiplication
   * @param {string} [options.resizeQuality='high'] - Resize quality
   * @returns {Promise<ImageBitmap|HTMLImageElement>} Loaded image
   */
  static async load(url, options = {}) {
    const {
      useCache = true,
      colorSpaceConversion = 'default',
      imageOrientation = 'from-image',
      premultiplyAlpha = 'default',
      resizeQuality = 'high'
    } = options;

    // Check cache first
    if (useCache && ImageLoader.cache.has(url)) {
      return ImageLoader.cache.get(url);
    }

    try {
      // Prefer ImageBitmap for better performance
      if (ImageLoader.imageBitmapSupported) {
        const bitmap = await ImageLoader.loadAsImageBitmap(url, {
          colorSpaceConversion,
          imageOrientation,
          premultiplyAlpha,
          resizeQuality
        });

        if (useCache) {
          ImageLoader.cache.set(url, bitmap);
        }

        return bitmap;
      } else {
        // Fallback to standard HTMLImageElement
        const img = await ImageLoader.loadAsImage(url);

        if (useCache) {
          ImageLoader.cache.set(url, img);
        }

        return img;
      }
    } catch (error) {
      console.error(`Failed to load image: ${url}`, error);
      throw error;
    }
  }

  /**
   * Load image as ImageBitmap
   * @private
   */
  static async loadAsImageBitmap(url, options) {
    const response = await fetch(url);
    const blob = await response.blob();
    return createImageBitmap(blob, options);
  }

  /**
   * Load image as HTMLImageElement (fallback)
   * @private
   */
  static loadAsImage(url) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));

      img.src = url;
    });
  }

  /**
   * Preload multiple images
   *
   * @param {string[]} urls - Array of image URLs
   * @param {Object} [options={}] - Loading options
   * @param {Function} [options.onProgress] - Progress callback (loaded, total)
   * @returns {Promise<Array>} Array of loaded images
   */
  static async preload(urls, options = {}) {
    const { onProgress } = options;
    const results = [];
    let loaded = 0;

    for (const url of urls) {
      try {
        const image = await ImageLoader.load(url, options);
        results.push({ url, image, error: null });
      } catch (error) {
        results.push({ url, image: null, error });
      }

      loaded++;
      if (onProgress) {
        onProgress(loaded, urls.length);
      }
    }

    return results;
  }

  /**
   * Clear cache for a specific URL or all URLs
   *
   * @param {string} [url] - URL to clear, or undefined for all
   */
  static clearCache(url) {
    if (url) {
      const cached = ImageLoader.cache.get(url);

      // Close ImageBitmap to free memory
      if (cached && typeof cached.close === 'function') {
        cached.close();
      }

      ImageLoader.cache.delete(url);
    } else {
      // Clear all
      for (const [, cached] of ImageLoader.cache) {
        if (cached && typeof cached.close === 'function') {
          cached.close();
        }
      }
      ImageLoader.cache.clear();
    }
  }

  /**
   * Get cache size
   * @returns {number} Number of cached images
   */
  static getCacheSize() {
    return ImageLoader.cache.size;
  }

  /**
   * Check if ImageBitmap is supported
   * @returns {boolean} True if supported
   */
  static isImageBitmapSupported() {
    return ImageLoader.imageBitmapSupported;
  }
}

/**
 * Lazy Image Loader with Intersection Observer
 *
 * Automatically loads images when they come into viewport
 */
export class LazyImageLoader {
  observer = null;
  loadQueue = new Map();
  options = null;

  /**
   * Create a lazy image loader
   *
   * @param {Object} [options={}] - Loader options
   * @param {number} [options.rootMargin='50px'] - Load margin before viewport
   * @param {number} [options.threshold=0] - Intersection threshold
   */
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0
    };

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.options
      );
    } else {
      console.warn('IntersectionObserver not supported, lazy loading disabled');
    }
  }

  /**
   * Register an element for lazy loading
   *
   * @param {HTMLElement} element - Element to observe
   * @param {string} url - Image URL to load
   * @param {Function} [onLoad] - Callback when loaded
   * @param {Object} [loadOptions] - Options for ImageLoader.load()
   */
  observe(element, url, onLoad, loadOptions) {
    if (!this.observer) {
      // Fallback: load immediately if observer not available
      this.loadImage(url, onLoad, loadOptions);
      return;
    }

    this.loadQueue.set(element, { url, onLoad, loadOptions });
    this.observer.observe(element);
  }

  /**
   * Unregister an element
   * @param {HTMLElement} element - Element to stop observing
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.loadQueue.delete(element);
  }

  /**
   * Handle intersection events
   * @private
   */
  handleIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const { url, onLoad, loadOptions } = this.loadQueue.get(entry.target);

        if (url) {
          this.loadImage(url, onLoad, loadOptions);
          this.unobserve(entry.target);
        }
      }
    }
  }

  /**
   * Load an image
   * @private
   */
  async loadImage(url, onLoad, loadOptions) {
    try {
      const image = await ImageLoader.load(url, loadOptions);
      if (onLoad) {
        onLoad(image, null);
      }
    } catch (error) {
      if (onLoad) {
        onLoad(null, error);
      }
    }
  }

  /**
   * Disconnect observer and clear queue
   */
  dispose() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadQueue.clear();
  }
}

/**
 * Image Pool Manager
 *
 * Manages a pool of reusable canvas/ImageBitmap objects
 * to reduce allocation overhead
 */
export class ImagePool {
  pool = [];
  maxSize = 10;

  /**
   * Create an image pool
   * @param {number} [maxSize=10] - Maximum pool size
   */
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Acquire a canvas from the pool or create new
   *
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {HTMLCanvasElement} Canvas element
   */
  acquireCanvas(width, height) {
    // Try to find a suitable canvas in the pool
    const index = this.pool.findIndex(
      (item) =>
        item.type === 'canvas' &&
        item.width >= width &&
        item.height >= height &&
        item.width <= width * 1.5 && // Not too oversized
        item.height <= height * 1.5
    );

    if (index !== -1) {
      const item = this.pool.splice(index, 1)[0];
      const canvas = item.canvas;
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Release a canvas back to the pool
   * @param {HTMLCanvasElement} canvas - Canvas to release
   */
  releaseCanvas(canvas) {
    if (this.pool.length < this.maxSize) {
      this.pool.push({
        type: 'canvas',
        canvas,
        width: canvas.width,
        height: canvas.height
      });
    }
  }

  /**
   * Clear the pool
   */
  clear() {
    for (const item of this.pool) {
      if (item.type === 'canvas' && item.canvas) {
        item.canvas.width = 0;
        item.canvas.height = 0;
      }
    }
    this.pool = [];
  }

  /**
   * Get pool size
   * @returns {number} Number of items in pool
   */
  size() {
    return this.pool.length;
  }
}
