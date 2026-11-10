import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'workspace',
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['**/*.test.ts'],
    environment: 'node',
    // Lanzan ESLint (in-process y por CLI): el primer lint arranca en frío y,
    // con turbo corriendo todas las suites en paralelo, supera los 5 s por defecto.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
