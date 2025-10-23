/**
 * Web Worker for mesh calculations
 *
 * Offloads heavy mesh calculations to a separate thread to prevent
 * blocking the main thread during complex morphing operations.
 *
 * Message format (input):
 * {
 *   type: 'updateMesh',
 *   data: {
 *     meshPoints: [{x, y}, ...],
 *     images: [{x, y, weight, points: [{x, y}, ...]}, ...],
 *     canvasWidth: number,
 *     canvasHeight: number
 *   }
 * }
 *
 * Message format (output):
 * {
 *   type: 'meshUpdated',
 *   data: {
 *     points: [{x, y}, ...]
 *   }
 * }
 */

self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'updateMesh':
      handleUpdateMesh(data);
      break;

    default:
      console.warn(`Unknown worker message type: ${type}`);
  }
});

/**
 * Calculate blended mesh positions based on image weights
 *
 * @param {Object} data - Calculation data
 * @param {Array} data.meshPoints - Current mesh points
 * @param {Array} data.images - Image data with positions, weights, and points
 * @param {number} data.canvasWidth - Canvas width
 * @param {number} data.canvasHeight - Canvas height
 */
function handleUpdateMesh(data) {
  const { meshPoints, images, canvasWidth, canvasHeight } = data;

  const x0 = canvasWidth / 2;
  const y0 = canvasHeight / 2;

  const updatedPoints = meshPoints.map((point, i) => {
    let x = x0;
    let y = y0;

    for (const img of images) {
      x += (img.x + img.points[i].x - x0) * img.weight;
      y += (img.y + img.points[i].y - y0) * img.weight;
    }

    return { x, y };
  });

  self.postMessage({
    type: 'meshUpdated',
    data: {
      points: updatedPoints
    }
  });
}

/**
 * Validate triangle bounds for virtual rendering
 *
 * @param {Object} data - Triangle data
 * @returns {boolean} True if triangle is valid
 */
function isValidTriangle(data) {
  const { p1, p2, p3 } = data;

  // Check if all points are defined
  if (!p1 || !p2 || !p3) return false;

  // Check if points are finite numbers
  if (!isFinite(p1.x) || !isFinite(p1.y) ||
      !isFinite(p2.x) || !isFinite(p2.y) ||
      !isFinite(p3.x) || !isFinite(p3.y)) {
    return false;
  }

  // Check if triangle has non-zero area (not degenerate)
  const area = Math.abs(
    (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
  ) / 2;

  return area > 0.1; // Minimum area threshold
}

// Export for testing if running in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleUpdateMesh,
    isValidTriangle
  };
}
