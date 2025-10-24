# Claude Code Instructions for MorpherJS Modernization

This document provides instructions for Claude Code (or any AI assistant) on how to systematically process and complete the tasks outlined in `tasks.md`.

---

## General Principles

### 1. **Always Read First**
Before making any changes:
- Read the relevant source files completely
- Understand the current implementation
- Identify all dependencies and side effects
- Check for existing tests or usage examples

### 2. **One Task at a Time**
- Mark task as in progress: `- [x]` with comment `<!-- IN PROGRESS -->`
- Complete the task fully
- Test the changes
- Mark as completed: `- [x]`
- Commit with descriptive message

### 3. **Maintain Working State**
- Keep the codebase in a working state after each task
- If a task would break functionality, coordinate with related tasks
- Run tests after each change (once tests exist)

### 4. **Document Changes**
- Update CHANGELOG.md for user-facing changes
- Update README.md if API changes
- Add code comments for complex logic
- Update TypeScript definitions


Always read PLANNING.md at the start of every new conversation, check TASKS.md before starting your work, mark completed tasks to TASKS.md immediately, and add newly discovered tasks to TASKS.md when found.

---

## Task Processing Workflow

### Step 1: Assess Task Dependencies
Before starting a task, check if it depends on other tasks:

**Example dependency chains:**
- TypeScript migration requires `package.json` first
- GUI migration requires core library migration first
- Testing requires build system setup first
- Performance optimizations can be done independently

### Step 2: Read Related Code
```bash
# Use Read tool to understand current implementation
# Use Grep to find all usages
# Use Glob to find related files
```

### Step 3: Implement Changes
- Follow the specific instructions for each phase (see below)
- Keep changes focused and atomic
- Preserve existing functionality unless explicitly changing it

### Step 4: Test Changes
```bash
# IMPORTANT: Before testing, kill any existing Node.js/Vite dev servers
# to avoid port conflicts and ensure clean testing environment
# On Windows:
taskkill /F /IM node.exe
# On Linux/Mac:
pkill node

# Run existing tests (if any)
npm test

# Start dev server for manual testing
npm run dev

# Manual testing checklist:
# - Does the demo still work?
# - Can you create a morpher instance?
# - Does animation work?
# - Do events fire correctly?
```

### Step 5: Update Documentation
- Update inline comments
- Update API documentation
- Update tasks.md to mark task complete
- Add entry to CHANGELOG.md

### Step 6: Commit
```bash
git add .
git commit -m "type: brief description

Detailed explanation of changes made.

Closes #task-number (if using issues)"
```

**Commit message types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `docs:` - Documentation
- `build:` - Build system changes
- `chore:` - Maintenance tasks

---

## Phase-Specific Instructions

## Phase 1: Foundation

### Creating package.json
1. Include all necessary fields:
   ```json
   {
     "name": "morpher-js",
     "version": "2.0.0",
     "description": "JavaScript image morphing library using HTML5 Canvas",
     "type": "module",
     "main": "./dist/morpher.cjs",
     "module": "./dist/morpher.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "import": "./dist/morpher.js",
         "require": "./dist/morpher.cjs",
         "types": "./dist/index.d.ts"
       }
     },
     "files": ["dist"],
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "test": "vitest",
       "lint": "eslint src",
       "format": "prettier --write src"
     },
     "keywords": ["morphing", "canvas", "image", "animation"],
     "author": "Paweł Bator",
     "license": "MIT",
     "devDependencies": {
       "vite": "^5.0.0",
       "vitest": "^1.0.0",
       "typescript": "^5.3.0"
     }
   }
   ```

2. Run `npm install` to create package-lock.json

### Setting up Vite
1. Create `vite.config.js`:
   ```javascript
   import { defineConfig } from 'vite';

   export default defineConfig({
     build: {
       lib: {
         entry: './src/index.js',
         name: 'Morpher',
         fileName: (format) => `morpher.${format === 'es' ? 'js' : 'cjs'}`
       }
     }
   });
   ```

2. Create directory structure:
   ```
   src/
     index.js          (main entry)
     morpher.js
     image.js
     triangle.js
     mesh.js
     point.js
     event-dispatcher.js
     matrix.js
   ```

