# MorpherJS Demos

This example showcases all the original MorpherJS demonstrations, fully migrated to work with v2.0.

## What's Included

### Demo 1: Basic Setup
Simple two-image morph with play/reset buttons and slider control.
- Plum → Raspberry morphing
- Manual slider control
- Play animation button

### Demo 2: Multiple Images, Different Sizes
Three parrot images with independent weight controls.
- Individual sliders for each image
- Optional weight normalization
- Different image dimensions

### Demo 3: Easing Functions
Demonstrates various animation easing options.
- Ease In Out Cubic - smooth acceleration/deceleration
- Elastic Bounce - spring-like bounce effect
- Custom Stepwise - custom easing function

### Demo 4: Blend & Final Touch Functions
Shows how to customize image blending.
- Custom blend function creating a glow effect
- Final touch function for threshold effects
- Toggle custom functions on/off

### Demo 5: Defining Mesh with API
Demonstrates programmatic mesh creation.
- Mix of image sources (file, Image object, canvas)
- API-based point and triangle creation
- Point manipulation per image

## Key Differences from v1.x

### Removed
- jQuery dependency (now vanilla JavaScript)
- jQuery UI easing functions (custom implementations)
- Global namespace pollution

### Updated
- ES6 module imports instead of global `Morpher`
- Native event listeners instead of jQuery
- Modern Array methods (forEach, map, reduce)
- Arrow functions and const/let

### Kept
- All original functionality
- Same JSON configuration format
- Same API structure
- All visual effects

## Running

```bash
npm run dev
```

Navigate to: `http://localhost:3000/examples/demos/`

## Code Highlights

### Vanilla JavaScript Event Handling
```javascript
// Old (v1.x with jQuery)
$('#demo').find('button').click(function() { ... })

// New (v2.0 vanilla JS)
demo.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => { ... });
});
```

### ES6 Module Imports
```javascript
// Old (v1.x)
var morpher = new Morpher(json);

// New (v2.0)
import { Morpher } from '../../src/index.js';
const morpher = new Morpher(json);
```

### Modern Array Methods
```javascript
// Weight normalization with reduce and map
const normalizeFactors = () => {
  const total = factors.reduce((a, b) => a + b);
  const gain = (1 - Math.min(total, 1)) / factors.length;
  return factors.map(f => f / Math.max(total, 1) + gain);
};
```

## Images Used

- `plum.png` / `plum-contour.png`
- `raspberry.png` / `raspberry-contour.png`
- `parrot-1.jpg` (red parrot)
- `parrot-2.jpg` (green parrot)
- `parrot-3.jpg` (blue parrot)

All images are located in `public/images/`.

## Custom Functions

### Easing Functions
All easing functions are implemented natively in JavaScript:

- **easeInOutCubic**: Smooth cubic acceleration/deceleration
- **easeOutElastic**: Elastic bounce effect
- **custom**: Stepwise animation effect

### Blend Function
The custom blend function creates a glow effect by:
1. Detecting opaque pixels in the source
2. Creating a radius around each pixel
3. Applying weighted alpha to surrounding pixels

### Final Touch Function
The threshold function:
1. Reads the final canvas
2. Applies threshold to alpha channel
3. Creates a crisp, binary alpha effect

## Learning Points

This demo helps you understand:
1. How to set up MorpherJS with JSON configuration
2. How to handle multiple images with different sizes
3. How to use custom easing functions
4. How to create custom blend algorithms
5. How to use the programmatic API

## Browser Compatibility

Works in all modern browsers supporting:
- ES6 modules
- Canvas API
- ImageData manipulation
- requestAnimationFrame

## Notes

- All jQuery dependencies have been removed
- All functionality from the original demos is preserved
- Performance is improved with modern JavaScript
- Code is more maintainable with ES6+ features
