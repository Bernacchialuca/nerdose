import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'game-grep-grid',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
  },
});
