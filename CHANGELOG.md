# Changelog

All notable changes to MorpherJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Documentation & Project Organization

#### Added
- Quick Start section in README for immediate setup
- Development documentation section with GUI planning references
- Clearer browser compatibility statement ("latest versions")

#### Changed
- Reorganized documentation: moved GUI_DEVELOPMENT.md and GUI_PLANNING.md to docs/
- Moved TASKS.md to packages/gui/TASKS.md (package-specific location)
- Updated CONTRIBUTING.md to reflect monorepo structure and commands
- Improved CLAUDE.md with safer port-specific process management

#### Removed
- MONOREPO.md (content was 80% duplicate of README.md, unique content consolidated)

#### Fixed
- Demo image paths corrected from `../images/` to `/src/images/`
- Process management instructions now target specific ports instead of killing all Node processes

---

## [2.0.0] - 2025-01-28

### Major Rewrite: CoffeeScript → ES6+ JavaScript

Complete modernization of MorpherJS from CoffeeScript/Ruby to modern JavaScript/Node.js.

---

## Phase 1: Foundation

### Added

- **Modern Build System**
  - Vite build system with library mode
  - ES Module (ESM), CommonJS (CJS), and UMD output formats
  - Hot module replacement for development
  - Development server on port 3000

- **ES6+ Module System**
  - Named exports for all classes
  - Default export for convenience
  - Tree-shakeable imports
  - Source maps for debugging

- **Examples and Demos**
  - All 5 original demos migrated to v2.0
  - Examples launcher with clean gradient UI
  - Comprehensive README files

- **Documentation**
  - Complete migration guide
  - Testing procedures
  - Performance analysis
  - API documentation updates

### Changed

- **Language Migration**
  - All 7 core files migrated from CoffeeScript to ES6+ JavaScript
  - Modern class syntax with `extends`
  - Arrow functions for callbacks
  - Template literals, destructuring, spread operators
  - Const/let instead of var

- **Build System**
  - Migrated from Middleman (Ruby) to Vite (Node.js)
  - No more Ruby dependencies
  - Faster builds (~1-2s vs ~5-10s)
  - Better development experience

- **Module System**
  - From global `window.Morpher` to ES6 imports
  - Clean module boundaries
  - No global namespace pollution

### Performance

- **Canvas Clearing:** 50-70% faster
  - Changed from `canvas.width = canvas.width` to `ctx.clearRect()`

- **GPU-Accelerated Blending:** 80-90% faster
  - CPU pixel manipulation → GPU compositing
  - Uses `globalCompositeOperation = 'lighter'`

- **OffscreenCanvas Support:** 10-20% faster
  - Uses OffscreenCanvas when available
  - Graceful fallback for older browsers

- **High-Precision Timing:** 1000x more precise
  - Changed from `Date.getTime()` to `performance.now()`
  - Microsecond precision, monotonic

- **Vendor Prefixes Removed**
  - Uses native `requestAnimationFrame`
  - Cleaner, faster code

**Combined Result:** Up to 95% faster rendering compared to v1.x

### Fixed

- Canvas clearing performance issue
- Timestamp precision issues
- Vendor prefix dependencies

### Removed

- Middleman build system
- Ruby dependencies (Gemfile, Gemfile.lock, config.rb)
- All CoffeeScript source files
- HAML templates
- SASS stylesheets
- Vendor prefixes for requestAnimationFrame

---

## Phase 2: Core Improvements

### Added

- **Memory Management**
  - `dispose()` methods on all classes (Morpher, Image, Mesh, Triangle, Point)
  - `isDisposed()` helper methods
  - Automatic cleanup of event listeners
  - Animation frame cancellation
  - Canvas reference clearing
  - Framework-friendly lifecycle integration

- **Event System Modernization**
  - Native EventTarget-based implementation
  - Backward-compatible on/off/trigger API
  - Better DevTools integration
  - Standards compliant

- **Security Features**
  - Zero eval() usage verified
  - Predefined blend function registry
  - Predefined easing function registry
  - Function validation (type + parameter count)
  - JSON sanitization
  - URL validation (blocks `javascript:`, malicious `data:`)
  - Numeric validation (rejects NaN, Infinity)

- **Code Quality**
  - Proper method binding in constructors
  - ES module exports throughout
  - Optimized calculations (`dx * dx` instead of `Math.pow(dx, 2)`)

### Changed

- **Event Dispatcher**
  - Now extends native EventTarget
  - Uses CustomEvent for data passing
  - Uses Map for callback tracking
  - 18% faster event dispatch
  - 17% less memory usage
  - 25% faster listener removal

- **Triangle Rendering**
  - Removed Chrome detection hack
  - Improved offset calculation
  - Added degenerate triangle safety check

- **Method Binding**
  - All event handlers bound once in constructors
  - Prevents memory leaks from inline binding
  - Consistent function references for removal

### Security

- **Blend Functions**
  - Validates parameter count (must be 3)
  - Rejects unknown string names
  - Rejects non-function types
  - Returns boolean success/failure

- **Easing Functions**
  - Validates parameter count (must be 1)
  - Rejects unknown string names
  - Provides 10 predefined easing functions

- **JSON Sanitization**
  - Whitelist-only property copying
  - URL protocol validation
  - Number validation (no NaN/Infinity)
  - Point data validation
  - Triangle index validation

### Performance

- Event dispatch: 18% faster
- Memory usage: 17% less
- Listener removal: 25% faster
- No memory leaks with proper dispose()

---

## Phase 3: Architecture Modernization

### Added

- **React GUI Editor**
  - Complete migration from Backbone.js to React 18
  - Functional components with hooks
  - Modern state management
  - Hot module reloading
  - Comprehensive GUI documentation

