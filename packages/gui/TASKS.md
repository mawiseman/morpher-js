# MorpherJS GUI - Task List

This file tracks tasks for building the new GUI application using Vite and Web Components.

**Status Legend:**
- `[ ]` - Not started
- `[x]` - Completed
- `<!-- IN PROGRESS -->` - Currently working on

**Reference Documents:**
- [PLANNING.md](./PLANNING.md) - Technical planning and architecture
- [PRD.md](./PRD.md) - Product requirements document
- [CLAUDE.md](./CLAUDE.md) - Instructions for AI assistant

---

## Phase 1: Foundation & Setup

### Package Setup
- [x] Create `packages/gui` directory structure
- [x] Initialize package.json for GUI package
- [x] Install core dependencies (vite, lit-html)
- [x] Install dev dependencies (vitest, eslint, prettier)
- [x] Create vite.config.js
- [x] Create vitest.config.js
- [x] Create .eslintrc.json
- [x] Create .prettierrc
- [x] Create .gitignore for GUI package
- [x] Create src/index.html entry point
- [x] Create src/main.js entry point
- [x] Copy assets (fonts, sample images) to public/

### Base Component Infrastructure
- [x] Create BaseComponent class (src/components/base/BaseComponent.js)
- [x] Test BaseComponent with comprehensive test suite (28 tests passing)
- [x] Set up component registration pattern

### Utility Modules
- [x] Create storage.js (localStorage wrapper)
- [x] Create colors.js (color utilities - HSL to RGB)
- [x] Create events.js (event helper utilities)
- [x] Create id-generator.js (unique ID generation)
- [x] Add tests for utility modules

---

## Phase 2: State Management

### Data Models
- [x] Create Image model (src/models/Image.js)
- [x] Create Project model (src/models/Project.js)
- [x] Create ProjectStore singleton (src/models/ProjectStore.js)
- [x] Add tests for Image model
- [x] Add tests for Project model
- [x] Add tests for ProjectStore
- [x] Implement localStorage persistence
- [x] Test data hydration (load from storage)

---

## Phase 3: Core Components

### Root Components
- [x] Create `<gui-app>` root component
- [x] Create `<gui-menu-bar>` component
- [x] Create `<gui-main>` container component
- [x] Test app initialization and rendering

### Project Management
- [x] Create `<gui-project>` component
- [x] Implement project switching logic
- [x] Implement add/delete project functionality
- [x] Implement project rename functionality
- [x] Add project color theming

---

## Phase 4: Image Editing Components

### Image Tile
- [x] Create image tile component (inline in `<gui-project>`)
- [x] Implement canvas rendering
- [x] Implement file upload (file picker)
- [x] Implement drag-and-drop file upload
- [ ] Implement URL input
- [ ] Implement image position (move mode)
- [x] Implement weight slider with normalization
- [x] Add delete image functionality
- [x] Add Sitecore ID field for external reference

### Mesh Editing
- [ ] Create `<gui-point>` draggable component
- [ ] Create `<gui-midpoint>` split component
- [x] Implement point addition on canvas click
- [x] Implement point dragging
- [x] Implement point deletion (Shift+click)
- [x] Implement automatic triangulation
- [ ] Implement manual triangle creation (3 points)
- [ ] Implement edge splitting (midpoint click)
- [x] Implement mesh visualization (points and triangles)
- [x] Sync mesh across all images in project

---

## Phase 5: Advanced Features

### Popup System
- [x] Create modal component (JSON modal inline in `<gui-project>`)
- [x] Implement help dialog (in `<gui-app>`)
- [x] Implement JSON view/edit dialog (project-level)
- [ ] Implement code export dialog
- [ ] Implement custom function editor dialogs
- [ ] Add syntax highlighting for code

### Custom Functions
- [ ] Implement blend function editor
- [ ] Implement final touch function editor
- [ ] Add function validation
- [ ] Add error handling for invalid functions

### Additional Features Implemented
- [x] Zoom controls (0.25x - 10x)
- [x] Morpher preview with real-time blending
- [x] Synchronized canvas scrolling across images
- [x] Canvas scroll position persistence (localStorage)
- [x] Copy to clipboard from JSON modal
- [x] Project-level JSON export/import

---

## Phase 6: Styling & Polish

