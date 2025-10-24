/**
 * Color Utility Functions
 *
 * Provides color conversion and manipulation utilities.
 * Based on the legacy GUI color utilities.
 */

/**
 * Convert HSL to RGB
 *
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {{r: number, g: number, b: number}} - RGB values (0-255)
 */
export function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSL
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{h: number, s: number, l: number}} - HSL values (0-1)
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * Convert RGB to Hex
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} - Hex color (e.g., '#ff0000')
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert Hex to RGB
 *
 * @param {string} hex - Hex color (e.g., '#ff0000' or 'ff0000')
 * @returns {{r: number, g: number, b: number}|null} - RGB values or null if invalid
 */
export function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const num = parseInt(hex, 16);

  if (isNaN(num)) {
    return null;
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Generate a random color in RGB format
 *
 * @returns {{r: number, g: number, b: number}} - Random RGB color
 */
export function randomRgb() {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

/**
 * Generate a random pastel color (for project themes)
 * Uses random hue with controlled saturation and lightness
 *
 * @returns {string} - RGB color string (e.g., 'rgb(180, 120, 200)')
 */
export function randomPastelColor() {
  const h = Math.random(); // Random hue (0-1)
  const s = 0.4 + Math.random() * 0.3; // Saturation 40-70%
  const l = 0.5 + Math.random() * 0.2; // Lightness 50-70%

  const rgb = hslToRgb(h, s, l);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Convert RGB object to CSS rgb() string
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB object
 * @returns {string} - RGB string (e.g., 'rgb(255, 0, 0)')
 */
export function rgbToString(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Convert RGB object to CSS rgba() string
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB object
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} - RGBA string (e.g., 'rgba(255, 0, 0, 0.5)')
 */
export function rgbToRgbaString(rgb, alpha) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Parse CSS color string to RGB
 * Supports: hex (#fff, #ffffff), rgb(r,g,b), rgba(r,g,b,a)
 *
 * @param {string} color - CSS color string
 * @returns {{r: number, g: number, b: number}|null} - RGB object or null
 */
export function parseColor(color) {
  color = color.trim();

  // Hex format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // RGB/RGBA format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * Lighten a color by a percentage
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB color
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {{r: number, g: number, b: number}} - Lightened RGB color
 */
export function lighten(rgb, percent) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(1, hsl.l + percent / 100);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

/**
 * Darken a color by a percentage
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB color
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {{r: number, g: number, b: number}} - Darkened RGB color
 */
export function darken(rgb, percent) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - percent / 100);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

/**
 * Saturate a color by a percentage
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB color
 * @param {number} percent - Percentage to saturate (0-100)
 * @returns {{r: number, g: number, b: number}} - Saturated RGB color
 */
export function saturate(rgb, percent) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.min(1, hsl.s + percent / 100);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

/**
 * Desaturate a color by a percentage
 *
 * @param {{r: number, g: number, b: number}} rgb - RGB color
 * @param {number} percent - Percentage to desaturate (0-100)
 * @returns {{r: number, g: number, b: number}} - Desaturated RGB color
 */
export function desaturate(rgb, percent) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, hsl.s - percent / 100);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

// Default export
export default {
  hslToRgb,
  rgbToHsl,
  rgbToHex,
  hexToRgb,
  randomRgb,
  randomPastelColor,
  rgbToString,
  rgbToRgbaString,
  parseColor,
  lighten,
  darken,
  saturate,
  desaturate,
};
