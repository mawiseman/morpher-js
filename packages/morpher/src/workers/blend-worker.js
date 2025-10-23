/**
 * Web Worker for blend operations
 *
 * Offloads CPU-intensive pixel manipulation to a separate thread
 * for software blending fallback when GPU acceleration is unavailable.
 *
 * Message format (input):
 * {
 *   type: 'softwareBlend',
 *   data: {
 *     destination: ImageData,
 *     source: ImageData,
 *     weight: number
 *   }
 * }
 *
 * Message format (output):
 * {
 *   type: 'blendComplete',
 *   data: {
 *     result: ImageData
 *   }
 * }
 */

self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'softwareBlend':
      handleSoftwareBlend(data);
      break;

    case 'multiplyBlend':
      handleMultiplyBlend(data);
      break;

    case 'screenBlend':
      handleScreenBlend(data);
      break;

    default:
      console.warn(`Unknown worker message type: ${type}`);
  }
});

/**
 * Perform software-based additive blending
 *
 * This is a fallback for when GPU acceleration is unavailable.
 * Performs pixel-by-pixel additive blending.
 *
 * @param {Object} data - Blend data
 * @param {ImageData} data.destination - Destination image data
 * @param {ImageData} data.source - Source image data
 * @param {number} data.weight - Blend weight (0-1)
 */
function handleSoftwareBlend(data) {
  const { destination, source, weight } = data;

  // Validate inputs
  if (!destination || !source || typeof weight !== 'number') {
    self.postMessage({
      type: 'blendError',
      data: { error: 'Invalid blend parameters' }
    });
    return;
  }

  const dData = destination.data;
  const sData = source.data;
  const length = Math.min(dData.length, sData.length);

  // Additive blending: destination += source * weight
  for (let i = 0; i < length; i += 4) {
    dData[i] += sData[i] * weight;         // R
    dData[i + 1] += sData[i + 1] * weight; // G
    dData[i + 2] += sData[i + 2] * weight; // B
    // Alpha channel is handled separately
    dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * weight);

    // Clamp values to valid range [0, 255]
    dData[i] = Math.min(255, dData[i]);
    dData[i + 1] = Math.min(255, dData[i + 1]);
    dData[i + 2] = Math.min(255, dData[i + 2]);
  }

  self.postMessage({
    type: 'blendComplete',
    data: { result: destination }
  });
}

/**
 * Perform multiply blending
 *
 * @param {Object} data - Blend data
 */
function handleMultiplyBlend(data) {
  const { destination, source, weight } = data;

  if (!destination || !source || typeof weight !== 'number') {
    self.postMessage({
      type: 'blendError',
      data: { error: 'Invalid blend parameters' }
    });
    return;
  }

  const dData = destination.data;
  const sData = source.data;
  const length = Math.min(dData.length, sData.length);

  // Multiply blending: destination = destination * (source * weight)
  for (let i = 0; i < length; i += 4) {
    const sw = weight;
    dData[i] = (dData[i] * sData[i] * sw) / 255;         // R
    dData[i + 1] = (dData[i + 1] * sData[i + 1] * sw) / 255; // G
    dData[i + 2] = (dData[i + 2] * sData[i + 2] * sw) / 255; // B
    dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * sw);
  }

  self.postMessage({
    type: 'blendComplete',
    data: { result: destination }
  });
}

/**
 * Perform screen blending
 *
 * @param {Object} data - Blend data
 */
function handleScreenBlend(data) {
  const { destination, source, weight } = data;

  if (!destination || !source || typeof weight !== 'number') {
    self.postMessage({
      type: 'blendError',
      data: { error: 'Invalid blend parameters' }
    });
    return;
  }

  const dData = destination.data;
  const sData = source.data;
  const length = Math.min(dData.length, sData.length);

  // Screen blending: 1 - (1 - destination) * (1 - source * weight)
  for (let i = 0; i < length; i += 4) {
    const sw = weight;
    dData[i] = 255 - ((255 - dData[i]) * (255 - sData[i] * sw)) / 255;         // R
    dData[i + 1] = 255 - ((255 - dData[i + 1]) * (255 - sData[i + 1] * sw)) / 255; // G
    dData[i + 2] = 255 - ((255 - dData[i + 2]) * (255 - sData[i + 2] * sw)) / 255; // B
    dData[i + 3] = Math.max(dData[i + 3], sData[i + 3] * sw);
  }

  self.postMessage({
    type: 'blendComplete',
    data: { result: destination }
  });
}

/**
 * Batch blend operations for multiple images
 *
 * Processes multiple blend operations in sequence
 *
 * @param {Object} data - Batch blend data
 */
function handleBatchBlend(data) {
  const { operations } = data;

  if (!Array.isArray(operations)) {
    self.postMessage({
      type: 'blendError',
      data: { error: 'Invalid batch operations' }
    });
    return;
  }

  const results = [];

  for (const op of operations) {
    const { type, destination, source, weight } = op;

    switch (type) {
      case 'additive':
        handleSoftwareBlend({ destination, source, weight });
        break;
      case 'multiply':
        handleMultiplyBlend({ destination, source, weight });
        break;
      case 'screen':
        handleScreenBlend({ destination, source, weight });
        break;
    }

    results.push(destination);
  }

  self.postMessage({
    type: 'batchBlendComplete',
    data: { results }
  });
}

// Export for testing if running in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleSoftwareBlend,
    handleMultiplyBlend,
    handleScreenBlend,
    handleBatchBlend
  };
}
