# GUI2 Fixes

## Image Display Issue - Fixed

### Problem
Images were not displaying after upload/selection in the GUI2 interface.

### Root Cause
The `gui-image` component was trying to display the wrong canvas element:
- The morpher `Image` class has TWO canvases:
  - `el` - The original HTMLImageElement (hidden, used for loading)
  - `source` - A canvas element where the image is rendered
- The GUI was attempting to display the wrong one (or not finding the canvas at all)

### Solution
Updated `gui-image.js` component to:
1. Display the `image.morpherImage.source` canvas (not `image.morpherImage.canvas`)
2. Listen to the `on()` event system (not `addEventListener()`) since EventDispatcher uses custom API
3. Refresh canvas on both `load` and `change` events

### Code Changes

**File:** `packages/gui2/src/components/gui-image.js`

```javascript
// Before (wrong):
container.appendChild(this.image.morpherImage.canvas);

// After (correct):
container.appendChild(this.image.morpherImage.source);
```

Also added event listeners:

```javascript
// Listen for image load events
this.image.morpherImage.on('load', () => {
  this.updateCanvas();
});

this.image.morpherImage.on('change', () => {
  this.updateCanvas();
});
```

### Testing
1. Start dev server: `npm run dev:gui2`
2. Open http://localhost:3002
3. Click "New Project"
4. Click "Add Image"
5. Upload an image file
6. **Expected:** Image should display in the image canvas container
7. Check browser console for debug logs

### Debug Logs Added
- `setFile()` in Image.js logs the URL being set
- `updateCanvas()` in gui-image.js logs canvas updates
- Console logs will show dimensions and whether canvas is appended

### Related Files
- `packages/gui2/src/components/gui-image.js` - Main fix
- `packages/gui2/src/models/Image.js` - Added logging
- `packages/morpher/src/image.js` - Reference for Image class structure
