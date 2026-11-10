import { WORDS_COUNT } from '../definition/schemas';

import type { Translate } from './types';

/** Local `card` `counter` (candidate for @nerdose/ui). Not a live region: the hint announces. */
export function CounterCard({ found, t }: { found: number; t: Translate }) {
  return (
    <p className="flex flex-col gap-0.5 rounded-inset border border-border bg-surface px-4.5 py-3 font-mono">
      <span className="text-numeric-lg text-game-grep-grid">
        {t('counter.value', { found, total: WORDS_COUNT })}
      </span>
      <span className="text-meta text-text-muted">{t('counter.label')}</span>
    </p>
  );
}
