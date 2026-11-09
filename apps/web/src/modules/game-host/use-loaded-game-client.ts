import { use } from 'react';

import type { GameId } from '@nerdose/core';

import { loadGameClient } from './load-game-client';
import type { GameClient } from './types';

/** Lee el client con `use()`: el llamador debe estar dentro de un `<Suspense>` (D12). */
export function useLoadedGameClient(gameId: GameId): GameClient {
  return use(loadGameClient(gameId));
}
