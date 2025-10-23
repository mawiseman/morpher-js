# MorpherJS Demos

Interactive demonstrations of MorpherJS v2.0 features and capabilities.

## Running Locally

```bash
npm run dev
```

This will start a development server on http://localhost:3000

## Building

```bash
npm run build
```

The built site will be in the `dist/` directory.

## Demos Included

### 1. Basic Setup
Simple two-image morphing using JSON configuration exported from the GUI.

### 2. Multiple Images, Different Sizes
Demonstrates morphing between three images of different dimensions with weight control sliders.

### 3. Easing Functions
Shows custom animation timing with cubic, elastic, and stepwise easing functions.

### 4. Blend & Final Touch Functions
Custom blend function creating a glow effect and final touch function for alpha thresholding.

### 5. Defining Mesh with API
Programmatic mesh definition using the MorpherJS API instead of JSON configuration.

## Structure

```
packages/demos/
├── src/
│   ├── demos/
│   │   ├── index.html    # All demos in one page
│   │   └── demos.js      # Demo implementations
│   └── images/           # Demo assets
├── index.html            # Landing page
└── package.json
```

## Image Assets

All demo images are located in `src/images/`:
- `plum.png` & `raspberry.png` - Fruit morphing demo
- `plum-contour.png` & `raspberry-contour.png` - Contour versions for blend demo
- `parrot-1.jpg`, `parrot-2.jpg`, `parrot-3.jpg` - Multi-image morphing

## Links

- [Core Library](../morpher/)
- [GUI Editor](../gui/)
- [Main Documentation](../../docs/)
