/**
 * Tests for colors utility
 */

import { describe, it, expect } from 'vitest';
import * as colors from '../../src/utils/colors.js';

describe('colors', () => {
  describe('hslToRgb', () => {
    it('should convert HSL to RGB', () => {
      const rgb = colors.hslToRgb(0, 1, 0.5); // Red
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle gray (zero saturation)', () => {
      const rgb = colors.hslToRgb(0, 0, 0.5);
      expect(rgb.r).toBe(rgb.g);
      expect(rgb.g).toBe(rgb.b);
      expect(rgb.r).toBe(128);
    });

    it('should handle white', () => {
      const rgb = colors.hslToRgb(0, 0, 1);
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should handle black', () => {
      const rgb = colors.hslToRgb(0, 0, 0);
      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL', () => {
      const hsl = colors.rgbToHsl(255, 0, 0); // Red
      expect(hsl.h).toBeCloseTo(0);
      expect(hsl.s).toBe(1);
      expect(hsl.l).toBe(0.5);
    });

    it('should handle gray', () => {
      const hsl = colors.rgbToHsl(128, 128, 128);
      expect(hsl.s).toBe(0);
    });

    it('should round-trip with hslToRgb', () => {
      const originalRgb = { r: 123, g: 45, b: 200 };
      const hsl = colors.rgbToHsl(originalRgb.r, originalRgb.g, originalRgb.b);
      const convertedRgb = colors.hslToRgb(hsl.h, hsl.s, hsl.l);

      expect(convertedRgb.r).toBeCloseTo(originalRgb.r, 0);
      expect(convertedRgb.g).toBeCloseTo(originalRgb.g, 0);
      expect(convertedRgb.b).toBeCloseTo(originalRgb.b, 0);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(colors.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(colors.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(colors.rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('should handle white and black', () => {
      expect(colors.rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(colors.rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should pad single digits', () => {
      expect(colors.rgbToHex(15, 10, 5)).toBe('#0f0a05');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(colors.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(colors.hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(colors.hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex without #', () => {
      expect(colors.hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle 3-digit hex', () => {
      expect(colors.hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(colors.hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex', () => {
      expect(colors.hexToRgb('invalid')).toBeNull();
      expect(colors.hexToRgb('#gg0000')).toBeNull();
    });

    it('should round-trip with rgbToHex', () => {
      const hex = '#1a2b3c';
      const rgb = colors.hexToRgb(hex);
      const convertedHex = colors.rgbToHex(rgb.r, rgb.g, rgb.b);
      expect(convertedHex).toBe(hex);
    });
  });

  describe('randomPastelColor', () => {
    it('should generate valid RGB string', () => {
      const color = colors.randomPastelColor();
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should generate different colors', () => {
      const colors1 = [];
      for (let i = 0; i < 10; i++) {
        colors1.push(colors.randomPastelColor());
      }

      const uniqueColors = new Set(colors1);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });
  });

  describe('rgbToString', () => {
    it('should convert RGB object to string', () => {
      const rgb = { r: 255, g: 128, b: 64 };
      expect(colors.rgbToString(rgb)).toBe('rgb(255, 128, 64)');
    });
  });

  describe('rgbToRgbaString', () => {
    it('should convert RGB object to RGBA string', () => {
      const rgb = { r: 255, g: 128, b: 64 };
      expect(colors.rgbToRgbaString(rgb, 0.5)).toBe('rgba(255, 128, 64, 0.5)');
    });
  });

  describe('parseColor', () => {
    it('should parse hex color', () => {
      expect(colors.parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should parse rgb() color', () => {
      expect(colors.parseColor('rgb(255, 128, 64)')).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should parse rgba() color', () => {
      expect(colors.parseColor('rgba(255, 128, 64, 0.5)')).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should return null for invalid color', () => {
      expect(colors.parseColor('invalid')).toBeNull();
    });
  });

  describe('lighten', () => {
    it('should lighten a color', () => {
      const rgb = { r: 128, g: 128, b: 128 };
      const lightened = colors.lighten(rgb, 20);

      // Lightened color should have higher RGB values
      expect(lightened.r).toBeGreaterThan(rgb.r);
      expect(lightened.g).toBeGreaterThan(rgb.g);
      expect(lightened.b).toBeGreaterThan(rgb.b);
    });
  });

  describe('darken', () => {
    it('should darken a color', () => {
      const rgb = { r: 128, g: 128, b: 128 };
      const darkened = colors.darken(rgb, 20);

      // Darkened color should have lower RGB values
      expect(darkened.r).toBeLessThan(rgb.r);
      expect(darkened.g).toBeLessThan(rgb.g);
      expect(darkened.b).toBeLessThan(rgb.b);
    });
  });

  describe('saturate', () => {
    it('should saturate a color', () => {
      const rgb = { r: 150, g: 100, b: 100 };
      const saturated = colors.saturate(rgb, 20);

      // Saturation increases color difference
      const originalDiff = Math.abs(rgb.r - rgb.g);
      const saturatedDiff = Math.abs(saturated.r - saturated.g);

      expect(saturatedDiff).toBeGreaterThan(originalDiff);
    });
  });

  describe('desaturate', () => {
    it('should desaturate a color', () => {
      const rgb = { r: 255, g: 0, b: 0 };
      const desaturated = colors.desaturate(rgb, 50);

      // Desaturated color should be closer to gray
      expect(desaturated.g).toBeGreaterThan(rgb.g);
      expect(desaturated.b).toBeGreaterThan(rgb.b);
    });
  });
});
