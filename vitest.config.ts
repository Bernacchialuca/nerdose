import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'test/vitest.config.ts',
      'apps/*/vitest.config.ts',
      'packages/*/vitest.config.ts',
      'packages/games/*/vitest.config.ts',
    ],
  },
});
