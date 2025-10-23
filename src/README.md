# Source Directory

This directory will contain the migrated ES6+ JavaScript source files.

## Migration Status

The library is currently being migrated from CoffeeScript to modern JavaScript.

### Original CoffeeScript Files (in `source/javascripts/morpher/lib/`)
- `morpher.js.coffee` → `src/morpher.js` (pending)
- `image.js.coffee` → `src/image.js` (pending)
- `triangle.js.coffee` → `src/triangle.js` (pending)
- `mesh.js.coffee` → `src/mesh.js` (pending)
- `point.js.coffee` → `src/point.js` (pending)
- `_event_dispatcher.js.coffee` → `src/event-dispatcher.js` (pending)
- `_matrix.js.coffee` → `src/matrix.js` (pending)

### Target Structure

```
src/
  index.js              - Main entry point, exports all public APIs
  morpher.js           - Main Morpher class
  image.js             - Image class
  triangle.js          - Triangle class
  mesh.js              - Mesh class
  point.js             - Point class
  matrix.js            - Matrix class (2D transformations)
  event-dispatcher.js  - Event system (or migrated to EventTarget)
```

## During Migration

The old Middleman build system in `source/` will remain functional until all files are migrated.

To work with the old system:
```bash
bundle exec middleman server
```

To work with the new Vite system (once migrated):
```bash
npm run dev
npm run build
```
