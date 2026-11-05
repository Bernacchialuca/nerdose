import { DESKTOP_MEDIA_QUERY } from '@/lib/breakpoints';

type Viewport = 'mobile' | 'desktop';

export function mockViewport(viewport: Viewport) {
  let matches = viewport === 'desktop';
  const listeners = new Set<() => void>();

  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === DESKTOP_MEDIA_QUERY && matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    setViewport(next: Viewport) {
      matches = next === 'desktop';
      listeners.forEach((cb) => {
        cb();
      });
    },
  };
}
