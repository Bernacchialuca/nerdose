import type { GameId } from '@nerdose/core';

import { useToday } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import type { GameClient, GameStatsView } from '../types';

import { CardStreaks } from './card-streaks';
import { ShareButton } from './share-button';

type Props = {
  gameId: GameId;
  client: GameClient;
  result: unknown;
  number: number;
  gameStats: GameStatsView | null;
};

/** Columna lateral del resultado (slot `aside` del client): rachas y Compartir. */
export function ResultAside({ gameId, client, result, number, gameStats }: Props) {
  const { status } = useSession();
  const { data } = useToday();
  const globalStreak =
    data && status !== 'cookies_blocked' && status !== 'unavailable'
      ? data.global_streak.current
      : null;
  return (
    <>
      {gameStats ? (
        <CardStreaks gameId={gameId} gameStats={gameStats} globalStreak={globalStreak} />
      ) : null}
      <div>
        <ShareButton gameId={gameId} variant="body" getText={() => client.share(result, number)} />
      </div>
    </>
  );
}
