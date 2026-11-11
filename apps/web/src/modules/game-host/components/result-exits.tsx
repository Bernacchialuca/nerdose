import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '@nerdose/core';
import { buttonClass, cn, linkClass } from '@nerdose/ui';

import { formatCountdown } from '@/lib/format-countdown';
import { nextPendingGame, useDayCountdown, useToday } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import { gameTodayKeys } from '../api/game-today';
import type { GameStatsView } from '../types';

import { BackLink } from './back-link';

// Referencia estable: `useDayCountdown` la usa como dependencia de un efecto.
const EXTRA_KEYS = [gameTodayKeys.all];

const streakTone = (count: number) => (count > 0 ? 'text-streak' : 'text-text-muted');

function Countdown({ secondsToReset, syncedAt }: { secondsToReset: number; syncedAt: number }) {
  const { t } = useTranslation();
  const remaining = useDayCountdown(secondsToReset, syncedAt, EXTRA_KEYS);
  return (
    // Rótulo apagado y hora brillante, como el contador de la home del prototipo. No va en verde:
    // en esta UI el verde marca lo que se puede tocar.
    <p className="font-mono text-mono-body text-text-muted">
      {t('gameHost.result.countdown')}{' '}
      <span className="text-text">{formatCountdown(remaining)}</span>
    </p>
  );
}

/** Rachas en una línea compacta (juego, global, récord) y el link a estadísticas. */
function Streaks({ gameId, gameStats }: { gameId: GameId; gameStats: GameStatsView }) {
  const { t } = useTranslation();
  const headingId = useId();
  const { status } = useSession();
  const { data } = useToday();
  const globalStreak =
    data && status !== 'cookies_blocked' && status !== 'unavailable'
      ? data.global_streak.current
      : null;
  const game = t(`games.${gameId}.name`);
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2"
    >
      <h2 id={headingId} className="sr-only">
        {t('gameHost.result.streaksTitle')}
      </h2>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-mono-body">
        <li className={cn(streakTone(gameStats.current_streak))}>
          {t('gameHost.result.gameStreak', { game, count: gameStats.current_streak })}
        </li>
        {globalStreak !== null ? (
          <li className={cn(streakTone(globalStreak))}>
            {t('gameHost.result.globalStreak', { count: globalStreak })}
          </li>
        ) : null}
        <li className="text-text-muted">
          {t('gameHost.result.record', { count: gameStats.max_streak })}
        </li>
      </ul>
      <Link to="/stats" className={linkClass()}>
        {t('gameHost.result.stats')} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

/**
 * Card de cierre del resultado: rachas en una línea (si hay `gameStats`) y, debajo, la cuenta
 * regresiva con «Siguiente juego» y «Volver a los juegos». Va debajo del tablero para que la racha
 * quede a la vista sin scroll. Envuelve en pantallas angostas.
 */
export function ResultExits({
  gameId,
  gameStats = null,
}: {
  gameId: GameId;
  gameStats?: GameStatsView | null;
}) {
  const { t } = useTranslation();
  const { data, dataUpdatedAt } = useToday();
  const next = data ? nextPendingGame(data, gameId) : null;

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface px-5 py-3.5">
      {gameStats ? <Streaks gameId={gameId} gameStats={gameStats} /> : null}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4',
          gameStats && 'border-t border-border pt-3',
        )}
      >
        {data ? (
          <Countdown secondsToReset={data.seconds_to_reset} syncedAt={dataUpdatedAt} />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-5">
          {next !== null ? (
            <Link to={`/${next}`} className={buttonClass({ variant: 'secondary' })}>
              {t('gameHost.result.next')} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          <BackLink />
        </div>
      </div>
    </div>
  );
}
