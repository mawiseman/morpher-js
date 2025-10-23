# morpher-js

> JavaScript image morphing library using HTML5 Canvas

Modern ES6+ image morphing library that creates smooth transitions between multiple images using mesh deformation techniques.

## Installation

```bash
npm install morpher-js
```

## Quick Start

```javascript
import { Morpher } from 'morpher-js';

// Create a morpher instance
const morpher = new Morpher({
  images: [
    { src: 'image1.jpg' },
    { src: 'image2.jpg' },
    { src: 'image3.jpg' }
  ]
});

// Attach to canvas
const canvas = document.getElementById('canvas');
morpher.attach(canvas);

// Set blend weights (must sum to 1.0)
morpher.set([0.5, 0.5, 0.0]);

// Animate between states
morpher.animate([0.0, 0.0, 1.0], 2000); // 2 second transition
```

## Features

- **Modern ES6+ JavaScript** - Clean, maintainable codebase
- **Multiple Module Formats** - ESM, CommonJS, and UMD builds
- **Zero Dependencies** - Lightweight and fast
- **Canvas-based Rendering** - Hardware-accelerated graphics
- **Mesh Deformation** - Triangle-based morphing for smooth transitions
- **Custom Blend Functions** - Create your own morphing effects
- **Worker Support** - Offload heavy computation to web workers
- **TypeScript Definitions** - Full type safety

## API Overview

### Morpher Class

The main class for creating morphing effects.

```javascript
const morpher = new Morpher(options);
```

**Options:**
- `images` - Array of image objects or paths
- `triangles` - Custom mesh triangulation
- `blendFunction` - Custom blend function

**Methods:**
- `attach(canvas)` - Attach to HTML5 canvas element
- `addImage(image)` - Add an image to the morpher
- `removeImage(image)` - Remove an image
- `set(weights)` - Set blend weights instantly
- `animate(weights, duration, easing)` - Animate to new weights
- `dispose()` - Clean up resources

### Events

```javascript
morpher.addEventListener('load', (e) => {
  console.log('All images loaded', e.detail);
});

morpher.addEventListener('image:add', (e) => {
  console.log('Image added', e.detail.image);
});

morpher.addEventListener('start', (e) => {
  console.log('Animation started');
});

morpher.addEventListener('complete', (e) => {
  console.log('Animation completed');
});
```

## Advanced Usage

### Custom Mesh

```javascript
const morpher = new Morpher({
  images: [...],
  triangles: [
    [0, 1, 2],  // Triangle defined by point indices
    [1, 2, 3],
    // ...
  ]
});
```

### Custom Blend Function

```javascript
function customBlend(destination, source, weight) {
  const ctx = destination.getContext('2d');
  ctx.globalAlpha = weight;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(source, 0, 0);
}

const morpher = new Morpher({
  blendFunction: customBlend
});
```

### Custom Easing

```javascript
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

morpher.animate([0, 0, 1], 2000, easeInOutCubic);
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with Canvas and ES6 support

## Performance Tips

1. **Use power-of-2 image dimensions** for better GPU performance
2. **Limit mesh complexity** - fewer triangles = faster rendering
3. **Use workers** for heavy blend operations
4. **Dispose morphers** when done to free memory

## License

MIT © Paweł Bator

## Links

- [Documentation](../../docs/)
- [Examples](../../packages/demos/)
- [GUI Editor](../../packages/gui/)
- [GitHub](https://github.com/jembezmamy/morpher-js)
