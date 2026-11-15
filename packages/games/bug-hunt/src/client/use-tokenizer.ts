import { useEffect, useState } from 'react';

import { loadTokenizer, type Tokenizer } from './highlight';

/** Returns the Shiki tokenizer once loaded; stays `null` while loading, when disabled or if it fails (silent: expected). */
export function useTokenizer(enabled: boolean): Tokenizer | null {
  const [tokenizer, setTokenizer] = useState<Tokenizer | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadTokenizer()
      .then((tk) => {
        if (alive) setTokenizer(() => tk);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return enabled ? tokenizer : null;
}
