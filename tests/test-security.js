/**
 * Test script for Security Features
 * Run with: node test-security.js
 */

import { Morpher } from './src/morpher.js';

console.log('🔒 Testing Security Features...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Blend function validation - valid function
test('Blend function validation - valid function', () => {
  const validFn = (dest, src, weight) => {};
  const result = Morpher.validateBlendFunction(validFn);
  assert(result === validFn, 'Should accept valid function');
});

// Test 2: Blend function validation - wrong parameter count
test('Blend function validation - wrong parameter count', () => {
  const invalidFn = (dest) => {}; // Only 1 param
  const result = Morpher.validateBlendFunction(invalidFn);
  assert(result === null, 'Should reject function with wrong parameter count');
});

// Test 3: Blend function validation - predefined name
test('Blend function validation - predefined name', () => {
  const result = Morpher.validateBlendFunction('default');
  assert(typeof result === 'function', 'Should resolve predefined name to function');
  assert(result === Morpher.defaultBlendFunction, 'Should resolve to correct function');
});

// Test 4: Blend function validation - unknown name
test('Blend function validation - unknown name', () => {
  const result = Morpher.validateBlendFunction('nonexistent');
  assert(result === null, 'Should reject unknown function name');
});

// Test 5: Blend function validation - reject non-function
test('Blend function validation - reject non-function', () => {
  const result = Morpher.validateBlendFunction({ malicious: 'object' });
  assert(result === null, 'Should reject non-function objects');
});

// Test 6: Easing function validation - valid function
test('Easing function validation - valid function', () => {
  const validFn = (t) => t * t;
  const result = Morpher.validateEasingFunction(validFn);
  assert(result === validFn, 'Should accept valid easing function');
});

// Test 7: Easing function validation - wrong parameter count
test('Easing function validation - wrong parameter count', () => {
  const invalidFn = (t, extra) => t * t; // 2 params instead of 1
  const result = Morpher.validateEasingFunction(invalidFn);
  assert(result === null, 'Should reject function with wrong parameter count');
});

// Test 8: Easing function validation - predefined name
test('Easing function validation - predefined name', () => {
  const result = Morpher.validateEasingFunction('easeInQuad');
  assert(typeof result === 'function', 'Should resolve predefined easing name');
  assert(result === Morpher.easingFunctions.easeInQuad, 'Should resolve to correct function');
});

// Test 9: JSON sanitization - safe input
test('JSON sanitization - safe input', () => {
  const safe = {
    images: [{ src: 'image.jpg', x: 100, y: 200, points: [{ x: 0, y: 0 }] }],
    triangles: [[0, 1, 2]]
  };
  const result = Morpher.sanitizeJSON(safe);
  assert(result.images.length === 1, 'Should preserve safe images');
  assert(result.triangles.length === 1, 'Should preserve safe triangles');
});

// Test 10: JSON sanitization - dangerous URL protocols
test('JSON sanitization - dangerous URL protocols', () => {
  const dangerous = {
    images: [{ src: 'javascript:alert("XSS")', x: 0, y: 0 }]
  };
  const result = Morpher.sanitizeJSON(dangerous);
  assert(!result.images[0].src, 'Should remove javascript: URLs');
});

// Test 11: JSON sanitization - data:text/html
test('JSON sanitization - data:text/html', () => {
  const dangerous = {
    images: [{ src: 'data:text/html,<script>alert("XSS")</script>', x: 0, y: 0 }]
  };
  const result = Morpher.sanitizeJSON(dangerous);
  assert(!result.images[0].src, 'Should remove data:text/html URLs');
});

// Test 12: JSON sanitization - safe data URLs
test('JSON sanitization - safe data URLs', () => {
  const safe = {
    images: [{ src: 'data:image/png;base64,iVBORw0KGgo=', x: 0, y: 0 }]
  };
  const result = Morpher.sanitizeJSON(safe);
  assert(result.images[0].src === safe.images[0].src, 'Should allow safe data URLs');
});

// Test 13: JSON sanitization - invalid numbers
test('JSON sanitization - invalid numbers', () => {
  const invalid = {
    images: [{ src: 'test.jpg', x: 'not a number', y: Infinity, points: [] }]
  };
  const result = Morpher.sanitizeJSON(invalid);
  assert(!result.images[0].x, 'Should reject non-numeric x');
  assert(!result.images[0].y, 'Should reject Infinity');
});

// Test 14: JSON sanitization - malicious point data
test('JSON sanitization - malicious point data', () => {
  const malicious = {
    images: [{
      src: 'test.jpg',
      points: [
        { x: NaN, y: Infinity },
        { x: 'invalid', y: 100 },
        'not an object'
      ]
    }]
  };
  const result = Morpher.sanitizeJSON(malicious);
  assert(result.images[0].points[0].x === 0, 'Should default NaN to 0');
  assert(result.images[0].points[0].y === 0, 'Should default Infinity to 0');
  assert(result.images[0].points[1].x === 0, 'Should default invalid string to 0');
  assert(result.images[0].points[2].x === 0, 'Should default non-object to {x:0, y:0}');
});

// Test 15: JSON sanitization - triangle validation
test('JSON sanitization - triangle validation', () => {
  const invalid = {
    triangles: [
      [0, 1, 2], // Valid
      [0, 1], // Too short
      [0, 1, 2, 3], // Too long
      'not an array',
      [1.5, 2.7, 3.9], // Floats
      [-1, 0, 1] // Negative
    ]
  };
  const result = Morpher.sanitizeJSON(invalid);
  assert(result.triangles[0][0] === 0, 'Should preserve valid triangle');
  assert(result.triangles[1][0] === 0, 'Should default invalid triangle');
  assert(result.triangles[4][0] === 1, 'Should floor float indices');
  assert(result.triangles[5][0] === 0, 'Should default negative indices to 0');
});

// Test 16: setBlendFunction with valid function
test('setBlendFunction - valid function', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const fn = (dest, src, weight) => {};
  const result = morpher.setBlendFunction(fn);
  assert(result === true, 'Should return true for valid function');
  assert(morpher.blendFunction === fn, 'Should set the function');
  morpher.dispose();
});