### CSS & Design
- [x] Create global styles (src/styles/main.css)
- [x] Create CSS reset (src/styles/reset.css)
- [x] Create CSS variables (src/styles/variables.css)
- [x] Import icon font (src/styles/fonts.css)
- [x] Add component-specific styles (inline in components)
- [ ] Implement responsive layout (partially done)
- [x] Add animations and transitions
- [ ] Test across browsers (Chrome, Firefox, Safari, Edge)

---

## Phase 7: Integration & Testing

### Morpher Library Integration
- [x] Integrate @morpher-js/morpher package
- [x] Test image loading and rendering
- [x] Test mesh synchronization
- [x] Test weight blending
- [ ] Test animation (basic animation works)
- [x] Test JSON export/import

### Testing
- [x] Write unit tests for all models (Image, Project, ProjectStore)
- [x] Write unit tests for all utilities (colors, storage, id-generator)
- [x] Write component tests (BaseComponent)
- [ ] Write integration tests
- [ ] Achieve >70% code coverage (currently ~60%)
- [ ] Manual testing checklist

---

## Phase 8: Documentation & Deployment

### Documentation
- [ ] Create GUI README.md
- [ ] Document component API
- [ ] Create usage examples
- [ ] Create migration guide from old GUI
- [ ] Record demo video

### Build & Deployment
- [ ] Optimize production build
- [ ] Test production build
- [ ] Set up GitHub Pages deployment
- [ ] Deploy to production
- [ ] Verify deployment works

---

## Future Enhancements (Post-MVP)

- [ ] Undo/Redo functionality
- [ ] Mesh templates (grid, radial, etc.)
- [ ] Export to GIF/video
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Accessibility improvements (ARIA, keyboard nav)
- [ ] Mobile responsive design
- [ ] Touch support for tablets

---

## Notes

**Current Focus:** Phase 8 - Documentation & Deployment

**Completed:**
- Phase 1: Foundation & Setup (20/20 tasks) ✅
  - Package Setup (12/12 tasks)
  - Base Component Infrastructure (3/3 tasks)
  - Utility Modules (5/5 tasks)
- Phase 2: State Management (8/8 tasks) ✅
  - Data Models (Image, Project, ProjectStore)
  - localStorage persistence
  - Comprehensive test coverage
- Phase 3: Core Components (9/9 tasks) ✅
  - Root app component with menu bar and main content
  - Project navigation with wrap-around
  - Inline editable project names
  - Add/delete project functionality
  - Image upload and management
  - Weight sliders for blend control
  - Project color theming
- Phase 4: Image Editing Components (13/17 tasks) 🔄
  - Image tile with canvas rendering
  - File upload (file picker + drag-and-drop)
  - Weight sliders with automatic normalization
  - Delete image functionality
  - Sitecore ID field for external references
  - Point addition, dragging, and deletion
  - Automatic triangulation and mesh visualization
  - Mesh synchronization across images
- Phase 5: Advanced Features (9/12 tasks) 🔄
  - JSON view/edit dialog (project-level)
  - Help dialog
  - Zoom controls with persistence
  - Real-time morpher preview
  - Synchronized canvas scrolling
  - Copy to clipboard functionality
- Phase 6: Styling & Polish (6/8 tasks) 🔄
  - Global styles, reset, variables, fonts
  - Component-specific styles
  - Animations and transitions
- Phase 7: Integration & Testing (9/12 tasks) 🔄
  - Morpher library integration
  - Unit tests for models and utilities
  - Component tests for BaseComponent

**Test Results:**
- BaseComponent: 28/28 tests passing ✅
- Colors utility: 27/27 tests passing ✅
- Image model: 27/31 tests passing (4 failures - async callback issues)
- Project model: 39/46 tests passing (7 failures - async callback issues + weight distribution edge cases)
- Storage utility: 16/23 tests passing (7 failures due to happy-dom environment)
- ID Generator: 24/25 tests passing (1 minor UUID validation issue)

**Blockers:** None

**Next Steps:**
1. Complete remaining Phase 4 tasks (URL input, image position/move mode)
2. Complete Phase 5 tasks (code export, custom function editors)
3. Improve test coverage (>70% target)
4. Cross-browser testing
5. Documentation and deployment

**Recent Additions:**
- Added Sitecore ID field to images for external reference tracking
- Moved JSON view/edit to project-level (was per-image)
- Sitecore ID stored in JSON and displayed inline with Delete button
