import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'db',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['test/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    globalSetup: ['./test/global-setup.ts'],
    hookTimeout: 120_000,
    // Los tests migran y consultan Postgres real; en paralelo con el resto de la suite superan los 5 s por defecto.
    testTimeout: 60_000,
  },
});
