import { beforeEach, describe, expect, it, vi } from 'vitest';

const injectAnalytics = vi.hoisted(() => vi.fn());
vi.mock('@nerdose/ui', () => ({ injectAnalytics }));

import { initAnalytics } from './analytics';

describe('initAnalytics', () => {
  beforeEach(() => injectAnalytics.mockClear());

  it('TS-5: sin dominio pasa undefined', () => {
    initAnalytics({ VITE_PLAUSIBLE_DOMAIN: undefined, VITE_PLAUSIBLE_SCRIPT_URL: undefined });
    expect(injectAnalytics).toHaveBeenCalledWith({ domain: undefined, scriptUrl: undefined });
  });

  it('TS-5: con dominio y URL los pasa', () => {
    initAnalytics({
      VITE_PLAUSIBLE_DOMAIN: 'nerdose.dev',
      VITE_PLAUSIBLE_SCRIPT_URL: 'https://plausible.nerdose.dev/js/script.js',
    });
    expect(injectAnalytics).toHaveBeenCalledWith({
      domain: 'nerdose.dev',
      scriptUrl: 'https://plausible.nerdose.dev/js/script.js',
    });
  });
});