### Migrating CoffeeScript Files

**For each .coffee file:**

1. **Read the original file completely**
2. **Understand the class structure:**
   - Note all class properties
   - Note all methods
   - Note inheritance relationships
   - Note event bindings

3. **Create equivalent ES6+ file:**
   - Replace `class X extends Y` with ES6 class syntax
   - Replace `=>` fat arrows with appropriate binding
   - Replace `@property` with `this.property`
   - Replace CoffeeScript array slicing with standard JS
   - Replace `unless` with `if (!...)`
   - Replace `?` operator with proper null checks

4. **Example transformation:**

   **CoffeeScript:**
   ```coffeescript
   class MorpherJS.Morpher extends MorpherJS.EventDispatcher
     images: null

     constructor: (params = {}) ->
       @images = []
       @fromJSON params

     addImage: (image, params = {}) =>
       unless image instanceof MorpherJS.Image
         image = new MorpherJS.Image(image)
       @images.push image
   ```

   **ES6+:**
   ```javascript
   export class Morpher extends EventDispatcher {
     images = null;

     constructor(params = {}) {
       super();
       this.images = [];
       this.fromJSON(params);
     }

     addImage(image, params = {}) {
       if (!(image instanceof Image)) {
         image = new Image(image);
       }
       this.images.push(image);
     }
   }
   ```

5. **Handle arrow function binding:**
   - Keep arrow functions for callbacks: `requestAnimationFrame(() => this.draw())`
   - Use regular methods for class methods
   - Bind in constructor if needed: `this.handleLoad = this.handleLoad.bind(this)`

6. **Test the migrated file:**
   - Import it in a test file
   - Create an instance
   - Call methods
   - Verify events work

### Performance Fixes

**Canvas Clearing (morpher.js:185):**

❌ **Before:**
```coffeescript
@canvas.width = @canvas.width  # Clears canvas
```

✅ **After:**
```javascript
this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
```

**Blend Function (morpher.js:243-248):**

❌ **Before:**
```coffeescript
defaultBlendFunction: (destination, source, weight) =>
  dData = destination.getContext('2d').getImageData(0, 0, source.width, source.height)
  sData = source.getContext('2d').getImageData(0, 0, source.width, source.height)
  for value, i in sData.data
    dData.data[i] += value*weight
  destination.getContext('2d').putImageData dData, 0, 0
```

✅ **After:**
```javascript
static defaultBlendFunction(destination, source, weight) {
  const ctx = destination.getContext('2d');
  ctx.globalAlpha = weight;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(source, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}
```

**requestAnimationFrame (morpher.js:178):**

❌ **Before:**
```coffeescript
requestFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || ...
```

✅ **After:**
```javascript
window.requestAnimationFrame(this.drawNow);
```

**Timestamps (morpher.js:57, 230):**

❌ **Before:**
```coffeescript
@t0 = new Date().getTime()
```

✅ **After:**
```javascript
this.t0 = performance.now();
```

---

## Phase 2: Core Improvements

### Implementing dispose() Methods

**Pattern to follow:**
```javascript
dispose() {
  // 1. Cancel any pending operations
  if (this.requestID) {
    cancelAnimationFrame(this.requestID);
    this.requestID = null;
  }

  // 2. Remove all event listeners
  this.off(); // If using custom event system
  // or: this.removeAllListeners();

  // 3. Dispose child objects
  this.images.forEach(img => img.dispose());
  this.images = [];

  // 4. Clear references
  this.canvas = null;
  this.ctx = null;
  this.mesh = null;

  // 5. Mark as disposed
  this._disposed = true;
}
```

### Migrating to EventTarget

**Before (custom EventDispatcher):**
```javascript
class Morpher extends EventDispatcher {
  trigger(event, ...args) {
    // Custom implementation
  }
}

morpher.on('load', callback);
morpher.trigger('load', morpher, canvas);
```

**After (native EventTarget):**
```javascript
class Morpher extends EventTarget {
  trigger(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

morpher.addEventListener('load', (e) => {
  const { morpher, canvas } = e.detail;
});
morpher.trigger('load', { morpher: this, canvas: this.canvas });
```

