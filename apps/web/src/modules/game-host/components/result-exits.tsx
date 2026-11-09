import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '@nerdose/core';
import { buttonClass, linkClass } from '@nerdose/ui';

import { formatCountdown } from '@/lib/format-countdown';
import { nextPendingGame, useDayCountdown, useToday } from '@/modules/catalog';

import { gameTodayKeys } from '../api/game-today';

import { BackLink } from './back-link';

// Referencia estable: `useDayCountdown` la usa como dependencia de un efecto.
const EXTRA_KEYS = [gameTodayKeys.all];

function Countdown({ secondsToReset, syncedAt }: { secondsToReset: number; syncedAt: number }) {
  const { t } = useTranslation();
  const remaining = useDayCountdown(secondsToReset, syncedAt, EXTRA_KEYS);
  return (
    <p className="font-mono text-mono-body text-text-muted">
      {t('gameHost.result.countdown', { time: formatCountdown(remaining) })}
    </p>
  );
}

/** Fila de salidas del resultado: cuenta regresiva, «Siguiente juego», estadísticas y volver. */
export function ResultExits({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const { data, dataUpdatedAt } = useToday();
  const next = data ? nextPendingGame(data, gameId) : null;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] items-center gap-4">
      <div>
        {data ? (
          <Countdown secondsToReset={data.seconds_to_reset} syncedAt={dataUpdatedAt} />
        ) : null}
      </div>
      <div>
        {next !== null ? (
          <Link to={`/${next}`} className={buttonClass({ variant: 'secondary' })}>
            {t('gameHost.result.next')} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col items-start">
        <Link to="/stats" className={linkClass()}>
          {t('gameHost.result.stats')} <span aria-hidden="true">→</span>
        </Link>
        <BackLink />
      </div>
    </div>
  );
}
