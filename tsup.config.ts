import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/extension.ts', './src/tests/integration/**/*.ts'],
  outDir: 'out',
  external: ['vscode', 'mocha'],
  format: ['cjs'],
  splitting: false,
  sourcemap: true,
  clean: true,
});
