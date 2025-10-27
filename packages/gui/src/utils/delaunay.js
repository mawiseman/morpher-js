/**
 * Delaunay Triangulation
 *
 * Implements Bowyer-Watson algorithm for computing Delaunay triangulation
 * of a set of 2D points.
 *
 * @module utils/delaunay
 */

/**
 * Compute Delaunay triangulation of points
 * @param {Array<{x: number, y: number}>} points - Array of points with x, y coordinates (0-1 normalized)
 * @returns {Array<[number, number, number]>} Array of triangles as index triplets
 */
export function triangulate(points) {
  if (points.length < 3) {
    return [];
  }

  // Create a copy of points to avoid mutating the input
  const workingPoints = points.slice();

  // Create super-triangle that contains all points
  const superTriangle = createSuperTriangle(workingPoints);

  // Initialize triangulation with super-triangle
  const triangles = [superTriangle];

  // Add each point one at a time (using original count, not working array)
  for (let i = 0; i < points.length; i++) {
    const point = workingPoints[i];
    const badTriangles = [];

    // Find all triangles whose circumcircle contains the point
    for (let j = triangles.length - 1; j >= 0; j--) {
      const triangle = triangles[j];
      if (inCircumcircle(point, triangle, workingPoints)) {
        badTriangles.push(triangle);
        triangles.splice(j, 1);
      }
    }

    // Find the boundary of the polygonal hole
    const polygon = [];
    for (const triangle of badTriangles) {
      for (let j = 0; j < 3; j++) {
        const edge = [triangle[j], triangle[(j + 1) % 3]];

        // Check if edge is shared with another bad triangle
        let isShared = false;
        for (const other of badTriangles) {
          if (other === triangle) continue;
          if (hasEdge(other, edge[0], edge[1])) {
            isShared = true;
            break;
          }
        }

        if (!isShared) {
          polygon.push(edge);
        }
      }
    }

    // Re-triangulate the polygonal hole
    for (const edge of polygon) {
      triangles.push([edge[0], edge[1], i]);
    }
  }

  // Remove triangles that contain super-triangle vertices
  // (super-triangle vertices are at indices >= original points.length)
  const result = triangles.filter(triangle => {
    return triangle[0] < points.length &&
           triangle[1] < points.length &&
           triangle[2] < points.length;
  });

  return result;
}

/**
 * Create a super-triangle that contains all points
 * @param {Array<{x: number, y: number}>} points
 * @returns {[number, number, number]} Triangle as index triplet
 */
function createSuperTriangle(points) {
  // Find bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;
  const deltaMax = Math.max(dx, dy);
  const midx = (minX + maxX) / 2;
  const midy = (minY + maxY) / 2;

  // Add three super-triangle vertices (much larger than bounding box)
  const st1 = { x: midx - 20 * deltaMax, y: midy - deltaMax };
  const st2 = { x: midx, y: midy + 20 * deltaMax };
  const st3 = { x: midx + 20 * deltaMax, y: midy - deltaMax };

  points.push(st1, st2, st3);

  return [points.length - 3, points.length - 2, points.length - 1];
}

/**
 * Check if point is inside the circumcircle of a triangle
 * @param {{x: number, y: number}} point
 * @param {[number, number, number]} triangle - Triangle as index triplet
 * @param {Array<{x: number, y: number}>} points - All points
 * @returns {boolean}
 */
function inCircumcircle(point, triangle, points) {
  const p1 = points[triangle[0]];
  const p2 = points[triangle[1]];
  const p3 = points[triangle[2]];

  if (!p1 || !p2 || !p3) {
    return false;
  }

  const ax = p1.x - point.x;
  const ay = p1.y - point.y;
  const bx = p2.x - point.x;
  const by = p2.y - point.y;
  const cx = p3.x - point.x;
  const cy = p3.y - point.y;

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  // For counter-clockwise triangles, det < 0 means point is inside
  return det < 0;
}

/**
 * Check if triangle has a specific edge
 * @param {[number, number, number]} triangle
 * @param {number} p1 - First point index
 * @param {number} p2 - Second point index
 * @returns {boolean}
 */
function hasEdge(triangle, p1, p2) {
  return (
    (triangle[0] === p1 && triangle[1] === p2) ||
    (triangle[1] === p1 && triangle[2] === p2) ||
    (triangle[2] === p1 && triangle[0] === p2) ||
    (triangle[0] === p2 && triangle[1] === p1) ||
    (triangle[1] === p2 && triangle[2] === p1) ||
    (triangle[2] === p2 && triangle[0] === p1)
  );
}
