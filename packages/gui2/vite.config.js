import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          morpher: ['morpher-js']
        }
      }
    }
  },
  server: {
    port: 3002,
    open: true
  },
  resolve: {
    alias: {
      'morpher-js': resolve(__dirname, '../morpher/src/index.js'),
      '@': resolve(__dirname, './src')
    }
  }
});
