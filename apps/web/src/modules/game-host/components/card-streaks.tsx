import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '@nerdose/core';
import { cn, linkClass } from '@nerdose/ui';

import type { GameStatsView } from '../types';

type Props = { gameId: GameId; gameStats: GameStatsView; globalStreak: number | null };

const streakTone = (count: number) => (count > 0 ? 'text-streak' : 'text-text-muted');

export function CardStreaks({ gameId, gameStats, globalStreak }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const game = t(`games.${gameId}.name`);
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-5"
    >
      <h2 id={headingId} className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {t('gameHost.result.streaksTitle')}
      </h2>
      <ul className="flex flex-col gap-1 font-mono text-mono-body">
        <li className={cn(streakTone(gameStats.current_streak))}>
          {t('gameHost.result.gameStreak', { game, count: gameStats.current_streak })}
        </li>
        {globalStreak !== null ? (
          <li className={cn(streakTone(globalStreak))}>
            {t('gameHost.result.globalStreak', { count: globalStreak })}
          </li>
        ) : null}
        <li className="text-text-muted">
          {t('gameHost.result.record', { game, count: gameStats.max_streak })}
        </li>
      </ul>
      <Link to="/stats" className={cn(linkClass(), 'self-start')}>
        {t('gameHost.result.stats')} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