// Test 17: setBlendFunction with predefined name
test('setBlendFunction - predefined name', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const result = morpher.setBlendFunction('multiply');
  assert(result === true, 'Should return true for valid name');
  assert(morpher.blendFunction === Morpher.multiplyBlendFunction, 'Should set correct function');
  morpher.dispose();
});

// Test 18: setBlendFunction with invalid input
test('setBlendFunction - invalid input', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const result = morpher.setBlendFunction('invalid');
  assert(result === false, 'Should return false for invalid input');
  morpher.dispose();
});

// Test 19: setFinalTouchFunction with valid function
test('setFinalTouchFunction - valid function', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const fn = (canvas) => {};
  const result = morpher.setFinalTouchFunction(fn);
  assert(result === true, 'Should return true for valid function');
  assert(morpher.finalTouchFunction === fn, 'Should set the function');
  morpher.dispose();
});

// Test 20: setFinalTouchFunction with wrong parameters
test('setFinalTouchFunction - wrong parameters', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const fn = (canvas, extra) => {}; // 2 params instead of 1
  const result = morpher.setFinalTouchFunction(fn);
  assert(result === false, 'Should return false for wrong parameter count');
  morpher.dispose();
});

// Test 21: Predefined blend functions exist
test('Predefined blend functions exist', () => {
  assert(typeof Morpher.defaultBlendFunction === 'function', 'defaultBlendFunction should exist');
  assert(typeof Morpher.normalBlendFunction === 'function', 'normalBlendFunction should exist');
  assert(typeof Morpher.multiplyBlendFunction === 'function', 'multiplyBlendFunction should exist');
  assert(typeof Morpher.screenBlendFunction === 'function', 'screenBlendFunction should exist');
  assert(typeof Morpher.softwareBlendFunction === 'function', 'softwareBlendFunction should exist');
});

// Test 22: Predefined easing functions exist
test('Predefined easing functions exist', () => {
  const easingNames = ['linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic'];
  for (const name of easingNames) {
    assert(typeof Morpher.easingFunctions[name] === 'function', `${name} should exist`);
  }
});

// Test 23: Animate with predefined easing
test('Animate with predefined easing', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  morpher.animate([0.5], 500, 'easeInQuad');
  assert(morpher.easingFunction === Morpher.easingFunctions.easeInQuad, 'Should set predefined easing');
  morpher.dispose();
});

// Test 24: Animate with custom easing
test('Animate with custom easing', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const customEasing = (t) => t * t * t;
  morpher.animate([0.5], 500, customEasing);
  assert(morpher.easingFunction === customEasing, 'Should set custom easing');
  morpher.dispose();
});

// Test 25: fromJSON sanitizes input
test('fromJSON sanitizes input', () => {
  const morpher = new Morpher({ canvas: document.createElement('canvas') });
  const dangerousJSON = {
    images: [{ src: 'javascript:alert("XSS")', x: 0, y: 0 }],
    blendFunction: 'multiply'
  };
  morpher.fromJSON(dangerousJSON);
  assert(morpher.images.length === 0, 'Should not add image with dangerous URL');
  assert(morpher.blendFunction === Morpher.multiplyBlendFunction, 'Should set blend function from name');
  morpher.dispose();
});

// Test 26: No eval() in codebase
test('No eval() in codebase', () => {
  // This is more of a static check, but we can verify functions don't use eval
  const fnString = Morpher.validateBlendFunction.toString();
  assert(!fnString.includes('eval'), 'Should not use eval()');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}/${testsPassed + testsFailed}`);
console.log(`Tests failed: ${testsFailed}/${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('\n✅ All security tests passed!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
