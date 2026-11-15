import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'game-bug-hunt',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    // The integration tests compile and run Go and Java; the default 5 s is not enough.
    testTimeout: 60_000,
  },
});
