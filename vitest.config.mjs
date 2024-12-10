/// <reference types="vitest" />

import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    maxWorkers: 1,
    minWorkers: 1,
    environment: 'node',
    include: ['**/unit/**/*.test.ts'],
    exclude: ['**/integration/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './src/tests'),
      '@@': path.resolve(__dirname, './'),
    },
  },
});
