import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'ui',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['test/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: false,
    css: false,
    testTimeout: 20_000,
  },
});
