# MorpherJS GUI Editor

Visual editor for creating and managing morphing projects with MorpherJS.

## Features

- **Multi-Project Management** - Create and manage multiple morphing projects
- **Visual Mesh Editing** - Drag-and-drop mesh editing with real-time preview
- **Image Management** - Add, remove, and configure images
- **Weight Controls** - Adjust blend weights with sliders
- **Custom Functions** - Define custom blend and final touch functions
- **Export/Import** - Export projects to JSON for use in your applications
- **LocalStorage Persistence** - Projects automatically saved to browser storage

## Running Locally

```bash
npm run dev
```

This will start the GUI editor on http://localhost:3001

## Building

```bash
npm run build
```

The built application will be in the `dist/` directory.

## Usage

### Creating a Project

1. Click "New Project" to create a new morphing project
2. Give it a meaningful name
3. Add images using the "Add Image" button
4. Upload image files for each image slot
5. Adjust mesh points by dragging them on the canvas
6. Set blend weights using the sliders

### Exporting Configuration

Once you've configured your morph, click "Export JSON" to get the configuration object. You can use this in your application:

```javascript
import { Morpher } from 'morpher-js';

const config = {
  // Your exported configuration
};

const morpher = new Morpher(config);
morpher.attach(document.getElementById('canvas'));
```

### Custom Functions

The GUI supports custom blend and final touch functions:

**Blend Function:**
```javascript
function(destination, source, weight) {
  const ctx = destination.getContext('2d');
  ctx.globalAlpha = weight;
  ctx.drawImage(source, 0, 0);
}
```

**Final Touch Function:**
```javascript
function(canvas) {
  const ctx = canvas.getContext('2d');
  // Apply final processing
}
```

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **MorpherJS** - Core morphing library
- **LocalStorage** - Data persistence

## Links

- [Core Library](../morpher/)
- [Demos](../demos/)
- [Documentation](../../docs/)
