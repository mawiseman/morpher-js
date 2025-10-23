import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Morpher',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'morpher.js';
        if (format === 'cjs') return 'morpher.cjs';
        if (format === 'umd') return 'morpher.umd.js';
      }
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {}
      }
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2015'
  },
  server: {
    port: 3000,
    open: true
  },
  // For development/demo page
  root: './',
  publicDir: 'examples'
});
