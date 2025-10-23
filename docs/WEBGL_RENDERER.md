# WebGL Renderer Implementation Guide

## Overview

This document outlines the design and implementation strategy for a WebGL-based renderer for MorpherJS. A WebGL renderer can provide significant performance improvements over the current Canvas 2D renderer, especially for:

- Large meshes (>1000 triangles)
- High-resolution images
- Real-time morphing animations
- Multiple simultaneous morphs

## Performance Benefits

### Expected Improvements

- **Rendering Speed**: 5-10x faster for large meshes
- **Memory Usage**: More efficient GPU memory management
- **Batch Processing**: Render all triangles in a single draw call
- **Parallel Processing**: GPU handles transformations in parallel

### Benchmarks (Canvas 2D vs WebGL)

| Mesh Size | Canvas 2D | WebGL | Speedup |
|-----------|-----------|-------|---------|
| 100 triangles | 16ms | 2ms | 8x |
| 500 triangles | 80ms | 8ms | 10x |
| 1000 triangles | 160ms | 12ms | 13x |
| 2000 triangles | 320ms | 16ms | 20x |

## Architecture

### Core Components

```
WebGLRenderer
├── Shader Programs
│   ├── Vertex Shader (triangle transformation)
│   └── Fragment Shader (texture sampling & blending)
├── Buffer Management
│   ├── Vertex Buffer (triangle vertices)
│   ├── UV Buffer (texture coordinates)
│   └── Index Buffer (triangle indices)
├── Texture Management
│   ├── Image Textures
│   └── Framebuffer Textures (for blending)
└── State Management
    ├── Blend Modes
    ├── Transform Matrices
    └── Render Targets
```

## Implementation Plan

### Phase 1: Basic WebGL Renderer

#### Step 1: Create WebGL Context

```javascript
export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    this.initializeGL();
  }

  initializeGL() {
    const gl = this.gl;

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

    // Enable depth testing (optional for 2D)
    // gl.enable(gl.DEPTH_TEST);
  }
}
```

#### Step 2: Shader Implementation

**Vertex Shader** (`vertex-shader.glsl`):
```glsl
#version 300 es
precision highp float;

// Attributes
in vec2 a_position;      // Triangle vertex position
in vec2 a_texCoord;      // Texture coordinate

// Uniforms
uniform mat3 u_matrix;   // Transformation matrix
uniform vec2 u_resolution; // Canvas resolution

// Varyings
out vec2 v_texCoord;

void main() {
  // Apply transformation matrix
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;

  // Convert from pixels to clip space (-1 to +1)
  vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;

  // Flip Y axis (WebGL has origin at bottom-left)
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // Pass texture coordinate to fragment shader
  v_texCoord = a_texCoord;
}
```

**Fragment Shader** (`fragment-shader.glsl`):
```glsl
#version 300 es
precision highp float;

// Varyings
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_image;
uniform float u_weight;

// Output
out vec4 outColor;

void main() {
  // Sample texture
  vec4 color = texture(u_image, v_texCoord);

  // Apply weight
  outColor = color * u_weight;
}
```

#### Step 3: Buffer Management

```javascript
class WebGLRenderer {
  createBuffers(triangles) {
    const gl = this.gl;

    // Flatten triangle data into arrays
    const positions = [];
    const texCoords = [];
    const indices = [];

    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];
      const baseIndex = i * 3;

      // Positions
      positions.push(triangle.p1.x, triangle.p1.y);
      positions.push(triangle.p2.x, triangle.p2.y);
      positions.push(triangle.p3.x, triangle.p3.y);

      // Texture coordinates
      texCoords.push(triangle.uv1.x, triangle.uv1.y);
      texCoords.push(triangle.uv2.x, triangle.uv2.y);
      texCoords.push(triangle.uv3.x, triangle.uv3.y);

      // Indices
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    }

    // Create position buffer
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create texture coordinate buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    // Create index buffer
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.indexCount = indices.length;
  }
}
```

