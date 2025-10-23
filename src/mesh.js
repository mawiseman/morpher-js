import { EventDispatcher } from './event-dispatcher.js';
import { Point } from './point.js';
import { Triangle } from './triangle.js';

/**
 * Mesh
 *
 * Represents a triangular mesh structure with control points
 * Handles point and triangle management, relative positioning
 *
 * @class Mesh
 * @extends EventDispatcher
 */
export class Mesh extends EventDispatcher {
  points = null;
  triangles = null;
  bounds = { width: 0, height: 0 };

  maxWidth = 0;
  maxHeight = 0;
  x = 0;
  y = 0;

  /**
   * Create a new Mesh
   * @param {Object} [params={}] - Optional parameters
   */
  constructor(params = {}) {
    super();
    this.points = [];
    this.triangles = [];

    // Bind methods that are used as callbacks
    this.changeHandler = this.changeHandler.bind(this);
    this.removePoint = this.removePoint.bind(this);
    this.removeTriangle = this.removeTriangle.bind(this);
  }

  // Bounds

  /**
   * Set maximum size for bounds checking
   * @param {number} w - Maximum width
   * @param {number} h - Maximum height
   */
  setMaxSize(w, h) {
    this.maxWidth = w;
    this.maxHeight = h;
  }

  /**
   * Refresh bounds based on current points
   */
  refreshBounds() {
    const bounds = { left: 0, top: 0, width: 0, height: 0 };

    if (this.points.length) {
      bounds.left = this.points[0].x;
      bounds.top = this.points[0].y;
    }

    for (const point of this.points) {
      bounds.width = Math.max(bounds.width, point.x);
      bounds.height = Math.max(bounds.height, point.y);
      bounds.left = Math.min(bounds.left, point.x);
      bounds.top = Math.min(bounds.top, point.y);
    }

    bounds.width -= bounds.left;
    bounds.height -= bounds.top;

    if (
      bounds.width !== this.bounds.width ||
      bounds.height !== this.bounds.height ||
      bounds.left !== this.bounds.left ||
      bounds.top !== this.bounds.top
    ) {
      this.bounds = bounds;
      this.trigger('change:bounds');
    }
  }

  // Points

  /**
   * Add a point to the mesh
   * @param {Point|Object} pointParams - Point instance or parameters
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   * @returns {Point} Added point
   */
  addPoint(pointParams, params = {}) {
    let point;
    let position;

    if (!(pointParams instanceof Point)) {
      if (pointParams.points) {
        position = this.resolveRelativePosition(pointParams);
      } else {
        position = pointParams;
        pointParams = null;
      }
      point = new Point(position.x, position.y, { mesh: this });
    } else {
      point = pointParams;
      point.mesh = this;
      pointParams = null;
    }

    // Use pre-bound methods
    point.on('change', this.changeHandler);
    point.on('remove', this.removePoint);

    this.points.push(point);
    this.refreshBounds();

    if (!params.silent) {
      this.trigger('point:add', this, point, pointParams);
    }

    return point;
  }

  /**
   * Remove a point from the mesh
   * @param {Point|number} point - Point instance or index
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  removePoint(point, params = {}) {
    let i;
    if (point instanceof Point) {
      i = this.points.indexOf(point);
    } else {
      i = point;
    }

    if (i !== undefined && i !== -1) {
      this.points.splice(i, 1);
      if (!params.silent) {
        this.trigger('point:remove', this, point, i);
      }
    }
  }

  /**
   * Make this mesh compatible with another mesh
   * @param {Mesh|Image} mesh - Target mesh or image
   */
  makeCompatibleWith(mesh) {
    // Handle Image objects
    if (mesh.mesh) {
      mesh = mesh.mesh;
    }

    if (this.points.length !== mesh.points.length) {
      if (this.points.length > mesh.points.length) {
        this.points.splice(mesh.points.length, this.points.length - mesh.points.length);
      } else {
        for (const point of mesh.points.slice(this.points.length)) {
          this.addPoint({ x: point.x, y: point.y });
        }
      }
    }
  }

  /**
   * Handle point changes
   */
  changeHandler() {
    this.refreshBounds();
    this.trigger('change');
  }

  // Relative Position

