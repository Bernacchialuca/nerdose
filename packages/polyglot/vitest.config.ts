import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'polyglot',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Integration tests compile Go and boot the JVM, which is slow on a cold cache.
    testTimeout: 30_000,
  },
});
