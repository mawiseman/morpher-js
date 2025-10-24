# MorpherJS GUI - Technical Planning Document

**Project:** MorpherJS GUI Rebuild
**Version:** 2.0.0
**Status:** Planning Phase
**Last Updated:** 2025-10-24

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Required Tools & Dependencies](#required-tools--dependencies)
5. [Development Environment Setup](#development-environment-setup)
6. [Project Structure](#project-structure)
7. [Component Architecture](#component-architecture)
8. [State Management Strategy](#state-management-strategy)
9. [Build & Deployment Pipeline](#build--deployment-pipeline)
10. [Testing Strategy](#testing-strategy)
11. [Development Workflow](#development-workflow)
12. [Risk Assessment](#risk-assessment)

---

## 1. Vision & Goals

### 1.1 Product Vision

Create a modern, performant, and maintainable web-based GUI for the MorpherJS image morphing library that empowers users to:

- **Visually configure** complex image morphing setups without writing code
- **Experiment rapidly** with different mesh geometries and blend weights
- **Export configurations** as JSON for use in production applications
- **Manage multiple projects** with persistent browser storage
- **Learn and explore** image morphing concepts through interactive feedback

### 1.2 Strategic Goals

#### Short-term Goals (3 months)
- ✅ Replace legacy Backbone.js/CoffeeScript stack with modern Web Components
- ✅ Achieve feature parity with original GUI
- ✅ Improve development experience with Vite HMR
- ✅ Establish modular, maintainable codebase

#### Medium-term Goals (6-12 months)
- 📋 Add advanced features (undo/redo, presets, templates)
- 📋 Implement export to video/GIF
- 📋 Create comprehensive documentation and tutorials
- 📋 Build community showcase gallery

#### Long-term Goals (12+ months)
- 🔮 Cloud-based project storage and sharing
- 🔮 Real-time collaborative editing
- 🔮 AI-assisted mesh generation
- 🔮 Integration with design tools (Figma, Sketch)

### 1.3 Design Principles

1. **Simplicity First**: Intuitive UI that doesn't require reading documentation
2. **Progressive Enhancement**: Basic features work immediately, advanced features discoverable
3. **Performance**: 60 FPS interactions, instant feedback
4. **Modularity**: Components can be used independently
5. **Accessibility**: Keyboard navigation, screen reader support (future)
6. **Offline-First**: Works without internet connection
7. **Developer-Friendly**: Easy to understand, extend, and maintain

### 1.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load Time | < 1 second | Lighthouse |
| Time to Interactive | < 1.5 seconds | Lighthouse |
| Canvas FPS (idle) | 60 FPS | DevTools Performance |
| Canvas FPS (dragging) | > 30 FPS | DevTools Performance |
| Bundle Size (gzip) | < 150 KB | Build output |
| Code Coverage | > 70% | Vitest |
| Developer Satisfaction | 4.5/5 | Team survey |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Web Components (Custom Elements)             │  │
│  │  <gui-app> → <gui-main> → <gui-project> → ...       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ Events & Props
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ProjectStore │  │   Project    │  │    Image     │     │
│  │  (Singleton) │  │   (Model)    │  │   (Model)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                  Core Library Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        @morpher-js/morpher (Canvas Engine)           │  │
│  │    Morpher, Image, Mesh, Triangle, Point, Matrix    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ Storage
┌─────────────────────────────────────────────────────────────┐
│                   Persistence Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          localStorage (Browser Storage)              │  │
│  │    Projects, Images, Mesh Geometry, Preferences     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Patterns

#### Component Pattern: Custom Elements v1
- **Encapsulation**: Shadow DOM for style isolation
- **Lifecycle**: `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`
- **Communication**: Custom Events (bubbling/composed)
- **Data Flow**: Props down, Events up

#### State Pattern: EventTarget-based Models
- **Models**: Plain JavaScript classes extending EventTarget
- **Events**: Native CustomEvent for state changes
- **Storage**: localStorage with JSON serialization
- **Sync**: One-way data flow from models to components

#### Dependency Injection
- **ProjectStore**: Singleton accessible via import
- **Services**: Utility modules (storage, colors, events)
- **Morpher**: Injected into Project instances

### 2.3 Data Flow Diagram

```
User Interaction
      ↓
Web Component (Event Handler)
      ↓
Model Method Call (e.g., project.addImage())
      ↓
Model State Change
      ↓
Model Emits Event (CustomEvent)
      ↓
Component Listens & Re-renders
      ↓
DOM Update (Shadow DOM)
      ↓
Browser Paints
```

### 2.4 Layer Responsibilities

| Layer | Responsibilities | Technologies |
|-------|------------------|--------------|
| **UI** | Rendering, User input, Visual feedback | Web Components, CSS |
| **State** | Business logic, Data validation, Event emission | ES6 Classes, EventTarget |
| **Core** | Image morphing, Canvas rendering, Geometry | Morpher library |
| **Persistence** | Serialization, Storage, Retrieval | localStorage, JSON |

---

## 3. Technology Stack

### 3.1 Core Technologies

#### Build Tool
```json
{
  "name": "Vite",
  "version": "5.x",
  "purpose": "Dev server, HMR, bundling, optimization",
  "why": "Fastest dev experience, native ES modules, optimized builds"
}
```

#### UI Framework
```json
{
  "name": "Web Components (Custom Elements v1)",
  "version": "Native",
  "purpose": "Component architecture",
  "why": "Framework-agnostic, native browser support, future-proof, encapsulation"
}
```

#### Language
```json
{
  "name": "JavaScript (ES2022+)",
  "version": "Latest",
  "purpose": "Application logic",
  "why": "Native browser support, modern features (modules, classes, async/await)"
}
```

#### Styling
```json
{
  "name": "CSS3 + CSS Modules",
  "version": "Latest",
  "purpose": "Component styling",
  "why": "Scoped styles, no build complexity, native performance"
}
```

### 3.2 Runtime Dependencies

#### Core Library
```javascript
{
  "@morpher-js/morpher": "^2.0.0"  // Local package
}
```

#### Template Rendering (Optional)
```javascript
{
  "lit-html": "^3.1.0"  // Optional: Efficient HTML templating
}
```
**Note**: Can use native template literals instead if bundle size is critical

#### Utilities
```javascript
{
  // All utilities can be implemented in-house:
  // - Color manipulation (colors.js)
  // - Event helpers (events.js)
  // - Storage wrapper (storage.js)
}
```

**Rationale**: Minimize dependencies to reduce bundle size and maintenance burden

### 3.3 Development Dependencies

```json
{
  "vite": "^5.0.0",
  "vitest": "^1.0.0",              // Testing framework
  "@vitest/ui": "^1.0.0",          // Test UI
  "happy-dom": "^12.0.0",          // DOM for testing
  "eslint": "^8.55.0",             // Linting
  "eslint-config-prettier": "^9.1.0",
  "prettier": "^3.1.0",            // Code formatting
  "vite-plugin-inspect": "^0.8.0"  // Build inspection
}
```

### 3.4 Technology Comparison Matrix

| Aspect | Web Components | React | Vue | Svelte |
|--------|----------------|-------|-----|--------|
| Bundle Size | ~0 KB | ~42 KB | ~33 KB | ~2 KB |
| Learning Curve | Low | Medium | Low | Low |
| Framework Lock-in | None | High | High | Medium |
| Browser Support | Native | Requires build | Requires build | Requires build |
| Shadow DOM | Native | Limited | Plugin | Limited |
| HMR Support | Good (Vite) | Excellent | Excellent | Excellent |
| Ecosystem | Growing | Massive | Large | Medium |
| **Best For** | **Long-term maintenance** | Large teams | Progressive | Small bundles |

**Decision**: Web Components chosen for zero runtime overhead and framework independence

### 3.5 Browser APIs Used

| API | Purpose | Support |
|-----|---------|---------|
| Custom Elements v1 | Component definition | All modern browsers |
| Shadow DOM v1 | Style encapsulation | All modern browsers |
| ES Modules | Code organization | All modern browsers |
| Canvas 2D | Image rendering | Universal |
| localStorage | Data persistence | Universal |
| FileReader | Image upload | Universal |
| CustomEvent | Component communication | Universal |
| requestAnimationFrame | Smooth animations | Universal |

**Polyfills**: None required for target browsers (Chrome/Firefox/Safari/Edge last 2 versions)

---

## 4. Required Tools & Dependencies

### 4.1 System Requirements

#### Minimum Development Environment
- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (comes with Node.js)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for node_modules

#### Recommended IDE
- **VS Code** v1.80+ with extensions:
  - ESLint
  - Prettier
  - lit-plugin (for lit-html syntax highlighting)
  - JavaScript and TypeScript Nightly
  - Path Intellisense

### 4.2 Package.json Dependencies

```json
{
  "name": "@morpher-js/gui",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .js",
    "format": "prettier --write src/**/*.{js,css,html}",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@morpher-js/morpher": "workspace:*",
    "lit-html": "^3.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^12.0.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.0",
    "vite-plugin-inspect": "^0.8.0"
  }
}
```

### 4.3 Development Tools

#### Build Tools
```bash
npm install -D vite@latest
```
- **Purpose**: Dev server, HMR, bundling
- **Configuration**: `vite.config.js`

#### Testing Tools
```bash
npm install -D vitest @vitest/ui happy-dom
```
- **Purpose**: Unit tests, integration tests
- **Configuration**: `vitest.config.js`

#### Code Quality Tools
```bash
npm install -D eslint prettier eslint-config-prettier
```
- **Purpose**: Linting, formatting
- **Configuration**: `.eslintrc.json`, `.prettierrc`

#### Optional: Bundle Analysis
```bash
npm install -D rollup-plugin-visualizer
```
- **Purpose**: Analyze bundle size and composition

### 4.4 Browser DevTools Extensions

- **React DevTools**: Not needed (no React)
- **Vue DevTools**: Not needed (no Vue)
- **Chrome DevTools**: Built-in (sufficient for Web Components)
- **Firefox DevTools**: Built-in
- **Lighthouse**: Built-in (performance auditing)

---

## 5. Development Environment Setup

### 5.1 Initial Setup Steps

```bash
# 1. Navigate to project root
cd c:/projects/morpher-js

# 2. Create GUI package directory
mkdir -p packages/gui
cd packages/gui

# 3. Initialize package
npm init -y

# 4. Install dependencies
npm install lit-html
npm install -D vite vitest @vitest/ui happy-dom eslint prettier eslint-config-prettier

# 5. Create directory structure
mkdir -p src/components
mkdir -p src/models
mkdir -p src/utils
mkdir -p src/styles
mkdir -p public/images
mkdir -p public/fonts

# 6. Create configuration files
touch vite.config.js
touch vitest.config.js
touch .eslintrc.json
touch .prettierrc
touch .gitignore
```

### 5.2 Configuration Files

#### vite.config.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  resolve: {
    alias: {
      '@morpher': resolve(__dirname, '../morpher/src'),
      '@components': resolve(__dirname, './src/components'),
      '@models': resolve(__dirname, './src/models'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  optimizeDeps: {
    include: ['lit-html'],
  },
});
```

#### vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

#### .eslintrc.json
```json
{
  "env": {
    "browser": true,
    "es2022": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

#### .gitignore
```
node_modules/
dist/
.DS_Store
*.log
.vite/
coverage/
```

### 5.3 VS Code Workspace Settings

#### .vscode/settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "css"
  },
  "emmet.includeLanguages": {
    "javascript": "html"
  }
}
```

---

## 6. Project Structure

### 6.1 Complete Directory Tree

```
packages/gui/
├── public/
│   ├── images/                      # Sample images
│   │   ├── parrot-1.jpg
│   │   ├── parrot-2.jpg
│   │   ├── plum.png
│   │   └── raspberry.png
│   └── fonts/                       # Icon fonts
│       ├── modernpics.woff2
│       └── modernpics.css
├── src/
│   ├── components/                  # Web Components
│   │   ├── base/
│   │   │   └── BaseComponent.js     # Base class for all components
│   │   ├── gui-app.js               # Root app component
│   │   ├── gui-main.js              # Main container
│   │   ├── gui-menu-bar.js          # Top menu
│   │   ├── gui-project.js           # Project view
│   │   ├── gui-project-menu.js      # Project dropdown menu
│   │   ├── gui-image-tile.js        # Image editor tile
│   │   ├── gui-point.js             # Draggable point
│   │   ├── gui-midpoint.js          # Edge midpoint
│   │   └── gui-popup.js             # Modal dialog
│   ├── models/                      # State management
│   │   ├── Project.js               # Project model
│   │   ├── Image.js                 # Image model
│   │   └── ProjectStore.js          # Global store
│   ├── utils/                       # Utilities
│   │   ├── storage.js               # localStorage wrapper
│   │   ├── colors.js                # Color utilities
│   │   ├── events.js                # Event helpers
│   │   └── id-generator.js          # Unique ID generation
│   ├── styles/                      # Global styles
│   │   ├── main.css                 # Global styles
│   │   ├── fonts.css                # Font imports
│   │   ├── reset.css                # CSS reset
│   │   └── variables.css            # CSS custom properties
│   ├── main.js                      # Entry point
│   └── index.html                   # HTML entry
├── tests/                           # Test files
│   ├── components/
│   ├── models/
│   └── utils/
├── dist/                            # Build output (gitignored)
├── node_modules/                    # Dependencies (gitignored)
├── .eslintrc.json                   # ESLint config
├── .prettierrc                      # Prettier config
├── .gitignore                       # Git ignore
├── package.json                     # Package manifest
├── vite.config.js                   # Vite config
└── vitest.config.js                 # Vitest config
```

### 6.2 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Web Components | kebab-case.js | `gui-image-tile.js` |
| Models/Classes | PascalCase.js | `ProjectStore.js` |
| Utilities | camelCase.js | `idGenerator.js` |
| Styles | kebab-case.css | `main.css` |
| Tests | *.test.js | `Project.test.js` |

---

## 7. Component Architecture

### 7.1 Component Hierarchy

```
<gui-app>
  └─ <gui-menu-bar>
  └─ <gui-main>
      └─ <gui-project> (multiple, shown/hidden)
          └─ <gui-image-tile> (multiple)
              └─ <gui-point> (multiple)
              └─ <gui-midpoint> (multiple)
  └─ <gui-popup> (singleton, shown/hidden)
```

### 7.2 Base Component Pattern

```javascript
// src/components/base/BaseComponent.js
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  render() {
    // Override in subclasses
  }

  addEventListeners() {
    // Override in subclasses
  }

  removeEventListeners() {
    // Override in subclasses
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  query(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  queryAll(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
```

### 7.3 Component Communication Patterns

#### Pattern 1: Props Down (Attributes/Properties)
```javascript
// Parent sets property
const tile = document.createElement('gui-image-tile');
tile.image = imageModel;
tile.project = projectModel;

// Child reads property
class GuiImageTile extends BaseComponent {
  set image(value) {
    this._image = value;
    this.render();
  }
}
```

#### Pattern 2: Events Up
```javascript
// Child emits event
this.emit('weight-change', { weight: 0.5 });

// Parent listens
tile.addEventListener('weight-change', (e) => {
  console.log('New weight:', e.detail.weight);
});
```

#### Pattern 3: Model-View Sync
```javascript
// Model emits change event
class Image extends EventTarget {
  setWeight(value) {
    this._weight = value;
    this.dispatchEvent(new CustomEvent('change:weight', { detail: { weight: value } }));
  }
}

// Component listens to model
connectedCallback() {
  this.image.addEventListener('change:weight', () => this.render());
}
```

---

## 8. State Management Strategy

### 8.1 State Architecture

```
Global State (ProjectStore)
    ↓
Project State (Project instances)
    ↓
Image State (Image instances)
    ↓
Morpher State (Morpher library)
```

### 8.2 State Flow Rules

1. **Single Source of Truth**: Models hold canonical state
2. **Unidirectional Flow**: Data flows from models → components
3. **Event-Driven Updates**: Models emit events on changes
4. **Immutable Updates**: Never mutate state directly, use setters
5. **Persistence**: Auto-save on every state change

### 8.3 State Persistence Strategy

```javascript
// Auto-save on model changes
class Project extends EventTarget {
  addImage(imageData) {
    const image = new Image(imageData);
    this.images.push(image);
    this.save(); // Automatic persistence
    this.dispatchEvent(new CustomEvent('add:image', { detail: { image } }));
  }

  save() {
    const json = this.toJSON();
    localStorage.setItem(`project_${this.id}`, JSON.stringify(json));
  }
}
```

### 8.4 State Hydration (Load from Storage)

```javascript
// On app startup
class ProjectStore extends EventTarget {
  load() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('project_'));
    this.projects = keys.map(key => {
      const data = JSON.parse(localStorage.getItem(key));
      return new Project(data); // Hydrate from JSON
    });
  }
}
```

---

## 9. Build & Deployment Pipeline

### 9.1 Build Modes

#### Development Mode
```bash
npm run dev
```
- Vite dev server on port 3000
- Hot Module Replacement (HMR)
- Source maps enabled
- No minification
- Fast rebuilds (~50ms)

#### Production Build
```bash
npm run build
```
- Minified JS/CSS
- Tree-shaking
- Code splitting
- Asset optimization
- Source maps (separate files)
- Output to `dist/`

#### Preview Production Build
```bash
npm run preview
```
- Serve production build locally
- Test before deployment

### 9.2 Build Output Structure

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js       # Main bundle
│   ├── index-[hash].css      # Styles
│   └── morpher-[hash].js     # Morpher library (code-split)
├── images/                   # Copied from public/
└── fonts/                    # Copied from public/
```

### 9.3 Deployment Targets

| Target | Method | URL |
|--------|--------|-----|
| **GitHub Pages** | `gh-pages` branch | `https://username.github.io/morpher-js/` |
| **Netlify** | Git integration | `https://morpher-js.netlify.app` |
| **Vercel** | Git integration | `https://morpher-js.vercel.app` |
| **Static Hosting** | Upload `dist/` | Custom domain |

### 9.4 Deployment Script (GitHub Pages)

```bash
# In package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Install gh-pages
npm install -D gh-pages

# Deploy
npm run deploy
```

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

```
        /\
       /E2E\        (10%) - Critical user flows
      /------\
     /Integration\  (30%) - Component + Model
    /-------------\
   /  Unit Tests   \ (60%) - Models, Utils, Components
  /-----------------\
```

### 10.2 Testing Tools

- **Vitest**: Test runner (Jest-compatible, Vite-native)
- **happy-dom**: Lightweight DOM for testing
- **@vitest/ui**: Visual test interface

### 10.3 Test Examples

#### Unit Test (Model)
```javascript
// tests/models/Project.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from '../../src/models/Project.js';

describe('Project', () => {
  let project;

  beforeEach(() => {
    project = new Project({ name: 'Test Project' });
  });

  it('creates with default values', () => {
    expect(project.name).toBe('Test Project');
    expect(project.images).toEqual([]);
  });

  it('adds image', () => {
    project.addImage({ url: 'test.jpg' });
    expect(project.images.length).toBe(1);
  });

  it('emits event on image add', (done) => {
    project.addEventListener('add:image', (e) => {
      expect(e.detail.image).toBeDefined();
      done();
    });
    project.addImage({ url: 'test.jpg' });
  });
});
```

#### Component Test
```javascript
// tests/components/gui-menu-bar.test.js
import { describe, it, expect } from 'vitest';
import '../../src/components/gui-menu-bar.js';

describe('<gui-menu-bar>', () => {
  it('renders', () => {
    const el = document.createElement('gui-menu-bar');
    document.body.appendChild(el);
    expect(el.shadowRoot).toBeTruthy();
  });

  it('emits action:new-project on button click', (done) => {
    const el = document.createElement('gui-menu-bar');
    el.addEventListener('action:new-project', () => done());
    document.body.appendChild(el);

    const btn = el.shadowRoot.querySelector('[data-action="new"]');
    btn.click();
  });
});
```

### 10.4 Testing Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test Project.test.js

# Watch mode
npm test -- --watch
```

---

## 11. Development Workflow

### 11.1 Git Workflow (Feature Branch)

```bash
# 1. Create feature branch
git checkout -b feature/gui-image-tile

# 2. Develop feature
# ... make changes ...

# 3. Commit frequently
git add src/components/gui-image-tile.js
git commit -m "feat: implement gui-image-tile component"

# 4. Push to remote
git push -u origin feature/gui-image-tile

# 5. Create pull request
gh pr create --title "Add gui-image-tile component" --base master

# 6. After review and merge, delete branch
git checkout master
git pull
git branch -d feature/gui-image-tile
```

### 11.2 Commit Message Convention

Follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Add/update tests
- `docs`: Documentation
- `style`: Code style (formatting)
- `build`: Build system changes
- `chore`: Maintenance

**Examples:**
```
feat(gui-image-tile): add canvas rendering
fix(ProjectStore): handle empty localStorage
refactor(BaseComponent): simplify event emission
perf(gui-point): optimize drag performance
test(Project): add weight normalization tests
```

### 11.3 Code Review Checklist

- [ ] Code follows style guide (Prettier/ESLint)
- [ ] All tests pass
- [ ] New features have tests
- [ ] No console.log statements
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Accessibility considered
- [ ] Browser compatibility verified

### 11.4 Daily Development Routine

1. **Morning**: Pull latest changes, review PRs
2. **Development**: Work on feature branch, commit often
3. **Testing**: Run tests before pushing
4. **Documentation**: Update inline comments and README
5. **Evening**: Push changes, create PR if ready

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Browser compatibility issues | Low | Medium | Target modern browsers only, test in all targets |
| Performance degradation with many points | Medium | High | Optimize canvas rendering, use requestAnimationFrame |
| localStorage quota exceeded | Low | Medium | Warn user, implement data compression |
| Web Components learning curve | Medium | Low | Create base component pattern, thorough documentation |
| Morpher library bugs | Low | High | Comprehensive integration tests, fallback to legacy |

### 12.2 Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | Medium | Medium | Strict MVP definition, defer nice-to-haves |
| Timeline slippage | Medium | Low | Buffer time in schedule, prioritize ruthlessly |
| Single developer dependency | High | High | Document everything, modular architecture |
| User adoption issues | Low | Medium | User testing, clear migration guide |

### 12.3 Mitigation Strategies

#### Performance
- Implement virtual scrolling for large point lists
- Debounce/throttle expensive operations
- Use Web Workers for heavy computations
- Profile regularly with Chrome DevTools

#### Compatibility
- Automated browser testing (Playwright/Cypress)
- Feature detection before use
- Graceful degradation

#### Maintainability
- Comprehensive inline documentation
- Architecture Decision Records (ADRs)
- Code review process
- Automated testing

---

## Appendix A: Quick Reference Commands

```bash
# Setup
npm install                    # Install dependencies
npm run dev                    # Start dev server

# Development
npm run lint                   # Check code style
npm run format                 # Auto-format code
npm test                       # Run tests
npm run test:ui                # Test with UI

# Build
npm run build                  # Production build
npm run preview                # Preview build

# Deployment
npm run deploy                 # Deploy to GitHub Pages

# Maintenance
npm outdated                   # Check for updates
npm update                     # Update dependencies
npm run clean                  # Clean build artifacts
```

---

## Appendix B: Learning Resources

### Web Components
- [MDN Web Components Guide](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [web.dev Custom Elements Best Practices](https://web.dev/custom-elements-best-practices/)
- [Open Web Components](https://open-wc.org/)

### Vite
- [Vite Documentation](https://vitejs.dev/)
- [Vite Plugin Development](https://vitejs.dev/guide/api-plugin.html)

### Canvas API
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Performance Tips](https://www.html5rocks.com/en/tutorials/canvas/performance/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Testing Web Components](https://open-wc.org/docs/testing/testing-package/)

---

## Appendix C: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-24 | Use Web Components over React/Vue | Zero runtime overhead, framework independence, future-proof |
| 2025-10-24 | Use Vite over Webpack | Faster dev experience, simpler config, native ES modules |
| 2025-10-24 | Use lit-html for templating | Minimal overhead, efficient updates, optional dependency |
| 2025-10-24 | Use EventTarget for models | Native browser API, no dependencies, familiar pattern |
| 2025-10-24 | Use localStorage over IndexedDB | Simpler API, sufficient for use case, synchronous |

---

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Web Components** | Native browser API for creating reusable components |
| **Shadow DOM** | Encapsulated DOM tree for component isolation |
| **Custom Elements** | API for defining new HTML elements |
| **HMR** | Hot Module Replacement - update code without full reload |
| **Tree Shaking** | Removing unused code from bundle |
| **Hydration** | Restoring state from serialized data |
| **Event Bubbling** | Event propagation up the DOM tree |
| **Composed Events** | Events that cross shadow DOM boundaries |

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-24 | AI Assistant | Initial planning document |

---

**Status**: ✅ Ready for Implementation

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Create base component structure
4. Implement Phase 1 features (see PRD.md)

---

**End of Planning Document**
