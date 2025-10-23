/**
 * MorpherJS v2.0
 *
 * Main entry point for the MorpherJS library
 * Modern ES6+ image morphing library using HTML5 Canvas
 *
 * @module morpher-js
 */

// Core library exports
export { Morpher } from './morpher.js';
export { Image } from './image.js';
export { Triangle } from './triangle.js';
export { Mesh } from './mesh.js';
export { Point } from './point.js';
export { Matrix } from './matrix.js';
export { EventDispatcher } from './event-dispatcher.js';

// Default export for convenience
import { Morpher } from './morpher.js';
export default Morpher;
