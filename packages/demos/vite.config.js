import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Get all HTML files in src/demos for multi-page build
const demosDir = resolve(__dirname, 'src/demos');
let demoEntries = {};

try {
  const demoFiles = readdirSync(demosDir).filter(file => file.endsWith('.html'));
  demoFiles.forEach(file => {
    const name = file.replace('.html', '');
    demoEntries[`demos/${name}`] = resolve(demosDir, file);
  });
} catch (e) {
  console.warn('Demos directory not found yet, skipping demo entries');
}

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...demoEntries
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      'morpher-js': resolve(__dirname, '../morpher/src/index.js')
    }
  }
});
