import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const URL = 'https://plausible.nerdose.dev/js/script.js';

type Mod = typeof import('./analytics');
let mod: Mod;

beforeEach(async () => {
  vi.resetModules();
  mod = await import('./analytics');
});

afterEach(() => {
  document.head.innerHTML = '';
  delete window.plausible;
});

describe('analytics', () => {
  it('track is a no-op before injecting (TS-27)', () => {
    const spy = vi.fn();
    window.plausible = spy;
    expect(() => mod.track('share:devdle')).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not inject without domain (TS-28)', () => {
    mod.injectAnalytics({ domain: '', scriptUrl: URL });
    mod.injectAnalytics({ domain: undefined, scriptUrl: URL });
    expect(document.head.querySelectorAll('script[data-domain]')).toHaveLength(0);
    expect(window.plausible).toBeUndefined();
    expect(() => mod.track('share:devdle')).not.toThrow();
  });

  it('does not inject without scriptUrl', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: undefined });
    expect(document.head.querySelectorAll('script')).toHaveLength(0);
  });

  it('injects the script with domain (TS-29)', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    const scripts = document.head.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.getAttribute('src')).toBe(URL);
    expect(scripts[0]!.defer).toBe(true);
    expect(scripts[0]!.getAttribute('data-domain')).toBe('nerdose.dev');
    expect(typeof window.plausible).toBe('function');
  });

  it('is idempotent (TS-30)', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    expect(document.head.querySelectorAll('script[data-domain]')).toHaveLength(1);
  });

  it('sends the event without properties (TS-31)', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    const spy = vi.fn();
    window.plausible = spy;
    mod.track('share:devdle');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('share:devdle');
    expect(spy.mock.calls[0]).toHaveLength(1);
  });

  it('queues before the script loads (TS-32)', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    mod.track('share:devdle');
    expect(window.plausible?.q).toHaveLength(1);
    expect((window.plausible?.q?.[0] as unknown[])[0]).toBe('share:devdle');
  });

  it('swallows errors (TS-33)', () => {
    mod.injectAnalytics({ domain: 'nerdose.dev', scriptUrl: URL });
    window.plausible = () => {
      throw new Error('blocked');
    };
    expect(() => mod.track('share:devdle')).not.toThrow();
  });

  it('types the event by game (TS-34)', () => {
    const typeOnly = () => {
      // @ts-expect-error juego inexistente
      mod.track('share:pacman');
      // @ts-expect-error evento no permitido
      mod.track('pageview');
    };
    expect(typeof typeOnly).toBe('function');
  });
});
