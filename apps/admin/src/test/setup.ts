import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { requests, server } from './msw';

process.env.TZ = 'UTC';

expect.extend(axeMatchers);

// Las rutas son lazy y el árbol de proyectos corre en paralelo: 1 s de espera por defecto es frágil.
configure({ asyncUtilTimeout: 5000 });

// Los archivos con `@vitest-environment node` (config, proxy) no usan jsdom ni MSW.
const isDom = typeof window !== 'undefined';

beforeAll(() => {
  if (isDom) server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  if (!isDom) return;
  cleanup();
  server.resetHandlers();
  sessionStorage.clear();
  requests.length = 0;
});
afterAll(() => {
  if (isDom) server.close();
});
