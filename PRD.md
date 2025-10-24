# Product Requirements Document (PRD)
## MorpherJS GUI - Web Components Rebuild

**Version:** 2.0.0
**Author:** Paweł Bator
**License:** MIT
**Last Updated:** 2025-10-24

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technical Architecture](#technical-architecture)
4. [Feature Requirements](#feature-requirements)
5. [User Interface Specifications](#user-interface-specifications)
6. [Data Models & State Management](#data-models--state-management)
7. [Component Specifications](#component-specifications)
8. [Integration Requirements](#integration-requirements)
9. [Performance Requirements](#performance-requirements)
10. [Browser Compatibility](#browser-compatibility)
11. [Development Roadmap](#development-roadmap)
12. [Success Criteria](#success-criteria)

---

## 1. Executive Summary

This document outlines requirements for rebuilding the MorpherJS GUI application using modern web standards: **Vite** as the build system and **Web Components** for the user interface. The goal is to modernize the legacy Backbone.js/CoffeeScript application while preserving all existing functionality and improving performance, maintainability, and user experience.

### Key Objectives

- **Modernize Technology Stack**: Replace Backbone.js/CoffeeScript with Web Components and ES6+
- **Improve Build System**: Replace Middleman/Ruby with Vite for faster development
- **Maintain Feature Parity**: Preserve all existing functionality from the legacy application
- **Enhance Performance**: Optimize rendering and state management
- **Improve Developer Experience**: Better tooling, hot module replacement, and debugging
- **Enable Future Growth**: Modular architecture for easy feature additions

---

## 2. Project Overview

### 2.1 Background

**MorpherJS** is a JavaScript image morphing library that uses HTML5 Canvas to blend multiple images using a triangular mesh system. The original GUI application (built 2012-2016) provides an interactive editor for:

- Loading multiple images
- Defining mesh geometry (points and triangles)
- Adjusting blend weights with sliders
- Exporting JSON configurations
- Managing multiple projects with localStorage persistence

### 2.2 Current Legacy Stack

- **Backend Build**: Middleman 3.x (Ruby)
- **Frontend Framework**: Backbone.js 0.9.2
- **Language**: CoffeeScript
- **Templates**: Haml-sprockets
- **Styling**: SASS
- **Dependencies**: jQuery, Underscore.js, Colors.js

### 2.3 Target Modern Stack

- **Build System**: Vite 5.x
- **UI Framework**: Web Components (Custom Elements v1)
- **Language**: ES6+ JavaScript (modules)
- **Templating**: Template literals / Tagged templates
- **Styling**: CSS Modules or scoped CSS in components
- **State Management**: Custom EventTarget-based state + localStorage
- **Core Library**: `@morpher-js/morpher` (already migrated to `/packages/morpher`)

---

## 3. Technical Architecture

### 3.1 Project Structure

```
morpher-js/
├── packages/
│   ├── morpher/              # Core library (already migrated)
│   │   ├── src/
│   │   ├── dist/
│   │   └── package.json
│   └── gui/                  # New GUI application
│       ├── public/
│       │   ├── images/       # Sample images
│       │   └── fonts/        # Icon fonts
│       ├── src/
│       │   ├── components/   # Web Components
│       │   │   ├── gui-app.js
│       │   │   ├── gui-main.js
│       │   │   ├── gui-project.js
│       │   │   ├── gui-image-tile.js
│       │   │   ├── gui-point.js
│       │   │   ├── gui-midpoint.js
│       │   │   ├── gui-menu-bar.js
│       │   │   ├── gui-popup.js
│       │   │   └── gui-project-menu.js
│       │   ├── models/       # State management
│       │   │   ├── Project.js
│       │   │   ├── Image.js
│       │   │   └── ProjectStore.js
│       │   ├── utils/
│       │   │   ├── storage.js
│       │   │   ├── colors.js
│       │   │   └── events.js
│       │   ├── styles/
│       │   │   ├── main.css
│       │   │   ├── fonts.css
│       │   │   └── components/
│       │   ├── main.js       # Entry point
│       │   └── index.html
│       ├── vite.config.js
│       └── package.json
├── PRD.md                    # This file
└── README.md
```

### 3.2 Build System (Vite)

**Key Configuration:**

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@morpher': '../../morpher/src',
    },
  },
});
```

**Features:**
- Hot Module Replacement (HMR) for instant updates
- ES module support
- CSS preprocessing (PostCSS)
- Asset optimization
- Development server with live reload

### 3.3 Web Components Architecture

**Base Component Pattern:**

```javascript
class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Override in subclasses
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }
}
```

**Benefits:**
- Encapsulation (Shadow DOM)
- Reusability
- Framework-agnostic
- Native browser support
- Scoped styles

---

## 4. Feature Requirements

### 4.1 Core Features (Must Have)

#### F1: Project Management
- **F1.1** Create new projects
- **F1.2** Delete existing projects with confirmation
- **F1.3** Switch between projects (previous/next navigation)
- **F1.4** Rename projects inline
- **F1.5** Auto-assign random color theme per project
- **F1.6** Persist all projects to localStorage
- **F1.7** Restore projects on page reload

#### F2: Image Management
- **F2.1** Add images via file upload (drag-and-drop + file picker)
- **F2.2** Add images via URL input
- **F2.3** Display image thumbnails in tiles
- **F2.4** Delete images with confirmation
- **F2.5** Adjust image position (move mode)
- **F2.6** Set blend weight per image (0-1 slider)
- **F2.7** Auto-normalize weights across images
- **F2.8** Persist image data to localStorage

#### F3: Mesh Editing
- **F3.1** Click canvas to add points
- **F3.2** Display points as draggable circles (6px default, 10px selected)
- **F3.3** Drag points to reposition
- **F3.4** Remove points (click while selected)
- **F3.5** Auto-create triangles from 3 selected points
- **F3.6** Display triangle edges with grid pattern overlay
- **F3.7** Show midpoint markers on triangle edges
- **F3.8** Click midpoint to split edge (add new point)
- **F3.9** Highlight points on hover
- **F3.10** Synchronize mesh across all images in project

#### F4: Canvas Rendering
- **F4.1** Real-time preview of morphed result
- **F4.2** Display individual images with mesh overlay
- **F4.3** Render triangle grid with semi-transparent pattern
- **F4.4** Update canvas on any geometry or weight change
- **F4.5** Resize canvas to fit largest image

#### F5: Code Export
- **F5.1** Generate JSON configuration
- **F5.2** Display in copyable modal dialog
- **F5.3** Include all mesh geometry
- **F5.4** Include image URLs (not base64 data)
- **F5.5** Format as valid Morpher constructor input

#### F6: Custom Functions (Advanced)
- **F6.1** Define custom blend function (JavaScript code editor)
- **F6.2** Define custom final touch function (post-processing)
- **F6.3** Validate and execute user code safely
- **F6.4** Show errors if function invalid
- **F6.5** Apply to morpher instance in real-time

#### F7: Help System
- **F7.1** Display help modal with usage instructions
- **F7.2** Keyboard shortcuts reference
- **F7.3** Getting started guide

### 4.2 Nice-to-Have Features (Future)

- **F8** Undo/Redo for mesh operations
- **F9** Export as animated GIF or video
- **F10** Import existing JSON configurations
- **F11** Image filters (brightness, contrast, etc.)
- **F12** Preset mesh templates (grids, radial, etc.)
- **F13** Collaborative editing (real-time sync)
- **F14** Dark mode theme

---

## 5. User Interface Specifications

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Menu Bar (Fixed Top)                                        │
│ ┌───┬─────────────────┬───────────────────┬───┬───┬───┬───┐ │
│ │ ? │ Project Name    │ [New][Del][◀][▶]│   │   │   │   │ │
│ └───┴─────────────────┴───────────────────┴───┴───┴───┴───┘ │
├─────────────────────────────────────────────────────────────┤
│ Project Container (Scrollable)                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Image Tile  │ │ Image Tile  │ │ Image Tile  │  [+ Add]   │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │            │
│ │ │ Canvas  │ │ │ │ Canvas  │ │ │ │ Canvas  │ │            │
│ │ │         │ │ │ │         │ │ │ │         │ │            │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │            │
│ │ [Slider]    │ │ [Slider]    │ │ [Slider]    │            │
│ │ URL: ______ │ │ URL: ______ │ │ URL: ______ │            │
│ │ [Move][Del] │ │ [Move][Del] │ │ [Move][Del] │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Menu Bar Component (`<gui-menu-bar>`)

**Visual Design:**
- Fixed position at top of viewport
- Background color matches current project color
- Height: 60px
- Displays horizontally: [Help Icon] [Project Name] [Controls] [Project Menu]

**Elements:**
1. **Help Button** (left side)
   - Icon: `?` from Modern Pictograms font
   - Click: Opens help modal
   - Size: 40px square

2. **Project Name Input** (left-center)
   - Editable text field
   - Updates project name on change
   - Disabled if no projects exist

3. **Project Controls** (center)
   - "New Project" button
   - "Delete Project" button (disabled if no projects)
   - "Previous" button (disabled on first project)
   - "Next" button (disabled on last project)

4. **Project Menu** (right side)
   - Dropdown with additional options
   - Export JSON
   - Edit Blend Function
   - Edit Final Touch Function

**Behavior:**
- Menu bar color transitions smoothly when switching projects
- All controls disable gracefully when no projects exist

### 5.3 Image Tile Component (`<gui-image-tile>`)

**Visual Design:**
- Card-style container with padding
- Width: 300px (flexible)
- Background: white with subtle shadow
- Border-radius: 8px

**Structure:**
```html
<gui-image-tile>
  <div class="tile-header">
    <button data-action="openFile">📁 Upload</button>
    <button data-action="move">✋ Move</button>
    <button data-action="delete">🗑️ Delete</button>
  </div>
  <div class="artboard">
    <canvas></canvas>
    <div class="points-overlay">
      <!-- gui-point elements -->
    </div>
    <div class="midpoints-overlay">
      <!-- gui-midpoint elements -->
    </div>
  </div>
  <div class="controls">
    <input type="range" name="targetWeight" min="0" max="1" step="0.01">
    <input type="text" name="url" placeholder="Image URL">
    <input type="file" name="file" accept="image/*" hidden>
  </div>
</gui-image-tile>
```

**Canvas Rendering:**
- Display uploaded image
- Overlay triangle mesh with:
  - Fill: Diagonal line pattern (semi-transparent)
  - Stroke: White (2px) + Black (1px) for contrast
- Render points as black circles (6px radius)
- Render selected points larger (10px radius)

**Interaction Modes:**

1. **Normal Mode:**
   - Click canvas → Add point at cursor position
   - Click point → Select point
   - Click 3 points → Auto-create triangle
   - Drag point → Reposition

2. **Move Mode:**
   - Click "Move" button → Toggle mode (button highlighted)
   - Canvas cursor changes to move cursor
   - Drag canvas → Reposition entire image
   - No point interactions allowed

**Weight Slider:**
- Range: 0.0 to 1.0
- Step: 0.01
- Real-time updates as user drags
- Auto-normalizes other images' weights

### 5.4 Point Component (`<gui-point>`)

**Visual Design:**
- Circle element positioned absolutely
- Default: 6px radius, black fill, white stroke (1px)
- Hovered: 8px radius, yellow fill
- Selected: 10px radius, red fill
- Dragging: Semi-transparent, cursor changes

**Behavior:**
- Follows parent image position offset
- Emits `drag:start`, `drag:move`, `drag:stop` events
- Emits `select` event on click
- Synchronized across all images in project

### 5.5 Midpoint Component (`<gui-midpoint>`)

**Visual Design:**
- Small circle at edge midpoint
- 4px radius
- White fill, 50% opacity
- On hover: 6px radius, 80% opacity

**Behavior:**
- Appears on triangle edges
- Click to split edge (adds new point)
- Hidden if edge belongs to multiple triangles (don't duplicate)
- Emits `edge:split` event with (p1, p2) references

### 5.6 Popup Component (`<gui-popup>`)

**Visual Design:**
- Modal overlay (full-screen, semi-transparent black background)
- Content box: centered, white, max-width 600px
- Close button (X) in top-right corner
- Title bar with icon
- Scrollable content area

**Usage:**
- Help dialog
- Code export dialog
- Function editor dialog
- Confirmation dialogs

**API:**
```javascript
GuiPopup.show({
  title: 'Export JSON',
  content: '<pre>{ ... }</pre>',
  onClose: () => { }
});
```

### 5.7 Color Scheme

**Project Colors:**
- Auto-generated per project
- HSL randomization:
  - Hue: 0-360 (random)
  - Saturation: 40-70%
  - Lightness: 50-70%

**UI Colors:**
- Background: `#f5f5f5`
- Tile background: `#ffffff`
- Text: `#333333`
- Border: `#e0e0e0`
- Accent: Project color
- Point (default): `#000000`
- Point (hover): `#ffcc00`
- Point (selected): `#ff0000`
- Triangle stroke: `rgba(255,255,255,0.5)` + `rgba(0,0,0,0.5)`
- Triangle fill: Diagonal pattern `rgba(0,0,0,0.2)`

**Typography:**
- Font Family: System font stack
- Menu: 14px, medium weight
- Input: 13px
- Labels: 12px, uppercase

---

## 6. Data Models & State Management

### 6.1 Project Model

**Class: `Project`**

```javascript
class Project extends EventTarget {
  constructor(attrs = {}) {
    super();
    this.id = attrs.id || generateId();
    this.name = attrs.name || 'New Project';
    this.color = attrs.color || generateRandomColor();
    this.blendFunction = attrs.blend_function || null;
    this.finalTouchFunction = attrs.final_touch_function || null;

    // Morpher instance
    this.morpher = new Morpher();

    // Images collection
    this.images = [];

    // Setup event listeners
    this.morpher.addEventListener('change', this.handleMorpherChange);
  }

  addImage(imageData) {
    const image = new Image(imageData);
    this.images.push(image);
    this.morpher.addImage(image.morpherImage);
    this.save();
    return image;
  }

  removeImage(image) {
    const index = this.images.indexOf(image);
    if (index !== -1) {
      this.images.splice(index, 1);
      this.morpher.removeImage(image.morpherImage);
      this.save();
    }
  }

  addTriangle(p1, p2, p3) {
    this.morpher.addTriangle(p1, p2, p3);
  }

  updateBlendFunction(code) {
    try {
      const fn = new Function('destination', 'source', 'weight', code);
      this.morpher.blendFunction = fn;
      this.blendFunction = code;
      this.save();
    } catch (e) {
      throw new Error('Invalid blend function: ' + e.message);
    }
  }

  updateFinalTouchFunction(code) {
    try {
      const fn = new Function('canvas', code);
      this.morpher.finalTouchFunction = fn;
      this.finalTouchFunction = code;
      this.save();
    } catch (e) {
      throw new Error('Invalid final touch function: ' + e.message);
    }
  }

  handleWeightChange(image) {
    // Auto-normalize weights
    const totalWeight = this.images.reduce((sum, img) => {
      return img === image ? sum : sum + img.targetWeight;
    }, 0);

    const defaultWeight = totalWeight > 0 ? 0 : 1;
    const maxWeight = (1 - image.targetWeight) / (totalWeight || this.images.length - 1);

    this.images.forEach(img => {
      if (img !== image) {
        img.weight = (defaultWeight || img.targetWeight) * maxWeight;
      }
    });
  }

  toJSON() {
    const morpherJSON = this.morpher.toJSON();
    // Replace src with URLs
    morpherJSON.images.forEach((img, i) => {
      img.src = this.images[i].url;
    });
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      blend_function: this.blendFunction,
      final_touch_function: this.finalTouchFunction,
      morpher: morpherJSON,
    };
  }

  save() {
    const json = this.toJSON();
    // Don't save base64 image data
    json.morpher.images.forEach(img => img.src = null);
    localStorage.setItem(`project_${this.id}`, JSON.stringify(json));
  }

  destroy() {
    this.images.forEach(img => img.destroy());
    localStorage.removeItem(`project_${this.id}`);
    this.morpher.dispose();
  }
}
```

### 6.2 Image Model

**Class: `Image`**

```javascript
class Image extends EventTarget {
  constructor(attrs = {}) {
    super();
    this.id = attrs.id || generateId();
    this.url = attrs.url || '';
    this.file = attrs.file || null; // base64 data
    this.targetWeight = attrs.targetWeight || 0;
    this.weight = attrs.weight || 0;

    // Morpher's Image instance
    this.morpherImage = new MorpherJS.Image();

    if (this.file) {
      this.morpherImage.setSrc(this.file);
    }
  }

  set src(value) {
    this.file = value;
    this.morpherImage.setSrc(value);
    this.dispatchEvent(new CustomEvent('change:file', { detail: { file: value } }));
  }

  set targetWeight(value) {
    this._targetWeight = parseFloat(value);
    this.weight = this._targetWeight;
    this.morpherImage.setWeight(this.weight);
    this.dispatchEvent(new CustomEvent('change:weight', { detail: { weight: this.weight } }));
  }

  get targetWeight() {
    return this._targetWeight;
  }

  addPoint(x, y) {
    this.morpherImage.addPoint({ x, y });
  }

  splitEdge(p1, p2) {
    this.morpherImage.splitEdge(p1, p2);
  }

  destroy() {
    this.morpherImage.dispose?.();
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      file: this.file,
      targetWeight: this.targetWeight,
      weight: this.weight,
    };
  }
}
```

### 6.3 ProjectStore

**Class: `ProjectStore`** (Singleton)

```javascript
class ProjectStore extends EventTarget {
  constructor() {
    super();
    this.projects = [];
    this.currentIndex = 0;
  }

  load() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('project_'));
    this.projects = keys.map(key => {
      const data = JSON.parse(localStorage.getItem(key));
      return new Project(data);
    });

    if (this.projects.length === 0) {
      this.create({ name: 'Default Project' });
    }

    this.dispatchEvent(new CustomEvent('reset'));
  }

  create(attrs) {
    const project = new Project(attrs);
    this.projects.push(project);
    project.save();
    this.dispatchEvent(new CustomEvent('add', { detail: { project } }));
    return project;
  }

  remove(project) {
    const index = this.projects.indexOf(project);
    if (index !== -1) {
      project.destroy();
      this.projects.splice(index, 1);
      this.dispatchEvent(new CustomEvent('remove', { detail: { project, index } }));

      // Adjust current index
      if (this.currentIndex >= this.projects.length) {
        this.currentIndex = Math.max(0, this.projects.length - 1);
      }
    }
  }

  getCurrent() {
    return this.projects[this.currentIndex];
  }

  setCurrent(index) {
    if (index >= 0 && index < this.projects.length) {
      this.currentIndex = index;
      this.dispatchEvent(new CustomEvent('change:current', { detail: { index } }));
    }
  }

  next() {
    this.setCurrent(this.currentIndex + 1);
  }

  previous() {
    this.setCurrent(this.currentIndex - 1);
  }
}

export const projectStore = new ProjectStore();
```

### 6.4 Storage Schema

**localStorage Keys:**

```
projects_index              → ['project_1', 'project_2', ...]
project_{id}                → { id, name, color, blend_function, final_touch_function, morpher }
project_{id}_images_index   → ['image_1', 'image_2', ...]
project_{id}_image_{id}     → { id, url, file, targetWeight, weight }
```

**Example:**
```json
{
  "id": "project_abc123",
  "name": "Fruit Morph",
  "color": "rgb(180, 120, 200)",
  "blend_function": null,
  "final_touch_function": null,
  "morpher": {
    "images": [
      { "src": null, "weight": 0.5, "x": 0, "y": 0 },
      { "src": null, "weight": 0.5, "x": 0, "y": 0 }
    ],
    "triangles": [[0, 1, 2], [1, 2, 3]],
    "mesh": {
      "points": [
        { "x": 50, "y": 50 },
        { "x": 150, "y": 50 },
        { "x": 100, "y": 150 }
      ]
    }
  }
}
```

---

## 7. Component Specifications

### 7.1 `<gui-app>` (Root Component)

**Purpose:** Application shell and router

**Responsibilities:**
- Initialize ProjectStore
- Render main layout
- Handle global keyboard shortcuts
- Provide global error handling

**Template:**
```html
<div class="gui-app">
  <gui-menu-bar></gui-menu-bar>
  <gui-main></gui-main>
  <gui-popup></gui-popup>
</div>
```

**Lifecycle:**
```javascript
class GuiApp extends HTMLElement {
  connectedCallback() {
    this.render();
    projectStore.load();
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': // New project
            e.preventDefault();
            projectStore.create({ name: 'New Project' });
            break;
          case 'ArrowLeft': // Previous project
            e.preventDefault();
            projectStore.previous();
            break;
          case 'ArrowRight': // Next project
            e.preventDefault();
            projectStore.next();
            break;
        }
      }
    });
  }
}
```

### 7.2 `<gui-menu-bar>`

**Purpose:** Top navigation and project controls

**Properties:**
- `project` - Current Project instance

**Events Emitted:**
- `action:help` - Help button clicked
- `action:new-project` - New project button clicked
- `action:delete-project` - Delete project button clicked
- `action:previous` - Previous project button clicked
- `action:next` - Next project button clicked
- `action:export` - Export JSON clicked
- `action:edit-blend-function` - Edit blend function clicked
- `action:edit-final-touch-function` - Edit final touch function clicked
- `project:rename` - Project name changed

**Template:**
```html
<div class="menu-bar" style="background-color: ${this.project?.color}">
  <button class="help-btn" @click=${this.handleHelp}>?</button>
  <input
    type="text"
    class="project-name"
    value=${this.project?.name}
    @change=${this.handleRename}
    ?disabled=${!this.project}
  />
  <div class="controls">
    <button @click=${this.handleNew}>New</button>
    <button @click=${this.handleDelete} ?disabled=${!this.project}>Delete</button>
    <button @click=${this.handlePrevious} ?disabled=${!this.canGoPrevious}>◀</button>
    <button @click=${this.handleNext} ?disabled=${!this.canGoNext}>▶</button>
  </div>
  <div class="project-menu">
    <button>⋮</button>
    <div class="dropdown">
      <button @click=${this.handleExport}>Export JSON</button>
      <button @click=${this.handleEditBlend}>Edit Blend Function</button>
      <button @click=${this.handleEditFinalTouch}>Edit Final Touch Function</button>
    </div>
  </div>
</div>
```

### 7.3 `<gui-main>`

**Purpose:** Container for project views

**Properties:**
- `projects` - Array of Project instances
- `currentIndex` - Index of current project

**Responsibilities:**
- Render all project views
- Toggle visibility based on currentIndex
- Listen to ProjectStore events

**Template:**
```html
<div class="gui-main">
  ${this.projects.map((project, i) => html`
    <gui-project
      .project=${project}
      ?hidden=${i !== this.currentIndex}>
    </gui-project>
  `)}
</div>
```

### 7.4 `<gui-project>`

**Purpose:** Display single project with images

**Properties:**
- `project` - Project instance

**Responsibilities:**
- Render image tiles
- Handle add image action
- Sync mesh highlighting across tiles

**Template:**
```html
<div class="gui-project">
  <div class="image-tiles">
    ${this.project.images.map(image => html`
      <gui-image-tile
        .image=${image}
        .project=${this.project}
        @highlight=${this.handleHighlight}
        @select=${this.handleSelect}>
      </gui-image-tile>
    `)}
    <button class="add-image-btn" @click=${this.handleAddImage}>
      + Add Image
    </button>
  </div>
</div>
```

**Event Handling:**
```javascript
handleHighlight(e) {
  const { index, state, midpoint } = e.detail;
  // Highlight same point/midpoint in all tiles
  this.shadowRoot.querySelectorAll('gui-image-tile').forEach(tile => {
    tile.highlightPoint(index, state, midpoint);
  });
}

handleSelect(e) {
  const { index } = e.detail;
  // Update selection in all tiles
  this.shadowRoot.querySelectorAll('gui-image-tile').forEach(tile => {
    tile.selectPoint(index);
  });
}
```

### 7.5 `<gui-image-tile>`

**Purpose:** Interactive image editor with mesh overlay

**Properties:**
- `image` - Image instance
- `project` - Project instance (for triangle creation)

**State:**
- `moveMode` - Boolean
- `pointViews` - Array of `<gui-point>` elements
- `midpointViews` - Array of `<gui-midpoint>` elements

**Methods:**
```javascript
class GuiImageTile extends HTMLElement {
  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file.type.match('image.*')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.image.src = e.target.result;
      if (!this.image.url) {
        this.image.url = file.name;
      }
      this.project.save();
    };
    reader.readAsDataURL(file);
  }

  handleCanvasClick(e) {
    if (this.moveMode) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.image.morpherImage.getX();
    const y = e.clientY - rect.top - this.image.morpherImage.getY();

    this.image.addPoint(x, y);
  }

  toggleMoveMode() {
    this.moveMode = !this.moveMode;
    this.classList.toggle('move-mode', this.moveMode);
  }

  handleWeightChange(e) {
    this.image.targetWeight = e.target.value;
    this.project.handleWeightChange(this.image);
    this.project.morpher.set(this.project.images.map(img => img.weight));
  }

  draw() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const x0 = this.image.morpherImage.getX();
    const y0 = this.image.morpherImage.getY();

    // Draw image
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, x0, y0);
    }

    // Draw triangles
    const pattern = this.createPattern();
    this.image.morpherImage.mesh.triangles.forEach(triangle => {
      ctx.beginPath();
      ctx.moveTo(x0 + triangle.p1.x, y0 + triangle.p1.y);
      ctx.lineTo(x0 + triangle.p2.x, y0 + triangle.p2.y);
      ctx.lineTo(x0 + triangle.p3.x, y0 + triangle.p3.y);
      ctx.closePath();

      ctx.fillStyle = pattern;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    });
  }

  createPattern() {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(5, 10);
    ctx.moveTo(5, 0);
    ctx.lineTo(10, 5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 10);
    ctx.stroke();

    return ctx.createPattern(canvas, 'repeat');
  }
}
```

### 7.6 `<gui-point>`

**Purpose:** Draggable point marker

**Properties:**
- `point` - Point instance from mesh
- `image` - Image instance (for offset)
- `selected` - Boolean
- `highlighted` - Boolean

**Template:**
```html
<div
  class="point"
  class:selected=${this.selected}
  class:highlighted=${this.highlighted}
  style="
    left: ${this.image.morpherImage.getX() + this.point.x}px;
    top: ${this.image.morpherImage.getY() + this.point.y}px;
  "
  @mousedown=${this.handleDragStart}
  @click=${this.handleClick}
>
</div>
```

**Drag Behavior:**
```javascript
handleDragStart(e) {
  e.preventDefault();
  this.dragging = true;
  this.emit('drag:start', { point: this.point });

  const handleMove = (e) => {
    const rect = this.parentElement.getBoundingClientRect();
    const x = e.clientX - rect.left - this.image.morpherImage.getX();
    const y = e.clientY - rect.top - this.image.morpherImage.getY();
    this.point.setX(x);
    this.point.setY(y);
    this.emit('drag:move', { point: this.point });
  };

  const handleUp = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleUp);
    this.emit('drag:stop', { point: this.point });
  };

  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleUp);
}
```

### 7.7 `<gui-midpoint>`

**Purpose:** Edge midpoint for splitting

**Properties:**
- `p1` - First Point
- `p2` - Second Point
- `image` - Image instance
- `triangle` - Triangle instance (can belong to multiple)

**Template:**
```html
<div
  class="midpoint"
  style="
    left: ${this.image.morpherImage.getX() + (this.p1.x + this.p2.x) / 2}px;
    top: ${this.image.morpherImage.getY() + (this.p1.y + this.p2.y) / 2}px;
  "
  @click=${this.handleClick}
>
</div>
```

**Click Behavior:**
```javascript
handleClick(e) {
  e.stopPropagation();
  this.emit('edge:split', { p1: this.p1, p2: this.p2 });
}
```

### 7.8 `<gui-popup>`

**Purpose:** Modal dialog system

**Static Methods:**
```javascript
class GuiPopup extends HTMLElement {
  static show(config) {
    const popup = document.querySelector('gui-popup');
    popup.open(config);
  }

  open({ title, content, onClose }) {
    this.title = title;
    this.content = content;
    this.onClose = onClose;
    this.visible = true;
    this.render();
  }

  close() {
    this.visible = false;
    this.onClose?.();
    this.render();
  }
}
```

**Template:**
```html
${this.visible ? html`
  <div class="popup-overlay" @click=${this.handleOverlayClick}>
    <div class="popup-content" @click=${this.handleContentClick}>
      <div class="popup-header">
        <h2>${this.title}</h2>
        <button class="close-btn" @click=${this.close}>×</button>
      </div>
      <div class="popup-body">
        ${unsafeHTML(this.content)}
      </div>
    </div>
  </div>
` : ''}
```

---

## 8. Integration Requirements

### 8.1 Morpher Library Integration

**Import:**
```javascript
import { Morpher, Image as MorpherImage } from '@morpher-js/morpher';
```

**Usage Pattern:**
```javascript
// Create morpher
const morpher = new Morpher();
document.body.appendChild(morpher.canvas);

// Add images
const img1 = new MorpherImage();
img1.setSrc('path/to/image1.jpg');
morpher.addImage(img1);

const img2 = new MorpherImage();
img2.setSrc('path/to/image2.jpg');
morpher.addImage(img2);

// Add geometry
morpher.addPoint({ x: 50, y: 50 });
morpher.addPoint({ x: 150, y: 50 });
morpher.addPoint({ x: 100, y: 150 });
morpher.addTriangle(0, 1, 2);

// Set weights
morpher.set([0.5, 0.5]);

// Animate
morpher.animate([0, 1], 2000);

// Listen to events
morpher.addEventListener('load', (e) => {
  console.log('Morpher loaded');
});

morpher.addEventListener('draw', (e) => {
  console.log('Frame drawn');
});
```

### 8.2 Event Bridging

**Morpher → GUI:**
```javascript
// In Project.js
this.morpher.addEventListener('change', (e) => {
  this.save(); // Auto-save on geometry changes
});

this.morpher.addEventListener('image:add', (e) => {
  const { image } = e.detail;
  // Update UI
});

this.morpher.addEventListener('point:add', (e) => {
  // Create gui-point element
});
```

**GUI → Morpher:**
```javascript
// In Image model
set targetWeight(value) {
  this._targetWeight = value;
  this.morpherImage.setWeight(value);
}

// In Project
addTriangle(p1, p2, p3) {
  this.morpher.addTriangle(p1, p2, p3);
}
```

### 8.3 JSON Serialization

**Export:**
```javascript
getCode() {
  const json = this.morpher.toJSON();
  // Replace image data with URLs
  json.images.forEach((img, i) => {
    img.src = this.images[i].url;
  });
  return JSON.stringify(json, null, 2);
}
```

**Import:**
```javascript
loadFromJSON(json) {
  this.morpher.fromJSON(json);
  // Sync GUI state
  this.images.forEach((img, i) => {
    img.weight = json.images[i].weight;
    img.targetWeight = json.images[i].weight;
  });
}
```

---

## 9. Performance Requirements

### 9.1 Rendering Performance

**Targets:**
- Canvas redraw: < 16ms (60 FPS)
- Point drag update: < 10ms
- Weight slider update: < 16ms
- Mesh with 100 points: No visible lag

**Optimizations:**
- Use `requestAnimationFrame` for canvas updates
- Debounce weight slider updates (100ms)
- Cache pattern canvases
- Use `transform: translate3d()` for hardware acceleration

### 9.2 Memory Management

**Targets:**
- Max memory per project: 50MB
- Image data cleanup on delete
- No memory leaks on project switch

**Best Practices:**
- Call `dispose()` on morpher when project destroyed
- Remove event listeners in `disconnectedCallback`
- Clear canvas references
- Use WeakMap for component-to-model associations

### 9.3 Load Time

**Targets:**
- Initial page load: < 1s
- Project switch: < 100ms
- Image upload processing: < 500ms

**Strategies:**
- Code splitting for popups
- Lazy-load help content
- Preload critical CSS
- Use Vite's build optimization

---

## 10. Browser Compatibility

### 10.1 Target Browsers

**Minimum Supported:**
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Opera: Last 2 versions

**Required Features:**
- Web Components (Custom Elements v1)
- Shadow DOM v1
- ES6 Modules
- Canvas 2D API
- FileReader API
- localStorage

### 10.2 Polyfills

**Not Required** (all features natively supported in target browsers)

**Fallbacks:**
- If localStorage unavailable, warn user and use in-memory storage

---

## 11. Development Roadmap

### Phase 1: Foundation (Week 1-2)

**Tasks:**
- ✅ Set up Vite project structure
- ✅ Create base component class
- ✅ Implement ProjectStore
- ✅ Create Project and Image models
- ✅ Set up localStorage persistence

**Deliverable:** Working state management with localStorage

### Phase 2: Core Components (Week 3-4)

**Tasks:**
- Create `<gui-app>` root component
- Create `<gui-menu-bar>` with project controls
- Create `<gui-main>` container
- Create `<gui-project>` view
- Implement project switching

**Deliverable:** Multi-project navigation

### Phase 3: Image Editing (Week 5-6)

**Tasks:**
- Create `<gui-image-tile>` component
- Implement file upload and URL input
- Implement canvas rendering with mesh overlay
- Create `<gui-point>` draggable component
- Create `<gui-midpoint>` split component
- Implement move mode

**Deliverable:** Full image mesh editing

### Phase 4: Mesh Operations (Week 7)

**Tasks:**
- Implement point addition on canvas click
- Implement triangle creation from 3 points
- Implement edge splitting
- Implement point deletion
- Sync mesh across all images

**Deliverable:** Complete mesh editing functionality

### Phase 5: Weight Control (Week 8)

**Tasks:**
- Implement weight sliders
- Implement auto-normalization
- Connect to morpher.set()
- Real-time preview

**Deliverable:** Working blend weight control

### Phase 6: Export & Advanced (Week 9-10)

**Tasks:**
- Create `<gui-popup>` component
- Implement JSON export dialog
- Implement help dialog
- Implement custom function editors
- Add code syntax highlighting

**Deliverable:** Export and advanced features

### Phase 7: Polish & Testing (Week 11-12)

**Tasks:**
- Add animations and transitions
- Responsive layout adjustments
- Cross-browser testing
- Performance profiling
- Bug fixes
- Documentation

**Deliverable:** Production-ready application

---

## 12. Success Criteria

### 12.1 Functional Completeness

- ✅ All legacy features implemented
- ✅ No regression in functionality
- ✅ Export JSON matches legacy format
- ✅ Projects persist across page reloads

### 12.2 Performance

- ✅ 60 FPS rendering during drag operations
- ✅ < 1s initial load time
- ✅ No memory leaks after 1 hour of use

### 12.3 Code Quality

- ✅ 100% ES6+ modules (no global variables)
- ✅ Modular component architecture
- ✅ Comprehensive inline documentation
- ✅ Consistent code style (ESLint/Prettier)

### 12.4 User Experience

- ✅ Intuitive UI matching legacy design
- ✅ Smooth animations and transitions
- ✅ Responsive feedback to all interactions
- ✅ No UI blocking during heavy operations

### 12.5 Developer Experience

- ✅ Hot module replacement working
- ✅ < 5s dev server start time
- ✅ < 3s production build time
- ✅ Clear component structure for future maintenance

---

## Appendix A: Technology Stack Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Build Tool | Vite | 5.x | Dev server, HMR, bundling |
| UI Framework | Web Components | Native | Component architecture |
| Core Library | @morpher-js/morpher | 2.x | Image morphing engine |
| Storage | localStorage | Native | Project persistence |
| Language | ES6+ | Latest | Modern JavaScript |
| Styling | CSS3 | Latest | Component styling |
| Module System | ES Modules | Native | Import/export |

---

## Appendix B: File Size Estimates

| Asset | Estimated Size | Notes |
|-------|----------------|-------|
| Main JS bundle | 50-80 KB | Gzipped, including all components |
| Morpher library | 30-40 KB | Gzipped, from packages/morpher |
| CSS | 10-15 KB | Gzipped, all styles |
| Icon font | 20-30 KB | Modern Pictograms WOFF2 |
| Sample images | 200-500 KB | Optional, for demo |
| **Total** | **110-165 KB** | Excluding sample images |

---

## Appendix C: Migration Checklist

**CoffeeScript → ES6+**
- [x] Class syntax conversion
- [x] Arrow functions (`=>` → `() =>`)
- [x] Property accessors (`@property` → `this.property`)
- [x] Conditional operators (`unless` → `if (!...)`)
- [x] Optional chaining (`?.`)

**Backbone.js → Web Components**
- [x] Views → Custom Elements
- [x] Models → Plain classes with EventTarget
- [x] Collections → Arrays with event emitters
- [x] Events → CustomEvent with `detail`
- [x] Templates → Template literals

**Middleman → Vite**
- [x] HAML → HTML
- [x] SASS → CSS (PostCSS optional)
- [x] Sprockets → ES modules
- [x] Ruby gems → npm packages

---

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Morpher** | The core image morphing library instance |
| **Mesh** | Collection of points and triangles defining geometry |
| **Point** | 2D coordinate in the mesh |
| **Triangle** | Three points defining a mesh region |
| **Midpoint** | Center point of a triangle edge (for splitting) |
| **Weight** | Blend opacity for an image (0-1) |
| **Project** | Complete configuration with images and mesh |
| **Tile** | UI card displaying a single image with controls |

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-24 | Initial PRD creation | AI Assistant |

---

**End of Product Requirements Document**
