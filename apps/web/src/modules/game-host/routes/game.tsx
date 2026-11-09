import { useParams } from 'react-router';

import { isGameId } from '@nerdose/core';

import { NotFound } from '@/components/not-found';
import type { ShellHandle } from '@/lib/route-handle';

import { GameHostHeader } from '../components/game-host-header';
import { GameRoute } from '../components/game-route';

export function Component() {
  const { game_id } = useParams();
  if (!isGameId(game_id)) return <NotFound />;
  // `key` reinicia el estado efímero al pasar de un juego a otro («Siguiente juego»).
  return <GameRoute gameId={game_id} key={game_id} />;
}

export const handle: ShellHandle = {
  header: (params) =>
    isGameId(params.game_id) ? <GameHostHeader gameId={params.game_id} /> : null,
};
