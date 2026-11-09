import type { GameId } from '@nerdose/core';

import { useToday } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import type { GameStatsView } from '../types';

import { CardStreaks } from './card-streaks';

type Props = { gameId: GameId; gameStats: GameStatsView | null };

/**
 * Columna lateral del resultado (slot `aside` del client): rachas. «Compartir» vive solo en el
 * header del juego, como en el prototipo: un único botón, en el mismo lugar en todos los juegos.
 */
export function ResultAside({ gameId, gameStats }: Props) {
  const { status } = useSession();
  const { data } = useToday();
  const globalStreak =
    data && status !== 'cookies_blocked' && status !== 'unavailable'
      ? data.global_streak.current
      : null;
  return gameStats ? (
    <CardStreaks gameId={gameId} gameStats={gameStats} globalStreak={globalStreak} />
  ) : null;
}
