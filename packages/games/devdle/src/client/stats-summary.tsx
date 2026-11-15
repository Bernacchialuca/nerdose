import { DistributionBars } from './distribution-bars';
import { parseStats } from './parse';
import { distributionRows, gamesCount } from './stats';
import type { StatsSummaryProps } from './types';

export function StatsSummary({ extra, t }: StatsSummaryProps) {
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
      <DistributionBars rows={distributionRows(stats)} t={t} />
    </div>
  );
}
