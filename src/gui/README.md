# MorpherJS GUI - React Migration

This directory contains the modernized React-based GUI editor for MorpherJS, migrated from the original Backbone.js implementation.

## Architecture

### Migration Overview

The GUI has been completely rewritten in React while maintaining the same functionality as the original Backbone.js version. Key changes:

- **Backbone Models → React Hooks**: State management moved to custom hooks
- **Backbone Views → React Components**: All views converted to functional components
- **Backbone.LocalStorage → Custom Storage**: Modern localStorage utility
- **HAML Templates → JSX**: Templates converted to React JSX
- **SASS → Modern CSS**: Styles converted to vanilla CSS
- **jQuery → React DOM**: Direct DOM manipulation replaced with React state

### Directory Structure

```
src/gui/
├── App.jsx                 # Main application component
├── main.jsx                # React entry point
├── components/
│   ├── Main.jsx            # Top-level GUI (replaces Backbone Main view)
│   ├── Project.jsx         # Project management (replaces Backbone Project view)
│   ├── ImageTile.jsx       # Image tile with canvas (replaces Backbone Image view)
│   ├── Tile.jsx            # Base tile component
│   ├── Point.jsx           # Draggable mesh point (replaces Backbone Point view)
│   ├── Midpoint.jsx        # Edge midpoint for splitting (replaces Backbone Midpoint view)
│   └── Popup.jsx           # Popup/modal component
├── hooks/
│   ├── useProjects.js      # Projects state management (replaces Backbone Projects collection)
│   └── useImages.js        # Images state management (replaces Backbone Images collection)
├── utils/
│   └── storage.js          # LocalStorage utilities (replaces Backbone.LocalStorage)
└── styles/
    └── application.css     # Main stylesheet (converted from SASS)
```

## Components

### Main Components

#### `Main.jsx`
- Top-level GUI component
- Manages multiple projects
- Project navigation and creation
- Help popup

**Original:** `source/javascripts/views/main.js.coffee` (Backbone View)

#### `Project.jsx`
- Individual project view
- Manages images and preview
- Blend/final touch function editing
- Code export

**Original:** `source/javascripts/views/project.js.coffee` (Backbone View)

#### `ImageTile.jsx`
- Image display and editing
- Canvas rendering with mesh overlay
- Point and midpoint management
- Drag-and-drop for points
- Move mode for repositioning

**Original:** `source/javascripts/views/image.js.coffee` (Backbone View)

#### `Point.jsx`
- Draggable mesh point
- Selection state
- Highlight on hover

**Original:** `source/javascripts/views/_point.js.coffee` (Backbone View)

#### `Midpoint.jsx`
- Edge midpoint visualization
- Click to split edge

**Original:** `source/javascripts/views/midpoint.js.coffee` (Backbone View)

#### `Popup.jsx`
- Modal popup component
- Reusable for help, code export, function editing
- ESC key to close

**Original:** `source/javascripts/views/popup.js.coffee` (Backbone View)

### Custom Hooks

#### `useProjects()`
- Manages all projects
- localStorage persistence
- CRUD operations
- Project switching

**Replaces:** `Gui.Models.Project` and `Gui.Collections.Projects` (Backbone)

#### `useImages(project, updateProject, saveProject)`
- Manages images within a project
- Image CRUD operations
- Weight normalization
- File loading

**Replaces:** `Gui.Models.Image` and `Gui.Collections.Images` (Backbone)

## Features

### Complete Feature Parity

All features from the original Backbone GUI have been preserved:

✅ **Multi-Project Management**
- Create/delete projects
- Switch between projects
- Auto-save to localStorage
- Project naming
- Color-coded projects

✅ **Image Management**
- Add multiple images
- Load from local files
- Reposition images (move mode)
- Delete images
- Weight sliders for morphing

✅ **Mesh Editing**
- Click to add points
- Drag points to adjust mesh
- Select 3 points to create triangles
- Click midpoints to split edges
- Visual feedback (highlight, selection)

✅ **Custom Functions**
- Edit blend function
- Edit final touch function
- Live preview

✅ **Export**
- Export JSON configuration
- Copy to clipboard

✅ **Help System**
- Comprehensive help documentation
- Keyboard shortcuts (ESC to close popups)

### Modern Improvements

🎨 **Better UI/UX**
- Smoother interactions
- Better visual feedback
- Responsive design
- Modern color scheme

⚡ **Performance**
- React's efficient re-rendering
- No jQuery overhead
- Optimized event handlers
- Better memory management

🛡️ **Type Safety**
- Easier to extend with TypeScript
- Better error handling
- Clearer data flow

🧪 **Testability**
- Components are pure functions
- Easy to unit test
- Mockable hooks

## Usage

### Development

```bash
# Start development server
npm run dev

# Open GUI editor
# Navigate to http://localhost:3000/gui.html
```

### Adding to Your Project

```javascript
import { Morpher } from './src/index.js';

// Use the Morpher library standalone (no GUI)
const morpher = new Morpher(config);

// Or use the GUI to create configurations
// and export the JSON
```

## Migration Notes

### Breaking Changes from Original

1. **No Global `window.Gui`**: The GUI is now a self-contained React app
2. **Different Event System**: Uses React synthetic events instead of Backbone events
3. **No jQuery**: All DOM manipulation uses React
4. **localStorage Structure**: Similar but reorganized for better performance

### Storage Format

Projects and images are stored in localStorage with the following keys:

- `Projects`: Array of all projects
- `Images{projectId}`: Images for each project

### Data Structure

```javascript
// Project
{
  id: 'Projects-123-abc',
  name: 'My Project',
  color: 'rgb(100, 150, 200)',
  morpher: { /* MorpherJS JSON */ },
  blend_function: 'function code...',
  final_touch_function: 'function code...'
}

// Image
{
  id: 'Images123-456-def',
  weight: 0.5,
  targetWeight: 0.5,
  url: 'myimage.jpg',
  file: 'data:image/jpeg;base64,...'
}
```

## Extending the GUI

### Adding New Components

```jsx
// src/gui/components/MyComponent.jsx
import React from 'react';

export function MyComponent({ project }) {
  return (
    <div className="my-component">
      {/* Your component */}
    </div>
  );
}
```

### Adding Custom Hooks

```javascript
// src/gui/hooks/useMyFeature.js
import { useState, useCallback } from 'react';

export function useMyFeature() {
  const [state, setState] = useState(null);

  const doSomething = useCallback(() => {
    // Implementation
  }, []);

  return { state, doSomething };
}
```

### Styling

Edit `src/gui/styles/application.css` to customize the appearance.

## Troubleshooting

### Images not loading
- Check browser console for errors
- Ensure file is a valid image format
- Check localStorage quota (5-10MB limit)

### Points not draggable
- Ensure move mode is OFF
- Check z-index in CSS
- Verify event handlers are attached

### localStorage full
- Clear old projects from localStorage
- Export important projects as JSON
- Reduce image file sizes

## Future Enhancements

- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts for common actions
- [ ] Drag-and-drop image upload
- [ ] Real-time collaboration
- [ ] Cloud storage option
- [ ] Mobile-optimized interface
- [ ] Animation timeline
- [ ] Preset morph effects

## Credits

**Original Backbone.js GUI:** Paweł Bator
**React Migration:** Claude Code (2025)

Based on MorpherJS v2.0 modernization project.
