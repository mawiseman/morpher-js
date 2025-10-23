/**
 * Matrix
 *
 * 3x3 transformation matrix for 2D affine transformations
 * Supports translate, scale, rotate, shear, skew operations
 *
 * @class Matrix
 */
export class Matrix {
  /**
   * Create a new Matrix
   * @param {...number} args - Optional initial matrix values (9 values for 3x3 matrix)
   */
  constructor(...args) {
    // Identity matrix by default
    this.values = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    // Override with provided values
    for (let i = 0; i < args.length && i < 9; i++) {
      this.values[i] = args[i];
    }

    this.transforms = [];
  }

  /**
   * Get value at position (i, j)
   * @param {number} i - Row index (0-2)
   * @param {number} j - Column index (0-2)
   * @returns {number} Matrix value
   */
  get(i, j) {
    return this.values[i * 3 + j];
  }

  /**
   * Set value at position (i, j)
   * @param {number} i - Row index (0-2)
   * @param {number} j - Column index (0-2)
   * @param {number} value - Value to set
   */
  set(i, j, value) {
    this.values[i * 3 + j] = value;
  }

  /**
   * Add translation transformation
   * @param {number} [tx=0] - X translation
   * @param {number} [ty=0] - Y translation
   * @returns {Matrix} Returns this for chaining
   */
  translate(tx = 0, ty = 0) {
    this.transforms.unshift(new Matrix(1, 0, tx, 0, 1, ty, 0, 0, 1));
    return this;
  }

  /**
   * Add scale transformation
   * @param {number} [sx=1] - X scale factor
   * @param {number} [sy=1] - Y scale factor
   * @returns {Matrix} Returns this for chaining
   */
  scale(sx = 1, sy = 1) {
    this.transforms.unshift(new Matrix(sx, 0, 0, 0, sy, 0, 0, 0, 1));
    return this;
  }

  /**
   * Add skew transformation
   * @param {number} [sx=0] - X skew angle in radians
   * @param {number} [sy=0] - Y skew angle in radians
   * @returns {Matrix} Returns this for chaining
   */
  skew(sx = 0, sy = 0) {
    this.transforms.unshift(new Matrix(1, Math.tan(sx), 0, Math.tan(sy), 1, 0, 0, 0, 1));
    return this;
  }

  /**
   * Add rotation transformation
   * @param {number} a - Rotation angle in radians
   * @returns {Matrix} Returns this for chaining
   */
  rotate(a) {
    this.transforms.unshift(
      new Matrix(Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1)
    );
    return this;
  }

  /**
   * Add shear transformation
   * @param {number} [sx=0] - X shear factor
   * @param {number} [sy=0] - Y shear factor
   * @returns {Matrix} Returns this for chaining
   */
  shear(sx = 0, sy = 0) {
    this.transforms.unshift(new Matrix(1, sx, 0, sy, 1, 0, 0, 0, 1));
    return this;
  }

  /**
   * Remove transformation at index
   * @param {number} i - Index of transformation to remove (from end)
   */
  removeTransform(i) {
    this.transforms.splice(this.transforms.length - 1 - i, 1);
  }

  /**
   * Apply all accumulated transformations
   * @param {boolean} [onSelf=false] - Apply on this matrix or create new one
   * @returns {Matrix} Resulting matrix
   */
  apply(onSelf = false) {
    const matr = onSelf ? this : new Matrix();
    for (const transform of this.transforms) {
      matr.multiplyWith(transform, true);
    }
    return matr;
  }

  /**
   * Convert matrix to CSS transform string
   * @returns {string} CSS matrix string
   */
  toCSS() {
    return `matrix(${this.toTransform().join(', ')})`;
  }

  /**
   * Convert to transform array for CSS/Canvas
   * @returns {number[]} Array of 6 values for 2D transform
   */
  toTransform() {
    return [
      this.get(0, 0),
      this.get(1, 0),
      this.get(0, 1),
      this.get(1, 1),
      this.get(0, 2),
      this.get(1, 2)
    ];
  }

  /**
   * Multiply this matrix with another matrix
   * @param {Matrix} matrix - Matrix to multiply with
   * @param {boolean} [dontApply=false] - Skip applying transforms first
   * @returns {Matrix} Returns this for chaining
   */
  multiplyWith(matrix, dontApply = false) {
    if (!dontApply) {
      this.apply(true);
    }

    const values = [];
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++) {
        let sum = 0;
        for (let k = 0; k <= 2; k++) {
          sum += this.get(i, k) * matrix.get(k, j);
        }
        values.push(sum);
      }
    }

    this.values = values;
    return this;
  }
}
