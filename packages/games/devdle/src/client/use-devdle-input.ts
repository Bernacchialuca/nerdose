import { useEffect, useRef } from 'react';

type Handlers = {
  enabled: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onInvalid: () => void;
};

/** Normalizes the physical keyboard into the same actions as the on-screen keys. */
export function useDevdleInput(handlers: Handlers): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  const { enabled } = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)
      ) {
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        h.onSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        h.onBackspace();
      } else if (/^[a-z]$/i.test(e.key)) {
        h.onLetter(e.key.toUpperCase());
      } else if (e.key.length === 1) {
        h.onInvalid();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled]);
}
