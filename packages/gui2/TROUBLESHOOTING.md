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

### 4. Points Not Visible When Added ✅

**Problem:** Clicking on canvas to add points works, but no visual feedback shows where the points are located.

**Root Cause:**
The mesh system internally stores points, but the canvas only displays the base image. There was no code to draw visual markers (dots/circles) showing the point locations.

**Solution:**
Added `drawPoints()` method to `gui-image.js` that:
- Redraws the base image on the canvas
- Draws blue circles with white borders at each point location
- Labels each point with its number (1, 2, 3, etc.)
- Updates automatically when points are added

**Code Added:**
```javascript
drawPoints() {
  const canvas = this.image.morpherImage.source;
  const ctx = canvas.getContext('2d');
  const points = this.image.morpherImage.points;

  // Redraw base image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(this.image.morpherImage.el, 0, 0);

  // Draw point markers
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4a9eff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw point number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index + 1, point.x, point.y);
  });
}
```

**Files Changed:**
- `src/components/gui-image.js` - Added `drawPoints()` method, event listener for `point:add` events

**Visual Result:**
- Blue circles with white outlines appear at each mesh point
- Each point is numbered sequentially (0-indexed)
- Points are redrawn whenever the canvas updates
- Default 4 corner points are now visible on load

### 5. Triangles Not Being Created (Empty triangles array in export) ✅

**Problem:** When exporting JSON, the `triangles` array is empty even though points have been added. Without triangles, the mesh cannot morph between images.

**Root Cause:**
In the original morpher-js GUI, triangles are not created automatically. Users must:
1. Click existing points to select them (3 points needed)
2. After selecting 3 points, a triangle is automatically created
3. Triangulation must be done manually by the user

The GUI2 was only adding points but had no selection or triangulation system.

**Solution:**
Implemented point selection and automatic triangulation:

1. **Click detection** - Distinguish between clicking existing points vs empty canvas
2. **Point selection** - Track up to 3 selected points with visual feedback
3. **Auto-triangulation** - Create triangle when 3 points are selected

**Code Added to `gui-image.js`:**
```javascript
// In constructor
this.selectedPoints = []; // Track selected points for triangle creation

// In click handler
// Check if clicking near an existing point (within 10px radius)
const points = this.image.morpherImage.points;
let clickedPointIndex = -1;
const clickRadius = 10;

for (let i = 0; i < points.length; i++) {
  const p = points[i];
  const distance = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
  if (distance < clickRadius) {
    clickedPointIndex = i;
    break;
  }
}

if (clickedPointIndex !== -1) {
  // Clicked on existing point - toggle selection
  this.togglePointSelection(clickedPointIndex);
} else {
  // Clicked on empty area - add new point
  this.image.addPoint(x, y);
}

// togglePointSelection method
togglePointSelection(pointIndex) {
  const index = this.selectedPoints.indexOf(pointIndex);

  if (index !== -1) {
    this.selectedPoints.splice(index, 1); // Deselect
  } else {
    this.selectedPoints.push(pointIndex); // Select

    // If 3 points selected, create triangle
    if (this.selectedPoints.length === 3) {
      this.project.addTriangle(
        this.selectedPoints[0],
        this.selectedPoints[1],
        this.selectedPoints[2]
      );
      this.selectedPoints = []; // Clear selection
    }
  }
}
```

**Updated `drawPoints()` to show selection:**
```javascript
const isSelected = this.selectedPoints.includes(index);

// Draw point circle with different style if selected
ctx.beginPath();
ctx.arc(point.x, point.y, isSelected ? 7 : 5, 0, Math.PI * 2);
ctx.fillStyle = isSelected ? '#ff6b6b' : '#4a9eff'; // Red when selected
ctx.fill();
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = isSelected ? 3 : 2;
ctx.stroke();
```

**How to Use:**
1. Upload 2+ images
2. Click on empty canvas areas to add points
3. Click on existing points (blue dots) to select them
4. Selected points turn red and get larger
5. After selecting 3 points, a triangle is automatically created
6. Selection clears and you can select 3 more points for another triangle
7. Repeat until mesh is fully triangulated
8. Export JSON will now contain triangles array

**Files Changed:**
- `src/components/gui-image.js` - Added selection tracking, click detection, auto-triangulation

### 6. Need Browser Refresh After Deleting All Projects ✅

**Problem:** When deleting the last project, the UI doesn't update properly. User must refresh the browser before they can add a new project.

**Root Cause:**
The `deleteProject()` method called `this.render()` after deletion, which:
1. Replaced the entire innerHTML, removing all event listeners
2. Didn't show any helpful message when projects.length === 0
3. Left the UI in an unusable state

**Solution:**
1. Removed the `this.render()` call from `deleteProject()`
2. Added an "empty state" message shown when no projects exist
3. Updated `showProject()` to toggle between project view and empty state

**Code Changes:**

**Added empty state to template ([gui-main.js:37-40](packages/gui2/src/components/gui-main.js#L37-L40)):**
```javascript
<div class="empty-state" style="display: none;">
  <h2>No Projects Yet</h2>
  <p>Click "+ New Project" to create your first morphing project</p>
</div>
```

**Updated showProject to handle empty state ([gui-main.js:92-117](packages/gui2/src/components/gui-main.js#L92-L117)):**
```javascript
showProject(index) {
  const emptyState = this.$('.empty-state');
  const projectsContainer = this.$('.projects');

  if (this.projects.length === 0) {
    this.updateMenu(null);
    if (emptyState) emptyState.style.display = 'flex';
    if (projectsContainer) projectsContainer.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (projectsContainer) projectsContainer.style.display = 'block';
  // ... rest of logic
}
```

**Updated deleteProject ([gui-main.js:166-188](packages/gui2/src/components/gui-main.js#L166-L188)):**
```javascript
deleteProject() {
  const project = this.projects[this.currentIndex];
  if (!project) return;

  if (confirm(`Are you sure you want to delete '${project.name}'?`)) {
    project.destroy();

    // Remove view
    const projectViews = this.$$('gui-project');
    projectViews[this.currentIndex].remove();

    // Remove from array
    this.projects.splice(this.currentIndex, 1);

    // Show previous project or empty state
    if (this.projects.length === 0) {
      this.currentIndex = 0;
      this.showProject(0); // Will show empty state
    } else {
      this.showProject(Math.max(0, this.currentIndex - 1));
    }
    // NO this.render() call - preserves event listeners
  }
}
```

**Added CSS for empty state ([main.css:343-363](packages/gui2/src/styles/main.css#L343-L363)):**
```css
.empty-state {
  flex: 1;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 40px;
  text-align: center;
}

.empty-state h2 {
  font-size: 32px;
  color: #888;
}

.empty-state p {
  font-size: 18px;
  color: #666;
}
```

**Files Changed:**
- `src/components/gui-main.js` - Updated template, showProject(), deleteProject()
- `src/styles/main.css` - Added empty state styling

**Result:**
- Deleting the last project now shows a centered empty state message
- "+ New Project" button remains functional
- No browser refresh needed
- Clean, professional UX

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
