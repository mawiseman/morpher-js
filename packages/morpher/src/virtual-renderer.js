/**
 * Virtual Renderer
 *
 * Implements virtual rendering (culling) for large meshes to improve performance
 * by only rendering triangles that are visible in the viewport.
 *
 * Features:
 * - Viewport culling (only render visible triangles)
 * - Frustum culling for off-screen triangles
 * - Adaptive detail levels based on triangle size
 * - Batched rendering for better performance
 */

export class VirtualRenderer {
  // Culling thresholds
  static CULL_PADDING = 50; // Pixels outside viewport to still render
  static MIN_TRIANGLE_AREA = 0.5; // Minimum area in pixels to render
  static MAX_TRIANGLES_PER_FRAME = 1000; // Maximum triangles per frame

  /**
   * Check if a triangle is visible in the viewport
   *
   * @param {Triangle} triangle - Triangle to check
   * @param {Object} viewport - Viewport bounds {left, top, width, height}
   * @returns {boolean} True if triangle intersects viewport
   */
  static isTriangleVisible(triangle, viewport) {
    const [left, top, right, bottom] = triangle.getBounds();

    const padding = VirtualRenderer.CULL_PADDING;

    // Check if triangle bounds intersect with viewport bounds
    return !(
      right < viewport.left - padding ||
      left > viewport.left + viewport.width + padding ||
      bottom < viewport.top - padding ||
      top > viewport.top + viewport.height + padding
    );
  }

  /**
   * Calculate triangle area in pixels
   *
   * @param {Triangle} triangle - Triangle to measure
   * @returns {number} Area in pixels
   */
  static calculateTriangleArea(triangle) {
    const { p1, p2, p3 } = triangle;

    // Use cross product formula for triangle area
    return Math.abs(
      (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
    ) / 2;
  }

  /**
   * Check if triangle is degenerate (too small to render)
   *
   * @param {Triangle} triangle - Triangle to check
   * @returns {boolean} True if triangle is too small
   */
  static isTriangleDegenerate(triangle) {
    const area = VirtualRenderer.calculateTriangleArea(triangle);
    return area < VirtualRenderer.MIN_TRIANGLE_AREA;
  }

  /**
   * Filter triangles for rendering based on visibility and quality
   *
   * @param {Array<Triangle>} triangles - All triangles
   * @param {Object} viewport - Viewport bounds {left, top, width, height}
   * @param {Object} [options={}] - Filtering options
   * @param {boolean} [options.cullOffscreen=true] - Cull off-screen triangles
   * @param {boolean} [options.cullDegenerate=true] - Cull degenerate triangles
   * @param {number} [options.maxTriangles] - Maximum triangles to render
   * @returns {Array<{triangle, index, priority}>} Filtered triangles with metadata
   */
  static filterTriangles(triangles, viewport, options = {}) {
    const {
      cullOffscreen = true,
      cullDegenerate = true,
      maxTriangles = VirtualRenderer.MAX_TRIANGLES_PER_FRAME
    } = options;

    const filtered = [];

    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];

      // Skip degenerate triangles
      if (cullDegenerate && VirtualRenderer.isTriangleDegenerate(triangle)) {
        continue;
      }

      // Skip off-screen triangles
      if (cullOffscreen && !VirtualRenderer.isTriangleVisible(triangle, viewport)) {
        continue;
      }

      // Calculate priority (larger triangles = higher priority)
      const area = VirtualRenderer.calculateTriangleArea(triangle);
      const [left, top, right, bottom] = triangle.getBounds();

      // Distance from viewport center
      const centerX = viewport.left + viewport.width / 2;
      const centerY = viewport.top + viewport.height / 2;
      const triangleCenterX = (left + right) / 2;
      const triangleCenterY = (top + bottom) / 2;
      const distance = Math.sqrt(
        Math.pow(triangleCenterX - centerX, 2) +
        Math.pow(triangleCenterY - centerY, 2)
      );

      // Priority: larger and closer triangles get higher priority
      const priority = area / (distance + 1);

      filtered.push({
        triangle,
        index: i,
        priority,
        area
      });
    }

    // Sort by priority (descending)
    filtered.sort((a, b) => b.priority - a.priority);