**Migration checklist:**
- [ ] Replace `on()` calls with `addEventListener()`
- [ ] Replace `off()` calls with `removeEventListener()`
- [ ] Replace `trigger()` calls with `dispatchEvent()`
- [ ] Wrap event data in `detail` property
- [ ] Update all event listeners in tests/examples

### Removing eval()

**Before:**
```javascript
const fn = eval(customBlendCode);
```

**After (safer):**
```javascript
// Option 1: Function constructor
const fn = new Function('destination', 'source', 'weight', customBlendCode);

// Option 2: Predefined registry
const BLEND_FUNCTIONS = {
  additive: (d, s, w) => { /* ... */ },
  multiply: (d, s, w) => { /* ... */ },
  screen: (d, s, w) => { /* ... */ },
};

// Usage:
const fn = BLEND_FUNCTIONS[blendType] || BLEND_FUNCTIONS.additive;
```

---

## Phase 3: Architecture Modernization

### GUI Framework Migration

**Recommended: Use React for best ecosystem support**

1. **Set up React:**
   ```bash
   npm install react react-dom
   npm install -D @vitejs/plugin-react
   ```

2. **Update vite.config.js:**
   ```javascript
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
   });
   ```

3. **Migration strategy:**
   - Create React components parallel to Backbone views
   - Migrate one view at a time
   - Start with leaf components (smallest, no children)
   - End with root components

4. **Backbone → React conversion:**

   **Backbone View:**
   ```javascript
   var ProjectView = Backbone.View.extend({
     initialize: function() {
       this.model.on('change', this.render, this);
     },
     render: function() {
       this.$el.html(template(this.model.toJSON()));
     }
   });
   ```

   **React Component:**
   ```javascript
   function ProjectView({ project }) {
     const [data, setData] = useState(project.toJSON());

     useEffect(() => {
       const handleChange = () => setData(project.toJSON());
       project.on('change', handleChange);
       return () => project.off('change', handleChange);
     }, [project]);

     return <div>{/* JSX template */}</div>;
   }
   ```

### Web Workers Implementation

1. **Create worker file:** `src/workers/blend-worker.js`
   ```javascript
   self.addEventListener('message', (e) => {
     const { imageData, weight } = e.data;
     // Perform heavy computation
     const result = processBlend(imageData, weight);
     self.postMessage(result);
   });
   ```

2. **Use in main thread:**
   ```javascript
   const worker = new Worker(new URL('./workers/blend-worker.js', import.meta.url));

   worker.postMessage({ imageData, weight });
   worker.addEventListener('message', (e) => {
     const result = e.data;
     // Use result
   });
   ```

---

## Phase 4: Testing & Polish

### Setting Up Tests

1. **Create test file for each module:**
   ```
   src/
     morpher.js
     morpher.test.js
     image.js
     image.test.js
   ```

