import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  label: 'unitTests',
  files: 'out/src/tests/integration/**/*.test.js',
  version: 'insiders',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
});
