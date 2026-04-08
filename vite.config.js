import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Pages opened dynamically via chrome.tabs.create()
      // that are not declared in manifest.json
      input: {
        'reading-mode': resolve(import.meta.dirname, 'reading-mode.html'),
        'history': resolve(import.meta.dirname, 'history.html'),
        'multi-analysis': resolve(import.meta.dirname, 'multi-analysis.html'),
        'pdf-analysis': resolve(import.meta.dirname, 'pdf-analysis.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, '.'),
      '@utils': resolve(import.meta.dirname, 'utils'),
      '@src': resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