    // Limit to max triangles
    return filtered.slice(0, maxTriangles);
  }

  /**
   * Render triangles with batching
   *
   * Groups triangles by source image and renders them in batches
   * for better performance.
   *
   * @param {CanvasRenderingContext2D} ctx - Rendering context
   * @param {Array} triangleData - Filtered triangle data from filterTriangles()
   * @param {Function} drawCallback - Callback to draw each triangle (triangle, index)
   */
  static renderBatched(ctx, triangleData, drawCallback) {
    // Save context state once
    ctx.save();

    try {
      // Render triangles in priority order
      for (const data of triangleData) {
        drawCallback(data.triangle, data.index);
      }
    } finally {
      // Restore context state
      ctx.restore();
    }
  }

  /**
   * Calculate optimal viewport for current canvas and scroll position
   *
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {Object} Viewport bounds {left, top, width, height}
   */
  static getViewport(canvas) {
    const rect = canvas.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    return {
      left: -rect.left + scrollX,
      top: -rect.top + scrollY,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Adaptive detail level based on zoom/scale
   *
   * Returns a detail level (0-1) based on the current view scale.
   * Higher detail = more triangles rendered.
   *
   * @param {number} scale - Current view scale (1.0 = normal)
   * @returns {number} Detail level (0-1)
   */
  static getDetailLevel(scale) {
    // More detail when zoomed in, less when zoomed out
    if (scale >= 2.0) return 1.0; // Full detail
    if (scale >= 1.0) return 0.8;
    if (scale >= 0.5) return 0.6;
    if (scale >= 0.25) return 0.4;
    return 0.2; // Minimum detail
  }

  /**
   * Adjust rendering quality based on detail level
   *
   * @param {number} detailLevel - Detail level (0-1)
   * @returns {Object} Quality settings
   */
  static getQualitySettings(detailLevel) {
    return {
      imageSmoothingEnabled: detailLevel > 0.5,
      imageSmoothingQuality: detailLevel > 0.7 ? 'high' : detailLevel > 0.4 ? 'medium' : 'low',
      maxTriangles: Math.floor(VirtualRenderer.MAX_TRIANGLES_PER_FRAME * detailLevel),
      cullDegenerate: detailLevel < 0.8 // Only cull when lower detail
    };
  }
}

/**
 * Spatial Index for fast triangle lookup
 *
 * Uses a simple grid-based spatial partitioning for O(1) lookup
 * of triangles in a given region.
 */
export class SpatialIndex {
  grid = new Map();
  cellSize = 100; // Grid cell size in pixels

  /**
   * Create a spatial index
   * @param {number} [cellSize=100] - Grid cell size in pixels
   */
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
  }

  /**
   * Get grid cell key for coordinates
   * @private
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Add a triangle to the index
   *
   * @param {Triangle} triangle - Triangle to add
   * @param {number} index - Triangle index
   */
  add(triangle, index) {
    const [left, top, right, bottom] = triangle.getBounds();

    // Add to all cells that the triangle overlaps
    const startX = Math.floor(left / this.cellSize);
    const endX = Math.floor(right / this.cellSize);
    const startY = Math.floor(top / this.cellSize);
    const endY = Math.floor(bottom / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push({ triangle, index });
      }
    }
  }

  /**
   * Query triangles in a region
   *
   * @param {Object} region - Region bounds {left, top, width, height}
   * @returns {Array<{triangle, index}>} Triangles in region
   */
  query(region) {
    const { left, top, width, height } = region;
    const right = left + width;
    const bottom = top + height;

    const startX = Math.floor(left / this.cellSize);
    const endX = Math.floor(right / this.cellSize);
    const startY = Math.floor(top / this.cellSize);
    const endY = Math.floor(bottom / this.cellSize);

    const results = new Map(); // Use map to avoid duplicates

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell) {
            results.set(item.index, item);
          }
        }
      }
    }

    return Array.from(results.values());
  }

  /**
   * Clear the index
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Rebuild the index with new triangles
   *
   * @param {Array<Triangle>} triangles - Triangles to index
   */
  rebuild(triangles) {
    this.clear();
    for (let i = 0; i < triangles.length; i++) {
      this.add(triangles[i], i);
    }
  }

  /**
   * Get index statistics
   * @returns {Object} Statistics
   */
  getStats() {
    let totalTriangles = 0;
    let maxPerCell = 0;

    for (const [, cell] of this.grid) {
      totalTriangles += cell.length;
      maxPerCell = Math.max(maxPerCell, cell.length);
    }

    return {
      cells: this.grid.size,
      totalTriangles,
      averagePerCell: totalTriangles / this.grid.size || 0,
      maxPerCell
    };
  }
}
