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
- [ ] Create BaseComponent class (src/components/base/BaseComponent.js)
- [ ] Test BaseComponent with simple example
- [ ] Set up component registration pattern

### Utility Modules
- [ ] Create storage.js (localStorage wrapper)
- [ ] Create colors.js (color utilities - HSL to RGB)
- [ ] Create events.js (event helper utilities)
- [ ] Create id-generator.js (unique ID generation)
- [ ] Add tests for utility modules

---

## Phase 2: State Management

### Data Models
- [ ] Create Image model (src/models/Image.js)
- [ ] Create Project model (src/models/Project.js)
- [ ] Create ProjectStore singleton (src/models/ProjectStore.js)
- [ ] Add tests for Image model
- [ ] Add tests for Project model
- [ ] Add tests for ProjectStore
- [ ] Implement localStorage persistence
- [ ] Test data hydration (load from storage)

---

## Phase 3: Core Components

### Root Components
- [ ] Create `<gui-app>` root component
- [ ] Create `<gui-menu-bar>` component
- [ ] Create `<gui-main>` container component
- [ ] Test app initialization and rendering

### Project Management
- [ ] Create `<gui-project>` component
- [ ] Implement project switching logic
- [ ] Implement add/delete project functionality
- [ ] Implement project rename functionality
- [ ] Add project color theming

---

## Phase 4: Image Editing Components

### Image Tile
- [ ] Create `<gui-image-tile>` component
- [ ] Implement canvas rendering
- [ ] Implement file upload (drag-and-drop + file picker)
- [ ] Implement URL input
- [ ] Implement image position (move mode)
- [ ] Implement weight slider
- [ ] Add delete image functionality

### Mesh Editing
- [ ] Create `<gui-point>` draggable component
- [ ] Create `<gui-midpoint>` split component
- [ ] Implement point addition on canvas click
- [ ] Implement point dragging
- [ ] Implement point deletion
- [ ] Implement triangle creation (3 points)
- [ ] Implement edge splitting (midpoint click)
- [ ] Implement mesh visualization (grid pattern)
- [ ] Sync mesh across all images in project

---

## Phase 5: Advanced Features

### Popup System
- [ ] Create `<gui-popup>` modal component
- [ ] Implement help dialog
- [ ] Implement code export dialog
- [ ] Implement custom function editor dialogs
- [ ] Add syntax highlighting for code

### Custom Functions
- [ ] Implement blend function editor
- [ ] Implement final touch function editor
- [ ] Add function validation
- [ ] Add error handling for invalid functions

---

## Phase 6: Styling & Polish

### CSS & Design
- [ ] Create global styles (src/styles/main.css)
- [ ] Create CSS reset (src/styles/reset.css)
- [ ] Create CSS variables (src/styles/variables.css)
- [ ] Import icon font (src/styles/fonts.css)
- [ ] Add component-specific styles
- [ ] Implement responsive layout
- [ ] Add animations and transitions
- [ ] Test across browsers (Chrome, Firefox, Safari, Edge)

---

## Phase 7: Integration & Testing

### Morpher Library Integration
- [ ] Integrate @morpher-js/morpher package
- [ ] Test image loading and rendering
- [ ] Test mesh synchronization
- [ ] Test weight blending
- [ ] Test animation
- [ ] Test JSON export/import

### Testing
- [ ] Write unit tests for all models
- [ ] Write unit tests for all utilities
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Achieve >70% code coverage
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

**Current Focus:** Phase 1 - Foundation & Setup

**Blockers:** None

**Next Steps:**
1. Create packages/gui directory structure
2. Initialize package.json
3. Set up build configuration
4. Create base component infrastructure
