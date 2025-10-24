import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  resolve: {
    alias: {
      '@morpher': resolve(__dirname, '../morpher/src'),
      '@components': resolve(__dirname, './src/components'),
      '@models': resolve(__dirname, './src/models'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
  optimizeDeps: {
    include: ['lit-html'],
  },
});
