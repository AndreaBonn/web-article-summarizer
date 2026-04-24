import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
  resolve: {
    alias: {
      '@utils': resolve(import.meta.dirname, 'src/utils'),
      '@pages': resolve(import.meta.dirname, 'src/pages'),
      '@shared': resolve(import.meta.dirname, 'src/shared'),
    },
  },
});