  /**
   * Get relative position of a point based on nearest neighbors
   * @param {Point} point - Point to get relative position for
   * @returns {Object} Relative position data
   */
  getRelativePositionOf(point) {
    // Find 3 nearest points
    const nearest = [];

    for (const p of this.points) {
      if (p === point) continue;

      const d = p.distanceTo(point);

      if (nearest.length === 0) {
        nearest.push({ distance: d, point: p });
      } else {
        for (let i = 0; i < nearest.length; i++) {
          const n = nearest[i];
          if (d < n.distance || (i === nearest.length - 1 && nearest.length < 3)) {
            const obj = { distance: d, point: p };
            if (nearest.length >= 3) {
              nearest.splice(i, 1, obj);
            } else if (d < n.distance) {
              nearest.splice(i, 0, obj);
            } else {
              nearest.splice(i + 1, 0, obj);
            }
            break;
          }
        }
      }
    }

    let x = 0;
    let y = 0;

    switch (nearest.length) {
      case 0:
        x = point.x;
        y = point.y;
        break;

      case 1:
        x = point.x - nearest[0].point.x;
        y = point.y - nearest[0].point.y;
        break;

      case 2:
      case 3: {
        const [a, b] = this.findLine(nearest[0].point, nearest[1].point);
        let intersection;

        if (nearest.length === 2) {
          intersection = this.findNearestPointOfLine(a, b, point);
        } else {
          const [a2, b2] = this.findLine(point, nearest[2].point);
          // TODO: special procedure for parallel lines (a == a2)
          const iX = (b2 - b) / (a - a2);
          const iY = a * iX + b;
          intersection = new Point(iX, iY);
        }

        const baseD = nearest[0].point.distanceTo(nearest[1].point);
        const directionX =
          (intersection.x - nearest[0].point.x) * (nearest[1].point.x - nearest[0].point.x) > 0
            ? 1
            : -1;
        const dX = nearest[0].point.distanceTo(intersection);
        x = (dX * directionX) / baseD;

        const dY = point.distanceTo(intersection);
        let directionY;

        if (nearest.length === 2) {
          directionY =
            (point.y - intersection.y) * (nearest[1].point.x - nearest[0].point.x) < 0 ? 1 : -1;
        } else {
          const baseD2 = nearest[2].point.distanceTo(intersection);
          directionY =
            (point.x - intersection.x) * (nearest[2].point.x - intersection.x) > 0 ? 1 : -1;
          y = (dY * directionY) / baseD2;
          break;
        }
        y = dY * directionY / baseD;
        break;
      }
    }

    const nearestIndices = nearest.map((n) => this.points.indexOf(n.point));
    return { points: nearestIndices, x, y };
  }

  /**
   * Resolve relative position to absolute coordinates
   * @param {Object} position - Relative position data
   * @returns {Object} Absolute coordinates {x, y}
   */
  resolveRelativePosition(position) {
    let x, y;

    switch (position.points.length) {
      case 0:
        x = position.x;
        y = position.y;
        break;

      case 1: {
        const point = this.points[position.points[0]];
        x = point.x + position.x;
        y = point.y + position.y;
        break;
      }

      case 2:
      case 3: {
        const point1 = this.points[position.points[0]];
        const point2 = this.points[position.points[1]];
        const iX = (point2.x - point1.x) * position.x + point1.x;
        const iY = (point2.y - point1.y) * position.x + point1.y;
        const intersection = new Point(iX, iY);

        let dX, dY;
        if (position.points.length === 2) {
          dX = (point2.y - point1.y) * position.y;
          dY = -(point2.x - point1.x) * position.y;
        } else {
          const point3 = this.points[position.points[2]];
          dX = (point3.x - intersection.x) * position.y;
          dY = (point3.y - intersection.y) * position.y;
        }

        x = intersection.x + dX;
        y = intersection.y + dY;
        break;
      }
    }

    return { x, y };
  }

  /**
   * Find line equation from two points
   * @param {Point} p1 - First point
   * @param {Point} p2 - Second point
   * @returns {number[]} [slope, intercept] or [null, x] for vertical line
   */
  findLine(p1, p2) {
    if (p1.x - p2.x) {
      const a = (p1.y - p2.y) / (p1.x - p2.x);
      const b = p1.y - a * p1.x;
      return [a, b];
    } else {
      // Vertical line
      return [null, p1.x];
    }
  }