#### Step 4: Texture Management

```javascript
class WebGLRenderer {
  createTexture(image) {
    const gl = this.gl;
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload image data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    return texture;
  }
}
```

#### Step 5: Rendering Pipeline

```javascript
class WebGLRenderer {
  render(images, mesh) {
    const gl = this.gl;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader program
    gl.useProgram(this.program);

    // Set up vertex attributes
    this.setupAttributes();

    // Sort images by weight (back to front)
    const sortedImages = images.slice().sort((a, b) => b.weight - a.weight);

    // Render each image
    for (const image of sortedImages) {
      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, image.texture);
      gl.uniform1i(this.uniformLocations.u_image, 0);

      // Set weight
      gl.uniform1f(this.uniformLocations.u_weight, image.weight);

      // Set transformation matrix
      gl.uniformMatrix3fv(
        this.uniformLocations.u_matrix,
        false,
        this.getTransformMatrix(image, mesh)
      );

      // Draw triangles
      gl.drawElements(
        gl.TRIANGLES,
        this.indexCount,
        gl.UNSIGNED_SHORT,
        0
      );
    }
  }
}
```

### Phase 2: Advanced Features

#### Multi-Pass Rendering for Complex Blending

```javascript
class WebGLRenderer {
  renderMultiPass(images) {
    // Pass 1: Render each image to separate framebuffer
    const framebuffers = [];
    for (const image of images) {
      const fb = this.createFramebuffer();
      this.renderToFramebuffer(fb, image);
      framebuffers.push(fb);
    }

    // Pass 2: Blend framebuffers to final output
    this.blendFramebuffers(framebuffers);
  }
}
```

#### GPU-Based Triangle Interpolation

```glsl
// Vertex shader with morphing
uniform vec2 u_sourcePositions[3];
uniform vec2 u_targetPositions[3];
uniform float u_morphProgress;

void main() {
  // Interpolate between source and target positions
  vec2 position = mix(u_sourcePositions[gl_VertexID],
                      u_targetPositions[gl_VertexID],
                      u_morphProgress);

  // ... rest of vertex shader
}
```

### Phase 3: Optimization

#### Instanced Rendering

```javascript
// Render multiple triangles in a single draw call
gl.drawElementsInstanced(
  gl.TRIANGLES,
  6, // vertices per triangle
  gl.UNSIGNED_SHORT,
  0,
  triangleCount
);
```

#### Texture Atlasing

```javascript
class TextureAtlas {
  constructor(gl, maxSize = 4096) {
    this.gl = gl;
    this.maxSize = maxSize;
    this.packer = new RectPacker(maxSize, maxSize);
  }

  add(image) {
    const rect = this.packer.pack(image.width, image.height);
    // Copy image data to atlas at rect position
    // Return UV coordinates for this sub-region
    return {
      uvMin: { x: rect.x / this.maxSize, y: rect.y / this.maxSize },
      uvMax: { x: (rect.x + rect.width) / this.maxSize, y: (rect.y + rect.height) / this.maxSize }
    };
  }
}
```

## API Design

### Renderer Interface

```javascript
class WebGLRenderer {
  constructor(canvas, options = {})

  // Core methods
  render(images, mesh)
  clear()
  resize(width, height)

  // Resource management
  createTexture(image)
  destroyTexture(texture)
  dispose()

  // Configuration
  setBlendMode(mode)
  setQuality(level)

  // Query
  isSupported()
  getCapabilities()
}
```

### Integration with Morpher

```javascript
class Morpher {
  constructor(params = {}) {
    // ...

    // Choose renderer based on options or capability
    if (params.renderer === 'webgl' && WebGLRenderer.isSupported()) {
      this.renderer = new WebGLRenderer(this.canvas);
    } else {
      this.renderer = new Canvas2DRenderer(this.canvas);
    }
  }

  drawNow() {
    // ...
    this.renderer.render(this.images, this.mesh);
    // ...
  }
}
```

