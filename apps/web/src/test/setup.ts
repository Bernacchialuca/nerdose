import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

import { server } from './msw';

expect.extend(axeMatchers);

// La primera pantalla de juego carga el client con `import()`: en frío tarda más que el default (1 s).
configure({ asyncUtilTimeout: 5000 });

// Los tests con `@vitest-environment node` (proxy, index.html) no tienen DOM ni i18n.
const hasDom = typeof window !== 'undefined';
const originalMatchMedia = hasDom ? window.matchMedia : undefined;

beforeAll(() => {
  if (hasDom) server.listen({ onUnhandledFrame: 'error' });
});
afterEach(async () => {
  if (!hasDom) return;
  const { default: i18n } = await import('@/i18n');
  cleanup();
  server.resetHandlers();
  await i18n.changeLanguage('es');
  document.documentElement.lang = 'es';
  document.title = '';
  window.matchMedia = originalMatchMedia as typeof window.matchMedia;
});
afterAll(() => {
  if (hasDom) server.close();
});