  /**
   * Find nearest point on a line to a given point
   * @param {number} a - Line slope (or null for vertical)
   * @param {number} b - Line intercept (or x for vertical)
   * @param {Point} p - Target point
   * @returns {Point} Nearest point on line
   */
  findNearestPointOfLine(a, b, p) {
    let x, y;

    if (a !== null) {
      const normalA = -1 / a;
      const normalB = p.y - normalA * p.x;
      x = (normalB - b) / (a - normalA);
      y = a * x + b;
    } else {
      // Vertical line
      x = b;
      y = p.y;
    }

    return new Point(x, y);
  }

  // Edges

  /**
   * Split an edge between two points
   * @param {Point} p1 - First point
   * @param {Point} p2 - Second point
   */
  splitEdge(p1, p2) {
    const i1 = this.points.indexOf(p1);
    const i2 = this.points.indexOf(p2);
    const p4 = this.addPoint({ points: [i1, i2], x: 0.5, y: 0 });
    const i4 = this.points.indexOf(p4);

    let i = 0;
    while (i < this.triangles.length) {
      const triangle = this.triangles[i];
      if (triangle.hasPoint(p1) && triangle.hasPoint(p2)) {
        let p3;
        for (const point of [triangle.p1, triangle.p2, triangle.p3]) {
          if (point !== p1 && point !== p2) {
            p3 = point;
          }
        }
        const i3 = this.points.indexOf(p3);

        triangle.remove();
        this.addTriangle(i1, i3, i4);
        this.addTriangle(i2, i3, i4);
      } else {
        i++;
      }
    }
  }

  // Triangles

  /**
   * Add a triangle to the mesh
   * @param {number} p1 - First point index
   * @param {number} p2 - Second point index
   * @param {number} p3 - Third point index
   */
  addTriangle(p1, p2, p3) {
    if (!this.points[p1] || !this.points[p2] || !this.points[p3]) return;

    const triangle = new Triangle(this.points[p1], this.points[p2], this.points[p3]);
    // Use pre-bound method
    triangle.on('remove', this.removeTriangle);
    this.triangles.push(triangle);
    this.trigger('triangle:add', this, p1, p2, p3, triangle);
  }

  /**
   * Remove a triangle from the mesh
   * @param {Triangle|number} triangle - Triangle instance or index
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.silent=false] - Suppress events
   */
  removeTriangle(triangle, params = {}) {
    let i;
    if (triangle instanceof Triangle) {
      i = this.triangles.indexOf(triangle);
    } else {
      i = triangle;
      triangle = this.triangles[i];
    }

    if (i !== undefined && i !== -1) {
      this.triangles.splice(i, 1);
      // Use pre-bound method
      triangle.off('remove', this.removeTriangle);
      triangle.remove();
      if (!params.silent) {
        this.trigger('triangle:remove', this, triangle, i);
      }
    }
  }

  // JSON

  /**
   * Convert mesh to JSON
   * @returns {Object} Mesh data
   */
  toJSON() {
    const json = {};
    json.points = [];
    for (const point of this.points) {
      json.points.push(point.toJSON());
    }
    return json;
  }

  /**
   * Load mesh data from JSON
   * @param {Object} [json={}] - Mesh data
   * @param {Object} [params={}] - Optional parameters
   * @param {boolean} [params.hard=false] - Reset before loading
   */
  fromJSON(json = {}, params = {}) {
    if (params.hard) {
      this.reset();
    }

    if (json.points) {
      for (let i = 0; i < json.points.length; i++) {
        const point = json.points[i];
        if (i > this.points.length - 1) {
          this.addPoint(point, params);
        } else {
          this.points[i].fromJSON(point, params);
        }
      }
    }
  }

  /**
   * Reset mesh by removing all points
   */
  reset() {
    for (const point of this.points) {
      this.removePoint(point);
    }
  }

  /**
   * Remove mesh and all triangles
   */
  remove() {
    while (this.triangles[0]) {
      this.removeTriangle(this.triangles[0], { silent: true });
    }
  }
}
