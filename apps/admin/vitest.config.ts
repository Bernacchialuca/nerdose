import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'admin',
      root: fileURLToPath(new URL('.', import.meta.url)),
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost:5174' } },
      setupFiles: ['./src/test/setup.ts'],
      globals: false,
      css: false,
      include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.ts'],
      testTimeout: 20_000,
      hookTimeout: 30_000,
    },
  }),
);
