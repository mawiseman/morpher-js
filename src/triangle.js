import { EventDispatcher } from './event-dispatcher.js';
import { Matrix } from './matrix.js';

/**
 * Triangle
 *
 * Represents a triangle in the mesh, defined by three points
 * Handles rendering and transformation
 *
 * @class Triangle
 * @extends EventDispatcher
 */
export class Triangle extends EventDispatcher {
  p1 = null;
  p2 = null;
  p3 = null;

  /**
   * Create a new Triangle
   * @param {Point} p1 - First point
   * @param {Point} p2 - Second point
   * @param {Point} p3 - Third point
   */
  constructor(p1, p2, p3) {
    super();

    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    this.p1.on('remove', this.remove.bind(this));
    this.p2.on('remove', this.remove.bind(this));
    this.p3.on('remove', this.remove.bind(this));
  }

  // Public Methods

  /**
   * Remove this triangle (triggers 'remove' event)
   */
  remove() {
    this.trigger('remove', this);
  }

  /**
   * Check if triangle contains a specific point
   * @param {Point} p - Point to check
   * @returns {boolean} True if triangle contains the point
   */
  hasPoint(p) {
    return this.p1 === p || this.p2 === p || this.p3 === p;
  }

  /**
   * Create a copy of this triangle
   * @returns {Triangle} New triangle with cloned points
   */
  clone() {
    return new Triangle(this.p1.clone(), this.p2.clone(), this.p3.clone());
  }

  // Transformations

  /**
   * Apply matrix transformation to all points
   * @param {Matrix} matrix - Transformation matrix
   */
  transform(matrix) {
    this.p1.transform(matrix);
    this.p2.transform(matrix);
    this.p3.transform(matrix);
  }

  /**
   * Get bounding box of triangle
   * @returns {number[]} [left, top, right, bottom]
   */
  getBounds() {
    let left = this.p1.x;
    let right = this.p1.x;
    let top = this.p1.y;
    let bottom = this.p1.y;

    for (const p of [this.p2, this.p3]) {
      left = Math.min(left, p.x);
      right = Math.max(right, p.x);
      top = Math.min(top, p.y);
      bottom = Math.max(bottom, p.y);
    }

    return [left, top, right, bottom];
  }

  /**
   * Draw triangle from source to destination context with morphing
   * @param {HTMLCanvasElement} sourceBitmap - Source canvas
   * @param {CanvasRenderingContext2D} destinationCtx - Destination context
   * @param {Triangle} destinationTriangle - Target triangle for morphing
   */
  draw(sourceBitmap, destinationCtx, destinationTriangle) {
    const [left, top, right, bottom] = this.getBounds();
    const width = right - left;
    const height = bottom - top;

    // Calculate transformation from source triangle to aligned state
    const matr1 = new Matrix();
    matr1.translate(-this.p1.x, -this.p1.y);
    matr1.rotate(-Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x));
    const from = this.clone();
    from.transform(matr1.apply());

    // Calculate transformation from destination triangle to aligned state
    const matr2 = new Matrix();
    const rotation2 = Math.atan2(
      destinationTriangle.p2.y - destinationTriangle.p1.y,
      destinationTriangle.p2.x - destinationTriangle.p1.x
    );
    matr2.translate(-destinationTriangle.p1.x, -destinationTriangle.p1.y);
    matr2.rotate(-rotation2);
    const to = destinationTriangle.clone();
    to.transform(matr2.apply());

    // Calculate scale and shear transformations
    const scaleX = to.p2.x / from.p2.x;
    const scaleY = to.p3.y / from.p3.y;
    matr1.scale(scaleX, scaleY);

    matr1.shear((to.p3.x - from.p3.x * scaleX) / (from.p3.y * scaleY));

    matr1.rotate(rotation2);
    matr1.translate(destinationTriangle.p1.x, destinationTriangle.p1.y);

    // Draw transformed triangle
    destinationCtx.save();
    destinationCtx.setTransform(...matr1.apply(true).toTransform());

    // Create clipping path with slight edge offsets to avoid gaps
    const points = [];
    points.push(this.offset(this.p1, this.p2));
    points.push(this.offset(this.p1, this.p3));
    points.push(this.offset(this.p2, this.p3));
    points.push(this.offset(this.p2, this.p1));
    points.push(this.offset(this.p3, this.p1));
    points.push(this.offset(this.p3, this.p2));

    destinationCtx.beginPath();
    destinationCtx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      destinationCtx.lineTo(point.x, point.y);
    }
    destinationCtx.closePath();
    destinationCtx.clip();

    destinationCtx.drawImage(sourceBitmap, left, top, width, height, left, top, width, height);

    destinationCtx.restore();
  }

  /**
   * Calculate offset point for edge smoothing
   * @param {Point} p1 - First point
   * @param {Point} p2 - Second point
   * @param {number} [distance=0.7] - Offset distance
   * @returns {Object} Offset point {x, y}
   */
  offset(p1, p2, distance = 0.7) {
    // Disable offset in Chrome (not the best solution, but better than nothing)
    if (window.chrome) {
      distance = 0;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const dx2 = (dx * distance) / length;
    const dy2 = (dy * distance) / length;

    return { x: p1.x - dx2, y: p1.y - dy2 };
  }
}