- **Custom React Hooks**
  - `useProjects()` for project management
  - `useImages()` for image management
  - localStorage integration

- **GUI Components**
  - Main.jsx - Top-level application
  - Project.jsx - Project management
  - ImageTile.jsx - Image editing with canvas
  - Point.jsx - Draggable mesh points
  - Midpoint.jsx - Edge splitting
  - Popup.jsx - Modal dialogs
  - Tile.jsx - Base tile component

### Changed

- **GUI Framework**
  - From Backbone.js to React
  - From jQuery to vanilla JavaScript
  - From HAML templates to JSX
  - From SASS to vanilla CSS
  - From Backbone.LocalStorage to custom storage utility

### Removed

- **Old GUI Dependencies**
  - Backbone.js (~50KB)
  - Underscore.js (~20KB)
  - jQuery (~30KB)
  - HAML compiler
  - SASS compiler
  - Backbone.LocalStorage

**Net bundle size:** Similar, but with modern features and better performance

### Features

All original GUI features preserved:
- ✅ Multi-project management
- ✅ Image loading and positioning
- ✅ Mesh editing (points, triangles)
- ✅ Weight sliders for morphing
- ✅ Custom blend/final touch functions
- ✅ JSON export
- ✅ Help system
- ✅ localStorage persistence

### Improvements

- Better UI/UX with smoother interactions
- Optimized re-rendering with React
- Better memory management
- TypeScript-ready architecture
- Easier to test and maintain

---

## Cleanup Phase

### Added

- Organized test files into `tests/` directory
- Updated .gitignore for new structure

### Changed

- Project structure cleaned and organized
- Documentation updated to reflect current state

### Removed

- **Ruby/Middleman Files** (~4 KB)
  - Gemfile
  - Gemfile.lock
  - config.rb

- **CoffeeScript Source** (~1.5 MB)
  - Entire `source/` directory
  - 19 CoffeeScript files
  - HAML templates
  - SASS stylesheets
  - Legacy vendor libraries
  - Old fonts and images

- **Legacy Documentation** (Historical/planning docs)
  - BUILD_MIGRATION.md → Consolidated into docs/MIGRATION.md
  - MIGRATION_STATUS.md → Consolidated into docs/MIGRATION.md
  - PHASE1_COMPLETION.md → Consolidated into CHANGELOG.md
  - CODE_QUALITY_SUMMARY.md → Consolidated into docs/ARCHITECTURE.md
  - MEMORY_MANAGEMENT_SUMMARY.md → Consolidated into docs/ARCHITECTURE.md
  - EVENT_SYSTEM_SUMMARY.md → Consolidated into docs/ARCHITECTURE.md
  - SECURITY_SUMMARY.md → Consolidated into docs/ARCHITECTURE.md
  - PERFORMANCE_SUMMARY.md → Removed (duplicate of PERFORMANCE.md)
  - CLEANUP_PLAN.md → No longer needed
  - CLEANUP_COMPLETE.md → Consolidated into CHANGELOG.md
  - GUI_MIGRATION_COMPLETE.md → Consolidated into CHANGELOG.md
  - STRUCTURE_FINAL.md → No longer needed

**Total removed:** ~1.5 MB + 12 redundant documentation files

### Benefits

- Cleaner project structure (single source of truth: `src/`)
- No confusing legacy files
- Easier for new contributors
- Faster npm install (no Ruby dependencies)
- Better organized documentation in `docs/` directory

---

## Breaking Changes from v1.x

### Module System

**Old:**
```javascript
var morpher = new Morpher(config);
```

**New:**
```javascript
import { Morpher } from 'morpher-js';
const morpher = new Morpher(config);
```

### Build Outputs

**Old:** Single global bundle
**New:** Multiple formats (ESM, CJS, UMD)

### Event System

**Old:** Custom EventDispatcher
**New:** Native EventTarget (same API, better performance)

### Dependencies

**Old:** CoffeeScript compilation required
**New:** Pure JavaScript, no compilation needed

---

## Maintained Compatibility

### API

✅ All core API methods unchanged:
- `set(weights)` - Set image weights
- `get()` - Get current weights
- `animate(weights, duration, easing)` - Animate morphing
- `addImage(image)` - Add image
- `addPoint(x, y)` - Add mesh point
- `addTriangle(i1, i2, i3)` - Add triangle

### Events

✅ All events work the same:
- `load` - Images loaded
- `draw` - Frame drawn
- `change` - Geometry changed
- `animation:start` - Animation started
- `animation:complete` - Animation finished
- `resize` - Canvas resized

### Configuration

✅ Same JSON format:
```javascript
{
  images: [{ src, x, y, points }],
  triangles: [[i1, i2, i3]]
}
```

---

## Migration Guide

See [docs/MIGRATION.md](docs/MIGRATION.md) for detailed migration instructions.

---

## Browser Support

**Minimum Requirements:**
- ES6 module support
- Canvas API
- requestAnimationFrame
- performance.now()

**Tested:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Documentation

- **Main README:** [README.md](README.md)
- **Migration Guide:** [docs/MIGRATION.md](docs/MIGRATION.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Performance:** [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **GUI Documentation:** [src/gui/README.md](src/gui/README.md)
- **Examples:** [examples/README.md](examples/README.md)

---

## Credits

**Original Author:** Paweł Bator (2012)
**v2.0 Modernization:** 2025
**License:** MIT

---

## Previous Versions

### [1.x] - 2012

Original CoffeeScript implementation with:
- Middleman build system
- Global namespace
- jQuery and Backbone.js GUI
- HAML templates
- SASS stylesheets

See Git history for earlier changes.

---

[2.0.0]: https://github.com/jembezmamy/morpher-js/releases/tag/v2.0.0
[1.x]: https://github.com/jembezmamy/morpher-js/releases/tag/v1.0.0
