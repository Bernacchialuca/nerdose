import { ITEMS_COUNT } from '../definition/schemas';

import type { Translate } from './types';

/** `streak-number` variant `score` (composed locally: `@nerdose/ui` only has `compact`). */
export function Score({ score, t }: { score: number; t: Translate }) {
  return (
    <p className="flex items-baseline-last gap-2.5 font-mono">
      <span className="text-display-score text-game-timeline">
        {score}/{ITEMS_COUNT}
      </span>
      <span className="text-mono-body text-text-lede">
        {t('result.scoreUnitTop')}
        <br />
        {t('result.scoreUnitBottom')}
      </span>
    </p>
  );
}
