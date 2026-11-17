import type { DevdleResult } from '../definition/schemas';

import { DistributionBars } from './distribution-bars';
import { parseStats } from './parse';
import { SectionPanel } from './section-panel';
import { distributionRows } from './stats';
import type { GameStatsView, Translate } from './types';

export function Distribution({
  result,
  stats,
  t,
}: {
  /** Sin resultado (partida en curso) no se resalta la barra de hoy. */
  result?: DevdleResult;
  stats: GameStatsView;
  t: Translate;
}) {
  const s = parseStats(stats.extra);
  const today = result ? (result.win ? String(result.score) : 'X') : null;

  return (
    <SectionPanel
      title={t('distribution.title')}
      datum={t('distribution.streak', { count: stats.current_streak })}
    >
      <DistributionBars rows={distributionRows(s)} highlight={today} t={t} />
      <p className="flex gap-5 font-mono text-meta text-text-muted">
        <span>
          <b className="text-text">{stats.played}</b> {t('distribution.played')}
        </span>
        <span>
          <b className="text-text">
            {stats.win_rate === null
              ? '—'
              : t('distribution.winRate', { value: Math.round(stats.win_rate * 100) })}
          </b>{' '}
          {t('distribution.wins')}
        </span>
      </p>
    </SectionPanel>
  );
}
