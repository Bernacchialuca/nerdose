import { BUG_TYPE_LABEL, LANGUAGE_LABEL } from '../shared/labels';

import { parseStats } from './parse';
import { StatBar } from './stat-bar';
import { bugTypeRates, formatPercent, gamesCount, languageRates } from './stats';
import type { StatsSummaryProps } from './types';

export function StatsSummary({ extra, locale, t }: StatsSummaryProps) {
  const stats = parseStats(extra);
  if (gamesCount(stats) === 0) {
    return <p className="font-mono text-meta text-text-muted">{t('stats.none')}</p>;
  }
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <h4 className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {t('stats.byLanguage')}
        </h4>
        <ul className="flex flex-col gap-2">
          {languageRates(stats).map((row) => (
            <li key={row.language} className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 font-mono text-meta text-text-muted">
                  {LANGUAGE_LABEL[row.language]}
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
      <div className="flex min-w-0 flex-col gap-3">
        <h4 className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {t('stats.byBugType')}
        </h4>
        <ul className="flex flex-col gap-2">
          {bugTypeRates(stats).map((row) => (
            <li key={row.bugType} className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 font-mono text-meta text-text-muted">
                  {BUG_TYPE_LABEL[row.bugType][locale]}
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
    </div>
  );
}
