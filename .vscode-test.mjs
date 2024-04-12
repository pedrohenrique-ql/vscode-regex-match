import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  label: 'integrationTests',
  files: 'out/src/tests/integration/**/*.test.js',
  version: 'insiders',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
});
