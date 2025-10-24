# MorpherJS GUI v2

Modern GUI editor for MorpherJS built with **Vanilla JavaScript and Web Components**.

## Features

- **Zero Framework Dependencies** - Pure Web Components API
- **Multi-Project Management** - Create and manage multiple morphing projects
- **Visual Mesh Editing** - Click to add points, drag to adjust
- **Image Upload** - Drag & drop or click to upload images
- **Weight Controls** - Slider controls for blend weights
- **Custom Functions** - Define custom blend and final touch functions
- **Export to JSON** - Export projects for use in your applications
- **LocalStorage Persistence** - Projects automatically saved

## Technology Stack

- **Web Components** (Custom Elements API)
- **Vanilla JavaScript** (ES6+)
- **CSS Grid & Flexbox**
- **MorpherJS** - Core morphing library
- **Vite** - Build tool

## Running Locally

```bash
npm run dev
```

Opens GUI on http://localhost:3002

## Building

```bash
npm run build
```

## Architecture

### Models
- `ProjectModel` - Manages project state, images, and morpher instance
- `ImageModel` - Manages individual images and their properties

### Components (Web Components)
- `<gui-main>` - Main container with project management
- `<gui-project>` - Individual project view
- `<gui-image>` - Image view with canvas and controls

### Utilities
- `BaseComponent` - Base class for all components
- `LocalStorageManager` - Storage abstraction

## Usage

The GUI automatically starts when you open the page. You'll see:

1. **Menu Bar** - Create/delete projects, navigate between them
2. **Project View** - Current project with images and controls
3. **Images Grid** - All images in the project
4. **Preview** - Real-time morphing preview

### Adding Images & Creating Triangles

1. Click "+ Add Image"
2. Upload an image file
3. **Add mesh points** by clicking on empty canvas areas
   - Points appear as blue circles with numbers
   - 4 corner points are added automatically on load
4. **Create triangles** by selecting points:
   - Click on a blue point to select it (turns red)
   - Select 3 points total
   - Triangle is created automatically when 3 points are selected
   - Selection clears, repeat for more triangles
5. Adjust weight slider to control blend

**Visual Guide:**
- 🔵 **Blue circle** = Unselected point
- 🔴 **Red circle** (larger) = Selected point
- Click empty canvas = Add new point
- Click existing point = Toggle selection
- Select 3 points = Auto-create triangle

### Exporting

Click "Export JSON" to get configuration code:

```javascript
import { Morpher } from 'morpher-js';

const config = {
  // Your exported configuration
};

const morpher = new Morpher(config);
morpher.attach(canvas);
```

## Comparison to GUI v1 (React)

| Feature | GUI v1 (React) | GUI v2 (Web Components) |
|---------|----------------|-------------------------|
| Bundle Size | ~250 KB | ~35 KB |
| Dependencies | React, React-DOM | None (Vanilla JS) |
| Build Time | ~1.5s | ~0.5s |
| Learning Curve | Medium | Low |
| Browser Support | Modern | Modern (ES6+) |

## Migration from Backbone

This GUI replaces the original Backbone.js implementation with:

- **Backbone.Model** → `EventTarget` + vanilla classes
- **Backbone.View** → `HTMLElement` (Web Components)
- **Backbone.Events** → Native `CustomEvent`
- **Backbone.LocalStorage** → `LocalStorageManager`
- **jQuery** → Native DOM APIs
- **Underscore** → Native array methods

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires modern browsers with:
- Custom Elements API
- ES6 Classes
- CSS Grid
- LocalStorage

## Development

### Adding New Components

```javascript
import { BaseComponent } from '../utils/base-component.js';

class MyComponent extends BaseComponent {
  template() {
    return `<div>My Component</div>`;
  }

  attachEventListeners() {
    this.$('button').addEventListener('click', () => {
      console.log('Clicked!');
    });
  }
}

customElements.define('my-component', MyComponent);
```

### Component Lifecycle

1. `constructor()` - Initialize state
2. `connectedCallback()` - Element added to DOM
3. `render()` - Generate HTML from template
4. `attachEventListeners()` - Bind events
5. `disconnectedCallback()` - Cleanup

## Links

- [Core Library](../morpher/)
- [Demos](../demos/)
- [Documentation](../../docs/)
