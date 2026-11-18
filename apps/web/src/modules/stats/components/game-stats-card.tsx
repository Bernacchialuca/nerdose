import { Suspense, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId, Locale } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import { GAME_CATALOG } from '@/modules/catalog';
import type { GameStatsView } from '@/modules/game-host';

import { formatCount, formatWinRate } from '../format';

import { GameStatsSummary } from './game-stats-summary';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5 rounded-control bg-surface-inset p-3">
      <dt className="font-sans text-meta text-text-muted">{label}</dt>
      <dd className="font-mono text-numeric-md text-text">{value}</dd>
    </div>
  );
}

export function GameStatsCard({
  gameId,
  stats,
  locale,
}: {
  gameId: GameId;
  stats: GameStatsView | null;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const meta = GAME_CATALOG[gameId];
  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col overflow-hidden rounded-panel border border-border bg-surface"
    >
      <div aria-hidden="true" className={cn('h-1', meta.barClass)} />
      <div className="flex flex-col gap-4 p-5">
        <h3 id={titleId} className={cn('font-mono text-title-card', meta.accentClass)}>
          {t(`games.${gameId}.name`)}
        </h3>
        <p className="font-mono text-meta text-streak">
          {t('stats.games.streak', {
            current: stats?.current_streak ?? 0,
            max: stats?.max_streak ?? 0,
          })}
        </p>
        <dl className="grid grid-cols-2 gap-2.5">
          <Metric label={t('stats.games.played')} value={formatCount(stats?.played ?? 0, locale)} />
          <Metric label={t('stats.games.wins')} value={formatCount(stats?.wins ?? 0, locale)} />
          <Metric
            label={t('stats.games.winRate')}
            value={formatWinRate(stats?.win_rate ?? null, locale)}
          />
        </dl>
        {stats === null ? (
          <p className="font-mono text-meta text-text-muted">{t('stats.games.none')}</p>
        ) : (
          <Suspense
            fallback={
              <p className="font-mono text-meta text-text-muted">
                {t('stats.games.summaryLoading')}
              </p>
            }
          >
            <GameStatsSummary gameId={gameId} extra={stats.extra} locale={locale} />
          </Suspense>
        )}
      </div>
    </article>
  );
}
