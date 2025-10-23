# MorpherJS Examples

This directory contains interactive examples demonstrating various features of MorpherJS v2.0.

## Available Examples

### ✅ All Original Demos (`demos/`)

**Status:** Ready

Complete collection of all 5 original MorpherJS demonstrations, fully migrated to v2.0.

**Features:**
- Basic setup with plum/raspberry morphing
- Multiple images (3 parrots) with different sizes
- Various easing functions (cubic, elastic, custom)
- Custom blend and final touch functions
- Programmatic API usage examples

**Run:**
```bash
npm run dev
```
Then navigate to: `http://localhost:3000/examples/demos/`

**Learn:**
- Multiple image morphing techniques
- Custom easing function implementation
- Custom blend algorithms
- Final touch processing
- Programmatic mesh creation
- Working with real images

## Creating New Examples

To create a new example:

1. **Create directory:**
   ```bash
   mkdir examples/my-example
   ```

2. **Create index.html:**
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <title>My Example - MorpherJS</title>
   </head>
   <body>
     <div id="app"></div>
     <script type="module" src="./main.js"></script>
   </body>
   </html>
   ```

3. **Create main.js:**
   ```javascript
   import { Morpher } from '../../src/index.js';

   // Your example code here
   const morpher = new Morpher({ /* config */ });
   ```

4. **Create README.md:**
   Document what your example demonstrates.

5. **Update root index.html:**
   Add a link to your example in the examples grid.

## File Structure

```
examples/
├── README.md           # This file
├── demos/              # All original demos
│   ├── index.html     # Demo page
│   ├── demos.js       # Demo logic
│   └── README.md      # Demo documentation
└── [future examples]/
```

## Import Paths

All examples should import from the source directory:

```javascript
import { Morpher } from '../../src/index.js';
```

This ensures you're always using the latest development version.

## Running Examples

### Development Server

```bash
npm run dev
```

Access examples at:
- Root: `http://localhost:3000/`
- All Original Demos: `http://localhost:3000/examples/demos/`

### Production Build

```bash
npm run build
npm run preview
```

## Best Practices

### Code Organization
- Keep examples self-contained
- Include inline comments explaining key concepts
- Use clear variable names
- Follow ES6+ best practices

### Documentation
- Include README.md in each example directory
- Document what the example demonstrates
- List key features and learning points
- Provide usage instructions

### Performance
- Use requestAnimationFrame for animations
- Clean up event listeners
- Dispose of morpher instances when done
- Optimize mesh complexity

### Accessibility
- Include proper ARIA labels
- Ensure keyboard navigation works
- Provide text alternatives for visuals
- Test with screen readers

## Contributing Examples

Want to contribute an example? Great!

1. Create your example following the structure above
2. Ensure it works with `npm run dev`
3. Document it thoroughly
4. Test across browsers
5. Submit a pull request

## License

All examples are MIT licensed, same as MorpherJS.
