# Contributing to MorpherJS

Thank you for your interest in contributing to MorpherJS! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Git Workflow](#git-workflow)
- [Adding Features](#adding-features)
- [Documentation](#documentation)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Git
- Modern code editor (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/morpher-js.git
   cd morpher-js
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

5. **Verify everything works:**
   - Landing page loads
   - GUI editor works (`/gui.html`)
   - Demos work (`/demos/`)

---

## Development Workflow

### Project Structure

```
morpher-js/
├── src/                   # Library source code
│   ├── index.js          # Main entry point
│   ├── morpher.js        # Core Morpher class
│   ├── image.js          # Image class
│   ├── mesh.js           # Mesh class
│   ├── triangle.js       # Triangle class
│   ├── point.js          # Point class
│   ├── matrix.js         # Matrix utilities
│   ├── event-dispatcher.js  # Event system
│   └── gui/              # React GUI editor
├── examples/             # Demo applications
├── tests/                # Test files
├── docs/                 # Documentation
├── dist/                 # Built output (generated)
└── vite.config.js        # Build configuration
```

### Available Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build library (dist/)
npm run preview  # Preview production build
```

### Development Server

The dev server provides:
- Hot module replacement (instant updates)
- Source maps for debugging
- Access to all examples and GUI
- Fast rebuild times (~100ms)

**URLs:**
- Landing page: `http://localhost:3000/`
- GUI Editor: `http://localhost:3000/gui.html`
- Demos: `http://localhost:3000/demos/`

---

## Testing

### Manual Testing

#### 1. Library Tests

```bash
node tests/test-event-dispatcher.js
node tests/test-security.js
```

Expected output: All tests passing ✅

#### 2. Examples Testing

**Landing Page** (`http://localhost:3000/`)
- [ ] Page loads without errors
- [ ] Links to GUI and demos work
- [ ] Gradient background displays

**All Original Demos** (`http://localhost:3000/demos/`)

**Demo 1: Basic Setup**
- [ ] Plum and raspberry images load
- [ ] Reset button sets to 100% plum
- [ ] Play button animates to raspberry
- [ ] Slider controls morphing
- [ ] Smooth animation

**Demo 2: Multiple Images**
- [ ] Three parrot images load
- [ ] Three sliders work
- [ ] "Restrict factor sum to 1" checkbox works
- [ ] Weights normalize correctly

**Demo 3: Easing Functions**
- [ ] Ease In Out Cubic animates smoothly
- [ ] Elastic Bounce creates spring effect
- [ ] Custom Stepwise shows step animation

**Demo 4: Blend & Final Touch**
- [ ] Contour images load
- [ ] Custom blend creates glow effect
- [ ] Custom final touch creates threshold
- [ ] Toggles work correctly

**Demo 5: API Usage**
- [ ] Two parrots and circle load
- [ ] Three sliders work
- [ ] Simple triangle mesh visible

**GUI Editor** (`http://localhost:3000/gui.html`)
- [ ] GUI loads successfully
- [ ] Projects can be created/deleted
- [ ] Images can be added/loaded
- [ ] Points can be added and dragged
- [ ] Triangles can be created
- [ ] Weight sliders work
- [ ] Export functionality works
- [ ] localStorage persists data

#### 3. Performance Testing

**Open DevTools Performance tab:**

1. Start recording
2. Trigger Demo 3 "Elastic Bounce"
3. Stop recording

**Expected:**
- Frame times: 2-5ms (was 15-25ms in v1.x)
- Consistent 60fps
- CPU usage: 5-15%
- GPU activity visible
- No dropped frames

#### 4. Memory Testing

**Open DevTools Memory tab:**

1. Take heap snapshot
2. Create morpher, run animation
3. Call `morpher.dispose()`
4. Force garbage collection
5. Take another snapshot
6. Compare

**Expected:**
- Morpher instances: 0
- Image instances: 0
- Canvas references freed
- No memory leaks

### Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Code Standards

### JavaScript Style

**Use modern ES6+ features:**

```javascript
// ✅ GOOD
export class MyClass extends BaseClass {
  property = null;

  constructor() {
    super();
    this.method = this.method.bind(this);
  }

  method() {
    const value = this.calculate();
    return value;
  }
}

// ❌ BAD
var MyClass = function() {
  this.property = null;
};
```

### Naming Conventions

- **Classes:** PascalCase (`Morpher`, `EventDispatcher`)
- **Methods:** camelCase (`addImage`, `dispose`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_BLEND`)
- **Private:** Prefix with underscore (`_disposed`)

### Method Binding

**Always bind in constructor:**

```javascript
// ✅ GOOD
constructor() {
  this.handler = this.handler.bind(this);
  obj.on('event', this.handler);
}

// ❌ BAD
obj.on('event', this.handler.bind(this)); // New function each time
```

### Feature Detection

**Use feature detection, not browser sniffing:**

```javascript
// ✅ GOOD
if (typeof OffscreenCanvas !== 'undefined') {
  this.tmpCanvas = new OffscreenCanvas(1, 1);
}

// ❌ BAD
if (window.chrome) {
  // Chrome-specific code
}
```

### Memory Management

**All classes must implement dispose():**

```javascript
dispose() {
  // 1. Cancel pending operations
  if (this.requestID) {
    cancelAnimationFrame(this.requestID);
    this.requestID = null;
  }

  // 2. Remove event listeners
  this.off();

  // 3. Dispose children
  this.children.forEach(child => child.dispose());

  // 4. Clear references
  this.parent = null;

  // 5. Mark as disposed
  this._disposed = true;
}

isDisposed() {
  return this._disposed === true;
}
```

### Documentation

**Use JSDoc comments for public APIs:**

```javascript
/**
 * Add an image to the morpher
 * @param {Object|Image} image - Image configuration or instance
 * @param {Object} params - Additional parameters
 * @returns {Image} The added image instance
 */
addImage(image, params = {}) {
  // Implementation
}
```

---

## Git Workflow

### Branching Strategy

- `master` - Stable, releasable code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create feature branch:**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/my-feature
   ```

2. **Make changes:**
   - Edit files in `src/`
   - Test changes with `npm run dev`
   - Run existing tests

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature

   Detailed explanation of the changes.

   - Added X functionality
   - Updated Y component
   - Fixed Z issue"
   ```

4. **Push branch:**
   ```bash
   git push -u origin feature/my-feature
   ```

5. **Create pull request:**
   - Use GitHub UI or `gh pr create`
   - Provide clear description
   - Link related issues

### Commit Message Format

Use conventional commits:

```
type: brief description

Detailed explanation (optional).

- List of changes
- References to issues
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `docs:` - Documentation
- `build:` - Build system changes
- `chore:` - Maintenance tasks

**Examples:**

```bash
feat: add GPU-accelerated blending

Implement hardware-accelerated blending using globalCompositeOperation.
This improves performance by 80-90% compared to CPU-based pixel manipulation.

- Added defaultBlendFunction using GPU
- Added softwareBlendFunction as fallback
- Updated documentation
```

```bash
fix: prevent memory leak in dispose()

Ensure all event listeners are properly removed when disposing.

- Bind handlers in constructor for consistent references
- Remove all listeners in dispose()
- Add isDisposed() check
```

---

## Adding Features

### Adding a New Method

1. **Add to appropriate class:**
   ```javascript
   // src/morpher.js
   export class Morpher extends EventDispatcher {
     // ...

     /**
      * My new feature
      * @param {string} param - Parameter description
      * @returns {boolean} Success status
      */
     myNewFeature(param) {
       // Implementation
       this.trigger('feature:added', param);
       return true;
     }
   }
   ```

2. **Test the method:**
   ```javascript
   // Manual test
   const morpher = new Morpher({ canvas });
   const result = morpher.myNewFeature('test');
   console.log(result); // Should be true
   ```

3. **Document the method:**
   - Add to README.md API section
   - Update relevant docs
   - Add usage examples

### Adding a New Class

1. **Create file:**
   ```javascript
   // src/my-class.js
   import { EventDispatcher } from './event-dispatcher.js';

   export class MyClass extends EventDispatcher {
     constructor(params = {}) {
       super();
       // Implementation
     }

     dispose() {
       this.off();
       this._disposed = true;
     }
   }
   ```

2. **Export from index.js:**
   ```javascript
   // src/index.js
   export { MyClass } from './my-class.js';
   ```

3. **Test and document:**
   - Create test file
   - Add to documentation
   - Update examples if needed

### Adding Examples

1. **Create example directory:**
   ```bash
   mkdir examples/my-example
   ```

2. **Create files:**
   ```html
   <!-- examples/my-example/index.html -->
   <!DOCTYPE html>
   <html>
   <head>
     <title>My Example - MorpherJS</title>
   </head>
   <body>
     <script type="module" src="./main.js"></script>
   </body>
   </html>
   ```

   ```javascript
   // examples/my-example/main.js
   import { Morpher } from '../../src/index.js';

   const morpher = new Morpher({ /* config */ });
   ```

3. **Add README:**
   ```markdown
   <!-- examples/my-example/README.md -->
   # My Example

   Demonstrates feature X.

   ## Usage
   ...
   ```

4. **Link from root index.html:**
   Add link to examples grid

---

## Documentation

### File Documentation

**README.md in each directory:**
- Overview of contents
- Usage instructions
- Links to related docs

### API Documentation

**Update README.md API section:**
- Method signatures
- Parameter descriptions
- Return values
- Usage examples

### Code Comments

**Inline comments for complex logic:**

```javascript
// Calculate transformation matrix
// Using homogeneous coordinates for affine transformation
const matrix = this.calculateMatrix(p1, p2, p3);
```

**JSDoc for public methods:**

```javascript
/**
 * Animate to target weights over duration
 * @param {number[]} weights - Target weights (must sum to ~1)
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function|string} [easing] - Easing function or name
 * @fires Morpher#animation:start
 * @fires Morpher#animation:complete
 */
animate(weights, duration, easing) {
  // Implementation
}
```

---

## Quality Checklist

Before submitting a pull request, verify:

- [ ] Code runs without errors
- [ ] All manual tests pass
- [ ] No console warnings
- [ ] Code follows style guide
- [ ] Methods are bound in constructors
- [ ] dispose() methods implemented where needed
- [ ] Documentation updated
- [ ] Examples still work
- [ ] No browser-specific code (use feature detection)
- [ ] No memory leaks (dispose() called)
- [ ] Git commit messages are descriptive

---

## Getting Help

**Resources:**
- **Documentation:** [README.md](README.md), [docs/](docs/)
- **Examples:** [examples/](examples/)
- **GitHub Issues:** [github.com/jembezmamy/morpher-js/issues](https://github.com/jembezmamy/morpher-js/issues)

**Questions?**
- Check existing documentation
- Search GitHub issues
- Create new issue with details

---

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what is best for the project
- Show empathy towards other contributors

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MorpherJS! 🎉
