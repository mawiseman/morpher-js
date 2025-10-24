# GUI2 Troubleshooting Guide

## Issues Fixed

### 1. Images Not Displaying After Upload ✅

**Problem:** When uploading images, they wouldn't appear in the canvas container.

**Root Causes:**
1. Using wrong canvas element (`canvas` instead of `source`)
2. Event system mismatch (`addEventListener` vs `on()`)
3. Missing mesh bounds (image needs points for proper rendering)

**Solutions:**
- Display `image.morpherImage.source` canvas (the rendered output)
- Use `on()` method from EventDispatcher (not native `addEventListener`)
- Auto-add 4 corner points to mesh when image loads
- Chain load events: MorpherImage → ImageModel → GuiImage

**Files Changed:**
- `src/components/gui-image.js` - Display correct canvas, listen to events
- `src/models/Image.js` - Forward load events to GUI
- `src/models/Project.js` - Add default mesh points on load

### 2. Unable to Drop Points on Images ✅

**Problem:** Clicking on canvas wouldn't add mesh points.

**Root Causes:**
1. Click listener attached before canvas exists
2. Canvas gets replaced during updates
3. Coordinates not accounting for canvas scaling

**Solutions:**
- Attach click listener when canvas is actually added (in `updateCanvas()`)
- Calculate scaled coordinates properly: `(clientX - rect.left) * (canvas.width / rect.width)`
- Store and remove old listeners before attaching new ones
- Add visual feedback (crosshair cursor, border highlight on hover)

**Files Changed:**
- `src/components/gui-image.js` - New `attachCanvasClickListener()` method
- `src/styles/main.css` - Crosshair cursor, hover effects

### 3. Console Debugging Added

**Debug Logs:**
```javascript
// Image loading
"Setting image source from file: blob:..."
"MorpherImage loaded! Source canvas: ..."
"Canvas size: 800 x 600"

// Mesh setup
"Image loaded in project, setting up default mesh"
"Adding default corner points for 800 x 600 image"

// Canvas display
"ImageModel load event received"
"updateCanvas called"
"Updating canvas, source: <canvas>"
"Canvas appended to container"

// Point addition
"Canvas click listener attached"
"Canvas clicked at: { x: 123, y: 456, canvasSize: { w: 800, h: 600 } }"
```

---

## How to Use GUI2

### 1. Start the GUI
```bash
npm run dev:gui2
```
Open http://localhost:3002

### 2. Create a Project
1. Click "+ New Project"
2. Enter a project name in the input field
3. The project color will be randomly assigned

### 3. Add Images
1. Click "+ Add Image" in the project
2. Select an image file from your computer
3. **Wait for image to load** - you'll see it appear in the canvas
4. The image will automatically get 4 corner mesh points

### 4. Add Mesh Points
1. **Click anywhere on the image canvas** to add a point
2. You'll see the cursor change to a crosshair
3. The border will highlight blue on hover
4. Check console for "Canvas clicked at: ..." message
5. Points are automatically saved to localStorage

### 5. Adjust Weights
1. Use the weight slider below each image
2. Weights control the blend amount in the final morph
3. Weights automatically adjust to sum to 1.0

### 6. Export Project
1. Click "Export JSON" button
2. The JSON configuration will appear in a popup
3. Copy and paste into your application code

---

## Common Issues

### Double Confirm Prompt When Removing Image ✅
**Problem:** When clicking the × button to remove an image, two confirm dialogs appear. After clicking OK twice, the image is removed but the box remains until page refresh.

**Root Cause:**
The custom `remove()` method in `GuiImage` conflicted with the native DOM `remove()` method:
```javascript
// This caused issues:
remove() {
  if (confirm('Remove this image?')) {
    this.project.removeImage(this.image);
  }
}
// When gui-project.js called: this.imageViews[index].remove()
// It triggered BOTH the custom method AND tried to remove the element
```

**Solution:**
Renamed the method to avoid native DOM method conflict:
```javascript
// Fixed:
removeImage() {
  if (confirm('Remove this image?')) {
    this.project.removeImage(this.image);
  }
}
// Button now calls: data-action="removeImage"
```

Now clicking × shows one confirm dialog and properly removes both the image data and DOM element.

### Images Not Scaling Consistently ✅
**Problem:** First image scales correctly, but subsequent images don't fit their containers.

**Solution:**
Updated CSS to constrain both width and height:
```css
.image-canvas-container {
  max-height: 400px;
  overflow: hidden;
}

.image-canvas-container canvas {
  max-width: 100%;
  max-height: 380px;
  width: auto;
  height: auto;
  object-fit: contain;
}
```

This ensures all canvases scale proportionally to fit their containers while maintaining aspect ratio.

### Images Not Loading
**Check console for:**
- "Setting image source from file: blob:..." ✓
- "MorpherImage loaded!" ✓
- "Canvas appended to container" ✓

**If missing:**
- Ensure file is a valid image format (JPG, PNG, GIF)
- Check browser console for errors
- Try a different image file

### Points Not Adding
**Check console for:**
- "Canvas click listener attached" ✓
- "Canvas clicked at: ..." when you click ✓

**If missing:**
- Ensure image has loaded first
- Check that canvas has crosshair cursor
- Try clicking directly on the image (not the container)

### Canvas Not Visible
**Common causes:**
- Image hasn't loaded yet (wait a moment)
- Mesh has no points (should auto-add on load)
- Canvas container CSS issue (check element inspector)

---

## Architecture Notes

### Event Flow
```
User uploads file
  → ImageModel.setFile()
    → MorpherImage.setSrc()
      → Image loads
        → MorpherImage 'load' event
          → ImageModel 'load' event
            → ProjectModel adds default points
            → GuiImage.updateCanvas()
              → Canvas displayed
              → Click listener attached
```

### Canvas Coordinate System
The canvas may be scaled to fit the container, so clicks need coordinate conversion:

```javascript
// Browser coordinates (e.clientX, e.clientY)
// ↓
// Rect coordinates (relative to canvas element)
const rectX = e.clientX - rect.left;
const rectY = e.clientY - rect.top;

// ↓ Scale to actual canvas size
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;

const canvasX = rectX * scaleX;  // Actual canvas coordinate
const canvasY = rectY * scaleY;
```

### Mesh Point System
- Each image has its own mesh (collection of points)
- Minimum 3 points required for triangulation
- Default: 4 corner points (auto-added on load)
- Points stored as `{ x, y }` in canvas coordinates
- Mesh calculates bounds automatically

---

## Future Enhancements

### Draggable Points
Currently points can only be added by clicking. To add dragging:

1. Create point markers (visual dots on canvas)
2. Attach mousedown/mousemove/mouseup handlers
3. Update point position during drag
4. Redraw canvas on point move

### Visual Point Indicators
Draw circles/dots on the canvas to show point positions:

```javascript
ctx.fillStyle = '#4a9eff';
points.forEach(point => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
});
```

### Undo/Redo
Implement command pattern for history:

```javascript
class AddPointCommand {
  execute() { image.addPoint(x, y); }
  undo() { image.removeLastPoint(); }
}
```

---

## Getting Help

If you encounter issues:

1. **Check browser console** - All operations are logged
2. **Verify image loaded** - Look for "MorpherImage loaded!" message
3. **Check canvas exists** - Inspect element in DevTools
4. **Try a simple test** - Upload a small PNG and click center

**Report bugs at:** https://github.com/jembezmamy/morpher-js/issues
