import { parseStats } from './parse';
import { StatBar } from './stat-bar';
import { categoryRates, formatPercent, gamesCount } from './stats';
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
      <ul className="flex flex-col gap-2">
        {categoryRates(stats).map((row) => (
          <li key={row.category} className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="min-w-0 font-mono text-meta text-text-muted">
                {t(`stats.categories.${row.category}`)}
              </span>
              <span className="font-mono text-meta text-text-muted">
                {t('stats.count', { correct: row.correct, played: row.played })} ·{' '}
                <b className="text-text">{formatPercent(row.rate, locale)}</b>
              </span>
            </div>
            <StatBar rate={row.rate} />
          </li>
        ))}
      </ul>
    </div>
  );
}
