import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '@nerdose/core';
import { buttonClass } from '@nerdose/ui';

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

/**
 * Barra de salidas al pie del resultado (como en el prototipo): cuenta regresiva a la izquierda,
 * «Siguiente juego» y «Volver a los juegos» a la derecha. Envuelve en pantallas angostas.
 */
export function ResultExits({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const { data, dataUpdatedAt } = useToday();
  const next = data ? nextPendingGame(data, gameId) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-border bg-surface px-5 py-4">
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
  );
}
