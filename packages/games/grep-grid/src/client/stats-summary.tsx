import { WORDS_COUNT } from '../definition/schemas';

import { parseStats } from './parse';
import { averageWords, formatAverage, formatPercent, gamesCount, perfectRate } from './stats';
import type { StatsSummaryProps } from './types';

export function StatsSummary({ extra, locale, t }: StatsSummaryProps) {
  const stats = parseStats(extra);
  if (gamesCount(stats) === 0) {
    return <p className="font-mono text-meta text-text-muted">{t('stats.none')}</p>;
  }
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h4 className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {t('stats.title')}
      </h4>
      <p className="font-mono text-meta text-text-muted">
        {t('stats.average', {
          value: formatAverage(averageWords(stats), locale),
          total: WORDS_COUNT,
        })}
      </p>
      <p className="font-mono text-meta text-text-muted">
        {t('stats.perfect', { value: formatPercent(perfectRate(stats), locale) })}
      </p>
    </div>
  );
}
