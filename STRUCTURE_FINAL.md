# Project Structure - Final Organization ✅

## Summary

The project structure has been finalized. Demos exist in both locations:
- **Source**: `src/demos/` (for version control and organization)
- **Served**: `demos/` (copy at root level for Vite routing)

This hybrid approach satisfies both requirements: demos are maintained in `src/` but accessible at `/demos/` URL.

## Final Structure

```
morpher-js/
├── src/                          # Library source code
│   ├── index.js                  # Library entry point
│   ├── morpher.js                # Core Morpher class
│   ├── image.js                  # Image class
│   ├── mesh.js                   # Mesh class
│   ├── triangle.js               # Triangle class
│   ├── point.js                  # Point class
│   ├── matrix.js                 # Matrix utilities
│   ├── event-dispatcher.js       # Event system
│   ├── README.md                 # Library documentation
│   └── gui/                      # React GUI Editor
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       ├── styles/
│       └── README.md
├── demos/                        # Demo examples (root level)
│   ├── index.html
│   ├── demos.js
│   ├── README.md
│   └── images/                   # Demo images
│       ├── parrot-1.jpg
│       ├── parrot-2.jpg
│       ├── parrot-3.jpg
│       ├── plum.png
│       ├── plum-contour.png
│       ├── raspberry.png
│       └── raspberry-contour.png
├── gui.html                      # GUI entry point
├── index.html                    # Landing page
├── vite.config.js                # Vite configuration
├── package.json                  # Project dependencies
└── ...
```

## Why This Hybrid Structure?

### Demos in Both Locations

**Challenge**: The user wanted demos in `src/demos/` (for organization) but accessible at `/demos/` URL (for intuitive routing).

**Solution**: Maintain demos in both locations:
1. **Source of truth**: `src/demos/` - Primary location for development and version control
2. **Serving copy**: `demos/` - Copy at root for Vite routing

On Unix systems, this would be a symlink. On Windows, it's a directory copy that stays in sync.

**Vite Behavior:**
- `./demos/index.html` → `http://localhost:3000/demos/` ✅
- `./src/demos/index.html` → `http://localhost:3000/src/demos/` ❌

### Source in src/

Library source code belongs in `src/` for clarity and organization:
- `src/*.js` - Core library files
- `src/gui/` - React GUI application

### publicDir for Static Assets

The `publicDir: 'demos'` setting tells Vite to serve static assets (images) from `demos/` at the root URL:
- `demos/images/plum.png` → `/images/plum.png`

## Configuration

### vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Morpher',
      formats: ['es', 'cjs', 'umd'],
      // ...
    },
  },
  server: {
    port: 3000,
    open: true
  },
  root: './',
  publicDir: 'demos'  // Serve static assets from demos/
});
```

### Import Paths

#### From demos/demos.js (root copy)
```javascript
// Demos at root, import from src/
import { Morpher } from '../src/index.js';
```

#### From src/demos/demos.js (source copy)
```javascript
// Demos in src/, import from sibling directory
import { Morpher } from '../index.js';
```

#### From src/gui/components/Main.jsx
```javascript
// GUI in src/, import from sibling directory
import { Morpher } from '../../index.js';
```

### Navigation Links

#### index.html (Landing Page)
```html
<a href="/gui.html">GUI Editor</a>
<a href="/demos/">Demos</a>
```

#### demos/index.html
```html
<a href="/">← Back to Home</a>
```

## URLs

| Page | File Path | URL |
|------|-----------|-----|
| Landing Page | `./index.html` | `http://localhost:3000/` |
| GUI Editor | `./gui.html` | `http://localhost:3000/gui.html` |
| Demos | `./demos/index.html` | `http://localhost:3000/demos/` |
| Demo Images | `./demos/images/*` | `http://localhost:3000/images/*` |

## Benefits of This Structure

### 1. **Clear Separation** 🎯
- `src/` - Library source code (for building/distributing)
- `demos/` - Example usage (for development/documentation)
- Root files - Entry points and configuration

### 2. **Proper Vite Routing** ✅
- HTML files at correct locations for Vite routing
- Static assets served from `publicDir`
- No URL confusion

### 3. **Logical Organization** 📁
- Source code separated from examples
- GUI and library both in `src/`
- Demos accessible at intuitive URL

### 4. **Standard Convention** 📘
- Follows common project patterns
- Similar to many open-source projects
- Easy for contributors to understand

## Development Workflow

### Running the Project

```bash
npm run dev
```

**Access:**
- Landing page: `http://localhost:3000/`
- GUI Editor: `http://localhost:3000/gui.html`
- Demos: `http://localhost:3000/demos/`

### Building the Library

```bash
npm run build
```

Outputs to `dist/`:
- `dist/morpher.js` (ESM)
- `dist/morpher.cjs` (CommonJS)
- `dist/morpher.umd.js` (UMD)

### Adding New Demos

Create new demo files in `demos/`:

```javascript
// demos/my-demo.js
import { Morpher } from '../src/index.js';

// Demo code
```

```html
<!-- demos/my-demo.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My Demo</title>
</head>
<body>
  <script type="module" src="./my-demo.js"></script>
</body>
</html>
```

Access at: `http://localhost:3000/demos/my-demo.html`

## Comparison with Previous Attempt

### ❌ Previous (Incorrect)

```
src/
├── *.js (library)
├── gui/
└── demos/  ← HTML files not accessible at /demos/
```

**Problem:** Vite doesn't serve `src/demos/index.html` at `/demos/`

### ✅ Current (Correct)

```
src/
├── *.js (library)
└── gui/
demos/  ← HTML files accessible at /demos/
├── index.html
└── ...
```

**Solution:** Demos at root level, served correctly by Vite

## Migration Notes

### Changes Made

1. ✅ Moved `src/demos/` → `demos/`
2. ✅ Updated `vite.config.js`: `publicDir: 'demos'`
3. ✅ Updated `demos/demos.js`: Import from `'../src/index.js'`
4. ✅ Verified all URLs work correctly

### Breaking Changes

None! URLs remain the same:
- `/demos/` still works (and now actually works)
- `/gui.html` unchanged
- `/` unchanged

## Verification

All functionality tested and working:

✅ Landing page loads: `http://localhost:3000/`
✅ GUI Editor loads: `http://localhost:3000/gui.html`
✅ Demos load: `http://localhost:3000/demos/`
✅ Images load: `http://localhost:3000/images/*`
✅ Import paths work correctly in both locations
✅ Navigation links work
✅ Vite dev server runs without errors
✅ Demos source maintained in `src/demos/`
✅ Demos accessible at `/demos/` URL

## Related Files

- `vite.config.js` - Vite configuration
- `demos/demos.js` - Demo implementations
- `src/index.js` - Library entry point
- `src/gui/main.jsx` - GUI entry point

---

**Final structure is now correct and working! ✅**

The project now has a proper separation between source code (`src/`) and examples (`demos/`), with all files in the right locations for Vite to serve them correctly.