2. **Test structure:**
   ```javascript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { Morpher } from './morpher';

   describe('Morpher', () => {
     let morpher;

     beforeEach(() => {
       morpher = new Morpher();
     });

     it('should create instance', () => {
       expect(morpher).toBeInstanceOf(Morpher);
     });

     it('should add image', () => {
       const img = { src: 'test.jpg' };
       morpher.addImage(img);
       expect(morpher.images.length).toBe(1);
     });

     it('should trigger events', (done) => {
       morpher.addEventListener('image:add', (e) => {
         expect(e.detail.image).toBeDefined();
         done();
       });
       morpher.addImage({ src: 'test.jpg' });
     });
   });
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

### Adding TypeScript Definitions

1. **Create `src/index.d.ts`:**
   ```typescript
   export class Morpher extends EventTarget {
     constructor(params?: MorpherParams);

     canvas: HTMLCanvasElement;
     images: Image[];

     addImage(image: Image | ImageParams): void;
     removeImage(image: Image): void;
     set(weights: number[], params?: SetParams): void;
     animate(weights: number[], duration: number, easing?: EasingFunction): void;

     dispose(): void;
   }

   export interface MorpherParams {
     images?: ImageParams[];
     triangles?: number[][];
     blendFunction?: BlendFunction;
   }

   export type BlendFunction = (
     destination: HTMLCanvasElement,
     source: HTMLCanvasElement,
     weight: number
   ) => void;

   export type EasingFunction = (t: number) => number;
   ```

---

## Common Issues & Solutions

### Issue: Breaking Existing Functionality

**Solution:**
- Create comprehensive test suite BEFORE making changes
- Keep old code commented during migration
- Create side-by-side comparison tests

### Issue: Complex Dependencies Between Tasks

**Solution:**
- Create a dependency graph
- Complete prerequisite tasks first
- Use feature flags for gradual rollout

### Issue: Large Refactoring Scope

**Solution:**
- Break into smaller sub-tasks
- Create intermediate commits
- Use adapter pattern to bridge old/new code

### Issue: Build System Not Working

**Solution:**
- Start with minimal Vite config
- Add complexity incrementally
- Check Vite docs for library mode

---

## Quality Checklist

Before marking a task complete, verify:

- [ ] Code runs without errors
- [ ] Tests pass (or test added if none exist)
- [ ] No console warnings
- [ ] TypeScript types are correct
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for user-facing changes)
- [ ] Code follows project style (ESLint passes)
- [ ] No performance regressions
- [ ] Backward compatibility maintained (or breaking change documented)
- [ ] Git commit message is descriptive

---

## Git Workflow

### Branching Strategy
- `master` - Stable, releasable code
- `develop` - Integration branch for features
- `task/*` - Individual task branches

### Workflow
```bash
# Start new task
git checkout develop
git pull
git checkout -b task/setup-package-json

# Make changes, commit
git add package.json
git commit -m "build: add package.json with modern module configuration"

# Update tasks.md
# Mark task as complete

# Push and create PR
git push -u origin task/setup-package-json
gh pr create --title "Add package.json" --base develop
```

---

## Progress Tracking

### Update tasks.md
When starting a task:
```markdown
- [ ] Create `package.json` with modern module configuration  <!-- IN PROGRESS -->
```

When completing a task:
```markdown
- [x] Create `package.json` with modern module configuration
```

### Update CHANGELOG.md
```markdown
## [Unreleased]

### Added
- Modern package.json with ESM and CJS exports

### Changed
- Migrated from CoffeeScript to ES6+ JavaScript

### Fixed
- Canvas clearing performance (70% faster)

### Breaking Changes
- Removed global `window.Morpher`, use ES6 imports instead
```

---

## Priority Order Recommendations

**Week 1: Foundation**
1. Create package.json
2. Set up Vite
3. Migrate core morpher.js
4. Fix critical performance issues

**Week 2-3: Core Migration**
5. Migrate remaining library files
6. Implement dispose() methods
7. Replace EventDispatcher

**Week 4-5: Architecture**
8. Set up testing
9. Add TypeScript definitions
10. Begin GUI migration

**Week 6+: Polish**
11. Add comprehensive tests
12. Add linting/formatting
13. Generate documentation
14. Set up CI/CD

---

## When to Ask for Clarification

Ask the user if:
- A task is ambiguous or could be implemented multiple ways
- Breaking changes would affect existing usage
- Third-party library choice is needed (React vs Vue vs Svelte)
- Migration strategy needs confirmation
- Original functionality is unclear

---

## Success Criteria

The modernization is complete when:
- ✅ All Phase 1 tasks are complete
- ✅ All Phase 2 critical tasks are complete
- ✅ Library works in modern browsers
- ✅ Build system produces ES6 and CJS bundles
- ✅ TypeScript definitions available
- ✅ Tests cover >80% of code
- ✅ Documentation is comprehensive
- ✅ Published to npm
- ✅ Demo site works with new version

---

## Additional Resources

- **Vite Docs:** https://vitejs.dev/guide/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Vitest Docs:** https://vitest.dev/
- **MDN Web APIs:** https://developer.mozilla.org/en-US/docs/Web/API
- **Canvas Performance:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

---

**Remember:** The goal is to modernize while preserving the elegant simplicity of the original library. Don't over-engineer. Keep the API intuitive and the bundle size small.