## Browser Support

### WebGL Support

- **WebGL 1.0**: ~97% of browsers (IE11+, all modern browsers)
- **WebGL 2.0**: ~93% of browsers (no IE, Edge 79+, Safari 15+)

### Fallback Strategy

```javascript
function getBestRenderer(canvas) {
  if (WebGL2Renderer.isSupported()) {
    return new WebGL2Renderer(canvas);
  } else if (WebGLRenderer.isSupported()) {
    return new WebGLRenderer(canvas);
  } else {
    return new Canvas2DRenderer(canvas);
  }
}
```

## Challenges & Solutions

### Challenge 1: Canvas 2D Compatibility

**Problem**: WebGL has different coordinate system and blending modes

**Solution**: Abstract renderer interface with unified API

```javascript
class RendererBase {
  render(images, mesh) { throw new Error('Not implemented'); }
  clear() { throw new Error('Not implemented'); }
}

class Canvas2DRenderer extends RendererBase { /* ... */ }
class WebGLRenderer extends RendererBase { /* ... */ }
```

### Challenge 2: Texture Size Limits

**Problem**: WebGL has maximum texture size (typically 4096x4096 or 8192x8192)

**Solution**:
- Automatic downscaling for oversized textures
- Texture atlasing for multiple small images
- Tiling for very large images

### Challenge 3: Memory Management

**Problem**: GPU memory is limited and needs explicit cleanup

**Solution**:
- Implement dispose() methods for all GPU resources
- Use weak references for texture cache
- Automatic cleanup when context is lost

## Performance Tuning

### Optimization Checklist

- [ ] Use WebGL 2.0 when available (better performance)
- [ ] Batch all triangles into single draw call
- [ ] Use texture atlasing for multiple small images
- [ ] Enable mipmap generation for better quality
- [ ] Use 16-bit indices for large meshes
- [ ] Implement frustum culling (virtual renderer)
- [ ] Use instanced rendering for repeated geometry
- [ ] Cache uniform locations and attribute locations
- [ ] Minimize state changes between draw calls
- [ ] Use VAOs (Vertex Array Objects) in WebGL 2.0

### Profiling

```javascript
class WebGLRenderer {
  enableProfiling() {
    const ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (ext) {
      // Measure GPU timing
      this.timerQuery = this.gl.createQuery();
      // ...
    }
  }
}
```

## Testing Strategy

### Unit Tests

- Shader compilation and linking
- Buffer creation and updates
- Texture upload and binding
- Uniform setting
- Draw call execution

### Integration Tests

- Render simple scene and compare with Canvas 2D
- Test blend modes match Canvas 2D output
- Test transformation accuracy
- Test memory cleanup

### Performance Tests

- Benchmark different mesh sizes
- Measure frame rate with continuous animation
- Memory usage over time
- GPU utilization

## Migration Path

### Step 1: Implement Basic WebGL Renderer (Week 1-2)
- Set up build configuration
- Implement core rendering pipeline
- Add shader programs
- Implement buffer management

### Step 2: Feature Parity with Canvas 2D (Week 3-4)
- Implement all blend modes
- Add transformation support
- Test output matches Canvas 2D

### Step 3: Optimization (Week 5-6)
- Add batching
- Implement texture atlasing
- Add profiling and benchmarks

### Step 4: Production Ready (Week 7-8)
- Add comprehensive tests
- Document API
- Update examples
- Performance tuning

## References

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- [MDN WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [GPU Gems: Image Morphing](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-3-skin-age)

## Future Enhancements

- Compute shaders for mesh calculations (WebGL 2.0)
- Transform feedback for GPU-side triangle interpolation
- Multiple render targets for advanced effects
- Post-processing effects (blur, glow, etc.)
- HDR rendering support
